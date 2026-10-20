import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  Edit3,
  Eye,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import type { ManagedUser, UserRole } from "../types/auth";

export const UserManagementPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers({
        search: search.trim() || undefined,
        role: selectedRole || undefined,
        is_active:
          selectedStatus === "active"
            ? true
            : selectedStatus === "inactive"
            ? false
            : undefined,
      });
      setUsers(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to load user directory. Please ensure you have Administrator permissions."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await userService.updateUserRole(userId, newRole);
      setSuccessMessage(res.message);
      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.role?.[0] ||
          "Failed to update role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await userService.updateUserStatus(userId, !currentStatus);
      setSuccessMessage(res.message);
      // Update local state immediately
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to change user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Metric counts
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const authorCount = users.filter((u) => u.role === "AUTHOR").length;
  const reviewerCount = users.filter((u) => u.role === "REVIEWER").length;
  const readerCount = users.filter((u) => u.role === "READER").length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Administrator
          </span>
        );
      case "AUTHOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            Author
          </span>
        );
      case "REVIEWER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            Reviewer
          </span>
        );
      case "READER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Reader
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-800/60">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              User & Role Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforce role governance, inspect registered staff, and manage access privileges across the organization.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Staff
          </p>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-purple-900/40 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Admins
          </p>
          <p className="text-2xl font-black text-purple-300 mt-1">{adminCount}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-blue-900/40 shadow-xs">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Authors
          </p>
          <p className="text-2xl font-black text-blue-300 mt-1">{authorCount}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-amber-900/40 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3" /> Reviewers
          </p>
          <p className="text-2xl font-black text-amber-300 mt-1">{reviewerCount}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 border border-emerald-900/40 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Readers
          </p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{readerCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name, email, or username..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="AUTHOR">Authors</option>
              <option value="REVIEWER">Reviewers</option>
              <option value="READER">Readers</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No users found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-4">Current Role</th>
                  <th className="py-3.5 px-4 text-center">Authored Articles</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  const isUpdating = updatingUserId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-700">
                            {u.full_name
                              ? u.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()
                              : u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {u.full_name || u.username}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/60 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Role */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Articles Count */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-300">
                          {u.article_count || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          disabled={isSelf || isUpdating}
                          title={
                            isSelf
                              ? "Cannot deactivate your own administrator account"
                              : u.is_active
                              ? "Click to deactivate account"
                              : "Click to activate account"
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                            u.is_active
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60"
                              : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                          } ${isSelf ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
                        >
                          {u.is_active ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 text-slate-400" />
                              Deactivated
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Role Assignment Dropdown */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={isSelf || isUpdating}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as UserRole)
                            }
                            title={
                              isSelf
                                ? "Cannot demote your own account"
                                : "Assign new role"
                            }
                            className={`px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                              isSelf ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            }`}
                          >
                            <option value="ADMIN">👑 Administrator</option>
                            <option value="AUTHOR">✍️ Author</option>
                            <option value="REVIEWER">🔍 Reviewer</option>
                            <option value="READER">📖 Reader</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
