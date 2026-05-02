import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Headphones, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/20 text-red-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-zinc-500/20 text-zinc-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-zinc-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

function TicketRow({ ticket, refetch }: { ticket: any; refetch: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState("");

  const { data: replies } = trpc.support.getReplies.useQuery({ ticketId: ticket.id }, { enabled: expanded });

  const replyMut = trpc.support.replyToTicket.useMutation({
    onSuccess: () => { setReply(""); refetch(); toast.success("Reply sent"); },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.support.updateTicketStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="font-medium text-sm text-foreground truncate">{ticket.subject}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Customer #{ticket.customerId} · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <span className={`text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
          <Badge className={`text-xs ${STATUS_COLORS[ticket.status]}`}>{ticket.status.replace("_", " ")}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          <div className="text-sm text-muted-foreground bg-white/5 rounded p-3">{ticket.body}</div>

          {replies && replies.length > 0 && (
            <div className="space-y-2">
              {replies.map((r: any) => (
                <div key={r.id} className={`rounded p-3 text-sm ${r.authorRole === "admin" ? "bg-electric/10 border border-electric/20 ml-8" : "bg-white/5"}`}>
                  <div className="text-xs font-medium mb-1 text-muted-foreground capitalize">{r.authorRole}</div>
                  {r.body}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Select value={ticket.status} onValueChange={(v) => updateStatus.mutate({ ticketId: ticket.id, status: v as any })}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="text-sm min-h-[80px]"
            />
            <Button
              size="sm"
              onClick={() => replyMut.mutate({ ticketId: ticket.id, body: reply })}
              disabled={!reply.trim() || replyMut.isPending}
            >
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: tickets, refetch } = trpc.support.listAllTickets.useQuery();

  const filtered = tickets?.filter(t => statusFilter === "all" || t.status === statusFilter) ?? [];

  const openCount = tickets?.filter(t => t.status === "open").length ?? 0;
  const inProgressCount = tickets?.filter(t => t.status === "in_progress").length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Headphones className="w-6 h-6 text-electric" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Customer support requests</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card className="border-white/10 bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{openCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Open</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{inProgressCount}</div>
            <div className="text-xs text-muted-foreground mt-1">In Progress</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            All Tickets
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No tickets found</div>
          ) : (
            filtered.map(t => <TicketRow key={t.id} ticket={t} refetch={refetch} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
