# 07 — Known Blockers

**Last updated: 2026-05-15**

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
| Formspree placeholders and `onsubmit="return false;"` forms in 9 generated-site templates | Replaced with JS fetch handler POSTing to `APP_URL_PLACEHOLDER/api/contact-submit`; added success/error UX; added hidden businessName field; added email field where missing | `0c1440d` |

---

## P2 — Boutique/warm-lifestyle.html: Hardcoded Seasonal Banner

**Severity:** P2 — will fail Quality Lab rubric; does not block current gate  
**Status:** OPEN  
**Gate:** Quality Lab Gate

### Symptom

`server/templates/boutique/warm-lifestyle.html` contains a hardcoded promotional banner:
```html
<strong>Summer Sale — Up to 40% off!</strong> Limited time. Shop before it's gone.
```

This is invented promotional content not supplied by the customer. It violates Rule 3 (No Fake Proof) and will fail the Quality Lab 95/100 rubric.

### Fix Required

Replace the hardcoded text with a token (e.g. `PROMO_BANNER`) that the template engine can fill from questionnaire data, or remove the `.seasonal-banner` section entirely if no promo data is collected.

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
