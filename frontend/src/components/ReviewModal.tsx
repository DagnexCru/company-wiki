import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileCheck,
  Send,
} from "lucide-react";
import type { ArticleDetail } from "../types/article";

interface ReviewModalProps {
  isOpen: boolean;
  mode: "approve" | "reject";
  article: ArticleDetail;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  mode,
  article,
  onClose,
  onSubmit,
}) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isReject = mode === "reject";
  const minChars = isReject ? 5 : 0;
  const isValid = !isReject || feedback.trim().length >= minChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(`Rejection feedback must be at least ${minChars} characters.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(feedback.trim());
      setFeedback("");
      onClose();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        errObj.response?.data?.detail ||
          errObj.message ||
          "Failed to process review decision."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 border-b flex items-start gap-4 ${
            isReject
              ? "border-rose-100 bg-rose-50/50 dark:border-rose-950/40 dark:bg-rose-950/20"
              : "border-emerald-100 bg-emerald-50/50 dark:border-emerald-950/40 dark:bg-emerald-950/20"
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isReject
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
            }`}
          >
            {isReject ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isReject ? "Reject Article & Request Changes" : "Approve & Publish Article"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Article: <span className="font-semibold text-slate-700 dark:text-slate-300">"{article.title}"</span>
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              {isReject ? (
                <>
                  Reason for Rejection <span className="text-rose-500">*</span>
                </>
              ) : (
                "Editorial Note (Optional)"
              )}
            </label>
            <p className="text-xs text-slate-500 mb-2">
              {isReject
                ? "Explain to the author what needs to be revised or improved before this article can be approved."
                : "Add an optional review remark to record in the permanent audit trail."}
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                isReject
                  ? "e.g., Please add a section detailing rollback procedures and cite the security policy..."
                  : "e.g., Verified technical steps and formatted diagrams. Approved for publication."
              }
              rows={4}
              required={isReject}
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition outline-hidden ${
                isReject && feedback.length > 0 && feedback.trim().length < 5
                  ? "border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />
            {isReject && (
              <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                <span>Minimum 5 characters required</span>
                <span
                  className={
                    feedback.trim().length >= 5
                      ? "text-emerald-600 font-medium"
                      : "text-slate-400"
                  }
                >
                  {feedback.trim().length} chars
                </span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              disabled={isSubmitting || !isValid}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isReject
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isReject ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Rejection</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
