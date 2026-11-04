import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  History,
  ArrowLeft,
  GitCompare,
  RotateCcw,
  Eye,
  Calendar,
  User,
  Tag as TagIcon,
  Folder,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { revisionService } from "../services/revisionService";
import { articleService } from "../services/articleService";
import type {
  RevisionListItem,
  ArticleRevision,
  RevisionDiffResult,
} from "../types/revision";
import type { ArticleDetail } from "../types/article";
import { RevisionDiffViewer } from "../components/RevisionDiffViewer";
import { RestoreConfirmModal } from "../components/RestoreConfirmModal";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { useAuth } from "../context/AuthContext";

export const ArticleRevisionHistoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [revisions, setRevisions] = useState<RevisionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected for Snapshot Preview
  const [selectedRevNum, setSelectedRevNum] = useState<number | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ArticleRevision | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  // Diff comparison states
  const [fromRev, setFromRev] = useState<number | null>(null);
  const [toRev, setToRev] = useState<number | null>(null);
  const [diffResult, setDiffResult] = useState<RevisionDiffResult | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "timeline" | "snapshot">("diff");

  // Restore Modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [targetRestoreRev, setTargetRestoreRev] = useState<number | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // 1. Fetch revisions list & article summary
  const fetchRevisions = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch article detail and revisions
      const [articleData, revsData] = await Promise.all([
        articleService.getArticleBySlug(slug).catch(() => null),
        revisionService.getArticleRevisions(slug),
      ]);

      if (articleData) setArticle(articleData);
      setRevisions(revsData);

      if (revsData.length > 0) {
        setSelectedRevNum(revsData[0].revision_number);

        // Check if query params specified 'from' and 'to'
        const qFrom = searchParams.get("from");
        const qTo = searchParams.get("to");

        let initialFrom = revsData.length >= 2 ? revsData[1].revision_number : revsData[0].revision_number;
        let initialTo = revsData[0].revision_number;

        if (qFrom && qTo) {
          const parsedFrom = parseInt(qFrom, 10);
          const parsedTo = parseInt(qTo, 10);
          if (!isNaN(parsedFrom) && !isNaN(parsedTo)) {
            initialFrom = parsedFrom;
            initialTo = parsedTo;
          }
        }

        setFromRev(initialFrom);
        setToRev(initialTo);

        // Automatically load initial diff if 2 or more revisions exist
        if (revsData.length >= 2 || (qFrom && qTo)) {
          try {
            setLoadingDiff(true);
            const diffData = await revisionService.getRevisionDiff(slug, initialFrom, initialTo);
            setDiffResult(diffData);
            setActiveTab("diff");
          } catch (dErr) {
            console.warn("Could not calculate initial diff", dErr);
            setActiveTab("timeline");
          } finally {
            setLoadingDiff(false);
          }
        } else {
          setActiveTab("timeline");
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load revisions. Readers cannot access revision history.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [slug, searchParams]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // 2. Load single revision snapshot when selected
  useEffect(() => {
    if (!slug || selectedRevNum === null) return;
    const loadSnapshot = async () => {
      setLoadingSnapshot(true);
      try {
        const snap = await revisionService.getArticleRevision(slug, selectedRevNum);
        setSelectedSnapshot(snap);
      } catch (err: unknown) {
        console.error("Failed to load revision snapshot:", err);
      } finally {
        setLoadingSnapshot(false);
      }
    };
    loadSnapshot();
  }, [slug, selectedRevNum]);

  // 3. Handle diff comparison execution
  const executeDiff = async (from: number, to: number) => {
    if (!slug) return;
    setLoadingDiff(true);
    setError(null);
    try {
      const result = await revisionService.getRevisionDiff(slug, from, to);
      setDiffResult(result);
      setFromRev(from);
      setToRev(to);
      setActiveTab("diff");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute diff between revisions.";
      setError(msg);
    } finally {
      setLoadingDiff(false);
    }
  };

  const handleCompareClick = () => {
    if (fromRev !== null && toRev !== null) {
      executeDiff(fromRev, toRev);
    }
  };

  // 4. Handle non-destructive restoration confirmation
  const handleRestoreConfirm = async (reason: string) => {
    if (!slug || targetRestoreRev === null) return;
    const res = await revisionService.restoreRevision(slug, targetRestoreRev, reason);
    setRestoreSuccess(
      `Restored from Rev #${res.restored_from_revision}. New Revision #${res.new_revision_number} generated without data loss.`
    );
    await fetchRevisions();
    setActiveTab("timeline");
    setTimeout(() => setRestoreSuccess(null), 8000);
  };

  const openRestoreModal = (revNum: number) => {
    setTargetRestoreRev(revNum);
    setRestoreModalOpen(true);
  };

  const isAuthor = Boolean(article && user && article.author.id === user.id);
  const canRestore = Boolean(
    user?.role === "ADMIN" ||
      (isAuthor && (article?.status === "draft" || article?.status === "rejected"))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              to="/articles"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              Articles
            </Link>
            <span>/</span>
            <Link
              to={`/articles/${slug}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {article?.title || slug}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Revision History & Diff</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Revision History & Visual Diff
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Line-by-line visual diff comparison and non-destructive version rollback
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/articles/${slug}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Article
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {restoreSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-0.5">
            <p className="font-bold">Roll-Forward Version Created Successfully</p>
            <p>{restoreSuccess}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400 text-sm space-y-3">
          <Clock className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
          <p className="font-medium">Loading revision history and snapshots...</p>
        </div>
      ) : revisions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Revisions Recorded
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            This article has not yet saved sequential revision snapshots.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Diff Selector Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-indigo-500" />
                Compare Versions:
              </span>

              {/* From Selector */}
              <div className="flex items-center gap-1.5">
                <label className="text-slate-400 font-medium">From:</label>
                <select
                  value={fromRev ?? ""}
                  onChange={(e) => setFromRev(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  {revisions.map((r) => (
                    <option key={r.revision_number} value={r.revision_number}>
                      Rev #{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Selector */}
              <div className="flex items-center gap-1.5">
                <label className="text-slate-400 font-medium">To:</label>
                <select
                  value={toRev ?? ""}
                  onChange={(e) => setToRev(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  {revisions.map((r) => (
                    <option key={r.revision_number} value={r.revision_number}>
                      Rev #{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCompareClick}
                disabled={loadingDiff || fromRev === null || toRev === null}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{loadingDiff ? "Computing Diff..." : "View Diff"}</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold overflow-x-auto max-w-full">
              {diffResult && (
                <button
                  type="button"
                  onClick={() => setActiveTab("diff")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === "diff"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Diff (Rev #{diffResult.from_revision} &rarr; #{diffResult.to_revision})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === "timeline"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Timeline ({revisions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("snapshot")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === "snapshot"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Snapshot Preview</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Visual Diff View */}
          {activeTab === "diff" && diffResult && (
            <RevisionDiffViewer
              diff={diffResult}
              canRestore={canRestore}
              onRestore={(revNum) => openRestoreModal(revNum)}
              onSwapRevisions={(from, to) => executeDiff(from, to)}
            />
          )}

          {/* TAB 2: Revision Timeline with Quick Diff & One-Click Rollback */}
          {activeTab === "timeline" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {revisions.map((rev, idx) => {
                const isSelected = selectedRevNum === rev.revision_number;
                const prevRev = revisions[idx + 1];

                return (
                  <div
                    key={rev.id}
                    className={`p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Left: Revision info */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                          #{rev.revision_number}
                        </span>
                        {rev.is_restoration && (
                          <span className="mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase tracking-wider">
                            Rollback
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {rev.title}
                          </h4>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Current Version
                            </span>
                          )}
                          {rev.category_name && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              <Folder className="w-3 h-3 text-indigo-500" />
                              {rev.category_name}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {rev.change_summary || "Document content revision"}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{rev.author_username}</span>
                            <span className="text-[10px]">({rev.author_role})</span>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(rev.created_at).toLocaleString()}
                          </span>
                          {rev.tags_snapshot && rev.tags_snapshot.length > 0 && (
                            <>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1">
                                <TagIcon className="w-3.5 h-3.5" />
                                {rev.tags_snapshot.join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Compare with previous revision shortcut */}
                      {prevRev && (
                        <button
                          type="button"
                          onClick={() => executeDiff(prevRev.revision_number, rev.revision_number)}
                          title={`Compare Rev #${rev.revision_number} with previous Rev #${prevRev.revision_number}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>Diff vs #{prevRev.revision_number}</span>
                        </button>
                      )}

                      {/* Snapshot preview */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRevNum(rev.revision_number);
                          setActiveTab("snapshot");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {/* One-Click Restore / Rollback */}
                      {canRestore && (
                        <button
                          type="button"
                          onClick={() => openRestoreModal(rev.revision_number)}
                          title={`Restore this version roll-forward without data loss`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold shadow-xs shadow-amber-500/20 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Snapshot Preview with Rich Markdown */}
          {activeTab === "snapshot" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
              {loadingSnapshot ? (
                <div className="py-16 text-center text-slate-400 text-sm space-y-2">
                  <Clock className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
                  <p>Loading version snapshot...</p>
                </div>
              ) : selectedSnapshot ? (
                <div className="space-y-6">
                  {/* Header snapshot banner */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Revision #{selectedSnapshot.revision_number}
                        </span>
                        <span className="text-xs text-slate-500">
                          Captured {new Date(selectedSnapshot.created_at).toLocaleString()} by {selectedSnapshot.author_username}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {selectedSnapshot.title}
                      </h2>
                    </div>

                    {canRestore && (
                      <button
                        type="button"
                        onClick={() => openRestoreModal(selectedSnapshot.revision_number)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore this Revision</span>
                      </button>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedSnapshot.summary && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {selectedSnapshot.summary}
                    </div>
                  )}

                  {/* Rendered Markdown Document Content */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Rendered Snapshot Document
                    </h4>
                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                      <MarkdownViewer content={selectedSnapshot.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Select a revision from the timeline to preview its snapshot.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {targetRestoreRev !== null && (
        <RestoreConfirmModal
          isOpen={restoreModalOpen}
          onClose={() => setRestoreModalOpen(false)}
          onConfirm={handleRestoreConfirm}
          targetRevisionNumber={targetRestoreRev}
          articleTitle={selectedSnapshot?.title || article?.title || slug || "Article"}
        />
      )}
    </div>
  );
};

export default ArticleRevisionHistoryPage;
