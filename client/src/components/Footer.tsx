/*
 * Footer — Premium dark, nationwide, no phone number.
 */
import { Mail } from "lucide-react";
import { useLocation } from "wouter";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "About", href: "#services" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Become a Rep", href: "/become-rep", isRoute: true },
      { label: "Privacy Policy", href: "/privacy", isRoute: true },
      { label: "Terms of Service", href: "/terms", isRoute: true },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Website Design", href: "#services" },
      { label: "Showroom", href: "#showroom" },
      { label: "Pricing", href: "#pricing" },
      { label: "Free Audit", href: "/free-audit", isRoute: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Get Started", href: "/get-started", isRoute: true },
      { label: "Client Portal", href: "/portal", isRoute: true },
      { label: "Become a Rep", href: "/become-rep", isRoute: true },
      { label: "Rep Login", href: "/login?next=/rep", isRoute: true },
      { label: "Admin Login", href: "/login?next=/admin", isRoute: true },
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
    <footer aria-label="Site footer" className="bg-charcoal border-t border-glass-border">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-electric/15 flex items-center justify-center border border-electric/20">
                <span className="text-electric text-sm font-bold font-sans">M</span>
              </div>
              <span className="font-serif text-xl text-off-white tracking-tight">MiniMorph Studios</span>
            </div>
            <p className="text-sm font-sans text-off-white/40 leading-relaxed mb-6 max-w-sm">
              We build custom websites for small businesses across the United States — then stick around every month to maintain, improve, and report on them.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-sans text-off-white/40">
                <Mail size={14} className="text-electric/50" />
                <a href="mailto:hello@minimorphstudios.net" className="hover:text-electric transition-colors">
                  hello@minimorphstudios.net
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
        <div className="container py-6 flex flex-col items-center gap-4">
          <p className="text-xs font-sans text-off-white/25">
            &copy; {new Date().getFullYear()} MiniMorph Studios LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/login?next=/rep"
              className="text-xs font-sans text-off-white/20 hover:text-off-white/50 transition-colors"
            >
              Rep Login
            </a>
            <span className="text-xs text-off-white/15">·</span>
            <a
              href="/login?next=/admin"
              className="text-xs font-sans text-off-white/20 hover:text-off-white/50 transition-colors"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
