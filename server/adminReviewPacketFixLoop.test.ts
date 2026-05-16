/**
 * Admin Review Packet + Admin-Side Elena Fix Loop Gate
 *
 * Proves:
 * - buildAdminReviewPacket() assembles all 10 sections correctly
 * - canApprove blockers fire for every missing/broken condition
 * - buildAdminFixGuidance() produces category-specific, constraint-aware guidance
 * - adminApprovePreview enforces site / build report / agreement guards
 * - adminDenyPreview stores structured denial with category + fix instructions
 * - adminDenyPreview clears adminPreviewApprovedAt (customer preview hidden)
 * - getAdminReviewPacket and getAdminFixGuidance procedures are wired
 * - Customer cannot see site before admin approval (B10 not weakened)
 * - Admin UI has structured deny form, review packet panel, fix guidance display
 */

import { describe, it, expect } from "vitest";
import { readFileSync as fsRead } from "fs";
import { join } from "path";
import {
  buildAdminReviewPacket,
  buildAdminFixGuidance,
  DENIAL_CATEGORIES,
  DENIAL_CATEGORY_LABELS,
} from "../shared/adminReviewPacket";
import type {
  AdminReviewPacketInput,
  DenialCategory,
} from "../shared/adminReviewPacket";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<AdminReviewPacketInput["project"]> = {}): AdminReviewPacketInput["project"] {
  return {
    id: 1,
    customerId: 10,
    businessName: "Apex Roofing",
    contactName: "Jane Smith",
    contactEmail: "jane@apex.com",
    contactPhone: "512-555-1234",
    packageTier: "growth",
    stage: "pending_admin_review",
    generationStatus: "complete",
    source: "self_service",
    userId: 42,
    paymentConfirmedAt: new Date("2026-05-15T10:00:00Z"),
    adminPreviewApprovedAt: null,
    approvedAt: null,
    adminReviewNotes: null,
    questionnaire: { businessName: "Apex Roofing", businessType: "contractor" },
    elenaConversationHistory: [
      { role: "assistant", content: "Hi! Tell me about your business." },
      { role: "user", content: "We do roofing in Austin." },
    ],
    generatedSiteHtml: JSON.stringify({ index: "<html>index</html>", about: "<html>about</html>" }),
    generatedSiteUrl: "https://preview.minimorphstudios.net/apex-roofing",
    previewReadyAt: new Date("2026-05-15T11:00:00Z"),
    createdAt: new Date("2026-05-14T08:00:00Z"),
    ...overrides,
  };
}

function makeAgreement(signerName = "Jane Smith"): AdminReviewPacketInput["agreements"][0] {
  return {
    id: 1,
    acceptedAt: new Date("2026-05-15T09:00:00Z"),
    signerName,
    userId: 42,
    projectId: 1,
  };
}

function makeBlueprint(overrides: Partial<AdminReviewPacketInput["blueprint"]> = {}): AdminReviewPacketInput["blueprint"] {
  return {
    id: 1,
    versionNumber: 1,
    adminBlueprintReviewStatus: "approved",
    blueprintJson: {
      identity: {
        businessName: "Apex Roofing",
        locationCity: "Austin",
        industryCategory: "contractor",
        doNotSayList: ["franchise", "nationwide"],
      },
      riskCompliance: {
        unsupportedFeatureAcknowledgments: ["no-instant-quote"],
        adminReviewRecommended: true,
        adminReviewReason: "Licensed contractor — verify credentials",
      },
      generatorInstructions: {
        templateLane: "contractor/dark-industrial",
        bannedPhrases: ["best in Austin", "guaranteed results"],
        claimsToOmit: ["we have 50 years experience"],
        claimsNeedingAdminReview: ["licensed and insured"],
        reviewFlags: ["contractor-license-claim"],
      },
      addOnUpsellFit: {
        addOnsTeamSetup: [{ product: "Google My Business Setup" }],
      },
    },
    ...overrides,
  };
}

function makeBuildReport(overrides: Partial<AdminReviewPacketInput["buildReports"][0]> = {}): AdminReviewPacketInput["buildReports"][0] {
  return {
    id: 1,
    status: "qa_passed",
    qaScore: 100,
    issuesPersistent: [],
    issuesEscalated: [],
    buildLog: [
      { type: "b11_handoff", data: { integrityScore: 85, safeToGenerate: true, warnings: [] } },
      { type: "info", message: "Generation complete" },
    ],
    buildCompletedAt: new Date("2026-05-15T10:30:00Z"),
    createdAt: new Date("2026-05-15T10:00:00Z"),
    ...overrides,
  };
}

function makeInput(overrides: Partial<AdminReviewPacketInput> = {}): AdminReviewPacketInput {
  return {
    project: makeProject(),
    blueprint: makeBlueprint(),
    agreements: [makeAgreement()],
    buildReports: [makeBuildReport()],
    customer: { status: "active", leadId: null, repId: null },
    hasContract: true,
    ...overrides,
  };
}

// ── A. buildAdminReviewPacket() — construction ────────────────────────────────

describe("A. buildAdminReviewPacket() — construction", () => {
  it("A-01: returns an object with all 10 sections plus blockers and canApprove", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p).toHaveProperty("section1");
    expect(p).toHaveProperty("section2");
    expect(p).toHaveProperty("section3");
    expect(p).toHaveProperty("section4");
    expect(p).toHaveProperty("section5");
    expect(p).toHaveProperty("section6");
    expect(p).toHaveProperty("section7");
    expect(p).toHaveProperty("section8");
    expect(p).toHaveProperty("section9");
    expect(p).toHaveProperty("section10");
    expect(p).toHaveProperty("blockers");
    expect(p).toHaveProperty("canApprove");
  });

  it("A-02: section1 carries project identity", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section1.projectId).toBe(1);
    expect(p.section1.businessName).toBe("Apex Roofing");
    expect(p.section1.packageTier).toBe("growth");
    expect(p.section1.generationStatus).toBe("complete");
  });

  it("A-03: section2 carries customer contact info", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section2.contactName).toBe("Jane Smith");
    expect(p.section2.contactEmail).toBe("jane@apex.com");
    expect(p.section2.contactPhone).toBe("512-555-1234");
  });

  it("A-04: section3 reflects valid signer agreement as contractReadyForCheckout=true", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section3.hasValidSignerAgreement).toBe(true);
    expect(p.section3.contractReadyForCheckout).toBe(true);
    expect(p.section3.signerName).toBe("Jane Smith");
    expect(p.section3.contractIssueBlockingCheckout).toBeNull();
    expect(p.section3.contractIssueBlockingLaunch).toBeNull();
  });

  it("A-05: section4 reflects Elena conversation history and customer truth", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section4.hasElenaConversation).toBe(true);
    expect(p.section4.messageCount).toBe(2);
    expect(p.section4.doNotSayItems).toContain("franchise");
    expect(p.section4.doNotSayItems).toContain("nationwide");
  });

  it("A-06: section5 extracts blueprint risk flags, banned phrases, template lane", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section5.hasBlueprintJson).toBe(true);
    expect(p.section5.templateLane).toBe("contractor/dark-industrial");
    expect(p.section5.bannedPhrases).toContain("best in Austin");
    expect(p.section5.claimsToOmit).toContain("we have 50 years experience");
    expect(p.section5.claimsNeedingAdminReview).toContain("licensed and insured");
  });

  it("A-07: section6 extracts B11 handoff entry from buildLog", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section6.hasHandoffEntry).toBe(true);
    expect(p.section6.integrityScore).toBe(85);
    expect(p.section6.safeToGenerate).toBe(true);
  });
});

// ── B. buildAdminReviewPacket() — null safety ─────────────────────────────────

describe("B. buildAdminReviewPacket() — null safety", () => {
  it("B-01: does not throw with empty agreements, no blueprint, no build reports", () => {
    expect(() => buildAdminReviewPacket({
      project: makeProject({ generatedSiteHtml: null }),
      blueprint: null,
      agreements: [],
      buildReports: [],
      customer: null,
      hasContract: false,
    })).not.toThrow();
  });

  it("B-02: section3 hasValidSignerAgreement=false when agreements is empty", () => {
    const p = buildAdminReviewPacket(makeInput({ agreements: [] }));
    expect(p.section3.hasValidSignerAgreement).toBe(false);
    expect(p.section3.contractReadyForCheckout).toBe(false);
    expect(p.section3.contractIssueBlockingCheckout).not.toBeNull();
  });

  it("B-03: section5 hasBlueprintJson=false when blueprint is null", () => {
    const p = buildAdminReviewPacket(makeInput({ blueprint: null }));
    expect(p.section5.hasBlueprintJson).toBe(false);
    expect(p.section5.riskFlags).toEqual([]);
  });

  it("B-04: section6 hasHandoffEntry=false when buildLog has no b11_handoff", () => {
    const p = buildAdminReviewPacket(makeInput({
      buildReports: [makeBuildReport({ buildLog: [{ type: "info", message: "done" }] })],
    }));
    expect(p.section6.hasHandoffEntry).toBe(false);
    expect(p.section6.integrityScore).toBeNull();
  });
});

// ── C. canApprove blocker detection ──────────────────────────────────────────

describe("C. canApprove blocker detection", () => {
  it("C-01: canApprove=false when generationStatus is idle", () => {
    const p = buildAdminReviewPacket(makeInput({
      project: makeProject({ generationStatus: "idle" }),
    }));
    expect(p.canApprove).toBe(false);
    expect(p.blockers.some(b => b.toLowerCase().includes("generation"))).toBe(true);
  });

  it("C-02: canApprove=false when generationStatus is failed", () => {
    const p = buildAdminReviewPacket(makeInput({
      project: makeProject({ generationStatus: "failed" }),
    }));
    expect(p.canApprove).toBe(false);
  });

  it("C-03: canApprove=false when generationStatus is generating", () => {
    const p = buildAdminReviewPacket(makeInput({
      project: makeProject({ generationStatus: "generating" }),
    }));
    expect(p.canApprove).toBe(false);
  });

  it("C-04: canApprove=false when no generatedSiteHtml", () => {
    const p = buildAdminReviewPacket(makeInput({
      project: makeProject({ generatedSiteHtml: null }),
    }));
    expect(p.canApprove).toBe(false);
    expect(p.blockers.some(b => b.toLowerCase().includes("generated site"))).toBe(true);
  });

  it("C-05: canApprove=false when no build report", () => {
    const p = buildAdminReviewPacket(makeInput({ buildReports: [] }));
    expect(p.canApprove).toBe(false);
    expect(p.blockers.some(b => b.toLowerCase().includes("build report"))).toBe(true);
  });

  it("C-06: canApprove=false for self-service project with sentinel signer name", () => {
    const p = buildAdminReviewPacket(makeInput({
      project: makeProject({ userId: 42, paymentConfirmedAt: null }),
      agreements: [makeAgreement("customer")],
    }));
    expect(p.canApprove).toBe(false);
    expect(p.blockers.some(b => b.toLowerCase().includes("agreement"))).toBe(true);
  });

  it("C-07: canApprove=false when no contract and hasContract=false", () => {
    const p = buildAdminReviewPacket(makeInput({ hasContract: false }));
    expect(p.canApprove).toBe(false);
    expect(p.blockers.some(b => b.toLowerCase().includes("contract"))).toBe(true);
  });

  it("C-08: canApprove=true when generation complete, site built, build report exists, valid agreement, contract on file", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.canApprove).toBe(true);
    expect(p.blockers).toHaveLength(0);
  });
});

// ── D. buildAdminFixGuidance() — category-specific guidance ──────────────────

describe("D. buildAdminFixGuidance() — category guidance", () => {
  function makePacket() {
    return buildAdminReviewPacket(makeInput());
  }

  it("D-01: text_copy category includes copy-specific guidance", () => {
    const g = buildAdminFixGuidance({ category: "text_copy", reason: "copy is wrong" }, makePacket());
    expect(g.category).toBe("text_copy");
    expect(g.primaryGuidance.some(l => l.toLowerCase().includes("copy") || l.toLowerCase().includes("fact"))).toBe(true);
  });

  it("D-02: design_style category includes design-specific guidance", () => {
    const g = buildAdminFixGuidance({ category: "design_style", reason: "wrong style" }, makePacket());
    expect(g.primaryGuidance.some(l => l.toLowerCase().includes("design") || l.toLowerCase().includes("template"))).toBe(true);
  });

  it("D-03: contact_form category references contact-submit endpoint", () => {
    const g = buildAdminFixGuidance({ category: "contact_form", reason: "form broken" }, makePacket());
    expect(g.primaryGuidance.some(l => l.includes("contact-submit") || l.toLowerCase().includes("form endpoint"))).toBe(true);
  });

  it("D-04: customerTruthToPreserve populated from blueprint identity + doNotSayList", () => {
    const g = buildAdminFixGuidance({ category: "text_copy", reason: "needs fix" }, makePacket());
    expect(g.customerTruthToPreserve.some(t => t.includes("Apex Roofing"))).toBe(true);
    expect(g.customerTruthToPreserve.some(t => t.includes("franchise") || t.includes("Do NOT"))).toBe(true);
  });

  it("D-05: contentConstraints includes banned phrases and omitted claims from Blueprint", () => {
    const g = buildAdminFixGuidance({ category: "text_copy", reason: "needs fix" }, makePacket());
    expect(g.contentConstraints.some(c => c.includes("best in Austin"))).toBe(true);
    expect(g.contentConstraints.some(c => c.includes("we have 50 years experience"))).toBe(true);
  });
});

// ── E. adminApprovePreview — source assertions ────────────────────────────────

describe("E. adminApprovePreview — source assertions", () => {
  const routersSource = fsRead(join(process.cwd(), "server/routers.ts"), "utf-8");
  const approveStart = routersSource.indexOf("adminApprovePreview: adminProcedure");
  const approveBlock = routersSource.slice(
    approveStart,
    routersSource.indexOf("adminDenyPreview: adminProcedure", approveStart)
  );

  it("E-01: adminApprovePreview checks generationStatus !== complete and throws BAD_REQUEST", () => {
    expect(approveBlock).toContain("generationStatus");
    expect(approveBlock).toContain("BAD_REQUEST");
  });

  it("E-02: adminApprovePreview checks generatedSiteHtml and throws if missing", () => {
    expect(approveBlock).toContain("generatedSiteHtml");
    expect(approveBlock).toContain("No generated site found");
  });

  it("E-03: adminApprovePreview checks for build report and throws if missing", () => {
    expect(approveBlock).toContain("siteBuildReports");
    expect(approveBlock).toContain("No build report found");
  });

  it("E-04: adminApprovePreview checks hasValidSignerAgreement for self-service/paid projects", () => {
    expect(approveBlock).toContain("hasValidSignerAgreement");
    expect(approveBlock).toContain("Contract issue blocking approval");
  });
});

// ── F. adminDenyPreview — source assertions ───────────────────────────────────

describe("F. adminDenyPreview — source assertions", () => {
  const routersSource = fsRead(join(process.cwd(), "server/routers.ts"), "utf-8");
  const denyStart = routersSource.indexOf("adminDenyPreview: adminProcedure");
  const denyBlock = routersSource.slice(
    denyStart,
    routersSource.indexOf("adminReleaseLaunch: adminProcedure", denyStart)
  );

  it("F-01: adminDenyPreview input schema requires denialCategory as z.enum", () => {
    expect(denyBlock).toContain("denialCategory");
    expect(denyBlock).toContain("z.enum");
    expect(denyBlock).toContain("text_copy");
    expect(denyBlock).toContain("contract_compliance");
  });

  it("F-02: adminDenyPreview input schema requires fixInstructions z.string().min(1)", () => {
    expect(denyBlock).toContain("fixInstructions");
    expect(denyBlock).toContain('z.string().min(1)');
  });

  it("F-03: adminDenyPreview stores structured denial JSON in adminReviewNotes", () => {
    expect(denyBlock).toContain("structuredDenial");
    expect(denyBlock).toContain("JSON.stringify");
    expect(denyBlock).toContain("adminReviewNotes");
  });

  it("F-04: adminDenyPreview clears adminPreviewApprovedAt (sets to null)", () => {
    expect(denyBlock).toContain("adminPreviewApprovedAt: null");
  });

  it("F-05: adminDenyPreview sets stage: revisions and generationStatus: idle", () => {
    expect(denyBlock).toContain('stage: "revisions"');
    expect(denyBlock).toContain('generationStatus: "idle"');
  });
});

// ── G. getAdminReviewPacket + getAdminFixGuidance — source assertions ─────────

describe("G. getAdminReviewPacket + getAdminFixGuidance — source assertions", () => {
  const routersSource = fsRead(join(process.cwd(), "server/routers.ts"), "utf-8");

  it("G-01: getAdminReviewPacket procedure exists and calls buildAdminReviewPacket", () => {
    expect(routersSource).toContain("getAdminReviewPacket: adminProcedure");
    expect(routersSource).toContain("buildAdminReviewPacket");
  });

  it("G-02: getAdminReviewPacket fetches blueprint, agreements, and build reports", () => {
    const start = routersSource.indexOf("getAdminReviewPacket: adminProcedure");
    const block = routersSource.slice(start, routersSource.indexOf("getAdminFixGuidance: adminProcedure", start));
    expect(block).toContain("getBlueprintByProjectId");
    expect(block).toContain("listCustomerAgreementsByProject");
    expect(block).toContain("siteBuildReports");
  });

  it("G-03: getAdminFixGuidance procedure exists and calls buildAdminFixGuidance", () => {
    expect(routersSource).toContain("getAdminFixGuidance: adminProcedure");
    expect(routersSource).toContain("buildAdminFixGuidance");
  });

  it("G-04: getAdminFixGuidance parses adminReviewNotes and returns null when absent", () => {
    const start = routersSource.indexOf("getAdminFixGuidance: adminProcedure");
    const block = routersSource.slice(start, routersSource.indexOf("adminApprovePreview: adminProcedure", start));
    expect(block).toContain("adminReviewNotes");
    expect(block).toContain("JSON.parse");
    expect(block).toContain("return null");
  });
});

// ── H. Customer visibility gate — source assertions ───────────────────────────

describe("H. Customer visibility gate — source assertions", () => {
  const routersSource = fsRead(join(process.cwd(), "server/routers.ts"), "utf-8");

  it("H-01: adminApprovePreview sets stage: review — enabling customer to see preview", () => {
    const start = routersSource.indexOf("adminApprovePreview: adminProcedure");
    const block = routersSource.slice(start, routersSource.indexOf("adminDenyPreview: adminProcedure", start));
    expect(block).toContain('stage: "review"');
    expect(block).toContain("adminPreviewApprovedAt: now");
  });

  it("H-02: adminDenyPreview clears adminPreviewApprovedAt=null so customer cannot see preview", () => {
    const start = routersSource.indexOf("adminDenyPreview: adminProcedure");
    const block = routersSource.slice(start, routersSource.indexOf("adminReleaseLaunch: adminProcedure", start));
    expect(block).toContain("adminPreviewApprovedAt: null");
    expect(block).toContain('stage: "revisions"');
  });

  it("H-03: B10 approveLaunch still checks adminPreviewApprovedAt before allowing customer approval", () => {
    expect(routersSource).toContain("adminPreviewApprovedAt");
    const b10 = routersSource.indexOf("if (!project.adminPreviewApprovedAt)");
    expect(b10).toBeGreaterThan(-1);
  });

  it("H-04: adminReleaseLaunch still requires customer approvedAt before launch", () => {
    const start = routersSource.indexOf("adminReleaseLaunch: adminProcedure");
    const block = routersSource.slice(start, start + 2000);
    expect(block).toContain("approvedAt");
    expect(block).toContain("Customer has not yet approved");
  });
});

// ── I. Admin UI source assertions — panel, deny form, fix guidance ────────────

describe("I. Admin UI — source assertions", () => {
  const uiSource = fsRead(join(process.cwd(), "client/src/pages/admin/OnboardingProjects.tsx"), "utf-8");

  it("I-01: AdminReviewPanel component exists and uses getAdminReviewPacket query", () => {
    expect(uiSource).toContain("function AdminReviewPanel");
    expect(uiSource).toContain("getAdminReviewPacket");
  });

  it("I-02: AdminReviewPanel shows section2 (contactName, contactEmail)", () => {
    expect(uiSource).toContain("section2.contactName");
    expect(uiSource).toContain("section2.contactEmail");
  });

  it("I-03: AdminReviewPanel shows section3 contract issue fields", () => {
    expect(uiSource).toContain("section3.hasValidSignerAgreement");
    expect(uiSource).toContain("section3.contractIssueBlockingLaunch");
  });

  it("I-04: AdminReviewPanel shows section8 build report QA score", () => {
    expect(uiSource).toContain("section8.hasBuildReport");
    expect(uiSource).toContain("section8.qaScore");
  });

  it("I-05: AdminReviewPanel shows section6 B11 handoff integrity score", () => {
    expect(uiSource).toContain("section6.hasHandoffEntry");
    expect(uiSource).toContain("section6.integrityScore");
  });

  it("I-06: Structured deny form has denialCategory Select and fixInstructions Textarea", () => {
    expect(uiSource).toContain("DENIAL_CATEGORY_OPTIONS");
    expect(uiSource).toContain("denyForms[project.id]?.category");
    expect(uiSource).toContain("fixInstructions");
    expect(uiSource).toContain("Confirm Denial");
  });

  it("I-07: UI uses getAdminFixGuidance query and shows fix guidance panel", () => {
    expect(uiSource).toContain("getAdminFixGuidance");
    expect(uiSource).toContain("guidanceQuery.data");
    expect(uiSource).toContain("Fix Guidance");
  });

  it("I-08: Admin Review Details panel is gated on pending_admin_review stage", () => {
    expect(uiSource).toContain('pending_admin_review');
    expect(uiSource).toContain("Admin Review Details");
    expect(uiSource).toContain("expandedAdminReview");
  });
});

// ── J. Prior gate regression sources ─────────────────────────────────────────

describe("J. Prior gate regression sources", () => {
  it("J-01: DENIAL_CATEGORIES exports all 7 expected categories", () => {
    expect(DENIAL_CATEGORIES).toContain("text_copy");
    expect(DENIAL_CATEGORIES).toContain("design_style");
    expect(DENIAL_CATEGORIES).toContain("photo_media");
    expect(DENIAL_CATEGORIES).toContain("business_info");
    expect(DENIAL_CATEGORIES).toContain("contact_form");
    expect(DENIAL_CATEGORIES).toContain("contract_compliance");
    expect(DENIAL_CATEGORIES).toContain("other");
    expect(DENIAL_CATEGORIES).toHaveLength(7);
  });

  it("J-02: DENIAL_CATEGORY_LABELS has a label for every category", () => {
    for (const cat of DENIAL_CATEGORIES) {
      expect(DENIAL_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("J-03: section8 pageCount and pageNames derived from generatedSiteHtml JSON keys", () => {
    const p = buildAdminReviewPacket(makeInput());
    expect(p.section7.pageCount).toBe(2);
    expect(p.section7.pageNames).toContain("index");
    expect(p.section7.pageNames).toContain("about");
  });
});
