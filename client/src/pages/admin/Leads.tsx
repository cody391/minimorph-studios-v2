import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Flame, Snowflake, Sun, Sparkles, Loader2, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const tempIcons: Record<string, any> = {
  cold: { icon: Snowflake, color: "text-blue-500", bg: "bg-blue-50" },
  warm: { icon: Sun, color: "text-yellow-600", bg: "bg-yellow-50" },
  hot: { icon: Flame, color: "text-red-500", bg: "bg-red-50" },
};

const stageColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  enriched: "bg-blue-100 text-blue-700",
  warming: "bg-yellow-100 text-yellow-700",
  warm: "bg-orange-100 text-orange-700",
  assigned: "bg-purple-100 text-purple-700",
  contacted: "bg-indigo-100 text-indigo-700",
  proposal_sent: "bg-cyan-100 text-cyan-700",
  negotiating: "bg-teal-100 text-teal-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
};

export default function Leads() {
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<number | null>(null);
  const [form, setForm] = useState({ businessName: "", contactName: "", email: "", phone: "", industry: "", website: "", source: "manual" as const, notes: "" });

  const { data: leads, isLoading, refetch } = trpc.leads.list.useQuery();
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => { toast.success("Lead created"); refetch(); setShowCreate(false); setForm({ businessName: "", contactName: "", email: "", phone: "", industry: "", website: "", source: "manual", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const { data: reps } = trpc.reps.list.useQuery();
  const transferLeads = trpc.leads.transferLeads.useMutation({
    onSuccess: (data) => { toast.success(`${data.transferredCount} leads transferred`); refetch(); setShowTransfer(false); },
    onError: (e) => toast.error(e.message),
  });
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const enrichLead = trpc.leads.enrich.useMutation({
    onSuccess: (data) => {
      toast.success("Lead enriched with AI insights");
      refetch();
      setEnrichingId(null);
      if (selectedLead) {
        setSelectedLead({ ...selectedLead, enrichmentData: data.enrichmentData, stage: "enriched" });
      }
    },
    onError: (e) => { toast.error(`Enrichment failed: ${e.message}`); setEnrichingId(null); },
  });

  const handleEnrich = (leadId: number) => {
    setEnrichingId(leadId);
    enrichLead.mutate({ id: leadId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Lead Pipeline</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">AI-sourced and manual leads, warming pipeline, and rep assignment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowTransfer(true)} variant="outline" className="text-forest border-forest/20 hover:bg-forest/5 font-sans text-sm">
            <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer Leads
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-forest hover:bg-forest-light text-cream font-sans text-sm">
            <Plus className="h-4 w-4 mr-1" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Temperature Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["cold", "warm", "hot"] as const).map((t) => {
          const info = tempIcons[t];
          const count = leads?.filter((l: any) => l.temperature === t).length ?? 0;
          return (
            <Card key={t} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${info.bg} flex items-center justify-center`}>
                  <info.icon className={`h-4 w-4 ${info.color}`} />
                </div>
                <div>
                  <div className="text-lg font-serif text-forest">{count}</div>
                  <div className="text-xs text-forest/50 font-sans capitalize">{t} leads</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leads Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-forest">All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !leads?.length ? (
            <div className="text-center py-12">
              <Target className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No leads yet. Add your first lead or let AI source them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Business</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Contact</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Temp</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Stage</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Score</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Source</th>
                    <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any) => {
                    const ti = tempIcons[lead.temperature] ?? tempIcons.cold;
                    const hasEnrichment = lead.enrichmentData && Object.keys(lead.enrichmentData).length > 0;
                    return (
                      <tr key={lead.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-forest">{lead.businessName}</span>
                            {hasEnrichment && (
                              <span title="AI Enriched"><Sparkles className="h-3.5 w-3.5 text-terracotta/60" /></span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-forest/60">{lead.contactName}</td>
                        <td className="py-3 px-2">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${ti.bg}`}>
                            <ti.icon className={`h-3 w-3 ${ti.color}`} />
                            <span className={ti.color}>{lead.temperature}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge className={`text-xs font-sans ${stageColors[lead.stage] ?? ""}`}>
                            {lead.stage.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-forest/70">{lead.qualificationScore}/100</td>
                        <td className="py-3 px-2 text-forest/50 text-xs">{lead.source.replace(/_/g, " ")}</td>
                        <td className="py-3 px-2 text-right space-x-1">
                          {!hasEnrichment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-terracotta hover:text-terracotta hover:bg-terracotta/10"
                              onClick={() => handleEnrich(lead.id)}
                              disabled={enrichingId === lead.id}
                            >
                              {enrichingId === lead.id ? (
                                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Enriching...</>
                              ) : (
                                <><Sparkles className="h-3 w-3 mr-1" /> Enrich</>
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-xs text-forest/60 hover:text-forest"
                            onClick={() => { setSelectedLead(lead); setShowDetail(true); }}>
                            View
                          </Button>
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

      {/* Create Lead Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest">Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-forest/50">Business Name *</label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-forest/50">Contact Name *</label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-forest/50">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-forest/50">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-forest/50">Industry</label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-forest/50">Website</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-forest/50">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => createLead.mutate(form)}
              disabled={!form.businessName || !form.contactName || !form.email}
              className="bg-forest hover:bg-forest-light text-cream font-sans text-sm"
            >
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest">Transfer Leads Between Reps</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 font-sans">
            <p className="text-sm text-forest/60">Move all active leads from one rep to another. This will notify the receiving rep.</p>
            <div>
              <label className="text-xs text-forest/50">From Rep</label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger><SelectValue placeholder="Select source rep" /></SelectTrigger>
                <SelectContent>
                  {(reps || []).filter((r: any) => r.status === "active" || r.status === "certified").map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.fullName} ({(leads || []).filter((l: any) => l.assignedRepId === r.id && !["closed_won","closed_lost"].includes(l.stage)).length} active leads)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-forest/50">To Rep</label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger><SelectValue placeholder="Select target rep" /></SelectTrigger>
                <SelectContent>
                  {(reps || []).filter((r: any) => (r.status === "active" || r.status === "certified") && String(r.id) !== transferFrom).map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => transferLeads.mutate({ fromRepId: Number(transferFrom), toRepId: Number(transferTo) })}
              disabled={!transferFrom || !transferTo || transferLeads.isPending}
              className="bg-forest hover:bg-forest-light text-cream font-sans text-sm"
            >
              {transferLeads.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Transferring...</> : <><ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer All Leads</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest">{selectedLead?.businessName}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-forest/50 text-xs">Contact</span><p className="text-forest">{selectedLead.contactName}</p></div>
                <div><span className="text-forest/50 text-xs">Email</span><p className="text-forest">{selectedLead.email}</p></div>
                <div><span className="text-forest/50 text-xs">Industry</span><p className="text-forest">{selectedLead.industry || "—"}</p></div>
                <div><span className="text-forest/50 text-xs">Score</span><p className="text-forest">{selectedLead.qualificationScore}/100</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-forest/50">Stage</label>
                  <Select value={selectedLead.stage} onValueChange={(val) => { updateLead.mutate({ id: selectedLead.id, stage: val as any }); setSelectedLead({ ...selectedLead, stage: val }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["new", "enriched", "warming", "warm", "assigned", "contacted", "proposal_sent", "negotiating", "closed_won", "closed_lost"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-forest/50">Temperature</label>
                  <Select value={selectedLead.temperature} onValueChange={(val) => { updateLead.mutate({ id: selectedLead.id, temperature: val as any }); setSelectedLead({ ...selectedLead, temperature: val }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["cold", "warm", "hot"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Enrichment Data */}
              {selectedLead.enrichmentData && Object.keys(selectedLead.enrichmentData).length > 0 ? (
                <div className="border border-terracotta/20 rounded-xl p-4 bg-terracotta/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-terracotta" />
                    <span className="text-sm font-medium text-forest">AI Enrichment Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-forest/50 text-xs">Company Size</span>
                      <p className="text-forest">{selectedLead.enrichmentData.companySize}</p>
                    </div>
                    <div>
                      <span className="text-forest/50 text-xs">Est. Revenue</span>
                      <p className="text-forest">{selectedLead.enrichmentData.estimatedRevenue}</p>
                    </div>
                    <div>
                      <span className="text-forest/50 text-xs">Online Presence</span>
                      <Badge className={`text-xs ${
                        selectedLead.enrichmentData.onlinePresence === "poor" ? "bg-red-100 text-red-700" :
                        selectedLead.enrichmentData.onlinePresence === "fair" ? "bg-yellow-100 text-yellow-700" :
                        selectedLead.enrichmentData.onlinePresence === "good" ? "bg-green-100 text-green-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>{selectedLead.enrichmentData.onlinePresence}</Badge>
                    </div>
                    <div>
                      <span className="text-forest/50 text-xs">Recommended Package</span>
                      <Badge className="text-xs bg-forest/10 text-forest capitalize">{selectedLead.enrichmentData.recommendedPackage}</Badge>
                    </div>
                  </div>
                  {selectedLead.enrichmentData.websiteNeeds?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-forest/50 text-xs">Website Needs</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLead.enrichmentData.websiteNeeds.map((need: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs border-forest/20 text-forest/70">{need}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedLead.enrichmentData.enrichmentSummary && (
                    <div className="mt-3">
                      <span className="text-forest/50 text-xs">Summary</span>
                      <p className="text-sm text-forest/80 mt-1">{selectedLead.enrichmentData.enrichmentSummary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-terracotta/30 rounded-xl p-4 text-center">
                  <Sparkles className="h-5 w-5 text-terracotta/40 mx-auto mb-2" />
                  <p className="text-xs text-forest/50 mb-2">No AI enrichment data yet</p>
                  <Button
                    size="sm"
                    className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-xs"
                    onClick={() => handleEnrich(selectedLead.id)}
                    disabled={enrichingId === selectedLead.id}
                  >
                    {enrichingId === selectedLead.id ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Enriching...</>
                    ) : (
                      <><Sparkles className="h-3 w-3 mr-1" /> Enrich with AI</>
                    )}
                  </Button>
                </div>
              )}

              {selectedLead.notes && (
                <div><span className="text-xs text-forest/50">Notes</span><p className="text-sm text-forest/80 mt-1">{selectedLead.notes}</p></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)} className="font-sans text-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
