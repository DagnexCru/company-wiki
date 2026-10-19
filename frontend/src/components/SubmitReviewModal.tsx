import React, { useState } from "react";
import { Send, AlertCircle, Loader2 } from "lucide-react";

interface SubmitReviewModalProps {
  isOpen: boolean;
  articleTitle: string;
  isResubmission?: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  articleTitle,
  isResubmission = false,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(notes.trim());
      setNotes("");
      onClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        errObj.response?.data?.detail ||
          errObj.message ||
          "Failed to submit article for review."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-indigo-100 bg-indigo-50/50 dark:border-indigo-950/40 dark:bg-indigo-950/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isResubmission ? "Resubmit Article for Review" : "Submit Article for Review"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              "{articleTitle}"
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Reviewer Notes (Optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              {isResubmission
                ? "Describe what revisions were made in response to earlier feedback."
                : "Provide context for the editorial review team."}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Updated section 3 with production rollout instructions..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReviewModal;
