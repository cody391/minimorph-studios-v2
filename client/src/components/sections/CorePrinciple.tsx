/*
 * Add-Ons — DB-driven grid with filter tabs. Replaces static integration tiers.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type FilterKey = "all" | "marketing" | "functionality" | "design";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "marketing", label: "Marketing" },
  { key: "functionality", label: "Functionality" },
  { key: "design", label: "Design" },
];

const FILTER_KEYS: Record<FilterKey, string[]> = {
  all: [],
  marketing: ["seo_autopilot", "sms_alerts", "competitor_monitoring", "email_marketing_setup", "social_feed_embed"],
  functionality: ["booking_widget", "ai_chatbot", "review_collector", "lead_capture_bot", "event_calendar", "menu_price_list", "live_chat", "online_store"],
  design: ["logo_design", "brand_style_guide", "ai_photography", "video_background", "extra_pages", "copywriting"],
};

export default function CorePrinciple() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data: catalog } = trpc.products.catalog.useQuery();

  const allItems = useMemo(() => {
    const addons = (catalog?.paidAddons as any[]) ?? [];
    const oneTime = (catalog?.oneTimeItems as any[]) ?? [];
    return [...addons, ...oneTime];
  }, [catalog]);

  const visibleItems = useMemo(() => {
    if (filter === "all") return allItems;
    const keys = FILTER_KEYS[filter];
    return allItems.filter((p: any) => keys.includes(p.productKey));
  }, [allItems, filter]);

  return (
    <section id="addons" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            Add-Ons
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Add exactly what{" "}
            <span className="text-gradient-electric">your business needs.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            Every add-on is optional. Pick what fits, skip what doesn't.
            Elena will recommend the right ones for your specific business during onboarding.
          </motion.p>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-2 mb-10 flex-wrap"
        >
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-sm font-sans font-medium transition-all duration-200 ${
                filter === f.key
                  ? "bg-electric text-midnight"
                  : "bg-off-white/5 text-off-white/50 hover:text-off-white hover:bg-off-white/10 border border-off-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Addon Grid */}
        {visibleItems.length === 0 ? (
          <div className="text-center py-20 text-off-white/30 font-sans text-sm">
            Loading add-ons…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {visibleItems.map((addon: any, idx: number) => {
              const basePrice = parseFloat(addon.basePrice);
              const isOneTime = addon.category === "one_time";
              const priceLabel = isOneTime
                ? `$${basePrice.toFixed(0)} one-time`
                : `$${basePrice.toFixed(0)}/mo`;

              return (
                <motion.div
                  key={addon.productKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                  className="flex flex-col rounded-xl border border-off-white/10 bg-off-white/3 p-5 hover:border-electric/30 hover:bg-electric/5 transition-all duration-300 group"
                >
                  {/* Badge */}
                  <span className="text-[10px] font-medium uppercase tracking-wider text-off-white/30 mb-3 block">
                    {isOneTime ? "One-time" : "Monthly"}
                  </span>

                  {/* Name */}
                  <h3 className="text-base font-semibold text-off-white mb-1 font-sans">
                    {addon.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-off-white/60 mb-4 leading-relaxed font-sans flex-1">
                    {addon.description}
                  </p>

                  {/* How it works */}
                  {addon.howItWorks && (
                    <p className="text-xs text-off-white/35 mb-4 leading-relaxed border-t border-off-white/8 pt-3 font-sans">
                      {addon.howItWorks}
                    </p>
                  )}

                  {/* Price + ROI */}
                  <div className="mt-auto">
                    <p className="text-lg font-serif text-electric">
                      {isOneTime
                        ? <>${basePrice.toFixed(0)} <span className="text-sm text-off-white/40 font-sans">one-time</span></>
                        : <>${basePrice.toFixed(0)} <span className="text-sm text-off-white/40 font-sans">/mo</span></>
                      }
                    </p>
                    {addon.roiExample && (
                      <p className="text-[11px] text-off-white/35 mt-1.5 leading-snug font-sans">
                        {addon.roiExample.length > 90
                          ? addon.roiExample.slice(0, 90) + "…"
                          : addon.roiExample}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-14"
        >
          <p className="text-off-white/40 font-sans text-sm mb-4 max-w-md mx-auto">
            Not sure which add-ons fit your business? Elena will recommend the right ones based on what you actually need.
          </p>
          <Button
            className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold px-8 rounded-full shadow-none hover:shadow-lg hover:shadow-electric/20 transition-all duration-300"
            onClick={() => setLocation("/get-started")}
          >
            Talk to Elena
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
