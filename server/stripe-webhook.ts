import express, { Request, Response, Express } from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { orders, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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
