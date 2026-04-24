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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-slate-900/80 border-indigo-500/30 text-white">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold">Your Audit is Being Generated!</h2>
            <p className="text-slate-300 leading-relaxed">
              Our AI is analyzing {websiteUrl || businessName} right now. You'll receive a detailed
              report at <span className="text-indigo-300 font-medium">{email}</span> within the next few minutes.
            </p>
            <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm font-medium text-slate-200">Your report will include:</p>
              <ul className="text-sm text-slate-400 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Performance & speed analysis</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Mobile responsiveness score</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> SEO & discoverability review</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Security assessment</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Actionable improvement recommendations</li>
              </ul>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 mt-4">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800/50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-xl font-bold text-white cursor-pointer">MiniMorph</span>
          </Link>
          <Link href="/get-started">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
                <Zap className="w-3.5 h-3.5" />
                100% Free — No Credit Card Required
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Is Your Website <span className="text-indigo-400">Costing You</span> Customers?
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Get a comprehensive AI-powered audit of your website in minutes. We'll analyze your
                speed, mobile experience, SEO, security, and more — then show you exactly what to fix.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4 text-indigo-400" /> Results in 5 minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Detailed scoring
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Shield className="w-4 h-4 text-indigo-400" /> Security check included
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Smartphone className="w-4 h-4 text-indigo-400" /> Mobile analysis
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl shadow-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {step === "form" ? "Get Your Free Website Audit" : "Almost There!"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {step === "form"
                    ? "Enter your website URL and we'll generate a detailed report."
                    : "Just a few more details so we can personalize your report."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === "form" ? (
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type="text"
                          placeholder="www.yourbusiness.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <p className="text-xs text-slate-500">Don't have a website? Enter your business name instead.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Business Name</label>
                      <Input
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Your Name</label>
                      <Input
                        type="text"
                        placeholder="John Smith"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Phone Number (optional)</label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("form")}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-11"
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
      <section className="py-16 border-t border-slate-800/50">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What's In Your <span className="text-indigo-400">Free Report</span>
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
              <Card key={item.title} className="bg-slate-900/50 border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container max-w-4xl text-center space-y-8">
          <h2 className="text-2xl font-bold text-white">
            What Your <span className="text-indigo-400">Free Audit</span> Includes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-indigo-400">PDF</p>
              <p className="text-sm text-slate-400">Detailed Report</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-indigo-400">AI</p>
              <p className="text-sm text-slate-400">Powered Analysis</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-indigo-400">Free</p>
              <p className="text-sm text-slate-400">No Strings Attached</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 border-t border-slate-800/50">
        <div className="container max-w-2xl text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Ready to See How Your Website Scores?</h2>
          <p className="text-slate-400">It takes less than 30 seconds. No credit card, no commitment.</p>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Get My Free Audit <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
