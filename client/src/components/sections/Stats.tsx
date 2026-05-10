/*
 * Trust Strip — brand value bar below hero.
 */
import { motion } from "framer-motion";
import { Shield, Zap, Lock, Users, BarChart3, RefreshCw, Globe, Bot, Package, CheckCircle } from "lucide-react";

const trustItems = [
  { icon: Globe, label: "Custom Built — No Templates" },
  { icon: Package, label: "Hosting Included" },
  { icon: Lock, label: "SSL & Security Included" },
  { icon: BarChart3, label: "Monthly Reports" },
  { icon: Users, label: "You Own Your Site" },
  { icon: Shield, label: "No Surprise Fees" },
  { icon: CheckCircle, label: "Responsive Support" },
  { icon: Bot, label: "AI-Powered Recommendations" },
  { icon: Zap, label: "Domain Management Included" },
  { icon: RefreshCw, label: "12-Month Partnership" },
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
