/**
 * ShowroomSite — renders a full, turnkey sample site page for each showroom entry.
 * Each site demonstrates EVERY feature its package tier promises:
 *   Starter: 5 pages, contact form, basic SEO, monthly report
 *   Growth:  10 pages, blog, Google Analytics, reviews, add-ons
 *   Pro:     20 pages, booking, reviews, Instagram, SMS alerts, blog
 *   Commerce: unlimited, ecommerce, product catalog, cart, subscriptions
 */
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { showroomSites, type ShowroomSite as SiteType } from "@/data/showroom";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Star,
  Check,
  Sparkles,
  ExternalLink,
  Package,
  Clock,
  Phone,
  Utensils,
  Hammer,
  Scissors,
  Dumbbell,
  ShoppingBag,
  Coffee,
  Mail,
  MessageSquare,
  Calendar,
  Camera,
  Heart,
  Send,
  Upload,
  FileText,
  BarChart3,
  Globe,
  Bell,
  Truck,
  CreditCard,
  Gift,
  Newspaper,
  Users,
  Award,
  ChevronRight,
  Quote,
  Smartphone,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════
   SHARED SECTIONS — used across multiple tiers
   ═══════════════════════════════════════════════════════════════ */

function ReviewsSection({ site, reviews }: { site: SiteType; reviews: { name: string; rating: number; text: string; date: string; source?: string }[] }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Reviews
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            What people are saying.
          </h2>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={18} fill={site.palette.accent} style={{ color: site.palette.accent }} />
            ))}
            <span className="text-sm ml-2" style={{ color: site.palette.muted }}>
              4.9 average from {reviews.length * 12}+ reviews
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {reviews.map((r, idx) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="p-5 rounded-xl"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} fill={s <= r.rating ? site.palette.accent : "transparent"} style={{ color: site.palette.accent }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: site.palette.muted }}>
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{r.name}</span>
                <span className="text-xs" style={{ color: site.palette.muted }}>{r.source || "Google"} &middot; {r.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
            <Globe size={12} style={{ color: site.palette.accent }} />
            <span style={{ color: site.palette.accent }}>Powered by Google Reviews Widget</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogPreview({ site, posts }: { site: SiteType; posts: { title: string; excerpt: string; date: string; category: string }[] }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Newspaper size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Blog
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Latest from us.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {posts.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl overflow-hidden group cursor-pointer"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="h-36 overflow-hidden">
                <img src={site.heroImage} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: idx === 0 ? "center" : idx === 1 ? "left" : "right" }} />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>{p.category}</span>
                  <span className="text-[10px]" style={{ color: site.palette.muted }}>{p.date}</span>
                </div>
                <h3 className="text-base font-semibold mb-2 group-hover:opacity-80 transition-opacity" style={{ fontFamily: site.font.heading }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: site.palette.muted }}>{p.excerpt}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection({ site, fields, title, subtitle, buttonText }: { site: SiteType; fields: { label: string; type: string; placeholder: string }[]; title?: string; subtitle?: string; buttonText?: string }) {
  const isLight = site.slug === "clover-and-thistle";
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail size={16} style={{ color: site.palette.accent }} />
              <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
                Get in Touch
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl leading-tight mb-4" style={{ fontFamily: site.font.heading }}>
              {title || "Let's talk."}
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: site.palette.muted }}>
              {subtitle || "Fill out the form and we'll get back to you within 24 hours. No spam, no sales pitch — just a real conversation."}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin size={16} style={{ color: site.palette.accent }} />
                <span className="text-sm" style={{ color: site.palette.muted }}>{site.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} style={{ color: site.palette.accent }} />
                <span className="text-sm" style={{ color: site.palette.muted }}>hello@{site.slug}.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} style={{ color: site.palette.accent }} />
                <span className="text-sm" style={{ color: site.palette.muted }}>Mon–Fri 9am–5pm EST</span>
              </div>
            </div>
          </div>
          <div className="p-6 rounded-xl" style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: site.palette.muted }}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={4}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all focus:ring-2"
                      style={{ backgroundColor: site.palette.bg, border: `1px solid ${site.palette.border}`, color: site.palette.text, caretColor: site.palette.accent }}
                    />
                  ) : f.type === "file" ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: site.palette.bg, border: `1px dashed ${site.palette.border}` }}>
                      <Upload size={16} style={{ color: site.palette.muted }} />
                      <span className="text-sm" style={{ color: site.palette.muted }}>{f.placeholder}</span>
                    </div>
                  ) : (
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all focus:ring-2"
                      style={{ backgroundColor: site.palette.bg, border: `1px solid ${site.palette.border}`, color: site.palette.text, caretColor: site.palette.accent }}
                    />
                  )}
                </div>
              ))}
              <button
                className="w-full text-sm font-semibold px-6 py-3 rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: site.palette.accent, color: isLight ? "#fff" : site.palette.bg }}
              >
                {buttonText || "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LocationSection({ site, hours, mapNote }: { site: SiteType; hours: { day: string; time: string }[]; mapNote?: string }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} style={{ color: site.palette.accent }} />
              <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
                Find Us
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl leading-tight mb-6" style={{ fontFamily: site.font.heading }}>
              Hours & Location
            </h2>
            <div className="space-y-3">
              {hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${site.palette.border}40` }}>
                  <span className="text-sm font-medium">{h.day}</span>
                  <span className="text-sm" style={{ color: site.palette.muted }}>{h.time}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-6" style={{ color: site.palette.muted }}>
              {mapNote || "Hours may vary on holidays. Check our Google listing for real-time updates."}
            </p>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}>
            <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: site.palette.bg }}>
              <div className="text-center p-8">
                <MapPin size={32} style={{ color: site.palette.accent }} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold mb-1">{site.name}</p>
                <p className="text-xs" style={{ color: site.palette.muted }}>{site.location}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
                  <Globe size={10} style={{ color: site.palette.accent }} />
                  <span style={{ color: site.palette.accent }}>Google Maps Embed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ site, headline, sub }: { site: SiteType; headline?: string; sub?: string }) {
  const isLight = site.slug === "clover-and-thistle";
  return (
    <section className="py-16 lg:py-20" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Mail size={24} style={{ color: site.palette.accent }} className="mx-auto mb-4 opacity-60" />
        <h2 className="text-2xl sm:text-3xl leading-tight mb-3" style={{ fontFamily: site.font.heading }}>
          {headline || "Stay in the loop."}
        </h2>
        <p className="text-sm mb-6" style={{ color: site.palette.muted }}>
          {sub || "No spam. Just updates worth reading. Unsubscribe anytime."}
        </p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
            style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}`, color: site.palette.text }}
          />
          <button
            className="text-sm font-semibold px-6 py-3 rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: site.palette.accent, color: isLight ? "#fff" : site.palette.bg }}
          >
            Subscribe
          </button>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-[10px]" style={{ color: site.palette.muted }}>
          <Bell size={10} />
          <span>Newsletter Signup Add-On</span>
        </div>
      </div>
    </section>
  );
}

function InstagramFeed({ site }: { site: SiteType }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              @{site.slug.replace(/-/g, "")}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Follow along.
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 max-w-5xl mx-auto">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-square rounded-lg overflow-hidden group cursor-pointer relative"
            >
              <img
                src={site.heroImage}
                alt={`Instagram post ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                style={{ objectPosition: ["center", "left", "right", "top", "bottom", "center"][i] }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <Heart size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
            <Camera size={12} style={{ color: site.palette.accent }} />
            <span style={{ color: site.palette.accent }}>Instagram Feed Integration</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingWidget({ site }: { site: SiteType }) {
  const isLight = site.slug === "clover-and-thistle";
  const services = [
    { name: "Women's Cut & Style", duration: "60 min", price: "$75" },
    { name: "Men's Cut", duration: "30 min", price: "$40" },
    { name: "Full Balayage", duration: "180 min", price: "$250+" },
    { name: "Root Touch-Up", duration: "90 min", price: "$120" },
    { name: "Blowout", duration: "45 min", price: "$55" },
    { name: "Bridal Trial", duration: "120 min", price: "$150" },
  ];

  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Book Online
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Skip the phone call.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            Pick your service, choose your stylist, and book a time that works. Confirmation sent instantly.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {services.map((s, idx) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-xl flex items-center justify-between group cursor-pointer hover:opacity-90 transition-all"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: site.font.heading }}>{s.name}</h3>
                <div className="flex items-center gap-2">
                  <Clock size={10} style={{ color: site.palette.muted }} />
                  <span className="text-xs" style={{ color: site.palette.muted }}>{s.duration}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color: site.palette.accent }}>{s.price}</span>
                <div className="mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>Book</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8 space-y-3">
          <button
            className="text-sm font-semibold px-8 py-3 rounded-full transition-all hover:opacity-90"
            style={{ backgroundColor: site.palette.accent, color: isLight ? "#fff" : site.palette.bg }}
          >
            <Calendar size={14} className="inline mr-2" />
            View Full Schedule
          </button>
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
              <Calendar size={10} style={{ color: site.palette.accent }} />
              <span style={{ color: site.palette.accent }}>Online Booking Integration</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
              <Smartphone size={10} style={{ color: site.palette.accent }} />
              <span style={{ color: site.palette.accent }}>SMS Reminders</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicePricingMenu({ site, categories }: { site: SiteType; categories: { name: string; items: { name: string; price: string; note?: string }[] }[] }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 justify-center mb-4">
            <FileText size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Service Menu
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Transparent pricing.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            No surprises at checkout. Consultations are always free.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {categories.map((cat) => (
            <div key={cat.name}>
              <h3 className="text-lg font-semibold mb-4 pb-2" style={{ fontFamily: site.font.heading, borderBottom: `2px solid ${site.palette.accent}40` }}>{cat.name}</h3>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">{item.name}</span>
                      {item.note && <span className="text-xs ml-2" style={{ color: site.palette.muted }}>({item.note})</span>}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: site.palette.accent }}>{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INDUSTRY-SPECIFIC NUANCE SECTIONS (one per site)
   ═══════════════════════════════════════════════════════════════ */

function RestaurantMenu({ site }: { site: SiteType }) {
  const menuItems = [
    { name: "Pan-Seared Lake Perch", desc: "Cornmeal-crusted, lemon butter, roasted fingerlings", price: "$24" },
    { name: "Smoked Whitefish Dip", desc: "House-smoked, grilled sourdough, pickled onion", price: "$14" },
    { name: "Driftwood Burger", desc: "Double smash, aged cheddar, house pickles, brioche", price: "$18" },
    { name: "Grilled Walleye Tacos", desc: "Cilantro slaw, chipotle crema, flour tortillas", price: "$19" },
    { name: "Michigan Cherry Salad", desc: "Mixed greens, dried cherries, goat cheese, candied pecans", price: "$13" },
    { name: "Cedar Plank Salmon", desc: "Maple glaze, wild rice, seasonal vegetables", price: "$28" },
    { name: "Lobster Mac & Cheese", desc: "Maine lobster, four-cheese sauce, herb breadcrumbs", price: "$22" },
    { name: "Seasonal Soup", desc: "Changes weekly. Ask your server.", price: "$9" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Utensils size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              From the Kitchen
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Tonight's favorites.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            Menu changes with the seasons. Ask your server about today's catch.
          </p>
        </div>
        <div className="max-w-2xl mx-auto divide-y" style={{ borderColor: site.palette.border }}>
          {menuItems.map((item) => (
            <div key={item.name} className="flex items-start justify-between py-5 gap-4" style={{ borderColor: site.palette.border }}>
              <div>
                <h3 className="text-base font-semibold mb-1" style={{ fontFamily: site.font.heading }}>{item.name}</h3>
                <p className="text-sm" style={{ color: site.palette.muted }}>{item.desc}</p>
              </div>
              <span className="text-base font-semibold whitespace-nowrap" style={{ color: site.palette.accent }}>{item.price}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs" style={{ color: site.palette.muted }}>
            Full menu available in-house. Gluten-free and vegetarian options marked on request.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
            <Camera size={10} style={{ color: site.palette.accent }} />
            <span style={{ color: site.palette.accent }}>Online Menu with Photos Add-On</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContractorProjects({ site }: { site: SiteType }) {
  const projects = [
    { title: "Norton Shores Kitchen", scope: "Full gut renovation — custom cabinetry, quartz counters, new layout", timeline: "6 weeks", year: "2024", status: "Complete" },
    { title: "Muskegon Lake Deck", scope: "800 sq ft composite deck with built-in bench seating and cable rail", timeline: "3 weeks", year: "2024", status: "Complete" },
    { title: "Heritage Hill Bathroom", scope: "Walk-in shower conversion, heated floors, custom tile work", timeline: "4 weeks", year: "2023", status: "Complete" },
    { title: "Whitehall Basement Finish", scope: "Full basement buildout — bedroom, bathroom, living area, egress window", timeline: "8 weeks", year: "2023", status: "Complete" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Hammer size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Recent Work
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            We let the work talk.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            Before/after photos available on request. We don't stage our job sites.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {projects.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="h-40 overflow-hidden">
                <img src={site.heroImage} alt={p.title} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: idx % 2 === 0 ? "center" : "left" }} />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: site.palette.accent }}>{p.year}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>{p.timeline}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: site.font.heading }}>{p.title}</h3>
                <p className="text-sm" style={{ color: site.palette.muted }}>{p.scope}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SalonStylists({ site }: { site: SiteType }) {
  const stylists = [
    { name: "Aisha T.", specialty: "Creative Color & Balayage", years: 12, clients: "2,400+" },
    { name: "Jordan M.", specialty: "Precision Cuts & Fades", years: 8, clients: "1,800+" },
    { name: "Priya K.", specialty: "Protective Styling & Locs", years: 6, clients: "1,200+" },
    { name: "Camille R.", specialty: "Bridal & Editorial", years: 10, clients: "900+" },
    { name: "Dani L.", specialty: "Vivid Color & Corrective", years: 5, clients: "800+" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Our Team
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Find your person.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            Every stylist has a specialty. Book with whoever matches your vibe.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {stylists.map((s, idx) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="p-5 rounded-xl text-center"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent, fontFamily: site.font.heading }}
              >
                {s.name.charAt(0)}
              </div>
              <h3 className="text-base font-semibold" style={{ fontFamily: site.font.heading }}>{s.name}</h3>
              <p className="text-sm mt-1" style={{ color: site.palette.accent }}>{s.specialty}</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-xs" style={{ color: site.palette.muted }}>{s.years} years</span>
                <span className="text-xs" style={{ color: site.palette.muted }}>&middot;</span>
                <span className="text-xs" style={{ color: site.palette.muted }}>{s.clients} clients</span>
              </div>
              <button
                className="mt-4 text-xs font-semibold px-5 py-2 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: site.palette.accent + "20", color: site.palette.accent, border: `1px solid ${site.palette.accent}30` }}
              >
                Book with {s.name.split(" ")[0]}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GymSchedule({ site }: { site: SiteType }) {
  const schedule = [
    { time: "6:00 AM", mon: "Strength", tue: "HIIT", wed: "Strength", thu: "HIIT", fri: "Strength", sat: "Open Gym" },
    { time: "7:30 AM", mon: "Olympic", tue: "—", wed: "Olympic", thu: "—", fri: "Olympic", sat: "—" },
    { time: "12:00 PM", mon: "HIIT", tue: "Strength", wed: "HIIT", thu: "Strength", fri: "HIIT", sat: "—" },
    { time: "5:30 PM", mon: "Strength", tue: "HIIT", wed: "Strength", thu: "Olympic", fri: "Strength", sat: "—" },
    { time: "7:00 PM", mon: "Open Gym", tue: "Open Gym", wed: "Open Gym", thu: "Open Gym", fri: "—", sat: "—" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              This Week
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Show up. Do the work.
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${site.palette.border}` }}>
                <th className="text-left py-3 px-3 font-medium" style={{ color: site.palette.muted }}>Time</th>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <th key={d} className="text-center py-3 px-3 font-medium" style={{ color: site.palette.muted }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.time} style={{ borderBottom: `1px solid ${site.palette.border}40` }}>
                  <td className="py-3 px-3 font-semibold whitespace-nowrap" style={{ color: site.palette.accent }}>{row.time}</td>
                  {[row.mon, row.tue, row.wed, row.thu, row.fri, row.sat].map((cls, i) => (
                    <td key={i} className="text-center py-3 px-3" style={{ color: cls === "—" ? site.palette.muted + "40" : site.palette.text }}>
                      {cls}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs" style={{ color: site.palette.muted }}>
            All classes capped at 12. First-timers: arrive 10 minutes early. We start on time.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
            <Calendar size={10} style={{ color: site.palette.accent }} />
            <span style={{ color: site.palette.accent }}>Class Schedule Widget Add-On</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrainerBios({ site }: { site: SiteType }) {
  const trainers = [
    { name: "Coach Mike D.", cert: "CSCS, USAW-L2", specialty: "Strength & Olympic Lifting", bio: "Former college football S&C coach. 15 years of coaching experience. Believes in progressive overload and showing up." },
    { name: "Jess T.", cert: "NASM-CPT, Precision Nutrition L1", specialty: "HIIT & Nutrition", bio: "Ran her first marathon at 19. Coaches HIIT and helps members dial in their nutrition without counting every calorie." },
    { name: "Marcus W.", cert: "USAW-L1, CrossFit-L2", specialty: "Olympic Lifting & Mobility", bio: "Competed nationally in weightlifting. Coaches technique-first — every rep matters, especially the ugly ones." },
  ];

  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Our Coaches
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            The people behind the programming.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {trainers.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-6 rounded-xl text-center"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>
                {t.name.charAt(0)}
              </div>
              <h3 className="text-base font-semibold" style={{ fontFamily: site.font.heading }}>{t.name}</h3>
              <p className="text-xs mt-1 font-medium" style={{ color: site.palette.accent }}>{t.specialty}</p>
              <p className="text-[10px] mt-1" style={{ color: site.palette.muted }}>{t.cert}</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: site.palette.muted }}>{t.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MembershipPricing({ site }: { site: SiteType }) {
  const plans = [
    { name: "Drop-In", price: "$20", period: "per class", features: ["Any single class", "No commitment", "Great for travelers"] },
    { name: "Unlimited", price: "$149", period: "/month", features: ["All classes", "Open gym access", "Programming app", "Community events"], highlight: true },
    { name: "Couples", price: "$249", period: "/month", features: ["2 memberships", "All classes", "Open gym access", "10% off merch"] },
  ];

  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Award size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Membership
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Simple pricing. No contracts.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {plans.map((p, idx) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-6 rounded-xl text-center"
              style={{
                backgroundColor: site.palette.card,
                border: p.highlight ? `2px solid ${site.palette.accent}` : `1px solid ${site.palette.border}`,
              }}
            >
              {p.highlight && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block" style={{ backgroundColor: site.palette.accent + "20", color: site.palette.accent }}>Most Popular</span>
              )}
              <h3 className="text-lg font-semibold" style={{ fontFamily: site.font.heading }}>{p.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold" style={{ color: site.palette.accent }}>{p.price}</span>
                <span className="text-sm" style={{ color: site.palette.muted }}>{p.period}</span>
              </div>
              <div className="space-y-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 justify-center">
                    <Check size={12} style={{ color: site.palette.accent }} />
                    <span className="text-sm" style={{ color: site.palette.muted }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className="mt-5 w-full text-sm font-semibold py-2.5 rounded-full transition-all hover:opacity-90"
                style={{
                  backgroundColor: p.highlight ? site.palette.accent : "transparent",
                  color: p.highlight ? site.palette.bg : site.palette.accent,
                  border: `1px solid ${site.palette.accent}`,
                }}
              >
                {p.name === "Drop-In" ? "Buy a Class" : "Join Now"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BoutiqueArrivals({ site }: { site: SiteType }) {
  const arrivals = [
    { name: "Hand-Thrown Ceramic Mug", maker: "Lakeshore Pottery Co.", price: "$38", tag: "New" },
    { name: "Linen Throw Blanket", maker: "Midwest Textile Studio", price: "$85", tag: "Bestseller" },
    { name: "Pressed Flower Earrings", maker: "Wildflower & Fern", price: "$42", tag: "New" },
    { name: "Soy Candle — Sleeping Bear", maker: "Northwoods Wax Co.", price: "$28", tag: "Staff Pick" },
    { name: "Letterpress Card Set", maker: "Harbor Press", price: "$22", tag: "New" },
    { name: "Woven Market Tote", maker: "Great Lakes Goods", price: "$64", tag: "Limited" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingBag size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Just Arrived
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            New on the shelves.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            Updated monthly. Everything ships or can be picked up in-store.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {arrivals.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="p-5 rounded-xl"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-4">
                <img src={site.heroImage} alt={item.name} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: ["center", "left", "right", "top", "bottom", "center"][idx] }} />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>{item.tag}</span>
                <span className="text-base font-semibold" style={{ color: site.palette.accent }}>{item.price}</span>
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: site.font.heading }}>{item.name}</h3>
              <p className="text-xs" style={{ color: site.palette.muted }}>by {item.maker}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftCardSection({ site }: { site: SiteType }) {
  const isLight = site.slug === "clover-and-thistle";
  return (
    <section className="py-16 lg:py-20" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-2xl text-center" style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}>
          <Gift size={28} style={{ color: site.palette.accent }} className="mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl leading-tight mb-3" style={{ fontFamily: site.font.heading }}>
            Give something they'll actually love.
          </h2>
          <p className="text-sm mb-6" style={{ color: site.palette.muted }}>
            Digital gift cards from $25 to $200. Delivered instantly by email. Redeemable in-store or online.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {["$25", "$50", "$75", "$100", "$200"].map((amt) => (
              <button key={amt} className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:opacity-80" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent, border: `1px solid ${site.palette.accent}30` }}>
                {amt}
              </button>
            ))}
          </div>
          <button className="text-sm font-semibold px-8 py-3 rounded-full transition-all hover:opacity-90" style={{ backgroundColor: site.palette.accent, color: isLight ? "#fff" : site.palette.bg }}>
            Buy a Gift Card
          </button>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
            <Gift size={10} style={{ color: site.palette.accent }} />
            <span style={{ color: site.palette.accent }}>Gift Card System Add-On</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoffeeProducts({ site }: { site: SiteType }) {
  const products = [
    { name: "Morning Light Blend", origin: "Colombia & Ethiopia", notes: "Citrus, honey, brown sugar", size: "12oz", price: "$18", badge: "Bestseller" },
    { name: "Lakeshore Dark", origin: "Sumatra & Brazil", notes: "Dark chocolate, cedar, molasses", size: "12oz", price: "$18", badge: "" },
    { name: "Sleeping Bear", origin: "Guatemala", notes: "Caramel, walnut, dried cherry", size: "12oz", price: "$20", badge: "Staff Pick" },
    { name: "Single Origin — Yirgacheffe", origin: "Ethiopia", notes: "Blueberry, jasmine, bergamot", size: "12oz", price: "$22", badge: "Limited" },
    { name: "Single Origin — Huila", origin: "Colombia", notes: "Red apple, toffee, milk chocolate", size: "12oz", price: "$21", badge: "" },
    { name: "Cold Brew Concentrate", origin: "House Blend", notes: "Makes 8 cups. Dilute 1:1.", size: "32oz", price: "$16", badge: "" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              Shop Coffee
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: site.font.heading }}>
            Roasted to order. Every bag.
          </h2>
          <p className="text-sm mt-3" style={{ color: site.palette.muted }}>
            We don't roast ahead. Your bag gets roasted the day it ships.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {products.map((p, idx) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="h-40 overflow-hidden relative">
                <img src={site.heroImage} alt={p.name} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: ["center", "left", "right", "top", "bottom", "center"][idx] }} />
                {p.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent, color: site.palette.bg }}>{p.badge}</span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: site.palette.muted }}>{p.origin}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>{p.size}</span>
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ fontFamily: site.font.heading }}>{p.name}</h3>
                <p className="text-sm mb-4" style={{ color: site.palette.muted }}>{p.notes}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: site.palette.accent }}>{p.price}</span>
                  <button className="text-xs font-semibold px-4 py-2 rounded-full transition-all hover:opacity-80" style={{ backgroundColor: site.palette.accent, color: site.palette.bg }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8 space-y-3">
          <div className="inline-flex items-center gap-4 text-xs" style={{ color: site.palette.muted }}>
            <span className="flex items-center gap-1"><Truck size={12} /> Free shipping on orders $50+</span>
            <span className="flex items-center gap-1"><CreditCard size={12} /> Secure checkout</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
              <ShoppingBag size={10} style={{ color: site.palette.accent }} />
              <span style={{ color: site.palette.accent }}>Ecommerce Store Add-On</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
              <Package size={10} style={{ color: site.palette.accent }} />
              <span style={{ color: site.palette.accent }}>Product Catalog</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubscriptionSection({ site }: { site: SiteType }) {
  return (
    <section className="py-20 lg:py-24" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 lg:p-12 rounded-2xl" style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Package size={16} style={{ color: site.palette.accent }} />
              <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
                Coffee Club
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl leading-tight mb-4" style={{ fontFamily: site.font.heading }}>
              Never run out again.
            </h2>
            <p className="text-base mb-8" style={{ color: site.palette.muted }}>
              Choose your beans, pick your frequency, and we'll handle the rest. Skip or cancel anytime — no contracts, no commitments.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl" style={{ backgroundColor: site.palette.bg, border: `1px solid ${site.palette.border}` }}>
                <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: site.font.heading }}>The Explorer</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: site.palette.accent }}>$16<span className="text-sm font-normal" style={{ color: site.palette.muted }}>/mo</span></p>
                <p className="text-sm" style={{ color: site.palette.muted }}>12oz bag, rotating single origins, every 2 weeks</p>
              </div>
              <div className="p-5 rounded-xl" style={{ backgroundColor: site.palette.bg, border: `2px solid ${site.palette.accent}` }}>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 inline-block" style={{ backgroundColor: site.palette.accent + "20", color: site.palette.accent }}>Best Value</span>
                <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: site.font.heading }}>The Regular</h3>
                <p className="text-2xl font-bold mb-1" style={{ color: site.palette.accent }}>$28<span className="text-sm font-normal" style={{ color: site.palette.muted }}>/mo</span></p>
                <p className="text-sm" style={{ color: site.palette.muted }}>2lb bag, your choice of blend, every 2 or 4 weeks</p>
              </div>
            </div>
            <button className="text-sm font-semibold px-8 py-3 rounded-full transition-all hover:opacity-90" style={{ backgroundColor: site.palette.accent, color: site.palette.bg }}>
              Start My Subscription
            </button>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px]" style={{ backgroundColor: site.palette.accent + "10", border: `1px solid ${site.palette.accent}25` }}>
              <Package size={10} style={{ color: site.palette.accent }} />
              <span style={{ color: site.palette.accent }}>Subscription Management Add-On</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShippingInfo({ site }: { site: SiteType }) {
  const policies = [
    { icon: Truck, title: "Free Shipping", desc: "On all orders over $50. Standard delivery 3-5 business days." },
    { icon: Package, title: "Roast-to-Order", desc: "Every bag is roasted the day it ships. Roast date printed on every label." },
    { icon: CreditCard, title: "Secure Checkout", desc: "256-bit SSL encryption. We accept all major cards and Apple Pay." },
    { icon: Mail, title: "Tracking Included", desc: "Get a tracking number by email as soon as your order ships." },
  ];

  return (
    <section className="py-16 lg:py-20" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {policies.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="text-center"
            >
              <p.icon size={24} style={{ color: site.palette.accent }} className="mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold mb-1">{p.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: site.palette.muted }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION ROUTER — decides which sections each site gets
   based on its package tier
   ═══════════════════════════════════════════════════════════════ */

function TierSections({ site }: { site: SiteType }) {
  const slug = site.slug;

  /* ── STARTER: Hammerstone Builds ── */
  if (slug === "hammerstone-builds") {
    return (
      <>
        <ContractorProjects site={site} />
        <ContactFormSection
          site={site}
          title="Get a quote."
          subtitle="Tell us what you need. Attach photos if you have them. We'll get back to you within 24 hours with a straight answer — not a sales pitch."
          buttonText="Request a Quote"
          fields={[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "Project Type", type: "text", placeholder: "Kitchen remodel, deck build, etc." },
            { label: "Project Description", type: "textarea", placeholder: "Tell us what you're thinking. Budget range, timeline, anything helps." },
            { label: "Photos (optional)", type: "file", placeholder: "Upload photos of the space" },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Monday – Friday", time: "7:00 AM – 5:00 PM" },
            { day: "Saturday", time: "8:00 AM – 12:00 PM" },
            { day: "Sunday", time: "Closed" },
          ]}
          mapNote="We serve Muskegon County, Ottawa County, and the lakeshore. If you're within 45 minutes, we'll come to you."
        />
      </>
    );
  }

  /* ── GROWTH: Driftwood Kitchen ── */
  if (slug === "driftwood-kitchen") {
    return (
      <>
        <RestaurantMenu site={site} />
        <ReviewsSection
          site={site}
          reviews={[
            { name: "Sarah M.", rating: 5, text: "The walleye tacos are unreal. We drive 45 minutes just for those. The lakeside seating at sunset is worth the trip alone.", date: "Mar 2025" },
            { name: "Dave & Karen L.", rating: 5, text: "Had our anniversary dinner here. The perch was perfectly cooked, and the staff made us feel like regulars even though it was our first time.", date: "Feb 2025" },
            { name: "Mike T.", rating: 5, text: "Best burger on the lakeshore, hands down. The smoked whitefish dip is also a must. Casual enough for kids, nice enough for date night.", date: "Jan 2025" },
            { name: "Jen R.", rating: 4, text: "Great food, great views. Only reason it's not 5 stars is the wait on Saturdays — but that's because everyone knows how good it is.", date: "Dec 2024" },
            { name: "Chris P.", rating: 5, text: "Catered our company holiday party. 60 people, and every single dish was perfect. Tom and Linda run a tight ship.", date: "Dec 2024" },
            { name: "Amanda W.", rating: 5, text: "The cedar plank salmon changed my life. I don't even like salmon. Or I didn't, until this.", date: "Nov 2024" },
          ]}
        />
        <ContactFormSection
          site={site}
          title="Make a reservation."
          subtitle="For parties of 6 or more, or private events, fill out the form below. For smaller parties, just walk in — we'll find you a spot."
          buttonText="Request Reservation"
          fields={[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "Party Size", type: "text", placeholder: "Number of guests" },
            { label: "Preferred Date & Time", type: "text", placeholder: "e.g., Saturday 7pm" },
            { label: "Special Requests", type: "textarea", placeholder: "Allergies, celebrations, seating preferences..." },
          ]}
        />
        <BlogPreview
          site={site}
          posts={[
            { title: "Spring Menu Preview: What's New This Season", excerpt: "Morel mushrooms are back, and so is our grilled asparagus plate. Here's what's changing on the menu this April.", date: "Apr 2025", category: "Menu" },
            { title: "Behind the Catch: Our Local Fish Suppliers", excerpt: "We source 80% of our fish from Lake Michigan. Meet the fishermen who make our menu possible.", date: "Mar 2025", category: "Story" },
            { title: "5 Michigan Wines That Pair With Everything", excerpt: "You don't need to go to Napa. These five Michigan wines pair perfectly with our most popular dishes.", date: "Feb 2025", category: "Drinks" },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Monday", time: "Closed" },
            { day: "Tuesday – Thursday", time: "4:00 PM – 9:00 PM" },
            { day: "Friday – Saturday", time: "11:30 AM – 10:00 PM" },
            { day: "Sunday", time: "11:30 AM – 8:00 PM" },
          ]}
          mapNote="Waterfront seating available seasonally (May–October). Indoor seating year-round. Parking lot on-site."
        />
      </>
    );
  }

  /* ── GROWTH: Gritmill Fitness ── */
  if (slug === "gritmill-fitness") {
    return (
      <>
        <GymSchedule site={site} />
        <TrainerBios site={site} />
        <MembershipPricing site={site} />
        <ReviewsSection
          site={site}
          reviews={[
            { name: "Jake S.", rating: 5, text: "I've been to every gym in Holland. This is the only one where the coaches actually know your name and fix your form. No ego, just work.", date: "Mar 2025" },
            { name: "Rachel M.", rating: 5, text: "I was intimidated to try Olympic lifting. Marcus made it approachable. Six months in and I'm snatching my bodyweight.", date: "Feb 2025" },
            { name: "Tom D.", rating: 5, text: "The 6am crew is the best part of my day. Small classes, great coaching, and nobody judges you for being slow. They just push you to be less slow.", date: "Jan 2025" },
            { name: "Bri K.", rating: 4, text: "Wish they had more evening class times, but the quality of coaching makes up for it. Jess's HIIT classes are no joke.", date: "Dec 2024" },
            { name: "Carlos R.", rating: 5, text: "Dropped 30 pounds in 4 months. Didn't do a single minute of cardio. Just showed up, lifted heavy, and listened to Coach Mike.", date: "Nov 2024" },
            { name: "Megan L.", rating: 5, text: "My husband and I do the couples membership. Best money we spend every month. The community here is real.", date: "Oct 2024" },
          ]}
        />
        <ContactFormSection
          site={site}
          title="Try a free class."
          subtitle="No sales pitch. No commitment. Just show up, do the work, and see if it's for you. Fill out the form and we'll save you a spot."
          buttonText="Claim My Free Class"
          fields={[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "Preferred Class", type: "text", placeholder: "Strength, HIIT, or Olympic Lifting" },
            { label: "Preferred Day/Time", type: "text", placeholder: "e.g., Monday 6am" },
          ]}
        />
        <BlogPreview
          site={site}
          posts={[
            { title: "Why We Don't Do Cardio Machines", excerpt: "No treadmills. No ellipticals. Here's why — and what we do instead to build real conditioning.", date: "Apr 2025", category: "Training" },
            { title: "The Beginner's Guide to Olympic Lifting", excerpt: "You don't need to be strong to start. You need to be coachable. Here's what your first month looks like.", date: "Mar 2025", category: "Guide" },
            { title: "Meal Prep for People Who Hate Meal Prep", excerpt: "Jess breaks down her 30-minute Sunday prep that fuels the whole week. No tupperware empire required.", date: "Feb 2025", category: "Nutrition" },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Monday – Friday", time: "5:30 AM – 8:00 PM" },
            { day: "Saturday", time: "7:00 AM – 11:00 AM" },
            { day: "Sunday", time: "Open Gym 8:00 AM – 12:00 PM" },
          ]}
          mapNote="Located in the converted warehouse on 8th Street. Parking in the back lot. Look for the black door."
        />
      </>
    );
  }

  /* ── PRO: Velvet & Vine Studio ── */
  if (slug === "velvet-vine-studio") {
    return (
      <>
        <SalonStylists site={site} />
        <BookingWidget site={site} />
        <ServicePricingMenu
          site={site}
          categories={[
            {
              name: "Cuts & Styling",
              items: [
                { name: "Women's Cut & Style", price: "$75+" },
                { name: "Men's Cut", price: "$40" },
                { name: "Children's Cut (12 & under)", price: "$30" },
                { name: "Blowout", price: "$55" },
                { name: "Special Occasion Updo", price: "$85+" },
              ],
            },
            {
              name: "Color",
              items: [
                { name: "Single Process Color", price: "$95+" },
                { name: "Root Touch-Up", price: "$120+" },
                { name: "Partial Highlights", price: "$150+" },
                { name: "Full Balayage", price: "$250+", note: "3+ hours" },
                { name: "Vivid / Fashion Color", price: "$200+", note: "consultation required" },
                { name: "Corrective Color", price: "$300+", note: "consultation required" },
              ],
            },
            {
              name: "Protective Styling",
              items: [
                { name: "Silk Press", price: "$85+" },
                { name: "Box Braids", price: "$200+", note: "4-6 hours" },
                { name: "Locs Maintenance", price: "$120+" },
                { name: "Twist Out", price: "$75+" },
              ],
            },
            {
              name: "Bridal & Events",
              items: [
                { name: "Bridal Trial", price: "$150" },
                { name: "Wedding Day Hair", price: "$200+" },
                { name: "Bridesmaid", price: "$85+" },
                { name: "Prom / Formal", price: "$95+" },
              ],
            },
          ]}
        />
        <ReviewsSection
          site={site}
          reviews={[
            { name: "Mia K.", rating: 5, text: "Aisha did my balayage and I've never gotten more compliments in my life. She actually listened to what I wanted instead of doing her own thing.", date: "Mar 2025" },
            { name: "Lauren T.", rating: 5, text: "I've been going to Priya for my locs for two years. She's careful, she's patient, and she never rushes. Worth every penny.", date: "Feb 2025" },
            { name: "James R.", rating: 5, text: "Jordan gives the best fade in Grand Rapids. Period. I've tried everywhere else. This is the spot.", date: "Jan 2025" },
            { name: "Nadia S.", rating: 5, text: "Camille did my wedding hair and my bridesmaids'. Everyone looked incredible. She even came early to make sure we weren't stressed.", date: "Dec 2024" },
            { name: "Tara M.", rating: 4, text: "Beautiful space, amazing stylists. Only wish they had more weekend availability — but I get it, they're always booked.", date: "Nov 2024" },
            { name: "Devon C.", rating: 5, text: "Dani fixed a color disaster from another salon. Took 4 hours but my hair has never looked better. Honest, skilled, and kind.", date: "Oct 2024" },
          ]}
        />
        <InstagramFeed site={site} />
        <BlogPreview
          site={site}
          posts={[
            { title: "How to Make Your Balayage Last Longer", excerpt: "Purple shampoo isn't the only answer. Here are 5 things you can do at home to keep your color fresh between appointments.", date: "Apr 2025", category: "Hair Care" },
            { title: "Meet Dani: Our Newest Stylist", excerpt: "Dani specializes in vivid color and corrective work. Learn about her journey from cosmetology school to our chair.", date: "Mar 2025", category: "Team" },
            { title: "The Truth About Heat Damage", excerpt: "Yes, you can still use a flat iron. But there are rules. Priya breaks down what actually causes damage and how to prevent it.", date: "Feb 2025", category: "Tips" },
          ]}
        />
        <ContactFormSection
          site={site}
          title="Questions? Reach out."
          subtitle="Not sure which service you need? Want to check availability? Send us a message and we'll get back to you within a few hours."
          buttonText="Send Message"
          fields={[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "What can we help with?", type: "textarea", placeholder: "Tell us what you're looking for..." },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Monday", time: "Closed" },
            { day: "Tuesday – Friday", time: "9:00 AM – 7:00 PM" },
            { day: "Saturday", time: "9:00 AM – 4:00 PM" },
            { day: "Sunday", time: "Closed" },
          ]}
          mapNote="Located in the heart of Grand Rapids, Wealthy Street corridor. Street parking available. Look for the gold door."
        />
      </>
    );
  }

  /* ── PRO: Clover & Thistle ── */
  if (slug === "clover-and-thistle") {
    return (
      <>
        <BoutiqueArrivals site={site} />
        <GiftCardSection site={site} />
        <ReviewsSection
          site={site}
          reviews={[
            { name: "Amy L.", rating: 5, text: "This is my favorite shop in Saugatuck. Everything is curated so thoughtfully — I always find something I didn't know I needed.", date: "Mar 2025" },
            { name: "Rachel K.", rating: 5, text: "Bought a gift box for my sister's birthday and she cried. The packaging alone is worth it. These women know what they're doing.", date: "Feb 2025" },
            { name: "Mark & Julie H.", rating: 5, text: "We buy all our hostess gifts here. The candles, the ceramics — everything feels special without being pretentious.", date: "Jan 2025" },
            { name: "Danielle P.", rating: 5, text: "The wreath-making workshop was so fun. Emma walked us through every step and we left with something actually beautiful. Not a Pinterest fail.", date: "Dec 2024" },
            { name: "Sarah T.", rating: 4, text: "Wish they were open more days! But I understand — it's a small team. Thursday through Sunday, plan accordingly.", date: "Nov 2024" },
            { name: "Liz M.", rating: 5, text: "The pressed flower earrings are stunning. I get compliments every time I wear them. Already ordered a second pair.", date: "Oct 2024" },
          ]}
        />
        <InstagramFeed site={site} />
        <NewsletterSection
          site={site}
          headline="First to know."
          sub="New arrivals, workshop announcements, and maker spotlights. Delivered to your inbox once a month. No spam, ever."
        />
        <BlogPreview
          site={site}
          posts={[
            { title: "Meet the Maker: Lakeshore Pottery Co.", excerpt: "Every mug in our shop is thrown by hand in Ludington. Meet the potter behind our bestselling ceramics.", date: "Apr 2025", category: "Maker" },
            { title: "Spring Gift Guide: Under $50", excerpt: "Candles, cards, jewelry, and small treasures — all under $50, all made by independent artists.", date: "Mar 2025", category: "Guide" },
            { title: "How We Choose What We Carry", excerpt: "We say no to 90% of what we're pitched. Here's what makes the cut — and why it matters.", date: "Feb 2025", category: "Story" },
          ]}
        />
        <ContactFormSection
          site={site}
          title="Say hello."
          subtitle="Looking for something specific? Want to carry your work in our shop? Planning a private workshop? We'd love to hear from you."
          buttonText="Send Message"
          fields={[
            { label: "Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "What's on your mind?", type: "textarea", placeholder: "Tell us what you're looking for..." },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Monday – Wednesday", time: "Closed" },
            { day: "Thursday – Friday", time: "11:00 AM – 6:00 PM" },
            { day: "Saturday", time: "10:00 AM – 7:00 PM" },
            { day: "Sunday", time: "11:00 AM – 5:00 PM" },
          ]}
          mapNote="Downtown Saugatuck on Butler Street. Look for the sage green awning. Free parking on the street."
        />
      </>
    );
  }

  /* ── COMMERCE: Ember & Oak Coffee ── */
  if (slug === "ember-oak-coffee") {
    return (
      <>
        <CoffeeProducts site={site} />
        <SubscriptionSection site={site} />
        <ShippingInfo site={site} />
        <ReviewsSection
          site={site}
          reviews={[
            { name: "Jason K.", rating: 5, text: "Morning Light is the best blend I've ever had. I've tried Blue Bottle, Counter Culture, Onyx — this is better. And it's from Michigan.", date: "Mar 2025" },
            { name: "Stephanie R.", rating: 5, text: "The coffee club is the best subscription I have. Every bag arrives fresh, and the rotating single origins keep it interesting.", date: "Feb 2025" },
            { name: "Mark D.", rating: 5, text: "Ordered the Yirgacheffe on a whim. Blueberry and jasmine in a coffee? I was skeptical. Now I'm a convert.", date: "Jan 2025" },
            { name: "Lisa & Tom W.", rating: 5, text: "We switched our office coffee to Ember & Oak. Productivity went up. Morale went up. The old Keurig went in the trash.", date: "Dec 2024" },
            { name: "Chris M.", rating: 4, text: "Great coffee, great packaging, great story. Only wish they had a decaf option. (Hint hint, Ben.)", date: "Nov 2024" },
            { name: "Andrea P.", rating: 5, text: "Bought the cold brew concentrate for a camping trip. Best camp coffee I've ever had. No filter, no fuss, just pour and dilute.", date: "Oct 2024" },
          ]}
        />
        <BlogPreview
          site={site}
          posts={[
            { title: "The Perfect Pour-Over: A Step-by-Step Guide", excerpt: "You don't need a $300 setup. Here's how to make great pour-over coffee with a $15 dripper and a kitchen scale.", date: "Apr 2025", category: "Brewing" },
            { title: "Origin Story: Our Guatemala Relationship", excerpt: "We've been buying from the same farm in Huehuetenango for 4 years. Here's how that relationship started.", date: "Mar 2025", category: "Origin" },
            { title: "Why Roast Date Matters More Than 'Best By'", excerpt: "That bag of grocery store coffee? It was roasted 6 months ago. Here's why freshness changes everything.", date: "Feb 2025", category: "Education" },
          ]}
        />
        <NewsletterSection
          site={site}
          headline="Fresh drops. Straight to your inbox."
          sub="New origins, limited releases, and brewing tips. Once a month. No spam — just coffee."
        />
        <ContactFormSection
          site={site}
          title="Wholesale inquiries."
          subtitle="We supply cafes, restaurants, and offices across Michigan. Minimum 10lb orders. Tell us about your business and we'll send you samples."
          buttonText="Submit Inquiry"
          fields={[
            { label: "Business Name", type: "text", placeholder: "Your business name" },
            { label: "Contact Name", type: "text", placeholder: "Your name" },
            { label: "Email", type: "email", placeholder: "your@email.com" },
            { label: "Monthly Volume (estimated)", type: "text", placeholder: "e.g., 20-50 lbs/month" },
            { label: "Tell us about your business", type: "textarea", placeholder: "What kind of business? How many locations? Current coffee setup?" },
          ]}
        />
        <LocationSection
          site={site}
          hours={[
            { day: "Roastery (not open to public)", time: "Mon–Fri 6am–2pm" },
            { day: "Online Store", time: "24/7" },
            { day: "Local Pickup (Traverse City)", time: "Fri 10am–2pm" },
          ]}
          mapNote="We're a roastery, not a cafe. Online orders ship within 24 hours. Local pickup available Fridays at our Traverse City location."
        />
      </>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ShowroomSite() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const site = showroomSites.find((s) => s.slug === slug);

  if (!site) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-off-white mb-4">
            Sample site not found
          </h1>
          <Button
            variant="outline"
            className="border-off-white/20 text-off-white rounded-full"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to MiniMorph
          </Button>
        </div>
      </div>
    );
  }

  const isLight = site.slug === "clover-and-thistle";

  /* Build nav items based on tier */
  const navItems = ["About", "Services"];
  if (site.tier === "Growth" || site.tier === "Pro" || site.tier === "Commerce") navItems.push("Blog");
  if (site.tier === "Pro" || site.tier === "Commerce") navItems.push("Reviews");
  if (site.tier === "Commerce") navItems.push("Shop");
  navItems.push("Contact");

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: site.palette.bg,
        color: site.palette.text,
        fontFamily: site.font.body,
      }}
    >
      {/* MiniMorph Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-midnight/95 backdrop-blur-xl border-b border-electric/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-sm font-sans text-off-white/60 hover:text-off-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to MiniMorph</span>
            </button>
            <span className="text-off-white/20">|</span>
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-electric" />
              <span className="text-xs font-sans text-off-white/50">
                Showroom Demo — This is a sample site, not a real business
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline text-xs font-sans px-2.5 py-1 rounded-full border"
              style={{
                borderColor: site.palette.accent + "40",
                color: site.palette.accent,
                backgroundColor: site.palette.accent + "10",
              }}
            >
              {site.tier} — {site.tierPrice}
            </span>
            <Button
              size="sm"
              className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-xs px-4 rounded-full h-8"
              onClick={() => setLocation("/get-started")}
            >
              Build Mine
              <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sample Site Navbar */}
      <nav
        className="pt-12"
        style={{ borderBottom: `1px solid ${site.palette.border}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: site.font.heading, color: site.palette.text }}
          >
            {site.name}
          </span>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <span
                key={item}
                className="text-sm cursor-default"
                style={{ color: site.palette.muted }}
              >
                {item}
              </span>
            ))}
          </div>
          <button
            className="text-sm font-semibold px-5 py-2 rounded-full transition-all hover:opacity-90"
            style={{
              backgroundColor: site.palette.accent,
              color: isLight ? "#fff" : site.palette.bg,
            }}
          >
            {site.sections.cta}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${site.heroImage})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isLight
              ? `linear-gradient(to bottom, ${site.palette.bg}cc, ${site.palette.bg}ee)`
              : `linear-gradient(to bottom, ${site.palette.bg}cc, ${site.palette.bg}f0)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div
              className="flex items-center gap-2 text-sm mb-6"
              style={{ color: site.palette.muted }}
            >
              <MapPin size={14} />
              <span>{site.location}</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6"
              style={{ fontFamily: site.font.heading }}
            >
              {site.sections.hero.headline}
            </h1>
            <p
              className="text-lg sm:text-xl leading-relaxed mb-8 max-w-lg"
              style={{ color: site.palette.muted }}
            >
              {site.sections.hero.sub}
            </p>
            <button
              className="text-base font-semibold px-8 py-3.5 rounded-full transition-all hover:opacity-90"
              style={{
                backgroundColor: site.palette.accent,
                color: isLight ? "#fff" : site.palette.bg,
              }}
            >
              {site.sections.cta}
              <ArrowRight size={16} className="inline ml-2" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section
        className="py-20 lg:py-28"
        style={{ borderBottom: `1px solid ${site.palette.border}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span
                className="text-sm font-medium uppercase tracking-widest mb-4 block"
                style={{ color: site.palette.accent }}
              >
                Our Story
              </span>
              <h2
                className="text-3xl sm:text-4xl leading-tight mb-6"
                style={{ fontFamily: site.font.heading }}
              >
                {site.tagline}
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: site.palette.muted }}
              >
                {site.sections.about}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden aspect-[4/3]"
            >
              <img
                src={site.heroImage}
                alt={site.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ★ All tier-specific sections ★ */}
      <TierSections site={site} />

      {/* Services */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="text-sm font-medium uppercase tracking-widest mb-4 block"
              style={{ color: site.palette.accent }}
            >
              What We Offer
            </span>
            <h2
              className="text-3xl sm:text-4xl leading-tight"
              style={{ fontFamily: site.font.heading }}
            >
              {site.industry === "Coffee Roaster / Ecommerce"
                ? "Our Coffee"
                : site.industry === "Restaurant"
                  ? "How to Enjoy Us"
                  : "Our Services"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {site.sections.services.map((svc, idx) => (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: site.palette.card,
                  border: `1px solid ${site.palette.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: site.palette.accent + "15" }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: site.font.heading,
                      color: site.palette.accent,
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ fontFamily: site.font.heading }}
                >
                  {svc.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: site.palette.muted }}>
                  {svc.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section
        className="py-20 lg:py-28"
        style={{
          backgroundColor: isLight ? "#f0ede8" : site.palette.card,
          borderTop: `1px solid ${site.palette.border}`,
          borderBottom: `1px solid ${site.palette.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="text-sm font-medium uppercase tracking-widest mb-4 block"
              style={{ color: site.palette.accent }}
            >
              Gallery
            </span>
            <h2
              className="text-3xl sm:text-4xl leading-tight"
              style={{ fontFamily: site.font.heading }}
            >
              See for yourself.
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl overflow-hidden aspect-[4/3]"
              >
                <img
                  src={site.heroImage}
                  alt={`${site.name} gallery ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: ["center", "left", "right", "top", "bottom", "center"][i],
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6"
            style={{ fontFamily: site.font.heading }}
          >
            {site.sections.hero.headline}
          </h2>
          <p
            className="text-lg leading-relaxed mb-8"
            style={{ color: site.palette.muted }}
          >
            {site.sections.hero.sub}
          </p>
          <button
            className="text-base font-semibold px-10 py-4 rounded-full transition-all hover:opacity-90"
            style={{
              backgroundColor: site.palette.accent,
              color: isLight ? "#fff" : site.palette.bg,
            }}
          >
            {site.sections.cta}
          </button>
        </div>
      </section>

      {/* Sample Site Footer */}
      <footer
        className="py-12"
        style={{
          backgroundColor: isLight ? "#e8e5e0" : site.palette.card,
          borderTop: `1px solid ${site.palette.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span
              className="text-lg font-bold"
              style={{ fontFamily: site.font.heading }}
            >
              {site.name}
            </span>
            <div className="flex items-center gap-2 text-sm" style={{ color: site.palette.muted }}>
              <MapPin size={14} />
              <span>{site.location}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MiniMorph Attribution Panel */}
      <div className="bg-midnight border-t border-electric/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Left — What this demo shows */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-electric/15 flex items-center justify-center border border-electric/20">
                  <span className="text-electric text-xs font-bold font-sans">
                    M
                  </span>
                </div>
                <span className="font-serif text-lg text-off-white">
                  Built by MiniMorph
                </span>
              </div>
              <p className="text-sm font-sans text-off-white/50 leading-relaxed mb-4">
                {site.personality}
              </p>
              <div className="p-4 rounded-xl bg-off-white/5 border border-off-white/10 mb-4">
                <p className="text-sm font-sans text-off-white/60 italic">
                  &ldquo;{site.ownerQuote}&rdquo;
                </p>
                <p className="text-xs font-sans text-off-white/40 mt-2">
                  &mdash; {site.ownerName}, {site.name}
                </p>
              </div>
              <p className="text-[10px] font-sans text-off-white/25">
                This is a fictional sample site created to demonstrate MiniMorph
                capabilities. Business names, quotes, and details are
                illustrative only.
              </p>
            </div>

            {/* Right — Package breakdown */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} className="text-electric" />
                <span className="text-sm font-sans font-semibold text-off-white/80">
                  What&apos;s in this build
                </span>
              </div>
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-bold"
                  style={{
                    backgroundColor: site.palette.accent + "20",
                    color: site.palette.accent,
                    border: `1px solid ${site.palette.accent}40`,
                  }}
                >
                  <Star size={10} />
                  {site.tier} Plan — {site.tierPrice}
                </span>
              </div>
              <div className="space-y-2 mb-5">
                {site.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="text-electric shrink-0 mt-0.5"
                    />
                    <span className="text-sm font-sans text-off-white/60">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              {site.addOns.length > 0 && (
                <div>
                  <span className="text-xs font-sans font-semibold text-off-white/50 uppercase tracking-wider mb-2 block">
                    Add-ons showcased
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {site.addOns.map((a) => (
                      <span
                        key={a}
                        className="text-xs font-sans text-off-white/50 px-2.5 py-1 rounded-full border border-off-white/10 bg-off-white/5"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-sm px-6 rounded-full"
                  onClick={() => setLocation("/get-started")}
                >
                  Build Something Like This
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
                <Button
                  variant="outline"
                  className="border-off-white/20 text-off-white hover:bg-off-white/5 font-sans text-sm px-6 rounded-full"
                  onClick={() => {
                    setLocation("/");
                    setTimeout(() => {
                      const el = document.querySelector("#showroom");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  <ExternalLink size={14} className="mr-1.5" />
                  View All Demos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
