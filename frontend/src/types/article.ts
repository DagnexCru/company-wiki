import type { Category, Tag } from "./taxonomy";

export type ArticleStatus = "draft" | "in_review" | "published" | "rejected" | "archived";

export interface ArticleAuthor {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "AUTHOR" | "REVIEWER" | "READER";
}

export interface UserFeedback {
  id: string;
  is_helpful: boolean;
  note: string;
  updated_at: string;
}

export interface FeedbackNote {
  id: string;
  is_helpful: boolean;
  note: string;
  user_name: string;
  user_role: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: ArticleAuthor;
  category: Category | null;
  tags: Tag[];
  status: ArticleStatus;
  status_display: string;
  is_featured: boolean;
  estimated_read_time: number;
  view_count?: number;
  helpful_count?: number;
  unhelpful_count?: number;
  helpfulness_score?: number;
  revision_count?: number;
  latest_revision_number?: number;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  published_at: string | null;
  last_reviewer?: ArticleAuthor | null;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  view_count: number;
  helpful_count?: number;
  unhelpful_count?: number;
  helpfulness_score?: number;
  user_feedback?: UserFeedback | null;
  recent_feedback_notes?: FeedbackNote[];
  is_bookmarked?: boolean;
  bookmark_info?: {
    id: string;
    collection_name: string;
    personal_note: string;
    created_at: string;
  } | null;
}

export interface ArticleInput {
  title: string;
  summary?: string;
  content: string;
  category_id?: string | null;
  tag_ids?: string[];
  is_featured?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages?: number;
  current_page?: number;
  page_size?: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ArticleFilterParams {
  status?: string;
  search?: string;
  category?: string;
  tag?: string;
  author?: string;
  ordering?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}

export interface ArticleAttachment {
  id: string;
  article?: string | null;
  uploader?: string | null;
  uploader_username: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  is_image: boolean;
  url: string;
  markdown: string;
  created_at: string;
}

