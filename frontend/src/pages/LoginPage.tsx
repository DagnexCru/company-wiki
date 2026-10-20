import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/25">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to Company Wiki
          </h1>
          <p className="text-xs text-slate-500">
            Access internal policies, technical documentation, and workflows.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm transition placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign in to Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Quick Demo Sign-in (Seeded Accounts):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@company.com", "AdminPassword123!")}
                className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition font-medium"
              >
                👑 <span className="font-semibold">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("author@company.com", "AuthorPassword123!")}
                className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition font-medium"
              >
                ✍️ <span className="font-semibold">Author</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("reviewer@company.com", "ReviewerPassword123!")}
                className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition font-medium"
              >
                🔍 <span className="font-semibold">Reviewer</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("reader@company.com", "ReaderPassword123!")}
                className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 text-left transition font-medium"
              >
                📖 <span className="font-semibold">Reader</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Need an account?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an internal account
          </Link>
        </div>
      </div>
    </div>
  );
};
