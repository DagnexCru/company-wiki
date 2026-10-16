import {
  LayoutDashboard,
  FileText,
  FolderTree,
  CheckSquare,
  History,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", active: true },
    { label: "Articles", icon: FileText, path: "/articles", badge: "Phase 3" },
    { label: "Categories & Tags", icon: FolderTree, path: "/taxonomy", badge: "Phase 4" },
    ...(user?.role === "REVIEWER" || user?.role === "ADMIN"
      ? [{ label: "Review Queue", icon: CheckSquare, path: "/reviews", badge: "Phase 7" }]
      : []),
    { label: "Audit & History", icon: History, path: "/history", badge: "Phase 8" },
    ...(user?.role === "ADMIN"
      ? [{ label: "Role Management", icon: Shield, path: "/admin/roles", badge: "Phase 5" }]
      : []),
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    item.active
                      ? "bg-brand-50 text-brand-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        item.active ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        item.active
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Stack Status Box */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-800">Security Architecture</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            SimpleJWT with 60-min access token & 7-day blacklisted refresh token.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Active User:</span>
        <span className="font-semibold text-slate-800">{user?.role || "Guest"}</span>
      </div>
    </aside>
  );
};
