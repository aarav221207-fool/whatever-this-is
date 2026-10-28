import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  Sparkles,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  ArrowRight,
  Edit3,
  Copy,
  Target,
  AlertCircle,
  FileCheck2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { parseResume, extractDocument } from "../lib/radixApi";
import { saveStoredProfile } from "../lib/radixAdapters";
import { saveStudentResume, type JobRecommendation } from "../lib/placementRepository";
import { CandidateProfile, RADIX_CATEGORY_METADATA } from "../types/radix";
import { SAMPLE_RESUMES } from "../data/radixSamples";

export const ResumeParserPage: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [sampleMode, setSampleMode] = useState(false);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast.error("Please upload a resume file (.pdf, .docx, .txt) or paste resume text");
      return;
    }
    setIsProcessing(true);
    setUploadError(null);
    try {
      const data = await parseResume(inputText, fileName || "pasted_resume.txt");
      setCandidate(data);
      saveStoredProfile(data);
      if (sampleMode) {
        setRecommendations([]);
        setRecommendationsLoaded(false);
        toast.info("Demo preview only. Sample profiles are never written to Supabase or used for real recommendations.");
        return;
      }
      const jobRecommendations = await saveStudentResume(data);
      setRecommendations(jobRecommendations);
      setRecommendationsLoaded(true);
      if (data.skills.length === 0) {
        toast.warning("Profile saved, but the resume contained no recognized RADIX skills.");
      } else {
        toast.success("Profile and " + data.skills.length + " skills saved to Supabase. Found " + jobRecommendations.length + " real job recommendations.");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to parse or save the resume";
      setUploadError(msg);
      toast.error(msg);
      setCandidate(null);
      setRecommendations([]);
      setRecommendationsLoaded(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setCandidate(null);
    setInputText("");
    setFileName(file.name);
    setSampleMode(false);
    setRecommendations([]);
    setRecommendationsLoaded(false);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      const err = "Unsupported file format (." + ext + "). Please upload a .pdf, .docx, or .txt file.";
      setUploadError(err);
      toast.error(err);
      e.target.value = "";
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading("Extracting text from " + file.name + "...");
    try {
      const extracted = await extractDocument(file);
      setInputText(extracted.text);
      toast.success("Extracted " + extracted.word_count + " words from " + file.name, { id: toastId });
      setIsProcessing(true);
      const parsed = await parseResume(extracted.text, extracted.file_name);
      const jobRecommendations = await saveStudentResume(parsed, file);
      setCandidate(parsed);
      saveStoredProfile(parsed);
      setRecommendations(jobRecommendations);
      setRecommendationsLoaded(true);
      toast.success("Resume stored in Supabase; saved " + parsed.skills.length + " skills and generated " + jobRecommendations.length + " real job recommendations.");
    } catch (err: any) {
      const msg = err.message || "Failed to extract, parse, or save the resume";
      setUploadError(msg);
      toast.error(msg, { id: toastId });
      setCandidate(null);
      setRecommendations([]);
      setRecommendationsLoaded(false);
    } finally {
      setIsExtracting(false);
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const loadSample = (sample: typeof SAMPLE_RESUMES[0]) => {
    setUploadError(null);
    setFileName(`${sample.candidateName.replace(/\s+/g, "_")}_Resume.pdf`);
    setInputText(sample.text);
    toast.info(`Loaded sample resume: ${sample.candidateName}`);
  };

  const handleOpenInBuilder = () => {
    if (candidate) {
      saveStoredProfile(candidate);
    }
    navigate("/profile-builder");
  };

  const handleGoToTalentCheck = () => {
    if (candidate) {
      saveStoredProfile(candidate);
    }
    navigate("/talent-check");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
              Role 2 · Resume Parsing
            </span>
            <span className="text-xs text-slate-500 font-medium">Binary PDF/DOCX Extractor & Normalizer</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Resume Parsing & Entity Extraction
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Converts unstructured candidate resumes (.pdf, .docx, .txt) into structured, validated JSON matching the authoritative RADIX Shared Data Contract with 12-category normalization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {candidate && (
            <>
              <button
                onClick={handleOpenInBuilder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile (Role 3)</span>
              </button>
              <button
                onClick={handleGoToTalentCheck}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Talent Check (Role 4)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Extraction / Parsing Error
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Candidate Resume Document</span>
              </label>

              {/* Sample Selector */}
              <div className="relative group">
                <span className="text-xs font-semibold text-purple-600 cursor-pointer hover:underline">
                  Load Sample Candidate ▼
                </span>
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 py-1">
                  {SAMPLE_RESUMES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                    >
                      <span className="font-semibold text-slate-800">{s.candidateName}</span>
                      <span className="text-slate-500 text-[11px] truncate">{s.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drag & Drop File */}
            <div className={`relative border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
              isExtracting ? "border-purple-500 bg-purple-50/50" : "border-slate-300 hover:border-purple-500 bg-slate-50"
            }`}>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isExtracting || isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className={`w-7 h-7 mx-auto mb-2 ${isExtracting ? "text-purple-600 animate-bounce" : "text-slate-400"}`} />
              <p className="text-xs font-semibold text-slate-800">
                {isExtracting ? "Extracting document bytes via PDF/DOCX parser..." : "Upload candidate resume"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports real <strong className="text-purple-700">PDF, DOCX, and TXT</strong> (up to 4 MB)
              </p>
              {fileName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[11px] font-medium border border-purple-200">
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
                placeholder="Upload a .pdf or .docx resume, or paste raw resume text here..."
                className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleParse}
              disabled={isExtracting || isProcessing || !inputText.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting Skills & Normalizing Categories...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Resume to RADIX Contract</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Parsed Candidate Card */}
        <div className="lg:col-span-7">
          {candidate ? (
            <div className="space-y-6">
              {/* Candidate Info Capsule */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 font-extrabold text-lg border border-purple-100">
                      {candidate.name ? candidate.name.charAt(0) : "C"}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{candidate.name || "Candidate"}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {candidate.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{candidate.email}</span>
                          </span>
                        )}
                        {candidate.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{candidate.phone}</span>
                          </span>
                        )}
                        <span className="text-slate-400">Source: {candidate.source_file}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(candidate, null, 2));
                      toast.success("Candidate Profile JSON copied to clipboard");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </button>
                </div>

                {/* Professional Summary */}
                {candidate.summary ? (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Professional Summary
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{candidate.summary}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-xs italic">
                    No summary paragraph detected in resume document.
                  </div>
                )}
              </div>

              {/* Skills Grid */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Extracted Skills ({candidate.skills.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">12 RADIX Categories</span>
                </div>

                {candidate.skills.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {candidate.skills.map((skill, idx) => {
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
                              {skill.confidence}
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
                    No recognized technical skills found matching the 12 RADIX categories in this document.
                  </div>
                )}
              </div>

              {/* Work Experience */}
              {candidate.experience && candidate.experience.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Experience History ({candidate.experience.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                          <span className="text-[11px] font-semibold text-slate-500">{exp.duration}</span>
                        </div>
                        {exp.company && (
                          <span className="text-xs text-purple-700 font-medium block">{exp.company}</span>
                        )}
                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <User className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Resume Parsed Yet</h3>
                <p className="text-xs text-slate-500">
                  Upload a candidate <span className="font-semibold text-slate-700">.pdf, .docx, or .txt</span> resume on the left or select a sample candidate to extract normalized profile entities.
                </p>
              </div>
              <button
                onClick={() => loadSample(SAMPLE_RESUMES[0])}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
              >
                Load Sample Resume
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
