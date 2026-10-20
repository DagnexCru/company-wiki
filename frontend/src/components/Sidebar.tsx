import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  CheckSquare,
  History,
  Shield,
  Layers,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  exact: boolean;
  badge?: string;
}

export const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      exact: true,
    },
    {
      label: "Public Portal",
      icon: Home,
      path: "/",
      exact: true,
    },
    {
      label: "Articles",
      icon: FileText,
      path: "/articles",
      exact: false,
    },
    {
      label: "Categories & Tags",
      icon: FolderTree,
      path: "/taxonomy",
      exact: false,
    },
    ...(user?.role === "REVIEWER" || user?.role === "ADMIN"
      ? [
          {
            label: "Review Queue",
            icon: CheckSquare,
            path: "/reviews",
            exact: false,
          },
        ]
      : []),
    {
      label: "Audit & History",
      icon: History,
      path: "/history",
      exact: false,
    },
    ...(user?.role === "ADMIN"
      ? [
          {
            label: "Role Management",
            icon: Shield,
            path: "/admin/roles",
            exact: false,
          },
        ]
      : []),

  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-indigo-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Status Box */}
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">
              Knowledge Base Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Role-based access & version control active across all workspaces.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span>Active Role:</span>
        <span className="font-semibold text-slate-200 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          {user?.role || "Guest"}
        </span>
      </div>
    </aside>
  );
};

// Navigation: Knowledge Base routes are highlighted based on react-router location.
