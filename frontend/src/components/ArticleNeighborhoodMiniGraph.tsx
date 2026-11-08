import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Share2, ExternalLink, Loader2 } from "lucide-react";
import { graphService } from "../services/graphService";
import type { ArticleNeighborhoodResponse } from "../types/graph";

interface ArticleNeighborhoodMiniGraphProps {
  slug: string;
  className?: string;
}

export const ArticleNeighborhoodMiniGraph: React.FC<ArticleNeighborhoodMiniGraphProps> = ({
  slug,
  className = "",
}) => {
  const [data, setData] = useState<ArticleNeighborhoodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const fetchNeighborhood = useCallback(async () => {
    try {
      setLoading(true);
      const res = await graphService.getArticleNeighborhood(slug);
      setData(res);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchNeighborhood();
  }, [fetchNeighborhood]);

  if (loading) {
    return (
      <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Loading citation network...</span>
      </div>
    );
  }

  if (!data || data.total_connections === 0) {
    return (
      <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-500" /> Citation Radar
          </span>
          <Link
            to="/graph"
            className="text-[11px] font-semibold text-indigo-500 hover:underline flex items-center gap-0.5"
          >
            Full Map <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
        <p className="text-[11px] text-slate-400">
          This article is currently an isolated knowledge node with no direct citations yet.
        </p>
      </div>
    );
  }

  const { center_node, neighbors } = data;
  const radius = 70;
  const cx = 100;
  const cy = 100;

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            Citation Neighborhood
          </h4>
          <span className="text-[10px] text-slate-400">
            {data.total_connections} connected articles ({data.outbound_count} out, {data.inbound_count} in)
          </span>
        </div>
        <Link
          to="/graph"
          className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5 transition"
        >
          2D Graph <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Interactive SVG Radar */}
      <div className="relative flex items-center justify-center py-1">
        <svg width="200" height="200" className="overflow-visible select-none">
          <circle cx={cx} cy={cy} r="35" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />

          {/* Connection Lines */}
          {neighbors.map((nb, i) => {
            const angle = (i / neighbors.length) * 2 * Math.PI - Math.PI / 2;
            const nx = cx + Math.cos(angle) * radius;
            const ny = cy + Math.sin(angle) * radius;
            const isHovered = hoveredSlug === nb.slug;

            return (
              <line
                key={`line-${nb.slug}`}
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={isHovered ? "#f59e0b" : "currentColor"}
                strokeWidth={isHovered ? "2.5" : "1.2"}
                className={isHovered ? "transition-all" : "text-slate-200 dark:text-slate-700 transition-colors"}
              />
            );
          })}

          {/* Center Current Node */}
          <g>
            <circle
              cx={cx}
              cy={cy}
              r="16"
              fill={center_node.category_color || "#3b82f6"}
              className="drop-shadow-md animate-pulse"
            />
            <circle cx={cx} cy={cy} r="20" fill="none" stroke={center_node.category_color || "#3b82f6"} strokeWidth="1.5" strokeOpacity="0.4" />
            <text
              x={cx}
              y={cy + 3}
              textAnchor="middle"
              className="fill-white font-bold text-[8px] pointer-events-none"
            >
              Current
            </text>
          </g>

          {/* Radial Neighbor Nodes */}
          {neighbors.map((nb, i) => {
            const angle = (i / neighbors.length) * 2 * Math.PI - Math.PI / 2;
            const nx = cx + Math.cos(angle) * radius;
            const ny = cy + Math.sin(angle) * radius;
            const isHovered = hoveredSlug === nb.slug;

            return (
              <g
                key={`node-${nb.slug}`}
                onMouseEnter={() => setHoveredSlug(nb.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={nx}
                  cy={ny}
                  r={isHovered ? "12" : "9"}
                  fill={nb.category_color || "#6366f1"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "2.5" : "1.5"}
                  className="transition-all duration-150 drop-shadow-xs"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Connected Nodes Quick Links List */}
      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800 max-h-40 overflow-y-auto">
        {neighbors.map((nb) => {
          const isHovered = hoveredSlug === nb.slug;
          return (
            <Link
              key={nb.slug}
              to={`/articles/${nb.slug}`}
              onMouseEnter={() => setHoveredSlug(nb.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] transition-colors ${
                isHovered
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: nb.category_color }}
                />
                <span className="truncate">{nb.title}</span>
              </div>
              <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 font-medium">
                {nb.relationship === "outbound"
                  ? "out"
                  : nb.relationship === "inbound"
                  ? "in"
                  : "tag"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
