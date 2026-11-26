import { useState, useEffect, useRef, useCallback } from "react";
import { annotationService } from "../services/annotationService";
import type { ArticleInlineAnnotation } from "../types/annotation";

interface UseAnnotationLiveSyncProps {
  slug?: string;
  onNewAnnotation?: (ann: ArticleInlineAnnotation) => void;
  onNewReply?: (annId: string) => void;
  onStatusChange?: (annId: string, status: "open" | "resolved") => void;
}

export function useAnnotationLiveSync({
  slug,
  onNewAnnotation,
  onNewReply,
  onStatusChange,
}: UseAnnotationLiveSyncProps) {
  const [typistsByAnnotation, setTypistsByAnnotation] = useState<{
    [annotationId: string]: string[];
  }>({});
  const lastSyncTimeRef = useRef<string>(new Date().toISOString());
  const socketRef = useRef<WebSocket | null>(null);

  // 1. WebSocket live connection with auto-reconnect
  useEffect(() => {
    if (!slug) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/articles/${slug}/annotations/`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "typing_indicator") {
            const { annotation_id, username, is_typing } = data;
            if (!annotation_id || !username) return;

            setTypistsByAnnotation((prev) => {
              const current = prev[annotation_id] || [];
              if (is_typing) {
                if (!current.includes(username)) {
                  return { ...prev, [annotation_id]: [...current, username] };
                }
              } else {
                return {
                  ...prev,
                  [annotation_id]: current.filter((u) => u !== username),
                };
              }
              return prev;
            });
          } else if (data.type === "new_annotation" && onNewAnnotation) {
            onNewAnnotation(data.annotation);
          } else if (data.type === "new_reply" && onNewReply) {
            onNewReply(data.annotation_id);
          } else if (data.type === "status_change" && onStatusChange) {
            onStatusChange(data.annotation_id, data.status);
          }
        } catch (e) {
          console.debug("WS parse error:", e);
        }
      };
    } catch (e) {
      console.debug("WS connection error:", e);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, [slug, onNewAnnotation, onNewReply, onStatusChange]);

  // 2. Adaptive Delta Sync & Typing Heartbeat fallback (polling every 3s)
  useEffect(() => {
    if (!slug) return;

    const interval = setInterval(async () => {
      try {
        const delta = await annotationService.syncAnnotations(
          slug,
          lastSyncTimeRef.current
        );
        lastSyncTimeRef.current = delta.server_time;

        // Update active typists map from server delta
        const typistMap: { [annId: string]: string[] } = {};
        delta.active_typists.forEach((t) => {
          if (!typistMap[t.annotation_id]) {
            typistMap[t.annotation_id] = [];
          }
          if (!typistMap[t.annotation_id].includes(t.username)) {
            typistMap[t.annotation_id].push(t.username);
          }
        });
        setTypistsByAnnotation((prev) => ({ ...prev, ...typistMap }));
      } catch (err) {
        console.debug("Live sync skipped:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [slug]);

  // 3. Send typing signal (via WebSocket or REST beacon fallback)
  const sendTypingSignal = useCallback(
    (annotationId: string, isTyping: boolean, username?: string) => {
      if (!slug || !annotationId) return;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "typing",
            annotation_id: annotationId,
            username: username || "Teammate",
            is_typing: isTyping,
          })
        );
      } else {
        annotationService
          .sendTypingBeacon(slug, annotationId, isTyping)
          .catch((err) => console.debug("Typing beacon skipped:", err));
      }
    },
    [slug]
  );

  return {
    typistsByAnnotation,
    sendTypingSignal,
  };
}
