import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus, Zap, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  identified: "bg-blue-100 text-blue-700",
  proposed: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default function Upsells() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: "", type: "add_pages" as "tier_upgrade" | "add_pages" | "add_feature" | "add_service", title: "", estimatedValue: "", description: "" });

  const { data: upsells, isLoading, refetch } = trpc.upsells.list.useQuery();
  const createUpsell = trpc.upsells.create.useMutation({
    onSuccess: () => { toast.success("Upsell opportunity created"); refetch(); setShowCreate(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateUpsell = trpc.upsells.update.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    if (!upsells) return { pipeline: 0, won: 0 };
    return {
      pipeline: upsells.filter((u: any) => u.status === "identified" || u.status === "proposed").reduce((s: number, u: any) => s + Number(u.proposedValue), 0),
      won: upsells.filter((u: any) => u.status === "accepted").reduce((s: number, u: any) => s + Number(u.proposedValue), 0),
    };
  }, [upsells]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Upsells & Upgrades</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">AI-detected upgrade opportunities, add-on proposals, and conversion tracking</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-forest hover:bg-forest-light text-cream font-sans text-sm">
          <Plus className="h-4 w-4 mr-1" /> Add Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Opportunities", value: upsells?.length ?? 0, icon: Zap },
          { label: "Pipeline Value", value: `$${totals.pipeline.toLocaleString()}`, icon: TrendingUp },
          { label: "Won Value", value: `$${totals.won.toLocaleString()}`, icon: DollarSign },
          { label: "Conversion Rate", value: upsells?.length ? `${Math.round((upsells.filter((u: any) => u.status === "accepted").length / upsells.length) * 100)}%` : "0%", icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="text-lg font-serif text-forest">{s.value}</div>
              <div className="text-xs text-forest/50 font-sans">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">All Upsell Opportunities</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !upsells?.length ? (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No upsell opportunities yet. AI will detect them during customer nurture.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Value</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upsells.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                      <td className="py-3 px-2 font-medium text-forest">Customer #{u.customerId}</td>
                      <td className="py-3 px-2 text-forest/70 capitalize">{(u.type || "—").replace(/_/g, " ")}</td>
                      <td className="py-3 px-2 text-forest font-medium">${Number(u.estimatedValue || 0).toLocaleString()}</td>
                      <td className="py-3 px-2"><Badge className={`text-xs font-sans ${statusColors[u.status] ?? ""}`}>{u.status}</Badge></td>
                      <td className="py-3 px-2 text-right flex gap-1 justify-end">
                        {u.status === "identified" && (
                          <Button variant="ghost" size="sm" className="text-xs text-forest/60 hover:text-forest"
                            onClick={() => updateUpsell.mutate({ id: u.id, status: "proposed" })}>Propose</Button>
                        )}
                        {u.status === "proposed" && (
                          <>
                            <Button variant="ghost" size="sm" className="text-xs text-green-600 hover:text-green-700"
                              onClick={() => updateUpsell.mutate({ id: u.id, status: "accepted" })}>Accept</Button>
                            <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700"
                              onClick={() => updateUpsell.mutate({ id: u.id, status: "declined" })}>Decline</Button>
                          </>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-forest">Add Upsell Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-3 font-sans">
            <div>
              <label className="text-xs text-forest/50">Customer ID *</label>
              <Input type="number" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Upsell Type</label>
              <Select value={form.type} onValueChange={(val: any) => setForm({ ...form, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["tier_upgrade", "add_pages", "add_feature", "add_service"].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-forest/50">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Estimated Value ($)</label>
              <Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => createUpsell.mutate({ customerId: parseInt(form.customerId), type: form.type, title: form.title, estimatedValue: form.estimatedValue || undefined, description: form.description || undefined })}
              disabled={!form.customerId || !form.title}
              className="bg-forest hover:bg-forest-light text-cream font-sans text-sm"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
