import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Streamdown } from "streamdown";
import { AIChatBox } from "@/components/AIChatBox";
import {
  Package, Brain, Phone, Shield, Target, Search, TrendingUp, Crown,
  BookOpen, GraduationCap, CheckCircle, ChevronRight, ChevronLeft,
  Clock, Award, Star, Flame, Trophy, Lock, Play, RotateCcw,
  Lightbulb, MessageSquare, Zap, ArrowRight, AlertCircle,
  CalendarCheck, ShieldCheck, AlertTriangle, Loader2, Rocket, ArrowUpRight,
  User, Briefcase, Eye, XCircle,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Package, Brain, Phone, Shield, Target, Search, TrendingUp, Crown,
};

const moduleColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "product-mastery": { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "badge-info" },
  "psychology-selling": { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", badge: "badge-purple" },
  "discovery-call": { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  "objection-handling": { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "badge-danger" },
  "closing-techniques": { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", badge: "badge-pending-payment" },
  "digital-prospecting": { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", badge: "bg-cyan-500/15 text-cyan-400" },
  "account-management": { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", badge: "bg-teal-500/15 text-teal-400" },
  "advanced-tactics": { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", badge: "bg-indigo-500/15 text-indigo-400" },
  "lead-pipeline": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", badge: "bg-green-500/15 text-green-400" },
};

export default function SalesAcademy() {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<"overview" | "module" | "quiz" | "results">("overview");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("modules");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [lessonStartTime, setLessonStartTime] = useState(Date.now());

  const { data: academyData, isLoading } = trpc.academy.listModules.useQuery();
  const { data: moduleDetail, isLoading: moduleLoading } = trpc.academy.getModule.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId && activeView === "module" }
  );
  const { data: quizData } = trpc.academy.getQuiz.useQuery(
    { moduleId: selectedModuleId! },
    { enabled: !!selectedModuleId && activeView === "quiz" }
  );
  const { data: leaderboard } = trpc.academy.leaderboard.useQuery();
  const { data: dailyCheckIn, isLoading: checkInLoading } = trpc.academy.dailyCheckIn.useQuery();
  const { data: rankConfigs } = trpc.academy.rankConfigs.useQuery();

  const utils = trpc.useUtils();
  const completeLessonMut = trpc.academy.completeLesson.useMutation({
    onSuccess: () => utils.academy.listModules.invalidate(),
  });
  const completeReviewMut = trpc.academy.completeReview.useMutation({
    onSuccess: () => {
      utils.academy.dailyCheckIn.invalidate();
      utils.academy.pendingReviews.invalidate();
    },
  });
  const [reviewQuizAnswer, setReviewQuizAnswer] = useState<Record<number, number>>({});
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const submitQuizMut = trpc.academy.submitQuiz.useMutation({
    onSuccess: () => {
      utils.academy.listModules.invalidate();
      utils.academy.leaderboard.invalidate();
    },
  });

  const overallProgress = useMemo(() => {
    if (!academyData?.modules) return 0;
    const completed = academyData.modules.filter((m: any) => m.progress?.quizPassed).length;
    return Math.round((completed / academyData.modules.length) * 100);
  }, [academyData]);

  // ─── Compute "Your Next Step" guidance ───
  const nextStep = useMemo(() => {
    if (!academyData?.modules) return null;
    const modules = academyData.modules;
    const completedCount = modules.filter((m: any) => m.progress?.quizPassed).length;
    const isFullyCertified = academyData.isFullyCertified;
    const dailyCleared = dailyCheckIn?.isCleared;
    const hasPendingReviews = (dailyCheckIn?.pendingReviews?.length ?? 0) > 0;

    // Check role play status across all modules
    const modulesNeedingRP = modules.filter((m: any) => {
      const rpStatus = m.rolePlayStatus ?? [];
      return m.progress?.quizPassed && rpStatus.length > 0 && !rpStatus.every((rp: any) => rp.passed);
    });
    const allQuizzesPassed = completedCount === modules.length;
    const hasIncompleteRolePlays = modulesNeedingRP.length > 0;

    // State 5: Fully certified + daily cleared (or no pending reviews)
    if (isFullyCertified && (dailyCleared || !hasPendingReviews)) {
      return {
        type: "ready_to_sell" as const,
        icon: Rocket,
        title: "You're Ready to Sell",
        description: "Training complete and daily reviews done. Head to your Pipeline to claim leads, start outreach, and close deals.",
        color: "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-electric/10",
        iconColor: "bg-emerald-500/20 text-emerald-400",
        primaryAction: { label: "Go to Pipeline", onClick: () => setLocation("/rep?tab=pipeline") },
        secondaryActions: [
          { label: "Performance", onClick: () => setLocation("/rep?tab=performance") },
          { label: "Comms Hub", onClick: () => setLocation("/rep?tab=comms") },
        ],
      };
    }

    // State 4: Fully certified but daily training not cleared
    if (isFullyCertified && hasPendingReviews && !dailyCleared) {
      return {
        type: "daily_training" as const,
        icon: CalendarCheck,
        title: "Complete Daily Training to Unlock Your Pipeline",
        description: `You're certified! Complete your ${dailyCheckIn?.pendingReviews?.length || 0} daily coaching review${(dailyCheckIn?.pendingReviews?.length || 0) > 1 ? "s" : ""} to access leads and start selling today.`,
        color: "border-amber-500/20 bg-amber-500/10",
        iconColor: "bg-amber-500/20 text-amber-400",
        primaryAction: { label: "Start Daily Reviews", onClick: () => { /* Tab switch handled by parent Tabs */ } },
        secondaryActions: [],
      };
    }

    // State 3.5: All quizzes passed but role plays still needed
    if (allQuizzesPassed && hasIncompleteRolePlays) {
      const firstIncomplete = modulesNeedingRP[0];
      const pendingRPs = (firstIncomplete.rolePlayStatus ?? []).filter((rp: any) => !rp.passed);
      return {
        type: "role_play_needed" as const,
        icon: MessageSquare,
        title: "Complete Your Role Play Scenarios",
        description: `All quizzes passed! You have ${modulesNeedingRP.length} module${modulesNeedingRP.length > 1 ? "s" : ""} with pending role play requirements. Complete them to earn full certification.`,
        color: "border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-electric/10",
        iconColor: "bg-purple-500/20 text-purple-400",
        primaryAction: { label: `Start: ${pendingRPs[0]?.label || "Role Play"}`, onClick: () => { setActiveView("overview"); setActiveTab("roleplay"); } },
        secondaryActions: modulesNeedingRP.length > 1 ? [{ label: `${modulesNeedingRP.length} modules need role plays`, onClick: () => { setActiveView("overview"); setActiveTab("roleplay"); } }] : [],
      };
    }

    // Find next incomplete module
    const nextModule = modules.find((m: any) => !m.progress?.quizPassed) as any;
    const nextModuleIndex = nextModule ? (modules as any[]).indexOf(nextModule) : -1;

    // State 3: Module has all lessons done but quiz not taken
    if (nextModule?.progress && nextModule.progress.lessonsCompleted >= nextModule.lessonCount && !nextModule.progress.quizPassed) {
      return {
        type: "take_quiz" as const,
        icon: GraduationCap,
        title: `Ready for the Quiz: ${nextModule.title}`,
        description: `You've finished all ${nextModule.lessonCount} lessons. Take the quiz now to certify this module and move on. You need ${nextModule.passingScore}% to pass.`,
        color: "border-electric/30 bg-electric/10",
        iconColor: "bg-electric/20 text-electric",
        primaryAction: { label: "Take Quiz Now", onClick: () => openQuiz(nextModule.id) },
        secondaryActions: [{ label: "Review Lessons", onClick: () => openModule(nextModule.id) }],
        moduleId: nextModule.id,
      };
    }

    // State 2: In progress (some modules started)
    if (completedCount > 0 && nextModule) {
      const lessonsLeft = nextModule.lessonCount - (nextModule.progress?.lessonsCompleted || 0);
      return {
        type: "continue" as const,
        icon: BookOpen,
        title: `Continue: ${nextModule.title}`,
        description: `${completedCount} of ${modules.length} modules certified. ${lessonsLeft > 0 ? `${lessonsLeft} lesson${lessonsLeft > 1 ? "s" : ""} remaining in this module.` : "All lessons done — take the quiz!"}`,
        color: "border-electric/30 bg-electric/10",
        iconColor: "bg-electric/20 text-electric",
        primaryAction: { label: "Continue Training", onClick: () => openModule(nextModule.id) },
        secondaryActions: [],
        moduleId: nextModule.id,
        progress: { completed: completedCount, total: modules.length },
      };
    }

    // State 1: Not started
    if (completedCount === 0 && nextModule) {
      return {
        type: "not_started" as const,
        icon: Play,
        title: "Start Your Sales Training",
        description: `Complete all ${modules.length} modules to get certified and start earning. Begin with Module 1: ${nextModule.title}. Certification is required before you can access leads or make calls.`,
        color: "border-electric/30 bg-gradient-to-r from-electric/10 to-purple-500/10",
        iconColor: "bg-electric/20 text-electric",
        primaryAction: { label: "Begin Module 1", onClick: () => openModule(nextModule.id) },
        secondaryActions: [],
        moduleId: nextModule.id,
      };
    }

    return null;
  }, [academyData, dailyCheckIn, setLocation]);

  const openModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setCurrentLessonIndex(0);
    setLessonStartTime(Date.now());
    setActiveView("module");
  };

  const openQuiz = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setQuizAnswers({});
    setQuizStartTime(Date.now());
    setActiveView("quiz");
  };

  const handleCompleteLesson = () => {
    if (!selectedModuleId) return;
    const timeSpent = Math.round((Date.now() - lessonStartTime) / 60000);
    completeLessonMut.mutate({
      moduleId: selectedModuleId,
      lessonIndex: currentLessonIndex,
      timeSpentMinutes: Math.max(timeSpent, 1),
    });
    if (moduleDetail && currentLessonIndex < moduleDetail.lessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
      setLessonStartTime(Date.now());
      toast.success("Lesson completed! Moving to next lesson.");
    } else {
      toast.success("All lessons completed! Ready for the quiz.");
    }
  };

  const handleSubmitQuiz = () => {
    if (!selectedModuleId || !quizData) return;
    const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
    submitQuizMut.mutate(
      {
        moduleId: selectedModuleId,
        answers: quizAnswers,
        timeSpentSeconds: timeSpent,
      },
      {
        onSuccess: () => setActiveView("results"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-electric/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-electric/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     QUIZ RESULTS VIEW
     ═══════════════════════════════════════════════════════ */
  if (activeView === "results" && submitQuizMut.data) {
    const result = submitQuizMut.data;
    const mod = academyData?.modules.find((m: any) => m.id === selectedModuleId);
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setActiveView("overview")} className="text-soft-gray hover:text-off-white">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Academy
        </Button>

        <Card className={`border-2 ${result.passed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
          <CardContent className="p-8 text-center">
            {result.passed ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-serif text-off-white mb-2">Congratulations!</h2>
                <p className="text-soft-gray font-sans mb-4">
                  You passed the {mod?.title} quiz with a score of <span className="font-bold text-emerald-400">{result.score}%</span>
                </p>
                {(() => {
                  const rpStatus = mod?.rolePlayStatus ?? [];
                  const hasRP = rpStatus.length > 0;
                  const allRP = hasRP ? rpStatus.every((rp: any) => rp.passed) : true;
                  return allRP ? (
                    <Badge className="badge-success text-sm px-4 py-1">
                      <GraduationCap className="w-4 h-4 mr-1" /> Module Certified
                    </Badge>
                  ) : (
                    <div className="space-y-3">
                      <Badge className="bg-amber-500/15 text-amber-400 text-sm px-4 py-1">
                        <CheckCircle className="w-4 h-4 mr-1" /> Quiz Passed
                      </Badge>
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mt-4 text-left">
                        <h3 className="text-sm font-serif text-off-white font-medium flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-purple-400" /> Role Play Required to Certify
                        </h3>
                        <p className="text-xs text-soft-gray font-sans mb-3">
                          Complete the following role play scenario(s) with a passing score to earn your module certification:
                        </p>
                        <div className="space-y-2">
                          {rpStatus.map((rp: any) => (
                            <div key={rp.scenarioType} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                              <span className="text-xs font-sans text-off-white">{rp.label}</span>
                              <span className={`text-xs font-sans ${rp.passed ? "text-emerald-400" : "text-soft-gray"}`}>
                                {rp.passed ? `Passed (${rp.bestScore}%)` : rp.bestScore !== null ? `Best: ${rp.bestScore}% (need ${rp.minScore}%)` : `Need ${rp.minScore}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => { setActiveView("overview"); setActiveTab("roleplay"); }}
                          className="mt-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-sans text-xs w-full"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Go to Role Play
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-serif text-off-white mb-2">Not Quite There</h2>
                <p className="text-soft-gray font-sans mb-4">
                  You scored <span className="font-bold text-red-400">{result.score}%</span> — you need {result.passingScore}% to pass.
                  Review the material and try again.
                </p>
                <Button onClick={() => openModule(selectedModuleId!)} className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans">
                  Review Lessons
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Question-by-question breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-serif text-off-white">Question Breakdown</CardTitle>
            <CardDescription className="text-xs font-sans">
              {result.correctCount} of {result.totalQuestions} correct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.results.map((r: any, i: number) => (
              <div key={r.questionId} className={`p-4 rounded-lg border ${r.correct ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.correct ? "bg-green-500/20" : "bg-red-500/20"}`}>
                    {r.correct ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-sans text-off-white font-medium">Question {i + 1}</p>
                    <p className="text-xs text-soft-gray font-sans mt-1">
                      <Lightbulb className="w-3 h-3 inline mr-1" />
                      {r.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ─── WHAT'S NEXT GUIDANCE ─── */}
        {(() => {
          if (!academyData?.modules) return null;
          const modules = academyData.modules;
          const completedCount = modules.filter((m: any) => m.progress?.quizPassed).length + (result.passed ? 1 : 0);
          const totalModules = modules.length;

          if (result.passed) {
            // Check if this was the last module (quiz-wise)
            if (completedCount >= totalModules) {
              // Check if role plays are still needed
              const modsNeedingRP = modules.filter((m: any) => {
                const rps = m.rolePlayStatus ?? [];
                return rps.length > 0 && !rps.every((rp: any) => rp.passed);
              });
              if (modsNeedingRP.length > 0) {
                return (
                  <Card className="border-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-electric/10">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 font-sans mb-2">
                            <Zap className="w-3 h-3 mr-0.5" /> What's Next
                          </Badge>
                          <h3 className="text-base font-serif text-off-white font-medium mb-1">All Quizzes Passed — Role Plays Remaining</h3>
                          <p className="text-sm text-soft-gray font-sans leading-relaxed mb-4">
                            Great work passing all {totalModules} quizzes! Complete {modsNeedingRP.length} role play scenario{modsNeedingRP.length > 1 ? "s" : ""} to earn your full certification and unlock your pipeline.
                          </p>
                          <Button onClick={() => { setActiveView("overview"); setActiveTab("roleplay"); }} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-sans text-sm px-6">
                            Go to Role Play <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-electric/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Rocket className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 font-sans mb-2">
                          <Zap className="w-3 h-3 mr-0.5" /> What's Next
                        </Badge>
                        <h3 className="text-base font-serif text-off-white font-medium mb-1">You're Fully Certified!</h3>
                        <p className="text-sm text-soft-gray font-sans leading-relaxed mb-4">
                          All {totalModules} modules complete. Your account is now active — you can access leads, make calls, and start closing deals immediately.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button onClick={() => setLocation("/rep?tab=pipeline")} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm px-6">
                            Go to Pipeline <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                          <Button variant="ghost" onClick={() => setLocation("/rep?tab=performance")} className="text-soft-gray hover:text-off-white font-sans text-sm">
                            Check Performance <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Find the next module to complete
            const nextMod = modules.find((m: any) => m.id !== selectedModuleId && !m.progress?.quizPassed);
            if (nextMod) {
              return (
                <Card className="border-2 border-electric/30 bg-electric/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-electric/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-electric" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="text-[10px] border-electric/30 text-electric font-sans mb-2">
                          <Zap className="w-3 h-3 mr-0.5" /> What's Next
                        </Badge>
                        <h3 className="text-base font-serif text-off-white font-medium mb-1">Next Up: {nextMod.title}</h3>
                        <p className="text-sm text-soft-gray font-sans leading-relaxed mb-4">
                          {completedCount} of {totalModules} modules certified. Keep the momentum going — start the next module now.
                        </p>
                        <Button onClick={() => openModule(nextMod.id)} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm px-6">
                          Start Next Module <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          } else {
            // Failed quiz — guidance to retry
            const wrongCount = result.totalQuestions - result.correctCount;
            return (
              <Card className="border-2 border-amber-500/20 bg-amber-500/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 font-sans mb-2">
                        <Zap className="w-3 h-3 mr-0.5" /> How to Pass
                      </Badge>
                      <h3 className="text-base font-serif text-off-white font-medium mb-1">Review & Retry</h3>
                      <p className="text-sm text-soft-gray font-sans leading-relaxed mb-4">
                        You missed {wrongCount} question{wrongCount > 1 ? "s" : ""}. Review the explanations above, then go back through the lessons focusing on the areas you got wrong. You can retake the quiz as many times as needed.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => openModule(selectedModuleId!)} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm px-6">
                          Review Lessons <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button variant="ghost" onClick={() => openQuiz(selectedModuleId!)} className="text-soft-gray hover:text-off-white font-sans text-sm">
                          Retake Quiz <RotateCcw className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        <div className="flex justify-center gap-3">
          <Button onClick={() => setActiveView("overview")} variant="outline" className="rounded-full font-sans">
            Back to Academy
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     QUIZ VIEW
     ═══════════════════════════════════════════════════════ */
  if (activeView === "quiz" && quizData) {
    const answeredCount = Object.keys(quizAnswers).length;
    const totalQuestions = quizData.questions.length;
    const allAnswered = answeredCount === totalQuestions;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveView("overview")} className="text-soft-gray hover:text-off-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="text-sm font-sans text-soft-gray">
            {answeredCount} / {totalQuestions} answered
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif text-off-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-electric" />
              {quizData.moduleTitle} — Quiz
            </CardTitle>
            <CardDescription className="text-xs font-sans">
              Score {quizData.passingScore}% or higher to earn your certification. Take your time.
            </CardDescription>
            <Progress value={(answeredCount / totalQuestions) * 100} className="h-2 mt-2" />
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {quizData.questions.map((q: any, qIndex: number) => (
            <Card key={q.id} className={`border transition-all ${quizAnswers[q.id] !== undefined ? "border-electric/30 bg-electric/10" : "border-border/50"}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-electric/10 flex items-center justify-center text-xs font-sans font-bold text-electric shrink-0">
                    {qIndex + 1}
                  </span>
                  <div>
                    <p className="text-sm font-sans text-off-white font-medium leading-relaxed">{q.question}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {q.difficulty === "easy" ? "Foundation" : q.difficulty === "medium" ? "Applied" : "Advanced"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt: string, optIndex: number) => (
                    <button
                      key={optIndex}
                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                      className={`w-full text-left p-3 rounded-lg border text-sm font-sans transition-all ${
                        quizAnswers[q.id] === optIndex
                          ? "border-electric bg-electric/10 text-off-white font-medium"
                          : "border-border/30 hover:border-electric/30 hover:bg-electric/10 text-soft-gray"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          quizAnswers[q.id] === optIndex ? "border-electric bg-electric" : "border-electric/30"
                        }`}>
                          {quizAnswers[q.id] === optIndex && <CheckCircle className="w-3 h-3 text-white" />}
                        </span>
                        {opt}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-4 pb-8">
          <Button
            onClick={handleSubmitQuiz}
            disabled={!allAnswered || submitQuizMut.isPending}
            className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans px-8 py-3 text-base"
          >
            {submitQuizMut.isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Grading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Submit Quiz ({answeredCount}/{totalQuestions})
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     MODULE LESSON VIEW
     ═══════════════════════════════════════════════════════ */
  if (activeView === "module" && moduleDetail) {
    const lesson = moduleDetail.lessons[currentLessonIndex];
    const totalLessons = moduleDetail.lessons.length;
    const isLastLesson = currentLessonIndex === totalLessons - 1;
    const allLessonsComplete = moduleDetail.progress && moduleDetail.progress.lessonsCompleted >= totalLessons;
    const colors = moduleColorMap[moduleDetail.id] || moduleColorMap["product-mastery"];

    return (
      <div className="space-y-4">
        {/* Top navigation bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveView("overview")} className="text-soft-gray hover:text-off-white font-sans text-sm">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Academy
          </Button>
        </div>

        {/* Module header with lesson tabs */}
        <Card className={`${colors.bg} ${colors.border} border`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-serif text-off-white">{moduleDetail.title}</h2>
                <p className="text-xs text-soft-gray font-sans mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />{moduleDetail.estimatedMinutes} min total
                </p>
              </div>
              <div className="text-right">
                <Progress value={((moduleDetail.progress?.lessonsCompleted ?? 0) / totalLessons) * 100} className="w-28 h-2" />
                <p className="text-[10px] text-soft-gray font-sans mt-1">{moduleDetail.progress?.lessonsCompleted ?? 0}/{totalLessons} lessons</p>
              </div>
            </div>

            {/* Lesson tab buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {moduleDetail.lessons.map((l: any, i: number) => {
                const isActive = i === currentLessonIndex;
                const isCompleted = i < (moduleDetail.progress?.lessonsCompleted ?? 0);
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentLessonIndex(i); setLessonStartTime(Date.now()); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-electric text-white font-medium"
                        : isCompleted
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-white/5 text-soft-gray hover:bg-white/10"
                    }`}
                  >
                    {isCompleted && !isActive && <CheckCircle className="w-3 h-3" />}
                    Lesson {i + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lesson content — no ScrollArea, flows naturally */}
        {lesson && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-electric" />
                {lesson.title}
              </CardTitle>
              <p className="text-xs text-soft-gray font-sans">Lesson {currentLessonIndex + 1} of {totalLessons}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main lesson content */}
              <div className="prose prose-sm max-w-none text-off-white/80 font-sans">
                <Streamdown>{lesson.content}</Streamdown>
              </div>

              {/* Key Takeaways */}
              {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <h4 className="text-sm font-serif text-off-white flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> Key Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {lesson.keyTakeaways.map((t: string, i: number) => (
                      <li key={i} className="text-xs text-soft-gray font-sans flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice Script */}
              {lesson.script && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-serif text-off-white flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Practice Script
                  </h4>
                  <div className="text-xs text-soft-gray font-sans whitespace-pre-wrap">{lesson.script}</div>
                </div>
              )}

              {/* Role Play Scenario */}
              {lesson.rolePlay && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-sm font-serif text-off-white flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" /> Role Play Scenario
                  </h4>
                  <div className="text-xs text-soft-gray font-sans whitespace-pre-wrap">{lesson.rolePlay}</div>
                </div>
              )}

              {/* ─── Bottom Navigation ─── */}
              <div className="pt-6 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => { setCurrentLessonIndex((prev) => prev - 1); setLessonStartTime(Date.now()); }}
                    disabled={currentLessonIndex === 0}
                    className="rounded-full font-sans"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous Lesson
                  </Button>

                  <div className="flex items-center gap-3">
                    {isLastLesson ? (
                      <>
                        <Button
                          onClick={handleCompleteLesson}
                          disabled={completeLessonMut.isPending}
                          variant="outline"
                          className="rounded-full font-sans"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
                        </Button>
                        <Button
                          onClick={() => openQuiz(selectedModuleId!)}
                          className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans"
                        >
                          <GraduationCap className="w-4 h-4 mr-1" /> Take Quiz
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleCompleteLesson}
                        disabled={completeLessonMut.isPending}
                        className="bg-electric hover:bg-electric-light text-white rounded-full font-sans"
                      >
                        Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     OVERVIEW — Module grid + leaderboard
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="border-0 bg-gradient-to-br from-electric to-electric-dim text-midnight overflow-hidden relative">
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-charcoal/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif">MiniMorph Sales Academy</h1>
              <p className="text-sm text-white/70 font-sans">Master the art and science of selling</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans text-white/70">Overall Progress</span>
                <span className="text-sm font-sans font-bold">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3 bg-charcoal/20" />
            </div>
            <div className="text-center px-4 border-l border-white/20">
              <p className="text-2xl font-serif">{academyData?.modules.filter((m: any) => m.progress?.quizPassed).length || 0}</p>
              <p className="text-[10px] font-sans text-off-white/50">of {academyData?.modules.length || 8} certified</p>
            </div>
            {academyData?.isFullyCertified && (
              <div className="px-4 border-l border-white/20">
                <Badge className="bg-amber-500/20 text-amber-400 text-sm px-3 py-1">
                  <Trophy className="w-4 h-4 mr-1" /> Elite Certified
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-charcoal/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-charcoal/5 rounded-full translate-y-1/2" />
      </Card>

      {/* Daily Training Gate Banner */}
      {dailyCheckIn && !dailyCheckIn.isCleared && dailyCheckIn.pendingReviews.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-500/10/80">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-serif text-off-white font-medium mb-1">Daily Training Required</h3>
                <p className="text-xs text-soft-gray font-sans mb-3">
                  Complete your daily coaching reviews before accessing leads and making calls.
                  You have <span className="font-bold text-amber-400">{dailyCheckIn.pendingReviews.length}</span> review{dailyCheckIn.pendingReviews.length > 1 ? "s" : ""} to complete today.
                  {dailyCheckIn.config && (
                    <span className="text-soft-gray/60 ml-1">
                      ({dailyCheckIn.level.charAt(0).toUpperCase() + dailyCheckIn.level.slice(1)} tier: max {dailyCheckIn.config.maxDailyReviews}/day)
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Progress
                    value={dailyCheckIn.checkIn ? (dailyCheckIn.checkIn.reviewsCompleted / Math.max(dailyCheckIn.checkIn.reviewsRequired, 1)) * 100 : 0}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-sans text-soft-gray">
                    {dailyCheckIn.checkIn?.reviewsCompleted || 0}/{dailyCheckIn.checkIn?.reviewsRequired || 0} done
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {dailyCheckIn?.isCleared && dailyCheckIn.checkIn && dailyCheckIn.checkIn.reviewsRequired > 0 && (
        <Card className="border border-green-500/30 bg-green-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-sans text-green-400">Daily training complete! You're cleared to work.</span>
          </CardContent>
        </Card>
      )}

      {/* ─── YOUR NEXT STEP BANNER ─── */}
      {nextStep && (
        <Card className={`border-2 ${nextStep.color} overflow-hidden`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${nextStep.iconColor} flex items-center justify-center shrink-0`}>
                <nextStep.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] border-electric/30 text-electric font-sans">
                    <Zap className="w-3 h-3 mr-0.5" /> Your Next Step
                  </Badge>
                </div>
                <h3 className="text-base font-serif text-off-white font-medium mb-1">{nextStep.title}</h3>
                <p className="text-sm text-soft-gray font-sans leading-relaxed">{nextStep.description}</p>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={nextStep.primaryAction.onClick}
                    className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm px-6"
                  >
                    {nextStep.primaryAction.label} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  {nextStep.secondaryActions?.map((action: any, i: number) => (
                    <Button
                      key={i}
                      variant="ghost"
                      onClick={action.onClick}
                      className="text-soft-gray hover:text-off-white font-sans text-sm"
                    >
                      {action.label} <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Modules / Leaderboard / Daily Training */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-electric/10">
          <TabsTrigger value="daily" className="font-sans text-xs data-[state=active]:bg-electric data-[state=active]:text-white relative">
            <CalendarCheck className="w-3.5 h-3.5 mr-1" /> Daily Training
            {dailyCheckIn && !dailyCheckIn.isCleared && dailyCheckIn.pendingReviews.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {dailyCheckIn.pendingReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="modules" className="font-sans text-xs data-[state=active]:bg-electric data-[state=active]:text-white">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Training Modules
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="font-sans text-xs data-[state=active]:bg-electric data-[state=active]:text-white">
            <Trophy className="w-3.5 h-3.5 mr-1" /> Leaderboard
          </TabsTrigger>
          <TabsTrigger value="certifications" className="font-sans text-xs data-[state=active]:bg-electric data-[state=active]:text-white">
            <Award className="w-3.5 h-3.5 mr-1" /> My Certifications
          </TabsTrigger>
          <TabsTrigger value="roleplay" className="font-sans text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <MessageSquare className="w-3.5 h-3.5 mr-1" /> Role Play
          </TabsTrigger>
        </TabsList>

        {/* ─── DAILY TRAINING TAB ─── */}
        <TabsContent value="daily" className="space-y-4 mt-4">
          {checkInLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-soft-gray/60" />
            </div>
          ) : dailyCheckIn?.pendingReviews.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-serif text-off-white mb-2">All Clear!</h3>
                <p className="text-sm text-soft-gray font-sans mb-4">
                  No pending coaching reviews today. You're free to work your pipeline.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-soft-gray/60 font-sans">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Tier: {dailyCheckIn?.level?.charAt(0).toUpperCase()}{dailyCheckIn?.level?.slice(1)}</span>
                  <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> Max daily: {dailyCheckIn?.config?.maxDailyReviews || 0}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-serif text-off-white">Today's Coaching Reviews</h3>
                  <p className="text-xs text-soft-gray font-sans mt-0.5">
                    Complete these reviews to unlock your pipeline. Reviews are generated from AI analysis of your sales conversations.
                  </p>
                </div>
                <Badge className="bg-electric/10 text-electric text-xs">
                  {dailyCheckIn?.checkIn?.reviewsCompleted || 0}/{dailyCheckIn?.checkIn?.reviewsRequired || 0} done
                </Badge>
              </div>

              {dailyCheckIn?.pendingReviews.map((review: any) => {
                const isExpanded = expandedReview === review.id;
                const quiz = review.quizQuestion as { question: string; options: string[]; correctAnswer: number; explanation: string } | null;
                const needsQuiz = quiz !== null;
                const hasAnswered = reviewQuizAnswer[review.id] !== undefined;

                return (
                  <Card key={review.id} className={`border transition-all ${
                    review.priority === "critical" ? "border-red-500/30 bg-red-500/10" :
                    review.priority === "important" ? "border-amber-500/20 bg-amber-500/10/30" :
                    "border-border/50"
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          review.priority === "critical" ? "bg-red-500/20" :
                          review.priority === "important" ? "bg-amber-500/20" :
                          "bg-electric/10"
                        }`}>
                          <Brain className={`w-4 h-4 ${
                            review.priority === "critical" ? "text-red-400" :
                            review.priority === "important" ? "text-amber-400" :
                            "text-soft-gray"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-sans text-off-white font-medium">{review.title}</h4>
                            <Badge variant="outline" className={`text-[10px] ${
                              review.priority === "critical" ? "border-red-500/30 text-red-400" :
                              review.priority === "important" ? "border-amber-500/30 text-amber-400" :
                              "border-electric/30 text-soft-gray"
                            }`}>
                              {review.priority}
                            </Badge>
                            {review.category && (
                              <Badge variant="outline" className="text-[10px] border-electric/20 text-soft-gray/60">
                                {review.category.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>

                          {!isExpanded ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedReview(review.id)}
                              className="text-xs text-electric hover:text-electric/80 font-sans p-0 h-auto mt-1"
                            >
                              <Play className="w-3 h-3 mr-1" /> Start Review
                            </Button>
                          ) : (
                            <div className="mt-3 space-y-4">
                              {/* Lesson content */}
                              <div className="prose prose-sm max-w-none text-off-white/80 font-sans bg-charcoal/50 rounded-lg p-4 border border-border/30">
                                <Streamdown>{review.content}</Streamdown>
                              </div>

                              {/* Quiz section */}
                              {needsQuiz && quiz && (
                                <div className="p-4 bg-electric/10 rounded-lg border border-electric/10">
                                  <h5 className="text-xs font-sans font-medium text-off-white mb-3 flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-electric" /> Quick Quiz
                                  </h5>
                                  <p className="text-sm font-sans text-off-white mb-3">{quiz.question}</p>
                                  <div className="space-y-2">
                                    {quiz.options.map((opt: string, i: number) => (
                                      <button
                                        key={i}
                                        onClick={() => setReviewQuizAnswer(prev => ({ ...prev, [review.id]: i }))}
                                        className={`w-full text-left p-3 rounded-lg border text-sm font-sans transition-all ${
                                          reviewQuizAnswer[review.id] === i
                                            ? "border-electric bg-electric/10 text-off-white font-medium"
                                            : "border-border/30 hover:border-electric/30 hover:bg-electric/10 text-soft-gray"
                                        }`}
                                      >
                                        <span className="inline-flex items-center gap-2">
                                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            reviewQuizAnswer[review.id] === i ? "border-electric bg-electric" : "border-electric/30"
                                          }`}>
                                            {reviewQuizAnswer[review.id] === i && <CheckCircle className="w-3 h-3 text-white" />}
                                          </span>
                                          {opt}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Submit button */}
                              <div className="flex items-center gap-3">
                                <Button
                                  onClick={() => {
                                    completeReviewMut.mutate(
                                      { reviewId: review.id, quizAnswer: reviewQuizAnswer[review.id] },
                                      {
                                        onSuccess: (result) => {
                                          if (result.quizPassed === false) {
                                            toast.error(`Incorrect. ${result.explanation || "Review the material and try again."}`);
                                          } else {
                                            toast.success("Review completed!");
                                          }
                                          setExpandedReview(null);
                                          setReviewQuizAnswer(prev => { const n = { ...prev }; delete n[review.id]; return n; });
                                        },
                                      }
                                    );
                                  }}
                                  disabled={completeReviewMut.isPending || (needsQuiz && !hasAnswered)}
                                  className="bg-electric hover:bg-electric/90 text-white rounded-full font-sans text-xs px-4"
                                  size="sm"
                                >
                                  {completeReviewMut.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {needsQuiz ? "Submit Answer" : "Mark Complete"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedReview(null)}
                                  className="text-xs text-soft-gray font-sans"
                                >
                                  Collapse
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── MODULES TAB ─── */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          {/* Recommended path */}
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-electric" />
            <span className="text-xs font-sans text-soft-gray">Complete modules in order for the best learning experience</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(academyData?.modules || []).map((mod: any, index: number) => {
              const colors = moduleColorMap[mod.id] || moduleColorMap["product-mastery"];
              const Icon = iconMap[mod.icon] || BookOpen;
              const isPassed = mod.progress?.quizPassed;
              const isStarted = mod.progress && mod.progress.lessonsCompleted > 0;
              const lessonPct = mod.progress
                ? Math.round((mod.progress.lessonsCompleted / mod.lessonCount) * 100)
                : 0;
              const hasRequiredRP = mod.rolePlayStatus && mod.rolePlayStatus.length > 0;
              const allRPPassed = hasRequiredRP ? mod.rolePlayStatus.every((rp: any) => rp.passed) : true;
              const isModuleCertified = isPassed && allRPPassed;

              // Check if previous module is completed (for recommended path)
              const prevMod = index > 0 ? academyData?.modules[index - 1] : null;
              const prevCompleted = !prevMod || prevMod.progress?.quizPassed;

              const isLocked = !prevCompleted && !isStarted;
              return (
                <Card
                  key={mod.id}
                  className={`border transition-all group ${
                    isLocked ? "border-border/20 opacity-60 cursor-not-allowed" :
                    isModuleCertified ? `${colors.border} ${colors.bg} cursor-pointer hover:shadow-lg` :
                    "border-border/50 hover:border-electric/30 cursor-pointer hover:shadow-lg"
                  }`}
                  onClick={() => { if (!isLocked) openModule(mod.id); }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
                        {isLocked ? (
                          <Lock className="w-6 h-6 text-soft-gray/40" />
                        ) : isModuleCertified ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-sans text-soft-gray/60 font-medium">MODULE {index + 1}</span>
                          {isModuleCertified && (
                            <Badge className="badge-success text-[10px]">
                              <GraduationCap className="w-3 h-3 mr-0.5" /> Certified
                            </Badge>
                          )}
                          {isPassed && !allRPPassed && (
                            <Badge className="bg-amber-500/15 text-amber-400 text-[10px]">
                              <MessageSquare className="w-3 h-3 mr-0.5" /> Role Play Required
                            </Badge>
                          )}
                          {!prevCompleted && !isStarted && (
                            <Badge variant="outline" className="text-[10px] text-red-400/70 border-red-500/20">
                              <Lock className="w-3 h-3 mr-0.5" /> Locked — complete Module {index} first
                            </Badge>
                          )}
                          {hasRequiredRP && !isPassed && (
                            <Badge variant="outline" className="text-[10px] text-purple-400/60 border-purple-500/20">
                              <MessageSquare className="w-3 h-3 mr-0.5" /> + Role Play
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-sm font-serif text-off-white font-medium truncate">{mod.title}</h3>
                        <p className="text-xs text-soft-gray font-sans mt-1 line-clamp-2">{mod.description}</p>

                        <div className="flex items-center gap-4 mt-3 text-[10px] text-soft-gray/60 font-sans">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {mod.lessonCount} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {mod.estimatedMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> {mod.quizQuestionCount} questions
                          </span>
                          {hasRequiredRP && (
                            <span className="flex items-center gap-1 text-purple-400/60">
                              <MessageSquare className="w-3 h-3" /> role play
                            </span>
                          )}
                        </div>

                        {isStarted && !isPassed && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-sans text-soft-gray">{mod.progress.lessonsCompleted}/{mod.lessonCount} lessons</span>
                              <span className="text-[10px] font-sans text-soft-gray">{lessonPct}%</span>
                            </div>
                            <Progress value={lessonPct} className="h-1.5" />
                          </div>
                        )}

                        {isPassed && mod.progress?.quizScore && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <Badge className={colors.badge + " text-[10px]"}>
                              <Star className="w-3 h-3 mr-0.5" /> Quiz: {mod.progress.quizScore}%
                            </Badge>
                            {hasRequiredRP && mod.rolePlayStatus.map((rp: any) => (
                              <Badge key={rp.scenarioType} className={rp.passed ? "badge-success text-[10px]" : "bg-gray-500/15 text-soft-gray text-[10px]"}>
                                <MessageSquare className="w-3 h-3 mr-0.5" />
                                {rp.label}: {rp.bestScore !== null ? `${rp.bestScore}%` : "Not attempted"}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-soft-gray/40 group-hover:text-soft-gray transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── LEADERBOARD TAB ─── */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Academy Leaderboard
              </CardTitle>
              <CardDescription className="text-xs font-sans">
                Top performers ranked by modules completed and quiz scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!leaderboard || leaderboard.length === 0) ? (
                <div className="text-center py-8">
                  <Trophy className="w-10 h-10 text-soft-gray/40 mx-auto mb-3" />
                  <p className="text-sm text-soft-gray font-sans">No reps have started the academy yet.</p>
                  <p className="text-xs text-soft-gray/60 font-sans mt-1">Be the first to complete a module!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((rep: any, index: number) => (
                    <div key={rep.repId} className={`flex items-center gap-4 p-3 rounded-lg border ${
                      index === 0 ? "border-amber-500/20 bg-amber-500/10/50" :
                      index === 1 ? "border-gray-500/30 bg-gray-500/10" :
                      index === 2 ? "border-orange-500/30 bg-orange-500/10" :
                      "border-border/30"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-sans ${
                        index === 0 ? "badge-pending-payment" :
                        index === 1 ? "badge-neutral" :
                        index === 2 ? "badge-pending-payment" :
                        "bg-electric/10 text-soft-gray"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-sans text-off-white font-medium">{rep.repName}</span>
                          {rep.isFullyCertified && (
                            <Badge className="badge-pending-payment text-[10px]">
                              <Trophy className="w-3 h-3 mr-0.5" /> Elite
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-soft-gray/60 font-sans">
                          <span>{rep.completedModules}/{rep.totalModules} modules</span>
                          <span>Avg: {rep.avgScore}%</span>
                          <span>{rep.totalTimeMinutes} min spent</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Progress value={(rep.completedModules / rep.totalModules) * 100} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── CERTIFICATIONS TAB ─── */}
        <TabsContent value="certifications" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <Award className="w-4 h-4 text-electric" /> My Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!academyData?.certifications || academyData.certifications.length === 0) ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-10 h-10 text-soft-gray/40 mx-auto mb-3" />
                  <p className="text-sm text-soft-gray font-sans">No certifications yet.</p>
                  <p className="text-xs text-soft-gray/60 font-sans mt-1">Complete modules and pass quizzes to earn certifications.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {academyData.certifications.map((cert: any) => {
                    const mod = academyData.modules.find((m: any) => m.id === cert.moduleId);
                    const isFull = cert.certificationType === "full";
                    return (
                      <Card key={cert.id} className={`border-2 ${isFull ? "border-amber-500/30 bg-gradient-to-br from-graphite to-amber-500/10" : "border-green-500/30 bg-green-500/10"}`}>
                        <CardContent className="p-5 text-center">
                          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${isFull ? "bg-amber-500/20" : "bg-green-500/20"}`}>
                            {isFull ? <Trophy className="w-8 h-8 text-amber-400" /> : <GraduationCap className="w-8 h-8 text-emerald-400" />}
                          </div>
                          <h3 className="text-sm font-serif text-off-white font-medium">
                            {isFull ? "Elite Sales Certification" : mod?.title || cert.moduleId}
                          </h3>
                          <p className="text-xs text-soft-gray font-sans mt-1">
                            Score: {cert.score}% | {new Date(cert.certifiedAt).toLocaleDateString()}
                          </p>
                          {isFull && (
                            <Badge className="mt-2 badge-pending-payment">
                              <Flame className="w-3 h-3 mr-1" /> All Modules Completed
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post-certification guidance */}
          {academyData?.isFullyCertified && (
            <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-electric/10 mt-4">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Rocket className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-serif text-off-white font-medium mb-1">You're Fully Certified — Now Start Selling</h3>
                    <p className="text-sm text-soft-gray font-sans leading-relaxed mb-3">
                      Your training is complete. Here's your daily workflow:
                    </p>
                    <ol className="text-sm text-soft-gray font-sans space-y-2 mb-4 list-decimal list-inside">
                      <li><span className="text-off-white font-medium">Complete Daily Training</span> — coaching reviews that keep your skills sharp and unlock your pipeline each day</li>
                      <li><span className="text-off-white font-medium">Work Your Pipeline</span> — claim leads, make calls, send emails, and move deals forward</li>
                      <li><span className="text-off-white font-medium">Track Performance</span> — monitor your score, tier, and earnings on the Performance tab</li>
                      <li><span className="text-off-white font-medium">Practice with Role Play</span> — sharpen specific skills with AI-powered scenarios anytime</li>
                    </ol>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button onClick={() => setLocation("/rep?tab=pipeline")} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm px-6">
                        Go to Pipeline <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button variant="ghost" onClick={() => setLocation("/rep?tab=performance")} className="text-soft-gray hover:text-off-white font-sans text-sm">
                        Performance <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button variant="ghost" onClick={() => setLocation("/rep?tab=guide")} className="text-soft-gray hover:text-off-white font-sans text-sm">
                        Full Guide <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guidance for reps who haven't started or are in progress */}
          {!academyData?.isFullyCertified && (academyData?.certifications?.length ?? 0) > 0 && (
            <Card className="border border-electric/20 bg-electric/5 mt-4">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-electric shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-off-white font-sans font-medium">Keep Going!</p>
                    <p className="text-xs text-soft-gray font-sans mt-1">
                      {academyData?.certifications?.length} of {academyData?.modules?.length} modules certified. Complete all modules to unlock your full sales account — leads, calls, and commissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── ROLE PLAY TAB ─── */}
        <TabsContent value="roleplay" className="mt-4">
          <RolePlayTab academyData={academyData} overallProgress={overallProgress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROLE PLAY TAB — AI-powered sales practice
   ═══════════════════════════════════════════════════════ */
const SCENARIO_TYPES = [
  { value: "cold_call", label: "Cold Call", icon: Phone, description: "Cold call Mike Barrett at Shoreline Concrete & Coatings — a busy contractor who doesn't know you", personName: "Mike Barrett", businessName: "Shoreline Concrete & Coatings", difficulty: "Intermediate" as const, color: "badge-info border-blue-500/30" },
  { value: "discovery_call", label: "Discovery Call", icon: Search, description: "Discover pain points with Quinn Hayes at Q's Landscaping — budget-aware and practical", personName: "Quinn Hayes", businessName: "Q's Landscaping", difficulty: "Beginner" as const, color: "badge-success border-green-500/30" },
  { value: "objection_handling", label: "Objection Handling", icon: Shield, description: "Handle price objections from Jordan Miller at Lakeshore Auto Detailing — interested but cautious", personName: "Jordan Miller", businessName: "Lakeshore Auto Detailing", difficulty: "Intermediate" as const, color: "badge-pending-payment border-amber-500/20" },
  { value: "closing", label: "Closing", icon: Target, description: "Close the deal with Alyssa Moreno at Velvet & Vine Studio — she's ready to buy", personName: "Alyssa Moreno", businessName: "Velvet & Vine Studio", difficulty: "Intermediate" as const, color: "badge-danger border-red-500/30" },
  { value: "follow_up", label: "Follow Up", icon: ArrowRight, description: "Re-engage Mark Ellis at G&L Chillidog — interested last week but went silent", personName: "Mark Ellis", businessName: "G&L Chillidog", difficulty: "Intermediate" as const, color: "badge-purple border-purple-500/30" },
  { value: "upsell", label: "Upsell", icon: TrendingUp, description: "Upsell Darnell Reed at Northside Fitness Lab — wants the basic plan but needs more", personName: "Darnell Reed", businessName: "Northside Fitness Lab", difficulty: "Advanced" as const, color: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  { value: "angry_customer", label: "Angry Customer", icon: AlertCircle, description: "De-escalate Rick Donovan at Hammerstone Builds — a paying client who feels ignored", personName: "Rick Donovan", businessName: "Hammerstone Builds", difficulty: "Advanced" as const, color: "badge-pending-payment border-orange-500/30" },
  { value: "price_negotiation", label: "Price Negotiation", icon: Crown, description: "Defend pricing with Samantha Lee at Ember & Oak Coffee Co. — smart and negotiating", personName: "Samantha Lee", businessName: "Ember & Oak Coffee Co.", difficulty: "Advanced" as const, color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" },
] as const;

// Map scenario types to the modules that should be completed first
const SCENARIO_MODULE_REQUIREMENTS: Record<string, string[]> = {
  cold_call: ["digital-prospecting"],
  discovery_call: ["discovery-call"],
  objection_handling: ["objection-handling"],
  closing: ["closing-techniques"],
  follow_up: ["account-management"],
  upsell: ["account-management", "product-mastery"],
  angry_customer: ["values-ethics", "objection-handling"],
  price_negotiation: ["closing-techniques", "psychology-selling"],
};

// Weekly challenge rotation
const WEEKLY_CHALLENGES = [
  { scenario: "cold_call", title: "Cold Call Blitz", description: "Score 80+ on a cold call to earn this week's badge", targetScore: 80 },
  { scenario: "objection_handling", title: "Objection Crusher", description: "Handle tough objections and score 85+ this week", targetScore: 85 },
  { scenario: "discovery_call", title: "Discovery Master", description: "Uncover deep pain points — score 80+ to complete", targetScore: 80 },
  { scenario: "closing", title: "Closer's Challenge", description: "Seal the deal with a score of 85+ this week", targetScore: 85 },
  { scenario: "price_negotiation", title: "Value Defender", description: "Defend your pricing and score 80+ to win", targetScore: 80 },
  { scenario: "follow_up", title: "Re-Engagement Pro", description: "Bring a cold lead back to life — score 80+", targetScore: 80 },
  { scenario: "upsell", title: "Upsell Artist", description: "Upgrade a client to Premium tier — score 85+", targetScore: 85 },
  { scenario: "angry_customer", title: "De-Escalation Expert", description: "Calm an angry customer and score 80+", targetScore: 80 },
];

function getWeeklyChallenge() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_CHALLENGES[weekNumber % WEEKLY_CHALLENGES.length];
}

function RolePlayTab({ academyData, overallProgress }: { academyData: any; overallProgress: number }) {
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string; timestamp?: number }>>([]); 
  const [persona, setPersona] = useState<any>(null);
  const [scenarioType, setScenarioType] = useState<string>("");
  const [showScorecard, setShowScorecard] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [showBriefing, setShowBriefing] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = trpc.academy.rolePlaySessions.useQuery();

  // Check which modules are completed
  const completedModules = useMemo(() => {
    if (!academyData?.modules) return new Set<string>();
    return new Set(academyData.modules.filter((m: any) => m.progress?.quizPassed).map((m: any) => m.id));
  }, [academyData]);

  const isScenarioUnlocked = (scenarioValue: string) => {
    const required = SCENARIO_MODULE_REQUIREMENTS[scenarioValue] || [];
    return required.every(modId => completedModules.has(modId));
  };

  const weeklyChallenge = getWeeklyChallenge();
  const weeklyCompleted = sessions?.some((s: any) =>
    s.scenarioType === weeklyChallenge.scenario &&
    s.status === "scored" &&
    s.score >= weeklyChallenge.targetScore &&
    new Date(s.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const utils = trpc.useUtils();

  const startMut = trpc.academy.startRolePlay.useMutation({
    onSuccess: (data) => {
      setActiveSession(Number(data.sessionId));
      setChatMessages(data.messages);
      setPersona(data.persona);
      setScenarioType(data.scenarioType);
      setBriefing((data as any).briefing || null);
      setShowBriefing(true);
      utils.academy.rolePlaySessions.invalidate();
    },
  });

  const messageMut = trpc.academy.rolePlayMessage.useMutation({
    onSuccess: (data) => {
      setChatMessages(data.messages);
    },
  });

  const scoreMut = trpc.academy.scoreRolePlay.useMutation({
    onSuccess: () => {
      setShowScorecard(true);
      utils.academy.rolePlaySessions.invalidate();
    },
  });

  const handleSendMessage = (content: string) => {
    if (!activeSession) return;
    // Optimistically add user message
    setChatMessages(prev => [...prev, { role: "user", content, timestamp: Date.now() }]);
    messageMut.mutate({ sessionId: activeSession, message: content });
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    scoreMut.mutate({ sessionId: activeSession });
  };

  const handleBackToScenarios = () => {
    setActiveSession(null);
    setChatMessages([]);
    setPersona(null);
    setScenarioType("");
    setShowScorecard(false);
    setBriefing(null);
    setShowBriefing(false);
  };

  // Resume an existing session
  const handleResumeSession = (session: any) => {
    setActiveSession(session.id);
    setChatMessages((session.messages as any[]) || []);
    setPersona(JSON.parse(session.prospectPersona));
    setScenarioType(session.scenarioType);
    if (session.status === "scored") {
      setShowScorecard(true);
    }
  };

  /* ─── SCORECARD VIEW ─── */
  if (showScorecard && scoreMut.data) {
    const result = scoreMut.data;
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBackToScenarios} className="text-soft-gray hover:text-off-white">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Scenarios
        </Button>

        <Card className={`border-2 ${result.score >= 70 ? "border-green-500/30 bg-green-500/10" : result.score >= 50 ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`}>
          <CardContent className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              result.score >= 70 ? "bg-green-500/20" : result.score >= 50 ? "bg-amber-500/20" : "bg-red-500/20"
            }`}>
              <span className={`text-3xl font-serif font-bold ${
                result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-400"
              }`}>{result.score}</span>
            </div>
            <h2 className="text-2xl font-serif text-off-white mb-2">
              {result.score >= 80 ? "Excellent!" : result.score >= 70 ? "Good Job!" : result.score >= 50 ? "Getting There" : "Keep Practicing"}
            </h2>
            <p className="text-sm text-soft-gray font-sans mb-2">
              {result.wouldProspectBuy ? "The prospect would likely buy!" : "The prospect wasn't convinced yet."}
            </p>
            <Badge className={result.wouldProspectBuy ? "badge-success" : "badge-danger"}>
              {result.wouldProspectBuy ? "Deal Likely" : "No Deal"}
            </Badge>
          </CardContent>
        </Card>

        {/* Key Moment */}
        <Card className="border-border/50 bg-purple-500/10">
          <CardContent className="p-5">
            <h3 className="text-sm font-serif text-off-white mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-400" /> Key Moment
            </h3>
            <p className="text-sm text-soft-gray font-sans">{result.keyMoment}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <Card className="border-green-500/30 bg-green-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif text-off-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.strengths.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <Star className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                  <span className="text-xs text-soft-gray font-sans">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card className="border-amber-500/20 bg-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif text-off-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.improvements.map((s: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-amber-500 shrink-0 mt-1" />
                  <span className="text-xs text-soft-gray font-sans">{s}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif text-off-white">Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-off-white/80 font-sans">
              <Streamdown>{result.feedback}</Streamdown>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Button onClick={handleBackToScenarios} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans">
            Try Another Scenario
          </Button>
        </div>
      </div>
    );
  }

  /* ─── ACTIVE SESSION VIEW ─── */
  if (activeSession && persona) {
    const difficultyColor = briefing?.difficulty === "Advanced" ? "bg-red-500/20 text-red-400 border-red-500/30"
      : briefing?.difficulty === "Intermediate" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : "bg-green-500/20 text-green-400 border-green-500/30";

    /* ── Pre-session briefing card ── */
    if (showBriefing && briefing) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" onClick={handleBackToScenarios} className="text-soft-gray hover:text-off-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Scenarios
          </Button>

          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-900/10 overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Persona identity row */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-serif text-purple-400">{persona.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-serif text-off-white">{persona.name}</h2>
                  <p className="text-sm text-soft-gray font-sans">{persona.role || persona.personRole} — {persona.company}</p>
                  <p className="text-xs text-soft-gray/70 font-sans mt-0.5">{persona.industry} • {persona.businessType || persona.companySize}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant="outline" className={`text-[10px] border ${difficultyColor}`}>
                    {briefing.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                    {scenarioType.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-purple-500/20" />

              {/* Conversation stage & context */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-sans font-medium text-off-white">Conversation Stage</p>
                    <p className="text-xs text-soft-gray font-sans mt-0.5">{briefing.conversationStage}</p>
                  </div>
                </div>
                {briefing.priorContext && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-sans font-medium text-off-white">Prior Context</p>
                      <p className="text-xs text-soft-gray font-sans mt-0.5">{briefing.priorContext}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-purple-500/20" />

              {/* Rep objective */}
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-sans font-medium text-off-white">Your Objective</p>
                  <p className="text-xs text-soft-gray font-sans mt-0.5">{briefing.repObjective}</p>
                </div>
              </div>

              {/* Success criteria checklist */}
              {briefing.successCriteria && briefing.successCriteria.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-xs font-sans font-medium text-off-white">Success Criteria</p>
                  </div>
                  <div className="grid gap-1.5 pl-6">
                    {briefing.successCriteria.map((criterion: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 shrink-0" />
                        <p className="text-xs text-soft-gray font-sans">{criterion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideal behaviors */}
              {briefing.idealBehaviors && briefing.idealBehaviors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-xs font-sans font-medium text-off-white">Tips for Success</p>
                  </div>
                  <div className="grid gap-1.5 pl-6">
                    {briefing.idealBehaviors.map((behavior: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                        <p className="text-xs text-soft-gray font-sans">{behavior}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forbidden behaviors */}
              {briefing.forbiddenBehaviors && briefing.forbiddenBehaviors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs font-sans font-medium text-off-white">Avoid These Mistakes</p>
                  </div>
                  <div className="grid gap-1.5 pl-6">
                    {briefing.forbiddenBehaviors.map((behavior: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0" />
                        <p className="text-xs text-soft-gray font-sans">{behavior}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="bg-purple-500/20" />

              {/* Start button */}
              <div className="text-center pt-2">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-sans px-8"
                  onClick={() => setShowBriefing(false)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  I'm Ready — Start Conversation
                </Button>
                <p className="text-[10px] text-soft-gray/50 font-sans mt-2">
                  {persona.name} will speak first. Respond naturally as a MiniMorph sales rep.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    /* ── Active conversation view (after dismissing briefing) ── */
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBackToScenarios} className="text-soft-gray hover:text-off-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button
            onClick={handleEndSession}
            disabled={scoreMut.isPending || chatMessages.filter(m => m.role === "user").length < 2}
            variant="outline"
            className="rounded-full font-sans text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {scoreMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
            End & Score Session
          </Button>
        </div>

        {/* Compact prospect info card */}
        <Card className="border-purple-500/30 bg-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-lg font-serif text-purple-400">{persona.name?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-sans font-medium text-off-white">{persona.name}</h3>
                <p className="text-xs text-soft-gray font-sans">{persona.company} • {persona.role || persona.industry} • {persona.businessType || `${persona.companySize} employees`}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {briefing?.difficulty && (
                  <Badge variant="outline" className={`text-[10px] border ${difficultyColor}`}>
                    {briefing.difficulty}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  {scenarioType.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat interface */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <AIChatBox
              messages={chatMessages.map(m => ({
                role: m.role as "user" | "assistant" | "system",
                content: m.content,
              }))}
              onSendMessage={handleSendMessage}
              isLoading={messageMut.isPending}
              placeholder={`Respond to ${persona.name}...`}
              height={400}
              emptyStateMessage="Start the conversation!"
            />
          </CardContent>
        </Card>

        <p className="text-[10px] text-soft-gray/60 font-sans text-center">
          Send at least 2 messages before ending the session. The AI will score your performance.
        </p>
      </div>
    );
  }

  /* ─── SCENARIO SELECTION VIEW ─── */
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-purple-600 to-purple-800 text-white overflow-hidden relative">
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-charcoal/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-serif">AI Role Play</h2>
              <p className="text-xs text-white/70 font-sans">Practice with realistic, pre-built sales scenarios</p>
            </div>
          </div>
          <p className="text-xs text-white/80 font-sans mt-3">
            Each scenario features a unique business, personality, and challenge. Read the briefing, practice your pitch, handle objections, and get scored on your performance.
          </p>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-charcoal/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      </Card>

      {/* Weekly Challenge Banner */}
      <Card className={`border-2 ${weeklyCompleted ? 'border-green-500/30 bg-green-500/10' : 'border-amber-500/30 bg-amber-500/10'} overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${weeklyCompleted ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
              {weeklyCompleted ? <Trophy className="w-5 h-5 text-green-400" /> : <Target className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif text-off-white">Weekly Challenge: {weeklyChallenge.title}</h3>
                {weeklyCompleted && <Badge className="bg-green-600 text-white text-[10px]">Completed</Badge>}
              </div>
              <p className="text-xs text-soft-gray font-sans mt-0.5">{weeklyChallenge.description}</p>
            </div>
            {!weeklyCompleted && isScenarioUnlocked(weeklyChallenge.scenario) && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                onClick={() => startMut.mutate({ scenarioType: weeklyChallenge.scenario as any })}
                disabled={startMut.isPending}
              >
                {startMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start Challenge'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <h3 className="text-sm font-serif text-off-white">Choose a Scenario</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCENARIO_TYPES.map((scenario) => {
          const Icon = scenario.icon;
          const unlocked = isScenarioUnlocked(scenario.value);
          const requiredModules = SCENARIO_MODULE_REQUIREMENTS[scenario.value] || [];
          const missingModules = requiredModules.filter(m => !completedModules.has(m));
          const diffBadgeColor = scenario.difficulty === "Advanced" ? "bg-red-500/20 text-red-400 border-red-500/30"
            : scenario.difficulty === "Intermediate" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
            : "bg-green-500/20 text-green-400 border-green-500/30";
          return (
            <Card
              key={scenario.value}
              className={`border-border/50 transition-all ${unlocked ? 'hover:shadow-lg cursor-pointer group' : 'opacity-75 cursor-not-allowed'}`}
              onClick={() => unlocked && startMut.mutate({ scenarioType: scenario.value as any })}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${unlocked ? scenario.color : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                    {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-sans font-medium text-off-white">{scenario.label}</h4>
                      <Badge variant="outline" className={`text-[9px] border ${diffBadgeColor}`}>
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    {unlocked ? (
                      <>
                        <p className="text-xs text-purple-400/90 font-sans font-medium mt-0.5">{scenario.personName} — {scenario.businessName}</p>
                        <p className="text-xs text-soft-gray/80 font-sans mt-0.5">{scenario.description}</p>
                      </>
                    ) : (
                      <p className="text-xs text-amber-400/80 font-sans mt-0.5">
                        Complete {missingModules.map(m => m.replace(/-/g, ' ')).join(', ')} module{missingModules.length > 1 ? 's' : ''} first
                      </p>
                    )}
                  </div>
                  {unlocked ? (
                    startMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-soft-gray/60" />
                    ) : (
                      <Play className="w-4 h-4 text-soft-gray/40 group-hover:text-soft-gray transition-colors" />
                    )
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Past Sessions */}
      {sessions && sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif text-off-white">Past Sessions</h3>
          {sessions.slice(0, 10).map((session: any) => {
            const persona = JSON.parse(session.prospectPersona);
            const scenarioLabel = SCENARIO_TYPES.find(s => s.value === session.scenarioType)?.label || session.scenarioType;
            return (
              <Card
                key={session.id}
                className="border-border/30 hover:border-border/50 cursor-pointer transition-all"
                onClick={() => handleResumeSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-sm font-serif text-purple-400">{persona.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-sans text-off-white">{persona.name}</span>
                          <Badge variant="outline" className="text-[10px]">{scenarioLabel}</Badge>
                          <Badge className={`text-[10px] ${
                            session.status === "scored" ? "badge-success" :
                            session.status === "active" ? "badge-info" :
                            "badge-neutral"
                          }`}>
                            {session.status === "scored" ? `Score: ${session.score}` : session.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-soft-gray/60 font-sans">
                          {new Date(session.createdAt).toLocaleDateString()} • {session.messageCount || 0} messages
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-soft-gray/40" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
