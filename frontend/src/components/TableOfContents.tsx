import React, { useState } from "react";
import { ListTree, ChevronDown, ChevronUp, Hash, BookOpen } from "lucide-react";
import type { MarkdownHeading } from "../utils/headingUtils";

interface TableOfContentsProps {
  headings: MarkdownHeading[];
  activeId: string;
  readingProgress: number;
  onSelectHeading?: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  activeId,
  readingProgress,
  onSelectHeading,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  if (!headings || headings.length === 0) {
    return null;
  }

  const handleHeadingClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onSelectHeading) {
      onSelectHeading(id);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
    }
    setMobileExpanded(false);
  };

  return (
    <>
      {/* MOBILE ACCORDION (Visible on screens < lg) */}
      <div className="lg:hidden w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-sm no-print mb-6">
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition"
          aria-expanded={mobileExpanded}
        >
          <div className="flex items-center gap-2">
            <ListTree className="w-4 h-4 text-indigo-400" />
            <span>On This Page ({headings.length} sections)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono">
              {Math.round(readingProgress)}% read
            </span>
          </div>
          {mobileExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {mobileExpanded && (
          <nav className="mt-3 pt-3 border-t border-slate-800 space-y-1 max-h-60 overflow-y-auto">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => handleHeadingClick(e, h.id)}
                  className={`block text-xs py-1.5 px-2 rounded-lg transition-colors truncate ${
                    h.level === 3 ? "pl-5 text-[11px]" : "pl-2"
                  } ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {h.text}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      {/* DESKTOP STICKY SIDEBAR (Visible on lg and larger) */}
      <div className="hidden lg:block w-64 shrink-0 no-print">
        <div className="sticky top-24 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListTree className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Table of Contents
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              {Math.round(readingProgress)}%
            </span>
          </div>

          {/* Reading progress mini bar */}
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-indigo-400 h-full transition-all duration-150"
              style={{ width: `${readingProgress}%` }}
            />
          </div>

          <nav className="space-y-0.5 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1 text-xs">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => handleHeadingClick(e, h.id)}
                  title={h.text}
                  className={`group flex items-start gap-1.5 py-1.5 px-2 rounded-lg transition-all duration-150 leading-snug ${
                    h.level === 3 ? "pl-5 text-[11px]" : "pl-2 font-medium"
                  } ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-400 shadow-2xs font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Hash className={`w-3 h-3 shrink-0 mt-0.5 ${isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`} />
                  <span className="truncate">{h.text}</span>
                </a>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>Scroll or click to jump</span>
          </div>
        </div>
      </div>
    </>
  );
};
