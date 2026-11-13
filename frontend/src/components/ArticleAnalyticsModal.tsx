import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Flame,
  BarChart2,
  Calendar,
  Table as TableIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import type { ArticleViewsTimelineResponse } from "../types/analytics";

interface ArticleAnalyticsModalProps {
  isOpen: boolean;
  articleSlug: string;
  articleTitle: string;
  onClose: () => void;
}

export const ArticleAnalyticsModal: React.FC<ArticleAnalyticsModalProps> = ({
  isOpen,
  articleSlug,
  articleTitle,
  onClose,
}) => {
  const [data, setData] = useState<ArticleViewsTimelineResponse | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getViewsTimeline(articleSlug, range);
      setData(res);
    } catch {
      setError("Unable to load analytics. Please check your network and permissions.");
    } finally {
      setLoading(false);
    }
  }, [articleSlug, range]);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, fetchAnalytics]);

  const maxViews = useMemo(() => {
    if (!data || data.timeline.length === 0) return 1;
    const max = Math.max(...data.timeline.map((d) => d.total_views));
    return max > 0 ? max : 1;
  }, [data]);

  const activeHoverPoint = useMemo(() => {
    if (hoveredPointIndex === null || !data || !data.timeline[hoveredPointIndex]) {
      return data && data.timeline.length > 0 ? data.timeline[data.timeline.length - 1] : null;
    }
    return data.timeline[hoveredPointIndex];
  }, [hoveredPointIndex, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Article Performance & Views Analytics
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Deep Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {articleTitle}
              </p>
            </div>
          </div>

          {/* Range Selector & Close */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRange("7d")}
                className={`px-3 py-1 rounded-lg transition ${
                  range === "7d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRange("30d")}
                className={`px-3 py-1 rounded-lg transition ${
                  range === "30d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setRange("90d")}
                className={`px-3 py-1 rounded-lg transition ${
                  range === "90d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                90 Days
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh metrics"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Aggregating time-series reading metrics...</p>
          </div>
        ) : error || !data ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-600">{error || "No data available."}</p>
            <button
              type="button"
              onClick={fetchAnalytics}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Tile 1: Total Period Views */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Period Views</span>
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {data.summary.period_total_views.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  All-time: <strong className="text-slate-700 dark:text-slate-300">{data.summary.all_time_views}</strong>
                </div>
              </div>

              {/* Tile 2: Unique Readers */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Unique Readers</span>
                  <Users className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {data.summary.unique_readers.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  ~{data.summary.average_daily_views} avg/day
                </div>
              </div>

              {/* Tile 3: Peak Day Traffic */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Peak Day</span>
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {data.summary.peak_day_views.toLocaleString()} <span className="text-xs font-semibold text-slate-500">views</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {data.summary.peak_day_date || "N/A"}
                </div>
              </div>

              {/* Tile 4: Period Growth Rate */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Trend Growth</span>
                  {data.summary.growth_rate_percentage >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      data.summary.growth_rate_percentage >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {data.summary.growth_rate_percentage >= 0 ? "+" : ""}
                    {data.summary.growth_rate_percentage}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  vs prev {data.days_count} days
                </div>
              </div>
            </div>

            {/* View Mode Toggle: Interactive Chart vs Tabular List */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Daily Traffic Timeline ({data.days_count} Days)</span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("chart")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                    viewMode === "chart"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {viewMode === "chart" ? (
              /* Interactive Bar & Trend Graph */
              <div className="space-y-4">
                {/* Active Hover Point Insight Banner */}
                {activeHoverPoint && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeHoverPoint.day_name}, {activeHoverPoint.label} ({activeHoverPoint.date})
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 dark:text-slate-400">
                        Total Views:{" "}
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          {activeHoverPoint.total_views}
                        </strong>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        Unique Readers:{" "}
                        <strong className="text-teal-600 dark:text-teal-400">
                          {activeHoverPoint.unique_readers}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* The Chart Canvas */}
                <div className="p-4 sm:p-6 rounded-2xl bg-linear-to-b from-slate-50/50 to-white dark:from-slate-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="h-56 flex items-end gap-1 sm:gap-2 pt-6 pb-2">
                    {data.timeline.map((point, idx) => {
                      const heightPercent = Math.max(6, Math.round((point.total_views / maxViews) * 100));
                      const isHovered = hoveredPointIndex === idx;
                      return (
                        <div
                          key={point.date}
                          onMouseEnter={() => setHoveredPointIndex(idx)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        >
                          {/* Tooltip on bar hover */}
                          {isHovered && (
                            <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-100">
                              {point.total_views} views • {point.unique_readers} readers
                            </div>
                          )}

                          {/* Bar Graphic */}
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              isHovered
                                ? "bg-gradient-to-t from-indigo-600 to-purple-500 shadow-md scale-105"
                                : "bg-gradient-to-t from-indigo-500/80 to-indigo-400/80 hover:from-indigo-600 hover:to-indigo-500"
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />

                          {/* X-axis date label */}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 truncate max-w-full hidden sm:block">
                            {range === "7d"
                              ? point.day_name
                              : idx % (range === "90d" ? 14 : 5) === 0
                              ? point.label
                              : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{data.timeline[0]?.date}</span>
                    <span className="text-center font-medium text-slate-500">
                      Hover over any bar to view daily metrics breakdown
                    </span>
                    <span>{data.timeline[data.timeline.length - 1]?.date}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Tabular View */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Total Views</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Unique Readers</th>
                      <th className="py-2.5 px-4 font-semibold">Share of Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...data.timeline].reverse().map((row) => {
                      const sharePercent =
                        data.summary.period_total_views > 0
                          ? Math.round((row.total_views / data.summary.period_total_views) * 100)
                          : 0;
                      return (
                        <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-4 font-medium text-slate-900 dark:text-slate-200">
                            {row.day_name}, {row.label} ({row.date})
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {row.total_views}
                          </td>
                          <td className="py-2 px-4 text-right text-teal-600 dark:text-teal-400 font-semibold">
                            {row.unique_readers}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(100, sharePercent * 3)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500">{sharePercent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

