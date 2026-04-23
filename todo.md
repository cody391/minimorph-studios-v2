# MiniMorph Studios — Full Platform Build

## Phase 1: Full-Stack Upgrade
- [x] Upgrade project with web-db-user feature (database + auth + backend)
- [x] Verify database connection and auth working

## Phase 2: Database Schema & Core API
- [x] Design and create 10 database tables: users, reps, leads, customers, contracts, commissions, nurture_logs, reports, upsell_opportunities, contact_submissions
- [x] Build complete tRPC API routes for all entities (CRUD + specialized queries)
- [x] 14 unit tests passing (auth + all routers)

## Phase 3: Admin Dashboard — Overview
- [x] Admin overview page with 6 key metrics (reps, leads, customers, contracts, revenue, payouts)
- [x] Lifecycle loop visualization showing all 9 stages
- [x] Quick action buttons (Add Lead, Manage Reps, View Contracts, Check Renewals)

## Phase 4: Admin — Rep Management
- [x] Rep list with status badges (applied/training/active/suspended), training progress bars, deal counts, revenue
- [x] Status management (approve, promote, suspend reps)
- [x] Public rep application endpoint (submitApplication)

## Phase 5: Admin — Lead Pipeline
- [x] Lead pipeline view with temperature scoring (cold/warm/hot) metric cards
- [x] Lead creation form with business details, source, industry
- [x] Lead status management (new → enriched → warming → assigned → contacted → closed)
- [x] Rep assignment capability

## Phase 6: Admin — Customer Management
- [x] Customer list with health scores, status badges (active/at_risk/churned)
- [x] Customer creation and update forms

## Phase 7: Admin — Contract Management
- [x] Contract list with status cards (active/expiring soon/expired)
- [x] Contract lifecycle tracking (start date, end date, package tier, monthly price)
- [x] Renewal status management

## Phase 8: Admin — Commission Tracking
- [x] Commission list with status management (pending/approved/paid)
- [x] Commission creation tied to reps and contracts
- [x] Payout tracking

## Phase 9: Admin — Customer Nurture
- [x] Nurture log list with type/channel/status tracking
- [x] Create nurture entries (check-ins, support requests, feedback, upsell attempts)
- [x] Scheduling and delivery status management

## Phase 10: Admin — Reports
- [x] Report list with generation and delivery status
- [x] Report creation with website metrics (page views, visitors, bounce rate, conversion)
- [x] Delivery tracking

## Phase 11: Admin — Upsell Opportunities
- [x] Upsell opportunity list with status management
- [x] Opportunity creation (tier upgrade, add pages, add features, add services)
- [x] Value estimation and proposal tracking

## Phase 12: Admin — Renewal Management
- [x] Renewal dashboard with expiring soon / expired / renewed / active metrics
- [x] Contracts expiring soon alert section
- [x] Contract timeline view

## Phase 13: Contact Form & Submissions
- [x] Public contact form wired to backend (stores in contact_submissions table)
- [x] Admin submissions page with status tracking (new/reviewed/converted/archived)
- [x] Submission detail dialog
- [x] Owner notification on contact form submission (using notifyOwner)

## Phase 14: Public Sales Website
- [x] Hero section with warm machine design
- [x] Stats / social proof section
- [x] Services grid
- [x] Portfolio showcase (7 projects with AI-generated mockups, category filters)
- [x] How It Works — customer-facing 4-step journey (Tell Us → We Design → Goes Live → We Keep Growing)
- [x] Core Principle section ("Humans close. AI does everything else.")
- [x] 3-tier Pricing cards (Starter/Growth/Premium)
- [x] Testimonials carousel
- [x] FAQ accordion
- [x] Footer with portal links (Get Started, Rep Dashboard, Customer Portal, Admin)

## Phase 15: Portals & Wizards
- [x] Rep-facing dashboard (rep sees their own leads, commissions, performance)
- [x] Customer-facing portal (contract overview, reports, support history, upgrade recommendations)
- [x] Multi-step guided buying wizard (4 steps: business info → package → style → review & submit)
- [x] Become a Rep application page (/become-rep)

## Phase 16: CTA Integration
- [x] Hero CTA → /get-started
- [x] Navbar CTA → /get-started
- [x] Pricing CTAs → /get-started
- [x] Footer portal links wired

## Phase 17: Data & Quality
- [x] Idempotent seed script (seed-demo.mjs) — clears and re-seeds cleanly
- [x] Demo data: 4 reps, 6 leads, 3 customers, 3 contracts, 4 commissions, 5 nurture logs, 4 reports, 3 upsells, 3 contact submissions

## Future Enhancements
- [x] Analytics dashboard page with placeholder data and GA4 connect prompt
- [x] Automated nurture notifications (send via notifyOwner, AI-generated check-ins via LLM)
- [x] AI-powered lead enrichment (LLM analyzes business and returns company size, revenue, online presence, recommended package, website needs)
- [x] Stripe payment integration fully implemented:
  - [x] Stripe checkout session creation (Starter $1,499 / Growth $2,999 / Premium $5,999)
  - [x] Stripe webhook handler (checkout.session.completed, payment_intent.succeeded/failed)
  - [x] Orders table in database with payment tracking
  - [x] Admin Orders page with revenue metrics and order table
  - [x] Checkout success page (/checkout/success)
  - [x] 31 unit tests passing (7 new Stripe/orders tests)

## How It Works — Customer-Facing Rewrite
- [x] Rewrite public "How It Works" section to show customer journey (outward-facing), not internal ops lifecycle
- [x] Keep internal lifecycle visualization only in admin dashboard

## CorePrinciple Section — Customer-Facing Rewrite
- [x] Rewrite "Humans close. AI does everything else." section to focus on customer outcomes, not internal AI/human split
- [x] Remove internal language about reps, AI system mechanics — replace with "dedicated team" messaging

## Customer Onboarding Portal
- [x] Create onboarding_projects table (tracks project status from intake to launch)
- [x] Create project_assets table (stores uploaded files: logos, photos, docs)
- [x] Create onboarding questionnaire (brand tone, colors, target audience, competitors, content preferences, must-have features, inspiration URLs)
- [x] Build asset upload system (logo, photos, brand guidelines, written content, documents — stored in S3)
- [x] Build domain handling (I have a domain / I need a new domain / Not sure yet — with domain input and registrar fields)
- [x] Build project tracker page (Intake → Design → Review → Revisions → Launch → Live status)
- [x] Build review & feedback system (customer views mockups, leaves comments, approves for launch — includes mockup display, feedback textarea, Request Changes button, Approve for Launch button, revision counter, and live URL display)
- [x] Wire onboarding into customer portal (/onboarding)
- [x] Add onboarding management to admin dashboard (/admin/onboarding)
- [x] Write tests for onboarding API routes (42 tests total passing)

## Phase 18: Conversational AI Onboarding Agent
- [x] Create backend tRPC endpoint for onboarding AI chat (invokeLLM with system prompt about MiniMorph services, questionnaire fields, brand guidance)
- [x] AI agent asks discovery questions, suggests brand tone/colors/features, generates copy from descriptions
- [x] AI auto-extracts structured data from conversation to populate questionnaire fields
- [x] Add AI chat panel to onboarding questionnaire step using AIChatBox component
- [x] Suggested prompts for common starting points ("I don't have a logo yet", "Help me describe my brand", "What features do I need?")

## Phase 19: AI Concierge in Customer Portal
- [x] Create backend tRPC endpoint for portal AI concierge chat (context-aware: knows customer's package, site status, available upsells)
- [x] AI steers indecisive customers with logic: asks about goals, recommends actions, explains upsell value
- [x] Add AI concierge chat panel to customer portal (floating or tab-based)
- [x] Suggested prompts: "What should I do next?", "How can I get more traffic?", "What add-ons would help my business?"

## Phase 20: Domain Cost Transparency + Revision Policy
- [x] Update domain setup step to show pricing: free Year 1 on Growth/Premium, $15/yr on Starter
- [x] Add revision policy display: 3 rounds included, $149/round after that
- [x] Show policy in onboarding review step and customer portal

## Phase 21: Post-Build AI Widget/Agent Upsell Catalog
- [x] Define upsell product catalog: AI Chatbot ($299/mo), Booking Widget ($199/mo), Review Collector ($149/mo), Lead Capture Bot ($249/mo), SEO Autopilot ($199/mo), Extra Pages ($499 one-time), Priority Support ($99/mo)
- [x] Add "Grow Your Site" section to customer portal with upsell cards, descriptions, and pricing
- [x] Wire upsell acceptance to create upsell_opportunities records and notify admin
- [x] Update admin upsells page to show catalog-based upsells with product details

## Phase 22: Monthly Email Upsell Sequences
- [x] Create AI-powered nurture email generator that includes personalized upsell recommendations
- [x] AI analyzes customer business type, current package, site performance to recommend relevant add-ons
- [x] Generate email content with value proposition tied to customer's specific metrics
- [x] Add "Generate Upsell Email" action to admin nurture page
- [x] Include upsell tracking in nurture logs (type: upsell_attempt with product reference)

## Phase 23: Complete Rep Ecosystem — End-to-End Sales Force Platform

### Rep Onboarding (Uber/DoorDash style)
- [x] Multi-step rep application: personal info, experience, motivation, availability
- [x] Rep training modules: company overview, sales scripts, product knowledge, objection handling
- [x] Certification quiz: must pass to activate as rep
- [x] Rep agreement/contract acceptance step
- [x] Tax info collection (W-9/W-8BEN) via secure form (via Stripe Connect)
- [x] Bank account / payout info via Stripe Connect onboarding
- [x] Rep profile with photo, bio, branded materials

### Rep Dashboard & Daily Workflow
- [x] Rep home dashboard: today's tasks, pipeline, earnings, rank
- [x] Gamification system: points, levels, badges, streaks
- [x] Leaderboard: top reps by sales, revenue, conversion rate
- [x] Daily activity tracker: calls made, emails sent, meetings booked
- [x] Lead assignment queue: hot leads auto-assigned to top performers

### Rep Communication Tools
- [x] Email templates library: intro, follow-up, proposal, close
- [x] Send email to customer directly from rep dashboard
- [x] Call logging: log call outcomes, notes, next steps
- [x] Text/SMS templates for quick outreach (email-based, SMS ready for future integration)
- [x] Customer-facing proposal/pitch deck generator (AI-powered email generator)
- [x] Branded collateral: digital business card, one-pagers (in rep profile)

### Commission & Payouts
- [x] 10% commission on every sale, tracked automatically
- [x] Commission dashboard: pending, approved, paid history
- [x] Automated payout via Stripe Connect (monthly or threshold-based)
- [x] Bonus tiers: higher commission % for top performers (gamification levels)
- [x] Clawback rules for cancelled contracts within 30 days (tracked in commission status)

### Admin Rep Management
- [x] Admin rep overview: all reps, status, performance metrics
- [x] Rep quality scoring: based on customer satisfaction, conversion rate
- [x] Rep deactivation/suspension workflow
- [x] Training completion tracking per rep
- [x] Commission approval workflow before payout

### Social Media Recruitment Strategy
- [x] Create recruitment landing page for reps (/careers page with hero, benefits, earnings calculator, level system, FAQs, CTA)
- [x] Social media post templates for recruiting reps (LinkedIn, Instagram, Facebook, X, TikTok — full document with posting strategy)
- [x] Referral program: $200 bonus auto-triggered when referred rep closes first deal, referredBy field in application, logic in commission creation

### Gap Fixes
- [x] Add Careers link to main Navbar navigation
- [x] Add collision-safe referral code generation with uniqueness check/retry loop, displayed in dashboard with copy button
- [x] Add dedicated "referral_bonus" commission type to schema
- [x] Add explicit Vitest cases for commission creation, type validation, auth checks, and referral code format
- [x] Surface social media templates in admin Reps page Recruitment tab with copy-to-clipboard + posting strategy guide

## Phase 24: Rep Pipeline Gaps
- [x] Rep lead management: protectedProcedure endpoints for reps to update stage, add notes, log outcomes on their assigned leads
- [x] Lead claiming: reps can grab unassigned leads from a pool (with claim limit to prevent hoarding)
- [x] Pipeline Kanban view: drag-and-drop board in rep dashboard showing leads by stage
- [x] Proposal generator: AI-generated branded proposals reps can send to prospects with package/pricing details
- [x] Deal close → customer conversion: automated flow (close deal → create customer → create contract → create commission)
- [x] Customer handoff: auto-trigger onboarding invite when deal closes
- [x] Admin lead transfer/bulk reassignment tool
- [x] In-app notifications for reps (new lead assigned, commission approved, training reminder)

### Phase 24 Gap Fixes
- [x] Add outcome field to updateMyLead endpoint (connected/voicemail/no_answer/scheduled/sent/completed)
- [x] Build admin bulk lead reassignment UI in admin Leads page
- [x] Wire commission-approved notification into admin commission approval workflow
- [x] Wire training-reminder notification into training module completion flow
- [x] Build rep notifications panel in RepDashboard (bell icon + dropdown with unread count)
- [x] Pipeline Kanban view in rep dashboard with stage columns and drag-to-move
- [x] Customer handoff: auto-trigger onboarding project creation when deal closes

### Phase 24 Gap Fixes (Round 2)
- [x] Add closed_lost to updateMyLead stage enum so reps can mark leads as lost
- [x] Add loading/error states to NotificationsBell component
- [x] Add Vitest tests for leads.closeDeal, leads.transferLeads, repNotifications.*, and pipeline endpoints (30 tests, all passing)

### Bug: /rep page errors
- [x] Fix 2 errors on the /rep page that prevent user from accessing it (endpoints returning undefined → null)

### Phase 25: Full Communications Platform
- [x] Collect and configure Resend API key, Twilio Account SID, Auth Token, Phone Number
- [x] Design communication schemas: sms_messages, call_logs tables (email uses existing rep_sent_emails) with unified query helpers
- [x] Design ai_coaching_feedback schema (stores AI review of each interaction)
- [x] Design training_insights schema (aggregated patterns from coaching for training academy)
- [x] Integrate Resend: real email delivery from rep compose, proposals, nurture emails
- [x] Add email open/click tracking via Resend webhooks (/api/resend/webhook)
- [x] Integrate Twilio SMS: send/receive real text messages to leads/customers
- [x] SMS thread view: conversation-style UI showing full SMS history per lead
- [x] Integrate Twilio Voice: browser-based calling via Twilio Client SDK
- [x] Call recording: auto-record all calls via Twilio + auto-transcription
- [x] Call transcription: auto-transcribe recorded calls
- [x] AI Communication Coach: after every email/SMS/call, AI reviews and gives feedback
- [x] Coaching feedback UI: show AI feedback inline with each communication
- [x] Adaptive training feed: aggregate coaching insights into patterns
- [x] Training academy integration: surface common mistakes and best practices from real interactions (adminListInsights endpoint)
- [x] Rebuild Communications tab: unified inbox with email/SMS/call tabs, dialer, thread views, AI Coach panel
- [x] PWA support: make the app installable on mobile devices (manifest.json, service worker, app icons)
- [x] Vitest tests for all new communication endpoints (29 tests, all passing)

### Phase 25 Gap Fixes
- [x] Wire proposal-send flow to Resend (generateProposal → actual email delivery)
- [x] Wire nurture email flows to Resend + Twilio SMS (admin nurture → actual email/SMS delivery)
- [x] Show AI coaching feedback inline on individual email/SMS/call records in CommsHub
- [x] Integrate training insights into Training Academy UI (show common mistakes/best practices from real interactions)

### Phase 25 Gap Fixes (Round 2)
- [x] Persist resendMessageId for proposal email records (nurture emails are admin-sent, not tracked per-rep)
- [x] Add Vitest test for Resend webhook processing (7 tests for webhook handler and db helpers)
- [x] PWA manifest, service worker, icons, and registration all in place (manifest.json, sw.js, main.tsx registration)

### Phase 26: Rep Experience Enhancements
- [x] Add profilePhotoUrl column to reps table
- [x] Add rep photo upload endpoint (upload to S3 via storagePut)
- [x] Add photo upload step in rep onboarding/application flow
- [x] Display rep photo as avatar throughout the app (dashboard, leaderboard, admin views)
- [x] Build branded email signature block using rep photo, name, title, phone
- [x] Inject email signature into all outbound rep emails (compose + proposals)
- [x] SMS legal compliance: append "Reply STOP to opt out" to first SMS in each new conversation
- [x] SMS STOP handling: auto-detect STOP replies in Twilio webhook, mark lead as opted-out
- [x] Create rep_support_tickets table (id, repId, subject, description, status, aiAnalysis, aiSolution, ownerApproval, createdAt, updatedAt)
- [x] Rep ticket submission endpoint + UI in rep dashboard
- [x] AI ticket triage: analyze ticket, propose solution, text owner for approval
- [x] Owner SMS approval: send ticket summary + solution to owner via Twilio, parse yes/no reply
- [x] Notify rep of ticket resolution outcome
- [x] Create rep_notification_preferences table (repId, category, enabled) + push_subscriptions table
- [x] Notification preferences UI panel in rep dashboard settings
- [x] Web push notification setup (VAPID keys, service worker push handler)
- [x] Push notification on new lead assignment, coaching feedback, ticket updates
- [x] Vitest tests for all new features (21 tests, all passing)

### Phase 27: Rep-Sourced Leads, Discounts, Enhanced Leaderboard & Instant Payouts
- [x] Self-sourced lead flow: rep can create their own lead, auto-flagged as "self_sourced", auto-assigned to them
- [x] Double commission (20%) on self-sourced deals vs standard 10% on assigned leads
- [x] Rep discount power: reps can apply up to 5% discount when closing a deal
- [x] Discount reflected in contract price and commission calculation
- [x] Enhanced leaderboard: add revenue-based ranking and deal count columns alongside points
- [x] Instant payout model: commissions auto-approved when customer pays (not pending)
- [x] Recurring commissions: every time customer pays monthly, rep gets their commission cut automatically
- [x] Commission stops when customer stops paying (tied to active subscription/payments)
- [x] Frontend: self-sourced lead creation UI in rep pipeline
- [x] Frontend: discount input in deal close flow
- [x] Frontend: instant payout indicator and earnings breakdown in rep dashboard
- [x] Vitest tests for all Phase 27 features (17 tests, all passing)
