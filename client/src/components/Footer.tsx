/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Footer: Clean, warm, minimal. Forest green background.
 */
import { useLocation } from "wouter";

const footerLinks = {
  Services: [
    { label: "Website Design", href: "#services" },
    { label: "AI Support", href: "#services" },
    { label: "Analytics Reports", href: "#services" },
    { label: "Growth & Upgrades", href: "#services" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Careers", href: "/careers", route: true },
    { label: "Contact", href: "#contact" },
  ],
  Portals: [
    { label: "Get Started", href: "/get-started", route: true },
    { label: "Rep Dashboard", href: "/rep", route: true },
    { label: "Customer Portal", href: "/portal", route: true },
    { label: "Admin", href: "/admin", route: true },
  ],
};

export default function Footer() {
  const [, setLocation] = useLocation();

  const handleClick = (link: { href: string; route?: boolean }) => {
    if (link.route) {
      setLocation(link.href);
      return;
    }
    if (link.href === "#") return;
    const el = document.querySelector(link.href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-forest text-cream/70 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center">
                <span className="text-cream text-sm font-bold font-sans">M</span>
              </div>
              <span className="font-serif text-xl text-cream tracking-tight">
                MiniMorph
              </span>
            </div>
            <p className="text-sm font-sans text-cream/50 leading-relaxed max-w-sm mb-6">
              AI-powered websites that grow your business. Premium design, intelligent automation, and ongoing support — all in one connected system.
            </p>
            <p className="text-xs font-sans text-cream/30">
              Austin, Texas
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-sans font-semibold text-cream mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleClick(link)}
                      className="text-sm font-sans text-cream/50 hover:text-cream transition-colors duration-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-cream/30">
            &copy; {new Date().getFullYear()} MiniMorph Studios. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-xs font-sans text-cream/30 hover:text-cream/60 transition-colors">
              Privacy Policy
            </button>
            <button className="text-xs font-sans text-cream/30 hover:text-cream/60 transition-colors">
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
