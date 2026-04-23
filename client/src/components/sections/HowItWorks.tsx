/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * How It Works: Vertical storytelling with alternating left-right blocks.
 * Shows the lifecycle loop — from lead to renewal.
 */
import { motion } from "framer-motion";
import {
  Search,
  UserCheck,
  Palette,
  Rocket,
  HeartPulse,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from "lucide-react";

const LIFECYCLE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/lifecycle-illustration-KvXZwqhARYUPZQKvFGGpqk.webp";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "We Find Your Customers",
    description:
      "Our AI lead system continuously identifies, qualifies, and warms potential customers — so by the time they reach you, they're ready to talk.",
    tag: "AI-Powered",
  },
  {
    icon: UserCheck,
    number: "02",
    title: "You Close the Deal",
    description:
      "Our trained sales representatives receive warm leads and guide prospects through the buying process. You focus on closing — we handle everything else.",
    tag: "Human Touch",
  },
  {
    icon: Palette,
    number: "03",
    title: "Choose Your Vision",
    description:
      "Explore examples, select your package, and shape the direction of your build. Our guided process ensures you get exactly what you need — no confusion.",
    tag: "Guided Experience",
  },
  {
    icon: Rocket,
    number: "04",
    title: "We Build & Launch",
    description:
      "Your custom website is designed, developed, and launched with care. Every detail is crafted to convert visitors into customers.",
    tag: "Premium Quality",
  },
  {
    icon: HeartPulse,
    number: "05",
    title: "Ongoing Nurture & Support",
    description:
      "For the full 12 months of your contract, AI agents check in, manage requests, and keep your relationship active. You're never abandoned after launch.",
    tag: "AI-Managed",
  },
  {
    icon: TrendingUp,
    number: "06",
    title: "Growth & Upgrades",
    description:
      "As your business evolves, we identify opportunities for new features, additional pages, and enhanced capabilities to keep you ahead.",
    tag: "Proactive",
  },
  {
    icon: BarChart3,
    number: "07",
    title: "Performance Reports",
    description:
      "Monthly analytics reports show exactly how your website is performing — clear, actionable insights delivered automatically.",
    tag: "Data-Driven",
  },
  {
    icon: RefreshCw,
    number: "08",
    title: "Seamless Renewal",
    description:
      "Before your contract ends, we proactively work to ensure continuity. The cycle repeats — better, smarter, stronger.",
    tag: "Lifecycle Loop",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-warm-white relative overflow-hidden">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            The Lifecycle
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
          >
            How the <span className="italic">machine</span> works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forest/60 font-sans leading-relaxed"
          >
            One connected system that finds leads, closes deals, builds sites, nurtures customers, and renews contracts — automatically.
          </motion.p>

          {/* Lifecycle illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-10 mx-auto w-48 h-48 lg:w-64 lg:h-64"
          >
            <img
              src={LIFECYCLE_IMG}
              alt="Lifecycle loop illustration"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>

        {/* Steps — Vertical Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-px" />

          {steps.map((step, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className={`relative flex items-start gap-6 mb-12 lg:mb-16 ${
                  isLeft ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 lg:left-1/2 w-3 h-3 rounded-full bg-terracotta -translate-x-1.5 mt-2 z-10 ring-4 ring-warm-white" />

                {/* Content */}
                <div
                  className={`ml-14 lg:ml-0 lg:w-[calc(50%-2rem)] ${
                    isLeft ? "lg:pr-8 lg:text-right" : "lg:pl-8 lg:text-left"
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${isLeft ? "lg:justify-end" : "lg:justify-start"}`}>
                    <span className="text-xs font-sans font-medium text-terracotta/80 uppercase tracking-widest">
                      {step.tag}
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 mb-2 ${isLeft ? "lg:justify-end" : "lg:justify-start"}`}>
                    <div className="w-9 h-9 rounded-lg bg-forest/8 flex items-center justify-center">
                      <step.icon size={18} className="text-forest" />
                    </div>
                    <span className="text-sm font-sans font-bold text-forest/30">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif text-forest mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base text-forest/60 font-sans leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Spacer for other side */}
                <div className="hidden lg:block lg:w-[calc(50%-2rem)]" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
