// src/lib/talentCheckEngine.ts
import {
  CandidateProfile,
  TalentCheckResult,
  CategoryScoreItem,
  RadixCategoryCode,
  RADIX_CATEGORIES,
  RADIX_CATEGORY_METADATA,
} from "../types/radix";
import { SKILL_TOPICS_MAP } from "../data/skillTopics";
import companyBenchmarksData from "../data/talent_check_company_skillsets.json";

export interface CompanyBenchmarkEntry {
  company_id: number;
  company_name: string;
  tier: string;
  industry: string;
  description: string;
  category_benchmarks: Record<
    RadixCategoryCode,
    { level: number; criticality: "Critical" | "Important" | "Baseline"; minimum_skills?: number }
  >;
}

// Map RADIX categories to SKILL_TOPICS_MAP IDs in src/data/skillTopics.ts
const CATEGORY_TO_TOPIC_ID: Partial<Record<RadixCategoryCode, number>> = {
  DSA: 1, // Data Structures & Algorithms
  OOD: 2, // Object-Oriented Programming
  SQL: 3, // SQL & Databases
  CLOUD: 4, // Cloud Fundamentals
  OS: 5, // Operating Systems
  NETW: 6, // Computer Networks
  APTI: 7, // Aptitude & Logical Reasoning
  COMM: 8, // Communication & Behavioral
  SWE: 9, // Web Development & SWE
  SYSD: 10, // System Design
  COD: 11, // Git / Core Coding
  AI: 12, // Generative AI / ML Basics
};

export const COMPANY_BENCHMARKS: CompanyBenchmarkEntry[] = companyBenchmarksData as CompanyBenchmarkEntry[];

export function getCompanyBenchmarkById(id: number): CompanyBenchmarkEntry {
  const found = COMPANY_BENCHMARKS.find((c) => c.company_id === id);
  if (found) return found;
  return COMPANY_BENCHMARKS[0];
}

/**
 * Calculates candidate proficiency level (1 to 10) for a specific category
 */
export function calculateCandidateCategoryLevel(
  profile: CandidateProfile,
  category: RadixCategoryCode
): { level: number; matchingSkills: string[] } {
  const categorySkills = profile.skills.filter((s) => s.category_code === category);
  const matchingSkills = categorySkills.map((s) => s.skill_name);

  if (categorySkills.length === 0) {
    return { level: 1, matchingSkills: [] };
  }

  // If skills have explicit level annotations, consider their maximum
  const explicitLevels = categorySkills.filter((s) => s.level && s.level > 0).map((s) => s.level as number);
  const maxExplicit = explicitLevels.length > 0 ? Math.max(...explicitLevels) : 0;

  // Calculate algorithmic depth
  let points = 1.0;
  categorySkills.forEach((skill) => {
    let skillWeight = 1.8;
    if (skill.confidence === "high") skillWeight = 2.4;
    else if (skill.confidence === "low") skillWeight = 1.0;

    if (skill.evidence && skill.evidence.length > 25) {
      skillWeight += 0.6;
    }
    points += skillWeight;
  });

  // Scale points to 1 - 10
  const calculated = Math.min(10, Math.max(1, Math.round(points)));
  const finalLevel = Math.max(calculated, maxExplicit);

  return { level: Math.min(10, finalLevel), matchingSkills };
}

/**
 * Evaluates candidate readiness against target company benchmark
 */
export function evaluateTalentReadiness(
  profile: CandidateProfile,
  companyId: number
): TalentCheckResult {
  const benchmark = getCompanyBenchmarkById(companyId);
  const categoryScores: CategoryScoreItem[] = [];
  const strengths: string[] = [];
  const criticalGaps: string[] = [];

  let weightedSum = 0;
  let totalWeights = 0;

  RADIX_CATEGORIES.forEach((code) => {
    const meta = RADIX_CATEGORY_METADATA[code];
    const categoryBenchmark = benchmark.category_benchmarks[code] || {
      level: meta.defaultBenchmarkLevel,
      criticality: "Important",
    };

    const companyRequiredLevel = categoryBenchmark.level;
    const { level: candidateLevel, matchingSkills } = calculateCandidateCategoryLevel(profile, code);
    const gap = candidateLevel - companyRequiredLevel;

    let status: "Ready" | "Marginal" | "Gap";
    if (gap >= 0) {
      status = "Ready";
      strengths.push(meta.name);
    } else if (gap >= -2) {
      status = "Marginal";
      if (categoryBenchmark.criticality === "Critical") {
        criticalGaps.push(`${meta.name} (Gap: ${gap} level)`);
      }
    } else {
      status = "Gap";
      if (categoryBenchmark.criticality === "Critical" || categoryBenchmark.criticality === "Important") {
        criticalGaps.push(`${meta.name} (Critical Gap: ${gap} levels)`);
      }
    }

    // Recommended topics from SKILL_TOPICS_MAP
    const topicId = CATEGORY_TO_TOPIC_ID[code];
    const topicsList = topicId ? SKILL_TOPICS_MAP[topicId] || [] : [];
    // Recommend topics around the company's expected level
    const targetTopics = topicsList
      .filter((t) => t.level_number >= Math.max(1, candidateLevel) && t.level_number <= companyRequiredLevel + 1)
      .slice(0, 3)
      .map((t) => `Level ${t.level_number}: ${t.topic}`);

    categoryScores.push({
      category_code: code,
      category_name: meta.name,
      candidate_level: candidateLevel,
      company_required_level: companyRequiredLevel,
      gap,
      status,
      candidate_skills: matchingSkills,
      recommended_topics: targetTopics.length > 0 ? targetTopics : [`Review advanced ${meta.name} fundamentals`],
    });

    // Weighted scoring
    const weight =
      categoryBenchmark.criticality === "Critical" ? 3 : categoryBenchmark.criticality === "Important" ? 2 : 1;
    const ratio = Math.min(1.0, candidateLevel / Math.max(1, companyRequiredLevel));
    weightedSum += ratio * 100 * weight;
    totalWeights += weight;
  });

  const overallReadinessScore = Math.min(100, Math.max(0, Math.round(weightedSum / Math.max(1, totalWeights))));

  let verdict: "High Match" | "Moderate Match" | "Needs Preparation";
  if (overallReadinessScore >= 80 && criticalGaps.length === 0) {
    verdict = "High Match";
  } else if (overallReadinessScore >= 65) {
    verdict = "Moderate Match";
  } else {
    verdict = "Needs Preparation";
  }

  return {
    company_id: benchmark.company_id,
    company_name: benchmark.company_name,
    overall_readiness_score: overallReadinessScore,
    verdict,
    category_scores: categoryScores,
    critical_gaps: criticalGaps,
    strengths,
    total_candidate_skills: profile.skills.length,
    analyzed_at: new Date().toISOString(),
  };
}
