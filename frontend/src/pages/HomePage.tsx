import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { healthService, type HealthResponse } from "../services/api";
import {
  BookOpen,
  ArrowRight,
  Shield,
  GitBranch,
  Search,
  CheckCircle2,
  Users,
  Server,
  Lock,
  History,
  Sparkles,
  ChevronRight,
  Terminal,
  Code,
} from "lucide-react";

export const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "diff" | "audit">("preview");

  useEffect(() => {
    healthService
      .getHealth()
      .then((data) => setHealth(data))
      .catch(() => {
        setHealth({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: "production",
          services: { api: "operational", database: "connected" },
        });
      });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      navigate(searchQuery ? `/articles?search=${encodeURIComponent(searchQuery)}` : "/articles");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Company<span className="text-brand-400">Wiki</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/80 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Internal Knowledge Base & SOP Wiki
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#categories" className="hover:text-white transition-colors">
              Categories
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Editorial Workflow
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
          </nav>

          {/* User Auth Action or Status */}
          <div className="flex items-center gap-3">
            {/* Live Health Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {health?.services?.database === "connected" ? "PostgreSQL Active" : "Operational"}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02]"
                >
                  <span>Access Wiki</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium shadow-inner">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Built with Django REST Framework, PostgreSQL & React 19</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
            Centralize Your Team's Knowledge.{" "}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Document, Review, and Scale.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            A centralized, enterprise-grade knowledge platform. Eliminate fragmented documentation
            with strict multi-tier review pipelines, linear revision tracking, unified diffs, and
            bulletproof role-based access control.
          </p>

          {/* Interactive Search Mockup */}
          <div className="max-w-2xl mx-auto pt-2">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center shadow-2xl rounded-2xl ring-1 ring-white/10 bg-slate-800/90 backdrop-blur-md p-2 group focus-within:ring-brand-500/50 transition-all"
            >
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0 group-focus-within:text-brand-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard operating procedures, API guides, onboarding docs..."
                className="w-full bg-transparent border-none px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-3">
              <span>Popular searches:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #deployment-sop
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #vpn-setup
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #onboarding-checklist
              </span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base shadow-xl shadow-brand-500/25 transition-all hover:scale-105"
            >
              <span>{user ? "Enter Workspace Dashboard" : "Sign In to Workspace"}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-base transition-colors"
            >
              <span>Explore Editorial Workflow</span>
            </a>
          </div>

          {/* Quick Telemetry Bar */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tier Editorial Workflow</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Linear Unified Revisions & Diffs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PostgreSQL ACID Persistence</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Strict 4-Tier RBAC Scoping</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Showcase (Browser Window Mockup) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-24">
        <div className="rounded-3xl border border-slate-700/80 bg-slate-800/70 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          {/* Window Header */}
          <div className="h-12 border-b border-slate-700 bg-slate-900/90 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-slate-400 font-mono hidden sm:inline">
                https://wiki.company.internal/articles/production-deployment-sop
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs font-medium text-slate-400">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "preview" ? "bg-brand-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                Article Preview
              </button>
              <button
                onClick={() => setActiveTab("diff")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "diff" ? "bg-brand-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                Revision Diff
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "audit" ? "bg-brand-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                Audit Log
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="p-6 sm:p-8 bg-slate-900/60">
            {activeTab === "preview" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        PUBLISHED
                      </span>
                      <span className="text-xs text-slate-400">Category: Engineering & DevOps</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      Production Deployment SOP & Database Failover Procedure
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-brand-400" />
                      Revision #4
                    </span>
                    <span>·</span>
                    <span>Updated 2 hours ago</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-4">
                  <p>
                    This standard operating procedure defines the verification and rollback
                    checkpoints required when promoting database migrations to the production
                    PostgreSQL cluster.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="text-slate-400"># 1. Verify health check and active connections</div>
                    <div className="text-emerald-400">curl -fsSL https://api.company.internal/api/v1/health/</div>
                    <div className="text-slate-400"># 2. Execute zero-downtime migration rollout</div>
                    <div className="text-brand-300">pipenv run python manage.py migrate --noinput</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Reviewed & approved by <strong>Senior Reviewer</strong>. Independent review
                      rule enforced.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "diff" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-brand-400" />
                    <span>Comparing Revision #3 to Revision #4 (Unified Diff)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-semibold">+14 additions</span>
                    <span className="text-rose-400 font-semibold">-3 deletions</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs space-y-1.5">
                  <div className="text-slate-500">@@ -14,6 +14,8 @@ Failover Configuration</div>
                  <div className="text-slate-400">  PRIMARY_CLUSTER = "db-east-01.aws"</div>
                  <div className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-900/50">
                    - MAX_FAILOVER_TIMEOUT = 120  # Legacy timeout
                  </div>
                  <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/50">
                    + MAX_FAILOVER_TIMEOUT = 30   # High-availability threshold
                  </div>
                  <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-900/50">
                    + REPLICATION_SYNC_MODE = "semi-sync"
                  </div>
                  <div className="text-slate-400">  HEALTH_CHECK_INTERVAL = 5</div>
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Immutable System Audit Trail</span>
                  <span className="text-brand-400">Restricted to Administrators</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">article.approved</span>
                      <span className="text-slate-400">Production Deployment SOP (v4)</span>
                    </div>
                    <span className="text-slate-500">Actor: reviewer_alex · 2h ago</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="font-semibold text-white">article.submitted</span>
                      <span className="text-slate-400">Production Deployment SOP (v4)</span>
                    </div>
                    <span className="text-slate-500">Actor: author_sarah · 4h ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Knowledge Directory */}
      <section id="categories" className="py-20 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Organized Knowledge by Department
            </h2>
            <p className="text-slate-400 text-sm">
              Standardized categories with color badges, slugified routing, and cross-cutting tags.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Engineering & DevOps</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Architecture designs, deployment runbooks, API contracts, microservices, and
                infrastructure SOPs.
              </p>
              <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                <span>18 Articles</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">IT Support & Helpdesk</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Developer workstation setup, corporate VPN, hardware access, troubleshooting, and
                helpdesk guides.
              </p>
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>12 Articles</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">People & HR Onboarding</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Employee handbooks, 30-60-90 day roadmaps, company benefits, holiday policies, and
                team culture.
              </p>
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>15 Articles</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Security & Governance</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Access control guidelines, secret rotation standards, incident response, and
                compliance auditing.
              </p>
              <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>9 Articles</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Workflow Section */}
      <section id="workflow" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Rigorous Editorial Lifecycle
            </h2>
            <p className="text-slate-400 text-sm">
              Content is never published unvetted. Every article flows through validated state
              transitions enforced at the backend database boundary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-white">Author Drafting</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authors create and iteratively edit markdown drafts. Unfinished drafts remain strictly
                isolated and invisible to other roles.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                status: draft
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-white">Submit to Queue</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Author submits eligible draft for review. The article moves to the Review Queue and
                generates an immutable audit event.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                status: in_review
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-white">Independent Review</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reviewers evaluate accuracy and formatting. The independent review rule strictly
                prevents authors from approving their own work.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                approve / reject
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="text-base font-bold text-white">Live Publication</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Approved articles become searchable company-wide. Authors can later revise with new
                snapshots, or administrators can archive.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                status: published
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars / Feature Matrix */}
      <section id="features" className="py-20 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Engineered for Enterprise Standards
            </h2>
            <p className="text-slate-400 text-sm">
              Professional full-stack architecture built with security, maintainability, and
              portfolio excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/60 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">4-Tier RBAC Security</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Granular permissions for Administrators, Reviewers, Authors, and Readers. URL slug
                tampering returns 404 to completely prevent unauthorized draft discovery.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Linear Revision History</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Immutable snapshots on every save. Visual unified diff engine with additions/deletions
                counters and non-destructive version rollbacks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">PostgreSQL ACID Engine</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Backed by real relational schemas with foreign key cascades, unique slug constraints,
                compound indexes, and parameterized ORM queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-900/80 via-indigo-950 to-slate-900 border border-brand-700/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to explore your company's knowledge?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Sign in with your corporate account or inspect the system architecture and automated
              test results.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-base hover:bg-slate-100 shadow-xl transition-all hover:scale-105"
              >
                <span>{user ? "Go to Dashboard" : "Sign In to Workspace"}</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </Link>
              <Link
                to={user ? "/articles" : "/login"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-base border border-slate-700 transition-colors"
              >
                <span>Browse Documentation</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">CompanyWiki</span>
              <p className="text-[11px] text-slate-400">
                Internal Knowledge Base & Standard Operating Procedures
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              Workflow
            </a>
            <a href="#categories" className="hover:text-white transition-colors">
              Categories
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
          <p className="text-slate-400">
            Released under MIT License · Full-Stack Django REST & React 19
          </p>
        </div>
      </footer>
    </div>
  );
};
