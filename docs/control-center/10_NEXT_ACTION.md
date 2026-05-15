# 10 — Next Action

**Last updated: 2026-05-15**

---

## Current Gate: Quality Lab Gate — BLOCKED (Template Content Issues)

**Priority:** P1 — blocks first customer delivery  
**Status:** BLOCKED — Quality Lab static audit failed; 0/5 sites meet 95/100 standard

### What happened

Static audit of all 5 Quality Lab templates was completed (commit `97a8634` is live in production). Deployment confirmed. Railway CLI authenticated. No P0 form violations found in any hand-crafted template. However, template content issues cause all 4 assessable sites to fall below 95/100.

### Quality Lab Scores (static audit)

| Business | Template | P0 Form Fail | P0 Fake Proof Fail | Score | Result |
|---|---|---|---|---|---|
| Apex Roofing & Exteriors MN | `contractor/dark-industrial.html` | ✅ None | ✅ None | ~87/100 | **FAIL** |
| Rosa's Kitchen | `restaurant/warm-casual.html` | ✅ None | ✅ None | ~90/100 | **FAIL** |
| Luxe + Bare Studio | `salon/editorial-luxury.html` | ✅ None | ⚠️ Exclusivity claim | ~78/100 | **FAIL** |
| FitForge CrossFit | `gym/bold-energetic.html` | ✅ None | ✅ None | ~79/100 | **FAIL** |
| GreenLeaf Landscaping Co. | LLM fallback | ❓ Unknown | ❓ Unknown | N/A | **Cannot assess** |

### Issues discovered per template

**contractor/dark-industrial.html (Apex Roofing):**
- Services section hardcoded to general contractor services (Kitchen Remodeling, Bathroom Renovation, Home Additions, Basement Finishing, Deck & Outdoor, Whole Home Remodel) — wrong for a roofing company; these are not tokens
- Gallery captions hardcoded to wrong project types: "Kitchen remodel · Eden Prairie", "Master Bath · Edina", "Deck Addition · Minnetonka", "Basement Finish · Plymouth"
- These issues cause ~-13 points; 87/100

**restaurant/warm-casual.html (Rosa's Kitchen):**
- Growth+ tier menu section shows hardcoded placeholder dishes with invented prices: "House Burger $18", "Sunday Brunch Plate $16" — not Rosa's actual menu
- Template links to "order.html" which is not in restaurant's `INDUSTRY_PAGES` and would not be generated → 404 broken link
- These issues cause ~-10 points; 90/100

**salon/editorial-luxury.html (Luxe + Bare Studio):**
- Line 173: `"The only certified studio in SERVICE_AREA."` — unfounded exclusivity claim in Hair Extensions service row; customer did not provide this
- All 5 service prices hardcoded ($185 Balayage, $800 Extensions, $250 Brazilian Blowout, $75 Cut, $300 Bridal) — not from customer questionnaire
- Growth+ tier: "Senior Stylist" team member with invented Great Lengths certification bio — fake team member
- Template links to `contact.html` for bookings; salon `INDUSTRY_PAGES` does not include "contact" for growth+ tier → potential broken link (starter tier generates contact page)
- These issues cause ~-22 points; 78/100

**gym/bold-energetic.html (FitForge CrossFit):**
- Pricing section ($89 Foundation, $129 Unlimited, $199 Elite — with hardcoded features) is NOT in any conditional block — shows for all tiers with invented prices/features that may not match actual gym pricing
- Growth+ trainer section: "Coach Alex" (NSCA-CSCS, former collegiate athlete) and "Coach Jordan" (NASM-CPT, RYT-200) are fake team members with specific invented credentials
- OWNER_NAME trainer card hardcodes "CF-L2 · 10 years competitive athletics" — invented credentials for the real owner
- Footer links to "trainers.html" and "memberships.html" which are not in gym `INDUSTRY_PAGES` → broken links
- These issues cause ~-21 points; 79/100

**GreenLeaf Landscaping Co. (LLM fallback):**
- businessType "landscaping" → `selectTemplate()` returns `null` → Claude Sonnet generates full HTML
- LLM fallback HONESTY RULES confirmed present in siteGenerator.ts prompt (no fake testimonials/ratings/metrics)
- **Form endpoint gap:** `buildCustomTemplatePrompt()` does NOT specify `APP_URL_PLACEHOLDER` or any form endpoint in the LLM's token list. The LLM determines the form endpoint itself. If the LLM generates a `<form>` (which the prompt requires), `siteGenerator.ts` will NOT override it (injection only fires when no form exists). The resulting form endpoint is unpredictable — could pass or fail the P0 form check.
- Cannot score without live generation

### What needs to be fixed before Quality Lab can pass

**Option A (fix templates, recommended):**
1. `contractor/dark-industrial.html` — Replace hardcoded services (h3/p pairs) with SERVICE_1_DESC through SERVICE_6_DESC tokens + generic desc prompts. Remove hardcoded gallery caption city names.
2. `restaurant/warm-casual.html` — Strip "order.html" CTAs or add "order" to restaurant `INDUSTRY_PAGES`. Remove or tokenize hardcoded menu prices.
3. `salon/editorial-luxury.html` — Remove "The only certified studio in SERVICE_AREA" claim. Tokenize or remove hardcoded service prices. Replace fake "Senior Stylist" team member with a token slot or remove. Fix broken contact.html link (add "contact" to salon INDUSTRY_PAGES or convert to shared/contact.html).
4. `gym/bold-energetic.html` — Tokenize pricing or gate it behind customer-provided data. Replace fake Coach Alex/Coach Jordan with token slots or remove. Remove "CF-L2 · 10 years competitive athletics" from OWNER_NAME trainer card.
5. `LLM fallback prompt` — Add `APP_URL_PLACEHOLDER/api/contact-submit` as the required form endpoint in `buildCustomTemplatePrompt()`.

**Option B (targeted minimum to reach 95/100 for each):**
- Smaller, higher-priority fixes to cross the 95 threshold. See `07_KNOWN_BLOCKERS.md` for per-site priority.

### Deployment status (confirmed, not blocking)

- Commit `97a8634` deployed: Railway timestamp `2026-05-15 01:00:34 -04:00`, HTTP `Last-Modified: Fri, 15 May 2026 05:01:16 GMT` ✅
- All contact form P0 fixes (commit `0c1440d`) are live in production ✅
- `pnpm check` and `pnpm build` pass ✅

### Boutique seasonal banner (P2, unchanged)

`boutique/warm-lifestyle.html` line 638-639 still contains:
```html
<strong>Summer Sale — Up to 40% off!</strong> Limited time. Shop before it's gone.
```
Not one of the 5 test businesses but must be fixed before any boutique customer is onboarded. See `07_KNOWN_BLOCKERS.md`.

---

## Gate Sequence (reminder)

```
[DONE]     Contact Flow P0 Repair ✅ (commit 0c1440d)
           ↓
[CURRENT]  Quality Lab — BLOCKED on template content issues (0/5 sites pass 95/100)
           ↓
           First Controlled Customer
           ↓
           Public Launch
```
