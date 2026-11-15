import api from "./api";
import type {
  ArticleViewsTimelineResponse,
  ArticleSentimentResponse,
  ArticleEngagementResponse,
  PingEngagementPayload,
  PingEngagementResponse,
} from "../types/analytics";

export const analyticsService = {
  /**
   * Fetch time-series views and reader metrics for an article.
   * GET /api/v1/articles/{slug}/analytics/views-timeline/?range=7d|30d|90d
   */
  async getViewsTimeline(
    slug: string,
    range: "7d" | "30d" | "90d" = "7d"
  ): Promise<ArticleViewsTimelineResponse> {
    const response = await api.get<ArticleViewsTimelineResponse>(
      `/articles/${slug}/analytics/views-timeline/`,
      {
        params: { range },
      }
    );
    return response.data;
  },

  /**
   * Fetch reader sentiment, helpful vs unhelpful breakdown, and feedback feed.
   * GET /api/v1/articles/{slug}/analytics/sentiment/
   */
  async getSentimentAnalytics(slug: string): Promise<ArticleSentimentResponse> {
    const response = await api.get<ArticleSentimentResponse>(
      `/articles/${slug}/analytics/sentiment/`
    );
    return response.data;
  },

  /**
   * Ping reader engagement telemetry (active seconds and scroll depth).
   * POST /api/v1/articles/{slug}/analytics/ping-engagement/
   */
  async pingEngagement(
    slug: string,
    payload: PingEngagementPayload
  ): Promise<PingEngagementResponse> {
    const response = await api.post<PingEngagementResponse>(
      `/articles/${slug}/analytics/ping-engagement/`,
      payload
    );
    return response.data;
  },

  /**
   * Fetch reading time, engagement metrics, and drop-off funnel.
   * GET /api/v1/articles/{slug}/analytics/engagement/
   */
  async getEngagementAnalytics(slug: string): Promise<ArticleEngagementResponse> {
    const response = await api.get<ArticleEngagementResponse>(
      `/articles/${slug}/analytics/engagement/`
    );
    return response.data;
  },
};

