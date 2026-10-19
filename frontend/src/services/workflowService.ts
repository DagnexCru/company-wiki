import api from "./api";
import type { PaginatedResponse } from "../types/article";
import type {
  ReviewDecisionInput,
  ReviewQueueItem,
  ReviewRecord,
  SubmitForReviewInput,
} from "../types/workflow";

export interface WorkflowTransitionResponse {
  detail: string;
  status: string;
  status_display: string;
  submitted_at?: string;
  published_at?: string;
  rejection_reason?: string;
}

export const workflowService = {
  /**
   * Fetch articles currently in the review queue (Reviewers and Admins only).
   */
  async getReviewQueue(params?: {
    search?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ReviewQueueItem>> {
    const response = await api.get<PaginatedResponse<ReviewQueueItem>>("/workflows/queue/", {
      params,
    });
    return response.data;
  },

  /**
   * Fetch system-wide recent workflow events (Reviewers and Admins only).
   */
  async getWorkflowHistory(): Promise<ReviewRecord[]> {
    const response = await api.get<ReviewRecord[]>("/workflows/history/");
    return response.data;
  },

  /**
   * Submit a draft or rejected article for editorial review.
   */
  async submitForReview(slug: string, data?: SubmitForReviewInput): Promise<WorkflowTransitionResponse> {
    const response = await api.post<WorkflowTransitionResponse>(`/articles/${slug}/submit/`, data || {});
    return response.data;
  },

  /**
   * Approve an article in review and publish it.
   */
  async approveArticle(slug: string, data?: Partial<ReviewDecisionInput>): Promise<WorkflowTransitionResponse> {
    const response = await api.post<WorkflowTransitionResponse>(`/articles/${slug}/approve/`, data || {});
    return response.data;
  },

  /**
   * Reject an article in review with mandatory feedback for revisions.
   */
  async rejectArticle(slug: string, data: ReviewDecisionInput): Promise<WorkflowTransitionResponse> {
    const response = await api.post<WorkflowTransitionResponse>(`/articles/${slug}/reject/`, data);
    return response.data;
  },

  /**
   * Retrieve chronological review history and decision records for an article.
   */
  async getArticleReviews(slug: string): Promise<ReviewRecord[]> {
    const response = await api.get<ReviewRecord[]>(`/articles/${slug}/reviews/`);
    return response.data;
  },
};

export default workflowService;
