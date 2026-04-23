import { describe, it, expect, vi } from "vitest";

// ═══════════════════════════════════════════════════════
// Phase 29: Lead Gen Engine Improvements Tests
// ═══════════════════════════════════════════════════════

describe("Phase 29: Lead Gen Engine Improvements", () => {
  // ─── Website Audit PDF ───
  describe("Website Audit Service", () => {
    it("should export generateAuditReport and generateAuditForLead", async () => {
      const mod = await import("./services/leadGenAudit");
      expect(typeof mod.generateAuditReport).toBe("function");
      expect(typeof mod.generateAuditForLead).toBe("function");
    });

    it("should export audit grade calculation logic", async () => {
      const mod = await import("./services/leadGenAudit");
      // The module should have the main functions for generating audits
      expect(mod.generateAuditReport).toBeDefined();
      expect(mod.generateAuditForLead).toBeDefined();
    });
  });

  // ─── Smart Outreach ───
  describe("Smart Outreach Service", () => {
    it("should export all smart outreach functions", async () => {
      const mod = await import("./services/leadGenSmartOutreach");
      expect(typeof mod.analyzeLeadBehavior).toBe("function");
      expect(typeof mod.scheduleBranchedOutreach).toBe("function");
      expect(typeof mod.runReengagementCampaign).toBe("function");
      expect(typeof mod.recordIntentSignal).toBe("function");
      expect(typeof mod.getOptimalSendTime).toBe("function");
    });

    it("should export getOptimalSendTime and generateTrackingUrl", async () => {
      const mod = await import("./services/leadGenSmartOutreach");
      expect(typeof mod.getOptimalSendTime).toBe("function");
      expect(typeof mod.generateTrackingUrl).toBe("function");
    });

    it("getOptimalSendTime should return a valid Date", async () => {
      const mod = await import("./services/leadGenSmartOutreach");
      const result = mod.getOptimalSendTime("email");
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });

    it("generateTrackingUrl should produce a valid URL with params", async () => {
      const mod = await import("./services/leadGenSmartOutreach");
      const url = mod.generateTrackingUrl("https://example.com", 42, "test_campaign");
      expect(url).toContain("utm_source");
      expect(url).toContain("42");
      expect(url).toContain("test_campaign");
    });
  });

  // ─── ML Scoring ───
  describe("ML Scoring Service", () => {
    it("should export scoring functions", async () => {
      const mod = await import("./services/leadGenScoring");
      expect(typeof mod.scoreLeadML).toBe("function");
      expect(typeof mod.rescoreAllLeads).toBe("function");
      expect(typeof mod.getScoringInsights).toBe("function");
      expect(typeof mod.getScoringWeights).toBe("function");
    });

    it("getScoringWeights should return default weights when no data", async () => {
      const mod = await import("./services/leadGenScoring");
      const weights = await mod.getScoringWeights();
      expect(weights).toBeDefined();
      expect(weights.noWebsite).toBeGreaterThan(0);
      expect(weights.badWebsiteScore).toBeGreaterThan(0);
      expect(weights.hasPhone).toBeGreaterThan(0);
      expect(weights.hasEmail).toBeGreaterThan(0);
      expect(weights.selfSourcedBonus).toBeGreaterThan(0);
      expect(weights.intentSignalBonus).toBeGreaterThan(0);
      expect(weights.replyBonus).toBeGreaterThan(0);
      expect(typeof weights.industryMultiplier).toBe("object");
      expect(typeof weights.updatedAt).toBe("string");
      expect(typeof weights.sampleSize).toBe("number");
    });
  });

  // ─── Multi-Source Scraping ───
  describe("Multi-Source Scraping Service", () => {
    it("should export multi-source functions", async () => {
      const mod = await import("./services/leadGenMultiSource");
      expect(typeof mod.scrapeYelp).toBe("function");
      expect(typeof mod.scrapeGoogleExpanded).toBe("function");
      expect(typeof mod.deduplicateBusinesses).toBe("function");
      expect(typeof mod.runMultiSourceScrape).toBe("function");
      expect(typeof mod.findCompetitors).toBe("function");
      expect(typeof mod.enrichWithCompetitors).toBe("function");
    });

    it("deduplicateBusinesses should remove duplicates by name+address", async () => {
      const mod = await import("./services/leadGenMultiSource");
      const businesses = [
        { businessName: "Joe's Pizza", address: "123 Main St", source: "google_maps" as const, hasWebsite: false },
        { businessName: "Joe's Pizza", address: "123 Main St", source: "yelp" as const, hasWebsite: false, phone: "555-1234" },
        { businessName: "Different Place", address: "456 Oak Ave", source: "google_maps" as const, hasWebsite: true },
      ];

      const result = mod.deduplicateBusinesses(businesses);
      expect(result.length).toBe(2);
      // The first Joe's Pizza should have the phone merged from the duplicate
      const joes = result.find(b => b.businessName === "Joe's Pizza");
      expect(joes?.phone).toBe("555-1234");
    });

    it("deduplicateBusinesses should handle empty array", async () => {
      const mod = await import("./services/leadGenMultiSource");
      const result = mod.deduplicateBusinesses([]);
      expect(result).toEqual([]);
    });

    it("deduplicateBusinesses should merge website from duplicate", async () => {
      const mod = await import("./services/leadGenMultiSource");
      const businesses = [
        { businessName: "Test Biz", address: "100 Test Rd", source: "google_maps" as const, hasWebsite: false },
        { businessName: "Test Biz", address: "100 Test Rd", source: "yelp" as const, hasWebsite: true, website: "https://testbiz.com" },
      ];

      const result = mod.deduplicateBusinesses(businesses);
      expect(result.length).toBe(1);
      expect(result[0].website).toBe("https://testbiz.com");
    });
  });

  // ─── Proposal Generation ───
  describe("Proposal Generation Service", () => {
    it("should export proposal and performance functions", async () => {
      const mod = await import("./services/leadGenProposal");
      expect(typeof mod.generateProposal).toBe("function");
      expect(typeof mod.getRepPerformanceMetrics).toBe("function");
      expect(typeof mod.findBestRepByPerformance).toBe("function");
    });
  });

  // ─── tRPC Router ───
  describe("Lead Gen Router (Phase 29 endpoints)", () => {
    it("should export leadGenRouter with all Phase 29 endpoints", async () => {
      const mod = await import("./leadGenRouter");
      const router = mod.leadGenRouter;
      expect(router).toBeDefined();

      // Check Phase 29 specific endpoints exist
      const procedures = router._def.procedures as Record<string, unknown>;
      expect(procedures.generateAudit).toBeDefined();
      expect(procedures.generateAuditForLead).toBeDefined();
      expect(procedures.analyzeLeadBehavior).toBeDefined();
      expect(procedures.scheduleBranchedOutreach).toBeDefined();
      expect(procedures.runReengagement).toBeDefined();
      expect(procedures.recordIntentSignal).toBeDefined();
      expect(procedures.scoreLeadML).toBeDefined();
      expect(procedures.rescoreAllLeads).toBeDefined();
      expect(procedures.getScoringInsights).toBeDefined();
      expect(procedures.runMultiSourceScrape).toBeDefined();
      expect(procedures.enrichWithCompetitors).toBeDefined();
      expect(procedures.generateProposal).toBeDefined();
      expect(procedures.getRepPerformance).toBeDefined();
      expect(procedures.findBestRep).toBeDefined();
      expect(procedures.runEnhancedPipeline).toBeDefined();
    });
  });

  // ─── Integration: Scheduler wiring ───
  describe("Lead Gen Scheduler", () => {
    it("should export startLeadGenScheduler and stopLeadGenScheduler", async () => {
      const mod = await import("./services/leadGenScheduler");
      expect(typeof mod.startLeadGenScheduler).toBe("function");
      expect(typeof mod.stopLeadGenScheduler).toBe("function");
      expect(typeof mod.isSchedulerRunning).toBe("function");
    });
  });

  // ─── Scoring weights boundaries ───
  describe("Scoring weight boundaries", () => {
    it("default weights should be within valid ranges", async () => {
      const mod = await import("./services/leadGenScoring");
      const weights = await mod.getScoringWeights();

      // All weights should be positive
      expect(weights.noWebsite).toBeGreaterThanOrEqual(5);
      expect(weights.noWebsite).toBeLessThanOrEqual(40);
      expect(weights.badWebsiteScore).toBeGreaterThanOrEqual(5);
      expect(weights.badWebsiteScore).toBeLessThanOrEqual(30);
      expect(weights.hasPhone).toBeGreaterThanOrEqual(2);
      expect(weights.hasPhone).toBeLessThanOrEqual(20);
      expect(weights.hasEmail).toBeGreaterThanOrEqual(2);
      expect(weights.hasEmail).toBeLessThanOrEqual(15);
      expect(weights.selfSourcedBonus).toBeGreaterThanOrEqual(5);
      expect(weights.selfSourcedBonus).toBeLessThanOrEqual(30);
    });
  });
});
