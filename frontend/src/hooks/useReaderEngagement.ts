import { useEffect, useRef, useState } from "react";
import { analyticsService } from "../services/analyticsService";

interface UseReaderEngagementOptions {
  slug?: string;
  heartbeatIntervalMs?: number;
  enabled?: boolean;
}

/**
 * useReaderEngagement:
 * Silently observes reading duration and scroll depth percentage milestones.
 * Transmits non-blocking telemetry heartbeats to the analytics backend.
 */
export function useReaderEngagement({
  slug,
  heartbeatIntervalMs = 15000,
  enabled = true,
}: UseReaderEngagementOptions) {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);

  const activeSecondsRef = useRef(0);
  const maxScrollDepthRef = useRef(0);
  const lastPingedSecondsRef = useRef(0);
  const lastPingedDepthRef = useRef(0);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!slug || !enabled) return;

    // 1. Session ID creation or retrieval
    const storageKey = `eng_sess_${slug}`;
    let sid = sessionStorage.getItem(storageKey);
    if (!sid) {
      sid = `eng_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      sessionStorage.setItem(storageKey, sid);
    }
    sessionIdRef.current = sid;

    // 2. Active reading seconds timer (increments every second only if document is visible)
    const secondTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        activeSecondsRef.current += 1;
        setActiveSeconds(activeSecondsRef.current);
      }
    }, 1000);

    // 3. Scroll depth tracker
    let scrollRafId: number | null = null;
    const handleScroll = () => {
      if (scrollRafId !== null) return;
      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = null;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollable = docHeight - winHeight;

        let depthPercent = 0;
        if (scrollable <= 0) {
          depthPercent = 100;
        } else {
          depthPercent = Math.min(100, Math.max(0, Math.round(((scrollTop + winHeight * 0.4) / docHeight) * 100)));
        }

        if (depthPercent > maxScrollDepthRef.current) {
          maxScrollDepthRef.current = depthPercent;
          setMaxScrollDepth(depthPercent);
        }
      });
    };

    // Calculate initial depth once on mount
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 4. Send ping helper
    const sendPing = async () => {
      const currentSecs = activeSecondsRef.current;
      const currentDepth = maxScrollDepthRef.current;

      // Only ping if something changed since last ping
      if (
        currentSecs === lastPingedSecondsRef.current &&
        currentDepth === lastPingedDepthRef.current &&
        currentSecs > 0
      ) {
        return;
      }

      lastPingedSecondsRef.current = currentSecs;
      lastPingedDepthRef.current = currentDepth;

      try {
        await analyticsService.pingEngagement(slug, {
          session_id: sessionIdRef.current,
          active_seconds: currentSecs,
          scroll_percentage: currentDepth,
        });
      } catch {
        // Silently catch network errors to never degrade reader UX
      }
    };

    // Initial ping after 3 seconds of reading
    const initialTimeout = setTimeout(() => {
      sendPing();
    }, 3000);

    // Periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        sendPing();
      }
    }, heartbeatIntervalMs);

    // Flush ping on unmount or page departure
    const handlePageDeparture = () => {
      sendPing();
    };

    window.addEventListener("beforeunload", handlePageDeparture);
    window.addEventListener("pagehide", handlePageDeparture);

    return () => {
      clearInterval(secondTimer);
      clearInterval(heartbeatInterval);
      clearTimeout(initialTimeout);
      if (scrollRafId !== null) {
        window.cancelAnimationFrame(scrollRafId);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handlePageDeparture);
      window.removeEventListener("pagehide", handlePageDeparture);
      // Final flush
      sendPing();
    };
  }, [slug, enabled, heartbeatIntervalMs]);

  return {
    activeSeconds,
    maxScrollDepth,
  };
}
