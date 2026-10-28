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
  Upload,
  XCircle,
  RotateCcw,
  ShieldAlert,
  FileCheck2,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import {
  runPlacementPipeline,
  getPipelineHistory,
  PipelineExecutionResult,
} from "../lib/placementAiApi";
import { extractDocument } from "../lib/radixApi";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/radixSamples";

export const AiPipelinePage: React.FC = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [targetCompany, setTargetCompany] = useState<string>("Accenture");
  const [roleTitle, setRoleTitle] = useState<string>("Senior Cloud Backend Engineer");
  const [analysisType, setAnalysisType] = useState<PipelineExecutionResult["analysisType"]>("comprehensive_placement");
  const [rawText, setRawText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [allowFallback, setAllowFallback] = useState<boolean>(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Processing file: ${file.name}...`);
    try {
      const extracted = await extractDocument(file);
      setUploadedFileName(file.name);
      setRawText(extracted.text);
      if (extracted.file_name.toLowerCase().includes("accenture")) setTargetCompany("Accenture");
      else if (extracted.file_name.toLowerCase().includes("google")) setTargetCompany("Google");
      else if (extracted.file_name.toLowerCase().includes("microsoft")) setTargetCompany("Microsoft");

      toast.success(
        `Parsed ${extracted.file_type.toUpperCase()}: ${extracted.word_count} words extracted`,
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to process uploaded file", { id: toastId });
    } finally {
      setIsUploading(false);
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
        allowFallback,
      });

      setActiveResult(result);
      setHistoryRuns((prev) => [result, ...prev]);

      if (result.finalStatus === "success") {
        toast.success(`Pipeline ${result.runId} completed with genuine AI output in ${result.totalDurationMs}ms!`);
      } else if (result.finalStatus === "fallback") {
        toast.warning(`Pipeline ${result.runId} generated deterministic baseline (Fallback mode active).`);
      } else {
        toast.error(`Pipeline ${result.runId} failed: ${result.errorMessage || "AI generation failed"}`);
      }
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
      setUploadedFileName("");
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
          {running ? "Processing 8 Stages..." : "Execute Pipeline Run"}
        </button>
      </div>

      {/* 8-Stage Architecture Flow Visualizer */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Authoritative 8-Stage Execution Topology
        </span>
        <div className="flex items-center justify-between min-w-[750px] gap-2">
          {[
            { step: 1, title: "1. Ingestion", sub: "Files & Seeds" },
            { step: 2, title: "2. Parsing", sub: "Doc Extraction" },
            { step: 3, title: "3. Tax Normalization", sub: "RADIX 12 Schema" },
            { step: 4, title: "4. Quality Check", sub: "Data Verification" },
            { step: 5, title: "5. Prompt Assembly", sub: "Context Synthesis" },
            { step: 6, title: "6. LLM Inference", sub: "Active Provider" },
            { step: 7, title: "7. Schema Verification", sub: "JSON Validation" },
            { step: 8, title: "8. Persistent Audit", sub: "Storage History" },
          ].map((st, i) => (
            <React.Fragment key={st.step}>
              <div className="flex-1 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-center">
                <span className="text-[11px] font-bold text-slate-800 block truncate">{st.title}</span>
                <span className="text-[10px] text-slate-400 block truncate">{st.sub}</span>
              </div>
              {i < 7 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pipeline Input Configuration Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pipeline Ingestion & Execution Parameters</h2>
            <p className="text-xs text-slate-500">
              Supply custom recruitment text, upload a document/spreadsheet (PDF, DOCX, TXT, CSV, XLSX, JSON), or choose a verified institutional seed.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Sample JDs:</span>
            {SAMPLE_JOB_DESCRIPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.id)}
                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 rounded-lg transition-colors"
              >
                {s.company}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Target Recruiting Company</label>
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Accenture, Google, Microsoft"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Role / Position Title</label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Analysis Dimension</label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="comprehensive_placement">Comprehensive Placement Assessment</option>
              <option value="interview_strategy">Technical Interview Strategy</option>
              <option value="skill_gap_analysis">Skill Deficit & Remedial Roadmap</option>
              <option value="eligibility_audit">Recruitment Eligibility Audit</option>
            </select>
          </div>
        </div>

        {/* File Ingestion Dropzone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Document / Dataset Upload (All Supported Formats)</label>
            {uploadedFileName && (
              <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5" />
                Active File: {uploadedFileName}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="w-full sm:w-auto px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2 shrink-0">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{isUploading ? "Extracting..." : "Choose File (PDF, DOCX, TXT, CSV, XLSX, JSON)"}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            <span className="text-[11px] text-slate-400">
              The universal file parser extracts structured rows, columns, or text and feeds the data into Stage 1.
            </span>
          </div>
        </div>

        {/* Raw Text Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Raw Input Text / Context Data</label>
          <textarea
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw Job Description, student resume, or spreadsheet excerpt here... (If blank, institutional recruitment seeds are used)"
            className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Fallback Control Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={allowFallback}
              onChange={(e) => setAllowFallback(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Allow deterministic baseline fallback if LLM request fails</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {allowFallback
              ? "Fallback permitted: Will label output as [DETERMINISTIC FALLBACK] if AI fails."
              : "Strict AI Mode: Will fail cleanly with exact error details if AI call is unsuccessful."}
          </span>
        </div>
      </div>

      {/* Execution Results Display */}
      {activeResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {activeResult.runId}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeResult.targetCompany} — {activeResult.role}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Executed: {new Date(activeResult.timestamp).toLocaleString()}</span>
                <span>•</span>
                <span>Latency: {activeResult.totalDurationMs} ms</span>
                <span>•</span>
                <span>Provider: {activeResult.providerUsed.toUpperCase()} ({activeResult.modelUsed})</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeResult.finalStatus === "success" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  GENUINE AI OUTPUT
                </span>
              )}
              {activeResult.finalStatus === "fallback" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  DETERMINISTIC FALLBACK
                </span>
              )}
              {activeResult.finalStatus === "failed" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  EXECUTION FAILED
                </span>
              )}

              {activeResult.finalStatus === "failed" && (
                <button
                  onClick={handleExecute}
                  disabled={running}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          </div>

          {/* Fallback Banner If Active */}
          {activeResult.isFallback && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Deterministic Fallback Assessment Active</span>
              </div>
              <p>
                This report was synthesized using deterministic placement heuristics because the configured LLM request could not be completed.
                {activeResult.fallbackReason && <span> Reason: {activeResult.fallbackReason}</span>}
              </p>
            </div>
          )}

          {/* Failure Banner If Failed */}
          {activeResult.finalStatus === "failed" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-950">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>AI Pipeline Execution Halted</span>
              </div>
              <p>
                {activeResult.errorMessage || "The configured LLM provider rejected the request or returned an invalid response."}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleExecute}
                  disabled={running}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Execution
                </button>
                <a
                  href="/ai-settings"
                  className="text-red-700 font-bold hover:underline"
                >
                  Verify AI Settings & Key →
                </a>
              </div>
            </div>
          )}

          {/* 8 Stages Execution Audit Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Execution Stage Audit Logs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeResult.stages.map((st) => (
                <div
                  key={st.stage}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-2.5 text-xs"
                >
                  {st.status === "success" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  {st.status === "warning" && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  {st.status === "error" && (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  {st.status === "skipped" && (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{st.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{st.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{st.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result Tabs (Only if output is present) */}
          {activeResult.output && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
                {[
                  { id: "summary", label: "Executive Summary & Score" },
                  { id: "gaps", label: "Gap Analysis" },
                  { id: "interview", label: "Interview Strategy" },
                  { id: "roadmap", label: "30-Day Sprint Roadmap" },
                  { id: "json", label: "Verified JSON" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      activeTab === t.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Summary */}
              {activeTab === "summary" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Match Rating</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {activeResult.output.readiness_rating}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Readiness Score</span>
                      <div className="text-lg font-bold text-blue-600 mt-1">
                        {activeResult.output.readiness_score} / 100
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Key Strengths</span>
                      <div className="text-xs text-slate-700 font-medium mt-1">
                        {activeResult.output.strengths.length} competencies verified
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recruitment Assessor Executive Summary
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {activeResult.output.executive_summary}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Validated Strengths
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {activeResult.output.strengths.map((s, i) => (
                        <li key={i} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Gap Analysis */}
              {activeTab === "gaps" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Identified Skill Gaps & Remedial Action Plans
                  </h4>
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
                        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900 text-[11px]">
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
                      System Design & Coding Topics
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
                      Managerial & Cultural Alignment
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

              {/* Tab 4: Roadmap */}
              {activeTab === "roadmap" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Curated 30-Day Campus Recruitment Preparation Sprint
                  </h4>
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

              {/* Tab 5: JSON */}
              {activeTab === "json" && (
                <div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(activeResult, null, 2)}
                  </pre>
                </div>
              )}
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
                  {r.finalStatus === "fallback" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-700">
                      Fallback
                    </span>
                  )}
                  {r.finalStatus === "failed" && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700">
                      Failed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-mono">
                  <span>{r.totalDurationMs}ms</span>
                  {r.output ? (
                    <span className="text-emerald-600 font-bold">{r.output.readiness_score}%</span>
                  ) : (
                    <span className="text-red-500 font-bold">ERR</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
