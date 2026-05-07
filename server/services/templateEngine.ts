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

export function selectTemplate(businessType: string, brandTone: string): string {
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

  // Service businesses (cleaning, landscaping, painting, HVAC, pest control, etc.)
  const professionalTones = ["professional", "corporate", "modern", "clean", "tech"];
  return professionalTones.some(t => tone.includes(t))
    ? "service/professional.html"
    : "service/friendly-local.html";
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

  // Strip growth-gated sections if below growth tier
  if (level < 1) {
    html = html.replace(
      /<!-- IF_GROWTH_PLUS_START -->[\s\S]*?<!-- IF_GROWTH_PLUS_END -->/g,
      "",
    );
  } else {
    html = html
      .replace(/<!-- IF_GROWTH_PLUS_START -->/g, "")
      .replace(/<!-- IF_GROWTH_PLUS_END -->/g, "");
  }

  // Strip premium-gated sections if below premium tier
  if (level < 2) {
    html = html.replace(
      /<!-- IF_PREMIUM_PLUS_START -->[\s\S]*?<!-- IF_PREMIUM_PLUS_END -->/g,
      "",
    );
  } else {
    html = html
      .replace(/<!-- IF_PREMIUM_PLUS_START -->/g, "")
      .replace(/<!-- IF_PREMIUM_PLUS_END -->/g, "");
  }

  // Strip enterprise-gated sections if below enterprise tier
  if (level < 3) {
    html = html.replace(
      /<!-- IF_ENTERPRISE_START -->[\s\S]*?<!-- IF_ENTERPRISE_END -->/g,
      "",
    );
  } else {
    html = html
      .replace(/<!-- IF_ENTERPRISE_START -->/g, "")
      .replace(/<!-- IF_ENTERPRISE_END -->/g, "");
  }

  return html;
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

  // Extract JSON if wrapped in code fences
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]) as Record<string, string>;
  } catch {
    return {};
  }
}

// ── Content injection ─────────────────────────────────────────────────────────

const IMAGE_TOKEN_MAP: Array<[string, string, string | number]> = [
  ["HERO_IMAGE", "hero", "hero"],
  ["GALLERY_IMAGE_1", "gallery", 1],
  ["GALLERY_IMAGE_2", "gallery", 2],
  ["GALLERY_IMAGE_3", "gallery", 3],
  ["ABOUT_IMAGE", "about", "about"],
  ["TEAM_IMAGE_1", "team", 1],
] as const;

type ImageSlot = string | number;

export async function injectContentIntoTemplate(
  templatePath: string,
  brief: SiteBrief,
  copy: Record<string, string>,
  imageDirection?: string,
): Promise<string> {
  const fullPath = path.join(process.cwd(), "server", "templates", templatePath);

  let html = fs.readFileSync(fullPath, "utf-8");

  // Strip package-gated sections
  html = stripPackageSections(html, brief.packageTier);

  // Build the full token map
  const tokens: Record<string, string> = {
    BUSINESS_NAME: brief.businessName,
    PHONE: brief.phone,
    EMAIL: brief.email,
    ADDRESS: brief.address,
    HOURS: brief.hours,
    SERVICE_AREA: brief.serviceArea,
    YEARS_IN_BUSINESS: brief.yearsInBusiness,
    OWNER_NAME: brief.ownerName,
    LICENSE_NUMBER: brief.licenseNumber ?? "",
    PACKAGE_TIER: capitalizeFirst(brief.packageTier),
    APP_URL_PLACEHOLDER: brief.appUrl ?? "#",
    PRIMARY_COLOR: brief.primaryColor,
    SECONDARY_COLOR: brief.secondaryColor,
    SERVICE_1_DESC: brief.servicesOffered[0] ?? "",
    SERVICE_2_DESC: brief.servicesOffered[1] ?? "",
    SERVICE_3_DESC: brief.servicesOffered[2] ?? "",
    ...copy,
  };

  // Replace all content tokens (longest keys first to avoid partial matches)
  const sortedKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    html = html.replaceAll(key, tokens[key] ?? "");
  }

  // Resolve image tokens
  const { getBestImage } = await import("./imageService");
  const dir = imageDirection ?? brief.imageDirection;

  for (const [token, imageType, slot] of IMAGE_TOKEN_MAP) {
    if (!html.includes(token)) continue;
    try {
      const url = await getBestImage(
        brief.businessType,
        String(slot),
        brief.primaryColor,
        undefined,
        brief.subNiche,
        dir,
      );
      html = html.replaceAll(token, url);
    } catch {
      html = html.replaceAll(token, "");
    }
  }

  return html;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export async function generateSiteFromTemplate(
  brief: SiteBrief,
): Promise<Record<string, string>> {
  const templatePath = selectTemplate(brief.businessType, brief.brandTone);
  const copy = await generateCopyForTemplate(brief);
  const html = await injectContentIntoTemplate(templatePath, brief, copy, brief.imageDirection);
  return { index: html };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
