/*
 * Pricing — 4 tiers: Starter, Growth, Pro, Commerce.
 * Growth highlighted. Commerce labeled custom quote.
 * Comparison table below. Legal disclaimers included.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Star, Info } from "lucide-react";
import { useLocation } from "wouter";

interface Tier {
  name: string;
  price: string;
  setup: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  cta: string;
  note?: string;
}

const tiers: Tier[] = [
  {
    name: "Starter",
    price: "$150/mo",
    setup: "$500 setup",
    description: "For businesses that need a clean, professional website with ongoing support.",
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
    cta: "Start with Starter",
  },
  {
    name: "Growth",
    price: "$250/mo",
    setup: "$750 setup",
    description: "For businesses ready to grow with more pages, features, and monthly support.",
    highlight: true,
    badge: "Most Popular",
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
    cta: "Start with Growth",
  },
  {
    name: "Pro",
    price: "$400/mo",
    setup: "$1,000 setup",
    description: "For businesses that need advanced features, more pages, and hands-on support.",
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
    cta: "Start with Pro",
  },
  {
    name: "Commerce",
    price: "Custom",
    setup: "Custom setup",
    description: "For ecommerce, complex integrations, product catalogs, or multi-language sites.",
    features: [
      "Unlimited pages",
      "Everything in Pro",
      "Ecommerce store setup",
      "Product catalog & categories",
      "Cart/checkout integration",
      "Shopify/WooCommerce review",
      "Product migration support",
      "Custom API integrations",
    ],
    cta: "Request a Quote",
    note: "Ecommerce and complex builds require a custom quote. We review your needs during onboarding.",
  },
];

type FeatureRow = { feature: string; starter: boolean | string; growth: boolean | string; pro: boolean | string; commerce: boolean | string };

const comparisonRows: FeatureRow[] = [
  { feature: "Pages included", starter: "Up to 5", growth: "Up to 10", pro: "Up to 20", commerce: "Unlimited" },
  { feature: "Mobile-responsive", starter: true, growth: true, pro: true, commerce: true },
  { feature: "Contact/quote form", starter: true, growth: true, pro: true, commerce: true },
  { feature: "Basic SEO", starter: true, growth: true, pro: true, commerce: true },
  { feature: "Customer portal", starter: true, growth: true, pro: true, commerce: true },
  { feature: "Monthly report", starter: true, growth: true, pro: true, commerce: true },
  { feature: "Content updates/mo", starter: "1", growth: "2", pro: "4", commerce: "Custom" },
  { feature: "Blog/news section", starter: false, growth: true, pro: true, commerce: true },
  { feature: "Google Analytics", starter: false, growth: true, pro: true, commerce: true },
  { feature: "AI recommendations", starter: false, growth: true, pro: true, commerce: true },
  { feature: "Advanced SEO pages", starter: false, growth: false, pro: true, commerce: true },
  { feature: "Review widget", starter: false, growth: false, pro: true, commerce: true },
  { feature: "Booking integration", starter: false, growth: false, pro: true, commerce: true },
  { feature: "SMS lead alerts", starter: false, growth: false, pro: true, commerce: true },
  { feature: "Ecommerce store", starter: false, growth: false, pro: false, commerce: true },
  { feature: "Product migration", starter: false, growth: false, pro: false, commerce: true },
  { feature: "Custom API integrations", starter: false, growth: false, pro: false, commerce: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-sans text-off-white/70">{value}</span>;
  }
  return value ? (
    <Check size={16} className="text-electric mx-auto" />
  ) : (
    <X size={16} className="text-off-white/20 mx-auto" />
  );
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Simple, transparent{" "}
            <span className="text-gradient-electric">pricing.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            Every plan includes a custom website build, customer portal, monthly report, and ongoing human-backed support. Choose the tier that fits your business.
          </motion.p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`relative flex flex-col p-7 rounded-2xl glass-card transition-all duration-500 ${
                tier.highlight
                  ? "border-electric/40 shadow-[0_0_30px_-5px_oklch(0.75_0.15_195/0.15)]"
                  : "hover:border-electric/20"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric text-midnight text-xs font-sans font-bold">
                    <Star size={12} />
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-serif text-off-white mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-serif text-off-white">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-sm text-off-white/40 font-sans">/month</span>}
                </div>
                <span className="text-xs font-sans text-off-white/40">{tier.setup}</span>
              </div>

              <p className="text-sm text-off-white/50 font-sans leading-relaxed mb-6">{tier.description}</p>

              <div className="flex-1 space-y-2.5 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check size={15} className="text-electric shrink-0 mt-0.5" />
                    <span className="text-sm font-sans text-off-white/60">{feature}</span>
                  </div>
                ))}
              </div>

              {tier.note && (
                <div className="mb-4 p-2.5 rounded-lg bg-gold/5 border border-gold/15 flex items-start gap-2">
                  <Info size={14} className="text-gold/70 shrink-0 mt-0.5" />
                  <p className="text-xs font-sans text-gold/70">{tier.note}</p>
                </div>
              )}

              <Button
                className={`w-full rounded-full font-sans font-semibold transition-all duration-300 ${
                  tier.highlight
                    ? "bg-electric hover:bg-electric-light text-midnight shadow-none hover:shadow-lg hover:shadow-electric/20"
                    : "bg-off-white/10 hover:bg-off-white/15 text-off-white"
                }`}
                onClick={() => setLocation("/get-started")}
              >
                {tier.cta}
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Toggle comparison */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-sm font-sans text-electric hover:text-electric-light transition-colors underline underline-offset-4"
          >
            {showComparison ? "Hide" : "Show"} full plan comparison
          </button>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="max-w-5xl mx-auto overflow-x-auto"
          >
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 text-off-white/50 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 text-electric font-medium">Growth</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Commerce</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-glass-border/50 hover:bg-off-white/2">
                    <td className="py-3 px-4 text-off-white/60">{row.feature}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.starter} /></td>
                    <td className="py-3 px-4 text-center bg-electric/3"><CellValue value={row.growth} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.commerce} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Legal disclaimers */}
        <div className="max-w-3xl mx-auto mt-12 text-center space-y-2">
          <p className="text-xs text-off-white/25 font-sans">
            All prices are in USD. Setup fees are one-time. Monthly fees are billed on a 12-month agreement. Prices may change with 30 days notice.
          </p>
          <p className="text-xs text-off-white/25 font-sans">
            Add-on pricing varies by feature and complexity. Ecommerce, product migration, and custom API integrations require a custom quote.
          </p>
          <p className="text-xs text-off-white/25 font-sans">
            MiniMorph Studios reserves the right to adjust pricing for new customers. Existing customers are locked in at their contracted rate for the duration of their agreement.
          </p>
        </div>
      </div>
    </section>
  );
}
