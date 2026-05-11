import { useRef, useState } from "react";
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
  SkipForward,
  ExternalLink,
  Copy,
} from "lucide-react";

/** Detect mobile/tablet — used to decide redirect vs new tab */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export default function PayoutSetup() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const popupRef = useRef<Window | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const createOnboarding = trpc.reps.createConnectOnboarding.useMutation({
    onSuccess: (data) => {
      if (isMobileDevice()) {
        window.location.href = data.url;
        return;
      }
      const popup = popupRef.current;
      popupRef.current = null;
      if (popup && !popup.closed) {
        popup.location.href = data.url;
        toast.success("Stripe setup opened in a new tab. Complete the setup there.");
      } else {
        // Popup was blocked — surface fallback
        setFallbackUrl(data.url);
        toast.warning("Popup blocked. Use the button below to open Stripe setup.");
      }
    },
    onError: (error) => {
      // Close blank tab so we don't leave an empty window open
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;
      toast.error(error.message || "Failed to create onboarding link. Please try again.");
    },
  });

  const handleConnect = () => {
    setFallbackUrl(null);
    if (!isMobileDevice()) {
      // Open blank tab synchronously inside the click handler so browsers allow it
      const popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;
      popupRef.current = popup;
    }
    createOnboarding.mutate({ returnUrl: window.location.href });
  };

  const { data: connectStatus, isLoading: statusLoading } =
    trpc.reps.connectStatus.useQuery(undefined, { enabled: !!user });

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
            <h2 className="text-xl font-bold text-off-white mb-2">
              Login Required
            </h2>
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
      <div className="bg-charcoal text-off-white py-8 sm:py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-white/50 text-xs font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Application</span>
            </div>
            <div className="w-4 sm:w-6 h-px bg-charcoal/20" />
            <div className="flex items-center gap-1.5 text-white/50 text-xs font-sans">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Paperwork</span>
            </div>
            <div className="w-4 sm:w-6 h-px bg-charcoal/20" />
            <div className="flex items-center gap-1.5 text-white text-xs font-sans font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-electric" />
              <span>Payout Setup</span>
            </div>
            <div className="w-4 sm:w-6 h-px bg-charcoal/20" />
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
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-10">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-[#635BFF]/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 sm:w-8 h-7 sm:h-8 text-[#635BFF]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-off-white mb-2 font-serif">
                Stripe Connect
              </h2>
              <p className="text-sm text-muted-foreground font-sans max-w-sm mx-auto">
                Stripe securely handles your tax information (W-9), identity
                verification, and bank account details. We never see your
                sensitive data.
              </p>
            </div>

            {/* What Stripe collects */}
            <div className="space-y-3 mb-6 sm:mb-8">
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
              onClick={handleConnect}
              disabled={createOnboarding.isPending}
              className="bg-[#635BFF] hover:bg-[#5851DB] text-white font-sans rounded-full w-full py-5 min-h-[52px]"
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

            {/* Popup-blocked fallback — only shown when browser blocks the new tab */}
            {fallbackUrl && (
              <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-3">
                <p className="text-sm text-amber-300 font-sans text-center">
                  Your browser blocked the popup. Use the buttons below to open Stripe setup.
                </p>
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#635BFF] hover:bg-[#5851DB] text-white font-sans text-sm font-semibold rounded-full py-3 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Open Stripe Setup
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-sans text-soft-gray border-border/30 hover:text-off-white"
                  onClick={() => {
                    navigator.clipboard.writeText(fallbackUrl).then(
                      () => toast.success("Setup link copied to clipboard."),
                      () => toast.error("Could not copy — please copy the link manually.")
                    );
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Setup Link
                </Button>
              </div>
            )}

            <p className="text-[10px] text-soft-gray/60 font-sans text-center mt-3">
              Powered by Stripe Connect. Your sensitive information is handled
              securely by Stripe — MiniMorph never sees your bank details or
              SSN.
            </p>

            {/* Skip option — prominent enough to find on mobile */}
            <div className="mt-6 pt-6 border-t border-border/10">
              <p className="text-xs text-amber-400/80 font-sans text-center mb-3">
                Commissions cannot be paid until Stripe Connect setup is complete.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  toast.info(
                    "You can set up payouts later from your dashboard. Heading to the Academy now."
                  );
                  // Use window.location for reliable navigation on mobile
                  window.location.href = "/rep?tab=training";
                }}
                className="w-full rounded-full py-4 min-h-[48px] text-soft-gray hover:text-off-white border-border/30 hover:border-border/60 font-sans text-sm"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip for now — I'll set this up later
              </Button>
              <p className="text-[10px] text-soft-gray/40 font-sans text-center mt-2">
                You can always connect your payout account from Settings in your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
