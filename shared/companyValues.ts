/**
 * ═══════════════════════════════════════════════════════
 * MINIMORPH STUDIOS — COMPANY VALUES & ETHICS
 * Single source of truth. Every touchpoint in the company
 * references this file. No exceptions.
 * ═══════════════════════════════════════════════════════
 */

export interface CoreValue {
  id: string;
  title: string;
  description: string;
  /** One-line version for badges, tooltips, and quick references */
  shortForm: string;
  /** How this value shows up in daily sales work */
  inPractice: string[];
  /** Red flags that violate this value */
  violations: string[];
  /** Icon name (Lucide) */
  icon: string;
}

export const CORE_VALUES: CoreValue[] = [
  {
    id: "integrity-first",
    title: "Integrity First",
    description:
      "We never misrepresent our product, overpromise results, or pressure anyone into a purchase. Our reputation is built on honesty — one conversation at a time.",
    shortForm: "Honesty in every interaction, no exceptions.",
    inPractice: [
      "Accurately describe what MiniMorph can and cannot do",
      "Never fabricate testimonials, statistics, or results",
      "Admit mistakes immediately and work to fix them",
      "If a prospect isn't a good fit, tell them honestly",
    ],
    violations: [
      "Exaggerating product capabilities to close a deal",
      "Hiding limitations or known issues from prospects",
      "Making guarantees the company can't back up",
      "Lying about competitor weaknesses",
    ],
    icon: "Shield",
  },
  {
    id: "client-obsession",
    title: "Client Obsession",
    description:
      "Every business we serve is someone's livelihood. We treat their goals as our own. If our product isn't the right fit, we say so.",
    shortForm: "Their success is our success.",
    inPractice: [
      "Ask questions first, pitch second — understand their real needs",
      "Recommend the tier that actually fits, not the most expensive one",
      "Follow up after the sale to ensure they're getting value",
      "Go the extra mile on support — it's their business on the line",
    ],
    violations: [
      "Upselling features a client doesn't need",
      "Ignoring client concerns to protect a commission",
      "Treating small clients as less important than big ones",
      "Disappearing after the sale is closed",
    ],
    icon: "Heart",
  },
  {
    id: "radical-transparency",
    title: "Radical Transparency",
    description:
      "No hidden fees, no bait-and-switch, no fine print tricks. We tell clients exactly what they're getting, what it costs, and what to expect.",
    shortForm: "What you see is what you get.",
    inPractice: [
      "Quote the full price upfront — no surprise charges later",
      "Explain the timeline honestly, including potential delays",
      "Share both the strengths and limitations of each tier",
      "If something goes wrong, communicate immediately — don't hide it",
    ],
    violations: [
      "Burying costs in fine print or add-ons",
      "Quoting a low price and adding charges later",
      "Withholding information that would affect a buying decision",
      "Using confusing language to obscure terms",
    ],
    icon: "Eye",
  },
  {
    id: "ethical-selling",
    title: "Ethical Selling",
    description:
      "We sell solutions, not fear. We educate, not manipulate. Our sales process is consultative — we help businesses make informed decisions.",
    shortForm: "Educate, don't manipulate.",
    inPractice: [
      "Use discovery questions to understand needs before recommending",
      "Never create false urgency or fake scarcity",
      "Respect when a prospect says no — don't badger them",
      "Position yourself as an advisor, not a pushy salesperson",
    ],
    violations: [
      "Using high-pressure tactics or manufactured deadlines",
      "Exploiting a prospect's fear or insecurity to close",
      "Refusing to take no for an answer",
      "Trashing competitors instead of highlighting our strengths",
    ],
    icon: "Scale",
  },
  {
    id: "trustworthy-representation",
    title: "Trustworthy Representation",
    description:
      "You carry our brand into every meeting. Clients judge MiniMorph by you. We need people who make us proud — not people we have to worry about.",
    shortForm: "You are MiniMorph to every client you meet.",
    inPractice: [
      "Present yourself professionally in every interaction",
      "Be punctual, prepared, and responsive",
      "If you don't know the answer, say so and follow up",
      "Protect client data and company information",
    ],
    violations: [
      "Making up answers to questions you don't know",
      "Being unprepared for client meetings",
      "Sharing confidential company or client information",
      "Behaving unprofessionally in any client-facing context",
    ],
    icon: "Handshake",
  },
  {
    id: "brand-stewardship",
    title: "Brand Stewardship",
    description:
      "MiniMorph's reputation is bigger than any one person. Every interaction you have either builds or erodes the brand. Protect it like it's your own.",
    shortForm: "The brand is everything — protect it.",
    inPractice: [
      "Treat every client interaction as a reflection of the entire company",
      "Report issues or concerns immediately — don't let problems fester",
      "Follow established processes and scripts — they exist for a reason",
      "Continuously improve through training and self-assessment",
    ],
    violations: [
      "Doing anything that damages MiniMorph's reputation",
      "Ignoring company processes or cutting corners",
      "Failing to report known issues or client complaints",
      "Representing yourself as independent from MiniMorph to clients",
    ],
    icon: "Users",
  },
];

/**
 * The MiniMorph Code of Conduct — referenced in NDA, Rep Agreement,
 * Academy training, and assessment scoring.
 */
export const CODE_OF_CONDUCT = `MINIMORPH STUDIOS — CODE OF CONDUCT

As a MiniMorph representative, you are the face of our company. Every interaction you have reflects on our brand, our team, and the businesses that trust us. This code of conduct is not a suggestion — it is a condition of your engagement.

1. INTEGRITY IN EVERY INTERACTION
Never misrepresent our product, fabricate results, or make promises we can't keep. If you don't know the answer, say "I'll find out" — never make something up. Honesty is not optional.

2. CLIENT-FIRST DECISION MAKING
Every recommendation you make should be in the client's best interest, not yours. If MiniMorph isn't the right fit for a prospect, tell them. A declined sale today builds a reputation that generates referrals for years.

3. TRANSPARENT COMMUNICATION
Quote the full price. Explain the real timeline. Share both strengths and limitations. No hidden fees, no bait-and-switch, no fine print tricks. Clients deserve to make informed decisions.

4. ETHICAL SALES PRACTICES
We sell solutions, not fear. We educate, not manipulate. Never create false urgency, exploit insecurities, or use high-pressure tactics. Our sales process is consultative — we help businesses decide what's right for them.

5. PROFESSIONAL REPRESENTATION
You carry our brand into every meeting, call, and email. Be punctual, prepared, and responsive. Protect client data and company information. Present yourself in a way that makes the team proud.

6. BRAND STEWARDSHIP
MiniMorph's reputation is bigger than any one person. Every interaction you have either builds or erodes the brand. Follow established processes, report issues immediately, and continuously improve through training. Protect the brand like it's your own.

VIOLATIONS
Breach of this code may result in immediate termination. Specific violations include but are not limited to:
- Misrepresenting MiniMorph's capabilities or pricing
- Using deceptive or high-pressure sales tactics
- Sharing confidential client or company information
- Discriminatory, harassing, or unprofessional behavior
- Falsifying reports, metrics, or client communications
- Competing directly with MiniMorph during engagement

This code is incorporated by reference into your NDA, Rep Agreement, and all training materials.`;

/**
 * Company mission statement — used in Values Gate and Academy Module 0
 */
export const COMPANY_MISSION =
  "MiniMorph Studios builds beautiful, intelligent websites that help small and medium businesses grow — powered by AI, delivered by people of integrity. We believe that every business deserves a premium digital presence, and every client deserves a representative they can trust completely.";

/**
 * The "Why We're Different" statement — used in Values Gate and training
 */
export const CULTURE_STATEMENT =
  "We're an AI-driven company that runs a tight ship. Smart technology deserves smart people — people who are honest, driven, and genuinely care about the businesses they serve. We pay extremely well because we expect extremely high standards. This isn't a gig — it's a career for people who want to build something they're proud of.";

/**
 * Maps each core value to the assessment question categories that test it.
 * Used to ensure assessment coverage and to display value alignment in results.
 */
export const VALUE_TO_ASSESSMENT_MAP: Record<string, string[]> = {
  "integrity-first": ["Integrity", "Brand Representation"],
  "client-obsession": ["Empathy & Professionalism", "Client Advocacy"],
  "radical-transparency": ["Transparency", "Value vs. Price"],
  "ethical-selling": ["Value vs. Price", "Ethical Boundaries"],
  "trustworthy-representation": ["Brand Representation", "Professionalism"],
  "brand-stewardship": ["Brand Representation", "Brand Protection", "Professionalism"],
};

/**
 * Maps each core value to the academy modules that reinforce it.
 */
export const VALUE_TO_ACADEMY_MAP: Record<string, string[]> = {
  "integrity-first": ["values-ethics", "product-mastery"],
  "client-obsession": ["values-ethics", "discovery-call", "account-management"],
  "radical-transparency": ["values-ethics", "product-mastery", "closing-techniques"],
  "ethical-selling": ["values-ethics", "psychology-selling", "objection-handling"],
  "trustworthy-representation": ["values-ethics", "digital-prospecting"],
  "brand-stewardship": ["values-ethics", "product-mastery"],
};

export function getValueById(id: string): CoreValue | undefined {
  return CORE_VALUES.find((v) => v.id === id);
}

export function getAllValueTitles(): string[] {
  return CORE_VALUES.map((v) => v.title);
}

export function getAllValueIds(): string[] {
  return CORE_VALUES.map((v) => v.id);
}
