import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle, ArrowLeft, DollarSign, Users, TrendingUp, Zap } from "lucide-react";

export default function BecomeRep() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
  });

  const submitApp = trpc.reps.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Application submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    submitApp.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-sage/20 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-forest" />
            </div>
            <h2 className="text-2xl font-serif text-forest mb-3">Application Received</h2>
            <p className="text-forest/60 font-sans mb-6 leading-relaxed">
              Thank you for your interest in becoming a MiniMorph rep. We'll review your application and get back to you within 48 hours.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-forest text-white hover:bg-forest/90 rounded-full px-8"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-forest text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to MiniMorph
          </button>
          <h1 className="text-3xl sm:text-4xl font-serif mb-4">Become a MiniMorph Rep</h1>
          <p className="text-lg text-white/80 font-sans max-w-2xl mx-auto">
            Join our network of sales professionals. Earn commissions by connecting local businesses with AI-powered websites.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Competitive Commissions", desc: "Earn on every sale" },
            { icon: Users, label: "Warm Leads", desc: "AI-sourced prospects" },
            { icon: TrendingUp, label: "Recurring Revenue", desc: "Renewal commissions" },
            { icon: Zap, label: "AI Support", desc: "We handle delivery" },
          ].map((b, i) => (
            <Card key={i} className="border-sage/20 bg-white shadow-sm">
              <CardContent className="pt-5 pb-5 text-center">
                <b.icon className="w-6 h-6 text-terracotta mx-auto mb-2" />
                <p className="text-sm font-medium text-forest">{b.label}</p>
                <p className="text-xs text-forest/50 mt-1">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">
        <Card className="border-sage/20 shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-forest text-xl">Apply Now</CardTitle>
            <CardDescription className="text-forest/60">
              Fill out the form below and we'll be in touch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-forest/80 text-sm">Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Your full name"
                  className="mt-1 border-sage/30 focus:border-forest"
                />
              </div>
              <div>
                <Label className="text-forest/80 text-sm">Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="mt-1 border-sage/30 focus:border-forest"
                />
              </div>
              <div>
                <Label className="text-forest/80 text-sm">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1 border-sage/30 focus:border-forest"
                />
              </div>
              <div>
                <Label className="text-forest/80 text-sm">Sales Experience</Label>
                <Input
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="Brief description of your sales background"
                  className="mt-1 border-sage/30 focus:border-forest"
                />
              </div>
              <Button
                type="submit"
                disabled={submitApp.isPending}
                className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-5 font-sans"
              >
                {submitApp.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
