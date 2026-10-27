import api from "./api";
import type { ArticlePresenceResponse } from "../types/presence";

export const presenceService = {
  /**
   * Send periodic heartbeat beacon renewing viewer presence or active edit lock.
   */
  async sendHeartbeat(
    slugOrId: string,
    clientSessionId: string,
    status: "viewing" | "editing" = "viewing"
  ): Promise<ArticlePresenceResponse> {
    const response = await api.post<ArticlePresenceResponse>(
      `/articles/${slugOrId}/presence/heartbeat/`,
      {
        client_session_id: clientSessionId,
        status,
      }
    );
    return response.data;
  },

  /**
   * Immediately remove presence session upon tab close or component unmount.
   */
  async leave(slugOrId: string, clientSessionId: string): Promise<ArticlePresenceResponse> {
    const response = await api.post<ArticlePresenceResponse>(
      `/articles/${slugOrId}/presence/leave/`,
      { client_session_id: clientSessionId }
    );
    return response.data;
  },

  /**
   * Attempt to acquire or forcefully take over an edit lock.
   */
  async acquireLock(
    slugOrId: string,
    clientSessionId: string,
    force: boolean = false
  ): Promise<ArticlePresenceResponse> {
    const response = await api.post<ArticlePresenceResponse>(
      `/articles/${slugOrId}/presence/acquire-lock/`,
      {
        client_session_id: clientSessionId,
        force,
      }
    );
    return response.data;
  },

  /**
   * Explicitly release edit lock returning user status to viewing.
   */
  async releaseLock(
    slugOrId: string,
    clientSessionId: string
  ): Promise<ArticlePresenceResponse> {
    const response = await api.post<ArticlePresenceResponse>(
      `/articles/${slugOrId}/presence/release-lock/`,
      { client_session_id: clientSessionId }
    );
    return response.data;
  },

  /**
   * Read-only fetch of active viewers and edit lock state.
   */
  async getPresence(slugOrId: string): Promise<ArticlePresenceResponse> {
    const response = await api.get<ArticlePresenceResponse>(
      `/articles/${slugOrId}/presence/`
    );
    return response.data;
  },
};
