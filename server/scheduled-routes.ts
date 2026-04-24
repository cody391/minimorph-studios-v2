/**
 * Scheduled API Endpoints — Production-safe replacements for setInterval jobs
 *
 * Each endpoint calls the same business logic the old scheduler used,
 * but is triggered externally (Manus scheduled tasks / cron) instead of setInterval.
 *
 * Auth: x-scheduler-secret header must match SCHEDULER_SECRET env var.
 * Lock: lightweight in-memory guard prevents overlapping execution of the same job.
 */

import { Request, Response, Express } from "express";
import { sendDueOutreach } from "./services/leadGenOutreach";
import { scoreUnscrapedWebsites } from "./services/leadGenScraper";
import { enrichQualifiedBusinesses, batchConvertToLeads } from "./services/leadGenEnrichment";
import { rescoreAllLeads } from "./services/leadGenScoring";
import { runReengagementCampaign } from "./services/leadGenSmartOutreach";
import { autoFeedReps } from "./services/leadGenRouter";
import { scanForEnterpriseLeads } from "./services/leadGenEnterprise";
import { runMultiSourceScrape, getSourceQuality } from "./services/leadGenMultiSource";
import { batchEnrichContacts } from "./services/contactEnrichment";
import { runAdaptiveScaling } from "./services/leadGenAdaptive";

// ─── In-memory execution lock ───
const runningJobs = new Set<string>();

function withLock(jobName: string, fn: () => Promise<any>): Promise<any> {
  if (runningJobs.has(jobName)) {
    return Promise.reject(new Error(`Job "${jobName}" is already running`));
  }
  runningJobs.add(jobName);
  return fn().finally(() => runningJobs.delete(jobName));
}

// ─── Auth middleware ───
function verifySchedulerSecret(req: Request, res: Response): boolean {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret) {
    console.error("[Scheduled] SCHEDULER_SECRET env var is not set");
    res.status(500).json({ ok: false, error: "SCHEDULER_SECRET not configured" });
    return false;
  }
  const provided = req.headers["x-scheduler-secret"];
  if (provided !== secret) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return false;
  }
  return true;
}

// ─── Generic job runner ───
async function runJob(
  req: Request,
  res: Response,
  jobName: string,
  executor: () => Promise<any>
) {
  if (!verifySchedulerSecret(req, res)) return;

  const startedAt = new Date().toISOString();
  console.log(`[Scheduled] Starting job: ${jobName}`);

  try {
    const result = await withLock(jobName, executor);
    const finishedAt = new Date().toISOString();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

    console.log(`[Scheduled] Job "${jobName}" completed in ${durationMs}ms`);
    res.json({
      ok: true,
      job: jobName,
      startedAt,
      finishedAt,
      durationMs,
      result,
    });
  } catch (err: any) {
    const finishedAt = new Date().toISOString();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const isLockError = err.message?.includes("already running");

    console.error(`[Scheduled] Job "${jobName}" failed:`, err.message);
    res.status(isLockError ? 409 : 500).json({
      ok: false,
      job: jobName,
      startedAt,
      finishedAt,
      durationMs,
      error: err.message || "Unknown error",
    });
  }
}

// ─── Register all scheduled endpoints ───
export function registerScheduledRoutes(app: Express) {
  // 1. Outreach — send due outreach messages
  app.post("/api/scheduled/outreach", (req, res) =>
    runJob(req, res, "outreach", async () => {
      const sent = await sendDueOutreach();
      return { sent };
    })
  );

  // 2. Scoring — score unscored websites
  app.post("/api/scheduled/scoring", (req, res) =>
    runJob(req, res, "scoring", async () => {
      const scored = await scoreUnscrapedWebsites(20);
      return { scored };
    })
  );

  // 3. Enrichment — enrich qualified businesses + ML rescore
  app.post("/api/scheduled/enrichment", (req, res) =>
    runJob(req, res, "enrichment", async () => {
      const enriched = await enrichQualifiedBusinesses(10);
      const rescored = await rescoreAllLeads();
      return { enriched, rescored };
    })
  );

  // 4. Lead conversion — convert enriched businesses to leads
  app.post("/api/scheduled/lead-conversion", (req, res) =>
    runJob(req, res, "lead-conversion", async () => {
      const converted = await batchConvertToLeads(20);
      return { converted };
    })
  );

  // 5. Re-engagement — run re-engagement campaigns for cold leads
  app.post("/api/scheduled/reengagement", (req, res) =>
    runJob(req, res, "reengagement", async () => {
      const reengaged = await runReengagementCampaign();
      return { reengaged };
    })
  );

  // 6. Auto-feed — feed reps who need more leads (performance-based)
  app.post("/api/scheduled/auto-feed", (req, res) =>
    runJob(req, res, "auto-feed", async () => {
      const result = await autoFeedReps();
      return result; // { repsChecked, repsFed, leadsGenerated, scrapeJobsCreated }
    })
  );

  // 7. Enterprise scan — scan for enterprise prospects
  app.post("/api/scheduled/enterprise-scan", (req, res) =>
    runJob(req, res, "enterprise-scan", async () => {
      const found = await scanForEnterpriseLeads(10);
      return { found };
    })
  );

  // 8. Multi-source scrape — scrape from best-performing sources
  app.post("/api/scheduled/multi-source", (req, res) =>
    runJob(req, res, "multi-source", async () => {
      const quality = getSourceQuality();
      const bestSources = quality
        .filter((s) => s.conversionRate > 0)
        .map((s) => s.source as any);

      const sources =
        bestSources.length > 0
          ? bestSources
          : (["google_maps", "yelp", "facebook", "bbb"] as any[]);

      const result = await runMultiSourceScrape({
        location: "United States",
        sources,
        priorityLevel: "high",
        maxPerSource: 30,
      });

      return { total: result.total, new: result.new, duplicates: result.duplicates, bySource: result.bySource, errors: result.errors };
    })
  );

  // 9. Contact enrichment — enrich contacts via Apollo/Hunter
  app.post("/api/scheduled/contact-enrichment", (req, res) =>
    runJob(req, res, "contact-enrichment", async () => {
      const result = await batchEnrichContacts(15);
      return result; // { total, enriched, partial, failed }
    })
  );

  // 10. Adaptive scaling — adjust lead gen capacity based on rep needs
  app.post("/api/scheduled/adaptive-scaling", (req, res) =>
    runJob(req, res, "adaptive-scaling", async () => {
      const result = await runAdaptiveScaling();
      return {
        repsAnalyzed: result.repsAnalyzed,
        repsNeedingLeads: result.repsNeedingLeads,
        actionsExecuted: result.actionsExecuted,
        newScrapeJobsCreated: result.newScrapeJobsCreated,
      };
    })
  );

  // Health check — returns status of all jobs
  app.get("/api/scheduled/status", (req, res) => {
    if (!verifySchedulerSecret(req, res)) return;
    res.json({
      ok: true,
      runningJobs: Array.from(runningJobs),
      timestamp: new Date().toISOString(),
    });
  });

  console.log("[Scheduled] Registered 10 scheduled job endpoints at /api/scheduled/*");
}
