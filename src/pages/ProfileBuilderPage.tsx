import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Plus,
  Trash2,
  Save,
  Download,
  Copy,
  ArrowRight,
  Target,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  CandidateProfile,
  RadixCategoryCode,
  RADIX_CATEGORIES,
  RADIX_CATEGORY_METADATA,
} from "../types/radix";
import {
  loadStoredProfile,
  saveStoredProfile,
  DEFAULT_CANDIDATE_PROFILE,
} from "../lib/radixAdapters";
import { loadStudentProfile, saveStudentResume } from "../lib/placementRepository";

export const ProfileBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfile>(() => loadStoredProfile());
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [isSavingDatabase, setIsSavingDatabase] = useState(false);

  // Keep a local cache for snappy edits, but prefer the signed-in student's real database profile.
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    let active = true;
    loadStudentProfile()
      .then((savedProfile) => {
        if (active && savedProfile) {
          setProfile(savedProfile);
          saveStoredProfile(savedProfile);
        }
      })
      .catch(() => {
        // Unsigned visitors may keep a local draft; database loading requires sign-in.
      });
    return () => { active = false; };
  }, []);

  const handleSaveDatabase = async () => {
    if (!profile.name.trim() && !profile.email.trim() && profile.skills.length === 0) {
      toast.error("Upload a resume or enter real profile details before saving.");
      return;
    }
    setIsSavingDatabase(true);
    try {
      await saveStudentResume(profile);
      saveStoredProfile(profile);
      toast.success("Profile and skills saved to Supabase. Job recommendations have been refreshed.");
    } catch (err: any) {
      toast.error(err?.message || "Could not save profile to Supabase.");
    } finally {
      setIsSavingDatabase(false);
    }
  };

  const updateField = (field: keyof CandidateProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateSkill = (index: number, field: string, value: any) => {
    const skills = [...profile.skills];
    skills[index] = { ...skills[index], [field]: value };
    setProfile((prev) => ({ ...prev, skills }));
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          skill_name: "",
          category_code: "OTHER" as RadixCategoryCode,
          confidence: "medium",
          evidence: "",
          level: 6,
        },
      ],
    }));
  };

  const removeSkill = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const experience = [...profile.experience];
    experience[index] = { ...experience[index], [field]: value };
    setProfile((prev) => ({ ...prev, experience }));
  };

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          duration: "",
          description: "",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleResetToDefault = () => {
    setProfile(DEFAULT_CANDIDATE_PROFILE);
    saveStoredProfile(DEFAULT_CANDIDATE_PROFILE);
    toast.info("Profile cleared. No demo candidate has been loaded.");
  };

  const handleDownloadJson = () => {
    try {
      const jsonBlob = new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(jsonBlob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = url;
      const safeName = (profile.name || "candidate").trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadAnchor.download = `${safeName}_RADIX_Profile.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);
      toast.success("Candidate Profile JSON successfully downloaded");
    } catch (err: any) {
      toast.error(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
              Role 3 · Profile Builder
            </span>
            <span className="text-xs text-slate-500 font-medium">Candidate Profile Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Candidate Profile Builder & Editor
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Review, curate, and refine your categorized competencies and background evidence conforming to the 12 RADIX standards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
          <button
            onClick={handleSaveDatabase}
            disabled={isSavingDatabase}
            className="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingDatabase ? "Saving..." : "Save to Database"}</span>
          </button>
          <button
            onClick={() => navigate("/auth?next=/profile-builder")}
            className="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign in</span>
          </button>
          <button
            onClick={() => setShowJsonModal(true)
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Export RADIX JSON</span>
          </button>
          <button
            onClick={() => navigate("/talent-check")}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Talent Check (Role 4)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="space-y-6">
        {/* Basic Candidate Contact & Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Personal & Contact Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Full Name"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email Address"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Phone Number"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Professional Summary</label>
              <textarea
                value={profile.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                rows={3}
                placeholder="Brief summary of professional experience, domain specializations, and career achievements"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Skills Section (12 RADIX Categorized) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>RADIX Categorized Skills ({profile.skills.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">Each skill is classified into one of the 12 RADIX standard categories with evidence and confidence.</p>
            </div>
            <button
              onClick={addSkill}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="space-y-3">
            {profile.skills.map((skill, idx) => {
              const meta = RADIX_CATEGORY_METADATA[skill.category_code] || RADIX_CATEGORY_METADATA.OTHER;
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                    {/* Skill Name */}
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={skill.skill_name}
                        onChange={(e) => updateSkill(idx, "skill_name", e.target.value)}
                        placeholder="Skill Name (e.g. Python)"
                        className="w-full p-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Category Selector */}
                    <div className="md:col-span-3">
                      <select
                        value={skill.category_code}
                        onChange={(e) => updateSkill(idx, "category_code", e.target.value as RadixCategoryCode)}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                      >
                        {RADIX_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} · {RADIX_CATEGORY_METADATA[cat].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Confidence */}
                    <div className="md:col-span-2">
                      <select
                        value={skill.confidence}
                        onChange={(e) => updateSkill(idx, "confidence", e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none capitalize font-medium text-slate-700"
                      >
                        <option value="high">High Confidence</option>
                        <option value="medium">Medium Confidence</option>
                        <option value="low">Low Confidence</option>
                      </select>
                    </div>

                    {/* Proficiency Level (1-10) */}
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Level:</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={skill.level || 7}
                          onChange={(e) => updateSkill(idx, "level", parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-600"
                        />
                        <span className="text-xs font-bold text-slate-800 w-5 text-right">{skill.level || 7}</span>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeSkill(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Evidence input */}
                  <div>
                    <input
                      type="text"
                      value={skill.evidence || ""}
                      onChange={(e) => updateSkill(idx, "evidence", e.target.value)}
                      placeholder="Verbatim evidence or project reference (e.g. Architected microservices with FastAPI)"
                      className="w-full p-2 text-xs bg-white text-slate-700 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none italic"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Work Experience</h2>
              <p className="text-[11px] text-slate-500">Professional milestones and achievements supporting extracted competencies.</p>
            </div>
            <button
              onClick={addExperience}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          <div className="space-y-3">
            {profile.experience.map((exp, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(idx, "title", e.target.value)}
                    placeholder="Job Title"
                    className="p-2 text-xs font-bold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(idx, "company", e.target.value)}
                    placeholder="Company Name"
                    className="p-2 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => updateExperience(idx, "duration", e.target.value)}
                    placeholder="Duration (e.g. 2021 - Present)"
                    className="p-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(idx, "description", e.target.value)}
                  rows={2}
                  placeholder="Responsibilities, key achievements, and technologies used"
                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => removeExperience(idx)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Role</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* JSON Export Modal */}
      {showJsonModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowJsonModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Authoritative RADIX Candidate Contract JSON</h3>
                <p className="text-[11px] text-slate-500">Fully structured, persistent profile specification</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
                    toast.success("Copied JSON to clipboard");
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 text-xs overflow-auto flex-1 font-mono leading-relaxed">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
