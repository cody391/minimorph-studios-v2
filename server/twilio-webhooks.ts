import { Express, Request, Response } from "express";
import express from "express";
import { generateOutboundTwiml, generateInboundTwiml } from "./services/voice";
import * as db from "./db";
import { analyzeAndCoach } from "./services/aiCoach";
import { ENV } from "./_core/env";

/**
 * Register Twilio webhook routes on the Express app.
 * These endpoints handle:
 * 1. Voice webhook — TwiML instructions for outbound/inbound calls
 * 2. Call status callback — updates call status in DB
 * 3. Recording status callback — saves recording URL and triggers transcription
 * 4. Inbound SMS webhook — receives incoming SMS messages
 */
export function registerTwilioWebhooks(app: Express) {
  // Twilio sends form-encoded data for webhooks
  const twilioParser = express.urlencoded({ extended: false });

  /**
   * POST /api/twilio/voice-webhook
   * Twilio hits this when a call is initiated from the browser (TwiML App).
   * Returns TwiML instructions to connect the call.
   */
  app.post("/api/twilio/voice-webhook", twilioParser, (req: Request, res: Response) => {
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
  app.post("/api/twilio/call-status", twilioParser, async (req: Request, res: Response) => {
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
  app.post("/api/twilio/recording-status", twilioParser, async (req: Request, res: Response) => {
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
   */
  app.post("/api/twilio/sms-webhook", twilioParser, async (req: Request, res: Response) => {
    try {
      const { From, To, Body, MessageSid } = req.body;
      console.log(`[Twilio SMS] Inbound — From: ${From}, Body: ${Body?.slice(0, 50)}`);

      // Find the rep who owns conversations with this number
      // For now, try to find the most recent outbound SMS to this number
      const allSms = await db.listRepSmsConversations(0); // We'll look up by phone number
      // Find which rep was texting this number
      let repId: number | null = null;
      let leadId: number | null = null;

      // Search through recent SMS to find the rep who was texting this number
      // This is a simplified lookup — in production you'd index by phone number
      try {
        const { getDb } = await import("./db");
        const dbConn = await getDb();
        if (dbConn) {
          const { smsMessages } = await import("../drizzle/schema");
          const { eq, desc } = await import("drizzle-orm");
          const recent = await dbConn.select().from(smsMessages)
            .where(eq(smsMessages.toNumber, From))
            .orderBy(desc(smsMessages.createdAt))
            .limit(1);
          if (recent[0]) {
            repId = recent[0].repId;
            leadId = recent[0].leadId;
          }
        }
      } catch (e) {
        console.error("[SMS Webhook] Failed to look up rep:", e);
      }

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
