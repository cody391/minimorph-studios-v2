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
  // launch + custom domain = deployed but DNS not yet confirmed
  if (p.stage === "launch" && p.domainName) {
    return { label: "DNS PENDING — not yet live", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
  }
  const live = p.stage === "complete" || (p.stage === "launch" && !p.domainName);
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
  const adminConfirmDomainLiveMutation = trpc.onboarding.adminConfirmDomainLive.useMutation({
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
    // Step 1: dryRun to get blocker list before committing
    let dryRunResult: any;
    try {
      dryRunResult = await adminReleaseLaunchMutation.mutateAsync({ projectId, dryRun: true });
    } catch (e: any) {
      // approvedAt / project-not-found errors surface here
      toast.error(e?.message || "Pre-flight check failed");
      return;
    }

    if (!dryRunResult?.ready) {
      const blockers: string[] = dryRunResult?.blockers ?? [];
      const requiresOverride: boolean = dryRunResult?.requiresOverride ?? false;

      // Hard blockers cannot be overridden — show them and stop
      if (blockers.length > 0) {
        toast.error(`Cannot release ${businessName} — ${blockers.length} blocker(s):\n• ${blockers.join("\n• ")}`, { duration: 8000 });
        return;
      }

      // Only manual add-on warnings require typed acknowledgment
      if (requiresOverride) {
        const warnings: string[] = dryRunResult?.warnings ?? [];
        const reason = window.prompt(
          `Manual fulfillment acknowledgment required for ${businessName}:\n\n${warnings.join("\n")}\n\nThese add-ons require manual team action after launch. Provide a reason (min 20 chars) to confirm you understand this:`,
        );
        if (!reason || reason.trim().length < 20) {
          toast.error("Launch cancelled — acknowledgment reason must be at least 20 characters.");
          return;
        }
        if (!window.confirm(`Confirm launch for ${businessName} with manual add-on override?\n\nOverride reason recorded: "${reason.trim()}"`)) return;
        try {
          await adminReleaseLaunchMutation.mutateAsync({
            projectId,
            acknowledgeManualAddons: true,
            overrideReason: reason.trim(),
          });
          toast.success(`Launch released for ${businessName} (manual add-on override recorded)`);
        } catch (e2: any) {
          toast.error(e2?.message || "Launch release failed");
        }
        return;
      }

      toast.error(`Cannot release ${businessName} — readiness check failed`);
      return;
    }

    // Step 2: clean — confirm and proceed
    if (!window.confirm(`Pre-flight passed for ${businessName}.\n\nAll readiness blockers cleared. Release for deployment?`)) return;
    try {
      await adminReleaseLaunchMutation.mutateAsync({ projectId });
      toast.success(`Launch released for ${businessName}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to release launch");
    }
  };

  const handleConfirmDomainLive = async (projectId: number, businessName: string, domain: string) => {
    if (!window.confirm(`Verify Domain Live: ${domain}\n\nThis will attempt to automatically verify ${domain} is reachable. If verification fails, you will be asked for a manual override reason.\n\nThis action will:\n• Mark project as complete\n• Send the "you're live" celebration email\n• Activate the nurturing pipeline\n\nOnly confirm if DNS has propagated.`)) return;
    try {
      await adminConfirmDomainLiveMutation.mutateAsync({ projectId });
      toast.success(`Domain verified and confirmed live for ${businessName}`);
    } catch (e: any) {
      const msg: string = e?.message || "";
      if (msg.includes("not yet reachable") || msg.includes("DNS may still")) {
        const reason = window.prompt(`Manual override reason required (min 20 chars):\n\n${msg}\n\nProvide a reason why you're confirming this domain as live despite the failed check:`);
        if (!reason || reason.trim().length < 20) {
          toast.error("Override cancelled — reason must be at least 20 characters.");
          return;
        }
        try {
          await adminConfirmDomainLiveMutation.mutateAsync({ projectId, overrideReason: reason.trim() });
          toast.success(`Domain confirmed live for ${businessName} (manual override recorded)`);
        } catch (e2: any) {
          toast.error(e2?.message || "Override failed");
        }
      } else {
        toast.error(msg || "Failed to confirm domain live");
      }
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

      {/* ── Fulfillment Truth Notice ── */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-400">
            <AlertTriangle size={16} />
            Manual Fulfillment Required After Launch
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>The following add-ons are <strong className="text-foreground">not automated</strong>. When you release a launch, you must complete these manually within 24 hours and notify the customer:</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong className="text-foreground">Google Analytics</strong> — GA4 tag must be injected into the deployed site HTML manually</li>
            <li><strong className="text-foreground">Facebook Pixel</strong> — Pixel code must be injected into the deployed site HTML manually</li>
            <li><strong className="text-foreground">SMS Lead Alerts</strong> — Twilio integration must be configured manually per customer</li>
            <li><strong className="text-foreground">AI Photography</strong> — Images must be generated and uploaded to the customer portal manually</li>
            <li><strong className="text-foreground">Logo Design</strong> — Logo concepts must be created and uploaded to the customer portal manually</li>
            <li><strong className="text-foreground">AI Chatbot</strong> — Widget embed must be added to the deployed site manually</li>
            <li><strong className="text-foreground">Review Collector</strong> — SMS automation requires Twilio setup per customer</li>
            <li><strong className="text-foreground">Event Calendar</strong> — /events page must be created and deployed manually</li>
            <li><strong className="text-foreground">Video Background</strong> — Video must be sourced and injected into the site via a redeploy</li>
            <li><strong className="text-foreground">Email Marketing</strong> — Resend audience + sequence is written; you must activate sending manually</li>
            <li><strong className="text-foreground">Custom Domain</strong> — Customer receives DNS instructions; site is NOT live at their domain until DNS propagates (no celebration email sent until verified)</li>
          </ul>
          <p className="text-amber-400/80 font-medium pt-1">QA issues flagged as "manual review required" are real issues — the QA system does not auto-fix anything.</p>
        </CardContent>
      </Card>

      {/* ── Action Queue ── */}
      {projects && (() => {
        const needsPreviewApproval = projects.filter((p: any) => p.stage === "pending_admin_review");
        const needsLaunchRelease = projects.filter((p: any) =>
          p.stage === "final_approval" && p.approvedAt && !p.adminLaunchApprovedAt
        );
        const dnsPending = projects.filter((p: any) => p.stage === "launch" && p.domainName);
        const failed = projects.filter((p: any) => p.generationStatus === "failed");
        const totalActions = needsPreviewApproval.length + needsLaunchRelease.length + dnsPending.length + failed.length;
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
              {dnsPending.map((p: any) => (
                <div key={`dns-${p.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-amber-400 shrink-0" />
                    <span className="text-sm font-medium">{p.businessName}</span>
                    <span className="text-xs text-muted-foreground">— deployed, waiting for DNS propagation on {p.domainName}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConfirmDomainLive(p.id, p.businessName, p.domainName)}
                    disabled={adminConfirmDomainLiveMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
                  >
                    {adminConfirmDomainLiveMutation.isPending
                      ? <Loader2 size={12} className="animate-spin mr-1" />
                      : <CheckCircle2 size={12} className="mr-1" />}
                    Confirm Domain Live
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
                const dnsPendingProject = p.stage === "launch" && p.domainName;
                const live = !dnsPendingProject && (p.stage === "complete" || (p.stage === "launch" && !p.domainName));
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
                          : dnsPendingProject
                            ? <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                            : approved
                              ? <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
                              : <XCircle size={13} className="text-muted-foreground shrink-0" />}
                        <span className={live ? "text-green-400" : dnsPendingProject ? "text-amber-400" : approved ? "text-yellow-400" : "text-muted-foreground"}>
                          {live ? (p.liveUrl ?? "Live") : dnsPendingProject ? `DNS pending: ${p.domainName}` : approved ? "Awaiting deploy" : "Not launched"}
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
                      <span className={`flex items-center gap-1 ${(p as any).paymentConfirmedAt ? "text-green-400" : "text-muted-foreground"}`}>
                        {(p as any).paymentConfirmedAt
                          ? <CheckCircle2 size={11} className="shrink-0" />
                          : <XCircle size={11} className="shrink-0" />}
                        Payment: {(p as any).paymentConfirmedAt ? "CONFIRMED" : "PENDING"}
                      </span>
                      <span className={`flex items-center gap-1 ${p.approvedAt ? "text-green-400" : "text-muted-foreground"}`}>
                        {p.approvedAt
                          ? <CheckCircle2 size={11} className="shrink-0" />
                          : <XCircle size={11} className="shrink-0" />}
                        Final site approval: {p.approvedAt ? `APPROVED ${new Date(p.approvedAt).toLocaleString()}${!live && !hasCloudflare ? " — manual deploy needed" : ""}` : "PENDING"}
                      </span>
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
