import { Link } from "react-router-dom";
import { BookOpen, Search, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Administrator",
          classes: "bg-purple-950/60 text-purple-300 border-purple-800/60",
          icon: "👑",
        };
      case "AUTHOR":
        return {
          label: "Author",
          classes: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
          icon: "✍️",
        };
      case "REVIEWER":
        return {
          label: "Reviewer",
          classes: "bg-amber-950/60 text-amber-300 border-amber-800/60",
          icon: "🔍",
        };
      case "READER":
      default:
        return {
          label: "Reader",
          classes: "bg-sky-950/60 text-sky-300 border-sky-800/60",
          icon: "📖",
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-white tracking-tight text-base sm:text-lg group-hover:text-indigo-400 transition-colors">
              Company Wiki
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Global Quick Search Shortcut (Desktop Button) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-sm w-72 transition cursor-pointer shadow-xs text-left"
        title="Open command palette (Ctrl+K)"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="truncate">Quick search knowledge base...</span>
        <kbd className="ml-auto font-mono text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 shadow-sm shrink-0">
          Ctrl K
        </kbd>
      </button>

      {/* Authenticated User Status & Mobile Search Trigger */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          aria-label="Open command palette"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition md:hidden"
        >
          <Search className="w-5 h-5" />
        </button>
        {user ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 hover:opacity-90 transition group cursor-pointer"
            title="View profile and account settings"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              {user.full_name
                ? user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors leading-tight">
                {user.full_name || user.username}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full border font-semibold ${roleInfo.classes}`}
                >
                  <span>{roleInfo.icon}</span>
                  <span>{roleInfo.label}</span>
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <a
            href="/login"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
};
