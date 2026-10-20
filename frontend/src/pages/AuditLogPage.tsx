import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  X,
  FileText,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { auditService } from "../services/auditService";
import type {
  AuditEvent,
  AuditSummary,
  AuditFilterParams,
  AuditActionType,
} from "../types/audit";
import { useAuth } from "../context/AuthContext";

export const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchAuditEvents = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const params: AuditFilterParams = {
        page,
        page_size: 15,
        search: search.trim() || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        resource_type: resourceFilter !== "all" ? resourceFilter : undefined,
      };
      const response = await auditService.getAuditEvents(params);
      setEvents(response.results);
      setTotalPages(response.total_pages);
      setTotalCount(response.count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit events.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, search, actionFilter, resourceFilter]);

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSummary(true);
    try {
      const data = await auditService.getAuditSummary();
      setSummary(data);
    } catch (err: unknown) {
      console.error("Failed to load audit summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAuditEvents();
      fetchSummary();
    }
  }, [isAdmin, fetchAuditEvents, fetchSummary]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditEvents();
  };

  const handleResetFilters = () => {
    setSearch("");
    setActionFilter("all");
    setResourceFilter("all");
    setPage(1);
  };

  // Helper function for color coding action badges
  const getActionBadgeColor = (action: AuditActionType) => {
    switch (action) {
      case "ARTICLE_APPROVE":
      case "USER_REGISTER":
      case "CATEGORY_CREATE":
      case "TAG_CREATE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "ARTICLE_REJECT":
      case "ARTICLE_DELETE":
      case "CATEGORY_DELETE":
      case "TAG_DELETE":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "ARTICLE_SUBMIT":
      case "ARTICLE_RESTORE":
      case "USER_ROLE_CHANGE":
      case "USER_STATUS_CHANGE":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "AUTH_LOGIN":
      case "AUTH_LOGOUT":
        return "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      default:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            System Audit & History
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The system-wide audit trail contains sensitive administrative and security logs
            and is restricted to users with the <strong>Administrator</strong> role.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto text-left space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available to you as {user?.role || "Staff"}
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Article Revision History:</strong> Authors, Reviewers, and Admins can view complete version diffs and histories for their articles.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Review Decision Records:</strong> Editorial decisions and rejection feedback are saved on each reviewed article.
              </span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Browse Knowledge Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                System Audit Trail
              </h1>
              <p className="text-xs text-slate-500">
                Tamper-evident administrative, identity, and content lifecycle logs
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchAuditEvents();
            fetchSummary();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      {summary && !loadingSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Recorded Events
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {summary.total_events}
              </span>
              <span className="text-xs text-slate-500">all-time</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Activity in Last 24 Hours
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {summary.events_last_24h}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                active
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Primary Resource Action
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {Object.keys(summary.action_distribution)[0] || "None"}
            </div>
            <p className="text-[11px] text-slate-500">
              {Object.values(summary.action_distribution)[0] || 0} occurrences
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Top Active Actor
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {summary.top_actors[0]?.actor__username || "System"}
            </div>
            <p className="text-[11px] text-slate-500">
              {summary.top_actors[0]?.event_count || 0} events triggered
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resource name, ID, or actor username..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Action Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <option value="all">All Actions</option>
                <option value="ARTICLE_CREATE">Article Created</option>
                <option value="ARTICLE_UPDATE">Article Updated</option>
                <option value="ARTICLE_SUBMIT">Article Submitted</option>
                <option value="ARTICLE_APPROVE">Article Approved</option>
                <option value="ARTICLE_REJECT">Article Rejected</option>
                <option value="ARTICLE_RESTORE">Article Restored</option>
                <option value="ARTICLE_ARCHIVE">Article Archived</option>
                <option value="AUTH_LOGIN">User Login</option>
                <option value="AUTH_LOGOUT">User Logout</option>
                <option value="USER_ROLE_CHANGE">Role Modified</option>
                <option value="USER_STATUS_CHANGE">Status Modified</option>
                <option value="CATEGORY_CREATE">Category Created</option>
                <option value="TAG_CREATE">Tag Created</option>
              </select>
            </div>

            {/* Resource Type Filter */}
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
            >
              <option value="all">All Resources</option>
              <option value="article">Articles</option>
              <option value="user">Users</option>
              <option value="auth">Authentication</option>
              <option value="category">Categories</option>
              <option value="tag">Tags</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
            >
              Filter
            </button>

            {(search || actionFilter !== "all" || resourceFilter !== "all") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Audit Events Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
            Loading audit records...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No matching audit events
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {event.actor_username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {event.actor_username}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {event.actor_role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getActionBadgeColor(
                          event.action
                        )}`}
                      >
                        {event.action_display || event.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                          {event.resource_name || "N/A"}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {event.resource_type}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {event.ip_address || "127.0.0.1"}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {totalPages} ({totalCount} total events)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Event Details
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedEvent.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block">Action</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEvent.action_display}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Actor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEvent.actor_username} ({selectedEvent.actor_role})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Resource Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEvent.resource_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timestamp</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {new Date(selectedEvent.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Sanitized Metadata Details
                </span>
                <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed max-h-60 border border-slate-800">
                  {JSON.stringify(selectedEvent.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
