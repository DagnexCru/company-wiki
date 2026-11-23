import React, { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, X, Send, Loader2 } from "lucide-react";
import type { TextSelectionData } from "../hooks/useTextSelection";

interface FloatingAnnotationBubbleProps {
  selection: TextSelectionData | null;
  onClose: () => void;
  onSubmit: (content: string, selection: TextSelectionData) => Promise<void>;
}

export const FloatingAnnotationBubble: React.FC<FloatingAnnotationBubbleProps> = ({
  selection,
  onClose,
  onSubmit,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Reset expanded state if selection changes
  useEffect(() => {
    setIsExpanded(false);
    setCommentText("");
  }, [selection?.selectedText]);

  if (!selection || !selection.coords) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(commentText.trim(), selection);
      setIsExpanded(false);
      setCommentText("");
      onClose();
    } catch (err) {
      console.error("Failed to submit inline annotation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: `${selection.coords.top - 8}px`,
        left: `${selection.coords.left}px`,
        transform: "translate(-50%, -100%)",
      }}
      className="z-40 pointer-events-auto"
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
          <span>Add Comment</span>
        </button>
      ) : (
        <div className="w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquarePlus className="w-3 h-3 text-indigo-500" />
              New Annotation
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border-l-2 border-indigo-500 truncate max-w-full">
            "{selection.selectedText}"
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask a question or provide feedback..."
              rows={3}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Comment</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
