/**
 * P0 Launch Truth Gate — Comprehensive Regression Tests
 *
 * Proves every acceptance requirement from the P0 Truth Gate:
 * 1. QA auto-fix engine never returns fake success
 * 2. Nameserver config is single source of truth
 * 3. You're-live email copy is honest
 * 4. All incomplete add-ons emit success=false
 * 5. Booking widget never claims /book page exists
 * 6. Domain live: stage/launchedAt not set before DNS confirmation
 * 7. Temp password never in Stripe metadata
 * 8. Revision limit enforced server-side
 * 9. Admin confirm domain live procedure exists
 * 10. adminReleaseLaunch blocks without customer approvedAt
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

  // These add-ons do zero automated work — they must be success=false
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
  ];

  for (const addon of mustBeFalse) {
    it(`${addon} never emits log("${addon}", true, ...)`, () => {
      // Match log call with success=true for this addon
      const truePattern = new RegExp(`log\\s*\\(\\s*["'\`]${addon}["'\`]\\s*,\\s*true`);
      // Also match logResult call
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
    // In the hasPendingDomain branch, stage should be "launch" not "complete"
    const hasPendingStart = src.indexOf("if (hasPendingDomain)");
    const elseStart = src.indexOf("} else {", hasPendingStart);
    expect(hasPendingStart).toBeGreaterThan(0);
    expect(elseStart).toBeGreaterThan(0);
    const pendingBranch = src.slice(hasPendingStart, elseStart);
    // The pending branch must not set stage: "complete"
    expect(pendingBranch).not.toContain('"complete"');
    // The pending branch must set stage: "launch"
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
    // Find the sessionMeta block
    const metaStart = routersSrc.indexOf("let sessionMeta: Record<string, string>");
    const metaEnd = routersSrc.indexOf("const sessionParams:", metaStart);
    expect(metaStart).toBeGreaterThan(0);
    const metaBlock = routersSrc.slice(metaStart, metaEnd);
    expect(metaBlock).not.toMatch(/password/i);
    expect(metaBlock).not.toMatch(/temp_password/);
    expect(metaBlock).not.toMatch(/tempPassword/);
    expect(metaBlock).not.toMatch(/secret/i);
    // Verify only safe keys are present
    expect(metaBlock).toContain("project_id");
    expect(metaBlock).toContain("package_tier");
  });
});

// ── 8. Revision Limit — Server-Side Enforcement Proven ───────────────────

describe("revision limit — server-side enforcement", () => {
  const routersSrc = readServer("routers.ts");

  it("requestChange procedure exists", () =>
    expect(routersSrc).toContain("requestChange: protectedProcedure"));

  it("revision limit check throws TRPCError when limit reached", () => {
    // Check for the enforcement block
    expect(routersSrc).toContain("revisionsCount || 0) >= (project.maxRevisions || 3)");
    expect(routersSrc).toContain("Maximum revisions reached");
  });

  it("revisionsRemaining is decremented after each revision", () => {
    expect(routersSrc).toContain("newRevisionsRemaining");
    expect(routersSrc).toContain("revisionsRemaining: newRevisionsRemaining");
  });

  it("customer copy does not promise automated paid revision checkout", () => {
    // The email copy should say "reply to request one" (manual), not "$149 checkout"
    // Check customerEmails.ts
    const emailSrc = readService("customerEmails.ts");
    // Verify the copy about paid revisions says "reply" (manual process)
    const revisionSection = emailSrc.match(/revision.*?round.*?available.{0,200}/is)?.[0] ?? "";
    // Should NOT say "pay now" with a direct checkout link for paid revisions
    expect(emailSrc).not.toMatch(/\$149.*checkout.*link|checkout.*\$149.*revision/i);
  });
});

// ── 9. Admin Readiness — Hard Blockers ───────────────────────────────────

describe("admin readiness — hard blockers", () => {
  const routersSrc = readServer("routers.ts");

  it("adminReleaseLaunch throws without customer approvedAt", () => {
    const procStart = routersSrc.indexOf("adminReleaseLaunch: adminProcedure");
    const procEnd = routersSrc.indexOf("adminConfirmDomainLive:", procStart);
    const procBody = routersSrc.slice(procStart, procEnd);
    expect(procBody).toContain("project.approvedAt");
    expect(procBody).toContain("Customer has not yet approved");
  });

  it("adminConfirmDomainLive throws when stage is not launch", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("stage !== \"launch\"");
    expect(confirmBody).toContain("Only launch-stage projects");
  });

  it("adminConfirmDomainLive requires domainName to be set", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("project.domainName");
    expect(confirmBody).toContain("No custom domain to verify");
  });

  it("adminConfirmDomainLive sets stage=complete and launchedAt", () => {
    const confirmStart = routersSrc.indexOf("adminConfirmDomainLive: adminProcedure");
    const confirmEnd = routersSrc.indexOf("// Admin: list site version", confirmStart);
    const confirmBody = routersSrc.slice(confirmStart, confirmEnd);
    expect(confirmBody).toContain("stage: \"complete\"");
    expect(confirmBody).toContain("launchedAt: new Date()");
    expect(confirmBody).toContain("sendSiteLiveEmail");
  });
});

// ── 10. Phase 2 Regression ────────────────────────────────────────────────

describe("Phase 2 blueprint gate regression", () => {
  const routersSrc = readServer("routers.ts");
  const webhookSrc = readServer("stripe-webhook.ts");

  it("approvedAt is reserved for customer final approval only", () => {
    // Payment is confirmed in stripe-webhook.ts, not routers.ts
    // approvedAt must not be set on payment — it's for customer final site approval
    const payConfirmPos = webhookSrc.indexOf("paymentConfirmedAt: new Date()");
    expect(payConfirmPos).toBeGreaterThan(0);
    // Check that within 200 chars of paymentConfirmedAt, approvedAt is not also set
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

// ── 11. Automation Safety ─────────────────────────────────────────────────

describe("dangerous automations remain off by default", () => {
  it("ENV.enableAutoDeploy defaults to falsy", async () => {
    const { ENV } = await import("./_core/env.js");
    // In test environment (no ENABLE_AUTO_DEPLOY env var set), should be falsy
    const val = (ENV as any).enableAutoDeploy;
    expect(val).toBeFalsy();
  });

  it("ENV.enableAutoDomainPurchase defaults to falsy", async () => {
    const { ENV } = await import("./_core/env.js");
    const val = (ENV as any).enableAutoDomainPurchase;
    expect(val).toBeFalsy();
  });
});
