# 10 — Next Action

**Last updated: 2026-05-16**

---

## Current Gate: Customer Lifetime Card UI / Full History Timeline

**Priority:** P1
**Status:** OPEN — next gate after Admin Review Packet + Admin-Side Elena Fix Loop

### What was completed before this gate

| Gate | Status |
|---|---|
| Contact Flow P0 Repair | ✅ Done (`0c1440d`) |
| Template Truth Repair | ✅ Done (`86105c5` + `8f11c2b`) |
| Deploy Confirmed | ✅ Done (`61c8f14`, live at 07:42:58 GMT) |
| Production API flow proved working | ✅ Done |
| Production Generation Test: 5/5 PASS, 100/100 | ✅ Done (projects 46-50) |
| Customer Portal Reality Patch | ✅ Done (`22b95a2`) |
| Service Template Routing Repair | ✅ Done (`aaaa3ac`) |
| B5 Service Template Content Repair | ✅ Done (`2850228`) |
| Elena Promise Enforcement Audit | ✅ Done (`943e94d`) |
| Elena Promise Safety Hotfix | ✅ Done (`f29e7a6`) |
| Blueprint Schema Gate (B6) | ✅ Done (`26aaf12`) |
| Admin Blueprint Gate (B7) | ✅ Done (`2682cfb`) |
| Claim/Proof Validation Gate (B8) | ✅ Done (`70acded`) |
| Lifecycle Realignment Gate | ✅ Done (`96952f9`) |
| Add-On Fulfillment Truth Gate (B9) | ✅ Done (2484fbe) |
| B-Card Gate (checkout/contract integrity) | ✅ Done (643ca4e) — PARTIALLY REOPENED |
| B-Card P0 Reopen (Elena contract bypass) | ✅ Done — actual Elena path now enforces agreement |
| Admin Review Packet + Admin-Side Elena Fix Loop | ✅ Done — structured packet, approve guards, denial form, fix guidance, 52 tests |

### Lifecycle Realignment — what changed

The correct MiniMorph operating model is:
1. Customer/lead talks to Elena
2. Elena gathers truth → Blueprint created
3. System auto-checks Blueprint readiness (completenessScore ≥ 60 → auto-approve, auto-generate)
4. Builder builds the site
5. Build report created
6. Admin reviews BUILT site + Elena chat + Blueprint summary + build report
7. Admin approves or denies
8. If approved → customer reviews built site
9. If admin denies → site routes to revisions stage

**Corrections made:**
- Gate 1.5 changed: no longer blocks on "pending"/"needs_changes" — only hard-blocks on admin "blocked" status. Admin reviews the built site (step 6), not the Blueprint pre-generation.
- `saveQuestionnaire` now auto-approves Blueprint when completenessScore ≥ 60. Elena conversation completion = customer confirmation. If payment confirmed, generation fires immediately.
- `adminDenyPreview()` added: lifecycle step 7 deny path → routes project to "revisions" stage.
- B10 redefined: customer reviews the **built site** (not Blueprint). Portal "approve site" flow, not "approve Blueprint."

### B-Card P0 Reopen — what happened and what changed

The original B-Card Gate (643ca4e) blocked the legacy `createCheckout` path. But the real buyer went through **Elena** and still reached Stripe — the legacy path was not the actual bypass.

**Root cause:** The Elena-to-Stripe path (`createCheckoutAfterElena`) had an agreement check that used the existing `customerAgreements` system, but `resendPaymentLink` silently proceeded without `agreement_id` when the agreement lookup failed, and the site generator had no gate to block generation when no valid agreement existed.

**What was fixed:**
- `shared/contractValidation.ts` (NEW): `validateContractReadyForCheckout()` — single shared validation helper used by all website package checkout routes. Validates agreement existence, userId/projectId ownership, acceptedAt, and signerName (rejects all sentinel/placeholder names).
- `server/routers.ts` — `createCheckoutAfterElena`: replaced inline validation with `validateContractReadyForCheckout()`. `agreement_id` is now unconditional in both top-level metadata and subscription_data.metadata.
- `server/routers.ts` — `resendPaymentLink`: agreement lookup is now **fatal** — throws `BAD_REQUEST` if no project found, throws `BAD_REQUEST` if no agreement found, throws `INTERNAL_SERVER_ERROR` if lookup errors. No longer silently proceeds without `agreement_id`. Both metadata blocks now unconditionally include `agreement_id`.
- `server/services/siteGenerator.ts` — Gate 2.5 (NEW): self-service projects are blocked from generation if no valid accepted agreement with a non-sentinel signerName exists. Payment alone is not enough.
- `server/db.ts` — `getCustomerCardPacket()`: `lifecycleStatus` is now a structured object exposing `contractReadyForCheckout`, `contractIssueBlockingCheckout`, `contractIssueBlockingGeneration`, `contractIssueBlockingLaunch`, `hasValidSignerAgreement`.

---

## Admin Review Packet + Admin-Side Elena Fix Loop — what changed

Admin can now see the full 10-section review packet for every project in `pending_admin_review`:

1. Project identity (stage, generationStatus, packageTier, source)
2. Customer/card (name, email, phone, status, rep)
3. Contract/payment (valid signer, contract on file, payment confirmed, contractIssueBlockingCheckout/Launch)
4. Elena/intake (conversation count, customer truth to preserve, do-not-say items)
5. Blueprint (template lane, risk flags, claims to omit, claims needing review, banned phrases)
6. B11 handoff (integrity score, safeToGenerate, warnings)
7. Generated site (page count, page names, preview URL)
8. Build report (status, QA score, persistent/escalated issues)
9. Claims/risk/add-ons (manual add-ons required, admin review reason)
10. Prior denial (category, reason, fix instructions, fix guidance)

**adminApprovePreview** now enforces 4 pre-approval guards: generated site HTML must exist, build report must exist, self-service/paid projects must have a valid signer agreement.

**adminDenyPreview** now requires `denialCategory` (7-value enum) and `fixInstructions` (required). Stores structured denial JSON in `adminReviewNotes`. Clears `adminPreviewApprovedAt: null` immediately — customer preview hidden.

**buildAdminFixGuidance()** deterministic helper produces category-specific guidance: customer truth to preserve, content constraints, rebuild notes — shown in admin UI panel.

Customer visibility guarantee:
- Customer cannot see generated preview until `adminPreviewApprovedAt` set by `adminApprovePreview`
- `adminDenyPreview` clears `adminPreviewApprovedAt: null` — preview hidden
- B10 `approveLaunch` still guards on `adminPreviewApprovedAt`
- `adminReleaseLaunch` still requires customer `approvedAt`

## Required Next Action

**Customer Lifetime Card UI / Full History Timeline** — Build the customer-facing lifetime card UI showing the full history of their project: all site builds, all approvals, all revisions, all contract events, all add-ons, all support tickets. Admin should also have a cleaner card view per customer.

After Customer Lifetime Card UI, proceed to Support + Nurture Pipeline.

---

## Remaining Known Blockers Before MiniMorph Dogfood

- None from B6–B11, B-Card P0, or Admin Review Packet. Dogfood is next after Customer Lifetime Card UI.

## Ecommerce Status — Intentionally Excluded

- **B2**: `server/templates/ecommerce/product.html:741` — `return false` in form handler.
- **Ecommerce is NOT part of the current launch path.** It is intentionally excluded.
- Elena does not offer ecommerce. Checkout does not accept ecommerce packages. Generator does not build ecommerce. B2 is not a launch blocker.
- Ecommerce is a future optional gate only if Cody reopens it.

---

## 100% Completion Docket (Excluding Ecommerce)

| # | Gate | Status |
|---|---|---|
| 1 | Admin Review Packet + Admin-Side Elena Fix Loop | ✅ Done |
| 2 | Customer Lifetime Card UI / Full History Timeline | ❌ Pending |
| 3 | Support + Nurture Pipeline | ❌ Pending |
| 4 | Rep / Lead Source / Commission Continuity | ❌ Pending |
| 5 | Production Notifications + Email Reliability | ❌ Pending |
| 6 | Internal Dogfood | ❌ Pending (after admin packet) |
| 7 | Full E2E / Smoke Test | ❌ Pending |
| 8 | POV Simulations | ❌ Pending |
| 9 | Controlled First Outside Customer | ❌ Pending (after dogfood + admin approval) |
| 10 | Public Launch Readiness | ❌ Pending |
| 11 | Production Deployment Verification | ❌ Pending |

| Ecommerce (B2) | Intentionally excluded — not a launch blocker |

---

## Gate Sequence

```
[DONE]  Contact Flow P0 Repair ✅ (commit 0c1440d)
        ↓
[DONE]  Template Truth Repair ✅ (commits 86105c5 + 8f11c2b)
        ↓
[DONE]  Deploy Confirmed ✅ (commit 61c8f14, live at 07:42:58 GMT)
        ↓
[DONE]  Production API flow proved working ✅ (generation runs on server)
        ↓
[DONE]  Production Generation Test: 5/5 PASS, 100/100 ✅ (projects 46-50, 2026-05-15)
        ↓
[DONE]  Customer Portal Reality Patch ✅ (BuildCommandCenter, tab reorder, E2E suite)
        ↓
[DONE]  Service Template Routing Repair ✅ (service/agency → professional template, 37 tests)
        ↓
[DONE]  B5 Service Template Content Repair ✅ (contractor language removed)
        ↓
[DONE]  Elena Promise Enforcement Audit ✅ (35+ promises audited, B6-B11 opened)
        ↓
[DONE]  Elena Promise Safety Hotfix ✅ (all unsupported promises removed, 38 safety tests, f29e7a6)
        ↓
[DONE]  Blueprint Schema Gate (B6) ✅ (CustomerRealityBlueprint type, 9 sections, 85 tests, 26aaf12)
        ↓
[DONE]  Admin Blueprint Gate (B7) ✅ (`2682cfb`)
        ↓
[DONE]  Claim/Proof Validation Gate (B8) ✅ (`70acded`)
        ↓
[DONE]  Lifecycle Realignment Gate ✅ (`96952f9`)
        ↓
[DONE]  Add-On Fulfillment Truth Gate (B9) ✅ (2484fbe)
        ↓
[DONE]  B-Card Gate (checkout/contract integrity) ✅ (643ca4e) — legacy path blocked
        ↓
[DONE]  Customer Site Preview Approval Gate (B10) ✅ (ecab8a9)
        ↓
[DONE]  Blueprint → Generator Handoff Gate (B11) ✅ (73947a5)
        ↓
[DONE]  B-Card P0 Reopen — Elena contract bypass closed ✅ (08e900f)
        ↓
[DONE]  Admin Review Packet + Admin-Side Elena Fix Loop ✅
        ↓
[ACTIVE] Customer Lifetime Card UI / Full History Timeline
        ↓
        Support + Nurture Pipeline
        ↓
        Rep / Lead Source / Commission Continuity
        ↓
        Production Notifications + Email Reliability
        ↓
        Internal Dogfood
        ↓
        Full E2E / Smoke Test
        ↓
        POV Simulations
        ↓
        Controlled First Outside Customer
        ↓
        Public Launch Readiness
        ↓
        Production Deployment Verification
        ↓
        PUBLIC LAUNCH
```

---

## First Customer Readiness Checklist

| Item | Status |
|---|---|
| Contact Flow P0 Repair Gate | ✅ Done |
| All template forms use APP_URL_PLACEHOLDER/api/contact-submit | ✅ Done |
| pnpm check passes | ✅ Done |
| pnpm build passes | ✅ Done |
| Committed and pushed to origin/main | ✅ Done (6b74713) |
| Railway deploy confirmed | ✅ Done (07:42:58 GMT) |
| Template content P1 repairs verified clean | ✅ Done (static + generation inspection) |
| Production admin API flow working (generation on server) | ✅ Done |
| Anthropic API credits sufficient | ✅ Done (credits topped up 2026-05-15) |
| Production generation test — all 5 sites score 95+/100 | ✅ Done (100/100 each, 2026-05-15) |
| Customer portal clarity patch deployed | ✅ Done (BuildCommandCenter, tab reorder, E2E tests) |
| Service template routing repaired | ✅ Done (service/agency → professional template, 37 tests) |
| B5 service template content repaired | ✅ Done (contractor language removed, 2850228) |
| Elena Promise Enforcement Audit | ✅ Done (`943e94d`) |
| Elena Promise Safety Hotfix | ✅ Done (`f29e7a6`) |
| B6 Blueprint Schema Gap resolved | ✅ Done (26aaf12) |
| B7 Admin Blueprint Gate implemented | ✅ Done (`2682cfb`) |
| B8 Claim/Proof Validation implemented | ✅ Done (`70acded`) |
| B9 Add-On Truth/Fulfillment Gap resolved | ✅ Done (2484fbe) |
| B-Card Gate (checkout/contract integrity) | ✅ Done (643ca4e) — legacy path blocked |
| B10 Customer Site Preview Approval implemented | ✅ Done (ecab8a9) |
| B11 Blueprint → Generator Handoff complete | ✅ Done (73947a5) |
| B-Card P0 Reopen — Elena contract bypass closed | ✅ Done (this commit) |
| Admin Review Packet + Admin-Side Elena Fix Loop | ✅ Done |
| Customer Lifetime Card UI / Full History Timeline | ❌ Pending |
| Support + Nurture Pipeline | ❌ Pending |
| Rep / Lead Source / Commission Continuity | ❌ Pending |
| Production Notifications + Email Reliability | ❌ Pending |
| Internal Dogfood | ❌ Pending (after Customer Lifetime Card UI) |
| Full E2E / Smoke Test | ❌ Pending |
| POV Simulations | ❌ Pending |
| Controlled First Outside Customer | ❌ Pending (after dogfood + admin approval) |
| Public Launch Readiness | ❌ Pending |
| Production Deployment Verification | ❌ Pending |
| Ecommerce (B2) | Intentionally excluded — not a launch blocker |
