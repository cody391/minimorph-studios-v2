/*
 * FAQ section — trimmed to 8 sharp questions with personality.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Do I own my website?",
    a: "You own your content, branding, and domain — always. The site itself is built and hosted as part of your MiniMorph subscription. If you ever cancel, we'll work with you on transferring your files. No hostage situations.",
  },
  {
    q: "What does \"AI-assisted\" actually mean?",
    a: "It means our AI tools analyze your site performance, spot broken links, flag slow pages, and suggest improvements. But a real human reviews everything before it touches your site. Think of it as a really diligent intern that never sleeps.",
  },
  {
    q: "How long until I see my first draft?",
    a: "Usually 2–4 weeks after you finish onboarding. The biggest variable is you — the faster you upload your content and answer our questionnaire, the faster we start building. We won't start guessing what your business does.",
  },
  {
    q: "What if I need ecommerce?",
    a: "Online stores, product catalogs, and payment integrations need our Commerce package or a custom quote. We'll figure out the right fit during onboarding — no surprise invoices after you've already committed.",
  },
  {
    q: "Can I cancel early?",
    a: "Plans are 12-month agreements. If something changes, reach out and we'll talk through your options like adults. Setup fees are non-refundable once work begins, and monthly fees are billed in advance.",
  },
  {
    q: "What's the customer portal?",
    a: "It's your home base — project status, support tickets, monthly reports, file uploads, AI recommendations, and direct communication with our team. Every plan includes it. You'll use it more than you think.",
  },
  {
    q: "Do you work outside Michigan?",
    a: "We're based in Muskegon, but we work with businesses across the entire US. Everything runs through your portal — no in-person meetings required (though we're always up for coffee if you're local).",
  },
  {
    q: "Do you guarantee results?",
    a: "We don't promise specific traffic numbers or revenue targets — anyone who does is lying. What we do guarantee: a professionally built site, monthly maintenance, real reports, and AI-powered recommendations that get smarter over time.",
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
            The stuff you're{" "}
            <span className="text-gradient-electric">actually wondering.</span>
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
