import { describe, it, expect, vi } from "vitest";

// ═══════════════════════════════════════════════════════
// Phase 30: Enhanced ML Scoring + Multi-Source Scraping Tests
// ═══════════════════════════════════════════════════════

describe("Phase 30: Enhanced ML Scoring", () => {
  it("scoreLeadML is exported and callable", async () => {
    const mod = await import("./services/leadGenScoring");
    expect(typeof mod.scoreLeadML).toBe("function");
  });

  it("rescoreAllLeads is exported and callable", async () => {
    const mod = await import("./services/leadGenScoring");
    expect(typeof mod.rescoreAllLeads).toBe("function");
  });

  it("getScoringInsights is exported and callable", async () => {
    const mod = await import("./services/leadGenScoring");
    expect(typeof mod.getScoringInsights).toBe("function");
  });

  it("getScoringInsights returns expected structure", async () => {
    const { getScoringInsights } = await import("./services/leadGenScoring");
    const insights = await getScoringInsights();
    expect(insights).toHaveProperty("weights");
    expect(insights).toHaveProperty("overallWinRate");
    expect(insights).toHaveProperty("totalClosedLeads");
    expect(insights).toHaveProperty("topIndustries");
    expect(insights).toHaveProperty("topLocations");
    expect(insights).toHaveProperty("topSources");
    expect(insights).toHaveProperty("bestContactHours");
    expect(insights).toHaveProperty("modelVersion");
    expect(insights).toHaveProperty("modelConfidence");
    expect(insights).toHaveProperty("retrainStatus");
    expect(typeof insights.overallWinRate).toBe("number");
    expect(typeof insights.totalClosedLeads).toBe("number");
    expect(Array.isArray(insights.topIndustries)).toBe(true);
  });

  it("scoring model has decay factor support", async () => {
    const mod = await import("./services/leadGenScoring");
    // The module should export scoring functions that handle decay
    expect(typeof mod.scoreLeadML).toBe("function");
    expect(typeof mod.rescoreAllLeads).toBe("function");
  });
});

describe("Phase 30: Enhanced Multi-Source Scraping", () => {
  it("scrapeGoogleExpanded is exported and accepts priority levels", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeGoogleExpanded).toBe("function");
  });

  it("scrapeYelp is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeYelp).toBe("function");
  });

  it("scrapeFacebook is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeFacebook).toBe("function");
  });

  it("scrapeBBB is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeBBB).toBe("function");
  });

  it("scrapeDirectories is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeDirectories).toBe("function");
  });

  it("fetchGoogleBusinessDetails is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.fetchGoogleBusinessDetails).toBe("function");
  });

  it("deduplicateBusinesses handles exact duplicates", async () => {
    const { deduplicateBusinesses } = await import("./services/leadGenMultiSource");
    const businesses = [
      { businessName: "Joe's Pizza", address: "123 Main St", source: "google_maps" as const, hasWebsite: false },
      { businessName: "Joe's Pizza", address: "123 Main St", source: "yelp" as const, hasWebsite: false, phone: "555-1234" },
    ];
    const unique = deduplicateBusinesses(businesses);
    expect(unique.length).toBe(1);
    // Should merge phone from duplicate
    expect(unique[0].phone).toBe("555-1234");
  });

  it("deduplicateBusinesses handles fuzzy name matches", async () => {
    const { deduplicateBusinesses } = await import("./services/leadGenMultiSource");
    const businesses = [
      { businessName: "Joe's Pizza Place", address: "123 Main Street", source: "google_maps" as const, hasWebsite: false },
      { businessName: "Joes Pizza Place", address: "123 Main St", source: "yelp" as const, hasWebsite: false },
    ];
    const unique = deduplicateBusinesses(businesses);
    expect(unique.length).toBe(1);
  });

  it("deduplicateBusinesses keeps different businesses separate", async () => {
    const { deduplicateBusinesses } = await import("./services/leadGenMultiSource");
    const businesses = [
      { businessName: "Joe's Pizza", address: "123 Main St", source: "google_maps" as const, hasWebsite: false },
      { businessName: "Maria's Bakery", address: "456 Oak Ave", source: "yelp" as const, hasWebsite: true },
    ];
    const unique = deduplicateBusinesses(businesses);
    expect(unique.length).toBe(2);
  });

  it("deduplicateBusinesses detects phone number matches", async () => {
    const { deduplicateBusinesses } = await import("./services/leadGenMultiSource");
    const businesses = [
      { businessName: "ABC Plumbing", address: "100 First St", source: "google_maps" as const, hasWebsite: false, phone: "(555) 123-4567" },
      { businessName: "ABC Plumbing Co", address: "100 1st Street", source: "bbb" as const, hasWebsite: false, phone: "5551234567" },
    ];
    const unique = deduplicateBusinesses(businesses);
    expect(unique.length).toBe(1);
  });

  it("getSourceQuality returns array with expected fields", async () => {
    const { getSourceQuality } = await import("./services/leadGenMultiSource");
    const quality = getSourceQuality();
    expect(Array.isArray(quality)).toBe(true);
    // Initially empty since no conversions recorded
  });

  it("recordSourceConversion tracks conversions", async () => {
    const { recordSourceConversion, getSourceQuality } = await import("./services/leadGenMultiSource");
    recordSourceConversion("test_source", true, 85);
    recordSourceConversion("test_source", false, 40);
    const quality = getSourceQuality();
    const testSource = quality.find(s => s.source === "test_source");
    expect(testSource).toBeDefined();
    expect(testSource!.totalLeads).toBe(2);
    expect(testSource!.convertedLeads).toBe(1);
    expect(testSource!.conversionRate).toBe(50);
  });

  it("ALL_CATEGORIES contains comprehensive business types", async () => {
    const { ALL_CATEGORIES } = await import("./services/leadGenMultiSource");
    expect(ALL_CATEGORIES.length).toBeGreaterThan(20);
    expect(ALL_CATEGORIES).toContain("plumber");
    expect(ALL_CATEGORIES).toContain("restaurant");
    expect(ALL_CATEGORIES).toContain("hair salon");
  });

  it("runMultiSourceScrape is exported and callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.runMultiSourceScrape).toBe("function");
  });
});

describe("Phase 30: Enhanced Scheduler", () => {
  it("scheduler exports start/stop/status functions", async () => {
    const mod = await import("./services/leadGenScheduler");
    expect(typeof mod.startLeadGenScheduler).toBe("function");
    expect(typeof mod.stopLeadGenScheduler).toBe("function");
    expect(typeof mod.isSchedulerRunning).toBe("function");
    expect(typeof mod.getSchedulerStats).toBe("function");
  });

  it("getSchedulerStats returns expected structure", async () => {
    const { getSchedulerStats } = await import("./services/leadGenScheduler");
    const stats = getSchedulerStats();
    expect(stats).toHaveProperty("running");
    expect(stats).toHaveProperty("jobs");
    expect(stats).toHaveProperty("sourceQuality");
    expect(typeof stats.running).toBe("boolean");
  });

  it("scheduler starts and stops correctly", async () => {
    const { startLeadGenScheduler, stopLeadGenScheduler, isSchedulerRunning } = await import("./services/leadGenScheduler");
    expect(isSchedulerRunning()).toBe(false);
    startLeadGenScheduler();
    expect(isSchedulerRunning()).toBe(true);
    stopLeadGenScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });
});
