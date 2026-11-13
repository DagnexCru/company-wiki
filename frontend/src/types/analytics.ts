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

