import api from "./api";
import type {
  ArticleChecklistProgress,
  ChecklistTogglePayload,
  MyChecklistsResponse,
  TeamComplianceResponse,
  SopCertificateData,
} from "../types/checklist";

export const checklistService = {
  /**
   * Fetch team compliance report for an article (Admins, Reviewers, Author).
   */
  async getTeamCompliance(slug: string): Promise<TeamComplianceResponse> {
    const response = await api.get<TeamComplianceResponse>(`/articles/${slug}/team-checklist-status/`);
    return response.data;
  },

  /**
   * Retrieve verifiable certificate metadata for a 100% completed SOP runbook.
   */
  async getCertificate(slug: string): Promise<SopCertificateData> {
    const response = await api.get<SopCertificateData>(`/articles/${slug}/checklist-certificate/`);
    return response.data;
  },

  /**
   * Fetch all active and completed SOP checklists for the authenticated user.
   */
  async getMyChecklists(filter?: "all" | "in_progress" | "completed"): Promise<MyChecklistsResponse> {
    const response = await api.get<MyChecklistsResponse>("/articles/my-checklists/", {
      params: filter && filter !== "all" ? { filter } : undefined,
    });
    return response.data;
  },

  /**
   * Fetch current user's checklist progress for a specific article.
   */
  async getChecklistProgress(slug: string): Promise<ArticleChecklistProgress> {
    const response = await api.get<ArticleChecklistProgress>(`/articles/${slug}/checklist-progress/`);
    return response.data;
  },

  /**
   * Toggle completion state of a specific checklist item in the article.
   */
  async toggleChecklistItem(slug: string, payload: ChecklistTogglePayload): Promise<ArticleChecklistProgress> {
    const response = await api.post<ArticleChecklistProgress>(`/articles/${slug}/checklist-toggle/`, payload);
    return response.data;
  },

  /**
   * Reset all checklist progress for this article back to 0.
   */
  async resetChecklistProgress(slug: string): Promise<ArticleChecklistProgress> {
    const response = await api.post<ArticleChecklistProgress>(`/articles/${slug}/checklist-reset/`, {});
    return response.data;
  },
};
