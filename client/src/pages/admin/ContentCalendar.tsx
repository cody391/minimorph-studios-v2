import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2,
  Instagram, Facebook, Linkedin, Twitter, Globe, Clock,
} from "lucide-react";

const CONTENT_TYPES = ["post", "story", "reel", "video", "carousel", "article", "poll", "event"] as const;
const STATUS_COLORS: Record<string, string> = {
  idea: "bg-gray-200 text-gray-700",
  planned: "badge-info",
  in_progress: "badge-pending-payment",
  ready: "badge-success",
  published: "bg-emerald-100 text-emerald-800",
  skipped: "badge-danger",
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-3 h-3 text-pink-500" />,
  facebook: <Facebook className="w-3 h-3 text-blue-600" />,
  linkedin: <Linkedin className="w-3 h-3 text-blue-700" />,
  x: <Twitter className="w-3 h-3 text-gray-800" />,
  all: <Globe className="w-3 h-3 text-gray-500" />,
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = formatDate(year, month, 1);
  const endDate = formatDate(year, month, getDaysInMonth(year, month));

  const { data: entries, isLoading, refetch } = trpc.contentCalendar.list.useQuery({ startDate, endDate });

  const entriesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (entries) {
      for (const entry of entries) {
        if (!map[entry.scheduledDate]) map[entry.scheduledDate] = [];
        map[entry.scheduledDate].push(entry);
      }
    }
    return map;
  }, [entries]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const todayStr = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const deleteEntry = trpc.contentCalendar.delete.useMutation({
    onSuccess: () => { toast.success("Entry deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-off-white" />
            Content Calendar
          </h1>
          <p className="text-gray-500 mt-1">Plan and schedule your social media content</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedDate(todayStr); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Content
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50">
                {DAYS.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 border-b">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] p-1 border-b border-r bg-gray-50/50" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(year, month, day);
                  const dayEntries = entriesByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6;

                  return (
                    <div
                      key={day}
                      className={`min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-blue-50/50 transition-colors ${
                        isToday ? "bg-blue-50" : isWeekend ? "bg-gray-50/30" : ""
                      }`}
                      onClick={() => { setSelectedDate(dateStr); setShowCreate(true); }}
                    >
                      <div className={`text-xs font-medium mb-1 px-1 ${
                        isToday ? "bg-charcoal text-off-white rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-600"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEntries.slice(0, 3).map((entry: any) => (
                          <div
                            key={entry.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                              entry.color ? "" : STATUS_COLORS[entry.status] || "bg-gray-100 text-gray-600"
                            }`}
                            style={entry.color ? { backgroundColor: entry.color + "20", color: entry.color } : undefined}
                            onClick={(e) => { e.stopPropagation(); setEditEntry(entry); }}
                            title={entry.title}
                          >
                            <span className="flex items-center gap-0.5">
                              {entry.platforms && Array.isArray(entry.platforms) && entry.platforms[0] && PLATFORM_ICONS[entry.platforms[0] as string]}
                              {entry.title}
                            </span>
                          </div>
                        ))}
                        {dayEntries.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">+{dayEntries.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CalendarEntryDialog
        open={showCreate}
        onOpenChange={(v) => { setShowCreate(v); if (!v) setSelectedDate(null); }}
        date={selectedDate || todayStr}
        onSuccess={refetch}
      />

      {/* View/Edit Entry Dialog */}
      {editEntry && (
        <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editEntry.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[editEntry.status]}>{editEntry.status?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">{editEntry.contentType}</Badge>
              </div>
              {editEntry.description && <p className="text-sm text-gray-600">{editEntry.description}</p>}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {editEntry.scheduledDate}
                {editEntry.scheduledTime && <><Clock className="w-4 h-4 ml-2" /> {editEntry.scheduledTime}</>}
              </div>
              {editEntry.platforms && (
                <div className="flex gap-1">
                  {(editEntry.platforms as string[]).map((p: string) => (
                    <span key={p} className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">{p}</span>
                  ))}
                </div>
              )}
              {editEntry.notes && (
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">{editEntry.notes}</div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this entry?")) {
                    deleteEntry.mutate({ id: editEntry.id });
                    setEditEntry(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              <Button variant="outline" onClick={() => setEditEntry(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CalendarEntryDialog({ open, onOpenChange, date, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void; date: string; onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("post");
  const [time, setTime] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");

  const createEntry = trpc.contentCalendar.create.useMutation({
    onSuccess: () => {
      toast.success("Content planned!");
      onSuccess();
      onOpenChange(false);
      setTitle(""); setDescription(""); setContentType("post"); setTime(""); setPlatforms([]); setColor(""); setNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan Content for {date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Client spotlight post" />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Content Type</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Time (optional)</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {["instagram", "facebook", "linkedin", "tiktok", "x", "youtube", "pinterest", "threads", "all"].map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    platforms.includes(p) ? "bg-charcoal text-off-white border-electric" : "bg-charcoal text-gray-600 border-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Color Label</label>
            <div className="flex gap-2 mt-1">
              {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(color === c ? "" : c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => createEntry.mutate({
              title,
              description: description || undefined,
              scheduledDate: date,
              scheduledTime: time || undefined,
              contentType: contentType as any,
              platforms: platforms.length > 0 ? platforms as any[] : ["all"],
              color: color || undefined,
              notes: notes || undefined,
            })}
            disabled={!title || createEntry.isPending}
          >
            {createEntry.isPending ? "Saving..." : "Add to Calendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
