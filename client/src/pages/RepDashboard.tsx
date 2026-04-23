import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users, DollarSign, Target, TrendingUp, Award, Clock,
  ArrowLeft, BarChart3, Briefcase, CheckCircle, AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const tempColors: Record<string, string> = {
  cold: "bg-blue-100 text-blue-700",
  warm: "bg-yellow-100 text-yellow-700",
  hot: "bg-red-100 text-red-700",
};

const stageColors: Record<string, string> = {
  assigned: "bg-purple-100 text-purple-700",
  contacted: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-yellow-100 text-yellow-700",
  negotiating: "bg-orange-100 text-orange-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
};

const commissionStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
};

export default function RepDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: repProfile, isLoading: repLoading } = trpc.reps.myProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: allLeads } = trpc.leads.list.useQuery(
    undefined,
    { enabled: isAuthenticated && !!repProfile }
  );

  const { data: commissions } = trpc.commissions.byRep.useQuery(
    { repId: repProfile?.id ?? 0 },
    { enabled: isAuthenticated && !!repProfile }
  );

  // Filter leads assigned to this rep
  const myLeads = allLeads?.filter((l: any) => l.assignedRepId === repProfile?.id) ?? [];
  const activeLeads = myLeads.filter((l: any) => !["closed_won", "closed_lost"].includes(l.stage));
  const wonLeads = myLeads.filter((l: any) => l.stage === "closed_won");

  const totalEarnings = commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0;
  const pendingPayouts = commissions?.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-forest/30 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-forest mb-2">Rep Portal</h2>
            <p className="text-sm text-forest/60 font-sans mb-6">Sign in to access your dashboard, leads, and commissions.</p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full px-8"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (repLoading) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!repProfile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-terracotta/50 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-forest mb-2">No Rep Profile Found</h2>
            <p className="text-sm text-forest/60 font-sans mb-6">
              You don't have a rep profile yet. Apply to become a MiniMorph representative to access this dashboard.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-forest hover:bg-forest/90 text-white font-sans rounded-full px-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-serif">Welcome back, {repProfile.fullName}</h1>
              <Badge className={`text-[10px] font-sans ${repProfile.status === "active" ? "bg-green-500/20 text-green-200" : "bg-yellow-500/20 text-yellow-200"}`}>
                {repProfile.status}
              </Badge>
            </div>
            <p className="text-sm text-white/60 font-sans">Your sales dashboard and performance overview</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} className="text-white border-white/20 hover:bg-white/10 font-sans text-sm rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Leads", value: activeLeads.length, icon: Target, color: "text-blue-600" },
            { label: "Deals Won", value: wonLeads.length, icon: CheckCircle, color: "text-green-600" },
            { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-forest" },
            { label: "Pending Payouts", value: `$${pendingPayouts.toLocaleString()}`, icon: Clock, color: "text-terracotta" },
          ].map((m) => (
            <Card key={m.label} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">{m.label}</span>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div className="text-2xl font-serif text-forest">{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Training & Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <Award className="h-4 w-4 text-terracotta" />
                Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-sans">
                  <span className="text-forest/60">Completion</span>
                  <span className="text-forest font-medium">{repProfile.trainingProgress}%</span>
                </div>
                <Progress value={repProfile.trainingProgress} className="h-2" />
                {repProfile.certifiedAt && (
                  <p className="text-xs text-green-600 font-sans flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Certified on {new Date(repProfile.certifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-terracotta" />
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="text-4xl font-serif text-forest">{parseFloat(repProfile.performanceScore || "0").toFixed(1)}</div>
                <div className="text-sm text-forest/50 font-sans pb-1">
                  <p>{repProfile.totalDeals} total deals</p>
                  <p>${parseFloat(repProfile.totalRevenue || "0").toLocaleString()} revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Leads */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
              <Users className="h-4 w-4 text-terracotta" />
              My Assigned Leads ({myLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myLeads.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-8 w-8 text-forest/20 mx-auto mb-3" />
                <p className="text-sm text-forest/50 font-sans">No leads assigned yet. Check back soon — new opportunities are being sourced.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-cream-dark/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-forest font-sans">{lead.businessName}</span>
                        <Badge className={`text-[10px] font-sans ${tempColors[lead.temperature] ?? ""}`}>{lead.temperature}</Badge>
                        <Badge className={`text-[10px] font-sans ${stageColors[lead.stage] ?? "bg-gray-100 text-gray-700"}`}>{lead.stage.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-xs text-forest/50 font-sans">{lead.contactName} • {lead.email}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-xs text-forest/40 font-sans">Score: {lead.qualificationScore}/100</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission History */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-terracotta" />
              Commission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!commissions?.length ? (
              <div className="text-center py-8">
                <DollarSign className="h-8 w-8 text-forest/20 mx-auto mb-3" />
                <p className="text-sm text-forest/50 font-sans">No commissions yet. Close your first deal to start earning.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commissions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-forest font-sans">${parseFloat(c.amount).toLocaleString()}</span>
                        <Badge className={`text-[10px] font-sans ${commissionStatusColors[c.status] ?? ""}`}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-forest/50 font-sans capitalize">{c.type?.replace(/_/g, " ")} • Contract #{c.contractId}</p>
                    </div>
                    <div className="text-xs text-forest/40 font-sans">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
