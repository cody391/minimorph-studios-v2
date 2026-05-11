/**
 * ═══════════════════════════════════════════════════════
 * APP GUIDE — Comprehensive walkthrough of every platform function
 * ═══════════════════════════════════════════════════════
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, GraduationCap, Target, Phone, Mail, MessageSquare,
  DollarSign, BarChart3, Users, Shield, Star, Flame, Trophy,
  Bell, Settings, FileText, Sparkles, TrendingUp, Clock,
  CheckCircle, AlertCircle, ArrowRight, ChevronDown, ChevronUp,
  Zap, Brain, Award, Briefcase, Globe, Lock, Headphones
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  summary: string;
  details: string[];
  tips: string[];
  rank?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50",
    summary: "Your first steps on the MiniMorph Studios platform — from onboarding to your first lead.",
    details: [
      "After signing up, you'll land on the Rep Dashboard. This is your command center for everything.",
      "Before you can access leads or make calls, you MUST complete the Sales Training Academy. This ensures every rep meets our quality standards.",
      "Complete all Academy modules and pass each quiz with 80% or higher to earn your Full Certification.",
      "Once certified, the system automatically activates your account — leads start flowing and your phone goes live.",
      "Check the Overview tab daily for your key metrics: active leads, deals won, earnings, and conversion rate.",
    ],
    tips: [
      "Start with Module 0 (Values & Ethics) — this is the foundation everything else builds on.",
      "Don't rush through lessons. The quizzes test real-world scenarios, not memorization.",
      "Your daily check-in may require reviewing AI coaching feedback before you can start working.",
    ],
  },
  {
    id: "training-academy",
    title: "Sales Training Academy",
    icon: GraduationCap,
    color: "text-purple-600 bg-purple-50",
    summary: "Comprehensive modules that transform you into a psychological selling machine.",
    details: [
      "Module 0: Values & Ethics — The MiniMorph Standard. Our six core values, Code of Conduct, and how they apply in real sales scenarios.",
      "Module 1: Product Mastery — Every service, pricing tier, feature, and competitive advantage MiniMorph offers.",
      "Module 2: Psychology of Selling — Cialdini's 6 weapons of influence (reciprocity, social proof, scarcity, authority, commitment, liking), the buying brain, and rapport building.",
      "Module 3: The Discovery Call — SPIN selling methodology, pain point extraction, needs analysis, and active listening techniques.",
      "Module 4: Objection Handling — The LAER framework (Listen, Acknowledge, Explore, Respond) for the Big 6 objections: price, timing, competitor, trust, the internal builder ('my nephew is doing it'), and the 12-month contract.",
      "Module 5: Closing Techniques — 7 proven closes: assumptive, urgency, summary, alternative, puppy dog, silence, and takeaway.",
      "Module 6: Digital Prospecting — Cold email/SMS frameworks, social selling, LinkedIn outreach, and referral generation strategies.",
      "Module 7: Account Management — Upselling, cross-selling, retention, QBRs, and expansion revenue playbooks.",
      "Module 8: Advanced Tactics — Multi-stakeholder deals, negotiation, contract structuring, and high-value account strategy.",
      "Module 9: Your Lead Pipeline — How leads find you, the auto-feed system, claiming leads, working pipeline stages, communication rules, and performance scoring.",
      "Each module includes real scripts, role-play scenarios, and key takeaways you can use immediately.",
      "Quizzes are scenario-based — they present real sales situations and test your decision-making.",
    ],
    tips: [
      "Read the scripts out loud. Practice them until they feel natural, not robotic.",
      "The Psychology module is the most important — understanding WHY people buy is more powerful than any technique.",
      "Failed a quiz? Review the explanations for each wrong answer before retaking it.",
    ],
  },
  {
    id: "daily-checkin",
    title: "Daily Check-In System",
    icon: Clock,
    color: "text-orange-600 bg-orange-50",
    summary: "Your Daily Sales Prep — complete AI coaching reviews to unlock lead access.",
    details: [
      "Every day before you can access leads and make calls, the system checks if you have pending training.",
      "After each conversation (call, SMS, email), the AI analyzes what you did well and what needs improvement.",
      "These AI coaching insights become 'Coaching Reviews' — personalized training material just for you.",
      "Complete Critical and Important reviews to unlock your daily lead access.",
      "Each review includes: what happened, what you should have done differently, and a quick quiz to confirm understanding.",
      "As you advance through accountability tiers, daily training requirements decrease:",
      "• Bronze (start): Must complete ALL pending reviews (critical + important + suggested) — up to 10/day",
      "• Silver: Must complete critical + important reviews — up to 7/day",
      "• Gold: Must complete critical reviews only — up to 3/day",
      "• Platinum: Exempt from daily sales prep requirement — mentor status",
    ],
    tips: [
      "Do your reviews first thing — they only take 5-10 minutes and make you sharper for the day.",
      "The AI learns your patterns. If you keep making the same mistake, it will create more focused training.",
      "Ranking up isn't just about points — it literally reduces your daily training burden.",
    ],
  },
  {
    id: "leads-pipeline",
    title: "Leads & Pipeline",
    icon: Target,
    color: "text-emerald-400 bg-green-50",
    summary: "How leads flow to you, how to work them, and how to move them through the pipeline.",
    details: [
      "Leads are automatically assigned to you based on your capacity, service area, and performance score.",
      "You'll only receive leads if you're certified AND have completed your daily check-in.",
      "The Pipeline tab shows all your leads organized by stage: New → Contacted → Qualified → Proposal → Negotiation → Won/Lost.",
      "Each lead card shows the business name, contact info, lead score (AI-calculated), and recommended next action.",
      "Click any lead to see full details: business info, conversation history, AI-generated insights, and enriched contact data.",
      "The system auto-enriches leads with decision-maker names, emails, and direct phone numbers using Apollo.io and Hunter.io.",
      "Lead scoring uses machine learning — it factors in business size, online presence, engagement signals, and industry fit.",
      "SELF-SOURCED LEADS: Found a lead yourself? Click 'Add My Lead' at the top of the Pipeline tab. Enter their info and the lead is immediately added to your pipeline — marked as self-sourced, which earns you DOUBLE commission when you close it.",
    ],
    tips: [
      "Focus on high-score leads first — the AI has already identified them as most likely to convert.",
      "Don't let leads go cold. The system tracks response times and it affects your performance score.",
      "Use the AI-suggested talking points before every call — they're personalized to each lead's situation.",
      "Network actively — self-sourced leads earn double commission and go straight to you with no competition.",
    ],
  },
  {
    id: "communications",
    title: "Communications Hub",
    icon: MessageSquare,
    color: "text-indigo-600 bg-indigo-50",
    summary: "Phone calls, SMS, and email — all from one place, all tracked and AI-analyzed.",
    details: [
      "PHONE CALLS: Click-to-call directly from the dashboard. Calls are logged automatically with duration and outcome.",
      "SMS: Send text messages to leads. The AI conversation agent handles initial outreach and warms leads before you engage.",
      "EMAIL: Compose emails with AI-assisted drafting. Templates are available for common scenarios (intro, follow-up, proposal).",
      "All communications are tracked in the lead's conversation history — nothing falls through the cracks.",
      "The AI analyzes every interaction and provides coaching feedback on your tone, technique, and effectiveness.",
      "Outreach sequences run automatically — the system sends initial emails/SMS to new leads on your behalf.",
      "When a lead replies, the AI conversation agent handles the first response. If buying intent is detected, it hands off to you.",
      "If the AI detects the lead needs a human touch, you'll get a notification with full context.",
    ],
    tips: [
      "Always check the AI's conversation history before calling a lead — know what's already been discussed.",
      "Use the AI Draft feature for emails — it writes personalized copy based on the lead's profile and history.",
      "Respond to hot leads within 5 minutes. Speed-to-lead is the #1 factor in conversion rates.",
    ],
  },
  {
    id: "earnings",
    title: "Earnings & Commissions",
    icon: DollarSign,
    color: "text-emerald-600 bg-emerald-50",
    summary: "Track your commissions, bonuses, and payout history in real-time.",
    details: [
      "The Earnings tab shows your total earnings, pending commissions, and payout history.",
      "Commission is based on annual deal value × your tier rate. Example: Growth ($295/mo) at Silver tier = $295 × 12 × 12% = $424.80.",
      "Self-sourced leads earn DOUBLE commission (capped at 40%) — add them via 'Add My Lead' in the Pipeline tab.",
      "Accountability tiers determine your commission rate: Bronze 10%, Silver 12%, Gold 14%, Platinum 15%.",
      "Tier advancement: Silver at 3mo + $3K MRR, Gold at 6mo + $7K MRR, Platinum at 12mo + $12K MRR.",
      "Commissions are paid via Stripe Connect — set up your payout account in the Payouts section before your first deal.",
    ],
    tips: [
      "Check your earnings weekly to stay motivated and track your trajectory.",
      "Upsells and cross-sells often have higher commission rates than new sales.",
      "Maintain your daily streak — streak bonuses compound over time.",
    ],
  },
  {
    id: "tiers-gamification",
    title: "Accountability Tiers & Gamification",
    // NOTE: Test checks for 'Accountability Tiers' substring — keep this title
    icon: Trophy,
    color: "text-yellow-600 bg-yellow-50",
    summary: "Your tier determines your commission rate, daily training requirements, and lead priority.",
    details: [
      "ACCOUNTABILITY TIERS: Based on months active + monthly closed revenue (MRR). Performance score also factors in.",
      "TIERS & ADVANCEMENT:",
      "• Bronze (start): 10% commission — standard leads, full daily training",
      "• Silver: 12% commission — requires 3+ months + $3,000+/mo closed MRR",
      "• Gold: 14% commission — requires 6+ months + $7,000+/mo closed MRR",
      "• Platinum: 15% commission — requires 12+ months + $12,000+/mo closed MRR; daily training exempt; mentor status; first pick on high-value leads",
      "PERFORMANCE SCORE (0-100): Activity 30% + Close Rate 30% + Client Satisfaction 20% + Values Compliance 20%. Score below 40 freezes your lead flow.",
      "POINTS & STREAKS: Earned for every productive activity — calls, emails, deals, training. Longer streaks = bigger multipliers.",
      "BADGES: Special achievements like 'First Deal', 'Perfect Week', '10-Day Streak', 'Quiz Master', etc.",
      "LEADERBOARD: See how you rank against other reps. Top performers get highlighted.",
    ],
    tips: [
      "Consistency beats intensity. A 30-day streak earns more than sporadic bursts of activity.",
      "Focus on conversion rate and activity consistency to advance tiers — that's where the real money is.",
      "The leaderboard resets monthly — everyone gets a fresh shot at #1.",
    ],
  },
  {
    id: "first-90-days",
    title: "Your First 90 Days",
    icon: Flame,
    color: "text-orange-600 bg-orange-50",
    summary: "A structured roadmap for your first 3 months — from certification to consistent production.",
    details: [
      "WEEK 1-2: CERTIFICATION PHASE",
      "• Complete all Academy modules and pass every quiz (80%+ required)",
      "• Focus on Values & Ethics first — it sets the foundation for everything",
      "• Use AI Role Play to practice before real calls — try cold call and discovery scenarios",
      "• Goal: Full certification and account activation",
      "WEEK 3-4: FIRST CONTACTS",
      "• Your first leads arrive. Start with warm leads to build confidence.",
      "• Complete daily training every morning — it takes 5-10 minutes and sharpens your skills",
      "• Make at least 10 calls per day. Volume builds muscle memory.",
      "• Goal: First 3 qualified proposals sent",
      "MONTH 2: BUILDING RHYTHM",
      "• Aim for 15-20 calls/day and 5+ proposals/week",
      "• Study your AI coaching feedback — look for patterns in what's working",
      "• Start using email templates and SMS follow-ups to nurture leads",
      "• Goal: Close your first deal and earn your first commission",
      "MONTH 3: SCALING UP",
      "• Work toward Silver tier (3 months active + $3K/mo closed MRR) — consistent activity gets you there",
      "• Use the Comms Hub to run multi-channel outreach (calls + emails + SMS)",
      "• Practice objection handling and closing scenarios in AI Role Play",
      "• Goal: 3+ closed deals, consistent daily activity, Silver tier qualification",
    ],
    tips: [
      "The reps who succeed treat the first 90 days like boot camp — intense, focused, no shortcuts.",
      "Don't skip daily training even when it feels repetitive. The compound effect is real.",
      "Ask for help early. Use the support system — don't struggle alone for days on something a quick question could solve.",
      "Track your numbers daily. What gets measured gets improved.",
    ],
  },
  {
    id: "ai-coaching",
    title: "AI Coaching & Feedback",
    icon: Brain,
    color: "text-pink-600 bg-pink-50",
    summary: "After every conversation, AI reviews your performance and creates personalized training.",
    details: [
      "The AI Coach analyzes every call, SMS exchange, and email conversation you have with leads.",
      "It evaluates: rapport building, discovery questions, objection handling, closing attempts, and follow-up quality.",
      "After analysis, it generates a Coaching Review with:",
      "• What you did well (reinforcement of good habits)",
      "• What needs improvement (specific, actionable feedback)",
      "• A scenario-based quiz question to test your understanding",
      "• Priority level: Critical (must fix), Important (should improve), Suggested (nice to have)",
      "Critical reviews often relate to compliance issues, missed buying signals, or lost deals.",
      "Important reviews focus on technique refinement — better discovery questions, stronger closes, etc.",
      "Suggested reviews are optimization tips — small tweaks that compound over time.",
      "Your coaching history is tracked — you can see patterns in your improvement over time.",
    ],
    tips: [
      "Don't take critical feedback personally — it's designed to prevent you from repeating costly mistakes.",
      "Look for patterns in your coaching reviews. If the AI keeps flagging the same issue, prioritize that module.",
      "The best reps actively seek out coaching reviews — they treat them as competitive advantages.",
    ],
  },
  {
    id: "support",
    title: "Support & Resources",
    icon: Headphones,
    color: "text-teal-600 bg-teal-50",
    summary: "Submit support tickets, access resources, and get help when you need it.",
    details: [
      "The Support tab lets you submit tickets for technical issues, lead disputes, or general questions.",
      "Ticket categories: Technical Issue, Lead Quality, Commission Dispute, Feature Request, Other.",
      "Priority levels: Low, Medium, High, Urgent.",
      "You'll receive notifications when your ticket is updated or resolved.",
      "The knowledge base in the Training Academy covers most common questions.",
      "For urgent issues (system down, can't make calls), mark the ticket as Urgent for fastest response.",
    ],
    tips: [
      "Include screenshots or specific lead IDs when reporting issues — it speeds up resolution.",
      "Check the Training Academy first — many questions are answered in the module content.",
      "Feature requests are taken seriously — the platform evolves based on rep feedback.",
    ],
  },
  {
    id: "settings",
    title: "Settings & Profile",
    icon: Settings,
    color: "text-gray-600 bg-gray-50",
    summary: "Manage your profile, notification preferences, service areas, and account settings.",
    details: [
      "PROFILE: Update your name, photo, phone number, and bio. A professional photo builds trust with leads.",
      "SERVICE AREAS: Set your geographic coverage. You'll only receive leads in your service areas.",
      "NOTIFICATIONS: Control which alerts you receive — new leads, coaching reviews, system updates, etc.",
      "Push notifications can be enabled for real-time alerts on your phone.",
      "AVAILABILITY: Set your working hours so the system doesn't assign leads outside your schedule.",
    ],
    tips: [
      "Keep your profile photo professional — leads may see it in email signatures.",
      "Set realistic service areas. Better to dominate a small area than spread thin across many.",
      "Enable push notifications for new lead assignments — speed-to-lead wins deals.",
    ],
  },
];

export default function AppGuide() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["getting-started"]));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSections(new Set(GUIDE_SECTIONS.map(s => s.id)));
  const collapseAll = () => setExpandedSections(new Set());

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif text-off-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-electric" />
            Platform Guide
          </h2>
          <p className="text-sm text-soft-gray font-sans mt-1">
            Everything you need to know about every function in the app
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="text-xs font-sans">
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs font-sans">
            Collapse All
          </Button>
        </div>
      </div>

      {/* Quick Navigation */}
      <Card className="border-border/50">
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs font-sans text-soft-gray mb-2">Jump to section:</p>
          <div className="flex flex-wrap gap-1.5">
            {GUIDE_SECTIONS.map(section => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setExpandedSections(prev => { const next = new Set(prev); next.add(section.id); return next; });
                  document.getElementById(`guide-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="text-[11px] sm:text-xs font-sans h-7 px-2"
              >
                <section.icon className="w-3 h-3 mr-1" />
                {section.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {GUIDE_SECTIONS.map(section => {
        const isExpanded = expandedSections.has(section.id);
        const Icon = section.icon;

        return (
          <Card key={section.id} id={`guide-${section.id}`} className="border-border/50 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full text-left p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-midnight/50 transition-colors"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${section.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-serif text-off-white">{section.title}</h3>
                  {section.rank && (
                    <Badge className="text-[10px] bg-electric/10 text-electric">{section.rank}</Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-soft-gray font-sans mt-0.5">{section.summary}</p>
              </div>
              <div className="shrink-0 mt-1">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-soft-gray/60" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-soft-gray/60" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border/30">
                {/* Details */}
                <div className="mt-4 space-y-2">
                  {section.details.map((detail, i) => (
                    <div key={i} className="flex gap-2 text-sm text-off-white/80 font-sans">
                      {detail.startsWith("•") ? (
                        <span className="ml-4">{detail}</span>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 text-electric shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tips */}
                {section.tips.length > 0 && (
                  <div className="mt-4 bg-amber-500/10 rounded-lg p-3 sm:p-4">
                    <p className="text-xs font-sans font-semibold text-amber-800 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Pro Tips
                    </p>
                    <div className="space-y-1.5">
                      {section.tips.map((tip, i) => (
                        <p key={i} className="text-xs sm:text-sm text-amber-700 font-sans flex gap-2">
                          <Star className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Bottom CTA */}
      <Card className="border-electric/20 bg-electric/5">
        <CardContent className="p-4 sm:p-6 text-center">
          <Award className="w-10 h-10 text-electric mx-auto mb-3" />
          <h3 className="text-lg font-serif text-off-white mb-2">Ready to Start Closing?</h3>
          <p className="text-sm text-soft-gray font-sans mb-4 max-w-md mx-auto">
            Complete your Academy certification, review your daily coaching, and start turning leads into revenue.
            The platform does the heavy lifting — you bring the human touch.
          </p>
          <Badge className="bg-charcoal text-off-white text-xs font-sans">
            Remember: Consistency beats intensity. Show up every day.
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
