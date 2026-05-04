import twilio from "twilio";
import { ENV } from "../_core/env";

function getClient() {
  return twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);
}

export async function searchAvailableNumbers(areaCode?: string): Promise<{ phoneNumber: string; friendlyName: string }[]> {
  const client = getClient();
  const numbers = await client.availablePhoneNumbers("US").local.list({
    limit: 10,
    voiceEnabled: true,
    smsEnabled: true,
    ...(areaCode ? { areaCode: parseInt(areaCode, 10) } : {}),
  });
  return numbers.map((n) => ({ phoneNumber: n.phoneNumber, friendlyName: n.friendlyName }));
}

export async function provisionPhoneNumber(
  repId: number,
  repName: string,
  phoneNumber?: string
): Promise<string> {
  const client = getClient();

  let numberToProvision = phoneNumber;
  if (!numberToProvision) {
    const available = await client.availablePhoneNumbers("US").local.list({
      limit: 1,
      voiceEnabled: true,
      smsEnabled: true,
    });
    if (available.length === 0) throw new Error("No phone numbers available to provision");
    numberToProvision = available[0].phoneNumber;
  }

  const webhookBase = ENV.appUrl;
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: numberToProvision,
    friendlyName: `MiniMorph Rep - ${repName} (#${repId})`,
    voiceUrl: `${webhookBase}/api/twilio/voice-webhook`,
    voiceMethod: "POST",
    statusCallback: `${webhookBase}/api/twilio/call-status`,
    statusCallbackMethod: "POST",
    smsUrl: `${webhookBase}/api/twilio/sms-webhook`,
    smsMethod: "POST",
  });

  return purchased.phoneNumber;
}

export async function releasePhoneNumber(phoneNumber: string): Promise<void> {
  const client = getClient();
  const numbers = await client.incomingPhoneNumbers.list({ phoneNumber, limit: 1 });
  if (numbers.length > 0) {
    await client.incomingPhoneNumbers(numbers[0].sid).remove();
  }
}
