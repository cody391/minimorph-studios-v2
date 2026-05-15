/**
 * Claim / Proof Validation Gate (B8) — Tests proving every Blueprint carries
 * a structured claim/proof inventory with source tracking, customer-direction
 * doctrine, and generator-use instructions.
 *
 * DOCTRINE: MiniMorph does not police customer claims. The customer owns their
 * claims. These tests verify MiniMorph records them, flags risk, offers safer
 * alternatives, and documents acknowledgment — without deleting or blocking.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  buildClaimProofInventory,
  extractGeneratorClaimLists,
  RISKY_CLAIM_WORDS,
  type ClaimProofInventory,
  type ClaimProofRecord,
} from "../shared/blueprintTypes";

// ── Questionnaire fixtures ────────────────────────────────────────────────────

const SPARSE_Q: Record<string, unknown> = {
  businessName: "Test Co",
  websiteType: "plumber",
};

const FULL_Q: Record<string, unknown> = {
  businessName: "Apex Roofing",
  websiteType: "contractor",
  brandTone: "bold",
  yearsInBusiness: "15 years",
  licenseNumber: "TX-GC-48291",
  certifications: ["OSHA 10", "GAF Master Elite"],
  awards: ["BBB Torch Award 2023"],
  testimonials: [
    { quote: "They fixed our roof in one day!", name: "Maria S.", context: "homeowner in Austin" },
    { quote: "Best roofing crew we've ever hired.", name: "James P.", context: "property manager" },
  ],
  uniqueDifferentiator: "We are Austin's #1 rated roofing company with a 100% satisfaction guarantee.",
  specialRequests: "We want a guarantee section showing our 10-year warranty.",
  servicesOffered: ["Residential Roofing", "Commercial Roofing", "Roof Repair"],
};

const MEDICAL_Q: Record<string, unknown> = {
  businessName: "Austin Wellness Clinic",
  websiteType: "medical",
  uniqueDifferentiator: "We can cure chronic back pain in 3 sessions — proven results.",
  testimonials: [{ quote: "My back pain is completely gone.", name: "Lisa R.", context: "patient" }],
};

const REGULATED_Q: Record<string, unknown> = {
  businessName: "Austin Family Dental",
  websiteType: "dental",
  licenseNumber: "TX-DDS-9021",
  certifications: ["ADA Member"],
  yearsInBusiness: "12 years",
  testimonials: [{ quote: "Best dentist in Austin!", name: "Tom K.", context: "patient" }],
};

// ── Section A: Inventory structure ────────────────────────────────────────────

describe("A — Every Blueprint contains a claim/proof inventory", () => {
  it("sparse questionnaire produces a ClaimProofInventory object", () => {
    const inv = buildClaimProofInventory(SPARSE_Q, false, "low");
    expect(inv).toBeDefined();
    expect(typeof inv).toBe("object");
    expect(Array.isArray(inv.claims)).toBe(true);
  });

  it("sparse questionnaire produces empty claims array safely (no crash)", () => {
    const inv = buildClaimProofInventory(SPARSE_Q, false, "low");
    expect(inv.claims).toHaveLength(0);
    expect(inv.claimsTotal).toBe(0);
  });

  it("inventory has all required summary fields", () => {
    const inv = buildClaimProofInventory(SPARSE_Q, false, "low");
    expect(typeof inv.claimsTotal).toBe("number");
    expect(typeof inv.claimsRequiringReview).toBe("number");
    expect(typeof inv.claimsRequiringCustomerAcknowledgment).toBe("number");
    expect(typeof inv.claimsSafeForGeneration).toBe("number");
    expect(typeof inv.claimsToOmit).toBe("number");
    expect(typeof inv.miniMorphOwnedPromisesDetected).toBe("number");
    expect(typeof inv.lastScannedAt).toBe("string");
  });

  it("full questionnaire produces multiple claim records", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    expect(inv.claimsTotal).toBeGreaterThan(0);
    expect(inv.claims.length).toBeGreaterThan(0);
  });
});

// ── Section B: Testimonials ───────────────────────────────────────────────────

describe("B — Testimonials become testimonial claim records", () => {
  it("each testimonial becomes one ClaimProofRecord", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const testimonialClaims = inv.claims.filter(c => c.claimType === "testimonial");
    expect(testimonialClaims).toHaveLength(2);
  });

  it("testimonial claimType is 'testimonial'", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.claimType).toBe("testimonial");
  });

  it("testimonial source is customer_provided", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.source).toBe("customer_provided");
  });

  it("testimonial riskLevel is low", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.riskLevel).toBe("low");
  });

  it("testimonial generatorUseStatus is use_as_written", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.generatorUseStatus).toBe("use_as_written");
  });

  it("testimonial customerDirected is true", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.customerDirected).toBe(true);
  });

  it("testimonial miniMorphOwnedPromise is false", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t?.miniMorphOwnedPromise).toBe(false);
  });

  it("empty testimonials array produces no testimonial records", () => {
    const inv = buildClaimProofInventory({ ...SPARSE_Q, testimonials: [] }, false, "low");
    expect(inv.claims.filter(c => c.claimType === "testimonial")).toHaveLength(0);
  });
});

// ── Section C: License ────────────────────────────────────────────────────────

describe("C — License number becomes a license claim record", () => {
  it("licenseNumber produces a license claim record", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const lic = inv.claims.find(c => c.claimType === "license");
    expect(lic).toBeDefined();
  });

  it("license claimType is 'license'", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const lic = inv.claims.find(c => c.claimType === "license");
    expect(lic?.claimType).toBe("license");
  });

  it("license source is customer_provided", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const lic = inv.claims.find(c => c.claimType === "license");
    expect(lic?.source).toBe("customer_provided");
  });

  it("license in non-regulated industry is low risk", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const lic = inv.claims.find(c => c.claimType === "license");
    expect(lic?.riskLevel).toBe("low");
  });

  it("license in regulated industry is medium risk", () => {
    const inv = buildClaimProofInventory(REGULATED_Q, true, "regulated_review_required");
    const lic = inv.claims.find(c => c.claimType === "license");
    expect(lic?.riskLevel).toBe("medium");
  });

  it("missing licenseNumber produces no license record", () => {
    const inv = buildClaimProofInventory(SPARSE_Q, false, "low");
    expect(inv.claims.filter(c => c.claimType === "license")).toHaveLength(0);
  });
});

// ── Section D: Years in business ──────────────────────────────────────────────

describe("D — Years in business becomes a years_in_business claim record", () => {
  it("yearsInBusiness produces a claim record", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const yib = inv.claims.find(c => c.claimType === "years_in_business");
    expect(yib).toBeDefined();
  });

  it("years_in_business is low risk", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const yib = inv.claims.find(c => c.claimType === "years_in_business");
    expect(yib?.riskLevel).toBe("low");
  });

  it("years_in_business generatorUseStatus is use_as_written", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const yib = inv.claims.find(c => c.claimType === "years_in_business");
    expect(yib?.generatorUseStatus).toBe("use_as_written");
  });

  it("missing yearsInBusiness produces no record", () => {
    const inv = buildClaimProofInventory(SPARSE_Q, false, "low");
    expect(inv.claims.filter(c => c.claimType === "years_in_business")).toHaveLength(0);
  });
});

// ── Section E: Certifications ─────────────────────────────────────────────────

describe("E — Certifications become certification claim records", () => {
  it("each certification becomes one ClaimProofRecord", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const certs = inv.claims.filter(c => c.claimType === "certification");
    expect(certs.length).toBe(2); // OSHA 10, GAF Master Elite
  });

  it("certification is customer_provided", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const cert = inv.claims.find(c => c.claimType === "certification");
    expect(cert?.source).toBe("customer_provided");
  });

  it("certification in regulated industry is medium risk", () => {
    const inv = buildClaimProofInventory(REGULATED_Q, true, "regulated_review_required");
    const cert = inv.claims.find(c => c.claimType === "certification");
    expect(cert?.riskLevel).toBe("medium");
  });
});

// ── Section F: Guarantee and superlative language ─────────────────────────────

describe("F — Guarantee and '#1/best' language produces high-risk claim records", () => {
  it("'#1' in uniqueDifferentiator triggers best_or_number_one claim type", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.claimType).toBe("best_or_number_one");
  });

  it("'guaranteed' in uniqueDifferentiator triggers medium+ risk", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(["medium", "high", "regulated_sensitive"]).toContain(diff?.riskLevel);
  });

  it("'#1' claim generatorUseStatus is flag_for_admin", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.generatorUseStatus).toBe("flag_for_admin");
  });

  it("risky uniqueDifferentiator adminReviewStatus is pending_review", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.adminReviewStatus).toBe("pending_review");
  });

  it("guarantee in specialRequests produces a risky claim record", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const spec = inv.claims.find(c => c.sourceField === "q.specialRequests");
    expect(spec).toBeDefined();
    expect(["medium", "high", "regulated_sensitive"]).toContain(spec?.riskLevel);
  });

  it("specialRequests with no risky words does NOT produce a risky claim", () => {
    const q = { ...SPARSE_Q, specialRequests: "We want a services page and a contact form." };
    const inv = buildClaimProofInventory(q, false, "low");
    const spec = inv.claims.find(c => c.sourceField === "q.specialRequests");
    expect(spec).toBeUndefined();
  });
});

// ── Section G: Medical / regulated-sensitive claims ───────────────────────────

describe("G — Medical / legal / financial claims become regulated_sensitive", () => {
  it("'cure' in uniqueDifferentiator produces regulated_sensitive risk level", () => {
    const inv = buildClaimProofInventory(MEDICAL_Q, true, "regulated_review_required");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.riskLevel).toBe("regulated_sensitive");
  });

  it("'cure' claim generatorUseStatus is flag_for_admin", () => {
    const inv = buildClaimProofInventory(MEDICAL_Q, true, "regulated_review_required");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.generatorUseStatus).toBe("flag_for_admin");
  });

  it("regulated_sensitive claim adminReviewStatus is pending_review", () => {
    const inv = buildClaimProofInventory(MEDICAL_Q, true, "regulated_review_required");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.adminReviewStatus).toBe("pending_review");
  });

  it("'diagnose' is in RISKY_CLAIM_WORDS.regulated_sensitive", () => {
    expect(RISKY_CLAIM_WORDS.regulated_sensitive).toContain("diagnose");
  });

  it("'cure' is in RISKY_CLAIM_WORDS.regulated_sensitive", () => {
    expect(RISKY_CLAIM_WORDS.regulated_sensitive).toContain("cure");
  });
});

// ── Section H: Customer-directed claim doctrine ───────────────────────────────

describe("H — Customer-directed claims are preserved, not deleted or blocked", () => {
  it("risky claim is NOT deleted from inventory", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff).toBeDefined();
    expect(diff?.claimText).toBeTruthy();
  });

  it("risky claim customerDirected is true", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.customerDirected).toBe(true);
  });

  it("risky claim customerDirectedOriginalWording is true", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.customerDirectedOriginalWording).toBe(true);
  });

  it("risky claim courtesy notice fields exist", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff).toHaveProperty("requiresCourtesyNotice");
    expect(diff).toHaveProperty("courtesyNoticeGiven");
  });

  it("risky claim has requiresCourtesyNotice set to true", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const diff = inv.claims.find(c => c.sourceField === "q.uniqueDifferentiator");
    expect(diff?.requiresCourtesyNotice).toBe(true);
  });

  it("customer acknowledgment fields exist on all claim records", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    for (const claim of inv.claims) {
      expect(claim).toHaveProperty("customerAcknowledgedRisk");
      expect(claim).toHaveProperty("customerAcceptedSaferAlternative");
    }
  });

  it("customerAcknowledgedRisk defaults to false (not yet collected)", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    for (const claim of inv.claims) {
      expect(claim.customerAcknowledgedRisk).toBe(false);
    }
  });

  it("no claim record has adminReviewStatus of 'blocked_by_minimorph_standard' by default", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const blocked = inv.claims.filter(c => c.adminReviewStatus === "blocked_by_minimorph_standard");
    expect(blocked).toHaveLength(0);
  });

  it("no MiniMorph-owned platform promises appear in questionnaire-built inventory", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const platformPromises = inv.claims.filter(c => c.miniMorphOwnedPromise);
    expect(platformPromises).toHaveLength(0);
  });
});

// ── Section I: Generator instruction flags ────────────────────────────────────

describe("I — Generator instruction flags are populated", () => {
  it("extractGeneratorClaimLists returns claimsSafeToUse", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    expect(Array.isArray(lists.claimsSafeToUse)).toBe(true);
  });

  it("extractGeneratorClaimLists returns claimsToOmit", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    expect(Array.isArray(lists.claimsToOmit)).toBe(true);
  });

  it("extractGeneratorClaimLists returns claimsNeedingAdminReview", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    expect(Array.isArray(lists.claimsNeedingAdminReview)).toBe(true);
  });

  it("extractGeneratorClaimLists returns claimsNeedingCustomerAcknowledgment", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    expect(Array.isArray(lists.claimsNeedingCustomerAcknowledgment)).toBe(true);
  });

  it("testimonials appear in claimsSafeToUse", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    expect(lists.claimsSafeToUse.length).toBeGreaterThan(0);
    const hasTestimonial = lists.claimsSafeToUse.some(c => c.includes("fixed our roof"));
    expect(hasTestimonial).toBe(true);
  });

  it("risky differentiator appears in claimsNeedingAdminReview", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    const hasRisky = lists.claimsNeedingAdminReview.some(c => c.includes("#1") || c.includes("guarantee"));
    expect(hasRisky).toBe(true);
  });

  it("award claims appear in claimsNeedingAdminReview", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const lists = extractGeneratorClaimLists(inv);
    const hasAward = lists.claimsNeedingAdminReview.some(c => c.includes("BBB") || c.includes("Torch Award"));
    expect(hasAward).toBe(true);
  });
});

// ── Section J: Summary counts ─────────────────────────────────────────────────

describe("J — Summary counts are correct", () => {
  it("claimsTotal equals claims array length", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    expect(inv.claimsTotal).toBe(inv.claims.length);
  });

  it("claimsSafeForGeneration equals count of use_as_written claims", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const actual = inv.claims.filter(c => c.generatorUseStatus === "use_as_written").length;
    expect(inv.claimsSafeForGeneration).toBe(actual);
  });

  it("claimsRequiringReview equals count of pending_review admin status", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const actual = inv.claims.filter(c => c.adminReviewStatus === "pending_review").length;
    expect(inv.claimsRequiringReview).toBe(actual);
  });

  it("miniMorphOwnedPromisesDetected is 0 for questionnaire-built inventory", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    expect(inv.miniMorphOwnedPromisesDetected).toBe(0);
  });

  it("full questionnaire has some claims safe for generation", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    expect(inv.claimsSafeForGeneration).toBeGreaterThan(0);
  });

  it("full questionnaire with risky words has claims requiring review", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    expect(inv.claimsRequiringReview).toBeGreaterThan(0);
  });
});

// ── Section K: RISKY_CLAIM_WORDS export ───────────────────────────────────────

describe("K — RISKY_CLAIM_WORDS is exported and structured", () => {
  it("exports regulated_sensitive word list", () => {
    expect(Array.isArray(RISKY_CLAIM_WORDS.regulated_sensitive)).toBe(true);
    expect(RISKY_CLAIM_WORDS.regulated_sensitive.length).toBeGreaterThan(0);
  });

  it("exports high risk word list", () => {
    expect(Array.isArray(RISKY_CLAIM_WORDS.high)).toBe(true);
    expect(RISKY_CLAIM_WORDS.high.length).toBeGreaterThan(0);
  });

  it("exports medium risk word list", () => {
    expect(Array.isArray(RISKY_CLAIM_WORDS.medium)).toBe(true);
    expect(RISKY_CLAIM_WORDS.medium.length).toBeGreaterThan(0);
  });

  it("'cure' is regulated_sensitive", () => {
    expect(RISKY_CLAIM_WORDS.regulated_sensitive).toContain("cure");
  });

  it("'guaranteed' is medium risk", () => {
    expect(RISKY_CLAIM_WORDS.medium).toContain("guaranteed");
  });

  it("'#1' is medium risk", () => {
    expect(RISKY_CLAIM_WORDS.medium).toContain("#1");
  });

  it("'100% guaranteed' is high risk", () => {
    expect(RISKY_CLAIM_WORDS.high).toContain("100% guaranteed");
  });
});

// ── Section L: ClaimProofRecord shape ─────────────────────────────────────────

describe("L — ClaimProofRecord has all required fields", () => {
  const REQUIRED_FIELDS: (keyof ClaimProofRecord)[] = [
    "id", "claimText", "claimType", "source", "sourceDetail", "sourceField",
    "sourceStatus", "riskLevel", "customerDirected", "miniMorphOwnedPromise",
    "requiresCourtesyNotice", "courtesyNoticeGiven", "saferAlternativeSuggested",
    "saferAlternativeText", "customerAcceptedSaferAlternative",
    "customerDirectedOriginalWording", "customerAcknowledgedRisk",
    "adminReviewStatus", "adminReviewNotes", "generatorUseStatus",
    "generatorInstruction", "createdAt", "updatedAt",
  ];

  it("testimonial record has all required fields", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const t = inv.claims.find(c => c.claimType === "testimonial");
    expect(t).toBeDefined();
    for (const field of REQUIRED_FIELDS) {
      expect(t).toHaveProperty(field);
    }
  });

  it("license record has all required fields", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "low");
    const l = inv.claims.find(c => c.claimType === "license");
    expect(l).toBeDefined();
    for (const field of REQUIRED_FIELDS) {
      expect(l).toHaveProperty(field);
    }
  });

  it("each record has a unique id", () => {
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    const ids = inv.claims.map(c => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("each record has a valid sourceStatus", () => {
    const validStatuses = ["provided_unverified", "customer_confirmed", "admin_verified", "unsupported", "unknown"];
    const inv = buildClaimProofInventory(FULL_Q, false, "medium");
    for (const claim of inv.claims) {
      expect(validStatuses).toContain(claim.sourceStatus);
    }
  });
});

// ── Section M: TypeScript schema has new types ────────────────────────────────

describe("M — shared/blueprintTypes.ts has all B8 types", () => {
  const source = readFileSync(join(__dirname, "../shared/blueprintTypes.ts"), "utf-8");

  it("exports ClaimProofRecord interface", () => {
    expect(source).toContain("ClaimProofRecord");
  });

  it("exports ClaimProofInventory interface", () => {
    expect(source).toContain("ClaimProofInventory");
  });

  it("exports ClaimType", () => {
    expect(source).toContain("ClaimType");
  });

  it("exports ClaimSource", () => {
    expect(source).toContain("ClaimSource");
  });

  it("exports ClaimRiskLevel", () => {
    expect(source).toContain("ClaimRiskLevel");
  });

  it("exports ClaimAdminReviewStatus", () => {
    expect(source).toContain("ClaimAdminReviewStatus");
  });

  it("exports ClaimGeneratorUseStatus", () => {
    expect(source).toContain("ClaimGeneratorUseStatus");
  });

  it("exports RISKY_CLAIM_WORDS constant", () => {
    expect(source).toContain("RISKY_CLAIM_WORDS");
  });

  it("exports buildClaimProofInventory function", () => {
    expect(source).toContain("buildClaimProofInventory");
  });

  it("exports extractGeneratorClaimLists function", () => {
    expect(source).toContain("extractGeneratorClaimLists");
  });

  it("Positioning interface includes claimProofInventory field", () => {
    expect(source).toContain("claimProofInventory");
  });

  it("GeneratorInstructions has claimsSafeToUse field", () => {
    expect(source).toContain("claimsSafeToUse");
  });

  it("GeneratorInstructions has claimsToOmit field", () => {
    expect(source).toContain("claimsToOmit");
  });

  it("GeneratorInstructions has claimsNeedingAdminReview field", () => {
    expect(source).toContain("claimsNeedingAdminReview");
  });

  it("RiskCompliance has claimsSummary field", () => {
    expect(source).toContain("claimsSummary");
  });
});

// ── Section N: routers.ts wiring ─────────────────────────────────────────────

describe("N — routers.ts buildBlueprintFromQuestionnaire wiring", () => {
  const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");

  it("requires buildClaimProofInventory from blueprintTypes", () => {
    expect(routersSource).toContain("buildClaimProofInventory");
  });

  it("requires extractGeneratorClaimLists from blueprintTypes", () => {
    expect(routersSource).toContain("extractGeneratorClaimLists");
  });

  it("assigns claimProofInventory to positioning", () => {
    expect(routersSource).toContain("claimProofInventory,");
  });

  it("assigns claimsSummary to riskCompliance", () => {
    expect(routersSource).toContain("claimsSummary:");
  });

  it("assigns claimsSafeToUse to generatorInstructions", () => {
    expect(routersSource).toContain("claimsSafeToUse: generatorClaimLists.claimsSafeToUse");
  });

  it("assigns claimsNeedingAdminReview to generatorInstructions", () => {
    expect(routersSource).toContain("claimsNeedingAdminReview: generatorClaimLists.claimsNeedingAdminReview");
  });
});
