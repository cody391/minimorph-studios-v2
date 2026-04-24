/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Portfolio: Will showcase real client projects once available.
 * Currently shows an invitation to become the first featured project.
 */
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Portfolio() {
  const [, setLocation] = useLocation();

  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-cream">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-2xl mb-14 lg:mb-18">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            Our Work
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
          >
            Crafted with care,
            <br />
            <span className="italic">built to convert</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forest/60 font-sans leading-relaxed"
          >
            Every project is a unique collaboration. Our portfolio of real client
            work is growing — be among the first to be featured.
          </motion.p>
        </div>

        {/* Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-forest/8 flex items-center justify-center mx-auto mb-6">
            <Layers className="w-8 h-8 text-forest/40" />
          </div>
          <h3 className="text-xl font-serif text-forest mb-3">
            Portfolio Coming Soon
          </h3>
          <p className="text-forest/50 font-sans leading-relaxed mb-8">
            We're currently working with our first clients to create stunning
            websites. Real projects from real businesses will be showcased here.
          </p>
          <Button
            className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full px-8"
            onClick={() => setLocation("/get-started")}
          >
            Be Our Next Project
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
