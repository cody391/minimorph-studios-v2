/**
 * Multi-Source Scraping & Competitor Intelligence — Production Grade
 * 
 * Extends the lead gen engine beyond Google Maps:
 * 1. Google Maps expanded (15+ categories, paginated)
 * 2. Yelp business discovery (via Data API)
 * 3. Facebook business pages (via Data API)
 * 4. BBB listings (via Data API)
 * 5. Industry-specific directories (HomeAdvisor, OpenTable, etc.)
 * 6. Google Business Profile enrichment (hours, photos, services)
 * 7. Batch processing with rate limiting and retry logic
 * 8. Cross-source de-duplication with fuzzy matching
 * 9. Source quality tracking (which source produces best leads)
 * 10. Competitor intelligence — find competitors with great websites
 */

import { makeRequest } from "../_core/map";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapedBusinesses, leads } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { ENV } from "../_core/env";

/* ═══════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════ */

export type ScrapingSource = "google_maps" | "yelp" | "directory";

export interface MultiSourceBusiness {
  businessName: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  source: ScrapingSource;
  sourceId?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  hasWebsite: boolean;
  // Enhanced fields
  hours?: string;
  priceLevel?: number; // 1-4
  photos?: string[];
  socialProfiles?: { facebook?: string; instagram?: string; twitter?: string };
  yearEstablished?: number;
  employeeCount?: string;
  description?: string;
}

/* ═══════════════════════════════════════════════════════
   BUSINESS EXCLUSION FILTER
   ═══════════════════════════════════════════════════════ */

const EXCLUDED_NAME_PATTERNS = [
  /\bMcDonald'?s\b/i, /\bSubway\b/i, /\bStarbucks\b/i, /\bWalmart\b/i, /\bTarget\b/i,
  /\bCVS\b/i, /\bWalgreens\b/i, /\bDollar\s*(General|Tree)\b/i, /\bHome\s*Depot\b/i,
  /\bLowe'?s\b/i, /\bCostco\b/i, /\bWendy'?s\b/i, /\bBurger\s*King\b/i,
  /\bDomino'?s\b/i, /\bPizza\s*Hut\b/i, /\bTaco\s*Bell\b/i, /\bKFC\b/i,
  /\bChick-?fil-?A\b/i, /\bChipotle\b/i, /\bDunkin'?\b/i, /\bDairy\s*Queen\b/i,
  /\bPanera\b/i, /\bOlive\s*Garden\b/i, /\bApplebee'?s\b/i, /\bDenny'?s\b/i,
  /\bSheraton\b/i, /\bMarriott\b/i, /\bHilton\b/i, /\bHyatt\b/i, /\bHoliday\s*Inn\b/i,
  /\bBest\s*Western\b/i, /\bMotel\s*6\b/i, /\bSupercuts\b/i, /\bGreat\s*Clips\b/i,
  /\bSports\s*Clips\b/i, /\bJiffy\s*Lube\b/i, /\bMidas\b/i, /\bMileOne\b/i,
  /\bFire\s*Station\b/i, /\bPolice\s*Department\b/i, /\bCity\s*Hall\b/i,
  /\bCounty\s*(Office|Courthouse|Building)\b/i, /\bUS\s*Post\s*Office\b/i,
  /\bDMV\b/i, /\bPublic\s*Library\b/i, /\bChurch\b/i, /\bSynagogue\b/i,
  /\bMosque\b/i, /\bTemple\b/i, /\bCathedral\b/i, /\bHospital\b/i,
  /\bMedical\s*Center\b/i, /\bHealth\s*System\b/i, /\bUniversity\b/i,
  /\bCollege\b/i, /\bElementary\s*School\b/i, /\bMiddle\s*School\b/i,
  /\bHigh\s*School\b/i, /\bPublic\s*School\b/i,
];

const EXCLUDED_TYPES = [
  "government", "political", "hospital", "university", "school", "church",
  "embassy", "post_office", "fire_station", "police", "airport", "transit_station",
];

export function isExcludedBusiness(name: string, types?: string[]): { excluded: boolean; reason?: string } {
  for (const pattern of EXCLUDED_NAME_PATTERNS) {
    if (pattern.test(name)) return { excluded: true, reason: `franchise_or_chain: ${name}` };
  }
  if (types) {
    for (const t of types) {
      if (EXCLUDED_TYPES.includes(t.toLowerCase())) return { excluded: true, reason: `excluded_type: ${t}` };
    }
  }
  return { excluded: false };
}

// Low-hanging fruit categories — high-value industries first
const SCRAPE_CATEGORIES = {
  highPriority: [
    "auto repair shop", "hair salon", "plumber", "electrician",
    "HVAC repair", "roofing contractor", "landscaping service",
    "nail salon", "cleaning service", "pest control",
  ],
  mediumPriority: [
    "handyman service", "painting contractor", "moving company",
    "barber shop", "spa", "auto detailing", "tire shop",
    "bakery", "catering service", "food truck",
  ],
  lowPriority: [
    "pet grooming", "dog walker", "yoga studio", "gym",
    "martial arts school", "tattoo shop", "florist", "dry cleaner",
    "dentist", "chiropractor", "physical therapy",
    "accountant", "insurance agent", "real estate agent",
  ],
};

export const ALL_CATEGORIES = [
  ...SCRAPE_CATEGORIES.highPriority,
  ...SCRAPE_CATEGORIES.mediumPriority,
  ...SCRAPE_CATEGORIES.lowPriority,
];

// Rate limiting configuration
const RATE_LIMITS: Record<string, { requestsPerMinute: number; delayMs: number }> = {
  google_maps: { requestsPerMinute: 30, delayMs: 2000 },
  yelp: { requestsPerMinute: 20, delayMs: 3000 },
  facebook: { requestsPerMinute: 15, delayMs: 4000 },
  bbb: { requestsPerMinute: 10, delayMs: 6000 },
  directory: { requestsPerMinute: 10, delayMs: 6000 },
};

// Source quality tracking (in-memory, updated by scoring feedback)
const sourceQuality: Record<string, { totalLeads: number; convertedLeads: number; avgScore: number }> = {};

/* ═══════════════════════════════════════════════════════
   RATE LIMITING & RETRY
   ═══════════════════════════════════════════════════════ */

async function rateLimitedDelay(source: string): Promise<void> {
  const config = RATE_LIMITS[source] || { delayMs: 2000 };
  await new Promise(r => setTimeout(r, config.delayMs));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000,
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`[MultiSource] Attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, backoffMs * attempt));
      }
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   GOOGLE MAPS — EXPANDED + PAGINATED
   ═══════════════════════════════════════════════════════ */

export async function scrapeGoogleExpanded(params: {
  location: string;
  lat?: number;
  lng?: number;
  radius?: number;
  maxCategories?: number;
  priorityLevel?: "high" | "medium" | "low" | "all";
}): Promise<MultiSourceBusiness[]> {
  const results: MultiSourceBusiness[] = [];
  const priority = params.priorityLevel || "all";

  let categories: string[];
  if (priority === "high") categories = SCRAPE_CATEGORIES.highPriority;
  else if (priority === "medium") categories = SCRAPE_CATEGORIES.mediumPriority;
  else if (priority === "low") categories = SCRAPE_CATEGORIES.lowPriority;
  else categories = ALL_CATEGORIES;

  const maxCats = params.maxCategories || 8;
  const selectedCategories = categories.slice(0, maxCats);

  for (const category of selectedCategories) {
    const pageResults = await withRetry(async () => {
      const searchResult = await makeRequest<any>(
        "/maps/api/place/textsearch/json",
        {
          query: `${category} in ${params.location}`,
          ...(params.lat && params.lng ? { location: `${params.lat},${params.lng}` } : {}),
          radius: params.radius || 25000,
        }
      );

      const businesses: MultiSourceBusiness[] = [];
      if (searchResult.status === "OK" && searchResult.results) {
        for (const place of searchResult.results) {
          businesses.push({
            businessName: place.name,
            address: place.formatted_address,
            source: "google_maps",
            sourceId: place.place_id,
            rating: place.rating,
            reviewCount: place.user_ratings_total,
            category,
            hasWebsite: false, // Will be determined during detail fetch
            priceLevel: place.price_level,
          });
        }

        // Fetch next page if available (up to 1 additional page)
        if (searchResult.next_page_token) {
          await new Promise(r => setTimeout(r, 2000)); // Google requires delay
          try {
            const page2 = await makeRequest<any>(
              "/maps/api/place/textsearch/json",
              { pagetoken: searchResult.next_page_token }
            );
            if (page2.status === "OK" && page2.results) {
              for (const place of page2.results) {
                businesses.push({
                  businessName: place.name,
                  address: place.formatted_address,
                  source: "google_maps",
                  sourceId: place.place_id,
                  rating: place.rating,
                  reviewCount: place.user_ratings_total,
                  category,
                  hasWebsite: false,
                  priceLevel: place.price_level,
                });
              }
            }
          } catch {
            // Page 2 failed, continue with page 1 results
          }
        }
      }
      return businesses;
    });

    if (pageResults) results.push(...pageResults);
    await rateLimitedDelay("google_maps");
  }

  return results;
}

/**
 * Fetch Google Business Profile details (hours, website, photos, services)
 */
export async function fetchGoogleBusinessDetails(placeId: string): Promise<Partial<MultiSourceBusiness> | null> {
  return withRetry(async () => {
    const details = await makeRequest<any>(
      "/maps/api/place/details/json",
      {
        place_id: placeId,
        fields: "name,website,formatted_phone_number,opening_hours,photos,price_level,business_status,url",
      }
    );

    if (!details.result) return null;
    const r = details.result;

    return {
      website: r.website,
      phone: r.formatted_phone_number,
      hasWebsite: !!r.website,
      hours: r.opening_hours?.weekday_text?.join("; "),
      priceLevel: r.price_level,
      photos: r.photos?.slice(0, 3).map((p: any) => p.photo_reference),
    };
  });
}

/* ═══════════════════════════════════════════════════════
   YELP — ENHANCED
   ═══════════════════════════════════════════════════════ */

export async function scrapeYelp(params: {
  location: string;
  categories?: string[];
  limit?: number;
}): Promise<MultiSourceBusiness[]> {
  if (!ENV.yelpApiKey) {
    console.warn("[MultiSource] YELP_API_KEY not set — skipping Yelp scrape");
    return [];
  }

  const results: MultiSourceBusiness[] = [];
  const categories = params.categories || [
    "restaurants", "beauty", "contractors", "automotive", "health",
    "homeservices", "localservices", "pets", "fitness",
  ];

  for (const category of categories) {
    try {
      const url = new URL("https://api.yelp.com/v3/businesses/search");
      url.searchParams.set("term", category);
      url.searchParams.set("location", params.location);
      url.searchParams.set("limit", String(Math.min(params.limit || 30, 50)));
      url.searchParams.set("sort_by", "review_count");

      const resp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${ENV.yelpApiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!resp.ok) {
        console.error(`[MultiSource] Yelp API error: ${resp.status} ${resp.statusText}`);
        continue;
      }

      const data = await resp.json() as any;
      if (data?.businesses) {
        for (const biz of data.businesses) {
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
            priceLevel: biz.price?.length,
            description: biz.categories?.map((c: any) => c.title).join(", "),
          });
        }
      }
    } catch (err) {
      console.error(`[MultiSource] Yelp scrape failed for category ${category}:`, err);
    }
    await rateLimitedDelay("yelp");
  }

  return results;
}

/* ═══════════════════════════════════════════════════════
   FACEBOOK / BBB / HOMEADVISOR / OPENTABLE — REMOVED
   These sources depended on the Manus/Forge platform API
   (BUILT_IN_FORGE_API_URL) which is not available on Railway.
   Yelp Fusion + Google Maps now cover the same surface area.
   ═══════════════════════════════════════════════════════ */

export async function scrapeFacebook(_params: {
  location: string;
  categories?: string[];
  limit?: number;
}): Promise<MultiSourceBusiness[]> {
  return [];
}

export async function scrapeBBB(_params: {
  location: string;
  categories?: string[];
  limit?: number;
}): Promise<MultiSourceBusiness[]> {
  return [];
}

export async function scrapeDirectories(_params: {
  location: string;
  directories?: string[];
  limit?: number;
}): Promise<MultiSourceBusiness[]> {
  return [];
}

/* ═══════════════════════════════════════════════════════
   DE-DUPLICATION — FUZZY MATCHING
   ═══════════════════════════════════════════════════════ */

/**
 * Normalize a string for fuzzy comparison
 */
function normalize(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple similarity score between two strings (0-1)
 */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  // Check if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Token overlap
  const tokensA = na.split(" ");
  const tokensB = new Set(nb.split(" "));
  const intersection = tokensA.filter(t => tokensB.has(t));
  const unionSet = new Set(tokensA.concat(nb.split(" ")));
  return intersection.length / unionSet.size;
}

/**
 * De-duplicate businesses across sources with fuzzy matching
 */
export function deduplicateBusinesses(businesses: MultiSourceBusiness[]): MultiSourceBusiness[] {
  const unique: MultiSourceBusiness[] = [];

  for (const biz of businesses) {
    let isDuplicate = false;

    for (const existing of unique) {
      const nameSim = similarity(biz.businessName, existing.businessName);
      const addressSim = biz.address && existing.address
        ? similarity(biz.address, existing.address)
        : 0;

      // Phone match is a strong signal
      const phoneMatch = biz.phone && existing.phone &&
        biz.phone.replace(/\D/g, "").slice(-10) === existing.phone.replace(/\D/g, "").slice(-10);

      // Consider duplicate if: name very similar + address similar, OR phone matches
      if ((nameSim > 0.75 && addressSim > 0.5) || phoneMatch) {
        isDuplicate = true;
        // Merge additional data from the duplicate
        if (!existing.phone && biz.phone) existing.phone = biz.phone;
        if (!existing.website && biz.website) existing.website = biz.website;
        if (!existing.email && biz.email) existing.email = biz.email;
        if (!existing.rating && biz.rating) existing.rating = biz.rating;
        if (!existing.hours && biz.hours) existing.hours = biz.hours;
        if (!existing.description && biz.description) existing.description = biz.description;
        if (biz.socialProfiles) {
          existing.socialProfiles = { ...existing.socialProfiles, ...biz.socialProfiles };
        }
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(biz);
    }
  }

  return unique;
}

/* ═══════════════════════════════════════════════════════
   SOURCE QUALITY TRACKING
   ═══════════════════════════════════════════════════════ */

/**
 * Record that a lead from a specific source was converted
 */
export function recordSourceConversion(source: string, converted: boolean, score: number) {
  if (!sourceQuality[source]) {
    sourceQuality[source] = { totalLeads: 0, convertedLeads: 0, avgScore: 0 };
  }
  const sq = sourceQuality[source];
  sq.totalLeads++;
  if (converted) sq.convertedLeads++;
  sq.avgScore = ((sq.avgScore * (sq.totalLeads - 1)) + score) / sq.totalLeads;
}

/**
 * Get source quality rankings
 */
export function getSourceQuality(): Array<{
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgScore: number;
}> {
  return Object.entries(sourceQuality)
    .map(([source, stats]) => ({
      source,
      ...stats,
      conversionRate: stats.totalLeads > 0 ? Math.round((stats.convertedLeads / stats.totalLeads) * 100) : 0,
      avgScore: Math.round(stats.avgScore),
    }))
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

/* ═══════════════════════════════════════════════════════
   BATCH PROCESSING
   ═══════════════════════════════════════════════════════ */

export interface BatchScrapeResult {
  total: number;
  new: number;
  duplicates: number;
  bySource: Record<string, number>;
  errors: string[];
  duration: number;
}

/**
 * Run a full multi-source scrape for an area with batch processing
 */
export async function runMultiSourceScrape(params: {
  location: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sources?: ScrapingSource[];
  priorityLevel?: "high" | "medium" | "low" | "all";
  maxPerSource?: number;
}): Promise<BatchScrapeResult> {
  const startTime = Date.now();
  const db = (await getDb())!;
  const allBusinesses: MultiSourceBusiness[] = [];
  const bySource: Record<string, number> = {};
  const errors: string[] = [];

  const sources = params.sources || ["google_maps", "yelp", "facebook", "bbb", "homeadvisor", "opentable"];

  // ─── Google Maps ───
  if (sources.includes("google_maps")) {
    try {
      const googleResults = await scrapeGoogleExpanded({
        location: params.location,
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        priorityLevel: params.priorityLevel,
        maxCategories: 10,
      });
      allBusinesses.push(...googleResults);
      bySource.google_maps = googleResults.length;
    } catch (err) {
      errors.push(`Google Maps: ${(err as Error).message}`);
    }
  }

  // ─── Yelp ───
  if (sources.includes("yelp")) {
    try {
      const yelpResults = await scrapeYelp({
        location: params.location,
        limit: params.maxPerSource || 30,
      });
      allBusinesses.push(...yelpResults);
      bySource.yelp = yelpResults.length;
    } catch (err) {
      errors.push(`Yelp: ${(err as Error).message}`);
    }
  }

  // Facebook, BBB, HomeAdvisor, OpenTable removed — dependent on Forge/Manus platform API.
  // Yelp Fusion + Google Maps cover the same business surface area on Railway.

  // ─── De-duplicate ───
  const unique = deduplicateBusinesses(allBusinesses);
  const duplicates = allBusinesses.length - unique.length;

  // ─── Save new businesses to DB ───
  let newCount = 0;
  for (const biz of unique) {
    try {
      // Check if already exists by name + similar address
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
          scrapeJobId: 0,
          googlePlaceId: biz.sourceId || `${biz.source}_${Date.now()}_${newCount}`,
          businessName: biz.businessName,
          address: biz.address,
          phone: biz.phone,
          website: biz.website,
          rating: biz.rating?.toString(),
          reviewCount: biz.reviewCount,
          businessTypes: [biz.category || "other"],
          hasWebsite: biz.hasWebsite,
          status: "scraped",
          enrichmentData: {
            source: biz.source,
            sourceId: biz.sourceId,
            hours: biz.hours,
            priceLevel: biz.priceLevel,
            socialProfiles: biz.socialProfiles,
            yearEstablished: biz.yearEstablished,
            employeeCount: biz.employeeCount,
            description: biz.description,
          },
        });
        newCount++;
      }
    } catch (err) {
      errors.push(`Save failed for ${biz.businessName}: ${(err as Error).message}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[MultiSource] Scrape complete: ${allBusinesses.length} found, ${unique.length} unique, ${newCount} new, ${duplicates} duplicates in ${Math.round(duration / 1000)}s`);

  return { total: allBusinesses.length, new: newCount, duplicates, bySource, errors, duration };
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

    for (const place of searchResult.results.slice(0, 10)) {
      if (place.name === biz.businessName) continue;
      if (!place.rating || place.rating < 4.0) continue;

      const details = await withRetry(async () => {
        return await makeRequest<any>(
          "/maps/api/place/details/json",
          {
            place_id: place.place_id,
            fields: "name,website,rating,user_ratings_total",
          }
        );
      });

      if (details?.result?.website) {
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

      await rateLimitedDelay("google_maps");
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
