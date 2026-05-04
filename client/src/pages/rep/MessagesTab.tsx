import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function MessagesTab({ repId }: { repId: number }) {
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading } = trpc.repMessages.listMine.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: unread } = trpc.repMessages.countUnreadForRep.useQuery();
  const send = trpc.repMessages.send.useMutation({
    onSuccess: () => {
      setBody("");
      utils.repMessages.listMine.invalidate();
      utils.repMessages.countUnreadForRep.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const markRead = trpc.repMessages.markReadByRep.useMutation({
    onSuccess: () => utils.repMessages.countUnreadForRep.invalidate(),
  });

  useEffect(() => {
    if ((messages as any[]).some((m: any) => m.senderRole === "admin" && !m.readAt)) {
      markRead.mutate();
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const unreadCount = unread?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-electric" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <p className="text-xs text-muted-foreground">Direct line to MiniMorph admin team</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-electric text-white text-xs">{unreadCount} new</Badge>
        )}
      </div>

      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-2 border-b border-white/5">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-electric" />
            MiniMorph Admin Team
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Message thread */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-3 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (messages as any[]).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Send a message to your admin team below</p>
              </div>
            ) : (
              (messages as any[]).map((msg: any) => {
                const isAdmin = msg.senderRole === "admin";
                const isUnread = isAdmin && !msg.readAt;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      isAdmin
                        ? `bg-midnight-dark/60 border ${isUnread ? "border-electric/30 bg-electric/5" : "border-white/10"} text-foreground`
                        : "bg-electric text-white"
                    }`}>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield className="w-3 h-3 text-electric" />
                          <span className="text-[10px] font-medium text-electric">Admin</span>
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-electric" />}
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className={`text-[10px] mt-1 ${isAdmin ? "text-muted-foreground" : "text-white/60"}`}>
                        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="border-t border-white/5 p-4 space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message to your admin team..."
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && body.trim()) {
                  send.mutate({ body: body.trim() });
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">⌘+Enter to send</p>
              <Button
                size="sm"
                className="bg-electric hover:bg-electric-light text-white text-xs rounded-full px-4"
                onClick={() => { if (body.trim()) send.mutate({ body: body.trim() }); }}
                disabled={!body.trim() || send.isPending}
              >
                {send.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
