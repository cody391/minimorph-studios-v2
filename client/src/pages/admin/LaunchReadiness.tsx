import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, XCircle, AlertTriangle, Database, CreditCard,
  Mail, Globe, Cloud, Brain, Zap, Shield, FileText, Users,
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

export default function LaunchReadiness() {
  const { data: readiness, isLoading: loadingR } = trpc.compliance.getSystemReadiness.useQuery();
  const { data: agreements, isLoading: loadingA } = trpc.compliance.listCustomerAgreements.useQuery();
  const { data: paperwork, isLoading: loadingP } = trpc.compliance.listRepPaperwork.useQuery({});

  const autoKeys = [
    { key: "auto_deploy_enabled", label: "Auto deploy" },
    { key: "auto_commission_enabled", label: "Auto commission" },
    { key: "auto_close_pipeline_enabled", label: "Auto close pipeline" },
    { key: "auto_email_sequences_enabled", label: "Auto email sequences" },
    { key: "auto_contract_generation_enabled", label: "Auto contract generation" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch Readiness</h1>
        <p className="text-sm text-muted-foreground mt-1">System health, legal compliance, and automation gate status.</p>
      </div>

      {/* ── System Readiness ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={16} />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingR ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : readiness ? (
            <div>
              <ReadinessRow icon={Database} label="Database" ok={readiness.db} />
              <ReadinessRow icon={CreditCard} label="Stripe secret key + webhook secret" ok={readiness.stripe} />
              <ReadinessRow icon={Mail} label="Email (Resend)" ok={readiness.email} />
              <ReadinessRow icon={Globe} label="Namecheap (domain registration)" ok={readiness.namecheap} warn={!readiness.namecheap} detail="Optional — manual domain provisioning is safe" />
              <ReadinessRow icon={Cloud} label="Cloudflare (site deployment)" ok={readiness.cloudflare} warn={!readiness.cloudflare} detail="Optional — sites can be deployed manually" />
              <ReadinessRow icon={Brain} label="Anthropic API (AI)" ok={readiness.anthropic} />
              <ReadinessRow icon={Zap} label="ENABLE_AUTO_DEPLOY env gate" ok={!readiness.enableAutoDeployEnv} detail={readiness.enableAutoDeployEnv ? "ACTIVE — auto-deploy will fire" : "Off — safe"} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load readiness data.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Automation DB Settings ── */}
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
              {autoKeys.map(({ key, label }) => {
                const val = readiness.automationSettings[key];
                const isOn = val === "true";
                return (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {isOn ? (
                        <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
                      ) : (
                        <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                      )}
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground font-mono">{key}</span>
                    </div>
                    <StatusBadge ok={!isOn} warn={isOn} label={isOn ? "ON" : "OFF"} />
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Customer Agreements ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} />
            Customer Agreements
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
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 pr-4">Signer</th>
                    <th className="text-left py-2 pr-4">Terms version</th>
                    <th className="text-left py-2 pr-4">Accepted</th>
                    <th className="text-left py-2 pr-4">IP</th>
                    <th className="text-left py-2 pr-4">Contract</th>
                    <th className="text-left py-2">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 pr-4 font-medium">{a.signerName ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs">{a.termsVersion ?? "—"}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">
                        {a.acceptedAt ? new Date(a.acceptedAt).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{a.ipAddress ?? "—"}</td>
                      <td className="py-2 pr-4">
                        {a.contractId ? (
                          <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">Linked #{a.contractId}</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">Pending</Badge>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground font-mono text-xs">
                        {a.checkoutSessionId ? a.checkoutSessionId.slice(0, 16) + "…" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Rep Paperwork ── */}
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
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 pr-4">Rep ID</th>
                    <th className="text-left py-2 pr-4">Form type</th>
                    <th className="text-left py-2 pr-4">Version</th>
                    <th className="text-left py-2 pr-4">Signer</th>
                    <th className="text-left py-2">Signed at</th>
                  </tr>
                </thead>
                <tbody>
                  {paperwork.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 pr-4 font-mono text-xs">{p.repId}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs">{p.formType}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{p.formVersion ?? "—"}</td>
                      <td className="py-2 pr-4">{p.signerName ?? "—"}</td>
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
    </div>
  );
}
