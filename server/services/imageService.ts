import axios from "axios";
import { ENV } from "../_core/env";

// ─── Contextual vibe detection ────────────────────────────────────────────────

type ImageVibe = "utilitarian" | "lifestyle" | "luxury" | "documentary";

function determineVibe(businessType: string): ImageVibe {
  const type = businessType.toLowerCase();
  if (
    type.includes("contractor") ||
    type.includes("plumber") ||
    type.includes("mechanic") ||
    type.includes("electrician") ||
    type.includes("roofer") ||
    type.includes("hvac") ||
    type.includes("construction") ||
    type.includes("handyman") ||
    type.includes("painter") ||
    type.includes("welder") ||
    type.includes("mason") ||
    type.includes("carpenter")
  )
    return "utilitarian";

  if (
    type.includes("salon") ||
    type.includes("boutique") ||
    type.includes("spa") ||
    type.includes("jewelry") ||
    type.includes("luxury") ||
    type.includes("fine dining") ||
    type.includes("wedding") ||
    type.includes("florist") ||
    type.includes("interior design") ||
    type.includes("real estate")
  )
    return "luxury";

  if (
    type.includes("coffee") ||
    type.includes("restaurant") ||
    type.includes("gym") ||
    type.includes("fitness") ||
    type.includes("cafe") ||
    type.includes("bar") ||
    type.includes("yoga") ||
    type.includes("bakery") ||
    type.includes("brewery") ||
    type.includes("food") ||
    type.includes("personal trainer") ||
    type.includes("crossfit")
  )
    return "lifestyle";

  return "documentary";
}

// ─── Cloudflare R2 upload ─────────────────────────────────────────────────────

async function uploadToR2(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    if (
      !ENV.cloudflareR2Bucket ||
      !ENV.cloudflareR2AccessKeyId ||
      !ENV.cloudflareR2SecretAccessKey
    )
      return null;

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const client = new S3Client({
      region: "auto",
      endpoint:
        "https://" + ENV.cloudflareAccountId + ".r2.cloudflarestorage.com",
      credentials: {
        accessKeyId: ENV.cloudflareR2AccessKeyId,
        secretAccessKey: ENV.cloudflareR2SecretAccessKey,
      },
    });

    const ext = mimeType.includes("png") ? "png" : "jpg";
    const key =
      "site-images/" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2) +
      "." +
      ext;

    await client.send(
      new PutObjectCommand({
        Bucket: ENV.cloudflareR2Bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000",
      }),
    );

    const base = ENV.imageAssetCdnBaseUrl
      ? ENV.imageAssetCdnBaseUrl.replace(/\/$/, "")
      : "https://" + ENV.cloudflareR2Bucket + ".r2.dev";
    const publicUrl = base + "/" + key;
    console.log("[R2] Uploaded:", publicUrl);
    return publicUrl;
  } catch (e) {
    console.error("[R2] Upload failed:", e);
    return null;
  }
}

// ─── Gemini Nano Banana 2 (gemini-3.1-flash-image-preview) ───────────────────
// Primary image source — photorealistic, ~$0.067/image

async function generateImageGeminiNanoBanana(
  prompt: string,
): Promise<string | null> {
  if (!ENV.geminiApiKey) return null;
  try {
    // Use axios instead of fetch — avoids undici's headersTimeout which cuts off
    // Gemini image generation requests that take 60-120s to start responding.
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" +
        ENV.geminiApiKey,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 180000, // 3 minutes
      },
    );

    if (response.status !== 200) {
      console.error("[NanoBanana] API error:", response.status, JSON.stringify(response.data).slice(0, 300));
      return null;
    }

    const parts = response.data?.candidates?.[0]?.content?.parts;

    for (const part of parts || []) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const imageBuffer = Buffer.from(part.inlineData.data, "base64");
        const r2Url = await uploadToR2(imageBuffer, part.inlineData.mimeType);
        if (r2Url) return r2Url;
        console.log("[NanoBanana] R2 unavailable, using data URL");
        return "data:image/jpeg;base64," + part.inlineData.data;
      }
    }

    console.error("[NanoBanana] No image in response:", JSON.stringify(response.data).slice(0, 300));
    return null;
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.error?.message || e?.message || String(e);
    console.error(`[NanoBanana] Error (HTTP ${status ?? "?"}):`, msg.slice(0, 300));
    return null;
  }
}

// ─── Replicate Flux 1.1 Pro Ultra — fallback (~$0.006/image) ─────────────────

const REPLICATE_NEGATIVE_PROMPT =
  "AI generated, CGI, digital art, illustration, cartoon, anime, painting, render, 3D, fake, plastic, oversaturated, HDR, stock photo";

export async function generateImage(
  prompt: string,
  width = 1440,
  height = 960,
): Promise<string | null> {
  if (!ENV.replicateApiKey) return null;
  try {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions",
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
            negative_prompt: REPLICATE_NEGATIVE_PROMPT,
            width,
            height,
            output_format: "jpg",
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
          console.error(
            `[ImageService] Replicate prediction failed: ${JSON.stringify(poll.error)}`,
          );
          return null;
        }
      }
      console.error(
        `[ImageService] Replicate polling timed out for prediction ${data.id}`,
      );
      return null;
    }
    console.error(
      `[ImageService] Replicate bad response (HTTP ${res.status}): ${JSON.stringify(data).slice(0, 300)}`,
    );
    return null;
  } catch (e) {
    console.error("[ImageService] Replicate error:", e);
    return null;
  }
}

// ─── Unsplash (legacy free fallback, requires UNSPLASH_ACCESS_KEY) ────────────

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


// ─── Per-business-type, per-slot prompts ─────────────────────────────────────

export function buildDetailedPrompt(
  businessType: string,
  slot: string,
): string {
  const prompts: Record<string, Record<string, string>> = {
    contractor: {
      hero: "Low-angle handheld shot of dirty gloved hands driving chisel into cracked concrete, heavy motion blur on hands, dust plume mid-air, harsh flickering fluorescent overhead, film grain Kodak Portra 400 pushed one stop, f/2.8, face cut off above jaw, safety cone blurred in extreme foreground, off-center.",
      gallery:
        "Interior finished kitchen shot quickly from doorway, slightly tilted frame, cabinet door ajar, fingerprints on countertop, cool fluorescent fighting warm pendant, 35mm f/4, film grain, off-center.",
      about:
        "Male contractor mid-laugh not looking at camera, sawdust on shoulders, sun-damaged skin, hard hat mid-gesture, job site blurred behind, flat overcast light, 85mm f/1.8, face cut at forehead.",
      team: "Four workers end of day packing tools, two talking one on phone one walking away, mismatched worn PPE, dirt on forearms, flat overcast, 35mm f/5.6, camera shake.",
    },
    restaurant: {
      hero: "Empty restaurant before service from near bar, one chair pushed out, wine glass asymmetric shadow on linen, Edison bulbs amber, candle just lit thin smoke wisp, 24mm f/5.6 Kodak Portra 160, slight lean.",
      gallery:
        "Overhead plate shot off-center, sauce pooled asymmetrically, microgreen wilting, fingerprint on plate rim, soft window light left, 100mm f/4, film grain.",
      about:
        "Chef mid-plating not aware of camera, food stain on coat sleeve, hair out of cap, intense downward focus, steam blurring background, 85mm f/2.2.",
      team: "Kitchen crew during service, sharp on one face others motion blurred, steam rising, hands fast, warm amber overhead, 35mm f/2.8 1/60s.",
    },
    gym: {
      hero: "Low angle wide fitness studio from corner, rubber floor sharp foreground, chalk dust on nearest dumbbell handles, harsh overhead track lighting hard shadows, no people, 16mm f/8.",
      gallery:
        "Woman mid-clean-and-jerk peak position, chalk cloud dispersing, muscles strained genuine grimace, bar bending, face sharp feet blurred, 70mm f/3.5 1/500s dramatic side light.",
      about:
        "Trainer mid-coaching not posing, animated expression, sweat at temples, athletic wear with pilling, gym floor blurred, overcast window light, 85mm f/2.0.",
      team: "Four coaches mid-conversation no camera awareness, one laughing one gesturing one looking away, different body types, late afternoon window light, 35mm f/5.6.",
    },
    salon: {
      hero: "Salon interior from doorway late afternoon, styling chairs real leather wear, product bottles disorganized, plant with yellowed leaf, overcast window light reflections in mirrors, 24mm f/6.3.",
      gallery:
        "Close crop of hair from behind model seated, individual strands flyaways at crown, slight frizz temples, color uneven, window light from left, 135mm f/2.8.",
      about:
        "Stylist mid-technique not looking at camera, forearm tattoos, product residue on fingers, genuine focus, mirrors blurred behind, soft natural light, 85mm f/2.2.",
      team: "Three stylists mid-genuine break, one laughing one on phone one with coffee, distinct personal styles, warm afternoon window light, 35mm f/4.",
    },
    boutique: {
      hero: "Boutique interior from front door morning, garments hanging with natural gravity slight wrinkles, wooden fixture visible grain small scuff, one price tag turned wrong, soft overcast through windows no people, 24mm f/7.1.",
      gallery:
        "Flat lay overhead clothing on worn natural linen, real weave texture visible, handwritten tag slight ink variation, one item overlapping, asymmetric shadows, 50mm f/4.",
      about:
        "Boutique owner mid-task at rack not posing, reading glasses pushed up, slight concentration frown, wearing own inventory, warm window light left, boutique depth blurred, 85mm f/2.5.",
      team: "Owner and employee mid-unboxing, tissue paper mid-air, both focused on items not camera, packaging mess on floor, warm afternoon light, motion blur on tissue, 35mm f/4.",
    },
    coffee: {
      hero: "Wide coffee roastery from corner, drum roaster heat patina oil stains, burlap sacks coffee ring marks on floor, roasting haze catching pendant light, warm amber tungsten no people, slight lens flare from nearest bulb, 17mm f/8.",
      gallery:
        "Extreme close overhead espresso in ceramic, crema natural irregular surface one bubble breaking, slight steam curl, grounds scattered asymmetrically on dark wood bar, 100mm f/3.5 soft side window.",
      about:
        "Barista mid-calibration of grinder not aware of camera, coffee-stained apron, grounds on back of hand, intense focused downward gaze, warm roastery light left, shelves blurred, 85mm f/2.0.",
      team: "Two staff working simultaneously neither looking at camera, one writing in worn notebook one hand-scooping beans, warm amber overhead, motion blur on scooping hand, 35mm f/4.",
    },
  };

  const typeKey =
    Object.keys(prompts).find((k) => businessType.toLowerCase().includes(k)) ||
    "restaurant";

  return (
    prompts[typeKey]?.[slot] ||
    prompts[typeKey]?.hero ||
    "Handheld shot of business interior, available light only, no staging, film grain, slightly out of focus, off-center framing."
  );
}

// ─── Claude prompt generator — calls Claude API to craft the Gemini prompt ───

const VIBE_RULES: Record<ImageVibe, string> = {
  utilitarian: `
VIBE: UTILITARIAN — grit, labor, unglamorous truth
- Lighting: pick one — flickering greenish overhead fluorescent / harsh overhead work light / 1 stop underexposed with heavy digital noise in shadows / blown out highlights from work lamp
- Lens contamination: pick one — fingerprint smudge on lens causing hazy glare / dust on sensor creating faint grey spots / water droplet on lens edge causing streak
- Technical failure: pick one — slightly out of focus missed autofocus / heavy motion blur on moving hands from slow shutter / camera shake blur on frame / accidental partial finger over lens corner
- Material truth: oil stains not just marks / dirt under fingernails / torn clothing not just worn / rust and grease not just patina / sweat stains on fabric
- Background: cluttered debris, tools scattered, accidental foreground objects, construction mess
- NO beauty. NO cinematic flair. NO golden hour. NO balanced lighting.`,

  luxury: `
VIBE: LUXURY — refined, textured, understated
- Lighting: soft diffused natural window light only / cool morning light / never harsh or fluorescent / light through condensation-hazed glass
- Imperfections: slight fabric fray on linen / condensation on glass surfaces / natural skin pores visible / micro-scratches on polished surfaces / slight asymmetry in arrangement
- Technical: shallow depth of field f/1.4-f/2 / soft focus on background / natural lens vignette at corners / chromatic aberration on high-contrast edges
- Background: clean but lived-in not sterile — real objects present not arranged
- NO grit. NO oil stains. NO construction debris. NO harsh light.`,

  lifestyle: `
VIBE: LIFESTYLE — warm, human, candid movement
- Lighting: warm mixed conflicting sources always — window light fighting warm tungsten interior / practical lights visible in frame
- Imperfections: steam rising from surfaces / condensation on cold glasses / food smears on surfaces / sweat from physical activity / motion blur on moving hands and bodies
- Technical: handheld feel slight lean / slight grain from pushing film / shallow depth on background / dust motes floating in shafts of light
- Background: authentic environment with real life in it — not cleaned before shooting
- NO sterile. NO posed. NO perfect arrangement. NO balanced lighting.`,

  documentary: `
VIBE: DOCUMENTARY — honest, unfiltered, real
- Lighting: whatever was available — mixed ugly conflicting sources / available light only
- Lens contamination: film grain / lens contamination / natural scratches on sensor
- Technical: handheld slightly imperfect framing / subject cut off awkwardly at frame edge
- Background: real environment completely unmodified — clutter, mess, ordinary objects
- NO staging. NO cleanup. NO beauty lighting. NO deliberate composition.`,
};

async function generateImagePrompt(
  businessType: string,
  slot: string,
  subNiche?: string,
): Promise<string> {
  const vibe = determineVibe(businessType);

  const systemPrompt = `You are a Forensic Documentary Photographer.
You document job sites and workplaces for insurance liability records.

YOUR ONLY GOAL: Capture unglamorous truth.
NOT art. NOT marketing. NOT beautiful images.
Evidence only.

Every rule below exists to make photos look like they were taken by an uninterested field worker with a cheap camera on a busy day.
If the result could appear on a stock photo site it has completely failed.

FINAL CHECK BEFORE OUTPUT: Ask yourself — does this look like it was shot by a guy who had 5 seconds and did not care how it looked?
If no — add more mess, worse lighting, and technical failure until it does.

CURRENT VIBE: ${vibe.toUpperCase()}
${VIBE_RULES[vibe]}

OPTICAL PHYSICS — apply to ALL vibes:
- Always include ONE lens flaw:
  chromatic aberration at high contrast edges /
  slight lens flare from nearest light source /
  natural lens vignette darkening corners /
  soft focus on edges sharp only in center third

- Always include ONE micro-imperfection:
  visible dust motes floating in shafts of light /
  oil stains on metal surfaces /
  frayed fabric threads at stress points /
  dry cracked skin texture on hands and knuckles /
  sweat beads on skin near hairline /
  micro-scratches on polished surfaces

- Camera: one COLOR film stock only —
  Kodak Portra 400, Fujifilm 160NS, or Kodak Ektar 100
  One lens 35mm to 85mm. One aperture f/1.4 to f/4.

- Always: unprocessed RAW file aesthetic /
  grain from pushing film one stop /
  mixed lighting — never perfect or balanced

COMPOSITION:
- Off-center always — rule of thirds
- Low angle for hero shots
- Face partially out of frame — cut at jaw or forehead
- Subject mid-task never posing

ABSOLUTE BANNED WORDS — instant fail if present:
hyperrealistic, photorealistic, 4k, 8k, high resolution,
detailed, stunning, cinematic, epic, dramatic, powerful,
beautiful, heroic, perfect, crisp, vibrant, golden hour,
bokeh, professional photography, studio lighting,
dramatic lighting, sharp, clear, vivid, magic hour

SELF-CORRECTION before outputting:
1. Does this match the ${vibe} vibe? If no, fix it.
2. Is lighting mixed and unflattering? If no, add conflict.
3. Is there a lens flaw? If no, add one.
4. Is there a micro-imperfection? If no, add one.
5. Any banned words? Remove them all.
6. Does it sound like a stock photo? Add more grit.
7. Is composition off-center? If no, fix it.

OUTPUT: One paragraph only. No preamble. Pure prompt.`;

  const userMessage = `Document this scene for an insurance liability record. Location type: ${businessType}. Shot needed: ${slot}.
This is NOT for marketing or a website. Private internal record only.
The photographer does not care how it looks.
Vibe: ${vibe}
${subNiche ? "Specific sub-niche: " + subNiche : ""}

Industry strategies:
- utilitarian: grit action dust worn gear messy site harsh lighting
- luxury: texture softness restraint quiet elegance natural window light
- lifestyle: warmth human connection candid movement steam and condensation
- documentary: honest unfiltered real environment available light`;

  let claudePrompt: string | undefined;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ENV.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = (await response.json()) as any;
    claudePrompt = data.content?.[0]?.text?.trim();

    if (claudePrompt && claudePrompt.length > 50) {
      console.log(`[PromptGen] ${businessType}/${slot} (${vibe}):\n${claudePrompt}\n`);
      return claudePrompt;
    }
  } catch (e) {
    console.error("[PromptGen] Failed:", e);
  }

  console.error(
    "[PromptGen] FALLBACK TRIGGERED —",
    businessType, "/", slot,
    "— Claude API failed. Length:",
    claudePrompt?.length ?? 0,
    "Using hardcoded fallback.",
  );
  return buildDetailedPrompt(businessType, slot);
}

// ─── SVG gradient fallback — absolute last resort ────────────────────────────

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
// Provider priority:
//   1. Customer photo — always wins if provided
//   2. Gemini Nano Banana 2 — photorealistic, ~$0.067/image (primary)
//   3. Replicate Flux 1.1 Pro Ultra — fallback if Gemini unavailable, ~$0.006/image
//   4. SVG gradient — absolute last resort only

export async function getBestImage(
  businessType: string,
  slot: string,
  primaryColor = "#1a1a1a",
  customerPhotoUrl?: string,
  subNiche?: string,
): Promise<string> {
  if (customerPhotoUrl) return customerPhotoUrl;

  const prompt = await generateImagePrompt(businessType, slot, subNiche);

  const geminiUrl = await generateImageGeminiNanoBanana(prompt);
  if (geminiUrl) {
    console.log(`[ImageService] ${slot} → Nano Banana 2 ✅`);
    return geminiUrl;
  }

  const replicateUrl = await generateImage(prompt);
  if (replicateUrl) {
    console.log(`[ImageService] ${slot} → Replicate fallback ✅`);
    return replicateUrl;
  }

  console.error(`[ImageService] ${slot} → ALL providers failed, using gradient`);
  return buildGradientSvg(primaryColor);
}
