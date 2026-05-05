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
  { projectName: "mm-showroom-gritmill-fitness",     imageType: "gym",        primaryColor: "#00d4ff" },
  { projectName: "mm-showroom-velvet-vine-studio",  imageType: "salon",      primaryColor: "#c9a84c" },
  { projectName: "mm-showroom-clover-and-thistle",  imageType: "boutique",   primaryColor: "#2d4a2d" },
  { projectName: "mm-showroom-ember-oak-coffee",    imageType: "coffee",     primaryColor: "#c47a2a" },
];

// Slot order: first SVG = hero, next three = gallery, last = about
const SLOTS = ["hero", "gallery", "gallery", "gallery", "about"] as const;

async function getLatestDeploymentUrl(projectName: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/pages/projects/${projectName}/deployments?per_page=1`,
      { headers: { Authorization: `Bearer ${ENV.cloudflareApiToken}` } }
    );
    const data = await res.json() as any;
    const url = data.result?.[0]?.url;
    if (url) return url;
  } catch { /* fall through */ }
  return `https://${projectName}.pages.dev`;
}

async function fetchCurrentHtml(projectName: string): Promise<string> {
  const deployUrl = await getLatestDeploymentUrl(projectName);
  console.log(`  → Fetching HTML from ${deployUrl}`);
  const res = await fetch(deployUrl, { headers: { "User-Agent": "MiniMorph-ImageInjector/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${deployUrl}`);
  const html = await res.text();
  if (html.length < 500) throw new Error(`Suspiciously short HTML (${html.length} bytes) — deploy may not be live yet`);
  return html;
}

function findSvgGradients(html: string): string[] {
  // Match the full data URI used as an img src value
  const matches: string[] = [];
  const re = /data:image\/svg\+xml,[^"'\s>]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

// Replace the Nth occurrence of `needle` in `haystack` with `replacement`
function replaceNth(haystack: string, needle: string, replacement: string, n: number): string {
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    if (count === n) {
      return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length);
    }
    count++;
    idx += needle.length;
  }
  return haystack; // nth occurrence not found
}

async function deployHtml(projectName: string, html: string): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mm-inject-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "index.html"), html, "utf-8");
    const { stdout, stderr } = await execFileAsync(
      "npx",
      ["wrangler@latest", "pages", "deploy", tmpDir,
       "--project-name", projectName, "--branch", "main"],
      {
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: ENV.cloudflareApiToken,
          CLOUDFLARE_ACCOUNT_ID: ENV.cloudflareAccountId,
        },
        timeout: 120000,
      }
    );
    const output = stdout + stderr;
    const match = output.match(/https:\/\/[a-f0-9]+\.[^.\s]+\.pages\.dev/);
    return match?.[0] ?? `https://${projectName}.pages.dev`;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function processsite(site: typeof SITES[number]): Promise<void> {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Site: ${site.projectName}`);

  let html: string;
  try {
    html = await fetchCurrentHtml(site.projectName);
  } catch (err: any) {
    console.error(`  ❌ Fetch failed: ${err.message}`);
    return;
  }

  const gradients = findSvgGradients(html);
  console.log(`  → Found ${gradients.length} SVG gradient placeholder(s)`);

  if (gradients.length === 0) {
    console.log(`  → No SVG gradients — site may already have real images, skipping`);
    return;
  }

  // Generate images sequentially, one per slot
  const count = Math.min(gradients.length, SLOTS.length);
  const imageUrls: string[] = [];

  for (let i = 0; i < count; i++) {
    const slot = SLOTS[i];
    if (i > 0) {
      console.log(`  → (waiting 12s to avoid Replicate rate limit...)`);
      await new Promise((r) => setTimeout(r, 12000));
    }
    console.log(`  → [${i + 1}/${count}] Generating ${slot} image...`);
    const url = await getBestImage(site.imageType, slot, site.primaryColor);
    const isSvg = url.startsWith("data:image/svg");
    console.log(`    ${isSvg ? "⚠️  fell back to SVG gradient" : "✅ real image: " + url.slice(0, 60) + "..."}`);
    imageUrls.push(url);
  }

  const allSvg = imageUrls.every(u => u.startsWith("data:image/svg"));
  if (allSvg) {
    console.log(`  ⚠️  All images fell back to SVG (Replicate out of credits? Unsplash missing?)`);
    console.log(`     Skipping redeployment — no improvement over current state`);
    return;
  }

  // Replace each gradient occurrence in order. Always replace occurrence 0 (the first
  // remaining match) — after each replacement the needle count in updatedHtml decrements,
  // so n=0 is always the correct next target regardless of duplicate needles.
  let updatedHtml = html;
  for (let i = 0; i < count; i++) {
    updatedHtml = replaceNth(updatedHtml, gradients[i], imageUrls[i], 0);
  }

  console.log(`  → Deploying updated HTML via wrangler...`);
  try {
    const deployUrl = await deployHtml(site.projectName, updatedHtml);
    console.log(`  ✅ Deployed: ${deployUrl}`);
  } catch (err: any) {
    console.error(`  ❌ Deploy failed: ${err.message}`);
  }
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("MiniMorph Showroom — Image Injection");
  console.log("═══════════════════════════════════════");
  console.log(`Replicate key : ${ENV.replicateApiKey  ? "✅ present" : "❌ missing"}`);
  console.log(`Unsplash key  : ${ENV.unsplashAccessKey ? "✅ present" : "❌ missing"}`);
  console.log(`CF account    : ${ENV.cloudflareAccountId ? "✅ present" : "❌ missing"}`);
  if (!ENV.replicateApiKey && !ENV.unsplashAccessKey) {
    console.error("\n❌ No image source available. Set REPLICATE_API_KEY or UNSPLASH_ACCESS_KEY in Railway.");
    process.exit(1);
  }

  for (let i = 0; i < SITES.length; i++) {
    await processsite(SITES[i]);
    if (i < SITES.length - 1) {
      console.log(`\n  (waiting 15s before next site...)`);
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("INJECTION COMPLETE");
  console.log("═══════════════════════════════════════");
  SITES.forEach(s => console.log(`  https://${s.projectName}.pages.dev`));
}

main().catch(console.error);
