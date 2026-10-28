import React, { useState, useEffect } from "react";
import {
  GitCommit,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  FileText,
  Target,
  Sparkles,
  Layers,
  History,
  Clock,
  ArrowRight,
  Code,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  runPlacementPipeline,
  getPipelineHistory,
  PipelineExecutionResult,
} from "../lib/placementAiApi";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/radixSamples";

export const AiPipelinePage: React.FC = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [targetCompany, setTargetCompany] = useState<string>("Accenture");
  const [roleTitle, setRoleTitle] = useState<string>("Senior Cloud Backend Engineer");
  const [analysisType, setAnalysisType] = useState<PipelineExecutionResult["analysisType"]>("comprehensive_placement");
  const [rawText, setRawText] = useState<string>("");

  const [activeResult, setActiveResult] = useState<PipelineExecutionResult | null>(null);
  const [historyRuns, setHistoryRuns] = useState<PipelineExecutionResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"summary" | "gaps" | "interview" | "roadmap" | "json">("summary");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getPipelineHistory();
      setHistoryRuns(data.runs || []);
      if (!activeResult && data.runs && data.runs.length > 0) {
        setActiveResult(data.runs[0]);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExecute = async () => {
    try {
      setRunning(true);
      const result = await runPlacementPipeline({
        targetCompany,
        roleTitle,
        rawText: rawText.trim() || undefined,
        analysisType,
      });

      setActiveResult(result);
      setHistoryRuns((prev) => [result, ...prev]);
      toast.success(`Pipeline ${result.runId} completed in ${result.totalDurationMs}ms!`);
    } catch (err: any) {
      toast.error(err.message || "Pipeline execution failed");
    } finally {
      setRunning(false);
    }
  };

  const loadSample = (sampleId: string) => {
    const s = SAMPLE_JOB_DESCRIPTIONS.find((jd) => jd.id === sampleId);
    if (s) {
      setTargetCompany(s.company);
      setRoleTitle(s.title);
      setRawText(s.text);
      toast.info(`Loaded sample JD: ${s.title}`);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Placement Intelligence Pipeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            End-to-end 8-stage placement assessment engine with schema normalization, LLM inference, and verification.
          </p>
        </div>

        <button
          onClick={handleExecute}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-white" />
          )}
          {running ? "Processing Pipeline..." : "Execute Pipeline Run"}
        </button>
      </div>

      {/* 8-Stage Architecture Flow Visualizer */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pipeline Architecture Flow (8-Stage Verification Standard)
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Schema Compliant
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {[
            { step: 1, title: "1. Ingestion" },
            { step: 2, title: "2. Parsing" },
            { step: 3, title: "3. Normalize" },
            { step: 4, title: "4. Quality Check" },
            { step: 5, title: "5. Context Prep" },
            { step: 6, title: "6. LLM Run" },
            { step: 7, title: "7. Verify JSON" },
            { step: 8, title: "8. Persist" },
          ].map((st) => {
            const isCompleted = activeResult && activeResult.stages.length >= st.step;
            return (
              <div
                key={st.step}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isCompleted
                    ? "bg-slate-800 border-blue-500/40 text-white"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-400"
                }`}
              >
                <div className="text-[11px] font-bold truncate">{st.title}</div>
                <div className="text-[10px] mt-1 font-mono text-slate-400">
                  {isCompleted ? "Verified ✓" : "Standby"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls & Configuration Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Execution Parameters
          </h2>

          {/* Quick sample loader */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Load sample:</span>
            {SAMPLE_JOB_DESCRIPTIONS.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.id)}
                className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {s.company}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Company
            </label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="e.g. Accenture, Google, Microsoft"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Role Title
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Analysis Goal
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="comprehensive_placement">Comprehensive Placement Assessment</option>
              <option value="interview_strategy">Technical & HR Interview Strategy</option>
              <option value="skill_gap_analysis">RADIX Skill Gap Analysis</option>
              <option value="eligibility_audit">Eligibility & Policy Compliance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Custom Job Description / Student Profile Text (Optional)
          </label>
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw JD, syllabus, or student profile text. If left empty, seed company intelligence will be ingested automatically."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 font-mono focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Results Section */}
      {activeResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {activeResult.runId}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {activeResult.targetCompany} • {activeResult.role}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>
                  Executed: <strong className="text-slate-600">{new Date(activeResult.timestamp).toLocaleTimeString()}</strong>
                </span>
                <span>•</span>
                <span>
                  Latency: <strong className="text-slate-600">{activeResult.totalDurationMs}ms</strong>
                </span>
                <span>•</span>
                <span>
                  Provider: <strong className="text-slate-600 uppercase">{activeResult.providerUsed} ({activeResult.modelUsed})</strong>
                </span>
              </div>
            </div>

            {/* Match Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Readiness Score</span>
                <span className="text-xl font-black text-slate-900">
                  {activeResult.output.readiness_score}%
                </span>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  activeResult.output.readiness_rating === "High Match"
                    ? "bg-emerald-100 text-emerald-800"
                    : activeResult.output.readiness_rating === "Moderate Match"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {activeResult.output.readiness_rating}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: "summary", label: "Executive Summary & Strengths" },
              { id: "gaps", label: "Skill Gaps & Actions" },
              { id: "interview", label: "Interview Strategy" },
              { id: "roadmap", label: "30-Day Preparation Roadmap" },
              { id: "json", label: "Verified Schema JSON" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === t.id
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Executive Summary */}
          {activeTab === "summary" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Lead Assessor Executive Summary
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {activeResult.output.executive_summary}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Competitive Strengths
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeResult.output.strengths.map((st, i) => (
                    <div key={i} className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Skill Gaps */}
          {activeTab === "gaps" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Identified Skill Deficits & Remedial Actions
              </h3>
              <div className="divide-y divide-slate-100">
                {activeResult.output.gap_analysis.map((gap, i) => (
                  <div key={i} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{gap.category}</span>
                      <span className="text-slate-500 text-[11px]">{gap.current_state}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Benchmark</span>
                      <span className="text-slate-700 font-medium">{gap.required_benchmark}</span>
                    </div>
                    <div className="p-2 rounded bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px]">
                      <strong className="block text-[10px] uppercase text-amber-700">Recommended Action:</strong>
                      {gap.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Interview Strategy */}
          {activeTab === "interview" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Technical Round Focus
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeResult.output.interview_strategy.technical_round_focus.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  System Design & Algorithms
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeResult.output.interview_strategy.system_design_or_coding_topics.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Managerial & Culture Talking Points
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeResult.output.interview_strategy.managerial_hr_talking_points.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: 30-Day Roadmap */}
          {activeTab === "roadmap" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Curated 30-Day Campus Recruitment Preparation Sprint
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeResult.output.actionable_roadmap_30_days.map((plan, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {plan}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Raw JSON */}
          {activeTab === "json" && (
            <div>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
                {JSON.stringify(activeResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Historical Pipeline Runs Drawer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Recent Pipeline Executions ({historyRuns.length})
          </h2>
          <button
            onClick={loadHistory}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {historyRuns.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No pipeline executions recorded yet. Click "Execute Pipeline Run" above.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {historyRuns.map((r) => (
              <div
                key={r.runId}
                onClick={() => setActiveResult(r)}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-600">{r.runId}</span>
                  <span className="font-semibold text-slate-800">{r.targetCompany}</span>
                  <span className="text-slate-400 truncate max-w-xs">{r.role}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-mono">
                  <span>{r.totalDurationMs}ms</span>
                  <span className="text-emerald-600 font-bold">{r.output.readiness_score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
