import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  Briefcase,
  Building,
  ArrowRight,
  Code2,
  Copy,
  Layers,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeJobDescription } from "../lib/radixApi";
import { JobDescriptionResponse, RADIX_CATEGORY_METADATA } from "../types/radix";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/radixSamples";

export const JobDescriptionAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState(SAMPLE_JOB_DESCRIPTIONS[0].text);
  const [fileName, setFileName] = useState("Accenture_Cloud_Engineer_JD.pdf");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<JobDescriptionResponse | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter or paste Job Description text");
      return;
    }
    setIsProcessing(true);
    try {
      const data = await analyzeJobDescription(inputText, fileName);
      setResult(data);
      // Cache last analyzed JD for instant matching in Role 5
      localStorage.setItem("radix_last_jd", JSON.stringify(data));
      toast.success(`Successfully analyzed ${data.skills.length} skills across 12 RADIX categories`);
    } catch {
      toast.error("Failed to analyze job description");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        toast.info(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const loadSample = (sample: typeof SAMPLE_JOB_DESCRIPTIONS[0]) => {
    setInputText(sample.text);
    setFileName(`${sample.company}_${sample.title.replace(/\s+/g, "_")}.pdf`);
    toast.info(`Loaded sample: ${sample.company} - ${sample.title}`);
  };

  const handleSendToMatching = () => {
    if (!result) return;
    localStorage.setItem("radix_last_jd", JSON.stringify(result));
    navigate("/skill-matching");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
              Role 1 · JD Analytics
            </span>
            <span className="text-xs text-slate-500 font-medium">12-Category Extraction</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Description Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Extract technical competencies, required vs. preferred criteria, and verbatim evidentiary citations classified into the standard 12 RADIX categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={handleSendToMatching}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <span>Match With Candidate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Text Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Job Description Source</span>
              </label>

              {/* Sample Selector */}
              <div className="relative group">
                <span className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                  Load Pre-configured Sample ▼
                </span>
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 py-1">
                  {SAMPLE_JOB_DESCRIPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                    >
                      <span className="font-semibold text-slate-800">{s.company}</span>
                      <span className="text-slate-500 text-[11px] truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drag & drop file area */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 text-center transition-colors bg-slate-50">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700">
                Click to upload <span className="text-blue-600">.pdf, .docx, or .txt</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active file: {fileName}</p>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600">Document Text</span>
                <span className="text-[11px] text-slate-400">{inputText.length} characters</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={12}
                placeholder="Paste Job Description text here..."
                className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Classifying RADIX Categories...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Extract RADIX Competencies</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Analytics Results */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="space-y-6">
              {/* Summary Capsule */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{result.role}</h2>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{result.company}</span>
                        <span>•</span>
                        <span>{result.skills.length} Extracted Skills</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                        toast.success("RADIX Contract JSON copied to clipboard");
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="block text-xl font-black text-slate-800">{result.skills.length}</span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Skills</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="block text-xl font-black text-blue-700">
                      {result.required_skills?.length || 0}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase">Required</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <span className="block text-xl font-black text-indigo-700">
                      {result.preferred_skills?.length || 0}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase">Preferred</span>
                  </div>
                </div>
              </div>

              {/* Categorized Skills Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Extracted Skills with Evidentiary Citations</span>
                  </h3>
                  <span className="text-xs text-slate-500">12 RADIX Categories</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {result.skills.map((skill, idx) => {
                    const meta = RADIX_CATEGORY_METADATA[skill.category_code] || RADIX_CATEGORY_METADATA.OTHER;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{skill.skill_name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}
                            >
                              {skill.category_code} · {meta.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              skill.confidence === "high"
                                ? "bg-emerald-100 text-emerald-800"
                                : skill.confidence === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {skill.confidence} confidence
                          </span>
                        </div>
                        {skill.evidence && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                            {skill.evidence}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Job Description Analyzed Yet</h3>
                <p className="text-xs text-slate-500">
                  Click <span className="font-semibold text-slate-700">"Analyze & Extract RADIX Competencies"</span> on the left to extract skills, category classifications, and grounded citations.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
              >
                Run Quick Demo Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
