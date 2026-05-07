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
  requiredRolePlay?: {
    scenarioType: string; // matches role_play_sessions.scenario_type enum
    minScore: number; // minimum score to pass (0-100)
    label: string; // human-readable label for the UI
  }[];
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
    estimatedMinutes: 40,
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
      },
      {
        title: "Your MiniMorph Platform — How Everything Works",
        content: `## Welcome to Your Command Center

Before you dive into the sales training modules, you need to understand exactly how the MiniMorph platform works. This isn't just a training tool — it's your daily operating system. Every feature is designed to make you sharper, faster, and more effective.

## The Training Journey

Here's the path every MiniMorph rep follows:

1. **Complete all Academy modules** — Each module covers a critical sales skill, from product knowledge to advanced closing techniques
2. **Pass the certification quiz** for each module — You must score above the passing threshold to earn certification
3. **Complete the required Role Play** for each module — Most modules (3-9) require you to pass an AI-powered role play scenario with a minimum score of 70%. This is where you prove you can actually USE the skills you learned, not just memorize them
4. **Earn your full certification** — Once all quizzes AND role plays are passed across all modules, your account is activated for live work
5. **Start your daily workflow** — Access leads, make calls, close deals, and keep growing

Until you're fully certified (quizzes + role plays), you won't have access to leads or the ability to make live calls. This protects both you and our clients — we never put an unprepared rep in front of a prospect.

## Mandatory Role Plays — Prove You Can Do It

Reading about sales techniques is one thing. Actually doing them is another. That's why most modules require you to complete a matching **AI Role Play scenario** before you earn certification.

Here's how it works:

1. **Finish the module lessons** — Learn the concepts and techniques
2. **Pass the quiz** — Prove you understand the material
3. **Complete the role play** — Have a simulated conversation with our AI prospect. The AI plays the role of a real customer, and you practice the skills you just learned
4. **Score 70% or higher** — The AI Coach scores your performance. If you don't hit 70%, review the lessons and try again

The role play scenarios are mapped to specific modules:

- **Psychology of Selling** → Price Negotiation role play
- **Discovery Call** → Discovery Call role play
- **Objection Handling** → Objection Handling role play
- **Closing Techniques** → Closing role play
- **Digital Prospecting** → Cold Call role play
- **Account Management** → Follow Up + Upsell role play
- **Advanced Tactics** → Angry Customer role play

Modules 1 (Values & Ethics) and 2 (Product Mastery) are knowledge-based and don't have role play requirements.

You can attempt role plays as many times as you need. Each attempt is scored, and your best score counts. The more you practice, the better you'll be when you're talking to real prospects.

## Daily Training — Your Morning Warm-Up

Every day when you log in, you'll see a **Daily Training** section. Think of it like a professional athlete's morning practice — short, focused, and non-negotiable (at least when you're starting out).

**Where do daily training reviews come from?**

Two sources:

1. **AI Coaching Analysis** — After every conversation you have (calls, emails, SMS), our AI Coach analyzes your performance. It identifies what you did well and where you can improve. Those improvement areas become personalized micro-lessons in your daily queue. If you struggled with objection handling on a call yesterday, you'll get a targeted lesson on that exact skill today.

2. **Academy Reinforcement** — When you're new and haven't had many conversations yet, the system pulls review material from the Academy modules you've already completed. This keeps your skills sharp while you're building up real conversation data.

Each review is a short lesson (2-3 minutes to read) followed by a quiz question. Complete all your assigned reviews and you're cleared to work for the day.

## Accountability Tiers — Your Rank Matters

MiniMorph uses a tier system that rewards consistent performance. As you rank up, your daily training requirements decrease because you've proven you can maintain high standards.

### Bronze (Starting Tier)
- **Commission:** 10%
- **Daily Reviews:** Up to 10 per day
- **Quiz Required:** On every review (critical, important, AND suggested)
- **Reviews Expire:** Never — you must complete them all
- **Lead Priority:** Standard assignment

### Silver
- **Commission:** 12%
- **Daily Reviews:** Up to 7 per day
- **Quiz Required:** Critical and important reviews only
- **Reviews Expire:** Never
- **Lead Priority:** Improved

### Gold
- **Commission:** 14%
- **Daily Reviews:** Up to 3 per day
- **Quiz Required:** Critical reviews only
- **Can Skip:** Suggested reviews
- **Reviews Expire:** After 48 hours
- **Lead Priority:** Priority assignment

### Platinum
- **Commission:** 15%
- **Daily Reviews:** Exempt from daily training
- **Lead Priority:** First pick on high-value leads
- **Status:** Mentor — you help train other reps

The message is clear: **prove yourself, and the system gets out of your way.** But everyone starts at Bronze, and everyone earns their way up.

## The AI Coach — Your Personal Trainer

After every conversation, the AI Coach generates a detailed analysis:

- **Overall Score** (0-100) — How well did you handle the conversation?
- **Strengths** — What you did right (so you keep doing it)
- **Areas for Improvement** — Specific skills to work on
- **Tone Analysis** — Were you confident? Empathetic? Pushy?
- **Key Takeaways** — Actionable insights for your next conversation
- **Suggested Follow-Up** — What to do next with this prospect

The improvement areas automatically become coaching reviews in your daily queue. This means your training is always personalized to YOUR actual performance — not generic material everyone gets.

## Your Daily Workflow (After Certification)

Once you're fully certified, here's what a typical day looks like:

1. **Log in** → The system checks for pending training reviews
2. **Complete Daily Training** (5-10 minutes) → Read your micro-lessons, answer quiz questions
3. **Daily Training Cleared** → Pipeline and calls are now unlocked
4. **Work Your Pipeline** → Access leads, make calls, send emails, close deals
5. **AI Coach Analyzes** → Every conversation gets reviewed automatically
6. **New Reviews Generated** → Tomorrow's training is personalized based on today's performance
7. **Check Performance** → Review your stats, scores, and progress toward the next tier

This cycle repeats every day. The better you perform, the less training you need, the higher your commission rate, and the better leads you get.

## The Guide Tab

If you ever forget how something works, click the **Guide** tab in your sidebar. It has detailed explanations of every feature in the platform — from the daily check-in system to the gamification tiers to how leads are assigned.

## Why This System Exists

MiniMorph isn't a typical sales job where you get a script and a phone list. We use AI and structured training because:

- **Clients deserve prepared reps** — Every person you talk to is a real business owner making a real decision
- **You deserve to succeed** — The training makes you genuinely better, not just compliant
- **The system is fair** — Everyone starts at the same level and advances based on merit
- **It compounds** — Small daily improvements create massive long-term results

The reps who embrace this system — who actually read their coaching reviews, who study the material, who treat daily training as a competitive advantage — are the ones who hit Platinum and earn top commissions.`,
        keyTakeaways: [
          "Complete all Academy modules and pass each quiz to earn full certification and unlock leads/calls",
          "Daily Training is a personalized morning warm-up generated from your real conversation performance",
          "Accountability tiers (Bronze → Platinum) reward performance with less training, higher commissions, and better leads",
          "The AI Coach analyzes every conversation and turns improvement areas into tomorrow's training",
          "Daily workflow: Training → Pipeline → Calls → AI Analysis → Repeat"
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
      },
      {
        id: "ve-11",
        question: "What must you complete every day before you can access leads and make calls?",
        type: "multiple_choice",
        options: [
          "Watch a motivational video",
          "Complete your assigned Daily Training reviews",
          "Send a report to your manager",
          "Log into the CRM and update your notes"
        ],
        correctAnswer: 1,
        explanation: "Daily Training reviews are your morning warm-up. They're personalized micro-lessons generated from your real conversation performance. Complete them all and your pipeline unlocks for the day.",
        difficulty: "easy"
      },
      {
        id: "ve-12",
        question: "Where do your Daily Training coaching reviews come from?",
        type: "multiple_choice",
        options: [
          "A manager manually assigns them each morning",
          "They're the same generic lessons for every rep",
          "AI analysis of your real conversations plus Academy reinforcement material",
          "You choose which topics to study each day"
        ],
        correctAnswer: 2,
        explanation: "Daily Training reviews come from two sources: AI coaching analysis of your actual conversations (personalized to your performance gaps) and Academy curriculum reinforcement. This means your training is always relevant to YOU.",
        difficulty: "medium"
      },
      {
        id: "ve-13",
        question: "As you rank up from Bronze to Platinum, what happens to your daily training requirements?",
        type: "multiple_choice",
        options: [
          "They increase because higher tiers have harder material",
          "They stay the same — everyone does the same amount",
          "They decrease — Platinum reps are exempt from daily training entirely",
          "They're replaced with weekly training instead"
        ],
        correctAnswer: 2,
        explanation: "The tier system rewards proven performance. Bronze reps do up to 10 reviews/day, Silver does 7, Gold does 3, and Platinum is exempt. Prove yourself and the system gets out of your way.",
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

### Starter — $195/mo
**Who it's for:** Solo operators, new businesses, side hustles
**What they get:**
- Custom 5-page website (Home, About, Services, Contact, Blog)
- Mobile-responsive design
- Basic SEO setup
- Contact form integration
- Monthly performance report
- AI-managed support
- 12-month contract

**Selling angle:** "For less than $7 a day, you get a professional website that works for you 24/7 — and we handle everything."

### Growth — $295/mo (Most Popular)
**Who it's for:** Established businesses ready to scale
**What they get:**
- Custom 10-page website
- Advanced responsive design
- Full SEO optimization
- Monthly analytics reports
- AI-managed nurture & support
- Quarterly strategy reviews
- Priority update requests
- 12-month contract

**Selling angle:** "This is where businesses go from 'having a website' to 'having a growth engine.' The analytics and strategy reviews alone pay for themselves."

### Pro — $395/mo
**Who it's for:** Businesses that want the full competitive advantage
**What they get:**
- Custom 20+ page website
- Premium design & animations
- Advanced SEO & content strategy
- Weekly analytics reports
- Dedicated AI account manager
- Monthly strategy sessions
- Unlimited update requests
- Advanced integrations
- 12-month contract

**Selling angle:** "This is the 'never worry about your website again' package. We become your digital department."

### Enterprise — $495/mo
**Who it's for:** Large, complex builds — ecommerce, portals, memberships, multi-location businesses
**What they get:**
- Everything in Pro
- Large ecommerce (unlimited products)
- Custom customer portals
- Membership/subscription systems
- Multi-location support
- Advanced booking systems
- Custom integrations
- Priority build queue
- 12-month contract

**Selling angle:** "For businesses that need serious infrastructure — ecommerce, custom portals, membership systems. We become your full digital operation."

### Key Pricing Points
- All plans are simple monthly pricing — no setup fees, no hidden costs
- 12-month contract for all tiers
- Customers can upgrade tiers at any time`,
        keyTakeaways: [
          "Starter ($195/mo) for solopreneurs, Growth ($295/mo) for scaling businesses, Pro ($395/mo) for full competitive advantage, Enterprise ($495/mo) for large complex builds",
          "Always lead with the value, not the price — frame cost against what they're losing without a proper site",
          "Simple monthly pricing with no setup fees — easy for prospects to say yes"
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
        options: ["$195/mo", "$249/mo", "$295/mo", "$395/mo"],
        correctAnswer: 2,
        explanation: "Growth is $295/mo — our most popular tier for established businesses ready to scale.",
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
        question: "What is the monthly cost for the Starter tier?",
        type: "multiple_choice",
        options: ["$99/mo", "$149/mo", "$195/mo", "$249/mo"],
        correctAnswer: 2,
        explanation: "Starter is $195/mo — perfect for small businesses getting started online. Simple monthly pricing, no setup fees.",
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
        question: "What is the monthly cost for the Premium tier?",
        type: "multiple_choice",
        options: ["$295/mo", "$349/mo", "$395/mo", "$599/mo"],
        correctAnswer: 2,
        explanation: "Pro is $395/mo — the complete package. Position it as 'your entire digital department for less than a part-time employee.'",
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
    // No requiredRolePlay — knowledge-based module
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
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "price_negotiation", minScore: 70, label: "Price Negotiation" }
    ]
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
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "discovery_call", minScore: 70, label: "Discovery Call" }
    ]
  },

  /* ═══════════════════════════════════════════════════════
     MODULE 4: OBJECTION HANDLING MASTERY
     ═══════════════════════════════════════════════════════ */
  {
    id: "objection-handling",
    title: "Objection Handling Mastery",
    description: "Turn every 'no' into a 'tell me more.' Master the art of handling the 6 most common objections: price, timing, competitor, trust, the internal builder, and the 12-month contract.",
    icon: "Shield",
    estimatedMinutes: 65,
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
        title: "The Big 6 Objections & How to Handle Every One",
        content: `## Every Objection Falls Into 6 Categories

### 1. PRICE: "It's too expensive"
**What they're really saying:** "I don't see enough value to justify the cost."

**Response framework:**
1. Break it down: "$195/month is less than $7/day. That's less than your morning coffee. But unlike coffee, this actually brings in customers."
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
**What they're really saying:** "I've been burned before and I'm skeptical."

**Response framework:**
1. Empathize: "I completely understand — there are a lot of people making promises they can't keep."
2. Proof: "Let me show you some real results from businesses like yours."
3. Reduce risk: "Here's what I can promise — we don't just build and bail. You get monthly reports showing exactly what's happening with your site."
4. Personal guarantee: "I'm your point of contact. If something isn't right, you call me directly."

### 5. THE INTERNAL BUILDER: "My nephew / employee / in-house team is going to do it"
**What they're really saying:** "I have a free or cheap option that feels lower-risk."

**This one is common.** Here's exactly how to handle it without badmouthing whoever it is:

**Response framework:**
1. Validate: "That's great — and they might do an amazing job."
2. Reframe from build to ongoing: "Here's the thing though — a website isn't a one-time project. It needs ongoing SEO monitoring, security updates, performance optimization, and content updates. That's a part-time job. Is your nephew / that person going to be doing all of that every month? Consistently?"
3. Separate the build from the maintenance: "We actually work alongside internal teams all the time. But what most businesses find is that the build is 10% of the work — the 90% is what happens after. That's where we come in."
4. The real question: "Let me ask you this: if their site doesn't perform in 6 months, what happens then? With us, you have accountability, monthly reports, and a team responsible for the results."

**Script:** "Totally — and honestly, if they're good, that's a real asset. The question I'd ask is: what happens the month after launch? The month after that? Who's monitoring the SEO, running the updates, tracking performance? That ongoing work is where most DIY sites fall apart — not the initial build. We take care of all of that for you. Your nephew keeps their evenings free, and your site keeps improving."

### 6. THE CONTRACT: "I can't commit to 12 months" / "Can we do month-to-month?"
**What they're really saying:** "I'm not confident enough to commit. What if I hate it?"

**Response framework:**
1. Acknowledge: "That's a fair concern — 12 months is a real commitment."
2. Explain why: "Here's the thing — a website takes 3-4 months to show meaningful SEO results. Month-to-month pricing would cost you 40-50% more because we wouldn't be able to plan resources around your build and maintenance. The 12-month structure is what makes the pricing work."
3. De-risk: "But here's the real answer to your concern: you own everything. Your domain, your content, your code. If for any reason it doesn't work, you take it with you. There's no proprietary lock-in."
4. Performance commitment: "And realistically — if your website is live and performing, you're going to want to keep it. The people who cancel early are usually the ones we haven't set up for success yet. That's on us as much as them."

**Script:** "I hear you — 12 months sounds like a big commitment. Let me reframe it: you're not committing to us, you're committing to your digital presence. The 12-month structure exists because great SEO takes time, and the pricing reflects that commitment. But you own your domain and your site regardless. If you decide to leave, we hand everything over, no questions asked. Does that help?"`,
        keyTakeaways: [
          "Price: Break it down daily, calculate ROI, show cost of inaction",
          "Timing: Explore what they need to think about, offer a risk-free next step",
          "Competitor: Validate their research, differentiate on ongoing support",
          "Trust: Empathize with past experiences, provide proof and personal accountability",
          "Internal builder: Separate build (10%) from ongoing maintenance (90%) — that's where we live",
          "Contract: You own everything regardless — the 12 months is a commitment to their own results, not to us"
        ],
        script: `**Price Objection Script:**
"I hear you — $[price] is a real investment. Can I ask you something? What's your average customer worth to you? [Wait.] So $[their number]. If this website brings in just ONE extra customer per month — and honestly, most of our clients see 3-5 — that's $[their number] against a $[monthly] investment. The website pays for itself before the end of month one. Does that math make sense to you?"

**Timing Objection Script:**
"Absolutely, take the time you need. But let me ask — what specifically are you weighing? [Listen.] That's a fair concern. Here's what I'd suggest — let me put together a free mockup of what your site could look like. Zero commitment. You'll see exactly what you'd be getting. If you love it, we move forward. If not, you've lost nothing. Fair enough?"

**Trust Objection Script:**
"I completely get it — and honestly, that's a smart question to ask. Here's what I can tell you: we've helped businesses across many industries, and I can show you real results. But more importantly — I'm your point of contact. Not a call center, not a chatbot. Me. If something isn't right, you have my direct number."

**Internal Builder Script:**
"Totally — and if they're good, that's a real asset. The question is: what happens the month after launch? The month after that? Who's monitoring the SEO, running the updates, tracking performance? That ongoing work is where most DIY sites fall apart — not the initial build. Your nephew keeps their evenings free, and your site keeps improving."

**Contract Objection Script:**
"12 months sounds like a big commitment. Let me reframe it: you're not committing to us, you're committing to your own digital presence. And you own everything — domain, content, code. If you leave, we hand it all over, no questions asked."`
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
        question: "A prospect says '$295/month is too much for a website.' What's the most effective reframe?",
        type: "scenario",
        options: [
          "Offer a 20% discount",
          "Break it down: 'That's less than $10/day — less than lunch. But unlike lunch, this brings in customers 24/7. If it generates just one extra customer per month at your average ticket of $[X], it pays for itself in week one.'",
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
      },
      {
        id: "oh-6",
        question: "A prospect says 'My son is going to build our website — he's good with computers.' What's the best response?",
        type: "scenario",
        options: [
          "Tell them their son probably isn't as good as they think",
          "Offer a discount to compete with the free option",
          "Validate the choice, then separate the build from the ongoing work: 'That's great — the real question is who's going to handle the monthly SEO, updates, and performance optimization after it's live? That's where most sites built by family members fall apart.'",
          "Tell them DIY websites never rank on Google"
        ],
        correctAnswer: 2,
        explanation: "Never badmouth the internal option. The powerful move is reframing the conversation from 'who builds it' to 'who maintains it.' The build is 10% of the work. The ongoing SEO, monitoring, and updates are 90% — and that's exactly what MiniMorph provides.",
        difficulty: "medium"
      },
      {
        id: "oh-7",
        question: "A prospect says 'I can't commit to 12 months — what if it doesn't work?' How do you respond?",
        type: "scenario",
        options: [
          "Offer month-to-month at the same price",
          "Tell them the contract is non-negotiable",
          "Acknowledge the concern, explain why 12 months exists (SEO takes time, pricing reflects commitment), and emphasize that they own everything — domain, content, code — regardless",
          "Offer a 3-month trial period"
        ],
        correctAnswer: 2,
        explanation: "The contract objection is really a risk objection. Defuse it by: (1) explaining why 12 months makes sense for results, (2) emphasizing full content ownership regardless, and (3) reframing it as a commitment to their own results rather than to you. Do NOT offer month-to-month — it's not how our pricing is structured.",
        difficulty: "hard"
      }
    ],
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "objection_handling", minScore: 70, label: "Objection Handling" }
    ]
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

**Script:** "We're currently running our spring launch special — your first month free for projects started this month. After that, it goes back to full price. Want to lock that in?"

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
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "closing", minScore: 70, label: "Closing" }
    ]
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
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "cold_call", minScore: 70, label: "Cold Call" }
    ]
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
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "follow_up", minScore: 70, label: "Follow Up" },
      { scenarioType: "upsell", minScore: 70, label: "Upsell" }
    ]
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
        explanation: "Anchoring sets the reference point. If you start with Enterprise ($495/mo), Pro ($395/mo) feels like a bargain. If you start with Starter ($195/mo), Growth feels expensive. Always anchor high.",
        difficulty: "medium"
      }
    ],
    passingScore: 80,
    requiredRolePlay: [
      { scenarioType: "angry_customer", minScore: 70, label: "Angry Customer" }
    ]
  },

  /* ═══════════════════════════════════════════════════
     MODULE 9: YOUR LEAD PIPELINE (SYSTEM KNOWLEDGE)
     How leads find you, how to work them, and what
     the system expects from you at every stage.
     ═══════════════════════════════════════════════════ */
  {
    id: "lead-pipeline",
    title: "Your Lead Pipeline: How the System Works",
    description: "This module teaches you exactly how leads arrive in your pipeline, what the AI does before you ever see them, how to claim and work leads, and what the system expects from you at every stage. Master this and you'll never wonder where your next deal is coming from.",
    icon: "Target",
    estimatedMinutes: 35,
    lessons: [
      {
        title: "How Leads Find You (The Auto-Feed System)",
        content: `## You Never Have to Prospect — The System Does It For You

At MiniMorph, we operate on the Uber model: you open the app, and work is waiting for you. Here's exactly how that happens.

### The Lead Generation Engine

Our AI continuously generates leads through multiple channels:

1. **AI Web Scraping** — The system scans Google Maps, business directories, and industry databases for local businesses in your service area that need a better website. It identifies businesses with outdated sites, no mobile optimization, or missing online presence.

2. **Website Inquiries** — When a prospect fills out the "Start My Website Build" form on our public site, they become a lead instantly.

3. **AI Outreach & Warming** — Before you ever see a lead, our AI has already reached out via email and SMS. It handles initial conversations, answers basic questions, overcomes early objections, and warms the prospect up. By the time a lead reaches you, they already know who MiniMorph is.

4. **Referrals** — Happy customers refer other businesses. These come in as warm leads with high conversion potential.

### The Auto-Feed System

The system monitors your pipeline capacity in real-time:
- **Minimum threshold:** You'll always have at least 5 active leads in your pipeline
- **Maximum capacity:** You won't receive more than 15-20 leads at once (prevents overwhelm)
- **When you close or lose a lead**, the system automatically backfills with a new one

This means you NEVER have to worry about "where's my next lead coming from?" — the system handles it.

### What Makes You Eligible for Leads

The system only feeds leads to reps who meet ALL of these criteria:
- ✅ **Fully certified** (all Academy modules passed + required role plays)
- ✅ **Daily check-in cleared** (coaching reviews completed each morning)
- ✅ **Performance score above 40** (out of 100)
- ✅ **Under capacity** (fewer than 20 active leads)
- ✅ **Service area configured** (the system needs to know WHERE to find leads for you)

If ANY of these aren't met, the auto-feed pauses until you fix it. This is by design — it protects both you and the prospects from subpar experiences.

### How the System Chooses Which Rep Gets Which Lead

When a lead is ready for assignment, the algorithm considers:
- **Location match** — Leads in your service area get priority (+50 points)
- **Current load** — Reps with fewer active leads get priority
- **Performance score** — Higher performers get first pick on hot leads
- **Tier level** — Platinum and Gold reps get priority on high-value leads`,
        keyTakeaways: [
          "The system auto-feeds you 5-15 leads at all times — you never have to prospect",
          "Leads are pre-warmed by AI before they reach you — they already know MiniMorph",
          "You must be certified, cleared daily check-in, score above 40, and have a service area to receive leads",
          "Higher performance score = better leads assigned to you first",
          "When you close or lose a lead, a new one automatically backfills"
        ]
      },
      {
        title: "The Lead Pool & Claiming Leads",
        content: `## Two Ways Leads Reach You

There are two paths for leads to enter your pipeline:

### Path 1: Auto-Assignment (Most Common)

The system automatically assigns leads to you based on the algorithm described in the previous lesson. You'll get a notification: "New Lead Assigned" or "🔥 Hot Lead Assigned" (for AI-warmed leads). The lead appears in your Pipeline tab under the "Assigned" column.

**Your responsibility:** When you receive an auto-assigned lead, you have **4 hours** to accept and make first contact. If you don't, the lead gets reassigned to the next available rep. This protects the prospect from going cold.

### Path 2: The Lead Pool (Self-Service)

In addition to auto-assignment, there's a shared **Lead Pool** visible on your Pipeline tab. These are leads that haven't been assigned to anyone yet — they're available for any certified rep to claim.

To claim a lead:
1. Click "Claim Lead" on your Pipeline tab
2. Browse available leads (you'll see business name, industry, temperature, and qualification score)
3. Click "Claim" on the one you want
4. It's instantly assigned to you — no one else can grab it

**Why claim from the pool?**
- You want more leads beyond your auto-assigned ones
- You see a lead in an industry you're particularly good at
- You want to build volume faster

### Path 3: Self-Sourced Leads (Double Commission!)

You can also add your OWN leads — businesses you find through networking, referrals, or personal outreach. Click "Add My Lead" on the Pipeline tab.

**The incentive:** Self-sourced leads earn you **double commission** because you did the prospecting work yourself. They're auto-assigned to you immediately.

### Lead Temperature Explained

Every lead has a temperature indicator:
- 🧊 **Cold** — New lead, hasn't engaged yet. Needs warming.
- ☀️ **Warm** — Has shown interest (replied to outreach, visited site, etc.)
- 🔥 **Hot** — Actively looking for a solution. High buying intent detected.

Focus on hot leads first — they're ready to buy NOW. Warm leads need nurturing. Cold leads need the most work.

### Lead Qualification Score

The AI assigns each lead a qualification score (0-100) based on:
- Business size and revenue potential
- Current website quality (worse = more likely to buy)
- Online engagement signals
- Industry fit for our services
- Decision-maker accessibility

Higher scores = higher likelihood of closing. Prioritize 70+ score leads.`,
        keyTakeaways: [
          "Auto-assigned leads give you 4 hours to make first contact or they get reassigned",
          "The Lead Pool lets you claim additional leads beyond your auto-assignments",
          "Self-sourced leads earn DOUBLE commission — add your own leads anytime",
          "Lead temperature (cold/warm/hot) tells you buying intent level — prioritize hot leads",
          "Qualification score (0-100) predicts close probability — focus on 70+ first"
        ]
      },
      {
        title: "Working Your Pipeline: Stage by Stage",
        content: `## The Pipeline Stages — What to Do at Each One

Your pipeline is a kanban board with forward-only progression. Here's exactly what happens at each stage and what's expected of you:

### Stage 1: ASSIGNED
**What it means:** A lead just landed in your pipeline (auto-assigned or claimed).
**Your job:**
- Review the lead card: business name, contact info, enrichment data, AI conversation history
- Check the AI's prior conversation — know what's already been discussed
- Make first contact within 4 hours (call preferred, email acceptable)
- Move to "Contacted" once you've reached out

**Pro tip:** The enrichment data includes decision-maker names, direct phone numbers, and business insights. Use them.

### Stage 2: CONTACTED
**What it means:** You've made first contact with the prospect.
**Your job:**
- Run a discovery call using SPIN methodology (from Module 3)
- Identify their pain points, budget, timeline, and decision-making process
- Build rapport and establish yourself as their trusted advisor
- Move to "Proposal Sent" once you've sent a formal proposal

**Pro tip:** Log your call outcomes (connected, voicemail, no answer, scheduled). The system tracks your activity.

### Stage 3: PROPOSAL SENT
**What it means:** You've sent a formal proposal with pricing.
**Your job:**
- Use the "Generate Proposal" button — AI creates a personalized proposal based on the lead's needs
- Choose the right package tier (Starter $195/mo, Growth $295/mo, Pro $395/mo, Enterprise $495/mo)
- Follow up within 48 hours if no response
- Handle objections using LAER framework (from Module 4)
- Move to "Negotiating" if they push back on price/terms

**Pro tip:** AI-generated proposals are personalized to the lead's industry and pain points. They close better than generic templates.

### Stage 4: NEGOTIATING
**What it means:** The prospect is interested but wants to discuss terms.
**Your job:**
- Apply negotiation principles from Module 8 (trade, don't discount)
- Address final concerns
- Create urgency with deadlines
- Move to "Closed Won" when they sign, or "Closed Lost" if they decline

### Stage 5: CLOSED WON 🎉
**What it means:** Deal done! Customer signed up.
**What happens automatically:**
- Customer account is created with a temporary password
- Portal access email is sent to the customer with their login credentials
- Contract is generated and linked to the customer
- Your commission is calculated based on annual deal value × your tier rate
- A new lead backfills your pipeline automatically

**Your commission math:** Commission = (monthly price × 12) × your rate.
Example: Growth deal at $295/mo on Silver tier = ($295 × 12) × 12% = **$424.80**
Self-sourced lead? Your rate doubles (capped at 40%). Same Growth deal = **$849.60**.

**What the customer experiences next (set this expectation on the call):**
The customer receives an email with their temporary portal password. When they log in, they meet **Elena** — our AI onboarding agent. Elena conducts a natural conversation to collect their brand details: tone, style references, competitor sites, colors, goals. It takes about 15-20 minutes and eliminates the back-and-forth intake calls that most agencies charge extra for.

After Elena's session, the customer's intake brief goes to our build team. They can track their project stage in the portal: Intake → Questionnaire → Assets → Design → Review → Revisions → Launch.

Before the site goes live, **Stripe processes the subscription payment** through the portal's secure checkout. Your commission is triggered and queued for admin approval on successful payment.

**Your job after close:** Introduce Elena to the customer. Tell them: "You'll get an email with your portal login. When you log in, you'll meet Elena — just chat with her like you'd chat with a person. She'll walk you through everything our team needs. It takes 15-20 minutes. After that, we take it from there."

### Stage 6: CLOSED LOST
**What it means:** The prospect declined.
**Your job:**
- Select a reason (price, timing, competitor, not interested, etc.)
- Add notes about what happened — this feeds your AI coaching
- Move on. Not every lead converts, and that's okay.
- The system backfills your pipeline with a new lead

### IMPORTANT: Forward-Only Movement

You can only move leads FORWARD through stages. You cannot move a lead backward. This ensures data integrity and accurate pipeline reporting. If a lead goes cold after being contacted, keep working it in the current stage — don't try to move it back.`,
        keyTakeaways: [
          "Pipeline stages are forward-only: Assigned → Contacted → Proposal Sent → Negotiating → Closed",
          "Make first contact within 4 hours of assignment or the lead gets reassigned",
          "Use the AI Proposal Generator — it creates personalized proposals that close better than templates",
          "Package tiers: Starter ($195/mo), Growth ($295/mo), Pro ($395/mo), Enterprise ($495/mo)",
          "When you close a deal, commission is auto-calculated and a new lead backfills your pipeline",
          "Log every interaction — the system tracks activity and it affects your performance score"
        ]
      },
      {
        title: "SMS, Calls & Email: Communication Rules",
        content: `## How to Communicate With Leads (And What the System Enforces)

The platform gives you three communication channels. Here's how each works and what rules you MUST follow:

### Phone Calls
- Click-to-call directly from any lead card
- Calls are logged automatically with duration and outcome
- The AI analyzes your calls and generates coaching feedback
- Log your outcome after every call: Connected, Voicemail, No Answer, Scheduled

### SMS Messaging
- Send text messages directly from the lead card
- **CRITICAL RULE: You MUST record SMS consent before sending any text**
- The system blocks SMS sending until you've confirmed the lead opted in
- To record consent: Click the SMS icon → Confirm opt-in dialog → Then you can text
- If a lead opts out, the system permanently blocks SMS to that number
- Never text someone who hasn't consented — this is a legal requirement (TCPA compliance)

### Email
- Compose emails with AI-assisted drafting
- Use the "AI Draft" button for personalized copy based on the lead's profile
- Templates are available for common scenarios (intro, follow-up, proposal, check-in)
- All emails are tracked — opens, clicks, and replies are logged

### AI Outreach (What Happens Before You)

Before a lead reaches you, the AI has already:
1. Sent initial outreach emails/SMS
2. Handled early replies and objections
3. Warmed the prospect with relevant information
4. Determined the lead needs a human touch

**Always check the conversation history** before reaching out. The lead may have already discussed pricing, timeline, or specific needs with the AI. Don't ask questions they've already answered — it makes you look unprepared.

### Communication Best Practices
- **Speed-to-lead:** Respond to hot leads within 5 minutes. Every minute of delay reduces conversion by 10%.
- **Multi-channel:** Use calls + emails + SMS together. Different people prefer different channels.
- **Follow-up cadence:** Day 1 (call + email), Day 3 (SMS), Day 5 (call), Day 7 (email), Day 14 (final attempt)
- **Always add value:** Every touchpoint should provide useful information, not just "checking in"

### What Gets Tracked (And Affects Your Score)
- Response time to new leads
- Number of touches per lead
- Call duration and outcomes
- Email open/reply rates
- SMS consent compliance
- Overall activity volume`,
        keyTakeaways: [
          "You MUST record SMS consent before texting any lead — the system enforces this",
          "Always check AI conversation history before contacting a lead — know what's been discussed",
          "Speed-to-lead is critical: respond to hot leads within 5 minutes",
          "Every communication is AI-analyzed and generates coaching feedback",
          "Activity volume, response time, and outcomes all affect your performance score",
          "Use multi-channel outreach: calls + emails + SMS together for best results"
        ]
      },
      {
        title: "Your Performance Score & What Happens If You Don't Perform",
        content: `## The Performance Score: Your Lifeline to Leads

Your performance score (0-100) directly controls how many and how good your leads are. Here's exactly how it works:

### How Your Score Is Calculated

Four factors — activity and close rate carry more weight because they're the most within your control:

1. **Activity Score (30%)** — Are you making calls, sending emails, following up consistently?
2. **Close Rate (30%)** — What percentage of your leads convert to deals?
3. **Client Satisfaction (20%)** — Are your closed customers happy? (Based on onboarding feedback)
4. **Values Compliance (20%)** — Are you following the MiniMorph Code of Conduct?

### What Your Score Means

| Score Range | Rating | What Happens |
|-------------|--------|-------------|
| 80-100 | Excellent | Priority lead assignment, hot leads, fast-track to next tier |
| 60-79 | Good | Normal lead flow, standard assignment |
| 40-59 | Needs Improvement | Reduced lead quality, coaching intensifies |
| Below 40 | FROZEN | No new leads until score improves |

### The Freeze Threshold (Score < 40)

If your score drops below 40, the system **freezes your lead flow**. This means:
- No new auto-assigned leads
- Cannot claim from the Lead Pool
- Must complete additional training to recover
- Your existing leads remain, but no new ones arrive

This protects prospects from being assigned to underperforming reps. To unfreeze: improve your activity, complete coaching reviews, and demonstrate improvement.

### The 4-Hour Acceptance Window

When a lead is assigned to you, you have **4 hours** to accept it (make first contact). If you don't:
- The lead is automatically reassigned to the next available rep
- This counts against your activity score
- Repeated timeouts trigger a performance review

### Strikes & Deactivation

Serious violations earn strikes:
- 3 strikes in a 6-month rolling window = account deactivation
- Instant deactivation for: fraud, confidentiality breach, or client harm
- Strikes are tracked and visible in your Performance Hub

### How to Keep Your Score High
1. **Be consistent** — Daily activity matters more than occasional bursts
2. **Respond fast** — Speed-to-lead is the easiest score booster
3. **Complete training** — Daily check-ins and coaching reviews maintain your values score
4. **Close deals** — Even small deals (Starter tier) count toward your close rate
5. **Follow the process** — Log outcomes, use the tools, don't cut corners

### Your Tier Progression

Your accountability tier determines your commission rate AND how the system treats you:

| Tier | Commission | Requirement | Daily Training |
|------|-----------|-------------|----------------|
| **Bronze** (start) | 10% | Starting tier — everyone begins here | Up to 10 reviews/day |
| **Silver** | 12% | 3+ months active + $3,000+/mo closed MRR | Up to 7 reviews/day |
| **Gold** | 14% | 6+ months active + $7,000+/mo closed MRR | Up to 3 reviews/day |
| **Platinum** | 15% | 12+ months active + $12,000+/mo closed MRR | Exempt — mentor status |

**MRR = Monthly Recurring Revenue.** Every deal you close contributes to your running total. A Starter deal ($195/mo) adds $195 to your MRR. A Growth deal ($295/mo) adds $295. Close enough deals consistently and you advance automatically.

**Platinum perks beyond commission:** First pick on high-value enterprise leads, mentor designation, and exemption from daily training requirements. The system gets out of your way when you've proven yourself.`,
        keyTakeaways: [
          "Performance score below 40 = lead flow FROZEN until you improve",
          "4-hour acceptance window: make first contact or the lead gets reassigned",
          "Score: Activity (30%) + Close Rate (30%) + Client Satisfaction (20%) + Values Compliance (20%)",
          "3 strikes in 6 months = account deactivation",
          "Tier advancement: Silver at 3mo/$3K MRR, Gold at 6mo/$7K MRR, Platinum at 12mo/$12K MRR",
          "Consistency beats intensity — daily activity matters more than sporadic bursts"
        ]
      }
    ],
    quiz: [
      {
        id: "lp-1",
        question: "What is the MINIMUM number of active leads the system tries to maintain in your pipeline?",
        type: "multiple_choice",
        options: [
          "3 leads",
          "5 leads",
          "10 leads",
          "20 leads"
        ],
        correctAnswer: 1,
        explanation: "The auto-feed system maintains a minimum of 5 active leads per rep. When you close or lose a lead, it automatically backfills. The maximum capacity is 15-20 leads to prevent overwhelm.",
        difficulty: "easy"
      },
      {
        id: "lp-2",
        question: "A new lead was just auto-assigned to you. How long do you have to make first contact before it gets reassigned?",
        type: "multiple_choice",
        options: [
          "1 hour",
          "4 hours",
          "24 hours",
          "48 hours"
        ],
        correctAnswer: 1,
        explanation: "You have a 4-hour acceptance window. After that, the lead is automatically reassigned to the next available rep. This protects prospects from going cold and counts against your activity score if you miss it.",
        difficulty: "easy"
      },
      {
        id: "lp-3",
        question: "You want to send an SMS to a new lead. What MUST you do first?",
        type: "scenario",
        options: [
          "Just send the text — speed matters most",
          "Record SMS consent in the system before sending any text message",
          "Ask your manager for permission",
          "Send an email first, then text"
        ],
        correctAnswer: 1,
        explanation: "You MUST record SMS consent before sending any text. The system enforces this — it will block the send if consent isn't recorded. This is a legal requirement under TCPA. Sending unsolicited texts can result in massive fines.",
        difficulty: "medium"
      },
      {
        id: "lp-4",
        question: "Your performance score drops to 35. What happens?",
        type: "scenario",
        options: [
          "Nothing — you just get a warning email",
          "Your commission rate decreases by 2%",
          "Your lead flow is FROZEN — no new leads until your score improves above 40",
          "You're immediately deactivated"
        ],
        correctAnswer: 2,
        explanation: "A score below 40 triggers a lead freeze. No new auto-assigned leads, and you can't claim from the pool. Your existing leads remain, but no new ones arrive until you improve through consistent activity and completed training.",
        difficulty: "medium"
      },
      {
        id: "lp-5",
        question: "What's the benefit of adding a self-sourced lead (one you found yourself)?",
        type: "multiple_choice",
        options: [
          "It counts as two leads toward your quota",
          "You earn DOUBLE commission on self-sourced leads",
          "It improves your performance score by 10 points",
          "You get to skip the proposal stage"
        ],
        correctAnswer: 1,
        explanation: "Self-sourced leads earn double commission because you did the prospecting work yourself. They're auto-assigned to you immediately and incentivize reps to supplement the system's auto-feed with their own networking and outreach.",
        difficulty: "easy"
      },
      {
        id: "lp-6",
        question: "Before calling a lead that was warmed by the AI, you should:",
        type: "scenario",
        options: [
          "Start fresh — introduce yourself and the company from scratch",
          "Review the AI conversation history so you know what's already been discussed",
          "Send an email first to re-introduce yourself",
          "Wait for the lead to call you"
        ],
        correctAnswer: 1,
        explanation: "Always check the AI conversation history before contacting a lead. The prospect may have already discussed pricing, timeline, or specific needs. Asking questions they've already answered makes you look unprepared and wastes their time.",
        difficulty: "medium"
      },
      {
        id: "lp-7",
        question: "Which of these will NOT prevent you from receiving auto-assigned leads?",
        type: "scenario",
        options: [
          "Not completing your daily check-in",
          "Having a performance score of 35",
          "Having 12 active leads in your pipeline",
          "Not having a service area configured"
        ],
        correctAnswer: 2,
        explanation: "Having 12 active leads is fine — the maximum capacity is 15-20. But missing daily check-in, having a score below 40, or not having a service area configured will all block lead assignment.",
        difficulty: "hard"
      },
      {
        id: "lp-8",
        question: "A lead in your pipeline is at the 'Proposal Sent' stage but goes cold. Can you move it back to 'Contacted'?",
        type: "multiple_choice",
        options: [
          "Yes — drag it back to the previous column",
          "No — pipeline stages are forward-only. Keep working it in the current stage.",
          "Yes — but only if you call them first",
          "No — you must close it as lost and get a new lead"
        ],
        correctAnswer: 1,
        explanation: "Pipeline stages are forward-only. You cannot move a lead backward. If a lead goes cold after receiving a proposal, continue follow-up efforts in the current stage. This ensures data integrity and accurate pipeline reporting.",
        difficulty: "hard"
      }
    ],
    passingScore: 80,
  },

  /* ═══════════════════════════════════════════════════
     MODULE 10: CUSTOMER LIFECYCLE & RETENTION
     How MiniMorph keeps clients happy — and why that
     makes your residuals last forever.
     ═══════════════════════════════════════════════════ */
  {
    id: "customer-lifecycle",
    title: "Customer Lifecycle & Retention: Your Residual Machine",
    description: "Closing a deal isn't the end — it's the beginning of your residual income. This module covers what MiniMorph delivers every month, how the post-close customer journey works (Elena, portal, Stripe payment), exactly how your commission is calculated and paid, and how to handle renewals.",
    icon: "TrendingUp",
    estimatedMinutes: 45,
    lessons: [
      {
        title: "What Clients Get Every Month",
        content: `## The Ongoing Value Stack

When a client signs with MiniMorph, they're not just paying for a website. They're paying for an ongoing relationship that keeps delivering value every single month. This is what makes our 12-month commitment not just reasonable — but genuinely in the client's best interest.

### What Your Clients Receive Monthly

**1. Performance Report**
Every month on their anniversary date, clients get a detailed analytics report in their Customer Portal and by email. It covers:
- Page views and unique visitors
- Bounce rate and average session duration
- Top performing pages
- Conversion rate trends
- Actionable recommendations from our team

This is not a generic report — it's specific to their site and their numbers.

**2. Monthly Competitive Workup**
This is the one thing clients consistently say surprised them. Every month, our AI:
- Scrapes their top competitor websites
- Analyzes positioning, messaging, and features
- Identifies gaps and weaknesses in competitor strategy
- Delivers 3 specific, actionable recommendations

The report lands in their inbox AND their Customer Portal under the Insights tab. Most agencies don't do this at all, let alone every single month.

**3. Customer Portal Access**
Clients have a 24/7 self-service portal where they can:
- View all historical reports
- Submit support and update requests
- Browse add-ons and upgrades
- Track their project status
- Manage billing
- Submit referrals

### Why This Matters to You

Every month that client stays = residual income in your pocket. A client who feels they're getting real value doesn't cancel. A client who forgets what they're paying for does. The monthly touchpoints — reports, competitive workups, portal activity — keep clients engaged and reinforce the value of their subscription.

Your job after closing: know this value stack cold so you can explain it confidently. If a client calls you three months in wondering if they should cancel, you remind them: "Did you get your competitive report this month? What did you do with those three recommendations?"`,
        keyTakeaways: [
          "Clients get monthly performance reports, monthly competitive workups, and 24/7 portal access",
          "The competitive workup is a unique differentiator — most agencies don't offer this",
          "Monthly touchpoints prevent churn by keeping clients engaged with their investment",
          "Your residuals depend on client retention — know the value stack cold"
        ]
      },
      {
        title: "The Competitive Workup as a Closing Tool",
        content: `## Using Lifecycle Value to Close Deals

When prospects are comparing MiniMorph to other agencies or DIY tools, most reps make the mistake of only competing on price or features. The smarter move: compete on lifecycle value.

### The Competitive Workup Pitch

Here's a script that works:

> "I want to tell you about something most agencies don't do at all. Every single month — not quarterly, every month — you're going to get a competitive intelligence report in your inbox. We analyze your top competitors' websites, identify what they're doing well and where they're weak, and give you three specific things you can do to beat them that month. It lands in your email and lives in your Customer Portal. Our clients say it's the single thing that most changes how they think about their online presence."

This pitch works because:
- It's concrete and specific (not "we give you great service")
- It's verifiable (they can ask current clients)
- It creates future value (they're imagining getting reports every month)
- It's unique — almost no other agency does monthly competitor analysis

### The Auto-Renewal Advantage

Frame auto-renewal as a benefit, not a trap:

> "And here's the thing — your plan auto-renews so you never have to worry about your site going down because you forgot to pay a renewal fee. You'll get reminders at 60, 30, and 7 days — so if you ever want to make changes or upgrade, you have plenty of time. But if things are working, it just keeps running. That continuity is actually worth something."

### Content Ownership Close

If a prospect is worried about being "locked in":

> "You own everything — your domain, your content, your site. If you ever leave, we hand everything over to you, no questions asked. We're not building a cage — we're building your business. The only reason people stay is because they get results."`,
        keyTakeaways: [
          "Use the competitive workup as a concrete, unique differentiator in pitches",
          "Frame auto-renewal as continuity protection, not a trap",
          "Content ownership objection: everything transfers if they leave — no cage",
          "Monthly lifecycle value (reports + competitive workups) creates stickiness"
        ],
        script: `COMPETITIVE WORKUP PITCH:
"Every month you'll get a competitive intelligence report — we analyze your top competitors and give you three specific recommendations. Most agencies don't do this at all. Our clients say it changes how they think about their entire online strategy."

AUTO-RENEWAL PITCH:
"Your plan auto-renews so you never have to worry about a lapse. You get reminders at 60, 30, and 7 days before renewal — plenty of time to make changes. But if things are working, it just keeps running."

OWNERSHIP CLOSE:
"You own everything — domain, content, site. If you ever leave, we hand it all over. No questions asked. We're not building a cage."`
      },
      {
        title: "Renewal Conversations",
        content: `## Handling Renewal Objections

At 60, 30, and 7 days before contract end, clients get automated reminder emails. Sometimes they'll call you. Here's how to handle the most common conversations.

### "I'm thinking about cancelling"

First rule: never panic. Second rule: ask before you defend.

> "I appreciate you telling me directly — what's driving the thought?"

Listen. Let them talk. Most of the time it's one of three things:
- They don't feel like they're getting value (fixable with a report review call)
- They're budget-constrained (offer a tier downgrade, not cancellation)
- They had a bad support experience (escalate, fix, keep them)

### "I can get a cheaper website somewhere else"

> "You absolutely can. The question is — what do you get after the build? A static website that no one maintains, no analytics, no competitor intelligence, no updates. You'll be paying someone else to fix it in 6 months. With us, you're getting the ongoing strategy work that actually grows your business."

### "I need to think about it"

> "Of course — take your time. One thing worth knowing: everything you've built with us — your content, your domain, your optimization — that's yours to keep regardless. You're not losing that if you renew or don't. The question is just whether you want the ongoing competitive intelligence and support for another year."`,
        keyTakeaways: [
          "Ask before defending — find out WHY they're thinking of cancelling",
          "Budget concern → tier downgrade conversation, not cancellation",
          "Cheap alternative objection → focus on ongoing value, not upfront price",
          "Frame renewal as continued momentum, not a new commitment"
        ]
      },
      {
        title: "Your Commission: How It's Calculated and When You Get Paid",
        content: `## Your Money — Know Exactly How It Works

There should be zero mystery about how you get paid. Here's every detail.

### How Commission Is Calculated

Your commission is based on the **annual value** of the deal — not monthly.

**Formula:** Commission = (Monthly Price × 12) × Your Tier Rate

| Tier | Rate | Starter ($195/mo) | Growth ($295/mo) | Pro ($395/mo) | Enterprise ($495/mo) |
|------|------|-------------------|------------------|----------------|----------------------|
| Bronze | 10% | $234 | $354 | $474 | $594 |
| Silver | 12% | $280.80 | $424.80 | $568.80 | $712.80 |
| Gold | 14% | $327.60 | $495.60 | $663.60 | $831.60 |
| Platinum | 15% | $351 | $531 | $711 | $891 |

### Self-Sourced Leads = Double Commission

If YOU found the lead (not the system), your rate doubles — automatically.

- Bronze self-sourced: 20% (instead of 10%)
- Silver self-sourced: 24% (instead of 12%)
- Gold self-sourced: 28% (instead of 14%)
- Platinum self-sourced: 30% (instead of 15%)

**Cap:** Self-sourced commission is capped at 40% regardless of tier. This protects the business while still rewarding your hustle massively.

**Example:** You're at Silver and you found a Growth lead yourself: ($295 × 12) × 24% = **$849.60** on one deal.

### How Payout Works

1. **You close the deal** — Commission is calculated automatically when the customer's Stripe payment succeeds
2. **Admin reviews and approves** — Commissions go through a brief approval process
3. **You're paid via Stripe Connect** — Direct transfer to your connected bank account
4. **Payout timing** — Approved commissions are processed regularly (you'll see the schedule in your dashboard)

### Setting Up Your Payout Account

Before you can receive your first commission, you need to **connect your bank account through Stripe**. Look for the "Set Up Payouts" option in your rep dashboard. It takes about 5 minutes and requires your bank routing/account number or debit card. If you haven't done this yet, do it now — you don't want to close your first deal and wait on a payout because your account isn't connected.

### Residual Commissions

For recurring monthly commissions (not your initial deal commission — those are one-time on annual value), the system may generate monthly residuals as long as the customer stays active. The exact residual structure is visible in your Performance Hub under "My Commissions."

### What You Can See

In your rep dashboard under **"My Commissions"**, you can track:
- Every commission you've earned
- Status: Pending → Approved → Paid
- The deal it came from
- The exact calculation

No black box. You know exactly what you're owed and where it is in the process at all times.`,
        keyTakeaways: [
          "Commission = (monthly price × 12) × your tier rate — based on annual deal value, not monthly",
          "Self-sourced leads earn double your rate, capped at 40%",
          "Payment is via Stripe Connect — set up your payout account BEFORE you close your first deal",
          "Track every commission in your dashboard under My Commissions",
          "Payout flow: deal closes → payment succeeds → admin approves → Stripe transfers to you"
        ]
      },
    ],
    quiz: [
      {
        id: "cl-1",
        question: "A client calls saying they're thinking about cancelling at renewal. What should you do FIRST?",
        type: "multiple_choice",
        options: [
          "Immediately offer them a discount to stay",
          "Ask what's driving the thought before saying anything else",
          "Tell them about all the value they're getting",
          "Escalate to your manager"
        ],
        correctAnswer: 1,
        explanation: "Always ask before defending. Most cancellation conversations are driven by a fixable issue — but you won't know what it is until you ask. Jumping straight into a pitch feels defensive and often makes things worse.",
        difficulty: "medium"
      },
      {
        id: "cl-2",
        question: "A prospect says 'I can get a website built cheaper somewhere else.' What's the best response?",
        type: "multiple_choice",
        options: [
          "Agree and offer a price match",
          "Explain that MiniMorph is actually cheaper when you factor in hosting",
          "Acknowledge they can, then focus on what they get ongoing vs. a one-time build",
          "Ask for the competitor's quote"
        ],
        correctAnswer: 2,
        explanation: "The monthly competitive workup, performance reports, and ongoing support are the differentiators. A cheaper website is a one-time asset. MiniMorph is an ongoing competitive advantage. Shift the conversation from price to value-per-month.",
        difficulty: "medium"
      },
      {
        id: "cl-3",
        question: "How often do clients receive a competitive intelligence report?",
        type: "multiple_choice",
        options: [
          "Quarterly",
          "Weekly",
          "Annually",
          "Monthly on their anniversary date"
        ],
        correctAnswer: 3,
        explanation: "Clients receive a monthly competitive workup every month on their contract anniversary date. The report analyzes competitor websites and delivers 3 specific actionable recommendations. This is a key differentiator from other agencies.",
        difficulty: "easy"
      },
      {
        id: "cl-4",
        question: "A client says they're worried about being 'locked in' to the 12-month contract. What do you say?",
        type: "multiple_choice",
        options: [
          "All contracts are binding — that's just how it works",
          "We can make it month-to-month for an extra fee",
          "Your domain, content, and site are yours to keep regardless — you own everything",
          "You can cancel anytime with 30 days notice"
        ],
        correctAnswer: 2,
        explanation: "The correct response emphasizes ownership: everything they build with MiniMorph belongs to them. The 12-month commitment isn't a cage — it's what enables the ongoing strategy work. If they leave, everything transfers. That's a genuine differentiator.",
        difficulty: "medium"
      },
      {
        id: "cl-5",
        question: "At how many days before contract renewal do clients receive reminder emails?",
        type: "multiple_choice",
        options: [
          "30 and 7 days",
          "60, 30, and 7 days",
          "90, 60, 30, and 7 days",
          "14 and 7 days"
        ],
        correctAnswer: 1,
        explanation: "Clients receive renewal reminders at 60, 30, and 7 days before contract end. The 7-day email specifically says 'no action needed' — the plan auto-renews. This gives clients plenty of time to make changes if they want to, while removing anxiety about the renewal itself.",
        difficulty: "easy"
      },
      {
        id: "cl-6",
        question: "You just closed a Growth deal ($295/mo) and you're at the Silver tier. What is your commission?",
        type: "multiple_choice",
        options: [
          "$35.40 (12% of $295)",
          "$354 (10% of annual value)",
          "$424.80 (12% of annual value)",
          "$295 (one month's revenue)"
        ],
        correctAnswer: 2,
        explanation: "Commission is calculated on annual value, not monthly. ($295 × 12) × 12% = $424.80. Your tier rate (Silver = 12%) applies to the full 12-month contract value — which is why closing deals at higher tiers and advancing your accountability tier both matter.",
        difficulty: "medium"
      },
      {
        id: "cl-7",
        question: "You found a Pro ($395/mo) lead yourself through your own networking (self-sourced). You're at Bronze tier. What's your commission?",
        type: "multiple_choice",
        options: [
          "$474 (10% of annual value)",
          "$948 (20% of annual value — double Bronze rate)",
          "$711 (15% of annual value)",
          "$395 (one month's revenue)"
        ],
        correctAnswer: 1,
        explanation: "Self-sourced leads earn double your tier rate. Bronze is 10%, so self-sourced Bronze = 20%. ($395 × 12) × 20% = $948. This is the self-sourcing incentive — prospecting your own leads can nearly double your commission on the same deal.",
        difficulty: "hard"
      },
      {
        id: "cl-8",
        question: "After closing a deal, what should you tell the customer to expect next?",
        type: "scenario",
        options: [
          "Tell them to expect a call from your manager to schedule a kickoff meeting",
          "Tell them their site will be live in 2 weeks",
          "Explain that they'll receive a portal login email and will meet Elena — our AI onboarding agent — who will walk them through everything our team needs to build their site",
          "Tell them to wait for an invoice"
        ],
        correctAnswer: 2,
        explanation: "After closing, customers receive a portal access email with a temporary password. When they log in, they meet Elena — the AI onboarding agent who collects their brand details through a natural conversation. Setting this expectation on the call prevents confusion and builds confidence in the process.",
        difficulty: "medium"
      }
    ],
    passingScore: 80,
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
