import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4 py-12">
      <div className="text-center max-w-lg w-full">
        <div className="w-20 h-20 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-electric" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif text-off-white mb-3">
          Payment Received
        </h1>
        <p className="text-soft-gray font-sans text-base leading-relaxed mb-8">
          You're officially a MiniMorph customer. Your website build starts now.
        </p>

        {/* What Happens Next */}
        <div className="bg-graphite/80 rounded-2xl p-6 border border-electric/10 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-electric flex-shrink-0" />
            <span className="font-sans font-medium text-off-white">What happens next</span>
          </div>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                text: "Your Customer Portal is being activated — this takes about 30 seconds.",
              },
              {
                step: "2",
                text: "We'll email you your portal login details. Check your inbox (and spam folder just in case).",
              },
              {
                step: "3",
                text: "Log into your portal and meet Elena — your AI creative director. She'll guide you through building your website in about 10 minutes.",
              },
              {
                step: "4",
                text: "Elena prepares a Website Blueprint for your review. You approve it, your website is built, and our team checks it before you see it.",
              },
            ].map(({ step, text }) => (
              <li key={step} className="flex gap-3">
                <span className="font-medium text-electric font-sans text-sm shrink-0 w-5 mt-0.5">{step}.</span>
                <span className="text-soft-gray font-sans text-sm">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Email fallback */}
        <div className="bg-midnight-dark/40 rounded-xl p-4 border border-border/30 mb-8 flex items-start gap-3 text-left">
          <Mail className="w-4 h-4 text-soft-gray/60 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-soft-gray font-sans">
              <strong className="text-off-white">Didn't receive a login email?</strong>{" "}
              Check your spam folder first. Still nothing after 5 minutes? Email us at{" "}
              <a
                href="mailto:hello@minimorphstudios.net"
                className="text-electric underline underline-offset-2"
              >
                hello@minimorphstudios.net
              </a>{" "}
              — we'll get you sorted right away.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation("/portal")}
            className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-6 py-5 group"
          >
            Go to Customer Portal
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-electric/20 text-off-white font-sans rounded-full px-6 py-5"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
