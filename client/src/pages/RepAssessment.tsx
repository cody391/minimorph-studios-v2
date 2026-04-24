import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Shield,
  Target,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type Question = {
  id: string;
  gate: number;
  category: string;
  scenario: string;
  freeText: boolean;
  options: { id: string; text: string }[];
};

export default function RepAssessment() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading } =
    trpc.assessment.getQuestions.useQuery(undefined, {
      enabled: !!user,
    });

  // Check for existing result
  const { data: existingResult, isLoading: resultLoading } =
    trpc.assessment.getMyResult.useQuery(undefined, {
      enabled: !!user,
    });

  // Submit mutation
  const submitMutation = trpc.assessment.submit.useMutation({
    onSuccess: () => {
      setShowResults(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit assessment");
    },
  });

  // Combine all questions in order
  const allQuestions = useMemo(() => {
    if (!questionsData) return [];
    return [...questionsData.gate1, ...questionsData.gate2] as Question[];
  }, [questionsData]);

  const currentQuestion = allQuestions[currentIndex];
  const totalQuestions = allQuestions.length;
  const gate1Count = questionsData?.gate1.length || 0;

  const isGate1 = currentIndex < gate1Count;
  const currentGateLabel = isGate1
    ? "Part 1: Situational Judgment"
    : "Part 2: Sales Aptitude";
  const currentGateIcon = isGate1 ? (
    <Shield className="w-5 h-5" />
  ) : (
    <Target className="w-5 h-5" />
  );

  const handleAnswer = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    },
    [currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    // Validate all MC questions answered
    const mcQuestions = allQuestions.filter((q) => !q.freeText);
    const unanswered = mcQuestions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions. ${unanswered.length} remaining.`
      );
      // Navigate to first unanswered
      const firstIdx = allQuestions.findIndex(
        (q) => q.id === unanswered[0].id
      );
      if (firstIdx >= 0) setCurrentIndex(firstIdx);
      return;
    }
    submitMutation.mutate({ answers, freeTextAnswer });
  }, [allQuestions, answers, freeTextAnswer, submitMutation]);

  // Count answered questions
  const answeredCount = useMemo(() => {
    return allQuestions.filter(
      (q) => q.freeText ? freeTextAnswer.trim().length > 0 : !!answers[q.id]
    ).length;
  }, [allQuestions, answers, freeTextAnswer]);

  // Loading states
  if (authLoading || questionsLoading || resultLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-forest mx-auto mb-4" />
            <h2 className="text-xl font-bold text-forest mb-2">
              Assessment Required
            </h2>
            <p className="text-muted-foreground mb-4">
              Please create your account first before taking the assessment.
            </p>
            <Button onClick={() => navigate("/become-rep")} className="bg-forest hover:bg-forest-light text-white">
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already completed — show results
  if (existingResult || showResults) {
    const result = submitMutation.data || existingResult;
    if (!result) return null;

    const adminOverride = "adminOverride" in result ? (result as any).adminOverride : null;
    const isPassed =
      result.status === "passed" ||
      adminOverride === "approved";
    const isBorderline =
      result.status === "borderline" && !adminOverride;
    const isFailed =
      result.status === "failed" ||
      adminOverride === "rejected";

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center">
            {isPassed && (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-forest mb-2 font-serif">
                  You Passed!
                </h2>
                <p className="text-muted-foreground mb-6">
                  You've demonstrated the character and sales instincts we're
                  looking for at MiniMorph Studios. Let's continue with your
                  application.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Character
                    </div>
                    <div className="text-xl font-bold text-green-700">
                      {typeof result.gate1Score === "number"
                        ? result.gate1Score.toFixed(0)
                        : result.gate1Score}
                      %
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Sales Aptitude
                    </div>
                    <div className="text-xl font-bold text-green-700">
                      {typeof result.gate2Score === "number"
                        ? result.gate2Score.toFixed(0)
                        : result.gate2Score}
                      %
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/become-rep?step=2")}
                  className="bg-forest hover:bg-forest-light text-white w-full"
                  size="lg"
                >
                  Continue Application
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {isBorderline && (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-amber-800 mb-2 font-serif">
                  Under Review
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your assessment is being reviewed by our team. We see
                  potential and want to take a closer look. We'll reach out
                  within 24-48 hours with a decision.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Character
                    </div>
                    <div className="text-xl font-bold text-amber-700">
                      {typeof result.gate1Score === "number"
                        ? result.gate1Score.toFixed(0)
                        : result.gate1Score}
                      %
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Sales Aptitude
                    </div>
                    <div className="text-xl font-bold text-amber-700">
                      {typeof result.gate2Score === "number"
                        ? result.gate2Score.toFixed(0)
                        : result.gate2Score}
                      %
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  Return Home
                </Button>
              </>
            )}

            {isFailed && (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2 font-serif">
                  Not the Right Fit — Yet
                </h2>
                <p className="text-muted-foreground mb-6">
                  Based on your responses, we don't think this is the right
                  time for you to join MiniMorph as a rep. This doesn't mean
                  never — gain more experience in sales and customer service,
                  and try again in the future.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Character
                    </div>
                    <div className="text-xl font-bold text-red-700">
                      {typeof result.gate1Score === "number"
                        ? result.gate1Score.toFixed(0)
                        : result.gate1Score}
                      %
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Sales Aptitude
                    </div>
                    <div className="text-xl font-bold text-red-700">
                      {typeof result.gate2Score === "number"
                        ? result.gate2Score.toFixed(0)
                        : result.gate2Score}
                      %
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  Return Home
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment UI
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-white py-6">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold font-serif">
            MiniMorph Rep Assessment
          </h1>
          <p className="text-white/80 mt-1">
            We're looking for people with strong character and natural sales
            instincts. Answer honestly — there are no trick questions.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-forest">
              {currentGateIcon}
              {currentGateLabel}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Question {currentIndex + 1} of {totalQuestions}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-forest h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {answeredCount} of {totalQuestions} answered
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Gate transition indicator */}
        {currentIndex === gate1Count && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 font-medium">
              <Target className="w-5 h-5" />
              Part 2: Sales Aptitude
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Now we'll assess your natural sales instincts. These scenarios
              test how you'd handle real sales situations.
            </p>
          </div>
        )}

        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-0.5 bg-forest/10 text-forest rounded-full text-xs font-medium">
                  {currentQuestion.category}
                </span>
                {isGate1 ? (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Character
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Sales
                  </span>
                )}
              </div>
              <CardTitle className="text-lg leading-relaxed text-foreground whitespace-pre-line">
                {currentQuestion.scenario}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion.freeText ? (
                <div className="space-y-3">
                  <Textarea
                    value={freeTextAnswer}
                    onChange={(e) => setFreeTextAnswer(e.target.value)}
                    placeholder="Write your pitch here... (2-3 sentences)"
                    className="min-h-[120px] text-base"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {freeTextAnswer.length}/500 characters
                  </div>
                </div>
              ) : (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-forest/50 ${
                        answers[currentQuestion.id] === option.id
                          ? "border-forest bg-forest/5"
                          : "border-gray-200 bg-white"
                      }`}
                      onClick={() => handleAnswer(option.id)}
                    >
                      <RadioGroupItem
                        value={option.id}
                        id={option.id}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={option.id}
                        className="text-base leading-relaxed cursor-pointer flex-1"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-forest hover:bg-forest-light text-white gap-2"
              disabled={
                !currentQuestion?.freeText && !answers[currentQuestion?.id || ""]
              }
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-terracotta hover:bg-terracotta-light text-white gap-2"
              disabled={submitMutation.isPending}
              size="lg"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scoring...
                </>
              ) : (
                <>
                  Submit Assessment
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question dots navigation */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {allQuestions.map((q, idx) => {
            const isAnswered = q.freeText
              ? freeTextAnswer.trim().length > 0
              : !!answers[q.id];
            const isCurrent = idx === currentIndex;
            const isG1 = idx < gate1Count;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                    : isAnswered
                      ? isG1
                        ? "bg-purple-200 text-purple-800"
                        : "bg-blue-200 text-blue-800"
                      : "bg-gray-200 text-gray-500"
                }`}
                title={`${q.category} (${isG1 ? "Character" : "Sales"})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
