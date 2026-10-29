import React, { useState, useMemo } from "react";
import type { RevisionDiffResult } from "../types/revision";
import {
  Plus,
  Minus,
  ArrowRight,
  Tag as TagIcon,
  Folder,
  AlertCircle,
  RotateCcw,
  Columns,
  List,
} from "lucide-react";

interface RevisionDiffViewerProps {
  diff: RevisionDiffResult;
  canRestore?: boolean;
  onRestore?: (revisionNumber: number) => void;
}

interface SplitDiffRow {
  leftLineNum?: number;
  leftText?: string;
  leftType?: "removed" | "context" | "empty";
  rightLineNum?: number;
  rightText?: string;
  rightType?: "added" | "context" | "empty";
  isHeader?: boolean;
  headerText?: string;
}

export const RevisionDiffViewer: React.FC<RevisionDiffViewerProps> = ({
  diff,
  canRestore = false,
  onRestore,
}) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");

  // Parse unified diff into raw lines
  const rawDiffLines = useMemo(() => {
    return diff.content_unified_diff ? diff.content_unified_diff.split("\n") : [];
  }, [diff.content_unified_diff]);

  // Compute side-by-side paired rows
  const splitRows = useMemo<SplitDiffRow[]>(() => {
    if (!rawDiffLines.length) return [];

    const rows: SplitDiffRow[] = [];
    let leftLine = 0;
    let rightLine = 0;

    let pendingLeft: { lineNum: number; text: string }[] = [];
    let pendingRight: { lineNum: number; text: string }[] = [];

    const flushPending = () => {
      const maxLen = Math.max(pendingLeft.length, pendingRight.length);
      for (let i = 0; i < maxLen; i++) {
        const leftItem = pendingLeft[i];
        const rightItem = pendingRight[i];
        rows.push({
          leftLineNum: leftItem ? leftItem.lineNum : undefined,
          leftText: leftItem ? leftItem.text : undefined,
          leftType: leftItem ? "removed" : "empty",
          rightLineNum: rightItem ? rightItem.lineNum : undefined,
          rightText: rightItem ? rightItem.text : undefined,
          rightType: rightItem ? "added" : "empty",
        });
      }
      pendingLeft = [];
      pendingRight = [];
    };

    for (let i = 0; i < rawDiffLines.length; i++) {
      const line = rawDiffLines[i];

      // File header lines
      if (line.startsWith("---") || line.startsWith("+++")) {
        continue;
      }

      // Hunk header: @@ -from,count +to,count @@
      if (line.startsWith("@@")) {
        flushPending();
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          leftLine = parseInt(match[1], 10) - 1;
          rightLine = parseInt(match[2], 10) - 1;
        }
        rows.push({
          isHeader: true,
          headerText: line,
        });
        continue;
      }

      if (line.startsWith("-")) {
        leftLine++;
        pendingLeft.push({ lineNum: leftLine, text: line.slice(1) });
      } else if (line.startsWith("+")) {
        rightLine++;
        pendingRight.push({ lineNum: rightLine, text: line.slice(1) });
      } else {
        flushPending();
        leftLine++;
        rightLine++;
        const content = line.startsWith(" ") ? line.slice(1) : line;
        rows.push({
          leftLineNum: leftLine,
          leftText: content,
          leftType: "context",
          rightLineNum: rightLine,
          rightText: content,
          rightType: "context",
        });
      }
    }

    flushPending();
    return rows;
  }, [rawDiffLines]);

  return (
    <div className="space-y-6">
      {/* Header comparison card with rollback quick-actions */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* From Revision */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Rev #{diff.from_revision}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(diff.from_created_at).toLocaleDateString()}
            </span>
            {canRestore && onRestore && (
              <button
                type="button"
                onClick={() => onRestore(diff.from_revision)}
                title={`Restore Revision #${diff.from_revision}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore #{diff.from_revision}</span>
              </button>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400" />

          {/* To Revision */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
              Rev #{diff.to_revision}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(diff.to_created_at).toLocaleDateString()}
            </span>
            {canRestore && onRestore && (
              <button
                type="button"
                onClick={() => onRestore(diff.to_revision)}
                title={`Restore Revision #${diff.to_revision}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore #{diff.to_revision}</span>
              </button>
            )}
          </div>
        </div>

        {/* Change Stats & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
              <Plus className="w-3.5 h-3.5" />
              {diff.stats.additions} added
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-md">
              <Minus className="w-3.5 h-3.5" />
              {diff.stats.deletions} removed
            </span>
          </div>

          {/* Side-by-Side vs Unified Toggle */}
          <div className="inline-flex p-0.5 bg-slate-200/80 dark:bg-slate-700 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("side-by-side")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === "side-by-side"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === "unified"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Unified View</span>
            </button>
          </div>
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
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {diff.to_category || "(None)"}
              </span>
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
              <p className="font-semibold text-[11px] text-rose-600 dark:text-rose-400 mb-1">
                Revision #{diff.from_revision}
              </p>
              <p>{diff.from_summary || "Empty summary"}</p>
            </div>
            <div className="p-3 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
              <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 mb-1">
                Revision #{diff.to_revision}
              </p>
              <p>{diff.to_summary || "Empty summary"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Document Content Visual Diff Display */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Diff Toolbar Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Document Content Diff
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
              {viewMode === "side-by-side" ? "Split View (2 Columns)" : "Unified View (1 Column)"}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {rawDiffLines.length} diff lines
          </span>
        </div>

        {rawDiffLines.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No content differences found between these two revisions.
          </div>
        ) : viewMode === "side-by-side" ? (
          /* SIDE-BY-SIDE SPLIT VIEW */
          <div className="overflow-x-auto max-h-[650px] font-mono text-xs leading-relaxed">
            {/* Split Column Headers */}
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 sticky top-0 z-10">
              <div className="px-4 py-1.5 border-r border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span>Revision #{diff.from_revision} (Original)</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Deletions (-)</span>
              </div>
              <div className="px-4 py-1.5 flex items-center justify-between">
                <span>Revision #{diff.to_revision} (Target)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Additions (+)</span>
              </div>
            </div>

            {/* Split Rows */}
            <div className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {splitRows.map((row, idx) => {
                if (row.isHeader) {
                  return (
                    <div
                      key={idx}
                      className="px-4 py-1 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px] border-y border-indigo-100 dark:border-indigo-900/60"
                    >
                      {row.headerText}
                    </div>
                  );
                }

                // Left column styles
                let leftBg = "bg-transparent";
                if (row.leftType === "removed") {
                  leftBg = "bg-rose-50/80 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300";
                } else if (row.leftType === "empty") {
                  leftBg = "bg-slate-50/40 dark:bg-slate-900/40 opacity-30 select-none";
                }

                // Right column styles
                let rightBg = "bg-transparent";
                if (row.rightType === "added") {
                  rightBg = "bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300";
                } else if (row.rightType === "empty") {
                  rightBg = "bg-slate-50/40 dark:bg-slate-900/40 opacity-30 select-none";
                }

                return (
                  <div key={idx} className="grid grid-cols-2 group hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                    {/* Left Pane (From) */}
                    <div className={`flex items-start border-r border-slate-200 dark:border-slate-800 px-2 py-0.5 ${leftBg}`}>
                      <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2">
                        {row.leftLineNum || ""}
                      </span>
                      <span className="w-4 select-none text-center font-bold text-rose-600 shrink-0">
                        {row.leftType === "removed" ? "-" : ""}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {row.leftText || (row.leftType === "empty" ? "" : " ")}
                      </span>
                    </div>

                    {/* Right Pane (To) */}
                    <div className={`flex items-start px-2 py-0.5 ${rightBg}`}>
                      <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0 pr-2">
                        {row.rightLineNum || ""}
                      </span>
                      <span className="w-4 select-none text-center font-bold text-emerald-600 shrink-0">
                        {row.rightType === "added" ? "+" : ""}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1 font-mono">
                        {row.rightText || (row.rightType === "empty" ? "" : " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* UNIFIED LINE DIFF VIEW */
          <div className="overflow-x-auto max-h-[650px] font-mono text-xs leading-relaxed p-2">
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
