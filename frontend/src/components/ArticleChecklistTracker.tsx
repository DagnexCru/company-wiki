import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  Clock,
  Check,
  Award,
  Users,
} from "lucide-react";
import type { ArticleChecklistProgress } from "../types/checklist";

interface ArticleChecklistTrackerProps {
  progress: ArticleChecklistProgress | null;
  articleTitle?: string;
  loading?: boolean;
  onRequestReset: () => void;
  canViewTeamCompliance?: boolean;
  onOpenTeamCompliance?: () => void;
  onOpenCertificate?: () => void;
}

export const ArticleChecklistTracker: React.FC<ArticleChecklistTrackerProps> = ({
  progress,
  articleTitle,
  loading = false,
  onRequestReset,
  canViewTeamCompliance = false,
  onOpenTeamCompliance,
  onOpenCertificate,
}) => {
  const [showSticky, setShowSticky] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header when scrolled past initial article header (~340px)
      if (window.scrollY > 340) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!progress || progress.total_items === 0) {
    return null;
  }

  const {
    completed_count,
    total_items,
    completion_percentage,
    is_completed,
    completed_at,
  } = progress;

  const remaining = Math.max(0, total_items - completed_count);

  const formattedCompletedAt = completed_at
    ? new Date(completed_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      {/* 1. TOP STICKY PROGRESS BAR WIDGET (PINS ON SCROLL) */}
      {showSticky && (
        <div className="fixed top-16 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-md transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
            {/* Left: Article Title Snippet & Status */}
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  is_completed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                }`}
              >
                {is_completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
                )}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {articleTitle || "SOP Runbook"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {is_completed
                    ? "100% Completed 🎉"
                    : `${remaining} ${remaining === 1 ? "step" : "steps"} remaining`}
                </span>
              </div>
            </div>

            {/* Center: Live Sticky Progress Bar */}
            <div className="flex-1 max-w-md hidden sm:flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>
                  {completed_count} of {total_items} steps ({completion_percentage}%)
                </span>
                {is_completed && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    is_completed
                      ? "bg-emerald-500 shadow-xs"
                      : "bg-linear-to-r from-indigo-500 to-purple-600"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, completion_percentage))}%` }}
                />
              </div>
            </div>

            {/* Right: Metrics & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="sm:hidden text-xs font-semibold text-slate-700 dark:text-slate-300">
                {completed_count}/{total_items} ({completion_percentage}%)
              </span>
              {canViewTeamCompliance && onOpenTeamCompliance && (
                <button
                  type="button"
                  onClick={onOpenTeamCompliance}
                  title="View Team Compliance & Execution Audit"
                  className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition border border-indigo-200 dark:border-indigo-800"
                >
                  <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Team Audit</span>
                </button>
              )}
              {is_completed && onOpenCertificate && (
                <button
                  type="button"
                  onClick={onOpenCertificate}
                  title="View & Download Completion Certificate"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                >
                  <Award className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Certificate</span>
                </button>
              )}
              {completed_count > 0 && (
                <button
                  type="button"
                  onClick={onRequestReset}
                  disabled={loading}
                  title="Reset checklist progress"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN PROGRESS CARD (RENDERED AT TOP OF ARTICLE CONTENT) */}
      <div
        className={`my-6 p-4 sm:p-6 rounded-3xl border transition-all duration-300 shadow-xs ${
          is_completed
            ? "border-emerald-300/80 dark:border-emerald-800/80 bg-linear-to-br from-emerald-50/90 via-emerald-100/30 to-teal-50/50 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 ring-1 ring-emerald-500/20"
            : "border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 ${
                is_completed
                  ? "bg-emerald-600 text-white scale-105 animate-bounce-short"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {is_completed ? (
                <PartyPopper className="w-6 h-6" />
              ) : (
                <CheckSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  SOP Checklist & Runbook Progress
                </h3>
                {is_completed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-600 text-white shadow-xs">
                    <Sparkles className="w-3 h-3" /> 100% Completed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {remaining} {remaining === 1 ? "step" : "steps"} remaining
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {is_completed
                  ? "All standard operating procedure steps have been successfully verified and saved."
                  : "Check off items as you proceed. Progress is synchronized live to your profile."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto shrink-0">
            <div className="text-right">
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                {completed_count} / {total_items}
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {completion_percentage}% Done
              </span>
            </div>

            {canViewTeamCompliance && onOpenTeamCompliance && (
              <button
                type="button"
                onClick={onOpenTeamCompliance}
                title="Audit team member execution & compliance table"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl transition shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Team Audit</span>
              </button>
            )}

            {completed_count > 0 && (
              <button
                type="button"
                onClick={onRequestReset}
                disabled={loading}
                title="Reset checklist progress"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-2xs disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Progress Bar with animated fill */}
        <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              is_completed
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-sm"
                : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, completion_percentage))}%` }}
          />
        </div>

        {/* 3. 100% CELEBRATION CALLOUT BANNER */}
        {is_completed && (
          <div className="mt-4 pt-3.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-spin-slow shrink-0" />
              <span>
                🎉 <strong>Runbook Verified!</strong> Full checklist execution logged to database.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {formattedCompletedAt && (
                <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Completed: {formattedCompletedAt}</span>
                </div>
              )}
              {onOpenCertificate && (
                <button
                  type="button"
                  onClick={onOpenCertificate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow-emerald-500/20 transition transform hover:scale-[1.02] cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>View Official Certificate</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
