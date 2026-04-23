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

function createRepContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 2,
    openId: "rep-user",
    email: "rep@minimorph.com",
    name: "Rep User",
    loginMethod: "manus",
    role: "user",
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

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

/* ═══════════════════════════════════════════════════════
   LEAD GEN ENGINE TESTS
   ═══════════════════════════════════════════════════════ */

describe("Lead Gen Engine", () => {
  /* ─── Router structure ─── */
  describe("Router structure", () => {
    it("leadGen router exists on appRouter", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen).toBeDefined();
    });

    it("leadGen has getStats procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.getStats).toBeDefined();
    });

    it("leadGen has createScrapeJob procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.createScrapeJob).toBeDefined();
    });

    it("leadGen has scoreWebsites procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.scoreWebsites).toBeDefined();
    });

    it("leadGen has enrichBusinesses procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.enrichBusinesses).toBeDefined();
    });

    it("leadGen has convertToLeads procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.convertToLeads).toBeDefined();
    });

    it("leadGen has autoFeedReps procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.autoFeedReps).toBeDefined();
    });

    it("leadGen has runFullPipeline procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.runFullPipeline).toBeDefined();
    });

    it("leadGen has sendDueOutreach procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.sendDueOutreach).toBeDefined();
    });

    it("leadGen has scanForEnterprise procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.scanForEnterprise).toBeDefined();
    });

    it("leadGen has getRepCapacity procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.getRepCapacity).toBeDefined();
    });

    it("leadGen has listScrapeJobs procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.listScrapeJobs).toBeDefined();
    });

    it("leadGen has listScrapedBusinesses procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.listScrapedBusinesses).toBeDefined();
    });

    it("leadGen has listEnterpriseProspects procedure", () => {
      const { ctx } = createAdminContext();
      const c = caller(ctx);
      expect(c.leadGen.listEnterpriseProspects).toBeDefined();
    });
  });

  /* ─── Access control ─── */
  describe("Access control", () => {
    it("non-admin cannot access getStats", async () => {
      const { ctx } = createRepContext();
      const c = caller(ctx);
      await expect(c.leadGen.getStats()).rejects.toThrow();
    });

    it("non-admin cannot create scrape jobs", async () => {
      const { ctx } = createRepContext();
      const c = caller(ctx);
      await expect(c.leadGen.createScrapeJob({ targetArea: "Austin, TX" })).rejects.toThrow();
    });

    it("non-admin cannot run full pipeline", async () => {
      const { ctx } = createRepContext();
      const c = caller(ctx);
      await expect(c.leadGen.runFullPipeline()).rejects.toThrow();
    });

    it("non-admin cannot scan for enterprise", async () => {
      const { ctx } = createRepContext();
      const c = caller(ctx);
      await expect(c.leadGen.scanForEnterprise({ limit: 5 })).rejects.toThrow();
    });
  });

  /* ─── Service module exports ─── */
  describe("Service module exports", () => {
    it("leadGenScraper exports expected functions", async () => {
      const mod = await import("./services/leadGenScraper");
      expect(mod.runScrapeJob).toBeDefined();
      expect(mod.scoreWebsite).toBeDefined();
      expect(mod.scoreUnscrapedWebsites).toBeDefined();
      expect(mod.createScrapeJob).toBeDefined();
      expect(mod.LOW_HANGING_FRUIT_TYPES).toBeDefined();
    });

    it("leadGenEnrichment exports expected functions", async () => {
      const mod = await import("./services/leadGenEnrichment");
      expect(mod.enrichBusiness).toBeDefined();
      expect(mod.enrichQualifiedBusinesses).toBeDefined();
      expect(mod.convertToLead).toBeDefined();
      expect(mod.batchConvertToLeads).toBeDefined();
    });

    it("leadGenOutreach exports expected functions", async () => {
      const mod = await import("./services/leadGenOutreach");
      expect(mod.generateOutreachMessage).toBeDefined();
      expect(mod.scheduleOutreachSequence).toBeDefined();
      expect(mod.sendDueOutreach).toBeDefined();
      expect(mod.handleInboundReply).toBeDefined();
    });

    it("leadGenRouter exports expected functions", async () => {
      const mod = await import("./services/leadGenRouter");
      expect(mod.getRepCapacity).toBeDefined();
      expect(mod.autoFeedReps).toBeDefined();
      expect(mod.autoStartOutreach).toBeDefined();
      expect(mod.getEngineStats).toBeDefined();
    });

    it("leadGenEnterprise exports expected functions", async () => {
      const mod = await import("./services/leadGenEnterprise");
      expect(mod.analyzeForEnterprise).toBeDefined();
      expect(mod.scanForEnterpriseLeads).toBeDefined();
      expect(mod.listEnterpriseProspects).toBeDefined();
      expect(mod.updateEnterpriseProspect).toBeDefined();
    });

    it("leadGenScheduler exports expected functions", async () => {
      const mod = await import("./services/leadGenScheduler");
      expect(mod.startLeadGenScheduler).toBeDefined();
      expect(mod.stopLeadGenScheduler).toBeDefined();
      expect(mod.isSchedulerRunning).toBeDefined();
    });
  });

  /* ─── Scheduler behavior ─── */
  describe("Scheduler", () => {
    it("isSchedulerRunning returns false before start", async () => {
      const mod = await import("./services/leadGenScheduler");
      // Stop if running from previous test
      mod.stopLeadGenScheduler();
      expect(mod.isSchedulerRunning()).toBe(false);
    });

    it("LOW_HANGING_FRUIT_TYPES contains expected business types", async () => {
      const { LOW_HANGING_FRUIT_TYPES } = await import("./services/leadGenScraper");
      expect(Array.isArray(LOW_HANGING_FRUIT_TYPES)).toBe(true);
      expect(LOW_HANGING_FRUIT_TYPES.length).toBeGreaterThan(5);
      // Should include common low-hanging fruit types
      const types = LOW_HANGING_FRUIT_TYPES.map((t: string) => t.toLowerCase());
      expect(types.some((t: string) => t.includes("restaurant") || t.includes("salon") || t.includes("contractor"))).toBe(true);
    });
  });
});
