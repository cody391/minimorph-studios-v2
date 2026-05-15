import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  HeadphonesIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Timeline stages — visible to customer
// ─────────────────────────────────────────────────────────────────────────────
const TIMELINE_STAGES = [
  { key: "payment", label: "Payment" },
  { key: "elena", label: "Elena Intake" },
  { key: "blueprint", label: "Blueprint" },
  { key: "building", label: "Building" },
  { key: "qa", label: "QA Review" },
  { key: "preview", label: "Your Preview" },
  { key: "launch", label: "Launch" },
];

function stageIndex(projectStage: string, genStatus: string): number {
  if (!projectStage || projectStage === "questionnaire") return 1;
  if (projectStage === "blueprint_review" || projectStage === "assets_upload") return 2;
  if (projectStage === "design" || genStatus === "generating") return 3;
  if (projectStage === "pending_admin_review") return 4;
  if (projectStage === "review" || projectStage === "revisions") return 5;
  if (projectStage === "final_approval") return 6;
  if (projectStage === "launch" || projectStage === "complete") return 7;
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-stage action config
// ─────────────────────────────────────────────────────────────────────────────
type ActionTarget = "elena" | "tab";

interface StageAction {
  headline: string;
  subheadline: string;
  buttonLabel: string;
  buttonAction: ActionTarget;
  tab?: string;
}

const STAGE_ACTION: Record<string, StageAction> = {
  questionnaire: {
    headline: "Step 1 — Meet Elena to start your build",
    subheadline:
      "Elena is your AI creative director. She'll ask about your business, services, and goals — takes about 10 minutes. There are no wrong answers.",
    buttonLabel: "Continue with Elena",
    buttonAction: "elena",
  },
  blueprint_review: {
    headline: "Step 2 — Review your Website Blueprint",
    subheadline:
      "Elena has prepared a plan for your website. Review every detail, then approve it to kick off your build.",
    buttonLabel: "Review Your Blueprint",
    buttonAction: "tab",
    tab: "onboarding",
  },
  assets_upload: {
    headline: "Optional — Upload your photos and logo",
    subheadline:
      "Upload any brand photos, your logo, or business images to use in your website. You can skip this and use stock imagery if preferred.",
    buttonLabel: "Go to Your Onboarding",
    buttonAction: "tab",
    tab: "onboarding",
  },
  design: {
    headline: "Your website draft is being built",
    subheadline:
      "Elena is crafting your custom website. This usually takes 2–5 minutes. You don't need to do anything right now — we'll update this page as it progresses.",
    buttonLabel: "Check Build Status",
    buttonAction: "tab",
    tab: "onboarding",
  },
  generating: {
    headline: "Your website draft is being built",
    subheadline:
      "Elena is crafting your custom website. This usually takes 2–5 minutes. You don't need to do anything right now.",
    buttonLabel: "Check Build Status",
    buttonAction: "tab",
    tab: "onboarding",
  },
  pending_admin_review: {
    headline: "The MiniMorph team is reviewing your draft",
    subheadline:
      "Your website has been built. Our team is checking every page for quality before you see it. This usually takes a few hours — we'll email you when it's ready.",
    buttonLabel: "View Build Status",
    buttonAction: "tab",
    tab: "onboarding",
  },
  review: {
    headline: "Your website preview is ready to review",
    subheadline:
      "Your draft is ready. Browse every page, then approve it or request changes. You can ask Elena questions directly inside the preview.",
    buttonLabel: "View Your Website Draft",
    buttonAction: "tab",
    tab: "onboarding",
  },
  revisions: {
    headline: "Your revision is in progress",
    subheadline:
      "We received your change request. Our team is working on the update — we'll email you when it's ready for another look.",
    buttonLabel: "View Current Draft",
    buttonAction: "tab",
    tab: "onboarding",
  },
  final_approval: {
    headline: "Approved — your site is going live",
    subheadline:
      "You approved your website. We're handling the final launch steps and will email you the moment it's live.",
    buttonLabel: "View Launch Status",
    buttonAction: "tab",
    tab: "onboarding",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Package feature lists — only list features the app actually delivers
// ─────────────────────────────────────────────────────────────────────────────
const PACKAGE_FEATURES: Record<string, string[]> = {
  starter: [
    "Elena-guided business intake",
    "Custom Website Blueprint",
    "AI-built website (5–7 pages)",
    "MiniMorph quality review",
    "Contact form — leads sent to your email",
    "3 rounds of revision support",
    "Launch support",
    "Ongoing support during your plan",
  ],
  growth: [
    "Elena-guided business intake",
    "Custom Website Blueprint",
    "AI-built website (7–9 pages)",
    "MiniMorph quality review",
    "Contact form — leads sent to your email",
    "5 rounds of revision support",
    "Priority launch support",
    "Monthly performance check-ins",
    "Ongoing support during your plan",
  ],
  premium: [
    "Elena-guided business intake",
    "Custom Website Blueprint",
    "AI-built multi-page website",
    "MiniMorph quality review",
    "Contact form — leads sent to your email",
    "Unlimited revision support",
    "White-glove launch support",
    "Monthly competitive analysis",
    "Priority ongoing support",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Help shortcuts wired to tabs
// ─────────────────────────────────────────────────────────────────────────────
const HELP_ITEMS = [
  { q: "What happens next?", tab: "onboarding" },
  { q: "I want to change something", tab: "onboarding" },
  { q: "I have a billing question", tab: "billing" },
  { q: "I want to talk to someone", tab: "support" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
interface BuildCommandCenterProps {
  project: any;
  customer: any;
  contract: any;
  onNavigateToOnboarding: () => void;
  onTabChange: (tab: string) => void;
}

export function BuildCommandCenter({
  project,
  customer,
  contract,
  onNavigateToOnboarding,
  onTabChange,
}: BuildCommandCenterProps) {
  const stage: string = project?.stage ?? "questionnaire";
  const genStatus: string = project?.generationStatus ?? "";
  const isComplete = stage === "complete" || stage === "launch";

  // Don't render after launch — Overview/Reports/Support take over
  if (isComplete) return null;

  const effectiveStage = genStatus === "generating" ? "generating" : stage;
  const action: StageAction = STAGE_ACTION[effectiveStage] ?? STAGE_ACTION.questionnaire;
  const idx = stageIndex(stage, genStatus);
  const progressPct = Math.round((idx / TIMELINE_STAGES.length) * 100);

  const packageTier: string = contract?.packageTier ?? customer?.packageTier ?? "starter";
  const packageLabel =
    { starter: "Starter", growth: "Growth", premium: "Premium" }[packageTier] ?? "Starter";
  const features = PACKAGE_FEATURES[packageTier] ?? PACKAGE_FEATURES.starter;

  const handlePrimary = () => {
    if (action.buttonAction === "elena") {
      onNavigateToOnboarding();
    } else {
      onTabChange(action.tab ?? "onboarding");
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* ── Stage card ── */}
      <Card className="border-electric/30 bg-gradient-to-br from-electric/5 to-transparent">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  E
                </div>
                <span className="text-xs text-soft-gray/70 font-sans uppercase tracking-wider">
                  MiniMorph Website Build
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-serif text-off-white mb-1">
                {action.headline}
              </h2>
              <p className="text-sm text-soft-gray font-sans leading-relaxed">
                {action.subheadline}
              </p>
            </div>
            <Button
              onClick={handlePrimary}
              className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-5 min-h-[44px] shrink-0 gap-2"
            >
              {action.buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-soft-gray/50 font-sans uppercase tracking-wider">
                Build Progress
              </span>
              <span className="text-[10px] text-electric font-sans font-medium">
                {progressPct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-midnight-dark/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-electric rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto -mx-1 pb-1">
            <div className="flex items-start min-w-max px-1">
              {TIMELINE_STAGES.map((s, i) => {
                const done = i < idx;
                const current = i === idx - 1;
                const last = i === TIMELINE_STAGES.length - 1;
                return (
                  <div key={s.key} className="flex items-center">
                    <div className="flex flex-col items-center w-16 sm:w-20">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          done
                            ? "bg-electric border-electric"
                            : current
                            ? "bg-electric/20 border-electric"
                            : "bg-transparent border-border/40"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-midnight" />
                        ) : current ? (
                          <div className="w-2 h-2 rounded-full bg-electric animate-pulse" />
                        ) : (
                          <Circle className="w-3 h-3 text-border/40" />
                        )}
                      </div>
                      <span
                        className={`text-[9px] mt-1 text-center leading-tight font-sans ${
                          current
                            ? "text-electric font-medium"
                            : done
                            ? "text-soft-gray"
                            : "text-soft-gray/40"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {!last && (
                      <div
                        className={`w-6 sm:w-10 h-0.5 mb-4 mx-0.5 shrink-0 transition-all ${
                          i < idx - 1 ? "bg-electric" : "bg-border/30"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Two-column: What You Purchased + Need Help ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* What You Purchased */}
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-serif text-off-white mb-3 flex items-center gap-2">
              <span className="text-electric text-base">✓</span>
              {packageLabel} Website Package
            </h3>
            <p className="text-xs text-soft-gray font-sans mb-3">
              Here's what's included in your build:
            </p>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-soft-gray font-sans">
                  <CheckCircle2 className="h-3.5 w-3.5 text-electric/60 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-soft-gray/40 font-sans mt-4 pt-3 border-t border-border/20">
              Questions about your plan? Use the Billing tab or contact us.
            </p>
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-5">
            <h3 className="text-sm font-serif text-off-white mb-3 flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4 text-electric" />
              Need Help?
            </h3>
            <p className="text-xs text-soft-gray font-sans mb-3">
              Select a question below or reach out directly.
            </p>
            <div className="space-y-1">
              {HELP_ITEMS.map(({ q, tab }) => (
                <button
                  key={q}
                  onClick={() => onTabChange(tab)}
                  className="w-full text-left text-xs text-soft-gray hover:text-electric transition-colors py-2 border-b border-border/20 last:border-0 flex items-center justify-between gap-2"
                >
                  <span>{q}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-40" />
                </button>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/20 space-y-1">
              <p className="text-[10px] text-soft-gray/50 font-sans">
                Email:{" "}
                <a
                  href="mailto:hello@minimorphstudios.net"
                  className="text-electric/70 hover:text-electric underline underline-offset-2"
                >
                  hello@minimorphstudios.net
                </a>
              </p>
              <p className="text-[10px] text-soft-gray/40 font-sans">
                We typically respond within one business day.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
