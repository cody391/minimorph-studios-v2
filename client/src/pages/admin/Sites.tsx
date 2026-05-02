import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Eye, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  intake: { label: "Intake", color: "bg-zinc-500/20 text-zinc-400", icon: Clock },
  design: { label: "Building", color: "bg-blue-500/20 text-blue-400", icon: Loader2 },
  review: { label: "Awaiting Approval", color: "bg-yellow-500/20 text-yellow-400", icon: Eye },
  final_approval: { label: "Final Approval", color: "bg-orange-500/20 text-orange-400", icon: AlertCircle },
  launch: { label: "Launching", color: "bg-purple-500/20 text-purple-400", icon: Loader2 },
  complete: { label: "Live", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
};

export default function Sites() {
  const [, setLocation] = useLocation();
  const { data: projects } = trpc.onboarding.list.useQuery({});

  const siteProjects = projects ?? [];

  const awaitingApproval = siteProjects.filter((p: any) => p.stage === "review" || p.stage === "final_approval").length;
  const live = siteProjects.filter((p: any) => p.stage === "complete").length;
  const building = siteProjects.filter((p: any) => p.stage === "design" || p.generationStatus === "generating").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-electric" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground">All customer website projects and deployment status</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-white/10 bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{awaitingApproval}</div>
            <div className="text-xs text-muted-foreground mt-1">Awaiting Approval</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{building}</div>
            <div className="text-xs text-muted-foreground mt-1">Building</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{live}</div>
            <div className="text-xs text-muted-foreground mt-1">Live</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">All Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!siteProjects || siteProjects.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">No site projects yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {siteProjects.map((p: any) => {
                const stage = STAGE_CONFIG[p.stage] ?? STAGE_CONFIG.intake;
                const StageIcon = stage.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">{p.businessName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.packageTier} · #{p.id}
                        {p.createdAt && ` · ${formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}`}
                      </div>
                      {p.generationLog && (
                        <div className="text-xs text-muted-foreground/70 mt-0.5 truncate max-w-xs">{p.generationLog}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <Badge className={`text-xs flex items-center gap-1 ${stage.color}`}>
                        <StageIcon className={`w-3 h-3 ${p.stage === "design" || p.stage === "launch" ? "animate-spin" : ""}`} />
                        {stage.label}
                      </Badge>
                      {p.liveUrl && (
                        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                            <ExternalLink className="w-3 h-3" />
                            View Live
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setLocation("/admin/onboarding")}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
