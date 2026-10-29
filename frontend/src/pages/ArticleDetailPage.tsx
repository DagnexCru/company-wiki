import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Send,
  CheckSquare,
  History,
  AlertTriangle,
  Printer,
  Download,
  Share2,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { articleService } from "../services/articleService";
import { workflowService } from "../services/workflowService";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { CategoryBadge } from "../components/CategoryBadge";
import { WorkflowStatusBadge } from "../components/WorkflowStatusBadge";
import { SubmitReviewModal } from "../components/SubmitReviewModal";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewTimeline } from "../components/ReviewTimeline";
import { TableOfContents } from "../components/TableOfContents";
import { ArticlePresenceViewer } from "../components/ArticlePresenceViewer";
import { useArticlePresence } from "../hooks/useArticlePresence";
import { extractHeadings } from "../utils/headingUtils";
import type { ArticleDetail } from "../types/article";
import type { ReviewRecord } from "../types/workflow";

export const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Real-Time Collaborative Presence Hook (Active Viewers & Live Lock Status)
  const { viewers, activeCount, editLock } = useArticlePresence({
    slugOrId: slug,
    mode: "viewing",
  });

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Table of Contents & Reading Progress States
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Workflow Modal States
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [reviewModalMode, setReviewModalMode] = useState<"approve" | "reject" | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await articleService.getArticleBySlug(slug);
      setArticle(data);

      // Load review history if authorized (Author, Reviewer, or Admin)
      if (user && (user.role === "ADMIN" || user.role === "REVIEWER" || user.id === data.author.id)) {
        setLoadingReviews(true);
        try {
          const revs = await workflowService.getArticleReviews(slug);
          setReviews(revs);
        } catch (rErr) {
          console.warn("Could not load review history", rErr);
        } finally {
          setLoadingReviews(false);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load the article or access denied.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Extract table of contents headings
  const headings = useMemo(() => {
    return article ? extractHeadings(article.content) : [];
  }, [article?.content]);

  // Scroll listener for reading progress bar and active heading scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setReadingProgress(progress);

      // Determine active heading
      if (headings.length > 0) {
        let currentActive = headings[0].id;
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 140) {
              currentActive = h.id;
            }
          }
        }
        setActiveHeadingId(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleDownloadMarkdown = () => {
    if (!article) return;
    const frontmatter = [
      "---",
      `title: "${article.title}"`,
      `slug: "${article.slug}"`,
      `author: "${article.author.full_name || article.author.username}"`,
      `status: "${article.status}"`,
      `estimated_read_time: ${article.estimated_read_time}`,
      article.category ? `category: "${article.category.name}"` : null,
      article.tags && article.tags.length > 0
        ? `tags: [${article.tags.map((t) => `"${t.name}"`).join(", ")}]`
        : null,
      `last_updated: "${article.updated_at}"`,
      "---",
      "",
      `# ${article.title}`,
      "",
      article.summary ? `> ${article.summary}\n` : "",
      article.content,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([frontmatter], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const canModify =
    user && article && (user.role === "ADMIN" || user.id === article.author.id);

  const isAuthor = user && article && user.id === article.author.id;
  const isReviewerOrAdmin = user && (user.role === "ADMIN" || user.role === "REVIEWER");
  const canSubmit = isAuthor || user?.role === "ADMIN";
  const canReview = isReviewerOrAdmin && (user?.role === "ADMIN" || !isAuthor);

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

  const handleSubmitForReview = async (notes: string) => {
    if (!article) return;
    const res = await workflowService.submitForReview(article.slug, { notes });
    setActionSuccess(res.detail || "Article successfully submitted for review!");
    setShowSubmitModal(false);
    fetchArticle();
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const handleReviewDecision = async (feedback: string) => {
    if (!article || !reviewModalMode) return;
    if (reviewModalMode === "approve") {
      const res = await workflowService.approveArticle(article.slug, { feedback });
      setActionSuccess(res.detail || "Article approved and published!");
    } else {
      const res = await workflowService.rejectArticle(article.slug, { feedback });
      setActionSuccess(res.detail || "Changes requested on article.");
    }
    setReviewModalMode(null);
    fetchArticle();
    setTimeout(() => setActionSuccess(null), 5000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-sm w-48" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-sm w-3/4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-sm w-1/3" />
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-8 animate-in fade-in duration-300 relative">
      {/* Pinned Top Reading Progress Bar */}
      <div
        className="reading-progress-bar fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 transition-all duration-150 ease-out pointer-events-none"
        style={{ width: `${readingProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Top Bar with Navigation and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
          </Link>

          {/* Live Collaborative Presence: Currently Viewing Avatars */}
          <ArticlePresenceViewer
            viewers={viewers}
            activeCount={activeCount}
            editLock={editLock}
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export & Sharing Suite */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={handleCopyShareLink}
              title="Copy direct shareable link"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-200" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              title="Download clean Markdown with metadata frontmatter"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>.MD</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print or export as clean PDF"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Print / PDF</span>
            </button>
          </div>

          {/* Submit for Review Button (Draft or Rejected by author) */}
          {canSubmit && (article.status === "draft" || article.status === "rejected") && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-600/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{article.status === "rejected" ? "Resubmit for Review" : "Submit for Review"}</span>
            </button>
          )}

          {/* Review Article Action (Reviewer or Admin when in_review) */}
          {article.status === "in_review" && isReviewerOrAdmin && (
            <Link
              to={`/reviews/${article.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs shadow-amber-500/20 transition"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{canReview ? "Review Article" : "View in Queue"}</span>
            </Link>
          )}

          {/* History & Revisions (Phase 8 & 20) */}
          {(user?.role === "ADMIN" || user?.role === "REVIEWER" || article.author.id === user?.id) && (
            <Link
              to={`/articles/${article.slug}/revisions`}
              title="View revision history, side-by-side diffs, and rollback tools"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Revisions</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                v{article.latest_revision_number || article.revision_count || 1}
              </span>
            </Link>
          )}

          {/* Author/Admin Edit */}
          {canModify && (
            <Link
              to={`/articles/${article.slug}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Edit</span>
            </Link>
          )}

          {/* Author/Admin Archive */}
          {canModify && article.status !== "archived" && (
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              <span>Archive</span>
            </button>
          )}

          {/* Author/Admin Delete */}
          {canModify && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-sm font-medium shadow-2xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Rejection Feedback Alert Banner */}
      {article.status === "rejected" && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Editorial Changes Requested
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed whitespace-pre-wrap">
                {article.rejection_reason || "The reviewer has requested revisions before publication."}
              </p>
            </div>
          </div>
          {canModify && (
            <div className="flex items-center gap-3 pt-2 border-t border-rose-100 dark:border-rose-900/50">
              <Link
                to={`/articles/${article.slug}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Revise Content</span>
              </Link>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resubmit Directly</span>
              </button>
            </div>
          )}
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
          <WorkflowStatusBadge status={article.status} statusDisplay={article.status_display} size="md" />
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

      {/* Article Body & Table of Contents Responsive Two-Column Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1 min-w-0 space-y-8 w-full order-2 lg:order-1">
          {/* Main Document Content */}
          <article className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xs">
            <MarkdownViewer content={article.content} />
          </article>

          {/* Review History Section (Visible to Author, Reviewers, and Admins) */}
          {(user?.role === "ADMIN" || user?.role === "REVIEWER" || isAuthor) && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Editorial Review History & Audit Trail
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {reviews.length} recorded events
                </span>
              </div>
              <ReviewTimeline records={reviews} isLoading={loadingReviews} />
            </section>
          )}
        </div>

        {/* Table of Contents (handles mobile accordion + sticky desktop sidebar) */}
        {headings.length > 0 && (
          <div className="w-full lg:w-64 shrink-0 order-1 lg:order-2">
            <TableOfContents
              headings={headings}
              activeId={activeHeadingId}
              readingProgress={readingProgress}
            />
          </div>
        )}
      </div>

      {/* Submit for Review Modal */}
      {showSubmitModal && (
        <SubmitReviewModal
          isOpen={true}
          articleTitle={article.title}
          isResubmission={article.status === "rejected"}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmitForReview}
        />
      )}

      {/* Review Decision Modal */}
      {reviewModalMode && (
        <ReviewModal
          isOpen={true}
          mode={reviewModalMode}
          article={article}
          onClose={() => setReviewModalMode(null)}
          onSubmit={handleReviewDecision}
        />
      )}

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

export default ArticleDetailPage;
