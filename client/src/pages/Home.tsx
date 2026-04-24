/*
 * Design: Premium Dark — MiniMorph Studios
 * Home: Single-page layout assembling all sections in narrative order.
 * Flow: Hero → Trust Strip → Pain + Solution → Demo Builds → How It Works →
 *       What Happens After → Competitor Discovery → What's Included → Integrations →
 *       Pricing → Testimonials → FAQ → Final CTA → Footer
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
    <div className="min-h-screen bg-midnight">
      <Navbar />
      <Hero />
      <Stats />
      {/* Services = Pain + Solution pillars */}
      <Services />
      {/* Portfolio = Demo Builds */}
      <Portfolio />
      {/* HowItWorks = How It Works + What Happens After + Competitor Discovery */}
      <HowItWorks />
      {/* CorePrinciple = What's Included + Integrations/Add-ons */}
      <CorePrinciple />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
