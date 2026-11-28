export type AnnotationStatus = "open" | "resolved";

export interface AnnotationAuthor {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export interface ArticleInlineAnnotationReply {
  id: string;
  annotation: string;
  author: AnnotationAuthor;
  parent?: string | null;
  content: string;
  is_own?: boolean;
  children?: ArticleInlineAnnotationReply[];
  created_at: string;
  updated_at?: string;
}

export interface ArticleInlineAnnotation {
  id: string;
  article: string;
  author: AnnotationAuthor;
  highlighted_text: string;
  start_offset: number;
  end_offset: number;
  anchor_context_before: string;
  anchor_context_after: string;
  content: string;
  status: AnnotationStatus;
  is_own: boolean;
  match_confidence?: number;
  is_orphaned?: boolean;
  replies_count?: number;
  replies?: ArticleInlineAnnotationReply[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: AnnotationAuthor | null;
}

export interface CreateAnnotationPayload {
  highlighted_text: string;
  start_offset: number;
  end_offset: number;
  anchor_context_before?: string;
  anchor_context_after?: string;
  content: string;
}

export interface CreateAnnotationReplyPayload {
  content: string;
  parent?: string | null;
  parent_id?: string | null;
}

export type AnnotationPreset =
  | "all"
  | "my_mentions"
  | "needs_review"
  | "stale"
  | "my_threads";

export interface AnnotationMetrics {
  article_slug: string;
  total_annotations: number;
  open_count: number;
  resolved_count: number;
  resolution_rate: number;
  total_replies: number;
  avg_resolution_time_hours: number | null;
  contributors_count: number;
  top_contributors: Array<{
    username: string;
    full_name?: string;
    contributions_count: number;
  }>;
  preset_counts?: {
    all: number;
    my_mentions: number;
    needs_review: number;
    stale: number;
    my_threads: number;
  };
}

export interface AnnotationFilterParams {
  status?: AnnotationStatus | "all";
  author?: string;
  search?: string;
  mentioned?: string;
  preset?: AnnotationPreset;
}

export interface WebhookTestResponse {
  article_slug: string;
  target_webhook_url: string;
  dispatch_result: {
    success: boolean;
    simulated: boolean;
    detail?: string;
    error?: string;
  };
  payload: any;
}
