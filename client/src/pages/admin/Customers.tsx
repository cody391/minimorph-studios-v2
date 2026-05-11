import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Heart, AlertTriangle, XCircle, DollarSign, TrendingUp,
  ClipboardList, Headphones, MessageCircle, BarChart3, FileText,
  CheckCircle, Clock, Globe, AlertCircle, ArrowRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// ── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; icon: any }> = {
  active: { color: "badge-success", icon: Heart },
  at_risk: { color: "badge-pending", icon: AlertTriangle },
  churned: { color: "badge-danger", icon: XCircle },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  if (cents === 0) return "$0";
  if (cents < 100) return `¢${cents}`;
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: any) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function fmtMoney(val: any) {
  const n = Number(val);
  return isNaN(n) || val == null ? "—" : `$${n.toLocaleString()}`;
}

function fmtDateTime(d: any) {
  return d ? new Date(d).toLocaleString() : "—";
}

const COST_TYPE_LABELS: Record<string, string> = {
  scraping: "Scraping",
  enrichment: "Enrichment",
  outreach_email: "Email",
  outreach_sms: "SMS",
  outreach_call: "Call",
  ai_generation: "AI Gen",
  ai_conversation: "AI Chat",
  ai_coaching: "AI Coach",
  ai_monthly: "AI Monthly",
  domain: "Domain",
  hosting: "Hosting",
  commission: "Commission",
  commission_recurring: "Commission (rec.)",
  phone_number: "Phone #",
};

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/20 text-amber-400",
  active: "bg-emerald-500/20 text-emerald-400",
  expiring_soon: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  renewed: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-zinc-500/20 text-zinc-400",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-red-500/20 text-red-400",
  refunded: "bg-zinc-500/20 text-zinc-400",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/20 text-red-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  closed: "bg-zinc-500/20 text-zinc-400",
};

const ONBOARDING_STAGE_LABELS: Record<string, string> = {
  intake: "Intake",
  questionnaire: "Questionnaire",
  assets_upload: "Assets Upload",
  design: "Designing",
  review: "Review",
  revisions: "Revisions",
  final_approval: "Final Approval",
  launch: "Launching",
  complete: "Complete",
};

type TabKey = "overview" | "billing" | "onboarding" | "support" | "nurture" | "reports";

// ── Suggested next action ────────────────────────────────────────────────────

function suggestNextAction(
  customer: any,
  project: any | null,
  openTicketCount: number,
  contracts: any[]
) {
  if (customer.status === "at_risk") return { label: "Fix payment issue", color: "bg-red-500/20 text-red-400" };
  if (project?.generationStatus === "failed") return { label: "Review failed build", color: "bg-red-500/20 text-red-400" };
  if (openTicketCount > 0) return { label: "Resolve support ticket", color: "bg-amber-500/20 text-amber-400" };
  if (!project) return { label: "Verify onboarding project", color: "bg-amber-500/20 text-amber-400" };
  if (["intake", "questionnaire", "assets_upload"].includes(project.stage)) {
    return { label: "Help customer complete onboarding", color: "bg-amber-500/20 text-amber-400" };
  }
  const hasActiveContract = contracts.some((c: any) => c.status === "active");
  if (!hasActiveContract) return { label: "Review contract status", color: "bg-amber-500/20 text-amber-400" };
  return { label: "Monitor account", color: "bg-emerald-500/20 text-emerald-400" };
}

// ── Economics panel ──────────────────────────────────────────────────────────

function CustomerEconomicsPanel({ customerId }: { customerId: number }) {
  const { data: econ, isLoading } = trpc.customers.getLifetimeEconomics.useQuery({ customerId });

  if (isLoading) return <Skeleton className="h-36 w-full" />;

  const costs = econ?.costs ?? [];
  const byType: Record<string, number> = {};
  for (const c of costs) {
    byType[c.costType] = (byType[c.costType] ?? 0) + c.amountCents;
  }
  const totalCost = econ?.totalLifetimeCostCents ?? 0;
  const totalRev = econ?.totalLifetimeRevenueCents ?? 0;
  const netMargin = totalRev - totalCost;

  return (
    <div className="border border-electric/20 rounded-xl p-4 bg-electric/5">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-electric" />
        <span className="text-sm font-medium text-off-white">Lifetime Economics</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <span className="text-soft-gray text-xs">Total Revenue</span>
          <p className="text-green-400 font-medium">{fmtCents(totalRev)}</p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Total Cost</span>
          <p className="text-amber-400 font-medium">{fmtCents(totalCost)}</p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Net Margin</span>
          <p className={netMargin >= 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{fmtCents(netMargin)}</p>
        </div>
      </div>
      {Object.keys(byType).length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border/30">
          <span className="text-xs text-soft-gray">Cost breakdown</span>
          {Object.entries(byType).map(([type, amt]) => (
            <div key={type} className="flex justify-between text-xs">
              <span className="text-soft-gray">{COST_TYPE_LABELS[type] ?? type}</span>
              <span className="text-off-white">{fmtCents(amt)}</span>
            </div>
          ))}
        </div>
      )}
      {Object.keys(byType).length === 0 && (
        <p className="text-xs text-soft-gray/60">No costs recorded yet</p>
      )}
    </div>
  );
}

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ customer, contracts, onStatusChange }: {
  customer: any;
  contracts: any[];
  onStatusChange: (val: string) => void;
}) {
  const primaryContract = contracts.find((c: any) => c.status === "active") ?? contracts[0];

  return (
    <div className="space-y-4">
      {customer.status === "at_risk" && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium font-sans">Payment failed — this customer is at risk of churning. Check the Billing tab for details.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm font-sans">
        <div><span className="text-soft-gray text-xs">Business</span><p className="text-off-white font-medium">{customer.businessName}</p></div>
        <div><span className="text-soft-gray text-xs">Contact</span><p className="text-off-white">{customer.contactName}</p></div>
        <div><span className="text-soft-gray text-xs">Email</span><p className="text-off-white break-all">{customer.email}</p></div>
        <div><span className="text-soft-gray text-xs">Phone</span><p className="text-off-white">{customer.phone || "—"}</p></div>
        <div><span className="text-soft-gray text-xs">Industry</span><p className="text-off-white">{customer.industry || "—"}</p></div>
        <div><span className="text-soft-gray text-xs">Website</span><p className="text-off-white">{customer.website || "—"}</p></div>
        <div>
          <span className="text-soft-gray text-xs">Health Score</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`h-2 w-2 rounded-full ${customer.healthScore >= 70 ? "bg-green-500" : customer.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`} />
            <p className="text-off-white">{customer.healthScore}/100</p>
          </div>
        </div>
        <div><span className="text-soft-gray text-xs">Customer Since</span><p className="text-off-white">{fmtDate(customer.createdAt)}</p></div>
        {customer.acquisitionSource && (
          <div className="col-span-2"><span className="text-soft-gray text-xs">Acquisition Source</span><p className="text-off-white">{customer.acquisitionSource}</p></div>
        )}
      </div>

      <div>
        <label className="text-xs text-soft-gray font-sans">Status</label>
        <Select value={customer.status} onValueChange={onStatusChange}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["active", "at_risk", "churned"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {primaryContract && (
        <div className="p-3 rounded-lg border border-border/30 bg-charcoal/30 text-sm font-sans space-y-1">
          <p className="text-xs text-soft-gray uppercase tracking-wider font-medium mb-2">Active Contract</p>
          <div className="flex items-center justify-between">
            <span className="text-soft-gray">Package</span>
            <span className="text-off-white capitalize">{primaryContract.packageTier}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-soft-gray">Monthly</span>
            <span className="text-off-white">{fmtMoney(primaryContract.monthlyPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-soft-gray">Status</span>
            <Badge className={`text-xs ${CONTRACT_STATUS_COLORS[primaryContract.status] ?? ""}`}>{primaryContract.status.replace(/_/g, " ")}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingTab({ customerId }: { customerId: number }) {
  const { data: contracts, isLoading: loadingContracts } = trpc.contracts.byCustomer.useQuery({ customerId });
  const { data: orders, isLoading: loadingOrders } = trpc.orders.byCustomer.useQuery({ customerId });

  if (loadingContracts || loadingOrders) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div className="space-y-5 font-sans">
      {/* Contracts */}
      <div>
        <p className="text-xs text-soft-gray uppercase tracking-wider font-medium mb-2">Contracts</p>
        {!contracts?.length ? (
          <p className="text-sm text-soft-gray/60">No contracts found.</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c: any) => (
              <div key={c.id} className="p-3 rounded-lg border border-border/30 bg-charcoal/20 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-off-white font-medium capitalize">{c.packageTier} — {fmtMoney(c.monthlyPrice)}/mo</span>
                  <Badge className={`text-xs ${CONTRACT_STATUS_COLORS[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-soft-gray">
                  <span>Start: {fmtDate(c.startDate)}</span>
                  <span>End: {fmtDate(c.endDate)}</span>
                  <span>Renewal: {c.renewalStatus?.replace(/_/g, " ") ?? "—"}</span>
                </div>
                {c.stripeSubscriptionId && (
                  <p className="text-xs text-soft-gray/60 font-mono truncate">Stripe: {c.stripeSubscriptionId}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      <div>
        <p className="text-xs text-soft-gray uppercase tracking-wider font-medium mb-2">Payment History</p>
        {!orders?.length ? (
          <p className="text-sm text-soft-gray/60">No orders found.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-charcoal/20 text-sm">
                <div className="min-w-0">
                  <p className="text-off-white font-medium capitalize">{o.packageTier} — {fmtCents(o.amount)}</p>
                  <p className="text-xs text-soft-gray">{fmtDate(o.createdAt)}</p>
                  {o.stripePaymentIntentId && (
                    <p className="text-xs text-soft-gray/50 font-mono truncate">{o.stripePaymentIntentId}</p>
                  )}
                </div>
                <Badge className={`text-xs shrink-0 ml-2 ${ORDER_STATUS_COLORS[o.status] ?? ""}`}>{o.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingTab({ customerId }: { customerId: number }) {
  const { data: project, isLoading } = trpc.onboarding.byCustomer.useQuery({ customerId });

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  if (!project) return (
    <div className="text-center py-8">
      <ClipboardList className="h-8 w-8 text-soft-gray/40 mx-auto mb-2" />
      <p className="text-sm text-soft-gray font-sans">No onboarding project found for this customer.</p>
    </div>
  );

  const ALL_STAGES = ["intake", "questionnaire", "assets_upload", "design", "review", "revisions", "final_approval", "launch", "complete"];
  const currentIndex = ALL_STAGES.indexOf(project.stage);
  const isFailed = project.generationStatus === "failed";
  const isGenerating = project.generationStatus === "generating";
  const questionnaire = project.questionnaire as any;
  const hasQuestionnaire = questionnaire && Object.keys(questionnaire).length > 0;

  return (
    <div className="space-y-4 font-sans">
      {isFailed && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium">Site generation failed. Go to Onboarding Projects to regenerate.</p>
        </div>
      )}

      {/* Stage progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-soft-gray uppercase tracking-wider font-medium">Stage</span>
          <Badge className={`text-xs ${isFailed ? "bg-red-500/20 text-red-400" : isGenerating ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"}`}>
            {ONBOARDING_STAGE_LABELS[project.stage] ?? project.stage}
          </Badge>
        </div>
        <div className="flex gap-0.5">
          {ALL_STAGES.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? "bg-electric" : "bg-graphite"}`} />
          ))}
        </div>
      </div>

      {/* Key fields */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-soft-gray text-xs">Generation Status</span>
          <p className={`font-medium ${isFailed ? "text-red-400" : isGenerating ? "text-purple-400" : project.generationStatus === "complete" ? "text-emerald-400" : "text-soft-gray"}`}>
            {project.generationStatus ?? "idle"}
          </p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Revisions</span>
          <p className="text-off-white">{project.revisionsCount} / {project.maxRevisions ?? "—"}</p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Questionnaire</span>
          <p className={`font-medium ${hasQuestionnaire ? "text-emerald-400" : "text-amber-400"}`}>{hasQuestionnaire ? "Complete" : "Not filled"}</p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Custom Quote</span>
          <p className={`font-medium ${project.needsCustomQuote ? "text-amber-400" : "text-emerald-400"}`}>{project.needsCustomQuote ? "Required" : "Standard"}</p>
        </div>
        {project.liveUrl && (
          <div className="col-span-2">
            <span className="text-soft-gray text-xs">Live URL</span>
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-electric hover:underline text-sm">
              <Globe className="h-3 w-3" />
              {project.liveUrl}
            </a>
          </div>
        )}
        <div>
          <span className="text-soft-gray text-xs">Package</span>
          <p className="text-off-white capitalize">{project.packageTier}</p>
        </div>
        <div>
          <span className="text-soft-gray text-xs">Created</span>
          <p className="text-off-white">{fmtDate(project.createdAt)}</p>
        </div>
      </div>

      {project.generationLog && (
        <div className={`p-3 rounded-lg border text-xs ${isFailed ? "border-red-500/30 bg-red-500/5 text-red-300" : "border-border/30 bg-charcoal/20 text-soft-gray"}`}>
          <p className="text-xs font-medium mb-1">Generation Log</p>
          <p className="line-clamp-3">{project.generationLog}</p>
        </div>
      )}
    </div>
  );
}

function SupportTab({ customerId }: { customerId: number }) {
  const { data: tickets, isLoading } = trpc.support.byCustomer.useQuery({ customerId });

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  if (!tickets?.length) return (
    <div className="text-center py-8">
      <Headphones className="h-8 w-8 text-soft-gray/40 mx-auto mb-2" />
      <p className="text-sm text-soft-gray font-sans">No support tickets found.</p>
    </div>
  );

  const openCount = tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-3 font-sans">
      {openCount > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-medium">{openCount} open ticket{openCount !== 1 ? "s" : ""} require attention</span>
        </div>
      )}
      {tickets.map((t: any) => (
        <div key={t.id} className="p-3 rounded-lg border border-border/30 bg-charcoal/20 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-off-white font-medium truncate">{t.subject}</p>
            <Badge className={`text-xs shrink-0 ${TICKET_STATUS_COLORS[t.status] ?? ""}`}>{t.status.replace(/_/g, " ")}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-soft-gray">
            <span>Priority: {t.priority ?? "medium"}</span>
            {t.category && <span>Category: {t.category.replace(/_/g, " ")}</span>}
            <span>{fmtDate(t.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NurtureTab({ customerId }: { customerId: number }) {
  const { data: logs, isLoading } = trpc.nurture.byCustomer.useQuery({ customerId });

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  if (!logs?.length) return (
    <div className="text-center py-8">
      <MessageCircle className="h-8 w-8 text-soft-gray/40 mx-auto mb-2" />
      <p className="text-sm text-soft-gray font-sans">No nurture activity recorded yet.</p>
    </div>
  );

  const lastTouch = logs[0];

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/30 bg-charcoal/20 text-xs text-soft-gray">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Last touch: {fmtDate(lastTouch.sentAt ?? lastTouch.createdAt)} — {lastTouch.type?.replace(/_/g, " ")} via {lastTouch.channel}
      </div>
      {logs.map((log: any) => (
        <div key={log.id} className="p-3 rounded-lg border border-border/30 bg-charcoal/20 text-sm space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-off-white font-medium truncate">{log.subject || "(no subject)"}</p>
            <Badge className="text-xs bg-electric/10 text-electric shrink-0">{log.type?.replace(/_/g, " ")}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs text-soft-gray">
            <span>Channel: {log.channel}</span>
            <span>Status: {log.status}</span>
            <span>{fmtDate(log.sentAt ?? log.createdAt)}</span>
          </div>
          {log.content && <p className="text-xs text-soft-gray/60 line-clamp-2">{log.content}</p>}
        </div>
      ))}
    </div>
  );
}

function ReportsTab({ customerId }: { customerId: number }) {
  const { data: reports, isLoading } = trpc.reports.byCustomer.useQuery({ customerId });

  if (isLoading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <div className="space-y-4 font-sans">
      {!reports?.length ? (
        <div className="text-center py-6">
          <BarChart3 className="h-8 w-8 text-soft-gray/40 mx-auto mb-2" />
          <p className="text-sm text-soft-gray">No reports generated yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-charcoal/20 text-sm">
              <div>
                <p className="text-off-white font-medium">{r.reportMonth}</p>
                <p className="text-xs text-soft-gray">{r.pageViews != null ? `${r.pageViews} views` : "No analytics"} · Sent: {fmtDate(r.sentAt ?? r.createdAt)}</p>
              </div>
              <Badge className={`text-xs ${r.status === "sent" || r.status === "viewed" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                {r.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <CustomerEconomicsPanel customerId={customerId} />
    </div>
  );
}

// ── Customer Card (tabbed modal) ─────────────────────────────────────────────

function CustomerCard({ customer, onClose, onStatusChange }: {
  customer: any;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: contracts = [] } = trpc.contracts.byCustomer.useQuery({ customerId: customer.id });
  const { data: onboardingProject } = trpc.onboarding.byCustomer.useQuery({ customerId: customer.id });
  const { data: supportTickets = [] } = trpc.support.byCustomer.useQuery({ customerId: customer.id });

  const openTicketCount = supportTickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
  const nextAction = suggestNextAction(customer, onboardingProject ?? null, openTicketCount, contracts as any[]);

  const TABS: { key: TabKey; label: string; icon: any; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "billing", label: "Billing", icon: FileText, badge: contracts.length },
    { key: "onboarding", label: "Build", icon: ClipboardList },
    { key: "support", label: "Support", icon: Headphones, badge: openTicketCount || undefined },
    { key: "nurture", label: "Nurture", icon: MessageCircle },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
      {/* Header */}
      <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-serif text-off-white text-lg">{customer.businessName}</DialogTitle>
            <p className="text-sm text-soft-gray font-sans mt-0.5">{customer.contactName} · {customer.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={`text-xs font-sans ${statusConfig[customer.status]?.color ?? ""}`}>
              {customer.status.replace(/_/g, " ")}
            </Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full font-sans ${nextAction.color}`}>
              {nextAction.label}
            </span>
          </div>
        </div>
      </DialogHeader>

      {/* Tab bar */}
      <div className="flex border-b border-border/30 px-2 shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium font-sans whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-electric text-electric"
                : "border-transparent text-soft-gray hover:text-off-white"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.badge ? (
              <span className={`ml-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full text-[10px] px-1 ${activeTab === tab.key ? "bg-electric/20 text-electric" : "bg-soft-gray/20 text-soft-gray"}`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === "overview" && (
          <OverviewTab
            customer={customer}
            contracts={contracts as any[]}
            onStatusChange={(val) => onStatusChange(customer.id, val)}
          />
        )}
        {activeTab === "billing" && <BillingTab customerId={customer.id} />}
        {activeTab === "onboarding" && <OnboardingTab customerId={customer.id} />}
        {activeTab === "support" && <SupportTab customerId={customer.id} />}
        {activeTab === "nurture" && <NurtureTab customerId={customer.id} />}
        {activeTab === "reports" && <ReportsTab customerId={customer.id} />}
      </div>

      <DialogFooter className="px-5 py-3 border-t border-border/30 shrink-0">
        <Button variant="outline" onClick={onClose} className="font-sans text-sm">Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Customers() {
  const [selected, setSelected] = useState<any>(null);
  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("Customer updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    if (!customers) return { active: 0, at_risk: 0, churned: 0 };
    return {
      active: customers.filter((c: any) => c.status === "active").length,
      at_risk: customers.filter((c: any) => c.status === "at_risk").length,
      churned: customers.filter((c: any) => c.status === "churned").length,
    };
  }, [customers]);

  const handleStatusChange = (id: number, status: string) => {
    updateCustomer.mutate({ id, status: status as any });
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-off-white">Customer Management</h1>
        <p className="text-sm text-soft-gray font-sans mt-1">Active accounts, health scores, and customer lifecycle</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["active", "at_risk", "churned"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <Card key={s} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <cfg.icon className={`h-5 w-5 ${s === "active" ? "text-emerald-400" : s === "at_risk" ? "text-yellow-600" : "text-red-600"}`} />
                <div>
                  <div className="text-lg font-serif text-off-white">{counts[s]}</div>
                  <div className="text-xs text-soft-gray font-sans capitalize">{s.replace(/_/g, " ")}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">All Customers</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !customers?.length ? (
            <div className="text-center py-12">
              <Building2 className="h-10 w-10 text-soft-gray/40 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No customers yet. Customers are created when leads close.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Business</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Contact</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Industry</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Health</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Revenue</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Cost</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c: any) => {
                    const cfg = statusConfig[c.status] ?? statusConfig.active;
                    return (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-midnight-dark/20 transition-colors">
                        <td className="py-3 px-2 font-medium text-off-white">{c.businessName}</td>
                        <td className="py-3 px-2 text-soft-gray">{c.contactName}</td>
                        <td className="py-3 px-2 text-soft-gray text-xs">{c.industry || "—"}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${c.healthScore >= 70 ? "bg-green-500" : c.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`} />
                            <span className="text-soft-gray">{c.healthScore}/100</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {c.totalLifetimeRevenueCents > 0 ? (
                            <span className="text-xs text-green-400 font-medium">{fmtCents(c.totalLifetimeRevenueCents)}</span>
                          ) : (
                            <span className="text-xs text-soft-gray/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {c.totalLifetimeCostCents > 0 ? (
                            <span className="text-xs text-amber-400 font-medium">{fmtCents(c.totalLifetimeCostCents)}</span>
                          ) : (
                            <span className="text-xs text-soft-gray/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2"><Badge className={`text-xs font-sans ${cfg.color}`}>{c.status.replace(/_/g, " ")}</Badge></td>
                        <td className="py-3 px-2 text-right">
                          <Button variant="ghost" size="sm" className="text-xs text-soft-gray hover:text-off-white"
                            onClick={() => setSelected(c)}>Manage</Button>
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

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <CustomerCard
            customer={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </Dialog>
    </div>
  );
}
