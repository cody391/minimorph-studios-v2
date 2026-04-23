import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  applied: "bg-yellow-100 text-yellow-800 border-yellow-200",
  onboarding: "bg-blue-100 text-blue-800 border-blue-200",
  training: "bg-purple-100 text-purple-800 border-purple-200",
  certified: "bg-green-100 text-green-800 border-green-200",
  active: "bg-forest/10 text-forest border-forest/20",
  suspended: "bg-red-100 text-red-800 border-red-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Reps() {
  const [statusFilter] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: reps, isLoading, refetch } = trpc.reps.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const updateRep = trpc.reps.update.useMutation({
    onSuccess: () => {
      toast.success("Rep updated successfully");
      refetch();
      setShowDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const repsByStatus = useMemo(() => {
    if (!reps) return {};
    const groups: Record<string, number> = {};
    reps.forEach((r: any) => {
      groups[r.status] = (groups[r.status] || 0) + 1;
    });
    return groups;
  }, [reps]);

  const handleStatusChange = (repId: number, newStatus: string) => {
    updateRep.mutate({ id: repId, status: newStatus as any });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-forest">Rep Management</h1>
          <p className="text-sm text-forest/60 font-sans mt-1">
            Onboard, train, certify, and manage sales representatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-sans text-xs">
            <Users className="h-3 w-3 mr-1" />
            {reps?.length ?? 0} total
          </Badge>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Applied", key: "applied", icon: Clock, color: "text-yellow-600" },
          { label: "Training", key: "training", icon: Users, color: "text-purple-600" },
          { label: "Active", key: "active", icon: CheckCircle, color: "text-forest" },
          { label: "Suspended", key: "suspended", icon: XCircle, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.key} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <div className="text-lg font-serif text-forest">{repsByStatus[s.key] ?? 0}</div>
                <div className="text-xs text-forest/50 font-sans">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reps Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-forest">All Representatives</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !reps?.length ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-forest/20 mx-auto mb-3" />
              <p className="text-sm text-forest/50 font-sans">No reps yet. Applications will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Training</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Deals</th>
                    <th className="text-left py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Revenue</th>
                    <th className="text-right py-3 px-2 text-xs text-forest/50 uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reps.map((rep: any) => (
                    <tr key={rep.id} className="border-b border-border/30 hover:bg-cream-dark/20 transition-colors">
                      <td className="py-3 px-2 font-medium text-forest">{rep.fullName}</td>
                      <td className="py-3 px-2 text-forest/60">{rep.email}</td>
                      <td className="py-3 px-2">
                        <Badge className={`text-xs font-sans border ${statusColors[rep.status] ?? ""}`}>
                          {rep.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Progress value={rep.trainingProgress} className="h-1.5 w-16" />
                          <span className="text-xs text-forest/50">{rep.trainingProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-forest/70">{rep.totalDeals}</td>
                      <td className="py-3 px-2 text-forest/70">${Number(rep.totalRevenue).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-forest/60 hover:text-forest"
                          onClick={() => { setSelectedRep(rep); setShowDialog(true); }}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rep Management Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-forest">
              Manage: {selectedRep?.fullName}
            </DialogTitle>
          </DialogHeader>
          {selectedRep && (
            <div className="space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-forest/50 text-xs">Email</span>
                  <p className="text-forest">{selectedRep.email}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Phone</span>
                  <p className="text-forest">{selectedRep.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Total Deals</span>
                  <p className="text-forest">{selectedRep.totalDeals}</p>
                </div>
                <div>
                  <span className="text-forest/50 text-xs">Revenue</span>
                  <p className="text-forest">${Number(selectedRep.totalRevenue).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-forest/50 block mb-1">Change Status</label>
                <Select
                  value={selectedRep.status}
                  onValueChange={(val) => handleStatusChange(selectedRep.id, val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["applied", "onboarding", "training", "certified", "active", "suspended", "inactive"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedRep.bio && (
                <div>
                  <span className="text-xs text-forest/50">Bio</span>
                  <p className="text-sm text-forest/80 mt-1">{selectedRep.bio}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="font-sans text-sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
