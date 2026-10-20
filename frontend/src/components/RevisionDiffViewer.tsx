import React from "react";
import type { RevisionDiffResult } from "../types/revision";
import { Plus, Minus, ArrowRight, Tag as TagIcon, Folder, AlertCircle } from "lucide-react";

interface RevisionDiffViewerProps {
  diff: RevisionDiffResult;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({ diff }) => {
  // Parse unified diff into display lines
  const rawDiffLines = diff.content_unified_diff ? diff.content_unified_diff.split("\n") : [];

  return (
    <div className="space-y-6">
      {/* Header comparison card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Rev #{diff.from_revision}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(diff.from_created_at).toLocaleDateString()}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              Rev #{diff.to_revision}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(diff.to_created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Change Stats */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
            <Plus className="w-3.5 h-3.5" />
            {diff.stats.additions} lines added
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md">
            <Minus className="w-3.5 h-3.5" />
            {diff.stats.deletions} lines removed
          </span>
        </div>
      </div>

      {/* Metadata Differences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title Diff */}
        {diff.title_changed && (
          <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1.5">
              Title Modified
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 line-through">
                <Minus className="w-3 h-3 shrink-0" />
                <span>{diff.from_title}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                <Plus className="w-3 h-3 shrink-0" />
                <span>{diff.to_title}</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Diff */}
        {diff.category_changed && (
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-500" />
              Category Changed
            </div>
            <div className="text-xs flex items-center gap-2">
              <span className="text-slate-400 line-through">{diff.from_category || "(None)"}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{diff.to_category || "(None)"}</span>
            </div>
          </div>
        )}

        {/* Tags Added / Removed */}
        {(diff.tags_added.length > 0 || diff.tags_removed.length > 0) && (
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:col-span-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
              Tag Changes
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {diff.tags_removed.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 line-through"
                >
                  <Minus className="w-3 h-3" />
                  {t}
                </span>
              ))}
              {diff.tags_added.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Diff if changed */}
      {diff.summary_changed && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Summary / Excerpt Difference
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200">
              <p className="font-semibold text-[11px] text-rose-600 dark:text-rose-400 mb-1">Revision #{diff.from_revision}</p>
              <p>{diff.from_summary || "Empty summary"}</p>
            </div>
            <div className="p-3 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
              <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 mb-1">Revision #{diff.to_revision}</p>
              <p>{diff.to_summary || "Empty summary"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Unified Line Diff */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Document Content Unified Diff
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {rawDiffLines.length} diff lines
          </span>
        </div>

        {rawDiffLines.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No content differences found between these two revisions.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] font-mono text-xs leading-relaxed p-2">
            {rawDiffLines.map((line, idx) => {
              const isAdded = line.startsWith("+") && !line.startsWith("+++");
              const isRemoved = line.startsWith("-") && !line.startsWith("---");
              const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

              let rowClass = "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40";
              let badge = null;

              if (isAdded) {
                rowClass = "bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
                badge = <span className="w-4 text-emerald-600 font-bold select-none">+</span>;
              } else if (isRemoved) {
                rowClass = "bg-rose-50/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
                badge = <span className="w-4 text-rose-600 font-bold select-none">-</span>;
              } else if (isHeader) {
                rowClass = "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold";
              }

              return (
                <div key={idx} className={`flex items-start gap-2 px-2.5 py-0.5 rounded-sm ${rowClass}`}>
                  <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0">
                    {idx + 1}
                  </span>
                  {badge || <span className="w-4 select-none">&nbsp;</span>}
                  <span className="whitespace-pre-wrap break-all flex-1">{line.slice(1) || line}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
