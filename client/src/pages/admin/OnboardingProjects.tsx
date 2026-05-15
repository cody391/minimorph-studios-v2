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
  History,
} from "lucide-react";
import { FLAG_DESCRIPTIONS } from "@shared/quoteEngine";

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  intake: { label: "Intake", color: "badge-neutral", icon: <ClipboardList className="w-3 h-3" /> },
  questionnaire: { label: "Discovery", color: "bg-amber-100 text-amber-800", icon: <ClipboardList className="w-3 h-3" /> },
  blueprint_review: { label: "Blueprint Review", color: "bg-sky-100 text-sky-800", icon: <FileText className="w-3 h-3" /> },
  assets_upload: { label: "Assets Upload", color: "bg-blue-100 text-blue-800", icon: <Upload className="w-3 h-3" /> },
  design: { label: "Designing", color: "bg-purple-100 text-purple-800", icon: <Palette className="w-3 h-3" /> },
  pending_admin_review: { label: "Pending Admin Review", color: "bg-rose-100 text-rose-800", icon: <ShieldAlert className="w-3 h-3" /> },
  review: { label: "Review", color: "bg-emerald-100 text-emerald-800", icon: <Eye className="w-3 h-3" /> },
  revisions: { label: "Revisions", color: "bg-orange-100 text-orange-800", icon: <MessageSquare className="w-3 h-3" /> },
  final_approval: { label: "Final Approval", color: "bg-teal-100 text-teal-800", icon: <CheckCircle2 className="w-3 h-3" /> },
  launch: { label: "Launching", color: "bg-green-100 text-green-800", icon: <Rocket className="w-3 h-3" /> },
  complete: { label: "Complete", color: "bg-green-200 text-green-900", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const ALL_STAGES = ["intake", "questionnaire", "blueprint_review", "assets_upload", "design", "pending_admin_review", "review", "revisions", "final_approval", "launch", "complete"] as const;

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

function BlueprintRevisionPanel({
  projectId,
  enabled,
  isPending,
  onSendUpdate,
}: {
  projectId: number;
  enabled: boolean;
  isPending: boolean;
  onSendUpdate: (blueprintId: number, updatedJson: Record<string, unknown>) => void;
}) {
  const bpQuery = trpc.compliance.adminListBlueprints.useQuery(
    { projectId },
    { enabled }
  );

  const bp = bpQuery.data?.[0] as any;
  const bpJson = bp?.blueprintJson as Record<string, any> | null;

  const [fields, setFields] = useState({
    businessName: "",
    brandTone: "",
    brandColors: "",
    servicesOffered: "",
    specialRequests: "",
    domainName: "",
  });

  useEffect(() => {
    if (!bpJson) return;
    setFields({
      businessName: String(bpJson.businessName ?? ""),
      brandTone: String(bpJson.designDirection?.brandTone ?? ""),
      brandColors: String(bpJson.designDirection?.brandColors ?? ""),
      servicesOffered: Array.isArray(bpJson.contentPlan?.servicesOffered)
        ? (bpJson.contentPlan.servicesOffered as string[]).join(", ")
        : "",
      specialRequests: String(bpJson.contentPlan?.specialRequests ?? ""),
      domainName: String(bpJson.businessDetails?.domainName ?? ""),
    });
  }, [bp?.id]);

  if (!enabled) return null;
  if (bpQuery.isLoading) return (
    <div className="py-3 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" /></div>
  );
  if (!bp) return (
    <p className="py-3 text-xs text-amber-600 text-center">No blueprint found for this project.</p>
  );

  const handleSend = () => {
    const servicesArray = fields.servicesOffered
      ? fields.servicesOffered.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const updatedJson: Record<string, unknown> = {
      ...bpJson,
      businessName: fields.businessName,
      designDirection: { ...(bpJson?.designDirection ?? {}), brandTone: fields.brandTone, brandColors: fields.brandColors },
      contentPlan: { ...(bpJson?.contentPlan ?? {}), servicesOffered: servicesArray, specialRequests: fields.specialRequests },
      businessDetails: { ...(bpJson?.businessDetails ?? {}), domainName: fields.domainName },
    };
    onSendUpdate(bp.id, updatedJson);
  };

  return (
    <div className="space-y-4">
      {bp.revisionNotes && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            Customer Revision Request
          </p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{bp.revisionNotes}</p>
          {bp.revisionRequestedAt && (
            <p className="text-xs text-amber-600 mt-1">
              Requested {new Date(bp.revisionRequestedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Business Name</label>
          <Input value={fields.businessName} onChange={e => setFields(p => ({ ...p, businessName: e.target.value }))} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Brand Tone</label>
          <Input value={fields.brandTone} onChange={e => setFields(p => ({ ...p, brandTone: e.target.value }))} className="h-8 text-sm" placeholder="professional, bold, friendly…" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Brand Colors</label>
          <Input value={fields.brandColors} onChange={e => setFields(p => ({ ...p, brandColors: e.target.value }))} className="h-8 text-sm" placeholder="#1a1a1a charcoal, #e07b39 orange" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Services Offered (comma-separated)</label>
          <Input value={fields.servicesOffered} onChange={e => setFields(p => ({ ...p, servicesOffered: e.target.value }))} className="h-8 text-sm" placeholder="Web Design, SEO, Social Media…" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-600 block mb-1">Special Requests</label>
          <Textarea value={fields.specialRequests} onChange={e => setFields(p => ({ ...p, specialRequests: e.target.value }))} rows={3} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Domain Name</label>
          <Input value={fields.domainName} onChange={e => setFields(p => ({ ...p, domainName: e.target.value }))} className="h-8 text-sm" placeholder="example.com" />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <Button size="sm" onClick={handleSend} disabled={isPending} className="bg-sky-600 hover:bg-sky-700 text-white">
          {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
          Send Updated Blueprint
        </Button>
      </div>
    </div>
  );
}

function VersionHistoryPanel({
  projectId,
  enabled,
  onRollback,
  isPending,
}: {
  projectId: number;
  enabled: boolean;
  onRollback: (versionId: number, versionNumber: number) => void;
  isPending: boolean;
}) {
  const { data: versions, isLoading } = trpc.onboarding.listSiteVersions.useQuery(
    { projectId },
    { enabled }
  );

  if (!enabled) return null;
  if (isLoading) return (
    <div className="py-3 text-center">
      <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
    </div>
  );
  if (!versions?.length) return (
    <p className="py-3 text-xs text-gray-500 text-center">No version snapshots yet.</p>
  );

  return (
    <div className="space-y-1.5">
      {versions.map((v: any) => (
        <div key={v.id} className="flex items-start justify-between gap-2 p-2 rounded border border-gray-200 bg-white text-xs">
          <div className="min-w-0">
            <span className="font-semibold text-gray-700">v{v.versionNumber}</span>
            <span className="text-gray-400 ml-2">{new Date(v.createdAt).toLocaleString()}</span>
            {v.changeRequest && (
              <span className="text-gray-500 ml-2 block mt-0.5 truncate max-w-xs">
                {v.changeRequest.length > 80 ? v.changeRequest.slice(0, 80) + "…" : v.changeRequest}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm(`Restore version ${v.versionNumber}?\n\nThis will replace the current site HTML and send the project back to admin preview review. The current state will be saved as a safety snapshot.`)) {
                onRollback(v.id, v.versionNumber);
              }
            }}
            disabled={isPending}
            className="h-6 text-xs border-orange-400 text-orange-600 hover:bg-orange-50 shrink-0"
          >
            {isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" /> : <History className="w-2.5 h-2.5 mr-1" />}
            Restore
          </Button>
        </div>
      ))}
    </div>
  );
}

function AdminMediaPanel({ projectId, enabled }: { projectId: number; enabled: boolean }) {
  const assetsQuery = trpc.compliance.adminListProjectAssets.useQuery({ projectId }, { enabled });
  const updateQualityMutation = trpc.compliance.adminUpdateAssetQuality.useMutation();
  const readinessQuery = trpc.compliance.getProjectMediaReadiness.useQuery({ projectId }, { enabled });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    qualityStatus: string; qualityScore: string; qualityNotes: string;
    rejectionReason: string; rescueNotes: string;
  }>({ qualityStatus: "pending_review", qualityScore: "", qualityNotes: "", rejectionReason: "", rescueNotes: "" });

  const assets = assetsQuery.data ?? [];
  const readiness = readinessQuery.data;

  const startEdit = (asset: any) => {
    setEditingId(asset.id);
    setForm({
      qualityStatus: asset.qualityStatus ?? "pending_review",
      qualityScore: asset.qualityScore ? String(asset.qualityScore) : "",
      qualityNotes: asset.qualityNotes ?? "",
      rejectionReason: asset.rejectionReason ?? "",
      rescueNotes: asset.rescueNotes ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateQualityMutation.mutateAsync({
        assetId: editingId,
        qualityStatus: form.qualityStatus as any,
        qualityScore: form.qualityScore ? Number(form.qualityScore) : undefined,
        qualityNotes: form.qualityNotes || undefined,
        rejectionReason: form.rejectionReason || undefined,
        rescueNotes: form.rescueNotes || undefined,
      });
      toast.success("Asset quality updated");
      setEditingId(null);
      assetsQuery.refetch();
      readinessQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  if (assetsQuery.isLoading) return <div className="text-xs text-gray-400 py-2">Loading media...</div>;

  return (
    <div className="space-y-3">
      {/* Readiness summary */}
      {readiness && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded bg-gray-50 border border-gray-200 p-2">
            <div className="font-medium text-gray-700">{readiness.approvedCount}</div>
            <div className="text-green-600">Approved</div>
          </div>
          <div className="rounded bg-gray-50 border border-gray-200 p-2">
            <div className="font-medium text-gray-700">{readiness.pendingCount}</div>
            <div className="text-yellow-600">Pending review</div>
          </div>
          <div className="rounded bg-gray-50 border border-gray-200 p-2">
            <div className="font-medium text-gray-700">{readiness.needsRescueCount}</div>
            <div className="text-orange-600">Needs rescue</div>
          </div>
          <div className="rounded bg-gray-50 border border-gray-200 p-2">
            <div className="font-medium text-gray-700">{readiness.rejectedCount}</div>
            <div className="text-red-600">Rejected</div>
          </div>
        </div>
      )}
      {readiness?.mediaWarnings && readiness.mediaWarnings.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-0.5">
          {readiness.mediaWarnings.map((w: string, i: number) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
      {readiness?.mediaReadyForGeneration && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
          ✓ Media ready for generation ({readiness.approvedCount} approved assets)
        </div>
      )}

      {/* Asset list */}
      {assets.length === 0 ? (
        <div className="text-xs text-gray-400 py-2">No media uploaded by customer yet.</div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset: any) => (
            <div key={asset.id} className="rounded border border-gray-200 bg-gray-50/50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-xs font-medium text-gray-800 truncate max-w-[220px]">{asset.fileName}</div>
                  <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                    <span className="capitalize">{asset.category}</span>
                    {asset.intendedUse && <span className="capitalize text-blue-600">{asset.intendedUse.replace("_", " ")}</span>}
                    <span className="text-gray-400">{asset.source}</span>
                    {asset.fileSize && <span>{Math.round(asset.fileSize / 1024)}KB</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    asset.qualityStatus === "approved" ? "bg-green-100 text-green-700" :
                    asset.qualityStatus === "rejected" ? "bg-red-100 text-red-700" :
                    asset.qualityStatus === "needs_rescue" ? "bg-orange-100 text-orange-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{asset.qualityStatus?.replace("_", " ")}</span>
                  <button
                    onClick={() => editingId === asset.id ? setEditingId(null) : startEdit(asset)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {editingId === asset.id ? "Cancel" : "Review"}
                  </button>
                  {asset.fileUrl && (
                    <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {editingId === asset.id && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Quality Status</label>
                      <select
                        value={form.qualityStatus}
                        onChange={e => setForm(f => ({ ...f, qualityStatus: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="pending_review">Pending review</option>
                        <option value="approved">Approved</option>
                        <option value="needs_rescue">Needs rescue</option>
                        <option value="rejected">Rejected</option>
                        <option value="replaced">Replaced</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Score (1-10)</label>
                      <input
                        type="number" min="1" max="10"
                        value={form.qualityScore}
                        onChange={e => setForm(f => ({ ...f, qualityScore: e.target.value }))}
                        placeholder="e.g. 7"
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Quality Notes (internal)</label>
                    <textarea
                      value={form.qualityNotes}
                      onChange={e => setForm(f => ({ ...f, qualityNotes: e.target.value }))}
                      placeholder="Internal notes about media quality..."
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none"
                    />
                  </div>
                  {(form.qualityStatus === "rejected" || form.qualityStatus === "needs_rescue") && (
                    <>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Rejection reason (shown to customer)</label>
                        <textarea
                          value={form.rejectionReason}
                          onChange={e => setForm(f => ({ ...f, rejectionReason: e.target.value }))}
                          placeholder="e.g. Image is blurry and too dark — a brighter, sharper version will look premium."
                          rows={2}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Rescue / replacement suggestion (shown to customer)</label>
                        <textarea
                          value={form.rescueNotes}
                          onChange={e => setForm(f => ({ ...f, rescueNotes: e.target.value }))}
                          placeholder="e.g. Try photographing near a window in natural light, centered subject, no clutter in background."
                          rows={2}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none"
                        />
                      </div>
                    </>
                  )}
                  <Button
                    size="sm"
                    onClick={saveEdit}
                    disabled={updateQualityMutation.isPending}
                    className="text-xs"
                  >
                    {updateQualityMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Save quality review
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnboardingProjects() {
  const [filterStage, setFilterStage] = useState<string>("all");
  const [markLiveForms, setMarkLiveForms] = useState<Record<number, { open: boolean; liveUrl: string; domainName: string }>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({});
  const [expandedBlueprintRevisions, setExpandedBlueprintRevisions] = useState<Record<number, boolean>>({});
  const [expandedMedia, setExpandedMedia] = useState<Record<number, boolean>>({});
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
  const adminApprovePreviewMutation = trpc.onboarding.adminApprovePreview.useMutation();
  const adminReleaseLaunchMutation = trpc.onboarding.adminReleaseLaunch.useMutation();
  const rollbackMutation = trpc.onboarding.rollbackToVersion.useMutation();
  const updateBlueprintForReviewMutation = trpc.compliance.updateBlueprintForReview.useMutation();
  const adminApproveBlueprintMutation = trpc.compliance.adminApproveBlueprint.useMutation();
  const adminReturnBlueprintMutation = trpc.compliance.adminReturnBlueprint.useMutation();
  const adminBlockBlueprintMutation = trpc.compliance.adminBlockBlueprint.useMutation();

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

  const handleAdminApprovePreview = async (projectId: number) => {
    try {
      await adminApprovePreviewMutation.mutateAsync({ projectId });
      toast.success("Preview approved — customer can now see their site");
      projectsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve preview");
    }
  };

  const handleAdminReleaseLaunch = async (projectId: number) => {
    try {
      await adminReleaseLaunchMutation.mutateAsync({ projectId });
      toast.success("Launch released — deployment triggered");
      projectsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to release launch");
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

  const handleAdminApproveBlueprint = async (projectId: number) => {
    try {
      await adminApproveBlueprintMutation.mutateAsync({ projectId });
      toast.success("Blueprint approved — generation can now proceed");
      projectsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve blueprint");
    }
  };

  const handleAdminReturnBlueprint = async (projectId: number, reason: string) => {
    if (!reason.trim()) { toast.error("Return reason is required"); return; }
    try {
      await adminReturnBlueprintMutation.mutateAsync({ projectId, reason });
      toast.success("Blueprint returned for changes");
      projectsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to return blueprint");
    }
  };

  const handleAdminBlockBlueprint = async (projectId: number, reason: string) => {
    if (!reason.trim()) { toast.error("Block reason is required"); return; }
    try {
      await adminBlockBlueprintMutation.mutateAsync({ projectId, reason });
      toast.success("Blueprint blocked — generation prevented");
      projectsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to block blueprint");
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
            const isFailed = project.generationStatus === "failed";
            const logExpanded = expandedLogs[project.id];
            const generatingMinutes = isGenerating && project.createdAt
              ? Math.round((Date.now() - new Date(project.createdAt).getTime()) / 60000)
              : null;

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
                      {isFailed && (
                        <Badge className="bg-red-100 text-red-700 border border-red-300">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Failed
                        </Badge>
                      )}
                      {isGenerating && generatingMinutes !== null && generatingMinutes > 15 && (
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {generatingMinutes}m
                        </Badge>
                      )}
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
                        isFailed
                          ? "border-red-300 bg-red-50 text-red-700"
                          : isGenerating
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

                    {/* Admin: approve preview for customer */}
                    {project.stage === "pending_admin_review" && (
                      <Button
                        size="sm"
                        onClick={() => handleAdminApprovePreview(project.id)}
                        disabled={adminApprovePreviewMutation.isPending}
                        className="bg-rose-600 hover:bg-rose-700 text-white h-8"
                      >
                        {adminApprovePreviewMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          : <Eye className="w-3 h-3 mr-1" />}
                        Approve Preview for Customer
                      </Button>
                    )}

                    {/* Admin: release to launch (after customer approval) */}
                    {project.stage === "final_approval" && (project as any).approvedAt && !(project as any).adminLaunchApprovedAt && (
                      <Button
                        size="sm"
                        onClick={() => handleAdminReleaseLaunch(project.id)}
                        disabled={adminReleaseLaunchMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700 text-white h-8"
                      >
                        {adminReleaseLaunchMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          : <Rocket className="w-3 h-3 mr-1" />}
                        Release to Launch
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

                  {/* Blueprint revision panel — shown when customer requested changes */}
                  {(project as any).blueprintStatus === "revision_requested" && (
                    <div className="mt-3 border-t border-amber-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setExpandedBlueprintRevisions(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Blueprint Revision Requested
                        {expandedBlueprintRevisions[project.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {expandedBlueprintRevisions[project.id] && (
                        <div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50/30">
                          <BlueprintRevisionPanel
                            projectId={project.id}
                            enabled={!!expandedBlueprintRevisions[project.id]}
                            isPending={updateBlueprintForReviewMutation.isPending}
                            onSendUpdate={async (blueprintId, updatedJson) => {
                              try {
                                const result = await updateBlueprintForReviewMutation.mutateAsync({
                                  projectId: project.id,
                                  blueprintId,
                                  updatedBlueprintJson: updatedJson,
                                });
                                toast.success(`Updated blueprint v${result.newVersion} sent — customer can now re-approve`);
                                setExpandedBlueprintRevisions(prev => ({ ...prev, [project.id]: false }));
                                projectsQuery.refetch();
                              } catch (e: any) {
                                toast.error(e?.message || "Failed to send updated blueprint");
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* B7 Admin Blueprint Review — shown when a blueprint exists */}
                  {(project as any).blueprintStatus && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">Blueprint Review:</span>
                        {(() => {
                          const rs = (project as any).adminBlueprintReviewStatus ?? "pending";
                          const colors: Record<string, string> = {
                            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
                            approved: "bg-green-100 text-green-800 border-green-300",
                            needs_changes: "bg-orange-100 text-orange-800 border-orange-300",
                            blocked: "bg-red-100 text-red-800 border-red-300",
                          };
                          return (
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${colors[rs] ?? colors.pending}`}>
                              {rs.replace("_", " ")}
                            </span>
                          );
                        })()}
                        {(project as any).adminBlueprintReviewStatus !== "approved" && (project as any).blueprintStatus === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => handleAdminApproveBlueprint(project.id)}
                            disabled={adminApproveBlueprintMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-2"
                          >
                            {adminApproveBlueprintMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Approve Blueprint
                          </Button>
                        )}
                        {(project as any).adminBlueprintReviewStatus !== "blocked" && (project as any).blueprintStatus && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt("Return reason (shown to team):");
                              if (reason) handleAdminReturnBlueprint(project.id, reason);
                            }}
                            disabled={adminReturnBlueprintMutation.isPending}
                            className="border-orange-400 text-orange-700 hover:bg-orange-50 h-7 text-xs px-2"
                          >
                            Return
                          </Button>
                        )}
                        {(project as any).adminBlueprintReviewStatus !== "blocked" && (project as any).blueprintStatus && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = window.prompt("Block reason (prevents generation):");
                              if (reason) handleAdminBlockBlueprint(project.id, reason);
                            }}
                            disabled={adminBlockBlueprintMutation.isPending}
                            className="border-red-400 text-red-700 hover:bg-red-50 h-7 text-xs px-2"
                          >
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Version history toggle */}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedVersions(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <History className="w-3 h-3" />
                      Version History
                      {expandedVersions[project.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedVersions[project.id] && (
                      <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                        <VersionHistoryPanel
                          projectId={project.id}
                          enabled={!!expandedVersions[project.id]}
                          isPending={rollbackMutation.isPending}
                          onRollback={async (versionId, versionNumber) => {
                            try {
                              await rollbackMutation.mutateAsync({ projectId: project.id, versionId });
                              toast.success(`Restored to version ${versionNumber} — back in admin review`);
                              setExpandedVersions(prev => ({ ...prev, [project.id]: false }));
                              projectsQuery.refetch();
                            } catch (e: any) {
                              toast.error(e?.message || "Rollback failed");
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Media Review Panel */}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedMedia(prev => ({ ...prev, [project.id]: !prev[project.id] }))}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Media Review
                      {expandedMedia[project.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedMedia[project.id] && (
                      <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                        <AdminMediaPanel
                          projectId={project.id}
                          enabled={!!expandedMedia[project.id]}
                        />
                      </div>
                    )}
                  </div>
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
