import {
  LayoutDashboard,
  FileText,
  FolderTree,
  CheckSquare,
  History,
  Activity,
  Shield,
  Layers,
} from "lucide-react";

export const Sidebar = () => {
  const navItems = [
    { label: "System Health", icon: Activity, active: true, badge: "Active" },
    { label: "Dashboard", icon: LayoutDashboard, active: false, badge: "Phase 9" },
    { label: "Articles", icon: FileText, active: false, badge: "Phase 3" },
    { label: "Taxonomy", icon: FolderTree, active: false, badge: "Phase 4" },
    { label: "Review Queue", icon: CheckSquare, active: false, badge: "Phase 7" },
    { label: "Audit & History", icon: History, active: false, badge: "Phase 8" },
    { label: "Roles & Admin", icon: Shield, active: false, badge: "Phase 5" },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
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

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-slate-800">Stack Status</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Django REST Framework 5.2 + PostgreSQL 18.4 + React 19 + TypeScript.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        Internal Knowledge Base v1.0
      </div>
    </aside>
  );
};
