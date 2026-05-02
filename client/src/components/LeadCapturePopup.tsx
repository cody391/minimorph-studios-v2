import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Gift } from "lucide-react";

const COOKIE_KEY = "mm_popup_dismissed";
const COOKIE_DAYS = 30;

function hasDismissed(): boolean {
  try {
    return document.cookie.split(";").some(c => c.trim().startsWith(COOKIE_KEY + "="));
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    document.cookie = `${COOKIE_KEY}=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
}

export default function LeadCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissedState] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ businessName: "", contactName: "", email: "", phone: "" });

  const capture = trpc.leads.captureFromPopup.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setDismissed();
    },
    onError: (e) => toast.error(e.message),
  });

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissedState(true);
    setDismissed();
  }, []);

  useEffect(() => {
    if (hasDismissed()) return;

    // Show after 8s delay
    const timer = setTimeout(() => {
      if (!dismissed) setVisible(true);
    }, 8000);

    // Exit intent — mouse moving toward top
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 50 && !dismissed && !hasDismissed()) {
        setVisible(true);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative bg-[#111122] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric via-purple-500 to-electric" />

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-electric/20 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6 text-electric" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Check your email!</h3>
            <p className="text-sm text-muted-foreground">
              We sent your <strong className="text-electric">WELCOME10</strong> code — 10% off any package. Good for 7 days.
            </p>
            <Button onClick={dismiss} variant="ghost" size="sm">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-electric" />
                <h3 className="text-lg font-bold text-foreground">Get 10% Off Your Website</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your details and we'll send code <strong className="text-electric">WELCOME10</strong> straight to your inbox.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Business Name</Label>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm(f => ({ ...f, businessName: e.target.value }))}
                  placeholder="Your business"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Your Name</Label>
                <Input
                  value={form.contactName}
                  onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))}
                  placeholder="Full name"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@business.com"
                className="h-9 text-sm"
              />
            </div>

            <Button
              className="w-full"
              onClick={() => capture.mutate(form)}
              disabled={!form.businessName || !form.contactName || !form.email || capture.isPending}
            >
              {capture.isPending ? "Sending..." : "Send My 10% Discount →"}
            </Button>

            <p className="text-[10px] text-muted-foreground/60 text-center">
              No spam. Unsubscribe anytime. Offer valid for new customers only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
