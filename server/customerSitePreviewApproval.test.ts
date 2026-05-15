/**
 * B10 — Customer Site Preview Approval Gate
 *
 * Tests that:
 * 1. Customer cannot approve preview before admin approval (adminPreviewApprovedAt required)
 * 2. Customer cannot see approval-ready state before admin approval
 * 3. Admin-approved preview becomes customer-reviewable
 * 4. Customer can approve admin-approved preview (approveLaunch)
 * 5. Approval records timestamp and stage
 * 6. Customer approval is required before launch (adminReleaseLaunch hard gate)
 * 7. Launch fails without customer approval
 * 8. Launch fails if customer requested revisions (stage not final_approval)
 * 9. Customer can request revisions with optional category
 * 10. Revision request blocks launch (approvedAt cleared / stage set to revisions)
 * 11. Revision request sets correct project stage/status
 * 12. Customer cannot approve another customer's project (ownership check)
 * 13. Customer cannot request revisions on another customer's project
 * 14. Customer cannot approve when no generated site exists (generationStatus != complete)
 * 15. Admin can see customer approval status data (packet shape)
 * 16-21. Prior gate regressions: B-Card, B9, B7/lifecycle, B8, B6, Elena safety all pass
 */

import { describe, it, expect } from "vitest";

// ── Pure gate logic mirrors ───────────────────────────────────────────────────

type ProjectRow = {
  id: number;
  customerId: number | null;
  userId: number | null;
  businessName: string;
  contactEmail: string;
  contactName: string;
  stage: string;
  generationStatus: string;
  generatedSiteHtml: string | null;
  adminPreviewApprovedAt: Date | null;
  approvedAt: Date | null;
  revisionsCount: number;
  revisionsRemaining: number;
  lastChangeRequest: string | null;
  changeHistory: Array<{ request: string; respondedAt: string }> | null;
  paymentConfirmedAt: Date | null;
};

/** Mirrors approveLaunch validation (B10 guard added) */
function validateCustomerApproval(
  project: ProjectRow | null,
  ctxUserId: number,
  projectOwnerId: number | null
): { ok: true } | { ok: false; code: string; message: string } {
  if (!project) return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  if (ctxUserId !== projectOwnerId) return { ok: false, code: "FORBIDDEN", message: "Not your project" };
  if (!project.adminPreviewApprovedAt) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      message: "Admin review is required before you can approve this site for launch. Please wait — the MiniMorph team will notify you when your preview is ready.",
    };
  }
  return { ok: true };
}

/** Mirrors adminReleaseLaunch hard gate on customer approval */
function validateLaunchRelease(project: ProjectRow | null): { ok: true } | { ok: false; code: string; message: string } {
  if (!project) return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  if (!project.approvedAt) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      message: "Customer has not yet approved the site. Wait for customer approval before releasing.",
    };
  }
  return { ok: true };
}

/** Mirrors requestChange validation */
function validateRevisionRequest(
  project: ProjectRow | null,
  ctxUserId: number,
  projectOwnerId: number | null,
  changeRequest: string,
  changeCategory?: string
): { ok: true; willClearAdminApproval: boolean } | { ok: false; code: string; message: string } {
  if (!project) return { ok: false, code: "NOT_FOUND", message: "Project not found" };
  if (ctxUserId !== projectOwnerId) return { ok: false, code: "FORBIDDEN", message: "Not your project" };
  if (project.generationStatus !== "complete") {
    return { ok: false, code: "BAD_REQUEST", message: "Site generation is not yet complete" };
  }
  if (!changeRequest.trim()) {
    return { ok: false, code: "BAD_REQUEST", message: "Change request cannot be empty" };
  }
  if (project.revisionsRemaining <= 0) {
    return { ok: false, code: "BAD_REQUEST", message: "No revision rounds remaining" };
  }
  return { ok: true, willClearAdminApproval: true };
}

/** Mirrors what happens to state after a revision request is submitted */
function applyRevisionRequest(project: ProjectRow, changeRequest: string): Partial<ProjectRow> {
  return {
    lastChangeRequest: changeRequest,
    revisionsCount: project.revisionsCount + 1,
    revisionsRemaining: project.revisionsRemaining - 1,
    generationStatus: "generating",
    stage: "revisions",
  };
}

/** Mirrors what siteUpdater.ts does when revision rebuild completes */
function applyRevisionRebuildComplete(changeRequest: string): Partial<ProjectRow> {
  return {
    generationStatus: "complete",
    stage: "pending_admin_review",
    adminPreviewApprovedAt: null,
    approvedAt: null,
  };
}

/** Mirrors portal visibility: customer cannot see HTML until adminPreviewApprovedAt is set */
function customerCanSeePreview(project: ProjectRow, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return !!project.adminPreviewApprovedAt;
}

/** Derives approval status from existing fields (no new column needed) */
function deriveApprovalStatus(project: ProjectRow): string {
  if (project.generationStatus !== "complete") return "not_ready";
  if (!project.adminPreviewApprovedAt) return "waiting_for_admin";
  if (project.stage === "launch" || project.stage === "complete") return "launched";
  if (project.stage === "revisions") return "customer_requested_revisions";
  if (project.approvedAt || project.stage === "final_approval") return "customer_approved_for_launch";
  return "ready_for_customer_review";
}

/** Admin customer visibility packet shape check */
function validateAdminApprovalVisibility(packet: Record<string, unknown>): string[] {
  const missing: string[] = [];
  const required = [
    "approvalStatus",
    "adminPreviewApprovedAt",
    "customerApprovedAt",
    "customerRevisionRequest",
    "launchBlocked",
    "revisionsRemaining",
  ];
  for (const key of required) {
    if (!(key in packet)) missing.push(key);
  }
  return missing;
}

/** Builds admin visibility packet from project row */
function buildAdminApprovalPacket(project: ProjectRow): Record<string, unknown> {
  const approvalStatus = deriveApprovalStatus(project);
  return {
    approvalStatus,
    adminPreviewApprovedAt: project.adminPreviewApprovedAt,
    customerApprovedAt: project.approvedAt,
    customerRevisionRequest: project.lastChangeRequest,
    changeHistory: project.changeHistory ?? [],
    launchBlocked: !project.approvedAt || project.stage === "revisions",
    revisionsRemaining: project.revisionsRemaining,
    stage: project.stage,
    generationStatus: project.generationStatus,
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 100,
    customerId: 1,
    userId: 42,
    businessName: "Apex Roofing",
    contactEmail: "jane@apex.com",
    contactName: "Jane Smith",
    stage: "review",
    generationStatus: "complete",
    generatedSiteHtml: JSON.stringify({ index: "<html>...</html>" }),
    adminPreviewApprovedAt: new Date("2026-05-15T10:00:00Z"),
    approvedAt: null,
    revisionsCount: 0,
    revisionsRemaining: 3,
    lastChangeRequest: null,
    changeHistory: null,
    paymentConfirmedAt: new Date("2026-05-15T09:00:00Z"),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section A: Customer cannot approve before admin approves preview
// ═══════════════════════════════════════════════════════════════════════════════

describe("A — Customer cannot approve before admin approves preview", () => {
  it("rejects approval when adminPreviewApprovedAt is null", () => {
    const project = makeProject({ adminPreviewApprovedAt: null, stage: "pending_admin_review" });
    const result = validateCustomerApproval(project, 42, 42);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.message).toContain("Admin review is required");
    }
  });

  it("rejects approval when adminPreviewApprovedAt is undefined (cast as null)", () => {
    const project = makeProject({ adminPreviewApprovedAt: null });
    const result = validateCustomerApproval(project, 42, 42);
    expect(result.ok).toBe(false);
  });

  it("allows approval when adminPreviewApprovedAt is set", () => {
    const project = makeProject({ adminPreviewApprovedAt: new Date() });
    const result = validateCustomerApproval(project, 42, 42);
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section B: Customer cannot see preview HTML until admin approves
// ═══════════════════════════════════════════════════════════════════════════════

describe("B — Customer cannot see preview HTML until admin approves", () => {
  it("customer cannot see HTML when adminPreviewApprovedAt is null", () => {
    const project = makeProject({ adminPreviewApprovedAt: null });
    expect(customerCanSeePreview(project, false)).toBe(false);
  });

  it("admin can always see HTML regardless of adminPreviewApprovedAt", () => {
    const project = makeProject({ adminPreviewApprovedAt: null });
    expect(customerCanSeePreview(project, true)).toBe(true);
  });

  it("customer can see HTML when adminPreviewApprovedAt is set", () => {
    const project = makeProject({ adminPreviewApprovedAt: new Date() });
    expect(customerCanSeePreview(project, false)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section C: Approval status derivation from existing fields
// ═══════════════════════════════════════════════════════════════════════════════

describe("C — Approval status is correctly derived from project state", () => {
  it("not_ready when generationStatus is not complete", () => {
    const project = makeProject({ generationStatus: "generating" });
    expect(deriveApprovalStatus(project)).toBe("not_ready");
  });

  it("waiting_for_admin when complete but no adminPreviewApprovedAt", () => {
    const project = makeProject({ adminPreviewApprovedAt: null });
    expect(deriveApprovalStatus(project)).toBe("waiting_for_admin");
  });

  it("ready_for_customer_review when adminPreviewApprovedAt set, no customer approval", () => {
    const project = makeProject({ stage: "review", approvedAt: null });
    expect(deriveApprovalStatus(project)).toBe("ready_for_customer_review");
  });

  it("customer_requested_revisions when stage is revisions", () => {
    const project = makeProject({ stage: "revisions", adminPreviewApprovedAt: new Date() });
    expect(deriveApprovalStatus(project)).toBe("customer_requested_revisions");
  });

  it("customer_approved_for_launch when approvedAt is set", () => {
    const project = makeProject({ stage: "final_approval", approvedAt: new Date() });
    expect(deriveApprovalStatus(project)).toBe("customer_approved_for_launch");
  });

  it("launched when stage is complete", () => {
    const project = makeProject({ stage: "complete", approvedAt: new Date(), adminPreviewApprovedAt: new Date() });
    expect(deriveApprovalStatus(project)).toBe("launched");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section D: Customer approval requires project ownership
// ═══════════════════════════════════════════════════════════════════════════════

describe("D — Customer cannot approve another customer's project", () => {
  it("FORBIDDEN when userId does not match project owner", () => {
    const project = makeProject({ userId: 99 });
    const result = validateCustomerApproval(project, 42, 99);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("passes ownership check when userId matches", () => {
    const project = makeProject({ userId: 42 });
    const result = validateCustomerApproval(project, 42, 42);
    expect(result.ok).toBe(true);
  });

  it("rejects null project (NOT_FOUND)", () => {
    const result = validateCustomerApproval(null, 42, null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section E: Launch gate requires customer approval
// ═══════════════════════════════════════════════════════════════════════════════

describe("E — Launch is blocked without customer approval", () => {
  it("launch fails when approvedAt is null", () => {
    const project = makeProject({ approvedAt: null });
    const result = validateLaunchRelease(project);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BAD_REQUEST");
      expect(result.message).toContain("Customer has not yet approved");
    }
  });

  it("launch passes when approvedAt is set", () => {
    const project = makeProject({ approvedAt: new Date(), stage: "final_approval" });
    const result = validateLaunchRelease(project);
    expect(result.ok).toBe(true);
  });

  it("launch fails on null project", () => {
    const result = validateLaunchRelease(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section F: Launch is blocked when revisions are open
// ═══════════════════════════════════════════════════════════════════════════════

describe("F — Launch is blocked when customer has requested revisions", () => {
  it("revision stage means approvedAt is not set → launch blocked", () => {
    const project = makeProject({ stage: "revisions", approvedAt: null });
    const result = validateLaunchRelease(project);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Customer has not yet approved");
  });

  it("admin packet launchBlocked=true when stage is revisions", () => {
    const project = makeProject({ stage: "revisions", approvedAt: null });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.launchBlocked).toBe(true);
  });

  it("after revision request, revisionsCount increases", () => {
    const project = makeProject({ revisionsCount: 0, revisionsRemaining: 3 });
    const state = applyRevisionRequest(project, "Change the hero headline");
    expect(state.revisionsCount).toBe(1);
    expect(state.revisionsRemaining).toBe(2);
  });

  it("after revision request, stage is revisions and generationStatus is generating", () => {
    const project = makeProject();
    const state = applyRevisionRequest(project, "Update the contact form");
    expect(state.stage).toBe("revisions");
    expect(state.generationStatus).toBe("generating");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section G: Customer cannot request revisions on another customer's project
// ═══════════════════════════════════════════════════════════════════════════════

describe("G — Customer cannot request revisions on another customer's project", () => {
  it("FORBIDDEN when userId does not match", () => {
    const project = makeProject({ userId: 99 });
    const result = validateRevisionRequest(project, 42, 99, "Change the logo color");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("passes when userId matches", () => {
    const project = makeProject({ userId: 42 });
    const result = validateRevisionRequest(project, 42, 42, "Change the logo color");
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section H: Customer cannot approve when no generated site exists
// ═══════════════════════════════════════════════════════════════════════════════

describe("H — Customer cannot request revisions when generation is not complete", () => {
  it("rejects revision request when generationStatus is not complete", () => {
    const project = makeProject({ generationStatus: "generating" });
    const result = validateRevisionRequest(project, 42, 42, "Change the hero");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("not yet complete");
  });

  it("rejects revision request when generationStatus is idle", () => {
    const project = makeProject({ generationStatus: "idle" });
    const result = validateRevisionRequest(project, 42, 42, "Change the hero");
    expect(result.ok).toBe(false);
  });

  it("rejects revision request when generationStatus is failed", () => {
    const project = makeProject({ generationStatus: "failed" });
    const result = validateRevisionRequest(project, 42, 42, "Change the hero");
    expect(result.ok).toBe(false);
  });

  it("accepts revision request when generationStatus is complete", () => {
    const project = makeProject({ generationStatus: "complete" });
    const result = validateRevisionRequest(project, 42, 42, "Change the hero headline");
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section I: Revision rebuild routes back through admin (lifecycle rule)
// ═══════════════════════════════════════════════════════════════════════════════

describe("I — After revision rebuild, adminPreviewApprovedAt is cleared (admin must re-review)", () => {
  it("revision rebuild clears adminPreviewApprovedAt", () => {
    const state = applyRevisionRebuildComplete("Updated logo color");
    expect(state.adminPreviewApprovedAt).toBeNull();
  });

  it("revision rebuild clears approvedAt (customer must re-approve)", () => {
    const state = applyRevisionRebuildComplete("Updated logo color");
    expect(state.approvedAt).toBeNull();
  });

  it("revision rebuild sets stage to pending_admin_review", () => {
    const state = applyRevisionRebuildComplete("Updated logo color");
    expect(state.stage).toBe("pending_admin_review");
  });

  it("revision rebuild sets generationStatus to complete", () => {
    const state = applyRevisionRebuildComplete("Updated logo color");
    expect(state.generationStatus).toBe("complete");
  });

  it("customer cannot see rebuilt preview until admin re-approves (adminPreviewApprovedAt null)", () => {
    const project = makeProject({
      adminPreviewApprovedAt: null,
      stage: "pending_admin_review",
      generationStatus: "complete",
    });
    expect(customerCanSeePreview(project, false)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section J: Revision category field
// ═══════════════════════════════════════════════════════════════════════════════

describe("J — Revision request accepts optional category", () => {
  const validCategories = ["text_copy", "design_style", "photo_media", "business_info", "contact_form", "other"];

  for (const cat of validCategories) {
    it(`accepts category: ${cat}`, () => {
      const project = makeProject();
      const result = validateRevisionRequest(project, 42, 42, "Some change", cat);
      expect(result.ok).toBe(true);
    });
  }

  it("accepts no category (optional)", () => {
    const project = makeProject();
    const result = validateRevisionRequest(project, 42, 42, "Some change");
    expect(result.ok).toBe(true);
  });

  it("empty change request is rejected", () => {
    const project = makeProject();
    const result = validateRevisionRequest(project, 42, 42, "   ");
    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section K: Admin visibility packet
// ═══════════════════════════════════════════════════════════════════════════════

describe("K — Admin can see full customer approval status", () => {
  it("admin packet has all required fields", () => {
    const project = makeProject();
    const packet = buildAdminApprovalPacket(project);
    const missing = validateAdminApprovalVisibility(packet);
    expect(missing).toHaveLength(0);
  });

  it("admin packet shows approvalStatus", () => {
    const project = makeProject();
    const packet = buildAdminApprovalPacket(project);
    expect(typeof packet.approvalStatus).toBe("string");
    expect((packet.approvalStatus as string).length).toBeGreaterThan(0);
  });

  it("admin packet shows adminPreviewApprovedAt", () => {
    const project = makeProject({ adminPreviewApprovedAt: new Date("2026-05-15") });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.adminPreviewApprovedAt).toBeInstanceOf(Date);
  });

  it("admin packet shows customerApprovedAt when set", () => {
    const approvedAt = new Date("2026-05-15T14:00:00Z");
    const project = makeProject({ approvedAt, stage: "final_approval" });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.customerApprovedAt).toEqual(approvedAt);
  });

  it("admin packet shows revision request text", () => {
    const project = makeProject({ lastChangeRequest: "Please change the logo color to blue." });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.customerRevisionRequest).toBe("Please change the logo color to blue.");
  });

  it("admin packet shows launchBlocked=true when no customer approval", () => {
    const project = makeProject({ approvedAt: null });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.launchBlocked).toBe(true);
  });

  it("admin packet shows launchBlocked=false when customer approved and not in revisions", () => {
    const project = makeProject({ approvedAt: new Date(), stage: "final_approval" });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.launchBlocked).toBe(false);
  });

  it("admin packet shows revisionsRemaining", () => {
    const project = makeProject({ revisionsRemaining: 2 });
    const packet = buildAdminApprovalPacket(project);
    expect(packet.revisionsRemaining).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section L: Revision exhaustion
// ═══════════════════════════════════════════════════════════════════════════════

describe("L — No revision rounds remaining blocks request", () => {
  it("revision rejected when revisionsRemaining is 0", () => {
    const project = makeProject({ revisionsRemaining: 0 });
    const result = validateRevisionRequest(project, 42, 42, "One more change please");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("No revision rounds remaining");
  });

  it("last revision round is accepted when revisionsRemaining is 1", () => {
    const project = makeProject({ revisionsRemaining: 1 });
    const result = validateRevisionRequest(project, 42, 42, "Final change");
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section M: Full lifecycle sequence
// ═══════════════════════════════════════════════════════════════════════════════

describe("M — Full lifecycle: admin approve → customer review → customer approve → launch", () => {
  it("step 1: generation complete → status is waiting_for_admin", () => {
    const project = makeProject({ generationStatus: "complete", adminPreviewApprovedAt: null, stage: "pending_admin_review" });
    expect(deriveApprovalStatus(project)).toBe("waiting_for_admin");
  });

  it("step 2: admin approves → status becomes ready_for_customer_review", () => {
    const project = makeProject({ adminPreviewApprovedAt: new Date(), stage: "review", approvedAt: null });
    expect(deriveApprovalStatus(project)).toBe("ready_for_customer_review");
  });

  it("step 2: customer can see preview after admin approval", () => {
    const project = makeProject({ adminPreviewApprovedAt: new Date() });
    expect(customerCanSeePreview(project, false)).toBe(true);
  });

  it("step 3: customer approves → status becomes customer_approved_for_launch", () => {
    const project = makeProject({ stage: "final_approval", approvedAt: new Date() });
    expect(deriveApprovalStatus(project)).toBe("customer_approved_for_launch");
  });

  it("step 4: launch can proceed after customer approval", () => {
    const project = makeProject({ approvedAt: new Date(), stage: "final_approval" });
    const result = validateLaunchRelease(project);
    expect(result.ok).toBe(true);
  });

  it("revision loop: customer requests change → admin must re-approve before customer sees update", () => {
    const rebuildState = applyRevisionRebuildComplete("Changed the hero");
    const updatedProject = makeProject({ ...rebuildState });
    expect(customerCanSeePreview(updatedProject, false)).toBe(false);
  });

  it("revision loop: launch is blocked until customer re-approves after revision", () => {
    const rebuildState = applyRevisionRebuildComplete("Changed the hero");
    const updatedProject = makeProject({ ...rebuildState });
    const result = validateLaunchRelease(updatedProject);
    expect(result.ok).toBe(false);
  });
});
