import { Link } from "react-router-dom";
import { BookOpen, Search, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({}: HeaderProps) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Administrator",
          classes: "bg-purple-50 text-purple-700 border-purple-200",
          icon: "👑",
        };
      case "AUTHOR":
        return {
          label: "Author",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: "✍️",
        };
      case "REVIEWER":
        return {
          label: "Reviewer",
          classes: "bg-amber-50 text-amber-700 border-amber-200",
          icon: "🔍",
        };
      case "READER":
      default:
        return {
          label: "Reader",
          classes: "bg-sky-50 text-sky-700 border-sky-200",
          icon: "📖",
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-lg group-hover:text-brand-600 transition-colors">Company Wiki</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            Workspace
          </span>
        </div>
      </Link>

      {/* Global Quick Search Shortcut */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm w-72">
        <Search className="w-4 h-4 text-slate-400" />
        <span>Quick search knowledge base...</span>
        <kbd className="ml-auto font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-sm">
          Ctrl K
        </kbd>
      </div>

      {/* Authenticated User Status & Logout */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user.full_name
                  ? user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-slate-800 leading-tight">
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
            </div>

            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
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
