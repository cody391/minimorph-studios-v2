import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Users, CheckCircle, Clock, XCircle, Shield, Trophy, DollarSign,
  FileText, GraduationCap, AlertTriangle, CreditCard, ArrowUpRight,
  ClipboardCheck, Eye, Zap, Phone, Loader2, PenLine,
} from "lucide-react";
import { useState, useMemo, lazy, Suspense } from "react";
import { toast } from "sonner";
const GovernancePanel = lazy(() => import("./GovernancePanel"));

const statusColors: Record<string, string> = {
  applied: "bg-yellow-100 text-yellow-800 border-yellow-200",
  onboarding: "bg-blue-100 text-blue-800 border-blue-200",
  training: "bg-purple-100 text-purple-800 border-purple-200",
  certified: "bg-green-100 text-green-800 border-green-200",
  active: "bg-electric/10 text-off-white border-electric/20",
  suspended: "bg-red-100 text-red-800 border-red-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Reps() {
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: reps, isLoading, refetch } = trpc.reps.list.useQuery();
  const { data: commissions } = trpc.commissions.list.useQuery();

  const updateRep = trpc.reps.update.useMutation({
    onSuccess: () => { toast.success("Rep updated"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewApp = trpc.repApplication.review.useMutation({
    onSuccess: () => { toast.success("Application reviewed"); refetch(); setShowDialog(false); },
    onError: (err: any) => toast.error(err.message),
  });

  const approveCommission = trpc.reps.approveCommission.useMutation({
    onSuccess: () => { toast.success("Commission approved"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const initiatePayout = trpc.reps.initiatePayout.useMutation({
    onSuccess: () => { toast.success("Payout initiated via Stripe"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const repsByStatus = useMemo(() => {
    if (!reps) return {};
    const groups: Record<string, number> = {};
    reps.forEach((r: any) => { groups[r.status] = (groups[r.status] || 0) + 1; });
    return groups;
  }, [reps]);

  const pendingApps = useMemo(() => reps?.filter((r: any) => r.status === "applied") || [], [reps]);
  const activeReps = useMemo(() => reps?.filter((r: any) => ["active", "certified"].includes(r.status)) || [], [reps]);
  const atRiskReps = useMemo(() => {
    return activeReps.filter((r: any) => Number(r.performanceScore || 0) < 3 || r.totalDeals === 0);
  }, [activeReps]);

  const pendingCommissions = useMemo(() => {
    return (commissions || []).filter((c: any) => c.status === "pending");
  }, [commissions]);

  const approvedCommissions = useMemo(() => {
    return (commissions || []).filter((c: any) => c.status === "approved");
  }, [commissions]);

  const handleStatusChange = (repId: number, newStatus: string) => {
    updateRep.mutate({ id: repId, status: newStatus as any });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-off-white">Rep Command Center</h1>
          <p className="text-sm text-soft-gray font-sans mt-1">
            Recruit, train, monitor, and pay your sales force
          </p>
        </div>
        <Badge variant="outline" className="font-sans text-xs">
          <Users className="h-3 w-3 mr-1" />
          {reps?.length ?? 0} total reps
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Applied", key: "applied", icon: Clock, color: "text-yellow-600", count: repsByStatus["applied"] ?? 0 },
          { label: "Training", key: "training", icon: GraduationCap, color: "text-purple-600", count: repsByStatus["training"] ?? 0 },
          { label: "Active", key: "active", icon: CheckCircle, color: "text-off-white", count: (repsByStatus["active"] ?? 0) + (repsByStatus["certified"] ?? 0) },
          { label: "At Risk", key: "atrisk", icon: AlertTriangle, color: "text-amber-400", count: atRiskReps.length },
          { label: "Suspended", key: "suspended", icon: XCircle, color: "text-red-600", count: repsByStatus["suspended"] ?? 0 },
        ].map((s) => (
          <Card key={s.key} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-off-white">{s.count}</div>
                <div className="text-[10px] text-soft-gray font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-midnight-dark/30">
          <TabsTrigger value="overview" className="font-sans text-xs">All Reps</TabsTrigger>
          <TabsTrigger value="applications" className="font-sans text-xs">
            Applications {pendingApps.length > 0 && <Badge className="ml-1 bg-yellow-500 text-white text-[9px] px-1">{pendingApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="font-sans text-xs">
            Payouts {(pendingCommissions.length + approvedCommissions.length) > 0 && <Badge className="ml-1 bg-charcoal text-off-white text-[9px] px-1">{pendingCommissions.length + approvedCommissions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="performance" className="font-sans text-xs">Performance</TabsTrigger>
          <TabsTrigger value="recruitment" className="font-sans text-xs">Recruitment</TabsTrigger>
          <TabsTrigger value="assessments" className="font-sans text-xs">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="font-sans text-xs">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="governance" className="font-sans text-xs data-[state=active]:bg-electric data-[state=active]:text-white">
            Governance
          </TabsTrigger>
        </TabsList>

        {/* ALL REPS TAB */}
        <TabsContent value="overview">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white">All Representatives</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !reps?.length ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-soft-gray/40 mx-auto mb-3" />
                  <p className="text-sm text-soft-gray font-sans">No reps yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm font-sans">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Name</th>
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Training</th>
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Deals</th>
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Revenue</th>
                        <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Stripe</th>
                        <th className="text-right py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reps.map((rep: any) => (
                        <tr key={rep.id} className="border-b border-border/30 hover:bg-midnight-dark/20 transition-colors">
                          <td className="py-3 px-2">
                            <div className="font-medium text-off-white">{rep.fullName}</div>
                            <div className="text-xs text-soft-gray/60">{rep.email}</div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={`text-xs font-sans border ${statusColors[rep.status] ?? ""}`}>{rep.status}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Progress value={rep.trainingProgress} className="h-1.5 w-16" />
                              <span className="text-xs text-soft-gray">{rep.trainingProgress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-soft-gray">{rep.totalDeals}</td>
                          <td className="py-3 px-2 text-soft-gray">${Number(rep.totalRevenue).toLocaleString()}</td>
                          <td className="py-3 px-2">
                            {rep.stripeConnectOnboarded ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]"><CreditCard className="h-3 w-3 mr-1" />Connected</Badge>
                            ) : rep.stripeConnectAccountId ? (
                              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">Pending</Badge>
                            ) : (
                              <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">Not Set Up</Badge>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="sm" className="text-xs text-electric hover:text-electric-light"
                                onClick={() => { window.location.href = `/admin/messages#rep-${rep.id}`; }}>
                                Message
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs text-soft-gray hover:text-off-white"
                                onClick={() => { setSelectedRep(rep); setShowDialog(true); }}>
                                Manage
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPLICATIONS TAB */}
        <TabsContent value="applications">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <FileText className="h-4 w-4" /> Applications (Autonomous)
              </CardTitle>
              <p className="text-xs text-soft-gray font-sans">All applications are processed autonomously. Reps who pass the assessment are auto-approved. This is a read-only audit log.</p>
            </CardHeader>
            <CardContent>
              {pendingApps.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-10 w-10 text-emerald-400/30 mx-auto mb-3" />
                  <p className="text-sm text-soft-gray font-sans">All applications auto-processed. No manual action needed.</p>
                  <p className="text-[10px] text-soft-gray/40 font-sans mt-1">The system handles approvals, rejections, and onboarding automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-green-700 font-sans flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> These {pendingApps.length} application(s) are being auto-processed through the pipeline. No action needed.
                    </p>
                  </div>
                  {pendingApps.map((rep: any) => (
                    <div key={rep.id} className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-serif text-off-white font-medium">{rep.fullName}</h3>
                          <p className="text-xs text-soft-gray font-sans">{rep.email} {rep.phone ? `| ${rep.phone}` : ""}</p>
                          <p className="text-xs text-soft-gray/60 font-sans mt-1">Status: {rep.status} | Applied: {new Date(rep.createdAt).toLocaleDateString()}</p>
                          {rep.bio && <p className="text-sm text-soft-gray font-sans mt-2 italic">"{rep.bio}"</p>}
                        </div>
                        <Badge className="badge-pending text-[10px]">In Pipeline</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYOUTS TAB */}
        <TabsContent value="payouts">
          <div className="space-y-4">
            {/* Pending Approval */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Pending Approval ({pendingCommissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCommissions.length === 0 ? (
                  <p className="text-sm text-soft-gray font-sans text-center py-6">No commissions pending approval.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm font-sans">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Rep</th>
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Type</th>
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Amount</th>
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Date</th>
                          <th className="text-right py-2 px-2 text-xs text-soft-gray uppercase font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCommissions.map((c: any) => {
                          const rep = reps?.find((r: any) => r.id === c.repId);
                          return (
                            <tr key={c.id} className="border-b border-border/30">
                              <td className="py-2 px-2 text-off-white">{rep?.fullName || `Rep #${c.repId}`}</td>
                              <td className="py-2 px-2 text-soft-gray">{c.type}</td>
                              <td className="py-2 px-2 font-medium text-off-white">${Number(c.amount).toFixed(2)}</td>
                              <td className="py-2 px-2 text-soft-gray text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td className="py-2 px-2 text-right">
                                <Button size="sm" className="bg-charcoal text-off-white hover:bg-electric/90 text-xs font-sans"
                                  onClick={() => approveCommission.mutate({ commissionId: c.id })}>
                                  Approve
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

            {/* Ready for Payout */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Ready for Payout ({approvedCommissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedCommissions.length === 0 ? (
                  <p className="text-sm text-soft-gray font-sans text-center py-6">No commissions ready for payout.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm font-sans">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Rep</th>
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Amount</th>
                          <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Stripe</th>
                          <th className="text-right py-2 px-2 text-xs text-soft-gray uppercase font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedCommissions.map((c: any) => {
                          const rep = reps?.find((r: any) => r.id === c.repId);
                          const canPay = rep?.stripeConnectOnboarded;
                          return (
                            <tr key={c.id} className="border-b border-border/30">
                              <td className="py-2 px-2 text-off-white">{rep?.fullName || `Rep #${c.repId}`}</td>
                              <td className="py-2 px-2 font-medium text-off-white">${Number(c.amount).toFixed(2)}</td>
                              <td className="py-2 px-2">
                                {canPay ? (
                                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Ready</Badge>
                                ) : (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">No Account</Badge>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                <Button size="sm" disabled={!canPay || initiatePayout.isPending}
                                  className="bg-green-600 text-white hover:bg-green-700 text-xs font-sans"
                                  onClick={() => initiatePayout.mutate({ commissionId: c.id })}>
                                  <ArrowUpRight className="h-3 w-3 mr-1" /> Pay Now
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
          </div>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Performance Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeReps.length ? (
                <p className="text-sm text-soft-gray font-sans text-center py-6">No active reps to rank.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm font-sans">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Rank</th>
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Rep</th>
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Deals</th>
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Revenue</th>
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Score</th>
                        <th className="text-left py-2 px-2 text-xs text-soft-gray uppercase font-medium">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeReps]
                        .sort((a: any, b: any) => Number(b.totalRevenue) - Number(a.totalRevenue))
                        .map((rep: any, idx: number) => {
                          const score = Number(rep.performanceScore || 0);
                          const health = score >= 7 ? "Excellent" : score >= 4 ? "Good" : score > 0 ? "At Risk" : "New";
                          const healthColor = score >= 7 ? "text-emerald-400" : score >= 4 ? "text-off-white" : score > 0 ? "text-amber-400" : "text-gray-400";
                          return (
                            <tr key={rep.id} className="border-b border-border/30">
                              <td className="py-3 px-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "badge-pending-payment" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "badge-pending-payment" : "bg-midnight-dark/30 text-soft-gray"}`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-medium text-off-white">{rep.fullName}</div>
                                <div className="text-[10px] text-soft-gray/60">{rep.status}</div>
                              </td>
                              <td className="py-3 px-2 text-soft-gray">{rep.totalDeals}</td>
                              <td className="py-3 px-2 font-medium text-off-white">${Number(rep.totalRevenue).toLocaleString()}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={score * 10} className="h-1.5 w-12" />
                                  <span className="text-xs text-soft-gray">{score}/10</span>
                                </div>
                              </td>
                              <td className={`py-3 px-2 text-xs font-medium ${healthColor}`}>{health}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* At-Risk Alert */}
              {atRiskReps.length > 0 && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h4 className="font-serif text-sm text-amber-800">At-Risk Reps ({atRiskReps.length})</h4>
                  </div>
                  <p className="text-xs text-amber-700 font-sans mb-3">
                    These reps have low performance scores or zero deals. Consider reaching out for coaching.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {atRiskReps.map((rep: any) => (
                      <Badge key={rep.id} className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-sans">
                        {rep.fullName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECRUITMENT TAB */}
        <TabsContent value="recruitment">
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white">Social Media Recruitment Templates</CardTitle>
                <p className="text-xs text-soft-gray font-sans">Ready-to-post templates for recruiting quality sales reps across platforms.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { platform: "LinkedIn", icon: "in", color: "bg-blue-600", post: `🚀 We're looking for ambitious sales professionals to join MiniMorph Studios as Sales Representatives.\n\nWhat we offer:\n• 10% commission on every sale (uncapped)\n• Flexible schedule — work from anywhere\n• Level up to 15% commission as you grow\n• Full training & certification program\n• Branded tools, templates & AI-powered sales assistant\n\nWe build premium websites for small businesses. You bring the relationships, we handle the rest.\n\nApply now: [Your Careers URL]\n\n#SalesJobs #RemoteWork #WebDesign #Commission` },
                  { platform: "Instagram", icon: "📸", color: "bg-gradient-to-r from-purple-500 to-pink-500", post: `💰 Turn conversations into commissions.\n\nMiniMorph Studios is hiring Sales Reps.\n\n✅ 10-15% commission (uncapped)\n✅ Work from anywhere\n✅ Full training provided\n✅ AI tools to help you close\n✅ No cold calling required\n\nWe build beautiful websites for small businesses. You connect us with business owners who need one.\n\nLink in bio to apply 👆\n\n#SalesRep #RemoteJobs #CommissionBased #WebDesign #Hiring` },
                  { platform: "Facebook", icon: "f", color: "bg-blue-500", post: `🔥 NOW HIRING: Sales Representatives\n\nMiniMorph Studios builds premium websites for small businesses, and we need great people to help us grow.\n\nWhat you get:\n💵 10% commission on every sale (top performers earn 15%)\n🏠 Work from home, set your own hours\n📚 Complete training program (get certified in 1 week)\n🤖 AI-powered tools to help you sell\n💳 Monthly payouts via direct deposit\n\nIdeal for: Real estate agents, insurance reps, freelancers, or anyone with a network of small business owners.\n\nApply here: [Your Careers URL]` },
                  { platform: "X (Twitter)", icon: "𝕏", color: "bg-black", post: `We're hiring sales reps at @MiniMorphStudios\n\n• 10-15% commission (uncapped)\n• Remote, flexible hours\n• Full training + AI tools\n• Help small businesses get online\n\nKnow business owners who need a website? Turn those conversations into income.\n\nApply: [link]` },
                  { platform: "TikTok", icon: "♪", color: "bg-black", post: `POV: You just found a side hustle that actually pays well 💰\n\nMiniMorph Studios is hiring remote sales reps.\n\n10-15% commission on every website you sell. No cap.\nFull training. AI tools. Work from your couch.\n\nAvg deal = $195-$495/mo (12-month contracts)\nYour cut = $234-$1,188+ per contract\n\nLink in bio to apply 🔗\n\n#sidehustle #remotework #salesjobs #makemoneyonline #hiring` },
                ].map((t) => (
                  <div key={t.platform} className="border border-border/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`${t.color} text-white text-xs font-bold w-7 h-7 rounded flex items-center justify-center`}>{t.icon}</span>
                        <span className="font-sans font-medium text-off-white text-sm">{t.platform}</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { navigator.clipboard.writeText(t.post); toast.success(`${t.platform} post copied!`); }}>Copy Post</Button>
                    </div>
                    <pre className="text-xs text-soft-gray font-sans whitespace-pre-wrap bg-midnight-dark/20 rounded p-3 max-h-40 overflow-y-auto">{t.post}</pre>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white">Posting Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm font-sans text-soft-gray">
                  <p><strong className="text-off-white">Frequency:</strong> Post 2-3x per week across platforms. Rotate between recruitment posts and success stories.</p>
                  <p><strong className="text-off-white">Best Times:</strong> LinkedIn (Tue-Thu 8-10am), Instagram (Mon-Fri 11am-1pm), Facebook (Wed-Fri 1-4pm), X (Mon-Fri 12-3pm).</p>
                  <p><strong className="text-off-white">Hashtags:</strong> Always include #RemoteWork #SalesJobs #Hiring #WebDesign #CommissionBased</p>
                  <p><strong className="text-off-white">Visuals:</strong> Use branded graphics showing earnings potential, team photos, or testimonial screenshots.</p>
                  <p><strong className="text-off-white">Engagement:</strong> Reply to every comment within 2 hours. DM interested candidates with the application link.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ASSESSMENTS TAB */}
        <TabsContent value="assessments">
          <AssessmentsTab />
        </TabsContent>

        {/* ONBOARDING PIPELINE TAB */}
        <TabsContent value="pipeline">
          <OnboardingPipelineTab />
        </TabsContent>

        {/* GOVERNANCE TAB */}
        <TabsContent value="governance">
          <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
            <GovernancePanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Rep Management Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Shield className="h-4 w-4" /> Manage: {selectedRep?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedRep && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-soft-gray text-xs">Email</span>
                  <p className="text-off-white text-sm">{selectedRep.email}</p>
                </div>
                <div>
                  <span className="text-soft-gray text-xs">Phone</span>
                  <p className="text-off-white text-sm">{selectedRep.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <ProvisionPhoneSection rep={selectedRep} />
                </div>
                <div>
                  <span className="text-soft-gray text-xs">Total Deals</span>
                  <p className="text-off-white text-sm font-medium">{selectedRep.totalDeals}</p>
                </div>
                <div>
                  <span className="text-soft-gray text-xs">Revenue</span>
                  <p className="text-off-white text-sm font-medium">${Number(selectedRep.totalRevenue).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-soft-gray text-xs">Training</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={selectedRep.trainingProgress} className="h-1.5 w-16" />
                    <span className="text-xs text-soft-gray">{selectedRep.trainingProgress}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-soft-gray text-xs">Stripe Connect</span>
                  <p className="text-sm">
                    {selectedRep.stripeConnectOnboarded ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]"><CreditCard className="h-3 w-3 mr-1" />Connected</Badge>
                    ) : selectedRep.stripeConnectAccountId ? (
                      <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">Pending</Badge>
                    ) : (
                      <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">Not Set Up</Badge>
                    )}
                  </p>
                </div>
              </div>

              {selectedRep.bio && (
                <div>
                  <span className="text-xs text-soft-gray">Bio</span>
                  <p className="text-sm text-off-white/80 mt-1 italic">"{selectedRep.bio}"</p>
                </div>
              )}

              <RepOnboardingProgress repId={selectedRep.id} />

              <RepPaperworkPanel repId={selectedRep.id} />

              <div>
                <label className="text-xs text-soft-gray block mb-1">Change Status</label>
                <Select value={selectedRep.status} onValueChange={(val) => handleStatusChange(selectedRep.id, val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["applied", "onboarding", "training", "certified", "active", "suspended", "inactive"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-sans text-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REP ONBOARDING PROGRESS — Part 7
   ═══════════════════════════════════════════════════════ */
function RepOnboardingProgress({ repId }: { repId: number }) {
  const { data, isLoading } = trpc.repOnboarding.getRepOnboardingDetails.useQuery({ repId });

  if (isLoading) return <div className="h-24 bg-midnight-dark/20 rounded-lg animate-pulse" />;
  if (!data) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-soft-gray font-medium">Onboarding Progress</span>
        <span className="text-xs text-soft-gray">{data.completedCount}/{data.totalSteps} steps</span>
      </div>
      {data.isStuck && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-400">Stuck for {data.hoursStuck}h — may need assistance</p>
        </div>
      )}
      <div className="space-y-1">
        {data.steps.map((step: any) => (
          <div key={step.key} className="flex items-center gap-2">
            {step.completed ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-soft-gray/40 shrink-0" />
            )}
            <span className={`text-xs font-sans ${step.completed ? "text-soft-gray" : "text-off-white"}`}>
              {step.label}
            </span>
            {step.detail && <span className="text-[10px] text-soft-gray/50 ml-auto">{step.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REP PAPERWORK PANEL — Admin e-sign submission viewer
   ═══════════════════════════════════════════════════════ */
const FORM_LABELS: Record<string, string> = {
  w9_tax: "W-9 Tax Information",
  hr_employment: "Identity & Contact Info",
  payroll_setup: "Payout Setup",
  rep_agreement: "Rep Agreement",
};

function RepPaperworkPanel({ repId }: { repId: number }) {
  const [viewSignatureId, setViewSignatureId] = useState<number | null>(null);

  const { data: submissions, isLoading } = trpc.repOnboarding.adminGetPaperworkSubmissions.useQuery(
    { repId },
    { enabled: !!repId }
  );

  const { data: sigData, isLoading: sigLoading } = trpc.repOnboarding.adminGetPaperworkSignature.useQuery(
    { submissionId: viewSignatureId! },
    { enabled: !!viewSignatureId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-soft-gray">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading paperwork…
      </div>
    );
  }

  const REQUIRED_FORMS = ["w9_tax", "hr_employment", "payroll_setup", "rep_agreement"];
  const savedCount = submissions?.length ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-soft-gray font-medium flex items-center gap-1.5">
          <PenLine className="h-3.5 w-3.5" /> E-Sign Paperwork
        </span>
        <span className={`text-xs font-medium ${savedCount === 4 ? "text-emerald-400" : "text-amber-400"}`}>
          {savedCount}/{REQUIRED_FORMS.length} saved
        </span>
      </div>

      {!submissions || submissions.length === 0 ? (
        <p className="text-xs text-soft-gray/60 font-sans py-1">No saved paperwork submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub: any) => {
            const isViewing = viewSignatureId === sub.id;
            return (
              <div key={sub.id} className="border border-border/40 rounded-lg p-3 space-y-2 text-xs font-sans">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-off-white">
                    {sub.formTitle || FORM_LABELS[sub.formType] || sub.formType}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 text-soft-gray">
                      v{sub.formVersion}
                    </Badge>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                      sub.signatureType === "drawn"
                        ? "border-blue-500/30 text-blue-400"
                        : "border-purple-500/30 text-purple-400"
                    }`}>
                      {sub.signatureType}
                    </Badge>
                  </div>
                </div>

                {/* Signer / date */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div>
                    <span className="text-soft-gray/60">Signer</span>
                    <p className="text-off-white/80">{sub.signerName}</p>
                  </div>
                  <div>
                    <span className="text-soft-gray/60">Signed</span>
                    <p className="text-off-white/80">
                      {sub.signedAt ? new Date(sub.signedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  {sub.signedIpAddress && (
                    <div>
                      <span className="text-soft-gray/60">IP</span>
                      <p className="text-off-white/80 font-mono">{sub.signedIpAddress}</p>
                    </div>
                  )}
                  {sub.signedUserAgent && (
                    <div className="col-span-2">
                      <span className="text-soft-gray/60">User-Agent</span>
                      <p className="text-off-white/60 truncate" title={sub.signedUserAgent}>
                        {sub.signedUserAgent}
                      </p>
                    </div>
                  )}
                </div>

                {/* Form data snapshot */}
                {sub.formDataJson && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-soft-gray/60 hover:text-soft-gray select-none">
                      Form data snapshot
                    </summary>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 pl-2 border-l border-border/30">
                      {Object.entries(sub.formDataJson as Record<string, unknown>).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-soft-gray/50">{k}: </span>
                          <span className="text-off-white/70">
                            {v === null || v === undefined
                              ? "—"
                              : typeof v === "boolean"
                                ? v ? "yes" : "no"
                                : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Signature on-demand */}
                <div className="pt-1 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 px-2 text-electric hover:text-electric-light"
                    onClick={() => setViewSignatureId(isViewing ? null : sub.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {isViewing ? "Hide Signature" : "View Signature"}
                  </Button>
                </div>

                {isViewing && (
                  <div className="border border-border/30 rounded-lg p-3 bg-midnight-dark/30">
                    {sigLoading ? (
                      <div className="flex items-center gap-2 text-xs text-soft-gray">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading signature…
                      </div>
                    ) : sigData ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-soft-gray/60">
                          <span>{sigData.signerName}</span>
                          <span>{sigData.signedAt ? new Date(sigData.signedAt).toLocaleString() : ""}</span>
                        </div>
                        {sigData.signatureType === "drawn" ? (
                          <img
                            src={sigData.signatureData}
                            alt="Drawn signature"
                            className="max-h-24 w-auto border border-border/30 rounded bg-white p-1"
                          />
                        ) : (
                          <p className="font-serif text-xl text-off-white italic border-b border-border/40 pb-1">
                            {sigData.signatureData}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-soft-gray/50">Failed to load signature.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ASSESSMENTS TAB — Candidate assessment scores & review
   ═══════════════════════════════════════════════════════ */
function AssessmentsTab() {
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: assessments, isLoading, refetch } = trpc.assessment.adminList.useQuery();

  const { data: detail, isLoading: detailLoading } = trpc.assessment.adminGetDetail.useQuery(
    { assessmentId: selectedAssessment?.id },
    { enabled: !!selectedAssessment?.id }
  );

  const reviewMutation = trpc.assessment.adminReview.useMutation({
    onSuccess: () => {
      toast.success("Assessment reviewed");
      refetch();
      setShowDetailDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!assessments) return [];
    if (statusFilter === "all") return assessments;
    return assessments.filter((a: any) => a.status === statusFilter);
  }, [assessments, statusFilter]);

  const counts = useMemo(() => {
    if (!assessments) return { passed: 0, borderline: 0, failed: 0, total: 0 };
    return {
      passed: assessments.filter((a: any) => a.status === "passed").length,
      borderline: assessments.filter((a: any) => a.status === "borderline").length,
      failed: assessments.filter((a: any) => a.status === "failed").length,
      total: assessments.length,
    };
  }, [assessments]);

  const statusBadge = (status: string, override?: string | null) => {
    if (override === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">Approved (Override)</Badge>;
    if (override === "rejected") return <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]">Rejected (Override)</Badge>;
    switch (status) {
      case "passed": return <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>;
      case "borderline": return <Badge className="bg-amber-100 text-amber-800 border-amber-500/20 text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Borderline</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600 text-[10px]">{status}</Badge>;
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-green-700";
    if (score >= 50) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: counts.total, icon: ClipboardCheck, color: "text-off-white" },
          { label: "Passed", count: counts.passed, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Borderline", count: counts.borderline, icon: AlertTriangle, color: "text-amber-400" },
          { label: "Failed", count: counts.failed, icon: XCircle, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-off-white">{s.count}</div>
                <div className="text-[10px] text-soft-gray font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-soft-gray font-sans">Filter:</span>
        {["all", "passed", "borderline", "failed"].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={statusFilter === f ? "default" : "outline"}
            className={`text-xs h-7 ${statusFilter === f ? "bg-charcoal text-off-white" : ""}`}
            onClick={() => setStatusFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !filtered.length ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-10 w-10 text-soft-gray/40 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No assessments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Candidate</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Character</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Sales</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Total</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Status</th>
                    <th className="text-center py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Date</th>
                    <th className="text-right py-2 px-3 text-[10px] uppercase text-soft-gray font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/10 hover:bg-midnight-dark/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-off-white text-sm">{a.userName || "Unknown"}</div>
                        <div className="text-[10px] text-soft-gray/60">{a.userEmail || ""}</div>
                      </td>
                      <td className={`py-2.5 px-3 text-center font-medium ${scoreColor(parseFloat(a.gate1Score))}`}>
                        {parseFloat(a.gate1Score).toFixed(0)}%
                      </td>
                      <td className={`py-2.5 px-3 text-center font-medium ${scoreColor(parseFloat(a.gate2Score))}`}>
                        {parseFloat(a.gate2Score).toFixed(0)}%
                      </td>
                      <td className={`py-2.5 px-3 text-center font-bold ${scoreColor(parseFloat(a.totalScore))}`}>
                        {parseFloat(a.totalScore).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {statusBadge(a.status, a.adminOverride)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[10px] text-soft-gray">
                        {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          onClick={() => { setSelectedAssessment(a); setShowDetailDialog(true); setReviewNotes(""); }}
                        >
                          <Eye className="h-3 w-3" /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Review Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Assessment Review: {selectedAssessment?.userName || "Unknown"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-electric border-t-transparent rounded-full mx-auto" />
            </div>
          ) : detail ? (
            <div className="space-y-4 font-sans">
              {/* Score summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-600 mb-1">Character (2x)</div>
                  <div className={`text-2xl font-bold ${scoreColor(detail.gate1Score)}`}>
                    {detail.gate1Score.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 mb-1">Sales (1x)</div>
                  <div className={`text-2xl font-bold ${scoreColor(detail.gate2Score)}`}>
                    {detail.gate2Score.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-electric/10 rounded-lg p-3 text-center">
                  <div className="text-xs text-soft-gray mb-1">Weighted Total</div>
                  <div className={`text-2xl font-bold ${scoreColor(detail.totalScore)}`}>
                    {detail.totalScore.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-soft-gray">Status:</span>
                {statusBadge(detail.status, detail.adminOverride)}
              </div>

              {/* Per-question breakdown */}
              <div>
                <h4 className="text-sm font-medium text-off-white mb-2">Response Breakdown</h4>
                <div className="space-y-2">
                  {detail.enrichedAnswers.map((ans: any, idx: number) => (
                    <div key={ans.questionId} className={`border rounded-lg p-3 ${
                      ans.isFreeText ? "border-blue-200 bg-blue-50/30" :
                      ans.selectedScore === ans.maxScore ? "border-green-200 bg-green-50/30" :
                      ans.selectedScore === 0 ? "border-red-200 bg-red-50/30" :
                      "border-border/30"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-soft-gray">Q{idx + 1}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            ans.gate === 1 ? "badge-purple" : "badge-info"
                          }`}>
                            {ans.category}
                          </span>
                        </div>
                        {!ans.isFreeText && (
                          <span className={`text-xs font-medium ${
                            ans.selectedScore === ans.maxScore ? "text-green-700" :
                            ans.selectedScore === 0 ? "text-red-700" :
                            "text-amber-700"
                          }`}>
                            {ans.selectedScore}/{ans.maxScore}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-soft-gray mb-1 line-clamp-2">{ans.scenario}</p>
                      {ans.isFreeText ? (
                        <div className="mt-1 p-2 bg-charcoal rounded border border-blue-100">
                          <span className="text-[10px] text-blue-600 block mb-1">Free-text response:</span>
                          <p className="text-xs text-off-white/70 italic">"{ans.freeTextResponse || "No response"}"</p>
                        </div>
                      ) : (
                        <p className="text-xs text-off-white">
                          <span className="text-soft-gray">Selected:</span> {ans.selectedOptionText || "No answer"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin review section (for borderline candidates) */}
              {(detail.status === "borderline" || detail.status === "failed") && !detail.adminOverride && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-off-white mb-2">Admin Decision</h4>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    className="mb-3 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                      onClick={() => reviewMutation.mutate({
                        assessmentId: detail.id,
                        decision: "approved",
                        reviewNotes: reviewNotes || undefined,
                      })}
                      disabled={reviewMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs gap-1"
                      onClick={() => reviewMutation.mutate({
                        assessmentId: detail.id,
                        decision: "rejected",
                        reviewNotes: reviewNotes || undefined,
                      })}
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {detail.adminOverride && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs text-soft-gray">
                    <strong>Admin Decision:</strong> {detail.adminOverride === "approved" ? "✅ Approved" : "❌ Rejected"}
                    {detail.reviewNotes && <span className="block mt-1 italic">Notes: "{detail.reviewNotes}"</span>}
                    {detail.reviewedAt && <span className="block mt-1">Reviewed: {new Date(detail.reviewedAt).toLocaleString()}</span>}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="font-sans text-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─── ONBOARDING PIPELINE TAB ───
const PIPELINE_STAGES = [
  { key: "account", label: "Account Created", icon: Users, color: "bg-blue-500" },
  { key: "trust_gate", label: "Trust Gate", icon: Shield, color: "bg-purple-500" },
  { key: "assessment", label: "Assessment", icon: ClipboardCheck, color: "bg-amber-500/100" },
  { key: "application", label: "Application", icon: FileText, color: "bg-electric" },
  { key: "paperwork", label: "Paperwork", icon: FileText, color: "bg-green-500" },
  { key: "complete", label: "Complete", icon: CheckCircle, color: "bg-electric" },
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number]["key"];

function getRepPipelineStage(rep: any, assessment: any, onboardingData: any, application: any): PipelineStage {
  // Check from most complete to least
  if (rep.status === "active" || rep.status === "certified" || rep.status === "training") return "complete";
  if (application && application.agreedToTerms) return "paperwork";
  if (application) return "application";
  if (assessment && (assessment.status === "passed" || assessment.adminOverride === "approved")) return "application";
  if (assessment) return "assessment";
  if (onboardingData && onboardingData.ndaSignedAt) return "assessment";
  if (onboardingData) return "trust_gate";
  return "account";
}

function OnboardingPipelineTab() {
  const { data: reps, isLoading: repsLoading } = trpc.reps.list.useQuery();
  const { data: assessments } = trpc.assessment.adminList.useQuery();

  // Build pipeline data from available information
  const pipelineData = useMemo(() => {
    if (!reps) return [];

    return reps.map((rep: any) => {
      // Find assessment for this rep
      const repAssessment = assessments?.find((a: any) => a.userId === rep.userId);

      // Determine stage based on available data
      let stage: PipelineStage = "account";
      const hasApplication = rep.status !== "applied" || rep.bio;

      if (rep.status === "active" || rep.status === "certified" || rep.status === "training") {
        stage = "complete";
      } else if (rep.status === "onboarding") {
        stage = "paperwork";
      } else if (hasApplication && repAssessment?.status === "passed") {
        stage = "application";
      } else if (repAssessment) {
        stage = "assessment";
      } else {
        // If they have a rep record but no assessment, they're at trust_gate or account
        stage = "trust_gate";
      }

      return {
        id: rep.id,
        name: rep.fullName,
        email: rep.email,
        photo: rep.profilePhotoUrl,
        stage,
        status: rep.status,
        createdAt: rep.createdAt,
        assessmentScore: repAssessment ? parseFloat(repAssessment.totalScore) : null,
        assessmentStatus: repAssessment?.status || null,
      };
    });
  }, [reps, assessments]);

  // Count per stage
  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      account: 0,
      trust_gate: 0,
      assessment: 0,
      application: 0,
      paperwork: 0,
      complete: 0,
    };
    pipelineData.forEach((r: any) => {
      counts[r.stage as PipelineStage]++;
    });
    return counts;
  }, [pipelineData]);

  if (repsLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-off-white text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Onboarding Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual pipeline */}
          <div className="flex items-center gap-1 mb-6">
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = stageCounts[stage.key];
              const total = pipelineData.length || 1;
              const widthPct = Math.max(count / total * 100, 8);

              return (
                <div key={stage.key} className="flex flex-col items-center" style={{ flex: `${widthPct} 0 0%` }}>
                  <div className={`w-full h-8 ${stage.color} rounded-md flex items-center justify-center text-white text-xs font-bold transition-all`}>
                    {count}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pipeline table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="pb-2 font-sans text-soft-gray text-xs font-medium">Candidate</th>
                  <th className="pb-2 font-sans text-soft-gray text-xs font-medium">Current Stage</th>
                  <th className="pb-2 font-sans text-soft-gray text-xs font-medium">Assessment</th>
                  <th className="pb-2 font-sans text-soft-gray text-xs font-medium">Status</th>
                  <th className="pb-2 font-sans text-soft-gray text-xs font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {pipelineData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                      No candidates in the pipeline yet
                    </td>
                  </tr>
                ) : (
                  pipelineData.map((candidate: any) => {
                    const stageConfig = PIPELINE_STAGES.find((s) => s.key === candidate.stage);
                    const StageIcon = stageConfig?.icon || Users;

                    return (
                      <tr key={candidate.id} className="border-b border-border/10 hover:bg-midnight/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {candidate.photo ? (
                              <img src={candidate.photo} alt="Candidate photo" loading="lazy" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-electric/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-off-white">
                                  {candidate.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-off-white text-xs">{candidate.name}</p>
                              <p className="text-[10px] text-muted-foreground">{candidate.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${stageConfig?.color || "bg-gray-400"}`} />
                            <span className="text-xs font-medium text-off-white/80">{stageConfig?.label || "Unknown"}</span>
                          </div>
                          {/* Progress dots */}
                          <div className="flex gap-0.5 mt-1">
                            {PIPELINE_STAGES.map((s, idx) => {
                              const stageIdx = PIPELINE_STAGES.findIndex((ps) => ps.key === candidate.stage);
                              return (
                                <div
                                  key={s.key}
                                  className={`w-3 h-1 rounded-full ${
                                    idx <= stageIdx ? s.color : "bg-gray-200"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3">
                          {candidate.assessmentScore !== null ? (
                            <div>
                              <span className={`text-xs font-bold ${
                                candidate.assessmentStatus === "passed" ? "text-emerald-400" :
                                candidate.assessmentStatus === "borderline" ? "text-amber-400" :
                                "text-red-600"
                              }`}>
                                {candidate.assessmentScore.toFixed(0)}%
                              </span>
                              <Badge
                                variant="outline"
                                className={`ml-1 text-[9px] px-1 ${
                                  candidate.assessmentStatus === "passed" ? "border-green-200 text-green-700" :
                                  candidate.assessmentStatus === "borderline" ? "border-amber-500/20 text-amber-700" :
                                  "border-red-200 text-red-700"
                                }`}
                              >
                                {candidate.assessmentStatus}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Not taken</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge className={`text-[9px] ${statusColors[candidate.status] || "bg-gray-100 text-gray-600"}`}>
                            {candidate.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-[10px] text-muted-foreground">
                          {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          }) : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stalled candidates alert */}
      {pipelineData.filter((c: any) => {
        if (c.stage === "complete") return false;
        const daysSinceApply = c.createdAt ? (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
        return daysSinceApply > 7;
      }).length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/10/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-amber-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Stalled Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-amber-700 mb-3">
              These candidates started the process more than 7 days ago but haven't completed onboarding.
            </p>
            <div className="space-y-2">
              {pipelineData
                .filter((c: any) => {
                  if (c.stage === "complete") return false;
                  const daysSinceApply = c.createdAt ? (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
                  return daysSinceApply > 7;
                })
                .map((c: any) => {
                  const days = c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  const stageConfig = PIPELINE_STAGES.find((s) => s.key === c.stage);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-charcoal rounded border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-900">{c.name}</span>
                        <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700">
                          Stuck at: {stageConfig?.label}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-amber-400 font-medium">{days} days ago</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* Part 1: Provision Phone section shown in rep detail panel */
function ProvisionPhoneSection({ rep }: { rep: any }) {
  const [areaCode, setAreaCode] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { data: available, refetch: searchNumbers, isFetching } = trpc.admin.searchAvailableNumbers.useQuery(
    { areaCode: areaCode || undefined },
    { enabled: false }
  );
  const provision = trpc.admin.provisionRepPhone.useMutation({
    onSuccess: (data) => toast.success(`Provisioned ${data.phoneNumber}`),
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="border border-border/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-sans text-soft-gray">Assigned Twilio Number</p>
          <p className="text-sm text-off-white font-mono">{(rep as any).assignedPhoneNumber || "Not provisioned"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowSearch(!showSearch)} className="text-xs border-electric/20">
          <Phone className="w-3 h-3 mr-1" /> {(rep as any).assignedPhoneNumber ? "Change" : "Provision"}
        </Button>
      </div>
      {showSearch && (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <Input
              placeholder="Area code (optional)"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="h-7 text-xs w-32"
              maxLength={3}
            />
            <Button size="sm" variant="outline" onClick={() => searchNumbers()} disabled={isFetching} className="text-xs h-7">
              {isFetching ? "Searching…" : "Search"}
            </Button>
          </div>
          {available && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {available.map((num: any) => (
                <div key={num.phoneNumber} className="flex items-center justify-between p-2 rounded bg-electric/5 border border-electric/10">
                  <span className="text-xs font-mono text-off-white">{num.phoneNumber}</span>
                  <Button
                    size="sm"
                    onClick={() => provision.mutate({ repId: rep.id, phoneNumber: num.phoneNumber })}
                    disabled={provision.isPending}
                    className="h-6 text-[10px] bg-electric hover:bg-electric-light text-midnight"
                  >
                    Assign
                  </Button>
                </div>
              ))}
              {available.length === 0 && <p className="text-xs text-soft-gray/60 text-center py-2">No numbers found for that area code</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

