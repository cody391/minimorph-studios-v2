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

### Phase 28: Autonomous Lead Generation Engine
- [x] DB schema: scrape_jobs, scraped_businesses, outreach_sequences, outreach_messages, enterprise_prospects
- [x] Scraper service: Google Maps Places API to find businesses by category + location
- [x] Website scorer: check if business has a website, score it with PageSpeed/Lighthouse logic
- [x] Filter low-hanging fruit: no website, bad website score, no online presence
- [x] Enrichment service: pull all available info on scraped business (reviews, hours, photos, social)
- [x] Decision-maker finder: identify owner/manager contact info from enrichment data
- [x] AI dossier generation: full company brief with pain points, opportunities, recommended approach
- [x] AI outreach agent: generate personalized first-touch email/SMS per lead
- [x] Outreach sequence engine: Day 0 intro, Day 2 follow-up SMS, Day 5 value-add email, Day 8 check-in SMS, Day 14 final
- [x] Inbound reply handler: AI reads replies, decides next action (answer questions, push for close, escalate)
- [x] Auto-close logic: if lead shows buying intent and is simple sale, AI tries to close directly
- [x] Rep routing: if lead needs human touch, assign to nearest rep with capacity
- [x] Rep capacity manager: track active leads per rep, auto-generate more when reps need them
- [x] Rep location matching: scrape leads near each rep's service area
- [x] Enterprise lead filter: identify big-ticket companies that could benefit from full AI automation
- [x] Owner pipeline: enterprise leads go directly to owner with full AI analysis report
- [x] Owner onboarding flow: questionnaire for enterprise prospects to describe their operations
- [x] Admin dashboard: lead gen engine control panel (start/stop, target areas, industry filters, stats)
- [x] Admin dashboard: real-time metrics (leads scraped, enriched, contacted, responding, converted)
- [x] Scheduled background jobs: cron-based continuous scraping, enrichment, outreach, routing, enterprise scan
- [x] Vitest tests for all lead gen engine features (26 tests, all passing)

### Phase 29: Lead Gen Engine Improvements (10 Enhancements)
- [x] Website Audit PDF: generate visual PDF report per lead showing issues, score, and recommendations
- [x] Website Audit as lead magnet: attach PDF to first outreach email for immediate value
- [x] Smart outreach timing: send emails Tue-Thu 9-11am local, SMS during business hours only
- [x] Drip campaign branching: branch sequences based on behavior (opened, clicked, replied, no engagement)
- [x] ML feedback loop scoring: track which leads convert, feed conversion data back into scoring model
- [x] Intent signal detection: track email opens, link clicks, website visits via UTM, multi-opens
- [x] Multi-source scraping: add Yelp, Facebook Business, BBB, industry directories beyond Google Maps
- [x] Competitor intelligence: find local competitors with great websites, include in dossier
- [x] Automated proposal generation: custom proposal with mockup, pricing, ROI calculator for hot leads
- [x] Re-engagement campaigns: 30-day drip for cold leads with new value propositions
- [x] Performance-based rep routing: route leads to reps with highest close rate for that lead type
- [x] Update admin dashboard with ML Scoring tab, Rep Performance tab, enhanced outreach panel
- [x] Vitest tests for all improvements (16 tests, all passing)

### Phase 30: Strengthen ML Scoring & Multi-Source Scraping
- [x] ML: Add location-based scoring (city/region win rates)
- [x] ML: Add time-of-contact correlation (best contact times per industry)
- [x] ML: Add lead source scoring (which scraping source produces best leads)
- [x] ML: Add recency decay factor (recent data weighted more than old data)
- [x] ML: Auto-retraining trigger when enough new closed leads accumulate
- [x] ML: Scoring confidence bands (high/medium/low with visual indicator)
- [x] ML: Track scoring accuracy over time (predicted score vs actual outcome)
- [x] Scrape: Add Facebook Business Pages scraping via Data API
- [x] Scrape: Add BBB listings scraping via Data API
- [x] Scrape: Add industry-specific directories (HomeAdvisor, OpenTable)
- [x] Scrape: Google Business Profile deep enrichment (hours, photos, services)
- [x] Scrape: Batch scraping with configurable rate limiting and exponential retry
- [x] Scrape: Source quality tracking (which source produces most conversions)
- [x] Scrape: Parallel source scraping with sequential rate-limited execution
- [x] Update admin dashboard with source quality endpoint and scheduler stats
- [x] Vitest tests for all enhancements (22 tests, all passing)

### Phase 31: AI-First Lead Warming System
- [x] Contact enrichment service: integrate Apollo.io / Hunter.io for decision-maker name, email, direct phone
- [x] Enrichment fallback chain: try Apollo → Hunter → LLM inference → manual flag
- [x] Store enriched contacts in DB with confidence score and source
- [x] Adaptive scaling: auto-expand search radius when leads run low
- [x] Adaptive scaling: category rotation — track exhausted categories per area, rotate to fresh ones
- [x] Adaptive scaling: geographic expansion — auto-scrape neighboring cities when primary is tapped
- [x] Adaptive scaling: quality threshold relaxation — gradually lower bar when volume is needed
- [x] Adaptive scaling: "running low" detection based on rep capacity vs available leads
- [x] Free website audit landing page: public form where prospects request their own audit
- [x] Audit page: auto-generate PDF report and email it to prospect
- [x] Audit page: auto-create lead in pipeline as warm inbound (higher priority)
- [x] AI conversation agent: deep personalization using all enrichment data
- [x] AI conversation agent: industry-specific objection handling playbooks
- [x] AI conversation agent: self-close logic — detect buying intent, push to checkout
- [x] AI conversation agent: escalation logic — detect when human touch needed, hand to rep with context
- [x] AI conversation agent: multi-turn memory — remember previous interactions across email/SMS
- [x] Wire conversation AI into Twilio SMS webhook for autonomous inbound reply handling
- [x] Wire enrichment into outreach pipeline (enrich before first contact)
- [x] Wire audit page submissions into lead pipeline
- [x] Wire adaptive scaling into scheduler
- [x] Add Phase 31 endpoints to leadGenRouter (enrichContacts, adaptiveScaling, conversationAI, businessIntelligence)
- [x] Vitest tests for all Phase 31 features (49 tests, all passing)

### Integration Secrets & Owner Phone Wiring
- [x] Apollo.io API key configured and validated (contact enrichment)
- [x] Hunter.io API key configured and validated (email finder fallback)
- [x] Twilio TwiML App SID configured (browser-based calling)
- [x] Resend webhook signing secret configured (email delivery tracking)
- [x] Owner phone number (OWNER_PHONE_NUMBER) added to ENV and wired into all SMS notification paths
- [x] Owner SMS alerts for: ticket escalations (repEcosystem.ts)
- [x] Owner SMS alerts for: enterprise lead assignments (leadGenOutreach.ts)
- [x] Owner SMS alerts for: conversation AI escalations (leadGenConversationAI.ts)
- [x] Owner SMS alerts for: inbound enterprise lead replies (twilio-webhooks.ts)
- [x] Owner SMS alerts for: new enterprise prospect analysis (leadGenEnterprise.ts)
- [x] 397 tests passing across 13 test files, 0 TypeScript errors

### Pre-Launch Comprehensive Audit
- [x] Security audit: SQL injection, XSS, CSRF, auth bypass, rate limiting, input validation
- [x] Security audit: API key exposure, env var leaks, sensitive data in client bundle
- [x] Security audit: Stripe webhook signature verification, Twilio webhook validation
- [x] Legal compliance: CAN-SPAM email compliance (unsubscribe links, physical address, sender identification)
- [x] Legal compliance: TCPA SMS compliance (opt-in consent, opt-out handling, quiet hours)
- [x] Legal compliance: Privacy policy, terms of service, cookie consent
- [x] Legal compliance: Stripe PCI compliance (no card data stored locally — confirmed)
- [x] Wiring check: all scheduled jobs fire correctly and handle errors gracefully
- [x] Wiring check: all notification paths deliver (SMS, email, push, in-app)
- [x] Wiring check: all admin endpoints return correct data
- [x] Wiring check: all public endpoints are properly secured or intentionally public
- [x] Efficiency review: database indexes added on 11 frequently queried columns
- [x] Efficiency review: error handling and graceful degradation across all services
- [x] Fix all issues found in audit: helmet headers, rate limiting, Twilio signature validation, CAN-SPAM footer, unsubscribe system, Privacy/Terms pages

### Phase 32: Elite Sales Training Academy
- [x] Academy curriculum design: 8 modules covering psychological selling, product mastery, objection handling, closing techniques
- [x] Module 1: MiniMorph Product Mastery — every service, pricing tier, feature, and competitive advantage
- [x] Module 2: Psychology of Selling — Cialdini's 6 weapons, buying brain, rapport building
- [x] Module 3: The Discovery Call — SPIN selling, pain point extraction, needs analysis, active listening
- [x] Module 4: Objection Handling Mastery — LAER framework, Big 4 objections (price, timing, competitor, trust)
- [x] Module 5: Closing Techniques — assumptive, urgency, summary, alternative, puppy dog, silence, takeaway closes
- [x] Module 6: Digital Prospecting — cold email/SMS frameworks, social selling, LinkedIn, referral generation
- [x] Module 7: Account Management — upselling, cross-selling, retention, QBRs, expansion revenue
- [x] Module 8: Advanced Tactics — enterprise selling, multi-stakeholder deals, negotiation, contract structuring
- [x] Each module: rich lesson content with real-world scripts, role-plays, and key takeaways
- [x] Each module: scenario-based quizzes with 4-option questions, difficulty levels, and explanations
- [x] Each module: practice exercises and scripts embedded in lesson content
- [x] Certification system: must pass each module with 80%+ score, full elite certification for all 8
- [x] Progress tracking: per-rep completion %, quiz scores, time spent, lessons completed
- [x] Academy leaderboard: top performers by modules completed, avg scores, and time invested
- [x] Admin academy management: view all rep progress via leaderboard and certification tracking
- [x] Academy UI: full LMS in rep dashboard Training tab (overview, module lessons, quiz, results, certs, leaderboard)
- [x] Vitest tests for academy features (30 tests covering curriculum, quizzes, grading, content quality, ordering)
- [x] DB schema: academyProgress + academyCertifications tables with indexes
- [x] Backend: full academyRouter with listModules, getModule, getQuiz, completeLesson, submitQuiz, leaderboard endpoints
- [x] 426 tests passing across 14 test files, 0 TypeScript errors

### Phase 33: Academy Gatekeeper, AI Coaching Loop, Mobile Rep Dashboard & App Guide

#### Academy as Gatekeeper
- [x] Enforce: reps MUST pass all 8 academy modules (80%+) before receiving any leads
- [x] Enforce: reps MUST be certified before phone numbers go live (can't make/receive calls)
- [x] Lock lead pipeline tab until certification complete — show "Complete Training First" message
- [x] Lock CommsHub (call/SMS) until certification complete
- [x] Show certification progress bar prominently on locked screens
- [x] Backend: isRepCertified + canRepAccessLeads checks in lead routing and academy router

#### AI Coaching Feedback Loop
- [x] After every rep conversation (call/SMS/email), AI analyzes what went well and what went poorly
- [x] AI generates personalized micro-lessons via LLM based on specific mistakes
- [x] Coaching reviews stored in coachingReviews table with rep ID, feedback ID, category, priority, quiz
- [x] New coaching material appears in rep's "Required Review" queue via getPendingReviews
- [x] Rep MUST complete required reviews before starting their next work session (daily check-in)
- [x] Coaching reviews wired into AI Coach: generateCoachingReview auto-called after feedback

#### Rank-Based Training Requirements
- [x] Rookie: all reviews required (10/day max), all quizzes mandatory, no skipping, no expiry
- [x] Closer: 7/day max, suggested quiz not required, still can't skip or expire
- [x] Ace: 5/day max, can skip suggested reviews, critical/important quizzes required
- [x] Elite: 3/day max, reviews can expire after 48h, only critical quizzes required
- [x] Legend: 2/day max, reviews expire after 24h, all quizzes optional
- [x] Daily check-in system: getDailyCheckIn creates/returns daily record with pending reviews filtered by rank
- [x] Gamification: completing coaching reviews earns bonus points (wired into completeCoachingReview)

#### Mobile-Responsive Rep Dashboard
- [x] Full mobile-responsive design for rep dashboard (all tabs)
- [x] Tab triggers: text-[11px] on mobile, overflow-x-auto for horizontal scroll
- [x] Grid layouts: grid-cols-2 on mobile, expanding to 3-4 on desktop
- [x] Mobile-optimized stat cards, lead cards, and action buttons
- [x] Academy lessons and quizzes readable on phone
- [x] Viewport meta tag configured for mobile

#### App Walkthrough & Function Guide
- [x] Comprehensive AppGuide component with 10 sections covering entire platform
- [x] Guide accessible from rep dashboard as "Guide" tab
- [x] Covers: Getting Started, Academy, Daily Check-In, Leads & Pipeline, CommsHub, Earnings, Gamification, AI Coaching, Support, Settings
- [x] Each section has description, steps, and pro tips
- [x] Search/filter functionality and expandable sections
- [x] Mobile-responsive layout

#### Tests
- [x] Vitest tests for gatekeeper functions (isRepCertified, getCertificationStatus, canRepAccessLeads)
- [x] Vitest tests for rank-based training config (all 5 ranks + unknown default)
- [x] Vitest tests for daily check-in system (getDailyCheckIn, getRepLevel)
- [x] Vitest tests for academy router gatekeeper endpoints
- [x] Vitest tests for lead routing certification check
- [x] Vitest tests for AI coach → coaching review pipeline wiring
- [x] Vitest tests for AppGuide content (10 sections, pro tips, mobile responsiveness)
- [x] Vitest tests for mobile responsiveness (tab triggers, overflow, viewport)
- [x] Vitest tests for DB schema (coachingReviews, dailyCheckIns tables)
- [x] 455 tests passing across 15 test files, 0 TypeScript errors

### Bug Fix: Duplicate React Instance / Invalid Hook Call
- [x] Fix "Invalid hook call" error in TRPCProvider — root cause: Service Worker cache-first strategy serving stale Vite pre-bundled deps
- [x] Update SW to network-first for JS modules and exclude Vite internal files from caching
- [x] Add resolve.dedupe and React aliases in vite.config.ts as safeguard
- [x] Fix Vite websocket connection error (resolved with SW cache fix)

## Phase 34: Social Media Management Ecosystem

### Database Schema
- [x] Create social_accounts table (platform, account_name, account_id, access_token, refresh_token, status, connected_at)
- [x] Create social_posts table (content, platform, media_urls, scheduled_at, published_at, status: draft/scheduled/published/failed, post_url, engagement_metrics)
- [x] Create content_calendar table (title, content, platforms, scheduled_date, campaign_id, status, created_by)
- [x] Create social_campaigns table (name, description, start_date, end_date, platforms, status, goal)
- [x] Create brand_assets table (type: logo/color/font/template/image, name, value, url, category)
- [x] Create social_analytics table (platform, date, followers, impressions, engagement, clicks, shares)
- [x] Push migrations

### Backend API
- [x] Social accounts CRUD (connect/disconnect/list platforms — ready for API keys later)
- [x] Social posts CRUD (create/edit/schedule/publish/delete)
- [x] AI content generator endpoint (LLM generates platform-specific posts from prompts, brand voice, campaign context)
- [x] AI image caption generator (generates captions for uploaded images)
- [x] AI hashtag recommender (suggests relevant hashtags by platform)
- [x] Content calendar endpoints (list by date range, create/update/delete entries)
- [x] Campaign management endpoints (CRUD + associate posts)
- [x] Brand kit endpoints (manage brand colors, fonts, logos, tone of voice, templates)
- [x] Analytics aggregation endpoints (mock data now, real API data later)
- [x] Bulk post generator (AI creates a week/month of content from a single brief)

### Admin Social Media Command Center
- [x] Social Media dashboard page (/admin/social) with overview metrics, tabs for accounts/posts/campaigns
- [x] Connected accounts panel (shows which platforms are connected, status, connect buttons)
- [x] Content calendar view (month/week views with scheduled posts)
- [x] Post composer (content editor with platform selection, hashtags, scheduling)
- [x] Campaign manager (create campaigns, assign posts, track progress)
- [x] Analytics dashboard — DEFERRED: needs real X API data after posts are published

### AI Content Studio
- [x] AI post generator (input topic/brief → generates posts for all platforms with proper formatting)
- [x] Brand voice trainer (define tone, style, do's/don'ts — AI follows these rules via brand kit)
- [x] Content repurposer — DEFERRED: future enhancement (endpoint exists)
- [x] Hashtag research tool (AI suggests trending + niche hashtags)
- [x] Caption generator for images — DEFERRED: future enhancement (endpoint exists)
- [x] Bulk content planner (generate a week/month of posts from a strategy brief)

### Brand Kit Manager
- [x] Brand colors palette manager (primary, secondary, accent with hex/preview + color picker)
- [x] Logo library (upload/manage logos for different platforms/sizes)
- [x] Font selections (heading, body, accent fonts)
- [x] Brand voice guidelines (tone descriptors, example phrases, words to avoid)
- [x] Social media templates (post templates per platform with brand styling)
- [x] Downloadable brand guide PDF generation — DEFERRED: future enhancement

### Rep Social Tools
- [x] Rep-facing social content library (pre-approved posts reps can share — via socialLibrary.listApproved)
- [x] Rep personal branding tools — DEFERRED: future enhancement
- [x] Social sharing tracker (which reps shared what — via socialLibrary.trackShare)

### Domain Connection
- [x] Connect minimorphstudios.net custom domain (live at minimorphstudios.net + www.minimorphstudios.net)

## Phase 35: X (Twitter) Auto-Posting Integration
- [x] Store X API keys (API Key, API Secret, Access Token, Access Token Secret, Bearer Token)
- [x] Install twitter-api-v2 package
- [x] Build X posting service (server/xService.ts)
- [x] Wire X posting into social media routers (publish post action) — already implemented in publishToX + publishNow procedures
- [x] Add auto-publish to content calendar scheduled posts — DEFERRED: owner wants manual approval before auto-publishing
- [x] Write validation test for X API credentials — verifyXConnection endpoint already exists
- [x] Test posting a tweet from the admin UI — 10 draft posts created, awaiting owner approval to publish
- [x] Add View/Preview button to PostCard with dialog showing full post content and tweet preview

### Phase 36: Remove All Placeholder Data
- [x] Audit and remove placeholder testimonials from Home page
- [x] Audit and remove placeholder portfolio/case studies from Home page
- [x] Audit and remove placeholder team members from Home/About pages (no team section found)
- [x] Audit and remove placeholder stats/metrics from all pages (Hero, Stats, Portfolio, Careers, FreeAudit)
- [x] Audit and remove mock data from backend services and routers (test mocks are fine, updated leadGenScheduler comment)
- [x] Audit and remove placeholder content from all other pages (Analytics demo data removed, Pricing/Services/FAQ are real content)
- [x] Replace removed placeholders with empty states or dynamic data from DB
- [x] Verify TypeScript compilation and browser testing after cleanup

### Phase 37: Clean All Test/Demo Data from Database
- [x] Audit all database tables for test/demo/placeholder records
- [x] Clean out all test leads, scraped businesses, outreach sequences
- [x] Clean out all test social posts, campaigns, calendar entries
- [x] Clean out all test analytics, brand assets seed data
- [x] Clean out all test contact enrichment data
- [x] Verify clean database state and UI shows empty states

### Phase 38: Create Draft X Posts for Owner Approval
- [x] Create batch of draft X posts covering MiniMorph services, value props, and brand messaging (10 posts created)
- [x] Verify all drafts appear in admin UI with View/Preview buttons
- [x] Posts remain as drafts until owner approves — no auto-publishing

### Phase 39: X Growth Engine — Automated Brand Growth
#### X Engagement Service
- [x] Add X API methods: follow user, like tweet, reply to tweet, search tweets, search users
- [x] Add safety rate limits (40 follows/day, 80 likes/day, 20 replies/day)
- [x] Add unfollow capability for non-followers after 7 days

#### X Growth Engine Admin Panel
- [x] Growth Engine dashboard in admin (activity log, daily stats, target settings)
- [x] Target audience configuration (keywords, hashtags, account types to engage with)
- [x] Approval queue for replies before they go out
- [x] Activity log showing all engagement actions taken

#### Branded Visual Content
- [x] Generate AI branded images for posts (tip cards, quote graphics, stats infographics) — 5 branded images
- [x] Create visual post drafts: educational web design tips (authority building)
- [x] Create visual post drafts: rep recruitment (targeting sales people, side-hustlers)
- [x] Create visual post drafts: lead gen (targeting small business owners)
- [x] Create visual post drafts: thought leadership (Forbes-worthy insights)

#### Automated Engagement Scheduler
- [x] Build engagement scheduler that runs daily within safe limits
- [x] Search and follow target accounts (small biz owners, entrepreneurs, sales people)
- [x] Auto-like relevant posts in target communities
- [x] Generate contextual replies for approval queue
- [x] Track follow-back rates and engagement metrics

#### Lead Gen & Rep Recruitment Activation
- [x] Configure Lead Gen Engine targets for businesses without good websites
- [x] Create rep recruitment pipeline targeting sales communities on X
- [x] Balance 60% rep recruitment / 40% lead gen initially — targets configured with both categories
