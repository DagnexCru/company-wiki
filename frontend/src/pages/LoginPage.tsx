import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FolderTree,
  Shield,
  FileCheck2,
} from "lucide-react";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;
  const target = from && from !== "/" ? from : "/dashboard";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      navigate(target, { replace: true });
    } catch {
      // Error handled in AuthContext
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row relative selection:bg-brand-500 selection:text-white">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* LEFT COLUMN: Enterprise Showcase Panel (Top-Aligned) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-slate-950/70 border-r border-slate-800/80 p-8 sm:p-12 lg:p-14 xl:p-16 flex-col justify-between relative overflow-hidden backdrop-blur-xl">
        {/* Subtle Ambient Background Highlight */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container */}
        <div className="space-y-6 z-10">
          {/* Top Row: Back to Home Link (matches right side top bar) */}
          <div className="flex items-center justify-between h-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/80 uppercase tracking-wider">
              Enterprise Portal
            </span>
          </div>

          {/* Brand Header */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Company<span className="text-brand-400">Wiki</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/80 uppercase tracking-wider">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Knowledge Base & SOP Wiki</p>
            </div>
          </div>

          {/* Headline & Value Pitch */}
          <div className="space-y-2 pt-1">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
              The single source of truth for your team's knowledge.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Eliminate lost documentation and onboarding bottlenecks with standardized categories,
              peer-reviewed workflows, and complete revision traceability.
            </p>
          </div>

          {/* Value Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Department Workspaces</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Organized knowledge across Engineering runbooks, IT playbooks, HR guides, and compliance.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Peer-Reviewed Quality Control</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Independent reviewer rules prevent accidental publication of unvetted or outdated guides.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Role-Based Security & Audit</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Granular boundaries for Readers, Authors, Reviewers, and Admins with permanent audit logs.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial / Quote Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-950/40 to-slate-900/60 border border-brand-800/40 text-xs text-slate-300 italic leading-relaxed">
            "Centralizing all procedures in one searchable wiki streamlined onboarding and eliminated team knowledge silos."
            <div className="not-italic text-[11px] text-slate-400 font-semibold mt-1.5">
              — Engineering & Operations Team
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="text-xs text-slate-500 z-10 flex items-center justify-between pt-6 border-t border-slate-800/60">
          <span>&copy; 2026 CompanyWiki Inc.</span>
          <span>Internal Knowledge Base</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form Panel (Top-Aligned) */}
      <div className="flex-1 flex flex-col justify-start items-center p-4 sm:p-8 md:p-12 lg:p-14 xl:p-16 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Top Row: Matches left column Back to Home baseline */}
          <div className="hidden lg:flex items-center text-xs text-slate-400 h-5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 uppercase tracking-wider">
              Secure Sign In
            </span>
          </div>

          {/* Mobile Header Link (When Left Column is hidden on small screens) */}
          <div className="w-full lg:hidden flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-sm">CompanyWiki</span>
            </div>
          </div>

          {/* Card Title & Introduction: Sits on the exact same horizontal plane as left headline */}
          <div className="space-y-1.5 text-center lg:text-left pt-2">
            <h1 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">
              Sign in to Account
            </h1>
            <p className="text-xs text-slate-400">
              Welcome back. Enter your credentials to access your internal workspace.
            </p>
          </div>

          {/* Glassmorphic Form Container */}
          <div className="bg-slate-800/80 backdrop-blur-2xl rounded-3xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl ring-1 ring-white/10 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span>{isLoading ? "Signing in..." : "Sign in to Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-4 border-t border-slate-700/70">
              <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Quick Demo Sign-in (Seeded Accounts):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("admin@company.com", "AdminPassword123!")}
                  className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-700/60 hover:border-purple-500/60 text-slate-200 text-left transition font-medium flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>👑</span>
                  <span className="font-semibold text-purple-300">Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("author@company.com", "AuthorPassword123!")}
                  className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-700/60 hover:border-emerald-500/60 text-slate-200 text-left transition font-medium flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>✍️</span>
                  <span className="font-semibold text-emerald-300">Author</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("reviewer@company.com", "ReviewerPassword123!")}
                  className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-700/60 hover:border-amber-500/60 text-slate-200 text-left transition font-medium flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>🔍</span>
                  <span className="font-semibold text-amber-300">Reviewer</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("reader@company.com", "ReaderPassword123!")}
                  className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-700/60 hover:border-sky-500/60 text-slate-200 text-left transition font-medium flex items-center gap-2 hover:scale-[1.02]"
                >
                  <span>📖</span>
                  <span className="font-semibold text-sky-300">Reader</span>
                </button>
              </div>
            </div>
          </div>

          {/* Registration Navigation Link */}
          <div className="text-center text-xs text-slate-400">
            Need an account?{" "}
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors ml-1">
              Create an internal account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
