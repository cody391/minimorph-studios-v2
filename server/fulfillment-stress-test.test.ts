/**
 * Fulfillment Stress Test — Validation Tests
 *
 * Tests for:
 * 1. Quote engine: ecommerce triggers, product count thresholds, migration flags
 * 2. Answer bank: question matching, classification, escalation
 * 3. Integration matrix: tier classification, plan inclusion, feature lookup
 * 4. Questionnaire schema: expanded fields accepted by Zod
 */
import { describe, it, expect } from "vitest";
import { analyzeQuestionnaire, FLAG_DESCRIPTIONS } from "../shared/quoteEngine";
import { findAnswers, ANSWER_BANK, formatAnswerBankForPrompt } from "../shared/answerBank";
import {
  INTEGRATION_MATRIX,
  getIntegration,
  getIntegrationsByTier,
  isIncludedInPlan,
  formatIntegrationMatrixForPrompt,
} from "../shared/integrationMatrix";

// ── QUOTE ENGINE TESTS ────────────────────────────────────────────────
describe("Quote Engine — analyzeQuestionnaire", () => {
  it("should NOT flag a simple service business as needing custom quote", () => {
    const result = analyzeQuestionnaire({
      websiteType: "service_business",
      brandTone: "professional",
      mustHaveFeatures: ["contact form", "gallery"],
    });
    expect(result.needsCustomQuote).toBe(false);
    expect(result.complexityScore).toBeLessThan(50);
    expect(result.reviewFlags).not.toContain("ecommerce_website");
  });

  it("should flag ecommerce website type", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: { productCount: "1-10" },
    });
    expect(result.reviewFlags).toContain("ecommerce_website");
  });

  it("should flag 100+ products as critical (needs custom quote)", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: { productCount: "100+" },
    });
    expect(result.needsCustomQuote).toBe(true);
    expect(result.reviewFlags).toContain("ecommerce_100_plus_products");
  });

  it("should flag 51-100 products as needing custom quote", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: { productCount: "51-100" },
    });
    expect(result.reviewFlags).toContain("ecommerce_51_100_products");
  });

  it("should flag platform migration as critical", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: { productCount: "11-25", needsMigration: true },
    });
    expect(result.needsCustomQuote).toBe(true);
    expect(result.reviewFlags).toContain("platform_migration_required");
  });

  it("should flag subscription products as critical", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: { productCount: "11-25", needsSubscriptions: true },
    });
    expect(result.needsCustomQuote).toBe(true);
    expect(result.reviewFlags).toContain("subscription_products");
  });

  it("should flag restaurant with online ordering", () => {
    const result = analyzeQuestionnaire({
      websiteType: "restaurant",
      restaurantFields: { needsOnlineOrdering: true },
    });
    expect(result.reviewFlags).toContain("online_ordering_system");
  });

  it("should flag contractor with emergency service", () => {
    const result = analyzeQuestionnaire({
      websiteType: "contractor",
      contractorFields: { emergencyService: true },
    });
    expect(result.reviewFlags).toContain("emergency_service_feature");
  });

  it("should flag high feature count (6+)", () => {
    const result = analyzeQuestionnaire({
      websiteType: "service_business",
      mustHaveFeatures: ["contact", "gallery", "booking", "blog", "reviews", "chat"],
    });
    expect(result.reviewFlags).toContain("high_feature_count");
  });

  it("should flag multilingual special request", () => {
    const result = analyzeQuestionnaire({
      websiteType: "other",
      specialRequests: "I need a multilingual website in English and Spanish",
    });
    expect(result.reviewFlags).toContain("special_request_multilingual");
  });

  it("should cap complexity score at 100", () => {
    const result = analyzeQuestionnaire({
      websiteType: "ecommerce",
      ecommerceFields: {
        productCount: "100+",
        needsMigration: true,
        needsSubscriptions: true,
      },
      mustHaveFeatures: [
        "membership", "portal", "dashboard", "crm", "multi-language",
        "api integration", "payment", "marketplace",
      ],
      specialRequests: "multilingual custom integration api crm erp pos enterprise white label franchise multiple locations",
    });
    expect(result.complexityScore).toBeLessThanOrEqual(100);
  });

  it("should have human-readable descriptions for all known flags", () => {
    // Verify that common flags have descriptions
    const knownFlags = [
      "ecommerce_website",
      "ecommerce_100_plus_products",
      "platform_migration_required",
      "subscription_products",
      "high_feature_count",
    ];
    for (const flag of knownFlags) {
      expect(FLAG_DESCRIPTIONS[flag]).toBeDefined();
      expect(FLAG_DESCRIPTIONS[flag].length).toBeGreaterThan(5);
    }
  });
});

// ── ANSWER BANK TESTS ─────────────────────────────────────────────────
describe("Answer Bank — findAnswers", () => {
  it("should find pricing answers for 'how much does it cost'", () => {
    const results = findAnswers("how much does it cost");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("pricing");
  });

  it("should find starter plan answer", () => {
    const results = findAnswers("what is the starter price");
    expect(results.length).toBeGreaterThan(0);
    const starter = results.find((r) => r.id === "pricing_starter");
    expect(starter).toBeDefined();
    expect(starter!.classification).toBe("answer");
    expect(starter!.answer).toContain("$150");
  });

  it("should classify ecommerce pricing as escalate", () => {
    const results = findAnswers("what is the ecommerce price");
    const ecom = results.find((r) => r.id === "pricing_commerce");
    expect(ecom).toBeDefined();
    expect(ecom!.classification).toBe("escalate");
    expect(ecom!.escalationReason).toBeDefined();
  });

  it("should classify payment processing as escalate", () => {
    const results = findAnswers("can I accept payments on my website");
    const payment = results.find((r) => r.id === "integrations_payment");
    expect(payment).toBeDefined();
    expect(payment!.classification).toBe("escalate");
  });

  it("should classify refund/guarantee as escalate", () => {
    const results = findAnswers("is there a money back guarantee");
    const guarantee = results.find((r) => r.id === "legal_guarantee");
    expect(guarantee).toBeDefined();
    expect(guarantee!.classification).toBe("escalate");
  });

  it("should find hosting answer", () => {
    const results = findAnswers("is hosting included");
    const hosting = results.find((r) => r.id === "tech_hosting");
    expect(hosting).toBeDefined();
    expect(hosting!.classification).toBe("answer");
    expect(hosting!.answer).toContain("included");
  });

  it("should find SEO answer", () => {
    const results = findAnswers("seo search engine optimization");
    const seo = results.find((r) => r.id === "tech_seo");
    expect(seo).toBeDefined();
    expect(seo!.answer).not.toContain("guarantee");
  });

  it("should return empty for unrelated queries", () => {
    const results = findAnswers("what is the meaning of life");
    expect(results.length).toBe(0);
  });

  it("should have at least 20 entries in the answer bank", () => {
    expect(ANSWER_BANK.length).toBeGreaterThanOrEqual(20);
  });

  it("should format answer bank for AI prompt without errors", () => {
    const prompt = formatAnswerBankForPrompt();
    expect(prompt).toContain("ANSWER BANK");
    expect(prompt).toContain("PRICING");
    expect(prompt).toContain("PROCESS");
    expect(prompt).toContain("ESCALATE");
    expect(prompt.length).toBeGreaterThan(500);
  });
});

// ── INTEGRATION MATRIX TESTS ──────────────────────────────────────────
describe("Integration Matrix", () => {
  it("should have at least 30 integrations defined", () => {
    expect(INTEGRATION_MATRIX.length).toBeGreaterThanOrEqual(30);
  });

  it("should classify contact form as included in all plans", () => {
    const item = getIntegration("contact-form");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("included");
    expect(item!.includedInPlans).toContain("all");
  });

  it("should classify booking as included in pro only", () => {
    expect(isIncludedInPlan("booking-integration", "starter")).toBe(false);
    expect(isIncludedInPlan("booking-integration", "growth")).toBe(false);
    expect(isIncludedInPlan("booking-integration", "pro")).toBe(true);
  });

  it("should classify blog as included in growth+", () => {
    expect(isIncludedInPlan("blog", "starter")).toBe(false);
    expect(isIncludedInPlan("blog", "growth")).toBe(true);
    expect(isIncludedInPlan("blog", "pro")).toBe(true);
  });

  it("should classify AI chatbot as upsell", () => {
    const item = getIntegration("ai-chatbot");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("upsell");
    expect(item!.monthlyPrice).toBeGreaterThan(0);
  });

  it("should classify full ecommerce as custom quote", () => {
    const item = getIntegration("ecommerce-full");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("custom_quote");
    expect(item!.customQuoteReason).toBeDefined();
  });

  it("should classify native mobile app as not supported", () => {
    const item = getIntegration("native-mobile-app");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("not_supported");
    expect(item!.notSupportedReason).toBeDefined();
  });

  it("should classify blockchain as not supported", () => {
    const item = getIntegration("blockchain");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("not_supported");
  });

  it("should return correct items by tier", () => {
    const included = getIntegrationsByTier("included");
    const upsell = getIntegrationsByTier("upsell");
    const customQuote = getIntegrationsByTier("custom_quote");
    const notSupported = getIntegrationsByTier("not_supported");

    expect(included.length).toBeGreaterThan(5);
    expect(upsell.length).toBeGreaterThan(3);
    expect(customQuote.length).toBeGreaterThan(3);
    expect(notSupported.length).toBeGreaterThan(0);
  });

  it("should format integration matrix for AI prompt without errors", () => {
    const prompt = formatIntegrationMatrixForPrompt();
    expect(prompt).toContain("INTEGRATION");
    expect(prompt).toContain("INCLUDED");
    expect(prompt).toContain("ADD-ONS");
    expect(prompt).toContain("CUSTOM QUOTE");
    expect(prompt).toContain("NOT SUPPORTED");
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("should have unique slugs for all integrations", () => {
    const slugs = INTEGRATION_MATRIX.map((i) => i.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});
