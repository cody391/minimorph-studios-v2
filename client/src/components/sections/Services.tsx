/*
 * Pain + Solution section — replaces old Services.
 * Top: Pain ("Most websites get built, launched, and abandoned")
 * Bottom: Solution pillars (Build, Launch, Maintain, Improve, Report, Renew)
 */
import { motion } from "framer-motion";
import {
  Globe, Rocket, Wrench, TrendingUp, BarChart3, RefreshCw,
  AlertTriangle, Clock, Ban, Ghost, XCircle, HelpCircle,
} from "lucide-react";

const painPoints = [
  { icon: AlertTriangle, text: "Your website was built and never touched again" },
  { icon: Clock, text: "Updates take weeks or never happen at all" },
  { icon: Ban, text: "No one monitors if your site is actually working" },
  { icon: Ghost, text: "Your web designer disappeared after launch" },
  { icon: XCircle, text: "You have no idea how your website is performing" },
  { icon: HelpCircle, text: "You do not know who to call when something breaks" },
];

const pillars = [
  {
    icon: Globe,
    title: "Build",
    description: "Custom website design tailored to your brand, audience, and business goals.",
    color: "text-electric",
    bg: "bg-electric/10 border-electric/20",
  },
  {
    icon: Rocket,
    title: "Launch",
    description: "We handle hosting, domain setup, and go-live so you are up and running fast.",
    color: "text-cyan",
    bg: "bg-cyan/10 border-cyan/20",
  },
  {
    icon: Wrench,
    title: "Maintain",
    description: "Ongoing updates, fixes, and content changes handled by our team every month.",
    color: "text-violet",
    bg: "bg-violet/10 border-violet/20",
  },
  {
    icon: TrendingUp,
    title: "Improve",
    description: "AI-assisted recommendations to make your site stronger over time.",
    color: "text-gold",
    bg: "bg-gold/10 border-gold/20",
  },
  {
    icon: BarChart3,
    title: "Report",
    description: "Clear monthly performance reports so you know exactly what is happening.",
    color: "text-electric",
    bg: "bg-electric/10 border-electric/20",
  },
  {
    icon: RefreshCw,
    title: "Renew",
    description: "Proactive renewal support so your online presence never skips a beat.",
    color: "text-cyan",
    bg: "bg-cyan/10 border-cyan/20",
  },
];

export default function Services() {
  return (
    <>
      {/* Pain Section */}
      <section className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-red-400/80 uppercase tracking-widest mb-4 block"
            >
              The Problem
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
            >
              Most websites get built, launched,{" "}
              <span className="text-off-white/40">and abandoned.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              Sound familiar? You paid for a website, it launched, and then nothing happened. No updates. No reports. No one checking if it still works. That is the industry standard — and it is not good enough.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {painPoints.map((point, idx) => (
              <motion.div
                key={point.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-400/5 border border-red-400/10"
              >
                <point.icon size={18} className="text-red-400/60 mt-0.5 shrink-0" />
                <span className="text-sm font-sans text-off-white/60">{point.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="services" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
            >
              The MiniMorph System
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
            >
              MiniMorph keeps your website{" "}
              <span className="text-gradient-electric">moving.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              Six connected pillars that work together — from design to support to growth. Your website is just the beginning of an ongoing partnership.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="group p-7 rounded-2xl glass-card hover:border-electric/30 transition-all duration-500"
              >
                <div className={`w-12 h-12 rounded-xl ${pillar.bg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <pillar.icon size={22} className={pillar.color} />
                </div>
                <h3 className="text-xl font-serif text-off-white mb-3">{pillar.title}</h3>
                <p className="text-sm text-off-white/50 font-sans leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
