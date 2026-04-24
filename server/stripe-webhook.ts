import express, { Request, Response, Express } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import * as db from "./db";
import { getDb } from "./db";
import { orders, users, contracts, leads, commissions, customers, onboardingProjects } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendWelcomeEmail } from "./services/customerEmails";
import { TIER_CONFIG, type TierKey } from "../shared/accountability";
import { repTiers } from "../drizzle/schema";
import { PACKAGES, type PackageKey } from "../shared/pricing";

function getStripe(): Stripe | null {
  const key = (ENV as any).stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as any });
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
      const webhookSecret =
        (ENV as any).stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

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
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
      }

      res.json({ received: true });
    }
  );
}

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
    // Check if a customer already exists for this user
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

  if (customerId && session.id) {
    // Check if a contract already exists for this checkout session
    // We use the order's session ID as the idempotency key via the order link
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

      const newContract = await db.createContract({
        customerId,
        repId: 0, // Self-service checkout — no rep assigned
        packageTier,
        monthlyPrice: monthlyPrice.toFixed(2),
        startDate,
        endDate,
        notes: "Self-service checkout via Stripe",
      });
      contractId = newContract.id;
      console.log(`[Stripe] Contract created: contract=${contractId}, customer=${customerId}, package=${packageTier}`);
    }
  }

  // ── 6. Create onboarding project (idempotent) ─────────────────────
  if (customerId) {
    // Check if an onboarding project already exists for this customer
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

  // ── 7. Send welcome email ──────────────────────────────────────────
  try {
    if (customerEmail) {
      await sendWelcomeEmail({
        to: customerEmail,
        customerName,
        packageTier,
        businessName: businessName || undefined,
      });
      console.log(`[Stripe] Welcome email sent to ${customerEmail}`);
    }
  } catch (emailErr) {
    console.error("[Stripe] Failed to send welcome email:", emailErr);
  }

  // ── 8. Auto-create recurring commission for the rep (if applicable) ─
  await createRecurringCommission(session);
}

/**
 * When a customer payment succeeds, create a recurring commission for the rep.
 * This is the Uber/DoorDash instant payout model:
 * - Commission is auto-approved (not pending)
 * - Rep gets paid every time the customer pays
 * - If customer stops paying, no more commissions
 */
async function createRecurringCommission(session: Stripe.Checkout.Session) {
  try {
    const database = await getDb();
    if (!database) return;

    // Find the contract associated with this payment via metadata or customer email
    const customerEmail = session.customer_email || session.metadata?.customer_email;
    if (!customerEmail) return;

    // Look up active contracts for this customer
    const customerRows = await database.select().from(users).where(eq(users.email, customerEmail)).limit(1);
    if (!customerRows.length) return;

    // Find active contracts with a rep
    const activeContracts = await database.select().from(contracts)
      .where(and(eq(contracts.status, "active")))
      .orderBy(desc(contracts.createdAt));

    for (const contract of activeContracts) {
      if (!contract.repId) continue;

      // Check if this is a recurring payment (not the initial sale)
      const existingCommissions = await db.getActiveCommissionsByContract(contract.id);
      const hasInitialSale = existingCommissions.some(c => c.type === "initial_sale");
      if (!hasInitialSale) continue; // Skip if no initial sale commission exists

      // Check if we already created a recurring commission this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const recentRecurring = existingCommissions.find(
        c => c.type === "recurring_monthly" && c.createdAt >= monthStart
      );
      if (recentRecurring) continue; // Already paid this month

      // Calculate recurring commission based on monthly price and rep's rate
      const monthlyPrice = parseFloat(contract.monthlyPrice);
      const initialCommission = existingCommissions.find(c => c.type === "initial_sale");
      const isSelfSourced = initialCommission?.selfSourced || false;

      // Get rep's accountability tier for commission rate
      const tierRows = await database.select().from(repTiers).where(eq(repTiers.repId, contract.repId)).limit(1);
      const tierKey = (tierRows[0]?.tier || "bronze") as TierKey;
      let rate = TIER_CONFIG[tierKey].commissionRate / 100;
      if (isSelfSourced) rate = Math.min(rate * 2, 0.40);

      const commissionAmount = (monthlyPrice * rate).toFixed(2);

      // Create auto-approved recurring commission
      await db.createCommission({
        repId: contract.repId,
        contractId: contract.id,
        amount: commissionAmount,
        type: "recurring_monthly",
        status: "approved", // Instant payout — auto-approved
        selfSourced: isSelfSourced,
      });

      // Notify the rep
      await db.createRepNotification({
        repId: contract.repId,
        type: "commission_approved",
        title: "💰 Monthly Commission Earned!",
        message: `You earned $${commissionAmount} from a recurring payment on contract #${contract.id}${isSelfSourced ? " (2x self-sourced bonus!)" : ""}. Ready for instant payout!`,
        metadata: { contractId: contract.id, amount: commissionAmount },
      });

      console.log(`[Stripe] Recurring commission created: rep=${contract.repId}, contract=${contract.id}, amount=$${commissionAmount}`);
    }
  } catch (err) {
    console.error("[Stripe] Error creating recurring commission:", err);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();
  if (!db) return;

  if (paymentIntent.id) {
    await db
      .update(orders)
      .set({ status: "failed" })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));
  }

  console.log(`[Stripe] Payment failed: ${paymentIntent.id}`);
}
