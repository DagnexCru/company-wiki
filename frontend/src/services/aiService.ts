import api from "./api";
import type {
  AiSummaryResponse,
  AskWikiAiRequest,
  AskWikiAiResponse,
} from "../types/ai";

export const aiService = {
  /**
   * Generates or fetches an AI-powered TL;DR summary and key takeaways for an article.
   * POST /api/v1/articles/<slug_or_id>/ai-summary/
   */
  async generateArticleSummary(
    slugOrId: string,
    options?: { force?: boolean }
  ): Promise<AiSummaryResponse> {
    const response = await api.post<AiSummaryResponse>(
      `/articles/${slugOrId}/ai-summary/`,
      options || {}
    );
    return response.data;
  },

  /**
   * Queries the 'Ask Wiki AI' assistant across all indexed documentation.
   * POST /api/v1/articles/ask-ai/
   */
  async askWikiAi(payload: AskWikiAiRequest): Promise<AskWikiAiResponse> {
    const response = await api.post<AskWikiAiResponse>(
      "/articles/ask-ai/",
      payload
    );
    return response.data;
  },
};

export default aiService;
