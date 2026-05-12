import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  CheckCircle2, XCircle, AlertTriangle, Database, CreditCard,
  Mail, Globe, Cloud, Brain, Zap, Shield, FileText, Users, Rocket,
  Info, ClipboardCheck, Eye, Loader2, ExternalLink, Download,
} from "lucide-react";

function StatusBadge({ ok, warn, label }: { ok: boolean; warn?: boolean; label?: string }) {
  if (ok) return <Badge className="bg-green-500/15 text-green-400 border-green-500/20">{label ?? "PASS"}</Badge>;
  if (warn) return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20">{label ?? "WARNING"}</Badge>;
  return <Badge className="bg-red-500/15 text-red-400 border-red-500/20">{label ?? "FAIL"}</Badge>;
}

function ReadinessRow({
  icon: Icon,
  label,
  ok,
  warn,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  ok: boolean;
  warn?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {ok ? (
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        ) : warn ? (
          <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
        ) : (
          <XCircle size={16} className="text-red-400 shrink-0" />
        )}
        <Icon size={15} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">{label}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </div>
      <StatusBadge ok={ok} warn={warn} />
    </div>
  );
}

const LEAD_ENGINE_KEYS: { key: string; label: string; description: string }[] = [
  { key: "lead_engine_active", label: "Lead Engine Master Switch", description: "lead_engine_active" },
  { key: "job_scraper_active", label: "Google Maps Scraper Job", description: "job_scraper_active" },
  { key: "job_outreach_active", label: "Automated Outreach Job", description: "job_outreach_active" },
  { key: "job_auto_feed_active", label: "Auto-Feed Reps Job", description: "job_auto_feed_active" },
  { key: "job_reengagement_active", label: "Cold Lead Re-engagement Job", description: "job_reengagement_active" },
];

const AUTOMATION_KEYS: { key: string; label: string; description: string }[] = [
  { key: "auto_deploy_enabled", label: "Auto Deploy Sites", description: "auto_deploy_enabled" },
  { key: "auto_commission_enabled", label: "Auto Commission", description: "auto_commission_enabled" },
  { key: "auto_close_pipeline_enabled", label: "Auto Close Pipeline", description: "auto_close_pipeline_enabled" },
  { key: "auto_email_sequences_enabled", label: "Auto Email Sequences", description: "auto_email_sequences_enabled" },
  { key: "auto_contract_generation_enabled", label: "Auto Contract Generation", description: "auto_contract_generation_enabled" },
];

function AutomationKeyRow({
  keyDef,
  settings,
}: {
  keyDef: { key: string; label: string; description: string };
  settings: Record<string, string>;
}) {
  const val = settings[keyDef.key];
  const isOn = val === "true";
  const missing = val === undefined;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        {isOn ? (
          <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
        ) : (
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        )}
        <span className="text-sm font-medium">{keyDef.label}</span>
        <span className="text-xs text-muted-foreground font-mono">{keyDef.description}</span>
      </div>
      {missing ? (
        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">NOT SET</Badge>
      ) : (
        <StatusBadge ok={!isOn} warn={isOn} label={isOn ? "ON" : "OFF"} />
      )}
    </div>
  );
}

function stageColor(stage: string) {
  if (stage === "launch" || stage === "complete") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (stage === "final_approval") return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (stage === "review" || stage === "revisions") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  return "bg-muted/30 text-muted-foreground border-border";
}

function computeProjectVerdict(p: {
  generationStatus: string | null;
  generatedSiteUrl: string | null;
  cloudflareProjectName: string | null;
  domainOption: string | null;
  domainName: string | null;
  existingDomain: string | null;
  domainRegistered: boolean | null;
  approvedAt: Date | null;
  adminPreviewApprovedAt?: Date | null;
  adminLaunchApprovedAt?: Date | null;
  liveUrl: string | null;
  stage: string;
}): { label: string; color: string } {
  const live = !!p.liveUrl || p.stage === "launch" || p.stage === "complete";
  if (live) return { label: "LIVE", color: "bg-green-500/15 text-green-400 border-green-500/20" };

  const hasSite = !!p.generatedSiteUrl || p.generationStatus === "complete";
  if (!hasSite) return { label: "BLOCKED — site not generated", color: "bg-red-500/15 text-red-400 border-red-500/20" };

  if (p.stage === "pending_admin_review" || !p.adminPreviewApprovedAt) {
    return { label: "NEEDS ADMIN PREVIEW APPROVAL", color: "bg-rose-500/15 text-rose-400 border-rose-500/20" };
  }

  const hasCF = !!p.cloudflareProjectName;
  if (!hasCF) return { label: "MANUAL REQUIRED — no Cloudflare project", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" };

  const needsDomainSetup = p.domainOption === "new" && !p.domainRegistered;
  if (needsDomainSetup) return { label: "MANUAL REQUIRED — domain not registered", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" };

  const customerApproved = !!p.approvedAt;
  if (!customerApproved) return { label: "NEEDS CUSTOMER APPROVAL", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" };

  if (!p.adminLaunchApprovedAt) return { label: "NEEDS ADMIN LAUNCH RELEASE", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };

  return { label: "NEEDS ADMIN DEPLOY", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" };
}

export default function LaunchReadiness() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: readiness, isLoading: loadingR } = trpc.compliance.getSystemReadiness.useQuery();
  const { data: agreements, isLoading: loadingA } = trpc.compliance.listCustomerAgreements.useQuery();
  const { data: paperwork, isLoading: loadingP } = trpc.compliance.listRepPaperwork.useQuery({});
  const { data: projects, isLoading: loadingPr } = trpc.compliance.listProjectReadiness.useQuery();

  const adminApprovePreviewMutation = trpc.onboarding.adminApprovePreview.useMutation({
    onSuccess: () => utils.compliance.listProjectReadiness.invalidate(),
  });
  const adminReleaseLaunchMutation = trpc.onboarding.adminReleaseLaunch.useMutation({
    onSuccess: () => utils.compliance.listProjectReadiness.invalidate(),
  });

  const handleApprovePreview = async (projectId: number, businessName: string) => {
    try {
      await adminApprovePreviewMutation.mutateAsync({ projectId });
      toast.success(`Preview approved for ${businessName}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve preview");
    }
  };

  const handleReleaseLaunch = async (projectId: number, businessName: string) => {
    try {
      await adminReleaseLaunchMutation.mutateAsync({ projectId });
      toast.success(`Launch released for ${businessName}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to release launch");
    }
  };

  const systemSafe = readiness && readiness.db && readiness.stripe && readiness.email && readiness.anthropic
    && !readiness.enableAutoDeployEnv && !readiness.enableAutoDomainPurchaseEnv;
  const dangerousAutomationsOff = readiness && !Object.values(
    Object.fromEntries(LEAD_ENGINE_KEYS.map(k => [k.key, readiness.automationSettings[k.key]]))
  ).some(v => v === "true");

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">System health, legal compliance, automation gates, and per-project launch status.</p>
      </div>

      {/* ── Summary Banner ── */}
      {!loadingR && readiness && (
        <div className={`rounded-lg border p-4 flex items-start gap-3 ${systemSafe && dangerousAutomationsOff ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}`}>
          {systemSafe && dangerousAutomationsOff
            ? <CheckCircle2 size={18} className="text-green-400 mt-0.5 shrink-0" />
            : <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />}
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              {systemSafe && dangerousAutomationsOff ? "System is safe to operate" : "Action required — review items below"}
            </p>
            <p className="text-xs text-muted-foreground">
              DB: {readiness.db ? "✓" : "✗"} · Stripe: {readiness.stripe ? "✓" : "✗"} · Email: {readiness.email ? "✓" : "✗"} · AI: {readiness.anthropic ? "✓" : "✗"} · Auto-deploy: {readiness.enableAutoDeployEnv ? "ON ⚠" : "OFF ✓"} · Auto-domain: {readiness.enableAutoDomainPurchaseEnv ? "ON ⚠" : "OFF ✓"} · Lead engine: {readiness.automationSettings["lead_engine_active"] === "true" ? "ACTIVE ⚠" : "off ✓"}
            </p>
          </div>
        </div>
      )}

      {/* ── Action Queue ── */}
      {projects && (() => {
        const needsPreviewApproval = projects.filter((p: any) => p.stage === "pending_admin_review");
        const needsLaunchRelease = projects.filter((p: any) =>
          p.stage === "final_approval" && p.approvedAt && !p.adminLaunchApprovedAt
        );
        const failed = projects.filter((p: any) => p.generationStatus === "failed");
        const totalActions = needsPreviewApproval.length + needsLaunchRelease.length + failed.length;
        if (totalActions === 0) return null;
        return (
          <Card className="border-orange-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck size={16} className="text-orange-400" />
                Action Queue
                <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/20 ml-1">{totalActions}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needsPreviewApproval.map((p: any) => (
                <div key={`preview-${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-rose-400 shrink-0" />
                    <span className="text-sm font-medium">{p.businessName}</span>
                    <span className="text-xs text-muted-foreground">— site generated, needs admin preview approval</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApprovePreview(p.id, p.businessName)}
                    disabled={adminApprovePreviewMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs"
                  >
                    {adminApprovePreviewMutation.isPending
                      ? <Loader2 size={12} className="animate-spin mr-1" />
                      : <Eye size={12} className="mr-1" />}
                    Approve Preview
                  </Button>
                </div>
              ))}
              {needsLaunchRelease.map((p: any) => (
                <div key={`launch-${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <div className="flex items-center gap-2">
                    <Rocket size={14} className="text-teal-400 shrink-0" />
                    <span className="text-sm font-medium">{p.businessName}</span>
                    <span className="text-xs text-muted-foreground">— customer approved, waiting for admin launch release</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReleaseLaunch(p.id, p.businessName)}
                    disabled={adminReleaseLaunchMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white h-7 text-xs"
                  >
                    {adminReleaseLaunchMutation.isPending
                      ? <Loader2 size={12} className="animate-spin mr-1" />
                      : <Rocket size={12} className="mr-1" />}
                    Release Launch
                  </Button>
                </div>
              ))}
              {failed.map((p: any) => (
                <div key={`fail-${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-sm font-medium">{p.businessName}</span>
                    <span className="text-xs text-muted-foreground">— generation failed, manual intervention required</span>
                  </div>
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">Check Onboarding Projects</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* ── A. Global System Readiness ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingR ? (
            <div className="space-y-3">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : readiness ? (
            <div>
              <ReadinessRow icon={Database} label="Database" ok={readiness.db} />
              <ReadinessRow icon={CreditCard} label="Stripe secret key + webhook secret" ok={readiness.stripe} />
              <ReadinessRow icon={Mail} label="Email (Resend)" ok={readiness.email} />
              <ReadinessRow icon={Globe} label="Namecheap (domain registration)" ok={readiness.namecheap} warn={!readiness.namecheap} detail="Optional — manual domain provisioning is safe" />
              <ReadinessRow icon={Cloud} label="Cloudflare (site deployment)" ok={readiness.cloudflare} warn={!readiness.cloudflare} detail="Optional — sites can be deployed manually" />
              <ReadinessRow icon={Brain} label="Anthropic API (AI / Elena)" ok={readiness.anthropic} />
              <ReadinessRow icon={Zap} label="ENABLE_AUTO_DEPLOY env gate" ok={!readiness.enableAutoDeployEnv} detail={readiness.enableAutoDeployEnv ? "ACTIVE — auto-deploy will fire on customer approval" : "Off — safe, manual deploy required"} />
              <ReadinessRow icon={Globe} label="ENABLE_AUTO_DOMAIN_PURCHASE env gate" ok={!readiness.enableAutoDomainPurchaseEnv} warn={readiness.enableAutoDomainPurchaseEnv} detail={readiness.enableAutoDomainPurchaseEnv ? "ACTIVE — domains will be auto-purchased" : "Off — manual domain setup required"} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load readiness data.</p>
          )}
        </CardContent>
      </Card>

      {/* ── B. Lead Engine Automation Gates ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain size={16} />
            Lead Engine — Dangerous Automations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingR ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : readiness ? (
            <div>
              {LEAD_ENGINE_KEYS.map((k) => (
                <AutomationKeyRow key={k.key} keyDef={k} settings={readiness.automationSettings} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── B2. Automation DB Settings ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap size={16} />
            Automation DB Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingR ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : readiness ? (
            <div>
              {AUTOMATION_KEYS.map((k) => (
                <AutomationKeyRow key={k.key} keyDef={k} settings={readiness.automationSettings} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── C. Legal Vault Summary ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} />
            Legal Compliance Summary
            <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => navigate("/admin/legal")}>
              <ExternalLink size={12} className="mr-1" />Open Legal Vault
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{agreements?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Customer Agreements</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{paperwork?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rep Paperwork Forms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {agreements ? agreements.filter(a => a.checkoutSessionId).length : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Stripe-Linked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {agreements ? agreements.filter(a => !a.checkoutSessionId).length : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Awaiting Stripe Link</p>
            </div>
          </div>
          {!loadingA && !agreements?.length && (
            <p className="text-sm text-muted-foreground py-2 mt-2">No customer agreements on record yet.</p>
          )}
        </CardContent>
      </Card>

      {/* ── E. Domain / Launch Readiness per Project ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket size={16} />
            Per-Project Launch Status
            {projects && (
              <Badge variant="secondary" className="ml-1">{projects.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPr ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !projects?.length ? (
            <p className="text-sm text-muted-foreground py-4">No onboarding projects yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => {
                const hasSite = !!p.generatedSiteUrl || p.generationStatus === "complete";
                const hasCloudflare = !!p.cloudflareProjectName;
                const approved = !!p.approvedAt;
                const live = !!p.liveUrl || p.stage === "launch" || p.stage === "complete";
                const verdict = computeProjectVerdict(p);
                const domainDisplay = p.domainName ?? p.existingDomain ?? (p.domainOption === "existing" ? "Existing domain (not set)" : p.domainOption === "new" ? "New domain (not registered)" : "No domain");

                return (
                  <div key={p.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{p.businessName}</p>
                        <p className="text-xs text-muted-foreground">{p.contactEmail} · {p.packageTier}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className={`${stageColor(p.stage)} text-xs`}>{p.stage}</Badge>
                        <Badge className={`${verdict.color} text-xs`}>{verdict.label}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {hasSite
                          ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                          : <XCircle size={13} className="text-muted-foreground shrink-0" />}
                        <span className={hasSite ? "text-foreground" : "text-muted-foreground"}>Site generated</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasCloudflare
                          ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                          : <AlertTriangle size={13} className="text-yellow-400 shrink-0" />}
                        <span className={hasCloudflare ? "text-foreground" : "text-yellow-400"}>
                          {hasCloudflare ? p.cloudflareProjectName : "No CF project"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(p.domainName || p.existingDomain)
                          ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                          : <AlertTriangle size={13} className="text-yellow-400 shrink-0" />}
                        <span className={(p.domainName || p.existingDomain) ? "text-foreground" : "text-yellow-400"}>
                          {domainDisplay}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {live
                          ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                          : approved
                            ? <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
                            : <XCircle size={13} className="text-muted-foreground shrink-0" />}
                        <span className={live ? "text-green-400" : approved ? "text-yellow-400" : "text-muted-foreground"}>
                          {live ? (p.liveUrl ?? "Live") : approved ? "Awaiting deploy" : "Not launched"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs pt-1">
                      <div className="flex items-center gap-1">
                        {(p as any).adminPreviewApprovedAt
                          ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                          : <XCircle size={11} className="text-muted-foreground shrink-0" />}
                        <span className={(p as any).adminPreviewApprovedAt ? "text-foreground" : "text-muted-foreground"}>
                          Admin preview: {(p as any).adminPreviewApprovedAt ? "APPROVED" : "PENDING"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {approved
                          ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                          : <XCircle size={11} className="text-muted-foreground shrink-0" />}
                        <span className={approved ? "text-foreground" : "text-muted-foreground"}>
                          Customer approved: {approved ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(p as any).adminLaunchApprovedAt
                          ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                          : <XCircle size={11} className="text-muted-foreground shrink-0" />}
                        <span className={(p as any).adminLaunchApprovedAt ? "text-foreground" : "text-muted-foreground"}>
                          Admin launch release: {(p as any).adminLaunchApprovedAt ? "RELEASED" : "BLOCKED"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {live
                          ? <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                          : <XCircle size={11} className="text-muted-foreground shrink-0" />}
                        <span className={live ? "text-green-400" : "text-muted-foreground"}>
                          Deployed: {live ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <FileText size={11} className="shrink-0" />
                        Revisions saved: <span className="text-foreground font-medium ml-0.5">{(p as any).versionCount ?? 0}</span>
                      </span>
                      <span className={`flex items-center gap-1 ${(p as any).agreementSigned ? "text-green-400" : "text-red-400"}`}>
                        {(p as any).agreementSigned
                          ? <CheckCircle2 size={11} className="shrink-0" />
                          : <XCircle size={11} className="shrink-0" />}
                        Legal agreement: {(p as any).agreementSigned ? "SIGNED" : "MISSING"}
                      </span>
                      {(p as any).blueprintStatus && (
                        <span className={`flex items-center gap-1 ${(p as any).blueprintStatus === "approved" ? "text-green-400" : (p as any).blueprintStatus === "customer_review" ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {(p as any).blueprintStatus === "approved"
                            ? <CheckCircle2 size={11} className="shrink-0" />
                            : <AlertTriangle size={11} className="shrink-0" />}
                          Blueprint: {((p as any).blueprintStatus as string).replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}
                      {p.approvedAt && (
                        <span>Customer approved: {new Date(p.approvedAt).toLocaleString()}{!live && !hasCloudflare ? " — manual deploy needed" : ""}</span>
                      )}
                    </div>
                    {(p.domainName || p.existingDomain) && !live && (
                      <div className="flex items-start gap-1.5 text-xs text-yellow-500/80">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>Domain email: Customer has been contacted about checking existing email before DNS cutover.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
