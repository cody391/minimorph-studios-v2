import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const resetMutation = trpc.localAuth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMutation.mutate({ email });
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
              <Mail className="w-6 h-6 text-electric" />
            </div>
            <CardTitle className="text-off-white font-serif text-2xl">Forgot your password?</CardTitle>
            <CardDescription className="text-soft-gray font-sans">
              Enter the email on your account and we'll send you a reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
                <p className="text-off-white font-sans font-medium">Check your inbox</p>
                <p className="text-soft-gray font-sans text-sm">
                  If <strong className="text-off-white">{email}</strong> has an account, you'll receive a reset link within a minute. The link expires in 1 hour.
                </p>
                <Button
                  variant="outline"
                  className="border-electric/20 text-off-white font-sans rounded-full mt-2"
                  onClick={() => setLocation("/login")}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-soft-gray font-sans text-sm">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="bg-midnight border-electric/20 text-off-white font-sans placeholder:text-soft-gray/50"
                  />
                </div>

                {resetMutation.error && (
                  <p className="text-red-400 text-sm font-sans">{resetMutation.error.message}</p>
                )}

                <Button
                  type="submit"
                  disabled={resetMutation.isPending || !email}
                  className="w-full bg-electric hover:bg-electric-light text-midnight font-sans font-semibold rounded-full"
                >
                  {resetMutation.isPending ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
