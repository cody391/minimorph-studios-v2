import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import {
  FileText,
  DollarSign,
  Users,
  CreditCard,
  Handshake,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Shield,
  Zap,
} from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";

type FormType = "w9_tax" | "hr_employment" | "payroll_setup" | "rep_agreement";

const FORM_CONFIG: Record<FormType, {
  title: string;
  icon: typeof FileText;
  description: string;
  color: string;
}> = {
  w9_tax: {
    title: "W-9 Tax Information",
    icon: DollarSign,
    description: "Federal tax classification and taxpayer identification",
    color: "text-emerald-400 bg-green-50",
  },
  hr_employment: {
    title: "HR / Employment Info",
    icon: Users,
    description: "Employment details, emergency contacts, and personal information",
    color: "text-blue-600 bg-blue-50",
  },
  payroll_setup: {
    title: "Payroll Setup",
    icon: CreditCard,
    description: "Payment method and banking information",
    color: "text-purple-600 bg-purple-50",
  },
  rep_agreement: {
    title: "Rep Agreement",
    icon: Handshake,
    description: "Independent contractor agreement and terms",
    color: "text-electric bg-electric/10",
  },
};

const FORM_ORDER: FormType[] = ["w9_tax", "hr_employment", "payroll_setup", "rep_agreement"];

function AutoFilledBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
      <Sparkles className="w-3 h-3" /> Auto-filled
    </span>
  );
}

function SmartField({
  label,
  value,
  source,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  sensitive = false,
}: {
  label: string;
  value: string;
  source: string | null;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  sensitive?: boolean;
}) {
  const isAutoFilled = !!source && !!value;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-off-white/80 text-sm">{label}</Label>
        {isAutoFilled && <AutoFilledBadge />}
      </div>
      <Input
        type={sensitive ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`border-border focus:border-electric ${
          isAutoFilled ? "bg-green-50/50 border-green-200" : ""
        }`}
      />
      {isAutoFilled && (
        <p className="text-[10px] text-emerald-400/70 mt-0.5">
          From your {source === "trust_verification" ? "trust verification" : "account signup"}
        </p>
      )}
    </div>
  );
}

export default function OnboardingPaperwork() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [completedForms, setCompletedForms] = useState<Set<FormType>>(new Set());
  const [formOverrides, setFormOverrides] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<{ type: "drawn" | "typed"; data: string; name?: string } | null>(null);

  const currentFormType = FORM_ORDER[currentFormIndex];
  const config = FORM_CONFIG[currentFormType];

  // Fetch auto-populated data for current form
  const { data: formData, isLoading: formLoading } =
    trpc.repOnboarding.getAutoPopulated.useQuery(
      { formType: currentFormType },
      { enabled: !!user }
    );

  // Count auto-filled fields
  const autoFilledCount = useMemo(() => {
    if (!formData) return { filled: 0, total: 0 };
    const fields = formData.autoPopulatedFields as unknown as Record<string, any>;
    const sources = formData.fieldsSource as unknown as Record<string, string | null>;
    let filled = 0;
    let total = 0;
    for (const key of Object.keys(fields)) {
      if (typeof fields[key] === "boolean") continue; // Skip boolean flags
      total++;
      if (fields[key] && sources[key]) filled++;
    }
    return { filled, total };
  }, [formData]);

  const completePaperwork = trpc.repOnboarding.completePaperwork.useMutation({
    onError: () => toast.error("Failed to save paperwork completion. Please try again."),
  });

  const handleConfirmForm = () => {
    const newCompleted = new Set(Array.from(completedForms).concat(currentFormType));
    setCompletedForms(newCompleted);
    toast.success(`${config.title} signed & confirmed!`);
    setSignature(null); // Reset signature for next form

    if (currentFormIndex < FORM_ORDER.length - 1) {
      setCurrentFormIndex((i) => i + 1);
    }

    // If this was the last form, mark paperwork as complete in the backend
    if (newCompleted.size === FORM_ORDER.length) {
      completePaperwork.mutate();
    }
  };

  const allComplete = completedForms.size === FORM_ORDER.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-electric mx-auto mb-4" />
            <h2 className="text-xl font-bold text-off-white mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access onboarding paperwork.</p>
            <Button onClick={() => navigate("/login")} className="bg-electric hover:bg-electric-light text-white">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-off-white mb-2 font-serif">
              All Paperwork Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              Every form has been verified and confirmed. Next step: set up your payout account so you can receive commissions.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {FORM_ORDER.map((ft) => {
                const c = FORM_CONFIG[ft];
                return (
                  <div key={ft} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-green-800">{c.title}</span>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={() => navigate("/become-rep/payout-setup")}
              className="bg-electric hover:bg-electric-light text-white w-full rounded-full py-5"
              size="lg"
            >
              Set Up Payout Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      <OnboardingProgress currentStep={6} />
      {/* Header */}
      <div className="bg-charcoal text-off-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <button
            onClick={() => navigate("/become-rep?step=2")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-3 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Application
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif mb-2">Onboarding Paperwork</h1>
          <p className="text-white/80 font-sans text-sm max-w-lg mx-auto">
            Because you already provided your information during trust verification,
            most of these forms are pre-filled. Just verify and confirm.
          </p>
        </div>
      </div>

      {/* Smart messaging */}
      <div className="max-w-2xl mx-auto px-4 mt-6 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 mb-1">
                Smart Auto-Fill Active
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                We already have your information from the trust verification step.
                Fields marked with <Sparkles className="w-3 h-3 inline text-emerald-400" /> are pre-filled.
                Just review, verify, and confirm each form.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form progress */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          {FORM_ORDER.map((ft, idx) => {
            const c = FORM_CONFIG[ft];
            const isComplete = completedForms.has(ft);
            const isCurrent = idx === currentFormIndex;

            return (
              <button
                key={ft}
                onClick={() => {
                  if (isComplete || idx <= currentFormIndex) setCurrentFormIndex(idx);
                }}
                className={`flex-1 p-2 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? "border-electric bg-charcoal shadow-md"
                    : isComplete
                      ? "border-green-200 bg-green-50"
                      : "border-border/50 bg-charcoal/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  {isComplete ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <c.icon className={`w-3.5 h-3.5 ${isCurrent ? "text-electric" : "text-soft-gray/60"}`} />
                  )}
                  <span className={`text-[10px] font-medium ${
                    isCurrent ? "text-off-white" : isComplete ? "text-green-700" : "text-soft-gray/60"
                  }`}>
                    {c.title.split(" ")[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <config.icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-serif text-off-white text-lg">{config.title}</CardTitle>
                  <CardDescription className="text-soft-gray text-xs">{config.description}</CardDescription>
                </div>
              </div>
              {autoFilledCount.filled > 0 && (
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs">
                  {autoFilledCount.filled}/{autoFilledCount.total} auto-filled
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {formLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-off-white" />
              </div>
            ) : formData ? (
              <div className="space-y-4">
                {/* Render form fields dynamically based on formType */}
                {currentFormType === "w9_tax" && (
                  <W9Form
                    data={formData.autoPopulatedFields as any}
                    sources={formData.fieldsSource as any}
                    overrides={formOverrides}
                    setOverrides={setFormOverrides}
                  />
                )}
                {currentFormType === "hr_employment" && (
                  <HRForm
                    data={formData.autoPopulatedFields as any}
                    sources={formData.fieldsSource as any}
                    overrides={formOverrides}
                    setOverrides={setFormOverrides}
                  />
                )}
                {currentFormType === "payroll_setup" && (
                  <PayrollForm
                    data={formData.autoPopulatedFields as any}
                    sources={formData.fieldsSource as any}
                    overrides={formOverrides}
                    setOverrides={setFormOverrides}
                  />
                )}
                {currentFormType === "rep_agreement" && (
                  <RepAgreementForm
                    data={formData.autoPopulatedFields as any}
                    sources={formData.fieldsSource as any}
                    overrides={formOverrides}
                    setOverrides={setFormOverrides}
                  />
                )}

                {/* E-Signature */}
                <div className="pt-4 border-t border-border/10">
                  <SignaturePad
                    onSignatureChange={setSignature}
                    signerName={formData?.autoPopulatedFields ? (formData.autoPopulatedFields as any).name || (formData.autoPopulatedFields as any).legalName || "" : ""}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleConfirmForm}
                    disabled={!signature}
                    className="w-full bg-electric hover:bg-electric/90 text-white rounded-full py-5 font-sans disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sign & Confirm {config.title}
                  </Button>
                  {!signature && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Please provide your signature above to confirm this form
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Unable to load form data. Please complete the trust verification step first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Form Components ─── */

function W9Form({
  data,
  sources,
  overrides,
  setOverrides,
}: {
  data: any;
  sources: any;
  overrides: Record<string, string>;
  setOverrides: (o: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <SmartField
        label="Name (as shown on your income tax return)"
        value={overrides["w9_name"] ?? data.name}
        source={sources.name}
        onChange={(v) => setOverrides({ ...overrides, w9_name: v })}
        placeholder="Legal full name"
      />
      <SmartField
        label="Business Name (if different from above)"
        value={overrides["w9_businessName"] ?? data.businessName}
        source={null}
        onChange={(v) => setOverrides({ ...overrides, w9_businessName: v })}
        placeholder="Leave blank if not applicable"
      />
      <div className="bg-electric/10 rounded-lg p-3">
        <Label className="text-off-white/80 text-sm font-medium">Federal Tax Classification</Label>
        <p className="text-sm text-off-white mt-1">Individual / Sole Proprietor (Independent Contractor)</p>
        <p className="text-[10px] text-soft-gray mt-0.5">
          MiniMorph reps are classified as independent contractors
        </p>
      </div>
      <SmartField
        label="Address"
        value={overrides["w9_address"] ?? data.address}
        source={sources.address}
        onChange={(v) => setOverrides({ ...overrides, w9_address: v })}
        placeholder="Street address"
      />
      <div className="grid grid-cols-3 gap-3">
        <SmartField
          label="City"
          value={overrides["w9_city"] ?? data.city}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, w9_city: v })}
          placeholder="City"
        />
        <SmartField
          label="State"
          value={overrides["w9_state"] ?? data.state}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, w9_state: v })}
          placeholder="State"
        />
        <SmartField
          label="ZIP Code"
          value={overrides["w9_zip"] ?? data.zipCode}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, w9_zip: v })}
          placeholder="ZIP"
        />
      </div>
      <SmartField
        label="SSN (Last 4 Digits)"
        value={overrides["w9_ssn"] ?? data.ssnLast4}
        source={sources.ssnLast4}
        onChange={(v) => setOverrides({ ...overrides, w9_ssn: v })}
        placeholder="••••"
        sensitive
      />
      <p className="text-[10px] text-soft-gray/60">
        Full SSN will be collected securely during final tax processing. Only last 4 digits stored.
      </p>
    </div>
  );
}

function HRForm({
  data,
  sources,
  overrides,
  setOverrides,
}: {
  data: any;
  sources: any;
  overrides: Record<string, string>;
  setOverrides: (o: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SmartField
          label="Legal First Name"
          value={overrides["hr_firstName"] ?? data.legalFirstName}
          source={sources.legalFirstName}
          onChange={(v) => setOverrides({ ...overrides, hr_firstName: v })}
          placeholder="First name"
        />
        <SmartField
          label="Legal Last Name"
          value={overrides["hr_lastName"] ?? data.legalLastName}
          source={sources.legalLastName}
          onChange={(v) => setOverrides({ ...overrides, hr_lastName: v })}
          placeholder="Last name"
        />
      </div>
      <SmartField
        label="Date of Birth"
        value={overrides["hr_dob"] ?? data.dateOfBirth}
        source={sources.dateOfBirth}
        onChange={(v) => setOverrides({ ...overrides, hr_dob: v })}
        type="date"
      />
      <SmartField
        label="Email Address"
        value={overrides["hr_email"] ?? data.email}
        source={sources.email}
        onChange={(v) => setOverrides({ ...overrides, hr_email: v })}
        type="email"
        placeholder="Email"
      />
      <SmartField
        label="Phone Number"
        value={overrides["hr_phone"] ?? data.phone}
        source={sources.phone}
        onChange={(v) => setOverrides({ ...overrides, hr_phone: v })}
        type="tel"
        placeholder="Phone"
      />
      <SmartField
        label="Address"
        value={overrides["hr_address"] ?? data.address}
        source={sources.address}
        onChange={(v) => setOverrides({ ...overrides, hr_address: v })}
        placeholder="Street address"
      />
      <div className="grid grid-cols-3 gap-3">
        <SmartField
          label="City"
          value={overrides["hr_city"] ?? data.city}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, hr_city: v })}
          placeholder="City"
        />
        <SmartField
          label="State"
          value={overrides["hr_state"] ?? data.state}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, hr_state: v })}
          placeholder="State"
        />
        <SmartField
          label="ZIP Code"
          value={overrides["hr_zip"] ?? data.zipCode}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, hr_zip: v })}
          placeholder="ZIP"
        />
      </div>
      <div className="bg-electric/10 rounded-lg p-3">
        <Label className="text-off-white/80 text-sm font-medium">Government ID</Label>
        <p className="text-sm text-off-white mt-1">
          {data.idType === "drivers_license" ? "Driver's License" : data.idType === "passport" ? "Passport" : "State ID"} — Last 4: ••{data.idLast4?.slice(-2) || "••"}
        </p>
        <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Verified during trust verification
        </p>
      </div>
      <div className="pt-2 border-t border-border/10">
        <Label className="text-off-white/80 text-sm font-medium mb-2 block">Emergency Contact</Label>
        <div className="grid grid-cols-2 gap-3">
          <SmartField
            label="Emergency Contact Name"
            value={overrides["hr_emergencyName"] ?? data.emergencyContactName}
            source={null}
            onChange={(v) => setOverrides({ ...overrides, hr_emergencyName: v })}
            placeholder="Full name"
          />
          <SmartField
            label="Emergency Contact Phone"
            value={overrides["hr_emergencyPhone"] ?? data.emergencyContactPhone}
            source={null}
            onChange={(v) => setOverrides({ ...overrides, hr_emergencyPhone: v })}
            placeholder="Phone number"
          />
        </div>
      </div>
    </div>
  );
}

function PayrollForm({
  data,
  sources,
  overrides,
  setOverrides,
}: {
  data: any;
  sources: any;
  overrides: Record<string, string>;
  setOverrides: (o: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <SmartField
        label="Legal Name (for payroll records)"
        value={overrides["pay_name"] ?? data.legalName}
        source={sources.legalName}
        onChange={(v) => setOverrides({ ...overrides, pay_name: v })}
        placeholder="Legal full name"
      />
      <SmartField
        label="Email Address"
        value={overrides["pay_email"] ?? data.email}
        source={sources.email}
        onChange={(v) => setOverrides({ ...overrides, pay_email: v })}
        type="email"
        placeholder="Email"
      />
      <SmartField
        label="Address"
        value={overrides["pay_address"] ?? data.address}
        source={sources.address}
        onChange={(v) => setOverrides({ ...overrides, pay_address: v })}
        placeholder="Street address"
      />
      <div className="grid grid-cols-3 gap-3">
        <SmartField
          label="City"
          value={overrides["pay_city"] ?? data.city}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, pay_city: v })}
          placeholder="City"
        />
        <SmartField
          label="State"
          value={overrides["pay_state"] ?? data.state}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, pay_state: v })}
          placeholder="State"
        />
        <SmartField
          label="ZIP Code"
          value={overrides["pay_zip"] ?? data.zipCode}
          source={sources.address}
          onChange={(v) => setOverrides({ ...overrides, pay_zip: v })}
          placeholder="ZIP"
        />
      </div>

      {/* Stripe Connect status */}
      <div className={`rounded-lg p-4 border ${
        data.stripeConnectStatus === "connected"
          ? "bg-green-50 border-green-200"
          : "bg-amber-500/10 border-amber-500/20"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className={`w-4 h-4 ${
            data.stripeConnectStatus === "connected" ? "text-emerald-400" : "text-amber-400"
          }`} />
          <span className={`text-sm font-medium ${
            data.stripeConnectStatus === "connected" ? "text-green-800" : "text-amber-800"
          }`}>
            {data.stripeConnectStatus === "connected"
              ? "Stripe Connect Linked"
              : "Stripe Connect Not Yet Set Up"
            }
          </span>
        </div>
        <p className={`text-xs ${
          data.stripeConnectStatus === "connected" ? "text-green-700" : "text-amber-700"
        }`}>
          {data.stripeConnectStatus === "connected"
            ? "Your bank account is linked through Stripe. Commission payouts will be deposited automatically."
            : "You'll set up Stripe Connect during your final onboarding to receive commission payouts directly to your bank account."
          }
        </p>
      </div>
    </div>
  );
}

function RepAgreementForm({
  data,
  sources,
  overrides,
  setOverrides,
}: {
  data: any;
  sources: any;
  overrides: Record<string, string>;
  setOverrides: (o: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <SmartField
        label="Legal Full Name"
        value={overrides["ra_name"] ?? data.legalName}
        source={sources.legalName}
        onChange={(v) => setOverrides({ ...overrides, ra_name: v })}
        placeholder="Legal full name"
      />
      <SmartField
        label="Address"
        value={overrides["ra_address"] ?? data.address}
        source={sources.address}
        onChange={(v) => setOverrides({ ...overrides, ra_address: v })}
        placeholder="Full address"
      />
      <SmartField
        label="Email"
        value={overrides["ra_email"] ?? data.email}
        source={sources.email}
        onChange={(v) => setOverrides({ ...overrides, ra_email: v })}
        type="email"
        placeholder="Email"
      />
      <SmartField
        label="Phone"
        value={overrides["ra_phone"] ?? data.phone}
        source={null}
        onChange={(v) => setOverrides({ ...overrides, ra_phone: v })}
        type="tel"
        placeholder="Phone"
      />
      <SmartField
        label="Date"
        value={overrides["ra_date"] ?? data.date}
        source={null}
        onChange={(v) => setOverrides({ ...overrides, ra_date: v })}
        type="date"
      />

      {/* NDA status */}
      {data.ndaAlreadySigned && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-green-800">NDA Already Signed</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            You signed the Confidentiality & Non-Disclosure Agreement on{" "}
            {data.ndaSignedDate ? new Date(data.ndaSignedDate).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            }) : "a previous date"}.
            This agreement is incorporated into the Rep Agreement by reference.
          </p>
        </div>
      )}

      <div className="bg-electric/10 rounded-lg p-4 text-xs text-soft-gray leading-relaxed">
        <p className="font-medium text-off-white text-sm mb-2">Key Terms Summary</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Independent contractor relationship (not employment)</li>
          <li>10-20% commission on all sales you close</li>
          <li>Commission paid within 30 days of client payment</li>
          <li>Either party may terminate with 14 days written notice</li>
          <li>Non-compete during active engagement (competing AI website services only)</li>
          <li>All MiniMorph IP, training materials, and client data remain Company property</li>
          <li><strong>Code of Conduct compliance required</strong> — Integrity First, Client Obsession, Radical Transparency, Ethical Selling, Trustworthy Representation, Brand Stewardship</li>
          <li>Violations of the Code of Conduct constitute grounds for immediate termination</li>
        </ul>
      </div>
    </div>
  );
}
