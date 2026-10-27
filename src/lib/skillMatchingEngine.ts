// src/lib/skillMatchingEngine.ts
import {
  CandidateProfile,
  JobDescriptionResponse,
  SkillMatchResult,
  MatchedSkillDetail,
  CategoryBreakdown,
  RadixCategoryCode,
  RADIX_CATEGORIES,
  RADIX_CATEGORY_METADATA,
} from "../types/radix";
import { normalizeSkill } from "./radixCatalog";

/**
 * Deterministically matches a Candidate Profile against an Analyzed Job Description
 */
export function matchCandidateToJD(
  candidate: CandidateProfile,
  jd: JobDescriptionResponse
): SkillMatchResult {
  const matchedSkills: MatchedSkillDetail[] = [];
  const missingRequiredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];

  // Index candidate skills by normalized name and category
  const candidateSkillMap = new Map<string, { evidence?: string; confidence: "high" | "medium" | "low"; category: RadixCategoryCode }>();

  candidate.skills.forEach((s) => {
    const { canonicalName, category } = normalizeSkill(s.skill_name);
    candidateSkillMap.set(canonicalName.toLowerCase(), {
      evidence: s.evidence,
      confidence: s.confidence,
      category: s.category_code || category,
    });
    // Also index raw name
    candidateSkillMap.set(s.skill_name.trim().toLowerCase(), {
      evidence: s.evidence,
      confidence: s.confidence,
      category: s.category_code || category,
    });
  });

  // Track matched candidate skill names to avoid redundant matching
  const matchedCandidateKeys = new Set<string>();

  // Extract list of required and preferred skills
  const requiredList = jd.required_skills && jd.required_skills.length > 0
    ? jd.required_skills
    : jd.skills.map((s) => s.skill_name);

  const preferredList = jd.preferred_skills || [];

  // Process required skills
  requiredList.forEach((req) => {
    const { canonicalName: reqCanonical, category: reqCat } = normalizeSkill(req);
    const reqClean = req.trim().toLowerCase();
    const reqCanonicalClean = reqCanonical.toLowerCase();

    if (candidateSkillMap.has(reqClean)) {
      const match = candidateSkillMap.get(reqClean)!;
      matchedCandidateKeys.add(reqClean);
      matchedSkills.push({
        skill_name: reqCanonical,
        category_code: match.category,
        evidence: match.evidence || "Verified in candidate background",
        source: "exact",
        candidate_confidence: match.confidence,
      });
    } else if (candidateSkillMap.has(reqCanonicalClean)) {
      const match = candidateSkillMap.get(reqCanonicalClean)!;
      matchedCandidateKeys.add(reqCanonicalClean);
      matchedSkills.push({
        skill_name: reqCanonical,
        category_code: match.category,
        evidence: match.evidence || "Verified in candidate background",
        source: "normalized",
        candidate_confidence: match.confidence,
      });
    } else {
      // Substring/token check
      let fuzzyFound = false;
      for (const [candidateKey, match] of candidateSkillMap.entries()) {
        if (
          candidateKey.length > 3 &&
          (candidateKey.includes(reqClean) || reqClean.includes(candidateKey))
        ) {
          matchedCandidateKeys.add(candidateKey);
          matchedSkills.push({
            skill_name: reqCanonical,
            category_code: match.category,
            evidence: match.evidence || `Related match to "${candidateKey}"`,
            source: "fuzzy",
            candidate_confidence: match.confidence,
          });
          fuzzyFound = true;
          break;
        }
      }
      if (!fuzzyFound) {
        missingRequiredSkills.push(reqCanonical);
      }
    }
  });

  // Process preferred skills
  preferredList.forEach((pref) => {
    const { canonicalName: prefCanonical, category: prefCat } = normalizeSkill(pref);
    const prefClean = pref.trim().toLowerCase();
    const prefCanonicalClean = prefCanonical.toLowerCase();

    if (candidateSkillMap.has(prefClean) || candidateSkillMap.has(prefCanonicalClean)) {
      const match = candidateSkillMap.get(prefClean) || candidateSkillMap.get(prefCanonicalClean)!;
      matchedSkills.push({
        skill_name: prefCanonical,
        category_code: match.category,
        evidence: match.evidence,
        source: "normalized",
        candidate_confidence: match.confidence,
      });
    } else {
      missingPreferredSkills.push(prefCanonical);
    }
  });

  // Category breakdown calculation
  const categoryBreakdown: CategoryBreakdown[] = [];

  RADIX_CATEGORIES.forEach((code) => {
    const meta = RADIX_CATEGORY_METADATA[code];
    const jdSkillsInCat = jd.skills.filter((s) => s.category_code === code || normalizeSkill(s.skill_name).category === code);
    const matchedInCat = matchedSkills.filter((s) => s.category_code === code);

    const reqCount = Math.max(jdSkillsInCat.length, matchedInCat.length > 0 ? matchedInCat.length : 0);
    const matchCount = matchedInCat.length;
    const coverage = reqCount === 0 ? 100 : Math.min(100, Math.round((matchCount / reqCount) * 100));

    // Only include categories that exist in the JD or have candidate matches
    if (reqCount > 0 || matchCount > 0) {
      categoryBreakdown.push({
        category_code: code,
        category_name: meta.name,
        required_count: reqCount,
        matched_count: matchCount,
        coverage_percentage: coverage,
      });
    }
  });

  // Score computation: 75% weight on required skills, 25% on preferred skills (or 100% on required if no preferred)
  const reqTotal = requiredList.length;
  const reqMatched = reqTotal - missingRequiredSkills.length;
  const reqRatio = reqTotal > 0 ? reqMatched / reqTotal : 1.0;

  let overallScore = 0;
  if (preferredList.length > 0) {
    const prefTotal = preferredList.length;
    const prefMatched = prefTotal - missingPreferredSkills.length;
    const prefRatio = prefMatched / prefTotal;
    overallScore = Math.round((reqRatio * 0.75 + prefRatio * 0.25) * 100);
  } else {
    overallScore = Math.round(reqRatio * 100);
  }

  // Ensure score is bounded between 0 and 100
  overallScore = Math.min(100, Math.max(0, overallScore));

  let verdict: "Strong Candidate" | "Moderate Fit" | "Developing Fit";
  if (overallScore >= 80 && missingRequiredSkills.length <= 1) {
    verdict = "Strong Candidate";
  } else if (overallScore >= 60) {
    verdict = "Moderate Fit";
  } else {
    verdict = "Developing Fit";
  }

  // Construct concrete actionable plan
  const actionPlan: string[] = [];
  if (missingRequiredSkills.length > 0) {
    actionPlan.push(
      `Bridge critical core requirements: Focus preparation on ${missingRequiredSkills.slice(0, 3).join(", ")} prior to technical interviews.`
    );
  }
  if (missingPreferredSkills.length > 0) {
    actionPlan.push(
      `Differentiate your profile: Add project demonstrations or proof-of-work in ${missingPreferredSkills.slice(0, 2).join(", ")}.`
    );
  }
  if (actionPlan.length === 0) {
    actionPlan.push("Candidate meets or exceeds all explicit technical requirements. Focus on system architecture and behavioral alignment.");
  }

  return {
    overall_match_score: overallScore,
    verdict,
    matched_skills: matchedSkills,
    missing_required_skills: missingRequiredSkills,
    missing_preferred_skills: missingPreferredSkills,
    category_breakdown: categoryBreakdown,
    action_plan: actionPlan,
    analyzed_at: new Date().toISOString(),
  };
}
