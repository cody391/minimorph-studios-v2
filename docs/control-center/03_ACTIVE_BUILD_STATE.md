# 03 — Active Build State

**Last updated: 2026-05-15**

## Current Project

MMV4 — MiniMorph Studios Website Generator

## Active Lane

**MiniMorph Internal Dogfood** — Service template routing repaired + B5 contractor language removed. service/professional.html is now contextually neutral for all service/agency businesses. Project 34 reset with MiniMorph truth data is the next step before generation.

Previous lanes completed:
- Contact Flow P0 Repair Gate ✅
- Quality Lab Template Truth Repair ✅
- Deploy Confirmed (61c8f14 proven live at 07:42:58 GMT) ✅
- Production generation test — failed (Anthropic credits) ⚠️ → credits topped up → **PASSED 5/5 ✅**
- Customer Portal Reality Patch ✅ (BuildCommandCenter, tab reorder, safe empty states, CheckoutSuccess rewrite, E2E tests)
- Service Template Routing Repair ✅ (selectTemplate service/agency branch, 37 routing tests, P0 guarantee fix)
- B5 Service Template Content Repair ✅ (contractor-specific language removed from service/professional.html)

## Latest Known Commit

| Field | Value |
|---|---|
| HEAD | `aaaa3ac` |
| Branch | `main` |
| origin/main | `eac497e` |
| Message | fix: route service businesses to professional template |
| Production URL | https://www.minimorphstudios.net |
| Railway project | `fabulous-dedication` / service `minimorph-studios-v2` |
| Production deploy confirmed | `2026-05-15 07:42:58 GMT` ✅ |

## Production End-to-End Generation Test Rerun (2026-05-15)

**Result: PASSED — 5/5 sites, 100/100 each**

### What ran

Admin API flow executed via Railway (generation on server): 5 fresh projects created → questionnaires saved → blueprints approved → generation triggered → polled for completion → scored against `06_QUALITY_RULES.md`.

Projects: IDs 46 (Apex Roofing), 47 (Rosa's Kitchen), 48 (Luxe + Bare Studio), 49 (FitForge CrossFit), 50 (GreenLeaf Landscaping).

### Per-site results

| Business | Pages | Score | Status | Hero H1 |
|---|---|---|---|---|
| Apex Roofing (contractor/dark-industrial) | 9 | 100/100 | ✅ PASS | "Roofs and exteriors that actually last" |
| Rosa's Kitchen (restaurant/warm-casual) | 7 | 100/100 | ✅ PASS | "Real food made today in Austin" |
| Luxe + Bare Studio (salon/editorial-luxury) | 8 | 100/100 | ✅ PASS | "Refined salon services for Austin professionals" |
| FitForge CrossFit (gym/bold-energetic) | 7 | 100/100 | ✅ PASS | "Earn your strength. Every rep." |
| GreenLeaf Landscaping (LLM fallback) | 5 | 100/100 | ✅ PASS | "Your yard. Exactly as it'll look." |

### What was verified

- No fake coaches, fake team members, fake credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- No Formspree, return false, portal/api ✅
- Form endpoints: `https://www.minimorphstudios.net/api/contact-submit` ✅
- businessName in form payloads ✅
- APP_URL_PLACEHOLDER fully replaced ✅
- HEADLINE, SUBHEADLINE, TAGLINE all replaced with genuine AI-generated copy ✅
- restaurant/menu.html: CLEAN (no hardcoded dishes/prices) ✅
- gym/classes.html: CLEAN (no $25/$149/$199 grid, no calorie claims) ✅
- GreenLeaf LLM fallback: 5 pages generated, "GreenLeaf" appears in content, no bracket placeholders ✅

---

## Required Next Step

**First Controlled Customer** — system is ready. Admin must approve and onboard first real customer.

## First Customer Status

**YES — pending admin approval.** Production generation test passed 5/5 (100/100). No code changes required.

## Public Launch Status

**NO — first controlled customer must complete onboarding successfully before public launch.**

## What Was Already Completed

- [x] Service Template Routing Repair — service/agency/consulting/technology/cleaning/landscaping businesses now route to `service/professional.html` instead of LLM fallback ✅
- [x] B5 Service Template Content Repair — removed all contractor-specific language from service/professional.html ("job site", "homeowners", "Licensed specialists", "Same-Day Available", "Weekends", LICENSE_NUMBER stat blocks) ✅
- [x] service/professional.html P0 fix — removed hardcoded "100% Satisfaction Guarantee" stat (quality rules violation) ✅
- [x] 37 routing tests covering all industry types added (`server/templateRouting.test.ts`) ✅
- [x] Customer Portal Reality Patch — newly paid customer can immediately understand what they bought, what happens next, where their site is, what to do next, and how to get help ✅
- [x] BuildCommandCenter component — stage card + 7-step progress timeline + "What You Purchased" + "Need Help?" two-column layout ✅
- [x] "Your Website" tab first (renamed from "Onboarding") with electric indicator dot ✅
- [x] PAGE_NAME_MAP: page selector shows "Home Page" instead of raw "index" ✅
- [x] Safe empty states: no 0/100 health score, "Reports begin after your website is live", "No updates yet — your build has just started" ✅
- [x] "Account Not Ready Yet" (non-alarming) state with Refresh button + email link ✅
- [x] CheckoutSuccess.tsx rewritten: clear steps, Elena mention, email fallback ✅
- [x] E2E test suite: 16 Playwright tests (portal-customer-experience.spec.ts) ✅
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
- [x] Production End-to-End Generation Test — 5/5 PASS, 100/100 per site ✅

## Frozen Systems (do not touch)

- Lead engine (leadGen*.ts)
- Rep ecosystem (repEcosystem.ts, rep/ pages)
- Sales Academy
- X/Twitter growth engine
- Social media scheduling
- Broadcasts
- Auto-domain registration
- Auto-payout
