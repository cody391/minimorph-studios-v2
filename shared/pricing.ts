/**
 * ═══════════════════════════════════════════════════════
 * PRICING — Single source of truth for all package pricing
 * ═══════════════════════════════════════════════════════
 *
 * RULE: Every price displayed anywhere in the app (Home page, GetStarted,
 * Academy curriculum, PipelineTab, proposals, Stripe checkout) MUST
 * reference these constants. Never hardcode dollar amounts.
 *
 * Intended pricing (confirmed):
 *   Starter:    $195/mo (no setup fee)
 *   Growth:     $295/mo (no setup fee)
 *   Pro:        $395/mo (no setup fee)
 */

export const PACKAGES = {
  starter: {
    name: "Starter",
    tier: "starter" as const,
    monthlyPrice: 195,
    monthlyPriceInCents: 19500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 2340,
    contractMonths: 12,
    description: "For businesses that need a clean, professional website with ongoing support",
    features: [
      "Up to 5 pages",
      "Mobile-responsive design",
      "Contact/quote form",
      "Basic SEO setup",
      "Customer portal access",
      "Customer portal with build tracking",
      "1 content update per month",
      "Email support",
    ],
  },
  growth: {
    name: "Growth",
    tier: "growth" as const,
    monthlyPrice: 295,
    monthlyPriceInCents: 29500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 3540,
    contractMonths: 12,
    description: "For businesses ready to grow with more pages, features, and monthly support",
    features: [
      "Up to 10 pages",
      "Everything in Starter",
      "Blog or news section",
      "Google Analytics setup",
      "2 content updates per month",
      "AI-assisted recommendations",
      "Priority email support",
      "Add-on integrations available",
    ],
    popular: true,
  },
  premium: {
    name: "Pro",
    tier: "premium" as const,
    monthlyPrice: 395,
    monthlyPriceInCents: 39500,
    setupFee: 0,
    setupFeeInCents: 0,
    annualTotal: 4740,
    contractMonths: 12,
    description: "For businesses that need advanced features, more pages, and hands-on support",
    features: [
      "Up to 20 pages",
      "Everything in Growth",
      "Advanced SEO pages",
      "4 content updates per month",
      "Review widget setup",
      "Booking integration",
      "SMS lead alerts",
      "Priority support with faster response",
    ],
  },
} as const;

export type PackageKey = keyof typeof PACKAGES;
export const PACKAGE_KEYS: PackageKey[] = ["starter", "growth", "premium"];

/** Helper to format price as "$195/mo" */
export function formatMonthlyPrice(key: PackageKey): string {
  return `$${PACKAGES[key].monthlyPrice}/mo`;
}

/** Helper to format annual total as "$2,340" */
export function formatAnnualTotal(key: PackageKey): string {
  return `$${PACKAGES[key].annualTotal.toLocaleString()}`;
}

/** Helper to format setup fee — now always $0 (kept for backward compat) */
export function formatSetupFee(key: PackageKey): string {
  return `$${PACKAGES[key].setupFee.toLocaleString()}`;
}

/* ═══════════════════════════════════════════════════════
   ADD-ON CATALOG — Server-side source of truth for add-on prices
   RULE: createCheckoutAfterElena must verify prices against this catalog.
   Never trust Elena price strings as the sole billing amount.
   ═══════════════════════════════════════════════════════ */
export const ADDONS = {
  review_collector:         { name: "Review Collector",          pricePerMonth: 149, billingType: "recurring_monthly" as const },
  seo_autopilot:            { name: "SEO Autopilot",             pricePerMonth: 199, billingType: "recurring_monthly" as const },
  email_marketing_setup:    { name: "Email Marketing Setup",     pricePerMonth: 149, billingType: "recurring_monthly" as const },
  ai_chatbot:               { name: "AI Chatbot",                pricePerMonth: 299, billingType: "recurring_monthly" as const },
  competitor_monitoring:    { name: "Competitor Monitoring",     pricePerMonth: 149, billingType: "recurring_monthly" as const },
  booking_widget:           { name: "Booking Widget",            pricePerMonth: 149, billingType: "recurring_monthly" as const },
  social_feed_embed:        { name: "Social Feed",               pricePerMonth:  99, billingType: "recurring_monthly" as const },
  lead_capture_bot:         { name: "Lead Capture Bot",          pricePerMonth:  99, billingType: "recurring_monthly" as const },
  sms_alerts:               { name: "SMS Lead Alerts",           pricePerMonth:  49, billingType: "recurring_monthly" as const },
  logo_design:              { name: "Logo Design",               pricePerMonth: 499, billingType: "one_time" as const },
  professional_copywriting: { name: "Professional Copywriting",  pricePerMonth: 199, billingType: "one_time" as const },
  brand_style_guide:        { name: "Brand Style Guide",         pricePerMonth: 299, billingType: "one_time" as const },
} as const;

export type AddonKey = keyof typeof ADDONS;
export type AddonBillingType = "recurring_monthly" | "one_time";

/**
 * Look up an add-on by product name (case-insensitive fuzzy match).
 * Returns the catalog entry or null if not found.
 */
export function lookupAddonByName(name: string): (typeof ADDONS)[AddonKey] | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (const entry of Object.values(ADDONS)) {
    const entryNorm = entry.name.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (normalized === entryNorm || normalized.includes(entryNorm) || entryNorm.includes(normalized)) {
      return entry;
    }
  }
  return null;
}

/**
 * Calculate the full checkout totals from a package tier + list of addon keys/names.
 * Uses catalog prices as the source of truth.
 */
export function calculateCheckoutTotals(
  packageTier: PackageKey,
  addons: Array<{ product: string; price?: string }>
): {
  basePlanMonthly: number;
  recurringAddonTotal: number;
  oneTimeTotal: number;
  monthlyTotal: number;
  dueToday: number;
  termMonths: number;
  recurringAddons: Array<{ name: string; price: number }>;
  oneTimeItems: Array<{ name: string; price: number }>;
} {
  const basePlanMonthly = PACKAGES[packageTier].monthlyPrice;
  const termMonths = PACKAGES[packageTier].contractMonths;
  const recurringAddons: Array<{ name: string; price: number }> = [];
  const oneTimeItems: Array<{ name: string; price: number }> = [];

  for (const addon of addons) {
    const catalogEntry = lookupAddonByName(addon.product);
    if (catalogEntry) {
      if (catalogEntry.billingType === "one_time") {
        oneTimeItems.push({ name: catalogEntry.name, price: catalogEntry.pricePerMonth });
      } else {
        recurringAddons.push({ name: catalogEntry.name, price: catalogEntry.pricePerMonth });
      }
    } else {
      // Fallback: parse Elena's price string if no catalog match
      const rawPrice = addon.price || "0";
      const parsed = parseFloat(rawPrice.replace(/[$,]/g, "").replace(/\s*(\/mo|\/month|one-time|one time)\s*/gi, "").trim()) || 0;
      const isOneTime = /one[-\s]time/i.test(rawPrice);
      if (parsed > 0) {
        if (isOneTime) {
          oneTimeItems.push({ name: addon.product, price: parsed });
        } else {
          recurringAddons.push({ name: addon.product, price: parsed });
        }
      }
    }
  }

  const recurringAddonTotal = recurringAddons.reduce((s, a) => s + a.price, 0);
  const oneTimeTotal = oneTimeItems.reduce((s, a) => s + a.price, 0);
  const monthlyTotal = basePlanMonthly + recurringAddonTotal;
  const dueToday = monthlyTotal + oneTimeTotal;

  return { basePlanMonthly, recurringAddonTotal, oneTimeTotal, monthlyTotal, dueToday, termMonths, recurringAddons, oneTimeItems };
}

/** All three monthly prices as a string: "$195/$295/$395" */
export const PRICE_RANGE_SHORT = `$${PACKAGES.starter.monthlyPrice}/$${PACKAGES.growth.monthlyPrice}/$${PACKAGES.premium.monthlyPrice}`;

/** Academy-friendly pricing reference */
export const ACADEMY_PRICING = {
  starterMonthly: `$${PACKAGES.starter.monthlyPrice}/month`,
  growthMonthly: `$${PACKAGES.growth.monthlyPrice}/month`,
  premiumMonthly: `$${PACKAGES.premium.monthlyPrice}/month`,
  starterAnnual: `$${PACKAGES.starter.annualTotal.toLocaleString()}/year`,
  growthAnnual: `$${PACKAGES.growth.annualTotal.toLocaleString()}/year`,
  premiumAnnual: `$${PACKAGES.premium.annualTotal.toLocaleString()}/year`,
} as const;
