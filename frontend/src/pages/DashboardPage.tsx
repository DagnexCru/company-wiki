import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HealthStatusCard } from "../components/HealthStatusCard";
import { articleService } from "../services/articleService";
import type { ArticleListItem } from "../types/article";
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle,
  BookOpen,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();
  const [recentArticles, setRecentArticles] = useState<ArticleListItem[]>([]);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [loadingArticles, setLoadingArticles] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const data = await articleService.getArticles({ page: 1, page_size: 4 });
        setRecentArticles(data.results);
        setTotalArticles(data.count);
      } catch {
        // Non-blocking dashboard fetch
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchDashboardContent();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phase 3: Core Knowledge Base Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            You are securely authenticated as an internal{" "}
            <span className="font-semibold text-white underline decoration-brand-400">
              {user?.role}
            </span>
            . Browse company documentation, create new drafts, or monitor real-time system telemetry.
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
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Recent Knowledge Articles Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Documentation
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {totalArticles} Accessible
            </span>
          </div>

          <Link
            to="/articles"
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all articles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingArticles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recentArticles.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No recent articles found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentArticles.map((art) => (
              <Link
                key={art.id}
                to={`/articles/${art.slug}`}
                className="group p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="capitalize font-medium text-[11px] text-slate-500">
                      {art.status}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> {art.estimated_read_time} min read
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {art.summary || "Click to read full article content..."}
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

      {/* System Health Telemetry Card */}
      <section aria-labelledby="health-section">
        <HealthStatusCard />
      </section>
    </div>
  );
};

// Telemetry: Dashboard dynamically queries /api/v1/articles/ to display live total accessible count.
