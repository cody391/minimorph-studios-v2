/*
 * Design: Premium Dark — MiniMorph Studios
 * Navbar: Near-black with glass blur on scroll, electric accent CTA.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Showroom", href: "#showroom" },
  { label: "Add-Ons", href: "#addons" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Careers", href: "/careers", isRoute: true },
];

type NavLink = { label: string; href: string; isRoute?: boolean };

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setLocation] = useLocation();

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
    <nav aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-midnight/90 backdrop-blur-xl shadow-[0_1px_0_0_oklch(0.30_0.01_260/0.5)]"
          : "bg-transparent"
      }`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-electric focus:text-midnight focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium">Skip to content</a>
      <div className="container flex items-center justify-between h-18 lg:h-20">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center border border-electric/20 transition-all duration-300">
            <span className="text-electric text-sm font-bold font-sans">M</span>
          </div>
          <span className="font-serif text-xl text-off-white tracking-tight">
            MiniMorph Studios
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link: NavLink) => (
            <button
              key={link.href}
              onClick={() =>
                link.isRoute
                  ? (setMobileOpen(false), setLocation(link.href))
                  : scrollTo(link.href)
              }
              className="text-sm font-medium text-off-white/60 hover:text-off-white transition-colors duration-300 font-sans"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="/portal"
            className="text-sm font-medium font-sans text-off-white/70 hover:text-off-white border border-off-white/20 hover:border-off-white/40 px-5 py-2 rounded-full transition-all duration-300"
          >
            Client Portal
          </a>
          <button
            onClick={() => setLocation("/free-audit")}
            className="text-sm font-medium font-sans text-off-white/60 hover:text-off-white transition-colors duration-300"
          >
            Free Audit
          </button>
          <Button
            className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold text-sm px-6 rounded-full shadow-none hover:shadow-lg hover:shadow-electric/20 transition-all duration-300"
            onClick={() => setLocation("/get-started")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2.5 text-off-white min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            className="lg:hidden bg-midnight/95 backdrop-blur-xl border-t border-glass-border overflow-hidden"
          >
            <div className="container py-6 flex flex-col gap-4">
              {navLinks.map((link: NavLink) => (
                <button
                  key={link.href}
                  onClick={() =>
                    link.isRoute
                      ? (setMobileOpen(false), setLocation(link.href))
                      : scrollTo(link.href)
                  }
                  className="text-left text-base font-medium text-off-white/70 hover:text-off-white py-2 font-sans transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-4 border-t border-glass-border flex flex-col gap-3">
                <a
                  href="/portal"
                  className="w-full text-center text-base font-medium font-sans text-off-white/70 hover:text-off-white border border-off-white/20 hover:border-off-white/40 py-2.5 rounded-full transition-all duration-300"
                  onClick={() => setMobileOpen(false)}
                >
                  Client Portal
                </a>
                <button
                  className="w-full text-center text-base font-medium font-sans text-off-white/60 hover:text-off-white py-2 transition-colors"
                  onClick={() => { setMobileOpen(false); setLocation("/free-audit"); }}
                >
                  Get Free Audit
                </button>
                <Button
                  className="bg-electric hover:bg-electric-light text-midnight font-sans font-semibold rounded-full"
                  onClick={() => {
                    setMobileOpen(false);
                    setLocation("/get-started");
                  }}
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
