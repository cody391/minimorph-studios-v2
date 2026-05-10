import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch, Link } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Sparkles } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const nextPath = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: async (data) => {
      toast.success("Welcome back!");
      // Invalidate auth cache so downstream pages recognize the session
      await utils.auth.me.invalidate();
      // If ?next= is set, honor it (staff logins from footer)
      if (nextPath) {
        setLocation(nextPath);
        return;
      }
      // Otherwise route based on role
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else if (data.isRep) {
        // For reps, check onboarding status to route to correct step
        try {
          const status = await utils.repOnboarding.getOnboardingStatus.fetch();
          if (status.isFullyOnboarded) {
            setLocation("/rep");
          } else {
            setLocation(status.nextRoute);
          }
        } catch {
          // Fallback if onboarding check fails
          setLocation("/rep");
        }
      } else {
        setLocation("/portal");
      }
    },
    onError: (err: any) => {
      if (err.message.includes("Invalid email or password")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleLogin = () => {
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!password) { toast.error("Password is required"); return; }
    loginMutation.mutate({ email, password });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-soft-gray hover:text-electric text-sm font-sans transition-colors"
          >
            <ArrowLeft size={16} /> Back to MiniMorph Studios
          </button>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-off-white" />
            </div>
            <CardTitle className="font-serif text-off-white text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-soft-gray font-sans">
              {nextPath === "/admin"
                ? "Admin login"
                : nextPath === "/rep"
                ? "Rep login"
                : "Sign in to your MiniMorph Studios account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label className="text-off-white/80 text-sm flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="mt-1 border-border focus:border-electric"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-off-white/80 text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your password"
                  className="border-border focus:border-electric pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray/60 hover:text-soft-gray"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLocation("/forgot-password")}
                className="text-xs text-soft-gray hover:text-off-white font-sans transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full bg-electric hover:bg-electric-light text-white rounded-full py-5 font-sans mt-2"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-charcoal px-3 text-soft-gray/60 font-sans">Don't have an account?</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/become-rep")}
                className="w-full rounded-full border-border text-off-white font-sans"
              >
                Apply as a Sales Rep
              </Button>
              <p className="text-center text-[11px] text-soft-gray/60 font-sans">
                New customer?{" "}
                <Link href="/get-started" className="text-electric hover:underline">
                  Start your website here.
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
