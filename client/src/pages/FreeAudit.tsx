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
  const [submitted, setSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [step, setStep] = useState<"form" | "details">("form");

  const requestAudit = trpc.leadGen.requestPublicAudit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setResponseMessage(data.message);
      toast.success(data.message);
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
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-card border-border text-card-foreground">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {responseMessage.includes("on the way") ? "Your Audit is Being Generated!" : "Request Received!"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {responseMessage.includes("on the way") ? (
                <>Our AI is analyzing {websiteUrl || businessName} right now. You'll receive a detailed report at <span className="text-primary font-medium">{email}</span> within the next few minutes.</>
              ) : (
                <>We received your request for <strong>{businessName || "your business"}</strong>. A team member will review it and reach out to <span className="text-primary font-medium">{email}</span> within 1 business day.</>
              )}
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 border border-border">
              <p className="text-sm font-medium text-foreground">Your report will include:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary" /> Performance & speed analysis</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary" /> Mobile responsiveness score</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary" /> SEO & discoverability review</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary" /> Security assessment</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-primary" /> Actionable improvement recommendations</li>
              </ul>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-border text-foreground hover:bg-muted mt-4">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-xl font-bold text-foreground cursor-pointer" style={{ fontFamily: "'DM Serif Display', serif" }}>
              MiniMorph Studios
            </span>
          </Link>
          <Link href="/get-started">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="container max-w-6xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                <Zap className="w-3.5 h-3.5" />
                100% Free — No Credit Card Required
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Is Your Website{" "}
                <span className="text-primary">Costing You</span>{" "}
                Customers?
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Get a comprehensive AI-powered audit of your website in minutes. We'll analyze your
                speed, mobile experience, SEO, security, and more — then show you exactly what to fix.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { icon: Clock, text: "Results in 5 minutes" },
                  { icon: BarChart3, text: "Detailed scoring" },
                  { icon: Shield, text: "Security check included" },
                  { icon: Smartphone, text: "Mobile analysis" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4 text-primary" /> {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-foreground text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {step === "form" ? "Get Your Free Website Audit" : "Almost There!"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {step === "form"
                    ? "Enter your website URL and we'll generate a detailed report."
                    : "Just a few more details so we can personalize your report."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === "form" ? (
                  <form onSubmit={handleStep1} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Website URL</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="www.yourbusiness.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Don't have a website? Enter your business name instead.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Business Name</label>
                      <Input
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Email Address *</label>
                      <Input
                        type="email"
                        placeholder="you@business.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">Your Name</label>
                      <Input
                        type="text"
                        placeholder="John Smith"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("form")}
                        className="border-border text-foreground hover:bg-muted"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11"
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
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12" style={{ fontFamily: "'DM Serif Display', serif" }}>
            What's In Your <span className="text-primary">Free Report</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Performance Score",
                desc: "How fast your site loads and where the bottlenecks are. Slow sites lose visitors before they even see your content.",
              },
              {
                icon: Smartphone,
                title: "Mobile Experience",
                desc: "How your site looks and works on phones. Most of your visitors are on mobile — is your site ready?",
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
                desc: "How you stack up against similar businesses in your space. Know where you stand.",
              },
              {
                icon: AlertTriangle,
                title: "Priority Fix List",
                desc: "Ranked list of what to fix first for the biggest impact on your business.",
              },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border hover:border-primary/30 transition-colors backdrop-blur-sm">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-4xl text-center space-y-8">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            What Your <span className="text-primary">Free Audit</span> Includes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary" style={{ fontFamily: "'DM Serif Display', serif" }}>PDF</p>
              <p className="text-sm text-muted-foreground">Detailed Report</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary" style={{ fontFamily: "'DM Serif Display', serif" }}>AI</p>
              <p className="text-sm text-muted-foreground">Powered Analysis</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary" style={{ fontFamily: "'DM Serif Display', serif" }}>Free</p>
              <p className="text-sm text-muted-foreground">No Strings Attached</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-2xl text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Ready to See How Your Website Scores?
          </h2>
          <p className="text-muted-foreground">It takes less than 30 seconds. No credit card, no commitment.</p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Get My Free Audit <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
