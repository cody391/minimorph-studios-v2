# 08 — Change Log

**Only key commits that changed system behavior or fixed P0/P1 issues are listed here.**
For full git history: `git log --oneline`

---

## Production End-to-End Generation Test Rerun — 2026-05-15 (PASSED 5/5)

**Result:** PASSED — 5/5 sites, 100/100 each
**Businesses tested:** 5 (projects 46–50)
**Method:** Admin API flow via Railway (generation ran on production server)

**Per-site results:**

| Business | Pages | Score | Hero H1 |
|---|---|---|---|
| Apex Roofing (contractor/dark-industrial) | 9 | 100/100 | "Roofs and exteriors that actually last" |
| Rosa's Kitchen (restaurant/warm-casual) | 7 | 100/100 | "Real food made today in Austin" |
| Luxe + Bare Studio (salon/editorial-luxury) | 8 | 100/100 | "Refined salon services for Austin professionals" |
| FitForge CrossFit (gym/bold-energetic) | 7 | 100/100 | "Earn your strength. Every rep." |
| GreenLeaf Landscaping (LLM fallback) | 5 | 100/100 | "Your yard. Exactly as it'll look." |

**All quality checks passed:**
- No unreplaced tokens (HEADLINE, SUBHEADLINE, TAGLINE, PHONE, EMAIL, ADDRESS, etc.) ✅
- No fake coaches, team members, credentials ✅
- No hardcoded prices, menu items, calorie claims ✅
- No exclusivity claims ✅
- Form endpoints correct (https://www.minimorphstudios.net/api/contact-submit) ✅
- businessName in form payloads ✅
- No Formspree / return false / portal/api ✅
- restaurant/menu.html CLEAN ✅
- gym/classes.html CLEAN ✅
- GreenLeaf LLM fallback: genuine content, no bracket placeholders ✅

**What proved:** System is fully production-ready. Anthropic API credits restored. All 5 Quality Lab businesses generate clean sites with genuine AI copy.

**Blockers closed:** B4 (Anthropic API credits insufficient).

**Gate advanced to:** First Controlled Customer — pending admin approval.

---

## Production End-to-End Generation Test — 2026-05-15 (FAILED — API credits)

**Result:** FAILED — Anthropic API credit balance insufficient
**Businesses tested:** 5 (projects 41–45)
**Method:** Admin API flow via Railway (generation ran on production server)

**Per-site results:**

| Business | Generated? | Score | Failure |
|---|---|---|---|
| Apex Roofing (contractor/dark-industrial) | Yes — 9 pages | 60/100 | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| Rosa's Kitchen (restaurant/warm-casual) | No — timeout (>10 min) | 0/100 | Stuck in retry loop (API failures) |
| Luxe + Bare Studio (salon/editorial-luxury) | Yes — 8 pages | 60/100 | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| FitForge CrossFit (gym/bold-energetic) | Yes — 7 pages | 60/100 | HEADLINE, SUBHEADLINE, TAGLINE unreplaced |
| GreenLeaf Landscaping (LLM fallback) | No — 400 error | 0/100 | "credit balance is too low" explicit error |

**Root cause:** Anthropic API account has insufficient prepaid credits. Haiku copy generation failed silently (→ `{}`), leaving copy tokens unreplaced. Sonnet LLM fallback (GreenLeaf) failed with explicit 400.

**Template content verified CLEAN** in generated output (3 sites with partial HTML):
- No fake coaches, team members, credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- Form endpoints correct ✅
- APP_URL_PLACEHOLDER replaced ✅
- No Formspree / return false / portal/api ✅

**What proved:** Production admin API flow works. Generation runs on Railway server. Anthropic API IS reachable from Railway. The local `railway run` IPv6 connectivity issue (B1) is irrelevant.

**What still needs verification:** HEADLINE / SUBHEADLINE / TAGLINE replacement; Rosa's Kitchen generation; GreenLeaf LLM fallback.

**Fix:** Top up Anthropic API credits at console.anthropic.com.

---

## `61c8f14` — docs: align Control Center with template truth repairs

**Date:** 2026-05-15
**Gate:** Docs Alignment + Push + Deploy Gate

**What changed:** Docs-only. Updated all 4 Control Center files to record that P1-A through P1-E template blockers are resolved in `86105c5` and `8f11c2b`. Advanced active gate to Deploy Confirmed + Live Quality Lab Rerun. Set first customer status to NO pending Quality Lab.

**What this proves:** Control Center aligned with git state. Push and deploy to origin/main and Railway confirmed.

**What this does NOT prove:** Quality Lab pass (not yet completed).

---

## Live Quality Lab Run — 2026-05-15 (INCOMPLETE)

**Result:** INCOMPLETE — Anthropic API unreachable from `railway run` local test context
**Businesses tested:** 5 (Apex Roofing, Rosa's Kitchen, Luxe + Bare Studio, FitForge CrossFit, GreenLeaf Landscaping)
**Sites fully generated:** 3 (Apex Roofing, Luxe + Bare Studio, FitForge CrossFit)
**Sites failed to generate:** 2 (Rosa's Kitchen — fetch failed; GreenLeaf — 0 chars from LLM)

**Root cause:** `railway run` executes code locally where Anthropic API is unreachable via IPv6. Not a production bug.

**Template content verified CLEAN** in generated output (3 sites):
- No fake coaches, team members, credentials ✅
- No hardcoded prices ✅
- No hardcoded menu items ✅
- No exclusivity claims ✅
- Form endpoints correct (https://www.minimorphstudios.net/api/contact-submit) ✅
- businessName in payloads ✅
- No Formspree / return false / portal/api ✅

**Remaining gap:** HEADLINE / SUBHEADLINE / TAGLINE copy generation unverified (API was unreachable). Must be confirmed via production web-flow test.

**Additional finding:** `server/templates/ecommerce/product.html:741` contains `return false` form handler — logged as blocker B2, does not affect current 5 test businesses.

---

## `8f11c2b` — fix: remove invented pricing and menu content from subpages

**Date:** 2026-05-15
**Gate:** Quality Lab Template Truth Repair — Sub-Pages

**What changed:**
- `server/templates/restaurant/menu.html`: Removed all hardcoded food items (House Charcuterie Board, Crispy Fried Artichokes, Pan-Seared Lake Fish, Braised Short Rib, Vegetable Risotto, Pasta of the Day, Truffle Fries, Chocolate Pot de Crème, Cheese Selection, etc.) and all drink price ranges ($4–$22). Removed entire sticky category nav (Starters/Mains/Sides/Desserts/Drinks tabs). Replaced content with SERVICE_1–6_DESC tokens and a neutral "See Our Full Menu" CTA with `tel:PHONE` and `reservations.html` links.
- `server/templates/gym/classes.html`: Removed $25/class Drop-In, $149/month Unlimited ("Most Popular"), and $199 10-Class Pack pricing grid. Replaced with neutral membership CTA pointing to `contact.html`. Removed hardcoded calorie claim (🔥 450–600 cal) from first class card meta.

**What this proves:** All sub-page template content is now token-based or neutral. No hardcoded prices, dishes, or calorie claims remain in any restaurant or gym template.

**What this does NOT prove:** Live Quality Lab pass. The Quality Lab rerun must be executed against the deployed codebase to confirm 5/5 sites score 95+/100.

---

## `86105c5` — fix: remove invented template content and unsafe fallback forms

**Date:** 2026-05-15
**Gate:** Quality Lab Template Truth Repair — Main Templates

**What changed:**
- `contractor/dark-industrial.html`: Tokenized 6 service cards to SERVICE_1–6_DESC; removed hardcoded gallery city names and project types
- `contractor/gallery.html`: All 12 gallery cards cleaned of hardcoded city/project captions; replaced with SERVICE tokens + SERVICE_AREA
- `restaurant/warm-casual.html`: Removed "House Burger $18", "Sunday Brunch Plate $16", "Chef's Daily Special — Market Price"; removed `order.html` links; replaced with SERVICE tokens
- `salon/editorial-luxury.html`: Removed "The only certified studio in SERVICE_AREA" exclusivity claim; removed all 5 hardcoded prices ($185/$800/$250/$75/$300); removed fake Senior Stylist card
- `salon/about.html`: Removed 3 fake team member cards (Senior Stylist, Stylist/Cuts & Texture, Junior Stylist)
- `gym/bold-energetic.html`: Tokenized program cards; removed fake Coach Alex, Coach Jordan, Coach Sam; neutralized $89/$129/$199 pricing grid to neutral CTA; fixed footer links (pricing.html/schedule.html → contact.html/classes.html)
- `gym/clean-modern.html`: Same fake coach and pricing fixes; fixed hero CTA (schedule.html → classes.html)
- `gym/about.html`: Removed fake Lead Coach and Recovery Coach trainer cards; removed invented credentials
- `boutique/warm-lifestyle.html`: Removed hardcoded "Summer Sale — Up to 40% off!" seasonal banner div
- `server/services/templateEngine.ts`: Added "contact" to gym and salon INDUSTRY_PAGES; added required JS fetch pattern with `APP_URL_PLACEHOLDER/api/contact-submit` to `buildCustomTemplatePrompt()`

**What this proves:** All main template P1-A through P1-E blockers resolved. No fake team members, exclusivity claims, hardcoded prices, wrong services, or LLM form endpoint gaps remain in hand-crafted templates.

**What this does NOT prove:** Live Quality Lab pass (not yet retested). Sub-page content (menu.html, classes.html) — fixed separately in `8f11c2b`.

---

## `9e2061d` — docs: record Quality Lab template truth blockers

**Date:** 2026-05-15
**Gate:** Quality Lab Gate (static audit result)

**What changed:** Docs-only. Updated `03_ACTIVE_BUILD_STATE.md`, `07_KNOWN_BLOCKERS.md`, and `10_NEXT_ACTION.md` to record the 0/5 Quality Lab static audit result and enumerate P1-A through P1-E blockers per template.

---

## `97a8634` — Update Control Center: close Contact Flow P0 Repair Gate, advance to Quality Lab

**Date:** 2026-05-15
**Gate:** Contact Flow P0 Repair Gate → Quality Lab Gate transition

**What changed:** Docs-only. Marked Contact Flow P0 gate DONE. Recorded deployment confirmation. Advanced active lane to Quality Lab Gate.

---

## `0c1440d` — Fix generated-site contact forms

**Date:** 2026-05-15
**Gate:** Contact Flow P0 Repair Gate

**What changed:**
- `server/templates/shared/contact.html`: Removed Formspree action; converted to JS fetch handler posting to `APP_URL_PLACEHOLDER/api/contact-submit`; added hidden `businessName` field; added success/error UX
- `server/templates/contractor/contact.html`: Same fix; dark-theme success/error styling
- `server/templates/contractor/quote.html`: Same fix; quote-specific fields serialized into readable message string
- `server/templates/service/quote.html`: Same fix
- `server/templates/restaurant/reservations.html`: Same fix; reservation fields serialized into readable message string
- `server/templates/service/professional.html`: Removed `onsubmit="return false;"`; added email field; wired to fetch handler
- `server/templates/boutique/warm-lifestyle.html`: Removed `onsubmit="return false;"` from email signup; wired to fetch handler
- `server/templates/boutique/minimal-editorial.html`: Fixed additional newsletter signup with `onsubmit="return false;"`
- `server/templates/service/friendly-local.html`: Fixed additional index contact form; added email field

**What this proves:** All generated-site forms POST to `APP_URL_PLACEHOLDER/api/contact-submit`. Zero Formspree. Zero `return false`. Zero `/portal/api/contact-submit`.

---

## `b947256` — Fix missed P0: replace fake testimonials in contractor/dark-industrial.html

**Date:** 2026-05-15

**What changed:** `contractor/dark-industrial.html`: Replaced fake testimonials (Sarah M., James K., Linda R.) with single TESTIMONIAL_1 slot.

---

## `88c1425` — Complete fake proof removal after P0 repair audit

**Date:** 2026-05-15

**What changed:** Removed fake testimonial slots 2+3 from boutique, salon, ecommerce, service templates; removed invented trust stats (500+, 1,200+, 4.9★) from trust bars and about pages across contractor, gym, salon, service templates; removed free trial section and JS handler from gym/bold-energetic.html.

---

## `f1f67c5` — P0 repair: fix brief.appUrl, add Haiku honesty rules, remove fake stars from templates

**Date:** 2026-05-15

**What changed:** `brief.appUrl` strips `/portal` suffix. Haiku prompt HONESTY RULES block added. `★★★★★` removed from all content divs. Hero social proof replaced in restaurant and service templates. `847+ members` stat block removed from gym/bold-energetic.html.

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
