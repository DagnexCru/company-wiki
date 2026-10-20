import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare,
  Search,
  Filter,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Folder,
  Tag as TagIcon,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { workflowService } from "../services/workflowService";
import { taxonomyService } from "../services/taxonomyService";
import type { ReviewQueueItem } from "../types/workflow";
import type { Category } from "../types/taxonomy";
import { WorkflowStatusBadge } from "../components/WorkflowStatusBadge";
import { ReviewModal } from "../components/ReviewModal";
import type { ArticleDetail } from "../types/article";

export const ReviewQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal State
  const [activeModalItem, setActiveModalItem] = useState<{
    item: ReviewQueueItem;
    mode: "approve" | "reject";
  } | null>(null);

  // Fetch Categories
  useEffect(() => {
    taxonomyService
      .getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await workflowService.getReviewQueue({
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      });
      setItems(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        errObj.response?.data?.detail ||
          errObj.message ||
          "Failed to load review queue."
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleDecision = async (feedback: string) => {
    if (!activeModalItem) return;
    const { item, mode } = activeModalItem;

    if (mode === "approve") {
      await workflowService.approveArticle(item.slug, { feedback });
    } else {
      await workflowService.rejectArticle(item.slug, { feedback });
    }

    setActiveModalItem(null);
    loadQueue();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Editorial Review Queue
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inspect, approve, or request revisions on pending knowledge articles before company publication.
          </p>
        </div>

        <button
          onClick={() => loadQueue()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Pending in Queue
            </p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {totalCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Your Review Role
            </p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
              {user?.role === "ADMIN" ? "Administrator" : "Reviewer"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Queue Order
            </p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
              FIFO (First Submitted)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search submitted articles by title, author, or summary..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter queue by category"
              className="pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error Loading Queue</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Queue Content List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm font-medium">Scanning review queue...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Review Queue is Clear!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            All submitted knowledge articles have been reviewed and published. Check back soon for new submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isOwnArticle = user?.id === item.author.id;
            const canReview = user?.role === "ADMIN" || !isOwnArticle;

            const submittedDate = item.submitted_at
              ? new Date(item.submitted_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "Recently";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkflowStatusBadge status={item.status} statusDisplay={item.status_display} size="sm" />
                      {item.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Folder className="w-3 h-3 text-slate-400" />
                          <span>{item.category.name}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted {submittedDate}</span>
                      </span>
                    </div>

                    <Link
                      to={`/reviews/${item.slug}`}
                      className="text-lg font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition block"
                    >
                      {item.title}
                    </Link>

                    {item.summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  {/* Author badge */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {item.author.full_name?.[0] || item.author.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.author.full_name || item.author.username}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Author ({item.author.role})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags preview */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {item.tags.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        <TagIcon className="w-2.5 h-2.5 opacity-60" />
                        <span>{t.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Independent Review Guard / Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isOwnArticle && user?.role !== "ADMIN" ? (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-900/50">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Independent review required: you cannot review your own submission.</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Action ready for authorized reviewer.
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                    <Link
                      to={`/reviews/${item.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                    >
                      <span>Full Inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {canReview && (
                      <>
                        <button
                          onClick={() =>
                            setActiveModalItem({
                              item,
                              mode: "reject",
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                        <button
                          onClick={() =>
                            setActiveModalItem({
                              item,
                              mode: "approve",
                            })
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Publish</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Modal */}
      {activeModalItem && (
        <ReviewModal
          isOpen={true}
          mode={activeModalItem.mode}
          article={
            {
              id: activeModalItem.item.id,
              title: activeModalItem.item.title,
              slug: activeModalItem.item.slug,
              content: "",
            } as ArticleDetail
          }
          onClose={() => setActiveModalItem(null)}
          onSubmit={handleDecision}
        />
      )}
    </div>
  );
};

export default ReviewQueuePage;
