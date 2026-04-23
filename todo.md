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

## Phase 14: Public Sales Website
- [x] Hero section with warm machine design
- [x] Stats / social proof section
- [x] Services grid
- [x] Portfolio showcase (7 projects with AI-generated mockups, category filters)
- [x] How It Works lifecycle timeline (8 steps)
- [x] Core Principle section ("Humans close. AI does everything else.")
- [x] 3-tier Pricing cards (Starter/Growth/Premium)
- [x] Testimonials carousel
- [x] FAQ accordion
- [x] Footer with navigation

## Remaining / Future Enhancements
- [ ] Analytics integration placeholder (Google Analytics)
- [ ] Rep-facing dashboard (separate from admin — rep sees their own leads, commissions, performance)
- [ ] Customer-facing portal (customer sees their contract, reports, request support)
- [ ] Multi-step guided buying wizard (beyond simple contact form)
- [ ] Automated email notifications for nurture sequences
- [ ] AI-powered lead enrichment integration
- [ ] Stripe payment integration for online purchases
