/*
 * Social Proof section — realistic case studies with personality.
 * All names are fictional composites. Metrics are illustrative of typical outcomes.
 */
import { motion } from "framer-motion";
import { Star, Quote, TrendingUp, Users, Clock } from "lucide-react";

const caseStudies = [
  {
    quote:
      "Before MiniMorph, we were invisible online. Now our number comes up first when anyone Googles 'auto detailing' in our area. That didn't happen overnight — but it happened. Worth every dollar.",
    name: "Sarah M.",
    role: "Owner, Lakeshore Auto Detailing",
    industry: "Auto Detailing",
    stars: 5,
    metric: { icon: TrendingUp, label: "Online bookings up", value: "3x" },
    package: "Growth",
  },
  {
    quote:
      "Elena asked us things our last web designer never thought to ask — our most popular dish, what regulars order, what feeling we wanted people to have before they walked in. The site reflects who we actually are.",
    name: "Marcus & Lisa G.",
    role: "Owners, G&L Chillidog",
    industry: "Restaurant",
    stars: 5,
    metric: { icon: Users, label: "Monthly site visitors", value: "2,400+" },
    package: "Growth",
  },
  {
    quote:
      "I sent the site link to three general contractors I'd been trying to work with for two years. Two of them called me back within a week.",
    name: "James R.",
    role: "Owner, Shoreline Concrete & Masonry",
    industry: "Concrete & Masonry",
    stars: 5,
    metric: { icon: Clock, label: "Avg. change turnaround", value: "48 hrs" },
    package: "Pro",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            Example Customer Scenarios
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            See what's possible.{" "}
            <span className="text-gradient-electric">Real scenarios, real impact.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-off-white/50 font-sans max-w-xl mx-auto"
          >
            Composite scenarios based on typical small business challenges we solve.
            (Names and details are fictional composites for illustration.)
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {caseStudies.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl glass-card flex flex-col"
            >
              {/* Metric badge */}
              <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-electric/10 border border-electric/20 w-fit">
                <t.metric.icon size={14} className="text-electric" />
                <span className="text-xs font-sans text-electric font-medium">
                  {t.metric.label}: <span className="text-off-white font-bold">{t.metric.value}</span>
                </span>
              </div>

              <Quote size={20} className="text-electric/30 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} className="text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm font-sans text-off-white/60 leading-relaxed mb-6 italic flex-1">
                "{t.quote}"
              </p>
              <div className="border-t border-off-white/10 pt-4 mt-auto">
                <p className="text-sm font-sans font-medium text-off-white/80">{t.name}</p>
                <p className="text-xs font-sans text-off-white/40">{t.role}</p>
                <p className="text-xs font-sans text-electric/60 mt-1">{t.industry}</p>
                <span className="inline-block mt-2 text-[10px] font-sans text-off-white/40 px-2 py-0.5 rounded-full border border-off-white/10">
                  {t.package} Plan
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-8 text-[10px] font-sans text-off-white/40 max-w-lg mx-auto">
          Names are fictional composites to protect client privacy. Metrics are illustrative of typical outcomes
          observed across similar engagements and are not guaranteed results. Individual results vary.
        </p>
      </div>
    </section>
  );
}
