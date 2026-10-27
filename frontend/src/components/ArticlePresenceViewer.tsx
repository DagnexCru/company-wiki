import React from "react";
import { Eye, Edit3 } from "lucide-react";
import type { PresenceUser, EditLockInfo } from "../types/presence";

interface ArticlePresenceViewerProps {
  viewers: PresenceUser[];
  activeCount: number;
  editLock?: EditLockInfo;
  className?: string;
}

export const ArticlePresenceViewer: React.FC<ArticlePresenceViewerProps> = ({
  viewers,
  activeCount,
  editLock,
  className = "",
}) => {
  if (viewers.length === 0) return null;

  // Max avatars to show directly before "+N" overflow chip
  const maxDisplay = 5;
  const displayedViewers = viewers.slice(0, maxDisplay);
  const overflowCount = Math.max(0, viewers.length - maxDisplay);

  const getInitials = (user: PresenceUser) => {
    if (user.full_name && user.full_name.trim()) {
      const parts = user.full_name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (user.username || "??").substring(0, 2).toUpperCase();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* Live Presence Avatars Stack */}
      <div className="flex items-center -space-x-2 overflow-hidden py-1">
        {displayedViewers.map((viewer) => {
          const isEditing = viewer.status === "editing";
          return (
            <div
              key={viewer.client_session_id}
              className="relative inline-block transition-transform hover:scale-110 hover:z-10 group cursor-default"
              title={`${viewer.full_name || viewer.username} (${viewer.user_role}) - ${
                isEditing ? "Currently editing draft" : "Viewing now"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs border-2 border-slate-900 transition-colors ${
                  isEditing ? "ring-2 ring-pink-500 animate-pulse" : ""
                }`}
                style={{ backgroundColor: viewer.avatar_color }}
              >
                {getInitials(viewer)}
              </div>

              {/* Status Dot */}
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
                  isEditing ? "bg-pink-500 animate-ping" : "bg-emerald-400"
                }`}
              />

              {/* Hover Floating Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                <div className="bg-slate-900 border border-slate-700 text-white text-[11px] rounded-lg px-2.5 py-1 shadow-lg whitespace-nowrap flex items-center gap-1.5">
                  {isEditing ? (
                    <Edit3 className="w-3 h-3 text-pink-400 shrink-0" />
                  ) : (
                    <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold">{viewer.full_name || viewer.username}</span>
                  <span className="text-slate-400">({viewer.user_role})</span>
                  <span className="text-slate-500">·</span>
                  <span className={isEditing ? "text-pink-300 font-medium" : "text-emerald-400"}>
                    {isEditing ? "Editing" : "Viewing"}
                  </span>
                </div>
                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1" />
              </div>
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div
            className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 text-slate-300 text-[10px] font-bold flex items-center justify-center shadow-xs"
            title={`${overflowCount} more colleagues viewing`}
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Viewing Label with Pulsing Indicator */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-medium text-slate-300">
          {activeCount === 1 ? "1 viewing now" : `${activeCount} viewing now`}
        </span>
      </div>

      {/* Real-time Draft Edit Warning Badge in Detail Page */}
      {editLock?.is_locked && (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            editLock.is_current_user_lock
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
              : "bg-pink-950/40 text-pink-300 border-pink-800/60 animate-pulse"
          }`}
          title={editLock.warning_message || undefined}
        >
          <Edit3 className="w-3 h-3 text-pink-400" />
          <span>
            {editLock.is_current_user_lock
              ? "You hold edit lock"
              : `${editLock.locked_by?.full_name || editLock.locked_by?.username} editing`}
          </span>
        </div>
      )}
    </div>
  );
};
