import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";
import {
  BookOpen,
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export const RegisterPage = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("READER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { register, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register({
        full_name: fullName,
        username,
        email,
        role,
        password,
        confirm_password: confirmPassword,
      });
      navigate("/dashboard", { replace: true });
    } catch {
      // Error handled by AuthContext
    }
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
              Staff Enrollment
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
                  Staff Access
                </span>
              </div>
              <p className="text-xs text-slate-400">Knowledge Base & SOP Wiki</p>
            </div>
          </div>

          {/* Headline & Value Pitch */}
          <div className="space-y-2 pt-1">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Create and share knowledge that moves teams forward.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Set up your staff account to access internal policies, draft technical runbooks, and
              collaborate on approved company procedures.
            </p>
          </div>

          {/* Value Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Author & Maintain Guides</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Write clear procedures in Markdown with live preview, headings, code blocks, and tags.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Participate in Peer Review</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Review submitted drafts and provide feedback to ensure institutional accuracy.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Role-Based Access</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Your account role grants appropriate access for reading, authoring, or administrative oversight.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial / Quote Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-950/40 to-slate-900/60 border border-brand-800/40 text-xs text-slate-300 italic leading-relaxed">
            "Documenting our processes in one central wiki ensures every new hire hits the ground running from day one."
            <div className="not-italic text-[11px] text-slate-400 font-semibold mt-1.5">
              — Onboarding & Operations Team
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
          <div className="hidden lg:flex items-center justify-between text-xs text-slate-400 h-5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 uppercase tracking-wider">
              Registration Portal
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Corporate Onboarding
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
              Create Staff Account
            </h1>
            <p className="text-xs text-slate-400">
              Join your organization's internal knowledge management platform.
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rachel Vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rachel_v"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                  >
                    <option value="READER">Reader</option>
                    <option value="AUTHOR">Author</option>
                    <option value="REVIEWER">Reviewer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 hover:scale-[1.01]"
              >
                <span>{isLoading ? "Creating account..." : "Register Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-slate-700/80 w-full" />
              <span className="bg-slate-800/90 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Or continue with
              </span>
              <div className="border-t border-slate-700/80 w-full" />
            </div>

            {/* Google Sign-Up Button */}
            <GoogleSignInButton mode="signup" />
          </div>

          {/* Login Navigation Link */}
          <div className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors ml-1">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
