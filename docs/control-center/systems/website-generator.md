# System: Website Generator

## Overview

The website generator produces a complete multi-page HTML site from a customer's blueprint and questionnaire data. It is the core fulfillment engine of MiniMorph Studios.

---

## Two Generation Paths

### Path 1: Template Engine (primary)

Used for all industries that have hand-crafted HTML templates.

```
siteGenerator.ts
  → finds matching template by industry + variant
  → templateEngine.ts
      → builds "brief" from blueprint + questionnaire
      → calls Claude Haiku to generate copy tokens
      → injectContentIntoTemplate replaces tokens in HTML
      → stripPackageSections removes tier-gated blocks
      → buildAddonWidgets adds addon HTML/JS
  → returns { indexHtml, subPages: { [filename]: html } }
```

**Key file:** `server/services/templateEngine.ts`

### Path 2: LLM Fallback (secondary)

Used when no matching template exists for an industry, or when admin explicitly selects LLM path.

```
siteGenerator.ts
  → no template found
  → calls Claude Sonnet directly
  → generates full HTML from system prompt + brief
  → returns generated HTML
```

**Key file:** `server/services/siteGenerator.ts` (the LLM prompt section)

---

## Template Structure

Templates live under `server/templates/{industry}/{variant}.html`.

### Current template inventory

| Industry | Index variants | Sub-pages |
|---|---|---|
| contractor | dark-industrial, light-professional | about, contact, gallery, quote, services |
| restaurant | warm-casual, moody-upscale | menu, about, reservations, order |
| salon | warm-boutique, editorial-luxury | about, services |
| boutique | warm-lifestyle, minimal-editorial | varies |
| gym | bold-energetic, clean-modern | about, classes, schedule |
| service | professional, friendly-local | about, quote, services |
| coffee | artisan-roaster, cozy-neighborhood | menu, about |
| ecommerce | catalog | product |
| shared | — | contact, privacy |

### Token convention

All tokens in templates use `ALL_CAPS_UNDERSCORE` format:

```
BUSINESS_NAME, PHONE, EMAIL, SERVICE_AREA, YEARS_IN_BUSINESS
HEADLINE_1, TAGLINE, HERO_CTA, SERVICE_1, SERVICE_2, SERVICE_3
TESTIMONIAL_1, TESTIMONIAL_1_NAME, TESTIMONIAL_1_CONTEXT
APP_URL_PLACEHOLDER
LIC #LICENSE_NUMBER  (contractor-specific)
```

`APP_URL_PLACEHOLDER` is replaced in `siteGenerator.ts` before the site is stored. All other tokens are replaced by `templateEngine.ts → injectContentIntoTemplate`.

---

## brief.appUrl

The `brief` object passed to templateEngine includes `appUrl`, which becomes `APP_URL_PLACEHOLDER`. It is constructed in `siteGenerator.ts` as:

```typescript
appUrl: (ENV.appUrl || "https://www.minimorphstudios.net")
  .replace(/\/portal\/?$/, "")
  .replace(/\/$/, "")
```

This produces: `https://www.minimorphstudios.net` (no trailing slash, no `/portal`).

**Never change this without understanding the contact form dependency.** Every template form uses `APP_URL_PLACEHOLDER/api/contact-submit`. If `brief.appUrl` includes `/portal`, all forms break.

---

## Package Tier Gating

Templates contain tier-gated blocks:

```html
<!-- IF_GROWTH_PLUS_START -->
  <!-- growth and premium content here -->
<!-- IF_GROWTH_PLUS_END -->

<!-- IF_PREMIUM_PLUS_START -->
  <!-- premium-only content here -->
<!-- IF_PREMIUM_PLUS_END -->
```

`stripPackageSections` in `templateEngine.ts` removes blocks the customer isn't entitled to based on their package tier (starter, growth, premium).

---

## Haiku Copy Generation

Haiku is called with a structured prompt including:
- Customer questionnaire data
- Business brief
- Token list to fill
- **HONESTY RULES block** (added 2026-05-15 — do not remove)

HONESTY RULES prohibit Haiku from inventing metrics, ratings, superlatives, or promotions the customer did not provide.

Haiku returns a JSON object of token → value pairs. These are injected by `injectContentIntoTemplate`.

---

## Generated Output

The generator returns:

```typescript
{
  indexHtml: string,           // The main index.html content
  subPages: {
    [filename: string]: string  // e.g., { "about.html": "...", "contact.html": "..." }
  }
}
```

This is stored as a JSON blob in `onboarding_projects.generatedSiteHtml`.

---

## Rules Before Editing

1. Run `pnpm check` after any change to `siteGenerator.ts` or `templateEngine.ts`
2. Run `pnpm build` after any change
3. Verify `brief.appUrl` never includes `/portal` suffix
4. Verify all HONESTY RULES blocks remain in prompts
5. Do NOT remove the blueprint-approval gate in `siteGenerator.ts`
6. Do NOT remove the payment gate for `source === "self_service"` projects
7. After editing any template HTML, run:
   ```bash
   grep -r "formspree" server/templates/
   grep -r "★★★★★" server/templates/
   grep -rn "return false" server/templates/
   ```
