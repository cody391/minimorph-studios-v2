import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, Heart, Eye, Scale, Handshake, DollarSign,
  ArrowLeft, ArrowRight, Star, Users, Zap, Lock,
  CheckCircle, AlertTriangle,
} from "lucide-react";

const CORE_VALUES = [
  {
    icon: Shield,
    title: "Integrity First",
    description: "We never misrepresent our product, overpromise results, or pressure anyone into a purchase. Our reputation is built on honesty — one conversation at a time.",
  },
  {
    icon: Heart,
    title: "Client Obsession",
    description: "Every business we serve is someone's livelihood. We treat their goals as our own. If our product isn't the right fit, we say so.",
  },
  {
    icon: Eye,
    title: "Radical Transparency",
    description: "No hidden fees, no bait-and-switch, no fine print tricks. We tell clients exactly what they're getting, what it costs, and what to expect.",
  },
  {
    icon: Scale,
    title: "Ethical Selling",
    description: "We sell solutions, not fear. We educate, not manipulate. Our sales process is consultative — we help businesses make informed decisions.",
  },
  {
    icon: Handshake,
    title: "Trustworthy Representation",
    description: "You carry our brand into every meeting. Clients judge MiniMorph by you. We need people who make us proud — not people we have to worry about.",
  },
  {
    icon: Users,
    title: "Team Above Self",
    description: "We share leads, celebrate wins together, and lift each other up. Lone wolves who hoard information or undercut teammates don't last here.",
  },
];

export default function RepValuesGate() {
  const [, navigate] = useLocation();
  const [acknowledged, setAcknowledged] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    if (isNearBottom) setScrolledToBottom(true);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-forest text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <button
            onClick={() => navigate("/careers")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Careers
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-terracotta" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif mb-3">
            Before You Apply
          </h1>
          <p className="text-lg text-white/80 font-sans max-w-2xl mx-auto leading-relaxed">
            MiniMorph isn't just a company — it's a standard. Read this carefully.
            If our values resonate with who you are, we'd love to have you.
            If they don't, this isn't the right fit.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* The Stakes */}
        <Card className="border-terracotta/30 bg-terracotta/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <h3 className="font-serif text-forest text-lg mb-2">This Is Not a Casual Application</h3>
                <p className="text-forest/70 font-sans text-sm leading-relaxed">
                  We're an AI-driven company that builds premium websites for businesses.
                  Our clients trust us with their brand, their budget, and their growth.
                  That trust starts with <strong>you</strong> — the person representing us.
                </p>
                <p className="text-forest/70 font-sans text-sm leading-relaxed mt-2">
                  We pay extremely well. Top reps earn <strong>$5,000–$15,000+ per month</strong>.
                  But that money comes with responsibility. We require people of
                  <strong> honest, trustworthy, and moral character</strong> to represent our brand.
                  If you're not willing to hold yourself to that standard, please don't continue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who We Are */}
        <Card className="border-sage/20">
          <CardContent className="pt-6">
            <h3 className="font-serif text-forest text-xl mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-terracotta" />
              Who We Are
            </h3>
            <p className="text-forest/70 font-sans text-sm leading-relaxed mb-3">
              MiniMorph Studios is an AI-powered web design company that builds beautiful,
              intelligent websites for small and medium businesses. We combine cutting-edge
              AI technology with human creativity to deliver premium results at accessible prices.
            </p>
            <p className="text-forest/70 font-sans text-sm leading-relaxed mb-3">
              Our clients range from local restaurants to growing SaaS companies.
              Every website we build includes ongoing support, SEO optimization,
              and intelligent features that help businesses grow. We're not a template shop —
              we're a full-service partner.
            </p>
            <p className="text-forest/70 font-sans text-sm leading-relaxed">
              As a rep, you'll be the face of MiniMorph to potential clients.
              You'll consult with business owners, understand their needs,
              and match them with the right solution. You don't need to be technical —
              we handle all the building. You need to be <strong>smart, honest, and driven</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Our Values */}
        <div>
          <h3 className="font-serif text-forest text-xl mb-4 flex items-center gap-2 px-1">
            <Star className="w-5 h-5 text-terracotta" />
            Our Non-Negotiable Values
          </h3>
          <div
            className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scroll-smooth"
            onScroll={handleScroll}
          >
            {CORE_VALUES.map((value, i) => (
              <Card key={i} className="border-sage/20 hover:border-forest/20 transition-colors">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-forest/5 flex items-center justify-center shrink-0">
                      <value.icon className="w-5 h-5 text-forest" />
                    </div>
                    <div>
                      <h4 className="font-serif text-forest font-medium mb-1">{value.title}</h4>
                      <p className="text-forest/60 font-sans text-sm leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* What We Expect */}
        <Card className="border-sage/20 bg-forest/5">
          <CardContent className="pt-6">
            <h3 className="font-serif text-forest text-lg mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-forest" />
              What Happens Next
            </h3>
            <div className="space-y-3 text-forest/70 font-sans text-sm leading-relaxed">
              <p>If you proceed, here's what the application process looks like:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>Create your account</strong> with a professional photo (this goes on your email signature)</li>
                <li><strong>Sign our NDA</strong> and verify your identity — we're trusting you with proprietary information</li>
                <li><strong>Take a timed assessment</strong> (20 minutes) — we evaluate your character and sales aptitude</li>
                <li><strong>Tell us why you want this</strong> — our AI reviews your response for sincerity and effort</li>
                <li><strong>Complete onboarding paperwork</strong> — most of it will be auto-filled from what you already provided</li>
              </ol>
              <p className="mt-3">
                This process is intentionally thorough. We're not looking for warm bodies —
                we're building a team of professionals who represent our brand with pride.
                Every step is designed to ensure mutual fit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earning Potential */}
        <Card className="border-sage/20">
          <CardContent className="pt-6">
            <h3 className="font-serif text-forest text-lg mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-terracotta" />
              The Opportunity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-forest/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-terracotta">10–20%</p>
                <p className="text-xs text-forest/60 mt-1">Commission on every sale</p>
              </div>
              <div className="bg-forest/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-terracotta">$500–2K</p>
                <p className="text-xs text-forest/60 mt-1">Part-time monthly</p>
              </div>
              <div className="bg-forest/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-terracotta">$5K–15K+</p>
                <p className="text-xs text-forest/60 mt-1">Full-time monthly</p>
              </div>
            </div>
            <p className="text-forest/60 font-sans text-sm leading-relaxed">
              No cap on earnings. Recurring revenue on renewals. AI-sourced warm leads.
              We handle delivery — you focus on relationships. This is a real opportunity
              for the right person.
            </p>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="border-forest/30 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3 mb-5">
              <Checkbox
                id="values-ack"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-1"
              />
              <label htmlFor="values-ack" className="text-forest font-sans text-sm leading-relaxed cursor-pointer">
                <strong>I have read and understand MiniMorph's values and expectations.</strong>{" "}
                I am a person of honest, trustworthy, and moral character. I understand that
                this application process is thorough and I commit to taking it seriously.
                I want to represent MiniMorph with integrity and professionalism.
              </label>
            </div>
            <Button
              onClick={() => navigate("/become-rep")}
              disabled={!acknowledged}
              className="w-full bg-forest hover:bg-forest-light text-white rounded-full py-5 font-sans text-base disabled:opacity-40"
              size="lg"
            >
              I Share These Values — Begin Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!acknowledged && (
              <p className="text-center text-forest/40 text-xs mt-3 font-sans">
                Please read our values and check the acknowledgment above to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
