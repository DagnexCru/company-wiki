import api from "./api";
import type { Category, Tag, CategoryInput, TagInput } from "../types/taxonomy";

export const taxonomyService = {
  /**
   * Fetch all categories with optional search filtering.
   */
  async getCategories(search?: string): Promise<Category[]> {
    const response = await api.get<Category[]>("/categories/", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  /**
   * Fetch all tags with optional search filtering.
   */
  async getTags(search?: string): Promise<Tag[]> {
    const response = await api.get<Tag[]>("/tags/", {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  /**
   * Create a new category (Admins only).
   */
  async createCategory(data: CategoryInput): Promise<Category> {
    const response = await api.post<Category>("/categories/", data);
    return response.data;
  },

  /**
   * Update category details (Admins only).
   */
  async updateCategory(slug: string, data: Partial<CategoryInput>): Promise<Category> {
    const response = await api.patch<Category>(`/categories/${slug}/`, data);
    return response.data;
  },

  /**
   * Delete a category safely (Admins only). Articles are preserved as uncategorized.
   */
  async deleteCategory(slug: string): Promise<void> {
    await api.delete(`/categories/${slug}/`);
  },

  /**
   * Create a new tag (Admins only).
   */
  async createTag(data: TagInput): Promise<Tag> {
    const response = await api.post<Tag>("/tags/", data);
    return response.data;
  },

  /**
   * Delete a tag (Admins only).
   */
  async deleteTag(slug: string): Promise<void> {
    await api.delete(`/tags/${slug}/`);
  },
};
