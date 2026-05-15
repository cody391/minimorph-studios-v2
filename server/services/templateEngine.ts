import * as fs from "fs";
import * as path from "path";
import { ENV } from "../_core/env";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  // Elena-sourced fields
  addonsSelected?: Array<{ product: string; price?: string; label?: string }>;
  socialHandles?: { instagram?: string; facebook?: string; tiktok?: string; twitter?: string };
  blogTopics?: string[];
  specialRequests?: string;
  inspirationStyle?: Record<string, string>;
  avoidPatterns?: string[];
  competitorSites?: Array<{ url?: string; whatYouWantToBeat?: string }>;
  competitorWeaknesses?: string[];
  pricingDisplay?: string;
  customerPhotoUrl?: string;
  logoUrl?: string;
  siteUrl?: string;
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

  if (
    type === "ecommerce" || type === "e-commerce" || type === "online store" ||
    type === "online shop" || type === "handmade" || type === "craft" ||
    type === "maker" || type === "artisan shop" || type === "vintage" ||
    type === "goods" || type === "marketplace"
  ) {
    return "ecommerce/catalog.html";
  }

  if (
    type === "service" || type === "services" || type === "service business" ||
    type === "local service" || type === "professional service" || type === "professional services" ||
    type === "agency" || type === "web design" || type === "website design" ||
    type === "website service" || type === "web services" ||
    type === "marketing" || type === "digital marketing" || type === "seo" ||
    type === "consulting" || type === "consultant" || type === "consultancy" ||
    type === "technology" || type === "tech" || type === "saas" || type === "software" ||
    type === "it services" || type === "managed services" ||
    type === "cleaning" || type === "cleaning service" || type === "cleaning services" ||
    type === "janitorial" || type === "maid service" ||
    type === "landscaping" || type === "lawn care" || type === "lawn service" ||
    type === "handyman" || type === "handyman service" || type === "home services" ||
    type === "photography" || type === "videography" || type === "media production" ||
    type === "accounting" || type === "bookkeeping" || type === "cpa" || type === "tax preparation" ||
    type === "insurance" || type === "real estate" || type === "property management" ||
    type === "tutoring" || type === "coaching" || type === "education" ||
    type === "wellness" || type === "nutrition" || type === "catering" ||
    type === "event planning" || type === "pest control" || type === "moving" ||
    type.includes("agency") || type.includes("consult")
  ) {
    const friendlyTones = ["friendly", "local", "warm", "casual", "neighborhood", "community"];
    return friendlyTones.some(t => tone.includes(t))
      ? "service/friendly-local.html"
      : "service/professional.html";
  }

  // No hand-crafted template — signal the caller to generate a custom one
  return null;
}

// ── Package tier gating ───────────────────────────────────────────────────────

const TIER_LEVEL: Record<string, number> = {
  starter: 0,
  growth: 1,
  premium: 2,
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

  // Enterprise tier removed — always strip enterprise-gated blocks
  html = html.replace(/<!-- IF_ENTERPRISE_START -->[\s\S]*?<!-- IF_ENTERPRISE_END -->/g, "");

  return html;
}

// ── Page list per industry ────────────────────────────────────────────────────

const INDUSTRY_PAGES: Record<string, string[]> = {
  contractor: ["services", "gallery", "about", "quote", "contact"],
  restaurant:  ["menu", "reservations", "about"],
  gym:         ["classes", "about", "contact"],
  salon:       ["services", "gallery", "about", "contact"],
  coffee:      ["menu", "about"],
  boutique:    ["contact"],
  ecommerce:   ["product", "about", "contact"],
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
  product:      "Shop",
  privacy:      "Privacy",
};

const INDUSTRY_CTA: Record<string, { href: string; text: string }> = {
  contractor: { href: "quote.html",        text: "Get a Quote" },
  restaurant: { href: "reservations.html", text: "Reserve a Table" },
  gym:        { href: "classes.html",      text: "Book a Class" },
  salon:      { href: "contact.html",      text: "Book Now" },
  coffee:     { href: "menu.html",         text: "View Menu" },
  boutique:   { href: "contact.html",      text: "Shop Now" },
  ecommerce:  { href: "product.html",      text: "Shop Now" },
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
  ["GALLERY_IMAGE_4", "gallery", 4],
  ["GALLERY_IMAGE_5", "gallery", 5],
  ["GALLERY_IMAGE_6", "gallery", 6],
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
9. Contact / CTA: PHONE, EMAIL, ADDRESS, HOURS, SERVICE_AREA + contact form.
   The form MUST use id="contact-form" and submit via JavaScript fetch — NOT a native form POST, NOT Formspree, NOT onsubmit="return false", NOT a mailto link.
   Required form pattern (copy exactly, replace only token strings):
   <form id="contact-form">
     <input name="name" type="text" placeholder="Your Name" required>
     <input name="email" type="email" placeholder="Email Address" required>
     <input name="phone" type="tel" placeholder="Phone Number">
     <textarea name="message" placeholder="How can we help?" required></textarea>
     <button type="submit">Send Message</button>
   </form>
   <script>
   (function(){var f=document.getElementById('contact-form');if(!f)return;
   f.addEventListener('submit',function(e){e.preventDefault();
   var fd=new FormData(f),btn=f.querySelector('button[type=submit]');
   btn.disabled=true;btn.textContent='Sending...';
   fetch('APP_URL_PLACEHOLDER/api/contact-submit',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:fd.get('name'),email:fd.get('email'),
   phone:fd.get('phone'),message:fd.get('message'),businessName:'BUSINESS_NAME'})
   }).then(function(r){return r.json();}).then(function(res){
   if(res.success){f.innerHTML='<p style="text-align:center;padding:2rem">Thanks! We will be in touch within 24 hours.</p>';}
   else{btn.disabled=false;btn.textContent='Send Message';}
   }).catch(function(){btn.disabled=false;btn.textContent='Send Message';});});
   })();
   </script>
10. Footer: 3-4 columns — brand+TAGLINE, <ul class="footer-links">NAV_FOOTER_LINKS</ul>, contact info (PHONE, EMAIL, ADDRESS), HOURS
    Footer bottom row: © 2025 BUSINESS_NAME. All rights reserved. | PACKAGE_TIER Plan · Built by MiniMorph Studios

CSS REQUIREMENTS:
- :root { --primary: PRIMARY_COLOR; --secondary: SECONDARY_COLOR; --bg: ...; --surface: ...; --text: ...; --muted: ...; --border: ...; }
- All CSS inline in <style> tag — no external CSS files
- Smooth scroll, box-sizing: border-box
- Scroll-triggered fade-in: [data-animate] { opacity:0; transform:translateY(24px); transition: opacity 0.6s, transform 0.6s; }
  [data-animate].visible { opacity:1; transform:translateY(0); }
  Use IntersectionObserver in <script> at bottom of body
- Mobile: below 900px, hide nav links and show a visible hamburger button (☰) that toggles them open/closed using a JS click handler. Never hide navigation without a working toggle replacement. Stack grids to 1 column.
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
  const addonList = brief.addonsSelected?.map(a => a.product).join(", ") || "";
  const avoidList = brief.avoidPatterns?.join(", ") || "";
  const inspirationDesc = brief.inspirationStyle
    ? Object.entries(brief.inspirationStyle).map(([k, v]) => `${k}: ${v}`).join(", ")
    : "";

  const prompt = `You are writing website copy for a local business. Return ONLY valid JSON — no markdown, no explanation.

Business: ${brief.businessName}
Type: ${brief.businessType}
Tone: ${brief.brandTone}
Owner: ${brief.ownerName}
Location: ${brief.serviceArea}
Services: ${brief.servicesOffered.join(", ")}
Unique differentiator: ${brief.uniqueDifferentiator ?? "quality and reliability"}
Target customer: ${brief.targetCustomer ?? "local homeowners and businesses"}
${addonList ? `Active add-ons (must be referenced naturally in copy): ${addonList}` : ""}
${brief.specialRequests ? `Special requests from customer: ${brief.specialRequests}` : ""}
${inspirationDesc ? `Design/copy direction customer wants: ${inspirationDesc}` : ""}
${avoidList ? `Patterns the customer explicitly wants to AVOID: ${avoidList}` : ""}
${brief.competitiveIntel ? `Competitive intel: ${brief.competitiveIntel}` : ""}
${brief.competitorWeaknesses?.length ? `Competitor weaknesses to counter: ${brief.competitorWeaknesses.join("; ")}` : ""}
${brief.testimonials?.[0] ? `Real testimonial: "${brief.testimonials[0].quote}" — ${brief.testimonials[0].name}` : ""}

Write compelling, specific, non-generic copy. Avoid clichés. Sound human.

HONESTY RULES (absolute — never break these):
- Do NOT invent member counts, customer counts, satisfaction percentages, or volume claims (e.g. "847+ members", "500 clients").
- Do NOT invent ratings, stars, or review scores.
- Do NOT reference "Best in [city]", "Top-rated", "#1", or any superlative claim.
- Do NOT offer a free trial, discount, guarantee, or promotion unless the customer explicitly provided it.
- TESTIMONIAL fields must use only the real testimonial from the brief. If no testimonial was provided, output empty strings for TESTIMONIAL_1, TESTIMONIAL_1_NAME, TESTIMONIAL_1_CONTEXT.

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
  "TESTIMONIAL_1": "${brief.testimonials?.[0]?.quote ?? ""}",
  "TESTIMONIAL_1_NAME": "${brief.testimonials?.[0]?.name ?? ""}",
  "TESTIMONIAL_1_CONTEXT": "${brief.testimonials?.[0]?.context ?? ""}",
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
  pageName: string = "index",
): Promise<string> {
  const fullPath = path.join(process.cwd(), "server", "templates", templatePath);

  let html = fs.readFileSync(fullPath, "utf-8");

  // Strip package-gated sections
  html = stripPackageSections(html, brief.packageTier);

  const e = escapeHtml;

  // Build the full token map — customer-provided text fields are HTML-escaped
  const tokens: Record<string, string> = {
    BUSINESS_NAME:       e(brief.businessName),
    PHONE:               e(brief.phone),
    EMAIL:               e(brief.email),
    ADDRESS:             e(brief.address),
    HOURS:               e(brief.hours),
    SERVICE_AREA:        e(brief.serviceArea),
    YEARS_IN_BUSINESS:   e(brief.yearsInBusiness),
    OWNER_NAME:          e(brief.ownerName),
    LICENSE_NUMBER:      e(brief.licenseNumber ?? ""),
    PACKAGE_TIER:        capitalizeFirst(brief.packageTier),
    APP_URL_PLACEHOLDER: brief.appUrl ?? "#",
    PRIMARY_COLOR:       brief.primaryColor,
    SECONDARY_COLOR:     brief.secondaryColor,
    SERVICE_1_DESC:      e(brief.servicesOffered[0] ?? ""),
    SERVICE_2_DESC:      e(brief.servicesOffered[1] ?? ""),
    SERVICE_3_DESC:      e(brief.servicesOffered[2] ?? ""),
    SERVICE_4_DESC:      e(brief.servicesOffered[3] ?? brief.servicesOffered[0] ?? ""),
    SERVICE_5_DESC:      e(brief.servicesOffered[4] ?? brief.servicesOffered[1] ?? ""),
    SERVICE_6_DESC:      e(brief.servicesOffered[5] ?? brief.servicesOffered[2] ?? ""),
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

  // ── Logo injection — replace text business name in nav with img tag ───────
  if (brief.logoUrl) {
    const logoImg = `<img src="${brief.logoUrl}" alt="${brief.businessName}" style="max-height:52px;width:auto;object-fit:contain;display:block">`;
    // Replace text-only business name in nav/header contexts (case-insensitive, word-boundary safe)
    html = html
      .replace(/<!-- LOGO_PLACEHOLDER -->/g, logoImg)
      .replace(/src="logo\.png"/g, `src="${brief.logoUrl}"`)
      .replace(/src="logo\.svg"/g, `src="${brief.logoUrl}"`);
  }

  // ── UPGRADE 1: Favicon + OG Tags ─────────────────────────────────────────

  const initials = brief.businessName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${brief.primaryColor}"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
  const faviconUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  const heroImage = resolvedImages["HERO_IMAGE"] || "";
  const ogDesc = copy["META_DESCRIPTION"] || `${brief.servicesOffered.slice(0, 3).join(", ")} in ${brief.serviceArea}`;

  const headTags = `
  <link rel="icon" type="image/svg+xml" href="${faviconUrl}">
  <link rel="apple-touch-icon" href="${faviconUrl}">
  <meta name="theme-color" content="${brief.primaryColor}">
  <meta property="og:title" content="${brief.businessName}">
  <meta property="og:description" content="${ogDesc.replace(/"/g, "&quot;")}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${heroImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${brief.businessName}">
  <meta name="twitter:description" content="${ogDesc.replace(/"/g, "&quot;")}">
  <meta name="twitter:image" content="${heroImage}">`;

  html = html.replace("</head>", headTags + "\n</head>");

  // ── UPGRADE 2: Schema.org JSON-LD ────────────────────────────────────────

  const schemaTypeMap: Record<string, string> = {
    contractor:  "GeneralContractor",
    construction: "GeneralContractor",
    restaurant:  "Restaurant",
    dining:      "Restaurant",
    gym:         "ExerciseGym",
    fitness:     "ExerciseGym",
    salon:       "HairSalon",
    hair:        "HairSalon",
    coffee:      "CafeOrCoffeeShop",
    cafe:        "CafeOrCoffeeShop",
    boutique:    "ClothingStore",
    florist:     "Florist",
    plumb:       "Plumber",
    electr:      "Electrician",
    landscap:    "LandscapingBusiness",
    dental:      "Dentist",
    medical:     "MedicalBusiness",
    legal:       "LegalService",
    law:         "LegalService",
  };

  const schemaType = Object.entries(schemaTypeMap).find(
    ([k]) => brief.businessType.toLowerCase().includes(k),
  )?.[1] ?? "LocalBusiness";

  const yearsNum = parseInt(brief.yearsInBusiness);
  const foundingYear = !isNaN(yearsNum) && yearsNum > 0
    ? new Date().getFullYear() - yearsNum
    : null;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: brief.businessName,
    description: copy["META_DESCRIPTION"] || brief.uniqueDifferentiator,
    telephone: brief.phone,
    email: brief.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: brief.address,
      addressLocality: brief.serviceArea,
    },
    openingHours: brief.hours,
    areaServed: brief.serviceArea,
    founder: { "@type": "Person", name: brief.ownerName },
    priceRange: "$$",
    image: heroImage,
  };
  if (foundingYear !== null) {
    schema.foundingDate = String(foundingYear);
  }

  html = html.replace(
    "</head>",
    `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n</head>`,
  );

  // ── UPGRADE 3: Unique page titles + meta descriptions ────────────────────

  const pageTitleMap: Record<string, string> = {
    index:        `${brief.businessName} | ${brief.serviceArea}`,
    services:     `Services | ${brief.businessName}`,
    gallery:      `Our Work | ${brief.businessName}`,
    about:        `About Us | ${brief.businessName}`,
    contact:      `Contact | ${brief.businessName}`,
    quote:        `Free Quote | ${brief.businessName}`,
    menu:         `Menu | ${brief.businessName}`,
    reservations: `Reserve a Table | ${brief.businessName}`,
    classes:      `Classes & Schedule | ${brief.businessName}`,
    privacy:      `Privacy Policy | ${brief.businessName}`,
  };

  const pageTitle = pageTitleMap[pageName] ?? `${brief.businessName} | ${brief.serviceArea}`;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${pageTitle}</title>`);

  const pageDescMap: Record<string, string> = {
    index:        ogDesc,
    services:     `${brief.servicesOffered.join(", ")} — ${brief.serviceArea}. Call ${brief.phone}.`,
    gallery:      `Portfolio of work from ${brief.businessName}. Serving ${brief.serviceArea}.`,
    about:        `Meet ${brief.ownerName} and the team at ${brief.businessName} in ${brief.serviceArea}.`,
    contact:      `Contact ${brief.businessName}. Call ${brief.phone} or email ${brief.email}.`,
    quote:        `Get a free quote from ${brief.businessName}. Serving ${brief.serviceArea}.`,
    menu:         `Full menu from ${brief.businessName} in ${brief.serviceArea}.`,
    reservations: `Reserve your table at ${brief.businessName}. Call ${brief.phone}.`,
    privacy:      `Privacy Policy — ${brief.businessName}.`,
  };

  const pageDesc = pageDescMap[pageName] || ogDesc;
  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${pageDesc.replace(/"/g, "&quot;")}">`,
  );

  // ── UPGRADE 4: Canonical URL ──────────────────────────────────────────────

  const siteSlugForCanonical = brief.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const canonicalBase = brief.siteUrl || `https://${siteSlugForCanonical}.${ENV.minimorphSitesDomain}`;
  const canonicalUrl = pageName === "index"
    ? `${canonicalBase}/`
    : `${canonicalBase}/${pageName}.html`;

  if (!html.includes('rel="canonical"')) {
    html = html.replace("</head>", `<link rel="canonical" href="${canonicalUrl}">\n</head>`);
  }

  // ── UPGRADE 5: Performance — preconnects + lazy images ───────────────────

  const preconnects = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://pub-6f98c2c8984f43689b878bcb4a58de09.r2.dev">`;

  if (!html.includes("fonts.googleapis.com")) {
    html = html.replace("<head>", "<head>" + preconnects);
  }

  let firstImg = true;
  html = html.replace(/<img([^>]+)>/gi, (match, attrs: string) => {
    if (attrs.includes("loading=")) return match;
    if (firstImg) {
      firstImg = false;
      return `<img${attrs} loading="eager" fetchpriority="high" decoding="async">`;
    }
    return `<img${attrs} loading="lazy" decoding="async">`;
  });

  // ── UPGRADE 6: lang attribute ─────────────────────────────────────────────

  if (!html.includes("<html lang")) {
    html = html.replace(/^<html>$/m, '<html lang="en">');
    html = html.replace(/<html(?![^>]*\blang\b)([^>]*)>/, '<html lang="en"$1>');
  }

  // ── UPGRADE 7: Skip-to-main accessibility link ────────────────────────────

  if (!html.includes("skip-link") && !html.includes("Skip to")) {
    const skipLink = `<a href="#main-content" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;background:#fff;color:#000;padding:0.75rem 1.5rem;z-index:99999;text-decoration:none;font-weight:600" onfocus="this.style.left='0';this.style.width='auto';this.style.height='auto'" onblur="this.style.left='-9999px'">Skip to main content</a>`;
    html = html.replace("<body>", "<body>" + skipLink);
  }

  // ── UPGRADE 8: Cookie consent banner ─────────────────────────────────────

  if (!html.includes("mm-cookie")) {
    const cookieBanner = `
<div id="mm-cookie" role="dialog" aria-label="Cookie consent" style="position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,10,0.97);color:#fff;padding:1.25rem 5%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;z-index:9997;font-size:0.875rem;border-top:1px solid rgba(255,255,255,0.1);transform:translateY(100%);transition:transform 0.4s ease">
  <p style="margin:0;max-width:600px;opacity:0.85;line-height:1.6">We use cookies to improve your experience. By continuing to use this site you agree to our <a href="privacy.html" style="color:${brief.primaryColor};text-decoration:underline">Privacy Policy</a>.</p>
  <button id="mm-cookie-btn" style="background:${brief.primaryColor};color:#fff;border:none;padding:0.75rem 1.75rem;font-weight:700;font-size:0.875rem;cursor:pointer;white-space:nowrap;letter-spacing:0.05em">Accept &amp; Close</button>
</div>
<script>
(function(){
  try{if(localStorage.getItem('mmck'))return;}catch(e){}
  var b=document.getElementById('mm-cookie');
  if(!b)return;
  setTimeout(function(){b.style.transform='translateY(0)'},1500);
  document.getElementById('mm-cookie-btn').addEventListener('click',function(){
    try{localStorage.setItem('mmck','1');}catch(e){}
    b.style.transform='translateY(100%)';
  });
})();
</script>`;
    html = html.replace("</body>", cookieBanner + "\n</body>");
  }

  // ── UPGRADE 9: Back-to-top button ─────────────────────────────────────────

  if (!html.includes("mm-top")) {
    const backToTop = `
<button id="mm-top" aria-label="Back to top" style="position:fixed;bottom:6rem;right:1.5rem;width:44px;height:44px;border-radius:50%;background:${brief.primaryColor};color:#fff;border:none;cursor:pointer;font-size:1.25rem;font-weight:700;opacity:0;transition:opacity 0.3s;z-index:500;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center" onclick="window.scrollTo({top:0,behavior:'smooth'})">&#8593;</button>
<script>
(function(){
  var b=document.getElementById('mm-top');
  if(!b)return;
  window.addEventListener('scroll',function(){
    b.style.opacity=window.scrollY>500?'1':'0';
  },{passive:true});
})();
</script>`;
    html = html.replace("</body>", backToTop + "\n</body>");
  }

  // ── UPGRADE 10: Print styles ──────────────────────────────────────────────

  if (!html.includes("@media print")) {
    const printStyles = `<style media="print">
nav,footer,#mm-banner,#mm-cookie,#mm-top,
.mm-banner,button[type="submit"]{display:none!important}
body{color:#000!important;background:#fff!important}
a{color:#000!important;text-decoration:underline}
img{max-width:100%!important;page-break-inside:avoid}
h1,h2,h3{page-break-after:avoid}
</style>`;
    html = html.replace("</head>", printStyles + "\n</head>");
  }

  // ── UPGRADE 11: Mobile hamburger nav overlay ──────────────────────────────
  // Universal mobile nav that works regardless of the underlying template
  // structure. Injects a fixed hamburger button (visible only on mobile) and
  // a full-screen overlay with all nav links and the primary CTA.

  if (!html.includes("mm-hamburger")) {
    const safeNavCta = escapeHtml(navCtaText);
    const safeNavCtaHref = navCtaHref.replace(/"/g, "&quot;");
    const mobileNav = `
<style>
#mm-hamburger{display:none;position:fixed;top:12px;right:12px;z-index:9500;background:${brief.primaryColor};color:#fff;border:none;border-radius:8px;padding:10px 14px;font-size:20px;line-height:1;cursor:pointer;min-width:44px;min-height:44px;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25)}
#mm-nav-overlay{display:none;position:fixed;inset:0;z-index:9400;background:rgba(10,10,10,0.97);flex-direction:column;align-items:center;justify-content:center;gap:0;overflow-y:auto}
#mm-nav-overlay.mm-open{display:flex}
#mm-nav-close{position:absolute;top:16px;right:16px;background:transparent;border:none;color:#fff;font-size:28px;line-height:1;cursor:pointer;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center}
#mm-nav-links-mobile a{display:block;color:#fff;text-decoration:none;font-size:1.4rem;font-weight:600;padding:16px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08)}
#mm-nav-links-mobile a:hover{background:rgba(255,255,255,0.07)}
#mm-nav-cta-mobile{display:inline-block;margin-top:28px;background:${brief.primaryColor};color:#fff;text-decoration:none;font-size:1.1rem;font-weight:700;padding:14px 36px;border-radius:50px}
@media(max-width:900px){#mm-hamburger{display:flex}}
</style>
<button id="mm-hamburger" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mm-nav-overlay">&#9776;</button>
<div id="mm-nav-overlay" role="dialog" aria-modal="true" aria-label="Navigation">
  <button id="mm-nav-close" aria-label="Close navigation menu">&#10005;</button>
  <nav id="mm-nav-links-mobile">
    ${navLinks.replace(/<li>/g, "").replace(/<\/li>/g, "").replace(/<ul[^>]*>/g, "").replace(/<\/ul>/g, "")}
  </nav>
  <a href="${safeNavCtaHref}" class="mm-nav-cta-mobile" id="mm-nav-cta-mobile">${safeNavCta}</a>
</div>
<script>
(function(){
  var btn=document.getElementById('mm-hamburger');
  var overlay=document.getElementById('mm-nav-overlay');
  var close=document.getElementById('mm-nav-close');
  if(!btn||!overlay)return;
  function open(){overlay.classList.add('mm-open');btn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
  function close_(){overlay.classList.remove('mm-open');btn.setAttribute('aria-expanded','false');document.body.style.overflow='';}
  btn.addEventListener('click',open);
  if(close)close.addEventListener('click',close_);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close_();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&overlay.classList.contains('mm-open'))close_();});
  overlay.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close_);});
})();
</script>`;
    html = html.replace("</body>", mobileNav + "\n</body>");
  }

  return html;
}

// ── Addon widget injection ────────────────────────────────────────────────────
// Appends purchased addon widgets to the index page before </main> or </body>.
// Each addon Elena sells maps to a self-contained HTML widget block.

function buildAddonWidgets(brief: SiteBrief): string {
  const addons = brief.addonsSelected || [];
  if (!addons.length) return "";

  const primary = brief.primaryColor || "#2563eb";
  const secondary = brief.secondaryColor || "#1a1a1a";
  const widgets: string[] = [];

  for (const addon of addons) {
    const name = (addon.product || "").toLowerCase();

    if (name.includes("review") || name.includes("google review")) {
      const reviews = brief.testimonials?.slice(0, 3) || [];
      const cards = reviews.length
        ? reviews.map(t => `
            <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
              <p style="font-style:italic;margin:0 0 10px;color:#333;font-size:15px">"${escapeHtml(t.quote)}"</p>
              <p style="font-weight:600;margin:0;font-size:14px">${escapeHtml(t.name)}</p>
              ${t.context ? `<p style="color:#888;font-size:13px;margin:2px 0 0">${escapeHtml(t.context)}</p>` : ""}
            </div>`).join("")
        : `<div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);text-align:center;max-width:400px;margin:0 auto">
            <p style="font-weight:600;color:#1a1a1a;margin:0 0 8px">Reviews coming soon</p>
            <p style="color:#888;font-size:14px;margin:0 0 0">We&rsquo;d love to hear what you think &mdash; ask us how to get set up on Google!</p>
          </div>`;
      const sectionLabel = reviews.length ? "Customer Reviews" : "Reviews";
      widgets.push(`
<section id="mm-reviews" style="padding:60px 20px;background:#f8f9fa">
  <div style="max-width:900px;margin:0 auto;text-align:center">
    <h2 style="text-align:center;font-size:2rem;font-weight:700;margin:0 0 40px;color:#1a1a1a">${sectionLabel}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px">
      ${cards}
    </div>
  </div>
</section>`);
    }

    if (name.includes("booking") || name.includes("appointment")) {
      const contactPhone = brief.phone || "";
      const contactEmail = brief.email || "";
      widgets.push(`
<section id="mm-booking" style="padding:60px 20px;background:#fff">
  <div style="max-width:480px;margin:0 auto;text-align:center">
    <h2 style="font-size:2rem;font-weight:700;margin:0 0 8px;color:#1a1a1a">Book an Appointment</h2>
    <p style="color:#666;margin:0 0 28px">Ready to get started? Reach out and we'll get you on the schedule.</p>
    <div style="background:#f8f9fa;border-radius:16px;padding:32px;display:flex;flex-direction:column;gap:16px">
      ${contactPhone ? `<a href="tel:${contactPhone}" style="display:flex;align-items:center;justify-content:center;gap:10px;background:${primary};color:#fff;padding:16px 24px;border-radius:10px;font-size:17px;font-weight:600;text-decoration:none">📞 Call to Book — ${contactPhone}</a>` : ""}
      ${contactEmail ? `<a href="mailto:${contactEmail}" style="display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;border:2px solid ${primary};color:${primary};padding:14px 24px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none">✉️ Email Us — ${contactEmail}</a>` : ""}
      <p style="font-size:13px;color:#888;margin:4px 0 0">We typically respond within 2 hours during business hours.</p>
    </div>
  </div>
</section>`);
    }

    if (name.includes("chat") || name.includes("chatbot") || name.includes("ai chat")) {
      widgets.push(`
<div id="mm-chat-widget" style="position:fixed;bottom:24px;right:24px;z-index:9998;font-family:system-ui,sans-serif">
  <div id="mm-chat-box" style="display:none;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.18);width:320px;overflow:hidden;margin-bottom:12px">
    <div style="background:${primary};padding:16px 20px;color:#fff;font-weight:600;display:flex;justify-content:space-between;align-items:center">
      <span>💬 Chat with ${brief.businessName}</span>
      <span id="mm-chat-close" style="cursor:pointer;opacity:0.8;font-size:18px">✕</span>
    </div>
    <div id="mm-chat-msgs" style="padding:16px;min-height:120px;max-height:240px;overflow-y:auto;background:#fafafa">
      <div style="background:#e8f0fe;border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:14px;color:#1a1a1a">Hi! How can I help you today?</div>
    </div>
    <div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px">
      <input id="mm-chat-input" placeholder="Type a message..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none">
      <button id="mm-chat-send" style="padding:10px 16px;background:${primary};color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">→</button>
    </div>
  </div>
  <button id="mm-chat-btn" style="background:${primary};color:#fff;border:none;border-radius:50px;padding:14px 22px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2)">💬 Chat with us</button>
</div>
<script>
(function(){
  var btn=document.getElementById('mm-chat-btn');
  var box=document.getElementById('mm-chat-box');
  var close=document.getElementById('mm-chat-close');
  var send=document.getElementById('mm-chat-send');
  var input=document.getElementById('mm-chat-input');
  var msgs=document.getElementById('mm-chat-msgs');
  if(!btn||!box)return;
  btn.addEventListener('click',function(){box.style.display=box.style.display==='none'?'block':'none';});
  if(close)close.addEventListener('click',function(){box.style.display='none';});
  function addMsg(text,isUser){
    var d=document.createElement('div');
    d.style.cssText='border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:14px;max-width:85%;'+(isUser?'background:${primary};color:#fff;margin-left:auto':'background:#e8f0fe;color:#1a1a1a');
    d.textContent=text;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
  }
  if(send&&input){
    send.addEventListener('click',function(){
      var t=input.value.trim();if(!t)return;
      addMsg(t,true);input.value='';
      setTimeout(function(){addMsg("Thanks for reaching out! A team member will be with you shortly. You can also call us at ${brief.phone || "our number"} for immediate help.",false);},800);
    });
    input.addEventListener('keydown',function(e){if(e.key==='Enter')send.click();});
  }
})();
</script>`);
    }

    if (name.includes("lead") || name.includes("lead capture") || name.includes("lead magnet")) {
      widgets.push(`
<section id="mm-leadcapture" style="padding:60px 20px;background:${secondary}">
  <div style="max-width:560px;margin:0 auto">
    <h2 style="text-align:center;font-size:2rem;font-weight:700;margin:0 0 8px;color:#fff">Get Your Free Estimate</h2>
    <p style="text-align:center;color:rgba(255,255,255,0.75);margin:0 0 32px">Tell us about your project and we'll get back to you within 5 minutes.</p>
    <form id="mm-lead-form" style="background:rgba(255,255,255,0.08);border-radius:16px;padding:36px;border:1px solid rgba(255,255,255,0.15)">
      <input name="name" placeholder="Your Name" required style="width:100%;padding:14px;margin-bottom:14px;border-radius:8px;border:none;font-size:16px;box-sizing:border-box">
      <input name="email" type="email" placeholder="Email Address" required style="width:100%;padding:14px;margin-bottom:14px;border-radius:8px;border:none;font-size:16px;box-sizing:border-box">
      <input name="phone" type="tel" placeholder="Phone Number" style="width:100%;padding:14px;margin-bottom:14px;border-radius:8px;border:none;font-size:16px;box-sizing:border-box">
      <textarea name="message" rows="3" placeholder="Tell us about your project..." style="width:100%;padding:14px;margin-bottom:20px;border-radius:8px;border:none;font-size:16px;resize:none;box-sizing:border-box"></textarea>
      <button type="submit" style="width:100%;padding:16px;background:${primary};color:#fff;border:none;border-radius:10px;font-size:17px;font-weight:600;cursor:pointer">Get My Free Estimate →</button>
      <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.6);margin:12px 0 0">⚡ We respond within 5 minutes during business hours</p>
    </form>
  </div>
</section>`);
    }

    if (name.includes("instagram") || name.includes("social") || name.includes("social proof")) {
      const handle = brief.socialHandles?.instagram || `@${brief.businessName.toLowerCase().replace(/\s+/g, "")}`;
      const colors = [primary, secondary, "#e8f0fe", "#f0fdf4", "#fef3c7", "#fce7f3", "#ede9fe", "#f0f9ff", "#fdf4ff"];
      const cells = Array.from({ length: 9 }, (_, i) => `<div style="background:${colors[i % colors.length]};aspect-ratio:1;border-radius:4px"></div>`).join("");
      widgets.push(`
<section id="mm-social" style="padding:60px 20px;background:#fff">
  <div style="max-width:640px;margin:0 auto;text-align:center">
    <h2 style="font-size:2rem;font-weight:700;margin:0 0 8px;color:#1a1a1a">Follow Us on Instagram</h2>
    <p style="color:#888;margin:0 0 28px">${handle}</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:480px;margin:0 auto 20px">
      ${cells}
    </div>
    <a href="https://instagram.com/${handle.replace("@","")}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${primary};color:#fff;padding:12px 28px;border-radius:50px;font-weight:600;text-decoration:none">Follow ${handle}</a>
  </div>
</section>`);
    }

    if (name.includes("email") || name.includes("newsletter")) {
      const appUrl = brief.appUrl || "";
      const safeBusinessName = escapeHtml(brief.businessName);
      widgets.push(`
<section id="mm-newsletter" style="padding:60px 20px;background:linear-gradient(135deg,${primary}22,${secondary}22)">
  <div style="max-width:520px;margin:0 auto;text-align:center">
    <h2 style="font-size:2rem;font-weight:700;margin:0 0 8px;color:#1a1a1a">Stay in the Loop</h2>
    <p style="color:#555;margin:0 0 28px">Get updates, tips, and exclusive offers from ${safeBusinessName} — straight to your inbox.</p>
    <form id="mm-newsletter-form" action="${appUrl}/api/contact-submit" method="POST" style="display:flex;gap:10px;max-width:440px;margin:0 auto" onsubmit="mmNewsletterSubmit(event)">
      <input type="hidden" name="businessName" value="${safeBusinessName}">
      <input type="hidden" name="name" value="Newsletter Subscriber">
      <input name="email" type="email" placeholder="Your email address" required style="flex:1;padding:14px 18px;border-radius:50px;border:2px solid ${primary};font-size:15px;outline:none;box-sizing:border-box">
      <button type="submit" style="padding:14px 24px;background:${primary};color:#fff;border:none;border-radius:50px;font-weight:600;font-size:15px;cursor:pointer;white-space:nowrap">Subscribe</button>
    </form>
    <p id="mm-newsletter-msg" style="font-size:13px;color:#666;margin:14px 0 0;min-height:20px"></p>
    <p style="font-size:12px;color:#999;margin:8px 0 0">No spam ever. Unsubscribe at any time.</p>
  </div>
</section>
<script>
function mmNewsletterSubmit(ev){
  ev.preventDefault();
  var form=ev.target,msg=document.getElementById('mm-newsletter-msg');
  var email=form.querySelector('[name="email"]').value;
  fetch('${appUrl}/api/contact-submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Newsletter Subscriber',email:email,businessName:'${safeBusinessName}',message:'Newsletter signup'})})
    .then(function(){if(msg){msg.textContent='Thanks! You\\'re on the list.';msg.style.color='#16a34a';}form.reset();})
    .catch(function(){if(msg){msg.textContent='Something went wrong — please try again.';msg.style.color='#dc2626';}});
}
</script>`);
    }
  }

  return widgets.join("\n");
}

// ── Social footer links ───────────────────────────────────────────────────────

function buildSocialLinks(brief: SiteBrief): string {
  const handles = brief.socialHandles;
  if (!handles) return "";
  const links: string[] = [];
  if (handles.instagram) links.push(`<a href="https://instagram.com/${handles.instagram.replace("@","")}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">Instagram</a>`);
  if (handles.facebook) links.push(`<a href="${handles.facebook.startsWith("http") ? handles.facebook : `https://facebook.com/${handles.facebook}`}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">Facebook</a>`);
  if (handles.tiktok) links.push(`<a href="https://tiktok.com/${handles.tiktok.replace("@","")}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">TikTok</a>`);
  if (handles.twitter) links.push(`<a href="https://twitter.com/${handles.twitter.replace("@","")}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">X / Twitter</a>`);
  if (!links.length) return "";
  return `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">${links.join("")}</div>`;
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

  // Build addon widgets once (injected into index page only)
  const addonWidgetsHtml = buildAddonWidgets(brief);
  const socialLinksHtml = buildSocialLinks(brief);

  function postProcess(html: string, isIndex: boolean): string {
    let out = html;
    // Inject addon widgets before </main> or </footer> on the index page only
    if (isIndex && addonWidgetsHtml) {
      if (out.includes("</main>")) {
        out = out.replace("</main>", addonWidgetsHtml + "\n</main>");
      } else if (/<footer[\s>]/i.test(out)) {
        out = out.replace(/<footer[\s>]/i, (m) => addonWidgetsHtml + "\n" + m);
      } else {
        out = out.replace("</body>", addonWidgetsHtml + "\n</body>");
      }
    }
    // Inject social links into footer on every page
    if (socialLinksHtml && out.includes("</footer>")) {
      out = out.replace("</footer>", socialLinksHtml + "\n</footer>");
    }
    return out;
  }

  // Inject index page
  pages["index"] = postProcess(
    await injectContentIntoTemplate(
      indexTemplatePath,
      brief,
      copy,
      resolvedImages,
      navLinks,
      cta.href,
      cta.text,
      footerLinks,
      "index",
    ),
    true,
  );

  // Inject additional pages
  await Promise.all(
    additionalPages.map(async (pageName) => {
      const pagePath = findPageTemplate(dir, pageName);
      if (!pagePath) return;

      try {
        pages[pageName] = postProcess(
          await injectContentIntoTemplate(
            pagePath,
            brief,
            copy,
            resolvedImages,
            navLinks,
            cta.href,
            cta.text,
            footerLinks,
            pageName,
          ),
          false,
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
      pages["privacy"] = postProcess(
        await injectContentIntoTemplate(
          privacyPath,
          brief,
          copy,
          resolvedImages,
          navLinks,
          cta.href,
          cta.text,
          footerLinks,
          "privacy",
        ),
        false,
      );
    } catch {
      // privacy page optional
    }
  }

  // ── UPGRADE 11: Sitemap + robots per site ────────────────────────────────

  const siteSlug = brief.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const siteBase = brief.siteUrl || `https://${siteSlug}.${ENV.minimorphSitesDomain}`;
  const today = new Date().toISOString().split("T")[0];

  const htmlPages = Object.keys(pages).filter(
    p => !p.endsWith(".xml") && !p.endsWith(".txt"),
  );

  pages["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${htmlPages.map(p => {
  const loc = p === "index" ? `${siteBase}/` : `${siteBase}/${p}.html`;
  const priority = p === "index" ? "1.0" : "0.8";
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join("\n")}
</urlset>`;

  pages["robots.txt"] = `User-agent: *\nAllow: /\nSitemap: ${siteBase}/sitemap.xml`;

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
