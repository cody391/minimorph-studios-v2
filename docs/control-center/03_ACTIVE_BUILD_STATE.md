# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**Quality Lab Gate** — BLOCKED on template content issues

Previous lane completed: Contact Flow P0 Repair Gate ✅

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `97a8634` |
| Branch | `main` |
| origin/main | `97a8634` |
| Message | Add MMV4 control center documentation |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |
| Production deploy confirmed | `2026-05-15 01:00:34 -04:00` (Railway) ✅ |

## Current Blocker (P1)

**Quality Lab static audit: 0/5 sites pass 95/100 standard.**

Template content issues across 4 templates — hardcoded generic service names, invented prices, fake team members, and broken page links. See `07_KNOWN_BLOCKERS.md` for per-template details.

No P0 form violations. No P0 fake-star or fake-count violations.

### Summary of Quality Lab Scores (2026-05-15 static audit)

| Business | Template | Score | Key Issues |
|---|---|---|---|
| Apex Roofing | `contractor/dark-industrial.html` | ~87/100 | Hardcoded GC services + gallery captions (wrong for roofing) |
| Rosa's Kitchen | `restaurant/warm-casual.html` | ~90/100 | Hardcoded menu prices; order.html broken link |
| Luxe + Bare Studio | `salon/editorial-luxury.html` | ~78/100 | Exclusivity claim; invented prices; fake team member; broken contact link |
| FitForge CrossFit | `gym/bold-energetic.html` | ~79/100 | Invented pricing; fake coaches; invented owner credentials |
| GreenLeaf Landscaping | LLM fallback | N/A | Cannot assess statically; form endpoint gap in LLM prompt |

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
- [x] Production deployment confirmed (`97a8634` at `01:00:34 EDT`)
- [x] Railway CLI authenticated (user ran `railway login`)

## What Must Be Fixed Before Quality Lab Can Pass

Ranked by impact:

1. **salon/editorial-luxury.html** — Remove exclusivity claim, tokenize/remove prices, remove fake Senior Stylist, fix broken contact link [P1-C]
2. **gym/bold-energetic.html** — Tokenize pricing section, replace fake Coach Alex/Jordan, remove invented owner credentials, fix broken footer links [P1-D]
3. **contractor/dark-industrial.html** — Tokenize service section (h3/p pairs), remove hardcoded gallery city/project captions [P1-A]
4. **restaurant/warm-casual.html** — Remove hardcoded menu prices, fix order.html broken link [P1-B]
5. **LLM fallback prompt** — Add APP_URL_PLACEHOLDER form endpoint to `buildCustomTemplatePrompt()` [P1-E]
6. **boutique/warm-lifestyle.html** — Remove hardcoded seasonal banner (P2 but needed before boutique customers) [P2]

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

**NO.** Quality Lab has not passed. 0/5 sites meet the 95/100 standard. Template content fixes required first.

## Public Launch Status

**NO.** Quality Lab not passed.

## Definition of Done (for first controlled customer)

1. Contact Flow P0 Repair Gate complete ✅
2. All template forms use `APP_URL_PLACEHOLDER/api/contact-submit` ✅
3. `pnpm check` passes ✅
4. `pnpm build` passes ✅
5. Committed and pushed ✅
6. Railway deploy confirmed ✅
7. **[BLOCKED]** Quality Lab rerun — all 5 sites score 95+/100
   - Requires fixing 5 template content issues first (see `07_KNOWN_BLOCKERS.md`)
8. Zero P0 fake proof
9. Zero broken contact forms
10. Admin explicitly approves first customer
