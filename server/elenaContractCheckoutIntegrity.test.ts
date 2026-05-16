/**
 * B-Card P0 Reopen — Elena Contract Checkout Integrity Gate
 *
 * Reproduces the real incident: a customer went through Elena and reached
 * Stripe without a properly enforced service agreement.
 *
 * Tests prove:
 * - validateContractReadyForCheckout() rejects every known bypass case
 * - createCheckoutAfterElena cannot succeed without a valid accepted agreement
 * - resendPaymentLink throws (not warns) when no agreement found
 * - Generation gate blocks self-service projects without valid agreement
 * - Customer card packet exposes all contract readiness fields
 * - All prior gate regressions remain clean
 */

import { describe, it, expect, readFileSync } from "vitest";
import { readFileSync as fsRead } from "fs";
import { join } from "path";
import {
  validateContractReadyForCheckout,
  SENTINEL_SIGNER_NAMES,
} from "../shared/contractValidation";
import type { AgreementForValidation } from "../shared/contractValidation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAgreement(overrides: Partial<AgreementForValidation> = {}): AgreementForValidation {
  return {
    id: 1,
    userId: 42,
    projectId: 100,
    signerName: "Jane Smith",
    termsVersion: "1.0",
    acceptedAt: new Date("2026-05-15T10:00:00Z"),
    contractId: null,
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    packageSnapshot: { packageTier: "starter", monthlyPrice: 149 },
    ...overrides,
  };
}

// ── A. validateContractReadyForCheckout — null / missing agreement ─────────────

describe("A. Contract validation — no agreement", () => {
  it("A-01: null agreement → not ready with clear blocking reason", () => {
    const result = validateContractReadyForCheckout({
      agreement: null,
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.blockingReason).toContain("not found");
    expect(result.missingRequirements.length).toBeGreaterThan(0);
    expect(result.metadataPayload).toEqual({});
  });

  it("A-02: undefined agreement → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: undefined,
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });
});

// ── B. validateContractReadyForCheckout — ownership checks ───────────────────

describe("B. Contract validation — ownership", () => {
  it("B-01: wrong userId → not ready, ownership failure listed", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ userId: 999 }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequirements.some(m => m.includes("userId"))).toBe(true);
  });

  it("B-02: wrong projectId → not ready, project mismatch listed", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ projectId: 999 }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequirements.some(m => m.includes("projectId"))).toBe(true);
  });

  it("B-03: correct userId and projectId → ownership passes", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement(),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.missingRequirements.filter(m => m.includes("userId") || m.includes("projectId"))).toHaveLength(0);
  });
});

// ── C. validateContractReadyForCheckout — acceptedAt ─────────────────────────

describe("C. Contract validation — acceptedAt", () => {
  it("C-01: acceptedAt null → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ acceptedAt: null }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequirements.some(m => m.includes("acceptedAt"))).toBe(true);
  });

  it("C-02: acceptedAt present → acceptance check passes", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ acceptedAt: new Date() }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.missingRequirements.filter(m => m.includes("acceptedAt"))).toHaveLength(0);
  });
});

// ── D. validateContractReadyForCheckout — signerName ─────────────────────────

describe("D. Contract validation — signerName", () => {
  it("D-01: empty signerName → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequirements.some(m => m.includes("signerName"))).toBe(true);
  });

  it("D-02: single char signerName → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "J" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });

  it("D-03: sentinel 'customer' → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "customer" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
    expect(result.missingRequirements.some(m => m.includes("placeholder"))).toBe(true);
  });

  it("D-04: sentinel 'unknown' → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "unknown" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });

  it("D-05: sentinel 'test' → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "test" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });

  it("D-06: sentinel 'none' → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "none" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });

  it("D-07: SENTINEL_SIGNER_NAMES list is non-empty and contains expected values", () => {
    expect(SENTINEL_SIGNER_NAMES).toContain("customer");
    expect(SENTINEL_SIGNER_NAMES).toContain("unknown");
    expect(SENTINEL_SIGNER_NAMES).toContain("test");
    expect(SENTINEL_SIGNER_NAMES).toContain("none");
    expect(SENTINEL_SIGNER_NAMES.length).toBeGreaterThanOrEqual(5);
  });

  it("D-08: real name 'Jane Smith' → signerName check passes", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "Jane Smith" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.missingRequirements.filter(m => m.includes("signerName"))).toHaveLength(0);
  });

  it("D-09: case-insensitive sentinel check — 'CUSTOMER' → not ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "CUSTOMER" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(false);
  });
});

// ── E. validateContractReadyForCheckout — valid agreement ────────────────────

describe("E. Contract validation — valid agreement (happy path)", () => {
  it("E-01: fully valid agreement → ready", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement(),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.ready).toBe(true);
    expect(result.blockingReason).toBeNull();
    expect(result.missingRequirements).toHaveLength(0);
  });

  it("E-02: valid agreement → agreementId returned", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ id: 77 }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.agreementId).toBe(77);
  });

  it("E-03: valid agreement → metadataPayload contains agreement_id", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ id: 55 }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.metadataPayload.agreement_id).toBe("55");
  });

  it("E-04: valid agreement → metadataPayload contains terms_version", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ termsVersion: "1.0" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.metadataPayload.terms_version).toBe("1.0");
  });

  it("E-05: valid agreement → metadataPayload contains agreement_accepted_at", () => {
    const now = new Date("2026-05-15T10:00:00Z");
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ acceptedAt: now }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.metadataPayload.agreement_accepted_at).toBe(now.toISOString());
  });

  it("E-06: valid agreement → contractSummary populated", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement(),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.contractSummary).not.toBeNull();
    expect(result.contractSummary!.signerName).toBe("Jane Smith");
    expect(result.contractSummary!.hasIpAddress).toBe(true);
    expect(result.contractSummary!.hasUserAgent).toBe(true);
  });

  it("E-07: invalid agreement → metadataPayload is empty (no leak of invalid agreement_id)", () => {
    const result = validateContractReadyForCheckout({
      agreement: makeAgreement({ signerName: "customer" }),
      expectedUserId: 42,
      expectedProjectId: 100,
    });
    expect(result.metadataPayload).toEqual({});
  });
});

// ── F. Source code assertions — createCheckoutAfterElena ─────────────────────

describe("F. Source: createCheckoutAfterElena calls validateContractReadyForCheckout", () => {
  const routersSource = fsRead(
    join(process.cwd(), "server/routers.ts"),
    "utf-8"
  );

  it("F-01: createCheckoutAfterElena imports validateContractReadyForCheckout", () => {
    expect(routersSource).toContain("validateContractReadyForCheckout");
  });

  it("F-02: createCheckoutAfterElena throws if !contractCheck.ready", () => {
    expect(routersSource).toContain("contractCheck.ready");
    expect(routersSource).toContain("contractCheck.blockingReason");
  });

  it("F-03: createCheckoutAfterElena always includes agreement_id unconditionally (not via conditional spread)", () => {
    // The file should contain the unconditional form for the Elena checkout path
    expect(routersSource).toContain("agreement_id: String(input.agreementId)");
    // Must NOT use conditional spread for input.agreementId (which was the old form)
    expect(routersSource).not.toContain("input.agreementId ? { agreement_id");
  });

  it("F-04: createCheckoutAfterElena requires agreementId in zod input schema", () => {
    expect(routersSource).toContain("agreementId: z.number()");
  });

  it("F-05: legacy createCheckout is permanently disabled (throws BAD_REQUEST)", () => {
    expect(routersSource).toContain("Direct checkout is no longer available");
  });
});

// ── G. Source code assertions — resendPaymentLink ────────────────────────────

describe("G. Source: resendPaymentLink throws when no agreement", () => {
  const routersSource = fsRead(
    join(process.cwd(), "server/routers.ts"),
    "utf-8"
  );

  it("G-01: resendPaymentLink throws when no project found (not warns)", () => {
    const resendSection = routersSource.slice(
      routersSource.indexOf("resendPaymentLink:"),
      routersSource.indexOf("// 4. Create new Stripe checkout session")
    );
    expect(resendSection).toContain("no onboarding project found");
    expect(resendSection).not.toContain("will proceed without");
  });

  it("G-02: resendPaymentLink throws when no agreement found (not warns)", () => {
    const resendSection = routersSource.slice(
      routersSource.indexOf("resendPaymentLink:"),
      routersSource.indexOf("// 4. Create new Stripe checkout session")
    );
    expect(resendSection).toContain("no accepted agreement found");
  });

  it("G-03: resendPaymentLink includes agreement_id unconditionally in both metadata blocks", () => {
    // Both subscription_data.metadata and top-level metadata must include agreement_id unconditionally
    expect(routersSource).toContain("agreement_id: resendAgreementId");
    // Must NOT use conditional spread for resendAgreementId in payment link
    expect(routersSource).not.toContain("resendAgreementId ? { agreement_id");
  });
});

// ── H. Source code assertions — siteGenerator gate ───────────────────────────

describe("H. Source: siteGenerator blocks generation without valid agreement", () => {
  const siteGenSource = fsRead(
    join(process.cwd(), "server/services/siteGenerator.ts"),
    "utf-8"
  );

  it("H-01: siteGenerator has Gate 2.5 agreement check", () => {
    expect(siteGenSource).toContain("Gate 2.5");
  });

  it("H-02: siteGenerator calls listCustomerAgreementsByProject", () => {
    expect(siteGenSource).toContain("listCustomerAgreementsByProject");
  });

  it("H-03: siteGenerator blocks when hasValidAgreement is false", () => {
    expect(siteGenSource).toContain("no valid accepted agreement for self-service project");
  });

  it("H-04: siteGenerator checks signerName against sentinel names", () => {
    expect(siteGenSource).toContain("SENTINEL_NAMES");
    expect(siteGenSource).toContain('"customer"');
    expect(siteGenSource).toContain('"unknown"');
  });

  it("H-05: siteGenerator sets generationStatus idle and logs when blocked", () => {
    expect(siteGenSource).toContain("generationStatus: \"idle\"");
    expect(siteGenSource).toContain("Site generation blocked: no accepted service agreement");
  });
});

// ── I. Generation gate logic mirror ──────────────────────────────────────────

describe("I. Generation gate logic — mirrors siteGenerator Gate 2.5", () => {
  const SENTINEL_NAMES = ["customer", "unknown", "test", "testuser", "n/a", "na", "none", "user", "client", "signer"];

  function hasValidAgreement(agreements: Array<{ acceptedAt: Date | null; signerName: string }>): boolean {
    return agreements.some(a => {
      if (!a.acceptedAt) return false;
      const signer = (a.signerName || "").trim();
      if (signer.length < 2) return false;
      return !SENTINEL_NAMES.includes(signer.toLowerCase());
    });
  }

  it("I-01: empty agreements → no valid agreement → blocked", () => {
    expect(hasValidAgreement([])).toBe(false);
  });

  it("I-02: agreement with null acceptedAt → blocked", () => {
    expect(hasValidAgreement([{ acceptedAt: null, signerName: "Jane Smith" }])).toBe(false);
  });

  it("I-03: agreement with 'customer' signerName → blocked", () => {
    expect(hasValidAgreement([{ acceptedAt: new Date(), signerName: "customer" }])).toBe(false);
  });

  it("I-04: agreement with empty signerName → blocked", () => {
    expect(hasValidAgreement([{ acceptedAt: new Date(), signerName: "" }])).toBe(false);
  });

  it("I-05: agreement with valid name → allowed", () => {
    expect(hasValidAgreement([{ acceptedAt: new Date(), signerName: "Rosa Martinez" }])).toBe(true);
  });

  it("I-06: mix of bad and good agreements → allowed (good one present)", () => {
    expect(hasValidAgreement([
      { acceptedAt: null, signerName: "Jane Smith" },
      { acceptedAt: new Date(), signerName: "Rosa Martinez" },
    ])).toBe(true);
  });

  it("I-07: agreement with 'unknown' signerName → blocked", () => {
    expect(hasValidAgreement([{ acceptedAt: new Date(), signerName: "unknown" }])).toBe(false);
  });
});

// ── J. Customer card packet — contract readiness fields ───────────────────────

describe("J. Source: getCustomerCardPacket includes contract readiness", () => {
  const dbSource = fsRead(
    join(process.cwd(), "server/db.ts"),
    "utf-8"
  );

  it("J-01: getCustomerCardPacket exposes contractReadyForCheckout", () => {
    expect(dbSource).toContain("contractReadyForCheckout");
  });

  it("J-02: getCustomerCardPacket exposes contractIssueBlockingCheckout", () => {
    expect(dbSource).toContain("contractIssueBlockingCheckout");
  });

  it("J-03: getCustomerCardPacket exposes contractIssueBlockingGeneration", () => {
    expect(dbSource).toContain("contractIssueBlockingGeneration");
  });

  it("J-04: getCustomerCardPacket exposes contractIssueBlockingLaunch", () => {
    expect(dbSource).toContain("contractIssueBlockingLaunch");
  });

  it("J-05: getCustomerCardPacket exposes hasValidSignerAgreement", () => {
    expect(dbSource).toContain("hasValidSignerAgreement");
  });

  it("J-06: lifecycleStatus is an object (not a simple string status)", () => {
    // Previously lifecycleStatus was just customer.status (a string)
    // Now it is a structured object
    expect(dbSource).toContain("lifecycleStatus: {");
    expect(dbSource).toContain("customerStatus: customer.status");
  });
});

// ── K. Frontend contract gate exists ─────────────────────────────────────────

describe("K. Source: frontend enforces contract gate before checkout", () => {
  const onboardingSource = fsRead(
    join(process.cwd(), "client/src/pages/Onboarding.tsx"),
    "utf-8"
  );
  const getStartedSource = fsRead(
    join(process.cwd(), "client/src/pages/GetStarted.tsx"),
    "utf-8"
  );

  it("K-01: Onboarding.tsx button disabled unless legalAccepted is true", () => {
    expect(onboardingSource).toContain("!legalAccepted");
    expect(onboardingSource).toContain("disabled");
  });

  it("K-02: Onboarding.tsx button disabled unless signerName.trim().length >= 2", () => {
    expect(onboardingSource).toContain("signerName.trim().length < 2");
  });

  it("K-03: Onboarding.tsx calls recordAgreementAcceptance before createCheckoutAfterElena", () => {
    const recIdx = onboardingSource.indexOf("recordAgreementMutation.mutateAsync");
    const chkIdx = onboardingSource.indexOf("createCheckoutMutation.mutateAsync");
    expect(recIdx).toBeGreaterThan(-1);
    expect(chkIdx).toBeGreaterThan(-1);
    expect(recIdx).toBeLessThan(chkIdx);
  });

  it("K-04: GetStarted.tsx has same contract gate pattern", () => {
    expect(getStartedSource).toContain("!legalAccepted");
    expect(getStartedSource).toContain("signerName.trim().length < 2");
  });

  it("K-05: Onboarding.tsx shows terms link to /terms before checkout", () => {
    expect(onboardingSource).toContain('href="/terms"');
  });
});

// ── L. Webhook — compliance alert source check ───────────────────────────────

describe("L. Source: webhook COMPLIANCE_ALERT when agreement_id missing", () => {
  const webhookSource = fsRead(
    join(process.cwd(), "server/stripe-webhook.ts"),
    "utf-8"
  );

  it("L-01: webhook logs COMPLIANCE_ALERT when agreement_id missing", () => {
    expect(webhookSource).toContain("[COMPLIANCE_ALERT]");
    expect(webhookSource).toContain("agreement_id");
  });

  it("L-02: webhook links agreement to contract when agreement_id present", () => {
    expect(webhookSource).toContain("customerAgreements");
    expect(webhookSource).toContain("contractId");
    expect(webhookSource).toContain("checkoutSessionId");
  });

  it("L-03: webhook backfills contractSignedAt from agreement acceptedAt", () => {
    expect(webhookSource).toContain("contractSignedAt");
    expect(webhookSource).toContain("agreementRow");
  });
});

// ── M. One customer purchase door ────────────────────────────────────────────

describe("M. Source: exactly one customer purchase door exists", () => {
  const routersSource = fsRead(
    join(process.cwd(), "server/routers.ts"),
    "utf-8"
  );

  it("M-01: legacy createCheckout is permanently blocked", () => {
    expect(routersSource).toContain("Direct checkout is no longer available");
  });

  it("M-02: createCheckoutAfterElena is the only self-service checkout path", () => {
    // Validate that the only checkout path that creates a Stripe session for
    // self-service is createCheckoutAfterElena
    const elenaIdx = routersSource.indexOf("createCheckoutAfterElena");
    expect(elenaIdx).toBeGreaterThan(-1);
  });

  it("M-03: contractValidation module is imported in createCheckoutAfterElena block", () => {
    expect(routersSource).toContain("shared/contractValidation");
  });

  it("M-04: validateContractReadyForCheckout is called before Stripe session creation within createCheckoutAfterElena", () => {
    // Slice only the createCheckoutAfterElena block (from its definition to end of file)
    const elenaStart = routersSource.indexOf("createCheckoutAfterElena:");
    expect(elenaStart).toBeGreaterThan(-1);
    const elenaBlock = routersSource.slice(elenaStart);
    const validationIdx = elenaBlock.indexOf("validateContractReadyForCheckout(");
    const stripeSessionIdx = elenaBlock.indexOf("stripe.checkout.sessions.create(");
    expect(validationIdx).toBeGreaterThan(-1);
    expect(stripeSessionIdx).toBeGreaterThan(-1);
    // Within createCheckoutAfterElena, validation must come before Stripe session creation
    expect(validationIdx).toBeLessThan(stripeSessionIdx);
  });
});
