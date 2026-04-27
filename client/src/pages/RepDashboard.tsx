import { useState, useMemo, lazy, Suspense } from "react";
import NotificationsBell from "./rep/NotificationsBell";
const PipelineTab = lazy(() => import("./rep/PipelineTab"));
const PerformanceHub = lazy(() => import("./rep/PerformanceHub"));
const SalesAcademy = lazy(() => import("./rep/SalesAcademy"));
const CommsHub = lazy(() => import("./rep/CommsHub"));
const SupportTicketsPanel = lazy(() => import("./rep/SupportTicketsPanel"));
const RepSettingsPanel = lazy(() => import("./rep/RepSettingsPanel"));
const AppGuide = lazy(() => import("./rep/AppGuide"));
const TeamFeed = lazy(() => import("./rep/TeamFeed"));
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Users, DollarSign, Target, TrendingUp, Award, Clock, ArrowLeft,
  BarChart3, Briefcase, CheckCircle, AlertCircle, Flame, Trophy,
  Star, Zap, Phone, Mail, Calendar, FileText, Send, Sparkles,
  BookOpen, GraduationCap, Shield, MessageSquare, Plus, ChevronRight, Copy,
  AlertTriangle, Lightbulb, Brain, RefreshCw,
} from "lucide-react";
import { useLocation } from "wouter";

import { toast } from "sonner";

const tempColors: Record<string, string> = { cold: "badge-info", warm: "badge-pending", hot: "badge-danger" };
const stageColors: Record<string, string> = {
  assigned: "badge-purple", contacted: "badge-info",
  proposal_sent: "badge-pending", negotiating: "badge-pending-payment",
  closed_won: "badge-success", closed_lost: "badge-danger",
};
const commissionStatusColors: Record<string, string> = { pending: "badge-pending", approved: "badge-info", paid: "badge-success", cancelled: "badge-danger" };
const tierColors: Record<string, string> = { bronze: "badge-pending-payment", silver: "bg-slate-100 text-slate-700", gold: "badge-pending", platinum: "bg-violet-100 text-violet-700" };
const tierIcons: Record<string, any> = { bronze: Shield, silver: Award, gold: Trophy, platinum: Sparkles };

export default function RepDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Support ?tab= query parameter for deep linking (e.g., from onboarding flow)
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "performance");

  const { data: repProfile, isLoading: repLoading } = trpc.reps.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myLeads } = trpc.leads.myLeads.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: commissions } = trpc.commissions.byRep.useQuery({ repId: repProfile?.id ?? 0 }, { enabled: isAuthenticated && !!repProfile });
  const { data: gamification } = trpc.repGamification.myStats.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: leaderboard } = trpc.repGamification.leaderboard.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: accountabilityTier } = trpc.accountability.getMyTier.useQuery(undefined, { enabled: isAuthenticated && !!repProfile, retry: false });
  const { data: accountabilityScore } = trpc.accountability.getMyScore.useQuery(undefined, { enabled: isAuthenticated && !!repProfile, retry: false });
  const { data: activities } = trpc.repActivity.myActivities.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: activityStats } = trpc.repActivity.myStats.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: followUps } = trpc.repActivity.myFollowUps.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: trainingModules } = trpc.repTraining.modules.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: trainingProgress } = trpc.repTraining.myProgress.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: quizResults } = trpc.repTraining.myQuizResults.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: emailTemplates } = trpc.repComms.templates.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: sentEmails } = trpc.repComms.mySentEmails.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: accessCheck } = trpc.academy.canAccessLeads.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });

  const activeLeads = useMemo(() => (myLeads ?? []).filter((l: any) => !["closed_won", "closed_lost"].includes(l.stage)), [myLeads]);
  const wonLeads = useMemo(() => (myLeads ?? []).filter((l: any) => l.stage === "closed_won"), [myLeads]);
  const totalEarnings = useMemo(() => commissions?.filter((c: any) => c.status !== "cancelled").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0, [commissions]);
  const pendingPayouts = useMemo(() => commissions?.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0, [commissions]);
  const approvedPayouts = useMemo(() => commissions?.filter((c: any) => c.status === "approved").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0, [commissions]);
  const recurringCount = useMemo(() => commissions?.filter((c: any) => c.type === "recurring_monthly" && c.status !== "cancelled").length ?? 0, [commissions]);

  if (authLoading) return <div className="min-h-screen bg-midnight flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 text-soft-gray hover:text-electric text-sm font-sans transition-colors">
            <ArrowLeft size={16} /> Back to MiniMorph Studios
          </button>
        </div>
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Briefcase className="h-8 w-8 text-off-white" />
            </div>
            <h2 className="text-2xl font-serif text-off-white mb-2">Rep Portal</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">Sign in to access your sales dashboard, leads, training, and earnings.</p>
            <Button onClick={() => { setLocation("/login"); }} className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8 py-5 w-full" size="lg">Sign In</Button>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-charcoal px-3 text-soft-gray/60 font-sans">New to MiniMorph?</span></div>
            </div>
            <Button variant="outline" onClick={() => setLocation("/become-rep/values")} className="w-full rounded-full border-border text-off-white font-sans">
              Apply to Become a Rep
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  if (repLoading) return <div className="min-h-screen bg-midnight p-4 sm:p-6"><div className="max-w-6xl mx-auto space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div></div>;
  if (!repProfile) return (
    <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 text-soft-gray hover:text-electric text-sm font-sans transition-colors">
            <ArrowLeft size={16} /> Back to MiniMorph Studios
          </button>
        </div>
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Briefcase className="h-8 w-8 text-electric" />
            </div>
            <h2 className="text-2xl font-serif text-off-white mb-2">Welcome, {user?.name?.split(' ')[0] || 'there'}!</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">
              You're signed in but don't have a rep profile yet. Start your application to join our sales team and begin earning commissions.
            </p>
            <Button onClick={() => setLocation("/become-rep/values")} className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8 py-5 w-full" size="lg">
              <Sparkles className="w-4 h-4 mr-2" /> Start Your Application
            </Button>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-charcoal px-3 text-soft-gray/60 font-sans">Wrong account?</span></div>
            </div>
            <Button variant="outline" onClick={() => setLocation("/login")} className="w-full rounded-full border-border text-off-white font-sans">
              Sign In with a Different Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ── Onboarding gates ──
  // 1. If paperwork not completed, redirect to paperwork
  if (!repProfile.paperworkCompletedAt && repProfile.status === "training") {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="h-8 w-8 text-electric" />
            </div>
            <h2 className="text-xl font-serif text-off-white mb-2">Complete Your Paperwork</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">Before you can access your dashboard, you need to complete your HR & accounting paperwork.</p>
            <Button onClick={() => setLocation("/become-rep/paperwork")} className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8 py-5 w-full" size="lg">
              <FileText className="w-4 h-4 mr-2" /> Complete Paperwork
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. If Stripe Connect not set up, redirect to payout setup
  if (!repProfile.stripeConnectOnboarded && repProfile.status === "training") {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#635BFF]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <DollarSign className="h-8 w-8 text-[#635BFF]" />
            </div>
            <h2 className="text-xl font-serif text-off-white mb-2">Set Up Your Payouts</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">Connect your bank account through Stripe so you can receive commission payouts.</p>
            <Button onClick={() => setLocation("/become-rep/payout-setup")} className="bg-[#635BFF] hover:bg-[#5851DB] text-white font-sans rounded-full px-8 py-5 w-full" size="lg">
              <DollarSign className="w-4 h-4 mr-2" /> Set Up Payouts
            </Button>
            <button onClick={() => setLocation("/rep?tab=training")} className="mt-4 text-xs text-soft-gray/60 hover:text-soft-gray font-sans underline transition-colors block mx-auto">Skip for now</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTier = (accountabilityTier?.tier || "bronze") as string;
  const TierIcon = tierIcons[currentTier] || Shield;

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <div className="bg-charcoal text-off-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Rep Avatar */}
              {repProfile.profilePhotoUrl ? (
                <img src={repProfile.profilePhotoUrl} alt={repProfile.fullName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30 shrink-0" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-electric flex items-center justify-center text-white font-bold text-base sm:text-lg border-2 border-white/30 shrink-0">
                  {repProfile.fullName?.charAt(0) || "?"}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-0.5">
                  <h1 className="text-sm sm:text-lg font-serif truncate">Welcome back, {repProfile.fullName}</h1>
                  <Badge className={`text-[10px] font-sans shrink-0 ${repProfile.status === "active" || repProfile.status === "certified" ? "bg-green-500/20 text-green-200" : "bg-yellow-500/20 text-yellow-200"}`}>
                    {repProfile.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-off-white/50 font-sans flex-wrap">
                  <span className="flex items-center gap-1"><TierIcon className="w-3.5 h-3.5 text-electric" /> {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Tier</span>
                  <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5 text-orange-400" /> Score: {accountabilityScore?.latestScore ? parseFloat(accountabilityScore.latestScore.overallScore).toFixed(0) : "--"}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> {gamification?.totalPoints?.toLocaleString() || 0} pts</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NotificationsBell />
              <Button variant="outline" onClick={() => setLocation("/")} className="text-white border-white/20 hover:bg-charcoal/10 font-sans text-xs sm:text-sm rounded-full px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Home</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 sm:mb-6">
            <TabsList className="bg-charcoal border border-border/50 flex-wrap h-auto gap-0.5 sm:gap-1 p-1 w-max sm:w-auto">
              <TabsTrigger value="performance" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Performance</TabsTrigger>
              <TabsTrigger value="overview" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="training" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Training</TabsTrigger>
              <TabsTrigger value="activity" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Activity</TabsTrigger>
              <TabsTrigger value="comms" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Comms</TabsTrigger>
              <TabsTrigger value="earnings" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Earnings</TabsTrigger>
              <TabsTrigger value="pipeline" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Pipeline</TabsTrigger>
              <TabsTrigger value="leaderboard" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Board</TabsTrigger>
              <TabsTrigger value="team" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Team</TabsTrigger>
              <TabsTrigger value="support" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Support</TabsTrigger>
              <TabsTrigger value="settings" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Settings</TabsTrigger>
              <TabsTrigger value="guide" className="font-sans text-[11px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-electric data-[state=active]:text-white">Guide</TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════ PERFORMANCE HUB TAB ═══════ */}
          <TabsContent value="performance" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
              <PerformanceHub repProfile={repProfile} />
            </Suspense>
          </TabsContent>

          {/* ═══════ OVERVIEW TAB ═══════ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Active Leads", value: activeLeads.length, icon: Target, color: "text-blue-600" },
                { label: "Deals Won", value: wonLeads.length, icon: CheckCircle, color: "text-emerald-400" },
                { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-off-white" },
                { label: "Today's Activities", value: activityStats?.todayActivities || 0, icon: Zap, color: "text-electric" },
              ].map((m) => (
                <Card key={m.label} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-soft-gray font-sans uppercase tracking-wide">{m.label}</span>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div className="text-2xl font-serif text-off-white">{m.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Level Progress + Follow-ups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-electric" /> Tier Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${tierColors[currentTier] || "badge-pending-payment"}`}>
                      <TierIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-lg font-serif text-off-white capitalize">{currentTier} Tier</p>
                      <p className="text-xs text-soft-gray font-sans">Performance Score: {accountabilityScore?.latestScore ? parseFloat(accountabilityScore.latestScore.overallScore).toFixed(0) : "--"}/100</p>
                    </div>
                  </div>
                  <Progress value={accountabilityScore?.latestScore ? parseFloat(accountabilityScore.latestScore.overallScore) : 0} className="h-2 mb-2" />
                  <p className="text-[11px] text-soft-gray/60 font-sans">
                    {currentTier === "platinum" ? "Highest tier achieved!" : `Keep improving to reach ${currentTier === "bronze" ? "Silver" : currentTier === "silver" ? "Gold" : "Platinum"}`}
                  </p>
                  {(() => {
                    const badges = gamification?.badges;
                    if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(badges as string[]).map((b: string) => (
                          <Badge key={b} className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">{b}</Badge>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-electric" /> Upcoming Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!followUps?.length ? (
                    <div className="text-center py-6"><Calendar className="h-8 w-8 text-soft-gray/30 mx-auto mb-2" /><p className="text-sm text-soft-gray font-sans">No upcoming follow-ups</p></div>
                  ) : (
                    <div className="space-y-2">
                      {followUps.slice(0, 5).map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 text-sm">
                          <div><p className="font-sans text-off-white font-medium">{f.subject || "Follow-up"}</p><p className="text-xs text-soft-gray font-sans">{f.notes?.slice(0, 60)}</p></div>
                          <span className="text-xs text-soft-gray/60 font-sans shrink-0 ml-2">{f.followUpAt ? new Date(f.followUpAt).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Code */}
            {repProfile?.referralCode && (
              <Card className="border-border/50 bg-gradient-to-r from-graphite to-charcoal">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-sans text-soft-gray mb-1">Your Referral Code</p>
                      <p className="text-2xl font-mono font-bold text-off-white tracking-wider">{repProfile.referralCode}</p>
                      <p className="text-xs text-soft-gray/60 font-sans mt-1">Share this code with potential reps. Earn $200 when they close their first deal.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-off-white border-electric/20 hover:bg-electric/10"
                      onClick={() => {
                        navigator.clipboard.writeText(repProfile.referralCode!);
                        toast.success("Referral code copied to clipboard!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Leads */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-electric" /> My Leads ({(myLeads ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(myLeads ?? []).length === 0 ? (
                  <div className="text-center py-8"><Target className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" /><p className="text-sm text-soft-gray font-sans">No leads assigned yet.</p></div>
                ) : (
                  <div className="space-y-2">
                    {(myLeads ?? []).slice(0, 10).map((lead: any) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-midnight-dark/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-off-white font-sans">{lead.businessName}</span>
                            <Badge className={`text-[10px] font-sans ${tempColors[lead.temperature] ?? ""}`}>{lead.temperature}</Badge>
                            <Badge className={`text-[10px] font-sans ${stageColors[lead.stage] ?? "badge-neutral"}`}>{lead.stage.replace(/_/g, " ")}</Badge>
                          </div>
                          <p className="text-xs text-soft-gray font-sans">{lead.contactName} &bull; {lead.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setActiveTab("activity"); toast.info("Log your activity from the Activity tab"); }}>
                            <Phone className="h-3.5 w-3.5 text-soft-gray" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setActiveTab("comms"); toast.info("Send an email from the Communications tab"); }}>
                            <Mail className="h-3.5 w-3.5 text-soft-gray" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TRAINING TAB ═══════ */}
          <TabsContent value="training" className="space-y-6">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" /></div>}>
              <SalesAcademy />
            </Suspense>
          </TabsContent>

          {/* ═══════ ACTIVITY TAB ═══════ */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityTab activities={activities} stats={activityStats} leads={myLeads ?? []} />
          </TabsContent>

          {/* ═══════ COMMS TAB ═══════ */}
          <TabsContent value="comms" className="space-y-6">
            {accessCheck && !accessCheck.allowed ? (
              <Card className="border-amber-500/20 bg-amber-500/10/50">
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-base font-serif text-off-white mb-2">Daily Training Required</h3>
                  <p className="text-sm text-soft-gray font-sans mb-4 max-w-md mx-auto">{accessCheck.reason}</p>
                  <Button onClick={() => setActiveTab("training")} className="bg-charcoal text-off-white hover:bg-electric/90 font-sans text-sm">
                    <BookOpen className="h-4 w-4 mr-2" /> Go to Training
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Suspense fallback={<div className="p-8 text-center"><p className="text-sm text-soft-gray/60">Loading communications...</p></div>}>
                <CommsHub templates={emailTemplates ?? []} sentEmails={sentEmails ?? []} leads={myLeads ?? []} />
              </Suspense>
            )}
          </TabsContent>

          {/* ═══════ EARNINGS TAB ═══════ */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Total Earned", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
                { label: "Ready for Payout", value: `$${approvedPayouts.toLocaleString()}`, icon: Zap, color: "text-electric" },
                { label: "Recurring", value: `${recurringCount} active`, icon: RefreshCw, color: "text-blue-600" },
              ].map((m) => (
                <Card key={m.label} className="border-border/50"><CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-soft-gray font-sans uppercase tracking-wide">{m.label}</span><m.icon className={`h-4 w-4 ${m.color}`} /></div>
                  <div className="text-2xl font-serif text-off-white">{m.value}</div>
                </CardContent></Card>
              ))}
            </div>

            {/* Projected Earnings from Pipeline */}
            {activeLeads.length > 0 && (
              <Card className="border-border/50 bg-gradient-to-r from-electric/5 to-gold/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-electric" /> Projected Earnings
                  </CardTitle>
                  <CardDescription className="text-xs font-sans">Estimated commissions if your active pipeline leads close</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(() => {
                      const PRICES: Record<string, number> = { starter: 149, growth: 299, premium: 499 };
                      const tierRate = accountabilityTier?.tier === "platinum" ? 0.15 : accountabilityTier?.tier === "gold" ? 0.14 : accountabilityTier?.tier === "silver" ? 0.12 : 0.10;
                      let totalProjected = 0;
                      const rows = activeLeads.map((lead: any) => {
                        const monthly = PRICES[lead.packageTier] || 149;
                        const annual = monthly * 12;
                        const commission = annual * tierRate;
                        totalProjected += commission;
                        return { name: lead.businessName || lead.contactName || "Lead", tier: lead.packageTier, monthly, commission };
                      });
                      return (
                        <>
                          {rows.slice(0, 5).map((r: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-charcoal/60">
                              <div>
                                <p className="text-sm font-medium text-off-white font-sans">{r.name}</p>
                                <p className="text-[10px] text-soft-gray/60 font-sans capitalize">{r.tier} — ${r.monthly}/mo x 12</p>
                              </div>
                              <span className="text-sm font-serif text-emerald-400">${r.commission.toLocaleString()}</span>
                            </div>
                          ))}
                          {rows.length > 5 && <p className="text-xs text-soft-gray/60 font-sans text-center">+ {rows.length - 5} more leads in pipeline</p>}
                          <div className="flex items-center justify-between p-4 rounded-lg bg-electric/10 mt-2">
                            <div>
                              <p className="text-sm font-semibold text-off-white font-sans">Total Projected</p>
                              <p className="text-[10px] text-soft-gray font-sans">At your {accountabilityTier?.tier || "bronze"} tier rate ({(tierRate * 100).toFixed(0)}%)</p>
                            </div>
                            <span className="text-xl font-serif text-off-white">${totalProjected.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">Commission History</CardTitle></CardHeader>
              <CardContent>
                {!commissions?.length ? (
                  <div className="text-center py-8"><DollarSign className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" /><p className="text-sm text-soft-gray font-sans">No commissions yet. Close your first deal to start earning.</p></div>
                ) : (
                  <div className="space-y-2">
                    {commissions.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-off-white font-sans">${parseFloat(c.amount).toLocaleString()}</span>
                            <Badge className={`text-[10px] font-sans ${commissionStatusColors[c.status] ?? ""}`}>{c.status}</Badge>
                          </div>
                          <p className="text-xs text-soft-gray font-sans capitalize">
                            {c.type?.replace(/_/g, " ")} &bull; Contract #{c.contractId}
                            {c.selfSourced && <span className="ml-1 text-amber-400">⭐ 2x</span>}
                          </p>
                        </div>
                        <div className="text-xs text-soft-gray/60 font-sans">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Stripe Connect Setup */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-electric" /> Payout Setup
                </CardTitle>
                <CardDescription className="text-xs font-sans">Set up your bank account to receive commission payouts via Stripe</CardDescription>
              </CardHeader>
              <CardContent>
                <StripeConnectSetup />
              </CardContent>
            </Card>

            {/* Commission Tier Info */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-electric" /> Commission Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { level: "Bronze", rate: "10%", requirement: "Starting tier", color: "bg-amber-100" },
                    { level: "Silver", rate: "12%", requirement: "3+ months, $3K+/mo revenue", color: "bg-slate-100" },
                    { level: "Gold", rate: "14%", requirement: "6+ months, $7K+/mo revenue", color: "bg-yellow-100" },
                    { level: "Platinum", rate: "15%", requirement: "12+ months, $12K+/mo revenue", color: "bg-violet-100" },
                  ].map((tier) => (
                    <div key={tier.level} className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${tier.color} flex items-center justify-center`}>
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-off-white font-sans">{tier.level}</p>
                          <p className="text-[10px] text-soft-gray/60 font-sans">{tier.requirement}</p>
                        </div>
                      </div>
                      <span className="text-lg font-serif text-off-white">{tier.rate}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Self-sourced leads earn 2x your commission rate!
                  </p>
                  <p className="text-[10px] text-amber-700/70 mt-1">Know someone who needs a website? Add them as your own lead in the Pipeline tab and earn double commission when the deal closes.</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Instant Payouts — Get Paid When They Pay
                  </p>
                  <p className="text-[10px] text-blue-700/70 mt-1">Commissions are auto-approved when the customer pays. You earn recurring commissions every month the customer stays active. If they stop paying, commissions stop too.</p>
                </div>
                <p className="text-[10px] text-soft-gray/60 font-sans mt-3">Your commission rate increases automatically as you level up. You can also apply up to 5% discount on deals to help close faster.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ PIPELINE TAB ═══════ */}
          <TabsContent value="pipeline" className="space-y-6">
            {accessCheck && !accessCheck.allowed ? (
              <Card className="border-amber-500/20 bg-amber-500/10/50">
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-base font-serif text-off-white mb-2">Daily Training Required</h3>
                  <p className="text-sm text-soft-gray font-sans mb-4 max-w-md mx-auto">{accessCheck.reason}</p>
                  <Button onClick={() => setActiveTab("training")} className="bg-charcoal text-off-white hover:bg-electric/90 font-sans text-sm">
                    <BookOpen className="h-4 w-4 mr-2" /> Go to Training
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
                <PipelineTab repProfile={repProfile} />
              </Suspense>
            )}
          </TabsContent>

          {/* ═══════ LEADERBOARD TAB ═══════ */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-electric" /> Top Reps Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!leaderboard?.length ? (
                  <div className="text-center py-8"><Trophy className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" /><p className="text-sm text-soft-gray font-sans">No leaderboard data yet. Start logging activities to earn points!</p></div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry: any, i: number) => {
                      const isMe = entry.repId === repProfile.id;
                      return (
                        <div key={entry.repId} className={`flex items-center justify-between p-4 rounded-lg border ${isMe ? "border-electric/30 bg-electric/5" : "border-border/30"}`}>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-400 text-amber-900" : "bg-graphite/30 text-soft-gray"}`}>
                                {i + 1}
                              </div>
                              {entry.profilePhotoUrl ? (
                                <img src={entry.profilePhotoUrl} alt={entry.repName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-graphite/20 flex items-center justify-center text-soft-gray/60 text-sm font-bold">
                                  {(entry.repName || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-sans text-off-white font-medium">{entry.repName || "Unknown"} {isMe && <span className="text-electric text-xs">(You)</span>}</p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-[10px] ${tierColors[entry.level] || ""}`}>{entry.level}</Badge>
                                <span className="text-[10px] text-soft-gray/60 font-sans">{entry.currentStreak} day streak</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-sm font-serif text-off-white font-medium">{entry.totalDeals || 0}</p>
                              <p className="text-[10px] text-soft-gray/60 font-sans">deals</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-serif text-green-700 font-medium">${parseFloat(entry.totalRevenue || "0").toLocaleString()}</p>
                              <p className="text-[10px] text-soft-gray/60 font-sans">revenue</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-serif text-off-white">{entry.totalPoints?.toLocaleString()}</p>
                              <p className="text-[10px] text-soft-gray/60 font-sans">points</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TEAM TAB ═══════ */}
          <TabsContent value="team" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
              <TeamFeed repProfile={repProfile} />
            </Suspense>
          </TabsContent>

          {/* ═══════ SUPPORT TAB ═══════ */}
          <TabsContent value="support" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
              <SupportTicketsPanel repId={repProfile.id} />
            </Suspense>
          </TabsContent>

          {/* ═══════ SETTINGS TAB ═══════ */}
          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
              <RepSettingsPanel repProfile={repProfile} />
            </Suspense>
          </TabsContent>

          {/* ═══════ GUIDE TAB ═══════ */}
          <TabsContent value="guide" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-electric/5 rounded-xl" />}>
              <AppGuide />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TRAINING TAB COMPONENT
   ═══════════════════════════════════════════════════════ */
function TrainingTab({ modules, progress, quizResults, repStatus }: any) {
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const completedModuleIds = new Set((progress || []).filter((p: any) => p.status === "completed").map((p: any) => p.moduleId));
  const completionPct = modules?.length ? Math.round((completedModuleIds.size / modules.length) * 100) : 0;
  const latestQuiz = quizResults?.[0];
  const isCertified = repStatus === "certified" || repStatus === "active";

  return (
    <>
      {/* Progress Overview */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-serif text-off-white">MiniMorph Training Academy</h3>
              <p className="text-sm text-soft-gray font-sans">Complete all modules and pass the certification quiz to activate your account.</p>
            </div>
            {isCertified && (
              <Badge className="badge-success text-xs font-sans flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Certified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={completionPct} className="h-3 flex-1" />
            <span className="text-sm font-sans text-off-white font-medium">{completionPct}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Module List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(modules || []).map((mod: any) => {
          const isComplete = completedModuleIds.has(mod.id);
          return (
            <Card key={mod.id} className={`border-border/50 cursor-pointer hover:shadow-md transition-shadow ${isComplete ? "opacity-80" : ""}`} onClick={() => setSelectedModule(mod)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-electric" />
                      <h4 className="text-sm font-serif text-off-white font-medium">{mod.title}</h4>
                    </div>
                    <p className="text-xs text-soft-gray font-sans mb-2">{mod.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-soft-gray/60 font-sans">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.estimatedMinutes} min</span>
                    </div>
                  </div>
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-soft-gray/40 shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Certification Quiz */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif text-off-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-electric" /> Certification Quiz
              </h3>
              <p className="text-sm text-soft-gray font-sans mt-1">Score 80% or higher to become certified. You can retake the quiz.</p>
              {latestQuiz && (
                <p className={`text-xs font-sans mt-2 ${latestQuiz.passed ? "text-emerald-400" : "text-red-500"}`}>
                  Last attempt: {latestQuiz.score}% ({latestQuiz.passed ? "Passed" : "Failed"}) — Attempt #{latestQuiz.attemptNumber}
                </p>
              )}
            </div>
            <Button onClick={() => setShowQuiz(true)} disabled={isCertified} className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans text-sm">
              {isCertified ? "Certified" : "Take Quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Detail Dialog */}
      {selectedModule && (
        <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-off-white">{selectedModule.title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm max-w-none text-off-white/80 font-sans whitespace-pre-wrap">{String(selectedModule.content || "")}</div>
            <div className="flex justify-end mt-4">
              <MarkCompleteButton moduleId={selectedModule.id} isComplete={completedModuleIds.has(selectedModule.id)} onDone={() => setSelectedModule(null)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Training Insights from Real Interactions */}
      <TrainingInsightsSection />

      {/* Quiz Dialog */}
      {showQuiz && <QuizDialog open={showQuiz} onClose={() => setShowQuiz(false)} />}
    </>
  );
}

function TrainingInsightsSection() {
  const { data: insights, isLoading } = trpc.repComms.myTrainingInsights.useQuery();

  if (isLoading) return <Card className="border-border/50"><CardContent className="p-6 text-center"><p className="text-xs text-soft-gray/60 font-sans">Loading insights...</p></CardContent></Card>;
  if (!insights?.length) return null;

  const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
    best_practice: { label: "Best Practice", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
    common_mistake: { label: "Common Mistake", color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
    technique: { label: "Technique", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Lightbulb },
    objection_handling: { label: "Objection Handling", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Shield },
    closing_strategy: { label: "Closing Strategy", color: "bg-electric/10 text-electric border-electric/20", icon: Target },
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-electric" />
          <h3 className="text-base font-serif text-off-white">AI-Powered Insights from Real Interactions</h3>
        </div>
        <p className="text-xs text-soft-gray font-sans mb-4">These patterns were identified by our AI coach from actual rep communications. Learn from what works and avoid common pitfalls.</p>
        <div className="space-y-3">
          {insights.map((insight: any) => {
            const config = categoryConfig[insight.category] || { label: insight.category, color: "bg-gray-50 text-gray-700 border-gray-200", icon: Lightbulb };
            const Icon = config.icon;
            return (
              <div key={insight.id} className={`p-4 rounded-lg border ${config.color}`}>
                <div className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-sans font-medium">{insight.title}</h4>
                      <Badge className="text-[9px] bg-charcoal/50">{config.label}</Badge>
                      {insight.frequency > 1 && <span className="text-[10px] opacity-60">Seen {insight.frequency}x</span>}
                    </div>
                    <p className="text-xs opacity-80 font-sans whitespace-pre-wrap">{insight.description}</p>
                    {insight.exampleSnippets?.length > 0 && (
                      <div className="mt-2 p-2 bg-charcoal/40 rounded text-[11px] font-mono opacity-70 truncate">
                        "…{(insight.exampleSnippets as any[])[0]?.snippet || ""}…"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkCompleteButton({ moduleId, isComplete, onDone }: { moduleId: number; isComplete: boolean; onDone: () => void }) {
  const utils = trpc.useUtils();
  const complete = trpc.repTraining.completeModule.useMutation({
    onSuccess: () => { toast.success("Module completed! +50 points"); utils.repTraining.myProgress.invalidate(); utils.repGamification.myStats.invalidate(); onDone(); },
    onError: (err: any) => toast.error(err.message),
  });
  if (isComplete) return <Badge className="badge-success">Completed</Badge>;
  return <Button onClick={() => complete.mutate({ moduleId })} disabled={complete.isPending} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm">{complete.isPending ? "Saving..." : "Mark as Complete"}</Button>;
}

function QuizDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: questions } = trpc.repTraining.getQuiz.useQuery();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const utils = trpc.useUtils();
  const submit = trpc.repTraining.submitQuiz.useMutation({
    onSuccess: (data) => { setResult(data); utils.repTraining.myQuizResults.invalidate(); utils.repGamification.myStats.invalidate(); if (data.passed) toast.success("Congratulations! You're certified!"); else toast.error(`Score: ${data.score}%. You need 80% to pass.`); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Certification Quiz</DialogTitle></DialogHeader>
        {result ? (
          <div className="text-center py-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
              {result.passed ? <GraduationCap className="w-10 h-10 text-emerald-400" /> : <AlertCircle className="w-10 h-10 text-red-500" />}
            </div>
            <h3 className="text-xl font-serif text-off-white mb-2">{result.passed ? "You Passed!" : "Not Quite"}</h3>
            <p className="text-sm text-soft-gray font-sans">Score: {result.score}% ({result.correct}/{result.total} correct)</p>
            <Button onClick={onClose} className="mt-4 bg-electric hover:bg-electric-light text-white rounded-full font-sans">{result.passed ? "Continue" : "Close"}</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(questions || []).map((q: any) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-sans text-off-white font-medium">{q.id}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => setAnswers({ ...answers, [String(q.id)]: i })}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-sans transition-colors ${answers[String(q.id)] === i ? "border-electric bg-electric/5 text-off-white" : "border-border/30 text-soft-gray hover:bg-graphite/5"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={() => submit.mutate({ answers })} disabled={submit.isPending || Object.keys(answers).length < (questions?.length || 0)}
              className="w-full bg-electric hover:bg-electric/90 text-white rounded-full font-sans py-5">
              {submit.isPending ? "Grading..." : `Submit Quiz (${Object.keys(answers).length}/${questions?.length || 0} answered)`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTIVITY TAB COMPONENT
   ═══════════════════════════════════════════════════════ */
function ActivityTab({ activities, stats, leads }: any) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const activityIcons: Record<string, any> = { call: Phone, email: Mail, meeting: Calendar, proposal: FileText, follow_up: Clock, note: MessageSquare, deal_closed: Trophy };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-off-white">{stats?.todayActivities || 0}</p>
          <p className="text-xs text-soft-gray font-sans">Today</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-off-white">{stats?.totalActivities || 0}</p>
          <p className="text-xs text-soft-gray font-sans">All Time</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-off-white">{stats?.totalPoints?.toLocaleString() || 0}</p>
          <p className="text-xs text-soft-gray font-sans">Points Earned</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowLogDialog(true)} className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans text-sm">
          <Plus className="w-4 h-4 mr-2" /> Log Activity
        </Button>
      </div>

      {/* Activity Feed */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {!activities?.length ? (
            <div className="text-center py-8"><Zap className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" /><p className="text-sm text-soft-gray font-sans">No activities logged yet. Start by logging a call or email!</p></div>
          ) : (
            <div className="space-y-2">
              {activities.map((a: any) => {
                const Icon = activityIcons[a.type] || Zap;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-electric/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-soft-gray" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-off-white font-medium capitalize">{a.type.replace(/_/g, " ")}{a.subject ? `: ${a.subject}` : ""}</p>
                      {a.notes && <p className="text-xs text-soft-gray font-sans truncate">{a.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="bg-green-50 text-emerald-400 text-[10px]">+{a.pointsEarned} pts</Badge>
                      <p className="text-[10px] text-soft-gray/60 font-sans mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showLogDialog && <LogActivityDialog open={showLogDialog} onClose={() => setShowLogDialog(false)} leads={leads} />}
    </>
  );
}

function LogActivityDialog({ open, onClose, leads }: { open: boolean; onClose: () => void; leads: any[] }) {
  const [type, setType] = useState<string>("call");
  const [leadId, setLeadId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<string>("");
  const [followUpAt, setFollowUpAt] = useState("");
  const utils = trpc.useUtils();
  const logActivity = trpc.repActivity.log.useMutation({
    onSuccess: (data) => { toast.success(`Activity logged! +${data.pointsEarned} points`); utils.repActivity.myActivities.invalidate(); utils.repActivity.myStats.invalidate(); utils.repGamification.myStats.invalidate(); onClose(); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Log Activity</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-off-white/80 text-sm">Activity Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["call", "email", "meeting", "proposal", "follow_up", "note", "deal_closed"].map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {leads?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm">Related Lead</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead (optional)" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.contactName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label className="text-off-white/80 text-sm">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description" className="mt-1" /></div>
          <div><Label className="text-off-white/80 text-sm">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details about the activity" className="mt-1 min-h-[80px]" /></div>
          {(type === "call" || type === "meeting") && (
            <div>
              <Label className="text-off-white/80 text-sm">Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  {["connected", "voicemail", "no_answer", "scheduled", "completed", "cancelled"].map((o) => (
                    <SelectItem key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label className="text-off-white/80 text-sm">Schedule Follow-up (optional)</Label><Input type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className="mt-1" /></div>
          <Button onClick={() => logActivity.mutate({ type: type as any, leadId: leadId ? Number(leadId) : undefined, subject: subject || undefined, notes: notes || undefined, outcome: outcome ? outcome as any : undefined, followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined })}
            disabled={logActivity.isPending} className="w-full bg-electric hover:bg-electric-light text-white rounded-full font-sans">
            {logActivity.isPending ? "Logging..." : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   COMMS TAB COMPONENT
   ═══════════════════════════════════════════════════════ */
function CommsTab({ templates, sentEmails, leads }: any) {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <>
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Compose Email", icon: Mail, action: () => setShowCompose(true) },
          { label: "AI Draft", icon: Sparkles, action: () => { setShowCompose(true); toast.info("Use the AI Generate button in the compose dialog"); } },
          { label: "Templates", icon: FileText, action: () => toast.info("Browse templates in the compose dialog") },
          { label: "Sent History", icon: Send, action: () => toast.info("Scroll down to see sent emails") },
        ].map((a) => (
          <Card key={a.label} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={a.action}>
            <CardContent className="p-4 text-center">
              <a.icon className="w-6 h-6 text-electric mx-auto mb-2" />
              <p className="text-sm font-sans text-off-white font-medium">{a.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Templates */}
      {templates?.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">Email Templates</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templates.map((t: any) => (
                <div key={t.id} className="p-3 rounded-lg border border-border/30 hover:bg-graphite/5 cursor-pointer transition-colors" onClick={() => setShowCompose(true)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-[10px] bg-electric/10 text-off-white capitalize">{t.category}</Badge>
                    <span className="text-sm font-sans text-off-white font-medium">{t.name}</span>
                  </div>
                  <p className="text-xs text-soft-gray font-sans">{t.subject}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Emails */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">Sent Emails ({sentEmails?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {!sentEmails?.length ? (
            <div className="text-center py-8"><Mail className="h-8 w-8 text-soft-gray/30 mx-auto mb-3" /><p className="text-sm text-soft-gray font-sans">No emails sent yet.</p></div>
          ) : (
            <div className="space-y-2">
              {sentEmails.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-off-white font-medium truncate">{e.subject}</p>
                    <p className="text-xs text-soft-gray font-sans">To: {e.recipientName || e.recipientEmail}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <Badge className={`text-[10px] ${e.status === "sent" ? "bg-blue-50 text-blue-600" : e.status === "opened" ? "bg-green-50 text-emerald-400" : "bg-gray-50 text-gray-600"}`}>{e.status}</Badge>
                    <p className="text-[10px] text-soft-gray/60 font-sans mt-1">{e.sentAt ? new Date(e.sentAt).toLocaleDateString() : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCompose && <ComposeEmailDialog open={showCompose} onClose={() => setShowCompose(false)} leads={leads} templates={templates} />}
    </>
  );
}

function ComposeEmailDialog({ open, onClose, leads, templates }: { open: boolean; onClose: () => void; leads: any[]; templates: any[] }) {
  const [leadId, setLeadId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const utils = trpc.useUtils();

  const sendEmail = trpc.repComms.sendEmail.useMutation({
    onSuccess: (data) => { toast.success(`Email sent! +${data.pointsEarned} points`); utils.repComms.mySentEmails.invalidate(); utils.repActivity.myActivities.invalidate(); utils.repGamification.myStats.invalidate(); onClose(); },
    onError: (err: any) => toast.error(err.message),
  });

  const generateEmail = trpc.repComms.generateEmail.useMutation({
    onSuccess: (data) => { setSubject(data.subject); setBody(data.body); setGenerating(false); toast.success("AI draft generated!"); },
    onError: (err: any) => { setGenerating(false); toast.error(err.message); },
  });

  const handleGenerate = (purpose: string) => {
    setGenerating(true);
    generateEmail.mutate({ leadId: leadId ? Number(leadId) : undefined, purpose: purpose as any, additionalContext: "" });
  };

  const handleSelectLead = (id: string) => {
    setLeadId(id);
    const lead = leads?.find((l: any) => l.id === Number(id));
    if (lead) { setRecipientEmail(lead.email); setRecipientName(lead.contactName); }
  };

  const handleSelectTemplate = (t: any) => {
    setSubject(t.subject);
    setBody(t.body);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Compose Email</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {leads?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm">Send to Lead</Label>
              <Select value={leadId} onValueChange={handleSelectLead}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>{leads.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.contactName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div><Label className="text-off-white/80 text-sm">Recipient Email *</Label><Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="email@example.com" className="mt-1" /></div>
            <div><Label className="text-off-white/80 text-sm">Recipient Name</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Smith" className="mt-1" /></div>
          </div>

          {/* AI Generate Buttons */}
          <div>
            <Label className="text-off-white/80 text-sm mb-2 block">AI Generate Draft</Label>
            <div className="flex flex-wrap gap-2">
              {["intro", "follow_up", "proposal", "close", "check_in"].map((p) => (
                <Button key={p} size="sm" variant="outline" onClick={() => handleGenerate(p)} disabled={generating}
                  className="text-xs border-border text-soft-gray hover:bg-electric/5 hover:border-electric/30 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" /> {p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          {/* Template Quick-fill */}
          {templates?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm mb-2 block">Or Use Template</Label>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((t: any) => (
                  <Button key={t.id} size="sm" variant="outline" onClick={() => handleSelectTemplate(t)} className="text-xs border-border text-soft-gray rounded-full">
                    <FileText className="w-3 h-3 mr-1" /> {t.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div><Label className="text-off-white/80 text-sm">Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="mt-1" /></div>
          <div><Label className="text-off-white/80 text-sm">Body *</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." className="mt-1 min-h-[150px]" /></div>

          <Button onClick={() => sendEmail.mutate({ leadId: leadId ? Number(leadId) : undefined, recipientEmail, recipientName: recipientName || undefined, subject, body })}
            disabled={sendEmail.isPending || !recipientEmail || !subject || !body}
            className="w-full bg-electric hover:bg-electric-light text-white rounded-full font-sans">
            {sendEmail.isPending ? "Sending..." : "Send Email"} <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


/* ═══════════════════════════════════════════════════════
   STRIPE CONNECT SETUP COMPONENT
   ═══════════════════════════════════════════════════════ */
function StripeConnectSetup() {
  const { data: connectStatus, isLoading } = trpc.reps.connectStatus.useQuery();
  const createOnboarding = trpc.reps.createConnectOnboarding.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Stripe Connect onboarding opened in a new tab.");
    },
    onError: () => toast.error("Failed to create onboarding link. Please try again."),
  });

  if (isLoading) {
    return <div className="h-16 bg-midnight-dark/20 rounded-lg animate-pulse" />;
  }

  if (connectStatus?.onboarded) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle className="h-5 w-5 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-green-800 font-sans">Payout Account Connected</p>
          <p className="text-xs text-emerald-400 font-sans">Your bank account is set up and ready to receive payouts via Stripe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="h-5 w-5 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 font-sans">Payout Setup Required</p>
          <p className="text-xs text-amber-400 font-sans">
            Complete Stripe Connect onboarding to receive commission payouts. This securely collects your tax info (W-9) and bank account details.
          </p>
        </div>
      </div>
      <Button
        onClick={() => createOnboarding.mutate({ returnUrl: window.location.href })}
        disabled={createOnboarding.isPending}
        className="bg-[#635BFF] hover:bg-[#5851DB] text-white font-sans rounded-full w-full"
      >
        {createOnboarding.isPending ? (
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 animate-spin" /> Setting up...</span>
        ) : (
          <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Set Up Payouts with Stripe</span>
        )}
      </Button>
      <p className="text-[10px] text-soft-gray/60 font-sans text-center">
        Powered by Stripe Connect. Your sensitive information is handled securely by Stripe — we never see your bank details or SSN.
      </p>
    </div>
  );
}
