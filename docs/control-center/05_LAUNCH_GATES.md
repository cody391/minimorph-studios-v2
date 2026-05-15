# 05 — Launch Gates

## Gate Hierarchy

```
Gate 1: Contact Flow P0 Repair        ← current blocker
Gate 2: Quality Lab (95+ all 5 sites)
Gate 3: First Controlled Customer
Gate 4: Public Launch
```

---

## Gate 1 — Contact Flow P0 Repair

**Status: OPEN**

### Criteria (all must pass)

- [ ] `server/templates/shared/contact.html` — form uses `APP_URL_PLACEHOLDER/api/contact-submit`
- [ ] `server/templates/contractor/contact.html` — form uses `APP_URL_PLACEHOLDER/api/contact-submit`
- [ ] `server/templates/contractor/quote.html` — form uses `APP_URL_PLACEHOLDER/api/contact-submit`
- [ ] `server/templates/service/quote.html` — form uses `APP_URL_PLACEHOLDER/api/contact-submit`
- [ ] `server/templates/restaurant/reservations.html` — form uses `APP_URL_PLACEHOLDER/api/contact-submit`
- [ ] `server/templates/service/professional.html` — index form functional (no `onsubmit="return false;"`)
- [ ] `server/templates/boutique/warm-lifestyle.html` — email signup functional (no `onsubmit="return false;"`)
- [ ] `server/templates/gym/bold-energetic.html` — has working contact path (direct form or links to fixed contact.html)
- [ ] `pnpm check` passes
- [ ] `pnpm build` passes
- [ ] Committed and pushed
- [ ] Railway deploy confirmed (check `Last-Modified` header on health endpoint)
- [ ] Zero Formspree references in any template (`grep -r "formspree" server/templates/`)

### What "form uses APP_URL_PLACEHOLDER/api/contact-submit" means

```html
<form action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST">
```

At generation time, `APP_URL_PLACEHOLDER` is replaced with `https://www.minimorphstudios.net`.
The result is `https://www.minimorphstudios.net/api/contact-submit`.

Do NOT hardcode the production URL. Always use the token.

---

## Gate 2 — Quality Lab (95+/100, all 5 sites)

**Status: BLOCKED by Gate 1 + Railway CLI access**

### What is the Quality Lab

5 internal fake businesses, one per industry, triggered through full generation cycle. Each scored on a 100-point rubric. All must score 95+.

### Criteria

- [ ] Gate 1 complete
- [ ] Admin credentials available (Railway CLI `railway login` restored, or admin user in local/staging DB)
- [ ] 5 test onboarding projects created with realistic questionnaire data
- [ ] Blueprint approved for each
- [ ] `onboarding.triggerGeneration` called for each
- [ ] Each generated site inspected manually:
  - Zero fake stars (`★★★★★`) in any content section
  - Zero invented metrics (counts, percentages, ratings)
  - Zero fake review slots beyond TESTIMONIAL_1
  - Zero Formspree or broken form endpoints
  - Zero `return false` on form submit
  - Contact form correctly POSTs to `/api/contact-submit`
  - Business name, phone, email, address all render correctly
  - No `[PLACEHOLDER]`, `BUSINESS_NAME`, or other un-replaced tokens visible
- [ ] All 5 score 95+/100

---

## Gate 3 — First Controlled Customer

**Status: BLOCKED by Gates 1 and 2**

### Criteria

- [ ] Gate 2 complete
- [ ] Real customer identified and consented
- [ ] Onboarding questionnaire submitted through Elena or manual intake
- [ ] Blueprint created and reviewed by admin
- [ ] Site generated, admin QA'd (admin/HumanReview.tsx)
- [ ] Customer views and approves site (CustomerPortal.tsx)
- [ ] Contract signed and payment collected (Stripe)
- [ ] Site deployed to Cloudflare Pages
- [ ] Customer receives domain handoff email (if custom domain)
- [ ] Contact form tested end-to-end (test submission → `contact_submissions` record → email to owner)
- [ ] Admin explicitly approves delivery

---

## Gate 4 — Public Launch

**Status: BLOCKED by Gate 3**

### Criteria

- [ ] Gate 3 complete (first customer delivered with zero issues)
- [ ] Lead engine evaluated for activation (currently frozen)
- [ ] Rep ecosystem evaluated for activation (currently frozen)
- [ ] Public pricing page reviewed
- [ ] Support ticket system load-tested
- [ ] Marketing site (Elena onboarding CTA) live
- [ ] Admin explicitly approves public launch

---

## Hard Rules Across All Gates

1. No gate can be bypassed. They are sequential.
2. "It seems to work" is not a passing criterion. Specific checkboxes must be checked.
3. `pnpm check` and `pnpm build` must pass before any commit is counted as complete.
4. A Railway deployment is confirmed only by observing a changed `Last-Modified` header on the health endpoint — not by a successful `git push`.
5. Frozen systems (lead engine, rep ecosystem, broadcasts, social media) must not be activated before Gate 4 explicitly evaluates them.
