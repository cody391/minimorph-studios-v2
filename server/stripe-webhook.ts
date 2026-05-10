import express, { Request, Response, Express } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import * as db from "./db";
import { getDb } from "./db";
import { orders, users, contracts, leads, commissions, customers, onboardingProjects, nurtureLogs, reps } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendWelcomeEmail, sendPaymentFailedEmail } from "./services/customerEmails";
import { TIER_CONFIG, type TierKey } from "../shared/accountability";
import { repTiers } from "../drizzle/schema";
import { PACKAGES, type PackageKey } from "../shared/pricing";

function getStripe(): Stripe | null {
  const key = ENV.stripeSecretKey;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

export function registerStripeWebhook(app: Express) {
  // CRITICAL: raw body parser MUST be registered BEFORE express.json()
  // This route is registered before the global json parser in index.ts
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) {
        console.error("[Stripe Webhook] Stripe not configured");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = ENV.stripeWebhookSecret;

      if (!webhookSecret) {
        console.error("[Stripe Webhook] Webhook secret not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutCompleted(session);
            break;
          }
          case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
            break;
          }
          case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
            await handlePaymentFailed(paymentIntent);
            break;
          }
          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            await handleInvoicePaid(invoice);
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            await handleInvoicePaymentFailed(invoice);
            break;
          }
          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(subscription);
            break;
          }
          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription);
            break;
          }
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
      }

      res.json({ received: true });
    }
  );

  // Connect webhook — events from rep Express accounts (account.updated, payout.paid, etc.)
  app.post(
    "/api/stripe/connect-webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = ENV.stripeConnectWebhookSecret;
      if (!webhookSecret) return res.status(500).json({ error: "Connect webhook secret not configured" });

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Connect Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      console.log(`[Stripe Connect Webhook] ${event.type} (${event.id})`);

      try {
        if (event.type === "account.updated") {
          const account = event.data.object as Stripe.Account;
          const database = await getDb();
          if (database && account.details_submitted) {
            await database
              .update(reps)
              .set({ stripeConnectOnboarded: true })
              .where(eq(reps.stripeConnectAccountId, account.id));
            console.log(`[Stripe Connect] Rep onboarding complete for account ${account.id}`);
          }
        }
      } catch (err) {
        console.error(`[Stripe Connect Webhook] Error processing ${event.type}:`, err);
      }

      res.json({ received: true });
    }
  );
}

/* ═══════════════════════════════════════════════════════
   CHECKOUT.SESSION.COMPLETED
   First payment — creates customer, contract, onboarding
   ═══════════════════════════════════════════════════════ */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const database = await getDb();
  if (!database) {
    console.error("[Stripe] Database not available for checkout completion");
    return;
  }

  const userId = session.metadata?.user_id
    ? parseInt(session.metadata.user_id)
    : null;

  // ── 1. Update the order status ──────────────────────────────────────
  let orderRow: typeof orders.$inferSelect | undefined;
  if (session.id) {
    await database
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId: session.payment_intent as string,
      })
      .where(eq(orders.stripeCheckoutSessionId, session.id));

    // Fetch the order for metadata we'll need later
    const orderRows = await database
      .select()
      .from(orders)
      .where(eq(orders.stripeCheckoutSessionId, session.id))
      .limit(1);
    orderRow = orderRows[0];
  }

  // ── 2. Save Stripe customer ID on the user ─────────────────────────
  if (userId && session.customer) {
    await database
      .update(users)
      .set({ stripeCustomerId: session.customer as string })
      .where(eq(users.id, userId));
  }

  console.log(
    `[Stripe] Checkout completed: session=${session.id}, user=${userId}, amount=${session.amount_total}`
  );

  // ── 3. Derive metadata for customer/contract/onboarding ────────────
  const customerEmail = session.customer_email || session.metadata?.customer_email || orderRow?.customerEmail;
  const customerName = session.metadata?.customer_name || orderRow?.customerName || "Customer";
  const businessName = session.metadata?.business_name || orderRow?.businessName || customerName;
  const packageTier = (session.metadata?.package_tier || orderRow?.packageTier || "starter") as PackageKey;
  const monthlyPrice = PACKAGES[packageTier].monthlyPrice;

  // ── 4. Create customer record (idempotent) ─────────────────────────
  let customerId: number | null = null;

  if (userId) {
    const existingCustomers = await database
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      console.log(`[Stripe] Customer already exists for user ${userId}: customer=${customerId}`);
    } else {
      const newCustomer = await db.createCustomer({
        userId,
        businessName,
        contactName: customerName,
        email: customerEmail || "",
        phone: session.metadata?.phone || undefined,
        status: "active",
      });
      customerId = newCustomer.id;
      console.log(`[Stripe] Customer created: customer=${customerId}, user=${userId}`);
    }
  }

  // ── 5. Create contract (idempotent — one per checkout session) ─────
  let contractId: number | null = null;

  // Rep-closed sessions carry an existing contract created by closeDeal.
  // Step 9 activates it — creating a second generic repId=0 contract here would
  // produce a duplicate. Skip generic creation for any rep-closed session.
  const isRepClosedSession =
    session.metadata?.rep_closed === "true" && !!session.metadata?.contract_id;

  if (isRepClosedSession) {
    contractId = parseInt(session.metadata!.contract_id!);
    if (isNaN(contractId)) contractId = null;
    console.log(
      `[Stripe] Rep-closed session — skipping generic contract creation, ` +
      `existing contract=${contractId} will be activated in step 9`
    );
  } else if (customerId && session.id) {
    const existingContracts = await database
      .select()
      .from(contracts)
      .where(eq(contracts.customerId, customerId))
      .orderBy(desc(contracts.createdAt))
      .limit(1);

    // Only skip if the most recent contract was created in the last 60 seconds
    // (protects against duplicate webhook delivery)
    const recentContract = existingContracts[0];
    const sixtySecondsAgo = new Date(Date.now() - 60_000);
    if (recentContract && recentContract.createdAt >= sixtySecondsAgo) {
      contractId = recentContract.id;
      console.log(`[Stripe] Contract already exists for customer ${customerId}: contract=${contractId}`);
    } else {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Get the Stripe subscription ID from the session
      const stripeSubscriptionId = session.subscription as string | undefined;

      const newContract = await db.createContract({
        customerId,
        repId: 0, // Self-service checkout — no rep assigned
        packageTier,
        monthlyPrice: monthlyPrice.toFixed(2),
        startDate,
        endDate,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
        notes: "Self-service checkout via Stripe",
      });
      contractId = newContract.id;
      console.log(`[Stripe] Contract created: contract=${contractId}, customer=${customerId}, package=${packageTier}, sub=${stripeSubscriptionId}`);
    }
  }

  // ── 6. Create or update onboarding project (idempotent) ──────────────
  if (customerId) {
    // For self-service: the project already exists (created during email capture)
    // Find it by project_id in metadata and update with the new customerId/contractId
    const metaProjectId = session.metadata?.project_id ? parseInt(session.metadata.project_id) : NaN;
    if (!isNaN(metaProjectId)) {
      const existingById = await db.getOnboardingProjectById(metaProjectId);
      if (existingById && !existingById.customerId) {
        // Self-service project — link it to the newly created customer/contract
        await db.updateOnboardingProject(metaProjectId, {
          customerId,
          contractId: contractId || undefined,
          stage: "questionnaire",
        });
        console.log(`[Stripe] Self-service project ${metaProjectId} linked to customer ${customerId}`);
      }
    } else {
      // Rep-closed flow: create onboarding project if not already linked to customer
      const existingProject = await db.getOnboardingProjectByCustomerId(customerId);
      if (existingProject) {
        console.log(`[Stripe] Onboarding project already exists for customer ${customerId}: project=${existingProject.id}`);
      } else {
        const newProject = await db.createOnboardingProject({
          customerId,
          orderId: orderRow?.id || undefined,
          contractId: contractId || undefined,
          businessName,
          contactName: customerName,
          contactEmail: customerEmail || "",
          contactPhone: session.metadata?.phone || undefined,
          packageTier,
          stage: "questionnaire",
        });
        console.log(`[Stripe] Onboarding project created: project=${newProject.id}, customer=${customerId}`);
      }
    }
  }

  // ── 7. Send welcome email (with credentials if available) ─────────
  try {
    if (customerEmail) {
      const tempPw = session.metadata?.temp_password || undefined;
      const origin = ENV.appUrl || "https://www.minimorphstudios.net";
      await sendWelcomeEmail({
        to: customerEmail,
        customerName,
        packageTier,
        businessName: businessName || undefined,
        tempPassword: tempPw,
        portalUrl: `${origin}/portal`,
      });
      // Log recipient and whether credentials were included — never log the password itself
      console.log(`[Stripe] Welcome email queued — recipient=${customerEmail}, credentials=${tempPw ? "included" : "omitted"}`);
    }
  } catch (emailErr) {
    console.error("[Stripe] Failed to send welcome email:", emailErr);
  }

  // ── 8. Auto-create initial commission for the rep (if applicable) ──
  await createInitialCommission(session);

  // ── 9. Activate rep-closed contracts upon payment confirmation ──────
  if (session.metadata?.rep_closed === "true" && session.metadata?.contract_id) {
    const repContractId = parseInt(session.metadata.contract_id);
    if (!isNaN(repContractId)) {
      try {
        // Activate the contract (was pending_payment)
        await database
          .update(contracts)
          .set({ status: "active", stripeSubscriptionId: (session.subscription as string) || undefined })
          .where(eq(contracts.id, repContractId));
        console.log(`[Stripe] Rep-closed contract ${repContractId} activated after payment`);

        // Approve all pending commissions for this contract
        const pendingCommissions = await database
          .select()
          .from(commissions)
          .where(eq(commissions.contractId, repContractId));
        for (const comm of pendingCommissions) {
          if (comm.status === "pending") {
            await database
              .update(commissions)
              .set({ status: "approved" })
              .where(eq(commissions.id, comm.id));
            // Notify the rep
            await db.createRepNotification({
              repId: comm.repId,
              type: "commission_approved",
              title: "Commission Approved — Payment Confirmed!",
              message: `Payment received for contract #${repContractId}. Your $${parseFloat(comm.amount).toFixed(2)} commission is now approved.`,
              metadata: { commissionId: comm.id, contractId: repContractId, amount: comm.amount },
            });
            console.log(`[Stripe] Commission ${comm.id} approved after payment for contract ${repContractId}`);
          }
        }
      } catch (err) {
        console.error(`[Stripe] Failed to activate rep-closed contract ${repContractId}:`, err);
      }
    }
  }

  // ── 10. Trigger site generation for projects with Elena data ──────────
  // When the payment-last flow is used, the onboarding project already
  // has questionnaire data from Elena. Start generation immediately.
  if (session.metadata?.project_id) {
    const projectId = parseInt(session.metadata.project_id);
    if (!isNaN(projectId)) {
      try {
        const project = await db.getOnboardingProjectById(projectId);
        const q = project?.questionnaire as Record<string, unknown> | null;
        if (project && q && q.businessName && q.businessType && project.generationStatus !== "generating" && project.generationStatus !== "complete") {
          // Mark as queued and fire generation
          await db.updateOnboardingProject(projectId, {
            stage: "assets_upload",
            generationStatus: "generating",
            generationLog: "Payment confirmed — building your site...",
          });
          // Fire-and-forget generation
          const { generateSiteForProject } = await import("./services/siteGenerator");
          generateSiteForProject(projectId).catch(err =>
            console.error(`[Stripe] Generation failed for project ${projectId}:`, err)
          );
          console.log(`[Stripe] Site generation queued for project ${projectId} after payment`);
        }
      } catch (genErr) {
        console.error(`[Stripe] Failed to trigger generation for project ${projectId}:`, genErr);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════
   TEST BYPASS — simulate a completed checkout without Stripe
   ═══════════════════════════════════════════════════════ */
export async function simulateCheckoutCompleted({
  projectId,
  userId,
  packageTier,
}: {
  projectId: number;
  userId: number;
  packageTier: string;
}) {
  const database = await getDb();
  if (!database) {
    console.error("[Bypass] Database not available");
    return;
  }

  const project = await db.getOnboardingProjectById(projectId);
  if (!project) {
    console.error("[Bypass] Project not found:", projectId);
    return;
  }

  const q = (project.questionnaire || {}) as Record<string, unknown>;
  const customerEmail = project.contactEmail || (q.email as string) || "";
  const customerName = project.contactName || (q.contactName as string) || "Customer";
  const businessName = project.businessName !== "Pending"
    ? project.businessName || (q.businessName as string) || customerName
    : (q.businessName as string) || customerName;
  const tier = (packageTier || "starter") as PackageKey;
  const monthlyPrice = PACKAGES[tier]?.monthlyPrice ?? 195;

  // Create customer (idempotent)
  let customerId: number | null = null;
  const existingCustomers = await database
    .select()
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);

  if (existingCustomers.length > 0) {
    customerId = existingCustomers[0].id;
  } else {
    const newCustomer = await db.createCustomer({
      userId,
      businessName,
      contactName: customerName,
      email: customerEmail,
      status: "active",
    });
    customerId = newCustomer.id;
  }
  console.log(`[Bypass] Customer: ${customerId}`);

  // Create contract (idempotent)
  let contractId: number | null = null;
  const existingContracts = await database
    .select()
    .from(contracts)
    .where(eq(contracts.customerId, customerId))
    .orderBy(desc(contracts.createdAt))
    .limit(1);

  const sixtySecondsAgo = new Date(Date.now() - 60_000);
  const recentContract = existingContracts[0];
  if (recentContract && recentContract.createdAt >= sixtySecondsAgo) {
    contractId = recentContract.id;
  } else {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    const newContract = await db.createContract({
      customerId,
      repId: 0,
      packageTier: tier,
      monthlyPrice: monthlyPrice.toFixed(2),
      startDate,
      endDate,
      notes: "Test bypass checkout",
    });
    contractId = newContract.id;
  }
  console.log(`[Bypass] Contract: ${contractId}`);

  // Link onboarding project
  if (!project.customerId) {
    await db.updateOnboardingProject(projectId, {
      customerId,
      contractId: contractId || undefined,
      stage: "questionnaire",
    });
  }

  // Welcome email
  try {
    if (customerEmail) {
      await sendWelcomeEmail({ to: customerEmail, customerName, packageTier: tier, businessName });
    }
  } catch (e) {
    console.error("[Bypass] Welcome email failed:", e);
  }

  // Trigger site generation if Elena has filled in the data
  if (q.businessName && q.businessType && project.generationStatus !== "generating" && project.generationStatus !== "complete") {
    await db.updateOnboardingProject(projectId, {
      stage: "assets_upload",
      generationStatus: "generating",
      generationLog: "Bypass payment confirmed — building your site...",
    });
    const { generateSiteForProject } = await import("./services/siteGenerator");
    generateSiteForProject(projectId).catch(err =>
      console.error(`[Bypass] Generation failed for project ${projectId}:`, err)
    );
    console.log(`[Bypass] Site generation queued for project ${projectId}`);
  }
}

/* ═══════════════════════════════════════════════════════
   INVOICE.PAID
   Fires on every successful subscription payment (including first).
   We skip the first invoice (handled by checkout.session.completed)
   and create recurring commissions for subsequent invoices.
   ═══════════════════════════════════════════════════════ */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const database = await getDb();
  if (!database) return;

  // Stripe v22 basil: subscription is at invoice.parent.subscription_details.subscription
  const subDetail = invoice.parent?.subscription_details;
  const subscriptionId = typeof subDetail?.subscription === "string"
    ? subDetail.subscription
    : (subDetail?.subscription as any)?.id ?? null;

  if (!subscriptionId) {
    console.log(`[Stripe] invoice.paid has no subscription — skipping (one-time payment)`);
    return;
  }

  // Skip the first invoice — that's handled by checkout.session.completed
  if (invoice.billing_reason === "subscription_create") {
    console.log(`[Stripe] invoice.paid for initial subscription — skipping (handled by checkout)`);
    return;
  }

  console.log(`[Stripe] invoice.paid: subscription=${subscriptionId}, amount=${invoice.amount_paid}, reason=${invoice.billing_reason}`);

  // Find the contract linked to this subscription
  const contractRows = await database
    .select()
    .from(contracts)
    .where(eq(contracts.stripeSubscriptionId, subscriptionId))
    .limit(1);

  const contract = contractRows[0];
  if (!contract) {
    console.log(`[Stripe] invoice.paid: no contract found for subscription ${subscriptionId}`);
    return;
  }

  // ── 1. Create a new order record for this recurring payment ────────
  // Idempotency: use invoice.id stored in orders.metadata to prevent duplicates
  const invoiceId = invoice.id;
  if (invoiceId) {
    const existingOrders = await database
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, invoiceId))
      .limit(1);

    if (existingOrders.length > 0) {
      console.log(`[Stripe] invoice.paid: order already exists for invoice ${invoiceId}`);
    } else {
      // Find the userId from the customer record
      const customerRow = await database
        .select()
        .from(customers)
        .where(eq(customers.id, contract.customerId))
        .limit(1);

      if (customerRow[0]?.userId) {
        const newOrder = await db.createOrder({
          userId: customerRow[0].userId,
          packageTier: contract.packageTier,
          amount: invoice.amount_paid || 0,
          customerEmail: customerRow[0].email || undefined,
          customerName: customerRow[0].contactName || undefined,
          businessName: customerRow[0].businessName || undefined,
        });
        // Mark as paid and store invoice ID for idempotency
        await database.update(orders).set({
          status: "paid" as const,
          stripePaymentIntentId: invoiceId,
        }).where(eq(orders.id, newOrder.id));
        console.log(`[Stripe] invoice.paid: recurring order created for contract ${contract.id}`);
      }
    }
  }

  // ── 2. Create recurring commission for the rep ─────────────────────
  if (contract.repId && contract.repId > 0) {
    await createRecurringCommissionForContract(contract);
  }

  // ── 3. Keep contract status active ─────────────────────────────────
  if (contract.status === "expiring_soon") {
    await db.updateContract(contract.id, { status: "active" });
    console.log(`[Stripe] invoice.paid: contract ${contract.id} status restored to active`);
  }
}

/* ═══════════════════════════════════════════════════════
   INVOICE.PAYMENT_FAILED
   Fires when a subscription payment attempt fails.
   Flags the customer, creates a nurture log, sends email.
   ═══════════════════════════════════════════════════════ */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const database = await getDb();
  if (!database) return;

  // Stripe v22 basil: subscription is at invoice.parent.subscription_details.subscription
  const subDetail = invoice.parent?.subscription_details;
  const subscriptionId = typeof subDetail?.subscription === "string"
    ? subDetail.subscription
    : (subDetail?.subscription as any)?.id ?? null;

  if (!subscriptionId) return;

  console.log(`[Stripe] invoice.payment_failed: subscription=${subscriptionId}, attempt=${invoice.attempt_count}`);

  // Find the contract
  const contractRows = await database
    .select()
    .from(contracts)
    .where(eq(contracts.stripeSubscriptionId, subscriptionId))
    .limit(1);

  const contract = contractRows[0];
  if (!contract) {
    console.log(`[Stripe] invoice.payment_failed: no contract found for subscription ${subscriptionId}`);
    return;
  }

  // ── 1. Flag customer as at_risk if multiple failures ───────────────
  if ((invoice.attempt_count || 0) >= 2) {
    await db.updateCustomer(contract.customerId, { status: "at_risk" });
    console.log(`[Stripe] invoice.payment_failed: customer ${contract.customerId} flagged as at_risk`);
  }

  // ── 2. Create nurture log for tracking ─────────────────────────────
  try {
    await db.createNurtureLog({
      customerId: contract.customerId,
      contractId: contract.id,
      type: "support_request",
      channel: "email",
      subject: `Payment failed — attempt #${invoice.attempt_count || 1}`,
      content: `Stripe invoice ${invoice.id} payment failed. Amount: $${((invoice.amount_due || 0) / 100).toFixed(2)}. Attempt #${invoice.attempt_count || 1}.`,
      status: "sent",
      sentAt: new Date(),
    });
  } catch (err) {
    console.error("[Stripe] Failed to create nurture log for payment failure:", err);
  }

  // ── 3. Send payment failed email to customer ───────────────────────
  try {
    const customerRow = await database
      .select()
      .from(customers)
      .where(eq(customers.id, contract.customerId))
      .limit(1);

    if (customerRow[0]?.email) {
      await sendPaymentFailedEmail({
        to: customerRow[0].email,
        customerName: customerRow[0].contactName || "Customer",
        packageTier: contract.packageTier as PackageKey,
        attemptCount: invoice.attempt_count || 1,
      });
      console.log(`[Stripe] Payment failed email sent to ${customerRow[0].email}`);
    }
  } catch (emailErr) {
    console.error("[Stripe] Failed to send payment failed email:", emailErr);
  }
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER.SUBSCRIPTION.UPDATED
   Fires when plan changes, pauses, or status transitions.
   Syncs contract package tier and status.
   ═══════════════════════════════════════════════════════ */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const database = await getDb();
  if (!database) return;

  const subscriptionId = subscription.id;
  console.log(`[Stripe] subscription.updated: id=${subscriptionId}, status=${subscription.status}`);

  // Find the contract
  const contractRows = await database
    .select()
    .from(contracts)
    .where(eq(contracts.stripeSubscriptionId, subscriptionId))
    .limit(1);

  const contract = contractRows[0];
  if (!contract) {
    console.log(`[Stripe] subscription.updated: no contract found for subscription ${subscriptionId}`);
    return;
  }

  // ── 1. Sync subscription status → contract status ──────────────────
  const updates: Partial<typeof contracts.$inferInsert> = {};

  switch (subscription.status) {
    case "active":
      // Only update if contract was in a degraded state
      if (contract.status === "expiring_soon" || contract.status === "cancelled") {
        updates.status = "active";
      }
      break;
    case "past_due":
      // Payment is overdue but subscription hasn't been cancelled yet
      // Don't change contract status — invoice.payment_failed handles the customer flag
      break;
    case "canceled":
      // Handled by customer.subscription.deleted
      break;
    case "unpaid":
      updates.status = "expired";
      break;
  }

  // ── 2. Detect plan changes via subscription metadata ───────────────
  const newPackageTier = subscription.metadata?.package_tier as PackageKey | undefined;
  if (newPackageTier && newPackageTier !== contract.packageTier && PACKAGES[newPackageTier]) {
    updates.packageTier = newPackageTier;
    updates.monthlyPrice = PACKAGES[newPackageTier].monthlyPrice.toFixed(2);
    console.log(`[Stripe] subscription.updated: plan changed from ${contract.packageTier} to ${newPackageTier}`);
  }

  // ── 3. Sync period end date ────────────────────────────────────────
  // Stripe v22 basil: current_period_end moved to subscription items
  const periodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (periodEnd) {
    const newEndDate = new Date(periodEnd * 1000);
    // Only update if the end date changed significantly (more than 1 day difference)
    const currentEnd = contract.endDate.getTime();
    const newEnd = newEndDate.getTime();
    if (Math.abs(currentEnd - newEnd) > 86_400_000) {
      updates.endDate = newEndDate;
    }
  }

  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    await db.updateContract(contract.id, updates);
    console.log(`[Stripe] subscription.updated: contract ${contract.id} updated:`, Object.keys(updates));
  }
}

/* ═══════════════════════════════════════════════════════
   CUSTOMER.SUBSCRIPTION.DELETED
   Fires when subscription is fully cancelled.
   Marks contract cancelled, updates customer, cancels pending commissions.
   ═══════════════════════════════════════════════════════ */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const database = await getDb();
  if (!database) return;

  const subscriptionId = subscription.id;
  console.log(`[Stripe] subscription.deleted: id=${subscriptionId}`);

  // Find the contract
  const contractRows = await database
    .select()
    .from(contracts)
    .where(eq(contracts.stripeSubscriptionId, subscriptionId))
    .limit(1);

  const contract = contractRows[0];
  if (!contract) {
    console.log(`[Stripe] subscription.deleted: no contract found for subscription ${subscriptionId}`);
    return;
  }

  // ── 1. Mark contract as cancelled ──────────────────────────────────
  await db.updateContract(contract.id, { status: "cancelled" });
  console.log(`[Stripe] subscription.deleted: contract ${contract.id} marked as cancelled`);

  // ── 2. Update customer status to churned ───────────────────────────
  // Only if they have no other active contracts
  const otherActiveContracts = await database
    .select()
    .from(contracts)
    .where(and(
      eq(contracts.customerId, contract.customerId),
      eq(contracts.status, "active"),
    ))
    .limit(1);

  if (otherActiveContracts.length === 0) {
    await db.updateCustomer(contract.customerId, { status: "churned" });
    console.log(`[Stripe] subscription.deleted: customer ${contract.customerId} marked as churned`);
  }

  // ── 3. Cancel pending/approved commissions for this contract ───────
  await db.cancelCommissionsByContract(contract.id);
  console.log(`[Stripe] subscription.deleted: pending commissions cancelled for contract ${contract.id}`);

  // ── 4. Create nurture log for retention tracking ───────────────────
  try {
    await db.createNurtureLog({
      customerId: contract.customerId,
      contractId: contract.id,
      type: "renewal_outreach",
      channel: "in_app",
      subject: "Subscription cancelled",
      content: `Customer's ${contract.packageTier} subscription (${subscriptionId}) was cancelled. Contract marked as cancelled.`,
      status: "sent",
      sentAt: new Date(),
    });
  } catch (err) {
    console.error("[Stripe] Failed to create cancellation nurture log:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   COMMISSION HELPERS
   ═══════════════════════════════════════════════════════ */

/**
 * Create initial commission on first checkout (called from handleCheckoutCompleted).
 * Renamed from createRecurringCommission to clarify its role.
 */
async function createInitialCommission(session: Stripe.Checkout.Session) {
  try {
    const database = await getDb();
    if (!database) return;

    const customerEmail = session.customer_email || session.metadata?.customer_email;
    if (!customerEmail) return;

    const customerRows = await database.select().from(users).where(eq(users.email, customerEmail)).limit(1);
    if (!customerRows.length) return;

    const activeContracts = await database.select().from(contracts)
      .where(and(eq(contracts.status, "active")))
      .orderBy(desc(contracts.createdAt));

    for (const contract of activeContracts) {
      if (!contract.repId || contract.repId === 0) continue;

      const existingCommissions = await db.getActiveCommissionsByContract(contract.id);
      const hasInitialSale = existingCommissions.some(c => c.type === "initial_sale");
      if (hasInitialSale) continue; // Already has initial commission

      // This is the first payment — create initial_sale commission
      const monthlyPrice = parseFloat(contract.monthlyPrice);

      const tierRows = await database.select().from(repTiers).where(eq(repTiers.repId, contract.repId)).limit(1);
      const tierKey = (tierRows[0]?.tier || "bronze") as TierKey;
      let rate = TIER_CONFIG[tierKey].commissionRate / 100;

      // Self-sourced leads get 2x rate (capped at 40%)
      // Check if the lead was self-sourced by checking the contract metadata
      const isSelfSourced = false; // Initial checkout doesn't carry self-sourced flag

      const ratePercent = TIER_CONFIG[tierKey].commissionRate;
      const commissionAmount = (monthlyPrice * rate).toFixed(2);

      await db.createCommission({
        repId: contract.repId,
        contractId: contract.id,
        amount: commissionAmount,
        type: "initial_sale",
        status: "approved",
        selfSourced: isSelfSourced,
        rateApplied: ratePercent.toFixed(2),
      });

      // Auto-transfer to rep's Stripe Connect account if set up
      try {
        const [repRow] = await database.select({ stripeConnectAccountId: reps.stripeConnectAccountId, stripeConnectOnboarded: reps.stripeConnectOnboarded })
          .from(reps).where(eq(reps.id, contract.repId)).limit(1);
        if (repRow?.stripeConnectAccountId && repRow.stripeConnectOnboarded) {
          const stripe = new Stripe(ENV.stripeSecretKey || "");
          const amountCents = Math.round(parseFloat(commissionAmount) * 100);
          if (amountCents > 0) {
            await stripe.transfers.create({
              amount: amountCents,
              currency: "usd",
              destination: repRow.stripeConnectAccountId,
              metadata: { repId: String(contract.repId), contractId: String(contract.id), type: "initial_sale" },
            });
          }
        }
      } catch (transferErr) {
        console.error(`[Stripe] Transfer failed for rep=${contract.repId}:`, transferErr);
      }

      await db.createRepNotification({
        repId: contract.repId,
        type: "commission_approved",
        title: "New Sale Commission!",
        message: `You earned $${commissionAmount} from a new ${contract.packageTier} sale on contract #${contract.id}. Ready for instant payout!`,
        metadata: { contractId: contract.id, amount: commissionAmount },
      });

      console.log(`[Stripe] Initial commission created: rep=${contract.repId}, contract=${contract.id}, amount=$${commissionAmount}`);
    }
  } catch (err) {
    console.error("[Stripe] Error creating initial commission:", err);
  }
}

/**
 * Create recurring monthly commission for a specific contract.
 * Called from handleInvoicePaid for each recurring payment.
 * Idempotent: checks if commission already exists for this month.
 */
async function createRecurringCommissionForContract(contract: typeof contracts.$inferSelect) {
  try {
    const database = await getDb();
    if (!database) return;

    if (!contract.repId || contract.repId === 0) return;

    const existingCommissions = await db.getActiveCommissionsByContract(contract.id);

    // Check if we already created a recurring commission this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const recentRecurring = existingCommissions.find(
      c => c.type === "recurring_monthly" && c.createdAt >= monthStart
    );
    if (recentRecurring) {
      console.log(`[Stripe] Recurring commission already exists for contract ${contract.id} this month`);
      return;
    }

    // Calculate commission based on monthly price and rep's tier rate
    const monthlyPrice = parseFloat(contract.monthlyPrice);
    const initialCommission = existingCommissions.find(c => c.type === "initial_sale");
    const isSelfSourced = initialCommission?.selfSourced || false;

    const tierRows = await database.select().from(repTiers).where(eq(repTiers.repId, contract.repId)).limit(1);
    const tierKey = (tierRows[0]?.tier || "bronze") as TierKey;
    let rate = TIER_CONFIG[tierKey].commissionRate / 100;
    const ratePercent = TIER_CONFIG[tierKey].commissionRate;
    if (isSelfSourced) rate = Math.min(rate * 2, 0.40);

    const commissionAmount = (monthlyPrice * rate).toFixed(2);

    await db.createCommission({
      repId: contract.repId,
      contractId: contract.id,
      amount: commissionAmount,
      type: "recurring_monthly",
      status: "approved",
      selfSourced: isSelfSourced,
      rateApplied: (isSelfSourced ? Math.min(ratePercent * 2, 40) : ratePercent).toFixed(2),
    });

    // Auto-transfer to rep's Stripe Connect account if set up
    try {
      const [repRow] = await database.select({ stripeConnectAccountId: reps.stripeConnectAccountId, stripeConnectOnboarded: reps.stripeConnectOnboarded })
        .from(reps).where(eq(reps.id, contract.repId)).limit(1);
      if (repRow?.stripeConnectAccountId && repRow.stripeConnectOnboarded) {
        const stripe = new Stripe(ENV.stripeSecretKey || "");
        const amountCents = Math.round(parseFloat(commissionAmount) * 100);
        if (amountCents > 0) {
          await stripe.transfers.create({
            amount: amountCents,
            currency: "usd",
            destination: repRow.stripeConnectAccountId,
            metadata: { repId: String(contract.repId), contractId: String(contract.id), type: "recurring_monthly" },
          });
        }
      }
    } catch (transferErr) {
      console.error(`[Stripe] Transfer failed for rep=${contract.repId}:`, transferErr);
    }

    await db.createRepNotification({
      repId: contract.repId,
      type: "commission_approved",
      title: "Monthly Commission Earned!",
      message: `You earned $${commissionAmount} from a recurring payment on contract #${contract.id}${isSelfSourced ? " (2x self-sourced bonus!)" : ""}. Ready for instant payout!`,
      metadata: { contractId: contract.id, amount: commissionAmount },
    });

    console.log(`[Stripe] Recurring commission created: rep=${contract.repId}, contract=${contract.id}, amount=$${commissionAmount}`);
  } catch (err) {
    console.error("[Stripe] Error creating recurring commission:", err);
  }
}

/* ═══════════════════════════════════════════════════════
   PAYMENT_INTENT.PAYMENT_FAILED (legacy — for one-time payments)
   ═══════════════════════════════════════════════════════ */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const database = await getDb();
  if (!database) return;

  if (paymentIntent.id) {
    await database
      .update(orders)
      .set({ status: "failed" })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));
  }

  console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);
}
