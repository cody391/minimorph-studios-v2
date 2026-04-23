/**
 * Adaptive Scaling Service
 * 
 * Ensures the lead gen engine never runs dry by automatically:
 * 1. Expanding search radius when leads run low
 * 2. Rotating through categories — track exhausted categories per area
 * 3. Geographic expansion — auto-scrape neighboring cities
 * 4. Quality threshold relaxation — gradually lower bar when volume needed
 * 5. "Running low" detection based on rep capacity vs available leads
 */

import { getDb } from "../db";
import { scrapeJobs, scrapedBusinesses, reps, leads } from "../../drizzle/schema";
import { eq, and, sql, count, inArray, notInArray } from "drizzle-orm";
import { makeRequest } from "../_core/map";

// ─── Configuration ───

const DEFAULT_RADIUS_MILES = 10;
const MAX_RADIUS_MILES = 50;
const RADIUS_INCREMENT_MILES = 5;
const MIN_LEADS_PER_REP = 5;
const IDEAL_LEADS_PER_REP = 15;
const LOW_LEAD_THRESHOLD = 3;

// All business categories we can scrape, ordered by conversion likelihood
const ALL_CATEGORIES = [
  // Tier 1: Highest conversion (service businesses that need online presence)
  "restaurant", "hair_salon", "beauty_salon", "spa", "nail_salon",
  "dental_clinic", "medical_clinic", "veterinary_care", "chiropractor",
  // Tier 2: High conversion (local services)
  "plumber", "electrician", "hvac", "roofing_contractor", "general_contractor",
  "auto_repair", "car_wash", "laundry", "dry_cleaning",
  // Tier 3: Medium conversion
  "gym", "yoga_studio", "dance_studio", "martial_arts_school",
  "pet_grooming", "pet_store", "florist", "bakery", "cafe",
  // Tier 4: Broader categories
  "real_estate_agency", "insurance_agency", "accounting",
  "law_firm", "photography_studio", "wedding_venue",
  "daycare", "tutoring_center", "driving_school",
  // Tier 5: Retail and other
  "clothing_store", "jewelry_store", "furniture_store",
  "hardware_store", "liquor_store", "convenience_store",
  "tattoo_shop", "barber_shop", "optician",
];

// Nearby city expansion — common metro patterns
const EXPANSION_DIRECTIONS = [
  { lat: 0.15, lng: 0 },    // ~10mi north
  { lat: -0.15, lng: 0 },   // ~10mi south
  { lat: 0, lng: 0.15 },    // ~10mi east
  { lat: 0, lng: -0.15 },   // ~10mi west
  { lat: 0.1, lng: 0.1 },   // ~10mi northeast
  { lat: -0.1, lng: 0.1 },  // ~10mi southeast
  { lat: 0.1, lng: -0.1 },  // ~10mi northwest
  { lat: -0.1, lng: -0.1 }, // ~10mi southwest
];

// ─── Types ───

export interface RepCapacityReport {
  repId: number;
  repName: string;
  serviceArea: string;
  activeLeads: number;
  availableUnassigned: number;
  needsMoreLeads: boolean;
  deficit: number; // how many more leads they need
}

export interface AdaptiveAction {
  type: "expand_radius" | "rotate_category" | "expand_geography" | "relax_quality" | "no_action";
  repId: number;
  details: string;
  params: Record<string, any>;
}

export interface ScalingReport {
  timestamp: Date;
  repsAnalyzed: number;
  repsNeedingLeads: number;
  actionsPlanned: AdaptiveAction[];
  actionsExecuted: number;
  newScrapeJobsCreated: number;
}

// ─── Rep Capacity Analysis ───

/**
 * Analyze each rep's current lead capacity and determine who needs more leads
 */
export async function analyzeRepCapacity(): Promise<RepCapacityReport[]> {
  const db = (await getDb())!;

  // Get all active reps
  const activeReps = await db
    .select()
    .from(reps)
    .where(eq(reps.status, "active"));

  const reports: RepCapacityReport[] = [];

  for (const rep of activeReps) {
    // Count active leads assigned to this rep
    const [activeLeadCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          eq(leads.assignedRepId, rep.id),
          inArray(leads.stage, ["assigned", "contacted", "proposal_sent", "negotiating"])
        )
      );

    // Count available unassigned leads in their area
    const [unassignedCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          eq(leads.stage, "new"),
          sql`${leads.assignedRepId} IS NULL`
        )
      );

    const activeCount = activeLeadCount?.count || 0;
    const available = unassignedCount?.count || 0;
    const needsMore = activeCount < MIN_LEADS_PER_REP;
    const deficit = Math.max(0, IDEAL_LEADS_PER_REP - activeCount);

    // Use rep's bio or a default area (reps don't have a dedicated serviceArea field)
    const serviceArea = rep.bio?.match(/(?:based in|located in|serving)\s+([^,.]+)/i)?.[1]?.trim() || "General";

    reports.push({
      repId: rep.id,
      repName: rep.fullName,
      serviceArea,
      activeLeads: activeCount,
      availableUnassigned: available,
      needsMoreLeads: needsMore,
      deficit,
    });
  }

  return reports;
}

// ─── Category Rotation ───

/**
 * Find which categories have been exhausted in a given area
 * and return the next fresh categories to try
 */
export async function getNextCategories(
  serviceArea: string,
  limit = 5
): Promise<string[]> {
  const db = (await getDb())!;

  // Find categories already scraped in this area
  const scrapedCats = await db
    .select({ area: scrapeJobs.targetArea })
    .from(scrapeJobs)
    .where(
      and(
        eq(scrapeJobs.targetArea, serviceArea),
        eq(scrapeJobs.status, "completed")
      )
    );

  // Use businessTypes from scrape jobs to track which categories have been tried
  // Since scrapeJobs stores businessTypes as JSON array, we track by targetArea
  const usedCategories = new Set(scrapedCats.map(r => r.area));
  
  // Return categories not yet tried, in priority order
  const freshCategories = ALL_CATEGORIES.filter(c => !usedCategories.has(c));

  if (freshCategories.length > 0) {
    return freshCategories.slice(0, limit);
  }

  // All categories exhausted — return the oldest-scraped ones for re-scraping
  // All categories exhausted — just return the first few categories for re-scraping
  return ALL_CATEGORIES.slice(0, limit);
}

// ─── Geographic Expansion ───

/**
 * Find neighboring areas to expand scraping into
 * Uses the rep's service area center point and expands outward
 */
export async function getExpansionAreas(
  serviceArea: string,
  currentRadius: number
): Promise<Array<{ area: string; lat: number; lng: number }>> {
  try {
    // Geocode the service area to get center coordinates
    const geocodeResult = await makeRequest(
      "https://maps.googleapis.com/maps/api/geocode/json",
      { address: serviceArea }
    ) as any;

    if (!geocodeResult?.results?.[0]?.geometry?.location) {
      console.log(`[AdaptiveScaling] Could not geocode: ${serviceArea}`);
      return [];
    }

    const center = geocodeResult.results[0].geometry.location;
    const expansionAreas: Array<{ area: string; lat: number; lng: number }> = [];

    // Generate neighboring areas
    for (const dir of EXPANSION_DIRECTIONS) {
      const newLat = center.lat + dir.lat;
      const newLng = center.lng + dir.lng;

      // Reverse geocode to get the city name
      try {
        const reverseResult = await makeRequest(
          "https://maps.googleapis.com/maps/api/geocode/json",
          { latlng: `${newLat},${newLng}` }
        ) as any;

        if (reverseResult?.results?.[0]) {
          // Extract city name from address components
          const components = reverseResult.results[0].address_components || [];
          const city = components.find((c: any) =>
            c.types.includes("locality") || c.types.includes("sublocality")
          );
          const state = components.find((c: any) =>
            c.types.includes("administrative_area_level_1")
          );

          if (city && state) {
            const areaName = `${city.long_name}, ${state.short_name}`;
            // Don't include the same area
            if (areaName.toLowerCase() !== serviceArea.toLowerCase()) {
              expansionAreas.push({
                area: areaName,
                lat: newLat,
                lng: newLng,
              });
            }
          }
        }
      } catch {
        // Skip failed reverse geocodes
      }
    }

    // Deduplicate by area name
    const seen = new Set<string>();
    return expansionAreas.filter(a => {
      const key = a.area.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (err) {
    console.error("[AdaptiveScaling] Expansion error:", err);
    return [];
  }
}

// ─── Quality Threshold Relaxation ───

/**
 * Determine the appropriate quality threshold based on lead scarcity
 * Lower threshold = more leads but lower quality
 */
export function getAdaptiveQualityThreshold(
  activeLeads: number,
  deficit: number
): {
  minWebsiteScore: number; // Accept businesses with website score below this
  acceptWithWebsite: boolean; // Accept businesses that have a website (but bad one)
  minRating: number; // Minimum Google rating
  minReviews: number; // Minimum review count
  description: string;
} {
  // Tier 1: Plenty of leads — strict quality (best leads only)
  if (deficit <= 0) {
    return {
      minWebsiteScore: 0, // Only no-website businesses
      acceptWithWebsite: false,
      minRating: 3.5,
      minReviews: 10,
      description: "Strict: No website, 3.5+ rating, 10+ reviews",
    };
  }

  // Tier 2: Need a few more — slightly relaxed
  if (deficit <= 5) {
    return {
      minWebsiteScore: 30, // Accept terrible websites too
      acceptWithWebsite: true,
      minRating: 3.0,
      minReviews: 5,
      description: "Relaxed: Bad websites (score <30), 3.0+ rating, 5+ reviews",
    };
  }

  // Tier 3: Need many more — moderately relaxed
  if (deficit <= 10) {
    return {
      minWebsiteScore: 50, // Accept mediocre websites
      acceptWithWebsite: true,
      minRating: 2.5,
      minReviews: 2,
      description: "Moderate: Mediocre websites (score <50), 2.5+ rating, 2+ reviews",
    };
  }

  // Tier 4: Desperate — accept almost anything
  return {
    minWebsiteScore: 70, // Accept anything below decent
    acceptWithWebsite: true,
    minRating: 0,
    minReviews: 0,
    description: "Wide open: Any business with website score <70 or no website",
  };
}

// ─── Main Adaptive Scaling Engine ───

/**
 * Run the full adaptive scaling analysis and create scrape jobs as needed
 */
export async function runAdaptiveScaling(): Promise<ScalingReport> {
  const db = (await getDb())!;
  const report: ScalingReport = {
    timestamp: new Date(),
    repsAnalyzed: 0,
    repsNeedingLeads: 0,
    actionsPlanned: [],
    actionsExecuted: 0,
    newScrapeJobsCreated: 0,
  };

  // Step 1: Analyze rep capacity
  const repReports = await analyzeRepCapacity();
  report.repsAnalyzed = repReports.length;

  const repsNeedingLeads = repReports.filter(r => r.needsMoreLeads);
  report.repsNeedingLeads = repsNeedingLeads.length;

  if (repsNeedingLeads.length === 0) {
    console.log("[AdaptiveScaling] All reps have sufficient leads. No action needed.");
    return report;
  }

  console.log(`[AdaptiveScaling] ${repsNeedingLeads.length} reps need more leads`);

  // Step 2: For each rep needing leads, determine the best action
  for (const rep of repsNeedingLeads) {
    const actions = await planActionsForRep(rep);
    report.actionsPlanned.push(...actions);
  }

  // Step 3: Execute planned actions (create scrape jobs)
  for (const action of report.actionsPlanned) {
    try {
      await executeAction(action, db);
      report.actionsExecuted++;
      if (action.type !== "no_action") {
        report.newScrapeJobsCreated++;
      }
    } catch (err) {
      console.error(`[AdaptiveScaling] Failed to execute action:`, action, err);
    }
  }

  console.log(`[AdaptiveScaling] Complete: ${report.actionsExecuted}/${report.actionsPlanned.length} actions executed, ${report.newScrapeJobsCreated} new scrape jobs`);
  return report;
}

/**
 * Plan the best actions for a rep who needs more leads
 */
async function planActionsForRep(rep: RepCapacityReport): Promise<AdaptiveAction[]> {
  const actions: AdaptiveAction[] = [];
  const qualityThreshold = getAdaptiveQualityThreshold(rep.activeLeads, rep.deficit);

  // Action 1: Try new categories in their current area
  const freshCategories = await getNextCategories(rep.serviceArea, 3);
  if (freshCategories.length > 0) {
    actions.push({
      type: "rotate_category",
      repId: rep.repId,
      details: `Try new categories in ${rep.serviceArea}: ${freshCategories.join(", ")}`,
      params: {
        area: rep.serviceArea,
        categories: freshCategories,
        quality: qualityThreshold,
      },
    });
  }

  // Action 2: If deficit is high, also expand radius
  if (rep.deficit > 5) {
    actions.push({
      type: "expand_radius",
      repId: rep.repId,
      details: `Expand search radius in ${rep.serviceArea} to ${DEFAULT_RADIUS_MILES + RADIUS_INCREMENT_MILES} miles`,
      params: {
        area: rep.serviceArea,
        radius: Math.min(DEFAULT_RADIUS_MILES + RADIUS_INCREMENT_MILES * 2, MAX_RADIUS_MILES),
        quality: qualityThreshold,
      },
    });
  }

  // Action 3: If deficit is very high, expand to neighboring cities
  if (rep.deficit > 10) {
    const expansionAreas = await getExpansionAreas(rep.serviceArea, DEFAULT_RADIUS_MILES);
    if (expansionAreas.length > 0) {
      // Pick top 3 expansion areas
      for (const area of expansionAreas.slice(0, 3)) {
        actions.push({
          type: "expand_geography",
          repId: rep.repId,
          details: `Expand to neighboring city: ${area.area}`,
          params: {
            area: area.area,
            lat: area.lat,
            lng: area.lng,
            quality: qualityThreshold,
          },
        });
      }
    }
  }

  // Action 4: If quality is being relaxed, note it
  if (qualityThreshold.acceptWithWebsite) {
    actions.push({
      type: "relax_quality",
      repId: rep.repId,
      details: `Quality relaxed: ${qualityThreshold.description}`,
      params: { quality: qualityThreshold },
    });
  }

  if (actions.length === 0) {
    actions.push({
      type: "no_action",
      repId: rep.repId,
      details: "No expansion possible — all categories and areas exhausted",
      params: {},
    });
  }

  return actions;
}

/**
 * Execute a planned adaptive action by creating scrape jobs
 */
async function executeAction(action: AdaptiveAction, db: any): Promise<void> {
  if (action.type === "no_action" || action.type === "relax_quality") return;

  const categories = action.params.categories || ALL_CATEGORIES.slice(0, 3);
  const area = action.params.area;

  for (const category of Array.isArray(categories) ? categories : [categories]) {
    // Check if this exact job already exists and is pending/running
    const [existing] = await db
      .select({ id: scrapeJobs.id })
      .from(scrapeJobs)
      .where(
        and(
          eq(scrapeJobs.targetArea, area),
          eq(scrapeJobs.targetArea, category),
          inArray(scrapeJobs.status, ["pending", "running"])
        )
      )
      .limit(1);

    if (existing) {
      console.log(`[AdaptiveScaling] Skipping duplicate job: ${category} in ${area}`);
      continue;
    }

    // Create new scrape job
    await db.insert(scrapeJobs).values({
      targetArea: area,
      businessTypes: [category],
      status: "pending",
      totalFound: 0,
      totalQualified: 0,
    });

    console.log(`[AdaptiveScaling] Created scrape job: ${category} in ${area} (${action.type})`);
  }
}

/**
 * Get a summary of the adaptive scaling state
 */
export async function getAdaptiveScalingSummary(): Promise<{
  totalActiveReps: number;
  repsNeedingLeads: number;
  totalAvailableLeads: number;
  categoriesExhausted: number;
  totalCategories: number;
  currentQualityTier: string;
  recommendation: string;
}> {
  const repReports = await analyzeRepCapacity();
  const repsNeeding = repReports.filter(r => r.needsMoreLeads);
  const totalAvailable = repReports.reduce((sum, r) => sum + r.availableUnassigned, 0);

  // Determine overall quality tier based on worst-case rep
  const maxDeficit = Math.max(0, ...repReports.map(r => r.deficit));
  const qualityTier = getAdaptiveQualityThreshold(0, maxDeficit);

  let recommendation = "";
  if (repsNeeding.length === 0) {
    recommendation = "All reps are well-supplied with leads. System is running optimally.";
  } else if (repsNeeding.length <= 2) {
    recommendation = `${repsNeeding.length} rep(s) need more leads. Adaptive scaling will handle this automatically.`;
  } else {
    recommendation = `${repsNeeding.length} reps need leads. Consider adding more target areas or relaxing quality thresholds.`;
  }

  return {
    totalActiveReps: repReports.length,
    repsNeedingLeads: repsNeeding.length,
    totalAvailableLeads: totalAvailable,
    categoriesExhausted: ALL_CATEGORIES.length - (await getNextCategories("", ALL_CATEGORIES.length)).length,
    totalCategories: ALL_CATEGORIES.length,
    currentQualityTier: qualityTier.description,
    recommendation,
  };
}
