import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera, Upload, Bell, BellOff, Smartphone, Monitor,
  Settings, User, Shield, CheckCircle,
} from "lucide-react";

const NOTIFICATION_CATEGORIES = [
  { id: "new_lead", label: "New Lead Assignments", description: "When a new lead is assigned to you" },
  { id: "coaching_feedback", label: "AI Coaching Feedback", description: "When AI Coach reviews your communications" },
  { id: "ticket_update", label: "Ticket Updates", description: "When your support tickets are resolved" },
  { id: "commission", label: "Commission Updates", description: "When commissions are approved or paid" },
  { id: "training", label: "Training Reminders", description: "Training module and certification reminders" },
  { id: "system", label: "System Notifications", description: "Platform updates and announcements" },
];

interface RepProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  profilePhotoUrl?: string | null;
}

export default function RepSettingsPanel({ repProfile }: { repProfile: RepProfile }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pushSupported] = useState("serviceWorker" in navigator && "PushManager" in window);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const utils = trpc.useUtils();
  const uploadPhoto = trpc.reps.uploadPhoto.useMutation({
    onSuccess: (data) => {
      toast.success("Profile photo updated!");
      utils.reps.myProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: preferences, isLoading: prefsLoading } = trpc.repNotifPrefs.myPreferences.useQuery();
  const { data: vapidData } = trpc.repNotifPrefs.vapidPublicKey.useQuery();
  const updatePref = trpc.repNotifPrefs.update.useMutation({
    onSuccess: () => {
      utils.repNotifPrefs.myPreferences.invalidate();
    },
  });
  const subscribePush = trpc.repNotifPrefs.subscribePush.useMutation({
    onSuccess: () => {
      setPushSubscribed(true);
      toast.success("Push notifications enabled!");
    },
    onError: (err) => toast.error(err.message),
  });
  const unsubscribePush = trpc.repNotifPrefs.unsubscribePush.useMutation({
    onSuccess: () => {
      setPushSubscribed(false);
      toast.success("Push notifications disabled");
    },
  });

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadPhoto.mutate({ photoBase64: base64, mimeType: file.type });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Failed to read image");
    }
  }, [uploadPhoto]);

  const handleEnablePush = useCallback(async () => {
    if (!pushSupported || !vapidData?.vapidPublicKey) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.vapidPublicKey),
      });
      const json = subscription.toJSON();
      subscribePush.mutate({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
        userAgent: navigator.userAgent,
      });
    } catch (err: any) {
      toast.error("Failed to enable push: " + err.message);
    }
  }, [pushSupported, vapidData, subscribePush]);

  const handleDisablePush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        unsubscribePush.mutate({ endpoint: subscription.endpoint });
      }
    } catch (err: any) {
      toast.error("Failed to disable push: " + err.message);
    }
  }, [unsubscribePush]);

  const handleTogglePref = (category: string, field: "enabled" | "pushEnabled" | "inAppEnabled", value: boolean) => {
    const existing = preferences?.find((p: any) => p.category === category);
    updatePref.mutate({
      category,
      enabled: field === "enabled" ? value : (existing?.enabled ?? true),
      pushEnabled: field === "pushEnabled" ? value : (existing?.pushEnabled ?? true),
      inAppEnabled: field === "inAppEnabled" ? value : (existing?.inAppEnabled ?? true),
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <Camera className="h-4 w-4 text-electric" /> Profile Photo
          </CardTitle>
          <CardDescription className="text-xs text-soft-gray font-sans">
            Your photo appears in your email signature, dashboard, and leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              {repProfile.profilePhotoUrl ? (
                <img
                  src={repProfile.profilePhotoUrl}
                  alt={repProfile.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-electric/10 flex items-center justify-center text-electric text-3xl font-bold border-2 border-border">
                  {repProfile.fullName?.charAt(0) || "?"}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-off-white font-sans">{repProfile.fullName}</p>
              <p className="text-xs text-soft-gray font-sans">{repProfile.email}</p>
              {repProfile.phone && <p className="text-xs text-soft-gray font-sans">{repProfile.phone}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || uploadPhoto.isPending}
                className="mt-3 text-xs font-sans rounded-full"
              >
                {uploading || uploadPhoto.isPending ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin w-3 h-3 border border-electric border-t-transparent rounded-full" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Upload Photo
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-electric" /> Push Notifications
          </CardTitle>
          <CardDescription className="text-xs text-soft-gray font-sans">
            Get instant alerts on your device when important events happen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pushSupported ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <BellOff className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-amber-700 font-sans">
                Push notifications are not supported in this browser. Try Chrome or Firefox.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-off-white font-sans">
                  {pushSubscribed ? "Push notifications enabled" : "Enable push notifications"}
                </p>
                <p className="text-xs text-soft-gray font-sans">
                  {pushSubscribed
                    ? "You'll receive alerts for new leads, coaching feedback, and more."
                    : "Click to allow browser notifications from MiniMorph Studios."}
                </p>
              </div>
              <Button
                variant={pushSubscribed ? "outline" : "default"}
                size="sm"
                onClick={pushSubscribed ? handleDisablePush : handleEnablePush}
                disabled={subscribePush.isPending || unsubscribePush.isPending}
                className={`text-xs font-sans rounded-full ${!pushSubscribed ? "bg-electric hover:bg-electric/90 text-white" : ""}`}
              >
                {pushSubscribed ? (
                  <span className="flex items-center gap-1"><BellOff className="h-3 w-3" /> Disable</span>
                ) : (
                  <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> Enable</span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-off-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-electric" /> Notification Preferences
          </CardTitle>
          <CardDescription className="text-xs text-soft-gray font-sans">
            Control which notifications you receive and how.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prefsLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin w-5 h-5 border-2 border-electric border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-[1fr,60px,60px,60px] gap-2 items-center text-[10px] text-soft-gray/60 font-sans uppercase tracking-wider">
                <span>Category</span>
                <span className="text-center">All</span>
                <span className="text-center flex items-center justify-center gap-0.5"><Smartphone className="h-3 w-3" /> Push</span>
                <span className="text-center flex items-center justify-center gap-0.5"><Monitor className="h-3 w-3" /> App</span>
              </div>
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const pref = preferences?.find((p: any) => p.category === cat.id);
                return (
                  <div key={cat.id} className="grid grid-cols-[1fr,60px,60px,60px] gap-2 items-center py-2 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm font-sans text-off-white">{cat.label}</p>
                      <p className="text-[10px] text-soft-gray/60 font-sans">{cat.description}</p>
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref?.enabled ?? true}
                        onCheckedChange={(v) => handleTogglePref(cat.id, "enabled", v)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref?.pushEnabled ?? true}
                        onCheckedChange={(v) => handleTogglePref(cat.id, "pushEnabled", v)}
                        disabled={!(pref?.enabled ?? true)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={pref?.inAppEnabled ?? true}
                        onCheckedChange={(v) => handleTogglePref(cat.id, "inAppEnabled", v)}
                        disabled={!(pref?.enabled ?? true)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return view as unknown as BufferSource;
}
