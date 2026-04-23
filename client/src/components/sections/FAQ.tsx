/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * FAQ: Clean accordion with warm styling. Addresses common objections.
 */
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What does the 12-month contract include?",
    answer:
      "Every contract includes your custom website design and build, ongoing AI-managed support, monthly performance reports, proactive check-ins, update requests, and renewal assistance. You're never left alone after launch — we're with you for the full journey.",
  },
  {
    question: "How does the AI support system work?",
    answer:
      "After your website launches, our AI agents take over the operational relationship. They check in with you regularly, manage update requests, monitor performance, identify upgrade opportunities, and ensure you're getting maximum value from your website. Think of it as a dedicated digital account manager that never sleeps.",
  },
  {
    question: "Can I customize my website after it's built?",
    answer:
      "Absolutely. Your plan includes update requests that our team handles for you. Whether you need content changes, new pages, or design tweaks, simply submit a request and we'll take care of it. Premium plans include unlimited update requests.",
  },
  {
    question: "What happens when my contract ends?",
    answer:
      "Before your contract expires, our AI system proactively reaches out to discuss renewal options. We'll review your site's performance, suggest improvements for the next year, and make the renewal process seamless. Most of our clients choose to continue because they see ongoing value.",
  },
  {
    question: "Do I own my website?",
    answer:
      "Yes. You own all the content and design assets created for your website. If you choose not to renew, we'll provide all files and assist with any transition you need.",
  },
  {
    question: "How long does it take to build my website?",
    answer:
      "Most websites are designed, built, and launched within 2-4 weeks depending on the complexity of your plan. Our guided process ensures we capture your vision quickly and deliver a site you're proud of.",
  },
  {
    question: "What makes MiniMorph different from other web agencies?",
    answer:
      "We're not just a web agency — we're a full lifecycle system. Most agencies build your site and disappear. We build, support, nurture, report, upgrade, and renew. Our AI-powered approach means you get consistent, proactive service at a fraction of the cost of a traditional agency.",
  },
];

export default function FAQ() {
  return (
    <section className="py-24 lg:py-32 bg-warm-white">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14 lg:mb-18">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block"
            >
              Common Questions
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight"
            >
              Everything you need
              <br />
              <span className="italic">to know</span>
            </motion.h2>
          </div>

          {/* Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-border/50 rounded-xl px-6 data-[state=open]:bg-card data-[state=open]:shadow-sm transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-sans font-medium text-forest hover:text-forest/80 py-5 text-base [&[data-state=open]>svg]:text-terracotta">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-forest/60 font-sans leading-relaxed pb-5 text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
