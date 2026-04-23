import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useMemo } from "react";

export default function Renewals() {
  const { data: contracts, isLoading } = trpc.contracts.list.useQuery();

  const renewalData = useMemo(() => {
    if (!contracts) return { expiringSoon: [], expired: [], renewed: [], active: [] };
    return {
      expiringSoon: contracts.filter((c: any) => c.status === "expiring_soon"),
      expired: contracts.filter((c: any) => c.status === "expired"),
      renewed: contracts.filter((c: any) => c.status === "renewed"),
      active: contracts.filter((c: any) => c.status === "active"),
    };
  }, [contracts]);

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString() : "—";
  const daysUntil = (d: any) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-forest">Renewal Management</h1>
        <p className="text-sm text-forest/60 font-sans mt-1">Proactive contract renewal tracking, nurture sequences, and retention metrics</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Expiring Soon", value: renewalData.expiringSoon.length, icon: AlertTriangle, color: "text-yellow-600" },
          { label: "Expired", value: renewalData.expired.length, icon: XCircle, color: "text-red-600" },
          { label: "Renewed", value: renewalData.renewed.length, icon: CheckCircle, color: "text-green-600" },
          { label: "Active", value: renewalData.active.length, icon: Clock, color: "text-forest" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-forest">{s.value}</div>
                <div className="text-xs text-forest/50 font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Soon - Priority Section */}
      <Card className="border-yellow-200 bg-yellow-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <CardTitle className="text-base font-serif text-forest">Contracts Expiring Soon</CardTitle>
          </div>
          <p className="text-xs text-forest/50 font-sans">These contracts need proactive renewal outreach</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !renewalData.expiringSoon.length ? (
            <p className="text-sm text-forest/50 font-sans py-4 text-center">No contracts expiring soon. Great retention!</p>
          ) : (
            <div className="space-y-2">
              {renewalData.expiringSoon.map((c: any) => {
                const days = daysUntil(c.endDate);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-yellow-200/50">
                    <div>
                      <span className="text-sm font-medium text-forest font-sans">Customer #{c.customerId}</span>
                      <span className="text-xs text-forest/50 font-sans ml-2 capitalize">{c.packageTier} — ${Number(c.monthlyRate).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs font-sans ${days !== null && days <= 30 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {days !== null ? `${days} days left` : "—"}
                      </Badge>
                      <span className="text-xs text-forest/40 font-sans">Ends {formatDate(c.endDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Contracts Timeline */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-forest">Contract Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !contracts?.length ? (
            <div className="text-center py-12">
              <RefreshCw className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No contracts to track renewals for yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Package</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Start</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">End</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Days Left</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c: any) => {
                    const days = daysUntil(c.endDate);
                    const statusColor: Record<string, string> = {
                      active: "bg-green-100 text-green-700",
                      expiring_soon: "bg-yellow-100 text-yellow-700",
                      expired: "bg-red-100 text-red-700",
                      renewed: "bg-blue-100 text-blue-700",
                      draft: "bg-gray-100 text-gray-700",
                      cancelled: "bg-red-100 text-red-700",
                    };
                    return (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                        <td className="py-3 px-2 font-medium text-forest">Customer #{c.customerId}</td>
                        <td className="py-3 px-2 text-forest/70 capitalize">{c.packageTier}</td>
                        <td className="py-3 px-2 text-forest/50 text-xs">{formatDate(c.startDate)}</td>
                        <td className="py-3 px-2 text-forest/50 text-xs">{formatDate(c.endDate)}</td>
                        <td className="py-3 px-2 text-forest/70">{days !== null ? (days > 0 ? `${days}d` : "Expired") : "—"}</td>
                        <td className="py-3 px-2"><Badge className={`text-xs font-sans ${statusColor[c.status] ?? ""}`}>{c.status.replace(/_/g, " ")}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
