import React, { useState } from "react";
import {
  MessageSquare,
  Check,
  RotateCcw,
  User,
  AlertCircle,
  Send,
  CornerDownRight,
  Trash2,
  X,
  AtSign,
} from "lucide-react";
import type {
  ArticleInlineAnnotation,
  ArticleInlineAnnotationReply,
} from "../types/annotation";

interface AnnotationSideRailProps {
  annotations: ArticleInlineAnnotation[];
  activeAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  typistsByAnnotation?: { [annotationId: string]: string[] };
  onSelectAnnotation: (id: string) => void;
  onHoverAnnotation: (id: string | null) => void;
  onReplyToAnnotation?: (
    annotationId: string,
    content: string,
    parentId?: string | null
  ) => Promise<void>;
  onResolveAnnotation?: (annotationId: string) => Promise<void>;
  onReopenAnnotation?: (annotationId: string) => Promise<void>;
  onDeleteReply?: (annotationId: string, replyId: string) => Promise<void>;
  onTyping?: (annotationId: string, isTyping: boolean) => void;
}

export const AnnotationSideRail: React.FC<AnnotationSideRailProps> = ({
  annotations,
  activeAnnotationId,
  hoveredAnnotationId,
  typistsByAnnotation,
  onSelectAnnotation,
  onHoverAnnotation,
  onReplyToAnnotation,
  onResolveAnnotation,
  onReopenAnnotation,
  onDeleteReply,
  onTyping,
}) => {
  const [replyText, setReplyText] = useState<{ [annId: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<{
    [annId: string]: { parentId: string; username: string } | null;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const typingTimerRef = React.useRef<{ [annId: string]: any }>({});

  if (!annotations || annotations.length === 0) return null;

  const handleSendReply = async (annId: string) => {
    const text = (replyText[annId] || "").trim();
    if (!text || !onReplyToAnnotation || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (onTyping) onTyping(annId, false);
      const parentId = replyingTo[annId]?.parentId || null;
      await onReplyToAnnotation(annId, text, parentId);
      setReplyText((prev) => ({ ...prev, [annId]: "" }));
      setReplyingTo((prev) => ({ ...prev, [annId]: null }));
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (annId: string, val: string) => {
    setReplyText((prev) => ({ ...prev, [annId]: val }));

    if (onTyping) {
      onTyping(annId, true);
      if (typingTimerRef.current[annId]) {
        clearTimeout(typingTimerRef.current[annId]);
      }
      typingTimerRef.current[annId] = setTimeout(() => {
        onTyping(annId, false);
      }, 2500);
    }
  };

  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/70 px-1 py-0.2 rounded text-[10px]"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderReplyTree = (
    reply: ArticleInlineAnnotationReply,
    annId: string,
    depth = 0
  ) => {
    const authorName =
      reply.author?.full_name || reply.author?.username || "Teammate";
    const dateFormatted = new Date(reply.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={reply.id}
        className={`flex flex-col gap-1 ${
          depth > 0
            ? "ml-3.5 pl-2.5 border-l-2 border-indigo-200 dark:border-indigo-900/60"
            : ""
        }`}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <User className="w-2.5 h-2.5 text-slate-400" />
            <span className="truncate max-w-[100px]">{authorName}</span>
            <span className="text-[9px] font-normal text-slate-400">
              {dateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setReplyingTo((prev) => ({
                  ...prev,
                  [annId]: {
                    parentId: reply.id,
                    username: reply.author?.username || authorName,
                  },
                }))
              }
              title="Reply to comment"
              className="text-[9px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium px-1 py-0.2 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
            >
              Reply
            </button>
            {reply.is_own && onDeleteReply && (
              <button
                type="button"
                onClick={() => onDeleteReply(annId, reply.id)}
                title="Delete your reply"
                className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-1.5 rounded-lg">
          {renderContentWithMentions(reply.content)}
        </p>

        {reply.children && reply.children.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {reply.children.map((child) =>
              renderReplyTree(child, annId, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      aria-label="Document Annotations Gutter"
      className="hidden xl:flex flex-col gap-3 w-80 shrink-0 pl-4 border-l border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-indigo-500" />
          Discussions & Threads ({annotations.length})
        </span>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[80vh] pr-1">
        {annotations.map((ann) => {
          const isActive = activeAnnotationId === ann.id;
          const isHovered = hoveredAnnotationId === ann.id;
          const isResolved = ann.status === "resolved";
          const authorName =
            ann.author?.full_name || ann.author?.username || "Colleague";
          const currentReplyingTo = replyingTo[ann.id];
          const hasReplies = ann.replies && ann.replies.length > 0;

          return (
            <div
              key={ann.id}
              onClick={() => onSelectAnnotation(ann.id)}
              onMouseEnter={() => onHoverAnnotation(ann.id)}
              onMouseLeave={() => onHoverAnnotation(null)}
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                  : isHovered
                  ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs"
                  : isResolved
                  ? "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-70"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {/* Header: Author & Status */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{authorName}</span>
                </span>
                <div className="flex items-center gap-1">
                  {isResolved ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Check className="w-2.5 h-2.5" /> Resolved
                    </span>
                  ) : (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                      title="Open discussion"
                    />
                  )}
                </div>
              </div>

              {/* Highlighted text quote */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 border-l-2 border-amber-400 pl-1.5 mb-1.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-r">
                "{ann.highlighted_text}"
              </div>

              {/* Root Content */}
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {renderContentWithMentions(ann.content)}
              </p>

              {/* Fuzzy anchor resilience badge */}
              {ann.match_confidence !== undefined &&
                ann.match_confidence < 1.0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      Fuzzy Match ({Math.round(ann.match_confidence * 100)}%)
                    </span>
                  </div>
                )}

              {/* Collapsed reply count badge if not active */}
              {!isActive && (ann.replies_count ?? 0) > 0 && (
                <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  <CornerDownRight className="w-3 h-3" />
                  <span>
                    {ann.replies_count} {ann.replies_count === 1 ? "reply" : "replies"}
                  </span>
                </div>
              )}

              {/* Expanded Threaded Discussion Tree (When Active) */}
              {isActive && (
                <div
                  className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Thread Actions: Resolve/Reopen */}
                  <div className="flex items-center justify-between pb-1 text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">
                      Replies ({ann.replies_count ?? (ann.replies?.length || 0)})
                    </span>
                    {isResolved ? (
                      onReopenAnnotation && (
                        <button
                          type="button"
                          onClick={() => onReopenAnnotation(ann.id)}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Reopen Thread
                        </button>
                      )
                    ) : (
                      onResolveAnnotation && (
                        <button
                          type="button"
                          onClick={() => onResolveAnnotation(ann.id)}
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5" /> Resolve Thread
                        </button>
                      )
                    )}
                  </div>

                  {/* Conversation Tree Replies List */}
                  {hasReplies ? (
                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                      {ann.replies!.map((r) => renderReplyTree(r, ann.id, 0))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">
                      No replies yet. Start the discussion below.
                    </div>
                  )}

                  {/* Replying-to indicator tag */}
                  {currentReplyingTo && (
                    <div className="flex items-center justify-between text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                      <span>Replying to @{currentReplyingTo.username}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setReplyingTo((prev) => ({
                            ...prev,
                            [ann.id]: null,
                          }))
                        }
                        className="p-0.5 hover:text-indigo-900 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Live Typing Presence Indicator */}
                  {typistsByAnnotation && typistsByAnnotation[ann.id] && typistsByAnnotation[ann.id].length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium py-0.5 animate-pulse">
                      <span className="flex gap-0.5 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                      </span>
                      <span>
                        {typistsByAnnotation[ann.id].map((u) => `@${u}`).join(", ")}{" "}
                        {typistsByAnnotation[ann.id].length > 1 ? "are typing..." : "is typing..."}
                      </span>
                    </div>
                  )}

                  {/* Reply Input Box */}
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={replyText[ann.id] || ""}
                        onChange={(e) => handleTextChange(ann.id, e.target.value)}
                        onBlur={() => {
                          if (onTyping) onTyping(ann.id, false);
                        }}
                        placeholder={
                          currentReplyingTo
                            ? `Reply to @${currentReplyingTo.username}...`
                            : "Write a reply or @mention colleague..."
                        }
                        className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-slate-800 dark:text-slate-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            handleSendReply(ann.id);
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <AtSign className="w-3 h-3 text-slate-400" />
                        <span>Supports @username</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendReply(ann.id)}
                        disabled={
                          !(replyText[ann.id] || "").trim() || isSubmitting
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition cursor-pointer"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>{isSubmitting ? "Sending..." : "Reply"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
