import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import {
  CheckCircle, ArrowLeft, ArrowRight, DollarSign, Users, TrendingUp,
  Zap, User, Briefcase, Heart, FileCheck, Sparkles, Trophy, Star, Camera,
  Eye, EyeOff, Lock, FlipHorizontal2, Loader2,
} from "lucide-react";
import PhotoCropper from "@/components/PhotoCropper";

const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Experience", icon: Briefcase },
  { id: 3, title: "Why MiniMorph?", icon: Heart },
  { id: 4, title: "Agreement", icon: FileCheck },
];

const INDUSTRIES = [
  "SaaS / Technology", "Real Estate", "Healthcare", "E-commerce", "Restaurants / Food",
  "Professional Services", "Construction / Trades", "Beauty / Wellness", "Fitness / Sports",
  "Education", "Automotive", "Financial Services", "Other",
];

export default function BecomeRep() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialStep = urlParams.get("step") ? parseInt(urlParams.get("step")!) : 1;
  const [step, setStep] = useState(initialStep);
  const [submitted, setSubmitted] = useState(false);

  // Step 1: Personal Info + Account Creation
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Experience
  const [availability, setAvailability] = useState<"full_time" | "part_time">("full_time");
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [salesExperience, setSalesExperience] = useState<"none" | "1_2_years" | "3_5_years" | "5_plus_years">("none");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Step 3: Motivation
  const [motivation, setMotivation] = useState("");
  const [referredBy, setReferredBy] = useState("");

  // Step 4: Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTaxInfo, setAgreedToTaxInfo] = useState(false);

  // Mutations
  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created! Let's continue your application.");
      // After account creation, create the rep profile
      submitRepProfile.mutate({ fullName, email, phone, bio: "" });
    },
    onError: (err: any) => {
      if (err.message.includes("already exists")) {
        toast.error("An account with this email already exists. Please log in at /login instead.");
      } else {
        toast.error(err.message);
      }
    },
  });

  const submitRepProfile = trpc.reps.submitApplication.useMutation({
    onSuccess: () => {
      // Upload photo after profile creation if one was selected
      if (photoFile) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          uploadPhoto.mutate({ photoBase64: base64, mimeType: photoFile.type });
        };
        reader.readAsDataURL(photoFile);
      }
      // Redirect to trust gate (NDA + identity) → then assessment → then back here at step=2
      setLocation("/become-rep/trust-gate");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const uploadPhoto = trpc.reps.uploadPhoto.useMutation({
    onSuccess: () => toast.success("Photo uploaded!"),
    onError: (err: any) => console.error("Photo upload failed:", err.message),
  });

  const submitExtended = trpc.repApplication.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Application submitted! Welcome to MiniMorph.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true); // selfie mode by default
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [qualityFeedback, setQualityFeedback] = useState<{ passed: boolean; issues: string[]; suggestions: string[] } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // Show the camera UI first so the <video> element mounts
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      // Attach stream to video element — may need a small delay for ref to be ready
      const attachStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        } else {
          // Retry once after a brief delay if ref isn't ready yet
          requestAnimationFrame(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          });
        }
      };
      attachStream();
    } catch (err) {
      setShowCamera(false);
      toast.error("Unable to access camera. Please check permissions and try again, or upload a photo instead.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Always capture in true (non-mirrored) orientation
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    // Open cropper instead of setting photo directly
    setCropperSrc(dataUrl);
    setShowCropper(true);
  };

  // Handle file upload → open cropper
  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  // AI photo quality check
  const checkPhotoQuality = trpc.reps.checkPhotoQuality.useMutation({
    onSuccess: (result: any) => {
      setIsCheckingQuality(false);
      setQualityFeedback(result);
      if (result.passed) {
        toast.success("Photo quality check passed!");
      } else {
        toast.warning("Photo quality concerns detected — see suggestions below.");
      }
    },
    onError: (err: any) => {
      setIsCheckingQuality(false);
      // Don't block on AI check failure — just skip
      console.error("Photo quality check failed:", err.message);
    },
  });

  // Cropper confirm handler
  const handleCropConfirm = (croppedDataUrl: string, croppedFile: File) => {
    setPhotoPreview(croppedDataUrl);
    setPhotoFile(croppedFile);
    setShowCropper(false);
    setCropperSrc(null);
    setQualityFeedback(null);
    // Trigger AI quality check in background
    setIsCheckingQuality(true);
    const base64 = croppedDataUrl.split(",")[1];
    checkPhotoQuality.mutate({ photoBase64: base64, mimeType: "image/jpeg" });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperSrc(null);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleStep1 = () => {
    if (!fullName.trim()) { toast.error("Name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!password) { toast.error("Password is required"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (!photoFile) { toast.error("A professional photo is required — it will appear on your email signature"); return; }
    // Register account first, which will trigger rep profile creation on success
    registerMutation.mutate({ email, password, name: fullName });
  };

  const handleStep2 = () => {
    if (hoursPerWeek < 5) { toast.error("Minimum 5 hours per week"); return; }
    setStep(3);
  };

  const handleStep3 = () => {
    if (motivation.length < 50) { toast.error("Please write at least 50 characters about your motivation"); return; }
    setStep(4);
  };

  const handleStep4 = () => {
    if (!agreedToTerms || !agreedToTaxInfo) { toast.error("Please accept all agreements"); return; }
    submitExtended.mutate({
      availability, hoursPerWeek, salesExperience,
      previousIndustries: selectedIndustries,
      motivation, linkedinUrl: linkedinUrl || undefined,
      referredBy: referredBy || undefined,
      agreedToTerms, agreedToTaxInfo,
    });
  };

  const toggleIndustry = (ind: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  // Removed fixed earnings estimate — using tiered examples instead

  const isStep1Loading = registerMutation.isPending || submitRepProfile.isPending;

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-sage/20 shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-forest" />
            </div>
            <h2 className="text-2xl font-serif text-forest mb-3">You're In! Welcome to MiniMorph!</h2>
            <p className="text-forest/60 font-sans mb-4 leading-relaxed max-w-md mx-auto">
              Your application has been approved. Just a few more steps to get you fully set up — we need your HR and tax paperwork, then you'll head straight to the Sales Academy.
            </p>
            <div className="space-y-2 max-w-sm mx-auto mb-8 text-left">
              {[
                { num: "1", label: "Complete onboarding paperwork", desc: "W-9, HR info, payroll — mostly auto-filled" },
                { num: "2", label: "Set up your payout account", desc: "Connect Stripe to receive commissions" },
                { num: "3", label: "Sales Academy training", desc: "Learn the company, products, and how to sell" },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-3 p-3 rounded-lg bg-forest/5">
                  <div className="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{item.num}</div>
                  <div>
                    <span className="text-sm font-medium font-sans text-forest">{item.label}</span>
                    <p className="text-xs text-forest/50 font-sans">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setLocation("/become-rep/paperwork")} className="bg-forest text-white hover:bg-forest/90 rounded-full px-8 w-full" size="lg">
              Continue to Paperwork <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-forest text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 font-sans text-sm transition-colors">
            <ArrowLeft size={16} /> Back to MiniMorph
          </button>
          <h1 className="text-3xl sm:text-4xl font-serif mb-3">Become a MiniMorph Rep</h1>
          <p className="text-lg text-white/80 font-sans max-w-2xl mx-auto">
            Join our network of sales professionals. Earn <span className="text-terracotta font-medium">10-20% commission</span> on every sale. Part-timers earn <span className="text-terracotta font-medium">$500-2,000/mo</span>. Full-timers? <span className="text-terracotta font-medium">$5,000-15,000+/mo</span>. No cap.
          </p>
        </div>
      </div>

      {/* Benefits Row */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: "10% Commission", desc: "On every sale you close" },
            { icon: Users, label: "AI-Sourced Leads", desc: "Warm prospects ready to buy" },
            { icon: TrendingUp, label: "Recurring Revenue", desc: "Earn on renewals too" },
            { icon: Zap, label: "We Handle Delivery", desc: "You sell, we build" },
          ].map((b, i) => (
            <Card key={i} className="border-sage/20 bg-white shadow-sm">
              <CardContent className="pt-4 pb-4 text-center">
                <b.icon className="w-5 h-5 text-terracotta mx-auto mb-2" />
                <p className="text-sm font-medium text-forest">{b.label}</p>
                <p className="text-[11px] text-forest/50 mt-0.5">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Step Progress */}
      <div className="max-w-lg mx-auto px-4 mt-8 mb-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${step >= s.id ? "text-forest" : "text-forest/30"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step > s.id ? "bg-forest text-white" : step === s.id ? "bg-terracotta text-white" : "bg-sage/20 text-forest/40"
                }`}>
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs font-sans hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors ${step > s.id ? "bg-forest" : "bg-sage/20"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Already have an account? */}
      {step === 1 && (
        <div className="max-w-lg mx-auto px-4 mb-4">
          <p className="text-center text-sm text-forest/50 font-sans">
            Already have an account?{" "}
            <button onClick={() => setLocation("/login")} className="text-terracotta hover:underline font-medium">
              Log in here
            </button>
          </p>
        </div>
      )}

      {/* Form Card */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <Card className="border-sage/20 shadow-lg">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-forest text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-terracotta" /> Create Your Account
                </CardTitle>
                <CardDescription className="text-forest/60">Set up your account and tell us about yourself.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-forest/80 text-sm">Full Name *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="mt-1 border-sage/30 focus:border-forest" />
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 border-sage/30 focus:border-forest" />
                </div>
                <div>
                  <Label className="text-forest/80 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="border-sage/30 focus:border-forest pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && password.length < 8 && (
                    <p className="text-[11px] text-red-500 mt-1 font-sans">Must be at least 8 characters</p>
                  )}
                </div>
                <div>
                  <Label className="text-forest/80 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Confirm Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="border-sage/30 focus:border-forest pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest/70"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-sans">Passwords don't match</p>
                  )}
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="mt-1 border-sage/30 focus:border-forest" />
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">LinkedIn Profile (optional)</Label>
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" className="mt-1 border-sage/30 focus:border-forest" />
                </div>
                {/* Professional Photo — MANDATORY */}
                <div className="border border-terracotta/20 rounded-lg p-4 bg-terracotta/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Label className="text-forest text-sm font-medium">Professional Photo *</Label>
                    <Badge variant="outline" className="text-[10px] border-terracotta/30 text-terracotta">Required</Badge>
                  </div>
                  <p className="text-[11px] text-forest/60 font-sans mb-3 leading-relaxed">
                    This photo will appear on your <strong>official MiniMorph email signature</strong> and rep profile.
                    Please use a professional headshot — good lighting, neutral background, no sunglasses or hats.
                  </p>

                  {/* Photo Cropper overlay */}
                  {showCropper && cropperSrc && (
                    <div className="mb-3 border border-sage/30 rounded-lg p-3 bg-cream">
                      <PhotoCropper
                        imageSrc={cropperSrc}
                        onConfirm={handleCropConfirm}
                        onCancel={handleCropCancel}
                      />
                    </div>
                  )}

                  {/* Camera capture modal */}
                  {showCamera && !showCropper && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-sage/30 bg-black">
                      <div className="relative">
                        <video
                          ref={(el) => {
                            (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                            if (el && streamRef.current && !el.srcObject) {
                              el.srcObject = streamRef.current;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full aspect-square object-cover"
                          style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                        />
                        {/* Mirror toggle */}
                        <button
                          type="button"
                          onClick={() => setIsMirrored(!isMirrored)}
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                          title={isMirrored ? "Showing mirror view (selfie). Click to see how others see you." : "Showing true view. Click for mirror (selfie) view."}
                        >
                          <FlipHorizontal2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {isMirrored ? "Mirror (selfie)" : "True view (how others see you)"}
                        </div>
                      </div>
                      <div className="flex gap-2 p-2 bg-forest/90">
                        <Button
                          type="button"
                          size="sm"
                          onClick={capturePhoto}
                          className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white text-xs rounded-full"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" /> Take Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={stopCamera}
                          className="text-xs rounded-full border-white/30 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div
                      className="relative w-20 h-20 rounded-full border-2 border-dashed border-terracotta/40 flex items-center justify-center cursor-pointer hover:border-terracotta/60 transition-colors overflow-hidden group"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-terracotta/40 group-hover:text-terracotta/60 transition-colors" />
                      )}
                      {photoPreview && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => photoInputRef.current?.click()}
                          className="text-xs font-sans rounded-full"
                        >
                          {photoPreview ? "Change Photo" : "Upload Photo"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startCamera}
                          className="text-xs font-sans rounded-full"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1" /> Use Camera
                        </Button>
                      </div>
                      <p className="text-[10px] text-forest/40">JPG or PNG, max 5MB. Professional headshot recommended.</p>
                    </div>
                    {/* AI Quality Feedback */}
                    {isCheckingQuality && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-forest/60">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI is checking photo quality...</span>
                      </div>
                    )}
                    {qualityFeedback && !isCheckingQuality && (
                      <div className={`mt-2 p-2.5 rounded-lg text-xs ${
                        qualityFeedback.passed
                          ? "bg-green-50 border border-green-200"
                          : "bg-amber-50 border border-amber-200"
                      }`}>
                        <p className={`font-medium mb-1 ${qualityFeedback.passed ? "text-green-700" : "text-amber-700"}`}>
                          {qualityFeedback.passed ? "✓ Photo looks great!" : "⚠ Photo quality suggestions:"}
                        </p>
                        {qualityFeedback.issues.length > 0 && (
                          <ul className="text-amber-600 space-y-0.5 mb-1">
                            {qualityFeedback.issues.map((issue: string, i: number) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        )}
                        {qualityFeedback.suggestions.length > 0 && !qualityFeedback.passed && (
                          <ul className="text-forest/60 space-y-0.5">
                            {qualityFeedback.suggestions.map((s: string, i: number) => (
                              <li key={i}>💡 {s}</li>
                            ))}
                          </ul>
                        )}
                        {!qualityFeedback.passed && (
                          <p className="text-[10px] text-forest/40 mt-1">You can still proceed — these are suggestions, not requirements.</p>
                        )}
                      </div>
                    )}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleFileSelected(file);
                        e.target.value = ""; // reset so same file can be re-selected
                      }}
                    />
                  </div>
                </div>
                <Button onClick={handleStep1} disabled={isStep1Loading} className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full py-5 font-sans">
                  {isStep1Loading ? "Creating Account..." : "Create Account & Continue"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-forest text-xl flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-terracotta" /> Sales Experience
                </CardTitle>
                <CardDescription className="text-forest/60">Help us understand your background so we can set you up for success.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-forest/80 text-sm">Availability *</Label>
                  <Select value={availability} onValueChange={(v: any) => setAvailability(v)}>
                    <SelectTrigger className="mt-1 border-sage/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-Time (30-40+ hrs/week)</SelectItem>
                      <SelectItem value="part_time">Part-Time (10-25 hrs/week)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Hours Per Week: {hoursPerWeek}</Label>
                  <input type="range" min={5} max={60} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(Number(e.target.value))} className="w-full mt-2 accent-terracotta" />
                  <div className="flex justify-between text-[10px] text-forest/40 font-sans"><span>5 hrs</span><span>60 hrs</span></div>
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Sales Experience *</Label>
                  <Select value={salesExperience} onValueChange={(v: any) => setSalesExperience(v)}>
                    <SelectTrigger className="mt-1 border-sage/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No formal sales experience</SelectItem>
                      <SelectItem value="1_2_years">1-2 years</SelectItem>
                      <SelectItem value="3_5_years">3-5 years</SelectItem>
                      <SelectItem value="5_plus_years">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-forest/80 text-sm mb-2 block">Industries You've Worked In</Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <Badge key={ind} variant={selectedIndustries.includes(ind) ? "default" : "outline"}
                        className={`cursor-pointer text-xs font-sans transition-colors ${
                          selectedIndustries.includes(ind) ? "bg-forest text-white hover:bg-forest/90" : "border-sage/30 text-forest/60 hover:bg-sage/10"
                        }`}
                        onClick={() => toggleIndustry(ind)}>
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-full border-sage/30 text-forest">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleStep2} className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white rounded-full font-sans">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-forest text-xl flex items-center gap-2">
                  <Heart className="w-5 h-5 text-terracotta" /> Why MiniMorph?
                </CardTitle>
                <CardDescription className="text-forest/60">Quality reps who care about small businesses thrive here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="text-forest/80 text-sm">Why do you want to join MiniMorph Studios? *</Label>
                  <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Tell us what excites you about helping small businesses get online with AI-powered websites. What makes you a great fit? (minimum 50 characters)"
                    className="mt-1 border-sage/30 focus:border-forest min-h-[140px]" />
                  <p className={`text-[11px] mt-1 font-sans ${motivation.length >= 50 ? "text-green-600" : "text-forest/40"}`}>
                    {motivation.length}/50 minimum characters
                  </p>
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Referred by someone? (optional)</Label>
                  <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Name or email of the person who referred you" className="mt-1 border-sage/30 focus:border-forest" />
                  <p className="text-[11px] text-forest/40 mt-1 font-sans">Referrers earn a $200 bonus when you close your first deal.</p>
                </div>
                <div className="bg-forest/5 rounded-xl p-4 border border-forest/10">
                  <p className="text-sm font-serif text-forest mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-terracotta" /> Earnings Potential
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-sans text-forest/60">Part-Time (5 hrs/wk)</span>
                      <span className="text-sm font-serif text-forest">$500 - $2,000/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-sans text-forest/60">Side Hustle (15 hrs/wk)</span>
                      <span className="text-sm font-serif text-forest">$2,000 - $5,000/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-sans text-forest/60">Full-Time (40 hrs/wk)</span>
                      <span className="text-sm font-serif text-forest font-medium">$5,000 - $15,000/mo</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-forest/10 pt-2">
                      <span className="text-xs font-sans text-terracotta font-medium">Top Performers</span>
                      <span className="text-sm font-serif text-terracotta font-bold">$20,000+/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-forest/40 font-sans mt-2">
                    Based on 10% base commission. Legend tier reps earn 20%, doubling these figures. No cap on earnings.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-full border-sage/30 text-forest">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleStep3} className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white rounded-full font-sans">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="font-serif text-forest text-xl flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-terracotta" /> Review & Agreement
                </CardTitle>
                <CardDescription className="text-forest/60">Almost there! Review the terms and submit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="bg-cream-dark/30 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-sans text-forest/50 uppercase tracking-wide">Application Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm font-sans">
                    <div><span className="text-forest/50">Name:</span> <span className="text-forest font-medium">{fullName}</span></div>
                    <div><span className="text-forest/50">Email:</span> <span className="text-forest font-medium">{email}</span></div>
                    <div><span className="text-forest/50">Availability:</span> <span className="text-forest font-medium">{availability === "full_time" ? "Full-Time" : "Part-Time"}</span></div>
                    <div><span className="text-forest/50">Experience:</span> <span className="text-forest font-medium">{salesExperience.replace(/_/g, " ")}</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-sage/20 bg-white">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-sm text-forest/70 font-sans leading-relaxed cursor-pointer">
                      I agree to the <span className="text-forest font-medium">MiniMorph Rep Agreement</span>, including the 10% commission structure, brand representation guidelines, and code of conduct. I understand that I am an independent contractor, not an employee.
                    </label>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-sage/20 bg-white">
                    <Checkbox id="tax" checked={agreedToTaxInfo} onCheckedChange={(v) => setAgreedToTaxInfo(!!v)} className="mt-0.5" />
                    <label htmlFor="tax" className="text-sm text-forest/70 font-sans leading-relaxed cursor-pointer">
                      I agree to provide my <span className="text-forest font-medium">tax information and bank account details</span> via Stripe's secure platform for commission payouts. I understand I am responsible for reporting my own taxes as an independent contractor.
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1 rounded-full border-sage/30 text-forest">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleStep4} disabled={submitExtended.isPending || !agreedToTerms || !agreedToTaxInfo}
                    className="flex-1 bg-forest hover:bg-forest/90 text-white rounded-full font-sans">
                    {submitExtended.isPending ? "Submitting..." : "Submit Application"} <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
