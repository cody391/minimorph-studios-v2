import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Wand2, Hash, Calendar, Copy, Check, Send,
  Instagram, Facebook, Linkedin, Twitter, Globe,
  RefreshCw, Loader2, FileText, Zap, ArrowRight,
  BookOpen, Image, MessageCircle,
} from "lucide-react";

const PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads"] as const;
const TONES = ["professional", "casual", "witty", "inspirational", "educational", "promotional", "storytelling"] as const;
const GOALS = ["brand_awareness", "lead_generation", "engagement", "traffic", "recruitment", "product_launch", "event_promotion", "customer_retention"] as const;

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4 text-pink-500" />,
  facebook: <Facebook className="w-4 h-4 text-blue-600" />,
  linkedin: <Linkedin className="w-4 h-4 text-blue-700" />,
  tiktok: <span className="text-sm font-bold">♪</span>,
  x: <Twitter className="w-4 h-4 text-gray-800" />,
  youtube: <span className="text-red-600 font-bold text-sm">▶</span>,
  pinterest: <span className="text-red-700 font-bold text-sm">P</span>,
  threads: <span className="text-gray-800 font-bold text-sm">@</span>,
};

export default function AIContentStudio() {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-forest" />
          AI Content Studio
        </h1>
        <p className="text-gray-500 mt-1">Generate platform-optimized social media content with AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="generate"><Wand2 className="w-4 h-4 mr-1" /> Generate Post</TabsTrigger>
          <TabsTrigger value="bulk"><Calendar className="w-4 h-4 mr-1" /> Bulk Generate</TabsTrigger>
          <TabsTrigger value="hashtags"><Hash className="w-4 h-4 mr-1" /> Hashtags</TabsTrigger>
          <TabsTrigger value="library"><BookOpen className="w-4 h-4 mr-1" /> Content Library</TabsTrigger>
        </TabsList>

        <TabsContent value="generate"><SinglePostGenerator /></TabsContent>
        <TabsContent value="bulk"><BulkGenerator /></TabsContent>
        <TabsContent value="hashtags"><HashtagGenerator /></TabsContent>
        <TabsContent value="library"><ContentLibrary /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Single Post Generator ─── */
function SinglePostGenerator() {
  const [platform, setPlatform] = useState<string>("instagram");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<string>("professional");
  const [goal, setGoal] = useState<string>("brand_awareness");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generatePost = trpc.aiContent.generatePost.useMutation({
    onSuccess: (data) => { setResult(data); toast.success("Content generated!"); },
    onError: (err) => toast.error(err.message),
  });

  const savePost = trpc.socialPosts.create.useMutation({
    onSuccess: () => toast.success("Saved as draft!"),
    onError: (err) => toast.error(err.message),
  });

  const copyContent = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-forest" /> Generate a Post
          </CardTitle>
          <CardDescription>Describe what you want to post and AI will craft it for the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2 capitalize">{PLATFORM_ICONS[p]} {p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Topic / Brief</label>
            <Textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., Showcase our latest restaurant website redesign for Bella's Italian Kitchen. Highlight the online ordering feature and mobile responsiveness."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Goal</label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOALS.map(g => (
                    <SelectItem key={g} value={g}>{g.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeHashtags} onChange={e => setIncludeHashtags(e.target.checked)} className="rounded" />
              Include hashtags
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeEmoji} onChange={e => setIncludeEmoji(e.target.checked)} className="rounded" />
              Include emoji
            </label>
          </div>

          <Button
            className="w-full"
            onClick={() => generatePost.mutate({
              platform: platform as any,
              topic,
              tone: tone as any,
              campaignGoal: goal as any,
              includeHashtags,
              includeEmoji,
            })}
            disabled={!topic || generatePost.isPending}
          >
            {generatePost.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generated Content</CardTitle>
        </CardHeader>
        <CardContent>
          {generatePost.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">{platform}</Badge>
                {result.characterCount && (
                  <span className="text-xs text-gray-400">{result.characterCount} chars</span>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap text-sm leading-relaxed">
                {result.content}
              </div>

              {result.hashtags && result.hashtags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {result.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.bestTimeToPost && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Best time to post:</span> {result.bestTimeToPost}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" onClick={() => savePost.mutate({
                  platform: platform as any,
                  content: result.content,
                  hashtags: result.hashtags,
                  aiGenerated: true,
                })}>
                  <FileText className="w-4 h-4 mr-1" /> Save as Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePost.mutate({
                    platform: platform as any,
                    topic,
                    tone: tone as any,
                  campaignGoal: goal as any,
                  includeHashtags,
                  includeEmoji,
                })}
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No content generated yet</p>
              <p className="text-sm mt-1">Fill in the details and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Bulk Generator ─── */
function BulkGenerator() {
  const [brief, setBrief] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook", "linkedin"]);
  const [postsPerPlatform, setPostsPerPlatform] = useState(3);
  const [tone, setTone] = useState<string>("professional");
  const [results, setResults] = useState<any>(null);

  const bulkGenerate = trpc.aiContent.generateMultiPlatform.useMutation({
    onSuccess: (data: any) => { setResults(data); toast.success(`Generated ${data.posts?.length || 0} posts!`); },
    onError: (err: any) => toast.error(err.message),
  });

  const saveAllPosts = trpc.socialPosts.create.useMutation();

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const saveAll = async () => {
    if (!results?.posts) return;
    let saved = 0;
    for (const post of results.posts) {
      try {
        await saveAllPosts.mutateAsync({
          platform: post.platform as any,
          content: post.content,
          hashtags: post.hashtags,
          aiGenerated: true,
        });
        saved++;
      } catch (e) { /* skip failures */ }
    }
    toast.success(`Saved ${saved} posts as drafts`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Bulk Content Generator
          </CardTitle>
          <CardDescription>Generate a week or month of content from a single brief</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Content Brief</label>
            <Textarea
              value={brief}
              onChange={e => setBrief(e.target.value)}
              placeholder="e.g., We want to promote our new website packages for restaurants. Focus on features like online ordering, menu management, and mobile-first design. Mix educational content with client success stories."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                    platforms.includes(p) ? "bg-forest text-white border-forest" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {PLATFORM_ICONS[p]} <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Posts per Platform</label>
              <Select value={String(postsPerPlatform)} onValueChange={v => setPostsPerPlatform(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} posts</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              Will generate ~{platforms.length * postsPerPlatform} posts across {platforms.length} platforms
            </p>
            <Button
              onClick={() => bulkGenerate.mutate({
                topic: brief,
                platforms: platforms as any[],
                tone: tone as any,
              })}
              disabled={!brief || platforms.length === 0 || bulkGenerate.isPending}
            >
              {bulkGenerate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Generate All</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {bulkGenerate.isPending && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-forest" />
              <p className="font-medium">Generating content...</p>
              <p className="text-sm text-gray-500 mt-1">This may take 15-30 seconds</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results?.posts && results.posts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Generated Posts ({results.posts.length})</CardTitle>
              <CardDescription>Review and save the generated content</CardDescription>
            </div>
            <Button size="sm" onClick={saveAll}>
              <FileText className="w-4 h-4 mr-1" /> Save All as Drafts
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.posts.map((post: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    {PLATFORM_ICONS[post.platform]}
                    <span className="font-medium capitalize text-sm">{post.platform}</span>
                    {post.day && <Badge variant="outline" className="text-xs">{post.day}</Badge>}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map((tag: string, j: number) => (
                        <span key={j} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Hashtag Generator ─── */
function HashtagGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [count, setCount] = useState(15);
  const [result, setResult] = useState<any>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const generateHashtags = trpc.aiContent.suggestHashtags.useMutation({
    onSuccess: (data) => { setResult(data); toast.success("Hashtags generated!"); },
    onError: (err) => toast.error(err.message),
  });

  const copyAll = () => {
    if (result?.hashtags) {
      navigator.clipboard.writeText(result.hashtags.map((h: any) => `#${h.tag || h}`).join(" "));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600" /> Hashtag Generator
          </CardTitle>
          <CardDescription>Get AI-recommended hashtags for your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Topic / Post Content</label>
            <Textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., New restaurant website with online ordering"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>
                      <span className="capitalize">{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Count</label>
              <Select value={String(count)} onValueChange={v => setCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} hashtags</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => generateHashtags.mutate({
              topic,
              platform: platform as any,
              count,
            })}
            disabled={!topic || generateHashtags.isPending}
          >
            {generateHashtags.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Hash className="w-4 h-4 mr-2" /> Generate Hashtags</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          {generateHashtags.isPending ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : result?.hashtags && result.hashtags.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((h: any, i: number) => {
                  const tag = typeof h === "string" ? h : h.tag;
                  const category = typeof h === "object" ? h.category : null;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        navigator.clipboard.writeText(`#${tag}`);
                        toast.success(`Copied #${tag}`);
                      }}
                      className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                      title={category ? `Category: ${category}` : undefined}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={copyAll}>
                {copiedAll ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedAll ? "Copied!" : "Copy All"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Hash className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hashtags generated yet</p>
              <p className="text-sm mt-1">Enter a topic and click Generate</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Content Library ─── */
function ContentLibrary() {
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterPlatform, setFilterPlatform] = useState<string | undefined>();

  const { data: allItems, isLoading, refetch } = trpc.socialLibrary.listAll.useQuery();
  const items = useMemo(() => {
    if (!allItems) return [];
    let filtered = allItems;
    if (filterCategory) filtered = filtered.filter((i: any) => i.category === filterCategory);
    if (filterPlatform) filtered = filtered.filter((i: any) => i.platform === filterPlatform || i.platform === "all");
    return filtered;
  }, [allItems, filterCategory, filterPlatform]);

  // Seed is handled by brand assets seed, library items are created individually
  const seedNotice = () => toast.info("Use the AI Content Studio to generate templates, or add them manually.");

  const CATEGORIES = [
    "brand_awareness", "testimonial", "service_highlight", "industry_tip",
    "behind_the_scenes", "recruitment", "promotion", "educational",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Library</h3>
          <p className="text-sm text-gray-500">Pre-approved templates and content pieces</p>
        </div>
        <Button variant="outline" size="sm" onClick={seedNotice}>
          <Sparkles className="w-4 h-4 mr-1" /> How to Add Templates
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={filterCategory || "all_categories"} onValueChange={v => setFilterCategory(v === "all_categories" ? undefined : v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_categories">All categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlatform || "all_platforms"} onValueChange={v => setFilterPlatform(v === "all_platforms" ? undefined : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All platforms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_platforms">All platforms</SelectItem>
            {[...PLATFORMS, "all" as const].map(p => (
              <SelectItem key={p} value={p}><span className="capitalize">{p}</span></SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item: any) => (
            <LibraryItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Content library is empty</p>
            <p className="text-sm mt-1">Seed starter templates or add your own approved content</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={seedNotice}>
              <Sparkles className="w-4 h-4 mr-1" /> How to Add Templates
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function LibraryItemCard({ item }: { item: any }) {
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="capitalize text-xs">{item.category?.replace(/_/g, " ")}</Badge>
          <Badge variant="secondary" className="capitalize text-xs">{item.platform}</Badge>
          {item.timesUsed > 0 && (
            <span className="text-xs text-gray-400">Used {item.timesUsed}x</span>
          )}
        </div>
        <h4 className="font-medium text-sm mb-1">{item.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={copyContent}>
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
