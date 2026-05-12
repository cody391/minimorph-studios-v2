import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-off-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-off-white mb-4">
          Payment Successful!
        </h1>
        <p className="text-soft-gray font-sans text-lg leading-relaxed mb-8">
          Thank you for choosing MiniMorph Studios. Your website project is now being set up.
          Check your inbox — we've sent your portal login credentials and a welcome guide.
        </p>
        <div className="bg-graphite/80 rounded-2xl p-6 border border-electric/10 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-electric" />
            <span className="font-sans font-medium text-off-white">What happens next?</span>
          </div>
          <ol className="text-left text-soft-gray font-sans text-sm space-y-2">
            <li className="flex gap-2">
              <span className="font-medium text-off-white">1.</span>
              Check your email for your portal login details and welcome guide
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-off-white">2.</span>
              Our AI system begins analyzing your business and industry
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-off-white">3.</span>
              Complete your onboarding questionnaire in the Customer Portal to kick off your site
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-off-white">4.</span>
              Our AI build system reviews your answers and prepares your custom website
            </li>
          </ol>
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
