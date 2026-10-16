import { MainLayout } from "./layouts/MainLayout";
import { HealthStatusCard } from "./components/HealthStatusCard";
import { ShieldCheck, Database, Terminal } from "lucide-react";

export function App() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-900 text-white p-8 md:p-10 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Phase 1 Foundation Live</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Internal Knowledge Base & Company Wiki
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Full-stack, enterprise-grade company knowledge platform backed by Django REST Framework,
              PostgreSQL, and React with TypeScript.
            </p>
          </div>

          {/* Background decorative graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* Phase 1 Verification Widget */}
        <section aria-labelledby="system-health-title">
          <HealthStatusCard />
        </section>

        {/* Foundation Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">PostgreSQL 18 Storage</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">company_wiki_db</code> database verified with active connection pooling and Django migrations applied.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Pipenv & DRF Architecture</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Strict virtual environment isolation with versioned endpoints prepared under <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">/api/v1/</code>.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
