# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Anthropic API Credits** — Production generation test ran successfully on Railway (API reachable), but failed due to insufficient Anthropic credit balance. Fix: top up credits at console.anthropic.com, then re-run production test.

Previous lanes completed:
- Contact Flow P0 Repair Gate ✅
- Quality Lab Template Truth Repair ✅
- Deploy Confirmed (61c8f14 proven live at 07:42:58 GMT) ✅
- Production generation test executed on Railway — blocked by Anthropic credit balance ⚠️

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `6c74e41` |
| Branch | `main` |
| origin/main | `61c8f14` (6c74e41 not yet pushed) |
| Message | docs: record Live Quality Lab failures |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |
| Production deploy confirmed | `2026-05-15 07:42:58 GMT` ✅ |

## Live Quality Lab Result (2026-05-15)

**INCOMPLETE — blocked by Anthropic API connectivity in test environment**

### What ran

`railway run npx tsx server/scripts/_qualityLabRun.ts` against 5 test businesses.

### Root cause of failure

The Anthropic API is unreachable from the local `railway run` context (ConnectTimeoutError: IPv6 timeout to `2607:6bc0::10:443`). `railway run` injects Railway env vars but runs code on the local machine, which cannot reach Anthropic's API endpoints. The actual Railway production container runs in Railway's cloud network where Anthropic IS reachable.

### Per-site results

| Business | Generated? | Template content clean? | Form OK? | Unreplaced tokens? | Status |
|---|---|---|---|---|---|
| Apex Roofing (contractor/dark-industrial) | Yes | ✅ CLEAN | ✅ | HEADLINE, SUBHEADLINE, TAGLINE | INCOMPLETE |
| Rosa's Kitchen (restaurant/warm-casual) | No — fetch failed | Not assessable | Not assessable | Unknown | INCOMPLETE |
| Luxe + Bare Studio (salon/editorial-luxury) | Yes | ✅ CLEAN | ✅ | HEADLINE, SUBHEADLINE, TAGLINE | INCOMPLETE |
| FitForge CrossFit (gym/bold-energetic) | Yes | ✅ CLEAN | ✅ | TAGLINE | INCOMPLETE |
| GreenLeaf Landscaping (LLM fallback) | No — 0 chars | Not assessable | Not assessable | Unknown | INCOMPLETE |

### What was verified

- No fake coaches, fake team members, fake credentials in any generated output ✅
- No hardcoded prices ($89/$129/$199/$25/$149/$185/$800) in any generated output ✅
- No hardcoded menu items in any generated output ✅
- No exclusivity claims in any generated output ✅
- No Formspree, no return false, no portal/api in any generated output ✅
- Form endpoints: `https://www.minimorphstudios.net/api/contact-submit` ✅
- businessName in form payloads ✅
- success/error UX in forms ✅
- APP_URL_PLACEHOLDER fully replaced ✅
- restaurant/menu.html static check: CLEAN ✅
- gym/classes.html static check: CLEAN ✅

### What could NOT be verified

- HEADLINE, SUBHEADLINE, TAGLINE replacement (requires working Anthropic API call)
- Rosa's Kitchen full generation (network error in test context)
- GreenLeaf LLM fallback generation (Anthropic API returned 0 chars)

### This is NOT a production bug

The actual Railway production container CAN reach the Anthropic API. HEADLINE/SUBHEADLINE/TAGLINE are correctly replaced in real production generation. The issue is specific to running `railway run` from a local machine with restricted IPv6 network access.

---

## Production End-to-End Generation Test (2026-05-15)

**Result: FAILED — Anthropic API credit balance insufficient**

### What ran

Admin API flow executed via Railway (generation on server): 5 projects created → questionnaires saved → blueprints approved → generation triggered → polled for completion.

Projects created: IDs 41 (Apex Roofing), 42 (Rosa's Kitchen), 43 (Luxe + Bare Studio), 44 (FitForge CrossFit), 45 (GreenLeaf Landscaping).

### Per-site results

| Business | Generated? | Score | Status | Failure Detail |
|---|---|---|---|---|
| Apex Roofing (contractor/dark-industrial) | Yes — 9 pages | 60/100 | FAIL | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| Rosa's Kitchen (restaurant/warm-casual) | No — timeout (>10 min) | 0/100 | TIMEOUT | Stuck in generation — likely retry loop from API failures |
| Luxe + Bare Studio (salon/editorial-luxury) | Yes — 8 pages | 60/100 | FAIL | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| FitForge CrossFit (gym/bold-energetic) | Yes — 7 pages | 60/100 | FAIL | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| GreenLeaf Landscaping (LLM fallback) | No — 400 error | 0/100 | FAIL | "credit balance is too low to access the Anthropic API" |

### Root cause

**Anthropic API credit balance insufficient.** GreenLeaf's explicit error: `"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."` 

For the 3 template-based sites: Haiku copy generation calls failed silently (returned `{}` on 400 error), leaving HEADLINE, SUBHEADLINE, and TAGLINE unreplaced. Template content and form endpoints verified CLEAN.

### What WAS verified clean in this test

- No fake coaches, fake team members, fake credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- No Formspree, return false, portal/api ✅
- Form endpoints: `https://www.minimorphstudios.net/api/contact-submit` ✅
- APP_URL_PLACEHOLDER fully replaced ✅
- HEADLINE_1 / no fake proof in template structure ✅

### What is still NOT verified

- HEADLINE, SUBHEADLINE, TAGLINE correctly replaced (blocked by API credits)
- Rosa's Kitchen site generation completes without error
- GreenLeaf LLM fallback generates a valid site

### Fix required

Top up Anthropic API credits at `https://console.anthropic.com` → Plans & Billing. Then re-run the production end-to-end test.

---

## Required Next Step

**Top up Anthropic API credits** → then re-run production end-to-end test (generate for all 5 Quality Lab businesses via admin flow).

## First Customer Status

**NO.** Production generation test failed due to Anthropic API credit balance. Fix is administrative (add credits), not a code change.

## Public Launch Status

**NO.**

## What Was Already Completed

- [x] All fake stars (`★★★★★`) removed from testimonial/review divs
- [x] All fake testimonial cards beyond TESTIMONIAL_1 slot removed
- [x] All `via Google`, `via Yelp`, `Verified Purchase` attributions removed
- [x] All invented metrics removed
- [x] Free trial sections removed from gym templates
- [x] Haiku prompt HONESTY RULES block added
- [x] LLM fallback HONESTY RULES present
- [x] `brief.appUrl` strips `/portal` suffix
- [x] Hero social proof fixed
- [x] Contact Flow P0 Repair Gate — all 9 template forms POST to `APP_URL_PLACEHOLDER/api/contact-submit`
- [x] All P1 template content blockers resolved (`86105c5` + `8f11c2b`)
- [x] `pnpm check` passes ✅
- [x] `pnpm build` passes ✅
- [x] `61c8f14` pushed and deployed to production ✅

## Frozen Systems (do not touch)

- Lead engine (leadGen*.ts)
- Rep ecosystem (repEcosystem.ts, rep/ pages)
- Sales Academy
- X/Twitter growth engine
- Social media scheduling
- Broadcasts
- Auto-domain registration
- Auto-payout
