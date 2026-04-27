import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Briefcase,
  UtensilsCrossed,
  Hammer,
  ShoppingCart,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  X,
} from "lucide-react";
import { AIChatBox } from "@/components/AIChatBox";
import type { WebsiteType, BrandTone, ContentPreference, InspirationSite, CompetitorSite } from "@shared/questionnaire";
import { WEBSITE_TYPE_LABELS, WEBSITE_TYPE_DESCRIPTIONS, QUESTIONNAIRE_STEPS } from "@shared/questionnaire";

/* ─── Icon map for website types ─── */
const TYPE_ICONS: Record<WebsiteType, React.ReactNode> = {
  service_business: <Briefcase className="w-6 h-6" />,
  restaurant: <UtensilsCrossed className="w-6 h-6" />,
  contractor: <Hammer className="w-6 h-6" />,
  ecommerce: <ShoppingCart className="w-6 h-6" />,
  other: <Sparkles className="w-6 h-6" />,
};

/* ─── Empty templates ─── */
const EMPTY_INSPIRATION: InspirationSite = { url: "", whatYouLike: "", whatYouDislike: "" };
const EMPTY_COMPETITOR: CompetitorSite = { url: "", whatYouWantToBeat: "", featuresYouWish: "" };

/* ═══════════════════════════════════════════════════════
   QUESTIONNAIRE WIZARD — 5-step conditional branching
   ═══════════════════════════════════════════════════════ */
export function QuestionnaireWizard({
  projectId,
  onNext,
  onProjectCreated,
}: {
  projectId: number | null;
  onNext: () => void;
  onProjectCreated: (id: number) => void;
}) {
  // ── Wizard step ──
  const [step, setStep] = useState(1);

  // ── Step 1: Website type ──
  const [websiteType, setWebsiteType] = useState<WebsiteType | "">("");

  // ── Step 2: Universal brand ──
  const [brandTone, setBrandTone] = useState<BrandTone>("professional");
  const [brandColors, setBrandColors] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentPreference, setContentPreference] = useState<ContentPreference>("we_write");

  // ── Step 3: Inspiration & competitors ──
  const [inspirationSites, setInspirationSites] = useState<InspirationSite[]>([{ ...EMPTY_INSPIRATION }]);
  const [competitorSites, setCompetitorSites] = useState<CompetitorSite[]>([{ ...EMPTY_COMPETITOR }]);

  // ── Step 4: Industry-specific ──
  // Service Business
  const [sbServiceArea, setSbServiceArea] = useState("");
  const [sbHasBooking, setSbHasBooking] = useState(false);
  const [sbBookingMethod, setSbBookingMethod] = useState("");
  const [sbServicesOffered, setSbServicesOffered] = useState("");
  const [sbLicensed, setSbLicensed] = useState(false);
  const [sbLicenseDetails, setSbLicenseDetails] = useState("");
  // Restaurant
  const [rCuisineType, setRCuisineType] = useState("");
  const [rHasLocation, setRHasLocation] = useState(true);
  const [rLocationCount, setRLocationCount] = useState(1);
  const [rNeedsMenu, setRNeedsMenu] = useState(true);
  const [rNeedsOrdering, setRNeedsOrdering] = useState(false);
  const [rNeedsReservations, setRNeedsReservations] = useState(false);
  const [rHours, setRHours] = useState("");
  const [rDeliveryPartners, setRDeliveryPartners] = useState("");
  // Contractor
  const [cServiceArea, setCServiceArea] = useState("");
  const [cTradeType, setCTradeType] = useState("");
  const [cLicensed, setCLicensed] = useState(false);
  const [cLicenseNumber, setCLicenseNumber] = useState("");
  const [cNeedsQuoteForm, setCNeedsQuoteForm] = useState(true);
  const [cNeedsGallery, setCNeedsGallery] = useState(true);
  const [cInsurance, setCInsurance] = useState("");
  const [cEmergency, setCEmergency] = useState(false);
  // Ecommerce
  const [eProductCount, setEProductCount] = useState("");
  const [eCategories, setECategories] = useState("");
  const [eNeedsShipping, setENeedsShipping] = useState(true);
  const [eShippingRegions, setEShippingRegions] = useState("US only");
  const [eExistingPlatform, setEExistingPlatform] = useState("None");
  const [eNeedsMigration, setENeedsMigration] = useState(false);
  const [eHasInventory, setEHasInventory] = useState(false);
  const [ePaymentMethods, setEPaymentMethods] = useState("Credit card");
  const [eNeedsSubscriptions, setENeedsSubscriptions] = useState(false);
  const [eTaxHandling, setETaxHandling] = useState("Not sure");
  const [eHasVariants, setEHasVariants] = useState(false);
  const [eVariantComplexity, setEVariantComplexity] = useState("simple");
  const [ePhotosStatus, setEPhotosStatus] = useState("have_all");
  const [eDescriptionsStatus, setEDescriptionsStatus] = useState("have_all");
  const [eAbandonedCart, setEAbandonedCart] = useState(false);
  const [eReturnPolicy, setEReturnPolicy] = useState("");
  // Other
  const [oDescription, setODescription] = useState("");
  const [oIndustry, setOIndustry] = useState("");
  const [oUnique, setOUnique] = useState("");

  // ── Step 5: Features & special requests ──
  const [mustHaveFeatures, setMustHaveFeatures] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // ── AI Chat ──
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "system" | "user" | "assistant"; content: string }>>([]);
  const [aiAutoFilled, setAiAutoFilled] = useState(false);

  // ── Mutations ──
  const createProject = trpc.onboarding.create.useMutation();
  const submitQuestionnaire = trpc.onboarding.submitQuestionnaire.useMutation();

  const aiChat = trpc.ai.onboardingChat.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      if (data.extractedData) {
        applyAiData(data.extractedData);
        setAiAutoFilled(true);
        toast.success("AI has filled in your questionnaire based on our conversation!");
      }
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble processing that. Could you try again?" },
      ]);
    },
  });

  // ── Apply AI-extracted data to form state ──
  const applyAiData = useCallback((d: any) => {
    if (d.websiteType) setWebsiteType(d.websiteType);
    if (d.brandTone) setBrandTone(d.brandTone);
    if (d.brandColors?.length) setBrandColors(d.brandColors.join(", "));
    if (d.targetAudience) setTargetAudience(d.targetAudience);
    if (d.contentPreference) setContentPreference(d.contentPreference);
    if (d.inspirationSites?.length) setInspirationSites(d.inspirationSites);
    if (d.competitorSites?.length) setCompetitorSites(d.competitorSites);
    // Legacy compat
    if (d.inspirationUrls?.length && !d.inspirationSites?.length) {
      setInspirationSites(d.inspirationUrls.map((url: string) => ({ url, whatYouLike: "", whatYouDislike: "" })));
    }
    if (d.competitors?.length && !d.competitorSites?.length) {
      setCompetitorSites(d.competitors.map((url: string) => ({ url, whatYouWantToBeat: "", featuresYouWish: "" })));
    }
    // Industry-specific
    if (d.serviceBusinessFields) {
      const f = d.serviceBusinessFields;
      if (f.serviceArea) setSbServiceArea(f.serviceArea);
      if (f.hasBookingSystem !== undefined) setSbHasBooking(f.hasBookingSystem);
      if (f.currentBookingMethod) setSbBookingMethod(f.currentBookingMethod);
      if (f.servicesOffered) setSbServicesOffered(f.servicesOffered);
      if (f.licensedOrCertified !== undefined) setSbLicensed(f.licensedOrCertified);
      if (f.licenseDetails) setSbLicenseDetails(f.licenseDetails);
    }
    if (d.restaurantFields) {
      const f = d.restaurantFields;
      if (f.cuisineType) setRCuisineType(f.cuisineType);
      if (f.hasPhysicalLocation !== undefined) setRHasLocation(f.hasPhysicalLocation);
      if (f.locationCount) setRLocationCount(f.locationCount);
      if (f.needsOnlineMenu !== undefined) setRNeedsMenu(f.needsOnlineMenu);
      if (f.needsOnlineOrdering !== undefined) setRNeedsOrdering(f.needsOnlineOrdering);
      if (f.needsReservations !== undefined) setRNeedsReservations(f.needsReservations);
      if (f.operatingHours) setRHours(f.operatingHours);
      if (f.deliveryPartners) setRDeliveryPartners(f.deliveryPartners);
    }
    if (d.contractorFields) {
      const f = d.contractorFields;
      if (f.serviceArea) setCServiceArea(f.serviceArea);
      if (f.tradeType) setCTradeType(f.tradeType);
      if (f.licensedOrCertified !== undefined) setCLicensed(f.licensedOrCertified);
      if (f.licenseNumber) setCLicenseNumber(f.licenseNumber);
      if (f.needsQuoteForm !== undefined) setCNeedsQuoteForm(f.needsQuoteForm);
      if (f.needsBeforeAfterGallery !== undefined) setCNeedsGallery(f.needsBeforeAfterGallery);
      if (f.insuranceInfo) setCInsurance(f.insuranceInfo);
      if (f.emergencyService !== undefined) setCEmergency(f.emergencyService);
    }
    if (d.ecommerceFields) {
      const f = d.ecommerceFields;
      if (f.productCount) setEProductCount(f.productCount);
      if (f.productCategories) setECategories(f.productCategories);
      if (f.needsShipping !== undefined) setENeedsShipping(f.needsShipping);
      if (f.shippingRegions) setEShippingRegions(f.shippingRegions);
      if (f.existingPlatform) setEExistingPlatform(f.existingPlatform);
      if (f.needsMigration !== undefined) setENeedsMigration(f.needsMigration);
      if (f.hasInventorySystem !== undefined) setEHasInventory(f.hasInventorySystem);
      if (f.paymentMethods) setEPaymentMethods(f.paymentMethods);
      if (f.needsSubscriptions !== undefined) setENeedsSubscriptions(f.needsSubscriptions);
      if (f.taxHandling) setETaxHandling(f.taxHandling);
    }
    if (d.otherFields) {
      const f = d.otherFields;
      if (f.businessDescription) setODescription(f.businessDescription);
      if (f.industryCategory) setOIndustry(f.industryCategory);
      if (f.uniqueRequirements) setOUnique(f.uniqueRequirements);
    }
    if (d.mustHaveFeatures?.length) setMustHaveFeatures(d.mustHaveFeatures.join(", "));
    if (d.specialRequests) setSpecialRequests(d.specialRequests);
  }, []);

  const handleSendMessage = (content: string) => {
    setChatMessages((prev) => [...prev, { role: "user", content }]);
    aiChat.mutate({
      projectId: projectId ?? undefined,
      message: content,
      history: chatMessages.filter((m) => m.role !== "system"),
    });
  };

  // ── Build questionnaire payload ──
  const buildPayload = () => {
    const q: any = {
      websiteType: websiteType || undefined,
      brandTone,
      brandColors: brandColors.split(",").map((s) => s.trim()).filter(Boolean),
      targetAudience,
      contentPreference,
      inspirationSites: inspirationSites.filter((s) => s.url.trim()),
      competitorSites: competitorSites.filter((s) => s.url.trim()),
      mustHaveFeatures: mustHaveFeatures.split(",").map((s) => s.trim()).filter(Boolean),
      specialRequests,
    };
    if (websiteType === "service_business") {
      q.serviceBusinessFields = {
        serviceArea: sbServiceArea,
        hasBookingSystem: sbHasBooking,
        currentBookingMethod: sbBookingMethod,
        servicesOffered: sbServicesOffered,
        licensedOrCertified: sbLicensed,
        licenseDetails: sbLicenseDetails,
      };
    } else if (websiteType === "restaurant") {
      q.restaurantFields = {
        cuisineType: rCuisineType,
        hasPhysicalLocation: rHasLocation,
        locationCount: rLocationCount,
        needsOnlineMenu: rNeedsMenu,
        needsOnlineOrdering: rNeedsOrdering,
        needsReservations: rNeedsReservations,
        operatingHours: rHours,
        deliveryPartners: rDeliveryPartners,
      };
    } else if (websiteType === "contractor") {
      q.contractorFields = {
        serviceArea: cServiceArea,
        tradeType: cTradeType,
        licensedOrCertified: cLicensed,
        licenseNumber: cLicenseNumber,
        needsQuoteForm: cNeedsQuoteForm,
        needsBeforeAfterGallery: cNeedsGallery,
        insuranceInfo: cInsurance,
        emergencyService: cEmergency,
      };
    } else if (websiteType === "ecommerce") {
      q.ecommerceFields = {
        productCount: eProductCount,
        productCategories: eCategories,
        needsShipping: eNeedsShipping,
        shippingRegions: eShippingRegions,
        existingPlatform: eExistingPlatform,
        needsMigration: eNeedsMigration,
        hasInventorySystem: eHasInventory,
        paymentMethods: ePaymentMethods,
        needsSubscriptions: eNeedsSubscriptions,
        taxHandling: eTaxHandling,
        hasProductVariants: eHasVariants,
        variantComplexity: eVariantComplexity,
        productPhotosStatus: ePhotosStatus,
        productDescriptionsStatus: eDescriptionsStatus,
        abandonedCartInterest: eAbandonedCart,
        returnPolicy: eReturnPolicy,
        platformPreference: eExistingPlatform === "None" ? "not_sure" : eExistingPlatform.toLowerCase(),
      };
    } else if (websiteType === "other") {
      q.otherFields = {
        businessDescription: oDescription,
        industryCategory: oIndustry,
        uniqueRequirements: oUnique,
      };
    }
    return q;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    try {
      let pid = projectId;
      if (!pid) {
        const result = await createProject.mutateAsync({
          businessName: "My Business",
          contactName: "Customer",
          contactEmail: "customer@example.com",
          packageTier: "growth",
        });
        pid = result.id;
        onProjectCreated(pid);
      }
      const result = await submitQuestionnaire.mutateAsync({
        projectId: pid,
        questionnaire: buildPayload(),
      });
      if (result.needsCustomQuote) {
        toast.info("Questionnaire saved! Your project has been flagged for a custom quote. Our team will review your requirements and reach out within 1 business day.", { duration: 8000 });
      } else {
        toast.success("Questionnaire saved!");
      }
      onNext();
    } catch {
      toast.error("Failed to save questionnaire. Please try again.");
    }
  };

  const isSubmitting = createProject.isPending || submitQuestionnaire.isPending;

  // ── Inspiration/competitor array helpers ──
  const addInspiration = () => {
    if (inspirationSites.length < 3) setInspirationSites([...inspirationSites, { ...EMPTY_INSPIRATION }]);
  };
  const removeInspiration = (i: number) => setInspirationSites(inspirationSites.filter((_, idx) => idx !== i));
  const updateInspiration = (i: number, field: keyof InspirationSite, value: string) => {
    const updated = [...inspirationSites];
    updated[i] = { ...updated[i], [field]: value };
    setInspirationSites(updated);
  };
  const addCompetitor = () => {
    if (competitorSites.length < 3) setCompetitorSites([...competitorSites, { ...EMPTY_COMPETITOR }]);
  };
  const removeCompetitor = (i: number) => setCompetitorSites(competitorSites.filter((_, idx) => idx !== i));
  const updateCompetitor = (i: number, field: keyof CompetitorSite, value: string) => {
    const updated = [...competitorSites];
    updated[i] = { ...updated[i], [field]: value };
    setCompetitorSites(updated);
  };

  // ── Step validation ──
  const canAdvance = (s: number): boolean => {
    if (s === 1) return !!websiteType;
    if (s === 2) return !!brandTone;
    return true;
  };

  const goNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // ── Render ──
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[#2D5A3D] mb-2">Tell Us About Your Brand</h2>
        <p className="text-gray-600">
          Help us understand your vision so we can design a website that truly represents your business.
        </p>
      </div>

      {/* AI Assistant Toggle */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowAiChat(!showAiChat)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border-2 ${
            showAiChat
              ? "bg-[#C4704B] text-white border-[#C4704B] shadow-md"
              : "bg-white text-[#2D5A3D] border-[#2D5A3D]/20 hover:border-[#C4704B]/50 hover:bg-[#C4704B]/5"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {showAiChat ? "Switch to Form View" : "Not sure where to start? Chat with our AI assistant"}
        </button>
      </div>

      {aiAutoFilled && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            AI has pre-filled the form based on your conversation. Review and adjust anything below, then save.
          </div>
        </div>
      )}

      {/* Step progress bar */}
      <div className="text-center mb-3">
        <span className="text-xs font-medium text-[#2D5A3D]/60">
          Step {step} of 5 — {Math.round((step / 5) * 100)}% complete
        </span>
        <div className="mt-1.5 h-1.5 w-full max-w-xs mx-auto bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2D5A3D] rounded-full transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center mb-8 gap-1">
        {QUESTIONNAIRE_STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isPast = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  if (isPast || isActive) setStep(s.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#2D5A3D] text-white shadow-md"
                    : isPast
                    ? "bg-[#2D5A3D]/10 text-[#2D5A3D] cursor-pointer hover:bg-[#2D5A3D]/20"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 text-center">{s.id}</span>}
                <span className="hidden md:inline">{s.label}</span>
              </button>
              {i < QUESTIONNAIRE_STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-0.5 ${isPast ? "bg-[#2D5A3D]/30" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className={`grid gap-6 ${showAiChat ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* AI Chat Panel */}
        {showAiChat && (
          <Card className="border-[#C4704B]/20 bg-white overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-[#C4704B]/5 to-transparent">
              <CardTitle className="text-base font-serif text-[#C4704B] flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Design Assistant
              </CardTitle>
              <CardDescription className="text-xs">
                Just describe your business naturally — the AI will fill out the form for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AIChatBox
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={aiChat.isPending}
                placeholder="Tell me about your business..."
                height={520}
                emptyStateMessage="Hi! I'm your design assistant. Tell me about your business and I'll help you fill out this questionnaire."
                suggestedPrompts={[
                  "I run an auto detailing shop in Houston",
                  "I own a pizza restaurant with 2 locations",
                  "I'm a licensed plumber in the DFW area",
                  "I sell handmade jewelry online",
                ]}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Panel */}
        <Card className={`border-[#2D5A3D]/10 ${aiAutoFilled ? "ring-2 ring-green-300/50" : ""}`}>
          <CardContent className="p-6 md:p-8">
            {/* ── STEP 1: Website Type ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D5A3D] mb-1">What kind of website do you need?</h3>
                  <p className="text-sm text-gray-500">Select the option that best describes your business.</p>
                </div>
                <div className="grid gap-3">
                  {(Object.keys(WEBSITE_TYPE_LABELS) as WebsiteType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setWebsiteType(type)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        websiteType === type
                          ? "border-[#2D5A3D] bg-[#2D5A3D]/5 shadow-sm"
                          : "border-gray-200 hover:border-[#2D5A3D]/30 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          websiteType === type ? "bg-[#2D5A3D] text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {TYPE_ICONS[type]}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-medium ${websiteType === type ? "text-[#2D5A3D]" : "text-gray-800"}`}>
                          {WEBSITE_TYPE_LABELS[type]}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{WEBSITE_TYPE_DESCRIPTIONS[type]}</div>
                      </div>
                      {websiteType === type && (
                        <CheckCircle2 className="w-5 h-5 text-[#2D5A3D] shrink-0 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Brand & Audience ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D5A3D] mb-1">Brand Identity & Audience</h3>
                  <p className="text-sm text-gray-500">Tell us about your brand's personality and who you serve.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">What tone best describes your brand?</Label>
                  <Select value={brandTone} onValueChange={(v) => setBrandTone(v as BrandTone)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Trustworthy</SelectItem>
                      <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                      <SelectItem value="bold">Bold & Energetic</SelectItem>
                      <SelectItem value="elegant">Elegant & Refined</SelectItem>
                      <SelectItem value="playful">Playful & Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">Brand colors</Label>
                  <Input
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    placeholder="e.g. #2D5A3D, #C4704B — or leave blank and we'll suggest some"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">Who is your target audience?</Label>
                  <Textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Describe your ideal customers — age range, interests, location, income level, etc."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">Who will write the website content?</Label>
                  <Select value={contentPreference} onValueChange={(v) => setContentPreference(v as ContentPreference)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="we_write">MiniMorph writes everything</SelectItem>
                      <SelectItem value="customer_provides">I'll provide all content</SelectItem>
                      <SelectItem value="mix">A mix — I'll provide some, you write the rest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── STEP 3: Inspiration & Competitors ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D5A3D] mb-1">Inspiration & Competitors</h3>
                  <p className="text-sm text-gray-500">
                    Show us websites you love and competitors you want to outperform. This helps us understand your taste and goals.
                  </p>
                </div>

                {/* Inspiration sites */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2D5A3D] font-medium text-base">Websites You Love</Label>
                    {inspirationSites.length < 3 && (
                      <Button variant="ghost" size="sm" onClick={addInspiration} className="text-[#C4704B] hover:text-[#C4704B]/80">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  {inspirationSites.map((site, i) => (
                    <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                        <Input
                          value={site.url}
                          onChange={(e) => updateInspiration(i, "url", e.target.value)}
                          placeholder="https://example.com"
                          className="text-sm"
                        />
                        {inspirationSites.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeInspiration(i)} className="text-red-400 hover:text-red-600 shrink-0 px-2">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">What do you like about it?</Label>
                          <Textarea
                            value={site.whatYouLike}
                            onChange={(e) => updateInspiration(i, "whatYouLike", e.target.value)}
                            placeholder="Clean layout, great photos, easy navigation..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">What do you dislike about it?</Label>
                          <Textarea
                            value={site.whatYouDislike}
                            onChange={(e) => updateInspiration(i, "whatYouDislike", e.target.value)}
                            placeholder="Too cluttered, slow, hard to find info..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Competitor sites */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#2D5A3D] font-medium text-base">Competitor Websites</Label>
                    {competitorSites.length < 3 && (
                      <Button variant="ghost" size="sm" onClick={addCompetitor} className="text-[#C4704B] hover:text-[#C4704B]/80">
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                  {competitorSites.map((site, i) => (
                    <div key={i} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                        <Input
                          value={site.url}
                          onChange={(e) => updateCompetitor(i, "url", e.target.value)}
                          placeholder="https://competitor.com"
                          className="text-sm"
                        />
                        {competitorSites.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeCompetitor(i)} className="text-red-400 hover:text-red-600 shrink-0 px-2">
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">What do you want to beat them at?</Label>
                          <Textarea
                            value={site.whatYouWantToBeat}
                            onChange={(e) => updateCompetitor(i, "whatYouWantToBeat", e.target.value)}
                            placeholder="Better design, faster load times, more trust..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Features they have that you wish you had?</Label>
                          <Textarea
                            value={site.featuresYouWish}
                            onChange={(e) => updateCompetitor(i, "featuresYouWish", e.target.value)}
                            placeholder="Online booking, live chat, customer reviews..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Industry-Specific ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D5A3D] mb-1">
                    {websiteType ? `${WEBSITE_TYPE_LABELS[websiteType]} Details` : "Industry Details"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    These questions help us tailor your website to your specific industry.
                  </p>
                </div>

                {/* Service Business */}
                {websiteType === "service_business" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Service area</Label>
                      <Input value={sbServiceArea} onChange={(e) => setSbServiceArea(e.target.value)} placeholder="e.g. Greater Houston, TX" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Services offered</Label>
                      <Textarea value={sbServicesOffered} onChange={(e) => setSbServicesOffered(e.target.value)} placeholder="List your main services, e.g. Interior detailing, Exterior wash, Ceramic coating..." rows={2} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-[#2D5A3D] font-medium">Need online booking?</Label>
                        <p className="text-xs text-gray-500">Allow customers to book appointments on your website</p>
                      </div>
                      <Switch checked={sbHasBooking} onCheckedChange={setSbHasBooking} />
                    </div>
                    {sbHasBooking && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#2D5A3D]/20">
                        <Label className="text-[#2D5A3D] font-medium">Current booking method</Label>
                        <Select value={sbBookingMethod} onValueChange={setSbBookingMethod}>
                          <SelectTrigger><SelectValue placeholder="How do customers book now?" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Phone calls</SelectItem>
                            <SelectItem value="walk_in">Walk-ins only</SelectItem>
                            <SelectItem value="third_party">Third-party app (Calendly, Square, etc.)</SelectItem>
                            <SelectItem value="social_media">Social media DMs</SelectItem>
                            <SelectItem value="none">No system yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-[#2D5A3D] font-medium">Licensed or certified?</Label>
                        <p className="text-xs text-gray-500">Display credentials on your website for trust</p>
                      </div>
                      <Switch checked={sbLicensed} onCheckedChange={setSbLicensed} />
                    </div>
                    {sbLicensed && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#2D5A3D]/20">
                        <Label className="text-[#2D5A3D] font-medium">License/certification details</Label>
                        <Input value={sbLicenseDetails} onChange={(e) => setSbLicenseDetails(e.target.value)} placeholder="e.g. IDA Certified Detailer, State License #12345" />
                      </div>
                    )}
                  </div>
                )}

                {/* Restaurant */}
                {websiteType === "restaurant" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Cuisine type</Label>
                      <Input value={rCuisineType} onChange={(e) => setRCuisineType(e.target.value)} placeholder="e.g. Italian, Mexican, BBQ, Fusion" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-[#2D5A3D] font-medium">Physical location?</Label>
                        <p className="text-xs text-gray-500">Do you have a dine-in location?</p>
                      </div>
                      <Switch checked={rHasLocation} onCheckedChange={setRHasLocation} />
                    </div>
                    {rHasLocation && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#2D5A3D]/20">
                        <Label className="text-[#2D5A3D] font-medium">Number of locations</Label>
                        <Input type="number" min={1} value={rLocationCount} onChange={(e) => setRLocationCount(Number(e.target.value) || 1)} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Operating hours</Label>
                      <Input value={rHours} onChange={(e) => setRHours(e.target.value)} placeholder="e.g. Mon-Sat 11am-10pm, Sun 12pm-8pm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <Label className="text-sm text-[#2D5A3D]">Online menu</Label>
                        <Switch checked={rNeedsMenu} onCheckedChange={setRNeedsMenu} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <Label className="text-sm text-[#2D5A3D]">Online ordering</Label>
                        <Switch checked={rNeedsOrdering} onCheckedChange={setRNeedsOrdering} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <Label className="text-sm text-[#2D5A3D]">Reservations</Label>
                        <Switch checked={rNeedsReservations} onCheckedChange={setRNeedsReservations} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Delivery partners</Label>
                      <Input value={rDeliveryPartners} onChange={(e) => setRDeliveryPartners(e.target.value)} placeholder="e.g. DoorDash, UberEats, Grubhub — or leave blank" />
                    </div>
                  </div>
                )}

                {/* Contractor */}
                {websiteType === "contractor" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Trade type</Label>
                      <Input value={cTradeType} onChange={(e) => setCTradeType(e.target.value)} placeholder="e.g. Plumbing, HVAC, Roofing, General Contractor" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Service area</Label>
                      <Input value={cServiceArea} onChange={(e) => setCServiceArea(e.target.value)} placeholder="e.g. Dallas-Fort Worth metro area" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-[#2D5A3D] font-medium">Licensed or certified?</Label>
                        <p className="text-xs text-gray-500">Display your license for credibility</p>
                      </div>
                      <Switch checked={cLicensed} onCheckedChange={setCLicensed} />
                    </div>
                    {cLicensed && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#2D5A3D]/20">
                        <Label className="text-[#2D5A3D] font-medium">License number</Label>
                        <Input value={cLicenseNumber} onChange={(e) => setCLicenseNumber(e.target.value)} placeholder="e.g. TACLA12345C" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div>
                          <Label className="text-sm text-[#2D5A3D]">Quote request form</Label>
                          <p className="text-xs text-gray-400">Let customers request quotes online</p>
                        </div>
                        <Switch checked={cNeedsQuoteForm} onCheckedChange={setCNeedsQuoteForm} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div>
                          <Label className="text-sm text-[#2D5A3D]">Before/after gallery</Label>
                          <p className="text-xs text-gray-400">Showcase your work with photos</p>
                        </div>
                        <Switch checked={cNeedsGallery} onCheckedChange={setCNeedsGallery} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Insurance info</Label>
                      <Input value={cInsurance} onChange={(e) => setCInsurance(e.target.value)} placeholder="e.g. Fully insured and bonded — or leave blank" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-[#2D5A3D] font-medium">24/7 emergency service?</Label>
                        <p className="text-xs text-gray-500">Highlight emergency availability on your site</p>
                      </div>
                      <Switch checked={cEmergency} onCheckedChange={setCEmergency} />
                    </div>
                  </div>
                )}

                {/* Ecommerce */}
                {websiteType === "ecommerce" && (
                  <div className="space-y-4">
                    {/* Ecommerce guardrail banner */}
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800">
                        <strong>Ecommerce projects require a custom Commerce quote.</strong> Please fill out the details below so we can scope your project accurately. Our team will follow up with tailored pricing.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">How many products?</Label>
                      <Select value={eProductCount} onValueChange={setEProductCount}>
                        <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1 – 10 products</SelectItem>
                          <SelectItem value="11-25">11 – 25 products</SelectItem>
                          <SelectItem value="26-50">26 – 50 products</SelectItem>
                          <SelectItem value="51-100">51 – 100 products</SelectItem>
                          <SelectItem value="100+">100+ products</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Product categories</Label>
                      <Input value={eCategories} onChange={(e) => setECategories(e.target.value)} placeholder="e.g. Jewelry, Clothing, Electronics, Home Decor" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Existing platform</Label>
                      <Select value={eExistingPlatform} onValueChange={setEExistingPlatform}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">No existing store</SelectItem>
                          <SelectItem value="Shopify">Shopify</SelectItem>
                          <SelectItem value="WooCommerce">WooCommerce</SelectItem>
                          <SelectItem value="Etsy">Etsy</SelectItem>
                          <SelectItem value="Amazon">Amazon</SelectItem>
                          <SelectItem value="BigCommerce">BigCommerce</SelectItem>
                          <SelectItem value="Squarespace">Squarespace</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {eExistingPlatform !== "None" && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div>
                          <Label className="text-amber-800 font-medium">Need migration from {eExistingPlatform}?</Label>
                          <p className="text-xs text-amber-600">We can transfer your products and data</p>
                        </div>
                        <Switch checked={eNeedsMigration} onCheckedChange={setENeedsMigration} />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div>
                          <Label className="text-sm text-[#2D5A3D]">Shipping needed</Label>
                          <p className="text-xs text-gray-400">Physical products?</p>
                        </div>
                        <Switch checked={eNeedsShipping} onCheckedChange={setENeedsShipping} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div>
                          <Label className="text-sm text-[#2D5A3D]">Inventory system</Label>
                          <p className="text-xs text-gray-400">Track stock levels?</p>
                        </div>
                        <Switch checked={eHasInventory} onCheckedChange={setEHasInventory} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div>
                          <Label className="text-sm text-[#2D5A3D]">Subscriptions</Label>
                          <p className="text-xs text-gray-400">Recurring orders?</p>
                        </div>
                        <Switch checked={eNeedsSubscriptions} onCheckedChange={setENeedsSubscriptions} />
                      </div>
                    </div>
                    {eNeedsShipping && (
                      <div className="space-y-2 pl-4 border-l-2 border-[#2D5A3D]/20">
                        <Label className="text-[#2D5A3D] font-medium">Shipping regions</Label>
                        <Select value={eShippingRegions} onValueChange={setEShippingRegions}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US only">US only</SelectItem>
                            <SelectItem value="North America">North America</SelectItem>
                            <SelectItem value="Worldwide">Worldwide</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Payment methods</Label>
                      <Input value={ePaymentMethods} onChange={(e) => setEPaymentMethods(e.target.value)} placeholder="e.g. Credit card, PayPal, Apple Pay" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Tax handling</Label>
                      <Select value={eTaxHandling} onValueChange={setETaxHandling}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manual">I'll handle taxes manually</SelectItem>
                          <SelectItem value="Automated">Automated (TaxJar, Avalara, etc.)</SelectItem>
                          <SelectItem value="Not sure">Not sure yet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Product variants */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-sm text-[#2D5A3D]">Product variants</Label>
                        <p className="text-xs text-gray-400">Size, color, material options?</p>
                      </div>
                      <Switch checked={eHasVariants} onCheckedChange={setEHasVariants} />
                    </div>
                    {eHasVariants && (
                      <div className="space-y-2">
                        <Label className="text-[#2D5A3D] font-medium">Variant complexity</Label>
                        <Select value={eVariantComplexity} onValueChange={setEVariantComplexity}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple (1-2 options per product)</SelectItem>
                            <SelectItem value="moderate">Moderate (3-5 options)</SelectItem>
                            <SelectItem value="complex">Complex (6+ options)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Product photos status */}
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Product photos</Label>
                      <Select value={ePhotosStatus} onValueChange={setEPhotosStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="have_all">I have all product photos ready</SelectItem>
                          <SelectItem value="have_some">I have some, need help with the rest</SelectItem>
                          <SelectItem value="need_all">I need all product photos taken/created</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Product descriptions status */}
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Product descriptions</Label>
                      <Select value={eDescriptionsStatus} onValueChange={setEDescriptionsStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="have_all">I have all descriptions written</SelectItem>
                          <SelectItem value="have_some">I have some, need help with the rest</SelectItem>
                          <SelectItem value="need_written">I need all descriptions written</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Abandoned cart interest */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div>
                        <Label className="text-sm text-[#2D5A3D]">Abandoned cart emails</Label>
                        <p className="text-xs text-gray-400">Auto-email customers who leave items in cart?</p>
                      </div>
                      <Switch checked={eAbandonedCart} onCheckedChange={setEAbandonedCart} />
                    </div>
                    {/* Return policy */}
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Return / refund policy</Label>
                      <Textarea value={eReturnPolicy} onChange={(e) => setEReturnPolicy(e.target.value)} placeholder="Describe your return/refund policy, or leave blank if you need help creating one" rows={2} />
                    </div>
                  </div>
                )}

                {/* Other */}
                {websiteType === "other" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">What industry are you in?</Label>
                      <Input value={oIndustry} onChange={(e) => setOIndustry(e.target.value)} placeholder="e.g. Healthcare, Education, Real Estate, Nonprofit" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">Describe your business</Label>
                      <Textarea value={oDescription} onChange={(e) => setODescription(e.target.value)} placeholder="Tell us what your business does and what you need from your website..." rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#2D5A3D] font-medium">What makes your business unique?</Label>
                      <Textarea value={oUnique} onChange={(e) => setOUnique(e.target.value)} placeholder="Any special requirements, unique selling points, or things we should know..." rows={3} />
                    </div>
                  </div>
                )}

                {/* No type selected fallback */}
                {!websiteType && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Please go back to Step 1 and select your website type first.</p>
                    <Button variant="outline" onClick={() => setStep(1)} className="mt-3">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Go to Step 1
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Features & Special Requests ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D5A3D] mb-1">Features & Special Requests</h3>
                  <p className="text-sm text-gray-500">
                    Almost done! Tell us about must-have features and anything else on your mind.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">Must-have features</Label>
                  <Textarea
                    value={mustHaveFeatures}
                    onChange={(e) => setMustHaveFeatures(e.target.value)}
                    placeholder="e.g. Contact form, Photo gallery, Online booking, Menu page, Live chat, Customer reviews, Blog..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-400">Separate with commas</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5A3D] font-medium">Anything else we should know?</Label>
                  <Textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Special requirements, deadlines, integrations, accessibility needs, or anything else on your mind..."
                    rows={4}
                  />
                </div>

                {/* Summary preview */}
                <div className="p-4 rounded-xl bg-[#2D5A3D]/5 border border-[#2D5A3D]/10">
                  <h4 className="text-sm font-semibold text-[#2D5A3D] mb-2">Quick Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-medium">Type:</span> {websiteType ? WEBSITE_TYPE_LABELS[websiteType] : "Not selected"}</div>
                    <div><span className="font-medium">Tone:</span> {brandTone}</div>
                    <div><span className="font-medium">Content:</span> {contentPreference.replace(/_/g, " ")}</div>
                    <div><span className="font-medium">Inspiration:</span> {inspirationSites.filter(s => s.url).length} site(s)</div>
                    <div><span className="font-medium">Competitors:</span> {competitorSites.filter(s => s.url).length} site(s)</div>
                    {targetAudience && <div className="col-span-2"><span className="font-medium">Audience:</span> {targetAudience.slice(0, 80)}{targetAudience.length > 80 ? "..." : ""}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button variant="outline" onClick={goBack} className="border-[#2D5A3D]/20 text-[#2D5A3D]">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <div />
              )}
              {step < 5 ? (
                <Button
                  onClick={goNext}
                  disabled={!canAdvance(step)}
                  className="bg-[#2D5A3D] hover:bg-[#234A31] text-white"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#2D5A3D] hover:bg-[#234A31] text-white h-12 px-8 text-base"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-5 h-5 mr-2" />
                  )}
                  Save & Continue to Asset Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
