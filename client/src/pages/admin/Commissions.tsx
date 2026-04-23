import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, CheckCircle, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Commissions() {
  const { data: commissions, isLoading, refetch } = trpc.commissions.list.useQuery();
  const { data: reps } = trpc.reps.list.useQuery();

  const approveCommission = trpc.reps.approveCommission.useMutation({
    onSuccess: () => { toast.success("Commission approved"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const initiatePayout = trpc.reps.initiatePayout.useMutation({
    onSuccess: () => { toast.success("Payout sent via Stripe Connect"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const totals = useMemo(() => {
    if (!commissions) return { pending: 0, paid: 0, total: 0 };
    return {
      pending: commissions.filter((c: any) => c.status === "pending" || c.status === "approved").reduce((s: number, c: any) => s + Number(c.amount), 0),
      paid: commissions.filter((c: any) => c.status === "paid").reduce((s: number, c: any) => s + Number(c.amount), 0),
      total: commissions.reduce((s: number, c: any) => s + Number(c.amount), 0),
    };
  }, [commissions]);

  const getRepName = (repId: number) => {
    const rep = reps?.find((r: any) => r.id === repId);
    return rep?.fullName || `Rep #${repId}`;
  };

  const getRepStripeStatus = (repId: number) => {
    const rep = reps?.find((r: any) => r.id === repId);
    return rep?.stripeConnectOnboarded || false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-forest">Commission Tracking</h1>
        <p className="text-sm text-forest/60 font-sans mt-1">Rep payouts, pending approvals, and payment history</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Payouts", value: `$${totals.pending.toLocaleString()}`, icon: Clock, color: "text-yellow-600" },
          { label: "Total Paid", value: `$${totals.paid.toLocaleString()}`, icon: CheckCircle, color: "text-green-600" },
          { label: "All-Time Total", value: `$${totals.total.toLocaleString()}`, icon: DollarSign, color: "text-forest" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-forest">{s.value}</div>
                <div className="text-xs text-forest/50 font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">All Commissions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !commissions?.length ? (
            <div className="text-center py-12">
              <DollarSign className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No commissions yet. Commissions are generated when deals close.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Rep</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Amount</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Date</th>
                    <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                      <td className="py-3 px-2 font-medium text-forest">{getRepName(c.repId)}</td>
                      <td className="py-3 px-2 text-forest/70 capitalize">{c.commissionType?.replace(/_/g, " ") || c.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="py-3 px-2 text-forest font-medium">${Number(c.amount).toFixed(2)}</td>
                      <td className="py-3 px-2"><Badge className={`text-xs font-sans ${statusColors[c.status] ?? ""}`}>{c.status}</Badge></td>
                      <td className="py-3 px-2 text-forest/50 text-xs">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-2 text-right">
                        {c.status === "pending" && (
                          <Button size="sm" className="bg-forest text-white hover:bg-forest/90 text-xs font-sans"
                            disabled={approveCommission.isPending}
                            onClick={() => approveCommission.mutate({ commissionId: c.id })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {c.status === "approved" && (
                          <Button size="sm" disabled={!getRepStripeStatus(c.repId) || initiatePayout.isPending}
                            className="bg-green-600 text-white hover:bg-green-700 text-xs font-sans"
                            onClick={() => initiatePayout.mutate({ commissionId: c.id })}>
                            <ArrowUpRight className="h-3 w-3 mr-1" /> Pay
                          </Button>
                        )}
                        {c.status === "paid" && (
                          <span className="text-xs text-green-600 font-sans">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
