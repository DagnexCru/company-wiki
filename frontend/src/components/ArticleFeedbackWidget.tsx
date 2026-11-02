import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Award,
} from "lucide-react";
import { articleService } from "../services/articleService";
import type { FeedbackNote, UserFeedback } from "../types/article";

interface ArticleFeedbackWidgetProps {
  articleSlug: string;
  initialHelpfulCount?: number;
  initialUnhelpfulCount?: number;
  initialHelpfulnessScore?: number;
  initialUserFeedback?: UserFeedback | null;
  canManageArticle?: boolean;
  initialFeedbackNotes?: FeedbackNote[];
  onFeedbackUpdated?: (stats: {
    helpful_count: number;
    unhelpful_count: number;
    helpfulness_score: number;
    user_feedback: UserFeedback;
  }) => void;
}

const HELPFUL_TAGS = [
  "Clear instructions",
  "Great code samples",
  "Accurate & up to date",
  "Easy to follow",
  "Saved me time",
];

const UNHELPFUL_TAGS = [
  "Missing setup steps",
  "Outdated commands",
  "Confusing explanation",
  "Broken link or diagram",
  "Needs more examples",
];

export const ArticleFeedbackWidget: React.FC<ArticleFeedbackWidgetProps> = ({
  articleSlug,
  initialHelpfulCount = 0,
  initialUnhelpfulCount = 0,
  initialHelpfulnessScore = 100,
  initialUserFeedback = null,
  canManageArticle = false,
  initialFeedbackNotes = [],
  onFeedbackUpdated,
}) => {
  const [userRating, setUserRating] = useState<boolean | null>(
    initialUserFeedback !== null && initialUserFeedback !== undefined
      ? initialUserFeedback.is_helpful
      : null
  );
  const [noteText, setNoteText] = useState(initialUserFeedback?.note || "");
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(initialUnhelpfulCount);
  const [helpfulnessScore, setHelpfulnessScore] = useState(initialHelpfulnessScore);
  const [notesList] = useState<FeedbackNote[]>(initialFeedbackNotes);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [showNoteBox, setShowNoteBox] = useState(Boolean(initialUserFeedback?.note));
  const [showAuthorInsights, setShowAuthorInsights] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVote = async (isHelpful: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const resp = await articleService.submitFeedback(articleSlug, {
        is_helpful: isHelpful,
        note: noteText,
      });

      setUserRating(isHelpful);
      setHelpfulCount(resp.helpful_count);
      setUnhelpfulCount(resp.unhelpful_count);
      setHelpfulnessScore(resp.helpfulness_score);
      setShowNoteBox(true);
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 3000);

      if (onFeedbackUpdated) {
        onFeedbackUpdated({
          helpful_count: resp.helpful_count,
          unhelpful_count: resp.unhelpful_count,
          helpfulness_score: resp.helpfulness_score,
          user_feedback: resp.user_feedback,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record feedback.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNote = async () => {
    if (userRating === null) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const resp = await articleService.submitFeedback(articleSlug, {
        is_helpful: userRating,
        note: noteText.trim(),
      });

      setHelpfulCount(resp.helpful_count);
      setUnhelpfulCount(resp.unhelpful_count);
      setHelpfulnessScore(resp.helpfulness_score);
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 3000);

      if (onFeedbackUpdated) {
        onFeedbackUpdated({
          helpful_count: resp.helpful_count,
          unhelpful_count: resp.unhelpful_count,
          helpfulness_score: resp.helpfulness_score,
          user_feedback: resp.user_feedback,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const appendTagToNote = (tag: string) => {
    if (!noteText.includes(tag)) {
      const updated = noteText.trim() ? `${noteText.trim()}, ${tag}` : tag;
      setNoteText(updated.slice(0, 500));
    }
  };

  const totalVotes = helpfulCount + unhelpfulCount;

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
        {/* Header: Question & current rating stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Was this article helpful?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your feedback directly informs document updates and engineering quality metrics.
            </p>
          </div>

          {/* Voting Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleVote(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer ${
                userRating === true
                  ? "bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/30"
                  : "bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${userRating === true ? "fill-white" : ""}`} />
              <span>Yes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                userRating === true ? "bg-emerald-700 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}>
                {helpfulCount}
              </span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleVote(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer ${
                userRating === false
                  ? "bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-500/30"
                  : "bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${userRating === false ? "fill-white" : ""}`} />
              <span>No</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                userRating === false ? "bg-rose-700 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}>
                {unhelpfulCount}
              </span>
            </button>
          </div>
        </div>

        {/* Aggregate Quality Metric pill */}
        {totalVotes > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Award className="w-3.5 h-3.5" />
              {helpfulnessScore}% helpfulness score
            </span>
            <span>·</span>
            <span>{totalVotes} total reader {totalVotes === 1 ? "rating" : "ratings"}</span>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl px-3 py-2">
            {errorMessage}
          </div>
        )}

        {/* Success confirmation toast */}
        {submittedSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3 py-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Thank you! Your feedback has been recorded for the article author.</span>
          </div>
        )}

        {/* Feedback Note Composer (Opens after voting or if already voted) */}
        {showNoteBox && (
          <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-note-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
                <span>
                  {userRating === true
                    ? "What was most helpful? (Optional note for author)"
                    : "How can the author improve this guide? (Optional)"}
                </span>
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {noteText.length}/500
              </span>
            </div>

            {/* Quick Chips to tap */}
            <div className="flex flex-wrap gap-1.5">
              {(userRating === true ? HELPFUL_TAGS : UNHELPFUL_TAGS).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => appendTagToNote(tag)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* Note text field */}
            <div className="relative">
              <textarea
                id="feedback-note-input"
                rows={2}
                maxLength={500}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  userRating === true
                    ? "Add an optional praise, context, or snippet that worked well..."
                    : "Describe what is missing, outdated, or difficult to understand..."
                }
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        )}

        {/* Author Quality Insights Panel (Author, Reviewers, Admins only) */}
        {canManageArticle && (
          <div className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAuthorInsights(!showAuthorInsights)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span>Author Quality Insights & Reader Notes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  {notesList.length} {notesList.length === 1 ? "note" : "notes"}
                </span>
              </div>
              {showAuthorInsights ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAuthorInsights && (
              <div className="mt-3 space-y-2.5 animate-in fade-in duration-200">
                {notesList.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                    No detailed reader notes submitted yet. Ratings and helpfulness scores will update here as readers interact.
                  </p>
                ) : (
                  notesList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              item.is_helpful
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {item.is_helpful ? (
                              <ThumbsUp className="w-2.5 h-2.5" />
                            ) : (
                              <ThumbsDown className="w-2.5 h-2.5" />
                            )}
                            {item.is_helpful ? "Helpful" : "Needs Work"}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.user_name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                            ({item.user_role})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 pl-1 leading-relaxed">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleFeedbackWidget;
