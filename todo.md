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
