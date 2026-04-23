/*
 * Design: Warm Machine — Humanized AI Aesthetic
 * Contact/CTA: Final conversion section with form and warm messaging.
 */
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    business: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! A representative will be in touch within 24 hours.");
    setFormData({ name: "", email: "", business: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-cream">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 max-w-6xl mx-auto">
          {/* Left: Message */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-sm font-sans font-medium text-terracotta uppercase tracking-widest mb-4 block">
              Let's Talk
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-forest leading-tight mb-6">
              Ready to grow
              <br />
              <span className="italic">your business?</span>
            </h2>
            <p className="text-lg text-forest/60 font-sans leading-relaxed mb-10">
              Tell us about your business and what you're looking for. A dedicated representative will reach out within 24 hours to discuss how MiniMorph can help.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-forest/8 flex items-center justify-center">
                  <Mail size={18} className="text-forest" />
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-forest">
                    Email Us
                  </p>
                  <p className="text-sm font-sans text-forest/50">
                    hello@minimorphstudios.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-forest/8 flex items-center justify-center">
                  <Phone size={18} className="text-forest" />
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-forest">
                    Call Us
                  </p>
                  <p className="text-sm font-sans text-forest/50">
                    (555) 123-4567
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-forest/8 flex items-center justify-center">
                  <MapPin size={18} className="text-forest" />
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-forest">
                    Based In
                  </p>
                  <p className="text-sm font-sans text-forest/50">
                    Austin, Texas
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              className="p-8 rounded-2xl bg-card border border-border/50 space-y-5"
            >
              <div>
                <label className="text-sm font-sans font-medium text-forest mb-2 block">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-warm-white text-forest font-sans text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-sans font-medium text-forest mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-warm-white text-forest font-sans text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all"
                  placeholder="john@yourbusiness.com"
                />
              </div>
              <div>
                <label className="text-sm font-sans font-medium text-forest mb-2 block">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.business}
                  onChange={(e) =>
                    setFormData({ ...formData, business: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-warm-white text-forest font-sans text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all"
                  placeholder="Your Business LLC"
                />
              </div>
              <div>
                <label className="text-sm font-sans font-medium text-forest mb-2 block">
                  Tell Us About Your Project
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-border bg-warm-white text-forest font-sans text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all resize-none"
                  placeholder="What kind of website are you looking for? Any specific features or goals?"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm py-6 rounded-full shadow-none hover:shadow-md transition-all duration-300 group"
              >
                Send Message
                <ArrowRight
                  size={16}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
              <p className="text-xs text-forest/40 font-sans text-center">
                We'll respond within 24 hours. No spam, ever.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
