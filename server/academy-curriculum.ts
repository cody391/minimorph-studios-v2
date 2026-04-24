/**
 * ═══════════════════════════════════════════════════════
 * MINIMORPH STUDIOS — ELITE SALES TRAINING ACADEMY
 * Complete curriculum for turning reps into psychological
 * selling machines who close every deal.
 * ═══════════════════════════════════════════════════════
 */

export interface LessonContent {
  title: string;
  content: string; // Rich markdown content
  keyTakeaways: string[];
  script?: string; // Sales script to memorize
  rolePlay?: string; // Role-play scenario
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "scenario" | "open_ended";
  options?: string[];
  correctAnswer: number | string; // index for MC, text for scenario
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  estimatedMinutes: number;
  lessons: LessonContent[];
  quiz: QuizQuestion[];
  passingScore: number; // percentage
}

export const ACADEMY_MODULES: AcademyModule[] = [
  /* ═══════════════════════════════════════════════════
     MODULE 0: VALUES & ETHICS (MANDATORY FIRST)
     Every rep must complete this before any other training.
     ═══════════════════════════════════════════════════ */
  {
    id: "values-ethics",
    title: "Values & Ethics: The MiniMorph Standard",
    description: "This is the most important module in the entire academy. Before you learn a single sales technique, you need to understand WHO we are, WHAT we stand for, and WHY we hold every representative to the highest standard. If you can't live these values, nothing else matters.",
    icon: "Shield",
    estimatedMinutes: 30,
    lessons: [
      {
        title: "Why Values Come First",
        content: `## Before You Sell a Single Thing

Most sales training starts with techniques, scripts, and closing strategies. We don't.

We start here — with values — because MiniMorph is not a typical sales organization. We are an AI-driven company that runs a tight ship. Smart technology deserves smart people. People who are honest, driven, and genuinely care about the businesses they serve.

### The MiniMorph Difference

We pay extremely well because we expect extremely high standards. This isn't a gig — it's a career for people who want to build something they're proud of.

But here's the thing: **we will remove anyone who doesn't live up to these standards.** Not because we're harsh — because our clients deserve better, and so do you. Every rep who cuts corners makes it harder for every honest rep to earn trust.

### How This Module Works

You'll learn our six core values, see exactly what they look like in practice, understand what violates them, and take a quiz that you must pass with 90% or higher. This isn't a formality — it's a filter.

> "The way you do anything is the way you do everything." — This is our operating principle.`,
        keyTakeaways: [
          "Values training comes before all other training at MiniMorph",
          "High pay comes with high standards — no exceptions",
          "Every rep who cuts corners hurts every other rep's ability to earn trust",
          "You must pass this module with 90%+ before accessing any other training"
        ]
      },
      {
        title: "The Six Core Values",
        content: `## The Foundation Everything Else Is Built On

These six values aren't corporate buzzwords on a poster. They are the operating system of this company. Every decision you make as a rep should pass through these filters.

### 1. Integrity First
**"Honesty in every interaction, no exceptions."**

We never misrepresent our product, overpromise results, or pressure anyone into a purchase. Our reputation is built on honesty — one conversation at a time.

**In practice:**
- Accurately describe what MiniMorph can and cannot do
- Never fabricate testimonials, statistics, or results
- Admit mistakes immediately and work to fix them
- If a prospect isn't a good fit, tell them honestly

**Red flags (will get you removed):**
- Exaggerating product capabilities to close a deal
- Making guarantees the company can't back up
- Lying about competitor weaknesses

---

### 2. Client Obsession
**"Their success is our success."**

Every business we serve is someone's livelihood. We treat their goals as our own. If our product isn't the right fit, we say so.

**In practice:**
- Ask questions first, pitch second — understand their real needs
- Recommend the tier that actually fits, not the most expensive one
- Follow up after the sale to ensure they're getting value
- Go the extra mile on support — it's their business on the line

**Red flags:**
- Upselling features a client doesn't need
- Ignoring client concerns to protect a commission
- Disappearing after the sale is closed

---

### 3. Radical Transparency
**"What you see is what you get."**

No hidden fees, no bait-and-switch, no fine print tricks. We tell clients exactly what they're getting, what it costs, and what to expect.

**In practice:**
- Quote the full price upfront — no surprise charges later
- Explain the timeline honestly, including potential delays
- Share both the strengths and limitations of each tier
- If something goes wrong, communicate immediately

**Red flags:**
- Burying costs in fine print or add-ons
- Withholding information that would affect a buying decision

---

### 4. Ethical Selling
**"Educate, don't manipulate."**

We sell solutions, not fear. We educate, not manipulate. Our sales process is consultative — we help businesses make informed decisions.

**In practice:**
- Use discovery questions to understand needs before recommending
- Never create false urgency or fake scarcity
- Respect when a prospect says no — don't badger them
- Position yourself as an advisor, not a pushy salesperson

**Red flags:**
- Using high-pressure tactics or manufactured deadlines
- Exploiting a prospect's fear or insecurity to close
- Refusing to take no for an answer

---

### 5. Trustworthy Representation
**"You are MiniMorph to every client you meet."**

You carry our brand into every meeting. Clients judge MiniMorph by you. We need people who make us proud.

**In practice:**
- Present yourself professionally in every interaction
- Be punctual, prepared, and responsive
- If you don't know the answer, say so and follow up
- Protect client data and company information

**Red flags:**
- Making up answers to questions you don't know
- Being unprepared for client meetings
- Sharing confidential company or client information

---

### 6. Brand Stewardship
**"The brand is everything — protect it."**

MiniMorph's reputation is bigger than any one person. Every interaction you have either builds or erodes the brand. Protect it like it's your own.

**In practice:**
- Treat every client interaction as a reflection of the entire company
- Report issues or concerns immediately — don't let problems fester
- Follow established processes and scripts — they exist for a reason
- Continuously improve through training and self-assessment

**Red flags:**
- Doing anything that damages MiniMorph's reputation
- Ignoring company processes or cutting corners
- Failing to report known issues or client complaints`,
        keyTakeaways: [
          "Integrity First: Never misrepresent, overpromise, or pressure",
          "Client Obsession: Their success is your success — recommend what's right, not what pays most",
          "Radical Transparency: Full price upfront, honest timelines, no hidden anything",
          "Ethical Selling: Educate and advise, never manipulate or create false urgency",
          "Trustworthy Representation: You ARE MiniMorph to every client — be prepared and professional",
          "Brand Stewardship: The brand is bigger than you — protect it, report issues, follow processes"
        ]
      },
      {
        title: "The Code of Conduct",
        content: `## Your Binding Agreement

The MiniMorph Code of Conduct is not a guideline — it's a condition of your engagement. You signed it in your NDA. Now let's make sure you understand every word.

### What the Code Requires

1. **Integrity in Every Interaction** — Never misrepresent, fabricate, or make promises we can't keep. If you don't know, say "I'll find out."

2. **Client-First Decision Making** — Every recommendation should be in the client's best interest. If MiniMorph isn't the right fit, say so. A declined sale today builds referrals for years.

3. **Transparent Communication** — Full price, real timeline, strengths AND limitations. No hidden fees, no bait-and-switch.

4. **Ethical Sales Practices** — Solutions, not fear. Education, not manipulation. No false urgency, no exploiting insecurities.

5. **Professional Representation** — Be punctual, prepared, responsive. Protect data. Present yourself in a way that makes the company proud.

6. **Brand Stewardship** — Every interaction builds or erodes the brand. Follow processes, report issues, keep improving.

### Violations That Lead to Immediate Removal

- Misrepresenting MiniMorph's capabilities or pricing
- Using deceptive or high-pressure sales tactics
- Sharing confidential client or company information
- Discriminatory, harassing, or unprofessional behavior
- Falsifying reports, metrics, or client communications
- Competing directly with MiniMorph during engagement

### The AI Is Watching

MiniMorph uses AI to monitor client interactions for values compliance. This isn't surveillance — it's quality assurance. The system flags potential issues automatically, and repeated violations trigger the strike system.

> Think of it like this: the AI is your quality coach. It catches things before they become problems. Good reps love it because it proves they're doing the right thing.`,
        keyTakeaways: [
          "The Code of Conduct is binding — you signed it in your NDA",
          "Six requirements: integrity, client-first, transparency, ethical selling, professional representation, brand stewardship",
          "Specific violations lead to immediate removal — no warnings",
          "AI monitors interactions for values compliance — this protects good reps"
        ]
      },
      {
        title: "Values in Real Scenarios",
        content: `## How Values Show Up in Your Daily Work

Let's walk through real scenarios you'll face and see how the values apply.

### Scenario 1: The Tempting Upsell
A small bakery owner needs a basic website. They have a tight budget. Your commission would be 3x higher if you sold them the premium tier.

**Wrong move:** Push the premium tier by emphasizing features they'll "grow into."
**Right move:** Recommend the tier that fits their current needs and budget. Explain that they can upgrade later if their business grows. *This is Client Obsession and Ethical Selling in action.*

### Scenario 2: The Competitor Question
A prospect asks: "What about [Competitor]? They seem cheaper."

**Wrong move:** Trash the competitor with unverified claims about their quality.
**Right move:** Acknowledge the competitor exists, then focus on what makes MiniMorph different — ongoing support, AI-powered design, transparent pricing. Let the prospect decide. *This is Integrity First and Radical Transparency.*

### Scenario 3: The "I Don't Know" Moment
A prospect asks a technical question about SEO integration that you're not sure about.

**Wrong move:** Make up an answer that sounds good.
**Right move:** Say "That's a great question. I want to give you an accurate answer, so let me check with our technical team and get back to you today." *This is Trustworthy Representation.*

### Scenario 4: The Misleading Claim
You see a social media post from someone claiming to be a MiniMorph rep, guaranteeing "10x revenue in 30 days." A client asks you about it.

**Wrong move:** Confirm the claim to avoid losing the deal.
**Right move:** Honestly tell the client that no one can guarantee specific results, explain what MiniMorph actually delivers, and report the misleading post to the company. *This is Brand Stewardship and Integrity First.*

### Scenario 5: The Pressure Play
You're behind on your monthly numbers. A prospect is on the fence. You could create urgency by saying "This price is only available today."

**Wrong move:** Create false urgency to close the deal.
**Right move:** Ask what's holding them back, address their real concerns, and give them space to decide. If they're not ready, schedule a follow-up. *This is Ethical Selling.*`,
        keyTakeaways: [
          "Always recommend what fits the client, not what pays you more",
          "Focus on MiniMorph's strengths instead of trashing competitors",
          "Say 'I'll find out' instead of making up answers",
          "Report brand-damaging behavior immediately",
          "Never create false urgency — address real concerns instead"
        ]
      }
    ],
    quiz: [
      {
        id: "ve-1",
        question: "A prospect's business clearly isn't a good fit for MiniMorph, but closing them would hit your monthly target. What do you do?",
        type: "multiple_choice",
        options: [
          "Close the deal anyway — they'll figure it out",
          "Tell them honestly that we're not the right fit and suggest alternatives",
          "Downplay the mismatch and hope they don't notice",
          "Refer them to a competitor and ask for a referral fee"
        ],
        correctAnswer: 1,
        explanation: "Integrity First and Client Obsession require us to be honest even when it costs us a sale. The right move always builds long-term reputation.",
        difficulty: "easy"
      },
      {
        id: "ve-2",
        question: "Which of the following is NOT one of MiniMorph's six core values?",
        type: "multiple_choice",
        options: [
          "Radical Transparency",
          "Client Obsession",
          "Maximum Revenue",
          "Brand Stewardship"
        ],
        correctAnswer: 2,
        explanation: "'Maximum Revenue' is not a MiniMorph value. Our values are: Integrity First, Client Obsession, Radical Transparency, Ethical Selling, Trustworthy Representation, and Brand Stewardship.",
        difficulty: "easy"
      },
      {
        id: "ve-3",
        question: "A client asks a technical question you don't know the answer to. What's the correct response according to MiniMorph values?",
        type: "multiple_choice",
        options: [
          "Give your best guess — confidence is key in sales",
          "Change the subject to something you do know",
          "Say 'I want to give you an accurate answer — let me check and get back to you today'",
          "Tell them it's not your department"
        ],
        correctAnswer: 2,
        explanation: "Trustworthy Representation means never making up answers. Admitting you don't know and following up builds more trust than a confident guess.",
        difficulty: "easy"
      },
      {
        id: "ve-4",
        question: "You notice a social media post from someone claiming to represent MiniMorph, making guarantees about results that aren't accurate. What should you do?",
        type: "multiple_choice",
        options: [
          "Ignore it — it's not your problem",
          "Report it to the company immediately",
          "Start making similar claims so you're competitive",
          "Comment on the post calling them out publicly"
        ],
        correctAnswer: 1,
        explanation: "Brand Stewardship requires you to report issues that could damage MiniMorph's reputation. Don't ignore it, don't copy it, and don't handle it publicly — report it through proper channels.",
        difficulty: "medium"
      },
      {
        id: "ve-5",
        question: "What does 'Ethical Selling' mean at MiniMorph?",
        type: "multiple_choice",
        options: [
          "Always close the deal, but do it politely",
          "Educate prospects and help them make informed decisions — never manipulate or create false urgency",
          "Only sell to prospects who can afford the premium tier",
          "Follow a strict script without deviation"
        ],
        correctAnswer: 1,
        explanation: "Ethical Selling means we educate, not manipulate. We help businesses make informed decisions. No false urgency, no pressure tactics, no exploiting insecurities.",
        difficulty: "easy"
      },
      {
        id: "ve-6",
        question: "You're behind on your monthly numbers. A prospect is interested but wants to 'think about it.' What's the MiniMorph way to handle this?",
        type: "multiple_choice",
        options: [
          "Tell them the price goes up tomorrow to create urgency",
          "Keep calling them every day until they say yes",
          "Ask what specific concerns they have, address them honestly, and schedule a follow-up",
          "Offer an unauthorized discount to close immediately"
        ],
        correctAnswer: 2,
        explanation: "Ethical Selling and Radical Transparency mean we never create false urgency or pressure. Address real concerns, give them space, and follow up professionally.",
        difficulty: "medium"
      },
      {
        id: "ve-7",
        question: "Why does MiniMorph use AI to monitor client interactions?",
        type: "multiple_choice",
        options: [
          "To micromanage reps and catch them making mistakes",
          "Quality assurance — to flag potential issues before they become problems and protect good reps",
          "To replace human managers entirely",
          "To collect data for selling to third parties"
        ],
        correctAnswer: 1,
        explanation: "AI monitoring is quality assurance, not surveillance. It catches issues early, protects good reps by proving they do the right thing, and maintains brand standards consistently.",
        difficulty: "medium"
      },
      {
        id: "ve-8",
        question: "Which of the following would result in IMMEDIATE removal from MiniMorph?",
        type: "multiple_choice",
        options: [
          "Missing a follow-up call with a prospect",
          "Having a low close rate for one month",
          "Falsifying client communications or reports",
          "Asking a manager for help with a difficult prospect"
        ],
        correctAnswer: 2,
        explanation: "Falsifying reports or client communications is a Code of Conduct violation that leads to immediate removal. Low performance or missed calls are coaching opportunities, not termination events.",
        difficulty: "medium"
      },
      {
        id: "ve-9",
        question: "A prospect asks about a competitor. According to MiniMorph values, how should you respond?",
        type: "scenario",
        options: [
          "Tell them the competitor is terrible and they'll regret choosing them",
          "Acknowledge the competitor, then focus on what makes MiniMorph different — let the prospect decide",
          "Refuse to discuss competitors at all",
          "Offer to match whatever the competitor is charging"
        ],
        correctAnswer: 1,
        explanation: "Integrity First means we don't trash competitors. We acknowledge they exist, highlight our genuine differentiators, and let the prospect make an informed decision.",
        difficulty: "easy"
      },
      {
        id: "ve-10",
        question: "What is the passing score for this Values & Ethics module?",
        type: "multiple_choice",
        options: [
          "60%",
          "70%",
          "80%",
          "90%"
        ],
        correctAnswer: 3,
        explanation: "The Values & Ethics module requires a 90% passing score — higher than any other module. This reflects how seriously MiniMorph takes its values.",
        difficulty: "easy"
      }
    ],
    passingScore: 90 // Higher than other modules — values are non-negotiable
  },
   /* ===================================================
     MODULE 1: PRODUCT MASTERY
     =================================================== */
  {
    id: "product-mastery",
    title: "MiniMorph Product Mastery",
    description: "Know every service, pricing tier, feature, and competitive advantage inside and out. You can't sell what you don't understand.",
    icon: "Package",
    estimatedMinutes: 45,
    lessons: [
      {
        title: "The MiniMorph Value Proposition",
        content: `## Why MiniMorph Exists

Most small businesses know they need a website, but they face three brutal problems:

1. **DIY is overwhelming** — Wix, Squarespace, WordPress all promise "easy" but business owners spend 40+ hours fighting templates, plugins, and hosting. That's 40 hours not running their business.

2. **Agencies are expensive** — A decent custom website from a traditional agency costs $5,000-$25,000+. Most small businesses can't justify that spend.

3. **Nobody maintains it** — Even if they get a site built, it sits there collecting dust. No updates, no SEO, no performance monitoring. Within 6 months it's outdated.

**MiniMorph solves all three.** We handle everything — design, development, hosting, maintenance, and ongoing optimization — for a fraction of agency pricing. The business owner focuses on their business while we make sure their digital presence is always working for them.

### Our Core Promise
> "A beautiful, high-performing website that grows with your business — without you lifting a finger."

### What Makes Us Different
- **AI-powered design** — We use AI to analyze their industry, competitors, and target audience to create sites that actually convert
- **Ongoing optimization** — We don't just build and bail. Monthly reports, SEO updates, performance tuning
- **Dedicated support** — Real humans (you!) as their point of contact, backed by AI that handles the heavy lifting
- **Transparent pricing** — No hidden fees, no surprise invoices, no "that'll be extra"`,
        keyTakeaways: [
          "MiniMorph solves the DIY overwhelm, agency cost, and maintenance abandonment problems",
          "Our core promise: beautiful, high-performing website without the owner lifting a finger",
          "Key differentiators: AI-powered design, ongoing optimization, dedicated support, transparent pricing"
        ]
      },
      {
        title: "The Three Tiers — Know Them Cold",
        content: `## Pricing Tiers

You must be able to recite these in your sleep. Every conversation should naturally flow toward the right tier for the prospect.

### Starter — $1,499 one-time + $99/mo
**Who it's for:** Solo operators, new businesses, side hustles
**What they get:**
- 5-page custom website (Home, About, Services, Contact, Blog)
- Mobile-responsive design
- Basic SEO setup
- Contact form
- Google Analytics integration
- Monthly performance report
- Email support

**Selling angle:** "For less than the cost of one newspaper ad, you get a professional website that works for you 24/7."

### Growth — $2,999 one-time + $199/mo
**Who it's for:** Established businesses ready to scale
**What they get:**
- Everything in Starter, plus:
- Up to 10 pages
- Advanced SEO with keyword targeting
- Blog with content calendar
- Social media integration
- Online booking/scheduling
- Email marketing setup
- Priority support
- Free domain for Year 1

**Selling angle:** "This is where businesses go from 'having a website' to 'having a growth engine.' The booking system alone pays for itself."

### Premium — $5,999 one-time + $349/mo
**Who it's for:** Businesses that want the full competitive advantage
**What they get:**
- Everything in Growth, plus:
- Unlimited pages
- E-commerce capability
- Custom integrations
- AI chatbot
- Advanced analytics dashboard
- Quarterly strategy calls
- Dedicated account manager
- Free domain for Year 1

**Selling angle:** "This is the 'never worry about your website again' package. We become your digital department."

### The Upsell Catalog (Post-Build)
After the initial build, customers can add:
- AI Chatbot — $299/mo
- Booking Widget — $199/mo
- Review Collector — $149/mo
- Lead Capture Bot — $249/mo
- SEO Autopilot — $199/mo
- Extra Pages — $499 one-time
- Priority Support — $99/mo`,
        keyTakeaways: [
          "Starter ($1,499 + $99/mo) for solopreneurs, Growth ($2,999 + $199/mo) for scaling businesses, Premium ($5,999 + $349/mo) for full competitive advantage",
          "Always lead with the value, not the price — frame cost against what they're losing without a proper site",
          "Know the upsell catalog — this is recurring revenue for you and the company"
        ]
      },
      {
        title: "Competitive Landscape",
        content: `## Know Your Competition

When a prospect says "I'm also looking at..." you need to respond instantly with confidence.

### vs. Wix / Squarespace / WordPress.com
**Their pitch:** "Build it yourself for $15/month!"
**Reality:** Business owners spend 40+ hours, the result looks template-y, no ongoing optimization, SEO is basic at best.
**Your response:** "Those platforms are great for hobbyists. But you're running a business — your website needs to work as hard as you do. We handle everything so you can focus on what you're actually good at."

### vs. Freelancers on Fiverr/Upwork
**Their pitch:** "Custom website for $500!"
**Reality:** You get what you pay for. No ongoing support, no maintenance, communication nightmares, they disappear after delivery.
**Your response:** "A freelancer builds you a website. We build you a digital growth system. The website is just the beginning — we maintain it, optimize it, and make sure it's actually bringing you customers."

### vs. Traditional Agencies
**Their pitch:** "We'll build your dream website for $15,000."
**Reality:** 3-6 month timelines, scope creep, change orders, then a $200/month maintenance fee for basic hosting.
**Your response:** "We deliver the same quality at a fraction of the cost because our AI handles the heavy lifting. You get agency-quality results with startup-speed delivery."

### vs. "My nephew can do it"
**Your response:** "I hear that a lot! And honestly, your nephew might be great at it. But here's the thing — a website isn't a one-time project. It needs ongoing SEO, security updates, performance monitoring, and content updates. That's a part-time job. We handle all of that so neither you nor your nephew have to worry about it."`,
        keyTakeaways: [
          "Know the weaknesses of every competitor type: DIY platforms, freelancers, agencies, and the nephew",
          "Never trash the competition — acknowledge their strengths, then pivot to our unique value",
          "Frame MiniMorph as a growth system, not just a website builder"
        ]
      }
    ],
    quiz: [
      {
        id: "pm-1",
        question: "A prospect says they're considering Squarespace because it's only $15/month. What's the best response?",
        type: "scenario",
        options: [
          "Tell them Squarespace is terrible and they'll regret it",
          "Acknowledge it's a good platform for hobbyists, then explain how MiniMorph handles everything so they can focus on their business",
          "Match their price and offer a discount",
          "Tell them to go ahead with Squarespace and call you when they're frustrated"
        ],
        correctAnswer: 1,
        explanation: "Never trash the competition. Acknowledge, reframe, and pivot to your unique value. Position MiniMorph as the professional choice for serious businesses.",
        difficulty: "medium"
      },
      {
        id: "pm-2",
        question: "What is the monthly cost for the Growth tier?",
        type: "multiple_choice",
        options: ["$99/mo", "$149/mo", "$199/mo", "$349/mo"],
        correctAnswer: 2,
        explanation: "Growth is $2,999 one-time + $199/mo. This is the most popular tier for established businesses.",
        difficulty: "easy"
      },
      {
        id: "pm-3",
        question: "A restaurant owner says 'I already have a Facebook page, why do I need a website?' What's the best approach?",
        type: "scenario",
        options: [
          "Tell them Facebook is dying and they need to get off it",
          "Explain that they don't own their Facebook page — Meta does. A website is their digital real estate that they control, and it shows up in Google searches when hungry customers are looking for restaurants",
          "Offer them a 50% discount to convince them",
          "Tell them a website is required by law"
        ],
        correctAnswer: 1,
        explanation: "The 'digital real estate' framing is powerful. They rent space on Facebook, but they OWN their website. Plus, Google search intent ('restaurants near me') drives massive traffic that Facebook can't match.",
        difficulty: "medium"
      },
      {
        id: "pm-4",
        question: "Which tier includes a free domain for Year 1?",
        type: "multiple_choice",
        options: ["Starter only", "Growth and Premium", "All tiers", "None — domains are always extra"],
        correctAnswer: 1,
        explanation: "Free domain for Year 1 is included in Growth and Premium tiers. Starter customers pay $15/year for domain.",
        difficulty: "easy"
      },
      {
        id: "pm-5",
        question: "A prospect asks 'What happens if I want to cancel?' How do you respond?",
        type: "scenario",
        options: [
          "Tell them there's a 2-year contract they can't break",
          "Say 'You can cancel anytime, but you'll lose your website.' Then pivot: 'But let me ask — what would need to be true for you to feel confident this is the right investment?'",
          "Ignore the question and change the subject",
          "Offer them a money-back guarantee you're not authorized to give"
        ],
        correctAnswer: 1,
        explanation: "Address the concern honestly, then use it as a discovery opportunity. The question behind the question is usually 'Am I going to regret this?' — help them see why they won't.",
        difficulty: "hard"
      },
      {
        id: "pm-6",
        question: "What is the one-time setup cost for the Premium tier?",
        type: "multiple_choice",
        options: ["$2,999", "$4,999", "$5,999", "$7,999"],
        correctAnswer: 2,
        explanation: "Premium is $5,999 one-time + $349/mo. Position it as 'your entire digital department for less than a part-time employee.'",
        difficulty: "easy"
      },
      {
        id: "pm-7",
        question: "What are the three core problems MiniMorph solves for small businesses?",
        type: "multiple_choice",
        options: [
          "Cost, speed, and design quality",
          "DIY overwhelm, agency expense, and maintenance abandonment",
          "SEO, social media, and email marketing",
          "Hosting, security, and backups"
        ],
        correctAnswer: 1,
        explanation: "The three core problems are: DIY is overwhelming, agencies are expensive, and nobody maintains the site after it's built. MiniMorph solves all three.",
        difficulty: "easy"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 2: PSYCHOLOGY OF SELLING
     ═══════════════════════════════════════════════════════ */
  {
    id: "psychology-selling",
    title: "Psychology of Selling",
    description: "Master the 6 principles of influence that drive every buying decision. This is the foundation of elite-level selling.",
    icon: "Brain",
    estimatedMinutes: 60,
    lessons: [
      {
        title: "The 6 Weapons of Influence",
        content: `## Robert Cialdini's 6 Principles

Every buying decision — from a $2 coffee to a $50,000 car — is driven by the same psychological principles. Master these and you'll understand why people say yes.

### 1. Reciprocity
**Principle:** When someone gives us something, we feel compelled to give back.

**In practice:** The free website audit is our most powerful reciprocity tool. We give them genuine value (a detailed analysis of their current web presence) before asking for anything. By the time you make your pitch, they already feel like they owe you.

**Script:** "Before we even talk about pricing, let me show you something. I ran a quick audit on your current site and found some things you should know about..."

### 2. Commitment & Consistency
**Principle:** Once people commit to something (even small), they'll act consistently with that commitment.

**In practice:** Get small yeses before the big yes. "Would you agree that your website is the first thing potential customers see?" (Yes.) "And would you say first impressions matter in your business?" (Yes.) "So it makes sense to invest in making that first impression count, right?" (Yes.)

**The foot-in-the-door technique:** Start with a small ask (free audit, quick call) → medium ask (let me show you a mockup) → big ask (let's get started).

### 3. Social Proof
**Principle:** We look to others to determine correct behavior, especially in uncertain situations.

**In practice:** Use case studies, testimonials, and numbers constantly.
- "We've helped over 200 businesses just like yours..."
- "Your competitor down the street actually just signed up with us last month..."
- "I was just talking to another [industry] owner who had the exact same concern..."

### 4. Authority
**Principle:** We defer to experts and authority figures.

**In practice:** Position yourself as the expert, not just a salesperson.
- Share industry knowledge they don't have
- Reference Google's algorithm changes and how they affect their business
- Use data: "According to Google, 75% of users judge a company's credibility based on their website design"

### 5. Liking
**Principle:** We buy from people we like. Period.

**In practice:**
- Find genuine common ground (same neighborhood, same challenges, same interests)
- Use their name frequently
- Mirror their communication style (formal → formal, casual → casual)
- Be genuinely interested in their business — ask questions you actually want to know the answers to

### 6. Scarcity
**Principle:** We want what we might lose more than what we might gain.

**In practice:**
- "We only take on 5 new clients per month to maintain quality..."
- "This pricing is locked in for projects started this quarter..."
- "Every day without a proper website is a day your competitors are capturing your potential customers..."

**WARNING:** Never create false scarcity. It destroys trust. Only use scarcity when it's genuine.`,
        keyTakeaways: [
          "Reciprocity: Give value first (free audit) before asking for anything",
          "Commitment: Get small yeses that lead to the big yes",
          "Social proof: Use numbers, testimonials, and competitor references constantly",
          "Authority: Position yourself as the expert with data and industry knowledge",
          "Liking: Be genuinely interested — people buy from people they like",
          "Scarcity: Use real scarcity (capacity limits, pricing windows) — never fake it"
        ]
      },
      {
        title: "The Buying Brain — How Decisions Actually Work",
        content: `## Emotional vs. Rational Decision Making

Here's the secret that separates average salespeople from elite closers:

> **People buy on emotion and justify with logic.**

This means your job is to:
1. **Trigger the emotion** (fear of missing out, excitement about growth, relief from a problem)
2. **Provide the logic** (ROI, features, pricing) so they can justify the decision to themselves and others

### The Three Brains
- **Reptilian brain** (survival): "Is this safe? Will I lose money?" → Address risk with guarantees and social proof
- **Limbic brain** (emotion): "How does this make me feel?" → Paint the vision of their business thriving
- **Neocortex** (logic): "Does this make sense?" → Provide data, comparisons, ROI calculations

### Loss Aversion
People feel the pain of losing $100 twice as intensely as the pleasure of gaining $100. This is why:
- "You're losing 3-5 customers per week because of your current website" is more powerful than "You'll gain 3-5 customers per week with a new website"
- "Every month you wait costs you approximately $X in lost revenue" is more powerful than "You'll make $X more per month"

### The Status Quo Bias
People prefer to do nothing — it feels safer. Your job is to make the cost of inaction feel more painful than the cost of action.

**Script:** "I totally understand wanting to think about it. But let me ask you this — what's the cost of waiting another 6 months? If you're losing even 2-3 customers a month because of your online presence, that's [calculate their average customer value × 15-18 customers]. Is that a number you're comfortable with?"`,
        keyTakeaways: [
          "People buy on emotion and justify with logic — trigger the emotion first",
          "Loss aversion: Frame what they're LOSING without you, not just what they'll gain",
          "Status quo bias: Make inaction feel more expensive than action",
          "Always provide logical justification so they can explain the purchase to themselves and others"
        ]
      },
      {
        title: "Building Instant Rapport",
        content: `## The First 90 Seconds

You have 90 seconds to establish rapport. After that, the prospect has already decided whether they trust you.

### The Rapport Formula
1. **Warm greeting** — Use their name. Smile (yes, even on the phone — they can hear it).
2. **Common ground** — Find something you share. "I noticed you're in [neighborhood] — I love that area."
3. **Genuine curiosity** — Ask about their business with real interest. "Tell me about [business name] — how did you get started?"
4. **Active listening** — Repeat back what they say. "So you started the bakery because of your grandmother's recipes? That's incredible."
5. **Vulnerability** — Share something real about yourself. "Honestly, I got into this because I saw my parents' small business struggle with their online presence."

### Mirroring Techniques
- **Pace:** If they speak slowly, slow down. If they're high-energy, match it.
- **Language:** If they say "website," don't say "digital presence." Use their words.
- **Body language (in person):** Subtly mirror their posture, gestures, and expressions.

### The Name Rule
Use their name 3-5 times in the first conversation. Not more (creepy), not less (impersonal).

### The Compliment Bridge
Find something genuine to compliment about their business, then bridge to the opportunity:
"Your Google reviews are fantastic — clearly your customers love what you do. Imagine if your website reflected that same quality and helped even more people find you."`,
        keyTakeaways: [
          "You have 90 seconds to establish trust — make them count",
          "Find genuine common ground and show real curiosity about their business",
          "Mirror their communication style — pace, language, energy level",
          "Use the Compliment Bridge: genuine praise → bridge to opportunity"
        ],
        script: `**The Perfect Opening (Phone/Video):**

"Hi [Name], this is [Your Name] from MiniMorph Studios. Thanks for taking a few minutes — I know you're busy running [Business Name].

I actually took a look at your online presence before this call, and I have to say, your [genuine compliment about their business — reviews, photos, reputation]. It's clear you care about quality.

I wanted to chat because I think there's a real opportunity to make your digital presence match the quality of what you're actually doing. But first — tell me a little about [Business Name]. How did you get started?"`
      }
    ],
    quiz: [
      {
        id: "ps-1",
        question: "A prospect says 'I need to think about it.' According to loss aversion psychology, what's the most effective response?",
        type: "scenario",
        options: [
          "Say 'Take your time!' and follow up in a week",
          "Offer an immediate discount to create urgency",
          "Help them calculate the cost of waiting — 'If you're losing even 2-3 customers a month because of your current site, that's $X over the next 6 months. Is that a number you're comfortable with?'",
          "Tell them the offer expires today"
        ],
        correctAnswer: 2,
        explanation: "Loss aversion means people feel losses more intensely than gains. Making the cost of inaction tangible and personal is more powerful than any discount or artificial deadline.",
        difficulty: "medium"
      },
      {
        id: "ps-2",
        question: "Which principle of influence does the free website audit primarily leverage?",
        type: "multiple_choice",
        options: ["Scarcity", "Authority", "Reciprocity", "Social Proof"],
        correctAnswer: 2,
        explanation: "The free audit is a reciprocity play. By giving genuine value upfront, the prospect feels a natural obligation to reciprocate — in this case, by giving you their time and consideration.",
        difficulty: "easy"
      },
      {
        id: "ps-3",
        question: "A prospect seems hesitant and keeps asking technical questions. Which 'brain' are they operating from, and how should you respond?",
        type: "scenario",
        options: [
          "Reptilian brain — they're scared. Provide guarantees and reduce perceived risk.",
          "Limbic brain — they're emotional. Tell them an inspiring story.",
          "Neocortex — they're analyzing. Provide data, comparisons, and logical justification.",
          "They're not interested. Move on to the next prospect."
        ],
        correctAnswer: 2,
        explanation: "Technical questions signal the neocortex is engaged. Feed it with data, specs, and logical comparisons. But remember — they still need an emotional trigger to actually buy. Satisfy the logic, then circle back to the vision.",
        difficulty: "hard"
      },
      {
        id: "ps-4",
        question: "What is the correct order of the buying decision process?",
        type: "multiple_choice",
        options: [
          "Logic first, then emotion",
          "Emotion first, then logic to justify",
          "Pure logic — emotions don't matter in B2B",
          "Pure emotion — logic doesn't matter for small purchases"
        ],
        correctAnswer: 1,
        explanation: "People buy on emotion and justify with logic. Your job is to trigger the emotion (vision, fear of loss, excitement) then provide the logical framework (ROI, features, pricing) so they can justify the decision.",
        difficulty: "easy"
      },
      {
        id: "ps-5",
        question: "You're on a call with a prospect who speaks very slowly and deliberately. What should you do?",
        type: "scenario",
        options: [
          "Speed up to show energy and enthusiasm",
          "Match their pace — speak slowly and deliberately to build rapport through mirroring",
          "Ask them to speed up because you have other calls",
          "It doesn't matter — focus on the content, not the delivery"
        ],
        correctAnswer: 1,
        explanation: "Mirroring their communication style (pace, tone, energy) builds unconscious rapport. If they're deliberate, be deliberate. If they're high-energy, match it. This signals 'I'm like you' which triggers the Liking principle.",
        difficulty: "medium"
      },
      {
        id: "ps-6",
        question: "Which statement is more psychologically effective and why?",
        type: "scenario",
        options: [
          "'You'll gain 5 new customers per month with a better website' — because people respond to positive outcomes",
          "'You're losing approximately 5 customers per month because of your current website' — because loss aversion makes losses feel twice as painful as equivalent gains",
          "Both are equally effective",
          "Neither is effective — you should focus on features instead"
        ],
        correctAnswer: 1,
        explanation: "Loss aversion (Kahneman & Tversky) shows that losses are psychologically about twice as powerful as gains. 'You're losing 5 customers' hits harder than 'You'll gain 5 customers' even though the math is identical.",
        difficulty: "medium"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 3: THE DISCOVERY CALL
     ═══════════════════════════════════════════════════════ */
  {
    id: "discovery-call",
    title: "The Discovery Call",
    description: "Master SPIN selling, pain point extraction, needs analysis, and active listening. The discovery call is where deals are won or lost.",
    icon: "Phone",
    estimatedMinutes: 50,
    lessons: [
      {
        title: "SPIN Selling Framework",
        content: `## The SPIN Method

SPIN is the most researched and validated sales methodology in history. It stands for:

### S — Situation Questions
**Purpose:** Understand their current state. Don't overdo these — research beforehand.
- "Tell me about your business — what do you do?"
- "How do customers currently find you?"
- "Do you have a website right now? When was it last updated?"
- "What's your main source of new customers?"

**Pro tip:** Do your homework first. If you can find their website, Google reviews, and social media before the call, you'll need fewer situation questions and look more prepared.

### P — Problem Questions
**Purpose:** Uncover pain points they may not have articulated.
- "What's the biggest challenge you face in getting new customers?"
- "When potential customers Google your type of business, what do they find?"
- "Have you ever lost a customer to a competitor who had a better online presence?"
- "What frustrates you most about your current website (or lack of one)?"

### I — Implication Questions
**Purpose:** Make the pain feel bigger. This is where average reps fail — they skip this step.
- "If you're losing even 2-3 customers a month to competitors with better websites, what does that cost you over a year?"
- "How does not having a professional online presence affect your credibility when you're competing for bigger contracts?"
- "What happens to your business if this problem gets worse over the next 12 months?"

### N — Need-Payoff Questions
**Purpose:** Get them to articulate the solution (which happens to be what you sell).
- "If you had a website that actually brought in new customers, how would that change your business?"
- "What would it mean for your revenue if you could capture even 50% of the customers you're currently losing online?"
- "How would it feel to know your online presence is handled and you never have to think about it?"

### The Golden Rule of Discovery
> **Listen 70%, talk 30%.** The prospect should be doing most of the talking. Your job is to ask the right questions and shut up.`,
        keyTakeaways: [
          "SPIN: Situation → Problem → Implication → Need-Payoff",
          "Implication questions are the most important — they make the pain feel real and urgent",
          "Need-Payoff questions get the prospect to sell themselves on the solution",
          "Listen 70%, talk 30% — the prospect should do most of the talking"
        ],
        script: `**The SPIN Discovery Call Script:**

[After rapport building]

"[Name], I'd love to learn more about your business so I can see if we're actually a good fit. Mind if I ask a few questions?

**Situation:**
Great. So tell me — how do customers typically find [Business Name] right now?
And do you have a website currently? [If yes] When was it last updated?

**Problem:**
What's been your biggest challenge when it comes to getting new customers online?
Have you ever had someone tell you they almost went with a competitor because of their website?

**Implication:**
That's really common. Let me ask you this — if you're losing even [2-3] customers a month because of your online presence, and your average customer is worth [ask them], that's [calculate] per year. Is that a number that concerns you?

**Need-Payoff:**
If we could get you a website that actually brings in new customers — and you never had to think about maintaining it — how would that change things for you?

[Let them paint the picture. Then transition to your solution.]

It sounds like what you need is exactly what we do. Let me show you how we've helped businesses just like yours..."`
      },
      {
        title: "Active Listening & Pain Point Extraction",
        content: `## The Art of Listening

Most salespeople listen to respond. Elite salespeople listen to understand.

### The 3 Levels of Listening
1. **Internal listening** — You're thinking about what to say next. (Bad)
2. **Focused listening** — You hear their words and understand the content. (Good)
3. **Global listening** — You hear the words, the emotion behind them, what they're NOT saying, and the context. (Elite)

### Pain Point Extraction Techniques

**The Echo Technique:**
Repeat the last 2-3 words they said as a question. This gets them to elaborate without you asking a direct question.
- Prospect: "We've been struggling with getting new customers lately."
- You: "Struggling with new customers?"
- Prospect: "Yeah, it seems like everyone goes to our competitor down the street who has this amazing website and..."
(Now you have the real pain point.)

**The Silence Technique:**
After they answer a question, wait 3-5 seconds before responding. The silence feels uncomfortable, and they'll fill it with deeper, more honest information.

**The "Tell Me More" Technique:**
When they mention something emotional, simply say "Tell me more about that." It's the most powerful phrase in sales.

**The Feeling Reflection:**
"It sounds like that's really frustrating for you." This validates their emotion and deepens trust.

### What to Listen For
- **Emotional words:** "frustrated," "worried," "excited," "afraid," "tired of"
- **Money language:** "can't afford," "waste of money," "investment," "ROI"
- **Time language:** "don't have time," "been meaning to," "someday"
- **Competitor mentions:** Any reference to competitors is a buying signal
- **Future vision:** "I wish," "if only," "someday I want to"`,
        keyTakeaways: [
          "Listen at Level 3: hear the words, the emotion, and what's NOT being said",
          "Echo Technique: repeat their last words as a question to get them to elaborate",
          "Silence Technique: wait 3-5 seconds after they answer — they'll fill it with gold",
          "Listen for emotional words, money language, and future vision statements"
        ]
      }
    ],
    quiz: [
      {
        id: "dc-1",
        question: "In SPIN selling, which type of question is most often skipped by average salespeople?",
        type: "multiple_choice",
        options: ["Situation", "Problem", "Implication", "Need-Payoff"],
        correctAnswer: 2,
        explanation: "Implication questions are the most commonly skipped because they require the rep to make the prospect feel the weight of their problem. But this is exactly where deals are won — making the cost of inaction tangible.",
        difficulty: "medium"
      },
      {
        id: "dc-2",
        question: "A prospect says 'We get most of our business from word of mouth.' What's the best SPIN follow-up?",
        type: "scenario",
        options: [
          "That's great! But you need a website too. (Jump to pitching)",
          "Word of mouth is powerful. But what happens when someone hears about you and Googles your business — what do they find? (Problem question leading to Implication)",
          "Word of mouth doesn't scale. You need digital marketing. (Dismissive)",
          "How many referrals do you get per month? (More Situation questions)"
        ],
        correctAnswer: 1,
        explanation: "This bridges from their Situation (word of mouth works) to a Problem (what happens when referrals Google you?) which naturally leads to Implication (you're losing the referrals who can't find you online).",
        difficulty: "hard"
      },
      {
        id: "dc-3",
        question: "What is the ideal talk-to-listen ratio during a discovery call?",
        type: "multiple_choice",
        options: ["50% you, 50% them", "70% you, 30% them", "30% you, 70% them", "90% you, 10% them"],
        correctAnswer: 2,
        explanation: "The prospect should be talking 70% of the time. Your job is to ask great questions and listen deeply. The more they talk, the more they reveal their pain points and the more they feel heard.",
        difficulty: "easy"
      },
      {
        id: "dc-4",
        question: "A prospect says 'I'm tired of dealing with my website.' You should:",
        type: "scenario",
        options: [
          "Immediately pitch MiniMorph as the solution",
          "Use the Echo Technique: 'Tired of dealing with it?' — then wait for them to elaborate",
          "Tell them about your pricing",
          "Say 'I understand' and move to the next question"
        ],
        correctAnswer: 1,
        explanation: "The Echo Technique gets them to elaborate on the emotional pain without you asking a direct question. 'Tired of dealing with it?' will prompt them to share the specific frustrations, giving you ammunition for your pitch.",
        difficulty: "medium"
      },
      {
        id: "dc-5",
        question: "After asking a question, the prospect gives a brief answer. What's the most effective technique?",
        type: "scenario",
        options: [
          "Ask another question immediately",
          "Wait 3-5 seconds in silence — they'll fill it with deeper information",
          "Rephrase the same question",
          "Move on to the pitch"
        ],
        correctAnswer: 1,
        explanation: "The Silence Technique is incredibly powerful. Most people are uncomfortable with silence and will fill it with more honest, detailed information. The best insights come after the initial surface-level answer.",
        difficulty: "medium"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 4: OBJECTION HANDLING MASTERY
     ═══════════════════════════════════════════════════════ */
  {
    id: "objection-handling",
    title: "Objection Handling Mastery",
    description: "Turn every 'no' into a 'tell me more.' Master the art of handling price, timing, competitor, and trust objections.",
    icon: "Shield",
    estimatedMinutes: 55,
    lessons: [
      {
        title: "The Objection Handling Framework — LAER",
        content: `## LAER: Listen, Acknowledge, Explore, Respond

Every objection follows the same handling pattern. Memorize this framework and you'll never be caught off guard.

### L — Listen
Let them finish. Don't interrupt. Don't start formulating your response while they're talking. Just listen.

### A — Acknowledge
Validate their concern. This is NOT agreeing with them — it's showing you heard them.
- "I totally understand that concern."
- "That's a really fair point."
- "I appreciate you being honest about that."

### E — Explore
Ask a question to understand the real objection behind the stated objection.
- "When you say it's too expensive, help me understand — is it the total investment or the monthly commitment that concerns you?"
- "When you say you need to think about it, what specifically are you weighing?"

### R — Respond
Now — and only now — address the objection with your response.

### The Secret: Objections Are Buying Signals
If someone isn't interested, they don't object — they just say "no thanks" and hang up. Objections mean they're interested but have a concern that needs addressing. Every objection is an opportunity.`,
        keyTakeaways: [
          "LAER: Listen → Acknowledge → Explore → Respond — in that exact order",
          "Never skip the Acknowledge step — validation builds trust",
          "Explore the real objection behind the stated objection",
          "Objections are buying signals — if they weren't interested, they'd just say no"
        ]
      },
      {
        title: "The Big 4 Objections & How to Crush Them",
        content: `## Every Objection Falls Into 4 Categories

### 1. PRICE: "It's too expensive"
**What they're really saying:** "I don't see enough value to justify the cost."

**Response framework:**
1. Break it down: "$199/month is about $6.50/day. That's less than your morning coffee. But unlike coffee, this actually brings in customers."
2. ROI calculation: "What's your average customer worth? $500? $1,000? If this website brings in just ONE extra customer per month, it pays for itself 5x over."
3. Cost of inaction: "What's it costing you NOT to have a proper website? If you're losing even 2 customers a month..."
4. Comparison: "A traditional agency would charge $15,000-$25,000 for what we deliver. We're able to offer it at this price because our AI handles the heavy lifting."

**Script:** "I hear you — $[price] is a real investment. Let me ask you this: what's your average customer worth to you? [Wait for answer.] So if this website brings in just one extra customer per month, that's $[their number] in new revenue against a $[monthly cost] investment. Does that math work for you?"

### 2. TIMING: "I need to think about it" / "Not right now"
**What they're really saying:** "I'm not convinced enough to act today."

**Response framework:**
1. Validate: "Absolutely — this is an important decision."
2. Explore: "What specifically would you want to think through? I might be able to help with that right now."
3. Cost of delay: "I totally respect that. Just keep in mind — every month without a proper website is another month of lost customers. If we start now, you could be live in [timeframe]."
4. Reduce risk: "What if we did this — let me put together a free mockup of what your site could look like. No commitment. If you love it, we move forward. If not, no hard feelings."

### 3. COMPETITOR: "I'm looking at other options"
**What they're really saying:** "Convince me you're the best choice."

**Response framework:**
1. Validate: "Smart move — you should compare options."
2. Differentiate: "What are you comparing us against? [Listen.] Here's what makes us different..."
3. Risk reversal: "Most agencies build your site and disappear. We're with you for the long haul — monthly optimization, reports, and support."
4. Social proof: "We've had several clients come to us after trying [competitor type] and here's what they tell us..."

### 4. TRUST: "How do I know this will work?"
**What they're really saying:** "I've been burned before."

**Response framework:**
1. Empathize: "I completely understand — there are a lot of people making promises they can't keep."
2. Proof: "Let me show you some real results from businesses like yours. [Show case studies.]"
3. Reduce risk: "Here's what I can promise — we don't just build and bail. You get monthly reports showing exactly what's happening with your site."
4. Personal guarantee: "I'm your point of contact. If something isn't right, you call me directly."`,
        keyTakeaways: [
          "Price objection: Break it down daily, calculate ROI, show cost of inaction",
          "Timing objection: Explore what they need to think about, offer a risk-free next step",
          "Competitor objection: Validate their research, differentiate on ongoing support",
          "Trust objection: Empathize with past experiences, provide proof and personal accountability"
        ],
        script: `**Price Objection Script:**
"I hear you — $[price] is a real investment. Can I ask you something? What's your average customer worth to you? [Wait.] So $[their number]. If this website brings in just ONE extra customer per month — and honestly, most of our clients see 3-5 — that's $[their number] against a $[monthly] investment. The website pays for itself before the end of month one. Does that math make sense to you?"

**Timing Objection Script:**
"Absolutely, take the time you need. But let me ask — what specifically are you weighing? [Listen.] That's a fair concern. Here's what I'd suggest — let me put together a free mockup of what your site could look like. Zero commitment. You'll see exactly what you'd be getting. If you love it, we move forward. If not, you've lost nothing. Fair enough?"

**Trust Objection Script:**
"I completely get it — and honestly, that's a smart question to ask. Here's what I can tell you: we've helped over 200 businesses, and I can show you real results. But more importantly — I'm your point of contact. Not a call center, not a chatbot. Me. If something isn't right, you have my direct number. That's how confident I am in what we deliver."`
      }
    ],
    quiz: [
      {
        id: "oh-1",
        question: "A prospect says 'Your competitor offers the same thing for half the price.' What's the best LAER response?",
        type: "scenario",
        options: [
          "Match the competitor's price immediately",
          "Say 'You get what you pay for' (dismissive)",
          "Listen, then: 'That's worth looking into. Can I ask — what exactly are they offering? [Explore differences.] Here's what we include that most competitors don't: ongoing optimization, monthly reports, and a dedicated contact. When you factor in the maintenance you'd need to pay for separately with them, the total cost is actually very similar.'",
          "Tell them the competitor is lying about their pricing"
        ],
        correctAnswer: 2,
        explanation: "Follow LAER: Listen to the full objection, Acknowledge it's worth comparing, Explore what the competitor actually offers, then Respond by highlighting the value difference — not just the price difference.",
        difficulty: "hard"
      },
      {
        id: "oh-2",
        question: "Why are objections actually buying signals?",
        type: "multiple_choice",
        options: [
          "Because objections mean they want a discount",
          "Because if they weren't interested, they'd just say 'no thanks' — objections mean they're interested but have a concern",
          "Because objections are a negotiation tactic",
          "They're not buying signals — they're rejection signals"
        ],
        correctAnswer: 1,
        explanation: "Truly uninterested people don't object — they disengage. When someone raises an objection, they're telling you 'I'm interested, but I need this concern addressed before I can say yes.'",
        difficulty: "easy"
      },
      {
        id: "oh-3",
        question: "A prospect says '$2,999 is too much for a website.' What's the most effective reframe?",
        type: "scenario",
        options: [
          "Offer a 20% discount",
          "Break it down: 'That's about $8/day — less than lunch. But unlike lunch, this brings in customers 24/7. If it generates just one extra customer per month at your average ticket of $[X], it pays for itself in week one.'",
          "Tell them they can't afford NOT to have a website",
          "Suggest the Starter tier instead"
        ],
        correctAnswer: 1,
        explanation: "The daily breakdown + ROI calculation is the most powerful price reframe. It makes the investment feel small while making the return feel large. Always tie it to THEIR specific numbers.",
        difficulty: "medium"
      },
      {
        id: "oh-4",
        question: "What is the first step in the LAER framework?",
        type: "multiple_choice",
        options: ["Acknowledge", "Listen", "Explore", "Respond"],
        correctAnswer: 1,
        explanation: "Listen first. Let them finish their objection completely before you do anything else. Most salespeople jump straight to responding, which makes the prospect feel unheard.",
        difficulty: "easy"
      },
      {
        id: "oh-5",
        question: "A prospect says 'I need to talk to my partner first.' How do you handle this?",
        type: "scenario",
        options: [
          "Say 'Can you call them right now?'",
          "Acknowledge it, then ask: 'Of course — what do you think their main concern will be? I might be able to give you some information that addresses it.' Then offer to do a brief call with both of them.",
          "Tell them to call you back when they've decided",
          "Pressure them to decide without their partner"
        ],
        correctAnswer: 1,
        explanation: "This handles the objection respectfully while keeping control. By asking what the partner's concern might be, you can pre-handle their objection. Offering a joint call shows confidence and keeps the deal moving.",
        difficulty: "hard"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 5: CLOSING TECHNIQUES
     ═══════════════════════════════════════════════════════ */
  {
    id: "closing-techniques",
    title: "Closing Techniques",
    description: "Master 7 proven closing techniques. Know when to use each one and how to ask for the sale with confidence.",
    icon: "Target",
    estimatedMinutes: 50,
    lessons: [
      {
        title: "The 7 Closes Every Rep Must Know",
        content: `## Closing Is Not Manipulation — It's Leadership

The prospect came to you because they have a problem. You have the solution. Closing is simply helping them take the next step. If you believe in what you're selling, closing is an act of service.

### 1. The Assumptive Close
**When to use:** When the prospect has shown clear buying signals throughout the conversation.
**How it works:** Skip the "would you like to buy?" and go straight to implementation details.

**Script:** "Great — so it sounds like the Growth package is the right fit. Let me get your onboarding started. What email should I send the welcome packet to?"

### 2. The Summary Close
**When to use:** After a long conversation where many benefits were discussed.
**How it works:** Summarize everything they've agreed to, then ask for the commitment.

**Script:** "So let me make sure I have this right — you need a professional website that brings in new customers, you want it maintained and optimized monthly, and you want someone you can call when you need changes. That's exactly what our Growth package delivers. Shall we get started?"

### 3. The Alternative Close
**When to use:** When the prospect is deciding between options (not whether to buy).
**How it works:** Give them two options — both of which result in a sale.

**Script:** "Based on what you've told me, I'd recommend either the Growth or Premium package. The Growth gives you everything you need to start, and the Premium adds e-commerce and the AI chatbot. Which one feels right for your business?"

### 4. The Urgency Close
**When to use:** When there's a genuine reason to act now.
**How it works:** Create real (never fake) urgency.

**Script:** "We're currently running our spring launch special — $500 off the setup fee for projects started this month. After that, it goes back to full price. Want to lock that in?"

### 5. The Puppy Dog Close
**When to use:** When the prospect is interested but afraid to commit.
**How it works:** Let them "try before they buy" with a low-risk next step.

**Script:** "Tell you what — let me put together a free mockup of what your site could look like. No commitment, no pressure. If you love it, we move forward. If not, you've lost nothing. Sound fair?"

### 6. The Takeaway Close
**When to use:** When the prospect is on the fence and needs a push.
**How it works:** Suggest that maybe it's NOT the right fit (reverse psychology).

**Script:** "You know what, [Name] — I want to be honest with you. This might not be the right time for you. If you're not ready to invest in your online presence right now, that's totally okay. But I'd hate for you to lose another 6 months of potential customers while you're thinking about it."

### 7. The Direct Close
**When to use:** When you've addressed all objections and the conversation has naturally reached its conclusion.
**How it works:** Simply ask.

**Script:** "So, [Name] — are you ready to get started?"

### The Golden Rule of Closing
> **Ask for the sale. Then shut up.** The first person to speak after the close loses. Ask your closing question and wait — even if the silence feels uncomfortable.`,
        keyTakeaways: [
          "Closing is leadership, not manipulation — you're helping them solve their problem",
          "Match the close to the situation: assumptive for warm prospects, puppy dog for hesitant ones",
          "After asking for the sale, SHUT UP — the first person to speak loses",
          "Always have a low-risk next step ready (free mockup, trial) for prospects who aren't ready to commit"
        ]
      }
    ],
    quiz: [
      {
        id: "ct-1",
        question: "A prospect has been enthusiastic throughout the call, asking about timelines and features. Which close is most appropriate?",
        type: "scenario",
        options: [
          "The Takeaway Close — suggest it might not be right for them",
          "The Puppy Dog Close — offer a free trial",
          "The Assumptive Close — skip the 'would you like to buy?' and go straight to onboarding details",
          "The Direct Close — just ask 'do you want to buy?'"
        ],
        correctAnswer: 2,
        explanation: "Strong buying signals (asking about timelines, features, implementation) mean they've already decided. The Assumptive Close respects their intelligence and moves the conversation forward naturally.",
        difficulty: "medium"
      },
      {
        id: "ct-2",
        question: "What is the Golden Rule of Closing?",
        type: "multiple_choice",
        options: [
          "Always offer a discount",
          "Ask for the sale, then shut up — the first person to speak loses",
          "Close within the first 5 minutes",
          "Never close on the first call"
        ],
        correctAnswer: 1,
        explanation: "After your closing question, silence is your most powerful tool. The prospect needs space to process and decide. If you fill the silence, you're giving them an escape route.",
        difficulty: "easy"
      },
      {
        id: "ct-3",
        question: "A prospect says 'I like it but I'm just not sure.' Which close should you try?",
        type: "scenario",
        options: [
          "The Urgency Close — tell them the price goes up tomorrow",
          "The Puppy Dog Close — 'Let me put together a free mockup. No commitment. If you love it, we move forward.'",
          "The Direct Close — 'So are you in or not?'",
          "The Assumptive Close — start the onboarding process"
        ],
        correctAnswer: 1,
        explanation: "When someone is interested but afraid to commit, the Puppy Dog Close reduces risk to zero. A free mockup lets them see the value without any financial commitment, and once they see it, they're much more likely to buy.",
        difficulty: "medium"
      },
      {
        id: "ct-4",
        question: "The Alternative Close works because:",
        type: "multiple_choice",
        options: [
          "It gives the prospect a way to say no",
          "It shifts the decision from 'should I buy?' to 'which one should I buy?' — both options result in a sale",
          "It's the cheapest option",
          "It creates urgency"
        ],
        correctAnswer: 1,
        explanation: "The Alternative Close reframes the decision. Instead of yes/no (binary), it becomes option A or option B (both are yes). This is a subtle but powerful psychological shift.",
        difficulty: "easy"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 6: DIGITAL PROSPECTING
     ═══════════════════════════════════════════════════════ */
  {
    id: "digital-prospecting",
    title: "Digital Prospecting",
    description: "Master cold outreach, social selling, LinkedIn strategies, and referral generation to build a consistent pipeline.",
    icon: "Search",
    estimatedMinutes: 45,
    lessons: [
      {
        title: "Cold Outreach That Gets Responses",
        content: `## The Cold Outreach Formula

Cold outreach has a bad reputation because most people do it terribly. Here's how to do it right.

### The 3-Part Cold Email Formula
1. **Personalized hook** (shows you did research)
2. **Value statement** (what's in it for them)
3. **Soft CTA** (low-commitment next step)

**Template:**
> Subject: Quick question about [Business Name]'s website
>
> Hi [Name],
>
> I was looking at [Business Name] and noticed [specific observation — e.g., "your Google reviews are incredible (4.8 stars!) but your website doesn't quite match that quality"].
>
> We help businesses like yours turn their online presence into a customer magnet. I actually put together a quick audit of your site — would you be open to a 10-minute call so I can share what I found?
>
> No pitch, no pressure — just some insights you can use whether we work together or not.
>
> Best,
> [Your Name]

### Cold SMS Framework
SMS is more direct. Keep it under 160 characters and always include value.

**Template:**
> Hi [Name], this is [Your Name] from MiniMorph Studios. I noticed [Business Name] could benefit from a website refresh. I put together a free audit — want me to send it over?

### The Follow-Up Sequence
- **Day 0:** Initial outreach (email or SMS)
- **Day 2:** Follow-up SMS (if email was first touch)
- **Day 5:** Value-add email (share a relevant case study or tip)
- **Day 8:** Check-in SMS ("Just wanted to make sure you saw my note")
- **Day 14:** Final touch ("Last note from me — the offer for a free audit stands whenever you're ready")

### The 3 Rules of Cold Outreach
1. **Always personalize** — Generic messages get deleted. Mention their business name, a specific observation, something real.
2. **Always lead with value** — Don't ask for their time without offering something in return.
3. **Always have a soft CTA** — "Would you be open to..." is better than "Can we schedule a call?"`,
        keyTakeaways: [
          "Personalize every message — mention their business name and a specific observation",
          "Lead with value: free audit, specific insight, relevant case study",
          "Soft CTAs get more responses than hard asks",
          "Follow the 5-touch sequence: Day 0, 2, 5, 8, 14"
        ]
      },
      {
        title: "Referral Generation",
        content: `## The Referral Machine

Referrals are the highest-converting lead source. A referred prospect is 4x more likely to buy. Here's how to systematically generate them.

### When to Ask for Referrals
- **After a successful delivery** — "Now that your site is live and you're seeing results, do you know any other business owners who could use the same thing?"
- **After a compliment** — "That means a lot! If you know anyone else who could benefit, I'd love an introduction."
- **During a check-in** — "By the way, we're looking to help a few more businesses in [their area/industry]. Anyone come to mind?"

### The Referral Script
"[Name], I'm really glad you're happy with your site. Can I ask you something? We're looking to help 2-3 more businesses in [area/industry] this month. Is there anyone you know — maybe a fellow business owner, someone in your networking group, or even a vendor you work with — who's been struggling with their online presence? I'd love to help them the same way I helped you."

### The Referral Incentive
"And just so you know — for every referral that becomes a client, we'll give you a $200 credit toward your monthly service. It's our way of saying thanks."

### Making It Easy
Don't ask them to do the work. Offer to:
- Send a pre-written email they can forward
- Draft a text message they can send
- Connect directly on LinkedIn with their introduction`,
        keyTakeaways: [
          "Ask for referrals at peak satisfaction moments — after delivery, after compliments",
          "Make it specific: 'Do you know 2-3 business owners in [area] who...'",
          "Make it easy: offer to draft the introduction message for them",
          "Incentivize: $200 credit per referral that converts"
        ]
      }
    ],
    quiz: [
      {
        id: "dp-1",
        question: "What's the most important element of a cold email?",
        type: "multiple_choice",
        options: [
          "A catchy subject line",
          "Personalization that shows you researched their specific business",
          "A strong call-to-action",
          "Keeping it under 50 words"
        ],
        correctAnswer: 1,
        explanation: "Personalization is the #1 factor in cold email response rates. When a prospect sees you've actually looked at their business (not just mail-merged their name), they're 3-5x more likely to respond.",
        difficulty: "easy"
      },
      {
        id: "dp-2",
        question: "When is the best time to ask for a referral?",
        type: "multiple_choice",
        options: [
          "During the initial sales call",
          "Right after they pay",
          "After a successful delivery when they express satisfaction",
          "Never — referrals should happen organically"
        ],
        correctAnswer: 2,
        explanation: "Peak satisfaction is the golden moment for referral asks. When they've just seen results and are happy, they're most likely to think of others who could benefit.",
        difficulty: "easy"
      },
      {
        id: "dp-3",
        question: "A cold SMS should:",
        type: "scenario",
        options: [
          "Be under 160 characters, include their business name, and offer value (like a free audit)",
          "Be as long as needed to explain all your services",
          "Include a link to your pricing page",
          "Ask them to call you immediately"
        ],
        correctAnswer: 0,
        explanation: "Cold SMS must be concise (under 160 chars), personalized (business name), and value-first (free audit offer). Anything longer gets ignored, and hard CTAs get blocked.",
        difficulty: "medium"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 7: ACCOUNT MANAGEMENT
     ═══════════════════════════════════════════════════════ */
  {
    id: "account-management",
    title: "Account Management & Expansion",
    description: "Turn one-time sales into lifetime customers. Master upselling, cross-selling, retention, and expansion revenue.",
    icon: "TrendingUp",
    estimatedMinutes: 40,
    lessons: [
      {
        title: "The Customer Lifecycle — From Sale to Advocate",
        content: `## Your Job Doesn't End at the Sale

The sale is just the beginning. The real money — and the real impact — comes from:
1. **Retention** — Keeping customers happy and paying
2. **Expansion** — Growing their account over time
3. **Advocacy** — Turning them into referral machines

### The 90-Day Onboarding Window
The first 90 days after a sale are critical. This is when customers decide if they made the right choice.

**Week 1:** Welcome call. Set expectations. Introduce the onboarding process.
**Week 2-4:** Regular check-ins during the build. "How's everything going? Any questions?"
**Week 4-6:** Site launch. Celebrate with them. "Your site is live! Here's what to expect in the first month."
**Month 2:** First monthly report. Walk them through the numbers. "Here's what your site did last month."
**Month 3:** Strategy check-in. "Now that we have some data, here's what I'd recommend to grow even faster."

### The Upsell Timing Framework
Don't upsell on Day 1. Wait until they've seen value.

**Month 1-2:** Focus on delivery and satisfaction. No upsells.
**Month 3:** Introduce the concept: "Based on your traffic patterns, I think [add-on] could really help."
**Month 4-6:** Make the recommendation: "Your site is getting X visitors but only Y are converting. Our Lead Capture Bot could increase that by 30%."
**Month 6+:** Tier upgrade conversation: "You've outgrown the Starter package. The Growth tier would give you [specific benefits they need]."

### The QBR (Quarterly Business Review)
Every quarter, schedule a 30-minute call to:
1. Review their website performance
2. Share industry benchmarks
3. Discuss their business goals for next quarter
4. Recommend relevant add-ons or upgrades

This positions you as a strategic partner, not just a vendor.`,
        keyTakeaways: [
          "The first 90 days determine long-term retention — over-communicate during onboarding",
          "Don't upsell until Month 3+ when they've seen value",
          "QBRs position you as a strategic partner and create natural upsell opportunities",
          "Retention → Expansion → Advocacy is the path to maximum lifetime value"
        ]
      }
    ],
    quiz: [
      {
        id: "am-1",
        question: "When is the earliest you should introduce an upsell to a new customer?",
        type: "multiple_choice",
        options: ["During the initial sale", "Week 1 of onboarding", "Month 3, after they've seen value", "Never — wait for them to ask"],
        correctAnswer: 2,
        explanation: "Month 3 is the sweet spot. By then they've seen their first monthly reports, experienced the value, and trust you. Upselling before they've seen results feels pushy; waiting too long misses the momentum.",
        difficulty: "easy"
      },
      {
        id: "am-2",
        question: "What is the purpose of a Quarterly Business Review (QBR)?",
        type: "multiple_choice",
        options: [
          "To pressure customers into buying more",
          "To review performance, share benchmarks, discuss goals, and recommend relevant upgrades — positioning you as a strategic partner",
          "To check if they want to cancel",
          "To collect payment"
        ],
        correctAnswer: 1,
        explanation: "QBRs transform you from vendor to strategic partner. When you're helping them think about their business goals and showing how your services align, upsells happen naturally.",
        difficulty: "easy"
      },
      {
        id: "am-3",
        question: "A customer's website is getting 500 visitors/month but only 5 conversions. What's the best upsell recommendation?",
        type: "scenario",
        options: [
          "Upgrade to Premium tier for more pages",
          "Add the Lead Capture Bot ($249/mo) — 'Your traffic is solid but your conversion rate is 1%. Our Lead Capture Bot typically increases conversions by 30%, which would mean 15 conversions instead of 5. That's 10 extra customers per month.'",
          "Add SEO Autopilot to get more traffic",
          "Suggest they advertise on Google"
        ],
        correctAnswer: 1,
        explanation: "The data tells the story: traffic is fine, conversion is the problem. The Lead Capture Bot directly addresses the conversion gap, and the math (10 extra customers) makes the ROI obvious.",
        difficulty: "hard"
      }
    ],
    passingScore: 80
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 8: ADVANCED TACTICS
     ═══════════════════════════════════════════════════════ */
  {
    id: "advanced-tactics",
    title: "Advanced Tactics",
    description: "Enterprise selling, multi-stakeholder deals, negotiation mastery, and contract structuring for maximum revenue.",
    icon: "Crown",
    estimatedMinutes: 45,
    lessons: [
      {
        title: "Enterprise Selling & Multi-Stakeholder Deals",
        content: `## When the Deal Gets Bigger

Enterprise deals (Premium tier, multi-location businesses, franchise owners) involve multiple decision-makers. Here's how to navigate them.

### Identifying the Players
Every enterprise deal has:
- **Champion** — The person who loves your solution and advocates internally
- **Decision Maker** — The person who signs the check (often the owner or CFO)
- **Influencer** — People whose opinions the decision maker trusts
- **Blocker** — The person who doesn't want change (often IT or "the nephew who built the current site")

### The Multi-Threading Strategy
Never rely on a single contact. Build relationships with multiple stakeholders:
1. Ask your champion: "Who else would be involved in this decision?"
2. Request a meeting with the decision maker: "I'd love to walk [Decision Maker] through what we discussed."
3. Neutralize blockers: "I'd actually love to get [Blocker]'s input — their technical perspective would be valuable."

### The Enterprise Pitch Adjustment
For larger deals, shift your language:
- From "website" to "digital infrastructure"
- From "monthly cost" to "annual investment"
- From "features" to "capabilities"
- From "we'll build you a site" to "we'll implement a digital growth strategy"

### Negotiation Principles
1. **Never negotiate against yourself.** State your price and wait.
2. **Trade, don't discount.** If they want a lower price, remove a feature. "I can do $X if we remove the AI chatbot. Would that work?"
3. **Anchor high.** Start with Premium, then "come down" to Growth if needed.
4. **Protect your margins.** Your commission depends on the deal size. Discounting hurts you directly.
5. **Create urgency with deadlines.** "This pricing is valid through [date]."

### The Contract Close for Enterprise
"Based on everything we've discussed, I'd recommend starting with the Premium package for your main location, with the option to roll out to your other locations at a 15% multi-site discount. I can have the agreement ready by [date]. Does that timeline work for your team?"`,
        keyTakeaways: [
          "Enterprise deals have Champions, Decision Makers, Influencers, and Blockers — map them all",
          "Multi-thread: build relationships with multiple stakeholders, not just one contact",
          "Shift language for enterprise: 'digital infrastructure' not 'website', 'annual investment' not 'monthly cost'",
          "Never negotiate against yourself — state your price and wait. Trade features, don't discount."
        ]
      }
    ],
    quiz: [
      {
        id: "at-1",
        question: "In an enterprise deal, the 'Blocker' is usually:",
        type: "multiple_choice",
        options: [
          "The person who signs the check",
          "The person who doesn't want change — often IT or whoever built the current site",
          "The person who referred you",
          "The receptionist"
        ],
        correctAnswer: 1,
        explanation: "Blockers resist change because it threatens their position or past decisions. The nephew who built the current site, the IT person who manages it, or anyone who feels their role is threatened by your solution.",
        difficulty: "easy"
      },
      {
        id: "at-2",
        question: "A prospect asks for a 20% discount on the Growth package. What's the best response?",
        type: "scenario",
        options: [
          "Give them the discount to close the deal",
          "Say no and risk losing the deal",
          "Trade, don't discount: 'I can adjust the price if we remove the blog setup and social media integration. Would that work, or are those features important to you?'",
          "Offer 10% as a compromise"
        ],
        correctAnswer: 2,
        explanation: "Trading maintains your margins while giving the prospect a sense of winning. When you offer to remove features, they usually realize they want the full package and accept the original price.",
        difficulty: "hard"
      },
      {
        id: "at-3",
        question: "What does 'anchoring high' mean in negotiation?",
        type: "multiple_choice",
        options: [
          "Starting with your lowest price",
          "Starting with your highest-tier offering so that lower tiers feel like a deal by comparison",
          "Refusing to negotiate",
          "Adding hidden fees"
        ],
        correctAnswer: 1,
        explanation: "Anchoring sets the reference point. If you start with Premium ($5,999), Growth ($2,999) feels like a bargain. If you start with Starter ($1,499), Growth feels expensive. Always anchor high.",
        difficulty: "medium"
      }
    ],
    passingScore: 80
  }
];

/**
 * Get total quiz questions across all modules
 */
export function getTotalQuizQuestions(): number {
  return ACADEMY_MODULES.reduce((sum, m) => sum + m.quiz.length, 0);
}

/**
 * Get total estimated time for all modules
 */
export function getTotalEstimatedMinutes(): number {
  return ACADEMY_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0);
}
