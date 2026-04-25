/*
 * Integrations & Add-Ons — the only section left after trimming
 * the redundant "What's Included" checklist (already visible in pricing cards).
 * Three tiers with personality.
 */
import { motion } from "framer-motion";
import {
  Globe, MapPin, Link2, Search, Bot, BarChart3,
  Bell, Star, Calendar, FileText, Image, Smartphone, Mail,
  ShoppingCart, Package, Languages, Code, CreditCard, Cog,
} from "lucide-react";

const integrationTiers = [
  {
    title: "Comes Standard",
    description: "Every plan. No asterisks.",
    color: "border-electric/20",
    headerBg: "bg-electric/10",
    headerText: "text-electric",
    items: [
      { icon: FileText, label: "Contact / quote form" },
      { icon: MapPin, label: "Google Maps embed" },
      { icon: Link2, label: "Social media links" },
      { icon: Search, label: "Basic SEO structure" },
    ],
  },
  {
    title: "Popular Add-Ons",
    description: "The stuff that turns a website into a sales tool.",
    color: "border-violet/20",
    headerBg: "bg-violet/10",
    headerText: "text-violet",
    items: [
      { icon: Bot, label: "AI chat widget" },
      { icon: BarChart3, label: "Google Analytics" },
      { icon: Search, label: "Search Console setup" },
      { icon: Bell, label: "SMS lead alerts" },
      { icon: Star, label: "Google Reviews widget" },
      { icon: Calendar, label: "Booking integration" },
      { icon: Globe, label: "Extra service pages" },
      { icon: Image, label: "Monthly photo updates" },
      { icon: Smartphone, label: "Meta / TikTok pixel" },
      { icon: Mail, label: "Newsletter capture" },
    ],
  },
  {
    title: "Custom Quote",
    description: "Big builds. We'll scope it together.",
    color: "border-gold/20",
    headerBg: "bg-gold/10",
    headerText: "text-gold",
    items: [
      { icon: ShoppingCart, label: "Ecommerce store" },
      { icon: Package, label: "Shopify / WooCommerce" },
      { icon: Package, label: "Product migration" },
      { icon: Package, label: "100+ product catalogs" },
      { icon: Languages, label: "Multilingual website" },
      { icon: Code, label: "Custom API integration" },
      { icon: CreditCard, label: "Complex booking + payments" },
      { icon: CreditCard, label: "Toast / Square ordering" },
      { icon: Cog, label: "CRM / Zapier automation" },
    ],
  },
];

export default function CorePrinciple() {
  return (
    <section id="integrations" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            Integrations & Add-Ons
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Your site grows{" "}
            <span className="text-gradient-electric">when you do.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            Start with what you need. Add features when they make sense — not because
            we upsold you during a sales call. Tell us what you want during onboarding
            and we'll recommend what actually fits your business.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {integrationTiers.map((tier, idx) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card ${tier.color} overflow-hidden`}
            >
              <div className={`p-4 ${tier.headerBg}`}>
                <h3 className={`text-lg font-serif ${tier.headerText}`}>{tier.title}</h3>
                <p className="text-xs font-sans text-off-white/40 mt-1">{tier.description}</p>
              </div>
              <div className="p-4 space-y-2">
                {tier.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 p-2 rounded-lg bg-off-white/3">
                    <item.icon size={15} className={tier.headerText + "/60"} />
                    <span className="text-sm font-sans text-off-white/60">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 text-xs font-sans text-off-white/25 max-w-md mx-auto"
        >
          Not sure what you need? Our onboarding AI will ask the right questions and recommend features based on your industry and goals.
        </motion.p>
      </div>
    </section>
  );
}
