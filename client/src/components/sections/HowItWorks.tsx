/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * How It Works: Customer-facing journey — what YOU experience as a client.
 * Simple, warm, and focused on the customer's perspective.
 */
import { motion } from "framer-motion";
import {
  MessageSquare,
  Palette,
  Rocket,
  Shield,
} from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Tell Us About Your Business",
    description:
      "Share your vision, your audience, and your goals. We'll ask the right questions to understand exactly what you need — no jargon, no overwhelm.",
    color: "bg-terracotta/10 text-terracotta",
    accent: "border-terracotta/30",
  },
  {
    icon: Palette,
    number: "02",
    title: "We Design Your Perfect Website",
    description:
      "Our team crafts a custom website tailored to your brand. You'll see mockups, give feedback, and watch your vision come to life — all within days, not months.",
    color: "bg-sage/20 text-forest",
    accent: "border-sage/40",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Your Site Goes Live",
    description:
      "We handle hosting, domain setup, and launch. Your new website is live, fast, and ready to attract customers from day one.",
    color: "bg-forest/10 text-forest",
    accent: "border-forest/20",
  },
  {
    icon: Shield,
    number: "04",
    title: "We Keep It Growing",
    description:
      "Monthly performance reports, proactive updates, and ongoing support for the full life of your contract. Your website gets better every month — without you lifting a finger.",
    color: "bg-terracotta/10 text-terracotta",
    accent: "border-terracotta/30",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 lg:py-32 bg-warm-white relative overflow-hidden"
    >
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
          >
            From first hello to{" "}
            <span className="italic text-terracotta">lasting growth</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forest/60 font-sans leading-relaxed"
          >
            Getting a website that works for your business should be simple.
            Here's what your experience looks like with MiniMorph.
          </motion.p>
        </div>

        {/* Steps — Clean Card Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative bg-white rounded-2xl p-8 lg:p-10 border ${step.accent} shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
              {/* Step number — large watermark */}
              <span className="absolute top-4 right-6 text-6xl font-serif font-bold text-forest/5 select-none">
                {step.number}
              </span>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-5`}
              >
                <step.icon size={22} />
              </div>

              {/* Content */}
              <h3 className="text-xl lg:text-2xl font-serif text-forest mb-3">
                {step.title}
              </h3>
              <p className="text-base text-forest/60 font-sans leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA nudge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-forest/50 font-sans text-base mb-4">
            That's it. No complicated process, no hidden steps.
          </p>
          <a
            href="/get-started"
            className="inline-flex items-center gap-2 text-terracotta font-sans font-semibold hover:underline underline-offset-4 transition-all"
          >
            Ready to get started?
            <span aria-hidden="true">&rarr;</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
