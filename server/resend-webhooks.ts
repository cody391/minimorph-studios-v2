/**
 * Resend Webhook Handler — Email open/click/delivery/bounce tracking
 *
 * Configure in Resend Dashboard → Webhooks:
 *   URL: https://your-domain.com/api/resend/webhook
 *   Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
 *
 * Security: Webhook signatures are verified using Svix (Resend's webhook delivery provider).
 * Set RESEND_WEBHOOK_SECRET in env to enable verification. Without it, all payloads are accepted (dev mode).
 */
import type { Express, Request, Response } from "express";
import { Webhook } from "svix";
import * as db from "./db";

// Map Resend event types to our status values
export const EVENT_STATUS_MAP: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.delivery_delayed": "sent",
  "email.complained": "bounced",
};

/**
 * Process a verified Resend webhook event.
 * Exported for testing.
 */
export async function processResendEvent(event: { type: string; data?: any; created_at?: string }) {
  const status = EVENT_STATUS_MAP[event.type];
  if (!status) {
    return { processed: false, reason: "unknown_event_type" };
  }

  const resendMessageId = event.data?.email_id;
  if (!resendMessageId) {
    return { processed: false, reason: "no_email_id" };
  }

  const timestamp = event.created_at ? new Date(event.created_at) : new Date();
  await db.updateEmailTrackingStatus(resendMessageId, status, timestamp);

  return { processed: true, status, resendMessageId };
}

export function registerResendWebhooks(app: Express) {
  app.post("/api/resend/webhook", async (req: Request, res: Response) => {
    try {
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

      // If webhook secret is configured, verify the signature via Svix
      if (webhookSecret) {
        const svixId = req.headers["svix-id"] as string;
        const svixTimestamp = req.headers["svix-timestamp"] as string;
        const svixSignature = req.headers["svix-signature"] as string;

        if (!svixId || !svixTimestamp || !svixSignature) {
          console.warn("[Resend Webhook] Missing Svix verification headers");
          return res.status(401).json({ error: "Missing webhook verification headers" });
        }

        try {
          const wh = new Webhook(webhookSecret);
          const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
          wh.verify(rawBody, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
          });
        } catch (verifyErr) {
          console.warn("[Resend Webhook] Signature verification failed:", verifyErr);
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }

      const event = req.body;
      if (!event || !event.type) {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      console.log(`[Resend Webhook] Received event: ${event.type}`);

      const result = await processResendEvent(event);
      if (result.processed) {
        console.log(`[Resend Webhook] Updated email ${result.resendMessageId} → ${result.status}`);
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[Resend Webhook] Error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });
}
