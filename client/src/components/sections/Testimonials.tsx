/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Testimonials: Placeholder testimonials representing typical client outcomes.
 * Marked as representative examples until real testimonials are collected.
 */
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Owner, Bloom & Branch Florals",
    quote:
      "Within two weeks of launching our new site, online orders jumped 40%. The design perfectly captures our brand — customers tell us all the time how beautiful it is.",
    stars: 5,
    result: "+40% online orders",
  },
  {
    name: "Marcus Chen",
    role: "Founder, Precision Auto Detailing",
    quote:
      "I was paying $300/month for a site that looked like it was built in 2010. MiniMorph gave me something modern and professional for half the price, and my phone hasn't stopped ringing.",
    stars: 5,
    result: "3x more inquiries",
  },
  {
    name: "Dr. Amara Okafor",
    role: "Director, Okafor Family Dentistry",
    quote:
      "The monthly reports actually make sense — I can see exactly where my patients are coming from. The AI recommendations helped us rank on the first page for 'family dentist near me.'",
    stars: 5,
    result: "Page 1 on Google",
  },
  {
    name: "Jake & Lisa Hernandez",
    role: "Co-Owners, Sunset Taqueria",
    quote:
      "We went from zero online presence to a site that handles catering requests, shows our menu, and even lets people order ahead. Revenue is up 25% since launch.",
    stars: 5,
    result: "+25% revenue",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-forest relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            Client Stories
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-cream leading-tight"
          >
            Trusted by businesses
            <br />
            <span className="italic">that value growth</span>
          </motion.h2>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-terracotta/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <Quote size={24} className="text-terracotta/40 shrink-0 mt-1" />
                <div className="space-y-3 flex-1">
                  <p className="text-base text-cream/80 font-sans leading-relaxed italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={14} className="fill-terracotta text-terracotta" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-medium text-cream font-sans">{t.name}</p>
                      <p className="text-xs text-cream/40 font-sans">{t.role}</p>
                    </div>
                    <span className="text-xs font-medium text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full font-sans">
                      {t.result}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-cream/25 font-sans mt-10"
        >
          Representative examples based on typical client outcomes. Real testimonials will replace these as they come in.
        </motion.p>
      </div>
    </section>
  );
}
