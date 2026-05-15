# System: Admin Review

## Overview

Every generated site goes through a mandatory human admin review before the customer sees it. This is a core quality gate and a business differentiator — it's what makes MiniMorph a "white-glove" service vs. a self-service builder.

---

## Admin Review Pages

| Page | File | Purpose |
|---|---|---|
| Onboarding Projects | `client/src/pages/admin/OnboardingProjects.tsx` | List all projects, filter by stage |
| Manual Fulfillment | `client/src/pages/admin/ManualFulfillment.tsx` | Manually edit/build a site outside the generator |
| Human Review | `client/src/pages/admin/HumanReview.tsx` | QA interface: view generated site, approve or reject |
| Launch Readiness | `client/src/pages/admin/LaunchReadiness.tsx` | Pre-launch checklist before customer approval |

---

## Admin Review Checklist (run before approving any site)

```
[ ] Business name renders correctly everywhere
[ ] Phone, email, address all correct
[ ] No raw un-replaced tokens visible (BUSINESS_NAME, PHONE, etc.)
[ ] No ★★★★★ in content sections
[ ] No invented metrics (counts, percentages not from customer data)
[ ] No fake testimonial slots (beyond TESTIMONIAL_1)
[ ] No "via Google" / "via Yelp" attributions
[ ] No fake promotions or free trials
[ ] All CTAs link to correct pages
[ ] Contact forms present and use correct endpoint
[ ] Sub-pages accessible and consistent with index
[ ] No placeholder text ("Lorem ipsum", "[PLACEHOLDER]", etc.)
```

---

## Admin Procedures

All admin procedures in `server/routers.ts` use `adminProcedure` (requires admin role):

| Procedure | Purpose |
|---|---|
| `admin.getOnboardingProjects` | List all projects |
| `admin.approveGeneratedSite` | Mark site as admin-approved, move to customer review stage |
| `admin.rejectGeneratedSite` | Reject and queue for regen or manual edit |
| `onboarding.triggerGeneration` | Trigger site generation (admin-only despite onboarding namespace) |

---

## Stage Flow

```
intake_pending
  → blueprint_draft (admin creates blueprint)
  → customer_review (customer reviews blueprint)
  → blueprint_approved (customer approves blueprint)
  → generation_pending (awaiting trigger)
  → generating (in progress)
  → admin_review (admin QA)    ← admin works here
  → customer_review_site (customer views/approves site)
  → final_approval
  → deploying
  → launch
  → complete
```

---

## Regeneration

Admin can trigger regeneration from the review UI. This re-runs the full template engine pipeline with the current blueprint data. Any manual edits to the previous generation are lost.

Use regeneration when:
- The blueprint was updated after initial generation
- Haiku generated poor quality copy
- A template was fixed after initial generation

---

## Access Requirements

Admin role is required for all admin pages. The admin user is created on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars via `bootstrapAdminUser` in `server/_core/index.ts`.

Local testing requires these env vars to be set in `.env`.
