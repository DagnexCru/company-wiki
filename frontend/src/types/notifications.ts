export type NotificationType =
  | "MENTION"
  | "COMMENT"
  | "ARTICLE_UPDATED"
  | "REVIEW_REQUESTED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED";

export interface NotificationSender {
  id: string;
  username: string;
  full_name?: string;
  role?: string;
}

export interface NotificationArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export interface Notification {
  id: string;
  sender: NotificationSender | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  link: string;
  article: NotificationArticle | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  unread_count: number;
  results: Notification[];
}

export interface MentionUser {
  id: string;
  username: string;
  full_name?: string;
  role?: string;
  email?: string;
}

export interface ArticleComment {
  id: string;
  article: string;
  author: {
    id: string;
    username: string;
    full_name?: string;
    role?: string;
  };
  content: string;
  is_own: boolean;
  created_at: string;
  updated_at: string;
}
