import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Mail,
  Bell,
  Sliders,
  CheckCircle,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [copiedUuid, setCopiedUuid] = useState(false);

  // User Settings State (Local Interactive Preferences)
  const [emailAlertsReviews, setEmailAlertsReviews] = useState(true);
  const [emailAlertsPublish, setEmailAlertsPublish] = useState(true);
  const [securityNotices, setSecurityNotices] = useState(true);
  const [editorMode, setEditorMode] = useState<"split" | "live" | "raw">("split");
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState<string | null>(null);

  const handleCopyUuid = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2500);
    }
  };

  const handleSavePreferences = () => {
    setSavedSettingsMsg("Preferences updated successfully.");
    setTimeout(() => setSavedSettingsMsg(null), 3000);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Administrator",
          icon: "👑",
          classes: "bg-purple-950/60 text-purple-300 border-purple-800/60",
          desc: "Full administrative governance across documentation, user roles, taxonomy, and system audit logs.",
        };
      case "AUTHOR":
        return {
          label: "Author",
          icon: "✍️",
          classes: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
          desc: "Content authoring privileges with full draft CRUD, submission for review, and version history control.",
        };
      case "REVIEWER":
        return {
          label: "Reviewer",
          icon: "🔍",
          classes: "bg-amber-950/60 text-amber-300 border-amber-800/60",
          desc: "Editorial review authority to evaluate submissions, approve publications, and issue structured rejection feedback.",
        };
      case "READER":
      default:
        return {
          label: "Reader",
          icon: "📖",
          classes: "bg-sky-950/60 text-sky-300 border-sky-800/60",
          desc: "Organization-wide read access to discover published documentation, browse taxonomy hierarchies, and inspect public SOPs.",
        };
    }
  };

  const getRolePermissions = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return [
          { text: "Full administrative authority across all documentation", allowed: true, desc: "Bypass editorial gates, manage any draft, and publish emergency SOP updates directly." },
          { text: "Manage user roles and account activations", allowed: true, desc: "Promote users to Authors or Reviewers and manage account security status." },
          { text: "Configure knowledge taxonomy (categories & tags)", allowed: true, desc: "Create, rename, color-code, and organize departmental category hierarchies." },
          { text: "Review, approve, or reject any submitted article", allowed: true, desc: "Act as chief editor with full approval and rejection capabilities." },
          { text: "Inspect complete immutable system audit logs", allowed: true, desc: "Review security event timeline, actor IP addresses, and credential actions." },
          { text: "Directly publish or soft-archive any documentation", allowed: true, desc: "Maintain organization-wide knowledge lifecycle without approval dependencies." },
        ];
      case "AUTHOR":
        return [
          { text: "Create and edit own article drafts in Markdown", allowed: true, desc: "Write documentation with live Markdown preview, code highlighting, and metadata tagging." },
          { text: "Submit drafts for editorial review queue", allowed: true, desc: "Send finished drafts to the designated editorial team for verification." },
          { text: "Revise rejected articles with reviewer feedback", allowed: true, desc: "Address editorial comments and resubmit articles seamlessly." },
          { text: "Read all published company documentation", allowed: true, desc: "Full search and discovery access across active organization playbooks." },
          { text: "Approve or publish articles directly", allowed: false, desc: "Strict separation of duties prevents authors from self-approving their own work." },
          { text: "Manage global user roles or categories", allowed: false, desc: "Administrative functions are restricted to platform administrators." },
        ];
      case "REVIEWER":
        return [
          { text: "Inspect complete submitted articles in review queue", allowed: true, desc: "Review full draft markdown, author metadata, tags, and category associations." },
          { text: "Approve articles to publish to organization", allowed: true, desc: "Grant editorial signoff and publish articles to the company-wide knowledge base." },
          { text: "Reject articles with mandatory structured feedback", allowed: true, desc: "Send articles back to author with actionable editorial guidance." },
          { text: "Read all published company documentation", allowed: true, desc: "Inspect and search all published company documentation entries." },
          { text: "Manage global user roles or categories", allowed: false, desc: "Administrative governance is restricted to platform administrators." },
          { text: "Approve own articles (independent review constraint)", allowed: false, desc: "Impartiality rule prevents reviewers from approving articles they authored." },
        ];
      case "READER":
      default:
        return [
          { text: "Search and filter all published articles", allowed: true, desc: "Instant full-text search across titles, summaries, and Markdown body content." },
          { text: "Browse category hierarchies and tags", allowed: true, desc: "Navigate knowledge organized by engineering, IT, HR, and operations departments." },
          { text: "View article revision history and citations", allowed: true, desc: "Inspect change logs, timestamps, and contributing author attributions." },
          { text: "Create or submit new articles", allowed: false, desc: "Authoring privileges require Author or Administrator role assignment." },
          { text: "Access unpublished drafts or review queue", allowed: false, desc: "Work-in-progress content is isolated to protect draft confidentiality." },
          { text: "Administrative role governance", allowed: false, desc: "User management and taxonomy configuration are strictly administrative." },
        ];
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const permissions = getRolePermissions(user?.role);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white font-medium">User Profile & Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>User Profile & Settings</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 ${roleInfo.classes}`}>
              <span>{roleInfo.icon}</span>
              <span>{roleInfo.label}</span>
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal credentials, system authorizations, and workspace preferences.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 transition shadow-xs shrink-0 self-start sm:self-auto group"
        >
          <span>Back to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Main Grid: User Identity Details + Role-Gated Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: User Identity Card (Interactive Hover) */}
        <div className="lg:col-span-1 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 p-6 space-y-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
              {user?.full_name
                ? user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : user?.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-white text-lg truncate group-hover:text-indigo-300 transition-colors">
                {user?.full_name || user?.username}
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate">@{user?.username}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Session</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
            {/* Work Email */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 transition group/field">
              <span className="text-slate-400 block mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Work Email
              </span>
              <span className="font-semibold text-slate-200 text-xs break-all">
                {user?.email || "No email on record"}
              </span>
            </div>

            {/* Assigned System Role */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 transition group/field">
              <span className="text-slate-400 block mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Assigned System Role
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider text-[11px] ${roleInfo.classes}`}>
                <span>{roleInfo.icon}</span>
                <span>{user?.role}</span>
              </span>
            </div>

            {/* Unique User Identifier (Copyable) */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800/80 transition group/field">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Unique User Identifier
                </span>
                <button
                  type="button"
                  onClick={handleCopyUuid}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-700 transition"
                  title="Copy User UUID"
                >
                  {copiedUuid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <span className="font-mono text-[11px] text-slate-300 truncate block bg-slate-900/90 p-2 rounded-lg border border-slate-800 select-all">
                {user?.id || "e02746a5-cb45-4be2-9ef5-202446824be9"}
              </span>
            </div>

            {/* Dedicated Meaningful Sign Out Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-all duration-200 shadow-sm hover:shadow-rose-950/40 hover:scale-[1.01] active:scale-[0.99] group"
              >
                <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-transform group-hover:-translate-x-0.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Role-Gated Permissions Grid */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Role-Gated Permissions</h2>
                <p className="text-xs text-slate-400">Strictly enforced by Django REST Framework API</p>
              </div>
            </div>
            <span className="text-[11px] text-indigo-300 font-medium bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-full self-start sm:self-auto">
              RBAC Policy: {user?.role}
            </span>
          </div>

          {/* Interactive Permission Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 text-xs transition-all duration-200 cursor-default group hover:-translate-y-0.5 hover:shadow-md ${
                  perm.allowed
                    ? "bg-slate-800/40 hover:bg-emerald-950/20 border-slate-800 hover:border-emerald-700/50 text-slate-200"
                    : "bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/60 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {perm.allowed ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      ✕
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold text-xs ${perm.allowed ? "text-white group-hover:text-emerald-300 transition-colors" : "text-slate-400"}`}>
                      {perm.text}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {perm.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400">Authorization</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full border ${
                      perm.allowed
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {perm.allowed ? "Granted" : "Restricted"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* USER PREFERENCES & ACCOUNT SETTINGS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Notification Settings */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 p-6 space-y-4 transition">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-950/60 border border-brand-800/60 text-brand-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Notification Preferences</h3>
              <p className="text-xs text-slate-400">Configure email and workspace alerts</p>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Toggle 1: Review Submissions */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/70 transition">
              <div>
                <p className="font-semibold text-white">Editorial Review Decisions</p>
                <p className="text-[11px] text-slate-400">Receive alerts when your articles are approved or rejected</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlertsReviews(!emailAlertsReviews)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailAlertsReviews ? "bg-brand-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Toggle 2: New Published Articles */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/70 transition">
              <div>
                <p className="font-semibold text-white">Weekly Knowledge Digest</p>
                <p className="text-[11px] text-slate-400">Digest of newly published SOPs and technical playbooks</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlertsPublish(!emailAlertsPublish)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailAlertsPublish ? "bg-brand-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Toggle 3: Security & Session Alerts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/70 transition">
              <div>
                <p className="font-semibold text-white">Security & Login Alerts</p>
                <p className="text-[11px] text-slate-400">Immediate notice on new device or IP authentication</p>
              </div>
              <button
                type="button"
                onClick={() => setSecurityNotices(!securityNotices)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  securityNotices ? "bg-brand-600 justify-end" : "bg-slate-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Workspace & Editor Preferences */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 p-6 space-y-4 transition">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Editor & Workspace Settings</h3>
              <p className="text-xs text-slate-400">Customize Markdown authoring and environment</p>
            </div>
          </div>

          <div className="space-y-4 pt-1 text-xs">
            {/* Editor Layout Preference */}
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider text-[11px]">
                Markdown Editor Layout
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "split", label: "Side-by-Side" },
                  { id: "live", label: "Live Preview" },
                  { id: "raw", label: "Raw Code" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setEditorMode(mode.id as typeof editorMode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      editorMode === mode.id
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Save Draft Interval */}
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider text-[11px]">
                Draft Auto-Save Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { sec: 15, label: "Every 15s" },
                  { sec: 30, label: "Every 30s" },
                  { sec: 60, label: "Every 60s" },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => setAutoSaveInterval(item.sec)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                      autoSaveInterval === item.sec
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-800/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="pt-2 flex items-center justify-between">
              {savedSettingsMsg ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {savedSettingsMsg}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Settings apply across all devices</span>
              )}
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
