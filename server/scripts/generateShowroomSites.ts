import "dotenv/config";
import { getBestImage } from "../services/imageService";
import { createPagesProject, deployToPages, addCustomDomain } from "../services/cloudflareDeployment";
import { ENV } from "../_core/env";

// Call Anthropic directly with extended output beta (64K tokens) for large HTML generation
async function generateHtml(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "output-128k-2025-02-19",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json() as any;
  return data.content?.[0]?.text ?? "";
}

// Inlined to avoid importing siteGenerator.ts which pulls in db.ts (MySQL connection)
const PREMIUM_REQUIREMENTS = `== PREMIUM SHOWCASE REQUIREMENTS ==
This is a MiniMorph Studios showcase demo site.
It must look world-class — better than 90% of all small business websites on the internet.

STYLING APPROACH — TAILWIND CSS (CRITICAL):
- Include in <head>: <script src="https://cdn.tailwindcss.com"></script>
- Use ONLY Tailwind utility classes for all styling
- NO <style> block — zero custom CSS written by you
- For brand colors use arbitrary values: bg-[#e07b39] text-[#1a1a1a] border-[#c8934a]
- For gradients: bg-gradient-to-br from-[#color1] to-[#color2]
- Google Fonts: one <link> in head for the chosen font pair, apply via font-[family] or add to tailwind config inline script

REQUIRED DESIGN STANDARDS (using Tailwind):
- Hero: min-h-screen flex items-center, large serif font, prominent CTA button
- Navigation: sticky top-0 bg-opacity-90 backdrop-blur-sm, logo left + CTA right
- Cards: shadow-xl rounded-2xl with hover:scale-105 transition-transform
- Section padding: py-20 lg:py-32, max-w-7xl mx-auto px-4
- Buttons: rounded-full px-8 py-4 font-semibold with hover state color change
- Responsive: use sm: md: lg: prefixes — mobile-first

REQUIRED TYPOGRAPHY (Tailwind):
- Headlines: text-6xl lg:text-8xl font-bold font-serif
- Section headlines: text-4xl lg:text-5xl font-bold
- Body: text-lg leading-relaxed text-gray-600

REQUIRED CONTENT STANDARDS:
- Every page has minimum 6 full sections
- Zero placeholder text — all copy is specific, compelling, and written for that exact business
- Real pricing, real service names, real details
- Testimonials include specific results and numbers
- CTAs are large, prominent, colored with hover effects
- Navigation has business logo/name + CTA button

ADD-ON SHOWCASE REQUIREMENTS:
Each add-on must be VISUALLY PRESENT on the page.

Review Collector widget:
<div style='background:#f8f9fa;border-radius:12px;padding:24px;max-width:480px'>
<div style='color:#fbbc04;font-size:20px'>STAR STAR STAR STAR STAR</div>
<p style='font-style:italic;margin:8px 0'>[specific review text for this business]</p>
<p style='font-weight:600'>[Reviewer Name]</p>
<p style='font-size:13px;color:#666'>via Google Reviews</p>
</div>

Booking Widget:
<div style='background:#fff;border:2px solid [primary];border-radius:12px;padding:32px;max-width:420px'>
<h3>Book Your Appointment</h3>
<select style='width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ddd'>
<option>Select Service</option>[real services for this business]</select>
<input type='date' style='width:100%;padding:10px;margin:8px 0;border-radius:8px;border:1px solid #ddd'>
<button style='width:100%;padding:14px;background:[primary color];color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer'>Confirm Booking</button>
</div>

AI Chat Widget (bottom right fixed):
<div style='position:fixed;bottom:24px;right:24px;z-index:1000'>
<div style='background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:320px;overflow:hidden'>
<div style='background:[primary];padding:16px;color:#fff;font-weight:600'>Chat with us</div>
<div style='padding:16px'>
<div style='background:#f0f0f0;border-radius:8px;padding:12px;margin-bottom:8px;font-size:14px'>Hi! How can I help you today?</div>
</div>
</div>
</div>

Lead Capture Form:
<form style='background:[secondary];border-radius:16px;padding:40px;max-width:500px'>
<h3 style='margin-bottom:24px'>[CTA headline]</h3>
[name, email, phone, relevant dropdown, submit button]
<p style='font-size:13px;margin-top:12px;opacity:0.7'>We respond within 5 minutes during business hours</p>
</form>

Instagram Feed:
<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:600px'>
[9 divs with background colors from brand palette, aspect-ratio:1, with hover overlay]
</div>

Email Newsletter:
<div style='background:[gradient];padding:60px 40px;text-align:center;border-radius:16px'>
<h3>[Newsletter headline for this business]</h3>
<p>[Value proposition]</p>
<div style='display:flex;gap:12px;max-width:400px;margin:24px auto 0'>
<input placeholder='Your email address' style='flex:1;padding:14px;border-radius:8px;border:none;font-size:16px'>
<button style='padding:14px 24px;background:[primary];color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer'>Subscribe</button>
</div>
</div>

Google Reviews Section:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px'>
[4-5 review cards with stars, review text specific to this business, reviewer name, date]
</div>

SEO Blog Section:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px'>
[3 article cards with title, excerpt, Read More link]
</div>

Ecommerce Product Grid:
<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px'>
[product cards with name, description, price, Add to Cart button in primary color]
</div>

FOOTER REQUIREMENTS: Business name, navigation, contact info, social links, copyright, Powered by MiniMorph Studios.

MINIMORPH BANNER (top of every page, BEFORE navigation):
<div style='background:#0a0a12;color:#fff;padding:10px 20px;text-align:center;font-size:14px;position:sticky;top:0;z-index:9999'>
🏗️ MiniMorph Studios Demo — [Business Name] | Built on the [Package] plan — $[price]/mo | <a href='https://www.minimorphstudios.net/get-started' style='color:#3b82f6;font-weight:600;margin-left:8px'>Start Your Build →</a>
</div>`;

// ── Site personalities ─────────────────────────────────────────────────────
// Each personality overrides the generic design standards above so that
// sites across different industries feel built by different designers.

interface SitePersonality {
  name: string;
  overrideRules: string;
}

const PERSONALITIES: Record<string, SitePersonality> = {
  INDUSTRIAL: {
    name: "INDUSTRIAL",
    overrideRules: `
== PERSONALITY: INDUSTRIAL (Contractor / Trades) ==
OVERRIDE the generic design standards above. Use these instead — no exceptions.

HERO: Full-bleed photo (<img src="{{HERO_IMAGE}}">) filling 100vw × 100vh. On top: dark overlay (bg-black/60). Centered content: business name in ALL-CAPS, text-7xl lg:text-9xl font-black uppercase tracking-tight text-white. Tagline below in text-xl font-medium text-gray-300 uppercase tracking-widest. Two CTAs side by side: primary solid button + ghost outline button.

NAVIGATION: Dark bg (bg-[primaryBg] or bg-zinc-950). Logo/business name LEFT (bold, uppercase). Phone number VISIBLE CENTER in text-[primaryColor] font-bold. "Get Free Estimate" button RIGHT — solid primaryColor bg, white text, no border-radius (sharp corners, rounded-none).

TYPOGRAPHY (load via Google Fonts <link>):
- Use Oswald (font-family: 'Oswald', sans-serif) for ALL headings — weight 700, uppercase, tracking-tight
- Use Inter for body copy — text-lg text-gray-300 leading-relaxed
- Section labels: text-xs font-bold uppercase tracking-[0.3em] text-[primaryColor] mb-4

SERVICES SECTION: Icon grid layout — 6 cards in a 2×3 or 3×2 grid. Each card: dark bg-zinc-900, no rounded corners (rounded-none), border-l-4 border-[primaryColor], padding p-8. Icon top-left (SVG, primaryColor). Service name in Oswald text-2xl uppercase. One-line description in gray-400.

TRUST BAR: Full-width stripe bg-[primaryColor]. 4 stats in a flex row: number in text-5xl font-black text-white + label below in text-sm uppercase text-white/80. Stats: years in business, projects completed, states licensed, something like "0 callbacks" or "100% satisfaction".

GALLERY: Asymmetric masonry grid using CSS grid-template-areas. Large image (spans 2 rows) + 4 smaller images. Sharp corners everywhere, no rounded-xl.

CONTACT/CTA SECTIONS: Solid primaryColor background, white text. Bold headline in Oswald. Centered. No soft gradients — hard color blocks.

CARDS: Never use rounded-2xl. Use rounded-none or rounded-sm. No hover:scale — use hover:border-[primaryColor] transition instead.

SECTION STRUCTURE ORDER: Nav → Hero (fullbleed) → Trust bar → Services grid → Gallery → Testimonials → Contact CTA → Footer
SECTION COLORS: Alternate bg-zinc-950 and bg-zinc-900. Never light backgrounds — this is a dark industrial site.`,
  },

  EDITORIAL: {
    name: "EDITORIAL",
    overrideRules: `
== PERSONALITY: EDITORIAL (Salon / Boutique / Luxury) ==
OVERRIDE the generic design standards above. Use these instead — no exceptions.

HERO: Split-panel layout. Left half (w-1/2): full-height <img src="{{HERO_IMAGE}}"> covering exactly 50vw, object-fit:cover, no overlay. Right half (w-1/2): vertically centered text block. Business name in thin italic serif text-5xl lg:text-7xl font-light italic. Tagline in text-sm uppercase tracking-[0.4em] text-gray-500 mb-8. CTA: underlined text link style (NOT a filled button) — border-b border-current pb-1 text-sm uppercase tracking-widest.

NAVIGATION: Transparent or white bg. Business name/logo CENTERED using absolute positioning, or left-aligned in thin serif. Nav links in text-xs uppercase tracking-[0.25em] font-medium. NO filled CTA button in nav — use a text link or thin outline. Sticky nav with border-b border-gray-100.

TYPOGRAPHY (load via Google Fonts <link>):
- Use Cormorant Garamond (weight 300 and 400) for ALL headings — light weight, italic style
- Use DM Sans for all body copy — text-base text-gray-600 leading-loose
- Section labels: text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-6 font-sans
- Accent: small text-[primaryColor] used sparingly — only on key words or borders

SERVICES SECTION: Clean horizontal list or 2-column editorial grid. Each service: lots of white space, thin top border border-gray-200, service name in Cormorant text-3xl italic, price right-aligned in text-sm tracking-widest. No icon grid. No cards with shadow.

TEAM SECTION: Portrait photos with name and title below. Full-width individual feature blocks (image left, bio text right) for key staff members. Serif names, all lowercase except proper nouns.

GALLERY: Symmetric clean grid (3 or 4 columns), consistent aspect ratio, no asymmetry. Large gap (gap-6 or gap-8). Zero rounded corners on images (rounded-none, overflow-hidden on container).

CTAs: Ghost buttons (outline style) or text-underline links. NEVER a solid filled button except for the final booking CTA — which should be: bg-[primaryColor] text-white px-12 py-4 text-xs uppercase tracking-[0.3em] font-medium (not bold).

WHITESPACE: Extreme. py-32 lg:py-48 between sections. max-w-4xl mx-auto for text blocks (NOT max-w-7xl).

SECTION STRUCTURE ORDER: Nav → Split Hero → Brand statement (1 sentence, full width, huge italic serif) → Services list → Gallery → Team → Testimonials (1-2 large quotes) → Newsletter signup → Footer
SECTION COLORS: White (#ffffff) and cream (#faf9f7) alternating. primaryBg used only in footer. Never dark sections except footer.`,
  },

  WARM_LIFESTYLE: {
    name: "WARM LIFESTYLE",
    overrideRules: `
== PERSONALITY: WARM LIFESTYLE (Restaurant / Coffee / Bakery) ==
OVERRIDE the generic design standards above. Use these instead — no exceptions.

HERO: Full-bleed <img src="{{HERO_IMAGE}}"> 100vw × 100vh. Over it: gradient overlay from-transparent via-black/20 to-black/70 applied as absolute inset child. Centered content: eyebrow text in italic serif text-lg text-[primaryColor] mb-2. Business name in text-6xl lg:text-8xl font-bold font-serif text-white. Tagline in text-xl text-white/80 max-w-lg mt-4. ONE solid CTA button — bg-[primaryColor] text-white px-10 py-4 rounded-full font-medium mt-8.

NAVIGATION: Sticky, bg-white/90 backdrop-blur-md border-b border-gray-100. Logo/name LEFT in thin serif font. Nav links centered in text-sm font-medium text-gray-600. Reserve/Order button RIGHT — small, rounded-full outline border-[primaryColor] text-[primaryColor] px-5 py-2 hover:bg-[primaryColor] hover:text-white.

TYPOGRAPHY (load via Google Fonts <link>):
- Use Playfair Display (700) for all headings — elegant, warm serif
- Use Lato (400, 300) for body copy — text-lg text-gray-600 leading-relaxed
- Section labels: Playfair Display italic, text-[primaryColor], small size (text-base)
- Accent numbers/stats: Playfair Display bold, large (text-6xl), text-[primaryColor]

MENU / PRODUCT SECTION: Handwritten-style section title (use Playfair Display italic). Items listed in clean 2-column grid: item name bold left, price right, description below in text-sm text-gray-500 italic. Alternating light background rows.

OWNER STORY SECTION: Full-width section, image RIGHT (object-cover, rounded-2xl), text LEFT. Personal tone. Chef/owner name in large italic serif. Quote in blockquote style with left border-l-4 border-[primaryColor].

INSTAGRAM-STYLE GRID: 3×3 grid of color swatches using bg-[color] approximations from brand palette. No actual images here — colored squares with hover overlay showing item names. Add a @handle badge below.

CARDS: rounded-2xl always. shadow-lg. warm hover effects (hover:shadow-xl). Images with aspect-ratio[4/3].

SECTION STRUCTURE ORDER: Nav → Hero (fullbleed overlay) → Featured items/menu highlights → Owner story → Gallery → Reviews → Newsletter signup → Contact/Reservations → Footer
SECTION COLORS: Alternate between primaryBg (dark warm) and bg-[#faf6f1] (warm cream/off-white). Avoid pure white or pure black sections.`,
  },

  ENERGETIC: {
    name: "ENERGETIC",
    overrideRules: `
== PERSONALITY: ENERGETIC (Gym / Fitness / CrossFit / Yoga) ==
OVERRIDE the generic design standards above. Use these instead — no exceptions.

HERO: Split-diagonal layout. Left 55%: dark bg-[primaryBg] with large stat overlaid (e.g. "18 LBS" in text-[9rem] font-black text-[primaryColor] leading-none). Below stat: business name text-4xl font-black uppercase text-white. Tagline text-sm uppercase tracking-widest text-gray-400 mt-2. Two CTAs: solid primaryColor button (shadow-[0_0_20px_primaryColor]) + ghost outline. Right 45%: <img src="{{HERO_IMAGE}}"> object-cover object-top full-height, clipped diagonally using clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%).

NAVIGATION: Near-black bg bg-[primaryBg] or bg-black. Logo left (bold uppercase, text-[primaryColor]). Nav links in text-xs uppercase tracking-widest text-gray-300. "FREE TRIAL" button right — bg-[primaryColor] text-black font-black px-6 py-2 uppercase text-sm with glow: shadow-[0_0_15px_var(--primary)].

TYPOGRAPHY (load via Google Fonts <link>):
- Use Barlow Condensed (800) for ALL headings — bold condensed, uppercase required
- Use Barlow (400, 500) for body copy — text-gray-300 text-base
- Section labels: Barlow Condensed, text-[primaryColor], text-sm uppercase tracking-[0.4em]
- Stats: text-8xl font-black text-[primaryColor] (for results numbers like "94%" or "18 LBS")

PROGRAMS/CLASSES SECTION: Horizontal card row (overflow-x-auto on mobile). Each card: dark bg-zinc-900 border-t-4 border-[primaryColor]. Class name in Barlow Condensed text-2xl uppercase bold. Intensity indicator (3-5 filled dots in primaryColor). Duration and times. No rounded corners (rounded-none).

DIAGONAL SECTION DIVIDERS: Between sections use a full-width element with clip-path: polygon(0 0, 100% 8%, 100% 100%, 0% 92%) or similar to create angular transitions between dark sections.

TRAINER PROFILES: Dark bg-zinc-900 cards. Coach photo top (grayscale filter that goes color on hover). Name Barlow Condensed bold uppercase. Specialty tag in primaryColor. One-line credential.

RESULTS SECTION: Full-width dark section. 3-4 large transformation numbers (text-8xl text-[primaryColor] font-black) with labels (e.g. "average lbs lost in 90 days", "member retention", "active members"). White text. primaryColor accents.

TESTIMONIALS: Dark bg-zinc-800 cards, no rounded corners. Large quote mark in primaryColor. Member name + result tag.

CTAs: Always solid filled bg-[primaryColor] text-black (or white if light color). Add glow with shadow-[0_0_25px_#color]. Uppercase font-black tracking-widest. NEVER use ghost/outline buttons for primary CTAs.

SECTION STRUCTURE ORDER: Nav → Split-diagonal Hero → Stats bar → Programs/Classes → Trainers → Transformation results → Free Trial form → Testimonials → Footer
SECTION COLORS: Only dark colors — bg-black, bg-zinc-950, bg-zinc-900, bg-zinc-800. ONE section (Free Trial CTA) can use bg-[primaryColor] with dark text. Never any light or white backgrounds.`,
  },
};

function determinePersonality(imageType: string): SitePersonality {
  const t = imageType.toLowerCase();
  if (t === "contractor" || t === "construction" || t === "trades") return PERSONALITIES.INDUSTRIAL;
  if (t === "salon" || t === "boutique" || t === "luxury" || t === "spa") return PERSONALITIES.EDITORIAL;
  if (t === "restaurant" || t === "coffee" || t === "cafe" || t === "bakery" || t === "food") return PERSONALITIES.WARM_LIFESTYLE;
  if (t === "gym" || t === "fitness" || t === "yoga" || t === "crossfit") return PERSONALITIES.ENERGETIC;
  return PERSONALITIES.WARM_LIFESTYLE;
}

// ── Image injection ─────────────────────────────────────────────────────────
async function injectImages(html: string, imageType: string, primaryColor: string): Promise<string> {
  const tokens = ["{{HERO_IMAGE}}", "{{GALLERY_IMAGE_1}}", "{{GALLERY_IMAGE_2}}", "{{GALLERY_IMAGE_3}}", "{{ABOUT_IMAGE}}"];
  const slots = ["hero", "gallery", "gallery", "gallery", "about"];
  const usedTokens = tokens.filter(t => html.includes(t));

  if (usedTokens.length > 0) {
    console.log(`      → Replacing ${usedTokens.length} image tokens with real Replicate images...`);
    const urls = await Promise.all(slots.map(slot => getBestImage(imageType, slot, primaryColor)));
    let result = html;
    tokens.forEach((token, i) => { result = result.split(token).join(urls[i]); });
    return result;
  }

  // Fallback: LLM used CSS gradients — override hero/banner sections with real image via injected CSS
  console.log(`      → No tokens found — injecting hero image via CSS override...`);
  const heroUrl = await getBestImage(imageType, "hero", primaryColor);
  const cssOverride = `\n<style>
/* MiniMorph image injection */
.hero,.hero-section,#hero,[class*="hero"],[class*="banner"],[class*="jumbotron"],[class*="header-section"] {
  background-image: url('${heroUrl}') !important;
  background-size: cover !important;
  background-position: center !important;
  background-blend-mode: overlay !important;
}
</style>`;
  return html.replace("</head>", cssOverride + "\n</head>");
}

async function generateSiteHtml(params: {
  businessName: string;
  packageTier: string;
  monthlyPrice: number;
  industry: string;
  imageType: string;
  primaryColor: string;
  primaryBg: string;
  textColor: string;
  pages: string[];
  questionnaire: Record<string, unknown>;
}): Promise<string> {
  const personality = determinePersonality(params.imageType);
  console.log(`    → Personality: ${personality.name}`);

  const systemPrompt = `${PREMIUM_REQUIREMENTS}
${personality.overrideRules}

You are an expert web designer and developer. You build stunning, conversion-optimized websites.

You use Tailwind CSS via CDN — include <script src="https://cdn.tailwindcss.com"></script> in head.
You use Google Fonts via a single <link> in head for typography.
You embed any custom JavaScript in a script tag before body close.
You never use Bootstrap, React, or Vue.
You create genuine custom designs that reflect the brand perfectly using Tailwind utility classes.
You do NOT write a <style> block — Tailwind utility classes handle all styling.

For images: use REAL <img> tags with these exact placeholder tokens as the src (they will be swapped for real AI-generated photos before deployment):
- Hero/banner image: <img src="{{HERO_IMAGE}}" style="width:100%;height:600px;object-fit:cover;display:block" alt="[business name]">
- Gallery images: src="{{GALLERY_IMAGE_1}}", src="{{GALLERY_IMAGE_2}}", src="{{GALLERY_IMAGE_3}}" — use 100% width, aspect-ratio:4/3, object-fit:cover
- About/team photo: src="{{ABOUT_IMAGE}}" — portrait or square format, object-fit:cover
- All decorative backgrounds, gradients, and non-photo elements still use CSS

Pages must include intelligent internal linking. Navigation must work across all pages using relative hrefs (about.html, services.html, etc.).

Output ONLY the raw HTML for the requested page — no JSON, no markdown fences, no explanation.
Start your response with <!DOCTYPE html> and end with </html>.`;

  const questionnaireStr = JSON.stringify(params.questionnaire, null, 2);
  const navPages = params.pages
    .map((p) => (p === "index" ? "/" : `/${p}`))
    .join(", ");

  const pages: Record<string, string> = {};

  for (const pageName of params.pages) {
    const pageLabel = pageName === "index" ? "Home (index.html)" : `${pageName}.html`;
    console.log(`    → Generating page: ${pageLabel}...`);

    let html = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const userContent = `Generate the ${pageLabel} page for this business.

BUSINESS: ${params.businessName}
INDUSTRY: ${params.industry}
PACKAGE: ${params.packageTier} plan — $${params.monthlyPrice}/mo (use this EXACT price in the MiniMorph banner)
ALL SITE PAGES (for navigation links): ${navPages}
THIS PAGE: ${pageLabel}

MANDATORY COLORS — use exactly these, no substitutions:
  --color-bg: ${params.primaryBg}
  --color-primary: ${params.primaryColor}
  --color-text: ${params.textColor}
Apply these via Tailwind arbitrary values: bg-[${params.primaryBg}] text-[${params.textColor}] and brand accents with text-[${params.primaryColor}] bg-[${params.primaryColor}].

This is a SHOWROOM DEMO site. Make it the best-looking small business website on the internet.
${pageName === "index" ? "Include ALL add-ons listed in addOnsIncluded as fully-styled working widgets on this home page." : "Include relevant add-on widgets if they make sense for this page."}
Every widget must be visually present and look completely real.

FULL QUESTIONNAIRE DATA:
${questionnaireStr}

MANDATORY IMAGE TOKENS — include these exact strings as src attribute values (will be replaced with real photos):
  hero <img src="{{HERO_IMAGE}}"> — full-width, min-height 500px, object-fit:cover
  gallery <img src="{{GALLERY_IMAGE_1}}"> <img src="{{GALLERY_IMAGE_2}}"> <img src="{{GALLERY_IMAGE_3}}">
  about/team <img src="{{ABOUT_IMAGE}}">

Remember: output ONLY raw HTML starting with <!DOCTYPE html>.`;

        const raw = await generateHtml(systemPrompt, userContent);

        if (!raw.includes("<!DOCTYPE") && !raw.includes("<html")) {
          throw new Error(`Page response missing HTML tags. Got: ${raw.slice(0, 200)}`);
        }
        // If truncated, close the document gracefully (browser handles unclosed tags fine)
        if (!raw.includes("</html>")) {
          console.log(`      (HTML truncated at ${raw.length} chars — closing document)`);
        }

        // Strip optional markdown code fences
        html = raw
          .replace(/^```html?\s*/im, "")
          .replace(/\s*```\s*$/im, "")
          .trim();
        // Close truncated documents so the browser renders a complete page
        if (!html.includes("</body>")) html += "\n</body>";
        if (!html.includes("</html>")) html += "\n</html>";
        // Inject real AI-generated images in place of token placeholders
        html = await injectImages(html, params.imageType, params.primaryColor);
        // Force correct price in MiniMorph banner regardless of what LLM wrote
        html = html.replace(
          /Built on the \w[\w &]* plan — \$[\d,]+\/mo/g,
          `Built on the ${params.packageTier} plan — $${params.monthlyPrice}/mo`
        );
        // Cooldown after successful generation to respect 8k TPM rate limit
        console.log(`      (cooling down 90s for rate limit...)`);
        await new Promise((r) => setTimeout(r, 90000));
        break;
      } catch (err: any) {
        if (attempt < 3) {
          console.log(`      (attempt ${attempt} failed: ${err.message.slice(0, 80)} — retrying in 90s...)`);
          await new Promise((r) => setTimeout(r, 90000));
        } else {
          throw err;
        }
      }
    }

    pages[pageName] = html;
  }

  if (Object.keys(pages).length === 0) {
    throw new Error("No pages were generated");
  }

  return JSON.stringify(pages);
}

const SHOWROOM_SITES = [
  {
    slug: "hammerstone-builds",
    subdomain: "hammerstone",
    businessName: "Hammerstone Builds",
    packageTier: "Starter",
    monthlyPrice: 195,
    industry: "General Contractor",
    imageType: "contractor",
    primaryColor: "#e07b39",
    primaryBg: "#1a1a1a",
    textColor: "#f5f5f5",
    pages: ["index", "services", "projects", "quote", "contact"],
    questionnaireData: {
      businessDescription: "Family-owned general contractor. 22 years building foundations, structural framing, roofing, and full renovations. Father started it, son runs it. Licensed in 3 states. Zero structural failures in 22 years.",
      targetCustomers: "Homeowners with major structural needs, property developers, commercial light renovation clients who want it done right the first time.",
      topServices: "Foundation repair and waterproofing, structural framing for new builds and additions, complete roof replacement, full gut renovations, commercial light construction, concrete flatwork",
      brandVoice: "No-nonsense, blue-collar, completely trustworthy. We show up on time, do the work right, and back it with a warranty. Like the contractor your grandfather used to trust.",
      colorScheme: "Dark charcoal #1a1a1a background, bold orange #e07b39 accent color, white text. Heavy industrial feel.",
      competitors: "Bob Construction has outdated site, Premier Build Co feels too corporate",
      uniqueValue: "22 years zero structural callbacks. Every job signed off by licensed structural engineer. Fixed-price quotes, no change orders.",
      callToAction: "Get a Free Estimate",
      addOnsIncluded: [
        "Lead Capture System with prominent quote form on every page, SMS alert badge showing 5-minute response time guarantee",
        "Google Reviews Widget showing 4.9 stars, 47 reviews, with 5 specific contractor reviews mentioning quality and reliability"
      ],
      testimonials: [
        { name: "Rick D.", role: "Homeowner", text: "Hammerstone rebuilt our entire foundation. Finished 3 days early, the inspector said it was the cleanest foundation work he had ever seen.", result: "Home value increased $40,000" },
        { name: "Carla M.", role: "Property Developer", text: "I have used 4 contractors over 12 years. Hammerstone is the only one I call now. Zero change orders across 3 projects.", result: "$0 in surprise costs" }
      ]
    }
  },
  {
    slug: "driftwood-kitchen",
    subdomain: "driftwood",
    businessName: "Driftwood Kitchen",
    packageTier: "Growth",
    monthlyPrice: 295,
    industry: "Farm to Table Restaurant",
    imageType: "restaurant",
    primaryColor: "#c8934a",
    primaryBg: "#1e120a",
    textColor: "#f5f0e8",
    pages: ["index", "menu", "about", "reservations", "private-dining", "contact"],
    questionnaireData: {
      businessDescription: "Farm-to-table waterfront restaurant. Seasonal menu changes weekly based on what local farms bring us. Wood-fired everything. Executive chef with 18 years fine dining experience. Opened 2018, fully booked most weekends.",
      targetCustomers: "Food-forward couples, business dinners, anniversary celebrations, people who care deeply about where their food comes from.",
      topServices: "Dinner service Tue-Sun, weekend brunch, private dining room for events up to 40, seasonal tasting menus, wine pairings",
      brandVoice: "Warm, artisanal, elevated but never pretentious. Like a really good meal with close friends who happen to be incredible cooks.",
      colorScheme: "Dark warm wood #1e120a background, warm gold #c8934a accent, cream #f5f0e8 text. Candlelight and cedar warmth.",
      uniqueValue: "Only restaurant in region sourcing 100% within 50 miles. Real relationships with 12 local farms. Menu printed fresh daily.",
      callToAction: "Reserve Your Table",
      menuItems: {
        starters: [
          "Wood-Fired Oysters — lemon butter, smoked paprika — $18",
          "Heirloom Tomato Salad — local burrata, aged balsamic — $16",
          "Bone Marrow — grilled sourdough, herb chimichurri — $22"
        ],
        mains: [
          "48-Hour Short Rib — celery root puree, natural jus — $46",
          "Lake Trout — brown butter, capers, charred lemon — $38",
          "Roasted Half Chicken — farm vegetables, herbed jus — $34"
        ],
        desserts: [
          "Warm Chocolate Torte — vanilla ice cream, sea salt — $14",
          "Seasonal Fruit Crisp — house granola, whipped cream — $12"
        ]
      },
      addOnsIncluded: [
        "Booking Widget with full reservation form: date picker, time slots 5pm-9:30pm, party size 1-10, occasion selector",
        "Google Reviews Widget: 4.8 stars, 127 reviews, 5 specific food-focused reviews",
        "Instagram Feed: 9-photo grid in warm wood tones with @driftwoodkitchen handle",
        "Email Newsletter signup: Get our weekly menu delivered to your inbox"
      ]
    }
  },
  {
    slug: "gritmill-fitness",
    subdomain: "gritmill",
    businessName: "Gritmill Fitness",
    packageTier: "Growth",
    monthlyPrice: 295,
    industry: "High-Intensity Fitness Studio",
    imageType: "gym",
    primaryColor: "#00d4ff",
    primaryBg: "#0a0a0f",
    textColor: "#e0f7ff",
    pages: ["index", "classes", "memberships", "trainers", "free-trial", "contact"],
    questionnaireData: {
      businessDescription: "High-intensity functional fitness studio. Max 12 per class, always coached never just supervised. 340 active members. 94% retention after month one. Average member loses 18 lbs in first 90 days. 5 certified coaches, all former competitive athletes.",
      targetCustomers: "Working adults 25-45 who tried big box gyms and quit. People who need accountability and real community, not just equipment and a locker room.",
      topServices: "HIIT30 classes, PowerLift strength training, Mobility Flow recovery, 6-week transformation challenges, nutrition coaching, personal training",
      brandVoice: "Intense but genuinely welcoming. We will push you hard but we will never let you fail. Results-obsessed but community-first.",
      colorScheme: "Near-black #0a0a0f background, electric cyan #00d4ff accent, dark navy #0f1520 secondary. High energy, serious.",
      uniqueValue: "Average member loses 18 lbs in first 90 days. 340 members, 94% retention after first month. Real coaches on the floor every single class.",
      callToAction: "Start Your Free 7-Day Trial",
      classes: [
        "GRIT30 — 30-min HIIT, all levels, burns 400-600 calories, daily at 6am/12pm/6pm",
        "PowerLift — Functional strength, progressive overload, Mon/Wed/Fri",
        "Mobility Flow — Recovery and flexibility, prevents injury, Tue/Thu/Sat",
        "6-Week Challenge — Full transformation program with nutrition, starts monthly"
      ],
      memberships: [
        { name: "Foundation", price: "$89/mo", features: ["8 classes/mo", "App access", "Community"] },
        { name: "Unlimited", price: "$129/mo", features: ["Unlimited classes", "Nutrition guide", "Priority booking", "Monthly check-in"] },
        { name: "Elite", price: "$199/mo", features: ["Everything in Unlimited", "2 personal training/mo", "Custom meal plan", "Direct coach access"] }
      ],
      addOnsIncluded: [
        "AI Chat Widget bottom right: visitor asks best class for beginners, AI responds with specific Gritmill recommendation and free trial offer",
        "Lead Capture: Start Your Free 7-Day Trial form with name, email, phone, fitness goal dropdown",
        "SMS Alert: We will text you within 5 minutes to schedule your first class badge",
        "Review Collector: What Our Members Are Saying section with 5 Google-style cards showing specific transformation results"
      ]
    }
  },
  {
    slug: "velvet-vine-studio",
    subdomain: "velvetandvine",
    businessName: "Velvet & Vine Studio",
    packageTier: "Pro",
    monthlyPrice: 395,
    industry: "Luxury Hair Salon & Spa",
    imageType: "salon",
    primaryColor: "#c9a84c",
    primaryBg: "#12061a",
    textColor: "#f8f4f0",
    pages: ["index", "services", "team", "gallery", "book", "gift-cards", "contact"],
    questionnaireData: {
      businessDescription: "Luxury appointment-only hair salon and day spa. Color specialists and certified Great Lengths extension studio, only one in the region. 200+ five-star Google reviews. Clientele includes local executives, brides, and people who have been burned by cheaper salons.",
      targetCustomers: "Professional women 28-55 who treat their hair as a serious investment. Bridal parties. Clients who want it done perfectly and will not settle for less.",
      topServices: "Balayage and color correction from $185, Great Lengths extensions from $800, Brazilian Blowout $250, Precision cut from $75, Bridal packages from $300, Full spa menu",
      brandVoice: "Editorial luxury. Like a Vogue spread mixed with a genuinely relaxing spa day. Elevated, intentional, zero compromises on quality.",
      colorScheme: "Deep plum #12061a background, antique gold #c9a84c accent, cream #f8f4f0 text. High-end boutique hotel aesthetic.",
      uniqueValue: "Only certified Great Lengths extension studio in the region. Color correction specialist with 15 years. Appointment-only means you are never waiting.",
      callToAction: "Book Your Appointment",
      services: {
        hair: [
          "Balayage & Color Correction — from $185",
          "Great Lengths Extensions — from $800",
          "Brazilian Blowout — $250",
          "Precision Cut & Style — from $75",
          "Bridal Hair — packages from $300"
        ],
        spa: [
          "Deep Tissue Massage — 60min $95",
          "Custom Facial — from $85",
          "Gel Manicure — $45",
          "Full Body Waxing — from $35"
        ]
      },
      team: [
        { name: "Sophia V.", title: "Master Colorist & Owner", specialty: "Balayage, color correction, 15 years. Trained in Paris, certified in 14 color techniques." },
        { name: "Marisol R.", title: "Extensions Specialist", specialty: "Great Lengths certified. One of only 8 certified technicians in the state." }
      ],
      addOnsIncluded: [
        "Booking Widget: Elegant appointment form with service dropdown, stylist preference, date picker with available slots, Confirm Appointment button in gold",
        "Instagram Feed: 12-photo grid in deep plum and gold tones, @velvetandvine handle",
        "Google Reviews: 5.0 stars, 214 reviews, 5 luxury reviews mentioning Sophia and the salon atmosphere specifically",
        "Email Marketing: Join Our VIP List with exclusive early access to appointments and seasonal offers"
      ]
    }
  },
  {
    slug: "clover-and-thistle",
    subdomain: "cloverandthistle",
    businessName: "Clover & Thistle",
    packageTier: "Pro",
    monthlyPrice: 395,
    industry: "Independent Boutique Retail",
    imageType: "boutique",
    primaryColor: "#2d4a2d",
    primaryBg: "#ffffff",
    textColor: "#1a1a1a",
    pages: ["index", "shop", "new-arrivals", "collections", "about", "contact"],
    questionnaireData: {
      businessDescription: "Independent women's clothing and lifestyle boutique. Every item personally selected, nothing mass-produced. 90% from small independent designers you cannot find anywhere else locally. Personal styling included with every purchase over $150. 6 years, fiercely loyal local following.",
      targetCustomers: "Women 30-55 who hate fast fashion, want to look intentional not trendy, willing to pay for real quality and a genuine shopping experience.",
      topServices: "Seasonal clothing collections, accessories, home goods, gift curation, personal styling sessions, custom orders",
      brandVoice: "Clean, considered, editorial without being cold or unapproachable. Like a really well-curated Pinterest board that you can actually buy from.",
      colorScheme: "White #ffffff and warm white #f9f5f0 background. LIGHT THEMED SITE. Forest green #2d4a2d accent, dark #1a1a1a text. Minimal and intentional.",
      uniqueValue: "Personal styling included with every purchase over $150. 90% of inventory from independent designers not available locally elsewhere.",
      callToAction: "Shop New Arrivals",
      products: [
        { name: "Linen Wrap Dress", price: "$148", desc: "100% Belgian linen, natural dye, limited to 12 units" },
        { name: "Handwoven Tote", price: "$89", desc: "Artisan-made in Guatemala, every one unique" },
        { name: "Merino Cardigan", price: "$195", desc: "3rd-generation family mill in Portugal" },
        { name: "Ceramic Mug Set", price: "$64", desc: "Hand-thrown by local artist, sets of 2" },
        { name: "Silk Scarf", price: "$125", desc: "Hand-printed, 100% mulberry silk" },
        { name: "Beeswax Candle", price: "$38", desc: "100% beeswax, 60hr burn" }
      ],
      addOnsIncluded: [
        "Email Marketing: Join the Thistle Circle newsletter with exclusive first-access to new arrivals and styling tips",
        "Instagram Feed: 9-photo grid in earthy lifestyle tones, @cloverandthistle",
        "SEO Autopilot Blog: Style Notes from the Shop Floor with 3 articles about capsule wardrobes, independent designers, buying less but better",
        "Google Reviews: 4.9 stars, 89 reviews, 5 specific reviews mentioning items and personal styling experience"
      ]
    }
  },
  {
    slug: "ember-oak-coffee",
    subdomain: "emberandoak",
    businessName: "Ember & Oak Coffee Co.",
    packageTier: "Enterprise",
    monthlyPrice: 495,
    industry: "Specialty Coffee Roaster + Ecommerce",
    imageType: "coffee",
    primaryColor: "#c47a2a",
    primaryBg: "#0f0906",
    textColor: "#f0e6d3",
    pages: ["index", "shop", "subscriptions", "our-story", "brewing-guides", "wholesale", "contact"],
    questionnaireData: {
      businessDescription: "Specialty coffee roaster. Direct-trade single-origin beans from Ethiopia, Colombia, Guatemala, Sumatra. Small-batch roasted to order, never sitting on a shelf. 800 active monthly subscribers. Ships nationwide within 48 hours of roast. 4.9 stars across 640 reviews. Founded by a Q Grader.",
      targetCustomers: "Serious coffee drinkers who know the difference between washed and natural process. Home brewers with real equipment. Gift buyers wanting something genuinely premium.",
      topServices: "Single-origin whole bean coffee, monthly subscription boxes, brewing equipment, corporate office coffee programs, 2 cafe locations, barista training",
      brandVoice: "Rich, warm, takes coffee seriously but never pretentiously. Like that one friend who knows everything about coffee and makes it feel exciting, not snobby.",
      colorScheme: "Dark espresso #0f0906 background, warm amber #c47a2a accent, cream #f0e6d3 text. Rich, tactile, warm like holding a mug.",
      uniqueValue: "Direct trade — visited every farm we source from. Roasted within 48 hours of your order. 800 active subscribers. 4.9 stars across 640 reviews.",
      callToAction: "Shop Single-Origin Coffee",
      products: [
        { name: "Ethiopia Yirgacheffe", origin: "Gedeo Zone, Ethiopia", process: "Natural", roast: "Light", notes: "Blueberry, jasmine, dark chocolate", price12oz: "$22", price5lb: "$89" },
        { name: "Colombia El Paraiso", origin: "Huila, Colombia", process: "Washed", roast: "Medium", notes: "Red apple, caramel, hazelnut", price12oz: "$20", price5lb: "$82" },
        { name: "Sumatra Mandheling", origin: "North Sumatra", process: "Wet-hulled", roast: "Dark", notes: "Dark chocolate, cedar, earth", price12oz: "$19", price5lb: "$78" },
        { name: "Guatemala Antigua", origin: "Antigua, Guatemala", process: "Honey", roast: "Medium-Dark", notes: "Brown sugar, stone fruit", price12oz: "$21", price5lb: "$85" }
      ],
      subscriptions: [
        { name: "Explorer", price: "$45/mo", desc: "2 bags/mo, our picks" },
        { name: "Roasters Choice", price: "$72/mo", desc: "4 bags/mo, experimental releases", popular: true },
        { name: "Office Program", price: "$199/mo", desc: "10 lbs/mo, invoiced monthly" }
      ],
      addOnsIncluded: [
        "Ecommerce Store: Full product grid with Add to Cart, grind selector whole bean/coarse/medium/fine, size selector 12oz or 5lb bag",
        "Subscription section: 3 tiers with Most Popular badge on Roasters Choice, Start Subscription CTA",
        "AI Chat Widget: Ask our Coffee Bot bubble, sample conversation recommending Colombia for someone who likes sweeter coffee",
        "Email Marketing: The Weekly Roast newsletter with farm stories and first access to limited releases",
        "Review Collector: How was your last order section with 5-star rating widget and 5 specific reviews",
        "SEO Blog: Coffee Journal with 3 articles about washed vs natural process, direct trade sourcing, pour over guide",
        "Analytics social proof: 800+ subscribers, 4.9 stars, ships to all 50 states"
      ]
    }
  }
];

interface SiteResult {
  slug: string;
  businessName: string;
  liveUrl?: string;
  deployUrl?: string;
  projectName?: string;
  error?: string;
  success: boolean;
}

async function generateAndDeployAll(): Promise<SiteResult[]> {
  const domain = ENV.minimorphSitesDomain;
  console.log("Starting showroom site generation...");
  console.log("Domain:", domain);
  console.log("");

  const results: SiteResult[] = [];

  const siteLimit = process.env.SITE_LIMIT ? parseInt(process.env.SITE_LIMIT, 10) : SHOWROOM_SITES.length;
  for (let i = 0; i < siteLimit; i++) {
    const site = SHOWROOM_SITES[i];
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Generating: ${site.businessName}`);
    console.log(`Package: ${site.packageTier} $${site.monthlyPrice}/mo`);
    const subdomain = `${site.subdomain}.${domain}`;
    console.log(`Target: ${subdomain}`);

    try {
      console.log("  → Calling AI generator...");
      let generatedHtml = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          generatedHtml = await generateSiteHtml({
            businessName: site.businessName,
            packageTier: site.packageTier,
            monthlyPrice: site.monthlyPrice,
            industry: site.industry,
            imageType: site.imageType,
            primaryColor: site.primaryColor,
            primaryBg: site.primaryBg,
            textColor: site.textColor,
            pages: ["index"],
            questionnaire: site.questionnaireData,
          });
          break;
        } catch (genErr: any) {
          if (attempt < 3) {
            console.log(`  (attempt ${attempt} failed: ${genErr.message.slice(0, 80)} — retrying in 90s...)`);
            await new Promise((r) => setTimeout(r, 90000));
          } else {
            throw genErr;
          }
        }
      }

      const pages = JSON.parse(generatedHtml) as Record<string, string>;
      const pageCount = Object.keys(pages).length;
      console.log(`  ✅ Generated ${pageCount} pages: ${Object.keys(pages).join(", ")}`);

      const projectName = `mm-showroom-${site.slug}`;

      console.log(`  → Creating Cloudflare Pages project: ${projectName}`);
      try {
        await createPagesProject({ projectName, customerId: 0 });
        console.log("  ✅ Project created");
      } catch (err: any) {
        if (!err.message?.includes("already exists")) throw err;
        console.log("  (project already exists, continuing)");
      }

      console.log("  → Deploying pages...");
      const deployment = await deployToPages({ projectName, pages });
      console.log(`  ✅ Deployed: ${deployment.deploymentUrl}`);

      console.log(`  → Adding custom subdomain: ${subdomain}`);
      const domainResult = await addCustomDomain({ projectName, domain: subdomain });
      console.log(`  ✅ Domain: ${domainResult.status}`);

      const liveUrl = `https://${subdomain}`;
      console.log(`  ✅ Live URL: ${liveUrl}`);

      results.push({
        slug: site.slug,
        businessName: site.businessName,
        liveUrl,
        deployUrl: deployment.deploymentUrl,
        projectName,
        success: true,
      });
    } catch (err: any) {
      console.error(`  ❌ Failed: ${err.message}`);
      if (err.cause) console.error(`     Cause: ${err.cause?.message ?? err.cause} | Code: ${(err.cause as any)?.code}`);
      results.push({
        slug: site.slug,
        businessName: site.businessName,
        error: err.message,
        success: false,
      });
    }

    if (i < SHOWROOM_SITES.length - 1) {
      console.log("  (waiting 15s before next site...)");
      await new Promise((r) => setTimeout(r, 15000));
    }
  }

  return results;
}

async function main() {
  const results = await generateAndDeployAll();

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("GENERATION COMPLETE");
  console.log("═══════════════════════════════════════");
  results.forEach((r) => {
    if (r.success) {
      console.log(`✅ ${r.businessName} → ${r.liveUrl}`);
      console.log(`   pages.dev: ${r.deployUrl}`);
      console.log(`   project: ${r.projectName}`);
    } else {
      console.log(`❌ ${r.businessName} → ${r.error}`);
    }
  });
}

main().catch(console.error);
