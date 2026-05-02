/**
 * Showroom — our "showroom floor models."
 * Shows browser mockup cards: iframe preview if liveUrl is set, CSS fallback otherwise.
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
            Each one built on a MiniMorph Studios package with real add-ons you can
            see working. Click through — these are our showroom floor models.
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
              className="group rounded-2xl overflow-hidden glass-card hover:border-electric/30 transition-all duration-500"
            >
              {/* Browser chrome + preview area */}
              <div
                className="relative overflow-hidden"
                style={{ backgroundColor: site.palette.bg }}
              >
                {/* Browser chrome */}
                <div
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{
                    backgroundColor: site.palette.card,
                    borderBottom: `1px solid ${site.palette.border}`,
                  }}
                >
                  <div className="flex gap-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#ffbd2e" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
                  </div>
                  <div
                    className="flex-1 h-5 rounded-full mx-2 flex items-center px-2.5 overflow-hidden"
                    style={{
                      backgroundColor: site.palette.bg,
                      border: `1px solid ${site.palette.border}`,
                    }}
                  >
                    <span
                      className="text-[8px] font-mono truncate"
                      style={{ color: site.palette.muted }}
                    >
                      {site.subdomain}.minimorphstudios.net
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-bold whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: site.palette.accent + "25",
                      color: site.palette.accent,
                      border: `1px solid ${site.palette.accent}40`,
                    }}
                  >
                    <Star size={7} />
                    {site.tier}
                  </span>
                </div>

                {/* Site preview */}
                <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
                  {site.liveUrl ? (
                    <iframe
                      src={site.liveUrl}
                      style={{
                        width: "200%",
                        height: "200%",
                        transform: "scale(0.5)",
                        transformOrigin: "top left",
                        pointerEvents: "none",
                        border: "none",
                      }}
                      loading="lazy"
                      title={`${site.name} preview`}
                    />
                  ) : (
                    <div
                      style={{
                        background: site.heroGradient,
                        height: "100%",
                        padding: "16px",
                      }}
                    >
                      <div
                        className="rounded-lg px-3 py-2.5 flex items-center justify-between mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${site.palette.accent}18 0%, ${site.palette.card} 100%)`,
                          border: `1px solid ${site.palette.accent}22`,
                        }}
                      >
                        <div>
                          <div
                            className="text-[10px] font-semibold mb-0.5 truncate max-w-[100px]"
                            style={{ color: site.palette.text, fontFamily: site.font.heading }}
                          >
                            {site.name}
                          </div>
                          <div
                            className="h-1 w-14 rounded-full"
                            style={{ backgroundColor: site.palette.accent, opacity: 0.5 }}
                          />
                        </div>
                        <div
                          className="px-2 py-1 rounded-full text-[7px] font-bold shrink-0 ml-2"
                          style={{
                            backgroundColor: site.palette.accent,
                            color: site.slug === "clover-and-thistle" ? "#fff" : site.palette.bg,
                          }}
                        >
                          {site.sections.cta}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div
                          className="h-10 rounded"
                          style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
                        />
                        <div
                          className="h-10 rounded"
                          style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: site.palette.border, width: "75%" }} />
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: site.palette.border, width: "55%" }} />
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: site.palette.border, width: "65%" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-base font-serif text-off-white font-bold">{site.name}</h3>
                    <p className="text-xs font-sans text-off-white/40 mt-0.5">{site.industry}</p>
                  </div>
                  <span
                    className="text-xs font-sans font-semibold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5"
                    style={{
                      backgroundColor: site.palette.accent + "20",
                      color: site.palette.accent,
                    }}
                  >
                    ${site.price}/mo
                  </span>
                </div>

                {/* Result stat */}
                <p className="text-sm font-sans font-semibold text-electric mb-3">
                  {site.resultStat}
                </p>

                {/* Add-on tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {site.showcasedAddOns.map((addon) => (
                    <span
                      key={addon}
                      className="text-[10px] font-sans text-off-white/40 px-2 py-0.5 rounded-full border border-off-white/10 bg-off-white/5"
                    >
                      {addon}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-3">
                  {site.liveUrl ? (
                    <a
                      href={site.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-sans text-electric flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      See Live Demo <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-sm font-sans text-off-white/25 italic">
                      Deploying…
                    </span>
                  )}
                  <button
                    onClick={() => setLocation("/get-started")}
                    className="ml-auto text-sm font-sans text-off-white/50 hover:text-electric flex items-center gap-1 transition-colors"
                  >
                    Build Mine <ArrowRight size={12} />
                  </button>
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
            Like what you see? Every one of these was built on a MiniMorph Studios plan.
          </p>
          <Button
            className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-sm px-8 rounded-full"
            onClick={() => setLocation("/get-started")}
          >
            Start a Project
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </motion.div>

        <p className="text-center mt-8 text-[10px] font-sans text-off-white/40 max-w-lg mx-auto">
          All sample sites are fictional demonstrations created to showcase
          MiniMorph Studios capabilities. Business names, locations, and details are
          illustrative only. Actual results depend on your content, industry,
          and engagement level.
        </p>
      </div>
    </section>
  );
}
