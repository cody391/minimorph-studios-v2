/*
 * Demo Builds section — 6 industry concept cards.
 * Each card: industry, recommended package, what it proves, possible add-ons, CTA.
 * Ecommerce labeled with custom quote note.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, Leaf, UtensilsCrossed, HardHat, Scissors, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

const demos = [
  {
    icon: Car,
    name: "Lakeshore Auto Detailing",
    industry: "Auto Detailing",
    style: "Premium dark automotive",
    package: "Growth",
    proves: "Booking/quote flow, before/after gallery, reviews, service packages",
    addOns: "Booking integration, review widget, SMS lead alerts",
    color: "from-electric/20 to-electric/5",
    border: "border-electric/20",
    iconColor: "text-electric",
  },
  {
    icon: Leaf,
    name: "Q's Landscaping",
    industry: "Landscaping / Lawn Care",
    style: "Earthy, clean, local, trustworthy",
    package: "Growth",
    proves: "Seasonal services, service area pages, quote form, gallery",
    addOns: "Local SEO pages, Google Analytics, newsletter capture",
    color: "from-cyan/20 to-cyan/5",
    border: "border-cyan/20",
    iconColor: "text-cyan",
  },
  {
    icon: UtensilsCrossed,
    name: "G&L Chillidog",
    industry: "Restaurant / Food",
    style: "Bright, playful, mobile-first, menu-focused",
    package: "Starter",
    proves: "Menu, hours, location, catering/event inquiry, social links",
    addOns: "Google Maps embed, social links, Meta pixel",
    color: "from-gold/20 to-gold/5",
    border: "border-gold/20",
    iconColor: "text-gold",
  },
  {
    icon: HardHat,
    name: "Shoreline Concrete & Coatings",
    industry: "Contractor / Home Services",
    style: "Rugged, professional, industrial, trust-heavy",
    package: "Growth",
    proves: "Estimate forms, project gallery, reviews, financing inquiry",
    addOns: "Review widget, AI chat widget, SMS lead alerts",
    color: "from-violet/20 to-violet/5",
    border: "border-violet/20",
    iconColor: "text-violet",
  },
  {
    icon: Scissors,
    name: "Salon / Spa Demo",
    industry: "Salon / Spa / Beauty",
    style: "Elegant, soft, appointment-driven",
    package: "Growth",
    proves: "Service menu, booking integration, gallery, reviews",
    addOns: "Booking integration, review widget, newsletter capture",
    color: "from-electric-light/20 to-electric-light/5",
    border: "border-electric-light/20",
    iconColor: "text-electric-light",
  },
  {
    icon: ShoppingBag,
    name: "Festival Hammock Supply Co.",
    industry: "Ecommerce Store",
    style: "Colorful, product-forward, lifestyle-driven",
    package: "Commerce / Custom Quote",
    proves: "Product catalog, categories, product detail, cart/checkout discussion",
    addOns: "Shopify/WooCommerce review, product migration, inventory",
    color: "from-gold/20 to-gold/5",
    border: "border-gold/20",
    iconColor: "text-gold",
    isEcommerce: true,
  },
];

export default function Portfolio() {
  const [, setLocation] = useLocation();

  return (
    <section id="demo-builds" className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            Demo Builds
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Imagine your business{" "}
            <span className="text-gradient-electric">here.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            These demo concepts show what MiniMorph can create for different types of businesses. Each one is built to prove real features — not just look pretty.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {demos.map((demo, idx) => (
            <motion.div
              key={demo.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`group relative p-6 rounded-2xl glass-card ${demo.border} hover:border-electric/40 transition-all duration-500`}
            >
              {/* Gradient top accent */}
              <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${demo.color}`} />

              <div className={`w-10 h-10 rounded-lg bg-off-white/5 border border-off-white/10 flex items-center justify-center mb-4`}>
                <demo.icon size={20} className={demo.iconColor} />
              </div>

              <h3 className="text-lg font-serif text-off-white mb-1">{demo.name}</h3>
              <p className="text-xs font-sans text-off-white/40 mb-4">{demo.industry} &middot; {demo.style}</p>

              <div className="space-y-3 mb-5">
                <div>
                  <span className="text-xs font-sans font-medium text-electric/80 uppercase tracking-wider">Recommended Package</span>
                  <p className="text-sm font-sans text-off-white/70 mt-0.5">{demo.package}</p>
                </div>
                <div>
                  <span className="text-xs font-sans font-medium text-electric/80 uppercase tracking-wider">What It Proves</span>
                  <p className="text-sm font-sans text-off-white/50 mt-0.5">{demo.proves}</p>
                </div>
                <div>
                  <span className="text-xs font-sans font-medium text-electric/80 uppercase tracking-wider">Possible Add-Ons</span>
                  <p className="text-sm font-sans text-off-white/50 mt-0.5">{demo.addOns}</p>
                </div>
              </div>

              {demo.isEcommerce && (
                <div className="mb-4 p-2.5 rounded-lg bg-gold/5 border border-gold/15">
                  <p className="text-xs font-sans text-gold/80">
                    Ecommerce builds may require a Commerce package or custom quote.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full border-off-white/15 text-off-white/70 hover:text-off-white hover:bg-off-white/5 font-sans rounded-full group/btn transition-all"
                onClick={() => setLocation("/get-started")}
              >
                Want This for Your Business?
                <ArrowRight size={14} className="ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
              </Button>

              {/* Disclaimer */}
              <p className="mt-3 text-[10px] font-sans text-off-white/25 leading-relaxed">
                Demo concept built by MiniMorph Studios to show what we can create for this type of business. Not a client website or performance claim.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
