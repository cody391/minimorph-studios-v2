/**
 * MiniMorph Studios — Integration & Upsell Classification Matrix
 *
 * Every feature/integration a customer might ask about is classified into
 * one of four tiers:
 *   1. included    — comes with their plan (or all plans)
 *   2. upsell      — available as a paid add-on with a known price
 *   3. custom_quote — requires scoping; triggers admin review
 *   4. not_supported — we do not offer this
 *
 * The AI agents and the public site both reference this matrix.
 */

export type IntegrationTier = "included" | "upsell" | "custom_quote" | "not_supported";

export interface IntegrationItem {
  slug: string;
  name: string;
  description: string;
  tier: IntegrationTier;
  /** Which plans include it (if tier === "included") */
  includedInPlans?: ("starter" | "growth" | "pro" | "all")[];
  /** Monthly price if tier === "upsell" */
  monthlyPrice?: number;
  /** One-time setup if tier === "upsell" */
  setupFee?: number;
  /** Why it requires custom quote */
  customQuoteReason?: string;
  /** Why it's not supported */
  notSupportedReason?: string;
  /** Category for grouping in UI */
  category: "core" | "marketing" | "booking" | "ecommerce" | "communication" | "analytics" | "advanced";
}

export const INTEGRATION_MATRIX: IntegrationItem[] = [
  // ── INCLUDED IN ALL PLANS ───────────────────────────────────────────
  {
    slug: "contact-form",
    name: "Contact / Quote Form",
    description: "Custom contact or quote request form with email notifications",
    tier: "included",
    includedInPlans: ["all"],
    category: "core",
  },
  {
    slug: "mobile-responsive",
    name: "Mobile-Responsive Design",
    description: "Fully responsive layout optimized for all screen sizes",
    tier: "included",
    includedInPlans: ["all"],
    category: "core",
  },
  {
    slug: "ssl-hosting",
    name: "SSL & Hosting",
    description: "Secure hosting with SSL certificate and automatic backups",
    tier: "included",
    includedInPlans: ["all"],
    category: "core",
  },
  {
    slug: "basic-seo",
    name: "Basic SEO Setup",
    description: "Meta tags, sitemap, robots.txt, and proper heading structure",
    tier: "included",
    includedInPlans: ["all"],
    category: "marketing",
  },
  {
    slug: "social-links",
    name: "Social Media Links",
    description: "Links to your social media profiles in header/footer",
    tier: "included",
    includedInPlans: ["all"],
    category: "marketing",
  },
  {
    slug: "customer-portal",
    name: "Customer Portal Access",
    description: "Dedicated portal to view reports, request changes, and communicate",
    tier: "included",
    includedInPlans: ["all"],
    category: "core",
  },
  {
    slug: "monthly-report",
    name: "Monthly Performance Report",
    description: "Monthly website performance and analytics summary",
    tier: "included",
    includedInPlans: ["all"],
    category: "analytics",
  },

  // ── INCLUDED IN GROWTH+ ─────────────────────────────────────────────
  {
    slug: "blog",
    name: "Blog / News Section",
    description: "Blog or news section with categories and search",
    tier: "included",
    includedInPlans: ["growth", "pro"],
    category: "marketing",
  },
  {
    slug: "google-analytics",
    name: "Google Analytics Setup",
    description: "Google Analytics 4 integration with dashboard access",
    tier: "included",
    includedInPlans: ["growth", "pro"],
    category: "analytics",
  },

  // ── INCLUDED IN PRO ─────────────────────────────────────────────────
  {
    slug: "advanced-seo",
    name: "Advanced SEO Pages",
    description: "Location pages, service pages, structured data markup",
    tier: "included",
    includedInPlans: ["pro"],
    category: "marketing",
  },
  {
    slug: "review-widget",
    name: "Review Widget Setup",
    description: "Google Reviews or third-party review display on your site",
    tier: "included",
    includedInPlans: ["pro"],
    category: "marketing",
  },
  {
    slug: "booking-integration",
    name: "Booking Integration",
    description: "Online appointment scheduling integrated into your website",
    tier: "included",
    includedInPlans: ["pro"],
    category: "booking",
  },
  {
    slug: "sms-lead-alerts",
    name: "SMS Lead Alerts",
    description: "Instant SMS notification when a new lead submits a form",
    tier: "included",
    includedInPlans: ["pro"],
    category: "communication",
  },

  // ── POPULAR ADD-ONS (UPSELL) ───────────────────────────────────────
  {
    slug: "ai-chatbot",
    name: "AI Chatbot",
    description: "24/7 AI-powered chatbot trained on your business info to answer visitor questions",
    tier: "upsell",
    monthlyPrice: 299,
    category: "communication",
  },
  {
    slug: "booking-widget",
    name: "Booking Widget",
    description: "Embeddable booking widget with calendar sync and reminders",
    tier: "upsell",
    monthlyPrice: 199,
    category: "booking",
  },
  {
    slug: "review-collector",
    name: "Review Collector",
    description: "Automated review request emails/SMS after service completion",
    tier: "upsell",
    monthlyPrice: 149,
    category: "marketing",
  },
  {
    slug: "lead-capture-bot",
    name: "Lead Capture Bot",
    description: "Interactive lead qualification bot that captures visitor info and routes to your inbox",
    tier: "upsell",
    monthlyPrice: 249,
    category: "communication",
  },
  {
    slug: "seo-autopilot",
    name: "SEO Autopilot",
    description: "Ongoing SEO optimization with monthly keyword research and content recommendations",
    tier: "upsell",
    monthlyPrice: 199,
    category: "marketing",
  },
  {
    slug: "extra-pages",
    name: "Extra Pages Pack",
    description: "Add 5 additional pages beyond your plan limit",
    tier: "upsell",
    setupFee: 499,
    monthlyPrice: 0,
    category: "core",
  },
  {
    slug: "priority-support",
    name: "Priority Support",
    description: "Faster response times and dedicated support channel",
    tier: "upsell",
    monthlyPrice: 99,
    category: "core",
  },
  {
    slug: "social-feed",
    name: "Social Media Feed Embed",
    description: "Live Instagram, Facebook, or TikTok feed embedded on your website",
    tier: "upsell",
    monthlyPrice: 49,
    category: "marketing",
  },
  {
    slug: "email-marketing",
    name: "Email Marketing Setup",
    description: "Mailchimp or similar integration with signup forms and basic automation",
    tier: "upsell",
    monthlyPrice: 149,
    setupFee: 299,
    category: "marketing",
  },

  // ── CUSTOM QUOTE ────────────────────────────────────────────────────
  {
    slug: "ecommerce-full",
    name: "Full Ecommerce Store",
    description: "Complete online store with product catalog, cart, checkout, and inventory",
    tier: "custom_quote",
    customQuoteReason: "Ecommerce scope varies widely based on product count, payment needs, and shipping complexity",
    category: "ecommerce",
  },
  {
    slug: "payment-processing",
    name: "Custom Payment Processing",
    description: "Stripe, Square, or custom payment gateway integration",
    tier: "custom_quote",
    customQuoteReason: "Payment integrations require compliance review and custom configuration",
    category: "ecommerce",
  },
  {
    slug: "membership-portal",
    name: "Membership / Login Portal",
    description: "Gated content, member-only areas, subscription access",
    tier: "custom_quote",
    customQuoteReason: "Membership systems require custom authentication, content gating, and billing logic",
    category: "advanced",
  },
  {
    slug: "crm-integration",
    name: "CRM Integration",
    description: "Connect your website forms to Salesforce, HubSpot, or other CRM",
    tier: "custom_quote",
    customQuoteReason: "CRM integrations depend on the specific platform, data mapping, and sync requirements",
    category: "advanced",
  },
  {
    slug: "multi-language",
    name: "Multi-Language Support",
    description: "Website available in multiple languages with language switcher",
    tier: "custom_quote",
    customQuoteReason: "Translation scope depends on page count, languages needed, and ongoing content management",
    category: "advanced",
  },
  {
    slug: "custom-api",
    name: "Custom API Integration",
    description: "Connect your website to third-party APIs or internal systems",
    tier: "custom_quote",
    customQuoteReason: "API integrations require custom development based on the specific service and data flow",
    category: "advanced",
  },
  {
    slug: "online-ordering",
    name: "Online Ordering System",
    description: "Restaurant or food service online ordering with menu management",
    tier: "custom_quote",
    customQuoteReason: "Online ordering systems require menu management, payment processing, and delivery/pickup logic",
    category: "ecommerce",
  },
  {
    slug: "platform-migration",
    name: "Platform Migration",
    description: "Migrate your existing website from another platform (Shopify, WordPress, Wix, etc.)",
    tier: "custom_quote",
    customQuoteReason: "Migrations require data transfer, SEO preservation, and careful redirect planning",
    category: "advanced",
  },

  // ── NOT SUPPORTED ───────────────────────────────────────────────────
  {
    slug: "native-mobile-app",
    name: "Native Mobile App",
    description: "iOS or Android native application development",
    tier: "not_supported",
    notSupportedReason: "We specialize in websites. For mobile apps, we recommend partnering with a dedicated app development agency.",
    category: "advanced",
  },
  {
    slug: "blockchain",
    name: "Blockchain / Web3 / NFT",
    description: "Cryptocurrency payments, NFT minting, or blockchain integration",
    tier: "not_supported",
    notSupportedReason: "We do not currently offer blockchain or Web3 integrations.",
    category: "advanced",
  },
  {
    slug: "custom-erp",
    name: "Custom ERP System",
    description: "Enterprise resource planning system development",
    tier: "not_supported",
    notSupportedReason: "ERP systems are outside our scope. We recommend dedicated ERP vendors for this need.",
    category: "advanced",
  },
  // ── STRESS-TEST ADDITIONS: INCLUDED ─────────────────────────────────
  {
    slug: "google-maps-embed",
    name: "Google Maps Embed",
    description: "Embedded Google Maps showing your business location",
    tier: "included",
    includedInPlans: ["all"],
    category: "core",
  },
  {
    slug: "basic-analytics-structure",
    name: "Analytics-Ready Structure",
    description: "Clean HTML structure with proper heading hierarchy and semantic markup for analytics tools",
    tier: "included",
    includedInPlans: ["all"],
    category: "analytics",
  },
  // ── STRESS-TEST ADDITIONS: UPSELL ──────────────────────────────────
  {
    slug: "google-search-console",
    name: "Google Search Console Setup",
    description: "Verify and configure Google Search Console for your domain",
    tier: "upsell",
    monthlyPrice: 0,
    setupFee: 99,
    category: "analytics",
  },
  {
    slug: "extra-revisions",
    name: "Extra Revision Block",
    description: "Additional round of design/content revisions beyond the included 3",
    tier: "upsell",
    monthlyPrice: 0,
    setupFee: 149,
    category: "core",
  },
  {
    slug: "monthly-content-updates",
    name: "Monthly Content / Photo Updates",
    description: "Additional content update blocks beyond your plan's included updates",
    tier: "upsell",
    monthlyPrice: 49,
    category: "core",
  },
  {
    slug: "gbp-optimization",
    name: "Google Business Profile Optimization",
    description: "Full Google Business Profile setup, verification, and optimization",
    tier: "upsell",
    monthlyPrice: 0,
    setupFee: 199,
    category: "marketing",
  },
  {
    slug: "meta-pixel",
    name: "Meta / TikTok Pixel Setup",
    description: "Install and configure Meta (Facebook/Instagram) or TikTok tracking pixels",
    tier: "upsell",
    monthlyPrice: 0,
    setupFee: 99,
    category: "analytics",
  },
  {
    slug: "advanced-reporting",
    name: "Advanced Reporting Dashboard",
    description: "Custom analytics dashboard with detailed traffic, conversion, and engagement metrics",
    tier: "upsell",
    monthlyPrice: 79,
    category: "analytics",
  },
  // ── STRESS-TEST ADDITIONS: CUSTOM QUOTE ────────────────────────────
  {
    slug: "shopify-integration",
    name: "Shopify Integration",
    description: "Connect or build a Shopify store with your website",
    tier: "custom_quote",
    customQuoteReason: "Shopify setup involves product migration, theme customization, and ongoing platform costs",
    category: "ecommerce",
  },
  {
    slug: "woocommerce-integration",
    name: "WooCommerce Integration",
    description: "WordPress/WooCommerce store setup and integration",
    tier: "custom_quote",
    customQuoteReason: "WooCommerce requires WordPress hosting, plugin management, and custom development",
    category: "ecommerce",
  },
  {
    slug: "toast-square-integration",
    name: "Toast / Square POS Integration",
    description: "Connect Toast or Square POS for online ordering or menu syncing",
    tier: "custom_quote",
    customQuoteReason: "POS integrations require custom configuration based on your specific setup and ordering needs",
    category: "ecommerce",
  },
  {
    slug: "complex-booking-payment",
    name: "Complex Booking with Payments",
    description: "Booking system with upfront payment collection, deposits, or package pricing",
    tier: "custom_quote",
    customQuoteReason: "Payment-enabled booking requires custom payment flow, refund policies, and calendar integration",
    category: "booking",
  },
  // ── STRESS-TEST ADDITIONS: NOT SUPPORTED ───────────────────────────
  {
    slug: "guaranteed-seo-ranking",
    name: "Guaranteed SEO Rankings",
    description: "Promising specific search engine ranking positions or page 1 placement",
    tier: "not_supported",
    notSupportedReason: "No legitimate agency can guarantee specific Google rankings. We build SEO-optimized sites but rankings depend on many factors beyond our control.",
    category: "marketing",
  },
  {
    slug: "guaranteed-leads-revenue",
    name: "Guaranteed Leads / Revenue",
    description: "Promising specific lead counts, conversion rates, or revenue outcomes",
    tier: "not_supported",
    notSupportedReason: "We cannot guarantee specific business outcomes. Website performance depends on your industry, market, content, and many other factors.",
    category: "marketing",
  },
  {
    slug: "legal-medical-claims",
    name: "Legal / Medical / Financial Claims",
    description: "Making legal, medical, or financial claims on behalf of the customer",
    tier: "not_supported",
    notSupportedReason: "We cannot make legal, medical, or financial claims. Customers are responsible for the accuracy of their own professional claims and disclaimers.",
    category: "advanced",
  },
  {
    slug: "payment-dispute-handling",
    name: "Payment Dispute Handling",
    description: "Managing customer payment disputes, chargebacks, or refund arbitration",
    tier: "not_supported",
    notSupportedReason: "Payment disputes are between the business and their payment processor. We build the checkout but do not manage disputes.",
    category: "ecommerce",
  },
  {
    slug: "inventory-management",
    name: "Ongoing Inventory Management",
    description: "Day-to-day inventory tracking, stock updates, and reorder management",
    tier: "not_supported",
    notSupportedReason: "We can integrate with inventory systems but do not manage inventory operations. This is the business owner's responsibility or requires a dedicated inventory service.",
    category: "ecommerce",
  },

];

/**
 * Look up an integration by slug.
 */
export function getIntegration(slug: string): IntegrationItem | undefined {
  return INTEGRATION_MATRIX.find((i) => i.slug === slug);
}

/**
 * Get all integrations by tier.
 */
export function getIntegrationsByTier(tier: IntegrationTier): IntegrationItem[] {
  return INTEGRATION_MATRIX.filter((i) => i.tier === tier);
}

/**
 * Get all integrations by category.
 */
export function getIntegrationsByCategory(category: IntegrationItem["category"]): IntegrationItem[] {
  return INTEGRATION_MATRIX.filter((i) => i.category === category);
}

/**
 * Check if a feature is included in a specific plan.
 */
export function isIncludedInPlan(slug: string, plan: "starter" | "growth" | "pro"): boolean {
  const item = getIntegration(slug);
  if (!item || item.tier !== "included") return false;
  return item.includedInPlans?.includes("all") || item.includedInPlans?.includes(plan) || false;
}

/**
 * Format the integration matrix for AI prompt injection.
 */
export function formatIntegrationMatrixForPrompt(): string {
  let prompt = "== INTEGRATION & FEATURE CLASSIFICATION MATRIX ==\n\n";

  const tiers: IntegrationTier[] = ["included", "upsell", "custom_quote", "not_supported"];
  const tierLabels: Record<IntegrationTier, string> = {
    included: "INCLUDED (no extra cost)",
    upsell: "AVAILABLE ADD-ONS (paid)",
    custom_quote: "CUSTOM QUOTE REQUIRED",
    not_supported: "NOT SUPPORTED",
  };

  for (const tier of tiers) {
    const items = getIntegrationsByTier(tier);
    if (items.length === 0) continue;
    prompt += `--- ${tierLabels[tier]} ---\n`;
    for (const item of items) {
      prompt += `• ${item.name}`;
      if (tier === "included" && item.includedInPlans) {
        prompt += ` [${item.includedInPlans.join(", ")}]`;
      }
      if (tier === "upsell" && item.monthlyPrice) {
        prompt += ` ($${item.monthlyPrice}/mo)`;
      }
      if (tier === "custom_quote" && item.customQuoteReason) {
        prompt += ` — ${item.customQuoteReason}`;
      }
      if (tier === "not_supported" && item.notSupportedReason) {
        prompt += ` — ${item.notSupportedReason}`;
      }
      prompt += "\n";
    }
    prompt += "\n";
  }

  prompt += "RULES:\n";
  prompt += "- If a customer asks about an INCLUDED feature, confirm it is part of their plan.\n";
  prompt += "- If a customer asks about an UPSELL feature, explain the value and mention the price.\n";
  prompt += "- If a customer asks about a CUSTOM QUOTE feature, explain that we can do it but it requires a custom quote.\n";
  prompt += "- If a customer asks about a NOT SUPPORTED feature, politely explain we do not offer it and suggest alternatives if possible.\n";
  prompt += "- NEVER classify a feature differently than this matrix.\n";

  return prompt;
}
