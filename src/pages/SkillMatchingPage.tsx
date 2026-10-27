import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
  Briefcase,
  Layers,
  Award,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { matchSkills } from "../lib/radixApi";
import { loadStoredProfile, adaptJDResponse } from "../lib/radixAdapters";
import { SAMPLE_JOB_DESCRIPTIONS } from "../data/radixSamples";
import {
  CandidateProfile,
  JobDescriptionResponse,
  SkillMatchResult,
  RADIX_CATEGORY_METADATA,
} from "../types/radix";
import { parseJDText } from "../lib/parserService";

export const SkillMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const [candidate] = useState<CandidateProfile>(() => loadStoredProfile());

  // Load last analyzed JD or use default sample
  const [selectedJdId, setSelectedJdId] = useState<string>("cached_or_first");
  const [useAi, setUseAi] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const initialJD = useMemo<JobDescriptionResponse>(() => {
    try {
      const cached = localStorage.getItem("radix_last_jd");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return parseJDText(SAMPLE_JOB_DESCRIPTIONS[0].text, "Accenture_Cloud_JD.pdf");
  }, []);

  const [activeJD, setActiveJD] = useState<JobDescriptionResponse>(initialJD);
  const [matchResult, setMatchResult] = useState<SkillMatchResult>(() => {
    return matchSkills(candidate, initialJD, false) as any;
  });

  const handleSelectSampleJD = (id: string) => {
    setSelectedJdId(id);
    const sample = SAMPLE_JOB_DESCRIPTIONS.find((s) => s.id === id);
    if (sample) {
      const parsed = parseJDText(sample.text, `${sample.company}_JD.pdf`);
      setActiveJD(parsed);
      const res = matchSkills(candidate, parsed, false);
      Promise.resolve(res).then((r) => setMatchResult(r));
      toast.info(`Loaded JD: ${sample.company} - ${sample.title}`);
    }
  };

  const handleRunAiEvaluation = async () => {
    setIsAiLoading(true);
    try {
      const res = await matchSkills(candidate, activeJD, true);
      setMatchResult(res);
      setUseAi(true);
      toast.success("AI Strategic Analysis generated");
    } catch {
      toast.error("AI enhancement unavailable; using deterministic match");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
              Role 5 · Skill Matching Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Candidate Profile vs. Job Description</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Deterministic Skill Matching & Gap Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Compare candidate verified background against explicit Job Description requirements using exact, normalized, and contextual evidence matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/jd-analytics")}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Upload New JD (Role 1)</span>
          </button>
          <button
            onClick={() => navigate("/profile-builder")}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Edit Profile (Role 3)</span>
          </button>
        </div>
      </div>

      {/* Comparison Source Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Active Candidate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Candidate Profile</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {candidate.skills.length} Logged Skills
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{candidate.name}</h3>
            <p className="text-xs text-slate-500">{candidate.email || "Verified Candidate"}</p>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {candidate.summary}
            </p>
          </div>
        </div>

        {/* Right: Active Job Description */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Target Job Description</span>
            </span>
            {/* Quick Sample Selector */}
            <select
              value={selectedJdId}
              onChange={(e) => handleSelectSampleJD(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="cached_or_first">Active Analyzed JD</option>
              {SAMPLE_JOB_DESCRIPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company} - {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{activeJD.role || "Software Engineer"}</h3>
            <p className="text-xs text-slate-500">Employer: <strong>{activeJD.company || "Target Company"}</strong></p>
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              {activeJD.description_summary || "Explicit requirements extracted from job specification."}
            </p>
          </div>
        </div>
      </div>

      {/* Match Score & Key Verdict */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Match Score Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Match Score</span>
            <div className="text-5xl font-black text-slate-900 my-2 tracking-tight">
              {matchResult.overall_match_score}
              <span className="text-2xl text-slate-400 font-semibold">%</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                matchResult.verdict === "Strong Candidate"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : matchResult.verdict === "Moderate Fit"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }`}
            >
              {matchResult.verdict}
            </span>
          </div>

          {/* Core Metrics */}
          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="block text-xl font-black text-emerald-800">
                  {matchResult.matched_skills.length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">Matched Skills</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                <span className="block text-xl font-black text-rose-800">
                  {matchResult.missing_required_skills.length}
                </span>
                <span className="text-[11px] font-semibold text-rose-700 uppercase">Missing Required</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="block text-xl font-black text-amber-800">
                  {matchResult.missing_preferred_skills.length}
                </span>
                <span className="text-[11px] font-semibold text-amber-700 uppercase">Missing Preferred</span>
              </div>
            </div>

            {/* AI Enhancement Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs text-indigo-900 font-semibold">
                  Generate senior recruiter AI strategic interview preparation insights
                </span>
              </div>
              <button
                onClick={handleRunAiEvaluation}
                disabled={isAiLoading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 shrink-0"
              >
                {isAiLoading ? "Generating..." : "Run AI Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Analysis Box (if generated) */}
        {matchResult.ai_analysis && (
          <div className="mt-6 p-4 bg-indigo-950 text-indigo-100 rounded-xl space-y-1.5 border border-indigo-800">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Senior Talent Assessor Strategic Insights</span>
            </div>
            <p className="text-xs leading-relaxed text-indigo-100">{matchResult.ai_analysis}</p>
          </div>
        )}
      </div>

      {/* Matched Skills with Evidentiary Citations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Verified Matched Competencies ({matchResult.matched_skills.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Every match supported by candidate evidence</span>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {matchResult.matched_skills.map((skill, idx) => {
            const meta = RADIX_CATEGORY_METADATA[skill.category_code] || RADIX_CATEGORY_METADATA.OTHER;
            return (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{skill.skill_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}>
                      {skill.category_code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({skill.source} match)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Verified In Profile
                  </span>
                </div>
                {skill.evidence && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                    Candidate Evidence: {skill.evidence}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing Requirements & Actionable Gap Closure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Requirements */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Missing Explicit Requirements</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-1">
                Critical Required Skills:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.missing_required_skills.length > 0 ? (
                  matchResult.missing_required_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-medium text-emerald-600">
                    Candidate satisfies all mandatory requirements!
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Preferred / Nice-to-Have Skills:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.missing_preferred_skills.length > 0 ? (
                  matchResult.missing_preferred_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-medium text-slate-400">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ListChecks className="w-4 h-4 text-blue-600" />
            <span>Targeted Interview Readiness Roadmap</span>
          </h3>

          <div className="space-y-2.5">
            {matchResult.action_plan.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
