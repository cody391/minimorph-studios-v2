import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Upload,
  Globe,
  FileText,
  Palette,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ClipboardList,
  Rocket,
  MessageSquare,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { AIChatBox } from "@/components/AIChatBox";
import { QuestionnaireWizard } from "@/components/QuestionnaireWizard";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
type OnboardingStage =
  | "questionnaire"
  | "assets_upload"
  | "domain"
  | "review_status";

const STAGE_LABELS: Record<OnboardingStage, string> = {
  questionnaire: "Brand Questionnaire",
  assets_upload: "Upload Your Assets",
  domain: "Domain Setup",
  review_status: "Project Status",
};

const STAGE_ICONS: Record<OnboardingStage, React.ReactNode> = {
  questionnaire: <ClipboardList className="w-5 h-5" />,
  assets_upload: <Upload className="w-5 h-5" />,
  domain: <Globe className="w-5 h-5" />,
  review_status: <Rocket className="w-5 h-5" />,
};

const PROJECT_STAGES = [
  "intake",
  "questionnaire",
  "assets_upload",
  "design",
  "review",
  "revisions",
  "final_approval",
  "launch",
  "complete",
] as const;

const STAGE_DISPLAY: Record<string, { label: string; color: string }> = {
  intake: { label: "Getting Started", color: "bg-gray-200 text-gray-700" },
  questionnaire: { label: "Questionnaire", color: "bg-amber-100 text-amber-800" },
  assets_upload: { label: "Uploading Assets", color: "bg-blue-100 text-blue-800" },
  design: { label: "Designing", color: "bg-purple-100 text-purple-800" },
  review: { label: "Ready for Review", color: "bg-emerald-100 text-emerald-800" },
  revisions: { label: "Revisions", color: "bg-orange-100 text-orange-800" },
  final_approval: { label: "Final Approval", color: "bg-teal-100 text-teal-800" },
  launch: { label: "Launching", color: "bg-green-100 text-green-800" },
  complete: { label: "Live!", color: "bg-green-200 text-green-900" },
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const [currentStage, setCurrentStage] = useState<OnboardingStage>("questionnaire");
  const [projectId, setProjectId] = useState<number | null>(null);

  // If user has a project, load it
  const projectQuery = trpc.onboarding.myProject.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF6F1" }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#2D5A3D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF6F1" }}>
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif text-[#2D5A3D]">Welcome to Your Project</CardTitle>
            <CardDescription>Sign in to access your onboarding portal and track your website project.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a href="/login">
              <Button className="bg-[#2D5A3D] hover:bg-[#234A31] text-white">
                Sign In to Continue
              </Button>
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Don't have a project yet?{" "}
              <Link href="/get-started" className="text-[#C4704B] hover:underline">
                Get started here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stages: OnboardingStage[] = ["questionnaire", "assets_upload", "domain", "review_status"];

  return (
    <div className="min-h-screen" style={{ background: "#FAF6F1" }}>
      {/* Header */}
      <header className="border-b border-[#2D5A3D]/10 bg-white/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-[#2D5A3D] flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <span className="font-serif text-xl text-[#2D5A3D]">MiniMorph</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Welcome, {user.name || "there"}</span>
            <Badge variant="outline" className="border-[#2D5A3D]/30 text-[#2D5A3D]">
              Onboarding
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 gap-1">
          {stages.map((stage, i) => {
            const isActive = stage === currentStage;
            const isPast = stages.indexOf(currentStage) > i;
            return (
              <div key={stage} className="flex items-center">
                <button
                  onClick={() => setCurrentStage(stage)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#2D5A3D] text-white shadow-md"
                      : isPast
                      ? "bg-[#2D5A3D]/10 text-[#2D5A3D]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : STAGE_ICONS[stage]}
                  <span className="hidden sm:inline">{STAGE_LABELS[stage]}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < stages.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${isPast ? "bg-[#2D5A3D]/30" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Stage Content */}
        {currentStage === "questionnaire" && (
          <QuestionnaireWizard
            projectId={projectId}
            onNext={() => setCurrentStage("assets_upload")}
            onProjectCreated={setProjectId}
          />
        )}
        {currentStage === "assets_upload" && (
          <AssetUploadStep
            projectId={projectId}
            onNext={() => setCurrentStage("domain")}
            onBack={() => setCurrentStage("questionnaire")}
          />
        )}
        {currentStage === "domain" && (
          <DomainStep
            projectId={projectId}
            onNext={() => setCurrentStage("review_status")}
            onBack={() => setCurrentStage("assets_upload")}
          />
        )}
        {currentStage === "review_status" && (
          <ProjectStatusStep
            projectId={projectId}
            project={projectQuery.data}
            onBack={() => setCurrentStage("domain")}
          />
        )}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════
   STEP 1: QUESTIONNAIRE (moved to QuestionnaireWizard.tsx)
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   STEP 2: ASSET UPLOAD
   ═══════════════════════════════════════════════════════ */
function AssetUploadStep({
  projectId,
  onNext,
  onBack,
}: {
  projectId: number | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("logo");

  const assetsQuery = trpc.onboarding.listAssets.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const uploadMutation = trpc.onboarding.uploadAsset.useMutation();
  const deleteMutation = trpc.onboarding.deleteAsset.useMutation();

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!projectId || !e.target.files?.length) return;
      setUploading(true);

      try {
        for (const file of Array.from(e.target.files)) {
          // Check file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} is too large. Max 5MB per file.`);
            continue;
          }

          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
          );

          await uploadMutation.mutateAsync({
            projectId,
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type,
            category: selectedCategory as any,
          });
        }
        toast.success("Files uploaded!");
        assetsQuery.refetch();
      } catch (err) {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [projectId, selectedCategory, uploadMutation, assetsQuery]
  );

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("File removed");
      assetsQuery.refetch();
    } catch {
      toast.error("Failed to remove file");
    }
  };

  const assets = assetsQuery.data || [];

  const categoryIcons: Record<string, React.ReactNode> = {
    logo: <Palette className="w-4 h-4" />,
    photo: <ImageIcon className="w-4 h-4" />,
    brand_guidelines: <FileText className="w-4 h-4" />,
    copy: <FileText className="w-4 h-4" />,
    document: <FileText className="w-4 h-4" />,
    other: <FileText className="w-4 h-4" />,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[#2D5A3D] mb-2">Upload Your Assets</h2>
        <p className="text-gray-600">
          Share your logo, photos, brand guidelines, and any content you'd like on your website.
          Don't worry if you don't have everything — we can work with what you have.
        </p>
      </div>

      <Card className="border-[#2D5A3D]/10 mb-6">
        <CardContent className="p-8">
          {/* Category selector */}
          <div className="mb-6">
            <Label className="text-[#2D5A3D] font-medium mb-2 block">What are you uploading?</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "logo", label: "Logo" },
                { value: "photo", label: "Photos" },
                { value: "brand_guidelines", label: "Brand Guidelines" },
                { value: "copy", label: "Written Content" },
                { value: "document", label: "Documents" },
                { value: "other", label: "Other" },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-[#2D5A3D] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {categoryIcons[cat.value]}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <label className="block border-2 border-dashed border-[#2D5A3D]/20 rounded-xl p-10 text-center cursor-pointer hover:border-[#2D5A3D]/40 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
              disabled={!projectId || uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#2D5A3D]" />
                <p className="text-[#2D5A3D] font-medium">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-[#2D5A3D]/40" />
                <p className="text-gray-600">
                  <span className="text-[#2D5A3D] font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-400">Images, PDFs, and documents up to 5MB each</p>
              </div>
            )}
          </label>

          {!projectId && (
            <p className="text-sm text-amber-600 mt-3 text-center">
              Please complete the questionnaire first to start uploading assets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Uploaded files list */}
      {assets.length > 0 && (
        <Card className="border-[#2D5A3D]/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#2D5A3D]">Uploaded Files ({assets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assets.map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {categoryIcons[asset.category] || <FileText className="w-4 h-4" />}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{asset.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {asset.category.replace("_", " ")} •{" "}
                        {asset.fileSize ? `${(asset.fileSize / 1024).toFixed(1)} KB` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-[#2D5A3D]/20 text-[#2D5A3D]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} className="bg-[#2D5A3D] hover:bg-[#234A31] text-white">
          Continue to Domain Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 3: DOMAIN SETUP
   ═══════════════════════════════════════════════════════ */
function DomainStep({
  projectId,
  onNext,
  onBack,
}: {
  projectId: number | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const [domainOption, setDomainOption] = useState<string>("undecided");
  const [existingDomain, setExistingDomain] = useState("");
  const [domainRegistrar, setDomainRegistrar] = useState("");
  const [domainNotes, setDomainNotes] = useState("");

  const setDomainMutation = trpc.onboarding.setDomain.useMutation();

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error("Please complete the questionnaire first.");
      return;
    }

    try {
      await setDomainMutation.mutateAsync({
        projectId,
        domainOption: domainOption as any,
        existingDomain: domainOption === "existing" ? existingDomain : undefined,
        domainRegistrar: domainOption === "existing" ? domainRegistrar : undefined,
        domainNotes,
      });
      toast.success("Domain preferences saved!");
      onNext();
    } catch {
      toast.error("Failed to save domain preferences.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[#2D5A3D] mb-2">Domain Setup</h2>
        <p className="text-gray-600">
          Already have a domain? We'll connect it. Need a new one? We'll help you choose and register it.
        </p>
      </div>

      <Card className="border-[#2D5A3D]/10">
        <CardContent className="p-8 space-y-6">
          {/* Domain option selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                value: "existing",
                title: "I Have a Domain",
                desc: "I already own a domain and want to use it",
                icon: <Globe className="w-6 h-6" />,
              },
              {
                value: "new",
                title: "I Need a New Domain",
                desc: "Help me choose and register a new domain",
                icon: <Rocket className="w-6 h-6" />,
              },
              {
                value: "undecided",
                title: "Not Sure Yet",
                desc: "I'll decide later — let's focus on design first",
                icon: <MessageSquare className="w-6 h-6" />,
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDomainOption(option.value)}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  domainOption === option.value
                    ? "border-[#2D5A3D] bg-[#2D5A3D]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`mb-3 ${
                    domainOption === option.value ? "text-[#2D5A3D]" : "text-gray-400"
                  }`}
                >
                  {option.icon}
                </div>
                <h4 className="font-medium text-gray-800 mb-1">{option.title}</h4>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </button>
            ))}
          </div>

          {/* Existing domain fields */}
          {domainOption === "existing" && (
            <div className="space-y-4 p-5 bg-[#2D5A3D]/5 rounded-xl">
              <div className="space-y-2">
                <Label className="text-[#2D5A3D] font-medium">Your domain name</Label>
                <Input
                  value={existingDomain}
                  onChange={(e) => setExistingDomain(e.target.value)}
                  placeholder="e.g. mybusiness.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#2D5A3D] font-medium">Where is it registered? (optional)</Label>
                <Input
                  value={domainRegistrar}
                  onChange={(e) => setDomainRegistrar(e.target.value)}
                  placeholder="e.g. GoDaddy, Namecheap, Google Domains"
                />
              </div>
              <p className="text-sm text-gray-500">
                We'll send you simple instructions to point your domain to your new website. No technical knowledge required.
              </p>
            </div>
          )}

          {domainOption === "new" && (
            <div className="p-5 bg-[#2D5A3D]/5 rounded-xl space-y-4">
              <p className="text-gray-700">
                We'll help you find the perfect domain name for your business. After your website design is approved,
                we'll present you with available options and handle the registration.
              </p>
              <div className="bg-white rounded-lg p-4 border border-[#2D5A3D]/10">
                <h4 className="font-medium text-[#2D5A3D] mb-3 text-sm">Domain Pricing</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">.com domain</span>
                    <div className="text-right">
                      <span className="font-medium text-[#2D5A3D]">FREE first year</span>
                      <span className="text-gray-400 text-xs ml-1">(with Growth or Premium)</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Renewal (year 2+)</span>
                    <span className="text-gray-700">$15/year</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Starter package</span>
                    <span className="text-gray-700">$15/year from day one</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">We handle registration, DNS setup, SSL certificates, and renewals. No technical knowledge required.</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional notes */}
          <div className="space-y-2">
            <Label className="text-[#2D5A3D] font-medium">Any notes about your domain? (optional)</Label>
            <Textarea
              value={domainNotes}
              onChange={(e) => setDomainNotes(e.target.value)}
              placeholder="e.g. I also have email set up on this domain, I need specific subdomains, etc."
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack} className="border-[#2D5A3D]/20 text-[#2D5A3D]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={setDomainMutation.isPending}
              className="bg-[#2D5A3D] hover:bg-[#234A31] text-white"
            >
              {setDomainMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Save & View Project Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STEP 4: PROJECT STATUS TRACKER
   ═══════════════════════════════════════════════════════ */
function ProjectStatusStep({
  projectId,
  project,
  onBack,
}: {
  projectId: number | null;
  project: any;
  onBack: () => void;
}) {
  const feedbackMutation = trpc.onboarding.submitFeedback.useMutation();
  const approveMutation = trpc.onboarding.approveLaunch.useMutation();
  const [feedbackText, setFeedbackText] = useState("");

  const currentStageIndex = project
    ? PROJECT_STAGES.indexOf(project.stage)
    : 0;

  const handleFeedback = async () => {
    if (!projectId || !feedbackText.trim()) return;
    try {
      await feedbackMutation.mutateAsync({
        projectId,
        feedbackNotes: feedbackText,
      });
      toast.success("Feedback submitted! We'll review and make revisions.");
      setFeedbackText("");
    } catch {
      toast.error("Failed to submit feedback.");
    }
  };

  const handleApprove = async () => {
    if (!projectId) return;
    try {
      await approveMutation.mutateAsync({ projectId });
      toast.success("Approved for launch! We'll have your site live soon.");
    } catch {
      toast.error("Failed to approve.");
    }
  };

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#2D5A3D] mb-2">Your Project Status</h2>
          <p className="text-gray-600">
            Complete the previous steps to start tracking your project.
          </p>
        </div>
        <Card className="border-[#2D5A3D]/10 p-10">
          <div className="flex flex-col items-center gap-4">
            <Rocket className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500">No project found. Complete the questionnaire to get started.</p>
            <Button variant="outline" onClick={onBack} className="border-[#2D5A3D]/20 text-[#2D5A3D]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-[#2D5A3D] mb-2">Your Project Status</h2>
        <p className="text-gray-600">
          Track the progress of your website from design through launch.
        </p>
      </div>

      {/* Progress timeline */}
      <Card className="border-[#2D5A3D]/10 mb-6">
        <CardContent className="p-8">
          <div className="space-y-4">
            {PROJECT_STAGES.map((stage, i) => {
              const isComplete = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const display = STAGE_DISPLAY[stage];
              return (
                <div key={stage} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isComplete
                        ? "bg-[#2D5A3D] text-white"
                        : isCurrent
                        ? "bg-[#C4704B] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${
                          isCurrent ? "text-[#C4704B]" : isComplete ? "text-[#2D5A3D]" : "text-gray-400"
                        }`}
                      >
                        {display.label}
                      </span>
                      {isCurrent && (
                        <Badge className={display.color}>Current</Badge>
                      )}
                    </div>
                  </div>
                  {i < PROJECT_STAGES.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 h-0.5 ${
                        isComplete ? "bg-[#2D5A3D]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Design review section (shown when in review or revisions stage) */}
      {(project.stage === "review" || project.stage === "revisions") && (
        <Card className="border-[#2D5A3D]/10 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#2D5A3D]">Review Your Design</CardTitle>
            <CardDescription>
              {project.designMockupUrl
                ? "Your design mockup is ready for review. Share your feedback below."
                : "Your design is being prepared. You'll be able to review it here soon."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.designMockupUrl && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={project.designMockupUrl}
                  alt="Design mockup"
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[#2D5A3D] font-medium">Your Feedback</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think — what you love, what you'd change, any specific requests..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleFeedback}
                disabled={!feedbackText.trim() || feedbackMutation.isPending}
                variant="outline"
                className="border-[#C4704B] text-[#C4704B] hover:bg-[#C4704B]/10"
              >
                {feedbackMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Request Changes
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="bg-[#2D5A3D] hover:bg-[#234A31] text-white"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve for Launch
              </Button>
            </div>

            {project.revisionsCount > 0 && (
              <p className="text-sm text-gray-500">
                Revisions so far: {project.revisionsCount}
              </p>
            )}
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-sans">
                <strong>Revision Policy:</strong> Your package includes <strong>3 rounds of revisions</strong> at no extra cost.
                {project.revisionsCount >= 3
                  ? " You've used all included revisions. Additional rounds are $149 each."
                  : ` You have ${3 - (project.revisionsCount || 0)} revision(s) remaining.`}
                {" "}Additional revision rounds are available at $149 per round.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live URL (shown when launched) */}
      {(project.stage === "launch" || project.stage === "complete") && project.liveUrl && (
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-serif text-green-800 mb-2">Your Website is Live!</h3>
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2D5A3D] font-medium hover:underline text-lg"
            >
              {project.liveUrl}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-[#2D5A3D]/20 text-[#2D5A3D]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Link href="/portal">
          <Button className="bg-[#C4704B] hover:bg-[#B35F3A] text-white">
            Go to Customer Portal
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
