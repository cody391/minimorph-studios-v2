import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
type CookieCall = { name: string; options: Record<string, unknown> };

/* ─── Context helpers ─── */
function createAdminContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
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
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@test.com",
    name: "Regular User",
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

/* ─── Mocks ─── */
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            subject: "Test Proposal",
            htmlContent: "<p>Test</p>",
            plainTextContent: "Test proposal content",
            keySellingPoints: ["Point 1", "Point 2"],
          }),
        },
      },
    ],
  }),
}));

/* ═══════════════════════════════════════════════════════
   leads.myLeads — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.myLeads", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.myLeads()).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.myLeads();
    } catch (e: any) {
      // Should fail at DB/rep-lookup level, not auth
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   leads.updateMyLead — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.updateMyLead", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.updateMyLead({ leadId: 1, stage: "contacted" })
    ).rejects.toThrow();
  });

  it("validates stage enum values", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.updateMyLead({ leadId: 1, stage: "invalid_stage" as any })
    ).rejects.toThrow();
  });

  it("accepts closed_lost as a valid stage", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.updateMyLead({ leadId: 1, stage: "closed_lost" });
    } catch (e: any) {
      // Should fail at DB/rep-lookup level, not validation
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("validates outcome enum values", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.updateMyLead({ leadId: 1, outcome: "bad_outcome" as any })
    ).rejects.toThrow();
  });

  it("accepts valid outcome values", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const validOutcomes = ["connected", "voicemail", "no_answer", "scheduled", "sent", "completed", "cancelled"];
    for (const outcome of validOutcomes) {
      try {
        await caller.leads.updateMyLead({ leadId: 1, outcome: outcome as any });
      } catch (e: any) {
        // Should fail at DB/rep-lookup level, not validation
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });
});

/* ═══════════════════════════════════════════════════════
   leads.leadPool — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.leadPool", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.leadPool()).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.leadPool();
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   leads.claimLead — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.claimLead", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.claimLead({ leadId: 1 })).rejects.toThrow();
  });

  it("requires a leadId", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.leads.claimLead({} as any)).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.claimLead({ leadId: 999 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   leads.closeDeal — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.closeDeal", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.closeDeal({ leadId: 1, packageTier: "starter", monthlyPrice: "99" })
    ).rejects.toThrow();
  });

  it("validates packageTier enum", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.closeDeal({ leadId: 1, packageTier: "invalid" as any, monthlyPrice: "99" })
    ).rejects.toThrow();
  });

  it("accepts valid package tiers", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    for (const tier of ["starter", "growth", "premium"] as const) {
      try {
        await caller.leads.closeDeal({ leadId: 1, packageTier: tier, monthlyPrice: "99" });
      } catch (e: any) {
        // Should fail at DB/rep-lookup level, not validation
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    }
  });

  it("requires monthlyPrice", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.closeDeal({ leadId: 1, packageTier: "starter" } as any)
    ).rejects.toThrow();
  });
});

/* ═══════════════════════════════════════════════════════
   leads.generateProposal — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("leads.generateProposal", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.generateProposal({ leadId: 1, packageTier: "starter" })
    ).rejects.toThrow();
  });

  it("validates packageTier enum", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.generateProposal({ leadId: 1, packageTier: "invalid" as any })
    ).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.generateProposal({ leadId: 1, packageTier: "growth" });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   leads.transferLeads — admin-only
   ═══════════════════════════════════════════════════════ */
describe("leads.transferLeads", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.transferLeads({ fromRepId: 1, toRepId: 2 })
    ).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.transferLeads({ fromRepId: 1, toRepId: 2 })
    ).rejects.toThrow(/permission|FORBIDDEN/i);
  });

  it("is accessible to admin users (fails at DB level, not auth)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.leads.transferLeads({ fromRepId: 1, toRepId: 2 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("requires both fromRepId and toRepId", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.transferLeads({ fromRepId: 1 } as any)
    ).rejects.toThrow();
    await expect(
      caller.leads.transferLeads({ toRepId: 2 } as any)
    ).rejects.toThrow();
  });
});

/* ═══════════════════════════════════════════════════════
   repNotifications.list — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("repNotifications.list", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repNotifications.list({ limit: 10 })).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.repNotifications.list({ limit: 10 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   repNotifications.unreadCount — protected
   ═══════════════════════════════════════════════════════ */
describe("repNotifications.unreadCount", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repNotifications.unreadCount()).rejects.toThrow();
  });

  it("is accessible to authenticated users (fails at DB level, not auth)", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.repNotifications.unreadCount();
      // For non-reps it returns { count: 0 }
      expect(result).toEqual({ count: 0 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

/* ═══════════════════════════════════════════════════════
   repNotifications.markRead — protected, rep-only
   ═══════════════════════════════════════════════════════ */
describe("repNotifications.markRead", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.repNotifications.markRead({ ids: [1] })).rejects.toThrow();
  });

  it("accepts optional ids parameter", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.repNotifications.markRead({});
    } catch (e: any) {
      // Should fail at DB/rep-lookup level, not validation
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("accepts array of ids", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.repNotifications.markRead({ ids: [1, 2, 3] });
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});
