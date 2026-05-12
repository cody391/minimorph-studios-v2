import * as db from "../db";
import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { getProjectName } from "./cloudflareDeployment";
import { injectImages as injectImageComments } from "./imageInjector";
import { recordCost, COSTS, calculateAiCost } from "./costTracker";

const PREMIUM_REQUIREMENTS = `== MINIMORPH STUDIOS — WORLD-CLASS SITE REQUIREMENTS ==

SECTION C — EFFICIENCY RULES (follow exactly):
1. Include in <head>: <script src="https://cdn.tailwindcss.com"></script>
2. Include ONE Google Fonts <link> in <head> — never use @import
3. NO <style> block — zero custom CSS written by you
4. Use Tailwind utility classes for ALL styling
5. For brand colors use arbitrary values: bg-[#e07b39] text-[#1a1a1a]
6. Maximum 1 <script> block before </body> for interactivity
7. NO animation libraries — use Tailwind transition classes only
8. Target 25-35KB HTML — rich and complete but not bloated
9. Use semantic HTML: <section> <article> <nav> <main> <footer>
10. Every image uses token placeholders (listed below)

TAILWIND DESIGN STANDARDS:
- Hero: min-h-screen flex items-center, large font, prominent CTA
- Navigation: sticky top-0 bg-opacity-90 backdrop-blur-sm, logo left + CTA right
- Cards: shadow-xl rounded-2xl hover:scale-105 transition-transform duration-300
- Section padding: py-20 lg:py-32, max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Buttons: rounded-full px-8 py-4 font-semibold with hover state color shift
- Responsive: mobile-first with sm: md: lg: breakpoint prefixes
- Typography: text-6xl lg:text-8xl font-bold for hero, text-4xl for sections

SECTION D — CONTENT RULES (zero exceptions):
- ZERO placeholder text — every word is specific to this exact business
- Real service names with real prices from questionnaire data
- Real testimonials from questionnaire — specific results and numbers
- Real origin story and differentiators from questionnaire
- Specific CTAs for this business type (not "Learn More" — be concrete)
- Real phone/email/address if provided in questionnaire

ADD-ON SHOWCASE REQUIREMENTS:
Each add-on must be VISUALLY PRESENT on the page.

Review Collector widget:
<div style='background:#f8f9fa;border-radius:12px;padding:24px;max-width:480px'>
<div style='color:#fbbc04;font-size:20px'>★★★★★</div>
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
<div style='background:[primary];padding:16px;color:#fff;font-weight:600'>💬 Chat with us</div>
<div style='padding:16px'>
<div style='background:#f0f0f0;border-radius:8px;padding:12px;margin-bottom:8px;font-size:14px'>Hi! How can I help you today?</div>
</div>
</div>
</div>

Lead Capture Form:
<form style='background:[secondary];border-radius:16px;padding:40px;max-width:500px'>
<h3 style='margin-bottom:24px'>[CTA headline]</h3>
[name, email, phone, relevant dropdown, submit button]
<p style='font-size:13px;margin-top:12px;opacity:0.7'>⚡ We respond within 5 minutes during business hours</p>
</form>

Instagram Feed:
<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:600px'>
[9 divs with background colors from brand palette, aspect-ratio:1, with hover overlay]
</div>
<p style='text-align:center;margin-top:12px'>Follow us @[handle]</p>

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

FOOTER REQUIREMENTS (non-negotiable — audited after generation):
Every page MUST end with a <footer> tag containing:
- Business name and tagline
- Navigation links: Home, About, Services, Contact
- Contact info: phone (as tel: link), email (as mailto: link), address/service area
- Copyright line with current year
- 'Powered by MiniMorph Studios' in small text
MISSING FOOTER = AUTOMATIC FAILURE. Do not omit under any circumstances.

PHONE NUMBER IN NAV/HEADER (non-negotiable):
The navigation or hero section MUST include a visible, clickable phone number:
  <a href="tel:PHONENUMBER">📞 (555) 555-5555</a>
If the business has no phone yet, use: <a href="#contact">📞 Call for a free quote</a>
MISSING PHONE IN NAV/HERO = AUTOMATIC FAILURE.

CONTACT FORM (non-negotiable):
Every page MUST include a real contact form with at minimum: name, email, phone, message fields, and a submit button.
Not a button that says "Contact Us" — an actual <form> with <input> elements.
MISSING CONTACT FORM = AUTOMATIC FAILURE.

MINIMORPH BANNER (top of every page):
<div style='background:#0a0a12;color:#fff;padding:10px 20px;text-align:center;font-size:14px;position:sticky;top:0;z-index:9999'>
MiniMorph Studios Demo — [Business Name] | Built on the [Package] plan | <a href='https://www.minimorphstudios.net/get-started' style='color:#3b82f6;font-weight:600'>Start Your Build</a>
</div>`;

// ─── Quality scoring — run before deployment, retry if score < 70 ─────────────

function scoreGeneratedSite(html: string): {
  score: number;
  issues: string[];
  pass: boolean;
} {
  const issues: string[] = [];
  let score = 100;

  if (/lorem ipsum/i.test(html)) {
    issues.push("Contains placeholder text"); score -= 30;
  }
  if (!html.includes("<nav")) {
    issues.push("Missing navigation"); score -= 10;
  }
  if ((html.match(/<section/g) || []).length < 4) {
    issues.push("Too few sections (need 4+)"); score -= 15;
  }
  if (!/testimonial|review/i.test(html)) {
    issues.push("No social proof"); score -= 10;
  }
  if (!html.includes("tel:") && !html.includes("mailto:")) {
    issues.push("No contact links"); score -= 10;
  }
  if ((html.match(/<img/g) || []).length < 2) {
    issues.push("Too few images (need 2+)"); score -= 15;
  }
  if (html.length < 15000) {
    issues.push(`HTML too short (${html.length} chars — likely incomplete)`); score -= 25;
  }
  if (!html.includes("Built on the")) {
    issues.push("Missing MiniMorph banner"); score -= 5;
  }
  if (!/<footer[\s>]/i.test(html)) {
    issues.push("Missing footer"); score -= 20;
  }
  if (!/tel:/i.test(html.slice(0, 6000))) {
    issues.push("No phone number in nav/hero area"); score -= 15;
  }
  if (!/<form[\s>]/i.test(html)) {
    issues.push("No contact form"); score -= 10;
  }

  return { score, issues, pass: score >= 70 };
}

function getPagesForBusinessType(websiteType: string, features?: string[]): string[] {
  const hasBlog = features?.some(f =>
    f.toLowerCase().includes("blog") || f.toLowerCase().includes("seo_schema") || f.toLowerCase().includes("seo autopilot")
  );
  let pages: string[];
  switch ((websiteType || "").toLowerCase()) {
    case "restaurant":
      pages = ["index", "menu", "about", "reservations", "contact"];
      break;
    case "contractor":
      pages = ["index", "services", "about", "gallery", "quote", "contact"];
      break;
    case "ecommerce":
      pages = ["index", "products", "about", "contact"];
      break;
    case "service_business":
    case "service business":
      pages = ["index", "about", "services", "contact"];
      break;
    default:
      pages = ["index", "about", "services", "contact"];
  }
  if (hasBlog) pages.push("blog");
  pages.push("privacy");
  return pages;
}

async function fetchAssetAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/png";
    const b64 = Buffer.from(buffer).toString("base64");
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

// ── Visual Lies competitive research (same framework as showroom generator) ──
async function researchCompetitors(
  businessType: string,
  businessName: string,
): Promise<string> {
  try {
    console.log(`[SiteGen] Phase 0: Researching ${businessType} competitive landscape for ${businessName}...`);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ENV.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You are a brutally honest brand strategist and creative director in 2026.

Your job is to find the VISUAL LIES that every business in an industry tells on their website then define the exact opposite positioning.

A Visual Lie is a marketing cliche so overused it has lost all meaning. Examples:
- Restaurant: perfectly plated food nobody actually eats, smiling chefs who never look stressed
- Contractor: smiling worker in clean new hard hat, stock photo handshakes
- Gym: airbrushed athletes, impossible bodies
- Salon: models with impossible hair, sterile white everything

You find these lies by researching what the top competitors actually show on their sites. Then you define the Counter-Strike — the brand promise that makes the truth more powerful than the lie.

Return ONLY valid JSON. No preamble. No markdown backticks. Just the JSON object.`,
        messages: [{
          role: "user",
          content: `Research the competitive landscape for a ${businessType} business called "${businessName}".

Search for:
- "best ${businessType} websites 2026"
- "top ${businessType} web design examples"
- "${businessType} website design trends 2026"

Find the 3 most universal Visual Lies that every ${businessType} website tells. Then define the Counter-Strike positioning.

Return this exact JSON:
{
  "visual_lies_found": [
    {"lie": "the visual cliche they all use", "why_it_fails": "why customers dont believe it"},
    {"lie": "second cliche", "why_it_fails": "why it fails"},
    {"lie": "third cliche", "why_it_fails": "why it fails"}
  ],
  "counter_strike": {
    "personality_anchor": "one sentence — what THIS site IS that the competition is afraid to be",
    "brand_promise": "the truth this site tells that competitors hide",
    "tone": "exactly how copy should sound — be specific",
    "avoid_words": ["word1", "word2", "word3"],
    "power_words": ["word1", "word2", "word3"]
  },
  "design_direction": {
    "hero_style": "specific hero approach that counters the lies",
    "layout_feel": "specific layout personality",
    "typography_direction": "font personality that matches the counter-strike",
    "color_application": "how to use the brand color to reinforce the truth",
    "section_order": ["hero", "section2", "section3", "section4", "section5", "footer"],
    "avoid_design": ["design cliche 1", "cliche 2", "cliche 3"]
  },
  "image_direction": {
    "what_to_capture": "specific photo direction that proves the brand promise",
    "what_competitors_never_show": "the real thing we show that they hide",
    "camera_persona": "specific documentary photographer persona for this niche",
    "example_shots": ["shot1", "shot2", "shot3"]
  }
}`,
        }],
      }),
    });
    const data = await response.json() as any;
    const content = data.content || [];
    let jsonText = "";
    for (const block of content) {
      if (block.type === "text") jsonText += block.text;
    }
    if (!jsonText.trim()) throw new Error("No text content in recon response");
    const start = jsonText.indexOf("{");
    if (start === -1) throw new Error("No JSON object found in recon response");
    let depth = 0, inString = false, escape = false, end = -1;
    for (let i = start; i < jsonText.length; i++) {
      const ch = jsonText[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error("Unbalanced JSON in recon response");
    const intel = JSON.parse(jsonText.slice(start, end + 1));
    console.log("[SiteGen] Competitive intel ready:");
    intel.visual_lies_found?.forEach((l: any) => console.log(`  ✗ ${l.lie}`));
    console.log(`  → ${intel.counter_strike?.personality_anchor}`);
    return JSON.stringify(intel, null, 2);
  } catch (e) {
    console.error("[SiteGen] Competitive recon failed:", e);
    return "";
  }
}

// ── Bridge add-ons selected by Elena to mustHaveFeatures feature flags ────────
function bridgeAddonsToFeatures(
  addonsSelected: any[],
  mustHaveFeatures: string[],
): string[] {
  const features = [...(mustHaveFeatures || [])];
  for (const addon of (addonsSelected || [])) {
    const name = (addon.product || addon.name || "").toLowerCase();
    if (name.includes("review")) features.push("review_widget");
    if (name.includes("booking")) features.push("booking_widget");
    if (name.includes("chatbot") || name.includes("chat bot")) features.push("chat_widget");
    if (name.includes("lead")) features.push("lead_capture");
    if (name.includes("seo")) features.push("seo_schema");
    if (name.includes("social")) features.push("social_feed");
    if (name.includes("email")) features.push("email_signup");
    if (name.includes("blog")) features.push("blog");
  }
  return Array.from(new Set(features));
}

const IMAGE_SLOTS: Record<string, string> = {
  HERO_IMAGE: "hero",
  GALLERY_IMAGE_1: "gallery",
  GALLERY_IMAGE_2: "gallery",
  GALLERY_IMAGE_3: "gallery",
  ABOUT_IMAGE: "about",
  TEAM_IMAGE_1: "about",
  TEAM_IMAGE_2: "about",
  BACKGROUND_IMAGE: "hero",
};

async function injectImages(
  html: string,
  businessType: string,
  primaryColor: string,
  customerPhotoUrl?: string,
  subNiche?: string,
  imageDirection?: string,
): Promise<string> {
  const { getBestImage } = await import("./imageService");
  let result = html;
  for (const [slot, slotType] of Object.entries(IMAGE_SLOTS)) {
    if (!result.includes(slot)) continue;
    console.log(`[SiteGen] Fetching image for slot: ${slot}`);
    const url = await getBestImage(businessType, slotType, primaryColor, customerPhotoUrl, subNiche, imageDirection);
    result = result.split(slot).join(url);
  }
  return result;
}

// ─── Post-processing safety net ───────────────────────────────────────────────
// Guarantees footer, phone in nav, and contact form are present regardless of
// what the LLM produced. Runs after every page generation as a hard backstop.

function ensureRequiredStructure(
  html: string,
  opts: { businessName: string; phone?: string; email?: string; address?: string },
): string {
  const { businessName } = opts;
  const phone = opts.phone?.trim() || "";
  const email = opts.email?.trim() || "";
  const address = opts.address?.trim() || "";
  const year = new Date().getFullYear();

  const telHref = phone ? `tel:${phone.replace(/\D/g, "")}` : "#contact";
  const phoneDisplay = phone || "Call for a free quote";
  const telLink = `<a href="${telHref}" class="hover:text-white transition-colors">${phoneDisplay}</a>`;
  const emailLink = email
    ? `<a href="mailto:${email}" class="hover:text-white transition-colors">${email}</a>`
    : "";

  // ── Fix 1: Footer ───────────────────────────────────────────────────────────
  if (!/<footer[\s>]/i.test(html)) {
    const footer = `
<footer class="bg-gray-900 text-gray-400 py-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
      <div>
        <h3 class="text-white font-bold text-xl mb-4">${businessName}</h3>
        ${address ? `<p class="mb-3 text-sm">${address}</p>` : ""}
        <p class="mb-2 text-sm">${telLink}</p>
        ${emailLink ? `<p class="text-sm">${emailLink}</p>` : ""}
      </div>
      <div>
        <h4 class="text-white font-semibold text-lg mb-4">Quick Links</h4>
        <ul class="space-y-2 text-sm">
          <li><a href="/" class="hover:text-white transition-colors">Home</a></li>
          <li><a href="about.html" class="hover:text-white transition-colors">About</a></li>
          <li><a href="services.html" class="hover:text-white transition-colors">Services</a></li>
          <li><a href="contact.html" class="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4 class="text-white font-semibold text-lg mb-4">Contact Us</h4>
        <p class="mb-2 text-sm">
          <a href="${telHref}" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            📞 ${phoneDisplay}
          </a>
        </p>
        ${email ? `<p class="text-sm"><a href="mailto:${email}" class="text-blue-400 hover:text-blue-300 transition-colors">${email}</a></p>` : ""}
      </div>
    </div>
    <div class="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-sm">© ${year} ${businessName}. All rights reserved.</p>
      <p class="text-xs text-gray-600">Powered by <a href="https://www.minimorphstudios.net" class="hover:text-gray-400 transition-colors">MiniMorph Studios</a></p>
    </div>
  </div>
</footer>`;
    html = html.replace(/<\/body>/i, footer + "\n</body>");
  }

  // ── Fix 2: Phone number in nav/hero area ────────────────────────────────────
  if (!/tel:/i.test(html.slice(0, 6000))) {
    const phoneChip = `<a href="${telHref}" class="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap">📞 ${phoneDisplay}</a>`;
    // Prefer injecting before </nav>; fall back to after opening <body>
    if (/<\/nav>/i.test(html)) {
      html = html.replace(/<\/nav>/i, phoneChip + "\n</nav>");
    } else {
      html = html.replace(/<body[^>]*>/i, (match) => match + "\n" + phoneChip);
    }
  }

  // ── Fix 3: Contact form ─────────────────────────────────────────────────────
  if (!/<form[\s>]/i.test(html)) {
    const contactSection = `
<section id="contact" class="py-20 bg-gray-50">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-4xl font-bold text-gray-900 text-center mb-4">Get in Touch</h2>
    <p class="text-gray-600 text-center mb-10">Fill out the form below and we'll get back to you within 24 hours.</p>
    <form id="mm-contact-form" class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
        <input name="name" type="text" placeholder="Jane Smith" required class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input name="email" type="email" placeholder="jane@example.com" required class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input name="phone" type="tel" placeholder="(555) 555-5555" class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea name="message" rows="4" placeholder="Tell us about your project..." required class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"></textarea>
      </div>
      <button type="submit" id="mm-contact-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors">
        Send Message →
      </button>
      <p id="mm-contact-msg" class="text-center text-sm text-gray-500 hidden"></p>
      <p class="text-center text-sm text-gray-500">⚡ We respond within 24 hours during business hours</p>
    </form>
    <script>
      (function(){
        var form = document.getElementById('mm-contact-form');
        if (!form) return;
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var btn = document.getElementById('mm-contact-btn');
          var msg = document.getElementById('mm-contact-msg');
          var fd = new FormData(form);
          var data = { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), message: fd.get('message') };
          btn.disabled = true; btn.textContent = 'Sending…';
          fetch('${ENV.appUrl}/api/contact-submit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
            .then(function(r){ return r.json(); })
            .then(function(res){
              if (res.success) {
                form.reset(); btn.textContent = 'Sent ✓';
                msg.textContent = "Thanks! We’ll be in touch within 24 hours."; msg.className = 'text-center text-sm text-green-600';
              } else { throw new Error(res.error || 'Error'); }
            })
            .catch(function(){
              btn.disabled = false; btn.textContent = 'Send Message →';
              msg.textContent = 'Something went wrong. Please call us directly.'; msg.className = 'text-center text-sm text-red-600';
            });
          msg.classList.remove('hidden');
        });
      })();
    </script>
  </div>
</section>`;
    // Insert before <footer> if present, otherwise before </body>
    if (/<footer[\s>]/i.test(html)) {
      html = html.replace(/<footer[\s>]/i, (m) => contactSection + "\n" + m);
    } else {
      html = html.replace(/<\/body>/i, contactSection + "\n</body>");
    }
  }

  // Inject Cloudflare Web Analytics before </head> if token is configured and not already present
  if (ENV.cloudflareAnalyticsToken && !html.includes("cloudflareinsights.com")) {
    const analyticsSnippet = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${ENV.cloudflareAnalyticsToken}"}'></script>`;
    html = html.replace(/<\/head>/i, analyticsSnippet + "\n</head>");
  }

  return html;
}

function injectPremiumFeatures(
  html: string,
  pageName: string,
  businessName: string,
  primaryColor: string,
  phone: string,
  email: string,
  serviceArea: string,
  servicesOffered: string[],
): string {
  const initials = businessName.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
  const faviconUrl = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  // Favicon + OG + theme-color (only if not already present)
  if (!html.includes("og:title") && html.includes("</head>")) {
    const ogDesc = `${servicesOffered.slice(0, 3).join(", ")} in ${serviceArea}`.slice(0, 160);
    const headTags = `<link rel="icon" type="image/svg+xml" href="${faviconUrl}">
<link rel="apple-touch-icon" href="${faviconUrl}">
<meta name="theme-color" content="${primaryColor}">
<meta property="og:title" content="${businessName}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${businessName}">`;
    html = html.replace("</head>", headTags + "\n</head>");
  }

  // Schema.org LocalBusiness JSON-LD
  if (!html.includes("application/ld+json") && html.includes("</head>")) {
    const schema = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: businessName,
      ...(phone ? { telephone: phone } : {}),
      ...(email ? { email } : {}),
      ...(serviceArea ? { areaServed: serviceArea } : {}),
      ...(servicesOffered.length ? { hasOfferCatalog: { "@type": "OfferCatalog", name: "Services", itemListElement: servicesOffered.slice(0, 5).map(s => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })) } } : {}),
    });
    html = html.replace("</head>", `<script type="application/ld+json">${schema}</script>\n</head>`);
  }

  // Unique title per page
  const pageTitles: Record<string, string> = {
    index: `${businessName} | ${serviceArea}`,
    services: `Services | ${businessName}`,
    gallery: `Our Work | ${businessName}`,
    about: `About | ${businessName}`,
    contact: `Contact | ${businessName}`,
    quote: `Free Quote | ${businessName}`,
    menu: `Menu | ${businessName}`,
    reservations: `Reservations | ${businessName}`,
    blog: `Blog | ${businessName}`,
    products: `Products | ${businessName}`,
    privacy: `Privacy Policy | ${businessName}`,
  };
  if (pageTitles[pageName] && html.match(/<title>[^<]*<\/title>/i)) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${pageTitles[pageName]}</title>`);
  }

  // Lazy loading for images (eager on first, lazy on rest)
  let firstImg = true;
  html = html.replace(/<img([^>]+)>/gi, (match, attrs) => {
    if (attrs.includes("loading=")) return match;
    if (firstImg) { firstImg = false; return `<img${attrs} loading="eager" fetchpriority="high" decoding="async">`; }
    return `<img${attrs} loading="lazy" decoding="async">`;
  });

  // Cookie banner
  if (!html.includes("mm-cookie")) {
    const cookieBanner = `<div id="mm-cookie" style="position:fixed;bottom:0;left:0;right:0;background:rgba(10,10,10,0.97);color:#fff;padding:1.25rem 5%;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;z-index:9997;font-size:0.875rem;border-top:1px solid rgba(255,255,255,0.1);transform:translateY(100%);transition:transform 0.4s ease"><p style="margin:0;max-width:600px;opacity:0.85">We use cookies to improve your experience. By continuing you agree to our <a href="privacy.html" style="color:${primaryColor}">Privacy Policy</a>.</p><button id="mm-cookie-btn" style="background:${primaryColor};color:#fff;border:none;padding:0.75rem 1.75rem;border-radius:4px;font-weight:700;cursor:pointer">Accept</button></div>
<script>(function(){try{if(localStorage.getItem('mmck'))return;}catch(e){}var b=document.getElementById('mm-cookie');if(!b)return;setTimeout(function(){b.style.transform='translateY(0)'},1500);var btn=document.getElementById('mm-cookie-btn');if(btn)btn.addEventListener('click',function(){try{localStorage.setItem('mmck','1');}catch(e){}b.style.transform='translateY(100%)';});})();</script>`;
    html = html.replace("</body>", cookieBanner + "\n</body>");
  }

  // Back to top
  if (!html.includes("mm-top")) {
    const backToTop = `<button id="mm-top" aria-label="Back to top" style="position:fixed;bottom:5rem;right:1.5rem;width:44px;height:44px;border-radius:50%;background:${primaryColor};color:#fff;border:none;cursor:pointer;font-size:1.25rem;opacity:0;transition:opacity 0.3s;z-index:500;box-shadow:0 4px 16px rgba(0,0,0,0.3)" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>
<script>(function(){var b=document.getElementById('mm-top');if(!b)return;window.addEventListener('scroll',function(){b.style.opacity=window.scrollY>500?'1':'0';},{passive:true});})();</script>`;
    html = html.replace("</body>", backToTop + "\n</body>");
  }

  // Print styles
  if (!html.includes("@media print") && html.includes("</head>")) {
    html = html.replace("</head>", `<style media="print">nav,footer,#mm-cookie,#mm-top,button{display:none!important}body{color:#000!important;background:#fff!important}a{color:#000!important}</style>\n</head>`);
  }

  return html;
}

export function stripDemoBanner(html: string): string {
  return html.replace(
    /<div[^>]*background:#0a0a12[^>]*>[\s\S]*?MiniMorph Studios Demo[\s\S]*?<\/div>/gi,
    "",
  );
}

export async function generateSiteForProject(projectId: number): Promise<void> {
  const project = await db.getOnboardingProjectById(projectId);
  if (!project) {
    console.error(`[SiteGenerator] Project ${projectId} not found`);
    return;
  }

  // Gate 1 — Blueprint must be approved before any generation begins
  const blueprint = await db.getBlueprintByProjectId(projectId);
  if (!blueprint || blueprint.status !== "approved") {
    console.warn(`[SiteGenerator] Project ${projectId}: blocked — blueprint not approved (status: ${blueprint?.status ?? "none"})`);
    await db.updateOnboardingProject(projectId, {
      generationStatus: "idle",
      generationLog: "Waiting for customer blueprint approval.",
      stage: "blueprint_review",
    });
    return;
  }

  // Gate 2 — For self-service projects, payment must be confirmed before generation begins
  // approvedAt is NEVER checked here — it means final customer site approval, not payment
  const p = project as any;
  const paymentRequired = p.source === "self_service";
  if (paymentRequired && !p.paymentConfirmedAt) {
    console.warn(`[SiteGenerator] Project ${projectId}: blocked — payment not confirmed for self-service project`);
    await db.updateOnboardingProject(projectId, {
      generationStatus: "idle",
      generationLog: "Waiting for payment confirmation.",
      stage: "blueprint_review",
    });
    return;
  }

  await db.updateOnboardingProject(projectId, {
    generationStatus: "generating",
    stage: "design",
    generationLog: "Blueprint approved and payment confirmed — building your website.",
  });

  // Notify customer build has started (email + SMS)
  try {
    const { sendBuildStartedEmail } = await import("./customerEmails");
    await sendBuildStartedEmail({
      to: project.contactEmail,
      customerName: project.contactName,
      businessName: project.businessName,
      portalUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal`,
    });
  } catch (emailErr) {
    console.error("[SiteGenerator] Build started email failed:", emailErr);
  }
  try {
    const { sendCustomerSms } = await import("./sms");
    const q = project.questionnaire as Record<string, unknown> | null;
    const customerPhone = (q?.phone as string) || project.contactPhone;
    await sendCustomerSms(
      customerPhone,
      `We've started building your ${project.businessName} website! You'll receive a preview link within the next few minutes. — MiniMorph Studios`,
    );
  } catch {}

  // Notify admin
  try {
    const { notifyOwner } = await import("../_core/notification");
    await notifyOwner({
      title: "Site Build Started",
      content: `Build triggered for ${project.businessName} (Project #${projectId}). Package: ${project.packageTier}.`,
    });
  } catch {}

  let generationTimedOut = false;

  const _generationBody = async () => {
    const assets = await db.listProjectAssets(projectId);
    const questionnaire = project.questionnaire as Record<string, unknown> | null;

    // ── Questionnaire extraction ─────────────────────────────────────────────
    const q = questionnaire || {};

    // Warn and resolve fallbacks when questionnaire is sparse
    const hasQuestionnaireData = !!(q.businessName || q.businessType || q.websiteType);
    if (!hasQuestionnaireData) {
      console.warn(
        `[SiteGen] ⚠️ Project ${projectId} has no questionnaire data — generating with fallbacks.` +
        ` businessName="${project.businessName}" contactName="${project.contactName}" email="${project.contactEmail}"`
      );
    }

    // businessName: "Pending" is the placeholder from createSelfServiceProject — treat as missing
    const resolvedBusinessName =
      (project.businessName && project.businessName !== "Pending")
        ? project.businessName
        : ((q.businessName as string) || project.contactName || "Your Business");

    const websiteType =
      (q.websiteType as string) ||
      (q.businessType as string) ||
      (q.industry as string) ||
      "other";

    // Build asset summary for prompt
    const assetSummary = assets.length > 0
      ? assets.map(a => `- ${a.category}: ${a.fileName} (available at: ${a.fileUrl})`).join("\n")
      : "No assets uploaded — use CSS gradients, shapes, and SVG illustrations as placeholders.";

    // ── Color extraction (Fix 2 & 9: primaryBg, textColor, secondary color) ──
    const brandTone = (q.brandTone as string) || "professional";
    const rawColorsStr = Array.isArray(q.brandColors)
      ? (q.brandColors as string[]).join(" ")
      : (q.brandColors as string) || "";
    const colorMatches = rawColorsStr.match(/#[0-9a-fA-F]{3,6}/g) || [];
    const primaryColor = colorMatches[0] || "#1a1a1a";
    const secondaryColor = colorMatches[1] || primaryColor;

    // Use explicit primaryBg from Elena if set; otherwise derive from brandTone
    const primaryBg = (q.primaryBg as string) || (() => {
      const tone = brandTone.toLowerCase();
      if (tone === "bold" || tone === "edgy") return primaryColor;
      if (tone === "elegant" || tone === "luxury") return "#fafaf8";
      return "#ffffff";
    })();

    // Use explicit textColor if set; otherwise derive from background luminance
    const textColor = (q.textColor as string) || (() => {
      const hex = primaryBg.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45 ? "#ffffff" : "#1a1a1a";
      }
      return "#1a1a1a";
    })();

    // ── Feature bridge (Fix 3: addonsSelected → mustHaveFeatures) ────────────
    const targetAudience = (q.targetAudience as string) || "local customers";
    const specialRequests = (q.specialRequests as string) || "None";
    const mustHaveFeaturesRaw = Array.isArray(q.mustHaveFeatures) ? (q.mustHaveFeatures as string[]) : [];
    const addonsSelectedRaw = Array.isArray(q.addonsSelected) ? (q.addonsSelected as any[]) : [];
    const mergedFeatures = bridgeAddonsToFeatures(addonsSelectedRaw, mustHaveFeaturesRaw);
    const mustHaveFeatures = mergedFeatures.join(", ") || "Standard";

    // ── New explicit contact/business fields (Fix 2 additions) ───────────────
    const phone = (q.phone as string) || (q.phoneNumber as string) || project.contactPhone || "";
    const email = (q.email as string) || project.contactEmail || "";
    const address = (q.address as string) || (q.serviceArea as string) || (q.city ? `${q.city}${q.state ? `, ${q.state}` : ""}` : "") || "your area";
    const hours = (q.hours as string) || "";
    const licenseNumber = (q.licenseNumber as string) || "";
    const yearsInBusiness = (q.yearsInBusiness as string) || "";
    const ownerName = (q.ownerName as string) || project.contactName || "";
    const uniqueDifferentiator = (q.uniqueDifferentiator as string) || "";
    const targetCustomerDescription = (q.targetCustomerDescription as string) || targetAudience;
    const pricingDisplay = (q.pricingDisplay as string) || "contact_for_pricing";

    // ── Competitive intelligence from Elena's conversation ────────────────────
    const competitorWeaknesses = Array.isArray(q.competitorWeaknesses)
      ? (q.competitorWeaknesses as string[])
      : [];
    const competitorSites = Array.isArray(q.competitorSites)
      ? (q.competitorSites as Array<{ url?: string; whatYouWantToBeat?: string }>)
      : [];
    const inspirationStyle = (q.inspirationStyle as Record<string, string>) || {};
    const avoidPatterns = Array.isArray(q.avoidPatterns)
      ? (q.avoidPatterns as string[])
      : [];
    const customerPhotoUrl = (q.customerPhotoUrl as string) || undefined;
    const subNiche = websiteType || (q.businessType as string) || undefined;

    // ── Page list (after mergedFeatures — blog + privacy included) ────────────
    const pageList = getPagesForBusinessType(websiteType, mergedFeatures);

    // ── Phase 0: Visual Lies competitive research (Fix 1 & 4) ────────────────
    await db.updateOnboardingProject(projectId, {
      generationLog: "Phase 0: Researching competitive landscape...",
    });
    const competitiveIntel = await researchCompetitors(websiteType, resolvedBusinessName);
    if (competitiveIntel) {
      recordCost({
        costType: "ai_generation",
        amountCents: COSTS.COMPETITOR_SCRAPE,
        customerId: project.customerId ?? undefined,
        description: "Competitive research (web search)",
      }).catch(() => {});
    }
    let intel: any = null;
    try {
      if (competitiveIntel) intel = JSON.parse(competitiveIntel);
    } catch {}

    const competitiveBlock = intel ? `════════════════════════════════════════
PHASE 0 — COMPETITIVE INTELLIGENCE (Live Research)
This site must be a brand argument, not just a website. Research confirmed these Visual Lies dominate this industry:

${intel.visual_lies_found?.map((l: any) =>
      `✗ LIE: "${l.lie}"\n  Why it fails: ${l.why_it_fails}`
    ).join("\n\n")}

COUNTER-STRIKE POSITIONING:
Personality Anchor: ${intel.counter_strike?.personality_anchor}
Brand Promise: ${intel.counter_strike?.brand_promise}
Tone: ${intel.counter_strike?.tone}
Words to AVOID: ${intel.counter_strike?.avoid_words?.join(", ")}
Power words to USE: ${intel.counter_strike?.power_words?.join(", ")}

DESIGN DIRECTION:
Hero: ${intel.design_direction?.hero_style}
Layout: ${intel.design_direction?.layout_feel}
Typography: ${intel.design_direction?.typography_direction}
Color: ${intel.design_direction?.color_application}
Section order: ${intel.design_direction?.section_order?.join(" → ")}
NEVER use these design clichés: ${intel.design_direction?.avoid_design?.join(", ")}

IMAGE DIRECTION:
What to capture: ${intel.image_direction?.what_to_capture}
What competitors never show: ${intel.image_direction?.what_competitors_never_show}
Camera persona: ${intel.image_direction?.camera_persona}
Example shots: ${intel.image_direction?.example_shots?.join(", ")}

CRITICAL DIRECTIVE:
Every design decision must counter the lies above.
Every copy line must reinforce the brand promise.
Every image must show what competitors hide.
This site must make the competition look dishonest by simply telling the truth.
════════════════════════════════════════
` : "";

    // imageDirection threads from recon → injectImages → getBestImage (Fix 4)
    const imageDirection = intel?.image_direction
      ? JSON.stringify(intel.image_direction)
      : undefined;

    // ── Elena's competitive brief (from conversation) ─────────────────────────
    const competitorSection = competitorWeaknesses.length > 0 || competitorSites.length > 0
      ? `SECTION A — ELENA'S COMPETITIVE BRIEF (from customer research):
${competitorWeaknesses.length > 0 ? `Competitor weaknesses Elena identified:\n${competitorWeaknesses.map((w, i) => `  ${i + 1}. ${w}`).join("\n")}` : ""}
${competitorSites.length > 0 ? `Competitor sites:\n${competitorSites.map(c => `  - ${c.url || "?"}: ${c.whatYouWantToBeat || ""}`).join("\n")}` : ""}

Use this to:
- If competitors use stock photos → use HERO_IMAGE and GALLERY tokens (real AI photos)
- If competitors have no pricing → show clear pricing tables
- If competitors have weak CTAs → use bold, urgent, specific CTAs
- If competitors look dated → use Tailwind's modern utility-first design
- If competitors have no testimonials → lead every page with real results`
      : "";

    const inspirationSection = Object.keys(inspirationStyle).length > 0 || avoidPatterns.length > 0
      ? `SECTION B — DESIGN DIRECTION FROM CUSTOMER:
Design qualities the customer loves: ${JSON.stringify(inspirationStyle)}
${avoidPatterns.length > 0 ? `Avoid these patterns the customer hates:\n${avoidPatterns.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}` : ""}`
      : "";

    const fullQuestionnaireText = JSON.stringify(q, null, 2);

    const systemPrompt = `${competitiveBlock}${PREMIUM_REQUIREMENTS}
${competitorSection ? "\n" + competitorSection : ""}
${inspirationSection ? "\n" + inspirationSection : ""}

You are an expert web designer using Tailwind CSS CDN (already included via <script src="https://cdn.tailwindcss.com"></script>).
You use Google Fonts via a single <link> in <head>.
You write at most ONE <script> block before </body> for interactivity.
You NEVER write a <style> block — Tailwind utilities handle all styling.
You NEVER use Bootstrap, React, Vue, or any CSS animation library.
You create genuinely custom designs using Tailwind arbitrary values for brand colors.
You are mobile-first, using sm: md: lg: breakpoint prefixes throughout.
SEO: include <meta name="description">, Open Graph tags, and schema markup on every page.

IMAGES — use these exact tokens as img src or background-image values:
  <img src="HERO_IMAGE" class="w-full h-[600px] object-cover" alt="[desc]">
  <img src="GALLERY_IMAGE_1" class="w-full aspect-[4/3] object-cover" alt="[desc]">
  <img src="GALLERY_IMAGE_2" class="w-full aspect-[4/3] object-cover" alt="[desc]">
  <img src="GALLERY_IMAGE_3" class="w-full aspect-[4/3] object-cover" alt="[desc]">
  <img src="ABOUT_IMAGE" class="w-full aspect-square object-cover" alt="[desc]">
  <img src="TEAM_IMAGE_1" class="w-full aspect-square object-cover rounded-full" alt="[desc]">
  <img src="TEAM_IMAGE_2" class="w-full aspect-square object-cover rounded-full" alt="[desc]">
HERO_IMAGE must appear on every page. These tokens are auto-replaced with real photos.

For the PRIVACY page: generate a complete, business-specific privacy policy covering data collection, cookies, contact info use, and third-party services. Use the business name and contact details. Standard legal language is appropriate for this page type.

Navigation must use relative hrefs: about.html, services.html, contact.html, privacy.html, etc.
Output ONLY raw HTML starting with <!DOCTYPE html> — no JSON, no markdown, no explanation.`;

    const navLinks = pageList
      .map((p) => (p === "index" ? "/" : `/${p}`))
      .join(", ");

    const sharedContext = `BUSINESS: ${resolvedBusinessName}
CONTACT: ${project.contactName} (${project.contactEmail})
OWNER: ${ownerName}
PACKAGE: ${project.packageTier}
WEBSITE TYPE: ${websiteType}
ALL SITE PAGES (for navigation): ${navLinks}

MANDATORY COLORS — use exactly these via Tailwind arbitrary values, no substitutions:
  Background:       bg-[${primaryBg}]            (page background)
  Primary accent:   bg-[${primaryColor}] text-[${primaryColor}]  (buttons, highlights)
  Secondary accent: bg-[${secondaryColor}] text-[${secondaryColor}]  (section highlights, secondary elements)
  Text:             text-[${textColor}]            (body text)

BRAND TONE: ${brandTone}
TARGET AUDIENCE: ${targetAudience}
TARGET CUSTOMER IN DETAIL: ${targetCustomerDescription}
${uniqueDifferentiator ? `UNIQUE DIFFERENTIATOR: ${uniqueDifferentiator}` : ""}
MUST-HAVE FEATURES & ADD-ONS: ${mustHaveFeatures}
PRICING DISPLAY PREFERENCE: ${pricingDisplay}
SPECIAL REQUESTS: ${specialRequests}

CONTACT INFO (use throughout — nav, footer, contact page, schema markup):
${phone ? `  Phone: ${phone}` : "  Phone: not provided — use placeholder"}
${email ? `  Email: ${email}` : ""}
${address ? `  Address/Service Area: ${address}` : ""}
${hours ? `  Hours: ${hours}` : ""}
${licenseNumber ? `  License: ${licenseNumber}` : ""}
${yearsInBusiness ? `  Years in Business: ${yearsInBusiness}` : ""}

FULL QUESTIONNAIRE DATA:
${fullQuestionnaireText}

UPLOADED ASSETS:
${assetSummary}`;

    const pages: Record<string, string> = {};

    // ── Template engine path (useTemplates = true) ───────────────────────────
    const useTemplates = true;
    let pagesFromTemplate = false;

    if (useTemplates) {
      try {
        const { generateSiteFromTemplate } = await import("./templateEngine");
        const servicesOffered = Array.isArray(q.servicesOffered)
          ? (q.servicesOffered as string[])
          : [websiteType];

        const testimonials = Array.isArray(q.testimonials)
          ? (q.testimonials as Array<{ quote: string; name: string; context: string }>)
          : [];

        const brief = {
          businessName: resolvedBusinessName,
          businessType: websiteType,
          brandTone: brandTone,
          packageTier: project.packageTier,
          primaryColor,
          secondaryColor,
          phone,
          email,
          address,
          hours,
          serviceArea: address || (q.serviceArea as string) || "",
          yearsInBusiness,
          ownerName,
          licenseNumber,
          uniqueDifferentiator,
          servicesOffered,
          targetCustomer: targetCustomerDescription,
          testimonials,
          competitiveIntel: competitiveIntel ?? undefined,
          imageDirection,
          appUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal`,
          subNiche,
          // Elena-sourced fields — wire every field she collects
          addonsSelected: addonsSelectedRaw,
          socialHandles: (q.socialHandles as Record<string, string>) || undefined,
          blogTopics: Array.isArray(q.blogTopics) ? (q.blogTopics as string[]) : undefined,
          specialRequests: (q.specialRequests as string) || undefined,
          inspirationStyle: (q.inspirationStyle as Record<string, string>) || undefined,
          avoidPatterns: Array.isArray(q.avoidPatterns) ? (q.avoidPatterns as string[]) : undefined,
          competitorSites: competitorSites.length ? competitorSites : undefined,
          competitorWeaknesses: competitorWeaknesses.length ? competitorWeaknesses : undefined,
          pricingDisplay: pricingDisplay || undefined,
          customerPhotoUrl: customerPhotoUrl || undefined,
          logoUrl: assets.find(a => a.category === "logo")?.fileUrl || undefined,
        };

        await db.updateOnboardingProject(projectId, {
          generationLog: "Generating site from template...",
        });

        const templatePages = await generateSiteFromTemplate(brief);
        Object.assign(pages, templatePages);
        pagesFromTemplate = true;

        console.log(`[SiteGen] Template engine produced ${Object.keys(templatePages).length} page(s) for ${project.businessName}`);
      } catch (templateErr: any) {
        console.error("[SiteGen] Template engine failed, falling back to LLM:", templateErr.message);
        pagesFromTemplate = false;
      }
    }

    if (!pagesFromTemplate) {
    for (let pi = 0; pi < pageList.length; pi++) {
      const pageName = pageList[pi];
      const pageLabel =
        pageName === "index" ? "Home (index.html)" : `${pageName}.html`;

      await db.updateOnboardingProject(projectId, {
        generationLog: `Generating page ${pi + 1}/${pageList.length}: ${pageLabel}...`,
      });

      const isHome = pageName === "index";
      const pageInstruction = isHome
        ? `Generate the Home page (index.html). This is the most important page — include hero, services, social proof, and ALL add-ons from mustHaveFeatures as fully-styled widgets. Make it visually stunning.`
        : `Generate the ${pageLabel} page. Include relevant add-ons where they make sense for this page type.`;

      // Retry up to 3 times per page
      let html = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `${pageInstruction}

THIS PAGE: ${pageLabel}

${sharedContext}

Remember: output ONLY raw HTML starting with <!DOCTYPE html>.`,
              },
            ],
            maxTokens: 16000,
          });

          // Record AI cost for this page generation
          const usage = (result as any).usage;
          if (usage) {
            recordCost({
              costType: "ai_generation",
              amountCents: calculateAiCost(usage.prompt_tokens ?? 0, usage.completion_tokens ?? 0),
              customerId: project.customerId ?? undefined,
              description: `Site gen page: ${pageLabel}`,
              tokensUsed: (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
            }).catch(() => {});
          }

          const raw =
            typeof result.choices[0]?.message?.content === "string"
              ? result.choices[0].message.content
              : "";

          if (!raw.includes("<!DOCTYPE") && !raw.includes("<html")) {
            throw new Error("Response missing HTML tags");
          }

          html = raw
            .replace(/^```html?\s*/im, "")
            .replace(/\s*```\s*$/im, "")
            .trim();

          // Close truncated documents gracefully
          if (!html.includes("</body>")) html += "\n</body>";
          if (!html.includes("</html>")) html += "\n</html>";

          // Quality gate — retry if score is too low
          const quality = scoreGeneratedSite(html);
          console.log(`[SiteGen] ${pageLabel} quality score: ${quality.score}/100${quality.issues.length ? " — " + quality.issues.join("; ") : " ✅"}`);
          if (!quality.pass && attempt < 3) {
            throw new Error(`Quality score ${quality.score}/100 (need 70+): ${quality.issues.join("; ")}`);
          }

          break;
        } catch (pageErr: any) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 60_000));
          } else {
            throw new Error(
              `Failed to generate page "${pageName}" after 3 attempts: ${pageErr.message}`
            );
          }
        }
      }

      // Guarantee footer, phone-in-nav, and contact form regardless of LLM output
      html = ensureRequiredStructure(html, {
        businessName: resolvedBusinessName,
        phone,
        email,
        address,
      });

      pages[pageName] = html;
    }
    } // end !pagesFromTemplate LLM block

    if (Object.keys(pages).length === 0) {
      throw new Error("No pages were generated");
    }

    // Inject logo as base64 if available
    const logoAsset = assets.find(a => a.category === "logo");
    if (logoAsset?.fileUrl) {
      await db.updateOnboardingProject(projectId, { generationLog: "Injecting brand assets..." });
      try {
        const logoBase64 = await fetchAssetAsBase64(logoAsset.fileUrl);
        if (logoBase64) {
          for (const pageName of Object.keys(pages)) {
            pages[pageName] = pages[pageName]
              .replace(/<!-- LOGO_PLACEHOLDER -->/g, `<img src="${logoBase64}" alt="${project.businessName} logo" style="max-height:60px;" />`)
              .replace(/src="logo\.png"/g, `src="${logoBase64}"`)
              .replace(/src="logo\.svg"/g, `src="${logoBase64}"`);
          }
        }
      } catch {
        // Best-effort — continue without logo injection
      }
    }

    // Inject real images into every page — token pass first, comment pass second
    await db.updateOnboardingProject(projectId, {
      generationLog: "Injecting images...",
    });
    for (const pageName of Object.keys(pages)) {
      if (!pagesFromTemplate) {
        try {
          // Primary: replace HERO_IMAGE / GALLERY_IMAGE_1 / etc. tokens (Fix 4: imageDirection wired)
          // Skipped for template engine path — templateEngine already resolved image tokens
          pages[pageName] = await injectImages(pages[pageName], websiteType, primaryColor, customerPhotoUrl, subNiche, imageDirection);
        } catch {
          // Best-effort — never block delivery
        }
      }
      try {
        // Fallback: replace any remaining <!-- REPLACE WITH: --> comments
        pages[pageName] = await injectImageComments(pages[pageName], projectId, pageName);
      } catch {
        // Best-effort — never block delivery
      }
    }

    // ── Premium features post-processing — applies to all generated pages ────────
    // Injects OG tags, Schema.org JSON-LD, unique titles, favicon, lazy images,
    // cookie banner, back-to-top, and print styles into every HTML page.
    await db.updateOnboardingProject(projectId, { generationLog: "Injecting premium features..." });
    const servicesForSeo = Array.isArray(q.servicesOffered) ? (q.servicesOffered as string[]) : [websiteType];
    for (const pageName of Object.keys(pages)) {
      if (pageName.endsWith(".xml") || pageName.endsWith(".txt")) continue;
      try {
        pages[pageName] = injectPremiumFeatures(
          pages[pageName],
          pageName,
          resolvedBusinessName,
          primaryColor,
          phone,
          email,
          address || (q.serviceArea as string) || "",
          servicesForSeo,
        );
      } catch {
        // Non-fatal — deliver page without premium injection
      }
    }

    // Generate sitemap.xml and robots.txt
    const siteBase = (q.domainName as string | undefined) ? `https://${q.domainName}` : "";
    const today = new Date().toISOString().split("T")[0];
    pages["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(pages)
  .filter((p) => !p.endsWith(".xml") && !p.endsWith(".txt"))
  .map((p) => {
    const loc = siteBase ? `${siteBase}/${p === "index" ? "" : p + ".html"}` : `/${p === "index" ? "" : p + ".html"}`;
    return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq></url>`;
  })
  .join("\n")}
</urlset>`;
    pages["robots.txt"] = `User-agent: *\nAllow: /\n${siteBase ? `Sitemap: ${siteBase}/sitemap.xml` : ""}`;

    // ── Auto-register domain if customer said they need one ──────────────────
    // Requires ENABLE_AUTO_DOMAIN_PURCHASE=true in addition to Namecheap keys being set.
    // Without this env gate, domain purchase never fires even if keys are configured.
    if ((q.domainStatus as string) === "needs_domain" && (q.domainName as string) && process.env.ENABLE_AUTO_DOMAIN_PURCHASE === "true") {
      const domainToRegister = (q.domainName as string).trim().toLowerCase();
      try {
        const { registerDomain } = await import("./domainService");
        const ownerNameParts = ownerName.split(" ");
        const firstName = ownerNameParts[0] || project.contactName.split(" ")[0] || "Business";
        const lastName = ownerNameParts.slice(1).join(" ") || project.contactName.split(" ").slice(1).join(" ") || "Owner";
        const registrationResult = await registerDomain(domainToRegister, {
          firstName,
          lastName,
          email: project.contactEmail,
          phone: phone || "+15555550100",
          address: address || "123 Main St",
          city: (q.serviceArea as string)?.split(",")[0]?.trim() || "Minneapolis",
          state: "MN",
          zip: "55401",
          country: "US",
        });
        if (registrationResult.success) {
          console.log(`[SiteGen] Domain registered: ${domainToRegister}`);
          await db.updateOnboardingProject(projectId, { domainName: domainToRegister });
          // Notify customer
          try {
            const { sendEmail } = await import("./email");
            await sendEmail({
              to: project.contactEmail,
              subject: `Your domain ${domainToRegister} has been registered!`,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#111122;color:#eaeaf0"><h2 style="color:#4a9eff">Your domain is registered!</h2><p>We've registered <strong>${domainToRegister}</strong> for you. It will be connected to your site automatically when your build is complete — no action needed.</p><p style="color:#7a7a90">&mdash; The MiniMorph Studios Team</p></div>`,
            });
          } catch {}
        } else {
          console.warn(`[SiteGen] Domain registration failed for ${domainToRegister}:`, registrationResult.error);
        }
      } catch (domainErr: any) {
        console.warn(`[SiteGen] Domain registration skipped: ${domainErr.message}`);
      }
    }

    // Store the cloudflare project name so siteDeployment can reuse it
    const cfProjectName = getProjectName(resolvedBusinessName, projectId);

    if (generationTimedOut) {
      console.warn(`[SiteGenerator] Project ${projectId} completed after timeout; skipping late success updates`);
      return;
    }

    await db.updateOnboardingProject(projectId, {
      generationStatus: "complete",
      generationLog: `Generated ${Object.keys(pages).length} pages: ${Object.keys(pages).join(", ")}`,
      generatedSiteHtml: JSON.stringify(pages),
      // Stage set to pending_admin_review — admin must approve before customer sees preview
      stage: "pending_admin_review",
      cloudflareProjectName: cfProjectName,
    });

    // Also persist pages to S3 individually — best-effort, non-blocking
    try {
      const { ENV: envVars } = await import("../_core/env");
      if (envVars.awsAccessKeyId && envVars.awsS3Bucket) {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          region: envVars.awsRegion,
          credentials: {
            accessKeyId: envVars.awsAccessKeyId,
            secretAccessKey: envVars.awsSecretAccessKey,
          },
        });
        for (const [pageName, html] of Object.entries(pages)) {
          const key = `sites/${projectId}/${pageName}.html`;
          await s3.send(new PutObjectCommand({
            Bucket: envVars.awsS3Bucket,
            Key: key,
            Body: html,
            ContentType: "text/html",
          }));
        }
        console.log(`[SiteGenerator] Uploaded ${Object.keys(pages).length} pages to S3 for project ${projectId}`);
      }
    } catch {
      // S3 upload is non-critical
    }

    // Auto-deploy if admin has enabled the setting AND the ENABLE_AUTO_DEPLOY env var is
    // explicitly set to "true". The env var is a hard gate for MVP safety: a DB value alone
    // cannot trigger auto-deploy. Set ENABLE_AUTO_DEPLOY=true in Railway when the QA +
    // delivery pipeline is fully validated and ready for unsupervised use.
    const autoDeployEnvEnabled = process.env.ENABLE_AUTO_DEPLOY === "true";
    if (!autoDeployEnvEnabled) {
      console.log(`[SiteGen] Auto-deploy skipped for project ${projectId} — ENABLE_AUTO_DEPLOY is not set. Admin review required before deployment.`);
    }
    try {
      const { getDb: getDbForSetting } = await import("../db");
      const { systemSettings: settingsTable } = await import("../../drizzle/schema");
      const { eq: eqSetting } = await import("drizzle-orm");
      const dbForSetting = await getDbForSetting();
      if (autoDeployEnvEnabled && dbForSetting) {
        const rows = await dbForSetting.select().from(settingsTable).where(eqSetting(settingsTable.settingKey, "auto_deploy_enabled"));
        if (rows[0]?.settingValue === "true") {
          const { deployToPages } = await import("./cloudflareDeployment");
          deployToPages({
            projectName: cfProjectName,
            pages,
          }).then(async result => {
            if (result.success) {
              db.updateOnboardingProject(projectId, { stage: "launch", liveUrl: result.deploymentUrl, launchedAt: new Date() }).catch(() => {});
              console.log(`[SiteGen] Auto-deployed project ${projectId} → ${result.deploymentUrl}`);
            } else {
              console.error(`[SiteGen] Auto-deploy returned failure for project ${projectId}`);
              try {
                const { notifyOwner: notifyAutoDeployFail } = await import("../_core/notification");
                await notifyAutoDeployFail({ title: "Auto-deploy failed", content: `Project ${projectId} (${cfProjectName}) failed to deploy to Cloudflare Pages after site generation. Check logs and deploy manually from the admin panel.` });
              } catch {}
            }
          }).catch(async (e: any) => {
            console.error("[SiteGen] Auto-deploy failed:", e.message);
            try {
              const { notifyOwner: notifyAutoDeployErr } = await import("../_core/notification");
              await notifyAutoDeployErr({ title: "Auto-deploy error", content: `Project ${projectId} (${cfProjectName}) threw an error during Cloudflare Pages deployment: ${e.message}` });
            } catch {}
          });
        }
      }
    } catch {}

    // Do NOT send preview email to customer yet — admin must approve preview first
    // The preview email is sent when admin calls adminApprovePreview()

    // Notify admin: preview is ready for their review before customer sees it
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "ACTION: Site Preview Needs Admin Approval",
        content: `${resolvedBusinessName} (#${projectId}) site generation complete.\nPages: ${Object.keys(pages).join(", ")}\n\nACTION: Review the preview in /admin/onboarding and approve it before the customer can see it.\nStage: pending_admin_review`,
      });
    } catch {}

    console.log(`[SiteGenerator] Project ${projectId} generated successfully. Pages: ${Object.keys(pages).join(", ")}`);

    // Fire addon orchestrator (fire-and-forget — does not block or affect site delivery)
    if (project.customerId) {
      try {
        const { runAddonOrchestrator } = await import("./addonOrchestrator");
        const addonCtx = {
          customerId: project.customerId,
          projectId,
          email: project.contactEmail,
          contactName: project.contactName,
          businessName: resolvedBusinessName,
          businessType: (q.industry as string) || websiteType,
          phone: (q.phone as string) || (q.phoneNumber as string) || project.contactPhone || "",
          address: (q.address as string) || (q.serviceArea as string) || "",
          city: (q.city as string) || "",
          state: (q.state as string) || "",
          hours: (q.hours as string) || "",
          domain: project.domainName || project.existingDomain || "",
          siteUrl: project.generatedSiteUrl || `https://${cfProjectName}.pages.dev`,
          googleBusinessUrl: (q.googleBusinessUrl as string) || undefined,
          instagramHandle: (q.instagramHandle as string) || (q.instagram as string) || undefined,
          facebookHandle: (q.facebookHandle as string) || (q.facebook as string) || undefined,
          services: Array.isArray(q.services)
            ? (q.services as string[])
            : typeof q.services === "string"
              ? [q.services as string]
              : [],
          packageTier: project.packageTier,
          purchasedAddons: addonsSelectedRaw.map((a: any) =>
            (a.product || "").toLowerCase().replace(/\s+/g, "_"),
          ),
          questionnaire: q as Record<string, any>,
        };
        runAddonOrchestrator(addonCtx).catch((e: Error) => {
          console.error("[SiteGen] Addon orchestration failed:", e.message);
        });
      } catch {}
    }

    // Fire Agent 4 — QA Inspector (fire-and-forget, does not block site delivery)
    if (project.customerId) {
      try {
        const { runQAWithSafeguards } = await import("./qaOrchestrator");
        const { BuildReporter } = await import("./buildReporter");
        const { getDb } = await import("../db");
        const database = await getDb();
        if (database) {
          const reporter = await BuildReporter.create(project.customerId, projectId, database);
          await reporter.success("site_generation", `Site generated: ${cfProjectName}`, `Pages: ${Object.keys(pages).join(", ")}`);
          await reporter.info("agent3", "Addon orchestration triggered", `Addons: ${addonsSelectedRaw.map((a: any) => a.product || a).join(", ") || "none"}`);

          const qaCtx = {
            customerId: project.customerId,
            projectId,
            // siteUrl is set but won't be fetched in preDeployMode
            siteUrl: project.generatedSiteUrl || `https://${cfProjectName}.pages.dev`,
            businessName: resolvedBusinessName,
            businessType: (q.industry as string) || websiteType || "",
            industry: (q.industry as string) || websiteType || "",
            state: (q.state as string) || "",
            phone: (q.phone as string) || project.contactPhone || "",
            email: project.contactEmail || "",
            address: (q.address as string) || "",
            domain: project.domainName || "",
            purchasedAddons: addonsSelectedRaw.map((a: any) =>
              (a.product || "").toLowerCase().replace(/\s+/g, "_")
            ),
            questionnaire: q as Record<string, any>,
            htmlContent: pages["index"],
            // Pre-deploy mode: all layers use htmlContent only, no live URL fetches
            preDeployMode: true,
          };

          runQAWithSafeguards(qaCtx, reporter, database).then(result => {
            console.log("[Agent4] QA complete:", `${result.score}/100`, result.commissioned ? "COMMISSIONED" : "ESCALATED");
          }).catch((e: Error) => {
            console.error("[Agent4] QA failed:", e.message);
          });
        }
      } catch (e: any) {
        console.error("[Agent4] Failed to start QA:", e.message);
      }
    }
  };
  try {
    await Promise.race([
      _generationBody(),
      new Promise<never>((_, reject) =>
        setTimeout(() => { generationTimedOut = true; reject(new Error("Generation timed out after 25 minutes")); }, 25 * 60 * 1000)
      ),
    ]);
  } catch (err) {
    console.error(`[SiteGenerator] Project ${projectId} generation failed:`, err);
    await db.updateOnboardingProject(projectId, {
      generationStatus: "failed",
      generationLog: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
    }).catch(() => {});
    try {
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "Site Generation Failed",
        content: `Project #${projectId} (${project?.businessName || "unknown"}) failed to generate.\nError: ${err instanceof Error ? err.message : String(err)}\n\nCheck Admin → Onboarding Projects or Sites for details.`,
      });
    } catch {}
    // Notify customer — non-fatal, no technical details exposed
    try {
      const { sendBuildFailedEmail } = await import("./customerEmails");
      await sendBuildFailedEmail({
        to: project.contactEmail,
        customerName: project.contactName,
        businessName: project.businessName || "your business",
        portalUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal`,
      });
    } catch {}
  }
}

export async function generateSiteHtmlDirect(params: {
  businessName: string;
  packageTier: string;
  industry: string;
  pages: string[];
  questionnaire: Record<string, unknown>;
}): Promise<string> {
  const systemPrompt = `${PREMIUM_REQUIREMENTS}

You are an expert web designer using Tailwind CSS CDN. Include <script src="https://cdn.tailwindcss.com"></script> in every page's <head>.
Use a single Google Fonts <link> for typography. No <style> block. No external framework.
For images add a comment <!-- REPLACE WITH: description --> where photos would go, and use HERO_IMAGE / GALLERY_IMAGE_1 tokens where applicable.
Pages must link to each other using relative hrefs (about.html, services.html, etc.).

Output ONLY a valid JSON object where each key is a page name and each value is complete HTML.
Output ONLY valid JSON, no markdown fences, no explanation, no wrapper key.`;

  const userPrompt = `Generate a complete, world-class ${params.industry} website for this business.

BUSINESS: ${params.businessName}
INDUSTRY: ${params.industry}
PACKAGE: ${params.packageTier}
PAGES TO GENERATE: ${params.pages.join(", ")}

This is a SHOWROOM DEMO site — the best-looking small business website the visitor has ever seen.
Include ALL add-ons listed in addOnsIncluded as fully-styled working widgets using the exact HTML templates from the system prompt.
Every widget must be visually present, branded to match the site, and look completely real.

FULL QUESTIONNAIRE DATA:
${JSON.stringify(params.questionnaire, null, 2)}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 32000,
  });

  const rawContent = typeof result.choices[0]?.message?.content === "string"
    ? result.choices[0].message.content
    : "";

  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let pages: Record<string, string>;
  try {
    const parsed = JSON.parse(cleaned);
    pages = parsed.pages && typeof parsed.pages === "object" ? parsed.pages : (parsed as Record<string, string>);
  } catch {
    throw new Error(`AI returned non-JSON output. Raw: ${rawContent.slice(0, 300)}`);
  }

  if (!pages || Object.keys(pages).length === 0) {
    throw new Error("AI returned empty pages");
  }

  return JSON.stringify(pages);
}
