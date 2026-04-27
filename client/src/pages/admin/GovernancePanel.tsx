/**
 * Admin Governance Panel — AI-managed rep accountability oversight
 * 
 * Provides: Rep roster with real-time Performance Scores, Strike management,
 * Deactivation workflow, Override controls, Flag queue
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield, Crown, Gem, Medal, AlertTriangle, CheckCircle, XCircle,
  Target, DollarSign, Ban, Eye, Gavel, UserX, ArrowUpDown,
  Search, ChevronDown, Activity, AlertCircle, Zap,
} from "lucide-react";
import {
  TIER_CONFIG, STRIKE_RULES, LEAD_ALLOCATION,
  getScoreRating, type TierKey,
} from "@shared/accountability";

const tierIcons: Record<string, any> = {
  bronze: Shield,
  silver: Medal,
  gold: Crown,
  platinum: Gem,
};

const tierBadgeColors: Record<string, string> = {
  bronze: "badge-pending-payment border-amber-500/20",
  silver: "bg-slate-100 text-slate-600 border-slate-200",
  gold: "bg-yellow-100 text-amber-400 border-amber-500/20",
  platinum: "bg-violet-100 text-violet-600 border-violet-200",
};

const severityColors: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-800",
  strike: "bg-orange-100 text-orange-800",
  instant_deactivation: "bg-red-100 text-red-800",
};

const strikeStatusColors: Record<string, string> = {
  pending: "badge-pending",
  confirmed: "badge-danger",
  dismissed: "badge-success",
  appealed: "badge-info",
};

export default function GovernancePanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score_asc" | "score_desc" | "strikes" | "name">("score_desc");
  const [showStrikeDialog, setShowStrikeDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [selectedStrike, setSelectedStrike] = useState<any>(null);

  // Strike form state
  const [strikeSeverity, setStrikeSeverity] = useState<string>("warning");
  const [strikeCategory, setStrikeCategory] = useState<string>("performance");
  const [strikeDescription, setStrikeDescription] = useState("");
  const [strikeEvidence, setStrikeEvidence] = useState("");
  const [strikeRequiredAction, setStrikeRequiredAction] = useState("");

  // Override form state
  const [overrideScoreValue, setOverrideScoreValue] = useState("");
  const [overrideReasonText, setOverrideReasonText] = useState("");

  // Deactivate form state
  const [deactivateReason, setDeactivateReason] = useState("");

  // Review form state
  const [reviewResolution, setReviewResolution] = useState("");

  // Queries
  const { data: allScores, isLoading: scoresLoading, refetch: refetchScores } = trpc.accountability.adminGetAllScores.useQuery(undefined, { retry: false });
  const { data: allStrikes, isLoading: strikesLoading, refetch: refetchStrikes } = trpc.accountability.adminGetStrikes.useQuery({}, { retry: false });

  // Mutations
  const issueStrike = trpc.accountability.adminIssueStrike.useMutation({
    onSuccess: (data) => {
      if (data.deactivated) {
        toast.error("Rep has been automatically deactivated due to strikes");
      } else {
        toast.success("Strike issued successfully");
      }
      refetchScores();
      refetchStrikes();
      setShowStrikeDialog(false);
      resetStrikeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const reviewStrike = trpc.accountability.adminReviewStrike.useMutation({
    onSuccess: () => {
      toast.success("Strike reviewed");
      refetchStrikes();
      refetchScores();
      setShowReviewDialog(false);
      setSelectedStrike(null);
      setReviewResolution("");
    },
    onError: (e) => toast.error(e.message),
  });

  const overrideScoreMutation = trpc.accountability.adminOverrideScore.useMutation({
    onSuccess: () => {
      toast.success("Score overridden");
      refetchScores();
      setShowOverrideDialog(false);
      setOverrideScoreValue("");
      setOverrideReasonText("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivateRep = trpc.accountability.adminDeactivateRep.useMutation({
    onSuccess: () => {
      toast.success("Rep deactivated");
      refetchScores();
      setShowDeactivateDialog(false);
      setDeactivateReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const allocateLead = trpc.accountability.adminAllocateLead.useMutation({
    onSuccess: (data) => {
      toast.success(`Lead assigned to rep #${data.repId}`);
      refetchScores();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetStrikeForm = () => {
    setStrikeSeverity("warning");
    setStrikeCategory("performance");
    setStrikeDescription("");
    setStrikeEvidence("");
    setStrikeRequiredAction("");
  };

  // Derived data
  const filteredAndSorted = useMemo(() => {
    if (!allScores) return [];
    let filtered = allScores;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s: any) =>
        s.rep.fullName?.toLowerCase().includes(q) ||
        s.rep.email?.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a: any, b: any) => {
      const scoreA = Number(a.latestScore?.overallScore ?? a.rep.performanceScore ?? 0);
      const scoreB = Number(b.latestScore?.overallScore ?? b.rep.performanceScore ?? 0);
      switch (sortBy) {
        case "score_asc": return scoreA - scoreB;
        case "score_desc": return scoreB - scoreA;
        case "strikes": return b.activeStrikes - a.activeStrikes;
        case "name": return (a.rep.fullName || "").localeCompare(b.rep.fullName || "");
        default: return 0;
      }
    });
  }, [allScores, searchQuery, sortBy]);

  const pendingStrikes = useMemo(() =>
    (allStrikes || []).filter((s: any) => s.status === "pending"),
    [allStrikes]
  );

  const atRiskReps = useMemo(() =>
    (allScores || []).filter((s: any) => {
      const score = Number(s.latestScore?.overallScore ?? s.rep.performanceScore ?? 0);
      return score < LEAD_ALLOCATION.freezeThreshold || s.activeStrikes >= 2;
    }),
    [allScores]
  );

  // Summary stats
  const avgScore = useMemo(() => {
    if (!allScores?.length) return 0;
    const total = allScores.reduce((sum: number, s: any) => sum + Number(s.latestScore?.overallScore ?? s.rep.performanceScore ?? 0), 0);
    return Math.round(total / allScores.length);
  }, [allScores]);

  const totalStrikes = useMemo(() =>
    allScores?.reduce((sum: number, s: any) => sum + s.activeStrikes, 0) ?? 0,
    [allScores]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-off-white flex items-center gap-2">
            <Gavel className="h-5 w-5 text-electric" /> Governance Panel
          </h2>
          <p className="text-sm text-soft-gray font-sans mt-1">
            AI-managed accountability system — scores, tiers, strikes, and lead allocation
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Score", value: avgScore, icon: Activity, color: avgScore >= 60 ? "text-emerald-400" : "text-amber-400" },
          { label: "At Risk", value: atRiskReps.length, icon: AlertTriangle, color: "text-red-600" },
          { label: "Active Strikes", value: totalStrikes, icon: AlertCircle, color: "text-orange-600" },
          { label: "Pending Review", value: pendingStrikes.length, icon: Eye, color: "text-blue-600" },
        ].map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <m.icon className={`h-5 w-5 ${m.color}`} />
              <div>
                <div className="text-lg font-serif text-off-white">{m.value}</div>
                <div className="text-[10px] text-soft-gray font-sans">{m.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flag Queue — Pending Strikes */}
      {pendingStrikes.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/10/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-400" /> Flag Queue ({pendingStrikes.length} pending)
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              AI-flagged interactions awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingStrikes.slice(0, 10).map((strike: any) => {
                const repInfo = allScores?.find((s: any) => s.rep.id === strike.repId);
                return (
                  <div key={strike.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-500/20 bg-charcoal">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-sans text-off-white font-medium">
                          {repInfo?.rep.fullName || `Rep #${strike.repId}`}
                        </span>
                        <Badge className={`text-[10px] font-sans ${severityColors[strike.severity] || ""}`}>
                          {strike.severity.replace(/_/g, " ")}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-600 text-[10px] font-sans">
                          {strike.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-soft-gray font-sans truncate">{strike.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-sans h-7 px-2"
                        onClick={() => reviewStrike.mutate({ strikeId: strike.id, action: "dismiss" })}
                        disabled={reviewStrike.isPending}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-sans h-7 px-2"
                        onClick={() => reviewStrike.mutate({ strikeId: strike.id, action: "confirm" })}
                        disabled={reviewStrike.isPending}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-sans h-7 px-2"
                        onClick={() => { setSelectedStrike(strike); setShowReviewDialog(true); }}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-soft-gray/40" />
          <Input
            placeholder="Search reps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 font-sans text-sm h-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px] h-9 font-sans text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score_desc">Score: High → Low</SelectItem>
            <SelectItem value="score_asc">Score: Low → High</SelectItem>
            <SelectItem value="strikes">Most Strikes</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rep Roster with Scores */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white">Rep Roster — Performance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {scoresLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !filteredAndSorted.length ? (
            <div className="text-center py-12">
              <Shield className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No reps found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSorted.map((entry: any) => {
                const score = Number(entry.latestScore?.overallScore ?? entry.rep.performanceScore ?? 0);
                const rating = getScoreRating(score);
                const tier = (entry.tier?.tier ?? "bronze") as TierKey;
                const TIcon = tierIcons[tier] || Shield;
                const isFrozen = score < LEAD_ALLOCATION.freezeThreshold && score > 0;

                return (
                  <div key={entry.rep.id} className={`p-4 rounded-lg border transition-colors ${
                    isFrozen ? "border-red-200 bg-red-50/30" :
                    entry.activeStrikes >= 2 ? "border-orange-200 bg-orange-50/30" :
                    "border-border/30 hover:border-electric/20"
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Rep Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-graphite/20 flex items-center justify-center text-soft-gray/60 text-sm font-bold shrink-0">
                          {(entry.rep.fullName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-sans text-off-white font-medium truncate">{entry.rep.fullName || "Unknown"}</span>
                            <Badge className={`text-[10px] font-sans ${tierBadgeColors[tier]}`}>
                              <TIcon className="w-2.5 h-2.5 mr-0.5" /> {TIER_CONFIG[tier].name}
                            </Badge>
                            {isFrozen && (
                              <Badge className="badge-danger text-[10px] font-sans">
                                <Ban className="w-2.5 h-2.5 mr-0.5" /> Frozen
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-soft-gray/60 font-sans">{entry.rep.email}</p>
                        </div>
                      </div>

                      {/* Score + Metrics */}
                      <div className="flex items-center gap-4">
                        {/* Score */}
                        <div className="text-center">
                          <div className={`text-lg font-serif font-bold ${
                            rating.color === "green" ? "text-emerald-400" :
                            rating.color === "blue" ? "text-blue-600" :
                            rating.color === "yellow" ? "text-amber-400" :
                            rating.color === "orange" ? "text-orange-600" :
                            "text-red-600"
                          }`}>{Math.round(score)}</div>
                          <p className="text-[10px] text-soft-gray/60 font-sans">score</p>
                        </div>

                        {/* Strikes */}
                        <div className="text-center">
                          <div className={`text-lg font-serif font-bold ${
                            entry.activeStrikes === 0 ? "text-emerald-400" :
                            entry.activeStrikes < STRIKE_RULES.maxStrikesBeforeDeactivation ? "text-orange-600" :
                            "text-red-600"
                          }`}>{entry.activeStrikes}</div>
                          <p className="text-[10px] text-soft-gray/60 font-sans">strikes</p>
                        </div>

                        {/* Commission Rate */}
                        <div className="text-center hidden sm:block">
                          <div className="text-lg font-serif text-off-white">{TIER_CONFIG[tier].commissionRate}%</div>
                          <p className="text-[10px] text-soft-gray/60 font-sans">rate</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] font-sans h-7 px-2 border-border/40"
                            onClick={() => { setSelectedRepId(entry.rep.id); setShowOverrideDialog(true); }}
                            title="Override Score"
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] font-sans h-7 px-2 border-amber-300 text-amber-700 hover:bg-amber-500/10"
                            onClick={() => { setSelectedRepId(entry.rep.id); setShowStrikeDialog(true); }}
                            title="Issue Strike"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] font-sans h-7 px-2 border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => { setSelectedRepId(entry.rep.id); setShowDeactivateDialog(true); }}
                            title="Deactivate Rep"
                          >
                            <UserX className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown Bar */}
                    {entry.latestScore && (
                      <div className="mt-3 flex items-center gap-2">
                        {[
                          { label: "Act", value: Number(entry.latestScore.activityScore), color: "bg-blue-400" },
                          { label: "Close", value: Number(entry.latestScore.closeRateScore), color: "bg-green-400" },
                          { label: "Sat", value: Number(entry.latestScore.clientSatisfactionScore), color: "bg-purple-400" },
                          { label: "Val", value: Number(entry.latestScore.valuesComplianceScore), color: "bg-amber-400" },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center gap-1 flex-1">
                            <span className="text-[9px] text-soft-gray/40 font-sans w-8 shrink-0">{s.label}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.value}%` }} />
                            </div>
                            <span className="text-[9px] text-soft-gray/60 font-sans w-5 text-right">{Math.round(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strike History */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" /> All Strikes ({allStrikes?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strikesLoading ? <Skeleton className="h-32 w-full" /> : !allStrikes?.length ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-green-700 font-sans">No strikes recorded</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allStrikes.slice(0, 20).map((strike: any) => {
                const repInfo = allScores?.find((s: any) => s.rep.id === strike.repId);
                return (
                  <div key={strike.id} className={`p-3 rounded-lg border ${
                    strike.status === "confirmed" ? "border-red-200 bg-red-50/30" :
                    strike.status === "dismissed" ? "border-green-200 bg-green-50/30" :
                    "border-yellow-200 bg-yellow-50/30"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-sans text-off-white font-medium">
                            {repInfo?.rep.fullName || `Rep #${strike.repId}`}
                          </span>
                          <Badge className={`text-[10px] font-sans ${severityColors[strike.severity] || ""}`}>
                            {strike.severity.replace(/_/g, " ")}
                          </Badge>
                          <Badge className="bg-gray-100 text-gray-600 text-[10px] font-sans">
                            {strike.category.replace(/_/g, " ")}
                          </Badge>
                          <Badge className={`text-[10px] font-sans ${strikeStatusColors[strike.status] || ""}`}>
                            {strike.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-soft-gray font-sans">{strike.description}</p>
                        {strike.evidence && (
                          <p className="text-[10px] text-soft-gray/40 font-sans mt-1 italic">Evidence: {strike.evidence}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[10px] text-soft-gray/60 font-sans">
                          {strike.createdAt ? new Date(strike.createdAt).toLocaleDateString() : ""}
                        </p>
                        {strike.status === "pending" && (
                          <div className="flex gap-1 mt-1">
                            <Button size="sm" variant="outline" className="text-[10px] h-6 px-1.5" onClick={() => { setSelectedStrike(strike); setShowReviewDialog(true); }}>
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ DIALOGS ═══════ */}

      {/* Issue Strike Dialog */}
      <Dialog open={showStrikeDialog} onOpenChange={setShowStrikeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" /> Issue Strike
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-sans">Severity</Label>
              <Select value={strikeSeverity} onValueChange={setStrikeSeverity}>
                <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning (Minor)</SelectItem>
                  <SelectItem value="strike">Strike (Major)</SelectItem>
                  <SelectItem value="instant_deactivation">Instant Deactivation (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-sans">Category</Label>
              <Select value={strikeCategory} onValueChange={setStrikeCategory}>
                <SelectTrigger className="font-sans text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="values_violation">Values Violation</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="professionalism">Professionalism</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="confidentiality_breach">Confidentiality Breach</SelectItem>
                  <SelectItem value="client_harm">Client Harm</SelectItem>
                  <SelectItem value="misrepresentation">Misrepresentation</SelectItem>
                  <SelectItem value="inactivity">Inactivity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-sans">Description</Label>
              <Textarea
                value={strikeDescription}
                onChange={(e) => setStrikeDescription(e.target.value)}
                placeholder="Describe the violation in detail..."
                className="font-sans text-sm"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Evidence (optional)</Label>
              <Textarea
                value={strikeEvidence}
                onChange={(e) => setStrikeEvidence(e.target.value)}
                placeholder="Link to conversation, screenshot, or other evidence..."
                className="font-sans text-sm"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Required Action (optional)</Label>
              <Input
                value={strikeRequiredAction}
                onChange={(e) => setStrikeRequiredAction(e.target.value)}
                placeholder="e.g., Complete retraining module on values"
                className="font-sans text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStrikeDialog(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-sans text-sm"
              disabled={!strikeDescription || strikeDescription.length < 10 || issueStrike.isPending}
              onClick={() => {
                if (!selectedRepId) return;
                issueStrike.mutate({
                  repId: selectedRepId,
                  severity: strikeSeverity as any,
                  category: strikeCategory as any,
                  description: strikeDescription,
                  evidence: strikeEvidence || undefined,
                  requiredAction: strikeRequiredAction || undefined,
                });
              }}
            >
              {issueStrike.isPending ? "Issuing..." : "Issue Strike"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Score Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-electric" /> Override Performance Score
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-sans">New Score (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={overrideScoreValue}
                onChange={(e) => setOverrideScoreValue(e.target.value)}
                placeholder="Enter new score..."
                className="font-sans text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-sans">Reason</Label>
              <Textarea
                value={overrideReasonText}
                onChange={(e) => setOverrideReasonText(e.target.value)}
                placeholder="Explain why you're overriding the AI-calculated score..."
                className="font-sans text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              className="bg-electric hover:bg-electric/90 text-white font-sans text-sm"
              disabled={!overrideScoreValue || !overrideReasonText || overrideReasonText.length < 5 || overrideScoreMutation.isPending}
              onClick={() => {
                if (!selectedRepId) return;
                overrideScoreMutation.mutate({
                  repId: selectedRepId,
                  overallScore: Number(overrideScoreValue),
                  reason: overrideReasonText,
                });
              }}
            >
              Override Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Rep Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-red-700 flex items-center gap-2">
              <UserX className="h-5 w-5" /> Deactivate Representative
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-xs text-red-700 font-sans">
              This will immediately freeze all assigned leads, suspend the rep, and log a deactivation strike. This action cannot be undone automatically.
            </p>
          </div>
          <div>
            <Label className="text-xs font-sans">Reason for Deactivation</Label>
            <Textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="Provide a detailed reason for deactivation..."
              className="font-sans text-sm"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-sans text-sm"
              disabled={!deactivateReason || deactivateReason.length < 10 || deactivateRep.isPending}
              onClick={() => {
                if (!selectedRepId) return;
                deactivateRep.mutate({
                  repId: selectedRepId,
                  reason: deactivateReason,
                });
              }}
            >
              {deactivateRep.isPending ? "Deactivating..." : "Deactivate Rep"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Strike Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" /> Review Strike
            </DialogTitle>
          </DialogHeader>
          {selectedStrike && (
            <div className="space-y-4">
              <div className="p-3 bg-midnight-dark/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] font-sans ${severityColors[selectedStrike.severity] || ""}`}>
                    {selectedStrike.severity.replace(/_/g, " ")}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-600 text-[10px] font-sans">
                    {selectedStrike.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-off-white font-sans">{selectedStrike.description}</p>
                {selectedStrike.evidence && (
                  <div className="p-2 bg-charcoal rounded border border-border/20">
                    <p className="text-[10px] text-soft-gray/60 font-sans uppercase mb-1">Evidence</p>
                    <p className="text-xs text-soft-gray font-sans">{selectedStrike.evidence}</p>
                  </div>
                )}
                <p className="text-[10px] text-soft-gray/40 font-sans">
                  Source: {selectedStrike.source} &bull; {selectedStrike.createdAt ? new Date(selectedStrike.createdAt).toLocaleString() : ""}
                </p>
              </div>
              <div>
                <Label className="text-xs font-sans">Resolution Notes (optional)</Label>
                <Textarea
                  value={reviewResolution}
                  onChange={(e) => setReviewResolution(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="font-sans text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-sans text-sm"
              disabled={reviewStrike.isPending}
              onClick={() => {
                if (!selectedStrike) return;
                reviewStrike.mutate({
                  strikeId: selectedStrike.id,
                  action: "dismiss",
                  resolution: reviewResolution || undefined,
                });
              }}
            >
              Dismiss
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-sans text-sm"
              disabled={reviewStrike.isPending}
              onClick={() => {
                if (!selectedStrike) return;
                reviewStrike.mutate({
                  strikeId: selectedStrike.id,
                  action: "confirm",
                  resolution: reviewResolution || undefined,
                });
              }}
            >
              Confirm Strike
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
