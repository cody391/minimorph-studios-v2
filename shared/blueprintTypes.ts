/**
 * Customer Reality Blueprint — Full schema types and derivation helpers.
 *
 * B6 Blueprint Schema Gate: extends the stored Blueprint so every new
 * Blueprint contains all 9 required sections from the Elena Master Baseline.
 *
 * B8 Claim/Proof Validation Gate: adds ClaimProofRecord, ClaimProofInventory,
 * and buildClaimProofInventory() helper so every Blueprint carries a structured
 * inventory of claims with source, risk level, customer-direction doctrine, and
 * generator-use instructions.
 *
 * B9 Add-On Fulfillment Truth Gate: AddOnRecord and AddOnUpsellFit now import
 * fulfillment truth from shared/addonFulfillment.ts. buildAddOnRecords() uses
 * the canonical registry. ADDON_FULFILLMENT_MAP removed.
 *
 * DOCTRINE: MiniMorph does not police customer claims. The customer owns their
 * claims. MiniMorph records them, flags risk, offers safer alternatives, and
 * documents the customer's direction. These types capture that documentation —
 * not approvals or denials.
 *
 * BACKWARD COMPAT: buildBlueprintFromQuestionnaire() still emits the legacy
 * top-level keys (businessName, websiteType, packageTier, designDirection,
 * contentPlan, features, businessDetails, competitiveStrategy, inspirationSites,
 * testimonials, hasCustomPhotos) so existing portal/admin/generator readers
 * continue working without changes.
 */

import {
  lookupAddonFulfillment as lookupAddonFulfillmentRecord,
  type AddonPublicOfferStatus,
  type AddonSupportTaskType,
} from "./addonFulfillment";

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

// ── B8 Claim / Proof Validation Types ────────────────────────────────────────
//
// Structured claim/proof tracking. Every proof item and risky claim gets a
// ClaimProofRecord in the Blueprint's claimProofInventory. These records tell
// the generator and admin exactly what was claimed, where it came from, how
// risky it is, and what to do with it.
//
// DOCTRINE: "customerDirected: true" means the customer owns the claim.
// MiniMorph records it, flags risk, offers safer wording, and documents
// acknowledgment. It does NOT delete, block, or police the claim unless
// MiniMorph chooses not to participate because the content is illegal,
// deceptive, harmful, or outside MiniMorph publish standards.

export type ClaimType =
  | "testimonial"
  | "review_rating"
  | "license"
  | "certification"
  | "award"
  | "years_in_business"
  | "guarantee"
  | "warranty"
  | "pricing"
  | "result_or_outcome"
  | "best_or_number_one"
  | "health_medical"
  | "legal"
  | "financial"
  | "regulatory"
  | "safety"
  | "environmental"
  | "product_claim"
  | "platform_promise"
  | "other";

export type ClaimSource =
  | "customer_provided"
  | "customer_uploaded_asset"
  | "scraped_existing_site"
  | "competitor_research"
  | "elena_inferred"
  | "minimorph_generated"
  | "admin_added"
  | "unknown";

export type ClaimSourceStatus =
  | "provided_unverified"
  | "customer_confirmed"
  | "admin_verified"
  | "unsupported"
  | "unknown";

export type ClaimRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "regulated_sensitive";

export type ClaimAdminReviewStatus =
  | "not_required"
  | "pending_review"
  | "verified"
  | "needs_customer_acknowledgment"
  | "customer_acknowledged"
  | "use_safer_alternative"
  | "omit_from_generation"
  | "blocked_by_minimorph_standard";

export type ClaimGeneratorUseStatus =
  | "use_as_written"
  | "use_safer_alternative"
  | "omit"
  | "flag_for_admin"
  | "customer_acknowledgment_required";

export interface ClaimProofRecord {
  id: string;
  claimText: string;
  claimType: ClaimType;
  source: ClaimSource;
  sourceDetail: string | null;
  sourceField: string | null;
  sourceStatus: ClaimSourceStatus;
  riskLevel: ClaimRiskLevel;
  customerDirected: boolean;
  miniMorphOwnedPromise: boolean;
  requiresCourtesyNotice: boolean;
  courtesyNoticeGiven: boolean;
  saferAlternativeSuggested: boolean;
  saferAlternativeText: string | null;
  customerAcceptedSaferAlternative: boolean | null;
  customerDirectedOriginalWording: boolean;
  customerAcknowledgedRisk: boolean;
  adminReviewStatus: ClaimAdminReviewStatus;
  adminReviewNotes: string | null;
  generatorUseStatus: ClaimGeneratorUseStatus;
  generatorInstruction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimProofInventory {
  claims: ClaimProofRecord[];
  claimsTotal: number;
  claimsRequiringReview: number;
  claimsRequiringCustomerAcknowledgment: number;
  claimsSafeForGeneration: number;
  claimsToOmit: number;
  miniMorphOwnedPromisesDetected: number;
  lastScannedAt: string;
}

// Words that trigger elevated risk classification when found in free-text fields.
// Used by buildClaimProofInventory() to scan uniqueDifferentiator, specialRequests, etc.
export const RISKY_CLAIM_WORDS = {
  regulated_sensitive: ["cure", "diagnose", "treat", "heal from", "prevent disease", "no side effects", "clinically proven"],
  high: ["100% guaranteed", "money-back guarantee", "money back", "risk-free", "no risk ", "guaranteed outcome", "guaranteed results", "no obligation"],
  medium: ["guarantee", "guaranteed", "warranty", "#1", "number one", "best ", "fastest", "award-winning", "top-rated", "compliant", "results ", "win "],
} as const;

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
  // B8: structured claim/proof inventory (optional for backward compat with B6 test helper)
  claimProofInventory?: ClaimProofInventory;
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
  // B8: claim/proof summary (optional for backward compat with B6 test helper)
  claimsSummary?: {
    claimsTotal: number;
    claimsRequiringReview: number;
    claimsRequiringCustomerAcknowledgment: number;
    claimsSafeForGeneration: number;
    claimsToOmit: number;
    miniMorphOwnedPromisesDetected: number;
  };
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
  // B8: per-claim generator instructions (optional for backward compat with B6 test helper)
  claimsSafeToUse?: string[];
  claimsToOmit?: string[];
  claimsNeedingAdminReview?: string[];
  claimsNeedingCustomerAcknowledgment?: string[];
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
  // B9: fulfillment truth fields
  canElenaRecommend: boolean;
  canCheckoutPurchase: boolean;
  canAppearOnGeneratedSite: boolean;
  canAppearInPortal: boolean;
  publicOfferStatus: AddonPublicOfferStatus;
  elenaSafePitch: string | null;
  elenaDoNotSay: string | null;
  buildReportLabel: string | null;
  portalStatusLabel: string | null;
  supportTaskType: AddonSupportTaskType | null;
  blockedReason: string | null;
}

export interface AddOnUpsellFit {
  recommendedAddOns: AddOnRecord[];
  acceptedAddOns: AddOnRecord[];
  declinedAddOns: AddOnRecord[];
  addOnsRequiringReview: AddOnRecord[];
  sourceNotes: string[];
  // B9: fulfillment classification buckets
  addOnsTeamSetup: AddOnRecord[];
  addOnsCustomerAction: AddOnRecord[];
  addOnsBlocked: AddOnRecord[];
  addOnsNotSupported: AddOnRecord[];
  fulfillmentSummary: {
    total: number;
    teamSetup: number;
    customerAction: number;
    instant: number;
    blocked: number;
  };
  billingSummary: {
    total: number;
    billingSupported: number;
    billingUnsupported: number;
  };
  generatorSummary: {
    total: number;
    generatorSupported: number;
    generatorUnsupported: number;
  };
  portalSummary: {
    total: number;
    portalSupported: number;
  };
  supportTasksNeeded: string[];
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

// ── Add-on fulfillment — delegates to canonical registry in addonFulfillment.ts ─

export function buildAddOnRecords(
  addonsSelected: Array<{ product: string; price?: string; label?: string }>,
  interestLevel: "accepted"
): AddOnRecord[] {
  return addonsSelected.map(a => {
    const reg = lookupAddonFulfillmentRecord(a.product);
    return {
      product: a.product,
      price: a.price ?? null,
      label: a.label ?? null,
      reasonForRecommendation: null,
      businessNeedConnectedTo: null,
      customerInterestLevel: interestLevel,
      implementationStatus: "not_started",
      billingSupported: reg?.billingSupported ?? true,
      generatorSupported: reg?.generatorSupported ?? false,
      adminSupportRequired: reg?.requiresTeamSetup ?? true,
      fulfillmentType: (reg?.fulfillmentType ?? "unknown") as AddOnFulfillmentType,
      setupDisclosureGiven: false,
      // B9 fulfillment truth fields
      canElenaRecommend: reg?.canElenaRecommend ?? false,
      canCheckoutPurchase: reg?.canCheckoutPurchase ?? false,
      canAppearOnGeneratedSite: reg?.generatorSupported ?? false,
      canAppearInPortal: reg?.portalSupported ?? false,
      publicOfferStatus: (reg?.publicOfferStatus ?? "not_supported") as AddonPublicOfferStatus,
      elenaSafePitch: reg?.elenaSafePitch ?? null,
      elenaDoNotSay: reg?.elenaDoNotSay ?? null,
      buildReportLabel: reg?.buildReportLabel ?? null,
      portalStatusLabel: reg?.portalStatusLabel ?? null,
      supportTaskType: (reg?.supportTaskType ?? "none") as AddonSupportTaskType,
      blockedReason: reg?.blockedReason ?? null,
    };
  });
}

/**
 * Build the full AddOnUpsellFit with B9 classification buckets and summaries.
 */
export function buildAddOnUpsellFit(
  acceptedAddons: AddOnRecord[],
  recommendedAddons: AddOnRecord[],
  declinedAddons: AddOnRecord[],
  sourceNotes: string[]
): AddOnUpsellFit {
  const all = [...acceptedAddons, ...recommendedAddons];

  const addOnsTeamSetup = all.filter(a => a.fulfillmentType === "team_setup");
  const addOnsCustomerAction = all.filter(a => a.fulfillmentType === "customer_action");
  const addOnsBlocked = all.filter(a => a.fulfillmentType === "blocked" || a.publicOfferStatus === "blocked");
  const addOnsNotSupported = all.filter(a => a.publicOfferStatus === "not_supported");

  const supportTasksNeeded = addOnsTeamSetup
    .filter(a => a.supportTaskType && a.supportTaskType !== "none")
    .map(a => `${a.product}: ${a.supportTaskType}`);

  return {
    recommendedAddOns: recommendedAddons,
    acceptedAddOns: acceptedAddons,
    declinedAddOns: declinedAddons,
    addOnsRequiringReview: all.filter(a => a.fulfillmentType === "admin_review_required"),
    sourceNotes,
    addOnsTeamSetup,
    addOnsCustomerAction,
    addOnsBlocked,
    addOnsNotSupported,
    fulfillmentSummary: {
      total: all.length,
      teamSetup: addOnsTeamSetup.length,
      customerAction: addOnsCustomerAction.length,
      instant: all.filter(a => a.fulfillmentType === "instant").length,
      blocked: addOnsBlocked.length,
    },
    billingSummary: {
      total: all.length,
      billingSupported: all.filter(a => a.billingSupported).length,
      billingUnsupported: all.filter(a => !a.billingSupported).length,
    },
    generatorSummary: {
      total: all.length,
      generatorSupported: all.filter(a => a.generatorSupported).length,
      generatorUnsupported: all.filter(a => !a.generatorSupported).length,
    },
    portalSummary: {
      total: all.length,
      portalSupported: all.filter(a => a.canAppearInPortal).length,
    },
    supportTasksNeeded,
  };
}

// ── B8: Claim / Proof Validation Helpers ─────────────────────────────────────

function scanRiskLevel(text: string): ClaimRiskLevel {
  const lower = text.toLowerCase();
  for (const w of RISKY_CLAIM_WORDS.regulated_sensitive) {
    if (lower.includes(w)) return "regulated_sensitive";
  }
  for (const w of RISKY_CLAIM_WORDS.high) {
    if (lower.includes(w)) return "high";
  }
  for (const w of RISKY_CLAIM_WORDS.medium) {
    if (lower.includes(w)) return "medium";
  }
  return "low";
}

function riskToAdminStatus(risk: ClaimRiskLevel): ClaimAdminReviewStatus {
  if (risk === "regulated_sensitive" || risk === "high" || risk === "medium") return "pending_review";
  return "not_required";
}

function riskToGeneratorStatus(risk: ClaimRiskLevel): ClaimGeneratorUseStatus {
  if (risk === "regulated_sensitive" || risk === "high" || risk === "medium") return "flag_for_admin";
  return "use_as_written";
}

function detectClaimType(text: string): ClaimType {
  const lower = text.toLowerCase();
  // Check most specific / distinctive types first
  if (/cure|diagnose|treat|heal/.test(lower)) return "health_medical";
  if (/compliant|compliance|regulatory/.test(lower)) return "regulatory";
  if (/#1|number one|best |fastest|award.winning|top.rated/.test(lower)) return "best_or_number_one";
  if (/guarantee|guaranteed|warranty/.test(lower)) return "guarantee";
  if (/result|outcome|proven/.test(lower)) return "result_or_outcome";
  return "other";
}

export function buildClaimProofInventory(
  q: Record<string, unknown>,
  regulated: boolean,
  overallRiskLevel: RiskLevel
): ClaimProofInventory {
  const now = new Date().toISOString();
  const claims: ClaimProofRecord[] = [];
  let idx = 0;
  const id = (tag: string) => `claim_${tag}_${idx++}`;

  // ── 1. Testimonials ────────────────────────────────────────────────────────
  const testimonials = Array.isArray(q.testimonials) ? q.testimonials as any[] : [];
  for (const t of testimonials) {
    if (!t || (!t.quote && !t.name)) continue;
    const parts = [t.quote, t.name ? `— ${t.name}` : null, t.context ? `(${t.context})` : null].filter(Boolean);
    const text = parts.join(" ");
    claims.push({
      id: id("testimonial"),
      claimText: text,
      claimType: "testimonial",
      source: "customer_provided",
      sourceDetail: "testimonials array",
      sourceField: "q.testimonials",
      sourceStatus: "provided_unverified",
      riskLevel: "low",
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: false,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: false,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: "not_required",
      adminReviewNotes: null,
      generatorUseStatus: "use_as_written",
      generatorInstruction: "Use customer testimonial as provided. Do not modify the quote or invent context.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 2. License number ──────────────────────────────────────────────────────
  if (q.licenseNumber && typeof q.licenseNumber === "string" && q.licenseNumber.trim()) {
    const risk: ClaimRiskLevel = regulated ? "medium" : "low";
    claims.push({
      id: id("license"),
      claimText: `Licensed: ${q.licenseNumber.trim()}`,
      claimType: "license",
      source: "customer_provided",
      sourceDetail: "licenseNumber field",
      sourceField: "q.licenseNumber",
      sourceStatus: "provided_unverified",
      riskLevel: risk,
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: false,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: false,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: regulated ? "pending_review" : "not_required",
      adminReviewNotes: null,
      generatorUseStatus: "use_as_written",
      generatorInstruction: "Display license number as provided by customer. Do not verify or alter.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 3. Years in business ───────────────────────────────────────────────────
  if (q.yearsInBusiness && typeof q.yearsInBusiness === "string" && q.yearsInBusiness.trim()) {
    claims.push({
      id: id("years_in_business"),
      claimText: `${q.yearsInBusiness.trim()} in business`,
      claimType: "years_in_business",
      source: "customer_provided",
      sourceDetail: "yearsInBusiness field",
      sourceField: "q.yearsInBusiness",
      sourceStatus: "provided_unverified",
      riskLevel: "low",
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: false,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: false,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: "not_required",
      adminReviewNotes: null,
      generatorUseStatus: "use_as_written",
      generatorInstruction: "Use years-in-business as stated by customer.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 4. Certifications ──────────────────────────────────────────────────────
  const certifications = Array.isArray(q.certifications) ? q.certifications as string[] : [];
  for (const cert of certifications) {
    if (!cert || !cert.trim()) continue;
    const risk: ClaimRiskLevel = regulated ? "medium" : "low";
    claims.push({
      id: id("certification"),
      claimText: `Certified: ${cert.trim()}`,
      claimType: "certification",
      source: "customer_provided",
      sourceDetail: "certifications array",
      sourceField: "q.certifications",
      sourceStatus: "provided_unverified",
      riskLevel: risk,
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: false,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: false,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: regulated ? "pending_review" : "not_required",
      adminReviewNotes: null,
      generatorUseStatus: "use_as_written",
      generatorInstruction: "Use certification as provided. Do not verify or alter.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 5. Awards ─────────────────────────────────────────────────────────────
  const awards = Array.isArray(q.awards) ? q.awards as string[] : [];
  for (const award of awards) {
    if (!award || !award.trim()) continue;
    claims.push({
      id: id("award"),
      claimText: `Award: ${award.trim()}`,
      claimType: "award",
      source: "customer_provided",
      sourceDetail: "awards array",
      sourceField: "q.awards",
      sourceStatus: "provided_unverified",
      riskLevel: "medium",
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: true,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: false,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: "pending_review",
      adminReviewNotes: null,
      generatorUseStatus: "flag_for_admin",
      generatorInstruction: "Award claim — requires admin review before publishing. Customer provided this claim.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 6. uniqueDifferentiator — scan for risky words ─────────────────────────
  if (q.uniqueDifferentiator && typeof q.uniqueDifferentiator === "string" && q.uniqueDifferentiator.trim()) {
    const text = q.uniqueDifferentiator.trim();
    const risk = scanRiskLevel(text);
    const isRisky = risk !== "low";
    claims.push({
      id: id("differentiator"),
      claimText: text,
      claimType: isRisky ? detectClaimType(text) : "other",
      source: "customer_provided",
      sourceDetail: "uniqueDifferentiator field",
      sourceField: "q.uniqueDifferentiator",
      sourceStatus: "provided_unverified",
      riskLevel: risk,
      customerDirected: true,
      miniMorphOwnedPromise: false,
      requiresCourtesyNotice: isRisky,
      courtesyNoticeGiven: false,
      saferAlternativeSuggested: isRisky,
      saferAlternativeText: null,
      customerAcceptedSaferAlternative: null,
      customerDirectedOriginalWording: true,
      customerAcknowledgedRisk: false,
      adminReviewStatus: riskToAdminStatus(risk),
      adminReviewNotes: null,
      generatorUseStatus: riskToGeneratorStatus(risk),
      generatorInstruction: isRisky
        ? `Unique differentiator contains ${risk}-risk language. Admin review before using in generation. Customer owns this claim.`
        : "Use differentiator as provided.",
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 7. specialRequests — scan for risky words (only record if risky) ────────
  if (q.specialRequests && typeof q.specialRequests === "string" && q.specialRequests.trim()) {
    const text = q.specialRequests.trim();
    const risk = scanRiskLevel(text);
    if (risk !== "low") {
      claims.push({
        id: id("special_requests"),
        claimText: text,
        claimType: detectClaimType(text),
        source: "customer_provided",
        sourceDetail: "specialRequests field",
        sourceField: "q.specialRequests",
        sourceStatus: "provided_unverified",
        riskLevel: risk,
        customerDirected: true,
        miniMorphOwnedPromise: false,
        requiresCourtesyNotice: true,
        courtesyNoticeGiven: false,
        saferAlternativeSuggested: true,
        saferAlternativeText: null,
        customerAcceptedSaferAlternative: null,
        customerDirectedOriginalWording: true,
        customerAcknowledgedRisk: false,
        adminReviewStatus: "pending_review",
        adminReviewNotes: null,
        generatorUseStatus: riskToGeneratorStatus(risk),
        generatorInstruction: `Special request contains ${risk}-risk language. Admin review before using in generation. Customer owns this claim.`,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // ── Compute summary ────────────────────────────────────────────────────────
  const claimsTotal = claims.length;
  const claimsRequiringReview = claims.filter(c => c.adminReviewStatus === "pending_review").length;
  const claimsRequiringCustomerAcknowledgment = claims.filter(c => c.requiresCourtesyNotice && !c.customerAcknowledgedRisk).length;
  const claimsSafeForGeneration = claims.filter(c => c.generatorUseStatus === "use_as_written").length;
  const claimsToOmit = claims.filter(c => c.generatorUseStatus === "omit").length;
  const miniMorphOwnedPromisesDetected = claims.filter(c => c.miniMorphOwnedPromise).length;

  return {
    claims,
    claimsTotal,
    claimsRequiringReview,
    claimsRequiringCustomerAcknowledgment,
    claimsSafeForGeneration,
    claimsToOmit,
    miniMorphOwnedPromisesDetected,
    lastScannedAt: now,
  };
}

// Extract generator-facing claim lists from a completed inventory.
export function extractGeneratorClaimLists(inventory: ClaimProofInventory): {
  claimsSafeToUse: string[];
  claimsToOmit: string[];
  claimsNeedingAdminReview: string[];
  claimsNeedingCustomerAcknowledgment: string[];
} {
  return {
    claimsSafeToUse: inventory.claims
      .filter(c => c.generatorUseStatus === "use_as_written")
      .map(c => c.claimText),
    claimsToOmit: inventory.claims
      .filter(c => c.generatorUseStatus === "omit")
      .map(c => c.claimText),
    claimsNeedingAdminReview: inventory.claims
      .filter(c => c.adminReviewStatus === "pending_review" || c.generatorUseStatus === "flag_for_admin")
      .map(c => c.claimText),
    claimsNeedingCustomerAcknowledgment: inventory.claims
      .filter(c => c.requiresCourtesyNotice && !c.customerAcknowledgedRisk)
      .map(c => c.claimText),
  };
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
