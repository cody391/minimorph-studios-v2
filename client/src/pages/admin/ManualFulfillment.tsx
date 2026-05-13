import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, RotateCcw, AlertCircle, ChevronDown, ExternalLink } from "lucide-react";

type TabKey = "pending" | "completed" | "all";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  blocked: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  not_applicable: "bg-gray-100 text-gray-600",
  unknown: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.unknown}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function MarkCompleteModal({
  itemId,
  title,
  onClose,
  onSuccess,
}: {
  itemId: number;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [error, setError] = useState("");

  const markComplete = trpc.compliance.markFulfillmentItemCompleted.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: { message: string }) => setError(err.message),
  });

  const handleSubmit = () => {
    setError("");
    if (note.trim().length < 5) {
      setError("Note must be at least 5 characters.");
      return;
    }
    if (evidenceUrl && !/^https?:\/\/.+/.test(evidenceUrl)) {
      setError("Evidence URL must start with http:// or https://");
      return;
    }
    markComplete.mutate({
      itemId,
      completionNote: note.trim(),
      evidenceUrl: evidenceUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Mark as Completed</h2>
        <p className="text-sm text-gray-600 truncate">{title}</p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Completion note <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Describe what was done..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Evidence URL (optional)</label>
          <input
            type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://..."
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={markComplete.isPending}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {markComplete.isPending ? "Saving..." : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReopenModal({
  itemId,
  title,
  onClose,
  onSuccess,
}: {
  itemId: number;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const reopen = trpc.compliance.reopenFulfillmentItem.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: { message: string }) => setError(err.message),
  });

  const handleSubmit = () => {
    setError("");
    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }
    reopen.mutate({ itemId, reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Reopen Item</h2>
        <p className="text-sm text-gray-600 truncate">{title}</p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reason for reopening <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Why is this item being reopened?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={reopen.isPending}
            className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {reopen.isPending ? "Reopening..." : "Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManualFulfillment() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [completeModal, setCompleteModal] = useState<{ itemId: number; title: string } | null>(null);
  const [reopenModal, setReopenModal] = useState<{ itemId: number; title: string } | null>(null);

  const statusFilter = tab === "all" ? "all" : tab === "pending" ? "pending" : "completed";

  const { data: items, isLoading, refetch } = trpc.compliance.listManualFulfillmentItems.useQuery(
    { status: statusFilter as any },
    { refetchOnWindowFocus: false },
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Fulfillment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mark manual add-on items as completed so they no longer block launch.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">Loading...</div>
      )}

      {!isLoading && items?.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          No items in this view.
        </div>
      )}

      {!isLoading && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                    <StatusBadge status={item.status} />
                    {item.isBlocking && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                        <AlertCircle className="w-3 h-3" /> Blocking launch
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.customerName} &middot; <span className="font-mono">{item.addonKey}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.isBlocking && (
                    <button
                      onClick={() => setCompleteModal({ itemId: item.id, title: item.title })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                  )}
                  {!item.isBlocking && item.status !== "not_applicable" && (
                    <button
                      onClick={() => setReopenModal({ itemId: item.id, title: item.title })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}

              {item.completionNote && (
                <div className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-800">
                  <span className="font-medium">Note:</span> {item.completionNote}
                  {item.completedBy && (
                    <span className="ml-2 text-green-600">— {item.completedBy}</span>
                  )}
                </div>
              )}

              {item.evidenceUrl && (
                <a
                  href={item.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View evidence
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {completeModal && (
        <MarkCompleteModal
          itemId={completeModal.itemId}
          title={completeModal.title}
          onClose={() => setCompleteModal(null)}
          onSuccess={() => refetch()}
        />
      )}

      {reopenModal && (
        <ReopenModal
          itemId={reopenModal.itemId}
          title={reopenModal.title}
          onClose={() => setReopenModal(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
