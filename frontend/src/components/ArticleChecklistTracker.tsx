import React from "react";
import { CheckSquare, RotateCcw, CheckCircle2 } from "lucide-react";
import type { ArticleChecklistProgress } from "../types/checklist";

interface ArticleChecklistTrackerProps {
  progress: ArticleChecklistProgress | null;
  loading?: boolean;
  onReset: () => void;
}

export const ArticleChecklistTracker: React.FC<ArticleChecklistTrackerProps> = ({
  progress,
  loading = false,
  onReset,
}) => {
  if (!progress || progress.total_items === 0) {
    return null;
  }

  const { completed_count, total_items, completion_percentage, is_completed } = progress;

  return (
    <div className="my-6 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/10 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              is_completed
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
            }`}
          >
            {is_completed ? <CheckCircle2 className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                SOP Checklist & Runbook Progress
              </h3>
              {is_completed && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Completed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {is_completed
                ? "All SOP runbook steps have been successfully verified."
                : "Check off items as you proceed. State persists automatically across sessions."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {completed_count} of {total_items} ({completion_percentage}%)
          </span>
          {completed_count > 0 && (
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              title="Reset progress back to 0"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            is_completed
              ? "bg-emerald-500 shadow-sm"
              : "bg-linear-to-r from-indigo-500 to-purple-600"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, completion_percentage))}%` }}
        />
      </div>
    </div>
  );
};
