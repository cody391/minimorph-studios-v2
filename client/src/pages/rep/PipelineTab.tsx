import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Target, Flame, Snowflake, Sun, Phone, Mail, FileText, Sparkles,
  GripVertical, ChevronRight, CheckCircle, XCircle, Loader2, Plus,
  ArrowRight, DollarSign, Send, Eye, Handshake, ShieldCheck, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Constants ─── */
const PIPELINE_STAGES = [
  { key: "assigned", label: "Assigned", color: "badge-purple border-purple-200", headerBg: "bg-purple-50" },
  { key: "contacted", label: "Contacted", color: "badge-info border-blue-200", headerBg: "bg-blue-50" },
  { key: "proposal_sent", label: "Proposal Sent", color: "badge-pending border-yellow-200", headerBg: "bg-yellow-50" },
  { key: "negotiating", label: "Negotiating", color: "badge-pending-payment border-orange-200", headerBg: "bg-orange-50" },
] as const;

const CLOSED_STAGES = [
  { key: "closed_won", label: "Won", color: "badge-success border-green-200" },
  { key: "closed_lost", label: "Lost", color: "badge-danger border-red-200" },
];

const tempMeta: Record<string, { icon: any; color: string; bg: string }> = {
  cold: { icon: Snowflake, color: "text-blue-500", bg: "bg-blue-50" },
  warm: { icon: Sun, color: "text-yellow-600", bg: "bg-yellow-50" },
  hot: { icon: Flame, color: "text-red-500", bg: "bg-red-50" },
};

const PACKAGE_PRICES: Record<string, string> = {
  starter: "195",
  growth: "295",
  premium: "395",
  enterprise: "495",
};

/* ─── Types ─── */
type Lead = {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  industry?: string | null;
  website?: string | null;
  stage: string;
  temperature: string;
  notes?: string | null;
  qualificationScore: number;
  enrichmentData?: any;
  lastTouchAt?: Date | string | null;
  smsOptIn?: boolean;
  smsOptedOut?: boolean;
  totalCostCents?: number;
};

/* ═══════════════════════════════════════════════════════
   PIPELINE TAB — Kanban board for rep leads
   ═══════════════════════════════════════════════════════ */
export default function PipelineTab({ repProfile }: { repProfile: any }) {
  const utils = trpc.useUtils();
  const { data: myLeads = [], isLoading } = trpc.leads.myLeads.useQuery(undefined, { enabled: !!repProfile });
  const { data: leadPool = [] } = trpc.leads.leadPool.useQuery(undefined, { enabled: !!repProfile });

  const updateLead = trpc.leads.updateMyLead.useMutation({
    onSuccess: () => { utils.leads.myLeads.invalidate(); toast.success("Lead updated"); },
    onError: (e) => toast.error(e.message),
  });
  const claimLead = trpc.leads.claimLead.useMutation({
    onSuccess: () => { utils.leads.myLeads.invalidate(); utils.leads.leadPool.invalidate(); toast.success("Lead claimed!"); },
    onError: (e) => toast.error(e.message),
  });
  const generateProposal = trpc.leads.generateProposal.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const closeDeal = trpc.leads.closeDeal.useMutation({
    onSuccess: () => { utils.leads.myLeads.invalidate(); toast.success("Deal closed! Customer, contract, and commission created."); },
    onError: (e) => toast.error(e.message),
  });
  const createMyLead = trpc.leads.createMyLead.useMutation({
    onSuccess: () => {
      utils.leads.myLeads.invalidate();
      setShowAddLead(false);
      setNewLeadForm({ businessName: "", contactName: "", email: "", phone: "", industry: "", website: "", notes: "" });
      toast.success("Self-sourced lead added! It's auto-assigned to you with double commission.");
    },
    onError: (e) => toast.error(e.message),
  });

  // SMS opt-in mutation
  const recordSmsOptIn = trpc.leadGen.recordSmsOptIn.useMutation({
    onSuccess: (data) => {
      utils.leads.myLeads.invalidate();
      if (data.alreadyOptedIn) {
        toast.info("Lead was already opted in.");
      } else {
        toast.success("SMS consent recorded successfully!");
      }
      setShowSmsOptIn(false);
      if (selectedLead) setSelectedLead({ ...selectedLead, smsOptIn: true });
    },
    onError: (e) => toast.error(e.message),
  });

  // State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSmsOptIn, setShowSmsOptIn] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showCloseDeal, setShowCloseDeal] = useState(false);
  const [proposalResult, setProposalResult] = useState<any>(null);
  const [closeForm, setCloseForm] = useState({ packageTier: "starter" as string, monthlyPrice: "99", notes: "", discountPercent: 0 });
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ businessName: "", contactName: "", email: "", phone: "", industry: "", website: "", notes: "" });
  const [proposalTier, setProposalTier] = useState("starter");
  const [proposalNotes, setProposalNotes] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const s of PIPELINE_STAGES) grouped[s.key] = [];
    grouped["closed_won"] = [];
    grouped["closed_lost"] = [];
    for (const lead of myLeads as Lead[]) {
      if (grouped[lead.stage]) grouped[lead.stage].push(lead);
    }
    return grouped;
  }, [myLeads]);

  const activeCount = useMemo(() => PIPELINE_STAGES.reduce((sum, s) => sum + (leadsByStage[s.key]?.length || 0), 0), [leadsByStage]);
  const wonCount = leadsByStage["closed_won"]?.length || 0;
  const lostCount = leadsByStage["closed_lost"]?.length || 0;

  /* ─── Drag handlers ─── */
  const handleDragStart = (leadId: number) => setDraggedLeadId(leadId);
  const handleDragEnd = () => setDraggedLeadId(null);
  const handleDrop = (targetStage: string) => {
    if (!draggedLeadId) return;
    const lead = (myLeads as Lead[]).find((l) => l.id === draggedLeadId);
    if (!lead || lead.stage === targetStage) { setDraggedLeadId(null); return; }
    // Only allow forward movement in pipeline
    const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === lead.stage);
    const targetIdx = PIPELINE_STAGES.findIndex((s) => s.key === targetStage);
    if (currentIdx === -1 || targetIdx === -1 || targetIdx <= currentIdx) {
      toast.error("You can only move leads forward in the pipeline");
      setDraggedLeadId(null);
      return;
    }
    updateLead.mutate({ leadId: draggedLeadId, stage: targetStage as any });
    setDraggedLeadId(null);
  };

  /* ─── Proposal generation ─── */
  const handleGenerateProposal = () => {
    if (!selectedLead) return;
    setProposalResult(null);
    generateProposal.mutate(
      { leadId: selectedLead.id, packageTier: proposalTier as any, customNotes: proposalNotes || undefined },
      {
        onSuccess: (data) => {
          setProposalResult(data);
          toast.success("Proposal generated!");
        },
      }
    );
  };

  /* ─── Close deal ─── */
  const handleCloseDeal = () => {
    if (!selectedLead) return;
    closeDeal.mutate({
      leadId: selectedLead.id,
      packageTier: closeForm.packageTier as any,
      monthlyPrice: closeForm.monthlyPrice,
      discountPercent: closeForm.discountPercent,
      notes: closeForm.notes || undefined,
    }, {
      onSuccess: () => {
        setShowCloseDeal(false);
        setShowDetail(false);
        setSelectedLead(null);
      },
    });
  };

  /* ─── Add self-sourced lead ─── */
  const handleAddMyLead = () => {
    if (!newLeadForm.businessName || !newLeadForm.contactName || !newLeadForm.email) {
      toast.error("Business name, contact name, and email are required");
      return;
    }
    createMyLead.mutate({
      businessName: newLeadForm.businessName,
      contactName: newLeadForm.contactName,
      email: newLeadForm.email,
      phone: newLeadForm.phone || undefined,
      industry: newLeadForm.industry || undefined,
      website: newLeadForm.website || undefined,
      notes: newLeadForm.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-graphite/20 animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-electric/5 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif text-off-white">My Pipeline</h2>
          <p className="text-xs text-soft-gray font-sans mt-0.5">
            {activeCount} active &bull; {wonCount} won &bull; {lostCount} lost
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddLead(true)}
            className="bg-electric hover:bg-electric/90 text-white font-sans text-sm rounded-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add My Lead
          </Button>
          <Button
            onClick={() => setShowPool(true)}
            variant="outline"
            className="text-off-white border-electric/20 hover:bg-electric/10 font-sans text-sm rounded-full"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Claim Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex overflow-x-auto gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0">
        {PIPELINE_STAGES.map((stage) => {
          const leads = leadsByStage[stage.key] || [];
          return (
            <div
              key={stage.key}
              className={`rounded-xl border border-border/40 overflow-hidden transition-all min-w-[240px] sm:min-w-0 ${
                draggedLeadId ? "ring-2 ring-electric/20" : ""
              }`}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-electric/50"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-electric/50"); }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("ring-2", "ring-electric/50"); handleDrop(stage.key); }}
            >
              {/* Column header */}
              <div className={`${stage.headerBg} px-4 py-3 border-b border-border/30`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] font-sans ${stage.color}`}>{stage.label}</Badge>
                    <span className="text-xs text-soft-gray/60 font-sans">{leads.length}</span>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-2">
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-soft-gray/40">
                      <Target className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-sans">No leads</p>
                    </div>
                  ) : (
                    leads.map((lead) => {
                      const ti = tempMeta[lead.temperature] || tempMeta.cold;
                      const TempIcon = ti.icon;
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 rounded-lg border border-border/30 bg-charcoal hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                            draggedLeadId === lead.id ? "opacity-40 scale-95" : ""
                          }`}
                          onClick={() => { setSelectedLead(lead); setShowDetail(true); }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-off-white font-sans truncate">{lead.businessName}</p>
                              <p className="text-[11px] text-soft-gray font-sans truncate">{lead.contactName}</p>
                            </div>
                            <GripVertical className="h-4 w-4 text-soft-gray/40 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${ti.bg}`}>
                              <TempIcon className={`h-2.5 w-2.5 ${ti.color}`} />
                              <span className={ti.color}>{lead.temperature}</span>
                            </div>
                            <span className="text-[10px] text-soft-gray/40 font-sans">{lead.qualificationScore}/100</span>
                            {lead.enrichmentData && Object.keys(lead.enrichmentData).length > 0 && (
                              <Sparkles className="h-3 w-3 text-electric/50" />
                            )}
                          </div>
                          {lead.lastTouchAt && (
                            <p className="text-[10px] text-soft-gray/40 font-sans mt-1.5">
                              Last touch: {new Date(lead.lastTouchAt).toLocaleDateString()}
                            </p>
                          )}
                          {(lead.totalCostCents ?? 0) > 0 && (
                            <p className="text-[10px] text-amber-400/70 font-sans mt-1">
                              <DollarSign className="h-2.5 w-2.5 inline mr-0.5" />
                              {((lead.totalCostCents ?? 0) / 100).toFixed(2)} spent
                            </p>
                          )}
                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                            {lead.email && (
                              <button
                                onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.email}`; }}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-soft-gray/60 hover:text-blue-600 transition-colors" title="Send Email"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {lead.phone && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
                                  className="p-1.5 rounded-md hover:bg-green-50 text-soft-gray/60 hover:text-emerald-400 transition-colors" title="Call"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!lead.smsOptIn) {
                                      toast.error("SMS opt-in required. Record consent in lead details first.");
                                      return;
                                    }
                                    window.location.href = `sms:${lead.phone}`;
                                  }}
                                  className={`p-1.5 rounded-md transition-colors ${lead.smsOptIn ? "hover:bg-purple-50 text-soft-gray/60 hover:text-purple-600" : "text-soft-gray/30 cursor-not-allowed"}`}
                                  title={lead.smsOptIn ? "Send SMS" : "SMS opt-in required"}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowDetail(true); }}
                              className="p-1.5 rounded-md hover:bg-electric/10 text-soft-gray/60 hover:text-electric transition-colors ml-auto" title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Closed Deals Summary */}
      {(wonCount > 0 || lostCount > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {CLOSED_STAGES.map((cs) => (
            <Card key={cs.key} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif text-off-white flex items-center gap-2">
                  {cs.key === "closed_won" ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  {cs.label} ({leadsByStage[cs.key]?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(leadsByStage[cs.key] || []).length === 0 ? (
                  <p className="text-xs text-soft-gray/60 font-sans">None yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {(leadsByStage[cs.key] || []).slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between text-sm font-sans p-2 rounded border border-border/20">
                        <span className="text-off-white">{lead.businessName}</span>
                        <span className="text-xs text-soft-gray/60">{lead.contactName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ Lead Detail Dialog ═══ */}
      <Dialog open={showDetail} onOpenChange={(open) => { setShowDetail(open); if (!open) setSelectedLead(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white">{selectedLead?.businessName}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 font-sans">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-soft-gray text-xs">Contact</span><p className="text-off-white">{selectedLead.contactName}</p></div>
                <div><span className="text-soft-gray text-xs">Email</span><p className="text-off-white">{selectedLead.email}</p></div>
                <div><span className="text-soft-gray text-xs">Phone</span><p className="text-off-white">{selectedLead.phone || "—"}</p></div>
                <div><span className="text-soft-gray text-xs">Industry</span><p className="text-off-white">{selectedLead.industry || "—"}</p></div>
                <div><span className="text-soft-gray text-xs">Score</span><p className="text-off-white">{selectedLead.qualificationScore}/100</p></div>
                <div><span className="text-soft-gray text-xs">Website</span><p className="text-off-white truncate">{selectedLead.website || "—"}</p></div>
              </div>

              <Separator />

              {/* Stage & Temperature controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-soft-gray">Stage</label>
                  <Select
                    value={selectedLead.stage}
                    onValueChange={(val) => {
                      updateLead.mutate({ leadId: selectedLead.id, stage: val as any });
                      setSelectedLead({ ...selectedLead, stage: val });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-soft-gray">Temperature</label>
                  <Select
                    value={selectedLead.temperature}
                    onValueChange={(val) => {
                      updateLead.mutate({ leadId: selectedLead.id, temperature: val as any });
                      setSelectedLead({ ...selectedLead, temperature: val });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["cold", "warm", "hot"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <span className="text-xs text-soft-gray">Notes</span>
                  <p className="text-sm text-off-white/80 mt-1">{selectedLead.notes}</p>
                </div>
              )}

              {/* Enrichment */}
              {selectedLead.enrichmentData && Object.keys(selectedLead.enrichmentData).length > 0 && (
                <div className="border border-electric/20 rounded-lg p-3 bg-electric/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-electric" />
                    <span className="text-xs font-medium text-off-white">AI Enrichment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-soft-gray">Size</span><p className="text-off-white">{selectedLead.enrichmentData.companySize}</p></div>
                    <div><span className="text-soft-gray">Revenue</span><p className="text-off-white">{selectedLead.enrichmentData.estimatedRevenue}</p></div>
                    <div><span className="text-soft-gray">Rec. Package</span><Badge className="text-[10px] bg-electric/10 text-off-white capitalize">{selectedLead.enrichmentData.recommendedPackage}</Badge></div>
                    <div><span className="text-soft-gray">Online Presence</span><p className="text-off-white capitalize">{selectedLead.enrichmentData.onlinePresence}</p></div>
                  </div>
                </div>
              )}

              {/* Intelligence Card */}
              {(selectedLead as any).intelligenceCard && (
                <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-off-white">Intelligence Card</span>
                  </div>
                  {(() => {
                    const ic = (selectedLead as any).intelligenceCard as any;
                    return (
                      <div className="space-y-2 text-xs">
                        {ic.businessInfo?.websiteScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-soft-gray">Website Score</span>
                            <span className={`font-medium ${ic.businessInfo.websiteScore < 30 ? "text-red-400" : ic.businessInfo.websiteScore < 60 ? "text-yellow-400" : "text-green-400"}`}>
                              {ic.businessInfo.websiteScore}/100
                            </span>
                          </div>
                        )}
                        {ic.aiAnalysis?.recommendedPackage && (
                          <div className="flex items-center justify-between">
                            <span className="text-soft-gray">Recommended Package</span>
                            <Badge className="text-[10px] bg-electric/10 text-off-white capitalize">{ic.aiAnalysis.recommendedPackage} — ${ic.aiAnalysis.packagePrice}/mo</Badge>
                          </div>
                        )}
                        {ic.aiAnalysis?.roiEstimate && (
                          <div>
                            <span className="text-soft-gray">Est. Revenue Gain</span>
                            <p className="text-off-white">{ic.aiAnalysis.roiEstimate.monthlyRevenueIncrease}/mo</p>
                          </div>
                        )}
                        {ic.aiAnalysis?.painPoints?.length > 0 && (
                          <div>
                            <span className="text-soft-gray">Pain Points</span>
                            <ul className="text-off-white/80 mt-0.5 space-y-0.5">
                              {ic.aiAnalysis.painPoints.slice(0, 3).map((p: string, i: number) => (
                                <li key={i} className="flex items-start gap-1"><span className="text-amber-400 shrink-0">•</span>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ic.proposalUrl && (
                          <a href={ic.proposalUrl} target="_blank" rel="noopener noreferrer" className="text-electric underline underline-offset-2">
                            View Proposal →
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <Separator />

              {/* Economics strip */}
              {(selectedLead.totalCostCents ?? 0) > 0 && (
                <div className="rounded-lg p-3 bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs font-sans">
                  <span className="text-amber-400/80 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Company spend on this lead
                  </span>
                  <span className="text-amber-400 font-medium">${((selectedLead.totalCostCents ?? 0) / 100).toFixed(2)}</span>
                </div>
              )}

              {/* SMS Opt-In Status */}
              {selectedLead.phone && (
                <div className={`rounded-lg p-3 flex items-center justify-between ${
                  selectedLead.smsOptedOut
                    ? "bg-red-500/10 border border-red-500/20"
                    : selectedLead.smsOptIn
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-yellow-500/10 border border-yellow-500/20"
                }`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className={`h-4 w-4 ${
                      selectedLead.smsOptedOut ? "text-red-500" : selectedLead.smsOptIn ? "text-emerald-400" : "text-yellow-600"
                    }`} />
                    <span className={`text-xs font-sans font-medium ${
                      selectedLead.smsOptedOut ? "text-red-600" : selectedLead.smsOptIn ? "text-emerald-400" : "text-yellow-600"
                    }`}>
                      {selectedLead.smsOptedOut
                        ? "SMS: Opted Out"
                        : selectedLead.smsOptIn
                          ? "SMS: Opted In"
                          : "SMS: No Consent Recorded"}
                    </span>
                  </div>
                  {!selectedLead.smsOptIn && !selectedLead.smsOptedOut && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-7 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
                      onClick={() => setShowSmsOptIn(true)}
                    >
                      <ShieldCheck className="h-3 w-3 mr-1" /> Record Consent
                    </Button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-sans"
                  onClick={() => { setProposalTier(selectedLead.enrichmentData?.recommendedPackage || "starter"); setProposalNotes(""); setProposalResult(null); setShowProposal(true); }}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Generate Proposal
                </Button>
                <Button
                  size="sm"
                  className="text-xs font-sans bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const recPkg = selectedLead.enrichmentData?.recommendedPackage || "starter";
                    setCloseForm({ packageTier: recPkg, monthlyPrice: PACKAGE_PRICES[recPkg] || "99", notes: "", discountPercent: 0 });
                    setShowCloseDeal(true);
                  }}
                >
                  <Handshake className="h-3.5 w-3.5 mr-1.5" /> Close Deal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-sans"
                  onClick={() => { updateLead.mutate({ leadId: selectedLead.id, outcome: "no_answer" }); toast.info("Logged: no answer"); }}
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> Log Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-sans text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    updateLead.mutate({ leadId: selectedLead.id, stage: "closed_lost" as any, notes: "Marked as lost by rep" });
                    toast.info("Lead marked as lost.");
                    setShowDetail(false);
                  }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Mark Lost
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Lead Pool Dialog ═══ */}
      <Dialog open={showPool} onOpenChange={setShowPool}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white">Lead Pool — Claim a Lead</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-2">
            {(leadPool as Lead[]).length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-8 w-8 text-soft-gray/40 mx-auto mb-3" />
                <p className="text-sm text-soft-gray font-sans">No unassigned leads available right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(leadPool as Lead[]).map((lead) => {
                  const ti = tempMeta[lead.temperature] || tempMeta.cold;
                  const TempIcon = ti.icon;
                  return (
                    <div key={lead.id} className="p-4 rounded-lg border border-border/30 hover:bg-midnight-dark/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-off-white font-sans">{lead.businessName}</span>
                            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${ti.bg}`}>
                              <TempIcon className={`h-2.5 w-2.5 ${ti.color}`} />
                              <span className={ti.color}>{lead.temperature}</span>
                            </div>
                          </div>
                          <p className="text-xs text-soft-gray font-sans">{lead.contactName} &bull; {lead.industry || "Unknown industry"}</p>
                          <p className="text-[10px] text-soft-gray/40 font-sans mt-1">Score: {lead.qualificationScore}/100</p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 bg-electric hover:bg-electric/90 text-white font-sans text-xs rounded-full"
                          onClick={() => claimLead.mutate({ leadId: lead.id })}
                          disabled={claimLead.isPending}
                        >
                          {claimLead.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" /> Claim</>}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ═══ Proposal Generator Dialog ═══ */}
      <Dialog open={showProposal} onOpenChange={(open) => { setShowProposal(open); if (!open) setProposalResult(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-electric" /> AI Proposal Generator
            </DialogTitle>
          </DialogHeader>
          {!proposalResult ? (
            <div className="space-y-4 font-sans">
              <p className="text-sm text-soft-gray">
                Generate a personalized proposal for <strong>{selectedLead?.businessName}</strong>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-soft-gray">Package Tier</label>
                  <Select value={proposalTier} onValueChange={setProposalTier}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter ($195/mo)</SelectItem>
                      <SelectItem value="growth">Growth ($295/mo)</SelectItem>
                      <SelectItem value="premium">Pro ($395/mo)</SelectItem>
                      <SelectItem value="enterprise">Enterprise ($495/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-soft-gray">Custom Notes (optional)</label>
                <Textarea
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  placeholder="Any specific points to emphasize..."
                  className="h-20"
                />
              </div>
              <Button
                onClick={handleGenerateProposal}
                disabled={generateProposal.isPending}
                className="w-full bg-electric hover:bg-electric/90 text-white font-sans rounded-full"
              >
                {generateProposal.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating with AI...</span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate Proposal</span>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              <div className="border border-electric/20 rounded-xl p-4 bg-electric/5">
                <h3 className="text-sm font-medium text-off-white mb-2">{proposalResult.subject}</h3>
                <div className="text-sm text-off-white/80 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {proposalResult.plainTextContent}
                </div>
              </div>
              {proposalResult.keySellingPoints?.length > 0 && (
                <div>
                  <span className="text-xs text-soft-gray font-medium">Key Selling Points</span>
                  <ul className="mt-1 space-y-1">
                    {proposalResult.keySellingPoints.map((point: string, i: number) => (
                      <li key={i} className="text-xs text-soft-gray flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 font-sans text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(proposalResult.plainTextContent);
                    toast.success("Proposal copied to clipboard!");
                  }}
                >
                  Copy Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 font-sans text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(proposalResult.htmlContent);
                    toast.success("HTML copied to clipboard!");
                  }}
                >
                  Copy HTML
                </Button>
                <Button
                  size="sm"
                  className="flex-1 font-sans text-xs bg-electric hover:bg-electric/90 text-white"
                  onClick={() => { setProposalResult(null); }}
                >
                  Generate Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Close Deal Confirmation ═══ */}
      <AlertDialog open={showCloseDeal} onOpenChange={setShowCloseDeal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Handshake className="h-5 w-5 text-emerald-400" /> Close Deal — {selectedLead?.businessName}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-soft-gray font-sans text-sm">
              This will create a customer, contract, and commission record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 font-sans py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-soft-gray">Package</label>
                <Select value={closeForm.packageTier} onValueChange={(val) => setCloseForm({ ...closeForm, packageTier: val, monthlyPrice: PACKAGE_PRICES[val] || "99", discountPercent: closeForm.discountPercent })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-soft-gray">Monthly Price ($)</label>
                <Input
                  value={closeForm.monthlyPrice}
                  onChange={(e) => setCloseForm({ ...closeForm, monthlyPrice: e.target.value })}
                  type="number"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-soft-gray">Discount (0-5%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={closeForm.discountPercent}
                  onChange={(e) => setCloseForm({ ...closeForm, discountPercent: parseInt(e.target.value) })}
                  className="flex-1 accent-electric"
                />
                <span className="text-sm font-medium text-off-white min-w-[40px] text-right">
                  {closeForm.discountPercent}%
                </span>
              </div>
              {closeForm.discountPercent > 0 && (
                <p className="text-xs text-electric mt-1">
                  Final price: ${(parseFloat(closeForm.monthlyPrice) * (1 - closeForm.discountPercent / 100)).toFixed(2)}/mo
                </p>
              )}
            </div>
            {(selectedLead as any)?.selfSourced && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-800 font-medium">Self-sourced lead — you'll earn 2x commission!</span>
              </div>
            )}
            <div>
              <label className="text-xs text-soft-gray">Notes (optional)</label>
              <Textarea
                value={closeForm.notes}
                onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                placeholder="Deal notes..."
                className="h-16"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseDeal}
              disabled={closeDeal.isPending || !closeForm.monthlyPrice}
              className="bg-green-600 hover:bg-green-700 text-white font-sans text-sm"
            >
              {closeDeal.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Closing...</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirm Close</span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Add Self-Sourced Lead Dialog ═══ */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-electric" /> Add Your Own Lead
            </DialogTitle>
            <p className="text-xs text-soft-gray font-sans">Know someone who needs a website? Add them here for double commission!</p>
          </DialogHeader>
          <div className="space-y-3 font-sans">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" /> Self-sourced leads earn 2x commission rate
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-soft-gray">Business Name *</label>
                <Input value={newLeadForm.businessName} onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="text-xs text-soft-gray">Contact Name *</label>
                <Input value={newLeadForm.contactName} onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })} placeholder="John Smith" />
              </div>
            </div>
            <div>
              <label className="text-xs text-soft-gray">Email *</label>
              <Input value={newLeadForm.email} onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })} placeholder="john@acme.com" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-soft-gray">Phone</label>
                <Input value={newLeadForm.phone} onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="text-xs text-soft-gray">Industry</label>
                <Input value={newLeadForm.industry} onChange={(e) => setNewLeadForm({ ...newLeadForm, industry: e.target.value })} placeholder="Restaurant" />
              </div>
            </div>
            <div>
              <label className="text-xs text-soft-gray">Website (if any)</label>
              <Input value={newLeadForm.website} onChange={(e) => setNewLeadForm({ ...newLeadForm, website: e.target.value })} placeholder="https://acme.com" />
            </div>
            <div>
              <label className="text-xs text-soft-gray">Notes</label>
              <Textarea value={newLeadForm.notes} onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })} placeholder="How do you know them? What do they need?" className="h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLead(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={handleAddMyLead}
              disabled={createMyLead.isPending || !newLeadForm.businessName || !newLeadForm.contactName || !newLeadForm.email}
              className="bg-electric hover:bg-electric/90 text-white font-sans text-sm"
            >
              {createMyLead.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Adding...</span>
              ) : (
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Lead</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SMS Opt-In Consent Dialog ═══ */}
      <AlertDialog open={showSmsOptIn} onOpenChange={setShowSmsOptIn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-off-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-electric" /> Record SMS Consent
            </AlertDialogTitle>
            <AlertDialogDescription className="text-soft-gray font-sans text-sm">
              How did <strong>{selectedLead?.contactName}</strong> from <strong>{selectedLead?.businessName}</strong> give consent to receive SMS messages?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {[
              { method: "verbal_consent" as const, label: "Verbal Consent", desc: "Agreed on a call" },
              { method: "form_submission" as const, label: "Form Submission", desc: "Filled out a form" },
              { method: "reply_start" as const, label: "Reply START", desc: "Texted START to us" },
              { method: "manual" as const, label: "Other / Manual", desc: "Other documented consent" },
            ].map((opt) => (
              <Button
                key={opt.method}
                variant="outline"
                className="h-auto py-3 flex flex-col items-start text-left font-sans"
                disabled={recordSmsOptIn.isPending}
                onClick={() => {
                  if (!selectedLead) return;
                  recordSmsOptIn.mutate({ leadId: selectedLead.id, method: opt.method });
                }}
              >
                <span className="text-xs font-medium text-off-white">{opt.label}</span>
                <span className="text-[10px] text-soft-gray">{opt.desc}</span>
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-sans text-sm">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
