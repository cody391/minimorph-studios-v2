/**
 * P0 Launch Truth Gate — Static Regression Tests
 *
 * Verifies that the honesty fixes from the P0 truth audit remain in place:
 * 1. QA auto-fix engine does not claim fake fixes (no return true in applyAutoFix)
 * 2. Nameserver config is a single source of truth with non-empty values
 * 3. You're-live email does not contain false completion claims
 * 4. Add-on functions do not falsely claim automation that isn't wired
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = __dirname;
const servicesDir = join(serverDir, "services");
const configDir = join(serverDir, "config");

function readService(name: string): string {
  return readFileSync(join(servicesDir, name), "utf8");
}

// ── 1. QA Auto-Fix Engine ─────────────────────────────────────────────────

describe("QA auto-fix engine — no fake fixes", () => {
  const qaSource = readService("qaInspector.ts");

  it("applyAutoFix function body contains no 'return true' statements", () => {
    const fnStart = qaSource.indexOf("async function applyAutoFix(");
    const fnEnd = qaSource.indexOf("\nasync function ", fnStart + 1);
    const fnBody = fnEnd === -1 ? qaSource.slice(fnStart) : qaSource.slice(fnStart, fnEnd);
    expect(fnBody).not.toMatch(/return true/);
  });

  it("applyAutoFix always returns false for every known action", () => {
    expect(qaSource).toContain("return false;");
    // The old fake implementation had 20+ 'return true' lines — verify they're gone
    const fakeFixes = (qaSource.match(/logged for patch|logged for injection|logged for addition/g) || []).length;
    expect(fakeFixes).toBe(0);
  });
});

// ── 2. Nameserver Single Source of Truth ─────────────────────────────────

describe("Cloudflare nameserver config — single source of truth", () => {
  it("domain.ts exports non-empty CLOUDFLARE_NS1 and CLOUDFLARE_NS2", async () => {
    const { CLOUDFLARE_NS1, CLOUDFLARE_NS2 } = await import("./config/domain.js");
    expect(CLOUDFLARE_NS1).toBeTruthy();
    expect(CLOUDFLARE_NS2).toBeTruthy();
    expect(CLOUDFLARE_NS1).toContain(".ns.cloudflare.com");
    expect(CLOUDFLARE_NS2).toContain(".ns.cloudflare.com");
    expect(CLOUDFLARE_NS1).not.toEqual(CLOUDFLARE_NS2);
  });

  it("addonOrchestrator has no hardcoded nameserver strings", () => {
    const source = readService("addonOrchestrator.ts");
    expect(source).not.toMatch(/ada\.ns\.cloudflare\.com/);
    expect(source).not.toMatch(/bart\.ns\.cloudflare\.com/);
    expect(source).not.toMatch(/vera\.ns\.cloudflare\.com/);
    expect(source).not.toMatch(/wade\.ns\.cloudflare\.com/);
  });

  it("siteDeployment has no hardcoded nameserver strings", () => {
    const source = readService("siteDeployment.ts");
    expect(source).not.toMatch(/ada\.ns\.cloudflare\.com/);
    expect(source).not.toMatch(/bart\.ns\.cloudflare\.com/);
    // vera and wade should now come from the config via template literal, not hardcoded:
    expect(source).toContain("CLOUDFLARE_NS1");
    expect(source).toContain("CLOUDFLARE_NS2");
  });
});

// ── 3. You're-Live Email Copy ─────────────────────────────────────────────

describe("You're-live email — no false completion claims", () => {
  const source = readService("addonOrchestrator.ts");

  it("does not contain 'all your add-ons have been configured'", () => {
    expect(source).not.toContain("all your add-ons have been configured");
  });

  it("does not contain 'Completed Automatically'", () => {
    expect(source).not.toContain("Completed Automatically");
  });

  it("does not claim 'embedded in site' for pixel", () => {
    expect(source).not.toContain("embedded in site");
  });
});

// ── 4. Add-On Functions — No False Automation Claims ─────────────────────

describe("Add-on functions — honest status", () => {
  const source = readService("addonOrchestrator.ts");

  it("GA4 setup does not claim 'embed ready'", () => {
    expect(source).not.toContain("GA4 embed ready");
  });

  it("AI photography does not claim 'queued for generation'", () => {
    expect(source).not.toContain("queued for generation");
  });

  it("logo design does not claim '3 logo concepts queued'", () => {
    expect(source).not.toContain("3 logo concepts queued");
  });

  it("booking widget does not claim '/book page created'", () => {
    expect(source).not.toContain("/book page created");
  });

  it("event calendar does not claim '/events page created'", () => {
    expect(source).not.toContain("/events page created");
  });

  it("AI chatbot does not claim 'Widget embedded on all pages'", () => {
    expect(source).not.toContain("Widget embedded on all pages");
  });
});

// ── 5. Stripe Webhook — No Dead temp_password Read ────────────────────────

describe("Stripe webhook — no temp_password metadata read", () => {
  const webhookSource = readFileSync(join(serverDir, "stripe-webhook.ts"), "utf8");

  it("does not read temp_password from Stripe session metadata", () => {
    expect(webhookSource).not.toContain("session.metadata?.temp_password");
    expect(webhookSource).not.toContain("metadata?.temp_password");
  });
});

// ── 6. Domain Live Truth — No Premature Celebration Email ─────────────────

describe("siteDeployment — celebration email gated on domain state", () => {
  const source = readService("siteDeployment.ts");

  it("hasPendingDomain guard exists before sendSiteLiveEmail call", () => {
    expect(source).toContain("hasPendingDomain");
    // Guard must appear before the sendSiteLiveEmail call
    const guardPos = source.indexOf("hasPendingDomain");
    const emailPos = source.indexOf("sendSiteLiveEmail");
    expect(guardPos).toBeGreaterThan(0);
    expect(emailPos).toBeGreaterThan(0);
    expect(guardPos).toBeLessThan(emailPos);
  });
});
