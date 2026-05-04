import { ENV } from "../_core/env";

// ─── Replicate ────────────────────────────────────────────────────────────────

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
    // Poll if the synchronous wait didn't complete in time
    if (data.id) {
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = (await fetch(
          "https://api.replicate.com/v1/predictions/" + data.id,
          { headers: { Authorization: "Bearer " + ENV.replicateApiKey } },
        ).then((r) => r.json())) as any;
        if (poll.status === "succeeded") {
          return Array.isArray(poll.output) ? poll.output[0] : poll.output;
        }
        if (poll.status === "failed") return null;
      }
    }
    return null;
  } catch (e) {
    console.error("[ImageService] Replicate error:", e);
    return null;
  }
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

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

// ─── Business-type prompt library ─────────────────────────────────────────────

const PROMPTS: Record<string, Record<string, string>> = {
  restaurant: {
    hero: "Upscale farm-to-table restaurant interior, warm Edison bulb lighting, wooden tables, intimate atmosphere, no people, professional photography",
    gallery:
      "Beautifully plated gourmet dish, natural lighting, food photography, high resolution",
    about:
      "Restaurant chef at work in professional kitchen, warm lighting, culinary craftsmanship",
  },
  contractor: {
    hero: "Professional construction workers on modern home project, blue sky, safety equipment, craftsmanship visible, natural daylight",
    gallery:
      "Completed modern home construction, clean lines, professional finish, architectural photography",
    about:
      "Professional contractor reviewing blueprints on job site, confident, natural light",
  },
  gym: {
    hero: "Modern high-intensity fitness studio, premium equipment, dramatic lighting, no people, professional photography",
    gallery:
      "Athletic person doing functional fitness exercise, dramatic lighting, motivational",
    about:
      "Professional personal trainer in modern gym, confident, fitness equipment background",
  },
  salon: {
    hero: "Luxury hair salon interior, modern styling chairs, professional lighting, upscale aesthetic, no people",
    gallery:
      "Professional hair styling result, beautiful balayage treatment, high-end salon photography",
    about: "Professional hair stylist at work, skilled and confident, warm lighting",
  },
  boutique: {
    hero: "Elegant independent clothing boutique interior, curated displays, natural window light, minimalist aesthetic, no people",
    gallery:
      "Beautifully styled clothing outfit flat lay, natural light, editorial fashion photography",
    about:
      "Boutique owner arranging curated clothing display, natural light, professional",
  },
  coffee: {
    hero: "Specialty coffee roastery interior, espresso machine, warm amber lighting, artisan atmosphere, no people",
    gallery: "Perfectly crafted latte art in ceramic mug, warm tones, food photography",
    about: "Expert barista crafting espresso drink, professional technique, warm atmosphere",
  },
};

// ─── Primary entry point ──────────────────────────────────────────────────────

export async function getBestImage(
  businessType: string,
  slot: string,
  primaryColor = "#1a1a1a",
): Promise<string> {
  const typeKey =
    Object.keys(PROMPTS).find((k) => businessType.toLowerCase().includes(k)) ||
    "restaurant";

  const prompt =
    PROMPTS[typeKey]?.[slot] ||
    PROMPTS[typeKey]?.hero ||
    "Professional small business exterior, clean modern aesthetic, natural lighting, no people";

  // 1. Replicate (AI-generated, best quality)
  const replicateUrl = await generateImage(prompt);
  if (replicateUrl) return replicateUrl;

  // 2. Unsplash (stock photo fallback)
  const unsplashUrl = await getUnsplashImage(businessType + " " + slot);
  if (unsplashUrl) return unsplashUrl;

  // 3. SVG gradient fallback — never shows a broken image
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
