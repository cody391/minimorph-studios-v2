# MiniMorph Fulfillment Stress Test

**Date:** April 24, 2026
**Scope:** 5 complete website builds, onboarding depth, AI agent preparedness, integration options, upsell strategy
**Author:** Manus AI

---

## 1. Executive Summary

This report stress-tests the MiniMorph Studios platform against five fundamentally different customer website builds. Each build is walked through the complete fulfillment pipeline — from lead qualification through package recommendation, onboarding questionnaire, asset collection, design direction, integration needs, website build, revisions, launch, monthly support, reporting, upsells, and renewal.

The five test businesses are:

| # | Business | Industry | Location | Complexity | Key Challenge |
|---|----------|----------|----------|------------|---------------|
| 1 | Lakeshore Auto Detailing | Mobile Detailing | Muskegon, MI | Medium | Booking/quote flow, premium visual style |
| 2 | Q's Landscaping | Lawn Care / Snow | Muskegon, MI | Medium | Seasonal campaigns, service area pages |
| 3 | G&L Chillidog Refreshers | Fast Casual Food | West Michigan | Medium | Menu display, event/catering inquiries |
| 4 | Shoreline Concrete & Coatings | Contractor / Home Services | West Michigan | Medium-High | Project gallery, estimate forms, trust signals |
| 5 | Festival Hammock Supply Co. | Ecommerce | U.S.-wide | High | Product catalog, checkout, inventory, shipping |

**Current MiniMorph packages** (from `server/stripe-products.ts`):

| Package | Monthly | Pages | Key Features |
|---------|---------|-------|--------------|
| Starter | $149/mo | 5-page | Basic SEO, contact form, monthly report, AI support |
| Growth | $299/mo | 10-page | Full SEO, analytics, quarterly strategy, priority updates |
| Premium | $499/mo | 20+ page | Advanced SEO, weekly reports, dedicated AI manager, unlimited updates, e-commerce integration |

**Current onboarding questionnaire** (from `client/src/pages/Onboarding.tsx` → `QuestionnaireStep`):

The current questionnaire collects: business name, industry, target audience, brand colors (primary/secondary), preferred style (modern/classic/bold/minimal/playful), must-have pages (multi-select), special features/integrations (free text), and additional notes. This is a single universal form with no conditional logic, no industry-specific questions, and no ecommerce-specific fields.

**Current onboarding stages** (from `drizzle/schema.ts` → `onboarding_projects.stage`):

`intake` → `questionnaire` → `assets_upload` → `design` → `review` → `revisions` → `final_approval` → `launch` → `complete`

**Current widget catalog** (from `drizzle/schema.ts` → `widgetCatalog`):

The widget catalog is admin-seeded at runtime. Categories: `ai_agent`, `widget`, `service`, `integration`. Each has slug, name, description, monthly price, setup fee, features array, and active flag.

**Key finding:** MiniMorph can sell Builds 1–4 today under existing packages with onboarding questionnaire improvements. Build 5 (ecommerce) requires a dedicated ecommerce package or custom quote workflow. The onboarding questionnaire needs industry-conditional logic, and the AI agent needs a structured knowledge base before it can safely answer customer questions about integrations, scope, and policies.

---

## 2. Build Profile 1 — Lakeshore Auto Detailing

### 2.1 Business Summary

| Field | Detail |
|-------|--------|
| **Business Name** | Lakeshore Auto Detailing |
| **Industry** | Auto Detailing / Mobile Detailing |
| **Location** | Muskegon, Michigan |
| **Target Customer** | Vehicle owners (cars, trucks, boats, RVs) in the Muskegon / West Michigan area who want professional detailing without driving to a shop |
| **Primary Business Goal** | Generate quote requests and online bookings |
| **Secondary Goals** | Build brand credibility, showcase before/after work, collect Google reviews, establish premium positioning |
| **Conversion Action** | "Get a Quote" form submission or "Book Now" scheduling action |
| **Likely Objections** | "I can wash my car myself," "Mobile detailing is too expensive," "I don't trust someone coming to my house" |
| **Urgency Level** | Medium — seasonal peaks in spring/summer, but year-round demand for interior detailing and ceramic coatings |

### 2.2 Recommended MiniMorph Package

| Field | Assessment |
|-------|------------|
| **Current Package Fit** | **Growth ($299/mo)** — needs more than 5 pages (services, gallery, about, contact, booking, FAQ, service area), and benefits from full SEO and analytics |
| **Whether Current Pricing is Enough** | Yes. A 7–8 page service site with a quote form, gallery, and basic SEO is well within the Growth scope. No custom development required. |
| **Classification** | Standard package sale — Growth tier |
| **Reason** | The site needs ~8 pages, a multi-step quote form, before/after gallery, Google reviews integration, and local SEO. All achievable within Growth. |
| **Risk Level** | Low |
| **Estimated Workload** | 15–20 hours initial build. Standard for Growth. |
| **Estimated Revision Risk** | Low-Medium — owner will likely want photo updates and seasonal service changes. 1–2 revision rounds expected. |
| **Estimated Monthly Support Burden** | Low — occasional photo swaps, seasonal service updates, maybe 1–2 hours/month |

### 2.3 Required Onboarding Questions

**A. Required Questions**

1. What is your full business name as you want it displayed on the website?
2. Do you have a registered legal business name that differs from the display name?
3. What is your primary service area? (cities, zip codes, or mile radius)
4. What services do you offer? (list all — e.g., exterior wash, interior detail, ceramic coating, paint correction, boat detailing, RV detailing)
5. Do you want pricing displayed on the website? If yes, provide your pricing structure. If no, what should the CTA say instead? (e.g., "Get a Free Quote")
6. Do you have a logo? (upload or describe)
7. Do you have brand colors? If not, what colors represent your brand?
8. Do you have professional photos of your work? How many? (before/after pairs are ideal)
9. Do you own a domain name? If yes, what is it? If no, do you want us to register one?
10. What is your preferred contact method for leads? (phone, email, text, form submission)
11. Do you have a Google Business Profile? If yes, provide the link.
12. What social media accounts do you have? (Instagram, Facebook, TikTok, etc.)
13. What is your preferred website style? (premium/dark/luxury vs. clean/bright/friendly)
14. What is the single most important action you want visitors to take?

**B. Optional Questions**

15. Do you have any competitor websites you admire or want to differentiate from?
16. Do you have existing reviews/testimonials you want featured?
17. Do you have a booking/scheduling system already? (e.g., Calendly, Square Appointments, custom)
18. Do you want a blog or news section?
19. Do you have any certifications or affiliations to display? (IDA certified, ceramic coating brands, etc.)
20. Do you want SMS notifications when a new lead comes in?

**C. Conditional Questions (Auto Detailing Specific)**

21. Do you offer mobile detailing, shop-based detailing, or both?
22. Do you service boats, RVs, or commercial vehicles? (affects service pages)
23. Do you offer ceramic coating or paint protection film? (premium service — may need dedicated landing page)
24. Do you offer fleet/commercial services? (may need separate pricing page)
25. Do you want seasonal promotions featured? (spring detail specials, winter interior packages)

**D. Red-Flag Questions (Trigger Admin Review)**

26. "Can you build me an online store to sell detailing products?" → Ecommerce scope — needs custom quote
27. "I need a booking system that takes payments upfront" → Integration complexity — needs assessment
28. "I want to rank #1 on Google for 'auto detailing'" → SEO guarantee language risk — needs policy guardrail
29. "Can you migrate my existing website from Wix/Squarespace?" → Migration scope — needs assessment
30. "I need the site in Spanish and English" → Multilingual scope — needs custom quote

### 2.4 AI Agent Preparation

**Business Facts AI Must Collect:**
- Exact service list with categories (exterior, interior, specialty)
- Service area boundaries
- Pricing display preference (show prices vs. quote-only)
- Existing assets (logo, photos, domain)
- Preferred contact method for leads
- Whether they have a booking system already

**Tone AI Should Use:**
Professional, confident, premium. Mirror the "luxury automotive" positioning. Avoid casual/playful language. Use terms like "detail," "restore," "protect," "premium finish."

**Questions AI Should Ask if Info is Missing:**
- "Do you want pricing visible on the site, or would you prefer a 'Get a Quote' approach?"
- "Do you have before/after photos of your work? These are the #1 trust builder for detailing sites."
- "Do you currently use any booking or scheduling tool?"

**What AI Should Never Assume:**
- Never assume the customer wants to sell products online
- Never assume they have professional photography
- Never promise specific Google ranking results
- Never assume they want to display pricing
- Never assume their service area without asking

**What Should Trigger Human/Admin Review:**
- Customer asks for ecommerce/product sales
- Customer asks for payment processing integration beyond simple forms
- Customer asks for multilingual site
- Customer asks for migration from another platform
- Customer mentions more than 15 pages needed

**Upsells AI Should Recommend:**
- Google Analytics setup ($49/mo or $99 one-time)
- Google Business Profile optimization ($149 one-time)
- Review request automation widget ($29/mo)
- SMS lead alerts ($19/mo)
- Before/after gallery enhancement ($99 one-time)

**Integrations AI Should Suggest:**
- Google Maps embed (included)
- Contact/quote form (included)
- Google Business Profile link (included)
- Review widget (upsell)
- Booking tool integration (upsell — Calendly, Square Appointments)

**How AI Should Explain the Process:**
"Here's how it works: First, you'll answer a few questions about your business and upload your logo and photos. Then our team designs your site — you'll see a preview within [X] business days. You get to review it and request changes. Once you approve, we launch it on your domain. After launch, we handle monthly updates, reports, and support."

**Legal/Claim Boundaries:**
- Never guarantee Google rankings or specific lead volume
- Never promise "unlimited" anything without qualifying
- Never make claims about competitor comparison
- Always clarify that the customer owns their content but MiniMorph hosts the site during the contract

### 2.5 Design Direction

| Element | Direction |
|---------|-----------|
| **Visual Style** | Premium dark mode. High-contrast. Automotive luxury. Think Tesla meets high-end car wash. |
| **Color Palette** | Primary: deep charcoal (#1A1A2E) or near-black. Accent: electric blue (#00D4FF) or gold (#C9A84C). Text: crisp white. Subtle gradients on CTAs. |
| **Typography** | Sans-serif display font for headings (e.g., Montserrat Bold, Bebas Neue). Clean sans-serif body (Inter, DM Sans). All-caps for section labels. |
| **Layout Style** | Full-width hero with dramatic car photo. Alternating dark/light sections. Card-based service grid. Sticky header with transparent-to-solid scroll effect. |
| **Imagery Style** | High-quality close-up shots of glossy paint, ceramic coating beading water, interior leather. Dark backgrounds. Studio-quality or dramatic outdoor lighting. |
| **CTA Style** | Bold, high-contrast buttons. "Get Your Free Quote" in accent color on dark background. Floating mobile CTA bar. |
| **Animation/Motion** | Subtle parallax on hero. Fade-in on scroll for service cards. Smooth hover effects on gallery images. No excessive animation — premium = restrained. |
| **Trust Elements** | Google review stars, certification badges, "X vehicles detailed" counter, before/after slider, customer testimonials with photos. |
| **Mobile-First** | Thumb-friendly CTA placement. Collapsible service accordion. Swipeable gallery. Click-to-call button prominent. |
| **What Makes It Memorable** | The dark premium aesthetic immediately differentiates from typical "bright and clean" small business sites. The before/after gallery is the hero feature. |

### 2.6 Page Structure

**Homepage Sections:**
1. Hero — dramatic car photo, headline ("Premium Mobile Detailing — Muskegon, MI"), CTA button
2. Services overview — 4–6 service cards with icons
3. Before/After gallery — slider or side-by-side comparisons
4. Why Choose Us — trust badges, certifications, years in business
5. Testimonials — 3–4 customer reviews with stars
6. Service area map — Google Maps embed
7. CTA banner — "Book Your Detail Today"
8. Footer — contact info, social links, hours

**Additional Pages:**
- Services (detailed breakdown of each service with pricing or "Get Quote")
- Gallery (full before/after portfolio)
- About (owner story, team, certifications)
- Contact / Get a Quote (multi-step form: vehicle type → service → preferred date → contact info)
- FAQ (common questions about mobile detailing, pricing, scheduling)
- Service Area (map + list of cities served)

**Optional/Upsell Pages:**
- Blog (SEO content — "How Often Should You Detail Your Car?")
- Ceramic Coating landing page (dedicated high-value service page)
- Fleet/Commercial services page

**Legal Pages:**
- Privacy Policy (required)
- Terms of Service (recommended)

### 2.7 Integration Options

| Integration | Classification | Notes |
|-------------|---------------|-------|
| Contact/quote form | **A. Included** | Built into the site |
| Google Maps embed | **A. Included** | Service area display |
| Social media links | **A. Included** | Footer/header links |
| Google Business Profile link | **A. Included** | Link to existing GBP |
| Google Analytics | **B. Upsell** | $49/mo or $99 one-time setup |
| Google Search Console | **B. Upsell** | Bundled with Analytics setup |
| Review widget (Google/Yelp) | **B. Upsell** | $29/mo — pulls live reviews |
| SMS lead alerts (Twilio) | **B. Upsell** | $19/mo — text owner on new form submission |
| Booking/scheduling (Calendly) | **B. Upsell** | $49/mo — embedded booking widget |
| Email capture/newsletter | **B. Upsell** | $19/mo — seasonal promo list |
| AI chat widget | **B. Upsell** | $39/mo — answer common questions 24/7 |
| Meta Pixel | **B. Upsell** | $49 one-time — for Facebook/Instagram ads |
| Google Tag Manager | **C. Custom Quote** | Only if running complex ad campaigns |
| CRM/Zapier webhook | **C. Custom Quote** | Only if they have existing CRM |
| Stripe payment processing | **C. Custom Quote** | Only if they want to take deposits online |
| Shopify/WooCommerce | **D. Not Recommended** | Not an ecommerce business |
| Toast/Square ordering | **D. Not Recommended** | Not a food business |
| TikTok Pixel | **D. Not Recommended** | Unless actively running TikTok ads |

### 2.8 Upsell Opportunities

| Upsell | Why This Customer Needs It | AI Auto-Recommend? | Rep Pitch? | Price | One-Time/Monthly | Fulfillment Burden | Risk |
|--------|---------------------------|---------------------|------------|-------|------------------|--------------------|------|
| Google Analytics setup | Track visitor behavior, measure quote form conversions | Yes | Yes | $99 one-time or $49/mo managed | Both options | Low — 1-2 hours setup | Low |
| Google Business Profile optimization | Local SEO is critical for mobile detailing | Yes | Yes | $149 one-time | One-time | Low — 2-3 hours | Low |
| Review request automation | Reviews are the #1 trust signal for service businesses | Yes | Yes | $29/mo | Monthly | Low — automated widget | Low |
| SMS lead alerts | Owner is mobile — needs instant notification of new leads | Yes | Yes | $19/mo | Monthly | Very low — Twilio integration exists | Low |
| Before/after gallery enhancement | Interactive slider gallery is a premium feature | No | Yes | $99 one-time | One-time | Low — 1-2 hours | Low |
| Booking/scheduling integration | Reduces phone tag, increases conversion | No | Yes | $49/mo | Monthly | Medium — third-party embed | Medium |
| AI chat widget | Answer "how much does detailing cost?" at 11pm | Yes (after 3 months) | Yes | $39/mo | Monthly | Low — AI-powered | Low |
| Ceramic coating landing page | High-ticket service deserves dedicated SEO page | No | Yes | $199 one-time | One-time | Medium — custom page | Low |
| Monthly photo/content update | Fresh gallery content improves SEO and trust | No | Yes | $79/mo | Monthly | Medium — requires customer photos | Medium |
| Meta Pixel setup | If running Facebook/Instagram ads | No | Yes (if ads mentioned) | $49 one-time | One-time | Low — 30 min setup | Low |

### 2.9 Fulfillment Workflow

| Step | Description | Classification | Est. Time |
|------|-------------|----------------|-----------|
| 1. Customer completes onboarding questionnaire | Business info, style, services, photos | Customer self-serve | 20–30 min |
| 2. Customer uploads assets (logo, photos) | Via onboarding portal asset upload step | Customer self-serve | 15–30 min |
| 3. Admin reviews questionnaire + assets | Check completeness, flag missing items | Admin manual | 15 min |
| 4. Admin requests missing info if needed | Email/portal message to customer | Admin manual | 10 min |
| 5. Content/copy writing | Service descriptions, headlines, CTAs, About page | AI-assisted | 2–3 hours |
| 6. Design mockup creation | Based on questionnaire style preferences | AI-assisted + Admin | 4–6 hours |
| 7. Customer reviews design mockup | Via onboarding portal review step | Customer self-serve | — |
| 8. Revisions (1–2 rounds) | Based on customer feedback | Admin manual | 2–4 hours |
| 9. Integration setup | Quote form, Google Maps, social links | Admin manual | 1–2 hours |
| 10. Upsell integration setup | Analytics, review widget, SMS alerts (if purchased) | Admin manual | 1–3 hours |
| 11. Domain setup / DNS configuration | Point domain or register new one | Admin manual + Customer | 30 min |
| 12. Final approval | Customer reviews live preview, approves launch | Customer self-serve | — |
| 13. Launch | Go live on domain | Admin manual | 30 min |
| 14. Post-launch check | Verify all pages, forms, integrations working | Admin manual | 30 min |
| 15. Monthly report delivery | Traffic, form submissions, SEO metrics | AI-assisted | 1 hour/mo |
| 16. Monthly support | Photo updates, content changes, seasonal adjustments | Admin manual | 1–2 hours/mo |

### 2.10 Monthly Retention Plan

**Monthly Report Contents:**
- Website traffic (visitors, page views, bounce rate)
- Quote form submissions count and conversion rate
- Top landing pages
- Google search impressions and clicks (if Search Console connected)
- Review count and average rating trend
- Recommendations for next month

**Recommended Monthly Check-ins:**
- Month 1: Post-launch follow-up, ensure forms working, collect first feedback
- Month 3: First quarterly review, suggest upsells (analytics, review widget)
- Month 6: Mid-contract review, discuss seasonal content updates
- Month 9: Pre-renewal conversation, showcase results
- Month 12: Renewal pitch with ROI summary

**Likely Change Requests:**
- Seasonal service updates (spring detail specials, winter interior packages)
- New before/after photos added to gallery
- Price adjustments
- New service added (e.g., ceramic coating, PPF)
- Holiday/promotion banners

**Likely Upsells Over Time:**
- Month 1–3: Google Analytics, SMS alerts
- Month 3–6: Review widget, AI chat
- Month 6–9: Booking integration, SEO landing pages
- Month 9–12: Content/blog package, Meta Pixel

**Renewal Angle:**
"Your site generated X quote requests this year. Here's your ROI. Let's keep the momentum going and add [upsell] to capture even more leads next year."

**Health Score Signals:**
- Quote form submissions trending up = healthy
- Customer responding to emails/reports = healthy
- No login to portal in 60+ days = at-risk
- Support requests increasing = needs attention
- Negative review mentions = churn risk

**Churn Risks:**
- Customer doesn't see enough leads from the site
- Customer gets a cheaper offer from a competitor
- Customer's business slows down seasonally and they want to pause
- Customer doesn't understand the value of ongoing management

**Customer Success Actions:**
- Proactive seasonal content suggestions
- Celebrate milestones ("Your site hit 1,000 visitors!")
- Share competitor insights ("Here's what top detailers in your area are doing")
- Offer revision credits for referrals

### 2.11 Legal / Compliance / Risk Notes

| Area | Risk | Action Needed |
|------|------|---------------|
| SEO guarantee language | Customer may expect guaranteed Google rankings | Policy language: "We optimize for search visibility but cannot guarantee specific rankings" |
| Before/after photo rights | Must have customer consent to use vehicle photos | Include photo release clause in contract or onboarding |
| Testimonial/review use | Displaying Google reviews must comply with platform ToS | Use official Google review widget or clearly attribute quotes |
| Privacy/cookies/analytics | If using Google Analytics, must disclose tracking | Privacy Policy page with analytics disclosure |
| SMS consent | If using SMS lead alerts, customer must consent | Include SMS consent checkbox in quote form |
| Email marketing consent | If collecting email addresses for newsletters | CAN-SPAM compliant opt-in |
| Service claims | "Best detailer in Muskegon" type claims need substantiation | Avoid superlative claims without evidence |
| Payment/refund terms | If taking deposits via Stripe | Clear refund/cancellation policy needed |

**Note:** This is not legal advice. These areas need clear policy language or attorney review.

### 2.12 Build Verdict

| Question | Answer |
|----------|--------|
| **Can MiniMorph sell this today?** | **Yes** |
| **Under which package?** | Growth ($299/mo) |
| **Classification** | Standard package sale |
| **Top 3 Risks** | 1. Customer expects more photos than they provide. 2. Customer expects booking system included (it's an upsell). 3. Customer expects SEO results faster than realistic. |
| **Top 3 Conversion Opportunities** | 1. Before/after gallery is a powerful sales tool — showcase it in the pitch. 2. "Your competitors have better websites" angle from the free audit. 3. SMS lead alerts are an easy upsell that demonstrates immediate value. |

---

## 3. Build Profile 2 — Q's Landscaping

### 3.1 Business Summary

| Field | Detail |
|-------|--------|
| **Business Name** | Q's Landscaping |
| **Industry** | Landscaping / Lawn Care / Snow Removal |
| **Location** | Muskegon, Michigan |
| **Target Customer** | Homeowners and small commercial property owners in the Muskegon area who need lawn care, landscaping, seasonal cleanups, and snow removal |
| **Primary Business Goal** | Generate seasonal leads for cleanups, mowing contracts, and snow removal |
| **Secondary Goals** | Establish year-round service presence, build trust with before/after project photos, collect reviews, upsell additional services |
| **Conversion Action** | "Request a Free Estimate" form submission |
| **Likely Objections** | "I already have a lawn guy," "I'll just do it myself," "Your prices are too high," "I only need you for one season" |
| **Urgency Level** | High — extremely seasonal. Spring cleanup rush (March–May), mowing season (May–Oct), fall cleanup (Oct–Nov), snow removal (Nov–Mar). Missing a season = lost revenue. |

### 3.2 Recommended MiniMorph Package

| Field | Assessment |
|-------|------------|
| **Current Package Fit** | **Growth ($299/mo)** — needs 8–10 pages (services x4, gallery, about, contact, service area, FAQ, seasonal landing pages) |
| **Whether Current Pricing is Enough** | Yes. A landscaping site with service pages, gallery, estimate form, and service area map is standard Growth scope. Seasonal landing pages are the only stretch. |
| **Classification** | Standard package sale — Growth tier |
| **Reason** | Multiple service categories (lawn care, landscaping, snow removal, cleanups) each need their own page for SEO. Service area pages help with local search. Gallery is essential. |
| **Risk Level** | Low-Medium — seasonal content changes are frequent |
| **Estimated Workload** | 18–22 hours initial build |
| **Estimated Revision Risk** | Medium — seasonal service updates, pricing changes, and new project photos will drive regular revision requests |
| **Estimated Monthly Support Burden** | Medium — seasonal content swaps 4x/year, occasional photo additions, 2–3 hours/month average |

### 3.3 Required Onboarding Questions

**A. Required Questions**

1. What is your full business name as displayed?
2. Legal business name if different?
3. What is your primary service area? (cities, neighborhoods, zip codes, or mile radius)
4. What services do you offer by season? (Spring: cleanups, mulching. Summer: mowing, landscaping. Fall: leaf removal, aeration. Winter: snow plowing, salting.)
5. Do you want pricing displayed? If yes, provide pricing. If no, what CTA? ("Get a Free Estimate")
6. Do you have a logo?
7. Brand colors? If not, preferences?
8. Do you have project photos? Before/after pairs?
9. Do you own a domain?
10. Preferred contact method for leads? (phone, text, email, form)
11. Google Business Profile link?
12. Social media accounts?
13. Preferred website style? (clean/earthy/professional vs. bold/modern)
14. What is the single most important action for visitors?

**B. Optional Questions**

15. Competitor websites you admire or want to beat?
16. Existing reviews/testimonials?
17. Do you offer commercial/HOA services? (may need separate page)
18. Do you have equipment/team photos?
19. Do you want a blog? (seasonal lawn care tips = great SEO content)
20. Certifications or affiliations? (licensed, insured, bonded)

**C. Conditional Questions (Landscaping Specific)**

21. Do you offer hardscaping? (patios, retaining walls, fire pits) — needs dedicated page
22. Do you offer irrigation/sprinkler services?
23. Do you do snow removal? Commercial or residential or both?
24. Do you want seasonal promotion banners that rotate automatically?
25. Do you offer annual maintenance contracts? (affects pricing page structure)

**D. Red-Flag Questions (Trigger Admin Review)**

26. "I need an online store to sell landscaping supplies" → Ecommerce scope
27. "I need a customer portal where clients can pay invoices" → Custom development
28. "I want to rank #1 for 'landscaping Muskegon'" → SEO guarantee risk
29. "I need the site to integrate with my Jobber/ServiceTitan CRM" → Integration complexity
30. "I need 20+ service area pages" → Exceeds Growth page count, may need Premium

### 3.4 AI Agent Preparation

**Business Facts AI Must Collect:**
- Complete seasonal service list
- Service area boundaries
- Pricing display preference
- Whether they offer commercial vs. residential
- Existing assets (logo, photos, domain)
- Whether they have a CRM or scheduling tool

**Tone AI Should Use:**
Friendly, trustworthy, local. "Your neighbor's landscaper" energy. Down-to-earth but professional. Avoid corporate jargon.

**Questions AI Should Ask if Info is Missing:**
- "Which seasons are you busiest? We'll make sure those services are front and center."
- "Do you have before/after photos of your landscaping projects? These convert really well."
- "Do you offer snow removal? That's a big deal in Michigan — we should feature it."

**What AI Should Never Assume:**
- Never assume they do all four seasons of service
- Never assume they do commercial work
- Never assume they have professional photos
- Never promise specific lead volume
- Never assume their pricing structure

**What Should Trigger Human/Admin Review:**
- Customer wants CRM integration (Jobber, ServiceTitan, etc.)
- Customer wants online payment/invoicing
- Customer needs more than 15 pages
- Customer wants multilingual site
- Customer mentions franchise or multi-location

**Upsells AI Should Recommend:**
- Seasonal landing pages ($99/each one-time)
- Google Analytics ($49/mo or $99 one-time)
- Google Business Profile optimization ($149 one-time)
- SMS lead alerts ($19/mo)
- Review request automation ($29/mo)

**Integrations AI Should Suggest:**
- Estimate request form (included)
- Google Maps service area display (included)
- Social media links (included)
- Review widget (upsell)
- Seasonal campaign landing pages (upsell)

**How AI Should Explain the Process:**
"We'll build your site around your services and service area. You'll upload your best project photos and answer some questions about your business. Our team designs the site, you review it, and we launch. Every month we send you a report and handle any updates — like swapping out seasonal services or adding new project photos."

**Legal/Claim Boundaries:**
- No guarantees on lead volume or Google rankings
- "Licensed and insured" claims must be verified with customer
- Before/after photos need customer property consent
- Seasonal pricing must be clearly marked as estimates if variable

### 3.5 Design Direction

| Element | Direction |
|---------|-----------|
| **Visual Style** | Clean, earthy, local, trustworthy. Organic and grounded. Think "the reliable neighbor with a great lawn." |
| **Color Palette** | Primary: forest green (#2D5A3D) or sage (#7C9A6B). Accent: warm earth brown (#8B6F47) or golden amber (#D4A843). Background: warm white (#FAFAF5). |
| **Typography** | Friendly rounded sans-serif for headings (Nunito, Quicksand). Clean body text (Open Sans, Lato). Nothing too corporate. |
| **Layout Style** | Clean grid layout. Service cards with icons. Full-width seasonal hero that rotates. Generous whitespace. Warm, inviting feel. |
| **Imagery Style** | Lush green lawns, colorful landscaping, snow-covered driveways being plowed. Natural lighting. Real project photos preferred over stock. |
| **CTA Style** | Warm, inviting buttons. "Get Your Free Estimate" in green on white, or white on green. Rounded corners. Friendly, not aggressive. |
| **Animation/Motion** | Gentle fade-ins. Seasonal hero image crossfade. Subtle hover effects on service cards. Nothing flashy — trustworthy = steady. |
| **Trust Elements** | "Licensed & Insured" badge, Google review stars, years in business, project count, before/after slider, local community involvement. |
| **Mobile-First** | Click-to-call prominent. Service accordion for easy browsing. Swipeable gallery. Seasonal service toggle. |
| **What Makes It Memorable** | The seasonal rotation — the site feels alive and current. Spring shows green, winter shows snow removal. It's always relevant. |

### 3.6 Page Structure

**Homepage Sections:**
1. Seasonal hero — rotating image/headline based on current season
2. Services overview — 4 seasonal service cards
3. Before/After gallery — project showcase slider
4. Why Choose Us — licensed, insured, local, X years experience
5. Testimonials — 3–4 customer reviews
6. Service area map — Google Maps with coverage area
7. Seasonal CTA — "Book Your [Season] Service Now"
8. Footer — contact info, social links, hours

**Additional Pages:**
- Lawn Care Services (mowing, fertilizing, aeration, overseeding)
- Landscaping Services (design, planting, mulching, hardscaping)
- Seasonal Cleanups (spring cleanup, fall leaf removal)
- Snow Removal (plowing, salting, sidewalk clearing)
- Gallery (before/after project photos by category)
- About (owner story, team, equipment)
- Contact / Request Estimate (service type → property size → preferred date → contact info)
- Service Area (map + list of cities/neighborhoods)
- FAQ

**Optional/Upsell Pages:**
- Blog (seasonal lawn care tips, landscaping ideas)
- Commercial Services landing page
- Seasonal promotion landing pages

**Legal Pages:**
- Privacy Policy
- Terms of Service

### 3.7 Integration Options

| Integration | Classification | Notes |
|-------------|---------------|-------|
| Estimate request form | **A. Included** | Multi-step form with service selection |
| Google Maps embed | **A. Included** | Service area display |
| Social media links | **A. Included** | Footer/header links |
| Google Business Profile link | **A. Included** | Link to existing GBP |
| Google Analytics | **B. Upsell** | $49/mo or $99 one-time |
| Google Search Console | **B. Upsell** | Bundled with Analytics |
| Review widget | **B. Upsell** | $29/mo |
| SMS lead alerts | **B. Upsell** | $19/mo |
| Email capture/newsletter | **B. Upsell** | $19/mo — seasonal tips list |
| AI chat widget | **B. Upsell** | $39/mo |
| Seasonal landing pages | **B. Upsell** | $99/each one-time |
| Meta Pixel | **B. Upsell** | $49 one-time |
| Booking/scheduling | **B. Upsell** | $49/mo |
| CRM integration (Jobber) | **C. Custom Quote** | Complex — webhook/API work |
| Google Tag Manager | **C. Custom Quote** | Only if running complex campaigns |
| Stripe payment processing | **C. Custom Quote** | Only if taking deposits online |
| Shopify/WooCommerce | **D. Not Recommended** | Not an ecommerce business |
| Toast/Square ordering | **D. Not Recommended** | Not a food business |

### 3.8 Upsell Opportunities

| Upsell | Why This Customer Needs It | AI Auto-Recommend? | Rep Pitch? | Price | One-Time/Monthly | Fulfillment Burden | Risk |
|--------|---------------------------|---------------------|------------|-------|------------------|--------------------|------|
| Seasonal landing pages | Dedicated pages for spring cleanup, snow removal = SEO gold | Yes | Yes | $99/each | One-time | Low-Medium | Low |
| Google Analytics | Track which services get the most traffic | Yes | Yes | $99 one-time | One-time | Low | Low |
| Google Business Profile optimization | Local SEO is everything for landscapers | Yes | Yes | $149 one-time | One-time | Low | Low |
| Review request automation | Landscaping is trust-based — reviews are critical | Yes | Yes | $29/mo | Monthly | Low | Low |
| SMS lead alerts | Owner is in the field — needs instant notification | Yes | Yes | $19/mo | Monthly | Very low | Low |
| Email capture / seasonal newsletter | "Sign up for seasonal lawn care tips" = lead nurture | No | Yes | $19/mo | Monthly | Low | Low |
| AI chat widget | Answer "do you service my area?" at midnight | Yes (after 3 months) | Yes | $39/mo | Monthly | Low | Low |
| Blog / content package | Seasonal content = SEO authority | No | Yes | $149/mo | Monthly | Medium | Low |
| Before/after gallery enhancement | Interactive comparison slider | No | Yes | $99 one-time | One-time | Low | Low |
| Commercial services page | If they do commercial work, dedicated page converts better | No | Yes | $199 one-time | One-time | Medium | Low |

### 3.9 Fulfillment Workflow

| Step | Description | Classification | Est. Time |
|------|-------------|----------------|-----------|
| 1. Customer completes questionnaire | Business info, services by season, style | Customer self-serve | 25–35 min |
| 2. Customer uploads assets | Logo, project photos, team photos | Customer self-serve | 20–40 min |
| 3. Admin reviews submission | Check completeness, identify seasonal scope | Admin manual | 20 min |
| 4. Admin requests missing info | Especially seasonal service details, photos | Admin manual | 10 min |
| 5. Content/copy writing | Service descriptions, seasonal copy, CTAs | AI-assisted | 3–4 hours |
| 6. Design mockup | Based on earthy/local style direction | AI-assisted + Admin | 4–6 hours |
| 7. Customer reviews mockup | Via portal review step | Customer self-serve | — |
| 8. Revisions (1–2 rounds) | Seasonal emphasis, photo placement, copy tweaks | Admin manual | 2–4 hours |
| 9. Integration setup | Estimate form, Google Maps, social links | Admin manual | 1–2 hours |
| 10. Upsell integrations | Analytics, review widget, SMS (if purchased) | Admin manual | 1–3 hours |
| 11. Domain setup | Point or register domain | Admin manual + Customer | 30 min |
| 12. Final approval | Customer reviews live preview | Customer self-serve | — |
| 13. Launch | Go live | Admin manual | 30 min |
| 14. Post-launch check | Verify forms, maps, integrations | Admin manual | 30 min |
| 15. Seasonal content swap (4x/year) | Update hero, featured services, promotions | Admin manual | 1–2 hours each |
| 16. Monthly report | Traffic, form submissions, seasonal trends | AI-assisted | 1 hour/mo |

### 3.10 Monthly Retention Plan

**Monthly Report Contents:**
- Website traffic with seasonal comparison
- Estimate form submissions by service type
- Top landing pages (which services drive traffic)
- Google search performance (if connected)
- Seasonal recommendations for next month
- Competitor activity notes

**Recommended Monthly Check-ins:**
- Month 1: Post-launch, verify forms, collect first feedback
- Month 3: First seasonal transition (prepare next season's content)
- Month 6: Mid-year review, seasonal content swap
- Month 9: Pre-renewal, showcase annual results
- Month 12: Renewal with ROI summary

**Likely Change Requests:**
- Seasonal service swaps (4x/year minimum)
- New project photos added to gallery
- Price updates
- New service additions
- Seasonal promotion banners
- Snow removal page emphasis in November

**Likely Upsells Over Time:**
- Month 1–3: Analytics, SMS alerts, GBP optimization
- Month 3–6: Seasonal landing pages, review widget
- Month 6–9: Blog/content package, AI chat
- Month 9–12: Commercial services page, Meta Pixel

**Renewal Angle:**
"Your site generated X estimate requests across all four seasons. Spring was your strongest — let's double down with dedicated landing pages and a content package for next year."

**Health Score Signals:**
- Estimate form submissions trending up = healthy
- Customer provides seasonal photos regularly = engaged
- No portal login in 60+ days = at-risk
- Complaints about lead quality = needs attention
- Seasonal content not updated = churn risk

**Churn Risks:**
- Customer doesn't see enough leads
- Seasonal business slowdown (especially winter for non-snow customers)
- Customer switches to a competitor offering cheaper service
- Customer's business grows beyond MiniMorph's scope (needs CRM, scheduling, invoicing)

**Customer Success Actions:**
- Proactive seasonal content swap reminders (2 weeks before each season)
- Share local market insights
- Celebrate milestones ("Your site hit 500 estimate requests!")
- Suggest seasonal promotions based on weather/timing

### 3.11 Legal / Compliance / Risk Notes

| Area | Risk | Action Needed |
|------|------|---------------|
| "Licensed & Insured" claims | Must verify customer actually holds valid license/insurance | Require proof during onboarding or add disclaimer |
| Before/after photo rights | Photos of customer properties need consent | Photo release clause in contract |
| Pricing accuracy | Seasonal pricing changes frequently | Disclaimer: "Prices subject to change. Contact for current rates." |
| Service area claims | Must accurately represent where they actually service | Verify service area boundaries during onboarding |
| Environmental claims | "Eco-friendly" or "organic" lawn care claims need substantiation | Only use if customer provides certification |
| Snow removal liability | Snow/ice removal has liability implications | Customer should have their own liability insurance — not MiniMorph's responsibility |
| Privacy/analytics | Google Analytics tracking disclosure | Privacy Policy page |
| SMS/email consent | If collecting contact info for marketing | CAN-SPAM and TCPA compliant opt-in |

### 3.12 Build Verdict

| Question | Answer |
|----------|--------|
| **Can MiniMorph sell this today?** | **Yes** |
| **Under which package?** | Growth ($299/mo) |
| **Classification** | Standard package sale |
| **Top 3 Risks** | 1. Seasonal content swaps increase monthly support burden. 2. Customer may expect CRM integration (Jobber) which is custom scope. 3. Photo quality depends entirely on customer — bad photos = bad site. |
| **Top 3 Conversion Opportunities** | 1. "Your competitors' sites look better" angle from free audit. 2. Seasonal urgency — "Spring is coming, is your site ready?" 3. Service area pages are easy SEO wins that demonstrate immediate value. |


## 4. Build Profile 3 — G&L Chillidog Refreshers

### 4.1 Business Summary

| Field | Detail |
|-------|--------|
| **Business Name** | G&L Chillidog Refreshers |
| **Industry** | Fast Casual Food / Food Truck / Pop-Up Restaurant |
| **Location** | West Michigan (mobile — festivals, events, pop-up locations) |
| **Target Customer** | Festival-goers, event attendees, local food lovers, event organizers looking for food vendors |
| **Primary Business Goal** | Attract event booking inquiries from organizers and build a local following for pop-up locations |
| **Secondary Goals** | Display the menu, build brand personality, announce upcoming locations/events, collect email list for location announcements |
| **Conversion Action** | "Book Us for Your Event" inquiry form + "Where Are We This Week?" location announcement |
| **Likely Objections** | "We don't need a website — we use Instagram," "Our customers find us at events," "We can't afford a website" |
| **Urgency Level** | Medium-High — festival season is seasonal (May–October in Michigan), but event organizer bookings happen months in advance |

### 4.2 Recommended MiniMorph Package

| Field | Assessment |
|-------|------------|
| **Current Package Fit** | **Starter ($149/mo)** — a food truck/pop-up needs fewer pages (menu, about, events/locations, contact/booking, gallery). 5 pages is sufficient. |
| **Whether Current Pricing is Enough** | Yes. A 5-page food vendor site with menu display, event booking form, location schedule, and gallery is well within Starter scope. |
| **Classification** | Standard package sale — Starter tier |
| **Reason** | Simple site structure. No ecommerce needed (they sell in person). No complex integrations. The site is primarily a digital business card + event booking tool. |
| **Risk Level** | Low |
| **Estimated Workload** | 10–14 hours initial build |
| **Estimated Revision Risk** | Low — menu changes and event schedule updates are the main requests |
| **Estimated Monthly Support Burden** | Low — menu updates, event schedule changes, maybe 1–2 hours/month |

### 4.3 Required Onboarding Questions

**A. Required Questions**

1. What is your full business name as displayed?
2. What type of food business? (food truck, pop-up, catering, brick-and-mortar, combination)
3. What is your primary service area / region?
4. What is your full menu? (items, descriptions, prices)
5. Do you want online ordering? If yes, what platform? (Square, Toast, DoorDash, etc.)
6. Do you have a logo?
7. Brand colors? If not, preferences?
8. Do you have food photography? How many photos?
9. Do you own a domain?
10. Preferred contact method for event bookings? (phone, email, form)
11. Google Business Profile link?
12. Social media accounts? (Instagram is usually primary for food businesses)
13. Preferred website style? (fun/playful/bold vs. clean/modern)
14. What is the single most important action for visitors?

**B. Optional Questions**

15. Do you have a regular schedule of locations/events?
16. Do you offer catering for private events?
17. Do you have any food certifications or health department ratings to display?
18. Do you want an email signup for location announcements?
19. Do you have customer reviews/testimonials?
20. Do you participate in any food festivals or competitions?

**C. Conditional Questions (Food Business Specific)**

21. Do you have a physical location or are you 100% mobile?
22. Do you need an events calendar or "Find Us" schedule page?
23. Do you offer catering packages? (needs separate page with pricing)
24. Do you have dietary accommodation info? (gluten-free, vegan, allergens)
25. Do you want to integrate with a POS system? (Square, Toast, Clover)

**D. Red-Flag Questions (Trigger Admin Review)**

26. "I want to sell merch online" → Ecommerce scope
27. "I want online ordering with delivery" → Integration complexity (DoorDash, UberEats, or custom)
28. "I need a loyalty/rewards program" → Custom development
29. "I want to take pre-orders for events" → Payment processing integration
30. "I need the site in Spanish" → Multilingual scope

### 4.4 AI Agent Preparation

**Business Facts AI Must Collect:**
- Full menu with prices and descriptions
- Business type (truck, pop-up, catering, brick-and-mortar)
- Whether they need online ordering or just a menu display
- Event booking needs
- Existing assets (logo, food photos, domain)
- Social media presence (Instagram is usually their main channel)

**Tone AI Should Use:**
Fun, bold, energetic, mouth-watering. Match the food truck personality. Use food-centric language. Casual but professional. Think "your favorite food truck's cool website."

**Questions AI Should Ask if Info is Missing:**
- "Do you have professional food photos? Great food photography is the #1 thing that makes a food site work."
- "Do you want people to be able to order online, or is the site more for finding your location and booking events?"
- "Do you have a regular weekly schedule of where you'll be?"

**What AI Should Never Assume:**
- Never assume they want online ordering (many food trucks are cash/card at the window only)
- Never assume they have a physical location
- Never assume they have professional food photography
- Never assume they need a large site
- Never assume dietary/allergen info without asking

**What Should Trigger Human/Admin Review:**
- Customer wants online ordering integration
- Customer wants to sell merchandise
- Customer wants loyalty/rewards program
- Customer needs POS integration
- Customer mentions franchise or multiple trucks

**Upsells AI Should Recommend:**
- Email capture for location announcements ($19/mo)
- Google Analytics ($49/mo or $99 one-time)
- Google Business Profile optimization ($149 one-time)
- Event calendar widget ($49 one-time)
- AI chat widget ($39/mo) — answer "where are you today?" questions

**Integrations AI Should Suggest:**
- Event booking/inquiry form (included)
- Google Maps embed for current location (included)
- Social media links — especially Instagram (included)
- Email signup for location announcements (upsell)
- Online ordering embed — Square, Toast (upsell/custom quote)

**How AI Should Explain the Process:**
"We'll build a site that shows off your food and makes it easy for event organizers to book you. You'll share your menu, some great food photos, and your story. We design it, you review it, we launch it. Every month we can update your event schedule and keep things fresh."

**Legal/Claim Boundaries:**
- Allergen/dietary claims must be verified with customer
- Health department ratings must be current
- Food photography must be of their actual food (not stock)
- No claims about food safety without verification
- Catering pricing must be clearly marked as estimates if variable

### 4.5 Design Direction

| Element | Direction |
|---------|-----------|
| **Visual Style** | Bold, fun, street-food energy. Vibrant and appetizing. Think food truck meets Instagram-worthy. |
| **Color Palette** | Primary: bold red (#D32F2F) or hot sauce orange (#FF6B35). Accent: mustard yellow (#FFD700) or charcoal (#2D2D2D). Background: warm cream (#FFF8E7) or dark with food photos popping. |
| **Typography** | Bold display font for headings (Bebas Neue, Oswald, or a hand-drawn style). Fun body text (Poppins, Nunito). Playful but readable. |
| **Layout Style** | Full-width hero with hero food photo. Menu as a visual grid with photos. Bold section dividers. Minimal text, maximum visual impact. |
| **Imagery Style** | Close-up food shots with steam, dripping sauce, melted cheese. Bright, saturated colors. Lifestyle shots of people enjoying food at events. The food truck itself as a hero element. |
| **CTA Style** | Bold, fun buttons. "Book Us for Your Event!" in bright accent color. "See Our Menu" with food icon. Playful language. |
| **Animation/Motion** | Fun hover effects on menu items. Smooth scroll to menu section. Subtle parallax on food hero. Nothing that slows down — hungry people are impatient. |
| **Trust Elements** | Event photos showing crowds, customer Instagram reposts, "As Seen At [Festival Name]" badges, review quotes. |
| **Mobile-First** | Critical — most food truck customers search on mobile at events. Menu must be instantly readable. Click-to-call. Google Maps to current location. |
| **What Makes It Memorable** | The bold food photography and playful personality. The site should make you hungry. |

### 4.6 Page Structure

**Homepage Sections:**
1. Hero — dramatic food photo, business name, tagline ("West Michigan's Favorite Chillidogs")
2. Menu highlights — 3–4 signature items with photos
3. "Find Us" — upcoming events/locations with dates
4. About — the story behind G&L, owner photos, the truck
5. Gallery — food photos, event photos, happy customers
6. Book Us — CTA for event organizers
7. Footer — social links (Instagram prominent), contact info

**Additional Pages:**
- Full Menu (all items with descriptions, prices, photos)
- Events / Find Us (schedule of upcoming locations, embedded Google Map)
- About (owner story, the truck, the mission)
- Book Us / Catering (inquiry form for event organizers and private events)
- Gallery (food photos, event photos)

**Optional/Upsell Pages:**
- Blog (recipes, behind-the-scenes, event recaps)
- Catering packages page (if they offer formal catering)
- Merch page (if they sell branded items — would be ecommerce upsell)

**Legal Pages:**
- Privacy Policy

### 4.7 Integration Options

| Integration | Classification | Notes |
|-------------|---------------|-------|
| Event booking/inquiry form | **A. Included** | Simple form for event organizers |
| Google Maps embed | **A. Included** | Show current/upcoming locations |
| Social media links | **A. Included** | Instagram, Facebook, TikTok |
| Menu display | **A. Included** | Visual menu grid |
| Google Analytics | **B. Upsell** | $49/mo or $99 one-time |
| Google Business Profile optimization | **B. Upsell** | $149 one-time |
| Email capture for location announcements | **B. Upsell** | $19/mo |
| Event calendar widget | **B. Upsell** | $49 one-time |
| AI chat widget | **B. Upsell** | $39/mo |
| Instagram feed embed | **B. Upsell** | $29 one-time |
| SMS location announcements | **B. Upsell** | $19/mo |
| Online ordering (Square/Toast) | **C. Custom Quote** | Complex integration |
| DoorDash/UberEats integration | **C. Custom Quote** | Third-party marketplace |
| Loyalty/rewards program | **C. Custom Quote** | Custom development |
| Merch store (Shopify) | **C. Custom Quote** | Ecommerce scope |
| POS integration | **D. Not Recommended** | Too complex for the value |

### 4.8 Upsell Opportunities

| Upsell | Why This Customer Needs It | AI Auto-Recommend? | Rep Pitch? | Price | One-Time/Monthly | Fulfillment Burden | Risk |
|--------|---------------------------|---------------------|------------|-------|------------------|--------------------|------|
| Email capture for location announcements | "Where are you this week?" is the #1 question food trucks get | Yes | Yes | $19/mo | Monthly | Low | Low |
| Google Business Profile optimization | Local search is critical for food businesses | Yes | Yes | $149 one-time | One-time | Low | Low |
| Instagram feed embed | Food trucks live on Instagram — show the feed on the site | No | Yes | $29 one-time | One-time | Low | Low |
| Event calendar widget | Display upcoming events in a clean calendar format | No | Yes | $49 one-time | One-time | Low | Low |
| AI chat widget | Answer "where are you today?" and "do you do catering?" 24/7 | Yes (after 3 months) | Yes | $39/mo | Monthly | Low | Low |
| Google Analytics | Track which events drive the most website traffic | No | Yes | $99 one-time | One-time | Low | Low |
| SMS location announcements | Text subscribers when you're at a new location | No | Yes | $19/mo | Monthly | Low-Medium | Low |
| Catering packages page | If they offer catering, a dedicated page converts better | No | Yes | $99 one-time | One-time | Low | Low |
| Menu photography enhancement | Professional food photo editing/styling | No | Yes | $199 one-time | One-time | Medium | Medium |

### 4.9 Fulfillment Workflow

| Step | Description | Classification | Est. Time |
|------|-------------|----------------|-----------|
| 1. Customer completes questionnaire | Business info, menu, style, photos | Customer self-serve | 20–30 min |
| 2. Customer uploads assets | Logo, food photos, truck photos | Customer self-serve | 15–30 min |
| 3. Admin reviews submission | Check menu completeness, photo quality | Admin manual | 15 min |
| 4. Admin requests missing info | Especially food photos and complete menu | Admin manual | 10 min |
| 5. Content/copy writing | Menu descriptions, about page, event booking copy | AI-assisted | 1.5–2.5 hours |
| 6. Design mockup | Based on bold/fun food truck style | AI-assisted + Admin | 3–5 hours |
| 7. Customer reviews mockup | Via portal | Customer self-serve | — |
| 8. Revisions (1 round likely) | Menu layout, photo placement, color tweaks | Admin manual | 1–2 hours |
| 9. Integration setup | Booking form, Google Maps, social links | Admin manual | 1 hour |
| 10. Domain setup | Point or register | Admin manual + Customer | 30 min |
| 11. Final approval + Launch | Customer approves, go live | Admin manual | 30 min |
| 12. Monthly updates | Event schedule, menu changes | Admin manual | 1 hour/mo |

### 4.10 Monthly Retention Plan

**Monthly Report Contents:**
- Website traffic
- Event booking inquiries received
- Top pages visited (menu vs. events vs. booking)
- Social media referral traffic
- Recommendations

**Recommended Monthly Check-ins:**
- Month 1: Post-launch, verify forms, collect feedback
- Month 3: Festival season prep, update event schedule
- Month 6: Mid-season review
- Month 9: Off-season strategy (catering push?)
- Month 12: Renewal with season recap

**Likely Change Requests:**
- Event schedule updates (weekly or bi-weekly during season)
- Menu item additions/removals
- Seasonal menu specials
- New food photos
- Event recap content

**Churn Risks:**
- Food truck is seasonal — may want to pause in winter
- "I just use Instagram" mentality
- Low perceived ROI if they don't track event bookings
- Business closes or changes concept

**Renewal Angle:**
"Your site drove X event booking inquiries this season. Event organizers found you through Google instead of just Instagram. Let's keep that going and add email capture so you can announce locations directly to your fans."

### 4.11 Legal / Compliance / Risk Notes

| Area | Risk | Action Needed |
|------|------|---------------|
| Allergen/dietary claims | Must accurately represent allergens and dietary options | Disclaimer: "Please inform us of any allergies. Menu items may contain allergens." |
| Health department compliance | Must have valid food service license | Verify during onboarding — do not display without confirmation |
| Food photography accuracy | Photos must represent actual food served | Use customer's own photos, not stock |
| Pricing accuracy | Menu prices change frequently | Disclaimer: "Prices subject to change" |
| Event schedule accuracy | Outdated schedule = bad customer experience | Clear process for regular updates |
| Catering claims | Catering capacity claims must be realistic | Verify capacity during onboarding |
| Privacy/email collection | If collecting emails for location announcements | CAN-SPAM compliant opt-in |

### 4.12 Build Verdict

| Question | Answer |
|----------|--------|
| **Can MiniMorph sell this today?** | **Yes** |
| **Under which package?** | Starter ($149/mo) |
| **Classification** | Standard package sale |
| **Top 3 Risks** | 1. Customer may not have food photography (site quality depends on it). 2. Event schedule needs frequent updates — customer must be responsive. 3. Customer may undervalue the site vs. Instagram presence. |
| **Top 3 Conversion Opportunities** | 1. "Event organizers Google food vendors — you need to show up." 2. The menu display alone justifies the site. 3. Email capture for location announcements is an easy upsell with immediate value. |

---

## 5. Build Profile 4 — Shoreline Concrete & Coatings

### 5.1 Business Summary

| Field | Detail |
|-------|--------|
| **Business Name** | Shoreline Concrete & Coatings |
| **Industry** | Concrete Contractor / Epoxy Coatings / Home Services |
| **Location** | West Michigan (Muskegon, Grand Haven, Holland, Grand Rapids area) |
| **Target Customer** | Homeowners wanting decorative concrete (patios, driveways, stamped concrete) and garage/basement epoxy coatings. Also small commercial (restaurant patios, retail floors). |
| **Primary Business Goal** | Generate estimate requests for concrete and coating projects |
| **Secondary Goals** | Showcase project portfolio, build trust through before/after transformations, establish expertise in decorative concrete and epoxy coatings, differentiate from generic concrete companies |
| **Conversion Action** | "Get a Free Estimate" form submission |
| **Likely Objections** | "Concrete is concrete — why pay more?", "I'll get three quotes and go with the cheapest," "Can I see examples of your work?", "How long does it last?" |
| **Urgency Level** | Medium — concrete work is seasonal (spring through fall in Michigan), but planning starts months ahead. Epoxy coatings are year-round (indoor). |

### 5.2 Recommended MiniMorph Package

| Field | Assessment |
|-------|------------|
| **Current Package Fit** | **Growth ($299/mo)** — needs 8–12 pages. Each service category (driveways, patios, stamped concrete, epoxy floors, commercial) needs its own page for SEO. Gallery is critical. Service area pages help with local search. |
| **Whether Current Pricing is Enough** | Yes, but borderline. If they want 12+ pages with dedicated service area pages for each city, they may need Premium. Growth's 10-page limit is tight for a contractor with multiple service lines. |
| **Classification** | Standard package sale — Growth tier (may upgrade to Premium if scope expands) |
| **Reason** | Contractors need extensive project galleries, multiple service pages, trust signals (licensing, insurance, warranty info), and service area pages. This is a content-heavy site. |
| **Risk Level** | Medium — scope creep is common with contractors who keep adding service lines |
| **Estimated Workload** | 20–28 hours initial build |
| **Estimated Revision Risk** | Medium-High — contractors are visual and particular about how their work is displayed. 2–3 revision rounds expected. |
| **Estimated Monthly Support Burden** | Medium — new project photos, seasonal updates, occasional new service additions. 2–3 hours/month. |

### 5.3 Required Onboarding Questions

**A. Required Questions**

1. What is your full business name as displayed?
2. Legal/registered business name if different?
3. What is your primary service area? (cities, counties, or mile radius)
4. What services do you offer? (List all: concrete driveways, patios, sidewalks, stamped concrete, decorative concrete, epoxy garage floors, epoxy basement floors, commercial flooring, concrete repair, sealing)
5. Do you want pricing displayed? (Most contractors prefer "Get a Free Estimate" approach)
6. Do you have a logo?
7. Brand colors?
8. Do you have project photos? How many? Before/after pairs?
9. Do you own a domain?
10. Preferred contact method for leads?
11. Google Business Profile link?
12. Social media accounts?
13. Preferred website style? (industrial/rugged vs. clean/modern vs. premium/luxury)
14. What is the single most important action for visitors?

**B. Optional Questions**

15. Competitor websites you admire or want to differentiate from?
16. Existing reviews/testimonials?
17. Do you have any certifications? (concrete contractor license, epoxy brand certifications, OSHA)
18. Do you offer warranties on your work? (critical trust signal)
19. Do you have team/crew photos?
20. Do you have video content? (time-lapse of pours, coating applications)

**C. Conditional Questions (Contractor Specific)**

21. Do you do residential, commercial, or both? (affects page structure and messaging)
22. Do you offer financing? (if yes, needs dedicated section or page)
23. What brands of epoxy/coating do you use? (brand logos = trust signals)
24. Do you offer free estimates? In-home consultations?
25. What is your typical project timeline? (helps set customer expectations)
26. Do you have a showroom or sample display?
27. What is your busiest season? (helps plan seasonal content)

**D. Red-Flag Questions (Trigger Admin Review)**

28. "I need a customer portal for project tracking" → Custom development scope
29. "I want to sell concrete supplies online" → Ecommerce scope
30. "I need integration with my estimating software" → Custom integration
31. "I want 3D visualizer for customers to see their project" → Way beyond scope
32. "I need the site in Spanish and English" → Multilingual scope
33. "I need 25+ pages for every city I service" → Exceeds Growth, needs Premium or custom

### 5.4 AI Agent Preparation

**Business Facts AI Must Collect:**
- Complete service list with categories
- Residential vs. commercial vs. both
- Service area boundaries
- Whether they offer warranties (and terms)
- Certifications and brand affiliations
- Existing assets (logo, project photos, domain)
- Whether they offer financing

**Tone AI Should Use:**
Confident, expert, trustworthy. "The guys who do it right the first time." Professional but not corporate. Emphasize craftsmanship, durability, and local expertise.

**Questions AI Should Ask if Info is Missing:**
- "Do you offer any warranty on your concrete or coating work? Warranties are a huge trust builder."
- "Do you have before/after photos of your projects? These are the most important thing on a contractor website."
- "Do you do both residential and commercial work? We may want separate sections for each."

**What AI Should Never Assume:**
- Never assume they do all types of concrete work
- Never assume they do commercial
- Never assume they offer financing
- Never promise specific lead volume
- Never assume warranty terms without asking
- Never assume they have professional photography

**What Should Trigger Human/Admin Review:**
- Customer wants project management portal
- Customer wants online product sales
- Customer wants estimating software integration
- Customer wants 3D visualization tools
- Customer needs more than 15 pages
- Customer mentions franchise or multi-location

**Upsells AI Should Recommend:**
- Google Analytics ($49/mo or $99 one-time)
- Google Business Profile optimization ($149 one-time)
- Review request automation ($29/mo)
- SMS lead alerts ($19/mo)
- Service area landing pages ($99/each one-time)
- Video gallery / project showcase ($149 one-time)
- AI chat widget ($39/mo)

**Integrations AI Should Suggest:**
- Estimate request form (included)
- Google Maps service area display (included)
- Social media links (included)
- Project gallery with before/after (included)
- Review widget (upsell)
- Financing partner link/embed (upsell if applicable)

**How AI Should Explain the Process:**
"We'll build a site that showcases your best work and makes it easy for homeowners to request estimates. You'll share your project photos, service details, and business info. We design the site, you review it, and we launch. Every month we send you a traffic report and handle any updates — like adding new project photos or seasonal content."

**Legal/Claim Boundaries:**
- Warranty claims must match actual warranty offered
- "Licensed and insured" must be verified
- Before/after photos need property owner consent
- No guarantees on project timelines or costs on the website
- Financing terms must comply with lending disclosure requirements
- No claims about competitor quality

### 5.5 Design Direction

| Element | Direction |
|---------|-----------|
| **Visual Style** | Industrial-modern. Strong, bold, durable. Think polished concrete meets architectural magazine. |
| **Color Palette** | Primary: slate gray (#4A4A4A) or concrete (#8B8680). Accent: construction orange (#FF6B00) or steel blue (#3A7CA5). Background: light warm gray (#F5F3F0). Dark sections for contrast. |
| **Typography** | Strong sans-serif for headings (Montserrat Bold, Oswald). Clean body (Inter, Source Sans Pro). All-caps section labels. Industrial feel without being harsh. |
| **Layout Style** | Full-width project photo hero. Grid-based service cards. Large before/after comparisons. Alternating light/dark sections. Generous use of project photography. |
| **Imagery Style** | Dramatic project photos — freshly poured concrete, glossy epoxy floors, stamped patios. Wide-angle shots showing the full transformation. Close-ups of texture and finish quality. |
| **CTA Style** | Bold, high-contrast. "Get Your Free Estimate" in accent color. Strong, confident language. Not flashy — solid and reliable. |
| **Animation/Motion** | Before/after slider on project photos. Subtle fade-in on scroll. Smooth hover on service cards. Counter animation for "X projects completed." |
| **Trust Elements** | License/insurance badges, brand logos (epoxy brands), warranty badge, years in business, project counter, Google review stars, BBB rating if applicable. |
| **Mobile-First** | Click-to-call prominent. Service accordion. Swipeable project gallery. Estimate form accessible from every page. |
| **What Makes It Memorable** | The project gallery is the hero. Large, dramatic before/after transformations that make homeowners say "I want that." |

### 5.6 Page Structure

**Homepage Sections:**
1. Hero — dramatic project photo (glossy epoxy floor or stamped patio), headline, CTA
2. Services overview — 4–6 service cards with project photos
3. Featured projects — 3–4 before/after showcases
4. Why Choose Us — licensed, insured, warranty, years experience, brand certifications
5. Testimonials — 3–4 customer reviews with project photos
6. Service area — map + cities served
7. CTA banner — "Get Your Free Estimate Today"
8. Footer — contact info, license number, social links

**Additional Pages:**
- Concrete Driveways (service detail + gallery)
- Patios & Outdoor Living (stamped, decorative, colored concrete)
- Epoxy Garage Floors (coating types, colors, process)
- Epoxy Basement Floors (waterproofing, finishing)
- Commercial Flooring (if applicable)
- Project Gallery (full portfolio organized by category)
- About (owner story, team, certifications, equipment)
- Contact / Get Estimate (project type → approximate size → timeline → contact info)
- Service Area (map + list of cities)
- FAQ (process, timeline, pricing factors, warranty, maintenance)

**Optional/Upsell Pages:**
- Blog (concrete care tips, design inspiration, project spotlights)
- Financing page (if they offer financing)
- Individual city service area pages (SEO — "Concrete Contractor Grand Rapids")
- Concrete repair / maintenance page
- Color/pattern gallery for stamped concrete

**Legal Pages:**
- Privacy Policy
- Terms of Service
- Warranty Terms (recommended)

### 5.7 Integration Options

| Integration | Classification | Notes |
|-------------|---------------|-------|
| Estimate request form | **A. Included** | Multi-step form with project type selection |
| Google Maps embed | **A. Included** | Service area display |
| Social media links | **A. Included** | Footer/header links |
| Project gallery with before/after | **A. Included** | Core feature |
| Google Analytics | **B. Upsell** | $49/mo or $99 one-time |
| Google Business Profile optimization | **B. Upsell** | $149 one-time |
| Review widget | **B. Upsell** | $29/mo |
| SMS lead alerts | **B. Upsell** | $19/mo |
| Service area landing pages | **B. Upsell** | $99/each one-time |
| Video gallery | **B. Upsell** | $149 one-time |
| AI chat widget | **B. Upsell** | $39/mo |
| Meta Pixel | **B. Upsell** | $49 one-time |
| Financing partner embed | **B. Upsell** | $99 one-time setup |
| CRM integration (Jobber/ServiceTitan) | **C. Custom Quote** | Complex webhook/API |
| Estimating software integration | **C. Custom Quote** | Complex |
| Google Tag Manager | **C. Custom Quote** | Only if running complex campaigns |
| 3D project visualizer | **D. Not Recommended** | Way beyond scope |
| Ecommerce for supplies | **D. Not Recommended** | Not their business model |

### 5.8 Upsell Opportunities

| Upsell | Why This Customer Needs It | AI Auto-Recommend? | Rep Pitch? | Price | One-Time/Monthly | Fulfillment Burden | Risk |
|--------|---------------------------|---------------------|------------|-------|------------------|--------------------|------|
| Google Analytics | Track which services drive the most estimate requests | Yes | Yes | $99 one-time | One-time | Low | Low |
| Google Business Profile optimization | Local SEO is critical for contractors | Yes | Yes | $149 one-time | One-time | Low | Low |
| Review request automation | Trust is everything for contractors — reviews are gold | Yes | Yes | $29/mo | Monthly | Low | Low |
| SMS lead alerts | Contractors are on job sites — need instant notification | Yes | Yes | $19/mo | Monthly | Very low | Low |
| Service area landing pages | "Concrete Contractor [City]" pages = SEO gold for contractors | No | Yes | $99/each | One-time | Medium | Low |
| Video gallery / time-lapse showcase | Concrete pours and epoxy applications are mesmerizing on video | No | Yes | $149 one-time | One-time | Medium | Low |
| AI chat widget | Answer "how much does a driveway cost?" at 9pm | Yes (after 3 months) | Yes | $39/mo | Monthly | Low | Low |
| Blog / content package | "How to Choose Epoxy Colors" type content = SEO authority | No | Yes | $149/mo | Monthly | Medium | Low |
| Financing partner page | If they offer financing, dedicated page increases conversions | No | Yes | $99 one-time | One-time | Low | Low |
| Meta Pixel | If running Facebook/Instagram ads showing project photos | No | Yes (if ads mentioned) | $49 one-time | One-time | Low | Low |

### 5.9 Fulfillment Workflow

| Step | Description | Classification | Est. Time |
|------|-------------|----------------|-----------|
| 1. Customer completes questionnaire | Business info, services, style, project types | Customer self-serve | 25–40 min |
| 2. Customer uploads assets | Logo, project photos (before/after), certifications | Customer self-serve | 30–60 min (they'll have many photos) |
| 3. Admin reviews submission | Check completeness, assess page count needed | Admin manual | 20 min |
| 4. Admin requests missing info | Warranty terms, certification docs, missing photos | Admin manual | 15 min |
| 5. Content/copy writing | Service descriptions, project spotlights, trust copy | AI-assisted | 3–5 hours |
| 6. Design mockup | Industrial-modern style with heavy gallery focus | AI-assisted + Admin | 5–7 hours |
| 7. Customer reviews mockup | Via portal | Customer self-serve | — |
| 8. Revisions (2–3 rounds) | Photo placement, service descriptions, gallery organization | Admin manual | 3–5 hours |
| 9. Integration setup | Estimate form, Google Maps, social links, gallery | Admin manual | 2–3 hours |
| 10. Upsell integrations | Analytics, review widget, SMS, service area pages | Admin manual | 2–4 hours |
| 11. Domain setup | Point or register | Admin manual + Customer | 30 min |
| 12. Final approval + Launch | Customer reviews, approves, go live | Admin manual | 30 min |
| 13. Post-launch check | Verify all pages, forms, gallery, integrations | Admin manual | 45 min |
| 14. Monthly report + support | Traffic, estimates, new project photos | AI-assisted + Admin | 2–3 hours/mo |

### 5.10 Monthly Retention Plan

**Monthly Report Contents:**
- Website traffic by page (which services get most interest)
- Estimate form submissions by project type
- Top landing pages and search terms
- Google search performance (if connected)
- Project gallery engagement
- Competitor activity notes
- Recommendations for next month

**Recommended Monthly Check-ins:**
- Month 1: Post-launch, verify forms, collect first feedback
- Month 3: First quarterly review, add new project photos, suggest upsells
- Month 6: Mid-contract review, seasonal content update
- Month 9: Pre-renewal, showcase results, discuss expansion
- Month 12: Renewal with ROI summary

**Likely Change Requests:**
- New project photos added to gallery (monthly or bi-monthly)
- New service additions (e.g., they start offering concrete sealing)
- Price factor updates
- Seasonal content (spring = patio season, fall = garage floor season)
- New certification or award badges
- Warranty term updates

**Churn Risks:**
- Customer doesn't see enough estimate requests
- Customer gets a cheaper website offer
- Customer's business slows down
- Customer wants CRM integration that MiniMorph can't provide
- Customer outgrows the site and wants custom features

**Renewal Angle:**
"Your site generated X estimate requests this year. Your epoxy floor page alone drove Y visitors. Let's add service area pages for [City] and [City] to capture even more local traffic."

### 5.11 Legal / Compliance / Risk Notes

| Area | Risk | Action Needed |
|------|------|---------------|
| License/insurance claims | Must verify contractor license and insurance | Require proof during onboarding |
| Warranty claims | Warranty terms on website must match actual warranty | Verify exact terms during onboarding |
| Before/after photo rights | Photos of customer properties need consent | Photo release clause in contract |
| Pricing/estimate language | Must not imply fixed pricing if estimates vary | "Prices vary by project. Contact for free estimate." |
| Financing disclosure | If displaying financing options, must comply with lending disclosure laws | Use financing partner's approved language |
| Safety claims | "Safe" or "non-toxic" epoxy claims need substantiation | Only use manufacturer-approved language |
| Environmental claims | "Eco-friendly" concrete claims need backing | Only if using certified green products |
| Service area accuracy | Must accurately represent where they work | Verify during onboarding |

### 5.12 Build Verdict

| Question | Answer |
|----------|--------|
| **Can MiniMorph sell this today?** | **Yes** |
| **Under which package?** | Growth ($299/mo) — may need Premium ($499/mo) if 12+ pages needed |
| **Classification** | Standard package sale (Growth) or borderline Premium |
| **Top 3 Risks** | 1. Scope creep — contractors keep adding service lines and wanting more pages. 2. Photo quality varies wildly — some contractors have great photos, others have blurry phone shots. 3. Revision rounds tend to be higher for contractors (they're visual and particular). |
| **Top 3 Conversion Opportunities** | 1. Before/after gallery is the ultimate sales tool for concrete work. 2. Service area pages are easy SEO wins. 3. "Your competitors have better websites" angle from the free audit is very effective for contractors. |


## 6. Build Profile 5 — Festival Hammock Supply Co.

### 6.1 Business Summary

| Field | Detail |
|-------|--------|
| **Business Name** | Festival Hammock Supply Co. |
| **Industry** | Ecommerce / Outdoor Recreation / Hammocks & Camping Gear |
| **Location** | U.S.-wide (ships nationally from West Michigan) |
| **Target Customer** | Festival-goers, campers, hikers, backyard relaxation enthusiasts, gift shoppers. Ages 22–45, active lifestyle, Instagram-savvy. |
| **Primary Business Goal** | Sell hammocks, straps, accessories, and bundles online with a full checkout experience |
| **Secondary Goals** | Build a lifestyle brand, grow an email list, run seasonal promotions, build Instagram/TikTok following, wholesale inquiries |
| **Conversion Action** | Add to cart → Checkout → Purchase |
| **Likely Objections** | "I can buy a hammock on Amazon for cheaper," "I've never heard of this brand," "What if I don't like it?", "Shipping takes too long" |
| **Urgency Level** | High — ecommerce requires a functioning store before any revenue. Festival season (May–September) is peak. Holiday gifting (Nov–Dec) is secondary peak. |

### 6.2 Recommended MiniMorph Package

| Field | Assessment |
|-------|------------|
| **Current Package Fit** | **None of the current packages are adequate.** Premium ($499/mo) includes "e-commerce integration" but the scope of a full product catalog, checkout, inventory management, shipping, tax, and order fulfillment is far beyond what the current packages describe. |
| **Whether Current Pricing is Enough** | **No.** A real ecommerce store requires: product catalog management, payment processing, shipping rate calculation, tax calculation, inventory tracking, order management, refund/return handling, and potentially wholesale pricing. This is a fundamentally different product than a service website. |
| **Classification** | **Requires new ecommerce package or custom quote** |
| **Reason** | The current packages are designed for service businesses that need lead generation websites. Ecommerce is a different product category with different fulfillment requirements, ongoing maintenance burden, and liability profile. |
| **Risk Level** | **High** — ecommerce has the highest support burden, most complex integrations, and greatest legal/compliance requirements |
| **Estimated Workload** | 40–60 hours initial build (2–3x a service website) |
| **Estimated Revision Risk** | High — product pages, checkout flow, and mobile shopping experience all need extensive testing and iteration |
| **Estimated Monthly Support Burden** | High — product updates, inventory changes, promotion setup, order issue support. 5–10 hours/month minimum. |

### 6.3 Required Onboarding Questions

**A. Required Questions (Universal)**

1. What is your full business name?
2. Legal/registered business name?
3. What do you sell? (product categories)
4. How many products/SKUs do you have? (critical for scoping)
5. Do you have a logo?
6. Brand colors?
7. Do you have product photography? Professional or phone photos?
8. Do you own a domain?
9. Social media accounts?
10. Preferred website style?

**B. Ecommerce-Specific Required Questions**

11. How many products do you want to launch with?
12. Do you have product descriptions written? Or do you need us to write them?
13. Do you have product photography for every item? (front, back, lifestyle shots)
14. What is your pricing structure? (fixed price, tiered, wholesale + retail)
15. Do you offer product variants? (sizes, colors, materials)
16. Where do you ship? (domestic only, international, specific regions)
17. What shipping carrier do you use? (USPS, UPS, FedEx, calculated rates vs. flat rate)
18. Do you handle your own fulfillment or use a 3PL? (self-ship, ShipBob, Amazon FBA, etc.)
19. Do you charge sales tax? In which states? (or do you use automated tax calculation)
20. What payment methods do you want to accept? (credit card, PayPal, Apple Pay, etc.)
21. Do you have a return/refund policy?
22. Do you have existing inventory management? (spreadsheet, Shopify, Square, etc.)
23. Do you want to offer discount codes / promotions?
24. Do you want email marketing integration? (Mailchimp, Klaviyo, etc.)
25. Do you want to sell wholesale? (separate pricing, minimum orders)

**C. Conditional Questions (Product-Specific)**

26. Do your products have weight/dimension data for shipping calculation?
27. Do you need a product configurator? (custom colors, personalization)
28. Do you sell digital products or only physical?
29. Do you offer subscriptions or recurring orders?
30. Do you need a size guide or fit chart?

**D. Red-Flag Questions (Trigger Admin Review / Custom Quote)**

31. "I have 200+ products" → Custom quote — exceeds standard scope
32. "I need integration with my warehouse/3PL" → Custom integration
33. "I want to sell on Amazon/Etsy too" → Multi-channel scope
34. "I need wholesale pricing with login" → Custom development
35. "I want a product customizer/configurator" → Custom development
36. "I need multi-currency support" → Complex — custom quote
37. "I need subscription boxes" → Recurring commerce — custom quote

### 6.4 AI Agent Preparation

**Business Facts AI Must Collect:**
- Product count and categories
- Whether product photography exists
- Whether product descriptions exist
- Shipping method and carrier
- Tax situation
- Return/refund policy
- Payment processing preference
- Inventory management current state

**Tone AI Should Use:**
Adventurous, lifestyle-focused, chill but professional. Match the outdoor/festival brand. "Your hammock, your adventure." Casual, warm, authentic.

**Questions AI Should Ask if Info is Missing:**
- "How many products are you launching with? This helps us determine the right package for you."
- "Do you have product photos for every item? We'll need at least 2–3 photos per product."
- "Who's going to manage inventory and shipping? You, or do you use a fulfillment service?"
- "Do you have a return policy written? We'll need to display it on the site."

**What AI Should Never Assume:**
- Never assume they have product photography
- Never assume they have product descriptions written
- Never assume their shipping/tax setup
- Never promise specific sales volume
- Never assume they can handle the technical side of ecommerce
- Never assume product count without asking

**What Should Trigger Human/Admin Review:**
- More than 50 products
- Wholesale/B2B pricing needs
- Multi-channel selling (Amazon, Etsy)
- Subscription/recurring orders
- International shipping
- Custom product configurator
- Integration with existing POS or inventory system

**Upsells AI Should Recommend:**
- Product description writing ($5–10/product)
- Product photography editing ($3–5/photo)
- Email marketing setup (Klaviyo/Mailchimp) ($149 one-time + $49/mo)
- Google Analytics + ecommerce tracking ($149 one-time)
- Meta Pixel + conversion tracking ($99 one-time)
- Abandoned cart email automation ($49/mo)
- AI chat widget for product questions ($39/mo)
- SEO product descriptions ($10–15/product)

**Integrations AI Should Suggest:**
- Payment processing — Stripe (included in ecommerce package)
- Shipping rate calculator (included or upsell depending on complexity)
- Tax calculation — Stripe Tax or TaxJar (upsell)
- Email marketing — Klaviyo or Mailchimp (upsell)
- Google Analytics with ecommerce tracking (upsell)
- Meta Pixel (upsell)
- Inventory management (depends on platform)

**How AI Should Explain the Process:**
"Building an online store is a bigger project than a regular website. Here's how it works: First, you'll answer detailed questions about your products, shipping, and business. Then you'll upload your product photos and descriptions (or we can write them for you as an add-on). We build the store, set up your checkout, and test everything. You review it, we make changes, and we launch. After launch, you'll manage your own inventory and orders, and we handle the website, updates, and monthly support."

**Legal/Claim Boundaries:**
- Must have clear return/refund policy displayed
- Must have shipping policy displayed
- Must have privacy policy (especially for payment data)
- Must comply with state sales tax requirements
- Cannot make product safety claims without certification
- Must have terms of service for the store
- Product descriptions must be accurate (no false claims)

### 6.5 Design Direction

| Element | Direction |
|---------|-----------|
| **Visual Style** | Lifestyle-driven, adventure-focused, warm and inviting. Think REI meets indie brand. Outdoor photography meets clean ecommerce. |
| **Color Palette** | Primary: forest green (#2D5A27) or sunset orange (#E8732A). Accent: sky blue (#5BA4CF) or warm sand (#D4B896). Background: warm white (#FEFCF6). Earth tones throughout. |
| **Typography** | Adventurous display font for headings (Playfair Display for premium, or Josefin Sans for casual). Clean body (Inter, Lato). Readable product descriptions. |
| **Layout Style** | Hero lifestyle photo (hammock in nature). Product grid with hover effects. Clean product detail pages with large photos. Sticky add-to-cart on mobile. |
| **Imagery Style** | Lifestyle shots: hammocks in forests, at festivals, on beaches, in backyards. Product shots on clean backgrounds. People relaxing in hammocks. Golden hour lighting. |
| **CTA Style** | "Shop Now" buttons in accent color. "Add to Cart" prominent on product pages. "Free Shipping Over $X" banner. Warm, inviting, not aggressive. |
| **Animation/Motion** | Smooth product image zoom on hover. Cart slide-in animation. Subtle parallax on lifestyle hero. Quick-view product modal. |
| **Trust Elements** | Customer photos/reviews on product pages, "Free Shipping" badge, "30-Day Returns" badge, "Handmade/Sustainable" badges if applicable, Instagram UGC gallery. |
| **Mobile-First** | Critical — most ecommerce traffic is mobile. Sticky add-to-cart bar. Swipeable product images. Easy checkout flow. Apple Pay / Google Pay buttons. |
| **What Makes It Memorable** | The lifestyle imagery sells the dream, not just the product. You're not buying a hammock — you're buying the feeling of swinging in the woods at a music festival. |

### 6.6 Page Structure

**Homepage Sections:**
1. Hero — lifestyle photo (hammock in nature), headline, "Shop Now" CTA
2. Featured products — 4–6 bestsellers
3. Collection highlights — "Festival Essentials," "Backyard Bliss," "Gift Sets"
4. Brand story — "Born at a music festival in Michigan"
5. Customer photos / Instagram UGC
6. Testimonials / reviews
7. Email signup — "Join the Hammock Crew" for 10% off
8. Footer — shop links, policies, social links

**Required Pages:**
- Shop / All Products (filterable product grid)
- Product Detail Pages (photos, description, variants, reviews, add to cart)
- Collections (by category: single hammocks, double hammocks, straps, accessories, bundles)
- Cart
- Checkout
- About / Our Story
- Contact
- FAQ (shipping, returns, product care)
- Shipping Policy
- Return/Refund Policy
- Privacy Policy
- Terms of Service

**Optional/Upsell Pages:**
- Blog (hammock lifestyle content, festival guides, camping tips)
- Wholesale inquiry page
- Gift guide page (seasonal)
- Size guide / comparison chart
- Hammock care guide
- Ambassador/affiliate program page

### 6.7 Integration Options

| Integration | Classification | Notes |
|-------------|---------------|-------|
| Product catalog / cart / checkout | **A. Must be included in ecommerce package** | Core ecommerce functionality |
| Payment processing (Stripe) | **A. Must be included** | Credit card, Apple Pay, Google Pay |
| Basic shipping (flat rate) | **A. Must be included** | Simple flat-rate or free-over-X shipping |
| Order confirmation emails | **A. Must be included** | Transactional emails |
| Google Analytics + ecommerce tracking | **B. Upsell** | $149 one-time |
| Email marketing (Klaviyo/Mailchimp) | **B. Upsell** | $149 one-time + $49/mo |
| Abandoned cart emails | **B. Upsell** | $49/mo |
| Meta Pixel + conversion tracking | **B. Upsell** | $99 one-time |
| Product review collection | **B. Upsell** | $29/mo |
| AI chat widget | **B. Upsell** | $39/mo |
| SMS marketing | **B. Upsell** | $29/mo |
| Instagram shopping integration | **B. Upsell** | $99 one-time |
| Calculated shipping rates (USPS/UPS API) | **C. Custom Quote** | Complex API integration |
| Automated tax calculation (TaxJar/Stripe Tax) | **C. Custom Quote** | Compliance complexity |
| Inventory sync with 3PL | **C. Custom Quote** | Complex integration |
| Multi-channel sync (Amazon/Etsy) | **C. Custom Quote** | Very complex |
| Wholesale portal with login | **C. Custom Quote** | Custom development |
| Subscription/recurring orders | **C. Custom Quote** | Custom development |
| Product customizer | **D. Not Recommended** | Too complex for MiniMorph scope |
| ERP integration | **D. Not Recommended** | Enterprise scope |

### 6.8 Upsell Opportunities

| Upsell | Why This Customer Needs It | AI Auto-Recommend? | Rep Pitch? | Price | One-Time/Monthly | Fulfillment Burden | Risk |
|--------|---------------------------|---------------------|------------|-------|------------------|--------------------|------|
| Product description writing | Many ecommerce owners don't have copywriting skills | Yes (if no descriptions) | Yes | $5–10/product | One-time | Medium | Low |
| Product photo editing | Clean backgrounds, consistent style | No | Yes | $3–5/photo | One-time | Medium | Low |
| Email marketing setup (Klaviyo) | Email is the #1 revenue channel for ecommerce | Yes | Yes | $149 setup + $49/mo | Both | Medium | Low |
| Abandoned cart automation | Recover 5–15% of abandoned carts | Yes (after launch) | Yes | $49/mo | Monthly | Low | Low |
| Google Analytics + ecommerce tracking | Track revenue, conversion rate, product performance | Yes | Yes | $149 one-time | One-time | Low | Low |
| Meta Pixel + conversion tracking | Required for Facebook/Instagram ads | Yes (if ads planned) | Yes | $99 one-time | One-time | Low | Low |
| Product review collection | Social proof drives ecommerce conversions | Yes (after 30 days) | Yes | $29/mo | Monthly | Low | Low |
| AI chat widget | Answer product questions, sizing, shipping | Yes (after launch) | Yes | $39/mo | Monthly | Low | Low |
| SEO product descriptions | Optimized for search visibility | No | Yes | $10–15/product | One-time | Medium | Low |
| Blog / content marketing | Lifestyle content drives organic traffic | No | Yes | $149/mo | Monthly | Medium | Low |
| Instagram shopping integration | Tag products in Instagram posts | No | Yes | $99 one-time | One-time | Medium | Medium |

### 6.9 Fulfillment Workflow

| Step | Description | Classification | Est. Time |
|------|-------------|----------------|-----------|
| 1. Customer completes ecommerce questionnaire | Products, shipping, tax, payment, policies | Customer self-serve | 45–60 min |
| 2. Customer uploads assets | Logo, product photos, product data (CSV or list) | Customer self-serve | 1–3 hours |
| 3. Admin reviews submission | Assess product count, complexity, integration needs | Admin manual | 30 min |
| 4. Admin creates custom quote if needed | If >50 products, complex shipping, wholesale needs | Admin manual | 30 min |
| 5. Product data entry / catalog setup | Enter all products with descriptions, prices, variants, photos | Admin manual (or AI-assisted) | 4–15 hours (depends on product count) |
| 6. Content/copy writing | Homepage, about, collection descriptions, policy pages | AI-assisted | 3–4 hours |
| 7. Design mockup | Lifestyle ecommerce style | AI-assisted + Admin | 6–10 hours |
| 8. Checkout/payment setup | Stripe integration, shipping rates, tax settings | Admin manual | 2–4 hours |
| 9. Customer reviews mockup | Via portal | Customer self-serve | — |
| 10. Revisions (2–3 rounds) | Product pages, checkout flow, mobile experience | Admin manual | 4–8 hours |
| 11. Integration setup | Analytics, email marketing, review collection | Admin manual | 2–4 hours |
| 12. Testing | Full checkout test, mobile test, email test | Admin manual | 2–3 hours |
| 13. Domain setup | Point or register | Admin manual + Customer | 30 min |
| 14. Final approval + Launch | Customer reviews, test purchase, approves | Admin manual | 1 hour |
| 15. Post-launch monitoring | First week: monitor orders, checkout issues, payment flow | Admin manual | 2–3 hours |
| 16. Monthly support | Product updates, promotion setup, order issue support | Admin manual | 5–10 hours/mo |

### 6.10 Monthly Retention Plan

**Monthly Report Contents:**
- Revenue and order count
- Conversion rate (visitors → purchases)
- Average order value
- Top-selling products
- Cart abandonment rate
- Traffic sources
- Email marketing performance (if connected)
- Recommendations

**Recommended Monthly Check-ins:**
- Month 1: Post-launch monitoring, first order celebration, troubleshoot issues
- Month 2: Review conversion rate, suggest optimizations
- Month 3: First quarterly review, email marketing push, suggest upsells
- Month 6: Mid-contract review, seasonal strategy (festival season vs. holiday)
- Month 9: Pre-renewal, showcase revenue generated
- Month 12: Renewal with ROI summary

**Likely Change Requests:**
- New products added (monthly or more)
- Product price changes
- Seasonal promotions / discount codes
- Collection reorganization
- New product photos
- Shipping rate adjustments
- Policy updates
- Holiday/seasonal banners and landing pages

**Churn Risks:**
- Store doesn't generate enough sales
- Customer wants features MiniMorph can't provide (wholesale portal, subscription boxes)
- Customer migrates to Shopify for more control
- Support burden exceeds what MiniMorph can handle at the price point
- Customer's business fails

**Renewal Angle:**
"Your store generated $X in revenue this year through the site we built. Your conversion rate is Y%. Let's add email marketing and abandoned cart recovery to increase that by 15–20% next year."

### 6.11 Legal / Compliance / Risk Notes

| Area | Risk | Action Needed |
|------|------|---------------|
| **Sales tax compliance** | Must collect and remit sales tax in nexus states | Customer must handle tax filing — MiniMorph sets up collection only. Clear disclaimer needed. |
| **Return/refund policy** | Required by FTC and most states for online sales | Must be prominently displayed. Customer must provide their policy. |
| **Shipping policy** | Must accurately describe shipping times and costs | Customer must provide accurate shipping info. Disclaimer for delays. |
| **Privacy policy** | Required — especially for payment data collection | Must include payment processor info, cookie disclosure, data collection practices. |
| **Terms of service** | Required for online sales | Must cover purchase terms, dispute resolution, liability limitations. |
| **Product safety** | Product claims must be accurate | No false safety claims. If hammocks have weight limits, must be displayed. |
| **Consumer protection** | FTC Act requires truthful advertising | Product descriptions must be accurate. No fake reviews. |
| **PCI compliance** | Payment card data handling | Stripe handles PCI compliance — but must not store card data locally. |
| **ADA accessibility** | Online stores should be accessible | Alt text on product images, keyboard navigation, screen reader compatibility. |
| **COPPA** | If any products target children | Age verification or parental consent if applicable. |
| **International shipping** | Customs, duties, import restrictions | If shipping internationally, must disclose that customer is responsible for duties/taxes. |

**Critical note:** Ecommerce has significantly more legal/compliance surface area than service websites. MiniMorph should have a standard ecommerce legal checklist and require customers to provide or approve all policy pages before launch.

### 6.12 Build Verdict

| Question | Answer |
|----------|--------|
| **Can MiniMorph sell this today?** | **Not under current packages.** Premium mentions "e-commerce integration" but the actual scope of building a full online store far exceeds what the current pricing and fulfillment structure supports. |
| **Under which package?** | **Requires new ecommerce package** (see Ecommerce Deep Dive below) |
| **Classification** | New package required or custom quote |
| **Top 3 Risks** | 1. Ecommerce support burden is 3–5x a service website. 2. Customer may expect Shopify-level features at $499/mo. 3. Legal/compliance requirements are significantly higher. |
| **Top 3 Conversion Opportunities** | 1. "You're losing sales every day without an online store" is a powerful pitch. 2. The lifestyle brand angle makes the site a marketing asset, not just a store. 3. Email marketing + abandoned cart recovery can demonstrate measurable ROI. |

---

## 7. Ecommerce Deep Dive

### 7.1 Should Ecommerce Be Its Own Package?

**Answer: Yes, absolutely.** Ecommerce should be a separate package, not an add-on to existing tiers. The reasons are:

The fulfillment burden for an ecommerce site is fundamentally different from a service website. A service website needs 15–25 hours to build and 1–3 hours/month to maintain. An ecommerce store needs 40–60 hours to build and 5–10 hours/month to maintain. The integration requirements (payment processing, shipping, tax, inventory), legal requirements (return policy, shipping policy, PCI compliance), and ongoing support needs (product updates, promotions, order issues) make ecommerce a different product category entirely.

Selling ecommerce under the current Premium package ($499/mo) would be underpriced and would create unsustainable support burden. The customer would expect Shopify-level functionality at a fraction of the cost, and MiniMorph would absorb the difference in labor.

### 7.2 Product Count Tiers

| Tier | Product Count | Classification |
|------|--------------|----------------|
| Micro | 1–10 products | Standard ecommerce package |
| Small | 11–25 products | Standard ecommerce package |
| Medium | 26–50 products | Standard ecommerce package (upper limit) |
| Large | 51–100 products | Custom quote required |
| Enterprise | 100+ products | Not recommended — customer should use Shopify/WooCommerce directly |

**Recommendation:** The standard ecommerce package should include up to 25 products. 26–50 products should be available at an additional per-product fee. Above 50, MiniMorph should issue a custom quote or recommend the customer use a dedicated ecommerce platform.

### 7.3 Platform Recommendation

| Platform | Recommendation | Reasoning |
|----------|---------------|-----------|
| **Shopify** | **Not recommended as MiniMorph-managed** | Shopify is a full platform — if the customer wants Shopify, they should use Shopify directly. MiniMorph can offer "Shopify setup" as a one-time service, but ongoing management of a Shopify store is a different business model. |
| **WooCommerce** | **Not recommended** | Requires WordPress hosting, plugin management, security updates. Too much infrastructure burden for MiniMorph. |
| **Stripe Payment Links** | **Recommended for Micro tier (1–10 products)** | Simple, low-maintenance, no inventory management needed. Customer manages products in Stripe Dashboard. MiniMorph builds the storefront, Stripe handles checkout. |
| **Stripe Checkout + custom catalog** | **Recommended for Small/Medium tier (11–50 products)** | MiniMorph builds a custom product catalog in the database, uses Stripe Checkout for payment. Customer manages products through the MiniMorph admin portal or requests updates through support. |
| **Square** | **Not recommended as primary** | Square is better for in-person sales. Online-only businesses should use Stripe. |
| **Custom catalog (MiniMorph-built)** | **Recommended for Small/Medium tier** | MiniMorph already has Stripe integration. Building a product catalog in the existing database + Stripe Checkout is the most maintainable approach. |

**Final recommendation:** MiniMorph should default to **Stripe Checkout with a custom product catalog** built in the MiniMorph database. This keeps everything within the existing tech stack, avoids third-party platform dependencies, and gives MiniMorph full control over the customer experience.

### 7.4 What MiniMorph Builds vs. What the Customer Manages

| Responsibility | MiniMorph Builds/Manages | Customer Manages |
|---------------|--------------------------|------------------|
| **Website design & development** | MiniMorph | — |
| **Product catalog (initial setup)** | MiniMorph enters products from customer-provided data | Customer provides product data |
| **Product descriptions** | MiniMorph writes (included or upsell) | Customer reviews/approves |
| **Product photography** | — | Customer provides photos |
| **Product photo editing** | MiniMorph (upsell) | Customer provides raw photos |
| **Pricing** | MiniMorph enters | Customer sets prices |
| **Inventory levels** | — | Customer manages inventory |
| **Shipping settings** | MiniMorph configures initial setup | Customer provides rates/carrier info |
| **Tax settings** | MiniMorph configures collection | Customer handles filing/remittance |
| **Payment processing** | MiniMorph sets up Stripe | Customer owns Stripe account |
| **Order fulfillment** | — | Customer ships orders |
| **Customer service / order support** | — | Customer handles order inquiries |
| **Refunds/returns** | — | Customer processes through Stripe |
| **Payment disputes/chargebacks** | — | Customer handles through Stripe |
| **Product updates (ongoing)** | MiniMorph (within monthly support hours) | Customer requests changes |
| **Promotion/discount setup** | MiniMorph (within monthly support hours) | Customer requests promotions |
| **Policy pages** | MiniMorph writes template, customer approves | Customer provides specific terms |
| **Monthly reporting** | MiniMorph provides | — |
| **SEO optimization** | MiniMorph handles | — |
| **Email marketing** | MiniMorph sets up (upsell) | Customer provides content/approves |

### 7.5 Product Upload, Descriptions, Photography, Inventory

**Who uploads products?** MiniMorph enters the initial product catalog from customer-provided data (spreadsheet, list, or verbal description). Ongoing product additions are handled by MiniMorph within monthly support hours, or the customer can request additions through the portal.

**Who writes product descriptions?** Two options: (a) Customer provides descriptions and MiniMorph enters them, or (b) MiniMorph writes descriptions as an upsell ($5–10/product for basic, $10–15/product for SEO-optimized). AI-assisted writing makes this efficient.

**Who handles product photography?** The customer is responsible for product photography. MiniMorph can offer photo editing/background removal as an upsell ($3–5/photo). MiniMorph should never promise to create product photography — this is a specialized skill outside the web design scope.

**Who manages inventory?** The customer manages inventory. MiniMorph should clearly communicate this during onboarding. If the customer uses a 3PL or inventory management system, integration is a custom quote item.

### 7.6 Shipping, Tax, Refunds, Disputes, Order Support

**Shipping/tax settings:** MiniMorph configures the initial shipping rates and tax collection settings based on customer-provided information. The customer is responsible for providing accurate shipping rates and tax nexus information. MiniMorph should recommend Stripe Tax for automated tax calculation as an upsell.

**Refund/return policy:** The customer must provide their return/refund policy. MiniMorph can provide a template, but the customer must approve the final version. The policy must be displayed on the site before launch.

**Payment disputes:** The customer handles all payment disputes and chargebacks through their Stripe account. MiniMorph has no involvement in payment disputes.

**Order support:** The customer handles all order-related customer service (shipping inquiries, order status, product questions from buyers). MiniMorph's support scope is limited to the website itself, not the business operations.

### 7.7 Billing for Product Changes

**Recommendation:** Product changes (adding new products, updating descriptions, changing prices) should be included in the monthly support hours. The ecommerce package should include more monthly support hours than service packages:

| Package | Included Monthly Support Hours |
|---------|-------------------------------|
| Service (Starter) | 1–2 hours |
| Service (Growth) | 2–3 hours |
| Service (Premium) | 3–5 hours |
| **Ecommerce** | **5–8 hours** |

If the customer exceeds monthly support hours, additional time should be billed at $75–100/hour.

### 7.8 How Ecommerce Affects Onboarding

The ecommerce onboarding questionnaire must be significantly expanded (see Section 6.3 above). Key additions:

- Product catalog data collection (structured format — spreadsheet template)
- Shipping configuration questionnaire
- Tax nexus questionnaire
- Payment processing setup (Stripe account creation/connection)
- Return/refund policy collection or creation
- Shipping policy collection or creation
- Product photography assessment
- Inventory management assessment

The onboarding timeline is also longer: 3–4 weeks for ecommerce vs. 1–2 weeks for service websites.

### 7.9 How Ecommerce Affects Contract Terms

Ecommerce contracts should include additional clauses:

- **Scope limitation:** MiniMorph builds and maintains the website. Order fulfillment, customer service, inventory management, tax filing, and payment disputes are the customer's responsibility.
- **Product data accuracy:** Customer is responsible for the accuracy of product descriptions, prices, and availability.
- **Legal compliance:** Customer is responsible for compliance with consumer protection laws, sales tax requirements, and product safety regulations.
- **Payment processing:** Customer owns their Stripe account. MiniMorph is not liable for payment processing issues, chargebacks, or disputes.
- **Liability limitation:** MiniMorph is not liable for lost sales, order errors, shipping issues, or product liability claims.

### 7.10 Legal/Policy Pages Required for Ecommerce

| Page | Required? | Notes |
|------|-----------|-------|
| Privacy Policy | **Required** | Must cover payment data, cookies, analytics, email collection |
| Terms of Service | **Required** | Purchase terms, dispute resolution, liability |
| Return/Refund Policy | **Required** | FTC requires clear return policy for online sales |
| Shipping Policy | **Required** | Shipping times, costs, carriers, international (if applicable) |
| Cookie Policy | **Recommended** | If using analytics, marketing pixels |
| Accessibility Statement | **Recommended** | ADA compliance commitment |
| Terms of Sale | **Recommended** | Separate from ToS — specific to product purchases |

### 7.11 What MiniMorph Should Explicitly Not Promise

- **"We'll manage your inventory"** — No. Customer manages inventory.
- **"We'll handle customer service"** — No. Customer handles order inquiries.
- **"We'll process refunds"** — No. Customer processes through Stripe.
- **"We guarantee X sales per month"** — No. Never guarantee sales volume.
- **"We'll handle your taxes"** — No. Customer handles tax filing.
- **"We'll ship your orders"** — No. Customer handles fulfillment.
- **"We'll handle chargebacks"** — No. Customer handles through Stripe.
- **"Your store will be like Shopify"** — No. It's a custom-built store, not a full platform.
- **"You can add unlimited products"** — No. Product count is tiered.
- **"We'll migrate your existing Shopify/WooCommerce store"** — Not without custom quote.

### 7.12 Recommended Ecommerce Package

| Field | Recommendation |
|-------|---------------|
| **Package Name** | MiniMorph Commerce |
| **Setup Fee** | $999 one-time (covers initial catalog entry, checkout setup, policy pages) |
| **Monthly Fee** | $699/mo |
| **Included Product Count** | Up to 25 products |
| **Extra Product Pricing** | $10/product/month for products 26–50. Above 50 = custom quote. |
| **Included Pages** | 15+ pages (homepage, shop, collections, product pages, about, contact, FAQ, 4 policy pages) |
| **Included Integrations** | Stripe Checkout, basic shipping (flat rate or free-over-X), order confirmation emails, product catalog management |
| **Included Monthly Support** | 5–8 hours (product updates, promotions, content changes) |
| **Included Reports** | Monthly revenue report, traffic report, conversion rate, top products |
| **Optional Upsells** | Email marketing ($49/mo), abandoned cart ($49/mo), analytics ($149 one-time), Meta Pixel ($99 one-time), product descriptions ($5–10/product), photo editing ($3–5/photo), calculated shipping rates ($99 one-time + $29/mo), tax automation ($99 one-time + $19/mo) |
| **Support Boundaries** | Website maintenance only. No order fulfillment, customer service, inventory management, tax filing, or payment dispute handling. |
| **Launch Timeline** | 3–4 weeks from completed onboarding |
| **Risks** | Higher support burden than service sites. Customer may expect Shopify-level features. Product photography quality depends on customer. Scope creep from "can you also..." requests. |
| **Recommended Sales Language** | "We build your online store so you can focus on your products. You handle the business — inventory, shipping, customer service. We handle the website — design, updates, SEO, and monthly reports. Think of us as your web team, not your operations team." |

---


## 8. Onboarding Questionnaire Audit

### 8.1 Current State Assessment

The current MiniMorph onboarding questionnaire (in `client/src/pages/Onboarding.tsx`, `QuestionnaireStep` component) collects the following fields:

| Current Field | Type | Adequate? |
|--------------|------|-----------|
| Business name | Text | Yes |
| Business description | Textarea | Partially — too vague, needs structured prompts |
| Target audience | Textarea | Partially — needs examples/options |
| Preferred style | Select (Modern/Classic/Bold/Minimal/Custom) | Partially — too generic for 5 different industries |
| Color preferences | Text | Partially — should offer palette picker or examples |
| Competitor websites | Textarea | Yes |
| Special requirements | Textarea | Partially — catch-all that doesn't prompt for specifics |

**Verdict: The current questionnaire is a skeleton.** It collects enough to start a conversation but not enough to start a build. For any of the 5 test businesses, the admin would need to go back and ask 15–30 additional questions before design could begin.

### 8.2 Question-by-Question Assessment

**1. Are we asking enough questions for a normal service website?**

No. Missing: service list with descriptions, service area/locations, pricing display preference, booking/contact method preference, hours of operation, CTA preference, photo/asset inventory, domain ownership status, Google Business Profile status, social media links, compliance/licensing info, testimonial/review availability.

**2. Are we asking enough questions for restaurants?**

No. Missing: menu format (PDF, typed, POS integration), number of locations, hours of operation, online ordering preference (Toast, Square, DoorDash, in-house), catering/event inquiry needs, allergen/dietary disclosure needs, liquor license status (affects marketing), delivery/pickup options, seasonal menu changes, event space availability.

**3. Are we asking enough questions for contractors?**

No. Missing: license/certification numbers, service area (radius or zip codes), project types with descriptions, estimate request workflow, financing options, before/after photo availability, warranty/guarantee language, insurance/bonding status, permit handling disclosure, seasonal service changes.

**4. Are we asking enough questions for ecommerce?**

Not at all. Missing: product count, product categories, product variants, pricing structure, shipping method/carrier, tax nexus, return/refund policy, payment processing preference, inventory management status, product photography status, product description status, fulfillment method (self-ship vs. 3PL). See Section 6.3 for the full ecommerce question list.

**5. Which questions should be universal?**

| # | Question | Required? |
|---|----------|-----------|
| 1 | Full business name | Required |
| 2 | Legal/registered business name (if different) | Required |
| 3 | Business type / industry | Required |
| 4 | Business description (what do you do, in 2–3 sentences) | Required |
| 5 | Location(s) / service area | Required |
| 6 | Target customer (who are you trying to reach) | Required |
| 7 | Primary business goal for the website | Required |
| 8 | Do you have a logo? (upload if yes) | Required |
| 9 | Brand colors (pick from palette or describe) | Required |
| 10 | Do you own a domain? If yes, what is it? | Required |
| 11 | Social media links (Facebook, Instagram, Google, etc.) | Optional |
| 12 | Do you have a Google Business Profile? | Optional |
| 13 | Competitor websites you like (up to 3) | Optional |
| 14 | Preferred website style (with visual examples, not just words) | Required |
| 15 | What is the #1 action you want visitors to take? (call, form, book, buy) | Required |
| 16 | Do you have professional photos of your business/work? | Required |
| 17 | Hours of operation | Required |
| 18 | Phone number for the website | Required |
| 19 | Email address for the website | Required |
| 20 | Physical address (if applicable) | Conditional |

**6. Which questions should be conditional by website type?**

| Condition | Additional Questions |
|-----------|---------------------|
| Service business (detailing, landscaping, cleaning, etc.) | Service list with descriptions, service area (map or zip codes), pricing display preference (show prices, "call for quote", packages), booking/scheduling preference, seasonal services |
| Restaurant / food service | Menu format, number of locations, online ordering preference, catering/event inquiries, allergen/dietary info, delivery/pickup, hours per location, liquor license |
| Contractor / home services | License/certification numbers, project types, estimate request workflow, financing options, before/after photos, warranty language, insurance/bonding, permit handling |
| Ecommerce | Product count, categories, variants, pricing structure, shipping, tax, returns, payment processing, inventory, photography, descriptions (see Section 6.3) |
| Professional services (lawyer, accountant, consultant) | Practice areas, credentials/certifications, client intake process, confidentiality notice, bar/license numbers |
| Healthcare / wellness | HIPAA considerations, appointment booking, insurance accepted, provider credentials, patient portal needs |

**7. Which questions should trigger upsell recommendations?**

| Customer Answer | Triggered Upsell |
|----------------|-----------------|
| "I don't have a logo" | Logo design package |
| "I don't have professional photos" | Photography referral or stock photo package |
| "I want to track visitors" | Google Analytics setup |
| "I want to run Facebook/Instagram ads" | Meta Pixel setup |
| "I want to collect emails" | Email marketing setup (Mailchimp/Klaviyo) |
| "I want a chatbot on my site" | AI chat widget |
| "I want to text customers" | SMS integration |
| "I want to sell products" | Ecommerce package or upgrade |
| "I want to rank on Google" | SEO landing pages package |
| "I want a blog" | Blog/content package |
| "I need more than 20 pages" | Custom quote |
| "I want booking/scheduling" | Booking integration upsell |
| "I want reviews on my site" | Review widget integration |
| "I want to accept payments online" | Stripe Payment Links or ecommerce upgrade |

**8. Which questions should trigger custom quote/admin review?**

| Customer Answer | Trigger |
|----------------|---------|
| "I have 50+ products" | Custom ecommerce quote |
| "I need multi-language support" | Custom quote |
| "I need to integrate with my existing CRM/POS/ERP" | Custom quote |
| "I need a customer login/portal" | Custom quote |
| "I need wholesale pricing" | Custom quote |
| "I want to migrate my existing website" | Admin review — scope assessment |
| "I need HIPAA compliance" | Admin review — legal assessment |
| "I need ADA/accessibility certification" | Admin review — compliance assessment |
| "I need real-time inventory sync" | Custom quote |
| "I need subscription/recurring billing" | Custom quote |
| "I need a mobile app" | Not in scope — decline or refer |

**9. Which questions should the AI agent ask in chat instead of form?**

The AI concierge chat during onboarding should handle conversational discovery that doesn't fit neatly into form fields:

- "Tell me about your business in your own words" (then extract structured data)
- "What's the biggest frustration with your current website (or lack of one)?"
- "What do your best customers say about you?"
- "What makes you different from competitors?"
- "What's your timeline — when do you need this live?"
- "Do you have any specific pages or features in mind?"
- "Is there a website you've seen that you love the look of?"
- Follow-up questions based on industry detection

**10. Which questions should be required before build can start?**

| Question | Why Required |
|----------|-------------|
| Business name | Cannot start design without it |
| Business type / industry | Determines template, questions, integrations |
| Primary CTA (what should visitors do) | Determines page structure and conversion flow |
| Logo (or confirmation that logo design is needed) | Cannot start design without it |
| Brand colors (or confirmation to use defaults) | Cannot start design without it |
| Domain status (own one, need one, or undecided) | Affects launch timeline |
| At least 3 photos OR confirmation that stock photos are acceptable | Cannot build gallery/hero sections without imagery |
| Service/product list | Cannot build service/product pages without it |
| Contact info (phone, email, address) | Cannot build contact page without it |

### 8.3 Recommended Onboarding Structure

**A. Universal Business Basics (Required — all customers)**
1. Full business name
2. Legal/registered business name (if different)
3. Business type / industry (dropdown with "Other")
4. Business description (2–3 sentences)
5. Location(s) — address, city, state
6. Service area (if service business) — radius, zip codes, or region
7. Phone number
8. Email address
9. Hours of operation
10. Years in business

**B. Brand & Design (Required — all customers)**
11. Do you have a logo? (upload or "I need one")
12. Brand colors (palette picker with 6 preset palettes + custom)
13. Preferred style (visual examples, not just words — show 4 example screenshots per style)
14. Competitor websites you admire (up to 3 URLs)
15. Any specific design requests or dislikes?

**C. Services / Products (Required — varies by type)**
16. List your top services or products (structured: name, short description, price if displayed)
17. How many services/products? (1–5, 6–15, 16–50, 50+)
18. Do you want to display pricing? (Yes with prices, "Starting at" ranges, "Call for quote", No)
19. Do you have service/product categories?

**D. Goals & Conversion (Required — all customers)**
20. What is the #1 action you want visitors to take? (Call, Fill out form, Book online, Buy product, Get directions, Other)
21. What is your secondary goal? (Build trust, Show portfolio, Educate visitors, Collect emails, Other)
22. Do you currently have a website? (Yes — URL, No, Yes but it's outdated)
23. What's your biggest frustration with your current online presence?

**E. Content & Assets (Required — all customers)**
24. Do you have professional photos? (Yes — upload, No — use stock, Some — upload what you have)
25. Do you have written content (about us, service descriptions)? (Yes, No — write for me, Partial)
26. Do you have testimonials or reviews you'd like featured? (Yes — provide, No, Link to Google reviews)
27. Do you have a tagline or slogan?

**F. Domain / Hosting (Required — all customers)**
28. Do you own a domain? (Yes — what is it, No — I need one, Not sure)
29. Where is your domain registered? (GoDaddy, Namecheap, Google Domains, Not sure, N/A)
30. Do you have existing email addresses on this domain?

**G. Integrations (Optional — all customers)**
31. Do you want Google Analytics tracking? (Yes, No, Not sure)
32. Do you have a Google Business Profile? (Yes — link, No, Not sure)
33. Do you want to collect email addresses for a newsletter? (Yes, No, Not sure)
34. Do you want an AI chat widget on your site? (Yes, No, Not sure)
35. Do you want SMS notifications when someone fills out a form? (Yes, No, Not sure)
36. Do you use any existing tools we should know about? (CRM, POS, booking system, etc.)

**H. Legal / Policies (Conditional — based on business type)**
37. Do you have a privacy policy? (Yes, No — create one for me, Not sure)
38. Do you need terms of service? (Yes, No, Not sure)
39. Any industry-specific compliance needs? (HIPAA, ADA, food safety, licensing, etc.)

**I. Industry-Specific Questions (Conditional — auto-shown based on business type selection)**

*Service businesses:*
40. Service area — map or zip code list
41. Seasonal services? (Yes — which seasons, No)
42. Do you offer free estimates/consultations?
43. Booking/scheduling preference (phone, form, online booking tool)

*Restaurants / food service:*
44. Menu format (upload PDF, type it in, link to POS menu)
45. Number of locations
46. Online ordering preference (Toast, Square, DoorDash, none, in-house)
47. Catering/event inquiries? (Yes, No)
48. Allergen/dietary info to display?
49. Delivery/pickup options

*Contractors / home services:*
50. License/certification numbers to display
51. Project types (list)
52. Do you offer financing? (Yes — which provider, No)
53. Before/after project photos available?
54. Warranty/guarantee language
55. Insurance/bonding status

*Professional services:*
56. Practice areas / specialties
57. Credentials/certifications
58. Client intake process preference

**J. Ecommerce-Specific Questions (Conditional — shown if business type = ecommerce or "I want to sell products")**
59. How many products? (1–10, 11–25, 26–50, 50+)
60. Product categories
61. Product variants? (sizes, colors, etc.)
62. Do you have product descriptions written?
63. Do you have product photography?
64. Shipping method (flat rate, calculated, free over $X)
65. Shipping carrier (USPS, UPS, FedEx, other)
66. Do you charge sales tax? In which states?
67. Return/refund policy
68. Payment methods to accept
69. Do you use a fulfillment service?

**K. Upsell Discovery Questions (Optional — AI uses answers to recommend upsells)**
70. Are you planning to run online ads? (Google, Facebook, Instagram, TikTok)
71. Do you want a blog or content section?
72. Do you want to send email newsletters?
73. Do you want to collect customer reviews automatically?
74. Are you interested in SEO optimization beyond basics?
75. Do you want advanced analytics and conversion tracking?

**L. Admin Review Triggers (System flags — not shown to customer)**

The system should automatically flag for admin review when:
- Product count > 50
- Customer selects "multi-language"
- Customer mentions CRM/POS/ERP integration
- Customer mentions HIPAA or healthcare
- Customer mentions "migrate existing site"
- Customer selects ecommerce + high product count
- Customer mentions wholesale/B2B
- Customer mentions subscription/recurring billing
- Customer mentions mobile app
- Customer's answers suggest scope exceeds selected package

---

## 9. AI Agent Readiness Audit

### 9.1 Test Questions and Ideal Responses

The following 20 questions represent real things customers will ask during onboarding. For each, the ideal AI response, escalation rules, and system support are defined.

**1. "Can you connect my Instagram?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! We can add your Instagram feed directly to your website so visitors see your latest posts. We can also add Instagram links in your header and footer. Would you like the feed embedded on your homepage, a dedicated gallery page, or both?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Included (social links). Instagram feed embed = upsell ($49 one-time) |
| **Backend support** | Social links are part of standard build. Feed embed requires third-party widget (Elfsight, Curator.io, or custom). |
| **Policy/legal guardrail** | None needed |

**2. "Can customers book appointments?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We can set up a booking system on your site. The simplest option is embedding a booking tool like Calendly or Square Appointments. If you need something more custom, we can build a quote request form that sends you notifications. What kind of appointments do your customers book?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if customer needs custom booking logic |
| **Classification** | Basic form = included. Booking tool embed = upsell ($99 one-time). Custom booking system = custom quote. |
| **Backend support** | Contact/quote forms are built-in. Third-party booking embeds are straightforward. |
| **Policy/legal guardrail** | None needed |

**3. "Can I sell products?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes, we can set up an online store for you! The scope depends on how many products you have. For a small catalog (under 25 products), we can build a beautiful storefront with Stripe checkout. For larger catalogs, we'd need to discuss a custom ecommerce package. How many products are you looking to sell?" |
| **Can AI answer automatically?** | Yes — but must ask follow-up about product count |
| **Escalate to human?** | Yes, if product count > 25 or customer mentions wholesale/subscriptions |
| **Classification** | Small catalog (1–25) = ecommerce package. Large catalog (26+) = custom quote. |
| **Backend support** | Stripe checkout exists. Product catalog would need to be built. |
| **Policy/legal guardrail** | Must not promise Shopify-level features. Must clarify customer handles fulfillment/shipping/returns. |

**4. "Can you connect Stripe?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Stripe is already built into our platform! We use Stripe for all payment processing. If you need to accept payments on your website — whether it's for services, products, or deposits — we've got you covered. Do you already have a Stripe account, or do you need help setting one up?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Included |
| **Backend support** | Stripe is fully integrated (checkout sessions, webhooks, subscription management). |
| **Policy/legal guardrail** | None needed |

**5. "Can you connect Shopify?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We don't integrate directly with Shopify because we build custom websites, not Shopify themes. However, if you're looking to sell products online, we can build a storefront with our built-in Stripe checkout that gives you a beautiful, custom shopping experience. If you specifically need Shopify's platform features (like their app ecosystem or multi-channel selling), Shopify might be a better fit for your store, and we can help you with a Shopify setup as a one-time project. What's most important to you?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Yes, if customer insists on Shopify integration |
| **Classification** | Not supported as integration. Shopify setup = custom quote (one-time project). |
| **Backend support** | None — Shopify is a separate platform. |
| **Policy/legal guardrail** | Must not promise Shopify integration. Must be honest about what MiniMorph is vs. what Shopify is. |

**6. "Can I add Google Analytics?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Absolutely! We can set up Google Analytics on your site so you can track visitors, page views, and conversions. We'll need your Google Analytics tracking ID (or we can help you create an account). This is one of our most popular add-ons. Would you like us to set it up?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Upsell ($149 one-time setup) — or included in Growth/Premium packages |
| **Backend support** | Google Analytics script injection is straightforward. |
| **Policy/legal guardrail** | Must add cookie/analytics disclosure to privacy policy. |

**7. "Can you set up my Google Business Profile?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We can help optimize your existing Google Business Profile with updated info, photos, and a link to your new website. If you don't have one yet, we can guide you through creating one — but you'll need to verify it yourself since Google requires the business owner to complete verification. Would you like us to add GBP optimization to your package?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | GBP link on website = included. GBP optimization = upsell ($99 one-time). GBP creation = guided (customer must verify). |
| **Backend support** | Google Maps integration exists in the platform. |
| **Policy/legal guardrail** | Cannot access customer's Google account. Customer must own/verify GBP. |

**8. "Can you text me when someone fills out a form?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! We can set up SMS notifications so you get a text message every time someone submits a form on your site. You'll get the lead's name, contact info, and message right to your phone. This is a great way to respond quickly to leads. Would you like to add this?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Upsell ($29/mo) — Twilio SMS integration |
| **Backend support** | Twilio integration exists in the platform. SMS sending is functional. |
| **Policy/legal guardrail** | SMS consent language needed. Must comply with TCPA for business-to-business SMS. |

**9. "Can I change photos every month?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! Your monthly plan includes support hours for updates like photo changes. For Starter plans, you get 1–2 hours of updates per month. Growth plans include 2–3 hours, and Premium plans include unlimited updates. If you need frequent photo updates, we can also set up a simple process where you upload photos through your portal and we swap them in. How often do you expect to update photos?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Included (within monthly support hours) |
| **Backend support** | Asset upload exists in the onboarding portal. |
| **Policy/legal guardrail** | Customer must own rights to photos. |

**10. "Can you write my product descriptions?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! We can write product descriptions for you as an add-on service. For basic descriptions, it's $5–10 per product. For SEO-optimized descriptions that help you rank on Google, it's $10–15 per product. We use AI-assisted writing reviewed by our team to make sure everything sounds natural and accurate. How many products do you need descriptions for?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if product count > 50 |
| **Classification** | Upsell (per-product pricing) |
| **Backend support** | LLM integration exists for AI-assisted content generation. |
| **Policy/legal guardrail** | Customer must review and approve all descriptions. No false product claims. |

**11. "Can you handle my domain?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! If you already own a domain, we'll help you point it to your new site — we'll walk you through the DNS changes or handle them for you if you give us access. If you need a new domain, we can help you register one. Domain setup is included in all plans. What's your current domain situation?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if complex DNS situation (existing email, multiple subdomains) |
| **Classification** | Included |
| **Backend support** | Domain preference collection exists in onboarding. DNS instructions are standard. |
| **Policy/legal guardrail** | Customer must own the domain. MiniMorph should never register domains in MiniMorph's name. |

**12. "Do I own the site?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "You own all the content — your text, photos, logo, and brand materials are yours. The website itself is hosted and maintained by MiniMorph as part of your monthly plan. If you cancel, we can export your content and provide you with the files. Think of it like renting a beautifully designed storefront — you own everything inside it, and we maintain the building." |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if customer pushes for source code ownership |
| **Classification** | Policy question |
| **Backend support** | N/A — policy question |
| **Policy/legal guardrail** | Must be clear about what "ownership" means. Content = customer's. Code/hosting = MiniMorph's. Must be in contract terms. |

**13. "What happens if I cancel?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "If you cancel, your website will be taken offline at the end of your billing period. We'll export your content (text, images, files) and send it to you so you have everything. There's no cancellation fee — you can cancel anytime. We do recommend giving us 30 days' notice so we can prepare your content export. Is there something specific you're concerned about?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Yes — if customer is actively trying to cancel (retention opportunity) |
| **Classification** | Policy question |
| **Backend support** | Subscription cancellation exists via Stripe. Content export would need to be manual or built. |
| **Policy/legal guardrail** | Must honor cancellation terms in contract. No hidden fees. Must provide content export. |

**14. "Can you guarantee I rank on Google?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We can't guarantee specific Google rankings — no one honestly can, because Google's algorithm considers hundreds of factors and changes regularly. What we do guarantee is that your site will be built with SEO best practices: fast loading, mobile-friendly, proper meta tags, structured data, and optimized content. Many of our clients see significant improvements in their local search visibility within 3–6 months. We also offer ongoing SEO services if you want to invest more in search rankings." |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Policy question — SEO is included (basic). Advanced SEO = upsell. |
| **Backend support** | Basic SEO is part of the build process. |
| **Policy/legal guardrail** | **Critical: Must NEVER guarantee rankings.** FTC considers ranking guarantees deceptive. Must use language like "best practices," "optimization," "improved visibility" — never "guaranteed #1 ranking." |

**15. "Can I add an AI chatbot?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Yes! We offer an AI chat widget that can answer common questions about your business, help visitors find information, and even collect leads when you're not available. It's trained on your business information so it gives accurate, helpful answers. It's available as an add-on for $39/month. Would you like to add it?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | No |
| **Classification** | Upsell ($39/mo) |
| **Backend support** | AI chat widget exists in the widget catalog. LLM integration is functional. |
| **Policy/legal guardrail** | Must disclose that it's an AI, not a human. Must not make promises or commitments on behalf of the business. |

**16. "Can you connect Toast/Square?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We can link to your Toast or Square online ordering page from your website — for example, a prominent 'Order Online' button that takes customers to your existing ordering system. We don't build a custom ordering system inside your website because Toast and Square already handle that really well. If you want the ordering experience to feel more integrated, we can embed it in an iframe or style the link to match your site. Which platform do you use?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if customer wants deep POS integration |
| **Classification** | Link/button = included. Embed = upsell ($49 one-time). Deep integration = custom quote. |
| **Backend support** | External links are trivial. Iframe embeds are straightforward. |
| **Policy/legal guardrail** | None needed |

**17. "Can you make a bilingual site?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Bilingual sites are possible but they're a bigger project than a standard site — essentially you need two versions of every page. We can do this as a custom project. The most common approach is a language toggle that switches between English and Spanish (or another language). Can you tell me which languages you need, and do you have translated content already or would you need us to translate it?" |
| **Can AI answer automatically?** | Yes — but must flag for admin review |
| **Escalate to human?** | Yes — custom quote required |
| **Classification** | Custom quote |
| **Backend support** | No built-in i18n/multilingual support in the current platform. Would need to be built per-project. |
| **Policy/legal guardrail** | Translation accuracy is customer's responsibility. MiniMorph should not guarantee translation quality unless using professional translators. |

**18. "Can you migrate my old site?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "We can! Migration depends on what you have now. If you have a WordPress, Wix, or Squarespace site, we can pull your content (text, images) and rebuild it in our platform with a fresh, modern design. We don't do a 1:1 copy — we redesign it to look better and perform better. If you have a complex site with a database, user accounts, or ecommerce history, that's a bigger project and we'd need to scope it out. What platform is your current site on?" |
| **Can AI answer automatically?** | Yes — but must flag for admin review |
| **Escalate to human?** | Yes — scope assessment needed |
| **Classification** | Simple content migration = included (within build hours). Complex migration = custom quote. |
| **Backend support** | No automated migration tools. Manual content extraction. |
| **Policy/legal guardrail** | Must verify customer owns the content being migrated. Cannot copy copyrighted content from other sites. |

**19. "Can you add 200 products?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "200 products is a large catalog — that's beyond our standard ecommerce package, which covers up to 25 products. For a catalog that size, we'd need to put together a custom quote that accounts for the product entry, photography requirements, and ongoing management. For catalogs over 50 products, we also recommend considering whether a dedicated ecommerce platform like Shopify might be a better fit for your needs. Can we schedule a call to discuss your product catalog in detail?" |
| **Can AI answer automatically?** | Yes — but must escalate |
| **Escalate to human?** | Yes — custom quote required |
| **Classification** | Custom quote (above 50 products). May recommend Shopify for 200+. |
| **Backend support** | No product catalog management system currently built. |
| **Policy/legal guardrail** | Must not promise to handle 200 products at standard pricing. Must be transparent about scope. |

**20. "Can I get more revisions?"**

| Field | Answer |
|-------|--------|
| **Ideal AI Answer** | "Your plan includes revision rounds during the build process — typically 2–3 rounds depending on your package. If you need additional revisions beyond that, we offer extra revision blocks at $99 per round. After launch, your monthly plan includes support hours for ongoing changes. Most customers find the included revisions are plenty, but we're flexible if you need more. What kind of changes are you thinking about?" |
| **Can AI answer automatically?** | Yes |
| **Escalate to human?** | Only if customer is unhappy with revision limit |
| **Classification** | Included (standard rounds). Extra revisions = upsell ($99/round). |
| **Backend support** | Revision tracking exists in onboarding (submitFeedback procedure). |
| **Policy/legal guardrail** | Must be clear about what counts as a "revision" vs. a "new feature request." |

### 9.2 AI Agent Readiness Summary

| Category | Ready? | Notes |
|----------|--------|-------|
| **Can answer basic questions** | Partially | The AI concierge chat exists but doesn't have a structured knowledge base of these answers. It relies on LLM general knowledge + onboarding project context. |
| **Knows MiniMorph packages** | No | Package details are in `stripe-products.ts` and `Pricing.tsx` but not injected into the AI's system prompt. |
| **Knows pricing for upsells** | No | No structured upsell pricing exists. Widget catalog has some items but no comprehensive price list. |
| **Knows what's included vs. upsell** | No | No structured classification of included vs. upsell features. |
| **Can detect scope creep** | No | No triggers for "this exceeds your package" detection. |
| **Can escalate to human** | Partially | The conversation AI can set `assignedRepId` on leads, but the onboarding chat doesn't have an escalation mechanism. |
| **Respects legal guardrails** | No | No explicit legal guardrails in the AI system prompt (e.g., "never guarantee rankings"). |
| **Asks follow-up questions** | Partially | The onboarding chat asks questions but doesn't have a structured checklist of required info per business type. |

**Key gap:** The AI agent needs a structured knowledge base injected into its system prompt that includes: package details, pricing, included vs. upsell classification, legal guardrails, escalation triggers, and industry-specific question checklists. Currently it's operating on general LLM knowledge, which means it might give incorrect pricing, promise features that don't exist, or fail to escalate when it should.

---


## 10. Sample / Demo Website Strategy

### 10.1 Should MiniMorph Create Demo Sites?

**Yes.** Demo sites serve three critical purposes: (1) they prove to prospects that MiniMorph can build their type of site, (2) they give the sales team concrete examples to reference during outreach, and (3) they give the AI agent something to link to when a customer asks "what would my site look like?"

Demo sites should be clearly labeled as demos — never presented as client work, never with fake testimonials, never with fake results.

### 10.2 Demo Site Specifications

**Demo 1 — Auto Detailing**

| Field | Detail |
|-------|--------|
| **Demo Name** | Lakeshore Auto Detailing (Demo) |
| **Route/Path** | `/demos/auto-detailing` or subdomain `auto-detailing.minimorph.studio` |
| **Design Style** | Premium dark theme, high-contrast, automotive luxury. Charcoal (#1A1A2E) background, electric blue (#00D4FF) accents, gold (#C9A84C) highlights. |
| **Sections/Pages** | Hero with detailing video/photo, services grid (Interior, Exterior, Ceramic, Paint Correction), pricing packages, before/after gallery, testimonials section (placeholder with disclaimer), quote request form, about section, contact/location. |
| **What It Proves** | MiniMorph can build premium, visually striking service websites with booking/quote flows, gallery sections, and trust elements. |
| **Disclaimer Language** | "This is a demo website created by MiniMorph Studios to showcase what we can build for auto detailing businesses. All business information, testimonials, and imagery are for demonstration purposes only." |
| **CTA Back to MiniMorph** | "Want a site like this for your business? Get started at minimorph.studio" — sticky banner or footer CTA. |
| **Can be used in public website makeover?** | Yes — as a "before/after" concept showing what a detailing business could look like with MiniMorph. |

**Demo 2 — Landscaping**

| Field | Detail |
|-------|--------|
| **Demo Name** | Q's Landscaping (Demo) |
| **Route/Path** | `/demos/landscaping` or subdomain `landscaping.minimorph.studio` |
| **Design Style** | Clean, earthy, natural. Sage green (#5A7247) primary, warm brown (#8B6F47) accent, cream (#F5F0E8) background. Organic shapes, leaf motifs. |
| **Sections/Pages** | Hero with landscape photo, seasonal services (Spring Cleanup, Mowing, Fall Cleanup, Snow Removal), service area map, project gallery (before/after), free estimate form, testimonials, about/team, contact. |
| **What It Proves** | MiniMorph can build seasonal service businesses with service area targeting, before/after galleries, and seasonal campaign capability. |
| **Disclaimer Language** | "Demo concept built by MiniMorph Studios to show what we can create for landscaping and lawn care businesses." |
| **CTA Back to MiniMorph** | "Your landscaping business deserves a website this good. Get started at minimorph.studio" |
| **Can be used in public website makeover?** | Yes — especially effective for seasonal businesses. |

**Demo 3 — Restaurant / Food**

| Field | Detail |
|-------|--------|
| **Demo Name** | G&L Chillidog Refreshers (Demo) |
| **Route/Path** | `/demos/restaurant` or subdomain `restaurant.minimorph.studio` |
| **Design Style** | Bright, fun, nostalgic. Mustard yellow (#F4A300) primary, ketchup red (#D32F2F) accent, cream (#FFF8E7) background. Retro diner typography, playful layout. |
| **Sections/Pages** | Hero with food photography, menu section (visual menu with photos), location/hours with Google Maps embed, catering/events inquiry form, social media feed, about/story section, contact. |
| **What It Proves** | MiniMorph can build restaurants with visual menus, location info, event inquiry flows, and fun brand-appropriate design that doesn't look like every other restaurant template. |
| **Disclaimer Language** | "Demo concept built by MiniMorph Studios to show what we can create for restaurants and food businesses." |
| **CTA Back to MiniMorph** | "Hungry for a website this good? Get started at minimorph.studio" |
| **Can be used in public website makeover?** | Yes — restaurants are a huge market and this demo would be very shareable. |

**Demo 4 — Contractor**

| Field | Detail |
|-------|--------|
| **Demo Name** | Shoreline Concrete & Coatings (Demo) |
| **Route/Path** | `/demos/contractor` or subdomain `contractor.minimorph.studio` |
| **Design Style** | Rugged, professional, industrial. Slate gray (#2C3E50) primary, safety orange (#E67E22) accent, concrete texture (#D5D5D5) background. Bold typography, strong grid layout. |
| **Sections/Pages** | Hero with project photo, services (Driveways, Patios, Garage Floors, Commercial), project gallery with categories, free estimate form, financing inquiry section, credentials/licensing display, testimonials, service area, about/team, contact. |
| **What It Proves** | MiniMorph can build trust-heavy contractor sites with project galleries, estimate forms, credential displays, and professional design that competes with national brands. |
| **Disclaimer Language** | "Demo concept built by MiniMorph Studios to show what we can create for contractors and home service businesses." |
| **CTA Back to MiniMorph** | "Build trust with a website that works as hard as you do. Get started at minimorph.studio" |
| **Can be used in public website makeover?** | Yes — contractors are a prime target market. |

**Demo 5 — Ecommerce**

| Field | Detail |
|-------|--------|
| **Demo Name** | Festival Hammock Supply Co. (Demo) |
| **Route/Path** | `/demos/ecommerce` or subdomain `shop.minimorph.studio` |
| **Design Style** | Lifestyle-driven, adventure-focused. Forest green (#2D5A27) primary, sunset orange (#E8732A) accent, warm white (#FEFCF6) background. Outdoor photography, clean product grid. |
| **Sections/Pages** | Hero with lifestyle photo, featured products grid, collection pages (Single Hammocks, Double Hammocks, Accessories, Bundles), product detail page (with photo gallery, variants, add to cart), about/brand story, FAQ, shipping/returns policy, contact. Note: checkout would be non-functional in demo — "Add to Cart" shows a toast: "This is a demo — checkout is disabled." |
| **What It Proves** | MiniMorph can build ecommerce storefronts with product catalogs, variant selection, and a shopping experience — even though full checkout requires the ecommerce package. |
| **Disclaimer Language** | "Demo concept built by MiniMorph Studios to show what we can create for online stores. Products, prices, and checkout are for demonstration purposes only." |
| **CTA Back to MiniMorph** | "Ready to sell online? Get started at minimorph.studio" |
| **Can be used in public website makeover?** | Yes — but must be clear that ecommerce is a separate package with different pricing. |

### 10.3 Demo Site Implementation Notes

Demo sites should be built as static pages within the MiniMorph public website (or as separate subdomains). They should not use the full MiniMorph platform backend — they are marketing assets, not functional applications. Each demo should load fast, look stunning on mobile, and have a clear CTA back to MiniMorph.

The demos should be built after the public website redesign (Phase G) so they match the overall MiniMorph brand while showcasing different design styles for different industries.

---

## 11. Final Report — Comparison Tables, Matrices, and Implications

### 11.1 Five-Site Comparison Table

| Dimension | Auto Detailing | Landscaping | Restaurant | Contractor | Ecommerce |
|-----------|---------------|-------------|------------|------------|-----------|
| **Design Style** | Premium dark, automotive luxury | Clean, earthy, natural | Bright, fun, nostalgic | Rugged, professional, industrial | Lifestyle, adventure-focused |
| **Current Package Fit** | Growth ($299/mo) | Growth ($299/mo) | Growth ($299/mo) | Premium ($499/mo) | None — new package needed |
| **Onboarding Ready?** | No — missing service list, booking preference, pricing display, service area questions | No — missing seasonal services, service area map, before/after photo questions | No — missing menu format, ordering preference, catering, allergen questions | No — missing license/cert, project types, financing, warranty questions | No — missing product count, shipping, tax, inventory, return policy questions |
| **Fulfillment Ready?** | Mostly — standard build with quote form and gallery | Mostly — standard build with seasonal content and gallery | Mostly — needs menu handling and POS link integration | Partially — needs project gallery and estimate form complexity | No — needs product catalog, checkout, shipping/tax setup |
| **Integrations Needed** | Quote form, Google Analytics, GBP link, review widget, SMS alerts | Quote form, Google Analytics, GBP link, seasonal landing pages, SMS alerts | Menu embed/link, Google Maps, social feed, email capture, Toast/Square link | Estimate form, photo gallery, Google reviews, financing inquiry, CRM handoff | Product catalog, Stripe checkout, shipping, tax, email marketing, analytics |
| **Top Upsells** | AI chat ($39/mo), Google Analytics ($149), SMS alerts ($29/mo), review widget ($29/mo) | Seasonal landing pages ($99 each), Google Analytics ($149), SMS alerts ($29/mo), before/after gallery ($49) | Menu design ($99), Google Analytics ($149), email capture ($49/mo), social feed ($49) | Google Analytics ($149), financing form ($99), SMS alerts ($29/mo), SEO pages ($149/mo) | Email marketing ($49/mo), abandoned cart ($49/mo), analytics ($149), Meta Pixel ($99) |
| **Risk Level** | Low | Low | Low-Medium | Medium | High |
| **Can Sell Today?** | Yes — Growth package | Yes — Growth package | Yes — Growth package (with menu handling clarification) | Yes — Premium package | No — needs ecommerce package |
| **Estimated Build Hours** | 15–20 | 15–20 | 18–22 | 22–28 | 40–60 |
| **Monthly Support Burden** | 1–2 hours | 2–3 hours (seasonal changes) | 2–3 hours (menu updates) | 2–3 hours | 5–10 hours |

### 11.2 Integration / Upsell Matrix

| Integration | Auto Detail | Landscaping | Restaurant | Contractor | Ecommerce | Classification |
|-------------|:-----------:|:-----------:|:----------:|:----------:|:---------:|---------------|
| Contact/Quote Form | Included | Included | Included | Included | N/A | Included |
| Google Analytics | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($149 one-time) |
| Google Business Profile Link | Included | Included | Included | Included | N/A | Included |
| Google Maps Embed | Included | Included | Included | Included | N/A | Included |
| Social Media Links | Included | Included | Included | Included | Included | Included |
| SMS Lead Alerts | Upsell | Upsell | Upsell | Upsell | N/A | Upsell ($29/mo) |
| AI Chat Widget | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($39/mo) |
| Review Widget | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($29/mo) |
| Email Capture / Newsletter | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($49/mo) |
| Meta Pixel | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($99 one-time) |
| Google Tag Manager | Upsell | Upsell | Upsell | Upsell | Upsell | Upsell ($99 one-time) |
| Booking/Scheduling Tool | Upsell | N/A | N/A | N/A | N/A | Upsell ($99 one-time) |
| Before/After Gallery | Included | Included | N/A | Included | N/A | Included |
| Menu Embed/Link | N/A | N/A | Included | N/A | N/A | Included |
| Toast/Square Link | N/A | N/A | Included | N/A | N/A | Included |
| Seasonal Landing Pages | N/A | Upsell | N/A | N/A | N/A | Upsell ($99 each) |
| Financing Inquiry Form | N/A | N/A | N/A | Upsell | N/A | Upsell ($99 one-time) |
| CRM/Webhook/Zapier | Custom | Custom | Custom | Custom | Custom | Custom quote |
| Stripe Checkout | N/A | N/A | N/A | N/A | Included (ecom) | Ecommerce package |
| Product Catalog | N/A | N/A | N/A | N/A | Included (ecom) | Ecommerce package |
| Abandoned Cart Emails | N/A | N/A | N/A | N/A | Upsell | Upsell ($49/mo) |
| Shipping Rate Calculator | N/A | N/A | N/A | N/A | Custom | Custom quote |
| Tax Automation | N/A | N/A | N/A | N/A | Custom | Custom quote |
| Shopify Integration | N/A | N/A | N/A | N/A | Not rec. | Not recommended |
| WooCommerce | N/A | N/A | N/A | N/A | Not rec. | Not recommended |
| Multilingual | Custom | Custom | Custom | Custom | Custom | Custom quote |

### 11.3 Ecommerce Package Recommendation

Based on the stress test, MiniMorph should create a dedicated ecommerce package:

| Field | Recommendation |
|-------|---------------|
| **Package Name** | MiniMorph Commerce |
| **Setup Fee** | $999 one-time |
| **Monthly Fee** | $699/mo |
| **Included Products** | Up to 25 |
| **Extra Products** | $10/product/month (26–50). Above 50 = custom quote. |
| **Included Pages** | 15+ (homepage, shop, collections, product pages, about, contact, FAQ, 4 policy pages) |
| **Included Integrations** | Stripe Checkout, flat-rate shipping, order confirmation emails, product catalog |
| **Monthly Support** | 5–8 hours |
| **Optional Upsells** | Email marketing ($49/mo), abandoned cart ($49/mo), analytics ($149), Meta Pixel ($99), product descriptions ($5–10/product), photo editing ($3–5/photo), calculated shipping ($99 + $29/mo), tax automation ($99 + $19/mo) |
| **Support Boundaries** | Website only. Customer handles fulfillment, customer service, inventory, tax filing, disputes. |
| **Launch Timeline** | 3–4 weeks |
| **Sales Language** | "We build your online store so you can focus on your products." |

### 11.4 Required System Changes

These are changes needed to support the findings of this audit. They are listed as future work items, not immediate code changes.

| # | Change | Priority | Scope | Affects |
|---|--------|----------|-------|---------|
| 1 | **Expand onboarding questionnaire** — add industry-specific conditional questions per Section 8.3 | High | Frontend + Schema | Onboarding quality |
| 2 | **Add business type selection** — first question in onboarding that triggers conditional question sets | High | Frontend + Schema | Onboarding routing |
| 3 | **Create AI knowledge base** — structured JSON/prompt with package details, pricing, included vs. upsell, legal guardrails, escalation triggers | High | Server (AI prompt) | AI agent accuracy |
| 4 | **Add ecommerce package** to `stripe-products.ts` and `Pricing.tsx` | Medium | Server + Frontend | Package offering |
| 5 | **Build product catalog system** — products table, admin CRUD, customer-facing product pages | Medium | Schema + Server + Frontend | Ecommerce capability |
| 6 | **Add upsell pricing catalog** — structured list of all upsells with prices, one-time vs. monthly, descriptions | Medium | Schema + Server | Upsell automation |
| 7 | **Add admin review triggers** — auto-flag onboarding submissions that exceed package scope | Medium | Server | Scope management |
| 8 | **Add onboarding stage email notifications** — already wired in Gap Repair, but need to verify all stage transitions trigger emails | Low | Already done | Customer communication |
| 9 | **Build demo sites** — 5 static demo pages showcasing different industries | Low | Frontend | Sales/marketing |
| 10 | **Add content export** — ability to export customer's content (text, images) when they cancel | Low | Server | Contract compliance |

### 11.5 Public Website Implications

The current MiniMorph public website (Home, GetStarted, FreeAudit, Pricing) needs updates to reflect the findings:

1. **Pricing page** needs to show the ecommerce package (when ready) or at minimum a "Custom Quote" option for ecommerce.
2. **GetStarted page** should ask "What type of website do you need?" before showing packages — this routes customers to the right package and prevents ecommerce customers from buying a Starter plan.
3. **Home page** should showcase demo sites (when built) as proof of capability across industries.
4. **FreeAudit page** works well as a lead magnet but should mention the types of businesses MiniMorph serves.
5. **FAQ section** should address the 20 common questions from Section 9.1.

These changes should be made during the public website redesign (Phase G), not now.

### 11.6 Pricing / Package Implications

| Current Package | Assessment | Recommended Change |
|----------------|------------|-------------------|
| Starter ($149/mo, 5 pages) | Adequate for very simple businesses (single-service, single-location) | Keep as-is. Add clarity on what's included vs. upsell. |
| Growth ($299/mo, 10 pages) | Best fit for most service businesses (auto detailing, landscaping, restaurants) | Keep as-is. This is the workhorse package. |
| Premium ($499/mo, 20+ pages) | Fits contractors and complex service businesses | Remove "e-commerce integration" claim — it's misleading at this price point. Replace with "advanced integrations." |
| **Ecommerce (NEW)** | Does not exist yet | Create at $699/mo + $999 setup. See Section 11.3. |
| **Custom Quote** | No formal process | Create a "Custom Quote" option on the pricing page for businesses that don't fit standard packages. |

### 11.7 Legal / Compliance Implications

| Area | Current State | Recommendation |
|------|--------------|----------------|
| **SEO guarantee language** | Not audited in public site copy | Must never guarantee rankings. Use "optimization" and "best practices" language only. |
| **Ecommerce liability** | No ecommerce terms exist | Need clear contract language separating MiniMorph's website responsibility from customer's business operations (fulfillment, returns, disputes, tax). |
| **Content ownership** | Not explicitly stated | Need clear contract language: customer owns content, MiniMorph owns code/platform. Content export on cancellation. |
| **Testimonial/review use** | Demo sites must not fake testimonials | All demo sites must have clear disclaimer language. Never fabricate reviews or results. |
| **AI chatbot disclosure** | AI chat widget exists | Must disclose to end users that they're chatting with AI, not a human. |
| **SMS consent** | Twilio integration exists | Must have explicit SMS consent language before sending any SMS to leads or customers. |
| **Email marketing consent** | Resend integration exists | Must comply with CAN-SPAM. Unsubscribe mechanism exists (verified in prior audit). |
| **Privacy policy** | Not audited for customer sites | Each customer site needs a privacy policy. MiniMorph should provide a template. |
| **Accessibility** | Not audited | Should offer accessibility review as an upsell. Not required but increasingly expected. |

### 11.8 Exact Next Surgical Prompts Needed

The following prompts are the exact next steps to implement the findings of this audit. They should be executed in order.

**Prompt 1 — Expand Onboarding Questionnaire**
> Add business type selection as the first onboarding question (dropdown: Service Business, Restaurant/Food, Contractor/Home Services, Ecommerce/Online Store, Professional Services, Other). Based on selection, show conditional question sets per Section 8.3 of the fulfillment stress test. Store the business type in the `onboarding_projects` table as a new `businessType` column. Update the `submitQuestionnaire` procedure to accept the expanded fields. Update the `QuestionnaireStep` component to render conditional sections. Do not change any other onboarding stages.

**Prompt 2 — Create AI Agent Knowledge Base**
> Create a structured knowledge base file at `server/ai-knowledge-base.ts` that exports a function `getAIKnowledgeBase()` returning a string. The string should contain: MiniMorph package details (Starter, Growth, Premium, future Commerce), pricing for all upsells (from Section 9.1), classification of included vs. upsell vs. custom quote features, legal guardrails (never guarantee rankings, never promise sales volume, never fake testimonials), escalation triggers (product count > 25, multilingual, CRM integration, HIPAA, migration), and the 20 ideal AI responses from Section 9.1. Inject this knowledge base into the system prompt of the `onboardingChat` and `portalChat` procedures in `routers.ts`. Do not change any other AI behavior.

**Prompt 3 — Add Ecommerce Package to Stripe Products**
> Add a new package to `server/stripe-products.ts` called "Commerce" with setup fee $999 and monthly fee $699. Add it to the `Pricing.tsx` component with appropriate feature list. Add a "Custom Quote" option below the packages that links to a contact form. Update the `createCheckout` procedure to handle the new package. Do not change existing packages.

**Prompt 4 — Build Demo Sites**
> Create 5 static demo pages as routes within the MiniMorph public website: `/demos/auto-detailing`, `/demos/landscaping`, `/demos/restaurant`, `/demos/contractor`, `/demos/ecommerce`. Each should be a single-page showcase with the design direction from the fulfillment stress test (Sections 2.5, 3.5, 4.5, 5.5, 6.5). Each must include a disclaimer banner and a CTA back to MiniMorph. Use placeholder content — do not fake testimonials or results. These are marketing pages, not functional applications.

**Prompt 5 — Add Admin Review Triggers**
> Add an `adminReviewRequired` boolean column to the `onboarding_projects` table. In the `submitQuestionnaire` procedure, set this flag to `true` when: businessType is "Ecommerce" and product count > 25, customer mentions "multilingual" or "bilingual" in any text field, customer mentions "migrate" or "migration", customer mentions "HIPAA" or "healthcare", or customer selects integrations that exceed their package tier. Add a filter on the admin OnboardingProjects page to show flagged projects prominently. Send an owner notification when a project is flagged.

---

*End of MiniMorph Fulfillment Stress Test Report*
