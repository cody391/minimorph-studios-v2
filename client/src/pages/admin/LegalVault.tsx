import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText, Users, Shield, CheckCircle2, XCircle, AlertTriangle,
  Download, Eye,
} from "lucide-react";

const REP_FORMS = ["w9_tax", "hr_employment", "payroll_setup", "rep_agreement"] as const;
type RepFormType = typeof REP_FORMS[number];

const FORM_LABELS: Record<RepFormType, string> = {
  w9_tax: "W-9 Tax",
  hr_employment: "Employment Agreement",
  payroll_setup: "Payroll Setup",
  rep_agreement: "Rep Agreement",
};

function legalStatusBadge(agreement: {
  signerName: string | null;
  projectId: number | null;
  checkoutSessionId: string | null;
  packageSnapshot: unknown;
  contractId: number | null;
}) {
  if (!agreement.signerName) return { label: "MISSING SIGNATURE", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (!agreement.projectId) return { label: "MISSING PROJECT LINK", color: "bg-red-500/15 text-red-400 border-red-500/20" };
  if (!agreement.packageSnapshot || Object.keys(agreement.packageSnapshot as object).length === 0)
    return { label: "MISSING PACKAGE SNAPSHOT", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" };
  if (!agreement.checkoutSessionId) return { label: "MISSING STRIPE LINK", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" };
  return { label: "COMPLETE", color: "bg-green-500/15 text-green-400 border-green-500/20" };
}

function repLegalStatusBadge(forms: string[]) {
  const hasAll = REP_FORMS.every(f => forms.includes(f));
  if (hasAll) return { label: "COMPLETE", color: "bg-green-500/15 text-green-400 border-green-500/20" };
  const missing = REP_FORMS.filter(f => !forms.includes(f));
  if (missing.length === REP_FORMS.length) return { label: "NOT TRACKED YET", color: "bg-gray-500/15 text-gray-400 border-gray-500/20" };
  return { label: `INCOMPLETE — missing: ${missing.map(f => FORM_LABELS[f as RepFormType]).join(", ")}`, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" };
}

export default function LegalVault() {
  const [viewingId, setViewingId] = useState<number | null>(null);

  const { data: agreements, isLoading: loadingA } = trpc.compliance.listCustomerAgreements.useQuery();
  const { data: paperwork, isLoading: loadingP } = trpc.compliance.listRepPaperwork.useQuery({});

  const { data: agreementHtml, isLoading: loadingHtml } = trpc.compliance.generateAgreementHtml.useQuery(
    { agreementId: viewingId! },
    { enabled: viewingId != null }
  );

  const handleView = (id: number) => setViewingId(id);

  const handleDownload = (html: string, id: number) => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agreement-${id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Agreement downloaded");
  };

  const handlePrint = (html: string) => {
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup blocked — please allow popups"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Group paperwork by repId
  const repMap: Record<number, { forms: string[]; rows: typeof paperwork }> = {};
  for (const row of paperwork ?? []) {
    if (!repMap[row.repId]) repMap[row.repId] = { forms: [], rows: [] };
    if (!repMap[row.repId].forms.includes(row.formType)) repMap[row.repId].forms.push(row.formType);
    repMap[row.repId].rows!.push(row);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield size={22} />
          Legal Vault
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Customer agreements, rep paperwork, and legal compliance records.</p>
      </div>

      {/* Agreement viewer modal */}
      {viewingId != null && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm">Agreement #{viewingId}</CardTitle>
            <div className="flex items-center gap-2">
              {agreementHtml && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handlePrint(agreementHtml.html)}>
                    <Eye size={13} className="mr-1" />View / Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(agreementHtml.html, viewingId)}>
                    <Download size={13} className="mr-1" />Download
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => setViewingId(null)}>Close</Button>
            </div>
          </CardHeader>
          {loadingHtml && <CardContent><Skeleton className="h-12 w-full" /></CardContent>}
        </Card>
      )}

      {/* Customer Agreements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} />
            Customer Legal Agreements
            {agreements && <Badge variant="secondary" className="ml-1">{agreements.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingA ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !agreements?.length ? (
            <p className="text-sm text-muted-foreground py-4">No customer agreements on record yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">ID</th>
                    <th className="text-left py-2 pr-3">Signer</th>
                    <th className="text-left py-2 pr-3">Project</th>
                    <th className="text-left py-2 pr-3">Version</th>
                    <th className="text-left py-2 pr-3">Accepted</th>
                    <th className="text-left py-2 pr-3">IP</th>
                    <th className="text-left py-2 pr-3">Stripe Session</th>
                    <th className="text-left py-2 pr-3">Contract</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => {
                    const status = legalStatusBadge(a as any);
                    return (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2 pr-3 font-mono text-xs">#{a.id}</td>
                        <td className="py-2 pr-3 text-xs font-medium">{a.signerName ?? <span className="text-red-400">MISSING</span>}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{a.projectId ? `#${a.projectId}` : <span className="text-red-400">MISSING</span>}</td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className="text-xs">{a.termsVersion ?? "—"}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">
                          {a.acceptedAt ? new Date(a.acceptedAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{a.ipAddress ?? "—"}</td>
                        <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">
                          {a.checkoutSessionId
                            ? <span title={a.checkoutSessionId}>{a.checkoutSessionId.slice(0, 16)}…</span>
                            : <span className="text-yellow-400">MISSING</span>}
                        </td>
                        <td className="py-2 pr-3">
                          {a.contractId
                            ? <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs">#{a.contractId}</Badge>
                            : <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-xs">Pending</Badge>}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => handleView(a.id)}
                          >
                            <Eye size={11} className="mr-1" />View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rep Paperwork */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={16} />
            Rep Paperwork Submissions
            {paperwork && <Badge variant="secondary" className="ml-1">{paperwork.length} form(s) across {Object.keys(repMap).length} rep(s)</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingP ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !paperwork?.length ? (
            <p className="text-sm text-muted-foreground py-4">No rep paperwork submissions on record yet. Reps must complete paperwork during onboarding.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(repMap).map(([repIdStr, { forms, rows }]) => {
                const repId = Number(repIdStr);
                const status = repLegalStatusBadge(forms);
                return (
                  <div key={repId} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Rep #{repId}</p>
                      <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {REP_FORMS.map(f => (
                        <Badge
                          key={f}
                          className={forms.includes(f)
                            ? "bg-green-500/15 text-green-400 border-green-500/20 text-xs"
                            : "bg-red-500/15 text-red-400 border-red-500/20 text-xs"}
                        >
                          {forms.includes(f) ? <CheckCircle2 size={10} className="mr-1 inline" /> : <XCircle size={10} className="mr-1 inline" />}
                          {FORM_LABELS[f]}
                        </Badge>
                      ))}
                    </div>
                    <table className="w-full text-xs min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                          <th className="text-left py-1 pr-3">Form</th>
                          <th className="text-left py-1 pr-3">Version</th>
                          <th className="text-left py-1 pr-3">Signer</th>
                          <th className="text-left py-1 pr-3">IP</th>
                          <th className="text-left py-1">Signed at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows!.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-1 pr-3">
                              <Badge variant="outline" className="text-xs">{p.formType}</Badge>
                            </td>
                            <td className="py-1 pr-3 text-muted-foreground">{p.formVersion ?? "—"}</td>
                            <td className="py-1 pr-3">{p.signerName ?? "—"}</td>
                            <td className="py-1 pr-3 text-muted-foreground font-mono">{p.signedIpAddress ?? "—"}</td>
                            <td className="py-1 text-muted-foreground">
                              {p.signedAt ? new Date(p.signedAt).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              <div className="text-xs text-yellow-400/80 flex items-start gap-1.5 pt-2">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>Rep paperwork tracking is software-enforced for: W-9 Tax, Employment Agreement, Payroll Setup, Rep Agreement. If historical reps pre-date this system, data will appear as "NOT TRACKED YET" — manual review required for those reps.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
