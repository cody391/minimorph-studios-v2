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
import {
  Users, CheckCircle, Clock, XCircle, Shield, Trophy, DollarSign,
  FileText, GraduationCap, AlertTriangle, CreditCard, ArrowUpRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  applied: "bg-yellow-100 text-yellow-800 border-yellow-200",
  onboarding: "bg-blue-100 text-blue-800 border-blue-200",
  training: "bg-purple-100 text-purple-800 border-purple-200",
  certified: "bg-green-100 text-green-800 border-green-200",
  active: "bg-forest/10 text-forest border-forest/20",
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
          <h1 className="text-2xl font-serif text-forest">Rep Command Center</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">
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
          { label: "Active", key: "active", icon: CheckCircle, color: "text-forest", count: (repsByStatus["active"] ?? 0) + (repsByStatus["certified"] ?? 0) },
          { label: "At Risk", key: "atrisk", icon: AlertTriangle, color: "text-amber-600", count: atRiskReps.length },
          { label: "Suspended", key: "suspended", icon: XCircle, color: "text-red-600", count: repsByStatus["suspended"] ?? 0 },
        ].map((s) => (
          <Card key={s.key} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-forest">{s.count}</div>
                <div className="text-[10px] text-forest/50 font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-cream-dark/30">
          <TabsTrigger value="overview" className="font-sans text-xs">All Reps</TabsTrigger>
          <TabsTrigger value="applications" className="font-sans text-xs">
            Applications {pendingApps.length > 0 && <Badge className="ml-1 bg-yellow-500 text-white text-[9px] px-1">{pendingApps.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="font-sans text-xs">
            Payouts {(pendingCommissions.length + approvedCommissions.length) > 0 && <Badge className="ml-1 bg-forest text-white text-[9px] px-1">{pendingCommissions.length + approvedCommissions.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="performance" className="font-sans text-xs">Performance</TabsTrigger>
        </TabsList>

        {/* ALL REPS TAB */}
        <TabsContent value="overview">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-forest">All Representatives</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !reps?.length ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-forest/20 mx-auto mb-3" />
                  <p className="text-sm text-forest/50 font-sans">No reps yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Name</th>
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Training</th>
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Deals</th>
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Revenue</th>
                        <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Stripe</th>
                        <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reps.map((rep: any) => (
                        <tr key={rep.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                          <td className="py-3 px-2">
                            <div className="font-medium text-forest">{rep.fullName}</div>
                            <div className="text-xs text-forest/40">{rep.email}</div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={`text-xs font-sans border ${statusColors[rep.status] ?? ""}`}>{rep.status}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Progress value={rep.trainingProgress} className="h-1.5 w-16" />
                              <span className="text-xs text-forest/50">{rep.trainingProgress}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-forest/70">{rep.totalDeals}</td>
                          <td className="py-3 px-2 text-forest/70">${Number(rep.totalRevenue).toLocaleString()}</td>
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
                            <Button variant="ghost" size="sm" className="text-xs text-forest/60 hover:text-forest"
                              onClick={() => { setSelectedRep(rep); setShowDialog(true); }}>
                              Manage
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
        </TabsContent>

        {/* APPLICATIONS TAB */}
        <TabsContent value="applications">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <FileText className="h-4 w-4" /> Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApps.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-10 w-10 text-forest/20 mx-auto mb-3" />
                  <p className="text-sm text-forest/50 font-sans">No pending applications. All caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApps.map((rep: any) => (
                    <div key={rep.id} className="border border-border/50 rounded-lg p-4 hover:border-forest/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-serif text-forest font-medium">{rep.fullName}</h3>
                          <p className="text-xs text-forest/50 font-sans">{rep.email} {rep.phone ? `| ${rep.phone}` : ""}</p>
                          {rep.bio && <p className="text-sm text-forest/70 font-sans mt-2 italic">"{rep.bio}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-forest text-white hover:bg-forest/90 text-xs font-sans"
                            onClick={() => {
                              reviewApp.mutate({ repId: rep.id, approved: true, reviewNotes: reviewNotes || "Approved" });
                            }}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-sans"
                            onClick={() => {
                              reviewApp.mutate({ repId: rep.id, approved: false, reviewNotes: reviewNotes || "Declined" });
                            }}>
                            <XCircle className="h-3 w-3 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Textarea
                          placeholder="Review notes (optional)..."
                          className="text-xs font-sans"
                          rows={2}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                        />
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
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Pending Approval ({pendingCommissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCommissions.length === 0 ? (
                  <p className="text-sm text-forest/50 font-sans text-center py-6">No commissions pending approval.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-sans">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Rep</th>
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Type</th>
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Amount</th>
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Date</th>
                          <th className="text-right py-2 px-2 text-xs text-forest/50 uppercase font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCommissions.map((c: any) => {
                          const rep = reps?.find((r: any) => r.id === c.repId);
                          return (
                            <tr key={c.id} className="border-b border-border/30">
                              <td className="py-2 px-2 text-forest">{rep?.fullName || `Rep #${c.repId}`}</td>
                              <td className="py-2 px-2 text-forest/60">{c.type}</td>
                              <td className="py-2 px-2 font-medium text-forest">${Number(c.amount).toFixed(2)}</td>
                              <td className="py-2 px-2 text-forest/50 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td className="py-2 px-2 text-right">
                                <Button size="sm" className="bg-forest text-white hover:bg-forest/90 text-xs font-sans"
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
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Ready for Payout ({approvedCommissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedCommissions.length === 0 ? (
                  <p className="text-sm text-forest/50 font-sans text-center py-6">No commissions ready for payout.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-sans">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Rep</th>
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Amount</th>
                          <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Stripe</th>
                          <th className="text-right py-2 px-2 text-xs text-forest/50 uppercase font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedCommissions.map((c: any) => {
                          const rep = reps?.find((r: any) => r.id === c.repId);
                          const canPay = rep?.stripeConnectOnboarded;
                          return (
                            <tr key={c.id} className="border-b border-border/30">
                              <td className="py-2 px-2 text-forest">{rep?.fullName || `Rep #${c.repId}`}</td>
                              <td className="py-2 px-2 font-medium text-forest">${Number(c.amount).toFixed(2)}</td>
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
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Performance Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeReps.length ? (
                <p className="text-sm text-forest/50 font-sans text-center py-6">No active reps to rank.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Rank</th>
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Rep</th>
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Deals</th>
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Revenue</th>
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Score</th>
                        <th className="text-left py-2 px-2 text-xs text-forest/50 uppercase font-medium">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeReps]
                        .sort((a: any, b: any) => Number(b.totalRevenue) - Number(a.totalRevenue))
                        .map((rep: any, idx: number) => {
                          const score = Number(rep.performanceScore || 0);
                          const health = score >= 7 ? "Excellent" : score >= 4 ? "Good" : score > 0 ? "At Risk" : "New";
                          const healthColor = score >= 7 ? "text-green-600" : score >= 4 ? "text-forest" : score > 0 ? "text-amber-600" : "text-gray-400";
                          return (
                            <tr key={rep.id} className="border-b border-border/30">
                              <td className="py-3 px-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-cream-dark/30 text-forest/50"}`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-medium text-forest">{rep.fullName}</div>
                                <div className="text-[10px] text-forest/40">{rep.status}</div>
                              </td>
                              <td className="py-3 px-2 text-forest/70">{rep.totalDeals}</td>
                              <td className="py-3 px-2 font-medium text-forest">${Number(rep.totalRevenue).toLocaleString()}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={score * 10} className="h-1.5 w-12" />
                                  <span className="text-xs text-forest/50">{score}/10</span>
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
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
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
      </Tabs>

      {/* Rep Management Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest flex items-center gap-2">
              <Shield className="h-4 w-4" /> Manage: {selectedRep?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedRep && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-forest/50 text-xs">Email</span>
                  <p className="text-forest text-sm">{selectedRep.email}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Phone</span>
                  <p className="text-forest text-sm">{selectedRep.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Total Deals</span>
                  <p className="text-forest text-sm font-medium">{selectedRep.totalDeals}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Revenue</span>
                  <p className="text-forest text-sm font-medium">${Number(selectedRep.totalRevenue).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Training</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={selectedRep.trainingProgress} className="h-1.5 w-16" />
                    <span className="text-xs text-forest/50">{selectedRep.trainingProgress}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Stripe Connect</span>
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
                  <span className="text-xs text-forest/50">Bio</span>
                  <p className="text-sm text-forest/80 mt-1 italic">"{selectedRep.bio}"</p>
                </div>
              )}

              <div>
                <label className="text-xs text-forest/50 block mb-1">Change Status</label>
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
