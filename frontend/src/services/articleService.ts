import api from "./api";
import type {
  ArticleDetail,
  ArticleFilterParams,
  ArticleInput,
  ArticleListItem,
  ArticleAttachment,
  PaginatedResponse,
} from "../types/article";

export interface PdfExportOptions {
  includeCover?: boolean;
  watermark?: boolean;
  watermarkText?: string;
  classification?: "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "PUBLIC";
  includeToc?: boolean;
}

export interface PdfPreviewMetadata {
  slug: string;
  title: string;
  author: string;
  category: string;
  classification: "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "PUBLIC";
  watermark_enabled: boolean;
  watermark_text: string;
  include_cover: boolean;
  include_toc: boolean;
  total_estimated_pages: number;
  headings: Array<{ level: number; title: string }>;
  element_counts: {
    code_blocks: number;
    callouts: number;
    tables: number;
    images: number;
    headings: number;
  };
  pages: Array<{
    page_number: number;
    type: "cover" | "toc" | "content";
    title: string;
    badge: string;
    preview_description: string;
  }>;
}

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

  /**
   * Multi-Format Export Suite: Download article in PDF, HTML, ZIP, or Markdown format.
   * GET /api/v1/articles/{slug}/export/?format=pdf|html|zip|markdown
   */
  async exportArticleDocument(
    slug: string,
    format: "pdf" | "html" | "zip" | "markdown" = "markdown",
    options?: PdfExportOptions
  ): Promise<void> {
    const params: Record<string, any> = { format };
    if (format === "pdf" && options) {
      if (options.includeCover !== undefined) params.include_cover = options.includeCover;
      if (options.watermark !== undefined) params.watermark = options.watermark;
      if (options.watermarkText) params.watermark_text = options.watermarkText;
      if (options.classification) params.classification = options.classification;
      if (options.includeToc !== undefined) params.include_toc = options.includeToc;
    }

    const response = await api.get(`/articles/${slug}/export/`, {
      params,
      responseType: "blob",
    });

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      html: "text/html;charset=utf-8;",
      zip: "application/zip",
      markdown: "text/markdown;charset=utf-8;",
    };

    const extensions: Record<string, string> = {
      pdf: "pdf",
      html: "html",
      zip: "zip",
      markdown: "md",
    };

    const blob = new Blob([response.data], {
      type: mimeTypes[format] || "text/plain;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const ext = extensions[format] || format;
    const downloadFilename = format === "zip" ? `${slug}_bundle.zip` : `${slug}.${ext}`;
    link.setAttribute("download", downloadFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Fetch interactive PDF page preview metadata and document metrics.
   * GET /api/v1/articles/{slug}/export/preview/
   */
  async getPdfPreviewMetadata(
    slug: string,
    options?: PdfExportOptions
  ): Promise<PdfPreviewMetadata> {
    const params: Record<string, any> = {};
    if (options) {
      if (options.includeCover !== undefined) params.include_cover = options.includeCover;
      if (options.watermark !== undefined) params.watermark = options.watermark;
      if (options.watermarkText) params.watermark_text = options.watermarkText;
      if (options.classification) params.classification = options.classification;
      if (options.includeToc !== undefined) params.include_toc = options.includeToc;
    }
    const response = await api.get<PdfPreviewMetadata>(`/articles/${slug}/export/preview/`, { params });
    return response.data;
  },

  /**
   * Preview the Standalone Self-Contained Offline HTML document in a new browser tab.
   * Fetches the rendered HTML blob and opens it via window.URL.createObjectURL.
   */
  async previewStandaloneHtml(slug: string): Promise<void> {
    const response = await api.get(`/articles/${slug}/export/`, {
      params: { format: "html" },
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/html;charset=utf-8;" });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  },
};

// API Service Layer: All requests include SimpleJWT bearer headers automatically via Axios interceptor.
