import api from "./api";
import type {
  NotificationListResponse,
  MentionUser,
} from "../types/notifications";

export const notificationService = {
  /**
   * Fetch recent notifications with optional filter (e.g. 'unread').
   */
  async getNotifications(filter?: "all" | "unread"): Promise<NotificationListResponse> {
    const params = filter === "unread" ? { filter: "unread" } : {};
    const response = await api.get<NotificationListResponse>("/notifications/", {
      params,
    });
    return response.data;
  },

  /**
   * Fast unread count lookup for bell indicator badge.
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ unread_count: number }>("/notifications/unread-count/");
    return response.data.unread_count;
  },

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(id: string): Promise<{ is_read: boolean; unread_count: number }> {
    const response = await api.post<{ is_read: boolean; unread_count: number }>(
      `/notifications/${id}/read/`
    );
    return response.data;
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ updated_count: number; unread_count: number }> {
    const response = await api.post<{ updated_count: number; unread_count: number }>(
      "/notifications/mark-all-read/"
    );
    return response.data;
  },

  /**
   * Search active team members for @username autocomplete.
   */
  async getMentionSuggestions(query: string): Promise<MentionUser[]> {
    const response = await api.get<MentionUser[]>("/auth/mention-suggestions/", {
      params: { q: query },
    });
    return response.data;
  },
};
