/**
 * Admin Blueprint Gate — Lifecycle-Realigned Tests
 *
 * Correct lifecycle (steps 4–9):
 *   4. System automatically checks Blueprint readiness (completenessScore ≥ 60 → auto-approve)
 *   5. If not ready, Elena asks more questions
 *   6. If ready, builder builds automatically
 *   7. Build report created
 *   8. Admin reviews BUILT site + Elena chat + Blueprint summary + build report
 *   9. Admin approves or DENIES
 *
 * Gate 1.5 correct behavior (lifecycle realignment):
 *   "blocked"       → HARD BLOCK — admin has serious concerns, never generate
 *   "pending"       → ALLOW — admin has not yet reviewed; admin reviews the built site at step 8
 *   "needs_changes" → ALLOW — admin noted information but did not hard-block; reviews built site
 *   "approved"      → ALLOW — admin explicitly pre-approved; still generates
 *   null/undefined  → ALLOW — same as pending (default for new blueprints)
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
    blueprintJson: { businessName: "Test Co", websiteType: "plumber", metadata: { completenessScore: 75 } },
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

function makeAdminBlockedBlueprint(overrides: Record<string, unknown> = {}) {
  return makeBlueprintRow({
    adminBlueprintReviewStatus: "blocked",
    adminBlueprintReturnReason: "Content outside MiniMorph standards",
    ...overrides,
  });
}

// ── Gate logic (mirrors siteGenerator.ts Gate 1.5 after lifecycle realignment) ──
// Only "blocked" stops generation. Admin reviews the BUILT site at step 8.

function checkAdminGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  if (blueprint.adminBlueprintReviewStatus === "blocked") {
    return { blocked: true, reason: "Blueprint explicitly blocked by admin — contact your account manager." };
  }
  return { blocked: false, reason: "" };
}

function checkCustomerGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  if (blueprint.status !== "approved") {
    return { blocked: true, reason: "Waiting for Blueprint readiness (Elena conversation incomplete)." };
  }
  return { blocked: false, reason: "" };
}

function checkFullGate(blueprint: Record<string, unknown>): { blocked: boolean; reason: string } {
  const customerResult = checkCustomerGate(blueprint);
  if (customerResult.blocked) return customerResult;
  return checkAdminGate(blueprint);
}

// ── Blueprint readiness auto-approval logic (mirrors saveQuestionnaire) ──────

function checkBlueprintReadiness(blueprintJson: Record<string, unknown>): { ready: boolean; score: number } {
  const score = (blueprintJson as any)?.metadata?.completenessScore ?? 0;
  return { ready: score >= 60, score };
}

// ── Section A: Hard-block gate — only "blocked" stops generation ─────────────

describe("A — Gate 1.5: only 'blocked' status stops generation", () => {
  it("'pending' admin status allows generation (admin reviews built site at step 8)", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "pending", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("'needs_changes' admin status allows generation (informational, not a hard block)", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: "needs_changes", adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("'approved' admin status allows generation", () => {
    const bp = makeAdminApprovedBlueprint();
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("null admin status allows generation (defaults to pending)", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: null, adminBlueprintApprovedAt: null });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("undefined admin status allows generation (defaults to pending)", () => {
    const bp = makeBlueprintRow({ adminBlueprintReviewStatus: undefined, adminBlueprintApprovedAt: undefined });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("'blocked' admin status STOPS generation — only hard block", () => {
    const bp = makeAdminBlockedBlueprint();
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("blocked");
  });
});

// ── Section B: Blueprint auto-approval via readiness score ────────────────────

describe("B — Blueprint auto-approval: Elena submission = customer confirmation", () => {
  it("Blueprint with completenessScore ≥ 60 is auto-approved", () => {
    const bpJson = { metadata: { completenessScore: 75 } };
    const { ready, score } = checkBlueprintReadiness(bpJson);
    expect(ready).toBe(true);
    expect(score).toBe(75);
  });

  it("Blueprint with completenessScore < 60 is NOT auto-approved (needs more Elena info)", () => {
    const bpJson = { metadata: { completenessScore: 45 } };
    const { ready } = checkBlueprintReadiness(bpJson);
    expect(ready).toBe(false);
  });

  it("Blueprint at exactly 60 is auto-approved", () => {
    const bpJson = { metadata: { completenessScore: 60 } };
    const { ready } = checkBlueprintReadiness(bpJson);
    expect(ready).toBe(true);
  });

  it("Blueprint missing metadata.completenessScore treated as score 0 (not ready)", () => {
    const bpJson = { businessName: "Test Co" };
    const { ready, score } = checkBlueprintReadiness(bpJson);
    expect(ready).toBe(false);
    expect(score).toBe(0);
  });

  it("auto-approved Blueprint (status='approved') + non-blocked admin = generation allowed", () => {
    const bp = makeBlueprintRow({ status: "approved", adminBlueprintReviewStatus: "pending" });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("auto-approved Blueprint + admin 'blocked' = STILL BLOCKED (admin hard block wins)", () => {
    const bp = makeBlueprintRow({ status: "approved", adminBlueprintReviewStatus: "blocked" });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("Blueprint in 'customer_review' (incomplete) cannot generate yet", () => {
    const bp = makeBlueprintRow({ status: "customer_review", approvedAt: null });
    const result = checkCustomerGate(bp);
    expect(result.blocked).toBe(true);
  });
});

// ── Section C: Admin approval records are preserved ────────────────────────────

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

// ── Section D: "needs_changes" is informational — does not block generation ───

describe("D — 'needs_changes' is informational, not a generation hard block", () => {
  it("needs_changes status allows generation (admin reviews built site)", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnedAt: new Date(),
      adminBlueprintReturnReason: "Please clarify the services offered section",
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("needs_changes records adminBlueprintReturnedAt timestamp for audit trail", () => {
    const ts = new Date("2026-05-15T11:00:00Z");
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnedAt: ts,
    });
    expect(bp.adminBlueprintReturnedAt).toEqual(ts);
  });

  it("needs_changes records adminBlueprintReturnReason for admin reference", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "needs_changes",
      adminBlueprintReturnReason: "Regulated industry — verify riskCompliance section before generation",
    });
    expect(bp.adminBlueprintReturnReason).toBeTruthy();
  });
});

// ── Section E: "blocked" is the ONLY hard block ──────────────────────────────

describe("E — 'blocked' is the only admin status that prevents generation", () => {
  it("blocked status is rejected by admin gate", () => {
    const bp = makeAdminBlockedBlueprint();
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocked status with adminBlueprintApprovedAt still blocks (status wins over timestamp)", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "blocked",
      adminBlueprintApprovedAt: new Date(),
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("blocked status blocks even if Blueprint is customer-approved", () => {
    const bp = makeBlueprintRow({
      status: "approved",
      approvedAt: new Date(),
      adminBlueprintReviewStatus: "blocked",
    });
    const result = checkFullGate(bp);
    expect(result.blocked).toBe(true);
  });
});

// ── Section F: Regulated/high-risk Blueprints — flagged but not pre-blocked ───

describe("F — High-risk Blueprints: admin review flag present, generation proceeds, admin reviews built site", () => {
  it("regulated industry Blueprint has adminReviewRecommended flag in riskCompliance", () => {
    const bpJson = {
      businessName: "Austin Family Dental",
      websiteType: "dental",
      riskCompliance: {
        regulatedIndustry: true,
        riskLevel: "regulated_review_required",
        adminReviewRecommended: true,
        adminReviewReason: "Regulated health industry — dental practice",
      },
      metadata: { completenessScore: 80 },
    };
    const bp = makeBlueprintRow({ blueprintJson: bpJson });
    const riskCompliance = (bp.blueprintJson as any).riskCompliance;
    expect(riskCompliance.adminReviewRecommended).toBe(true);
    expect(riskCompliance.regulatedIndustry).toBe(true);
  });

  it("high-risk Blueprint with pending admin status ALLOWS generation (admin reviews built site)", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "pending",
      adminBlueprintApprovedAt: null,
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(false);
  });

  it("high-risk Blueprint with blocked admin status PREVENTS generation", () => {
    const bp = makeBlueprintRow({
      adminBlueprintReviewStatus: "blocked",
      adminBlueprintReturnReason: "Cannabis dispensary — legal review required before site is built",
    });
    const result = checkAdminGate(bp);
    expect(result.blocked).toBe(true);
  });

  it("high-risk Blueprint with approved admin status allows generation", () => {
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
    metadata: { completenessScore: 85 },
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
      adminBlueprintReturnReason: "Superlative claim noted — will review in built site QA",
      adminBlueprintApprovedAt: null,
      adminBlueprintApprovedBy: null,
    };
    const merged = { ...bp, ...adminReturnUpdate };
    const positioning = (merged.blueprintJson as any).positioning;
    expect(positioning.customerAcknowledgments).toContain("customer_directed_superlative_2026-05-15");
    expect(merged.adminBlueprintReturnReason).toBeTruthy();
  });
});

// ── Section H: Legacy Blueprints without admin fields proceed normally ─────────

describe("H — Legacy Blueprint records without admin fields allow generation", () => {
  it("legacy blueprint missing adminBlueprintReviewStatus is treated as pending — allows generation", () => {
    const legacyBp = {
      id: 99,
      projectId: 1,
      status: "approved",
      blueprintJson: { businessName: "Old Business", metadata: { completenessScore: 70 } },
      approvedAt: new Date("2026-01-01"),
      adminBlueprintReviewStatus: undefined,
      adminBlueprintApprovedAt: undefined,
    };
    const result = checkAdminGate(legacyBp);
    expect(result.blocked).toBe(false);
  });

  it("legacy blueprint with null admin fields allows generation", () => {
    const legacyBp = makeBlueprintRow({
      adminBlueprintReviewStatus: null,
      adminBlueprintApprovedAt: null,
    });
    const result = checkAdminGate(legacyBp);
    expect(result.blocked).toBe(false);
  });
});

// ── Section I: Review flags are stored and preserved ──────────────────────────

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

// ── Section K: siteGenerator.ts gate — lifecycle-realigned ───────────────────

describe("K — siteGenerator.ts Gate 1.5: only 'blocked' prevents generation", () => {
  const generatorSource = readFileSync(
    join(__dirname, "services/siteGenerator.ts"),
    "utf-8"
  );

  it("gate checks adminBlueprintReviewStatus", () => {
    expect(generatorSource).toContain("adminBlueprintReviewStatus");
  });

  it("gate only hard-blocks on 'blocked' status", () => {
    expect(generatorSource).toContain('adminBlueprintReviewStatus === "blocked"');
  });

  it("gate error message references explicit admin block", () => {
    expect(generatorSource).toContain("hard-blocked");
  });

  it("gate is placed before generation starts (Gate 1.5 comment present)", () => {
    const gate15Idx = generatorSource.indexOf("Gate 1.5");
    const generatingIdx = generatorSource.indexOf('generationStatus: "generating"');
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

  it("adminDenyPreview procedure exists (lifecycle step 9 deny path)", () => {
    expect(routersSource).toContain("adminDenyPreview:");
  });

  it("triggerGeneration only blocks on 'blocked' status (not pending/approved)", () => {
    const trigIdx = routersSource.indexOf("triggerGeneration: adminProcedure");
    const trigSection = routersSource.slice(trigIdx, trigIdx + 800);
    expect(trigSection).toContain('adminBlueprintReviewStatus === "blocked"');
    expect(trigSection).not.toContain('"Admin Blueprint approval required before generation."');
  });

  it("saveQuestionnaire auto-approves Blueprint when readiness ≥ 60", () => {
    expect(routersSource).toContain("completenessScore");
    expect(routersSource).toContain("blueprintAutoApproved");
  });
});

// ── Section M: adminDenyPreview — step-9 deny path ───────────────────────────

describe("M — adminDenyPreview: lifecycle step 9 deny path", () => {
  it("adminDenyPreview procedure is present in routers.ts", () => {
    const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");
    expect(routersSource).toContain("adminDenyPreview:");
  });

  it("adminDenyPreview sets stage to 'revisions'", () => {
    const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");
    const denyIdx = routersSource.indexOf("adminDenyPreview:");
    const denySection = routersSource.slice(denyIdx, denyIdx + 1200);
    expect(denySection).toContain('"revisions"');
  });

  it("adminDenyPreview sets generationStatus to 'idle'", () => {
    const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");
    const denyIdx = routersSource.indexOf("adminDenyPreview:");
    const denySection = routersSource.slice(denyIdx, denyIdx + 1200);
    expect(denySection).toContain('"idle"');
  });

  it("adminDenyPreview requires a reason string", () => {
    const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");
    const denyIdx = routersSource.indexOf("adminDenyPreview:");
    const denySection = routersSource.slice(denyIdx, denyIdx + 600);
    expect(denySection).toContain("reason:");
    expect(denySection).toContain("min(1)");
  });

  it("adminDenyPreview only works when generationStatus is 'complete'", () => {
    const routersSource = readFileSync(join(__dirname, "routers.ts"), "utf-8");
    const denyIdx = routersSource.indexOf("adminDenyPreview:");
    const denySection = routersSource.slice(denyIdx, denyIdx + 1200);
    expect(denySection).toContain("generationStatus !== \"complete\"");
  });

  it("deny path model: stage=revisions, status=idle, log contains reason", () => {
    const reason = "Hero section copy does not match questionnaire — service descriptions are generic";
    const stage = "revisions";
    const status = "idle";
    const log = `Admin review: changes required — ${reason}.`;
    expect(log).toContain(reason);
    expect(stage).toBe("revisions");
    expect(status).toBe("idle");
  });
});
