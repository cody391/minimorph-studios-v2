# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## Active Blockers

### B6 — Blueprint Schema Gap

**Severity:** P0 — blocks first outside customer
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

The current `blueprintJson` stored in the database does not include all 9 sections required by the Elena Master Baseline:
- Business Identity *(partial)*
- Offer Strategy *(partial)*
- Customer Psychology *(missing or partial)*
- Positioning *(missing)*
- Website Strategy *(partial)*
- Media / Visuals *(missing)*
- Risk / Compliance *(missing)*
- Generator Instructions *(missing — generator receives SiteBrief, not Blueprint)*
- Add-On / Upsell Fit *(missing entirely)*

#### Fix Required

Extend `blueprintJson` schema to include all 9 sections. Update Elena's prompt to populate them. Update the generator to consume them.

#### Impact

Without a complete Blueprint schema, Elena cannot fully capture what she learns, the generator cannot fully use what Elena collected, and admin cannot verify truth before generation.

---

### B7 — Admin Blueprint Gate Missing

**Severity:** P0 — blocks first outside customer
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

There is no hard gate requiring admin to review and approve the Blueprint before generation begins. The current admin review is either passive (admin can view) or bypassed (generation can be triggered without admin approval of Blueprint fields).

#### Fix Required

Add a hard `adminBlueprintApprovedAt` gate. Generation must be blocked until admin explicitly approves the Blueprint. Admin must be able to edit Blueprint fields, flag risk items, and send back to Elena/customer if needed.

#### Impact

Without a hard admin gate, wrong, false, or legally risky information in the Blueprint can flow directly into generated HTML and be delivered to customers.

---

### B8 — Claim / Proof Validation Missing

**Severity:** P0 — creates legal/trust risk
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

Claims, credentials, testimonials, certifications, guarantees, and proof items collected by Elena are not explicitly validated or flagged for admin review. The generator may use them without a source-of-truth check. Some template fallbacks can still produce unvalidated claim language.

#### Fix Required

Add a Claims/Proof section to the Blueprint. Each claim must have a source (customer-provided, skipped, admin-verified). Generator must treat unverified claims as either blank or flagged. Admin review must show all claims with their source status.

#### Impact

MiniMorph could publish false testimonials, invented credentials, or unsupported guarantees on customer websites.

---

### B9 — Add-On Truth / Fulfillment Gap

**Severity:** P1 — creates broken promises risk
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

Elena may mention or recommend add-ons (ecommerce, booking, SEO, photography, etc.) that the platform cannot fully fulfill. There is no structured `recommendedAddOns` / `acceptedAddOns` / `declinedAddOns` storage in the Blueprint. There is no end-to-end check that verifies a recommended add-on is supported by billing, portal, admin, and generator before Elena offers it.

#### Fix Required

Add the Add-On / Upsell Fit section to the Blueprint schema. Add a platform fulfillment registry that maps each add-on to its implementation status. Elena must only recommend add-ons whose `generatorSupported` and `billingSupported` flags are true.

#### Impact

Elena could recommend ecommerce to a customer, customer accepts, billing charges for it, and the platform cannot fulfill it. This breaks trust and may constitute a false promise.

---

### B10 — Customer Blueprint Approval Gap

**Severity:** P1 — blocks truth alignment
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

Customers currently have no mechanism to view, correct, or approve the structured Blueprint that Elena assembled from their conversation. The customer portal shows build stages but not the business truth Elena recorded. A customer cannot say "that's not what I said" before generation begins.

#### Fix Required

Add a Blueprint review step to the customer portal. Customer must be able to read the structured summary of what Elena understood, correct any errors, and explicitly approve before generation. This approval must be recorded and versioned.

#### Impact

Without customer Blueprint approval, MiniMorph may generate a website based on misunderstood or incorrect information with no consent record.

---

### B11 — Blueprint → Generator Instruction Gap

**Severity:** P1 — reduces generation quality and truth
**Status:** OPEN
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit

#### Symptom

The generator receives a `SiteBrief` object that does not carry the full Blueprint structure. Fields like customer psychology, buyer fears, trust triggers, do-not-say list, banned phrases, safe claims, risky claims, and CTA rules are not explicitly passed from Blueprint to generator prompt. The generator prompt is constructed from a limited SiteBrief, not from the rich Blueprint Elena assembled.

#### Fix Required

Extend `SiteBrief` or create a `BlueprintHandoff` object that carries all Blueprint sections into the generator. Update `buildCustomTemplatePrompt()` to consume all relevant Blueprint fields. Add QA checks that verify Blueprint-sourced instructions appear in generated HTML.

#### Impact

Without a complete Blueprint → generator handoff, Elena's rich intake work does not translate into better, more truthful websites. The system is no smarter than a questionnaire.

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
| **B1** Quality Lab: Anthropic API unreachable from `railway run` test context | Switched to production admin API flow (HTTP requests to Railway server) | — |
| **B4** Anthropic API credit balance insufficient — blocked HEADLINE/SUBHEADLINE/TAGLINE generation and LLM fallback | Credits topped up; production rerun passed 5/5 (100/100) | — |
| **B5** service/professional.html: contractor-specific language ("job site", "homeowners", "Licensed specialists", "Same-Day Available", "Weekends", LICENSE_NUMBER stat) — wrong context for service/agency businesses | Replaced with generic service language; removed trade-specific stat blocks and tags | `2850228` |

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
