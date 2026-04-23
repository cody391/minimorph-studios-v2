/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Navbar: Clean, warm, minimal. Forest green logo, cream background, terracotta CTA.
 * Sticky with subtle backdrop blur on scroll.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-cream/90 backdrop-blur-md shadow-[0_1px_0_0_oklch(0.88_0.02_85)]"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-18 lg:h-20">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
            <span className="text-cream text-sm font-bold font-sans">M</span>
          </div>
          <span className="font-serif text-xl text-forest tracking-tight">
            MiniMorph
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-forest/70 hover:text-forest transition-colors duration-300 font-sans"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-forest/70 hover:text-forest hover:bg-forest/5 font-sans text-sm"
            onClick={() => scrollTo("#contact")}
          >
            Contact
          </Button>
          <Button
            className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm px-6 rounded-full shadow-none hover:shadow-md transition-all duration-300"
            onClick={() => scrollTo("#pricing")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-forest"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-cream/95 backdrop-blur-md border-t border-border overflow-hidden"
          >
            <div className="container py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-left text-base font-medium text-forest/80 hover:text-forest py-2 font-sans transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <Button
                  variant="ghost"
                  className="justify-start text-forest/70 hover:text-forest font-sans"
                  onClick={() => scrollTo("#contact")}
                >
                  Contact
                </Button>
                <Button
                  className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full"
                  onClick={() => scrollTo("#pricing")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
