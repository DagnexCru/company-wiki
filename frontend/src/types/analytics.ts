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

