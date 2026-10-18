import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AccessDeniedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            You do not possess the required organizational privileges to access this administrative resource.
          </p>
        </div>

        {user && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">Current User:</span>
              <span className="font-semibold text-slate-800">{user.email}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium text-slate-500">Assigned Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
