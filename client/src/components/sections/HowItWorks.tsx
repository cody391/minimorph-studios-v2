/*
 * How It Works — 6-step customer journey + What Happens After You Pay + Competitor Discovery.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CreditCard, ClipboardList, PenTool, MessageSquare, Rocket, BarChart3,
  ArrowRight, Eye, Globe, Search,
} from "lucide-react";
import { useLocation } from "wouter";

const steps = [
  { icon: CreditCard, number: "01", title: "Choose a Plan", description: "Pick the website care package that fits your business." },
  { icon: ClipboardList, number: "02", title: "Complete Onboarding", description: "Tell us about your business, upload assets, share style references, and list competitors." },
  { icon: PenTool, number: "03", title: "First Draft Begins", description: "Our team uses your information to build a site direction." },
  { icon: MessageSquare, number: "04", title: "Review & Request Changes", description: "See your draft, request revisions, and approve launch." },
  { icon: Rocket, number: "05", title: "Launch", description: "We help with domain handoff and launch steps." },
  { icon: BarChart3, number: "06", title: "Monthly Care", description: "Get reports, support, recommendations, updates, and renewal reminders." },
];

const afterPaySteps = [
  "Your account is created.",
  "Your customer portal opens.",
  "Your onboarding project is created.",
  "You answer a guided questionnaire.",
  "You upload logos, photos, and content.",
  "You share websites you like and competitors.",
  "Your draft moves through design and review.",
  "You request revisions.",
  "You approve launch.",
  "Monthly support, reports, and recommendations begin.",
];

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <>
      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
            >
              How It Works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
            >
              From first hello to{" "}
              <span className="text-gradient-electric">lasting growth</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-off-white/50 font-sans leading-relaxed"
            >
              Getting a website that works for your business should be simple. Here is what your experience looks like with MiniMorph.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="relative p-6 rounded-2xl glass-card hover:border-electric/30 transition-all duration-500"
              >
                <span className="absolute top-4 right-5 text-5xl font-serif font-bold text-off-white/5 select-none">
                  {step.number}
                </span>
                <div className="w-10 h-10 rounded-lg bg-electric/10 border border-electric/20 flex items-center justify-center mb-4">
                  <step.icon size={20} className="text-electric" />
                </div>
                <h3 className="text-lg font-serif text-off-white mb-2">{step.title}</h3>
                <p className="text-sm text-off-white/50 font-sans leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-off-white/40 font-sans text-sm mb-4">
              That is it. No complicated process, no hidden steps.
            </p>
            <Button
              variant="outline"
              className="border-off-white/15 text-off-white/70 hover:text-off-white hover:bg-off-white/5 font-sans rounded-full"
              onClick={() => setLocation("/get-started")}
            >
              Ready to get started?
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What Happens After You Pay */}
      <section className="py-20 lg:py-28 bg-midnight relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
                >
                  After You Start
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-serif text-off-white leading-tight mb-6"
                >
                  What happens after{" "}
                  <span className="text-gradient-electric">you start?</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-off-white/50 font-sans leading-relaxed"
                >
                  No mystery. No waiting in the dark. Here is exactly what happens the moment you begin your MiniMorph build.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                {afterPaySteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-off-white/3 border border-off-white/5">
                    <span className="w-6 h-6 rounded-full bg-electric/15 border border-electric/25 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-sans font-bold text-electric">{idx + 1}</span>
                    </span>
                    <span className="text-sm font-sans text-off-white/60">{step}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor / Style Discovery */}
      <section className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 noise-texture opacity-30" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Search size={20} className="text-electric" />
                    <span className="text-sm font-sans font-medium text-off-white/80">Style & Competitor Discovery</span>
                  </div>
                  <div className="space-y-2">
                    {["3 websites you like", "3 competitor websites", "What you like about each", "What you dislike", "Features you want", "What you want to avoid"].map((item) => (
                      <div key={item} className="flex items-center gap-2 p-2 rounded-lg bg-off-white/3 border border-off-white/5">
                        <Eye size={14} className="text-electric/60 shrink-0" />
                        <span className="text-sm font-sans text-off-white/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
                >
                  Onboarding Differentiator
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-serif text-off-white leading-tight mb-6"
                >
                  We do not build{" "}
                  <span className="text-gradient-electric">in a vacuum.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-off-white/50 font-sans leading-relaxed mb-6"
                >
                  During onboarding, you can share websites you like and competitors you want us to review. We use that to understand your style, spot opportunities, and recommend ways to make your site stronger.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2"
                >
                  {["Booking integration", "Review widget", "Local SEO pages", "AI chat widget", "Analytics", "SMS lead alerts"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 rounded-full bg-electric/8 border border-electric/15 text-xs font-sans text-electric/80">
                      {tag}
                    </span>
                  ))}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-xs text-off-white/30 font-sans"
                >
                  Tell us what you want during onboarding. We will recommend the right features for your business.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
