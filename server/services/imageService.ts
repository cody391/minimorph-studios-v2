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
// Sole image provider — 300s timeout, one retry on timeout before giving up

async function generateImageGeminiNanoBanana(
  prompt: string,
  slotLabel: string,
): Promise<string | null> {
  if (!ENV.geminiApiKey) return null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Use axios instead of fetch — avoids undici's headersTimeout which cuts off
      // Gemini image generation requests that take 60-300s to start responding.
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" +
          ENV.geminiApiKey,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 300000, // 5 minutes
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
          const url = r2Url ?? (() => {
            console.log("[NanoBanana] R2 unavailable, using data URL");
            return "data:image/jpeg;base64," + part.inlineData.data;
          })();
          const label = attempt === 1 ? "Nano Banana 2 ✅" : "Nano Banana 2 retry ✅";
          console.log(`[ImageService] ${slotLabel} → ${label}`);
          return url;
        }
      }

      console.error("[NanoBanana] No image in response:", JSON.stringify(response.data).slice(0, 300));
      return null;
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.error?.message || e?.message || String(e);
      const isTimeout = e?.code === "ECONNABORTED" || msg.toLowerCase().includes("timeout");

      if (attempt === 1 && isTimeout) {
        console.log(`[NanoBanana] Timeout on attempt 1 — waiting 10s before retry...`);
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }

      console.error(`[NanoBanana] Error attempt ${attempt} (HTTP ${status ?? "?"}):`, msg.slice(0, 300));
      return null;
    }
  }
  return null;
}

// ─── Replicate — DISABLED ─────────────────────────────────────────────────────
// Replicate (Flux 1.1 Pro Ultra) removed as fallback. Gemini is sole provider.
// Rate-limiting below $5 account credit caused SVG gradients across all sites.
// If Gemini fails (both attempts), the pipeline falls through to SVG gradient.
// Re-enable here if a second provider is ever needed.

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
      hero: "Low-angle editorial shot looking up at a skilled contractor mid-task on a real job site, hard hat on, hands gripping a tool with confident purpose, natural overcast daylight from outside filling the space evenly, lumber and materials visible in background showing active work, Kodak Portra 400, 35mm f/2.8, off-center composition, subject clearly competent and in command of the space.",
      gallery:
        "Wide shot of a recently completed interior — tile work, cabinetry, or structural framing — shot from the doorway in soft window light, slight off-center lean, the craftsmanship clearly visible and impressive, 35mm f/4, Kodak Portra 400, natural grain.",
      about:
        "Contractor standing on a job site looking at plans or work in progress, not posing for the camera, wearing real work gear with appropriate wear, overcast natural light, 50mm f/2.0, slight off-center, face visible and focused — conveys competence not chaos.",
      team: "Two or three workers on a job site mid-task, coordinating with each other, natural daylight, real work gear, not posed but not chaotic — they look like a team that knows what they are doing, 35mm f/4.",
    },
    restaurant: {
      hero: "Restaurant dining room just before service, tables set with real linen and glassware, warm Edison bulb ambient light creating genuine atmosphere, slight off-center from near the host stand, depth of field pulls focus to a beautifully set table, Kodak Portra 400, 24mm f/4 — inviting and real.",
      gallery:
        "Overhead plate of a real dish, genuinely delicious looking — natural asymmetry, real textures, steam rising, soft window light from the left, 100mm f/3.5, off-center composition, the food is the clear hero.",
      about:
        "Chef mid-plating focused entirely on the dish, professional kitchen behind them in soft focus, warm kitchen light, 85mm f/2.2, not aware of camera, clearly skilled and in control.",
      team: "Kitchen crew mid-service, coordinated and focused, warm amber kitchen light, steam, motion in the background — one face sharp, genuine energy, 35mm f/2.8.",
    },
    gym: {
      hero: "Wide editorial shot of the fitness studio from a low corner angle, rubber floor in sharp foreground, equipment arranged and ready, good overhead lighting, no people — the space looks serious and welcoming, 24mm f/5.6.",
      gallery:
        "Member mid-lift at peak exertion — real effort, real focus, genuine expression of concentration, side window light, 70mm f/3.5, off-center, the form and effort look impressive.",
      about:
        "Trainer mid-coaching session, animated and engaged, talking to a member off-frame, natural window light, 85mm f/2.0, not posing — clearly expert and approachable.",
      team: "Three or four coaches mid-conversation at the gym, natural light, different body types, genuine energy — candid but not caught in an unflattering moment, 35mm f/4.",
    },
    salon: {
      hero: "Salon interior from the doorway in soft late-afternoon window light, styling chairs and mirrors creating depth, clean and curated but clearly a working space, 24mm f/5.6, slight off-center, inviting and professional.",
      gallery:
        "Close editorial crop of finished hair — color, cut, or style work — from behind the client, window light from left, the work looks genuinely beautiful, 135mm f/2.8, slight grain.",
      about:
        "Stylist mid-technique, focused on the client's hair, soft natural light, genuine concentration, 85mm f/2.2, off-center — expert craft visible.",
      team: "Three stylists in the salon, mid-work or brief moment between clients, distinct personal styles, warm window light, relaxed and real, 35mm f/4.",
    },
    boutique: {
      hero: "Boutique interior from front entrance in morning window light, garments hanging with natural drape, wooden fixtures, curated and intentional space, soft overcast through windows, 24mm f/5.6, no people — the space itself tells the story.",
      gallery:
        "Flat lay overhead of a key clothing item on natural linen — real fabric texture visible, slight natural asymmetry, soft even light, 50mm f/3.5 — the item looks genuinely beautiful.",
      about:
        "Boutique owner at the rack or unpacking new inventory, not posing but clearly in their element, warm window light, wearing their own inventory, 85mm f/2.5.",
      team: "Owner and an employee reviewing new arrivals together, focused on the items, warm afternoon light, genuine and collaborative — real moment not staged, 35mm f/4.",
    },
    coffee: {
      hero: "Wide shot of the coffee roastery or café from a corner angle, roasting drum or espresso machine as hero, warm amber pendant light, real patina and texture on equipment, inviting not chaotic, 24mm f/5.6, slight off-center.",
      gallery:
        "Overhead close-up of a poured espresso in ceramic — real crema, slight steam, grounds on the dark wood bar beside it, soft side window light, 100mm f/3.5, genuinely delicious looking.",
      about:
        "Barista dialing in the grinder or pulling a shot, focused and skilled, warm roastery light, 85mm f/2.0, not aware of the camera — clearly expert.",
      team: "Two staff working together at the bar or roaster, warm ambient light, coordinated and focused, real moment of craft, 35mm f/4.",
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
VIBE: UTILITARIAN — competent, real, capable
- Workers mid-task, focused and clearly skilled — present in the moment, not posing
- Real job sites with materials and tools actively in use
- Completed or in-progress work that looks genuinely impressive — the quality is visible
- Hands working, tools in use, purposeful deliberate movement
- Natural job site light — overcast sky, large window, single work light used well — honest not punishing
- Off-center, handheld feel — like someone who belongs on that site took the shot
- Slight grain, natural texture — images are clear, readable, and trust-building
- Think: a photojournalist embedded on a job site who has genuine respect for the craft
- NOT: flickering greenish fluorescents, chaos, debris everywhere, blown-out ugly work lamps
- NOT: fingerprint smudges, sensor dust, camera shake blur, ugliness for its own sake`,

  luxury: `
VIBE: LUXURY — refined, real, quietly confident
- Soft natural window light — morning or even overcast — never harsh shadows
- Real clients or subjects in real moments — relaxed not posed, present not performative
- Products and spaces that feel curated but genuinely lived in — not sterile showrooms
- Staff mid-work, focused, clearly expert at what they do
- Elegant without being clinical — real textures, real objects, natural asymmetry
- Slight grain, natural imperfections — silk not plastic
- Think: a magazine photographer shooting a real working day, not a styled set
- NOT: harsh shadows, ugly light, chaotic backgrounds, anything that looks like an accident`,

  lifestyle: `
VIBE: LIFESTYLE — warm, real, human
- Real moments of service, craft, and genuine care — not performed for the camera
- Food that looks genuinely delicious — real texture, real steam, real color
- People in motion, candid but aware — not frozen mid-grimace, not posed stiffly
- Warm available light — window, ambient, practical — never studio strobes or cold fluorescent
- Slight grain, natural warmth, honest imperfection that makes it feel real
- Think: a food or lifestyle photographer who makes real look better than perfect
- NOT: clinical sterility, ugly chaos, stock photo arrangements, unflattering grimaces`,

  documentary: `
VIBE: DOCUMENTARY — honest, clear, authentic
- Subject doing their actual work with visible competence and focus
- Available light, real environment — not staged but not chaotic
- Clear readable composition — off-center but purposeful, not accidental
- Grain and texture present — authentic not clinical
- Think: a skilled editorial photographer finding the honest story
- NOT: staged perfection or deliberate ugliness — find the honest middle`,
};

async function generateImagePrompt(
  businessType: string,
  slot: string,
  subNiche?: string,
  imageDirection?: string,
): Promise<string> {
  const vibe = determineVibe(businessType);

  const systemPrompt = `You are a Documentary Brand Photographer.
You shoot editorial photography for small businesses. Your work looks real and authentic but always makes the subject look capable and trustworthy.

You are NOT shooting stock photos — no fake smiles, no perfect lighting, no staged scenes.
You are NOT shooting forensic documentation — no chaos, no ugliness for its own sake.

You are capturing the honest truth of a business in the best possible light.
The real version of their best day.
Workers who clearly know what they are doing.
Spaces that feel lived in and real.
Work that looks impressive because it IS impressive — not because it was staged.

CURRENT VIBE: ${vibe.toUpperCase()}
${VIBE_RULES[vibe]}

PHOTOGRAPHIC CRAFT — apply to ALL vibes:
- Camera: one COLOR film stock — Kodak Portra 400 or Fujifilm 400H
  One lens 35mm to 85mm. One aperture f/1.8 to f/4.
- Natural grain from film stock — present but not overwhelming
- Slight natural vignette at corners — not pushed to black
- Off-center composition — rule of thirds, subject mid-task
- Hero shots: low angle looking up at the work or space
- About/team: subject mid-task, aware but not posed for camera
- Depth: sharp subject, soft background — not blurred to mush

COMPOSITION:
- Off-center always — rule of thirds
- Low angle for hero shots
- Subject mid-task, not posing — but not caught in an unflattering moment
- Face visible if relevant — not cut off unless the work is the story

BANNED — instant fail if present:
studio lighting, stock photo, fake smile, perfect symmetry,
hyperrealistic, 4k, 8k, cinematic, epic, dramatic lighting,
fingerprint smudge, sensor dust, camera shake blur, flickering fluorescent,
ugliness for its own sake, forensic, liability record, insurance photo

SELF-CORRECTION before outputting:
1. Does this look like a real photo from a real business that makes you trust them?
2. Is lighting honest — real and readable, not ugly or staged?
3. Does the subject look competent and capable — not chaotic?
4. Any stock photo clichés? Remove them.
5. Any ugliness for its own sake? Remove it — find the honest version.
6. Is the composition purposeful and off-center?
7. Would a customer see this and feel more confident hiring this business?

FINAL CHECK: Does this look like a real photo from a real business that makes you trust them? If it looks staged or stock — add more authenticity. If it looks ugly or chaotic — add more craft. Find the honest middle.

OUTPUT: One paragraph only. No preamble. Pure prompt.`;

  const competitiveImageBlock = imageDirection
    ? (() => {
        try {
          const dir = JSON.parse(imageDirection);
          return `\nCOMPETITIVE IMAGE DIRECTION:
What to capture: ${dir.what_to_capture}
What competitors never show: ${dir.what_competitors_never_show}
Camera persona: ${dir.camera_persona}
Example shots: ${dir.example_shots?.join(", ")}
Capture what competitors never show. Prove the brand promise through the image.`;
        } catch {
          return "";
        }
      })()
    : "";

  const userMessage = `Shoot editorial brand photography for this business. Business type: ${businessType}. Shot needed: ${slot}.
This photo will appear on their website. It must make customers trust and choose this business.
Vibe: ${vibe}
${subNiche ? "Specific sub-niche: " + subNiche : ""}
${competitiveImageBlock}

What each vibe looks like in practice:
- utilitarian: skilled worker mid-task, real materials, honest job site light, competent not chaotic
- luxury: soft window light, real moment of craft or service, curated but lived-in
- lifestyle: warm candid moment, real food or real people in motion, genuine not posed
- documentary: clear authentic representation, available light, subject doing real work`;

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
//   1. Customer photo (hero slot only) — always wins if provided
//   2. Gemini Nano Banana 2 — 300s timeout, one retry on timeout
//   3. Unsplash — free photo fallback if Gemini fails
//   4. SVG gradient — last resort

export async function getBestImage(
  businessType: string,
  slot: string,
  primaryColor = "#1a1a1a",
  customerPhotoUrl?: string,
  subNiche?: string,
  imageDirection?: string,
): Promise<string> {
  if (customerPhotoUrl && slot === "hero") return customerPhotoUrl;

  const prompt = await generateImagePrompt(businessType, slot, subNiche, imageDirection);

  const geminiUrl = await generateImageGeminiNanoBanana(prompt, slot);
  if (geminiUrl) return geminiUrl;

  const query = [subNiche || businessType, slot].filter(Boolean).join(" ");
  const unsplashUrl = await getUnsplashImage(query);
  if (unsplashUrl) {
    console.log(`[ImageService] ${slot} → Unsplash fallback ✅`);
    return unsplashUrl;
  }

  console.error(`[ImageService] ${slot} → FAILED all providers → SVG gradient`);
  return buildGradientSvg(primaryColor);
}
