/*
 * FAQ section — accordion-style, legal-safe answers.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is MiniMorph Studios?",
    a: "MiniMorph Studios is a website design and care company based in Muskegon, Michigan. We build, launch, maintain, and improve small-business websites with monthly support, customer portals, reports, and AI-assisted recommendations.",
  },
  {
    q: "Do I own my website?",
    a: "You own your content, branding, and domain. The website is built and maintained as part of your MiniMorph subscription. If you cancel, we can discuss options for transferring your site files.",
  },
  {
    q: "What does 'AI-assisted' mean?",
    a: "We use AI tools to help analyze your website performance, suggest improvements, and streamline our workflow. All recommendations are reviewed by a human before being applied. AI does not replace our team — it helps us work smarter.",
  },
  {
    q: "How long does it take to build my website?",
    a: "Most websites are ready for first draft review within 2 to 4 weeks after onboarding is complete. Timeline depends on how quickly you provide content and feedback.",
  },
  {
    q: "What if I need ecommerce or a product catalog?",
    a: "Ecommerce builds, product catalogs, product migration, and complex integrations may require a Commerce package or custom quote. We review your needs during onboarding and provide a clear recommendation.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "MiniMorph plans are 12-month agreements. If you need to cancel early, please contact us to discuss your options. We want to make sure you are taken care of.",
  },
  {
    q: "Do you offer refunds?",
    a: "Setup fees are non-refundable once work has begun. Monthly fees are billed in advance. Please review our terms of service for full details.",
  },
  {
    q: "What is the customer portal?",
    a: "Your customer portal is where you can view your project status, request changes, see monthly reports, upload files, and communicate with our team. It is included with every plan.",
  },
  {
    q: "Do you work with businesses outside of Michigan?",
    a: "Yes. While we are based in Muskegon, Michigan, we work with small businesses across the United States. Everything is handled online through your customer portal.",
  },
  {
    q: "What happens after my 12-month agreement ends?",
    a: "We will reach out before your agreement ends to discuss renewal options. If you choose to continue, your plan renews at the current rate. If not, we will help you with next steps.",
  },
  {
    q: "Do you guarantee results?",
    a: "We do not guarantee specific traffic, revenue, or ranking outcomes. What we do guarantee is a professionally built website, ongoing support, monthly reports, and AI-assisted recommendations to help your site improve over time.",
  },
  {
    q: "What if I already have a website?",
    a: "We can review your existing website during onboarding and recommend whether to redesign, migrate, or start fresh. We will work with you to find the best path forward.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-30" />
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-sans font-medium text-electric uppercase tracking-widest mb-4 block"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif text-off-white leading-tight mb-6"
          >
            Common{" "}
            <span className="text-gradient-electric">questions.</span>
          </motion.h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-xl glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-sans font-medium text-off-white/80 pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-off-white/40 shrink-0 transition-transform duration-300 ${
                    openIdx === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-sm font-sans text-off-white/50 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
