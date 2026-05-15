/**
 * Customer Reality Blueprint — Full schema types and derivation helpers.
 *
 * B6 Blueprint Schema Gate: extends the stored Blueprint so every new
 * Blueprint contains all 9 required sections from the Elena Master Baseline.
 *
 * BACKWARD COMPAT: buildBlueprintFromQuestionnaire() still emits the legacy
 * top-level keys (businessName, websiteType, packageTier, designDirection,
 * contentPlan, features, businessDetails, competitiveStrategy, inspirationSites,
 * testimonials, hasCustomPhotos) so existing portal/admin/generator readers
 * continue working without changes.
 */

// ── 1. Business Identity ─────────────────────────────────────────────────────

export interface BusinessIdentity {
  businessName: string | null;
  legalBusinessName: string | null;
  ownerName: string | null;
  industry: string | null;
  industryLane: IndustryLane;
  riskLevel: RiskLevel;
  serviceArea: string | null;
  phone: string | null;
  email: string | null;
  existingDomain: string | null;
  domainStatus: string | null;
  domainEmailInUse: "yes" | "no" | "unsure" | null;
  emailProvider: string | null;
  yearsInBusiness: string | null;
  licenses: string[];
  certifications: string[];
  physicalAddress: string | null;
  sourceNotes: string[];
}

// ── 2. Offer Strategy ────────────────────────────────────────────────────────

export interface OfferStrategy {
  servicesOffered: string[];
  primaryOffer: string | null;
  secondaryOffers: string[];
  mostProfitableServices: string[];
  leastProfitableServices: string[];
  servicesToPush: string[];
  servicesToAvoid: string[];
  badFitWork: string[];
  seasonalServices: string[];
  recurringServices: string[];
  pricingDisplayPreference: string | null;
  pricingNotes: string | null;
  addOnsRequested: string[];
  sourceNotes: string[];
}

// ── 3. Customer Psychology ───────────────────────────────────────────────────

export interface CustomerPsychology {
  idealCustomerType: string | null;
  badFitCustomerType: string | null;
  customerFears: string[];
  customerObjections: string[];
  customerTrustTriggers: string[];
  customerComparisonFactors: string[];
  questionsCustomersAlwaysAsk: string[];
  commonMisunderstandings: string[];
  buyerEducationNeeded: string[];
  sourceNotes: string[];
}

// ── 4. Positioning ───────────────────────────────────────────────────────────
//
// DOCTRINE: MiniMorph does not police customer claims. The customer owns their
// claims. MiniMorph records claims, gives courtesy risk notices, offers safer
// alternatives, and documents the customer's direction. These fields capture
// that documentation — not approvals or denials.

export interface CustomerDirectedClaim {
  claim: string;
  claimType: "testimonial" | "credential" | "guarantee" | "statistic" | "outcome" | "other";
  riskReason: string | null;
  courtesyNoticeGiven: boolean;
  saferAlternativeSuggested: string | null;
  customerAcceptedSaferAlternative: boolean | null;
  customerDirectedOriginalWording: string | null;
  customerAcknowledgment: string | null;
  sourceNotes: string[];
}

export interface Positioning {
  uniqueDifferentiator: string | null;
  primaryPromise: string | null;
  brandTone: string | null;
  brandPersonality: string | null;
  safeClaims: string[];
  riskyCustomerDirectedClaims: CustomerDirectedClaim[];
  courtesyRiskNotices: string[];
  customerAcknowledgments: string[];
  doNotSayList: string[];
  competitorWeaknesses: string[];
  competitorSites: Array<{ url?: string; whatYouWantToBeat?: string; featuresYouWish?: string }>;
  competitiveAdvantages: string[];
  sourceNotes: string[];
}

// ── 5. Website Strategy ──────────────────────────────────────────────────────

export interface WebsiteStrategy {
  primaryGoal: string | null;
  secondaryGoals: string[];
  primaryCTA: string | null;
  secondaryCTAs: string[];
  pageStructure: string[];
  heroMessageDirection: string | null;
  faqTopics: string[];
  proofNeeded: string[];
  servicesFeatureOrder: string[];
  customerEducationNeeded: string[];
  conversionStrategy: string | null;
  inspirationStyle: Record<string, string> | null;
  avoidPatterns: string[];
  sourceNotes: string[];
}

// ── 6. Media / Visuals ───────────────────────────────────────────────────────

export interface MediaVisuals {
  hasLogo: boolean;
  logoUrl: string | null;
  hasCustomPhotos: boolean;
  photoUrls: string[];
  approvedAssetUrls: string[];
  mediaQuality: "customer_provided" | "needs_generation" | "mixed" | "unknown";
  needsMediaRescue: boolean;
  photoReplacementStrategy: string | null;
  mediaWarnings: string[];
  styleDirection: string | null;
  brandColors: string[];
  colorMood: string | null;
  sourceNotes: string[];
}

// ── 7. Risk / Compliance ─────────────────────────────────────────────────────
//
// DOCTRINE: MiniMorph gives courtesy notices, not compliance guarantees.
// These fields document what was flagged and what the customer acknowledged.
// MiniMorph recommends admin review for high-risk industries.

export interface RiskCompliance {
  regulatedIndustry: boolean;
  riskLevel: RiskLevel;
  riskReasons: string[];
  courtesyNoticesGiven: string[];
  customerDirectedClaims: CustomerDirectedClaim[];
  claimsRequiringAcknowledgment: string[];
  customerAcknowledgments: string[];
  unsupportedFeaturesRequested: string[];
  unsupportedFeatureAcknowledgments: string[];
  requiredDisclaimersSuggested: string[];
  adminReviewRecommended: boolean;
  adminReviewReason: string | null;
  sourceNotes: string[];
}

// ── 8. Generator Instructions ────────────────────────────────────────────────

export interface GeneratorInstructions {
  templateLane: string | null;
  templateName: string | null;
  bannedPhrases: string[];
  requiredFacts: string[];
  ctaRules: string[];
  claimHandlingRules: string[];
  toneRules: string[];
  proofRules: string[];
  contentPriorities: string[];
  factsNotToInvent: string[];
  reviewFlags: string[];
  sourceNotes: string[];
}

// ── 9. Add-On / Upsell Fit ──────────────────────────────────────────────────

export type AddOnFulfillmentType = "team_setup" | "customer_action" | "instant" | "admin_review_required" | "blocked" | "unknown";

export interface AddOnRecord {
  product: string;
  price: string | null;
  label: string | null;
  reasonForRecommendation: string | null;
  businessNeedConnectedTo: string | null;
  customerInterestLevel: "accepted" | "declined" | "recommended" | "under_review" | null;
  implementationStatus: "not_started" | "in_progress" | "complete" | "blocked" | null;
  billingSupported: boolean;
  generatorSupported: boolean;
  adminSupportRequired: boolean;
  fulfillmentType: AddOnFulfillmentType;
  setupDisclosureGiven: boolean;
}

export interface AddOnUpsellFit {
  recommendedAddOns: AddOnRecord[];
  acceptedAddOns: AddOnRecord[];
  declinedAddOns: AddOnRecord[];
  addOnsRequiringReview: AddOnRecord[];
  sourceNotes: string[];
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export interface BlueprintMetadata {
  blueprintVersion: number;
  createdFromQuestionnaireVersion: string;
  createdAt: string;
  updatedAt: string;
  completenessScore: number;
  missingCriticalFields: string[];
  internalWarnings: string[];
}

// ── Full Customer Reality Blueprint ─────────────────────────────────────────

export interface CustomerRealityBlueprint {
  // === 9 required sections ===
  businessIdentity: BusinessIdentity;
  offerStrategy: OfferStrategy;
  customerPsychology: CustomerPsychology;
  positioning: Positioning;
  websiteStrategy: WebsiteStrategy;
  mediaVisuals: MediaVisuals;
  riskCompliance: RiskCompliance;
  generatorInstructions: GeneratorInstructions;
  addOnUpsellFit: AddOnUpsellFit;
  metadata: BlueprintMetadata;

  // === Legacy keys — preserved for backward compatibility with portal/admin/generator ===
  businessName: string | null;
  websiteType: string | null;
  packageTier: string | null;
  designDirection: {
    brandTone: string | null;
    brandColors: string[] | null;
    inspirationStyle: Record<string, string> | null;
    avoidPatterns: string[];
  };
  contentPlan: {
    servicesOffered: string[];
    targetAudience: string | null;
    targetCustomerDescription: string | null;
    uniqueDifferentiator: string | null;
    contentPreference: string;
    specialRequests: string | null;
  };
  features: {
    mustHaveFeatures: string[];
    addonsSelected: Array<{ product: string; price?: string; label?: string }>;
    pricingDisplay: string;
  };
  businessDetails: {
    address: string | null;
    phone: string | null;
    hours: string | null;
    socialHandles: Record<string, string> | null;
    domainName: string | null;
    domainStatus: string;
  };
  competitiveStrategy: {
    competitorWeaknesses: string[];
    competitorSites: Array<{ url?: string; whatYouWantToBeat?: string }>;
  };
  inspirationSites: Array<{ url: string; whatYouLike?: string; whatYouDislike?: string }>;
  testimonials: Array<{ quote: string; name: string; context: string }>;
  hasCustomPhotos: boolean;
}

// ── Industry / Risk Derivation ───────────────────────────────────────────────

export type IndustryLane =
  | "home_services"
  | "professional_services"
  | "health_wellness"
  | "food_hospitality"
  | "automotive"
  | "technology"
  | "retail_ecommerce"
  | "creative_personal_brand"
  | "nonprofit_community"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "regulated_review_required";

export function deriveIndustryLane(websiteType: string, industry?: string): IndustryLane {
  const t = (websiteType ?? "").toLowerCase();
  const ind = (industry ?? "").toLowerCase();
  const combined = `${t} ${ind}`;

  if (/plumb|electric|hvac|roofer|roofing|contractor|construction|landscap|handyman|pest|moving|cleaning|maid|janitor|pressure wash|pool service|gutter|tree|home service|home repair/.test(combined)) return "home_services";
  if (/lawyer|law firm|attorney|legal|accountant|accounting|bookkeep|financial advis|financial plan|insurance|real estate|mortgage|notary|consult|agency|marketing agency|web design|pr firm|architect|engineer/.test(combined)) return "professional_services";
  if (/doctor|dentist|dental|therapist|therapy|mental health|counselor|chiropractor|physio|med spa|medical|clinic|health|wellness|yoga|fitness|gym|personal train|nutrition|dietitian|supplement|pharmaceutical|cannabis|cbd|dispensary/.test(combined)) return "health_wellness";
  if (/restaurant|bar|cafe|bakery|catering|food|brewery|winery|distillery|taproom|diner|bistro|coffee|pizza|sushi|taco|food truck/.test(combined)) return "food_hospitality";
  if (/auto|car|truck|vehicle|mechanic|detailing|tire|oil change|dealership|towing/.test(combined)) return "automotive";
  if (/software|saas|tech|technology|app|startup|it services|devops|cybersecurity|cloud|data|ai company|machine learning/.test(combined)) return "technology";
  if (/shop|store|retail|ecommerce|boutique|product|goods|maker|artisan|jewelry|clothing|fashion|handmade|etsy/.test(combined)) return "retail_ecommerce";
  if (/photo|photographer|videograph|music|artist|designer|creative|coach|speaker|author|brand|influencer|model|makeup|hair|salon|spa|beauty/.test(combined)) return "creative_personal_brand";
  if (/nonprofit|charity|foundation|community|church|ministry|association|volunteer|ngo/.test(combined)) return "nonprofit_community";
  return "other";
}

export function deriveRegulatedIndustry(websiteType: string, industry?: string): boolean {
  const combined = `${(websiteType ?? "").toLowerCase()} ${(industry ?? "").toLowerCase()}`;
  return /doctor|dentist|dental|therapist|therapy|mental health|counselor|chiropractor|physio|med spa|medical|clinic|lawyer|law firm|attorney|legal|financial advis|financial plan|investment|securities|insurance broker|alcohol|distillery|brewery|winery|bar |tavern|supplement|pharmaceutical|cannabis|cbd|dispensary|healthcare/.test(combined);
}

export function deriveRiskLevel(websiteType: string, addonsSelected?: unknown[], industry?: string): RiskLevel {
  const combined = `${(websiteType ?? "").toLowerCase()} ${(industry ?? "").toLowerCase()}`;
  const addons = Array.isArray(addonsSelected) ? addonsSelected.map((a: any) => String(a?.product ?? "").toLowerCase()) : [];

  if (/doctor|dentist|dental|therapist|therapy|mental health|counselor|chiropractor|physio|med spa|medical|clinic|lawyer|law firm|attorney|legal|financial advis|financial plan|investment|securities|pharmaceutical|cannabis|cbd|dispensary/.test(combined)) return "regulated_review_required";
  if (/distillery|brewery|winery|alcohol|supplement/.test(combined)) return "high";
  if (addons.some(a => /online.?store|ecommerce|shop/.test(a)) || /ecommerce|online.?store|shop|retail|product/.test(combined)) return "high";
  if (/bar |tavern|insurance|financial|real estate|crypto|supplement/.test(combined)) return "high";
  if (/restaurant|food|medical|health|wellness/.test(combined)) return "medium";
  return "low";
}

export function deriveTemplateLane(websiteType: string): string {
  const t = (websiteType ?? "").toLowerCase();
  if (/contractor|construction|roofing|plumbing|electrical/.test(t)) return "contractor";
  if (/restaurant|bar|cafe|dining/.test(t)) return "restaurant";
  if (/gym|fitness|crossfit|yoga/.test(t)) return "gym";
  if (/salon|spa|beauty|hair|nail/.test(t)) return "salon";
  if (/ecommerce|shop|store|boutique/.test(t)) return "ecommerce";
  if (/service|agency|consult|technology|cleaning|landscap|handyman|coaching/.test(t)) return "service";
  return "llm_fallback";
}

// ── Add-on fulfillment registry (what the platform actually supports) ────────

const ADDON_FULFILLMENT_MAP: Record<string, {
  generatorSupported: boolean;
  billingSupported: boolean;
  adminSupportRequired: boolean;
  fulfillmentType: AddOnFulfillmentType;
}> = {
  "review collector":       { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "seo autopilot":          { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "email marketing setup":  { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "ai chatbot":             { generatorSupported: true,  billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "competitor monitoring":  { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "booking widget":         { generatorSupported: true,  billingSupported: true,  adminSupportRequired: false, fulfillmentType: "customer_action" },
  "social feed":            { generatorSupported: true,  billingSupported: true,  adminSupportRequired: false, fulfillmentType: "customer_action" },
  "lead capture bot":       { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "sms lead alerts":        { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "logo design":            { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "professional copywriting":{ generatorSupported: false, billingSupported: true, adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "brand style guide":      { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "team_setup" },
  "online store":           { generatorSupported: false, billingSupported: true,  adminSupportRequired: true,  fulfillmentType: "admin_review_required" },
  "event calendar":         { generatorSupported: false, billingSupported: false, adminSupportRequired: true,  fulfillmentType: "blocked" },
  "menu price list":        { generatorSupported: false, billingSupported: false, adminSupportRequired: true,  fulfillmentType: "blocked" },
};

function lookupAddonFulfillment(productName: string) {
  const normalized = productName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (const [key, val] of Object.entries(ADDON_FULFILLMENT_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return val;
  }
  return { generatorSupported: false, billingSupported: true, adminSupportRequired: true, fulfillmentType: "unknown" as AddOnFulfillmentType };
}

export function buildAddOnRecords(
  addonsSelected: Array<{ product: string; price?: string; label?: string }>,
  interestLevel: "accepted"
): AddOnRecord[] {
  return addonsSelected.map(a => {
    const fulfillment = lookupAddonFulfillment(a.product);
    return {
      product: a.product,
      price: a.price ?? null,
      label: a.label ?? null,
      reasonForRecommendation: null,
      businessNeedConnectedTo: null,
      customerInterestLevel: interestLevel,
      implementationStatus: "not_started",
      billingSupported: fulfillment.billingSupported,
      generatorSupported: fulfillment.generatorSupported,
      adminSupportRequired: fulfillment.adminSupportRequired,
      fulfillmentType: fulfillment.fulfillmentType,
      setupDisclosureGiven: false,
    };
  });
}

// ── Completeness scoring ─────────────────────────────────────────────────────

export function scoreBlueprint(bp: CustomerRealityBlueprint): { score: number; missing: string[] } {
  const missing: string[] = [];

  if (!bp.businessIdentity.businessName) missing.push("businessIdentity.businessName");
  if (!bp.businessIdentity.industry) missing.push("businessIdentity.industry");
  if (!bp.businessIdentity.serviceArea) missing.push("businessIdentity.serviceArea");
  if (!bp.businessIdentity.phone) missing.push("businessIdentity.phone");

  if (bp.offerStrategy.servicesOffered.length === 0) missing.push("offerStrategy.servicesOffered");
  if (!bp.offerStrategy.primaryOffer) missing.push("offerStrategy.primaryOffer");

  if (!bp.positioning.uniqueDifferentiator) missing.push("positioning.uniqueDifferentiator");
  if (!bp.positioning.brandTone) missing.push("positioning.brandTone");

  if (!bp.websiteStrategy.primaryGoal) missing.push("websiteStrategy.primaryGoal");
  if (!bp.websiteStrategy.primaryCTA) missing.push("websiteStrategy.primaryCTA");

  if (!bp.generatorInstructions.templateLane) missing.push("generatorInstructions.templateLane");

  const totalChecks = 11;
  const score = Math.round(((totalChecks - missing.length) / totalChecks) * 100);
  return { score, missing };
}
