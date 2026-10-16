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
  is_featured?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ArticleFilterParams {
  status?: string;
  search?: string;
  author?: string;
  page?: number;
  page_size?: number;
}

/** Enum union representing all possible lifecycle states of a knowledge article */

/** Embeddable author identity metadata returned in article API responses */

/** Lightweight representation of knowledge articles for list grids */

/** Complete article document payload including full markdown text */
