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
