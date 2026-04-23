import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Clock, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const tierColors: Record<string, string> = {
  starter: "bg-blue-100 text-blue-800",
  growth: "bg-purple-100 text-purple-800",
  premium: "bg-amber-100 text-amber-800",
};

export default function AdminOrders() {
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const totalRevenue = orders?.filter(o => o.status === "paid").reduce((sum, o) => sum + o.amount, 0) ?? 0;
  const paidCount = orders?.filter(o => o.status === "paid").length ?? 0;
  const pendingCount = orders?.filter(o => o.status === "pending").length ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-forest mb-2">Orders</h1>
        <p className="text-forest/60 font-sans text-sm">
          Stripe payment records and checkout sessions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-forest/10">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-forest/40" />
            <span className="text-sm font-sans text-forest/60">Total Revenue</span>
          </div>
          <p className="text-2xl font-serif text-forest">${(totalRevenue / 100).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-forest/10">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-sans text-forest/60">Paid Orders</span>
          </div>
          <p className="text-2xl font-serif text-forest">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-forest/10">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-sans text-forest/60">Pending</span>
          </div>
          <p className="text-2xl font-serif text-forest">{pendingCount}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-forest/10 overflow-hidden">
        <div className="p-5 border-b border-forest/10">
          <h2 className="font-sans font-medium text-forest flex items-center gap-2">
            <Package className="w-4 h-4" />
            All Orders
          </h2>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-forest/40 font-sans">Loading orders...</div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-10 text-center text-forest/40 font-sans">
            No orders yet. Orders will appear here after customers complete Stripe checkout.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest/10">
                  <th className="text-left p-4 text-xs font-sans font-medium text-forest/50 uppercase tracking-wider">Customer</th>
                  <th className="text-left p-4 text-xs font-sans font-medium text-forest/50 uppercase tracking-wider">Package</th>
                  <th className="text-left p-4 text-xs font-sans font-medium text-forest/50 uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-xs font-sans font-medium text-forest/50 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-sans font-medium text-forest/50 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-forest/5 hover:bg-forest/[0.02]">
                    <td className="p-4">
                      <div className="font-sans text-sm text-forest font-medium">{order.customerName || "—"}</div>
                      <div className="font-sans text-xs text-forest/50">{order.customerEmail || "—"}</div>
                      {order.businessName && (
                        <div className="font-sans text-xs text-forest/40">{order.businessName}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={`${tierColors[order.packageTier]} border-0 font-sans text-xs`}>
                        {order.packageTier}
                      </Badge>
                    </td>
                    <td className="p-4 font-sans text-sm text-forest font-medium">
                      ${(order.amount / 100).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <Badge className={`${statusColors[order.status]} border-0 font-sans text-xs`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-sans text-xs text-forest/50">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
