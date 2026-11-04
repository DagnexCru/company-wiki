import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AtSign,
  MessageSquare,
  FileCheck2,
  FileClock,
  AlertTriangle,
  FileEdit,
  X,
  ExternalLink,
} from "lucide-react";
import { notificationService } from "../services/notificationService";
import type { Notification, NotificationType } from "../types/notifications";

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  // Keep track of known notification IDs to detect newly arrived notifications for toasts
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Fetch unread count & check for new notifications
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);

      // If count increased and not first load, fetch latest notification for toast alert
      if (initialLoadDoneRef.current && count > 0) {
        const res = await notificationService.getNotifications("unread");
        const newUnread = res.results.find((n) => !knownIdsRef.current.has(n.id));
        if (newUnread) {
          knownIdsRef.current.add(newUnread.id);
          setActiveToast(newUnread);
        }
      }
    } catch {
      // Ignore background poll errors
    }
  }, []);

  // Initial load
  useEffect(() => {
    notificationService
      .getNotifications()
      .then((res) => {
        setUnreadCount(res.unread_count);
        res.results.forEach((n) => knownIdsRef.current.add(n.id));
        initialLoadDoneRef.current = true;
      })
      .catch(() => {
        initialLoadDoneRef.current = true;
      });

    // Background polling every 25 seconds
    const interval = setInterval(refreshUnreadCount, 25000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // Fetch notifications list when dropdown opens or filter changes
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    notificationService
      .getNotifications(filter)
      .then((res) => {
        setNotifications(res.results);
        setUnreadCount(res.unread_count);
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, filter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Mark as Read for single notification
  const handleItemClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
        );
      } catch {
        // Silently continue navigation
      }
    }

    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch {
      // Ignore
    }
  };

  // Helper for notification type icons & styling
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "MENTION":
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <AtSign className="w-3.5 h-3.5" />
          </div>
        );
      case "COMMENT":
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        );
      case "REVIEW_REQUESTED":
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <FileClock className="w-3.5 h-3.5" />
          </div>
        );
      case "REVIEW_APPROVED":
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-3.5 h-3.5" />
          </div>
        );
      case "REVIEW_REJECTED":
        return (
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        );
      case "ARTICLE_UPDATED":
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <FileEdit className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  // Human-readable relative time
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
    <>
      <div className="relative">
        {/* Bell Button */}
        <button
          ref={bellButtonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="View in-app notifications"
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
          title={unreadCount > 0 ? `${unreadCount} unread notification(s)` : "Notifications"}
        >
          <Bell className="w-5 h-5" />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
        </button>

        {/* Dropdown Center */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-brand-400 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-3 pt-2 gap-1 border-b border-slate-800/80 bg-slate-950/30">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                  filter === "all"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                  filter === "unread"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification Stream */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="inline-block w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-2">
                    <CheckCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-300">All caught up!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No {filter === "unread" ? "unread" : ""} collaboration notifications.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3 flex items-start gap-3 transition cursor-pointer ${
                      notif.is_read
                        ? "bg-transparent hover:bg-slate-800/50 text-slate-400"
                        : "bg-brand-950/20 hover:bg-brand-950/30 text-slate-200"
                    }`}
                  >
                    {getNotificationIcon(notif.notification_type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            notif.is_read ? "font-normal text-slate-300" : "font-semibold text-white"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1 shadow-xs shadow-brand-400" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 text-center">
              <span className="text-[10px] text-slate-500">
                Real-time collaboration alerts & @mentions
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating In-App Toast Alert on New Notification */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-brand-500/40 bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/80 p-3.5 animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3">
          {getNotificationIcon(activeToast.notification_type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-brand-400">
                New Alert
              </span>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-white truncate mt-0.5">
              {activeToast.title}
            </p>
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
              {activeToast.message}
            </p>

            {activeToast.link && (
              <button
                type="button"
                onClick={() => {
                  setActiveToast(null);
                  handleItemClick(activeToast);
                }}
                className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition cursor-pointer"
              >
                <span>View document</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
