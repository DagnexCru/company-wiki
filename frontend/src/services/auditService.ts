import api from "./api";
import type {
  AuditEvent,
  AuditSummary,
  AuditFilterParams,
  PaginatedAuditResponse,
} from "../types/audit";

export const auditService = {
  /**
   * Fetch paginated system audit events with server-side filters.
   * GET /api/v1/audit/events/
   */
  async getAuditEvents(params?: AuditFilterParams): Promise<PaginatedAuditResponse> {
    const response = await api.get<PaginatedAuditResponse>("/audit/events/", {
      params,
    });
    return response.data;
  },

  /**
   * Fetch a single audit event record with sanitized details.
   * GET /api/v1/audit/events/{id}/
   */
  async getAuditEvent(id: string): Promise<AuditEvent> {
    const response = await api.get<AuditEvent>(`/audit/events/${id}/`);
    return response.data;
  },

  /**
   * Fetch summary metrics and event distributions for admin dashboard.
   * GET /api/v1/audit/events/summary/
   */
  async getAuditSummary(): Promise<AuditSummary> {
    const response = await api.get<AuditSummary>("/audit/events/summary/");
    return response.data;
  },
};

export default auditService;
