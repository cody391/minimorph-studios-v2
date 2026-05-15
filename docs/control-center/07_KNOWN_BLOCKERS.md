# 07 — Known Blockers

**Last updated: 2026-05-15**

---

## P1 — Quality Lab: Template Content Issues (4 templates, 0/5 sites pass)

**Severity:** P1 — blocks Quality Lab gate; blocks first customer delivery  
**Status:** OPEN  
**Discovered:** 2026-05-15 Quality Lab static audit

Static audit of the 5 Quality Lab test businesses found content issues in all 4 assessable hand-crafted templates. No P0 form violations. No P0 fake-stars or invented-stats violations. All failures are template-content issues: hardcoded generic services/prices/team-members that don't come from customer data.

---

### P1-A — contractor/dark-industrial.html: Wrong hardcoded services and gallery labels

**Template:** `server/templates/contractor/dark-industrial.html`  
**Severity:** P1 — Quality Lab fails; applies to all contractor customers  

#### Symptom

Services section contains 6 hardcoded service cards (h3 + p) for a generic GC:
- Kitchen Remodeling, Bathroom Renovation, Home Additions, Basement Finishing, Deck & Outdoor, Whole Home Remodel

These are NOT SERVICE_X_DESC tokens — they are literal HTML text. A roofing company like Apex Roofing & Exteriors MN would get a site advertising kitchen remodeling.

Gallery captions are hardcoded to specific project types and cities:
- "Kitchen remodel · Eden Prairie", "Master Bath · Edina", "Deck Addition · Minnetonka", "Basement Finish · Plymouth"

#### Fix Required

Replace the 6 service card h3/p pairs with SERVICE_1_DESC through SERVICE_6_DESC tokens and a generic short description placeholder (or single-line Haiku copy). Remove city names and project types from gallery caption labels.

#### Impact

~-13 points on Quality Lab rubric. Score: ~87/100. FAIL.

---

### P1-B — restaurant/warm-casual.html: Hardcoded menu items and broken order.html link

**Template:** `server/templates/restaurant/warm-casual.html`  
**Severity:** P1 — affects Quality Lab; affects restaurant customers on growth+ tier  

#### Symptom

Inside `<!-- IF_GROWTH_PLUS_START -->` block:
- "Chef's Daily Special — Market Price", "House Burger — $18", "Sunday Brunch Plate — $16": hardcoded invented dish names and prices

Template links to `order.html` twice (hero CTA, order-online section) but `INDUSTRY_PAGES["restaurant"]` = `["menu", "reservations", "about"]`. No order page is generated. Clicking either CTA would 404.

#### Fix Required

Remove or tokenize menu item names and prices (or make the section display generic copy like "Ask your server for today's specials"). Either add "order" to restaurant INDUSTRY_PAGES, or remove order.html CTAs and replace with reservations.html links.

#### Impact

~-10 points. Score: ~90/100. FAIL.

---

### P1-C — salon/editorial-luxury.html: Exclusivity claim, invented prices, fake team member

**Template:** `server/templates/salon/editorial-luxury.html`  
**Severity:** P1 — high impact; multiple issues  

#### Symptoms

1. **Unfounded exclusivity claim (line 173):** `"The only certified studio in SERVICE_AREA."` inside the Hair Extensions service row — customer did not provide this; it's an invented superlative claim analogous to "Top-rated" or "#1".

2. **Hardcoded service prices (all 5 rows):** $185 (Balayage), $800 (Extensions), $250 (Brazilian Blowout), $75 (Precision Cut), $300 (Bridal). These are specific numbers not from customer questionnaire.

3. **Fake team member in growth+ block:** "Senior Stylist" with an invented bio claiming Great Lengths certification — not a real employee of the customer.

4. **Broken contact.html link:** Template links to `contact.html` for all booking CTAs, but `INDUSTRY_PAGES["salon"]` = `["services", "gallery", "about"]` — no contact page is generated for growth+ tier (starter does generate contact). Salon booking CTA would 404 on growth+ plan.

#### Fix Required

1. Remove "The only certified studio in SERVICE_AREA." from line 173.
2. Replace all 5 hardcoded prices with a token (e.g. `SERVICE_X_PRICE`) or remove the price column.
3. Replace "Senior Stylist" team member block with a token slot or remove entirely.
4. Either add "contact" to salon INDUSTRY_PAGES, or change booking links to use `shared/contact.html` route, or link to `mailto:EMAIL` as fallback.

#### Impact

~-22 points. Score: ~78/100. FAIL.

---

### P1-D — gym/bold-energetic.html: Invented pricing, fake coaches, invented owner credentials

**Template:** `server/templates/gym/bold-energetic.html`  
**Severity:** P1 — multiple issues; pricing shows for all tiers  

#### Symptoms

1. **Hardcoded pricing section (NOT in any conditional block — shows for all tiers):** Foundation $89/mo, Unlimited $129/mo, Elite $199/mo — with specific hardcoded features lists ("Nutrition guide included", "Custom meal plan", "Direct coach access"). These invented prices and features show for every gym customer.

2. **Fake trainers in growth+ block:** "Coach Alex" (NSCA-CSCS, former collegiate athlete) and "Coach Jordan" (NASM-CPT, RYT-200, injury prevention) are entirely invented team members with specific credentials.

3. **Invented credentials for owner:** OWNER_NAME trainer card hardcodes "CF-L2 · 10 years competitive athletics" — these are specific certifications and years that may not be true for the actual customer.

4. **Broken footer links:** Footer links to "trainers.html" and "memberships.html" which are not in `INDUSTRY_PAGES["gym"]` = `["classes", "about"]` → would 404.

#### Fix Required

1. Tokenize pricing section using customer-provided data, or gate the entire pricing section behind `<!-- IF_GROWTH_PLUS_START -->` and use tokens for prices.
2. Replace fake Coach Alex/Coach Jordan with token slots (e.g. TEAM_MEMBER_2_NAME, TEAM_MEMBER_2_TITLE) or remove the extra trainer cards.
3. Remove "CF-L2 · 10 years competitive athletics" from OWNER_NAME card; replace with OWNER_CREDENTIALS token or remove.
4. Remove "trainers.html" and "memberships.html" from footer links or add those pages to INDUSTRY_PAGES.

#### Impact

~-21 points. Score: ~79/100. FAIL.

---

### P1-E — LLM fallback (GreenLeaf / landscaping type): Form endpoint not specified in prompt

**Template:** LLM fallback — `buildCustomTemplatePrompt()` in `server/services/templateEngine.ts`  
**Severity:** P1 — affects all businesses with no hand-crafted template  

#### Symptom

`buildCustomTemplatePrompt()` lists token placeholders for the LLM to use (BUSINESS_NAME, PHONE, etc.) but does NOT include `APP_URL_PLACEHOLDER` in the token list, and does NOT specify the form submission endpoint.

The LLM prompt requires a contact form but leaves the form action/endpoint entirely up to the LLM. `siteGenerator.ts` only injects its own contact form `if (!/<form[\s>]/i.test(html))` — since the LLM always generates a form (per the prompt's REQUIRED SECTIONS), the siteGenerator's corrected form is never injected.

Result: the form endpoint in LLM-generated sites is unpredictable and could fail the P0 form check.

#### Fix Required

In `buildCustomTemplatePrompt()`, add to the REQUIRED SECTIONS contact form section:

```
9. Contact / CTA: PHONE, EMAIL, ADDRESS, HOURS, SERVICE_AREA + contact form.
   The form MUST submit via JavaScript fetch to APP_URL_PLACEHOLDER/api/contact-submit.
   Use this exact pattern:
   <form id="contact-form">
     [name, email, phone, message inputs with required attribute]
     <button type="submit">Send Message</button>
   </form>
   <input type="hidden" name="businessName" value="BUSINESS_NAME">
   <script>
   (function(){var f=document.getElementById('contact-form');if(!f)return;
   f.addEventListener('submit',function(e){e.preventDefault();
   var fd=new FormData(f),btn=f.querySelector('button');
   btn.disabled=true;btn.textContent='Sending...';
   fetch('APP_URL_PLACEHOLDER/api/contact-submit',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:fd.get('name'),email:fd.get('email'),
   phone:fd.get('phone'),message:fd.get('message'),businessName:'BUSINESS_NAME'})
   }).then(function(r){return r.json();}).then(function(res){
   if(res.success){f.innerHTML='<p style="text-align:center;padding:2rem">Thanks! We\'ll be in touch.</p>';}
   }).catch(function(){btn.disabled=false;btn.textContent='Send Message';});});
   })();
   </script>
```

#### Impact

Unknown score — cannot assess without live generation. Form P0 check cannot be confirmed.

---

## P2 — Boutique/warm-lifestyle.html: Hardcoded Seasonal Banner

**Severity:** P2 — will fail Quality Lab rubric for boutique customers  
**Status:** OPEN  
**Gate:** Quality Lab Gate

### Symptom

`server/templates/boutique/warm-lifestyle.html` line 638-639 contains a hardcoded promotional banner:
```html
<strong>Summer Sale — Up to 40% off!</strong> Limited time. Shop before it's gone.
```

This is invented promotional content not supplied by the customer. Violates Rule 3 (No Fake Proof) and will fail Quality Lab 95/100 rubric.

### Fix Required

Replace the hardcoded text with a `PROMO_BANNER` token that the template engine can fill from questionnaire data, or remove the `.seasonal-banner` section entirely if no promo data is collected.

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
| Railway CLI unauthorized — blocked Quality Lab | User ran `railway login`; CLI now authenticated | — |

---

## How to Add a New Blocker

1. Add an entry to this file with: severity, status, affected file(s), exact symptom, fix required, impact.
2. After fixing, move it to "Resolved Blockers" with the commit hash.
3. Update `03_ACTIVE_BUILD_STATE.md` to reflect the new state.
