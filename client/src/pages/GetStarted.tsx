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
  ArrowLeft, ArrowRight, Check, Sparkles,
  Shield, ChevronLeft, Eye, EyeOff, Lock, AlertTriangle, FileText,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const STEPS = [
  { id: 1, title: "Your Business", description: "Tell us about you" },
  { id: 2, title: "Choose a Plan", description: "Pick your package" },
  { id: 3, title: "Style Preferences", description: "Your design vision" },
  { id: 4, title: "Review & Pay", description: "Confirm and checkout" },
];

const PACKAGE_DEFAULTS = [
  {
    tier: "starter" as const,
    name: "Starter",
    defaultPrice: 195,
    pages: 5,
    features: ["Up to 5 pages", "Mobile-responsive design", "Contact/quote form", "Basic SEO setup", "Customer portal access", "Monthly performance report", "1 content update per month", "Email support"],
    popular: false,
  },
  {
    tier: "growth" as const,
    name: "Growth",
    defaultPrice: 295,
    pages: 10,
    features: ["Up to 10 pages", "Everything in Starter", "Blog or news section", "Google Analytics setup", "2 content updates per month", "AI-assisted recommendations", "Priority email support", "Add-on integrations available"],
    popular: true,
  },
  {
    tier: "premium" as const,
    name: "Pro",
    defaultPrice: 395,
    pages: 20,
    features: ["Up to 20 pages", "Everything in Growth", "Advanced SEO pages", "4 content updates per month", "Review widget setup", "Booking integration", "SMS lead alerts", "Priority support with faster response"],
    popular: false,
  },
  {
    tier: "enterprise" as const,
    name: "Enterprise",
    defaultPrice: 495,
    pages: 999,
    features: ["Everything in Pro", "Large ecommerce (unlimited products)", "Custom portals", "Membership/subscription systems", "Multi-location support", "Custom integrations", "Priority build queue"],
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
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractAgreed, setContractAgreed] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    password: "",
    confirmPassword: "",
    industry: "",
    website: "",
    selectedPackage: "",
    stylePreference: "",
    colorPreference: "",
    inspirationSites: "",
    additionalNotes: "",
  });

  const registerMutation = trpc.localAuth.register.useMutation();
  const loginMutation = trpc.localAuth.login.useMutation();
  const checkoutMutation = trpc.orders.createCheckout.useMutation();
  const submitContactMutation = trpc.contact.submit.useMutation();

  const { data: catalogItems = [] } = trpc.products.list.useQuery();
  const PACKAGES = useMemo(() => {
    const catalog = catalogItems as any[];
    return PACKAGE_DEFAULTS.map(pkg => {
      const dbItem = catalog.find((p: any) => p.productKey === pkg.tier && p.category === "package");
      const basePrice = dbItem ? parseFloat(dbItem.basePrice) : pkg.defaultPrice;
      const discount = dbItem?.discountPercent ?? 0;
      const price = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
      return { ...pkg, price, basePrice, discount };
    });
  }, [catalogItems]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const passwordLongEnough = formData.password.length >= 8;

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        if (isAuthenticated) {
          return formData.businessName && formData.contactName && formData.email;
        }
        return formData.businessName && formData.contactName && formData.email && passwordLongEnough && passwordsMatch;
      case 2: return !!formData.selectedPackage;
      case 3: return !!formData.stylePreference;
      case 4: return contractAgreed;
      default: return false;
    }
  }, [step, formData, isAuthenticated, passwordLongEnough, passwordsMatch]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Create account if not logged in
      if (!isAuthenticated) {
        try {
          await registerMutation.mutateAsync({
            email: formData.email,
            password: formData.password,
            name: formData.contactName,
          });
        } catch (regError: any) {
          // If email already exists, try logging in
          if (regError.message?.includes("already registered")) {
            try {
              await loginMutation.mutateAsync({
                email: formData.email,
                password: formData.password,
              });
            } catch {
              toast.error("This email is already registered. Please use the correct password or log in first.");
              setIsSubmitting(false);
              return;
            }
          } else {
            toast.error(regError.message || "Failed to create account");
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Step 2: Submit contact/order details for the rep to follow up
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

      ].filter(Boolean).join("\n");

      await submitContactMutation.mutateAsync({
        name: formData.contactName,
        email: formData.email,
        businessName: formData.businessName,
        message,
      });

      // Step 3: Create Stripe checkout session
      const tier = formData.selectedPackage as "starter" | "growth" | "premium" | "enterprise";
      const result = await checkoutMutation.mutateAsync({
        packageTier: tier,
        businessName: formData.businessName,
      });

      if (result.clientSecret) {
        toast.success("Proceeding to secure checkout...");
        setLocation(`/checkout?cs=${encodeURIComponent(result.clientSecret)}&return=/get-started`);
      } else if (result.checkoutUrl) {
        // Fallback for hosted checkout (e.g. email payment links)
        toast.success("Redirecting to secure checkout...");
        // On mobile: redirect in same window (new tabs unreliable on phones)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobile) {
          window.location.href = result.checkoutUrl;
        } else {
          window.open(result.checkoutUrl, "_blank");
          setStep(5);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (step === 5) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-serif text-off-white mb-3">Almost There!</h1>
          <p className="text-base text-soft-gray font-sans mb-2">
            Your account has been created and your order for the <strong className="text-off-white">{PACKAGES.find((p) => p.tier === formData.selectedPackage)?.name}</strong> package has been submitted.
          </p>
          <p className="text-sm text-soft-gray font-sans mb-4">
            Click below to complete your payment securely.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={async () => {
                try {
                  const tier = formData.selectedPackage as "starter" | "growth" | "premium" | "enterprise";
                  const result = await checkoutMutation.mutateAsync({
                    packageTier: tier,
                    businessName: formData.businessName,
                  });
                  if (result.clientSecret) {
                    setLocation(`/checkout?cs=${encodeURIComponent(result.clientSecret)}&return=/get-started`);
                  } else if (result.checkoutUrl) {
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
                    if (isMobile) {
                      window.location.href = result.checkoutUrl;
                    } else {
                      window.open(result.checkoutUrl, "_blank");
                    }
                  }
                } catch {
                  toast.error("Failed to create checkout session");
                }
              }}
              className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
            >
              <Lock className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/portal")}
              className="font-sans text-sm rounded-full border-border/50 min-h-[44px]"
            >
              Go to My Dashboard
            </Button>
            <button
              onClick={() => setLocation("/")}
              className="text-xs text-soft-gray/60 hover:text-soft-gray font-sans mt-2"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <div className="border-b border-border/30 bg-charcoal/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm text-soft-gray hover:text-off-white font-sans transition-colors">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">MiniMorph Studios</span>
          </button>
          {/* Mobile: compact step indicator */}
          <span className="sm:hidden text-xs font-sans text-off-white/70">{step}/{STEPS.length}</span>
          {/* Desktop: full step dots */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans transition-all ${
                  step > s.id ? "bg-green-500 text-white" : step === s.id ? "bg-charcoal text-off-white" : "bg-electric/10 text-soft-gray/60"
                }`}>
                  {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                {s.id < STEPS.length && <div className={`w-6 h-0.5 ${step > s.id ? "bg-green-500" : "bg-electric/10"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Step Header */}
        <div className="mb-8">
          <p className="text-xs text-electric font-sans uppercase tracking-wider mb-2">Step {step} of {STEPS.length}</p>
          <h1 className="text-2xl font-serif text-off-white mb-1">{STEPS[step - 1].title}</h1>
          <p className="text-sm text-soft-gray font-sans">{STEPS[step - 1].description}</p>
        </div>

        {/* STEP 1: Business Info + Account */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Business Name *</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="Acme Corp"
                  className="font-sans border-border/50 focus:border-electric"
                />
              </div>
              <div>
                <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Your Name *</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  placeholder="Jane Smith"
                  className="font-sans border-border/50 focus:border-electric"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="jane@acme.com"
                  className="font-sans border-border/50 focus:border-electric"
                />
              </div>

            </div>

            {/* Password fields - only show if not already logged in */}
            {!isAuthenticated && (
              <>
                <div className="border-t border-border/20 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="h-4 w-4 text-soft-gray" />
                    <p className="text-sm font-sans text-soft-gray font-medium">Create your account</p>
                  </div>
                  <p className="text-xs text-soft-gray font-sans mb-4">
                    You'll use this to track your project progress and communicate with your team.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Password *</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          placeholder="Min. 8 characters"
                          className="font-sans border-border/50 focus:border-electric pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray/60 hover:text-soft-gray"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {formData.password && !passwordLongEnough && (
                        <p role="alert" className="text-xs text-red-500 mt-1 font-sans">Must be at least 8 characters</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Confirm Password *</Label>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        placeholder="Confirm your password"
                        className="font-sans border-border/50 focus:border-electric"
                      />
                      {formData.confirmPassword && !passwordsMatch && (
                        <p role="alert" className="text-xs text-red-500 mt-1 font-sans">Passwords don't match</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-soft-gray/60 font-sans">
                  Already have an account?{" "}
                  <button onClick={() => setLocation("/login")} className="text-electric hover:underline">
                    Log in here
                  </button>
                </p>
              </>
            )}

            {isAuthenticated && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-sans">
                  Logged in as <strong>{user?.name || user?.email}</strong>. Your order will be linked to this account.
                </p>
              </div>
            )}

            <div>
              <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Industry</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => updateField("industry", ind)}
                    className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${
                      formData.industry === ind
                        ? "bg-charcoal text-off-white"
                        : "bg-electric/10 text-soft-gray hover:bg-electric/10"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Current Website (if any)</Label>
              <Input
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://www.example.com"
                className="font-sans border-border/50 focus:border-electric"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Package Selection */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Ecommerce Guardrail */}
            {formData.industry === "Retail / E-commerce" && (
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-500/10 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Ecommerce websites require a custom Commerce package</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Online stores with product catalogs, shopping carts, and checkout need specialized infrastructure.
                    Select any plan below to get started, and our team will contact you with a custom Commerce quote tailored to your product count and needs.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.tier}
                onClick={() => updateField("selectedPackage", pkg.tier)}
                className={`text-left p-5 rounded-2xl border-2 transition-all ${
                  formData.selectedPackage === pkg.tier
                    ? "border-electric bg-electric/10 shadow-md"
                    : "border-border/30 hover:border-electric/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-serif text-off-white">{pkg.name}</h3>
                  {pkg.popular && <Badge className="bg-electric/10 text-electric text-[10px] font-sans">Popular</Badge>}
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-serif text-off-white">${pkg.price}</span>
                  <span className="text-sm text-soft-gray font-sans">/mo</span>
                </div>
                <p className="text-[10px] text-soft-gray/50 font-sans mb-0.5">${pkg.price * 12} total over 12 months</p>
                <p className="text-[10px] text-soft-gray/40 font-sans mb-4">12-month contract, billed monthly</p>
                <ul className="space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-soft-gray font-sans">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {formData.selectedPackage === pkg.tier && (
                  <div className="mt-4 flex items-center gap-1 text-xs text-off-white font-sans font-medium">
                    <Check className="h-3.5 w-3.5" />
                    Selected
                  </div>
                )}
              </button>
            ))}
            </div>
          </div>
        )}

        {/* STEP 3: Style Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-sans text-soft-gray mb-3 block">Choose a design style</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateField("stylePreference", style.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      formData.stylePreference === style.id
                        ? "border-electric bg-electric/10"
                        : "border-border/30 hover:border-electric/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{style.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-off-white font-sans">{style.label}</p>
                        <p className="text-xs text-soft-gray font-sans">{style.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Color preferences (optional)</Label>
              <Input
                value={formData.colorPreference}
                onChange={(e) => updateField("colorPreference", e.target.value)}
                placeholder="e.g., Navy blue and gold, earth tones, bright and vibrant"
                className="font-sans border-border/50 focus:border-electric"
              />
            </div>
            <div>
              <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Inspiration websites (optional)</Label>
              <Textarea
                value={formData.inspirationSites}
                onChange={(e) => updateField("inspirationSites", e.target.value)}
                placeholder="Share links to websites you admire or want yours to feel like..."
                rows={3}
                className="font-sans border-border/50 focus:border-electric resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-sans text-soft-gray mb-1.5 block">Additional notes</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => updateField("additionalNotes", e.target.value)}
                placeholder="Anything else we should know about your vision..."
                rows={3}
                className="font-sans border-border/50 focus:border-electric resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Pay */}
        {step === 4 && (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-5">
                {/* Business */}
                <div>
                  <p className="text-xs text-soft-gray/60 font-sans uppercase tracking-wider mb-2">Business Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                    <div><span className="text-soft-gray">Business:</span> <span className="text-off-white font-medium">{formData.businessName}</span></div>
                    <div><span className="text-soft-gray">Contact:</span> <span className="text-off-white font-medium">{formData.contactName}</span></div>
                    <div><span className="text-soft-gray">Email:</span> <span className="text-off-white font-medium">{formData.email}</span></div>
                    {formData.industry && <div><span className="text-soft-gray">Industry:</span> <span className="text-off-white font-medium">{formData.industry}</span></div>}
                  </div>
                </div>

                <hr className="border-border/20" />

                {/* Package */}
                <div>
                  <p className="text-xs text-soft-gray/60 font-sans uppercase tracking-wider mb-2">Selected Package</p>
                  {(() => {
                    const pkg = PACKAGES.find((p) => p.tier === formData.selectedPackage);
                    return pkg ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-serif text-off-white">{pkg.name}</p>
                          <p className="text-xs text-soft-gray font-sans">{pkg.pages} pages • 12-month contract</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-serif text-off-white">${pkg.price}<span className="text-sm text-soft-gray">/mo</span></p>
                          <p className="text-[10px] text-soft-gray/40 font-sans">${pkg.price * 12}/yr total</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <hr className="border-border/20" />

                {/* Style */}
                <div>
                  <p className="text-xs text-soft-gray/60 font-sans uppercase tracking-wider mb-2">Design Preferences</p>
                  <div className="text-sm font-sans space-y-1">
                    <div><span className="text-soft-gray">Style:</span> <span className="text-off-white font-medium">{STYLES.find((s) => s.id === formData.stylePreference)?.label}</span></div>
                    {formData.colorPreference && <div><span className="text-soft-gray">Colors:</span> <span className="text-off-white font-medium">{formData.colorPreference}</span></div>}
                    {formData.inspirationSites && <div><span className="text-soft-gray">Inspiration:</span> <span className="text-off-white font-medium">{formData.inspirationSites}</span></div>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Agreement */}
            {(() => {
              const pkg = PACKAGES.find((p) => p.tier === formData.selectedPackage);
              if (!pkg) return null;
              const endDate = new Date();
              endDate.setFullYear(endDate.getFullYear() + 1);
              return (
                <div className="border border-border/40 rounded-xl overflow-hidden">
                  <div className="bg-charcoal/60 px-4 py-3 flex items-center gap-2 border-b border-border/30">
                    <FileText className="h-4 w-4 text-soft-gray/60" />
                    <p className="text-sm font-medium text-off-white font-sans">12-Month Service Agreement</p>
                  </div>
                  <div className="p-4 max-h-48 overflow-y-auto bg-midnight/40">
                    <pre className="text-xs text-soft-gray font-sans whitespace-pre-wrap leading-relaxed">
{`WEBSITE DESIGN & SERVICES AGREEMENT — MiniMorph Studios

Package: ${pkg.name} — $${pkg.price}/mo
Term: 12 months, billed monthly
Total commitment: $${pkg.price * 12}

WHAT'S INCLUDED
✓ Professional website design & development
✓ Mobile-responsive design
✓ SSL certificate (included, auto-renewed)
✓ Enterprise hosting & CDN (99.9% uptime)
✓ DNS management & domain handling
✓ Daily backups & security monitoring
✓ Up to 3 revision rounds
✓ Ongoing maintenance & updates
✓ SEO optimization
✓ Monthly performance reports
✓ Customer support

KEY TERMS
• 12-month minimum commitment from start date
• First payment due upon checkout completion
• After 12 months: cancel with 30 days written notice
• Early termination requires payment of remaining months
• Additional revisions beyond 3 rounds: $149/round
• Governing law: Michigan, United States

Domain: ${pkg.tier === "starter" ? "$15/year" : "Free first year, then $15/yr"} (registered & managed by MiniMorph Studios)`}
                    </pre>
                  </div>
                  <div className="px-4 py-3 border-t border-border/30 flex items-start gap-3">
                    <Checkbox
                      id="contractAgreed"
                      checked={contractAgreed}
                      onCheckedChange={(v) => setContractAgreed(!!v)}
                      className="mt-0.5"
                    />
                    <label htmlFor="contractAgreed" className="text-xs text-soft-gray font-sans cursor-pointer leading-relaxed">
                      I have read and agree to the 12-month service agreement above. I understand this is a monthly subscription with a 12-month minimum commitment at <strong className="text-off-white">${pkg.price}/mo</strong>.
                    </label>
                  </div>
                </div>
              );
            })()}

            <div className="bg-electric/5 rounded-xl p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-soft-gray/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-off-white font-sans">Secure Checkout</p>
                <p className="text-xs text-soft-gray font-sans mt-1">
                  After clicking "Proceed to Payment", you'll be redirected to Stripe's secure checkout page. Your payment information is never stored on our servers.
                </p>
              </div>
            </div>

            <div className="bg-violet/5 rounded-xl p-4 flex items-start gap-3 border border-violet/15">
              <Sparkles className="h-5 w-5 text-violet/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-off-white font-sans">What happens after payment?</p>
                <p className="text-xs text-soft-gray font-sans mt-1">
                  You'll receive a portal login email within minutes. Log in and meet Elena — our AI onboarding agent will walk you through everything we need to build your site. First draft arrives in 48–72 hours after your Elena session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 sm:mt-10 pt-4 sm:pt-6 border-t border-border/20 gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="font-sans text-sm rounded-full border-border/50 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="bg-electric hover:bg-electric-light text-white font-sans text-sm rounded-full px-6 min-h-[44px]"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !contractAgreed}
              className="bg-electric hover:bg-electric-light text-midnight font-sans text-sm rounded-full px-8 min-h-[44px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          )}
        </div>

        {/* Login link at bottom */}
        {step === 1 && !isAuthenticated && (
          <p className="text-center text-xs text-soft-gray/60 font-sans mt-6">
            Already a customer?{" "}
            <button onClick={() => setLocation("/login")} className="text-electric hover:underline">
              Log in to your account
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
