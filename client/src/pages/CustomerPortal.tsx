import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, BarChart3, HeadphonesIcon, ArrowLeft,
  Calendar, TrendingUp, Eye, Users as UsersIcon,
  Clock, CheckCircle, AlertCircle, Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  expiring_soon: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function CustomerPortal() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // For demo: we'll show customer data. In production, you'd look up the customer by user ID.
  // For now, list all customers and show the first one (or prompt to select).
  const { data: customers, isLoading: custLoading } = trpc.customers.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const customer = customers?.[0]; // First customer for demo

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

  const activeContract = contracts?.find((c: any) => c.status === "active" || c.status === "expiring_soon");
  const latestReport = reportsData?.sort((a: any, b: any) => b.id - a.id)?.[0];
  const supportLogs = nurtureLogs?.filter((l: any) => l.type === "support_request" || l.type === "update_request") ?? [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-forest border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-forest/30 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-forest mb-2">Customer Portal</h2>
            <p className="text-sm text-forest/60 font-sans mb-6">Sign in to view your website contract, performance reports, and manage your account.</p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-terracotta hover:bg-terracotta-light text-white font-sans rounded-full px-8"
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
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-terracotta/50 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-forest mb-2">No Account Found</h2>
            <p className="text-sm text-forest/60 font-sans mb-6">
              We couldn't find a customer account linked to your profile. If you recently purchased, it may take a moment to set up.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-forest hover:bg-forest/90 text-white font-sans rounded-full px-8"
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
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif mb-1">{customer.businessName}</h1>
            <p className="text-sm text-white/60 font-sans">Your MiniMorph website dashboard</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")} className="text-white border-white/20 hover:bg-white/10 font-sans text-sm rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-cream-dark/30 rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full font-sans text-sm data-[state=active]:bg-white">Overview</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full font-sans text-sm data-[state=active]:bg-white">Reports</TabsTrigger>
            <TabsTrigger value="support" className="rounded-full font-sans text-sm data-[state=active]:bg-white">Support</TabsTrigger>
            <TabsTrigger value="upgrades" className="rounded-full font-sans text-sm data-[state=active]:bg-white">Upgrades</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Health Score</span>
                    <CheckCircle className={`h-4 w-4 ${customer.healthScore >= 70 ? "text-green-500" : customer.healthScore >= 40 ? "text-yellow-500" : "text-red-500"}`} />
                  </div>
                  <div className="text-3xl font-serif text-forest mb-2">{customer.healthScore}/100</div>
                  <Progress value={customer.healthScore} className="h-1.5" />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Contract</span>
                    {activeContract && <Badge className={`text-[10px] font-sans ${statusColors[activeContract.status] ?? ""}`}>{activeContract.status.replace(/_/g, " ")}</Badge>}
                  </div>
                  <div className="text-lg font-serif text-forest capitalize">{activeContract?.packageTier ?? "No active"} Plan</div>
                  <p className="text-xs text-forest/50 font-sans mt-1">{daysRemaining} days remaining</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-forest/50 font-sans uppercase tracking-wide">Latest Report</span>
                    <BarChart3 className="h-4 w-4 text-terracotta" />
                  </div>
                  {latestReport ? (
                    <>
                      <div className="text-lg font-serif text-forest">{latestReport.reportMonth}</div>
                      <p className="text-xs text-forest/50 font-sans mt-1">{(latestReport.pageViews ?? 0).toLocaleString()} page views</p>
                    </>
                  ) : (
                    <p className="text-sm text-forest/50 font-sans">No reports yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contract Details */}
            {activeContract && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                    <FileText className="h-4 w-4 text-terracotta" />
                    Contract Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-forest/50 font-sans uppercase tracking-wide mb-1">Package</p>
                      <p className="text-sm font-medium text-forest font-sans capitalize">{activeContract.packageTier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-forest/50 font-sans uppercase tracking-wide mb-1">Monthly Price</p>
                      <p className="text-sm font-medium text-forest font-sans">${parseFloat(activeContract.monthlyPrice).toLocaleString()}/mo</p>
                    </div>
                    <div>
                      <p className="text-xs text-forest/50 font-sans uppercase tracking-wide mb-1">Start Date</p>
                      <p className="text-sm font-medium text-forest font-sans">{new Date(activeContract.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-forest/50 font-sans uppercase tracking-wide mb-1">End Date</p>
                      <p className="text-sm font-medium text-forest font-sans">{new Date(activeContract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <Clock className="h-4 w-4 text-terracotta" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!nurtureLogs?.length ? (
                  <p className="text-sm text-forest/50 font-sans text-center py-6">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {nurtureLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/20">
                        <div className="w-2 h-2 rounded-full bg-terracotta mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-forest font-sans">{log.subject || log.type.replace(/_/g, " ")}</p>
                          {log.content && <p className="text-xs text-forest/50 font-sans mt-0.5 line-clamp-2">{log.content}</p>}
                        </div>
                        <span className="text-[10px] text-forest/40 font-sans shrink-0">
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
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-terracotta" />
                  Performance Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!reportsData?.length ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-10 w-10 text-forest/15 mx-auto mb-3" />
                    <p className="text-sm text-forest/50 font-sans">No reports generated yet. Your first monthly report will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportsData.map((report: any) => (
                      <div key={report.id} className="p-5 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-forest font-sans">{report.reportMonth} Report</h3>
                          <Badge className={`text-[10px] font-sans ${report.status === "delivered" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-cream-dark/20 rounded-lg">
                            <Eye className="h-4 w-4 text-forest/40 mx-auto mb-1" />
                            <p className="text-lg font-serif text-forest">{(report.pageViews ?? 0).toLocaleString()}</p>
                            <p className="text-[10px] text-forest/50 font-sans">Page Views</p>
                          </div>
                          <div className="text-center p-3 bg-cream-dark/20 rounded-lg">
                            <UsersIcon className="h-4 w-4 text-forest/40 mx-auto mb-1" />
                            <p className="text-lg font-serif text-forest">{(report.uniqueVisitors ?? 0).toLocaleString()}</p>
                            <p className="text-[10px] text-forest/50 font-sans">Visitors</p>
                          </div>
                          <div className="text-center p-3 bg-cream-dark/20 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-forest/40 mx-auto mb-1" />
                            <p className="text-lg font-serif text-forest">{report.bounceRate ?? "N/A"}%</p>
                            <p className="text-[10px] text-forest/50 font-sans">Bounce Rate</p>
                          </div>
                          <div className="text-center p-3 bg-cream-dark/20 rounded-lg">
                            <Calendar className="h-4 w-4 text-forest/40 mx-auto mb-1" />
                            <p className="text-lg font-serif text-forest">{report.conversionRate ?? "N/A"}%</p>
                            <p className="text-[10px] text-forest/50 font-sans">Conversion</p>
                          </div>
                        </div>
                        {report.recommendations && (
                          <div className="mt-4 p-3 bg-sage/10 rounded-lg">
                            <p className="text-xs font-medium text-forest font-sans mb-1">Recommendations</p>
                            <p className="text-xs text-forest/60 font-sans">{report.recommendations}</p>
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
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <HeadphonesIcon className="h-4 w-4 text-terracotta" />
                  Support History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <HeadphonesIcon className="h-10 w-10 text-forest/15 mx-auto mb-3" />
                    <p className="text-sm text-forest/50 font-sans mb-4">No support requests yet.</p>
                    <p className="text-xs text-forest/40 font-sans">Need help? Your AI support team is always ready. Contact us through the main site.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportLogs.map((log: any) => (
                      <div key={log.id} className="p-4 rounded-lg border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-forest font-sans">{log.subject || "Support Request"}</span>
                          <Badge className={`text-[10px] font-sans ${log.status === "resolved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {log.status}
                          </Badge>
                        </div>
                        {log.content && <p className="text-xs text-forest/60 font-sans">{log.content}</p>}
                        <p className="text-[10px] text-forest/40 font-sans mt-2">
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ""} via {log.channel}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UPGRADES TAB */}
          <TabsContent value="upgrades" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-forest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-terracotta" />
                  Available Upgrades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!upsells?.length ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-10 w-10 text-forest/15 mx-auto mb-3" />
                    <p className="text-sm text-forest/50 font-sans">No upgrade recommendations at this time.</p>
                    <p className="text-xs text-forest/40 font-sans mt-1">We'll suggest improvements when we spot opportunities to grow your site.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upsells.map((u: any) => (
                      <div key={u.id} className="p-5 rounded-xl border border-border/30 hover:border-terracotta/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-forest font-sans">{u.title}</h3>
                          <Badge className={`text-[10px] font-sans ${u.status === "accepted" ? "bg-green-100 text-green-700" : u.status === "proposed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {u.status}
                          </Badge>
                        </div>
                        {u.description && <p className="text-xs text-forest/60 font-sans mb-3">{u.description}</p>}
                        {u.estimatedValue && (
                          <p className="text-xs text-terracotta font-sans font-medium">Estimated value: ${parseFloat(u.estimatedValue).toLocaleString()}/mo</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
