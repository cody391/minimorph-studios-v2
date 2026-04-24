# MiniMorph Studios — Rep Pipeline OS Grade Report

**Date:** April 24, 2026
**Scope:** Full rep pipeline from first touch through daily production

---

## Overall Grade: **B-** (73/100)

The skeleton is strong. Every major pipeline stage exists, routes connect, data flows end-to-end, and the Academy curriculum is genuinely impressive. But there are continuity fractures, a dual-tier identity crisis, missing content in the App Guide, and the daily training system has no way to generate coaching reviews for new reps who haven't had any conversations yet. Below is a stage-by-stage breakdown.

---

## Stage-by-Stage Assessment

### 1. Careers Page (Entry Point) — **A-** (90/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Pricing | Correct | $149/$299/$499/mo |
| Commission tiers | Correct | Bronze 10% → Platinum 15% |
| Module count | Correct | "9-module certification" |
| Earnings calculator | Present | Shows realistic scenarios |
| FAQ | Present | Covers commission, tiers, training |
| CTA flow | Works | Links to /become-rep |

**Gap:** The earnings calculator footnote says "Based on 10% base commission rate" — correct. No issues found.

---

### 2. Values Gate (/become-rep/values) — **A** (92/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Company values display | Present | Reads from shared/companyValues.ts |
| Acknowledgment required | Yes | Must scroll + accept |
| Gate enforcement | Works | Blocks progression without acceptance |

**Gap:** Minor — no way to revisit values later from the dashboard. Could add a "Our Values" link in the Guide tab.

---

### 3. Account Creation + Application (/become-rep) — **A-** (88/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Step 1: Personal info + account | Works | Creates user + rep profile |
| Step 2: Experience | Works | Availability, sales experience, industries |
| Step 3: Motivation | Works | Free-text with 50-char minimum |
| Step 4: Agreements | Works | Terms + tax info consent |
| Auto-redirect to Trust Gate | Works | After step 1 |
| Return from assessment to step 2 | Works | via ?step=2 query param |

**Gap:** After step 4 submission, the success screen says "Your application has been approved" — but the assessment already happened before step 2. The messaging is slightly confusing because the "approval" actually happened at the assessment stage.

---

### 4. Trust Gate — NDA + Identity (/become-rep/trust-gate) — **A-** (88/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| NDA display + scroll requirement | Works | Must scroll to bottom |
| Identity verification step | Works | Collects SSN last 4, DOB, address |
| Completion redirect | Works | → /rep-assessment |
| Already-completed detection | Works | Skips if done |

**Gap:** None significant.

---

### 5. Assessment (/rep-assessment) — **A** (93/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Gate 1: Situational Judgment | Works | Character & integrity, weighted 2x |
| Gate 2: Sales Aptitude | Works | Skills & instincts, weighted 1x |
| 20-minute timer | Works | With grace period |
| Borderline auto-approve | Works | No admin bottleneck |
| 30-day retake cooldown | Works | For failed attempts |
| Redirect after pass | Works | → /become-rep?step=2 |

**Gap:** None significant. This is one of the strongest components.

---

### 6. Onboarding Paperwork (/become-rep/paperwork) — **A-** (88/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| W-9 Tax form | Works | Auto-fills from trust gate data |
| HR Employment form | Works | Auto-fills |
| Payroll Setup form | Works | Auto-fills |
| Rep Agreement form | Works | Signature pad |
| Completion redirect | Works | → /become-rep/payout-setup |

**Gap:** None significant.

---

### 7. Payout Setup (/become-rep/payout-setup) — **B+** (85/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Stripe Connect onboarding | Works | Opens in new tab |
| Skip option | Present | "Skip for now" link |
| Completion redirect | Works | → /rep?tab=training |

**Gap:** The "Skip for now" option means reps can reach the dashboard without Stripe setup. The dashboard does gate this with a banner, but the flow could be tighter.

---

### 8. Sales Academy (/rep → Training tab → Sales Academy) — **B+** (86/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| 9 modules with rich content | Present | Values, Product, Psychology, Discovery, Objection, Closing, Prospecting, Account Mgmt, Advanced |
| Lesson content (markdown) | Rich | Scripts, key takeaways, role-play text |
| Quiz per module | Works | Must pass to certify |
| Progress tracking | Works | Per-lesson and per-module |
| Certifications display | Works | Shows earned certs |
| Auto-activation on full cert | Works | Status → active |
| Welcome notification on activation | Works | Just added |
| Daily Training tab | Present | Shows coaching reviews |
| Role Play tab | Present | 8 scenario types with AI |

**Gaps:**
1. **Daily Training has no content for new reps.** Coaching reviews are generated from AI analysis of sales conversations — but new reps in training haven't had any conversations yet. The tab will always show "All Clear!" for trainees, making the daily training gate meaningless until they're already active and making calls. This is a chicken-and-egg problem.
2. **Role Play sessions are not tied to module progression.** A rep could jump straight to role play without completing any modules. There's no gate.

---

### 9. Rep Dashboard (/rep) — **B** (80/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Performance tab | Present | Score gauge, tier progress, lead queue |
| Overview tab | Present | Key metrics, tier display, recent leads |
| Training tab | Present | Links to Sales Academy |
| Activity tab | Present | Activity log |
| Comms tab | Present | Email, SMS, Calls channels |
| Earnings tab | Present | Commission tracking, tier info |
| Pipeline tab | Present | Kanban board for leads |
| Leaderboard tab | Present | Top reps by points |
| Support tab | Present | Support tickets |
| Settings tab | Present | Profile settings |
| Guide tab | Present | App walkthrough |

**Gaps:**
1. **Onboarding gates work** — paperwork and Stripe Connect are gated with banners.
2. **Tier display is correct** — shows Bronze/Silver/Gold/Platinum from accountability system.
3. **Leaderboard still shows gamification levels** — the `getLeaderboard` query returns `repGamification.level` which is the old system (rookie/closer/ace/elite/legend). The badge on line 556 uses `tierColors[entry.level]` but `tierColors` is mapped to bronze/silver/gold/platinum. So leaderboard badges will show nothing or default styling for gamification levels.

---

### 10. Daily Production Flow — **C+** (75/100)

| Aspect | Status | Notes |
|--------|--------|-------|
| Daily check-in gate | Backend works | `canRepAccessLeads` checks certification + daily cleared |
| Coaching review generation | Backend works | AI generates from conversation analysis |
| Lead access gating | Backend works | Blocks leads if not cleared |
| Frontend enforcement | Partial | Daily Training tab exists but no hard gate on Pipeline/Comms tabs |

**Gaps:**
1. **No frontend enforcement of daily check-in.** The backend `canRepAccessLeads` procedure exists, but the Pipeline tab and Comms tab don't call it. A rep can access leads and make calls without clearing daily training.
2. **No coaching reviews for new reps.** As noted above, the system needs seed content or Academy-based reviews for reps who haven't had real conversations yet.

---

## Critical Continuity Issues

### Issue A: Dual Tier System Still Active (Severity: HIGH)

The codebase has **two parallel tier systems** that haven't been fully unified:

| System | Levels | Used By |
|--------|--------|---------|
| **Accountability Tiers** | Bronze / Silver / Gold / Platinum | RepDashboard, Careers, PerformanceHub, Earnings tab |
| **Gamification Levels** | Rookie / Closer / Ace / Elite / Legend | repGamification table, Leaderboard, Daily Training (academyGatekeeper), repEcosystem points |

**Where this breaks:**
- The **Leaderboard** returns gamification `level` (rookie/closer/etc.) but the dashboard `tierColors` map only has bronze/silver/gold/platinum keys → badges render with no styling
- The **Daily Training** system uses `getRepLevel()` which reads from `repGamification.level` (rookie/closer/etc.) to determine how many reviews are required → the `RANK_TRAINING_CONFIG` uses rookie/closer/ace/elite/legend keys, not bronze/silver/gold/platinum
- The **academyGatekeeper** `RANK_TRAINING_CONFIG` says "legend" reps are exempt from daily training, but the user's vision uses "Platinum" as the top tier

**Fix needed:** Either (a) migrate RANK_TRAINING_CONFIG to use accountability tier names, and have `getRepLevel()` read from `repTiers` instead of `repGamification`, or (b) keep gamification as an internal XP/engagement system but map it to accountability tiers for all user-facing displays.

### Issue B: App Guide Says 8 Modules (Severity: MEDIUM)

The App Guide (`AppGuide.tsx`) lists only 8 modules and says "Complete all 8 Academy modules." It's missing Module 0: Values & Ethics. The module list starts at "Module 1: Product Mastery" and goes to "Module 8: Advanced Tactics."

**Fix needed:** Add "Module 0: Values & Ethics" to the guide and change all "8" references to "9."

### Issue C: academyGatekeeper Says 8 Modules (Severity: MEDIUM)

Line 92 of `academyGatekeeper.ts` has a comment saying "Check if a rep is fully certified (passed all 8 academy modules)" — should be 9.

### Issue D: Daily Training Chicken-and-Egg (Severity: HIGH)

New reps in training status have no coaching reviews because reviews are generated from AI analysis of real sales conversations. The daily training tab will always show "All Clear!" for new reps, making the entire daily training system inert during the most critical learning phase.

**Fix needed:** Generate Academy-based coaching reviews for reps who haven't had real conversations yet. Pull content from the 9 modules — quiz questions, scenario reviews, key concept reinforcement — so new reps have daily training material from day one.

### Issue E: No Frontend Gate for Daily Training (Severity: MEDIUM)

The backend `canRepAccessLeads` procedure exists and works, but the Pipeline tab and Comms tab don't check it. A rep can access their lead kanban board and make calls without clearing daily training.

**Fix needed:** Add a `canRepAccessLeads` check to PipelineTab and CommsHub. If not cleared, show a locked state with a link to the Daily Training tab.

---

## Content Continuity Scorecard

| Data Point | Careers | Home/Pricing | GetStarted | Academy Curriculum | Stripe Products | App Guide | Dashboard |
|------------|---------|-------------|------------|-------------------|----------------|-----------|-----------|
| Starter price | -- | $149/mo | $149/mo | $149/mo | $149/mo | -- | -- |
| Growth price | -- | $299/mo | $299/mo | $299/mo | $299/mo | -- | -- |
| Premium price | -- | $499/mo | $499/mo | $499/mo | $499/mo | -- | -- |
| Module count | 9 | -- | -- | 9 (actual) | -- | **8** | -- |
| Commission: Bronze | 10% | -- | -- | -- | -- | -- | 10% |
| Commission: Silver | 12% | -- | -- | -- | -- | -- | 12% |
| Commission: Gold | 14% | -- | -- | -- | -- | -- | 14% |
| Commission: Platinum | 15% | -- | -- | -- | -- | -- | 15% |
| Tier names | Bronze→Platinum | -- | -- | -- | -- | -- | Bronze→Platinum |

Pricing and commission rates are now consistent. The only content mismatch is the **module count in the App Guide (8 vs 9)**.

---

## Prioritized Fix List

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | A. Unify tier systems — migrate RANK_TRAINING_CONFIG to accountability tiers, fix leaderboard | Medium | Fixes broken leaderboard badges + daily training rank display |
| **P0** | D. Seed daily training content for new reps from Academy material | Medium | Makes daily training functional during the critical training phase |
| **P1** | E. Add frontend daily training gate to Pipeline + Comms tabs | Small | Enforces the daily training requirement the user specifically asked for |
| **P1** | B. Fix App Guide module count (8→9) and add Values & Ethics module | Small | Content accuracy |
| **P1** | C. Fix academyGatekeeper comment (8→9) | Trivial | Code accuracy |
| **P2** | Gate Role Play behind module completion | Small | Prevents reps from skipping to role play without training |
| **P2** | Add values reference link to Guide tab | Trivial | Allows reps to revisit company values |

---

## What's Working Well

1. **The full onboarding pipeline flows end-to-end:** Careers → Values → Account → NDA → Assessment → Application → Paperwork → Stripe → Academy → Dashboard. Every redirect works.
2. **Pricing is consistent** across all 6 touchpoints ($149/$299/$499/mo).
3. **Commission tiers are consistent** (Bronze 10% → Platinum 15%) across Careers, Dashboard, and backend.
4. **The Academy curriculum is genuinely strong** — 9 modules with rich markdown content, real sales scripts, psychological frameworks, and quiz questions that test application not memorization.
5. **The assessment system is well-designed** — dual-gate scoring, timer, auto-approve for borderline, cooldown for retakes.
6. **The AI Role Play system is functional** — 8 scenario types, AI-generated personas, scoring with detailed feedback.
7. **63 database tables** supporting a comprehensive data model.
8. **647 tests passing** with 0 TypeScript errors.

---

## Summary

The OS is 75% of the way to the full vision. The architecture is sound, the content is rich, and the pipeline flows. The remaining 25% is about **continuity** — making sure the two tier systems speak the same language, making sure the daily training system has content for new reps (not just veterans), and making sure the frontend actually enforces the gates the backend provides. These are fixable issues, not architectural problems.
