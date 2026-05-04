import twilio from "twilio";
import { ENV } from "../_core/env";

const { VoiceResponse } = twilio.twiml;
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

let _client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!_client) {
    if (!ENV.twilioAccountSid || !ENV.twilioAuthToken) {
      throw new Error("Twilio credentials are not configured");
    }
    _client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
  }
  return _client;
}

/**
 * Generate a Twilio Access Token for browser-based calling via Twilio Client SDK.
 * The rep's identity is embedded in the token so Twilio can route calls to them.
 */
export function generateVoiceToken(identity: string): string {
  if (!ENV.twilioAccountSid) {
    throw new Error("TWILIO_ACCOUNT_SID is not configured");
  }
  if (!ENV.twilioApiKeySid || !ENV.twilioApiKeySecret) {
    throw new Error("TWILIO_API_KEY_SID / TWILIO_API_KEY_SECRET are not configured. Create an API Key in the Twilio Console.");
  }
  if (!ENV.twilioTwimlAppSid) {
    throw new Error("TWILIO_TWIML_APP_SID is not configured. Create a TwiML App first.");
  }

  const token = new AccessToken(
    ENV.twilioAccountSid,
    ENV.twilioApiKeySid,
    ENV.twilioApiKeySecret,
    { identity, ttl: 3600 }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: ENV.twilioTwimlAppSid,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}

/**
 * Generate TwiML for an outbound call.
 * This is the webhook Twilio hits when the browser client initiates a call.
 */
export function generateOutboundTwiml(toNumber: string, callerId?: string): string {
  const response = new VoiceResponse();
  response.say(
    { voice: "Polly.Joanna" },
    "This call may be recorded for quality and training purposes."
  );
  const dial = response.dial({
    callerId: callerId || ENV.twilioPhoneNumber,
    record: "record-from-answer-dual",
    recordingStatusCallback: `${ENV.appUrl}/api/twilio/recording-status`,
    recordingStatusCallbackMethod: "POST",
  });
  dial.number(toNumber);
  return response.toString();
}

/**
 * Generate TwiML for an inbound call — routes to the rep's browser client.
 */
export function generateInboundTwiml(repIdentity: string): string {
  const response = new VoiceResponse();
  const dial = response.dial({
    record: "record-from-answer-dual",
    recordingStatusCallback: `${ENV.appUrl}/api/twilio/recording-status`,
    recordingStatusCallbackMethod: "POST",
  });
  dial.client(repIdentity);
  return response.toString();
}

/**
 * Fetch a call recording's details from Twilio.
 */
export async function getRecording(recordingSid: string) {
  const client = getTwilioClient();
  try {
    const recording = await client.recordings(recordingSid).fetch();
    return {
      sid: recording.sid,
      duration: parseInt(recording.duration || "0"),
      uri: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
      status: recording.status,
    };
  } catch (err: any) {
    console.error("[Voice] Failed to fetch recording:", err);
    return null;
  }
}

/**
 * Initiate an outbound call from the server side (alternative to browser SDK).
 */
export async function initiateCall(params: {
  to: string;
  from?: string;
  statusCallback: string;
}) {
  const client = getTwilioClient();
  try {
    const call = await client.calls.create({
      to: params.to,
      from: params.from || ENV.twilioPhoneNumber,
      url: `${params.statusCallback.replace("/call-status", "/voice-webhook")}?To=${encodeURIComponent(params.to)}`,
      statusCallback: params.statusCallback,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      record: true,
    });
    return { success: true, callSid: call.sid, status: call.status };
  } catch (err: any) {
    console.error("[Voice] Failed to initiate call:", err);
    return { success: false, error: err.message };
  }
}
