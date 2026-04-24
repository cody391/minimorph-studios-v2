/*
 * Social Proof section — placeholder testimonials with legal-safe copy.
 * These are clearly marked as illustrative examples until real reviews are collected.
 */
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "MiniMorph took our outdated website and turned it into something we are actually proud of. The monthly reports help us understand what is working.",
    name: "Local Business Owner",
    role: "Service Business",
    stars: 5,
  },
  {
    quote: "The onboarding process was thorough. They asked about our competitors, our style preferences, and what features we actually needed. No one else did that.",
    name: "Restaurant Owner",
    role: "Food & Beverage",
    stars: 5,
  },
  {
    quote: "Having a customer portal where I can request changes and see my reports is a game changer. I do not have to chase anyone down for updates.",
    name: "Contractor",
    role: "Home Services",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            What People Say
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Built for businesses{" "}
            <span className="text-gradient-electric">like yours.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl glass-card"
            >
              <Quote size={24} className="text-electric/30 mb-4" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm font-sans text-off-white/60 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
              <div>
                <p className="text-sm font-sans font-medium text-off-white/80">{t.name}</p>
                <p className="text-xs font-sans text-off-white/40">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-8 text-[10px] font-sans text-off-white/20">
          These testimonials are illustrative examples based on common client feedback. Real client reviews will be added as they are collected.
        </p>
      </div>
    </section>
  );
}
