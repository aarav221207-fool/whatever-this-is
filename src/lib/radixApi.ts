// src/lib/radixApi.ts
import {
  CandidateProfile,
  JobDescriptionResponse,
  TalentCheckResult,
  SkillMatchResult,
} from "../types/radix";
import { parseResumeText, parseJDText } from "./parserService";
import { evaluateTalentReadiness } from "./talentCheckEngine";
import { matchCandidateToJD } from "./skillMatchingEngine";

export interface DocumentExtractResponse {
  success: boolean;
  text: string;
  file_name: string;
  char_count: number;
  word_count: number;
  file_type: "pdf" | "docx" | "txt" | "csv" | "xlsx" | "json";
  mime_type?: string;
  structured_data?: any;
  metadata?: any;
}

/**
 * Uploads a document (PDF, DOCX, or TXT) to the server for binary text extraction
 */
export async function extractDocument(file: File): Promise<DocumentExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/documents/extract", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Document extraction failed with HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as DocumentExtractResponse;
}

/**
 * Analyzes job description text or document
 */
export async function analyzeJobDescription(text: string, fileName?: string): Promise<JobDescriptionResponse> {
  if (!text || text.trim().length === 0) {
    throw new Error("Job description text cannot be empty.");
  }

  try {
    const res = await fetch("/api/v1/jd-analytics/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, file_name: fileName }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `JD Analytics error (HTTP ${res.status})`);
    }
    return data;
  } catch (err: any) {
    // If backend is unavailable (network error), fallback to client-side deterministic parser
    if (err.message && err.message.includes("JD Analytics error")) {
      throw err;
    }
    return parseJDText(text, fileName);
  }
}

/**
 * Analyzes a Job Description file directly via multipart upload
 */
export async function analyzeJobDescriptionFile(file: File): Promise<JobDescriptionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/jd-analytics/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to analyze Job Description file (HTTP ${res.status})`);
  }
  return data;
}

/**
 * Parses resume text into structured CandidateProfile
 */
export async function parseResume(text: string, fileName?: string): Promise<CandidateProfile> {
  if (!text || text.trim().length === 0) {
    throw new Error("Resume text cannot be empty.");
  }

  try {
    const res = await fetch("/api/v1/resume-parser/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, file_name: fileName }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Resume Parser error (HTTP ${res.status})`);
    }
    return data;
  } catch (err: any) {
    // If backend is unavailable (network error), fallback to client-side deterministic parser
    if (err.message && err.message.includes("Resume Parser error")) {
      throw err;
    }
    return parseResumeText(text, fileName);
  }
}

/**
 * Parses a resume file directly via multipart upload
 */
export async function parseResumeFile(file: File): Promise<CandidateProfile> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/resume-parser/parse", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to parse resume file (HTTP ${res.status})`);
  }
  return data;
}

export async function evaluateTalent(profile: CandidateProfile, companyId: number): Promise<TalentCheckResult> {
  try {
    const res = await fetch("/api/v1/talent-check/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, company_id: companyId }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Talent Check error (HTTP ${res.status})`);
    }
    return data;
  } catch (err: any) {
    if (err.message && err.message.includes("Talent Check error")) {
      throw err;
    }
    return evaluateTalentReadiness(profile, companyId);
  }
}

export async function matchSkills(
  candidate: CandidateProfile,
  jd: JobDescriptionResponse,
  useAi: boolean = false
): Promise<SkillMatchResult> {
  try {
    const res = await fetch("/api/v1/skill-matching/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate, jd, use_ai: useAi }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Skill Matching error (HTTP ${res.status})`);
    }
    return data;
  } catch (err: any) {
    if (err.message && err.message.includes("Skill Matching error")) {
      throw err;
    }
    return matchCandidateToJD(candidate, jd);
  }
}
