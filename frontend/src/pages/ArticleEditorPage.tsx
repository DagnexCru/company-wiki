import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Edit,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { articleService } from "../services/articleService";
import { MarkdownViewer } from "../components/MarkdownViewer";
import type { ArticleInput } from "../types/article";

export const ArticleEditorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const isEditing = Boolean(slug);
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [loading, setLoading] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If in edit mode, fetch current article details
  useEffect(() => {
    if (!slug) return;
    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await articleService.getArticleBySlug(slug);
        setTitle(data.title);
        setSummary(data.summary || "");
        setContent(data.content);
        setIsFeatured(data.is_featured);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load the article for editing.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Article title must be at least 3 characters long.");
      return;
    }
    if (content.trim().length < 10) {
      setError("Article content must be at least 10 characters long.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: ArticleInput = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      is_featured: isFeatured,
    };

    try {
      if (isEditing && slug) {
        const updated = await articleService.updateArticle(slug, payload);
        navigate(`/articles/${updated.slug}`);
      } else {
        const created = await articleService.createArticle(payload);
        navigate(`/articles/${created.slug}`);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save the article. Please check your connection and inputs.";
      setError(msg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={isEditing ? `/articles/${slug}` : "/articles"}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {isEditing ? "Edit Knowledge Article" : "Write New Knowledge Article"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Update document content, title, or executive summary."
                : "Draft a new documentation page. Articles are saved as drafts in PostgreSQL."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={isEditing ? `/articles/${slug}` : "/articles"}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-medium shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Save as Draft"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Article Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., PostgreSQL Backup & Restoration Procedures"
            className="w-full px-4 py-2.5 text-base bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Executive Summary */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Executive Summary / Excerpt
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief 1-2 sentence description for search listings and card previews..."
            className="w-full px-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Content Section with Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "write"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                Write (Markdown)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "preview"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Supports GitHub-flavored Markdown headers, lists, code blocks
            </span>
          </div>

          <div className="p-4 sm:p-6 min-h-[380px]">
            {activeTab === "write" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Document Title&#10;&#10;Write comprehensive technical documentation using Markdown...&#10;&#10;## Key Concepts&#10;- Bullet point one&#10;- Bullet point two&#10;&#10;```bash&#10;npm install&#10;```"
                rows={16}
                className="w-full h-full font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-transparent resize-y focus:outline-none placeholder-slate-400"
              />
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                {content.trim() ? (
                  <MarkdownViewer content={content} />
                ) : (
                  <p className="text-slate-400 text-sm italic">
                    Nothing to preview yet. Switch to the Write tab and enter Markdown content.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Featured Guide Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Featured Knowledge Guide
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highlight this article on the company dashboard and search landing page.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Phase 7 Workflow Notification Info */}
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-800 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <p className="leading-relaxed">
            <strong>Publishing Workflow Note:</strong> In accordance with company policy, newly saved articles are stored safely in <em>Draft</em> status in PostgreSQL. Direct publication is restricted until peer review approval (Phase 7 Review Workflow).
          </p>
        </div>
      </form>
    </div>
  );
};
