import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
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
                  <ArrowRight className="h-3.5 w-3.5 text-soft-gray/30 shrink-0" />
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
    </div>
  );
}
