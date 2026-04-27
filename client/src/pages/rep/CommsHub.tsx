import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Mail, MessageSquare, Phone, Sparkles, Send, FileText,
  PhoneCall, PhoneOff, Mic, MicOff, Clock, Star, TrendingUp,
  AlertCircle, CheckCircle, ChevronRight, Brain, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface CommsHubProps {
  leads: any[];
  templates: any[];
  sentEmails: any[];
}

export default function CommsHub({ leads, templates, sentEmails }: CommsHubProps) {
  const [activeChannel, setActiveChannel] = useState<"email" | "sms" | "calls" | "coaching">("email");

  return (
    <div className="space-y-4">
      {/* Channel Switcher */}
      <div className="flex gap-2 p-1 bg-electric/5 rounded-xl">
        {[
          { key: "email" as const, label: "Email", icon: Mail },
          { key: "sms" as const, label: "SMS", icon: MessageSquare },
          { key: "calls" as const, label: "Calls", icon: Phone },
          { key: "coaching" as const, label: "AI Coach", icon: Brain },
        ].map((ch) => (
          <button
            key={ch.key}
            onClick={() => setActiveChannel(ch.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-sans transition-all ${
              activeChannel === ch.key
                ? "bg-charcoal text-off-white shadow-sm"
                : "text-soft-gray hover:text-electric hover:bg-charcoal/50"
            }`}
          >
            <ch.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{ch.label}</span>
          </button>
        ))}
      </div>

      {/* Channel Content */}
      {activeChannel === "email" && <EmailChannel leads={leads} templates={templates} sentEmails={sentEmails} />}
      {activeChannel === "sms" && <SmsChannel leads={leads} />}
      {activeChannel === "calls" && <CallsChannel leads={leads} />}
      {activeChannel === "coaching" && <CoachingChannel />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EMAIL CHANNEL
   ═══════════════════════════════════════════════════════ */
function EmailChannel({ leads, templates, sentEmails }: { leads: any[]; templates: any[]; sentEmails: any[] }) {
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const utils = trpc.useUtils();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-off-white">Email</h3>
        <Button onClick={() => setShowCompose(true)} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm">
          <Mail className="w-4 h-4 mr-2" /> Compose
        </Button>
      </div>

      {/* Quick AI Drafts */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs text-soft-gray font-sans mb-2">Quick AI Draft</p>
          <div className="flex flex-wrap gap-2">
            {["intro", "follow_up", "proposal", "close", "check_in"].map((p) => (
              <Button key={p} size="sm" variant="outline" onClick={() => { setShowCompose(true); }}
                className="text-xs border-border text-soft-gray hover:bg-electric/5 hover:border-electric/30 rounded-full">
                <Sparkles className="w-3 h-3 mr-1" /> {p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {templates?.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-sans text-soft-gray">Templates</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {templates.map((t: any) => (
                <button key={t.id} onClick={() => setShowCompose(true)}
                  className="p-2.5 rounded-lg border border-border/30 hover:bg-graphite/5 text-left transition-colors">
                  <Badge className="text-[9px] bg-electric/10 text-off-white capitalize mb-1">{t.category}</Badge>
                  <p className="text-xs font-sans text-off-white font-medium truncate">{t.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent Emails with Coaching Badges */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans text-soft-gray">Sent ({sentEmails?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!sentEmails?.length ? (
            <div className="text-center py-6">
              <Mail className="h-7 w-7 text-soft-gray/20 mx-auto mb-2" />
              <p className="text-xs text-soft-gray/60 font-sans">No emails sent yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sentEmails.map((e: any) => (
                <EmailRow key={e.id} email={e} onSelect={() => setSelectedEmail(e)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCompose && <ComposeEmailDialog open={showCompose} onClose={() => setShowCompose(false)} leads={leads} templates={templates} />}
      {selectedEmail && <EmailDetailDialog email={selectedEmail} onClose={() => setSelectedEmail(null)} />}
    </div>
  );
}

function EmailRow({ email, onSelect }: { email: any; onSelect: () => void }) {
  const { data: coaching } = trpc.repComms.getCoachingForMessage.useQuery(
    { communicationType: "email", referenceId: email.id },
    { enabled: !!email.id }
  );

  return (
    <button onClick={onSelect} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/20 hover:bg-graphite/5 transition-colors text-left">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans text-off-white font-medium truncate">{email.subject}</p>
        <p className="text-xs text-soft-gray font-sans">To: {email.recipientName || email.recipientEmail}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {coaching && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans ${
                  (coaching.overallScore ?? 0) >= 80 ? "bg-green-50 text-green-700" :
                  (coaching.overallScore ?? 0) >= 60 ? "bg-yellow-50 text-yellow-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  <Brain className="w-3 h-3" /> {coaching.overallScore}
                </div>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">AI Coach Score</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Badge className={`text-[10px] ${email.status === "sent" ? "bg-blue-50 text-blue-600" : email.status === "opened" ? "bg-green-50 text-emerald-400" : "bg-gray-50 text-gray-600"}`}>
          {email.status}
        </Badge>
      </div>
    </button>
  );
}

function EmailDetailDialog({ email, onClose }: { email: any; onClose: () => void }) {
  const { data: coaching, isLoading } = trpc.repComms.getCoachingForMessage.useQuery(
    { communicationType: "email", referenceId: email.id },
    { enabled: !!email.id }
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-off-white">{email.subject}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-soft-gray font-sans">
            To: {email.recipientName || email.recipientEmail} — {email.sentAt ? new Date(email.sentAt).toLocaleString() : ""}
          </div>
          <div className="p-4 bg-graphite/5 rounded-lg text-sm font-sans text-off-white/80 whitespace-pre-wrap">{email.body}</div>

          {/* AI Coaching Feedback */}
          {isLoading ? (
            <div className="p-4 bg-electric/10 rounded-lg animate-pulse"><p className="text-xs text-soft-gray/60">Loading AI feedback...</p></div>
          ) : coaching ? (
            <CoachingCard coaching={coaching} />
          ) : (
            <div className="p-3 bg-electric/10 rounded-lg text-center">
              <Brain className="w-5 h-5 text-soft-gray/30 mx-auto mb-1" />
              <p className="text-xs text-soft-gray/60 font-sans">AI coaching feedback pending...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   SMS CHANNEL
   ═══════════════════════════════════════════════════════ */
function SmsChannel({ leads }: { leads: any[] }) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const { data: threads, isLoading } = trpc.repComms.mySmsThreads.useQuery();

  if (selectedThread) {
    return <SmsThreadView phoneNumber={selectedThread} leads={leads} onBack={() => setSelectedThread(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-off-white">SMS Messages</h3>
        <Button onClick={() => setShowCompose(true)} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm">
          <MessageSquare className="w-4 h-4 mr-2" /> New SMS
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><p className="text-sm text-soft-gray/60 font-sans">Loading conversations...</p></div>
          ) : !threads?.length ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No SMS conversations yet</p>
              <p className="text-xs text-soft-gray/40 font-sans mt-1">Send your first text message to a lead</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {threads.map((thread: any) => (
                <button key={thread.phoneNumber} onClick={() => setSelectedThread(thread.phoneNumber)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-graphite/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-electric/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-soft-gray" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-off-white font-medium">{thread.phoneNumber}</p>
                    <p className="text-xs text-soft-gray font-sans truncate">{thread.lastMessage}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-soft-gray/60 font-sans">{thread.lastAt ? new Date(thread.lastAt).toLocaleDateString() : ""}</p>
                    <Badge className="text-[9px] bg-electric/10 text-electric mt-1">{thread.messages.length}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCompose && <ComposeSmsDialog open={showCompose} onClose={() => setShowCompose(false)} leads={leads} />}
    </div>
  );
}

function SmsBubble({ msg }: { msg: any }) {
  const { data: coaching } = trpc.repComms.getCoachingForMessage.useQuery(
    { communicationType: "sms", referenceId: msg.id },
    { enabled: !!msg.id && msg.direction === "outbound" }
  );
  const [showCoaching, setShowCoaching] = useState(false);

  return (
    <div className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[75%]">
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-sans ${
          msg.direction === "outbound"
            ? "bg-charcoal text-off-white rounded-br-md"
            : "bg-graphite/20 text-off-white rounded-bl-md"
        }`}>
          <p>{msg.body}</p>
          <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === "outbound" ? "text-white/50" : "text-soft-gray/40"}`}>
            <span className="text-[10px]">
              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              {msg.direction === "outbound" && msg.status && ` \u00b7 ${msg.status}`}
            </span>
            {coaching && (
              <button onClick={(e) => { e.stopPropagation(); setShowCoaching(!showCoaching); }}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] font-sans ${
                  (coaching.overallScore ?? 0) >= 80 ? "bg-green-500/30 text-green-100" :
                  (coaching.overallScore ?? 0) >= 60 ? "bg-yellow-500/30 text-yellow-100" :
                  "bg-red-500/30 text-red-100"
                }`}>
                <Brain className="w-2.5 h-2.5" /> {coaching.overallScore}
              </button>
            )}
          </div>
        </div>
        {showCoaching && coaching && (
          <div className="mt-1.5">
            <CoachingCard coaching={coaching} compact />
          </div>
        )}
      </div>
    </div>
  );
}

function SmsThreadView({ phoneNumber, leads, onBack }: { phoneNumber: string; leads: any[]; onBack: () => void }) {
  const { data: messages, isLoading } = trpc.repComms.smsThread.useQuery({ phoneNumber });
  const [newMessage, setNewMessage] = useState("");
  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendSms = trpc.repComms.sendSms.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.repComms.smsThread.invalidate({ phoneNumber });
      utils.repComms.mySmsThreads.invalidate();
      toast.success("SMS sent!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Find lead associated with this number
  const lead = leads?.find((l: any) => l.phone === phoneNumber);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reverse messages to show oldest first
  const sortedMessages = useMemo(() => [...(messages || [])].reverse(), [messages]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-soft-gray">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <p className="text-sm font-sans text-off-white font-medium">{lead?.contactName || phoneNumber}</p>
          <p className="text-xs text-soft-gray font-sans">{phoneNumber}{lead ? ` — ${lead.businessName}` : ""}</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
            {isLoading ? (
              <div className="text-center py-8"><p className="text-xs text-soft-gray/60">Loading...</p></div>
            ) : (
              <div className="space-y-3">
                {sortedMessages.map((msg: any) => (
                  <SmsBubble key={msg.id} msg={msg} />
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />
          <div className="p-3 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                  e.preventDefault();
                  sendSms.mutate({ toNumber: phoneNumber, body: newMessage, leadId: lead?.id });
                }
              }}
            />
            <Button
              onClick={() => sendSms.mutate({ toNumber: phoneNumber, body: newMessage, leadId: lead?.id })}
              disabled={sendSms.isPending || !newMessage.trim()}
              className="bg-electric hover:bg-electric-light text-white rounded-full"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComposeSmsDialog({ open, onClose, leads }: { open: boolean; onClose: () => void; leads: any[] }) {
  const [leadId, setLeadId] = useState<string>("");
  const [toNumber, setToNumber] = useState("");
  const [body, setBody] = useState("");
  const utils = trpc.useUtils();

  const sendSms = trpc.repComms.sendSms.useMutation({
    onSuccess: () => {
      toast.success("SMS sent!");
      utils.repComms.mySmsThreads.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSelectLead = (id: string) => {
    setLeadId(id);
    const lead = leads?.find((l: any) => l.id === Number(id));
    if (lead?.phone) setToNumber(lead.phone);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Send SMS</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {leads?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm">Send to Lead</Label>
              <Select value={leadId} onValueChange={handleSelectLead}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>{leads.filter((l: any) => l.phone).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.phone}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-off-white/80 text-sm">Phone Number *</Label>
            <Input value={toNumber} onChange={(e) => setToNumber(e.target.value)} placeholder="+1234567890" className="mt-1" />
          </div>
          <div>
            <Label className="text-off-white/80 text-sm">Message *</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message..." className="mt-1 min-h-[100px]" />
            <p className="text-[10px] text-soft-gray/60 font-sans mt-1">{body.length}/160 characters</p>
          </div>
          <Button
            onClick={() => sendSms.mutate({ toNumber, body, leadId: leadId ? Number(leadId) : undefined })}
            disabled={sendSms.isPending || !toNumber || !body}
            className="w-full bg-electric hover:bg-electric-light text-white rounded-full font-sans"
          >
            {sendSms.isPending ? "Sending..." : "Send SMS"} <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   CALLS CHANNEL
   ═══════════════════════════════════════════════════════ */
function CallsChannel({ leads }: { leads: any[] }) {
  const [showDialer, setShowDialer] = useState(false);
  const { data: callLogs, isLoading } = trpc.repComms.myCallLogs.useQuery();
  const { data: voiceToken } = trpc.repComms.getVoiceToken.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif text-off-white">Calls</h3>
        <div className="flex gap-2">
          {voiceToken?.error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className="text-[10px] bg-yellow-50 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" /> Setup needed</Badge>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs max-w-[200px]">{voiceToken.error}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button onClick={() => setShowDialer(true)} className="bg-electric hover:bg-electric-light text-white rounded-full font-sans text-sm">
            <PhoneCall className="w-4 h-4 mr-2" /> New Call
          </Button>
        </div>
      </div>

      {/* Call Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Calls", value: callLogs?.length || 0, icon: Phone },
          { label: "Completed", value: callLogs?.filter((c: any) => c.status === "completed").length || 0, icon: CheckCircle },
          { label: "Avg Duration", value: callLogs?.length ? `${Math.round((callLogs.reduce((s: number, c: any) => s + (c.duration || 0), 0) / callLogs.length) / 60)}m` : "0m", icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <s.icon className="w-5 h-5 text-electric mx-auto mb-1" />
              <p className="text-lg font-serif text-off-white">{s.value}</p>
              <p className="text-[10px] text-soft-gray font-sans">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call History */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans text-soft-gray">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center"><p className="text-xs text-soft-gray/60">Loading...</p></div>
          ) : !callLogs?.length ? (
            <div className="p-6 text-center">
              <Phone className="h-7 w-7 text-soft-gray/20 mx-auto mb-2" />
              <p className="text-xs text-soft-gray/60 font-sans">No calls yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {callLogs.map((call: any) => (
                <CallRow key={call.id} call={call} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showDialer && <DialerDialog open={showDialer} onClose={() => setShowDialer(false)} leads={leads} />}
    </div>
  );
}

function CallRow({ call }: { call: any }) {
  const [showDetail, setShowDetail] = useState(false);
  const { data: coaching } = trpc.repComms.getCoachingForMessage.useQuery(
    { communicationType: "call", referenceId: call.id },
    { enabled: !!call.id && call.status === "completed" }
  );

  const statusColors: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    in_progress: "bg-blue-50 text-blue-700",
    ringing: "bg-yellow-50 text-yellow-700",
    busy: "bg-orange-50 text-orange-700",
    no_answer: "bg-red-50 text-red-700",
    failed: "bg-red-50 text-red-700",
    initiated: "bg-gray-50 text-gray-700",
  };

  return (
    <>
      <button onClick={() => setShowDetail(true)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/20 hover:bg-graphite/5 transition-colors text-left">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${call.direction === "outbound" ? "bg-electric/10" : "bg-electric/10"}`}>
          {call.direction === "outbound" ? <PhoneCall className="w-4 h-4 text-soft-gray" /> : <Phone className="w-4 h-4 text-electric/60" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans text-off-white font-medium">{call.toNumber}</p>
          <p className="text-xs text-soft-gray font-sans">
            {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}` : "—"} · {call.direction}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {coaching && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans ${
              (coaching.overallScore ?? 0) >= 80 ? "bg-green-50 text-green-700" :
              (coaching.overallScore ?? 0) >= 60 ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            }`}>
              <Brain className="w-3 h-3" /> {coaching.overallScore}
            </div>
          )}
          {call.recordingUrl && <Mic className="w-3.5 h-3.5 text-soft-gray/40" />}
          <Badge className={`text-[10px] ${statusColors[call.status] || "bg-gray-50 text-gray-600"}`}>{call.status?.replace(/_/g, " ")}</Badge>
        </div>
      </button>

      {showDetail && (
        <Dialog open={true} onOpenChange={() => setShowDetail(false)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-serif text-off-white">Call Details</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div><span className="text-soft-gray">To:</span> <span className="text-off-white">{call.toNumber}</span></div>
                <div><span className="text-soft-gray">Direction:</span> <span className="text-off-white capitalize">{call.direction}</span></div>
                <div><span className="text-soft-gray">Duration:</span> <span className="text-off-white">{call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "—"}</span></div>
                <div><span className="text-soft-gray">Status:</span> <Badge className={`text-[10px] ${statusColors[call.status] || ""}`}>{call.status}</Badge></div>
              </div>

              {call.transcription && (
                <div>
                  <p className="text-xs text-soft-gray font-sans mb-2">Transcription</p>
                  <div className="p-3 bg-graphite/5 rounded-lg text-sm font-sans text-off-white/80 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {call.transcription}
                  </div>
                </div>
              )}

              {call.recordingUrl && (
                <div>
                  <p className="text-xs text-soft-gray font-sans mb-2">Recording</p>
                  <audio controls className="w-full" src={call.recordingUrl} />
                </div>
              )}

              {coaching ? <CoachingCard coaching={coaching} /> : (
                <div className="p-3 bg-electric/10 rounded-lg text-center">
                  <Brain className="w-5 h-5 text-soft-gray/30 mx-auto mb-1" />
                  <p className="text-xs text-soft-gray/60 font-sans">{call.status === "completed" ? "AI coaching feedback pending..." : "Coaching available after call completes"}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function DialerDialog({ open, onClose, leads }: { open: boolean; onClose: () => void; leads: any[] }) {
  const [leadId, setLeadId] = useState<string>("");
  const [toNumber, setToNumber] = useState("");
  const utils = trpc.useUtils();

  const initiateCall = trpc.repComms.initiateCall.useMutation({
    onSuccess: (data) => {
      toast.success(`Call initiated! +${data.pointsEarned} points`);
      utils.repComms.myCallLogs.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSelectLead = (id: string) => {
    setLeadId(id);
    const lead = leads?.find((l: any) => l.id === Number(id));
    if (lead?.phone) setToNumber(lead.phone);
  };

  // Dialpad
  const dialPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Make a Call</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {leads?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm">Call a Lead</Label>
              <Select value={leadId} onValueChange={handleSelectLead}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>{leads.filter((l: any) => l.phone).map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.phone}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <Input
            value={toNumber}
            onChange={(e) => setToNumber(e.target.value)}
            placeholder="+1234567890"
            className="text-center text-lg font-mono tracking-wider"
          />

          <div className="grid grid-cols-3 gap-2">
            {dialPad.map((key) => (
              <Button key={key} variant="outline" className="h-12 text-lg font-mono" onClick={() => setToNumber((p) => p + key)}>
                {key}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setToNumber((p) => p.slice(0, -1))}
              variant="outline" className="flex-1 rounded-full"
            >
              Delete
            </Button>
            <Button
              onClick={() => initiateCall.mutate({ toNumber, leadId: leadId ? Number(leadId) : undefined })}
              disabled={initiateCall.isPending || !toNumber}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              {initiateCall.isPending ? "Calling..." : "Call"} <PhoneCall className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   AI COACHING CHANNEL
   ═══════════════════════════════════════════════════════ */
function CoachingChannel() {
  const { data: feedback, isLoading } = trpc.repComms.myCoachingFeedback.useQuery();

  // Compute stats
  const avgScore = useMemo(() => {
    if (!feedback?.length) return 0;
    return Math.round(feedback.reduce((s: number, f: any) => s + (f.overallScore || 0), 0) / feedback.length);
  }, [feedback]);

  const byType = useMemo(() => {
    if (!feedback?.length) return { email: 0, sms: 0, call: 0 };
    const counts = { email: 0, sms: 0, call: 0 };
    feedback.forEach((f: any) => { if (f.communicationType in counts) counts[f.communicationType as keyof typeof counts]++; });
    return counts;
  }, [feedback]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-serif text-off-white">AI Communication Coach</h3>

      {/* Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <div className={`text-2xl font-serif ${avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {avgScore}
            </div>
            <p className="text-[10px] text-soft-gray font-sans">Avg Score</p>
          </CardContent>
        </Card>
        {[
          { label: "Emails", count: byType.email, icon: Mail },
          { label: "SMS", count: byType.sms, icon: MessageSquare },
          { label: "Calls", count: byType.call, icon: Phone },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <s.icon className="w-4 h-4 text-electric mx-auto mb-1" />
              <p className="text-lg font-serif text-off-white">{s.count}</p>
              <p className="text-[10px] text-soft-gray font-sans">{s.label} Reviewed</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Feedback */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans text-soft-gray">Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-center"><p className="text-xs text-soft-gray/60">Loading...</p></div>
          ) : !feedback?.length ? (
            <div className="p-6 text-center">
              <Brain className="h-8 w-8 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No coaching feedback yet</p>
              <p className="text-xs text-soft-gray/40 font-sans mt-1">Send emails, texts, or make calls to get AI feedback</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((f: any) => (
                <CoachingCard key={f.id} coaching={f} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED COACHING CARD
   ═══════════════════════════════════════════════════════ */
function CoachingCard({ coaching, compact }: { coaching: any; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = (coaching.overallScore ?? 0) >= 80 ? "text-emerald-400 bg-green-50" :
    (coaching.overallScore ?? 0) >= 60 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";

  const toneColors: Record<string, string> = {
    professional: "bg-blue-50 text-blue-700",
    friendly: "bg-green-50 text-green-700",
    aggressive: "bg-red-50 text-red-700",
    passive: "bg-gray-50 text-gray-700",
    confident: "bg-purple-50 text-purple-700",
    uncertain: "bg-yellow-50 text-yellow-700",
  };

  const typeIcons: Record<string, any> = { email: Mail, sms: MessageSquare, call: Phone };
  const TypeIcon = typeIcons[coaching.communicationType] || Mail;

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-3 hover:bg-graphite/5 transition-colors text-left">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scoreColor}`}>
          <span className="text-sm font-serif font-bold">{coaching.overallScore}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-3.5 h-3.5 text-soft-gray/60" />
            <span className="text-xs text-soft-gray font-sans capitalize">{coaching.communicationType}</span>
            {coaching.toneAnalysis && (
              <Badge className={`text-[9px] ${toneColors[coaching.toneAnalysis] || ""}`}>{coaching.toneAnalysis}</Badge>
            )}
          </div>
          {compact && coaching.keyTakeaways?.[0] && (
            <p className="text-xs text-soft-gray font-sans mt-0.5 truncate">{coaching.keyTakeaways[0]}</p>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-soft-gray/40 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <Separator />

          {/* Strengths */}
          {coaching.strengths?.length > 0 && (
            <div>
              <p className="text-xs text-emerald-400 font-sans font-medium mb-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Strengths
              </p>
              <ul className="space-y-1">
                {(coaching.strengths as string[]).map((s: string, i: number) => (
                  <li key={i} className="text-xs text-soft-gray font-sans pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-400">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {coaching.improvements?.length > 0 && (
            <div>
              <p className="text-xs text-orange-600 font-sans font-medium mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Areas to Improve
              </p>
              <ul className="space-y-1">
                {(coaching.improvements as string[]).map((s: string, i: number) => (
                  <li key={i} className="text-xs text-soft-gray font-sans pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-orange-500">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Feedback */}
          {coaching.detailedFeedback && (
            <div>
              <p className="text-xs text-soft-gray font-sans font-medium mb-1">Detailed Feedback</p>
              <div className="text-xs text-soft-gray font-sans whitespace-pre-wrap leading-relaxed">{coaching.detailedFeedback}</div>
            </div>
          )}

          {/* Suggested Follow-up */}
          {coaching.suggestedFollowUp && (
            <div className="p-2.5 bg-electric/10 rounded-lg">
              <p className="text-xs text-off-white font-sans font-medium mb-0.5">Suggested Follow-up</p>
              <p className="text-xs text-soft-gray font-sans">{coaching.suggestedFollowUp}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPOSE EMAIL DIALOG (kept from original, enhanced)
   ═══════════════════════════════════════════════════════ */
function ComposeEmailDialog({ open, onClose, leads, templates }: { open: boolean; onClose: () => void; leads: any[]; templates: any[] }) {
  const [leadId, setLeadId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const utils = trpc.useUtils();

  const sendEmail = trpc.repComms.sendEmail.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Email ${data.delivered ? "sent & delivered" : "sent (delivery pending)"}! +${data.pointsEarned} points`);
      utils.repComms.mySentEmails.invalidate();
      utils.repActivity.myActivities.invalidate();
      utils.repGamification.myStats.invalidate();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const generateEmail = trpc.repComms.generateEmail.useMutation({
    onSuccess: (data: any) => { setSubject(data.subject); setBody(data.body); setGenerating(false); toast.success("AI draft generated!"); },
    onError: (err: any) => { setGenerating(false); toast.error(err.message); },
  });

  const handleGenerate = (purpose: string) => {
    setGenerating(true);
    generateEmail.mutate({ leadId: leadId ? Number(leadId) : undefined, purpose: purpose as any, additionalContext: "" });
  };

  const handleSelectLead = (id: string) => {
    setLeadId(id);
    const lead = leads?.find((l: any) => l.id === Number(id));
    if (lead) { setRecipientEmail(lead.email); setRecipientName(lead.contactName); }
  };

  const handleSelectTemplate = (t: any) => { setSubject(t.subject); setBody(t.body); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-off-white">Compose Email</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {leads?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm">Send to Lead</Label>
              <Select value={leadId} onValueChange={handleSelectLead}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a lead" /></SelectTrigger>
                <SelectContent>{leads.map((l: any) => <SelectItem key={l.id} value={String(l.id)}>{l.businessName} — {l.contactName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-off-white/80 text-sm">Recipient Email *</Label><Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="email@example.com" className="mt-1" /></div>
            <div><Label className="text-off-white/80 text-sm">Recipient Name</Label><Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Smith" className="mt-1" /></div>
          </div>

          <div>
            <Label className="text-off-white/80 text-sm mb-2 block">AI Generate Draft</Label>
            <div className="flex flex-wrap gap-2">
              {["intro", "follow_up", "proposal", "close", "check_in"].map((p) => (
                <Button key={p} size="sm" variant="outline" onClick={() => handleGenerate(p)} disabled={generating}
                  className="text-xs border-border text-soft-gray hover:bg-electric/5 hover:border-electric/30 rounded-full">
                  <Sparkles className="w-3 h-3 mr-1" /> {p.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          {templates?.length > 0 && (
            <div>
              <Label className="text-off-white/80 text-sm mb-2 block">Or Use Template</Label>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((t: any) => (
                  <Button key={t.id} size="sm" variant="outline" onClick={() => handleSelectTemplate(t)} className="text-xs border-border text-soft-gray rounded-full">
                    <FileText className="w-3 h-3 mr-1" /> {t.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div><Label className="text-off-white/80 text-sm">Subject *</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="mt-1" /></div>
          <div><Label className="text-off-white/80 text-sm">Body *</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." className="mt-1 min-h-[150px]" /></div>

          <Button onClick={() => sendEmail.mutate({ leadId: leadId ? Number(leadId) : undefined, recipientEmail, recipientName: recipientName || undefined, subject, body })}
            disabled={sendEmail.isPending || !recipientEmail || !subject || !body}
            className="w-full bg-electric hover:bg-electric-light text-white rounded-full font-sans">
            {sendEmail.isPending ? "Sending..." : "Send Email"} <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
