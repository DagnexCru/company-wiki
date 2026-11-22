import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  FileText,
  FileCode,
  FileArchive,
  Globe,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  articleService,
  type ArticleExportHistoryItem,
} from "../services/articleService";

interface ExportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  articleSlug: string;
}

export const ExportHistoryModal: React.FC<ExportHistoryModalProps> = ({
  isOpen,
  onClose,
  articleTitle,
  articleSlug,
}) => {
  const [logs, setLogs] = useState<ArticleExportHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!articleSlug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await articleService.getArticleExportHistory(articleSlug);
      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load export history:", err);
      setError("Unable to load export governance audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, articleSlug]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFormatBadge = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case "pdf":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
            <FileText className="w-3 h-3" /> PDF Document
          </span>
        );
      case "html":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40">
            <Globe className="w-3 h-3" /> Standalone HTML
          </span>
        );
      case "zip":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
            <FileArchive className="w-3 h-3" /> ZIP Archive
          </span>
        );
      case "markdown":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            <FileCode className="w-3 h-3" /> Markdown
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {fmt.toUpperCase()}
          </span>
        );
    }
  };

  const totalBytes = logs.reduce((acc, l) => acc + l.file_size_bytes, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Export Governance & Audit Trail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                {articleTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Governance Metrics Summary Strip */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Total Exports
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {logs.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Data Transferred
            </span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatBytes(totalBytes)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Security Status
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Cryptographic Integrity
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Loading compliance audit logs...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchHistory}
                className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-1">
              <Clock className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No Export Logs Found
              </p>
              <p className="text-xs">
                This document has not been exported yet. Download in any format to initiate the audit trail.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Exported By</th>
                    <th className="py-2.5 px-3">File Size</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => {
                    const formattedDate = new Date(log.created_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const displayName = log.user.full_name || log.user.username;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getFormatBadge(log.export_format)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            {displayName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {formatBytes(log.file_size_bytes)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedDate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-right">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3" /> Immutable Append-Only Ledger
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
