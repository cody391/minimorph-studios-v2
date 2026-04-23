import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Zap, Globe, Search, Users, Target, Brain, Rocket,
  Play, RefreshCw, MapPin, Building2, Mail, MessageSquare,
  ChevronDown, ChevronUp, ExternalLink, Star,
} from "lucide-react";

export default function LeadGenEngine() {
  const [scrapeArea, setScrapeArea] = useState("");
  const [scrapeRadius, setScrapeRadius] = useState(25);
  const [showScrapeJobs, setShowScrapeJobs] = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(false);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "scrape" | "outreach" | "enterprise" | "capacity">("overview");

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.leadGen.getStats.useQuery();
  const { data: capacity } = trpc.leadGen.getRepCapacity.useQuery();
  const { data: scrapeJobs } = trpc.leadGen.listScrapeJobs.useQuery();
  const { data: businesses } = trpc.leadGen.listScrapedBusinesses.useQuery({ limit: 20 });
  const { data: enterpriseProspects } = trpc.leadGen.listEnterpriseProspects.useQuery();

  // Mutations
  const createScrapeJob = trpc.leadGen.createScrapeJob.useMutation({
    onSuccess: (data) => {
      toast.success(`Scrape job #${data.jobId} started`);
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const scoreWebsites = trpc.leadGen.scoreWebsites.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.scored} websites scored`);
      refetchStats();
    },
  });

  const enrichBusinesses = trpc.leadGen.enrichBusinesses.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.enriched} businesses enriched`);
      refetchStats();
    },
  });

  const convertToLeads = trpc.leadGen.convertToLeads.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.converted} leads created`);
      refetchStats();
    },
  });

  const autoFeedReps = trpc.leadGen.autoFeedReps.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.repsFed} reps fed, ${data.leadsGenerated} leads assigned`);
      refetchStats();
    },
  });

  const runFullPipeline = trpc.leadGen.runFullPipeline.useMutation({
    onSuccess: (data) => {
      toast.success(`Pipeline: ${data.websitesScored} scored, ${data.businessesEnriched} enriched, ${data.leadsConverted} converted, ${data.outreachSent} sent`);
      refetchStats();
    },
  });

  const sendDueOutreach = trpc.leadGen.sendDueOutreach.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.sent} outreach messages sent`);
      refetchStats();
    },
  });

  const scanEnterprise = trpc.leadGen.scanForEnterprise.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.found} enterprise prospects found`);
      refetchStats();
    },
  });

  const handleStartScrape = () => {
    if (!scrapeArea.trim()) {
      toast.error("Enter a target area (e.g., 'Austin, TX')");
      return;
    }
    createScrapeJob.mutate({ targetArea: scrapeArea, radiusKm: scrapeRadius });
    setScrapeArea("");
  };

  const isAnyMutationLoading = createScrapeJob.isPending || scoreWebsites.isPending ||
    enrichBusinesses.isPending || convertToLeads.isPending || autoFeedReps.isPending ||
    runFullPipeline.isPending || sendDueOutreach.isPending || scanEnterprise.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest flex items-center gap-2">
            <Brain className="w-6 h-6 text-terracotta" />
            Lead Generation Engine
          </h1>
          <p className="text-sm text-forest/60 font-sans mt-1">
            Autonomous lead discovery, enrichment, outreach, and routing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            className="border-forest/20"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => runFullPipeline.mutate()}
            disabled={isAnyMutationLoading}
            className="bg-terracotta hover:bg-terracotta/90 text-white"
          >
            {runFullPipeline.isPending ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-1" />
            )}
            Run Full Pipeline
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Scraped" value={stats.totalScraped} icon={Globe} color="text-forest" />
          <StatCard label="Qualified" value={stats.totalQualified} icon={Search} color="text-sage" />
          <StatCard label="Enriched" value={stats.totalEnriched} icon={Brain} color="text-terracotta" />
          <StatCard label="Converted" value={stats.totalConverted} icon={Target} color="text-forest" />
          <StatCard label="AI Leads" value={stats.totalLeadsGenerated} icon={Zap} color="text-terracotta" />
          <StatCard label="In Pipeline" value={stats.leadsInPipeline} icon={Rocket} color="text-sage" />
          <StatCard label="Closed Won" value={stats.leadsClosedWon} icon={Star} color="text-forest" />
          <StatCard label="Active Reps" value={stats.repsActive} icon={Users} color="text-terracotta" sub={`${stats.repsNeedingLeads} need leads`} />
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-forest/10 pb-2">
        {(["overview", "scrape", "outreach", "enterprise", "capacity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedTab === tab
                ? "bg-forest text-white"
                : "text-forest/60 hover:text-forest hover:bg-forest/5"
            }`}
          >
            {tab === "overview" ? "Overview" :
             tab === "scrape" ? "Scraping" :
             tab === "outreach" ? "Outreach" :
             tab === "enterprise" ? "Enterprise" :
             "Rep Capacity"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="space-y-4">
          {/* Pipeline Flow */}
          <Card className="border-forest/10">
            <CardHeader>
              <CardTitle className="text-forest font-serif text-lg">Pipeline Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {[
                  { label: "Scrape", action: () => {}, icon: Globe, count: stats?.totalScraped },
                  { label: "Score", action: () => scoreWebsites.mutate({ limit: 20 }), icon: Search, count: stats?.totalQualified },
                  { label: "Enrich", action: () => enrichBusinesses.mutate({ limit: 10 }), icon: Brain, count: stats?.totalEnriched },
                  { label: "Convert", action: () => convertToLeads.mutate({ limit: 20 }), icon: Target, count: stats?.totalConverted },
                  { label: "Outreach", action: () => sendDueOutreach.mutate(), icon: Mail, count: stats?.activeOutreachSequences },
                  { label: "Feed Reps", action: () => autoFeedReps.mutate(), icon: Users, count: stats?.repsActive },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <button
                      onClick={step.action}
                      disabled={isAnyMutationLoading}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-forest/10 hover:border-terracotta/30 hover:bg-terracotta/5 transition-all min-w-[80px]"
                    >
                      <step.icon className="w-5 h-5 text-forest/70" />
                      <span className="text-xs font-medium text-forest">{step.label}</span>
                      <span className="text-lg font-bold text-terracotta">{step.count ?? 0}</span>
                    </button>
                    {i < 5 && <span className="text-forest/30 text-lg">→</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-forest/10"
              onClick={() => scoreWebsites.mutate({ limit: 20 })}
              disabled={isAnyMutationLoading}
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Score Websites</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-forest/10"
              onClick={() => enrichBusinesses.mutate({ limit: 10 })}
              disabled={isAnyMutationLoading}
            >
              <Brain className="w-4 h-4" />
              <span className="text-xs">Enrich Businesses</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-forest/10"
              onClick={() => sendDueOutreach.mutate()}
              disabled={isAnyMutationLoading}
            >
              <Mail className="w-4 h-4" />
              <span className="text-xs">Send Outreach</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-forest/10"
              onClick={() => scanEnterprise.mutate({ limit: 10 })}
              disabled={isAnyMutationLoading}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Scan Enterprise</span>
            </Button>
          </div>
        </div>
      )}

      {selectedTab === "scrape" && (
        <div className="space-y-4">
          {/* New Scrape Job */}
          <Card className="border-forest/10">
            <CardHeader>
              <CardTitle className="text-forest font-serif text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-terracotta" />
                Start New Scrape
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Target area (e.g., 'Austin, TX' or 'Miami, FL')"
                  value={scrapeArea}
                  onChange={(e) => setScrapeArea(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Radius (km)"
                  value={scrapeRadius}
                  onChange={(e) => setScrapeRadius(Number(e.target.value))}
                  className="w-28"
                  min={1}
                  max={100}
                />
                <Button
                  onClick={handleStartScrape}
                  disabled={createScrapeJob.isPending}
                  className="bg-forest hover:bg-forest/90 text-white"
                >
                  {createScrapeJob.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Scrape
                </Button>
              </div>
              <p className="text-xs text-forest/50">
                Searches Google Maps for businesses without websites or with poor web presence.
                Targets: restaurants, salons, contractors, medical offices, and more.
              </p>
            </CardContent>
          </Card>

          {/* Scrape Jobs List */}
          <Card className="border-forest/10">
            <CardHeader className="cursor-pointer" onClick={() => setShowScrapeJobs(!showScrapeJobs)}>
              <CardTitle className="text-forest font-serif text-lg flex items-center justify-between">
                <span>Scrape Jobs ({scrapeJobs?.length || 0})</span>
                {showScrapeJobs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showScrapeJobs && (
              <CardContent>
                <div className="space-y-2">
                  {scrapeJobs?.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-forest/5">
                      <div>
                        <span className="font-medium text-forest">{job.targetArea}</span>
                        <span className="text-xs text-forest/50 ml-2">
                          {job.radiusKm}km radius
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-forest/70">
                          {job.totalFound || 0} found
                        </span>
                        <Badge variant={
                          job.status === "completed" ? "default" :
                          job.status === "running" ? "secondary" :
                          job.status === "failed" ? "destructive" : "outline"
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!scrapeJobs || scrapeJobs.length === 0) && (
                    <p className="text-sm text-forest/50 text-center py-4">No scrape jobs yet. Start one above.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Scraped Businesses */}
          <Card className="border-forest/10">
            <CardHeader className="cursor-pointer" onClick={() => setShowBusinesses(!showBusinesses)}>
              <CardTitle className="text-forest font-serif text-lg flex items-center justify-between">
                <span>Scraped Businesses ({businesses?.length || 0})</span>
                {showBusinesses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showBusinesses && (
              <CardContent>
                <div className="space-y-2">
                  {businesses?.map((biz) => (
                    <div key={biz.id} className="p-3 rounded-lg bg-forest/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-forest">{biz.businessName}</span>
                          {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 text-forest/40" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {biz.websiteScore !== null && (
                            <Badge variant={biz.websiteScore < 40 ? "destructive" : biz.websiteScore < 70 ? "secondary" : "default"}>
                              Score: {biz.websiteScore}
                            </Badge>
                          )}
                          {!biz.hasWebsite && <Badge variant="destructive">No Website</Badge>}
                          <Badge variant="outline">{biz.status}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-forest/50">
                        {biz.address} · {biz.rating ? `★ ${biz.rating}` : ""} ({biz.reviewCount || 0} reviews)
                      </div>
                    </div>
                  ))}
                  {(!businesses || businesses.length === 0) && (
                    <p className="text-sm text-forest/50 text-center py-4">No businesses scraped yet.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {selectedTab === "outreach" && (
        <div className="space-y-4">
          <Card className="border-forest/10">
            <CardHeader>
              <CardTitle className="text-forest font-serif text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-terracotta" />
                Outreach Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => sendDueOutreach.mutate()}
                  disabled={isAnyMutationLoading}
                  className="border-forest/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Due Messages
                </Button>
                <Button
                  variant="outline"
                  onClick={() => trpc.useUtils().leadGen.listOutreachSequences.invalidate()}
                  className="border-forest/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Sequences
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-forest/5">
                <h4 className="font-medium text-forest mb-2">Outreach Schedule</h4>
                <div className="space-y-1 text-sm text-forest/70">
                  <p>Day 0: Introduction email</p>
                  <p>Day 2: Follow-up SMS</p>
                  <p>Day 5: Value-add email (website audit)</p>
                  <p>Day 8: Check-in SMS</p>
                  <p>Day 14: Final follow-up email</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-terracotta/5 border border-terracotta/10">
                <h4 className="font-medium text-terracotta mb-2">AI Agent Behavior</h4>
                <div className="space-y-1 text-sm text-forest/70">
                  <p>• Replies to questions autonomously</p>
                  <p>• Pushes for close when buying intent detected</p>
                  <p>• Hands to rep when human touch needed</p>
                  <p>• Escalates enterprise leads to you</p>
                  <p>• Marks uninterested leads and stops sequence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "enterprise" && (
        <div className="space-y-4">
          <Card className="border-forest/10">
            <CardHeader>
              <CardTitle className="text-forest font-serif text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-terracotta" />
                Enterprise Prospects (Your Pipeline)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scanEnterprise.mutate({ limit: 10 })}
                  disabled={isAnyMutationLoading}
                  className="border-forest/10"
                >
                  <Search className="w-4 h-4 mr-1" />
                  Scan for Enterprise Leads
                </Button>
              </div>
              <div className="space-y-3">
                {enterpriseProspects?.map((prospect) => (
                  <div key={prospect.id} className="p-4 rounded-xl border border-forest/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-forest">{prospect.businessName}</h4>
                        <p className="text-xs text-forest/50">
                          {prospect.industry} · {prospect.estimatedEmployees ? `~${prospect.estimatedEmployees} employees` : ""} · {prospect.estimatedRevenue || ""}
                        </p>
                      </div>
                      <Badge variant={
                        prospect.status === "analyzed" ? "secondary" :
                        prospect.status === "report_sent" ? "default" :
                        prospect.status === "in_progress" ? "default" :
                        "outline"
                      }>
                        {prospect.status}
                      </Badge>
                    </div>
                    {prospect.automationOpportunities && (
                      <div className="text-sm text-forest/70">
                        <strong>Automation Opportunities:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {(prospect.automationOpportunities as string[]).map((opp, i) => (
                            <li key={i}>{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prospect.estimatedSavings && (
                      <p className="text-sm text-terracotta font-medium">
                        Est. Savings: {prospect.estimatedSavings}
                      </p>
                    )}
                    {prospect.aiAnalysisReport && (
                      <details className="text-sm text-forest/60">
                        <summary className="cursor-pointer text-forest/80 font-medium">Full AI Report</summary>
                        <p className="mt-2 whitespace-pre-wrap">{prospect.aiAnalysisReport}</p>
                      </details>
                    )}
                    <div className="flex gap-2">
                      {prospect.email && (
                        <a href={`mailto:${prospect.email}`} className="text-xs text-forest/50 hover:text-forest">
                          <Mail className="w-3 h-3 inline mr-1" />{prospect.email}
                        </a>
                      )}
                      {prospect.phone && (
                        <span className="text-xs text-forest/50">
                          📞 {prospect.phone}
                        </span>
                      )}
                      {prospect.linkedinUrl && (
                        <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-forest/50 hover:text-forest">
                          <ExternalLink className="w-3 h-3 inline mr-1" />LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {(!enterpriseProspects || enterpriseProspects.length === 0) && (
                  <p className="text-sm text-forest/50 text-center py-8">
                    No enterprise prospects yet. Click "Scan for Enterprise Leads" to find big-ticket opportunities.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "capacity" && (
        <div className="space-y-4">
          <Card className="border-forest/10">
            <CardHeader>
              <CardTitle className="text-forest font-serif text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-terracotta" />
                Rep Capacity Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => autoFeedReps.mutate()}
                  disabled={isAnyMutationLoading}
                  className="border-forest/10"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Auto-Feed All Reps
                </Button>
              </div>
              <div className="space-y-3">
                {capacity?.map((rep) => (
                  <div key={rep.repId} className="flex items-center justify-between p-3 rounded-lg bg-forest/5">
                    <div>
                      <span className="font-medium text-forest">{rep.repName}</span>
                      {rep.serviceArea && (
                        <span className="text-xs text-forest/50 ml-2">
                          <MapPin className="w-3 h-3 inline" /> {rep.serviceArea}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-medium text-forest">
                          {rep.activeLeads} / {rep.maxCapacity}
                        </span>
                        <span className="text-xs text-forest/50 ml-1">leads</span>
                      </div>
                      {/* Capacity bar */}
                      <div className="w-24 h-2 bg-forest/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rep.activeLeads / rep.maxCapacity > 0.8
                              ? "bg-terracotta"
                              : rep.activeLeads / rep.maxCapacity > 0.4
                              ? "bg-sage"
                              : "bg-forest/30"
                          }`}
                          style={{ width: `${Math.min(100, (rep.activeLeads / rep.maxCapacity) * 100)}%` }}
                        />
                      </div>
                      {rep.needsMoreLeads && (
                        <Badge variant="destructive" className="text-xs">Needs Leads</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {(!capacity || capacity.length === 0) && (
                  <p className="text-sm text-forest/50 text-center py-4">No active reps yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sub?: string;
}) {
  return (
    <Card className="border-forest/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color === "text-forest" ? "bg-forest/10" : color === "text-terracotta" ? "bg-terracotta/10" : "bg-sage/10"}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-forest">{value}</p>
            <p className="text-xs text-forest/50">{label}</p>
            {sub && <p className="text-xs text-terracotta">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
