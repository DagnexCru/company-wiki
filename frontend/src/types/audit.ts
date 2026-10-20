export type AuditActionType =
  | "ARTICLE_CREATE"
  | "ARTICLE_UPDATE"
  | "ARTICLE_DELETE"
  | "ARTICLE_ARCHIVE"
  | "ARTICLE_SUBMIT"
  | "ARTICLE_APPROVE"
  | "ARTICLE_REJECT"
  | "ARTICLE_RESTORE"
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "USER_REGISTER"
  | "USER_ROLE_CHANGE"
  | "USER_STATUS_CHANGE"
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE"
  | "TAG_CREATE"
  | "TAG_UPDATE"
  | "TAG_DELETE";

export interface AuditEvent {
  id: string;
  actor: string | null;
  actor_username: string;
  actor_email?: string;
  actor_role: string;
  action: AuditActionType;
  action_display: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  details?: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditSummary {
  total_events: number;
  events_last_24h: number;
  action_distribution: Record<string, number>;
  resource_distribution: Record<string, number>;
  top_actors: Array<{
    actor__username: string;
    actor__role: string;
    event_count: number;
  }>;
}

export interface AuditFilterParams {
  page?: number;
  page_size?: number;
  action?: string;
  resource_type?: string;
  actor?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginatedAuditResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: AuditEvent[];
}
