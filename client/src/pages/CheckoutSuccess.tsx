import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package } from "lucide-react";
import { useLocation } from "wouter";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-forest" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-forest mb-4">
          Payment Successful!
        </h1>
        <p className="text-forest/60 font-sans text-lg leading-relaxed mb-8">
          Thank you for choosing MiniMorph Studios. Your website project is now being set up. 
          Our team will reach out within 24 hours to begin the onboarding process.
        </p>
        <div className="bg-white/80 rounded-2xl p-6 border border-forest/10 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-terracotta" />
            <span className="font-sans font-medium text-forest">What happens next?</span>
          </div>
          <ol className="text-left text-forest/70 font-sans text-sm space-y-2">
            <li className="flex gap-2">
              <span className="font-medium text-forest">1.</span>
              You'll receive a confirmation email with your order details
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-forest">2.</span>
              Our AI system begins analyzing your business and industry
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-forest">3.</span>
              A dedicated account manager will contact you within 24 hours
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-forest">4.</span>
              Your website design process begins with a personalized brief
            </li>
          </ol>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation("/portal")}
            className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full px-6 py-5 group"
          >
            Go to Customer Portal
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-forest/20 text-forest font-sans rounded-full px-6 py-5"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
