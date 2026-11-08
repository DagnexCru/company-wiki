import api from "./api";
import type { GraphDataResponse, GraphFilterParams, ArticleNeighborhoodResponse } from "../types/graph";

export const graphService = {
  /**
   * Fetch knowledge graph representation connecting all articles, citations, and taxonomies.
   */
  async getKnowledgeGraph(params?: GraphFilterParams): Promise<GraphDataResponse> {
    const response = await api.get<GraphDataResponse>("/articles/graph/", { params });
    return response.data;
  },

  /**
   * Fetch local 1-hop neighborhood for a specific article.
   */
  async getArticleNeighborhood(slugOrId: string): Promise<ArticleNeighborhoodResponse> {
    const response = await api.get<ArticleNeighborhoodResponse>(`/articles/${slugOrId}/graph-neighborhood/`);
    return response.data;
  },
};

