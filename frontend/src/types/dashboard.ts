import type { ArticleListItem } from "./article";

export interface CategoryDistributionItem {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

export interface AuthorMetrics {
  my_drafts_count: number;
  my_in_review_count: number;
  my_rejected_count: number;
  my_published_count: number;
}

export interface ReviewerMetrics {
  pending_reviews_count: number;
}

export interface RecentActivityItem {
  id: string;
  actor_username: string;
  actor_role: string;
  action: string;
  action_display: string;
  resource_type: string;
  resource_name: string;
  created_at: string;
}

export interface AdminMetrics {
  total_articles: number;
  published_count: number;
  draft_count: number;
  in_review_count: number;
  rejected_count: number;
  archived_count: number;
  total_users_count: number;
  total_categories_count: number;
  total_tags_count: number;
  audit_events_24h_count: number;
  recent_activity: RecentActivityItem[];
}

export interface DashboardData {
  role: string;
  total_published_articles: number;
  recent_published_articles: ArticleListItem[];
  category_distribution: CategoryDistributionItem[];
  author_metrics?: AuthorMetrics | null;
  my_recent_drafts?: ArticleListItem[] | null;
  reviewer_metrics?: ReviewerMetrics | null;
  pending_review_articles?: ArticleListItem[] | null;
  admin_metrics?: AdminMetrics | null;
}
