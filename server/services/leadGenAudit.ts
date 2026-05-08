/**
 * Website Audit PDF Generator
 * 
 * Generates a professional website audit report as HTML (rendered to PDF via email)
 * that serves as a lead magnet — attached to the first outreach email.
 * 
 * Audit covers: performance, mobile-friendliness, SEO, security, accessibility,
 * competitor comparison, and actionable recommendations.
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapedBusinesses, leads } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";
import { scoreWebsite } from "./leadGenScraper";
import type { EnrichmentResult } from "./leadGenEnrichment";

export interface AuditReport {
  businessName: string;
  websiteUrl: string | null;
  overallScore: number;
  overallGrade: string;
  sections: AuditSection[];
  competitorComparison?: CompetitorComparison;
  recommendations: string[];
  estimatedCustomersLost: string;
  htmlContent: string;
  storageUrl?: string;
}

interface AuditSection {
  name: string;
  score: number;
  grade: string;
  icon: string;
  issues: string[];
  description: string;
}

interface CompetitorComparison {
  competitorName: string;
  competitorWebsite: string;
  competitorScore: number;
  advantages: string[];
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "#22c55e";
    case "B": return "#84cc16";
    case "C": return "#eab308";
    case "D": return "#f97316";
    case "F": return "#ef4444";
    default: return "#6b7280";
  }
}

/**
 * Generate a website audit report for a scraped business
 */
export async function generateAuditReport(businessId: number): Promise<AuditReport> {
  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) throw new Error(`Business ${businessId} not found`);

  const websiteIssues = (biz.websiteIssues as string[] | null) || [];
  const enrichment = (biz.enrichmentData || {}) as EnrichmentResult;
  const websiteScore = biz.websiteScore ?? 0;
  const hasWebsite = biz.hasWebsite;

  // Build audit sections based on actual data
  const sections: AuditSection[] = [];

  if (!hasWebsite) {
    // No website — special audit
    sections.push({
      name: "Web Presence",
      score: 0,
      grade: "F",
      icon: "🌐",
      issues: ["No website detected", "Missing from online search results", "Losing customers to competitors with websites"],
      description: "Your business has no website. In 2026, 97% of consumers search online before visiting a local business. Without a website, you're invisible to potential customers.",
    });
    sections.push({
      name: "Search Visibility",
      score: 5,
      grade: "F",
      icon: "🔍",
      issues: ["Cannot rank in Google search", "No organic traffic possible", "Relying solely on word-of-mouth"],
      description: "Without a website, your business cannot appear in Google search results when customers look for services you offer.",
    });
    sections.push({
      name: "Mobile Experience",
      score: 0,
      grade: "F",
      icon: "📱",
      issues: ["No mobile presence", "Cannot capture mobile searchers", "70% of local searches happen on mobile"],
      description: "Mobile searches for local businesses have grown 250% in the last 3 years. Without a mobile-friendly website, you're missing the majority of potential customers.",
    });
    sections.push({
      name: "Credibility & Trust",
      score: 15,
      grade: "F",
      icon: "🛡️",
      issues: ["No professional online presence", "Customers can't verify your business", "Competitors appear more trustworthy"],
      description: "75% of consumers judge a business's credibility based on their website. Without one, potential customers may choose a competitor instead.",
    });
  } else {
    // Has website — detailed scoring
    const performanceScore = websiteIssues.includes("very_slow") ? 15 :
      websiteIssues.includes("very_large_page") ? 35 : 70;
    sections.push({
      name: "Performance & Speed",
      score: performanceScore,
      grade: getGrade(performanceScore),
      icon: "⚡",
      issues: websiteIssues.filter(i => ["very_slow", "very_large_page"].includes(i))
        .map(i => i === "very_slow" ? "Website takes too long to load (>8 seconds)" : "Page is very large, causing slow load times"),
      description: performanceScore < 50
        ? "Your website is slow. 53% of visitors leave a site that takes more than 3 seconds to load."
        : "Your website loads at an acceptable speed, but there's room for improvement.",
    });

    const mobileScore = websiteIssues.includes("not_mobile_friendly") ? 20 : 85;
    sections.push({
      name: "Mobile Friendliness",
      score: mobileScore,
      grade: getGrade(mobileScore),
      icon: "📱",
      issues: websiteIssues.includes("not_mobile_friendly")
        ? ["Website is not optimized for mobile devices", "Text may be too small to read on phones", "Buttons may be too small to tap"]
        : [],
      description: mobileScore < 50
        ? "Your website doesn't work well on mobile devices. Over 60% of web traffic comes from mobile — you're losing customers."
        : "Your website is mobile-friendly. Good job!",
    });

    const seoScore = [
      websiteIssues.includes("no_title") ? 0 : 25,
      websiteIssues.includes("no_meta_description") ? 0 : 25,
      websiteIssues.includes("no_social_links") ? 0 : 15,
      websiteIssues.includes("no_contact_info") ? 0 : 20,
      15, // base
    ].reduce((a, b) => a + b, 0);
    sections.push({
      name: "SEO & Discoverability",
      score: Math.min(100, seoScore),
      grade: getGrade(Math.min(100, seoScore)),
      icon: "🔍",
      issues: [
        ...(websiteIssues.includes("no_title") ? ["Missing page title — critical for Google ranking"] : []),
        ...(websiteIssues.includes("no_meta_description") ? ["Missing meta description — affects click-through from search results"] : []),
        ...(websiteIssues.includes("no_contact_info") ? ["No visible contact information on the page"] : []),
        ...(websiteIssues.includes("no_social_links") ? ["No social media links found"] : []),
      ],
      description: seoScore < 50
        ? "Your website has significant SEO issues that prevent it from ranking well in search engines."
        : "Your website has basic SEO in place, but could be improved to rank higher.",
    });

    const securityScore = websiteIssues.includes("no_ssl") ? 20 : 90;
    sections.push({
      name: "Security",
      score: securityScore,
      grade: getGrade(securityScore),
      icon: "🔒",
      issues: websiteIssues.includes("no_ssl")
        ? ["No SSL certificate (HTTPS) — browsers show 'Not Secure' warning", "Customer data is not encrypted", "Google penalizes non-HTTPS sites in rankings"]
        : [],
      description: securityScore < 50
        ? "Your website lacks HTTPS encryption. Google Chrome shows a 'Not Secure' warning to visitors, which drives away 85% of potential customers."
        : "Your website uses HTTPS encryption. Good!",
    });

    const accessScore = websiteIssues.includes("poor_accessibility") ? 30 :
      websiteIssues.includes("outdated_layout") ? 25 : 75;
    sections.push({
      name: "Design & Accessibility",
      score: accessScore,
      grade: getGrade(accessScore),
      icon: "🎨",
      issues: [
        ...(websiteIssues.includes("poor_accessibility") ? ["Images missing alt text — hurts accessibility and SEO"] : []),
        ...(websiteIssues.includes("outdated_layout") ? ["Website uses outdated table-based layout", "Design appears dated compared to modern standards"] : []),
        ...(websiteIssues.includes("wix_site") ? ["Built on Wix — limited customization and performance"] : []),
      ],
      description: accessScore < 50
        ? "Your website's design and accessibility need significant improvement to meet modern standards."
        : "Your website design is acceptable but could benefit from modernization.",
    });
  }

  const overallScore = hasWebsite ? websiteScore : 5;
  const overallGrade = getGrade(overallScore);

  // Generate AI recommendations
  let recommendations: string[] = [];
  let estimatedCustomersLost = "15-30 customers per month";

  try {
    const aiResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a web design consultant. Respond with valid JSON." },
        {
          role: "user", content: `Generate 5 specific, actionable recommendations for this business.
Business: ${biz.businessName}
Industry: ${enrichment.industry || (biz.businessTypes as string[] | null)?.[0] || "local business"}
Has Website: ${hasWebsite}
Website Score: ${websiteScore}/100
Issues: ${websiteIssues.join(", ") || "no website"}
Google Rating: ${biz.rating || "unknown"}
Reviews: ${biz.reviewCount || 0}

Respond in JSON:
{
  "recommendations": ["rec 1", "rec 2", "rec 3", "rec 4", "rec 5"],
  "estimatedCustomersLost": "estimated monthly customers lost due to web issues (e.g., '20-40 customers per month')"
}`
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "audit_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: { type: "array", items: { type: "string" } },
              estimatedCustomersLost: { type: "string" },
            },
            required: ["recommendations", "estimatedCustomersLost"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = JSON.parse(aiResponse.choices?.[0]?.message?.content as string);
    recommendations = parsed.recommendations;
    estimatedCustomersLost = parsed.estimatedCustomersLost;
  } catch {
    recommendations = hasWebsite
      ? ["Upgrade to HTTPS for security", "Optimize for mobile devices", "Add proper SEO meta tags", "Improve page load speed", "Add clear calls to action"]
      : ["Create a professional website", "Set up Google Business Profile", "Add online booking/contact forms", "Build a mobile-first design", "Implement local SEO strategy"];
  }

  // Generate the HTML report
  const htmlContent = generateAuditHTML({
    businessName: biz.businessName,
    websiteUrl: biz.website,
    overallScore,
    overallGrade,
    sections,
    recommendations,
    estimatedCustomersLost,
  });

  // Upload to storage
  let storageUrl: string | undefined;
  try {
    const key = `audits/${biz.id}-${Date.now()}.html`;
    const result = await storagePut(key, Buffer.from(htmlContent), "text/html");
    storageUrl = result.url;
  } catch (err) {
    console.error(`[Audit] Failed to upload report for ${biz.businessName}:`, err);
  }

  return {
    businessName: biz.businessName,
    websiteUrl: biz.website,
    overallScore,
    overallGrade,
    sections,
    recommendations,
    estimatedCustomersLost,
    htmlContent,
    storageUrl,
  };
}

/**
 * Generate audit for a lead (uses enrichment data)
 */
export async function generateAuditForLead(leadId: number): Promise<AuditReport | null> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;

  const enrichment = (lead.enrichmentData || {}) as any;
  if (enrichment.scrapedBusinessId) {
    return generateAuditReport(enrichment.scrapedBusinessId);
  }

  // Fallback: generate audit directly from lead data (no scrapedBusinessId required)
  // This handles free audit form submissions where no enrichment has occurred yet.
  return generateAuditFromLeadData(lead);
}

/**
 * Generate an audit report directly from lead data (website URL + business name).
 * Used for public free audit submissions that haven't been enriched yet.
 */
export async function generateAuditFromLeadData(lead: { id: number; businessName: string; website: string | null }): Promise<AuditReport> {
  const businessName = lead.businessName || "Your Business";
  const websiteUrl = lead.website;
  const hasWebsite = !!websiteUrl;

  // Build sections based on whether they have a website
  const sections: AuditSection[] = [];

  if (!hasWebsite) {
    sections.push(
      { name: "Web Presence", score: 0, grade: "F", icon: "\uD83C\uDF10", issues: ["No website detected", "Missing from online search results", "Losing customers to competitors with websites"], description: "Your business has no website. In 2026, 97% of consumers search online before visiting a local business. Without a website, you're invisible to potential customers." },
      { name: "Search Visibility", score: 5, grade: "F", icon: "\uD83D\uDD0D", issues: ["Cannot rank in Google search", "No organic traffic possible", "Relying solely on word-of-mouth"], description: "Without a website, your business cannot appear in Google search results when customers look for services you offer." },
      { name: "Mobile Experience", score: 0, grade: "F", icon: "\uD83D\uDCF1", issues: ["No mobile presence", "Cannot capture mobile searchers", "70% of local searches happen on mobile"], description: "Mobile searches for local businesses have grown 250% in the last 3 years. Without a mobile-friendly website, you're missing the majority of potential customers." },
      { name: "Credibility & Trust", score: 15, grade: "F", icon: "\uD83D\uDEE1\uFE0F", issues: ["No professional online presence", "Customers can't verify your business", "Competitors appear more trustworthy"], description: "75% of consumers judge a business's credibility based on their website. Without one, potential customers may choose a competitor instead." },
    );
  } else {
    // Has a website URL — use real HTTP scorer first, fall back to LLM only if fetch fails
    let realScore: { score: number; issues: string[] } | null = null;
    try {
      realScore = await scoreWebsite(websiteUrl!);
    } catch (err) {
      console.error(`[Audit] scoreWebsite failed for ${websiteUrl}, falling back to LLM:`, err);
    }

    if (realScore) {
      const issueSet = new Set(realScore.issues);
      sections.push(
        {
          name: "Performance & Speed",
          score: issueSet.has("slow") ? 20 : 75,
          grade: getGrade(issueSet.has("slow") ? 20 : 75),
          icon: "⚡",
          issues: issueSet.has("slow") ? ["Page load time exceeds 3 seconds", "Large uncompressed assets detected"] : [],
          description: issueSet.has("slow") ? "Your website loads slowly, causing visitors to leave before it finishes loading." : "Page load speed appears acceptable.",
        },
        {
          name: "Mobile Friendliness",
          score: issueSet.has("not_mobile_friendly") ? 15 : 80,
          grade: getGrade(issueSet.has("not_mobile_friendly") ? 15 : 80),
          icon: "📱",
          issues: issueSet.has("not_mobile_friendly") ? ["Not optimized for mobile devices", "Text too small to read on phones"] : [],
          description: issueSet.has("not_mobile_friendly") ? "Over 70% of local searches happen on mobile. Your site is not mobile-friendly." : "Site renders on mobile devices.",
        },
        {
          name: "SEO & Discoverability",
          score: issueSet.has("no_meta_description") || issueSet.has("no_title") ? 25 : 65,
          grade: getGrade(issueSet.has("no_meta_description") || issueSet.has("no_title") ? 25 : 65),
          icon: "🔍",
          issues: [
            ...(issueSet.has("no_meta_description") ? ["Missing meta description"] : []),
            ...(issueSet.has("no_title") ? ["Missing page title tag"] : []),
          ],
          description: "SEO determines whether customers find you on Google.",
        },
        {
          name: "Security",
          score: issueSet.has("no_ssl") ? 10 : 90,
          grade: getGrade(issueSet.has("no_ssl") ? 10 : 90),
          icon: "🔒",
          issues: issueSet.has("no_ssl") ? ["No SSL certificate — browser shows 'Not Secure' warning"] : [],
          description: issueSet.has("no_ssl") ? "Your site lacks HTTPS. Browsers warn visitors it is Not Secure." : "SSL certificate is present.",
        },
        {
          name: "Overall Quality",
          score: realScore.score,
          grade: getGrade(realScore.score),
          icon: "🎨",
          issues: realScore.issues,
          description: `Overall website quality score: ${realScore.score}/100.`,
        },
      );

      const overallScore = realScore.score;
      const recommendations = [
        ...(issueSet.has("slow") ? ["Optimize images and enable compression to improve page speed"] : []),
        ...(issueSet.has("not_mobile_friendly") ? ["Rebuild site with mobile-first responsive design"] : []),
        ...(issueSet.has("no_ssl") ? ["Install an SSL certificate (HTTPS)"] : []),
        ...(issueSet.has("no_meta_description") ? ["Add unique meta descriptions to every page"] : []),
        "Add clear calls to action on every page",
        "Set up Google Business Profile and keep it updated",
      ].slice(0, 5);
      const estimatedCustomersLost = overallScore < 30 ? "20-40 customers per month" : overallScore < 60 ? "10-20 customers per month" : "5-10 customers per month";

      const htmlContent = generateAuditHTML({ businessName, websiteUrl, overallScore, overallGrade: getGrade(overallScore), sections, recommendations, estimatedCustomersLost });
      let storageUrl: string | undefined;
      try {
        const key = `audits/lead-${lead.id}-${Date.now()}.html`;
        const result = await storagePut(key, Buffer.from(htmlContent), "text/html");
        storageUrl = result.url;
      } catch (err) {
        console.error(`[Audit] Failed to upload report for lead ${lead.id}:`, err);
      }
      return { businessName, websiteUrl, overallScore, overallGrade: getGrade(overallScore), sections, recommendations, estimatedCustomersLost, htmlContent, storageUrl };
    }

    // Fallback to LLM only when real fetch fails
    try {
      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a website audit analyst. Generate a realistic audit based on the business details provided. Respond with valid JSON only." },
          { role: "user", content: `Generate a website audit for:\nBusiness: ${businessName}\nWebsite: ${websiteUrl}\n\nRespond in JSON:\n{"sections":[{"name":"Performance & Speed","score":0,"issues":[],"description":""},{"name":"Mobile Friendliness","score":0,"issues":[],"description":""},{"name":"SEO & Discoverability","score":0,"issues":[],"description":""},{"name":"Security","score":0,"issues":[],"description":""},{"name":"Design & Accessibility","score":0,"issues":[],"description":""}],"recommendations":["rec1"],"estimatedCustomersLost":"10-20 per month"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "website_audit",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sections: { type: "array", items: { type: "object", properties: { name: { type: "string" }, score: { type: "integer" }, issues: { type: "array", items: { type: "string" } }, description: { type: "string" } }, required: ["name","score","issues","description"], additionalProperties: false } },
                recommendations: { type: "array", items: { type: "string" } },
                estimatedCustomersLost: { type: "string" },
              },
              required: ["sections","recommendations","estimatedCustomersLost"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse(aiResponse.choices?.[0]?.message?.content as string);
      const icons = ["⚡", "📱", "🔍", "🔒", "🎨"];
      for (let i = 0; i < parsed.sections.length; i++) {
        const s = parsed.sections[i];
        sections.push({ name: s.name, score: s.score, grade: getGrade(s.score), icon: icons[i] || "ℹ️", issues: s.issues, description: s.description });
      }
      const overallScore = Math.round(sections.reduce((sum, s) => sum + s.score, 0) / sections.length);
      const htmlContent = generateAuditHTML({ businessName, websiteUrl, overallScore, overallGrade: getGrade(overallScore), sections, recommendations: parsed.recommendations, estimatedCustomersLost: parsed.estimatedCustomersLost });
      let storageUrl: string | undefined;
      try {
        const key = `audits/lead-${lead.id}-${Date.now()}.html`;
        const result = await storagePut(key, Buffer.from(htmlContent), "text/html");
        storageUrl = result.url;
      } catch (err) {
        console.error(`[Audit] Failed to upload report for lead ${lead.id}:`, err);
      }
      return { businessName, websiteUrl, overallScore, overallGrade: getGrade(overallScore), sections, recommendations: parsed.recommendations, estimatedCustomersLost: parsed.estimatedCustomersLost, htmlContent, storageUrl };
    } catch (err) {
      console.error(`[Audit] LLM audit generation failed for lead ${lead.id}:`, err);
      // Fall through to generic fallback below
    }
  }

  // Fallback: generic audit for no-website or LLM failure
  const overallScore = hasWebsite ? 45 : 5;
  const overallGrade = getGrade(overallScore);
  const recommendations = hasWebsite
    ? ["Upgrade to HTTPS for security", "Optimize for mobile devices", "Add proper SEO meta tags", "Improve page load speed", "Add clear calls to action"]
    : ["Create a professional website", "Set up Google Business Profile", "Add online booking/contact forms", "Build a mobile-first design", "Implement local SEO strategy"];
  const estimatedCustomersLost = hasWebsite ? "10-25 customers per month" : "30-50 customers per month";

  const htmlContent = generateAuditHTML({
    businessName,
    websiteUrl,
    overallScore,
    overallGrade,
    sections,
    recommendations,
    estimatedCustomersLost,
  });

  let storageUrl: string | undefined;
  try {
    const key = `audits/lead-${lead.id}-${Date.now()}.html`;
    const result = await storagePut(key, Buffer.from(htmlContent), "text/html");
    storageUrl = result.url;
  } catch (err) {
    console.error(`[Audit] Failed to upload fallback report for lead ${lead.id}:`, err);
  }

  return {
    businessName,
    websiteUrl,
    overallScore,
    overallGrade,
    sections,
    recommendations,
    estimatedCustomersLost,
    htmlContent,
    storageUrl,
  };
}

/**
 * Generate the HTML for the audit report
 */
function generateAuditHTML(params: {
  businessName: string;
  websiteUrl: string | null;
  overallScore: number;
  overallGrade: string;
  sections: AuditSection[];
  recommendations: string[];
  estimatedCustomersLost: string;
}): string {
  const gradeColor = getGradeColor(params.overallGrade);

  const sectionHTML = params.sections.map(s => `
    <div style="background:#222240;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:18px;color:#eaeaf0;">${s.icon} ${s.name}</h3>
        <div style="background:${getGradeColor(s.grade)};color:#111122;font-weight:bold;font-size:14px;padding:4px 12px;border-radius:20px;">
          ${s.grade} (${s.score}/100)
        </div>
      </div>
      <p style="color:#9898a8;font-size:14px;line-height:1.6;margin:0 0 12px 0;">${s.description}</p>
      ${s.issues.length > 0 ? `
        <div style="background:#2a1a1a;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 8px 0;font-weight:600;color:#fca5a5;font-size:13px;">Issues Found:</p>
          ${s.issues.map(i => `<p style="margin:0 0 4px 0;color:#fca5a5;font-size:13px;">• ${i}</p>`).join("")}
        </div>
      ` : `
        <div style="background:#1a2a1a;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#86efac;font-size:13px;">✓ No issues found in this area</p>
        </div>
      `}
    </div>
  `).join("");

  const recsHTML = params.recommendations.map((r, i) => `
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
      <div style="background:#4a9eff;color:#111122;font-weight:bold;font-size:13px;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${i + 1}</div>
      <p style="margin:0;color:#c8c8d8;font-size:14px;line-height:1.6;">${r}</p>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Website Audit Report - ${params.businessName}</title>
</head>
<body style="margin:0;padding:0;background:#111122;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#1c1c30;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1c1c30 0%,#222240 100%);padding:40px 32px;text-align:center;border-bottom:1px solid #2d2d45;">
      <h1 style="color:#eaeaf0;margin:0 0 8px 0;font-size:28px;font-weight:700;">Website Audit Report</h1>
      <p style="color:#4a9eff;margin:0;font-size:16px;">${params.businessName}</p>
      ${params.websiteUrl ? `<p style="color:#7a7a90;margin:8px 0 0 0;font-size:13px;">${params.websiteUrl}</p>` : ""}
      <p style="color:#7a7a90;margin:8px 0 0 0;font-size:12px;">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <!-- Overall Score -->
    <div style="text-align:center;padding:32px;">
      <p style="color:#7a7a90;font-size:14px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Overall Score</p>
      <div style="display:inline-block;width:120px;height:120px;border-radius:50%;border:8px solid ${gradeColor};display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
          <span style="font-size:42px;font-weight:800;color:${gradeColor};">${params.overallGrade}</span>
        </div>
      </div>
      <p style="color:#eaeaf0;font-size:20px;font-weight:600;margin:16px 0 4px 0;">${params.overallScore}/100</p>
      <p style="color:#ef4444;font-size:14px;margin:0;">Estimated impact: <strong>${params.estimatedCustomersLost}</strong> lost</p>
    </div>

    <!-- Sections -->
    <div style="padding:0 32px 24px;">
      <h2 style="color:#eaeaf0;font-size:22px;margin:0 0 20px 0;padding-bottom:12px;border-bottom:2px solid #2d2d45;">Detailed Analysis</h2>
      ${sectionHTML}
    </div>

    <!-- Recommendations -->
    <div style="padding:0 32px 32px;">
      <h2 style="color:#eaeaf0;font-size:22px;margin:0 0 20px 0;padding-bottom:12px;border-bottom:2px solid #2d2d45;">Our Recommendations</h2>
      ${recsHTML}
    </div>

    <!-- CTA -->
    <div style="background:#151526;padding:32px;text-align:center;border-top:1px solid #2d2d45;">
      <h3 style="color:#eaeaf0;margin:0 0 12px 0;font-size:20px;">Ready to fix these issues?</h3>
      <p style="color:#9898a8;margin:0 0 20px 0;font-size:14px;">MiniMorph Studios specializes in building modern, high-performing websites for businesses like yours.</p>
      <a href="https://www.minimorphstudios.net/get-started" style="display:inline-block;background:#4a9eff;color:#111122;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;">Get Your Free Consultation</a>
      <p style="color:#7a7a90;margin:16px 0 0 0;font-size:12px;">No commitment required. We'll show you exactly how we can help.</p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;text-align:center;border-top:1px solid #2d2d45;">
      <p style="color:#7a7a90;font-size:12px;margin:0;">This report was generated by MiniMorph Studios</p>
      <p style="color:#7a7a90;font-size:11px;margin:4px 0 0 0;">Scores are based on automated analysis and industry benchmarks.</p>
    </div>
  </div>
</body>
</html>`;
}
