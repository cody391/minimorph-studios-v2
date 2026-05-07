import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Copy } from "lucide-react";
import { format } from "date-fns";

type DiscountType = "percent" | "free";

export default function Coupons() {
  const { data: coupons, refetch } = trpc.admin.listCoupons.useQuery();
  const createMutation = trpc.admin.createCoupon.useMutation({
    onSuccess: () => { toast.success("Coupon created"); setShowForm(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.admin.toggleCoupon.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.deleteCoupon.useMutation({
    onSuccess: () => { toast.success("Coupon deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function resetForm() {
    setCode(""); setDescription(""); setDiscountType("percent");
    setDiscountValue(""); setMaxUses(""); setExpiresAt("");
  }

  function handleCreate() {
    if (!code.trim()) { toast.error("Code is required"); return; }
    if (discountType === "percent" && (!discountValue || Number(discountValue) < 1 || Number(discountValue) > 99)) {
      toast.error("Percentage must be 1–99"); return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discountType,
      discountValue: discountType === "percent" ? Number(discountValue) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiresAt || undefined,
    });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  }

  const discountLabel = (type: string, value: number | null | undefined) => {
    if (type === "free") return "100% off (Free site)";
    return value ? `${value}% off` : "—";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-electric/15 flex items-center justify-center">
            <Tag className="w-5 h-5 text-electric" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-off-white">Coupons</h1>
            <p className="text-xs text-soft-gray">Create and manage discount codes for customers</p>
          </div>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="bg-electric hover:bg-electric-light text-midnight text-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-[#13131f] border border-[#2a2a40] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-off-white">New Coupon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-soft-gray">Code</Label>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="FREEMONTH"
                className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-soft-gray">Description (shown to admin)</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. First month free for new reps"
                className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-soft-gray">Discount type</Label>
              <Select value={discountType} onValueChange={v => setDiscountType(v as DiscountType)}>
                <SelectTrigger className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free site (100% off)</SelectItem>
                  <SelectItem value="percent">Percentage off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType === "percent" && (
              <div className="space-y-1">
                <Label className="text-xs text-soft-gray">Percent off (1–99)</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder="50"
                  className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-soft-gray">Max uses (blank = unlimited)</Label>
              <Input
                type="number"
                min={1}
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="10"
                className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-soft-gray">Expires at (blank = never)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="bg-[#0d0d1a] border-[#2a2a40] text-off-white text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-electric hover:bg-electric-light text-midnight text-sm"
            >
              {createMutation.isPending ? "Creating..." : "Create Coupon"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-soft-gray text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Coupons table */}
      <div className="bg-[#13131f] border border-[#2a2a40] rounded-xl overflow-hidden">
        {!coupons || coupons.length === 0 ? (
          <div className="p-10 text-center text-soft-gray text-sm">
            No coupons yet. Create your first one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a40] text-xs text-soft-gray uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Uses</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-[#2a2a40] last:border-0 ${i % 2 === 0 ? "" : "bg-[#0d0d1a]/30"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-electric">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-soft-gray hover:text-off-white transition-colors"
                        title="Copy code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    {c.description && (
                      <p className="text-xs text-soft-gray mt-0.5">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-off-white">
                    {discountLabel(c.discountType, c.discountValue)}
                  </td>
                  <td className="px-4 py-3 text-off-white">
                    {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-off-white">
                    {c.expiresAt ? format(new Date(c.expiresAt), "MMM d, yyyy") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {c.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
                        className="text-soft-gray hover:text-off-white transition-colors"
                        title={c.active ? "Disable" : "Enable"}
                      >
                        {c.active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete coupon ${c.code}?`)) {
                            deleteMutation.mutate({ id: c.id });
                          }
                        }}
                        className="text-soft-gray hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
