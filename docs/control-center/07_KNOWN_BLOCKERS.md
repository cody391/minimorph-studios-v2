# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## Active Blockers

### B1 — Live Quality Lab Rerun Not Completed

**Severity:** P1 — blocks first customer delivery
**Status:** OPEN
**Gate:** Deploy Confirmed + Live Quality Lab Rerun

All template content repairs have been committed and pushed. The live Quality Lab generation has not been re-executed against the repaired codebase. Until 5/5 test businesses score 95+/100, first customer delivery is blocked.

**What to do:** Run `railway run npx tsx server/scripts/_qualityLabRun.ts` (or equivalent) against the deployed codebase. All 5 businesses must pass. If any fail, new P1 blockers will be recorded here.

---

### B2 — Admin Credentials Not in Local .env

**Severity:** P2 — blocks local development testing only
**Status:** OPEN

Cannot test admin-gated procedures (`adminProcedure`) locally. `bootstrapAdminUser` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env vars set in Railway but not in local `.env`.

**Fix:** Add admin credentials to local `.env` (or `.env.local`). Do not commit credentials to version control. Production admin login works via Railway env vars.

---

## Resolved Blockers

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
| Formspree placeholders and `onsubmit="return false;"` forms in 9 generated-site templates | Replaced with JS fetch handler POSTing to `APP_URL_PLACEHOLDER/api/contact-submit` | `0c1440d` |
| Railway CLI unauthorized — blocked Quality Lab | User ran `railway login`; CLI now authenticated | — |
| **P1-A** contractor/dark-industrial.html: hardcoded GC services (Kitchen Remodel, Bathroom Reno, etc.) and hardcoded gallery city/project captions | Tokenized 6 service cards to SERVICE_1–6_DESC; removed hardcoded gallery captions | `86105c5` |
| **P1-B** restaurant/warm-casual.html: hardcoded menu items (House Burger $18, Sunday Brunch Plate $16) and broken order.html link | Removed hardcoded items/prices; replaced with SERVICE tokens; removed order.html links | `86105c5` |
| **P1-C** salon/editorial-luxury.html: exclusivity claim, $185–$800 hardcoded prices, fake Senior Stylist, broken contact.html link | Removed claim; removed prices; removed fake team card; added "contact" to salon INDUSTRY_PAGES | `86105c5` |
| **P1-D** gym/bold-energetic.html + clean-modern.html: $89/$129/$199 pricing grid, fake Coach Alex/Jordan/Sam, invented CF-L2 credentials, broken footer links | Neutralized pricing to CTA; removed fake coaches; removed credentials; fixed footer links | `86105c5` |
| **P1-E** LLM fallback: form endpoint not specified in buildCustomTemplatePrompt() | Added required fetch pattern with APP_URL_PLACEHOLDER/api/contact-submit to prompt | `86105c5` |
| **P2** boutique/warm-lifestyle.html: hardcoded Summer Sale banner | Removed seasonal banner div | `86105c5` |
| restaurant/menu.html: hardcoded food items (charcuterie, fish, short rib, risotto, etc.) and all drink price ranges | Removed; replaced with SERVICE_1–6_DESC tokens + neutral CTA | `8f11c2b` |
| gym/classes.html: $25/$149/$199 pricing grid, "Most Popular" badge, hardcoded calorie claim (450–600 cal) | Removed pricing grid; replaced with neutral membership CTA → contact.html; removed calorie claim | `8f11c2b` |

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
