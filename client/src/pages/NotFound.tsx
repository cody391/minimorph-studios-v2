/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * 404 page: Branded, warm, minimal.
 */
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="text-center max-w-md">
        <span className="text-8xl sm:text-9xl font-serif text-forest/10 leading-none block mb-4">
          404
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif text-forest mb-4">
          Page not found
        </h1>
        <p className="text-base text-forest/60 font-sans leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm px-8 py-5 rounded-full shadow-none hover:shadow-md transition-all duration-300 group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
