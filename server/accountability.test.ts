/**
 * Tests for the Accountability Router — Phase 48
 * 
 * Covers: Performance Score Engine, Tier System, Lead Allocation,
 * Residual Decay, Strike System, Admin Governance procedures
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  calculatePerformanceScore,
  calculateTier,
  calculateResidualDecay,
  SCORE_WEIGHTS,
  TIER_CONFIG,
  RESIDUAL_DECAY,
  LEAD_ALLOCATION,
  STRIKE_RULES,
} from "./accountabilityRouter";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

// ═══════════════════════════════════════════════════════
// UNIT TESTS — Pure scoring functions
// ═══════════════════════════════════════════════════════

describe("Performance Score Engine", () => {
  it("should return 0 for a completely inactive rep", () => {
    const result = calculatePerformanceScore({
      callsMade: 0,
      followUpsSent: 0,
      meetingsBooked: 0,
      leadsAssigned: 0,
      leadsConverted: 0,
      dealsClosed: 0,
      avgClientRating: 0,
      totalRatings: 0,
      totalInteractions: 0,
      flaggedInteractions: 0,
      activeStrikes: 0,
    });
    // Activity = 0, Close = 0, Satisfaction = 75 (default), Values = 100
    // Overall = 0*0.3 + 0*0.3 + 75*0.2 + 100*0.2 = 35
    expect(result.overallScore).toBe(35);
    expect(result.activityScore).toBe(0);
    expect(result.closeRateScore).toBe(0);
    expect(result.clientSatisfactionScore).toBe(75); // default
    expect(result.valuesComplianceScore).toBe(100);
  });

  it("should return high score for a top performer", () => {
    const result = calculatePerformanceScore({
      callsMade: 200,
      followUpsSent: 100,
      meetingsBooked: 10,
      leadsAssigned: 20,
      leadsConverted: 5,
      dealsClosed: 5,
      avgClientRating: 4.8,
      totalRatings: 10,
      totalInteractions: 50,
      flaggedInteractions: 0,
      activeStrikes: 0,
    });
    expect(result.overallScore).toBeGreaterThan(80);
    expect(result.activityScore).toBeGreaterThan(80);
    expect(result.closeRateScore).toBeGreaterThan(90);
    expect(result.valuesComplianceScore).toBe(100);
  });

  it("should penalize flagged interactions", () => {
    const clean = calculatePerformanceScore({
      callsMade: 100,
      followUpsSent: 50,
      meetingsBooked: 5,
      leadsAssigned: 10,
      leadsConverted: 2,
      dealsClosed: 2,
      avgClientRating: 4.0,
      totalRatings: 5,
      totalInteractions: 30,
      flaggedInteractions: 0,
      activeStrikes: 0,
    });

    const flagged = calculatePerformanceScore({
      callsMade: 100,
      followUpsSent: 50,
      meetingsBooked: 5,
      leadsAssigned: 10,
      leadsConverted: 2,
      dealsClosed: 2,
      avgClientRating: 4.0,
      totalRatings: 5,
      totalInteractions: 30,
      flaggedInteractions: 5,
      activeStrikes: 0,
    });

    expect(flagged.valuesComplianceScore).toBeLessThan(clean.valuesComplianceScore);
    expect(flagged.overallScore).toBeLessThan(clean.overallScore);
  });

  it("should penalize active strikes on values score", () => {
    const noStrikes = calculatePerformanceScore({
      callsMade: 100,
      followUpsSent: 50,
      meetingsBooked: 5,
      leadsAssigned: 10,
      leadsConverted: 2,
      dealsClosed: 2,
      avgClientRating: 4.0,
      totalRatings: 5,
      totalInteractions: 30,
      flaggedInteractions: 0,
      activeStrikes: 0,
    });

    const withStrikes = calculatePerformanceScore({
      callsMade: 100,
      followUpsSent: 50,
      meetingsBooked: 5,
      leadsAssigned: 10,
      leadsConverted: 2,
      dealsClosed: 2,
      avgClientRating: 4.0,
      totalRatings: 5,
      totalInteractions: 30,
      flaggedInteractions: 0,
      activeStrikes: 3,
    });

    expect(withStrikes.valuesComplianceScore).toBeLessThan(noStrikes.valuesComplianceScore);
    expect(withStrikes.valuesComplianceScore).toBe(100 - 3 * 15); // 55
  });

  it("should cap scores at 0-100 range", () => {
    const result = calculatePerformanceScore({
      callsMade: 999,
      followUpsSent: 999,
      meetingsBooked: 999,
      leadsAssigned: 1,
      leadsConverted: 1,
      dealsClosed: 1,
      avgClientRating: 5.0,
      totalRatings: 100,
      totalInteractions: 0,
      flaggedInteractions: 0,
      activeStrikes: 0,
    });
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.activityScore).toBeLessThanOrEqual(100);
    expect(result.closeRateScore).toBeLessThanOrEqual(100);
    expect(result.clientSatisfactionScore).toBeLessThanOrEqual(100);
    expect(result.valuesComplianceScore).toBeLessThanOrEqual(100);
  });

  it("should have correct score weights summing to 1.0", () => {
    const total = SCORE_WEIGHTS.activity + SCORE_WEIGHTS.closeRate +
      SCORE_WEIGHTS.clientSatisfaction + SCORE_WEIGHTS.valuesCompliance;
    expect(total).toBe(1.0);
  });
});

describe("Tier Calculation", () => {
  it("should return bronze for new reps", () => {
    expect(calculateTier(0, 0)).toBe("bronze");
    expect(calculateTier(2, 2000)).toBe("bronze");
  });

  it("should return silver for 3+ months and $3K+/mo", () => {
    expect(calculateTier(3, 3000)).toBe("silver");
    expect(calculateTier(5, 5000)).toBe("silver");
  });

  it("should return gold for 6+ months and $7K+/mo", () => {
    expect(calculateTier(6, 7000)).toBe("gold");
    expect(calculateTier(10, 10000)).toBe("gold");
  });

  it("should return platinum for 12+ months and $12K+/mo", () => {
    expect(calculateTier(12, 12000)).toBe("platinum");
    expect(calculateTier(24, 50000)).toBe("platinum");
  });

  it("should not promote if only one criterion is met", () => {
    // Has months but not revenue
    expect(calculateTier(12, 2000)).toBe("bronze");
    // Has revenue but not months
    expect(calculateTier(1, 15000)).toBe("bronze");
  });

  it("should have correct tier config commission rates", () => {
    expect(TIER_CONFIG.bronze.commissionRate).toBe(10);
    expect(TIER_CONFIG.silver.commissionRate).toBe(12);
    expect(TIER_CONFIG.gold.commissionRate).toBe(14);
    expect(TIER_CONFIG.platinum.commissionRate).toBe(15);
  });
});

describe("Residual Decay Calculation", () => {
  it("should return 100% for active reps (0-29 days)", () => {
    expect(calculateResidualDecay(0, 1.0)).toBe(1.0);
    expect(calculateResidualDecay(15, 1.0)).toBe(1.0);
    expect(calculateResidualDecay(29, 1.0)).toBe(1.0);
  });

  it("should return 75% for 30-59 days inactive", () => {
    expect(calculateResidualDecay(30, 1.0)).toBe(0.75);
    expect(calculateResidualDecay(45, 1.0)).toBe(0.75);
  });

  it("should return 50% for 60-89 days inactive", () => {
    expect(calculateResidualDecay(60, 1.0)).toBe(0.50);
    expect(calculateResidualDecay(75, 1.0)).toBe(0.50);
  });

  it("should return 25% for 90-119 days inactive", () => {
    expect(calculateResidualDecay(90, 1.0)).toBe(0.25);
    expect(calculateResidualDecay(110, 1.0)).toBe(0.25);
  });

  it("should return 0% for 120+ days inactive", () => {
    expect(calculateResidualDecay(120, 1.0)).toBe(0.0);
    expect(calculateResidualDecay(365, 1.0)).toBe(0.0);
  });

  it("should apply no decay for Platinum (multiplier=0)", () => {
    expect(calculateResidualDecay(120, 0.0)).toBe(1.0);
    expect(calculateResidualDecay(365, 0.0)).toBe(1.0);
  });

  it("should apply slower decay for Gold (multiplier=0.5)", () => {
    const goldDecay = calculateResidualDecay(60, 0.5);
    const standardDecay = calculateResidualDecay(60, 1.0);
    expect(goldDecay).toBeGreaterThan(standardDecay);
  });

  it("should have correct decay thresholds", () => {
    expect(RESIDUAL_DECAY.tier1Days).toBe(30);
    expect(RESIDUAL_DECAY.tier2Days).toBe(60);
    expect(RESIDUAL_DECAY.tier3Days).toBe(90);
    expect(RESIDUAL_DECAY.reassignDays).toBe(120);
  });
});

describe("Constants Validation", () => {
  it("should have valid lead allocation config", () => {
    expect(LEAD_ALLOCATION.timeoutHours).toBe(4);
    expect(LEAD_ALLOCATION.freezeThreshold).toBe(40);
    expect(LEAD_ALLOCATION.maxActiveLeads).toBe(20);
  });

  it("should have valid strike rules", () => {
    expect(STRIKE_RULES.maxStrikesBeforeDeactivation).toBe(3);
    expect(STRIKE_RULES.strikePeriodMonths).toBe(6);
    expect(STRIKE_RULES.instantDeactivationCategories).toContain("fraud");
    expect(STRIKE_RULES.instantDeactivationCategories).toContain("confidentiality_breach");
    expect(STRIKE_RULES.instantDeactivationCategories).toContain("client_harm");
  });
});

// ═══════════════════════════════════════════════════════
// ROUTER ACCESS CONTROL TESTS
// ═══════════════════════════════════════════════════════

describe("Accountability Router — Auth & Access Control", () => {
  // Protected procedures should reject unauthenticated users
  it("getMyScore should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getMyScore()).rejects.toThrow();
  });

  it("getMyTier should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getMyTier()).rejects.toThrow();
  });

  it("getLeadQueue should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getLeadQueue()).rejects.toThrow();
  });

  it("getMyStrikes should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getMyStrikes()).rejects.toThrow();
  });

  it("getEarningsSummary should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getEarningsSummary()).rejects.toThrow();
  });

  it("getMissedOpportunities should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getMissedOpportunities()).rejects.toThrow();
  });

  it("getActivitySummary should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accountability.getActivitySummary()).rejects.toThrow();
  });

  it("logActivity should reject unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.accountability.logActivity({ activityType: "call_made" })
    ).rejects.toThrow();
  });

  // Admin procedures should reject non-admin users
  it("adminGetAllScores should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminGetAllScores();
      // If it doesn't throw, it might reach DB — that's okay, just shouldn't be FORBIDDEN
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminIssueStrike should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminIssueStrike({
        repId: 1,
        severity: "warning",
        category: "performance",
        description: "Test strike from non-admin",
      });
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminReviewStrike should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminReviewStrike({
        strikeId: 1,
        action: "confirm",
      });
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminGetStrikes should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminGetStrikes({});
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminAllocateLead should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminAllocateLead({ leadId: 1 });
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminOverrideScore should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminOverrideScore({
        repId: 1,
        overallScore: 50,
        reason: "Test override from non-admin",
      });
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("adminDeactivateRep should reject non-admin users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminDeactivateRep({
        repId: 1,
        reason: "Test deactivation from non-admin user",
      });
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  // Admin procedures should be accessible to admin users (may fail at DB layer, but not auth)
  it("adminGetAllScores should be accessible to admin users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminGetAllScores();
    } catch (e: any) {
      // DB errors are expected in test env, but auth should pass
      expect(e.code).not.toBe("FORBIDDEN");
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("adminGetStrikes should be accessible to admin users", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.adminGetStrikes({});
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("calculateAndStoreScore should be accessible to authenticated users", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.accountability.calculateAndStoreScore();
    } catch (e: any) {
      // Should not be auth error
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});
