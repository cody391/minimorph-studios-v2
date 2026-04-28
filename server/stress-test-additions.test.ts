/**
 * Tests for the fulfillment stress-test additions:
 * - Expanded answer bank (38 entries, covering all 20 stress-test questions)
 * - Expanded integration matrix (50 entries, covering all 4 tiers)
 * - Expanded quote engine (new triggers for ecommerce fields)
 * - Expanded questionnaire types (new ecommerce fields)
 */
import { describe, it, expect } from "vitest";
import { ANSWER_BANK, findAnswers, formatAnswerBankForPrompt } from "@shared/answerBank";
import {
  INTEGRATION_MATRIX,
  getIntegration,
  getIntegrationsByTier,
  isIncludedInPlan,
  formatIntegrationMatrixForPrompt,
} from "@shared/integrationMatrix";
import { analyzeQuestionnaire } from "@shared/quoteEngine";
import type { QuestionnairePayload } from "@shared/questionnaire";

// ── EXPANDED ANSWER BANK ──────────────────────────────────────────────
describe("Expanded Answer Bank — Stress-Test Coverage", () => {
  it("should have at least 35 entries (was 23, now 38)", () => {
    expect(ANSWER_BANK.length).toBeGreaterThanOrEqual(35);
  });

  // Stress-test Q3: Can I sell products?
  it("should answer 'can I sell products' with escalation", () => {
    const results = findAnswers("can I sell products online");
    const match = results.find((r) => r.id === "sell_products");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q4: Can you connect Stripe?
  it("should answer 'can you connect Stripe'", () => {
    const results = findAnswers("connect stripe payment");
    const match = results.find((r) => r.id === "connect_stripe");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("answer");
  });

  // Stress-test Q5: Can you connect Shopify?
  it("should answer 'can you connect Shopify' with escalation", () => {
    const results = findAnswers("shopify integration");
    const match = results.find((r) => r.id === "connect_shopify");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q6: Can I add Google Analytics?
  it("should answer 'Google Analytics'", () => {
    const results = findAnswers("google analytics track visitors");
    const match = results.find((r) => r.id === "google_analytics");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("answer");
  });

  // Stress-test Q7: Google Business Profile
  it("should answer 'Google Business Profile'", () => {
    const results = findAnswers("google business profile");
    const match = results.find((r) => r.id === "google_business_profile");
    expect(match).toBeDefined();
  });

  // Stress-test Q8: SMS lead alerts
  it("should answer 'text me when someone fills out a form'", () => {
    const results = findAnswers("text me when form submitted");
    const match = results.find((r) => r.id === "sms_lead_alerts");
    expect(match).toBeDefined();
  });

  // Stress-test Q9: Monthly photo changes
  it("should answer 'can I change photos monthly'", () => {
    const results = findAnswers("change photos update images");
    const match = results.find((r) => r.id === "monthly_photo_changes");
    expect(match).toBeDefined();
  });

  // Stress-test Q10: Product descriptions
  it("should answer 'write product descriptions' with escalation", () => {
    const results = findAnswers("write product descriptions");
    const match = results.find((r) => r.id === "product_descriptions");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q13: What happens if I cancel?
  it("should answer 'what happens if I cancel'", () => {
    const results = findAnswers("cancel cancellation terminate");
    const match = results.find((r) => r.id === "cancellation");
    expect(match).toBeDefined();
    expect(match!.answer).toContain("12-month");
  });

  // Stress-test Q14: SEO guarantee (CRITICAL)
  it("should answer 'guarantee ranking on Google' with escalation", () => {
    const results = findAnswers("guarantee ranking first page google");
    const match = results.find((r) => r.id === "seo_guarantee");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
    expect(match!.answer).toContain("cannot");
  });

  // Stress-test Q15: AI chatbot
  it("should answer 'AI chatbot'", () => {
    const results = findAnswers("ai chatbot live chat");
    const match = results.find((r) => r.id === "ai_chatbot");
    expect(match).toBeDefined();
  });

  // Stress-test Q16: Toast/Square
  it("should answer 'Toast or Square integration' with escalation", () => {
    const results = findAnswers("toast square pos integration");
    const match = results.find((r) => r.id === "toast_square");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q17: Bilingual site
  it("should answer 'bilingual multilingual' with escalation", () => {
    const results = findAnswers("bilingual multilingual spanish");
    const match = results.find((r) => r.id === "bilingual_site");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q19: 200 products
  it("should answer '200 products' with escalation", () => {
    const results = findAnswers("200 products large catalog");
    const match = results.find((r) => r.id === "large_product_catalog");
    expect(match).toBeDefined();
    expect(match!.classification).toBe("escalate");
  });

  // Stress-test Q20: More revisions
  it("should answer 'more revisions'", () => {
    const results = findAnswers("more revisions extra changes");
    const match = results.find((r) => r.id === "extra_revisions");
    expect(match).toBeDefined();
    expect(match!.answer).toContain("$149");
  });

  it("should have unique IDs for all entries", () => {
    const ids = ANSWER_BANK.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should format expanded bank for AI prompt", () => {
    const prompt = formatAnswerBankForPrompt();
    expect(prompt.length).toBeGreaterThan(1000);
    expect(prompt).toContain("ANSWER BANK");
  });
});

// ── EXPANDED INTEGRATION MATRIX ───────────────────────────────────────
describe("Expanded Integration Matrix — Stress-Test Coverage", () => {
  it("should have at least 45 integrations (was 33, now 50)", () => {
    expect(INTEGRATION_MATRIX.length).toBeGreaterThanOrEqual(45);
  });

  // New included entries
  it("should classify Google Maps embed as included", () => {
    const item = getIntegration("google-maps-embed");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("included");
    expect(item!.includedInPlans).toContain("all");
  });

  // New upsell entries
  it("should classify Google Search Console as upsell", () => {
    const item = getIntegration("google-search-console");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("upsell");
  });

  it("should classify extra revisions as upsell", () => {
    const item = getIntegration("extra-revisions");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("upsell");
    expect(item!.setupFee).toBe(0);
  });

  it("should classify GBP optimization as upsell", () => {
    const item = getIntegration("gbp-optimization");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("upsell");
  });

  it("should classify Meta pixel as upsell", () => {
    const item = getIntegration("meta-pixel");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("upsell");
  });

  // New custom_quote entries
  it("should classify Shopify integration as custom_quote", () => {
    const item = getIntegration("shopify-integration");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("custom_quote");
  });

  it("should classify Toast/Square as custom_quote", () => {
    const item = getIntegration("toast-square-integration");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("custom_quote");
  });

  it("should classify WooCommerce as custom_quote", () => {
    const item = getIntegration("woocommerce-integration");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("custom_quote");
  });

  // New not_supported entries
  it("should classify guaranteed SEO as not_supported", () => {
    const item = getIntegration("guaranteed-seo-ranking");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("not_supported");
  });

  it("should classify guaranteed leads/revenue as not_supported", () => {
    const item = getIntegration("guaranteed-leads-revenue");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("not_supported");
  });

  it("should classify legal/medical claims as not_supported", () => {
    const item = getIntegration("legal-medical-claims");
    expect(item).toBeDefined();
    expect(item!.tier).toBe("not_supported");
  });

  it("should have unique slugs for all integrations", () => {
    const slugs = INTEGRATION_MATRIX.map((i) => i.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("should format expanded matrix for AI prompt", () => {
    const prompt = formatIntegrationMatrixForPrompt();
    expect(prompt.length).toBeGreaterThan(1000);
    expect(prompt).toContain("INCLUDED");
    expect(prompt).toContain("NOT SUPPORTED");
  });
});

// ── EXPANDED QUOTE ENGINE ─────────────────────────────────────────────
describe("Expanded Quote Engine — New Triggers", () => {
  const basePayload: QuestionnairePayload = {
    websiteType: "service_business",
    brandTone: "professional",
    brandColors: [],
    targetAudience: "general",
    contentPreference: "we_write",
    inspirationSites: [],
    competitorSites: [],
    mustHaveFeatures: "",
    specialRequests: "",
  };

  it("should flag ecommerce type with ecommerce_website review flag", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      websiteType: "ecommerce",
      ecommerceFields: {
        productCount: "11-25",
        categories: "Clothing",
        needsShipping: true,
        shippingRegions: "US only",
        existingPlatform: "None",
        needsMigration: false,
        hasInventorySystem: false,
        paymentMethods: "Credit card",
        needsSubscriptions: false,
        taxHandling: "Not sure",
        hasProductVariants: false,
        variantComplexity: "simple",
        productPhotosStatus: "have_all",
        productDescriptionsStatus: "have_all",
        abandonedCartInterest: false,
        platformPreference: "not_sure",
        returnPolicy: "",
      },
    });
    // Simple ecommerce (11-25 products, no complexity) gets flagged but doesn't auto-require custom quote
    expect(result.reviewFlags).toContain("ecommerce_website");
    // Complex ecommerce (100+ products, migration, etc.) triggers custom quote via critical flags
  });

  it("should flag 100+ products", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      websiteType: "ecommerce",
      ecommerceFields: {
        productCount: "100+",
        categories: "Electronics",
        needsShipping: true,
        shippingRegions: "US only",
        existingPlatform: "None",
        needsMigration: false,
        hasInventorySystem: false,
        paymentMethods: "Credit card",
        needsSubscriptions: false,
        taxHandling: "Not sure",
        hasProductVariants: false,
        variantComplexity: "simple",
        productPhotosStatus: "have_all",
        productDescriptionsStatus: "have_all",
        abandonedCartInterest: false,
        platformPreference: "not_sure",
        returnPolicy: "",
      },
    });
    expect(result.reviewFlags).toContain("ecommerce_100_plus_products");
  });

  it("should flag complex product variants", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      websiteType: "ecommerce",
      ecommerceFields: {
        productCount: "11-25",
        categories: "Clothing",
        needsShipping: true,
        shippingRegions: "US only",
        existingPlatform: "None",
        needsMigration: false,
        hasInventorySystem: false,
        paymentMethods: "Credit card",
        needsSubscriptions: false,
        taxHandling: "Not sure",
        hasProductVariants: true,
        variantComplexity: "complex",
        productPhotosStatus: "have_all",
        productDescriptionsStatus: "have_all",
        abandonedCartInterest: false,
        platformPreference: "not_sure",
        returnPolicy: "",
      },
    });
    expect(result.reviewFlags).toContain("complex_product_variants");
  });

  it("should flag product description writing needs", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      websiteType: "ecommerce",
      ecommerceFields: {
        productCount: "11-25",
        categories: "Clothing",
        needsShipping: true,
        shippingRegions: "US only",
        existingPlatform: "None",
        needsMigration: false,
        hasInventorySystem: false,
        paymentMethods: "Credit card",
        needsSubscriptions: false,
        taxHandling: "Not sure",
        hasProductVariants: false,
        variantComplexity: "simple",
        productPhotosStatus: "have_all",
        productDescriptionsStatus: "need_written",
        abandonedCartInterest: false,
        platformPreference: "not_sure",
        returnPolicy: "",
      },
    });
    expect(result.reviewFlags).toContain("product_copywriting_needed");
  });

  it("should flag 'other' website type for admin review", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      websiteType: "other",
      otherFields: {
        businessDescription: "We are a nonprofit",
        industryCategory: "Nonprofit",
        uniqueRequirements: "Donation processing",
      },
    });
    expect(result.needsCustomQuote).toBe(true);
    expect(result.reviewFlags).toContain("other_business_type");
  });

  it("should flag SEO guarantee requests in special requests", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      specialRequests: "I need to guarantee first page ranking on Google",
    });
    expect(result.reviewFlags).toContain("seo_guarantee_requested");
  });

  it("should flag legal/compliance mentions", () => {
    const result = analyzeQuestionnaire({
      ...basePayload,
      specialRequests: "We need HIPAA compliance for our medical practice",
    });
    expect(result.reviewFlags).toContain("legal_compliance_requirement");
  });
});
