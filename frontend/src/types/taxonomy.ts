export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  article_count: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
  created_at: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface TagInput {
  name: string;
}
