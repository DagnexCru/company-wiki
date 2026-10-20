import api from "./api";
import type { DashboardData } from "../types/dashboard";

export const dashboardService = {
  /**
   * Fetch authenticated role-scoped dashboard metrics and content telemetry.
   * Endpoint: GET /api/v1/dashboard/
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>("/dashboard/");
    return response.data;
  },
};
