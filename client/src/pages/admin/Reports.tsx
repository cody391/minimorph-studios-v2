import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Plus, FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  generated: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  viewed: "bg-purple-100 text-purple-700",
};

export default function Reports() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: "", reportMonth: "" });

  const { data: reports, isLoading, refetch } = trpc.reports.list.useQuery();
  const createReport = trpc.reports.create.useMutation({
    onSuccess: () => { toast.success("Report created"); refetch(); setShowCreate(false); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Reporting & Analytics</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">Monthly Google Analytics reports and performance updates for customers</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-forest hover:bg-forest-light text-cream font-sans text-sm">
          <Plus className="h-4 w-4 mr-1" /> Create Report
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: reports?.length ?? 0, icon: FileText },
          { label: "Sent", value: reports?.filter((r: any) => r.status === "sent").length ?? 0, icon: Send },
          { label: "Viewed", value: reports?.filter((r: any) => r.status === "viewed").length ?? 0, icon: BarChart3 },
          { label: "Drafts", value: reports?.filter((r: any) => r.status === "draft").length ?? 0, icon: FileText },
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
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">All Reports</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !reports?.length ? (
            <div className="text-center py-12">
              <BarChart3 className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No reports yet. Reports are generated monthly for active customers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Period</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                      <td className="py-3 px-2 font-medium text-forest">Customer #{r.customerId}</td>
                      <td className="py-3 px-2 text-forest/70">{r.reportMonth}</td>
                      <td className="py-3 px-2 text-forest/50">{r.pageViews ?? "—"} views</td>
                      <td className="py-3 px-2"><Badge className={`text-xs font-sans ${statusColors[r.status] ?? ""}`}>{r.status}</Badge></td>
                      <td className="py-3 px-2 text-forest/50 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
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
          <DialogHeader><DialogTitle className="font-serif text-forest">Create Report</DialogTitle></DialogHeader>
          <div className="space-y-3 font-sans">
            <div>
              <label className="text-xs text-forest/50">Customer ID *</label>
              <Input type="number" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Report Month (e.g., "2026-03") *</label>
              <Input value={form.reportMonth} onChange={(e) => setForm({ ...form, reportMonth: e.target.value })} placeholder="YYYY-MM" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => createReport.mutate({ customerId: parseInt(form.customerId), reportMonth: form.reportMonth })}
              disabled={!form.customerId || !form.reportMonth}
              className="bg-forest hover:bg-forest-light text-cream font-sans text-sm"
            >
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
