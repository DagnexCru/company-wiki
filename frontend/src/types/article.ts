import type { Category, Tag } from "./taxonomy";

export type ArticleStatus = "draft" | "in_review" | "published" | "rejected" | "archived";

export interface ArticleAuthor {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "ADMIN" | "AUTHOR" | "REVIEWER" | "READER";
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
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
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
