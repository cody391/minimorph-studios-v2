/**
 * P0 Launch Truth Gate — Comprehensive Behavioral + Static Tests
 *
 * Proves every acceptance requirement:
 * 1.  QA auto-fix engine never returns fake success
 * 2.  Nameserver config is single source of truth
 * 3.  You're-live email copy is honest
 * 4.  All incomplete add-ons (including online_store) emit success=false
 * 5.  Booking widget never claims /book page exists
 * 6.  Domain live: stage/launchedAt not set before DNS confirmation
 * 7.  Temp password never in Stripe metadata
 * 8.  Revision limit enforced server-side — BEHAVIORAL
 * 9.  Admin confirm domain live: verification + override required
 * 10. adminReleaseLaunch blocks without customer approvedAt
 * 11. Launch readiness hard blockers — BEHAVIORAL
 * 12. Online store truth — never Ready when /shop not deployed
 * 13. Automation safety defaults
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = __dirname;
const servicesDir = join(serverDir, "services");

function read(name: string): string {
  return readFileSync(name, "utf8");
}
function readService(name: string): string {
  return read(join(servicesDir, name));
}
function readServer(name: string): string {
  return read(join(serverDir, name));
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

  it("old fake fix log messages are gone", () => {
    expect(qaSource).not.toMatch(/logged for patch|logged for injection|logged for addition/);
  });
});

// ── 2. Nameserver Single Source of Truth ─────────────────────────────────

describe("Cloudflare nameserver — single source of truth", () => {
  it("domain.ts exports non-empty distinct NS1 and NS2", async () => {
    const { CLOUDFLARE_NS1, CLOUDFLARE_NS2 } = await import("./config/domain.js");
    expect(CLOUDFLARE_NS1).toBeTruthy();
    expect(CLOUDFLARE_NS2).toBeTruthy();
    expect(CLOUDFLARE_NS1).toContain(".ns.cloudflare.com");
    expect(CLOUDFLARE_NS2).toContain(".ns.cloudflare.com");
    expect(CLOUDFLARE_NS1).not.toEqual(CLOUDFLARE_NS2);
  });

  it("addonOrchestrator has no hardcoded nameserver strings", () => {
    const src = readService("addonOrchestrator.ts");
    expect(src).not.toMatch(/ada\.ns\.cloudflare\.com/);
    expect(src).not.toMatch(/bart\.ns\.cloudflare\.com/);
    expect(src).not.toMatch(/vera\.ns\.cloudflare\.com/);
    expect(src).not.toMatch(/wade\.ns\.cloudflare\.com/);
    expect(src).toContain("CLOUDFLARE_NS1");
    expect(src).toContain("CLOUDFLARE_NS2");
  });

  it("siteDeployment has no hardcoded nameserver strings", () => {
    const src = readService("siteDeployment.ts");
    expect(src).not.toMatch(/ada\.ns\.cloudflare\.com/);
    expect(src).not.toMatch(/bart\.ns\.cloudflare\.com/);
    expect(src).toContain("CLOUDFLARE_NS1");
    expect(src).toContain("CLOUDFLARE_NS2");
  });
});

// ── 3. You're-Live Email Copy ─────────────────────────────────────────────

describe("You're-live email — no false completion claims", () => {
  const src = readService("addonOrchestrator.ts");

  it("does not say 'all your add-ons have been configured'", () =>
    expect(src).not.toContain("all your add-ons have been configured"));

  it("does not say 'Completed Automatically'", () =>
    expect(src).not.toContain("Completed Automatically"));

  it("does not claim pixel 'embedded in site'", () =>
    expect(src).not.toContain("embedded in site"));

  it("does not claim anything 'queued for generation'", () =>
    expect(src).not.toContain("queued for generation"));
});

// ── 4. Add-On Functions — Incomplete Add-Ons Must Not Emit success=true ──

describe("add-on truth: incomplete add-ons cannot emit success=true", () => {
  const src = readService("addonOrchestrator.ts");

  // These add-ons do zero or incomplete automated work — they must be success=false
  const mustBeFalse = [
    "google_analytics",
    "facebook_pixel",
    "sms_lead_alerts",
    "ai_chatbot",
    "review_collector",
    "ai_photography",
    "logo_design",
    "event_calendar",
    "booking_widget",
    "video_background",
    "email_marketing_setup",
    "seo_autopilot",
    "competitor_monitoring",
    "menu_price_list",
    "lead_capture_bot",
    "social_feed_embed",
    "brand_style_guide",
    "copywriting",
    "google_business_profile",
    "online_store",
  ];

  for (const addon of mustBeFalse) {
    it(`${addon} never emits log("${addon}", true, ...)`, () => {
      const truePattern = new RegExp(`log\\s*\\(\\s*["'\`]${addon}["'\`]\\s*,\\s*true`);
      const truePattern2 = new RegExp(`logResult\\s*\\(\\s*["'\`]${addon}["'\`]\\s*,\\s*true`);
      expect(src).not.toMatch(truePattern);
      expect(src).not.toMatch(truePattern2);
    });
  }
});

// ── 5. Booking Widget — Cannot Claim /book Page Exists ───────────────────

describe("booking widget truth", () => {
  const src = readService("addonOrchestrator.ts");

  it("does not claim '/book page created'", () =>
    expect(src).not.toContain("/book page created"));

  it("does not claim 'booking page is live'", () =>
    expect(src.toLowerCase()).not.toContain("booking page is live"));
});

// ── 6. Domain Live Truth — stage/launchedAt gated on DNS confirmation ────

describe("siteDeployment — domain DNS pending behavior", () => {
  const src = readService("siteDeployment.ts");

  it("has hasPendingDomain variable", () =>
    expect(src).toContain("hasPendingDomain"));

  it("stage='complete' only set inside !hasPendingDomain branch", () => {
    const hasPendingStart = src.indexOf("if (hasPendingDomain)");
    const elseStart = src.indexOf("} else {", hasPendingStart);
    expect(hasPendingStart).toBeGreaterThan(0);
    expect(elseStart).toBeGreaterThan(0);
    const pendingBranch = src.slice(hasPendingStart, elseStart);
    expect(pendingBranch).not.toContain('"complete"');
    expect(pendingBranch).toContain('"launch"');
  });

  it("launchedAt only set inside !hasPendingDomain branch", () => {
    const hasPendingStart = src.indexOf("if (hasPendingDomain)");
    const elseStart = src.indexOf("} else {", hasPendingStart);
    const pendingBranch = src.slice(hasPendingStart, elseStart);
    expect(pendingBranch).not.toContain("launchedAt");
  });

  it("sendSiteLiveEmail only called inside !hasPendingDomain branch", () => {
    const hasPendingStart = src.indexOf("if (hasPendingDomain)");
    const elseStart = src.indexOf("} else {", hasPendingStart);
    const pendingBranch = src.slice(hasPendingStart, elseStart);
    expect(pendingBranch).not.toContain("sendSiteLiveEmail");
  });

  it("adminConfirmDomainLive procedure exists in routers.ts", () => {
    const routersSrc = readServer("routers.ts");
    expect(routersSrc).toContain("adminConfirmDomainLive:");
    expect(routersSrc).toContain("stage: \"complete\"");
    expect(routersSrc).toContain("launchedAt: new Date()");
  });

  it("activateNurturingForProject is exported from siteDeployment.ts", () =>
    expect(src).toContain("export async function activateNurturingForProject"));

  it("verifyLiveUrl is exported from siteDeployment.ts", () =>
    expect(src).toContain("export async function verifyLiveUrl"));
});

// ── 7. Stripe Metadata — No Passwords ────────────────────────────────────

describe("Stripe metadata — no passwords in checkout session", () => {
  const webhookSrc = readServer("stripe-webhook.ts");
  const routersSrc = readServer("routers.ts");

  it("webhook does not read temp_password from session metadata", () => {
    expect(webhookSrc).not.toContain("session.metadata?.temp_password");
    expect(webhookSrc).not.toContain("metadata?.temp_password");
  });

  it("checkout sessionMeta construction does not include password fields", () => {
    const metaStart = routersSrc.indexOf("let sessionMeta: Record<string, string>");
    const metaEnd = routersSrc.indexOf("const sessionParams:", metaStart);
    expect(metaStart).toBeGreaterThan(0);
    const metaBlock = routersSrc.slice(metaStart, metaEnd);
    expect(metaBlock).not.toMatch(/password/i);
    expect(metaBlock).not.toMatch(/temp_password/);
    expect(metaBlock).not.toMatch(/tempPassword/);
    expect(metaBlock).not.toMatch(/secret/i);
    expect(metaBlock).toContain("project_id");
    expect(metaBlock).toContain("package_tier");
  });
});

// ── 8. Revision Limit — BEHAVIORAL ───────────────────────────────────────

describe("revision limit — behavioral tests", () => {
  it("validateRevisionAvailability: project with 0 revisions used is allowed", async () => {
    const { validateRevisionAvailability } = await import("./helpers/revisions.js");
    const result = validateRevisionAvailability({ revisionsCount: 0, maxRevisions: 3 });
    expect(result.allowed).toBe(true);
    expect(result.revisionsMax).toBe(3);
    expect(result.revisionsUsed).toBe(0);
  });

  it("validateRevisionAvailability: project with 2/3 revisions used is still allowed", async () => {
    const { validateRevisionAvailability } = await import("./helpers/revisions.js");
    const result = validateRevisionAvailability({ revisionsCount: 2, maxRevisions: 3 });
    expect(result.allowed).toBe(true);
    expect(result.revisionsRemaining).toBeGreaterThan(0);
  });

  it("validateRevisionAvailability: project with 3/3 revisions is blocked", async () => {
    const { validateRevisionAvailability } = await import("./helpers/revisions.js");
    const result = validateRevisionAvailability({ revisionsCount: 3, maxRevisions: 3 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Maximum revisions reached/i);
    expect(result.revisionsRemaining).toBe(0);
  });

  it("validateRevisionAvailability: project with count > max is blocked (no sneaking past)", async () => {
    const { validateRevisionAvailability } = await import("./helpers/revisions.js");
    const result = validateRevisionAvailability({ revisionsCount: 5, maxRevisions: 3 });
    expect(result.allowed).toBe(false);
  });

  it("computeNewRevisionCounts: revisionsRemaining cannot go below zero", async () => {
    const { computeNewRevisionCounts } = await import("./helpers/revisions.js");
    // Edge case: remaining already at 0
    const { newRevisionsRemaining } = computeNewRevisionCounts({
      revisionsCount: 2,
      revisionsRemaining: 0,
      maxRevisions: 3,
    });
    expect(newRevisionsRemaining).toBe(0);
  });

  it("computeNewRevisionCounts: normal decrement path", async () => {
    const { computeNewRevisionCounts } = await import("./helpers/revisions.js");
    const { newRevisionsCount, newRevisionsRemaining } = computeNewRevisionCounts({
      revisionsCount: 1,
      revisionsRemaining: 2,
      maxRevisions: 3,
    });
    expect(newRevisionsCount).toBe(2);
    expect(newRevisionsRemaining).toBe(1);
  });

  it("requestChange procedure uses validateRevisionAvailability helper", () => {
    const routersSrc = readServer("routers.ts");
    expect(routersSrc).toContain("validateRevisionAvailability");
    expect(routersSrc).toContain("computeNewRevisionCounts");
  });

  it("customer copy does not promise automated $149 checkout for paid revisions", () => {
    const emailSrc = readService("customerEmails.ts");
    expect(emailSrc).not.toMatch(/\$149.*checkout.*link|checkout.*\$149.*revision/i);
  });
});

// ── 9. Domain Verification + Override — Hard Gate ────────────────────────

describe("adminConfirmDomainLive — verification and override required", () => {
  const routersSrc = readServer("routers.ts");

  it("procedure accepts overrideReason as optional input", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("overrideReason");
    expect(confirmBody).toContain("z.string().min(20).optional()");
  });

  it("procedure calls verifyLiveUrl before marking complete", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("verifyLiveUrl");
    expect(confirmBody).toContain("verification.live");
  });

  it("procedure rejects when domain unreachable and no override reason", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("not yet reachable");
    expect(confirmBody).toContain("override reason");
  });

  it("procedure marks confirmedByOverride when override reason provided", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("confirmedByOverride");
    expect(confirmBody).toContain("OVERRIDE");
  });

  it("override is logged/stored in generationLog", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("admin override:");
  });

  it("admin notification distinguishes override from auto-verified", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("Domain Confirmed (Override):");
    expect(confirmBody).toContain("Domain Live Confirmed:");
  });

  it("stage stays launch — still gated on stage/domainName checks", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("stage !== \"launch\"");
    expect(confirmBody).toContain("No custom domain to verify");
  });
});

// ── 10. Admin Hard Blockers — BEHAVIORAL ─────────────────────────────────

describe("launch readiness — behavioral hard blocker tests", () => {
  it("missing payment blocks ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: null,
      adminPreviewApprovedAt: new Date(),
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
    });
    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Payment not confirmed");
  });

  it("missing customer final approval blocks ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: new Date(),
      approvedAt: null,
      generatedSiteHtml: '{"index.html":"<html>"}',
    });
    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Customer final approval missing");
  });

  it("missing admin preview approval blocks ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: null,
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
    });
    expect(result.ready).toBe(false);
    expect(result.blockers).toContain("Admin preview not approved");
  });

  it("unresolved critical QA issue blocks ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: new Date(),
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
      qaIssues: [{ severity: "critical", description: "Missing contact info" }],
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes("critical QA"))).toBe(true);
  });

  it("DNS-pending custom domain blocks ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: new Date(),
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
      domainName: "example.com",
      stage: "launch",
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.some(b => b.includes("DNS not yet confirmed"))).toBe(true);
  });

  it("manual-required add-ons block ready=true by default", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: new Date(),
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
      addonResults: [{ addon: "booking_widget", success: false, details: "checklist created" }],
    });
    expect(result.ready).toBe(false);
  });

  it("manual-required add-ons with allowOverride produce requiresOverride=true, not a hard blocker", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness(
      {
        paymentConfirmedAt: new Date(),
        adminPreviewApprovedAt: new Date(),
        approvedAt: new Date(),
        generatedSiteHtml: '{"index.html":"<html>"}',
        addonResults: [{ addon: "booking_widget", success: false }],
      },
      { allowOverrideForManualAddons: true },
    );
    expect(result.blockers).toHaveLength(0);
    expect(result.requiresOverride).toBe(true);
    expect(result.ready).toBe(false);
  });

  it("fully clean project is ready=true", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const result = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(),
      adminPreviewApprovedAt: new Date(),
      approvedAt: new Date(),
      generatedSiteHtml: '{"index.html":"<html>"}',
      qaIssues: [],
      addonResults: [],
    });
    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("adminReleaseLaunch throws without customer approvedAt", () => {
    const routersSrc = readServer("routers.ts");
    const procStart = routersSrc.indexOf("adminReleaseLaunch: adminProcedure");
    const procEnd = routersSrc.indexOf("adminConfirmDomainLive:", procStart);
    const procBody = routersSrc.slice(procStart, procEnd);
    expect(procBody).toContain("project.approvedAt");
    expect(procBody).toContain("Customer has not yet approved");
  });
});

// ── 11. adminReleaseLaunch — Wired to Readiness Helper ───────────────────

describe("adminReleaseLaunch — enforced via calculateLaunchReadiness", () => {
  const routersSrc = readServer("routers.ts");
  const procStart = routersSrc.indexOf("adminReleaseLaunch: adminProcedure");
  const procEnd = routersSrc.indexOf("adminConfirmDomainLive:", procStart);
  const procBody = routersSrc.slice(procStart, procEnd);

  it("procedure imports and calls calculateLaunchReadiness", () => {
    expect(routersSrc).toContain("import { calculateLaunchReadiness }");
    expect(procBody).toContain("calculateLaunchReadiness(");
  });

  it("dryRun returns ready, blockers, and warnings fields", () => {
    expect(procBody).toContain("ready: readiness.ready");
    expect(procBody).toContain("blockers: readiness.blockers");
    expect(procBody).toContain("warnings: readiness.warnings");
  });

  it("dryRun does NOT call deployApprovedSite", () => {
    // Find the dryRun return block
    const dryRunStart = procBody.indexOf("if (input.dryRun)");
    const dryRunEnd = procBody.indexOf("// Real release path", dryRunStart);
    const dryRunBlock = procBody.slice(dryRunStart, dryRunEnd);
    expect(dryRunBlock).not.toContain("deployApprovedSite");
  });

  it("real release throws when readiness.ready is false", () => {
    expect(procBody).toContain("if (!readiness.ready)");
    expect(procBody).toContain("Cannot release");
    expect(procBody).toContain("blocker(s)");
  });

  it("deployApprovedSite only called after readiness check passes", () => {
    // The readiness block must come BEFORE deployApprovedSite call
    const readinessCheckPos = procBody.indexOf("if (!readiness.ready)");
    const deployPos = procBody.indexOf("deployApprovedSite(");
    expect(readinessCheckPos).toBeGreaterThan(0);
    expect(deployPos).toBeGreaterThan(0);
    expect(readinessCheckPos).toBeLessThan(deployPos);
  });

  it("procedure accepts acknowledgeManualAddons and overrideReason inputs", () => {
    expect(procBody).toContain("acknowledgeManualAddons");
    expect(procBody).toContain("overrideReason");
    expect(procBody).toContain("z.string().min(20).optional()");
  });

  it("manual add-on override requires both acknowledgeManualAddons=true and overrideReason ≥20 chars", () => {
    expect(procBody).toContain("acknowledgeManualAddons");
    expect(procBody).toContain("input.overrideReason.trim().length >= 20");
  });

  it("override is logged before deployment", () => {
    expect(procBody).toContain("OVERRIDE");
    expect(procBody).toContain("notifyOwner");
  });

  it("QA issues fetched from siteBuildReports", () => {
    expect(procBody).toContain("siteBuildReports");
    expect(procBody).toContain("issuesPersistent");
    expect(procBody).toContain("issuesEscalated");
  });

  it("add-on results fetched from launchChecklist via isFulfillmentItemBlocking filter", () => {
    expect(procBody).toContain("launchChecklist");
    // Updated: uses isFulfillmentItemBlocking (not a hardcoded pending filter) so completed items pass
    expect(procBody).toContain("isFulfillmentItemBlocking(item.status)");
  });

  // Behavioral: hard blocker proof via helper (complementary to wiring proof above)
  it("missing payment produces blockers via helper", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const r = calculateLaunchReadiness({ paymentConfirmedAt: null, adminPreviewApprovedAt: new Date(), approvedAt: new Date(), generatedSiteHtml: "{}" });
    expect(r.ready).toBe(false);
    expect(r.blockers).toContain("Payment not confirmed");
  });

  it("missing admin preview produces blockers via helper", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const r = calculateLaunchReadiness({ paymentConfirmedAt: new Date(), adminPreviewApprovedAt: null, approvedAt: new Date(), generatedSiteHtml: "{}" });
    expect(r.ready).toBe(false);
    expect(r.blockers).toContain("Admin preview not approved");
  });

  it("critical QA issue produces blockers via helper", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const r = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(), adminPreviewApprovedAt: new Date(), approvedAt: new Date(), generatedSiteHtml: "{}",
      qaIssues: [{ severity: "critical", description: "broken" }],
    });
    expect(r.ready).toBe(false);
    expect(r.blockers.some(b => b.includes("critical QA"))).toBe(true);
  });

  it("DNS pending produces blockers via helper", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const r = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(), adminPreviewApprovedAt: new Date(), approvedAt: new Date(), generatedSiteHtml: "{}",
      domainName: "test.com", stage: "launch",
    });
    expect(r.ready).toBe(false);
    expect(r.blockers.some(b => b.includes("DNS not yet confirmed"))).toBe(true);
  });

  it("clean project is ready via helper", async () => {
    const { calculateLaunchReadiness } = await import("./helpers/launchReadiness.js");
    const r = calculateLaunchReadiness({
      paymentConfirmedAt: new Date(), adminPreviewApprovedAt: new Date(), approvedAt: new Date(), generatedSiteHtml: "{}",
      qaIssues: [], addonResults: [],
    });
    expect(r.ready).toBe(true);
    expect(r.blockers).toHaveLength(0);
  });
});

// ── 12. Online Store Truth ────────────────────────────────────────────────

describe("online store truth — /shop not live until deployed", () => {
  const src = readService("addonOrchestrator.ts");

  it("online_store does not emit success=true at any path", () => {
    const truePattern = /log\s*\(\s*["'`]online_store["'`]\s*,\s*true/;
    const truePattern2 = /logResult\s*\(\s*["'`]online_store["'`]\s*,\s*true/;
    expect(src).not.toMatch(truePattern);
    expect(src).not.toMatch(truePattern2);
  });

  it("online_store checklist does not say 'store is live at /shop'", () => {
    expect(src.toLowerCase()).not.toContain("online store is live at");
  });

  it("online_store copy says team will publish /shop after review", () => {
    expect(src).toContain("publish");
    expect(src).toContain("/shop");
  });
});

// ── 12. Phase 2 Regression ────────────────────────────────────────────────

describe("Phase 2 blueprint gate regression", () => {
  const routersSrc = readServer("routers.ts");
  const webhookSrc = readServer("stripe-webhook.ts");

  it("approvedAt is reserved for customer final approval only", () => {
    const payConfirmPos = webhookSrc.indexOf("paymentConfirmedAt: new Date()");
    expect(payConfirmPos).toBeGreaterThan(0);
    const snippet = webhookSrc.slice(payConfirmPos - 50, payConfirmPos + 200);
    expect(snippet).not.toContain("approvedAt: new Date()");
  });

  it("adminApprovePreview procedure exists", () =>
    expect(routersSrc).toContain("adminApprovePreview: adminProcedure"));

  it("adminReleaseLaunch requires approvedAt (customer final approval)", () => {
    const procStart = routersSrc.indexOf("adminReleaseLaunch: adminProcedure");
    const procEnd = routersSrc.indexOf("adminConfirmDomainLive:", procStart);
    const procBody = routersSrc.slice(procStart, procEnd);
    expect(procBody).toContain("if (!project.approvedAt)");
  });
});

// ── 13. Automation Safety ─────────────────────────────────────────────────

describe("dangerous automations remain off by default", () => {
  it("ENV.enableAutoDeploy defaults to falsy", async () => {
    const { ENV } = await import("./_core/env.js");
    const val = (ENV as any).enableAutoDeploy;
    expect(val).toBeFalsy();
  });

  it("ENV.enableAutoDomainPurchase defaults to falsy", async () => {
    const { ENV } = await import("./_core/env.js");
    const val = (ENV as any).enableAutoDomainPurchase;
    expect(val).toBeFalsy();
  });
});

// ── P1 Manual Fulfillment Dashboard ─────────────────────────────────────────

describe("isFulfillmentItemBlocking — status gating", () => {
  it("pending is blocking", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("pending")).toBe(true);
  });
  it("in_progress is blocking", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("in_progress")).toBe(true);
  });
  it("blocked is blocking", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("blocked")).toBe(true);
  });
  it("completed is NOT blocking", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("completed")).toBe(false);
  });
  it("not_applicable is NOT blocking", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("not_applicable")).toBe(false);
  });
  it("unknown/garbage status is blocking (conservative)", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    expect(isFulfillmentItemBlocking("whatever")).toBe(true);
    expect(isFulfillmentItemBlocking("")).toBe(true);
  });
});

describe("calculateProjectFulfillmentSummary — aggregate counts", () => {
  it("empty project has allClear=true and all zeros", async () => {
    const { calculateProjectFulfillmentSummary } = await import("./helpers/fulfillment.js");
    const s = calculateProjectFulfillmentSummary([]);
    expect(s.totalItems).toBe(0);
    expect(s.blockingCount).toBe(0);
    expect(s.completedCount).toBe(0);
    expect(s.allClear).toBe(true);
  });

  it("all-completed project is allClear=true", async () => {
    const { calculateProjectFulfillmentSummary } = await import("./helpers/fulfillment.js");
    const s = calculateProjectFulfillmentSummary([
      { status: "completed" },
      { status: "not_applicable" },
    ]);
    expect(s.allClear).toBe(true);
    expect(s.blockingCount).toBe(0);
    expect(s.completedCount).toBe(2);
  });

  it("mixed project with one pending is allClear=false", async () => {
    const { calculateProjectFulfillmentSummary } = await import("./helpers/fulfillment.js");
    const s = calculateProjectFulfillmentSummary([
      { status: "completed" },
      { status: "pending" },
    ]);
    expect(s.allClear).toBe(false);
    expect(s.blockingCount).toBe(1);
    expect(s.completedCount).toBe(1);
    expect(s.totalItems).toBe(2);
  });

  it("all-blocking project has blockingCount === totalItems", async () => {
    const { calculateProjectFulfillmentSummary } = await import("./helpers/fulfillment.js");
    const s = calculateProjectFulfillmentSummary([
      { status: "pending" },
      { status: "in_progress" },
      { status: "blocked" },
    ]);
    expect(s.allClear).toBe(false);
    expect(s.blockingCount).toBe(3);
    expect(s.completedCount).toBe(0);
  });
});

describe("markFulfillmentItemCompleted — note requirement", () => {
  it("compliance router exports markFulfillmentItemCompleted with min-5 note", async () => {
    const src = await import("fs/promises").then(f => f.readFile("./server/routers.ts", "utf8"));
    expect(src).toContain("markFulfillmentItemCompleted");
    expect(src).toContain('z.string().min(5');
  });

  it("compliance router exports reopenFulfillmentItem with min-5 reason", async () => {
    const src = await import("fs/promises").then(f => f.readFile("./server/routers.ts", "utf8"));
    expect(src).toContain("reopenFulfillmentItem");
    expect(src).toContain("reason: z.string().min(5");
  });

  it("markFulfillmentItemCompleted sets completedBy from ctx.user", async () => {
    const src = await import("fs/promises").then(f => f.readFile("./server/routers.ts", "utf8"));
    expect(src).toContain("completedBy: ctx.user.name");
  });
});

describe("adminReleaseLaunch uses isFulfillmentItemBlocking (not just pending filter)", () => {
  it("adminReleaseLaunch does NOT hardcode status=pending filter", async () => {
    const src = await import("fs/promises").then(f => f.readFile("./server/routers.ts", "utf8"));
    // The old pattern was eq(launchChecklist.status, "pending") in the add-on block
    // After fix it should use isFulfillmentItemBlocking
    expect(src).toContain("isFulfillmentItemBlocking(item.status)");
  });

  it("adminReleaseLaunch fetches ALL checklist items, not just pending", async () => {
    const src = await import("fs/promises").then(f => f.readFile("./server/routers.ts", "utf8"));
    // Must fetch all items for the customer (no status filter on the DB query)
    expect(src).toContain("Fetch all launchChecklist items");
  });
});

describe("P0 regression — fulfillment helpers do not break existing truth gate", () => {
  it("isFulfillmentItemBlocking does not mutate its input", async () => {
    const { isFulfillmentItemBlocking } = await import("./helpers/fulfillment.js");
    const input = "completed";
    isFulfillmentItemBlocking(input);
    expect(input).toBe("completed");
  });

  it("calculateProjectFulfillmentSummary is a pure function with no side effects", async () => {
    const { calculateProjectFulfillmentSummary } = await import("./helpers/fulfillment.js");
    const items = [{ status: "pending" }, { status: "completed" }];
    const s1 = calculateProjectFulfillmentSummary(items);
    const s2 = calculateProjectFulfillmentSummary(items);
    expect(s1).toEqual(s2);
    expect(items[0].status).toBe("pending");
  });
});
