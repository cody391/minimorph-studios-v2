import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Inbox, Mail, Clock, CheckCircle } from "lucide-react";
import { useState, useMemo } from "react";

const statusColors: Record<string, string> = {
  new: "badge-info",
  contacted: "badge-pending",
  converted: "badge-success",
  archived: "badge-neutral",
};

export default function Submissions() {
  const [selected, setSelected] = useState<any>(null);
  const { data: submissions, isLoading } = trpc.contact.list.useQuery();

  const counts = useMemo(() => {
    if (!submissions) return { total: 0, newCount: 0, contacted: 0 };
    return {
      total: submissions.length,
      newCount: submissions.filter((s: any) => s.status === "new").length,
      contacted: submissions.filter((s: any) => s.status === "contacted").length,
    };
  }, [submissions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-off-white">Contact Submissions</h1>
        <p className="text-sm text-soft-gray font-sans mt-1">Leads from the public contact form — review, respond, and convert</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Submissions", count: counts.total, icon: Inbox, color: "text-off-white" },
          { label: "New / Unread", count: counts.newCount, icon: Mail, color: "text-blue-600" },
          { label: "Contacted", count: counts.contacted, icon: CheckCircle, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-off-white">{s.count}</div>
                <div className="text-xs text-soft-gray font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-off-white">All Submissions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !submissions?.length ? (
            <div className="text-center py-12">
              <Inbox className="h-10 w-10 text-soft-gray/40 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No submissions yet. They'll appear here when visitors fill out the contact form.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-midnight-dark/20 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-off-white font-sans">{s.name}</span>
                      <Badge className={`text-[10px] font-sans ${statusColors[s.status] ?? ""}`}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-soft-gray font-sans">{s.email} {s.businessName ? `• ${s.businessName}` : ""}</p>
                    {s.message && <p className="text-xs text-soft-gray/60 font-sans mt-1 line-clamp-1">{s.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Clock className="h-3 w-3 text-soft-gray/40" />
                    <span className="text-[10px] text-soft-gray/60 font-sans">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-off-white">Submission from {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-soft-gray text-xs">Name</span><p className="text-off-white">{selected.name}</p></div>
                <div><span className="text-soft-gray text-xs">Email</span><p className="text-off-white">{selected.email}</p></div>
                <div><span className="text-soft-gray text-xs">Business</span><p className="text-off-white">{selected.businessName || "—"}</p></div>
                <div><span className="text-soft-gray text-xs">Status</span><p className="text-off-white capitalize">{selected.status}</p></div>
              </div>
              {selected.message && (
                <div>
                  <span className="text-soft-gray text-xs">Message</span>
                  <p className="text-sm text-off-white mt-1 p-3 rounded-lg bg-midnight-dark/30">{selected.message}</p>
                </div>
              )}
              <div className="text-xs text-soft-gray/60">
                Submitted: {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} className="font-sans text-sm">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
