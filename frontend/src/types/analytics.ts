export interface ArticleViewsTimelineDataPoint {
  date: string;
  label: string;
  day_name: string;
  total_views: number;
  unique_readers: number;
}

export interface ArticleViewsTimelineSummary {
  period_total_views: number;
  all_time_views: number;
  unique_readers: number;
  peak_day_views: number;
  peak_day_date: string | null;
  average_daily_views: number;
  growth_rate_percentage: number;
  previous_period_views: number;
}

export interface ArticleViewsTimelineResponse {
  article_slug: string;
  article_title: string;
  range: "7d" | "30d" | "90d";
  days_count: number;
  summary: ArticleViewsTimelineSummary;
  timeline: ArticleViewsTimelineDataPoint[];
}

export interface ReaderFeedbackItem {
  id: string;
  is_helpful: boolean;
  note: string;
  sentiment_tag: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_initial: string;
  created_at: string;
}

export interface SentimentCategoryBreakdown {
  category: string;
  sentiment: "positive" | "negative";
  count: number;
  percentage: number;
}

export interface ArticleSentimentSummary {
  total_feedback_count: number;
  helpful_count: number;
  unhelpful_count: number;
  helpfulness_score: number;
  health_status: "HEALTHY" | "MODERATE" | "NEEDS_REVIEW" | "NO_DATA";
  health_label: string;
  health_description: string;
  feedback_rate_percentage: number;
}

export interface ArticleSentimentResponse {
  article_slug: string;
  article_title: string;
  summary: ArticleSentimentSummary;
  categories_breakdown: SentimentCategoryBreakdown[];
  recent_feedbacks: ReaderFeedbackItem[];
}

export interface EngagementFunnelStage {
  stage: string;
  milestone: number;
  readers: number;
  percentage: number;
  drop_off_percentage: number;
}

export interface EngagementDistributionBucket {
  bucket: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ArticleEngagementSummary {
  total_readers: number;
  avg_read_seconds: number;
  avg_read_formatted: string;
  completion_rate_percentage: number;
  retention_score: number;
  engagement_level: string;
  primary_drop_off_stage: string;
}

export interface ArticleEngagementResponse {
  article_slug: string;
  article_title: string;
  estimated_read_seconds: number;
  estimated_read_formatted: string;
  summary: ArticleEngagementSummary;
  funnel: EngagementFunnelStage[];
  distribution: EngagementDistributionBucket[];
  recommendations: string[];
}

export interface PingEngagementPayload {
  session_id: string;
  active_seconds: number;
  scroll_percentage: number;
}

export interface PingEngagementResponse {
  status: string;
  session_id: string;
  active_seconds: number;
  scroll_depth_percent: number;
  reached_100: boolean;
}

export interface AuthorArticleLeaderboardItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category_name: string;
  category_slug: string;
  view_count: number;
  helpful_count: number;
  unhelpful_count: number;
  helpfulness_score: number;
  total_reading_seconds: number;
  avg_reading_seconds: number;
  avg_reading_formatted: string;
  reading_sessions_count: number;
  completion_rate_percentage: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  rank: number;
}

export interface AuthorPortfolioSummary {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  in_review_articles: number;
  total_portfolio_views: number;
  total_unique_readers: number;
  views_last_7_days: number;
  average_helpfulness_score: number;
  total_helpful_votes: number;
  total_unhelpful_votes: number;
  total_reading_hours: number;
  total_reading_seconds: number;
  avg_reading_formatted: string;
  top_performing_category: string;
}

export interface AuthorPortfolioAuthorInfo {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

export interface AuthorAnalyticsOverviewResponse {
  author: AuthorPortfolioAuthorInfo;
  summary: AuthorPortfolioSummary;
  sort_by: string;
  top_articles: AuthorArticleLeaderboardItem[];
}



