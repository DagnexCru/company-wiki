import React from "react";
import { MessageSquare, Check, User, AlertCircle } from "lucide-react";
import type { ArticleInlineAnnotation } from "../types/annotation";

interface AnnotationSideRailProps {
  annotations: ArticleInlineAnnotation[];
  activeAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onHoverAnnotation: (id: string | null) => void;
}

export const AnnotationSideRail: React.FC<AnnotationSideRailProps> = ({
  annotations,
  activeAnnotationId,
  hoveredAnnotationId,
  onSelectAnnotation,
  onHoverAnnotation,
}) => {
  if (!annotations || annotations.length === 0) return null;

  return (
    <aside
      aria-label="Document Annotations Gutter"
      className="hidden xl:flex flex-col gap-2.5 w-64 shrink-0 pl-4 border-l border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-indigo-500" />
          Annotations ({annotations.length})
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[75vh] pr-1">
        {annotations.map((ann) => {
          const isActive = activeAnnotationId === ann.id;
          const isHovered = hoveredAnnotationId === ann.id;
          const isResolved = ann.status === "resolved";
          const authorName = ann.author?.full_name || ann.author?.username || "Colleague";

          return (
            <div
              key={ann.id}
              onClick={() => onSelectAnnotation(ann.id)}
              onMouseEnter={() => onHoverAnnotation(ann.id)}
              onMouseLeave={() => onHoverAnnotation(null)}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-500"
                  : isHovered
                  ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs"
                  : isResolved
                  ? "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{authorName}</span>
                </span>
                {isResolved ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Check className="w-2.5 h-2.5" /> Resolved
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Open discussion" />
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 border-l-2 border-amber-400 pl-1.5 mb-1 bg-amber-50/40 dark:bg-amber-950/20 rounded-r">
                "{ann.highlighted_text}"
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {ann.content}
              </p>

              {ann.match_confidence !== undefined && ann.match_confidence < 1.0 && (
                <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                  <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                  <span>Fuzzy Match ({Math.round(ann.match_confidence * 100)}%)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
