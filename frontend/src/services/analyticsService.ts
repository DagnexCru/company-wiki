import api from "./api";
import type { ArticleViewsTimelineResponse } from "../types/analytics";

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
};

