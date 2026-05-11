import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { toast } from "sonner";
import {
  Shield,
  Lock,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Sparkles,
  UserCheck,
  MapPin,
  Loader2,
} from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export default function TrustGate() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"nda" | "identity" | "complete">("nda");

  // NDA state
  const [ndaScrolledToBottom, setNdaScrolledToBottom] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  // Identity state
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ssnLast4, setSsnLast4] = useState("");
  const [idType, setIdType] = useState<"drivers_license" | "passport" | "state_id">("drivers_license");
  const [idLast4, setIdLast4] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Fetch NDA text
  const { data: ndaData } = trpc.repOnboarding.getNda.useQuery(undefined, {
    enabled: !!user,
  });

  // Check if already completed
  const { data: trustGateStatus, isLoading: statusLoading } =
    trpc.repOnboarding.checkTrustGate.useQuery(undefined, {
      enabled: !!user,
    });

  // Submit mutation
  const submitMutation = trpc.repOnboarding.submitTrustGate.useMutation({
    onSuccess: () => {
      setStep("complete");
      toast.success("Trust verification complete! You can now take the assessment.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit verification");
    },
  });

  // Auto-populate from user name if available
  useEffect(() => {
    if (user?.name && !legalFirstName && !legalLastName) {
      const parts = user.name.split(" ");
      if (parts.length >= 2) {
        setLegalFirstName(parts[0]);
        setLegalLastName(parts.slice(1).join(" "));
      } else if (parts.length === 1) {
        setLegalFirstName(parts[0]);
      }
    }
  }, [user]);

  // If already completed, redirect to assessment
  useEffect(() => {
    if (trustGateStatus?.completed) {
      setStep("complete");
    }
  }, [trustGateStatus]);

  const handleNdaScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom) setNdaScrolledToBottom(true);
  };

  const handleNdaContinue = () => {
    if (!ndaAccepted) {
      toast.error("Please read and accept the NDA to continue");
      return;
    }
    setStep("identity");
  };

  const handleIdentitySubmit = () => {
    if (!legalFirstName.trim()) { toast.error("Legal first name is required"); return; }
    if (!legalLastName.trim()) { toast.error("Legal last name is required"); return; }
    if (!dateOfBirth) { toast.error("Date of birth is required"); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) { toast.error("Date of birth must be YYYY-MM-DD format"); return; }
    if (!/^\d{4}$/.test(ssnLast4)) { toast.error("SSN last 4 must be exactly 4 digits"); return; }
    if (!/^\d{4}$/.test(idLast4)) { toast.error("ID last 4 must be exactly 4 digits"); return; }
    if (!streetAddress.trim()) { toast.error("Street address is required"); return; }
    if (!city.trim()) { toast.error("City is required"); return; }
    if (!state) { toast.error("State is required"); return; }
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) { toast.error("Valid ZIP code is required"); return; }

    submitMutation.mutate({
      legalFirstName: legalFirstName.trim(),
      legalLastName: legalLastName.trim(),
      dateOfBirth,
      ssnLast4,
      idType,
      idLast4,
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      state,
      zipCode,
      ndaAccepted: true,
    });
  };

  // Loading
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-electric mx-auto mb-4" />
            <h2 className="text-xl font-bold text-off-white mb-2">Account Required</h2>
            <p className="text-muted-foreground mb-4">
              Please create your account first.
            </p>
            <Button onClick={() => navigate("/become-rep")} className="bg-electric hover:bg-electric-light text-white">
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete state
  if (step === "complete") {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-off-white mb-2 font-serif">
              Verification Complete
            </h2>
            <p className="text-muted-foreground mb-2">
              Your identity has been verified and the NDA is signed.
              You're ready to take the MiniMorph Rep Assessment.
            </p>
            <p className="text-xs text-soft-gray mb-6">
              {trustGateStatus?.ndaSignedAt && (
                <>NDA signed on {new Date(trustGateStatus.ndaSignedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</>
              )}
            </p>
            <Button
              onClick={() => navigate("/rep-assessment")}
              className="bg-electric hover:bg-electric/90 text-white w-full rounded-full py-5"
              size="lg"
            >
              Take the Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      <OnboardingProgress currentStep={3} />
      {/* Header */}
      <div className="bg-charcoal text-off-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <button
            onClick={() => navigate("/become-rep")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-3 font-sans text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Application
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif mb-2">Trust & IP Verification</h1>
          <p className="text-white/80 font-sans text-sm max-w-lg mx-auto">
            MiniMorph is an AI-driven company. Our proprietary training, sales methodologies, and technology are our competitive advantage.
            Before we share them with you, we need to verify your identity and protect our IP.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-4 mt-6 mb-4">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === "nda" ? "text-off-white" : "text-soft-gray/60"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step === "nda" ? "bg-electric text-white" : step === "identity" ? "bg-charcoal text-off-white" : "bg-charcoal text-off-white"
            }`}>
              {step !== "nda" ? <CheckCircle className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-sm font-sans">NDA</span>
          </div>
          <div className={`w-12 h-0.5 ${step === "identity" ? "bg-electric" : "bg-graphite/20"}`} />
          <div className={`flex items-center gap-2 ${step === "identity" ? "text-off-white" : "text-soft-gray/60"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step === "identity" ? "bg-electric text-white" : "bg-graphite/20 text-soft-gray/60"
            }`}>
              2
            </div>
            <span className="text-sm font-sans">Identity</span>
          </div>
        </div>
      </div>

      {/* Why we collect this */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Why we collect this information</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Smart company, smart process.</strong> We collect your identity and address once, then auto-populate
                all your onboarding paperwork (tax forms, identity docs, payout setup, rep agreement) so you never have to type
                the same information twice. This also protects our proprietary AI training materials and sales methodologies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {step === "nda" && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif text-off-white text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-electric" />
                Confidentiality & Non-Disclosure Agreement
              </CardTitle>
              <CardDescription className="text-soft-gray">
                Please read the entire agreement carefully. You must scroll to the bottom before accepting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NDA text in scrollable container */}
              <div
                className="bg-charcoal border border-border/50 rounded-lg p-6 max-h-[400px] overflow-y-auto text-sm text-off-white/80 font-sans leading-relaxed whitespace-pre-line"
                onScroll={handleNdaScroll}
              >
                {ndaData?.text || "Loading NDA..."}
              </div>

              {!ndaScrolledToBottom && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Please scroll to the bottom of the agreement to continue
                </p>
              )}

              <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                ndaScrolledToBottom ? "border-border/50 bg-charcoal" : "border-border/10 bg-gray-50 opacity-60"
              }`}>
                <Checkbox
                  id="nda-accept"
                  checked={ndaAccepted}
                  onCheckedChange={(v) => setNdaAccepted(!!v)}
                  disabled={!ndaScrolledToBottom}
                  className="mt-0.5"
                />
                <label htmlFor="nda-accept" className="text-sm text-soft-gray font-sans leading-relaxed cursor-pointer">
                  I have read and agree to the <span className="text-off-white font-medium">MiniMorph Studios Confidentiality & Non-Disclosure Agreement</span>.
                  I understand that violation of this agreement may result in legal action.
                </label>
              </div>

              <Button
                onClick={handleNdaContinue}
                disabled={!ndaAccepted || !ndaScrolledToBottom}
                className="w-full bg-electric hover:bg-electric/90 text-white rounded-full py-5 font-sans"
              >
                Accept & Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "identity" && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif text-off-white text-xl flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-electric" />
                Identity Verification
              </CardTitle>
              <CardDescription className="text-soft-gray">
                This information will be securely stored and used to auto-fill your onboarding paperwork.
                You won't need to enter it again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Legal Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-off-white/80 text-sm">Legal First Name *</Label>
                  <Input
                    value={legalFirstName}
                    onChange={(e) => setLegalFirstName(e.target.value)}
                    placeholder="First name (as on ID)"
                    className="mt-1 border-border focus:border-electric"
                  />
                  {legalFirstName && user?.name?.includes(legalFirstName) && (
                    <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-filled from your account
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-off-white/80 text-sm">Legal Last Name *</Label>
                  <Input
                    value={legalLastName}
                    onChange={(e) => setLegalLastName(e.target.value)}
                    placeholder="Last name (as on ID)"
                    className="mt-1 border-border focus:border-electric"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <Label className="text-off-white/80 text-sm">Date of Birth *</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-1 border-border focus:border-electric"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                />
                <p className="text-[10px] text-soft-gray/60 mt-0.5">Must be 18 or older</p>
              </div>

              {/* SSN Last 4 */}
              <div>
                <Label className="text-off-white/80 text-sm flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> SSN Last 4 Digits *
                </Label>
                <Input
                  type="password"
                  value={ssnLast4}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setSsnLast4(val);
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="mt-1 border-border focus:border-electric w-32"
                />
                <p className="text-[10px] text-soft-gray/60 mt-0.5">
                  Used for tax form (W-9) auto-fill. Stored securely.
                </p>
              </div>

              {/* Government ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-off-white/80 text-sm">Government ID Type *</Label>
                  <Select value={idType} onValueChange={(v: any) => setIdType(v)}>
                    <SelectTrigger className="mt-1 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="state_id">State ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-off-white/80 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> ID Last 4 Digits *
                  </Label>
                  <Input
                    type="password"
                    value={idLast4}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setIdLast4(val);
                    }}
                    placeholder="••••"
                    maxLength={4}
                    className="mt-1 border-border focus:border-electric"
                  />
                </div>
              </div>

              {/* Address section */}
              <div className="pt-2 border-t border-border/10">
                <Label className="text-off-white/80 text-sm flex items-center gap-1.5 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-electric" /> Mailing Address
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-off-white/80 text-xs">Street Address *</Label>
                    <Input
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="123 Main St, Apt 4B"
                      className="mt-1 border-border focus:border-electric"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-off-white/80 text-xs">City *</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="mt-1 border-border focus:border-electric"
                      />
                    </div>
                    <div>
                      <Label className="text-off-white/80 text-xs">State *</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="mt-1 border-border">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-off-white/80 text-xs">ZIP Code *</Label>
                      <Input
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="12345"
                        className="mt-1 border-border focus:border-electric"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart messaging */}
              <div className="bg-electric/10 rounded-lg p-3 border border-electric/10">
                <p className="text-xs text-soft-gray flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-electric shrink-0" />
                  <span>
                    <strong>One-time entry.</strong> This data will auto-populate your W-9 tax form,
                    identity docs, payout setup, and rep agreement — no retyping.
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("nda")}
                  className="flex-1 rounded-full border-border text-off-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleIdentitySubmit}
                  disabled={submitMutation.isPending}
                  className="flex-1 bg-electric hover:bg-electric/90 text-white rounded-full font-sans"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
