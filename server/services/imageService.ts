import { ENV } from "../_core/env";

// ─── Replicate (hero images — AI quality, ~$0.003/image) ─────────────────────

export async function generateImage(
  prompt: string,
  width = 1440,
  height = 960,
): Promise<string | null> {
  if (!ENV.replicateApiKey) return null;
  try {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + ENV.replicateApiKey,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          input: {
            prompt,
            width,
            height,
            output_format: "webp",
            output_quality: 90,
            num_inference_steps: 28,
            guidance_scale: 3.5,
          },
        }),
      },
    );
    const data = (await res.json()) as any;
    if (data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }
    if (data.id) {
      for (let i = 0; i < 24; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = (await fetch(
          "https://api.replicate.com/v1/predictions/" + data.id,
          { headers: { Authorization: "Bearer " + ENV.replicateApiKey } },
        ).then((r) => r.json())) as any;
        if (poll.status === "succeeded") {
          return Array.isArray(poll.output) ? poll.output[0] : poll.output;
        }
        if (poll.status === "failed") {
          console.error(`[ImageService] Replicate prediction failed: ${JSON.stringify(poll.error)}`);
          return null;
        }
      }
      console.error(`[ImageService] Replicate polling timed out for prediction ${data.id}`);
      return null;
    }
    console.error(`[ImageService] Replicate bad response (HTTP ${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
    return null;
  } catch (e) {
    console.error("[ImageService] Replicate error:", e);
    return null;
  }
}

// ─── Unsplash (gallery/about/team — free) ────────────────────────────────────

export async function getUnsplashImage(query: string): Promise<string | null> {
  if (!ENV.unsplashAccessKey) return null;
  try {
    const res = await fetch(
      "https://api.unsplash.com/photos/random?query=" +
        encodeURIComponent(query) +
        "&orientation=landscape",
      { headers: { Authorization: "Client-ID " + ENV.unsplashAccessKey } },
    );
    const data = (await res.json()) as any;
    return (data.urls?.regular as string) || null;
  } catch {
    return null;
  }
}

// ─── Unsplash query library — optimized search strings per business type/slot ─

function getUnsplashQuery(businessType: string, slot: string): string {
  const queries: Record<string, Record<string, string>> = {
    restaurant: {
      hero:    "upscale restaurant interior warm lighting",
      gallery: "gourmet food plating professional photography",
      about:   "chef professional kitchen portrait",
      team:    "restaurant staff professional portrait",
    },
    contractor: {
      hero:    "modern home construction professional architecture",
      gallery: "home renovation completed project interior",
      about:   "contractor professional worksite confident",
      team:    "construction worker professional portrait",
    },
    gym: {
      hero:    "modern gym fitness studio interior dramatic lighting",
      gallery: "fitness workout athletic photography",
      about:   "personal trainer professional portrait gym",
      team:    "fitness coach professional portrait",
    },
    salon: {
      hero:    "luxury hair salon interior modern upscale",
      gallery: "professional hair styling balayage result",
      about:   "hair stylist professional portrait confident",
      team:    "salon stylist professional portrait",
    },
    boutique: {
      hero:    "boutique clothing store interior minimal natural light",
      gallery: "fashion clothing editorial photography curated",
      about:   "boutique owner professional portrait",
      team:    "fashion retail professional portrait",
    },
    coffee: {
      hero:    "specialty coffee roastery interior warm amber",
      gallery: "latte art coffee professional photography",
      about:   "barista professional portrait coffee espresso",
      team:    "coffee shop barista professional",
    },
  };

  const typeKey =
    Object.keys(queries).find((k) => businessType.toLowerCase().includes(k)) ||
    "restaurant";

  return (
    queries[typeKey]?.[slot] ||
    queries[typeKey]?.hero ||
    `${businessType} professional photography`
  );
}

// ─── AI prompt library — detailed prompts for Replicate hero images ───────────

const HERO_PROMPTS: Record<string, string> = {
  restaurant:
    "Upscale farm-to-table restaurant interior, warm Edison bulb lighting, wooden tables, intimate atmosphere, no people, professional photography, sharp focus",
  contractor:
    "Professional construction workers on modern home project, blue sky, safety equipment, craftsmanship visible, natural daylight, photorealistic",
  gym:
    "Modern high-intensity fitness studio, premium equipment, dramatic lighting, no people, professional photography, wide angle",
  salon:
    "Luxury hair salon interior, modern styling chairs, professional lighting, upscale aesthetic, no people, editorial photography",
  boutique:
    "Elegant independent clothing boutique interior, curated displays, natural window light, minimalist aesthetic, no people, architectural photography",
  coffee:
    "Specialty coffee roastery interior, espresso machine, warm amber lighting, artisan atmosphere, no people, editorial food photography",
};

// ─── SVG gradient fallback ────────────────────────────────────────────────────

function buildGradientSvg(primaryColor: string): string {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="960">` +
        `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">` +
        `<stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.9"/>` +
        `<stop offset="100%" style="stop-color:#000;stop-opacity:1"/>` +
        `</linearGradient></defs>` +
        `<rect width="1440" height="960" fill="url(#g)"/>` +
        `</svg>`,
    )
  );
}

// ─── Primary entry point ──────────────────────────────────────────────────────
//
// Cost strategy:
//   hero   → Replicate AI (~$0.003) — first thing visitors see, worth it
//   others → Unsplash free stock    — high quality, zero cost
//   all    → SVG gradient           — last resort, never broken

export async function getBestImage(
  businessType: string,
  slot: string,
  primaryColor = "#1a1a1a",
  customerPhotoUrl?: string,
): Promise<string> {
  // 1. Customer's own photo always wins
  if (customerPhotoUrl) return customerPhotoUrl;

  const typeKey =
    Object.keys(HERO_PROMPTS).find((k) => businessType.toLowerCase().includes(k)) ||
    "restaurant";

  // 2. Hero slot: Replicate AI for maximum first-impression quality
  if (slot === "hero" && ENV.replicateApiKey) {
    const prompt =
      HERO_PROMPTS[typeKey] ||
      "Professional small business exterior, clean modern aesthetic, natural lighting, no people";
    const url = await generateImage(prompt);
    if (url) {
      console.log(`[ImageService] hero → Replicate ✅`);
      return url;
    }
  }

  // 3. Non-hero (gallery, about, team): Unsplash free stock
  if (slot !== "hero" && ENV.unsplashAccessKey) {
    const query = getUnsplashQuery(businessType, slot);
    const url = await getUnsplashImage(query);
    if (url) {
      console.log(`[ImageService] ${slot} → Unsplash ✅`);
      return url;
    }
  }

  // 4. Replicate fallback for any slot (e.g. Unsplash not configured)
  if (ENV.replicateApiKey) {
    const prompt =
      HERO_PROMPTS[typeKey] ||
      "Professional small business exterior, clean modern aesthetic, natural lighting";
    const url = await generateImage(prompt);
    if (url) {
      console.log(`[ImageService] ${slot} → Replicate fallback ✅`);
      return url;
    }
  }

  // 5. SVG gradient — never shows a broken image
  console.log(`[ImageService] ${slot} → SVG gradient fallback`);
  return buildGradientSvg(primaryColor);
}
