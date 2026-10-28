import type { CandidateProfile, JobDescriptionResponse, SkillItem, RadixCategoryCode } from "../types/radix";
import { normalizeSkill } from "./radixCatalog";

export const RADIX_STORAGE_KEY = "radix_profile";

// Empty state is intentional. A new visitor must never be given a fabricated candidate.
export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  source_type: "candidate",
  source_file: "",
  name: "",
  email: "",
  phone: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  certifications: [],
};

export function loadStoredProfile(): CandidateProfile {
  if (typeof window === "undefined") return { ...DEFAULT_CANDIDATE_PROFILE };
  try {
    const raw = localStorage.getItem(RADIX_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CANDIDATE_PROFILE };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.skills)) {
      return {
        ...DEFAULT_CANDIDATE_PROFILE,
        ...parsed,
        name: typeof parsed.name === "string" ? parsed.name : "",
        email: typeof parsed.email === "string" ? parsed.email : "",
        phone: typeof parsed.phone === "string" ? parsed.phone : "",
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        skills: parsed.skills,
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      };
    }
    return { ...DEFAULT_CANDIDATE_PROFILE };
  } catch {
    return { ...DEFAULT_CANDIDATE_PROFILE };
  }
}

export function saveStoredProfile(profile: CandidateProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RADIX_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save profile cache to localStorage:", err);
  }
}

export function adaptResumeResponse(raw: any, sourceFile?: string): CandidateProfile {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CANDIDATE_PROFILE };

  const rawSkills: any[] = Array.isArray(raw.skills) ? raw.skills : [];
  const normalizedSkills: SkillItem[] = rawSkills.map((item) => {
    const skill = item && typeof item === "object" ? item : { skill_name: item };
    const rawName = typeof skill.skill_name === "string" ? skill.skill_name : typeof skill.name === "string" ? skill.name : "";
    const normalized = normalizeSkill(rawName);
    const confidence = ["high", "medium", "low"].includes(skill.confidence) ? skill.confidence : "medium";
    return {
      skill_name: normalized.canonicalName,
      category_code: (skill.category_code || normalized.category || "OTHER") as RadixCategoryCode,
      confidence,
      evidence: typeof skill.evidence === "string" ? skill.evidence : typeof skill.context === "string" ? skill.context : "",
      level: Number.isFinite(Number(skill.level)) ? Number(skill.level) : undefined,
    };
  }).filter((skill) => Boolean(skill.skill_name.trim()));

  const experience = (Array.isArray(raw.experience) ? raw.experience : []).map((item: any) => ({
    title: item.title || item.role || "",
    company: item.company || item.organization || "",
    duration: item.duration || item.dates || "",
    description: item.description || item.summary || "",
  })).filter((item: any) => item.title || item.company || item.duration || item.description);

  return {
    source_type: "candidate",
    source_file: sourceFile || raw.source_file || "",
    name: raw.name || raw.candidate_name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    summary: raw.summary || raw.professional_summary || "",
    skills: normalizedSkills,
    experience,
    education: Array.isArray(raw.education) ? raw.education : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
  };
}

export function adaptJDResponse(raw: any, sourceFile?: string): JobDescriptionResponse {
  if (!raw || typeof raw !== "object") {
    return { source_type: "jd", source_file: sourceFile, skills: [], required_skills: [], preferred_skills: [] };
  }

  const rawSkills: any[] = Array.isArray(raw.skills) ? raw.skills : [];
  const skills: SkillItem[] = rawSkills.map((item) => {
    const skill = item && typeof item === "object" ? item : { skill_name: item };
    const rawName = typeof skill.skill_name === "string" ? skill.skill_name : typeof skill.name === "string" ? skill.name : "";
    const normalized = normalizeSkill(rawName);
    return {
      skill_name: normalized.canonicalName,
      category_code: (skill.category_code || normalized.category || "OTHER") as RadixCategoryCode,
      confidence: ["high", "medium", "low"].includes(skill.confidence) ? skill.confidence : "medium",
      evidence: typeof skill.evidence === "string" ? skill.evidence : typeof skill.context === "string" ? skill.context : "",
    };
  }).filter((skill) => Boolean(skill.skill_name.trim()));

  return {
    source_type: "jd",
    source_file: sourceFile || raw.source_file || undefined,
    company: typeof raw.company === "string" && raw.company.trim() ? raw.company.trim() : undefined,
    role: typeof (raw.role || raw.job_title) === "string" && String(raw.role || raw.job_title).trim() ? String(raw.role || raw.job_title).trim() : undefined,
    skills,
    required_skills: Array.isArray(raw.required_skills) ? raw.required_skills : skills.map((skill) => skill.skill_name),
    preferred_skills: Array.isArray(raw.preferred_skills) ? raw.preferred_skills : [],
    experience_years_required: typeof raw.experience_years_required === "number" ? raw.experience_years_required : undefined,
    description_summary: raw.description_summary || raw.summary || "",
  };
}
