# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## Active Blockers

### B6 — Blueprint Schema Gap

**Severity:** P0 — blocks first outside customer
**Status:** RESOLVED (`feat: extend Customer Reality Blueprint schema`)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Blueprint Schema Gate

#### What was fixed

- `shared/blueprintTypes.ts` (NEW): Full `CustomerRealityBlueprint` TypeScript type with all 9 required sections, derivation helpers, add-on fulfillment registry, completeness scorer.
- `server/routers.ts`: `buildBlueprintFromQuestionnaire()` updated to output all 9 sections (businessIdentity, offerStrategy, customerPsychology, positioning, websiteStrategy, mediaVisuals, riskCompliance, generatorInstructions, addOnUpsellFit) plus metadata. All legacy keys preserved.
- `server/blueprintSchema.test.ts` (NEW): 85 tests covering 9-section presence, legacy key backward compat, industry/risk derivation, add-on fulfillment, claim doctrine fields.
- All 85 blueprint tests + 38 Elena safety tests pass. pnpm check clean. pnpm build PASS.

#### Remaining gaps (still require later gates)

- B7: Admin must review/approve Blueprint before generation fires — gate not yet built.
- B8: Claims/proof source tracking not yet wired — fields exist in schema but Elena does not yet populate them.
- B9: Add-on fulfillment not yet built — schema captures accepted add-ons with team_setup status.
- B10: Customer Blueprint approval UI does not yet show all 9 sections — only legacy fields shown.
- B11: RESOLVED — generator now receives full Blueprint via BlueprintGeneratorHandoff.

---

### B7 — Admin Blueprint Gate Missing

**Severity:** P0 — blocks first outside customer
**Status:** RESOLVED (B7 commit)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Admin Blueprint Gate

#### What was fixed

- `drizzle/schema.ts`: 7 new columns on `website_blueprints` — `adminBlueprintReviewStatus` (enum: pending/approved/needs_changes/blocked), `adminBlueprintApprovedAt`, `adminBlueprintApprovedBy`, `adminBlueprintApprovalNotes`, `adminBlueprintReturnedAt`, `adminBlueprintReturnReason`, `adminBlueprintReviewFlags` (json array).
- `server/db.ts`: Migration 0057 — 7 idempotent `ALTER TABLE ADD COLUMN` statements.
- `server/services/siteGenerator.ts`: Gate 1.5 — blocks generation if `adminBlueprintReviewStatus !== "approved"` or `adminBlueprintApprovedAt` is missing.
- `server/routers.ts` — `triggerGeneration`: now checks admin Blueprint approval before firing. `approveBlueprint` (customer): now checks admin approval before firing generation. `adminApproveBlueprint`: rewritten to record admin identity, timestamp, and notes; triggers generation if customer has also approved and payment confirmed. Three new admin procedures: `adminReturnBlueprint`, `adminBlockBlueprint`, `adminAddBlueprintFlags`.
- `client/src/pages/admin/OnboardingProjects.tsx`: Admin Blueprint review status badge + Approve/Return/Block buttons added to each project card.
- `server/adminBlueprintGate.test.ts` (NEW): 48 tests covering all gate states, customer-claim doctrine preservation, legacy compat, schema fields, and procedure wiring.
- All 48 B7 tests + 85 B6 blueprint tests + 38 Elena safety tests pass. pnpm check clean. pnpm build PASS.

#### Remaining gaps (require later gates)

- B8: Claims/proof source tracking now wired in Blueprint (B8 RESOLVED).
- B9: Add-on fulfillment not built.
- B10: Customer Blueprint approval UI does not show all 9 sections.
- B11: Generator still receives SiteBrief, not full Blueprint.

---

### B8 — Claim / Proof Validation Missing

**Severity:** P0 — creates legal/trust risk
**Status:** RESOLVED (B8 commit)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Claim/Proof Validation Gate

#### What was fixed

- `shared/blueprintTypes.ts`: New types — `ClaimType` (19 values), `ClaimSource` (8 values), `ClaimSourceStatus` (5 values), `ClaimRiskLevel` (4 values), `ClaimAdminReviewStatus` (8 values), `ClaimGeneratorUseStatus` (5 values), `ClaimProofRecord` (23 fields), `ClaimProofInventory` (8 fields). `RISKY_CLAIM_WORDS` constant with 3 risk tiers (regulated_sensitive, high, medium). `buildClaimProofInventory()` helper builds structured claim records from questionnaire data (testimonials, license, years-in-business, certifications, awards, uniqueDifferentiator scan, specialRequests scan). `extractGeneratorClaimLists()` helper produces `claimsSafeToUse`, `claimsToOmit`, `claimsNeedingAdminReview`, `claimsNeedingCustomerAcknowledgment`. `Positioning` interface gains optional `claimProofInventory` field. `RiskCompliance` gains optional `claimsSummary` field. `GeneratorInstructions` gains optional `claimsSafeToUse`, `claimsToOmit`, `claimsNeedingAdminReview`, `claimsNeedingCustomerAcknowledgment`.
- `server/routers.ts`: `buildBlueprintFromQuestionnaire()` updated to call `buildClaimProofInventory()` and `extractGeneratorClaimLists()`. `positioning.claimProofInventory` populated. `riskCompliance.claimsSummary` populated. `generatorInstructions.claimsSafeToUse` / `claimsToOmit` / `claimsNeedingAdminReview` / `claimsNeedingCustomerAcknowledgment` populated. `adminReviewRecommended` now also triggers when claim inventory has pending review items.
- `server/claimProofValidation.test.ts` (NEW): 90 tests covering inventory structure, testimonials, license, years-in-business, certifications, guarantee/superlative language, medical/regulatory-sensitive claims, customer-claim doctrine preservation, generator instruction flags, summary counts, RISKY_CLAIM_WORDS, ClaimProofRecord shape, and routers.ts wiring.
- All 90 B8 tests + 48 B7 tests + 85 B6 tests + 38 Elena safety tests pass. pnpm check clean. pnpm build PASS.

#### Remaining gaps (require later gates)

- B9: Add-on fulfillment systems not built — schema captures accepted add-ons but fulfillment not wired.
- B10: Customer Blueprint approval UI does not show all 9 sections including claim inventory.
- B11: Generator still receives SiteBrief — Blueprint claim lists not yet consumed by generator prompt.

---

### Lifecycle Realignment — RESOLVED

**Severity:** P0 — platform was architecturally misaligned with correct operating model
**Status:** RESOLVED (lifecycle realignment commit)
**Discovered:** 2026-05-15 Lifecycle Realignment Audit
**Closed:** 2026-05-15 Lifecycle Realignment Gate

#### What was wrong

Gate 1.5 (B7) blocked generation when `adminBlueprintReviewStatus !== "approved"` — requiring admin to manually approve the Blueprint before the site could build. The correct lifecycle has admin reviewing the BUILT site (step 8), not the Blueprint pre-generation. Gates 1 and 1.5 were both pre-generation human gates where the lifecycle requires automated flow.

Additionally: no `adminDenyPreview()` procedure existed (step-9 deny branch was missing). Blueprint auto-approval required a customer portal click rather than triggering automatically from Elena's conversation completion.

#### What was fixed

- `server/services/siteGenerator.ts`: Gate 1.5 changed from "block unless admin clicked approve" to "block only if admin explicitly blocked (`adminBlueprintReviewStatus === 'blocked'`)." `"pending"`, `"needs_changes"`, `"approved"`, and null/undefined all allow generation. Admin reviews the BUILT site at step 8 via `adminApprovePreview()`.
- `server/routers.ts` — `saveQuestionnaire`: After Blueprint creation, automated readiness check runs. If `metadata.completenessScore ≥ 60` → Blueprint auto-approved (Elena conversation completion = customer confirmation). If payment confirmed → generation fires immediately. If below 60 → stays in `customer_review` with descriptive log.
- `server/routers.ts` — `triggerGeneration`: Updated to align with new Gate 1.5 (only blocks on "blocked" status, not on pending/approved).
- `server/routers.ts` — `adminDenyPreview` (NEW): Step-9 deny path. Admin can deny a preview with a reason → project stage set to "revisions", generationStatus set to "idle", admin team notified.
- `server/adminBlueprintGate.test.ts`: Rewritten (273 tests total across B7+B8 gate suite) to reflect correct lifecycle behavior. Section A now proves only "blocked" stops generation. Section B proves Blueprint auto-approval. Section M proves adminDenyPreview wiring.
- B10 definition corrected: B10 is customer **site** preview approval (reviewing the built site), NOT Blueprint approval. The portal approval click is now a revision/override path, not the primary generation trigger.

---

### B9 — Add-On Truth / Fulfillment Gap

**Severity:** P1 — creates broken promises risk
**Status:** RESOLVED (B9 commit)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Add-On Fulfillment Truth Gate

#### What was fixed

- `shared/addonFulfillment.ts` (NEW): 20-add-on canonical fulfillment registry with `canElenaRecommend`, `canCheckoutPurchase`, `generatorSupported`, `billingSupported`, and 24 more fields per add-on. `lookupAddonFulfillment()`, `getElenaRecommendableAddons()`, `getCheckoutPurchasableAddons()`, `getGeneratorSupportedAddons()`, `getBlockedAddons()`, `findNonPurchasableAddons()` all exported.
- `shared/blueprintTypes.ts`: `AddOnRecord` + 11 B9 fields. `AddOnUpsellFit` + 9 B9 classification buckets. `buildAddOnUpsellFit()` added. `ADDON_FULFILLMENT_MAP` removed. `buildAddOnRecords()` now uses canonical registry.
- `server/routers.ts`: Checkout guardrail (`findNonPurchasableAddons()` throws BAD_REQUEST for blocked add-ons). Elena BLOCKED ADD-ONS section generated from registry. Blueprint `addOnUpsellFit` fully populated.
- `server/services/siteGenerator.ts`: Only `generatorSupported === true` add-ons passed to template engine. Build report logs classification buckets.
- `server/addonFulfillmentTruth.test.ts` (NEW): 105 tests passing.

#### Remaining gaps (require later gates)

- B10: Customer site preview approval — not yet built.
- B11: Blueprint → generator full handoff — not yet wired.

---

### B-Card Gate — Checkout Without Contract (Real Incident)

**Severity:** P0 — real buyer paid without signing a contract
**Status:** RESOLVED (B-Card Gate commit)
**Discovered:** 2026-05-15 (real checkout-without-contract incident)
**Closed:** 2026-05-15 Lead-to-Customer Card / Contract Checkout Integrity Gate

#### What was wrong

A real buyer completed checkout using the legacy `createCheckout` path, which had no agreement, no customer card requirement, and no project requirement. This meant a paying customer had no contract acceptance record tied to their payment.

Additionally: `generateRepPaymentLink` agreement creation was non-fatal (could silently skip), `resendPaymentLink` had no agreement handling at all, and the Stripe webhook silently created contracts without linking them to agreement records for self-service sessions.

#### What was fixed

- `server/routers.ts` — `createCheckout`: Now immediately throws `BAD_REQUEST`. No checkout without Elena onboarding flow.
- `server/routers.ts` — `generateRepPaymentLink`: Agreement creation (step 3b) is now fatal. Throws if agreement cannot be recorded.
- `server/routers.ts` — `resendPaymentLink`: Now looks up existing agreement and passes `agreement_id` in Stripe session metadata so webhook can link contract to agreement.
- `server/stripe-webhook.ts` — `handleCheckoutCompleted`: Logs `[COMPLIANCE_ALERT]` when session metadata has no `agreement_id` (self-service legacy path detected).
- `server/db.ts` — `getCustomerCardPacket()` (NEW): Admin helper returning complete lifetime customer packet: identity, source, costs, contracts, projects (with agreements/blueprint/buildReports), supportTickets, lifecycleStatus.
- `server/customerCardContractIntegrity.test.ts` (NEW): 52 tests, pnpm check clean, pnpm build PASS.

---

### B10 — Customer Site Preview Approval Gap

**Severity:** P1 — blocks first customer
**Status:** RESOLVED (B10 commit)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Customer Site Preview Approval Gate

#### What was fixed

- `server/routers.ts` — `approveLaunch`: Added `adminPreviewApprovedAt` guard — customer cannot call approveLaunch until admin has approved the built preview. Throws `BAD_REQUEST: "Admin review is required before you can approve this site for launch."`.
- `server/routers.ts` — `requestChange`: Added optional `changeCategory` field to input schema (enum: text_copy, design_style, photo_media, business_info, contact_form, other).
- `client/src/pages/admin/OnboardingProjects.tsx`: Added `adminDenyPreviewMutation` + `handleAdminDenyPreview` handler + "Deny — Needs Changes" button alongside "Approve Preview for Customer" in `pending_admin_review` stage. Admin can now deny a preview via UI (uses window.prompt for reason, same pattern as blueprint return/block).
- `server/services/siteUpdater.ts`: Already correctly clears `adminPreviewApprovedAt: null`, `approvedAt: null`, and sets `stage: "pending_admin_review"` when a revision rebuild completes — the revision loop already routes back through admin.
- `server/customerSitePreviewApproval.test.ts` (NEW): 58 tests across 13 sections (A–M) covering all approval lifecycle states, ownership checks, launch blocking, revision loop, category field, admin visibility packet, and full sequence.

#### No new schema columns needed

All approval state is derivable from existing fields:
- `not_ready` = generationStatus ≠ "complete"
- `waiting_for_admin` = complete + no adminPreviewApprovedAt
- `ready_for_customer_review` = adminPreviewApprovedAt set + no approvedAt + stage = "review"
- `customer_requested_revisions` = stage = "revisions"
- `customer_approved_for_launch` = approvedAt set or stage = "final_approval"
- `launched` = stage = "launch" or "complete"

---

### B11 — Blueprint → Generator Instruction Gap

**Severity:** P1 — reduces generation quality and truth
**Status:** RESOLVED (B11 commit — feat: add lossless Blueprint generator handoff)
**Discovered:** 2026-05-15 Elena Promise Enforcement Audit
**Closed:** 2026-05-15 Blueprint → Generator Handoff Gate

#### What was fixed

- `shared/blueprintHandoff.ts` (NEW): `BlueprintGeneratorHandoff` interface (~40 fields), `HandoffVerbatimBlock`, `HandoffIntegrityReport` (14 fields). Safe extraction helpers (`safe()`, `safeArray()`, `safeStr()`, `safeBool()`). `buildBlueprintGeneratorHandoff()` — never crashes, falls back to empty arrays on missing sections. `buildHandoffIntegrityReport()` — integrity score 0-100, `safeToGenerate = sectionPresenceScore > 0`. `buildHandoffPromptSections()` — 15 labeled LLM prompt sections: BLUEPRINT GENERATOR HANDOFF, CUSTOMER TRUTH TO PRESERVE, DO NOT INVENT, DO NOT SAY / BANNED PHRASES, CLAIMS / PROOF HANDLING, CUSTOMER PSYCHOLOGY, CTA RULES, SERVICE STRATEGY, ADD-ON FULFILLMENT TRUTH, TONE / CONTENT RULES, COMPETITIVE ADVANTAGES, RISK / COMPLIANCE, ADMIN FLAGS / REVIEW ITEMS, OMITTED FIELDS AND WHY, END BLUEPRINT HANDOFF.
- `server/services/siteGenerator.ts`: B11 block inserted after blueprint hard-block gate. Imports `buildBlueprintGeneratorHandoff` dynamically. Builds handoff from `blueprint.blueprintJson`. Warns if `!integrityReport.safeToGenerate` but never blocks for legacy blueprints. Injects `buildHandoffPromptSections(blueprintHandoff)` into `sharedContext` BEFORE full questionnaire JSON dump. Build reporter logs `b11_handoff` entry with integrity score, fields passed, fields omitted, and safeToGenerate status.
- `server/blueprintGeneratorHandoff.test.ts` (NEW): 64 tests across 11 sections (A–K). Covers: builder on null/empty/invalid input, verbatim preservation for all 9 Blueprint sections, generator instruction fields, customer psychology, risk/compliance, integrity report (score, safeToGenerate, riskWarnings), prompt section builder (all 15 sections), claims fallback, add-on fulfillment truth, regression checks. 64 B11 tests + 514 prior gate tests = 578 gate tests passing. pnpm check clean. pnpm build PASS.

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
