import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Database, FileSearch, UserRound } from "lucide-react";
import { useCompanies } from "../lib/companyApi";

/**
 * Company-specific readiness scores are intentionally not fabricated.
 * The provided Supabase schema export does not confirm an approved, live
 * company hiring-benchmark table, so this page stays in a truthful setup state.
 */
export const TalentCheckPage: React.FC = () => {
  const { data: companies = [], isLoading, isError, error, refetch } = useCompanies();

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <span className="inline-flex rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          Role 4 · Talent Check
        </span>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Target Company Readiness Evaluation
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Compare a candidate's verified skills against approved company hiring requirements.
        </p>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-base font-bold text-amber-950">Live hiring benchmarks are not configured</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
              The supplied schema confirms company research tables, but it does not establish an approved database table containing company-specific skill levels and hiring criteria. This page will not display sample benchmark scores as if they were real placement predictions.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
              Once approved company requirements are stored in Supabase, this module can calculate readiness scores and skill gaps from those records.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Database className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Live company database status</h2>
            {isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Checking Supabase company records…</p>
            ) : isError ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-700">{error instanceof Error ? error.message : "Could not read company records."}</p>
                <button onClick={() => refetch()} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">
                  Retry database connection
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                {companies.length} company {companies.length === 1 ? "record is" : "records are"} currently visible from <code>public.companies</code>.
              </p>
            )}
            {!isLoading && !isError && companies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {companies.slice(0, 8).map((company) => (
                  <Link key={company.id} to={`/company/intelligence?id=${company.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    {company.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/profile-builder" className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><UserRound className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block text-sm font-bold text-slate-900">Build candidate profile</span><span className="mt-1 block text-xs text-slate-500">Prepare a candidate's skills and experience.</span></span>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
        </Link>
        <Link to="/skill-matching" className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><FileSearch className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block text-sm font-bold text-slate-900">Match against a job description</span><span className="mt-1 block text-xs text-slate-500">Use a real JD instead of assumed employer criteria.</span></span>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
        </Link>
      </section>
    </main>
  );
};
