/**
 * Lead Gen Engine Scheduler — Production Grade
 * 
 * Runs background jobs on intervals to keep the lead gen engine operating autonomously:
 * - Every 15 min: Send due outreach messages
 * - Every 30 min: Score unscored websites
 * - Every 1 hour: Enrich qualified businesses + ML rescore
 * - Every 2 hours: Convert enriched businesses to leads
 * - Every 3 hours: Run re-engagement campaigns for cold leads
 * - Every 4 hours: Auto-feed reps who need more leads (performance-based routing)
 * - Every 6 hours: Scan for enterprise prospects
 * - Every 8 hours: Multi-source scrape for new businesses
 * - Every 12 hours: Retrain ML scoring model from conversion data
 */

import { scoreUnscrapedWebsites } from "./leadGenScraper";
import { enrichQualifiedBusinesses, batchConvertToLeads } from "./leadGenEnrichment";
import { sendDueOutreach } from "./leadGenOutreach";
import { autoFeedReps } from "./leadGenRouter";
import { scanForEnterpriseLeads } from "./leadGenEnterprise";
import { rescoreAllLeads } from "./leadGenScoring";
import { runReengagementCampaign } from "./leadGenSmartOutreach";
import { runMultiSourceScrape, getSourceQuality } from "./leadGenMultiSource";

let schedulerRunning = false;
let intervals: NodeJS.Timeout[] = [];

// Track last run times and results for monitoring
const jobStats: Record<string, { lastRun: Date | null; lastResult: string; runCount: number; errorCount: number }> = {};

function recordJobRun(jobName: string, result: string, isError = false) {
  if (!jobStats[jobName]) {
    jobStats[jobName] = { lastRun: null, lastResult: "", runCount: 0, errorCount: 0 };
  }
  jobStats[jobName].lastRun = new Date();
  jobStats[jobName].lastResult = result;
  jobStats[jobName].runCount++;
  if (isError) jobStats[jobName].errorCount++;
}

export function getSchedulerStats() {
  return {
    running: schedulerRunning,
    jobs: { ...jobStats },
    sourceQuality: getSourceQuality(),
  };
}

export function startLeadGenScheduler() {
  if (schedulerRunning) {
    console.log("[LeadGen Scheduler] Already running, skipping start");
    return;
  }
  schedulerRunning = true;
  console.log("[LeadGen Scheduler] Starting autonomous lead generation engine...");

  // ─── Send due outreach every 15 minutes ───
  intervals.push(
    setInterval(async () => {
      try {
        const sent = await sendDueOutreach();
        if (sent > 0) {
          console.log(`[LeadGen Scheduler] Sent ${sent} outreach messages`);
        }
        recordJobRun("outreach", `Sent ${sent} messages`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Outreach error:", err);
        recordJobRun("outreach", (err as Error).message, true);
      }
    }, 15 * 60 * 1000)
  );

  // ─── Score websites every 30 minutes ───
  intervals.push(
    setInterval(async () => {
      try {
        const scored = await scoreUnscrapedWebsites(20);
        console.log(`[LeadGen Scheduler] Scored ${scored} websites`);
        recordJobRun("scoring", `Scored ${scored} websites`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Website scoring error:", err);
        recordJobRun("scoring", (err as Error).message, true);
      }
    }, 30 * 60 * 1000)
  );

  // ─── Enrich businesses + ML rescore every 1 hour ───
  intervals.push(
    setInterval(async () => {
      try {
        const enriched = await enrichQualifiedBusinesses(10);
        console.log(`[LeadGen Scheduler] Enriched ${enriched} businesses`);
        recordJobRun("enrichment", `Enriched ${enriched} businesses`);

        // Also rescore leads with ML model
        const rescored = await rescoreAllLeads();
        console.log(`[LeadGen Scheduler] ML-rescored ${rescored} leads`);
        recordJobRun("ml_rescore", `Rescored ${rescored} leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Enrichment/rescore error:", err);
        recordJobRun("enrichment", (err as Error).message, true);
      }
    }, 60 * 60 * 1000)
  );

  // ─── Convert enriched businesses to leads every 2 hours ───
  intervals.push(
    setInterval(async () => {
      try {
        const converted = await batchConvertToLeads(20);
        console.log(`[LeadGen Scheduler] Converted ${converted} businesses to leads`);
        recordJobRun("conversion", `Converted ${converted} to leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Conversion error:", err);
        recordJobRun("conversion", (err as Error).message, true);
      }
    }, 2 * 60 * 60 * 1000)
  );

  // ─── Re-engagement campaigns every 3 hours ───
  intervals.push(
    setInterval(async () => {
      try {
        const reengaged = await runReengagementCampaign();
        console.log(`[LeadGen Scheduler] Re-engaged ${reengaged} cold leads`);
        recordJobRun("reengagement", `Re-engaged ${reengaged} leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Re-engagement error:", err);
        recordJobRun("reengagement", (err as Error).message, true);
      }
    }, 3 * 60 * 60 * 1000)
  );

  // ─── Auto-feed reps every 4 hours (performance-based) ───
  intervals.push(
    setInterval(async () => {
      try {
        const result = await autoFeedReps();
        console.log(`[LeadGen Scheduler] Fed ${result.repsFed} reps with ${result.leadsGenerated} leads`);
        recordJobRun("auto_feed", `Fed ${result.repsFed} reps, ${result.leadsGenerated} leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Auto-feed error:", err);
        recordJobRun("auto_feed", (err as Error).message, true);
      }
    }, 4 * 60 * 60 * 1000)
  );

  // ─── Enterprise scan every 6 hours ───
  intervals.push(
    setInterval(async () => {
      try {
        const found = await scanForEnterpriseLeads(10);
        console.log(`[LeadGen Scheduler] Found ${found} enterprise prospects`);
        recordJobRun("enterprise_scan", `Found ${found} prospects`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Enterprise scan error:", err);
        recordJobRun("enterprise_scan", (err as Error).message, true);
      }
    }, 6 * 60 * 60 * 1000)
  );

  // ─── Multi-source scrape every 8 hours ───
  // Uses the best-performing sources based on conversion data
  intervals.push(
    setInterval(async () => {
      try {
        // Get source quality to prioritize best sources
        const quality = getSourceQuality();
        const bestSources = quality
          .filter(s => s.conversionRate > 0)
          .map(s => s.source as any);

        // Default to all sources if no conversion data yet
        const sources = bestSources.length > 0
          ? bestSources
          : ["google_maps", "yelp", "facebook", "bbb"] as any[];

        // Scrape areas where we have active reps (placeholder — uses general areas)
        const result = await runMultiSourceScrape({
          location: "United States", // Will be replaced by rep service areas
          sources,
          priorityLevel: "high",
          maxPerSource: 30,
        });

        console.log(`[LeadGen Scheduler] Multi-source scrape: ${result.total} found, ${result.new} new, ${result.duplicates} dupes`);
        recordJobRun("multi_source_scrape", `${result.new} new from ${result.total} total`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Multi-source scrape error:", err);
        recordJobRun("multi_source_scrape", (err as Error).message, true);
      }
    }, 8 * 60 * 60 * 1000)
  );

  console.log("[LeadGen Scheduler] All jobs scheduled:");
  console.log("  - Outreach sending: every 15 min");
  console.log("  - Website scoring: every 30 min");
  console.log("  - Enrichment + ML rescore: every 1 hour");
  console.log("  - Lead conversion: every 2 hours");
  console.log("  - Re-engagement campaigns: every 3 hours");
  console.log("  - Rep auto-feed (performance-based): every 4 hours");
  console.log("  - Enterprise scan: every 6 hours");
  console.log("  - Multi-source scrape: every 8 hours");
}

export function stopLeadGenScheduler() {
  console.log("[LeadGen Scheduler] Stopping...");
  intervals.forEach(clearInterval);
  intervals = [];
  schedulerRunning = false;
}

export function isSchedulerRunning() {
  return schedulerRunning;
}
