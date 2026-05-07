/**
 * cron.ts — Hourly cron runner for Railway cron service.
 * Railway invokes this every hour via: npx tsx cron.ts
 * It checks the current UTC time and fires all jobs that are due.
 * Uses native Node 18+ fetch — no external dependencies.
 */

const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET || "";
const APP_URL = process.env.APP_URL || "https://www.minimorphstudios.net";

interface CronJob {
  endpoint: string;
  schedule: string; // cron expression: "min hour dom month dow"
  description: string;
}

const jobs: CronJob[] = [
  // ── Every 6 hours ──────────────────────────────────────────────────────────
  { endpoint: "/api/scheduled/outreach",         schedule: "0 */6 * * *", description: "Lead outreach sequences" },
  { endpoint: "/api/scheduled/scoring",          schedule: "0 */6 * * *", description: "Re-score leads" },
  { endpoint: "/api/scheduled/multi-source",     schedule: "0 */6 * * *", description: "Multi-source scrape" },
  { endpoint: "/api/scheduled/enrichment",       schedule: "0 */6 * * *", description: "Contact enrichment" },
  { endpoint: "/api/scheduled/lead-conversion",  schedule: "0 */6 * * *", description: "Convert enriched leads" },
  { endpoint: "/api/scheduled/auto-feed",        schedule: "0 */6 * * *", description: "Auto-feed leads to reps" },

  // ── Daily at 9am UTC ───────────────────────────────────────────────────────
  { endpoint: "/api/scheduled/health-score-update",  schedule: "0 9 * * *", description: "Customer health scores" },
  { endpoint: "/api/scheduled/nps-surveys",          schedule: "0 9 * * *", description: "NPS surveys" },
  { endpoint: "/api/scheduled/pending-payment-check",schedule: "0 9 * * *", description: "Chase unpaid invoices" },
  { endpoint: "/api/scheduled/domain-status-check",  schedule: "0 9 * * *", description: "Domain/DNS check" },
  { endpoint: "/api/scheduled/renewal-reminders",    schedule: "0 9 * * *", description: "Contract renewals" },
  { endpoint: "/api/scheduled/commission-payouts",   schedule: "0 9 * * *", description: "Commission payouts" },
  { endpoint: "/api/scheduled/post-launch-nurture",  schedule: "0 9 * * *", description: "Post-launch drip emails" },
  { endpoint: "/api/scheduled/upsell-alerts",        schedule: "0 9 * * *", description: "Upsell opportunity alerts" },

  // ── Weekly — Monday at 10am UTC ────────────────────────────────────────────
  { endpoint: "/api/scheduled/reengagement",       schedule: "0 10 * * 1", description: "Re-engagement campaign" },
  { endpoint: "/api/scheduled/enterprise-scan",    schedule: "0 10 * * 1", description: "Enterprise lead scan" },
  { endpoint: "/api/scheduled/contact-enrichment", schedule: "0 10 * * 1", description: "Batch contact enrichment" },
  { endpoint: "/api/scheduled/adaptive-scaling",   schedule: "0 10 * * 1", description: "Adaptive lead scaling" },
  { endpoint: "/api/scheduled/seasonal-alerts",    schedule: "0 10 * * 1", description: "Seasonal campaigns" },
  { endpoint: "/api/scheduled/win-back",           schedule: "0 10 * * 1", description: "Win-back churned customers" },

  // ── Monthly — 1st of month at 8am UTC ─────────────────────────────────────
  { endpoint: "/api/scheduled/monthly-nurture",    schedule: "0 8 1 * *", description: "Monthly addon nurture emails" },
  { endpoint: "/api/scheduled/monthly-anniversary",schedule: "0 8 1 * *", description: "Anniversary emails" },
];

function shouldRun(schedule: string): boolean {
  const now = new Date();
  const minute  = now.getUTCMinutes();
  const hour    = now.getUTCHours();
  const day     = now.getUTCDate();
  const weekday = now.getUTCDay();

  const [m, h, d, , w] = schedule.split(" ");

  if (m !== "*" && parseInt(m) !== minute) return false;

  if (h.startsWith("*/")) {
    if (hour % parseInt(h.split("/")[1]) !== 0) return false;
  } else if (h !== "*") {
    if (parseInt(h) !== hour) return false;
  }

  if (d !== "*" && parseInt(d) !== day) return false;
  if (w !== "*" && parseInt(w) !== weekday) return false;

  return true;
}

async function triggerJob(job: CronJob): Promise<void> {
  const url = `${APP_URL}${job.endpoint}`;
  const start = Date.now();

  try {
    console.log(`[Cron] → ${job.endpoint} (${job.description})`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-scheduler-secret": SCHEDULER_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(300_000),
    });

    const elapsed = Date.now() - start;
    const text = await res.text().catch(() => "");
    let data: any = {};
    try { data = JSON.parse(text); } catch {}

    if (res.ok) {
      console.log(`[Cron] ✓ ${job.endpoint} ${elapsed}ms${data.ok !== undefined ? ` ok=${data.ok}` : ""}`);
    } else {
      console.error(`[Cron] ✗ ${job.endpoint} status=${res.status} ${text.slice(0, 200)}`);
    }
  } catch (err: any) {
    const elapsed = Date.now() - start;
    console.error(`[Cron] ✗ ${job.endpoint} ${elapsed}ms ${err.message}`);
  }
}

async function main() {
  const now = new Date();
  console.log(`[Cron] Running at ${now.toISOString()}`);
  console.log(`[Cron] Target: ${APP_URL}`);

  if (!SCHEDULER_SECRET) {
    console.error("[Cron] ERROR: SCHEDULER_SECRET not set");
    process.exit(1);
  }

  const dueJobs = jobs.filter(j => shouldRun(j.schedule));
  console.log(`[Cron] ${dueJobs.length} jobs due out of ${jobs.length} total`);

  if (dueJobs.length === 0) {
    console.log("[Cron] Nothing to run this hour");
    process.exit(0);
  }

  for (const job of dueJobs) {
    await triggerJob(job);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("[Cron] Done");
  process.exit(0);
}

main().catch(err => {
  console.error("[Cron] Fatal:", err);
  process.exit(1);
});
