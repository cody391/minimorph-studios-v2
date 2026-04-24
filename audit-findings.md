# Full Codebase Audit — Values & Onboarding Alignment

## What Exists (Working)

### Rep Onboarding Flow
1. **Careers page** → links to `/become-rep/values`
2. **Values Gate** (`/become-rep/values`) — Shows company mission, 6 core values, Code of Conduct. Uses `shared/companyValues.ts`. Requires acknowledgment.
3. **BecomeRep** (`/become-rep`) — 4 steps:
   - Step 1: Personal info + account creation + mandatory professional photo (with camera capture, cropper, AI quality check, mirror toggle)
   - Step 2: Experience (sales experience, industries, hours)
   - Step 3: Motivation ("Why MiniMorph" essay)
   - Step 4: Agreement (terms + tax info)
   - After Step 1 → redirects to Trust Gate → Assessment → back to Step 2
4. **Trust Gate** (`/become-rep/trust-gate`) — NDA signature (v1.1, includes Code of Conduct reference), identity collection (legal name, DOB, SSN last 4, gov ID, address). Records IP + timestamp.
5. **Assessment** (`/rep-assessment`) — 12 questions (6 character, 6 sales), 20-min timer, auto-submit, seeded shuffle per attempt, 30-day retake cooldown. Scoring: 70%+ pass, 50-69% borderline, <50% fail. Gate minimums enforced.
6. **Onboarding Paperwork** (`/become-rep/paperwork`) — W-9, HR, Payroll, Rep Agreement. Auto-populated from trust gate data. E-signature capture (draw or type) on each form.

### Backend
- `assessmentRouter.ts` — checkEligibility, startAssessment, getQuestions (shuffled), submit, getMyResult, adminList, adminGetDetail, adminOverride
- `onboardingDataRouter.ts` — getNda, submitTrustGate, getMyData, checkTrustGate, adminGetUserData
- `repEcosystem.ts` — repApplicationRouter with AI motivation review (invokeLLM scores sincerity/specificity/effort)
- `shared/companyValues.ts` — Single source of truth for 6 core values, Code of Conduct, mission, culture statement

### Admin
- Admin Reps page has tabs: Recruitment, Active Reps, Assessments, Pipeline
- Pipeline tab shows funnel stages
- Assessments tab shows scores, approve/reject borderline

### Database Tables
- `repAssessments` — scores, timer, attempts, admin override
- `repOnboardingData` — identity, address, NDA signature
- `repApplications` — photo, experience, motivation, AI review fields

## GAPS FOUND

### 1. "Team Above Self" → "Brand Stewardship" Mismatch
- `shared/companyValues.ts` was updated to `brand-stewardship` ✅
- `OnboardingPaperwork.tsx` line 766 still says "Team Above Self" ❌
- `onboardingDataRouter.ts` NDA line 24 still says "Team Above Self" ❌

### 2. Assessment Question sj4 Still References "Team Ethics"
- Question sj4 says "You overhear another rep..." — but reps DON'T know each other (Uber model)
- Category is "Team Ethics" — should be "Brand Protection" or similar
- The scenario needs rewriting for isolated reps

### 3. No Academy Module 0 (Values & Ethics)
- `shared/companyValues.ts` references `values-ethics` module in VALUE_TO_ACADEMY_MAP
- But `academy-curriculum.ts` has NO `values-ethics` module
- Modules are: product-mastery, psychology-selling, discovery-call, objection-handling, closing-techniques, digital-prospecting, account-management, advanced-tactics
- **Gap: Reps go through training without any formal values reinforcement**

### 4. No Uber-Model Accountability System Yet
- `reps` table has `performanceScore` field but no calculation engine
- No lead allocation algorithm
- No residual decay system
- No strike system
- No tier system
- No AI values monitor for ongoing interactions
- Rep dashboard exists but doesn't have performance score, tier progress, missed opportunity alerts

## FIXES NEEDED (In Order)

1. Fix "Team Above Self" references in NDA and paperwork → "Brand Stewardship"
2. Rewrite assessment question sj4 for isolated reps (no "overhear another rep")
3. Create Academy Module 0: Values & Ethics (mandatory first module)
4. Build the Uber-model accountability system (Phase 48)
