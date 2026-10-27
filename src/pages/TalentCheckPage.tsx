import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  BookOpen,
  User,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import {
  COMPANY_BENCHMARKS,
  evaluateTalentReadiness,
  CompanyBenchmarkEntry,
} from "../lib/talentCheckEngine";
import { loadStoredProfile } from "../lib/radixAdapters";
import { RADIX_CATEGORY_METADATA } from "../types/radix";

export const TalentCheckPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const profile = useMemo(() => loadStoredProfile(), []);

  const selectedCompany = useMemo<CompanyBenchmarkEntry>(() => {
    return COMPANY_BENCHMARKS.find((c) => c.company_id === selectedCompanyId) || COMPANY_BENCHMARKS[0];
  }, [selectedCompanyId]);

  const assessment = useMemo(() => {
    return evaluateTalentReadiness(profile, selectedCompanyId);
  }, [profile, selectedCompanyId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Role 4 · Talent Check
            </span>
            <span className="text-xs text-slate-500 font-medium">12-Category Readiness Assessment</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Target Company Readiness Evaluation
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Evaluate candidate competencies (1–10 levels) across all 12 RADIX categories against target employer hiring bars, identifying critical skill gaps and study roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/profile-builder")}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => navigate("/skill-matching")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Skill Matcher (Role 5)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Company Selector & Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Company Selector */}
        <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <span>Select Target Recruiter / Employer</span>
            </label>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {COMPANY_BENCHMARKS.length} Curated Benchmarks
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {COMPANY_BENCHMARKS.map((comp) => {
              const isSelected = comp.company_id === selectedCompanyId;
              return (
                <button
                  key={comp.company_id}
                  onClick={() => setSelectedCompanyId(comp.company_id)}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 truncate block">{comp.company_name}</span>
                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <span className="font-semibold text-amber-800">{comp.tier}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Industry: <strong className="text-slate-700">{selectedCompany.industry}</strong>
            </span>
            <span className="truncate max-w-md">{selectedCompany.description}</span>
          </div>
        </div>

        {/* Candidate Profile Capsule */}
        <div className="md:col-span-4 bg-slate-900 text-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Candidate Profile
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{profile.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{profile.email || "Candidate Active"}</p>
            <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
              {profile.summary || "Candidate ready for assessment."}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Skills Registered:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{profile.skills.length}</span>
          </div>
        </div>
      </div>

      {/* Readiness Score Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Circular / Big Metric */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Readiness Score</span>
            <div className="text-5xl font-black text-slate-900 my-2 tracking-tight">
              {assessment.overall_readiness_score}
              <span className="text-2xl text-slate-400 font-semibold">%</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                assessment.verdict === "High Match"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : assessment.verdict === "Moderate Match"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }`}
            >
              {assessment.verdict}
            </span>
          </div>

          {/* Strengths & Critical Gaps */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Candidate Strengths ({assessment.strengths.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {assessment.strengths.length > 0 ? (
                  assessment.strengths.map((str, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {str}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Baseline in all evaluated areas</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Priority Skill Gaps Requiring Preparation ({assessment.critical_gaps.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {assessment.critical_gaps.length > 0 ? (
                  assessment.critical_gaps.map((gap, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                    >
                      {gap}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-medium text-emerald-600">
                    No critical hiring bar gaps detected for {selectedCompany.company_name}!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 12-Category Radar / Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>12 RADIX Categories: Candidate Level vs. Company Bar</span>
            </h3>
            <p className="text-[11px] text-slate-500">Scale 1 (Novice) to 10 (Mastery) based on Bloom's Taxonomy</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">Deterministic Evaluation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold text-center">Candidate Level</th>
                <th className="py-2.5 px-3 font-bold text-center">Company Bar</th>
                <th className="py-2.5 px-3 font-bold">Visual Comparison</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
                <th className="py-2.5 px-3 font-bold">Targeted Study Roadmap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessment.category_scores.map((cat) => {
                const meta = RADIX_CATEGORY_METADATA[cat.category_code] || RADIX_CATEGORY_METADATA.OTHER;
                return (
                  <tr key={cat.category_code} className="hover:bg-slate-50/70 transition-colors">
                    {/* Category */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeColor}`}>
                          {cat.category_code}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{cat.category_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {cat.candidate_skills.length} skills logged
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Candidate Level */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                        {cat.candidate_level} / 10
                      </span>
                    </td>

                    {/* Company Bar */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                        Level {cat.company_required_level}
                      </span>
                    </td>

                    {/* Visual Comparison Progress Bar */}
                    <td className="py-3 px-3 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 rounded-full h-2 relative overflow-hidden">
                          {/* Company bar indicator */}
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(cat.candidate_level / 10) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>0</span>
                          <span>Bar: {cat.company_required_level}</span>
                          <span>10</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          cat.status === "Ready"
                            ? "bg-emerald-100 text-emerald-800"
                            : cat.status === "Marginal"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {cat.status} {cat.gap > 0 ? `(+${cat.gap})` : `(${cat.gap})`}
                      </span>
                    </td>

                    {/* Recommended Topics */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="space-y-1">
                        {cat.recommended_topics.map((top, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[11px] text-slate-600">
                            <BookOpen className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                            <span className="truncate">{top}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
