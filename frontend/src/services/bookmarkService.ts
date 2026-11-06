import api from "./api";
import type {
  BookmarkListResponse,
  BookmarkStatusResponse,
  ToggleBookmarkPayload,
  ToggleBookmarkResponse,
} from "../types/bookmark";

export const bookmarkService = {
  /**
   * Fetch all bookmarks for the authenticated user, optionally filtered by collection name or search keyword.
   */
  async getBookmarks(params?: { collection?: string; search?: string }): Promise<BookmarkListResponse> {
    const response = await api.get<BookmarkListResponse>("/articles/bookmarks/", { params });
    return response.data;
  },

  /**
   * Check bookmark status for a specific article slug.
   */
  async getBookmarkStatus(slug: string): Promise<BookmarkStatusResponse> {
    const response = await api.get<BookmarkStatusResponse>(`/articles/${slug}/bookmark-status/`);
    return response.data;
  },

  /**
   * Toggle or update bookmark on an article.
   */
  async toggleBookmark(slug: string, payload?: ToggleBookmarkPayload): Promise<ToggleBookmarkResponse> {
    const response = await api.post<ToggleBookmarkResponse>(`/articles/${slug}/bookmark/`, payload || {});
    return response.data;
  },
};
