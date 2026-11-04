import api from "./api";
import type { ArticleComment } from "../types/notifications";

export const commentService = {
  /**
   * Fetch threaded/chronological collaboration comments for an article.
   */
  async getComments(slugOrId: string): Promise<ArticleComment[]> {
    const response = await api.get<ArticleComment[]>(`/articles/${slugOrId}/comments/`);
    return response.data;
  },

  /**
   * Post a new comment on an article.
   * Mentions matching @username will automatically create notifications.
   */
  async postComment(slugOrId: string, content: string): Promise<ArticleComment> {
    const response = await api.post<ArticleComment>(`/articles/${slugOrId}/comments/`, {
      content,
    });
    return response.data;
  },
};
