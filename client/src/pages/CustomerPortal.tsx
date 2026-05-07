import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, BarChart3, HeadphonesIcon, ArrowLeft,
  Calendar, TrendingUp, Eye, Users as UsersIcon,
  Clock, CheckCircle, AlertCircle, Shield, Rocket,
  Gift, Send, Mail, MessageSquare, Download, X,
} from "lucide-react";
import { useLocation } from "wouter";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AIChatBox } from "@/components/AIChatBox";
import { Bot, Loader2, Sparkles, Globe, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "badge-success",
  expiring_soon: "badge-pending",
  expired: "badge-danger",
  renewed: "badge-info",
  cancelled: "badge-neutral",
  pending_payment: "badge-pending-payment",
};

export default function CustomerPortal() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [chatMessages, setChatMessages] = useState<Array<{role: string; content: string}>>([]);
  const [paymentBannerVisible, setPaymentBannerVisible] = useState(
    () => new URLSearchParams(window.location.search).get("payment") === "success"
  );

  // Look up the customer record linked to the logged-in user
  const { data: customer, isLoading: custLoading } = trpc.customers.me.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const portalChat = trpc.ai.portalChat.useMutation();

  const handleConciergeMessage = useCallback(async (message: string) => {
    const newMessages = [...chatMessages, { role: "user" as const, content: message }];
    setChatMessages(newMessages);
    try {
      const result = await portalChat.mutateAsync({
        message,
        customerId: customer?.id ?? 0,
        history: newMessages.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      setChatMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      return result.response;
    } catch {
      return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }
  }, [chatMessages, portalChat, customer]);

  const { data: contracts } = trpc.contracts.byCustomer.useQuery(
    { customerId: customer?.id ?? 0 },
    { enabled: !!customer }
  );

  const { data: reportsData } = trpc.reports.byCustomer.useQuery(
    { customerId: customer?.id ?? 0 },
    { enabled: !!customer }
  );

  const { data: nurtureLogs } = trpc.nurture.byCustomer.useQuery(
    { customerId: customer?.id ?? 0 },
    { enabled: !!customer }
  );

  const { data: upsells } = trpc.upsells.byCustomer.useQuery(
    { customerId: customer?.id ?? 0 },
    { enabled: !!customer }
  );

  const { data: onboardingProject, refetch: refetchProject } = trpc.onboarding.myCurrentProject.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: false }
  );

  const activeContract = contracts?.find((c: any) => c.status === "active" || c.status === "expiring_soon");
  const pendingPaymentContract = contracts?.find((c: any) => c.status === "pending_payment");
  const latestReport = reportsData?.length ? [...reportsData].sort((a: any, b: any) => b.id - a.id)[0] : undefined;
  // Support logs are now fetched inside SupportTab via nurture.mySupportLogs

  if (authLoading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-soft-gray/40 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-off-white mb-2">Customer Portal</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">Sign in to view your website contract, performance reports, and manage your account.</p>
            <Button
              onClick={() => { setLocation("/login?next=/portal"); }}
              className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (custLoading) {
    return (
      <div className="min-h-screen bg-midnight p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-electric/50 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-off-white mb-2">No Account Found</h2>
            <p className="text-sm text-soft-gray font-sans mb-6">
              We couldn't find a customer account linked to your profile. If you recently purchased, it may take a moment to set up.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-electric hover:bg-electric-light text-white font-sans rounded-full px-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysRemaining = activeContract
    ? Math.max(0, Math.ceil((new Date(activeContract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-midnight">
      {paymentBannerVisible && (
        <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Payment successful! Your site is being built — we'll notify you when it's ready for review.</span>
          </div>
          <button onClick={() => setPaymentBannerVisible(false)} className="flex-shrink-0 hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="bg-charcoal text-off-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-serif mb-1">{customer.businessName}</h1>
            <p className="text-xs sm:text-sm text-off-white/50 font-sans">Your MiniMorph website dashboard</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} className="text-off-white border-off-white/20 hover:bg-off-white/10 font-sans text-sm rounded-full w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 sm:mb-8">
          <TabsList className="bg-midnight-dark/30 rounded-full p-1 w-max sm:w-auto">
            <TabsTrigger value="overview" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Overview</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Reports</TabsTrigger>
            <TabsTrigger value="support" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Support</TabsTrigger>
            <TabsTrigger value="upgrades" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Upgrades</TabsTrigger>
            <TabsTrigger value="onboarding" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Onboarding</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Billing</TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Referrals</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">Insights</TabsTrigger>
            <TabsTrigger value="ai-assistant" className="rounded-full font-sans text-sm data-[state=active]:bg-graphite min-h-[44px] px-3 sm:px-4">
              <Bot className="h-3 w-3 mr-1" /> AI Assistant
            </TabsTrigger>
          </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-soft-gray font-sans uppercase tracking-wide">Health Score</span>
                    <CheckCircle className={`h-4 w-4 ${customer.healthScore >= 70 ? "text-green-500" : customer.healthScore >= 40 ? "text-yellow-500" : "text-red-500"}`} />
                  </div>
                  <div className="text-3xl font-serif text-off-white mb-2">{customer.healthScore}/100</div>
                  <Progress value={customer.healthScore} className="h-1.5" />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-soft-gray font-sans uppercase tracking-wide">Contract</span>
                    {activeContract && <Badge className={`text-[10px] font-sans ${statusColors[activeContract.status] ?? ""}`}>{activeContract.status.replace(/_/g, " ")}</Badge>}
                  </div>
                  <div className="text-lg font-serif text-off-white capitalize">{activeContract?.packageTier ?? pendingPaymentContract?.packageTier ?? "No active"} Plan</div>
                  {activeContract ? (
                    <p className="text-xs text-soft-gray font-sans mt-1">{daysRemaining} days remaining</p>
                  ) : pendingPaymentContract ? (
                    <p className="text-xs text-amber-400 font-sans mt-1 font-medium">Awaiting payment</p>
                  ) : (
                    <p className="text-xs text-soft-gray font-sans mt-1">No contract</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-soft-gray font-sans uppercase tracking-wide">Latest Report</span>
                    <BarChart3 className="h-4 w-4 text-electric" />
                  </div>
                  {latestReport ? (
                    <>
                      <div className="text-lg font-serif text-off-white">{latestReport.reportMonth}</div>
                      <p className="text-xs text-soft-gray font-sans mt-1">{(latestReport.pageViews ?? 0).toLocaleString()} page views</p>
                    </>
                  ) : (
                    <p className="text-sm text-soft-gray font-sans">No reports yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Payment Banner */}
            {!activeContract && pendingPaymentContract && (
              <Card className="border-amber-500/20 bg-amber-500/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-serif text-off-white font-medium">Payment Pending</h3>
                      <p className="text-xs text-soft-gray font-sans mt-1">
                        Your <span className="capitalize font-medium">{pendingPaymentContract.packageTier}</span> package is reserved.
                        Please complete payment using the link sent to your email to activate your contract and begin onboarding.
                      </p>
                      <p className="text-xs text-soft-gray font-sans mt-2">
                        Can't find the email? Use the Support tab and we'll resend your payment link.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Contract Details */}
            {activeContract && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-electric" />
                    Contract Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-soft-gray font-sans uppercase tracking-wide mb-1">Package</p>
                      <p className="text-sm font-medium text-off-white font-sans capitalize">{activeContract.packageTier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-gray font-sans uppercase tracking-wide mb-1">Monthly Price</p>
                      <p className="text-sm font-medium text-off-white font-sans">${parseFloat(activeContract.monthlyPrice).toLocaleString()}/mo</p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-gray font-sans uppercase tracking-wide mb-1">Start Date</p>
                      <p className="text-sm font-medium text-off-white font-sans">{new Date(activeContract.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-soft-gray font-sans uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-sm font-medium text-off-white font-sans">{new Date(activeContract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-electric" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!nurtureLogs?.length ? (
                  <p className="text-sm text-soft-gray font-sans text-center py-6">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {nurtureLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/20">
                        <div className="w-2 h-2 rounded-full bg-electric mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-off-white font-sans">{log.subject || log.type.replace(/_/g, " ")}</p>
                          {log.content && <p className="text-xs text-soft-gray font-sans mt-0.5 line-clamp-2">{log.content}</p>}
                        </div>
                        <span className="text-[10px] text-soft-gray/60 font-sans shrink-0">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-electric" />
                  Performance Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!reportsData?.length ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-10 w-10 text-soft-gray/20 mx-auto mb-3" />
                    <p className="text-sm text-soft-gray font-sans">No reports generated yet. Your first monthly report will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportsData.map((report: any) => (
                      <div key={report.id} className="p-5 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-off-white font-sans">{report.reportMonth} Report</h3>
                          <Badge className={`text-[10px] font-sans ${report.status === "delivered" ? "badge-success" : "badge-pending"}`}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                          <div className="text-center p-3 bg-midnight-dark/20 rounded-lg">
                            <Eye className="h-4 w-4 text-soft-gray/60 mx-auto mb-1" />
                            <p className="text-lg font-serif text-off-white">{(report.pageViews ?? 0).toLocaleString()}</p>
                            <p className="text-[10px] text-soft-gray font-sans">Page Views</p>
                          </div>
                          <div className="text-center p-3 bg-midnight-dark/20 rounded-lg">
                            <UsersIcon className="h-4 w-4 text-soft-gray/60 mx-auto mb-1" />
                            <p className="text-lg font-serif text-off-white">{(report.uniqueVisitors ?? 0).toLocaleString()}</p>
                            <p className="text-[10px] text-soft-gray font-sans">Visitors</p>
                          </div>
                          <div className="text-center p-3 bg-midnight-dark/20 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-soft-gray/60 mx-auto mb-1" />
                            <p className="text-lg font-serif text-off-white">{report.bounceRate ?? "N/A"}%</p>
                            <p className="text-[10px] text-soft-gray font-sans">Bounce Rate</p>
                          </div>
                          <div className="text-center p-3 bg-midnight-dark/20 rounded-lg">
                            <Calendar className="h-4 w-4 text-soft-gray/60 mx-auto mb-1" />
                            <p className="text-lg font-serif text-off-white">{report.conversionRate ?? "N/A"}%</p>
                            <p className="text-[10px] text-soft-gray font-sans">Conversion</p>
                          </div>
                        </div>
                        {report.recommendations && (
                          <div className="mt-4 p-3 bg-electric/5 rounded-lg">
                            <p className="text-xs font-medium text-off-white font-sans mb-1">Recommendations</p>
                            <p className="text-xs text-soft-gray font-sans">{report.recommendations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPORT TAB */}
          <TabsContent value="support" className="space-y-6">
            <SupportTab customerId={customer.id} />
          </TabsContent>

          {/* UPGRADES TAB */}
          <TabsContent value="upgrades" className="space-y-6">
            {/* Personalized Recommendations */}
            {(upsells?.length ?? 0) > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-electric" />
                    Recommended for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(upsells ?? []).map((u: any) => (
                      <div key={u.id} className="p-5 rounded-xl border border-border/30 hover:border-electric/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-off-white font-sans">{u.title}</h3>
                          <Badge className={`text-[10px] font-sans ${u.status === "accepted" ? "badge-success" : u.status === "proposed" ? "badge-info" : "badge-neutral"}`}>
                            {u.status}
                          </Badge>
                        </div>
                        {u.description && <p className="text-xs text-soft-gray font-sans mb-3">{u.description}</p>}
                        {u.estimatedValue && (
                          <p className="text-xs text-electric font-sans font-medium">Estimated value: ${parseFloat(u.estimatedValue).toLocaleString()}/mo</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Widget & Add-On Catalog */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-electric" />
                  Grow Your Site
                </CardTitle>
                <p className="text-xs text-soft-gray font-sans mt-1">AI-powered widgets and add-ons to supercharge your website</p>
              </CardHeader>
              <CardContent>
                <WidgetCatalogBrowser customerId={customer?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONBOARDING TAB */}
          <TabsContent value="onboarding" className="space-y-6">
            <OnboardingProjectTab
              project={onboardingProject}
              onRefetch={refetchProject}
              onNavigateToOnboarding={() => setLocation("/onboarding")}
            />
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6">
            <InsightsTab project={onboardingProject} />
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="space-y-6">
            <BillingTab />
          </TabsContent>

          {/* REFERRALS TAB */}
          <TabsContent value="referrals" className="space-y-6">
            <ReferralsTab />
          </TabsContent>

          {/* AI ASSISTANT TAB */}
          <TabsContent value="ai-assistant" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-electric" />
                  AI Concierge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-soft-gray font-sans mb-4">
                  Your personal AI assistant can help you navigate your website project, suggest improvements, answer questions about your plan, and guide you through available upgrades.
                </p>
                <div className="h-[500px] border border-border/30 rounded-lg overflow-hidden">
                  <AIChatBox
                    messages={chatMessages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))}
                    onSendMessage={handleConciergeMessage}
                    isLoading={portalChat.isPending}
                    placeholder="Ask me anything about your website, plan, or available upgrades..."
                    emptyStateMessage="Hi! I'm your MiniMorph AI concierge. I can help you with your website project, suggest improvements, explore upgrade options, or answer any questions about your plan."
                    suggestedPrompts={[
                      "What upgrades are available for my site?",
                      "How is my website performing?",
                      "I want to make changes to my site",
                      "Tell me about AI widgets for my business",
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ONBOARDING PROJECT TAB — Generation status + site review
   ═══════════════════════════════════════════════════════ */
function OnboardingProjectTab({
  project,
  onRefetch,
  onNavigateToOnboarding,
}: {
  project: any;
  onRefetch: () => void;
  onNavigateToOnboarding: () => void;
}) {
  const [changeRequest, setChangeRequest] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [priority, setPriority] = useState<"nice_to_have" | "important" | "must_fix">("important");
  const [previewPage, setPreviewPage] = useState("index");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [reviewMessages, setReviewMessages] = useState<Array<{role: string; content: string}>>([]);
  const requestChangeMutation = trpc.onboarding.requestChange.useMutation();
  const approveMutation = trpc.onboarding.approveLaunch.useMutation();
  const reviewChatMutation = trpc.ai.onboardingChat.useMutation();

  // Parse generated pages (stable across re-renders)
  const pages = useMemo<Record<string, string>>(() => {
    if (!project?.generatedSiteHtml) return {};
    try { return JSON.parse(project.generatedSiteHtml); } catch { return {}; }
  }, [project?.generatedSiteHtml]);

  const pageNames = Object.keys(pages);
  const previewHtml = pages[previewPage] || pages[pageNames[0]] || "";

  // Create/revoke blob URL only when preview HTML changes
  useEffect(() => {
    if (!previewHtml) { setBlobUrl(null); return; }
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewHtml]);

  // Auto-refresh every 15s when generating
  useEffect(() => {
    if (project?.generationStatus !== "generating") return;
    const id = setInterval(onRefetch, 15000);
    return () => clearInterval(id);
  }, [project?.generationStatus, onRefetch]);

  const handleRequestChange = async () => {
    if (!project?.id || !changeRequest.trim()) return;
    const priorityLabel = { nice_to_have: "Nice to have", important: "Important", must_fix: "Must fix" }[priority];
    const page = selectedPage || pageNames[0] || "General";
    const fullRequest = `[Page: ${page}] [Priority: ${priorityLabel}]\n${changeRequest.trim()}`;
    try {
      await requestChangeMutation.mutateAsync({
        projectId: project.id,
        changeRequest: fullRequest,
      });
      toast.success("Change request submitted — your site is being updated.");
      setChangeRequest("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit change request.");
    }
  };

  const handleDownloadPreview = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project?.businessName || "preview").replace(/\s+/g, "-")}-${previewPage}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReviewMessage = useCallback(async (message: string) => {
    const newMessages = [...reviewMessages, { role: "user" as const, content: message }];
    setReviewMessages(newMessages);
    try {
      const result = await reviewChatMutation.mutateAsync({
        message,
        projectId: project?.id,
        context: "review",
        history: newMessages.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      setReviewMessages(prev => [...prev, { role: "assistant", content: result.response }]);
      return result.response;
    } catch {
      return "I'm having trouble connecting right now. Please try again.";
    }
  }, [reviewMessages, reviewChatMutation, project?.id]);

  const handleApprove = async () => {
    if (!project?.id) return;
    try {
      await approveMutation.mutateAsync({ projectId: project.id });
      toast.success("Approved for launch! Our team will take it live soon.");
      onRefetch();
    } catch {
      toast.error("Failed to approve. Please try again.");
    }
  };

  // No project yet
  if (!project) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Rocket className="h-12 w-12 text-soft-gray/20 mx-auto mb-4" />
          <h3 className="text-lg font-serif text-off-white mb-2">Website Onboarding Portal</h3>
          <p className="text-sm text-soft-gray font-sans mb-6 max-w-md mx-auto">
            Meet Elena, our AI creative director, who will guide you through building your perfect website.
          </p>
          <Button
            onClick={onNavigateToOnboarding}
            className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start with Elena
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Site is live
  if (project.stage === "launch" || project.stage === "complete") {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <Globe className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-xl font-serif text-off-white">Your Website is Live!</h3>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-electric hover:underline text-lg font-medium"
            >
              {project.liveUrl}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <p className="text-sm text-soft-gray">
            Congratulations — {project.businessName} is live on the web!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Final approval pending
  if (project.stage === "final_approval") {
    const domainName = (project.questionnaire as any)?.domainName as string | undefined;
    return (
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-electric mx-auto" />
            <h3 className="text-lg font-serif text-off-white">Approved — Going Live Soon</h3>
            <p className="text-sm text-soft-gray max-w-md mx-auto">
              Your site has been approved. Our team is handling DNS setup and final checks. You'll receive an email when it's live.
            </p>
          </CardContent>
        </Card>

        {domainName && (
          <DnsInstructionsCard domain={domainName} />
        )}
      </div>
    );
  }

  // AI is generating
  if (project.generationStatus === "generating") {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-electric/10 flex items-center justify-center mx-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-base">
              E
            </div>
          </div>
          <div>
            <h3 className="text-lg font-serif text-off-white mb-1">Elena is building your website</h3>
            <p className="text-sm text-soft-gray">
              {project.generationLog || "Our AI is crafting your custom website..."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-electric rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-electric rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-electric rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-xs text-soft-gray/50">Auto-refreshing every 15 seconds</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefetch}
            className="text-soft-gray hover:text-electric"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check now
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Generation failed
  if (project.generationStatus === "failed") {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="py-10 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <h3 className="text-base font-serif text-off-white">Generation Encountered an Issue</h3>
          <p className="text-sm text-soft-gray max-w-md mx-auto">
            {project.generationLog || "Something went wrong during site generation."}
          </p>
          <p className="text-xs text-soft-gray/50">Our team has been notified and will resolve this shortly.</p>
        </CardContent>
      </Card>
    );
  }

  // Site ready for review
  if (project.generationStatus === "complete" && project.generatedSiteHtml) {
    const revisionsLeft = project.revisionsRemaining ?? Math.max(0, (project.maxRevisions || 3) - (project.revisionsCount || 0));

    return (
      <div className="space-y-6">
        {/* Preview */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-electric" />
                Site Preview
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1">
                  {pageNames.map(page => (
                    <button
                      key={page}
                      onClick={() => setPreviewPage(page)}
                      className={`text-xs px-3 py-1 rounded-full transition-all ${
                        previewPage === page
                          ? "bg-electric text-midnight font-medium"
                          : "bg-midnight text-soft-gray hover:text-off-white border border-border/30"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPreview}
                  disabled={!previewHtml}
                  className="border-border/40 text-soft-gray hover:text-off-white text-xs h-7 px-2"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {blobUrl ? (
              <iframe
                key={blobUrl}
                src={blobUrl}
                className="w-full h-[500px] border-t border-border/30 rounded-b-xl"
                title="Site Preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-soft-gray">
                {previewHtml ? <Loader2 className="w-5 h-5 animate-spin" /> : "No preview available"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-column: actions + Elena */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change request + approve */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white">
                Request Changes or Approve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300">
                  <strong>Revision Policy:</strong> Your package includes 3 rounds of revisions at no extra cost.
                  {revisionsLeft === 0
                    ? " You've used all included revisions."
                    : ` You have ${revisionsLeft} revision${revisionsLeft === 1 ? "" : "s"} remaining.`}
                </p>
              </div>

              {revisionsLeft > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-soft-gray font-sans block mb-1">Page</label>
                      <select
                        value={selectedPage || pageNames[0] || ""}
                        onChange={e => setSelectedPage(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
                      >
                        {pageNames.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="General">General / Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-soft-gray font-sans block mb-1">Priority</label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as typeof priority)}
                        className="w-full px-2 py-1.5 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
                      >
                        <option value="nice_to_have">Nice to have</option>
                        <option value="important">Important</option>
                        <option value="must_fix">Must fix</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-soft-gray font-sans block mb-1">Describe what you'd like changed</label>
                    <Textarea
                      value={changeRequest}
                      onChange={e => setChangeRequest(e.target.value)}
                      placeholder="e.g. Change the hero headline to 'Premium Auto Detailing in Tampa'. Make the color scheme darker."
                      rows={3}
                      className="bg-midnight-dark border-border/50 text-off-white placeholder-soft-gray/50 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleRequestChange}
                    disabled={!changeRequest.trim() || requestChangeMutation.isPending}
                    variant="outline"
                    className="border-electric text-electric hover:bg-electric/10"
                  >
                    {requestChangeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Request Changes
                  </Button>
                </div>
              )}

              <div className="border-t border-border/30 pt-4">
                <p className="text-sm text-soft-gray mb-3">Happy with how it looks? Approve it and we'll take it live.</p>
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-electric hover:bg-electric-light text-midnight min-h-[44px]"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Rocket className="w-4 h-4 mr-2" />
                  )}
                  Approve & Launch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Elena review chat */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white text-[10px] font-bold">
                  E
                </div>
                Ask Elena
              </CardTitle>
              <p className="text-xs text-soft-gray font-sans mt-0.5">
                Elena can help you decide what to change and how to word your requests.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[420px] border-t border-border/30 rounded-b-xl overflow-hidden">
                <AIChatBox
                  messages={reviewMessages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))}
                  onSendMessage={handleReviewMessage}
                  isLoading={reviewChatMutation.isPending}
                  placeholder="Ask Elena about your site preview..."
                  emptyStateMessage={`Hi! I'm Elena, and I've reviewed your ${project.businessName} website. Ask me anything about the preview — what to change, what looks great, or how to describe your feedback.`}
                  suggestedPrompts={[
                    "What do you think of the homepage?",
                    "How should I word my change request?",
                    "What would make this site convert better?",
                    "Is there anything I should fix before approving?",
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Still in questionnaire/discovery stage
  const savedHistory = project?.elenaConversationHistory as Array<unknown> | null;
  const hasSavedProgress = savedHistory && savedHistory.length > 0;
  const lastSavedAt = project?.lastSavedAt
    ? new Date(project.lastSavedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <Card className="border-border/50">
      <CardContent className="py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-electric/10 flex items-center justify-center mx-auto">
          <Sparkles className="h-8 w-8 text-electric" />
        </div>
        {hasSavedProgress ? (
          <>
            <h3 className="text-lg font-serif text-off-white">Welcome back!</h3>
            <p className="text-sm text-soft-gray max-w-md mx-auto">
              Your conversation with Elena is saved and ready to continue.
              {lastSavedAt && <span className="block text-xs text-electric/60 mt-1">Last saved: {lastSavedAt}</span>}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full w-fit mx-auto">
              <CheckCircle className="h-3 w-3" />
              Progress saved — you won't lose anything
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-serif text-off-white">Continue with Elena</h3>
            <p className="text-sm text-soft-gray max-w-md mx-auto">
              Your website project is in progress. Continue your conversation with Elena to complete the discovery process.
            </p>
          </>
        )}
        <Button
          onClick={onNavigateToOnboarding}
          className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-8"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {hasSavedProgress ? "Resume Conversation" : "Continue with Elena"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   INSIGHTS TAB — Monthly competitive intelligence report
   ═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   DNS INSTRUCTIONS CARD
   Shown in final_approval stage when customer has a domain
   ═══════════════════════════════════════════════════════ */
function DnsInstructionsCard({ domain }: { domain: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const ns1 = "vera.ns.cloudflare.com";
  const ns2 = "wade.ns.cloudflare.com";

  return (
    <Card className="border-electric/20 bg-electric/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
          <Globe className="h-4 w-4 text-electric" />
          Connect Your Domain — {domain}
        </CardTitle>
        <CardDescription className="text-xs text-soft-gray font-sans">
          Update your nameservers at your domain registrar to point {domain} to your new site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-yellow-300 font-sans">Awaiting DNS propagation — up to 48 hours</span>
        </div>

        {/* Nameserver boxes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-soft-gray font-sans uppercase tracking-wide">Your new nameservers</p>
          {[ns1, ns2].map((ns, i) => (
            <div key={i} className="flex items-center justify-between gap-3 bg-midnight-dark/40 border border-border/30 rounded-lg px-4 py-3">
              <code className="text-sm text-electric font-mono">{ns}</code>
              <button
                onClick={() => copyToClipboard(ns, `ns${i}`)}
                className="flex items-center gap-1.5 text-xs text-soft-gray hover:text-off-white transition-colors shrink-0"
              >
                {copied === `ns${i}` ? (
                  <><CheckCircle className="h-3 w-3 text-green-400" /><span className="text-green-400">Copied!</span></>
                ) : (
                  <><Copy className="h-3 w-3" />Copy</>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Step-by-step */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-soft-gray font-sans uppercase tracking-wide">How to update nameservers</p>
          <ol className="space-y-2">
            {[
              `Log in to wherever you purchased ${domain} (GoDaddy, Namecheap, Google Domains, etc.)`,
              "Find DNS Settings, Nameservers, or Domain Management",
              "Select Custom Nameservers and delete the existing ones",
              "Add both nameservers above and save",
              "Changes take 24–48 hours to propagate worldwide",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-soft-gray font-sans">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-electric/20 text-electric text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-soft-gray/60 font-sans">
          We'll send you an email the moment your domain is fully connected. Questions? Reach out via the Support tab.
        </p>
      </CardContent>
    </Card>
  );
}

function InsightsTab({ project }: { project: any }) {
  const [requested, setRequested] = useState(false);
  const requestAnalysis = trpc.onboarding.requestCompetitiveAnalysis.useMutation({
    onSuccess: () => {
      toast.success("Request sent! Our team will run your competitive analysis shortly.");
      setRequested(true);
    },
    onError: (err) => toast.error(err.message || "Unable to submit request. Please try again."),
  });

  const hasReport = !!project?.lastCompetitiveReport;
  const reportDate = project?.lastCompetitiveReportDate
    ? new Date(project.lastCompetitiveReportDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const formattedReport = hasReport
    ? project.lastCompetitiveReport.split("\n").map((line: string, i: number) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-serif text-off-white mt-5 mb-2">{line.replace(/^##\s*/, "")}</h3>;
        if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-serif text-off-white mt-6 mb-2">{line.replace(/^#\s*/, "")}</h2>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i} className="text-sm text-soft-gray font-sans ml-4 mb-1">{line.replace(/^[-•]\s*/, "")}</li>;
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-soft-gray font-sans mb-2">{line}</p>;
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <Card className="border-electric/20 bg-electric/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-electric mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-serif text-off-white font-medium mb-1">Monthly Competitive Intelligence</h4>
              <p className="text-xs text-soft-gray font-sans leading-relaxed">
                Every month on your anniversary date, we analyze your competitors and deliver a report with three specific recommendations to help you stay ahead. Reports are delivered by email and archived here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest report */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-electric" />
              Latest Report
              {reportDate && <span className="text-xs text-soft-gray font-sans font-normal ml-1">— {reportDate}</span>}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled={requestAnalysis.isPending || requested || !project || (project.stage !== "launch" && project.stage !== "complete")}
              onClick={() => requestAnalysis.mutate()}
              className="border-electric/40 text-electric hover:bg-electric/10 text-xs font-sans rounded-full"
            >
              {requestAnalysis.isPending ? (
                <span className="flex items-center gap-1"><span className="animate-spin w-3 h-3 border-2 border-electric border-t-transparent rounded-full" />Requesting...</span>
              ) : requested ? (
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Requested</span>
              ) : (
                "Request Early Analysis"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!project || (project.stage !== "launch" && project.stage !== "complete") ? (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">Competitive reports are available once your site is live.</p>
            </div>
          ) : !hasReport ? (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">Your first competitive report will appear here on your next monthly anniversary date.</p>
              <p className="text-xs text-soft-gray/50 font-sans mt-2">You can request an early analysis using the button above.</p>
            </div>
          ) : (
            <div className="bg-midnight-dark/20 rounded-xl border border-border/20 p-5">
              <div className="prose-content">{formattedReport}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WIDGET CATALOG BROWSER (for customer portal upgrades tab)
   ═══════════════════════════════════════════════════════ */
function WidgetCatalogBrowser({ customerId }: { customerId?: number }) {
  const { data: widgets, isLoading } = trpc.widgetCatalog.list.useQuery();
  const requestWidget = trpc.upsells.requestWidget.useMutation({
    onSuccess: (data) => toast.success(`Interest registered for ${data.widgetName}! Our team will reach out with details.`),
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-midnight-dark/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!widgets?.length) {
    return (
      <div className="text-center py-8">
        <Bot className="h-8 w-8 text-soft-gray/20 mx-auto mb-2" />
        <p className="text-sm text-soft-gray font-sans">No add-ons available yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {widgets.map((widget: any) => (
        <div
          key={widget.id}
          className="p-4 rounded-xl border border-border/30 hover:border-electric/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-electric" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-off-white font-sans">{widget.name}</h4>
              <p className="text-xs text-soft-gray font-sans mt-0.5 line-clamp-2">{widget.description}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-base font-serif text-off-white">${Number(widget.monthlyPrice).toLocaleString()}</span>
                  <span className="text-[10px] text-soft-gray/60 font-sans">/mo</span>

                </div>
                <Button
                  size="sm"
                  className="bg-electric hover:bg-electric-light text-midnight text-xs font-sans rounded-full px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={requestWidget.isPending || !customerId}
                  onClick={() => {
                    if (customerId) {
                      requestWidget.mutate({ customerId, widgetId: widget.id });
                    } else {
                      toast.info("Interested! We'll have your account manager reach out with details.");
                    }
                  }}
                >
                  {requestWidget.isPending ? "Sending..." : "I'm Interested"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BILLING TAB — Payment history & plan details
   ═══════════════════════════════════════════════════════ */
function BillingTab() {
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();
  const [portalLoading, setPortalLoading] = useState(false);
  const createPortalSession = trpc.orders.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      alert(err.message || "Could not open billing portal. Please contact support.");
      setPortalLoading(false);
    },
  });

  const handleManageBilling = () => {
    setPortalLoading(true);
    createPortalSession.mutate({ returnUrl: window.location.href });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "badge-success",
      pending: "badge-pending",
      failed: "badge-danger",
      refunded: "badge-neutral",
    };
    return map[status] || "badge-neutral";
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-electric" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !orders?.length ? (
            <div className="text-center py-12">
              <FileText className="h-8 w-8 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No payments yet.</p>
              <p className="text-xs text-soft-gray/40 font-sans mt-1">Your payment history will appear here once you subscribe.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-electric/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-electric/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-soft-gray/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-off-white font-sans capitalize">
                        {order.packageTier} Plan
                      </p>
                      <p className="text-xs text-soft-gray/60 font-sans">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {order.businessName && ` — ${order.businessName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-serif text-off-white">
                      ${(order.amount / 100).toFixed(2)}
                    </span>
                    <Badge className={`text-[10px] font-sans ${statusBadge(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-electric" />
            Billing Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-soft-gray font-sans leading-relaxed">
            Update your payment method, download invoices, or manage your subscription directly through our secure billing portal.
          </p>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-electric text-midnight font-semibold font-sans text-sm hover:bg-electric/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {portalLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Manage Billing & Invoices
              </>
            )}
          </button>
          <p className="text-xs text-soft-gray/50 font-sans">
            Powered by Stripe — all billing data is handled securely and never stored on our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUPPORT TAB — Request form + support history
   ═══════════════════════════════════════════════════════ */
function SupportTab({ customerId }: { customerId: number }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState<"support_request" | "update_request">("support_request");
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();
  const { data: supportLogs, isLoading } = trpc.nurture.mySupportLogs.useQuery();
  const createRequest = trpc.nurture.createSupportRequest.useMutation({
    onSuccess: () => {
      toast.success("Support request submitted. We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setSubmitted(true);
      utils.nurture.mySupportLogs.invalidate();
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both subject and message.");
      return;
    }
    createRequest.mutate({
      subject: subject.trim(),
      message: message.trim(),
      type: requestType,
    });
  };

  return (
    <div className="space-y-6">
      {/* Revision Policy Card */}
      <Card className="border-amber-500/20 bg-amber-500/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-off-white font-sans mb-1">Revision Policy</h4>
              <p className="text-xs text-soft-gray font-sans leading-relaxed">
                Your package includes <strong>3 rounds of revisions</strong> at no extra cost. Small tweaks (text changes, image swaps) are always free.
                Layout redesigns or new page additions are available as add-ons. Additional revision rounds are <strong>$149 per round</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Request Form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-electric" />
            Submit a Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRequestType("support_request")}
                className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-colors ${
                  requestType === "support_request"
                    ? "bg-electric text-midnight border-electric"
                    : "bg-graphite text-soft-gray border-border/40 hover:border-border/60"
                }`}
              >
                Support Request
              </button>
              <button
                type="button"
                onClick={() => setRequestType("update_request")}
                className={`px-3 py-1.5 text-xs font-sans rounded-full border transition-colors ${
                  requestType === "update_request"
                    ? "bg-electric text-midnight border-electric"
                    : "bg-graphite text-soft-gray border-border/40 hover:border-border/60"
                }`}
              >
                Website Update
              </button>
            </div>
            <div>
              <label className="text-xs text-soft-gray font-sans block mb-1.5">Subject <span className="text-electric">*</span></label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={requestType === "support_request" ? "Describe your issue briefly" : "What would you like changed?"}
                required
                className="w-full px-3 py-2 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white placeholder:text-soft-gray/40 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
              />
            </div>
            <div>
              <label className="text-xs text-soft-gray font-sans block mb-1.5">Message <span className="text-electric">*</span></label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide details about your request..."
                required
                rows={4}
                className="w-full px-3 py-2 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white placeholder:text-soft-gray/40 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={createRequest.isPending || !subject.trim() || !message.trim()}
                className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-6 text-sm"
              >
                {createRequest.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Submit Request
                  </span>
                )}
              </Button>
              {submitted && (
                <span className="text-xs text-emerald-400 font-sans flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Submitted!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Support History */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4 text-electric" />
            Support History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : !supportLogs?.length ? (
            <div className="text-center py-12">
              <HeadphonesIcon className="h-10 w-10 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No support requests yet.</p>
              <p className="text-xs text-soft-gray/40 font-sans mt-1">Submit a request above and track its status here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supportLogs.map((log: any) => (
                <div key={log.id} className="p-4 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-off-white font-sans">{log.subject || "Support Request"}</span>
                    <Badge className={`text-[10px] font-sans ${
                      log.status === "resolved" ? "badge-success" :
                      log.status === "responded" ? "badge-info" :
                      "badge-pending"
                    }`}>
                      {log.status}
                    </Badge>
                  </div>
                  {log.content && <p className="text-xs text-soft-gray font-sans">{log.content}</p>}
                  <p className="text-[10px] text-soft-gray/60 font-sans mt-2">
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""}
                    {" · "}
                    {log.type === "update_request" ? "Website Update" : "Support"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   REFERRALS TAB — Invite form + referral list
   ═══════════════════════════════════════════════════════ */
function ReferralsTab() {
  const [referredName, setReferredName] = useState("");
  const [referredEmail, setReferredEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();
  const { data: referrals, isLoading } = trpc.retention.myReferrals.useQuery();
  const submitReferral = trpc.retention.submitReferral.useMutation({
    onSuccess: () => {
      toast.success("Referral sent! We'll reach out to them with an invitation.");
      setReferredName("");
      setReferredEmail("");
      setSubmitted(true);
      utils.retention.myReferrals.invalidate();
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referredEmail.trim()) {
      toast.error("Please enter an email address.");
      return;
    }
    submitReferral.mutate({
      referredEmail: referredEmail.trim(),
      referredName: referredName.trim() || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    invited: "badge-info",
    signed_up: "badge-pending",
    converted: "badge-success",
  };

  return (
    <div className="space-y-6">
      {/* Referral Invite Form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <Gift className="h-4 w-4 text-electric" />
            Refer a Business
          </CardTitle>
          <p className="text-xs text-soft-gray font-sans mt-1">
            Know someone who needs a great website? Refer them and earn rewards when they sign up.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-soft-gray font-sans block mb-1.5">Their Name <span className="text-soft-gray/40">(optional)</span></label>
                <input
                  type="text"
                  value={referredName}
                  onChange={(e) => setReferredName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white placeholder:text-soft-gray/40 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
                />
              </div>
              <div>
                <label className="text-xs text-soft-gray font-sans block mb-1.5">Their Email <span className="text-electric">*</span></label>
                <input
                  type="email"
                  value={referredEmail}
                  onChange={(e) => setReferredEmail(e.target.value)}
                  placeholder="jane@theirbusiness.com"
                  required
                  className="w-full px-3 py-2 text-sm font-sans rounded-lg border border-border/40 bg-graphite text-off-white placeholder:text-soft-gray/40 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={submitReferral.isPending || !referredEmail.trim()}
                className="bg-electric hover:bg-electric-light text-midnight font-sans rounded-full px-6 text-sm"
              >
                {submitReferral.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Send Referral
                  </span>
                )}
              </Button>
              {submitted && (
                <span className="text-xs text-emerald-400 font-sans flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Sent!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-electric" />
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : !referrals?.length ? (
            <div className="text-center py-12">
              <Gift className="h-10 w-10 text-soft-gray/20 mx-auto mb-3" />
              <p className="text-sm text-soft-gray font-sans">No referrals yet.</p>
              <p className="text-xs text-soft-gray/40 font-sans mt-1">Refer another business using the form above and track their status here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-electric/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-electric" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-off-white font-sans">{ref.referredName || ref.referredEmail}</p>
                      {ref.referredName && <p className="text-xs text-soft-gray/60 font-sans">{ref.referredEmail}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ref.rewardGiven && (
                      <span className="text-xs text-emerald-400 font-sans flex items-center gap-1">
                        <Gift className="h-3 w-3" /> Reward earned
                      </span>
                    )}
                    <Badge className={`text-[10px] font-sans ${statusColors[ref.status] || "badge-neutral"}`}>
                      {ref.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-soft-gray/60 font-sans">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
