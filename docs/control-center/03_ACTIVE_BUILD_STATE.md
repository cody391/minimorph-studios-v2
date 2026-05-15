# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Deploy Confirmed + Live Quality Lab Rerun** — awaiting deployment of `8f11c2b` and live Quality Lab rerun

Previous lanes completed:
- Contact Flow P0 Repair Gate ✅
- Quality Lab Template Truth Repair ✅

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `8f11c2b` |
| Branch | `main` |
| origin/main | `8f11c2b` (after push) |
| Message | fix: remove invented pricing and menu content from subpages |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |
| Production deploy confirmed | pending — `8f11c2b` pushed, deploy in progress |

## Template Truth Repair — Completed Commits

All P1 template content blockers have been resolved across two commits:

### `86105c5` — Main template truth repair (on origin/main as of prior session)

- `contractor/dark-industrial.html` — Tokenized 6 service cards (SERVICE_1–6_DESC); removed hardcoded gallery city names and project types
- `contractor/gallery.html` — All 12 gallery cards cleaned of hardcoded captions
- `restaurant/warm-casual.html` — Removed hardcoded menu items and prices; replaced with SERVICE tokens; removed `order.html` links
- `salon/editorial-luxury.html` — Removed exclusivity claim; removed all 5 hardcoded prices; removed fake Senior Stylist card; fixed broken contact link (added "contact" to INDUSTRY_PAGES)
- `salon/about.html` — Removed 3 fake team member cards
- `gym/bold-energetic.html` — Tokenized program cards; removed fake Coach Alex/Jordan/Sam; neutralized hardcoded pricing grid; fixed broken footer links (pricing.html/schedule.html → contact.html/classes.html)
- `gym/clean-modern.html` — Same fake coach and pricing fixes
- `gym/about.html` — Removed fake Lead Coach and Recovery Coach cards
- `boutique/warm-lifestyle.html` — Removed hardcoded Summer Sale seasonal banner
- `server/services/templateEngine.ts` — Added "contact" to gym and salon INDUSTRY_PAGES; added required fetch form pattern to `buildCustomTemplatePrompt()`

### `8f11c2b` — Sub-page template truth repair

- `restaurant/menu.html` — Removed all hardcoded food items (charcuterie, fish, short rib, risotto, tart, etc.) and all drink price ranges; replaced with SERVICE_1–6_DESC tokens + neutral "See Our Full Menu" CTA
- `gym/classes.html` — Removed $25/$149/$199 pricing grid and "Most Popular" badge; replaced with neutral membership CTA → contact.html; removed hardcoded calorie claim (450–600 cal)

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
- [x] Railway CLI authenticated
- [x] All P1 template content blockers resolved (`86105c5` + `8f11c2b`)
- [x] `pnpm check` passes ✅
- [x] `pnpm build` passes ✅
- [x] `8f11c2b` pushed to origin/main ✅

## Current Blocker

**Live Quality Lab rerun not yet run.** All template repairs are complete and deployed. The Quality Lab has not been re-executed against the repaired codebase to confirm 5/5 sites score 95+/100.

## First Customer Status

**NO.** Live Quality Lab rerun has not passed. Must confirm 5/5 sites score 95+/100 before first customer delivery.

## Public Launch Status

**NO.** Quality Lab rerun not yet passed.

## Definition of Done (for first controlled customer)

1. Contact Flow P0 Repair Gate complete ✅
2. All template forms use `APP_URL_PLACEHOLDER/api/contact-submit` ✅
3. `pnpm check` passes ✅
4. `pnpm build` passes ✅
5. Committed and pushed ✅ (`8f11c2b`)
6. Railway deploy confirmed ✅ (in progress)
7. **[NEXT]** Live Quality Lab rerun — all 5 sites score 95+/100
8. Zero P0 fake proof ✅ (verified by static audit)
9. Zero broken contact forms ✅
10. Admin explicitly approves first customer

## Frozen Systems (do not touch)

- Lead engine (leadGen*.ts)
- Rep ecosystem (repEcosystem.ts, rep/ pages)
- Sales Academy
- X/Twitter growth engine
- Social media scheduling
- Broadcasts
- Auto-domain registration
- Auto-payout
