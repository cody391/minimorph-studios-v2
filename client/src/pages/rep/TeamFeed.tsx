/**
 * ═══════════════════════════════════════════════════════
 * TEAM FEED — Community announcements, wins, tips, and shoutouts
 * ═══════════════════════════════════════════════════════
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone, Trophy, GraduationCap, TrendingUp, Star,
  Lightbulb, Heart, ThumbsUp, Send, Pin, Users, Sparkles,
  MessageSquare, Award, Flame,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  announcement: { icon: Megaphone, color: "text-blue-600 bg-blue-50", label: "Announcement" },
  deal_closed: { icon: Trophy, color: "text-green-600 bg-green-50", label: "Deal Closed" },
  certification: { icon: GraduationCap, color: "text-purple-600 bg-purple-50", label: "Certification" },
  tier_promotion: { icon: TrendingUp, color: "text-amber-600 bg-amber-50", label: "Tier Promotion" },
  milestone: { icon: Star, color: "text-yellow-600 bg-yellow-50", label: "Milestone" },
  tip: { icon: Lightbulb, color: "text-orange-600 bg-orange-50", label: "Tip" },
  shoutout: { icon: Heart, color: "text-pink-600 bg-pink-50", label: "Shoutout" },
};

interface TeamFeedProps {
  repProfile: any;
}

export default function TeamFeed({ repProfile }: TeamFeedProps) {
  const [newPostType, setNewPostType] = useState<string>("tip");
  const [newPostContent, setNewPostContent] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const { data: feedEntries, isLoading } = trpc.teamFeed.list.useQuery(undefined);
  const { data: mentors } = trpc.teamFeed.mentors.useQuery(undefined);
  const createPost = trpc.teamFeed.create.useMutation({
    onSuccess: () => {
      toast.success("Post shared with the team!");
      setNewPostContent("");
      setShowCompose(false);
      utils.teamFeed.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });
  const likePost = trpc.teamFeed.like.useMutation({
    onSuccess: () => utils.teamFeed.list.invalidate(),
  });
  const utils = trpc.useUtils();

  const filteredEntries = useMemo(() => {
    if (!feedEntries) return [];
    if (filter === "all") return feedEntries;
    return feedEntries.filter((e: any) => e.type === filter);
  }, [feedEntries, filter]);

  const pinnedEntries = useMemo(() => filteredEntries.filter((e: any) => e.isPinned), [filteredEntries]);
  const regularEntries = useMemo(() => filteredEntries.filter((e: any) => !e.isPinned), [filteredEntries]);

  const handleSubmit = () => {
    if (!newPostContent.trim()) return;
    createPost.mutate({
      type: newPostType as any,
      title: newPostType === "tip" ? "Sales Tip" : newPostType === "shoutout" ? "Shoutout" : "Team Update",
      content: newPostContent.trim(),
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-forest flex items-center gap-2">
            <Users className="h-5 w-5 text-terracotta" /> Team Feed
          </h2>
          <p className="text-xs text-forest/50 font-sans mt-1">Wins, tips, shoutouts, and announcements from the team</p>
        </div>
        <Button
          onClick={() => setShowCompose(!showCompose)}
          size="sm"
          className="bg-terracotta text-white hover:bg-terracotta/90 font-sans text-xs"
        >
          <Send className="h-3 w-3 mr-1" /> Share
        </Button>
      </div>

      {/* Compose */}
      {showCompose && (
        <Card className="border-terracotta/20 bg-terracotta/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Select value={newPostType} onValueChange={setNewPostType}>
                <SelectTrigger className="w-40 h-8 text-xs font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tip">Share a Tip</SelectItem>
                  <SelectItem value="shoutout">Give a Shoutout</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-forest/40 font-sans">Posting as {repProfile.fullName}</span>
            </div>
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={newPostType === "tip" ? "Share a sales tip or insight that helped you..." : "Give a shoutout to a teammate who helped you..."}
              className="text-sm font-sans min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCompose(false)} className="font-sans text-xs">Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!newPostContent.trim() || createPost.isPending} className="bg-forest text-white hover:bg-forest/90 font-sans text-xs">
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentors Section */}
      {mentors && mentors.length > 0 && (
        <Card className="border-violet-200/50 bg-violet-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-serif text-forest flex items-center gap-2">
              <Award className="h-4 w-4 text-violet-500" /> Platinum Mentors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {mentors.map((mentor: any) => (
                <div key={mentor.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-violet-100">
                  {mentor.profilePhotoUrl ? (
                    <img src={mentor.profilePhotoUrl} alt={mentor.fullName} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                      {(mentor.fullName || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-sans text-forest font-medium">{mentor.fullName}</p>
                    <p className="text-[10px] text-forest/40 font-sans flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Platinum
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "announcement", label: "Announcements" },
          { value: "deal_closed", label: "Deals" },
          { value: "tip", label: "Tips" },
          { value: "shoutout", label: "Shoutouts" },
          { value: "milestone", label: "Milestones" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={`font-sans text-[10px] h-7 ${filter === f.value ? "bg-forest text-white" : ""}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Pinned Posts */}
      {pinnedEntries.map((entry: any) => (
        <FeedCard key={entry.id} entry={entry} isPinned repProfile={repProfile} onLike={() => likePost.mutate({ id: entry.id })} timeAgo={timeAgo} />
      ))}

      {/* Regular Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-sage/10 rounded-xl" />
          ))}
        </div>
      ) : regularEntries.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 text-forest/15 mx-auto mb-3" />
            <p className="text-sm text-forest/40 font-sans">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {regularEntries.map((entry: any) => (
            <FeedCard key={entry.id} entry={entry} repProfile={repProfile} onLike={() => likePost.mutate({ id: entry.id })} timeAgo={timeAgo} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedCard({ entry, isPinned, repProfile, onLike, timeAgo }: { entry: any; isPinned?: boolean; repProfile: any; onLike: () => void; timeAgo: (d: string) => string }) {
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.announcement;
  const Icon = config.icon;

  return (
    <Card className={`border-border/30 ${isPinned ? "border-blue-200 bg-blue-50/20" : ""}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${config.color} border-0`}>{config.label}</Badge>
              {isPinned && <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-0"><Pin className="w-2.5 h-2.5 mr-0.5" /> Pinned</Badge>}
              <span className="text-[10px] text-forest/30 font-sans">{timeAgo(entry.createdAt)}</span>
            </div>
            {entry.repName && (
              <p className="text-xs font-sans text-forest/60 mt-1">
                <span className="font-medium text-forest">{entry.repName}</span>
                {entry.type === "deal_closed" && " closed a deal"}
                {entry.type === "certification" && " earned certification"}
                {entry.type === "tier_promotion" && " advanced a tier"}
              </p>
            )}
            <h4 className="text-sm font-serif text-forest mt-1">{entry.title}</h4>
            <p className="text-xs text-forest/60 font-sans mt-1 whitespace-pre-wrap">{entry.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={onLike}
                className="flex items-center gap-1 text-[10px] text-forest/40 hover:text-terracotta transition-colors font-sans"
              >
                <ThumbsUp className="h-3 w-3" /> {entry.likes || 0}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
