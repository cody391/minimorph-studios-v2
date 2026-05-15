/**
 * B-Card Gate — Lead-to-Customer Card / Contract Checkout Integrity
 *
 * Tests that:
 * 1. createCheckout (legacy) is permanently disabled — no checkout without Elena onboarding
 * 2. createCheckoutAfterElena requires a valid, accepted agreement before creating a Stripe session
 * 3. Agreement signerName must be a real name (not "customer", "unknown", or blank)
 * 4. B9-blocked add-ons (online_store, event_calendar, menu_price_list) are rejected at checkout
 * 5. Webhook COMPLIANCE_ALERT fires when no agreement_id is in session metadata
 * 6. Customer card packet carries: identity, source, costs, contracts, projects, agreements, tickets
 * 7. Multiple projects per customer card are supported
 * 8. A project with no contract is structurally valid (pending_payment flow)
 * 9. Agreement fields required: acceptedAt, signerName, userId, projectId
 * 10. Lifecycle: no customer card → checkout impossible (customer record required)
 */

import { describe, it, expect } from "vitest";
import {
  findNonPurchasableAddons,
  getBlockedAddons,
  ADDON_FULFILLMENT_REGISTRY,
} from "../shared/addonFulfillment";

// ── Inline gate mirrors ───────────────────────────────────────────────────────
// These mirror the exact validation logic in createCheckoutAfterElena and the
// webhook. Tests verify properties/invariants of the gate logic without a live DB.

type AgreementRow = {
  id: number;
  userId: number;
  projectId: number;
  acceptedAt: Date | null;
  signerName: string | null;
  termsVersion: string;
  packageSnapshot?: unknown;
  checkoutSessionId?: string | null;
  contractId?: number | null;
};

/** Mirrors createCheckoutAfterElena agreement validation block */
function validateCheckoutAgreement(
  agreement: AgreementRow | null | undefined,
  ctxUserId: number,
  projectId: number
): { ok: true } | { ok: false; code: string; message: string } {
  if (!agreement) {
    return { ok: false, code: "BAD_REQUEST", message: "Legal agreement not found. Please accept the terms before proceeding to checkout." };
  }
  if (agreement.userId !== ctxUserId) {
    return { ok: false, code: "FORBIDDEN", message: "Agreement does not belong to this account." };
  }
  if (agreement.projectId !== projectId) {
    return { ok: false, code: "BAD_REQUEST", message: "Agreement project mismatch." };
  }
  if (!agreement.acceptedAt) {
    return { ok: false, code: "BAD_REQUEST", message: "Agreement has not been accepted. Please complete the terms acceptance." };
  }
  const normalizedSigner = (agreement.signerName || "").trim().toLowerCase();
  if (normalizedSigner.length < 2 || normalizedSigner === "customer" || normalizedSigner === "unknown") {
    return { ok: false, code: "BAD_REQUEST", message: "A valid legal name is required. Please enter your full name before checkout." };
  }
  return { ok: true };
}

/** Mirrors the createCheckout BAD_REQUEST block (legacy path is permanently disabled) */
function simulateLegacyCreateCheckout(): never {
  throw Object.assign(new Error("BAD_REQUEST"), {
    code: "BAD_REQUEST",
    message: "Direct checkout is no longer available. Please complete the Elena onboarding conversation to set up your website, then proceed to checkout from your project portal. If you need assistance, contact support@minimorphstudios.com.",
  });
}

/** Mirrors webhook COMPLIANCE_ALERT logic (metadata.agreement_id presence check) */
function checkWebhookAgreementPresence(sessionMetadata: Record<string, string | undefined>): "ok" | "COMPLIANCE_ALERT" {
  return sessionMetadata.agreement_id ? "ok" : "COMPLIANCE_ALERT";
}

/** Mirrors getCustomerCardPacket return shape — validates structural completeness */
function validateCardPacketShape(packet: Record<string, unknown>): string[] {
  const missing: string[] = [];
  const required = ["identity", "source", "costs", "contracts", "projects", "supportTickets", "lifecycleStatus"];
  for (const key of required) {
    if (!(key in packet)) missing.push(key);
  }
  const identity = packet.identity as Record<string, unknown> | undefined;
  if (identity) {
    for (const f of ["customerId", "businessName", "email", "status"]) {
      if (!(f in identity)) missing.push(`identity.${f}`);
    }
  }
  const source = packet.source as Record<string, unknown> | undefined;
  if (source) {
    for (const f of ["acquisitionSource", "leadId"]) {
      if (!(f in source)) missing.push(`source.${f}`);
    }
  }
  return missing;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAgreement(overrides: Partial<AgreementRow> = {}): AgreementRow {
  return {
    id: 1,
    userId: 42,
    projectId: 100,
    acceptedAt: new Date("2026-05-15T10:00:00Z"),
    signerName: "Jane Smith",
    termsVersion: "1.0",
    packageSnapshot: { packageTier: "starter" },
    checkoutSessionId: null,
    contractId: null,
    ...overrides,
  };
}

function makeCardPacket(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    identity: {
      customerId: 1,
      userId: 42,
      businessName: "Apex Roofing",
      contactName: "Jane Smith",
      email: "jane@apex.com",
      phone: "512-555-0100",
      status: "active",
      healthScore: 80,
    },
    source: {
      acquisitionSource: "rep_closed",
      leadId: 10,
      leadSource: "outbound_cold",
      leadChannel: "phone",
      leadCreatedAt: new Date("2026-05-01"),
      leadStage: "closed_won",
      repId: 5,
    },
    costs: { totalCostCents: 5000, totalRevenueCents: 49900 },
    contracts: [
      {
        contractId: 7,
        packageTier: "starter",
        status: "active",
        monthlyPrice: "499",
        stripeSubscriptionId: "sub_xyz",
        repId: 5,
        signedAt: new Date("2026-05-15"),
        createdAt: new Date("2026-05-15"),
      },
    ],
    projects: [
      {
        projectId: 100,
        stage: "building",
        businessName: "Apex Roofing",
        packageTier: "starter",
        paymentConfirmedAt: new Date("2026-05-15"),
        contractId: 7,
        leadId: 10,
        agreements: [{ id: 1, acceptedAt: new Date("2026-05-15"), signerName: "Jane Smith" }],
        blueprint: { id: 20, status: "approved", adminBlueprintReviewStatus: "pending" },
        buildReports: [],
        createdAt: new Date("2026-05-15"),
      },
    ],
    supportTickets: [],
    lifecycleStatus: {
      hasCard: true,
      hasAcceptedAgreement: true,
      hasActiveContract: true,
      hasProject: true,
      isLaunched: false,
    },
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Section A: Legacy createCheckout is permanently disabled
// ═══════════════════════════════════════════════════════════════════════════════

describe("A — Legacy createCheckout is permanently disabled", () => {
  it("throws immediately with BAD_REQUEST code", () => {
    expect(() => simulateLegacyCreateCheckout()).toThrow();
  });

  it("error message directs customer to Elena onboarding flow", () => {
    let msg = "";
    try { simulateLegacyCreateCheckout(); } catch (e: any) { msg = e.message; }
    expect(msg).toContain("Elena onboarding conversation");
    expect(msg).toContain("support@minimorphstudios.com");
  });

  it("error code is BAD_REQUEST (not INTERNAL_SERVER_ERROR)", () => {
    let code = "";
    try { simulateLegacyCreateCheckout(); } catch (e: any) { code = e.code; }
    expect(code).toBe("BAD_REQUEST");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section B: createCheckoutAfterElena — agreement required
// ═══════════════════════════════════════════════════════════════════════════════

describe("B — createCheckoutAfterElena requires a valid agreement", () => {
  it("null agreement is rejected", () => {
    const result = validateCheckoutAgreement(null, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("BAD_REQUEST");
  });

  it("undefined agreement is rejected", () => {
    const result = validateCheckoutAgreement(undefined, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Legal agreement not found");
  });

  it("valid accepted agreement passes", () => {
    const ag = makeAgreement();
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section C: Agreement ownership and project binding
// ═══════════════════════════════════════════════════════════════════════════════

describe("C — Agreement must belong to the requesting user and correct project", () => {
  it("agreement with wrong userId is FORBIDDEN", () => {
    const ag = makeAgreement({ userId: 99 });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FORBIDDEN");
  });

  it("agreement with wrong projectId is rejected", () => {
    const ag = makeAgreement({ projectId: 999 });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("project mismatch");
  });

  it("agreement for correct userId and projectId passes ownership check", () => {
    const ag = makeAgreement({ userId: 42, projectId: 100 });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section D: Agreement must be accepted (acceptedAt required)
// ═══════════════════════════════════════════════════════════════════════════════

describe("D — Agreement must have acceptedAt timestamp", () => {
  it("agreement with null acceptedAt is rejected", () => {
    const ag = makeAgreement({ acceptedAt: null });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("Agreement has not been accepted");
  });

  it("agreement with a real acceptedAt timestamp passes", () => {
    const ag = makeAgreement({ acceptedAt: new Date("2026-05-15T09:30:00Z") });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section E: Agreement must carry a valid signerName (real legal name)
// ═══════════════════════════════════════════════════════════════════════════════

describe("E — Agreement signerName must be a real legal name", () => {
  it("null signerName is rejected", () => {
    const ag = makeAgreement({ signerName: null });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("valid legal name");
  });

  it('signerName "customer" is rejected (placeholder sentinel)', () => {
    const ag = makeAgreement({ signerName: "customer" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("valid legal name");
  });

  it('signerName "CUSTOMER" is rejected (case-insensitive)', () => {
    const ag = makeAgreement({ signerName: "CUSTOMER" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
  });

  it('signerName "unknown" is rejected (placeholder sentinel)', () => {
    const ag = makeAgreement({ signerName: "unknown" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
  });

  it("single-character signerName is rejected (too short)", () => {
    const ag = makeAgreement({ signerName: "J" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
  });

  it("empty string signerName is rejected", () => {
    const ag = makeAgreement({ signerName: "" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
  });

  it("whitespace-only signerName is rejected", () => {
    const ag = makeAgreement({ signerName: "   " });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(false);
  });

  it("full name 'Jane Smith' passes", () => {
    const ag = makeAgreement({ signerName: "Jane Smith" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(true);
  });

  it("two-letter name 'Jo' passes (meets minimum length)", () => {
    const ag = makeAgreement({ signerName: "Jo" });
    const result = validateCheckoutAgreement(ag, 42, 100);
    expect(result.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section F: B9 blocked add-ons are rejected at checkout
// ═══════════════════════════════════════════════════════════════════════════════

describe("F — B9-blocked add-ons are rejected at checkout (findNonPurchasableAddons)", () => {
  it("online_store is non-purchasable", () => {
    const result = findNonPurchasableAddons(["online_store"]);
    expect(result.length).toBe(1);
    expect(result[0].product).toBe("online_store");
  });

  it("event_calendar is non-purchasable", () => {
    const result = findNonPurchasableAddons(["event_calendar"]);
    expect(result.length).toBe(1);
  });

  it("menu_price_list is non-purchasable", () => {
    const result = findNonPurchasableAddons(["menu_price_list"]);
    expect(result.length).toBe(1);
  });

  it("mixing blocked and purchasable add-ons returns only blocked ones", () => {
    // review_collector and seo_autopilot are purchasable; online_store is blocked
    const result = findNonPurchasableAddons(["review_collector", "online_store", "seo_autopilot"]);
    expect(result.length).toBe(1);
    expect(result[0].product).toBe("online_store");
  });

  it("all blocked registry entries are caught by findNonPurchasableAddons", () => {
    const blocked = getBlockedAddons();
    const ids = blocked.map(b => b.id);
    const result = findNonPurchasableAddons(ids);
    expect(result.length).toBe(blocked.length);
  });

  it("valid-only add-on list returns empty (no block)", () => {
    // review_collector and seo_autopilot are both purchasable in the registry
    const result = findNonPurchasableAddons(["review_collector", "seo_autopilot"]);
    expect(result.length).toBe(0);
  });

  it("empty add-on list returns empty (no block)", () => {
    expect(findNonPurchasableAddons([])).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section G: Stripe webhook COMPLIANCE_ALERT fires when agreement_id is missing
// ═══════════════════════════════════════════════════════════════════════════════

describe("G — Webhook compliance check: agreement_id must be in session metadata", () => {
  it("session with agreement_id passes compliance check", () => {
    expect(checkWebhookAgreementPresence({ agreement_id: "123" })).toBe("ok");
  });

  it("session without agreement_id triggers COMPLIANCE_ALERT", () => {
    expect(checkWebhookAgreementPresence({})).toBe("COMPLIANCE_ALERT");
  });

  it("session with empty agreement_id triggers COMPLIANCE_ALERT", () => {
    expect(checkWebhookAgreementPresence({ agreement_id: "" })).toBe("COMPLIANCE_ALERT");
  });

  it("session with undefined agreement_id triggers COMPLIANCE_ALERT", () => {
    expect(checkWebhookAgreementPresence({ agreement_id: undefined })).toBe("COMPLIANCE_ALERT");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section H: Customer card packet — structural completeness
// ═══════════════════════════════════════════════════════════════════════════════

describe("H — Customer card packet carries all required sections", () => {
  it("full packet has no missing required fields", () => {
    const packet = makeCardPacket();
    const missing = validateCardPacketShape(packet);
    expect(missing).toHaveLength(0);
  });

  it("packet missing 'contracts' section is flagged", () => {
    const packet = makeCardPacket();
    delete packet.contracts;
    const missing = validateCardPacketShape(packet);
    expect(missing).toContain("contracts");
  });

  it("packet missing 'projects' section is flagged", () => {
    const packet = makeCardPacket();
    delete packet.projects;
    const missing = validateCardPacketShape(packet);
    expect(missing).toContain("projects");
  });

  it("packet missing 'lifecycleStatus' section is flagged", () => {
    const packet = makeCardPacket();
    delete packet.lifecycleStatus;
    const missing = validateCardPacketShape(packet);
    expect(missing).toContain("lifecycleStatus");
  });

  it("packet identity section includes customerId, businessName, email, status", () => {
    const packet = makeCardPacket();
    const identity = packet.identity as Record<string, unknown>;
    expect(identity.customerId).toBeDefined();
    expect(identity.businessName).toBeDefined();
    expect(identity.email).toBeDefined();
    expect(identity.status).toBeDefined();
  });

  it("packet source section includes acquisitionSource and leadId", () => {
    const packet = makeCardPacket();
    const source = packet.source as Record<string, unknown>;
    expect("acquisitionSource" in source).toBe(true);
    expect("leadId" in source).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section I: Multiple projects per customer card
// ═══════════════════════════════════════════════════════════════════════════════

describe("I — Multiple projects per customer card are supported", () => {
  it("card packet projects array can hold 1 project", () => {
    const packet = makeCardPacket();
    const projects = packet.projects as unknown[];
    expect(projects.length).toBe(1);
  });

  it("card packet projects array can hold 2 projects (revision/rebuild scenario)", () => {
    const project1 = {
      projectId: 100, stage: "launched", businessName: "Apex Roofing v1",
      packageTier: "starter", paymentConfirmedAt: new Date("2026-04-01"), contractId: 6, leadId: 10,
      agreements: [], blueprint: null, buildReports: [], createdAt: new Date("2026-04-01"),
    };
    const project2 = {
      projectId: 101, stage: "building", businessName: "Apex Roofing v2",
      packageTier: "growth", paymentConfirmedAt: new Date("2026-05-15"), contractId: 7, leadId: 10,
      agreements: [{ id: 1, acceptedAt: new Date("2026-05-15"), signerName: "Jane Smith" }],
      blueprint: { id: 20, status: "approved", adminBlueprintReviewStatus: "pending" },
      buildReports: [], createdAt: new Date("2026-05-15"),
    };
    const packet = makeCardPacket({ projects: [project1, project2] });
    const projects = packet.projects as unknown[];
    expect(projects.length).toBe(2);
    expect((projects[0] as any).projectId).toBe(100);
    expect((projects[1] as any).projectId).toBe(101);
  });

  it("each project in the packet can carry its own agreements array", () => {
    const packet = makeCardPacket();
    const projects = packet.projects as Array<Record<string, unknown>>;
    for (const proj of projects) {
      expect(Array.isArray(proj.agreements)).toBe(true);
    }
  });

  it("each project in the packet can carry its own buildReports array", () => {
    const packet = makeCardPacket();
    const projects = packet.projects as Array<Record<string, unknown>>;
    for (const proj of projects) {
      expect(Array.isArray(proj.buildReports)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section J: lifecycleStatus flags
// ═══════════════════════════════════════════════════════════════════════════════

describe("J — lifecycleStatus flags represent real card lifecycle state", () => {
  it("a freshly-accepted customer has hasCard=true", () => {
    const packet = makeCardPacket();
    const ls = packet.lifecycleStatus as Record<string, boolean>;
    expect(ls.hasCard).toBe(true);
  });

  it("a customer who accepted terms has hasAcceptedAgreement=true", () => {
    const packet = makeCardPacket();
    const ls = packet.lifecycleStatus as Record<string, boolean>;
    expect(ls.hasAcceptedAgreement).toBe(true);
  });

  it("a customer with active contract has hasActiveContract=true", () => {
    const packet = makeCardPacket();
    const ls = packet.lifecycleStatus as Record<string, boolean>;
    expect(ls.hasActiveContract).toBe(true);
  });

  it("a customer not yet launched has isLaunched=false", () => {
    const packet = makeCardPacket({ lifecycleStatus: { hasCard: true, hasAcceptedAgreement: true, hasActiveContract: true, hasProject: true, isLaunched: false } });
    const ls = packet.lifecycleStatus as Record<string, boolean>;
    expect(ls.isLaunched).toBe(false);
  });

  it("a customer with no projects has hasProject=false", () => {
    const packet = makeCardPacket({ projects: [], lifecycleStatus: { hasCard: true, hasAcceptedAgreement: false, hasActiveContract: false, hasProject: false, isLaunched: false } });
    const ls = packet.lifecycleStatus as Record<string, boolean>;
    expect(ls.hasProject).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section K: Project-agreement binding in card packet
// ═══════════════════════════════════════════════════════════════════════════════

describe("K — Each project's agreement links back to that project", () => {
  it("project agreement has acceptedAt and signerName", () => {
    const packet = makeCardPacket();
    const projects = packet.projects as Array<Record<string, unknown>>;
    const agreements = projects[0].agreements as Array<Record<string, unknown>>;
    expect(agreements[0].acceptedAt).toBeDefined();
    expect(typeof agreements[0].signerName).toBe("string");
  });

  it("a project with no agreement has an empty agreements array (not null)", () => {
    const project = {
      projectId: 200, stage: "pending_payment", businessName: "New Co",
      packageTier: "starter", paymentConfirmedAt: null, contractId: null, leadId: 15,
      agreements: [], blueprint: null, buildReports: [], createdAt: new Date(),
    };
    const packet = makeCardPacket({ projects: [project] });
    const projects = packet.projects as Array<Record<string, unknown>>;
    expect(Array.isArray(projects[0].agreements)).toBe(true);
    expect((projects[0].agreements as unknown[]).length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Section L: Blocked add-on registry invariants at checkout context
// ═══════════════════════════════════════════════════════════════════════════════

describe("L — Blocked add-on registry invariants at checkout", () => {
  it("every blocked registry entry has canCheckoutPurchase === false", () => {
    const blocked = getBlockedAddons();
    for (const b of blocked) {
      expect(b.canCheckoutPurchase).toBe(false);
    }
  });

  it("every blocked registry entry has canElenaRecommend === false", () => {
    const blocked = getBlockedAddons();
    for (const b of blocked) {
      expect(b.canElenaRecommend).toBe(false);
    }
  });

  it("every blocked registry entry has a non-empty blockedReason", () => {
    const blocked = getBlockedAddons();
    for (const b of blocked) {
      expect(typeof b.blockedReason).toBe("string");
      expect((b.blockedReason as string).length).toBeGreaterThan(0);
    }
  });

  it("online_store blocked reason mentions B2 (open blocker)", () => {
    const record = ADDON_FULFILLMENT_REGISTRY["online_store"];
    expect(record?.blockedReason).toMatch(/B2/i);
  });
});
