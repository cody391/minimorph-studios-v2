import { useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Unsubscribe() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const email = params.get("email") || "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  const unsubscribe = trpc.email.unsubscribe.useMutation({
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error"),
  });

  const handleUnsubscribe = () => {
    if (email) {
      unsubscribe.mutate({ email });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "success" ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <CardTitle>Unsubscribed</CardTitle>
              <CardDescription>
                You have been successfully unsubscribed from MiniMorph Studios marketing emails.
                You will no longer receive promotional messages from us.
              </CardDescription>
            </>
          ) : status === "error" ? (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We couldn't process your unsubscribe request. Please try again or contact us directly.
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Unsubscribe from Emails</CardTitle>
              <CardDescription>
                {email
                  ? `Click below to unsubscribe ${email} from MiniMorph Studios marketing emails.`
                  : "We'll remove you from our marketing email list."}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "pending" && (
            <Button
              onClick={handleUnsubscribe}
              disabled={!email || unsubscribe.isPending}
              className="w-full"
            >
              {unsubscribe.isPending ? "Processing..." : "Confirm Unsubscribe"}
            </Button>
          )}
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
            Return to MiniMorph Studios
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
