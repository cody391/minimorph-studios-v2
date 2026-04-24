/**
 * PerformanceHub — Uber-driver-style accountability dashboard for reps
 * 
 * Shows: Performance Score gauge, Tier progress, Lead Queue, Missed Opportunities,
 * Earnings summary, Activity tracker, Strikes, Residual health indicator
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Gauge, TrendingUp, TrendingDown, Shield, Crown, Gem, Medal,
  AlertTriangle, CheckCircle, XCircle, Clock, DollarSign, Target,
  Phone, Mail, Calendar, FileText, Zap, ArrowRight, RefreshCw,
  AlertCircle, ChevronUp, Activity, Eye, Ban, Flame,
} from "lucide-react";
import {
  TIER_CONFIG, TIER_ORDER, LEAD_ALLOCATION, STRIKE_RULES,
  getResidualHealthStatus, getScoreRating, type TierKey,
} from "@shared/accountability";

const tierIcons: Record<string, any> = {
  bronze: Shield,
  silver: Medal,
  gold: Crown,
  platinum: Gem,
};

const tierGradients: Record<string, string> = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-400 to-slate-600",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-violet-400 to-purple-600",
};

const tierBgColors: Record<string, string> = {
  bronze: "bg-amber-50 border-amber-200",
  silver: "bg-slate-50 border-slate-200",
  gold: "bg-yellow-50 border-amber-200",
  platinum: "bg-violet-50 border-violet-200",
};

const tierTextColors: Record<string, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-600",
  gold: "text-amber-600",
  platinum: "text-violet-600",
};

interface PerformanceHubProps {
  repProfile: any;
}

export default function PerformanceHub({ repProfile }: PerformanceHubProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Accountability queries
  const { data: scoreData, isLoading: scoreLoading, refetch: refetchScore } = trpc.accountability.getMyScore.useQuery(undefined, { retry: false });
  const { data: tierData, isLoading: tierLoading, refetch: refetchTier } = trpc.accountability.getMyTier.useQuery(undefined, { retry: false });
  const { data: leadQueue, isLoading: leadsLoading, refetch: refetchLeads } = trpc.accountability.getLeadQueue.useQuery(undefined, { retry: false });
  const { data: missedOps, isLoading: missedLoading } = trpc.accountability.getMissedOpportunities.useQuery(undefined, { retry: false });
  const { data: earnings, isLoading: earningsLoading } = trpc.accountability.getEarningsSummary.useQuery(undefined, { retry: false });
  const { data: activitySummary, isLoading: activityLoading } = trpc.accountability.getActivitySummary.useQuery(undefined, { retry: false });
  const { data: strikes, isLoading: strikesLoading } = trpc.accountability.getMyStrikes.useQuery(undefined, { retry: false });

  const calculateScore = trpc.accountability.calculateAndStoreScore.useMutation({
    onSuccess: () => { refetchScore(); refetchTier(); toast.success("Performance score updated"); setIsRecalculating(false); },
    onError: () => { toast.error("Failed to calculate score"); setIsRecalculating(false); },
  });

  const recalculateTier = trpc.accountability.recalculateTier.useMutation({
    onSuccess: () => { refetchTier(); },
  });

  const acceptLead = trpc.accountability.acceptLead.useMutation({
    onSuccess: () => { refetchLeads(); toast.success("Lead accepted! Check your pipeline."); },
    onError: (e) => toast.error(e.message),
  });

  const rejectLead = trpc.accountability.rejectLead.useMutation({
    onSuccess: () => { refetchLeads(); toast.info("Lead returned to pool"); },
    onError: (e) => toast.error(e.message),
  });

  const handleRecalculate = () => {
    setIsRecalculating(true);
    calculateScore.mutate();
    recalculateTier.mutate();
  };

  const currentScore = scoreData?.latestScore ? Number(scoreData.latestScore.overallScore) : 0;
  const scoreRating = getScoreRating(currentScore);
  const residualHealth = getResidualHealthStatus(earnings?.residualDecayRate ?? 1.0);
  const currentTier = (tierData?.tier ?? "bronze") as TierKey;
  const TierIcon = tierIcons[currentTier] || Shield;
  const currentTierIndex = TIER_ORDER.indexOf(currentTier);
  const nextTierKey = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextTierConfig = nextTierKey ? TIER_CONFIG[nextTierKey] : null;

  // Calculate tier progress
  const tierProgressPct = useMemo(() => {
    if (!nextTierConfig || !tierData) return 100;
    const currentRevenue = tierData.monthlyRevenue ?? 0;
    const currentMonths = tierData.monthsActive ?? 0;
    const revenueProgress = Math.min(100, (currentRevenue / nextTierConfig.minMonthlyRevenue) * 100);
    const monthsProgress = Math.min(100, (currentMonths / nextTierConfig.minMonths) * 100);
    return Math.round((revenueProgress + monthsProgress) / 2);
  }, [tierData, nextTierConfig]);

  return (
    <div className="space-y-6">
      {/* Top Row: Score + Tier + Residual Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance Score Gauge */}
        <Card className="border-border/50 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            currentScore >= 80 ? "from-green-400 to-emerald-500" :
            currentScore >= 60 ? "from-blue-400 to-blue-500" :
            currentScore >= 40 ? "from-yellow-400 to-amber-500" :
            "from-red-400 to-red-500"
          }`} />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Performance Score</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleRecalculate} disabled={isRecalculating}>
                <RefreshCw className={`h-3.5 w-3.5 text-forest/40 ${isRecalculating ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {scoreLoading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-serif text-forest font-bold">{Math.round(currentScore)}</span>
                  <span className="text-sm text-forest/40 font-sans mb-1">/100</span>
                </div>
                <Badge className={`text-[10px] font-sans ${
                  scoreRating.color === "green" ? "bg-green-100 text-green-700" :
                  scoreRating.color === "blue" ? "bg-blue-100 text-blue-700" :
                  scoreRating.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                  scoreRating.color === "orange" ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                }`}>{scoreRating.label}</Badge>
                {/* Score Breakdown */}
                {scoreData?.latestScore && (
                  <div className="mt-3 space-y-1.5">
                    {[
                      { label: "Activity", value: Number(scoreData.latestScore.activityScore), weight: "30%" },
                      { label: "Close Rate", value: Number(scoreData.latestScore.closeRateScore), weight: "30%" },
                      { label: "Client Satisfaction", value: Number(scoreData.latestScore.clientSatisfactionScore), weight: "20%" },
                      { label: "Values Compliance", value: Number(scoreData.latestScore.valuesComplianceScore), weight: "20%" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-forest/40 font-sans w-24 shrink-0">{s.label}</span>
                        <Progress value={s.value} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-forest/60 font-sans w-8 text-right">{Math.round(s.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Tier */}
        <Card className={`border overflow-hidden ${tierBgColors[currentTier]}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Current Tier</span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierGradients[currentTier]} flex items-center justify-center`}>
                <TierIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            {tierLoading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <div className="flex items-end gap-2 mb-1">
                  <span className={`text-2xl font-serif font-bold ${tierTextColors[currentTier]}`}>
                    {TIER_CONFIG[currentTier].name}
                  </span>
                </div>
                <p className="text-xs text-forest/50 font-sans mb-3">
                  {TIER_CONFIG[currentTier].commissionRate}% commission rate
                </p>
                {nextTierConfig && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-forest/40 font-sans">Progress to {nextTierConfig.name}</span>
                      <span className="text-[10px] text-forest/60 font-sans font-medium">{tierProgressPct}%</span>
                    </div>
                    <Progress value={tierProgressPct} className="h-2 mb-2" />
                    <div className="flex items-center gap-3 text-[10px] text-forest/40 font-sans">
                      <span>Need: ${nextTierConfig.minMonthlyRevenue.toLocaleString()}/mo</span>
                      <span>&bull;</span>
                      <span>{nextTierConfig.minMonths}+ months</span>
                    </div>
                  </div>
                )}
                {!nextTierConfig && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-600 font-sans">
                    <Gem className="w-3.5 h-3.5" />
                    <span>Maximum tier achieved</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Residual Health */}
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Residual Health</span>
              <Activity className="h-4 w-4 text-forest/30" />
            </div>
            {earningsLoading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    residualHealth.color === "green" ? "bg-green-500" :
                    residualHealth.color === "yellow" ? "bg-yellow-500" :
                    residualHealth.color === "orange" ? "bg-orange-500" :
                    residualHealth.color === "red" ? "bg-red-500" :
                    "bg-gray-400"
                  }`} />
                  <span className={`text-lg font-serif font-bold ${
                    residualHealth.color === "green" ? "text-green-700" :
                    residualHealth.color === "yellow" ? "text-yellow-700" :
                    residualHealth.color === "orange" ? "text-orange-700" :
                    residualHealth.color === "red" ? "text-red-700" :
                    "text-gray-500"
                  }`}>{residualHealth.label}</span>
                </div>
                <p className="text-xs text-forest/50 font-sans mb-2">
                  Decay Rate: {Math.round((earnings?.residualDecayRate ?? 1) * 100)}%
                </p>
                <p className="text-xs text-forest/50 font-sans">
                  Total Residuals: <span className="font-medium text-forest">${(earnings?.totalResiduals ?? 0).toLocaleString()}</span>
                </p>
                {residualHealth.status !== "active" && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[10px] text-amber-700 font-sans flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Log activity to prevent further residual decay
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {earningsLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />) : [
          { label: "Today", value: earnings?.today ?? 0, icon: DollarSign, color: "text-green-600" },
          { label: "This Week", value: earnings?.thisWeek ?? 0, icon: TrendingUp, color: "text-blue-600" },
          { label: "This Month", value: earnings?.thisMonth ?? 0, icon: Target, color: "text-forest" },
          { label: "All Time", value: earnings?.totalAllTime ?? 0, icon: Zap, color: "text-terracotta" },
        ].map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-forest/50 font-sans uppercase tracking-wide">{m.label}</span>
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              </div>
              <div className="text-xl font-serif text-forest">${m.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead Queue + Missed Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Queue (Uber-style) */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <Target className="h-4 w-4 text-terracotta" /> Lead Queue
              </CardTitle>
              {leadQueue && (
                <Badge className="bg-forest/10 text-forest text-[10px] font-sans">
                  {leadQueue.allocations.length}/{leadQueue.maxLeads} slots
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs font-sans">
              Accept leads within {LEAD_ALLOCATION.timeoutHours}h or they go to the next rep
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsLoading ? <Skeleton className="h-32 w-full" /> : (
              <>
                {!leadQueue?.allocations.length ? (
                  <div className="text-center py-8">
                    <Target className="h-8 w-8 text-forest/20 mx-auto mb-3" />
                    <p className="text-sm text-forest/50 font-sans">No leads in your queue right now</p>
                    <p className="text-xs text-forest/30 font-sans mt-1">Keep your score high to receive more leads</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leadQueue.allocations.map((alloc: any) => {
                      const lead = leadQueue.leads.find((l: any) => l.id === alloc.leadId);
                      const timeLeft = alloc.timeoutAt ? Math.max(0, Math.round((new Date(alloc.timeoutAt).getTime() - Date.now()) / (1000 * 60 * 60))) : null;
                      return (
                        <div key={alloc.id} className="p-3 rounded-lg border border-border/30 hover:border-forest/20 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-sans text-forest font-medium truncate">
                                {lead?.businessName || `Lead #${alloc.leadId}`}
                              </p>
                              <p className="text-xs text-forest/50 font-sans">
                                {lead?.contactName} &bull; {lead?.industry || "Unknown industry"}
                              </p>
                            </div>
                            {timeLeft !== null && (
                              <Badge className={`text-[10px] font-sans shrink-0 ${
                                timeLeft <= 1 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                <Clock className="w-2.5 h-2.5 mr-0.5" />
                                {timeLeft}h left
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-forest hover:bg-forest/90 text-white text-xs font-sans rounded-full h-7 px-3"
                              onClick={() => acceptLead.mutate({ allocationId: alloc.id })}
                              disabled={acceptLead.isPending}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs font-sans rounded-full h-7 px-3 border-border/40"
                              onClick={() => rejectLead.mutate({ allocationId: alloc.id })}
                              disabled={rejectLead.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Pass
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Missed Opportunities — Loss Aversion */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Missed Opportunities
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Money you left on the table this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missedLoading ? <Skeleton className="h-32 w-full" /> : (
              <>
                {missedOps && missedOps.estimatedLostRevenue > 0 ? (
                  <div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <DollarSign className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-serif text-red-700 font-bold">
                            ${missedOps.estimatedLostRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-red-600/70 font-sans">{missedOps.message}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {missedOps.missedLeads.slice(0, 5).map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border/20 text-xs font-sans">
                          <span className="text-forest/60">Lead #{m.leadId}</span>
                          <Badge className="bg-red-50 text-red-600 text-[10px]">{m.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-green-700 font-sans font-medium">No missed opportunities</p>
                    <p className="text-xs text-forest/40 font-sans mt-1">Keep it up — you're capturing every opportunity</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary + Strikes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
              <Activity className="h-4 w-4 text-terracotta" /> Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Calls Made", value: activitySummary?.today?.callsMade ?? 0, icon: Phone, target: 5 },
                  { label: "Emails Sent", value: activitySummary?.today?.emailsSent ?? 0, icon: Mail, target: 10 },
                  { label: "Follow-ups", value: activitySummary?.today?.followUpsSent ?? 0, icon: RefreshCw, target: 3 },
                  { label: "Meetings", value: activitySummary?.today?.meetingsBooked ?? 0, icon: Calendar, target: 2 },
                  { label: "Proposals", value: activitySummary?.today?.proposalsSent ?? 0, icon: FileText, target: 2 },
                  { label: "Deals Closed", value: activitySummary?.today?.dealsClosed ?? 0, icon: CheckCircle, target: 1 },
                ].map((a) => (
                  <div key={a.label} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/20">
                    <a.icon className="w-4 h-4 text-forest/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-forest/40 font-sans">{a.label}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-serif text-forest font-medium">{a.value}</span>
                        <span className="text-[10px] text-forest/30 font-sans">/ {a.target}</span>
                      </div>
                    </div>
                    {a.value >= a.target && <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strike History */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" /> Strike Record
              </CardTitle>
              {strikes && (
                <Badge className={`text-[10px] font-sans ${
                  strikes.confirmedStrikeCount === 0 ? "bg-green-100 text-green-700" :
                  strikes.confirmedStrikeCount < STRIKE_RULES.maxStrikesBeforeDeactivation ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {strikes.confirmedStrikeCount}/{STRIKE_RULES.maxStrikesBeforeDeactivation} strikes
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs font-sans">
              {STRIKE_RULES.maxStrikesBeforeDeactivation} strikes in {STRIKE_RULES.strikePeriodMonths} months = automatic deactivation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {strikesLoading ? <Skeleton className="h-32 w-full" /> : (
              <>
                {!strikes?.strikes.length ? (
                  <div className="text-center py-8">
                    <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-green-700 font-sans font-medium">Clean record</p>
                    <p className="text-xs text-forest/40 font-sans mt-1">No strikes or warnings. Keep representing our values.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {strikes.strikes.map((s: any) => (
                      <div key={s.id} className={`p-3 rounded-lg border ${
                        s.severity === "instant_deactivation" ? "border-red-300 bg-red-50" :
                        s.severity === "strike" ? "border-orange-200 bg-orange-50" :
                        "border-yellow-200 bg-yellow-50"
                      }`}>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] font-sans ${
                              s.severity === "instant_deactivation" ? "bg-red-200 text-red-800" :
                              s.severity === "strike" ? "bg-orange-200 text-orange-800" :
                              "bg-yellow-200 text-yellow-800"
                            }`}>{s.severity.replace(/_/g, " ")}</Badge>
                            <Badge className="bg-gray-100 text-gray-600 text-[10px] font-sans">{s.category.replace(/_/g, " ")}</Badge>
                          </div>
                          <Badge className={`text-[10px] font-sans ${
                            s.status === "confirmed" ? "bg-red-100 text-red-700" :
                            s.status === "dismissed" ? "bg-green-100 text-green-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>{s.status}</Badge>
                        </div>
                        <p className="text-xs text-forest/60 font-sans">{s.description}</p>
                        <p className="text-[10px] text-forest/30 font-sans mt-1">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score Below Threshold Warning */}
      {currentScore > 0 && currentScore < LEAD_ALLOCATION.freezeThreshold && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-serif text-red-800 font-bold mb-1">Lead Freeze Active</h3>
                <p className="text-xs text-red-700/80 font-sans">
                  Your performance score ({Math.round(currentScore)}) is below the minimum threshold of {LEAD_ALLOCATION.freezeThreshold}. 
                  You will not receive new leads until your score improves. Focus on completing follow-ups, 
                  booking meetings, and closing existing deals to raise your score.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier Progression Roadmap */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
            <ChevronUp className="h-4 w-4 text-terracotta" /> Tier Roadmap
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Your path to higher commissions and better leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TIER_ORDER.map((key) => {
              const config = TIER_CONFIG[key];
              const Icon = tierIcons[key] || Shield;
              const isCurrent = key === currentTier;
              const isAchieved = TIER_ORDER.indexOf(key) <= currentTierIndex;
              return (
                <div key={key} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isCurrent ? `${tierBgColors[key]} border-2` : isAchieved ? "border-green-200 bg-green-50/50" : "border-border/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isCurrent ? `bg-gradient-to-br ${tierGradients[key]}` : isAchieved ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {isAchieved && !isCurrent ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-gray-400"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-sans font-medium ${isCurrent ? tierTextColors[key] : isAchieved ? "text-green-700" : "text-forest/50"}`}>
                        {config.name} {isCurrent && <span className="text-[10px]">(Current)</span>}
                      </p>
                      <p className="text-[10px] text-forest/40 font-sans">
                        {config.minMonths > 0 ? `${config.minMonths}+ months` : "Starting tier"} &bull; ${config.minMonthlyRevenue > 0 ? `$${config.minMonthlyRevenue.toLocaleString()}/mo` : "No minimum"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-serif ${isCurrent ? tierTextColors[key] : "text-forest/40"}`}>{config.commissionRate}%</p>
                    <p className="text-[10px] text-forest/30 font-sans">commission</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
