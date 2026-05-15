# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Quality Lab Gate** (follows Contact Flow P0 Repair)

Previous lane completed: Contact Flow P0 Repair Gate ✅

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `0c1440d` |
| Branch | `main` |
| origin/main | `0c1440d` |
| Message | Fix generated-site contact forms |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |

## Current Blocker (P1)

**Railway CLI unauthorized — blocks Quality Lab live generation.**

User must run `railway login` in an interactive terminal to restore CLI access. Until this is done, live site generation cannot be triggered via CLI to run the Quality Lab.

## What Was Already Completed

- [x] All fake stars (`★★★★★`) removed from testimonial/review divs
- [x] All fake testimonial cards beyond TESTIMONIAL_1 slot removed
- [x] All `via Google`, `via Yelp`, `Verified Purchase` attributions removed
- [x] All `4.9★`, `5★`, `500+`, `847+`, `1,200+`, `2,500+` invented metrics removed
- [x] Free trial sections, forms, and JS handlers removed from gym templates
- [x] Haiku prompt HONESTY RULES block added (templateEngine.ts)
- [x] LLM fallback HONESTY RULES already present (siteGenerator.ts)
- [x] `brief.appUrl` in siteGenerator.ts strips `/portal` suffix (P0-D fix)
- [x] Hero social proof fixed (restaurant and service templates)
- [x] `contractor/dark-industrial.html` fake testimonial cards replaced with TESTIMONIAL_1 slot
- [x] Contact Flow P0 Repair Gate — all 9 template forms now POST to `APP_URL_PLACEHOLDER/api/contact-submit`
  - Fixed: `shared/contact.html`, `contractor/contact.html`, `contractor/quote.html`, `service/quote.html`, `restaurant/reservations.html`, `service/professional.html`, `boutique/warm-lifestyle.html`, `boutique/minimal-editorial.html`, `service/friendly-local.html`
  - Gym CTAs verified: link to working `shared/contact.html`

## What Was Already Completed

- [x] All fake stars (`★★★★★`) removed from testimonial/review divs
- [x] All fake testimonial cards beyond TESTIMONIAL_1 slot removed
- [x] All `via Google`, `via Yelp`, `Verified Purchase` attributions removed
- [x] All `4.9★`, `5★`, `500+`, `847+`, `1,200+`, `2,500+` invented metrics removed
- [x] Free trial sections, forms, and JS handlers removed from gym templates
- [x] Haiku prompt HONESTY RULES block added (templateEngine.ts)
- [x] LLM fallback HONESTY RULES already present (siteGenerator.ts)
- [x] `brief.appUrl` in siteGenerator.ts strips `/portal` suffix (P0-D fix)
- [x] Hero social proof fixed (restaurant and service templates)
- [x] `contractor/dark-industrial.html` fake testimonial cards replaced with TESTIMONIAL_1 slot

## Frozen Systems (do not touch)

- Lead engine (leadGen*.ts)
- Rep ecosystem (repEcosystem.ts, rep/ pages)
- Sales Academy
- X/Twitter growth engine
- Social media scheduling
- Broadcasts
- Auto-domain registration
- Auto-payout

## First Customer Status

**NO.** Quality Lab has not been rerun with live generation on the fixed codebase. Admin credentials (Railway CLI) must be restored to trigger generation.

## Public Launch Status

**NO.** Contact forms broken. Quality Lab not passed.

## Definition of Done (for first controlled customer)

1. Contact Flow P0 Repair Gate complete
2. All template forms use `APP_URL_PLACEHOLDER/api/contact-submit` (no Formspree, no `return false`)
3. `pnpm check` passes
4. `pnpm build` passes
5. Committed and pushed
6. Railway deploy confirmed
7. Quality Lab rerun triggered (requires `railway login` to restore CLI access)
8. All 5 sites score 95+/100
9. Zero P0 fake proof
10. Zero broken contact forms
11. Admin explicitly approves first customer
