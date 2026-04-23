/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Core Principle: Bold editorial statement section.
 * "Humans close. AI does everything else."
 */
import { motion } from "framer-motion";
import { Users, Bot } from "lucide-react";

export default function CorePrinciple() {
  return (
    <section className="py-24 lg:py-32 bg-cream-dark relative overflow-hidden">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-forest leading-[1.1] mb-10">
              Humans{" "}
              <span className="italic text-terracotta">close.</span>
              <br />
              AI does everything else.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg lg:text-xl text-forest/60 font-sans leading-relaxed max-w-2xl mx-auto mb-16"
          >
            Our system is built on one core belief: people are best at building relationships. Everything else — sourcing, warming, guiding, supporting, nurturing, reporting, upgrading, and renewing — is handled by intelligent automation.
          </motion.p>

          {/* Two columns: Human vs AI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-8 rounded-2xl bg-card border border-border/50 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center mb-6">
                <Users size={22} className="text-forest" />
              </div>
              <h3 className="text-xl font-serif text-forest mb-4">
                Your Sales Reps
              </h3>
              <ul className="space-y-3">
                {[
                  "Receive warm, qualified leads",
                  "Build personal relationships",
                  "Close deals with confidence",
                  "Earn commissions on every sale",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-sm font-sans text-forest/60 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-8 rounded-2xl bg-card border border-border/50 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center mb-6">
                <Bot size={22} className="text-terracotta" />
              </div>
              <h3 className="text-xl font-serif text-forest mb-4">
                Our AI System
              </h3>
              <ul className="space-y-3">
                {[
                  "Sources and warms leads",
                  "Guides the buying experience",
                  "Manages ongoing support",
                  "Delivers reports & analytics",
                  "Identifies upgrade opportunities",
                  "Drives contract renewals",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-sm font-sans text-forest/60 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
