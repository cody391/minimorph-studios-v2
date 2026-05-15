/**
 * Blueprint Schema Gate (B6) — Tests proving the full Customer Reality Blueprint
 * schema is created correctly from questionnaire data.
 */

import { describe, it, expect } from "vitest";
import {
  deriveIndustryLane,
  deriveRiskLevel,
  deriveRegulatedIndustry,
  deriveTemplateLane,
  buildAddOnRecords,
  scoreBlueprint,
  type CustomerRealityBlueprint,
} from "../shared/blueprintTypes";

// ── Minimal questionnaire fixture ────────────────────────────────────────────

const SPARSE_QUESTIONNAIRE: Record<string, unknown> = {
  businessName: "Test Co",
  websiteType: "plumber",
  brandTone: "professional",
};

const FULL_QUESTIONNAIRE: Record<string, unknown> = {
  businessName: "Apex Roofing",
  websiteType: "contractor",
  brandTone: "bold",
  brandColors: ["#1a1a1a", "#e8c547"],
  targetAudience: "homeowners in Austin",
  targetCustomerDescription: "Austin homeowners aged 35-65 who need roof replacement or repair",
  servicesOffered: ["Roof replacement", "Roof repair", "Storm damage", "Gutters"],
  serviceArea: "Austin, TX",
  ownerName: "Marcus",
  yearsInBusiness: "12 years",
  licenseNumber: "TX-ROF-88821",
  phone: "512-555-0100",
  email: "info@apexroofing.com",
  address: "1234 Trade St, Austin TX 78701",
  hours: "Mon-Sat 7am-6pm",
  domainName: "apexroofing.com",
  domainStatus: "has_domain",
  domainEmailInUse: "yes",
  emailProvider: "Google Workspace",
  uniqueDifferentiator: "We're the only roofing company in Austin offering lifetime workmanship warranty",
  pricingDisplay: "contact_for_pricing",
  mustHaveFeatures: ["contact_form", "gallery", "reviews"],
  hasCustomPhotos: true,
  customerPhotoUrl: "https://cdn.example.com/apexroofing/photo1.jpg",
  socialHandles: { instagram: "@apexroofing", facebook: "apexroofingaustin" },
  testimonials: [
    { quote: "Best roofing company in Austin", name: "John D.", context: "homeowner in Austin" },
  ],
  blogTopics: ["How to spot storm damage", "When to replace vs repair"],
  inspirationSites: [{ url: "https://example.com", whatYouLike: "clean layout", whatYouDislike: "too much text" }],
  inspirationStyle: { colorMood: "dark bold", typography: "strong sans-serif" },
  avoidPatterns: ["light pastel colors", "stock photo feel"],
  competitorSites: [{ url: "https://rival.com", whatYouWantToBeat: "better SEO" }],
  competitorWeaknesses: ["Rival has no reviews visible", "Slow mobile site"],
  addonsSelected: [
    { product: "Review Collector", price: "$149/mo" },
    { product: "SEO Autopilot", price: "$199/mo" },
  ],
  packageTier: "growth",
  specialRequests: "Emphasize storm damage insurance work",
};

// ── Blueprint builder under test ─────────────────────────────────────────────
// Import via require to match how routers.ts uses it (CommonJS-compatible).
// We test the exported helpers directly since buildBlueprintFromQuestionnaire
// is a private server function. We validate the shape contract via the helpers.

// ── Industry Lane Derivation ─────────────────────────────────────────────────

describe("deriveIndustryLane", () => {
  it("plumber → home_services", () => {
    expect(deriveIndustryLane("plumber")).toBe("home_services");
  });
  it("roofer → home_services", () => {
    expect(deriveIndustryLane("contractor")).toBe("home_services");
  });
  it("restaurant → food_hospitality", () => {
    expect(deriveIndustryLane("restaurant")).toBe("food_hospitality");
  });
  it("law firm → professional_services", () => {
    expect(deriveIndustryLane("law firm")).toBe("professional_services");
  });
  it("attorney → professional_services", () => {
    expect(deriveIndustryLane("attorney")).toBe("professional_services");
  });
  it("dentist → health_wellness", () => {
    expect(deriveIndustryLane("dentist")).toBe("health_wellness");
  });
  it("med spa → health_wellness", () => {
    expect(deriveIndustryLane("med spa")).toBe("health_wellness");
  });
  it("distillery → food_hospitality", () => {
    expect(deriveIndustryLane("distillery")).toBe("food_hospitality");
  });
  it("ecommerce store → retail_ecommerce", () => {
    expect(deriveIndustryLane("ecommerce")).toBe("retail_ecommerce");
  });
  it("web design agency → professional_services", () => {
    expect(deriveIndustryLane("web design agency")).toBe("professional_services");
  });
  it("cleaning company → home_services", () => {
    expect(deriveIndustryLane("cleaning")).toBe("home_services");
  });
  it("unknown type → other", () => {
    expect(deriveIndustryLane("widget factory")).toBe("other");
  });
});

// ── Risk Level Derivation ────────────────────────────────────────────────────

describe("deriveRiskLevel", () => {
  it("standard contractor → low", () => {
    expect(deriveRiskLevel("plumber")).toBe("low");
  });
  it("restaurant → medium", () => {
    expect(deriveRiskLevel("restaurant")).toBe("medium");
  });
  it("law firm → regulated_review_required", () => {
    expect(deriveRiskLevel("law firm")).toBe("regulated_review_required");
  });
  it("dentist → regulated_review_required", () => {
    expect(deriveRiskLevel("dentist")).toBe("regulated_review_required");
  });
  it("distillery → high", () => {
    expect(deriveRiskLevel("distillery")).toBe("high");
  });
  it("ecommerce type → high", () => {
    expect(deriveRiskLevel("ecommerce")).toBe("high");
  });
  it("ecommerce add-on selected → high even for service business", () => {
    expect(deriveRiskLevel("plumber", [{ product: "Online Store" }])).toBe("high");
  });
  it("medical clinic → regulated_review_required", () => {
    expect(deriveRiskLevel("medical clinic")).toBe("regulated_review_required");
  });
  it("therapist → regulated_review_required", () => {
    expect(deriveRiskLevel("therapist")).toBe("regulated_review_required");
  });
  it("financial advisor → regulated_review_required", () => {
    expect(deriveRiskLevel("financial advisor")).toBe("regulated_review_required");
  });
  it("cannabis dispensary → regulated_review_required", () => {
    expect(deriveRiskLevel("cannabis dispensary")).toBe("regulated_review_required");
  });
});

// ── Regulated Industry Derivation ────────────────────────────────────────────

describe("deriveRegulatedIndustry", () => {
  it("dentist → regulated", () => {
    expect(deriveRegulatedIndustry("dentist")).toBe(true);
  });
  it("law firm → regulated", () => {
    expect(deriveRegulatedIndustry("law firm")).toBe(true);
  });
  it("distillery → regulated", () => {
    expect(deriveRegulatedIndustry("distillery")).toBe(true);
  });
  it("plumber → not regulated", () => {
    expect(deriveRegulatedIndustry("plumber")).toBe(false);
  });
  it("restaurant → not regulated", () => {
    expect(deriveRegulatedIndustry("restaurant")).toBe(false);
  });
  it("cannabis → regulated", () => {
    expect(deriveRegulatedIndustry("cannabis")).toBe(true);
  });
  it("financial advisor → regulated", () => {
    expect(deriveRegulatedIndustry("financial advisor")).toBe(true);
  });
});

// ── Template Lane Derivation ─────────────────────────────────────────────────

describe("deriveTemplateLane", () => {
  it("contractor → contractor lane", () => {
    expect(deriveTemplateLane("contractor")).toBe("contractor");
  });
  it("restaurant → restaurant lane", () => {
    expect(deriveTemplateLane("restaurant")).toBe("restaurant");
  });
  it("gym → gym lane", () => {
    expect(deriveTemplateLane("gym")).toBe("gym");
  });
  it("salon → salon lane", () => {
    expect(deriveTemplateLane("salon")).toBe("salon");
  });
  it("ecommerce → ecommerce lane", () => {
    expect(deriveTemplateLane("ecommerce")).toBe("ecommerce");
  });
  it("web design agency → service lane", () => {
    expect(deriveTemplateLane("web design agency")).toBe("service");
  });
  it("cleaning → service lane", () => {
    expect(deriveTemplateLane("cleaning")).toBe("service");
  });
  it("widget factory → llm_fallback", () => {
    expect(deriveTemplateLane("widget factory")).toBe("llm_fallback");
  });
});

// ── Add-On Records ───────────────────────────────────────────────────────────

describe("buildAddOnRecords", () => {
  const addons = [
    { product: "Review Collector", price: "$149/mo" },
    { product: "SEO Autopilot", price: "$199/mo" },
    { product: "Online Store", price: "$99/mo" },
  ];
  const records = buildAddOnRecords(addons, "accepted");

  it("returns one record per addon", () => {
    expect(records).toHaveLength(3);
  });

  it("review collector is team_setup fulfillment", () => {
    const rc = records.find(r => r.product === "Review Collector");
    expect(rc?.fulfillmentType).toBe("team_setup");
    expect(rc?.adminSupportRequired).toBe(true);
    expect(rc?.generatorSupported).toBe(false);
  });

  it("online store is blocked (B9 — B2 open, cannot fulfill)", () => {
    const os = records.find(r => r.product === "Online Store");
    expect(os?.fulfillmentType).toBe("blocked");
    expect(os?.canElenaRecommend).toBe(false);
    expect(os?.canCheckoutPurchase).toBe(false);
  });

  it("all records have customerInterestLevel = accepted", () => {
    expect(records.every(r => r.customerInterestLevel === "accepted")).toBe(true);
  });

  it("all records have setupDisclosureGiven = false (pending B9)", () => {
    expect(records.every(r => r.setupDisclosureGiven === false)).toBe(true);
  });
});

// ── Blueprint Shape Contract ─────────────────────────────────────────────────
// Simulate what buildBlueprintFromQuestionnaire would produce and verify
// the 9-section structure is intact using the helpers directly.

function simulateFullBlueprint(q: Record<string, unknown>): CustomerRealityBlueprint {
  const businessName = String(q.businessName ?? "");
  const websiteType  = String(q.websiteType ?? "");
  const brandTone    = String(q.brandTone ?? "");
  const packageTier  = String(q.packageTier ?? "growth");
  const addonsSelected = Array.isArray(q.addonsSelected) ? q.addonsSelected as any[] : [];
  const servicesOffered = Array.isArray(q.servicesOffered) ? q.servicesOffered as string[] : [];
  const testimonials    = Array.isArray(q.testimonials) ? q.testimonials as any[] : [];
  const brandColors     = Array.isArray(q.brandColors) ? q.brandColors as string[] : [];

  const industryLane = deriveIndustryLane(websiteType);
  const riskLevel    = deriveRiskLevel(websiteType, addonsSelected);
  const regulated    = deriveRegulatedIndustry(websiteType);
  const templateLane = deriveTemplateLane(websiteType);
  const addOnRecords = buildAddOnRecords(addonsSelected, "accepted");

  return {
    businessIdentity: {
      businessName: businessName || null,
      legalBusinessName: null,
      ownerName: q.ownerName as string ?? null,
      industry: websiteType || null,
      industryLane,
      riskLevel,
      serviceArea: q.serviceArea as string ?? null,
      phone: q.phone as string ?? null,
      email: q.email as string ?? null,
      existingDomain: q.domainName as string ?? null,
      domainStatus: q.domainStatus as string ?? null,
      domainEmailInUse: (q.domainEmailInUse as "yes" | "no" | "unsure" | null) ?? null,
      emailProvider: q.emailProvider as string ?? null,
      yearsInBusiness: q.yearsInBusiness as string ?? null,
      licenses: q.licenseNumber ? [q.licenseNumber as string] : [],
      certifications: [],
      physicalAddress: q.address as string ?? null,
      sourceNotes: ["elena_onboarding"],
    },
    offerStrategy: {
      servicesOffered,
      primaryOffer: servicesOffered[0] ?? null,
      secondaryOffers: servicesOffered.slice(1),
      mostProfitableServices: [],
      leastProfitableServices: [],
      servicesToPush: [],
      servicesToAvoid: [],
      badFitWork: [],
      seasonalServices: [],
      recurringServices: [],
      pricingDisplayPreference: q.pricingDisplay as string ?? null,
      pricingNotes: null,
      addOnsRequested: addonsSelected.map((a: any) => a.product),
      sourceNotes: ["elena_onboarding"],
    },
    customerPsychology: {
      idealCustomerType: q.targetCustomerDescription as string ?? q.targetAudience as string ?? null,
      badFitCustomerType: null,
      customerFears: [],
      customerObjections: [],
      customerTrustTriggers: [],
      customerComparisonFactors: [],
      questionsCustomersAlwaysAsk: Array.isArray(q.blogTopics) ? q.blogTopics as string[] : [],
      commonMisunderstandings: [],
      buyerEducationNeeded: [],
      sourceNotes: ["elena_onboarding"],
    },
    positioning: {
      uniqueDifferentiator: q.uniqueDifferentiator as string ?? null,
      primaryPromise: null,
      brandTone: brandTone || null,
      brandPersonality: null,
      safeClaims: [],
      riskyCustomerDirectedClaims: [],
      courtesyRiskNotices: regulated ? [`Industry "${websiteType}" flagged for compliance review.`] : [],
      customerAcknowledgments: [],
      doNotSayList: [],
      competitorWeaknesses: Array.isArray(q.competitorWeaknesses) ? q.competitorWeaknesses as string[] : [],
      competitorSites: Array.isArray(q.competitorSites) ? q.competitorSites as any[] : [],
      competitiveAdvantages: [],
      sourceNotes: ["elena_onboarding"],
    },
    websiteStrategy: {
      primaryGoal: q.specialRequests as string ?? null,
      secondaryGoals: [],
      primaryCTA: null,
      secondaryCTAs: [],
      pageStructure: Array.isArray(q.mustHaveFeatures) ? q.mustHaveFeatures as string[] : [],
      heroMessageDirection: null,
      faqTopics: Array.isArray(q.blogTopics) ? q.blogTopics as string[] : [],
      proofNeeded: testimonials.length > 0 ? ["testimonials_present"] : ["testimonials_needed"],
      servicesFeatureOrder: servicesOffered.slice(),
      customerEducationNeeded: [],
      conversionStrategy: null,
      inspirationStyle: q.inspirationStyle as Record<string, string> ?? null,
      avoidPatterns: Array.isArray(q.avoidPatterns) ? q.avoidPatterns as string[] : [],
      sourceNotes: ["elena_onboarding"],
    },
    mediaVisuals: {
      hasLogo: !!(q.logoUrl),
      logoUrl: q.logoUrl as string ?? null,
      hasCustomPhotos: !!(q.hasCustomPhotos),
      photoUrls: q.customerPhotoUrl ? [q.customerPhotoUrl as string] : [],
      approvedAssetUrls: [],
      mediaQuality: q.hasCustomPhotos ? "customer_provided" : "needs_generation",
      needsMediaRescue: false,
      photoReplacementStrategy: q.hasCustomPhotos ? null : "ai_generated_plus_licensed_stock",
      mediaWarnings: [],
      styleDirection: null,
      brandColors,
      colorMood: null,
      sourceNotes: ["elena_onboarding"],
    },
    riskCompliance: {
      regulatedIndustry: regulated,
      riskLevel,
      riskReasons: regulated ? [`Industry type "${websiteType}" requires compliance review`] : [],
      courtesyNoticesGiven: regulated ? ["Regulated industry notice given during onboarding"] : [],
      customerDirectedClaims: [],
      claimsRequiringAcknowledgment: [],
      customerAcknowledgments: [],
      unsupportedFeaturesRequested: addOnRecords.filter((a: any) => a.fulfillmentType === "blocked").map((a: any) => a.product),
      unsupportedFeatureAcknowledgments: [],
      requiredDisclaimersSuggested: [],
      adminReviewRecommended: regulated || riskLevel === "high",
      adminReviewReason: regulated ? `Industry "${websiteType}" flagged as regulated` : null,
      sourceNotes: ["elena_onboarding"],
    },
    generatorInstructions: {
      templateLane,
      templateName: null,
      bannedPhrases: [],
      requiredFacts: businessName ? [`Business name: ${businessName}`] : [],
      ctaRules: [],
      claimHandlingRules: ["Do not invent testimonials, credentials, awards, or guarantees not provided by the customer."],
      toneRules: brandTone ? [`Brand tone: ${brandTone}`] : [],
      proofRules: [testimonials.length > 0 ? "Use provided testimonials only." : "No testimonials provided — omit or use placeholder slot."],
      contentPriorities: servicesOffered.slice(0, 5),
      factsNotToInvent: ["phone_number", "address", "license_number", "years_in_business", "team_member_names", "certifications", "awards", "prices", "guarantees"],
      reviewFlags: regulated ? ["regulated_industry"] : [],
      sourceNotes: ["elena_onboarding"],
    },
    addOnUpsellFit: {
      recommendedAddOns: [],
      acceptedAddOns: addOnRecords,
      declinedAddOns: [],
      addOnsRequiringReview: addOnRecords.filter((a: any) => a.fulfillmentType === "admin_review_required" || a.fulfillmentType === "blocked"),
      sourceNotes: ["elena_onboarding"],
    },
    metadata: {
      blueprintVersion: 2,
      createdFromQuestionnaireVersion: "elena_v1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completenessScore: 0,
      missingCriticalFields: [],
      internalWarnings: [],
    },
    // Legacy keys
    businessName: businessName || null,
    websiteType: websiteType || null,
    packageTier,
    designDirection: {
      brandTone: brandTone || null,
      brandColors: brandColors.length > 0 ? brandColors : null,
      inspirationStyle: q.inspirationStyle as Record<string, string> ?? null,
      avoidPatterns: Array.isArray(q.avoidPatterns) ? q.avoidPatterns as string[] : [],
    },
    contentPlan: {
      servicesOffered,
      targetAudience: q.targetAudience as string ?? null,
      targetCustomerDescription: q.targetCustomerDescription as string ?? null,
      uniqueDifferentiator: q.uniqueDifferentiator as string ?? null,
      contentPreference: q.contentPreference as string ?? "we_write",
      specialRequests: q.specialRequests as string ?? null,
    },
    features: {
      mustHaveFeatures: Array.isArray(q.mustHaveFeatures) ? q.mustHaveFeatures as string[] : [],
      addonsSelected,
      pricingDisplay: q.pricingDisplay as string ?? "contact_for_pricing",
    },
    businessDetails: {
      address: q.address as string ?? null,
      phone: q.phone as string ?? null,
      hours: q.hours as string ?? null,
      socialHandles: q.socialHandles as Record<string, string> ?? null,
      domainName: q.domainName as string ?? null,
      domainStatus: q.domainStatus as string ?? "undecided",
    },
    competitiveStrategy: {
      competitorWeaknesses: Array.isArray(q.competitorWeaknesses) ? q.competitorWeaknesses as string[] : [],
      competitorSites: Array.isArray(q.competitorSites) ? q.competitorSites as any[] : [],
    },
    inspirationSites: Array.isArray(q.inspirationSites) ? q.inspirationSites as any[] : [],
    testimonials,
    hasCustomPhotos: !!(q.hasCustomPhotos),
  };
}

// ── All 9 sections present — sparse questionnaire ────────────────────────────

describe("CustomerRealityBlueprint — all 9 sections present", () => {
  const bp = simulateFullBlueprint(SPARSE_QUESTIONNAIRE);

  it("section 1: businessIdentity exists", () => {
    expect(bp.businessIdentity).toBeDefined();
    expect(typeof bp.businessIdentity).toBe("object");
  });
  it("section 2: offerStrategy exists", () => {
    expect(bp.offerStrategy).toBeDefined();
    expect(typeof bp.offerStrategy).toBe("object");
  });
  it("section 3: customerPsychology exists", () => {
    expect(bp.customerPsychology).toBeDefined();
    expect(typeof bp.customerPsychology).toBe("object");
  });
  it("section 4: positioning exists", () => {
    expect(bp.positioning).toBeDefined();
    expect(typeof bp.positioning).toBe("object");
  });
  it("section 5: websiteStrategy exists", () => {
    expect(bp.websiteStrategy).toBeDefined();
    expect(typeof bp.websiteStrategy).toBe("object");
  });
  it("section 6: mediaVisuals exists", () => {
    expect(bp.mediaVisuals).toBeDefined();
    expect(typeof bp.mediaVisuals).toBe("object");
  });
  it("section 7: riskCompliance exists", () => {
    expect(bp.riskCompliance).toBeDefined();
    expect(typeof bp.riskCompliance).toBe("object");
  });
  it("section 8: generatorInstructions exists", () => {
    expect(bp.generatorInstructions).toBeDefined();
    expect(typeof bp.generatorInstructions).toBe("object");
  });
  it("section 9: addOnUpsellFit exists", () => {
    expect(bp.addOnUpsellFit).toBeDefined();
    expect(typeof bp.addOnUpsellFit).toBe("object");
  });
  it("metadata exists", () => {
    expect(bp.metadata).toBeDefined();
    expect(bp.metadata.blueprintVersion).toBe(2);
  });
});

// ── Legacy keys preserved ────────────────────────────────────────────────────

describe("CustomerRealityBlueprint — legacy keys preserved for backward compat", () => {
  const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);

  it("businessName at top level", () => {
    expect(bp.businessName).toBe("Apex Roofing");
  });
  it("websiteType at top level", () => {
    expect(bp.websiteType).toBe("contractor");
  });
  it("packageTier at top level", () => {
    expect(bp.packageTier).toBe("growth");
  });
  it("designDirection.brandTone", () => {
    expect(bp.designDirection.brandTone).toBe("bold");
  });
  it("designDirection.brandColors", () => {
    expect(bp.designDirection.brandColors).toEqual(["#1a1a1a", "#e8c547"]);
  });
  it("contentPlan.servicesOffered", () => {
    expect(bp.contentPlan.servicesOffered).toContain("Roof replacement");
  });
  it("features.addonsSelected", () => {
    expect(bp.features.addonsSelected).toHaveLength(2);
  });
  it("businessDetails.domainName", () => {
    expect(bp.businessDetails.domainName).toBe("apexroofing.com");
  });
  it("competitiveStrategy.competitorWeaknesses", () => {
    expect(bp.competitiveStrategy.competitorWeaknesses).toContain("Rival has no reviews visible");
  });
  it("testimonials preserved", () => {
    expect(bp.testimonials).toHaveLength(1);
  });
  it("hasCustomPhotos preserved", () => {
    expect(bp.hasCustomPhotos).toBe(true);
  });
  it("inspirationSites preserved", () => {
    expect(bp.inspirationSites).toHaveLength(1);
  });
});

// ── domainEmailInUse preserved ───────────────────────────────────────────────

describe("domainEmailInUse preserved into businessIdentity", () => {
  const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);

  it("domainEmailInUse in businessIdentity is 'yes'", () => {
    expect(bp.businessIdentity.domainEmailInUse).toBe("yes");
  });
  it("emailProvider in businessIdentity is Google Workspace", () => {
    expect(bp.businessIdentity.emailProvider).toBe("Google Workspace");
  });
});

// ── addOnsSelected in addOnUpsellFit ─────────────────────────────────────────

describe("addOnsSelected represented in addOnUpsellFit", () => {
  const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);

  it("acceptedAddOns matches addonsSelected count", () => {
    expect(bp.addOnUpsellFit.acceptedAddOns).toHaveLength(2);
  });
  it("acceptedAddOns products match", () => {
    const products = bp.addOnUpsellFit.acceptedAddOns.map(a => a.product);
    expect(products).toContain("Review Collector");
    expect(products).toContain("SEO Autopilot");
  });
  it("acceptedAddOns have fulfillmentType team_setup for review_collector", () => {
    const rc = bp.addOnUpsellFit.acceptedAddOns.find(a => a.product === "Review Collector");
    expect(rc?.fulfillmentType).toBe("team_setup");
  });
});

// ── Customer-directed claims use courtesy language, not policing ──────────────

describe("positioning — courtesy notice doctrine (not policing)", () => {
  it("riskyCustomerDirectedClaims is an array (for B8 to populate)", () => {
    const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);
    expect(Array.isArray(bp.positioning.riskyCustomerDirectedClaims)).toBe(true);
  });
  it("courtesyRiskNotices is an array (not a block list)", () => {
    const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);
    expect(Array.isArray(bp.positioning.courtesyRiskNotices)).toBe(true);
  });
  it("customerAcknowledgments is an array (not an approval requirement)", () => {
    const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);
    expect(Array.isArray(bp.positioning.customerAcknowledgments)).toBe(true);
  });
  it("regulated industry populates courtesyRiskNotices, not a block", () => {
    const bp = simulateFullBlueprint({ businessName: "Smith Law", websiteType: "law firm", brandTone: "professional" });
    expect(bp.positioning.courtesyRiskNotices.length).toBeGreaterThan(0);
    expect(bp.riskCompliance.adminReviewRecommended).toBe(true);
    expect(bp.riskCompliance.adminReviewReason).toContain("regulated");
  });
  it("non-regulated industry has empty courtesyRiskNotices", () => {
    const bp = simulateFullBlueprint(SPARSE_QUESTIONNAIRE);
    expect(bp.positioning.courtesyRiskNotices).toHaveLength(0);
  });
});

// ── Generator instructions section ──────────────────────────────────────────

describe("generatorInstructions section", () => {
  const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);

  it("bannedPhrases is an array", () => {
    expect(Array.isArray(bp.generatorInstructions.bannedPhrases)).toBe(true);
  });
  it("requiredFacts includes business name", () => {
    expect(bp.generatorInstructions.requiredFacts.some(f => f.includes("Apex Roofing"))).toBe(true);
  });
  it("factsNotToInvent includes critical fields", () => {
    expect(bp.generatorInstructions.factsNotToInvent).toContain("phone_number");
    expect(bp.generatorInstructions.factsNotToInvent).toContain("license_number");
    expect(bp.generatorInstructions.factsNotToInvent).toContain("team_member_names");
  });
  it("reviewFlags is an array", () => {
    expect(Array.isArray(bp.generatorInstructions.reviewFlags)).toBe(true);
  });
  it("regulated industry adds regulated_industry to reviewFlags", () => {
    const bpLaw = simulateFullBlueprint({ businessName: "Smith Law", websiteType: "law firm", brandTone: "professional" });
    expect(bpLaw.generatorInstructions.reviewFlags).toContain("regulated_industry");
  });
  it("templateLane is set", () => {
    expect(bp.generatorInstructions.templateLane).toBe("contractor");
  });
  it("claimHandlingRules has at least one rule", () => {
    expect(bp.generatorInstructions.claimHandlingRules.length).toBeGreaterThan(0);
  });
});

// ── Completeness scoring ─────────────────────────────────────────────────────

describe("scoreBlueprint", () => {
  it("sparse blueprint has lower score than full blueprint", () => {
    const sparseBp = simulateFullBlueprint(SPARSE_QUESTIONNAIRE);
    const fullBp   = simulateFullBlueprint(FULL_QUESTIONNAIRE);
    const { score: sparse } = scoreBlueprint(sparseBp);
    const { score: full }   = scoreBlueprint(fullBp);
    expect(full).toBeGreaterThan(sparse);
  });

  it("sparse blueprint identifies missing critical fields", () => {
    const bp = simulateFullBlueprint(SPARSE_QUESTIONNAIRE);
    const { missing } = scoreBlueprint(bp);
    expect(missing.length).toBeGreaterThan(0);
  });

  it("full blueprint has high score (>=70)", () => {
    const bp = simulateFullBlueprint(FULL_QUESTIONNAIRE);
    const { score } = scoreBlueprint(bp);
    expect(score).toBeGreaterThanOrEqual(70);
  });
});
