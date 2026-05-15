# 08 — Change Log

**Only key commits that changed system behavior or fixed P0/P1 issues are listed here.**  
For full git history: `git log --oneline`

---

## `0c1440d` — Fix generated-site contact forms

**Date:** 2026-05-15  
**Gate:** Contact Flow P0 Repair Gate

**What changed:**
- `server/templates/shared/contact.html`: Removed Formspree action; converted to JS fetch handler posting to `APP_URL_PLACEHOLDER/api/contact-submit`; added hidden `businessName` field; added success/error UX
- `server/templates/contractor/contact.html`: Same fix; dark-theme success/error styling
- `server/templates/contractor/quote.html`: Same fix; quote-specific fields serialized into readable message string
- `server/templates/service/quote.html`: Same fix
- `server/templates/restaurant/reservations.html`: Same fix; reservation fields (date, time, party size, occasion, notes) serialized into readable message string
- `server/templates/service/professional.html`: Removed `onsubmit="return false;"`; added `name`/`id`/`required` attributes; added email field (was missing); wired to fetch handler
- `server/templates/boutique/warm-lifestyle.html`: Removed `onsubmit="return false;"` from email signup; wired to fetch handler with `message: "Newsletter/signup request."`
- `server/templates/boutique/minimal-editorial.html`: Discovered and fixed additional newsletter signup with `onsubmit="return false;"`
- `server/templates/service/friendly-local.html`: Discovered and fixed additional index contact form with `onsubmit="return false;"`; added email field (was missing); combined first/last name in JS

**What this proves:** All generated-site forms now POST lead data to `APP_URL_PLACEHOLDER/api/contact-submit`. Zero Formspree references. Zero `return false` handlers in templates. Zero `/portal/api/contact-submit` references. `pnpm check` and `pnpm build` pass.

**What this does NOT prove:** Live generation works (Railway CLI still unauthorized; Quality Lab not retested). Deployment confirmation pending Railway autodeploy of this push.

---

## `b947256` — Fix missed P0: replace fake testimonials in contractor/dark-industrial.html

**Date:** 2026-05-15  
**Gate:** 88c1425 Deploy Confirmation + Quality Lab Rerun Gate  

**What changed:**
- `server/templates/contractor/dark-industrial.html`: Replaced hardcoded fake testimonial section (Sarah M., James K., Linda R. with invented city-specific quotes) with single `TESTIMONIAL_1` slot

**What this proves:** Static template audit can catch fake proof that the initial star-removal pass missed.

**What this does NOT prove:** Live generation works (Railway CLI still unauthorized; Quality Lab not retested).

**New P0 discovered in this gate (not fixed, next gate):**
- Formspree placeholder forms in 5+ sub-page templates
- `onsubmit="return false;"` in service/professional.html and boutique/warm-lifestyle.html index forms

---

## `88c1425` — Deep fake-proof audit: remove fake testimonial cards, invented stats, free trial section

**Date:** 2026-05-15  
**Gate:** P0 Repair Deploy + Verification Gate  

**What changed:**
- `contractor/dark-industrial.html`: Removed `500+ Projects Completed`, `4.9★ Average Rating` from trust bar
- `boutique/warm-lifestyle.html`: Removed fake testimonial slots 2+3
- `salon/warm-boutique.html`: Removed fake review slots 2+3+4 with `via Google`/`via Yelp` attributions
- `ecommerce/catalog.html`: Removed fake testimonial slots 2+3 with `Verified Purchase`
- `service/professional.html`: Removed fake review slots 2+3; removed `5★ Google Reviews` + `5★ Avg. Customer Rating` from trust bar and about stats
- `service/friendly-local.html`: Removed fake review slots 2+3; replaced `200+` stat with "Trusted by Your Neighbors"
- `gym/bold-energetic.html`: Removed fake results section (`18 LBS / 94% / 500+ Active members`); removed entire `<section class="trial-section">` with free trial form and JS handler
- `salon/about.html`: Removed `4.9★` + `2,500+` invented stats
- `contractor/about.html`: Removed `500+` + `4.9★` invented stats
- `service/about.html`: Removed `1,000+` + `4.9★` invented stats
- `gym/about.html`: Removed `1,200+` + `5★` + `3 Certified Coaches` invented stats

**What this proves:** First pass (f1f67c5) only removed star characters; fake card content and invented stats remained. Second audit found and removed them.

**What this does NOT prove:** Live generation quality (not retested). Contact forms still broken (Formspree placeholders not yet fixed in this commit).

---

## `f1f67c5` — P0 repair: fix brief.appUrl, add Haiku honesty rules, remove fake stars from templates

**Date:** 2026-05-15  
**Gate:** P0 Repair Gate  

**What changed:**
- `server/services/siteGenerator.ts`: `brief.appUrl` now strips `/portal` suffix (P0-D fix)
- `server/services/templateEngine.ts`: Added HONESTY RULES block to Haiku prompt (P0-C fix)
- All template index files: Removed `★★★★★` from content/testimonial/review divs (P0-A fix)
- `service/friendly-local.html`: Hero social proof replaced (P0-B fix)
- `restaurant/warm-casual.html`: Hero social proof replaced (P0-B fix)
- `gym/bold-energetic.html`: `847+ members` stat block removed; `Start Free Trial` CTA → `Get Started Today`; free-trial.html links → contact.html
- `gym/clean-modern.html`: `Start Free Trial` → `Book a Class`; `First Class Free` → `Book a Drop-In`

**What this proves:** Star characters removed from content divs. Haiku prompt will no longer generate fake metrics. `appUrl` will no longer include `/portal`. Template path forms will generate correct endpoint.

**What this does NOT prove:** Full fake-proof completion (fake card content still present, found by next gate). Formspree sub-page forms still broken.

---

## Earlier Context (pre-control-center)

Earlier commits in git history (before f1f67c5) include:
- Platform wiring (support tickets, rep messages, broadcasts, lead popup)
- Lead engine overhaul (Yelp Fusion, Elena persona, intelligence card, self-close pipeline)
- Cost tracking system
- Elena AI intake agent
- Initial Railway deployment and Railway env var setup

These are frozen systems not relevant to the current active gate. See git log for details.

---

## How to Add a New Entry

When closing a gate, add an entry here with:

```
## `<commit hash>` — <commit subject>

**Date:** YYYY-MM-DD
**Gate:** <gate name>

**What changed:**
- bullet list of files and changes

**What this proves:** <what can be concluded from this commit>

**What this does NOT prove:** <what still needs verification>
```
