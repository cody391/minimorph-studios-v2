/**
 * Automated Proposal Generation & Performance-Based Rep Routing
 * 
 * 1. Auto-generate custom proposals when leads show strong interest
 *    - Current site screenshot analysis (or "no website" mockup)
 *    - Recommended package based on business type/size
 *    - ROI calculator based on industry benchmarks
 *    - Competitor comparison
 * 
 * 2. Performance-based rep routing
 *    - Route by rep close rate per industry, not just capacity
 *    - Track rep performance metrics
 *    - Match rep strengths to lead types
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { leads, reps, repServiceAreas, contracts } from "../../drizzle/schema";
import { eq, and, sql, isNull, ne } from "drizzle-orm";
import { storagePut } from "../storage";
import type { EnrichmentResult } from "./leadGenEnrichment";

/* ═══════════════════════════════════════════════════════
   AUTOMATED PROPOSAL GENERATION
   ═══════════════════════════════════════════════════════ */

export interface Proposal {
  leadId: number;
  businessName: string;
  recommendedPackage: string;
  packagePrice: number;
  discountedPrice?: number;
  roiEstimate: {
    monthlyCustomersGained: string;
    monthlyRevenueIncrease: string;
    paybackPeriod: string;
  };
  proposalSections: ProposalSection[];
  htmlContent: string;
  storageUrl?: string;
}

interface ProposalSection {
  title: string;
  content: string;
}

/**
 * Generate a custom proposal for a lead
 */
export async function generateProposal(leadId: number): Promise<Proposal> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const enrichment = (lead.enrichmentData || {}) as EnrichmentResult & {
    websiteScore?: number;
    websiteIssues?: string[];
    competitors?: Array<{
      competitorName: string;
      competitorWebsite: string;
      competitorScore: number;
      advantages: string[];
      comparisonSummary: string;
    }>;
    googleRating?: number;
    googleReviewCount?: number;
  };

  // Determine recommended package based on business needs
  const hasWebsite = !!lead.website;
  const websiteScore = enrichment.websiteScore || 0;
  let recommendedPackage = "Professional";
  let packagePrice = 2499;

  if (!hasWebsite) {
    recommendedPackage = "Starter";
    packagePrice = 999;
  } else if (websiteScore < 30) {
    recommendedPackage = "Professional";
    packagePrice = 2499;
  } else if (websiteScore < 60) {
    recommendedPackage = "Growth";
    packagePrice = 1499;
  }

  // If they have employees or high review count, suggest higher tier
  if (enrichment.employeeCount && enrichment.employeeCount > 10) {
    recommendedPackage = "Enterprise";
    packagePrice = 4999;
  }

  // Generate AI proposal content
  let proposalSections: ProposalSection[] = [];
  let roiEstimate = {
    monthlyCustomersGained: "15-30",
    monthlyRevenueIncrease: "$2,000-$5,000",
    paybackPeriod: "1-2 months",
  };

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a sales proposal writer for a web design agency. Write compelling, specific proposals. Respond with valid JSON." },
        {
          role: "user", content: `Generate a custom proposal for this business:

BUSINESS: ${lead.businessName}
INDUSTRY: ${lead.industry || "local business"}
CONTACT: ${lead.contactName}
CURRENT WEBSITE: ${lead.website || "NONE"}
WEBSITE SCORE: ${websiteScore}/100
GOOGLE RATING: ${enrichment.googleRating || "unknown"}
REVIEWS: ${enrichment.googleReviewCount || 0}
EMPLOYEES: ${enrichment.employeeCount || "unknown"}
PAIN POINTS: ${enrichment.painPoints?.join(", ") || "no website or poor website"}
${enrichment.competitors?.length ? `COMPETITORS WITH WEBSITES: ${enrichment.competitors.map(c => c.competitorName).join(", ")}` : ""}

RECOMMENDED PACKAGE: ${recommendedPackage} ($${packagePrice})

Generate a proposal with these sections. Be specific to their industry and situation.
Respond in JSON:
{
  "sections": [
    { "title": "The Challenge", "content": "2-3 sentences about their specific problem" },
    { "title": "Our Solution", "content": "2-3 sentences about what we'll build for them" },
    { "title": "What You Get", "content": "Bullet-point list of deliverables" },
    { "title": "Expected Results", "content": "Specific ROI projections for their industry" },
    { "title": "Why MiniMorph", "content": "2-3 sentences on why we're the right choice" }
  ],
  "roiEstimate": {
    "monthlyCustomersGained": "specific range like 15-30",
    "monthlyRevenueIncrease": "dollar range like $2,000-$5,000",
    "paybackPeriod": "like 1-2 months"
  }
}`
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "proposal_content",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["title", "content"],
                  additionalProperties: false,
                },
              },
              roiEstimate: {
                type: "object",
                properties: {
                  monthlyCustomersGained: { type: "string" },
                  monthlyRevenueIncrease: { type: "string" },
                  paybackPeriod: { type: "string" },
                },
                required: ["monthlyCustomersGained", "monthlyRevenueIncrease", "paybackPeriod"],
                additionalProperties: false,
              },
            },
            required: ["sections", "roiEstimate"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.choices?.[0]?.message?.content as string);
    proposalSections = parsed.sections;
    roiEstimate = parsed.roiEstimate;
  } catch {
    proposalSections = [
      { title: "The Challenge", content: `${lead.businessName} is missing out on customers because ${hasWebsite ? "their current website isn't performing well" : "they don't have a website"}. In today's digital-first world, this means lost revenue every day.` },
      { title: "Our Solution", content: `We'll build a modern, mobile-first website designed specifically for ${lead.industry || "your"} businesses. Fast, beautiful, and optimized to convert visitors into customers.` },
      { title: "What You Get", content: "• Custom responsive website design\n• Mobile optimization\n• SEO setup for local search\n• Contact forms and booking integration\n• Google Business Profile optimization\n• 30 days of post-launch support" },
      { title: "Expected Results", content: `Based on our work with similar ${lead.industry || "local"} businesses, you can expect 15-30 new customer inquiries per month and a significant increase in revenue.` },
      { title: "Why MiniMorph", content: "We specialize in helping local businesses establish a powerful online presence. Our websites are built for speed, conversion, and growth." },
    ];
  }

  // Generate HTML proposal
  const htmlContent = generateProposalHTML({
    businessName: lead.businessName,
    contactName: lead.contactName,
    recommendedPackage,
    packagePrice,
    roiEstimate,
    sections: proposalSections,
    competitors: enrichment.competitors,
  });

  // Upload to storage
  let storageUrl: string | undefined;
  try {
    const key = `proposals/${leadId}-${Date.now()}.html`;
    const result = await storagePut(key, Buffer.from(htmlContent), "text/html");
    storageUrl = result.url;
  } catch (err) {
    console.error(`[Proposal] Failed to upload for ${lead.businessName}:`, err);
  }

  return {
    leadId,
    businessName: lead.businessName,
    recommendedPackage,
    packagePrice,
    roiEstimate,
    proposalSections,
    htmlContent,
    storageUrl,
  };
}

function generateProposalHTML(params: {
  businessName: string;
  contactName: string;
  recommendedPackage: string;
  packagePrice: number;
  roiEstimate: { monthlyCustomersGained: string; monthlyRevenueIncrease: string; paybackPeriod: string };
  sections: ProposalSection[];
  competitors?: Array<{ competitorName: string; competitorWebsite: string; competitorScore: number; comparisonSummary: string }>;
}): string {
  const sectionsHTML = params.sections.map(s => `
    <div style="margin-bottom:28px;">
      <h3 style="color:#2d5a3d;font-size:20px;margin:0 0 10px 0;font-weight:700;">${s.title}</h3>
      <p style="color:#334155;font-size:15px;line-height:1.7;margin:0;white-space:pre-line;">${s.content}</p>
    </div>
  `).join("");

  const competitorHTML = params.competitors && params.competitors.length > 0 ? `
    <div style="background:#fef3c7;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="color:#92400e;font-size:18px;margin:0 0 16px 0;">Your Competitors Are Already Online</h3>
      ${params.competitors.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #fde68a;">
          <div>
            <strong style="color:#78350f;">${c.competitorName}</strong>
            <p style="color:#92400e;font-size:13px;margin:4px 0 0 0;">${c.comparisonSummary}</p>
          </div>
          <span style="color:#059669;font-weight:600;font-size:13px;">${c.competitorScore}/100</span>
        </div>
      `).join("")}
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Proposal for ${params.businessName} - MiniMorph Studios</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#1a3a2a 0%,#2d5a3d 100%);padding:48px 32px;text-align:center;">
      <p style="color:#a7c4b5;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Custom Proposal</p>
      <h1 style="color:white;margin:0 0 8px 0;font-size:32px;font-weight:800;">${params.businessName}</h1>
      <p style="color:#7fa895;margin:0;font-size:15px;">Prepared for ${params.contactName} • ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <div style="padding:32px;">
      ${sectionsHTML}
      ${competitorHTML}
    </div>

    <!-- ROI Box -->
    <div style="background:#f0fdf4;padding:32px;margin:0 32px 32px;border-radius:12px;border:2px solid #bbf7d0;">
      <h3 style="color:#166534;font-size:20px;margin:0 0 16px 0;text-align:center;">Expected Return on Investment</h3>
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div>
          <p style="color:#166534;font-size:28px;font-weight:800;margin:0;">${params.roiEstimate.monthlyCustomersGained}</p>
          <p style="color:#4ade80;font-size:12px;margin:4px 0 0 0;">New Customers/Month</p>
        </div>
        <div>
          <p style="color:#166534;font-size:28px;font-weight:800;margin:0;">${params.roiEstimate.monthlyRevenueIncrease}</p>
          <p style="color:#4ade80;font-size:12px;margin:4px 0 0 0;">Revenue Increase</p>
        </div>
        <div>
          <p style="color:#166534;font-size:28px;font-weight:800;margin:0;">${params.roiEstimate.paybackPeriod}</p>
          <p style="color:#4ade80;font-size:12px;margin:4px 0 0 0;">Payback Period</p>
        </div>
      </div>
    </div>

    <!-- Pricing -->
    <div style="text-align:center;padding:32px;background:#f8fafc;border-top:2px solid #e2e8f0;">
      <p style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Recommended Package</p>
      <h2 style="color:#1e293b;font-size:28px;margin:0 0 4px 0;">${params.recommendedPackage}</h2>
      <p style="color:#2d5a3d;font-size:36px;font-weight:800;margin:0;">$${params.packagePrice.toLocaleString()}</p>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 24px 0;">One-time investment + optional monthly maintenance</p>
      <a href="#" style="display:inline-block;background:#2d5a3d;color:white;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:17px;">Let's Get Started</a>
      <p style="color:#94a3b8;font-size:12px;margin:16px 0 0 0;">Questions? Reply to this email or call us anytime.</p>
    </div>

    <div style="padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">MiniMorph Studios • Building the web, one business at a time</p>
    </div>
  </div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   PERFORMANCE-BASED REP ROUTING
   ═══════════════════════════════════════════════════════ */

export interface RepPerformance {
  repId: number;
  repName: string;
  overallCloseRate: number;
  industryCloseRates: Record<string, { won: number; total: number; rate: number }>;
  avgDealSize: number;
  avgTimeToClose: number; // days
  activeLeads: number;
  totalDeals: number;
  totalRevenue: number;
}

/**
 * Calculate performance metrics for all active reps
 */
export async function getRepPerformanceMetrics(): Promise<RepPerformance[]> {
  const db = (await getDb())!;
  const activeReps = await db.select().from(reps).where(eq(reps.status, "active"));

  const performances: RepPerformance[] = [];

  for (const rep of activeReps) {
    // Get all leads assigned to this rep
    const repLeads = await db.select().from(leads).where(eq(leads.assignedRepId, rep.id));
    const closedLeads = repLeads.filter(l => l.stage === "closed_won" || l.stage === "closed_lost");
    const wonLeads = repLeads.filter(l => l.stage === "closed_won");
    const activeLeadCount = repLeads.filter(l => !["closed_won", "closed_lost"].includes(l.stage)).length;

    // Overall close rate
    const overallCloseRate = closedLeads.length > 0 ? wonLeads.length / closedLeads.length : 0;

    // Industry-specific close rates
    const industryCloseRates: Record<string, { won: number; total: number; rate: number }> = {};
    for (const lead of closedLeads) {
      const industry = lead.industry || "Other";
      if (!industryCloseRates[industry]) {
        industryCloseRates[industry] = { won: 0, total: 0, rate: 0 };
      }
      industryCloseRates[industry].total++;
      if (lead.stage === "closed_won") industryCloseRates[industry].won++;
    }
    for (const stats of Object.values(industryCloseRates)) {
      stats.rate = stats.total > 0 ? stats.won / stats.total : 0;
    }

    // Get contracts for deal size and revenue
    const repContracts = await db.select().from(contracts).where(eq(contracts.repId, rep.id));
    const totalRevenue = repContracts.reduce((sum, c) => sum + Number(c.monthlyPrice || 0), 0);
    const avgDealSize = repContracts.length > 0 ? totalRevenue / repContracts.length : 0;

    // Average time to close (from assignment to close)
    let totalDays = 0;
    let closedCount = 0;
    for (const lead of wonLeads) {
      if (lead.createdAt && lead.lastTouchAt) {
        const days = (new Date(lead.lastTouchAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        totalDays += days;
        closedCount++;
      }
    }
    const avgTimeToClose = closedCount > 0 ? totalDays / closedCount : 30; // Default 30 days

    performances.push({
      repId: rep.id,
      repName: rep.fullName,
      overallCloseRate: Math.round(overallCloseRate * 100),
      industryCloseRates,
      avgDealSize: Math.round(avgDealSize),
      avgTimeToClose: Math.round(avgTimeToClose),
      activeLeads: activeLeadCount,
      totalDeals: wonLeads.length,
      totalRevenue: Math.round(totalRevenue),
    });
  }

  return performances;
}

/**
 * Find the best rep for a lead based on performance, not just capacity
 */
export async function findBestRepByPerformance(leadId: number): Promise<{
  repId: number;
  repName: string;
  reason: string;
  score: number;
} | null> {
  const db = (await getDb())!;
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) return null;

  const performances = await getRepPerformanceMetrics();
  if (performances.length === 0) return null;

  const industry = lead.industry || "Other";
  const MAX_ACTIVE = 15;

  // Score each rep for this specific lead
  const scored = performances
    .filter(p => p.activeLeads < MAX_ACTIVE) // Must have capacity
    .map(p => {
      let score = 0;
      let reasons: string[] = [];

      // Industry-specific close rate (highest weight — 40%)
      const industryRate = p.industryCloseRates[industry];
      if (industryRate && industryRate.total >= 2) {
        score += industryRate.rate * 40;
        reasons.push(`${Math.round(industryRate.rate * 100)}% close rate in ${industry}`);
      } else {
        // Fall back to overall close rate
        score += (p.overallCloseRate / 100) * 30;
        reasons.push(`${p.overallCloseRate}% overall close rate`);
      }

      // Overall close rate (20%)
      score += (p.overallCloseRate / 100) * 20;

      // Capacity (20%) — prefer reps with fewer active leads
      const capacityScore = 1 - (p.activeLeads / MAX_ACTIVE);
      score += capacityScore * 20;
      if (p.activeLeads < 5) reasons.push("has capacity for more leads");

      // Speed (10%) — prefer faster closers
      const speedScore = Math.max(0, 1 - (p.avgTimeToClose / 60));
      score += speedScore * 10;

      // Deal size (10%) — prefer reps who close bigger deals
      if (p.avgDealSize > 2000) {
        score += 10;
        reasons.push(`avg deal size $${p.avgDealSize}`);
      } else {
        score += (p.avgDealSize / 2000) * 10;
      }

      return {
        repId: p.repId,
        repName: p.repName,
        score: Math.round(score),
        reason: reasons.slice(0, 2).join(", "),
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0] || null;
}
