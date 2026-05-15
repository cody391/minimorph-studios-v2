# 06 — Quality Rules

## The 95/100 Standard

Every generated site must score 95 or higher out of 100 before it can be delivered to any customer. This is not a soft target. Sites below 95 block first customer delivery.

---

## Fake Proof Rules (P0 — any violation fails the site immediately)

### Stars and Ratings

**FORBIDDEN in any customer-visible section:**
```
★★★★★
4.9★
5★
5/5
4.8 out of 5
```

**ALLOWED only in the token slot:**
```html
<div class="stars"></div>   <!-- empty: stars CSS fills from token if provided -->
```

The `TESTIMONIAL_1` token slot renders a rating only if the customer provided one. If they didn't, the slot stays empty. Do NOT add stars manually to HTML.

### Invented Metrics

**FORBIDDEN anywhere in templates:**
```
847+ members
500+ projects completed
1,200+ clients served
2,500+ happy customers
200+ neighbors
18 LBS / 94% results
```

**ALLOWED in templates:**
```
YEARS_IN_BUSINESS+ years
(any token that is replaced with real customer data)
```

Generic claims backed by customer-provided data are fine. Specific invented numbers are not.

### Fake Testimonials

**FORBIDDEN:**
- Any testimonial beyond TESTIMONIAL_1 slot unless the customer provided multiple
- Names like "A satisfied customer", "A happy shopper", "A loyal customer"
- Any `via Google`, `via Yelp`, `Verified Purchase` attribution

**ALLOWED:**
```html
<div class="testimonial-card" data-animate>
  <div class="stars"></div>
  <div class="testimonial-mark">❝</div>
  <p>TESTIMONIAL_1</p>
  <div class="testimonial-author">TESTIMONIAL_1_NAME</div>
  <div class="testimonial-context">TESTIMONIAL_1_CONTEXT</div>
</div>
```

If the customer provided no testimonial, the slot renders empty or is stripped at generation time. Do NOT invent a fake one to fill it.

### Hero Social Proof

**FORBIDDEN in hero sections:**
```
★★★★★ Best neighborhood restaurant in SERVICE_AREA
#1 contractor in SERVICE_AREA
Top-rated
Best in city
```

**ALLOWED:**
```
Serving SERVICE_AREA since YEARS_IN_BUSINESS
Trusted by neighbors in SERVICE_AREA
Proudly serving SERVICE_AREA
```

### Free Trials, Promotions, Guarantees

**FORBIDDEN unless the customer explicitly provided it in their questionnaire:**
```
Free Trial
First Class Free
Try a Class Free
Start Your Free Week
Money-back guarantee
50% off this month
```

**If the customer provides a promotion:** Include it, but only via the prompt/token system — never hardcode it in a template.

---

## Form Rules (P0 — any violation fails the site immediately)

### Required Pattern

Every form on every generated site MUST use:

```html
<form action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST">
```

`APP_URL_PLACEHOLDER` is replaced at generation time with `https://www.minimorphstudios.net` (no trailing slash, no `/portal`).

### Forbidden Patterns

```html
<!-- FORBIDDEN: Formspree placeholder -->
<form action="https://formspree.io/f/placeholder">

<!-- FORBIDDEN: Non-functional handler -->
<form onsubmit="return false;">

<!-- FORBIDDEN: Hardcoded wrong URL -->
<form action="https://www.minimorphstudios.net/portal/api/contact-submit">

<!-- FORBIDDEN: Empty action -->
<form>
```

### Grep to Verify

```bash
grep -r "formspree" server/templates/
grep -r "return false" server/templates/
grep -r "portal/api" server/templates/
```

All three commands must return zero results before any gate is marked passed.

---

## Token Replacement Rules

### Required Tokens (must be present in every index template)

| Token | Replaced with |
|---|---|
| `BUSINESS_NAME` | Customer's business name |
| `PHONE` | Customer's phone number |
| `EMAIL` | Customer's email address |
| `SERVICE_AREA` | Customer's city/region |
| `YEARS_IN_BUSINESS` | Years in business (or blank if not provided) |
| `HEADLINE_1` | AI-generated or customer-provided headline |
| `TAGLINE` | AI-generated or customer-provided tagline |
| `TESTIMONIAL_1` | Customer's testimonial (or empty) |
| `TESTIMONIAL_1_NAME` | Testimonial author name (or empty) |
| `TESTIMONIAL_1_CONTEXT` | Testimonial context/source (or empty) |
| `APP_URL_PLACEHOLDER` | `https://www.minimorphstudios.net` |

### Verify No Un-Replaced Tokens

After generation, the generated HTML must not contain any raw token strings. The admin review step (HumanReview.tsx) should flag these visually.

---

## Haiku Copy Rules

Haiku generates copy tokens (`HEADLINE_1`, `TAGLINE`, service descriptions, etc.). The HONESTY RULES block in the Haiku prompt prohibits:

- Inventing member/customer/project counts
- Inventing ratings or review scores
- Claiming "Best in [city]", "Top-rated", "#1"
- Offering promotions the customer did not provide
- Using real testimonial content if none was provided

These rules are enforced in `templateEngine.ts`. Do NOT remove them.

---

## Pre-Delivery Checklist (run before approving any site)

```
[ ] Zero ★★★★★ in content sections
[ ] Zero invented metrics (counts, percentages not from customer data)
[ ] Zero fake testimonial slots (beyond TESTIMONIAL_1)
[ ] Zero "via Google" / "via Yelp" / "Verified Purchase" attributions
[ ] Zero fake promotions or free trials
[ ] All forms use APP_URL_PLACEHOLDER/api/contact-submit
[ ] Zero Formspree references
[ ] Zero "return false" form handlers
[ ] All tokens replaced (no raw BUSINESS_NAME etc. visible)
[ ] pnpm check passes
[ ] pnpm build passes
```
