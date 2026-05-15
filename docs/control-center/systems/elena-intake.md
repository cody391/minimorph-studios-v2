# System: Elena Intake

## Overview

Elena is the AI onboarding agent that collects business information from new customers through a conversational questionnaire. Her output is a structured JSON blob stored as `questionnaire` on the `onboarding_projects` table.

---

## What Elena Collects

At minimum, Elena collects:

| Field | Purpose |
|---|---|
| Business name | `BUSINESS_NAME` token |
| Industry / business type | Template selection |
| Phone number | `PHONE` token |
| Email address | `EMAIL` token |
| City / service area | `SERVICE_AREA` token |
| Years in business | `YEARS_IN_BUSINESS` token |
| Services offered | `SERVICE_1`, `SERVICE_2`, `SERVICE_3` tokens |
| Customer testimonial (optional) | `TESTIMONIAL_1` token slot |
| Tagline or value proposition (optional) | `TAGLINE` token |
| Contractor license number (contractor industry) | `LIC #LICENSE_NUMBER` |
| Domain name (optional) | Deployment step |

If a field is not provided, the token either renders empty or is stripped at generation time. Elena never invents data.

---

## Client-Side Entry Points

- `client/src/pages/Onboarding.tsx` — Main onboarding flow
- `client/src/pages/OnboardingPaperwork.tsx` — Paperwork/contract step within onboarding

---

## Server-Side Procedures

All intake procedures live in `server/routers.ts` under the `onboarding.*` namespace. Key procedures:

| Procedure | Auth | Purpose |
|---|---|---|
| `onboarding.getStatus` | protectedProcedure | Returns the current onboarding step |
| `onboarding.submitQuestionnaire` | protectedProcedure | Saves questionnaire JSON blob |
| `onboarding.approveBlueprint` | protectedProcedure | Marks blueprint as approved by customer |
| `onboarding.triggerGeneration` | adminProcedure | Kicks off site generation (admin only) |

---

## DB Schema

Table: `onboarding_projects`

Key columns:
- `questionnaire` — JSON blob of all answers
- `blueprint_id` — FK to `blueprints` table
- `source` — `"self_service"` | `"rep_closed"` | `"manual"`
- `stage` — current stage of the project lifecycle
- `generatedSiteHtml` — JSON blob of generated HTML files

---

## Blueprint Assembly

After Elena collects the questionnaire, an admin (or automatic process) assembles a **blueprint** from the answers. The blueprint is a structured business profile used by the site generator.

Blueprint statuses:
- `draft` → admin is building it
- `customer_review` → customer is reviewing it in CustomerPortal
- `approved` → ready for generation

**The site generator will not run unless blueprint status is `approved`.** Do not remove this gate.

---

## Positioning Rules

Elena is an internal intake agent. She never:
- Describes herself as AI to customers
- Mentions Claude, ChatGPT, or any AI tool
- Implies the site is auto-generated

From the customer's perspective, they are answering questions for their dedicated MiniMorph onboarding specialist.

---

## Status

Elena intake is **active** but the Quality Lab has not been rerun since the last generator fixes. Full end-to-end validation (Elena → blueprint → generation → deployment) has not been confirmed on the current codebase.
