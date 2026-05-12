import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Star,
  Palette,
  Users,
  Package,
  FileText,
  Image as ImageIcon,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  uploadRequests?: UploadRequest[];
  addonsAccepted?: AddonAccepted[];
};

type UploadRequest = {
  type: string;
  label: string;
  hint: string;
};

type AddonAccepted = {
  product: string;
  price: string;
  label: string;
};

type SummaryData = {
  businessType?: string;
  brandTone?: string;
  brandColors?: string[];
  targetAudience?: string;
  contentPreference?: string;
  addons?: AddonAccepted[];
  assetsRequested?: UploadRequest[];
  questionnaire?: Record<string, unknown>;
};

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
  // [^>]* stops at > so it handles any attribute values including those with /
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

const PHASES = [
  "Opening",
  "Business Discovery",
  "Brand & Identity",
  "Industry Details",
  "Add-on Suggestions",
  "Asset Collection",
  "Confirmation",
  "Handoff",
];

function getPhaseFromMessages(msgs: ChatMessage[]): number {
  const count = msgs.filter(m => m.role === "assistant").length;
  if (count <= 1) return 0;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  if (count <= 7) return 3;
  if (count <= 9) return 4;
  if (count <= 11) return 5;
  if (count <= 13) return 6;
  return 7;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  service_business: "Service Business",
  restaurant: "Restaurant / Food",
  contractor: "Contractor / Trades",
  ecommerce: "E-Commerce",
  other: "Other",
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData>({});
  const [completed, setCompleted] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [uploadingFor, setUploadingFor] = useState<UploadRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInit = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [paymentReady, setPaymentReady] = useState<PaymentReadyData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const myProjectQuery = trpc.onboarding.myCurrentProject.useQuery(undefined, {
    enabled: !!user,
  });

  const chatMutation = trpc.ai.onboardingChat.useMutation();
  const saveQuestionnaireMutation = trpc.onboarding.saveQuestionnaire.useMutation();
  const saveProgressMutation = trpc.onboarding.saveProgress.useMutation();
  const createCheckoutMutation = trpc.onboarding.createCheckoutAfterElena.useMutation();
  const recordAgreementMutation = trpc.onboarding.recordAgreementAcceptance.useMutation();
  const uploadAssetMutation = trpc.onboarding.uploadAsset.useMutation();

  // Load saved conversation on mount — runs once when project query settles
  useEffect(() => {
    if (myProjectQuery.isLoading || historyLoaded) return;

    const project = myProjectQuery.data;
    if (project?.id) setProjectId(project.id);

    const savedHistory = project?.elenaConversationHistory as Array<{ role: "user" | "assistant"; content: string }> | null;

    if (savedHistory && savedHistory.length > 0) {
      // Restore the conversation — customer is returning
      setMessages(savedHistory.map(m => ({ role: m.role, content: m.content })));
      setIsResumed(true);
      hasSentInit.current = true; // don't send INIT
      setLastSaved(project?.lastSavedAt ? new Date(project.lastSavedAt) : new Date());

      // Restore partial summary from saved questionnaire
      const q = project?.questionnaire as Record<string, unknown> | null;
      if (q) {
        setSummary(prev => ({
          ...prev,
          businessType: (q.websiteType as string) || prev.businessType,
          brandTone: (q.brandTone as string) || prev.brandTone,
          brandColors: (q.brandColors as string[]) || prev.brandColors,
          targetAudience: (q.targetAudience as string) || prev.targetAudience,
          contentPreference: (q.contentPreference as string) || prev.contentPreference,
          questionnaire: q,
        }));
      }
    }

    // If questionnaire was already submitted, mark complete
    if (project?.stage && !["intake", "questionnaire"].includes(project.stage)) {
      setCompleted(true);
    }

    setHistoryLoaded(true);
  }, [myProjectQuery.isLoading, myProjectQuery.data, historyLoaded]);

  // Warn before leaving mid-conversation
  useEffect(() => {
    if (completed || messages.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [completed, messages.length]);

  // sendMessage defined before the effects that reference it so bundlers don't see a forward reference
  const sendMessage = useCallback(
    async (text: string) => {
      const isInit = text === "INIT";
      const displayText = isInit ? "" : text;

      const history = messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant" ? stripXmlTags(m.content) : m.content,
      }));

      if (!isInit) {
        setMessages(prev => [...prev, { role: "user", content: displayText }]);
      }
      setInput("");
      setIsLoading(true);

      // Build message for API — init sends a specific trigger
      const apiMessage = isInit
        ? `Hello! My name is ${user?.name || "there"}. I'm ready to start my website project.`
        : text;

      try {
        // mutateAsync is a stable reference in tRPC v11 / React Query v5
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

        // Mark last saved timestamp after each successful exchange
        setLastSaved(new Date());
        // Dismiss welcome-back banner after customer sends first message
        setIsResumed(false);

        // Handle payment_ready — save questionnaire data but defer generation until after payment
        if (result.paymentReady) {
          setPaymentReady(result.paymentReady as PaymentReadyData);
          // Save questionnaire data so webhook can trigger generation after payment
          if (projectId && result.extractedData) {
            try {
              await saveProgressMutation.mutateAsync({
                projectId,
                partialQuestionnaire: result.extractedData as Record<string, unknown>,
              });
            } catch { /* best-effort */ }
          }
        }

        // Update live summary from extractedData
        if (result.extractedData) {
          const d = result.extractedData as Record<string, unknown>;
          setSummary(prev => ({
            ...prev,
            businessType: (d.websiteType as string) || prev.businessType,
            brandTone: (d.brandTone as string) || prev.brandTone,
            brandColors: (d.brandColors as string[]) || prev.brandColors,
            targetAudience: (d.targetAudience as string) || prev.targetAudience,
            contentPreference: (d.contentPreference as string) || prev.contentPreference,
            questionnaire: d,
          }));

          // Only trigger immediate generation for self-service (no paymentReady signal)
          if (!result.paymentReady && projectId) {
            try {
              await saveQuestionnaireMutation.mutateAsync({
                projectId,
                questionnaire: d,
              });
            } catch { /* best-effort */ }
            setCompleted(true);
          }
        }

        // Update add-ons in summary
        if (addonsAccepted.length) {
          setSummary(prev => ({
            ...prev,
            addons: [...(prev.addons || []), ...addonsAccepted],
          }));
        }

        // Update assets requested in summary
        if (uploadRequests.length) {
          setSummary(prev => ({
            ...prev,
            assetsRequested: [...(prev.assetsRequested || []), ...uploadRequests],
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[sendMessage] error:", msg);
        const isLlmError = msg.includes("LLM invoke failed") || msg.includes("ANTHROPIC") || msg.includes("authentication");
        toast.error(isLlmError
          ? "AI service is temporarily unavailable. Please try again in a moment."
          : "Failed to send message. Please try again.");
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, projectId, user]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-send opening message — only once historyLoaded confirms no saved history
  useEffect(() => {
    if (!user || hasSentInit.current || authLoading || !historyLoaded || isResumed) return;
    hasSentInit.current = true;
    sendMessage("INIT");
  }, [user, authLoading, sendMessage, historyLoaded, isResumed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) sendMessage(input.trim());
    }
  };

  const handleFileUpload = useCallback(
    async (req: UploadRequest, file: File) => {
      if (!projectId) {
        toast.error("No project found. Please complete your purchase first.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Max 10MB.");
        return;
      }
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
        // Tell Elena the file was uploaded
        sendMessage(`I've just uploaded the ${req.label}: ${file.name}`);
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [projectId, uploadAssetMutation, sendMessage]
  );

  const currentPhase = getPhaseFromMessages(messages);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4a9eff]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="max-w-md w-full mx-4 bg-[#13131f] border border-[#2a2a40] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#4a9eff]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#4a9eff]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Project</h2>
          <p className="text-gray-400 mb-6">Sign in to meet Elena and start your onboarding.</p>
          <a href="/login">
            <Button className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white w-full min-h-[44px]">
              Sign In to Continue
            </Button>
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Don't have a project yet?{" "}
            <Link href="/get-started" className="text-[#4a9eff] hover:underline">
              Get started here
            </Link>
          </p>
        </div>
      </div>
    );
  }

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
        {/* Phase progress bar */}
        <div className="hidden md:flex items-center gap-1">
          {PHASES.map((phase, i) => (
            <div
              key={phase}
              title={phase}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= currentPhase ? "bg-[#4a9eff] w-8" : "bg-[#1e1e30] w-4"
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-2">
            {PHASES[currentPhase]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {user.name || user.email}
          </span>
          {lastSaved && !completed && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          )}
          {completed && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </span>
          )}
        </div>
      </header>

      {/* Main two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Elena chat (60%) */}
        <div className="flex flex-col w-full md:w-[60%] border-r border-[#1e1e30]">
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

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Welcome back banner — shown when restoring a saved conversation */}
            {isResumed && messages.length > 0 && (
              <div className="flex items-center gap-3 bg-[#4a9eff]/10 border border-[#4a9eff]/30 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-[#4a9eff] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#4a9eff]">Welcome back!</p>
                  <p className="text-xs text-gray-400">We saved your conversation — pick up right where you left off.</p>
                </div>
              </div>
            )}

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
                        <div
                          key={ri}
                          className="border border-[#4a9eff]/30 bg-[#4a9eff]/5 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="w-4 h-4 text-[#4a9eff]" />
                            <span className="text-sm font-medium text-[#4a9eff]">
                              {req.label}
                            </span>
                          </div>
                          {req.hint && (
                            <p className="text-xs text-gray-400 mb-2">{req.hint}</p>
                          )}
                          <label className="block">
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploading}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(req, f);
                                e.target.value = "";
                              }}
                              accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                            <span className="inline-flex items-center gap-1.5 text-xs bg-[#4a9eff] hover:bg-[#3a8eef] text-white px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                              {uploading && uploadingFor?.label === req.label ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Upload {req.label}
                            </span>
                          </label>
                        </div>
                      ))}

                      {/* Add-on accepted cards */}
                      {msg.addonsAccepted?.map((addon, ai) => (
                        <div
                          key={ai}
                          className="border border-green-500/30 bg-green-500/5 rounded-xl p-3 flex items-center gap-3"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-400">
                              Added to plan: {addon.product}
                            </p>
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

            {/* Loading indicator (mid-conversation) */}
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

            {/* Payment Summary Card — shown after Elena fires <payment_ready> */}
            {paymentReady && !completed && (
              <PaymentSummaryCard
                data={paymentReady}
                loading={checkoutLoading}
                onPay={async (signerName: string) => {
                  if (!projectId) { toast.error("Project not found. Please try again."); return; }
                  setCheckoutLoading(true);
                  try {
                    const agreementResult = await recordAgreementMutation.mutateAsync({
                      projectId,
                      signerName,
                      packageSnapshot: paymentReady as Record<string, unknown>,
                      termsVersion: "1.0",
                    });
                    const result = await createCheckoutMutation.mutateAsync({
                      projectId,
                      agreementId: agreementResult.agreementId,
                    });
                    window.location.href = result.checkoutUrl;
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Checkout failed";
                    toast.error(msg);
                    setCheckoutLoading(false);
                  }
                }}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Completed state */}
          {completed ? (
            <div className="flex-none border-t border-[#1e1e30] p-4 bg-[#0d0d1a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">
                    Onboarding complete — review your Website Blueprint in the portal!
                  </span>
                </div>
                <Link href="/portal">
                  <Button size="sm" className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white min-h-[36px]">
                    View Status <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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
                <Button
                  onClick={() => { if (input.trim() && !isLoading) sendMessage(input.trim()); }}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#4a9eff] hover:bg-[#3a8eef] text-white min-h-[44px] px-4 rounded-xl"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Need help?{" "}
                <a href="mailto:hello@minimorphstudios.net" className="text-[#4a9eff] hover:underline">
                  Contact our team
                </a>
              </p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Live summary card (40%) — hidden on mobile */}
        <div className="hidden md:flex flex-col w-[40%] overflow-y-auto bg-[#0d0d1a]">
          <div className="p-6 border-b border-[#1e1e30]">
            <h3 className="font-semibold text-white text-sm mb-1">Your Website Brief</h3>
            <p className="text-xs text-gray-400">Updates as Elena learns about your business</p>
          </div>

          <div className="flex-1 p-6 space-y-4">
            {/* Phase progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Discovery Progress</span>
                <span>{Math.round(((currentPhase + 1) / PHASES.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-[#1e1e30] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4a9eff] to-[#7c5cfc] rounded-full transition-all duration-700"
                  style={{ width: `${((currentPhase + 1) / PHASES.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[#4a9eff]">{PHASES[currentPhase]}</p>
            </div>

            <div className="border-t border-[#1e1e30]" />

            {/* Business type */}
            <SummaryField
              icon={<Package className="w-4 h-4" />}
              label="Business Type"
              value={summary.businessType ? BUSINESS_TYPE_LABELS[summary.businessType] || summary.businessType : undefined}
            />

            {/* Brand tone */}
            <SummaryField
              icon={<Star className="w-4 h-4" />}
              label="Brand Tone"
              value={summary.brandTone ? capitalize(summary.brandTone) : undefined}
            />

            {/* Brand colors */}
            {summary.brandColors?.length ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Palette className="w-4 h-4" />
                  <span>Brand Colors</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.brandColors.map((color, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border border-white/10"
                        style={{ background: color }}
                      />
                      <span className="text-xs text-gray-300 font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <SummaryField icon={<Palette className="w-4 h-4" />} label="Brand Colors" value={undefined} />
            )}

            {/* Target audience */}
            <SummaryField
              icon={<Users className="w-4 h-4" />}
              label="Target Audience"
              value={summary.targetAudience}
            />

            {/* Content preference */}
            <SummaryField
              icon={<FileText className="w-4 h-4" />}
              label="Content"
              value={
                summary.contentPreference === "we_write"
                  ? "MiniMorph writes it"
                  : summary.contentPreference === "customer_provides"
                  ? "I'll provide it"
                  : summary.contentPreference === "mix"
                  ? "Mix of both"
                  : undefined
              }
            />

            {/* Assets requested */}
            {(summary.assetsRequested?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ImageIcon className="w-4 h-4" />
                  <span>Assets Requested</span>
                </div>
                <div className="space-y-1">
                  {summary.assetsRequested?.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <Upload className="w-3 h-3 text-[#4a9eff]" />
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons selected */}
            {(summary.addons?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Add-ons Selected</span>
                </div>
                <div className="space-y-1.5">
                  {summary.addons?.map((addon, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-green-300">{addon.product}</span>
                      <span className="text-xs text-gray-400">{addon.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed state */}
            {completed && (
              <div className="mt-4 p-4 bg-gradient-to-br from-[#4a9eff]/10 to-[#7c5cfc]/10 border border-[#4a9eff]/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4a9eff]" />
                  <span className="text-sm font-medium text-white">Building your website</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Our AI is generating your site now. You'll receive an email when your preview is ready — typically within 2–3 minutes.
                </p>
                <Link href="/portal">
                  <Button size="sm" className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] text-white mt-1">
                    Track Progress <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Empty state prompt */}
            {!summary.businessType && !isLoading && messages.length > 2 && (
              <div className="text-center py-8">
                <Globe className="w-8 h-8 text-[#1e1e30] mx-auto mb-2" />
                <p className="text-xs text-gray-600">
                  Your brief will appear here as Elena learns about your business.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function SummaryField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      {value ? (
        <p className="text-sm text-gray-200 pl-6">{value}</p>
      ) : (
        <div className="pl-6 h-4 bg-[#1a1a2e] rounded animate-pulse w-3/4" />
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ═══════════════════════════════════════════════════════
   PAYMENT SUMMARY CARD
   Shown after Elena fires <payment_ready>
   ═══════════════════════════════════════════════════════ */
function PaymentSummaryCard({
  data,
  loading,
  onPay,
}: {
  data: PaymentReadyData;
  loading: boolean;
  onPay: (signerName: string) => void;
}) {
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [signerName, setSignerName] = useState("");
  const tier = data.packageTier ? capitalize(data.packageTier) : "Your";
  const total = data.monthlyTotal ?? 0;
  const addons = data.addons ?? [];

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

        {/* Legal acceptance — required before checkout */}
        <div className="mb-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium">Your full legal name (e-signature)</p>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Full name as it appears on ID"
              className="w-full bg-[#0d0d1a] border border-[#2a2a40] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4a9eff]/50"
            />
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={e => setLegalAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${legalAccepted ? "bg-[#4a9eff] border-[#4a9eff]" : "border-gray-600 group-hover:border-gray-400"}`}>
                {legalAccepted && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-xs text-gray-400 leading-relaxed">
              I agree to MiniMorph Studios'{" "}
              <a href="/terms" target="_blank" className="text-[#4a9eff] hover:underline">Terms of Service</a> and{" "}
              <a href="/privacy" target="_blank" className="text-[#4a9eff] hover:underline">Privacy Policy</a>, and authorize a 12-month service agreement at{" "}
              <strong className="text-white">${total > 0 ? total.toFixed(0) : "—"}/mo</strong>, billed monthly.
            </span>
          </label>
        </div>

        <button
          onClick={() => onPay(signerName.trim())}
          disabled={loading || !legalAccepted || signerName.trim().length < 2}
          className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Start My Website →
            </>
          )}
        </button>
        {(!legalAccepted || signerName.trim().length < 2) && (
          <p className="text-center text-xs text-amber-500/70 mt-1.5">
            {signerName.trim().length < 2 ? "Enter your full name above to continue" : "Check the box above to accept the terms"}
          </p>
        )}
        <p className="text-center text-xs text-gray-500 mt-2">
          Secure payment via Stripe · Cancel anytime with 30-day notice
        </p>
      </div>
    </div>
  );
}
