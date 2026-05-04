import { Express, Request, Response } from "express";
import express from "express";
import { generateOutboundTwiml, generateInboundTwiml } from "./services/voice";
import * as db from "./db";
import { analyzeAndCoach } from "./services/aiCoach";
import { handleConversation } from "./services/leadGenConversationAI";
import { ENV } from "./_core/env";
import twilio from "twilio";

/**
 * Twilio webhook signature validation middleware.
 * Verifies that incoming requests are genuinely from Twilio.
 * In development mode, logs a warning but allows requests through.
 */
function validateTwilioSignature(req: Request, res: Response, next: Function) {
  const authToken = ENV.twilioAuthToken;
  if (!authToken) {
    console.warn("[Twilio Security] No auth token configured — skipping signature validation");
    return next();
  }

  const signature = req.headers["x-twilio-signature"] as string;
  if (!signature) {
    console.warn("[Twilio Security] Missing X-Twilio-Signature header");
    return res.status(403).send("Forbidden: Missing Twilio signature");
  }

  // Build the full URL Twilio used to sign the request
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["host"];
  const url = `${protocol}://${host}${req.originalUrl}`;

  const isValid = twilio.validateRequest(authToken, signature, url, req.body || {});
  if (!isValid) {
    console.warn(`[Twilio Security] Invalid signature for ${req.originalUrl}`);
    return res.status(403).send("Forbidden: Invalid Twilio signature");
  }

  next();
}

/**
 * Register Twilio webhook routes on the Express app.
 * These endpoints handle:
 * 1. Voice webhook — TwiML instructions for outbound/inbound calls
 * 2. Call status callback — updates call status in DB
 * 3. Recording status callback — saves recording URL and triggers transcription
 * 4. Inbound SMS webhook — receives incoming SMS messages + AI conversation routing
 */
export function registerTwilioWebhooks(app: Express) {
  // Twilio sends form-encoded data for webhooks
  const twilioParser = express.urlencoded({ extended: false });

  /**
   * POST /api/twilio/voice-webhook
   * Twilio hits this when a call is initiated from the browser (TwiML App).
   * Returns TwiML instructions to connect the call.
   */
  app.post("/api/twilio/voice-webhook", twilioParser, validateTwilioSignature, (req: Request, res: Response) => {
    try {
      const to = req.body.To || req.query.To;
      const from = req.body.From;
      const callSid = req.body.CallSid;

      console.log(`[Twilio Voice] Webhook hit — To: ${to}, From: ${from}, CallSid: ${callSid}`);

      if (to && to.startsWith("+")) {
        // Outbound call to a phone number
        const twiml = generateOutboundTwiml(to);
        res.type("text/xml");
        res.send(twiml);
      } else if (to && to.startsWith("client:")) {
        // Inbound call routed to a browser client
        const identity = to.replace("client:", "");
        const twiml = generateInboundTwiml(identity);
        res.type("text/xml");
        res.send(twiml);
      } else {
        // Default: just say something and hang up
        res.type("text/xml");
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Thank you for calling MiniMorph Studios. Please try again later.</Say></Response>`);
      }
    } catch (err) {
      console.error("[Twilio Voice] Webhook error:", err);
      res.type("text/xml");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>An error occurred. Please try again.</Say></Response>`);
    }
  });

  /**
   * POST /api/twilio/call-status
   * Twilio hits this with call status updates (initiated, ringing, answered, completed).
   */
  app.post("/api/twilio/call-status", twilioParser, validateTwilioSignature, async (req: Request, res: Response) => {
    try {
      const { CallSid, CallStatus, CallDuration, RecordingSid, RecordingUrl } = req.body;
      console.log(`[Twilio Voice] Status update — CallSid: ${CallSid}, Status: ${CallStatus}, Duration: ${CallDuration}`);

      if (CallSid) {
        const updateData: Record<string, any> = {
          status: mapTwilioCallStatus(CallStatus),
        };
        if (CallDuration) updateData.duration = parseInt(CallDuration);
        if (CallStatus === "completed") updateData.endedAt = new Date();
        if (RecordingSid) updateData.recordingSid = RecordingSid;
        if (RecordingUrl) updateData.recordingUrl = RecordingUrl;

        await db.updateCallLogByCallSid(CallSid, updateData);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("[Twilio Voice] Call status error:", err);
      res.sendStatus(500);
    }
  });

  /**
   * POST /api/twilio/recording-status
   * Twilio hits this when a recording is ready.
   * Saves the recording URL and triggers AI transcription + coaching.
   */
  app.post("/api/twilio/recording-status", twilioParser, validateTwilioSignature, async (req: Request, res: Response) => {
    try {
      const { CallSid, RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration } = req.body;
      console.log(`[Twilio Recording] Status: ${RecordingStatus}, CallSid: ${CallSid}, RecordingSid: ${RecordingSid}`);

      if (RecordingStatus === "completed" && CallSid) {
        // Save recording URL to the call log
        const recordingUrlMp3 = `${RecordingUrl}.mp3`;
        await db.updateCallLogByCallSid(CallSid, {
          recordingSid: RecordingSid,
          recordingUrl: recordingUrlMp3,
          duration: parseInt(RecordingDuration || "0"),
        });

        // Trigger transcription asynchronously
        transcribeAndCoachCall(CallSid, recordingUrlMp3).catch((err) =>
          console.error("[Twilio Recording] Transcription/coaching failed:", err)
        );
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("[Twilio Recording] Status error:", err);
      res.sendStatus(500);
    }
  });

  /**
   * POST /api/twilio/sms-webhook
   * Twilio hits this when an inbound SMS is received.
   * 
   * Routing priority:
   * 1. Owner ticket approval (YES/NO replies)
   * 2. STOP/opt-out compliance
   * 3. Lead gen AI conversation (if sender is a lead gen lead with no rep)
   * 4. Rep conversation (if sender has an active rep thread)
   * 5. Acknowledge receipt
   */
  app.post("/api/twilio/sms-webhook", twilioParser, validateTwilioSignature, async (req: Request, res: Response) => {
    try {
      const { From, To, Body, MessageSid } = req.body;
      console.log(`[Twilio SMS] Inbound — From: ${From}, Body: ${Body?.slice(0, 50)}`);

      // Find the rep who owns conversations with this number
      let repId: number | null = null;
      let leadId: number | null = null;

      // Part 9: First try to route by the receiving Twilio number (assignedPhoneNumber)
      try {
        const { getDb } = await import("./db");
        const dbConn = await getDb();
        if (dbConn) {
          const { reps: repsTable, smsMessages } = await import("../drizzle/schema");
          const { eq, desc } = await import("drizzle-orm");

          // Primary: match the `To` number against rep's assigned phone number
          if (To) {
            const [repByPhone] = await dbConn.select({ id: repsTable.id })
              .from(repsTable)
              .where(eq(repsTable.assignedPhoneNumber, To))
              .limit(1);
            if (repByPhone) {
              repId = repByPhone.id;
            }
          }

          // Fallback: find the rep who most recently texted this sender
          if (!repId) {
            const recent = await dbConn.select().from(smsMessages)
              .where(eq(smsMessages.toNumber, From))
              .orderBy(desc(smsMessages.createdAt))
              .limit(1);
            if (recent[0]) {
              repId = recent[0].repId;
              leadId = recent[0].leadId;
            }
          }
        }
      } catch (e) {
        console.error("[SMS Webhook] Failed to look up rep:", e);
      }

      // Check if this is an owner reply to a ticket approval request
      const ownerUser = await db.getOwnerUser();
      const bodyLower = Body?.trim().toLowerCase() || "";
      if (ownerUser) {
        const approvalKeywords = ["yes", "approve", "approved", "ok", "no", "reject", "rejected", "deny", "denied"];
        if (approvalKeywords.includes(bodyLower)) {
          const pendingTicket = await db.getMostRecentPendingTicket();
          if (pendingTicket) {
            const isApproved = ["yes", "approve", "approved", "ok"].includes(bodyLower);
            await db.updateSupportTicket(pendingTicket.id, {
              status: isApproved ? "approved" : "rejected",
              ownerApproval: isApproved ? "approved" : "rejected",
              ownerNotes: `Owner replied: ${Body?.trim()}`,
              resolvedAt: new Date(),
            });
            // Notify the rep
            await db.createRepNotification({
              repId: pendingTicket.repId,
              type: "general",
              title: isApproved ? "✅ Ticket Approved" : "❌ Ticket Rejected",
              message: isApproved
                ? `Your ticket "${pendingTicket.subject}" has been approved! Solution: ${pendingTicket.aiSolution?.slice(0, 200) || "See ticket details."}`
                : `Your ticket "${pendingTicket.subject}" was not approved by the owner.`,
              metadata: { ticketId: pendingTicket.id },
            });
            console.log(`[Ticket Approval] Ticket #${pendingTicket.id} ${isApproved ? "approved" : "rejected"} via owner SMS`);
            // Push notification for ticket update
            try {
              const { notifyTicketUpdate } = await import("./services/pushNotification");
              await notifyTicketUpdate(pendingTicket.repId, pendingTicket.subject, isApproved);
            } catch (pushErr) {
              console.error("[Ticket Approval] Push notification failed:", pushErr);
            }
            res.type("text/xml");
            res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Ticket #${pendingTicket.id} has been ${isApproved ? "approved" : "rejected"}. The rep has been notified.</Message></Response>`);
            return;
          }
        }
      }

      // Handle STOP/opt-out keywords
      const stopKeywords = ["stop", "unsubscribe", "cancel", "quit", "end"];
      const isStopRequest = stopKeywords.includes(bodyLower);

      // Check if this is from a lead gen lead (not a rep conversation)
      let leadGenLead: Awaited<ReturnType<typeof db.getLeadByPhone>> = null;
      if (!repId) {
        // No rep conversation found — check if it's a lead gen lead replying
        leadGenLead = await db.getLeadByPhone(From);
      }

      if (isStopRequest) {
        // Handle opt-out for both rep leads and lead gen leads
        const optOutLeadId = leadId || leadGenLead?.id;
        if (optOutLeadId) {
          await db.markLeadSmsOptedOut(optOutLeadId);
          console.log(`[SMS Compliance] Lead ${optOutLeadId} opted out via STOP from ${From}`);
        }
        res.type("text/xml");
        res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed from MiniMorph Studios messages. You will not receive further texts.</Message></Response>');
        return;
      }

      // ─── Lead Gen AI Conversation Handler ───
      // If the inbound SMS is from a lead gen lead (no active rep conversation),
      // route it to the AI conversation agent for autonomous handling.
      // The AI will: answer questions, handle objections, push for close, or escalate to rep.
      if (leadGenLead && !repId) {
        console.log(`[SMS Webhook] Lead gen lead detected: ${leadGenLead.businessName} (ID: ${leadGenLead.id}) — routing to AI conversation agent`);
        try {
          const conversationResult = await handleConversation({
            leadId: leadGenLead.id,
            channel: "sms",
            content: Body,
          });
          console.log(`[SMS Webhook] AI conversation result: decision=${conversationResult.decision}, confidence=${conversationResult.confidenceScore}`);

          // If AI assigned to a rep, notify the rep
          if (conversationResult.assignedToRepId) {
            await db.createRepNotification({
              repId: conversationResult.assignedToRepId,
              type: "lead_assigned",
              title: "🔥 Hot Lead Assigned",
              message: `AI warmed lead "${leadGenLead.businessName}" has been assigned to you. They replied: "${Body.slice(0, 100)}"`,
              metadata: { leadId: leadGenLead.id, fromNumber: From },
            });
            // Push notification
            try {
              const { notifyNewLead } = await import("./services/pushNotification");
              await notifyNewLead(conversationResult.assignedToRepId, leadGenLead.businessName);
            } catch (pushErr) {
              console.error("[SMS Webhook] Push notification failed:", pushErr);
            }
          }

          // If assigned to owner (enterprise lead), send owner notification
          if (conversationResult.assignedToOwner) {
            try {
              const { notifyOwner } = await import("./_core/notification");
              await notifyOwner({
                title: "🏢 Enterprise Lead Reply",
                content: `Enterprise lead "${leadGenLead.businessName}" replied via SMS: "${Body.slice(0, 200)}". AI decision: ${conversationResult.decision}`,
              });
              // Also SMS the owner directly
              const { ENV } = await import("./_core/env");
              if (ENV.ownerPhoneNumber) {
                const { sendSms } = await import("./services/sms");
                await sendSms({
                  to: ENV.ownerPhoneNumber,
                  body: `🏢 Enterprise lead "${leadGenLead.businessName}" replied!\nThey said: "${Body.slice(0, 150)}"\nAI: ${conversationResult.decision}\n\nThis lead is assigned to you.`,
                });
              }
            } catch (notifyErr) {
              console.error("[SMS Webhook] Owner notification failed:", notifyErr);
            }
          }
        } catch (aiErr) {
          console.error("[SMS Webhook] AI conversation handler error:", aiErr);
        }

        res.type("text/xml");
        res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      // ─── Rep Conversation Handler ───
      if (repId) {
        await db.createSmsMessage({
          repId,
          leadId,
          direction: "inbound",
          fromNumber: From,
          toNumber: To,
          body: Body,
          twilioSid: MessageSid,
          status: "received",
        });

        // Create a notification for the rep
        await db.createRepNotification({
          repId,
          type: "general",
          title: "New SMS Reply",
          message: `Reply from ${From}: "${Body.slice(0, 100)}${Body.length > 100 ? "..." : ""}"`,
          metadata: { fromNumber: From, leadId },
        });
      }

      // Respond with empty TwiML (acknowledge receipt)
      res.type("text/xml");
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (err) {
      console.error("[Twilio SMS] Webhook error:", err);
      res.type("text/xml");
      res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
  });

  console.log("[Twilio] Webhook routes registered: /api/twilio/voice-webhook, /api/twilio/call-status, /api/twilio/recording-status, /api/twilio/sms-webhook");
}

/**
 * Transcribe a call recording and trigger AI coaching.
 */
async function transcribeAndCoachCall(callSid: string, recordingUrl: string): Promise<void> {
  try {
    const callLog = await db.getCallLogByCallSid(callSid);
    if (!callLog) return;

    // Use the built-in voice transcription service
    const { transcribeAudio } = await import("./_core/voiceTranscription");
    const transcriptionResult = await transcribeAudio({
      audioUrl: recordingUrl,
      language: "en",
      prompt: "Sales call between a MiniMorph Studios sales representative and a potential client about web design services.",
    });

    if ("error" in transcriptionResult) {
      console.error("[Transcription] Error:", transcriptionResult.error);
      return;
    }

    const transcription = transcriptionResult.text;

    // Save transcription to the call log
    await db.updateCallLog(callLog.id, { transcription });

    // Trigger AI coaching on the transcription
    await analyzeAndCoach({
      repId: callLog.repId,
      communicationType: "call",
      referenceId: callLog.id,
      content: transcription,
      context: `Phone call (${callLog.direction}) — Duration: ${callLog.duration || 0}s`,
    });
  } catch (err) {
    console.error("[Transcription] Failed:", err);
  }
}

function mapTwilioCallStatus(twilioStatus: string): string {
  const statusMap: Record<string, string> = {
    queued: "initiated",
    initiated: "initiated",
    ringing: "ringing",
    "in-progress": "in_progress",
    completed: "completed",
    busy: "busy",
    "no-answer": "no_answer",
    failed: "failed",
    canceled: "canceled",
  };
  return statusMap[twilioStatus] || "initiated";
}
