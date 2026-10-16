import api, { tokenStorage } from "./api";
import type { LoginCredentials, RegisterData, AuthResponse, User } from "../types/auth";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login/", credentials);
    const { access, refresh, user } = response.data;
    tokenStorage.setTokens(access, refresh);
    localStorage.setItem("wiki_user", JSON.stringify(user));
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register/", data);
    const { access, refresh, user } = response.data;
    tokenStorage.setTokens(access, refresh);
    localStorage.setItem("wiki_user", JSON.stringify(user));
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refresh = tokenStorage.getRefreshToken();
    try {
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
    } catch (err) {
      console.warn("Backend logout notification failed, clearing local tokens", err);
    } finally {
      tokenStorage.clearTokens();
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me/");
    localStorage.setItem("wiki_user", JSON.stringify(response.data));
    return response.data;
  },

  getCurrentUser: (): User | null => {
    const cached = localStorage.getItem("wiki_user");
    if (!cached) return null;
    try {
      return JSON.parse(cached) as User;
    } catch {
      return null;
    }
  },
};
