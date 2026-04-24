import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, Clock, Users, Award, Zap, Target,
  CheckCircle, ArrowRight, Star, Briefcase, GraduationCap,
  Shield, Trophy, Flame, ChevronDown, ChevronUp,
} from "lucide-react";
import { useLocation } from "wouter";

const EARNINGS_EXAMPLES = [
  { deals: 5, avgDeal: 1499, monthly: "$749", annual: "$8,993", level: "Part-Time Closer" },
  { deals: 10, avgDeal: 1999, monthly: "$1,999", annual: "$23,988", level: "Full-Time Rep" },
  { deals: 20, avgDeal: 2499, monthly: "$4,998", annual: "$59,976", level: "Top Performer" },
  { deals: 30, avgDeal: 3499, monthly: "$10,497", annual: "$125,964", level: "Elite Legend" },
];

const BENEFITS = [
  { icon: DollarSign, title: "10-20% Commission", desc: "Earn on every sale. Your rate increases as you level up — Legends earn 20%." },
  { icon: Clock, title: "Flexible Schedule", desc: "Work when you want, where you want. Full-time or part-time — you set the pace." },
  { icon: GraduationCap, title: "Full Training", desc: "5-module certification program covers product, sales, tools, and brand standards." },
  { icon: Zap, title: "AI-Powered Tools", desc: "AI drafts emails, generates proposals, and qualifies leads for you." },
  { icon: Trophy, title: "Gamification", desc: "Earn points, unlock badges, climb the leaderboard, and compete for bonuses." },
  { icon: Shield, title: "Stripe Payouts", desc: "Direct deposit to your bank account. Transparent commission tracking." },
  { icon: Target, title: "Hot Leads Provided", desc: "We generate leads through marketing. You close them. No cold calling required." },
  { icon: Users, title: "Referral Bonuses", desc: "Refer a rep who closes their first deal? Earn a $200 bonus." },
];

const FAQS = [
  {
    q: "What does a typical day look like?",
    a: "You log into your rep dashboard, check your lead queue, make calls or send emails using our templates, log activities, and close deals. Most reps spend 2-4 hours on active selling. The AI tools handle proposal generation and follow-up scheduling.",
  },
  {
    q: "Do I need sales experience?",
    a: "Helpful but not required. Our training program covers everything from product knowledge to objection handling. If you're motivated and professional, we'll teach you the rest.",
  },
  {
    q: "How do I get paid?",
    a: "Commissions are tracked automatically. After admin approval, payouts go directly to your bank account via Stripe Connect. You can see pending, approved, and paid commissions in real-time on your dashboard.",
  },
  {
    q: "Is this a full-time or part-time role?",
    a: "Either! You set your own schedule. Some reps do this alongside their day job (5-10 hours/week), others go full-time (30+ hours/week). Your earnings scale with your effort.",
  },
  {
    q: "What tools do I get?",
    a: "A full rep dashboard with lead management, email templates, AI-powered proposal generator, call logging, activity tracking, gamification system, and a branded digital business card.",
  },
  {
    q: "How does the commission tier system work?",
    a: "You start at 10% (Rookie). As you earn points through activities and closed deals, you level up: Closer (12%), Ace (14%), Elite (16%), Legend (20%). Points come from calls, emails, meetings, and closed deals.",
  },
];

const LEVELS = [
  { name: "Rookie", rate: "10%", points: "0+", icon: Shield, color: "bg-gray-100 text-gray-700" },
  { name: "Closer", rate: "12%", points: "500+", icon: Target, color: "bg-blue-100 text-blue-700" },
  { name: "Ace", rate: "14%", points: "2,000+", icon: Star, color: "bg-purple-100 text-purple-700" },
  { name: "Elite", rate: "16%", points: "5,000+", icon: Trophy, color: "bg-amber-100 text-amber-700" },
  { name: "Legend", rate: "20%", points: "10,000+", icon: Flame, color: "bg-yellow-100 text-yellow-700" },
];

export default function Careers() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest/95 to-forest/85" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-terracotta blur-3xl" />
          <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-sage blur-3xl" />
        </div>
        <div className="relative container max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="bg-terracotta/20 text-terracotta border-terracotta/30 font-sans text-xs mb-6">
              Now Hiring Sales Representatives
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight mb-6">
              Sell websites.<br />
              <span className="text-terracotta italic">Earn big.</span><br />
              Work free.
            </h1>
            <p className="text-lg text-white/70 font-sans max-w-xl mb-8">
              Join MiniMorph Studios as a sales rep. We provide the leads, the tools, and the training.
              You bring the hustle. Earn 10-20% commission on every deal you close.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setLocation("/become-rep/values")}
                className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 py-6 text-base font-sans"
              >
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById("earnings")?.scrollIntoView({ behavior: "smooth" })}
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-sans"
              >
                See Earnings Potential
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-forest/5 border-y border-border/20">
        <div className="container max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { value: "10-20%", label: "Commission Rate" },
              { value: "100%", label: "Remote" },
              { value: "AI-Powered", label: "Sales Tools" },
              { value: "Flexible", label: "Schedule" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-serif text-forest">{s.value}</p>
                <p className="text-xs text-forest/50 font-sans">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-forest mb-3">Why reps love MiniMorph</h2>
            <p className="text-forest/60 font-sans max-w-xl mx-auto">Everything you need to succeed — tools, training, leads, and a clear path to higher earnings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b) => (
              <Card key={b.title} className="border-border/30 hover:border-terracotta/30 hover:shadow-sm transition-all group">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center mb-3 group-hover:bg-terracotta/20 transition-colors">
                    <b.icon className="h-5 w-5 text-terracotta" />
                  </div>
                  <h3 className="text-sm font-medium text-forest font-sans mb-1">{b.title}</h3>
                  <p className="text-xs text-forest/50 font-sans leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section id="earnings" className="py-20 bg-forest/5">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-forest mb-3">Earnings potential</h2>
            <p className="text-forest/60 font-sans max-w-xl mx-auto">Your income scales with your effort. Here's what reps earn at different activity levels.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EARNINGS_EXAMPLES.map((e, i) => (
              <Card key={e.level} className={`border-border/30 ${i === 2 ? "ring-2 ring-terracotta/30 shadow-md" : ""}`}>
                <CardContent className="p-6 text-center">
                  {i === 2 && <Badge className="bg-terracotta text-white text-[10px] font-sans mb-3">Most Popular</Badge>}
                  <p className="text-xs text-forest/50 font-sans uppercase tracking-wide mb-1">{e.level}</p>
                  <p className="text-3xl font-serif text-forest mb-1">{e.monthly}</p>
                  <p className="text-xs text-forest/40 font-sans mb-4">/month</p>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-forest/50">Deals/month</span>
                      <span className="text-forest font-medium">{e.deals}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-forest/50">Avg deal size</span>
                      <span className="text-forest font-medium">${e.avgDeal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans border-t border-border/20 pt-2 mt-2">
                      <span className="text-forest/50">Annual earnings</span>
                      <span className="text-forest font-bold">{e.annual}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-[10px] text-forest/40 font-sans text-center mt-4">
            Based on 10% base commission rate. Top performers at Legend tier earn 20%, doubling these figures.
          </p>
        </div>
      </section>

      {/* Level System */}
      <section className="py-20">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-forest mb-3">Level up, earn more</h2>
            <p className="text-forest/60 font-sans max-w-xl mx-auto">Your commission rate grows as you prove yourself. Every activity earns points toward the next level.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {LEVELS.map((l, i) => (
              <div key={l.name} className="flex items-center gap-4 p-4 rounded-xl border border-border/30 hover:border-terracotta/20 transition-colors">
                <div className={`w-12 h-12 rounded-full ${l.color} flex items-center justify-center shrink-0`}>
                  <l.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-forest font-sans">{l.name}</h3>
                    <Badge variant="outline" className="text-[10px] font-sans">{l.points} points</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif text-forest">{l.rate}</p>
                  <p className="text-[10px] text-forest/40 font-sans">commission</p>
                </div>
                {i < LEVELS.length - 1 && (
                  <div className="hidden md:block text-forest/20">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-forest/5">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-forest mb-3">How it works</h2>
            <p className="text-forest/60 font-sans max-w-xl mx-auto">From application to your first commission — here's the journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Apply", desc: "Fill out our 4-step application. Tell us about yourself, your experience, and why you want to join.", icon: Briefcase },
              { step: "02", title: "Train", desc: "Complete 5 training modules covering product, sales, tools, and brand standards. Pass the certification quiz.", icon: GraduationCap },
              { step: "03", title: "Sell", desc: "Get assigned hot leads, use AI tools to draft emails and proposals, log activities, and close deals.", icon: Target },
              { step: "04", title: "Earn", desc: "Commissions are tracked automatically. Get paid directly to your bank via Stripe Connect.", icon: DollarSign },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="h-6 w-6 text-terracotta" />
                </div>
                <p className="text-xs text-terracotta font-sans font-bold mb-1">STEP {s.step}</p>
                <h3 className="text-lg font-serif text-forest mb-2">{s.title}</h3>
                <p className="text-xs text-forest/50 font-sans leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-forest mb-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-border/30 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-forest/5 transition-colors"
                >
                  <span className="text-sm font-medium text-forest font-sans pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-forest/40 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-forest/40 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-xs text-forest/60 font-sans leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-forest">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Ready to start earning?</h2>
          <p className="text-white/60 font-sans max-w-xl mx-auto mb-8">
            Join the MiniMorph team. No cold calling, no inventory, no overhead. Just close deals and get paid.
          </p>
          <Button
            onClick={() => setLocation("/become-rep/values")}
            className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-10 py-6 text-base font-sans"
          >
            Apply Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-white/30 font-sans text-xs mt-4">Applications reviewed within 48 hours</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/10">
        <div className="container max-w-6xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-forest rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-serif text-forest">MiniMorph Studios</span>
          </div>
          <p className="text-xs text-forest/40 font-sans">&copy; {new Date().getFullYear()} MiniMorph Studios. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
