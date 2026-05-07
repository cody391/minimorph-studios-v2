/*
 * Pricing — 4 tiers: Starter, Growth, Pro, Commerce.
 * Growth highlighted. Commerce labeled custom quote.
 * Comparison table below. Legal disclaimers included.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Star, Info } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Tier {
  name: string;
  price: string;
  annual?: string;
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
    price: "$195/mo",
    annual: "$2,340 total over 12 months",
    description: "You need a website that doesn't embarrass you. Clean, fast, professional. We handle the rest.",
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
    price: "$295/mo",
    annual: "$3,540 total over 12 months",
    description: "The sweet spot. More pages, a blog, AI recommendations, and enough updates to keep things fresh.",
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
    price: "$395/mo",
    annual: "$4,740 total over 12 months",
    description: "For the business that's serious. Booking, reviews, SMS alerts, and the kind of SEO that actually moves the needle.",
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
    name: "Enterprise",
    price: "$495/mo",
    annual: "$5,940 total over 12 months",
    description: "For large, complex builds — ecommerce, portals, memberships, and multi-location businesses",
    features: [
      "Everything in Pro",
      "Large ecommerce (unlimited products)",
      "Custom customer portals",
      "Membership/subscription systems",
      "Advanced booking systems",
      "Multi-location support",
      "Custom integrations",
      "Priority build queue",
    ],
    cta: "Get a Custom Quote",
  },
];

type FeatureRow = { feature: string; starter: boolean | string; growth: boolean | string; pro: boolean | string; enterprise: boolean | string };

const comparisonRows: FeatureRow[] = [
  { feature: "Pages included", starter: "Up to 5", growth: "Up to 10", pro: "Up to 20", enterprise: "Unlimited" },
  { feature: "Mobile-responsive", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Contact/quote form", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Basic SEO", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Customer portal", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Monthly report", starter: true, growth: true, pro: true, enterprise: true },
  { feature: "Content updates/mo", starter: "1", growth: "2", pro: "4", enterprise: "Custom" },
  { feature: "Blog/news section", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "Google Analytics", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "AI recommendations", starter: false, growth: true, pro: true, enterprise: true },
  { feature: "Advanced SEO pages", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "Review widget", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "Booking integration", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "SMS lead alerts", starter: false, growth: false, pro: true, enterprise: true },
  { feature: "Ecommerce store", starter: false, growth: false, pro: false, enterprise: true },
  { feature: "Custom portals/membership", starter: false, growth: false, pro: false, enterprise: true },
  { feature: "Custom API integrations", starter: false, growth: false, pro: false, enterprise: true },
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

const TIER_KEY_MAP: Record<string, string> = {
  Starter: "starter",
  Growth: "growth",
  Pro: "premium",
  Enterprise: "enterprise",
};

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [showComparison, setShowComparison] = useState(false);
  const { data: catalogItems = [] } = trpc.products.list.useQuery();

  const activeTiers = useMemo(() => {
    const catalog = catalogItems as any[];
    return tiers.map(tier => {
      const key = TIER_KEY_MAP[tier.name];
      const dbItem = catalog.find((p: any) => p.productKey === key && p.category === "package");
      if (!dbItem) return tier;
      const basePrice = parseFloat(dbItem.basePrice);
      const discount = dbItem.discountPercent ?? 0;
      const effectivePrice = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
      return {
        ...tier,
        price: `$${effectivePrice}/mo`,
        annual: `$${effectivePrice * 12} total over 12 months`,
      };
    });
  }, [catalogItems]);

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
            No hidden fees.{" "}
            <span className="text-gradient-electric">No surprises.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            Every plan includes a custom build, your own portal, monthly reports, and a team that actually answers when you reach out. Pick the one that fits.
          </motion.p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {activeTiers.map((tier, idx) => (
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
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-serif text-off-white">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-sm text-off-white/40 font-sans">/month</span>}
                </div>
                {tier.annual && (
                  <span className="text-xs font-sans text-off-white/40 block mb-1">
                    {tier.annual} total over 12 months
                  </span>
                )}
                {tier.price !== "Custom" && (
                  <span className="text-[10px] font-sans text-off-white/40 block mt-1">12-month contract</span>
                )}
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
            <table className="w-full text-sm font-sans min-w-[600px]">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 text-off-white/50 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 text-electric font-medium">Growth</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-glass-border/50 hover:bg-off-white/2">
                    <td className="py-3 px-4 text-off-white/60">{row.feature}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.starter} /></td>
                    <td className="py-3 px-4 text-center bg-electric/3"><CellValue value={row.growth} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Ecommerce callout */}
        <div className="max-w-2xl mx-auto mt-10 p-4 rounded-xl border border-gold/20 bg-gold/5 text-center">
          <p className="text-sm font-sans text-off-white/60">
            <span className="text-gold font-medium">Building an online store?</span>{" "}
            Our Enterprise plan covers ecommerce, or ask your rep about a custom Commerce package tailored to your product count and needs.
          </p>
        </div>

        {/* Legal disclaimers */}
        <div className="max-w-3xl mx-auto mt-8 text-center space-y-2">
          <p className="text-xs text-off-white/25 font-sans">
            All prices are in USD. Monthly fees are billed on a 12-month agreement. Prices may change with 30 days notice.
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
