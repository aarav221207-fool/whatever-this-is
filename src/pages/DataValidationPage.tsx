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
  FileSpreadsheet,
  XCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  getValidationReport,
  revalidateData,
  validateUploadedFile,
  ValidationReport,
  ValidationFinding,
  UploadedRecordItem,
} from "../lib/placementAiApi";

export const DataValidationPage: React.FC = () => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [validatingUpload, setValidatingUpload] = useState<boolean>(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<UploadedRecordItem | null>(null);

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
      toast.success("Fresh data audit executed across all registered datasets!");
    } catch (err: any) {
      toast.error(err.message || "Revalidation failed");
    } finally {
      setRevalidating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setValidatingUpload(true);
      const res = await validateUploadedFile(file);
      setLastUploadedFile(res.file);
      setReport(res.overallReport);
      toast.success(`Validated '${file.name}' — Compliance Score: ${res.file.complianceScore}%`);
    } catch (err: any) {
      toast.error(err.message || "Failed to validate uploaded file");
    } finally {
      setValidatingUpload(false);
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
            Audits institutional seeds, benchmarks, mock data, and dynamically uploaded datasets against strict schemas.
          </p>
        </div>

        <button
          onClick={handleRevalidate}
          disabled={revalidating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
          {revalidating ? "Re-Auditing Datasets..." : "Run Fresh Data Audit"}
        </button>
      </div>

      {/* Upload File to Validate Panel (Priority 1 & 4) */}
      <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload Dataset for On-The-Fly Quality Audit</h3>
              <p className="text-xs text-slate-600">
                Upload any CSV, XLSX, JSON, TXT, PDF, or DOCX file. The engine validates actual headers, missing cells, data types, and records.
              </p>
            </div>
          </div>

          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-2 shadow-xs">
            <UploadCloud className="w-4 h-4" />
            <span>{validatingUpload ? "Analyzing File..." : "Choose Dataset File to Validate"}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.docx"
              onChange={handleFileUpload}
              disabled={validatingUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded File Audit Preview */}
        {lastUploadedFile && (
          <div className="mt-3 p-3.5 rounded-xl bg-white border border-indigo-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Latest Audit: {lastUploadedFile.fileName} ({lastUploadedFile.fileType.toUpperCase()})
              </span>
              <span className="font-mono font-bold text-indigo-600">
                Compliance Score: {lastUploadedFile.complianceScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
              <div>Rows / Records: <strong className="text-slate-800">{lastUploadedFile.rowCount || 0}</strong></div>
              <div>Columns: <strong className="text-slate-800">{lastUploadedFile.columnCount || 0}</strong></div>
              <div>Characters: <strong className="text-slate-800">{lastUploadedFile.charCount}</strong></div>
              <div>Detected Issues: <strong className="text-slate-800">{lastUploadedFile.customFindings?.length || 0}</strong></div>
            </div>

            {lastUploadedFile.headers && lastUploadedFile.headers.length > 0 && (
              <div className="text-[11px] text-slate-500 truncate">
                Columns: <span className="font-mono">{lastUploadedFile.headers.join(", ")}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Overall Integrity Score
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">
              {report?.overallScore || 0}%
            </span>
            <span className="text-xs text-slate-400">Compliance</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Records Audited
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-800">
              {report?.totalAudited || 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {report?.totalValid || 0} valid
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Warnings
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-500">
              {report?.totalWarnings || 0}
            </span>
            <span className="text-xs text-slate-400">Deficits flagged</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Critical Errors
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${(report?.totalErrors || 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {report?.totalErrors || 0}
            </span>
            <span className="text-xs text-slate-400">Schema violations</span>
          </div>
        </div>
      </div>

      {/* Dataset Breakdowns Table */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Registered Datasets Compliance Breakdowns ({report?.datasetBreakdowns.length || 0})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Dataset Name</th>
                <th className="pb-3 text-center">Records</th>
                <th className="pb-3 text-center">Valid</th>
                <th className="pb-3 text-center">Warnings</th>
                <th className="pb-3 text-center">Errors</th>
                <th className="pb-3 text-right">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.datasetBreakdowns.map((ds) => (
                <tr key={ds.dataset} className="hover:bg-slate-50/50">
                  <td className="py-3">
                    <span className="font-bold text-slate-800 block">{ds.displayName}</span>
                    <span className="text-[11px] text-slate-400 block max-w-sm">{ds.description}</span>
                  </td>
                  <td className="py-3 text-center font-mono font-medium">{ds.totalRecords}</td>
                  <td className="py-3 text-center font-mono text-emerald-600 font-bold">{ds.validRecords}</td>
                  <td className="py-3 text-center font-mono text-amber-600 font-semibold">{ds.warningsCount}</td>
                  <td className="py-3 text-center font-mono text-red-600 font-semibold">{ds.errorsCount}</td>
                  <td className="py-3 text-right">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      ds.complianceRate >= 90
                        ? "bg-emerald-50 text-emerald-700"
                        : ds.complianceRate >= 70
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {ds.complianceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Findings Registry & Filtering */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Audited Findings & Schema Deviations ({filteredFindings.length})
            </h2>
            <p className="text-xs text-slate-500">
              Individual discrepancies detected by institutional placement data validation rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All Severities</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>

            <select
              value={datasetFilter}
              onChange={(e) => setDatasetFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="all">All Datasets</option>
              <option value="seed_companies">Seed Companies</option>
              <option value="radix_benchmarks">RADIX Benchmarks</option>
              <option value="mock_resume">Mock Resume Data</option>
              <option value="sample_jds">Sample JDs</option>
              <option value="uploaded_dataset">Uploaded Datasets</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings by rule ID, description, or record ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No audit findings match your selected filters. All inspected records comply with validation standards.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredFindings.map((f) => (
              <div key={f.id} className="py-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {f.severity === "error" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                        Error
                      </span>
                    )}
                    {f.severity === "warning" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                        Warning
                      </span>
                    )}
                    {f.severity === "info" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                        Info
                      </span>
                    )}
                    <span className="font-bold text-slate-900">{f.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">({f.ruleId})</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {String(f.recordId)}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {f.description}
                </p>

                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5">
                  <span className="font-bold text-slate-900 shrink-0">Remedy:</span>
                  <span>{f.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
