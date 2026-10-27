// src/lib/radixAdapters.ts
import { CandidateProfile, JobDescriptionResponse, SkillItem, RadixCategoryCode } from "../types/radix";
import { normalizeSkill } from "./radixCatalog";

export const RADIX_STORAGE_KEY = "radix_profile";

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  source_type: "candidate",
  source_file: "alex_mercer_resume.pdf",
  name: "Alex Mercer",
  email: "alex.mercer@email.com",
  phone: "+1 (555) 234-5678",
  summary: "Senior Full Stack & Cloud Systems Engineer with 5+ years of experience building resilient microservices and distributed data platforms.",
  skills: [
    {
      skill_name: "Python",
      category_code: "COD",
      confidence: "high",
      evidence: "5+ years developing backend services with FastAPI and Flask",
      level: 8,
    },
    {
      skill_name: "TypeScript",
      category_code: "COD",
      confidence: "high",
      evidence: "Architected enterprise React and Node.js frontends and BFFs",
      level: 8,
    },
    {
      skill_name: "Data Structures & Algorithms",
      category_code: "DSA",
      confidence: "high",
      evidence: "Ranked top 5% on LeetCode; solved 400+ algorithmic problems",
      level: 8,
    },
    {
      skill_name: "PostgreSQL",
      category_code: "SQL",
      confidence: "high",
      evidence: "Optimized complex queries reducing p99 latency by 45%",
      level: 8,
    },
    {
      skill_name: "Amazon Web Services",
      category_code: "CLOUD",
      confidence: "high",
      evidence: "Deployed production multi-region infrastructure on AWS (EC2, ECS, S3)",
      level: 7,
    },
    {
      skill_name: "Docker",
      category_code: "CLOUD",
      confidence: "high",
      evidence: "Containerized 15+ microservices with multi-stage Docker builds",
      level: 8,
    },
    {
      skill_name: "System Design",
      category_code: "SYSD",
      confidence: "medium",
      evidence: "Designed decoupled pub/sub messaging architecture for payment ledger",
      level: 6,
    },
    {
      skill_name: "Object-Oriented Design",
      category_code: "OOD",
      confidence: "high",
      evidence: "Applied SOLID principles and factory/strategy patterns in core domain layer",
      level: 7,
    },
    {
      skill_name: "React",
      category_code: "SWE",
      confidence: "high",
      evidence: "Built accessible responsive dashboard with TanStack Query and Tailwind CSS",
      level: 8,
    },
    {
      skill_name: "Linux",
      category_code: "OS",
      confidence: "medium",
      evidence: "Managed Ubuntu server daemons, bash automation scripts, and process telemetry",
      level: 6,
    },
    {
      skill_name: "Problem Solving",
      category_code: "APTI",
      confidence: "high",
      evidence: "Consistent high performance in technical screening and analytical problem assessments",
      level: 8,
    },
    {
      skill_name: "Communication Skills",
      category_code: "COMM",
      confidence: "high",
      evidence: "Led sprint demos, authored RFCs, and mentored 3 junior software engineers",
      level: 8,
    },
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "CloudScale Systems",
      duration: "Jan 2022 - Present",
      description: "Spearheaded core billing modernization using Python FastAPI, PostgreSQL, and AWS ECS. Reduced API response time by 40% and improved uptime to 99.98%.",
    },
    {
      title: "Software Engineer",
      company: "Apex Digital Solutions",
      duration: "Jun 2020 - Dec 2021",
      description: "Developed frontend components in React/TypeScript and created automated CI/CD deployment pipelines with GitHub Actions.",
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science & Engineering",
      institution: "JSS Academy of Technical Education",
      year: "2020",
      gpa: "8.8 / 10",
    },
  ],
  certifications: ["AWS Certified Solutions Architect", "CKA: Certified Kubernetes Administrator"],
};

export function loadStoredProfile(): CandidateProfile {
  if (typeof window === "undefined") return DEFAULT_CANDIDATE_PROFILE;
  try {
    const raw = localStorage.getItem(RADIX_STORAGE_KEY);
    if (!raw) return DEFAULT_CANDIDATE_PROFILE;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.skills)) {
      return parsed;
    }
    return DEFAULT_CANDIDATE_PROFILE;
  } catch {
    return DEFAULT_CANDIDATE_PROFILE;
  }
}

export function saveStoredProfile(profile: CandidateProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RADIX_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save profile to localStorage:", err);
  }
}

/**
 * Adapts raw Role 2 response payload into the canonical CandidateProfile format
 */
export function adaptResumeResponse(raw: any, sourceFile?: string): CandidateProfile {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_CANDIDATE_PROFILE;
  }

  const rawSkills: any[] = Array.isArray(raw.skills) ? raw.skills : [];
  const normalizedSkills: SkillItem[] = rawSkills.map((s) => {
    const rawName = typeof s === "string" ? s : s.skill_name || s.name || "General";
    const { canonicalName, category } = normalizeSkill(rawName);
    const categoryCode = (s.category_code || category || "OTHER") as RadixCategoryCode;
    const confidence = ["high", "medium", "low"].includes(s.confidence) ? s.confidence : "medium";

    return {
      skill_name: canonicalName,
      category_code: categoryCode,
      confidence,
      evidence: s.evidence || s.context || "Extracted from candidate resume",
      level: s.level || (confidence === "high" ? 8 : confidence === "medium" ? 6 : 4),
    };
  });

  const rawExp: any[] = Array.isArray(raw.experience) ? raw.experience : [];
  const experience = rawExp.map((e) => ({
    title: e.title || e.role || "Software Engineer",
    company: e.company || e.organization || "Company",
    duration: e.duration || e.dates || "Present",
    description: e.description || e.summary || "",
  }));

  return {
    source_type: "candidate",
    source_file: sourceFile || raw.source_file || "uploaded_resume.pdf",
    name: raw.name || raw.candidate_name || "Candidate Name",
    email: raw.email || "",
    phone: raw.phone || "",
    summary: raw.summary || raw.professional_summary || "",
    skills: normalizedSkills.length > 0 ? normalizedSkills : DEFAULT_CANDIDATE_PROFILE.skills,
    experience: experience.length > 0 ? experience : DEFAULT_CANDIDATE_PROFILE.experience,
    education: Array.isArray(raw.education) ? raw.education : undefined,
    certifications: Array.isArray(raw.certifications) ? raw.certifications : undefined,
  };
}

/**
 * Adapts raw Role 1 response payload into the canonical JobDescriptionResponse format
 */
export function adaptJDResponse(raw: any, sourceFile?: string): JobDescriptionResponse {
  if (!raw || typeof raw !== "object") {
    return {
      source_type: "jd",
      source_file: sourceFile || "job_description.pdf",
      company: "Enterprise Partner",
      role: "Software Development Engineer",
      skills: [],
    };
  }

  const rawSkills: any[] = Array.isArray(raw.skills) ? raw.skills : [];
  const skills: SkillItem[] = rawSkills.map((s) => {
    const rawName = typeof s === "string" ? s : s.skill_name || s.name || "";
    const { canonicalName, category } = normalizeSkill(rawName);
    const categoryCode = (s.category_code || category || "OTHER") as RadixCategoryCode;
    const confidence = ["high", "medium", "low"].includes(s.confidence) ? s.confidence : "high";

    return {
      skill_name: canonicalName,
      category_code: categoryCode,
      confidence,
      evidence: s.evidence || s.context || "Required for position",
    };
  });

  return {
    source_type: "jd",
    source_file: sourceFile || raw.source_file || "job_description.pdf",
    company: raw.company || "Target Company",
    role: raw.role || raw.job_title || "Software Engineer",
    skills,
    required_skills: Array.isArray(raw.required_skills) ? raw.required_skills : skills.map((s) => s.skill_name),
    preferred_skills: Array.isArray(raw.preferred_skills) ? raw.preferred_skills : [],
    experience_years_required: typeof raw.experience_years_required === "number" ? raw.experience_years_required : 2,
    description_summary: raw.description_summary || raw.summary || "",
  };
}
