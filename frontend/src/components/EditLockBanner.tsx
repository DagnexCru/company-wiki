import React, { useState } from "react";
import { AlertTriangle, Unlock, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import type { EditLockInfo } from "../types/presence";

interface EditLockBannerProps {
  editLock: EditLockInfo;
  onTakeOverLock: () => Promise<boolean | void>;
  isSyncing?: boolean;
}

export const EditLockBanner: React.FC<EditLockBannerProps> = ({
  editLock,
  onTakeOverLock,
  isSyncing = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [takingOver, setTakingOver] = useState(false);

  // If article is not locked, don't show warning
  if (!editLock.is_locked) {
    return null;
  }

  // If locked by current user: show friendly confirmation badge
  if (editLock.is_current_user_lock) {
    return (
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 animate-in fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Edit Lock Active:</strong> Locked to your session. Automatically renewing while you draft.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
          Protected from overwrites
        </span>
      </div>
    );
  }

  // Locked by another user: Soft Edit Lock Conflict Warning Banner!
  const editorName = editLock.locked_by?.full_name || editLock.locked_by?.username || "Another colleague";

  const handleConfirmTakeOver = async () => {
    setTakingOver(true);
    try {
      await onTakeOverLock();
      setShowConfirm(false);
    } finally {
      setTakingOver(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-rose-950/40 to-slate-900 border border-amber-600/50 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Potential Edit Conflict Warning</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-950 text-amber-300 border border-amber-700/60">
                Active Lock
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong>{editorName}</strong> is currently editing this article. Saving changes now may overwrite their work.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Take Over Lock</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-in zoom-in-95 duration-150">
              <span className="text-[11px] text-amber-200">Force takeover?</span>
              <button
                type="button"
                disabled={takingOver || isSyncing}
                onClick={handleConfirmTakeOver}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {takingOver ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                <span>Confirm</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
