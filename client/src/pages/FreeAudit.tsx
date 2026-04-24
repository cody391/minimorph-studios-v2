import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Globe, Zap, Shield, Smartphone, Search, ArrowRight, BarChart3, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function FreeAudit() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "details">("form");

  const requestAudit = trpc.leadGen.requestPublicAudit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Your free website audit is being generated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl && !businessName) {
      toast.error("Please enter your website URL or business name");
      return;
    }
    if (!email) {
      toast.error("Please enter your email so we can send the report");
      return;
    }
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestAudit.mutate({
      websiteUrl: websiteUrl || undefined,
      email,
      businessName: businessName || undefined,
      contactName: contactName || undefined,
      phone: phone || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-cream border-forest-light/20 text-forest">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-terracotta" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-forest">Your Audit is Being Generated!</h2>
            <p className="text-forest/70 leading-relaxed font-sans">
              Our AI is analyzing {websiteUrl || businessName} right now. You'll receive a detailed
              report at <span className="text-terracotta font-medium">{email}</span> within the next few minutes.
            </p>
            <div className="bg-forest/5 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-medium text-forest font-sans">Your report will include:</p>
              <ul className="text-sm text-forest/60 space-y-1 font-sans">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terracotta" /> Performance & speed analysis</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terracotta" /> Mobile responsiveness score</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terracotta" /> SEO & discoverability review</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terracotta" /> Security assessment</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-terracotta" /> Actionable improvement recommendations</li>
              </ul>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-forest/30 text-forest hover:bg-forest/5 mt-4">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest">
      {/* Header */}
      <header className="border-b border-cream/10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-xl font-serif font-bold text-cream cursor-pointer">MiniMorph Studios</span>
          </Link>
          <Link href="/get-started">
            <Button size="sm" className="bg-terracotta hover:bg-terracotta-light text-cream">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm font-sans">
                <Zap className="w-3.5 h-3.5" />
                100% Free — No Credit Card Required
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-cream leading-tight">
                Is Your Website <span className="text-terracotta">Costing You</span> Customers?
              </h1>
              <p className="text-lg text-cream/70 leading-relaxed font-sans">
                Get a comprehensive AI-powered audit of your website in minutes. We'll analyze your
                speed, mobile experience, SEO, security, and more — then show you exactly what to fix.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-cream/60 font-sans">
                  <Clock className="w-4 h-4 text-terracotta" /> Results in 5 minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/60 font-sans">
                  <BarChart3 className="w-4 h-4 text-terracotta" /> Detailed scoring
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/60 font-sans">
                  <Shield className="w-4 h-4 text-terracotta" /> Security check included
                </div>
                <div className="flex items-center gap-2 text-sm text-cream/60 font-sans">
                  <Smartphone className="w-4 h-4 text-terracotta" /> Mobile analysis
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <Card className="bg-cream border-cream-dark shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-forest text-xl font-serif">
                  {step === "form" ? "Get Your Free Website Audit" : "Almost There!"}
                </CardTitle>
                <CardDescription className="text-forest/50 font-sans">
                  {step === "form"
                    ? "Enter your website URL and we'll generate a detailed report."
                    : "Just a few more details so we can personalize your report."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === "form" ? (
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-forest/80 font-sans">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest/40" />
                        <Input
                          type="text"
                          placeholder="www.yourbusiness.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="pl-10 bg-white border-forest/20 text-forest placeholder:text-forest/30"
                        />
                      </div>
                      <p className="text-xs text-forest/40 font-sans">Don't have a website? Enter your business name instead.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-forest/80 font-sans">Business Name</label>
                      <Input
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-white border-forest/20 text-forest placeholder:text-forest/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-forest/80 font-sans">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white border-forest/20 text-forest placeholder:text-forest/30"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-terracotta hover:bg-terracotta-light text-cream h-11 font-sans"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-forest/80 font-sans">Your Name</label>
                      <Input
                        type="text"
                        placeholder="John Smith"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="bg-white border-forest/20 text-forest placeholder:text-forest/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-forest/80 font-sans">Phone Number (optional)</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-white border-forest/20 text-forest placeholder:text-forest/30"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("form")}
                        className="border-forest/20 text-forest hover:bg-forest/5"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-terracotta hover:bg-terracotta-light text-cream h-11 font-sans"
                        disabled={requestAudit.isPending}
                      >
                        {requestAudit.isPending ? (
                          <span className="flex items-center gap-2">
                            <Search className="w-4 h-4 animate-spin" /> Analyzing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Search className="w-4 h-4" /> Get My Free Audit
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="py-16 border-t border-cream/10">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-serif font-bold text-cream text-center mb-12">
            What's In Your <span className="text-terracotta">Free Report</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Performance Score",
                desc: "How fast your site loads and where the bottlenecks are. Slow sites lose 53% of visitors.",
              },
              {
                icon: Smartphone,
                title: "Mobile Experience",
                desc: "How your site looks and works on phones. 60% of searches are mobile — is your site ready?",
              },
              {
                icon: Search,
                title: "SEO Analysis",
                desc: "Can customers find you on Google? We check meta tags, structure, and discoverability.",
              },
              {
                icon: Shield,
                title: "Security Check",
                desc: "SSL, vulnerabilities, and trust signals. Customers won't buy from sites they don't trust.",
              },
              {
                icon: BarChart3,
                title: "Competitor Comparison",
                desc: "How you stack up against similar businesses in your area. Know where you stand.",
              },
              {
                icon: AlertTriangle,
                title: "Priority Fix List",
                desc: "Ranked list of what to fix first for the biggest impact on your business.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-cream/5 border-cream/10 hover:border-terracotta/30 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-terracotta" />
                  </div>
                  <h3 className="font-semibold text-cream font-sans">{item.title}</h3>
                  <p className="text-sm text-cream/50 leading-relaxed font-sans">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 border-t border-cream/10">
        <div className="container max-w-4xl text-center space-y-8">
          <h2 className="text-2xl font-serif font-bold text-cream">
            What Your <span className="text-terracotta">Free Audit</span> Includes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-terracotta font-serif">PDF</p>
              <p className="text-sm text-cream/50 font-sans">Detailed Report</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-terracotta font-serif">AI</p>
              <p className="text-sm text-cream/50 font-sans">Powered Analysis</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-terracotta font-serif">Free</p>
              <p className="text-sm text-cream/50 font-sans">No Strings Attached</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 border-t border-cream/10">
        <div className="container max-w-2xl text-center space-y-6">
          <h2 className="text-2xl font-serif font-bold text-cream">Ready to See How Your Website Scores?</h2>
          <p className="text-cream/50 font-sans">It takes less than 30 seconds. No credit card, no commitment.</p>
          <Button
            size="lg"
            className="bg-terracotta hover:bg-terracotta-light text-cream font-sans"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Get My Free Audit <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
