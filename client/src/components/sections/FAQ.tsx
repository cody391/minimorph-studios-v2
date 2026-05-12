/*
 * FAQ section — trimmed to 8 sharp questions with personality.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Do I own my website?",
    a: "You own your content, branding, and domain — always. The site itself is built and hosted as part of your MiniMorph Studios subscription. If you ever cancel, we'll work with you on transferring your files. No hostage situations.",
  },
  {
    q: "How do you keep my site updated each month?",
    a: "Our team runs monthly maintenance on every plan — checking for broken links, slow pages, security issues, and anything that needs a fix. You get a report each month showing what was reviewed and what changed.",
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
    a: "Plans are 12-month agreements. If something changes, reach out and we'll talk through your options like adults. Your first month's payment is non-refundable once work begins, and monthly fees are billed in advance. You can cancel future monthly service from your Customer Portal.",
  },
  {
    q: "What's the customer portal?",
    a: "It's your home base — project status, support tickets, monthly reports, file uploads, performance recommendations, and direct communication with our team. Every plan includes it. You'll use it more than you think.",
  },
  {
    q: "Do you work with businesses outside the US?",
    a: "Yes — MiniMorph Studios works with businesses worldwide. Our process is fully remote and digital from day one. You'll have a dedicated portal, direct access to support, and regular progress updates no matter where you're located.",
  },
  {
    q: "Do you guarantee results?",
    a: "We don't promise specific traffic numbers or revenue targets — anyone who does is lying. What we do guarantee: a professionally built site, monthly maintenance, real reports, and performance recommendations from our team each month.",
  },
  {
    q: "Is there a setup fee?",
    a: "There's no separate setup fee — your first month's payment covers the build, design, and launch. What you pay per month is what you pay every month. No surprise invoices, no gotchas.",
  },
  {
    q: "How is this different from Wix or Squarespace?",
    a: "Wix and Squarespace give you a tool and leave you to figure it out. We handle it for you. We build the site, maintain it every month, provide real analytics, data-driven recommendations, and responsive support. You never touch a template — we handle everything.",
  },
  {
    q: "What happens when my 12-month agreement ends?",
    a: "After your 12 months, you can cancel with 30 days' written notice — no penalty, no runaround. Early cancellation requires payment of remaining months in the agreement. Your content and domain are always yours to take with you.",
  },
  {
    q: "What add-ons do you offer?",
    a: "We have 15+ optional add-ons — from booking widgets and AI chatbots to review collectors, event calendars, live chat, and email marketing. Elena recommends the right ones for your specific business during onboarding. You only pay for what you actually add.",
  },
  {
    q: "Do I have to pick add-ons upfront?",
    a: "No. You can add them anytime through your customer portal — before launch, after launch, whenever you're ready. Elena will walk you through the options that make sense for your business type. There's no pressure to decide on day one.",
  },
  {
    q: "What's included in every plan?",
    a: "Every plan includes SSL certificate, enterprise hosting on Cloudflare CDN, mobile-responsive design, Google Analytics setup, SEO foundation (meta tags, sitemap, schema markup), monthly performance reports, up to 3 revision rounds before launch, and ongoing monthly change requests. No setup fee on any plan.",
  },
  {
    q: "Can I cancel my add-ons?",
    a: "Monthly add-ons can be cancelled with 30 days notice after your first 3 months. One-time add-ons (like logo design or copywriting) are non-refundable once work has started. Your core plan runs on a 12-month agreement.",
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
