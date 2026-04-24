/*
 * Final CTA section — strong conversion push, no phone number.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function Contact() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-24 lg:py-32 bg-midnight relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-electric/5 blur-[150px]" />
      </div>
      <div className="absolute inset-0 noise-texture opacity-30" />

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric/10 border border-electric/20 text-electric text-sm font-sans font-medium mb-8">
              <Zap size={14} />
              Ready to get started?
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif text-off-white leading-tight mb-6"
          >
            Your website should{" "}
            <span className="text-gradient-electric">work as hard as you do.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed mb-10 max-w-xl mx-auto"
          >
            Start your MiniMorph build today. Choose a plan, complete onboarding, and let us take care of the rest — from design to launch to monthly support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-base px-10 py-6 rounded-full shadow-none hover:shadow-lg hover:shadow-electric/20 transition-all duration-300 group"
              onClick={() => setLocation("/get-started")}
            >
              Start My Website Build
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-off-white/20 text-off-white hover:bg-off-white/5 font-sans text-base px-10 py-6 rounded-full transition-all duration-300"
              onClick={() => {
                const el = document.querySelector("#pricing");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Pricing
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-sm text-off-white/30 font-sans"
          >
            Questions? Email us at{" "}
            <a href="mailto:hello@minimorphstudios.com" className="text-electric/60 hover:text-electric transition-colors underline underline-offset-2">
              hello@minimorphstudios.com
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
