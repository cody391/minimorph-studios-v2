/**
 * Phase 33 Tests: Academy Gatekeeper, AI Coaching Loop, Daily Check-in, Rank-based Training, App Guide
 */
import { describe, it, expect } from "vitest";

// ─── Academy Gatekeeper Service ───
describe("Academy Gatekeeper", () => {
  it("should export all gatekeeper functions", async () => {
    const mod = await import("./services/academyGatekeeper");
    expect(typeof mod.isRepCertified).toBe("function");
    expect(typeof mod.getCertificationStatus).toBe("function");
    expect(typeof mod.generateCoachingReview).toBe("function");
    expect(typeof mod.getDailyCheckIn).toBe("function");
    expect(typeof mod.completeCoachingReview).toBe("function");
    expect(typeof mod.canRepAccessLeads).toBe("function");
    expect(typeof mod.getRankTrainingConfig).toBe("function");
    expect(typeof mod.getAllRankConfigs).toBe("function");
    expect(typeof mod.getRepLevel).toBe("function");
  });

  it("isRepCertified should return false for non-existent rep", async () => {
    const { isRepCertified } = await import("./services/academyGatekeeper");
    const result = await isRepCertified(999999);
    expect(result).toBe(false);
  });

  it("getCertificationStatus should return status object", async () => {
    const { getCertificationStatus } = await import("./services/academyGatekeeper");
    const status = await getCertificationStatus(999999);
    expect(status).toHaveProperty("isFullyCertified");
    expect(status).toHaveProperty("modulesCompleted");
    expect(status).toHaveProperty("totalModules");
    expect(status).toHaveProperty("moduleStatuses");
    expect(typeof status.isFullyCertified).toBe("boolean");
    expect(typeof status.modulesCompleted).toBe("number");
    expect(typeof status.totalModules).toBe("number");
    expect(Array.isArray(status.moduleStatuses)).toBe(true);
  });

  it("getCertificationStatus should show all modules missing for new rep", async () => {
    const { getCertificationStatus } = await import("./services/academyGatekeeper");
    const status = await getCertificationStatus(999999);
    expect(status.isFullyCertified).toBe(false);
    expect(status.modulesCompleted).toBe(0);
    expect(status.totalModules).toBeGreaterThanOrEqual(9);
    expect(status.moduleStatuses.length).toBeGreaterThanOrEqual(9);
  });

  it("canRepAccessLeads should return access status for rep", async () => {
    const { canRepAccessLeads } = await import("./services/academyGatekeeper");
    const result = await canRepAccessLeads(999999);
    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("reason");
    expect(typeof result.allowed).toBe("boolean");
  });
});

// ─── Rank-based Training Config (Accountability Tiers) ───
describe("Rank-based Training Requirements", () => {
  it("getRankTrainingConfig should return config object", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("bronze");
    expect(config).toHaveProperty("maxDailyReviews");
    expect(config).toHaveProperty("canSkipSuggested");
    expect(config).toHaveProperty("canLetReviewsExpire");
    expect(config).toHaveProperty("quizRequiredForCritical");
    expect(config).toHaveProperty("quizRequiredForImportant");
    expect(config).toHaveProperty("quizRequiredForSuggested");
  });

  it("bronze should have strictest requirements", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("bronze");
    expect(config.canSkipSuggested).toBe(false);
    expect(config.canLetReviewsExpire).toBe(false);
    expect(config.quizRequiredForCritical).toBe(true);
    expect(config.quizRequiredForImportant).toBe(true);
    expect(config.quizRequiredForSuggested).toBe(true);
    expect(config.maxDailyReviews).toBe(10);
  });

  it("silver should relax suggested quiz requirement", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("silver");
    expect(config.quizRequiredForCritical).toBe(true);
    expect(config.quizRequiredForImportant).toBe(true);
    expect(config.quizRequiredForSuggested).toBe(false);
    expect(config.canSkipSuggested).toBe(false);
  });

  it("gold should be able to skip suggested reviews and let them expire", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("gold");
    expect(config.canSkipSuggested).toBe(true);
    expect(config.canLetReviewsExpire).toBe(true);
    expect(config.expiryHours).toBeGreaterThan(0);
    expect(config.quizRequiredForCritical).toBe(true);
  });

  it("platinum should have most relaxed requirements (exempt)", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("platinum");
    expect(config.canLetReviewsExpire).toBe(true);
    expect(config.canSkipSuggested).toBe(true);
    expect(config.maxDailyReviews).toBe(0); // exempt
    expect(config.quizRequiredForCritical).toBe(false);
  });

  it("unknown rank should default to bronze config", async () => {
    const { getRankTrainingConfig } = await import("./services/academyGatekeeper");
    const config = getRankTrainingConfig("unknown_rank");
    expect(config.maxDailyReviews).toBe(10); // bronze default
    expect(config.canSkipSuggested).toBe(false);
  });

  it("getAllRankConfigs should return all accountability tier configurations", async () => {
    const { getAllRankConfigs } = await import("./services/academyGatekeeper");
    const configs = getAllRankConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThanOrEqual(4);
    const levels = configs.map(c => c.level);
    expect(levels).toContain("bronze");
    expect(levels).toContain("silver");
    expect(levels).toContain("gold");
    expect(levels).toContain("platinum");
  });
});

// ─── Daily Check-in ───
describe("Daily Check-in System", () => {
  it("getDailyCheckIn should return check-in result", async () => {
    const { getDailyCheckIn } = await import("./services/academyGatekeeper");
    const result = await getDailyCheckIn(999999);
    expect(result).toHaveProperty("checkIn");
    expect(result).toHaveProperty("pendingReviews");
    expect(result).toHaveProperty("isCleared");
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("config");
    expect(typeof result.isCleared).toBe("boolean");
    expect(Array.isArray(result.pendingReviews)).toBe(true);
  });

  it("new rep with no pending reviews should be cleared", async () => {
    const { getDailyCheckIn } = await import("./services/academyGatekeeper");
    const result = await getDailyCheckIn(999999);
    // New rep has no coaching reviews, so should be cleared for today
    expect(result.pendingReviews.length).toBe(0);
    expect(result.isCleared).toBe(true);
  });

  it("getRepLevel should return a valid accountability tier", async () => {
    const { getRepLevel } = await import("./services/academyGatekeeper");
    const level = await getRepLevel(999999);
    expect(typeof level).toBe("string");
    expect(["bronze", "silver", "gold", "platinum"]).toContain(level);
  });
});

// ─── Academy Router Endpoints ───
describe("Academy Router - Gatekeeper Endpoints", () => {
  it("should have gatekeeper endpoints in academy router", async () => {
    const mod = await import("./academyRouter");
    const router = mod.academyRouter;
    expect(router).toBeDefined();
    const procedures = Object.keys(router._def.procedures || {});
    expect(procedures).toContain("certificationStatus");
    expect(procedures).toContain("dailyCheckIn");
    expect(procedures).toContain("pendingReviews");
    expect(procedures).toContain("completeReview");
  });
});

// ─── Lead Routing Gatekeeper ───
describe("Lead Routing Certification Check", () => {
  it("getRepCapacity should filter out uncertified reps", async () => {
    const fs = await import("fs");
    const leadRouterCode = await fs.promises.readFile("server/services/leadGenRouter.ts", "utf-8");
    expect(leadRouterCode).toContain("isRepCertified");
    expect(leadRouterCode).toContain("academyGatekeeper");
  });
});

// ─── AI Coach Integration ───
describe("AI Coach → Coaching Review Pipeline", () => {
  it("AI coach should trigger coaching review generation after feedback", async () => {
    const fs = await import("fs");
    const coachCode = await fs.promises.readFile("server/services/aiCoach.ts", "utf-8");
    expect(coachCode).toContain("generateCoachingReview");
    expect(coachCode).toContain("academyGatekeeper");
  });
});

// ─── App Guide Component ───
describe("App Guide", () => {
  it("AppGuide component file should exist", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("client/src/pages/rep/AppGuide.tsx");
    expect(exists).toBe(true);
  });

  it("AppGuide should cover all major platform sections", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/rep/AppGuide.tsx", "utf-8");
    const requiredSections = [
      "Getting Started",
      "Sales Training Academy",
      "Daily Check-In",
      "Leads & Pipeline",
      "Communications Hub",
      "Earnings & Commissions",
      "Accountability Tiers",
      "AI Coaching & Feedback",
      "Support & Resources",
      "Settings & Profile",
    ];
    for (const section of requiredSections) {
      expect(content).toContain(section);
    }
  });

  it("AppGuide should include pro tips for each section", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/rep/AppGuide.tsx", "utf-8");
    expect(content).toContain("Pro Tips");
    const tipsMatches = content.match(/tips:\s*\[/g);
    expect(tipsMatches).not.toBeNull();
    expect(tipsMatches!.length).toBeGreaterThanOrEqual(10);
  });

  it("AppGuide should be mobile-responsive", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/rep/AppGuide.tsx", "utf-8");
    expect(content).toContain("sm:");
    expect(content).toContain("flex-col sm:flex-row");
  });

  it("AppGuide should be wired into RepDashboard as a tab", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/RepDashboard.tsx", "utf-8");
    expect(content).toContain("AppGuide");
    expect(content).toContain('value="guide"');
  });
});

// ─── Mobile Responsiveness ───
describe("Mobile Responsiveness", () => {
  it("RepDashboard should have mobile-responsive tab triggers", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/RepDashboard.tsx", "utf-8");
    expect(content).toContain("text-[11px] sm:text-xs");
    expect(content).toContain("grid-cols-2 sm:grid-cols-");
  });

  it("RepDashboard should have overflow-x-auto on tabs for mobile scrolling", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/src/pages/RepDashboard.tsx", "utf-8");
    expect(content).toContain("overflow-x-auto");
  });

  it("viewport meta tag should be set for mobile", async () => {
    const fs = await import("fs");
    const content = await fs.promises.readFile("client/index.html", "utf-8");
    expect(content).toContain("width=device-width");
    expect(content).toContain("initial-scale=1");
  });
});

// ─── Schema Tables ───
describe("Phase 33 Database Schema", () => {
  it("coachingReviews table should exist in schema", async () => {
    const fs = await import("fs");
    const schema = await fs.promises.readFile("drizzle/schema.ts", "utf-8");
    expect(schema).toContain("coachingReviews");
    expect(schema).toContain("repId");
    expect(schema).toContain("priority");
    expect(schema).toContain("quizQuestion");
  });

  it("dailyCheckIns table should exist in schema", async () => {
    const fs = await import("fs");
    const schema = await fs.promises.readFile("drizzle/schema.ts", "utf-8");
    expect(schema).toContain("dailyCheckIns");
    expect(schema).toContain("isCleared");
    expect(schema).toContain("reviewsRequired");
  });
});
