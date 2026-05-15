# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Quality Lab Gate

**Priority:** P1 — blocks first customer delivery
**Status:** BLOCKED on user action (`railway login`)

### Prerequisite (user must do this)

```bash
railway login
```

Run this in an interactive terminal. This restores Railway CLI authorization so live site generation can be triggered. After login, verify with:

```bash
railway status
```

Should return project `fabulous-dedication`, service `minimorph-studios-v2`.

### What to do (after `railway login`)

Trigger 5 live site generations via the admin panel or API and score each against the 95/100 rubric in `06_QUALITY_RULES.md`. All 5 must pass before first customer proceeds.

### Known issue to check during Quality Lab

- `boutique/warm-lifestyle.html` has a hardcoded seasonal banner (`"Summer Sale — Up to 40% off!"`) — this will fail the Quality Lab rubric. See `07_KNOWN_BLOCKERS.md` for fix details. **Fix this before or during Quality Lab.**

### Deployment confirmation (do this first)

Before running Quality Lab, confirm the `0c1440d` commit deployed to production:

```bash
curl -sI https://www.minimorphstudios.net/health | grep last-modified
```

Timestamp must be newer than the pre-push value.

### After this gate: First Controlled Customer

- Admin explicitly approves first customer
- Use a real (trusted) first customer, not a test account
- Confirm `RESEND_API_KEY` is set in Railway env vars before delivery

---

## Gate Sequence (reminder)

```
[DONE]     Contact Flow P0 Repair ✅ (commit 0c1440d)
           ↓
[CURRENT]  Quality Lab (95+/100, all 5 sites) — blocked on railway login
           ↓
           First Controlled Customer
           ↓
           Public Launch
```
