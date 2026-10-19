import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Folder,
  Tag as TagIcon,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  History,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { articleService } from "../services/articleService";
import { workflowService } from "../services/workflowService";
import type { ArticleDetail } from "../types/article";
import type { ReviewRecord } from "../types/workflow";
import { WorkflowStatusBadge } from "../components/WorkflowStatusBadge";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewTimeline } from "../components/ReviewTimeline";

export const ReviewDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review Modal state
  const [modalMode, setModalMode] = useState<"approve" | "reject" | null>(null);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await articleService.getArticleBySlug(slug);
      setArticle(data);

      setIsLoadingReviews(true);
      try {
        const revs = await workflowService.getArticleReviews(slug);
        setReviews(revs);
      } catch (rErr) {
        console.warn("Could not load review history", rErr);
      } finally {
        setIsLoadingReviews(false);
      }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        errObj.response?.data?.detail ||
          errObj.message ||
          "Failed to load article for review."
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecision = async (feedback: string) => {
    if (!slug || !modalMode) return;
    if (modalMode === "approve") {
      await workflowService.approveArticle(slug, { feedback });
    } else {
      await workflowService.rejectArticle(slug, { feedback });
    }
    setModalMode(null);
    navigate("/reviews");
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
        <p className="text-sm font-medium text-slate-500">
          Loading article for editorial review...
        </p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="py-16 px-6 max-w-lg mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Review Inspection Error
        </h2>
        <p className="text-sm text-slate-500">{error || "Article not found."}</p>
        <Link
          to="/reviews"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Queue</span>
        </Link>
      </div>
    );
  }

  const isOwnArticle = user?.id === article.author.id;
  const canReview = user?.role === "ADMIN" || !isOwnArticle;
  const isPendingReview = article.status === "in_review";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/reviews"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Editorial Review
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <WorkflowStatusBadge status={article.status} statusDisplay={article.status_display} size="sm" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {isPendingReview && canReview ? (
            <>
              <button
                onClick={() => setModalMode("reject")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300 transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
              <button
                onClick={() => setModalMode("approve")}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Publish</span>
              </button>
            </>
          ) : isPendingReview && !canReview ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Independent review required: authors cannot approve their own articles.</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium">
              Status: {article.status_display}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Article Content & Metadata Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Article Full Preview Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-xs space-y-6">
            <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {article.title}
              </h2>
              {article.summary && (
                <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  {article.summary}
                </p>
              )}
            </div>

            {/* Markdown / Content Body */}
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
              {article.content}
            </div>
          </div>

          {/* Chronological Review History Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Review History & Audit Trail
              </h3>
            </div>
            <ReviewTimeline records={reviews} isLoading={isLoadingReviews} />
          </div>
        </div>

        {/* Sidebar Metadata Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Submission Metadata
            </h3>

            {/* Author details */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                {article.author.full_name?.[0] || article.author.username[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {article.author.full_name || article.author.username}
                </p>
                <p className="text-xs text-slate-500">
                  {article.author.email} • <span className="font-semibold text-indigo-600">{article.author.role}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> Category
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {article.category?.name || "Uncategorized"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Submitted At
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {article.submitted_at
                    ? new Date(article.submitted_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Not specified"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Est. Reading Time
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {article.estimated_read_time || 1} min
                </span>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <TagIcon className="w-3 h-3 text-slate-400" />
                      <span>{tag.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {modalMode && (
        <ReviewModal
          isOpen={true}
          mode={modalMode}
          article={article}
          onClose={() => setModalMode(null)}
          onSubmit={handleDecision}
        />
      )}
    </div>
  );
};

export default ReviewDetailPage;
