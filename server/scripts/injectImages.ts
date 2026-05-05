import "dotenv/config";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getBestImage } from "../services/imageService";
import { ENV } from "../_core/env";

const execFileAsync = promisify(execFile);

const SITES = [
  { projectName: "mm-showroom-hammerstone-builds",  imageType: "contractor", primaryColor: "#e07b39" },
  { projectName: "mm-showroom-driftwood-kitchen",   imageType: "restaurant", primaryColor: "#c8934a" },
  { projectName: "mm-showroom-gritmill-fitness",    imageType: "gym",        primaryColor: "#00d4ff" },
  { projectName: "mm-showroom-velvet-vine-studio",  imageType: "salon",      primaryColor: "#c9a84c" },
  { projectName: "mm-showroom-clover-and-thistle",  imageType: "boutique",   primaryColor: "#2d4a2d" },
  { projectName: "mm-showroom-ember-oak-coffee",    imageType: "coffee",     primaryColor: "#c47a2a" },
];

// Slot order matches the SVG gradient order in the generated HTML
const SLOTS = ["hero", "gallery", "gallery", "gallery", "about"] as const;

// Cost per image by provider
const COST: Record<string, number> = {
  "Nano Banana 2": 0.067,
  "Replicate":     0.003,
  "SVG":           0,
};

interface ImageResult {
  url: string;
  provider: "Nano Banana 2" | "Replicate" | "SVG" | "unknown";
  valid: boolean;
  durationMs: number;
}

interface SiteReport {
  projectName: string;
  imagesGenerated: number;
  imagesTotals: number;
  providers: Record<string, number>;
  estimatedCost: number;
  durationMs: number;
  deployed: boolean;
  deployUrl?: string;
}

function detectProvider(url: string): ImageResult["provider"] {
  if (url.startsWith("data:image/svg")) return "SVG";
  if (url.includes("replicate.delivery")) return "Replicate";
  // Gemini returns either R2 URL or data:image/jpeg base64
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/png")) return "Nano Banana 2";
  // R2/CDN URL (from Gemini upload)
  if (url.startsWith("https://")) return "Nano Banana 2";
  return "unknown";
}

async function isUrlReachable(url: string): Promise<boolean> {
  if (url.startsWith("data:")) return true;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function getLatestDeploymentUrl(projectName: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/pages/projects/${projectName}/deployments?per_page=1`,
      { headers: { Authorization: `Bearer ${ENV.cloudflareApiToken}` } },
    );
    const data = (await res.json()) as any;
    const url = data.result?.[0]?.url;
    if (url) return url;
  } catch { /* fall through */ }
  return `https://${projectName}.pages.dev`;
}

async function fetchCurrentHtml(projectName: string): Promise<string> {
  const deployUrl = await getLatestDeploymentUrl(projectName);
  console.log(`  → Fetching HTML from ${deployUrl}`);
  const res = await fetch(deployUrl, {
    headers: { "User-Agent": "MiniMorph-ImageInjector/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${deployUrl}`);
  const html = await res.text();
  if (html.length < 500)
    throw new Error(
      `Suspiciously short HTML (${html.length} bytes) — deploy may not be live yet`,
    );
  return html;
}

function findSvgGradients(html: string): string[] {
  const matches: string[] = [];
  const re = /data:image\/svg\+xml,[^"'\s>]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

// Returns all real image URLs embedded in img src attributes (used by force-replace mode)
function findAllImages(html: string): string[] {
  const matches: string[] = [];
  const re = /src=["'](https:\/\/[^"'\s>]+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

// Always replaces the first remaining occurrence (n=0) after each swap so
// duplicates are handled correctly even as the string mutates.
function replaceFirst(haystack: string, needle: string, replacement: string): string {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return haystack;
  return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length);
}

async function deployHtml(projectName: string, html: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mm-inject-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "index.html"), html, "utf-8");
    const { stdout, stderr } = await execFileAsync(
      "npx",
      [
        "wrangler@latest",
        "pages",
        "deploy",
        tmpDir,
        "--project-name",
        projectName,
        "--branch",
        "main",
      ],
      {
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: ENV.cloudflareApiToken,
          CLOUDFLARE_ACCOUNT_ID: ENV.cloudflareAccountId,
        },
        timeout: 120000,
      },
    );
    const output = stdout + stderr;
    const match = output.match(/https:\/\/[a-f0-9]+\.[^.\s]+\.pages\.dev/);
    return match?.[0] ?? `https://${projectName}.pages.dev`;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function generateImageWithStats(
  imageType: string,
  slot: string,
  primaryColor: string,
): Promise<ImageResult> {
  const t0 = Date.now();
  const url = await getBestImage(imageType, slot, primaryColor);
  const durationMs = Date.now() - t0;
  const provider = detectProvider(url);
  // Validate non-SVG URLs are actually reachable
  const valid = provider === "SVG" ? false : await isUrlReachable(url);
  return { url, provider, valid, durationMs };
}

async function processSite(site: (typeof SITES)[number], forceReplace: boolean): Promise<SiteReport> {
  const siteStart = Date.now();
  const report: SiteReport = {
    projectName: site.projectName,
    imagesGenerated: 0,
    imagesTotals: 0,
    providers: {},
    estimatedCost: 0,
    durationMs: 0,
    deployed: false,
  };

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Site: ${site.projectName}${forceReplace ? " [FORCE REPLACE]" : ""}`);

  let html: string;
  try {
    html = await fetchCurrentHtml(site.projectName);
  } catch (err: any) {
    console.error(`  ❌ Fetch failed: ${err.message}`);
    report.durationMs = Date.now() - siteStart;
    return report;
  }

  // In force-replace mode, replace all existing image URLs; otherwise SVG placeholders only
  const targets = forceReplace ? findAllImages(html) : findSvgGradients(html);
  report.imagesTotals = targets.length;

  if (targets.length === 0) {
    if (forceReplace) {
      console.log(`  ⚠️  No img src URLs found in HTML — cannot force replace`);
    } else {
      console.log(`  → No SVG gradients — all images already real, skipping`);
    }
    report.durationMs = Date.now() - siteStart;
    return report;
  }

  console.log(`  → Found ${targets.length} image(s) to replace`);

  const count = Math.min(targets.length, SLOTS.length);
  const results: ImageResult[] = [];

  for (let i = 0; i < count; i++) {
    const slot = SLOTS[i];
    if (i > 0) {
      console.log(`  → (pausing 8s between requests...)`);
      await new Promise((r) => setTimeout(r, 8000));
    }
    console.log(`  → [${i + 1}/${count}] Generating ${slot} image...`);
    console.log(`    Replacing: ${targets[i].slice(0, 80)}...`);
    const result = await generateImageWithStats(site.imageType, slot, site.primaryColor);

    if (result.provider === "SVG") {
      console.log(`    ⚠️  ALL providers failed — keeping original`);
      result.url = targets[i]; // keep original rather than SVG gradient
    } else if (!result.valid) {
      console.log(
        `    ⚠️  ${result.provider}: URL not reachable — keeping original`,
      );
      result.url = targets[i];
    } else {
      const urlPreview = result.url.startsWith("data:") ? result.url.slice(0, 40) + "...[base64]" : result.url.slice(0, 80) + "...";
      console.log(
        `    ✅ ${result.provider} (${(result.durationMs / 1000).toFixed(1)}s): ${urlPreview}`,
      );
      report.imagesGenerated++;
      report.providers[result.provider] = (report.providers[result.provider] ?? 0) + 1;
      report.estimatedCost += COST[result.provider] ?? 0;
    }

    results.push(result);
  }

  const anyNew = results.some((r) => r.url !== targets[results.indexOf(r)]);
  if (!anyNew) {
    console.log(`  ⚠️  No images changed — skipping redeployment`);
    report.durationMs = Date.now() - siteStart;
    return report;
  }

  // Replace each target URL with its corresponding new image URL
  let updatedHtml = html;
  for (let i = 0; i < count; i++) {
    updatedHtml = replaceFirst(updatedHtml, targets[i], results[i].url);
  }

  console.log(`  → Deploying updated HTML via wrangler...`);
  try {
    const deployUrl = await deployHtml(site.projectName, updatedHtml);
    console.log(`  ✅ Deployed: ${deployUrl}`);
    report.deployed = true;
    report.deployUrl = deployUrl;
  } catch (err: any) {
    console.error(`  ❌ Deploy failed: ${err.message}`);
  }

  report.durationMs = Date.now() - siteStart;
  return report;
}

async function main() {
  const siteLimitEnv = process.env.SITE_LIMIT
    ? parseInt(process.env.SITE_LIMIT, 10)
    : SITES.length;
  const sitesToProcess = SITES.slice(0, siteLimitEnv);
  const forceReplace = process.env.FORCE_REPLACE === "true";

  console.log("═══════════════════════════════════════");
  console.log("MiniMorph Showroom — Image Injection");
  console.log("═══════════════════════════════════════");
  console.log(`Gemini key     : ${ENV.geminiApiKey      ? "✅ present" : "❌ missing"}`);
  console.log(`Replicate key  : ${ENV.replicateApiKey   ? "✅ present" : "❌ missing"}`);
  console.log(`Unsplash key   : ${ENV.unsplashAccessKey ? "✅ present" : "❌ missing"}`);
  console.log(`CF account     : ${ENV.cloudflareAccountId ? "✅ present" : "❌ missing"}`);
  console.log(`R2 bucket      : ${ENV.cloudflareR2Bucket  ? "✅ " + ENV.cloudflareR2Bucket : "❌ missing (images stored as data URLs)"}`);
  console.log(`Sites to inject: ${sitesToProcess.length} of ${SITES.length}`);
  console.log(`Force replace  : ${forceReplace ? "✅ YES — replacing ALL existing image URLs" : "❌ no — SVG placeholders only"}`);
  console.log("");

  if (!ENV.geminiApiKey && !ENV.replicateApiKey && !ENV.unsplashAccessKey) {
    console.error("❌ No image provider available. Set GEMINI_API_KEY or REPLICATE_API_KEY.");
    process.exit(1);
  }

  const reports: SiteReport[] = [];

  for (let i = 0; i < sitesToProcess.length; i++) {
    const report = await processSite(sitesToProcess[i], forceReplace);
    reports.push(report);
    if (i < sitesToProcess.length - 1) {
      console.log(`\n  (waiting 15s before next site...)`);
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  // ── Final report ─────────────────────────────────────────────────────────────
  const totalImages = reports.reduce((s, r) => s + r.imagesGenerated, 0);
  const totalCost   = reports.reduce((s, r) => s + r.estimatedCost, 0);
  const totalTime   = reports.reduce((s, r) => s + r.durationMs, 0);

  console.log("\n═══════════════════════════════════════");
  console.log("INJECTION COMPLETE");
  console.log("═══════════════════════════════════════");

  for (const r of reports) {
    const providerStr = Object.entries(r.providers)
      .map(([p, n]) => `${p}×${n}`)
      .join(", ") || "none";
    const status = r.deployed ? "✅" : (r.imagesTotals === 0 ? "⏭ " : "❌");
    console.log(
      `${status} ${r.projectName.replace("mm-showroom-", "")}` +
        ` | ${r.imagesGenerated}/${r.imagesTotals} images` +
        ` | ${providerStr}` +
        ` | $${r.estimatedCost.toFixed(3)}` +
        ` | ${(r.durationMs / 1000).toFixed(0)}s`,
    );
    if (r.deployUrl) console.log(`     → ${r.deployUrl}`);
  }

  console.log("───────────────────────────────────────");
  console.log(
    `Total: ${totalImages} images | $${totalCost.toFixed(3)} estimated | ${(totalTime / 1000).toFixed(0)}s`,
  );
  console.log("");
  sitesToProcess.forEach((s) => console.log(`  https://${s.projectName}.pages.dev`));
}

main().catch(console.error);
