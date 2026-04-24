# Scheduled Jobs — MiniMorph Studios

## Background

The autonomous lead generation engine previously ran on `setInterval` timers inside `server/services/leadGenScheduler.ts`. This approach is incompatible with CloudRun, which shuts down instances when idle — killing all in-memory timers.

The scheduler has been replaced with HTTP endpoints at `/api/scheduled/*` that can be triggered by external cron services (Manus scheduled tasks, Cloud Scheduler, etc.).

## Authentication

All scheduled endpoints require the `x-scheduler-secret` header.

| Header | Value |
|--------|-------|
| `x-scheduler-secret` | Must match `SCHEDULER_SECRET` env var |

Returns `401 Unauthorized` if missing or invalid. Returns `500` if `SCHEDULER_SECRET` is not configured.

## Required Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SCHEDULER_SECRET` | Shared secret for authenticating scheduled endpoint calls | (none — required) |
| `ENABLE_INTERNAL_SCHEDULER` | Set to `"true"` to enable legacy setInterval scheduler (dev only) | `"false"` |

## Endpoints

### 1. Send Due Outreach

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/outreach` |
| Purpose | Send outreach emails/SMS to leads with due sequences |
| Recommended cadence | Every 15 minutes |
| Function called | `sendDueOutreach()` |
| Response `result` | `{ sent: number }` |

### 2. Website Scoring

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/scoring` |
| Purpose | Score unscored scraped business websites |
| Recommended cadence | Every 30 minutes |
| Function called | `scoreUnscrapedWebsites(20)` |
| Response `result` | `{ scored: number }` |

### 3. Business Enrichment + ML Rescore

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/enrichment` |
| Purpose | Enrich qualified businesses with additional data, then rescore all leads with ML model |
| Recommended cadence | Every 1 hour |
| Functions called | `enrichQualifiedBusinesses(10)`, `rescoreAllLeads()` |
| Response `result` | `{ enriched: number, rescored: number }` |

### 4. Lead Conversion

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/lead-conversion` |
| Purpose | Convert enriched businesses into actionable leads |
| Recommended cadence | Every 2 hours |
| Function called | `batchConvertToLeads(20)` |
| Response `result` | `{ converted: number }` |

### 5. Re-engagement Campaigns

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/reengagement` |
| Purpose | Run re-engagement campaigns for cold/stale leads |
| Recommended cadence | Every 3 hours |
| Function called | `runReengagementCampaign()` |
| Response `result` | `{ reengaged: number }` |

### 6. Auto-Feed Reps

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/auto-feed` |
| Purpose | Feed reps who need more leads based on performance capacity |
| Recommended cadence | Every 4 hours |
| Function called | `autoFeedReps()` |
| Response `result` | `{ repsChecked, repsFed, leadsGenerated, scrapeJobsCreated }` |

### 7. Enterprise Prospect Scan

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/enterprise-scan` |
| Purpose | Scan for high-value enterprise prospects |
| Recommended cadence | Every 6 hours |
| Function called | `scanForEnterpriseLeads(10)` |
| Response `result` | `{ found: number }` |

### 8. Multi-Source Scrape

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/multi-source` |
| Purpose | Scrape businesses from best-performing sources (Google Maps, Yelp, Facebook, BBB, etc.) |
| Recommended cadence | Every 8 hours |
| Function called | `runMultiSourceScrape(...)` |
| Response `result` | `{ total, new, duplicates, bySource, errors }` |

### 9. Contact Enrichment (Apollo/Hunter)

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/contact-enrichment` |
| Purpose | Enrich business contacts with email/phone via Apollo and Hunter APIs |
| Recommended cadence | Every 2 hours |
| Function called | `batchEnrichContacts(15)` |
| Response `result` | `{ total, enriched, partial, failed }` |

### 10. Adaptive Scaling

| Field | Value |
|-------|-------|
| Endpoint | `POST /api/scheduled/adaptive-scaling` |
| Purpose | Analyze rep capacity and create scrape jobs to meet demand |
| Recommended cadence | Every 4 hours |
| Function called | `runAdaptiveScaling()` |
| Response `result` | `{ repsAnalyzed, repsNeedingLeads, actionsExecuted, newScrapeJobsCreated }` |

### Health Check

| Field | Value |
|-------|-------|
| Endpoint | `GET /api/scheduled/status` |
| Purpose | Check which jobs are currently running |
| Response | `{ ok, runningJobs: string[], timestamp }` |

## Response Format

All endpoints return JSON:

```json
{
  "ok": true,
  "job": "outreach",
  "startedAt": "2026-04-24T20:00:00.000Z",
  "finishedAt": "2026-04-24T20:00:05.123Z",
  "durationMs": 5123,
  "result": { "sent": 12 }
}
```

On failure:

```json
{
  "ok": false,
  "job": "outreach",
  "startedAt": "2026-04-24T20:00:00.000Z",
  "finishedAt": "2026-04-24T20:00:01.456Z",
  "durationMs": 1456,
  "error": "Database connection failed"
}
```

If a job is already running (overlap guard): HTTP 409 with `"error": "Job \"outreach\" is already running"`.

## Recommended Cron Schedule

```
# Outreach — every 15 minutes
*/15 * * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/outreach

# Scoring — every 30 minutes
*/30 * * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/scoring

# Enrichment — every hour at :05
5 * * * *     curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/enrichment

# Lead conversion — every 2 hours at :10
10 */2 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/lead-conversion

# Contact enrichment — every 2 hours at :20
20 */2 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/contact-enrichment

# Re-engagement — every 3 hours at :15
15 */3 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/reengagement

# Auto-feed reps — every 4 hours at :25
25 */4 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/auto-feed

# Adaptive scaling — every 4 hours at :35
35 */4 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/adaptive-scaling

# Enterprise scan — every 6 hours at :45
45 */6 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/enterprise-scan

# Multi-source scrape — every 8 hours at :55
55 */8 * * *  curl -s -X POST -H "x-scheduler-secret: $SCHEDULER_SECRET" https://your-domain/api/scheduled/multi-source
```

## Local Development

To use the legacy setInterval scheduler during local development:

```bash
ENABLE_INTERNAL_SCHEDULER=true pnpm dev
```

This is logged clearly on startup. The scheduled HTTP endpoints remain available regardless of this setting.
