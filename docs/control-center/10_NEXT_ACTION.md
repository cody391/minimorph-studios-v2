# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Production End-to-End Generation Test

**Priority:** P1 — blocks first customer delivery
**Status:** BLOCKED — live Quality Lab run failed due to Anthropic API unreachable from `railway run` local test context

### What happened

Live Quality Lab executed on 2026-05-15 for 5 test businesses using `railway run npx tsx server/scripts/_qualityLabRun.ts`.

**Root cause:** `railway run` injects Railway env vars but executes code on the local machine. The local machine cannot reach Anthropic's API (ConnectTimeoutError: `UND_ERR_CONNECT_TIMEOUT` to IPv6 endpoint `2607:6bc0::10:443`). This caused:
- HEADLINE, SUBHEADLINE, TAGLINE tokens unreplaced in generated HTML (Haiku copy generation failed)
- Rosa's Kitchen: full generation failure (fetch failed — network error)
- GreenLeaf LLM fallback: 0 chars returned (Sonnet API unreachable)

**This is NOT a production bug.** The Railway production container runs in Railway's cloud network and CAN reach Anthropic's API.

### Template content verified CLEAN

All P1 template content issues are confirmed resolved (static grep + inspection of generated output from 3 of 5 sites):
- No fake coaches, fake team members, fake credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- No Formspree, return false, portal/api ✅
- Form endpoints correct ✅
- businessName in form payloads ✅

### What is still not verified

- HEADLINE / SUBHEADLINE / TAGLINE correctly replaced in full end-to-end generation
- Rosa's Kitchen site generation completes without error
- GreenLeaf LLM fallback generates a valid site with correct form endpoint

---

## Required Next Gate: Production End-to-End Generation Test

The Quality Lab must be run in an environment where the Anthropic API is reachable. Options:

### Option A (Recommended) — Admin-triggered generation in production

1. Log into the production admin panel at `https://www.minimorphstudios.net/portal/admin`
2. Create a test onboarding project for each of the 5 Quality Lab businesses
3. Trigger generation via `onboarding.triggerGeneration` (admin procedure, takes `projectId`)
4. Inspect the generated HTML pages for:
   - HEADLINE / SUBHEADLINE / TAGLINE replaced with real copy
   - No fake content
   - Form endpoint correct
5. Pass: all 5 sites generate cleanly with no unreplaced tokens and no fake content

### Option B — Railway shell session

If Railway provides a shell session inside the production container (`railway run --service ... /bin/bash` or equivalent), run the Quality Lab script from within the container where API access matches production.

### Option C — Fix local API connectivity

Set a valid `ANTHROPIC_API_KEY` in local `.env` file. Run `npx tsx server/scripts/_qualityLabRun.ts` directly (not via `railway run`). The script already imports `dotenv/config`.

---

## Additional Risk Found

`server/templates/ecommerce/product.html:741` contains `return false;` in a form handler. This file is not part of the 5 Quality Lab test businesses but will affect ecommerce customers. Should be fixed before any ecommerce customer is onboarded (not urgent for current gate).

---

## Gate Sequence

```
[DONE]     Contact Flow P0 Repair ✅ (commit 0c1440d)
           ↓
[DONE]     Template Truth Repair ✅ (commits 86105c5 + 8f11c2b)
           ↓
[DONE]     Deploy Confirmed ✅ (commit 61c8f14, live at 07:42:58 GMT)
           ↓
[BLOCKED]  Live Quality Lab — Anthropic API unreachable from test context
           → Next: Production End-to-End Generation Test (Option A, B, or C above)
           ↓
           First Controlled Customer (requires admin approval)
           ↓
           Public Launch
```

---

## First Customer Readiness Checklist

| Item | Status |
|---|---|
| Contact Flow P0 Repair Gate | ✅ Done |
| All template forms use APP_URL_PLACEHOLDER/api/contact-submit | ✅ Done |
| pnpm check passes | ✅ Done |
| pnpm build passes | ✅ Done |
| Committed and pushed to origin/main | ✅ Done (61c8f14) |
| Railway deploy confirmed | ✅ Done (07:42:58 GMT) |
| Template content P1 repairs verified clean | ✅ Done (static + partial generation inspection) |
| Live Quality Lab rerun — all 5 sites score 95+/100 | ❌ Incomplete — test environment API limitation |
| Production end-to-end generation confirmed | ❌ Not yet run |
| Admin explicitly approves first customer | ❌ Pending Quality Lab pass |
