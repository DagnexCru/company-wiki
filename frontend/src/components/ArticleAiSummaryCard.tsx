import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AiSummaryResponse } from "../types/ai";
import { aiService } from "../services/aiService";

interface ArticleAiSummaryCardProps {
  articleSlug: string;
  articleTitle: string;
  estimatedReadTime: number;
}

export const ArticleAiSummaryCard: React.FC<ArticleAiSummaryCardProps> = ({
  articleSlug,
  articleTitle,
  estimatedReadTime,
}) => {
  const [summaryData, setSummaryData] = useState<AiSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleGenerateSummary = async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.generateArticleSummary(articleSlug, { force });
      setSummaryData(data);
      setIsExpanded(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate AI summary.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryData) return;
    const textToCopy = `TL;DR: ${summaryData.tldr}\n\nKey Takeaways:\n${summaryData.key_takeaways.map((k) => `• ${k}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summaryData && !loading && !error) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-brand-50/70 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-brand-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Instant AI Summary</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                TL;DR
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Get key takeaways for &ldquo;{articleTitle}&rdquo; (saves ~{Math.max(1, estimatedReadTime - 1)} mins reading)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleGenerateSummary(false)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate TL;DR</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white dark:from-slate-900 dark:to-slate-900/90 border border-indigo-200 dark:border-indigo-900/60 shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 flex items-center justify-between border-b border-indigo-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                AI Executive Summary & Key Takeaways
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Neural TL;DR
              </span>
            </div>
            {summaryData && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Clock className="w-3 h-3" />
                  Saves ~{summaryData.time_saved_minutes} min read
                </span>
                <span>&bull;</span>
                <span>{summaryData.key_takeaways.length} key takeaways identified</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {summaryData && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Copy Summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSummary(true)}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                title="Regenerate"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-6 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synthesizing executive summary and distilling guidelines...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 text-xs text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleGenerateSummary(true)}
            className="font-semibold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {summaryData && !loading && isExpanded && (
        <div className="p-5 space-y-4">
          {/* Executive Overview */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Executive Overview
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans bg-white/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-indigo-100/70 dark:border-slate-800">
              {summaryData.tldr}
            </p>
          </div>

          {/* Key Takeaways */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Key Takeaways & Requirements
            </span>
            <ul className="space-y-2">
              {summaryData.key_takeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
export default ArticleAiSummaryCard;
