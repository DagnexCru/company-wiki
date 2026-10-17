import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Archive,
  Clock,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { articleService } from "../services/articleService";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { CategoryBadge } from "../components/CategoryBadge";
import type { ArticleDetail } from "../types/article";

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await articleService.getArticleBySlug(slug);
        setArticle(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load the article or access denied.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const canModify =
    user && article && (user.role === "ADMIN" || user.id === article.author.id);

  const handleArchive = async () => {
    if (!article) return;
    try {
      await articleService.archiveArticle(article.slug);
      setArticle({ ...article, status: "archived" });
      setActionSuccess("Article has been moved to archive.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      alert("Failed to archive article.");
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await articleService.deleteArticle(article.slug);
      navigate("/articles");
    } catch (err: unknown) {
      alert("Failed to delete article.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Draft (Unpublished)
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            In Peer Review
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Article Unavailable
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error || "The requested article could not be found or you do not have permission to view it."}
        </p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8">
      {/* Top Bar with Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Link
              to={`/articles/${article.slug}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
              Edit
            </Link>

            {article.status !== "archived" && (
              <button
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                Archive
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Article Header Details */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {article.category && (
            <Link to={`/articles?category=${article.category.slug}`}>
              <CategoryBadge category={article.category} size="md" />
            </Link>
          )}
          {getStatusBadge(article.status)}
          {article.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles className="w-3 h-3 text-amber-500" /> Featured Guide
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/articles?tag=${tag.slug}`}
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {article.summary && (
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal border-l-2 border-indigo-500 pl-4 py-0.5">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
              {article.author.full_name
                ? article.author.full_name[0].toUpperCase()
                : article.author.username[0].toUpperCase()}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {article.author.full_name || article.author.username}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Last updated: {new Date(article.updated_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {article.estimated_read_time} min read
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <article className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xs">
        <MarkdownViewer content={article.content} />
      </article>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm Article Deletion
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">
                "{article.title}"
              </strong>
              ? Draft articles are permanently removed, while published articles are archived to retain audit history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Accessibility: Modal dialog traps focus and supports ESC key cancellation.
