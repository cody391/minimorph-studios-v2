import axios from "axios";
import { ENV } from "../_core/env";

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
  "AI generated, CGI, digital art, illustration, cartoon, anime, painting, render, 3D, fake, plastic, oversaturated, HDR, lens flare, stock photo";

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

// ─── Hyper-realistic suffix appended to every prompt ─────────────────────────

const HYPER_REAL =
  "Hyper-realistic. No AI generated look. Shot on Canon 5D Mark IV. Real photograph only. Photojournalism quality. Indistinguishable from a real professional photograph. Natural imperfections. Authentic lighting. Not staged. Not stock photo looking. Candid professional quality. No lens flares. No HDR look. No oversaturation. No plastic skin. No perfect symmetry. No stock photo composition.";

// ─── Detailed per-business-type, per-slot prompts ────────────────────────────

export function buildDetailedPrompt(
  businessType: string,
  slot: string,
): string {
  const prompts: Record<string, Record<string, string>> = {
    contractor: {
      hero: `Wide-angle documentary photograph of an active home construction site at golden hour. Experienced workers in worn safety gear framing timber walls, sawdust in the air, lumber stacks in foreground, blue sky with soft clouds behind. Shot on Canon 5D Mark IV with 24mm lens, f/5.6, natural raking sunlight. ${HYPER_REAL}`,
      gallery: `Environmental portrait photograph of a beautifully finished modern kitchen renovation — quartz countertops, custom cabinetry, pendant lights, natural window light streaming in from the left. Wide shot showing full space, slight imperfections in real tile grout. Shot on Canon 5D Mark IV with 35mm lens, f/4, diffused daylight. ${HYPER_REAL}`,
      about: `Candid portrait of a weathered male contractor in his early 50s on a job site. Hard hat pushed back, work-worn Carhartt shirt, genuine relaxed smile mid-conversation. Job site framing visible in background, overcast diffused light. Shot on Canon 5D Mark IV with 85mm lens at f/2.8, shallow depth of field. ${HYPER_REAL}`,
      team: `Candid documentary group photograph of a four-person construction crew on a completed project. Workers in mismatched PPE gear, genuine laughter, afternoon golden hour light. Shot wide at f/5.6 on Canon 5D Mark IV with 35mm lens, natural shadows, dust particles visible in air. ${HYPER_REAL}`,
    },
    restaurant: {
      hero: `Wide-angle interior photograph of a warm upscale farm-to-table restaurant at dinner service — empty but set tables, Edison bulb pendant lights, reclaimed wood walls, candles lit, leather banquettes. No people. Overcast natural light from front windows mixed with warm interior. Shot on Canon 5D Mark IV with 17mm tilt-shift lens, f/8. ${HYPER_REAL}`,
      gallery: `Close-up food photography of a beautifully plated seasonal entrée on a handmade ceramic plate — delicate sauce work, fresh microgreens, slight imperfection in the plating. Shot overhead on a worn linen tablecloth with soft window light from the left. Canon 5D Mark IV with 100mm macro lens, f/4.5. ${HYPER_REAL}`,
      about: `Candid portrait of a confident head chef in her early 40s in a working restaurant kitchen during service. White chef coat slightly stained, genuine focused expression, motion blur of other staff in background. Warm overhead kitchen lighting. Shot on Canon 5D Mark IV with 85mm lens, f/2.2. ${HYPER_REAL}`,
      team: `Documentary photograph of a restaurant kitchen crew plating dishes during service — steam rising from pots, motion blur on hands, multiple staff in frame, warm amber overhead light. Shot at 1/60s on Canon 5D Mark IV with 35mm lens to capture authentic motion. ${HYPER_REAL}`,
    },
    gym: {
      hero: `Wide-angle architectural photograph of a modern functional fitness studio — rubber hex tile floors, racks of dumbbells, pull-up rigs, chalk dust in the air, dramatic overhead track lighting. No people. Shot on Canon 5D Mark IV with 16mm lens, f/8, mixed LED and natural light from side windows. ${HYPER_REAL}`,
      gallery: `Dynamic sports photograph of an athletic woman mid-clean-and-jerk, barbell overhead, muscles defined, chalk flying, intense focused expression. Shot at 1/500s to freeze motion, dramatic side lighting, slight motion blur on barbell plates. Canon 5D Mark IV with 70mm lens, f/3.5. ${HYPER_REAL}`,
      about: `Candid portrait of a female personal trainer in her early 30s in a real gym setting — athletic wear, clipboard in hand, natural genuine smile while looking off-camera. Gym equipment and members blurred in background, overcast window light. Canon 5D Mark IV with 85mm lens at f/2.8. ${HYPER_REAL}`,
      team: `Group photograph of four coaches in branded athletic wear standing informally in a gym — different heights and builds, authentic relaxed postures, not posed. Mixed natural and overhead lighting. Shot on Canon 5D Mark IV with 35mm lens, f/5.6, late afternoon light. ${HYPER_REAL}`,
    },
    salon: {
      hero: `Wide interior photograph of a boutique hair salon during a quiet afternoon — modern styling chairs with real leather wear, large mirrors, plants, marble counters, tool holders with real tools. Soft diffused natural light from tall windows. No people. Canon 5D Mark IV with 24mm lens, f/6.3, overcast daylight. ${HYPER_REAL}`,
      gallery: `Close-up beauty photography of a real model's hair — stunning balayage color melt from brunette to caramel blonde, natural waves, slight flyaways and texture. Photographed in a salon chair with soft window light from the left. Canon 5D Mark IV with 135mm lens at f/2.8. ${HYPER_REAL}`,
      about: `Candid portrait of a stylish female hairstylist in her mid-30s at her station — holding a brush mid-action, creative tattoos visible on forearm, genuine engaged expression. Salon mirrors and products slightly blurred in background. Soft natural window light. Canon 5D Mark IV with 85mm at f/2.2. ${HYPER_REAL}`,
      team: `Candid group photograph of three salon stylists in a real salon — each with distinct personal style and hair, mid-conversation with natural smiles, not looking at camera. Warm afternoon light, real salon environment with tools and products visible. Canon 5D Mark IV with 35mm at f/5.6. ${HYPER_REAL}`,
    },
    boutique: {
      hero: `Wide interior photograph of an independent women's clothing boutique — curated racks of real garments, wooden fixtures, vintage-style rugs, natural linen and woven baskets. No people. Soft overcast natural light from large front windows. Canon 5D Mark IV with 24mm lens at f/7.1. ${HYPER_REAL}`,
      gallery: `Flat lay fashion editorial on a real linen surface — curated clothing items, small accessories, handwritten tag, natural imperfect wrinkles in fabric. Soft natural diffused overhead light, slight shadows showing texture. Canon 5D Mark IV with 50mm lens at f/4, directly overhead. ${HYPER_REAL}`,
      about: `Candid portrait of a boutique owner in her early 40s — stylish but not overdone, mid-task arranging a clothing rack, genuine absorbed expression, warm natural window light from the side. Boutique interior visible behind her. Canon 5D Mark IV with 85mm at f/2.5. ${HYPER_REAL}`,
      team: `Candid lifestyle photograph of the boutique owner and one employee unpacking new arrival boxes — both laughing, tissue paper and garments in motion, warm afternoon light, authentic mess of packaging on the floor. Canon 5D Mark IV with 35mm at f/4. ${HYPER_REAL}`,
    },
    coffee: {
      hero: `Wide-angle interior photograph of a specialty coffee roastery — exposed brick walls, burlap coffee sacks stacked, a large drum roaster with visible patina, warm amber pendant lighting, wooden shelving with labeled bags. No people. Canon 5D Mark IV with 17mm lens at f/8, warm tungsten and natural light mix. ${HYPER_REAL}`,
      gallery: `Close-up product photograph of a freshly pulled espresso in a ceramic demitasse — crema forming with natural swirl imperfections, slight steam rising, dark wooden bar surface with coffee grounds nearby. Soft side window light. Canon 5D Mark IV with 100mm macro at f/3.5. ${HYPER_REAL}`,
      about: `Candid portrait of a male barista in his early 30s — short beard, coffee-stained apron, mid-calibration of a grinder, intense focus and quiet confidence. Warm roastery ambient light from side, shelves of coffee bags blurred behind. Canon 5D Mark IV with 85mm at f/2. ${HYPER_REAL}`,
      team: `Documentary photograph of two roastery staff at work — one monitoring the roaster dials, one hand-scooping freshly roasted beans, natural teamwork with no eye contact to camera. Warm amber overhead light, real industrial equipment. Canon 5D Mark IV with 35mm at f/4, 1/80s. ${HYPER_REAL}`,
    },
  };

  const typeKey =
    Object.keys(prompts).find((k) => businessType.toLowerCase().includes(k)) ||
    "restaurant";

  return (
    prompts[typeKey]?.[slot] ||
    prompts[typeKey]?.hero ||
    `Professional DSLR photograph, natural lighting, editorial quality. ${HYPER_REAL}`
  );
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
): Promise<string> {
  if (customerPhotoUrl) return customerPhotoUrl;

  const prompt = buildDetailedPrompt(businessType, slot);

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
