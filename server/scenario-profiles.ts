/**
 * SCENARIO_PROFILES — Unique business/person profiles for each of the 8 roleplay scenarios.
 *
 * Each profile includes:
 * - Identity & business details
 * - Scenario type (prospect_sales or current_client_retention)
 * - Conversation stage & prior context
 * - Emotional state & personality
 * - What the person knows / doesn't know
 * - Rep objective & success criteria
 * - Hidden info (only revealed if rep handles it well)
 * - Forbidden rep behaviors
 * - Scoring focus
 * - Stage-accurate opening message
 */

export interface ScenarioProfile {
  scenarioKey: string; // matches the DB enum: cold_call, discovery_call, etc.
  scenarioName: string;
  scenarioType: "prospect_sales" | "current_client_retention";
  businessName: string;
  businessType: string;
  industry: string;
  personName: string;
  personRole: string;
  personPersonality: string;
  emotionalState: string;
  conversationStage: string;
  conversationStartPoint: string;
  priorContextSummary: string;
  whatPersonAlreadyKnows: string;
  whatPersonDoesNotKnowYet: string;
  repObjective: string;
  successCriteria: string[];
  likelyObjectionsOrComplaints: string[];
  hiddenInfoToRevealOnlyIfAsked: string[];
  idealRepBehaviors: string[];
  forbiddenRepBehaviors: string[];
  aiPersonBehaviorInstructions: string;
  scoringFocus: string[];
  openingMessage: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export const SCENARIO_PROFILES: Record<string, ScenarioProfile> = {
  // ─────────────────────────────────────────────────
  // 1. COLD CALL
  // ─────────────────────────────────────────────────
  cold_call: {
    scenarioKey: "cold_call",
    scenarioName: "Cold Call",
    scenarioType: "prospect_sales",
    businessName: "Shoreline Concrete & Coatings",
    businessType: "Contractor / home services",
    industry: "Contractor / home services",
    personName: "Mike Barrett",
    personRole: "Owner/Operator",
    personPersonality: "Busy, skeptical, no-nonsense, does not like sales calls.",
    emotionalState: "Cold, busy, slightly annoyed, willing to give 30 seconds if the rep is clear.",
    conversationStage: "First contact — true cold call",
    conversationStartPoint: "Very beginning. This is true first contact. No prior conversation.",
    priorContextSummary:
      "No prior conversation. MiniMorph discovered the business through lead research. The business has a weak or outdated web presence and relies mostly on referrals.",
    whatPersonAlreadyKnows:
      "Nothing about MiniMorph. Knows his own business well. Knows he gets most work from referrals and word of mouth.",
    whatPersonDoesNotKnowYet:
      "What MiniMorph does, how a professional website could generate leads beyond referrals, what monthly website care includes.",
    repObjective:
      "Earn permission to continue, quickly create relevance, avoid sounding scripted, and get the prospect to agree to a short discovery conversation or website review.",
    successCriteria: [
      "Clear intro — who you are and why you're calling",
      "Fast relevance — mentions observed website/business opportunity without sounding creepy",
      "Asks permission to continue",
      "Does not pitch too much on the first call",
      "Secures a next step (discovery call, website review, or callback time)",
    ],
    likelyObjectionsOrComplaints: [
      "I'm busy right now",
      "I don't need a website",
      "I get all my work from referrals",
      "How did you get my number?",
      "I'm not interested in sales calls",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Mike actually lost a big commercial job last year because the client Googled him and couldn't find a professional site.",
      "His daughter set up a basic Wix page years ago but it's outdated and embarrassing.",
      "He's been thinking about getting a real site but doesn't know where to start.",
    ],
    idealRepBehaviors: [
      "Confident but respectful opening",
      "Gets to the point in under 15 seconds",
      "References something specific about the business (e.g., noticed their Google listing, saw their work on social media)",
      "Asks permission before continuing",
      "Offers a low-commitment next step",
    ],
    forbiddenRepBehaviors: [
      "Reading from a script word-for-word",
      "Launching into a full pitch without permission",
      "Being pushy or not respecting 'I'm busy'",
      "Mentioning pricing on the first cold call",
      "Making guarantees about leads or revenue",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Mike Barrett, owner of Shoreline Concrete & Coatings. You are in the middle of a job when this call comes in. You're skeptical of sales calls but you'll give someone 30 seconds if they're clear and respectful. If the rep is vague, scripted, or pushy, cut them off. If they mention something specific about your business or web presence, you'll be slightly more interested. You do NOT know anything about MiniMorph. Do NOT ask detailed questions about packages or pricing — you're not there yet. If the rep earns your attention, you might agree to a quick call later this week. Do not mention setup fees.",
    scoringFocus: [
      "Permission-based opening",
      "Clarity and relevance",
      "Brevity — respects the prospect's time",
      "Next-step setting",
      "Avoids overpitching",
    ],
    openingMessage:
      "Hey, I'm in the middle of something. What is this about?",
    difficulty: "Intermediate",
  },

  // ─────────────────────────────────────────────────
  // 2. DISCOVERY CALL
  // ─────────────────────────────────────────────────
  discovery_call: {
    scenarioKey: "discovery_call",
    scenarioName: "Discovery Call",
    scenarioType: "prospect_sales",
    businessName: "Q's Landscaping",
    businessType: "Landscaping / lawn care / seasonal services",
    industry: "Landscaping / lawn care / seasonal services",
    personName: "Quinn Hayes",
    personRole: "Owner",
    personPersonality: "Open but cautious, budget-aware, practical.",
    emotionalState: "Curious but guarded.",
    conversationStage: "After first contact — prospect agreed to answer questions",
    conversationStartPoint:
      "After first contact. Prospect agreed to answer questions but is not sold yet.",
    priorContextSummary:
      "The rep or AI already made initial contact. The prospect said they might be interested if it helps generate more seasonal leads. They rely heavily on Facebook and referrals.",
    whatPersonAlreadyKnows:
      "MiniMorph builds websites for small businesses. Someone from MiniMorph reached out and it sounded potentially useful.",
    whatPersonDoesNotKnowYet:
      "Specific packages, pricing, what monthly website care includes, how SEO works, what a professional site could do for seasonal booking.",
    repObjective:
      "Ask strong discovery questions about services, seasons, service areas, current lead sources, bottlenecks, goals, budget, decision timeline, and what a successful website would need to do.",
    successCriteria: [
      "Asks open-ended questions",
      "Identifies business goals and seasonal priorities",
      "Identifies current marketing gaps",
      "Qualifies need and urgency",
      "Learns about budget comfort level",
      "Summarizes pain clearly before pitching",
    ],
    likelyObjectionsOrComplaints: [
      "I'm not sure I need a full website",
      "Most of my work comes from Facebook and referrals",
      "I don't have a big budget for marketing",
      "Winter is slow — I'm not sure this is the right time",
      "What's the point if I already get enough work in summer?",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Quinn actually turns away work in peak season because he can't manage the volume — a website with a quote form could help him filter and prioritize.",
      "He's been thinking about adding hardscaping services but doesn't know how to market them.",
      "His biggest competitor just launched a nice website and it's been bugging him.",
    ],
    idealRepBehaviors: [
      "Asks open-ended questions, not yes/no",
      "Listens more than talks",
      "Takes notes and references what the prospect says",
      "Identifies seasonal patterns and ties them to website value",
      "Does NOT pitch until discovery is complete",
    ],
    forbiddenRepBehaviors: [
      "Pitching packages before understanding the business",
      "Talking more than the prospect",
      "Assuming the prospect's needs without asking",
      "Mentioning pricing before discovery is complete",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Quinn Hayes, owner of Q's Landscaping. You agreed to answer some questions because the initial outreach sounded interesting, but you're not sold yet. You do lawn care, spring cleanups, mowing, and snow removal. You get most of your work from Facebook posts and word of mouth. You're budget-conscious and practical — you need to see clear value before spending money. Answer questions honestly but don't volunteer extra information unless asked good follow-up questions. If the rep asks about your biggest challenge, mention that summer gets overwhelming and you sometimes turn away work. If they ask about competition, mention the competitor's new website. Do not ask about pricing — that's the rep's job to bring up later. Do not mention setup fees.",
    scoringFocus: [
      "Question quality — open-ended, relevant",
      "Listening and follow-up",
      "Pain discovery",
      "Qualification (budget, timeline, decision process)",
      "Summary before pitching",
      "Avoids premature pitching",
    ],
    openingMessage:
      "Yeah, I can answer a few questions. I'm not sure I need a full website though — most of my work comes from Facebook and referrals.",
    difficulty: "Beginner",
  },

  // ─────────────────────────────────────────────────
  // 3. OBJECTION HANDLING
  // ─────────────────────────────────────────────────
  objection_handling: {
    scenarioKey: "objection_handling",
    scenarioName: "Objection Handling",
    scenarioType: "prospect_sales",
    businessName: "Lakeshore Auto Detailing",
    businessType: "Auto detailing / mobile detailing",
    industry: "Auto detailing / mobile detailing",
    personName: "Jordan Miller",
    personRole: "Owner",
    personPersonality: "Interested but cautious, protective of cash flow.",
    emotionalState: "Interested but resistant.",
    conversationStage: "After discovery and value pitch — prospect has a serious objection",
    conversationStartPoint:
      "After discovery and value pitch. Prospect understands MiniMorph but has a serious objection about the monthly cost and 12-month agreement.",
    priorContextSummary:
      "The prospect has been told about the Growth package, monthly website care, quote forms, before/after gallery, local SEO foundation, and monthly reports. They like the idea but hesitate on the monthly cost and 12-month agreement.",
    whatPersonAlreadyKnows:
      "What MiniMorph does, the Growth package features, monthly pricing, 12-month agreement structure, that the site includes ongoing care and updates.",
    whatPersonDoesNotKnowYet:
      "The ROI math — how many new detail jobs per month would pay for the site. That the monthly model means no large upfront cost. That competitors in the area are investing in web presence.",
    repObjective:
      "Acknowledge the objection, clarify the concern, reframe monthly website care vs one-time website handoff, tie value to bookings/credibility, and move toward a low-friction next step.",
    successCriteria: [
      "Does not argue or get defensive",
      "Validates the concern genuinely",
      "Asks a clarifying question to isolate the real objection (price, trust, or timing)",
      "Reframes value in terms of business outcomes",
      "Ties to bookings/credibility without guaranteeing leads",
      "Moves conversation forward with a next step",
    ],
    likelyObjectionsOrComplaints: [
      "$295 a month feels like a lot for a website",
      "I can get a website built for way less on Wix or Squarespace",
      "I don't want to be locked into 12 months",
      "What if it doesn't bring in any new business?",
      "I've been burned by marketing companies before",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Jordan actually tried building a Wix site himself and it looked terrible — he's embarrassed by it.",
      "He recently lost a fleet detailing contract because the company said his online presence wasn't professional enough.",
      "His average detail job is $200-400, so even 1-2 new jobs per month would cover the website cost.",
    ],
    idealRepBehaviors: [
      "Acknowledges the objection without dismissing it",
      "Asks 'Is it the monthly amount, the commitment length, or something else?'",
      "Reframes: monthly care vs. a one-time site that goes stale",
      "Uses the prospect's own numbers to show ROI",
      "Offers a low-friction next step (e.g., 'Let me show you what the site would look like')",
    ],
    forbiddenRepBehaviors: [
      "Arguing about the price",
      "Immediately offering a discount",
      "Saying 'trust me, it's worth it' without evidence",
      "Comparing negatively to competitors by name",
      "Making lead or revenue guarantees",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Jordan Miller, owner of Lakeshore Auto Detailing. You've been through a full discovery call and value pitch with MiniMorph. You like what you heard but $295/month feels like a lot, and 12 months is a big commitment. You're protective of your cash flow because detailing is seasonal. You're NOT hostile — just cautious and need to be convinced. If the rep asks good clarifying questions, reveal that your average job is $200-400 and that you lost a fleet contract due to poor web presence. If the rep just argues or pushes, become more resistant. You are NOT at the beginning of the conversation — do NOT ask 'what does MiniMorph do?' or basic questions. You already know the package details. Do not mention setup fees.",
    scoringFocus: [
      "Empathy and validation",
      "Objection isolation (price vs trust vs timing)",
      "Value reframing",
      "Calm confidence",
      "Next-step progression",
      "Avoids arguing",
    ],
    openingMessage:
      "I get what you're saying, but $295 a month feels like a lot for a website. I don't know if I can justify that.",
    difficulty: "Intermediate",
  },

  // ─────────────────────────────────────────────────
  // 4. CLOSING
  // ─────────────────────────────────────────────────
  closing: {
    scenarioKey: "closing",
    scenarioName: "Closing",
    scenarioType: "prospect_sales",
    businessName: "Velvet & Vine Studio",
    businessType: "Salon / spa / beauty",
    industry: "Salon / spa / beauty",
    personName: "Alyssa Moreno",
    personRole: "Salon Owner",
    personPersonality: "Visual, brand-conscious, excited but wants reassurance.",
    emotionalState: "Warm/hot. Ready to buy, but wants a confident explanation of the final step.",
    conversationStage: "Near the end of the sales conversation — ready to close",
    conversationStartPoint:
      "Near the end of the sales conversation. The bulk of the conversation has already happened.",
    priorContextSummary:
      "First contact happened. Discovery was completed. The prospect explained her current site does not match her salon brand. MiniMorph explained the build, onboarding, review/revision, launch, monthly support, and reports. Monthly pricing was discussed. Objections around design quality and 12-month commitment were handled. Growth or Premium was recommended. Prospect has expressed buying intent.",
    whatPersonAlreadyKnows:
      "Everything about MiniMorph's process: build, onboarding, revision rounds, launch, monthly support, reports. Monthly pricing. Package options. That the design will match her brand.",
    whatPersonDoesNotKnowYet:
      "Exactly what happens after she says yes — the payment link, onboarding steps, timeline for first draft, how revisions work in practice.",
    repObjective:
      "Ask for the sale, confirm package, explain payment/onboarding clearly, reduce uncertainty, and guide the prospect into the next step without reopening old objections.",
    successCriteria: [
      "Directly asks for commitment",
      "Confirms the correct package",
      "Explains payment link / checkout process",
      "Explains what happens after payment (onboarding questionnaire, first draft timeline)",
      "Sets clear expectations for onboarding and first draft",
      "Does not keep pitching unnecessarily",
      "Avoids vague 'I'll follow up' language",
    ],
    likelyObjectionsOrComplaints: [
      "What if I don't like the first design?",
      "How long until the site is live?",
      "Can I make changes after it launches?",
      "What exactly am I paying for each month?",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Alyssa has a grand reopening event in 6 weeks and wants the site live before then.",
      "She's already told her staff about the new website — she's more committed than she's letting on.",
      "Her main concern is that the design will actually look high-end and match her salon's aesthetic.",
    ],
    idealRepBehaviors: [
      "Confidently asks 'Are you ready to move forward?'",
      "Confirms package choice clearly",
      "Explains the exact next steps: payment link → onboarding questionnaire → first draft in X days",
      "Reassures about revision rounds",
      "Sets a specific timeline",
    ],
    forbiddenRepBehaviors: [
      "Continuing to pitch after the prospect said they want to move forward",
      "Reopening objections that were already handled",
      "Being vague about next steps",
      "Saying 'I'll send you some info' instead of closing",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Alyssa Moreno, owner of Velvet & Vine Studio, a high-end salon. You've been through the full sales conversation — discovery, pitch, objection handling — and you're ready to buy. You're excited but you want the rep to confidently walk you through what happens next. If the rep is vague or hesitant, you'll get nervous. If they clearly explain payment, onboarding, and timeline, you'll commit. You are NOT cold — do NOT ask 'who are you?' or 'what does MiniMorph do?' You already know everything. If asked about timeline, mention your grand reopening in 6 weeks. Do not mention setup fees.",
    scoringFocus: [
      "Closing confidence — directly asks for commitment",
      "Next-step clarity — payment, onboarding, timeline",
      "Payment/onboarding explanation",
      "Commitment ask",
      "Avoids reopening handled objections",
      "Does not overpitch after buying signal",
    ],
    openingMessage:
      "Okay, I think this is what we need. If I want to move forward today, what happens next?",
    difficulty: "Intermediate",
  },

  // ─────────────────────────────────────────────────
  // 5. FOLLOW UP
  // ─────────────────────────────────────────────────
  follow_up: {
    scenarioKey: "follow_up",
    scenarioName: "Follow Up",
    scenarioType: "prospect_sales",
    businessName: "G&L Chillidog",
    businessType: "Restaurant / fast casual food",
    industry: "Restaurant / fast casual food",
    personName: "Mark Ellis",
    personRole: "Operator",
    personPersonality: "Busy, distracted, likes the idea but keeps pushing it off.",
    emotionalState: "Still interested but distracted and not urgent.",
    conversationStage: "After a previous interested conversation, but no close",
    conversationStartPoint:
      "After a previous interested conversation and silence. The prospect liked the idea but said they needed to think about it and hasn't responded since.",
    priorContextSummary:
      "The rep spoke with the prospect last week. The prospect liked the idea of a menu/location/catering/event inquiry site but said they needed to think about it. They have not responded since.",
    whatPersonAlreadyKnows:
      "What MiniMorph does at a high level. That they could get a site with menu, location, catering inquiry, and event info. Approximate monthly pricing.",
    whatPersonDoesNotKnowYet:
      "That competitors in the area are investing in online ordering and web presence. That the longer they wait, the more they miss catering and event season.",
    repObjective:
      "Reopen the conversation without sounding needy, remind them of the original pain/opportunity, create urgency, and secure a clear next step.",
    successCriteria: [
      "References the prior conversation specifically",
      "Does not restart from scratch",
      "Respects that they are busy",
      "Reconnects to business value",
      "Asks a direct next-step question",
      "Avoids guilt-tripping or overexplaining",
    ],
    likelyObjectionsOrComplaints: [
      "Things got busy, I haven't thought about it",
      "I'm still not sure I need it right now",
      "Can we talk about this next month?",
      "I'm not ready to commit to anything",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Mark actually has a catering event season coming up in 3 weeks and has no way for people to inquire online.",
      "A food truck competitor just launched a slick website with online ordering.",
      "His daughter keeps telling him he needs a better web presence.",
    ],
    idealRepBehaviors: [
      "References the previous conversation naturally",
      "Acknowledges they've been busy without guilt-tripping",
      "Brings up a specific business reason to act now (catering season, competitor, etc.)",
      "Asks a direct question: 'Would it make sense to get this started before catering season?'",
    ],
    forbiddenRepBehaviors: [
      "Starting over as if they've never talked",
      "Guilt-tripping ('I've been trying to reach you')",
      "Sending a wall of text re-explaining everything",
      "Being passive ('Just checking in, no pressure')",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Mark Ellis, operator of G&L Chillidog, a fast casual restaurant. You talked to a MiniMorph rep last week about getting a website with menu, location, catering inquiry, and event info. You liked the idea but got busy and haven't thought about it since. You're not opposed — just distracted. If the rep references your previous conversation and brings up something relevant (like catering season), you'll re-engage. If they start from scratch or guilt-trip you, you'll disengage. You already know the basics of what MiniMorph does — do NOT ask 'what is MiniMorph?' If asked about upcoming events, mention catering season in 3 weeks. Do not mention setup fees.",
    scoringFocus: [
      "Context recall — references prior conversation",
      "Concise follow-up — doesn't restart from scratch",
      "Urgency creation — ties to business timing",
      "Next-step ask — direct and specific",
      "Avoids guilt/pushiness",
    ],
    openingMessage:
      "Hey, yeah, sorry I didn't get back to you. Things got busy. I haven't really thought about the website since we talked.",
    difficulty: "Intermediate",
  },

  // ─────────────────────────────────────────────────
  // 6. UPSELL
  // ─────────────────────────────────────────────────
  upsell: {
    scenarioKey: "upsell",
    scenarioName: "Upsell",
    scenarioType: "prospect_sales",
    businessName: "Northside Fitness Lab",
    businessType: "Fitness / personal training / small gym",
    industry: "Fitness / personal training / small gym",
    personName: "Darnell Reed",
    personRole: "Gym Owner",
    personPersonality: "Ambitious, energetic, growth-minded, but cost-conscious.",
    emotionalState: "Interested in the basic plan but not yet aware that their needs exceed it.",
    conversationStage: "Mid-to-late sales conversation after basic website need established",
    conversationStartPoint:
      "Mid-to-late sales conversation after a basic website need has been established. The prospect wants the cheapest plan but discovery shows they need more.",
    priorContextSummary:
      "The prospect came in interested in the Starter package because they 'just need a website.' Discovery revealed they actually need class inquiries, trainer profiles, lead capture, analytics, and possibly SMS alerts for new leads. The rep should identify that Growth or Premium plus add-ons may fit better.",
    whatPersonAlreadyKnows:
      "That MiniMorph builds websites. That there's a Starter package. Basic monthly pricing.",
    whatPersonDoesNotKnowYet:
      "That the Starter package won't support class inquiries, trainer profiles, or lead capture. That Growth/Premium includes features that directly match their stated goals. What specific add-ons are available.",
    repObjective:
      "Do not blindly accept the cheapest plan if it will underserve the prospect. Explain why their goals may require a stronger package or add-ons, recommend the right fit, and avoid sounding pushy.",
    successCriteria: [
      "Acknowledges budget concern",
      "Ties recommendation to stated goals (not generic upsell)",
      "Explains difference between Starter and Growth/Premium clearly",
      "Recommends relevant add-ons only if justified by discovery",
      "Avoids overselling unnecessary features",
      "Asks for agreement on priorities before recommending",
    ],
    likelyObjectionsOrComplaints: [
      "I was thinking I'd just start with the cheapest plan",
      "I only need something simple so people can find us",
      "That sounds like more than I need",
      "Can I start basic and upgrade later?",
      "I don't want to pay for features I won't use",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Darnell is planning to launch a 6-week transformation challenge and needs a way to capture signups online.",
      "He's losing potential members because people can't find class schedules or trainer info online.",
      "His biggest competitor has a polished site with online class booking and it's driving him crazy.",
    ],
    idealRepBehaviors: [
      "References what the prospect said during discovery",
      "Shows how Starter won't meet their stated goals",
      "Recommends Growth/Premium based on their specific needs, not generic upsell",
      "Explains add-ons only if they match stated goals",
      "Asks 'Which of these features matters most to you?' before recommending",
    ],
    forbiddenRepBehaviors: [
      "Blindly accepting the cheapest plan without checking fit",
      "Pushing the most expensive package without justification",
      "Listing every feature without tying to the prospect's needs",
      "Making the prospect feel stupid for wanting the basic plan",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Darnell Reed, owner of Northside Fitness Lab, a small gym with personal training and group classes. You want a website but you're thinking basic — 'just something so people can find us.' You don't realize yet that your actual needs (class inquiries, trainer profiles, lead capture, challenge signups) require more than the Starter package. If the rep asks good questions about your goals, reveal the transformation challenge, the class schedule issue, and the competitor's site. If the rep just pushes a more expensive plan without asking why, resist. You're cost-conscious but willing to invest if the value is clearly tied to your goals. Do not mention setup fees.",
    scoringFocus: [
      "Needs-based upsell — ties recommendation to discovered needs",
      "Ethical recommendation — doesn't oversell",
      "Package fit — recommends the right tier",
      "Value explanation — clear and specific",
      "Restraint — doesn't push unnecessary add-ons",
      "Checks agreement before recommending",
    ],
    openingMessage:
      "I was thinking I'd just start with the cheapest plan. I only need something simple so people can find us.",
    difficulty: "Advanced",
  },

  // ─────────────────────────────────────────────────
  // 7. ANGRY CUSTOMER
  // ─────────────────────────────────────────────────
  angry_customer: {
    scenarioKey: "angry_customer",
    scenarioName: "Angry Customer",
    scenarioType: "current_client_retention",
    businessName: "Hammerstone Builds",
    businessType: "Contractor / remodeler",
    industry: "Contractor / remodeler",
    personName: "Rick Donovan",
    personRole: "Owner",
    personPersonality: "Blunt, frustrated, defensive, skeptical because he has been burned by vendors before.",
    emotionalState: "Angry, frustrated, distrustful, considering cancellation or escalation.",
    conversationStage: "Current client is already upset and contacting MiniMorph after a service issue",
    conversationStartPoint:
      "Current client is already upset. This is NOT a sales conversation. Rick is a paying MiniMorph customer who is frustrated about communication and project progress.",
    priorContextSummary:
      "Hammerstone Builds already signed with MiniMorph and has an active or recently launched website project. Rick pays a monthly plan. He expected better communication and faster progress. The project has either missed an expected design/revision update, launched with an issue he noticed, or a support/change request has not been addressed quickly enough. Rick is angry because this reminds him of past bad experiences with web/marketing companies.",
    whatPersonAlreadyKnows:
      "Everything about MiniMorph — he's a paying customer. He knows his package, his monthly cost, what was promised during the sales process, and what he expected the timeline to be.",
    whatPersonDoesNotKnowYet:
      "The specific reason for the delay or issue. What the recovery plan is. Whether MiniMorph actually cares about fixing this.",
    repObjective:
      "De-escalate the current client, validate the frustration, take ownership without making false promises, clarify the issue, explain the immediate recovery plan, set a specific next update time, and retain the customer.",
    successCriteria: [
      "Stays calm throughout",
      "Does not argue or get defensive",
      "Validates frustration genuinely",
      "Apologizes appropriately without over-admitting legal liability",
      "Asks clear questions to understand the specific issue",
      "Summarizes the problem back to the customer",
      "Gives a specific next step and timeline",
      "Avoids blaming the customer or another team",
      "Avoids vague 'we'll look into it'",
      "Protects retention by restoring confidence",
    ],
    likelyObjectionsOrComplaints: [
      "No one updated me",
      "The draft does not match what I asked for",
      "I submitted a support request and nothing happened",
      "I thought monthly support meant this would be handled",
      "I want to cancel",
      "I'm paying every month and I'm not seeing the value",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Rick still wants the site to work and does not actually want to restart with another vendor.",
      "His biggest issue is communication, not the entire product.",
      "If given a clear recovery plan and update time, he is willing to stay.",
      "He has a large remodeling job coming up and wants the site fixed before promoting it.",
    ],
    idealRepBehaviors: [
      "Stays calm and empathetic",
      "Says 'I understand why you're frustrated' or similar",
      "Takes ownership: 'That's on us, and I'm going to fix it'",
      "Asks specific questions: 'Can you tell me exactly what happened?'",
      "Gives a concrete next step: 'I'm going to escalate this right now and you'll hear back by [specific time]'",
      "Does NOT say 'calm down'",
    ],
    forbiddenRepBehaviors: [
      "Getting defensive",
      "Saying 'that is not my department'",
      "Blaming the customer",
      "Promising immediate fixes that may not be realistic",
      "Offering unauthorized refunds or discounts",
      "Minimizing the concern",
      "Arguing about contract terms too early",
      "Saying 'calm down'",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Rick Donovan, owner of Hammerstone Builds. You are a CURRENT MiniMorph customer, NOT a prospect. You are angry because you feel like you've been ignored — either a design update was late, the site launched with issues, or a support request went unanswered. This reminds you of past vendors who overpromised and underdelivered. You are blunt and frustrated. If the rep dismisses your concern, argues, blames you, or gives vague answers, escalate your anger and threaten to cancel. If the rep validates your frustration, takes ownership, asks good questions about what happened, and gives you a specific recovery plan with a timeline, gradually calm down. You do NOT want to restart with another vendor — you just want this fixed and want to feel like someone actually cares. If the rep handles it well, reveal that you have a big remodeling job coming up and need the site working before you promote it. Do not mention setup fees. Remember: you are a PAYING CUSTOMER, not a sales prospect.",
    scoringFocus: [
      "De-escalation — calms the situation",
      "Empathy — validates frustration genuinely",
      "Ownership — takes responsibility",
      "Issue diagnosis — asks what happened",
      "Recovery plan — specific next steps and timeline",
      "Retention — restores confidence",
      "Escalation discipline — doesn't make unauthorized promises",
    ],
    openingMessage:
      "I'm going to be honest — I'm pissed off. I paid you guys to handle this, and now I feel like I'm chasing people for updates. This is exactly why I hate dealing with website companies.",
    difficulty: "Advanced",
  },

  // ─────────────────────────────────────────────────
  // 8. PRICE NEGOTIATION
  // ─────────────────────────────────────────────────
  price_negotiation: {
    scenarioKey: "price_negotiation",
    scenarioName: "Price Negotiation",
    scenarioType: "prospect_sales",
    businessName: "Ember & Oak Coffee Co.",
    businessType: "Cafe / coffee shop",
    industry: "Cafe / coffee shop",
    personName: "Samantha Lee",
    personRole: "Owner",
    personPersonality: "Smart, numbers-focused, interested, but wants a deal.",
    emotionalState: "Interested but negotiating.",
    conversationStage: "After package recommendation and monthly pricing explanation",
    conversationStartPoint:
      "After package recommendation and monthly pricing explanation. Discovery is complete. The prospect likes the package but wants a lower monthly price.",
    priorContextSummary:
      "Discovery is complete. The prospect needs a polished site with menu, hours, location, events, catering inquiry, Google Maps, and social links. Growth package was recommended. Monthly pricing and the 12-month agreement have already been explained.",
    whatPersonAlreadyKnows:
      "What MiniMorph does, the Growth package features, monthly pricing, 12-month agreement, what's included in monthly care.",
    whatPersonDoesNotKnowYet:
      "Whether there are any approved concessions or alternatives. What the Starter package includes (and what it lacks). The full ROI math for a cafe with online presence.",
    repObjective:
      "Hold value, avoid discounting too quickly, clarify what can and cannot be adjusted, offer appropriate alternatives if available, and protect company pricing.",
    successCriteria: [
      "Does not panic-discount",
      "Explains what the monthly price includes",
      "Offers a lower package only if it truly fits",
      "Uses approved concessions only if they exist",
      "Keeps conversation collaborative, not adversarial",
      "Asks for decision based on value",
    ],
    likelyObjectionsOrComplaints: [
      "Can you do it for $195 a month?",
      "My friend got a website for way less",
      "I'm a small cafe, I can't afford $295/month",
      "Can you waive the first month?",
      "What if I pay for 6 months instead of 12?",
    ],
    hiddenInfoToRevealOnlyIfAsked: [
      "Samantha actually has the budget — she's testing whether the rep will cave on price.",
      "She's opening a second location in 4 months and will need another site.",
      "Her current site is on Squarespace and she's paying $40/month but it looks generic and doesn't convert.",
    ],
    idealRepBehaviors: [
      "Acknowledges the ask without immediately caving",
      "Explains what's included in the monthly price (not just 'a website')",
      "Compares value: monthly care vs. a one-time build that goes stale",
      "If appropriate, mentions Starter as an alternative (but only if it fits)",
      "Asks 'Is it the total amount, or is there a specific feature you'd want to adjust?'",
    ],
    forbiddenRepBehaviors: [
      "Immediately offering a discount",
      "Making up discounts that don't exist",
      "Getting flustered or apologetic about pricing",
      "Badmouthing competitors",
      "Mentioning setup fees",
    ],
    aiPersonBehaviorInstructions:
      "You are Samantha Lee, owner of Ember & Oak Coffee Co. You've been through discovery and the rep recommended the Growth package. You like it, but you want to see if you can get a better deal. You're smart and numbers-focused — you'll push for a discount but you're not hostile. If the rep holds value and explains what's included clearly, you'll respect that. If they immediately cave and offer a discount, you'll push for more. You already know the package details — do NOT ask basic questions like 'what does MiniMorph do?' If the rep asks good questions about your budget concern, reveal that you're actually opening a second location soon. If they ask about your current site, mention the Squarespace site that looks generic. Do not mention setup fees.",
    scoringFocus: [
      "Value defense — holds pricing without being rigid",
      "Monthly pricing clarity — explains what's included",
      "Negotiation control — doesn't panic-discount",
      "Avoids unauthorized promises",
      "Package fit — offers alternatives only if appropriate",
      "Collaborative tone",
    ],
    openingMessage:
      "I like the Growth plan, but can you do it for $195 a month? I'm trying to keep costs low.",
    difficulty: "Advanced",
  },
};

/**
 * Helper to get a scenario profile by its key.
 */
export function getScenarioProfile(scenarioType: string): ScenarioProfile | undefined {
  return SCENARIO_PROFILES[scenarioType];
}

/**
 * Get all scenario keys.
 */
export function getAllScenarioKeys(): string[] {
  return Object.keys(SCENARIO_PROFILES);
}
