export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  category_color: string;
  tags: string[];
  reading_time: number;
  view_count: number;
  status: string;
  author: string;
  degree: number;
  is_orphan: boolean;
  updated_at: string;
  // Simulation coordinate properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
}

export interface GraphEdge {
  source: string; // source slug
  target: string; // target slug
  link_type: 'direct_citation' | 'shared_tag' | 'category_cluster';
  weight: number;
  label: string;
}

export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  orphan_count: number;
  density: number;
  top_hub: {
    slug: string;
    title: string;
    degree: number;
  } | null;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: string[];
  metrics: GraphMetrics;
}

export interface GraphFilterParams {
  category?: string;
  orphans_only?: boolean;
  include_drafts?: boolean;
}
