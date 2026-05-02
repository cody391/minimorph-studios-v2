import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { getProjectName } from "./cloudflareDeployment";
import { injectImages } from "./imageInjector";

const PREMIUM_REQUIREMENTS = `== PREMIUM SHOWCASE REQUIREMENTS ==
This is a MiniMorph Studios showcase demo site.
It must look world-class — better than 90% of all small business websites on the internet.

REQUIRED CSS STANDARDS:
- CSS custom properties for all colors at :root
- Smooth transitions on ALL interactive elements (transition: all 0.3s ease)
- Cards: box-shadow 0 4px 24px rgba(0,0,0,0.12)
- Border radius: 12-16px on all cards
- Section padding: 80px-120px top and bottom
- Max content width: 1200px centered with auto margins
- Full-viewport hero: min-height 100vh
- Sticky navigation with backdrop-filter: blur(10px)
- ALL buttons have hover states with color transitions
- Mobile responsive with @media (max-width: 768px)

REQUIRED TYPOGRAPHY:
- Display headlines: Georgia or Playfair Display serif, 64-72px, bold
- Section headlines: serif, 48px
- Sub-headlines: sans-serif, 24px
- Body text: sans-serif, 16px, line-height 1.7
- Mix serif headlines with clean sans-serif body

REQUIRED CONTENT STANDARDS:
- Every page has minimum 6 full sections
- Zero placeholder text — all copy is specific, compelling, and written for that exact business
- Real pricing, real service names, real details
- Testimonials include specific results and numbers
- CTAs are large, prominent, colored with hover effects
- Navigation has business logo/name + CTA button

ADD-ON SHOWCASE REQUIREMENTS:
Each add-on must be VISUALLY PRESENT on the page.

Review Collector widget:
<div style='background:#f8f9fa;border-radius:12px;padding:24px;max-width:480px'>
<div style='color:#fbbc04;font-size:20px'>★★★★★</div>
<p style='font-style:italic;margin:8px 0'>[specific review text for this business]</p>
<p style='font-weight:600'>[Reviewer Name]</p>
<p style='font-size:13px;color:#666'>via Google Reviews</p>
</div>

Booking Widget:
<div style='background:#fff;border:2px solid [primary];border-radius:12px;padding:32px;max-width:420px'>
<h3>Book Your Appointment</h3>
<select style='width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ddd'>
<option>Select Service</option>[real services for this business]</select>
<input type='date' style='width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ddd'>
<button style='width:100%;padding:14px;background:[primary color];color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer'>Confirm Booking</button>
</div>

AI Chat Widget (bottom right fixed):
<div style='position:fixed;bottom:24px;right:24px;z-index:1000'>
<div style='background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:320px;overflow:hidden'>
<div style='background:[primary];padding:16px;color:#fff;font-weight:600'>💬 Chat with us</div>
<div style='padding:16px'>
<div style='background:#f0f0f0;border-radius:8px;padding:12px;margin-bottom:8px;font-size:14px'>Hi! How can I help you today?</div>
</div>
</div>
</div>

Lead Capture Form:
<form style='background:[secondary];border-radius:16px;padding:40px;max-width:500px'>
<h3 style='margin-bottom:24px'>[CTA headline]</h3>
[name, email, phone, relevant dropdown, submit button]
<p style='font-size:13px;margin-top:12px;opacity:0.7'>⚡ We respond within 5 minutes during business hours</p>
</form>

Instagram Feed:
<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:600px'>
[9 divs with background colors from brand palette, aspect-ratio:1, with hover overlay]
</div>
<p style='text-align:center;margin-top:12px'>Follow us @[handle]</p>

Email Newsletter:
<div style='background:[gradient];padding:60px 40px;text-align:center;border-radius:16px'>
<h3>[Newsletter headline for this business]</h3>
<p>[Value proposition]</p>
<div style='display:flex;gap:12px;max-width:400px;margin:24px auto 0'>
<input placeholder='Your email address' style='flex:1;padding:14px;border-radius:8px;border:none;font-size:16px'>
<button style='padding:14px 24px;background:[primary];color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer'>Subscribe</button>
</div>
</div>

Google Reviews Section:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px'>
[4-5 review cards with stars, review text specific to this business, reviewer name, date]
</div>

SEO Blog Section:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px'>
[3 article cards with title, excerpt, Read More link]
</div>

Ecommerce Product Grid:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px'>
[product cards with name, description, price, Add to Cart button in primary color]
</div>

FOOTER REQUIREMENTS:
Every site must have a proper footer with:
- Business name and tagline
- Navigation links
- Contact info (phone, email, address)
- Social media links
- Copyright line
- 'Powered by MiniMorph Studios' in small text

MINIMORPH BANNER (top of every page):
<div style='background:#0a0a12;color:#fff;padding:10px 20px;text-align:center;font-size:14px;position:sticky;top:0;z-index:9999'>
MiniMorph Studios Demo — [Business Name] | Built on the [Package] plan | <a href='https://minimorphstudios.net/get-started' style='color:#3b82f6;font-weight:600'>Start Your Build</a>
</div>`;

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

    const systemPrompt = `${PREMIUM_REQUIREMENTS}

You are an expert web designer and developer. You build stunning, conversion-optimized websites for small businesses. You write clean, modern HTML5, CSS3, and vanilla JavaScript. Your sites are:
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

For images: use CSS gradients, shapes, and SVG illustrations where photos would go. Add a comment <!-- REPLACE WITH: description of ideal photo for this slot --> immediately after each image element so the image pipeline can swap in real photos.

Pages must include intelligent internal linking between each other.
Navigation must use relative hrefs matching the page list (about.html, services.html, contact.html, etc.).

Output ONLY raw HTML starting with <!DOCTYPE html> and ending with </html>.
No JSON, no markdown fences, no explanation.`;

    const navLinks = pageList
      .map((p) => (p === "index" ? "/" : `/${p}`))
      .join(", ");

    const sharedContext = `BUSINESS: ${project.businessName}
CONTACT: ${project.contactName} (${project.contactEmail})
PACKAGE: ${project.packageTier}
WEBSITE TYPE: ${websiteType}
ALL SITE PAGES (for navigation): ${navLinks}

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
${assetSummary}`;

    const pages: Record<string, string> = {};

    for (let pi = 0; pi < pageList.length; pi++) {
      const pageName = pageList[pi];
      const pageLabel =
        pageName === "index" ? "Home (index.html)" : `${pageName}.html`;

      await db.updateOnboardingProject(projectId, {
        generationLog: `Generating page ${pi + 1}/${pageList.length}: ${pageLabel}...`,
      });

      const isHome = pageName === "index";
      const pageInstruction = isHome
        ? `Generate the Home page (index.html). This is the most important page — include hero, services, social proof, and ALL add-ons from mustHaveFeatures as fully-styled widgets. Make it visually stunning.`
        : `Generate the ${pageLabel} page. Include relevant add-ons where they make sense for this page type.`;

      // Retry up to 3 times per page
      let html = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `${pageInstruction}

THIS PAGE: ${pageLabel}

${sharedContext}

Remember: output ONLY raw HTML starting with <!DOCTYPE html>.`,
              },
            ],
            maxTokens: 8000,
          });

          const raw =
            typeof result.choices[0]?.message?.content === "string"
              ? result.choices[0].message.content
              : "";

          if (!raw.includes("<!DOCTYPE") && !raw.includes("<html")) {
            throw new Error("Response missing HTML tags");
          }

          html = raw
            .replace(/^```html?\s*/im, "")
            .replace(/\s*```\s*$/im, "")
            .trim();
          break;
        } catch (pageErr: any) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 60_000));
          } else {
            throw new Error(
              `Failed to generate page "${pageName}" after 3 attempts: ${pageErr.message}`
            );
          }
        }
      }

      pages[pageName] = html;
    }

    if (Object.keys(pages).length === 0) {
      throw new Error("No pages were generated");
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

    // Inject real images (Replicate hero + Unsplash fills) into every page
    await db.updateOnboardingProject(projectId, {
      generationLog: "Injecting images...",
    });
    for (const pageName of Object.keys(pages)) {
      try {
        pages[pageName] = await injectImages(pages[pageName], projectId, pageName);
      } catch {
        // Image injection is best-effort — never block delivery
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

export async function generateSiteHtmlDirect(params: {
  businessName: string;
  packageTier: string;
  industry: string;
  pages: string[];
  questionnaire: Record<string, unknown>;
}): Promise<string> {
  const systemPrompt = `${PREMIUM_REQUIREMENTS}

You are an expert web designer and developer. You build stunning, conversion-optimized websites.

You embed ALL CSS in a <style> tag in the <head>.
You embed ALL JavaScript in a <script> tag before </body>.
You use Google Fonts via a single @import in the CSS.
You never reference external CSS files or JS files.
You never use frameworks like Bootstrap, React, or Vue.
You create genuine custom designs that reflect the brand perfectly.

For images: use CSS gradients, shapes, and SVG illustrations. Add a comment <!-- REPLACE WITH: description --> where photos would go.

Pages must include intelligent internal linking. Navigation must work across all pages using relative hrefs (about.html, services.html, etc.).

Output ONLY a valid JSON object where each key is a page name and each value is the complete HTML for that page.
Output ONLY valid JSON, no markdown fences, no explanation, no wrapper key.`;

  const userPrompt = `Generate a complete, world-class ${params.industry} website for this business.

BUSINESS: ${params.businessName}
INDUSTRY: ${params.industry}
PACKAGE: ${params.packageTier}
PAGES TO GENERATE: ${params.pages.join(", ")}

This is a SHOWROOM DEMO site — the best-looking small business website the visitor has ever seen.
Include ALL add-ons listed in addOnsIncluded as fully-styled working widgets using the exact HTML templates from the system prompt.
Every widget must be visually present, branded to match the site, and look completely real.

FULL QUESTIONNAIRE DATA:
${JSON.stringify(params.questionnaire, null, 2)}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 32000,
  });

  const rawContent = typeof result.choices[0]?.message?.content === "string"
    ? result.choices[0].message.content
    : "";

  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let pages: Record<string, string>;
  try {
    const parsed = JSON.parse(cleaned);
    pages = parsed.pages && typeof parsed.pages === "object" ? parsed.pages : (parsed as Record<string, string>);
  } catch {
    throw new Error(`AI returned non-JSON output. Raw: ${rawContent.slice(0, 300)}`);
  }

  if (!pages || Object.keys(pages).length === 0) {
    throw new Error("AI returned empty pages");
  }

  return JSON.stringify(pages);
}
