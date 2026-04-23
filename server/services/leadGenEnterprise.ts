/**
 * Enterprise Lead Filter & Owner Pipeline
 * 
 * Identifies big-ticket companies that could benefit from full AI automation,
 * generates detailed analysis reports, and routes them directly to the owner.
 */

import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { enterpriseProspects, scrapedBusinesses, leads } from "../../drizzle/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import type { EnrichmentResult } from "./leadGenEnrichment";

// Criteria for enterprise leads
const ENTERPRISE_INDICATORS = {
  minEmployees: 20,
  minReviewCount: 50,
  highValueIndustries: [
    "real_estate_agency", "insurance_agency", "accounting",
    "hospital", "medical_center", "law_firm",
    "car_dealer", "moving_company", "storage",
    "school", "university",
    "hotel", "resort",
    "manufacturing", "logistics",
  ],
  keywords: [
    "automation", "efficiency", "scaling", "growth",
    "multiple locations", "franchise", "chain",
    "enterprise", "corporate",
  ],
};

/**
 * Analyze a scraped business to determine if it's an enterprise prospect
 */
export async function analyzeForEnterprise(businessId: number): Promise<boolean> {
  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) return false;

  const enrichment = (biz.enrichmentData || {}) as EnrichmentResult;
  const types = (biz.businessTypes as string[]) || [];

  // Quick filters
  const hasHighEmployeeCount = (enrichment.employeeCount || 0) >= ENTERPRISE_INDICATORS.minEmployees;
  const hasHighReviewCount = (biz.reviewCount || 0) >= ENTERPRISE_INDICATORS.minReviewCount;
  const isHighValueIndustry = types.some(t => ENTERPRISE_INDICATORS.highValueIndustries.includes(t));

  // Score enterprise potential
  let score = 0;
  if (hasHighEmployeeCount) score += 30;
  if (hasHighReviewCount) score += 20;
  if (isHighValueIndustry) score += 25;
  if (enrichment.linkedinUrl) score += 10;
  if (biz.website) score += 5; // Has existing tech = more likely to invest in more
  if ((enrichment.employeeCount || 0) >= 50) score += 15;

  // Only proceed if score is high enough
  if (score < 40) return false;

  // Use AI to do a deeper analysis
  try {
    const analysis = await generateEnterpriseAnalysis(biz, enrichment);

    if (!analysis.isEnterprise) return false;

    // Create enterprise prospect record
    await db.insert(enterpriseProspects).values({
      businessName: biz.businessName,
      contactName: enrichment.ownerName,
      email: enrichment.ownerEmail,
      phone: biz.phone || enrichment.ownerPhone,
      website: biz.website,
      industry: enrichment.industry || types[0],
      estimatedEmployees: enrichment.employeeCount,
      estimatedRevenue: analysis.estimatedRevenue,
      linkedinUrl: enrichment.linkedinUrl,
      googlePlaceId: biz.googlePlaceId,
      automationOpportunities: analysis.automationOpportunities,
      aiAnalysisReport: analysis.fullReport,
      estimatedSavings: analysis.estimatedSavings,
      status: "analyzed",
    });

    // Notify the owner via push + SMS
    await notifyOwner({
      title: `Enterprise Lead: ${biz.businessName}`,
      content: `New enterprise prospect identified!\n\n` +
        `Business: ${biz.businessName}\n` +
        `Industry: ${enrichment.industry || types[0] || "Unknown"}\n` +
        `Est. Employees: ${enrichment.employeeCount || "Unknown"}\n` +
        `Est. Revenue: ${analysis.estimatedRevenue || "Unknown"}\n\n` +
        `Automation Opportunities:\n${analysis.automationOpportunities.map((o: string) => `• ${o}`).join("\n")}\n\n` +
        `Est. Savings: ${analysis.estimatedSavings}\n\n` +
        `Full report available in the admin dashboard.`,
    });

    // Also SMS the owner directly
    const { ENV } = await import("../_core/env");
    if (ENV.ownerPhoneNumber) {
      try {
        const { sendSms } = await import("./sms");
        await sendSms({
          to: ENV.ownerPhoneNumber,
          body: `🏢 Enterprise Prospect!\n${biz.businessName}\nEst. Savings: ${analysis.estimatedSavings}\nOpportunities: ${analysis.automationOpportunities.slice(0, 2).join(", ")}\n\nCheck admin dashboard for full report.`,
        });
      } catch (smsErr) {
        console.error("[Enterprise] Failed to SMS owner:", smsErr);
      }
    }

    return true;
  } catch (err) {
    console.error(`[Enterprise] Analysis failed for ${biz.businessName}:`, err);
    return false;
  }
}

/**
 * Generate a detailed enterprise analysis report using AI
 */
async function generateEnterpriseAnalysis(
  biz: typeof scrapedBusinesses.$inferSelect,
  enrichment: EnrichmentResult
): Promise<{
  isEnterprise: boolean;
  automationOpportunities: string[];
  estimatedRevenue: string;
  estimatedSavings: string;
  fullReport: string;
}> {
  const types = (biz.businessTypes as string[]) || [];

  const prompt = `You are a business automation consultant analyzing a company for potential AI/automation opportunities.

COMPANY INFO:
- Name: ${biz.businessName}
- Industry: ${enrichment.industry || types.join(", ") || "Unknown"}
- Address: ${biz.address || "Unknown"}
- Website: ${biz.website || "None"}
- Employee Count: ${enrichment.employeeCount || "Unknown"}
- Google Rating: ${biz.rating || "Unknown"} (${biz.reviewCount || 0} reviews)
- LinkedIn: ${enrichment.linkedinUrl || "Not found"}
${enrichment.linkedinData ? `- LinkedIn Data: ${JSON.stringify(enrichment.linkedinData).substring(0, 500)}` : ""}
${enrichment.dossier ? `- Business Dossier: ${enrichment.dossier.substring(0, 500)}` : ""}

TASK: Determine if this company is a good candidate for a full AI automation engagement (building custom AI agents, automating workflows, creating MVPs). These are $10K-$100K+ projects.

Respond in JSON:
{
  "isEnterprise": true/false,
  "automationOpportunities": ["specific opportunity 1", "specific opportunity 2", ...],
  "estimatedRevenue": "estimated annual revenue range like '$500K-$1M'",
  "estimatedSavings": "estimated monthly savings from automation like '$5K-$10K/month'",
  "fullReport": "A detailed 3-5 paragraph report for the owner covering: company overview, current pain points, specific automation opportunities, recommended approach for initial meeting, and estimated project scope/value. Be specific and actionable."
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert business automation consultant. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "enterprise_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isEnterprise: { type: "boolean" },
            automationOpportunities: { type: "array", items: { type: "string" } },
            estimatedRevenue: { type: "string" },
            estimatedSavings: { type: "string" },
            fullReport: { type: "string" },
          },
          required: ["isEnterprise", "automationOpportunities", "estimatedRevenue", "estimatedSavings", "fullReport"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content as string | undefined;
  if (!content) throw new Error("Empty LLM response");

  return JSON.parse(content);
}

/**
 * Scan all enriched businesses for enterprise potential
 */
export async function scanForEnterpriseLeads(limit: number = 10): Promise<number> {
  const db = (await getDb())!;

  // Find enriched businesses with high review counts or known employee counts
  const candidates = await db.select()
    .from(scrapedBusinesses)
    .where(
      and(
        eq(scrapedBusinesses.status, "enriched"),
        eq(scrapedBusinesses.qualified, true)
      )
    )
    .limit(limit);

  let found = 0;
  for (const biz of candidates) {
    const isEnterprise = await analyzeForEnterprise(biz.id);
    if (isEnterprise) found++;
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }

  return found;
}

/**
 * Get all enterprise prospects for the admin dashboard
 */
export async function listEnterpriseProspects(statusFilter?: string) {
  const db = (await getDb())!;
  if (statusFilter) {
    return db.select().from(enterpriseProspects)
      .where(eq(enterpriseProspects.status, statusFilter as any))
      .orderBy(sql`${enterpriseProspects.createdAt} DESC`);
  }
  return db.select().from(enterpriseProspects)
    .orderBy(sql`${enterpriseProspects.createdAt} DESC`);
}

/**
 * Update enterprise prospect status
 */
export async function updateEnterpriseProspect(id: number, data: {
  status?: string;
  ownerNotes?: string;
  onboardingResponses?: Record<string, unknown>;
}) {
  const db = (await getDb())!;
  await db.update(enterpriseProspects).set(data as any).where(eq(enterpriseProspects.id, id));
}
