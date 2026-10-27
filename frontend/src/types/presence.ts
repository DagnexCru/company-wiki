export interface PresenceUser {
  id?: string;
  user_id: string;
  username: string;
  full_name: string;
  user_role: "ADMIN" | "AUTHOR" | "REVIEWER" | "READER" | string;
  status: "viewing" | "editing";
  client_session_id: string;
  avatar_color: string;
  last_heartbeat: string;
  is_active: boolean;
}

export interface EditLockInfo {
  is_locked: boolean;
  locked_by: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  } | null;
  is_current_user_lock: boolean;
  expires_in_seconds: number;
  warning_message: string | null;
  can_take_over?: boolean;
}

export interface ArticlePresenceResponse {
  article_id: string;
  article_slug: string;
  viewers: PresenceUser[];
  active_count: number;
  edit_lock: EditLockInfo;
}
