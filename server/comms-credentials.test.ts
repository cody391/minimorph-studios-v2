import { describe, expect, it } from "vitest";

describe("Communications credentials validation", () => {
  it("Resend API key is configured and valid", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();

    // Validate by calling the Resend API to list domains (lightweight read-only call)
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // 200 = valid key, 401/403 = invalid key
    expect(response.status).toBe(200);
  });

  it("Twilio Account SID and Auth Token are configured and valid", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    expect(accountSid).toBeTruthy();
    expect(authToken).toBeTruthy();

    // Validate by calling the Twilio API to fetch account info (lightweight read-only call)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
      }
    );
    // 200 = valid credentials, 401 = invalid
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sid).toBe(accountSid);
  });

  it("Twilio Phone Number is configured", () => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    expect(phoneNumber).toBeTruthy();
    // Basic format check: should start with + and have digits
    expect(phoneNumber).toMatch(/^\+\d{7,15}$/);
  });
});
