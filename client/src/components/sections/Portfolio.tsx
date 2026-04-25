/**
 * Showroom — our "showroom floor models."
 * Each card links to a full sample site page. Different visual styles,
 * different packages, different add-ons. This is where visitors see
 * what MiniMorph actually builds.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { showroomSites } from "@/data/showroom";

export default function Portfolio() {
  const [, setLocation] = useLocation();

  return (
    <section
      id="showroom"
      className="py-20 lg:py-28 bg-charcoal relative overflow-hidden"
    >
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            The Showroom
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Don't imagine it.{" "}
            <span className="text-gradient-electric">Browse it.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed max-w-xl mx-auto"
          >
            Six sample sites. Six industries. Six completely different styles.
            Each one built on a MiniMorph package with add-ons you can actually
            see working. Click through — they're our showroom floor models.
          </motion.p>
        </div>

        {/* Showroom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {showroomSites.map((site, idx) => (
            <motion.div
              key={site.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="group rounded-2xl overflow-hidden glass-card hover:border-electric/30 transition-all duration-500 cursor-pointer"
              onClick={() => setLocation(`/showroom/${site.slug}`)}
            >
              {/* Hero image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={site.heroImage}
                  alt={site.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Tier badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold backdrop-blur-sm"
                    style={{
                      backgroundColor: site.palette.accent + "30",
                      color: site.palette.accent,
                      border: `1px solid ${site.palette.accent}50`,
                    }}
                  >
                    <Star size={8} />
                    {site.tier}
                  </span>
                </div>
                {/* Name overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: site.font.heading }}
                  >
                    {site.name}
                  </h3>
                  <p className="text-xs text-white/70 font-sans">
                    {site.industry} — {site.location}
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <p className="text-sm font-sans text-off-white/50 leading-relaxed mb-4 line-clamp-2">
                  {site.tagline} — {site.personality.split(".")[0]}.
                </p>

                {/* Add-ons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {site.addOns.slice(0, 3).map((addon) => (
                    <span
                      key={addon}
                      className="text-[10px] font-sans text-off-white/40 px-2 py-0.5 rounded-full border border-off-white/10 bg-off-white/5"
                    >
                      {addon}
                    </span>
                  ))}
                  {site.addOns.length > 3 && (
                    <span className="text-[10px] font-sans text-electric/60 px-2 py-0.5">
                      +{site.addOns.length - 3} more
                    </span>
                  )}
                </div>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans text-off-white/40">
                    {site.tierPrice}
                  </span>
                  <span className="text-sm font-sans text-electric flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore
                    <ExternalLink size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-sm font-sans text-off-white/40 mb-4">
            Like what you see? Every one of these was built on a MiniMorph plan.
          </p>
          <Button
            className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-sm px-8 rounded-full"
            onClick={() => setLocation("/get-started")}
          >
            Start My Build
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </motion.div>

        <p className="text-center mt-8 text-[10px] font-sans text-off-white/20 max-w-lg mx-auto">
          All sample sites are fictional demonstrations created to showcase
          MiniMorph capabilities. Business names, locations, and details are
          illustrative only. Actual results depend on your content, industry,
          and engagement level.
        </p>
      </div>
    </section>
  );
}
