import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Palette,
  Globe, Zap, Shield, Star, ChevronLeft,
} from "lucide-react";
import { useLocation } from "wouter";

const STEPS = [
  { id: 1, title: "Your Business", description: "Tell us about you" },
  { id: 2, title: "Choose a Plan", description: "Pick your package" },
  { id: 3, title: "Style Preferences", description: "Your design vision" },
  { id: 4, title: "Review & Submit", description: "Confirm your order" },
];

const PACKAGES = [
  {
    tier: "starter",
    name: "Starter",
    price: 149,
    pages: 5,
    features: ["5-page responsive website", "Mobile-optimized design", "Contact form", "Basic SEO setup", "Monthly performance report", "12-month support"],
    popular: false,
  },
  {
    tier: "growth",
    name: "Growth",
    price: 299,
    pages: 10,
    features: ["10-page responsive website", "Advanced animations", "Blog/news section", "Google Analytics integration", "Social media integration", "Priority support", "Monthly strategy reports"],
    popular: true,
  },
  {
    tier: "premium",
    name: "Premium",
    price: 499,
    pages: 20,
    features: ["20-page responsive website", "E-commerce ready", "Custom illustrations", "Advanced SEO & content strategy", "CRM integration", "Dedicated account manager", "Weekly performance reports", "A/B testing"],
    popular: false,
  },
];

const STYLES = [
  { id: "modern", label: "Modern & Clean", desc: "Minimalist layouts, lots of whitespace, sans-serif fonts", icon: "✦" },
  { id: "bold", label: "Bold & Dynamic", desc: "Strong colors, large typography, eye-catching animations", icon: "◆" },
  { id: "elegant", label: "Elegant & Refined", desc: "Serif fonts, muted tones, sophisticated feel", icon: "❖" },
  { id: "playful", label: "Playful & Friendly", desc: "Rounded shapes, bright colors, approachable vibe", icon: "●" },
  { id: "corporate", label: "Corporate & Professional", desc: "Structured, trustworthy, traditional business feel", icon: "■" },
  { id: "creative", label: "Creative & Artistic", desc: "Unique layouts, experimental typography, standout design", icon: "◇" },
];

const INDUSTRIES = [
  "Restaurant / Food", "Fitness / Wellness", "Real Estate", "Law / Legal",
  "Healthcare / Dental", "Retail / E-commerce", "Professional Services",
  "Construction / Home", "Education", "Technology", "Other",
];

export default function GetStarted() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    website: "",
    selectedPackage: "",
    stylePreference: "",
    colorPreference: "",
    inspirationSites: "",
    additionalNotes: "",
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setStep(5); // success state
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return formData.businessName && formData.contactName && formData.email;
      case 2: return !!formData.selectedPackage;
      case 3: return !!formData.stylePreference;
      case 4: return true;
      default: return false;
    }
  }, [step, formData]);

  const handleSubmit = () => {
    const selectedPkg = PACKAGES.find((p) => p.tier === formData.selectedPackage);
    const selectedStyle = STYLES.find((s) => s.id === formData.stylePreference);
    const message = [
      `Package: ${selectedPkg?.name} ($${selectedPkg?.price}/mo)`,
      `Industry: ${formData.industry || "Not specified"}`,
      `Style: ${selectedStyle?.label || "Not specified"}`,
      formData.colorPreference ? `Color preference: ${formData.colorPreference}` : "",
      formData.inspirationSites ? `Inspiration: ${formData.inspirationSites}` : "",
      formData.additionalNotes ? `Notes: ${formData.additionalNotes}` : "",
      formData.website ? `Current website: ${formData.website}` : "",
      formData.phone ? `Phone: ${formData.phone}` : "",
    ].filter(Boolean).join("\n");

    submitMutation.mutate({
      name: formData.contactName,
      email: formData.email,
      businessName: formData.businessName,
      message,
    });
  };

  // Success state
  if (step === 5) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif text-forest mb-3">You're All Set!</h1>
          <p className="text-base text-forest/60 font-sans mb-2">
            Thank you, {formData.contactName}. We've received your order for the <strong className="text-forest">{PACKAGES.find((p) => p.tier === formData.selectedPackage)?.name}</strong> package.
          </p>
          <p className="text-sm text-forest/50 font-sans mb-8">
            A MiniMorph representative will reach out within 24 hours to kick off your project. Check your email at <strong>{formData.email}</strong> for next steps.
          </p>
          <Button onClick={() => setLocation("/")} className="bg-forest hover:bg-forest/90 text-white font-sans rounded-full px-8">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-border/30 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-forest/60 hover:text-forest font-sans transition-colors">
            <ChevronLeft className="h-4 w-4" />
            MiniMorph
          </button>
          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans transition-all ${
                  step > s.id ? "bg-green-500 text-white" : step === s.id ? "bg-forest text-white" : "bg-forest/10 text-forest/40"
                }`}>
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                {s.id < STEPS.length && <div className={`w-6 h-0.5 ${step > s.id ? "bg-green-500" : "bg-forest/10"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Step Header */}
        <div className="mb-8">
          <p className="text-xs text-terracotta font-sans uppercase tracking-wider mb-2">Step {step} of {STEPS.length}</p>
          <h1 className="text-2xl font-serif text-forest mb-1">{STEPS[step - 1].title}</h1>
          <p className="text-sm text-forest/50 font-sans">{STEPS[step - 1].description}</p>
        </div>

        {/* STEP 1: Business Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Business Name *</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="Acme Corp"
                  className="font-sans border-border/50 focus:border-forest"
                />
              </div>
              <div>
                <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Your Name *</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  placeholder="Jane Smith"
                  className="font-sans border-border/50 focus:border-forest"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="jane@acme.com"
                  className="font-sans border-border/50 focus:border-forest"
                />
              </div>
              <div>
                <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="font-sans border-border/50 focus:border-forest"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Industry</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => updateField("industry", ind)}
                    className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${
                      formData.industry === ind
                        ? "bg-forest text-white"
                        : "bg-forest/5 text-forest/60 hover:bg-forest/10"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Current Website (if any)</Label>
              <Input
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://www.example.com"
                className="font-sans border-border/50 focus:border-forest"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Package Selection */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.tier}
                onClick={() => updateField("selectedPackage", pkg.tier)}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${
                  formData.selectedPackage === pkg.tier
                    ? "border-forest bg-forest/5 shadow-md"
                    : "border-border/30 hover:border-forest/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-serif text-forest">{pkg.name}</h3>
                  {pkg.popular && <Badge className="bg-terracotta/10 text-terracotta text-[10px] font-sans">Popular</Badge>}
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-serif text-forest">${pkg.price}</span>
                  <span className="text-sm text-forest/50 font-sans">/mo</span>
                </div>
                <ul className="space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-forest/60 font-sans">
                      <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {formData.selectedPackage === pkg.tier && (
                  <div className="mt-4 flex items-center gap-1 text-xs text-forest font-sans font-medium">
                    <Check className="h-3.5 w-3.5" />
                    Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3: Style Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-3 block">Choose a design style</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateField("stylePreference", style.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      formData.stylePreference === style.id
                        ? "border-forest bg-forest/5"
                        : "border-border/30 hover:border-forest/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{style.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-forest font-sans">{style.label}</p>
                        <p className="text-xs text-forest/50 font-sans">{style.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Color preferences (optional)</Label>
              <Input
                value={formData.colorPreference}
                onChange={(e) => updateField("colorPreference", e.target.value)}
                placeholder="e.g., Navy blue and gold, earth tones, bright and vibrant"
                className="font-sans border-border/50 focus:border-forest"
              />
            </div>
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Inspiration websites (optional)</Label>
              <Textarea
                value={formData.inspirationSites}
                onChange={(e) => updateField("inspirationSites", e.target.value)}
                placeholder="Share links to websites you admire or want yours to feel like..."
                rows={3}
                className="font-sans border-border/50 focus:border-forest resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-sans text-forest/70 mb-1.5 block">Additional notes</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => updateField("additionalNotes", e.target.value)}
                placeholder="Anything else we should know about your vision..."
                rows={3}
                className="font-sans border-border/50 focus:border-forest resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-5">
                {/* Business */}
                <div>
                  <p className="text-xs text-forest/40 font-sans uppercase tracking-wider mb-2">Business Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                    <div><span className="text-forest/50">Business:</span> <span className="text-forest font-medium">{formData.businessName}</span></div>
                    <div><span className="text-forest/50">Contact:</span> <span className="text-forest font-medium">{formData.contactName}</span></div>
                    <div><span className="text-forest/50">Email:</span> <span className="text-forest font-medium">{formData.email}</span></div>
                    {formData.phone && <div><span className="text-forest/50">Phone:</span> <span className="text-forest font-medium">{formData.phone}</span></div>}
                    {formData.industry && <div><span className="text-forest/50">Industry:</span> <span className="text-forest font-medium">{formData.industry}</span></div>}
                  </div>
                </div>

                <hr className="border-border/20" />

                {/* Package */}
                <div>
                  <p className="text-xs text-forest/40 font-sans uppercase tracking-wider mb-2">Selected Package</p>
                  {(() => {
                    const pkg = PACKAGES.find((p) => p.tier === formData.selectedPackage);
                    return pkg ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-serif text-forest">{pkg.name}</p>
                          <p className="text-xs text-forest/50 font-sans">{pkg.pages} pages • 12-month contract</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-serif text-forest">${pkg.price}<span className="text-sm text-forest/50">/mo</span></p>
                          <p className="text-[10px] text-forest/40 font-sans">${pkg.price * 12}/year</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <hr className="border-border/20" />

                {/* Style */}
                <div>
                  <p className="text-xs text-forest/40 font-sans uppercase tracking-wider mb-2">Design Preferences</p>
                  <div className="text-sm font-sans space-y-1">
                    <div><span className="text-forest/50">Style:</span> <span className="text-forest font-medium">{STYLES.find((s) => s.id === formData.stylePreference)?.label}</span></div>
                    {formData.colorPreference && <div><span className="text-forest/50">Colors:</span> <span className="text-forest font-medium">{formData.colorPreference}</span></div>}
                    {formData.inspirationSites && <div><span className="text-forest/50">Inspiration:</span> <span className="text-forest font-medium">{formData.inspirationSites}</span></div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-sage/10 rounded-xl p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-forest/40 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-forest font-sans">What happens next?</p>
                <p className="text-xs text-forest/60 font-sans mt-1">
                  After submitting, a MiniMorph representative will contact you within 24 hours to finalize details and begin your project. No payment is required until you approve the initial design concepts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/20">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="font-sans text-sm rounded-full border-border/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="bg-forest hover:bg-forest/90 text-white font-sans text-sm rounded-full px-6"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm rounded-full px-8"
            >
              {submitMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit Order
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
