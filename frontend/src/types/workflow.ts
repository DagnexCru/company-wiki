import type { ArticleAuthor, ArticleStatus } from "./article";
import type { Category, Tag } from "./taxonomy";

export type WorkflowAction = "submit" | "approve" | "reject" | "archive";

export interface ReviewRecord {
  id: string;
  article: string;
  article_slug: string;
  article_title: string;
  actor: ArticleAuthor;
  action: WorkflowAction;
  action_display: string;
  from_status: ArticleStatus;
  to_status: ArticleStatus;
  feedback: string;
  created_at: string;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: ArticleAuthor;
  category: Category | null;
  tags: Tag[];
  status: ArticleStatus;
  status_display: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewDecisionInput {
  feedback: string;
}

export interface SubmitForReviewInput {
  notes?: string;
}
