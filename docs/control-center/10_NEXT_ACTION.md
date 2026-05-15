# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Contact Flow P0 Repair Gate

**Priority:** P0 — blocks first customer delivery  
**Status:** OPEN

### What to do

Fix all broken contact/quote/reservation forms in HTML templates so every form POSTs to:
```
APP_URL_PLACEHOLDER/api/contact-submit
```

### Exact files to fix

| File | Current issue | Required fix |
|---|---|---|
| `server/templates/shared/contact.html` | `action="https://formspree.io/f/placeholder"` | Replace with `action="APP_URL_PLACEHOLDER/api/contact-submit"` |
| `server/templates/contractor/contact.html` | `action="https://formspree.io/f/placeholder"` | Replace with `action="APP_URL_PLACEHOLDER/api/contact-submit"` |
| `server/templates/contractor/quote.html` | `action="https://formspree.io/f/placeholder"` | Replace with `action="APP_URL_PLACEHOLDER/api/contact-submit"` |
| `server/templates/service/quote.html` | `action="https://formspree.io/f/placeholder"` | Replace with `action="APP_URL_PLACEHOLDER/api/contact-submit"` |
| `server/templates/restaurant/reservations.html` | `action="https://formspree.io/f/placeholder"` | Replace with `action="APP_URL_PLACEHOLDER/api/contact-submit"` |
| `server/templates/service/professional.html` | Index main form: `onsubmit="return false;"` | Remove `onsubmit`; add `action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST"` |
| `server/templates/boutique/warm-lifestyle.html` | Email signup: `onsubmit="return false;"` | Remove `onsubmit`; add `action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST"` |
| `server/templates/gym/bold-energetic.html` | No index contact form; all CTAs link to broken `shared/contact.html` | Verify CTAs now link to fixed `shared/contact.html` after that file is fixed. No additional index form required IF shared/contact.html works. |

### Step-by-step execution

1. Open each file. Find the broken form tag.
2. Replace `action="https://formspree.io/f/placeholder"` with `action="APP_URL_PLACEHOLDER/api/contact-submit"`.
3. For `onsubmit="return false;"` forms: remove `onsubmit` attribute; set `action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST"`.
4. After all files are fixed, run verification grep:
   ```bash
   grep -r "formspree" server/templates/
   grep -rn "return false" server/templates/
   ```
   Both must return zero results.
5. Run build:
   ```bash
   pnpm check && pnpm build
   ```
6. Commit:
   ```bash
   git add server/templates/
   git commit -m "Fix P0: replace all Formspree placeholders and broken form handlers with APP_URL_PLACEHOLDER/api/contact-submit"
   ```
7. Push:
   ```bash
   git push origin main
   ```
8. Confirm Railway deployment via HTTP header check.
9. Update control center:
   - `03_ACTIVE_BUILD_STATE.md` — new HEAD, mark Contact Flow P0 as resolved, set next lane to Quality Lab
   - `07_KNOWN_BLOCKERS.md` — move Formspree blocker to "Resolved"
   - `08_CHANGE_LOG.md` — add entry for this commit
   - `10_NEXT_ACTION.md` — update to Quality Lab gate

### After this gate: Quality Lab Gate

- Requires `railway login` to be restored (user must run this)
- Trigger 5 live generations via `onboarding.triggerGeneration`
- Score each site against the 95/100 rubric in `06_QUALITY_RULES.md`
- All 5 must pass before first customer proceeds

---

## Gate Sequence (reminder)

```
[CURRENT]  Contact Flow P0 Repair
           ↓
           Quality Lab (95+/100, all 5 sites)
           ↓
           First Controlled Customer
           ↓
           Public Launch
```
