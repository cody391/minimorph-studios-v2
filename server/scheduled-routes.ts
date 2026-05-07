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
import { getDb } from "./db";
import { contracts, customers, npsSurveys, nurtureLogs, onboardingProjects, monthlyReports } from "../drizzle/schema";
import { eq, and, lte, inArray, desc } from "drizzle-orm";
import { sendNpsSurveyEmail, sendMonthlyReportEmail } from "./services/customerEmails";
import { getCloudflareAnalytics } from "./services/analytics";
import { scrapeWebsite } from "./services/webScraper";
import { invokeLLM } from "./_core/llm";
import { generateInvoiceHtml, invoiceToBase64 } from "./services/invoiceGenerator";
import { ENV } from "./_core/env";

// ─── System setting helpers (Part 7: engine pause) ───
async function getSystemSetting(key: string, defaultVal = "true"): Promise<string> {
  try {
    const database = await getDb();
    if (!database) return defaultVal;
    const { systemSettings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await database.select({ settingValue: systemSettings.settingValue })
      .from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
    return rows[0]?.settingValue ?? defaultVal;
  } catch {
    return defaultVal;
  }
}

async function isEngineActive(): Promise<boolean> {
  return (await getSystemSetting("lead_engine_active")) === "true";
}

async function isJobActive(jobKey: string): Promise<boolean> {
  if (!(await isEngineActive())) return false;
  return (await getSystemSetting(jobKey)) === "true";
}

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
      if (!(await isJobActive("job_outreach_active"))) return { skipped: true, reason: "paused" };
      const sent = await sendDueOutreach();
      return { sent };
    })
  );

  // 2. Scoring — score unscored websites
  app.post("/api/scheduled/scoring", (req, res) =>
    runJob(req, res, "scoring", async () => {
      if (!(await isJobActive("job_scorer_active"))) return { skipped: true, reason: "paused" };
      const scored = await scoreUnscrapedWebsites(20);
      return { scored };
    })
  );

  // 3. Enrichment — enrich qualified businesses + ML rescore
  app.post("/api/scheduled/enrichment", (req, res) =>
    runJob(req, res, "enrichment", async () => {
      if (!(await isJobActive("job_enrichment_active"))) return { skipped: true, reason: "paused" };
      const enriched = await enrichQualifiedBusinesses(10);
      const rescored = await rescoreAllLeads();
      return { enriched, rescored };
    })
  );

  // 4. Lead conversion — convert enriched businesses to leads
  app.post("/api/scheduled/lead-conversion", (req, res) =>
    runJob(req, res, "lead-conversion", async () => {
      if (!(await isJobActive("job_scraper_active"))) return { skipped: true, reason: "paused" };
      const converted = await batchConvertToLeads(20);
      return { converted };
    })
  );

  // 5. Re-engagement — run re-engagement campaigns for cold leads
  app.post("/api/scheduled/reengagement", (req, res) =>
    runJob(req, res, "reengagement", async () => {
      if (!(await isJobActive("job_reengagement_active"))) return { skipped: true, reason: "paused" };
      const reengaged = await runReengagementCampaign();
      return { reengaged };
    })
  );

  // 6. Auto-feed — feed reps who need more leads (performance-based)
  app.post("/api/scheduled/auto-feed", (req, res) =>
    runJob(req, res, "auto-feed", async () => {
      if (!(await isJobActive("job_auto_feed_active"))) return { skipped: true, reason: "paused" };
      const result = await autoFeedReps();
      return result; // { repsChecked, repsFed, leadsGenerated, scrapeJobsCreated }
    })
  );

  // 7. Enterprise scan — scan for enterprise prospects
  app.post("/api/scheduled/enterprise-scan", (req, res) =>
    runJob(req, res, "enterprise-scan", async () => {
      if (!(await isJobActive("job_scraper_active"))) return { skipped: true, reason: "paused" };
      const found = await scanForEnterpriseLeads(10);
      return { found };
    })
  );

  // 8. Multi-source scrape — scrape from best-performing sources
  app.post("/api/scheduled/multi-source", (req, res) =>
    runJob(req, res, "multi-source", async () => {
      if (!(await isJobActive("job_scraper_active"))) return { skipped: true, reason: "paused" };
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
      if (!(await isJobActive("job_enrichment_active"))) return { skipped: true, reason: "paused" };
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

  // 11. NPS Surveys — create and send NPS surveys for eligible customers
  app.post("/api/scheduled/nps-surveys", (req, res) =>
    runJob(req, res, "nps-surveys", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      // Get all active contracts
      const activeContracts = await db
        .select()
        .from(contracts)
        .where(eq(contracts.status, "active"));

      let scanned = 0;
      let created = 0;
      let emailsSent = 0;
      let skipped = 0;
      let errors = 0;

      for (const contract of activeContracts) {
        scanned++;

        // Determine which milestones this contract is eligible for
        const milestones: Array<"30_day" | "6_month"> = [];
        if (contract.startDate <= thirtyDaysAgo) milestones.push("30_day");
        if (contract.startDate <= sixMonthsAgo) milestones.push("6_month");

        if (milestones.length === 0) {
          skipped++;
          continue;
        }

        // Check which milestones already have surveys
        const existingSurveys = await db
          .select({ milestone: npsSurveys.milestone })
          .from(npsSurveys)
          .where(
            and(
              eq(npsSurveys.customerId, contract.customerId),
              eq(npsSurveys.contractId!, contract.id),
              inArray(npsSurveys.milestone, milestones)
            )
          );

        const existingMilestones = new Set(existingSurveys.map((s) => s.milestone));

        // Get customer info for email
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, contract.customerId))
          .limit(1);

        if (!customer) {
          skipped++;
          continue;
        }

        for (const milestone of milestones) {
          if (existingMilestones.has(milestone)) {
            skipped++;
            continue;
          }

          try {
            // Create NPS survey record
            await db.insert(npsSurveys).values({
              customerId: contract.customerId,
              contractId: contract.id,
              milestone,
              status: "sent",
              sentAt: now,
            });
            created++;

            // Send email
            const surveyUrl = `${ENV.appUrl}/portal?tab=support`;
            await sendNpsSurveyEmail({
              to: customer.email,
              customerName: customer.contactName,
              surveyUrl,
              milestone,
            });
            emailsSent++;
          } catch (err: any) {
            console.error(`[NPS] Error for customer ${contract.customerId}, milestone ${milestone}:`, err.message);
            errors++;
          }
        }
      }

      return { scanned, created, emailsSent, skipped, errors };
    })
  );


  // ─── 13. Health Score Update ───
  app.post(
    "/api/scheduled/health-score-update",
    async (req: Request, res: Response) =>
      runJob(req, res, "health-score-update", async () => {
        const db = (await getDb())!;
        const now = new Date();
        const allCustomers = await db.select().from(customers);
        let updated = 0;
        let errors = 0;

        for (const cust of allCustomers) {
          try {
            let score = 100;

            // 1. Contract health (-30 if expired/cancelled, -15 if expiring soon)
            const custContracts = await db.select().from(contracts)
              .where(eq(contracts.customerId, cust.id));
            const activeContract = custContracts.find(c => c.status === "active" || c.status === "renewed");
            const expiringSoon = custContracts.find(c => c.status === "expiring_soon");
            const expired = custContracts.find(c => c.status === "expired" || c.status === "cancelled");
            if (!activeContract && expired) score -= 30;
            else if (expiringSoon) score -= 15;

            // 2. NPS health (-20 if latest NPS <= 6, -10 if 7-8)
            const npsResults = await db.select().from(npsSurveys)
              .where(and(eq(npsSurveys.customerId, cust.id), eq(npsSurveys.status, "completed")))
              .orderBy(desc(npsSurveys.completedAt))
              .limit(1);
            if (npsResults.length > 0 && npsResults[0].score !== null) {
              if (npsResults[0].score <= 6) score -= 20;
              else if (npsResults[0].score <= 8) score -= 10;
            }

            // 3. Onboarding health (-15 if stuck in early stage for > 14 days)
            const projects = await db.select().from(onboardingProjects)
              .where(eq(onboardingProjects.customerId, cust.id))
              .limit(1);
            if (projects.length > 0) {
              const proj = projects[0];
              const stuckStages = ["intake", "questionnaire", "assets_upload"];
              if (stuckStages.includes(proj.stage)) {
                const daysSinceCreated = (now.getTime() - new Date(proj.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceCreated > 14) score -= 15;
              }
            }

            // 4. Support activity (-10 if unresolved support request in last 30 days)
            const recentLogs = await db.select().from(nurtureLogs)
              .where(and(
                eq(nurtureLogs.customerId, cust.id),
                eq(nurtureLogs.type, "support_request"),
              ))
              .orderBy(desc(nurtureLogs.createdAt))
              .limit(5);
            const unresolvedSupport = recentLogs.filter(l => l.status !== "resolved");
            if (unresolvedSupport.length > 0) score -= 10;

            // 5. Engagement bonus (+5 if responded to NPS, +5 if referral made)
            // (already factored NPS above; keep score non-negative)

            score = Math.max(0, Math.min(100, score));

            // Derive status from score
            let newStatus: "active" | "at_risk" | "churned" = "active";
            if (score <= 30) newStatus = "churned";
            else if (score <= 60) newStatus = "at_risk";

            // Only update if changed
            if (cust.healthScore !== score || cust.status !== newStatus) {
              await db.update(customers).set({
                healthScore: score,
                status: newStatus,
              }).where(eq(customers.id, cust.id));
              updated++;
            }
          } catch (err: any) {
            console.error(`[HealthScore] Error for customer ${cust.id}:`, err.message);
            errors++;
          }
        }

        return { totalCustomers: allCustomers.length, updated, errors };
      })
  );


  // ─── Pending Payment Expiration Check ───
  app.post("/api/scheduled/pending-payment-check", async (req, res) => {
    await runJob(req, res, "pending-payment-check", async () => {
      const db = await getDb();
      if (!db) return { scanned: 0, expiredFound: 0, remindersSent: 0, errors: [] };

      // Find contracts with status pending_payment older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleContracts = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.status, "pending_payment"),
            lte(contracts.createdAt, twentyFourHoursAgo)
          )
        );

      let expiredFound = 0;
      let remindersSent = 0;
      const errors: string[] = [];

      for (const contract of staleContracts) {
        expiredFound++;
        try {
          // Get customer info for reminder email
          const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, contract.customerId))
            .limit(1);

          if (!customer) {
            errors.push(`Contract #${contract.id}: customer not found`);
            continue;
          }

          // Log a nurture entry as admin alert
          await db.insert(nurtureLogs).values({
            customerId: customer.id,
            contractId: contract.id,
            type: "support_request",
            channel: "in_app",
            subject: "Payment link may be expired",
            content: `Contract #${contract.id} (${contract.packageTier}) has been in pending_payment status for over 24 hours. The original Stripe checkout link may have expired. Consider resending a payment link.`,
            status: "sent",
            scheduledAt: new Date(),
            sentAt: new Date(),
          });

          // Send reminder email to customer if email helper supports it
          try {
            const { sendPaymentLinkReminderEmail } = await import("./services/customerEmails");
            if (sendPaymentLinkReminderEmail) {
              await sendPaymentLinkReminderEmail({
                to: customer.email,
                customerName: customer.contactName,
                businessName: customer.businessName,
                packageTier: contract.packageTier as any,
              });
              remindersSent++;
            }
          } catch (emailErr: any) {
            // If reminder email function doesn't exist yet, just log it
            if (!emailErr.message?.includes("is not a function")) {
              errors.push(`Contract #${contract.id}: email error - ${emailErr.message}`);
            }
          }

          // Notify owner/admin
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: "Stale Pending Payment",
            content: `Contract #${contract.id} for ${customer.businessName} (${contract.packageTier}) has been awaiting payment for over 24 hours. The checkout link may have expired.`,
          });
        } catch (err: any) {
          errors.push(`Contract #${contract.id}: ${err.message}`);
        }
      }

      return {
        scanned: staleContracts.length,
        expiredFound,
        remindersSent,
        errors,
      };
    });
  });


  // ─── 16. Monthly Anniversary Report — one email per customer per month ───
  app.post("/api/scheduled/monthly-anniversary", (req, res) =>
    runJob(req, res, "monthly-anniversary", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = new Date();
      const todayDay = now.getDate();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Find active contracts in the nurturing pipeline
      const activeContracts = await db
        .select()
        .from(contracts)
        .where(
          and(
            inArray(contracts.status, ["active", "expiring_soon", "renewed"]),
            eq(contracts.nurturingActive, true)
          )
        );

      let processed = 0;
      let skipped = 0;
      let errors = 0;

      for (const contract of activeContracts) {
        // Anniversary check: use anniversaryDay field if set, else fall back to startDate day
        const contractAnnivDay = contract.anniversaryDay ?? new Date(contract.startDate).getDate();
        if (contractAnnivDay !== todayDay) {
          skipped++;
          continue;
        }

        // Dedup: only one report email per customer per month
        const existing = await db
          .select({ id: monthlyReports.id })
          .from(monthlyReports)
          .where(
            and(
              eq(monthlyReports.customerId, contract.customerId),
              eq(monthlyReports.reportMonth, thisMonth)
            )
          )
          .limit(1);

        if (existing.length > 0) { skipped++; continue; }

        // Get customer
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, contract.customerId))
          .limit(1);

        if (!customer) { skipped++; continue; }

        // Get associated onboarding project (most recent)
        const [project] = await db
          .select()
          .from(onboardingProjects)
          .where(eq(onboardingProjects.customerId, contract.customerId))
          .orderBy(desc(onboardingProjects.createdAt))
          .limit(1);

        // Determine if renewal month (endDate within 31 days)
        const thirtyOneDaysFromNow = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
        const isRenewalMonth = contract.endDate <= thirtyOneDaysFromNow;

        // Month label for subject: "May 2026"
        const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

        try {
          // Fetch real analytics for the past month
          const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
          const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
          const analytics = await getCloudflareAnalytics(monthStart, monthEnd).catch(() => ({ pageviews: 0, visitors: 0, bounceRate: 0 }));

          // Generate competitive analysis
          let reportText = "";
          if (project) {
            const questionnaire = project.questionnaire as any;
            const competitorUrls: string[] = [];
            if (questionnaire?.competitorSites) {
              for (const comp of questionnaire.competitorSites) {
                if (comp.url) competitorUrls.push(comp.url);
              }
            }

            let competitorContent = "";
            if (competitorUrls.length > 0) {
              const scraped = await Promise.all(
                competitorUrls.slice(0, 3).map(async (url) => {
                  const text = await scrapeWebsite(url);
                  return text ? `[${url}]\n${text.slice(0, 1500)}` : null;
                })
              );
              const results = scraped.filter(Boolean) as string[];
              if (results.length > 0) competitorContent = results.join("\n\n---\n\n");
            }

            const analysisPrompt = `You are a digital marketing analyst for MiniMorph Studios. Generate a monthly competitive intelligence report for ${project.businessName} (${customer.industry || "local business"}).

${competitorContent ? `COMPETITOR WEBSITE DATA:\n${competitorContent}\n\n` : ""}

Generate a concise competitive report with:
1. A brief market overview (2-3 sentences)
2. What competitors are doing well (2-3 points)
3. Gaps/weaknesses in competitor positioning (2-3 points)
4. Three specific actionable recommendations for ${project.businessName} to gain advantage this month

Keep it practical, specific, and action-oriented. Format with clear sections using ## headers. Total length: 300-400 words.`;

            const llmResult = await invokeLLM({
              messages: [{ role: "user" as const, content: analysisPrompt }],
              maxTokens: 1000,
            });
            reportText = llmResult.choices[0].message.content as string;

            // Save report to project
            await db
              .update(onboardingProjects)
              .set({ lastCompetitiveReport: reportText, lastCompetitiveReportDate: now })
              .where(eq(onboardingProjects.id, project.id));
          } else {
            reportText = `## Market Overview\nYour website continues to serve ${customer.businessName} in the local market.\n\n## Recommendations\n- Keep your content fresh and updated regularly.\n- Engage with customer reviews and testimonials.\n- Consider adding a seasonal promotion to your homepage.`;
          }

          // Generate invoice HTML attachment
          const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${contract.customerId}`;
          const invoiceDate = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          const monthlyPrice = parseFloat(contract.monthlyPrice).toFixed(2);
          const packageLabel = contract.packageTier.charAt(0).toUpperCase() + contract.packageTier.slice(1);

          const invoiceHtml = generateInvoiceHtml({
            invoiceNumber,
            invoiceDate,
            businessName: customer.businessName,
            contactName: customer.contactName,
            contactEmail: customer.email,
            packageTier: packageLabel,
            monthlyPrice,
            monthLabel,
          });
          const invoiceBase64 = invoiceToBase64(invoiceHtml);
          const safeBusinessName = customer.businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
          const invoiceFilename = `invoice-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${safeBusinessName}.html`;

          // Prepend real analytics to the competitive report
          const analyticsSection = analytics.pageviews > 0 || analytics.visitors > 0
            ? `## ${monthLabel} Traffic\n- **${analytics.pageviews.toLocaleString()}** total page views\n- **${analytics.visitors.toLocaleString()}** unique visitors\n\n`
            : "";
          const fullReport = analyticsSection + reportText;

          // Send the unified monthly report email
          await sendMonthlyReportEmail({
            to: customer.email,
            customerName: customer.contactName,
            businessName: customer.businessName,
            monthLabel,
            competitiveReport: fullReport,
            isRenewalMonth,
            renewalDate: isRenewalMonth ? contract.endDate : undefined,
            monthlyPrice,
            packageTier: packageLabel,
            invoiceHtmlBase64: invoiceBase64,
            invoiceFilename,
          });

          // Record in monthly_reports for dedup + history
          await db.insert(monthlyReports).values({
            customerId: contract.customerId,
            contractId: contract.id,
            reportMonth: thisMonth,
            competitiveReport: reportText,
            isRenewalMonth,
            emailSentAt: now,
          });

          processed++;
        } catch (err: any) {
          console.error(`[MonthlyAnniversary] Error for contract ${contract.id}:`, err.message);
          errors++;
        }
      }

      return { totalContracts: activeContracts.length, processed, skipped, errors };
    })
  );

  // ─── 17. Domain status polling — check pending domains every 6 hours ───────
  app.post("/api/scheduled/domain-status-check", (req, res) =>
    runJob(req, res, "domain-status-check", async () => {
      const { checkDomainStatus } = await import("./services/cloudflareDeployment");
      const { sendEmail } = await import("./services/email");
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const { onboardingProjects } = await import("../drizzle/schema");
      const { isNotNull, ne } = await import("drizzle-orm");

      // Find projects with a domain name that aren't yet confirmed live
      const pending = await database.select().from(onboardingProjects)
        .where(and(isNotNull(onboardingProjects.domainName), ne(onboardingProjects.stage, "complete")));

      let activated = 0;
      let stillPending = 0;

      for (const project of pending) {
        if (!project.domainName || !project.cloudflareProjectName) continue;
        try {
          const status = await checkDomainStatus({
            projectName: project.cloudflareProjectName,
            domain: project.domainName,
          });
          if (status.active) {
            await database.update(onboardingProjects).set({
              liveUrl: `https://${project.domainName}`,
              generatedSiteUrl: `https://${project.domainName}`,
            }).where(eq(onboardingProjects.id, project.id));
            // Notify customer
            if (project.contactEmail) {
              await sendEmail({
                to: project.contactEmail,
                subject: `Your domain ${project.domainName} is live!`,
                html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111122;color:#eaeaf0"><h2 style="color:#22c55e">${project.domainName} is live!</h2><p>Your domain is now fully connected and active. Visit your site at: <a href="https://${project.domainName}" style="color:#4a9eff">https://${project.domainName}</a></p><p style="color:#7a7a90">&mdash; The MiniMorph Studios Team</p></div>`,
              }).catch(() => {});
            }
            activated++;
          } else {
            stillPending++;
          }
        } catch {}
      }
      return { checked: pending.length, activated, stillPending };
    })
  );

  // ─── 18. Renewal Reminder Emails — send at 14 and 7 days before contract end ───
  app.post("/api/scheduled/renewal-reminders", (req, res) =>
    runJob(req, res, "renewal-reminders", async () => {
      const { sendRenewalReminderEmail } = await import("./services/customerEmails");
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const now = new Date();

      // Find all active contracts with contractEndDate set
      const activeContracts = await database
        .select()
        .from(contracts)
        .where(inArray(contracts.status, ["active", "expiring_soon", "renewed"]));

      let sent14 = 0;
      let sent7 = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const contract of activeContracts) {
        if (!contract.contractEndDate || !contract.customerId) { skipped++; continue; }
        const endDate = new Date(contract.contractEndDate);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const [customer] = await database.select().from(customers)
          .where(eq(customers.id, contract.customerId)).limit(1);
        if (!customer) { skipped++; continue; }

        try {
          // Use nurture logs as dedup — check if reminder was already sent this cycle
          const { nurtureLogs } = await import("../drizzle/schema");
          const reminderKey14 = `renewal_reminder_14_${contract.id}`;
          const reminderKey7 = `renewal_reminder_7_${contract.id}`;

          if (daysLeft <= 14 && daysLeft > 7) {
            const existing = await database.select({ id: nurtureLogs.id }).from(nurtureLogs)
              .where(and(eq(nurtureLogs.contractId, contract.id), eq(nurtureLogs.subject, reminderKey14))).limit(1);
            if (!existing.length) {
              await sendRenewalReminderEmail({
                to: customer.email,
                customerName: customer.contactName,
                daysRemaining: daysLeft,
                packageTier: (contract.packageTier || "starter") as any,
                endDate,
              });
              await database.insert(nurtureLogs).values({
                customerId: contract.customerId,
                contractId: contract.id,
                type: "renewal_outreach",
                channel: "email",
                subject: reminderKey14,
                content: `Renewal reminder sent — ${daysLeft} days before contract end`,
                status: "sent",
                scheduledAt: now,
                sentAt: now,
              });
              sent14++;
            } else {
              skipped++;
            }
          } else if (daysLeft <= 7 && daysLeft > 0) {
            const existing = await database.select({ id: nurtureLogs.id }).from(nurtureLogs)
              .where(and(eq(nurtureLogs.contractId, contract.id), eq(nurtureLogs.subject, reminderKey7))).limit(1);
            if (!existing.length) {
              await sendRenewalReminderEmail({
                to: customer.email,
                customerName: customer.contactName,
                daysRemaining: daysLeft,
                packageTier: (contract.packageTier || "starter") as any,
                endDate,
              });
              await database.insert(nurtureLogs).values({
                customerId: contract.customerId,
                contractId: contract.id,
                type: "renewal_outreach",
                channel: "email",
                subject: reminderKey7,
                content: `Renewal reminder sent — ${daysLeft} days before contract end`,
                status: "sent",
                scheduledAt: now,
                sentAt: now,
              });
              sent7++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
        } catch (err: any) {
          errors.push(`Contract #${contract.id}: ${err.message}`);
        }
      }

      return { scanned: activeContracts.length, sent14, sent7, skipped, errors };
    })
  );

  // ─── Fix #7: Commission Payouts ─────────────────────────────────────────────
  // Auto-pays approved commissions to reps via Stripe Connect.
  // Run daily. Only pays commissions with status "approved" and stripeConnectAccountId set.
  app.post("/api/scheduled/commission-payouts", (req, res) =>
    runJob(req, res, "commission-payouts", async () => {
      const database = await getDb();
      if (!database) return { error: "DB unavailable" };
      const { commissions: commissionsTable, reps: repsTable } = await import("../drizzle/schema");
      const { eq: eqFn } = await import("drizzle-orm");

      const approvedCommissions = await database.select({
        id: commissionsTable.id,
        repId: commissionsTable.repId,
        amount: commissionsTable.amount,
      })
        .from(commissionsTable)
        .where(eqFn(commissionsTable.status, "approved"))
        .limit(50);

      let paid = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const commission of approvedCommissions) {
        try {
          const repRows = await database.select().from(repsTable).where(eqFn(repsTable.id, commission.repId)).limit(1);
          const rep = repRows[0];
          if (!rep?.stripeConnectAccountId || !rep.stripeConnectOnboarded) {
            skipped++;
            continue;
          }
          const StripeLib = (await import("stripe")).default;
          const stripe = new StripeLib(ENV.stripeSecretKey!, { apiVersion: "2026-03-25.dahlia" as any });
          const amountCents = Math.round(parseFloat(commission.amount || "0") * 100);
          if (amountCents < 100) { skipped++; continue; }

          await stripe.transfers.create({
            amount: amountCents,
            currency: "usd",
            destination: rep.stripeConnectAccountId,
            description: `MiniMorph commission payout #${commission.id}`,
          });
          await database.update(commissionsTable)
            .set({ status: "paid", paidAt: new Date() })
            .where(eqFn(commissionsTable.id, commission.id));
          paid++;
        } catch (err: any) {
          errors.push(`Commission #${commission.id}: ${err.message}`);
        }
      }

      return { checked: approvedCommissions.length, paid, skipped, errors };
    })
  );

  // ─── Fix #8: Post-Launch Nurture ─────────────────────────────────────────────
  // Sends day-1, day-7, and day-30 emails after a customer's site goes live.
  app.post("/api/scheduled/post-launch-nurture", (req, res) =>
    runJob(req, res, "post-launch-nurture", async () => {
      const database = await getDb();
      if (!database) return { error: "DB unavailable" };
      const { onboardingProjects: projectsTable, nurtureLogs: nurtureTable } = await import("../drizzle/schema");
      const { eq: eqFn, and: andFn, isNotNull: isNotNullFn } = await import("drizzle-orm");
      const { sendEmail } = await import("./services/email");

      const liveProjects = await database.select().from(projectsTable)
        .where(andFn(inArray(projectsTable.stage, ["launch", "complete"]), isNotNullFn(projectsTable.launchedAt)));

      const now = new Date();
      let sent = 0;
      const errors: string[] = [];
      const MILESTONES = [1, 7, 30];

      for (const project of liveProjects) {
        if (!project.launchedAt || !project.contactEmail) continue;
        const daysSinceLive = Math.floor((now.getTime() - new Date(project.launchedAt).getTime()) / 86400000);

        for (const day of MILESTONES) {
          if (daysSinceLive < day) continue;
          const nurtureKey = `post_launch_day_${day}_${project.id}`;
          const existing = await database.select().from(nurtureTable)
            .where(andFn(eqFn(nurtureTable.customerId, project.customerId!), eqFn(nurtureTable.subject, nurtureKey)))
            .limit(1);
          if (existing.length > 0) continue;

          const subjects: Record<number, string> = {
            1: `Your site is live — here's what to do next`,
            7: `One week live — how is your new website doing?`,
            30: `30 days live — your website performance snapshot`,
          };
          const bodies: Record<number, string> = {
            1: `<p>Congratulations! Your MiniMorph website is live. Here are 3 quick things to do today:</p><ol><li>Share your new website URL on social media</li><li>Add it to your Google Business Profile</li><li>Send it to your existing customers</li></ol><p>Log in to your <a href="${ENV.appUrl || "https://minimorphstudios.net"}/portal">customer portal</a> to track visitors and request changes.</p>`,
            7: `<p>It's been one week since your site went live! Log in to your <a href="${ENV.appUrl || "https://minimorphstudios.net"}/portal">portal</a> to see your visitor stats and make any tweaks.</p><p>Remember: you have revision requests available — use them!</p>`,
            30: `<p>Your website has been live for 30 days. Log in to your <a href="${ENV.appUrl || "https://minimorphstudios.net"}/portal">portal</a> to see your monthly performance report including traffic, leads captured, and more.</p>`,
          };

          try {
            await sendEmail({
              to: project.contactEmail,
              subject: subjects[day],
              html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#111122;color:#eaeaf0;padding:24px;max-width:600px;margin:0 auto">${bodies[day]}<p style="color:#7a7a90;font-size:12px;margin-top:32px">MiniMorph Studios — Beautiful websites for growing businesses</p></body></html>`,
            });
            await database.insert(nurtureTable).values({
              customerId: project.customerId!,
              type: "check_in",
              channel: "email",
              subject: nurtureKey,
              content: `Post-launch day ${day} email sent`,
              status: "sent",
              scheduledAt: now,
              sentAt: now,
            });
            sent++;
          } catch (err: any) {
            errors.push(`Project #${project.id} day-${day}: ${err.message}`);
          }
        }
      }

      return { projectsChecked: liveProjects.length, sent, errors };
    })
  );

  // ─── Fix #9: Win-Back Campaign ────────────────────────────────────────────────
  // Emails churned customers at day 7, 30, and 60 after cancellation.
  app.post("/api/scheduled/win-back", (req, res) =>
    runJob(req, res, "win-back", async () => {
      const database = await getDb();
      if (!database) return { error: "DB unavailable" };
      const { contracts: contractsTable, customers: customersTable, nurtureLogs: nurtureTable } = await import("../drizzle/schema");
      const { eq: eqFn, inArray: inArrayFn, and: andFn } = await import("drizzle-orm");
      const { sendEmail } = await import("./services/email");

      const cancelledContracts = await database.select({
        id: contractsTable.id,
        customerId: contractsTable.customerId,
        endDate: contractsTable.endDate,
      })
        .from(contractsTable)
        .where(inArrayFn(contractsTable.status, ["cancelled", "expired"]));

      const now = new Date();
      let sent = 0;
      const errors: string[] = [];
      const WIN_BACK_DAYS = [7, 30, 60];

      for (const contract of cancelledContracts) {
        if (!contract.endDate || !contract.customerId) continue;
        const daysSince = Math.floor((now.getTime() - new Date(contract.endDate).getTime()) / 86400000);

        for (const day of WIN_BACK_DAYS) {
          if (daysSince < day) continue;
          const nurtureKey = `win_back_day_${day}_contract_${contract.id}`;

          const existing = await database.select().from(nurtureTable)
            .where(andFn(eqFn(nurtureTable.customerId, contract.customerId), eqFn(nurtureTable.subject, nurtureKey)))
            .limit(1);
          if (existing.length > 0) continue;

          const customerRows = await database.select().from(customersTable).where(eqFn(customersTable.id, contract.customerId)).limit(1);
          const customer = customerRows[0];
          if (!customer?.email) continue;

          const subjects: Record<number, string> = {
            7: `We miss you — ready to get your website back?`,
            30: `Your competitors are getting ahead — let's fix that`,
            60: `Special offer: restart your MiniMorph website at a discount`,
          };

          try {
            await sendEmail({
              to: customer.email,
              subject: subjects[day],
              html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#111122;color:#eaeaf0;padding:24px;max-width:600px;margin:0 auto"><h2 style="color:#4a9eff">${subjects[day]}</h2><p>Hi ${customer.contactName || "there"},</p><p>We noticed your MiniMorph website subscription ended. We'd love to have you back.</p>${day === 60 ? '<p><strong style="color:#22c55e">Special offer: get your first month back at 20% off.</strong> Reply to this email or visit our site to restart.</p>' : "<p>Your old site design is saved and can be reactivated in minutes. <a href='https://minimorphstudios.net'>Visit us to restart today.</a></p>"}<p style="color:#7a7a90;font-size:12px;margin-top:32px">MiniMorph Studios — You can unsubscribe from win-back emails by replying STOP.</p></body></html>`,
            });
            await database.insert(nurtureTable).values({
              customerId: contract.customerId,
              contractId: contract.id,
              type: "renewal_outreach",
              channel: "email",
              subject: nurtureKey,
              content: `Win-back day ${day} email sent`,
              status: "sent",
              scheduledAt: now,
              sentAt: now,
            });
            sent++;
          } catch (err: any) {
            errors.push(`Contract #${contract.id} day-${day}: ${err.message}`);
          }
        }
      }

      return { cancelledChecked: cancelledContracts.length, sent, errors };
    })
  );

  // ─── Fix #6: Seasonal Alerts ─────────────────────────────────────────────────
  // Sends quarterly seasonal trend recommendations to live customers by industry.
  app.post("/api/scheduled/seasonal-alerts", (req, res) =>
    runJob(req, res, "seasonal-alerts", async () => {
      const database = await getDb();
      if (!database) return { error: "DB unavailable" };
      const { nurtureLogs: nurtureTable, onboardingProjects: projectsTable } = await import("../drizzle/schema");
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const { sendEmail } = await import("./services/email");

      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const year = now.getFullYear();
      const seasonalKey = `seasonal_q${quarter}_${year}`;

      const liveProjects = await database.select({
        customerId: projectsTable.customerId,
        businessName: projectsTable.businessName,
        questionnaire: projectsTable.questionnaire,
        contactEmail: projectsTable.contactEmail,
        contactName: projectsTable.contactName,
      }).from(projectsTable).where(inArray(projectsTable.stage, ["launch", "complete"]));

      let sent = 0;
      const errors: string[] = [];
      const seasonNames = ["", "Q1 (Winter)", "Q2 (Spring)", "Q3 (Summer)", "Q4 (Fall)"];

      for (const project of liveProjects) {
        if (!project.customerId || !project.contactEmail) continue;
        const nurtureKey = `${seasonalKey}_${project.customerId}`;
        const existing = await database.select().from(nurtureTable)
          .where(andFn(eqFn(nurtureTable.customerId, project.customerId), eqFn(nurtureTable.subject, nurtureKey)))
          .limit(1);
        if (existing.length > 0) continue;

        const businessType = ((project.questionnaire as any)?.websiteType || "").toLowerCase();
        const tips =
          businessType.includes("restaurant") || businessType.includes("food")
            ? ["Update your seasonal menu on your website", "Add holiday hours", "Feature seasonal specials on your homepage"]
            : businessType.includes("contractor") || businessType.includes("plumb") || businessType.includes("hvac")
            ? ["Feature seasonal services (AC tune-ups in summer, heating in fall)", "Update your availability calendar", "Promote weather-related offers"]
            : ["Add a seasonal promotion to your homepage", "Update your photos to reflect the season", "Review your contact form — are you getting enough leads?"];

        try {
          await sendEmail({
            to: project.contactEmail,
            subject: `${seasonNames[quarter]} website tips for ${project.businessName}`,
            html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#111122;color:#eaeaf0;padding:24px;max-width:600px;margin:0 auto"><h2 style="color:#4a9eff">${seasonNames[quarter]} Website Tips</h2><p>Hi ${project.contactName || "there"},</p><p>Here are 3 things to update on your website this quarter:</p><ul>${tips.map((t: string) => `<li style="margin-bottom:8px">${t}</li>`).join("")}</ul><p><a href="${ENV.appUrl || "https://minimorphstudios.net"}/portal" style="color:#22c55e">Log in to request changes →</a></p><p style="color:#7a7a90;font-size:12px;margin-top:32px">MiniMorph Studios seasonal newsletter</p></body></html>`,
          });
          await database.insert(nurtureTable).values({
            customerId: project.customerId,
            type: "check_in",
            channel: "email",
            subject: nurtureKey,
            content: `Seasonal Q${quarter} tips email sent`,
            status: "sent",
            scheduledAt: now,
            sentAt: now,
          });
          sent++;
        } catch (err: any) {
          errors.push(`Customer #${project.customerId}: ${err.message}`);
        }
      }

      return { liveCustomersChecked: liveProjects.length, sent, errors };
    })
  );

  // ─── Fix #15: Upsell Alerts ───────────────────────────────────────────────────
  // Targets live customers who haven't purchased add-ons — sends tailored upsell email.
  app.post("/api/scheduled/upsell-alerts", (req, res) =>
    runJob(req, res, "upsell-alerts", async () => {
      const database = await getDb();
      if (!database) return { error: "DB unavailable" };
      const { onboardingProjects: projectsTable, nurtureLogs: nurtureTable } = await import("../drizzle/schema");
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const { sendEmail } = await import("./services/email");

      const now = new Date();
      const upsellCycleKey = `upsell_${now.getFullYear()}_${now.getMonth() + 1}`;

      const liveProjects = await database.select().from(projectsTable)
        .where(inArray(projectsTable.stage, ["launch", "complete"]));

      let sent = 0;
      const errors: string[] = [];

      for (const project of liveProjects) {
        if (!project.customerId || !project.contactEmail) continue;

        const q = (project.questionnaire as any) || {};
        const addons = Array.isArray(q.addonsSelected) ? q.addonsSelected : [];
        if (addons.length > 0) continue;

        const nurtureKey = `${upsellCycleKey}_${project.customerId}`;
        const existing = await database.select().from(nurtureTable)
          .where(andFn(eqFn(nurtureTable.customerId, project.customerId), eqFn(nurtureTable.subject, nurtureKey)))
          .limit(1);
        if (existing.length > 0) continue;

        try {
          await sendEmail({
            to: project.contactEmail,
            subject: `Supercharge your ${project.businessName} website`,
            html: `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#111122;color:#eaeaf0;padding:24px;max-width:600px;margin:0 auto"><h2 style="color:#4a9eff">Take your website to the next level</h2><p>Hi ${project.contactName || "there"},</p><p>Your website is live and looking great. Here are some powerful add-ons that can help you get more customers:</p><ul><li style="margin-bottom:12px"><strong>Review Widget</strong> — Display your Google reviews automatically. Builds trust instantly.</li><li style="margin-bottom:12px"><strong>Booking Widget</strong> — Let customers schedule appointments directly from your website.</li><li style="margin-bottom:12px"><strong>AI Chat Bot</strong> — Answer customer questions 24/7 without lifting a finger.</li><li style="margin-bottom:12px"><strong>Lead Capture Form</strong> — Capture visitor info even when you're busy.</li></ul><p><a href="${ENV.appUrl || "https://minimorphstudios.net"}/portal" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;margin-top:8px">Explore Add-ons →</a></p><p style="color:#7a7a90;font-size:12px;margin-top:32px">MiniMorph Studios</p></body></html>`,
          });
          await database.insert(nurtureTable).values({
            customerId: project.customerId,
            type: "upsell_attempt",
            channel: "email",
            subject: nurtureKey,
            content: "Upsell add-ons email sent",
            status: "sent",
            scheduledAt: now,
            sentAt: now,
          });
          sent++;
        } catch (err: any) {
          errors.push(`Customer #${project.customerId}: ${err.message}`);
        }
      }

      return { liveProjectsChecked: liveProjects.length, sent, errors };
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

  console.log("[Scheduled] Registered 22 scheduled job endpoints at /api/scheduled/*");
}
