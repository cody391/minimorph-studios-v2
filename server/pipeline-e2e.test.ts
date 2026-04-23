import { describe, it, expect } from "vitest";

/**
 * Lead Generation Pipeline — End-to-End Integration Test
 * 
 * Tests every stage of the pipeline in order:
 * Scrape → Score → Enrich Contacts → Convert → Outreach → Smart Outreach →
 * AI Conversation → Rep Routing → Adaptive Scaling → Enterprise → Multi-Source →
 * Audit → Scheduler → DB Helpers → Webhooks → Router Endpoints
 */

// ═══════════════════════════════════════════════════════
// Stage 1: Scraper Service
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 1: Scraper", () => {
  it("createScrapeJob is callable", async () => {
    const mod = await import("./services/leadGenScraper");
    expect(typeof mod.createScrapeJob).toBe("function");
  });
  it("runScrapeJob is callable", async () => {
    const mod = await import("./services/leadGenScraper");
    expect(typeof mod.runScrapeJob).toBe("function");
  });
  it("scoreUnscrapedWebsites is callable", async () => {
    const mod = await import("./services/leadGenScraper");
    expect(typeof mod.scoreUnscrapedWebsites).toBe("function");
  });
  it("LOW_HANGING_FRUIT_TYPES has business categories", async () => {
    const { LOW_HANGING_FRUIT_TYPES } = await import("./services/leadGenScraper");
    expect(Array.isArray(LOW_HANGING_FRUIT_TYPES)).toBe(true);
    expect(LOW_HANGING_FRUIT_TYPES.length).toBeGreaterThan(5);
  });
});

// ═══════════════════════════════════════════════════════
// Stage 2: ML Scoring
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 2: ML Scoring", () => {
  it("scoreLeadML is callable", async () => {
    const mod = await import("./services/leadGenScoring");
    expect(typeof mod.scoreLeadML).toBe("function");
  });
  it("rescoreAllLeads is callable", async () => {
    const mod = await import("./services/leadGenScoring");
    expect(typeof mod.rescoreAllLeads).toBe("function");
  });
  it("getScoringInsights returns valid structure", async () => {
    const { getScoringInsights } = await import("./services/leadGenScoring");
    const insights = await getScoringInsights();
    expect(insights).toHaveProperty("weights");
    expect(insights).toHaveProperty("overallWinRate");
    expect(insights).toHaveProperty("totalClosedLeads");
    expect(insights).toHaveProperty("topIndustries");
    expect(insights).toHaveProperty("modelVersion");
    expect(insights).toHaveProperty("modelConfidence");
    expect(typeof insights.overallWinRate).toBe("number");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 3: Contact Enrichment (Apollo / Hunter / LLM)
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 3: Contact Enrichment", () => {
  it("enrichBusinessContact is callable", async () => {
    const mod = await import("./services/contactEnrichment");
    expect(typeof mod.enrichBusinessContact).toBe("function");
  });
  it("batchEnrichContacts is callable", async () => {
    const mod = await import("./services/contactEnrichment");
    expect(typeof mod.batchEnrichContacts).toBe("function");
  });
  it("getEnrichmentStatus returns API availability", async () => {
    const { getEnrichmentStatus } = await import("./services/contactEnrichment");
    const status = getEnrichmentStatus();
    expect(typeof status.apollo).toBe("boolean");
    expect(typeof status.hunter).toBe("boolean");
    expect(status.llm).toBe(true);
    expect(status.recommendation.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════
// Stage 4: Business → Lead Conversion
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 4: Lead Conversion", () => {
  it("enrichQualifiedBusinesses is callable", async () => {
    const mod = await import("./services/leadGenEnrichment");
    expect(typeof mod.enrichQualifiedBusinesses).toBe("function");
  });
  it("batchConvertToLeads is callable", async () => {
    const mod = await import("./services/leadGenEnrichment");
    expect(typeof mod.batchConvertToLeads).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 5: Outreach Engine
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 5: Outreach", () => {
  it("scheduleOutreachSequence is callable", async () => {
    const mod = await import("./services/leadGenOutreach");
    expect(typeof mod.scheduleOutreachSequence).toBe("function");
  });
  it("sendDueOutreach is callable", async () => {
    const mod = await import("./services/leadGenOutreach");
    expect(typeof mod.sendDueOutreach).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 5b: Smart Outreach (Branching + Re-engagement)
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 5b: Smart Outreach", () => {
  it("analyzeLeadBehavior is callable", async () => {
    const mod = await import("./services/leadGenSmartOutreach");
    expect(typeof mod.analyzeLeadBehavior).toBe("function");
  });
  it("scheduleBranchedOutreach is callable", async () => {
    const mod = await import("./services/leadGenSmartOutreach");
    expect(typeof mod.scheduleBranchedOutreach).toBe("function");
  });
  it("runReengagementCampaign is callable", async () => {
    const mod = await import("./services/leadGenSmartOutreach");
    expect(typeof mod.runReengagementCampaign).toBe("function");
  });
  it("recordIntentSignal is callable", async () => {
    const mod = await import("./services/leadGenSmartOutreach");
    expect(typeof mod.recordIntentSignal).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 6: AI Conversation Agent
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 6: AI Conversation Agent", () => {
  it("handleConversation is callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.handleConversation).toBe("function");
  });
  it("buildBusinessIntelligence is callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.buildBusinessIntelligence).toBe("function");
  });

  // Objection detection tests
  it("detects price objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("That's way too expensive for us");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("price");
  });
  it("detects existing website / status quo objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("We already have a website that works fine");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("status_quo");
  });
  it("detects timing objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("Not the right time, maybe next quarter");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("timing");
  });
  it("detects DIY preference objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("I can just use Wix or Squarespace myself");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("diy");
  });
  it("detects trust/bad experience objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    // Use exact pattern match from the bad_experience regex
    const result = detectObjection("We had a bad experience with the last agency");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("trust");
  });
  it("returns null for neutral messages", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    expect(detectObjection("Hello, I got your message")).toBeNull();
    expect(detectObjection("Thanks for reaching out")).toBeNull();
  });

  // Buying signal detection tests
  it("detects pricing inquiry as strong signal", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("How much does a new website cost?");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("strong");
  });
  it("detects ready-to-buy as strong signal", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("Let's do it, sign me up!");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("strong");
  });
  it("detects feature questions as medium signal", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("Can you add online ordering to the site?");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("medium");
  });
  it("returns null for non-buying messages", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    expect(detectBuyingSignal("ok thanks")).toBeNull();
  });

  // Objection/signal data integrity
  it("COMMON_OBJECTIONS has all required categories", async () => {
    const { COMMON_OBJECTIONS } = await import("./services/leadGenConversationAI");
    expect(COMMON_OBJECTIONS).toHaveProperty("too_expensive");
    expect(COMMON_OBJECTIONS).toHaveProperty("already_have_website");
    expect(COMMON_OBJECTIONS).toHaveProperty("not_right_time");
    expect(COMMON_OBJECTIONS).toHaveProperty("need_to_think");
    expect(COMMON_OBJECTIONS).toHaveProperty("diy_preference");
    expect(COMMON_OBJECTIONS).toHaveProperty("bad_experience");
    expect(COMMON_OBJECTIONS).toHaveProperty("no_need");
    // Each objection has pattern, category, suggestedApproach
    for (const [, obj] of Object.entries(COMMON_OBJECTIONS)) {
      expect(obj.pattern).toBeInstanceOf(RegExp);
      expect(typeof obj.category).toBe("string");
      expect(typeof obj.suggestedApproach).toBe("string");
    }
  });
  it("BUYING_SIGNALS has all required types", async () => {
    const { BUYING_SIGNALS } = await import("./services/leadGenConversationAI");
    expect(BUYING_SIGNALS).toHaveProperty("pricing_inquiry");
    expect(BUYING_SIGNALS).toHaveProperty("timeline_question");
    expect(BUYING_SIGNALS).toHaveProperty("feature_question");
    expect(BUYING_SIGNALS).toHaveProperty("ready_to_buy");
    expect(BUYING_SIGNALS).toHaveProperty("positive_response");
    for (const [, signal] of Object.entries(BUYING_SIGNALS)) {
      expect(signal.pattern).toBeInstanceOf(RegExp);
      expect(["weak", "medium", "strong"]).toContain(signal.strength);
      expect(typeof signal.action).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════
// Stage 7: Rep Routing & Capacity
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 7: Rep Routing", () => {
  it("autoFeedReps is callable", async () => {
    const mod = await import("./services/leadGenRouter");
    expect(typeof mod.autoFeedReps).toBe("function");
  });
  it("autoStartOutreach is callable", async () => {
    const mod = await import("./services/leadGenRouter");
    expect(typeof mod.autoStartOutreach).toBe("function");
  });
  it("getRepCapacity returns data", async () => {
    const { getRepCapacity } = await import("./services/leadGenRouter");
    const capacity = await getRepCapacity();
    expect(capacity).toBeDefined();
  });
  it("getEngineStats returns pipeline metrics", async () => {
    const { getEngineStats } = await import("./services/leadGenRouter");
    const stats = await getEngineStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe("object");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 7b: Performance-Based Routing
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 7b: Performance Routing", () => {
  it("getRepPerformanceMetrics returns array", async () => {
    const { getRepPerformanceMetrics } = await import("./services/leadGenProposal");
    const metrics = await getRepPerformanceMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });
  it("findBestRepByPerformance is callable", async () => {
    const mod = await import("./services/leadGenProposal");
    expect(typeof mod.findBestRepByPerformance).toBe("function");
  });
  it("generateProposal is callable", async () => {
    const mod = await import("./services/leadGenProposal");
    expect(typeof mod.generateProposal).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 8: Adaptive Scaling
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 8: Adaptive Scaling", () => {
  it("analyzeRepCapacity returns reports", async () => {
    const { analyzeRepCapacity } = await import("./services/leadGenAdaptive");
    const reports = await analyzeRepCapacity();
    expect(Array.isArray(reports)).toBe(true);
  });
  it("getAdaptiveScalingSummary returns summary", async () => {
    const { getAdaptiveScalingSummary } = await import("./services/leadGenAdaptive");
    const summary = await getAdaptiveScalingSummary();
    expect(summary).toHaveProperty("totalActiveReps");
    expect(summary).toHaveProperty("repsNeedingLeads");
    expect(summary).toHaveProperty("totalAvailableLeads");
    expect(summary).toHaveProperty("recommendation");
  });
  it("quality threshold tiers work correctly", async () => {
    const { getAdaptiveQualityThreshold } = await import("./services/leadGenAdaptive");
    // No deficit = strict
    const strict = getAdaptiveQualityThreshold(0, 0);
    expect(strict.acceptWithWebsite).toBe(false);
    expect(strict.minRating).toBe(3.5);
    // Small deficit = relaxed
    const relaxed = getAdaptiveQualityThreshold(0, 5);
    expect(relaxed.acceptWithWebsite).toBe(true);
    expect(relaxed.minRating).toBe(3.0);
    // Large deficit = wide open
    const desperate = getAdaptiveQualityThreshold(0, 20);
    expect(desperate.acceptWithWebsite).toBe(true);
    expect(desperate.minRating).toBe(0);
  });
  it("getNextCategories returns categories", async () => {
    const { getNextCategories } = await import("./services/leadGenAdaptive");
    const cats = await getNextCategories("", 5);
    expect(Array.isArray(cats)).toBe(true);
  });
  it("getExpansionAreas returns array (may be empty without geocoding)", async () => {
    const { getExpansionAreas } = await import("./services/leadGenAdaptive");
    // getExpansionAreas uses Google Maps geocoding — may return empty in test env
    const areas = await getExpansionAreas("New York", 25);
    expect(Array.isArray(areas)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// Stage 9: Enterprise Pipeline
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 9: Enterprise", () => {
  it("scanForEnterpriseLeads is callable", async () => {
    const mod = await import("./services/leadGenEnterprise");
    expect(typeof mod.scanForEnterpriseLeads).toBe("function");
  });
  it("listEnterpriseProspects returns array", async () => {
    const { listEnterpriseProspects } = await import("./services/leadGenEnterprise");
    const prospects = await listEnterpriseProspects();
    expect(Array.isArray(prospects)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// Stage 10: Multi-Source Scraping
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 10: Multi-Source", () => {
  it("runMultiSourceScrape is callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.runMultiSourceScrape).toBe("function");
  });
  it("enrichWithCompetitors is callable", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.enrichWithCompetitors).toBe("function");
  });
  it("getSourceQuality returns data", async () => {
    const { getSourceQuality } = await import("./services/leadGenMultiSource");
    const quality = await getSourceQuality();
    expect(quality).toBeDefined();
  });
  it("source-specific scrapers are exported", async () => {
    const mod = await import("./services/leadGenMultiSource");
    expect(typeof mod.scrapeGoogleExpanded).toBe("function");
    expect(typeof mod.scrapeYelp).toBe("function");
    expect(typeof mod.scrapeFacebook).toBe("function");
    expect(typeof mod.scrapeBBB).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 11: Website Audit (Lead Magnet)
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 11: Website Audit", () => {
  it("generateAuditReport is callable", async () => {
    const mod = await import("./services/leadGenAudit");
    expect(typeof mod.generateAuditReport).toBe("function");
  });
  it("generateAuditForLead is callable", async () => {
    const mod = await import("./services/leadGenAudit");
    expect(typeof mod.generateAuditForLead).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 12: Scheduler (Autonomous Operation)
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 12: Scheduler", () => {
  it("scheduler starts and stops", async () => {
    const { startLeadGenScheduler, stopLeadGenScheduler, isSchedulerRunning } = await import("./services/leadGenScheduler");
    expect(isSchedulerRunning()).toBe(false);
    startLeadGenScheduler();
    expect(isSchedulerRunning()).toBe(true);
    stopLeadGenScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });
  it("getSchedulerStats returns job tracking", async () => {
    const { getSchedulerStats } = await import("./services/leadGenScheduler");
    const stats = getSchedulerStats();
    expect(stats).toHaveProperty("running");
    expect(stats).toHaveProperty("jobs");
    expect(typeof stats.running).toBe("boolean");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 13: Database Helpers
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 13: DB Helpers", () => {
  const requiredFunctions = [
    "getLeadByPhone", "markLeadSmsOptedOut", "getOwnerUser",
    "createSmsMessage", "createRepNotification", "updateCallLogByCallSid",
    "getCallLogByCallSid", "updateCallLog", "getDb",
  ];
  for (const fnName of requiredFunctions) {
    it(`${fnName} is exported`, async () => {
      const db = await import("./db");
      expect(typeof (db as any)[fnName]).toBe("function");
    });
  }
});

// ═══════════════════════════════════════════════════════
// Stage 14: Twilio Webhook Integration
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 14: Twilio Webhooks", () => {
  it("registerTwilioWebhooks is exported", async () => {
    const mod = await import("./twilio-webhooks");
    expect(typeof mod.registerTwilioWebhooks).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════
// Stage 15: Lead Gen Router — All Endpoints
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 15: Router Endpoints", () => {
  const expectedEndpoints = [
    // Core pipeline
    "getStats", "getRepCapacity", "createScrapeJob", "listScrapeJobs",
    "listScrapedBusinesses", "scoreWebsites", "enrichBusinesses", "convertToLeads",
    // Outreach
    "startOutreachForLead", "sendDueOutreach", "autoStartOutreach", "listOutreachSequences",
    // AI Conversations
    "listConversations",
    // Rep management
    "setRepServiceArea", "listRepServiceAreas", "autoFeedReps",
    // Enterprise
    "listEnterpriseProspects", "updateEnterpriseProspect", "scanForEnterprise",
    // Full pipeline
    "runFullPipeline", "runEnhancedPipeline", "getBusinessTypes",
    // Phase 29: Audit + Smart Outreach
    "generateAudit", "generateAuditForLead", "analyzeLeadBehavior",
    "scheduleBranchedOutreach", "runReengagement", "recordIntentSignal",
    // Phase 30: ML + Multi-Source
    "scoreLeadML", "rescoreAllLeads", "getScoringInsights",
    "runMultiSourceScrape", "getSourceQuality", "enrichWithCompetitors",
    "generateProposal", "getRepPerformance", "findBestRep",
    // Phase 31: AI-First Warming
    "enrichContacts", "enrichSingleBusiness", "getEnrichmentStatus",
    "runAdaptiveScaling", "getAdaptiveScalingSummary", "getRepCapacityDetailed",
    "triggerConversation", "getBusinessIntelligence", "getLeadConversationHistory",
    // Public
    "requestPublicAudit",
  ];

  it("all expected endpoints are registered", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    const procedures = Object.keys(leadGenRouter._def.procedures);
    const missing = expectedEndpoints.filter(ep => !procedures.includes(ep));
    expect(missing).toEqual([]);
  });

  it(`has ${expectedEndpoints.length}+ total endpoints`, async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    const procedures = Object.keys(leadGenRouter._def.procedures);
    expect(procedures.length).toBeGreaterThanOrEqual(expectedEndpoints.length);
  });
});

// ═══════════════════════════════════════════════════════
// Stage 16: Free Audit Landing Page
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 16: Free Audit Page", () => {
  it("FreeAudit page component exists", async () => {
    const mod = await import("../client/src/pages/FreeAudit");
    expect(mod.default).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
// Stage 17: Schema Integrity
// ═══════════════════════════════════════════════════════
describe("Pipeline Stage 17: Schema Integrity", () => {
  it("all pipeline tables exist in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.scrapeJobs).toBeDefined();
    expect(schema.scrapedBusinesses).toBeDefined();
    expect(schema.outreachSequences).toBeDefined();
    expect(schema.aiConversations).toBeDefined();
    expect(schema.enterpriseProspects).toBeDefined();
    expect(schema.repServiceAreas).toBeDefined();
    expect(schema.leads).toBeDefined();
    expect(schema.smsMessages).toBeDefined();
    expect(schema.callLogs).toBeDefined();
  });
  it("aiConversations has all required columns", async () => {
    const { aiConversations } = await import("../drizzle/schema");
    expect(aiConversations.leadId).toBeDefined();
    expect(aiConversations.channel).toBeDefined();
    expect(aiConversations.direction).toBeDefined();
    expect(aiConversations.content).toBeDefined();
    expect(aiConversations.aiDecision).toBeDefined();
    expect(aiConversations.aiConfidence).toBeDefined();
    expect(aiConversations.aiReasoning).toBeDefined();
    expect(aiConversations.handedOffToRepId).toBeDefined();
    expect(aiConversations.handedOffToOwner).toBeDefined();
  });
});
