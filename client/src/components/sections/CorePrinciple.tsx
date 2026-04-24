/*
 * What's Included + Integrations/Add-ons section.
 * Three tiers: Included/Basic, Popular Add-ons, Custom Quote.
 */
import { motion } from "framer-motion";
import {
  Check, Globe, MapPin, Link2, Search, Bot, BarChart3,
  Bell, Star, Calendar, FileText, Image, Smartphone, Mail,
  ShoppingCart, Package, Languages, Code, CreditCard, Cog, Zap,
} from "lucide-react";

const included = [
  "Custom website build",
  "Mobile-friendly design",
  "Contact/quote form",
  "Basic SEO setup",
  "Customer portal",
  "Monthly report",
  "Support request flow",
  "Onboarding guidance",
  "Domain/launch guidance",
  "Human-backed support",
  "AI-assisted recommendations",
];

const integrationTiers = [
  {
    title: "Included / Basic",
    description: "Every plan comes with these essentials.",
    color: "border-electric/20",
    headerBg: "bg-electric/10",
    headerText: "text-electric",
    items: [
      { icon: FileText, label: "Contact form" },
      { icon: MapPin, label: "Google Maps embed" },
      { icon: Link2, label: "Social links" },
      { icon: Search, label: "Basic SEO structure" },
    ],
  },
  {
    title: "Popular Add-Ons",
    description: "Upgrade your site with powerful features.",
    color: "border-violet/20",
    headerBg: "bg-violet/10",
    headerText: "text-violet",
    items: [
      { icon: Bot, label: "AI chat widget" },
      { icon: BarChart3, label: "Google Analytics setup" },
      { icon: Search, label: "Google Search Console" },
      { icon: Bell, label: "SMS lead alerts" },
      { icon: Star, label: "Review widget" },
      { icon: Calendar, label: "Booking integration" },
      { icon: Globe, label: "Extra service pages" },
      { icon: Image, label: "Monthly content/photo updates" },
      { icon: Smartphone, label: "Meta/TikTok pixel" },
      { icon: Mail, label: "Newsletter capture" },
    ],
  },
  {
    title: "Custom Quote",
    description: "Complex integrations reviewed before quoting.",
    color: "border-gold/20",
    headerBg: "bg-gold/10",
    headerText: "text-gold",
    items: [
      { icon: ShoppingCart, label: "Ecommerce store" },
      { icon: Package, label: "Shopify / WooCommerce" },
      { icon: Package, label: "Product migration" },
      { icon: Package, label: "100+ products" },
      { icon: Languages, label: "Multilingual website" },
      { icon: Code, label: "Custom API integration" },
      { icon: CreditCard, label: "Complex booking with payments" },
      { icon: CreditCard, label: "Toast / Square ordering" },
      { icon: Cog, label: "CRM/Zapier automation" },
    ],
  },
];

export default function CorePrinciple() {
  return (
    <>
      {/* What's Included */}
      <section className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
                >
                  What You Get
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-serif text-off-white leading-tight mb-6"
                >
                  Everything included{" "}
                  <span className="text-gradient-electric">in every plan.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-off-white/50 font-sans leading-relaxed"
                >
                  Every MiniMorph plan includes the core features you need to get online and stay supported. Some integrations, ecommerce, advanced SEO pages, SMS alerts, AI chat widgets, product catalogs, migrations, and complex booking/payment systems may be add-ons or custom quote.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="grid grid-cols-1 gap-2.5">
                  {included.map((item) => (
                    <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-off-white/3">
                      <Check size={16} className="text-electric shrink-0" />
                      <span className="text-sm font-sans text-off-white/70">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations / Add-ons */}
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
              Start simple.{" "}
              <span className="text-gradient-electric">Add power when you need it.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              Tell us what you want during onboarding. We will recommend the right features for your business.
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
        </div>
      </section>
    </>
  );
}
