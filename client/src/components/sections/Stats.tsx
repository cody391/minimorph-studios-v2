/*
 * Trust Strip — credibility bar below hero.
 * Muskegon-based, Human-backed, AI-assisted, Secure checkout, Customer portal, Monthly reports.
 */
import { motion } from "framer-motion";
import { MapPin, Shield, Zap, Lock, Users, BarChart3, RefreshCw } from "lucide-react";

const trustItems = [
  { icon: MapPin, label: "Muskegon, MI" },
  { icon: Shield, label: "Human-Backed" },
  { icon: Zap, label: "AI-Assisted" },
  { icon: Lock, label: "Secure Checkout" },
  { icon: Users, label: "Customer Portal" },
  { icon: BarChart3, label: "Monthly Reports" },
  { icon: RefreshCw, label: "Ongoing Updates" },
];

export default function Stats() {
  return (
    <section className="py-6 bg-charcoal border-y border-glass-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-off-white/40">
              <item.icon size={15} className="text-electric/50" />
              <span className="text-xs font-sans font-medium uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
