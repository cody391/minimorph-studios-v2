import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

export default function OnboardingProjects() {
  const [filterStage, setFilterStage] = useState<string>("all");
  const [markLiveForms, setMarkLiveForms] = useState<Record<number, { open: boolean; liveUrl: string; domainName: string }>>({});
  const projectsQuery = trpc.onboarding.list.useQuery(
    filterStage === "all" ? {} : { stage: filterStage }
  );
  const updateStageMutation = trpc.onboarding.updateStage.useMutation();
  const markSiteLiveMutation = trpc.onboarding.markSiteLive.useMutation();
  const triggerGenerationMutation = trpc.onboarding.triggerGeneration.useMutation();

  const projects = projectsQuery.data || [];

  const handleStageUpdate = async (id: number, stage: string, extras?: { designMockupUrl?: string; liveUrl?: string }) => {
    try {
      await updateStageMutation.mutateAsync({
        id,
        stage: stage as any,
        ...extras,
      });
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
    if (!form?.liveUrl?.trim()) {
      toast.error("Live URL is required");
      return;
    }
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

  const openPreview = (generatedSiteHtml: string) => {
    try {
      const pages = JSON.parse(generatedSiteHtml) as Record<string, string>;
      const firstPage = Object.values(pages)[0];
      if (!firstPage) return;
      const blob = new Blob([firstPage], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Could not open preview");
    }
  };

  // Count projects by stage
  const stageCounts = projects.reduce((acc: Record<string, number>, p: any) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-electric">Onboarding Projects</h1>
        <p className="text-gray-600 mt-1">Track customer projects from intake through launch</p>
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStage("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterStage === "all"
              ? "bg-electric text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                filterStage === stage
                  ? "bg-electric text-white"
                  : `${config.color} hover:opacity-80`
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
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project: any) => {
            const stageConfig = STAGE_CONFIG[project.stage] || STAGE_CONFIG.intake;
            const currentStageIndex = ALL_STAGES.indexOf(project.stage as any);
            const nextStage = currentStageIndex < ALL_STAGES.length - 1 ? ALL_STAGES[currentStageIndex + 1] : null;

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
                      <Badge className={stageConfig.color}>
                        {stageConfig.icon}
                        <span className="ml-1">{stageConfig.label}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {project.packageTier}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex gap-1 mb-4">
                    {ALL_STAGES.map((stage, i) => (
                      <div
                        key={stage}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= currentStageIndex ? "bg-electric" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>

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
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-electric hover:underline"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Live site
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>

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
                    <Select
                      value={project.stage}
                      onValueChange={(val) => handleStageUpdate(project.id, val)}
                    >
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
                    {project.generationStatus !== "complete" && project.generationStatus !== "generating" && (
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
                    )}

                    {/* View preview */}
                    {project.generatedSiteHtml && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPreview(project.generatedSiteHtml)}
                        className="border-blue-400 text-blue-600 hover:bg-blue-50 h-8"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    )}

                    {/* Mark live — final_approval stage */}
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
                            onChange={e => setMarkLiveForms(prev => ({
                              ...prev,
                              [project.id]: { ...prev[project.id], liveUrl: e.target.value }
                            }))}
                            placeholder="https://theirclientsite.com"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-green-700 block mb-1">Domain name</label>
                          <Input
                            value={markLiveForms[project.id]?.domainName || ""}
                            onChange={e => setMarkLiveForms(prev => ({
                              ...prev,
                              [project.id]: { ...prev[project.id], domainName: e.target.value }
                            }))}
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
                          {markSiteLiveMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Rocket className="w-3 h-3 mr-1" />
                          )}
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
    </div>
  );
}
