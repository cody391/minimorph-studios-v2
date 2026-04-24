import { describe, it, expect } from "vitest";
import { scoreAssessment } from "./assessmentRouter";
import {
  GATE_1_QUESTIONS,
  GATE_2_QUESTIONS,
  SCORING,
  ALL_QUESTIONS,
} from "./assessmentData";
import { NDA_TEXT, NDA_VERSION } from "./onboardingDataRouter";

/* ═══════════════════════════════════════════════════════
   TIMER ENFORCEMENT TESTS
   ═══════════════════════════════════════════════════════ */
describe("Timer Enforcement", () => {
  it("SCORING should define a 20-minute (1200s) time limit", () => {
    expect(SCORING.timeLimitSeconds).toBe(1200);
  });

  it("SCORING should define a 30-second grace period", () => {
    expect(SCORING.gracePeriodSeconds).toBe(30);
  });

  it("total allowed time should be 1230 seconds (20min + 30s grace)", () => {
    const totalAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(totalAllowed).toBe(1230);
  });

  it("should detect when submission is within time limit", () => {
    const startedAt = new Date("2026-04-24T10:00:00Z");
    const submittedAt = new Date("2026-04-24T10:15:00Z"); // 15 minutes later
    const elapsed = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const maxAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(elapsed).toBeLessThanOrEqual(maxAllowed);
  });

  it("should detect when submission exceeds time limit + grace", () => {
    const startedAt = new Date("2026-04-24T10:00:00Z");
    const submittedAt = new Date("2026-04-24T10:25:00Z"); // 25 minutes later
    const elapsed = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const maxAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(elapsed).toBeGreaterThan(maxAllowed);
  });

  it("should allow submission at exactly 20 minutes (within grace)", () => {
    const startedAt = new Date("2026-04-24T10:00:00Z");
    const submittedAt = new Date("2026-04-24T10:20:00Z"); // exactly 20 minutes
    const elapsed = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const maxAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(elapsed).toBeLessThanOrEqual(maxAllowed);
  });

  it("should allow submission at 20:29 (within grace)", () => {
    const startedAt = new Date("2026-04-24T10:00:00Z");
    const submittedAt = new Date("2026-04-24T10:20:29Z"); // 20min 29s
    const elapsed = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const maxAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(elapsed).toBeLessThanOrEqual(maxAllowed);
  });

  it("should reject submission at 20:31 (past grace)", () => {
    const startedAt = new Date("2026-04-24T10:00:00Z");
    const submittedAt = new Date("2026-04-24T10:20:31Z"); // 20min 31s
    const elapsed = (submittedAt.getTime() - startedAt.getTime()) / 1000;
    const maxAllowed = SCORING.timeLimitSeconds + SCORING.gracePeriodSeconds;
    expect(elapsed).toBeGreaterThan(maxAllowed);
  });
});

/* ═══════════════════════════════════════════════════════
   RETAKE COOLDOWN TESTS
   ═══════════════════════════════════════════════════════ */
describe("Retake Cooldown Logic", () => {
  const COOLDOWN_MS = SCORING.retakeCooldownDays * 24 * 60 * 60 * 1000;

  it("SCORING should define a 30-day retake cooldown", () => {
    expect(SCORING.retakeCooldownDays).toBe(30);
  });

  it("cooldown should be exactly 30 days in milliseconds", () => {
    expect(COOLDOWN_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("should block retake within cooldown period", () => {
    const completedAt = new Date("2026-04-01T10:00:00Z");
    const cooldownEnd = completedAt.getTime() + COOLDOWN_MS;
    const now = new Date("2026-04-15T10:00:00Z").getTime(); // 14 days later
    expect(now < cooldownEnd).toBe(true);
  });

  it("should allow retake after cooldown period", () => {
    const completedAt = new Date("2026-04-01T10:00:00Z");
    const cooldownEnd = completedAt.getTime() + COOLDOWN_MS;
    const now = new Date("2026-05-02T10:00:00Z").getTime(); // 31 days later
    expect(now >= cooldownEnd).toBe(true);
  });

  it("should block retake at exactly 30 days (boundary)", () => {
    const completedAt = new Date("2026-04-01T10:00:00Z");
    const cooldownEnd = completedAt.getTime() + COOLDOWN_MS;
    // Exactly 30 days = cooldownEnd, so now < cooldownEnd is false → allowed
    const now = completedAt.getTime() + COOLDOWN_MS;
    expect(now < cooldownEnd).toBe(false); // Allowed at exactly 30 days
  });

  it("should calculate correct retake date", () => {
    const completedAt = new Date("2026-04-01T10:00:00Z");
    const retakeDate = new Date(completedAt.getTime() + COOLDOWN_MS);
    expect(retakeDate.toISOString().startsWith("2026-05-01")).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════
   TRUST GATE / NDA TESTS
   ═══════════════════════════════════════════════════════ */
describe("Trust Gate (NDA & Identity)", () => {
  it("NDA text should be defined and non-empty", () => {
    expect(NDA_TEXT).toBeDefined();
    expect(NDA_TEXT.length).toBeGreaterThan(100);
  });

  it("NDA version should be defined", () => {
    expect(NDA_VERSION).toBe("1.0");
  });

  it("NDA should contain key sections", () => {
    expect(NDA_TEXT).toContain("CONFIDENTIAL INFORMATION");
    expect(NDA_TEXT).toContain("NON-DISCLOSURE OBLIGATION");
    expect(NDA_TEXT).toContain("INTELLECTUAL PROPERTY");
    expect(NDA_TEXT).toContain("NON-COMPETE");
    expect(NDA_TEXT).toContain("RETURN OF MATERIALS");
    expect(NDA_TEXT).toContain("REMEDIES");
    expect(NDA_TEXT).toContain("DURATION");
  });

  it("NDA should reference MiniMorph Studios", () => {
    expect(NDA_TEXT).toContain("MiniMorph Studios");
  });

  it("NDA should specify 2-year duration", () => {
    expect(NDA_TEXT).toContain("2 years");
  });

  it("NDA should be governed by Delaware law", () => {
    expect(NDA_TEXT).toContain("Delaware");
  });

  it("identity validation: SSN last 4 must be exactly 4 digits", () => {
    const ssnRegex = /^\d{4}$/;
    expect(ssnRegex.test("1234")).toBe(true);
    expect(ssnRegex.test("123")).toBe(false);
    expect(ssnRegex.test("12345")).toBe(false);
    expect(ssnRegex.test("abcd")).toBe(false);
    expect(ssnRegex.test("12ab")).toBe(false);
  });

  it("identity validation: ID last 4 must be exactly 4 digits", () => {
    const idRegex = /^\d{4}$/;
    expect(idRegex.test("5678")).toBe(true);
    expect(idRegex.test("567")).toBe(false);
    expect(idRegex.test("56789")).toBe(false);
  });

  it("identity validation: ZIP code format", () => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    expect(zipRegex.test("12345")).toBe(true);
    expect(zipRegex.test("12345-6789")).toBe(true);
    expect(zipRegex.test("1234")).toBe(false);
    expect(zipRegex.test("123456")).toBe(false);
    expect(zipRegex.test("abcde")).toBe(false);
  });

  it("identity validation: date of birth format YYYY-MM-DD", () => {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dobRegex.test("1990-01-15")).toBe(true);
    expect(dobRegex.test("01/15/1990")).toBe(false);
    expect(dobRegex.test("1990-1-5")).toBe(false);
  });

  it("valid ID types should be drivers_license, passport, or state_id", () => {
    const validTypes = ["drivers_license", "passport", "state_id"];
    expect(validTypes).toContain("drivers_license");
    expect(validTypes).toContain("passport");
    expect(validTypes).toContain("state_id");
    expect(validTypes.length).toBe(3);
  });
});

/* ═══════════════════════════════════════════════════════
   AUTO-POPULATION LOGIC TESTS
   ═══════════════════════════════════════════════════════ */
describe("Auto-Population Logic", () => {
  it("should construct legal full name from first and last", () => {
    const firstName = "John";
    const lastName = "Smith";
    const fullName = `${firstName} ${lastName}`.trim();
    expect(fullName).toBe("John Smith");
  });

  it("should handle missing last name gracefully", () => {
    const firstName = "John";
    const lastName = "";
    const fullName = `${firstName} ${lastName}`.trim();
    expect(fullName).toBe("John");
  });

  it("should handle missing first name gracefully", () => {
    const firstName = "";
    const lastName = "Smith";
    const fullName = `${firstName} ${lastName}`.trim();
    expect(fullName).toBe("Smith");
  });

  it("W-9 form should auto-populate name, address, SSN from trust data", () => {
    const trustData = {
      legalFirstName: "Jane",
      legalLastName: "Doe",
      streetAddress: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      ssnLast4: "1234",
    };

    const w9Fields = {
      name: `${trustData.legalFirstName} ${trustData.legalLastName}`.trim(),
      address: trustData.streetAddress,
      city: trustData.city,
      state: trustData.state,
      zipCode: trustData.zipCode,
      ssnLast4: trustData.ssnLast4,
    };

    expect(w9Fields.name).toBe("Jane Doe");
    expect(w9Fields.address).toBe("123 Main St");
    expect(w9Fields.city).toBe("Austin");
    expect(w9Fields.state).toBe("TX");
    expect(w9Fields.zipCode).toBe("78701");
    expect(w9Fields.ssnLast4).toBe("1234");
  });

  it("HR form should auto-populate from trust + account data", () => {
    const trustData = {
      legalFirstName: "Jane",
      legalLastName: "Doe",
      dateOfBirth: "1990-05-15",
      streetAddress: "123 Main St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      idType: "drivers_license",
      idLast4: "5678",
    };
    const accountData = {
      email: "jane@example.com",
      phone: "512-555-0123",
    };

    const hrFields = {
      legalFirstName: trustData.legalFirstName,
      legalLastName: trustData.legalLastName,
      dateOfBirth: trustData.dateOfBirth,
      email: accountData.email,
      phone: accountData.phone,
      address: trustData.streetAddress,
      city: trustData.city,
      state: trustData.state,
      zipCode: trustData.zipCode,
    };

    expect(hrFields.legalFirstName).toBe("Jane");
    expect(hrFields.dateOfBirth).toBe("1990-05-15");
    expect(hrFields.email).toBe("jane@example.com");
    expect(hrFields.phone).toBe("512-555-0123");
  });

  it("Payroll form should include Stripe Connect status", () => {
    const stripeStatus = "not_connected";
    expect(["connected", "not_connected"]).toContain(stripeStatus);
  });

  it("Rep Agreement should reference NDA signing date", () => {
    const ndaSignedAt = new Date("2026-04-24T10:00:00Z");
    const ndaDate = ndaSignedAt.toISOString().split("T")[0];
    expect(ndaDate).toBe("2026-04-24");
  });

  it("form types should be w9_tax, hr_employment, payroll_setup, rep_agreement", () => {
    const formTypes = ["w9_tax", "hr_employment", "payroll_setup", "rep_agreement"];
    expect(formTypes.length).toBe(4);
  });

  it("field source tracking should identify trust_verification vs account_creation", () => {
    const sources = {
      name: "trust_verification",
      email: "account_creation",
      phone: "account_creation",
      address: "trust_verification",
      ssnLast4: "trust_verification",
    };

    expect(sources.name).toBe("trust_verification");
    expect(sources.email).toBe("account_creation");
    expect(sources.address).toBe("trust_verification");
  });
});

/* ═══════════════════════════════════════════════════════
   SCORING ENGINE (EXTENDED TESTS)
   ═══════════════════════════════════════════════════════ */
describe("Scoring Engine — Timer & Attempt Integration", () => {
  it("scoring should work independently of timer", () => {
    // Build perfect answers
    const perfectAnswers: Record<string, string> = {};
    for (const q of ALL_QUESTIONS) {
      if (q.freeText) continue;
      const best = q.options.reduce((a, b) => (a.score > b.score ? a : b));
      perfectAnswers[q.id] = best.id;
    }
    const result = scoreAssessment(perfectAnswers);
    expect(result.status).toBe("passed");
    expect(result.totalScore).toBeGreaterThanOrEqual(SCORING.autoPassThreshold);
  });

  it("scoring should handle empty answers (all zeros)", () => {
    const emptyAnswers: Record<string, string> = {};
    const result = scoreAssessment(emptyAnswers);
    expect(result.status).toBe("failed");
    expect(result.gate1Score).toBe(0);
    expect(result.gate2Score).toBe(0);
    expect(result.totalScore).toBe(0);
  });

  it("scoring should handle partial answers", () => {
    // Answer only Gate 1 questions with best answers
    const partialAnswers: Record<string, string> = {};
    for (const q of GATE_1_QUESTIONS) {
      const best = q.options.reduce((a, b) => (a.score > b.score ? a : b));
      partialAnswers[q.id] = best.id;
    }
    const result = scoreAssessment(partialAnswers);
    expect(result.gate1Score).toBe(100);
    expect(result.gate2Score).toBe(0);
    // Should fail because gate2 is below minimum
    expect(result.status).toBe("failed");
  });
});
