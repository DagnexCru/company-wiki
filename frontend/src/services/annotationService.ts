import api from "./api";
import type {
  ArticleInlineAnnotation,
  CreateAnnotationPayload,
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
};
