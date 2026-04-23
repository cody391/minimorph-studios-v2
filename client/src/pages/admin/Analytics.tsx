import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Globe, ExternalLink, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { toast } from "sonner";

// Placeholder analytics data — in production, this would come from Google Analytics API
const placeholderMetrics = {
  totalPageViews: 12847,
  uniqueVisitors: 4231,
  avgSessionDuration: "2m 34s",
  bounceRate: "42.3%",
  topPages: [
    { path: "/", views: 5420, change: 12.3 },
    { path: "/services", views: 2180, change: 8.7 },
    { path: "/portfolio", views: 1890, change: -2.1 },
    { path: "/pricing", views: 1640, change: 15.4 },
    { path: "/get-started", views: 980, change: 22.8 },
    { path: "/become-rep", views: 737, change: 5.2 },
  ],
  trafficSources: [
    { source: "Organic Search", sessions: 1820, pct: 43 },
    { source: "Direct", sessions: 1050, pct: 25 },
    { source: "Social Media", sessions: 680, pct: 16 },
    { source: "Referral", sessions: 420, pct: 10 },
    { source: "Email", sessions: 261, pct: 6 },
  ],
  weeklyTrend: [
    { day: "Mon", views: 1840 },
    { day: "Tue", views: 2120 },
    { day: "Wed", views: 1960 },
    { day: "Thu", views: 2340 },
    { day: "Fri", views: 2080 },
    { day: "Sat", views: 1420 },
    { day: "Sun", views: 1087 },
  ],
};

export default function Analytics() {
  const maxViews = Math.max(...placeholderMetrics.weeklyTrend.map((d) => d.views));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Analytics</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">
            Website performance metrics and traffic insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 text-xs font-sans">
            Demo Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-sans"
            onClick={() => toast.info("Google Analytics integration coming soon. Connect your GA4 property to see live data.")}
          >
            <ExternalLink className="h-3 w-3 mr-1" /> Connect GA4
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Page Views", value: placeholderMetrics.totalPageViews.toLocaleString(), icon: BarChart3, change: 14.2 },
          { label: "Unique Visitors", value: placeholderMetrics.uniqueVisitors.toLocaleString(), icon: Users, change: 8.5 },
          { label: "Avg. Session", value: placeholderMetrics.avgSessionDuration, icon: TrendingUp, change: 3.1 },
          { label: "Bounce Rate", value: placeholderMetrics.bounceRate, icon: Globe, change: -2.4 },
        ].map((m) => (
          <Card key={m.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-forest/50 font-sans uppercase tracking-wider">{m.label}</span>
                <m.icon className="h-4 w-4 text-forest/30" />
              </div>
              <div className="text-2xl font-serif text-forest">{m.value}</div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-sans ${m.change > 0 ? "text-green-600" : m.change < 0 ? "text-red-500" : "text-forest/40"}`}>
                {m.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : m.change < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {Math.abs(m.change)}% vs last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Trend */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-forest">Weekly Traffic Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {placeholderMetrics.weeklyTrend.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-forest/50 font-sans">{d.views.toLocaleString()}</span>
                <div
                  className="w-full bg-forest/15 rounded-t-md hover:bg-forest/25 transition-colors"
                  style={{ height: `${(d.views / maxViews) * 100}%` }}
                />
                <span className="text-xs text-forest/60 font-sans">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pages */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {placeholderMetrics.topPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-forest/70 bg-cream-dark/50 px-2 py-0.5 rounded font-sans">{p.path}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-forest font-sans">{p.views.toLocaleString()}</span>
                    <span className={`text-xs font-sans flex items-center gap-0.5 ${p.change > 0 ? "text-green-600" : "text-red-500"}`}>
                      {p.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(p.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-serif text-forest">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {placeholderMetrics.trafficSources.map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-sans">
                    <span className="text-forest/80">{s.source}</span>
                    <span className="text-forest/60">{s.sessions.toLocaleString()} ({s.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-cream-dark/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest/30 rounded-full"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Notice */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4 text-yellow-700" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-forest font-sans">Google Analytics Integration</h3>
              <p className="text-xs text-forest/60 font-sans mt-1">
                This page currently shows placeholder data. To see live analytics, connect your Google Analytics 4 property.
                Once connected, this dashboard will display real-time traffic data, conversion metrics, and customer website performance reports.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs font-sans border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                onClick={() => toast.info("GA4 integration setup will be available in a future update.")}
              >
                Learn How to Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
