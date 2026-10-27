// src/types/radix.ts

export type RadixCategoryCode =
  | "COD"
  | "DSA"
  | "OOD"
  | "APTI"
  | "COMM"
  | "AI"
  | "CLOUD"
  | "SQL"
  | "SWE"
  | "SYSD"
  | "NETW"
  | "OS"
  | "OTHER";

export interface SkillItem {
  skill_name: string;
  category_code: RadixCategoryCode;
  confidence: "high" | "medium" | "low";
  evidence?: string;
  level?: number; // 1-10 level if assessed
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface CandidateProfile {
  source_type: "candidate";
  source_file?: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: SkillItem[];
  experience: ExperienceItem[];
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
    gpa?: string;
  }>;
  certifications?: string[];
}

export interface JobDescriptionResponse {
  source_type: "jd";
  source_file?: string;
  company?: string | null;
  role?: string | null;
  skills: SkillItem[];
  required_skills?: string[];
  preferred_skills?: string[];
  experience_years_required?: number;
  description_summary?: string;
}

export interface CategoryScoreItem {
  category_code: RadixCategoryCode;
  category_name: string;
  candidate_level: number; // 1 to 10
  company_required_level: number; // 1 to 10
  gap: number; // candidate_level - company_required_level
  status: "Ready" | "Marginal" | "Gap";
  candidate_skills: string[];
  recommended_topics: string[];
}

export interface TalentCheckResult {
  company_id: number;
  company_name: string;
  overall_readiness_score: number; // 0 - 100
  verdict: "High Match" | "Moderate Match" | "Needs Preparation";
  category_scores: CategoryScoreItem[];
  critical_gaps: string[];
  strengths: string[];
  total_candidate_skills: number;
  analyzed_at: string;
}

export interface MatchedSkillDetail {
  skill_name: string;
  category_code: RadixCategoryCode;
  evidence?: string;
  source: "exact" | "normalized" | "fuzzy";
  candidate_confidence: "high" | "medium" | "low";
}

export interface CategoryBreakdown {
  category_code: RadixCategoryCode;
  category_name: string;
  required_count: number;
  matched_count: number;
  coverage_percentage: number;
}

export interface SkillMatchResult {
  overall_match_score: number; // 0 - 100
  verdict: "Strong Candidate" | "Moderate Fit" | "Developing Fit";
  matched_skills: MatchedSkillDetail[];
  missing_required_skills: string[];
  missing_preferred_skills: string[];
  category_breakdown: CategoryBreakdown[];
  action_plan: string[];
  ai_analysis?: string;
  analyzed_at: string;
}

export const RADIX_CATEGORY_METADATA: Record<
  RadixCategoryCode,
  { name: string; description: string; badgeColor: string; defaultBenchmarkLevel: number }
> = {
  COD: {
    name: "Coding & Languages",
    description: "Core programming languages (Python, Java, C++, TypeScript, Go)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    defaultBenchmarkLevel: 7,
  },
  DSA: {
    name: "Data Structures & Algorithms",
    description: "Arrays, Trees, Graphs, Dynamic Programming, Big-O Complexity",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    defaultBenchmarkLevel: 8,
  },
  OOD: {
    name: "Object-Oriented Design",
    description: "SOLID Principles, Design Patterns, OOP Architecture",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    defaultBenchmarkLevel: 7,
  },
  APTI: {
    name: "Aptitude & Logic",
    description: "Quantitative Aptitude, Logical Reasoning, Analytical Thinking",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    defaultBenchmarkLevel: 7,
  },
  COMM: {
    name: "Communication & Behavioral",
    description: "Verbal, Written, Stakeholder Management, Team Leadership",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    defaultBenchmarkLevel: 7,
  },
  AI: {
    name: "AI & Machine Learning",
    description: "Machine Learning, Deep Learning, LLMs, Prompt Engineering, PyTorch",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    defaultBenchmarkLevel: 5,
  },
  CLOUD: {
    name: "Cloud & DevOps",
    description: "AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    defaultBenchmarkLevel: 6,
  },
  SQL: {
    name: "SQL & Databases",
    description: "Relational DBs, Query Optimization, NoSQL, Schema Normalization",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    defaultBenchmarkLevel: 7,
  },
  SWE: {
    name: "Software Engineering & Web",
    description: "React, Node.js, REST APIs, Git, Testing, Web Fundamentals",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    defaultBenchmarkLevel: 7,
  },
  SYSD: {
    name: "System Design",
    description: "Scalability, Microservices, Caching, Load Balancing, Reliability",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    defaultBenchmarkLevel: 6,
  },
  NETW: {
    name: "Computer Networks",
    description: "TCP/IP, HTTP/HTTPS, WebSockets, OSI Model, Network Security",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    defaultBenchmarkLevel: 5,
  },
  OS: {
    name: "Operating Systems",
    description: "Linux, Processes & Threads, Memory Management, File Systems",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    defaultBenchmarkLevel: 6,
  },
  OTHER: {
    name: "Other Skills",
    description: "Domain-specific, specialized tooling and miscellaneous proficiencies",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    defaultBenchmarkLevel: 4,
  },
};

export const RADIX_CATEGORIES: RadixCategoryCode[] = [
  "COD",
  "DSA",
  "OOD",
  "APTI",
  "COMM",
  "AI",
  "CLOUD",
  "SQL",
  "SWE",
  "SYSD",
  "NETW",
  "OS",
  "OTHER",
];
