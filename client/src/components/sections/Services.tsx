/*
 * Pain + Solution section — with character.
 */
import { motion } from "framer-motion";
import {
  Globe, Rocket, Wrench, TrendingUp, BarChart3, RefreshCw,
  AlertTriangle, Clock, Ban, Ghost, XCircle, HelpCircle,
} from "lucide-react";

const painPoints = [
  { icon: AlertTriangle, text: "Your site hasn't been touched since the day it launched" },
  { icon: Clock, text: "\"Quick update\" requests take three weeks and a follow-up email" },
  { icon: Ban, text: "Nobody's checking if your contact form actually works" },
  { icon: Ghost, text: "Your web designer ghosted you after the final invoice" },
  { icon: XCircle, text: "You have no idea if anyone's even visiting your site" },
  { icon: HelpCircle, text: "When something breaks, you Google \"how to fix website\"" },
];

const pillars = [
  {
    icon: Globe,
    title: "Build",
    description: "Not a template with your logo slapped on. A real site designed around your business, your customers, and your competitors' weaknesses.",
    color: "text-electric",
    bg: "bg-electric/10 border-electric/20",
  },
  {
    icon: Rocket,
    title: "Launch",
    description: "Domain, hosting, SSL, analytics — we handle the technical alphabet soup so you can focus on the Instagram post.",
    color: "text-cyan",
    bg: "bg-cyan/10 border-cyan/20",
  },
  {
    icon: Wrench,
    title: "Maintain",
    description: "Content updates, bug fixes, seasonal changes. You ask, we do it. No \"that'll be extra\" surprises.",
    color: "text-violet",
    bg: "bg-violet/10 border-violet/20",
  },
  {
    icon: TrendingUp,
    title: "Improve",
    description: "Our AI spots what you'd miss — slow pages, dead links, missed keywords. We fix them before you even notice.",
    color: "text-gold",
    bg: "bg-gold/10 border-gold/20",
  },
  {
    icon: BarChart3,
    title: "Report",
    description: "Monthly reports you'll actually read. Traffic, leads, what's working, what's not. In plain English.",
    color: "text-electric",
    bg: "bg-electric/10 border-electric/20",
  },
  {
    icon: RefreshCw,
    title: "Renew",
    description: "We reach out before your contract ends — not after. Proactive, not reactive. Like everything else we do.",
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
              Sound Familiar?
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
            >
              Built. Launched.{" "}
              <span className="text-off-white/40">Forgotten.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              You paid good money for a website. It looked great on launch day. Then your
              designer moved on, your plugin updates piled up, and your "modern site" started
              feeling like a digital ghost town. That's the industry standard. We think it's broken.
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
              The MiniMorph Way
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
            >
              We don't hand you a website and{" "}
              <span className="text-gradient-electric">wish you luck.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              Six things we do, every month, for every client. Not a sales pitch — it's
              literally what your subscription pays for.
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
