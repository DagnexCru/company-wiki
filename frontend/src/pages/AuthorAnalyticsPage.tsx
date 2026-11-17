import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Eye,
  ThumbsUp,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Search,
  RefreshCw,
  ExternalLink,
  Flame,
  Star,
  FileText,
  AlertCircle,
  Download,
} from "lucide-react";
import { analyticsService } from "../services/analyticsService";
import { ArticleAnalyticsModal } from "../components/ArticleAnalyticsModal";
import type { AuthorAnalyticsOverviewResponse } from "../types/analytics";

export const AuthorAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AuthorAnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"views" | "rating" | "reading_time" | "recent">("views");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportPortfolio = async () => {
    try {
      setIsExporting(true);
      await analyticsService.exportAuthorPortfolio(data?.author?.id);
    } catch (err) {
      console.error("Export portfolio failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Modal inspection state for a specific article
  const [selectedArticle, setSelectedArticle] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getAuthorOverview(sortBy);
      setData(res);
    } catch {
      setError("Unable to load author analytics overview. Please check network and permissions.");
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Filter articles based on client-side search input
  const filteredArticles = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.top_articles;
    const q = searchQuery.toLowerCase();
    return data.top_articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category_name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const maxViews = useMemo(() => {
    if (!data || data.top_articles.length === 0) return 1;
    return Math.max(...data.top_articles.map((a) => a.view_count), 1);
  }, [data]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Performance Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Author Analytics & Portfolio Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your readership impact, feedback scores, and performance rankings across all your authored articles.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {data?.author && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                {data.author.full_name[0]?.toUpperCase() || data.author.username[0]?.toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {data.author.full_name || data.author.username}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {data.author.role}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportPortfolio}
            disabled={isExporting || !data || data.top_articles.length === 0}
            title="Export Author Portfolio as CSV (Excel)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce text-emerald-500" : "text-emerald-600 dark:text-emerald-400"}`} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            title="Refresh analytics"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Aggregating author portfolio impact metrics...
          </p>
        </div>
      ) : error || !data ? (
        <div className="p-8 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
            {error || "Unable to display analytics."}
          </h3>
          <button
            type="button"
            onClick={handleExportPortfolio}
            disabled={isExporting || !data || data.top_articles.length === 0}
            title="Export Author Portfolio as CSV (Excel)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce text-emerald-500" : "text-emerald-600 dark:text-emerald-400"}`} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchOverview}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Portfolio Views */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Total Views</span>
                <Eye className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.summary.total_portfolio_views.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Unique: <strong className="text-slate-700 dark:text-slate-300">{data.summary.total_unique_readers.toLocaleString()}</strong></span>
                {data.summary.views_last_7_days > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                    +{data.summary.views_last_7_days} 7d
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Helpfulness Rating */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Helpful Score</span>
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.summary.average_helpfulness_score}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                👍 <strong className="text-emerald-700 dark:text-emerald-300">{data.summary.total_helpful_votes}</strong> · 👎 <strong className="text-slate-500">{data.summary.total_unhelpful_votes}</strong>
              </div>
            </div>

            {/* Card 3: Total Reading Hours */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Reading Time</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.summary.total_reading_hours} <span className="text-sm font-semibold text-slate-500">hrs</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                ~{data.summary.avg_reading_formatted} avg per reader
              </div>
            </div>

            {/* Card 4: Knowledge Articles */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-100 dark:border-purple-900/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Articles</span>
                <BookOpen className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {data.summary.total_articles}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {data.summary.published_articles} Published · {data.summary.in_review_articles} Review
              </div>
            </div>
          </div>

          {/* Top Domain Badge & Search / Sorting Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            {/* Sorting Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSortBy("views")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === "views"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Most Viewed</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("rating")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === "rating"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Highest Rated</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("reading_time")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === "reading_time"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reading Time</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("recent")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  sortBy === "recent"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Recently Updated</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter your articles..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Top Performing Articles Leaderboard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredArticles.length} of {data.top_articles.length} authored guides
                </p>
              </div>

              {data.summary.top_performing_category !== "None" && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Top Domain: <strong>{data.summary.top_performing_category}</strong>
                </span>
              )}
            </div>

            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {searchQuery ? "No matching articles found." : "No authored articles yet."}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms or clearing the filter."
                    : "Draft and publish your first guide to start analyzing reader engagement."}
                </p>
                {!searchQuery && (
                  <Link
                    to="/articles/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    Create New Article
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-4">Article Title</th>
                      <th className="py-3 px-4 w-28 text-right">Views</th>
                      <th className="py-3 px-4 w-28 text-center">Helpful</th>
                      <th className="py-3 px-4 w-32 text-center">Avg Read Time</th>
                      <th className="py-3 px-4 w-28 text-center">Completion</th>
                      <th className="py-3 px-4 w-36 text-center">Deep Analytics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredArticles.map((art) => {
                      const rankBadge =
                        art.rank === 1 ? "🥇" : art.rank === 2 ? "🥈" : art.rank === 3 ? "🥉" : `#${art.rank}`;
                      const viewPercentage = Math.round((art.view_count / maxViews) * 100);

                      return (
                        <tr
                          key={art.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center font-bold text-xs text-slate-600 dark:text-slate-400">
                            {rankBadge}
                          </td>

                          {/* Article Title & Badges */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <Link
                                to={`/articles/${art.slug}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5"
                              >
                                <span>{art.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                              </Link>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                                  {art.category_name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    art.status === "PUBLISHED"
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                      : art.status === "IN_REVIEW"
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                  }`}
                                >
                                  {art.status}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Views */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {art.view_count.toLocaleString()}
                              </span>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.max(viewPercentage, 3)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Helpful Rating */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`font-bold text-xs ${
                                  art.helpfulness_score >= 80
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : art.helpfulness_score >= 60
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-500"
                                }`}
                              >
                                {art.helpfulness_score}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {art.helpful_count} 👍 / {art.unhelpful_count} 👎
                              </span>
                            </div>
                          </td>

                          {/* Avg Read Time */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {art.avg_reading_formatted}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {art.reading_sessions_count} sessions
                              </span>
                            </div>
                          </td>

                          {/* Completion Rate */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {art.completion_rate_percentage}%
                            </span>
                          </td>

                          {/* Deep Analytics Action */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedArticle({
                                  slug: art.slug,
                                  title: art.title,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition cursor-pointer shadow-2xs"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>Analytics</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Embedded Single Article Analytics Deep-Dive Modal */}
      {selectedArticle && (
        <ArticleAnalyticsModal
          isOpen={Boolean(selectedArticle)}
          articleSlug={selectedArticle.slug}
          articleTitle={selectedArticle.title}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
};
