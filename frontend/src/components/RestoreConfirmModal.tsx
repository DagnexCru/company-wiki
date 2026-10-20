import React, { useState } from "react";
import { History, AlertTriangle, X, Check } from "lucide-react";

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  targetRevisionNumber: number;
  articleTitle: string;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetRevisionNumber,
  articleTitle,
}) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to restore revision. Please check permissions.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Restore Revision #{targetRevisionNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Non-destructive linear history restoration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invariant Explanation Banner */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Preserving Immutable History Invariant</span>
          </div>
          <p>
            Restoring does <strong>NOT</strong> delete or overwrite previous
            versions. It will generate a <strong>new sequential revision</strong> containing
            the exact content and metadata from Revision #{targetRevisionNumber} for article &ldquo;{articleTitle}&rdquo;.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Justification for Restoration (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Reverting accidental section deletion from Rev #4"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow transition disabled:opacity-50"
            >
              {submitting ? (
                "Restoring..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Create Restored Revision
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
