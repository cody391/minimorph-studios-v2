import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Pencil, Check, X, RefreshCw, CircleDot } from "lucide-react";

type Product = {
  id: number;
  productKey: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: string;
  discountPercent: number;
  discountDuration: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
  stripeDiscountPriceId: string | null;
  active: boolean;
};

type SyncState = "idle" | "saving" | "synced" | "saved_no_stripe" | "error";

function StripeBadge({ product, onManualSync }: { product: Product; onManualSync: (id: number) => void }) {
  if (product.stripeProductId) {
    return (
      <div className="flex items-center gap-1.5">
        <CircleDot className="w-3 h-3 text-green-400" />
        <span className="text-xs text-green-400">Synced</span>
      </div>
    );
  }
  return (
    <button
      onClick={() => onManualSync(product.id)}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-electric transition-colors"
    >
      <CircleDot className="w-3 h-3 text-muted-foreground" />
      Not synced
    </button>
  );
}

function ProductRow({ product, onSave }: { product: Product; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [basePrice, setBasePrice] = useState(product.basePrice);
  const [discountPercent, setDiscountPercent] = useState(String(product.discountPercent));
  const [discountDuration, setDiscountDuration] = useState<"once" | "repeating" | "forever">(
    (product.discountDuration as any) || "once"
  );
  const [name, setName] = useState(product.name);
  const [active, setActive] = useState(product.active);
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const update = trpc.products.update.useMutation({
    onMutate: () => setSyncState("saving"),
    onSuccess: (result: any) => {
      setEditing(false);
      onSave();
      if (result?.stripeSynced) {
        setSyncState("synced");
        toast.success("Saved + Stripe synced");
      } else {
        setSyncState("saved_no_stripe");
        toast.warning("Saved locally — Stripe sync failed");
      }
      setTimeout(() => setSyncState("idle"), 4000);
    },
    onError: (e) => {
      setSyncState("error");
      toast.error(e.message);
      setTimeout(() => setSyncState("idle"), 4000);
    },
  });

  const effectivePrice = parseFloat(basePrice) * (1 - parseInt(discountPercent || "0") / 100);
  const hasDiscount = parseInt(discountPercent || "0") > 0;

  const categoryColors: Record<string, string> = {
    package: "bg-electric/20 text-electric",
    addon: "bg-purple-500/20 text-purple-400",
    one_time: "bg-amber-500/20 text-amber-400",
  };

  const durationLabels: Record<string, string> = {
    once: "First month",
    repeating: "3 months",
    forever: "Permanent",
  };

  function handleSave() {
    update.mutate({
      id: product.id,
      name,
      basePrice,
      discountPercent: parseInt(discountPercent || "0"),
      discountDuration,
      active,
    });
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/2">
      <td className="px-4 py-3">
        <div className="font-medium text-sm text-foreground">
          {editing ? <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-sm w-48" /> : name}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{product.productKey}</div>
      </td>
      <td className="px-4 py-3">
        <Badge className={`text-xs ${categoryColors[product.category] ?? ""}`}>{product.category}</Badge>
      </td>
      <td className="px-4 py-3 text-sm">
        {editing ? (
          <Input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-7 text-sm w-24" />
        ) : (
          <span>${parseFloat(product.basePrice).toFixed(2)}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="h-7 text-sm w-16" placeholder="%" />
            {parseInt(discountPercent || "0") > 0 && (
              <Select value={discountDuration} onValueChange={(v) => setDiscountDuration(v as any)}>
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">First month only</SelectItem>
                  <SelectItem value="repeating">First 3 months</SelectItem>
                  <SelectItem value="forever">Permanent</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          hasDiscount ? (
            <div>
              <span className="line-through text-muted-foreground text-xs">${parseFloat(product.basePrice).toFixed(2)}</span>
              <span className="ml-2 text-green-400 font-medium">${effectivePrice.toFixed(2)}</span>
              <span className="ml-1 text-xs text-green-500">({product.discountPercent}% · {durationLabels[product.discountDuration] ?? product.discountDuration})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <button onClick={() => setActive(!active)} className={`text-xs px-2 py-1 rounded ${active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {active ? "Active" : "Inactive"}
          </button>
        ) : (
          <Badge variant={product.active ? "default" : "secondary"} className={product.active ? "bg-green-500/20 text-green-400" : ""}>
            {product.active ? "Active" : "Inactive"}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <StripeBadge product={product} onManualSync={() => handleSave()} />
      </td>
      <td className="px-4 py-3">
        {syncState !== "idle" && (
          <span className={`text-xs ${
            syncState === "saving" ? "text-muted-foreground" :
            syncState === "synced" ? "text-green-400" :
            syncState === "saved_no_stripe" ? "text-yellow-400" :
            "text-red-400"
          }`}>
            {syncState === "saving" ? "Saving..." :
             syncState === "synced" ? "✓ Stripe synced" :
             syncState === "saved_no_stripe" ? "⚠ Stripe failed" :
             "✗ Error"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={update.isPending}>
              <Check className="w-3 h-3 text-green-400" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(false)}>
              <X className="w-3 h-3 text-red-400" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </td>
    </tr>
  );
}

export default function Products() {
  const { data: products, refetch } = trpc.products.listAll.useQuery();
  const [syncAllState, setSyncAllState] = useState<"idle" | "syncing" | "done">("idle");
  const [syncAllResult, setSyncAllResult] = useState<{ synced: number; failed: number } | null>(null);

  const syncAll = trpc.admin.syncAllToStripe.useMutation({
    onMutate: () => { setSyncAllState("syncing"); setSyncAllResult(null); },
    onSuccess: (result) => {
      setSyncAllState("done");
      setSyncAllResult({ synced: result.synced, failed: result.failed });
      refetch();
      if (result.failed === 0) {
        toast.success(`${result.synced} products synced to Stripe`);
      } else {
        toast.warning(`${result.synced} synced, ${result.failed} failed`);
      }
      setTimeout(() => setSyncAllState("idle"), 5000);
    },
    onError: (e) => { setSyncAllState("idle"); toast.error(e.message); },
  });

  const packages = products?.filter(p => p.category === "package") ?? [];
  const addons = products?.filter(p => p.category === "addon") ?? [];
  const oneTime = products?.filter(p => p.category === "one_time") ?? [];

  const totalProducts = products?.length ?? 0;
  const syncedCount = products?.filter((p: any) => p.stripeProductId).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-electric" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground">Manage pricing for all packages, add-ons, and one-time fees</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalProducts > 0 && (
            <span className="text-xs text-muted-foreground">
              {syncedCount}/{totalProducts} synced to Stripe
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => syncAll.mutate()}
            disabled={syncAllState === "syncing"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncAllState === "syncing" ? "animate-spin" : ""}`} />
            {syncAllState === "syncing"
              ? `Syncing ${totalProducts} products...`
              : syncAllState === "done" && syncAllResult
                ? `✓ ${syncAllResult.synced} synced${syncAllResult.failed > 0 ? `, ${syncAllResult.failed} failed` : ""}`
                : "Sync All to Stripe"}
          </Button>
        </div>
      </div>

      {[
        { label: "Packages", items: packages },
        { label: "Add-Ons", items: addons },
        { label: "One-Time Fees", items: oneTime },
      ].map(({ label, items }) => (
        items.length > 0 && (
          <Card key={label} className="border-white/10 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{label}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Base Price</th>
                      <th className="px-4 py-2 text-left">Discount / Effective</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Stripe</th>
                      <th className="px-4 py-2 text-left"></th>
                      <th className="px-4 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(p => (
                      <ProductRow key={p.id} product={p as any} onSave={() => refetch()} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      ))}
    </div>
  );
}
