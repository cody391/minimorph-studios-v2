# System: Customer Portal

## Overview

The customer portal is where customers track their onboarding progress, review their blueprint, view their generated site, and approve it for deployment. It is the customer-facing side of the fulfillment pipeline.

---

## Key File

`client/src/pages/CustomerPortal.tsx`

---

## Portal Tabs

| Tab | What the customer sees |
|---|---|
| Overview | Current stage, progress indicator |
| Your Blueprint | Business profile assembled by admin; customer can approve or request changes |
| Your Site | Generated site preview; customer approves or requests changes |
| Support | Submit support tickets |

---

## Customer-Visible Stages

| Stage | What customer sees in portal |
|---|---|
| intake_pending | "We're reviewing your information" |
| blueprint_draft | "Your business profile is being prepared" |
| customer_review (blueprint) | "Please review your business profile" — approve CTA |
| blueprint_approved | "Your site is being built" |
| admin_review | "Your site is being reviewed by our team" |
| customer_review_site | "Your site is ready to review" — approve CTA |
| final_approval | "Approved! Preparing for launch" |
| launch/complete | Site URL shown; live |

---

## Blueprint Review

The customer reviews the assembled blueprint before generation begins. This is their chance to correct:
- Business name, contact details
- Services listed
- Any custom notes or preferences

The customer clicks "Approve" → `onboarding.approveBlueprint` procedure is called → stage advances.

Blueprint approval does NOT trigger generation. Admin must separately trigger generation via `onboarding.triggerGeneration`.

---

## Site Review

After admin approves the generated site, the customer sees a preview. They can:
- Approve → stage advances to `final_approval`
- Request changes → admin is notified, goes back to admin review

---

## Positioning Rules

The portal never mentions:
- AI generation
- Claude, ChatGPT, or any AI tool
- "Template" or "automated"

The portal language positions this as "our team is building your site" — a premium, human-managed service.

---

## Payment Gate

For `source === "self_service"` projects, generation does not begin until payment is confirmed via Stripe. The portal shows a payment CTA if the customer hasn't paid.

Rep-closed projects (`source === "rep_closed"`) bypass this gate — the rep's contract handles payment.

---

## Support Tickets

Customers can submit support tickets from the portal. These appear in `admin/Support.tsx` for the admin to respond. The support ticket system is active.
