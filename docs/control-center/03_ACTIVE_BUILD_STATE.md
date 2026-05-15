# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Contact Flow P0 Repair** (immediately follows fake proof removal)

Previous lane completed: Fake Proof Removal (Quality Lab P0 Repair)

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `b947256` |
| Branch | `main` |
| origin/main | `b947256` |
| Message | Fix missed P0: replace 3 fake testimonials in contractor/dark-industrial.html |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |

## Current Blocker (P0)

**Generated contact/quote/reservation forms POST to broken endpoints.**

Specific broken files:
- `server/templates/shared/contact.html` — `action="https://formspree.io/f/placeholder"` (used as contact sub-page for gym, service, and others)
- `server/templates/contractor/contact.html` — Formspree placeholder
- `server/templates/contractor/quote.html` — Formspree placeholder
- `server/templates/service/quote.html` — Formspree placeholder
- `server/templates/restaurant/reservations.html` — Formspree placeholder
- `server/templates/service/professional.html` — index page form `onsubmit="return false;"` (non-functional)
- `server/templates/boutique/warm-lifestyle.html` — email signup `onsubmit="return false;"` (non-functional)
- `server/templates/gym/bold-energetic.html` — no index contact form; all CTAs link to broken `shared/contact.html`

Effect: Every customer whose site uses these templates has zero working contact path.

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
