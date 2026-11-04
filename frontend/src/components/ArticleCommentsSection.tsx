import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, User, AtSign, Sparkles } from "lucide-react";
import { commentService } from "../services/commentService";
import { MentionTextarea } from "./MentionTextarea";
import type { ArticleComment } from "../types/notifications";

interface ArticleCommentsSectionProps {
  articleSlugOrId: string;
}

export const ArticleCommentsSection: React.FC<ArticleCommentsSectionProps> = ({
  articleSlugOrId,
}) => {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await commentService.getComments(articleSlugOrId);
      setComments(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [articleSlugOrId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const newComment = await commentService.postComment(articleSlugOrId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(errObj.response?.data?.detail || "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format text with highlighted @username mention badges
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-300 font-mono text-xs font-semibold border border-brand-500/30"
          >
            <AtSign className="w-2.5 h-2.5 text-brand-400 inline" />
            {part.slice(1)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Admin", classes: "bg-purple-950/60 text-purple-300 border-purple-800/60" };
      case "AUTHOR":
        return { label: "Author", classes: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" };
      case "REVIEWER":
        return { label: "Reviewer", classes: "bg-amber-950/60 text-amber-300 border-amber-800/60" };
      default:
        return { label: "Reader", classes: "bg-sky-950/60 text-sky-300 border-sky-800/60" };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <section id="comments" className="mt-10 pt-8 border-t border-slate-800 scroll-mt-20">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Team Discussion & Collaboration</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Leave feedback, ask questions, or tag teammates with <code className="text-brand-300 font-mono">@username</code>.
            </p>
          </div>
        </div>
      </div>

      {/* New Comment Input Box */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm focus-within:border-brand-500/50 transition">
          <MentionTextarea
            value={commentText}
            onChange={setCommentText}
            placeholder="Write a comment... Type @ to mention a colleague (e.g. @admin, @reviewer)"
            rows={3}
            disabled={isSubmitting}
          />

          {errorMsg && (
            <p className="text-xs text-rose-400 mt-2">{errorMsg}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Mentions automatically notify team members in real time</span>
            </div>

            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Comment Stream */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <div className="inline-block w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading discussion thread...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">No comments yet</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Be the first to start the conversation on this article!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const roleInfo = getRoleBadge(comment.author.role);
            return (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className={`rounded-2xl border p-4 transition ${
                  comment.is_own
                    ? "border-brand-500/30 bg-brand-950/10"
                    : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.author.full_name ? (
                        comment.author.full_name[0].toUpperCase()
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">
                          {comment.author.full_name || comment.author.username}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          @{comment.author.username}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full border font-semibold ${roleInfo.classes}`}
                        >
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-9">
                  {renderFormattedContent(comment.content)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
