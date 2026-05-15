# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Anthropic API Credits → Production Generation Test Rerun

**Priority:** P0 — blocks all AI generation
**Status:** BLOCKED — Anthropic API credit balance insufficient

### What happened

Production End-to-End Generation Test executed on 2026-05-15. Generation was triggered via the Railway admin API flow (not `railway run` — actual production server). This proved Anthropic API IS reachable from Railway. However, all AI calls failed with:

```
400 Bad Request — "Your credit balance is too low to access the Anthropic API.
Please go to Plans & Billing to upgrade or purchase credits."
```

- **GreenLeaf Landscaping (LLM fallback):** Explicit 400 credit error — generation failed
- **Apex Roofing, Luxe + Bare Studio, FitForge CrossFit:** Haiku copy generation failed silently → HEADLINE, SUBHEADLINE, TAGLINE unreplaced
- **Rosa's Kitchen:** Generation timed out (>10 min) — likely stuck in retry loop due to API failures

### Template content verified CLEAN

All P1 template content issues confirmed clean:
- No fake coaches, fake team members, fake credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- No Formspree, return false, portal/api ✅
- Form endpoints: `https://www.minimorphstudios.net/api/contact-submit` ✅
- APP_URL_PLACEHOLDER fully replaced ✅

---

## Required Next Action (1 step)

**Top up Anthropic API credits** at `https://console.anthropic.com` → Plans & Billing.

Once credits are added, re-run the production generation test using the same admin API flow:

```
1. Log in as admin (localAuth.login)
2. For each of 5 businesses: onboarding.create → onboarding.saveQuestionnaire → compliance.adminApproveBlueprint → onboarding.triggerGeneration
3. Poll onboarding.viewGeneratedSite until generationStatus === "complete"
4. Score against 06_QUALITY_RULES.md (95/100 minimum)
```

Projects 41–45 from the 2026-05-15 test run are still in the DB (generation failed, HTML is empty). You may reuse them or create new ones.

---

## Additional Risk Found

`server/templates/ecommerce/product.html:741` contains `return false;` in a form handler. Not part of the 5 Quality Lab test businesses but will affect ecommerce customers. Fix before any ecommerce customer is onboarded.

---

## Gate Sequence

```
[DONE]     Contact Flow P0 Repair ✅ (commit 0c1440d)
           ↓
[DONE]     Template Truth Repair ✅ (commits 86105c5 + 8f11c2b)
           ↓
[DONE]     Deploy Confirmed ✅ (commit 61c8f14, live at 07:42:58 GMT)
           ↓
[DONE]     Production API flow proved working ✅ (generation runs on server, Anthropic IS reachable)
           ↓
[BLOCKED]  Anthropic API credits insufficient — top up, then re-run 5-site generation test
           ↓
           Production Generation Test: all 5 sites score 95+/100
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
| Template content P1 repairs verified clean | ✅ Done (static + generation inspection) |
| Production admin API flow working (generation on server) | ✅ Done (proved 2026-05-15) |
| Anthropic API credits sufficient | ❌ Credit balance too low — add credits |
| Production generation test — all 5 sites score 95+/100 | ❌ Pending credits top-up |
| Admin explicitly approves first customer | ❌ Pending generation test pass |
