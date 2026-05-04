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
  ChevronDown, ChevronUp, ExternalLink, Star, Pause, AlertTriangle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LeadGenEngine() {
  const [scrapeArea, setScrapeArea] = useState("");
  const [scrapeRadius, setScrapeRadius] = useState(25);
  const [showScrapeJobs, setShowScrapeJobs] = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(false);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "scrape" | "outreach" | "enterprise" | "capacity" | "scoring" | "performance">("overview");
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.leadGen.getStats.useQuery();
  const { data: capacity } = trpc.leadGen.getRepCapacity.useQuery();
  const { data: scrapeJobs } = trpc.leadGen.listScrapeJobs.useQuery();
  const { data: businesses } = trpc.leadGen.listScrapedBusinesses.useQuery({ limit: 20 });
  const { data: enterpriseProspects } = trpc.leadGen.listEnterpriseProspects.useQuery();
  const { data: systemSettings, refetch: refetchSettings } = trpc.admin.getSystemSettings.useQuery();

  const utils = trpc.useUtils();

  const engineActive = systemSettings?.find((s: any) => s.settingKey === "lead_engine_active")?.settingValue === "true";

  const updateSetting = trpc.admin.updateSystemSetting.useMutation({
    onSuccess: () => { refetchSettings(); refetchStats(); },
    onError: (err: any) => toast.error(err.message),
  });

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

  const runReengagement = trpc.leadGen.runReengagement.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.reengaged} cold leads re-engaged`);
      refetchStats();
    },
  });

  const runEnhancedPipeline = trpc.leadGen.runEnhancedPipeline.useMutation({
    onSuccess: (data) => {
      toast.success(`Enhanced pipeline: ${data.websitesScored} scored, ${data.leadsRescored} rescored, ${data.reengaged} re-engaged`);
      refetchStats();
    },
  });

  const handleStartScrape = () => {
    if (!scrapeArea.trim()) {
      toast.error("Enter a target area (e.g., 'Muskegon, MI')");
      return;
    }
    createScrapeJob.mutate({ targetArea: scrapeArea, radiusKm: scrapeRadius });
    setScrapeArea("");
  };

  const isAnyMutationLoading = createScrapeJob.isPending || scoreWebsites.isPending ||
    enrichBusinesses.isPending || convertToLeads.isPending || autoFeedReps.isPending ||
    runFullPipeline.isPending || sendDueOutreach.isPending || scanEnterprise.isPending ||
    runReengagement.isPending || runEnhancedPipeline.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-off-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-electric" />
            Lead Generation Engine
          </h1>
          <p className="text-sm text-soft-gray font-sans mt-1">
            Autonomous lead discovery, enrichment, outreach, and routing
          </p>
        </div>
        <div className="flex gap-2">
          {/* Part 7: Engine pause toggle */}
          {engineActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPauseConfirm(true)}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <Pause className="w-4 h-4 mr-1" /> Pause Engine
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => updateSetting.mutate({ key: "lead_engine_active", value: "true" })}
              disabled={updateSetting.isPending}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Play className="w-4 h-4 mr-1" /> Resume Engine
            </Button>
          )}
          {!engineActive && (
            <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> Engine Paused
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            className="border-electric/20"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => runEnhancedPipeline.mutate()}
            disabled={isAnyMutationLoading || !engineActive}
            className="bg-electric hover:bg-electric/90 text-white"
          >
            {runEnhancedPipeline.isPending ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 mr-1" />
            )}
            Run Enhanced Pipeline
          </Button>
        </div>
      </div>

      {/* Part 7: Pause confirmation dialog */}
      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause the Lead Engine?</AlertDialogTitle>
            <AlertDialogDescription>
              All scheduled jobs (scraping, scoring, enrichment, outreach, auto-feed, re-engagement) will stop running until you resume. Active leads and existing data are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateSetting.mutate({ key: "lead_engine_active", value: "false" });
                setShowPauseConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Pause Engine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Scraped" value={stats.totalScraped} icon={Globe} color="text-off-white" />
          <StatCard label="Qualified" value={stats.totalQualified} icon={Search} color="text-soft-gray" />
          <StatCard label="Enriched" value={stats.totalEnriched} icon={Brain} color="text-electric" />
          <StatCard label="Converted" value={stats.totalConverted} icon={Target} color="text-off-white" />
          <StatCard label="AI Leads" value={stats.totalLeadsGenerated} icon={Zap} color="text-electric" />
          <StatCard label="In Pipeline" value={stats.leadsInPipeline} icon={Rocket} color="text-soft-gray" />
          <StatCard label="Closed Won" value={stats.leadsClosedWon} icon={Star} color="text-off-white" />
          <StatCard label="Active Reps" value={stats.repsActive} icon={Users} color="text-electric" sub={`${stats.repsNeedingLeads} need leads`} />
        </div>
      ) : null}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-electric/10 pb-2 overflow-x-auto">
        {(["overview", "scrape", "outreach", "enterprise", "capacity", "scoring", "performance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              selectedTab === tab
                ? "bg-charcoal text-off-white"
                : "text-soft-gray hover:text-electric hover:bg-electric/10"
            }`}
          >
            {tab === "overview" ? "Overview" :
             tab === "scrape" ? "Scraping" :
             tab === "outreach" ? "Outreach" :
             tab === "enterprise" ? "Enterprise" :
             tab === "capacity" ? "Rep Capacity" :
             tab === "scoring" ? "ML Scoring" :
             "Rep Performance"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="space-y-4">
          {/* Pipeline Flow */}
          <Card className="border-electric/10">
            <CardHeader>
              <CardTitle className="text-off-white font-serif text-lg">Pipeline Flow</CardTitle>
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
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border border-electric/10 hover:border-electric/30 hover:bg-electric/5 transition-all min-w-[80px]"
                    >
                      <step.icon className="w-5 h-5 text-soft-gray" />
                      <span className="text-xs font-medium text-off-white">{step.label}</span>
                      <span className="text-lg font-bold text-electric">{step.count ?? 0}</span>
                    </button>
                    {i < 5 && <span className="text-soft-gray/40 text-lg">→</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-electric/10"
              onClick={() => scoreWebsites.mutate({ limit: 20 })}
              disabled={isAnyMutationLoading}
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Score Websites</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-electric/10"
              onClick={() => enrichBusinesses.mutate({ limit: 10 })}
              disabled={isAnyMutationLoading}
            >
              <Brain className="w-4 h-4" />
              <span className="text-xs">Enrich Businesses</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-electric/10"
              onClick={() => sendDueOutreach.mutate()}
              disabled={isAnyMutationLoading}
            >
              <Mail className="w-4 h-4" />
              <span className="text-xs">Send Outreach</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 border-electric/10"
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
          <Card className="border-electric/10">
            <CardHeader>
              <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-electric" />
                Start New Scrape
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Target area (e.g., 'Muskegon, MI' or 'Grand Rapids, MI')"
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
                  className="bg-electric hover:bg-electric-light text-white"
                >
                  {createScrapeJob.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Scrape
                </Button>
              </div>
              <p className="text-xs text-soft-gray">
                Searches Google Maps for businesses without websites or with poor web presence.
                Targets: restaurants, salons, contractors, medical offices, and more.
              </p>
            </CardContent>
          </Card>

          {/* Scrape Jobs List */}
          <Card className="border-electric/10">
            <CardHeader className="cursor-pointer" onClick={() => setShowScrapeJobs(!showScrapeJobs)}>
              <CardTitle className="text-off-white font-serif text-lg flex items-center justify-between">
                <span>Scrape Jobs ({scrapeJobs?.length || 0})</span>
                {showScrapeJobs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showScrapeJobs && (
              <CardContent>
                <div className="space-y-2">
                  {scrapeJobs?.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-electric/10">
                      <div>
                        <span className="font-medium text-off-white">{job.targetArea}</span>
                        <span className="text-xs text-soft-gray ml-2">
                          {job.radiusKm}km radius
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-soft-gray">
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
                    <p className="text-sm text-soft-gray text-center py-4">No scrape jobs yet. Start one above.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Scraped Businesses */}
          <Card className="border-electric/10">
            <CardHeader className="cursor-pointer" onClick={() => setShowBusinesses(!showBusinesses)}>
              <CardTitle className="text-off-white font-serif text-lg flex items-center justify-between">
                <span>Scraped Businesses ({businesses?.length || 0})</span>
                {showBusinesses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {showBusinesses && (
              <CardContent>
                <div className="space-y-2">
                  {businesses?.map((biz) => (
                    <div key={biz.id} className="p-3 rounded-lg bg-electric/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-off-white">{biz.businessName}</span>
                          {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 text-soft-gray/60" />
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
                      <div className="text-xs text-soft-gray">
                        {biz.address} · {biz.rating ? `★ ${biz.rating}` : ""} ({biz.reviewCount || 0} reviews)
                      </div>
                    </div>
                  ))}
                  {(!businesses || businesses.length === 0) && (
                    <p className="text-sm text-soft-gray text-center py-4">No businesses scraped yet.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {selectedTab === "outreach" && (
        <div className="space-y-4">
          <Card className="border-electric/10">
            <CardHeader>
              <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-electric" />
                Outreach Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => sendDueOutreach.mutate()}
                  disabled={isAnyMutationLoading}
                  className="border-electric/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Due Messages
                </Button>
                <Button
                  variant="outline"
                  onClick={() => utils.leadGen.listOutreachSequences.invalidate()}
                  className="border-electric/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Sequences
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runReengagement.mutate()}
                  disabled={isAnyMutationLoading}
                  className="border-electric/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-engage Cold Leads
                </Button>
              </div>
              <div className="p-4 rounded-lg bg-electric/10">
                <h4 className="font-medium text-off-white mb-2">Smart Outreach Schedule</h4>
                <div className="space-y-1 text-sm text-soft-gray">
                  <p>Day 0: Introduction email (with website audit PDF)</p>
                  <p>Day 2: Follow-up SMS (sent at optimal time)</p>
                  <p>Day 5: Value-add email (competitor comparison)</p>
                  <p>Day 8: Check-in SMS (branched based on behavior)</p>
                  <p>Day 14: Final follow-up or auto-proposal</p>
                  <p className="text-electric font-medium mt-2">Day 30+: Re-engagement campaign for cold leads</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-electric/5 border border-border/50">
                <h4 className="font-medium text-off-white mb-2">Smart Features</h4>
                <div className="space-y-1 text-sm text-soft-gray">
                  <p>• Website Audit PDF attached to first email as lead magnet</p>
                  <p>• Optimal send timing based on industry patterns</p>
                  <p>• Drip branches based on lead behavior (opened, clicked, replied)</p>
                  <p>• Auto-proposal generation when buying intent detected</p>
                  <p>• Competitor intelligence included in outreach</p>
                  <p>• Re-engagement campaigns for leads that went cold after 30 days</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-electric/5 border border-electric/10">
                <h4 className="font-medium text-electric mb-2">AI Agent Behavior</h4>
                <div className="space-y-1 text-sm text-soft-gray">
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
          <Card className="border-electric/10">
            <CardHeader>
              <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-electric" />
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
                  className="border-electric/10"
                >
                  <Search className="w-4 h-4 mr-1" />
                  Scan for Enterprise Leads
                </Button>
              </div>
              <div className="space-y-3">
                {enterpriseProspects?.map((prospect) => (
                  <div key={prospect.id} className="p-4 rounded-xl border border-electric/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-off-white">{prospect.businessName}</h4>
                        <p className="text-xs text-soft-gray">
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
                      <div className="text-sm text-soft-gray">
                        <strong>Automation Opportunities:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {(prospect.automationOpportunities as string[]).map((opp, i) => (
                            <li key={i}>{opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prospect.estimatedSavings && (
                      <p className="text-sm text-electric font-medium">
                        Est. Savings: {prospect.estimatedSavings}
                      </p>
                    )}
                    {prospect.aiAnalysisReport && (
                      <details className="text-sm text-soft-gray">
                        <summary className="cursor-pointer text-off-white/80 font-medium">Full AI Report</summary>
                        <p className="mt-2 whitespace-pre-wrap">{prospect.aiAnalysisReport}</p>
                      </details>
                    )}
                    <div className="flex gap-2">
                      {prospect.email && (
                        <a href={`mailto:${prospect.email}`} className="text-xs text-soft-gray hover:text-off-white">
                          <Mail className="w-3 h-3 inline mr-1" />{prospect.email}
                        </a>
                      )}
                      {prospect.phone && (
                        <span className="text-xs text-soft-gray">
                          📞 {prospect.phone}
                        </span>
                      )}
                      {prospect.linkedinUrl && (
                        <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-soft-gray hover:text-off-white">
                          <ExternalLink className="w-3 h-3 inline mr-1" />LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {(!enterpriseProspects || enterpriseProspects.length === 0) && (
                  <p className="text-sm text-soft-gray text-center py-8">
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
          <Card className="border-electric/10">
            <CardHeader>
              <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-electric" />
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
                  className="border-electric/10"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Auto-Feed All Reps
                </Button>
              </div>
              <div className="space-y-3">
                {capacity?.map((rep) => (
                  <div key={rep.repId} className="flex items-center justify-between p-3 rounded-lg bg-electric/10">
                    <div>
                      <span className="font-medium text-off-white">{rep.repName}</span>
                      {rep.serviceArea && (
                        <span className="text-xs text-soft-gray ml-2">
                          <MapPin className="w-3 h-3 inline" /> {rep.serviceArea}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-medium text-off-white">
                          {rep.activeLeads} / {rep.maxCapacity}
                        </span>
                        <span className="text-xs text-soft-gray ml-1">leads</span>
                      </div>
                      {/* Capacity bar */}
                      <div className="w-24 h-2 bg-electric/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rep.activeLeads / rep.maxCapacity > 0.8
                              ? "bg-electric"
                              : rep.activeLeads / rep.maxCapacity > 0.4
                              ? "bg-graphite"
                              : "bg-electric/30"
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
                  <p className="text-sm text-soft-gray text-center py-4">No active reps yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {selectedTab === "scoring" && <ScoringTab isAnyMutationLoading={isAnyMutationLoading} refetchStats={refetchStats} />}

      {selectedTab === "performance" && <PerformanceTab />}
    </div>
  );
}

function ScoringTab({ isAnyMutationLoading, refetchStats }: { isAnyMutationLoading: boolean; refetchStats: () => void }) {
  const { data: insights, isLoading } = trpc.leadGen.getScoringInsights.useQuery();
  const rescoreAll = trpc.leadGen.rescoreAllLeads.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rescored} leads rescored with ML model`);
      refetchStats();
    },
  });

  return (
    <div className="space-y-4">
      <Card className="border-electric/10">
        <CardHeader>
          <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-electric" />
            ML Scoring Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rescoreAll.mutate()}
              disabled={isAnyMutationLoading || rescoreAll.isPending}
              className="border-electric/10"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${rescoreAll.isPending ? "animate-spin" : ""}`} />
              Re-score All Active Leads
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : insights ? (
            <>
              {/* Model Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-electric/10 text-center">
                  <p className="text-2xl font-bold text-off-white">{insights.modelConfidence}%</p>
                  <p className="text-xs text-soft-gray">Model Confidence</p>
                </div>
                <div className="p-3 rounded-lg bg-electric/10 text-center">
                  <p className="text-2xl font-bold text-off-white">{insights.totalClosedLeads}</p>
                  <p className="text-xs text-soft-gray">Training Samples</p>
                </div>
                <div className="p-3 rounded-lg bg-electric/10 text-center">
                  <p className="text-2xl font-bold text-electric">{insights.overallWinRate}%</p>
                  <p className="text-xs text-soft-gray">Win Rate</p>
                </div>
                <div className="p-3 rounded-lg bg-electric/10 text-center">
                  <p className="text-2xl font-bold text-off-white">{Object.keys(insights.weights.industryMultiplier).length}</p>
                  <p className="text-xs text-soft-gray">Industry Patterns</p>
                </div>
              </div>

              {/* Scoring Weights */}
              <div className="p-4 rounded-lg bg-electric/10">
                <h4 className="font-medium text-off-white mb-3">Learned Scoring Weights</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "No Website", value: insights.weights.noWebsite },
                    { label: "Bad Website", value: insights.weights.badWebsiteScore },
                    { label: "High Rating", value: insights.weights.highGoogleRating },
                    { label: "Many Reviews", value: insights.weights.manyReviews },
                    { label: "Has Phone", value: insights.weights.hasPhone },
                    { label: "Has Email", value: insights.weights.hasEmail },
                    { label: "Self-Sourced", value: insights.weights.selfSourcedBonus },
                    { label: "Intent Signal", value: insights.weights.intentSignalBonus },
                  ].map((w) => (
                    <div key={w.label} className="flex items-center justify-between p-2 rounded bg-charcoal">
                      <span className="text-xs text-soft-gray">{w.label}</span>
                      <span className="text-sm font-bold text-electric">+{w.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Industries */}
              {insights.topIndustries.length > 0 && (
                <div className="p-4 rounded-lg bg-electric/5 border border-border/50">
                  <h4 className="font-medium text-off-white mb-3">Top Converting Industries</h4>
                  <div className="space-y-2">
                    {insights.topIndustries.map((ind) => (
                      <div key={ind.industry} className="flex items-center justify-between">
                        <span className="text-sm text-off-white">{ind.industry}</span>
                        <Badge variant={ind.multiplier > 1.2 ? "default" : ind.multiplier > 0.8 ? "secondary" : "destructive"}>
                          {ind.multiplier > 1 ? "+" : ""}{Math.round((ind.multiplier - 1) * 100)}% vs avg
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-soft-gray/60 text-center">
                Model last updated: {new Date(insights.weights.updatedAt).toLocaleString()} · Based on {insights.weights.sampleSize} closed leads
              </p>
            </>
          ) : (
            <p className="text-sm text-soft-gray text-center py-8">No scoring data available yet. Close some deals to train the model.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceTab() {
  const { data: performance, isLoading } = trpc.leadGen.getRepPerformance.useQuery();

  return (
    <div className="space-y-4">
      <Card className="border-electric/10">
        <CardHeader>
          <CardTitle className="text-off-white font-serif text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-electric" />
            Rep Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : performance && performance.length > 0 ? (
            <div className="space-y-3">
              {performance.sort((a, b) => b.overallCloseRate - a.overallCloseRate).map((rep, i) => (
                <div key={rep.repId} className="p-4 rounded-xl border border-electric/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        i === 0 ? "bg-electric" : i === 1 ? "bg-electric" : "bg-graphite"
                      }`}>
                        #{i + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-off-white">{rep.repName}</h4>
                        <p className="text-xs text-soft-gray">{rep.activeLeads} active leads · {rep.totalDeals} deals closed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-electric">{rep.overallCloseRate}%</p>
                      <p className="text-xs text-soft-gray">close rate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2 rounded-lg bg-electric/10 text-center">
                      <p className="text-lg font-bold text-off-white">${rep.avgDealSize.toLocaleString()}</p>
                      <p className="text-xs text-soft-gray">Avg Deal</p>
                    </div>
                    <div className="p-2 rounded-lg bg-electric/10 text-center">
                      <p className="text-lg font-bold text-off-white">{rep.avgTimeToClose}d</p>
                      <p className="text-xs text-soft-gray">Avg Close Time</p>
                    </div>
                    <div className="p-2 rounded-lg bg-electric/10 text-center">
                      <p className="text-lg font-bold text-off-white">${rep.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-soft-gray">Total Revenue</p>
                    </div>
                  </div>

                  {/* Industry breakdown */}
                  {Object.keys(rep.industryCloseRates).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(rep.industryCloseRates)
                        .sort(([,a], [,b]) => b.rate - a.rate)
                        .slice(0, 5)
                        .map(([industry, stats]) => (
                          <Badge key={industry} variant={stats.rate > 0.5 ? "default" : stats.rate > 0.25 ? "secondary" : "outline"} className="text-xs">
                            {industry}: {Math.round(stats.rate * 100)}% ({stats.won}/{stats.total})
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-soft-gray text-center py-8">
              No rep performance data yet. Reps need to close deals to generate analytics.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-electric/10">
        <CardContent className="p-4">
          <div className="p-4 rounded-lg bg-electric/5 border border-electric/10">
            <h4 className="font-medium text-electric mb-2">Performance-Based Routing</h4>
            <div className="space-y-1 text-sm text-soft-gray">
              <p>• Leads are routed to reps based on their close rate per industry, not just capacity</p>
              <p>• Restaurant lead? Goes to the rep who closes restaurants best</p>
              <p>• New reps get a mix of industries to build their profile</p>
              <p>• The system learns and adapts as more deals close</p>
            </div>
          </div>
        </CardContent>
      </Card>
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
    <Card className="border-electric/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color === "text-off-white" ? "bg-electric/10" : color === "text-electric" ? "bg-electric/10" : "bg-electric/5"}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-off-white">{value}</p>
            <p className="text-xs text-soft-gray">{label}</p>
            {sub && <p className="text-xs text-electric">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
