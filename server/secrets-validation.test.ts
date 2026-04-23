import { describe, it, expect } from "vitest";

describe("Secrets Validation — All Integration Keys", () => {

  // ── Apollo.io ──
  it("APOLLO_API_KEY is set and valid format", () => {
    const key = process.env.APOLLO_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.length).toBeGreaterThan(5);
  });

  it("Apollo API key authenticates successfully", async () => {
    const key = process.env.APOLLO_API_KEY;
    if (!key) return;

    const resp = await fetch("https://api.apollo.io/api/v1/contacts/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": key,
      },
      body: JSON.stringify({
        q_organization_domains: ["example.com"],
        page: 1,
        per_page: 1,
      }),
    });

    expect(resp.status).not.toBe(401);
    expect(resp.status).not.toBe(403);
  });

  // ── Hunter.io ──
  it("HUNTER_API_KEY is set and valid format", () => {
    const key = process.env.HUNTER_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.length).toBeGreaterThan(5);
  });

  it("Hunter API key authenticates successfully", async () => {
    const key = process.env.HUNTER_API_KEY;
    if (!key) return;

    const resp = await fetch(`https://api.hunter.io/v2/account?api_key=${key}`);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.data).toBeDefined();
  });

  // ── Twilio TwiML App SID ──
  it("TWILIO_TWIML_APP_SID is set and has correct format", () => {
    const sid = process.env.TWILIO_TWIML_APP_SID;
    expect(sid).toBeDefined();
    expect(sid).not.toBe("");
    expect(sid!.startsWith("AP")).toBe(true);
    expect(sid!.length).toBe(34);
  });

  // ── Resend Webhook Secret ──
  it("RESEND_WEBHOOK_SECRET is set and non-empty", () => {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(secret!.length).toBeGreaterThan(5);
  });

  // ── Owner Phone Number ──
  it("OWNER_PHONE_NUMBER is set and valid E.164 format", () => {
    const phone = process.env.OWNER_PHONE_NUMBER;
    expect(phone).toBeDefined();
    expect(phone).not.toBe("");
    expect(phone!.startsWith("+1")).toBe(true);
    expect(phone!.length).toBe(12); // +1XXXXXXXXXX
  });

  it("Owner phone number is accessible via ENV", async () => {
    const { ENV } = await import("./_core/env");
    expect(ENV.ownerPhoneNumber).toBeDefined();
    expect(ENV.ownerPhoneNumber).not.toBe("");
    expect(ENV.ownerPhoneNumber.startsWith("+1")).toBe(true);
  });

  // ── Pre-existing secrets still injected ──
  it("All platform-injected secrets are present", () => {
    const required = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_PHONE_NUMBER",
      "RESEND_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "BUILT_IN_FORGE_API_KEY",
      "BUILT_IN_FORGE_API_URL",
      "JWT_SECRET",
      "DATABASE_URL",
      "OWNER_PHONE_NUMBER",
    ];

    for (const key of required) {
      const val = process.env[key];
      expect(val, `${key} should be set`).toBeDefined();
      expect(val, `${key} should not be empty`).not.toBe("");
    }
  });
});
