/**
 * Multi-Source Scraping & Competitor Intelligence
 * 
 * Extends the lead gen engine beyond Google Maps:
 * 1. Yelp business discovery (via Data API)
 * 2. Facebook business pages (via Data API)
 * 3. BBB listings (via Data API)
 * 4. Competitor intelligence — find competitors with great websites
 * 5. De-duplication across sources
 */

import { makeRequest } from "../_core/map";
import { callDataApi } from "../_core/dataApi";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapedBusinesses, leads } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/* ═══════════════════════════════════════════════════════
   MULTI-SOURCE SCRAPING
   ═══════════════════════════════════════════════════════ */

export interface MultiSourceBusiness {
  businessName: string;
  address?: string;
  phone?: string;
  website?: string;
  source: "google_maps" | "yelp" | "facebook" | "bbb" | "directory";
  sourceId?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  hasWebsite: boolean;
}

/**
 * Search Yelp for businesses without websites in a given area
 */
export async function scrapeYelp(params: {
  location: string;
  categories?: string[];
  limit?: number;
}): Promise<MultiSourceBusiness[]> {
  const results: MultiSourceBusiness[] = [];
  const categories = params.categories || ["restaurants", "beauty", "contractors", "automotive", "health"];

  for (const category of categories) {
    try {
      const yelpResult = await callDataApi("Yelp/search_businesses", {
        query: {
          term: category,
          location: params.location,
          limit: params.limit || 20,
        },
      }) as any;

      if (yelpResult?.businesses) {
        for (const biz of yelpResult.businesses) {
          const hasWebsite = !!biz.url && !biz.url.includes("yelp.com");
          results.push({
            businessName: biz.name,
            address: biz.location?.display_address?.join(", "),
            phone: biz.phone,
            website: hasWebsite ? biz.url : undefined,
            source: "yelp",
            sourceId: biz.id,
            rating: biz.rating,
            reviewCount: biz.review_count,
            category,
            hasWebsite,
          });
        }
      }
    } catch (err) {
      console.error(`[MultiSource] Yelp search failed for ${category} in ${params.location}:`, err);
    }
  }

  return results;
}

/**
 * Search for businesses via Google Maps with expanded categories
 */
export async function scrapeGoogleExpanded(params: {
  location: string;
  lat?: number;
  lng?: number;
  radius?: number;
}): Promise<MultiSourceBusiness[]> {
  const results: MultiSourceBusiness[] = [];

  // Low-hanging fruit categories — businesses most likely to need websites
  const queries = [
    "plumber near me",
    "electrician near me",
    "hair salon",
    "nail salon",
    "auto repair shop",
    "landscaping service",
    "cleaning service",
    "dentist office",
    "restaurant",
    "bakery",
    "pet grooming",
    "yoga studio",
    "tattoo shop",
    "florist",
    "dry cleaner",
  ];

  for (const query of queries.slice(0, 5)) { // Limit to 5 per run to save API calls
    try {
      const searchResult = await makeRequest<any>(
        "/maps/api/place/textsearch/json",
        {
          query: `${query} in ${params.location}`,
          ...(params.lat && params.lng ? { location: `${params.lat},${params.lng}` } : {}),
          radius: params.radius || 25000,
        }
      );

      if (searchResult.status === "OK" && searchResult.results) {
        for (const place of searchResult.results) {
          results.push({
            businessName: place.name,
            address: place.formatted_address,
            source: "google_maps",
            sourceId: place.place_id,
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            category: query.replace(" near me", ""),
            hasWebsite: false, // Will be determined during scoring
          });
        }
      }
    } catch (err) {
      console.error(`[MultiSource] Google expanded search failed for "${query}":`, err);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

/**
 * De-duplicate businesses across sources
 */
export function deduplicateBusinesses(businesses: MultiSourceBusiness[]): MultiSourceBusiness[] {
  const seen = new Map<string, MultiSourceBusiness>();

  for (const biz of businesses) {
    // Create a normalized key from name + address
    const nameKey = biz.businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const addressKey = (biz.address || "").toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 30);
    const key = `${nameKey}_${addressKey}`;

    if (!seen.has(key)) {
      seen.set(key, biz);
    } else {
      // Merge data from duplicate — keep the one with more info
      const existing = seen.get(key)!;
      if (!existing.phone && biz.phone) existing.phone = biz.phone;
      if (!existing.website && biz.website) existing.website = biz.website;
      if (!existing.rating && biz.rating) existing.rating = biz.rating;
    }
  }

  return Array.from(seen.values());
}

/**
 * Run a multi-source scrape for an area and save results
 */
export async function runMultiSourceScrape(params: {
  location: string;
  lat?: number;
  lng?: number;
  radius?: number;
}): Promise<{ total: number; new: number; duplicates: number }> {
  const db = (await getDb())!;

  // Collect from all sources
  const allBusinesses: MultiSourceBusiness[] = [];

  // Google Maps (expanded categories)
  const googleResults = await scrapeGoogleExpanded(params);
  allBusinesses.push(...googleResults);

  // Yelp
  const yelpResults = await scrapeYelp({ location: params.location });
  allBusinesses.push(...yelpResults);

  // De-duplicate
  const unique = deduplicateBusinesses(allBusinesses);
  const duplicates = allBusinesses.length - unique.length;

  // Save new businesses (skip if already in DB)
  let newCount = 0;
  for (const biz of unique) {
    // Check if already exists by name + address
    const existing = await db.select({ id: scrapedBusinesses.id })
      .from(scrapedBusinesses)
      .where(
        and(
          eq(scrapedBusinesses.businessName, biz.businessName),
          eq(scrapedBusinesses.address, biz.address || "")
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(scrapedBusinesses).values({
        scrapeJobId: 0, // Multi-source doesn't have a job ID
        googlePlaceId: biz.sourceId || "",
        businessName: biz.businessName,
        address: biz.address,
        phone: biz.phone,
        website: biz.website,
        rating: biz.rating?.toString(),
        reviewCount: biz.reviewCount,
        businessTypes: [biz.category || "other"],
        hasWebsite: biz.hasWebsite,
        status: "scraped",
      });
      newCount++;
    }
  }

  return { total: allBusinesses.length, new: newCount, duplicates };
}

/* ═══════════════════════════════════════════════════════
   COMPETITOR INTELLIGENCE
   ═══════════════════════════════════════════════════════ */

export interface CompetitorAnalysis {
  competitorName: string;
  competitorWebsite: string;
  competitorScore: number;
  advantages: string[];
  targetBusinessName: string;
  comparisonSummary: string;
}

/**
 * Find competitors for a business and analyze their web presence
 */
export async function findCompetitors(businessId: number): Promise<CompetitorAnalysis[]> {
  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) return [];

  const category = (biz.businessTypes as string[] | null)?.[0] || "business";

  // Search for similar businesses in the same area
  try {
    const searchResult = await makeRequest<any>(
      "/maps/api/place/textsearch/json",
      {
        query: `best ${category} near ${biz.address || ""}`,
        radius: 10000,
      }
    );

    if (searchResult.status !== "OK" || !searchResult.results) return [];

    const competitors: CompetitorAnalysis[] = [];

    // Find up to 3 competitors with good websites
    for (const place of searchResult.results.slice(0, 10)) {
      if (place.name === biz.businessName) continue; // Skip self
      if (!place.rating || place.rating < 4.0) continue; // Only good competitors

      // Check if they have a website
      try {
        const details = await makeRequest<any>(
          "/maps/api/place/details/json",
          {
            place_id: place.place_id,
            fields: "name,website,rating,user_ratings_total",
          }
        );

        if (details.result?.website) {
          competitors.push({
            competitorName: place.name,
            competitorWebsite: details.result.website,
            competitorScore: Math.round((place.rating / 5) * 100),
            advantages: [
              "Has a professional website",
              `${place.rating} star rating on Google`,
              `${place.user_ratings_total || 0} customer reviews`,
            ],
            targetBusinessName: biz.businessName,
            comparisonSummary: "",
          });

          if (competitors.length >= 3) break;
        }
      } catch {
        // Skip this competitor
      }

      await new Promise(r => setTimeout(r, 300));
    }

    // Generate AI comparison summary
    if (competitors.length > 0) {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a competitive intelligence analyst. Respond with valid JSON." },
            {
              role: "user",
              content: `Compare ${biz.businessName} (${biz.hasWebsite ? "has website, score: " + biz.websiteScore : "NO website"}) with these competitors:
${competitors.map(c => `- ${c.competitorName}: ${c.competitorWebsite} (${c.competitorScore}/100)`).join("\n")}

For each competitor, write a 1-sentence comparison showing what the target business is missing.
Respond as JSON: { "comparisons": ["sentence 1", "sentence 2", ...] }`
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "competitor_comparisons",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  comparisons: { type: "array", items: { type: "string" } },
                },
                required: ["comparisons"],
                additionalProperties: false,
              },
            },
          },
        });

        const parsed = JSON.parse(response.choices?.[0]?.message?.content as string);
        competitors.forEach((c, i) => {
          c.comparisonSummary = parsed.comparisons[i] || "";
        });
      } catch {
        // AI comparison failed, competitors still useful without it
      }
    }

    return competitors;
  } catch (err) {
    console.error(`[Competitor] Search failed for ${biz.businessName}:`, err);
    return [];
  }
}

/**
 * Enrich a business with competitor data and save to enrichment
 */
export async function enrichWithCompetitors(businessId: number): Promise<CompetitorAnalysis[]> {
  const competitors = await findCompetitors(businessId);
  if (competitors.length === 0) return [];

  const db = (await getDb())!;
  const [biz] = await db.select().from(scrapedBusinesses).where(eq(scrapedBusinesses.id, businessId));
  if (!biz) return [];

  const enrichment = (biz.enrichmentData || {}) as any;
  enrichment.competitors = competitors;

  await db.update(scrapedBusinesses).set({
    enrichmentData: enrichment,
  }).where(eq(scrapedBusinesses.id, businessId));

  return competitors;
}
