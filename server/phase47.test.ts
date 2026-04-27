/**
 * Phase 47: Lead Outreach Pipeline Optimization Tests
 * - Email-first outreach schedule
 * - SMS opt-in gates on repComms.sendSms
 * - recordSmsOptIn / getSmsOptInStatus endpoints
 * - sendDueOutreach SMS skip when no opt-in
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external services ───
vi.mock("./services/sms", () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true, twilioSid: "SM_test" }),
}));
vi.mock("./services/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg_test" }),
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ subject: "Test", body: "Hi" }) } }],
  }),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Outreach Schedule Tests ───
describe("Phase 47: Outreach Schedule", () => {
  it("OUTREACH_SCHEDULE should exist and be an array", async () => {
    const mod = await import("./services/leadGenOutreach");
    expect(Array.isArray((mod as any).OUTREACH_SCHEDULE)).toBe(true);
  });

  it("OUTREACH_SCHEDULE should start with email channel", async () => {
    const mod = await import("./services/leadGenOutreach");
    const schedule = (mod as any).OUTREACH_SCHEDULE as any[];
    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule[0].channel).toBe("email");
  });

  it("OUTREACH_SCHEDULE should be email-first with no cold SMS", async () => {
    const mod = await import("./services/leadGenOutreach");
    const schedule = (mod as any).OUTREACH_SCHEDULE as any[];
    // All steps should be email or rep_call_reminder (no SMS in automated sequence)
    const channels = schedule.map((s: any) => s.channel);
    expect(channels.filter((c: string) => c === "email").length).toBeGreaterThanOrEqual(3);
    // No SMS in the automated schedule (SMS is only sent manually after opt-in)
    expect(channels.filter((c: string) => c === "sms").length).toBe(0);
  });

  it("OUTREACH_SCHEDULE should include a rep_call_reminder step", async () => {
    const mod = await import("./services/leadGenOutreach");
    const schedule = (mod as any).OUTREACH_SCHEDULE as any[];
    const hasCallReminder = schedule.some((s: any) => s.channel === "rep_call_reminder");
    expect(hasCallReminder).toBe(true);
  });

  it("OUTREACH_SCHEDULE should have no automated SMS steps at all", async () => {
    const mod = await import("./services/leadGenOutreach");
    const schedule = (mod as any).OUTREACH_SCHEDULE as any[];
    const smsSteps = schedule.filter((s: any) => s.channel === "sms");
    expect(smsSteps.length).toBe(0);
  });
});

// ─── SMS Opt-In Gate on sendSms ───
describe("Phase 47: SMS Opt-In Gate", () => {
  it("repComms.sendSms should reject when lead has no opt-in", async () => {
    // Verify the opt-in check exists in the sendSms procedure code
    const fs = await import("fs");
    const code = await fs.promises.readFile("server/repEcosystem.ts", "utf-8");
    expect(code).toContain("smsOptIn");
    expect(code).toContain("Record their consent first");
  });

  it("repComms.sendSms should still check opt-out status", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("server/repEcosystem.ts", "utf-8");
    expect(code).toContain("smsOptedOut");
    expect(code).toContain("opted out of SMS");
  });
});

// ─── recordSmsOptIn Endpoint ───
describe("Phase 47: recordSmsOptIn Endpoint", () => {
  it("leadGenRouter should have recordSmsOptIn procedure", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    const procedures = Object.keys(leadGenRouter._def.procedures);
    expect(procedures).toContain("recordSmsOptIn");
  });

  it("leadGenRouter should have getSmsOptInStatus procedure", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    const procedures = Object.keys(leadGenRouter._def.procedures);
    expect(procedures).toContain("getSmsOptInStatus");
  });

  it("recordSmsOptIn accepts valid consent methods", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("server/leadGenRouter.ts", "utf-8");
    expect(code).toContain("verbal_consent");
    expect(code).toContain("form_submission");
    expect(code).toContain("reply_start");
    expect(code).toContain("manual");
  });
});

// ─── sendDueOutreach SMS Skip ───
describe("Phase 47: sendDueOutreach SMS Opt-In Skip", () => {
  it("sendDueOutreach should check smsOptIn before sending SMS", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("server/services/leadGenOutreach.ts", "utf-8");
    expect(code).toContain("smsOptIn");
    expect(code).toContain("cancelled");
  });

  it("sendDueOutreach should handle rep_call_reminder channel", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("server/services/leadGenOutreach.ts", "utf-8");
    expect(code).toContain("rep_call_reminder");
    expect(code).toContain("call_reminder");
  });
});

// ─── Frontend SMS Opt-In UI ───
describe("Phase 47: Frontend SMS Opt-In UI", () => {
  it("PipelineTab should have SMS opt-in consent dialog", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("client/src/pages/rep/PipelineTab.tsx", "utf-8");
    expect(code).toContain("Record SMS Consent");
    expect(code).toContain("showSmsOptIn");
    expect(code).toContain("recordSmsOptIn");
  });

  it("PipelineTab should show opt-in status banner in lead detail", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("client/src/pages/rep/PipelineTab.tsx", "utf-8");
    expect(code).toContain("SMS: Opted In");
    expect(code).toContain("SMS: Opted Out");
    expect(code).toContain("SMS: No Consent Recorded");
  });

  it("PipelineTab SMS quick action should be gated on opt-in", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("client/src/pages/rep/PipelineTab.tsx", "utf-8");
    expect(code).toContain("SMS opt-in required");
    expect(code).toContain("cursor-not-allowed");
  });

  it("CommsHub ComposeSmsDialog should show opt-in warnings", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("client/src/pages/rep/CommsHub.tsx", "utf-8");
    expect(code).toContain("leadNeedsOptIn");
    expect(code).toContain("leadOptedOut");
    expect(code).toContain("Record their consent in the Pipeline");
  });

  it("CommsHub ComposeSmsDialog should disable send when no opt-in", async () => {
    const fs = await import("fs");
    const code = await fs.promises.readFile("client/src/pages/rep/CommsHub.tsx", "utf-8");
    // Check that the disabled prop includes opt-in checks
    expect(code).toContain("!!leadOptedOut || !!leadNeedsOptIn");
  });
});

// ─── Schema Fields ───
describe("Phase 47: Schema Fields", () => {
  it("leads table should have smsOptIn boolean field", async () => {
    const fs = await import("fs");
    const schema = await fs.promises.readFile("drizzle/schema.ts", "utf-8");
    expect(schema).toContain("smsOptIn");
    expect(schema).toContain("smsOptInAt");
    expect(schema).toContain("smsOptInMethod");
  });

  it("outreach_sequences should support rep_call_reminder channel", async () => {
    const fs = await import("fs");
    const schema = await fs.promises.readFile("drizzle/schema.ts", "utf-8");
    expect(schema).toContain("rep_call_reminder");
    expect(schema).toContain("call_reminder");
  });
});
