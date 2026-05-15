# System: Lead Engine

## Status: FROZEN

**Do not activate, run, or extend this system before first customer delivery is confirmed and the system is explicitly reviewed.**

---

## What This System Does

The lead engine scrapes business listings from external sources, scores them as potential MiniMorph customers, and feeds qualified leads into the sales pipeline.

---

## Data Sources (all frozen)

- Yelp Fusion API — business listings by category and location
- Bing Local Search API — backup source
- Google Places API — backup source

These APIs have associated costs. Do not activate without understanding rate limits and billing.

---

## Key Files

| File | Purpose |
|---|---|
| `server/services/leadGenService.ts` | Core lead scraping and scoring |
| `server/services/leadGenScheduler.ts` | Cron-based scheduling |
| `server/routers.ts (leadGenRouter)` | Lead gen tRPC procedures |
| `client/src/pages/admin/LeadGen.tsx` | Admin lead management UI |

---

## Intelligence Card

Each scraped business gets an "intelligence card" — a scored profile including:
- Business category and location
- Website quality estimate
- Social media presence
- Estimated MRR potential
- Outreach recommendation

The intelligence card is used to prioritize which leads to pursue.

---

## Elena's Role in Lead Outreach

When activated, Elena AI persona can send initial outreach messages to scraped leads. This is frozen and must not be activated until:
1. First customer is delivered
2. Lead engine is formally reviewed for legal/spam compliance
3. Message templates are approved

---

## Self-Close Pipeline

The self-close pipeline allows high-scoring leads to convert without a human rep. This is entirely frozen and not connected to any live flow.

---

## Frozen Rules

- Do NOT activate Yelp Fusion, Bing, or Google Places API scraping
- Do NOT enable Elena outreach to external businesses
- Do NOT run lead gen scheduler
- Do NOT connect rep dashboard to live lead pipeline
- Report any bugs in this system to `07_KNOWN_BLOCKERS.md` as P2 and leave them

---

## When This Can Be Activated

After Gate 4 (Public Launch) — and only after an explicit review of:
- Legal/CAN-SPAM compliance for outreach
- API billing and rate limits
- Message template approval
- Rep readiness to handle incoming leads
