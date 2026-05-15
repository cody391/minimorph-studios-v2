# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## P0 — Contact Flow: Formspree / Broken Forms

**Severity:** P0 — blocks first customer delivery  
**Status:** OPEN  
**Gate:** Contact Flow P0 Repair Gate (Gate 1)

### Affected Files

| File | Issue |
|---|---|
| `server/templates/shared/contact.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/contractor/contact.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/contractor/quote.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/service/quote.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/restaurant/reservations.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/service/professional.html` | Index page main form: `onsubmit="return false;"` |
| `server/templates/boutique/warm-lifestyle.html` | Email signup: `onsubmit="return false;"` |
| `server/templates/gym/bold-energetic.html` | No index contact form; all CTAs link to `shared/contact.html` (which is broken) |

### Fix Required

Replace every broken form action with:
```html
<form action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST">
```

For `onsubmit="return false;"` forms: remove the `onsubmit` attribute and add the correct `action`.

For `gym/bold-energetic.html`: add a contact form section to the index page, OR confirm CTAs link to a fixed `shared/contact.html`.

### Verification Command

```bash
grep -r "formspree" server/templates/
grep -rn "return false" server/templates/
```

Both must return zero results when this gate is closed.

---

## P1 — Railway CLI Unauthorized

**Severity:** P1 — blocks Quality Lab rerun (not first-customer delivery)  
**Status:** OPEN  

### Symptom

```
$ railway status
→ Unauthorized. Please run `railway login` again.
```

All Railway CLI commands fail. Cannot call `railway run` to trigger generation or deployment operations via CLI.

### Workaround (in place)

Confirmed production deployment via HTTP header check:
```bash
curl -sI https://www.minimorphstudios.net/health | grep last-modified
```

A changed `Last-Modified` timestamp after a push confirms Railway picked up the new commit.

### Fix Required

Run `railway login` in an interactive terminal session (must be done by user, not Claude). This restores CLI auth. After login, `railway status` should return the project name.

### Impact

Without CLI access:
- Cannot call `onboarding.triggerGeneration` via API
- Cannot run Quality Lab live generation
- Quality Lab blocked until this is resolved

---

## P2 — Admin Credentials Not in Local .env

**Severity:** P2 — blocks local development testing only  
**Status:** OPEN

### Symptom

Cannot test admin-gated procedures (`adminProcedure`) locally. `bootstrapAdminUser` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env vars that are set in Railway but not in local `.env`.

### Fix Required

Add admin credentials to local `.env` (or `.env.local`) to enable local admin testing. Do not commit credentials to version control.

### Impact

Local QA only. Production admin login works via Railway env vars.

---

## Resolved Blockers (for reference)

| Issue | Fix | Commit |
|---|---|---|
| `brief.appUrl` included `/portal` suffix → forms posted to `/portal/api/contact-submit` | Stripped `/portal` in siteGenerator.ts | `f1f67c5` |
| Haiku generated fake metrics (847+ members, free trials) | Added HONESTY RULES block to Haiku prompt | `f1f67c5` |
| Template HTML contained fake star ratings in content divs | Removed all `★★★★★` from content sections across all templates | `f1f67c5` |
| Hero social proof invented fake superlatives | Replaced with token-based copy (e.g. "Serving SERVICE_AREA since YEARS_IN_BUSINESS") | `f1f67c5` |
| Fake testimonial cards (Sarah M., James K., Linda R.) in contractor/dark-industrial.html | Replaced with single TESTIMONIAL_1 slot | `b947256` |
| Fake testimonial slots 2+3 in salon, ecommerce, boutique, service templates | Removed; only TESTIMONIAL_1 slot remains | `88c1425` |
| Invented trust stats (500+, 1,200+, 4.9★) in index and about sub-pages | Removed all invented counts and stars from trust bars + about stats | `88c1425` |
| Free trial section with JS handler in gym/bold-energetic.html | Removed entire trial-section and JS handler | `88c1425` |
| Gym pricing CTA links pointing to non-existent free-trial.html | Redirected to contact.html | `f1f67c5` |

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
