import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Share2, Plus, Instagram, Facebook, Linkedin, Twitter,
  Youtube, BarChart3, TrendingUp, Eye, Heart, MessageCircle,
  Users, Globe, Zap, ArrowUpRight, RefreshCw, Trash2,
  Edit, MoreHorizontal, Clock, CheckCircle, AlertCircle,
  Send, FileText, Hash, Sparkles, Calendar,
} from "lucide-react";

const PLATFORM_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  instagram: { icon: <Instagram className="w-4 h-4" />, color: "text-pink-600", bg: "bg-gradient-to-br from-purple-500 to-pink-500" },
  facebook: { icon: <Facebook className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-600" },
  linkedin: { icon: <Linkedin className="w-4 h-4" />, color: "text-blue-700", bg: "bg-blue-700" },
  tiktok: { icon: <span className="text-sm font-bold">♪</span>, color: "text-black", bg: "bg-black" },
  x: { icon: <Twitter className="w-4 h-4" />, color: "text-gray-900", bg: "bg-gray-900" },
  youtube: { icon: <Youtube className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-600" },
  pinterest: { icon: <span className="text-sm font-bold">P</span>, color: "text-red-700", bg: "bg-red-700" },
  threads: { icon: <span className="text-sm font-bold">@</span>, color: "text-gray-800", bg: "bg-gray-800" },
};

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  connected: { variant: "default", label: "Connected" },
  disconnected: { variant: "destructive", label: "Disconnected" },
  expired: { variant: "destructive", label: "Expired" },
  pending: { variant: "secondary", label: "Pending Setup" },
  draft: { variant: "secondary", label: "Draft" },
  scheduled: { variant: "outline", label: "Scheduled" },
  published: { variant: "default", label: "Published" },
  failed: { variant: "destructive", label: "Failed" },
  active: { variant: "default", label: "Active" },
  paused: { variant: "secondary", label: "Paused" },
  completed: { variant: "outline", label: "Completed" },
};

export default function SocialMedia() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  // Queries
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = trpc.socialAccounts.list.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = trpc.socialAnalytics.getOverview.useQuery();
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.socialPosts.list.useQuery();
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = trpc.socialCampaigns.list.useQuery();
  const { data: postStats } = trpc.socialPosts.getStats.useQuery();

  // Mutations
  const seedBrand = trpc.brandAssets.seedDefaults.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-off-white" />
            Social Media Command Center
          </h1>
          <p className="text-gray-500 mt-1">Manage all your social media from one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => seedBrand.mutate()}>
            <Sparkles className="w-4 h-4 mr-1" /> Seed Brand Kit
          </Button>
          <Button size="sm" onClick={() => setShowCreatePost(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Followers"
              value={analytics?.totalFollowers ?? 0}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              loading={analyticsLoading}
            />
            <StatCard
              title="Published Posts"
              value={analytics?.publishedPosts ?? 0}
              icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
              loading={analyticsLoading}
              subtitle={`${analytics?.scheduledPosts ?? 0} scheduled`}
            />
            <StatCard
              title="Total Engagement"
              value={analytics?.totalEngagement ?? 0}
              icon={<Heart className="w-5 h-5 text-pink-600" />}
              loading={analyticsLoading}
            />
            <StatCard
              title="Total Impressions"
              value={analytics?.totalImpressions ?? 0}
              icon={<Eye className="w-5 h-5 text-purple-600" />}
              loading={analyticsLoading}
            />
          </div>

          {/* Platform Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform Performance</CardTitle>
              <CardDescription>Engagement across connected platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : analytics?.platformStats && analytics.platformStats.length > 0 ? (
                <div className="space-y-3">
                  {analytics.platformStats.map((p) => {
                    const meta = PLATFORM_META[p.platform];
                    return (
                      <div key={p.platform} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className={`w-10 h-10 rounded-lg ${meta?.bg || "bg-gray-500"} flex items-center justify-center text-white`}>
                          {meta?.icon || <Globe className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize">{p.platform}</div>
                          <div className="text-sm text-gray-500">{p.accountName || "Not connected"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{(p.followers || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">followers</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{p.posts}</div>
                          <div className="text-xs text-gray-500">posts</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{(p.engagement || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">engagement</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No platform data yet</p>
                  <p className="text-sm mt-1">Add social accounts and start posting to see analytics here</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab("accounts")}>
                    <Plus className="w-4 h-4 mr-1" /> Add Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Posts</CardTitle>
                <CardDescription>{postStats?.total ?? 0} total posts</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("posts")}>
                View All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : posts && posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.slice(0, 5).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No posts yet</p>
                  <p className="text-sm mt-1">Create your first post or use AI to generate content</p>
                  <Button size="sm" className="mt-3" onClick={() => setShowCreatePost(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── ACCOUNTS TAB ─── */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Connected Accounts</h2>
            <Button size="sm" onClick={() => setShowAddAccount(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Account
            </Button>
          </div>

          {accountsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : accounts && accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} onRefetch={refetchAccounts} />
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
                <p className="text-sm mb-4">Add your social media accounts to start managing them from here.<br />You can add accounts now and connect the APIs later.</p>
                <Button onClick={() => setShowAddAccount(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Your First Account
                </Button>
              </div>
            </Card>
          )}

          {/* Platform Quick-Add Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Platforms</CardTitle>
              <CardDescription>Click to add an account. API connections can be configured later.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(PLATFORM_META).map(([platform, meta]) => {
                  const isConnected = accounts?.some(a => a.platform === platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => {
                        if (!isConnected) setShowAddAccount(true);
                        else toast.info(`${platform} is already added`);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                        isConnected ? "border-green-200 bg-green-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center text-white mx-auto mb-2`}>
                        {meta.icon}
                      </div>
                      <div className="font-medium capitalize text-sm">{platform}</div>
                      {isConnected && <Badge variant="default" className="mt-1 text-xs">Added</Badge>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── POSTS TAB ─── */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <h2 className="text-lg font-semibold">All Posts</h2>
              {postStats && (
                <div className="flex gap-2">
                  <Badge variant="secondary">{postStats.drafts} drafts</Badge>
                  <Badge variant="outline">{postStats.scheduled} scheduled</Badge>
                  <Badge variant="default">{postStats.published} published</Badge>
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => setShowCreatePost(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Post
            </Button>
          </div>

          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} detailed />
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No posts created yet</h3>
                <p className="text-sm mb-4">Start creating content manually or use AI to generate posts.</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreatePost(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create Post
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("overview")}>
                    <Sparkles className="w-4 h-4 mr-1" /> Use AI Studio
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ─── CAMPAIGNS TAB ─── */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Campaigns</h2>
            <Button size="sm" onClick={() => setShowCreateCampaign(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Campaign
            </Button>
          </div>

          {campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                <p className="text-sm mb-4">Organize your social media efforts into campaigns for better tracking.</p>
                <Button onClick={() => setShowCreateCampaign(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create Campaign
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddAccountDialog open={showAddAccount} onOpenChange={setShowAddAccount} onSuccess={refetchAccounts} />
      <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} onSuccess={refetchPosts} />
      <CreateCampaignDialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign} onSuccess={refetchCampaigns} />
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ title, value, icon, loading, subtitle }: {
  title: string; value: number; icon: React.ReactNode; loading: boolean; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PostCard({ post, detailed }: { post: any; detailed?: boolean }) {
  const meta = PLATFORM_META[post.platform];
  const statusBadge = STATUS_BADGES[post.status] || { variant: "secondary" as const, label: post.status };
  const utils = trpc.useUtils();
  const [showPreview, setShowPreview] = useState(false);
  const publishNow = trpc.socialPosts.publishNow.useMutation({
    onSuccess: (data) => {
      toast.success(`Published to ${post.platform}!`, {
        action: data.externalUrl ? { label: "View", onClick: () => window.open(data.externalUrl, "_blank") } : undefined,
      });
      utils.socialPosts.list.invalidate();
      utils.socialPosts.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const deletePost = trpc.socialPosts.delete.useMutation({
    onSuccess: () => { toast.success("Post deleted"); utils.socialPosts.list.invalidate(); utils.socialPosts.getStats.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const canPublish = post.status === "draft" || post.status === "scheduled" || post.status === "failed";
  const isPublishing = publishNow.isPending || post.status === "publishing";

  // Build the full tweet text preview (content + hashtags)
  const buildTweetPreview = () => {
    let text = post.content || "";
    if (post.hashtags && Array.isArray(post.hashtags) && (post.hashtags as string[]).length > 0) {
      const tags = (post.hashtags as string[]).map((t: string) => t.startsWith("#") ? t : `#${t}`).join(" ");
      text = `${text}\n\n${tags}`;
    }
    return text;
  };

  return (
    <>
    <div className="p-4 rounded-lg border bg-charcoal hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${meta?.bg || "bg-gray-500"} flex items-center justify-center text-white shrink-0`}>
          {meta?.icon || <Globe className="w-3 h-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium capitalize text-sm">{post.platform}</span>
            <Badge variant={statusBadge.variant} className="text-xs">{statusBadge.label}</Badge>
            {post.aiGenerated && <Badge variant="outline" className="text-xs"><Sparkles className="w-3 h-3 mr-0.5" /> AI</Badge>}
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          {detailed && post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(post.hashtags as string[]).slice(0, 5).map((tag: string, i: number) => (
                <span key={i} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">#{tag}</span>
              ))}
              {(post.hashtags as string[]).length > 5 && <span className="text-xs text-gray-400">+{(post.hashtags as string[]).length - 5} more</span>}
            </div>
          )}
          {detailed && (
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments || 0}</span>
              <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {post.shares || 0}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.impressions || 0}</span>
            </div>
          )}
          {post.postUrl && (
            <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> View on {post.platform}
            </a>
          )}
          {post.failureReason && post.status === "failed" && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {post.failureReason}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-xs text-gray-400">
            {post.scheduledAt ? (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(post.scheduledAt).toLocaleDateString()}</span>
            ) : (
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
            {canPublish && post.platform === "x" && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                disabled={isPublishing}
                onClick={() => publishNow.mutate({ id: post.id })}
              >
                {isPublishing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                {isPublishing ? "Posting..." : "Post to X"}
              </Button>
            )}
            {canPublish && post.platform !== "x" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => toast.info(`${post.platform} API not connected yet. Only X (Twitter) is available.`)}
              >
                <Send className="w-3 h-3 mr-1" /> Publish
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
              onClick={() => { if (confirm("Delete this post?")) deletePost.mutate({ id: post.id }); }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Post Preview Dialog */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${meta?.bg || "bg-gray-500"} flex items-center justify-center text-white`}>
              {meta?.icon || <Globe className="w-3 h-3" />}
            </div>
            <span className="capitalize">{post.platform}</span> Post Preview
            <Badge variant={statusBadge.variant} className="text-xs ml-auto">{statusBadge.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Tweet-style preview card */}
        <div className="border rounded-xl p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${meta?.bg || "bg-gray-500"} flex items-center justify-center text-white shrink-0`}>
              {meta?.icon || <Globe className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm">MiniMorph Studios</span>
                <span className="text-gray-400 text-xs">@minimorph</span>
              </div>
              <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{buildTweetPreview()}</div>
              {post.mediaUrls && Array.isArray(post.mediaUrls) && (post.mediaUrls as string[]).length > 0 && (
                <div className="mt-3 rounded-xl overflow-hidden border">
                  <img src={(post.mediaUrls as string[])[0]} alt="Post media" loading="lazy" className="w-full max-h-64 object-cover" />
                </div>
              )}
              <div className="flex gap-6 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments || 0}</span>
                <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> {post.shares || 0}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.impressions || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Character count</span>
            <span className={`font-mono text-xs ${buildTweetPreview().length > 280 ? "text-red-500 font-bold" : "text-gray-600"}`}>
              {buildTweetPreview().length} / 280
            </span>
          </div>
          {post.hashtags && Array.isArray(post.hashtags) && (post.hashtags as string[]).length > 0 && (
            <div>
              <span className="text-gray-500 block mb-1">Hashtags</span>
              <div className="flex flex-wrap gap-1">
                {(post.hashtags as string[]).map((tag: string, i: number) => (
                  <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            </div>
          )}
          {post.scheduledAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Scheduled for</span>
              <span className="text-gray-700">{new Date(post.scheduledAt).toLocaleString()}</span>
            </div>
          )}
          {post.publishedAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Published at</span>
              <span className="text-gray-700">{new Date(post.publishedAt).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Created</span>
            <span className="text-gray-700">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          {post.postUrl && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Live URL</span>
              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> View on {post.platform}
              </a>
            </div>
          )}
          {post.failureReason && post.status === "failed" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {post.failureReason}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {canPublish && post.platform === "x" && (
            <Button
              size="sm"
              disabled={isPublishing}
              onClick={() => { publishNow.mutate({ id: post.id }); setShowPreview(false); }}
            >
              {isPublishing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
              {isPublishing ? "Posting..." : "Post to X"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function AccountCard({ account, onRefetch }: { account: any; onRefetch: () => void }) {
  const meta = PLATFORM_META[account.platform];
  const statusBadge = STATUS_BADGES[account.status] || { variant: "secondary" as const, label: account.status };
  const deleteAccount = trpc.socialAccounts.delete.useMutation({
    onSuccess: () => { toast.success("Account removed"); onRefetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl ${meta?.bg || "bg-gray-500"} flex items-center justify-center text-white`}>
            {meta?.icon || <Globe className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold capitalize">{account.platform}</h3>
              <Badge variant={statusBadge.variant} className="text-xs">{statusBadge.label}</Badge>
            </div>
            <p className="text-sm text-gray-600">{account.accountName}</p>
            {account.followerCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">{account.followerCount.toLocaleString()} followers</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-600 hover:bg-red-50" aria-label="Remove account"
            onClick={() => {
              if (confirm("Remove this account?")) deleteAccount.mutate({ id: account.id });
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {account.status === "pending" && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-700">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              API not connected yet. Provide API keys to enable auto-posting and analytics sync.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign }: { campaign: any }) {
  const statusBadge = STATUS_BADGES[campaign.status] || { variant: "secondary" as const, label: campaign.status };
  const platforms = (campaign.platforms as string[] | null) || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold">{campaign.name}</h3>
            <Badge variant={statusBadge.variant} className="text-xs mt-1">{statusBadge.label}</Badge>
          </div>
          <Badge variant="outline" className="capitalize text-xs">{(campaign.goal || "").replace(/_/g, " ")}</Badge>
        </div>
        {campaign.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{campaign.description}</p>
        )}
        <div className="flex items-center gap-2">
          {platforms.map((p: string) => {
            const meta = PLATFORM_META[p];
            return meta ? (
              <div key={p} className={`w-6 h-6 rounded ${meta.bg} flex items-center justify-center text-white`}>
                {meta.icon}
              </div>
            ) : null;
          })}
        </div>
        {campaign.startDate && (
          <p className="text-xs text-gray-400 mt-2">
            {new Date(campaign.startDate).toLocaleDateString()} — {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "Ongoing"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Dialogs ─── */

function AddAccountDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [platform, setPlatform] = useState("");
  const [accountName, setAccountName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  const createAccount = trpc.socialAccounts.create.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onSuccess();
      onOpenChange(false);
      setPlatform("");
      setAccountName("");
      setProfileUrl("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Social Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2 capitalize">{meta.icon} {key}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Account Name / Handle</label>
            <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="@minimorphstudios" />
          </div>
          <div>
            <label className="text-sm font-medium">Profile URL (optional)</label>
            <Input value={profileUrl} onChange={e => setProfileUrl(e.target.value)} placeholder="https://instagram.com/minimorphstudios" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createAccount.mutate({
              platform: platform as any,
              accountName,
              profileUrl: profileUrl || undefined,
            })}
            disabled={!platform || !accountName || createAccount.isPending}
          >
            {createAccount.isPending ? "Adding..." : "Add Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePostDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [platform, setPlatform] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const createPost = trpc.socialPosts.create.useMutation({
    onSuccess: () => {
      toast.success("Post created!");
      onSuccess();
      onOpenChange(false);
      setPlatform("");
      setContent("");
      setHashtags("");
      setScheduledAt("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2 capitalize">{meta.icon} {key}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your post..." rows={4} />
            <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
          </div>
          <div>
            <label className="text-sm font-medium">Hashtags (comma-separated)</label>
            <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="webdesign, smallbusiness, growth" />
          </div>
          <div>
            <label className="text-sm font-medium">Schedule (optional)</label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createPost.mutate({
              platform: platform as any,
              content,
              hashtags: hashtags ? hashtags.split(",").map(h => h.trim()).filter(Boolean) : undefined,
              scheduledAt: scheduledAt || undefined,
            })}
            disabled={!platform || !content || createPost.isPending}
          >
            {createPost.isPending ? "Creating..." : scheduledAt ? "Schedule Post" : "Save as Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateCampaignDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);

  const createCampaign = trpc.socialCampaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created!");
      onSuccess();
      onOpenChange(false);
      setName("");
      setDescription("");
      setGoal("");
      setPlatforms([]);
    },
    onError: (err) => toast.error(err.message),
  });

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Campaign Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Launch 2026" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign goals and strategy..." rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium">Goal</label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
              <SelectContent>
                {["brand_awareness", "lead_generation", "engagement", "traffic", "recruitment", "product_launch", "event_promotion", "customer_retention"].map(g => (
                  <SelectItem key={g} value={g}>{g.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    platforms.includes(key) ? "bg-charcoal text-off-white border-electric" : "bg-charcoal text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="capitalize">{key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createCampaign.mutate({
              name,
              description: description || undefined,
              goal: goal as any,
              platforms: platforms as any[],
            })}
            disabled={!name || !goal || platforms.length === 0 || createCampaign.isPending}
          >
            {createCampaign.isPending ? "Creating..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
