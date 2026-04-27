/**
 * OnboardingProgress — Full pipeline progress bar shown across all onboarding pages.
 * Shows where the rep is in the overall journey from Values Gate to Academy.
 */
import { CheckCircle, Circle } from "lucide-react";

const ONBOARDING_STEPS = [
  { id: 1, label: "Values" },
  { id: 2, label: "Account" },
  { id: 3, label: "Verify" },
  { id: 4, label: "Assessment" },
  { id: 5, label: "Application" },
  { id: 6, label: "Paperwork" },
  { id: 7, label: "Payout" },
  { id: 8, label: "Academy" },
];

interface OnboardingProgressProps {
  currentStep: number; // 1-8
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                  currentStep > step.id
                    ? "bg-charcoal text-off-white"
                    : currentStep === step.id
                    ? "bg-electric text-white ring-2 ring-electric/30 ring-offset-1"
                    : "bg-graphite/20 text-soft-gray/60"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-sans whitespace-nowrap ${
                  currentStep >= step.id ? "text-off-white font-medium" : "text-soft-gray/60"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors mt-[-14px] ${
                  currentStep > step.id ? "bg-electric" : "bg-graphite/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
