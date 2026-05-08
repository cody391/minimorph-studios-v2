import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ClipboardList,
  Upload,
  Palette,
  Eye,
  MessageSquare,
  Rocket,
  CheckCircle2,
  Loader2,
  Globe,
  FileText,
  ArrowUpRight,
  AlertTriangle,
  ShieldAlert,
  Zap,
  ExternalLink,
  CheckCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Monitor,
} from "lucide-react";
import { FLAG_DESCRIPTIONS } from "@shared/quoteEngine";

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  intake: { label: "Intake", color: "badge-neutral", icon: <ClipboardList className="w-3 h-3" /> },
  questionnaire: { label: "Questionnaire", color: "bg-amber-100 text-amber-800", icon: <ClipboardList className="w-3 h-3" /> },
  assets_upload: { label: "Assets Upload", color: "bg-blue-100 text-blue-800", icon: <Upload className="w-3 h-3" /> },
  design: { label: "Designing", color: "bg-purple-100 text-purple-800", icon: <Palette className="w-3 h-3" /> },
  review: { label: "Review", color: "bg-emerald-100 text-emerald-800", icon: <Eye className="w-3 h-3" /> },
  revisions: { label: "Revisions", color: "bg-orange-100 text-orange-800", icon: <MessageSquare className="w-3 h-3" /> },
  final_approval: { label: "Final Approval", color: "bg-teal-100 text-teal-800", icon: <CheckCircle2 className="w-3 h-3" /> },
  launch: { label: "Launching", color: "bg-green-100 text-green-800", icon: <Rocket className="w-3 h-3" /> },
  complete: { label: "Complete", color: "bg-green-200 text-green-900", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const ALL_STAGES = ["intake", "questionnaire", "assets_upload", "design", "review", "revisions", "final_approval", "launch", "complete"] as const;

const MUST_HAVE_FEATURES = [
  "Contact / quote form",
  "Online booking",
  "Photo gallery",
  "Reviews / testimonials",
  "Google Maps embed",
  "Blog / articles",
  "Newsletter signup",
  "Online store",
  "AI chat widget",
  "Instagram feed",
  "Lead capture with SMS alert",
];

const EMPTY_FORM = {
  businessName: "",
  contactName: "",
  contactEmail: "",
  packageTier: "starter" as "starter" | "growth" | "premium",
  websiteType: "service_business" as "service_business" | "restaurant" | "contractor" | "ecommerce" | "other",
  brandTone: "professional" as "professional" | "friendly" | "bold" | "elegant" | "playful",
  brandColors: "",
  targetAudience: "",
  specialRequests: "",
  mustHaveFeatures: [] as string[],
};

export default function OnboardingProjects() {
  const [filterStage, setFilterStage] = useState<string>("all");
  const [markLiveForms, setMarkLiveForms] = useState<Record<number, { open: boolean; liveUrl: string; domainName: string }>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});
  const [newBuildOpen, setNewBuildOpen] = useState(false);
  const [buildForm, setBuildForm] = useState(EMPTY_FORM);
  const [buildStep, setBuildStep] = useState<"idle" | "creating" | "queuing" | "done">("idle");

  const projectsQuery = trpc.onboarding.list.useQuery(
    filterStage === "all" ? {} : { stage: filterStage }
  );
  const updateStageMutation = trpc.onboarding.updateStage.useMutation();
  const markSiteLiveMutation = trpc.onboarding.markSiteLive.useMutation();
  const triggerGenerationMutation = trpc.onboarding.triggerGeneration.useMutation();
  const createMutation = trpc.onboarding.create.useMutation();
  const questMutation = trpc.onboarding.submitQuestionnaire.useMutation();

  const projects = projectsQuery.data || [];

  // Auto-refresh every 4s while any project is generating
  const hasGenerating = projects.some((p: any) => p.generationStatus === "generating");
  useEffect(() => {
    if (!hasGenerating) return;
    const id = setInterval(() => projectsQuery.refetch(), 4000);
    return () => clearInterval(id);
  }, [hasGenerating]);

  const handleStageUpdate = async (id: number, stage: string, extras?: { designMockupUrl?: string; liveUrl?: string }) => {
    try {
      await updateStageMutation.mutateAsync({ id, stage: stage as any, ...extras });
      toast.success(`Project moved to ${STAGE_CONFIG[stage]?.label || stage}`);
      projectsQuery.refetch();
    } catch {
      toast.error("Failed to update project stage");
    }
  };

  const handleTriggerGeneration = async (projectId: number) => {
    try {
      await triggerGenerationMutation.mutateAsync({ projectId });
      toast.success("Site generation triggered");
      projectsQuery.refetch();
    } catch {
      toast.error("Failed to trigger generation");
    }
  };

  const handleMarkLive = async (projectId: number) => {
    const form = markLiveForms[projectId];
    if (!form?.liveUrl?.trim()) { toast.error("Live URL is required"); return; }
    try {
      await markSiteLiveMutation.mutateAsync({
        projectId,
        liveUrl: form.liveUrl.trim(),
        domainName: form.domainName.trim() || undefined,
      });
      toast.success("Site marked as live!");
      setMarkLiveForms(prev => ({ ...prev, [projectId]: { open: false, liveUrl: "", domainName: "" } }));
      projectsQuery.refetch();
    } catch {
      toast.error("Failed to mark site live");
    }
  };

  const openPage = (generatedSiteHtml: string, pageName: string) => {
    try {
      const pages = JSON.parse(generatedSiteHtml) as Record<string, string>;
      const html = pages[pageName];
      if (!html) return;
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      toast.error("Could not open preview");
    }
  };

  const getPages = (generatedSiteHtml: string | null): string[] => {
    if (!generatedSiteHtml) return [];
    try { return Object.keys(JSON.parse(generatedSiteHtml)); } catch { return []; }
  };

  const toggleFeature = (feature: string) => {
    setBuildForm(prev => ({
      ...prev,
      mustHaveFeatures: prev.mustHaveFeatures.includes(feature)
        ? prev.mustHaveFeatures.filter(f => f !== feature)
        : [...prev.mustHaveFeatures, feature],
    }));
  };

  const handleNewBuild = async () => {
    if (!buildForm.businessName.trim() || !buildForm.contactName.trim() || !buildForm.contactEmail.trim()) {
      toast.error("Business name, contact name, and email are required");
      return;
    }
    setBuildStep("creating");
    try {
      const project = await createMutation.mutateAsync({
        businessName: buildForm.businessName.trim(),
        contactName: buildForm.contactName.trim(),
        contactEmail: buildForm.contactEmail.trim(),
        packageTier: buildForm.packageTier,
      });

      setBuildStep("queuing");
      await questMutation.mutateAsync({
        projectId: project.id,
        questionnaire: {
          websiteType: buildForm.websiteType,
          brandColors: buildForm.brandColors
            ? buildForm.brandColors.split(",").map(c => c.trim()).filter(Boolean)
            : undefined,
          brandTone: buildForm.brandTone,
          targetAudience: buildForm.targetAudience || undefined,
          mustHaveFeatures: buildForm.mustHaveFeatures.length > 0 ? buildForm.mustHaveFeatures : undefined,
          specialRequests: buildForm.specialRequests || undefined,
        },
      });

      setBuildStep("done");
      toast.success(`Build started for ${buildForm.businessName}!`);
      setTimeout(() => {
        setNewBuildOpen(false);
        setBuildStep("idle");
        setBuildForm(EMPTY_FORM);
        projectsQuery.refetch();
      }, 1000);
    } catch (err: any) {
      setBuildStep("idle");
      toast.error(err.message || "Failed to start build");
    }
  };

  const stageCounts = projects.reduce((acc: Record<string, number>, p: any) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {});

  const buildBusy = buildStep === "creating" || buildStep === "queuing";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-electric">Onboarding Projects</h1>
          <p className="text-gray-600 mt-1">Track customer projects from intake through launch</p>
        </div>
        <Button
          onClick={() => setNewBuildOpen(true)}
          className="bg-electric hover:bg-electric-light text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Build
        </Button>
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStage("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterStage === "all" ? "bg-electric text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({projects.length})
        </button>
        {ALL_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const count = stageCounts[stage] || 0;
          return (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                filterStage === stage ? "bg-electric text-white" : `${config.color} hover:opacity-80`
              }`}
            >
              {config.icon}
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects list */}
      {projectsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-electric" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No onboarding projects yet</p>
            <Button onClick={() => setNewBuildOpen(true)} className="mt-4 bg-electric text-white gap-2">
              <Plus className="w-4 h-4" /> Start your first build
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project: any) => {
            const stageConfig = STAGE_CONFIG[project.stage] || STAGE_CONFIG.intake;
            const currentStageIndex = ALL_STAGES.indexOf(project.stage as any);
            const nextStage = currentStageIndex < ALL_STAGES.length - 1 ? ALL_STAGES[currentStageIndex + 1] : null;
            const pages = getPages(project.generatedSiteHtml);
            const isGenerating = project.generationStatus === "generating";
            const logExpanded = expandedLogs[project.id];

            return (
              <Card key={project.id} className="border-electric/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{project.businessName}</h3>
                      <p className="text-sm text-gray-500">
                        {project.contactName} • {project.contactEmail}
                        {project.contactPhone && ` • ${project.contactPhone}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                      <Badge className={stageConfig.color}>
                        {stageConfig.icon}
                        <span className="ml-1">{stageConfig.label}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">{project.packageTier}</Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1 mb-4">
                    {ALL_STAGES.map((stage, i) => (
                      <div
                        key={stage}
                        className={`h-1.5 flex-1 rounded-full ${i <= currentStageIndex ? "bg-electric" : "bg-gray-200"}`}
                      />
                    ))}
                  </div>

                  {/* Generation log */}
                  {project.generationLog && (
                    <div
                      className={`mb-4 rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                        isGenerating
                          ? "border-purple-200 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                      onClick={() => setExpandedLogs(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-1.5">
                          {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                          {project.generationLog}
                        </span>
                        {logExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                      {logExpanded && project.changeHistory && (
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-500 max-h-32 overflow-y-auto">
                          {typeof project.changeHistory === "string"
                            ? project.changeHistory
                            : JSON.stringify(project.changeHistory, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Custom Quote / Review Flags */}
                  {project.needsCustomQuote && (
                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-500/10 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-amber-800 text-sm">Custom Quote Required</span>
                        <Badge className="bg-amber-200 text-amber-900 text-xs ml-auto">
                          Complexity: {project.complexityScore}/100
                        </Badge>
                      </div>
                      {Array.isArray(project.reviewFlags) && project.reviewFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(project.reviewFlags as string[]).map((flag: string) => (
                            <Badge key={flag} variant="outline" className="text-xs border-amber-300 text-amber-700 bg-charcoal">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              {(FLAG_DESCRIPTIONS as Record<string, string>)[flag] || flag.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details row */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {project.domainOption && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        Domain: {project.domainOption === "existing" ? project.existingDomain || "Existing" : project.domainOption === "new" ? "Needs new" : "Undecided"}
                      </div>
                    )}
                    {project.revisionsCount > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {project.revisionsCount} revision{project.revisionsCount > 1 ? "s" : ""}
                      </div>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-electric hover:underline">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Live site
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Per-page preview buttons */}
                  {pages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      <span className="text-xs text-gray-500 mr-1 flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> Preview:
                      </span>
                      {pages.map(pageName => (
                        <Button
                          key={pageName}
                          size="sm"
                          variant="outline"
                          onClick={() => openPage(project.generatedSiteHtml, pageName)}
                          className="h-7 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {pageName === "index" ? "Home" : pageName}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {nextStage && project.stage !== "final_approval" && (
                      <Button
                        size="sm"
                        onClick={() => handleStageUpdate(project.id, nextStage)}
                        disabled={updateStageMutation.isPending}
                        className="bg-electric hover:bg-electric-light text-white"
                      >
                        Move to {STAGE_CONFIG[nextStage]?.label || nextStage}
                      </Button>
                    )}
                    <Select value={project.stage} onValueChange={(val) => handleStageUpdate(project.id, val)}>
                      <SelectTrigger className="w-44 h-8 text-sm">
                        <SelectValue placeholder="Jump to stage..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {STAGE_CONFIG[stage]?.label || stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Trigger generation */}
                    {project.generationStatus !== "complete" && project.generationStatus !== "generating" && (() => {
                      const pq = (project.questionnaire as Record<string, unknown>) || {};
                      const hasData = !!(pq.businessName || pq.businessType || pq.websiteType) ||
                        (!!project.businessName && project.businessName !== "Pending");
                      if (!hasData) {
                        return (
                          <span
                            title="No questionnaire data — customer must complete Elena chat first"
                            className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded px-2 py-1 cursor-not-allowed"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            No data
                          </span>
                        );
                      }
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTriggerGeneration(project.id)}
                          disabled={triggerGenerationMutation.isPending}
                          className="border-purple-400 text-purple-600 hover:bg-purple-50 h-8"
                        >
                          {triggerGenerationMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Zap className="w-3 h-3 mr-1" />
                          )}
                          Generate
                        </Button>
                      );
                    })()}

                    {/* Re-generate (when already complete) */}
                    {project.generationStatus === "complete" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTriggerGeneration(project.id)}
                        disabled={triggerGenerationMutation.isPending}
                        className="border-gray-400 text-gray-600 hover:bg-gray-50 h-8"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Re-generate
                      </Button>
                    )}

                    {/* Mark live */}
                    {project.stage === "final_approval" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMarkLiveForms(prev => ({
                          ...prev,
                          [project.id]: prev[project.id]?.open
                            ? { ...prev[project.id], open: false }
                            : { open: true, liveUrl: project.liveUrl || "", domainName: project.domainName || "" }
                        }))}
                        className="border-green-500 text-green-600 hover:bg-green-50 h-8"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Live
                      </Button>
                    )}
                  </div>

                  {/* Mark Live inline form */}
                  {markLiveForms[project.id]?.open && (
                    <div className="mt-3 p-4 rounded-lg border border-green-200 bg-green-50 space-y-3">
                      <p className="text-sm font-medium text-green-800">Mark site as live</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Live URL *</label>
                          <Input
                            value={markLiveForms[project.id]?.liveUrl || ""}
                            onChange={e => setMarkLiveForms(prev => ({ ...prev, [project.id]: { ...prev[project.id], liveUrl: e.target.value } }))}
                            placeholder="https://theirclientsite.com"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Domain name</label>
                          <Input
                            value={markLiveForms[project.id]?.domainName || ""}
                            onChange={e => setMarkLiveForms(prev => ({ ...prev, [project.id]: { ...prev[project.id], domainName: e.target.value } }))}
                            placeholder="theirclientsite.com"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleMarkLive(project.id)}
                          disabled={markSiteLiveMutation.isPending || !markLiveForms[project.id]?.liveUrl?.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {markSiteLiveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Rocket className="w-3 h-3 mr-1" />}
                          Confirm — Mark Live
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMarkLiveForms(prev => ({ ...prev, [project.id]: { open: false, liveUrl: "", domainName: "" } }))}
                          className="text-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── New Build Dialog ─────────────────────────────────────────────── */}
      <Dialog open={newBuildOpen} onOpenChange={open => { if (!buildBusy) setNewBuildOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-electric" />
              New Site Build
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Client info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-sm mb-1 block">Business Name *</Label>
                  <Input
                    value={buildForm.businessName}
                    onChange={e => setBuildForm(p => ({ ...p, businessName: e.target.value }))}
                    placeholder="Ironclad Construction Group"
                    disabled={buildBusy}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Contact Name *</Label>
                  <Input
                    value={buildForm.contactName}
                    onChange={e => setBuildForm(p => ({ ...p, contactName: e.target.value }))}
                    placeholder="Jane Smith"
                    disabled={buildBusy}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Contact Email *</Label>
                  <Input
                    type="email"
                    value={buildForm.contactEmail}
                    onChange={e => setBuildForm(p => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="jane@business.com"
                    disabled={buildBusy}
                  />
                </div>
              </div>
            </div>

            {/* Package & site type */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Package & Site Type</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">Package Tier</Label>
                  <Select
                    value={buildForm.packageTier}
                    onValueChange={v => setBuildForm(p => ({ ...p, packageTier: v as any }))}
                    disabled={buildBusy}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Website Type</Label>
                  <Select
                    value={buildForm.websiteType}
                    onValueChange={v => setBuildForm(p => ({ ...p, websiteType: v as any }))}
                    disabled={buildBusy}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_business">Service Business</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="ecommerce">Ecommerce</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Brand */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Brand</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">Brand Tone</Label>
                  <Select
                    value={buildForm.brandTone}
                    onValueChange={v => setBuildForm(p => ({ ...p, brandTone: v as any }))}
                    disabled={buildBusy}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="elegant">Elegant</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Brand Colors</Label>
                  <Input
                    value={buildForm.brandColors}
                    onChange={e => setBuildForm(p => ({ ...p, brandColors: e.target.value }))}
                    placeholder="#1a1a1a charcoal, #e07b39 orange"
                    disabled={buildBusy}
                  />
                </div>
              </div>
            </div>

            {/* Content context */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Context</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1 block">Target Audience</Label>
                  <Input
                    value={buildForm.targetAudience}
                    onChange={e => setBuildForm(p => ({ ...p, targetAudience: e.target.value }))}
                    placeholder="Homeowners 35–60 in Phoenix spending $150k+ on renovations"
                    disabled={buildBusy}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">
                    Services, Unique Value & CTA
                    <span className="text-gray-400 font-normal ml-1">(paste the full brief here)</span>
                  </Label>
                  <Textarea
                    value={buildForm.specialRequests}
                    onChange={e => setBuildForm(p => ({ ...p, specialRequests: e.target.value }))}
                    placeholder={`Services: Custom home builds from $500k, High-end kitchen renovations $75k–$300k...\n\nUnique value: Licensed structural engineer on staff, 22-year track record, zero warranty claims.\n\nCall to action: Schedule a Consultation`}
                    rows={5}
                    disabled={buildBusy}
                  />
                </div>
              </div>
            </div>

            {/* Must-have features */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Must-Have Features</p>
              <div className="grid grid-cols-2 gap-2">
                {MUST_HAVE_FEATURES.map(feature => (
                  <label
                    key={feature}
                    className="flex items-center gap-2 cursor-pointer hover:text-gray-800 text-sm text-gray-600 select-none"
                  >
                    <Checkbox
                      checked={buildForm.mustHaveFeatures.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                      disabled={buildBusy}
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                onClick={handleNewBuild}
                disabled={buildBusy}
                className="bg-electric hover:bg-electric-light text-white gap-2 flex-1"
              >
                {buildStep === "creating" && <><Loader2 className="w-4 h-4 animate-spin" /> Creating project...</>}
                {buildStep === "queuing" && <><Loader2 className="w-4 h-4 animate-spin" /> Queuing generation...</>}
                {buildStep === "done" && <><CheckCircle className="w-4 h-4" /> Build started!</>}
                {buildStep === "idle" && <><Zap className="w-4 h-4" /> Start Build</>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setNewBuildOpen(false)}
                disabled={buildBusy}
                className="text-gray-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
