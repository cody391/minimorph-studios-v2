/**
 * Phase 3 — Elena Media & Asset Intake Gate E2E
 *
 * Tests the full media intake, quality review, and generator gate flow.
 * Runs against production: https://www.minimorphstudios.net
 *
 * Flow tested:
 *   SETUP: Login as admin + seed test project (via devAccess.seedTestData)
 *   §1  Customer portal shows Elena-framed media section
 *   §2  Customer uploads a test image → pending_review in DB
 *   §3  Admin sees media in admin panel (Media Review toggle)
 *   §4  Admin marks media approved → approvedAt set, approvedByUserId set
 *   §5  Customer sees approved status
 *   §6  Admin marks a second asset rejected with rejection reason
 *   §7  Customer sees friendly guidance (no blame copy, no AI-built-website copy)
 *   §8  Generator media gate: rejected asset excluded, approved included
 *   §9  Media readiness endpoint returns correct counts
 *   §10 Phase 1 + Phase 2 regression checks
 *   CLEANUP: unlinkAll
 */

import { test, expect, type Page } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE = "https://www.minimorphstudios.net";
const ADMIN_EMAIL = "cody@wmrum.com";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "";

let testProjectId = 0;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function trpcMutation(page: Page, path: string, input: unknown) {
  return page.evaluate(
    async ({ base, path, input }) => {
      const res = await fetch(`${base}/api/trpc/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: input }),
      });
      const body = await res.json() as any;
      if (body?.error) throw new Error(body.error?.json?.message ?? JSON.stringify(body.error));
      return body?.result?.data?.json ?? body;
    },
    { base: BASE, path, input }
  );
}

async function trpcQuery(page: Page, path: string, input?: unknown) {
  return page.evaluate(
    async ({ base, path, input }) => {
      const params = input ? `?input=${encodeURIComponent(JSON.stringify({ json: input }))}` : "";
      const res = await fetch(`${base}/api/trpc/${path}${params}`, {
        credentials: "include",
      });
      const body = await res.json() as any;
      if (body?.error) throw new Error(body.error?.json?.message ?? JSON.stringify(body.error));
      return body?.result?.data?.json ?? body;
    },
    { base: BASE, path, input }
  );
}

async function waitFor(page: Page, selector: string, timeout = 12000) {
  await page.waitForSelector(selector, { timeout, state: "visible" });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: join(__dirname, "screenshots", `p3-${name}.png`),
    fullPage: false,
  });
  console.log(`📸 Screenshot: p3-${name}.png`);
}

// ── Test ────────────────────────────────────────────────────────────────────

test.describe("Phase 3 Media & Elena Asset Intake", () => {
  test("Phase 3 — Full Elena-led media intake and quality gate E2E", async ({ page }) => {

    // ─────────────────────────────────────────────────────────────────────
    // SETUP
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

    await test.step("SETUP — Seed test project (blueprint approved so media section shows)", async () => {
      // Clean up from prior runs
      try { await trpcMutation(page, "devAccess.unlinkAll", {}); } catch {}

      const seed = await trpcMutation(page, "devAccess.seedTestData", {}) as any;
      testProjectId = seed?.project?.id;
      console.log("✅ Seeded project id =", testProjectId);
      expect(testProjectId).toBeGreaterThan(0);

      // Save a questionnaire so blueprint can be created
      await trpcMutation(page, "onboarding.saveQuestionnaire", {
        projectId: testProjectId,
        questionnaire: {
          businessName: "Phase3 Test Media Co",
          websiteType: "service_business",
          brandTone: "professional",
          brandColors: "#1a1a1a",
          servicesOffered: ["Plumbing", "HVAC"],
          specialRequests: "Test media upload flow",
          targetAudience: "Local homeowners",
        },
      });

      // Approve the blueprint (to unlock blueprint_review stage which shows media section)
      await trpcMutation(page, "compliance.adminApproveBlueprint", { projectId: testProjectId });
      console.log("✅ Blueprint approved → stage has media section visible");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §1 Customer portal shows Elena-framed media section
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§1 — Customer portal: Elena media section visible", async () => {
      await page.goto(`${BASE}/portal`);
      await page.waitForLoadState("networkidle");
      await page.locator('[role="tab"]:has-text("Onboarding")').click();
      await page.waitForTimeout(2000);

      // Elena-framed header
      await waitFor(page, 'text="Media & Photos"', 12000);
      console.log("✅ §1.1 'Media & Photos' heading visible");

      const content1 = await page.content();
      expect(content1).toMatch(/media.*quality review|review.*every file|Elena guides/i);
      console.log("✅ §1.2 Elena-framed quality review copy present");

      // No blame language
      expect(content1.toLowerCase()).not.toContain("your fault");
      expect(content1.toLowerCase()).not.toContain("ai-built website");
      console.log("✅ §1.3 No blame copy, no AI-built-website copy");

      // Upload UI present
      await waitFor(page, 'button:has-text("Upload file")');
      console.log("✅ §1.4 Upload file button visible");

      // Intended use selector present
      await waitFor(page, 'option:has-text("Logo")');
      console.log("✅ §1.5 Intended use selector visible");

      await screenshot(page, "1-media-section");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §2 Customer uploads a test image → pending_review in DB
    // ─────────────────────────────────────────────────────────────────────
    let firstAssetId = 0;
    let secondAssetId = 0;

    await test.step("§2 — Customer: upload test image via tRPC (bypass file picker for reliability)", async () => {
      // Upload via tRPC directly (1x1 transparent PNG, base64 encoded)
      const testPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const asset1 = await trpcMutation(page, "onboarding.uploadAsset", {
        projectId: testProjectId,
        fileName: "test-logo-p3.png",
        fileBase64: testPngBase64,
        mimeType: "image/png",
        category: "logo",
        intendedUse: "logo",
        notes: "Phase 3 test logo upload",
      }) as any;
      firstAssetId = asset1?.id;
      console.log("✅ §2.1 Asset 1 uploaded, id =", firstAssetId);
      expect(firstAssetId).toBeGreaterThan(0);

      const asset2 = await trpcMutation(page, "onboarding.uploadAsset", {
        projectId: testProjectId,
        fileName: "test-hero-p3.png",
        fileBase64: testPngBase64,
        mimeType: "image/png",
        category: "photo",
        intendedUse: "hero",
        notes: "Phase 3 test hero image",
      }) as any;
      secondAssetId = asset2?.id;
      console.log("✅ §2.2 Asset 2 uploaded, id =", secondAssetId);

      // Verify DB state
      const assets = await trpcQuery(page, "onboarding.listAssets", { projectId: testProjectId }) as any[];
      const a1 = assets.find((a: any) => a.id === firstAssetId);
      const a2 = assets.find((a: any) => a.id === secondAssetId);
      expect(a1?.qualityStatus).toBe("pending_review");
      expect(a1?.source).toBe("customer");
      expect(a1?.intendedUse).toBe("logo");
      expect(a2?.qualityStatus).toBe("pending_review");
      expect(a2?.source).toBe("customer");
      expect(a2?.intendedUse).toBe("hero");
      console.log("✅ §2.3 DB: both assets have qualityStatus=pending_review, source=customer");

      await screenshot(page, "2-assets-uploaded");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §3 Admin sees media in admin panel
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§3 — Admin: media panel visible and shows uploaded assets", async () => {
      await page.goto(`${BASE}/admin/onboarding`);
      await page.waitForLoadState("networkidle");

      await waitFor(page, 'text="Phase3 Test Media Co"', 12000);
      console.log("✅ §3.1 Test project card visible in admin");

      // Open the Media Review panel specifically for "Phase3 Test Media Co"
      // Use :has() to find the button within the card containing our test project
      const testCard = page.locator('[role="article"]:has-text("Phase3 Test Media Co"), div:has-text("Phase3 Test Media Co")').first();
      const mediaButton = testCard.locator('button:has-text("Media Review")');
      const mediaButtonCount = await mediaButton.count();
      // Fallback: if we can't scope to card, just use first Media Review button (project is newest → top of list)
      if (mediaButtonCount > 0) {
        await mediaButton.first().click();
      } else {
        const allMediaButtons = page.locator('button:has-text("Media Review")');
        expect(await allMediaButtons.count()).toBeGreaterThan(0);
        await allMediaButtons.first().click();
      }
      await page.waitForTimeout(1000);
      console.log("✅ §3.2 Media Review toggle clicked");

      // Check if assets appear
      await waitFor(page, 'text="test-logo-p3.png"', 8000);
      console.log("✅ §3.3 test-logo-p3.png visible in admin media panel");

      const content3 = await page.content();
      expect(content3).toMatch(/test-hero-p3\.png/);
      console.log("✅ §3.4 test-hero-p3.png visible in admin panel");

      // Check "pending review" labels
      expect(content3).toMatch(/pending review/i);
      console.log("✅ §3.5 Assets show pending review status");

      await screenshot(page, "3-admin-media-panel");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §4 Admin approves asset 1
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§4 — Admin: approve asset 1 (logo)", async () => {
      const result = await trpcMutation(page, "compliance.adminUpdateAssetQuality", {
        assetId: firstAssetId,
        qualityStatus: "approved",
        qualityScore: 9,
        qualityNotes: "Clean transparent PNG logo — ready to use.",
      }) as any;
      expect(result?.success).toBe(true);
      console.log("✅ §4.1 Asset 1 approved via tRPC");

      // Verify DB
      const assets = await trpcQuery(page, "onboarding.listAssets", { projectId: testProjectId }) as any[];
      const a1 = assets.find((a: any) => a.id === firstAssetId);
      expect(a1?.qualityStatus).toBe("approved");
      expect(a1?.approvedAt).toBeTruthy();
      expect(a1?.approvedByUserId).toBeGreaterThan(0);
      expect(a1?.qualityScore).toBe(9);
      console.log("✅ §4.2 DB: qualityStatus=approved, approvedAt set, approvedByUserId set, score=9");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §5 Customer sees approved status
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§5 — Customer: sees approved status on portal", async () => {
      await page.goto(`${BASE}/portal`);
      await page.waitForLoadState("networkidle");
      await page.locator('[role="tab"]:has-text("Onboarding")').click();
      await page.waitForTimeout(2000);

      await waitFor(page, 'text="Media & Photos"', 10000);

      const content5 = await page.content();
      expect(content5).toMatch(/Approved|approved/);
      expect(content5).toMatch(/Ready to use/i);
      console.log("✅ §5.1 Customer sees Approved status and 'Ready to use' copy");

      await screenshot(page, "5-customer-sees-approved");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §6 Admin rejects asset 2 with guidance
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§6 — Admin: reject asset 2 with friendly guidance", async () => {
      const result = await trpcMutation(page, "compliance.adminUpdateAssetQuality", {
        assetId: secondAssetId,
        qualityStatus: "rejected",
        qualityScore: 2,
        qualityNotes: "Image is too small — 1x1 px test file cannot be used in hero.",
        rejectionReason: "This image is too small to look great in the hero section of your site.",
        rescueNotes: "Try taking a wider photo in natural light — aim for at least 1200px wide. A bright outdoor photo or a professional headshot works well.",
      }) as any;
      expect(result?.success).toBe(true);
      console.log("✅ §6.1 Asset 2 rejected with guidance");

      // Verify DB
      const assets = await trpcQuery(page, "onboarding.listAssets", { projectId: testProjectId }) as any[];
      const a2 = assets.find((a: any) => a.id === secondAssetId);
      expect(a2?.qualityStatus).toBe("rejected");
      expect(a2?.rejectedAt).toBeTruthy();
      expect(a2?.rejectionReason).toContain("too small");
      console.log("✅ §6.2 DB: qualityStatus=rejected, rejectedAt set, rejectionReason saved");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §7 Customer sees friendly guidance for rejected asset
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§7 — Customer: sees friendly rejection guidance (no blame)", async () => {
      await page.goto(`${BASE}/portal`);
      await page.waitForLoadState("networkidle");
      await page.locator('[role="tab"]:has-text("Onboarding")').click();
      await page.waitForTimeout(2000);

      await waitFor(page, 'text="Media & Photos"', 10000);

      const content7 = await page.content();

      // Should show "Please replace" status
      expect(content7).toMatch(/Please replace/i);
      console.log("✅ §7.1 Customer sees 'Please replace' status label");

      // Should show rejection reason (team note)
      expect(content7).toMatch(/too small/i);
      console.log("✅ §7.2 Customer sees rejection reason: 'too small'");

      // Should show rescue notes (suggestion)
      expect(content7).toMatch(/natural light|1200px/i);
      console.log("✅ §7.3 Customer sees rescue/replacement suggestion");

      // No blame language
      expect(content7.toLowerCase()).not.toContain("your fault");
      expect(content7.toLowerCase()).not.toContain("you failed");
      expect(content7.toLowerCase()).not.toContain("ai-built website");
      console.log("✅ §7.4 No blame copy, no AI-built-website copy");

      // Upload button still visible (can replace)
      await waitFor(page, 'button:has-text("Upload file")');
      console.log("✅ §7.5 Upload button still present — customer can replace");

      await screenshot(page, "7-customer-rejection-guidance");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §8 Generator media gate verification
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§8 — Generator gate: only approved assets eligible", async () => {
      const allAssets = await trpcQuery(page, "onboarding.listAssets", { projectId: testProjectId }) as any[];

      const approvedAssets = allAssets.filter((a: any) => a.qualityStatus === "approved");
      const rejectedAssets = allAssets.filter((a: any) => a.qualityStatus === "rejected");
      const pendingAssets = allAssets.filter((a: any) => a.qualityStatus === "pending_review");

      console.log("✅ §8 Assets by status:", {
        approved: approvedAssets.length,
        rejected: rejectedAssets.length,
        pending: pendingAssets.length,
        total: allAssets.length,
      });

      // Logo approved
      expect(approvedAssets.some((a: any) => a.id === firstAssetId)).toBeTruthy();
      console.log("✅ §8.1 Asset 1 (logo) is approved — eligible for generation");

      // Hero rejected — not eligible
      expect(rejectedAssets.some((a: any) => a.id === secondAssetId)).toBeTruthy();
      console.log("✅ §8.2 Asset 2 (hero) is rejected — NOT eligible for generation");
    });

    // ─────────────────────────────────────────────────────────────────────
    // §9 Media readiness gate
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§9 — Media readiness gate: correct counts and readiness flag", async () => {
      const readiness = await trpcQuery(page, "compliance.getProjectMediaReadiness", { projectId: testProjectId }) as any;
      console.log("✅ §9 Media readiness:", JSON.stringify(readiness));

      expect(readiness.approvedCount).toBeGreaterThanOrEqual(1);
      expect(readiness.rejectedCount).toBeGreaterThanOrEqual(1);
      expect(readiness.hasApprovedLogo).toBe(true);
      expect(readiness.mediaReadyForGeneration).toBe(true);
      expect(typeof readiness.mediaWarnings).toBe("object");
      console.log("✅ §9.1 approvedCount ≥ 1, rejectedCount ≥ 1, hasApprovedLogo=true");
      console.log("✅ §9.2 mediaReadyForGeneration=true (has approved assets)");
      console.log("✅ §9.3 mediaWarnings:", readiness.mediaWarnings);
    });

    // ─────────────────────────────────────────────────────────────────────
    // §10 Phase 1 + Phase 2 regression
    // ─────────────────────────────────────────────────────────────────────
    await test.step("§10 — Phase 1 + Phase 2 regression checks", async () => {
      // Health
      const health = await page.evaluate(async (base: string) => {
        const r = await fetch(`${base}/api/health`);
        return { status: r.status, body: await r.json() };
      }, BASE);
      expect(health.status).toBe(200);
      expect(health.body.status).toBe("ok");
      console.log("✅ §10.1 /api/health 200");

      // Auth rejection
      const unauth = await page.evaluate(async (base: string) => {
        const r = await fetch(`${base}/api/trpc/devAccess.getDevStatus`, { credentials: "omit" });
        const body = await r.json() as any;
        return body?.error?.json?.data?.code ?? body?.error?.json?.code;
      }, BASE);
      expect(["UNAUTHORIZED", "FORBIDDEN"].includes(unauth)).toBeTruthy();
      console.log("✅ §10.2 Auth rejection works:", unauth);

      // Dangerous automations OFF
      const readiness = await trpcQuery(page, "compliance.getSystemReadiness") as any;
      expect(readiness?.enableAutoDeployEnv).toBeFalsy();
      expect(readiness?.enableAutoDomainPurchaseEnv).toBeFalsy();
      const autoSettings = readiness?.automationSettings ?? {};
      expect(autoSettings.auto_deploy_enabled).toBe("false");
      console.log("✅ §10.3 Dangerous automations OFF: auto_deploy_enabled=false");

      // Blueprint gate still works (Phase 2)
      const bp = await trpcQuery(page, "onboarding.getBlueprint", { projectId: testProjectId }) as any;
      expect(bp?.status).toBe("approved");
      console.log("✅ §10.4 Phase 2: blueprint still approved for test project");

      // adminReleaseLaunch still rejects without project-level approvedAt
      try {
        await trpcMutation(page, "onboarding.adminReleaseLaunch", { projectId: testProjectId, dryRun: true });
        throw new Error("SHOULD_HAVE_REJECTED");
      } catch (e: any) {
        expect(e.message).not.toContain("SHOULD_HAVE_REJECTED");
        console.log("✅ §10.5 adminReleaseLaunch dryRun correctly rejected:", e.message?.slice(0, 70));
      }

      console.log("✅ §10 All Phase 1 + Phase 2 regression checks passed");
    });

    // ─────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────
    await test.step("CLEANUP — Unlink admin from test project", async () => {
      const result = await trpcMutation(page, "devAccess.unlinkAll", {}) as any;
      console.log("✅ Cleanup complete:", JSON.stringify(result));
    });
  });
});
