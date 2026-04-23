import { useState, useMemo, lazy, Suspense } from "react";
import NotificationsBell from "./rep/NotificationsBell";
const PipelineTab = lazy(() => import("./rep/PipelineTab"));
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
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const tempColors: Record<string, string> = { cold: "bg-blue-100 text-blue-700", warm: "bg-yellow-100 text-yellow-700", hot: "bg-red-100 text-red-700" };
const stageColors: Record<string, string> = {
  assigned: "bg-purple-100 text-purple-700", contacted: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-yellow-100 text-yellow-700", negotiating: "bg-orange-100 text-orange-700",
  closed_won: "bg-green-100 text-green-700", closed_lost: "bg-red-100 text-red-700",
};
const commissionStatusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700" };
const levelColors: Record<string, string> = { rookie: "bg-gray-100 text-gray-700", closer: "bg-blue-100 text-blue-700", ace: "bg-purple-100 text-purple-700", elite: "bg-amber-100 text-amber-700", legend: "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800" };
const levelIcons: Record<string, any> = { rookie: Shield, closer: Target, ace: Star, elite: Trophy, legend: Flame };

export default function RepDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: repProfile, isLoading: repLoading } = trpc.reps.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: allLeads } = trpc.leads.list.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: commissions } = trpc.commissions.byRep.useQuery({ repId: repProfile?.id ?? 0 }, { enabled: isAuthenticated && !!repProfile });
  const { data: gamification } = trpc.repGamification.myStats.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: leaderboard } = trpc.repGamification.leaderboard.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: activities } = trpc.repActivity.myActivities.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: activityStats } = trpc.repActivity.myStats.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: followUps } = trpc.repActivity.myFollowUps.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: trainingModules } = trpc.repTraining.modules.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: trainingProgress } = trpc.repTraining.myProgress.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: quizResults } = trpc.repTraining.myQuizResults.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: emailTemplates } = trpc.repComms.templates.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });
  const { data: sentEmails } = trpc.repComms.mySentEmails.useQuery(undefined, { enabled: isAuthenticated && !!repProfile });

  const myLeads = useMemo(() => allLeads?.filter((l: any) => l.assignedRepId === repProfile?.id) ?? [], [allLeads, repProfile]);
  const activeLeads = useMemo(() => myLeads.filter((l: any) => !["closed_won", "closed_lost"].includes(l.stage)), [myLeads]);
  const wonLeads = useMemo(() => myLeads.filter((l: any) => l.stage === "closed_won"), [myLeads]);
  const totalEarnings = useMemo(() => commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0, [commissions]);
  const pendingPayouts = useMemo(() => commissions?.filter((c: any) => c.status === "pending").reduce((sum: number, c: any) => sum + parseFloat(c.amount || "0"), 0) ?? 0, [commissions]);

  if (authLoading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-border/50"><CardContent className="p-8 text-center">
        <Briefcase className="h-12 w-12 text-forest/30 mx-auto mb-4" />
        <h2 className="text-xl font-serif text-forest mb-2">Rep Portal</h2>
        <p className="text-sm text-forest/60 font-sans mb-6">Sign in to access your dashboard.</p>
        <Button onClick={() => { window.location.href = getLoginUrl(); }} className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full px-8">Sign In</Button>
      </CardContent></Card>
    </div>
  );
  if (repLoading) return <div className="min-h-screen bg-cream p-6"><div className="max-w-6xl mx-auto space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div></div>;
  if (!repProfile) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-border/50"><CardContent className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-terracotta/50 mx-auto mb-4" />
        <h2 className="text-xl font-serif text-forest mb-2">No Rep Profile Found</h2>
        <p className="text-sm text-forest/60 font-sans mb-6">Apply to become a MiniMorph representative.</p>
        <Button onClick={() => setLocation("/become-rep")} className="bg-forest hover:bg-forest/90 text-white font-sans rounded-full px-8">Apply Now</Button>
      </CardContent></Card>
    </div>
  );

  const LevelIcon = levelIcons[gamification?.level || "rookie"] || Shield;
  const levelProgress = gamification ? Math.min(100, Math.round((gamification.totalPoints / (gamification.level === "rookie" ? 500 : gamification.level === "closer" ? 2000 : gamification.level === "ace" ? 5000 : gamification.level === "elite" ? 15000 : 99999)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-lg font-serif">Welcome back, {repProfile.fullName}</h1>
                <Badge className={`text-[10px] font-sans ${repProfile.status === "active" || repProfile.status === "certified" ? "bg-green-500/20 text-green-200" : "bg-yellow-500/20 text-yellow-200"}`}>
                  {repProfile.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60 font-sans">
                <span className="flex items-center gap-1"><LevelIcon className="w-3.5 h-3.5 text-terracotta" /> {gamification?.level || "Rookie"}</span>
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {gamification?.currentStreak || 0} day streak</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> {gamification?.totalPoints?.toLocaleString() || 0} pts</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Button variant="outline" onClick={() => setLocation("/")} className="text-white border-white/20 hover:bg-white/10 font-sans text-sm rounded-full">
              <ArrowLeft className="h-4 w-4 mr-2" /> Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-sage/20 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="training" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Training</TabsTrigger>
            <TabsTrigger value="activity" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Activity</TabsTrigger>
            <TabsTrigger value="comms" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Communications</TabsTrigger>
            <TabsTrigger value="earnings" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Earnings</TabsTrigger>
            <TabsTrigger value="pipeline" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Pipeline</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-sans text-xs data-[state=active]:bg-forest data-[state=active]:text-white">Leaderboard</TabsTrigger>
          </TabsList>

          {/* ═══════ OVERVIEW TAB ═══════ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Leads", value: activeLeads.length, icon: Target, color: "text-blue-600" },
                { label: "Deals Won", value: wonLeads.length, icon: CheckCircle, color: "text-green-600" },
                { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-forest" },
                { label: "Today's Activities", value: activityStats?.todayActivities || 0, icon: Zap, color: "text-terracotta" },
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

            {/* Level Progress + Follow-ups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-terracotta" /> Level Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${levelColors[gamification?.level || "rookie"]}`}>
                      <LevelIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-lg font-serif text-forest capitalize">{gamification?.level || "Rookie"}</p>
                      <p className="text-xs text-forest/50 font-sans">{gamification?.totalPoints?.toLocaleString() || 0} total points</p>
                    </div>
                  </div>
                  <Progress value={levelProgress} className="h-2 mb-2" />
                  <p className="text-[11px] text-forest/40 font-sans">Progress to next level</p>
                  {(() => {
                    const badges = gamification?.badges;
                    if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(badges as string[]).map((b: string) => (
                          <Badge key={b} className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{b}</Badge>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-terracotta" /> Upcoming Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!followUps?.length ? (
                    <div className="text-center py-6"><Calendar className="h-8 w-8 text-forest/20 mx-auto mb-2" /><p className="text-sm text-forest/50 font-sans">No upcoming follow-ups</p></div>
                  ) : (
                    <div className="space-y-2">
                      {followUps.slice(0, 5).map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 text-sm">
                          <div><p className="font-sans text-forest font-medium">{f.subject || "Follow-up"}</p><p className="text-xs text-forest/50 font-sans">{f.notes?.slice(0, 60)}</p></div>
                          <span className="text-xs text-forest/40 font-sans shrink-0 ml-2">{f.followUpAt ? new Date(f.followUpAt).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral Code */}
            {repProfile?.referralCode && (
              <Card className="border-border/50 bg-gradient-to-r from-amber-50/50 to-cream">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-sans text-forest/60 mb-1">Your Referral Code</p>
                      <p className="text-2xl font-mono font-bold text-forest tracking-wider">{repProfile.referralCode}</p>
                      <p className="text-xs text-forest/40 font-sans mt-1">Share this code with potential reps. Earn $200 when they close their first deal.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-forest border-forest/20 hover:bg-forest/5"
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
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <Users className="h-4 w-4 text-terracotta" /> My Leads ({myLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myLeads.length === 0 ? (
                  <div className="text-center py-8"><Target className="h-8 w-8 text-forest/20 mx-auto mb-3" /><p className="text-sm text-forest/50 font-sans">No leads assigned yet.</p></div>
                ) : (
                  <div className="space-y-2">
                    {myLeads.slice(0, 10).map((lead: any) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-cream-dark/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-forest font-sans">{lead.businessName}</span>
                            <Badge className={`text-[10px] font-sans ${tempColors[lead.temperature] ?? ""}`}>{lead.temperature}</Badge>
                            <Badge className={`text-[10px] font-sans ${stageColors[lead.stage] ?? "bg-gray-100 text-gray-700"}`}>{lead.stage.replace(/_/g, " ")}</Badge>
                          </div>
                          <p className="text-xs text-forest/50 font-sans">{lead.contactName} &bull; {lead.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setActiveTab("activity"); toast.info("Log your activity from the Activity tab"); }}>
                            <Phone className="h-3.5 w-3.5 text-forest/50" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setActiveTab("comms"); toast.info("Send an email from the Communications tab"); }}>
                            <Mail className="h-3.5 w-3.5 text-forest/50" />
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
            <TrainingTab modules={trainingModules} progress={trainingProgress} quizResults={quizResults} repStatus={repProfile.status} />
          </TabsContent>

          {/* ═══════ ACTIVITY TAB ═══════ */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityTab activities={activities} stats={activityStats} leads={myLeads} />
          </TabsContent>

          {/* ═══════ COMMS TAB ═══════ */}
          <TabsContent value="comms" className="space-y-6">
            <CommsTab templates={emailTemplates} sentEmails={sentEmails} leads={myLeads} />
          </TabsContent>

          {/* ═══════ EARNINGS TAB ═══════ */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Total Earned", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
                { label: "Pending Payouts", value: `$${pendingPayouts.toLocaleString()}`, icon: Clock, color: "text-yellow-600" },
                { label: "Paid Out", value: `$${(totalEarnings - pendingPayouts).toLocaleString()}`, icon: CheckCircle, color: "text-forest" },
              ].map((m) => (
                <Card key={m.label} className="border-border/50"><CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-forest/50 font-sans uppercase tracking-wide">{m.label}</span><m.icon className={`h-4 w-4 ${m.color}`} /></div>
                  <div className="text-2xl font-serif text-forest">{m.value}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">Commission History</CardTitle></CardHeader>
              <CardContent>
                {!commissions?.length ? (
                  <div className="text-center py-8"><DollarSign className="h-8 w-8 text-forest/20 mx-auto mb-3" /><p className="text-sm text-forest/50 font-sans">No commissions yet. Close your first deal to start earning.</p></div>
                ) : (
                  <div className="space-y-2">
                    {commissions.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border/30">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-forest font-sans">${parseFloat(c.amount).toLocaleString()}</span>
                            <Badge className={`text-[10px] font-sans ${commissionStatusColors[c.status] ?? ""}`}>{c.status}</Badge>
                          </div>
                          <p className="text-xs text-forest/50 font-sans capitalize">{c.type?.replace(/_/g, " ")} &bull; Contract #{c.contractId}</p>
                        </div>
                        <div className="text-xs text-forest/40 font-sans">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Stripe Connect Setup */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <Shield className="h-4 w-4 text-terracotta" /> Payout Setup
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
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-terracotta" /> Commission Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { level: "Rookie", rate: "10%", requirement: "Starting rate", color: "bg-gray-100" },
                    { level: "Closer", rate: "12%", requirement: "500+ points", color: "bg-blue-100" },
                    { level: "Ace", rate: "14%", requirement: "2,000+ points", color: "bg-purple-100" },
                    { level: "Elite", rate: "16%", requirement: "5,000+ points", color: "bg-amber-100" },
                    { level: "Legend", rate: "20%", requirement: "10,000+ points", color: "bg-yellow-100" },
                  ].map((tier) => (
                    <div key={tier.level} className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${tier.color} flex items-center justify-center`}>
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-forest font-sans">{tier.level}</p>
                          <p className="text-[10px] text-forest/40 font-sans">{tier.requirement}</p>
                        </div>
                      </div>
                      <span className="text-lg font-serif text-forest">{tier.rate}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-forest/40 font-sans mt-3">Your commission rate increases automatically as you level up. Commissions on cancelled contracts within 30 days are subject to clawback.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ PIPELINE TAB ═══════ */}
          <TabsContent value="pipeline" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-sage/10 rounded-xl" />}>
              <PipelineTab repProfile={repProfile} />
            </Suspense>
          </TabsContent>

          {/* ═══════ LEADERBOARD TAB ═══════ */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-terracotta" /> Top Reps Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!leaderboard?.length ? (
                  <div className="text-center py-8"><Trophy className="h-8 w-8 text-forest/20 mx-auto mb-3" /><p className="text-sm text-forest/50 font-sans">No leaderboard data yet. Start logging activities to earn points!</p></div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry: any, i: number) => {
                      const isMe = entry.repId === repProfile.id;
                      return (
                        <div key={entry.repId} className={`flex items-center justify-between p-4 rounded-lg border ${isMe ? "border-terracotta/30 bg-terracotta/5" : "border-border/30"}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-sage/10 text-forest/50"}`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-sans text-forest font-medium">{entry.repName || "Unknown"} {isMe && <span className="text-terracotta text-xs">(You)</span>}</p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-[10px] ${levelColors[entry.level] || ""}`}>{entry.level}</Badge>
                                <span className="text-[10px] text-forest/40 font-sans">{entry.currentStreak} day streak</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-serif text-forest">{entry.totalPoints?.toLocaleString()}</p>
                            <p className="text-[10px] text-forest/40 font-sans">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
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
              <h3 className="text-lg font-serif text-forest">MiniMorph Training Academy</h3>
              <p className="text-sm text-forest/60 font-sans">Complete all modules and pass the certification quiz to activate your account.</p>
            </div>
            {isCertified && (
              <Badge className="bg-green-100 text-green-700 text-xs font-sans flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Certified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Progress value={completionPct} className="h-3 flex-1" />
            <span className="text-sm font-sans text-forest font-medium">{completionPct}%</span>
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
                      <BookOpen className="w-4 h-4 text-terracotta" />
                      <h4 className="text-sm font-serif text-forest font-medium">{mod.title}</h4>
                    </div>
                    <p className="text-xs text-forest/50 font-sans mb-2">{mod.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-forest/40 font-sans">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.estimatedMinutes} min</span>
                    </div>
                  </div>
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-forest/30 shrink-0" />
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
              <h3 className="text-base font-serif text-forest flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-terracotta" /> Certification Quiz
              </h3>
              <p className="text-sm text-forest/60 font-sans mt-1">Score 80% or higher to become certified. You can retake the quiz.</p>
              {latestQuiz && (
                <p className={`text-xs font-sans mt-2 ${latestQuiz.passed ? "text-green-600" : "text-red-500"}`}>
                  Last attempt: {latestQuiz.score}% ({latestQuiz.passed ? "Passed" : "Failed"}) — Attempt #{latestQuiz.attemptNumber}
                </p>
              )}
            </div>
            <Button onClick={() => setShowQuiz(true)} disabled={isCertified} className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full font-sans text-sm">
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
              <DialogTitle className="font-serif text-forest">{selectedModule.title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm max-w-none text-forest/80 font-sans whitespace-pre-wrap">{String(selectedModule.content || "")}</div>
            <div className="flex justify-end mt-4">
              <MarkCompleteButton moduleId={selectedModule.id} isComplete={completedModuleIds.has(selectedModule.id)} onDone={() => setSelectedModule(null)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Dialog */}
      {showQuiz && <QuizDialog open={showQuiz} onClose={() => setShowQuiz(false)} />}
    </>
  );
}

function MarkCompleteButton({ moduleId, isComplete, onDone }: { moduleId: number; isComplete: boolean; onDone: () => void }) {
  const utils = trpc.useUtils();
  const complete = trpc.repTraining.completeModule.useMutation({
    onSuccess: () => { toast.success("Module completed! +50 points"); utils.repTraining.myProgress.invalidate(); utils.repGamification.myStats.invalidate(); onDone(); },
    onError: (err: any) => toast.error(err.message),
  });
  if (isComplete) return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
  return <Button onClick={() => complete.mutate({ moduleId })} disabled={complete.isPending} className="bg-forest hover:bg-forest/90 text-white rounded-full font-sans text-sm">{complete.isPending ? "Saving..." : "Mark as Complete"}</Button>;
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
        <DialogHeader><DialogTitle className="font-serif text-forest">Certification Quiz</DialogTitle></DialogHeader>
        {result ? (
          <div className="text-center py-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
              {result.passed ? <GraduationCap className="w-10 h-10 text-green-600" /> : <AlertCircle className="w-10 h-10 text-red-500" />}
            </div>
            <h3 className="text-xl font-serif text-forest mb-2">{result.passed ? "You Passed!" : "Not Quite"}</h3>
            <p className="text-sm text-forest/60 font-sans">Score: {result.score}% ({result.correct}/{result.total} correct)</p>
            <Button onClick={onClose} className="mt-4 bg-forest hover:bg-forest/90 text-white rounded-full font-sans">{result.passed ? "Continue" : "Close"}</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {(questions || []).map((q: any) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-sans text-forest font-medium">{q.id}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => setAnswers({ ...answers, [String(q.id)]: i })}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-sans transition-colors ${answers[String(q.id)] === i ? "border-terracotta bg-terracotta/5 text-forest" : "border-border/30 text-forest/70 hover:bg-sage/5"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={() => submit.mutate({ answers })} disabled={submit.isPending || Object.keys(answers).length < (questions?.length || 0)}
              className="w-full bg-terracotta hover:bg-terracotta/90 text-white rounded-full font-sans py-5">
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-forest">{stats?.todayActivities || 0}</p>
          <p className="text-xs text-forest/50 font-sans">Today</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-forest">{stats?.totalActivities || 0}</p>
          <p className="text-xs text-forest/50 font-sans">All Time</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-5 text-center">
          <p className="text-2xl font-serif text-forest">{stats?.totalPoints?.toLocaleString() || 0}</p>
          <p className="text-xs text-forest/50 font-sans">Points Earned</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowLogDialog(true)} className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full font-sans text-sm">
          <Plus className="w-4 h-4 mr-2" /> Log Activity
        </Button>
      </div>

      {/* Activity Feed */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {!activities?.length ? (
            <div className="text-center py-8"><Zap className="h-8 w-8 text-forest/20 mx-auto mb-3" /><p className="text-sm text-forest/50 font-sans">No activities logged yet. Start by logging a call or email!</p></div>
          ) : (
            <div className="space-y-2">
              {activities.map((a: any) => {
                const Icon = activityIcons[a.type] || Zap;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30">
                    <div className="w-8 h-8 rounded-full bg-forest/5 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-forest/60" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-forest font-medium capitalize">{a.type.replace(/_/g, " ")}{a.subject ? `: ${a.subject}` : ""}</p>
                      {a.notes && <p className="text-xs text-forest/50 font-sans truncate">{a.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className="bg-green-50 text-green-600 text-[10px]">+{a.pointsEarned} pts</Badge>
                      <p className="text-[10px] text-forest/40 font-sans mt-1">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</p>
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
        <DialogHeader><DialogTitle className="font-serif text-forest">Log Activity</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-forest/80 text-sm">Activity Type *</Label>
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
              <Label className="text-forest/80 text-sm">Related Lead</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead (optional)" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.contactName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label className="text-forest/80 text-sm">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description" className="mt-1" /></div>
          <div><Label className="text-forest/80 text-sm">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details about the activity" className="mt-1 min-h-[80px]" /></div>
          {(type === "call" || type === "meeting") && (
            <div>
              <Label className="text-forest/80 text-sm">Outcome</Label>
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
          <div><Label className="text-forest/80 text-sm">Schedule Follow-up (optional)</Label><Input type="date" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className="mt-1" /></div>
          <Button onClick={() => logActivity.mutate({ type: type as any, leadId: leadId ? Number(leadId) : undefined, subject: subject || undefined, notes: notes || undefined, outcome: outcome ? outcome as any : undefined, followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined })}
            disabled={logActivity.isPending} className="w-full bg-forest hover:bg-forest/90 text-white rounded-full font-sans">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Compose Email", icon: Mail, action: () => setShowCompose(true) },
          { label: "AI Draft", icon: Sparkles, action: () => { setShowCompose(true); toast.info("Use the AI Generate button in the compose dialog"); } },
          { label: "Templates", icon: FileText, action: () => toast.info("Browse templates in the compose dialog") },
          { label: "Sent History", icon: Send, action: () => toast.info("Scroll down to see sent emails") },
        ].map((a) => (
          <Card key={a.label} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={a.action}>
            <CardContent className="p-4 text-center">
              <a.icon className="w-6 h-6 text-terracotta mx-auto mb-2" />
              <p className="text-sm font-sans text-forest font-medium">{a.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Templates */}
      {templates?.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">Email Templates</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {templates.map((t: any) => (
                <div key={t.id} className="p-3 rounded-lg border border-border/30 hover:bg-sage/5 cursor-pointer transition-colors" onClick={() => setShowCompose(true)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-[10px] bg-forest/10 text-forest capitalize">{t.category}</Badge>
                    <span className="text-sm font-sans text-forest font-medium">{t.name}</span>
                  </div>
                  <p className="text-xs text-forest/50 font-sans">{t.subject}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Emails */}
      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">Sent Emails ({sentEmails?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {!sentEmails?.length ? (
            <div className="text-center py-8"><Mail className="h-8 w-8 text-forest/20 mx-auto mb-3" /><p className="text-sm text-forest/50 font-sans">No emails sent yet.</p></div>
          ) : (
            <div className="space-y-2">
              {sentEmails.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-forest font-medium truncate">{e.subject}</p>
                    <p className="text-xs text-forest/50 font-sans">To: {e.recipientName || e.recipientEmail}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <Badge className={`text-[10px] ${e.status === "sent" ? "bg-blue-50 text-blue-600" : e.status === "opened" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}>{e.status}</Badge>
                    <p className="text-[10px] text-forest/40 font-sans mt-1">{e.sentAt ? new Date(e.sentAt).toLocaleDateString() : ""}</p>
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
        <DialogHeader><DialogTitle className="font-serif text-forest">Compose Email</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {leads?.length > 0 && (
            <div>
              <Label className="text-forest/80 text-sm">Send to Lead</Label>
              <Select value={leadId} onValueChange={handleSelectLead}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>{leads.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.contactName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-forest/80 text-sm">Recipient Email *</Label><Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="email@example.com" className="mt-1" /></div>
            <div><Label className="text-forest/80 text-sm">Recipient Name</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Smith" className="mt-1" /></div>
          </div>

          {/* AI Generate Buttons */}
          <div>
            <Label className="text-forest/80 text-sm mb-2 block">AI Generate Draft</Label>
            <div className="flex flex-wrap gap-2">
              {["intro", "follow_up", "proposal", "close", "check_in"].map((p) => (
                <Button key={p} size="sm" variant="outline" onClick={() => handleGenerate(p)} disabled={generating}
                  className="text-xs border-sage/30 text-forest/70 hover:bg-terracotta/5 hover:border-terracotta/30 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" /> {p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          {/* Template Quick-fill */}
          {templates?.length > 0 && (
            <div>
              <Label className="text-forest/80 text-sm mb-2 block">Or Use Template</Label>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((t: any) => (
                  <Button key={t.id} size="sm" variant="outline" onClick={() => handleSelectTemplate(t)} className="text-xs border-sage/30 text-forest/70 rounded-full">
                    <FileText className="w-3 h-3 mr-1" /> {t.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div><Label className="text-forest/80 text-sm">Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="mt-1" /></div>
          <div><Label className="text-forest/80 text-sm">Body *</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." className="mt-1 min-h-[150px]" /></div>

          <Button onClick={() => sendEmail.mutate({ leadId: leadId ? Number(leadId) : undefined, recipientEmail, recipientName: recipientName || undefined, subject, body })}
            disabled={sendEmail.isPending || !recipientEmail || !subject || !body}
            className="w-full bg-forest hover:bg-forest/90 text-white rounded-full font-sans">
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
    return <div className="h-16 bg-cream-dark/20 rounded-lg animate-pulse" />;
  }

  if (connectStatus?.onboarded) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800 font-sans">Payout Account Connected</p>
          <p className="text-xs text-green-600 font-sans">Your bank account is set up and ready to receive payouts via Stripe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 font-sans">Payout Setup Required</p>
          <p className="text-xs text-amber-600 font-sans">
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
      <p className="text-[10px] text-forest/40 font-sans text-center">
        Powered by Stripe Connect. Your sensitive information is handled securely by Stripe — we never see your bank details or SSN.
      </p>
    </div>
  );
}
