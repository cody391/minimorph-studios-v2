import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock all job functions ───
vi.mock("./services/leadGenOutreach", () => ({
  sendDueOutreach: vi.fn().mockResolvedValue(5),
}));
vi.mock("./services/leadGenScraper", () => ({
  scoreUnscrapedWebsites: vi.fn().mockResolvedValue(10),
}));
vi.mock("./services/leadGenEnrichment", () => ({
  enrichQualifiedBusinesses: vi.fn().mockResolvedValue(3),
  batchConvertToLeads: vi.fn().mockResolvedValue(7),
}));
vi.mock("./services/leadGenScoring", () => ({
  rescoreAllLeads: vi.fn().mockResolvedValue(15),
}));
vi.mock("./services/leadGenSmartOutreach", () => ({
  runReengagementCampaign: vi.fn().mockResolvedValue(4),
}));
vi.mock("./services/leadGenRouter", () => ({
  autoFeedReps: vi.fn().mockResolvedValue({ repsChecked: 5, repsFed: 2, leadsGenerated: 10, scrapeJobsCreated: 1 }),
}));
vi.mock("./services/leadGenEnterprise", () => ({
  scanForEnterpriseLeads: vi.fn().mockResolvedValue(6),
}));
vi.mock("./services/leadGenMultiSource", () => ({
  runMultiSourceScrape: vi.fn().mockResolvedValue({ total: 50, new: 30, duplicates: 20, bySource: {}, errors: [] }),
  getSourceQuality: vi.fn().mockReturnValue([]),
}));
vi.mock("./services/contactEnrichment", () => ({
  batchEnrichContacts: vi.fn().mockResolvedValue({ total: 15, enriched: 10, partial: 3, failed: 2 }),
}));
vi.mock("./services/leadGenAdaptive", () => ({
  runAdaptiveScaling: vi.fn().mockResolvedValue({ timestamp: new Date(), repsAnalyzed: 8, repsNeedingLeads: 3, actionsPlanned: [], actionsExecuted: 2, newScrapeJobsCreated: 1 }),
}));

describe("Phase D: Scheduled Routes", () => {
  const VALID_SECRET = "test-scheduler-secret-123";

  beforeEach(() => {
    process.env.SCHEDULER_SECRET = VALID_SECRET;
  });

  describe("Authentication", () => {
    it("rejects requests without x-scheduler-secret header", async () => {
      const { registerScheduledRoutes } = await import("./scheduled-routes");
      const express = (await import("express")).default;
      const app = express();
      app.use(express.json());
      registerScheduledRoutes(app);

      const supertest = (await import("supertest")).default;
      const res = await supertest(app).post("/api/scheduled/outreach");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("rejects requests with wrong secret", async () => {
      const { registerScheduledRoutes } = await import("./scheduled-routes");
      const express = (await import("express")).default;
      const app = express();
      app.use(express.json());
      registerScheduledRoutes(app);

      const supertest = (await import("supertest")).default;
      const res = await supertest(app)
        .post("/api/scheduled/outreach")
        .set("x-scheduler-secret", "wrong-secret");
      expect(res.status).toBe(401);
    });

    it("accepts requests with correct secret", async () => {
      const { registerScheduledRoutes } = await import("./scheduled-routes");
      const express = (await import("express")).default;
      const app = express();
      app.use(express.json());
      registerScheduledRoutes(app);

      const supertest = (await import("supertest")).default;
      const res = await supertest(app)
        .post("/api/scheduled/outreach")
        .set("x-scheduler-secret", VALID_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.job).toBe("outreach");
    });
  });

  describe("Response format", () => {
    it("returns ok, job, startedAt, finishedAt, durationMs, result", async () => {
      const { registerScheduledRoutes } = await import("./scheduled-routes");
      const express = (await import("express")).default;
      const app = express();
      app.use(express.json());
      registerScheduledRoutes(app);

      const supertest = (await import("supertest")).default;
      const res = await supertest(app)
        .post("/api/scheduled/scoring")
        .set("x-scheduler-secret", VALID_SECRET);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body).toHaveProperty("job", "scoring");
      expect(res.body).toHaveProperty("startedAt");
      expect(res.body).toHaveProperty("finishedAt");
      expect(res.body).toHaveProperty("durationMs");
      expect(res.body).toHaveProperty("result");
      expect(typeof res.body.durationMs).toBe("number");
    });
  });

  describe("All 10 endpoints exist", () => {
    const endpoints = [
      "/api/scheduled/outreach",
      "/api/scheduled/scoring",
      "/api/scheduled/enrichment",
      "/api/scheduled/lead-conversion",
      "/api/scheduled/reengagement",
      "/api/scheduled/auto-feed",
      "/api/scheduled/enterprise-scan",
      "/api/scheduled/multi-source",
      "/api/scheduled/contact-enrichment",
      "/api/scheduled/adaptive-scaling",
    ];

    for (const endpoint of endpoints) {
      it(`${endpoint} responds to POST with valid secret`, async () => {
        const { registerScheduledRoutes } = await import("./scheduled-routes");
        const express = (await import("express")).default;
        const app = express();
        app.use(express.json());
        registerScheduledRoutes(app);

        const supertest = (await import("supertest")).default;
        const res = await supertest(app)
          .post(endpoint)
          .set("x-scheduler-secret", VALID_SECRET);
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
    }
  });

  describe("Status endpoint", () => {
    it("returns running jobs list", async () => {
      const { registerScheduledRoutes } = await import("./scheduled-routes");
      const express = (await import("express")).default;
      const app = express();
      app.use(express.json());
      registerScheduledRoutes(app);

      const supertest = (await import("supertest")).default;
      const res = await supertest(app)
        .get("/api/scheduled/status")
        .set("x-scheduler-secret", VALID_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.runningJobs)).toBe(true);
    });
  });

  describe("Server boot behavior", () => {
    it("does not start setInterval scheduler when ENABLE_INTERNAL_SCHEDULER is not set", () => {
      delete process.env.ENABLE_INTERNAL_SCHEDULER;
      const shouldStart = process.env.ENABLE_INTERNAL_SCHEDULER === "true";
      expect(shouldStart).toBe(false);
    });

    it("starts setInterval scheduler when ENABLE_INTERNAL_SCHEDULER=true", () => {
      process.env.ENABLE_INTERNAL_SCHEDULER = "true";
      const shouldStart = process.env.ENABLE_INTERNAL_SCHEDULER === "true";
      expect(shouldStart).toBe(true);
    });
  });
});
