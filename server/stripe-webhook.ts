import express, { Request, Response, Express } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import * as db from "./db";
import { getDb } from "./db";
import { orders, users, contracts, leads, commissions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

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
  const db = await getDb();
  if (!db) {
    console.error("[Stripe] Database not available for checkout completion");
    return;
  }

  const userId = session.metadata?.user_id
    ? parseInt(session.metadata.user_id)
    : null;

  // Update the order status
  if (session.id) {
    await db
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId: session.payment_intent as string,
      })
      .where(eq(orders.stripeCheckoutSessionId, session.id));
  }

  // Save stripe customer ID on the user
  if (userId && session.customer) {
    await db
      .update(users)
      .set({ stripeCustomerId: session.customer as string })
      .where(eq(users.id, userId));
  }

  console.log(
    `[Stripe] Checkout completed: session=${session.id}, user=${userId}, amount=${session.amount_total}`
  );

  // Auto-create recurring commission for the rep if this payment is tied to a contract
  // This implements the "pay when customer pays" model
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

      // Get rep's gamification level for rate
      const gamification = await db.getRepGamification(contract.repId);
      const level = gamification?.level || "rookie";
      const tierRates: Record<string, number> = {
        rookie: 0.10, closer: 0.12, ace: 0.14, elite: 0.16, legend: 0.20,
      };
      let rate = tierRates[level] || 0.10;
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
