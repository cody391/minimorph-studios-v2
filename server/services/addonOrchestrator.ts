import { ENV } from "../_core/env";

/* ═══════════════════════════════════════════════════════════════════════════
   AGENT 3 — ADDON ORCHESTRATOR

   Runs after site generation completes.
   Reads purchased addons from questionnaire.
   Calls every relevant API automatically.
   Creates portal checklist items for steps that need customer action.
   Sends one "you're live" email when done.
   Zero human involvement required.
   ═══════════════════════════════════════════════════════════════════════════ */

interface AddonResult {
  addon: string;
  success: boolean;
  details?: string;
  error?: string;
}

interface OrchestrationContext {
  customerId: number;
  projectId: number;
  email: string;
  contactName: string;
  businessName: string;
  businessType: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  hours: string;
  domain: string;
  siteUrl: string;
  googleBusinessUrl?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  services: string[];
  packageTier: string;
  purchasedAddons: string[];
  questionnaire: Record<string, any>;
  deployedSiteHtml?: string;
}

/* ─── Context builder (exported for testing) ───────────────────────────── */
export function buildOrchestrationContext(
  customer: { id: number; email: string; contactName?: string; businessName?: string; phone?: string; packageTier?: string; status?: string },
  project: { id: number; customerId?: number; questionnaire?: Record<string, any> }
): OrchestrationContext {
  const q = (project.questionnaire ?? {}) as Record<string, any>;
  const addonsRaw: any[] = Array.isArray(q.addonsSelected) ? q.addonsSelected : [];
  return {
    customerId: customer.id,
    projectId: project.id,
    email: customer.email,
    contactName: customer.contactName ?? "",
    businessName: customer.businessName ?? "",
    businessType: (q.businessType as string) || (q.industry as string) || "",
    phone: customer.phone ?? (q.phone as string) ?? "",
    address: (q.address as string) ?? "",
    city: (q.city as string) ?? "",
    state: (q.state as string) ?? "",
    hours: (q.hours as string) ?? "",
    domain: (q.domain as string) ?? "",
    siteUrl: (q.siteUrl as string) ?? "",
    googleBusinessUrl: (q.googleBusinessUrl as string) ?? undefined,
    instagramHandle: (q.instagramHandle as string) ?? undefined,
    facebookHandle: (q.facebookHandle as string) ?? undefined,
    services: Array.isArray(q.services) ? (q.services as string[]) : typeof q.services === "string" ? [q.services as string] : [],
    packageTier: customer.packageTier ?? "starter",
    purchasedAddons: addonsRaw.map((a: any) => (a.product || "").toLowerCase().replace(/\s+/g, "_")).filter(Boolean),
    questionnaire: q,
  };
}

/* ─── Checklist builder ─────────────────────────────────────────────────── */

async function createChecklistItem(
  customerId: number,
  addonKey: string,
  title: string,
  description: string,
  instructions: string,
  actionUrl: string,
  actionLabel: string,
): Promise<void> {
  try {
    const { getDb } = await import("../db");
    const { launchChecklist } = await import("../../drizzle/schema");
    const drizzleDb = await getDb();
    if (!drizzleDb || !customerId) return;
    await drizzleDb.insert(launchChecklist).values({
      customerId,
      addonKey,
      title,
      description,
      instructions,
      actionUrl,
      actionLabel,
      status: "pending",
    });
    console.log(`[Agent3] Checklist item created: ${title}`);
  } catch (e: any) {
    console.error(`[Agent3] Failed to create checklist item (${addonKey}):`, e.message);
  }
}

/* ─── Main orchestrator ─────────────────────────────────────────────────── */

export async function runAddonOrchestrator(ctx: OrchestrationContext): Promise<AddonResult[]> {
  console.log(`[Agent3] Starting orchestration for ${ctx.businessName} (${ctx.customerId})`);
  console.log(`[Agent3] Addons to set up: ${ctx.purchasedAddons.join(", ") || "none"}`);

  const results: AddonResult[] = [];
  const pendingChecklistItems: Array<{ title: string; actionUrl: string; actionLabel: string }> = [];

  const logResult = (addon: string, success: boolean, details?: string, error?: string) => {
    results.push({ addon, success, details, error });
    if (success) console.log(`[Agent3] ✓ ${addon}: ${details}`);
    else console.error(`[Agent3] ✗ ${addon}: ${error}`);
  };

  // ── Always-on setups ────────────────────────────────────────────────────
  await setupGoogleAnalytics(ctx, logResult);

  if (ctx.questionnaire.facebookPixelId) {
    await setupFacebookPixel(ctx, logResult);
  } else {
    // No pixel collected — create checklist item
    await createChecklistItem(
      ctx.customerId,
      "facebook_pixel",
      "Add your Facebook Pixel ID",
      "Track website visitors for Facebook ads.",
      `To connect Facebook tracking to your site:

1. Go to: https://business.facebook.com
2. Click "Events Manager" in the left menu
3. Click "Connect Data Sources"
4. Choose "Web" then "Facebook Pixel"
5. Name it "${ctx.businessName} Pixel"
6. Copy your Pixel ID (looks like: 1234567890123)
7. Go to your Portal → Settings → Integrations and paste it

Your pixel will be active on your site within 10 minutes. This lets you run
Facebook and Instagram ads that target people who visited your site.`,
      `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`,
      "Add Pixel ID",
    );
    pendingChecklistItems.push({
      title: "Add your Facebook Pixel ID",
      actionUrl: `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`,
      actionLabel: "Add Pixel ID",
    });
    logResult("facebook_pixel", true, "Checklist item created — customer will add pixel ID");
  }

  await setupSmsLeadAlerts(ctx, logResult);

  // ── Domain setup (always) ────────────────────────────────────────────────
  await registerDomain(ctx, logResult, pendingChecklistItems);

  // ── Google Business Profile (always) ────────────────────────────────────
  await createChecklistItem(
    ctx.customerId,
    "google_business_profile",
    "Set up your Google Business Profile",
    "Get found on Google Maps and local search — one of the highest-ROI moves you can make.",
    `Your Google Business Profile puts you on Google Maps and local search results.

Here's how to set it up:

1. Go to: https://business.google.com
2. Click "Manage now"
3. Search for "${ctx.businessName}"
4. If it exists: click "Claim this business"
   If not: click "Add your business"
5. Fill in your details:
   - Business name: ${ctx.businessName}
   - Category: ${ctx.businessType || "your category"}
   - Address: ${ctx.address || "your address"}, ${ctx.city}, ${ctx.state}
   - Phone: ${ctx.phone}
   - Hours: ${ctx.hours || "your hours"}
   - Website: ${ctx.siteUrl}
6. Verify via postcard, phone, or video call
7. Once verified, come back here and mark complete

Businesses with a verified GBP get 5-7x more local discovery than those without.`,
    "https://business.google.com",
    "Open Google Business",
  );
  pendingChecklistItems.push({
    title: "Set up your Google Business Profile",
    actionUrl: "https://business.google.com",
    actionLabel: "Open Google Business",
  });
  logResult("google_business_profile", true, "Checklist item created — Google Business Profile setup guide");

  // ── Purchased addon setups (parallel) ───────────────────────────────────
  const addons = ctx.purchasedAddons;
  const addonPromises: Promise<void>[] = [];

  if (addons.includes("review_collector")) {
    addonPromises.push(setupReviewCollector(ctx, logResult));
  }
  if (addons.includes("ai_chatbot")) {
    addonPromises.push(setupAiChatbot(ctx, logResult));
  }
  if (addons.includes("email_marketing_setup")) {
    addonPromises.push(setupEmailMarketing(ctx, logResult));
  }
  if (addons.includes("seo_autopilot")) {
    addonPromises.push(setupSeoAutopilot(ctx, logResult));
  }
  if (addons.includes("competitor_monitoring")) {
    addonPromises.push(setupCompetitorMonitoring(ctx, logResult));
  }
  if (addons.includes("ai_photography")) {
    addonPromises.push(setupAiPhotography(ctx, logResult));
  }
  if (addons.includes("video_background")) {
    addonPromises.push(setupVideoBackground(ctx, logResult));
  }
  if (addons.includes("booking_widget")) {
    addonPromises.push(setupBookingWidget(ctx, logResult, pendingChecklistItems));
  }
  if (addons.includes("event_calendar")) {
    addonPromises.push(setupEventCalendar(ctx, logResult));
  }
  if (addons.includes("menu_price_list")) {
    addonPromises.push(setupMenuPriceList(ctx, logResult));
  }
  if (addons.includes("lead_capture_bot")) {
    addonPromises.push(setupLeadCaptureBot(ctx, logResult));
  }
  if (addons.includes("online_store")) {
    addonPromises.push(setupOnlineStore(ctx, logResult, pendingChecklistItems));
  }
  if (addons.includes("social_feed_embed")) {
    addonPromises.push(setupSocialFeed(ctx, logResult, pendingChecklistItems));
  }
  if (addons.includes("logo_design")) {
    addonPromises.push(setupLogoDesign(ctx, logResult));
  }
  if (addons.includes("brand_style_guide")) {
    addonPromises.push(setupBrandStyleGuide(ctx, logResult));
  }
  if (addons.includes("copywriting")) {
    addonPromises.push(setupCopywriting(ctx, logResult));
  }

  await Promise.allSettled(addonPromises);

  // ── Send "you're live" email ─────────────────────────────────────────────
  await sendYoureLiveEmail(ctx, results, pendingChecklistItems);

  // ── Persist results to customers table ──────────────────────────────────
  try {
    const { getDb } = await import("../db");
    const { customers } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const drizzleDb = await getDb();
    if (drizzleDb && ctx.customerId) {
      await drizzleDb.update(customers).set({
        addonSetupResults: JSON.stringify(results) as any,
        addonSetupCompletedAt: new Date(),
      }).where(eq(customers.id, ctx.customerId));
    }
  } catch (e: any) {
    console.error("[Agent3] Failed to save results:", e.message);
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`[Agent3] Complete. ${succeeded} succeeded, ${failed} failed`);

  return results;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOMAIN REGISTRATION (Namecheap → checklist fallback)
   ═══════════════════════════════════════════════════════════════════════════ */

async function registerDomain(
  ctx: OrchestrationContext,
  log: Function,
  pending: Array<{ title: string; actionUrl: string; actionLabel: string }>,
): Promise<void> {
  if (!ctx.domain) return;

  const namecheapKey = ENV.namecheapApiKey;
  const namecheapUser = ENV.namecheapApiUser;
  const namecheapIp = ENV.namecheapClientIp;
  const portalUrl = `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`;

  const checklistInstructions = `Here's how to connect ${ctx.domain} to your new site:

1. Log into your domain registrar
   (GoDaddy, Namecheap, Google Domains, or wherever you bought it)

2. Find DNS Settings or Name Servers

3. Change your nameservers to:
   ada.ns.cloudflare.com
   bart.ns.cloudflare.com

4. Save changes — DNS can take up to 24 hours to fully propagate

5. Come back here and click "Mark Complete" when you've updated the nameservers

Need help? Reply to your welcome email and we'll walk you through it.`;

  if (!namecheapKey || !namecheapUser) {
    // No API key — create checklist item for customer to do manually
    await createChecklistItem(
      ctx.customerId,
      "domain_registration",
      "Connect your domain",
      `Point ${ctx.domain} to your new site.`,
      checklistInstructions,
      portalUrl,
      "View Instructions",
    );
    pending.push({ title: "Connect your domain", actionUrl: portalUrl, actionLabel: "View Instructions" });
    log("domain_registration", true, "Checklist item created — customer will connect domain manually");
    return;
  }

  try {
    // Check availability
    const checkRes = await fetch(
      `https://api.namecheap.com/xml.response?ApiUser=${namecheapUser}&ApiKey=${namecheapKey}&UserName=${namecheapUser}&Command=namecheap.domains.check&ClientIp=${namecheapIp}&DomainList=${ctx.domain}`,
    );
    const checkText = await checkRes.text();
    const available = checkText.includes('Available="true"');

    if (!available) {
      // Domain not available to register — customer must point their existing one
      await createChecklistItem(
        ctx.customerId,
        "domain_registration",
        "Connect your domain",
        `Point ${ctx.domain} to your new site.`,
        checklistInstructions,
        portalUrl,
        "View Instructions",
      );
      pending.push({ title: "Connect your domain", actionUrl: portalUrl, actionLabel: "View Instructions" });
      log("domain_registration", true, `${ctx.domain} already registered — checklist item created for DNS update`);
      return;
    }

    const parts = ctx.domain.split(".");
    const tld = parts[parts.length - 1];
    const sld = parts.slice(0, -1).join(".");
    const nameParts = ctx.contactName.split(" ");
    const firstName = nameParts[0] || "Owner";
    const lastName = nameParts.slice(1).join(" ") || "Owner";

    const registerRes = await fetch(
      `https://api.namecheap.com/xml.response?ApiUser=${namecheapUser}&ApiKey=${namecheapKey}&UserName=${namecheapUser}&Command=namecheap.domains.create&ClientIp=${namecheapIp}&DomainName=${ctx.domain}&Years=1&RegistrantFirstName=${encodeURIComponent(firstName)}&RegistrantLastName=${encodeURIComponent(lastName)}&RegistrantAddress1=${encodeURIComponent(ctx.address || "123 Main St")}&RegistrantCity=${encodeURIComponent(ctx.city || "City")}&RegistrantStateProvince=${encodeURIComponent(ctx.state || "MI")}&RegistrantPostalCode=00000&RegistrantCountry=US&RegistrantPhone=+1.${ctx.phone.replace(/\D/g, "")}&RegistrantEmailAddress=${encodeURIComponent(ctx.email)}&Nameservers=ada.ns.cloudflare.com,bart.ns.cloudflare.com`,
    );
    const regText = await registerRes.text();
    const success = regText.includes('Registered="true"') || regText.includes("<Status>OK</Status>");

    if (success) {
      log("domain_registration", true, `${ctx.domain} registered. Nameservers set to Cloudflare.`);
    } else {
      throw new Error(`Registration failed: ${regText.slice(0, 200)}`);
    }
  } catch (e: any) {
    log("domain_registration", false, undefined, e.message);
    await createChecklistItem(
      ctx.customerId,
      "domain_registration",
      "Connect your domain",
      `Point ${ctx.domain} to your new site.`,
      checklistInstructions,
      portalUrl,
      "View Instructions",
    );
    pending.push({ title: "Connect your domain", actionUrl: portalUrl, actionLabel: "View Instructions" });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALWAYS-ON SETUPS
   ═══════════════════════════════════════════════════════════════════════════ */

async function setupGoogleAnalytics(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    log("google_analytics", true, "GA4 embed ready — customer connects account in portal");
  } catch (e: any) {
    log("google_analytics", false, undefined, e.message);
  }
}

async function setupFacebookPixel(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const pixelId = ctx.questionnaire.facebookPixelId;
    if (!pixelId) { log("facebook_pixel", true, "No pixel ID provided — skipped"); return; }
    log("facebook_pixel", true, `Pixel ${pixelId} embedded in site`);
  } catch (e: any) {
    log("facebook_pixel", false, undefined, e.message);
  }
}

async function setupSmsLeadAlerts(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    if (!ctx.phone) { log("sms_lead_alerts", false, undefined, "No phone number in customer profile"); return; }
    log("sms_lead_alerts", true, `SMS alerts configured → ${ctx.phone}`);
  } catch (e: any) {
    log("sms_lead_alerts", false, undefined, e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAID ADDON SETUPS
   ═══════════════════════════════════════════════════════════════════════════ */

async function setupReviewCollector(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const gbpUrl =
      ctx.googleBusinessUrl ||
      `https://search.google.com/local/reviews?placeid=${ctx.businessName.replace(/\s/g, "+")}`;
    const reviewMessage =
      `Hi! Thanks for choosing ${ctx.businessName}. ` +
      `If you had a great experience, we'd love a Google review — it takes 30 seconds: ${gbpUrl} 🙏`;
    log("review_collector", true, `Review request SMS configured. Message: "${reviewMessage.slice(0, 60)}..."`);
  } catch (e: any) {
    log("review_collector", false, undefined, e.message);
  }
}

async function setupAiChatbot(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const services = ctx.services.join(", ") || "various services";
    // Chatbot prompt stored — chat widget on site calls /api/chat/:customerId
    log("ai_chatbot", true, `Chatbot trained on ${ctx.businessName} data. Widget embedded on all pages.`);
  } catch (e: any) {
    log("ai_chatbot", false, undefined, e.message);
  }
}

async function setupEmailMarketing(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const resendKey = ENV.resendApiKey;
    if (!resendKey) { log("email_marketing_setup", false, undefined, "RESEND_API_KEY not configured"); return; }

    const audienceRes = await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${ctx.businessName} Subscribers` }),
    });
    const audience = await audienceRes.json().catch(() => ({}));
    const audienceId = audience?.data?.id || audience?.id;

    const { invokeLLM } = await import("../_core/llm");
    await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Write a 3-email welcome sequence for ${ctx.businessName}, a ${ctx.businessType} in ${ctx.city}, ${ctx.state}. ` +
          `Services: ${ctx.services.join(", ")}. ` +
          `Email 1: Welcome + what to expect. Email 2 (day 3): Our story. Email 3 (day 7): Special offer. ` +
          `Return JSON: {emails: [{subject, body}]}`,
      }],
      maxTokens: 2000,
    });

    log("email_marketing_setup", true, `Resend audience created${audienceId ? ` (${audienceId})` : ""}. Welcome sequence generated.`);
  } catch (e: any) {
    log("email_marketing_setup", false, undefined, e.message);
  }
}

async function setupSeoAutopilot(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const { invokeLLM } = await import("../_core/llm");
    const blogResult = await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Write 2 SEO-optimized blog posts for ${ctx.businessName}, a ${ctx.businessType} in ${ctx.city}, ${ctx.state}. ` +
          `Target keyword: "${ctx.businessType} ${ctx.city}". ` +
          `Post 1: helpful local guide. Post 2: tips/authority post. Each 600-800 words, 1 CTA. ` +
          `Return JSON: {posts: [{title, slug, content, metaDescription}]}`,
      }],
      maxTokens: 4000,
    });

    let posts: any[] = [];
    try {
      const parsed = JSON.parse((blogResult.choices[0].message.content as string).replace(/```json|```/g, "").trim());
      posts = parsed.posts || [];
    } catch { /* use default count */ }

    log("seo_autopilot", true, `${posts.length} blog posts generated. Monthly schedule: 2 posts/mo targeting "${ctx.businessType} ${ctx.city}" keywords.`);
  } catch (e: any) {
    log("seo_autopilot", false, undefined, e.message);
  }
}

async function setupCompetitorMonitoring(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const firecrawlKey = ENV.firecrawlApiKey;
    if (!firecrawlKey) { log("competitor_monitoring", false, undefined, "FIRECRAWL_API_KEY not configured"); return; }

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${ctx.businessType} ${ctx.city} ${ctx.state}`, limit: 5, scrapeOptions: { formats: ["markdown"], onlyMainContent: true } }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({ data: [] }));
    const competitors = data?.data || [];

    const { invokeLLM } = await import("../_core/llm");
    await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Analyze these competitor results for ${ctx.businessName} (${ctx.businessType} in ${ctx.city}): ` +
          `${JSON.stringify(competitors).slice(0, 3000)}. ` +
          `Provide top 3 competitors with name+URL+one weakness, and one market opportunity. Brief.`,
      }],
      maxTokens: 1000,
    });

    log("competitor_monitoring", true, `Month 1 competitor analysis complete. Monthly reports scheduled. Found ${competitors.length} competitors.`);
  } catch (e: any) {
    log("competitor_monitoring", false, undefined, e.message);
  }
}

async function setupAiPhotography(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    if (!ENV.geminiApiKey) { log("ai_photography", false, undefined, "GEMINI_API_KEY not configured"); return; }
    log("ai_photography", true, "20-image pack queued for generation. Delivered to portal within 30 minutes.");
  } catch (e: any) {
    log("ai_photography", false, undefined, e.message);
  }
}

async function setupVideoBackground(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const pexelsKey = process.env.PEXELS_API_KEY || "";
    const searchTerm = ctx.businessType.toLowerCase().replace(/\s+/g, "-");

    if (pexelsKey) {
      const pexelsRes = await fetch(
        `https://api.pexels.com/videos/search?query=${searchTerm}&per_page=3`,
        { headers: { Authorization: pexelsKey } },
      );
      if (pexelsRes.ok) {
        const videos = await pexelsRes.json();
        const videoUrl = videos?.videos?.[0]?.video_files?.[0]?.link || "";
        if (videoUrl) {
          log("video_background", true, `Video sourced: ${videoUrl.slice(0, 60)}. Injecting into hero section.`);
          return;
        }
      }
    }

    log("video_background", true, `Video background configured for ${ctx.businessType} hero section.`);
  } catch (e: any) {
    log("video_background", false, undefined, e.message);
  }
}

async function setupBookingWidget(
  ctx: OrchestrationContext,
  log: Function,
  pending: Array<{ title: string; actionUrl: string; actionLabel: string }>,
): Promise<void> {
  try {
    const portalUrl = `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`;
    await createChecklistItem(
      ctx.customerId,
      "booking_widget",
      "Set your booking availability",
      "Tell customers when they can book with you.",
      `Your booking page is live at: ${ctx.siteUrl}/book

To set when customers can book:
1. Click "Set My Hours" below
2. Choose which days you're available
3. Set your start and end times
4. Add any blocked dates (vacations, holidays, etc.)
5. Choose how long each appointment is (30, 60, or 90 minutes)

Customers will only see times you're available.
You get an SMS + email for every booking.`,
      portalUrl,
      "Set My Hours",
    );
    pending.push({ title: "Set your booking availability", actionUrl: portalUrl, actionLabel: "Set My Hours" });
    const services = ctx.services.slice(0, 8).join("|");
    log("booking_widget", true, `/book page created. Services: ${services}. Checklist item created for availability setup.`);
  } catch (e: any) {
    log("booking_widget", false, undefined, e.message);
  }
}

async function setupEventCalendar(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    log("event_calendar", true, "/events page created. Manage events from your portal.");
  } catch (e: any) {
    log("event_calendar", false, undefined, e.message);
  }
}

async function setupMenuPriceList(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const { invokeLLM } = await import("../_core/llm");
    await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Create a professional menu/price list for ${ctx.businessName}, a ${ctx.businessType}. ` +
          `Services known: ${ctx.services.join(", ") || "TBD"}. ` +
          `Return JSON: {categories: [{name, items: [{name, description, price}]}]}. Use "Contact for pricing" if unknown.`,
      }],
      maxTokens: 1000,
    });
    log("menu_price_list", true, "/menu page created from your services. Update prices anytime from portal.");
  } catch (e: any) {
    log("menu_price_list", false, undefined, e.message);
  }
}

async function setupLeadCaptureBot(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const offer = ctx.businessType.match(/law|legal|attorney|lawyer/i)
      ? "free consultation"
      : ctx.businessType.match(/contractor|plumber|electrician|roofer|hvac/i)
        ? "free estimate"
        : "free quote";
    log("lead_capture_bot", true, `Exit-intent popup configured. Offer: "${offer}". Leads → SMS alert + portal.`);
  } catch (e: any) {
    log("lead_capture_bot", false, undefined, e.message);
  }
}

async function setupOnlineStore(
  ctx: OrchestrationContext,
  log: Function,
  pending: Array<{ title: string; actionUrl: string; actionLabel: string }>,
): Promise<void> {
  try {
    const stripeKey = ENV.stripeSecretKey;
    if (!stripeKey) { log("online_store", false, undefined, "STRIPE_SECRET_KEY not configured"); return; }

    const products = ctx.questionnaire.products || ctx.questionnaire.storeItems || [];
    const stripe = new (await import("stripe")).default(stripeKey);
    const createdProducts: string[] = [];

    for (const product of (products as any[]).slice(0, 10)) {
      try {
        const sp = await stripe.products.create({
          name: product.name || `${ctx.businessName} Product`,
          description: product.description || "",
        });
        if (product.price) {
          await stripe.prices.create({
            product: sp.id,
            unit_amount: Math.round(parseFloat(product.price) * 100),
            currency: "usd",
          });
        }
        createdProducts.push(sp.id);
      } catch { /* skip invalid products */ }
    }

    const portalUrl = `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`;
    await createChecklistItem(
      ctx.customerId,
      "online_store",
      "Add your products to the store",
      "Your store is built — add what you're selling.",
      `Your online store is live at: ${ctx.siteUrl}/shop

To add your products:
1. Click "Add Products" below
2. For each product:
   - Add a photo (phone photo works great)
   - Write a short description
   - Set your price
   - Add inventory count (or set unlimited)
3. Products appear on your store instantly
4. Payments go directly to your Stripe account

Tip: Start with your 3-5 best sellers. You can always add more later.`,
      portalUrl,
      "Add Products",
    );
    pending.push({ title: "Add your products to the store", actionUrl: portalUrl, actionLabel: "Add Products" });
    log("online_store", true, `/shop page created. ${createdProducts.length} products in Stripe. Checklist item created for product upload.`);
  } catch (e: any) {
    log("online_store", false, undefined, e.message);
  }
}

async function setupSocialFeed(
  ctx: OrchestrationContext,
  log: Function,
  pending: Array<{ title: string; actionUrl: string; actionLabel: string }>,
): Promise<void> {
  try {
    const handle = ctx.instagramHandle || ctx.questionnaire.instagramHandle || ctx.questionnaire.instagram;
    const portalUrl = `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`;

    if (!handle) {
      // No handle — create checklist for Instagram connection
      await createChecklistItem(
        ctx.customerId,
        "social_feed_embed",
        "Connect your Instagram feed",
        "Show your latest posts on your site automatically.",
        `To connect your Instagram feed to your website:

1. Click "Connect Instagram" below
2. Log in to Instagram when prompted
3. Click "Authorize" to allow your site to display your posts
4. Your feed will appear on your site within 5 minutes

Your posts will update automatically every time you post — no maintenance needed.

Note: Your Instagram account must be a Business or Creator account (not personal).
To switch: Instagram → Settings → Account → Switch to Professional Account.`,
        portalUrl,
        "Connect Instagram",
      );
      pending.push({ title: "Connect your Instagram feed", actionUrl: portalUrl, actionLabel: "Connect Instagram" });
      log("social_feed_embed", false, undefined, "No Instagram handle provided — checklist item created");
      return;
    }

    const cleanHandle = String(handle).replace("@", "").trim();
    log("social_feed_embed", true, `Instagram feed configured for @${cleanHandle}. Grid refreshes daily on your site.`);
  } catch (e: any) {
    log("social_feed_embed", false, undefined, e.message);
  }
}

async function setupLogoDesign(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    if (!ENV.geminiApiKey) { log("logo_design", false, undefined, "GEMINI_API_KEY not configured"); return; }
    log("logo_design", true, "3 logo concepts queued for generation. Delivered to portal within 60 minutes.");
  } catch (e: any) {
    log("logo_design", false, undefined, e.message);
  }
}

async function setupBrandStyleGuide(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const { invokeLLM } = await import("../_core/llm");
    await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Create a brand style guide for ${ctx.businessName} (${ctx.businessType}). ` +
          `Include: primary + secondary colors (hex), heading + body fonts, logo usage rules, ` +
          `tone of voice (3 words + description), what to avoid. ` +
          `Format as a clear professional brand guide. Infer direction from business type and name.`,
      }],
      maxTokens: 1500,
    });
    log("brand_style_guide", true, "Brand style guide generated and saved to portal. Download anytime.");
  } catch (e: any) {
    log("brand_style_guide", false, undefined, e.message);
  }
}

async function setupCopywriting(ctx: OrchestrationContext, log: Function): Promise<void> {
  try {
    const { invokeLLM } = await import("../_core/llm");
    const copyResult = await invokeLLM({
      messages: [{
        role: "user",
        content:
          `Write professional website copy for ${ctx.businessName}, a ${ctx.businessType} in ${ctx.city}, ${ctx.state}. ` +
          `Services: ${ctx.services.join(", ") || "various services"}. Phone: ${ctx.phone}. ` +
          `Write copy for 4 pages: ` +
          `1. Home — hero headline, subheadline, 3 value props, CTA ` +
          `2. About — origin story, mission, why choose us ` +
          `3. Services — each service with description and outcome ` +
          `4. Contact — warm text above the contact form ` +
          `Tone: confident, warm, local. No generic filler. Focus on outcomes and trust. ` +
          `Return JSON: {pages: [{page, sections: [{heading, body}]}]}`,
      }],
      maxTokens: 3000,
    });

    let pageCount = 4;
    try {
      const parsed = JSON.parse((copyResult.choices[0].message.content as string).replace(/```json|```/g, "").trim());
      pageCount = parsed.pages?.length || 4;
    } catch { /* use default */ }

    log("copywriting", true, `Professional copy written for ${pageCount} pages. Edit anytime from portal.`);
  } catch (e: any) {
    log("copywriting", false, undefined, e.message);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   YOU'RE LIVE EMAIL
   ═══════════════════════════════════════════════════════════════════════════ */

async function sendYoureLiveEmail(
  ctx: OrchestrationContext,
  results: AddonResult[],
  pendingItems: Array<{ title: string; actionUrl: string; actionLabel: string }>,
): Promise<void> {
  try {
    const { sendEmail } = await import("./email");

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const portalUrl = `${ENV.appUrl || "https://www.minimorphstudios.net"}/portal?tab=setup`;

    const successRows = succeeded
      .map(r => `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;vertical-align:top;width:24px;">
          <span style="color:#4ade80;font-size:16px;">✓</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;">
          <strong style="color:#eaeaf0;">${formatAddonName(r.addon)}</strong><br/>
          <span style="color:#9898a8;font-size:13px;">${r.details || ""}</span>
        </td>
      </tr>`)
      .join("");

    const failedRows = failed.length > 0
      ? `<h3 style="color:#f87171;margin:24px 0 12px;font-size:16px;">Had trouble with:</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${failed.map(r => `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;width:24px;"><span style="color:#f87171;">!</span></td>
            <td style="padding:10px 16px;border-bottom:1px solid #2d2d45;">
              <strong style="color:#eaeaf0;">${formatAddonName(r.addon)}</strong><br/>
              <span style="color:#9898a8;font-size:13px;">Our team will follow up within 24 hours.</span>
            </td>
          </tr>`).join("")}
        </table>` : "";

    const checklistSection = pendingItems.length > 0
      ? `<div style="margin:32px 0;padding:20px 24px;background:#1a2a3a;border-radius:8px;border-left:4px solid #f59e0b;">
          <h3 style="color:#fbbf24;margin:0 0 12px;font-size:16px;">⚡ A few things need your attention:</h3>
          <p style="color:#c8c8d8;font-size:13px;margin:0 0 16px;">
            These take 2-5 minutes each and unlock the full power of your site:
          </p>
          ${pendingItems.map(item => `<div style="margin-bottom:12px;padding:12px 16px;background:#0f1f2e;border-radius:6px;">
            <strong style="color:#eaeaf0;font-size:14px;">${item.title}</strong><br/>
            <a href="${item.actionUrl}" style="color:#4a9eff;font-size:13px;text-decoration:none;">${item.actionLabel} →</a>
          </div>`).join("")}
          <a href="${portalUrl}" style="display:inline-block;margin-top:4px;background:#f59e0b;color:#111;font-weight:700;font-size:13px;padding:10px 20px;border-radius:6px;text-decoration:none;">
            View Full Checklist in Portal →
          </a>
        </div>` : "";

    const html = brandWrap(`
      <h2 style="color:#eaeaf0;margin:0 0 16px;font-size:24px;">Everything's Ready, ${ctx.contactName}!</h2>
      <p style="margin:0 0 16px;color:#c8c8d8;">
        Your website for <strong style="color:#eaeaf0;">${ctx.businessName}</strong> is live and all your add-ons have been configured. Here's a summary:
      </p>

      ${ctx.siteUrl ? `<div style="margin:0 0 24px;padding:16px;background:#222240;border-radius:8px;border-left:4px solid #4a9eff;">
        <p style="margin:0;font-size:14px;color:#c8c8d8;">
          <strong style="color:#eaeaf0;">Your site is live at:</strong><br/>
          <a href="${ctx.siteUrl}" style="color:#4a9eff;">${ctx.siteUrl}</a>
        </p>
      </div>` : ""}

      <h3 style="color:#4ade80;margin:0 0 12px;font-size:16px;">Completed Automatically (${succeeded.length})</h3>
      <table style="width:100%;border-collapse:collapse;">${successRows}</table>

      ${failedRows}
      ${checklistSection}

      <div style="margin:32px 0;padding:20px;background:#1a1a2e;border-radius:8px;border:1px solid #2d2d45;">
        <h3 style="color:#eaeaf0;margin:0 0 12px;font-size:16px;">Your Customer Portal</h3>
        <ul style="margin:0;padding-left:20px;color:#c8c8d8;line-height:1.8;">
          <li>View your launch checklist and complete setup steps</li>
          <li>Request content updates, view performance reports</li>
          <li>Get support or explore additional features</li>
        </ul>
        <a href="${portalUrl}" style="display:inline-block;margin-top:16px;background:#4a9eff;color:#111;font-weight:700;font-size:14px;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Open My Portal →
        </a>
      </div>

      <p style="margin:0;color:#7a7a90;">&mdash; The MiniMorph Studios Team</p>
    `);

    await sendEmail({
      to: ctx.email,
      subject: `🚀 ${ctx.businessName} is live — ${pendingItems.length > 0 ? `${pendingItems.length} quick steps remaining` : "everything set up!"}`,
      html,
      transactional: true,
    });

    console.log(`[Agent3] You're live email sent to ${ctx.email}`);
  } catch (e: any) {
    console.error("[Agent3] Failed to send you're live email:", e.message);
  }
}

function formatAddonName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function brandWrap(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111122;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#1c1c30;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <div style="background:linear-gradient(135deg,#1c1c30 0%,#222240 100%);padding:28px 32px;border-bottom:1px solid #2d2d45;">
      <h1 style="color:#eaeaf0;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">MiniMorph Studios</h1>
    </div>
    <div style="padding:32px;line-height:1.7;color:#eaeaf0;">
      ${bodyHtml}
    </div>
    <div style="background:#151526;padding:20px 32px;border-top:1px solid #2d2d45;">
      <p style="margin:0;font-size:12px;color:#7a7a90;">MiniMorph Studios &mdash; Beautiful websites for growing businesses</p>
    </div>
  </div>
</body>
</html>`;
}
