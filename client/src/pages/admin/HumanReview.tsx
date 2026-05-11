import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Flame, Snowflake, Sun, User, Clock, Brain } from "lucide-react";
import { toast } from "sonner";

const tempIcons: Record<string, { icon: React.ElementType; color: string }> = {
  cold: { icon: Snowflake, color: "text-blue-400" },
  warm: { icon: Sun, color: "text-yellow-500" },
  hot: { icon: Flame, color: "text-red-400" },
};

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseEscalationFields(reason: string | null | undefined) {
  if (!reason) return { decision: null, confidence: null };
  const decisionMatch = reason.match(/Decision attempted:\s*(\S+)/);
  const confidenceMatch = reason.match(/Confidence:\s*([\d.]+)/);
  return {
    decision: decisionMatch?.[1]?.replace(/\.$/, "") ?? null,
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : null,
  };
}

export default function HumanReview() {
  const { data: leads, isLoading, refetch } = trpc.leads.listHumanReview.useQuery();
  const clearFlag = trpc.leads.clearHumanReviewFlag.useMutation({
    onSuccess: () => {
      toast.success("Flag cleared — lead returned to normal pipeline");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const count = leads?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-serif text-off-white">Human Review Queue</h1>
          {count > 0 && (
            <Badge className="bg-amber-400/20 text-amber-400 border border-amber-400/30 font-sans text-xs">
              {count} flagged
            </Badge>
          )}
        </div>
        <p className="text-sm text-soft-gray font-sans mt-1">
          Leads where the AI attempted a high-risk action but confidence was below the 85% threshold. Review each lead and clear the flag when handled.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : count === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-10 w-10 text-green-400/50 mx-auto mb-3" />
            <p className="text-base font-serif text-off-white mb-1">Queue clear</p>
            <p className="text-sm text-soft-gray font-sans">
              No leads are currently flagged for human review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(leads as any[]).map((lead) => {
            const ti = tempIcons[lead.temperature] ?? tempIcons.cold;
            const { decision, confidence } = parseEscalationFields(lead.escalationReason);
            const flaggedDecision = decision ?? lead.latestAiDecision;
            const flaggedConfidence =
              confidence ?? (lead.latestAiConfidence ? parseFloat(lead.latestAiConfidence) : null);

            return (
              <Card key={lead.id} className="border-amber-400/20 bg-amber-400/5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">

                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-off-white font-sans">{lead.businessName}</span>
                        <Badge variant="outline" className="text-xs border-border/50 text-soft-gray font-sans">
                          {lead.stage.replace(/_/g, " ")}
                        </Badge>
                        <div className={`flex items-center gap-1 text-xs font-sans ${ti.color}`}>
                          <ti.icon className="h-3 w-3" />
                          {lead.temperature}
                        </div>
                        <span className="text-xs text-soft-gray/60 font-sans">score {lead.qualificationScore}/100</span>
                      </div>

                      {/* Contact */}
                      <div className="flex items-center gap-4 flex-wrap text-sm">
                        <div className="flex items-center gap-1.5 text-soft-gray font-sans">
                          <User className="h-3.5 w-3.5" />
                          {lead.contactName}
                        </div>
                        {lead.email && (
                          <span className="text-soft-gray/70 font-sans text-xs">{lead.email}</span>
                        )}
                        {lead.phone && (
                          <span className="text-soft-gray/70 font-sans text-xs">{lead.phone}</span>
                        )}
                        {lead.industry && (
                          <span className="text-soft-gray/50 font-sans text-xs">{lead.industry}</span>
                        )}
                      </div>

                      {/* Escalation reason */}
                      {lead.escalationReason && (
                        <div className="rounded-lg border border-amber-400/15 bg-midnight/50 p-3">
                          <p className="text-xs font-sans text-soft-gray leading-relaxed">
                            <span className="text-amber-400 font-medium">Escalation: </span>
                            {lead.escalationReason}
                          </p>
                        </div>
                      )}

                      {/* AI decision + confidence */}
                      {(flaggedDecision || flaggedConfidence !== null) && (
                        <div className="flex items-center gap-3 flex-wrap">
                          {flaggedDecision && (
                            <div className="flex items-center gap-1.5 text-xs text-soft-gray font-sans">
                              <Brain className="h-3.5 w-3.5 text-electric/50" />
                              <span>Attempted:</span>
                              <Badge className="text-xs bg-red-500/10 text-red-400 border border-red-400/20 font-sans">
                                {flaggedDecision.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          )}
                          {flaggedConfidence !== null && (
                            <span
                              className={`text-xs font-medium font-sans ${
                                flaggedConfidence >= 85 ? "text-green-400" : "text-amber-400"
                              }`}
                            >
                              Confidence: {Math.round(flaggedConfidence)}/100
                            </span>
                          )}
                        </div>
                      )}

                      {/* Compliance */}
                      <div className="flex items-center gap-2 flex-wrap text-xs font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full border ${
                            lead.emailOptedOut
                              ? "bg-red-500/10 text-red-400 border-red-400/20"
                              : "bg-green-500/10 text-green-400 border-green-400/20"
                          }`}
                        >
                          Email: {lead.emailOptedOut ? "opted out" : "active"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border ${
                            lead.smsOptedOut
                              ? "bg-red-500/10 text-red-400 border-red-400/20"
                              : lead.smsOptIn
                              ? "bg-green-500/10 text-green-400 border-green-400/20"
                              : "bg-graphite text-soft-gray border-border/30"
                          }`}
                        >
                          SMS: {lead.smsOptedOut ? "opted out" : lead.smsOptIn ? "opted in" : "no consent"}
                        </span>
                        {lead.timezone && (
                          <span className="text-soft-gray/50">{lead.timezone}</span>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 flex-wrap text-xs text-soft-gray/50 font-sans">
                        {lead.lastTouchAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last touch: {fmtDate(lead.lastTouchAt)}
                          </div>
                        )}
                        {lead.checkoutSentAt && (
                          <span className="text-amber-400/70">
                            Checkout sent: {fmtDate(lead.checkoutSentAt)}
                          </span>
                        )}
                        {lead.elenaHandoffAt && (
                          <span className="text-electric/50">
                            Elena handoff: {fmtDate(lead.elenaHandoffAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 pt-0.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 font-sans"
                        onClick={() => clearFlag.mutate({ leadId: lead.id })}
                        disabled={clearFlag.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Mark Reviewed
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
