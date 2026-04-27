import { useState, useMemo, useEffect } from "react";
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
  CalendarCheck, ShieldCheck, AlertTriangle, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Package, Brain, Phone, Shield, Target, Search, TrendingUp, Crown,
};

const moduleColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "product-mastery": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "badge-info" },
  "psychology-selling": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "badge-purple" },
  "discovery-call": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  "objection-handling": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "badge-danger" },
  "closing-techniques": { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700", badge: "badge-pending-payment" },
  "digital-prospecting": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
  "account-management": { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
  "advanced-tactics": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
};

export default function SalesAcademy() {
  const [activeView, setActiveView] = useState<"overview" | "module" | "quiz" | "results">("overview");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
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

        <Card className={`border-2 ${result.passed ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}`}>
          <CardContent className="p-8 text-center">
            {result.passed ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-serif text-off-white mb-2">Congratulations!</h2>
                <p className="text-soft-gray font-sans mb-4">
                  You passed the {mod?.title} quiz with a score of <span className="font-bold text-emerald-400">{result.score}%</span>
                </p>
                <Badge className="badge-success text-sm px-4 py-1">
                  <GraduationCap className="w-4 h-4 mr-1" /> Module Certified
                </Badge>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-serif text-off-white mb-2">Not Quite There</h2>
                <p className="text-soft-gray font-sans mb-4">
                  You scored <span className="font-bold text-red-600">{result.score}%</span> — you need {result.passingScore}% to pass.
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
              <div key={r.questionId} className={`p-4 rounded-lg border ${r.correct ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${r.correct ? "bg-green-100" : "bg-red-100"}`}>
                    {r.correct ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
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

        <div className="flex justify-center gap-3">
          {!result.passed && (
            <Button onClick={() => openQuiz(selectedModuleId!)} variant="outline" className="rounded-full font-sans">
              <RotateCcw className="w-4 h-4 mr-1" /> Retake Quiz
            </Button>
          )}
          <Button onClick={() => setActiveView("overview")} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans">
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
      <div className="space-y-6">
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveView("overview")} className="text-soft-gray hover:text-off-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Academy
          </Button>
          <div className="flex items-center gap-2 text-sm font-sans text-soft-gray">
            <span>Lesson {currentLessonIndex + 1} of {totalLessons}</span>
          </div>
        </div>

        {/* Module header */}
        <Card className={`${colors.bg} ${colors.border} border`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif text-off-white">{moduleDetail.title}</h2>
                <p className="text-xs text-soft-gray font-sans mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />{moduleDetail.estimatedMinutes} min total
                </p>
              </div>
              <Progress value={(currentLessonIndex / totalLessons) * 100} className="w-32 h-2" />
            </div>
            {/* Lesson navigation dots */}
            <div className="flex items-center gap-1.5 mt-3">
              {moduleDetail.lessons.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => { setCurrentLessonIndex(i); setLessonStartTime(Date.now()); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentLessonIndex
                      ? "bg-electric w-6"
                      : i < (moduleDetail.progress?.lessonsCompleted ?? 0)
                      ? "bg-green-500"
                      : "bg-electric/20"
                  }`}
                  title={`Lesson ${i + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lesson content */}
        {lesson && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-electric" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[60vh]">
                <div className="prose prose-sm max-w-none text-off-white/80 font-sans">
                  <Streamdown>{lesson.content}</Streamdown>
                </div>

                {/* Key Takeaways */}
                {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
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

                {/* Script / Role Play */}
                {lesson.script && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-serif text-off-white flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" /> Practice Script
                    </h4>
                    <div className="text-xs text-soft-gray font-sans whitespace-pre-wrap">{lesson.script}</div>
                  </div>
                )}

                {lesson.rolePlay && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-serif text-off-white flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-600" /> Role Play Scenario
                    </h4>
                    <div className="text-xs text-soft-gray font-sans whitespace-pre-wrap">{lesson.rolePlay}</div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Button
            variant="outline"
            onClick={() => { setCurrentLessonIndex((prev) => prev - 1); setLessonStartTime(Date.now()); }}
            disabled={currentLessonIndex === 0}
            className="rounded-full font-sans"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
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
                <Badge className="bg-amber-400 text-amber-900 text-sm px-3 py-1">
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
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-serif text-off-white font-medium mb-1">Daily Training Required</h3>
                <p className="text-xs text-soft-gray font-sans mb-3">
                  Complete your daily coaching reviews before accessing leads and making calls.
                  You have <span className="font-bold text-amber-700">{dailyCheckIn.pendingReviews.length}</span> review{dailyCheckIn.pendingReviews.length > 1 ? "s" : ""} to complete today.
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
        <Card className="border border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-sans text-green-700">Daily training complete! You're cleared to work.</span>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Modules / Leaderboard / Daily Training */}
      <Tabs defaultValue="modules">
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
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
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
                    review.priority === "critical" ? "border-red-200 bg-red-50/30" :
                    review.priority === "important" ? "border-amber-500/20 bg-amber-500/10/30" :
                    "border-border/50"
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          review.priority === "critical" ? "bg-red-100" :
                          review.priority === "important" ? "bg-amber-100" :
                          "bg-electric/10"
                        }`}>
                          <Brain className={`w-4 h-4 ${
                            review.priority === "critical" ? "text-red-600" :
                            review.priority === "important" ? "text-amber-400" :
                            "text-soft-gray"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-sans text-off-white font-medium">{review.title}</h4>
                            <Badge variant="outline" className={`text-[10px] ${
                              review.priority === "critical" ? "border-red-300 text-red-600" :
                              review.priority === "important" ? "border-amber-300 text-amber-400" :
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

              // Check if previous module is completed (for recommended path)
              const prevMod = index > 0 ? academyData?.modules[index - 1] : null;
              const prevCompleted = !prevMod || prevMod.progress?.quizPassed;

              return (
                <Card
                  key={mod.id}
                  className={`border transition-all hover:shadow-lg cursor-pointer group ${
                    isPassed ? `${colors.border} ${colors.bg}` : "border-border/50 hover:border-electric/30"
                  }`}
                  onClick={() => openModule(mod.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
                        {isPassed ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-sans text-soft-gray/60 font-medium">MODULE {index + 1}</span>
                          {isPassed && (
                            <Badge className="badge-success text-[10px]">
                              <GraduationCap className="w-3 h-3 mr-0.5" /> Certified
                            </Badge>
                          )}
                          {!prevCompleted && !isStarted && (
                            <Badge variant="outline" className="text-[10px] text-soft-gray/60">
                              <Lock className="w-3 h-3 mr-0.5" /> Recommended after Module {index}
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
                          <div className="mt-2 flex items-center gap-2">
                            <Badge className={colors.badge + " text-[10px]"}>
                              <Star className="w-3 h-3 mr-0.5" /> Quiz Score: {mod.progress.quizScore}%
                            </Badge>
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
                      index === 1 ? "border-gray-200 bg-gray-50/50" :
                      index === 2 ? "border-orange-200 bg-orange-50/50" :
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
                      <Card key={cert.id} className={`border-2 ${isFull ? "border-amber-300 bg-gradient-to-br from-graphite to-yellow-50" : "border-green-200 bg-green-50/50"}`}>
                        <CardContent className="p-5 text-center">
                          <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${isFull ? "bg-amber-100" : "bg-green-100"}`}>
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
  { value: "cold_call", label: "Cold Call", icon: Phone, description: "Practice calling a prospect who doesn't know you", color: "badge-info border-blue-200" },
  { value: "discovery_call", label: "Discovery Call", icon: Search, description: "Uncover pain points and qualify the prospect", color: "badge-success border-green-200" },
  { value: "objection_handling", label: "Objection Handling", icon: Shield, description: "Handle tough pushback and turn objections into opportunities", color: "badge-pending-payment border-amber-500/20" },
  { value: "closing", label: "Closing", icon: Target, description: "Practice closing techniques to seal the deal", color: "badge-danger border-red-200" },
  { value: "follow_up", label: "Follow Up", icon: ArrowRight, description: "Re-engage a prospect who went cold", color: "badge-purple border-purple-200" },
  { value: "upsell", label: "Upsell", icon: TrendingUp, description: "Upgrade an existing client to a higher tier", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { value: "angry_customer", label: "Angry Customer", icon: AlertCircle, description: "De-escalate and retain an unhappy client", color: "badge-pending-payment border-orange-200" },
  { value: "price_negotiation", label: "Price Negotiation", icon: Crown, description: "Defend your pricing and demonstrate value", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
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

        <Card className={`border-2 ${result.score >= 70 ? "border-green-300 bg-green-50/50" : result.score >= 50 ? "border-amber-300 bg-amber-500/10/50" : "border-red-300 bg-red-50/50"}`}>
          <CardContent className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              result.score >= 70 ? "bg-green-100" : result.score >= 50 ? "bg-amber-100" : "bg-red-100"
            }`}>
              <span className={`text-3xl font-serif font-bold ${
                result.score >= 70 ? "text-emerald-400" : result.score >= 50 ? "text-amber-400" : "text-red-600"
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
        <Card className="border-border/50 bg-purple-50/30">
          <CardContent className="p-5">
            <h3 className="text-sm font-serif text-off-white mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-600" /> Key Moment
            </h3>
            <p className="text-sm text-soft-gray font-sans">{result.keyMoment}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <Card className="border-green-200 bg-green-50/30">
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
          <Card className="border-amber-500/20 bg-amber-500/10/30">
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
            className="rounded-full font-sans text-xs border-red-300 text-red-600 hover:bg-red-50"
          >
            {scoreMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
            End & Score Session
          </Button>
        </div>

        {/* Prospect info card */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-lg font-serif text-purple-700">{persona.name?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-sans font-medium text-off-white">{persona.name}</h3>
                <p className="text-xs text-soft-gray font-sans">{persona.company} • {persona.industry} • {persona.companySize} employees</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
                {scenarioType.replace(/_/g, " ")}
              </Badge>
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
              <p className="text-xs text-white/70 font-sans">Practice sales conversations with AI-generated prospects</p>
            </div>
          </div>
          <p className="text-xs text-off-white/50 font-sans mt-3">
            Choose a scenario, and our AI will generate a unique prospect with realistic pain points, personality, and objections.
            Practice your pitch, handle objections, and get scored on your performance.
          </p>
        </CardContent>
        <div className="absolute top-0 right-0 w-32 h-32 bg-charcoal/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      </Card>

      {/* Weekly Challenge Banner */}
      <Card className={`border-2 ${weeklyCompleted ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-500/10'} overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${weeklyCompleted ? 'bg-green-200' : 'bg-amber-200'}`}>
              {weeklyCompleted ? <Trophy className="w-5 h-5 text-green-700" /> : <Target className="w-5 h-5 text-amber-700" />}
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
          return (
            <Card
              key={scenario.value}
              className={`border-border/50 transition-all ${unlocked ? 'hover:shadow-lg cursor-pointer group' : 'opacity-60 cursor-not-allowed'}`}
              onClick={() => unlocked && startMut.mutate({ scenarioType: scenario.value as any })}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${unlocked ? scenario.color : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-sans font-medium text-off-white">{scenario.label}</h4>
                    {unlocked ? (
                      <p className="text-xs text-soft-gray font-sans mt-0.5">{scenario.description}</p>
                    ) : (
                      <p className="text-xs text-red-500/70 font-sans mt-0.5">
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
                    <Lock className="w-4 h-4 text-gray-300" />
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
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-serif text-purple-700">{persona.name?.charAt(0)}</span>
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
