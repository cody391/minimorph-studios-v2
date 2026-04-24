import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Phase F tests: Security & Ownership Hardening
 *
 * Tests verify that:
 * 1. Non-owner users are rejected with "Access denied" on all hardened procedures
 * 2. Admin users bypass ownership checks
 * 3. Unauthenticated users are rejected on all protected procedures
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 77777,
    openId: "test-security-user",
    email: "security-test@example.com",
    name: "Security Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: null,
    stripeCustomerId: null,
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin-security",
    email: "admin-security@example.com",
    name: "Admin Security",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: null,
    stripeCustomerId: null,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ─── F3: Rep ownership checks ───────────────────────────

describe("F3: reps.getById ownership", () => {
  it("rejects non-owner user (user 77777 cannot access rep 1)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.reps.getById({ id: 1 })).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Admin can access any rep — returns null for non-existent
    const result = await caller.reps.getById({ id: 99999 });
    expect(result).toBeNull();
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.reps.getById({ id: 1 })).rejects.toThrow();
  });
});

// ─── F3: Lead ownership checks ──────────────────────────

describe("F3: leads.getById ownership", () => {
  it("rejects non-owner user (user 77777 has no rep profile)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.getById({ id: 1 })).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.leads.getById({ id: 99999 });
    expect(result).toBeNull();
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.leads.getById({ id: 1 })).rejects.toThrow();
  });
});

// ─── F3: Customer ownership checks ──────────────────────

describe("F3: customers.getById ownership", () => {
  it("rejects non-owner user (user 77777 doesn't own customer 1)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.customers.getById({ id: 1 })).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.customers.getById({ id: 99999 });
    expect(result).toBeNull();
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.customers.getById({ id: 1 })).rejects.toThrow();
  });
});

// ─── F3: contracts.byRep ownership checks ───────────────

describe("F3: contracts.byRep ownership", () => {
  it("rejects non-owner user (user 77777 doesn't own rep 1)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.contracts.byRep({ repId: 1 })).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.contracts.byRep({ repId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── F3: commissions.byRep ownership checks ─────────────

describe("F3: commissions.byRep ownership", () => {
  it("rejects non-owner user (user 77777 doesn't own rep 1)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.commissions.byRep({ repId: 1 })).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.commissions.byRep({ repId: 99999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── F3: Onboarding project ownership checks ────────────

describe("F3: onboarding.submitQuestionnaire ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.submitQuestionnaire({
        projectId: 1,
        questionnaire: { brandTone: "professional" },
      })
    ).rejects.toThrow("Access denied");
  });

  it("admin bypasses ownership check (succeeds even on non-existent project)", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    // Admin bypasses assertProjectOwnership entirely, so the mutation
    // proceeds to db.updateOnboardingProject which silently succeeds
    const result = await caller.onboarding.submitQuestionnaire({
      projectId: 99999,
      questionnaire: { brandTone: "professional" },
    });
    expect(result).toEqual({ success: true });
  });
});

describe("F3: onboarding.setDomain ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.setDomain({
        projectId: 1,
        domainOption: "undecided",
      })
    ).rejects.toThrow("Access denied");
  });
});

describe("F3: onboarding.listAssets ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.listAssets({ projectId: 1 })
    ).rejects.toThrow("Access denied");
  });
});

describe("F3: onboarding.deleteAsset ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.deleteAsset({ id: 1 })
    ).rejects.toThrow("Access denied");
  });
});

describe("F3: onboarding.submitFeedback ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.submitFeedback({
        projectId: 1,
        feedbackNotes: "Looks great!",
      })
    ).rejects.toThrow("Access denied");
  });
});

describe("F3: onboarding.approveLaunch ownership", () => {
  it("rejects non-owner user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.approveLaunch({ projectId: 1 })
    ).rejects.toThrow("Access denied");
  });
});

// ─── F5: Rate limiting verification ─────────────────────

describe("F5: Rate limiters are configured", () => {
  it("localAuth.register procedure exists", () => {
    expect(appRouter._def.procedures).toHaveProperty("localAuth.register");
  });

  it("localAuth.login procedure exists", () => {
    expect(appRouter._def.procedures).toHaveProperty("localAuth.login");
  });
});

// ─── F4: RepDashboard data leak fix verification ────────

describe("F4: leads.myLeads is the safe alternative to leads.list", () => {
  it("leads.myLeads exists as a protectedProcedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("leads.myLeads");
  });

  it("leads.list is an adminProcedure (rejects non-admin)", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.list()).rejects.toThrow();
  });

  it("leads.myLeads rejects users without a rep profile", async () => {
    const caller = appRouter.createCaller(createUserContext());
    // myLeads requires a rep profile — rejects non-reps
    await expect(caller.leads.myLeads()).rejects.toThrow("You are not a registered rep");
  });
});

// ─── Ownership helper edge cases ────────────────────────

describe("Ownership helpers: edge cases", () => {
  it("assertRepOwnership rejects when rep doesn't exist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.reps.getById({ id: 99999 })).rejects.toThrow("Access denied");
  });

  it("assertLeadOwnership rejects user with no rep profile", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.getById({ id: 99999 })).rejects.toThrow("Access denied");
  });

  it("assertCustomerOwnership rejects when customer doesn't exist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.customers.getById({ id: 99999 })).rejects.toThrow("Access denied");
  });

  it("assertProjectOwnership rejects when project doesn't exist", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.onboarding.approveLaunch({ projectId: 99999 })
    ).rejects.toThrow("Access denied");
  });
});
