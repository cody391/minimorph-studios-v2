/**
 * B11 — Blueprint → Generator Verbatim Handoff
 *
 * Extracts every generator-relevant field from a stored CustomerRealityBlueprint
 * and builds a structured handoff object. The generator uses this instead of
 * re-reading raw questionnaire data for instruction fields.
 *
 * Design principles:
 * - Safe parsing: never crashes on missing/null Blueprint sections
 * - Verbatim preservation: customer-provided text is carried exactly
 * - Explicit omission: missing fields are listed with reasons, not silently dropped
 * - Integrity score: generation can be flagged (but not blocked for legacy Blueprints)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HandoffVerbatimBlock {
  businessDescription: string | null;
  uniqueDifferentiator: string | null;
  primaryPromise: string | null;
  specialRequests: string | null;
  servicesOffered: string[];
  licenses: string[];
  certifications: string[];
  yearsInBusiness: string | null;
  ownerName: string | null;
  brandVoiceNotes: string[];
}

export interface HandoffIntegrityReport {
  totalBlueprintFieldsChecked: number;
  fieldsPassedToGenerator: number;
  fieldsOmitted: number;
  omittedFieldsWithReasons: Array<{ field: string; reason: string }>;
  missingRequiredGeneratorFields: string[];
  verbatimFieldsPreserved: number;
  verbatimFieldsOmitted: number;
  claimFieldsPassed: number;
  claimFieldsBlocked: number;
  addOnFieldsPassed: number;
  addOnFieldsBlocked: number;
  riskWarnings: string[];
  integrityScore: number;
  safeToGenerate: boolean;
}

export interface BlueprintGeneratorHandoff {
  // Raw Blueprint preserved for auditing
  rawBlueprintJson: unknown;

  // Verbatim customer truth — must appear in prompt exactly as provided
  mustPreserveVerbatim: HandoffVerbatimBlock;

  // Generator rules (from generatorInstructions section)
  bannedPhrases: string[];
  doNotSayList: string[];
  factsNotToInvent: string[];
  claimsSafeToUse: string[];
  claimsToOmit: string[];
  claimsNeedingAdminReview: string[];
  claimsNeedingCustomerAcknowledgment: string[];
  claimHandlingRules: string[];
  toneRules: string[];
  ctaRules: string[];
  proofRules: string[];
  contentPriorities: string[];
  reviewFlags: string[];
  requiredFacts: string[];

  // Customer psychology (from customerPsychology section)
  customerFears: string[];
  customerObjections: string[];
  customerTrustTriggers: string[];
  idealCustomerType: string | null;
  badFitCustomerType: string | null;
  questionsCustomersAlwaysAsk: string[];
  commonMisunderstandings: string[];
  buyerEducationNeeded: string[];

  // Offer strategy (from offerStrategy section)
  servicesToPush: string[];
  servicesToAvoid: string[];
  primaryOffer: string | null;
  mostProfitableServices: string[];
  badFitWork: string[];

  // Website strategy (from websiteStrategy section)
  primaryCTA: string | null;
  secondaryCTAs: string[];
  heroMessageDirection: string | null;
  conversionStrategy: string | null;

  // Positioning (from positioning section)
  competitiveAdvantages: string[];
  brandPersonality: string | null;
  courtesyRiskNotices: string[];

  // Add-on fulfillment truth (from addOnUpsellFit section)
  addOnsAllowedInGeneratedSite: string[];
  addOnsExcludedFromGeneratedSite: string[];
  addOnsPendingTeamSetup: string[];
  addOnsRequiringCustomerAction: string[];

  // Risk / compliance (from riskCompliance section)
  regulatedIndustry: boolean;
  riskLevel: string;
  adminReviewRecommended: boolean;
  adminReviewReason: string | null;
  requiredDisclaimersSuggested: string[];

  // Integrity
  integrityReport: HandoffIntegrityReport;
}

// ── Safe field extractor ──────────────────────────────────────────────────────

function safe<T>(fn: () => T, fallback: T): T {
  try {
    const v = fn();
    return v !== null && v !== undefined ? v : fallback;
  } catch {
    return fallback;
  }
}

function safeArray(fn: () => unknown): string[] {
  try {
    const v = fn();
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

function safeStr(fn: () => unknown): string | null {
  try {
    const v = fn();
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    return null;
  } catch {
    return null;
  }
}

function safeBool(fn: () => unknown, fallback = false): boolean {
  try {
    const v = fn();
    return typeof v === "boolean" ? v : fallback;
  } catch {
    return fallback;
  }
}

// ── Main builder ─────────────────────────────────────────────────────────────

export function buildBlueprintGeneratorHandoff(blueprintJson: unknown): BlueprintGeneratorHandoff {
  const bp = (blueprintJson && typeof blueprintJson === "object" ? blueprintJson : {}) as Record<string, unknown>;
  const bi = (bp.businessIdentity && typeof bp.businessIdentity === "object" ? bp.businessIdentity : {}) as Record<string, unknown>;
  const os = (bp.offerStrategy && typeof bp.offerStrategy === "object" ? bp.offerStrategy : {}) as Record<string, unknown>;
  const cp = (bp.customerPsychology && typeof bp.customerPsychology === "object" ? bp.customerPsychology : {}) as Record<string, unknown>;
  const pos = (bp.positioning && typeof bp.positioning === "object" ? bp.positioning : {}) as Record<string, unknown>;
  const ws = (bp.websiteStrategy && typeof bp.websiteStrategy === "object" ? bp.websiteStrategy : {}) as Record<string, unknown>;
  const gi = (bp.generatorInstructions && typeof bp.generatorInstructions === "object" ? bp.generatorInstructions : {}) as Record<string, unknown>;
  const rc = (bp.riskCompliance && typeof bp.riskCompliance === "object" ? bp.riskCompliance : {}) as Record<string, unknown>;
  const ao = (bp.addOnUpsellFit && typeof bp.addOnUpsellFit === "object" ? bp.addOnUpsellFit : {}) as Record<string, unknown>;

  // Extract add-on names safely from AddOnRecord[]
  const addonNames = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((a: unknown) => {
      if (a && typeof a === "object") {
        const r = a as Record<string, unknown>;
        return typeof r.product === "string" ? r.product : typeof r.id === "string" ? r.id : null;
      }
      return null;
    }).filter((x): x is string => x !== null);
  };

  // Claim lists — prefer generatorInstructions.claimsSafeToUse, fall back to positioning.safeClaims
  const claimsSafeToUse = safeArray(() => gi.claimsSafeToUse ?? pos.safeClaims);
  const claimsToOmit = safeArray(() => gi.claimsToOmit);
  const claimsNeedingAdminReview = safeArray(() => gi.claimsNeedingAdminReview);
  const claimsNeedingCustomerAcknowledgment = safeArray(() => gi.claimsNeedingCustomerAcknowledgment);

  // Do-not-say: merge from positioning.doNotSayList and generatorInstructions.bannedPhrases
  const doNotSayList = safeArray(() => pos.doNotSayList);
  const bannedPhrases = safeArray(() => gi.bannedPhrases);

  // Generator-allowed add-ons: acceptedAddOns that have canAppearOnGeneratedSite !== false
  const acceptedRaw = Array.isArray(ao.acceptedAddOns) ? ao.acceptedAddOns : [];
  const addOnsAllowedInGeneratedSite = addonNames(
    acceptedRaw.filter((a: unknown) => {
      if (a && typeof a === "object") {
        const r = a as Record<string, unknown>;
        return r.canAppearOnGeneratedSite !== false;
      }
      return true;
    })
  );
  const addOnsExcludedFromGeneratedSite = addonNames(ao.addOnsBlocked ?? []);
  const addOnsPendingTeamSetup = addonNames(ao.addOnsTeamSetup ?? []);
  const addOnsRequiringCustomerAction = addonNames(ao.addOnsCustomerAction ?? []);

  const mustPreserveVerbatim: HandoffVerbatimBlock = {
    businessDescription: safeStr(() => bi.businessDescription ?? bi.businessName),
    uniqueDifferentiator: safeStr(() => pos.uniqueDifferentiator),
    primaryPromise: safeStr(() => pos.primaryPromise),
    specialRequests: safeStr(() => ws.specialRequests ?? ws.primaryGoal),
    servicesOffered: safeArray(() => os.servicesOffered),
    licenses: safeArray(() => bi.licenses),
    certifications: safeArray(() => bi.certifications),
    yearsInBusiness: safeStr(() => bi.yearsInBusiness),
    ownerName: safeStr(() => bi.ownerName),
    brandVoiceNotes: safeArray(() => pos.sourceNotes ?? []),
  };

  const handoffWithoutReport: Omit<BlueprintGeneratorHandoff, "integrityReport"> = {
    rawBlueprintJson: blueprintJson,
    mustPreserveVerbatim,

    bannedPhrases,
    doNotSayList,
    factsNotToInvent: safeArray(() => gi.factsNotToInvent),
    claimsSafeToUse,
    claimsToOmit,
    claimsNeedingAdminReview,
    claimsNeedingCustomerAcknowledgment,
    claimHandlingRules: safeArray(() => gi.claimHandlingRules),
    toneRules: safeArray(() => gi.toneRules),
    ctaRules: safeArray(() => gi.ctaRules),
    proofRules: safeArray(() => gi.proofRules),
    contentPriorities: safeArray(() => gi.contentPriorities),
    reviewFlags: safeArray(() => gi.reviewFlags),
    requiredFacts: safeArray(() => gi.requiredFacts),

    customerFears: safeArray(() => cp.customerFears),
    customerObjections: safeArray(() => cp.customerObjections),
    customerTrustTriggers: safeArray(() => cp.customerTrustTriggers),
    idealCustomerType: safeStr(() => cp.idealCustomerType),
    badFitCustomerType: safeStr(() => cp.badFitCustomerType),
    questionsCustomersAlwaysAsk: safeArray(() => cp.questionsCustomersAlwaysAsk),
    commonMisunderstandings: safeArray(() => cp.commonMisunderstandings),
    buyerEducationNeeded: safeArray(() => cp.buyerEducationNeeded),

    servicesToPush: safeArray(() => os.servicesToPush),
    servicesToAvoid: safeArray(() => os.servicesToAvoid),
    primaryOffer: safeStr(() => os.primaryOffer),
    mostProfitableServices: safeArray(() => os.mostProfitableServices),
    badFitWork: safeArray(() => os.badFitWork),

    primaryCTA: safeStr(() => ws.primaryCTA),
    secondaryCTAs: safeArray(() => ws.secondaryCTAs),
    heroMessageDirection: safeStr(() => ws.heroMessageDirection),
    conversionStrategy: safeStr(() => ws.conversionStrategy),

    competitiveAdvantages: safeArray(() => pos.competitiveAdvantages),
    brandPersonality: safeStr(() => pos.brandPersonality),
    courtesyRiskNotices: safeArray(() => pos.courtesyRiskNotices ?? rc.courtesyNoticesGiven),

    addOnsAllowedInGeneratedSite,
    addOnsExcludedFromGeneratedSite,
    addOnsPendingTeamSetup,
    addOnsRequiringCustomerAction,

    regulatedIndustry: safeBool(() => rc.regulatedIndustry),
    riskLevel: safeStr(() => rc.riskLevel) ?? "standard",
    adminReviewRecommended: safeBool(() => rc.adminReviewRecommended),
    adminReviewReason: safeStr(() => rc.adminReviewReason),
    requiredDisclaimersSuggested: safeArray(() => rc.requiredDisclaimersSuggested),
  };

  const integrityReport = buildHandoffIntegrityReport(handoffWithoutReport, bp);

  return { ...handoffWithoutReport, integrityReport };
}

// ── Integrity report ──────────────────────────────────────────────────────────

export function buildHandoffIntegrityReport(
  handoff: Omit<BlueprintGeneratorHandoff, "integrityReport">,
  rawBp: Record<string, unknown> = {}
): HandoffIntegrityReport {
  const omissions: Array<{ field: string; reason: string }> = [];
  const missingRequired: string[] = [];
  const riskWarnings: string[] = [];
  let passed = 0;
  let omitted = 0;
  let verbatimPreserved = 0;
  let verbatimOmitted = 0;

  const totalFields = 40;

  // Core verbatim fields
  const verbatimChecks: Array<{ key: keyof HandoffVerbatimBlock; label: string; required: boolean }> = [
    { key: "businessDescription", label: "businessIdentity.businessDescription", required: true },
    { key: "uniqueDifferentiator", label: "positioning.uniqueDifferentiator", required: true },
    { key: "primaryPromise", label: "positioning.primaryPromise", required: false },
    { key: "specialRequests", label: "websiteStrategy.specialRequests", required: false },
    { key: "ownerName", label: "businessIdentity.ownerName", required: false },
    { key: "yearsInBusiness", label: "businessIdentity.yearsInBusiness", required: false },
  ];

  for (const check of verbatimChecks) {
    const val = handoff.mustPreserveVerbatim[check.key];
    if ((typeof val === "string" && val.length > 0) || (Array.isArray(val) && val.length > 0)) {
      verbatimPreserved++;
      passed++;
    } else {
      verbatimOmitted++;
      omitted++;
      omissions.push({ field: check.label, reason: "not provided in questionnaire" });
      if (check.required) missingRequired.push(check.label);
    }
  }

  // Generator instruction fields
  const instructionChecks: Array<{ arr: string[]; label: string; required: boolean }> = [
    { arr: handoff.factsNotToInvent, label: "generatorInstructions.factsNotToInvent", required: true },
    { arr: handoff.bannedPhrases, label: "generatorInstructions.bannedPhrases", required: false },
    { arr: handoff.doNotSayList, label: "positioning.doNotSayList", required: false },
    { arr: handoff.toneRules, label: "generatorInstructions.toneRules", required: false },
    { arr: handoff.ctaRules, label: "generatorInstructions.ctaRules", required: false },
    { arr: handoff.claimHandlingRules, label: "generatorInstructions.claimHandlingRules", required: false },
    { arr: handoff.claimsSafeToUse, label: "generatorInstructions.claimsSafeToUse", required: false },
    { arr: handoff.claimsToOmit, label: "generatorInstructions.claimsToOmit", required: false },
    { arr: handoff.claimsNeedingAdminReview, label: "generatorInstructions.claimsNeedingAdminReview", required: false },
  ];

  for (const check of instructionChecks) {
    if (check.arr.length > 0) {
      passed++;
    } else {
      omitted++;
      omissions.push({ field: check.label, reason: "empty — not derived from questionnaire" });
      if (check.required) missingRequired.push(check.label);
    }
  }

  // Customer psychology
  const psychFilled = handoff.customerFears.length + handoff.customerObjections.length + handoff.customerTrustTriggers.length;
  if (psychFilled > 0) {
    passed += 3;
  } else {
    omitted += 3;
    omissions.push({ field: "customerPsychology.*", reason: "not collected — Elena did not capture fear/objection/trust data" });
    riskWarnings.push("Customer psychology empty — generator may produce generic copy");
  }

  // Offer strategy
  if (handoff.servicesToPush.length > 0) {
    passed++;
  } else {
    omitted++;
    omissions.push({ field: "offerStrategy.servicesToPush", reason: "not provided" });
  }

  // Claims
  const claimFieldsPassed = (handoff.claimsSafeToUse.length > 0 ? 1 : 0) + (handoff.claimsToOmit.length > 0 ? 1 : 0) + (handoff.claimsNeedingAdminReview.length > 0 ? 1 : 0);
  const claimFieldsBlocked = 3 - claimFieldsPassed;

  // Add-ons
  const addOnFieldsPassed = handoff.addOnsAllowedInGeneratedSite.length > 0 ? 1 : 0;
  const addOnFieldsBlocked = handoff.addOnsExcludedFromGeneratedSite.length;

  // Blueprint section presence
  const sectionPresenceScore = [
    "businessIdentity", "offerStrategy", "customerPsychology",
    "positioning", "websiteStrategy", "generatorInstructions", "riskCompliance",
  ].filter(s => s in rawBp && rawBp[s] !== null).length;

  // Risk warnings
  if (handoff.claimsNeedingAdminReview.length > 0) {
    riskWarnings.push(`${handoff.claimsNeedingAdminReview.length} claim(s) flagged for admin review — verify before site goes live`);
  }
  if (handoff.regulatedIndustry) {
    riskWarnings.push(`Regulated industry (riskLevel: ${handoff.riskLevel}) — generator must not invent credentials or compliance claims`);
  }
  if (handoff.doNotSayList.length === 0 && handoff.bannedPhrases.length === 0) {
    riskWarnings.push("No banned phrases or do-not-say list — generator has no explicit omission rules for this project");
  }

  // Integrity score (0-100)
  // 40 total fields tracked:
  // - 6 verbatim fields × 5 pts each = 30 pts max
  // - 9 instruction fields × 3 pts each = 27 pts max
  // - 3 psychology fields × 3 pts each = 9 pts max
  // - 1 offer strategy field × 2 pts = 2 pts max
  // - 7 section presence × ~4.57 pts each = 32 pts max
  // Total above = 100 pts
  const verbatimPts = verbatimPreserved * 5;
  const instructionPts = instructionChecks.filter(c => c.arr.length > 0).length * 3;
  const psychPts = Math.min(psychFilled, 3) * 3;
  const offerPts = handoff.servicesToPush.length > 0 ? 2 : 0;
  const sectionPts = Math.round(sectionPresenceScore * (32 / 7));
  const rawScore = verbatimPts + instructionPts + psychPts + offerPts + sectionPts;
  const integrityScore = Math.min(100, rawScore);

  // safeToGenerate: only block if no Blueprint sections exist at all (empty/null object)
  // We never block on score alone — low-info projects should still generate
  const hasAnySection = sectionPresenceScore > 0;
  const safeToGenerate = hasAnySection;

  return {
    totalBlueprintFieldsChecked: totalFields,
    fieldsPassedToGenerator: passed,
    fieldsOmitted: omitted,
    omittedFieldsWithReasons: omissions,
    missingRequiredGeneratorFields: missingRequired,
    verbatimFieldsPreserved: verbatimPreserved,
    verbatimFieldsOmitted: verbatimOmitted,
    claimFieldsPassed,
    claimFieldsBlocked,
    addOnFieldsPassed,
    addOnFieldsBlocked,
    riskWarnings,
    integrityScore,
    safeToGenerate,
  };
}

// ── Prompt section builder ────────────────────────────────────────────────────

/**
 * Generates the prompt text injected into the generator for this project.
 * Sections are labeled clearly so the LLM can distinguish Blueprint-derived
 * instructions from raw questionnaire data.
 */
export function buildHandoffPromptSections(handoff: BlueprintGeneratorHandoff): string {
  const lines: string[] = [];

  lines.push("== BLUEPRINT GENERATOR HANDOFF (B11) ==");
  lines.push(`Integrity score: ${handoff.integrityReport.integrityScore}/100 | Fields passed: ${handoff.integrityReport.fieldsPassedToGenerator}`);
  lines.push("");

  // ── CUSTOMER TRUTH TO PRESERVE ───────────────────────────────────────────
  const vb = handoff.mustPreserveVerbatim;
  const verbatimLines: string[] = [];
  if (vb.uniqueDifferentiator) verbatimLines.push(`Unique differentiator (exact): "${vb.uniqueDifferentiator}"`);
  if (vb.primaryPromise) verbatimLines.push(`Primary promise (exact): "${vb.primaryPromise}"`);
  if (vb.specialRequests) verbatimLines.push(`Special requests (exact): "${vb.specialRequests}"`);
  if (vb.licenses.length > 0) verbatimLines.push(`Licenses: ${vb.licenses.join(", ")}`);
  if (vb.certifications.length > 0) verbatimLines.push(`Certifications: ${vb.certifications.join(", ")}`);
  if (vb.servicesOffered.length > 0) verbatimLines.push(`Services offered: ${vb.servicesOffered.join(", ")}`);
  if (vb.yearsInBusiness) verbatimLines.push(`Years in business: ${vb.yearsInBusiness}`);
  if (vb.ownerName) verbatimLines.push(`Owner: ${vb.ownerName}`);

  if (verbatimLines.length > 0) {
    lines.push("== CUSTOMER TRUTH TO PRESERVE ==");
    lines.push("These facts are customer-provided. Use them verbatim. Do not paraphrase or soften.");
    verbatimLines.forEach(l => lines.push(l));
    lines.push("");
  }

  // ── DO NOT INVENT ────────────────────────────────────────────────────────
  const doNotInvent: string[] = [...handoff.factsNotToInvent];
  if (doNotInvent.length === 0) {
    doNotInvent.push(
      "testimonials not provided by the customer",
      "awards or rankings not mentioned",
      "specific prices, hourly rates, or packages unless customer provided them",
      "license numbers, certifications, or credentials not listed above",
      "customer counts, revenue figures, or business metrics",
      "guarantees or warranties not explicitly stated",
      "years in business unless stated above",
    );
  }
  lines.push("== DO NOT INVENT ==");
  lines.push("Never generate or imply these as facts:");
  doNotInvent.forEach(f => lines.push(`- ${f}`));
  lines.push("");

  // ── DO NOT SAY / BANNED PHRASES ─────────────────────────────────────────
  const combined = handoff.doNotSayList.concat(handoff.bannedPhrases);
  const doNotSay = combined.filter((v, i) => combined.indexOf(v) === i);
  if (doNotSay.length > 0) {
    lines.push("== DO NOT SAY / BANNED PHRASES ==");
    lines.push("Never use these phrases or close equivalents:");
    doNotSay.forEach(p => lines.push(`- "${p}"`));
    lines.push("");
  }

  // ── CLAIMS / PROOF HANDLING ──────────────────────────────────────────────
  const hasClaims = handoff.claimsSafeToUse.length + handoff.claimsToOmit.length + handoff.claimsNeedingAdminReview.length > 0;
  const hasHandlingRules = handoff.claimHandlingRules.length > 0;
  if (hasClaims || hasHandlingRules) {
    lines.push("== CLAIMS / PROOF HANDLING ==");
    if (handoff.claimsSafeToUse.length > 0) {
      lines.push("SAFE TO USE:");
      handoff.claimsSafeToUse.forEach(c => lines.push(`  + ${c}`));
    }
    if (handoff.claimsToOmit.length > 0) {
      lines.push("OMIT FROM SITE (do not render):");
      handoff.claimsToOmit.forEach(c => lines.push(`  - ${c}`));
    }
    if (handoff.claimsNeedingAdminReview.length > 0) {
      lines.push("FLAGGED FOR ADMIN REVIEW (omit until cleared):");
      handoff.claimsNeedingAdminReview.forEach(c => lines.push(`  ? ${c}`));
    }
    if (handoff.claimHandlingRules.length > 0) {
      lines.push("CLAIM RULES:");
      handoff.claimHandlingRules.forEach(r => lines.push(`  - ${r}`));
    }
    lines.push("");
  }

  // ── CUSTOMER PSYCHOLOGY ──────────────────────────────────────────────────
  const hasPsych = handoff.customerFears.length + handoff.customerObjections.length + handoff.customerTrustTriggers.length > 0;
  if (hasPsych) {
    lines.push("== CUSTOMER PSYCHOLOGY ==");
    if (handoff.idealCustomerType) lines.push(`Ideal customer: ${handoff.idealCustomerType}`);
    if (handoff.badFitCustomerType) lines.push(`Bad fit customer: ${handoff.badFitCustomerType}`);
    if (handoff.customerFears.length > 0) {
      lines.push("Customer fears to address:");
      handoff.customerFears.forEach(f => lines.push(`  - ${f}`));
    }
    if (handoff.customerObjections.length > 0) {
      lines.push("Common objections to counter:");
      handoff.customerObjections.forEach(o => lines.push(`  - ${o}`));
    }
    if (handoff.customerTrustTriggers.length > 0) {
      lines.push("Trust triggers to highlight:");
      handoff.customerTrustTriggers.forEach(t => lines.push(`  + ${t}`));
    }
    if (handoff.questionsCustomersAlwaysAsk.length > 0) {
      lines.push("Questions customers always ask (consider FAQ section):");
      handoff.questionsCustomersAlwaysAsk.forEach(q => lines.push(`  ? ${q}`));
    }
    lines.push("");
  }

  // ── CTA RULES ────────────────────────────────────────────────────────────
  const hasCTA = handoff.primaryCTA || handoff.ctaRules.length > 0;
  if (hasCTA) {
    lines.push("== CTA RULES ==");
    if (handoff.primaryCTA) lines.push(`Primary CTA: ${handoff.primaryCTA}`);
    if (handoff.secondaryCTAs.length > 0) lines.push(`Secondary CTAs: ${handoff.secondaryCTAs.join(", ")}`);
    if (handoff.heroMessageDirection) lines.push(`Hero direction: ${handoff.heroMessageDirection}`);
    if (handoff.conversionStrategy) lines.push(`Conversion strategy: ${handoff.conversionStrategy}`);
    handoff.ctaRules.forEach(r => lines.push(`Rule: ${r}`));
    lines.push("");
  }

  // ── SERVICES TO EMPHASIZE / AVOID ────────────────────────────────────────
  const hasServiceStrategy = handoff.servicesToPush.length > 0 || handoff.servicesToAvoid.length > 0;
  if (hasServiceStrategy) {
    lines.push("== SERVICE STRATEGY ==");
    if (handoff.primaryOffer) lines.push(`Primary offer to feature prominently: ${handoff.primaryOffer}`);
    if (handoff.servicesToPush.length > 0) lines.push(`EMPHASIZE: ${handoff.servicesToPush.join(", ")}`);
    if (handoff.mostProfitableServices.length > 0) lines.push(`Most profitable (feature first): ${handoff.mostProfitableServices.join(", ")}`);
    if (handoff.servicesToAvoid.length > 0) lines.push(`DE-EMPHASIZE OR OMIT: ${handoff.servicesToAvoid.join(", ")}`);
    if (handoff.badFitWork.length > 0) lines.push(`Bad fit work (do not attract): ${handoff.badFitWork.join(", ")}`);
    lines.push("");
  }

  // ── ADD-ON FULFILLMENT TRUTH ──────────────────────────────────────────────
  const hasAddOnInfo = handoff.addOnsAllowedInGeneratedSite.length + handoff.addOnsExcludedFromGeneratedSite.length + handoff.addOnsPendingTeamSetup.length > 0;
  if (hasAddOnInfo) {
    lines.push("== ADD-ON FULFILLMENT TRUTH ==");
    if (handoff.addOnsAllowedInGeneratedSite.length > 0) {
      lines.push(`Generator-allowed add-ons (render as active features): ${handoff.addOnsAllowedInGeneratedSite.join(", ")}`);
    }
    if (handoff.addOnsPendingTeamSetup.length > 0) {
      lines.push(`Team setup required — DO NOT render as live features yet: ${handoff.addOnsPendingTeamSetup.join(", ")}`);
    }
    if (handoff.addOnsRequiringCustomerAction.length > 0) {
      lines.push(`Customer action required — show as setup placeholder: ${handoff.addOnsRequiringCustomerAction.join(", ")}`);
    }
    if (handoff.addOnsExcludedFromGeneratedSite.length > 0) {
      lines.push(`BLOCKED — do not render: ${handoff.addOnsExcludedFromGeneratedSite.join(", ")}`);
    }
    lines.push("");
  }

  // ── TONE / CONTENT RULES ──────────────────────────────────────────────────
  const hasToneRules = handoff.toneRules.length + handoff.contentPriorities.length + handoff.proofRules.length > 0;
  if (hasToneRules) {
    lines.push("== TONE / CONTENT RULES ==");
    if (handoff.brandPersonality) lines.push(`Brand personality: ${handoff.brandPersonality}`);
    handoff.toneRules.forEach(r => lines.push(`Tone: ${r}`));
    handoff.proofRules.forEach(r => lines.push(`Proof: ${r}`));
    handoff.contentPriorities.forEach(p => lines.push(`Priority: ${p}`));
    lines.push("");
  }

  // ── COMPETITIVE ADVANTAGES ───────────────────────────────────────────────
  if (handoff.competitiveAdvantages.length > 0) {
    lines.push("== COMPETITIVE ADVANTAGES (emphasize over competitors) ==");
    handoff.competitiveAdvantages.forEach(a => lines.push(`+ ${a}`));
    lines.push("");
  }

  // ── RISK / COMPLIANCE ────────────────────────────────────────────────────
  if (handoff.regulatedIndustry || handoff.requiredDisclaimersSuggested.length > 0 || handoff.courtesyRiskNotices.length > 0) {
    lines.push("== RISK / COMPLIANCE ==");
    if (handoff.regulatedIndustry) {
      lines.push(`Regulated industry — risk level: ${handoff.riskLevel}`);
      lines.push("Do NOT invent credentials, licenses, compliance claims, or medical/legal advice.");
    }
    handoff.requiredDisclaimersSuggested.forEach(d => lines.push(`Disclaimer suggested: ${d}`));
    handoff.courtesyRiskNotices.forEach(n => lines.push(`Notice given: ${n}`));
    lines.push("");
  }

  // ── ADMIN FLAGS / REVIEW ITEMS ───────────────────────────────────────────
  const hasFlags = handoff.reviewFlags.length > 0 || handoff.adminReviewRecommended;
  if (hasFlags) {
    lines.push("== ADMIN FLAGS / REVIEW ITEMS ==");
    if (handoff.adminReviewRecommended && handoff.adminReviewReason) {
      lines.push(`Admin review recommended: ${handoff.adminReviewReason}`);
    }
    handoff.reviewFlags.forEach(f => lines.push(`Flag: ${f}`));
    lines.push("");
  }

  // ── OMITTED FIELDS ───────────────────────────────────────────────────────
  if (handoff.integrityReport.omittedFieldsWithReasons.length > 0) {
    lines.push("== OMITTED FIELDS AND WHY ==");
    handoff.integrityReport.omittedFieldsWithReasons.forEach(
      ({ field, reason }) => lines.push(`${field}: ${reason}`)
    );
    lines.push("");
  }

  lines.push("== END BLUEPRINT HANDOFF ==");

  return lines.join("\n");
}
