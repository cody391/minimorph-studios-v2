/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Testimonials: Large editorial quotes with warm styling.
 * Builds trust and social proof.
 */
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "MiniMorph didn't just build us a website — they built us a system. The ongoing support and monthly reports make us feel like we have a full digital team without the overhead.",
    name: "Sarah Chen",
    role: "Owner, Bloom & Gather Florist",
    initials: "SC",
  },
  {
    quote:
      "I was skeptical about AI managing my account, but the check-ins are more consistent than any agency I've worked with. They caught issues before I even noticed them.",
    name: "Marcus Rivera",
    role: "Founder, Rivera Fitness Co.",
    initials: "MR",
  },
  {
    quote:
      "The guided buying process was a game-changer. I knew exactly what I was getting, and the final product exceeded my expectations. Already renewed for year two.",
    name: "Emily Thornton",
    role: "CEO, Thornton Legal Group",
    initials: "ET",
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

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/8 transition-all duration-500"
            >
              <Quote size={24} className="text-terracotta/60 mb-6" />
              <p className="text-base text-cream/80 font-sans leading-relaxed mb-8">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center text-sm font-sans font-bold text-cream/80">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-cream">
                    {testimonial.name}
                  </p>
                  <p className="text-xs font-sans text-cream/50">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
