import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  MessageSquare,
  CheckCircle2,
  Search,
  Filter,
  Send,
  RotateCcw,
  Check,
  Trash2,
  AtSign,
  User,
  Clock,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { annotationService } from "../services/annotationService";
import type {
  ArticleInlineAnnotation,
  ArticleInlineAnnotationReply,
  AnnotationMetrics,
  AnnotationPreset,
} from "../types/annotation";

interface AnnotationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleSlug: string;
  annotations: ArticleInlineAnnotation[];
  activeAnnotationId: string | null;
  typistsByAnnotation?: { [annotationId: string]: string[] };
  onSelectAnnotation: (id: string) => void;
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

export const AnnotationDrawer: React.FC<AnnotationDrawerProps> = ({
  isOpen,
  onClose,
  articleSlug,
  annotations,
  activeAnnotationId,
  typistsByAnnotation,
  onSelectAnnotation,
  onReplyToAnnotation,
  onResolveAnnotation,
  onReopenAnnotation,
  onDeleteReply,
  onTyping,
}) => {
  const [metrics, setMetrics] = useState<AnnotationMetrics | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [presetFilter, setPresetFilter] = useState<AnnotationPreset>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [replyText, setReplyText] = useState<{ [annId: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<{
    [annId: string]: { parentId: string; username: string } | null;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const typingTimerRef = React.useRef<{ [annId: string]: any }>({});

  // Fetch discussion velocity metrics on open
  useEffect(() => {
    if (!isOpen || !articleSlug) return;
    annotationService
      .getMetrics(articleSlug)
      .then((data) => setMetrics(data))
      .catch((err) => console.debug("Metrics fetch error:", err));
  }, [isOpen, articleSlug, annotations]);

  const isStale = (createdAt: string) => {
    return Date.now() - new Date(createdAt).getTime() > 48 * 3600 * 1000;
  };

  const handleTestSlackWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      const res = await annotationService.testWebhook(articleSlug);
      setWebhookStatus(
        res.dispatch_result.simulated
          ? "Simulated Slack payload generated successfully"
          : "Slack webhook delivered successfully"
      );
      setTimeout(() => setWebhookStatus(null), 4000);
    } catch (err) {
      setWebhookStatus("Webhook dispatch error");
      setTimeout(() => setWebhookStatus(null), 4000);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Filtered annotations list
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((ann) => {
      // 1. Status Filter
      if (statusFilter !== "all" && ann.status !== statusFilter) {
        return false;
      }
      // 2. Multi-Criteria Preset Filter
      if (presetFilter === "my_mentions") {
        const hasMention =
          ann.content.includes("@") ||
          ann.replies?.some((r) => r.content.includes("@"));
        if (!hasMention) return false;
      } else if (presetFilter === "needs_review") {
        if (ann.status !== "open") return false;
      } else if (presetFilter === "stale") {
        if (ann.status !== "open" || !isStale(ann.created_at)) return false;
      } else if (presetFilter === "my_threads") {
        if (!ann.is_own) return false;
      }
      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHighlight = ann.highlighted_text.toLowerCase().includes(q);
        const matchesContent = ann.content.toLowerCase().includes(q);
        const matchesAuthor =
          ann.author?.username.toLowerCase().includes(q) ||
          ann.author?.full_name?.toLowerCase().includes(q);
        const matchesReplies = ann.replies?.some(
          (r) =>
            r.content.toLowerCase().includes(q) ||
            r.author?.username.toLowerCase().includes(q)
        );
        return matchesHighlight || matchesContent || matchesAuthor || matchesReplies;
      }
      return true;
    });
  }, [annotations, statusFilter, presetFilter, searchQuery]);

  if (!isOpen) return null;

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
            <span className="truncate max-w-[120px]">{authorName}</span>
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
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Collaborative Discussions
                </h2>
                <p className="text-[11px] text-slate-400">
                  {annotations.length} total thread{annotations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Discussion Velocity & Resolution Metrics Card */}
          {metrics && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Resolution Rate
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.resolution_rate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.resolution_rate}%` }}
                />
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                  <span className="text-slate-400 block">Open</span>
                  <span className="font-bold text-amber-500">{metrics.open_count}</span>
                </div>
                <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                  <span className="text-slate-400 block">Resolved</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.resolved_count}
                  </span>
                </div>
                <div className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                  <span className="text-slate-400 block">Avg Resolution</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {metrics.avg_resolution_time_hours !== null
                      ? `${metrics.avg_resolution_time_hours}h`
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Slack & External Webhook Bridge Action */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-indigo-500" /> Webhook Bridge
                </span>
                <button
                  type="button"
                  onClick={handleTestSlackWebhook}
                  disabled={isTestingWebhook}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer disabled:opacity-50"
                >
                  {isTestingWebhook ? "Sending..." : "Test Slack Broadcast"}
                </button>
              </div>
              {webhookStatus && (
                <div className="text-[10px] p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-in fade-in">
                  {webhookStatus}
                </div>
              )}
            </div>
          )}

          {/* Preset Shortcuts */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] scrollbar-none">
            <button
              type="button"
              onClick={() => setPresetFilter("all")}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                presetFilter === "all"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All ({metrics?.preset_counts?.all ?? annotations.length})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter("my_mentions")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                presetFilter === "my_mentions"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <AtSign className="w-2.5 h-2.5" /> Mentions ({metrics?.preset_counts?.my_mentions ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter("needs_review")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                presetFilter === "needs_review"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5" /> Review ({metrics?.preset_counts?.needs_review ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter("stale")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                presetFilter === "stale"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Clock className="w-2.5 h-2.5" /> Stale ({metrics?.preset_counts?.stale ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setPresetFilter("my_threads")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                presetFilter === "my_threads"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <User className="w-2.5 h-2.5" /> My Threads ({metrics?.preset_counts?.my_threads ?? 0})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in threads, quotes, or @mentions..."
              className="w-full text-xs pl-8 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All ({annotations.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("open")}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition cursor-pointer ${
                statusFilter === "open"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Open ({annotations.filter((a) => a.status === "open").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("resolved")}
              className={`flex-1 py-1 rounded-lg text-center font-semibold transition cursor-pointer ${
                statusFilter === "resolved"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Resolved ({annotations.filter((a) => a.status === "resolved").length})
            </button>
          </div>
        </div>

        {/* Discussions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredAnnotations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-1">
              <Filter className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold">No discussions match your filter.</p>
              <p className="text-[11px]">Select text in the document to start a new discussion.</p>
            </div>
          ) : (
            filteredAnnotations.map((ann) => {
              const isActive = activeAnnotationId === ann.id;
              const isResolved = ann.status === "resolved";
              const authorName =
                ann.author?.full_name || ann.author?.username || "Colleague";
              const currentReplyingTo = replyingTo[ann.id];
              const hasReplies = ann.replies && ann.replies.length > 0;

              return (
                <div
                  key={ann.id}
                  onClick={() => onSelectAnnotation(ann.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{authorName}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isResolved && isStale(ann.created_at) && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                          title="Thread open >48h"
                        >
                          <Clock className="w-2.5 h-2.5" /> Stale
                        </span>
                      )}
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Check className="w-2.5 h-2.5" /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlighted text snippet */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2 border-l-2 border-amber-400 pl-2 mb-2 bg-amber-50/40 dark:bg-amber-950/20 rounded-r py-0.5">
                    "{ann.highlighted_text}"
                  </div>

                  {/* Root content */}
                  <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed mb-2">
                    {renderContentWithMentions(ann.content)}
                  </p>

                  {/* Thread Actions & Conversation Tree */}
                  <div
                    className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-[10px]">
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
                            <RotateCcw className="w-2.5 h-2.5" /> Reopen
                          </button>
                        )
                      ) : (
                        onResolveAnnotation && (
                          <button
                            type="button"
                            onClick={() => onResolveAnnotation(ann.id)}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer"
                          >
                            <Check className="w-2.5 h-2.5" /> Mark Resolved
                          </button>
                        )
                      )}
                    </div>

                    {hasReplies && (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {ann.replies!.map((r) => renderReplyTree(r, ann.id, 0))}
                      </div>
                    )}

                    {/* Typing presence indicator */}
                    {typistsByAnnotation &&
                      typistsByAnnotation[ann.id] &&
                      typistsByAnnotation[ann.id].length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium py-0.5 animate-pulse">
                          <span className="flex gap-0.5 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                          </span>
                          <span>
                            {typistsByAnnotation[ann.id].map((u) => `@${u}`).join(", ")}{" "}
                            {typistsByAnnotation[ann.id].length > 1
                              ? "are typing..."
                              : "is typing..."}
                          </span>
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

                    {/* Reply Input Box */}
                    <div className="space-y-1 pt-1">
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
