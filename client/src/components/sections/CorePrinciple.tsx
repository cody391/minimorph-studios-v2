/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * "Why MiniMorph" — customer-facing value proposition.
 * Focuses on what the customer gets, not how the machine works internally.
 */
import { motion } from "framer-motion";
import {
  HeartHandshake,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const pillars = [
  {
    icon: HeartHandshake,
    title: "A Real Person Who Knows You",
    description:
      "You'll always have a dedicated representative who understands your business, your goals, and your customers. No call centers, no ticket queues.",
    color: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: Clock,
    title: "Support That Never Sleeps",
    description:
      "Updates, fixes, and improvements happen around the clock. Your website is monitored and maintained 24/7 so you never have to worry about downtime.",
    color: "bg-sage/20 text-forest",
  },
  {
    icon: TrendingUp,
    title: "Growth Built Into Every Month",
    description:
      "Monthly performance reports, proactive recommendations, and continuous improvements. Your website doesn't just stay the same — it gets better over time.",
    color: "bg-forest/10 text-forest",
  },
  {
    icon: ShieldCheck,
    title: "One Team, Start to Finish",
    description:
      "From your first conversation through design, launch, and ongoing care — the same team handles everything. No handoffs, no starting over, no gaps.",
    color: "bg-terracotta/10 text-terracotta",
  },
];

export default function CorePrinciple() {
  return (
    <section className="py-24 lg:py-32 bg-cream-dark relative overflow-hidden">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 lg:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
            >
              Why MiniMorph
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif text-forest leading-[1.1] mb-6"
            >
              Your dedicated team,{" "}
              <br className="hidden sm:block" />
              <span className="italic text-terracotta">always on.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg lg:text-xl text-forest/60 font-sans leading-relaxed max-w-2xl mx-auto"
            >
              Most agencies build your site and disappear. We stick around for
              the full journey — designing, launching, supporting, and growing
              your online presence every single month.
            </motion.p>
          </div>

          {/* Four Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 lg:p-10 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-shadow duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${pillar.color} flex items-center justify-center mb-5`}
                >
                  <pillar.icon size={22} />
                </div>
                <h3 className="text-xl lg:text-2xl font-serif text-forest mb-3">
                  {pillar.title}
                </h3>
                <p className="text-base text-forest/60 font-sans leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom reinforcement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-14"
          >
            <p className="text-forest/50 font-sans text-base italic">
              "We don't just build websites. We build partnerships that last."
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
