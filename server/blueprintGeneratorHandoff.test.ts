/**
 * B11 — Blueprint → Generator Verbatim Handoff Gate
 * 42 tests covering: builder, verbatim preservation, integrity report,
 * prompt sections, edge cases, and prior-gate regressions.
 */

import { describe, it, expect } from "vitest";
import {
  buildBlueprintGeneratorHandoff,
  buildHandoffIntegrityReport,
  buildHandoffPromptSections,
} from "../shared/blueprintHandoff";
import type { BlueprintGeneratorHandoff } from "../shared/blueprintHandoff";

// ── A. Builder — null / empty input ──────────────────────────────────────────

describe("A. Builder — null / empty input", () => {
  it("A-01: does not throw on null blueprintJson", () => {
    expect(() => buildBlueprintGeneratorHandoff(null)).not.toThrow();
  });

  it("A-02: does not throw on undefined blueprintJson", () => {
    expect(() => buildBlueprintGeneratorHandoff(undefined)).not.toThrow();
  });

  it("A-03: does not throw on empty object", () => {
    expect(() => buildBlueprintGeneratorHandoff({})).not.toThrow();
  });

  it("A-04: does not throw on non-object (string)", () => {
    expect(() => buildBlueprintGeneratorHandoff("invalid")).not.toThrow();
  });

  it("A-05: returns BlueprintGeneratorHandoff shape on empty input", () => {
    const h = buildBlueprintGeneratorHandoff(null);
    expect(h).toHaveProperty("mustPreserveVerbatim");
    expect(h).toHaveProperty("bannedPhrases");
    expect(h).toHaveProperty("integrityReport");
    expect(Array.isArray(h.bannedPhrases)).toBe(true);
    expect(Array.isArray(h.factsNotToInvent)).toBe(true);
    expect(typeof h.integrityReport.integrityScore).toBe("number");
  });
});

// ── B. Verbatim preservation — businessIdentity section ──────────────────────

describe("B. Verbatim preservation — businessIdentity", () => {
  const bp = {
    businessIdentity: {
      businessDescription: "We fix roofs in Austin",
      ownerName: "Jake Morales",
      yearsInBusiness: "12",
      licenses: ["TX LIC #4892"],
      certifications: ["GAF Master Elite"],
    },
  };

  it("B-01: businessDescription carried verbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.businessDescription).toBe("We fix roofs in Austin");
  });

  it("B-02: ownerName carried verbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.ownerName).toBe("Jake Morales");
  });

  it("B-03: yearsInBusiness carried verbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.yearsInBusiness).toBe("12");
  });

  it("B-04: licenses array preserved exactly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.licenses).toEqual(["TX LIC #4892"]);
  });

  it("B-05: certifications array preserved exactly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.certifications).toEqual(["GAF Master Elite"]);
  });
});

// ── C. Verbatim preservation — positioning + offerStrategy sections ───────────

describe("C. Verbatim preservation — positioning + offerStrategy", () => {
  const bp = {
    positioning: {
      uniqueDifferentiator: "Only roofer in Austin with drone inspections",
      primaryPromise: "No surprise invoices. Fixed price, every time.",
      doNotSayList: ["cheapest", "best in class"],
    },
    offerStrategy: {
      servicesOffered: ["Roof Repair", "New Roof Installation", "Storm Damage"],
      servicesToPush: ["New Roof Installation"],
      servicesToAvoid: ["gutters"],
    },
  };

  it("C-01: uniqueDifferentiator carried verbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.uniqueDifferentiator).toBe("Only roofer in Austin with drone inspections");
  });

  it("C-02: primaryPromise carried verbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.primaryPromise).toBe("No surprise invoices. Fixed price, every time.");
  });

  it("C-03: doNotSayList carried from positioning", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.doNotSayList).toContain("cheapest");
    expect(h.doNotSayList).toContain("best in class");
  });

  it("C-04: servicesOffered preserved in mustPreserveVerbatim", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.mustPreserveVerbatim.servicesOffered).toEqual(["Roof Repair", "New Roof Installation", "Storm Damage"]);
  });

  it("C-05: servicesToPush and servicesToAvoid mapped correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.servicesToPush).toContain("New Roof Installation");
    expect(h.servicesToAvoid).toContain("gutters");
  });
});

// ── D. Generator instructions section ────────────────────────────────────────

describe("D. Generator instructions section", () => {
  const bp = {
    generatorInstructions: {
      bannedPhrases: ["world class", "#1 in Texas"],
      factsNotToInvent: ["team member names", "specific reviews"],
      toneRules: ["Direct and confident", "No filler phrases"],
      ctaRules: ["Primary CTA must be Get a Free Estimate"],
      claimsSafeToUse: ["GAF certified", "12 years serving Austin"],
      claimsToOmit: ["guaranteed lowest price"],
      claimsNeedingAdminReview: ["#1 rated roofer in Austin"],
    },
  };

  it("D-01: bannedPhrases carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.bannedPhrases).toContain("world class");
    expect(h.bannedPhrases).toContain("#1 in Texas");
  });

  it("D-02: factsNotToInvent carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.factsNotToInvent).toContain("team member names");
    expect(h.factsNotToInvent).toContain("specific reviews");
  });

  it("D-03: toneRules carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.toneRules).toContain("Direct and confident");
  });

  it("D-04: ctaRules carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.ctaRules).toContain("Primary CTA must be Get a Free Estimate");
  });

  it("D-05: claimsSafeToUse carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.claimsSafeToUse).toContain("GAF certified");
  });

  it("D-06: claimsToOmit carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.claimsToOmit).toContain("guaranteed lowest price");
  });

  it("D-07: claimsNeedingAdminReview carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.claimsNeedingAdminReview).toContain("#1 rated roofer in Austin");
  });
});

// ── E. Customer psychology section ────────────────────────────────────────────

describe("E. Customer psychology section", () => {
  const bp = {
    customerPsychology: {
      customerFears: ["contractor won't show up", "job goes over budget"],
      customerObjections: ["I'll just use my handyman"],
      customerTrustTriggers: ["Licensed", "Shows up on time"],
      idealCustomerType: "Homeowner with storm damage needing fast turnaround",
      badFitCustomerType: "DIY homeowners looking for advice only",
      questionsCustomersAlwaysAsk: ["Do you do free estimates?", "How long does it take?"],
    },
  };

  it("E-01: customerFears carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.customerFears).toContain("contractor won't show up");
  });

  it("E-02: customerObjections carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.customerObjections).toContain("I'll just use my handyman");
  });

  it("E-03: customerTrustTriggers carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.customerTrustTriggers).toContain("Licensed");
  });

  it("E-04: idealCustomerType carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.idealCustomerType).toBe("Homeowner with storm damage needing fast turnaround");
  });

  it("E-05: badFitCustomerType carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.badFitCustomerType).toBe("DIY homeowners looking for advice only");
  });

  it("E-06: questionsCustomersAlwaysAsk carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff(bp);
    expect(h.questionsCustomersAlwaysAsk).toContain("Do you do free estimates?");
  });
});

// ── F. Risk / compliance section ─────────────────────────────────────────────

describe("F. Risk / compliance section", () => {
  it("F-01: regulatedIndustry true when set", () => {
    const h = buildBlueprintGeneratorHandoff({
      riskCompliance: { regulatedIndustry: true, riskLevel: "high" },
    });
    expect(h.regulatedIndustry).toBe(true);
    expect(h.riskLevel).toBe("high");
  });

  it("F-02: regulatedIndustry false when not set", () => {
    const h = buildBlueprintGeneratorHandoff({ riskCompliance: { regulatedIndustry: false } });
    expect(h.regulatedIndustry).toBe(false);
  });

  it("F-03: riskLevel defaults to standard when missing", () => {
    const h = buildBlueprintGeneratorHandoff({});
    expect(h.riskLevel).toBe("standard");
  });

  it("F-04: requiredDisclaimersSuggested carried correctly", () => {
    const h = buildBlueprintGeneratorHandoff({
      riskCompliance: { requiredDisclaimersSuggested: ["Results not guaranteed", "Licensed in TX only"] },
    });
    expect(h.requiredDisclaimersSuggested).toContain("Results not guaranteed");
  });
});

// ── G. Integrity report ──────────────────────────────────────────────────────

describe("G. Integrity report", () => {
  it("G-01: integrityScore is 0-100 for empty blueprint", () => {
    const h = buildBlueprintGeneratorHandoff(null);
    expect(h.integrityReport.integrityScore).toBeGreaterThanOrEqual(0);
    expect(h.integrityReport.integrityScore).toBeLessThanOrEqual(100);
  });

  it("G-02: safeToGenerate is false for empty blueprint (no sections)", () => {
    const h = buildBlueprintGeneratorHandoff(null);
    expect(h.integrityReport.safeToGenerate).toBe(false);
  });

  it("G-03: safeToGenerate is true when at least one section present", () => {
    const h = buildBlueprintGeneratorHandoff({ businessIdentity: { businessName: "Apex Roofing" } });
    expect(h.integrityReport.safeToGenerate).toBe(true);
  });

  it("G-04: integrityScore higher for fully populated blueprint", () => {
    const empty = buildBlueprintGeneratorHandoff(null);
    const full = buildBlueprintGeneratorHandoff({
      businessIdentity: { businessDescription: "Full roofing co", ownerName: "Jake", yearsInBusiness: "10" },
      positioning: { uniqueDifferentiator: "Drone inspections", primaryPromise: "Fixed price" },
      generatorInstructions: { factsNotToInvent: ["names"], toneRules: ["direct"], ctaRules: ["call now"] },
      customerPsychology: { customerFears: ["no-show"], customerObjections: ["price"], customerTrustTriggers: ["licensed"] },
      offerStrategy: { servicesToPush: ["New roof"] },
      websiteStrategy: { primaryCTA: "Get Free Estimate" },
      riskCompliance: { regulatedIndustry: false },
      addOnUpsellFit: {},
    });
    expect(full.integrityReport.integrityScore).toBeGreaterThan(empty.integrityReport.integrityScore);
  });

  it("G-05: fieldsPassedToGenerator + fieldsOmitted tracked in report", () => {
    const h = buildBlueprintGeneratorHandoff(null);
    expect(typeof h.integrityReport.fieldsPassedToGenerator).toBe("number");
    expect(typeof h.integrityReport.fieldsOmitted).toBe("number");
  });

  it("G-06: missingRequiredGeneratorFields listed when key fields absent", () => {
    const h = buildBlueprintGeneratorHandoff({});
    expect(Array.isArray(h.integrityReport.missingRequiredGeneratorFields)).toBe(true);
  });

  it("G-07: riskWarnings populated for regulated industry", () => {
    const h = buildBlueprintGeneratorHandoff({
      riskCompliance: { regulatedIndustry: true, riskLevel: "high" },
    });
    expect(h.integrityReport.riskWarnings.some(w => w.includes("Regulated"))).toBe(true);
  });

  it("G-08: riskWarnings populated when no banned phrases or do-not-say list", () => {
    const h = buildBlueprintGeneratorHandoff({
      businessIdentity: { businessDescription: "test" },
    });
    const warn = h.integrityReport.riskWarnings.join(" ");
    expect(warn).toContain("No banned phrases");
  });
});

// ── H. Prompt section builder ─────────────────────────────────────────────────

describe("H. Prompt section builder", () => {
  function fullHandoff(): BlueprintGeneratorHandoff {
    return buildBlueprintGeneratorHandoff({
      businessIdentity: {
        businessDescription: "Apex Roofing — Austin TX",
        ownerName: "Jake Morales",
        yearsInBusiness: "12",
        licenses: ["TX LIC #4892"],
        certifications: ["GAF Master Elite"],
      },
      positioning: {
        uniqueDifferentiator: "Only roofer with drone inspections",
        primaryPromise: "Fixed price every time",
        doNotSayList: ["cheapest"],
      },
      generatorInstructions: {
        bannedPhrases: ["world class"],
        factsNotToInvent: ["team member names"],
        toneRules: ["Direct"],
        ctaRules: ["CTA: Get Free Estimate"],
        claimsSafeToUse: ["GAF certified"],
        claimsToOmit: ["lowest price guarantee"],
        claimsNeedingAdminReview: ["#1 in Austin"],
      },
      customerPsychology: {
        customerFears: ["contractor no-show"],
        customerObjections: ["I'll DIY it"],
        customerTrustTriggers: ["Licensed"],
        idealCustomerType: "Homeowner needing roof repair",
      },
      offerStrategy: {
        servicesToPush: ["New Roof Installation"],
        primaryOffer: "Full Roof Replacement",
      },
      websiteStrategy: {
        primaryCTA: "Get a Free Estimate",
        heroMessageDirection: "Lead with storm damage urgency",
        conversionStrategy: "Phone call first",
      },
      riskCompliance: { regulatedIndustry: false },
      addOnUpsellFit: { acceptedAddOns: [{ product: "review_collector", canAppearOnGeneratedSite: true }] },
    });
  }

  it("H-01: output starts with B11 handoff header", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== BLUEPRINT GENERATOR HANDOFF (B11) ==");
  });

  it("H-02: output ends with END BLUEPRINT HANDOFF", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== END BLUEPRINT HANDOFF ==");
  });

  it("H-03: CUSTOMER TRUTH TO PRESERVE section present", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== CUSTOMER TRUTH TO PRESERVE ==");
  });

  it("H-04: uniqueDifferentiator appears verbatim in prompt", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("Only roofer with drone inspections");
  });

  it("H-05: DO NOT INVENT section present", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== DO NOT INVENT ==");
  });

  it("H-06: DO NOT SAY section present when bannedPhrases/doNotSayList populated", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== DO NOT SAY / BANNED PHRASES ==");
    expect(prompt).toContain('"world class"');
    expect(prompt).toContain('"cheapest"');
  });

  it("H-07: CLAIMS section present when claims populated", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== CLAIMS / PROOF HANDLING ==");
    expect(prompt).toContain("SAFE TO USE:");
    expect(prompt).toContain("GAF certified");
    expect(prompt).toContain("OMIT FROM SITE");
    expect(prompt).toContain("lowest price guarantee");
  });

  it("H-08: CUSTOMER PSYCHOLOGY section present when psych populated", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== CUSTOMER PSYCHOLOGY ==");
    expect(prompt).toContain("contractor no-show");
  });

  it("H-09: CTA RULES section present", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== CTA RULES ==");
    expect(prompt).toContain("Get a Free Estimate");
  });

  it("H-10: SERVICE STRATEGY section present", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== SERVICE STRATEGY ==");
    expect(prompt).toContain("New Roof Installation");
  });

  it("H-11: ADD-ON FULFILLMENT TRUTH section present when add-ons populated", () => {
    const prompt = buildHandoffPromptSections(fullHandoff());
    expect(prompt).toContain("== ADD-ON FULFILLMENT TRUTH ==");
    expect(prompt).toContain("review_collector");
  });

  it("H-12: OMITTED FIELDS section present when fields omitted", () => {
    const prompt = buildHandoffPromptSections(buildBlueprintGeneratorHandoff({}));
    expect(prompt).toContain("== OMITTED FIELDS AND WHY ==");
  });

  it("H-13: empty blueprint produces DO NOT INVENT with default safety rules", () => {
    const prompt = buildHandoffPromptSections(buildBlueprintGeneratorHandoff(null));
    expect(prompt).toContain("== DO NOT INVENT ==");
    expect(prompt).toContain("testimonials not provided by the customer");
  });
});

// ── I. Claims fallback — positioning.safeClaims ───────────────────────────────

describe("I. Claims fallback", () => {
  it("I-01: claimsSafeToUse falls back to positioning.safeClaims when generatorInstructions absent", () => {
    const h = buildBlueprintGeneratorHandoff({
      positioning: { safeClaims: ["GAF certified via positioning"] },
    });
    expect(h.claimsSafeToUse).toContain("GAF certified via positioning");
  });

  it("I-02: generatorInstructions.claimsSafeToUse takes priority over positioning.safeClaims", () => {
    const h = buildBlueprintGeneratorHandoff({
      positioning: { safeClaims: ["from positioning"] },
      generatorInstructions: { claimsSafeToUse: ["from generatorInstructions"] },
    });
    expect(h.claimsSafeToUse).toContain("from generatorInstructions");
    expect(h.claimsSafeToUse).not.toContain("from positioning");
  });
});

// ── J. Add-on fulfillment truth ────────────────────────────────────────────────

describe("J. Add-on fulfillment truth", () => {
  it("J-01: acceptedAddOns with canAppearOnGeneratedSite:true added to allowed list", () => {
    const h = buildBlueprintGeneratorHandoff({
      addOnUpsellFit: {
        acceptedAddOns: [{ product: "seo_autopilot", canAppearOnGeneratedSite: true }],
      },
    });
    expect(h.addOnsAllowedInGeneratedSite).toContain("seo_autopilot");
  });

  it("J-02: acceptedAddOns with canAppearOnGeneratedSite:false NOT in allowed list", () => {
    const h = buildBlueprintGeneratorHandoff({
      addOnUpsellFit: {
        acceptedAddOns: [{ product: "some_manual_addon", canAppearOnGeneratedSite: false }],
      },
    });
    expect(h.addOnsAllowedInGeneratedSite).not.toContain("some_manual_addon");
  });

  it("J-03: addOnsBlocked mapped to addOnsExcludedFromGeneratedSite", () => {
    const h = buildBlueprintGeneratorHandoff({
      addOnUpsellFit: {
        addOnsBlocked: [{ product: "blocked_addon" }],
      },
    });
    expect(h.addOnsExcludedFromGeneratedSite).toContain("blocked_addon");
  });

  it("J-04: addOnsTeamSetup mapped to addOnsPendingTeamSetup", () => {
    const h = buildBlueprintGeneratorHandoff({
      addOnUpsellFit: {
        addOnsTeamSetup: [{ product: "team_addon" }],
      },
    });
    expect(h.addOnsPendingTeamSetup).toContain("team_addon");
  });
});

// ── K. Regression — prior gate fields not broken ──────────────────────────────

describe("K. Regression — prior gates", () => {
  it("K-01: builder handles blueprint from B6 schema (9 sections present)", () => {
    const fullBp = {
      businessIdentity: { businessName: "Test Co" },
      offerStrategy: { servicesOffered: ["Service A"] },
      customerPsychology: {},
      positioning: {},
      websiteStrategy: {},
      mediaVisuals: {},
      riskCompliance: {},
      generatorInstructions: {},
      addOnUpsellFit: {},
    };
    const h = buildBlueprintGeneratorHandoff(fullBp);
    expect(h.integrityReport.safeToGenerate).toBe(true);
  });

  it("K-02: buildHandoffIntegrityReport does not throw on empty handoff object", () => {
    const emptyHandoff = buildBlueprintGeneratorHandoff(null) as Omit<BlueprintGeneratorHandoff, "integrityReport">;
    expect(() => buildHandoffIntegrityReport(emptyHandoff, {})).not.toThrow();
  });

  it("K-03: rawBlueprintJson preserved in handoff for audit trail", () => {
    const bp = { businessIdentity: { businessName: "Audit Co" } };
    const h = buildBlueprintGeneratorHandoff(bp);
    expect((h.rawBlueprintJson as any).businessIdentity.businessName).toBe("Audit Co");
  });

  it("K-04: generator handoff does not expose passwords, tokens, or admin flags directly", () => {
    const bp = {
      businessIdentity: { businessName: "Test" },
      _internal: { adminToken: "secret", adminPassword: "12345" },
    };
    const prompt = buildHandoffPromptSections(buildBlueprintGeneratorHandoff(bp));
    expect(prompt).not.toContain("adminToken");
    expect(prompt).not.toContain("adminPassword");
  });

  it("K-05: websiteStrategy.primaryCTA carried to handoff.primaryCTA", () => {
    const h = buildBlueprintGeneratorHandoff({
      websiteStrategy: { primaryCTA: "Book Now" },
    });
    expect(h.primaryCTA).toBe("Book Now");
  });
});
