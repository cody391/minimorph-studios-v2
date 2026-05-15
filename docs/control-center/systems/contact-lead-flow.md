# System: Contact Lead Flow

## Overview

When a visitor on a customer's live site submits a contact form, the submission must reach MiniMorph's database, notify the business owner, and notify the MiniMorph owner. This is the most critical link between the generated site and the backend.

**If this breaks, the customer's entire lead pipeline silently dies.**

---

## The Endpoint

```
POST https://www.minimorphstudios.net/api/contact-submit
```

Defined in `server/_core/index.ts`.

---

## What Happens on Submission

1. Visitor submits form on customer's generated site
2. Browser POSTs to `https://www.minimorphstudios.net/api/contact-submit`
3. Express receives the POST
4. Creates a `contact_submissions` record in the database
5. Sends email notification to MiniMorph owner (Resend)
6. Sends email notification to the business owner (Resend)
7. Visitor sees success response

---

## Template Requirement

Every form on every generated template MUST use:

```html
<form action="APP_URL_PLACEHOLDER/api/contact-submit" method="POST">
```

`APP_URL_PLACEHOLDER` is replaced at generation time with `https://www.minimorphstudios.net`.

**CORS headers** are required because the form is on a different domain (the customer's Cloudflare Pages site). These headers are set in `server/_core/index.ts` for the `/api/contact-submit` route.

---

## Current P0 Blocker

As of 2026-05-15, the following sub-page templates use broken form endpoints instead of `APP_URL_PLACEHOLDER/api/contact-submit`:

| File | Broken endpoint |
|---|---|
| `server/templates/shared/contact.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/contractor/contact.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/contractor/quote.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/service/quote.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/restaurant/reservations.html` | `action="https://formspree.io/f/placeholder"` |
| `server/templates/service/professional.html` | `onsubmit="return false;"` (index main form) |
| `server/templates/boutique/warm-lifestyle.html` | `onsubmit="return false;"` (email signup) |

These are being fixed in the Contact Flow P0 Repair Gate.

---

## Verification After Fix

```bash
# No Formspree references anywhere in templates
grep -r "formspree" server/templates/

# No return false handlers on forms
grep -rn "return false" server/templates/

# No hardcoded /portal in form actions
grep -r "portal/api" server/templates/
```

All three must return zero results.

---

## DB Schema

Table: `contact_submissions`

Key columns:
- `id` — primary key
- `onboarding_project_id` — FK to the customer's project
- `name` — visitor's name
- `email` — visitor's email
- `phone` — visitor's phone (optional)
- `message` — form message
- `created_at` — submission timestamp

Submissions are viewable in the admin dashboard.

---

## CORS Requirement

The `/api/contact-submit` endpoint MUST have CORS headers configured because:
- The customer's site is hosted at `*.pages.dev` or their custom domain
- The backend is at `minimorphstudios.net`
- These are different origins — the browser will block the POST without CORS headers

Do not remove CORS configuration from this endpoint when editing `server/_core/index.ts`.

---

## Resend Email Dependency

Both notification emails are sent via Resend. If `RESEND_API_KEY` is not set in Railway env vars, emails will silently fail but the form submission will still be recorded in the DB.

Verify `RESEND_API_KEY` is set in Railway before first customer delivery.
