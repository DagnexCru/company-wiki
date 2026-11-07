import api from "./api";
import type { GraphDataResponse, GraphFilterParams } from "../types/graph";

export const graphService = {
  /**
   * Fetch knowledge graph representation connecting all articles, citations, and taxonomies.
   */
  async getKnowledgeGraph(params?: GraphFilterParams): Promise<GraphDataResponse> {
    const response = await api.get<GraphDataResponse>("/articles/graph/", { params });
    return response.data;
  },
};
