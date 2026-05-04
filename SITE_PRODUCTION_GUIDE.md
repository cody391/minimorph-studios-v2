# MiniMorph Studios — Site Production Guide

**Internal reference. Last updated: May 2026.**

This document covers the complete pipeline from first contact to a live customer site, including every tool in the stack, the ideal generation prompts, quality standards, and what each plan delivers.

---

## SECTION 1: FULL STACK OVERVIEW

Every tool we use and the exact job it does.

### Customer Acquisition

| Tool | Role | Env Var |
|------|------|---------|
| **Google Maps Places API** | Finds local businesses with missing or low-quality websites by searching for categories (e.g. "contractors near Columbus OH") and evaluating their `website` field and rating | `GOOGLE_MAPS_API_KEY` |
| **Apollo.io** | Enriches contact data — company size, revenue range, LinkedIn, decision-maker names | `APOLLO_API_KEY` |
| **Hunter.io** | Finds verified owner email addresses from domain names | `HUNTER_API_KEY` |
| **Yelp Fusion API** | Secondary business discovery, especially for restaurants, salons, and service businesses | `YELP_API_KEY` |
| **SERP API** | Google search results — finds businesses without websites or with weak SEO presence | `SERP_API_KEY` |
| **Elena AI Agent** | Anthropic Claude persona that warms up leads via personalized email and SMS sequences before a rep call | `ANTHROPIC_API_KEY` |
| **Twilio** | SMS delivery for outreach sequences, rep alerts, and customer notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Resend** | Email delivery for all outbound — nurture sequences, proposals, contracts, reports | `RESEND_API_KEY` |

### Onboarding

| Tool | Role | Env Var |
|------|------|---------|
| **Elena (Claude Sonnet)** | Runs the onboarding questionnaire as a guided conversational chat — collects everything the generator needs to build a perfect site | `ANTHROPIC_API_KEY` |
| **Stripe** | Processes initial payment, creates subscription, handles monthly recurring billing, powers rep commission payouts via Connect | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` |
| **Customer Portal** | Client-facing dashboard at `/portal` — view build progress, give feedback, approve launch, manage subscription | (internal) |

### Site Generation

| Tool | Role | Env Var |
|------|------|---------|
| **Anthropic Claude Sonnet** | Generates complete HTML/CSS/JS for every page based on questionnaire data and brand brief | `ANTHROPIC_API_KEY` |
| **Replicate + Flux 1.1 Pro** | Generates custom AI photography for hero sections, galleries, and backgrounds | `REPLICATE_API_KEY` |
| **Gemini** | Google's image and text model — secondary image generation and product mockups | `GEMINI_API_KEY` |
| **Unsplash API** | Real photography fallback when AI image generation isn't ideal | `UNSPLASH_ACCESS_KEY` |
| **Sharp** | Server-side image optimization — converts to WebP/AVIF, generates responsive sizes, strips metadata | (npm package) |
| **Cloudflare R2** | Stores all generated and uploaded images/assets for every customer site | `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY` |

### Deployment

| Tool | Role | Env Var |
|------|------|---------|
| **Cloudflare Pages** | Hosts every generated customer site — global CDN, free SSL, instant cache invalidation on redeploy | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| **Cloudflare DNS** | Manages DNS records for all customer subdomains under `minimorphstudios.net` and eventually customer-owned domains | `CLOUDFLARE_API_TOKEN` |
| **Namecheap** | Domain registration for customers who need a new domain as part of their plan | `NAMECHEAP_API_KEY`, `NAMECHEAP_API_USER` |

### Ongoing Monthly Care

| Tool | Role |
|------|------|
| **Claude Sonnet** | Generates monthly competitive analysis and improvement suggestions per customer |
| **Resend** | Delivers monthly reports, invoices, and any triggered notifications |
| **Twilio** | SMS notifications to customers for important events (site live, report ready, etc.) |
| **Stripe** | Processes recurring monthly billing, generates invoice receipts |
| **Customer Portal** | Handles change requests, support messages, and plan upgrades |

---

## SECTION 2: THE IDEAL SITE GENERATION PROMPT

This is the production system prompt that lives in `server/services/siteGenerator.ts`. Use this as the reference for what every generated site must achieve.

### System Prompt

```
You are an expert web designer and developer who builds world-class websites for small businesses.
Your sites consistently look better than 90% of small business websites on the internet.
You write clean, modern HTML5, CSS3, and vanilla JavaScript — no frameworks, no external dependencies.

== TECHNICAL REQUIREMENTS ==

CSS ARCHITECTURE:
- Define ALL colors as CSS custom properties at :root:
    --color-bg, --color-surface, --color-primary, --color-accent,
    --color-text, --color-muted, --color-border
- Smooth transitions: transition: all 0.2s ease on every interactive element
- Card shadows: box-shadow: 0 4px 24px rgba(0,0,0,0.12)
- Border radius: 12-16px on all cards and components
- Section padding: 80px-120px vertical
- Max content width: 1200px centered with margin: 0 auto
- Full-viewport hero: min-height: 100vh
- Sticky nav: position: sticky; top: 0; backdrop-filter: blur(10px); z-index: 100
- Mobile breakpoint: @media (max-width: 768px) — full responsive treatment
- Scroll animations: use Intersection Observer to fade-in sections on scroll

TYPOGRAPHY:
- Display headlines: Georgia or 'Playfair Display', serif — 64-72px, font-weight: 700
- H1: serif — 48px, font-weight: 700
- H2: serif — 36px, font-weight: 600
- H3: sans-serif — 24px, font-weight: 500
- Body: sans-serif — 16px, line-height: 1.7
- Small: 14px, line-height: 1.5
- ALWAYS mix serif headlines with sans-serif body text
- Load Google Fonts via a single @import in the CSS

IMAGE HANDLING:
For each image slot, use this exact pattern:
<img
  src="[IMAGE_URL_OR_GRADIENT_PLACEHOLDER]"
  alt="[SPECIFIC DESCRIPTIVE ALT TEXT FOR THIS BUSINESS]"
  loading="lazy"
  width="1200"
  height="600"
  style="object-fit:cover;width:100%;height:100%"
  onerror="this.style.background='[brand gradient]'"
/>
Where no real image URL is available, use a CSS gradient that matches the brand palette.
Add a comment: <!-- REPLACE WITH: [description of ideal photo for this slot] -->

== REQUIRED SECTIONS — EVERY SITE MUST HAVE ALL OF THESE ==

1. STICKY NAVIGATION
   - Business name/logo (left) — use actual business name as text if no logo
   - Nav links to all site pages (center)
   - Primary CTA button (right) — colored, hover state required
   - backdrop-filter: blur(10px) when page is scrolled
   - Mobile: hamburger menu with smooth toggle animation

2. HERO (full viewport, min-height: 100vh)
   - Powerful 2-3 line headline — benefit-focused, specific to this business
   - 1-2 sentence subheadline
   - Primary CTA button (large, colored, hover state)
   - Optional secondary CTA (e.g. "See Our Work")
   - Hero image or gradient background
   - Subtle scroll-down indicator

3. SOCIAL PROOF BAR
   - Star rating with review count (use real numbers from questionnaire if provided)
   - Years in business
   - One key metric (customers served, projects completed, etc.)
   - 2-3 trust badges (licensed, insured, certified, BBB, etc.)

4. SERVICES / PRODUCTS
   - Grid of 3-6 cards
   - Each: icon or accent shape, title, 2-3 sentence description, price if provided
   - CTA per card

5. ABOUT / STORY
   - Origin story written in first or second person — specific, not generic
   - What makes this business different from every competitor
   - Owner photo placeholder with <!-- REPLACE WITH: professional headshot -->

6. TESTIMONIALS
   - 3-5 testimonials with star ratings
   - Customer name and context (e.g. "Mike D., homeowner in Columbus")
   - Specific results and numbers whenever provided

7. CALL TO ACTION
   - Strong headline (e.g. "Ready to Get Started?")
   - 1-2 sentence reinforcement
   - Large primary CTA button
   - Secondary option (phone number, email)

8. FOOTER
   - Business name and tagline
   - All navigation links
   - Phone, email, address
   - Social media links (styled, even if placeholder hrefs)
   - Copyright line
   - "Powered by MiniMorph Studios" in 12px muted text

== ADD-ON SECTIONS (include when questionnaire specifies) ==

BOOKING WIDGET:
<div style="background:#fff;border:2px solid var(--color-primary);border-radius:12px;padding:32px;max-width:420px;margin:0 auto">
  <h3 style="margin:0 0 20px;font-family:serif">Book Your Appointment</h3>
  <select style="width:100%;padding:10px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
    <option>Select Service</option>
    [real service options for this business]
  </select>
  <input type="date" style="width:100%;padding:10px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <input type="text" placeholder="Your name" style="width:100%;padding:10px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <input type="tel" placeholder="Phone number" style="width:100%;padding:10px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <button style="width:100%;padding:14px;background:var(--color-primary);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">Confirm Booking</button>
</div>

LEAD CAPTURE FORM:
<form style="background:var(--color-surface);border-radius:16px;padding:40px;max-width:500px;margin:0 auto">
  <h3 style="margin:0 0 8px;font-family:serif">[Specific CTA headline for this business]</h3>
  <p style="color:var(--color-muted);margin-bottom:24px;font-size:14px">⚡ We respond within 5 minutes during business hours</p>
  <input type="text" placeholder="Your name" style="width:100%;padding:12px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <input type="email" placeholder="Email address" style="width:100%;padding:12px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <input type="tel" placeholder="Phone number" style="width:100%;padding:12px 14px;margin-bottom:12px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
  <select style="width:100%;padding:12px 14px;margin-bottom:20px;border-radius:8px;border:1px solid var(--color-border);font-size:15px">
    <option>[Relevant dropdown for this business — service type, project type, etc.]</option>
  </select>
  <button type="submit" style="width:100%;padding:14px;background:var(--color-primary);color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">[CTA text]</button>
</form>

AI CHAT WIDGET (fixed bottom-right):
<div style="position:fixed;bottom:24px;right:24px;z-index:1000">
  <div style="background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:320px;overflow:hidden">
    <div style="background:var(--color-primary);padding:16px;color:#fff;font-weight:600;display:flex;align-items:center;gap:10px">
      <span>💬</span> Chat with [Business Name]
    </div>
    <div style="padding:16px">
      <div style="background:#f0f0f0;border-radius:8px;padding:12px;margin-bottom:8px;font-size:14px">
        Hi! I'm [Business Name]'s assistant. [Specific greeting for this business]. How can I help you today?
      </div>
      <input type="text" placeholder="Type your question..." style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;font-size:14px;margin-top:8px">
    </div>
  </div>
</div>

GOOGLE REVIEWS SECTION:
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">
  [4-5 review cards, each containing:
   - ★★★★★ in brand accent color
   - Italic review text specific to this business type and services
   - Customer name (realistic, matching local area)
   - Context: "via Google Reviews · [Month Year]"]
</div>

INSTAGRAM FEED:
<div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:600px;margin:0 auto">
    [9 square divs, aspect-ratio:1, background colors from brand palette, with :hover overlay at 50% opacity]
  </div>
  <p style="text-align:center;margin-top:12px;font-size:14px;color:var(--color-muted)">
    Follow us @[handle] · [X] followers
  </p>
</div>

EMAIL NEWSLETTER:
<div style="background:linear-gradient(135deg,var(--color-surface),var(--color-bg));padding:60px 40px;text-align:center;border-radius:16px">
  <h3 style="font-family:serif;margin:0 0 12px">[Newsletter value prop headline]</h3>
  <p style="color:var(--color-muted);max-width:400px;margin:0 auto 24px">[Specific value — what do subscribers get?]</p>
  <div style="display:flex;gap:12px;max-width:400px;margin:0 auto">
    <input placeholder="Your email address" style="flex:1;padding:14px;border-radius:8px;border:1px solid var(--color-border);font-size:16px">
    <button style="padding:14px 24px;background:var(--color-primary);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;white-space:nowrap">Subscribe</button>
  </div>
</div>

SEO BLOG SECTION:
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px">
  [3 article cards, each: gradient thumbnail, title (SEO-targeted for this industry), 2-sentence excerpt, "Read More →" link]
</div>

ECOMMERCE PRODUCT GRID:
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px">
  [Product cards with: image placeholder, product name, description, price, "Add to Cart" button in brand primary color]
</div>

== CONTENT RULES ==
- Zero generic placeholder text — every word is specific to THIS business
- Every testimonial mentions a specific result with a number
- Service descriptions explain the VALUE, not just the feature
- Headlines use action/benefit framing: "Get", "Build", "Stop", "Start"
- CTAs use first-person verbs: "Get My Free Quote", "Start My Trial", "Book My Appointment"
- Phone numbers, emails, and addresses are clickable (tel:, mailto: links)

== OUTPUT FORMAT ==
Output ONLY a valid JSON object where each key is a page name and each value is the complete HTML.
No markdown fences. No explanation. No wrapper key.
{ "index": "<!DOCTYPE html>...", "about": "<!DOCTYPE html>...", ... }
```

### Image Prompts by Business Type

These go to Replicate (Flux 1.1 Pro) for hero and gallery images.

**Settings for all Replicate calls:**
```
model: black-forest-labs/flux-1.1-pro
width: 1440
height: 960
num_inference_steps: 28
guidance_scale: 3.5
output_format: webp
output_quality: 90
```

**Prompt formula:** `[Subject], [Style], [Lighting], [Mood], professional photography, high resolution, no text, no watermarks`

| Business Type | Hero Prompt |
|---------------|-------------|
| Restaurant | "Upscale restaurant dining room, farm-to-table aesthetic, warm Edison bulb lighting, wooden tables with linen napkins, intimate dinner atmosphere, food photography style, high resolution" |
| Contractor | "Professional construction workers on modern home project, blue sky background, safety equipment visible, quality craftsmanship, natural daylight, architectural photography, high resolution" |
| Gym / Fitness | "Modern fitness studio with natural light, athletes in motion, premium equipment, motivational atmosphere, action photography, dramatic shadows, high resolution" |
| Salon / Spa | "Luxury hair salon interior, professional styling stations, warm ambient lighting, upscale aesthetic, clean and modern, lifestyle photography, high resolution" |
| Boutique Retail | "Independent clothing boutique, curated product displays, natural window light, minimalist wood shelving, editorial fashion photography, high resolution" |
| Coffee / Cafe | "Specialty coffee roastery, expert barista at work, steam rising from espresso machine, warm amber tones, artisan craftsmanship, lifestyle photography, high resolution" |
| Medical / Dental | "Modern medical office, clean white and blue tones, professional staff, welcoming atmosphere, natural light, healthcare photography, high resolution" |
| Real Estate | "Luxury home exterior, golden hour lighting, perfect landscaping, professional real estate photography, wide angle, high resolution" |
| Law Firm | "Professional law office, dark wood and leather, dramatic window light, serious and trustworthy atmosphere, corporate photography, high resolution" |

---

## SECTION 3: STEP-BY-STEP BUILD PROCESS

### Step 1 — Customer Signs Up

**Trigger:** Stripe checkout completed for a package.

**What happens automatically:**
- Stripe webhook fires → order created in DB
- `onboardingRouter.create` called → `onboardingProjects` row created with `stage: "questionnaire"`
- Welcome email sent via Resend
- Admin notified
- Elena activated for onboarding chat

**DB state after:** `onboardingProjects.stage = "questionnaire"`, `generationStatus = null`

---

### Step 2 — Elena Onboarding Chat (10–30 min)

Elena conducts a structured conversational questionnaire. She must collect everything in the schema before triggering generation.

**Elena collects via chat:**

```
Universal (all business types):
  websiteType          — service_business | restaurant | contractor | ecommerce | other
  brandColors          — color preferences or hex codes
  brandTone            — professional | friendly | bold | elegant | playful
  targetAudience       — who is this for, what pain do they have
  contentPreference    — we_write | customer_provides | mix
  inspirationSites     — URLs + what they like + what they dislike
  competitorSites      — URLs + what to beat + features wished for
  mustHaveFeatures     — array of required features
  specialRequests      — anything else

Service Business extra:
  serviceArea, hasBookingSystem, servicesOffered, licensedOrCertified, licenseDetails

Restaurant extra:
  cuisineType, hasPhysicalLocation, needsOnlineMenu, needsReservations, operatingHours

Contractor extra:
  tradeType, serviceArea, needsQuoteForm, needsBeforeAfterGallery, emergencyService

Ecommerce extra:
  productCount, productCategories, needsShipping, existingPlatform, needsSubscriptions
```

**Elena's trigger to start build:**
When questionnaire is complete, Elena calls `trpc.onboarding.saveQuestionnaire` with the full data object.

---

### Step 3 — Site Generation (Automated)

**Trigger:** `saveQuestionnaire` or `submitQuestionnaire` mutation → fires `generateSiteForProject(projectId)` as a background async call.

**What `generateSiteForProject` does:**

1. Loads project and questionnaire from DB
2. Sets `generationStatus = "generating"`, `stage = "design"`
3. Sends "build started" email to customer
4. Notifies admin
5. Determines pages from `websiteType`:
   - `restaurant` → index, menu, about, reservations, contact
   - `contractor` → index, services, about, gallery, quote, contact
   - `ecommerce` → index, products, about, contact
   - `service_business` → index, about, services, contact
6. Loads uploaded assets from DB
7. Builds system prompt + user prompt with full questionnaire data
8. Calls `invokeLLM` (Claude Sonnet, `maxTokens: 16000`)
9. Parses JSON response → `Record<string, htmlString>`
10. Injects logo as base64 if asset exists
11. Saves `generatedSiteHtml` (JSON string) to DB
12. Sets `stage = "review"`, `generationStatus = "complete"`
13. Sends "preview ready" email to customer
14. Notifies admin

> **Current limitation:** Image generation (Replicate, Unsplash) is not yet wired into this flow. The generator currently uses CSS gradient placeholders with `<!-- REPLACE WITH: ... -->` comments. See Section 4 for how to implement it.

---

### Step 4 — Preview & Revision

**Customer flow:**
- Email links them to `/portal`
- Portal shows preview of generated pages
- Customer can request changes via `onboarding.submitFeedback`
- Changes trigger a new `generateSiteForProject` call
- Up to 3 revision rounds included (tracked as `revisionsRemaining`)

**Admin flow:**
- Admin sees "Site Preview Ready for QA" notification
- Can view raw HTML in admin panel
- Can manually trigger regeneration

---

### Step 5 — Approval & Launch

**Trigger:** Customer clicks "Approve & Launch" in portal → `onboarding.approveLaunch` mutation.

**What happens:**
1. Admin receives notification with domain info and action required
2. `deployApprovedSite(projectId)` fires automatically (background)
3. `cloudflareDeployment.createPagesProject` — creates CF Pages project
4. `cloudflareDeployment.deployToPages` — uploads HTML via v2 manifest API:
   - Computes SHA-256 hash for each file
   - POSTs manifest JSON
   - Uploads only files CF doesn't already have cached
   - Calls `/finish` endpoint
5. `cloudflareDeployment.addCustomDomain` — connects subdomain
6. DNS propagates (Cloudflare: ~minutes; customer domain: up to 24h)
7. SSL certificate provisioned automatically by Cloudflare
8. Admin marks site live in admin panel
9. Customer notified with live URL

**Live URL format:** `https://[businessslug].minimorphstudios.net`

---

### Step 6 — Ongoing Monthly Care

On each billing cycle:
- Stripe processes recurring payment
- Rep commission calculated and paid via Stripe Connect
- AI generates competitive analysis report for this customer's industry
- Report emailed via Resend
- Customer can log into portal for change requests

---

## SECTION 4: IMAGE GENERATION BEST PRACTICES

### Current State vs. Ideal State

**Current:** Generator uses CSS gradient placeholders + `<!-- REPLACE WITH: ... -->` HTML comments. No actual image generation is wired into `siteGenerator.ts`.

**Target pipeline (to be built):**

```
For each image slot:
  1. Check project assets (customer uploads from R2/S3) → use if available
  2. Call Replicate Flux 1.1 Pro with business-specific prompt → upload result to R2
  3. Fallback: call Unsplash API with industry search term → embed URL
  4. Fallback: call Gemini image generation
  5. Last resort: CSS gradient matching brand palette
```

### Replicate Implementation

```typescript
// POST https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions
const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ENV.replicateApiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: {
      prompt: buildImagePrompt(businessType, slot, questionnaire),
      width: 1440,
      height: 960,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      output_format: "webp",
      output_quality: 90,
    }
  })
});
// Poll result.urls.get until status === "succeeded"
// Then download output[0] and upload to R2
```

### Unsplash Fallback

```typescript
const term = UNSPLASH_TERMS[businessType] || "small business";
const res = await fetch(
  `https://api.unsplash.com/photos/random?query=${term}&orientation=landscape`,
  { headers: { "Authorization": `Client-ID ${ENV.unsplashAccessKey}` } }
);
const photo = await res.json();
return photo.urls.regular; // 1080px width
```

**Search terms by business type:**
- Restaurant → `"restaurant interior dining"`
- Contractor → `"construction worker building"`
- Gym → `"gym fitness workout"`
- Salon → `"hair salon beauty"`
- Boutique → `"clothing boutique retail"`
- Coffee → `"coffee shop barista"`

### Image Storage in R2

All generated/fetched images should be stored in Cloudflare R2 under:
```
r2://[CLOUDFLARE_R2_BUCKET]/sites/[projectId]/images/[slot]-[hash].webp
```
Then served via `IMAGE_ASSET_CDN_BASE_URL/sites/[projectId]/images/[filename]`.

### Sharp Optimization

After any image is fetched or generated:
```typescript
import sharp from "sharp";
const optimized = await sharp(inputBuffer)
  .webp({ quality: 85 })
  .resize(1440, 960, { fit: "cover" })
  .toBuffer();
```

---

## SECTION 5: QUALITY CHECKLIST

Before any site goes live, every item in this list must be verified.

### Design
- [ ] Mobile responsive at 375px, 768px, and 1440px viewports
- [ ] All Google Fonts loading (check Network tab)
- [ ] Brand palette consistent across all pages
- [ ] All interactive elements have hover states
- [ ] No broken image placeholders (all show gradient fallback or real image)
- [ ] Consistent spacing — section padding 80-120px
- [ ] Navigation sticky and blur working on scroll

### Content
- [ ] Zero placeholder text anywhere on the site
- [ ] Business name correct throughout (no typos)
- [ ] All service descriptions are complete sentences
- [ ] Phone number matches (and has `tel:` link)
- [ ] Email address has `mailto:` link
- [ ] Address correct (check against questionnaire)
- [ ] Testimonials are specific and include results/numbers
- [ ] CTAs use action verbs, not passive phrasing

### Technical
- [ ] All pages link to each other correctly (no 404s)
- [ ] Each page has unique `<title>` and `<meta name="description">`
- [ ] All images have descriptive `alt` attributes
- [ ] Schema markup present on homepage (LocalBusiness type)
- [ ] SSL certificate active (https://)
- [ ] Page load under 3 seconds on mobile (test with Lighthouse)
- [ ] No console errors in browser DevTools

### Add-Ons
- [ ] Lead capture form fields are correct for this business type
- [ ] Phone number is clickable on mobile
- [ ] Booking form has real service options from questionnaire
- [ ] Social links open correctly (or gracefully hidden if not provided)
- [ ] AI chat widget appears and is readable on mobile
- [ ] Google Maps embed loading (if included)
- [ ] `<!-- REPLACE WITH: ... -->` comments are absent from delivered HTML

---

## SECTION 6: PRICING — WHAT EACH PLAN DELIVERS

### Starter — $195/mo

- **Pages:** Up to 5 (index, services, about, contact + 1 custom)
- **AI images:** 3 Replicate-generated images + Unsplash fills
- **Add-ons included:** Contact form, Google Maps embed, social links, basic SEO meta tags
- **Revisions:** 3 rounds
- **Domain:** Customer purchases (~$15/yr); we configure DNS
- **Build time:** 7–10 business days
- **Best for:** Contractors, solo service businesses, local shops with basic needs

### Growth — $295/mo

- **Pages:** Up to 10
- **AI images:** 8 Replicate-generated + Unsplash fills
- **Add-ons included:** Everything in Starter + blog section (3 posts), Google Analytics setup, lead capture form with SMS alert badge, monthly AI performance recommendations
- **Revisions:** 3 rounds
- **Domain:** Free first year ($15 value); we register and configure
- **Build time:** 5–7 business days
- **Best for:** Restaurants, growing service businesses, gyms, salons ready to invest in digital

### Pro — $395/mo

- **Pages:** Up to 20
- **AI images:** 15 Replicate-generated + Unsplash fills
- **Add-ons included:** Everything in Growth + advanced SEO pages, Google Reviews widget, booking integration, SMS lead alerts, Instagram feed section
- **Revisions:** 3 rounds
- **Domain:** Free first year + annual renewal covered
- **Build time:** 3–5 business days
- **Best for:** Established businesses with multiple service lines, boutiques, professional services with strong referral needs

### Enterprise — $495/mo

- **Pages:** Unlimited
- **AI images:** Unlimited
- **Add-ons included:** Everything in Pro + full ecommerce (product pages, cart, checkout), subscription management, multi-location support, custom portal integrations, priority build queue
- **Revisions:** Unlimited
- **Domain:** Free + fully managed (renewals, DNS changes, SSL)
- **Build time:** Custom timeline (typically 3–5 days for standard builds)
- **Best for:** Coffee roasters with online stores, service businesses with complex booking needs, any business needing ecommerce or subscriptions

---

## APPENDIX A: ENV VAR REFERENCE

All environment variables the system reads, grouped by function.

```
# CORE
APP_URL                    — Public URL (https://minimorphstudios.net)
DATABASE_URL               — MySQL connection string
JWT_SECRET                 — Session signing secret
ADMIN_EMAIL                — Admin login email
ADMIN_PASSWORD             — Admin login password
SCHEDULER_SECRET           — Cron job authentication

# AI
ANTHROPIC_API_KEY          — Claude Sonnet (site gen, Elena, reports)
REPLICATE_API_KEY          — Flux 1.1 Pro image generation
GEMINI_API_KEY             — Google Gemini fallback

# IMAGES
UNSPLASH_ACCESS_KEY        — Photography fallback
IMAGE_ASSET_CDN_BASE_URL   — Public CDN base for R2 assets

# CLOUDFLARE
CLOUDFLARE_API_TOKEN       — Pages + DNS management
CLOUDFLARE_ACCOUNT_ID      — Account identifier
MINIMORPH_SITES_DOMAIN     — minimorphstudios.net
CLOUDFLARE_R2_BUCKET       — Asset storage bucket name
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY

# GOOGLE
GOOGLE_MAPS_API_KEY        — Lead discovery + Maps embeds

# STRIPE
STRIPE_SECRET_KEY          — (or CUSTOM_STRIPE_SECRET_KEY for Connect)
STRIPE_WEBHOOK_SECRET      — Webhook signature verification
STRIPE_PRICE_STARTER       — price_xxx for $195/mo
STRIPE_PRICE_GROWTH        — price_xxx for $295/mo
STRIPE_PRICE_PREMIUM       — price_xxx for $395/mo
STRIPE_PRICE_ENTERPRISE    — price_xxx for $495/mo

# EMAIL
RESEND_API_KEY             — All outbound email
RESEND_FROM_EMAIL          — hello@minimorphstudios.net

# TWILIO
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_API_KEY_SID         — Voice SDK auth
TWILIO_API_KEY_SECRET      — Voice SDK auth
TWILIO_TWIML_APP_SID       — Browser phone calls

# LEAD GEN
APOLLO_API_KEY             — Contact enrichment
HUNTER_API_KEY             — Email discovery
YELP_API_KEY               — Business discovery
SERP_API_KEY               — Search results

# NOTIFICATIONS
VAPID_PUBLIC_KEY           — Web push
VAPID_PRIVATE_KEY          — Web push
OWNER_PHONE_NUMBER         — Admin SMS alerts

# DOMAIN REGISTRATION
NAMECHEAP_API_KEY
NAMECHEAP_API_USER
NAMECHEAP_CLIENT_IP
```

---

## APPENDIX B: FILE MAP

Key files for the site production pipeline:

```
server/
  services/
    siteGenerator.ts       — Core generation logic (generateSiteForProject)
    siteDeployment.ts      — Cloudflare Pages deploy (deployApprovedSite)
    cloudflareDeployment.ts — CF API calls (createPagesProject, deployToPages, addCustomDomain)
    customerEmails.ts      — Transactional emails (build started, preview ready, etc.)
  routers.ts               — onboardingRouter (create, submitQuestionnaire, approveLaunch, etc.)
  onboardingDataRouter.ts  — DB queries for onboarding projects
  _core/
    env.ts                 — All environment variable bindings
    llm.ts                 — invokeLLM wrapper (Claude Sonnet)
  scripts/
    generateShowroomSites.ts — One-time script for showroom demo sites

client/src/
  data/showroom.ts         — Showroom site data (with liveUrl for each)
  components/sections/Portfolio.tsx — Showroom display component
  pages/ShowroomSite.tsx   — Individual showroom site page
```
