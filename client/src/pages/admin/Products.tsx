import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Pencil, Check, X } from "lucide-react";

type Product = {
  id: number;
  productKey: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: string;
  discountPercent: number;
  stripePriceId: string | null;
  active: boolean;
};

function ProductRow({ product, onSave }: { product: Product; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [basePrice, setBasePrice] = useState(product.basePrice);
  const [discountPercent, setDiscountPercent] = useState(String(product.discountPercent));
  const [name, setName] = useState(product.name);
  const [active, setActive] = useState(product.active);

  const update = trpc.products.update.useMutation({
    onSuccess: () => { setEditing(false); onSave(); toast.success("Product updated"); },
    onError: (e) => toast.error(e.message),
  });

  const effectivePrice = parseFloat(basePrice) * (1 - parseInt(discountPercent || "0") / 100);
  const hasDiscount = parseInt(discountPercent || "0") > 0;

  const categoryColors: Record<string, string> = {
    package: "bg-electric/20 text-electric",
    addon: "bg-purple-500/20 text-purple-400",
    one_time: "bg-amber-500/20 text-amber-400",
  };

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
          <Input value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="h-7 text-sm w-16" placeholder="%" />
        ) : (
          hasDiscount ? (
            <div>
              <span className="line-through text-muted-foreground text-xs">${parseFloat(product.basePrice).toFixed(2)}</span>
              <span className="ml-2 text-green-400 font-medium">${effectivePrice.toFixed(2)}</span>
              <span className="ml-1 text-xs text-green-500">({product.discountPercent}% off)</span>
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
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => update.mutate({ id: product.id, name, basePrice, discountPercent: parseInt(discountPercent || "0"), active })}>
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

  const packages = products?.filter(p => p.category === "package") ?? [];
  const addons = products?.filter(p => p.category === "addon") ?? [];
  const oneTime = products?.filter(p => p.category === "one_time") ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-electric" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage pricing for all packages, add-ons, and one-time fees</p>
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
