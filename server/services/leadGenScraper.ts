/**
 * Lead Generation Scraper Service
 * 
 * Uses Google Maps Places API to discover businesses in target areas,
 * scores their web presence, and identifies low-hanging fruit leads.
 */

import { makeRequest, type PlacesSearchResult, type PlaceDetailsResult } from "../_core/map";
import { getDb } from "../db";
import { scrapeJobs, scrapedBusinesses } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

// Business types that are most likely to need websites
const LOW_HANGING_FRUIT_TYPES = [
  "restaurant", "cafe", "bakery", "bar",
  "hair_care", "beauty_salon", "spa",
  "plumber", "electrician", "painter", "roofing_contractor", "general_contractor",
  "dentist", "doctor", "veterinary_care", "physiotherapist",
  "gym", "yoga_studio",
  "car_repair", "car_wash",
  "florist", "pet_store", "laundry",
  "real_estate_agency", "insurance_agency", "accounting",
  "locksmith", "moving_company", "storage",
  "clothing_store", "jewelry_store", "furniture_store",
  "church", "mosque", "synagogue",
  "school", "daycare", "tutoring",
  "photographer", "event_planner", "wedding_planner",
];

// Queries to find businesses without good web presence
const SEARCH_QUERIES = [
  "small business near",
  "local business near",
  "restaurant near",
  "salon near",
  "contractor near",
  "dentist near",
  "auto repair near",
  "plumber near",
  "electrician near",
  "real estate agent near",
  "insurance agent near",
  "gym near",
  "pet grooming near",
  "cleaning service near",
  "landscaping near",
];

export interface ScrapeResult {
  totalFound: number;
  totalQualified: number;
  businesses: Array<{
    googlePlaceId: string;
    businessName: string;
    address: string;
    hasWebsite: boolean;
    website?: string;
    rating?: number;
    reviewCount?: number;
  }>;
}

/**
 * Run a scrape job — find businesses in a target area using Google Maps
 */
export async function runScrapeJob(jobId: number): Promise<ScrapeResult> {
  // Get the job
  const db = (await getDb())!;
  const [job] = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, jobId));
  if (!job) throw new Error(`Scrape job ${jobId} not found`);

  // Mark as running
  await db.update(scrapeJobs).set({ status: "running" }).where(eq(scrapeJobs.id, jobId));

  try {
    const allBusinesses: Array<{
      googlePlaceId: string;
      businessName: string;
      address: string;
      phone?: string;
      website?: string;
      rating?: number;
      reviewCount?: number;
      types: string[];
      lat?: number;
      lng?: number;
      hasWebsite: boolean;
    }> = [];

    const seenPlaceIds = new Set<string>();

    // Also check if we already have this business in the DB
    const existingBusinesses = await db.select({ googlePlaceId: scrapedBusinesses.googlePlaceId })
      .from(scrapedBusinesses);
    const existingPlaceIds = new Set(existingBusinesses.map((b: { googlePlaceId: string }) => b.googlePlaceId));

    // Determine which business types to search for
    const typesToSearch = (job.businessTypes as string[] | null)?.length
      ? (job.businessTypes as string[])
      : LOW_HANGING_FRUIT_TYPES.slice(0, 10); // Default to top 10 types

    // Search using both text search and nearby search
    const location = job.targetLat && job.targetLng
      ? `${job.targetLat},${job.targetLng}`
      : null;

    // Strategy 1: Text search for businesses in the area
    const searchQueries = typesToSearch.slice(0, 5).map(type =>
      `${type.replace(/_/g, " ")} in ${job.targetArea}`
    );

    for (const query of searchQueries) {
      try {
        const result = await makeRequest<PlacesSearchResult>(
          "/maps/api/place/textsearch/json",
          {
            query,
            ...(location ? { location, radius: job.radiusKm * 1000 } : {}),
          }
        );

        if (result.status === "OK" && result.results) {
          for (const place of result.results) {
            if (seenPlaceIds.has(place.place_id) || existingPlaceIds.has(place.place_id)) continue;
            seenPlaceIds.add(place.place_id);

            allBusinesses.push({
              googlePlaceId: place.place_id,
              businessName: place.name,
              address: place.formatted_address,
              types: place.types || [],
              lat: place.geometry?.location?.lat,
              lng: place.geometry?.location?.lng,
              rating: place.rating,
              reviewCount: place.user_ratings_total,
              hasWebsite: false, // Will be determined by place details
            });
          }
        }
      } catch (err) {
        console.error(`[LeadGenScraper] Text search failed for "${query}":`, err);
      }

      // Rate limit — small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }

    // Strategy 2: Nearby search if we have coordinates
    if (location) {
      for (const type of typesToSearch.slice(0, 5)) {
        try {
          const result = await makeRequest<PlacesSearchResult>(
            "/maps/api/place/nearbysearch/json",
            {
              location,
              radius: Math.min(job.radiusKm * 1000, 50000), // Max 50km
              type,
            }
          );

          if (result.status === "OK" && result.results) {
            for (const place of result.results) {
              if (seenPlaceIds.has(place.place_id) || existingPlaceIds.has(place.place_id)) continue;
              seenPlaceIds.add(place.place_id);

              allBusinesses.push({
                googlePlaceId: place.place_id,
                businessName: place.name,
                address: place.formatted_address,
                types: place.types || [],
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating,
                reviewCount: place.user_ratings_total,
                hasWebsite: false,
              });
            }
          }
        } catch (err) {
          console.error(`[LeadGenScraper] Nearby search failed for type "${type}":`, err);
        }

        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Get details for each business (website, phone, etc.)
    let qualifiedCount = 0;
    const detailedBusinesses = [];

    for (const biz of allBusinesses.slice(0, 60)) { // Cap at 60 per job to manage API usage
      try {
        const details = await makeRequest<PlaceDetailsResult>(
          "/maps/api/place/details/json",
          {
            place_id: biz.googlePlaceId,
            fields: "name,formatted_phone_number,website,rating,user_ratings_total,opening_hours,formatted_address",
          }
        );

        if (details.status === "OK" && details.result) {
          const d = details.result;
          biz.phone = d.formatted_phone_number;
          biz.website = d.website;
          biz.hasWebsite = !!d.website;
          biz.rating = d.rating ?? biz.rating;
          biz.reviewCount = d.user_ratings_total ?? biz.reviewCount;

          // Qualification: no website OR has a website (we'll score it later)
          const isQualified = !biz.hasWebsite || true; // We'll score websites later
          if (isQualified) qualifiedCount++;

          detailedBusinesses.push(biz);
        }
      } catch (err) {
        console.error(`[LeadGenScraper] Details failed for ${biz.businessName}:`, err);
        detailedBusinesses.push(biz); // Still save it
      }

      await new Promise(r => setTimeout(r, 150));
    }

    // Save to database
    for (const biz of detailedBusinesses) {
      try {
        await db.insert(scrapedBusinesses).values({
          scrapeJobId: jobId,
          googlePlaceId: biz.googlePlaceId,
          businessName: biz.businessName,
          address: biz.address,
          phone: biz.phone,
          website: biz.website,
          rating: biz.rating?.toString(),
          reviewCount: biz.reviewCount || 0,
          businessTypes: biz.types,
          lat: biz.lat?.toString(),
          lng: biz.lng?.toString(),
          hasWebsite: biz.hasWebsite,
          qualified: !biz.hasWebsite, // No website = immediately qualified
          status: biz.hasWebsite ? "scraped" : "qualified",
        });
      } catch (err) {
        // Likely duplicate googlePlaceId, skip
        console.error(`[LeadGenScraper] Insert failed for ${biz.businessName}:`, err);
      }
    }

    // Update job
    await db.update(scrapeJobs).set({
      status: "completed",
      totalFound: detailedBusinesses.length,
      totalQualified: qualifiedCount,
      completedAt: new Date(),
    }).where(eq(scrapeJobs.id, jobId));

    return {
      totalFound: detailedBusinesses.length,
      totalQualified: qualifiedCount,
      businesses: detailedBusinesses.map(b => ({
        googlePlaceId: b.googlePlaceId,
        businessName: b.businessName,
        address: b.address || "",
        hasWebsite: b.hasWebsite,
        website: b.website,
        rating: b.rating,
        reviewCount: b.reviewCount,
      })),
    };
  } catch (err: any) {
    await db.update(scrapeJobs).set({
      status: "failed",
      errorMessage: err.message || "Unknown error",
    }).where(eq(scrapeJobs.id, jobId));
    throw err;
  }
}

/**
 * Score a website's quality using a lightweight check
 * Returns 0-100 (0 = terrible, 100 = great)
 */
export async function scoreWebsite(url: string): Promise<{
  score: number;
  issues: string[];
}> {
  const issues: string[] = [];
  let score = 100;

  try {
    // Check if the website is reachable
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MiniMorphBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      issues.push("not_reachable");
      return { score: 0, issues };
    }

    const html = await response.text();

    // Check for HTTPS
    if (!url.startsWith("https")) {
      issues.push("no_ssl");
      score -= 15;
    }

    // Check for mobile viewport meta tag
    if (!html.includes("viewport")) {
      issues.push("not_mobile_friendly");
      score -= 25;
    }

    // Check for basic SEO
    if (!html.includes("<title>") || html.includes("<title></title>")) {
      issues.push("no_title");
      score -= 10;
    }

    if (!html.includes('meta name="description"') && !html.includes("meta name='description'")) {
      issues.push("no_meta_description");
      score -= 10;
    }

    // Check for outdated tech indicators
    if (html.includes("This site was built using Wix") || html.includes("wix.com")) {
      issues.push("wix_site");
      score -= 5;
    }

    // Check page size (very large = slow)
    if (html.length > 500000) {
      issues.push("very_large_page");
      score -= 10;
    }

    // Check for images without alt text (accessibility)
    const imgCount = (html.match(/<img/g) || []).length;
    const altCount = (html.match(/<img[^>]*alt=/g) || []).length;
    if (imgCount > 0 && altCount / imgCount < 0.5) {
      issues.push("poor_accessibility");
      score -= 10;
    }

    // Check for contact info (phone, email)
    const hasPhone = /\(\d{3}\)\s?\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}/.test(html);
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
    if (!hasPhone && !hasEmail) {
      issues.push("no_contact_info");
      score -= 10;
    }

    // Check for social media links
    const hasSocial = /facebook\.com|instagram\.com|twitter\.com|linkedin\.com/.test(html);
    if (!hasSocial) {
      issues.push("no_social_links");
      score -= 5;
    }

    // Check for modern framework indicators (React, Vue, etc.)
    const isModern = html.includes("__next") || html.includes("__nuxt") || html.includes("data-reactroot") || html.includes("ng-app");
    if (!isModern && html.includes("table") && (html.match(/<table/g) || []).length > 3) {
      issues.push("outdated_layout");
      score -= 15;
    }

    return { score: Math.max(0, Math.min(100, score)), issues };
  } catch (err: any) {
    if (err.name === "AbortError") {
      issues.push("very_slow");
      return { score: 10, issues };
    }
    issues.push("not_reachable");
    return { score: 0, issues };
  }
}

/**
 * Score all unscored websites in scraped businesses
 */
export async function scoreUnscrapedWebsites(limit: number = 20): Promise<number> {
  const db = (await getDb())!;
  const unscored = await db.select()
    .from(scrapedBusinesses)
    .where(
      and(
        eq(scrapedBusinesses.hasWebsite, true),
        isNull(scrapedBusinesses.websiteScore),
        eq(scrapedBusinesses.status, "scraped")
      )
    )
    .limit(limit);

  let scored = 0;
  for (const biz of unscored) {
    if (!biz.website) continue;

    try {
      await db.update(scrapedBusinesses)
        .set({ status: "scoring" })
        .where(eq(scrapedBusinesses.id, biz.id));

      const { score, issues } = await scoreWebsite(biz.website);

      // Qualify if score is below 60 (bad website = opportunity)
      const qualified = score < 60;

      await db.update(scrapedBusinesses).set({
        websiteScore: score,
        websiteIssues: issues,
        qualified,
        status: qualified ? "qualified" : "scored",
      }).where(eq(scrapedBusinesses.id, biz.id));

      scored++;
    } catch (err) {
      console.error(`[LeadGenScraper] Scoring failed for ${biz.businessName}:`, err);
      await db.update(scrapedBusinesses).set({ status: "scored" }).where(eq(scrapedBusinesses.id, biz.id));
    }

    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  return scored;
}

/**
 * Create a scrape job for a specific area
 */
export async function createScrapeJob(params: {
  targetArea: string;
  targetLat?: number;
  targetLng?: number;
  radiusKm?: number;
  businessTypes?: string[];
  forRepId?: number;
}): Promise<number> {
  // If no coordinates, geocode the area name
  let lat = params.targetLat;
  let lng = params.targetLng;

  if (!lat || !lng) {
    try {
      const geocode = await makeRequest<any>("/maps/api/geocode/json", {
        address: params.targetArea,
      });
      if (geocode.status === "OK" && geocode.results?.[0]) {
        lat = geocode.results[0].geometry.location.lat;
        lng = geocode.results[0].geometry.location.lng;
      }
    } catch (err) {
      console.error(`[LeadGenScraper] Geocoding failed for ${params.targetArea}:`, err);
    }
  }

  const db = (await getDb())!;
  const [result] = await db.insert(scrapeJobs).values({
    targetArea: params.targetArea,
    targetLat: lat?.toString(),
    targetLng: lng?.toString(),
    radiusKm: params.radiusKm || 25,
    businessTypes: params.businessTypes || LOW_HANGING_FRUIT_TYPES.slice(0, 10),
    forRepId: params.forRepId,
    status: "pending",
  }).$returningId();

  return result.id;
}

export { LOW_HANGING_FRUIT_TYPES };
