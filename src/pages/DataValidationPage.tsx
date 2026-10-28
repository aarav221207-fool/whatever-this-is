import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Database,
  Building2,
  FileText,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  getValidationReport,
  revalidateData,
  ValidationReport,
  ValidationFinding,
} from "../lib/placementAiApi";

export const DataValidationPage: React.FC = () => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [revalidating, setRevalidating] = useState<boolean>(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<"all" | "error" | "warning" | "info">("all");
  const [datasetFilter, setDatasetFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const data = await getValidationReport();
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load data audit report");
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidate = async () => {
    try {
      setRevalidating(true);
      const updated = await revalidateData();
      setReport(updated);
      toast.success("Data audit completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Revalidation failed");
    } finally {
      setRevalidating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Auditing institutional placement datasets...
        </div>
      </div>
    );
  }

  const findings = report?.findings || [];
  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (datasetFilter !== "all" && f.dataset !== datasetFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.ruleId.toLowerCase().includes(q) ||
        String(f.recordId).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Data Quality & Institutional Seed Audit
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time validation engine inspecting company records, placement policies, salary benchmarks, and student uploads.
          </p>
        </div>

        <button
          onClick={handleRevalidate}
          disabled={revalidating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${revalidating ? "animate-spin" : ""}`} />
          Run Complete Audit Now
        </button>
      </div>

      {/* Institutional Data Separation Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Data Isolation & Governance Standard
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              Institutional seed datasets are strictly separated from user uploads. Placement statistics and company benchmarks remain tamper-proof.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Institutional Records</span>
            <span className="text-white font-bold text-sm">
              {report?.dataSeparation.institutionalSeedCount || 0}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Session Uploads</span>
            <span className="text-blue-400 font-bold text-sm">
              {report?.dataSeparation.userUploadedCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Compliance Score
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{report?.overallScore}%</span>
            <span className="text-xs font-semibold text-emerald-600">Institutional SLA</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Audited Entities
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{report?.totalAudited}</span>
            <span className="text-xs text-slate-500">records</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rule Violations (Errors)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${(report?.totalErrors || 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {report?.totalErrors}
            </span>
            <span className="text-xs text-slate-400">critical</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Advisory Warnings
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{report?.totalWarnings}</span>
            <span className="text-xs text-slate-400">non-fatal</span>
          </div>
        </div>
      </div>

      {/* Dataset Health Breakdowns */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          Dataset Health Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {report?.datasetBreakdowns.map((ds) => (
            <div key={ds.dataset} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">{ds.dataset}</span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {ds.complianceRate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${ds.complianceRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>{ds.totalRecords} records</span>
                <span className="flex items-center gap-2">
                  <span className="text-emerald-600">{ds.validRecords} valid</span>
                  {ds.warningsCount > 0 && <span className="text-amber-600">{ds.warningsCount} warn</span>}
                  {ds.errorsCount > 0 && <span className="text-red-600">{ds.errorsCount} err</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Findings & Rule Violations Explorer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Audit Findings & Rule Compliance Log
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredFindings.length} of {findings.length} rule evaluation results.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by rule or ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Severity:</span>
          {(["all", "error", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${
                severityFilter === sev
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase ml-3 mr-1">Dataset:</span>
          <select
            value={datasetFilter}
            onChange={(e) => setDatasetFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Datasets</option>
            <option value="seed_companies">Seed Companies</option>
            <option value="radix_benchmarks">RADIX Benchmarks</option>
            <option value="placement_eligibility">Placement Eligibility</option>
            <option value="sample_jds">Sample JDs</option>
            <option value="user_uploads">User Uploads</option>
          </select>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No rule violations match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFindings.map((f) => (
              <div key={f.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    {f.severity === "error" ? (
                      <span className="flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase">
                        <AlertTriangle className="w-3 h-3" /> Error
                      </span>
                    ) : f.severity === "warning" ? (
                      <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] uppercase">
                        <AlertTriangle className="w-3 h-3" /> Warning
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase">
                        <Info className="w-3 h-3" /> Info
                      </span>
                    )}

                    <span className="font-mono font-bold text-slate-500 text-[11px]">{f.ruleId}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-800">{f.title}</span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{f.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>
                      Target: <strong className="text-slate-700 font-mono">Record #{f.recordId}</strong>
                    </span>
                    {f.field && (
                      <span>
                        Field: <strong className="text-slate-700 font-mono">{f.field}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 max-w-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Recommended Fix
                  </span>
                  <p className="text-slate-700 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {f.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
