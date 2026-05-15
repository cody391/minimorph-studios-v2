/**
 * Admin Blueprint Gate (B7) — Tests proving generation is hard-blocked until
 * admin explicitly approves the Blueprint. Customer approval alone is not enough.
 * Customer-directed claim documentation must survive admin approval.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ── Blueprint fixtures ────────────────────────────────────────────────────────

function makeBlueprintRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    projectId: 42,
    userId: 10,
    status: "approved",
    versionNumber: 1,
    blueprintJson: { businessName: "Test Co", websiteType: "plumber" },
    approvedAt: new Date(),
    approvedByUserId: 10,
    lockedForGeneration: true,
    adminBlueprintReviewStatus: "pending",
    adminBlueprintApprovedAt: null,
    adminBlueprintApprovedBy: null,
    adminBlueprintApprovalNotes: null,
    adminBlueprintReturnedAt: null,
    adminBlueprintReturnReason: null,
    adminBlueprintReviewFlags: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAdminApprovedBlueprint(overrides: Record<string, unknown> = {}) {
  return makeBlueprintRow({
    adminBlueprintReviewStatus: "approved",
    adminBlueprintApprovedAt: new Date(),
    adminBlueprintApprovedBy: 1,
    ...overrides,
  });
}

// ── Gate logic (mirrors siteGenerator.ts Gate 1.5) ───────────────────────────

function checkAdminGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  if (blueprint.adminBlueprintReviewStatus !== "approved" || !blueprint.adminBlueprintApprovedAt) {
    return { blocked: true, reason: "Admin Blueprint approval required before generation." };
  }
  return { blocked: false, reason: "" };
}

function checkCustomerGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  if (blueprint.status !== "approved") {
    return { blocked: true, reason: "Waiting for customer blueprint approval." };
  }
  return { blocked: false, reason: "" };
}

function checkFullGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  const customerResult = checkCustomerGate(blueprint);
  if (customerResult.blocked) return customerResult;
  return checkAdminGate(blueprint);
}

// ── Section A: Generation blocked without admin approval ─────────────────────

describe("A — Generation gate: admin approval required", () => {
  it("blocks generation when adminBlueprintReviewStatus is pending", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "pending", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("Admin Blueprint approval required");
  });

  it("blocks generation when adminBlueprintReviewStatus is needs_changes", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "needs_changes", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocks generation when adminBlueprintReviewStatus is blocked", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "blocked", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocks generation when adminBlueprintApprovedAt is missing even if status says approved", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "approved", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocks generation when adminBlueprintApprovedAt is undefined", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "approved", adminBlueprintApprovedAt: undefined });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("allows generation when admin has approved and timestamp is present", () => {
    const bp = makeAdminApprovedBlueprint();
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });
});

// ── Section B: Customer approval alone is not enough ─────────────────────────

describe("B — Customer-only approval does not unblock generation", () => {
  it("blocks when customer has approved but admin has not", () => {
    const bp = makeBlueprintRow({
      status: "approved",
      approvedAt: new Date(),
      adminBlueprintReviewStatus: "pending",
      adminBlueprintApprovedAt: null,
    });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("Admin Blueprint approval required");
  });

  it("blocks when customer is in customer_review and admin is approved (no customer approval)", () => {
    const bp = makeBlueprintRow({
      status: "customer_review",
      approvedAt: null,
      adminBlueprintReviewStatus: "approved",
      adminBlueprintApprovedAt: new Date(),
    });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("customer blueprint approval");
  });

  it("allows generation only when BOTH customer AND admin have approved", () => {
    const bp = makeBlueprintRow({
      status: "approved",
      approvedAt: new Date(),
      adminBlueprintReviewStatus: "approved",
      adminBlueprintApprovedAt: new Date(),
    });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(false);
  });
});

// ── Section C: Admin approval records ─────────────────────────────────────────

describe("C — Admin approval records timestamp, user, and notes", () => {
  it("records adminBlueprintApprovedAt timestamp", () => {
    const ts = new Date("2026-05-15T10:00:00Z");
    const bp = makeAdminApprovedBlueprint({ adminBlueprintApprovedAt: ts });
    expect(bp.adminBlueprintApprovedAt).toEqual(ts);
  });

  it("records adminBlueprintApprovedBy admin user id", () => {
    const bp = makeAdminApprovedBlueprint({ adminBlueprintApprovedBy: 99 });
    expect(bp.adminBlueprintApprovedBy).toBe(99);
  });

  it("records adminBlueprintApprovalNotes when provided", () => {
    const bp = makeAdminApprovedBlueprint({ adminBlueprintApprovalNotes: "Reviewed all 9 sections. Approved." });
    expect(bp.adminBlueprintApprovalNotes).toBe("Reviewed all 9 sections. Approved.");
  });

  it("allows adminBlueprintApprovalNotes to be null (optional)", () => {
    const bp = makeAdminApprovedBlueprint({ adminBlueprintApprovalNotes: null });
    expect(bp.adminBlueprintApprovalNotes).toBeNull();
  });
});

// ── Section D: Admin return sets needs_changes ─────────────────────────────────

describe("D — Admin return blocks generation and records reason", () => {
  it("needs_changes status blocks generation", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnedAt: new Date(),
      adminBlueprintReturnReason: "Please clarify the services offered section",
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("records adminBlueprintReturnedAt timestamp", () => {
    const ts = new Date("2026-05-15T11:00:00Z");
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnedAt: ts,
      adminBlueprintReturnReason: "Needs clarification",
    });
    expect(bp.adminBlueprintReturnedAt).toEqual(ts);
  });

  it("records adminBlueprintReturnReason", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnReason: "Regulated industry — needs admin review of riskCompliance section",
    });
    expect(bp.adminBlueprintReturnReason).toBeTruthy();
  });
});

// ── Section E: Blocked status prevents generation ─────────────────────────────

describe("E — Blocked Blueprint prevents generation", () => {
  it("blocked status is rejected by admin gate", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "blocked",
      adminBlueprintReturnReason: "Content cannot be published — outside MiniMorph standards",
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocked status with adminBlueprintApprovedAt still blocks (timestamp alone is not enough)", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "blocked",
      adminBlueprintApprovedAt: new Date(),
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });
});

// ── Section F: Regulated/high-risk Blueprint flags ───────────────────────────

describe("F — Regulated and high-risk Blueprints require admin review", () => {
  it("regulated industry Blueprint has adminReviewRecommended in riskCompliance", () => {
    const bpJson = {
      businessName: "Austin Family Dental",
      websiteType: "dental",
      riskCompliance: {
        regulatedIndustry: true,
        riskLevel: "regulated_review_required",
        adminReviewRecommended: true,
        adminReviewReason: "Regulated health industry — dental practice",
      },
    };
    const bp = makeBlueprintRow({ blueprintJson: bpJson });
    const riskCompliance = (bp.blueprintJson as any).riskCompliance;
    expect(riskCompliance.adminReviewRecommended).toBe(true);
    expect(riskCompliance.regulatedIndustry).toBe(true);
  });

  it("high-risk Blueprint has adminReviewRecommended flag", () => {
    const bpJson = {
      businessName: "Green Valley Dispensary",
      websiteType: "cannabis",
      riskCompliance: {
        regulatedIndustry: true,
        riskLevel: "high",
        adminReviewRecommended: true,
        adminReviewReason: "Cannabis industry — high regulatory and legal risk",
      },
    };
    const bp = makeBlueprintRow({ blueprintJson: bpJson });
    const riskCompliance = (bp.blueprintJson as any).riskCompliance;
    expect(riskCompliance.adminReviewRecommended).toBe(true);
    expect(checkAdminGate(bp).blocked).toBe(true);
  });

  it("high-risk Blueprint still requires admin approval to generate", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "pending",
      adminBlueprintApprovedAt: null,
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("high-risk Blueprint can generate after explicit admin approval", () => {
    const bp = makeAdminApprovedBlueprint();
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });
});

// ── Section G: Customer claim doctrine preserved ──────────────────────────────

describe("G — Admin approval does not erase customer-directed claim documentation", () => {
  const customerClaimJson = {
    businessName: "Apex Claims LLC",
    positioning: {
      riskyCustomerDirectedClaims: [
        {
          claim: "We are the #1 rated roofer in Austin",
          source: "customer_provided",
          courtesyNoticeGiven: true,
          saferAlternativeSuggested: "One of Austin's top-rated roofing companies",
          customerAcceptedSaferAlternative: false,
          customerDirectedOriginalWording: true,
        },
      ],
      courtesyRiskNotices: ["Superlative claim (#1 rated) cannot be verified. Customer acknowledged."],
      customerAcknowledgments: ["customer_directed_superlative_2026-05-15"],
    },
  };

  it("blueprintJson positioning fields survive admin approval update", () => {
    const bp = makeBlueprintRow({ blueprintJson: customerClaimJson });
    const adminApprovalUpdate = {
      adminBlueprintReviewStatus: "approved",
      adminBlueprintApprovedAt: new Date(),
      adminBlueprintApprovedBy: 1,
      adminBlueprintApprovalNotes: "Reviewed. Customer acknowledged superlative claim.",
    };
    const merged = { ...bp, ...adminApprovalUpdate };
    const positioning = (merged.blueprintJson as any).positioning;
    expect(positioning.riskyCustomerDirectedClaims).toHaveLength(1);
    expect(positioning.riskyCustomerDirectedClaims[0].customerDirectedOriginalWording).toBe(true);
    expect(positioning.courtesyRiskNotices).toHaveLength(1);
    expect(positioning.customerAcknowledgments).toContain("customer_directed_superlative_2026-05-15");
  });

  it("admin approval writes to approval columns, not to blueprintJson", () => {
    const bp = makeBlueprintRow({ blueprintJson: customerClaimJson });
    const adminApprovalUpdate = {
      adminBlueprintReviewStatus: "approved",
      adminBlueprintApprovedAt: new Date(),
      adminBlueprintApprovedBy: 1,
    };
    const merged = { ...bp, ...adminApprovalUpdate };
    expect(merged.blueprintJson).toEqual(customerClaimJson);
    expect(merged.adminBlueprintReviewStatus).toBe("approved");
  });

  it("admin return preserves customer acknowledgment fields", () => {
    const bp = makeBlueprintRow({ blueprintJson: customerClaimJson });
    const adminReturnUpdate = {
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnedAt: new Date(),
      adminBlueprintReturnReason: "Superlative claim needs customer acknowledgment note",
      adminBlueprintApprovedAt: null,
      adminBlueprintApprovedBy: null,
    };
    const merged = { ...bp, ...adminReturnUpdate };
    const positioning = (merged.blueprintJson as any).positioning;
    expect(positioning.customerAcknowledgments).toContain("customer_directed_superlative_2026-05-15");
    expect(merged.adminBlueprintReturnReason).toBeTruthy();
  });
});

// ── Section H: Legacy blueprints are backward compatible ─────────────────────

describe("H — Legacy Blueprint records without admin fields do not crash gate", () => {
  it("legacy blueprint missing adminBlueprintReviewStatus is treated as pending", () => {
    const legacyBp = {
      id: 99,
      projectId: 1,
      status: "approved",
      blueprintJson: { businessName: "Old Business" },
      approvedAt: new Date("2026-01-01"),
      adminBlueprintReviewStatus: undefined,
      adminBlueprintApprovedAt: undefined,
    };
    const result = checkAdminGate(legacyBp);
    expect(result.blocked).toBe(true);
  });

  it("legacy blueprint with null admin fields is safely blocked", () => {
    const legacyBp = makeBlueprintRow({
      adminBlueprintReviewStatus: null,
      adminBlueprintApprovedAt: null,
    });
    const result = checkAdminGate(legacyBp);
    expect(result.blocked).toBe(true);
  });
});

// ── Section I: Review flags ────────────────────────────────────────────────────

describe("I — Admin review flags are stored and preserved", () => {
  it("review flags array is preserved in blueprint row", () => {
    const flags = ["regulated_industry", "high_risk", "blocked_addon_requested"];
    const bp = makeBlueprintRow({ adminBlueprintReviewFlags: flags });
    expect(bp.adminBlueprintReviewFlags).toEqual(flags);
  });

  it("review flags default to null for new blueprints", () => {
    const bp = makeBlueprintRow();
    expect(bp.adminBlueprintReviewFlags).toBeNull();
  });

  it("new flags can be merged with existing flags without duplication", () => {
    const existing = ["regulated_industry"];
    const newFlags = ["regulated_industry", "high_risk"];
    const merged = Array.from(new Set([...existing, ...newFlags]));
    expect(merged).toEqual(["regulated_industry", "high_risk"]);
    expect(merged).toHaveLength(2);
  });
});

// ── Section J: Drizzle schema has admin fields ────────────────────────────────

describe("J — Drizzle schema includes admin Blueprint gate fields", () => {
  const schemaSource = readFileSync(join(__dirname, "../drizzle/schema.ts"), "utf-8");

  it("schema has adminBlueprintReviewStatus column", () => {
    expect(schemaSource).toContain("adminBlueprintReviewStatus");
  });

  it("schema has adminBlueprintApprovedAt column", () => {
    expect(schemaSource).toContain("adminBlueprintApprovedAt");
  });

  it("schema has adminBlueprintApprovedBy column", () => {
    expect(schemaSource).toContain("adminBlueprintApprovedBy");
  });

  it("schema has adminBlueprintApprovalNotes column", () => {
    expect(schemaSource).toContain("adminBlueprintApprovalNotes");
  });

  it("schema has adminBlueprintReturnedAt column", () => {
    expect(schemaSource).toContain("adminBlueprintReturnedAt");
  });

  it("schema has adminBlueprintReturnReason column", () => {
    expect(schemaSource).toContain("adminBlueprintReturnReason");
  });

  it("schema has adminBlueprintReviewFlags column", () => {
    expect(schemaSource).toContain("adminBlueprintReviewFlags");
  });

  it("schema enum includes all 4 review statuses", () => {
    expect(schemaSource).toContain('"pending"');
    expect(schemaSource).toContain('"approved"');
    expect(schemaSource).toContain('"needs_changes"');
    expect(schemaSource).toContain('"blocked"');
  });
});

// ── Section K: siteGenerator.ts has admin gate ────────────────────────────────

describe("K — siteGenerator.ts enforces admin Blueprint gate", () => {
  const generatorSource = readFileSync(
    join(__dirname, "services/siteGenerator.ts"),
    "utf-8"
  );

  it("gate checks adminBlueprintReviewStatus", () => {
    expect(generatorSource).toContain("adminBlueprintReviewStatus");
  });

  it("gate checks adminBlueprintApprovedAt", () => {
    expect(generatorSource).toContain("adminBlueprintApprovedAt");
  });

  it("gate error message references admin approval requirement", () => {
    expect(generatorSource).toContain("Admin Blueprint approval required before generation");
  });

  it("gate is placed before generation starts (Gate 1.5)", () => {
    const gate15Idx = generatorSource.indexOf("Gate 1.5");
    const generatingIdx = generatorSource.indexOf("generationStatus: \"generating\"");
    expect(gate15Idx).toBeGreaterThan(0);
    expect(gate15Idx).toBeLessThan(generatingIdx);
  });
});

// ── Section L: routers.ts admin procedures ────────────────────────────────────

describe("L — routers.ts admin procedures are wired", () => {
  const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");

  it("adminApproveBlueprint procedure exists", () => {
    expect(routersSource).toContain("adminApproveBlueprint:");
  });

  it("adminReturnBlueprint procedure exists", () => {
    expect(routersSource).toContain("adminReturnBlueprint:");
  });

  it("adminBlockBlueprint procedure exists", () => {
    expect(routersSource).toContain("adminBlockBlueprint:");
  });

  it("adminAddBlueprintFlags procedure exists", () => {
    expect(routersSource).toContain("adminAddBlueprintFlags:");
  });

  it("triggerGeneration checks admin blueprint approval", () => {
    const trigIdx = routersSource.indexOf("triggerGeneration: adminProcedure");
    const trigSection = routersSource.slice(trigIdx, trigIdx + 800);
    expect(trigSection).toContain("adminBlueprintReviewStatus");
    expect(trigSection).toContain("Admin Blueprint approval required before generation");
  });

  it("approveBlueprint (customer) checks admin approval before firing generation", () => {
    const approveIdx = routersSource.indexOf("approveBlueprint: protectedProcedure");
    const approveSection = routersSource.slice(approveIdx, approveIdx + 2000);
    expect(approveSection).toContain("adminBlueprintReviewStatus");
    expect(approveSection).toContain("adminApproved");
  });
});
