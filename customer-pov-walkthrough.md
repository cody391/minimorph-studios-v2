# Customer POV End-to-End Autonomy Walkthrough

**Test Scenario:** Lakeshore Auto Detailing, Muskegon MI — Owner: Jordan Miller
**Date:** April 24, 2026

---

## PHASE 1 — DISCOVERY / LEAD CREATION

### 1.1 Business Discovery by Lead Gen Engine

**Code path:** `server/services/leadGenScraper.ts` → `scrapeBusinesses()`
**Trigger:** Scheduled route `POST /api/scheduled/auto-scrape` (`server/scheduled-routes.ts:125`)
**How it works:** The scraper uses Google Maps proxy (`server/_core/map.ts` → `makeRequest()`) to search for businesses by industry + location (e.g., "auto detailing Muskegon MI"). Results are parsed and inserted into `scraped_businesses` table.

| Check | Status | Evidence |
|-------|--------|----------|
| Business can be discovered | **WORKING** | `scrapeBusinesses()` queries Google Maps Places API via Manus proxy, returns name/address/phone/website/rating |
| Dedup on scrape | **WORKING** | `scrapeBusinesses()` checks `scraped_businesses` table by `placeId` before insert |
| Scraped record created | **WORKING** | Inserts into `scraped_businesses` table with fields: `businessName`, `address`, `phone`, `website`, `rating`, `placeId`, `industry`, `location` |

**Table:** `scraped_businesses` (`drizzle/schema.ts`)

### 1.2 Website/Online Presence Scoring

**Code path:** `server/services/leadGenScoring.ts` → `scoreLeadQuality()`
**How it works:** LLM-based scoring. Takes business name, website URL, industry, and enrichment data. Returns JSON with `overallScore` (0-100), `websiteQuality`, `onlinePresence`, `competitivePosition`, `painPoints[]`, `opportunities[]`.

| Check | Status | Evidence |
|-------|--------|----------|
| Website/presence scored | **WORKING** | `scoreLeadQuality()` calls `invokeLLM()` with structured JSON schema response format |
| Score stored on lead | **WORKING** | Score stored in `leads.leadScore` (int) and `leads.enrichmentData` (JSON) |

### 1.3 Contact Enrichment (Apollo/Hunter/LLM)

**Code path:** `server/services/leadGenEnrichment.ts` → `enrichContact()`
**How it works:** Tries Apollo API first (`APOLLO_API_KEY`), falls back to Hunter API (`HUNTER_API_KEY`), then LLM enrichment. Returns enriched contact info (email, phone, title, company size, revenue estimate).

| Check | Status | Evidence |
|-------|--------|----------|
| Apollo enrichment | **WORKING** | `enrichContact()` calls Apollo `/v1/people/match` endpoint |
| Hunter fallback | **WORKING** | Falls back to Hunter `/v2/domain-search` if Apollo fails |
| LLM fallback | **WORKING** | Falls back to `invokeLLM()` for best-guess enrichment |
| Enrichment data stored | **WORKING** | Stored in `leads.enrichmentData` JSON column |

### 1.4 Lead Record Creation

**Code path:** `server/services/leadGenScraper.ts` → after scrape, the scheduled route `auto-scrape` calls `db.insert(leads)` for each qualifying scraped business.
**Also:** `server/leadGenRouter.ts` → `requestPublicAudit` (public procedure) creates a lead from the Free Audit page (`client/src/pages/FreeAudit.tsx`).

| Check | Status | Evidence |
|-------|--------|----------|
| Lead record created | **WORKING** | `leads` table insert with `businessName`, `contactName`, `email`, `phone`, `industry`, `source`, `stage`, `temperature` |
| Lead source logged | **WORKING** | `leads.source` field — values: `"scraped"`, `"manual"`, `"referral"`, `"free_audit"`, `"self_sourced"` |
| Lead score assigned | **WORKING** | `leads.leadScore` populated by `scoreLeadQuality()` |
| Lead temperature assigned | **WORKING** | `leads.temperature` — `"cold"`, `"warm"`, `"hot"` — set based on score thresholds |

**Table:** `leads` (`drizzle/schema.ts:65`)

### 1.5 Dedup

| Check | Status | Evidence |
|-------|--------|----------|
| Lead dedup | **PARTIALLY WORKING** | Scraped businesses are deduped by `placeId` in `scraped_businesses`. However, `leads` table itself has no explicit dedup check on email/phone/businessName before insert. A business could appear as both a scraped lead and a free-audit lead. |

**Gap:** No cross-source lead dedup on `leads` table.

### 1.6 Admin Visibility

**Code path:** `server/routers.ts` → `leads.list` (adminProcedure) → `db.listLeads()`
**Frontend:** `client/src/pages/admin/Leads.tsx`

| Check | Status | Evidence |
|-------|--------|----------|
| Admin can see lead | **WORKING** | `leads.list` is admin-only, returns all leads with filtering by stage/temperature/source |

### 1.7 Rep Feed

**Code path:** `server/scheduled-routes.ts:142` → `POST /api/scheduled/auto-feed-reps` → `autoFeedReps()` in `server/services/leadGenOutreach.ts`
**How it works:** Finds unassigned leads with `stage = 'new'` or `'contacted'`, finds active reps, round-robin assigns leads to reps by updating `leads.assignedRepId`.

| Check | Status | Evidence |
|-------|--------|----------|
| Rep feed receives lead | **WORKING** | `autoFeedReps()` assigns leads to active reps via round-robin |
| Rep sees assigned leads | **WORKING** | `leads.myLeads` (protectedProcedure) returns leads where `assignedRepId` matches rep's ID |

### Phase 1 Summary

| Step | Status |
|------|--------|
| Discovery by scraper | WORKING |
| Website scoring | WORKING |
| Contact enrichment | WORKING |
| Lead record creation | WORKING |
| Lead dedup | PARTIALLY WORKING — no cross-source dedup on `leads` table |
| Score/temperature assigned | WORKING |
| Source logged | WORKING |
| Admin visibility | WORKING |
| Rep feed | WORKING |

---

## PHASE 2 — AI OUTREACH TOUCHPOINTS

### 2.1 Outreach Sequence Scheduling

**Code path:** `server/scheduled-routes.ts:175` → `POST /api/scheduled/auto-start-outreach` → calls `startOutreachSequence()` in `server/services/leadGenOutreach.ts`
**How it works:** Finds leads with `stage = 'new'` that have no active outreach sequence. Creates an `outreach_sequences` record and schedules the first touchpoint.

| Check | Status | Evidence |
|-------|--------|----------|
| Sequence scheduled | **WORKING** | `startOutreachSequence()` creates `outreach_sequences` row with `status: 'active'`, `currentStep: 1`, `nextTouchAt` |
| Sequence linked to lead | **WORKING** | `outreach_sequences.leadId` FK to `leads.id` |

**Table:** `outreach_sequences` (`drizzle/schema.ts:812+`)

### 2.2 Touchpoint Execution (Email/SMS)

**Code path:** `server/services/leadGenOutreach.ts` → `executeOutreachStep()` → generates message via `invokeLLM()` → sends via `sendEmail()` (`server/services/emailService.ts`) or `sendSms()` (`server/services/smsService.ts`)

**Touchpoint flow:**
- **Touchpoint 1 (Initial):** AI generates personalized outreach based on business name, industry, pain points from enrichment. Sent via email (primary) or SMS.
- **Touchpoint 2 (Follow-up):** Website pain point focus — references their current website quality from scoring data.
- **Touchpoint 3 (Social proof):** Case study / testimonial angle.
- **Touchpoint 4 (Breakup):** Soft last-chance message.

| Check | Status | Evidence |
|-------|--------|----------|
| First email generated/sent | **WORKING** | `executeOutreachStep()` calls `invokeLLM()` for message generation, then `sendEmail()` via Resend API |
| First SMS generated/sent | **WORKING** | `sendSms()` via Twilio API |
| Follow-up touchpoints scheduled | **WORKING** | After each step, `outreach_sequences.nextTouchAt` updated with delay (2/4/7 days) |
| Email/SMS logs created | **WORKING** | Each touchpoint creates `ai_conversations` record with `direction: 'outbound'`, `channel`, `content` |
| Touchpoint status tracked | **WORKING** | `outreach_sequences.currentStep` incremented, `status` updated |
| Opt-out/unsubscribe respected | **WORKING** | `sendEmail()` checks `email_unsubscribes` table before sending. Unsubscribe link in emails. Unsubscribe page at `/unsubscribe` → `system.unsubscribe` procedure |
| No reply → next follow-up | **WORKING** | Scheduled route picks up sequences where `nextTouchAt` has passed and `status = 'active'` |
| Reply → sequence pauses | **WORKING** | `handleInboundReply()` sets `outreach_sequences.status = 'paused'` |

**Tables:** `outreach_sequences`, `ai_conversations`

### 2.3 Message Source/Generator

All outreach messages are generated by `invokeLLM()` with a system prompt including business context, pain points, and step number. Messages are fully AI-generated per lead, not templates.

### 2.4 Duplicate Message Protection

| Check | Status | Evidence |
|-------|--------|----------|
| No duplicate messages | **WORKING** | `outreach_sequences.currentStep` incremented atomically. Scheduled route only processes sequences where `nextTouchAt <= now` and `status = 'active'`. |

### Phase 2 Summary

| Step | Status |
|------|--------|
| Sequence scheduled | WORKING |
| Email sent/mocked | WORKING |
| SMS sent/mocked | WORKING |
| Follow-ups scheduled | WORKING |
| Logs created | WORKING |
| Status tracked | WORKING |
| Unsubscribe respected | WORKING |
| No reply → next follow-up | WORKING |
| Reply → pause | WORKING |

---

## PHASE 3 — REPLY DETECTION / AI CLASSIFICATION

### 3.1 Inbound Reply Capture

**SMS webhook:** `server/twilio-webhooks.ts` → `POST /api/webhooks/twilio/inbound` — Twilio sends inbound SMS. Validates signature, extracts `From` phone and `Body`, looks up lead by phone.

**Email webhook:** `server/resend-webhooks.ts` → `POST /api/webhooks/resend` — Resend sends inbound email events. Extracts sender email and body, looks up lead by email.

| Check | Status | Evidence |
|-------|--------|----------|
| SMS reply captured | **WORKING** | Twilio webhook matches `From` phone to `leads.phone` |
| Email reply captured | **WORKING** | Resend webhook matches sender email to `leads.email` |
| Reply linked to correct lead | **WORKING** | Both webhooks do DB lookup by phone/email |

### 3.2 AI Classification / Decision Engine

**Code path:** Both webhooks call → `handleInboundReply()` in `server/services/leadGenOutreach.ts:284`

**How it works:**
1. Loads lead record + conversation history from `ai_conversations`
2. Builds prompt with full context (business info, history, reply text)
3. Calls `invokeLLM()` with structured JSON schema: `decision`, `confidence`, `reasoning`, `response`, `isEnterprise`
4. AI returns one of:
   - `push_for_close` → sends closing message with pricing link, lead → `stage: 'negotiating'`, `temperature: 'hot'`
   - `assign_to_rep` → finds best rep via `findBestRepForLead()`, sets `assignedRepId`, `stage: 'assigned'`
   - `assign_to_owner` → enterprise escalation, SMS to owner phone
   - `mark_not_interested` → `stage: 'closed_lost'`, `temperature: 'cold'`
   - `answer_question` / `continue_nurture` / `send_info` / `schedule_call` → sends AI response, updates temperature

**Simulating reply: "I'm interested. How much would this cost and can someone call me?"**
- AI would classify as `push_for_close` or `assign_to_rep` (high confidence, hot)
- Lead temperature → `hot`, stage → `negotiating` or `assigned`

| Check | Status | Evidence |
|-------|--------|----------|
| AI classifies intent | **WORKING** | `handleInboundReply()` → `invokeLLM()` with structured JSON |
| Sequence pauses | **WORKING** | Sets outreach sequence to `status: 'paused'` |
| Lead status/temperature updates | **WORKING** | `db.update(leads).set({ temperature, stage, lastTouchAt })` |
| Lead marked hot/ready | **WORKING** | Temperature set to `'hot'` for close/assign decisions |
| Rep handoff triggered | **WORKING** | `assign_to_rep` calls `findBestRepForLead()`, sets `assignedRepId` |
| Owner escalation | **WORKING** | `assign_to_owner` or `isEnterprise: true` → SMS to owner |
| Transcript visible | **WORKING** | All decisions logged to `ai_conversations` with `aiDecision`, `aiConfidence`, `aiReasoning` |
| Rep notification on handoff | **PARTIALLY WORKING** | `assign_to_rep` updates `assignedRepId` but does NOT create a `rep_notifications` record. Rep discovers new lead only on dashboard refresh. |

### Phase 3 Summary

| Step | Status |
|------|--------|
| SMS reply captured | WORKING |
| Email reply captured | WORKING |
| Reply linked to lead | WORKING |
| AI classifies intent | WORKING |
| Sequence pauses | WORKING |
| Status/temperature updates | WORKING |
| Rep handoff triggered | WORKING |
| Owner escalation | WORKING |
| Transcript visible | WORKING |
| Rep notification on handoff | PARTIALLY WORKING — no push notification |

---

## PHASE 4 — HUMAN REP HANDOFF

### 4.1 What the Rep Sees

**Frontend:** `client/src/pages/RepDashboard.tsx` — tabbed dashboard (Performance, Pipeline, Training, Earnings, CommsHub)
**Pipeline tab:** Shows leads from `trpc.leads.myLeads` (only leads assigned to this rep).

| What rep sees | Status | Evidence |
|---------------|--------|----------|
| Hot lead in feed | **WORKING** | `leads.myLeads` returns assigned leads; Pipeline tab shows sorted by temperature/stage |
| Business summary | **WORKING** | Lead card shows `businessName`, `contactName`, `email`, `phone`, `industry`, `location` |
| AI conversation history | **WORKING** | `trpc.leads.getConversations` returns `ai_conversations` for the lead |
| Lead score | **WORKING** | `leads.leadScore` displayed on lead card |
| Pain points | **WORKING** | Stored in `leads.enrichmentData` JSON, displayed if present |
| Suggested pitch | **PARTIALLY WORKING** | `trpc.leads.generateProposal` generates AI proposal — but rep must manually trigger, not auto-shown |
| Objection handling | **PARTIALLY WORKING** | Part of AI proposal generation, not standalone |
| Recommended package | **WORKING** | AI proposal includes package recommendation |
| Next best action | **MISSING** | No explicit "next best action" widget |
| Call/SMS/email actions | **WORKING** | CommsHub tab provides SMS/email sending via `trpc.leads.sendMessage` |
| Commission estimate | **WORKING** | Shown in closeDeal flow |
| Follow-up task/timer | **MISSING** | No follow-up task scheduler for reps |

### 4.2 Rep Actions

- **Rep responds:** `trpc.leads.sendMessage` → sends SMS/email to lead
- **Rep sends quote:** `trpc.leads.generateProposal` → AI generates proposal email
- **Rep moves stage:** `trpc.leads.updateMyLead` → updates `leads.stage`
- **Rep closes deal:** `trpc.leads.closeDeal` (`server/routers.ts:561+`)

**closeDeal chain:**
1. Validates rep owns the lead (`assertRepOwnership`)
2. Creates customer record (`db.createCustomer`)
3. Creates contract (`db.createContract`) — 12-month, `monthlyPrice`, `packageTier`, `stripeSubscriptionId: undefined`
4. Calculates commission based on rep tier, self-sourced 2x bonus
5. Creates commission (`db.createCommission`) — `type: 'initial_sale'`, `status: 'approved'`
6. Updates rep stats
7. Checks referral bonus
8. Logs activity
9. Notifies rep
10. Auto-creates onboarding project (`stage: 'intake'`)
11. Notifies owner

| Rep action | Status | Evidence |
|------------|--------|----------|
| Rep responds | **WORKING** | CommsHub SMS/email |
| Rep sends quote | **WORKING** | `generateProposal` |
| Rep moves stage | **WORKING** | `updateMyLead` |
| Rep closes deal | **WORKING** | `closeDeal` creates full chain |
| Commission preserved | **WORKING** | `commissions` table |

### 4.3 Gaps

| Gap | Severity |
|-----|----------|
| No "next best action" widget | Minor |
| No follow-up task/timer | Minor |
| No rep notification on AI handoff | Medium |
| Rep-closed deals have no Stripe subscription | Medium — contract exists but no payment mechanism |

### Phase 4 Summary

| Step | Status |
|------|--------|
| Hot lead in feed | WORKING |
| Business summary | WORKING |
| AI conversation history | WORKING |
| Lead score | WORKING |
| Suggested pitch | PARTIALLY WORKING |
| Next best action | MISSING |
| Call/SMS/email actions | WORKING |
| Commission estimate | WORKING |
| Follow-up timer | MISSING |
| Rep closes deal | WORKING |
| Commission preserved | WORKING |

---

## PHASE 5 — CUSTOMER PAYMENT / CLOSE

### 5.1 Two Payment Paths

**Path A — Self-service checkout (customer-initiated):**
- Customer visits `/get-started` (`client/src/pages/GetStarted.tsx`)
- Selects package, fills business info
- Calls `trpc.orders.createCheckout` (`server/routers.ts:1500+`)
- Creates Stripe Checkout Session with `mode: 'subscription'`, metadata (`user_id`, `customer_email`, `business_name`, `package_tier`), `allow_promotion_codes: true`
- Returns checkout URL → frontend opens in new tab

**Path B — Rep-closed deal:**
- Rep calls `closeDeal` → creates customer/contract/commission/onboarding
- **No Stripe checkout created** — contract has no `stripeSubscriptionId`

### 5.2 Stripe Webhook Chain (Path A)

**Webhook:** `server/stripe-webhook.ts` → `POST /api/stripe/webhook`
**Registered:** `server/_core/index.ts` with `express.raw()` BEFORE `express.json()`

**`checkout.session.completed` → `handleCheckoutCompleted()`:**

| Step | Status | Evidence |
|------|--------|----------|
| Order updated to paid | **WORKING** | `orders` table: `status: 'paid'`, `stripePaymentIntentId` set |
| Stripe customer ID saved | **WORKING** | `users.stripeCustomerId` updated |
| Customer created (idempotent) | **WORKING** | Checks by `userId` first |
| Contract created (idempotent) | **WORKING** | 60s dedup window, `stripeSubscriptionId`, `packageTier`, `monthlyPrice` |
| Onboarding project created (idempotent) | **WORKING** | Checks `getOnboardingProjectByCustomerId()` first, `stage: 'questionnaire'` |
| Commission created | **PARTIALLY WORKING** | `createInitialCommission()` only for `repId > 0`. Self-service sets `repId: 0` — no commission. |
| Welcome email sent | **WORKING** | `sendWelcomeEmail()` via Resend |
| Customer directed to portal | **WORKING** | `success_url` → `/checkout-success` → links to portal |
| Test event handling | **WORKING** | `event.id.startsWith('evt_test_')` → `{ verified: true }` |
| Signature verification | **WORKING** | `stripe.webhooks.constructEvent()` |

### 5.3 Idempotency

| Check | Status |
|-------|--------|
| Order dedup | **WORKING** — by `stripeCheckoutSessionId` |
| Customer dedup | **WORKING** — by `userId` |
| Contract dedup | **WORKING** — 60s window |
| Onboarding dedup | **WORKING** — by `customerId` |
| Commission dedup | **WORKING** — checks `hasInitialSale` |

### 5.4 What Customer Sees After Checkout

`client/src/pages/CheckoutSuccess.tsx` — success message, links to portal.

### 5.5 Gaps

| Gap | Severity |
|-----|----------|
| Rep-closed deals have no Stripe subscription | **High** |
| Self-service: no commission for rep-nurtured leads | **Medium** |

### Phase 5 Summary

| Step | Status |
|------|--------|
| Customer directed to checkout | WORKING |
| Stripe session created | WORKING |
| Package metadata included | WORKING |
| Payment succeeds (test) | WORKING |
| Webhook updates order | WORKING |
| Customer record created | WORKING |
| Contract created | WORKING |
| Onboarding project created | WORKING |
| Commission created | PARTIALLY WORKING |
| Welcome email sent | WORKING |
| Customer directed to portal | WORKING |

---

## PHASE 6 — CUSTOMER ONBOARDING TO BUILD WEBSITE

### 6.1 Customer Login and Portal

**Login:** Manus OAuth or local auth (`/login` → `server/localAuthRouter.ts`)
**Portal:** `client/src/pages/CustomerPortal.tsx` — tabbed interface

**Data loading:**
- `trpc.customers.me` — customer record by `ctx.user.id`
- `trpc.onboarding.myProject` — onboarding project (joins projects → customers → users)
- `trpc.contracts.myContracts` — contracts for customer
- `trpc.retention.mySupportLogs` — support/nurture logs
- `trpc.retention.myReferrals` — referral submissions

| Check | Status | Evidence |
|-------|--------|----------|
| Customer logs in | **WORKING** | OAuth or local auth, session cookie |
| Portal uses `customers.me` | **WORKING** | `server/routers.ts:852+` protectedProcedure |
| Package/contract visible | **WORKING** | BillingTab via `contracts.myContracts` |
| Onboarding project appears | **WORKING** | Onboarding tab via `onboarding.myProject` |

### 6.2 Onboarding Flow

**Frontend:** `client/src/pages/Onboarding.tsx` — multi-step wizard
**Stages:** `questionnaire` → `intake` → `design` → `review` → `revision` → `launch_prep` → `launched`

**Step 1: Questionnaire** — `trpc.onboarding.submitQuestionnaire` (`server/routers.ts:1622+`). Customer fills in business description, target audience, style, colors, content notes. Stored in `onboarding_projects.questionnaireData` (JSON). Stage advances to `intake`.

**Step 2: Asset Upload** — `trpc.onboarding.uploadAsset` → `storagePut()` to S3. Assets in `project_assets` table. Customer can view (`listProjectAssets`) and delete (`deleteAsset` with ownership check).

**Step 3: Domain Preference** — `trpc.onboarding.setDomainPreference` (`server/routers.ts:1647+`). Stored in `onboarding_projects.domainPreference` and `existingDomain`.

| Check | Status | Evidence |
|-------|--------|----------|
| Questionnaire completed | **WORKING** | Stores JSON, advances stage |
| Business info submitted | **WORKING** | Part of questionnaire |
| Assets uploaded | **WORKING** | S3 + `project_assets` table |
| Style preferences | **WORKING** | Part of questionnaire |
| Domain info provided | **WORKING** | `setDomainPreference` |
| Status updates | **WORKING** | `onboarding_projects.stage` updated |
| Admin sees project | **WORKING** | `client/src/pages/admin/OnboardingProjects.tsx` |
| Customer sees progress | **WORKING** | Onboarding.tsx shows stage with progress indicator |

### 6.3 Automated vs Manual

| Action | Auto/Manual |
|--------|-------------|
| Questionnaire submission | Automated (customer self-serve) |
| Asset upload | Automated (customer self-serve) |
| Domain preference | Automated (customer self-serve) |
| Stage advancement (intake → design) | **Manual** — admin via `updateStage` |
| Website design/build | **Manual** — external |
| Design mockup upload | **Manual** — admin uploads preview URL |

### 6.4 Gaps

| Gap | Severity |
|-----|----------|
| Stage change emails never sent | **BROKEN** — `sendOnboardingStageEmail()` exists in `emailService.ts` but is never called anywhere. Customer has no way to know project moved stages. |
| No auto-advance after questionnaire + assets | Minor |

### Phase 6 Summary

| Step | Status |
|------|--------|
| Customer logs in | WORKING |
| Portal uses customers.me | WORKING |
| Package/contract visible | WORKING |
| Onboarding project appears | WORKING |
| Questionnaire completed | WORKING |
| Assets uploaded | WORKING |
| Domain info provided | WORKING |
| Status updates | WORKING |
| Admin sees project | WORKING |
| Customer sees progress | WORKING |
| Stage change email | BROKEN — function exists, never called |

---

## PHASE 7 — WEBSITE REVIEW AND REVISIONS

### 7.1 Review Stage

1. Admin advances project to `review` via `trpc.onboarding.updateStage` (`server/routers.ts:1751+`)
2. Admin sets `designMockupUrl` — URL to draft website preview
3. Customer sees review section in `Onboarding.tsx:920+` — displays `designMockupUrl`

| Check | Status | Evidence |
|-------|--------|----------|
| Review stage exists | **WORKING** | `stage = 'review'` |
| Customer sees draft | **WORKING** | `designMockupUrl` displayed |
| Customer requests revisions | **WORKING** | `trpc.onboarding.submitFeedback` (`server/routers.ts:1714+`) |
| Revision logged | **WORKING** | `revisionNotes` stored, `revisionCount` incremented, stage → `'revision'` |
| Admin sees revision | **WORKING** | OnboardingProjects page shows notes + count |
| Status updates | **WORKING** | `review` → `revision` → `review` cycle |
| Customer notified | **BROKEN** | `sendOnboardingStageEmail()` never called |
| Final approval | **WORKING** | `trpc.onboarding.approveLaunch` → stage → `'launched'` |

### 7.2 Simulating Revisions

**Revision 1:** Customer calls `submitFeedback` with "Change headline to 'Premium Auto Detailing in Muskegon'". `revisionNotes` updated, `revisionCount` → 1, stage → `'revision'`.

**Revision 2:** Customer calls `submitFeedback` with "Replace hero photo, add Ceramic Coating service". `revisionNotes` **overwritten** (not appended), `revisionCount` → 2.

| Check | Status | Evidence |
|-------|--------|----------|
| Revision 1 logged | **WORKING** | Notes stored, count incremented |
| Revision 2 logged | **WORKING** | Same flow |
| Customer self-serve changes | **NOT SUPPORTED** | All changes go through admin |

### 7.3 Gaps

| Gap | Severity |
|-----|----------|
| Revision notes overwritten, not appended | **Minor** — previous feedback lost |
| No revision history log | **Minor** — only latest notes + total count |

### Phase 7 Summary

| Step | Status |
|------|--------|
| Review stage exists | WORKING |
| Customer sees draft | WORKING |
| Customer requests revisions | WORKING |
| Revision logged | WORKING |
| Admin sees revision | WORKING |
| Customer notified | BROKEN |
| Final approval | WORKING |
| Revision history | PARTIALLY WORKING — overwritten |

---

## PHASE 8 — AI WIDGET UPSELL

### 8.1 Upsell System

**Widget catalog:** `widget_catalog` table (`drizzle/schema.ts:420+`) — `slug`, `name`, `description`, `monthlyPrice`, `category`
**Upsell opportunities:** `upsell_opportunities` table — `status`, `widgetSlug`, `customerId`

### 8.2 Customer-Facing Flow

| Check | Status | Evidence |
|-------|--------|----------|
| System identifies upsell | **PARTIALLY WORKING** | Admin manually creates. AI nurture emails suggest widgets but don't auto-create records. |
| AI widget in catalog | **WORKING** | Seeded via `widgetCatalog.seed` |
| Customer views offer | **WORKING** | Portal Upsells tab via `upsells.myUpsells` |
| Customer requests widget | **WORKING** | `trpc.upsells.requestWidget` → status → `'requested'` |
| Payment for add-on | **MISSING** | No Stripe checkout for upsells |
| Status updates | **WORKING** | `proposed` → `requested` → `approved` → `installed` → `declined` |
| Fulfillment task | **PARTIALLY WORKING** | Status visible to admin, no explicit task |
| Billing impact | **MISSING** | No mechanism to add widget cost to subscription |

### Phase 8 Summary

| Step | Status |
|------|--------|
| Upsell identified | PARTIALLY WORKING |
| Widget in catalog | WORKING |
| Customer views offer | WORKING |
| Customer requests | WORKING |
| Payment for add-on | MISSING |
| Status updates | WORKING |
| Billing impact | MISSING |

---

## PHASE 9 — DOMAIN HANDOFF AND LAUNCH

### 9.1 Domain Preference

`trpc.onboarding.setDomainPreference` — `domainPreference` (`'new'`/`'existing'`/`'none'`), `existingDomain`

### 9.2 Launch Flow

`trpc.onboarding.approveLaunch` — customer approves, stage → `'launched'`, `launchedAt` recorded.

| Check | Status | Evidence |
|-------|--------|----------|
| Domain info provided | **WORKING** | `setDomainPreference` |
| Domain task tracked | **PARTIALLY WORKING** | Preference stored, no dedicated task system |
| Launch stage exists | **WORKING** | `stage: 'launched'`, `launchedAt` |
| Final instructions sent | **BROKEN** | No email on launch |
| Portal shows launched | **WORKING** | Celebration UI in Onboarding.tsx |
| Admin marks complete | **WORKING** | `updateStage` |
| Customer notified | **BROKEN** | No launch email |

### Phase 9 Summary

| Step | Status |
|------|--------|
| Domain info provided | WORKING |
| Domain task tracked | PARTIALLY WORKING |
| Launch stage exists | WORKING |
| Final instructions | BROKEN |
| Portal shows launched | WORKING |
| Admin marks complete | WORKING |
| Customer notified | BROKEN |

---

## PHASE 10 — MONTHLY RETENTION PIPELINE

### Month 1

| Check | Status | Evidence |
|-------|--------|----------|
| Monthly report | **MANUAL** | Admin triggers `reports.generate` — no scheduled route |
| NPS survey (30-day) | **WORKING** | Scheduled route `nps-surveys` creates survey + sends email |
| NPS submission | **WORKING** | `retention.submitNps` stores score/feedback |
| Support touchpoint | **WORKING** | Customer self-serve via portal SupportTab |

### Month 2

| Check | Status | Evidence |
|-------|--------|----------|
| Change request logged | **WORKING** | `retention.createSupportRequest` → `nurture_logs` |
| Admin sees request | **WORKING** | Admin Nurture page |
| Customer sees update | **PARTIALLY WORKING** | `mySupportLogs` returns logs, but no resolution tracking |

### Month 3

| Check | Status | Evidence |
|-------|--------|----------|
| AI suggests upsell | **WORKING** | `retention.generateNurtureEmail` via LLM with widget catalog |
| Customer declines/accepts | **WORKING** | Via `upsells.requestWidget` or ignoring |

### Month 6

| Check | Status | Evidence |
|-------|--------|----------|
| 6-month NPS | **WORKING** | Scheduled route checks `startDate <= sixMonthsAgo` |
| Health reviewed | **PARTIALLY WORKING** | `healthScore` exists but never auto-calculated. Always 100. |

### Month 11

| Check | Status | Evidence |
|-------|--------|----------|
| Renewal reminders | **WORKING** | Scheduled route `renewal-check` checks 30/14/7-day windows |
| Contract status | **WORKING** | → `'expiring_soon'` |
| Customer gets email | **WORKING** | `sendRenewalReminderEmail()` |
| Admin alerted | **WORKING** | `notifyOwner()` for high-value |

### Month 12

| Check | Status | Evidence |
|-------|--------|----------|
| Subscription continues | **WORKING** | Stripe auto-renews, `invoice.paid` webhook |
| Contract stays active | **WORKING** | `handleInvoicePaid()` keeps active |
| Recurring commission | **WORKING** | `createRecurringCommissionForContract()` |
| Cancellation handled | **WORKING** | `subscription.deleted` → customer `'churned'`, contract `'cancelled'` |

### Phase 10 Summary

| Step | Status |
|------|--------|
| Reports | MANUAL |
| NPS surveys | WORKING |
| Support requests | WORKING |
| Upsells proposed | WORKING |
| Renewal reminders | WORKING |
| Subscription lifecycle | WORKING |
| Health scoring | PARTIALLY WORKING — never auto-calculated |
| Portal shows history | WORKING |

---

## PHASE 11 — ADMIN EXCEPTION VIEW

| Exception | Visible? | Where | Status |
|-----------|----------|-------|--------|
| Failed payment | **YES** | Customers page (`at_risk` filter), nurture log | **WORKING** |
| Stale hot lead | **NO** | No aging/SLA indicator | **MISSING** |
| Ignored rep handoff | **NO** | No tracking of time since assignment | **MISSING** |
| Customer stuck in onboarding | **PARTIALLY** | OnboardingProjects shows stage, no "days in stage" | **PARTIALLY WORKING** |
| Support request waiting | **PARTIALLY** | Nurture page shows logs, no "unresolved" filter | **PARTIALLY WORKING** |
| Renewal risk | **YES** | Renewals page + `renewal-check` route | **WORKING** |
| Failed scheduled job | **NO** | Console logs only | **MISSING** |
| Failed SMS/email | **NO** | Console logs only | **MISSING** |
| Customer churn | **YES** | Customers page (`churned` filter) | **WORKING** |
| High-value lead escalation | **YES** | Owner SMS notification | **WORKING** |

**GovernancePanel** (`client/src/components/GovernancePanel.tsx`) shows: pending commissions, at-risk customers, expiring contracts. Does NOT show: stale leads, stuck projects, unresolved support, failed jobs.

---

## PHASE 12 — FULL CHAIN TABLE

| # | Step | Customer Sees | AI/System Does | Rep Does | Admin Sees | Tables | Status |
|---|------|--------------|----------------|----------|------------|--------|--------|
| 1 | Discovery | Nothing | Scrapes Google Maps, enriches Apollo/Hunter, scores LLM | Nothing | Lead in Leads page | `scraped_businesses`, `leads` | **WORKING** |
| 2 | Outreach #1 | Personalized email/SMS | Generates via LLM, sends Resend/Twilio | Nothing | Outreach in Lead Gen page | `outreach_sequences`, `ai_conversations` | **WORKING** |
| 3 | Outreach #2-4 | Follow-up messages | Schedules follow-ups, checks unsubscribe | Nothing | Sequence progress | `outreach_sequences`, `ai_conversations` | **WORKING** |
| 4 | Reply | Sends reply | Captures webhook, AI classifies, assigns to rep | Nothing | Lead → hot/assigned | `leads`, `ai_conversations` | **WORKING** |
| 5 | Rep handoff | Nothing | Updates assignment | Sees lead in Pipeline | Lead assigned | `leads` | **PARTIALLY WORKING** |
| 6 | Rep engagement | Call/email from rep | Logs conversation | Calls, sends proposal | Activity in dashboard | `ai_conversations`, `activity_logs` | **WORKING** |
| 7 | Payment | Stripe checkout | Creates session, processes webhook, creates all records | Closes deal OR sends link | Order+customer+contract | `orders`, `customers`, `contracts`, `onboarding_projects`, `commissions` | **WORKING** |
| 8 | Welcome | Welcome email, success page | Sends email | Nothing | New customer | `customers` | **WORKING** |
| 9 | Questionnaire | Fills form in portal | Stores data, advances stage | Nothing | Project in intake | `onboarding_projects` | **WORKING** |
| 10 | Assets | Uploads in portal | S3 storage | Nothing | Assets on project | `project_assets` | **WORKING** |
| 11 | Domain | Sets preference | Stores preference | Nothing | Preference visible | `onboarding_projects` | **WORKING** |
| 12 | Build | Waits | Nothing | Nothing | Builds externally | — | **MANUAL** |
| 13 | Review | Sees mockup URL | Nothing | Nothing | Uploads mockup | `onboarding_projects` | **WORKING** |
| 14 | Revision #1 | Submits feedback | Stores, stage → revision | Nothing | Revision visible | `onboarding_projects` | **WORKING** |
| 15 | Revision #2 | Submits feedback | Overwrites previous | Nothing | Latest visible | `onboarding_projects` | **PARTIALLY WORKING** |
| 16 | Launch | Clicks approve | Stage → launched | Nothing | Project launched | `onboarding_projects` | **WORKING** |
| 17 | Launch email | Nothing | Nothing | Nothing | Nothing | — | **BROKEN** |
| 18 | Month 1 NPS | Survey email, submits | Scheduled route creates+sends | Nothing | NPS visible | `nps_surveys` | **WORKING** |
| 19 | Month 2 change | Submits request | Creates nurture log | Nothing | Request in Nurture | `nurture_logs` | **WORKING** |
| 20 | Month 3 upsell | AI email with suggestion | LLM generates recommendations | Nothing | Upsell visible | `upsell_opportunities` | **PARTIALLY WORKING** |
| 21 | Widget request | Requests in portal | Status → requested | Nothing | Request visible | `upsell_opportunities` | **WORKING** |
| 22 | Month 6 NPS | 6-month survey | Scheduled route | Nothing | NPS visible | `nps_surveys` | **WORKING** |
| 23 | Month 11 | Renewal email | Scheduled route detects, sends | Nothing | Contract expiring | `contracts`, `nurture_logs` | **WORKING** |
| 24 | Month 12 | Auto-charged | Webhook processes, recurring commission | Nothing | Contract active | `contracts`, `commissions`, `orders` | **WORKING** |
| 25 | AI concierge | Chats in portal | LLM with customer context | Nothing | — | — | **WORKING** |
| 26 | Referral | Submits in portal | Creates record | Nothing | Referral visible | `referrals` | **WORKING** |

### Status Counts

| Status | Count |
|--------|-------|
| WORKING | 19 |
| PARTIALLY WORKING | 4 |
| MANUAL | 1 |
| BROKEN | 2 |
| MISSING | 0 |

---

## GAPS BLOCKING A REAL CUSTOMER

1. **Onboarding stage change emails never sent** — `sendOnboardingStageEmail()` exists in `emailService.ts` but is never called from `updateStage`, `submitFeedback`, or `approveLaunch`. Customer has no way to know their project moved stages without checking the portal.

2. **Revision notes overwritten** — `submitFeedback` replaces `revisionNotes` instead of appending. Previous revision feedback is lost.

3. **No rep notification on AI lead handoff** — When AI assigns a lead to a rep via `handleInboundReply()`, no `rep_notifications` record is created. Rep must manually check dashboard.

## GAPS PREVENTING FULL AUTONOMY

1. **No automated health score calculation** — `customers.healthScore` defaults to 100 and is never auto-updated. Should factor in NPS, support requests, payment history, engagement.

2. **No automated monthly reports** — Admin must manually trigger `reports.generate`. No scheduled route.

3. **No payment flow for upsell add-ons** — Customer can request widgets but can't pay. No Stripe checkout for upsells.

4. **No cross-source lead dedup** — Business could exist as both scraped lead and free-audit lead.

5. **Rep-closed deals have no Stripe subscription** — `closeDeal` creates contract without payment mechanism.

6. **No stale lead / SLA tracking** — No alerts for leads going cold, ignored handoffs, or stuck onboarding.

7. **No support request resolution tracking** — Customer submits but can't see if resolved.

8. **NPS milestones are one-time** — Only 30-day and 6-month. No annual cycle for renewed customers.

---

## EXACT NEXT SURGICAL PROMPTS

### Prompt 1: Wire onboarding stage change emails (BROKEN → WORKING)
In `server/routers.ts`, in `onboarding.updateStage` (line ~1751), after stage is updated, call `sendOnboardingStageEmail()` with customer email, name, new stage, project info. Also call in `submitFeedback` (confirmation) and `approveLaunch` (launch confirmation). 3 lines in 3 places.

### Prompt 2: Fix revision notes to append instead of overwrite
In `server/routers.ts`, in `onboarding.submitFeedback` (line ~1714), change `revisionNotes` from overwrite to prepend with timestamp: `` `[${new Date().toISOString()}] ${input.feedback}\n\n${existingProject.revisionNotes || ''}` ``

### Prompt 3: Add rep notification on AI lead handoff
In `server/services/leadGenOutreach.ts`, in `handleInboundReply()`, after `assign_to_rep` block, add `db.createRepNotification({ repId, type: 'lead_assigned', title: 'New Hot Lead', message })`.

### Prompt 4: Wire automated health score calculation
Create scheduled route `POST /api/scheduled/health-score-update` that calculates score from NPS (30%), support frequency (20%), payment history (30%), engagement recency (20%). Update `customers.healthScore`.

### Prompt 5: Add cross-source lead dedup
In `server/services/leadGenScraper.ts`, before inserting lead, check `leads` table for matching `email` OR (`businessName` AND `location`). Update existing instead of creating duplicate.
