# Site Generator Template Library

Hand-crafted HTML templates used by `templateEngine.ts` to produce client websites.
Each template is fully self-contained (inline CSS, Google Fonts, vanilla JS) and
uses token placeholders that the engine replaces at generation time.

---

## Template List

| Path | Business Type | Brand Tone | Font Pair | Bg Color |
|---|---|---|---|---|
| `contractor/dark-industrial.html` | contractor | bold | Barlow Condensed + Barlow | #0d0d0d |
| `contractor/light-professional.html` | contractor | professional | Cormorant Garamond + Inter | #fafaf8 |
| `restaurant/moody-upscale.html` | restaurant | upscale | Cormorant Garamond + DM Sans | #0c0a08 |
| `restaurant/warm-casual.html` | restaurant | casual | Playfair Display + Lato | #faf6f0 |
| `gym/bold-energetic.html` | gym | bold | Barlow Condensed + Barlow | #080808 |
| `gym/clean-modern.html` | gym | modern | Inter | #ffffff |
| `salon/editorial-luxury.html` | salon | luxury | Cormorant Garamond + DM Sans | #fafaf8 |
| `salon/warm-boutique.html` | salon | warm | Playfair Display + Lato | #fdf9f4 |
| `coffee/artisan-roaster.html` | coffee | artisan | Barlow Condensed + Barlow | #0e0b08 |
| `coffee/cozy-neighborhood.html` | coffee | cozy | Playfair Display + Lato | #faf5ee |
| `boutique/minimal-editorial.html` | boutique | minimal | Cormorant Garamond + DM Sans | #ffffff |
| `boutique/warm-lifestyle.html` | boutique | warm | Playfair Display + Lato | #faf4ec |
| `service/professional.html` | service | professional | Inter | #ffffff |
| `service/friendly-local.html` | service | friendly | Playfair Display + Lato | #fdfaf6 |

---

## Template Selection Logic

`selectTemplate(businessType, brandTone)` picks the template path:

```
businessType=contractor, tone=bold/dark/industrial → contractor/dark-industrial.html
businessType=contractor, tone=* (default)          → contractor/light-professional.html

businessType=restaurant, tone=upscale/moody/fine   → restaurant/moody-upscale.html
businessType=restaurant, tone=* (default)           → restaurant/warm-casual.html

businessType=gym, tone=bold/energetic/dark          → gym/bold-energetic.html
businessType=gym, tone=* (default)                  → gym/clean-modern.html

businessType=salon, tone=luxury/editorial/minimal   → salon/editorial-luxury.html
businessType=salon, tone=* (default)                → salon/warm-boutique.html

businessType=coffee, tone=artisan/roaster/dark      → coffee/artisan-roaster.html
businessType=coffee, tone=* (default)               → coffee/cozy-neighborhood.html

businessType=boutique, tone=minimal/editorial       → boutique/minimal-editorial.html
businessType=boutique, tone=* (default)             → boutique/warm-lifestyle.html

businessType=service|cleaning|landscaping|etc.,
             tone=professional/corporate            → service/professional.html
businessType=service|*, tone=* (default)            → service/friendly-local.html

Fallback (unknown type)                             → service/professional.html
```

---

## Content Tokens

All tokens are replaced verbatim (no encoding). Missing tokens leave the placeholder visible.

| Token | Source field | Notes |
|---|---|---|
| `BUSINESS_NAME` | `questionnaire.businessName` | Used in `<title>`, nav, footer |
| `TAGLINE` | `questionnaire.uniqueDifferentiator` | Short phrase, one line max |
| `HEADLINE` | Claude-generated | Primary hero H1 |
| `SUBHEADLINE` | Claude-generated | 1–2 sentence support for headline |
| `ABOUT_STORY` | Claude-generated | 2–3 paragraphs, first-person tone |
| `META_DESCRIPTION` | Claude-generated | 150–160 chars for SEO |
| `PHONE` | `questionnaire.phone` | Linked via `tel:` |
| `EMAIL` | `questionnaire.email` | Linked via `mailto:` |
| `ADDRESS` | `questionnaire.address` | Plain text |
| `HOURS` | `questionnaire.hours` | e.g. "Mon–Fri 8am–6pm" |
| `SERVICE_AREA` | `questionnaire.serviceArea` | e.g. "Austin, TX" |
| `YEARS_IN_BUSINESS` | `questionnaire.yearsInBusiness` | Number |
| `OWNER_NAME` | `questionnaire.ownerName` | First + last |
| `LICENSE_NUMBER` | `questionnaire.licenseNumber` | e.g. "CA-123456" |
| `PACKAGE_TIER` | `questionnaire.packageTier` | e.g. "Growth", "Premium" |
| `SERVICE_1_DESC` | `questionnaire.servicesOffered[0]` | Short service name |
| `SERVICE_2_DESC` | `questionnaire.servicesOffered[1]` | Short service name |
| `SERVICE_3_DESC` | `questionnaire.servicesOffered[2]` | Short service name |
| `TESTIMONIAL_1` | `questionnaire.testimonials[0].quote` | The quote text |
| `TESTIMONIAL_1_NAME` | `questionnaire.testimonials[0].name` | Reviewer name |
| `TESTIMONIAL_1_CONTEXT` | `questionnaire.testimonials[0].context` | e.g. "Long-time customer" |
| `FAQ_1_Q` | Claude-generated | Frequently asked question |
| `FAQ_1_A` | Claude-generated | Answer to FAQ |
| `APP_URL_PLACEHOLDER` | Resolved at generation time | Link to client's booking/app URL |

### CSS Variable Tokens

These are replaced inside the `<style>` block to theme the entire page:

| Token | Source field |
|---|---|
| `PRIMARY_COLOR` | `questionnaire.primaryColor` (hex, e.g. `#2563eb`) |
| `SECONDARY_COLOR` | `questionnaire.secondaryColor` (hex) |

---

## Image Tokens

Resolved by `getBestImage(imageType, slot, primaryColor, undefined, subNiche, imageDirection)`.

| Token | `imageType` arg | Slot |
|---|---|---|
| `HERO_IMAGE` | `'hero'` | `'hero'` |
| `GALLERY_IMAGE_1` | `'gallery'` | `1` |
| `GALLERY_IMAGE_2` | `'gallery'` | `2` |
| `GALLERY_IMAGE_3` | `'gallery'` | `3` |
| `ABOUT_IMAGE` | `'about'` | `'about'` |
| `TEAM_IMAGE_1` | `'team'` | `1` |

---

## Package Tier Gating

Sections in templates are wrapped with HTML comment delimiters:

```html
<!-- IF_GROWTH_PLUS_START -->
  ... visible on Growth, Premium, Enterprise tiers ...
<!-- IF_GROWTH_PLUS_END -->

<!-- IF_PREMIUM_PLUS_START -->
  ... visible on Premium and Enterprise tiers only ...
<!-- IF_PREMIUM_PLUS_END -->

<!-- IF_ENTERPRISE_START -->
  ... visible on Enterprise tier only ...
<!-- IF_ENTERPRISE_END -->
```

`stripPackageSections(html, packageTier)` removes gated blocks the customer hasn't paid for.

Tier levels used internally:

| Package tier string | Level |
|---|---|
| `'starter'` | 0 |
| `'growth'` | 1 |
| `'premium'` | 2 |
| `'enterprise'` | 3 |

Blocks that get stripped:
- `IF_GROWTH_PLUS` stripped when level < 1 (starter only)
- `IF_PREMIUM_PLUS` stripped when level < 2 (starter + growth)
- `IF_ENTERPRISE` stripped when level < 3 (all except enterprise)

---

## Injection Process (templateEngine.ts)

1. **`selectTemplate(businessType, brandTone)`** → returns template path string
2. **Read template** from `server/templates/<path>`
3. **`stripPackageSections(html, packageTier)`** → removes gated sections
4. **`generateCopyForTemplate(brief)`** → Claude API call returns JSON copy tokens
5. **Replace all content tokens** → simple `html.replaceAll(TOKEN, value)` pass
6. **Replace image tokens** → each image token resolved via `getBestImage()`
7. **Return final HTML**

---

## Adding New Templates

1. Create the file under `server/templates/<type>/<name>.html`
2. Use the tokens listed above verbatim (case-sensitive, no surrounding spaces)
3. Wrap premium sections with the comment delimiters shown above
4. Add an entry to the selection table in `templateEngine.ts → selectTemplate()`
5. Update this README
