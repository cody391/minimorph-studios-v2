# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Blueprint Schema Gate (B6)

**Priority:** P0
**Status:** OPEN — next gate after Elena promise safety hotfix

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
| Elena Promise Safety Hotfix | ✅ Done (pending push) |

### Why this gate is open

Elena promise wording is now safe for internal testing — all unsupported automation, compliance, report, and "instant" promises have been removed. The platform still has structural gaps in the Blueprint schema (B6), admin gate (B7), claims validation (B8), add-on fulfillment (B9), customer approval sections (B10), and generator handoff (B11). These must be closed before dogfood or first customer.

---

## Required Next Action

**Blueprint Schema Gate (B6)** — Extend `blueprintJson` to include all 9 Elena Master Baseline sections: Business Identity (extend), Offer Strategy (extend), Customer Psychology (add), Positioning (extend), Website Strategy (extend), Media/Visuals (add), Risk/Compliance (add), Generator Instructions (add), Add-On/Upsell Fit (add).

Update Elena's prompt to populate the new sections. Update `buildBlueprintFromQuestionnaire()` to build the full schema. Update the generator to consume all Blueprint fields.

After B6 is closed, proceed to B7 (Admin Blueprint Gate), then B8, B9, B10, B11 in order.

---

## Remaining Known Blockers Before MiniMorph Dogfood

- B6: Blueprint Schema Gap — blueprintJson missing 6+ of 9 required sections
- B7: Admin Blueprint Gate Missing — no hard gate before generation
- B8: Claim/Proof Validation Missing — claims flow into generator without verification
- B9: Add-On Truth/Fulfillment Gap — Elena may recommend unimplemented add-ons
- B10: Customer Blueprint Approval Gap — customer cannot review/correct Blueprint before generation
- B11: Blueprint → Generator Instruction Gap — SiteBrief does not carry full Blueprint to generator

## Remaining Known Blockers Before Ecommerce Customers

- B2: `server/templates/ecommerce/product.html:741` — `return false` in form handler. Must be fixed before any ecommerce customer is onboarded.

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
[DONE]  Elena Promise Safety Hotfix ✅ (all unsupported promises removed, 38 safety tests)
        ↓
[ACTIVE] Blueprint Schema Gate (B6) — extend blueprintJson to all 9 sections
        ↓
        Admin Blueprint Gate (B7) — hard adminBlueprintApprovedAt gate before generation
        ↓
        Claim/Proof Validation Gate (B8) — claims section with source tracking
        ↓
        Add-On Fulfillment Truth Gate (B9) — recommendedAddOns/acceptedAddOns in Blueprint
        ↓
        Customer Blueprint Approval Gate (B10) — customer can view/correct/approve Blueprint
        ↓
        Blueprint → Generator Handoff Gate (B11) — full Blueprint consumed by generator/prompt
        ↓
        MiniMorph Internal Dogfood Gate — reset project 34, run Elena, generate, QA
        ↓
        First Outside Controlled Customer
        ↓
        Public Launch
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
| Elena Promise Safety Hotfix | ✅ Done (pending push) |
| B6 Blueprint Schema Gap resolved | ❌ Pending (active gate) |
| B7 Admin Blueprint Gate implemented | ❌ Pending |
| B8 Claim/Proof Validation implemented | ❌ Pending |
| B9 Add-On Truth/Fulfillment Gap resolved | ❌ Pending |
| B10 Customer Blueprint Approval implemented | ❌ Pending |
| B11 Blueprint → Generator Handoff complete | ❌ Pending |
| MiniMorph internal dogfood gate | ❌ Pending (after B6–B11) |
| Admin explicitly approves outside first customer | ❌ Pending (after dogfood) |
