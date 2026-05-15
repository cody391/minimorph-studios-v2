# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## Active Blockers

### B4 — Anthropic API Credit Balance Insufficient

**Severity:** P0 — blocks all AI copy generation and LLM fallback generation
**Status:** OPEN
**Discovered:** 2026-05-15 Production End-to-End Generation Test

#### Symptom

Production test (generation triggered via Railway admin API flow) produced:
- GreenLeaf Landscaping (LLM fallback): `400 Bad Request — "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."`
- Apex Roofing, Luxe + Bare Studio, FitForge CrossFit: HEADLINE, SUBHEADLINE, TAGLINE tokens unreplaced in generated HTML — Haiku copy generation failed silently (returns `{}` on API error)

#### Root Cause

Anthropic API account has insufficient prepaid credits. All API calls (both Haiku for copy generation and Sonnet for LLM fallback) fail with a 400 credit balance error.

#### Fix Required

Top up Anthropic API credits at `https://console.anthropic.com` → Plans & Billing. Once credits are added, re-run the production end-to-end generation test.

#### Impact

Blocks generation quality for ALL customers until resolved. Template content checks (no fake proof, correct form endpoints) passed — only the AI copy generation is blocked.

---

### B1 — Quality Lab Incomplete: Anthropic API Unreachable from `railway run` Test Context

**Severity:** P1 — SUPERSEDED by B4
**Status:** CLOSED — root cause resolved by switching to production admin API flow
**Discovered:** 2026-05-15 Live Quality Lab run

#### Resolution

Production End-to-End Generation Test (2026-05-15) proved that generating via the Railway admin API flow (HTTP requests to production server) works correctly — the Anthropic API IS reachable from the Railway server. The local `railway run` context was the problem, not the production environment. B4 (Anthropic credit balance) is the new blocking issue.

---

### B2 — ecommerce/product.html: `return false` in Form Handler

**Severity:** P1 for ecommerce customers (not currently in Quality Lab test set)
**Status:** OPEN
**Discovered:** 2026-05-15 global template form grep

#### Symptom

`server/templates/ecommerce/product.html` line 741 contains `return false;` in a form handler. This would prevent the form from submitting to the correct endpoint.

#### Fix Required

Fix the ecommerce/product.html form to use the JS fetch handler pattern posting to `APP_URL_PLACEHOLDER/api/contact-submit`, consistent with all other templates.

#### Impact

Blocks ecommerce customers. Does NOT affect the 5 Quality Lab test businesses (roofing, restaurant, salon, gym, landscaping).

---

### B3 — Admin Credentials Not in Local .env

**Severity:** P2 — blocks local development testing only
**Status:** OPEN

Cannot test admin-gated procedures locally. Production admin login works via Railway env vars.

---

## Resolved Blockers

| Issue | Fix | Commit |
|---|---|---|
| `brief.appUrl` included `/portal` suffix → forms posted to `/portal/api/contact-submit` | Stripped `/portal` in siteGenerator.ts | `f1f67c5` |
| Haiku generated fake metrics (847+ members, free trials) | Added HONESTY RULES block to Haiku prompt | `f1f67c5` |
| Template HTML contained fake star ratings in content divs | Removed all `★★★★★` from content sections across all templates | `f1f67c5` |
| Hero social proof invented fake superlatives | Replaced with token-based copy | `f1f67c5` |
| Fake testimonial cards in contractor/dark-industrial.html | Replaced with TESTIMONIAL_1 slot | `b947256` |
| Fake testimonial slots 2+3 in salon, ecommerce, boutique, service templates | Removed | `88c1425` |
| Invented trust stats (500+, 1,200+, 4.9★) | Removed | `88c1425` |
| Free trial section in gym/bold-energetic.html | Removed | `88c1425` |
| Formspree placeholders and `onsubmit="return false;"` in 9 templates | Replaced with JS fetch handler | `0c1440d` |
| Railway CLI unauthorized | User ran `railway login` | — |
| **P1-A** contractor: hardcoded GC services and gallery captions | Tokenized to SERVICE_1–6_DESC; captions removed | `86105c5` |
| **P1-B** restaurant/warm-casual: hardcoded menu prices and order.html link | Tokenized; order.html links removed | `86105c5` |
| **P1-C** salon/editorial-luxury: exclusivity claim, $185–$800 prices, fake Senior Stylist, broken contact link | All removed; contact added to INDUSTRY_PAGES | `86105c5` |
| **P1-D** gym: $89/$129/$199 pricing, fake Coach Alex/Jordan/Sam, invented credentials, broken footer links | All removed/neutralized | `86105c5` |
| **P1-E** LLM fallback: form endpoint not in buildCustomTemplatePrompt() | Added required fetch pattern | `86105c5` |
| **P2** boutique/warm-lifestyle: Summer Sale banner | Removed | `86105c5` |
| restaurant/menu.html: hardcoded food items and drink prices | Replaced with SERVICE tokens + neutral CTA | `8f11c2b` |
| gym/classes.html: $25/$149/$199 pricing grid and calorie claim | Replaced with neutral membership CTA | `8f11c2b` |

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
