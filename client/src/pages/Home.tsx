/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Home: Single-page layout assembling all sections in narrative order.
 * Flow: Hero → Stats → Services → Portfolio → How It Works → Core Principle → Pricing → Testimonials → FAQ → Contact → Footer
 */
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Services from "@/components/sections/Services";
import Portfolio from "@/components/sections/Portfolio";
import HowItWorks from "@/components/sections/HowItWorks";
import CorePrinciple from "@/components/sections/CorePrinciple";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <Portfolio />
      <HowItWorks />
      <CorePrinciple />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
