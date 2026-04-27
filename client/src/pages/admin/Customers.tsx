import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Heart, AlertTriangle, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusConfig: Record<string, { color: string; icon: any }> = {
  active: { color: "badge-success", icon: Heart },
  at_risk: { color: "badge-pending", icon: AlertTriangle },
  churned: { color: "badge-danger", icon: XCircle },
};

export default function Customers() {
  const [selected, setSelected] = useState<any>(null);
  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("Customer updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    if (!customers) return { active: 0, at_risk: 0, churned: 0 };
    return {
      active: customers.filter((c: any) => c.status === "active").length,
      at_risk: customers.filter((c: any) => c.status === "at_risk").length,
      churned: customers.filter((c: any) => c.status === "churned").length,
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-off-white">Customer Management</h1>
        <p className="text-sm text-soft-gray font-sans mt-1">Active accounts, health scores, and customer lifecycle</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["active", "at_risk", "churned"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <Card key={s} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <cfg.icon className={`h-5 w-5 ${s === "active" ? "text-emerald-400" : s === "at_risk" ? "text-yellow-600" : "text-red-600"}`} />
                <div>
                  <div className="text-lg font-serif text-off-white">{counts[s]}</div>
                  <div className="text-xs text-soft-gray font-sans capitalize">{s.replace(/_/g, " ")}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">All Customers</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !customers?.length ? (
            <div className="text-center py-12">
              <Building2 className="h-10 w-10 text-soft-gray/40 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No customers yet. Customers are created when leads close.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Business</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Contact</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Industry</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Health</th>
                    <th className="text-left py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-xs text-soft-gray uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c: any) => {
                    const cfg = statusConfig[c.status] ?? statusConfig.active;
                    return (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-midnight-dark/20 transition-colors">
                        <td className="py-3 px-2 font-medium text-off-white">{c.businessName}</td>
                        <td className="py-3 px-2 text-soft-gray">{c.contactName}</td>
                        <td className="py-3 px-2 text-soft-gray text-xs">{c.industry || "—"}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${c.healthScore >= 70 ? "bg-green-500" : c.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`} />
                            <span className="text-soft-gray">{c.healthScore}/100</span>
                          </div>
                        </td>
                        <td className="py-3 px-2"><Badge className={`text-xs font-sans ${cfg.color}`}>{c.status.replace(/_/g, " ")}</Badge></td>
                        <td className="py-3 px-2 text-right">
                          <Button variant="ghost" size="sm" className="text-xs text-soft-gray hover:text-off-white"
                            onClick={() => setSelected(c)}>Manage</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-off-white">{selected?.businessName}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-soft-gray text-xs">Contact</span><p className="text-off-white">{selected.contactName}</p></div>
                <div><span className="text-soft-gray text-xs">Email</span><p className="text-off-white">{selected.email}</p></div>
                <div><span className="text-soft-gray text-xs">Industry</span><p className="text-off-white">{selected.industry || "—"}</p></div>
                <div><span className="text-soft-gray text-xs">Website</span><p className="text-off-white">{selected.website || "—"}</p></div>
              </div>
              <div>
                <label className="text-xs text-soft-gray">Status</label>
                <Select value={selected.status} onValueChange={(val) => { updateCustomer.mutate({ id: selected.id, status: val as any }); setSelected({ ...selected, status: val }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["active", "at_risk", "churned"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
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
