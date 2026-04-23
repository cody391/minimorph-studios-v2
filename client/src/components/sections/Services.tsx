/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Services: Warm cards with icons, staggered grid, soft shadows.
 * Communicates the full lifecycle value proposition.
 */
import { motion } from "framer-motion";
import {
  Globe,
  Bot,
  BarChart3,
  HeartHandshake,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Custom Website Design",
    description:
      "Beautiful, conversion-focused websites tailored to your brand. Every design is unique — no templates, no cookie-cutter layouts.",
    accent: "bg-forest/10 text-forest",
  },
  {
    icon: Bot,
    title: "AI-Powered Support",
    description:
      "Our intelligent system manages your account after launch — handling updates, changes, and requests so you always feel supported.",
    accent: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: BarChart3,
    title: "Monthly Analytics Reports",
    description:
      "Clear, actionable performance reports delivered monthly. Know exactly how your website is performing and where to improve.",
    accent: "bg-sage/20 text-forest",
  },
  {
    icon: HeartHandshake,
    title: "Ongoing Customer Care",
    description:
      "12 months of active nurturing. Regular check-ins, proactive suggestions, and responsive support throughout your contract.",
    accent: "bg-forest/10 text-forest",
  },
  {
    icon: TrendingUp,
    title: "Growth & Upgrades",
    description:
      "As your business grows, we identify opportunities to enhance your site with new features, pages, and capabilities.",
    accent: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: RefreshCw,
    title: "Seamless Renewals",
    description:
      "Before your contract ends, we proactively work to ensure continuity — so your online presence never skips a beat.",
    accent: "bg-sage/20 text-forest",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  },
};

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 bg-warm-white">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            What We Do
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
          >
            One connected system,
            <br />
            <span className="italic">not random tools</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forest/60 font-sans leading-relaxed"
          >
            Everything works together — from design to support to growth. Your website is just the beginning of an ongoing partnership.
          </motion.p>
        </div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={cardVariants}
              className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-500"
            >
              <div
                className={`w-12 h-12 rounded-xl ${service.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <service.icon size={22} />
              </div>
              <h3 className="text-xl font-serif text-forest mb-3">
                {service.title}
              </h3>
              <p className="text-base text-forest/60 font-sans leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
