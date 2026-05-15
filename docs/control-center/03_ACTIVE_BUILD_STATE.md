# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Production End-to-End Generation Test** — Quality Lab blocked by test environment API limitation; requires real production web-flow test

Previous lanes completed:
- Contact Flow P0 Repair Gate ✅
- Quality Lab Template Truth Repair ✅
- Deploy Confirmed (61c8f14 proven live at 07:42:58 GMT) ✅

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `61c8f14` |
| Branch | `main` |
| origin/main | `61c8f14` |
| Message | docs: align Control Center with template truth repairs |
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

## Required Next Step

**Production End-to-End Generation Test** — test site generation through the actual production web flow:
- Create a test onboarding project in production for each business type
- Trigger generation via admin panel (`onboarding.triggerGeneration`)
- Inspect generated pages for HEADLINE/SUBHEADLINE/TAGLINE replacement
- Verify no fake content slipped through

OR: Run quality lab from within a Railway shell session (if available) where the network environment matches production.

## First Customer Status

**NO.** Quality Lab incomplete — Anthropic API unreachable from test context. Template content P1 repairs are verified clean but copy generation hasn't been confirmed end-to-end in a valid test environment.

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
