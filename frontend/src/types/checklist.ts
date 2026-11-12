/**
 * Type definitions for Article SOP Checklists and Task Progress Tracking.
 */

export interface ArticleChecklistProgress {
  id?: string | null;
  article: string;
  article_id?: string;
  article_slug?: string;
  article_title?: string;
  article_summary?: string;
  article_category_name?: string;
  article_reading_time?: number;
  checked_items: string[];
  total_items: number;
  completed_count: number;
  remaining_items?: number;
  is_completed: boolean;
  completion_percentage: number;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MyChecklistsResponse {
  count: number;
  results: ArticleChecklistProgress[];
}

export interface TeamMemberChecklistStatus {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  status: "completed" | "in_progress" | "not_started";
  completed_count: number;
  total_items: number;
  completion_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string | null;
}

export interface TeamComplianceStats {
  total_assigned: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  compliance_rate: number;
}

export interface TeamComplianceResponse {
  article_id: string;
  article_slug: string;
  article_title: string;
  total_items: number;
  stats: TeamComplianceStats;
  members: TeamMemberChecklistStatus[];
}

export interface SopCertificateData {
  certificate_id: string;
  verification_code: string;
  recipient_name: string;
  recipient_email: string;
  recipient_role: string;
  article_id: string;
  article_slug: string;
  article_title: string;
  completed_steps: number;
  total_steps: number;
  completed_at: string;
  issuer: string;
  issuer_seal: string;
  status: string;
}

export interface ChecklistTogglePayload {
  item_key: string;
  is_checked: boolean;
  total_items?: number;
}
