import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation, useSearch, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Loader2, Send, Upload, CheckCircle2, ArrowRight,
  Sparkles, CreditCard, Lock, Globe, Paperclip,
} from "lucide-react";
import { Streamdown } from "streamdown";

/* ═══════════════════════════════════════════════════════
   TYPES (mirrored from Onboarding.tsx)
   ═══════════════════════════════════════════════════════ */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  uploadRequests?: UploadRequest[];
  addonsAccepted?: AddonAccepted[];
};
type UploadRequest = { type: string; label: string; hint: string };
type AddonAccepted = { product: string; price: string; label: string };
type PaymentReadyData = {
  packageTier?: string;
  monthlyTotal?: number;
  addons?: Array<{ product: string; price: number }>;
};

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function getAttr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function parseUploadRequests(text: string): UploadRequest[] {
  const requests: UploadRequest[] = [];
  const tagRegex = /<upload_request\b[^>]*\/>/g;
  let m;
  while ((m = tagRegex.exec(text)) !== null) {
    const tag = m[0];
    const type = getAttr(tag, "type");
    const label = getAttr(tag, "label") || type;
    const hint = getAttr(tag, "hint");
    if (type) requests.push({ type, label, hint });
  }
  return requests;
}

function parseAddonsAccepted(text: string): AddonAccepted[] {
  const addons: AddonAccepted[] = [];
  const tagRegex = /<addon_accepted\b[^>]*\/>/g;
  let m;
  while ((m = tagRegex.exec(text)) !== null) {
    const tag = m[0];
    const product = getAttr(tag, "product");
    const price = getAttr(tag, "price");
    const label = getAttr(tag, "label") || product;
    if (product) addons.push({ product, price, label });
  }
  return addons;
}

function stripXmlTags(text: string): string {
  return text
    .replace(/<payment_ready>[\s\S]*?<\/payment_ready>/g, "")
    .replace(/<upload_request\b[^>]*\/>/g, "")
    .replace(/<addon_accepted\b[^>]*\/>/g, "")
    .replace(/<questionnaire_data>[\s\S]*?<\/questionnaire_data>/g, "")
    .replace(/<addons_selected>[\s\S]*?<\/addons_selected>/g, "")
    .trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const DEV_MODE = false;

const SUGGESTED_QUESTIONS = [
  "Can you search my competitors?",
  "What plan do you recommend?",
  "What add-ons fit my business?",
  "Can you pull up my current site?",
  "What's included in every plan?",
  "How long does it take to build?",
  "Do you write all my content?",
  "How do I rank on Google?",
  "Can you generate images for me?",
  "What happens after I pay?",
  "Do you handle legal compliance?",
  "What's your QA process?",
  "Can you check competitor sites?",
  "What industries do you work with?",
  "How do add-ons work?",
];

type Stage = "capture" | "creating" | "chat";
type CaptureSubState = "email" | "password";

export default function GetStarted() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user, loading: authLoading } = useAuth();

  const [stage, setStage] = useState<Stage>("capture");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Email-capture sub-states
  const [captureSubState, setCaptureSubState] = useState<CaptureSubState>("email");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState<PaymentReadyData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<UploadRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addonsInSummary, setAddonsInSummary] = useState<AddonAccepted[]>([]);
  const [couponCode, setCouponCode] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInit = useRef(false);
  const scenarioSent = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();

  // tRPC mutations
  const registerMutation = trpc.localAuth.register.useMutation();
  const loginMutation = trpc.localAuth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
  });
  const createProjectMutation = trpc.onboarding.createSelfServiceProject.useMutation();
  const resetSessionMutation = trpc.onboarding.resetSelfServiceSession.useMutation();
  const chatMutation = trpc.ai.onboardingChat.useMutation();
  const saveProgressMutation = trpc.onboarding.saveProgress.useMutation();
  const createCheckoutMutation = trpc.onboarding.createCheckoutAfterElena.useMutation();
  const uploadAssetMutation = trpc.onboarding.uploadAsset.useMutation();

  // Check if the user already has an in-progress self-service project
  const selfServiceProjectQuery = trpc.onboarding.mySelfServiceProject.useQuery(undefined, {
    enabled: !!user && !authLoading,
  });

  // Logged-in users always skip email capture and go straight to Elena chat
  useEffect(() => {
    if (authLoading || stage !== "capture") return;
    if (!user) return;
    if (selfServiceProjectQuery.isLoading) return;

    if (selfServiceProjectQuery.data?.id) {
      // Resume in-progress project
      setProjectId(selfServiceProjectQuery.data.id);
      const saved = selfServiceProjectQuery.data.elenaConversationHistory as Array<{ role: "user" | "assistant"; content: string }> | null;
      if (saved && saved.length > 0) {
        setMessages(saved.map(m => ({ role: m.role, content: m.content })));
        hasSentInit.current = true;
      }
      setStage("chat");
    } else {
      // No existing project — auto-create and skip email capture for any logged-in user
      setStage("creating");
      createProjectMutation.mutateAsync()
        .then(({ projectId: newId }) => {
          setProjectId(newId);
          setStage("chat");
        })
        .catch(() => setStage("capture"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, selfServiceProjectQuery.isLoading, selfServiceProjectQuery.data, stage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const isInit = text === "INIT";
      const displayText = isInit ? "" : text;
      const history = messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant" ? stripXmlTags(m.content) : m.content,
      }));

      if (!isInit) setMessages(prev => [...prev, { role: "user", content: displayText }]);
      setInput("");
      setIsLoading(true);

      const apiMessage = isInit
        ? "Hello! I'm interested in getting a website built."
        : text;

      try {
        const result = await chatMutation.mutateAsync({
          projectId: projectId ?? undefined,
          message: apiMessage,
          history,
        });

        const raw = result.response;
        const uploadRequests = parseUploadRequests(raw);
        const addonsAccepted = parseAddonsAccepted(raw);
        const cleaned = stripXmlTags(raw);

        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: cleaned,
            uploadRequests: uploadRequests.length ? uploadRequests : undefined,
            addonsAccepted: addonsAccepted.length ? addonsAccepted : undefined,
          },
        ]);

        if (result.paymentReady) {
          setPaymentReady(result.paymentReady as PaymentReadyData);
          if (projectId && result.extractedData) {
            saveProgressMutation.mutate({
              projectId,
              partialQuestionnaire: result.extractedData as Record<string, unknown>,
            });
          }
        }

        if (addonsAccepted.length) {
          setAddonsInSummary(prev => [...prev, ...addonsAccepted]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isLlmError = msg.includes("LLM") || msg.includes("ANTHROPIC") || msg.includes("authentication");
        toast.error(isLlmError
          ? "AI service is temporarily unavailable. Please try again in a moment."
          : "Failed to send message. Please try again.");
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [messages, projectId, chatMutation, saveProgressMutation]
  );

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-send INIT once project is ready and we haven't sent one yet
  useEffect(() => {
    if (stage !== "chat" || hasSentInit.current || isLoading || messages.length > 0) return;
    hasSentInit.current = true;
    sendMessage("INIT");
  }, [stage, isLoading, messages.length, sendMessage]);

  // Auto-send ?scenario= message after INIT response lands (admin testing)
  useEffect(() => {
    if (stage !== "chat" || scenarioSent.current || isLoading || messages.length === 0) return;
    const params = new URLSearchParams(search);
    const scenario = params.get("scenario");
    if (!scenario) return;
    scenarioSent.current = true;
    sendMessage(scenario);
  }, [stage, isLoading, messages.length, search, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) sendMessage(input.trim());
    }
  };

  const handleFileUpload = useCallback(
    async (req: UploadRequest, file: File) => {
      if (!projectId) { toast.error("No project found."); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
      setUploading(true);
      setUploadingFor(req);
      try {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        await uploadAssetMutation.mutateAsync({
          projectId,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type,
          category: req.type as any,
        });
        toast.success(`${req.label} uploaded!`);
        setUploadingFor(null);
        sendMessage(`I've just uploaded the ${req.label}: ${file.name}`);
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, uploadAssetMutation, sendMessage]
  );

  const handleFreeUpload = useCallback(
    async (file: File) => {
      if (!projectId) { toast.error("No project found."); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
      setUploading(true);
      try {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((d, b) => d + String.fromCharCode(b), "")
        );
        await uploadAssetMutation.mutateAsync({
          projectId,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type,
          category: "logo" as any,
        });
        toast.success(`${file.name} uploaded!`);
        sendMessage(`I've uploaded a file: ${file.name}`);
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, uploadAssetMutation, sendMessage]
  );

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStage("creating");
    const pw = generateTempPassword();
    setTempPassword(pw);

    try {
      await registerMutation.mutateAsync({
        email: email.trim(),
        password: pw,
        name: email.split("@")[0],
      });
      // New account created — go straight to Elena
      const { projectId: newId } = await createProjectMutation.mutateAsync();
      setProjectId(newId);
      setStage("chat");
      toast.success(`Account created! Save your password: ${pw}`, {
        duration: 12000,
        description: "You can change it in your portal settings.",
      });
    } catch (err: any) {
      const isConflict =
        err?.data?.code === "CONFLICT" ||
        err?.message?.includes("already exists") ||
        err?.message?.includes("already registered");

      if (isConflict) {
        // Existing account — switch to inline password form
        setStage("capture");
        setCaptureSubState("password");
        setPassword("");
        setLoginError("");
        return;
      }
      toast.error(err.message || "Something went wrong. Please try again.");
      setStage("capture");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoginError("");
    setStage("creating");

    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      // Authenticated — create a fresh project and start Elena
      const { projectId: newId } = await createProjectMutation.mutateAsync();
      setProjectId(newId);
      setStage("chat");
    } catch (err: any) {
      setStage("capture");
      const isAuthError =
        err?.data?.code === "UNAUTHORIZED" ||
        err?.message?.toLowerCase().includes("invalid") ||
        err?.message?.toLowerCase().includes("password");
      if (isAuthError) {
        setLoginError("Wrong password. Please try again.");
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
      }
    }
  };

  /* ─── LOADING ─────────────────────────────────────────── */
  if (authLoading || (user && selfServiceProjectQuery.isLoading && stage === "capture")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4a9eff]" />
      </div>
    );
  }

  /* ─── EMAIL CAPTURE ──────────────────────────────────── */
  if (stage === "capture") {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center px-4">
        {/* DEV controls */}
        {DEV_MODE && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-xs text-yellow-400/50 hover:text-yellow-400 border border-yellow-400/20 rounded px-2 py-1 transition-colors"
            >
              ↪ Switch Account
            </button>
          </div>
        )}
        {/* Back link */}
        <div className="absolute top-6 left-6">
          <Link href="/">
            <span className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
              <span className="text-lg font-bold text-[#4a9eff]">M</span>
              <span className="font-semibold text-white text-sm">MiniMorph Studios</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Elena avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-2xl shadow-2xl">
                E
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0a0a14]" />
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-serif text-white mb-3 leading-tight">
              {captureSubState === "password" ? "Welcome back." : "Let's build your website."}
            </h1>
            <p className="text-gray-400 font-sans text-base leading-relaxed">
              {captureSubState === "password"
                ? `Enter your password for ${email} to start a new project.`
                : "Tell Elena what you're looking for. She'll walk you through everything — plan, pricing, and your site brief — then you pay only when you're ready."}
            </p>
          </div>

          {/* Email form (sub-state A) */}
          {captureSubState === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-12 bg-[#13131f] border-[#2a2a40] text-white placeholder-gray-500 text-base focus:border-[#4a9eff]/60 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!email.trim()}
                className="w-full h-12 bg-[#4a9eff] hover:bg-[#3a8eef] text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2"
              >
                Start Talking to Elena
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Password form (sub-state B — existing account) */}
          {captureSubState === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {loginError && (
                <p className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-3">
                  {loginError}
                </p>
              )}
              <Input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                placeholder="Your password"
                required
                className="h-12 bg-[#13131f] border-[#2a2a40] text-white placeholder-gray-500 text-base focus:border-[#4a9eff]/60 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!password.trim()}
                className="w-full h-12 bg-[#4a9eff] hover:bg-[#3a8eef] text-white font-semibold text-base rounded-xl flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setCaptureSubState("email"); setPassword(""); setLoginError(""); }}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Change email
                </button>
                <span className="text-gray-600">
                  Forgot password?{" "}
                  <a href="mailto:hello@minimorphstudios.net" className="text-[#4a9eff] hover:underline">
                    Contact us
                  </a>
                </span>
              </div>
            </form>
          )}

          {/* Trust line */}
          <p className="text-center text-xs text-gray-600 mt-4">
            No credit card required until you're ready to start.
          </p>

          {/* Already logged in? */}
          {user && captureSubState === "email" && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Logged in as <span className="text-gray-300">{user.email}</span>.{" "}
              <button
                onClick={async () => {
                  setStage("creating");
                  try {
                    const { projectId: newId } = await createProjectMutation.mutateAsync();
                    setProjectId(newId);
                    setStage("chat");
                  } catch (err: any) {
                    toast.error(err.message || "Something went wrong.");
                    setStage("capture");
                  }
                }}
                className="text-[#4a9eff] hover:underline"
              >
                Start a new project →
              </button>
            </p>
          )}

          {!user && captureSubState === "email" && (
            <p className="text-center text-xs text-gray-600 mt-2">
              Already have an account?{" "}
              <Link href="/login?returnTo=/get-started" className="text-[#4a9eff] hover:underline">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ─── CREATING ───────────────────────────────────────── */
  if (stage === "creating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#4a9eff] mx-auto mb-4" />
          <p className="text-gray-400 font-sans">Setting up your session with Elena…</p>
        </div>
      </div>
    );
  }

  /* ─── CHAT ───────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-[#0a0a14] overflow-hidden">
      {/* Top bar */}
      <header className="flex-none h-14 border-b border-[#1e1e30] flex items-center justify-between px-6 bg-[#0d0d1a]">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-[#4a9eff] flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-bold text-white text-sm">MiniMorph Studios</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {tempPassword && (
            <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
              <span className="text-xs text-amber-400">Save your password:</span>
              <code className="text-xs font-mono text-amber-300">{tempPassword}</code>
            </div>
          )}
          <span className="text-xs text-gray-500 hidden sm:block">
            {user?.email}
          </span>
          {user?.role === "admin" && (
            <button
              onClick={async () => {
                await resetSessionMutation.mutateAsync();
                setProjectId(null);
                setMessages([]);
                hasSentInit.current = false;
                scenarioSent.current = false;
                setPaymentReady(null);
                setAddonsInSummary([]);
                await utils.onboarding.mySelfServiceProject.invalidate();
                setStage("creating");
              }}
              disabled={resetSessionMutation.isPending}
              className="text-xs text-red-400/50 hover:text-red-400 border border-red-400/20 rounded px-2 py-1 transition-colors"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="flex flex-col flex-1">
          {/* Elena header */}
          <div className="flex-none px-6 py-4 border-b border-[#1e1e30] bg-[#0d0d1a] flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                E
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d1a]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Elena Brooks</p>
              <p className="text-xs text-gray-400">Creative Director · MiniMorph Studios</p>
            </div>
          </div>

          {/* Messages + Suggestions */}
          <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Initial loading dots */}
            {messages.length === 0 && isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  E
                </div>
                <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "assistant" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">
                      E
                    </div>
                    <div className="space-y-2 max-w-[80%]">
                      <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="text-sm text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      </div>

                      {/* Upload request cards */}
                      {msg.uploadRequests?.map((req, ri) => (
                        <div key={ri} className="border border-[#4a9eff]/30 bg-[#4a9eff]/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="w-4 h-4 text-[#4a9eff]" />
                            <span className="text-sm font-medium text-[#4a9eff]">{req.label}</span>
                          </div>
                          {req.hint && <p className="text-xs text-gray-400 mb-2">{req.hint}</p>}
                          <label className="block">
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploading}
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(req, f); e.target.value = ""; }}
                              accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                            <span className="inline-flex items-center gap-1.5 text-xs bg-[#4a9eff] hover:bg-[#3a8eef] text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                              {uploading && uploadingFor?.label === req.label ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                              Upload {req.label}
                            </span>
                          </label>
                        </div>
                      ))}

                      {/* Add-on accepted cards */}
                      {msg.addonsAccepted?.map((addon, ai) => (
                        <div key={ai} className="border border-green-500/30 bg-green-500/5 rounded-xl p-3 flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-400">Added to plan: {addon.product}</p>
                            <p className="text-xs text-gray-400">{addon.price} · {addon.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-[#4a9eff]/15 border border-[#4a9eff]/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
                      <p className="text-sm text-gray-200">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Mid-conversation loading dots */}
            {isLoading && messages.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  E
                </div>
                <div className="bg-[#13131f] border border-[#1e1e30] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#4a9eff] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary Card */}
            {paymentReady && (
              <PaymentSummaryCard
                data={paymentReady}
                loading={checkoutLoading}
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onPay={async () => {
                  if (!projectId) { toast.error("Project not found. Please try again."); return; }
                  setCheckoutLoading(true);
                  try {
                    const result = await createCheckoutMutation.mutateAsync({
                      projectId,
                      couponCode: couponCode.trim() || undefined,
                    });
                    window.location.href = result.checkoutUrl;
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Checkout failed");
                    setCheckoutLoading(false);
                  }
                }}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="hidden lg:flex flex-col w-52 shrink-0 pt-4 pb-4 px-3 border-l border-white/[0.06] overflow-y-auto max-h-full gap-2">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider px-1 sticky top-0 bg-[#0d0d1a] py-1">
              {messages.length === 0 ? "Ask Elena anything" : "Try asking..."}
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    if (!isLoading) {
                      setInput(q);
                      setTimeout(() => sendMessage(q), 100);
                    }
                  }}
                  disabled={isLoading}
                  className="text-left text-[11px] text-gray-500 hover:text-gray-200 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-blue-500/25 rounded-lg px-2.5 py-2 transition-all duration-200 leading-snug disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* Input area */}
          <div className="flex-none border-t border-[#1e1e30] p-4 bg-[#0d0d1a]">
            <div className="flex gap-3 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
                className="flex-1 resize-none bg-[#13131f] border-[#2a2a40] text-gray-200 placeholder-gray-500 text-sm min-h-[44px] max-h-32 focus:border-[#4a9eff]/50 rounded-xl"
                rows={1}
                disabled={isLoading}
              />
              <label className={`flex items-center justify-center min-h-[44px] px-3 rounded-xl border border-[#2a2a40] bg-[#13131f] cursor-pointer hover:border-[#4a9eff]/40 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#4a9eff]" /> : <Paperclip className="w-4 h-4 text-gray-500 hover:text-gray-300" />}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading || isLoading}
                  accept="image/*,.pdf,.svg,.ai,.eps,.doc,.docx,.txt"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFreeUpload(f); e.target.value = ""; }}
                />
              </label>
              <Button
                onClick={() => { if (input.trim() && !isLoading) sendMessage(input.trim()); }}
                disabled={!input.trim() || isLoading}
                className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white min-h-[44px] px-4 rounded-xl"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Your progress is automatically saved — you can close this tab and pick up right where you left off.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAYMENT SUMMARY CARD
   ═══════════════════════════════════════════════════════ */
function PaymentSummaryCard({
  data,
  loading,
  couponCode,
  onCouponChange,
  onPay,
}: {
  data: PaymentReadyData;
  loading: boolean;
  couponCode: string;
  onCouponChange: (v: string) => void;
  onPay: () => void;
}) {
  const tier = data.packageTier ? capitalize(data.packageTier) : "Your";
  const total = data.monthlyTotal ?? 0;
  const addons = data.addons ?? [];

  const validateCoupon = trpc.onboarding.validateCoupon.useQuery(
    { code: couponCode.trim().toUpperCase() },
    { enabled: couponCode.trim().length >= 2, retry: false }
  );
  const couponValid = validateCoupon.data?.valid;
  const couponError = validateCoupon.error?.message;

  return (
    <div className="mx-2 my-3">
      <div className="bg-gradient-to-br from-[#1a2a3a] to-[#13131f] border border-[#4a9eff]/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#4a9eff]/15 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[#4a9eff]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ready to start your website</p>
            <p className="text-xs text-gray-400">Complete payment to begin your build</p>
          </div>
        </div>

        <div className="bg-[#0d0d1a] rounded-xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{tier} Package</span>
            <span className="text-white font-medium">
              ${total > 0 ? (total - addons.reduce((s, a) => s + a.price, 0)).toFixed(0) : "—"}/mo
            </span>
          </div>
          {addons.map((a, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-400">{a.product}</span>
              <span className="text-gray-300">+${a.price}/mo</span>
            </div>
          ))}
          <div className="border-t border-[#2a2a40] pt-2 flex justify-between">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="text-sm font-bold text-[#4a9eff]">${total > 0 ? total.toFixed(0) : "—"}/mo</span>
          </div>
        </div>

        {/* Coupon code input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={e => onCouponChange(e.target.value.toUpperCase())}
              placeholder="Coupon code (optional)"
              className="flex-1 bg-[#0d0d1a] border border-[#2a2a40] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#4a9eff]/50"
            />
          </div>
          {couponCode.trim().length >= 2 && (
            <p className={`text-xs mt-1.5 ${couponValid ? "text-green-400" : couponError ? "text-red-400" : "text-gray-500"}`}>
              {validateCoupon.isLoading ? "Checking..." : couponValid
                ? `✓ ${validateCoupon.data?.description || (validateCoupon.data?.discountType === "free" ? "Free site applied!" : `${validateCoupon.data?.discountValue}% off applied`)}`
                : couponError || ""}
            </p>
          )}
        </div>

        <button
          onClick={onPay}
          disabled={loading}
          className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] disabled:opacity-60 text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Lock className="w-4 h-4" />Start My Website →</>
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Secure payment via Stripe · 12-month commitment billed monthly
        </p>
      </div>
    </div>
  );
}
