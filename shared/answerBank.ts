/**
 * MiniMorph Studios — AI Answer Bank
 *
 * 20+ pre-classified questions the onboarding AI and portal AI can answer
 * with confidence. Each entry includes:
 *   - question pattern (for matching)
 *   - classification: "answer" | "escalate" | "redirect"
 *   - approved answer text (legal-safe, no guarantees)
 *   - escalation reason (if applicable)
 */

export interface AnswerBankEntry {
  id: string;
  patterns: string[]; // keywords / phrases that trigger this entry
  classification: "answer" | "escalate" | "redirect";
  category: "pricing" | "process" | "technical" | "legal" | "support" | "ecommerce" | "integrations";
  question: string; // canonical form of the question
  answer: string; // approved response
  escalationReason?: string; // why this needs a human
  redirectTo?: string; // URL or action to redirect to
}

export const ANSWER_BANK: AnswerBankEntry[] = [
  // ── PRICING ─────────────────────────────────────────────────────────
  {
    id: "pricing_starter",
    patterns: ["how much", "starter price", "cheapest plan", "starter package", "lowest price", "basic plan"],
    classification: "answer",
    category: "pricing",
    question: "How much does the Starter plan cost?",
    answer:
      "The Starter plan is $150/month with a $500 one-time setup fee. It includes up to 5 pages, mobile-responsive design, a contact/quote form, basic SEO, customer portal access, a monthly performance report, 1 content update per month, and email support. All plans require a 12-month commitment billed monthly.",
  },
  {
    id: "pricing_growth",
    patterns: ["growth price", "growth plan", "middle plan", "growth package"],
    classification: "answer",
    category: "pricing",
    question: "How much does the Growth plan cost?",
    answer:
      "The Growth plan is $250/month with a $750 one-time setup fee. It includes everything in Starter plus up to 10 pages, a blog or news section, Google Analytics setup, 2 content updates per month, AI-assisted recommendations, priority email support, and access to add-on integrations.",
  },
  {
    id: "pricing_pro",
    patterns: ["pro price", "pro plan", "premium plan", "pro package", "premium price"],
    classification: "answer",
    category: "pricing",
    question: "How much does the Pro plan cost?",
    answer:
      "The Pro plan is $400/month with a $1,000 one-time setup fee. It includes everything in Growth plus up to 20 pages, advanced SEO pages, 4 content updates per month, review widget setup, booking integration, SMS lead alerts, and priority support with faster response times.",
  },
  {
    id: "pricing_commerce",
    patterns: ["ecommerce price", "commerce plan", "online store cost", "ecommerce package", "sell products"],
    classification: "escalate",
    category: "pricing",
    question: "How much does an ecommerce website cost?",
    answer:
      "Ecommerce websites require a custom quote because pricing depends on your product count, shipping needs, payment processing, and inventory requirements. We will review your specific needs and provide a tailored proposal. Our team will reach out within 1 business day.",
    escalationReason: "Ecommerce projects require custom scoping based on product count, integrations, and complexity.",
  },
  {
    id: "pricing_setup_fee",
    patterns: ["setup fee", "one-time fee", "upfront cost", "initial cost", "why setup fee"],
    classification: "answer",
    category: "pricing",
    question: "What is the setup fee for?",
    answer:
      "The one-time setup fee covers the initial design, development, and launch of your website. This includes custom design work, content setup, SEO configuration, form integrations, and quality assurance testing before your site goes live. After launch, your monthly fee covers ongoing maintenance, updates, hosting, and support.",
  },
  {
    id: "pricing_contract",
    patterns: ["contract length", "how long", "cancel", "cancellation", "12 month", "commitment"],
    classification: "answer",
    category: "pricing",
    question: "How long is the contract?",
    answer:
      "All plans require a 12-month commitment billed monthly. This allows us to properly build, launch, and continuously improve your website over time. After the initial 12 months, you can renew on a month-to-month basis or sign a new annual agreement.",
  },

  // ── PROCESS ─────────────────────────────────────────────────────────
  {
    id: "process_timeline",
    patterns: ["how long to build", "timeline", "when will my site be ready", "turnaround", "how fast"],
    classification: "answer",
    category: "process",
    question: "How long does it take to build my website?",
    answer:
      "Most websites are ready for review within 2-3 weeks after you complete the onboarding questionnaire and upload your assets. The exact timeline depends on the complexity of your project and how quickly you provide feedback during the review phase. Ecommerce and custom projects may take longer.",
  },
  {
    id: "process_revisions",
    patterns: ["revisions", "changes", "how many changes", "revision policy", "not happy with design"],
    classification: "answer",
    category: "process",
    question: "How many revisions do I get?",
    answer:
      "Every project includes 3 rounds of revisions at no additional cost. Each round allows you to request changes to layout, colors, content, and functionality. If you need additional revision rounds beyond the included 3, they are available at $149 per round.",
  },
  {
    id: "process_after_launch",
    patterns: ["after launch", "what happens next", "after my site is live", "post-launch", "monthly updates"],
    classification: "answer",
    category: "process",
    question: "What happens after my website launches?",
    answer:
      "After launch, your monthly plan kicks in. You get access to your customer portal where you can view performance reports, request content updates, and communicate with our team. We handle hosting, security updates, backups, and ongoing maintenance. You also receive monthly performance reports and AI-assisted recommendations to improve your site.",
  },
  {
    id: "process_content",
    patterns: ["write content", "copywriting", "who writes", "content creation", "do I need to write"],
    classification: "answer",
    category: "process",
    question: "Do I need to write my own website content?",
    answer:
      "You have three options: we can write all the content for you based on your business information, you can provide your own content, or we can work together with a mix of both. During onboarding, you will choose your preference. If we write the content, we will create professional copy based on your brand tone and target audience.",
  },

  // ── TECHNICAL ───────────────────────────────────────────────────────
  {
    id: "tech_hosting",
    patterns: ["hosting", "where is my site hosted", "server", "uptime", "do I need hosting"],
    classification: "answer",
    category: "technical",
    question: "Is hosting included?",
    answer:
      "Yes, hosting is included in all plans at no extra cost. Your website is hosted on modern cloud infrastructure with SSL certificates, automatic backups, and security monitoring. You do not need to purchase separate hosting.",
  },
  {
    id: "tech_domain",
    patterns: ["domain", "domain name", "custom domain", "do I need a domain", "buy domain"],
    classification: "answer",
    category: "technical",
    question: "Do I need my own domain name?",
    answer:
      "If you already have a domain, we will connect it to your new website. If you need a new domain, we can help you register one. Domain registration is free for the first year on Growth and Pro plans, and $15/year on the Starter plan. During onboarding, you will tell us whether you have an existing domain, need a new one, or are not sure yet.",
  },
  {
    id: "tech_seo",
    patterns: ["seo", "search engine", "google ranking", "will I rank", "organic traffic"],
    classification: "answer",
    category: "technical",
    question: "Will my website be optimized for search engines?",
    answer:
      "Yes, all plans include SEO setup. The Starter plan includes basic SEO (meta tags, site structure, mobile optimization). Growth adds Google Analytics setup. Pro includes advanced SEO pages with structured data and content optimization. While we set up your site for search engine success, rankings depend on many factors including your industry competition, content quality, and ongoing SEO efforts.",
  },
  {
    id: "tech_mobile",
    patterns: ["mobile", "responsive", "phone", "tablet", "mobile friendly"],
    classification: "answer",
    category: "technical",
    question: "Will my website work on mobile devices?",
    answer:
      "Absolutely. Every website we build is fully responsive and mobile-optimized from the start. Your site will look and function well on smartphones, tablets, laptops, and desktop computers.",
  },

  // ── INTEGRATIONS ────────────────────────────────────────────────────
  {
    id: "integrations_booking",
    patterns: ["booking", "appointments", "scheduling", "calendar", "book online"],
    classification: "answer",
    category: "integrations",
    question: "Can I add online booking to my website?",
    answer:
      "Yes. Booking integration is included in the Pro plan. For Starter and Growth plans, it is available as a popular add-on. We integrate with major booking platforms to let your customers schedule appointments directly from your website.",
  },
  {
    id: "integrations_payment",
    patterns: ["payment", "accept payments", "credit card", "stripe", "paypal"],
    classification: "escalate",
    category: "integrations",
    question: "Can I accept payments on my website?",
    answer:
      "Payment processing is available but requires a custom quote to ensure we set up the right solution for your business. This could range from a simple payment button to a full ecommerce checkout system. Our team will review your specific needs and provide a tailored proposal.",
    escalationReason: "Payment processing requires custom scoping based on business type, volume, and compliance requirements.",
  },
  {
    id: "integrations_social",
    patterns: ["social media", "instagram", "facebook", "social feed", "social integration"],
    classification: "answer",
    category: "integrations",
    question: "Can you integrate my social media?",
    answer:
      "Yes, social media integration is included in all plans. We can add social media links, embed your Instagram or Facebook feed, and set up social sharing buttons. More advanced social integrations like automated posting or social login are available as add-ons.",
  },

  // ── ECOMMERCE ───────────────────────────────────────────────────────
  {
    id: "ecommerce_products",
    patterns: ["how many products", "product limit", "product count", "100 products", "large catalog"],
    classification: "escalate",
    category: "ecommerce",
    question: "How many products can my online store have?",
    answer:
      "The number of products affects the complexity and pricing of your ecommerce build. Small catalogs (under 25 products) are simpler to set up, while larger catalogs (50+ products) require more sophisticated inventory management, search, and filtering. We will review your product count during onboarding and provide a custom quote that fits your needs.",
    escalationReason: "Product count directly impacts project scope, infrastructure needs, and pricing.",
  },
  {
    id: "ecommerce_migration",
    patterns: ["migrate", "migration", "move from shopify", "switch platform", "existing store", "transfer"],
    classification: "escalate",
    category: "ecommerce",
    question: "Can you migrate my existing online store?",
    answer:
      "Yes, we can help migrate your existing store, but platform migrations require careful planning to preserve your product data, customer information, and SEO rankings. This requires a custom quote based on your current platform, product count, and data complexity. Our team will assess the migration scope and provide a detailed proposal.",
    escalationReason: "Platform migrations involve data transfer, SEO preservation, and potential downtime that require custom scoping.",
  },

  // ── SUPPORT ─────────────────────────────────────────────────────────
  {
    id: "support_contact",
    patterns: ["contact", "reach you", "get in touch", "email", "support"],
    classification: "answer",
    category: "support",
    question: "How do I contact MiniMorph Studios?",
    answer:
      "You can reach us by email at hello@minimorphstudios.com. Once you are a customer, you also have access to your customer portal where you can submit support requests, view your project status, and communicate with our team directly.",
  },
  {
    id: "support_updates",
    patterns: ["update my site", "change content", "edit website", "make changes", "content update"],
    classification: "answer",
    category: "support",
    question: "How do I request changes to my website?",
    answer:
      "You can request content updates through your customer portal. The number of updates included depends on your plan: Starter includes 1 per month, Growth includes 2 per month, and Pro includes 4 per month. Updates are typically completed within 2-3 business days.",
  },

  // ── LEGAL ───────────────────────────────────────────────────────────
  {
    id: "legal_ownership",
    patterns: ["own my website", "ownership", "who owns", "my content", "intellectual property"],
    classification: "answer",
    category: "legal",
    question: "Do I own my website?",
    answer:
      "You own all the content you provide (text, images, logos). The website design and code are licensed to you for the duration of your contract. If you cancel, you retain ownership of your content and domain name. Specific terms are outlined in our Terms of Service.",
  },
  {
    id: "legal_guarantee",
    patterns: ["guarantee", "money back", "refund", "not satisfied", "what if I don't like"],
    classification: "escalate",
    category: "legal",
    question: "Is there a money-back guarantee?",
    answer:
      "We are committed to building a website you are happy with, which is why we include 3 rounds of revisions in every project. If you have concerns about the direction of your project, please reach out to our team so we can address them. Specific refund terms are outlined in our Terms of Service.",
    escalationReason: "Refund and guarantee questions require human review to assess the specific situation.",
  },
];

/**
 * Find matching answer bank entries for a user message.
 * Returns entries sorted by relevance (number of pattern matches).
 */
export function findAnswers(message: string): AnswerBankEntry[] {
  const lower = message.toLowerCase();
  const scored = ANSWER_BANK.map((entry) => {
    const matchCount = entry.patterns.filter((p) => lower.includes(p)).length;
    return { entry, matchCount };
  })
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
  return scored.map((s) => s.entry);
}

/**
 * Format answer bank context for injection into AI system prompt.
 */
export function formatAnswerBankForPrompt(): string {
  const sections: Record<string, AnswerBankEntry[]> = {};
  for (const entry of ANSWER_BANK) {
    if (!sections[entry.category]) sections[entry.category] = [];
    sections[entry.category].push(entry);
  }

  let prompt = "== ANSWER BANK (use these approved answers when customers ask these questions) ==\n\n";
  for (const [category, entries] of Object.entries(sections)) {
    prompt += `--- ${category.toUpperCase()} ---\n`;
    for (const entry of entries) {
      prompt += `Q: ${entry.question}\n`;
      prompt += `Classification: ${entry.classification}\n`;
      prompt += `A: ${entry.answer}\n`;
      if (entry.classification === "escalate") {
        prompt += `⚠️ ESCALATE: ${entry.escalationReason}\n`;
      }
      prompt += "\n";
    }
  }
  return prompt;
}
