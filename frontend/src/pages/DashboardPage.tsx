import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardService } from "../services/dashboardService";
import type { DashboardData } from "../types/dashboard";
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle,
  BookOpen,
  Plus,
  ArrowRight,
  Clock,
  FileText,
  CheckSquare,
  AlertCircle,
  Users,
  Activity,
  Folder,
  Edit3,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDashboardData();
      setData(response);
    } catch {
      setError("Unable to load live dashboard telemetry. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const getRolePermissions = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return [
          { text: "Manage all organization users and roles", allowed: true },
          { text: "Create, edit, and publish knowledge articles", allowed: true },
          { text: "Approve or reject submitted articles", allowed: true },
          { text: "Manage categories and tag taxonomy", allowed: true },
          { text: "View complete system audit history", allowed: true },
        ];
      case "AUTHOR":
        return [
          { text: "Create and edit own article drafts", allowed: true },
          { text: "Submit drafts for editorial review", allowed: true },
          { text: "Revise rejected articles with reviewer feedback", allowed: true },
          { text: "Read all published company documentation", allowed: true },
          { text: "Approve or publish articles directly", allowed: false },
        ];
      case "REVIEWER":
        return [
          { text: "Inspect complete submitted articles in review queue", allowed: true },
          { text: "Approve articles to publish to organization", allowed: true },
          { text: "Reject articles with mandatory feedback", allowed: true },
          { text: "Read all published company documentation", allowed: true },
          { text: "Manage global user roles or categories", allowed: false },
        ];
      case "READER":
      default:
        return [
          { text: "Search and filter all published articles", allowed: true },
          { text: "Browse category hierarchies and tags", allowed: true },
          { text: "View article revision history", allowed: true },
          { text: "Create or submit new articles", allowed: false },
          { text: "Access unpublished drafts or review queue", allowed: false },
        ];
    }
  };

  const permissions = getRolePermissions(user?.role);
  const canCreate = user?.role === "ADMIN" || user?.role === "AUTHOR";
  const canReview = user?.role === "ADMIN" || user?.role === "REVIEWER";
  const isAdmin = user?.role === "ADMIN";
  const featuredArticles = (data?.recent_published_articles || []).filter((art) => art.is_featured);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Aware Workspace • Operational</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            You are securely authenticated as an internal{" "}
            <span className="font-semibold text-white underline decoration-brand-400">
              {user?.role}
            </span>
            . Discover published knowledge, track ongoing reviews, or monitor company-wide metrics in real time.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Browse Knowledge Base
            </Link>

            {canCreate && (
              <Link
                to="/articles/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95 border border-indigo-500"
              >
                <Plus className="w-4 h-4" />
                Write New Article
              </Link>
            )}

            {canReview && (
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-all shadow-md active:scale-95 border border-purple-500"
              >
                <CheckSquare className="w-4 h-4" />
                Editorial Queue
              </Link>
            )}
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Accessible Published Documentation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Published Knowledge
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {loading ? "..." : data?.total_published_articles ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> Live & searchable
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Author Workload (Drafts / Pending Review) */}
        {data?.author_metrics && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                My Drafts & WIP
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : data.author_metrics.my_drafts_count}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                <Edit3 className="w-3 h-3" /> {data.author_metrics.my_in_review_count} in review
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Metric 3: Review Queue (Reviewers & Admins) */}
        {data?.reviewer_metrics && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Awaiting Editorial Review
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : data.reviewer_metrics.pending_reviews_count}
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Queue pending
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Metric 4: System Administration Telemetry (Admins only) */}
        {data?.admin_metrics && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Active Organization Users
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : data.admin_metrics.total_users_count}
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" /> Across {data.admin_metrics.total_categories_count} departments
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Reader Alternative Metric: Knowledge Categories */}
        {!data?.author_metrics && !data?.reviewer_metrics && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Knowledge Topics
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {loading ? "..." : data?.category_distribution.length ?? 0}
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-1">
                <Folder className="w-3 h-3" /> Categorized documentation
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Admin Specific Organization Status Breakdown */}
      {data?.admin_metrics && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Organization Content Lifecycle Overview
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Total Managed: {data.admin_metrics.total_articles} Articles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 block">Published</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {data.admin_metrics.published_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 block">Drafts</span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {data.admin_metrics.draft_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 block">In Review</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {data.admin_metrics.in_review_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 block">Rejected</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {data.admin_metrics.rejected_count}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 block">Archived</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {data.admin_metrics.archived_count}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Section: Articles Awaiting Review */}
      {canReview && data?.pending_review_articles && data.pending_review_articles.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Editorial Review Queue
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                {data.reviewer_metrics?.pending_reviews_count ?? data.pending_review_articles.length} Pending
              </span>
            </div>
            <Link
              to="/reviews"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              Open Full Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.pending_review_articles.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase">
                      In Review
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      By {art.author.full_name || art.author.username}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {art.summary || "Click to inspect article details and editorial feedback..."}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Category: {art.category?.name || "General"}
                  </span>
                  <Link
                    to={`/reviews/${art.slug}`}
                    className="font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    Inspect & Decide <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Author Section: My Recent Drafts & Rejected Articles */}
      {canCreate && data?.my_recent_drafts && data.my_recent_drafts.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                My Active Drafts & Work In Progress
              </h2>
            </div>
            <Link
              to="/articles?status=draft"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View all my drafts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.my_recent_drafts.map((art) => (
              <div
                key={art.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        art.status === "rejected"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {art.status === "rejected" ? "Needs Revision" : "Draft"}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Updated {new Date(art.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {art.summary || "Click to resume authoring..."}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{art.estimated_read_time} min read</span>
                  <Link
                    to={`/articles/${art.slug}/edit`}
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Continue Editing <Edit3 className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown & Knowledge Discovery */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Explore by Knowledge Category
            </h2>
          </div>
          <Link
            to="/taxonomy"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : !data?.category_distribution || data.category_distribution.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No categories with published documentation yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.category_distribution.map((cat) => (
              <Link
                key={cat.id}
                to={`/articles?category=${cat.slug}`}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {cat.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{cat.article_count} published</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Featured Knowledge Articles Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Featured Knowledge Guides
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Highlighted on Dashboard
            </span>
          </div>

          <Link
            to="/articles"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all articles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredArticles.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500/50 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Featured Guides Selected
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Articles marked as &ldquo;Featured Knowledge Guide&rdquo; during preparation will be showcased here. Unchecked articles remain safely accessible in the main Knowledge Base.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredArticles.map((art) => (
              <Link
                key={art.id}
                to={`/articles/${art.slug}`}
                className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Sparkles className="w-2.5 h-2.5" /> Featured Guide
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> {art.estimated_read_time} min read
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {art.summary || "Click to read full company wiki article..."}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By {art.author.full_name || art.author.username}</span>
                  <span>{new Date(art.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Admin Section: System Audit Activity Stream */}
      {isAdmin && data?.admin_metrics?.recent_activity && data.admin_metrics.recent_activity.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Recent Organization Audit Trail
              </h2>
            </div>
            <Link
              to="/audit"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.admin_metrics.recent_activity.map((event) => (
              <div key={event.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {event.actor_username}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                    {event.action_display || event.action}
                  </span>
                  <span className="text-slate-500 font-medium truncate max-w-xs">
                    {event.resource_name || event.resource_type}
                  </span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile & Permissions Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Details Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                {user?.full_name || user?.username}
              </h2>
              <p className="text-xs text-slate-400 font-mono">@{user?.username}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Work Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.email}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned System Role</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Unique User Identifier</span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate block bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                {user?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Role Permissions Breakdown */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                Role-Gated Permissions
              </h2>
            </div>
            <span className="text-xs text-slate-400">Strictly enforced by Django REST API</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  perm.allowed
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300"
                    : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 text-slate-400"
                }`}
              >
                {perm.allowed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ✕
                  </span>
                )}
                <span>{perm.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
