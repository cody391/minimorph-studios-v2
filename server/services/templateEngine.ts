import * as fs from "fs";
import * as path from "path";
import { ENV } from "../_core/env";

export interface SiteBrief {
  businessName: string;
  businessType: string;
  brandTone: string;
  packageTier: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  serviceArea: string;
  yearsInBusiness: string;
  ownerName: string;
  licenseNumber?: string;
  uniqueDifferentiator?: string;
  servicesOffered: string[];
  targetCustomer?: string;
  testimonials: Array<{ quote: string; name: string; context: string }>;
  competitiveIntel?: string;
  imageDirection?: string;
  appUrl?: string;
  subNiche?: string;
}

// ── Template selection ────────────────────────────────────────────────────────
// Returns a relative template path, or null if no hand-crafted template exists
// for this business type (caller should invoke generateCustomTemplate instead).

export function selectTemplate(businessType: string, brandTone: string): string | null {
  const type = businessType.toLowerCase();
  const tone = brandTone.toLowerCase();

  if (type === "contractor" || type === "construction" || type === "roofing" || type === "plumbing" || type === "electrical") {
    const darkTones = ["bold", "dark", "industrial", "tough", "rugged", "heavy"];
    return darkTones.some(t => tone.includes(t))
      ? "contractor/dark-industrial.html"
      : "contractor/light-professional.html";
  }

  if (type === "restaurant" || type === "bar" || type === "dining") {
    const upscaleTones = ["upscale", "moody", "fine", "fine dining", "elegant", "luxury"];
    return upscaleTones.some(t => tone.includes(t))
      ? "restaurant/moody-upscale.html"
      : "restaurant/warm-casual.html";
  }

  if (type === "gym" || type === "fitness" || type === "crossfit" || type === "yoga") {
    const boldTones = ["bold", "energetic", "dark", "intense", "hardcore"];
    return boldTones.some(t => tone.includes(t))
      ? "gym/bold-energetic.html"
      : "gym/clean-modern.html";
  }

  if (type === "salon" || type === "hair salon" || type === "beauty" || type === "spa" || type === "nail") {
    const luxTones = ["luxury", "editorial", "minimal", "high-end", "upscale", "elegant"];
    return luxTones.some(t => tone.includes(t))
      ? "salon/editorial-luxury.html"
      : "salon/warm-boutique.html";
  }

  if (type === "coffee" || type === "cafe" || type === "coffeeshop" || type === "coffee shop") {
    const artisanTones = ["artisan", "roaster", "dark", "specialty", "craft"];
    return artisanTones.some(t => tone.includes(t))
      ? "coffee/artisan-roaster.html"
      : "coffee/cozy-neighborhood.html";
  }

  if (type === "boutique" || type === "retail" || type === "shop" || type === "store") {
    const minimalTones = ["minimal", "editorial", "modern", "clean", "luxury"];
    return minimalTones.some(t => tone.includes(t))
      ? "boutique/minimal-editorial.html"
      : "boutique/warm-lifestyle.html";
  }

  // No hand-crafted template — signal the caller to generate a custom one
  return null;
}

// ── Package tier gating ───────────────────────────────────────────────────────

const TIER_LEVEL: Record<string, number> = {
  starter: 0,
  growth: 1,
  premium: 2,
  enterprise: 3,
};

export function stripPackageSections(html: string, packageTier: string): string {
  const level = TIER_LEVEL[packageTier.toLowerCase()] ?? 0;

  if (level < 1) {
    html = html.replace(/<!-- IF_GROWTH_PLUS_START -->[\s\S]*?<!-- IF_GROWTH_PLUS_END -->/g, "");
  } else {
    html = html
      .replace(/<!-- IF_GROWTH_PLUS_START -->/g, "")
      .replace(/<!-- IF_GROWTH_PLUS_END -->/g, "");
  }

  if (level < 2) {
    html = html.replace(/<!-- IF_PREMIUM_PLUS_START -->[\s\S]*?<!-- IF_PREMIUM_PLUS_END -->/g, "");
  } else {
    html = html
      .replace(/<!-- IF_PREMIUM_PLUS_START -->/g, "")
      .replace(/<!-- IF_PREMIUM_PLUS_END -->/g, "");
  }

  if (level < 3) {
    html = html.replace(/<!-- IF_ENTERPRISE_START -->[\s\S]*?<!-- IF_ENTERPRISE_END -->/g, "");
  } else {
    html = html
      .replace(/<!-- IF_ENTERPRISE_START -->/g, "")
      .replace(/<!-- IF_ENTERPRISE_END -->/g, "");
  }

  return html;
}

// ── Page list per industry ────────────────────────────────────────────────────

const INDUSTRY_PAGES: Record<string, string[]> = {
  contractor: ["services", "gallery", "about", "quote", "contact"],
  restaurant:  ["menu", "reservations", "about"],
  gym:         ["classes", "about"],
  salon:       ["services", "gallery", "about"],
  coffee:      ["menu", "about"],
  boutique:    ["about"],
  service:     ["services", "quote", "about"],
  // Custom-generated templates get a minimal page set using shared fallbacks
  custom:      ["contact"],
};

function getIndustryDir(templatePath: string): string {
  return templatePath.split("/")[0] ?? "service";
}

export function getPagesForTemplate(templatePath: string, packageTier: string): string[] {
  const dir = getIndustryDir(templatePath);
  const tierLevel = TIER_LEVEL[packageTier.toLowerCase()] ?? 0;
  const allPages = INDUSTRY_PAGES[dir] ?? INDUSTRY_PAGES.service;

  // starter: home + contact (privacy always)
  if (tierLevel < 1) return ["contact"];
  // growth: all industry pages
  return allPages;
}

// ── Nav helpers ───────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  index:        "Home",
  services:     "Services",
  gallery:      "Gallery",
  about:        "About",
  quote:        "Get a Quote",
  contact:      "Contact",
  menu:         "Menu",
  reservations: "Reservations",
  classes:      "Classes",
  privacy:      "Privacy",
};

const INDUSTRY_CTA: Record<string, { href: string; text: string }> = {
  contractor: { href: "quote.html",        text: "Get a Quote" },
  restaurant: { href: "reservations.html", text: "Reserve a Table" },
  gym:        { href: "classes.html",      text: "Book a Class" },
  salon:      { href: "contact.html",      text: "Book Now" },
  coffee:     { href: "menu.html",         text: "View Menu" },
  boutique:   { href: "contact.html",      text: "Shop Now" },
  service:    { href: "quote.html",        text: "Get a Quote" },
  custom:     { href: "contact.html",      text: "Contact Us" },
};

function buildNavLinks(dir: string, pages: string[]): string {
  const allPages = ["index", ...pages];
  return allPages.map(page => {
    const href = page === "index" ? "index.html" : `${page}.html`;
    const label = PAGE_LABELS[page] ?? capitalize(page);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("\n");
}

function buildFooterLinks(dir: string, pages: string[]): string {
  const allPages = ["index", ...pages, "privacy"];
  return allPages.map(page => {
    const href = page === "index" ? "index.html" : page === "privacy" ? "privacy.html" : `${page}.html`;
    const label = PAGE_LABELS[page] ?? capitalize(page);
    return `<li><a href="${href}">${label}</a></li>`;
  }).join("\n");
}

// ── Image pre-resolution ──────────────────────────────────────────────────────

const IMAGE_TOKEN_MAP: Array<[string, string, string | number]> = [
  ["HERO_IMAGE",      "hero",    "hero"],
  ["GALLERY_IMAGE_1", "gallery", 1],
  ["GALLERY_IMAGE_2", "gallery", 2],
  ["GALLERY_IMAGE_3", "gallery", 3],
  ["ABOUT_IMAGE",     "about",   "about"],
  ["TEAM_IMAGE_1",    "team",    1],
] as const;

async function resolveAllImages(
  brief: SiteBrief,
): Promise<Record<string, string>> {
  const { getBestImage } = await import("./imageService");
  const dir = brief.imageDirection;
  const resolved: Record<string, string> = {};

  await Promise.all(
    IMAGE_TOKEN_MAP.map(async ([token, _imageType, slot]) => {
      try {
        resolved[token] = await getBestImage(
          brief.businessType,
          String(slot),
          brief.primaryColor,
          undefined,
          brief.subNiche,
          dir,
        );
      } catch {
        resolved[token] = "";
      }
    }),
  );

  return resolved;
}

// ── Template file resolution ──────────────────────────────────────────────────

function findPageTemplate(
  dir: string,
  pageName: string,
): string | null {
  const templatesRoot = path.join(process.cwd(), "server", "templates");

  // Industry-specific first
  const specific = path.join(templatesRoot, dir, `${pageName}.html`);
  if (fs.existsSync(specific)) return path.join(dir, `${pageName}.html`);

  // Shared fallback
  const shared = path.join(templatesRoot, "shared", `${pageName}.html`);
  if (fs.existsSync(shared)) return path.join("shared", `${pageName}.html`);

  return null;
}

// ── Custom template generation (cache-first, Claude Sonnet fallback) ──────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildCustomTemplatePrompt(brief: SiteBrief): string {
  return `You are an expert web designer. Generate a complete, production-quality, self-contained HTML website homepage for a ${brief.businessType} business.

OUTPUT RULES:
- Output ONLY valid HTML. Start with <!DOCTYPE html>. No markdown, no code fences, no explanation.
- The file must be complete and render correctly on its own.

TOKEN PLACEHOLDERS — use these exact strings; they are replaced at build time:
  BUSINESS_NAME       company name
  PHONE               phone number
  EMAIL               email address
  ADDRESS             street address
  HOURS               business hours
  SERVICE_AREA        city / region served
  YEARS_IN_BUSINESS   years in business (number)
  OWNER_NAME          owner name
  PRIMARY_COLOR       brand hex color  → put in CSS: --primary: PRIMARY_COLOR;
  SECONDARY_COLOR     accent hex color → put in CSS: --secondary: SECONDARY_COLOR;
  HEADLINE            hero headline (5-9 words)
  SUBHEADLINE         hero sub-copy (1-2 sentences)
  TAGLINE             short brand tagline (3-6 words)
  ABOUT_STORY         2-3 paragraph owner story (multi-line)
  META_DESCRIPTION    SEO meta description
  SERVICE_1_DESC      name of offering 1
  SERVICE_2_DESC      name of offering 2
  SERVICE_3_DESC      name of offering 3
  TESTIMONIAL_1       customer quote text
  TESTIMONIAL_1_NAME  customer full name
  TESTIMONIAL_1_CONTEXT  customer context (e.g. "Regular Customer")
  FAQ_1_Q             most-asked question
  FAQ_1_A             answer (2-3 sentences)
  PACKAGE_TIER        tier label (e.g. "Growth")
  HERO_IMAGE          hero background image URL
  GALLERY_IMAGE_1     gallery/feature image 1 URL
  GALLERY_IMAGE_2     gallery/feature image 2 URL
  GALLERY_IMAGE_3     gallery/feature image 3 URL
  ABOUT_IMAGE         about-section owner/team image URL
  NAV_LINKS           <li> elements for nav (inject into <ul class="nav-links">)
  NAV_CTA_HREF        URL for nav CTA button
  NAV_CTA_TEXT        text for nav CTA button
  NAV_FOOTER_LINKS    <li> elements for footer company links

PACKAGE TIER GATING — wrap optional sections with these exact HTML comments:
  <!-- IF_GROWTH_PLUS_START -->
  ... gallery section with GALLERY_IMAGE_1/2/3 ...
  <!-- IF_GROWTH_PLUS_END -->

  <!-- IF_PREMIUM_PLUS_START -->
  ... testimonials section with TESTIMONIAL_1 etc. ...
  <!-- IF_PREMIUM_PLUS_END -->

REQUIRED SECTIONS (in order):
1. <head>: charset, viewport, title (BUSINESS_NAME | ${brief.businessType}), meta description (META_DESCRIPTION), Google Fonts link, inline <style>
2. Sticky nav: logo = BUSINESS_NAME, <ul class="nav-links">NAV_LINKS</ul>, <a href="NAV_CTA_HREF" class="nav-cta">NAV_CTA_TEXT</a>
   CRITICAL: The nav must use exactly this markup. NAV_LINKS is a token that will be replaced with real <li><a href="page.html">Label</a></li> elements at build time. Do NOT hardcode any nav links. Do NOT use #hash anchors. Just put NAV_LINKS inside the ul and nothing else.
3. Full-viewport hero: HERO_IMAGE background with overlay, HEADLINE, SUBHEADLINE, CTA button, trust badge (SERVICE_AREA · YEARS_IN_BUSINESS years)
4. Services/offerings grid: 3 cards — SERVICE_1_DESC, SERVICE_2_DESC, SERVICE_3_DESC with appropriate icons and short copy
5. About section: ABOUT_IMAGE on one side, OWNER_NAME + ABOUT_STORY on other, years badge showing YEARS_IN_BUSINESS
6. <!-- IF_GROWTH_PLUS_START --> Gallery: 3-image grid using GALLERY_IMAGE_1/2/3 <!-- IF_GROWTH_PLUS_END -->
7. <!-- IF_PREMIUM_PLUS_START --> Testimonials: TESTIMONIAL_1 by TESTIMONIAL_1_NAME (TESTIMONIAL_1_CONTEXT) <!-- IF_PREMIUM_PLUS_END -->
8. FAQ: FAQ_1_Q / FAQ_1_A plus 2 hardcoded FAQs relevant to ${brief.businessType}. Accordion with JS toggle.
9. Contact / CTA: PHONE, EMAIL, ADDRESS, HOURS, SERVICE_AREA + simple contact form (name, email, message, submit)
10. Footer: 3-4 columns — brand+TAGLINE, <ul class="footer-links">NAV_FOOTER_LINKS</ul>, contact info (PHONE, EMAIL, ADDRESS), HOURS
    Footer bottom row: © 2025 BUSINESS_NAME. All rights reserved. | PACKAGE_TIER Plan · Built by MiniMorph Studios

CSS REQUIREMENTS:
- :root { --primary: PRIMARY_COLOR; --secondary: SECONDARY_COLOR; --bg: ...; --surface: ...; --text: ...; --muted: ...; --border: ...; }
- All CSS inline in <style> tag — no external CSS files
- Smooth scroll, box-sizing: border-box
- Scroll-triggered fade-in: [data-animate] { opacity:0; transform:translateY(24px); transition: opacity 0.6s, transform 0.6s; }
  [data-animate].visible { opacity:1; transform:translateY(0); }
  Use IntersectionObserver in <script> at bottom of body
- Mobile: hide nav links below 900px (just hide them, no hamburger needed), stack grids to 1 column
- Choose 1-2 Google Fonts that suit a ${brief.businessType} aesthetic
- Design should feel specifically tailored to ${brief.businessType} — colors, typography, layout, and copy style all appropriate for that industry and its customers

BUSINESS CONTEXT (for design decisions):
  Type: ${brief.businessType}
  Tone: ${brief.brandTone}
  Services: ${brief.servicesOffered.slice(0, 3).join(", ")}
  Location: ${brief.serviceArea}
  ${brief.uniqueDifferentiator ? `Differentiator: ${brief.uniqueDifferentiator}` : ""}

Output ONLY the HTML. Begin immediately with <!DOCTYPE html>.`;
}

export async function generateCustomTemplate(brief: SiteBrief): Promise<string> {
  const slug = slugify(brief.businessType);
  const customDir = path.join(process.cwd(), "server", "templates", "custom");
  const cachePath = path.join(customDir, `${slug}.html`);

  // Cache hit — serve instantly without another API call
  if (fs.existsSync(cachePath)) {
    console.log(`[TemplateEngine] Cache hit: custom/${slug}.html`);
    return `custom/${slug}.html`;
  }

  console.log(`[TemplateEngine] No template for '${brief.businessType}' — generating via Claude Sonnet...`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: buildCustomTemplatePrompt(brief) }],
    }),
  });

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  const raw = data?.content?.[0]?.text ?? "";

  // Strip any accidental markdown fences Claude might add
  const stripped = raw
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/,      "")
    .replace(/\s*```$/,      "")
    .trim();

  // Extract starting from <!DOCTYPE html> or <html
  const doctypeMatch = stripped.match(/<!DOCTYPE html>[\s\S]*/i);
  const htmlTagMatch = stripped.match(/<html[\s\S]*/i);
  const html = doctypeMatch?.[0] ?? htmlTagMatch?.[0] ?? stripped;

  if (!html || html.length < 2000) {
    throw new Error(
      `Custom template generation failed for '${brief.businessType}': ` +
      `response too short (${html.length} chars). Raw: ${raw.slice(0, 200)}`,
    );
  }

  // Ensure custom dir exists and write cache
  if (!fs.existsSync(customDir)) {
    fs.mkdirSync(customDir, { recursive: true });
  }

  fs.writeFileSync(cachePath, html, "utf-8");
  console.log(
    `[TemplateEngine] Saved: custom/${slug}.html ` +
    `(${(html.length / 1024).toFixed(1)} KB)`,
  );

  return `custom/${slug}.html`;
}

// ── Claude copy generation ────────────────────────────────────────────────────

export async function generateCopyForTemplate(
  brief: SiteBrief,
): Promise<Record<string, string>> {
  const prompt = `You are writing website copy for a local business. Return ONLY valid JSON — no markdown, no explanation.

Business: ${brief.businessName}
Type: ${brief.businessType}
Tone: ${brief.brandTone}
Owner: ${brief.ownerName}
Location: ${brief.serviceArea}
Services: ${brief.servicesOffered.join(", ")}
Unique differentiator: ${brief.uniqueDifferentiator ?? "quality and reliability"}
Target customer: ${brief.targetCustomer ?? "local homeowners and businesses"}
${brief.competitiveIntel ? `Competitive intel: ${brief.competitiveIntel}` : ""}
${brief.testimonials?.[0] ? `Real testimonial: "${brief.testimonials[0].quote}" — ${brief.testimonials[0].name}` : ""}

Write compelling, specific, non-generic copy. Avoid clichés. Sound human.

Return this exact JSON structure:
{
  "HEADLINE": "5-9 word hero headline (power verb + specific benefit)",
  "SUBHEADLINE": "1-2 sentences expanding on the headline — specific to their market",
  "TAGLINE": "3-6 word brand tagline",
  "ABOUT_STORY": "2-3 paragraph first-person about story from the owner's perspective. Warm, genuine, specific.",
  "META_DESCRIPTION": "155-char SEO meta description with city name and primary service",
  "SERVICE_1_DESC": "Short name for service 1 (3-5 words max)",
  "SERVICE_2_DESC": "Short name for service 2 (3-5 words max)",
  "SERVICE_3_DESC": "Short name for service 3 (3-5 words max)",
  "TESTIMONIAL_1": "${brief.testimonials?.[0]?.quote ?? "Write a realistic 1-2 sentence customer testimonial"}",
  "TESTIMONIAL_1_NAME": "${brief.testimonials?.[0]?.name ?? "Customer Name"}",
  "TESTIMONIAL_1_CONTEXT": "${brief.testimonials?.[0]?.context ?? "Satisfied Customer"}",
  "FAQ_1_Q": "Most common question this business gets",
  "FAQ_1_A": "Clear, helpful 2-3 sentence answer"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  const raw = data?.content?.[0]?.text ?? "{}";

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]) as Record<string, string>;
  } catch {
    return {};
  }
}

// ── Content injection ─────────────────────────────────────────────────────────

export async function injectContentIntoTemplate(
  templatePath: string,
  brief: SiteBrief,
  copy: Record<string, string>,
  resolvedImages: Record<string, string>,
  navLinks: string,
  navCtaHref: string,
  navCtaText: string,
  footerLinks: string,
): Promise<string> {
  const fullPath = path.join(process.cwd(), "server", "templates", templatePath);

  let html = fs.readFileSync(fullPath, "utf-8");

  // Strip package-gated sections
  html = stripPackageSections(html, brief.packageTier);

  // Build the full token map
  const tokens: Record<string, string> = {
    BUSINESS_NAME:       brief.businessName,
    PHONE:               brief.phone,
    EMAIL:               brief.email,
    ADDRESS:             brief.address,
    HOURS:               brief.hours,
    SERVICE_AREA:        brief.serviceArea,
    YEARS_IN_BUSINESS:   brief.yearsInBusiness,
    OWNER_NAME:          brief.ownerName,
    LICENSE_NUMBER:      brief.licenseNumber ?? "",
    PACKAGE_TIER:        capitalizeFirst(brief.packageTier),
    APP_URL_PLACEHOLDER: brief.appUrl ?? "#",
    PRIMARY_COLOR:       brief.primaryColor,
    SECONDARY_COLOR:     brief.secondaryColor,
    SERVICE_1_DESC:      brief.servicesOffered[0] ?? "",
    SERVICE_2_DESC:      brief.servicesOffered[1] ?? "",
    SERVICE_3_DESC:      brief.servicesOffered[2] ?? "",
    NAV_LINKS:           navLinks,
    NAV_CTA_HREF:        navCtaHref,
    NAV_CTA_TEXT:        navCtaText,
    NAV_FOOTER_LINKS:    footerLinks,
    ...resolvedImages,
    ...copy,
  };

  // Replace all content tokens (longest keys first to avoid partial matches)
  const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    html = html.replaceAll(key, tokens[key] ?? "");
  }

  return html;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export async function generateSiteFromTemplate(
  brief: SiteBrief,
): Promise<Record<string, string>> {
  // Resolve the index template — generate a custom one if no hand-crafted match
  const selected = selectTemplate(brief.businessType, brief.brandTone);
  const indexTemplatePath = selected ?? await generateCustomTemplate(brief);

  const dir = getIndustryDir(indexTemplatePath);

  // Get additional pages for this tier
  const additionalPages = getPagesForTemplate(indexTemplatePath, brief.packageTier);

  // Build nav and CTA tokens once
  const navLinks    = buildNavLinks(dir, additionalPages);
  const footerLinks = buildFooterLinks(dir, additionalPages);
  const cta         = INDUSTRY_CTA[dir] ?? INDUSTRY_CTA.custom;

  // Generate copy and images once, shared across all pages
  const [copy, resolvedImages] = await Promise.all([
    generateCopyForTemplate(brief),
    resolveAllImages(brief),
  ]);

  const pages: Record<string, string> = {};

  // Inject index page
  pages["index"] = await injectContentIntoTemplate(
    indexTemplatePath,
    brief,
    copy,
    resolvedImages,
    navLinks,
    cta.href,
    cta.text,
    footerLinks,
  );

  // Inject additional pages
  await Promise.all(
    additionalPages.map(async (pageName) => {
      const pagePath = findPageTemplate(dir, pageName);
      if (!pagePath) return;

      try {
        pages[pageName] = await injectContentIntoTemplate(
          pagePath,
          brief,
          copy,
          resolvedImages,
          navLinks,
          cta.href,
          cta.text,
          footerLinks,
        );
      } catch (err) {
        console.error(`Failed to render page '${pageName}':`, err);
      }
    }),
  );

  // Always include privacy page (shared)
  const privacyPath = findPageTemplate("shared", "privacy");
  if (privacyPath) {
    try {
      pages["privacy"] = await injectContentIntoTemplate(
        privacyPath,
        brief,
        copy,
        resolvedImages,
        navLinks,
        cta.href,
        cta.text,
        footerLinks,
      );
    } catch {
      // privacy page optional
    }
  }

  return pages;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
