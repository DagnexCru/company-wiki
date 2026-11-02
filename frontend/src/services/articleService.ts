import api from "./api";
import type {
  ArticleDetail,
  ArticleFilterParams,
  ArticleInput,
  ArticleListItem,
  ArticleAttachment,
  PaginatedResponse,
} from "../types/article";

export const articleService = {
  /**
   * Fetch paginated list of articles filtered by user role and optional criteria.
   */
  async getArticles(params?: ArticleFilterParams): Promise<PaginatedResponse<ArticleListItem>> {
    const response = await api.get<PaginatedResponse<ArticleListItem>>("/articles/", {
      params,
    });
    return response.data;
  },

  /**
   * Fetch detailed article by unique URL slug.
   */
  async getArticleBySlug(slug: string): Promise<ArticleDetail> {
    const response = await api.get<ArticleDetail>(`/articles/${slug}/`);
    return response.data;
  },

  /**
   * Create a new draft article (Authors and Admins only).
   */
  async createArticle(data: ArticleInput): Promise<ArticleDetail> {
    const response = await api.post<ArticleDetail>("/articles/", data);
    return response.data;
  },

  /**
   * Update an existing article by slug.
   */
  async updateArticle(slug: string, data: Partial<ArticleInput>): Promise<ArticleDetail> {
    const response = await api.put<ArticleDetail>(`/articles/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete a draft article or archive an active article.
   */
  async deleteArticle(slug: string, permanent: boolean = false): Promise<void> {
    await api.delete(`/articles/${slug}/`, {
      params: permanent ? { permanent: "true" } : undefined,
    });
  },

  /**
   * Explicitly archive an article.
   */
  async archiveArticle(slug: string): Promise<{ detail: string; status: string }> {
    const response = await api.post<{ detail: string; status: string }>(
      `/articles/${slug}/archive/`
    );
    return response.data;
  },

  /**
   * Upload media asset (diagram, screenshot, illustration, attachment) for Markdown insertion.
   * Supports drag-and-drop and clipboard paste (Ctrl+V).
   */
  async uploadMedia(file: File, articleId?: string, articleSlug?: string): Promise<ArticleAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    if (articleId) {
      formData.append("article_id", articleId);
    }
    if (articleSlug) {
      formData.append("article_slug", articleSlug);
    }
    const response = await api.post<ArticleAttachment>("/articles/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Fetch all media attachments for a given article.
   */
  async getArticleAttachments(articleId: string): Promise<ArticleAttachment[]> {
    const response = await api.get<ArticleAttachment[]>(`/articles/${articleId}/attachments/`);
    return response.data;
  },

  /**
   * Atomically increment and record view count for an article.
   */
  async recordView(slugOrId: string): Promise<{ view_count: number; slug: string }> {
    const response = await api.post<{ view_count: number; slug: string }>(
      `/articles/${slugOrId}/record-view/`
    );
    return response.data;
  },

  /**
   * Submit or update helpfulness feedback (👍 / 👎) and optional note for authors.
   */
  async submitFeedback(
    slugOrId: string,
    payload: { is_helpful: boolean; note?: string }
  ): Promise<{
    detail: string;
    helpful_count: number;
    unhelpful_count: number;
    helpfulness_score: number;
    user_feedback: {
      id: string;
      is_helpful: boolean;
      note: string;
      updated_at: string;
    };
  }> {
    const response = await api.post(
      `/articles/${slugOrId}/feedback/`,
      payload
    );
    return response.data;
  },

  /**
   * Retrieve list of reader feedback notes for an article (Authors, Reviewers, Admins).
   */
  async getArticleFeedbacks(slugOrId: string): Promise<{
    count: number;
    helpful_count: number;
    unhelpful_count: number;
    helpfulness_score: number;
    results: any[];
  }> {
    const response = await api.get(`/articles/${slugOrId}/feedbacks/`);
    return response.data;
  },
};

// API Service Layer: All requests include SimpleJWT bearer headers automatically via Axios interceptor.
