import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Link as LinkIcon,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { graphService } from "../services/graphService";
import { KnowledgeGraphViewer } from "../components/KnowledgeGraphViewer";
import type { GraphDataResponse } from "../types/graph";

export const KnowledgeGraphPage: React.FC = () => {
  const [data, setData] = useState<GraphDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await graphService.getKnowledgeGraph();
      setData(res);
    } catch {
      setError("Failed to load knowledge graph network. Please verify connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Knowledge Graph Network
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                Live 2D
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual map of organizational knowledge, interconnected citations, and topic clusters
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={fetchGraph}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Metrics Banner */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Articles (Nodes)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {data.metrics.total_nodes}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Citations (Edges)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {data.metrics.total_edges}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Isolated (Orphans)</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {data.metrics.orphan_count}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Top Knowledge Hub</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate">
              {data.metrics.top_hub ? data.metrics.top_hub.title : "None"}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Graph Viewer */}
      {loading ? (
        <div className="w-full h-[650px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Computing knowledge network simulation...</p>
        </div>
      ) : data ? (
        <KnowledgeGraphViewer data={data} onRefresh={fetchGraph} />
      ) : null}

      {/* Legend & Guide */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">How to navigate:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Left click node to inspect
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Highlight neighborhood
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Orphan articles (0 citations)
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Scroll wheel zooms • Drag background to pan • Drag nodes to reposition
        </div>
      </div>
    </div>
  );
};
