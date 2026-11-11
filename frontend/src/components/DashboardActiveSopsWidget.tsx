import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { checklistService } from "../services/checklistService";
import type { ArticleChecklistProgress } from "../types/checklist";

export const DashboardActiveSopsWidget: React.FC = () => {
  const [sops, setSops] = useState<ArticleChecklistProgress[]>([]);
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await checklistService.getMyChecklists(filter);
      setSops(res.results || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                My Active SOPs & Onboarding Trackers
              </h2>
              {sops.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {sops.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal execution progress across runbooks and operating checklists
            </p>
          </div>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition ${
                filter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("in_progress")}
              className={`px-3 py-1 rounded-lg transition ${
                filter === "in_progress"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-lg transition ${
                filter === "completed"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Completed
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSops}
            disabled={loading}
            title="Refresh SOP progress"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800/60 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* SOP Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 animate-pulse h-36"
            />
          ))}
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No {filter === "all" ? "active" : filter === "in_progress" ? "in-progress" : "completed"} SOP runbooks found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Open any standard operating procedure article and check off steps to track your execution progress here.
            </p>
          </div>
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
          >
            <span>Explore Knowledge Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sops.map((sop) => {
            const remaining = Math.max(0, sop.total_items - sop.completed_count);
            return (
              <div
                key={sop.id || sop.article_slug}
                className="group relative p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-800/60 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Category Pill and Status Indicator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                      {sop.article_category_name || "Operations"}
                    </span>
                    {sop.is_completed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {remaining} {remaining === 1 ? "step" : "steps"} remaining
                      </span>
                    )}
                  </div>

                  {/* Article Title */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    <Link to={`/articles/${sop.article_slug}?resume=true`}>
                      {sop.article_title || "Standard Operating Procedure"}
                    </Link>
                  </h3>

                  {/* Summary Snippet */}
                  {sop.article_summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sop.article_summary}
                    </p>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Progress</span>
                      <span>
                        {sop.completed_count} / {sop.total_items} ({sop.completion_percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          sop.is_completed
                            ? "bg-emerald-500"
                            : "bg-linear-to-r from-indigo-500 to-purple-600"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, sop.completion_percentage))}%` }}
                      />
                    </div>
                  </div>

                  {/* Resume SOP Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{sop.article_reading_time || 5} min runbook</span>
                    </div>

                    <Link
                      to={`/articles/${sop.article_slug}?resume=true`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        sop.is_completed
                          ? "bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                      }`}
                    >
                      {sop.is_completed ? (
                        <>
                          <span>Review Runbook</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Resume SOP</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
