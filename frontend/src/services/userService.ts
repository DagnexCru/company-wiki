import api from "./api";
import type { ManagedUser, UserRole } from "../types/auth";

export interface UserQueryParams {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ManagedUser[];
}

export const userService = {
  /**
   * List all users with optional search and role filtering (Admin only).
   */
  async getUsers(params?: UserQueryParams): Promise<PaginatedUsersResponse> {
    const response = await api.get<PaginatedUsersResponse | ManagedUser[]>("/users/", { params });
    if (Array.isArray(response.data)) {
      return {
        count: (response.data as ManagedUser[]).length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    return response.data;
  },

  /**
   * Retrieve single user details by ID (Admin or Self).
   */
  async getUserById(id: string): Promise<ManagedUser> {
    const response = await api.get<ManagedUser>(`/users/${id}/`);
    return response.data;
  },

  /**
   * Update a user's organizational role (Admin only).
   */
  async updateUserRole(id: string, role: UserRole): Promise<{ message: string; user: ManagedUser }> {
    const response = await api.patch<{ message: string; user: ManagedUser }>(`/users/${id}/role/`, { role });
    return response.data;
  },

  /**
   * Toggle user active status (Admin only).
   */
  async updateUserStatus(id: string, isActive: boolean): Promise<{ message: string; user: ManagedUser }> {
    const response = await api.patch<{ message: string; user: ManagedUser }>(`/users/${id}/status/`, {
      is_active: isActive,
    });
    return response.data;
  },
};
