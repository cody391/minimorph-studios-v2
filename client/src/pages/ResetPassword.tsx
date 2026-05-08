import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  const resetMutation = trpc.localAuth.resetPassword.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Password updated — you're now logged in.");
      setLocation("/portal");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight px-4">
        <div className="text-center max-w-sm">
          <p className="text-soft-gray font-sans mb-4">Invalid reset link. Please request a new one.</p>
          <Button
            onClick={() => setLocation("/forgot-password")}
            className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full"
          >
            Request new link
          </Button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setLocation("/login")}
          className="flex items-center gap-2 text-soft-gray hover:text-off-white text-sm font-sans mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to login
        </button>

        <Card className="bg-graphite border-electric/10">
          <CardHeader className="pb-4">
            <div className="w-12 h-12 bg-electric/10 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-electric" />
            </div>
            <CardTitle className="text-off-white font-serif text-2xl">Set a new password</CardTitle>
            <CardDescription className="text-soft-gray font-sans">
              Choose a strong password — at least 8 characters.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-soft-gray font-sans text-sm">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoFocus
                    className="bg-midnight border-electric/20 text-off-white font-sans placeholder:text-soft-gray/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-gray hover:text-off-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-soft-gray font-sans text-sm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="bg-midnight border-electric/20 text-off-white font-sans placeholder:text-soft-gray/50"
                />
              </div>

              {confirm && password !== confirm && (
                <p className="text-red-400 text-sm font-sans">Passwords don't match.</p>
              )}

              {resetMutation.error && (
                <div className="text-red-400 text-sm font-sans space-y-1">
                  <p>{resetMutation.error.message}</p>
                  <button
                    type="button"
                    onClick={() => setLocation("/forgot-password")}
                    className="underline hover:text-red-300 transition-colors"
                  >
                    Request a new link →
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={resetMutation.isPending || password.length < 8 || password !== confirm}
                className="w-full bg-electric hover:bg-electric-light text-midnight font-sans font-semibold rounded-full"
              >
                {resetMutation.isPending ? "Saving…" : "Set new password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
