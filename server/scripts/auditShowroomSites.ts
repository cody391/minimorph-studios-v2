import "dotenv/config";

const SITES = [
  { name: "hammerstone-builds",  type: "contractor" },
  { name: "driftwood-kitchen",   type: "restaurant" },
  { name: "gritmill-fitness",    type: "gym" },
  { name: "velvet-vine-studio",  type: "salon" },
  { name: "clover-and-thistle",  type: "boutique" },
  { name: "ember-oak-coffee",    type: "coffee" },
];

interface SiteAudit {
  name: string;
  type: string;
  fetchOk: boolean;
  sizeKb: number;
  // Images
  realImages: number;
  svgGradients: number;
  base64Images: number;
  totalImageSlots: number;
  brokenSlots: string[];
  // Structure
  hasTailwind: boolean;
  hasCorruptedScript: boolean;
  hasFooter: boolean;
  hasContactForm: boolean;
  hasNav: boolean;
  hasHero: boolean;
  // Content
  hasH1: boolean;
  hasBodyCopy: boolean;
  hasPhoneOrContact: boolean;
  hasCta: boolean;
}

function auditHtml(html: string, siteName: string): Omit<SiteAudit, "name" | "type" | "fetchOk" | "sizeKb"> {
  // ── Images ────────────────────────────────────────────────────────────────
  const imgTagRe = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  const allImgSrcs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = imgTagRe.exec(html)) !== null) {
    allImgSrcs.push(m[1]);
  }

  // Also check background-image style attributes
  const bgRe = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((m = bgRe.exec(html)) !== null) {
    allImgSrcs.push(m[1]);
  }

  const svgGradients = allImgSrcs.filter(s => s.startsWith("data:image/svg")).length;
  const base64Images = allImgSrcs.filter(s =>
    (s.startsWith("data:image/jpeg") || s.startsWith("data:image/png") || s.startsWith("data:image/webp"))
  ).length;
  const realImages = allImgSrcs.filter(s =>
    s.startsWith("https://") &&
    !s.includes("cdn.tailwindcss.com") &&
    !s.includes("fonts.googleapis") &&
    !s.includes("fonts.gstatic")
  ).length;
  const totalImageSlots = svgGradients + base64Images + realImages;

  // Which slot types are broken (SVG = broken)
  const brokenSlots: string[] = [];
  if (svgGradients > 0) {
    brokenSlots.push(`${svgGradients} SVG gradient${svgGradients > 1 ? "s" : ""}`);
  }
  if (base64Images > 0) {
    brokenSlots.push(`${base64Images} base64 (not R2)`);
  }

  // ── Structure ─────────────────────────────────────────────────────────────
  const hasTailwind = html.includes("tailwindcss.com") || html.includes("tailwind.min.js") || html.includes("tailwind.config");

  // Corrupted script: a <script> tag whose src contains a data URL or r2.dev image URL
  const scriptSrcRe = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let hasCorruptedScript = false;
  while ((m = scriptSrcRe.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith("data:image") || src.includes("r2.dev") || src.includes("replicate.delivery")) {
      hasCorruptedScript = true;
    }
  }

  const hasFooter = /<footer[\s>]/i.test(html);
  const hasContactForm =
    /<form[\s>]/i.test(html) ||
    /contact.*form/i.test(html) ||
    /<input[^>]*type=["']?(?:email|tel|text)["']?/i.test(html);
  const hasNav = /<nav[\s>]/i.test(html) || /<header[\s>]/i.test(html);
  const hasHero =
    /hero/i.test(html) ||
    /<section[^>]*class=["'][^"']*hero[^"']*["']/i.test(html) ||
    /<div[^>]*class=["'][^"']*hero[^"']*["']/i.test(html);

  // ── Content ───────────────────────────────────────────────────────────────
  const hasH1 = /<h1[\s>]/i.test(html);
  // Look for meaningful paragraph text (not just nav items)
  const pTagRe = /<p[^>]*>([^<]{40,})<\/p>/gi;
  const hasBodyCopy = pTagRe.test(html);
  const hasPhoneOrContact =
    /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(html) ||
    /tel:/i.test(html) ||
    /mailto:/i.test(html) ||
    /contact us/i.test(html) ||
    /get in touch/i.test(html);
  const hasCta =
    /<button[\s>]/i.test(html) ||
    /get.*(?:started|quote|estimate)/i.test(html) ||
    /book.*(?:now|appointment|consultation)/i.test(html) ||
    /contact.*(?:us|today)/i.test(html) ||
    /call.*(?:us|now|today)/i.test(html);

  return {
    realImages,
    svgGradients,
    base64Images,
    totalImageSlots,
    brokenSlots,
    hasTailwind,
    hasCorruptedScript,
    hasFooter,
    hasContactForm,
    hasNav,
    hasHero,
    hasH1,
    hasBodyCopy,
    hasPhoneOrContact,
    hasCta,
  };
}

async function fetchSite(projectName: string): Promise<{ html: string; sizeKb: number; ok: boolean }> {
  const url = `https://${projectName}.pages.dev`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MiniMorph-Auditor/1.0" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { html: "", sizeKb: 0, ok: false };
    const html = await res.text();
    const sizeKb = Math.round(html.length / 1024);
    return { html, sizeKb, ok: true };
  } catch {
    return { html: "", sizeKb: 0, ok: false };
  }
}

function tick(val: boolean) { return val ? "✅" : "❌"; }

function printAudit(audit: SiteAudit) {
  const imageStatus = audit.fetchOk
    ? `${audit.realImages}/${audit.totalImageSlots} real | ${audit.svgGradients} SVG gradients | ${audit.base64Images} base64`
    : "fetch failed";

  const sizeLabel = !audit.fetchOk
    ? "N/A"
    : audit.sizeKb > 500
      ? `${audit.sizeKb}KB ⚠️  (heavy — base64 images)`
      : audit.sizeKb > 200
        ? `${audit.sizeKb}KB ⚠️`
        : `${audit.sizeKb}KB ✅`;

  console.log(`\n${audit.name} (${audit.type})`);
  console.log(`  Images:    ${imageStatus}`);
  console.log(`  Structure: ${tick(audit.hasTailwind)} Tailwind | ${tick(!audit.hasCorruptedScript)} Script ok | ${tick(audit.hasFooter)} Footer | ${tick(audit.hasNav)} Nav | ${tick(audit.hasHero)} Hero`);
  console.log(`  Contact:   ${tick(audit.hasContactForm)} Form | ${tick(audit.hasPhoneOrContact)} Phone/email | ${tick(audit.hasCta)} CTA button`);
  console.log(`  Content:   ${tick(audit.hasH1)} H1 | ${tick(audit.hasBodyCopy)} Body copy`);
  console.log(`  Size:      ${sizeLabel}`);
}

async function main() {
  console.log("\n═══════════════════════════════════════");
  console.log("MINIMORPH SHOWROOM AUDIT");
  console.log(`Checked: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════");

  const audits: SiteAudit[] = [];

  await Promise.all(
    SITES.map(async (site) => {
      const projectName = `mm-showroom-${site.name}`;
      process.stdout.write(`  fetching ${projectName}...\n`);
      const { html, sizeKb, ok } = await fetchSite(projectName);

      const audit: SiteAudit = {
        name: site.name,
        type: site.type,
        fetchOk: ok,
        sizeKb,
        ...(ok
          ? auditHtml(html, site.name)
          : {
              realImages: 0, svgGradients: 0, base64Images: 0,
              totalImageSlots: 0, brokenSlots: ["fetch failed"],
              hasTailwind: false, hasCorruptedScript: false,
              hasFooter: false, hasContactForm: false,
              hasNav: false, hasHero: false,
              hasH1: false, hasBodyCopy: false,
              hasPhoneOrContact: false, hasCta: false,
            }),
      };
      audits.push(audit);
    })
  );

  // Sort to match SITES order
  const ordered = SITES.map(s => audits.find(a => a.name === s.name)!);

  console.log("");
  for (const audit of ordered) {
    printAudit(audit);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const live = ordered.filter(a => a.fetchOk);
  const allImagesReal = live.filter(a => a.svgGradients === 0 && a.base64Images === 0);
  const hasSvg = live.filter(a => a.svgGradients > 0);
  const hasBase64 = live.filter(a => a.base64Images > 0);
  const missingFooter = live.filter(a => !a.hasFooter);
  const missingContact = live.filter(a => !a.hasContactForm);
  const missingNav = live.filter(a => !a.hasNav);
  const missingHero = live.filter(a => !a.hasHero);
  const avgSize = live.length ? Math.round(live.reduce((s, a) => s + a.sizeKb, 0) / live.length) : 0;
  const totalSvgs = live.reduce((s, a) => s + a.svgGradients, 0);
  const totalBase64 = live.reduce((s, a) => s + a.base64Images, 0);

  console.log("\n═══════════════════════════════════════");
  console.log("SUMMARY");
  console.log(`  Sites live:              ${live.length}/${ordered.length}`);
  console.log(`  All images real (R2):    ${allImagesReal.length}/${live.length}`);
  console.log(`  Total SVG gradients:     ${totalSvgs}`);
  console.log(`  Total base64 images:     ${totalBase64}`);
  console.log(`  Missing footer:          ${missingFooter.length}/${live.length}`);
  console.log(`  Missing contact form:    ${missingContact.length}/${live.length}`);
  console.log(`  Missing nav/header:      ${missingNav.length}/${live.length}`);
  console.log(`  Missing hero section:    ${missingHero.length}/${live.length}`);
  console.log(`  Average HTML size:       ${avgSize}KB`);
  if (hasSvg.length) {
    console.log(`\n  ⚠️  Sites with SVG gradients:`);
    hasSvg.forEach(a => console.log(`     • ${a.name}: ${a.svgGradients} SVG`));
  }
  if (hasBase64.length) {
    console.log(`\n  ⚠️  Sites with base64 images (heavy):`);
    hasBase64.forEach(a => console.log(`     • ${a.name}: ${a.base64Images} base64 (~${a.sizeKb}KB)`));
  }
  console.log("═══════════════════════════════════════\n");
}

main().catch(console.error);
