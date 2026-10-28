import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  Database,
  FileCheck2,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getSystemHealth, SystemHealthStatus } from "../lib/placementAiApi";

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load system observability status");
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (loading && !health) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Querying placement system observability telemetry...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Placement System Observability & Health
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time telemetry, memory allocation, API gateway routing, and AI provider connectivity.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Poll Telemetry
        </button>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gateway Status
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-bold text-slate-900 uppercase">
              {health?.status || "Operational"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Process Uptime
          </span>
          <div className="mt-1">
            <span className="text-base font-bold font-mono text-slate-900">
              {formatUptime(health?.uptime_seconds || 0)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Node Heap Usage
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900 font-mono">
              {health?.memory.heap_used_mb} MB
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {health?.memory.heap_total_mb} MB
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Data Audit Health
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-black text-emerald-600">
              {health?.data_validation.overall_score}%
            </span>
            <span className="text-xs text-slate-500">score</span>
          </div>
        </div>
      </div>

      {/* Detailed Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Subsystem 1: AI Engine */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              AI Inference Subsystem
            </h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
              {health?.ai_provider.provider}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">Active Model</span>
              <span className="font-mono font-bold text-slate-800">{health?.ai_provider.model}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">API Key Configured</span>
              <span className="font-bold text-emerald-600">
                {health?.ai_provider.is_configured ? "Yes (Protected)" : "Not Configured"}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">Key Fingerprint</span>
              <span className="font-mono text-slate-600">{health?.ai_provider.masked_key || "None"}</span>
            </div>
          </div>
        </div>

        {/* Subsystem 2: Document Extractor */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              Document Ingestion Subsystem
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
              {health?.document_extractor.status}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">Binary Formats</span>
              <span className="font-mono font-bold text-slate-800">
                {health?.document_extractor.supported_formats.join(", ")}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">Upload Limit</span>
              <span className="font-mono text-slate-800">10 Megabytes (Multer In-Memory)</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500">Scanned PDF Detection</span>
              <span className="font-bold text-emerald-600">HTTP 422 OCR Check Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints Routing Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-500" />
          Active Express Gateway Endpoints
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint Route</th>
                <th className="py-2.5 px-3 text-right">Service Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {health?.endpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-blue-600">{ep.method}</td>
                  <td className="py-2 px-3 text-slate-800">{ep.path}</td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-sans font-semibold">
                    {ep.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
