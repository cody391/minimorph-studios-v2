import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Rocket, Users, Heart, MessageSquare, Search, UserPlus, UserMinus,
  Target, Activity, CheckCircle, XCircle, Clock, TrendingUp, Shield,
  Plus, Trash2, Eye, Send, RefreshCw, Zap, Hash, AtSign, Globe
} from "lucide-react";

type EngagementCategory = "rep_recruitment" | "lead_gen" | "brand_awareness" | "authority" | "general";

const CATEGORY_COLORS: Record<EngagementCategory, string> = {
  rep_recruitment: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  lead_gen: "bg-green-500/10 text-emerald-400 border-green-500/20",
  brand_awareness: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  authority: "bg-amber-500/100/10 text-amber-500 border-amber-500/20",
  general: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const CATEGORY_LABELS: Record<EngagementCategory, string> = {
  rep_recruitment: "Rep Recruitment",
  lead_gen: "Lead Gen",
  brand_awareness: "Brand Awareness",
  authority: "Authority",
  general: "General",
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════ */
function DashboardTab() {
  const { data: metrics, isLoading: metricsLoading } = trpc.xGrowthDashboard.accountMetrics.useQuery(undefined, {
    retry: false,
  });
  const { data: todayStats } = trpc.xGrowthDashboard.todayStats.useQuery();
  const { data: followStats } = trpc.xGrowthDashboard.followStats.useQuery();
  const { data: rateLimits } = trpc.xGrowthDashboard.rateLimits.useQuery();

  const todayCounts = useMemo(() => {
    if (!todayStats) return { follows: 0, likes: 0, replies: 0, unfollows: 0 };
    const counts = { follows: 0, likes: 0, replies: 0, unfollows: 0 };
    for (const row of todayStats) {
      if (row.status === "executed" || row.status === "approved") {
        const c = Number(row.cnt);
        if (row.actionType === "follow") counts.follows += c;
        if (row.actionType === "like") counts.likes += c;
        if (row.actionType === "reply") counts.replies += c;
        if (row.actionType === "unfollow") counts.unfollows += c;
      }
    }
    return counts;
  }, [todayStats]);

  return (
    <div className="space-y-6">
      {/* Account Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{metrics?.followersCount ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserPlus className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Following</p>
                <p className="text-2xl font-bold">{metrics?.followingCount ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tweets</p>
                <p className="text-2xl font-bold">{metrics?.tweetCount ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/100/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Follow-back Rate</p>
                <p className="text-2xl font-bold">
                  {followStats
                    ? followStats.totalFollowed > 0
                      ? Math.round((followStats.followedBack / followStats.totalFollowed) * 100) + "%"
                      : "0%"
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Today's Activity
          </CardTitle>
          <CardDescription>Engagement actions performed today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-sm text-muted-foreground">Follows</p>
                <p className="text-lg font-semibold">{todayCounts.follows} <span className="text-xs text-muted-foreground">/ 40</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Heart className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Likes</p>
                <p className="text-lg font-semibold">{todayCounts.likes} <span className="text-xs text-muted-foreground">/ 80</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Replies</p>
                <p className="text-lg font-semibold">{todayCounts.replies} <span className="text-xs text-muted-foreground">/ 20</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <UserMinus className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unfollows</p>
                <p className="text-lg font-semibold">{todayCounts.unfollows}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Limits
          </CardTitle>
          <CardDescription>Rate limits to prevent account suspension</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rateLimits && Object.entries(rateLimits).map(([key, val]: [string, any]) => (
              <div key={key} className="p-3 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">{val.used}/{val.limit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      val.used / val.limit > 0.8 ? "bg-red-500" : val.used / val.limit > 0.5 ? "bg-amber-500/100" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((val.used / val.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ENGAGE TAB — Search, Follow, Like, Reply
   ═══════════════════════════════════════════════════════ */
function EngageTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"tweets" | "users">("tweets");
  const [tweetResults, setTweetResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const searchTweets = trpc.xEngagement.searchTweets.useMutation({
    onSuccess: (data) => setTweetResults(data),
    onError: (err) => toast.error("Search failed: " + err.message),
  });
  const searchUsers = trpc.xEngagement.searchUsers.useMutation({
    onSuccess: (data) => setUserResults(data),
    onError: (err) => toast.error("Search failed: " + err.message),
  });
  const followUser = trpc.xEngagement.followUser.useMutation({
    onSuccess: () => toast.success("Followed successfully"),
    onError: (err) => toast.error("Follow failed: " + err.message),
  });
  const likeTweet = trpc.xEngagement.likeTweet.useMutation({
    onSuccess: () => toast.success("Liked successfully"),
    onError: (err) => toast.error("Like failed: " + err.message),
  });
  const queueReply = trpc.xEngagement.queueReply.useMutation({
    onSuccess: () => toast.success("Reply queued for approval"),
    onError: (err) => toast.error("Queue failed: " + err.message),
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    if (searchType === "tweets") {
      searchTweets.mutate({ query: searchQuery, maxResults: 20 });
    } else {
      searchUsers.mutate({ query: searchQuery, maxResults: 10 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search X
          </CardTitle>
          <CardDescription>Find tweets and users to engage with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={searchType} onValueChange={(v) => setSearchType(v as "tweets" | "users")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tweets">Tweets</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={searchType === "tweets" ? "Search tweets..." : "Search users..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searchTweets.isPending || searchUsers.isPending}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tweet Results */}
      {searchType === "tweets" && tweetResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tweet Results ({tweetResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tweetResults.map((tweet) => (
              <div key={tweet.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">@{tweet.authorUsername || "unknown"}</p>
                    <p className="text-sm mt-1">{tweet.text}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>❤️ {tweet.likeCount || 0}</span>
                      <span>🔁 {tweet.retweetCount || 0}</span>
                      <span>💬 {tweet.replyCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => likeTweet.mutate({ tweetId: tweet.id, authorUsername: tweet.authorUsername, tweetText: tweet.text })}
                    disabled={likeTweet.isPending}
                  >
                    <Heart className="h-3 w-3 mr-1" /> Like
                  </Button>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Write a reply..."
                      value={replyDrafts[tweet.id] || ""}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [tweet.id]: e.target.value }))}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!replyDrafts[tweet.id]?.trim()) return;
                        queueReply.mutate({
                          tweetId: tweet.id,
                          authorUsername: tweet.authorUsername,
                          tweetText: tweet.text,
                          replyText: replyDrafts[tweet.id],
                        });
                        setReplyDrafts((prev) => ({ ...prev, [tweet.id]: "" }));
                      }}
                      disabled={queueReply.isPending || !replyDrafts[tweet.id]?.trim()}
                    >
                      <Send className="h-3 w-3 mr-1" /> Queue Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* User Results */}
      {searchType === "users" && userResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Results ({userResults.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium">{user.name || user.username}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  {user.description && (
                    <p className="text-sm mt-1 line-clamp-2">{user.description}</p>
                  )}
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{user.followersCount?.toLocaleString() || 0} followers</span>
                    <span>{user.followingCount?.toLocaleString() || 0} following</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => followUser.mutate({
                    userId: user.id,
                    username: user.username,
                    name: user.name,
                    description: user.description,
                    followersCount: user.followersCount,
                    category: "general",
                  })}
                  disabled={followUser.isPending}
                >
                  <UserPlus className="h-3 w-3 mr-1" /> Follow
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APPROVAL QUEUE TAB
   ═══════════════════════════════════════════════════════ */
function ApprovalQueueTab() {
  const utils = trpc.useUtils();
  const { data: queue, isLoading } = trpc.xEngagement.approvalQueue.useQuery();

  const approveReply = trpc.xEngagement.approveReply.useMutation({
    onSuccess: () => {
      toast.success("Reply approved and sent!");
      utils.xEngagement.approvalQueue.invalidate();
    },
    onError: (err) => toast.error("Approve failed: " + err.message),
  });
  const rejectReply = trpc.xEngagement.rejectReply.useMutation({
    onSuccess: () => {
      toast.success("Reply rejected");
      utils.xEngagement.approvalQueue.invalidate();
    },
    onError: (err) => toast.error("Reject failed: " + err.message),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading approval queue...</div>;

  if (!queue || queue.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">All Clear</h3>
          <p className="text-muted-foreground">No pending replies to approve. Queue replies from the Engage tab.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Replies ({queue.length})</h3>
        <Badge variant="outline" className="bg-amber-500/100/10 text-amber-500">
          <Clock className="h-3 w-3 mr-1" /> Awaiting Approval
        </Badge>
      </div>
      {queue.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-6 space-y-4">
            {/* Original tweet */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Replying to @{item.targetUsername || "unknown"}</p>
              <p className="text-sm">{item.targetTweetText || "(tweet text not available)"}</p>
            </div>
            {/* Our reply */}
            <div className="p-3 rounded-lg border-2 border-blue-500/20 bg-blue-500/5">
              <p className="text-xs text-blue-500 mb-1 font-medium">Our Reply:</p>
              <p className="text-sm">{item.replyText}</p>
            </div>
            {/* Category */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={CATEGORY_COLORS[item.category as EngagementCategory]}>
                {CATEGORY_LABELS[item.category as EngagementCategory] || item.category}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => rejectReply.mutate({ logId: item.id })}
                  disabled={rejectReply.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveReply.mutate({ logId: item.id })}
                  disabled={approveReply.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve & Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TARGETS TAB
   ═══════════════════════════════════════════════════════ */
function TargetsTab() {
  const utils = trpc.useUtils();
  const { data: targets, isLoading } = trpc.xGrowthTargets.list.useQuery();
  const [newTarget, setNewTarget] = useState({
    targetType: "keyword" as "keyword" | "hashtag" | "account" | "community",
    value: "",
    category: "brand_awareness" as "rep_recruitment" | "lead_gen" | "brand_awareness" | "authority",
    priority: 5,
  });

  const addTarget = trpc.xGrowthTargets.add.useMutation({
    onSuccess: () => {
      toast.success("Target added");
      utils.xGrowthTargets.list.invalidate();
      setNewTarget({ targetType: "keyword", value: "", category: "brand_awareness", priority: 5 });
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });
  const deleteTarget = trpc.xGrowthTargets.delete.useMutation({
    onSuccess: () => {
      toast.success("Target removed");
      utils.xGrowthTargets.list.invalidate();
    },
  });
  const toggleTarget = trpc.xGrowthTargets.toggle.useMutation({
    onSuccess: () => utils.xGrowthTargets.list.invalidate(),
  });
  const seedDefaults = trpc.xGrowthTargets.seedDefaults.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} default targets added`);
      utils.xGrowthTargets.list.invalidate();
    },
  });

  const TARGET_TYPE_ICONS = {
    keyword: <Search className="h-3 w-3" />,
    hashtag: <Hash className="h-3 w-3" />,
    account: <AtSign className="h-3 w-3" />,
    community: <Globe className="h-3 w-3" />,
  };

  return (
    <div className="space-y-6">
      {/* Add New Target */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Add Target
          </CardTitle>
          <CardDescription>Define keywords, hashtags, and accounts to target for engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={newTarget.targetType} onValueChange={(v: any) => setNewTarget((p) => ({ ...p, targetType: v }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">Keyword</SelectItem>
                <SelectItem value="hashtag">Hashtag</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={newTarget.targetType === "hashtag" ? "#smallbusiness" : "Enter target..."}
              value={newTarget.value}
              onChange={(e) => setNewTarget((p) => ({ ...p, value: e.target.value }))}
              className="flex-1 min-w-48"
            />
            <Select value={newTarget.category} onValueChange={(v: any) => setNewTarget((p) => ({ ...p, category: v }))}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rep_recruitment">Rep Recruitment</SelectItem>
                <SelectItem value="lead_gen">Lead Gen</SelectItem>
                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                <SelectItem value="authority">Authority</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { if (newTarget.value.trim()) addTarget.mutate(newTarget); }} disabled={addTarget.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seed Defaults */}
      {(!targets || targets.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Targets Configured</h3>
            <p className="text-muted-foreground mb-4">Load default targets for MiniMorph Studios to get started quickly.</p>
            <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending}>
              <Zap className="h-4 w-4 mr-1" /> Load Default Targets
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Target List */}
      {targets && targets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Targets ({targets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {targets.map((target) => (
                <div
                  key={target.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    target.isActive ? "" : "opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{TARGET_TYPE_ICONS[target.targetType]}</span>
                    <span className="font-medium">{target.value}</span>
                    <Badge variant="outline" className={CATEGORY_COLORS[target.category as EngagementCategory]}>
                      {CATEGORY_LABELS[target.category as EngagementCategory]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">P{target.priority}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTarget.mutate({ id: target.id, isActive: !target.isActive })}
                    >
                      {target.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deleteTarget.mutate({ id: target.id })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTIVITY LOG TAB
   ═══════════════════════════════════════════════════════ */
function ActivityLogTab() {
  const { data: log, isLoading } = trpc.xGrowthDashboard.activityLog.useQuery({ limit: 100 });

  const ACTION_ICONS: Record<string, React.ReactNode> = {
    follow: <UserPlus className="h-4 w-4 text-emerald-400" />,
    unfollow: <UserMinus className="h-4 w-4 text-gray-500" />,
    like: <Heart className="h-4 w-4 text-red-500" />,
    reply: <MessageSquare className="h-4 w-4 text-blue-500" />,
    retweet: <RefreshCw className="h-4 w-4 text-cyan-500" />,
  };

  const STATUS_BADGES: Record<string, string> = {
    executed: "bg-green-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-500",
    pending_approval: "bg-amber-500/100/10 text-amber-500",
    approved: "bg-blue-500/10 text-blue-500",
    rejected: "bg-gray-500/10 text-gray-400",
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading activity log...</div>;

  if (!log || log.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Activity Yet</h3>
          <p className="text-muted-foreground">Start engaging from the Engage tab to see activity here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log ({log.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {log.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
              {ACTION_ICONS[entry.actionType] || <Activity className="h-4 w-4" />}
              <div className="flex-1 min-w-0">
                <span className="font-medium capitalize">{entry.actionType}</span>
                {entry.targetUsername && (
                  <span className="text-muted-foreground"> @{entry.targetUsername}</span>
                )}
                {entry.replyText && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">"{entry.replyText}"</p>
                )}
                {entry.failureReason && (
                  <p className="text-xs text-red-500 mt-1">{entry.failureReason}</p>
                )}
              </div>
              <Badge variant="outline" className={CATEGORY_COLORS[entry.category as EngagementCategory]}>
                {CATEGORY_LABELS[entry.category as EngagementCategory] || entry.category}
              </Badge>
              <Badge variant="outline" className={STATUS_BADGES[entry.status] || ""}>
                {entry.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function XGrowthEngine() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Rocket className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">X Growth Engine</h1>
          <p className="text-muted-foreground">Automated engagement, targeting, and growth management</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="engage">Engage</TabsTrigger>
          <TabsTrigger value="approval">Approval Queue</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="engage" className="mt-6">
          <EngageTab />
        </TabsContent>
        <TabsContent value="approval" className="mt-6">
          <ApprovalQueueTab />
        </TabsContent>
        <TabsContent value="targets" className="mt-6">
          <TargetsTab />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
