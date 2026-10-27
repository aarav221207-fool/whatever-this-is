// src/lib/radixApi.ts
import { CandidateProfile, JobDescriptionResponse, TalentCheckResult, SkillMatchResult } from "../types/radix";
import { parseResumeText, parseJDText } from "./parserService";
import { evaluateTalentReadiness } from "./talentCheckEngine";
import { matchCandidateToJD } from "./skillMatchingEngine";

export async function analyzeJobDescription(text: string, fileName?: string): Promise<JobDescriptionResponse> {
  try {
    const res = await fetch("/api/v1/jd-analytics/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, file_name: fileName }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client engine
  }
  return parseJDText(text, fileName);
}

export async function parseResume(text: string, fileName?: string): Promise<CandidateProfile> {
  try {
    const res = await fetch("/api/v1/resume-parser/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, file_name: fileName }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client engine
  }
  return parseResumeText(text, fileName);
}

export async function evaluateTalent(profile: CandidateProfile, companyId: number): Promise<TalentCheckResult> {
  try {
    const res = await fetch("/api/v1/talent-check/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, company_id: companyId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client engine
  }
  return evaluateTalentReadiness(profile, companyId);
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
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client engine
  }
  return matchCandidateToJD(candidate, jd);
}
