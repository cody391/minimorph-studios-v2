/*
 * Footer — Premium dark, Muskegon MI, no phone number.
 */
import { MapPin, Mail } from "lucide-react";
import { useLocation } from "wouter";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#services" },
      { label: "Careers", href: "/careers", isRoute: true },
      { label: "Privacy Policy", href: "/privacy", isRoute: true },
      { label: "Terms of Service", href: "/terms", isRoute: true },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Website Design", href: "#services" },
      { label: "Monthly Support", href: "#how-it-works" },
      { label: "Demo Builds", href: "#demo-builds" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Customer Portal", href: "/portal/dashboard", isRoute: true },
    ],
  },
];

export default function Footer() {
  const [, setLocation] = useLocation();

  const handleClick = (href: string, isRoute?: boolean) => {
    if (isRoute) {
      setLocation(href);
    } else {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-charcoal border-t border-glass-border">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center border border-electric/20">
                <span className="text-electric text-sm font-bold font-sans">M</span>
              </div>
              <span className="font-serif text-xl text-off-white tracking-tight">MiniMorph</span>
            </div>
            <p className="text-sm font-sans text-off-white/40 leading-relaxed mb-6 max-w-sm">
              MiniMorph Studios builds, launches, maintains, and improves small-business websites with monthly support, customer portals, reports, and AI-assisted recommendations.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-sans text-off-white/40">
                <MapPin size={14} className="text-electric/50" />
                <span>Muskegon, Michigan</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-sans text-off-white/40">
                <Mail size={14} className="text-electric/50" />
                <a href="mailto:hello@minimorphstudios.com" className="hover:text-electric transition-colors">
                  hello@minimorphstudios.com
                </a>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-sans font-semibold text-off-white/70 uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleClick(link.href, link.isRoute)}
                      className="text-sm font-sans text-off-white/40 hover:text-off-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-glass-border">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-off-white/25">
            &copy; {new Date().getFullYear()} MiniMorph Studios LLC. All rights reserved.
          </p>
          <p className="text-xs font-sans text-off-white/25">
            Based in Muskegon, Michigan. Serving businesses across the United States.
          </p>
        </div>
      </div>
    </footer>
  );
}
