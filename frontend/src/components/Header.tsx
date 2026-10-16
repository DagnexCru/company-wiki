import { BookOpen, Search, Bell } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({}: HeaderProps) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">Company Wiki</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            Phase 1 Foundation
          </span>
        </div>
      </div>

      {/* Global Quick Search Mockup / Shortcut */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm w-72">
        <Search className="w-4 h-4 text-slate-400" />
        <span>Quick search knowledge base...</span>
        <kbd className="ml-auto font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-sm">
          Ctrl K
        </kbd>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700">
            AD
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-800">Admin Lead</p>
            <p className="text-slate-400">Phase 1 Dev Mode</p>
          </div>
        </div>
      </div>
    </header>
  );
};
