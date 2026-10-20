import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  ArrowRight,
  Shield,
  Search,
  Users,
  Lock,
  History,
  ChevronRight,
  Terminal,
  Code,
  FolderTree,
  FileText,
  KeyRound,
  EyeOff,
  GitCommit,
  CheckSquare,
} from "lucide-react";

export const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      navigate(searchQuery ? `/articles?search=${encodeURIComponent(searchQuery)}` : "/articles");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white scroll-smooth">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  Company<span className="text-brand-400">Wiki</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/80 uppercase tracking-wider">
                  Knowledge Base
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Internal Knowledge Base & SOP Wiki
              </p>
            </div>
          </Link>

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

          {/* User Auth Actions */}
          <div className="flex items-center gap-3">
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
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
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
                placeholder="Search standard operating procedures, guides, policies..."
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
              <span>Popular topics:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #onboarding
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #vpn-setup
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                #security-policies
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
              href="#categories"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-base transition-colors"
            >
              <span>Browse Categories</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Powerful Features for High-Performing Teams
            </h2>
            <p className="text-slate-400 text-sm">
              Everything your organization needs to capture, organize, and discover internal knowledge effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-brand-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/60 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Instant Search & Filtering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quickly locate articles by keywords, department categories, tags, or authors with lightning-fast search.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-brand-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Rich Markdown Editor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compose clear guides with formatted text, code blocks, lists, and callouts with instant live preview.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-brand-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Editorial Review Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quality checks and peer review ensure all company documentation meets accuracy standards before publishing.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-brand-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Revision History & Restore</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every document edit preserves past versions. Easily inspect visual line differences or restore older content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Knowledge Directory */}
      <section id="categories" className="py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
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
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Engineering & Product</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                System designs, deployment runbooks, API contracts, development workflows, and infrastructure SOPs.
              </p>
              <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                <span>Core Documentation</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 2 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">IT Support & Helpdesk</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Workstation setup, corporate VPN access, hardware guides, password policies, and helpdesk playbooks.
              </p>
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Support Playbooks</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 3 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">People & HR Onboarding</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                New hire orientation, 30-60-90 day checklists, employee handbooks, company benefits, and team culture.
              </p>
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Onboarding Guides</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Category 4 */}
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-brand-500/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Policies & Compliance</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Work instructions, security protocols, code of conduct, remote work rules, and regulatory standards.
              </p>
              <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
                <span>Official Policies</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Workflow Section */}
      <section id="workflow" className="py-24 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Rigorous Editorial Lifecycle
            </h2>
            <p className="text-slate-400 text-sm">
              Content is never published unvetted. Every article flows through validated state
              transitions to guarantee high quality and accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center border border-slate-700">
                1
              </div>
              <h4 className="text-base font-bold text-white">Author Drafting</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authors create and iteratively refine articles. In-progress drafts remain private and safely isolated from other employees.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Draft Stage
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-white">Submit to Queue</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When finished, the author submits the article. It automatically enters the centralized editorial review backlog.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                In Review
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-white">Independent Review</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized reviewers inspect accuracy and clarity. Peer review safeguards prevent authors from reviewing their own submissions.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Peer Evaluation
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="text-base font-bold text-white">Live Publication</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Approved articles become immediately discoverable across the entire organization with verified timestamps.
              </p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Published Knowledge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Information Architecture
            </h2>
            <p className="text-slate-400 text-sm">
              Structured to help teams find, organize, and maintain institutional knowledge effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/60 flex items-center justify-center">
                <FolderTree className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Department Workspaces</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated spaces for every department to maintain their SOPs, roadmaps, and guides without clutter.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Structured Articles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every document has clean URL slugs, category tags, author metadata, and reading time estimates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                <GitCommit className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Linear Version History</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every revision is saved sequentially so your company's documentation history is never lost or overwritten.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Unified Taxonomy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-department tags and curated categories connect related documentation across different teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Enterprise Security & Privacy
            </h2>
            <p className="text-slate-400 text-sm">
              Built from the ground up to protect your sensitive corporate documentation and company data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Role-Based Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distinct access boundaries for Administrators, Reviewers, Authors, and Readers ensure employees access only what they are authorized to see.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/60 flex items-center justify-center">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Confidential Draft Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                In-progress drafts and internal notes are strictly isolated and invisible to unprivileged readers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Comprehensive Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every important action—from review approvals to permission changes—is permanently recorded in the system audit log.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Secure Authentication</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Industry-standard token encryption with automatic session expiration and instant token invalidation upon sign out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-brand-900/80 via-indigo-950 to-slate-900 border border-brand-700/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to explore your company's knowledge?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Sign in with your corporate account to access documentation, submit guides, and review procedures.
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

      {/* Modern Copyright Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300 tracking-tight">CompanyWiki</span>
          </div>

          <p className="text-center sm:text-left text-slate-500">
            &copy; 2026 CompanyWiki Inc. All rights reserved. Internal Knowledge Base.
          </p>

          <div className="flex items-center gap-5 text-slate-500">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Help &amp; Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
