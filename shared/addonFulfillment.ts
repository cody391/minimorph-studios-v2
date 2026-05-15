/**
 * Add-On Fulfillment Registry — B9 Add-On Fulfillment Truth Gate
 *
 * SINGLE SOURCE OF TRUTH for what MiniMorph can and cannot fulfill.
 * Elena, checkout, Blueprint builder, site generator, admin panel, and customer
 * portal must all derive from this file — never from hardcoded lists elsewhere.
 *
 * RULE: Elena may only recommend add-ons where canElenaRecommend === true.
 * RULE: Checkout may only accept add-ons where canCheckoutPurchase === true.
 * RULE: Generator may only embed add-ons where generatorSupported === true.
 * RULE: Billing may only charge for add-ons where billingSupported === true.
 */

export type AddonPublicOfferStatus =
  | "offered"          // Fully supported — Elena can recommend, checkout can accept, platform fulfills
  | "team_setup"       // Platform fulfills via MiniMorph team setup after purchase
  | "internal_only"    // Runs automatically — never shown to customers
  | "blocked"          // Platform cannot fulfill — Elena must not recommend, checkout must reject
  | "custom_review"    // Requires custom quote / special review — Elena cannot pitch a price
  | "not_supported";   // Not offered at all — no pitch, no billing

export type AddonFulfillmentType =
  | "instant"               // Fires automatically on generation — no human action needed
  | "team_setup"            // MiniMorph team configures after purchase
  | "customer_action"       // Customer must take action (connect account, etc.)
  | "admin_review_required" // Requires admin review before committing
  | "blocked"               // Cannot be fulfilled — not offered
  | "unknown";

export type AddonSupportTaskType =
  | "configure_integration"
  | "setup_third_party"
  | "design_asset"
  | "content_production"
  | "review_and_approve"
  | "none";

export interface AddonFulfillmentRecord {
  /** Canonical machine-readable ID — matches ADDONS key in pricing.ts where applicable */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Grouping label for UI */
  category: "marketing" | "engagement" | "design" | "analytics" | "commerce" | "content" | "internal";
  /** Whether Elena may mention or recommend this add-on */
  canElenaRecommend: boolean;
  /** Whether this add-on can appear in checkout and be billed */
  canCheckoutPurchase: boolean;
  /** Whether the generator should embed this add-on into the generated site */
  generatorSupported: boolean;
  /** Whether billing infrastructure is in place to charge for this */
  billingSupported: boolean;
  /** Whether admin tooling exists to manage/configure this add-on */
  adminSupported: boolean;
  /** Whether the customer portal shows status/progress for this add-on */
  portalSupported: boolean;
  /** Whether a support task is created when this add-on is purchased */
  supportWorkflowSupported: boolean;
  /** Whether this add-on requires MiniMorph team setup after purchase */
  requiresTeamSetup: boolean;
  /** Whether this add-on requires the customer to connect an account or take action */
  requiresCustomerAction: boolean;
  /** Whether admin must review before this add-on is enabled */
  requiresAdminReview: boolean;
  /** Whether this add-on requires a custom quote (no public price) */
  requiresCustomQuote: boolean;
  /** Current public availability classification */
  publicOfferStatus: AddonPublicOfferStatus;
  /** How this add-on is fulfilled */
  fulfillmentType: AddonFulfillmentType;
  /** Short explanation of what setup looks like after purchase */
  setupDescription: string;
  /** Customer-facing description of the add-on */
  customerFacingDescription: string;
  /** What Elena says when pitching this add-on (only if canElenaRecommend === true) */
  elenaSafePitch: string | null;
  /** What Elena must never say about this add-on */
  elenaDoNotSay: string | null;
  /** Internal note for admin/team context */
  adminNotes: string | null;
  /** Label shown in the build report */
  buildReportLabel: string;
  /** Label shown in the customer portal */
  portalStatusLabel: string;
  /** What type of support task is created on purchase */
  supportTaskType: AddonSupportTaskType;
  /** Why this add-on is blocked, if applicable */
  blockedReason: string | null;
}

/**
 * Canonical add-on fulfillment registry.
 * All 20 add-ons — supported, team_setup, blocked, and internal_only.
 */
export const ADDON_FULFILLMENT_REGISTRY: Record<string, AddonFulfillmentRecord> = {

  // ─── MARKETING ──────────────────────────────────────────────────────────────

  review_collector: {
    id: "review_collector",
    displayName: "Review Collector",
    category: "marketing",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team sets up automated review request flows after your site goes live.",
    customerFacingDescription: "Automatically ask happy customers for reviews after each job.",
    elenaSafePitch: "I can add our Review Collector, which sends review requests to customers after each job — helps you build your reputation on autopilot. It runs after your site is live and our team handles the setup.",
    elenaDoNotSay: "Do not say the review widget will be live the moment the site launches. Setup takes a few days after launch.",
    adminNotes: "Team configures review request flow post-launch. Needs customer phone/email list to be useful.",
    buildReportLabel: "Review Collector: team setup required post-launch",
    portalStatusLabel: "Review Collector — MiniMorph team will configure this after your site goes live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  seo_autopilot: {
    id: "seo_autopilot",
    displayName: "SEO Autopilot",
    category: "marketing",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team sets up SEO optimization — keyword targeting, meta tags, and monthly reports.",
    customerFacingDescription: "Ongoing SEO management to help your site rank higher in search results.",
    elenaSafePitch: "Our SEO Autopilot has our team managing your search rankings — keyword targeting, meta tags, and monthly performance reports. It kicks in after your site is live.",
    elenaDoNotSay: "Do not promise specific ranking positions or timelines. Do not say 'guaranteed to rank on page 1.'",
    adminNotes: "Team configures SEO tools post-launch. Includes monthly reporting. Does not guarantee rankings.",
    buildReportLabel: "SEO Autopilot: team setup required post-launch",
    portalStatusLabel: "SEO Autopilot — MiniMorph team will configure this after your site is live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  competitor_monitoring: {
    id: "competitor_monitoring",
    displayName: "Competitor Monitoring",
    category: "marketing",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team sets up competitor tracking and delivers monthly insight reports.",
    customerFacingDescription: "Monthly reports on what your local competitors are doing online.",
    elenaSafePitch: "With Competitor Monitoring, our team tracks what your local competitors are doing online and sends you monthly insight reports. It's set up after your site goes live.",
    elenaDoNotSay: "Do not promise real-time alerts or instant competitor intelligence. Reports are monthly.",
    adminNotes: "Team delivers monthly reports. Uses third-party monitoring tools. Setup takes 1–2 weeks post-launch.",
    buildReportLabel: "Competitor Monitoring: team setup required post-launch",
    portalStatusLabel: "Competitor Monitoring — MiniMorph team will configure this after your site is live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  // ─── ENGAGEMENT ─────────────────────────────────────────────────────────────

  ai_chatbot: {
    id: "ai_chatbot",
    displayName: "AI Chatbot",
    category: "engagement",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: true,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team configures and deploys an AI chatbot trained on your business details.",
    customerFacingDescription: "An AI assistant on your site that answers visitor questions 24/7.",
    elenaSafePitch: "Our AI Chatbot gets embedded on your site and answers visitor questions 24/7 — pricing, services, hours. Our team trains and deploys it after your site goes live.",
    elenaDoNotSay: "Do not say the chatbot will be live when the site launches. Do not promise it will handle bookings or transactions.",
    adminNotes: "Generator embeds chatbot placeholder script. Team trains and activates post-launch.",
    buildReportLabel: "AI Chatbot: generator embedded placeholder — team activation required post-launch",
    portalStatusLabel: "AI Chatbot — MiniMorph team will activate and train this after your site is live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  booking_widget: {
    id: "booking_widget",
    displayName: "Booking Widget",
    category: "engagement",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: true,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: false,
    requiresCustomerAction: true,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "customer_action",
    setupDescription: "Customer connects their Calendly or booking account — generator embeds the widget.",
    customerFacingDescription: "Let visitors book appointments directly from your website.",
    elenaSafePitch: "With the Booking Widget, visitors can book appointments right on your site. You'll need to connect your existing Calendly or scheduling account — it only takes a few minutes.",
    elenaDoNotSay: "Do not say MiniMorph will set up your booking system for you. Customer must connect their own account.",
    adminNotes: "Generator embeds a booking widget placeholder. Customer must connect Calendly or similar. No custom booking system is built.",
    buildReportLabel: "Booking Widget: embedded — customer must connect scheduling account",
    portalStatusLabel: "Booking Widget — connect your Calendly or scheduling account to activate",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  lead_capture_bot: {
    id: "lead_capture_bot",
    displayName: "Lead Capture Bot",
    category: "engagement",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team configures a lead capture flow on your site after launch.",
    customerFacingDescription: "Capture leads from visitors who aren't ready to call yet.",
    elenaSafePitch: "Our Lead Capture Bot collects contact info from visitors who aren't quite ready to call — our team sets it up after your site is live.",
    elenaDoNotSay: "Do not say the lead bot will be live on launch day. Team setup is required post-launch.",
    adminNotes: "Team sets up lead capture flow post-launch. Not the same as the AI Chatbot.",
    buildReportLabel: "Lead Capture Bot: team setup required post-launch",
    portalStatusLabel: "Lead Capture Bot — MiniMorph team will configure this after your site is live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  social_feed_embed: {
    id: "social_feed_embed",
    displayName: "Social Feed",
    category: "engagement",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: true,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: false,
    requiresCustomerAction: true,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "customer_action",
    setupDescription: "Generator embeds a social feed placeholder — customer connects their Instagram or Facebook.",
    customerFacingDescription: "Show your latest social media posts directly on your website.",
    elenaSafePitch: "We can embed your social media feed right on your site. You'll connect your Instagram or Facebook account — the generator will add the placeholder, you activate it.",
    elenaDoNotSay: "Do not promise the feed will be live on launch day without customer connecting their account.",
    adminNotes: "Generator embeds placeholder widget. Customer must connect their social account to activate.",
    buildReportLabel: "Social Feed: embedded — customer must connect social account to activate",
    portalStatusLabel: "Social Feed — connect your Instagram or Facebook to activate",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  sms_alerts: {
    id: "sms_alerts",
    displayName: "SMS Lead Alerts",
    category: "engagement",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team wires SMS alerts so you get a text whenever a lead comes in.",
    customerFacingDescription: "Get a text message the moment a new lead submits your contact form.",
    elenaSafePitch: "With SMS Lead Alerts, you get a text the moment someone fills out your contact form — so you can call them back right away. Our team sets it up.",
    elenaDoNotSay: "Do not say SMS will be active on launch day without team setup.",
    adminNotes: "addonOrchestrator.ts handles SMS setup post-generation. Wired to contact form submissions.",
    buildReportLabel: "SMS Lead Alerts: team wiring required post-launch",
    portalStatusLabel: "SMS Lead Alerts — MiniMorph team will configure this after your site is live",
    supportTaskType: "configure_integration",
    blockedReason: null,
  },

  email_marketing_setup: {
    id: "email_marketing_setup",
    displayName: "Email Marketing Setup",
    category: "marketing",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team sets up your email list and a starter email sequence.",
    customerFacingDescription: "Build your email list and send professional campaigns to your customers.",
    elenaSafePitch: "Email Marketing Setup gets your email list started and gives you a ready-to-send welcome sequence — our team configures everything after your site is live.",
    elenaDoNotSay: "Do not say the email system will be fully automated immediately. Do not promise specific open rates.",
    adminNotes: "Team connects email provider (Mailchimp/Klaviyo/etc.) and sets up a starter sequence post-launch.",
    buildReportLabel: "Email Marketing Setup: team setup required post-launch",
    portalStatusLabel: "Email Marketing — MiniMorph team will configure this after your site is live",
    supportTaskType: "setup_third_party",
    blockedReason: null,
  },

  // ─── DESIGN ─────────────────────────────────────────────────────────────────

  logo_design: {
    id: "logo_design",
    displayName: "Logo Design",
    category: "design",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph design team creates 2–3 logo concepts and delivers final files.",
    customerFacingDescription: "A professional logo designed specifically for your business.",
    elenaSafePitch: "We offer Logo Design — our design team creates 2 to 3 concepts and you pick the direction. You'll get final files you own. It's a one-time add-on.",
    elenaDoNotSay: "Do not promise same-day delivery. Do not say the logo will be ready before the site launches.",
    adminNotes: "Design team handles this. Typically 5–7 business days. Admin must review before delivery.",
    buildReportLabel: "Logo Design: design team task created — not included in site build",
    portalStatusLabel: "Logo Design — MiniMorph design team will reach out to start your logo",
    supportTaskType: "design_asset",
    blockedReason: null,
  },

  brand_style_guide: {
    id: "brand_style_guide",
    displayName: "Brand Style Guide",
    category: "design",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph design team creates a brand style guide with colors, fonts, and usage rules.",
    customerFacingDescription: "A complete brand guide so your business looks consistent everywhere.",
    elenaSafePitch: "Our Brand Style Guide gives you colors, fonts, and usage rules — so your brand looks consistent everywhere. Our design team builds it and delivers a PDF you own.",
    elenaDoNotSay: "Do not say the brand guide will be ready before the website launches.",
    adminNotes: "Design team delivers PDF brand guide. Admin reviews before sending to customer.",
    buildReportLabel: "Brand Style Guide: design team task created — not included in site build",
    portalStatusLabel: "Brand Style Guide — MiniMorph design team will reach out to start your guide",
    supportTaskType: "design_asset",
    blockedReason: null,
  },

  // ─── CONTENT ────────────────────────────────────────────────────────────────

  professional_copywriting: {
    id: "professional_copywriting",
    displayName: "Professional Copywriting",
    category: "content",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph copywriter produces custom page copy based on your Blueprint.",
    customerFacingDescription: "Professionally written page copy that speaks directly to your ideal customers.",
    elenaSafePitch: "With Professional Copywriting, our writer uses what you've told me to craft every page from scratch — not AI-generated, not a template. Delivers before the site is finalized.",
    elenaDoNotSay: "Do not say this replaces the generated copy automatically. Do not promise instant delivery.",
    adminNotes: "Copywriter assigned post-sale. Uses Blueprint to write copy. Admin reviews before handoff to generator.",
    buildReportLabel: "Professional Copywriting: content team task created — will be integrated before launch",
    portalStatusLabel: "Professional Copywriting — our writer will reach out to start your content",
    supportTaskType: "content_production",
    blockedReason: null,
  },

  // ─── ANALYTICS ──────────────────────────────────────────────────────────────

  ga4_analytics: {
    id: "ga4_analytics",
    displayName: "Google Analytics (GA4)",
    category: "analytics",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: true,
    billingSupported: false,
    adminSupported: true,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "internal_only",
    fulfillmentType: "instant",
    setupDescription: "Automatically embedded on every generated site. Not purchasable.",
    customerFacingDescription: "Included automatically — your site is connected to Google Analytics from day one.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not pitch GA4 as a paid add-on. It is included automatically on all sites.",
    adminNotes: "addonOrchestrator.ts: setupGa4Analytics() always fires post-generation. Not billed.",
    buildReportLabel: "GA4 Analytics: embedded automatically",
    portalStatusLabel: "Google Analytics — included automatically",
    supportTaskType: "none",
    blockedReason: null,
  },

  facebook_pixel: {
    id: "facebook_pixel",
    displayName: "Facebook Pixel",
    category: "analytics",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: true,
    billingSupported: false,
    adminSupported: true,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "internal_only",
    fulfillmentType: "instant",
    setupDescription: "Automatically embedded on every generated site. Not purchasable.",
    customerFacingDescription: "Included automatically — enables Facebook ad tracking if you run ads.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not pitch Facebook Pixel as a paid add-on. It is included automatically.",
    adminNotes: "addonOrchestrator.ts: setupFacebookPixel() always fires post-generation. Not billed.",
    buildReportLabel: "Facebook Pixel: embedded automatically",
    portalStatusLabel: "Facebook Pixel — included automatically",
    supportTaskType: "none",
    blockedReason: null,
  },

  // ─── DESIGN / MEDIA ─────────────────────────────────────────────────────────

  ai_photography: {
    id: "ai_photography",
    displayName: "AI Photography",
    category: "design",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team generates AI photography matched to your brand and uploads it to your site.",
    customerFacingDescription: "Professional-looking AI-generated photos tailored to your business and style.",
    elenaSafePitch: "If you don't have professional photos, our AI Photography add-on has our team generate brand-matched images for your site. They're tailored to your industry and style.",
    elenaDoNotSay: "Do not call them 'real photos' or 'professional photography.' They are AI-generated images.",
    adminNotes: "Team generates and reviews AI photos before uploading. Admin signs off before they go live.",
    buildReportLabel: "AI Photography: team asset creation required post-launch",
    portalStatusLabel: "AI Photography — MiniMorph team will create and upload your images",
    supportTaskType: "design_asset",
    blockedReason: null,
  },

  video_background: {
    id: "video_background",
    displayName: "Video Background",
    category: "design",
    canElenaRecommend: true,
    canCheckoutPurchase: true,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: true,
    portalSupported: true,
    supportWorkflowSupported: true,
    requiresTeamSetup: true,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: false,
    publicOfferStatus: "team_setup",
    fulfillmentType: "team_setup",
    setupDescription: "MiniMorph team sources or produces a video background and integrates it into the generated site.",
    customerFacingDescription: "A cinematic video background on your homepage hero section.",
    elenaSafePitch: "A Video Background gives your homepage a cinematic feel — our team sources or produces the video and integrates it. It goes in after the site is built.",
    elenaDoNotSay: "Do not say the video will be ready on launch day. Do not promise custom video production without confirming scope.",
    adminNotes: "Team sources stock video or creates custom content. Admin approves before integration.",
    buildReportLabel: "Video Background: team integration required post-launch",
    portalStatusLabel: "Video Background — MiniMorph team will add this after your site is built",
    supportTaskType: "design_asset",
    blockedReason: null,
  },

  // ─── BLOCKED ────────────────────────────────────────────────────────────────

  online_store: {
    id: "online_store",
    displayName: "Online Store",
    category: "commerce",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: false,
    billingSupported: true,
    adminSupported: false,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: true,
    requiresCustomQuote: true,
    publicOfferStatus: "blocked",
    fulfillmentType: "blocked",
    setupDescription: "Not currently available. Ecommerce checkout is not fully implemented (B2 open).",
    customerFacingDescription: "Online store capability — not currently available.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not offer, pitch, or imply that MiniMorph can build a full online store. Ecommerce checkout is not implemented. B2 is open.",
    adminNotes: "BLOCKED: B2 is open. ecommerce/product.html line 741 has return false in form handler. Do not onboard ecommerce customers until B2 is resolved.",
    buildReportLabel: "Online Store: BLOCKED — not available",
    portalStatusLabel: "Online Store — not currently available",
    supportTaskType: "none",
    blockedReason: "Ecommerce checkout is not fully implemented. B2 (ecommerce/product.html form handler) is open.",
  },

  event_calendar: {
    id: "event_calendar",
    displayName: "Event Calendar",
    category: "engagement",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: false,
    billingSupported: false,
    adminSupported: false,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "blocked",
    fulfillmentType: "blocked",
    setupDescription: "Not implemented. No event calendar system exists.",
    customerFacingDescription: "Event calendar — not currently available.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not offer or imply a built-in event calendar. This is not implemented.",
    adminNotes: "BLOCKED: No event calendar infrastructure exists. Elena prompt explicitly blocks this.",
    buildReportLabel: "Event Calendar: BLOCKED — not available",
    portalStatusLabel: "Event Calendar — not currently available",
    supportTaskType: "none",
    blockedReason: "No event calendar system is implemented.",
  },

  menu_price_list: {
    id: "menu_price_list",
    displayName: "Menu / Price List",
    category: "content",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: false,
    billingSupported: false,
    adminSupported: false,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "blocked",
    fulfillmentType: "blocked",
    setupDescription: "Not implemented. Dynamic menus/price lists are not supported.",
    customerFacingDescription: "Dynamic menu or price list — not currently available.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not offer a dynamic menu or price list as an add-on. This is not implemented. Menus with prices are template-level, not a purchasable add-on.",
    adminNotes: "BLOCKED: No dynamic menu/price list system. Elena prompt explicitly blocks this.",
    buildReportLabel: "Menu/Price List: BLOCKED — not available",
    portalStatusLabel: "Menu/Price List — not currently available",
    supportTaskType: "none",
    blockedReason: "No dynamic menu or price list system is implemented.",
  },

  priority_support: {
    id: "priority_support",
    displayName: "Priority Support",
    category: "engagement",
    canElenaRecommend: false,
    canCheckoutPurchase: false,
    generatorSupported: false,
    billingSupported: false,
    adminSupported: false,
    portalSupported: false,
    supportWorkflowSupported: false,
    requiresTeamSetup: false,
    requiresCustomerAction: false,
    requiresAdminReview: false,
    requiresCustomQuote: false,
    publicOfferStatus: "not_supported",
    fulfillmentType: "blocked",
    setupDescription: "Not offered as a standalone purchasable add-on.",
    customerFacingDescription: "Priority support — included in Pro plan, not sold separately.",
    elenaSafePitch: null,
    elenaDoNotSay: "Do not sell priority support as a separate add-on. It is a Pro plan feature, not purchasable.",
    adminNotes: "Priority support is a plan feature, not an add-on. Not in ADDONS catalog.",
    buildReportLabel: "Priority Support: plan-level feature — not an add-on",
    portalStatusLabel: "Priority Support — included in your plan",
    supportTaskType: "none",
    blockedReason: "Priority support is a plan feature, not a separately purchasable add-on.",
  },
};

/**
 * Look up a fulfillment record by add-on ID (exact) or display name (fuzzy).
 * Returns null if not found.
 */
export function lookupAddonFulfillment(idOrName: string): AddonFulfillmentRecord | null {
  const normalized = idOrName.toLowerCase().replace(/[^a-z0-9 _]/g, "").trim();

  // Exact ID match first
  if (ADDON_FULFILLMENT_REGISTRY[normalized]) {
    return ADDON_FULFILLMENT_REGISTRY[normalized];
  }

  // Fuzzy display name match
  for (const record of Object.values(ADDON_FULFILLMENT_REGISTRY)) {
    const nameNorm = record.displayName.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (normalized === nameNorm || normalized.includes(nameNorm) || nameNorm.includes(normalized)) {
      return record;
    }
  }

  return null;
}

/**
 * Returns all add-ons Elena may recommend.
 */
export function getElenaRecommendableAddons(): AddonFulfillmentRecord[] {
  return Object.values(ADDON_FULFILLMENT_REGISTRY).filter(r => r.canElenaRecommend);
}

/**
 * Returns all add-ons that can be purchased at checkout.
 */
export function getCheckoutPurchasableAddons(): AddonFulfillmentRecord[] {
  return Object.values(ADDON_FULFILLMENT_REGISTRY).filter(r => r.canCheckoutPurchase);
}

/**
 * Returns all add-ons that the generator should embed into the generated site.
 */
export function getGeneratorSupportedAddons(): AddonFulfillmentRecord[] {
  return Object.values(ADDON_FULFILLMENT_REGISTRY).filter(r => r.generatorSupported);
}

/**
 * Returns all blocked add-ons.
 */
export function getBlockedAddons(): AddonFulfillmentRecord[] {
  return Object.values(ADDON_FULFILLMENT_REGISTRY).filter(r => r.publicOfferStatus === "blocked" || r.publicOfferStatus === "not_supported");
}

/**
 * Given a list of add-on product names from a checkout or Blueprint,
 * returns those that are NOT purchasable (so they can be rejected).
 */
export function findNonPurchasableAddons(products: string[]): Array<{ product: string; reason: string }> {
  const blocked: Array<{ product: string; reason: string }> = [];
  for (const product of products) {
    const record = lookupAddonFulfillment(product);
    if (!record) {
      blocked.push({ product, reason: "Unknown add-on — not in fulfillment registry." });
    } else if (!record.canCheckoutPurchase) {
      blocked.push({ product, reason: record.blockedReason ?? `${record.displayName} is not available for purchase.` });
    }
  }
  return blocked;
}
