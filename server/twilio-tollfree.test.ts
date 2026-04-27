import { describe, it, expect } from "vitest";

describe("Twilio Toll-Free Number", () => {
  it("should have TWILIO_PHONE_NUMBER set to a toll-free number", () => {
    const phone = process.env.TWILIO_PHONE_NUMBER;
    expect(phone).toBeDefined();
    expect(phone).toBeTruthy();
    // Toll-free numbers start with +1 followed by 800/888/877/866/855/844/833
    expect(phone).toMatch(/^\+1(800|888|877|866|855|844|833)\d{7}$/);
  });

  it("should be able to initialize Twilio client and fetch the number", async () => {
    const twilio = await import("twilio");
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const phone = process.env.TWILIO_PHONE_NUMBER!;
    // Verify the number exists on the account
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phone,
      limit: 1,
    });
    expect(numbers.length).toBe(1);
    expect(numbers[0].phoneNumber).toBe(phone);
    expect(numbers[0].capabilities?.sms).toBe(true);
  });
});
