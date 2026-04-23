/**
 * MiniMorph Studios — Stripe Product Definitions
 * Centralized pricing and package configuration for checkout sessions.
 */

export interface PackageDefinition {
  name: string;
  tier: "starter" | "growth" | "premium";
  description: string;
  priceInCents: number; // one-time setup fee
  monthlyPriceInCents: number; // monthly recurring (for display)
  features: string[];
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: "Starter Package",
    tier: "starter",
    description: "Perfect for small businesses getting online for the first time",
    priceInCents: 49900, // $499 setup
    monthlyPriceInCents: 9900, // $99/month
    features: [
      "5-page responsive website",
      "Mobile-optimized design",
      "Basic SEO setup",
      "Contact form integration",
      "Google Analytics setup",
      "Monthly performance report",
      "12-month support contract",
    ],
  },
  growth: {
    name: "Growth Package",
    tier: "growth",
    description: "For growing businesses that need more features and visibility",
    priceInCents: 99900, // $999 setup
    monthlyPriceInCents: 19900, // $199/month
    features: [
      "10-page responsive website",
      "Advanced SEO optimization",
      "Blog / content management",
      "Social media integration",
      "E-commerce ready (up to 50 products)",
      "Weekly performance reports",
      "Priority support",
      "12-month support contract",
    ],
  },
  premium: {
    name: "Premium Package",
    tier: "premium",
    description: "Full-service digital presence for established businesses",
    priceInCents: 249900, // $2,499 setup
    monthlyPriceInCents: 49900, // $499/month
    features: [
      "Unlimited pages",
      "Custom design & branding",
      "Full e-commerce platform",
      "Advanced analytics dashboard",
      "CRM integration",
      "Automated email marketing",
      "Dedicated account manager",
      "24/7 priority support",
      "12-month premium contract",
    ],
  },
};

export function getPackage(tier: string): PackageDefinition | undefined {
  return PACKAGES[tier];
}
