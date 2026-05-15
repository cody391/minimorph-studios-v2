# 02 — Architecture Map

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Wouter (routing) + Tailwind CSS |
| API | tRPC v10 (type-safe end-to-end) |
| Backend | Express.js on Node.js |
| ORM | Drizzle ORM |
| Database | MySQL 8 (Railway managed) |
| Auth | JWT + local email/password + Google OAuth |
| Email | Resend |
| SMS/Voice | Twilio |
| Payments | Stripe (subscriptions + one-time) |
| Hosting (app) | Railway (`fabulous-dedication` / `minimorph-studios-v2`) |
| Hosting (sites) | Cloudflare Pages (one project per customer) |
| AI generation | Anthropic Claude Haiku (copy) + Sonnet (fallback/LLM path) |
| Domain management | Cloudflare DNS + nameserver handoff |

## Main Flow: Intake → Launch

```
1. INTAKE (Elena AI agent or manual questionnaire)
   └─ client: Onboarding.tsx → OnboardingPaperwork.tsx
   └─ server: onboarding.* procedures in routers.ts
   └─ db: onboarding_projects table, questionnaire JSON blob

2. BLUEPRINT (business profile assembled for generator)
   └─ admin creates blueprint from questionnaire answers
   └─ db: blueprints table (status: draft → customer_review → approved)
   └─ customer reviews blueprint via CustomerPortal.tsx

3. GENERATION (site built from blueprint)
   └─ server/services/siteGenerator.ts — orchestrator
   └─ server/services/templateEngine.ts — template path (Haiku for copy)
   └─ server/templates/{industry}/{variant}.html — HTML templates
   └─ Template tokens replaced: BUSINESS_NAME, PHONE, EMAIL, etc.
   └─ APP_URL_PLACEHOLDER → https://www.minimorphstudios.net (no /portal suffix)
   └─ Output: generatedSiteHtml JSON blob stored on onboarding_projects

4. ADMIN REVIEW (human QA before customer sees anything)
   └─ client: admin/OnboardingProjects.tsx, admin/ManualFulfillment.tsx
   └─ admin/LaunchReadiness.tsx — pre-launch checklist
   └─ admin/HumanReview.tsx — site QA interface
   └─ Admin can regenerate, edit, approve, or reject

5. CUSTOMER REVIEW (customer sees and approves their site)
   └─ client: CustomerPortal.tsx (tab: "Your Site")
   └─ Customer approves or requests changes
   └─ Approval triggers final_approval stage

6. DEPLOYMENT (site goes live on Cloudflare Pages)
   └─ server/services/siteDeployment.ts — deploys via CF API
   └─ server/services/cloudflareDeployment.ts — CF Pages API wrapper
   └─ If domainName set: custom domain connected, DNS email sent to customer
   └─ If no custom domain: CF Pages URL is immediately live
   └─ Stage: launch → complete

7. CONTACT FORMS (customer's visitors submit leads)
   └─ Generated site forms POST to /api/contact-submit
   └─ server/_core/index.ts handles POST /api/contact-submit
   └─ Creates contact_submissions record in DB
   └─ Notifies MiniMorph owner + emails business owner
   └─ CURRENT P0 BLOCKER: sub-page forms use Formspree placeholder

8. SUPPORT / NURTURE (ongoing relationship)
   └─ support tickets (admin/Support.tsx)
   └─ nurturing pipeline (admin/Nurture.tsx) — anniversary check-ins
   └─ upsell flow (admin/Upsells.tsx)
```

## Key Directories

| Path | Purpose |
|---|---|
| `server/services/siteGenerator.ts` | Main generation orchestrator |
| `server/services/templateEngine.ts` | Template path: copy generation (Haiku) + token injection |
| `server/templates/` | HTML template files by industry |
| `server/routers.ts` | All tRPC procedures (~8000 lines) |
| `server/db.ts` | All DB queries (~2000 lines) |
| `server/_core/index.ts` | Express app setup, routes, startup |
| `server/_core/env.ts` | All env var definitions |
| `client/src/pages/admin/` | Admin dashboard pages |
| `client/src/pages/rep/` | Rep dashboard pages |
| `client/src/pages/CustomerPortal.tsx` | Customer portal |
| `drizzle/` | 58 migration SQL files |
| `drizzle/schema.ts` (likely) | DB schema definitions |

## Template Inventory

| Industry | Variants (index) | Sub-pages |
|---|---|---|
| contractor | dark-industrial, light-professional | about, contact, gallery, quote, services |
| restaurant | warm-casual, moody-upscale | menu, about, reservations, order |
| salon | warm-boutique, editorial-luxury | about, services |
| boutique | warm-lifestyle, minimal-editorial | varies |
| gym | bold-energetic, clean-modern | about, classes, schedule |
| service | professional, friendly-local | about, quote, services |
| coffee | artisan-roaster, cozy-neighborhood | menu, about |
| ecommerce | catalog | product |
| shared | — | contact, privacy |

## Frozen / Later Systems (also in repo)

| System | Key Files | Status |
|---|---|---|
| Lead engine | `server/services/leadGen*.ts`, `server/routers.ts (leadGenRouter)` | Frozen |
| Rep ecosystem | `server/repEcosystem.ts`, `client/src/pages/rep/` | Frozen |
| Sales Academy | `server/academyRouter.ts`, `academy-curriculum.ts` | Frozen |
| X/Twitter growth | `server/xGrowthRouter.ts`, `server/xService.ts` | Frozen |
| Social media | `server/socialRouter.ts` | Frozen |
| Broadcasts | `client/src/pages/admin/Broadcasts.tsx` | Frozen |
| AI Coach | `server/services/aiCoach.ts` | Frozen |
| Cost tracker | `server/services/costTracker.ts` | Active (wired, background) |
| Analytics | `server/services/analytics.ts` | Active (background) |
