/**
 * Lead Generation Enrichment Service
 * 
 * Enriches scraped businesses with additional data:
 * - Google Place details (hours, reviews, photos)
 * - LinkedIn company info (if available)
 * - AI-generated dossier with pain points and approach recommendations
 */

import { makeRequest, type PlaceDetailsResult } from "../_core/map";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapedBusinesses, leads, type InsertLead } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { dedupOrNull } from "./leadDedup";
import { isExcludedBusiness } from "./leadGenMultiSource";

export interface EnrichmentResult {
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  openingHours?: string[];
  reviews?: Array<{ author: string; rating: number; text: string }>;
  industry?: string;
  employeeCount?: number;
  dossier?: string;
  painPoints?: string[];
  recommendedApproach?: string;
  opportunities?: string[];
}

/**
 * Enrich a scraped business with all available data
 */
export async function enrichBusiness(businessId: number): Promise<EnrichmentResult> {
  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) throw new Error(`Business ${businessId} not found`);

  await db.update(scrapedBusinesses)
    .set({ status: "enriching" })
    .where(eq(scrapedBusinesses.id, businessId));

  const enrichment: EnrichmentResult = {};

  // 1. Get detailed Google Place info
  try {
    const details = await makeRequest<PlaceDetailsResult>(
      "/maps/api/place/details/json",
      {
        place_id: biz.googlePlaceId,
        fields: "name,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,opening_hours,reviews,formatted_address",
      }
    );

    if (details.status === "OK" && details.result) {
      const d = details.result;
      enrichment.ownerPhone = d.formatted_phone_number || d.international_phone_number;
      enrichment.openingHours = d.opening_hours?.weekday_text;
      enrichment.reviews = d.reviews?.slice(0, 5).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
      }));
    }
  } catch (err) {
    console.error(`[Enrichment] Google details failed for ${biz.businessName}:`, err);
  }

  // 2. Generate AI dossier
  try {
    const dossier = await generateDossier(biz, enrichment);
    enrichment.dossier = dossier.dossier;
    enrichment.painPoints = dossier.painPoints;
    enrichment.recommendedApproach = dossier.recommendedApproach;
    enrichment.ownerName = dossier.estimatedOwnerName;
    enrichment.ownerEmail = dossier.estimatedEmail;
  } catch (err) {
    console.error(`[Enrichment] AI dossier failed for ${biz.businessName}:`, err);
  }

  // Save enrichment data
  await db.update(scrapedBusinesses).set({
    enrichmentData: enrichment,
    status: "enriched",
  }).where(eq(scrapedBusinesses.id, businessId));

  return enrichment;
}

/**
 * Generate an AI dossier for a business
 */
async function generateDossier(
  biz: typeof scrapedBusinesses.$inferSelect,
  enrichment: EnrichmentResult
): Promise<{
  dossier: string;
  painPoints: string[];
  recommendedApproach: string;
  estimatedOwnerName?: string;
  estimatedEmail?: string;
}> {
  const websiteIssues = (biz.websiteIssues as string[] | null) || [];
  const reviews = enrichment.reviews || [];
  const negativeReviews = reviews.filter(r => r.rating <= 3);

  const prompt = `You are a business intelligence analyst for a web design agency called MiniMorph Studios. 
Analyze this business and create a sales dossier.

BUSINESS INFO:
- Name: ${biz.businessName}
- Address: ${biz.address || "Unknown"}
- Phone: ${biz.phone || enrichment.ownerPhone || "Unknown"}
- Industry: ${enrichment.industry || (biz.businessTypes as string[] | null)?.join(", ") || "Unknown"}
- Website: ${biz.website || "NO WEBSITE"}
- Website Score: ${biz.websiteScore !== null ? `${biz.websiteScore}/100` : "Not scored"}
- Website Issues: ${websiteIssues.length > 0 ? websiteIssues.join(", ") : "None identified"}
- Google Rating: ${biz.rating || "Unknown"} (${biz.reviewCount || 0} reviews)
- Employee Count: ${enrichment.employeeCount || "Unknown"}
${negativeReviews.length > 0 ? `\nNEGATIVE REVIEWS:\n${negativeReviews.map(r => `- "${r.text.substring(0, 200)}"`).join("\n")}` : ""}

Respond in JSON with this exact structure:
{
  "dossier": "A 2-3 paragraph executive summary of this business, their likely pain points, and why they need a better web presence",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "recommendedApproach": "A specific, personalized outreach strategy for this business (what to say, what angle to take)",
  "estimatedOwnerName": "Best guess at owner/manager name from reviews or business name, or null",
  "estimatedEmail": "Best guess at email format like info@businessname.com, or null"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a business intelligence analyst. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "business_dossier",
        strict: true,
        schema: {
          type: "object",
          properties: {
            dossier: { type: "string" },
            painPoints: { type: "array", items: { type: "string" } },
            recommendedApproach: { type: "string" },
            estimatedOwnerName: { type: ["string", "null"] },
            estimatedEmail: { type: ["string", "null"] },
          },
          required: ["dossier", "painPoints", "recommendedApproach", "estimatedOwnerName", "estimatedEmail"],
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
 * Enrich all qualified but unenriched businesses
 */
export async function enrichQualifiedBusinesses(limit: number = 10): Promise<number> {
  const db = (await getDb())!;
  const qualified = await db.select()
    .from(scrapedBusinesses)
    .where(
      and(
        eq(scrapedBusinesses.qualified, true),
        eq(scrapedBusinesses.status, "qualified")
      )
    )
    .limit(limit);

  let enriched = 0;
  for (const biz of qualified) {
    try {
      await enrichBusiness(biz.id);
      enriched++;
    } catch (err) {
      console.error(`[Enrichment] Failed for ${biz.businessName}:`, err);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  return enriched;
}

/**
 * Convert an enriched business into a lead in the main leads table
 */
export async function convertToLead(businessId: number): Promise<number> {
  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) throw new Error(`Business ${businessId} not found`);

  // Skip franchises, chains, government, and other excluded business types
  const exclusion = isExcludedBusiness(biz.businessName, (biz.businessTypes as string[] | null) ?? []);
  if (exclusion.excluded) {
    await db.update(scrapedBusinesses).set({ status: "disqualified" }).where(eq(scrapedBusinesses.id, businessId));
    throw new Error(`Business excluded: ${exclusion.reason}`);
  }

  const enrichment = (biz.enrichmentData || {}) as EnrichmentResult;

  // Determine contact info
  const contactName = enrichment.ownerName || "Business Owner";
  const email = enrichment.ownerEmail || "";
  const phone = biz.phone || enrichment.ownerPhone || "";

  // Determine qualification score based on available data
  let qualScore = 50; // Base score
  if (!biz.hasWebsite) qualScore += 20; // No website = high opportunity
  if (biz.websiteScore !== null && biz.websiteScore !== undefined && biz.websiteScore < 30) qualScore += 15; // Very bad website
  else if (biz.websiteScore !== null && biz.websiteScore !== undefined && biz.websiteScore < 60) qualScore += 8; // Below average website
  if (Number(biz.rating) >= 4.0) qualScore += 10; // Good business, just needs web help
  if (biz.reviewCount && biz.reviewCount > 20) qualScore += 5; // Active business
  if (biz.reviewCount && biz.reviewCount > 100) qualScore += 5; // Very active
  qualScore = Math.min(100, qualScore);

  const leadData: InsertLead = {
    businessName: biz.businessName,
    contactName,
    email: email || "",
    emailVerified: !!email,
    phone,
    industry: enrichment.industry || (biz.businessTypes as string[] | null)?.[0] || "Other",
    website: biz.website,
    source: "ai_sourced",
    temperature: "cold",
    qualificationScore: qualScore,
    stage: "enriched",
    enrichmentData: {
      ...enrichment,
      googlePlaceId: biz.googlePlaceId,
      address: biz.address,
      googleRating: biz.rating,
      googleReviewCount: biz.reviewCount,
      websiteScore: biz.websiteScore,
      websiteIssues: biz.websiteIssues,
      scrapedBusinessId: biz.id,
    },
  };

  // Cross-source dedup: check for existing lead before inserting
  const dup = await dedupOrNull(leadData);
  if (dup) {
    // Mark the scraped business as converted to the existing lead
    await db.update(scrapedBusinesses).set({
      convertedToLeadId: dup.leadId,
      status: "converted",
    }).where(eq(scrapedBusinesses.id, businessId));
    return dup.leadId;
  }

  const [result] = await db.insert(leads).values(leadData).$returningId();

  // Mark the scraped business as converted
  await db.update(scrapedBusinesses).set({
    convertedToLeadId: result.id,
    status: "converted",
  }).where(eq(scrapedBusinesses.id, businessId));

  return result.id;
}

/**
 * Batch convert all enriched businesses to leads
 */
export async function batchConvertToLeads(limit: number = 20): Promise<number> {
  const db = (await getDb())!;
  const enriched = await db.select()
    .from(scrapedBusinesses)
    .where(
      and(
        eq(scrapedBusinesses.status, "enriched"),
        eq(scrapedBusinesses.qualified, true)
      )
    )
    .limit(limit);

  let converted = 0;
  for (const biz of enriched) {
    try {
      await convertToLead(biz.id);
      converted++;
    } catch (err) {
      console.error(`[Enrichment] Convert failed for ${biz.businessName}:`, err);
    }
  }

  return converted;
}
