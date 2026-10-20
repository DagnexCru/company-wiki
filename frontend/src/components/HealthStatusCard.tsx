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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              System Health & Connection Verification
            </h2>
            <p className="text-xs text-slate-400">
              Verifies end-to-end communication between React frontend and Django backend.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Checking..." : "Re-check Health"}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">
            Contacting Django REST API at <code className="text-xs bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700">/api/v1/health/</code>...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-6 p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-rose-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-white">Backend Communication Offline</p>
              <p className="text-xs text-rose-300 mt-1">{error}</p>
              <p className="text-[11px] text-rose-400/80 mt-2">
                Tip: Ensure Django dev server is running on <code className="bg-slate-800 px-1 py-0.5 rounded font-mono border border-slate-700">http://localhost:8000</code>.
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
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  data.status === "healthy"
                    ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-400"
                    : "bg-amber-950/60 border border-amber-800/60 text-amber-400"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">System Status</p>
                <p className="text-sm font-bold text-white capitalize flex items-center gap-1.5">
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
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">PostgreSQL Database</p>
                <p className="text-sm font-bold text-white capitalize">
                  {data.services.database}
                </p>
              </div>
            </div>

            {/* API Service Status */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-400 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase">API Latency</p>
                <p className="text-sm font-bold text-white">
                  {responseTime !== null ? `${responseTime} ms` : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Payload Telemetry</span>
              <span className="text-[11px] font-mono text-slate-400">GET /api/v1/health/</span>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Server Timestamp (UTC)
                </span>
                <span className="font-mono text-slate-300">{data.timestamp}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-500" /> Architecture Version
                </span>
                <span className="font-mono text-slate-300 font-semibold">v{data.version}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Target Environment</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-medium text-slate-300">
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
