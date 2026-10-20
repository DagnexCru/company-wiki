import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-brand-500 selection:text-white">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Back to Home Link */}
        <div className="flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to Company<span className="text-brand-400">Wiki</span>
          </h1>
          <p className="text-xs text-slate-400">
            Access internal policies, technical documentation, and workflows.
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="bg-slate-800/80 backdrop-blur-2xl rounded-3xl border border-slate-700/80 p-8 shadow-2xl ring-1 ring-white/10 space-y-6">
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
          <div className="pt-5 border-t border-slate-700/70">
            <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-slate-400">
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

        <div className="text-center text-xs text-slate-400">
          Need an account?{" "}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors ml-1">
            Create an internal account
          </Link>
        </div>
      </div>
    </div>
  );
};
