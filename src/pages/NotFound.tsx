import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export const NotFound: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded">
            404 Error
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            The path <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">{location.pathname}</code> does not exist on the portal.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
