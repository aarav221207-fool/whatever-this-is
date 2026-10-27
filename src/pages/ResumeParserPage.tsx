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
} from "lucide-react";
import { toast } from "sonner";
import { parseResume } from "../lib/radixApi";
import { saveStoredProfile } from "../lib/radixAdapters";
import { CandidateProfile, RADIX_CATEGORY_METADATA } from "../types/radix";
import { SAMPLE_RESUMES } from "../data/radixSamples";

export const ResumeParserPage: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState(SAMPLE_RESUMES[0].text);
  const [fileName, setFileName] = useState("Alex_Mercer_Resume.pdf");
  const [isProcessing, setIsProcessing] = useState(false);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter or paste candidate resume text");
      return;
    }
    setIsProcessing(true);
    try {
      const data = await parseResume(inputText, fileName);
      setCandidate(data);
      saveStoredProfile(data);
      toast.success(`Parsed profile for ${data.name} with ${data.skills.length} skills`);
    } catch {
      toast.error("Failed to parse resume");
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

  const loadSample = (sample: typeof SAMPLE_RESUMES[0]) => {
    setInputText(sample.text);
    setFileName(`${sample.candidateName.replace(/\s+/g, "_")}_Resume.pdf`);
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
            <span className="text-xs text-slate-500 font-medium">Structured Entity & Skill Extractor</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Resume Parsing
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Converts unstructured candidate resumes into structured, validated JSON matching the authoritative RADIX Shared Data Contract with 12-category normalization.
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
            <div className="relative border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-lg p-4 text-center transition-colors bg-slate-50">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700">
                Click to upload <span className="text-purple-600">.pdf, .docx, or .txt</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active file: {fileName}</p>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-600">Resume Plain Text</span>
                <span className="text-[11px] text-slate-400">{inputText.length} characters</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={12}
                placeholder="Paste candidate resume text here..."
                className="w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleParse}
              disabled={isProcessing}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting Skills & Experience...</span>
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
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{candidate.name}</h2>
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
                {candidate.summary && (
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Professional Summary
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{candidate.summary}</p>
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
              </div>

              {/* Work Experience */}
              {candidate.experience && candidate.experience.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Experience History</span>
                  </h3>
                  <div className="space-y-3">
                    {candidate.experience.map((exp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                          <span className="text-[11px] font-semibold text-slate-500">{exp.duration}</span>
                        </div>
                        <span className="text-xs text-purple-700 font-medium block">{exp.company}</span>
                        <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <User className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Resume Parsed Yet</h3>
                <p className="text-xs text-slate-500">
                  Click <span className="font-semibold text-slate-700">"Parse Resume to RADIX Contract"</span> on the left to extract candidate profile entities, skills, and experience history.
                </p>
              </div>
              <button
                onClick={handleParse}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
              >
                Run Quick Demo Parse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
