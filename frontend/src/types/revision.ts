export interface ArticleRevision {
  id: string;
  article: string;
  article_title: string;
  article_slug: string;
  revision_number: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags_snapshot: string[];
  category_name: string;
  author_username: string;
  author_role: string;
  change_summary: string;
  is_restoration: boolean;
  restored_from_revision: number | null;
  created_at: string;
}

export interface RevisionListItem {
  id: string;
  revision_number: number;
  title: string;
  summary: string;
  tags_snapshot: string[];
  category_name: string;
  author_username: string;
  author_role: string;
  change_summary: string;
  is_restoration: boolean;
  restored_from_revision: number | null;
  created_at: string;
}

export interface RevisionDiffResult {
  article_slug: string;
  article_title: string;
  from_revision: number;
  to_revision: number;
  from_created_at: string;
  to_created_at: string;
  title_changed: boolean;
  from_title: string;
  to_title: string;
  summary_changed: boolean;
  from_summary: string;
  to_summary: string;
  category_changed: boolean;
  from_category: string;
  to_category: string;
  tags_added: string[];
  tags_removed: string[];
  content_unified_diff: string;
  from_content?: string;
  to_content?: string;
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface RestoreRevisionResponse {
  detail: string;
  restored_from_revision: number;
  new_revision_number: number;
  article: Record<string, unknown>;
}
