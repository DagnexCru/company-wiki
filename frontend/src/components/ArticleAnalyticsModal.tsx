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
  Heart,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Smile,
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import type {
  ArticleViewsTimelineResponse,
  ArticleSentimentResponse,
} from "../types/analytics";

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
  const [activeTab, setActiveTab] = useState<"views" | "sentiment">("views");

  // Views Timeline State
  const [data, setData] = useState<ArticleViewsTimelineResponse | null>(null);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [loadingViews, setLoadingViews] = useState<boolean>(true);
  const [viewsError, setViewsError] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Sentiment State
  const [sentimentData, setSentimentData] = useState<ArticleSentimentResponse | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState<boolean>(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "helpful" | "unhelpful">("all");

  const fetchViews = useCallback(async () => {
    try {
      setLoadingViews(true);
      setViewsError(null);
      const res = await analyticsService.getViewsTimeline(articleSlug, range);
      setData(res);
    } catch {
      setViewsError("Unable to load views analytics. Please check your network and permissions.");
    } finally {
      setLoadingViews(false);
    }
  }, [articleSlug, range]);

  const fetchSentiment = useCallback(async () => {
    try {
      setLoadingSentiment(true);
      setSentimentError(null);
      const res = await analyticsService.getSentimentAnalytics(articleSlug);
      setSentimentData(res);
    } catch {
      setSentimentError("Unable to load reader sentiment. Please check your network and permissions.");
    } finally {
      setLoadingSentiment(false);
    }
  }, [articleSlug]);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "views") {
        fetchViews();
      } else {
        fetchSentiment();
      }
    }
  }, [isOpen, activeTab, fetchViews, fetchSentiment]);

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

  // Filtered feedback list
  const filteredFeedbacks = useMemo(() => {
    if (!sentimentData) return [];
    if (feedbackFilter === "helpful") {
      return sentimentData.recent_feedbacks.filter((fb) => fb.is_helpful);
    }
    if (feedbackFilter === "unhelpful") {
      return sentimentData.recent_feedbacks.filter((fb) => !fb.is_helpful);
    }
    return sentimentData.recent_feedbacks;
  }, [sentimentData, feedbackFilter]);

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
                  Article Performance & Engagement Hub
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={activeTab === "views" ? fetchViews : fetchSentiment}
              disabled={loadingViews || loadingSentiment}
              title="Refresh metrics"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingViews || loadingSentiment ? "animate-spin" : ""}`}
              />
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

        {/* Primary Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("views")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "views"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Traffic & Views Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sentiment")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "sentiment"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Reader Sentiment & Feedback</span>
            </button>
          </div>

          {/* Range buttons only visible on views tab */}
          {activeTab === "views" && (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRange("7d")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  range === "7d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => setRange("30d")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  range === "30d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                30d
              </button>
              <button
                type="button"
                onClick={() => setRange("90d")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  range === "90d"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                90d
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: TRAFFIC & VIEWS TIMELINE */}
        {activeTab === "views" && (
          <>
            {loadingViews ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Aggregating time-series reading metrics...</p>
              </div>
            ) : viewsError || !data ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-600">{viewsError || "No data available."}</p>
                <button
                  type="button"
                  onClick={fetchViews}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* 4 Summary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                  <div className="space-y-4">
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
                              {isHovered && (
                                <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-100">
                                  {point.total_views} views • {point.unique_readers} readers
                                </div>
                              )}

                              <div
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  isHovered
                                    ? "bg-gradient-to-t from-indigo-600 to-purple-500 shadow-md scale-105"
                                    : "bg-gradient-to-t from-indigo-500/80 to-indigo-400/80 hover:from-indigo-600 hover:to-indigo-500"
                                }`}
                                style={{ height: `${heightPercent}%` }}
                              />

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
          </>
        )}

        {/* TAB 2: READER SENTIMENT & FEEDBACK DEEP-DIVE */}
        {activeTab === "sentiment" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {loadingSentiment ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Analyzing reader sentiment and feedback ratings...</p>
              </div>
            ) : sentimentError || !sentimentData ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-600">{sentimentError || "No sentiment data."}</p>
                <button
                  type="button"
                  onClick={fetchSentiment}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* 1. Quality Health Indicator Banner */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
                    sentimentData.summary.health_status === "HEALTHY"
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : sentimentData.summary.health_status === "MODERATE"
                      ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                      : sentimentData.summary.health_status === "NEEDS_REVIEW"
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {sentimentData.summary.health_status === "HEALTHY" && (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {sentimentData.summary.health_status === "MODERATE" && (
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                    {sentimentData.summary.health_status === "NEEDS_REVIEW" && (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                    {sentimentData.summary.health_status === "NO_DATA" && (
                      <HelpCircle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">
                        {sentimentData.summary.health_label}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40 border border-current">
                        {sentimentData.summary.helpfulness_score}% Satisfaction
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed">
                      {sentimentData.summary.health_description}
                    </p>
                  </div>
                </div>

                {/* 2. Donut Sentiment Chart & Ratio Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column: Metric Tiles */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Helpfulness Score
                      </span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        {sentimentData.summary.helpfulness_score}%
                        <Smile className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {sentimentData.summary.helpful_count} helpful of {sentimentData.summary.total_feedback_count} ratings
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Reader Feedback Rate
                      </span>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {sentimentData.summary.feedback_rate_percentage}%
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Percentage of viewers leaving verified ratings
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Interactive SVG Donut Chart */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background track circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="currentColor"
                          strokeWidth="14"
                          className="text-slate-200 dark:text-slate-700"
                          fill="none"
                        />
                        {/* Unhelpful arc (Rose) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="currentColor"
                          strokeWidth="14"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={0}
                          className="text-rose-500"
                          fill="none"
                        />
                        {/* Helpful arc (Emerald) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="48"
                          stroke="currentColor"
                          strokeWidth="14"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={
                            2 * Math.PI * 48 * (1 - sentimentData.summary.helpfulness_score / 100)
                          }
                          className="text-emerald-500 transition-all duration-700 ease-out"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      {/* Center Score */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {sentimentData.summary.helpfulness_score}%
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          Helpful
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          👍 {sentimentData.summary.helpful_count}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          👎 {sentimentData.summary.unhelpful_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Classified Feedback Themes */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Sentiment Classifications
                    </span>
                    {sentimentData.categories_breakdown.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-6 text-center">
                        No sentiment themes logged yet.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {sentimentData.categories_breakdown.map((cat) => (
                          <div key={cat.category} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                {cat.category}
                              </span>
                              <span
                                className={`font-bold ${
                                  cat.sentiment === "positive"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {cat.count} ({cat.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  cat.sentiment === "positive" ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Reader Feedback Feed */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Reader Feedback Feed ({filteredFeedbacks.length})
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter("all")}
                        className={`px-2.5 py-1 rounded-lg transition font-medium ${
                          feedbackFilter === "all"
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        All ({sentimentData.summary.total_feedback_count})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter("helpful")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium ${
                          feedbackFilter === "helpful"
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful ({sentimentData.summary.helpful_count})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter("unhelpful")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition font-medium ${
                          feedbackFilter === "unhelpful"
                            ? "bg-rose-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>Needs Work ({sentimentData.summary.unhelpful_count})</span>
                      </button>
                    </div>
                  </div>

                  {filteredFeedbacks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 italic">
                      No feedback entries matching this filter.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {filteredFeedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {fb.user_initial}
                              </div>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {fb.user_name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium uppercase">
                                {fb.user_role}
                              </span>
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                • {new Date(fb.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  fb.is_helpful
                                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                                    : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {fb.is_helpful ? (
                                  <>
                                    <ThumbsUp className="w-2.5 h-2.5" /> Helpful
                                  </>
                                ) : (
                                  <>
                                    <ThumbsDown className="w-2.5 h-2.5" /> Needs Work
                                  </>
                                )}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                {fb.sentiment_tag}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                            "{fb.note}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
