import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Plus, Package, DollarSign, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  ai_chatbot: "AI Chatbot",
  booking_widget: "Booking Widget",
  review_collector: "Review Collector",
  lead_capture: "Lead Capture Bot",
  seo_autopilot: "SEO Autopilot",
  analytics_pro: "Analytics Pro",
  social_feed: "Social Feed",
  custom: "Custom Widget",
};

const categoryIcons: Record<string, string> = {
  ai_chatbot: "text-blue-600",
  booking_widget: "text-purple-600",
  review_collector: "text-amber-400",
  lead_capture: "text-emerald-400",
  seo_autopilot: "text-electric",
  analytics_pro: "text-off-white",
  social_feed: "text-pink-600",
  custom: "text-gray-600",
};

export default function WidgetCatalog() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "ai_chatbot",
    description: "",
    monthlyPrice: "",
    setupFee: "",
    features: "",
  });

  const { data: widgets, isLoading, refetch } = trpc.widgetCatalog.list.useQuery();

  const createWidget = trpc.widgetCatalog.create.useMutation({
    onSuccess: () => {
      toast.success("Widget added to catalog");
      refetch();
      setShowCreate(false);
      setForm({ name: "", category: "ai_chatbot", description: "", monthlyPrice: "", setupFee: "", features: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateWidget = trpc.widgetCatalog.update.useMutation({
    onSuccess: () => { toast.success("Widget updated"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const activeWidgets = widgets?.filter((w: any) => w.isActive) || [];
  const totalMRR = activeWidgets.reduce((s: number, w: any) => s + Number(w.monthlyPrice || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-off-white">Widget & Add-On Catalog</h1>
          <p className="text-sm text-soft-gray font-sans mt-1">
            Manage AI widgets and add-ons to upsell to customers after their site is built
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-charcoal text-off-white hover:bg-electric/90 font-sans text-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Widget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-off-white" />
            <div>
              <div className="text-lg font-serif text-off-white">{widgets?.length ?? 0}</div>
              <div className="text-xs text-soft-gray font-sans">Total Widgets</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="text-lg font-serif text-off-white">{activeWidgets.length}</div>
              <div className="text-xs text-soft-gray font-sans">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-electric" />
            <div>
              <div className="text-lg font-serif text-off-white">${totalMRR.toLocaleString()}</div>
              <div className="text-xs text-soft-gray font-sans">Potential MRR/widget</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : !widgets?.length ? (
          <div className="col-span-full text-center py-16">
            <Bot className="h-12 w-12 text-soft-gray/20 mx-auto mb-4" />
            <h3 className="text-lg font-serif text-off-white mb-2">No Widgets Yet</h3>
            <p className="text-sm text-soft-gray font-sans mb-4">Add AI widgets and add-ons to upsell to your customers.</p>
            <Button onClick={() => setShowCreate(true)} className="bg-electric text-white hover:bg-electric-light font-sans text-sm">
              <Plus className="h-4 w-4 mr-2" /> Create First Widget
            </Button>
          </div>
        ) : (
          widgets.map((widget: any) => (
            <Card key={widget.id} className={`border-border/50 transition-all ${!widget.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className={`h-5 w-5 ${categoryIcons[widget.category] ?? "text-off-white"}`} />
                    <h3 className="font-serif text-off-white text-sm font-medium">{widget.name}</h3>
                  </div>
                  <Badge className={`text-[10px] font-sans ${widget.isActive ? "badge-success" : "bg-gray-100 text-gray-500"}`}>
                    {widget.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-soft-gray font-sans mb-3 line-clamp-2">{widget.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-serif text-off-white">${Number(widget.monthlyPrice).toLocaleString()}</span>
                    <span className="text-xs text-soft-gray font-sans">/mo</span>
                  </div>

                </div>
                <Badge className="text-[10px] font-sans bg-midnight-dark/30 text-soft-gray mb-3">
                  {categoryLabels[widget.category] ?? widget.category}
                </Badge>
                {widget.features && (
                  <div className="mt-2">
                    {(typeof widget.features === "string" ? widget.features.split(",") : []).slice(0, 3).map((f: string, i: number) => (
                      <span key={i} className="inline-block text-[10px] bg-electric/5 text-soft-gray rounded px-2 py-0.5 mr-1 mb-1 font-sans">{f.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-sans"
                    onClick={() => updateWidget.mutate({ id: widget.id, isActive: !widget.isActive })}
                  >
                    {widget.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Widget Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-off-white">Add Widget to Catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 font-sans">
            <div>
              <label className="text-xs text-soft-gray block mb-1">Widget Name</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AI Customer Support Bot" />
            </div>
            <div>
              <label className="text-xs text-soft-gray block mb-1">Category</label>
              <Select value={form.category} onValueChange={(val) => setForm(f => ({ ...f, category: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-soft-gray block mb-1">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this widget do for the customer?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-soft-gray block mb-1">Monthly Price ($)</label>
                <Input type="number" value={form.monthlyPrice} onChange={(e) => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} placeholder="299" />
              </div>

            </div>
            <div>
              <label className="text-xs text-soft-gray block mb-1">Features (comma-separated)</label>
              <Input value={form.features} onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))} placeholder="24/7 support, custom training, analytics" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="font-sans text-sm">Cancel</Button>
            <Button
              className="bg-charcoal text-off-white hover:bg-electric/90 font-sans text-sm"
              disabled={!form.name || !form.monthlyPrice || createWidget.isPending}
              onClick={() => createWidget.mutate({
                slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                name: form.name,
                category: form.category as "ai_agent" | "widget" | "service" | "integration",
                description: form.description,
                monthlyPrice: form.monthlyPrice,
                setupFee: "0",
                features: form.features ? form.features.split(",").map(f => f.trim()) : [],
              })}
            >
              {createWidget.isPending ? "Adding..." : "Add Widget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
