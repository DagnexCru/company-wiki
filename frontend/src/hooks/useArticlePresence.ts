import { useState, useEffect, useCallback, useMemo } from "react";
import { presenceService } from "../services/presenceService";
import { useAuth } from "../context/AuthContext";
import type { PresenceUser, EditLockInfo, ArticlePresenceResponse } from "../types/presence";

interface UseArticlePresenceOptions {
  slugOrId?: string;
  mode?: "viewing" | "editing";
  heartbeatIntervalMs?: number;
  autoStart?: boolean;
}

export function useArticlePresence({
  slugOrId,
  mode = "viewing",
  heartbeatIntervalMs = 10000,
  autoStart = true,
}: UseArticlePresenceOptions) {
  const { user } = useAuth();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const [editLock, setEditLock] = useState<EditLockInfo>({
    is_locked: false,
    locked_by: null,
    is_current_user_lock: false,
    expires_in_seconds: 0,
    warning_message: null,
  });
  const [activeCount, setActiveCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // Generate unique browser tab session ID
  const clientSessionId = useMemo(() => {
    return `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  }, []);

  const handlePresenceUpdate = useCallback((data: ArticlePresenceResponse) => {
    setViewers(data.viewers);
    setActiveCount(data.active_count);
    setEditLock(data.edit_lock);
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!slugOrId || !user) return;
    try {
      setIsSyncing(true);
      const data = await presenceService.sendHeartbeat(slugOrId, clientSessionId, mode);
      handlePresenceUpdate(data);
      setLockError(null);
    } catch (err: unknown) {
      console.warn("Presence heartbeat skipped:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [slugOrId, user, clientSessionId, mode, handlePresenceUpdate]);

  const acquireLock = useCallback(
    async (force: boolean = false) => {
      if (!slugOrId) return;
      try {
        setIsSyncing(true);
        const data = await presenceService.acquireLock(slugOrId, clientSessionId, force);
        handlePresenceUpdate(data);
        setLockError(null);
        return true;
      } catch (err: any) {
        const msg = err.response?.data?.error || "Failed to acquire edit lock.";
        setLockError(msg);
        if (err.response?.data?.edit_lock) {
          setEditLock(err.response.data.edit_lock);
        }
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [slugOrId, clientSessionId, handlePresenceUpdate]
  );

  const releaseLock = useCallback(async () => {
    if (!slugOrId) return;
    try {
      const data = await presenceService.releaseLock(slugOrId, clientSessionId);
      handlePresenceUpdate(data);
    } catch (err) {
      console.warn("Failed to release lock cleanly:", err);
    }
  }, [slugOrId, clientSessionId, handlePresenceUpdate]);

  // Heartbeat Timer Lifecycle
  useEffect(() => {
    if (!autoStart || !slugOrId || !user) return;

    // Send initial beacon
    sendHeartbeat();

    // Recurring interval timer
    const intervalId = setInterval(sendHeartbeat, heartbeatIntervalMs);

    // Leave on unload or unmount
    const handleBeforeUnload = () => {
      presenceService.leave(slugOrId, clientSessionId).catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      presenceService.leave(slugOrId, clientSessionId).catch(() => {});
    };
  }, [autoStart, slugOrId, user, sendHeartbeat, heartbeatIntervalMs, clientSessionId]);

  // Derived state: Active editors currently modifying draft
  const activeEditors = useMemo(() => {
    return viewers.filter((v) => v.status === "editing");
  }, [viewers]);

  // Other active colleagues (excluding current user session)
  const otherViewers = useMemo(() => {
    return viewers.filter((v) => v.client_session_id !== clientSessionId);
  }, [viewers, clientSessionId]);

  return {
    viewers,
    otherViewers,
    activeEditors,
    activeCount,
    editLock,
    isSyncing,
    lockError,
    clientSessionId,
    acquireLock,
    releaseLock,
    refreshPresence: sendHeartbeat,
  };
}
