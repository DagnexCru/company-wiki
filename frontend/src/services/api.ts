import axios from "axios";

export interface HealthResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  version: string;
  environment: string;
  services: {
    api: string;
    database: string;
    database_message?: string;
  };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const healthService = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>("/health/");
    return response.data;
  },
};

export default api;
