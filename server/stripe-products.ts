/**
 * MiniMorph Studios — Stripe Product Definitions
 * Centralized pricing and package configuration for checkout sessions.
 */

export interface PackageDefinition {
  name: string;
  tier: "starter" | "growth" | "premium";
  description: string;
  monthlyPriceInCents: number; // monthly recurring price
  features: string[];
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: "Starter Package",
    tier: "starter",
    description: "Perfect for small businesses getting started online",
    monthlyPriceInCents: 14900, // $149/month
    features: [
      "Custom 5-page website",
      "Mobile-responsive design",
      "Basic SEO setup",
      "Contact form integration",
      "Monthly performance report",
      "AI-managed support",
      "12-month contract",
    ],
  },
  growth: {
    name: "Growth Package",
    tier: "growth",
    description: "For businesses ready to scale their online presence",
    monthlyPriceInCents: 29900, // $299/month
    features: [
      "Custom 10-page website",
      "Advanced responsive design",
      "Full SEO optimization",
      "Monthly analytics reports",
      "AI-managed nurture & support",
      "Quarterly strategy reviews",
      "Priority update requests",
      "12-month contract",
    ],
  },
  premium: {
    name: "Premium Package",
    tier: "premium",
    description: "The complete package for ambitious businesses",
    monthlyPriceInCents: 49900, // $499/month
    features: [
      "Custom 20+ page website",
      "Premium design & animations",
      "Advanced SEO & content strategy",
      "Weekly analytics reports",
      "Dedicated AI account manager",
      "Monthly strategy sessions",
      "Unlimited update requests",
      "E-commerce integration",
      "12-month contract",
    ],
  },
};

export function getPackage(tier: string): PackageDefinition | undefined {
  return PACKAGES[tier];
}
