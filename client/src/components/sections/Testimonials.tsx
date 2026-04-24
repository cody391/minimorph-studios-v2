/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Testimonials: Will display real client testimonials once available.
 * Currently shows an invitation to be the first reviewer.
 */
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-forest relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            Client Stories
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-cream leading-tight"
          >
            Trusted by businesses
            <br />
            <span className="italic">that value growth</span>
          </motion.h2>
        </div>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Quote size={32} className="text-terracotta/40 mx-auto mb-4" />
            <p className="text-base text-cream/60 font-sans leading-relaxed mb-4">
              We're just getting started. Our first clients are building amazing websites with us right now.
            </p>
            <p className="text-sm text-cream/40 font-sans">
              Real testimonials from real businesses — coming soon.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
