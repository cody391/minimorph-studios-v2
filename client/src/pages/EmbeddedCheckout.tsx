import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

export default function EmbeddedCheckout() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  // Get the client secret from URL params
  const params = new URLSearchParams(window.location.search);
  const clientSecret = params.get("cs");
  const returnPath = params.get("return") || "/";

  const fetchClientSecret = useCallback(() => {
    if (!clientSecret) {
      setError("Missing checkout session. Please try again.");
      return Promise.resolve("");
    }
    return Promise.resolve(clientSecret);
  }, [clientSecret]);

  if (error || !clientSecret) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-serif text-off-white mb-3">
            Checkout Error
          </h1>
          <p className="text-soft-gray font-sans mb-6">
            {error || "Invalid checkout session. Please go back and try again."}
          </p>
          <Button
            onClick={() => setLocation(returnPath)}
            className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <div className="border-b border-white/5 bg-midnight/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation(returnPath)}
            className="flex items-center gap-2 text-soft-gray hover:text-off-white transition-colors font-sans text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-soft-gray font-sans text-sm">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* Embedded Checkout */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-xl overflow-hidden border border-white/5 bg-deep-navy">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <StripeEmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-soft-gray/50 font-sans text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>PCI Compliant</span>
          </div>
          <span>Powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}
