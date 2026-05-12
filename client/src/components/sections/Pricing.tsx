/*
 * Pricing — 3 tiers pulled from DB, value anchor, free features grid, comparison table.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Star, CheckCircle, Info } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface Tier {
  name: string;
  productKey: string;
  price: string;
  annual: string;
  description: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  cta: string;
}

const TIER_DEFAULTS: Tier[] = [
  {
    name: "Starter",
    productKey: "starter",
    price: "$195/mo",
    annual: "$2,340 total over 12 months",
    description: "You need a website that doesn't embarrass you. Clean, fast, professional. We handle the rest.",
    features: [
      "Up to 5 pages",
      "Mobile-responsive design",
      "Contact / quote form",
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
    productKey: "growth",
    price: "$295/mo",
    annual: "$3,540 total over 12 months",
    description: "The sweet spot. More pages, a blog, expert recommendations, and enough updates to keep things fresh.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 10 pages",
      "Everything in Starter",
      "Blog or news section",
      "Google Analytics setup",
      "2 content updates per month",
      "Personalized growth recommendations",
      "Priority email support",
      "Add-on integrations available",
    ],
    cta: "Start with Growth",
  },
  {
    name: "Pro",
    productKey: "premium",
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
];

type FeatureRow = { feature: string; starter: boolean | string; growth: boolean | string; pro: boolean | string };

const comparisonRows: FeatureRow[] = [
  { feature: "Pages included", starter: "Up to 5", growth: "Up to 10", pro: "Up to 20" },
  { feature: "Mobile-responsive", starter: true, growth: true, pro: true },
  { feature: "Contact / quote form", starter: true, growth: true, pro: true },
  { feature: "Basic SEO", starter: true, growth: true, pro: true },
  { feature: "Customer portal", starter: true, growth: true, pro: true },
  { feature: "Monthly report", starter: true, growth: true, pro: true },
  { feature: "Content updates/mo", starter: "1", growth: "2", pro: "4" },
  { feature: "Blog / news section", starter: false, growth: true, pro: true },
  { feature: "Google Analytics", starter: false, growth: true, pro: true },
  { feature: "Growth recommendations", starter: false, growth: true, pro: true },
  { feature: "Advanced SEO pages", starter: false, growth: false, pro: true },
  { feature: "Review widget", starter: false, growth: false, pro: true },
  { feature: "Booking integration", starter: false, growth: false, pro: true },
  { feature: "SMS lead alerts", starter: false, growth: false, pro: true },
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
  const { data: catalog } = trpc.products.catalog.useQuery();

  const activeTiers = useMemo(() => {
    return TIER_DEFAULTS.map(tier => {
      const dbItem = catalog?.packages?.find((p: any) => p.productKey === tier.productKey);
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
  }, [catalog]);

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
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
            Every plan includes a custom build, your own portal, monthly reports, and support when you need it.
          </motion.p>
        </div>

        {/* Value Anchor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="text-center mb-14"
        >
          <p className="text-off-white/40 text-sm font-sans mb-5">What you'd pay elsewhere</p>
          <div className="flex justify-center gap-10 flex-wrap">
            <div className="text-center">
              <p className="text-off-white/30 text-xs font-sans mb-1">Freelancer build</p>
              <p className="text-off-white/40 text-xl font-serif line-through">$2,000–5,000</p>
              <p className="text-off-white/25 text-xs font-sans mt-1">one-time, then you're on your own</p>
            </div>
            <div className="text-center">
              <p className="text-off-white/30 text-xs font-sans mb-1">Agency retainer</p>
              <p className="text-off-white/40 text-xl font-serif line-through">$1,500–3,000/mo</p>
              <p className="text-off-white/25 text-xs font-sans mt-1">plus setup fees</p>
            </div>
            <div className="text-center">
              <p className="text-electric text-xs font-sans font-medium mb-1">MiniMorph Studios</p>
              <p className="text-electric text-xl font-serif">From $195/mo</p>
              <p className="text-electric/50 text-xs font-sans mt-1">everything included, no setup fee</p>
            </div>
          </div>
        </motion.div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
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
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-serif text-off-white">
                    {tier.price.replace("/mo", "")}
                  </span>
                  <span className="text-sm text-off-white/40 font-sans">/mo</span>
                </div>
                <span className="text-xs font-sans text-off-white/40 block">
                  {tier.annual}
                </span>
                <span className="text-[10px] font-sans text-off-white/30 block mt-1">
                  12-month agreement · No setup fee
                </span>
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

        {/* What's Included in Every Plan */}
        {catalog?.freeFeatures && catalog.freeFeatures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-6 mb-12"
          >
            <h3 className="text-center text-xl font-serif text-off-white mb-8">
              Included in every plan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {(catalog.freeFeatures as any[]).map((feature: any) => (
                <div
                  key={feature.productKey}
                  className="flex items-start gap-3 p-4 rounded-xl bg-off-white/3 border border-off-white/8"
                >
                  <CheckCircle className="h-4 w-4 text-electric shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-off-white">{feature.name}</p>
                    {feature.description && (
                      <p className="text-xs text-off-white/50 mt-0.5 leading-snug">{feature.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
            className="max-w-3xl mx-auto overflow-x-auto mb-10"
          >
            <table className="w-full text-sm font-sans min-w-[480px]">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 text-off-white/50 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 text-electric font-medium">Growth</th>
                  <th className="text-center py-3 px-4 text-off-white/50 font-medium">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-glass-border/50 hover:bg-off-white/2">
                    <td className="py-3 px-4 text-off-white/60">{row.feature}</td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.starter} /></td>
                    <td className="py-3 px-4 text-center bg-electric/3"><CellValue value={row.growth} /></td>
                    <td className="py-3 px-4 text-center"><CellValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Ecommerce callout */}
        <div className="max-w-2xl mx-auto mt-4 mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5 text-center">
          <p className="text-sm font-sans text-off-white/60">
            <span className="text-gold font-medium">Running an online store?</span>{" "}
            Our Shop plans start at $295/mo with full ecommerce built in. Ask Elena about it during onboarding, or reach out at{" "}
            <a href="mailto:hello@minimorphstudios.net" className="text-electric/70 hover:text-electric transition-colors underline underline-offset-2">
              hello@minimorphstudios.net
            </a>
          </p>
        </div>

        {/* Legal disclaimers */}
        <div className="max-w-3xl mx-auto mt-8 text-center space-y-2">
          <p className="text-xs text-off-white/25 font-sans">
            All prices are in USD. Monthly fees are billed on a 12-month agreement. Prices may change with 30 days notice.
          </p>
          <p className="text-xs text-off-white/25 font-sans">
            Add-on pricing varies by feature. Ecommerce, product migration, and custom API integrations require a custom quote.
          </p>
          <p className="text-xs text-off-white/25 font-sans">
            MiniMorph Studios reserves the right to adjust pricing for new customers. Existing customers are locked in at their contracted rate.
          </p>
        </div>
      </div>
    </section>
  );
}
