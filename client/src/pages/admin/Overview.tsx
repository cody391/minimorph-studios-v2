import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Target,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Overview() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const [, setLocation] = useLocation();

  const metrics = stats
    ? [
        { label: "Total Reps", value: stats.totalReps, sub: `${stats.activeReps} active`, icon: Users, color: "text-off-white", bg: "bg-electric/10", path: "/admin/reps" },
        { label: "Total Leads", value: stats.totalLeads, sub: `${stats.hotLeads} hot`, icon: Target, color: "text-electric", bg: "bg-electric/10", path: "/admin/leads" },
        { label: "Customers", value: stats.totalCustomers, sub: `${stats.activeContracts} contracts`, icon: Building2, color: "text-soft-gray", bg: "bg-electric/5", path: "/admin/customers" },
        { label: "Active Contracts", value: stats.activeContracts, sub: "ongoing", icon: FileText, color: "text-off-white", bg: "bg-electric/10", path: "/admin/contracts" },
        { label: "Monthly Revenue", value: `$${Number(stats.monthlyRevenue).toLocaleString()}`, sub: "active MRR", icon: DollarSign, color: "text-electric", bg: "bg-electric/10", path: "/admin/commissions" },
        { label: "Pending Payouts", value: `$${Number(stats.pendingCommissions).toLocaleString()}`, sub: "to reps", icon: TrendingUp, color: "text-soft-gray", bg: "bg-electric/5", path: "/admin/commissions" },
      ]
    : [];

  const lifecycleSteps = [
    { label: "AI Sources Leads", icon: "🔍", desc: "Continuous lead discovery" },
    { label: "Leads Warmed", icon: "🔥", desc: "Multi-touch warming" },
    { label: "Reps Close", icon: "🤝", desc: "Human-powered sales" },
    { label: "Customer Onboarded", icon: "🎯", desc: "Guided buying" },
    { label: "Site Built & Managed", icon: "🏗️", desc: "AI delivery" },
    { label: "Customer Nurtured", icon: "💚", desc: "12-month care" },
    { label: "Upgrades Offered", icon: "⬆️", desc: "Upsell detection" },
    { label: "Reports Delivered", icon: "📊", desc: "Monthly analytics" },
    { label: "Renewals Secured", icon: "🔄", desc: "Proactive retention" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-off-white">Platform Overview</h1>
        <p className="text-sm text-soft-gray font-sans mt-1">
          The MiniMorph lifecycle at a glance
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : metrics.map((m) => (
              <Card
                key={m.label}
                className="border-border/50 hover:border-electric/20 transition-all cursor-pointer group"
                onClick={() => setLocation(m.path)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-sans text-soft-gray uppercase tracking-wider">
                      {m.label}
                    </span>
                    <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-serif text-off-white">{m.value}</div>
                  <p className="text-xs text-soft-gray/60 font-sans mt-1">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Lifecycle Loop Visualization */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-soft-gray" />
            <CardTitle className="text-lg font-serif text-off-white">Lifecycle Loop</CardTitle>
          </div>
          <p className="text-xs text-soft-gray font-sans">
            Humans close. AI sources, warms, guides, supports, nurtures, reports, upgrades, and renews.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {lifecycleSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-midnight-dark/50 rounded-lg px-3 py-2 border border-border/30">
                  <span className="text-lg">{step.icon}</span>
                  <div>
                    <div className="text-xs font-sans font-medium text-off-white">{step.label}</div>
                    <div className="text-[10px] text-soft-gray/60 font-sans">{step.desc}</div>
                  </div>
                </div>
                {i < lifecycleSteps.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-soft-gray/40 shrink-0" />
                )}
              </div>
            ))}
            <ArrowRight className="h-3.5 w-3.5 text-electric/40 shrink-0" />
            <Badge variant="outline" className="border-electric/30 text-electric text-xs font-sans">
              Cycle Repeats
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Add New Lead", path: "/admin/leads", icon: Target },
          { label: "Manage Reps", path: "/admin/reps", icon: Users },
          { label: "View Contracts", path: "/admin/contracts", icon: FileText },
          { label: "Check Renewals", path: "/admin/renewals", icon: RefreshCw },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => setLocation(action.path)}
            className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-charcoal hover:bg-midnight-dark/30 hover:border-electric/20 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-electric/10 flex items-center justify-center group-hover:bg-electric/10 transition-colors">
              <action.icon className="h-4 w-4 text-soft-gray" />
            </div>
            <span className="text-sm font-sans text-off-white/80 group-hover:text-electric transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Economics Dashboard */}
      <EconomicsDashboardPanel />

      {/* Part 4: Academy Promotions */}
      <AcademyPromotionsPanel />

      {/* Part 8: System Health */}
      <SystemHealthPanel />
    </div>
  );
}

/* Economics Dashboard */
function EconomicsDashboardPanel() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data, isLoading } = trpc.admin.getEconomicsSummary.useQuery({ month: currentMonth });

  function fmtCents(cents: number) {
    if (cents === 0) return "$0";
    if (cents < 100) return `¢${cents}`;
    return `$${(cents / 100).toFixed(2)}`;
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

  const summary = data?.summary;
  const totalCost = summary?.totalCostCents ?? 0;
  const totalRev = summary?.totalRevenueCents ?? 0;
  const margin = totalRev - totalCost;
  const byType = summary?.byType ?? {};

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-off-white font-serif flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-electric" />
          Economics — {currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : (
          <div className="space-y-5">
            {/* Top-line KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                <p className="text-xs text-soft-gray font-sans">Revenue</p>
                <p className="text-lg font-serif text-green-400">{fmtCents(totalRev)}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                <p className="text-xs text-soft-gray font-sans">Total Spend</p>
                <p className="text-lg font-serif text-amber-400">{fmtCents(totalCost)}</p>
              </div>
              <div className={`p-3 rounded-lg border text-center ${margin >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <p className="text-xs text-soft-gray font-sans">Net Margin</p>
                <p className={`text-lg font-serif ${margin >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtCents(margin)}</p>
              </div>
            </div>

            {/* Cost breakdown by type */}
            {Object.keys(byType).length > 0 && (
              <div>
                <p className="text-xs text-soft-gray font-sans mb-2">Cost Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(byType).map(([type, amt]) => (
                    <div key={type} className="flex justify-between items-center p-2 rounded bg-midnight-dark/40 border border-border/20 text-xs">
                      <span className="text-soft-gray font-sans">{COST_TYPE_LABELS[type] ?? type}</span>
                      <span className="text-off-white font-medium">{fmtCents(amt as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most expensive unconverted leads */}
            {(data?.expensiveLeads?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-soft-gray font-sans mb-2">Most Expensive Open Leads</p>
                <div className="space-y-1">
                  {data!.expensiveLeads.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center text-xs p-2 rounded bg-midnight-dark/30 border border-border/20">
                      <span className="text-off-white font-sans">{l.businessName}</span>
                      <div className="flex items-center gap-3">
                        <Badge className="text-[10px] badge-neutral font-sans">{l.stage?.replace(/_/g, " ")}</Badge>
                        <span className="text-amber-400">{fmtCents(l.totalCostCents)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best ROI customers */}
            {(data?.roiCustomers?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-soft-gray font-sans mb-2">Best ROI Customers</p>
                <div className="space-y-1">
                  {data!.roiCustomers.map((c: any) => {
                    const roi = c.totalLifetimeRevenueCents - c.totalLifetimeCostCents;
                    return (
                      <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded bg-midnight-dark/30 border border-border/20">
                        <span className="text-off-white font-sans">{c.businessName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-soft-gray">{fmtCents(c.totalLifetimeRevenueCents)} rev</span>
                          <span className="text-green-400 font-medium">+{fmtCents(roi)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalCost === 0 && (data?.expensiveLeads?.length ?? 0) === 0 && (
              <p className="text-xs text-soft-gray/60 font-sans text-center py-2">No economics data for this month yet</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* Part 4: Admin panel for promoting coaching feedback to academy lessons */
function AcademyPromotionsPanel() {
  const { data: pending, refetch } = trpc.admin.getPendingAcademyPromotions.useQuery();
  const [selected, setSelected] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("closing");

  const promote = trpc.admin.promoteToAcademy.useMutation({
    onSuccess: () => { toast.success("Published to Academy"); refetch(); setSelected(null); },
    onError: (err: any) => toast.error(err.message),
  });

  const openPromotion = (item: any) => {
    setSelected(item);
    setTitle(`Lesson: ${item.promotionReason || item.communicationType + " example"}`);
    setContent(item.detailedFeedback || "");
    setCategory("closing");
  };

  if (!pending?.length) return null;

  return (
    <>
      <Card className="border-electric/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-off-white font-serif flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-electric" />
            Pending Academy Promotions
            <Badge className="bg-electric/10 text-electric border-electric/20 text-xs">{pending.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pending.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-electric/5 border border-electric/10">
                <div className="min-w-0">
                  <p className="text-sm font-sans text-off-white font-medium truncate">{item.promotionReason || `${item.communicationType} coaching`}</p>
                  <p className="text-xs text-soft-gray font-sans">{item.repName} · Score: {item.overallScore}/100 · {item.communicationType}</p>
                </div>
                <Button size="sm" onClick={() => openPromotion(item)} className="shrink-0 ml-3 bg-electric hover:bg-electric-light text-midnight text-xs h-7">
                  Review & Publish
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Dialog open={true} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif text-off-white">Publish to Academy</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-soft-gray mb-1">Lesson Title</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-soft-gray mb-1">Category</p>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["objection_handling", "closing", "rapport", "discovery", "product_knowledge", "tone", "follow_up", "listening", "urgency", "personalization"].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-soft-gray mb-1">Lesson Content (markdown)</p>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="text-xs font-mono" />
              </div>
              <div className="p-3 bg-electric/5 rounded-lg">
                <p className="text-xs text-soft-gray/60 font-sans">Original AI Feedback:</p>
                <p className="text-xs text-soft-gray font-sans mt-1">{selected.promotionReason}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button
                onClick={() => promote.mutate({ feedbackId: selected.id, title, lessonContent: content, category: category as any })}
                disabled={promote.isPending || !title || !content}
                className="bg-electric hover:bg-electric-light text-midnight"
              >
                {promote.isPending ? "Publishing…" : "Publish to Academy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* Part 8: System health smoke-test panel */
function SystemHealthPanel() {
  const [results, setResults] = useState<Record<string, { ok: boolean; latencyMs?: number; error?: string }> | null>(null);
  const smokeTest = trpc.admin.smokeTest.useMutation({
    onSuccess: (data) => setResults(data.results),
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-off-white font-serif flex items-center gap-2">
            <Activity className="w-5 h-5 text-electric" />
            System Health
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => smokeTest.mutate()} disabled={smokeTest.isPending} className="border-electric/20 text-xs">
            {smokeTest.isPending ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Run Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!results ? (
          <p className="text-xs text-soft-gray/60 font-sans text-center py-4">Click "Run Tests" to check all integrations</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(results).map(([name, result]) => (
              <div key={name} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${result.ok ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                {result.ok ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-sans text-off-white font-medium truncate">{name.replace(/_/g, " ")}</p>
                  {result.ok ? (
                    <p className="text-soft-gray/60">{result.latencyMs}ms</p>
                  ) : (
                    <p className="text-red-400 truncate">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
