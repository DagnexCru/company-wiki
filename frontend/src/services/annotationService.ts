import api from "./api";
import type {
  ArticleInlineAnnotation,
  ArticleInlineAnnotationReply,
  CreateAnnotationPayload,
  CreateAnnotationReplyPayload,
  AnnotationStatus,
} from "../types/annotation";

export const annotationService = {
  /**
   * Fetch list of inline annotations for an article.
   * GET /api/v1/articles/{slug}/annotations/?status=open|resolved|all
   */
  async getAnnotations(
    slug: string,
    status: AnnotationStatus | "all" = "all"
  ): Promise<ArticleInlineAnnotation[]> {
    const response = await api.get<ArticleInlineAnnotation[]>(
      `/articles/${slug}/annotations/`,
      { params: { status } }
    );
    return response.data;
  },

  /**
   * Create a new inline annotation attached to a text span.
   * POST /api/v1/articles/{slug}/annotations/
   */
  async createAnnotation(
    slug: string,
    payload: CreateAnnotationPayload
  ): Promise<ArticleInlineAnnotation> {
    const response = await api.post<ArticleInlineAnnotation>(
      `/articles/${slug}/annotations/`,
      payload
    );
    return response.data;
  },

  /**
   * Edit content of an existing annotation.
   * PATCH /api/v1/articles/{slug}/annotations/{id}/
   */
  async updateAnnotation(
    slug: string,
    id: string,
    content: string
  ): Promise<ArticleInlineAnnotation> {
    const response = await api.patch<ArticleInlineAnnotation>(
      `/articles/${slug}/annotations/${id}/`,
      { content }
    );
    return response.data;
  },

  /**
   * Delete an annotation.
   * DELETE /api/v1/articles/{slug}/annotations/{id}/
   */
  async deleteAnnotation(slug: string, id: string): Promise<void> {
    await api.delete(`/articles/${slug}/annotations/${id}/`);
  },

  /**
   * Mark an annotation discussion as resolved.
   * POST /api/v1/articles/{slug}/annotations/{id}/resolve/
   */
  async resolveAnnotation(
    slug: string,
    id: string
  ): Promise<ArticleInlineAnnotation> {
    const response = await api.post<ArticleInlineAnnotation>(
      `/articles/${slug}/annotations/${id}/resolve/`
    );
    return response.data;
  },

  /**
   * Reopen a resolved annotation discussion.
   * POST /api/v1/articles/{slug}/annotations/{id}/reopen/
   */
  async reopenAnnotation(
    slug: string,
    id: string
  ): Promise<ArticleInlineAnnotation> {
    const response = await api.post<ArticleInlineAnnotation>(
      `/articles/${slug}/annotations/${id}/reopen/`
    );
    return response.data;
  },

  /**
   * Realign all inline annotations for an article using Fuzzy Anchor Matching.
   * POST /api/v1/articles/{slug}/annotations/realign/
   */
  async realignAnnotations(slug: string): Promise<{
    article_slug: string;
    realigned_count: number;
    annotations: Array<{
      annotation_id: string;
      highlighted_text: string;
      start_offset: number;
      end_offset: number;
      match_confidence: number;
      is_orphaned: boolean;
    }>;
  }> {
    const response = await api.post(`/articles/${slug}/annotations/realign/`);
    return response.data;
  },

  /**
   * Fetch threaded replies for an inline annotation.
   * GET /api/v1/articles/{slug}/annotations/{annotationId}/replies/
   */
  async getReplies(
    slug: string,
    annotationId: string
  ): Promise<ArticleInlineAnnotationReply[]> {
    const response = await api.get<ArticleInlineAnnotationReply[]>(
      `/articles/${slug}/annotations/${annotationId}/replies/`
    );
    return response.data;
  },

  /**
   * Post a threaded reply to an inline annotation.
   * POST /api/v1/articles/{slug}/annotations/{annotationId}/replies/
   */
  async createReply(
    slug: string,
    annotationId: string,
    payload: CreateAnnotationReplyPayload
  ): Promise<ArticleInlineAnnotationReply> {
    const response = await api.post<ArticleInlineAnnotationReply>(
      `/articles/${slug}/annotations/${annotationId}/replies/`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a reply to an inline annotation.
   * DELETE /api/v1/articles/{slug}/annotations/{annotationId}/replies/{replyId}/
   */
  async deleteReply(
    slug: string,
    annotationId: string,
    replyId: string
  ): Promise<void> {
    await api.delete(
      `/articles/${slug}/annotations/${annotationId}/replies/${replyId}/`
    );
  },

  /**
   * Broadcast or clear typing presence on a specific inline discussion thread.
   * POST /api/v1/articles/{slug}/annotations/typing/
   */
  async sendTypingBeacon(
    slug: string,
    annotationId: string,
    isTyping: boolean
  ): Promise<{
    status: string;
    active_typists: Array<{
      annotation_id: string;
      username: string;
      full_name?: string;
    }>;
  }> {
    const response = await api.post(`/articles/${slug}/annotations/typing/`, {
      annotation_id: annotationId,
      is_typing: isTyping,
    });
    return response.data;
  },

  /**
   * Delta synchronization endpoint returning updated annotations and active typing presence.
   * GET /api/v1/articles/{slug}/annotations/sync/?since=...
   */
  async syncAnnotations(
    slug: string,
    since?: string
  ): Promise<{
    server_time: string;
    active_typists: Array<{
      annotation_id: string;
      username: string;
      full_name?: string;
    }>;
    annotations: ArticleInlineAnnotation[];
  }> {
    const response = await api.get(`/articles/${slug}/annotations/sync/`, {
      params: since ? { since } : {},
    });
    return response.data;
  },
};
