import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Analytics</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">
            Website performance metrics and traffic insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-sans"
          onClick={() => toast.info("Google Analytics integration coming soon. Connect your GA4 property to see live data.")}
        >
          <ExternalLink className="h-3 w-3 mr-1" /> Connect GA4
        </Button>
      </div>

      {/* Empty State */}
      <Card className="border-border/50">
        <CardContent className="py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-forest/8 flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="w-8 h-8 text-forest/40" />
            </div>
            <h3 className="text-lg font-serif text-forest mb-3">
              No Analytics Data Yet
            </h3>
            <p className="text-sm text-forest/50 font-sans leading-relaxed mb-6">
              Connect your Google Analytics 4 property to see real-time traffic data,
              conversion metrics, and customer website performance reports.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-sans"
              onClick={() => toast.info("GA4 integration setup will be available in a future update.")}
            >
              Learn How to Connect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
