/**
 * Lead Generation Auto-Router & Rep Capacity Manager
 * 
 * Routes leads to the right destination:
 * - Simple/hot leads → try to self-close (send to website)
 * - Needs human touch → assign to nearest rep with capacity
 * - Enterprise/big-ticket → send to owner
 * 
 * Also manages rep capacity — ensures each rep has enough leads
 * and triggers new scrape jobs when reps need more.
 */
import { getDb } from "../db";
import {
  reps, leads, repServiceAreas, scrapedBusinesses, scrapeJobs,
  academyCertifications,
} from "../../drizzle/schema";
import { isRepCertified } from "./academyGatekeeper";
import { eq, and, sql, isNull, ne } from "drizzle-orm";
import { createScrapeJob, runScrapeJob } from "./leadGenScraper";
import { enrichQualifiedBusinesses, batchConvertToLeads } from "./leadGenEnrichment";
import { scheduleOutreachSequence } from "./leadGenOutreach";

// Configuration
const MAX_ACTIVE_LEADS_PER_REP = 15; // Don't overload reps
const MIN_ACTIVE_LEADS_PER_REP = 5;  // Keep reps busy
const LEADS_TO_GENERATE_PER_BATCH = 10;

export interface RepCapacityInfo {
  repId: number;
  repName: string;
  activeLeads: number;
  maxCapacity: number;
  needsMoreLeads: boolean;
  serviceArea?: string;
}

/**
 * Get capacity info for all active reps
 */
export async function getRepCapacity(): Promise<RepCapacityInfo[]> {
  const db = (await getDb())!;

  const activeReps = await db.select().from(reps).where(eq(reps.status, "active"));

  // Only certified reps can receive leads
  const certifiedRepIds = new Set<number>();
  for (const rep of activeReps) {
    if (await isRepCertified(rep.id)) {
      certifiedRepIds.add(rep.id);
    }
  }
  const certifiedReps = activeReps.filter(r => certifiedRepIds.has(r.id));

  const repLeadCounts = await db.select({
    repId: leads.assignedRepId,
    count: sql<number>`count(*)`,
  })
    .from(leads)
    .where(
      and(
        sql`${leads.assignedRepId} IS NOT NULL`,
        sql`${leads.stage} NOT IN ('closed_won', 'closed_lost')`
      )
    )
    .groupBy(leads.assignedRepId);

  const loadMap = new Map(repLeadCounts.map(r => [r.repId, Number(r.count)]));

  // Get service areas
  const areas = await db.select().from(repServiceAreas);
  const areaMap = new Map<number, string>();
  for (const area of areas) {
    if (area.isPrimary) {
      areaMap.set(area.repId, area.areaName);
    }
  }

  return certifiedReps.map(rep => {
    const activeLeads = loadMap.get(rep.id) || 0;
    return {
      repId: rep.id,
      repName: rep.fullName,
      activeLeads,
      maxCapacity: MAX_ACTIVE_LEADS_PER_REP,
      needsMoreLeads: activeLeads < MIN_ACTIVE_LEADS_PER_REP,
      serviceArea: areaMap.get(rep.id),
    };
  });
}

/**
 * Auto-feed reps who need more leads
 * This is the main orchestrator that ties everything together
 */
export async function autoFeedReps(): Promise<{
  repsChecked: number;
  repsFed: number;
  leadsGenerated: number;
  scrapeJobsCreated: number;
}> {
  const capacity = await getRepCapacity();
  const db = (await getDb())!;

  let repsFed = 0;
  let leadsGenerated = 0;
  let scrapeJobsCreated = 0;

  for (const rep of capacity) {
    if (!rep.needsMoreLeads) continue;

    const leadsNeeded = MIN_ACTIVE_LEADS_PER_REP - rep.activeLeads;

    // Strategy 1: Assign from existing unassigned enriched leads
    const unassignedLeads = await db.select()
      .from(leads)
      .where(
        and(
          eq(leads.stage, "enriched"),
          isNull(leads.assignedRepId),
          eq(leads.selfSourced, false)
        )
      )
      .limit(leadsNeeded);

    for (const lead of unassignedLeads) {
      await db.update(leads).set({
        assignedRepId: rep.repId,
        stage: "assigned",
      }).where(eq(leads.id, lead.id));
      leadsGenerated++;
    }

    if (unassignedLeads.length >= leadsNeeded) {
      repsFed++;
      continue;
    }

    // Strategy 2: Convert enriched scraped businesses to leads
    const remaining = leadsNeeded - unassignedLeads.length;
    const converted = await batchConvertToLeads(remaining);
    leadsGenerated += converted;

    if (converted >= remaining) {
      repsFed++;
      continue;
    }

    // Strategy 3: Enrich qualified businesses
    const enriched = await enrichQualifiedBusinesses(remaining);

    // Strategy 4: Create a new scrape job for the rep's area
    if (rep.serviceArea) {
      try {
        const jobId = await createScrapeJob({
          targetArea: rep.serviceArea,
          forRepId: rep.repId,
        });
        scrapeJobsCreated++;

        // Run the scrape job immediately (async, don't await)
        runScrapeJob(jobId).catch(err =>
          console.error(`[Router] Scrape job ${jobId} failed:`, err)
        );
      } catch (err) {
        console.error(`[Router] Failed to create scrape job for rep ${rep.repId}:`, err);
      }
    }

    repsFed++;
  }

  return {
    repsChecked: capacity.length,
    repsFed,
    leadsGenerated,
    scrapeJobsCreated,
  };
}

/**
 * Auto-start outreach for leads that are enriched but not yet in a sequence
 */
export async function autoStartOutreach(): Promise<number> {
  const db = (await getDb())!;

  // Find enriched leads that don't have any outreach sequences yet
  const leadsWithoutOutreach = await db.execute(sql`
    SELECT l.id FROM leads l
    LEFT JOIN outreach_sequences os ON os.leadId = l.id
    WHERE l.stage IN ('enriched', 'warming')
    AND l.assignedRepId IS NULL
    AND os.id IS NULL
    AND l.selfSourced = false
    LIMIT 20
  `) as any;

  let started = 0;
  const rows = leadsWithoutOutreach[0] || leadsWithoutOutreach;
  if (Array.isArray(rows)) {
    for (const row of rows) {
      try {
        await scheduleOutreachSequence(row.id);
        started++;
      } catch (err) {
        console.error(`[Router] Failed to start outreach for lead ${row.id}:`, err);
      }
    }
  }

  return started;
}

/**
 * Get engine stats for the admin dashboard
 */
export async function getEngineStats(): Promise<{
  totalScraped: number;
  totalQualified: number;
  totalEnriched: number;
  totalConverted: number;
  totalLeadsGenerated: number;
  activeOutreachSequences: number;
  leadsInPipeline: number;
  leadsClosedWon: number;
  leadsClosedLost: number;
  repsActive: number;
  repsNeedingLeads: number;
  scrapeJobsRunning: number;
}> {
  const db = (await getDb())!;

  const [scrapedCount] = await db.select({ count: sql<number>`count(*)` }).from(scrapedBusinesses);
  const [qualifiedCount] = await db.select({ count: sql<number>`count(*)` }).from(scrapedBusinesses).where(eq(scrapedBusinesses.qualified, true));
  const [enrichedCount] = await db.select({ count: sql<number>`count(*)` }).from(scrapedBusinesses).where(eq(scrapedBusinesses.status, "enriched"));
  const [convertedCount] = await db.select({ count: sql<number>`count(*)` }).from(scrapedBusinesses).where(eq(scrapedBusinesses.status, "converted"));

  const [aiLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.source, "ai_sourced"));
  const [activeSeq] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.stage, "warming"));
  const [pipeline] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(
    sql`${leads.stage} NOT IN ('new', 'closed_won', 'closed_lost')`
  );
  const [closedWon] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.stage, "closed_won"));
  const [closedLost] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.stage, "closed_lost"));

  const [activeReps] = await db.select({ count: sql<number>`count(*)` }).from(reps).where(eq(reps.status, "active"));
  const [runningJobs] = await db.select({ count: sql<number>`count(*)` }).from(scrapeJobs).where(eq(scrapeJobs.status, "running"));

  const capacity = await getRepCapacity();
  const repsNeedingLeads = capacity.filter(r => r.needsMoreLeads).length;

  return {
    totalScraped: Number(scrapedCount.count),
    totalQualified: Number(qualifiedCount.count),
    totalEnriched: Number(enrichedCount.count),
    totalConverted: Number(convertedCount.count),
    totalLeadsGenerated: Number(aiLeads.count),
    activeOutreachSequences: Number(activeSeq.count),
    leadsInPipeline: Number(pipeline.count),
    leadsClosedWon: Number(closedWon.count),
    leadsClosedLost: Number(closedLost.count),
    repsActive: Number(activeReps.count),
    repsNeedingLeads,
    scrapeJobsRunning: Number(runningJobs.count),
  };
}
