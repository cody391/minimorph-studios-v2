import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Radio, Send, Users } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400",
  sending: "bg-yellow-500/20 text-yellow-400",
  sent: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

const AUDIENCE_LABELS: Record<string, string> = {
  all_customers: "All Customers",
  active_contracts: "Active Contracts",
  all_reps: "All Reps",
  all_leads: "All Leads",
};

export default function Broadcasts() {
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState<string>("all_customers");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { data: broadcasts, refetch } = trpc.broadcasts.list.useQuery();

  const sendMut = trpc.broadcasts.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.recipientCount} recipients`);
      setSubject("");
      setBody("");
      setConfirming(false);
      refetch();
    },
    onError: (e) => { toast.error(e.message); setConfirming(false); },
  });

  const handleSend = () => {
    if (!confirming) { setConfirming(true); return; }
    sendMut.mutate({ subject, audience: audience as any, body });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="w-6 h-6 text-electric" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broadcasts</h1>
          <p className="text-sm text-muted-foreground">Send bulk emails to customers, reps, or leads</p>
        </div>
      </div>

      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="w-4 h-4" />
            New Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_customers">All Customers</SelectItem>
                  <SelectItem value="active_contracts">Active Contracts</SelectItem>
                  <SelectItem value="all_reps">All Reps</SelectItem>
                  <SelectItem value="all_leads">All Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." className="min-h-[160px] text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSend}
              disabled={!subject.trim() || !body.trim() || sendMut.isPending}
              variant={confirming ? "destructive" : "default"}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {confirming ? "Confirm — Send Now" : "Send Broadcast"}
            </Button>
            {confirming && (
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
            )}
            {confirming && (
              <span className="text-xs text-yellow-400">This will email all {AUDIENCE_LABELS[audience]}. Are you sure?</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!broadcasts || broadcasts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No broadcasts sent yet</div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{b.subject}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {AUDIENCE_LABELS[b.audience]} · {b.recipientCount} recipients
                      {b.sentAt && ` · ${format(new Date(b.sentAt), "MMM d, yyyy h:mm a")}`}
                    </div>
                  </div>
                  <Badge className={`ml-4 text-xs flex-shrink-0 ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
