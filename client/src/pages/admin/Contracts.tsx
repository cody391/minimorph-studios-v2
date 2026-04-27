import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, CheckCircle, AlertTriangle, CreditCard } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_payment: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  expiring_soon: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Contracts() {
  const [selected, setSelected] = useState<any>(null);
  const { data: contracts, isLoading, refetch } = trpc.contracts.list.useQuery();
  const updateContract = trpc.contracts.update.useMutation({
    onSuccess: () => { toast.success("Contract updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    if (!contracts) return { pendingPayment: 0, active: 0, expiring: 0, expired: 0 };
    return {
      pendingPayment: contracts.filter((c: any) => c.status === "pending_payment").length,
      active: contracts.filter((c: any) => c.status === "active").length,
      expiring: contracts.filter((c: any) => c.status === "expiring_soon").length,
      expired: contracts.filter((c: any) => c.status === "expired").length,
    };
  }, [contracts]);

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-forest">Contract Management</h1>
        <p className="text-sm text-forest/60 font-sans mt-1">Track 12-month contracts, renewals, and lifecycle status</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending Payment", count: counts.pendingPayment, icon: CreditCard, color: "text-amber-600" },
          { label: "Active", count: counts.active, icon: CheckCircle, color: "text-green-600" },
          { label: "Expiring Soon", count: counts.expiring, icon: AlertTriangle, color: "text-yellow-600" },
          { label: "Expired", count: counts.expired, icon: Clock, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-forest">{s.count}</div>
                <div className="text-xs text-forest/50 font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">All Contracts</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !contracts?.length ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No contracts yet. Contracts are created after a sale closes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Package</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Monthly</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Start</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">End</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                      <td className="py-3 px-2 font-medium text-forest">Customer #{c.customerId}</td>
                      <td className="py-3 px-2 text-forest/70 capitalize">{c.packageTier}</td>
                      <td className="py-3 px-2 text-forest/70">${Number(c.monthlyRate).toLocaleString()}</td>
                      <td className="py-3 px-2 text-forest/50 text-xs">{formatDate(c.startDate)}</td>
                      <td className="py-3 px-2 text-forest/50 text-xs">{formatDate(c.endDate)}</td>
                      <td className="py-3 px-2"><Badge className={`text-xs font-sans ${statusColors[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</Badge></td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="sm" className="text-xs text-forest/60 hover:text-forest" onClick={() => setSelected(c)}>Manage</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-forest">Contract #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-forest/50 text-xs">Package</span><p className="text-forest capitalize">{selected.packageTier}</p></div>
                <div><span className="text-forest/50 text-xs">Monthly Rate</span><p className="text-forest">${Number(selected.monthlyRate).toLocaleString()}</p></div>
                <div><span className="text-forest/50 text-xs">Setup Fee</span><p className="text-forest">${Number(selected.setupFee).toLocaleString()}</p></div>
                <div><span className="text-forest/50 text-xs">Duration</span><p className="text-forest">{formatDate(selected.startDate)} — {formatDate(selected.endDate)}</p></div>
              </div>
              <div>
                <label className="text-xs text-forest/50">Status</label>
                <Select value={selected.status} onValueChange={(val) => { updateContract.mutate({ id: selected.id, status: val as any }); setSelected({ ...selected, status: val }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "pending_payment", "active", "expiring_soon", "expired", "renewed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} className="font-sans text-sm">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
