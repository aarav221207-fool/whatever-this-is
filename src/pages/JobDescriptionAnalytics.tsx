import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Sparkles,
  Briefcase,
  Building,
  ArrowRight,
  Copy,
  Layers,
  Search,
  XCircle,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeJobDescription, extractDocument } from "../lib/radixApi";
import { JobDescriptionResponse, RADIX_CATEGORY_METADATA } from "../types/radix";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/radixSamples";

export const JobDescriptionAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<JobDescriptionResponse | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error("Please upload a Job Description file (.pdf, .docx, .txt) or paste text");
      return;
    }
    setIsProcessing(true);
    setUploadError(null);
    try {
      const data = await analyzeJobDescription(inputText, fileName || "job_description.txt");
      setResult(data);
      // Cache last analyzed JD for instant matching in Role 5
      localStorage.setItem("radix_last_jd", JSON.stringify(data));
      if (data.skills.length === 0) {
        toast.warning("Parsed Job Description, but no technical skills were matched.");
      } else {
        toast.success(`Successfully analyzed ${data.skills.length} skills across 12 RADIX categories`);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to analyze job description";
      setUploadError(msg);
      toast.error(msg);
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset current state
    setUploadError(null);
    setResult(null);
    setInputText("");
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt", "md"].includes(ext || "")) {
      const err = `Unsupported file format (.${ext}). Please upload a .pdf, .docx, or .txt file.`;
      setUploadError(err);
      toast.error(err);
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading(`Extracting text from ${file.name}...`);

    try {
      const extracted = await extractDocument(file);
      setInputText(extracted.text);
      toast.success(`Extracted ${extracted.word_count} words from ${file.name}`, { id: toastId });

      // Automatically trigger analysis
      setIsProcessing(true);
      try {
        const analyzed = await analyzeJobDescription(extracted.text, extracted.file_name);
        setResult(analyzed);
        localStorage.setItem("radix_last_jd", JSON.stringify(analyzed));
        toast.success(`Extracted ${analyzed.skills.length} requirements for ${analyzed.role} at ${analyzed.company}`);
      } catch (analyzeErr: any) {
        const errMsg = analyzeErr.message || "Extraction succeeded, but JD analysis failed";
        setUploadError(errMsg);
        toast.error(errMsg);
      } finally {
        setIsProcessing(false);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to extract text from document";
      setUploadError(msg);
      toast.error(msg, { id: toastId });
      setInputText("");
      setResult(null);
    } finally {
      setIsExtracting(false);
      e.target.value = "";
    }
  };

  const loadSample = (sample: typeof SAMPLE_JOB_DESCRIPTIONS[0]) => {
    setUploadError(null);
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
            <span className="text-xs text-slate-500 font-medium">Binary PDF/DOCX Ingestion & 12-Category Classification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Description Analytics & Competency Extraction
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
              <span>Match With Candidate (Role 5)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Document Extraction / Analysis Error
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed">{uploadError}</p>
          </div>
        </div>
      )}

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
            <div className={`relative border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
              isExtracting ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-500 bg-slate-50"
            }`}>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isExtracting || isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className={`w-7 h-7 mx-auto mb-2 ${isExtracting ? "text-blue-600 animate-bounce" : "text-slate-400"}`} />
              <p className="text-xs font-semibold text-slate-800">
                {isExtracting ? "Extracting document bytes via PDF/DOCX parser..." : "Upload Job Description document"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports real <strong className="text-blue-700">PDF, DOCX, and TXT</strong> (up to 4 MB)
              </p>
              {fileName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            {/* Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600">Extracted / Editable Text</span>
                <span className="text-[11px] text-slate-400">{inputText.length} characters</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setUploadError(null);
                }}
                rows={11}
                placeholder="Upload a .pdf or .docx Job Description, or paste job requirements text here..."
                className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isExtracting || isProcessing || !inputText.trim()}
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
                      <h2 className="text-lg font-bold text-slate-900">{result.role || "Software Engineer"}</h2>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{result.company || "Target Employer"}</span>
                        <span>•</span>
                        <span>{result.skills.length} Extracted Skills</span>
                        <span>•</span>
                        <span className="text-slate-400">Source: {result.source_file}</span>
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
                    <span>Extracted Skills with Evidentiary Citations ({result.skills.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">12 RADIX Categories</span>
                </div>

                {result.skills.length > 0 ? (
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
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-lg">
                    No recognized technical skills found matching the 12 RADIX categories in this Job Description.
                  </div>
                )}
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
                  Upload a <span className="font-semibold text-slate-700">.pdf, .docx, or .txt</span> Job Description on the left or select a pre-configured sample to extract RADIX requirements.
                </p>
              </div>
              <button
                onClick={() => loadSample(SAMPLE_JOB_DESCRIPTIONS[0])}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
              >
                Load Sample Job Description
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
