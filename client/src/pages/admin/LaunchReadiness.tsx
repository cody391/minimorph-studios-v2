import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, XCircle, AlertTriangle, Database, CreditCard,
  Mail, Globe, Cloud, Brain, Zap, Shield, FileText, Users, Rocket,
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

export default function LaunchReadiness() {
  const { data: readiness, isLoading: loadingR } = trpc.compliance.getSystemReadiness.useQuery();
  const { data: agreements, isLoading: loadingA } = trpc.compliance.listCustomerAgreements.useQuery();
  const { data: paperwork, isLoading: loadingP } = trpc.compliance.listRepPaperwork.useQuery({});
  const { data: projects, isLoading: loadingPr } = trpc.compliance.listProjectReadiness.useQuery();

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">System health, legal compliance, automation gates, and per-project launch status.</p>
      </div>

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

      {/* ── C. Customer Legal Files ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} />
            Customer Legal Agreements
            {agreements && (
              <Badge variant="secondary" className="ml-1">{agreements.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingA ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !agreements?.length ? (
            <p className="text-sm text-muted-foreground py-4">No customer agreements on record yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Signer</th>
                    <th className="text-left py-2 pr-3">Version</th>
                    <th className="text-left py-2 pr-3">Accepted</th>
                    <th className="text-left py-2 pr-3">IP</th>
                    <th className="text-left py-2 pr-3">Contract</th>
                    <th className="text-left py-2 pr-3">Session</th>
                    <th className="text-left py-2">Project</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 pr-3 font-medium text-xs">{a.signerName ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-xs">{a.termsVersion ?? "—"}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">
                        {a.acceptedAt ? new Date(a.acceptedAt).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{a.ipAddress ?? "—"}</td>
                      <td className="py-2 pr-3">
                        {a.contractId ? (
                          <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">#{a.contractId}</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">Pending</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">
                        {a.checkoutSessionId ? a.checkoutSessionId.slice(0, 14) + "…" : "—"}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {a.projectId ? `#${a.projectId}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── D. Rep Legal Files ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} />
            Rep Paperwork Submissions
            {paperwork && (
              <Badge variant="secondary" className="ml-1">{paperwork.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingP ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !paperwork?.length ? (
            <p className="text-sm text-muted-foreground py-4">No rep paperwork submissions on record yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Rep ID</th>
                    <th className="text-left py-2 pr-3">Form</th>
                    <th className="text-left py-2 pr-3">Version</th>
                    <th className="text-left py-2 pr-3">Signer</th>
                    <th className="text-left py-2 pr-3">IP</th>
                    <th className="text-left py-2">Signed at</th>
                  </tr>
                </thead>
                <tbody>
                  {paperwork.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 pr-3 font-mono text-xs">{p.repId}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-xs">{p.formType}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">{p.formVersion ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs">{p.signerName ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{p.signedIpAddress ?? "—"}</td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {p.signedAt ? new Date(p.signedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                const domainReady = p.domainOption === "existing"
                  ? !!p.existingDomain
                  : p.domainOption === "new"
                    ? !!p.domainRegistered
                    : false;
                const approved = !!p.approvedAt;
                const live = !!p.liveUrl || p.stage === "launch" || p.stage === "complete";
                const manualRequired = !hasCloudflare || (p.domainOption === "new" && !p.domainRegistered);

                return (
                  <div key={p.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{p.businessName}</p>
                        <p className="text-xs text-muted-foreground">{p.contactEmail} · {p.packageTier}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className={`${stageColor(p.stage)} text-xs`}>{p.stage}</Badge>
                        {live && <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">LIVE</Badge>}
                        {approved && !live && <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">APPROVED</Badge>}
                        {manualRequired && !live && <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">MANUAL REQUIRED</Badge>}
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
                        {p.domainName
                          ? <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                          : p.domainOption === "existing"
                            ? <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
                            : <XCircle size={13} className="text-muted-foreground shrink-0" />}
                        <span className={p.domainName ? "text-foreground" : "text-muted-foreground"}>
                          {p.domainName ?? (p.domainOption === "existing" ? "Existing domain" : p.domainOption === "new" ? "New domain" : "No domain")}
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

                    {p.approvedAt && (
                      <p className="text-xs text-muted-foreground">
                        Customer approved: {new Date(p.approvedAt).toLocaleString()}
                        {!live && !hasCloudflare && " — manual deploy needed (Cloudflare not configured)"}
                      </p>
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
