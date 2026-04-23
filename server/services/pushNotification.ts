import webpush from "web-push";
import { ENV } from "../_core/env";
import * as db from "../db";

let _initialized = false;

function initWebPush() {
  if (_initialized) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:support@minimorphstudios.com",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  _initialized = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a specific rep.
 * Sends to all registered push subscriptions for that rep.
 */
export async function sendPushToRep(repId: number, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  initWebPush();
  if (!_initialized) return { sent: 0, failed: 0 };

  // Check if the rep has push enabled for this notification category
  // (caller should check preferences before calling this)
  const subscriptions = await db.getRepPushSubscriptions(repId);
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-72x72.png",
    data: {
      url: payload.url || "/rep",
      tag: payload.tag,
    },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        pushPayload
      );
      sent++;
    } catch (err: any) {
      failed++;
      // If subscription is expired/invalid, remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.deletePushSubscription(sub.endpoint);
        console.log(`[Push] Removed expired subscription for rep ${repId}`);
      } else {
        console.error(`[Push] Failed to send to rep ${repId}:`, err.message);
      }
    }
  }

  return { sent, failed };
}

/**
 * Send push notification for a new lead assignment.
 */
export async function notifyNewLead(repId: number, leadName: string) {
  return sendPushToRep(repId, {
    title: "🎯 New Lead Assigned",
    body: `${leadName} has been assigned to you. Check your pipeline!`,
    url: "/rep",
    tag: "new_lead",
  });
}

/**
 * Send push notification for coaching feedback.
 */
export async function notifyCoachingFeedback(repId: number, communicationType: string) {
  return sendPushToRep(repId, {
    title: "📋 New Coaching Feedback",
    body: `AI Coach has reviewed your recent ${communicationType}. Check your feedback!`,
    url: "/rep",
    tag: "coaching_feedback",
  });
}

/**
 * Send push notification for ticket update.
 */
export async function notifyTicketUpdate(repId: number, ticketSubject: string, approved: boolean) {
  return sendPushToRep(repId, {
    title: approved ? "✅ Ticket Approved" : "❌ Ticket Update",
    body: approved
      ? `Your ticket "${ticketSubject}" has been approved!`
      : `Your ticket "${ticketSubject}" has been updated.`,
    url: "/rep",
    tag: "ticket_update",
  });
}

/**
 * Send push notification for commission approval.
 */
export async function notifyCommissionApproved(repId: number, amount: string) {
  return sendPushToRep(repId, {
    title: "💰 Commission Approved",
    body: `Your commission of $${amount} has been approved!`,
    url: "/rep",
    tag: "commission",
  });
}
