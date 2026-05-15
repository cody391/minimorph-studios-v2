# System: Deployment and Domains

## Overview

After the customer approves their site, it is deployed to Cloudflare Pages. If the customer purchased a custom domain, DNS is configured and a handoff email is sent.

---

## Deployment Flow

```
Customer approves site in portal
  → stage: final_approval
  → admin triggers deployment (or auto-triggers)
  → siteDeployment.ts
      → cloudflareDeployment.ts → Cloudflare Pages API
      → creates/updates CF Pages project for this customer
      → uploads index.html + sub-pages
  → if domainName set:
      → connects custom domain in CF Pages
      → sends DNS configuration email to customer via Resend
  → if no custom domain:
      → CF Pages URL is immediately live (*.pages.dev)
  → stage: launch → complete
```

---

## Key Files

| File | Purpose |
|---|---|
| `server/services/siteDeployment.ts` | Orchestrates deployment |
| `server/services/cloudflareDeployment.ts` | Cloudflare Pages API wrapper |

---

## Cloudflare Pages

Each customer gets their own Cloudflare Pages project. The project name is derived from the customer's business name or onboarding project ID.

Uploaded files:
- `index.html` — main page
- All sub-pages (`about.html`, `contact.html`, `services.html`, etc.)
- Any assets (CSS, JS) referenced in the templates

After upload, the site is immediately live at `{project-name}.pages.dev`.

---

## Custom Domains

If the customer provided a domain name during intake:
1. Cloudflare Pages connects the custom domain
2. A DNS configuration email is sent to the customer showing what nameserver changes to make
3. The site becomes live at the custom domain after DNS propagates (24-72 hours)

Auto-domain registration (auto-purchasing domains on behalf of customers) is **frozen**. Do not activate.

---

## Railway (App Hosting)

The MiniMorph application itself (backend + frontend) is hosted on Railway.

| Detail | Value |
|---|---|
| Railway project | `fabulous-dedication` |
| Service | `minimorph-studios-v2` |
| Production URL | `https://www.minimorphstudios.net` |

Railway autodeploys on push to `main` branch via GitHub integration.

### Confirming a Deploy

```bash
curl -sI https://www.minimorphstudios.net/health | grep last-modified
```

A changed `Last-Modified` timestamp after a push confirms Railway picked up the new commit and restarted.

### Railway CLI

Railway CLI (`railway`) is used to run commands and view logs. If it returns "Unauthorized", run `railway login` to restore access. This requires interactive browser authentication and must be done by the user.

---

## Environment Variables

Railway environment variables required for production:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `APP_URL` | Public app URL (must NOT include `/portal`) |
| `ADMIN_EMAIL` | Admin account email |
| `ADMIN_PASSWORD` | Admin account password |
| `JWT_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Email delivery |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `CLOUDFLARE_API_TOKEN` | CF Pages deployment |
| `CLOUDFLARE_ACCOUNT_ID` | CF account |
| `ANTHROPIC_API_KEY` | Claude Haiku/Sonnet for generation |
| `TWILIO_*` | SMS/voice (may be frozen) |

If `APP_URL` is missing or wrong, `brief.appUrl` falls back to `https://www.minimorphstudios.net` — this is the correct fallback. Do not change the fallback without testing.
