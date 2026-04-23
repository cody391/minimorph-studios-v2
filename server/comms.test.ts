import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
type CookieCall = { name: string; options: Record<string, unknown> };

/* ─── Context helpers ─── */
function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@minimorph.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

function createUserContext(userId = 2): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

/* ═══════════════════════════════════════════════════════
   SMS ENDPOINTS
   ═══════════════════════════════════════════════════════ */
describe("repComms.sendSms", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendSms({ toNumber: "+15551234567", body: "Hello" })
    ).rejects.toThrow();
  });

  it("rejects non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendSms({ toNumber: "+15551234567", body: "Hello" })
    ).rejects.toThrow(/Not a rep/);
  });

  it("validates phone number minimum length", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendSms({ toNumber: "123", body: "Hello" })
    ).rejects.toThrow();
  });

  it("validates body is not empty", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendSms({ toNumber: "+15551234567", body: "" })
    ).rejects.toThrow();
  });
});

describe("repComms.mySmsThreads", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.mySmsThreads()).rejects.toThrow();
  });

  it("returns empty array for non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.mySmsThreads();
    expect(result).toEqual([]);
  });
});

describe("repComms.smsThread", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.smsThread({ phoneNumber: "+15551234567" })
    ).rejects.toThrow();
  });

  it("returns empty array for non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.smsThread({ phoneNumber: "+15551234567" });
    expect(result).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════
   VOICE ENDPOINTS
   ═══════════════════════════════════════════════════════ */
describe("repComms.getVoiceToken", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.getVoiceToken()).rejects.toThrow();
  });

  it("throws for non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.getVoiceToken()).rejects.toThrow(/Not a rep/);
  });
});

describe("repComms.initiateCall", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.initiateCall({ toNumber: "+15551234567" })
    ).rejects.toThrow();
  });

  it("rejects non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.initiateCall({ toNumber: "+15551234567" })
    ).rejects.toThrow(/Not a rep/);
  });

  it("validates phone number minimum length", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.initiateCall({ toNumber: "123" })
    ).rejects.toThrow();
  });
});

describe("repComms.myCallLogs", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.myCallLogs()).rejects.toThrow();
  });

  it("returns empty array for non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.myCallLogs();
    expect(result).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════
   AI COACHING ENDPOINTS
   ═══════════════════════════════════════════════════════ */
describe("repComms.myCoachingFeedback", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.myCoachingFeedback()).rejects.toThrow();
  });

  it("returns empty array for non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.myCoachingFeedback();
    expect(result).toEqual([]);
  });

  it("accepts optional limit parameter", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.myCoachingFeedback({ limit: 5 });
    expect(result).toEqual([]);
  });
});

describe("repComms.getCoachingForMessage", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.getCoachingForMessage({ communicationType: "email", referenceId: 1 })
    ).rejects.toThrow();
  });

  it("returns null for non-existent coaching feedback", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.getCoachingForMessage({
      communicationType: "email",
      referenceId: 99999,
    });
    expect(result).toBeNull();
  });

  it("validates communicationType enum", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.getCoachingForMessage({
        communicationType: "invalid" as any,
        referenceId: 1,
      })
    ).rejects.toThrow();
  });
});

/* ═══════════════════════════════════════════════════════
   ADMIN TRAINING INSIGHTS
   ═══════════════════════════════════════════════════════ */
describe("repComms.adminListInsights", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.adminListInsights()).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repComms.adminListInsights()).rejects.toThrow();
  });

  it("returns insights for admin users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.repComms.adminListInsights();
    expect(Array.isArray(result)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════
   EMAIL ENDPOINTS (existing, now with real delivery)
   ═══════════════════════════════════════════════════════ */
describe("repComms.sendEmail", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendEmail({
        recipientEmail: "test@example.com",
        subject: "Test",
        body: "Hello",
      })
    ).rejects.toThrow();
  });

  it("rejects non-rep users", async () => {
    const { ctx } = createUserContext(999);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendEmail({
        recipientEmail: "test@example.com",
        subject: "Test",
        body: "Hello",
      })
    ).rejects.toThrow(/Not a rep/);
  });

  it("validates email format", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendEmail({
        recipientEmail: "not-an-email",
        subject: "Test",
        body: "Hello",
      })
    ).rejects.toThrow();
  });

  it("validates subject is not empty", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendEmail({
        recipientEmail: "test@example.com",
        subject: "",
        body: "Hello",
      })
    ).rejects.toThrow();
  });

  it("validates body is not empty", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.repComms.sendEmail({
        recipientEmail: "test@example.com",
        subject: "Test",
        body: "",
      })
    ).rejects.toThrow();
  });
});
