import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LifeBuoy, Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Brain, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  ai_reviewed: "bg-purple-100 text-purple-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-700",
};

const statusIcons: Record<string, any> = {
  open: Clock,
  ai_reviewed: Brain,
  pending_approval: AlertCircle,
  approved: CheckCircle,
  rejected: XCircle,
  resolved: CheckCircle,
  closed: CheckCircle,
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

export default function SupportTicketsPanel({ repId }: { repId: number }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");

  const { data: tickets, isLoading, refetch } = trpc.repTickets.myTickets.useQuery();
  const submitTicket = trpc.repTickets.submit.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket #${data.ticketId} submitted! AI is analyzing it.`);
      setShowNew(false);
      setSubject("");
      setDescription("");
      setCategory("other");
      setPriority("medium");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    if (description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }
    submitTicket.mutate({
      subject,
      description,
      category: category as any,
      priority: priority as any,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif text-forest flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-terracotta" /> Support Tickets
          </h3>
          <p className="text-xs text-forest/50 font-sans mt-1">
            Submit a ticket and our AI will analyze it and propose a solution. The owner will approve or reject.
          </p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="bg-terracotta hover:bg-terracotta/90 text-white font-sans text-sm rounded-full">
              <Plus className="h-4 w-4 mr-1" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-forest">Submit Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-forest/80 text-sm">Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="mt-1 border-sage/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-forest/80 text-sm">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1 border-sage/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="lead_issue">Lead Issue</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-forest/80 text-sm">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1 border-sage/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-forest/80 text-sm">Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail. The more context you provide, the better our AI can help."
                  rows={5}
                  className="mt-1 border-sage/30"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitTicket.isPending}
                className="w-full bg-forest hover:bg-forest/90 text-white font-sans rounded-full"
              >
                {submitTicket.isPending ? (
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4 animate-pulse" /> AI is analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Submit Ticket
                  </span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-forest border-t-transparent rounded-full mx-auto" />
        </div>
      ) : !tickets?.length ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <LifeBuoy className="h-10 w-10 text-forest/20 mx-auto mb-3" />
            <p className="text-sm text-forest/50 font-sans">No support tickets yet.</p>
            <p className="text-xs text-forest/30 font-sans mt-1">Click "New Ticket" to get help from our AI-powered support system.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const StatusIcon = statusIcons[ticket.status] || Clock;
            const isExpanded = expandedTicket === ticket.id;
            return (
              <Card key={ticket.id} className="border-border/50">
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4 text-forest/50" />
                        <span className="text-sm font-medium text-forest font-sans">
                          #{ticket.id} — {ticket.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${statusColors[ticket.status] || ""}`}>
                          {ticket.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={`text-[10px] ${priorityColors[ticket.priority] || ""}`}>
                          {ticket.priority}
                        </Badge>
                        <span className="text-[10px] text-forest/40 font-sans">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-forest/30" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-forest/30" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border/30 pt-3">
                      <div>
                        <p className="text-xs font-medium text-forest/60 font-sans mb-1">Description</p>
                        <p className="text-sm text-forest/80 font-sans">{ticket.description}</p>
                      </div>
                      {ticket.aiAnalysis && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-purple-700 font-sans mb-1 flex items-center gap-1">
                            <Brain className="h-3 w-3" /> AI Analysis
                          </p>
                          <p className="text-sm text-purple-800 font-sans">{ticket.aiAnalysis}</p>
                        </div>
                      )}
                      {ticket.aiSolution && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 font-sans mb-1">Proposed Solution</p>
                          <p className="text-sm text-green-800 font-sans">{ticket.aiSolution}</p>
                          {ticket.aiConfidence && (
                            <p className="text-[10px] text-green-600 font-sans mt-1">
                              Confidence: {(parseFloat(ticket.aiConfidence) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      )}
                      {ticket.ownerNotes && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-700 font-sans mb-1">Owner Notes</p>
                          <p className="text-sm text-amber-800 font-sans">{ticket.ownerNotes}</p>
                        </div>
                      )}
                      {ticket.resolvedAt && (
                        <p className="text-[10px] text-forest/40 font-sans">
                          Resolved: {new Date(ticket.resolvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
