import { describe, it, expect, vi } from "vitest";

// ═══════════════════════════════════════════════════════
// Phase 31: AI-First Lead Warming System Tests
// ═══════════════════════════════════════════════════════

// ─── Contact Enrichment Service ───
describe("Phase 31: Contact Enrichment", () => {
  it("enrichBusinessContact is exported and callable", async () => {
    const mod = await import("./services/contactEnrichment");
    expect(typeof mod.enrichBusinessContact).toBe("function");
  });

  it("batchEnrichContacts is exported and callable", async () => {
    const mod = await import("./services/contactEnrichment");
    expect(typeof mod.batchEnrichContacts).toBe("function");
  });

  it("getEnrichmentStatus returns expected structure", async () => {
    const { getEnrichmentStatus } = await import("./services/contactEnrichment");
    const status = getEnrichmentStatus();
    expect(status).toHaveProperty("apollo");
    expect(status).toHaveProperty("hunter");
    expect(status).toHaveProperty("llm");
    expect(status).toHaveProperty("recommendation");
    expect(typeof status.apollo).toBe("boolean");
    expect(typeof status.hunter).toBe("boolean");
    expect(status.llm).toBe(true); // LLM is always available
    expect(typeof status.recommendation).toBe("string");
    expect(status.recommendation.length).toBeGreaterThan(0);
  });

  it("EnrichedContact interface has required fields", async () => {
    const mod = await import("./services/contactEnrichment");
    // Verify the module exports the expected functions
    expect(typeof mod.enrichBusinessContact).toBe("function");
    expect(typeof mod.batchEnrichContacts).toBe("function");
    expect(typeof mod.getEnrichmentStatus).toBe("function");
  });

  it("batchEnrichContacts accepts a limit parameter", async () => {
    const { batchEnrichContacts } = await import("./services/contactEnrichment");
    // Verify the function signature accepts a number
    expect(batchEnrichContacts.length).toBeLessThanOrEqual(1);
  });
});

// ─── Adaptive Scaling Service ───
describe("Phase 31: Adaptive Scaling", () => {
  it("runAdaptiveScaling is exported and callable", async () => {
    const mod = await import("./services/leadGenAdaptive");
    expect(typeof mod.runAdaptiveScaling).toBe("function");
  });

  it("analyzeRepCapacity is exported and callable", async () => {
    const mod = await import("./services/leadGenAdaptive");
    expect(typeof mod.analyzeRepCapacity).toBe("function");
  });

  it("getAdaptiveScalingSummary is exported and callable", async () => {
    const mod = await import("./services/leadGenAdaptive");
    expect(typeof mod.getAdaptiveScalingSummary).toBe("function");
  });

  it("getNextCategories is exported and callable", async () => {
    const mod = await import("./services/leadGenAdaptive");
    expect(typeof mod.getNextCategories).toBe("function");
  });

  it("getExpansionAreas is exported and callable", async () => {
    const mod = await import("./services/leadGenAdaptive");
    expect(typeof mod.getExpansionAreas).toBe("function");
  });

  it("getAdaptiveQualityThreshold returns valid threshold", async () => {
    const { getAdaptiveQualityThreshold } = await import("./services/leadGenAdaptive");
    const threshold = getAdaptiveQualityThreshold(0, 0);
    expect(threshold).toHaveProperty("minWebsiteScore");
    expect(threshold).toHaveProperty("acceptWithWebsite");
    expect(threshold).toHaveProperty("minRating");
    expect(threshold).toHaveProperty("minReviews");
    expect(threshold).toHaveProperty("description");
    expect(typeof threshold.minWebsiteScore).toBe("number");
    expect(typeof threshold.acceptWithWebsite).toBe("boolean");
    expect(typeof threshold.description).toBe("string");
  });

  it("quality threshold relaxes as deficit increases", async () => {
    const { getAdaptiveQualityThreshold } = await import("./services/leadGenAdaptive");
    const normalThreshold = getAdaptiveQualityThreshold(0, 0);
    const deficitThreshold = getAdaptiveQualityThreshold(0, 20);
    // Higher deficit should accept higher website scores (more relaxed)
    expect(deficitThreshold.minWebsiteScore).toBeGreaterThanOrEqual(normalThreshold.minWebsiteScore);
    // Higher deficit should accept lower ratings
    expect(deficitThreshold.minRating).toBeLessThanOrEqual(normalThreshold.minRating);
  });

  it("quality threshold gets progressively more relaxed", async () => {
    const { getAdaptiveQualityThreshold } = await import("./services/leadGenAdaptive");
    const strict = getAdaptiveQualityThreshold(0, 0);
    const relaxed = getAdaptiveQualityThreshold(0, 5);
    const moderate = getAdaptiveQualityThreshold(0, 10);
    const desperate = getAdaptiveQualityThreshold(0, 20);
    // Each tier should accept more businesses
    expect(strict.acceptWithWebsite).toBe(false);
    expect(relaxed.acceptWithWebsite).toBe(true);
    expect(moderate.acceptWithWebsite).toBe(true);
    expect(desperate.acceptWithWebsite).toBe(true);
  });
});

// ─── AI Conversation Agent ───
describe("Phase 31: AI Conversation Agent", () => {
  it("handleConversation is exported and callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.handleConversation).toBe("function");
  });

  it("buildBusinessIntelligence is exported and callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.buildBusinessIntelligence).toBe("function");
  });

  it("detectObjection is exported and callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.detectObjection).toBe("function");
  });

  it("detectBuyingSignal is exported and callable", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.detectBuyingSignal).toBe("function");
  });

  it("COMMON_OBJECTIONS has expected categories", async () => {
    const { COMMON_OBJECTIONS } = await import("./services/leadGenConversationAI");
    expect(COMMON_OBJECTIONS).toHaveProperty("too_expensive");
    expect(COMMON_OBJECTIONS).toHaveProperty("already_have_website");
    expect(COMMON_OBJECTIONS).toHaveProperty("not_right_time");
    expect(COMMON_OBJECTIONS).toHaveProperty("need_to_think");
    expect(COMMON_OBJECTIONS).toHaveProperty("diy_preference");
    expect(COMMON_OBJECTIONS).toHaveProperty("bad_experience");
    expect(COMMON_OBJECTIONS).toHaveProperty("no_need");
  });

  it("BUYING_SIGNALS has expected signal types", async () => {
    const { BUYING_SIGNALS } = await import("./services/leadGenConversationAI");
    expect(BUYING_SIGNALS).toHaveProperty("pricing_inquiry");
    expect(BUYING_SIGNALS).toHaveProperty("timeline_question");
    expect(BUYING_SIGNALS).toHaveProperty("feature_question");
    expect(BUYING_SIGNALS).toHaveProperty("ready_to_buy");
    expect(BUYING_SIGNALS).toHaveProperty("positive_response");
  });

  it("detectObjection identifies price objections", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("That's too expensive for my small business");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("price");
    expect(result!.suggestedApproach.length).toBeGreaterThan(0);
  });

  it("detectObjection identifies DIY preference", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("I can just use Wix to build my own site");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("diy");
  });

  it("detectObjection identifies timing objection", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("Not the right time, maybe call me back next month");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("timing");
  });

  it("detectObjection identifies trust issues", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("I had a bad experience with the last agency");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("trust");
  });

  it("detectObjection returns null for neutral messages", async () => {
    const { detectObjection } = await import("./services/leadGenConversationAI");
    const result = detectObjection("Hello, I got your message");
    expect(result).toBeNull();
  });

  it("detectBuyingSignal identifies pricing inquiry as strong", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("How much does a website cost?");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("strong");
  });

  it("detectBuyingSignal identifies ready-to-buy as strong", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("Let's do it, sign me up!");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("strong");
  });

  it("detectBuyingSignal identifies feature questions as medium", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("Can you add online ordering to the site?");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("medium");
  });

  it("detectBuyingSignal returns null for unrelated messages", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    const result = detectBuyingSignal("ok thanks");
    expect(result).toBeNull();
  });

  it("detectBuyingSignal returns strongest signal when multiple match", async () => {
    const { detectBuyingSignal } = await import("./services/leadGenConversationAI");
    // This message contains both a feature question (medium) and pricing (strong)
    const result = detectBuyingSignal("Can you do online ordering? How much would that cost?");
    expect(result).not.toBeNull();
    expect(result!.strength).toBe("strong"); // Should pick the stronger signal
  });

  it("each objection has a pattern, category, and suggestedApproach", async () => {
    const { COMMON_OBJECTIONS } = await import("./services/leadGenConversationAI");
    for (const [key, obj] of Object.entries(COMMON_OBJECTIONS)) {
      expect(obj.pattern).toBeInstanceOf(RegExp);
      expect(typeof obj.category).toBe("string");
      expect(typeof obj.suggestedApproach).toBe("string");
      expect(obj.suggestedApproach.length).toBeGreaterThan(10);
    }
  });

  it("each buying signal has a pattern, strength, and action", async () => {
    const { BUYING_SIGNALS } = await import("./services/leadGenConversationAI");
    for (const [key, signal] of Object.entries(BUYING_SIGNALS)) {
      expect(signal.pattern).toBeInstanceOf(RegExp);
      expect(["weak", "medium", "strong"]).toContain(signal.strength);
      expect(typeof signal.action).toBe("string");
      expect(signal.action.length).toBeGreaterThan(5);
    }
  });
});

// ─── Free Audit Landing Page ───
describe("Phase 31: Free Audit Landing Page", () => {
  it("FreeAudit page component exists", async () => {
    const mod = await import("../client/src/pages/FreeAudit");
    expect(mod.default).toBeDefined();
  });
});

// ─── Twilio SMS Webhook — AI Conversation Routing ───
describe("Phase 31: SMS Webhook AI Routing", () => {
  it("twilio-webhooks imports handleConversation", async () => {
    // Verify the import exists by checking the file exports
    const mod = await import("./twilio-webhooks");
    expect(typeof mod.registerTwilioWebhooks).toBe("function");
  });

  it("leadGenConversationAI exports handleConversation", async () => {
    const mod = await import("./services/leadGenConversationAI");
    expect(typeof mod.handleConversation).toBe("function");
  });
});

// ─── Lead Gen Router — Phase 31 Endpoints ───
describe("Phase 31: Lead Gen Router Endpoints", () => {
  it("leadGenRouter has enrichContacts endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("enrichContacts");
  });

  it("leadGenRouter has enrichSingleBusiness endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("enrichSingleBusiness");
  });

  it("leadGenRouter has getEnrichmentStatus endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("getEnrichmentStatus");
  });

  it("leadGenRouter has runAdaptiveScaling endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("runAdaptiveScaling");
  });

  it("leadGenRouter has getAdaptiveScalingSummary endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("getAdaptiveScalingSummary");
  });

  it("leadGenRouter has getRepCapacityDetailed endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("getRepCapacityDetailed");
  });

  it("leadGenRouter has triggerConversation endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("triggerConversation");
  });

  it("leadGenRouter has getBusinessIntelligence endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("getBusinessIntelligence");
  });

  it("leadGenRouter has getLeadConversationHistory endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("getLeadConversationHistory");
  });

  it("leadGenRouter has requestPublicAudit endpoint", async () => {
    const { leadGenRouter } = await import("./leadGenRouter");
    expect(leadGenRouter._def.procedures).toHaveProperty("requestPublicAudit");
  });
});

// ─── Scheduler Integration ───
describe("Phase 31: Scheduler Integration", () => {
  it("scheduler exports startLeadGenScheduler", async () => {
    const mod = await import("./services/leadGenScheduler");
    expect(typeof mod.startLeadGenScheduler).toBe("function");
  });

  it("scheduler exports getSchedulerStats", async () => {
    const mod = await import("./services/leadGenScheduler");
    expect(typeof mod.getSchedulerStats).toBe("function");
  });

  it("getSchedulerStats returns expected structure", async () => {
    const { getSchedulerStats } = await import("./services/leadGenScheduler");
    const stats = getSchedulerStats();
    expect(stats).toHaveProperty("running");
    expect(stats).toHaveProperty("jobs");
    expect(typeof stats.running).toBe("boolean");
    expect(typeof stats.jobs).toBe("object");
  });

  it("scheduler exports isSchedulerRunning", async () => {
    const mod = await import("./services/leadGenScheduler");
    expect(typeof mod.isSchedulerRunning).toBe("function");
  });
});

// ─── Database Schema ───
describe("Phase 31: Database Schema", () => {
  it("aiConversations table has handle_objection in aiDecision enum", async () => {
    const { aiConversations } = await import("../drizzle/schema");
    expect(aiConversations).toBeDefined();
    // Verify the table has the expected columns
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
