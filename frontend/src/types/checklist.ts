/**
 * Type definitions for Article SOP Checklists and Task Progress Tracking.
 */

export interface ArticleChecklistProgress {
  id?: string | null;
  article: string;
  article_id?: string;
  article_slug?: string;
  article_title?: string;
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

export interface ChecklistTogglePayload {
  item_key: string;
  is_checked: boolean;
  total_items?: number;
}
