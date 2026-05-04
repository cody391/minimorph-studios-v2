import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield, Heart, Eye, Scale, Handshake, DollarSign,
  ArrowLeft, ArrowRight, Star, Users, Zap, Lock,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import {
  CORE_VALUES,
  CODE_OF_CONDUCT,
  COMPANY_MISSION,
  CULTURE_STATEMENT,
} from "@shared/companyValues";

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Heart, Eye, Scale, Handshake, Users,
};

export default function RepValuesGate() {
  const [, navigate] = useLocation();
  const [acknowledged, setAcknowledged] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [expandedValue, setExpandedValue] = useState<string | null>(null);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    if (isNearBottom) setScrolledToBottom(true);
  };

  return (
    <div className="min-h-screen bg-midnight">
      <OnboardingProgress currentStep={1} />
      {/* Hero */}
      <div className="bg-charcoal text-off-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <button
            onClick={() => navigate("/careers")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Careers
          </button>
          <div className="w-16 h-16 bg-charcoal/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-electric" />
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
        <Card className="border-electric/30 bg-electric/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h3 className="font-serif text-off-white text-lg mb-2">This Is Not a Casual Application</h3>
                <p className="text-soft-gray font-sans text-sm leading-relaxed">
                  {CULTURE_STATEMENT}
                </p>
                <p className="text-soft-gray font-sans text-sm leading-relaxed mt-2">
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
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-serif text-off-white text-xl mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-electric" />
              Who We Are
            </h3>
            <p className="text-soft-gray font-sans text-sm leading-relaxed mb-3">
              {COMPANY_MISSION}
            </p>
            <p className="text-soft-gray font-sans text-sm leading-relaxed mb-3">
              Our clients range from local restaurants to growing SaaS companies.
              Every website we build includes ongoing support, SEO optimization,
              and intelligent features that help businesses grow. We're not a template shop —
              we're a full-service partner.
            </p>
            <p className="text-soft-gray font-sans text-sm leading-relaxed">
              As a rep, you'll be the face of MiniMorph to potential clients.
              You'll consult with business owners, understand their needs,
              and match them with the right solution. You don't need to be technical —
              we handle all the building. You need to be <strong>smart, honest, and driven</strong>.
            </p>
          </CardContent>
        </Card>

        {/* Our Values — from shared source of truth */}
        <div>
          <h3 className="font-serif text-off-white text-xl mb-4 flex items-center gap-2 px-1">
            <Star className="w-5 h-5 text-electric" />
            Our Non-Negotiable Values
          </h3>
          <div
            className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-smooth"
            onScroll={handleScroll}
          >
            {CORE_VALUES.map((value) => {
              const IconComponent = ICON_MAP[value.icon] || Shield;
              const isExpanded = expandedValue === value.id;
              return (
                <Card
                  key={value.id}
                  className="border-border/50 hover:border-electric/20 transition-colors cursor-pointer"
                  onClick={() => setExpandedValue(isExpanded ? null : value.id)}
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5 text-off-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif text-off-white font-medium mb-1">{value.title}</h4>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-soft-gray/60" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-soft-gray/60" />
                          )}
                        </div>
                        <p className="text-soft-gray font-sans text-sm leading-relaxed">{value.description}</p>

                        {isExpanded && (
                          <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                            <div>
                              <p className="text-xs font-semibold text-off-white/80 uppercase tracking-wide mb-1.5">
                                What This Looks Like in Practice
                              </p>
                              <ul className="space-y-1">
                                {value.inPractice.map((item, i) => (
                                  <li key={i} className="text-soft-gray font-sans text-xs leading-relaxed flex items-start gap-2">
                                    <span className="text-soft-gray mt-0.5">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-700/80 uppercase tracking-wide mb-1.5">
                                Violations (Grounds for Termination)
                              </p>
                              <ul className="space-y-1">
                                {value.violations.map((item, i) => (
                                  <li key={i} className="text-red-700/60 font-sans text-xs leading-relaxed flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">✗</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-center text-soft-gray/60 text-xs mt-2 font-sans">
            Click any value to see what it looks like in practice
          </p>
        </div>

        {/* Code of Conduct Preview */}
        <Card className="border-border/50 bg-electric/3">
          <CardContent className="pt-6">
            <h3 className="font-serif text-off-white text-lg mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-off-white" />
              Code of Conduct
            </h3>
            <p className="text-soft-gray font-sans text-sm leading-relaxed mb-3">
              Every MiniMorph representative signs and abides by our Code of Conduct.
              This isn't a formality — it's the foundation of how we operate.
              Violations result in immediate termination.
            </p>
            <div
              className={`bg-charcoal rounded-lg p-4 border border-border/50 font-sans text-xs text-soft-gray leading-relaxed whitespace-pre-line transition-all ${
                showFullCode ? "" : "max-h-[200px] overflow-hidden relative"
              }`}
            >
              {CODE_OF_CONDUCT}
              {!showFullCode && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="text-soft-gray hover:text-electric text-xs font-sans mt-2 underline"
            >
              {showFullCode ? "Show less" : "Read full Code of Conduct"}
            </button>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="border-border/50 bg-electric/10">
          <CardContent className="pt-6">
            <h3 className="font-serif text-off-white text-lg mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-off-white" />
              What Happens Next
            </h3>
            <div className="space-y-3 text-soft-gray font-sans text-sm leading-relaxed">
              <p>If you proceed, here's what the application process looks like:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>Create your account</strong> with a professional photo (this goes on your email signature)</li>
                <li><strong>Sign our NDA</strong> and verify your identity — we're trusting you with proprietary information</li>
                <li><strong>Take a timed assessment</strong> (20 minutes) — we evaluate your character and sales aptitude</li>
                <li><strong>Tell us why you want this</strong> — our AI reviews your response for sincerity and effort</li>
                <li><strong>Complete onboarding paperwork</strong> — most of it will be auto-filled from what you already provided</li>
                <li><strong>Enter the Academy</strong> — values-first training that connects everything back to who we are</li>
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
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-serif text-off-white text-lg mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-electric" />
              The Opportunity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-electric/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-electric">10–15%</p>
                <p className="text-xs text-soft-gray mt-1">Commission on every sale</p>
              </div>
              <div className="bg-electric/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-electric">$500–2K</p>
                <p className="text-xs text-soft-gray mt-1">Part-time monthly</p>
              </div>
              <div className="bg-electric/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-serif text-electric">$5K–15K+</p>
                <p className="text-xs text-soft-gray mt-1">Full-time monthly</p>
              </div>
            </div>
            <p className="text-soft-gray font-sans text-sm leading-relaxed">
              No cap on earnings. Recurring revenue on renewals. AI-sourced warm leads.
              We handle delivery — you focus on relationships. This is a real opportunity
              for the right person.
            </p>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="border-electric/30 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3 mb-5">
              <Checkbox
                id="values-ack"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-1"
              />
              <label htmlFor="values-ack" className="text-off-white font-sans text-sm leading-relaxed cursor-pointer">
                <strong>I have read and understand MiniMorph Studios' values, Code of Conduct, and expectations.</strong>{" "}
                I am a person of honest, trustworthy, and moral character. I understand that
                this application process is thorough and I commit to taking it seriously.
                I want to represent MiniMorph with integrity and professionalism.
              </label>
            </div>
            <Button
              onClick={() => navigate("/become-rep")}
              disabled={!acknowledged}
              className="w-full bg-electric hover:bg-electric-light text-white rounded-full py-5 font-sans text-base disabled:opacity-40"
              size="lg"
            >
              I Share These Values — Begin Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!acknowledged && (
              <p className="text-center text-soft-gray/60 text-xs mt-3 font-sans">
                Please read our values and Code of Conduct, then check the acknowledgment above to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
