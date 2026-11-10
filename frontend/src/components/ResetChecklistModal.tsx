import React from "react";
import { RotateCcw, AlertTriangle, X } from "lucide-react";

interface ResetChecklistModalProps {
  isOpen: boolean;
  articleTitle: string;
  completedCount: number;
  totalCount: number;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetChecklistModal: React.FC<ResetChecklistModalProps> = ({
  isOpen,
  articleTitle,
  completedCount,
  totalCount,
  isLoading = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Reset SOP Runbook Progress?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Are you sure you want to reset your checklist progress for{" "}
            <strong className="text-slate-900 dark:text-white">
              "{articleTitle}"
            </strong>
            ? This will clear all{" "}
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {completedCount} of {totalCount}
            </span>{" "}
            completed steps and return your completion status back to 0%.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isLoading ? "Resetting..." : "Reset Progress"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
