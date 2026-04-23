/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Pricing: Three warm, rounded cards with generous padding.
 * Clear value communication, guided buying experience.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const plans = [
  {
    name: "Starter",
    price: "$149",
    period: "/mo",
    description: "Perfect for small businesses getting started online.",
    features: [
      "Custom 5-page website",
      "Mobile-responsive design",
      "Basic SEO setup",
      "Monthly performance report",
      "AI-managed support",
      "12-month contract",
    ],
    cta: "Get Started",
    popular: false,
    accent: "border-border/50",
  },
  {
    name: "Growth",
    price: "$299",
    period: "/mo",
    description: "For businesses ready to scale their online presence.",
    features: [
      "Custom 10-page website",
      "Advanced responsive design",
      "Full SEO optimization",
      "Monthly analytics reports",
      "AI-managed nurture & support",
      "Quarterly strategy reviews",
      "Priority update requests",
      "12-month contract",
    ],
    cta: "Choose Growth",
    popular: true,
    accent: "border-terracotta/30 ring-1 ring-terracotta/10",
  },
  {
    name: "Premium",
    price: "$499",
    period: "/mo",
    description: "The complete package for ambitious businesses.",
    features: [
      "Custom 20+ page website",
      "Premium design & animations",
      "Advanced SEO & content strategy",
      "Weekly analytics reports",
      "Dedicated AI account manager",
      "Monthly strategy sessions",
      "Unlimited update requests",
      "E-commerce integration",
      "12-month contract",
    ],
    cta: "Go Premium",
    popular: false,
    accent: "border-border/50",
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-cream">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
          >
            Simple Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6"
          >
            Choose the plan that
            <br />
            <span className="italic">fits your vision</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-forest/60 font-sans leading-relaxed"
          >
            Every plan includes a custom website, AI-powered support, and ongoing nurture for the full 12-month contract. No hidden fees.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`relative p-8 rounded-2xl bg-card border ${plan.accent} ${
                plan.popular ? "lg:-translate-y-4" : ""
              } hover:shadow-xl transition-all duration-500`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-terracotta text-white text-xs font-sans font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-sans font-semibold text-forest mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-forest/50 font-sans mb-6">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-serif text-forest">
                    {plan.price}
                  </span>
                  <span className="text-base text-forest/50 font-sans">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-sans text-forest/70"
                  >
                    <Check
                      size={16}
                      className="text-sage mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full font-sans text-sm py-5 transition-all duration-300 group ${
                  plan.popular
                    ? "bg-terracotta hover:bg-terracotta-light text-white hover:shadow-md"
                    : "bg-forest/8 hover:bg-forest/15 text-forest"
                }`}
                onClick={() => setLocation("/get-started")}
              >
                {plan.cta}
                <ArrowRight
                  size={16}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-forest/40 font-sans mt-12"
        >
          All plans include a 12-month service agreement. Custom enterprise solutions available upon request.
        </motion.p>
      </div>
    </section>
  );
}
