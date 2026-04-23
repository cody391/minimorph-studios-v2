/**
 * Lead Gen Engine Scheduler
 * 
 * Runs background jobs on intervals to keep the lead gen engine operating autonomously:
 * - Every 30 min: Score unscored websites
 * - Every 1 hour: Enrich qualified businesses
 * - Every 2 hours: Convert enriched businesses to leads
 * - Every 15 min: Send due outreach messages
 * - Every 4 hours: Auto-feed reps who need more leads
 * - Every 6 hours: Scan for enterprise prospects
 */

import { scoreUnscrapedWebsites } from "./leadGenScraper";
import { enrichQualifiedBusinesses, batchConvertToLeads } from "./leadGenEnrichment";
import { sendDueOutreach } from "./leadGenOutreach";
import { autoFeedReps } from "./leadGenRouter";
import { scanForEnterpriseLeads } from "./leadGenEnterprise";

let schedulerRunning = false;
let intervals: NodeJS.Timeout[] = [];

export function startLeadGenScheduler() {
  if (schedulerRunning) {
    console.log("[LeadGen Scheduler] Already running, skipping start");
    return;
  }
  schedulerRunning = true;
  console.log("[LeadGen Scheduler] Starting autonomous lead generation engine...");

  // Score websites every 30 minutes
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Running website scoring...");
        const scored = await scoreUnscrapedWebsites(20);
        console.log(`[LeadGen Scheduler] Scored ${scored} websites`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Website scoring error:", err);
      }
    }, 30 * 60 * 1000) // 30 min
  );

  // Enrich businesses every 1 hour
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Running business enrichment...");
        const enriched = await enrichQualifiedBusinesses(10);
        console.log(`[LeadGen Scheduler] Enriched ${enriched} businesses`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Enrichment error:", err);
      }
    }, 60 * 60 * 1000) // 1 hour
  );

  // Convert enriched businesses to leads every 2 hours
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Converting businesses to leads...");
        const converted = await batchConvertToLeads(20);
        console.log(`[LeadGen Scheduler] Converted ${converted} businesses to leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Conversion error:", err);
      }
    }, 2 * 60 * 60 * 1000) // 2 hours
  );

  // Send due outreach every 15 minutes
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Sending due outreach...");
        const sent = await sendDueOutreach();
        if (sent > 0) {
          console.log(`[LeadGen Scheduler] Sent ${sent} outreach messages`);
        }
      } catch (err) {
        console.error("[LeadGen Scheduler] Outreach error:", err);
      }
    }, 15 * 60 * 1000) // 15 min
  );

  // Auto-feed reps every 4 hours
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Auto-feeding reps...");
        const result = await autoFeedReps();
        console.log(`[LeadGen Scheduler] Fed ${result.repsFed} reps with ${result.leadsGenerated} leads`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Auto-feed error:", err);
      }
    }, 4 * 60 * 60 * 1000) // 4 hours
  );

  // Scan for enterprise prospects every 6 hours
  intervals.push(
    setInterval(async () => {
      try {
        console.log("[LeadGen Scheduler] Scanning for enterprise prospects...");
        const found = await scanForEnterpriseLeads(10);
        console.log(`[LeadGen Scheduler] Found ${found} enterprise prospects`);
      } catch (err) {
        console.error("[LeadGen Scheduler] Enterprise scan error:", err);
      }
    }, 6 * 60 * 60 * 1000) // 6 hours
  );

  console.log("[LeadGen Scheduler] All jobs scheduled:");
  console.log("  - Website scoring: every 30 min");
  console.log("  - Business enrichment: every 1 hour");
  console.log("  - Lead conversion: every 2 hours");
  console.log("  - Outreach sending: every 15 min");
  console.log("  - Rep auto-feed: every 4 hours");
  console.log("  - Enterprise scan: every 6 hours");
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
