import React, { useState, useMemo } from "react";
import type { RevisionDiffResult } from "../types/revision";
import {
  parseSplitDiff,
  parseUnifiedDiff,
  type SplitDiffRow,
  type UnifiedDiffRow,
} from "../utils/diffUtils";
import {
  Plus,
  Minus,
  ArrowRight,
  Tag as TagIcon,
  Folder,
  RotateCcw,
  Columns,
  List,
  ArrowLeftRight,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface RevisionDiffViewerProps {
  diff: RevisionDiffResult;
  canRestore?: boolean;
  onRestore?: (revisionNumber: number) => void;
  onSwapRevisions?: (fromRev: number, toRev: number) => void;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({
  diff,
  canRestore = false,
  onRestore,
  onSwapRevisions,
}) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");

  // Aligned rows with word-level token diffs for split view
  const splitRows = useMemo<SplitDiffRow[]>(() => {
    return parseSplitDiff(diff.content_unified_diff);
  }, [diff.content_unified_diff]);

  // Aligned rows with accurate old & new line numbers for unified view
  const unifiedRows = useMemo<UnifiedDiffRow[]>(() => {
    return parseUnifiedDiff(diff.content_unified_diff);
  }, [diff.content_unified_diff]);

  const hasContentDiff = splitRows.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header comparison card with rollback quick-actions and stats */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* From Revision (Source / Previous) */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Rev #{diff.from_revision}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(diff.from_created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            {/* One-Click Restore / Rollback Button */}
            {canRestore && onRestore && (
              <button
                type="button"
                onClick={() => onRestore(diff.from_revision)}
                title={`Restore article to Revision #${diff.from_revision} (creates new roll-forward version)`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-xs shadow-amber-500/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore #{diff.from_revision}</span>
              </button>
            )}
          </div>

          {/* Swap Revisions Control */}
          <button
            type="button"
            onClick={() => onSwapRevisions && onSwapRevisions(diff.to_revision, diff.from_revision)}
            disabled={!onSwapRevisions}
            title="Swap comparison direction"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* To Revision (Target / Newer) */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Rev #{diff.to_revision}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(diff.to_created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            {/* One-Click Restore / Rollback Button */}
            {canRestore && onRestore && (
              <button
                type="button"
                onClick={() => onRestore(diff.to_revision)}
                title={`Restore article to Revision #${diff.to_revision} (creates new roll-forward version)`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-xs shadow-indigo-600/20 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore #{diff.to_revision}</span>
              </button>
            )}
          </div>
        </div>

        {/* Change Stats & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
              <Plus className="w-3.5 h-3.5" />
              {diff.stats.additions} added
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg">
              <Minus className="w-3.5 h-3.5" />
              {diff.stats.deletions} removed
            </span>
          </div>

          {/* Side-by-Side vs Unified Toggle */}
          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === "side-by-side"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === "unified"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Differences: Title, Category, Tags */}
      {(diff.title_changed || diff.category_changed || diff.tags_added.length > 0 || diff.tags_removed.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Diff */}
          {diff.title_changed && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Title Modified</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-start gap-2 p-1.5 rounded bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 line-through">
                  <Minus className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{diff.from_title}</span>
                </div>
                <div className="flex items-start gap-2 p-1.5 rounded bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{diff.to_title}</span>
                </div>
              </div>
            </div>
          )}

          {/* Category Diff */}
          {diff.category_changed && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                <span>Category Changed</span>
              </div>
              <div className="text-xs flex items-center gap-2">
                <span className="text-slate-400 line-through">{diff.from_category || "(None)"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {diff.to_category || "(None)"}
                </span>
              </div>
            </div>
          )}

          {/* Tags Added / Removed */}
          {(diff.tags_added.length > 0 || diff.tags_removed.length > 0) && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:col-span-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tag Changes</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {diff.tags_removed.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 line-through"
                  >
                    <Minus className="w-3 h-3 text-rose-500" />
                    <span>#{t}</span>
                  </span>
                ))}
                {diff.tags_added.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold"
                  >
                    <Plus className="w-3 h-3 text-emerald-500" />
                    <span>#{t}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Diff if changed */}
      {diff.summary_changed && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Summary / Excerpt Difference
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200">
              <p className="font-bold text-[11px] text-rose-600 dark:text-rose-400 mb-1">
                Revision #{diff.from_revision} (Previous)
              </p>
              <p>{diff.from_summary || "(Empty summary)"}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
              <p className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 mb-1">
                Revision #{diff.to_revision} (Updated)
              </p>
              <p>{diff.to_summary || "(Empty summary)"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Line-by-Line Document Content Visual Diff Display */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Diff Toolbar Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Content Line Diff
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
              {viewMode === "side-by-side" ? "Side-by-Side (2 Columns)" : "Unified Line-by-Line (1 Column)"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>+{diff.stats.additions} / -{diff.stats.deletions}</span>
          </div>
        </div>

        {!hasContentDiff ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Identical Document Content
            </p>
            <p className="text-xs text-slate-400">
              No content differences detected between Revision #{diff.from_revision} and Revision #{diff.to_revision}.
            </p>
          </div>
        ) : viewMode === "side-by-side" ? (
          /* SIDE-BY-SIDE SPLIT VIEW */
          <div className="overflow-x-auto max-h-[700px] font-mono text-xs leading-relaxed">
            {/* Split Column Headers */}
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 sticky top-0 z-10">
              <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>Revision #{diff.from_revision} (Original)</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase">
                  Deletions (-)
                </span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span>Revision #{diff.to_revision} (Target)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                  Additions (+)
                </span>
              </div>
            </div>

            {/* Split Rows */}
            <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
              {splitRows.map((row, idx) => {
                if (row.isHeader) {
                  return (
                    <div
                      key={idx}
                      className="px-4 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] border-y border-indigo-100 dark:border-indigo-900/60 select-none"
                    >
                      {row.headerText}
                    </div>
                  );
                }

                // Left column styles (Deletions)
                let leftBg = "bg-transparent";
                if (row.leftType === "removed") {
                  leftBg = "bg-rose-50/90 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-l-2 border-rose-500";
                } else if (row.leftType === "empty") {
                  leftBg = "bg-slate-50/50 dark:bg-slate-900/60 opacity-30 select-none";
                }

                // Right column styles (Additions)
                let rightBg = "bg-transparent";
                if (row.rightType === "added") {
                  rightBg = "bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-l-2 border-emerald-500";
                } else if (row.rightType === "empty") {
                  rightBg = "bg-slate-50/50 dark:bg-slate-900/60 opacity-30 select-none";
                }

                return (
                  <div key={idx} className="grid grid-cols-2 group hover:bg-slate-50/90 dark:hover:bg-slate-800/40">
                    {/* Left Pane (From / Deleted) */}
                    <div className={`flex items-start border-r border-slate-200 dark:border-slate-800 px-2 py-0.5 ${leftBg}`}>
                      <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2">
                        {row.leftLineNum || ""}
                      </span>
                      <span className="w-4 select-none text-center font-bold text-rose-600 shrink-0">
                        {row.leftType === "removed" ? "-" : ""}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {row.leftTokens ? (
                          row.leftTokens.map((token, tIdx) => (
                            <span
                              key={tIdx}
                              className={
                                token.type === "removed"
                                  ? "bg-rose-200/90 dark:bg-rose-800/90 text-rose-950 dark:text-white rounded-xs px-0.5 font-bold"
                                  : undefined
                              }
                            >
                              {token.text}
                            </span>
                          ))
                        ) : (
                          row.leftText || (row.leftType === "empty" ? "" : " ")
                        )}
                      </span>
                    </div>

                    {/* Right Pane (To / Added) */}
                    <div className={`flex items-start px-2 py-0.5 ${rightBg}`}>
                      <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2">
                        {row.rightLineNum || ""}
                      </span>
                      <span className="w-4 select-none text-center font-bold text-emerald-600 shrink-0">
                        {row.rightType === "added" ? "+" : ""}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {row.rightTokens ? (
                          row.rightTokens.map((token, tIdx) => (
                            <span
                              key={tIdx}
                              className={
                                token.type === "added"
                                  ? "bg-emerald-200/90 dark:bg-emerald-800/90 text-emerald-950 dark:text-white rounded-xs px-0.5 font-bold"
                                  : undefined
                              }
                            >
                              {token.text}
                            </span>
                          ))
                        ) : (
                          row.rightText || (row.rightType === "empty" ? "" : " ")
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* UNIFIED LINE-BY-LINE VIEW */
          <div className="overflow-x-auto max-h-[700px] font-mono text-xs leading-relaxed divide-y divide-slate-100/50 dark:divide-slate-800/40">
            {unifiedRows.map((row, idx) => {
              if (row.type === "header") {
                return (
                  <div
                    key={idx}
                    className="px-4 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] select-none"
                  >
                    {row.text}
                  </div>
                );
              }

              let rowClass = "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40";
              let marker = <span className="w-4 select-none">&nbsp;</span>;

              if (row.type === "added") {
                rowClass = "bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border-l-2 border-emerald-500";
                marker = <span className="w-4 text-emerald-600 font-extrabold select-none">+</span>;
              } else if (row.type === "removed") {
                rowClass = "bg-rose-50/90 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-l-2 border-rose-500";
                marker = <span className="w-4 text-rose-600 font-extrabold select-none">-</span>;
              }

              return (
                <div key={idx} className={`flex items-start px-2 py-0.5 ${rowClass}`}>
                  {/* Old Line # */}
                  <span className="w-10 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2">
                    {row.oldLineNum || ""}
                  </span>
                  {/* New Line # */}
                  <span className="w-10 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800">
                    {row.newLineNum || ""}
                  </span>
                  {/* Sign */}
                  <div className="px-2 text-center shrink-0">{marker}</div>
                  {/* Content */}
                  <span className="whitespace-pre-wrap break-all flex-1 font-mono">{row.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionDiffViewer;
