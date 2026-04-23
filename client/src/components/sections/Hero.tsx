/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Hero: Large serif headline, warm abstract background, editorial feel.
 * Asymmetric layout with text left, abstract art right.
 */
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663588302560/i4ip8JQRqo7cEvPbPwFp5A/hero-abstract-gKLaKnCcj8qXeREqMTaxCB.webp";

export default function Hero() {
  const [, setLocation] = useLocation();
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-cream">
      {/* Background abstract image — positioned right */}
      <div className="absolute inset-0 lg:left-1/3">
        <img
          src={HERO_IMG}
          alt=""
          className="w-full h-full object-cover opacity-30 lg:opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-transparent" />
      </div>

      <div className="container relative z-10 pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest/8 text-forest text-sm font-sans font-medium mb-8">
              <Sparkles size={14} className="text-terracotta" />
              AI-Powered Web Design
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-forest leading-[1.1] tracking-tight mb-6"
          >
            Websites that{" "}
            <span className="italic text-terracotta">grow</span>
            <br />
            with your business
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg lg:text-xl text-forest/70 font-sans leading-relaxed mb-10 max-w-lg"
          >
            Premium design, intelligent automation, and ongoing support — all working together so you can focus on what matters most.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-base px-8 py-6 rounded-full shadow-none hover:shadow-lg transition-all duration-300 group"
              onClick={() => setLocation("/get-started")}
            >
              See Our Plans
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-forest/20 text-forest hover:bg-forest/5 font-sans text-base px-8 py-6 rounded-full transition-all duration-300"
              onClick={() => scrollTo("#portfolio")}
            >
              View Our Work
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-14 flex items-center gap-8 text-sm text-forest/50 font-sans"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-cream bg-sage-light flex items-center justify-center text-xs font-bold text-forest/60"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>200+ businesses served</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-terracotta fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span>4.9/5 client rating</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
