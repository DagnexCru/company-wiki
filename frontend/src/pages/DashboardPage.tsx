import { useAuth } from "../context/AuthContext";
import { HealthStatusCard } from "../components/HealthStatusCard";
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle,
} from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();

  const getRolePermissions = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return [
          { text: "Manage all organization users and roles", allowed: true },
          { text: "Create, edit, and publish knowledge articles", allowed: true },
          { text: "Approve or reject submitted articles", allowed: true },
          { text: "Manage categories and tag taxonomy", allowed: true },
          { text: "View complete system audit history", allowed: true },
        ];
      case "AUTHOR":
        return [
          { text: "Create and edit own article drafts", allowed: true },
          { text: "Submit drafts for editorial review", allowed: true },
          { text: "Revise rejected articles with reviewer feedback", allowed: true },
          { text: "Read all published company documentation", allowed: true },
          { text: "Approve or publish articles directly", allowed: false },
        ];
      case "REVIEWER":
        return [
          { text: "Inspect complete submitted articles in review queue", allowed: true },
          { text: "Approve articles to publish to organization", allowed: true },
          { text: "Reject articles with mandatory feedback", allowed: true },
          { text: "Read all published company documentation", allowed: true },
          { text: "Manage global user roles or categories", allowed: false },
        ];
      case "READER":
      default:
        return [
          { text: "Search and filter all published articles", allowed: true },
          { text: "Browse category hierarchies and tags", allowed: true },
          { text: "View article revision history", allowed: true },
          { text: "Create or submit new articles", allowed: false },
          { text: "Access unpublished drafts or review queue", allowed: false },
        ];
    }
  };

  const permissions = getRolePermissions(user?.role);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 text-white p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phase 2: Identity & Authentication Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            You are securely authenticated as an internal{" "}
            <span className="font-semibold text-white underline decoration-brand-400">
              {user?.role}
            </span>
            . Below is your verified profile state, assigned permissions, and real-time backend telemetry.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Profile & Permissions Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Details Card */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">{user?.full_name}</h2>
              <p className="text-xs text-slate-400 font-mono">@{user?.username}</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Work Email</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned System Role</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-bold uppercase tracking-wider text-[11px]">
                {user?.role}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Unique User Identifier</span>
              <span className="font-mono text-[10px] text-slate-600 truncate block bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                {user?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Role Permissions Breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-brand-600" />
              <h2 className="font-bold text-slate-800 text-sm">Role-Gated Permissions</h2>
            </div>
            <span className="text-xs text-slate-400">Strictly enforced by Django REST API</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  perm.allowed
                    ? "bg-emerald-50/50 border-emerald-100 text-slate-700"
                    : "bg-slate-50/50 border-slate-100 text-slate-400"
                }`}
              >
                {perm.allowed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                    ✕
                  </span>
                )}
                <span>{perm.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Telemetry Card */}
      <section aria-labelledby="health-section">
        <HealthStatusCard />
      </section>
    </div>
  );
};
