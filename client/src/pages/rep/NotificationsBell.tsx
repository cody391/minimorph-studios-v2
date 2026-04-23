import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell, Target, DollarSign, GraduationCap,
  Handshake, Gift, AlertCircle, Check, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, { icon: any; color: string }> = {
  lead_assigned: { icon: Target, color: "text-purple-500" },
  lead_claimed: { icon: Target, color: "text-blue-500" },
  deal_closed: { icon: Handshake, color: "text-green-500" },
  commission_approved: { icon: DollarSign, color: "text-green-600" },
  training_reminder: { icon: GraduationCap, color: "text-amber-500" },
  referral_bonus: { icon: Gift, color: "text-pink-500" },
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: notifications = [], isLoading, isError, error } = trpc.repNotifications.list.useQuery({ limit: 20 });
  const { data: unreadData } = trpc.repNotifications.unreadCount.useQuery();
  const markRead = trpc.repNotifications.markRead.useMutation({
    onSuccess: () => {
      utils.repNotifications.list.invalidate();
      utils.repNotifications.unreadCount.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleMarkAllRead = () => {
    markRead.mutate({});
    toast.success("All notifications marked as read");
  };

  const handleMarkOneRead = (id: number) => {
    markRead.mutate({ ids: [id] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative text-white border-white/20 hover:bg-white/10 font-sans text-sm rounded-full h-9 w-9 p-0"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="text-sm font-serif text-forest">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-forest/50 hover:text-forest font-sans h-7 px-2"
              onClick={handleMarkAllRead}
              disabled={markRead.isPending}
            >
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[360px]">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 text-forest/30 mx-auto mb-2 animate-spin" />
              <p className="text-xs text-forest/40 font-sans">Loading notifications...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-500 font-sans">Failed to load notifications</p>
              <p className="text-[10px] text-forest/40 font-sans mt-1">{error?.message || "Please try again later"}</p>
            </div>
          ) : (notifications as any[]).length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-8 w-8 text-forest/15 mx-auto mb-3" />
              <p className="text-sm text-forest/40 font-sans">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {(notifications as any[]).map((n: any) => {
                const meta = typeIcons[n.type] || { icon: AlertCircle, color: "text-forest/50" };
                const Icon = meta.icon;
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-cream-dark/30 transition-colors cursor-pointer ${isUnread ? "bg-terracotta/5" : ""}`}
                    onClick={() => { if (isUnread) handleMarkOneRead(n.id); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnread ? "bg-terracotta/10" : "bg-sage/10"}`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-sans ${isUnread ? "font-medium text-forest" : "text-forest/70"}`}>
                            {n.title}
                          </p>
                          {isUnread && <span className="w-2 h-2 rounded-full bg-terracotta shrink-0" />}
                        </div>
                        <p className="text-xs text-forest/50 font-sans mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-forest/30 font-sans mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
