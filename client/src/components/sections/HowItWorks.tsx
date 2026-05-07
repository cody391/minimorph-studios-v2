/*
 * How It Works — tightened to one section with character.
 * Merged the old 6-step process, "What Happens After You Pay" list,
 * and "Competitor Discovery" into a single, punchier flow.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap, ClipboardList, PenTool, MessageSquare, Rocket, BarChart3,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

const steps = [
  {
    icon: Zap,
    number: "01",
    title: "Get Your Free Audit",
    description: "Tell us about your business and get a full website audit — for free. We'll analyze your current site, benchmark you against competitors, and show you exactly what's costing you customers.",
    aside: "Takes about 2 minutes",
  },
  {
    icon: ClipboardList,
    number: "02",
    title: "Elena Gathers Everything",
    description: "Our AI onboarding agent Elena collects your brand details, competitors, styles you love, and goals through a natural conversation — then hands off a complete creative brief to our team.",
    aside: "AI chat + portal onboarding",
  },
  {
    icon: PenTool,
    number: "03",
    title: "We Build It",
    description: "We combine professionally designed industry templates with AI that writes copy specific to your business — your services, your story, your voice. The result looks custom because the content is custom.",
    aside: "First draft in 48–72 hours",
  },
  {
    icon: MessageSquare,
    number: "04",
    title: "You Tear It Apart",
    description: "Request changes. Be picky. That's what this step is for. We revise until you're genuinely happy — not just 'fine with it.'",
    aside: "Unlimited revision rounds",
  },
  {
    icon: Rocket,
    number: "05",
    title: "Launch Day",
    description: "Domain connected, SSL configured, analytics running. We handle the technical stuff so you can focus on the Instagram post.",
    aside: "We walk you through it",
  },
  {
    icon: BarChart3,
    number: "06",
    title: "Monthly Care Begins",
    description: "This is where most agencies ghost you. Not us. Monthly reports, AI recommendations, support tickets, and actual humans who respond.",
    aside: "Every month, for real",
  },
];

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
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
            Six steps. Zero mystery.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-off-white/50 font-sans leading-relaxed"
          >
            We've built this process for people who've been burned by agencies that
            overpromise and under-deliver. Every step is transparent, and you'll
            always know what's happening next.
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
              className="relative p-6 rounded-2xl glass-card hover:border-electric/30 transition-all duration-500 group"
            >
              <span className="absolute top-4 right-5 text-5xl font-serif font-bold text-off-white/5 select-none">
                {step.number}
              </span>
              <div className="w-10 h-10 rounded-lg bg-electric/10 border border-electric/20 flex items-center justify-center mb-4 group-hover:bg-electric/15 transition-colors">
                <step.icon size={20} className="text-electric" />
              </div>
              <h3 className="text-lg font-serif text-off-white mb-2">{step.title}</h3>
              <p className="text-sm text-off-white/50 font-sans leading-relaxed mb-3">{step.description}</p>
              <span className="text-[11px] font-sans text-electric/50 uppercase tracking-wider">
                {step.aside}
              </span>
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
            That's the whole process. No 47-page proposal. No "discovery phase" that costs extra.
          </p>
          <Button
            variant="outline"
            className="border-off-white/15 text-off-white/70 hover:text-off-white hover:bg-off-white/5 font-sans rounded-full"
            onClick={() => setLocation("/free-audit")}
          >
            Get your free audit
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
