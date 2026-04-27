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
 *   Starter:  $150/mo + $500 setup
 *   Growth:   $250/mo + $750 setup
 *   Pro:      $400/mo + $1,000 setup
 *   Commerce: custom quote (not in this file)
 */

export const PACKAGES = {
  starter: {
    name: "Starter",
    tier: "starter" as const,
    monthlyPrice: 150,
    monthlyPriceInCents: 15000,
    setupFee: 500,
    setupFeeInCents: 50000,
    annualTotal: 1800, // 150 * 12
    contractMonths: 12,
    description: "For businesses that need a clean, professional website with ongoing support",
    features: [
      "Up to 5 pages",
      "Mobile-responsive design",
      "Contact/quote form",
      "Basic SEO setup",
      "Customer portal access",
      "Monthly performance report",
      "1 content update per month",
      "Email support",
    ],
  },
  growth: {
    name: "Growth",
    tier: "growth" as const,
    monthlyPrice: 250,
    monthlyPriceInCents: 25000,
    setupFee: 750,
    setupFeeInCents: 75000,
    annualTotal: 3000, // 250 * 12
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
    monthlyPrice: 400,
    monthlyPriceInCents: 40000,
    setupFee: 1000,
    setupFeeInCents: 100000,
    annualTotal: 4800, // 400 * 12
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

/** Helper to format price as "$150/mo" */
export function formatMonthlyPrice(key: PackageKey): string {
  return `$${PACKAGES[key].monthlyPrice}/mo`;
}

/** Helper to format annual total as "$1,800" */
export function formatAnnualTotal(key: PackageKey): string {
  return `$${PACKAGES[key].annualTotal.toLocaleString()}`;
}

/** Helper to format setup fee as "$500" */
export function formatSetupFee(key: PackageKey): string {
  return `$${PACKAGES[key].setupFee.toLocaleString()}`;
}

/** All three monthly prices as a string: "$150/$250/$400" */
export const PRICE_RANGE_SHORT = `$${PACKAGES.starter.monthlyPrice}/$${PACKAGES.growth.monthlyPrice}/$${PACKAGES.premium.monthlyPrice}`;

/** Academy-friendly pricing reference */
export const ACADEMY_PRICING = {
  starterMonthly: `$${PACKAGES.starter.monthlyPrice}/month`,
  growthMonthly: `$${PACKAGES.growth.monthlyPrice}/month`,
  premiumMonthly: `$${PACKAGES.premium.monthlyPrice}/month`,
  starterAnnual: `$${PACKAGES.starter.annualTotal.toLocaleString()}/year`,
  growthAnnual: `$${PACKAGES.growth.annualTotal.toLocaleString()}/year`,
  premiumAnnual: `$${PACKAGES.premium.annualTotal.toLocaleString()}/year`,
  starterSetup: `$${PACKAGES.starter.setupFee} one-time setup`,
  growthSetup: `$${PACKAGES.growth.setupFee} one-time setup`,
  premiumSetup: `$${PACKAGES.premium.setupFee} one-time setup`,
} as const;
