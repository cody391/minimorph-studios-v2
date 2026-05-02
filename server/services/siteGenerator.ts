import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { getProjectName } from "./cloudflareDeployment";

function getPagesForBusinessType(websiteType: string): string[] {
  switch ((websiteType || "").toLowerCase()) {
    case "restaurant":
      return ["index", "menu", "about", "reservations", "contact"];
    case "contractor":
      return ["index", "services", "about", "gallery", "quote", "contact"];
    case "ecommerce":
      return ["index", "products", "about", "contact"];
    case "service_business":
    case "service business":
      return ["index", "about", "services", "contact"];
    default:
      return ["index", "about", "services", "contact"];
  }
}

async function fetchAssetAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(buffer).toString("base64");
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function generateSiteForProject(projectId: number): Promise<void> {
  const project = await db.getOnboardingProjectById(projectId);
  if (!project) {
    console.error(`[SiteGenerator] Project ${projectId} not found`);
    return;
  }

  await db.updateOnboardingProject(projectId, {
    generationStatus: "generating",
    stage: "design",
    generationLog: "Starting AI site generation...",
  });

  // Notify customer build has started
  try {
    const { sendBuildStartedEmail } = await import("./customerEmails");
    await sendBuildStartedEmail({
      to: project.contactEmail,
      customerName: project.contactName,
      businessName: project.businessName,
      portalUrl: `${ENV.appUrl || "https://minimorphstudios.net"}/portal`,
    });
  } catch (emailErr) {
    console.error("[SiteGenerator] Build started email failed:", emailErr);
  }

  // Notify admin
  try {
    const { notifyOwner } = await import("../_core/notification");
    await notifyOwner({
      title: "Site Build Started",
      content: `Build triggered for ${project.businessName} (Project #${projectId}). Package: ${project.packageTier}.`,
    });
  } catch {}

  try {
    const assets = await db.listProjectAssets(projectId);
    const questionnaire = project.questionnaire as Record<string, unknown> | null;

    // Determine which pages to build based on business type
    const websiteType = (questionnaire?.websiteType as string) || "other";
    const pageList = getPagesForBusinessType(websiteType);

    // Build asset summary for prompt
    const assetSummary = assets.length > 0
      ? assets.map(a => `- ${a.category}: ${a.fileName} (available at: ${a.fileUrl})`).join("\n")
      : "No assets uploaded — use CSS gradients, shapes, and SVG illustrations as placeholders.";

    // Extract key questionnaire fields for prompt
    const q = questionnaire || {};
    const brandColors = (q.brandColors as string) || "Not specified — choose modern, professional colors";
    const brandTone = (q.brandTone as string) || "professional";
    const targetAudience = (q.targetAudience as string) || "local customers";
    const competitorSites = Array.isArray(q.competitorSites) ? (q.competitorSites as string[]).join(", ") : (q.competitorSites as string) || "None specified";
    const inspirationSites = Array.isArray(q.inspirationSites) ? (q.inspirationSites as string[]).join(", ") : (q.inspirationSites as string) || "None specified";
    const specialRequests = (q.specialRequests as string) || "None";
    const mustHaveFeatures = Array.isArray(q.mustHaveFeatures) ? (q.mustHaveFeatures as string[]).join(", ") : "Standard";

    const fullQuestionnaireText = JSON.stringify(q, null, 2);

    const systemPrompt = `You are an expert web designer and developer. You build stunning, conversion-optimized websites for small businesses. You write clean, modern HTML5, CSS3, and vanilla JavaScript. Your sites are:
- Fully mobile responsive (mobile-first)
- Fast loading (no external dependencies except Google Fonts)
- SEO optimized (proper meta tags, semantic HTML, schema markup)
- Conversion focused (clear CTAs, trust signals, social proof)
- Visually professional (not generic — truly custom to this business)
- Accessible (proper alt tags, contrast ratios, semantic elements)

You embed ALL CSS in a <style> tag in the <head>.
You embed ALL JavaScript in a <script> tag before </body>.
You use Google Fonts via a single @import in the CSS.
You never reference external CSS files or JS files.
You never use frameworks like Bootstrap, React, or Vue.
You create genuine custom designs that reflect the brand perfectly.

For images: use CSS gradients, shapes, and SVG illustrations where photos would go. Add a comment: <!-- REPLACE WITH: description of ideal photo --> so the team knows what to swap in.

Pages must include intelligent internal linking between each other.
The navigation must work across all pages using relative hrefs (about.html, services.html, contact.html, etc.).

Output ONLY a valid JSON object where each key is a page name (index, about, services, contact, etc.) and each value is the complete HTML for that page. All pages share consistent navigation, colors, fonts, and brand identity.

Example output shape:
{
  "index": "<!DOCTYPE html><html>...</html>",
  "about": "<!DOCTYPE html><html>...</html>",
  "contact": "<!DOCTYPE html><html>...</html>"
}

Output ONLY valid JSON, no markdown fences, no explanation, no wrapper key.`;

    const userPrompt = `Generate a complete, production-ready ${websiteType} website for this business.

BUSINESS: ${project.businessName}
CONTACT: ${project.contactName} (${project.contactEmail})
PACKAGE: ${project.packageTier}
WEBSITE TYPE: ${websiteType}

BRAND COLORS: ${brandColors}
BRAND TONE: ${brandTone}
TARGET AUDIENCE: ${targetAudience}

COMPETITOR SITES (what we need to beat):
${competitorSites}

INSPIRATION SITES (what the customer loves):
${inspirationSites}

MUST-HAVE FEATURES: ${mustHaveFeatures}
SPECIAL REQUESTS: ${specialRequests}

FULL QUESTIONNAIRE DATA:
${fullQuestionnaireText}

UPLOADED ASSETS:
${assetSummary}

PAGES TO GENERATE: ${pageList.join(", ")}

Build each page completely. The homepage (index) should be the most impactful — hero section, services/value prop, social proof, CTA. Every page needs the same nav and footer. Make it genuinely specific to this business. Use their actual business name, services, location, and tone throughout. This should look like a $5,000 custom website, not a template.`;

    await db.updateOnboardingProject(projectId, {
      generationLog: "Calling AI model for full site generation...",
    });

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 16000,
    });

    const rawContent = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";

    // Strip markdown fences if present
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    let pages: Record<string, string>;
    try {
      const parsed = JSON.parse(cleaned);
      // Handle both flat format { index: "<html>..." } and wrapped { pages: { index: "..." } }
      if (parsed.pages && typeof parsed.pages === "object") {
        pages = parsed.pages;
      } else {
        pages = parsed as Record<string, string>;
      }
    } catch {
      throw new Error(`AI returned non-JSON output. Raw: ${rawContent.slice(0, 500)}`);
    }

    if (!pages || typeof pages !== "object" || Object.keys(pages).length === 0) {
      throw new Error("AI response missing page content");
    }

    // Inject logo as base64 if available
    const logoAsset = assets.find(a => a.category === "logo");
    if (logoAsset?.fileUrl) {
      await db.updateOnboardingProject(projectId, { generationLog: "Injecting brand assets..." });
      try {
        const logoBase64 = await fetchAssetAsBase64(logoAsset.fileUrl);
        if (logoBase64) {
          for (const pageName of Object.keys(pages)) {
            pages[pageName] = pages[pageName]
              .replace(/<!-- LOGO_PLACEHOLDER -->/g, `<img src="${logoBase64}" alt="${project.businessName} logo" style="max-height:60px;" />`)
              .replace(/src="logo\.png"/g, `src="${logoBase64}"`)
              .replace(/src="logo\.svg"/g, `src="${logoBase64}"`);
          }
        }
      } catch {
        // Best-effort — continue without logo injection
      }
    }

    // Store the cloudflare project name so siteDeployment can reuse it
    const cfProjectName = getProjectName(project.businessName, projectId);

    await db.updateOnboardingProject(projectId, {
      generationStatus: "complete",
      generationLog: `Generated ${Object.keys(pages).length} pages: ${Object.keys(pages).join(", ")}`,
      generatedSiteHtml: JSON.stringify(pages),
      stage: "review",
      previewReadyAt: new Date(),
      cloudflareProjectName: cfProjectName,
    });

    // Also persist pages to S3 individually — best-effort, non-blocking
    try {
      const { ENV: envVars } = await import("../_core/env");
      if (envVars.awsAccessKeyId && envVars.awsS3Bucket) {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: envVars.awsRegion,
          credentials: {
            accessKeyId: envVars.awsAccessKeyId,
            secretAccessKey: envVars.awsSecretAccessKey,
          },
        });
        for (const [pageName, html] of Object.entries(pages)) {
          const key = `sites/${projectId}/${pageName}.html`;
          await s3.send(new PutObjectCommand({
            Bucket: envVars.awsS3Bucket,
            Key: key,
            Body: html,
            ContentType: "text/html",
          }));
        }
        console.log(`[SiteGenerator] Uploaded ${Object.keys(pages).length} pages to S3 for project ${projectId}`);
      }
    } catch {
      // S3 upload is non-critical
    }

    // Send preview ready email
    try {
      const { sendPreviewReadyEmail } = await import("./customerEmails");
      const revisionsRemaining = project.revisionsRemaining ?? 3;
      await sendPreviewReadyEmail({
        to: project.contactEmail,
        customerName: project.contactName,
        businessName: project.businessName,
        pageNames: Object.keys(pages),
        portalUrl: `${ENV.appUrl || "https://minimorphstudios.net"}/portal`,
        revisionsRemaining,
      });
    } catch (emailErr) {
      console.error("[SiteGenerator] Preview ready email failed:", emailErr);
    }

    // Notify admin
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "Site Preview Ready for QA",
        content: `${project.businessName} (#${projectId}) site preview is ready. Pages: ${Object.keys(pages).join(", ")}. Awaiting customer review.`,
      });
    } catch {}

    console.log(`[SiteGenerator] Project ${projectId} generated successfully. Pages: ${Object.keys(pages).join(", ")}`);
  } catch (err) {
    console.error(`[SiteGenerator] Project ${projectId} generation failed:`, err);
    await db.updateOnboardingProject(projectId, {
      generationStatus: "failed",
      generationLog: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
    }).catch(() => {});
  }
}
