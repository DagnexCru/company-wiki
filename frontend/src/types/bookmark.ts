export interface ArticleBookmark {
  id: string;
  article: string;
  article_id: string;
  article_title: string;
  article_slug: string;
  article_summary: string;
  article_status: string;
  article_author_name: string;
  article_category_name: string;
  article_reading_time: number;
  collection_name: string;
  personal_note: string;
  created_at: string;
  updated_at: string;
}

export interface BookmarkListResponse {
  count: number;
  results: ArticleBookmark[];
  collections: string[];
}

export interface BookmarkStatusResponse {
  bookmarked: boolean;
  bookmark: ArticleBookmark | null;
}

export interface ToggleBookmarkPayload {
  action?: 'toggle' | 'add' | 'remove';
  collection_name?: string;
  personal_note?: string;
}

export interface ToggleBookmarkResponse {
  bookmarked: boolean;
  message: string;
  bookmark?: ArticleBookmark;
}
