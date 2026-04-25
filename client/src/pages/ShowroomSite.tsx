/**
 * ShowroomSite — renders a full sample site page for each showroom entry.
 * Each site has its own color palette, typography, hero image, personality,
 * AND a unique nuance section that makes it feel like a real business website.
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Industry-specific nuance sections ── */

function RestaurantMenu({ site }: { site: SiteType }) {
  const menuItems = [
    { name: "Pan-Seared Lake Perch", desc: "Cornmeal-crusted, lemon butter, roasted fingerlings", price: "$24" },
    { name: "Smoked Whitefish Dip", desc: "House-smoked, grilled sourdough, pickled onion", price: "$14" },
    { name: "Lakehouse Burger", desc: "Double smash, aged cheddar, house pickles, brioche", price: "$18" },
    { name: "Grilled Walleye Tacos", desc: "Cilantro slaw, chipotle crema, flour tortillas", price: "$19" },
    { name: "Michigan Cherry Salad", desc: "Mixed greens, dried cherries, goat cheese, candied pecans", price: "$13" },
    { name: "Cedar Plank Salmon", desc: "Maple glaze, wild rice, seasonal vegetables", price: "$28" },
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
        <p className="text-center text-xs mt-8" style={{ color: site.palette.muted }}>
          Full menu available in-house. Gluten-free and vegetarian options marked on request.
        </p>
      </div>
    </section>
  );
}

function ContractorProjects({ site }: { site: SiteType }) {
  const projects = [
    { title: "Norton Shores Kitchen", scope: "Full gut renovation — custom cabinetry, quartz counters, new layout", timeline: "6 weeks", year: "2024" },
    { title: "Muskegon Lake Deck", scope: "800 sq ft composite deck with built-in bench seating and cable rail", timeline: "3 weeks", year: "2024" },
    { title: "Heritage Hill Bathroom", scope: "Walk-in shower conversion, heated floors, custom tile work", timeline: "4 weeks", year: "2023" },
    { title: "Whitehall Basement Finish", scope: "Full basement buildout — bedroom, bathroom, living area, egress window", timeline: "8 weeks", year: "2023" },
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
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {projects.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-6 rounded-xl"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: site.palette.accent }}>{p.year}</span>
                <span className="text-xs" style={{ color: site.palette.muted }}>{p.timeline}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: site.font.heading }}>{p.title}</h3>
              <p className="text-sm" style={{ color: site.palette.muted }}>{p.scope}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs mt-8" style={{ color: site.palette.muted }}>
          Before/after photos available on request. We don't stage our job sites.
        </p>
      </div>
    </section>
  );
}

function SalonBooking({ site }: { site: SiteType }) {
  const stylists = [
    { name: "Aisha T.", specialty: "Creative Color & Balayage", years: 12 },
    { name: "Jordan M.", specialty: "Precision Cuts & Fades", years: 8 },
    { name: "Priya K.", specialty: "Protective Styling & Locs", years: 6 },
    { name: "Camille R.", specialty: "Bridal & Editorial", years: 10 },
    { name: "Dani L.", specialty: "Vivid Color & Corrective", years: 5 },
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
                className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent, fontFamily: site.font.heading }}
              >
                {s.name.charAt(0)}
              </div>
              <h3 className="text-base font-semibold" style={{ fontFamily: site.font.heading }}>{s.name}</h3>
              <p className="text-sm mt-1" style={{ color: site.palette.accent }}>{s.specialty}</p>
              <p className="text-xs mt-1" style={{ color: site.palette.muted }}>{s.years} years experience</p>
              <button
                className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-full transition-all hover:opacity-80"
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
        <p className="text-center text-xs mt-6" style={{ color: site.palette.muted }}>
          All classes capped at 12. First-timers: arrive 10 minutes early. We start on time.
        </p>
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
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}
                >
                  {item.tag}
                </span>
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

function CoffeeShop({ site }: { site: SiteType }) {
  const products = [
    { name: "Morning Light Blend", origin: "Colombia & Ethiopia", notes: "Citrus, honey, brown sugar", size: "12oz", price: "$18" },
    { name: "Lakeshore Dark", origin: "Sumatra & Brazil", notes: "Dark chocolate, cedar, molasses", size: "12oz", price: "$18" },
    { name: "Sleeping Bear", origin: "Guatemala", notes: "Caramel, walnut, dried cherry", size: "12oz", price: "$20" },
    { name: "Single Origin — Yirgacheffe", origin: "Ethiopia", notes: "Blueberry, jasmine, bergamot", size: "12oz", price: "$22" },
    { name: "Cold Brew Concentrate", origin: "House Blend", notes: "Makes 8 cups. Dilute 1:1.", size: "32oz", price: "$16" },
    { name: "Coffee Club Subscription", origin: "Rotating selections", notes: "12oz or 2lb every 2 or 4 weeks", size: "Ongoing", price: "From $16/mo" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderBottom: `1px solid ${site.palette.border}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coffee size={16} style={{ color: site.palette.accent }} />
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: site.palette.accent }}>
              The Beans
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
              className="p-5 rounded-xl"
              style={{ backgroundColor: site.palette.card, border: `1px solid ${site.palette.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: site.palette.muted }}>{p.origin}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: site.palette.accent + "15", color: site.palette.accent }}>
                  {p.size}
                </span>
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: site.font.heading }}>{p.name}</h3>
              <p className="text-sm mb-3" style={{ color: site.palette.muted }}>{p.notes}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: site.palette.accent }}>{p.price}</span>
                <button
                  className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all hover:opacity-80"
                  style={{ backgroundColor: site.palette.accent, color: site.palette.bg }}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Nuance section router ── */
function NuanceSection({ site }: { site: SiteType }) {
  switch (site.slug) {
    case "lakehouse-grill":
      return <RestaurantMenu site={site} />;
    case "ironworks-renovations":
      return <ContractorProjects site={site} />;
    case "noir-beauty":
      return <SalonBooking site={site} />;
    case "forge-athletics":
      return <GymSchedule site={site} />;
    case "wren-and-sparrow":
      return <BoutiqueArrivals site={site} />;
    case "northshore-roasters":
      return <CoffeeShop site={site} />;
    default:
      return null;
  }
}

/* ── Main ShowroomSite component ── */
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

  const isLight = site.slug === "wren-and-sparrow";

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
            {["About", "Services", "Gallery", "Contact"].map((item) => (
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
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ★ Industry-specific nuance section ★ */}
      <NuanceSection site={site} />

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
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl overflow-hidden aspect-[4/3]"
              >
                <img
                  src={site.heroImage}
                  alt={`${site.name} gallery ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition:
                      i === 0 ? "center" : i === 1 ? "left" : "right",
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
