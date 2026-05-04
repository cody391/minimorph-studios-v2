import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: allMessages = [], isLoading } = trpc.repMessages.listAll.useQuery(undefined, {
    refetchInterval: 20000,
  });
  const { data: reps = [] } = trpc.reps.list.useQuery();

  const reply = trpc.repMessages.adminReply.useMutation({
    onSuccess: () => {
      setBody("");
      utils.repMessages.listAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const markRead = trpc.repMessages.markRead.useMutation({
    onSuccess: () => utils.repMessages.listAll.invalidate(),
  });

  const msgs = allMessages as any[];

  // Build per-rep thread summaries
  const repIds = Array.from(new Set(msgs.map((m: any) => m.repId))) as number[];
  const threads = repIds.map(repId => {
    const threadMsgs = msgs.filter((m: any) => m.repId === repId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const rep = (reps as any[]).find((r: any) => r.id === repId);
    const unread = threadMsgs.filter((m: any) => m.senderRole === "rep" && !m.readAt).length;
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    return { repId, rep, threadMsgs, unread, lastMsg };
  }).sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    return new Date(b.lastMsg?.createdAt ?? 0).getTime() - new Date(a.lastMsg?.createdAt ?? 0).getTime();
  });

  const selectedThread = threads.find(t => t.repId === selectedRepId);

  useEffect(() => {
    if (selectedRepId) {
      const unreadIds = selectedThread?.threadMsgs
        .filter((m: any) => m.senderRole === "rep" && !m.readAt)
        .map((m: any) => m.id) ?? [];
      for (const id of unreadIds) markRead.mutate({ id });
    }
  }, [selectedRepId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.threadMsgs.length]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-electric" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rep Messages</h1>
          <p className="text-sm text-muted-foreground">Direct messages from your rep team</p>
        </div>
        {totalUnread > 0 && (
          <Badge className="bg-electric text-white">{totalUnread} unread</Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-0 h-[600px] border border-white/10 rounded-xl overflow-hidden">
        {/* Thread list */}
        <div className="col-span-1 border-r border-white/10 overflow-y-auto bg-card">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />)}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {threads.map(t => (
                <div
                  key={t.repId}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedRepId === t.repId ? "bg-electric/10 border-r-2 border-electric" : ""}`}
                  onClick={() => setSelectedRepId(t.repId)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {t.rep?.fullName || `Rep #${t.repId}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.lastMsg?.body?.slice(0, 50) ?? "No messages"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {t.unread > 0 && (
                        <Badge className="bg-electric text-white text-[9px] px-1.5 h-4">{t.unread}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {t.lastMsg?.createdAt ? formatDistanceToNow(new Date(t.lastMsg.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation panel */}
        <div className="col-span-2 flex flex-col bg-midnight-dark/30">
          {!selectedRepId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ChevronRight className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a conversation to view</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-electric" />
                <span className="text-sm font-medium text-foreground">
                  {selectedThread?.rep?.fullName || `Rep #${selectedRepId}`}
                </span>
                <span className="text-xs text-muted-foreground">{selectedThread?.rep?.email}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(selectedThread?.threadMsgs ?? []).map((msg: any) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAdmin ? "bg-electric text-white" : "bg-card border border-white/10 text-foreground"
                      }`}>
                        <p className="leading-relaxed">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? "text-white/60" : "text-muted-foreground"}`}>
                          {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <div className="border-t border-white/5 p-4 space-y-2">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Reply to ${selectedThread?.rep?.fullName ?? "rep"}...`}
                  className="min-h-[72px] text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) {
                      reply.mutate({ repId: selectedRepId, body: body.trim() });
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">⌘+Enter to send</p>
                  <Button
                    size="sm"
                    className="bg-electric hover:bg-electric-light text-white text-xs rounded-full px-4"
                    onClick={() => { if (body.trim()) reply.mutate({ repId: selectedRepId, body: body.trim() }); }}
                    disabled={!body.trim() || reply.isPending}
                  >
                    {reply.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
