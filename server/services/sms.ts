import twilio from "twilio";
import { ENV } from "../_core/env";

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

export interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
}

export interface SendSmsResult {
  success: boolean;
  twilioSid?: string;
  status?: string;
  error?: string;
}

/**
 * Send a real SMS via Twilio.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const client = getTwilioClient();

  try {
    const message = await client.messages.create({
      to: params.to,
      from: params.from || ENV.twilioPhoneNumber,
      body: params.body,
    });

    return {
      success: true,
      twilioSid: message.sid,
      status: message.status,
    };
  } catch (err: any) {
    console.error("[SMS] Twilio send failed:", err);
    return {
      success: false,
      error: err.message || "Unknown error",
    };
  }
}

/**
 * Look up SMS delivery status from Twilio.
 */
export async function getSmsStatus(messageSid: string) {
  const client = getTwilioClient();
  try {
    const message = await client.messages(messageSid).fetch();
    return { status: message.status, errorCode: message.errorCode, errorMessage: message.errorMessage };
  } catch (err: any) {
    return { status: "unknown", errorCode: null, errorMessage: err.message };
  }
}
