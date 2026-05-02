/**
 * Image injection pipeline for generated sites.
 *
 * After HTML generation, the Claude output contains:
 *   <!-- REPLACE WITH: description of ideal photo -->
 * near every image slot. This module resolves those into real URLs:
 *
 *   1. Hero image → Replicate Flux 1.1 Pro (best quality, ~30-60s)
 *   2. All others → Unsplash API (instant)
 *   3. Either fails → leave CSS gradient in place (silent, non-blocking)
 *
 * If Cloudflare R2 is configured, images are re-hosted there for
 * permanent URLs. Otherwise the source URL is used directly.
 */

import { ENV } from "../_core/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REPLACE_REGEX = /<!--\s*REPLACE WITH:\s*([^\n\-][^-]*?)\s*-->/gi;

// ─── Replicate ────────────────────────────────────────────────────────────────

async function generateWithReplicate(
  description: string,
  timeoutMs = 90_000
): Promise<string | null> {
  if (!ENV.replicateApiKey) return null;

  try {
    const createRes = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: `${description}, professional photography, high resolution, no text, no watermarks`,
            width: 1440,
            height: 960,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            output_format: "webp",
            output_quality: 90,
          },
        }),
      }
    );

    if (!createRes.ok) return null;
    const prediction = (await createRes.json()) as any;
    const pollUrl: string = prediction?.urls?.get;
    if (!pollUrl) return null;

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${ENV.replicateApiKey}` },
      });
      const result = (await pollRes.json()) as any;
      if (result.status === "succeeded" && result.output?.[0]) {
        return result.output[0] as string;
      }
      if (result.status === "failed" || result.status === "canceled") {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

// Extract a short 2-3 word search query from a long description
function descriptionToQuery(description: string): string {
  const lower = description.toLowerCase();
  const INDUSTRY_TERMS: [string, string][] = [
    ["restaurant", "restaurant interior"],
    ["dining", "restaurant dining"],
    ["food", "food photography"],
    ["kitchen", "restaurant kitchen"],
    ["contractor", "construction worker"],
    ["construction", "construction site"],
    ["building", "building construction"],
    ["gym", "gym fitness"],
    ["fitness", "fitness workout"],
    ["workout", "gym workout"],
    ["salon", "hair salon"],
    ["spa", "luxury spa"],
    ["coffee", "coffee shop"],
    ["cafe", "coffee cafe"],
    ["barista", "barista coffee"],
    ["boutique", "clothing boutique"],
    ["retail", "retail store"],
    ["shop", "boutique shop"],
    ["medical", "medical office"],
    ["dental", "dental office"],
    ["law", "law office"],
    ["real estate", "luxury home"],
    ["hotel", "hotel lobby"],
  ];
  for (const [keyword, query] of INDUSTRY_TERMS) {
    if (lower.includes(keyword)) return query;
  }
  // Fallback: first 3 words of description
  return description.split(/\s+/).slice(0, 3).join(" ");
}

async function fetchUnsplash(description: string): Promise<string | null> {
  if (!ENV.unsplashAccessKey) return null;
  try {
    const query = encodeURIComponent(descriptionToQuery(description));
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${ENV.unsplashAccessKey}` } }
    );
    if (!res.ok) return null;
    const photo = (await res.json()) as any;
    return (photo?.urls?.regular as string) || null;
  } catch {
    return null;
  }
}

// ─── R2 upload ───────────────────────────────────────────────────────────────

async function uploadToR2(
  imageUrl: string,
  r2Key: string
): Promise<string> {
  if (
    !ENV.cloudflareR2Bucket ||
    !ENV.cloudflareR2AccessKeyId ||
    !ENV.cloudflareAccountId
  ) {
    return imageUrl;
  }

  try {
    const imgRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!imgRes.ok) return imageUrl;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType =
      imgRes.headers.get("content-type") || "image/webp";

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${ENV.cloudflareAccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ENV.cloudflareR2AccessKeyId,
        secretAccessKey: ENV.cloudflareR2SecretAccessKey,
      },
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: ENV.cloudflareR2Bucket,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const base = ENV.imageAssetCdnBaseUrl.replace(/\/$/, "");
    return base ? `${base}/${r2Key}` : imageUrl;
  } catch {
    return imageUrl;
  }
}

// ─── HTML injection ───────────────────────────────────────────────────────────

function replaceImgSrcBefore(
  html: string,
  commentIndex: number,
  newUrl: string
): string {
  // Look back up to 1000 chars for the most recent <img tag
  const searchStart = Math.max(0, commentIndex - 1000);
  const before = html.slice(searchStart, commentIndex);
  const lastImgOffset = before.lastIndexOf("<img");
  if (lastImgOffset === -1) return html;

  const absoluteImgStart = searchStart + lastImgOffset;
  const tagEnd = html.indexOf(">", absoluteImgStart);
  if (tagEnd === -1) return html;

  const originalTag = html.slice(absoluteImgStart, tagEnd + 1);
  const updatedTag = originalTag.replace(/src="[^"]*"/, `src="${newUrl}"`);
  if (updatedTag === originalTag) return html; // src already real or not found

  return html.slice(0, absoluteImgStart) + updatedTag + html.slice(tagEnd + 1);
}

/**
 * Injects real images into generated HTML by resolving all
 * <!-- REPLACE WITH: description --> comments.
 *
 * - First comment (hero) → Replicate Flux 1.1 Pro
 * - All others → Unsplash
 * - Any failure → original CSS gradient stays in place
 */
export async function injectImages(
  html: string,
  projectId: number,
  pageName: string
): Promise<string> {
  if (!ENV.replicateApiKey && !ENV.unsplashAccessKey) return html;

  // Collect all matches first so indices stay stable during iteration
  const regex = new RegExp(REPLACE_REGEX.source, "gi");
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) matches.push(m);
  if (matches.length === 0) return html;

  let result = html;
  let imageIndex = 0;

  for (const match of matches) {
    const description = match[1].trim();
    const isHero = imageIndex === 0;

    // Resolve image URL
    let imageUrl: string | null = null;
    if (isHero) {
      // Hero: try Replicate first (worth the wait), fall back to Unsplash
      imageUrl = await generateWithReplicate(description, 90_000);
      if (!imageUrl) imageUrl = await fetchUnsplash(description);
    } else {
      // Non-hero: Unsplash only (instant)
      imageUrl = await fetchUnsplash(description);
    }

    if (!imageUrl) {
      imageIndex++;
      continue;
    }

    // Optionally re-host on R2
    const r2Key = `sites/${projectId}/${pageName}-img${imageIndex}.webp`;
    const finalUrl = await uploadToR2(imageUrl, r2Key);

    // Remove the comment from result, then patch the preceding img src
    const commentIndex = result.indexOf(match[0]);
    if (commentIndex !== -1) {
      result = replaceImgSrcBefore(result, commentIndex, finalUrl);
      result = result.replace(match[0], ""); // remove the comment
    }

    imageIndex++;
  }

  return result;
}
