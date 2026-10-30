export interface AiSummaryResponse {
  article_id: string;
  article_slug: string;
  article_title: string;
  tldr: string;
  key_takeaways: string[];
  reading_time_original: number;
  reading_time_tldr: number;
  time_saved_minutes: number;
  word_count_original: number;
  headings_detected: number;
  confidence_score: number;
  generated_at: string;
}

export interface AskWikiAiRequest {
  query: string;
  scope?: "all" | "article";
  article_slug?: string;
}

export interface AiSource {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  relevance_score: number;
  category: string;
  updated_at: string;
}

export interface AskWikiAiResponse {
  query: string;
  scope: string;
  answer: string;
  sources: AiSource[];
  suggested_questions: string[];
  model: string;
  timestamp: string;
}
