import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import {
  Shield,
  CheckCircle,
  ArrowRight,
  CreditCard,
  Lock,
  Loader2,
  DollarSign,
  Zap,
} from "lucide-react";

export default function PayoutSetup() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: connectStatus, isLoading: statusLoading } =
    trpc.reps.connectStatus.useQuery(undefined, { enabled: !!user });

  const createOnboarding = trpc.reps.createConnectOnboarding.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Stripe Connect opened in a new tab. Complete the setup there.");
    },
    onError: () =>
      toast.error("Failed to create onboarding link. Please try again."),
  });

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-off-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 text-electric mx-auto mb-4" />
            <h2 className="text-xl font-bold text-off-white mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to continue setup.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-electric hover:bg-electric-light text-white"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already connected — send them to the Academy
  if (connectStatus?.onboarded) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-border/50 shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-off-white mb-2 font-serif">
              Payout Account Connected!
            </h2>
            <p className="text-muted-foreground mb-6">
              You're all set to receive commissions. Time to head to the Sales
              Academy and learn everything you need to start earning.
            </p>
            <Button
              onClick={() => navigate("/rep?tab=training")}
              className="bg-electric hover:bg-electric-light text-white w-full rounded-full py-5"
              size="lg"
            >
              Go to Sales Academy <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected — show Stripe Connect onboarding
  return (
    <div className="min-h-screen bg-midnight">
      <OnboardingProgress currentStep={7} />
      {/* Header */}
      <div className="bg-charcoal text-off-white py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-white/50 text-xs font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Application</span>
            </div>
            <div className="w-6 h-px bg-charcoal/20" />
            <div className="flex items-center gap-1.5 text-white/50 text-xs font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Paperwork</span>
            </div>
            <div className="w-6 h-px bg-charcoal/20" />
            <div className="flex items-center gap-1.5 text-white text-xs font-sans font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-electric" />
              <span>Payout Setup</span>
            </div>
            <div className="w-6 h-px bg-charcoal/20" />
            <div className="flex items-center gap-1.5 text-white/30 text-xs font-sans">
              <Zap className="w-3.5 h-3.5" />
              <span>Academy</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif mb-2">
            Set Up Your Payout Account
          </h1>
          <p className="text-white/80 font-sans text-sm max-w-lg mx-auto">
            Connect your bank account through Stripe so you can receive
            commission payouts. This is secure, fast, and only takes a few
            minutes.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-10">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#635BFF]/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-[#635BFF]" />
              </div>
              <h2 className="text-xl font-bold text-off-white mb-2 font-serif">
                Stripe Connect
              </h2>
              <p className="text-sm text-muted-foreground font-sans max-w-sm mx-auto">
                Stripe securely handles your tax information (W-9), identity
                verification, and bank account details. We never see your
                sensitive data.
              </p>
            </div>

            {/* What Stripe collects */}
            <div className="space-y-3 mb-8">
              {[
                {
                  icon: Shield,
                  label: "Identity Verification",
                  desc: "Confirm your identity with a government ID",
                },
                {
                  icon: DollarSign,
                  label: "Tax Information (W-9)",
                  desc: "Required for 1099 reporting",
                },
                {
                  icon: CreditCard,
                  label: "Bank Account",
                  desc: "Where your commission payouts will be deposited",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3 rounded-lg bg-midnight-dark/30"
                >
                  <item.icon className="w-5 h-5 text-electric shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-off-white font-sans">
                      {item.label}
                    </p>
                    <p className="text-xs text-soft-gray font-sans">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() =>
                createOnboarding.mutate({
                  returnUrl: window.location.href,
                })
              }
              disabled={createOnboarding.isPending}
              className="bg-[#635BFF] hover:bg-[#5851DB] text-white font-sans rounded-full w-full py-5"
              size="lg"
            >
              {createOnboarding.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Setting up...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Connect with Stripe
                </span>
              )}
            </Button>

            <p className="text-[10px] text-soft-gray/60 font-sans text-center mt-3">
              Powered by Stripe Connect. Your sensitive information is handled
              securely by Stripe — MiniMorph never sees your bank details or
              SSN.
            </p>

            {/* Skip option — they can do it later but will be reminded */}
            <div className="mt-6 pt-6 border-t border-border/10 text-center">
              <button
                onClick={() => {
                  toast.info(
                    "You can set up payouts later from your dashboard. Heading to the Academy now."
                  );
                  navigate("/rep?tab=training");
                }}
                className="text-xs text-soft-gray/60 hover:text-soft-gray font-sans underline transition-colors"
              >
                Skip for now — I'll set this up later
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
