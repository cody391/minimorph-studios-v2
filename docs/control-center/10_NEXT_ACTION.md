# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Deploy Confirmed + Live Quality Lab Rerun

**Priority:** P1 — blocks first customer delivery
**Status:** READY — all template repairs committed and pushed; Railway deploy in progress

### What happened

All P1 template content blockers have been resolved across two commits:

- **`86105c5`** — Main template truth repair: contractor services/gallery, restaurant menu items/prices, salon exclusivity/prices/fake team, gym fake coaches/pricing/credentials/broken links, LLM fallback form endpoint, boutique seasonal banner.
- **`8f11c2b`** — Sub-page truth repair: `restaurant/menu.html` hardcoded dishes/prices, `gym/classes.html` $25/$149/$199 pricing grid and calorie claim.

Both commits are on origin/main. Railway deploy is in progress.

### What needs to happen next

**Step 1 — Confirm Railway deploy** (manual verification)
- Wait for Railway to complete the build and start the new container
- Verify health: `curl -sI https://www.minimorphstudios.net/health`

**Step 2 — Run live Quality Lab**
- Execute live Quality Lab generation for all 5 test businesses:
  1. Apex Roofing & Exteriors MN (contractor/dark-industrial)
  2. Rosa's Kitchen (restaurant/warm-casual)
  3. Luxe + Bare Studio (salon/editorial-luxury)
  4. FitForge CrossFit (gym/bold-energetic)
  5. GreenLeaf Landscaping Co. (LLM fallback)
- All 5 must score 95+/100
- Zero P0 violations (Formspree, return false, fake stars, fake metrics, empty action)
- Zero P1 violations (hardcoded prices, fake staff, invented services, broken links)

**Step 3 — If Quality Lab passes 5/5**
- Update Control Center: mark Quality Lab gate DONE
- Request admin approval for first controlled customer delivery

**Step 4 — If Quality Lab reveals new failures**
- Record new blockers in `07_KNOWN_BLOCKERS.md`
- Fix only the failing templates
- Do not drift into unrelated systems

### Quality Lab Acceptance Criteria

Each generated site must:
- Contain the correct businessName, phone, address, hours, serviceArea
- Use zero hardcoded prices not sourced from customer questionnaire
- Use zero fake team members, fake credentials, fake testimonials
- Have all internal links resolve to generated pages (no 404 hrefs)
- Have all contact forms POST to `{appUrl}/api/contact-submit` via JS fetch
- Score 95+/100 on the rubric

---

## Gate Sequence

```
[DONE]     Contact Flow P0 Repair ✅ (commit 0c1440d)
           ↓
[DONE]     Template Truth Repair ✅ (commits 86105c5 + 8f11c2b)
           ↓
[CURRENT]  Deploy Confirmed + Live Quality Lab Rerun
           ↓
           First Controlled Customer (requires admin approval)
           ↓
           Public Launch
```

---

## First Customer Readiness Checklist

| Item | Status |
|---|---|
| Contact Flow P0 Repair Gate | ✅ Done |
| All template forms use APP_URL_PLACEHOLDER/api/contact-submit | ✅ Done |
| pnpm check passes | ✅ Done |
| pnpm build passes | ✅ Done |
| Committed and pushed to origin/main | ✅ Done (8f11c2b) |
| Railway deploy confirmed | ⏳ In progress |
| Live Quality Lab rerun — all 5 sites score 95+/100 | ❌ Not yet run |
| Zero P0 fake proof | ✅ Verified by static audit |
| Zero broken contact forms | ✅ Verified by static audit |
| Admin explicitly approves first customer | ❌ Pending Quality Lab pass |
