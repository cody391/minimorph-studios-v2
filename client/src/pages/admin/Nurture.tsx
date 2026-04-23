import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, MessageCircle, Calendar, Send, Sparkles, Loader2, Bell, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  check_in: "bg-blue-100 text-blue-700",
  support_request: "bg-yellow-100 text-yellow-700",
  update_request: "bg-purple-100 text-purple-700",
  feedback: "bg-green-100 text-green-700",
  upsell_attempt: "bg-terracotta/10 text-terracotta",
  renewal_outreach: "bg-forest/10 text-forest",
  report_delivery: "bg-cyan-100 text-cyan-700",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  opened: "bg-emerald-100 text-emerald-700",
  responded: "bg-teal-100 text-teal-700",
  resolved: "bg-forest/10 text-forest",
};

export default function Nurture() {
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showUpsellEmail, setShowUpsellEmail] = useState(false);
  const [generateForm, setGenerateForm] = useState({ customerId: "" });
  const [upsellForm, setUpsellForm] = useState({ customerId: "" });
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [form, setForm] = useState({ customerId: "", type: "check_in" as "check_in" | "support_request" | "update_request" | "feedback" | "upsell_attempt" | "renewal_outreach" | "report_delivery", subject: "", content: "", channel: "email" as "email" | "sms" | "in_app" | "phone" });

  const { data: logs, isLoading, refetch } = trpc.nurture.list.useQuery();
  const createLog = trpc.nurture.create.useMutation({
    onSuccess: () => { toast.success("Nurture log created"); refetch(); setShowCreate(false); },
    onError: (e) => toast.error(e.message),
  });
  const sendNotification = trpc.nurture.sendNotification.useMutation({
    onSuccess: () => { toast.success("Notification sent"); refetch(); setSendingId(null); },
    onError: (e) => { toast.error(`Send failed: ${e.message}`); setSendingId(null); },
  });
  const generateCheckIn = trpc.nurture.generateCheckIn.useMutation({
    onSuccess: (data) => {
      toast.success(`AI check-in generated: "${data.subject}"`);
      refetch();
      setShowGenerate(false);
      setGenerateForm({ customerId: "" });
    },
    onError: (e) => toast.error(`Generation failed: ${e.message}`),
  });
  const generateUpsellEmail = trpc.widgetCatalog.generateUpsellEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Upsell email generated: "${data.subject}"`);
      refetch();
      setShowUpsellEmail(false);
      setUpsellForm({ customerId: "" });
    },
    onError: (e) => toast.error(`Generation failed: ${e.message}`),
  });

  const handleSend = (id: number) => {
    setSendingId(id);
    sendNotification.mutate({ id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Customer Nurture</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">AI-managed check-ins, support, and relationship tracking during 12-month contracts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUpsellEmail(true)} variant="outline" className="border-terracotta/30 text-terracotta hover:bg-terracotta/5 font-sans text-sm">
            <TrendingUp className="h-4 w-4 mr-1" /> Upsell Email
          </Button>
          <Button onClick={() => setShowGenerate(true)} className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm">
            <Sparkles className="h-4 w-4 mr-1" /> AI Check-in
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-forest hover:bg-forest-light text-cream font-sans text-sm">
            <Plus className="h-4 w-4 mr-1" /> Log Activity
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Touches", value: logs?.length ?? 0, icon: MessageCircle },
          { label: "Check-ins", value: logs?.filter((l: any) => l.type === "check_in").length ?? 0, icon: Heart },
          { label: "Scheduled", value: logs?.filter((l: any) => l.status === "scheduled").length ?? 0, icon: Calendar },
          { label: "Sent", value: logs?.filter((l: any) => l.status === "sent" || l.status === "delivered").length ?? 0, icon: Bell },
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
        <CardHeader className="pb-3"><CardTitle className="text-base font-serif text-forest">Nurture Activity Log</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !logs?.length ? (
            <div className="text-center py-12">
              <Heart className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No nurture activity yet. Use "AI Check-in" to generate automated messages.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:bg-cream-dark/20 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[log.type] ?? "bg-gray-100 text-gray-600"}`}>
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-forest font-sans">{log.subject || "(no subject)"}</span>
                      <Badge className={`text-[10px] font-sans ${typeColors[log.type] ?? ""}`}>{log.type.replace(/_/g, " ")}</Badge>
                      <Badge className={`text-[10px] font-sans ${statusColors[log.status] ?? ""}`}>{log.status}</Badge>
                    </div>
                    <p className="text-xs text-forest/60 font-sans line-clamp-2">{log.content}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-forest/40 font-sans">Customer #{log.customerId}</span>
                      <span className="text-[10px] text-forest/40 font-sans">{log.channel}</span>
                      <span className="text-[10px] text-forest/40 font-sans">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {(log.status === "scheduled") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-terracotta hover:text-terracotta hover:bg-terracotta/10"
                        onClick={() => handleSend(log.id)}
                        disabled={sendingId === log.id}
                      >
                        {sendingId === log.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <><Send className="h-3 w-3 mr-1" /> Send</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generate Check-in Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-terracotta" /> AI-Generated Check-in
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-sans">
            <p className="text-sm text-forest/60">
              AI will generate a personalized check-in message for the customer based on their profile and health score.
            </p>
            <div>
              <label className="text-xs text-forest/50">Customer ID *</label>
              <Input type="number" value={generateForm.customerId} onChange={(e) => setGenerateForm({ ...generateForm, customerId: e.target.value })} placeholder="Enter customer ID" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => generateCheckIn.mutate({ customerId: parseInt(generateForm.customerId) })}
              disabled={!generateForm.customerId || generateCheckIn.isPending}
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm"
            >
              {generateCheckIn.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> Generate</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Upsell Email Dialog */}
      <Dialog open={showUpsellEmail} onOpenChange={setShowUpsellEmail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-terracotta" /> AI Upsell Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-sans">
            <p className="text-sm text-forest/60">
              AI will analyze the customer's business type, current package, and site performance to generate a personalized upsell email with 1-2 relevant widget/add-on recommendations.
            </p>
            <div>
              <label className="text-xs text-forest/50">Customer ID *</label>
              <Input type="number" value={upsellForm.customerId} onChange={(e) => setUpsellForm({ ...upsellForm, customerId: e.target.value })} placeholder="Enter customer ID" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpsellEmail(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => generateUpsellEmail.mutate({ customerId: parseInt(upsellForm.customerId) })}
              disabled={!upsellForm.customerId || generateUpsellEmail.isPending}
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans text-sm"
            >
              {generateUpsellEmail.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
              ) : (
                <><TrendingUp className="h-4 w-4 mr-1" /> Generate Upsell Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Log Activity Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-forest">Log Nurture Activity</DialogTitle></DialogHeader>
          <div className="space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-forest/50">Customer ID *</label>
                <Input type="number" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-forest/50">Type</label>
                <Select value={form.type} onValueChange={(val: any) => setForm({ ...form, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["check_in", "support_request", "update_request", "feedback", "upsell_attempt", "renewal_outreach", "report_delivery"].map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-forest/50">Subject *</label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Content</label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} />
            </div>
            <div>
              <label className="text-xs text-forest/50">Channel</label>
              <Select value={form.channel} onValueChange={(val: any) => setForm({ ...form, channel: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["email", "sms", "in_app", "phone"].map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              onClick={() => createLog.mutate({ ...form, customerId: parseInt(form.customerId) })}
              disabled={!form.customerId || !form.subject}
              className="bg-forest hover:bg-forest-light text-cream font-sans text-sm"
            >
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
