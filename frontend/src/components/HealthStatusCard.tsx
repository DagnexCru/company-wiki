import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Server,
  Clock,
  Code2,
} from "lucide-react";
import { healthService, type HealthResponse } from "../services/api";

export const HealthStatusCard = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const result = await healthService.getHealth();
      const end = performance.now();
      setData(result);
      setResponseTime(Math.round(end - start));
    } catch (err: any) {
      console.error("Health check error:", err);
      setError(
        err.response?.data?.services?.database_message ||
          err.message ||
          "Failed to communicate with Django REST API."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              System Health & Connection Verification
            </h2>
            <p className="text-xs text-slate-500">
              Verifies end-to-end communication between React frontend and Django backend.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Checking..." : "Re-check Health"}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">
            Contacting Django REST API at <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/api/v1/health/</code>...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Backend Communication Offline</p>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <p className="text-[11px] text-rose-600 mt-2">
                Tip: Ensure Django dev server is running on <code className="bg-white/80 px-1 py-0.5 rounded font-mono">http://localhost:8000</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Healthy / Degraded State */}
      {data && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Global Status Indicator */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  data.status === "healthy"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">System Status</p>
                <p className="text-sm font-bold text-slate-800 capitalize flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      data.status === "healthy" ? "bg-emerald-500 animate-ping" : "bg-amber-500"
                    }`}
                  ></span>
                  {data.status}
                </p>
              </div>
            </div>

            {/* Database Service Status */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">PostgreSQL Database</p>
                <p className="text-sm font-bold text-slate-800 capitalize">
                  {data.services.database}
                </p>
              </div>
            </div>

            {/* API Service Status */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">API Latency</p>
                <p className="text-sm font-bold text-slate-800">
                  {responseTime !== null ? `${responseTime} ms` : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Payload Telemetry</span>
              <span className="text-[11px] font-mono text-slate-400">GET /api/v1/health/</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Server Timestamp (UTC)
                </span>
                <span className="font-mono text-slate-700">{data.timestamp}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-400" /> Architecture Version
                </span>
                <span className="font-mono text-slate-700 font-semibold">v{data.version}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Target Environment</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-600">
                  {data.environment}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
