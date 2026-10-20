import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
import type {
  RevisionListItem,
  ArticleRevision,
  RevisionDiffResult,
} from "../types/revision";
import { RevisionDiffViewer } from "../components/RevisionDiffViewer";
import { RestoreConfirmModal } from "../components/RestoreConfirmModal";
import { useAuth } from "../context/AuthContext";

export const ArticleRevisionHistoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

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
  const [activeTab, setActiveTab] = useState<"timeline" | "snapshot" | "diff">("timeline");

  // Restore Modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [targetRestoreRev, setTargetRestoreRev] = useState<number | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await revisionService.getArticleRevisions(slug);
      setRevisions(data);
      if (data.length > 0) {
        // Default select latest revision
        setSelectedRevNum(data[0].revision_number);
        // Default diff setup if 2 or more revisions exist
        if (data.length >= 2) {
          setFromRev(data[1].revision_number);
          setToRev(data[0].revision_number);
        } else {
          setFromRev(data[0].revision_number);
          setToRev(data[0].revision_number);
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
  }, [slug]);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // Load single revision snapshot when selected
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

  // Handle diff comparison execution
  const handleCompareDiff = async () => {
    if (!slug || fromRev === null || toRev === null) return;
    setLoadingDiff(true);
    setError(null);
    try {
      const result = await revisionService.getRevisionDiff(slug, fromRev, toRev);
      setDiffResult(result);
      setActiveTab("diff");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute diff between revisions.";
      setError(msg);
    } finally {
      setLoadingDiff(false);
    }
  };

  // Handle restoration confirm
  const handleRestoreConfirm = async (reason: string) => {
    if (!slug || targetRestoreRev === null) return;
    const res = await revisionService.restoreRevision(slug, targetRestoreRev, reason);
    setRestoreSuccess(
      `Restored from Rev #${res.restored_from_revision}. New Revision #${res.new_revision_number} generated.`
    );
    await fetchRevisions();
    setActiveTab("timeline");
  };

  const openRestoreModal = (revNum: number) => {
    setTargetRestoreRev(revNum);
    setRestoreModalOpen(true);
  };

  const canRestore =
    user?.role === "ADMIN" ||
    (user?.role === "AUTHOR" && selectedSnapshot?.author_username === user.username);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
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
              {slug}
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200">Revision History</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Revision History & Audit
              </h1>
              <p className="text-xs text-slate-500">
                Immutable chronological version snapshots and diff comparisons
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/articles/${slug}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Article
          </Link>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{restoreSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
          Loading revision timeline...
        </div>
      ) : revisions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Revisions Recorded
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            This article has not yet recorded version snapshots.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Diff Selector Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-indigo-500" />
                Compare Versions:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-slate-400">From:</label>
                <select
                  value={fromRev || ""}
                  onChange={(e) => setFromRev(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  {revisions.map((r) => (
                    <option key={r.revision_number} value={r.revision_number}>
                      Rev #{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400">To:</label>
                <select
                  value={toRev || ""}
                  onChange={(e) => setToRev(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                >
                  {revisions.map((r) => (
                    <option key={r.revision_number} value={r.revision_number}>
                      Rev #{r.revision_number} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCompareDiff}
                disabled={loadingDiff || fromRev === null || toRev === null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {loadingDiff ? "Calculating Diff..." : "View Diff"}
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "timeline"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Timeline ({revisions.length})
              </button>
              <button
                onClick={() => setActiveTab("snapshot")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "snapshot"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Snapshot Preview
              </button>
              {diffResult && (
                <button
                  onClick={() => setActiveTab("diff")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === "diff"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Diff (Rev #{diffResult.from_revision} &rarr; #{diffResult.to_revision})
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Timeline List */}
          {activeTab === "timeline" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {revisions.map((rev) => {
                const isSelected = selectedRevNum === rev.revision_number;
                return (
                  <div
                    key={rev.id}
                    className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Left: Revision info */}
                    <div className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          #{rev.revision_number}
                        </span>
                        {rev.is_restoration && (
                          <span className="mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                            Restored
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {rev.title}
                          </h4>
                          {rev.category_name && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <Folder className="w-3 h-3 text-indigo-500" />
                              {rev.category_name}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {rev.change_summary || "Content update"}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {rev.author_username} ({rev.author_role})
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedRevNum(rev.revision_number);
                          setActiveTab("snapshot");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      {canRestore && (
                        <button
                          onClick={() => openRestoreModal(rev.revision_number)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Snapshot Preview */}
          {activeTab === "snapshot" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
              {loadingSnapshot ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-indigo-500" />
                  Loading snapshot...
                </div>
              ) : selectedSnapshot ? (
                <div className="space-y-6">
                  {/* Header snapshot banner */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                          Revision #{selectedSnapshot.revision_number}
                        </span>
                        <span className="text-xs text-slate-500">
                          Captured {new Date(selectedSnapshot.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedSnapshot.title}
                      </h2>
                    </div>

                    {canRestore && (
                      <button
                        onClick={() => openRestoreModal(selectedSnapshot.revision_number)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore this Version
                      </button>
                    )}
                  </div>

                  {/* Summary */}
                  {selectedSnapshot.summary && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {selectedSnapshot.summary}
                    </div>
                  )}

                  {/* Document Markdown Content */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Document Content
                    </h4>
                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                      {selectedSnapshot.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Select a revision from the timeline to preview its snapshot.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Diff Viewer */}
          {activeTab === "diff" && diffResult && (
            <RevisionDiffViewer diff={diffResult} />
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
          articleTitle={selectedSnapshot?.title || slug || "Article"}
        />
      )}
    </div>
  );
};
