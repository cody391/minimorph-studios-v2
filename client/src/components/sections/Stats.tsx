/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Stats: Key value propositions. Will show real metrics as they grow.
 */
import { motion } from "framer-motion";
import { Sparkles, Shield, Clock, HeartHandshake } from "lucide-react";

const highlights = [
  { icon: Sparkles, label: "AI-Powered Design", description: "Custom websites built with intelligent automation" },
  { icon: Shield, label: "Full-Service Contracts", description: "12-month partnerships with ongoing support" },
  { icon: Clock, label: "Fast Turnaround", description: "From concept to launch in days, not months" },
  { icon: HeartHandshake, label: "Dedicated Support", description: "Proactive care for every client, every month" },
];

export default function Stats() {
  return (
    <section className="py-16 lg:py-20 bg-warm-white border-y border-border/50">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {highlights.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-forest/8 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-forest/60" />
              </div>
              <p className="text-sm font-sans font-medium text-forest mb-1">
                {item.label}
              </p>
              <p className="text-xs font-sans text-forest/50">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
