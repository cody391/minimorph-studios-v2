import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Palette, Plus, Trash2, Edit, Image, Type, Sparkles,
  FileText, Copy, Check, Eye, Brush, Layers,
} from "lucide-react";

const ASSET_TYPES = ["logo", "color", "font", "template", "guideline", "tone_of_voice", "hashtag_set", "bio_template"] as const;
const ASSET_TYPE_META: Record<string, { icon: React.ReactNode; label: string; description: string }> = {
  logo: { icon: <Image className="w-5 h-5" />, label: "Logos", description: "Brand logos and marks" },
  color: { icon: <Palette className="w-5 h-5" />, label: "Colors", description: "Brand color palette" },
  font: { icon: <Type className="w-5 h-5" />, label: "Fonts", description: "Typography guidelines" },
  template: { icon: <Layers className="w-5 h-5" />, label: "Templates", description: "Post templates" },
  guideline: { icon: <FileText className="w-5 h-5" />, label: "Guidelines", description: "Brand guidelines" },
  tone_of_voice: { icon: <Brush className="w-5 h-5" />, label: "Tone of Voice", description: "Writing style guides" },
  hashtag_set: { icon: <span className="text-lg font-bold">#</span>, label: "Hashtag Sets", description: "Curated hashtag collections" },
  bio_template: { icon: <FileText className="w-5 h-5" />, label: "Bio Templates", description: "Profile bio templates" },
};

export default function BrandKit() {
  const [showCreate, setShowCreate] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: assets, isLoading, refetch } = trpc.brandAssets.list.useQuery(
    filterType !== "all" ? { category: filterType as any } : undefined
  );

  const deleteAsset = trpc.brandAssets.delete.useMutation({
    onSuccess: () => { toast.success("Asset deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const seedDefaults = trpc.brandAssets.seedDefaults.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  // Group assets by type
  const grouped = (assets || []).reduce((acc: Record<string, any[]>, asset: any) => {
    if (!acc[asset.type]) acc[asset.type] = [];
    acc[asset.type].push(asset);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-off-white" />
            Brand Kit
          </h1>
          <p className="text-gray-500 mt-1">Manage your brand identity and content assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending}>
            <Sparkles className="w-4 h-4 mr-1" /> {seedDefaults.isPending ? "Seeding..." : "Seed Defaults"}
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All
        </Button>
        {ASSET_TYPES.map(type => (
          <Button
            key={type}
            variant={filterType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type)}
          >
            {ASSET_TYPE_META[type]?.label || type}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : assets && assets.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]) => {
            const meta = ASSET_TYPE_META[type];
            return (
              <div key={type}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  {meta?.icon} {meta?.label || type}
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </h3>

                {type === "color" ? (
                  <ColorPaletteDisplay items={items} onDelete={(id) => {
                    if (confirm("Delete this color?")) deleteAsset.mutate({ id });
                  }} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((asset: any) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onEdit={() => setEditAsset(asset)}
                        onDelete={() => {
                          if (confirm("Delete this asset?")) deleteAsset.mutate({ id: asset.id });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No brand assets yet</h3>
            <p className="text-sm mb-4">Start building your brand kit by adding colors, fonts, logos, and guidelines.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending}>
                <Sparkles className="w-4 h-4 mr-1" /> Seed MiniMorph Defaults
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Custom Asset
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateAssetDialog open={showCreate} onOpenChange={setShowCreate} onSuccess={refetch} />
    </div>
  );
}

function ColorPaletteDisplay({ items, onDelete }: { items: any[]; onDelete: (id: number) => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyColor = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item: any) => {
        const colorValue = item.value || "#000000";
        return (
          <div key={item.id} className="group relative">
            <button
              onClick={() => copyColor(colorValue)}
              className="w-20 h-20 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden"
              style={{ backgroundColor: colorValue }}
              title={`${item.name}: ${colorValue}`}
            >
              {copied === colorValue && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
            <div className="text-center mt-1">
              <p className="text-xs font-medium truncate max-w-[80px]">{item.name}</p>
              <p className="text-[10px] text-gray-400">{colorValue}</p>
            </div>
            <button
              onClick={() => onDelete(item.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AssetCard({ asset, onEdit, onDelete }: { asset: any; onEdit: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyValue = () => {
    navigator.clipboard.writeText(asset.value || asset.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{asset.name}</h4>
              <Badge variant="outline" className="text-xs capitalize">{asset.type.replace(/_/g, " ")}</Badge>
            </div>
            {asset.value && (
              <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{asset.value}</p>
            )}
            {asset.metadata && typeof asset.metadata === "object" && Object.keys(asset.metadata).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(asset.metadata).slice(0, 3).map(([k, v]) => (
                  <span key={k} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyValue}>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateAssetDialog({ open, onOpenChange, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void;
}) {
  const [type, setType] = useState("color");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const createAsset = trpc.brandAssets.create.useMutation({
    onSuccess: () => {
      toast.success("Asset added!");
      onSuccess();
      onOpenChange(false);
      setName(""); setValue("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Brand Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Asset Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{ASSET_TYPE_META[t]?.label || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={
              type === "color" ? "Forest Green" : type === "font" ? "Heading Font" : "Asset name"
            } />
          </div>
          <div>
            <label className="text-sm font-medium">Value</label>
            {type === "color" ? (
              <div className="flex gap-2">
                <Input type="color" value={value || "#000000"} onChange={e => setValue(e.target.value)} className="w-14 h-10 p-1" />
                <Input value={value} onChange={e => setValue(e.target.value)} placeholder="#2D5A3D" className="flex-1" />
              </div>
            ) : (
              <Textarea value={value} onChange={e => setValue(e.target.value)} placeholder={
                type === "tone_of_voice" ? "Professional yet approachable. Confident but not arrogant..." :
                type === "hashtag_set" ? "#webdesign #smallbusiness #growth" :
                type === "bio_template" ? "We build websites that grow your business..." :
                "Enter value..."
              } rows={type === "tone_of_voice" || type === "guideline" || type === "template" ? 5 : 2} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createAsset.mutate({ category: type as any, name, value: value || undefined })}
            disabled={!name || createAsset.isPending}
          >
            {createAsset.isPending ? "Adding..." : "Add Asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
