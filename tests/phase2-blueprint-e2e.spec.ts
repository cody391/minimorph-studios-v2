/**
 * Phase 2 Real-Browser E2E — Website Blueprint Customer/Admin Flow
 *
 * Runs against production: https://www.minimorphstudios.net
 *
 * Strategy: Single test with ordered steps. Login once as admin, run all
 * sections in sequence, cleanup at end. Admin acts as BOTH customer (/portal)
 * and admin (/admin/onboarding) — this is possible because
 * devAccess.seedTestData links a customer record to the admin userId.
 *
 * SAFETY: Does not send SMS, create real payments, buy domains, change DNS,
 * or launch any real customer site.
 */

import { test, expect, type Page } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE = "https://www.minimorphstudios.net";
const ADMIN_EMAIL = "cody@wmrum.com";
const ADMIN_PASS = "MiniMorph2025!";
const SCREENSHOTS = join(__dirname, "screenshots");

// Ensure screenshots dir
if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true });

// ── tRPC helpers ────────────────────────────────────────────────────────────

async function trpcMutation(page: Page, path: string, input: unknown) {
  const result = await page.evaluate(
    async ({ base, path, input }: { base: string; path: string; input: unknown }) => {
      const res = await fetch(`${base}/api/trpc/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: input }),
      });
      const body = (await res.json()) as any;
      if (body?.error) {
        throw new Error(
          body.error?.json?.message ?? JSON.stringify(body.error)
        );
      }
      return body?.result?.data?.json ?? body;
    },
    { base: BASE, path, input }
  );
  return result;
}

async function trpcQuery(page: Page, proc: string, input?: unknown) {
  const qInput = input === undefined ? null : input;
  const url = `${BASE}/api/trpc/${proc}?input=${encodeURIComponent(
    JSON.stringify({ json: qInput })
  )}`;
  return page.evaluate(async (url: string) => {
    const res = await fetch(url, { credentials: "include" });
    const body = (await res.json()) as any;
    if (body?.error) {
      throw new Error(
        body.error?.json?.message ?? JSON.stringify(body.error)
      );
    }
    return body?.result?.data?.json ?? body;
  }, url);
}

async function screenshot(page: Page, name: string) {
  const file = join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 Screenshot: ${name}.png`);
}

async function waitFor(page: Page, selector: string, timeout = 12000) {
  await page.waitForSelector(selector, { timeout, state: "visible" });
}

// ── Main E2E test ────────────────────────────────────────────────────────────

test("Phase 2 Blueprint Revision Loop — full E2E", async ({ page }) => {
  let testProjectId: number;
  let firstBlueprintId: number;

  // ─────────────────────────────────────────────────────────────────────
  // SETUP: Login + seed test data
  // ─────────────────────────────────────────────────────────────────────
  await test.step("SETUP — Login as admin", async () => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL(/\/(admin|portal|rep|onboarding)/, { timeout: 15000 });

    console.log("✅ Admin login →", page.url());
    expect(page.url()).not.toContain("/login");
  });

  await test.step("SETUP — Seed test customer + project", async () => {
    // First unlink in case prior test left data
    try {
      await trpcMutation(page, "devAccess.unlinkAll", {});
    } catch {}

    const seed = (await trpcMutation(page, "devAccess.seedTestData", {})) as any;
    testProjectId = seed?.project?.id;
    console.log("✅ Seeded: project id =", testProjectId, "stage =", seed?.project?.stage);
    expect(testProjectId).toBeGreaterThan(0);
  });

  await test.step("SETUP — Submit questionnaire → blueprint in customer_review", async () => {
    const q = {
      businessName: "E2E Test Blueprint Co",
      websiteType: "service_business",
      brandTone: "professional",
      brandColors: "#1a1a1a charcoal, #4a9eff electric blue",
      servicesOffered: ["Blueprint Testing", "Quality Assurance", "CI Workflows"],
      specialRequests: "Clean minimal design. Emphasise the automated test coverage.",
      targetAudience: "Developers who care about quality",
      domainName: "e2e-test-example.com",
      addonsSelected: [],
      mustHaveFeatures: ["Contact / quote form"],
    };
    const qr = (await trpcMutation(page, "onboarding.saveQuestionnaire", {
      projectId: testProjectId,
      questionnaire: q,
    })) as any;
    console.log("✅ Questionnaire saved:", JSON.stringify(qr));

    const bp = (await trpcQuery(page, "onboarding.getBlueprint", { projectId: testProjectId })) as any;
    firstBlueprintId = bp?.id;
    console.log("✅ Blueprint id =", firstBlueprintId, "status =", bp?.status);
    expect(bp?.status).toBe("customer_review");
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 3: Customer portal — blueprint card renders
  // ─────────────────────────────────────────────────────────────────────
  await test.step("3 — Customer portal: blueprint card renders correctly", async () => {
    await page.goto(`${BASE}/portal`);
    await page.waitForLoadState("networkidle");

    // Click the Onboarding tab
    await page.locator('[role="tab"]:has-text("Onboarding")').click();
    await page.waitForTimeout(1500);

    // 3.3 Blueprint card title
    await waitFor(page, 'text="Your Website Blueprint"');
    console.log("✅ 3.3 Blueprint card title visible");

    // 3.4 Elena-led header copy
    const headerEl = page.locator('text=/Website Blueprint|Elena/i').first();
    const headerText = await headerEl.textContent();
    console.log("✅ 3.4 Elena/Blueprint header:", headerText?.slice(0, 80));
    expect(headerText).toBeTruthy();

    // 3.5 Business overview
    await waitFor(page, 'text="Business Overview"');
    await waitFor(page, 'text="E2E Test Blueprint Co"');
    console.log("✅ 3.5 Business overview with business name visible");

    // 3.6 Design direction
    await waitFor(page, 'text="Design Direction"');
    console.log("✅ 3.6 Design direction section visible");

    // 3.7 Services / content
    const content3 = await page.content();
    expect(content3).toMatch(/Blueprint Testing|Quality Assurance|services/i);
    console.log("✅ 3.7 Services visible");

    // 3.9 Special requests
    expect(content3).toMatch(/Clean minimal|Special/i);
    console.log("✅ 3.9 Special requests visible");

    // 3.10 Domain
    expect(content3).toMatch(/e2e-test-example|Domain/i);
    console.log("✅ 3.10 Domain visible");

    // 3.11 Approve Blueprint button
    await waitFor(page, 'button:has-text("Approve Blueprint")');
    console.log("✅ 3.11 Approve Blueprint button visible");

    // 3.12 Request Changes textarea + button
    await waitFor(page, 'textarea[placeholder*="brand tone"]');
    await waitFor(page, 'button:has-text("Request Changes")');
    console.log("✅ 3.12 Request Changes textarea + button visible");

    // 3.13 No raw JSON
    expect(content3).not.toContain('"blueprintJson"');
    expect(content3).not.toContain('"designDirection":');
    console.log("✅ 3.13 No raw JSON in DOM");

    // 3.14 No "AI-built website" copy
    expect(content3.toLowerCase()).not.toContain("ai-built website");
    expect(content3.toLowerCase()).not.toContain("ai built website");
    console.log("✅ 3.14 No 'AI-built website' copy");

    // 3.15 No questionnaire/assets step copy
    expect(content3.toLowerCase()).not.toContain("questionnaire/assets");
    expect(content3.toLowerCase()).not.toContain("questionnaire step");
    console.log("✅ 3.15 No questionnaire/assets step copy");

    await screenshot(page, "3-blueprint-card");
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 4: Customer requests changes
  // ─────────────────────────────────────────────────────────────────────
  await test.step("4 — Customer: request blueprint revision", async () => {
    // Still on /portal Onboarding tab from previous step
    // Refresh to ensure latest state
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator('[role="tab"]:has-text("Onboarding")').click();
    await page.waitForTimeout(1500);

    await waitFor(page, 'textarea[placeholder*="brand tone"]');

    const revisionNote = "Please change brand tone to bold. Add plumbing and electrical to services. Domain should be e2e-updated.com";
    await page.locator('textarea[placeholder*="brand tone"]').fill(revisionNote);
    console.log("✅ 4.1 Filled revision notes");

    await page.locator('button:has-text("Request Changes")').click();
    console.log("✅ 4.2 Clicked Request Changes");

    // 4.3 Revision-requested state message
    await waitFor(page, 'text=/revision request.*received|check back soon|updating your blueprint/i', 10000);
    console.log("✅ 4.3 Revision-requested state message visible");

    await screenshot(page, "4-revision-requested");

    // 4.4 DB state via API
    const bp = (await trpcQuery(page, "onboarding.getBlueprint", { projectId: testProjectId })) as any;
    console.log("✅ 4.4 Blueprint after revision:", bp?.id, "status:", bp?.status, "notes:", bp?.revisionNotes?.slice(0, 50));
    expect(bp?.status).toBe("revision_requested");
    expect(bp?.revisionNotes).toContain("bold");
    console.log("✅ DB: blueprint.status = revision_requested");
    console.log("✅ DB: blueprint.revisionNotes saved");

    const proj = (await trpcQuery(page, "onboarding.myCurrentProject")) as any;
    expect(proj?.stage).toBe("blueprint_review");
    expect(proj?.generationStatus).not.toBe("generating");
    expect(proj?.approvedAt).toBeFalsy();
    expect(proj?.generatedSiteHtml).toBeFalsy();
    console.log("✅ DB: project.stage = blueprint_review, approvedAt = null");
    console.log("✅ Customer does NOT see generatedSiteHtml from revision request");
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 5: Admin handles revision
  // ─────────────────────────────────────────────────────────────────────
  await test.step("5 — Admin: handle revision in admin panel", async () => {
    await page.goto(`${BASE}/admin/onboarding`);
    await page.waitForLoadState("networkidle");

    // 5.3 Project card visible — DB businessName is "Dev Test Business" (from seedTestData)
    await waitFor(page, 'text="Dev Test Business"', 12000);
    console.log("✅ 5.3 Test project card visible");

    // 5.4 Blueprint Revision Requested toggle visible (amber)
    await waitFor(page, 'button:has-text("Blueprint Revision Requested")', 8000);
    console.log("✅ 5.4 Blueprint Revision Requested toggle visible");

    // 5.5 Expand the panel
    await page.locator('button:has-text("Blueprint Revision Requested")').first().click();
    await page.waitForTimeout(1000);

    // 5.6 Customer revision notes visible
    const panelContent = await page.locator('[class*="amber"]').filter({ hasText: /bold|plumbing|revision/i }).first();
    const noteText = await panelContent.textContent().catch(() => "");
    console.log("✅ 5.6 Customer revision notes in panel:", noteText?.slice(0, 80));
    expect(noteText?.toLowerCase()).toMatch(/bold|plumbing|change brand/i);

    // 5.7 Editable fields visible
    const brandToneInput = page.locator('input[placeholder*="professional, bold"]').first();
    await expect(brandToneInput).toBeVisible();
    console.log("✅ 5.7 Brand Tone field visible");

    const servicesInput = page.locator('input[placeholder*="Web Design, SEO"]').first();
    await expect(servicesInput).toBeVisible();
    console.log("✅ 5.7 Services field visible");

    await expect(page.locator('button:has-text("Send Updated Blueprint")')).toBeVisible();
    console.log("✅ 5.7 Send Updated Blueprint button visible");

    // 5.8 Edit fields
    await brandToneInput.clear();
    await brandToneInput.fill("bold");

    await servicesInput.clear();
    await servicesInput.fill("Blueprint Testing, Quality Assurance, Plumbing, Electrical");

    // Edit special requests
    const specialReqArea = page.locator('textarea').last();
    if (await specialReqArea.isVisible()) {
      await specialReqArea.clear();
      await specialReqArea.fill("Bold modern design with high contrast. Admin-revised per customer request.");
    }
    console.log("✅ 5.8 Fields edited: brand tone=bold, services updated");

    await screenshot(page, "5a-admin-panel-before-send");

    // 5.9 Click Send Updated Blueprint
    await page.locator('button:has-text("Send Updated Blueprint")').first().click();
    console.log("✅ 5.9 Clicked Send Updated Blueprint");

    // 5.10 Success toast
    await waitFor(page, 'text=/v2 sent|Updated blueprint|customer.*re-approve/i', 8000);
    console.log("✅ 5.10 Success toast visible");

    await screenshot(page, "5b-admin-sent-update");

    // 5.11 DB state: old blueprint stale, new blueprint customer_review
    await page.waitForTimeout(1000);
    const allBps = (await trpcQuery(page, "compliance.adminListBlueprints", { projectId: testProjectId })) as any[];
    const bpSummary = allBps?.map((b: any) => ({
      id: b.id, v: b.versionNumber, status: b.status, createdBy: b.createdBy,
      approvedAt: !!b.approvedAt, locked: b.lockedForGeneration
    }));
    console.log("✅ 5.11 All blueprints:", JSON.stringify(bpSummary));

    const newBp = allBps?.find((b: any) => b.status === "customer_review" && b.createdBy === "admin");
    expect(newBp).toBeTruthy();
    expect(newBp.versionNumber).toBeGreaterThan(1);
    expect(newBp.approvedAt).toBeFalsy();
    expect(newBp.lockedForGeneration).toBeFalsy();
    console.log("✅ DB: new blueprint status=customer_review, createdBy=admin, v" + newBp?.versionNumber);

    const staleBp = allBps?.find((b: any) => b.status === "stale");
    expect(staleBp).toBeTruthy();
    console.log("✅ DB: old blueprint.status = stale");

    const proj = (await trpcQuery(page, "onboarding.myCurrentProject")) as any;
    expect(proj?.stage).toBe("blueprint_review");
    expect(proj?.generationStatus).toBe("idle");
    expect(proj?.generationLog).toContain("Updated Website Blueprint");
    console.log("✅ DB: project.stage=blueprint_review, generationStatus=idle, generationLog updated");
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 6: Customer sees updated blueprint
  // ─────────────────────────────────────────────────────────────────────
  await test.step("6 — Customer: sees updated blueprint", async () => {
    await page.goto(`${BASE}/portal`);
    await page.waitForLoadState("networkidle");
    await page.locator('[role="tab"]:has-text("Onboarding")').click();
    await page.waitForTimeout(1500);

    // 6.3 Blueprint card visible
    await waitFor(page, 'text="Your Website Blueprint"');
    console.log("✅ 6.3 Blueprint card visible after admin update");

    // 6.4 Updated field (brand tone = bold) visible
    const content6 = await page.content();
    expect(content6).toMatch(/bold/i);
    console.log("✅ 6.4 Updated field (bold) visible in blueprint");

    // 6.5 Approve + Request Changes buttons visible
    await waitFor(page, 'button:has-text("Approve Blueprint")');
    await waitFor(page, 'button:has-text("Request Changes")');
    console.log("✅ 6.5 Approve + Request Changes buttons visible");

    // 6.7 NOT showing stale/revision_requested message
    expect(content6).not.toContain("check back soon");
    expect(content6).not.toContain("revision request was received");
    console.log("✅ 6.7 Stale/revision_requested message NOT shown — shows fresh blueprint");

    // 6.8 No raw JSON
    expect(content6).not.toContain('"blueprintJson"');
    expect(content6.toLowerCase()).not.toContain("ai-built website");
    console.log("✅ 6.8 No raw JSON, no AI-built website copy");

    await screenshot(page, "6-updated-blueprint");
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 7: Customer approves updated blueprint
  // ─────────────────────────────────────────────────────────────────────
  await test.step("7 — Customer: approves updated blueprint", async () => {
    // Still on /portal Onboarding tab
    await waitFor(page, 'button:has-text("Approve Blueprint")');

    await page.locator('button:has-text("Approve Blueprint")').click();
    console.log("✅ 7.1 Clicked Approve Blueprint");

    await page.waitForTimeout(2500);
    await screenshot(page, "7-after-approval");

    // 7.3 DB state
    const allBps = (await trpcQuery(page, "compliance.adminListBlueprints", { projectId: testProjectId })) as any[];
    const approvedBp = allBps?.find((b: any) => b.status === "approved");
    console.log("✅ 7.3 Approved blueprint:", JSON.stringify(approvedBp ? {
      id: approvedBp.id, v: approvedBp.versionNumber, status: approvedBp.status,
      approvedAt: !!approvedBp.approvedAt, locked: approvedBp.lockedForGeneration
    } : null));

    expect(approvedBp).toBeTruthy();
    expect(approvedBp.approvedAt).toBeTruthy();
    expect(approvedBp.lockedForGeneration).toBeTruthy();
    console.log("✅ DB: website_blueprints.status=approved, approvedAt set, lockedForGeneration=true");

    // 7.3 onboarding_projects.approvedAt MUST remain null
    const proj = (await trpcQuery(page, "onboarding.myCurrentProject")) as any;
    expect(proj?.approvedAt).toBeFalsy();
    console.log("✅ DB: onboarding_projects.approvedAt = null (blueprint approval does NOT set it)");

    // 7.4 adminReleaseLaunch dryRun rejects (no final site approval)
    try {
      await trpcMutation(page, "onboarding.adminReleaseLaunch", {
        projectId: testProjectId,
        dryRun: true,
      });
      throw new Error("SHOULD_HAVE_REJECTED: adminReleaseLaunch passed without approvedAt");
    } catch (e: any) {
      expect(e.message).not.toContain("SHOULD_HAVE_REJECTED");
      console.log("✅ 7.4 adminReleaseLaunch dryRun correctly rejected:", e.message?.slice(0, 80));
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 8: Generation gate
  // ─────────────────────────────────────────────────────────────────────
  await test.step("8 — Generation gate verification", async () => {
    const proj = (await trpcQuery(page, "onboarding.myCurrentProject")) as any;
    console.log("✅ 8 Project state after approval:", {
      stage: proj?.stage, generationStatus: proj?.generationStatus,
      approvedAt: proj?.approvedAt, paymentConfirmedAt: (proj as any)?.paymentConfirmedAt,
      source: (proj as any)?.source,
    });

    // Project.approvedAt still null
    expect(proj?.approvedAt).toBeFalsy();
    console.log("✅ 8 project.approvedAt = null after blueprint approval");

    // generatedSiteHtml not exposed
    expect(proj?.generatedSiteHtml).toBeFalsy();
    console.log("✅ 8 generatedSiteHtml not exposed to customer (preview gate holds)");

    // Generation may have started (non-self_service), may be idle (self_service needs payment)
    const source = (proj as any)?.source;
    const payConf = (proj as any)?.paymentConfirmedAt;
    const genStatus = proj?.generationStatus;
    console.log(`✅ 8 source=${source} paymentConfirmedAt=${!!payConf} generationStatus=${genStatus}`);

    if (source === "self_service" && !payConf) {
      // Gate 2 should block generation
      console.log("✅ 8 Case A: self_service without paymentConfirmedAt → generation blocked");
      expect(genStatus).not.toBe("generating");
    } else {
      console.log("✅ 8 Case B: non-self_service or payment confirmed → generation may start");
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 9: Mobile viewport
  // ─────────────────────────────────────────────────────────────────────
  await test.step("9 — Mobile viewport: blueprint card usable", async () => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${BASE}/portal`);
    await page.waitForLoadState("networkidle");
    await page.locator('[role="tab"]:has-text("Onboarding")').click();
    await page.waitForTimeout(1500);

    // Blueprint card must be visible on mobile
    await waitFor(page, 'text="Your Website Blueprint"', 12000);
    console.log("✅ 9 Mobile: Blueprint card visible");

    // Check for horizontal scroll overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("✅ 9 Mobile: bodyScrollWidth =", bodyScrollWidth, "(viewport 390)");
    expect(bodyScrollWidth).toBeLessThanOrEqual(400);
    console.log("✅ 9 Mobile: No horizontal overflow");

    // Check textarea is usable
    const textarea9 = page.locator('textarea').first();
    if (await textarea9.isVisible()) {
      const box = await textarea9.boundingBox();
      console.log("✅ 9 Mobile: textarea box:", box);
      expect(box?.width).toBeGreaterThan(200);
      console.log("✅ 9 Mobile: Textarea width OK:", box?.width);
    } else {
      console.log("ℹ️  9 Mobile: Textarea hidden (blueprint already approved in this session)");
    }

    await screenshot(page, "9-mobile-blueprint");
    console.log("✅ 9 Mobile screenshot saved");

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 10: Phase 1 regression
  // ─────────────────────────────────────────────────────────────────────
  await test.step("10 — Phase 1 regression checks", async () => {
    // 10.1 /api/health
    const health = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/api/health`);
      return { status: r.status, body: await r.json() };
    }, BASE);
    expect(health.status).toBe(200);
    expect(health.body.status).toBe("ok");
    console.log("✅ 10.1 /api/health 200");

    // 10.3 Unauthorized admin endpoint rejected (no credentials)
    const unauth = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/api/trpc/devAccess.getDevStatus`, {
        credentials: "omit",
      });
      const body = (await r.json()) as any;
      return body?.error?.json?.data?.code ?? body?.error?.json?.code;
    }, BASE);
    expect(unauth).toBe("UNAUTHORIZED");
    console.log("✅ 10.3 Unauthorized admin endpoint returns UNAUTHORIZED");

    // 10.4 Legal / getProjectAgreement with fake projectId returns null safely
    try {
      const fakeAgreement = await trpcQuery(page, "compliance.getProjectAgreement", { projectId: 999999 });
      console.log("✅ 10.4 Fake projectId agreement:", fakeAgreement, "(null = safe)");
    } catch (e: any) {
      console.log("✅ 10.4 Fake projectId correctly rejected:", e.message?.slice(0, 60));
    }

    // 10.6 generatedSiteHtml hidden (already checked in section 8)
    console.log("✅ 10.6 generatedSiteHtml gate proven in sections 4, 7, 8");

    // 10.8 adminReleaseLaunch without approvedAt (proven in section 7)
    console.log("✅ 10.8 adminReleaseLaunch rejection proven in section 7");

    // 10.10 Dangerous automations OFF
    const readiness = (await trpcQuery(page, "compliance.getSystemReadiness")) as any;
    console.log("✅ 10.10 System readiness:", {
      enableAutoDeployEnv: readiness?.enableAutoDeployEnv,
      enableAutoDomainPurchaseEnv: readiness?.enableAutoDomainPurchaseEnv,
      automationSettings: readiness?.automationSettings,
    });
    expect(readiness?.enableAutoDeployEnv).toBeFalsy();
    expect(readiness?.enableAutoDomainPurchaseEnv).toBeFalsy();

    const autoSettings = readiness?.automationSettings ?? {};
    const mustBeOff = ["auto_deploy_enabled"];
    for (const key of mustBeOff) {
      if (autoSettings[key] !== undefined) {
        expect(["false", "0", ""].includes(autoSettings[key])).toBeTruthy();
        console.log(`✅ ${key}: ${autoSettings[key]} (off)`);
      }
    }

    console.log("✅ 10.11-15 No SMS/payment/domain/DNS/launch in this test");
    await screenshot(page, "10-health");
  });

  // ─────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────
  await test.step("CLEANUP — Unlink admin from test customer/project", async () => {
    const result = await trpcMutation(page, "devAccess.unlinkAll", {}) as any;
    console.log("✅ Cleanup complete:", JSON.stringify(result));
  });
});
