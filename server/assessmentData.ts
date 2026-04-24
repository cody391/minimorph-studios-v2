// MiniMorph Rep Assessment — Questions, Scoring, and Rubric
// Gate 1: Situational Judgment (Character & Integrity) — weighted 2x
// Gate 2: Sales Aptitude (Skills & Instincts) — weighted 1x

export interface AssessmentOption {
  id: string;
  text: string;
  score: number; // 0-3: 0=red flag, 1=weak, 2=acceptable, 3=excellent
}

export interface AssessmentQuestion {
  id: string;
  gate: 1 | 2;
  category: string;
  scenario: string;
  options: AssessmentOption[];
  freeText?: boolean; // If true, also collect a free-text response
}

// ─── GATE 1: SITUATIONAL JUDGMENT (Character & Integrity) ───────────────

export const GATE_1_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "sj1",
    gate: 1,
    category: "Value vs. Price",
    scenario:
      "A potential client tells you: \"I can get a website built on Fiverr for $200. Why would I pay MiniMorph thousands?\" How do you respond?",
    options: [
      {
        id: "sj1a",
        text: "Match their price or offer a steep discount to win the deal",
        score: 0,
      },
      {
        id: "sj1b",
        text: "Tell them Fiverr websites are terrible and they'll regret it",
        score: 1,
      },
      {
        id: "sj1c",
        text: "Acknowledge their concern, then explain the difference in ongoing support, custom design, and business results our clients see",
        score: 3,
      },
      {
        id: "sj1d",
        text: "Say \"You get what you pay for\" and move on to the next lead",
        score: 1,
      },
    ],
  },
  {
    id: "sj2",
    gate: 1,
    category: "Empathy & Professionalism",
    scenario:
      "A client you signed up is frustrated because their website build is taking longer than expected. They call you upset. What do you do?",
    options: [
      {
        id: "sj2a",
        text: "Tell them it's not your department and transfer them to support",
        score: 0,
      },
      {
        id: "sj2b",
        text: "Listen to their frustration, apologize for the delay, get a status update from the team, and follow up with a clear timeline",
        score: 3,
      },
      {
        id: "sj2c",
        text: "Remind them that quality takes time and they need to be patient",
        score: 1,
      },
      {
        id: "sj2d",
        text: "Offer them a partial refund to keep them happy",
        score: 1,
      },
    ],
  },
  {
    id: "sj3",
    gate: 1,
    category: "Integrity",
    scenario:
      "You realize that a lead's business isn't a good fit for MiniMorph's services — they need something we don't offer. But you're close to hitting your monthly target. What do you do?",
    options: [
      {
        id: "sj3a",
        text: "Close the deal anyway — they'll figure it out after they sign up",
        score: 0,
      },
      {
        id: "sj3b",
        text: "Be honest with them, explain why it's not the right fit, and if possible suggest an alternative that would serve them better",
        score: 3,
      },
      {
        id: "sj3c",
        text: "Stretch the truth about what MiniMorph can do to make the sale work",
        score: 0,
      },
      {
        id: "sj3d",
        text: "Tell them we can probably make it work and let the delivery team sort it out",
        score: 1,
      },
    ],
  },
  {
    id: "sj4",
    gate: 1,
    category: "Brand Protection",
    scenario:
      "A client tells you they saw a social media post from someone claiming to be a MiniMorph rep, making guarantees about results that you know aren't accurate — like \"guaranteed 10x revenue in 30 days.\" The client asks if that's true. What do you do?",
    options: [
      {
        id: "sj4a",
        text: "Confirm the claim to avoid losing the deal — you can figure out the details later",
        score: 0,
      },
      {
        id: "sj4b",
        text: "Honestly tell the client that no one can guarantee specific results, explain what MiniMorph actually delivers, and report the misleading post to the company immediately",
        score: 3,
      },
      {
        id: "sj4c",
        text: "Ignore the question and redirect the conversation to pricing",
        score: 1,
      },
      {
        id: "sj4d",
        text: "Tell the client that person probably isn't a real MiniMorph rep and leave it at that",
        score: 1,
      },
    ],
  },
  {
    id: "sj5",
    gate: 1,
    category: "Resilience & Attitude",
    scenario:
      "You've had a rough week — 8 calls, zero closes. Your pipeline feels dry. How do you handle it?",
    options: [
      {
        id: "sj5a",
        text: "Take a few days off to recharge and hope things pick up",
        score: 1,
      },
      {
        id: "sj5b",
        text: "Review your calls to identify what went wrong, adjust your approach, and increase your outreach volume",
        score: 3,
      },
      {
        id: "sj5c",
        text: "Complain to management that the leads are bad quality",
        score: 0,
      },
      {
        id: "sj5d",
        text: "Start looking for a different opportunity — this clearly isn't working",
        score: 0,
      },
    ],
  },
  {
    id: "sj6",
    gate: 1,
    category: "Brand Representation",
    scenario:
      "A potential client asks you a technical question about website features that you don't know the answer to. What do you do?",
    options: [
      {
        id: "sj6a",
        text: "Make up an answer that sounds good — confidence is key",
        score: 0,
      },
      {
        id: "sj6b",
        text: "Say \"I'm not sure about that specific detail, but let me find out from our technical team and get back to you today\"",
        score: 3,
      },
      {
        id: "sj6c",
        text: "Deflect by changing the subject to something you do know about",
        score: 1,
      },
      {
        id: "sj6d",
        text: "Tell them to email support with their question",
        score: 1,
      },
    ],
  },
];

// ─── GATE 2: SALES APTITUDE (Skills & Instincts) ───────────────────────

export const GATE_2_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "sa1",
    gate: 2,
    category: "Objection Handling",
    scenario:
      "A business owner says: \"I'm interested, but I need to think about it. Can you call me back next month?\" What's your best move?",
    options: [
      {
        id: "sa1a",
        text: "Say \"Of course!\" and schedule a follow-up for next month",
        score: 1,
      },
      {
        id: "sa1b",
        text: "Ask what specifically they need to think about, address those concerns now, and try to identify the real hesitation",
        score: 3,
      },
      {
        id: "sa1c",
        text: "Pressure them with a limited-time discount that expires today",
        score: 0,
      },
      {
        id: "sa1d",
        text: "Send them a follow-up email with more information and check in next week",
        score: 2,
      },
    ],
  },
  {
    id: "sa2",
    gate: 2,
    category: "Discovery Skills",
    scenario:
      "You're on a first call with a small business owner who says they \"need a website.\" What's the FIRST thing you do?",
    options: [
      {
        id: "sa2a",
        text: "Start presenting MiniMorph's packages and pricing right away",
        score: 0,
      },
      {
        id: "sa2b",
        text: "Ask questions to understand their business, goals, current challenges, and what they hope a website will do for them",
        score: 3,
      },
      {
        id: "sa2c",
        text: "Send them a link to our pricing page and ask which plan interests them",
        score: 0,
      },
      {
        id: "sa2d",
        text: "Tell them about our most popular package and why most clients choose it",
        score: 1,
      },
    ],
  },
  {
    id: "sa3",
    gate: 2,
    category: "Lead Prioritization",
    scenario:
      "You have 5 leads in your pipeline. Given limited time today, which do you contact FIRST?\n\nA) Submitted a form 3 weeks ago, never responded to your email\nB) Had a great discovery call yesterday, said they'd \"talk to their partner\"\nC) Inbound lead who just submitted a form 10 minutes ago\nD) Existing client whose contract renews next month\nE) Referral from a current client — hasn't been contacted yet",
    options: [
      {
        id: "sa3a",
        text: "Lead A — they've been waiting the longest",
        score: 0,
      },
      {
        id: "sa3b",
        text: "Lead C — strike while the iron is hot, then Lead E (warm referral), then Lead B (follow up on momentum)",
        score: 3,
      },
      {
        id: "sa3c",
        text: "Lead D — renewals are guaranteed money",
        score: 1,
      },
      {
        id: "sa3d",
        text: "Lead B — they're closest to closing",
        score: 2,
      },
    ],
  },
  {
    id: "sa4",
    gate: 2,
    category: "Value Communication",
    scenario:
      "A restaurant owner asks: \"Why do I need a professional website when I already get customers from Google Maps and word of mouth?\" How do you respond?",
    options: [
      {
        id: "sa4a",
        text: "Tell them they're leaving money on the table and need to modernize",
        score: 1,
      },
      {
        id: "sa4b",
        text: "Agree that Google Maps is great, then show how a website with online ordering, menu updates, and reservation booking can increase their revenue by capturing customers who search online before visiting",
        score: 3,
      },
      {
        id: "sa4c",
        text: "Show them competitor restaurants that have websites and are ranking higher",
        score: 2,
      },
      {
        id: "sa4d",
        text: "Offer them our cheapest package since they don't seem to need much",
        score: 0,
      },
    ],
  },
  {
    id: "sa5",
    gate: 2,
    category: "Closing Instinct",
    scenario:
      "After a 30-minute call, the prospect says: \"This all sounds great. Send me the details and I'll review everything.\" What do you do?",
    options: [
      {
        id: "sa5a",
        text: "Say \"Great!\" and send a detailed proposal email",
        score: 1,
      },
      {
        id: "sa5b",
        text: "Summarize what you discussed, confirm they're aligned on the solution, and ask if there's anything preventing them from getting started today",
        score: 3,
      },
      {
        id: "sa5c",
        text: "Offer a discount if they sign up on the call right now",
        score: 0,
      },
      {
        id: "sa5d",
        text: "Ask when would be a good time for a follow-up call to go over the proposal together",
        score: 2,
      },
    ],
  },
  {
    id: "sa6",
    gate: 2,
    category: "Written Communication",
    scenario:
      "In 2-3 sentences, write a message you'd send to a local bakery owner who doesn't have a website yet. Make them interested in learning more about MiniMorph.",
    freeText: true,
    options: [], // Free text — scored manually or by AI
  },
];

// ─── SCORING CONFIGURATION ─────────────────────────────────────────────

export const SCORING = {
  // Gate 1 (Character) is weighted 2x
  gate1Weight: 2,
  // Gate 2 (Sales) is weighted 1x
  gate2Weight: 1,

  // Max possible scores
  gate1MaxPerQuestion: 3,
  gate1QuestionCount: 6,
  gate2MaxPerQuestion: 3,
  gate2QuestionCount: 5, // Q6 is free text, scored separately

  // Thresholds (percentage of max score)
  autoPassThreshold: 70, // 70%+ = auto-pass
  borderlineMin: 50, // 50-69% = borderline (flagged for manual review)
  autoRejectBelow: 50, // Below 50% = auto-reject

  // Individual gate minimums (must pass BOTH)
  gate1MinPercent: 55, // Character minimum — non-negotiable
  gate2MinPercent: 40, // Sales aptitude minimum — can be trained

  // Timer
  timeLimitSeconds: 1200, // 20 minutes
  gracePeriodSeconds: 30, // 30 seconds grace after timer expires (network latency)

  // Retake cooldown
  retakeCooldownDays: 30, // Failed candidates can retake after 30 days
};

export const ALL_QUESTIONS = [...GATE_1_QUESTIONS, ...GATE_2_QUESTIONS];
