/*
 * Design: Premium Dark — MiniMorph Studios
 * Hero: Bold serif headline on near-black, electric accent, product mockup card,
 * dual CTAs, no phone number.
 */
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, BarChart3, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Hero() {
  const [, setLocation] = useLocation();
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-midnight">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-electric/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet/5 blur-[100px]" />
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 noise-texture opacity-50" />

      <div className="container relative z-10 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric/10 border border-electric/20 text-electric text-sm font-sans font-medium mb-8">
                <Zap size={14} />
                Done-For-You Website Design & Management
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-off-white leading-[1.08] tracking-tight mb-6"
            >
              We don't just build it.{" "}
              <span className="text-gradient-electric">We stick around.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg lg:text-xl text-off-white/60 font-sans leading-relaxed mb-10 max-w-lg"
            >
              Most agencies disappear after launch. We don't. Every plan includes a custom-built website, monthly reports, and support that actually responds — starting at $195/mo.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-base px-8 py-6 rounded-full shadow-none hover:shadow-lg hover:shadow-electric/20 transition-all duration-300 group"
                onClick={() => setLocation("/get-started")}
              >
                Get Started
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-off-white/20 text-off-white hover:bg-off-white/5 font-sans text-base px-8 py-6 rounded-full transition-all duration-300"
                onClick={() => setLocation("/free-audit")}
              >
                Get a Free Audit
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10 flex items-center gap-8 pb-8 border-b border-off-white/10"
            >
              <div className="text-center">
                <div className="text-2xl font-serif text-off-white">48h</div>
                <div className="text-[11px] font-sans text-off-white/40">First Concept</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif text-off-white">Any</div>
                <div className="text-[11px] font-sans text-off-white/40">Industry</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif text-electric">100%</div>
                <div className="text-[11px] font-sans text-off-white/40">You Own It</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif text-off-white">Global</div>
                <div className="text-[11px] font-sans text-off-white/40">Coverage</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-off-white/40 font-sans"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-electric/60" />
                <span>Designed for your industry, written for your business</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-electric/60" />
                <span>First draft after onboarding is complete</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-electric/60" />
                <span>Monthly reports included</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-electric/60" />
                <span>You own everything</span>
              </div>
            </motion.div>
          </div>

          {/* Right — Product Mockup Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="glass-card p-6 glow-electric">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <div className="ml-3 flex-1 h-7 rounded-md bg-off-white/5 flex items-center px-3">
                  <span className="text-xs text-off-white/40 font-mono">yourbusiness.com</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-off-white/5 border border-off-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-sans font-medium text-off-white/80">Website Performance</span>
                    <span className="text-xs font-sans text-electric">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-serif text-off-white">847</div>
                      <div className="text-xs text-off-white/40 font-sans">Visitors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-serif text-electric">4.2s</div>
                      <div className="text-xs text-off-white/40 font-sans">Avg. Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-serif text-off-white">23</div>
                      <div className="text-xs text-off-white/40 font-sans">Leads</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-electric/10 border border-electric/20">
                    <Users size={16} className="text-electric mb-2" />
                    <div className="text-xs font-sans text-off-white/60">Customer Portal</div>
                    <div className="text-sm font-sans font-medium text-off-white/80 mt-1">Active</div>
                  </div>
                  <div className="p-3 rounded-lg bg-violet/10 border border-violet/20">
                    <BarChart3 size={16} className="text-violet mb-2" />
                    <div className="text-xs font-sans text-off-white/60">Monthly Report</div>
                    <div className="text-sm font-sans font-medium text-off-white/80 mt-1">Ready</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-off-white/5 border border-off-white/10">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-gold" />
                    <span className="text-xs font-sans text-off-white/60">Growth Recommendation:</span>
                  </div>
                  <p className="text-sm font-sans text-off-white/70 mt-1">
                    "Your contact form is your top lead source. Adding a booking widget could convert 23% more mobile visitors into customers."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
