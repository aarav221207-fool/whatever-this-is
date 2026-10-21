import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  normalizeCompanySummary,
  normalizeCompanyProfile,
  normalizeDashboardSkills,
  type CompanySummary,
  type CompanyProfile,
  type DashboardSkill,
} from "./companyData";
import { SEED_COMPANIES } from "../data/seedCompanies";
import { SKILL_TOPICS_MAP, type SkillTopic } from "../data/skillTopics";

// ==========================================
// 1. Hook: useCompanies
// Queries SELECT company_id, short_json FROM company_json
// ==========================================
export function useCompanies() {
  return useQuery<CompanySummary[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        console.warn(
          "[companyApi] Supabase credentials not set in .env. Using fallback seed companies data."
        );
        return SEED_COMPANIES.map((c) =>
          normalizeCompanySummary(c.short_json, c.company_id)
        );
      }

      // Read ONLY from public.company_json
      const { data, error } = await supabase
        .from("company_json")
        .select("company_id, short_json");

      if (error) {
        console.error("[companyApi] Error fetching companies from company_json:", error);
        // Fallback to seed data on error so UI remains resilient
        return SEED_COMPANIES.map((c) =>
          normalizeCompanySummary(c.short_json, c.company_id)
        );
      }

      if (!data || data.length === 0) {
        return SEED_COMPANIES.map((c) =>
          normalizeCompanySummary(c.short_json, c.company_id)
        );
      }

      return data.map((row: any) =>
        normalizeCompanySummary(row.short_json, row.company_id)
      );
    },
  });
}

// ==========================================
// 2. Hook: useCompanyProfile
// Queries SELECT company_id, short_json, full_json FROM company_json WHERE company_id = id
// ==========================================
export function useCompanyProfile(id: number | null | undefined) {
  return useQuery<CompanyProfile | null>({
    queryKey: ["companyProfile", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (!id) return null;

      if (!isSupabaseConfigured) {
        console.warn(
          "[companyApi] Supabase credentials not set in .env. Using fallback seed company profile."
        );
        const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
        return normalizeCompanyProfile(match.full_json, match.short_json, match.company_id);
      }

      // Read ONLY from public.company_json
      const { data, error } = await supabase
        .from("company_json")
        .select("company_id, short_json, full_json")
        .eq("company_id", id)
        .maybeSingle();

      if (error) {
        console.error(
          `[companyApi] Error fetching profile for company_id ${id} from company_json:`,
          error
        );
        const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
        return normalizeCompanyProfile(match.full_json, match.short_json, match.company_id);
      }

      if (!data) {
        const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
        return normalizeCompanyProfile(match.full_json, match.short_json, match.company_id);
      }

      return normalizeCompanyProfile(data.full_json, data.short_json, data.company_id);
    },
  });
}

// ==========================================
// 3. Hook: useCompanySkills
// Queries 4 tables only:
// - company_skill_levels (company_id, skill_set_id, required_level, required_proficiency_level_id)
// - skill_set_master (skill_set_id, skill_set_name, short_name)
// - proficiency_levels (proficiency_level_id, proficiency_name, proficiency_code)
// - skill_set_topics (skill_set_id, level_number, topics)
// ==========================================
export interface CompanySkillsData {
  skills: DashboardSkill[];
  topicsMap: Record<number, SkillTopic[]>;
}

export function useCompanySkills(id: number | null | undefined) {
  return useQuery<CompanySkillsData>({
    queryKey: ["companySkills", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (!id) {
        return {
          skills: normalizeDashboardSkills(SEED_COMPANIES[0].skill_levels),
          topicsMap: SKILL_TOPICS_MAP,
        };
      }

      if (!isSupabaseConfigured) {
        console.warn(
          "[companyApi] Supabase credentials not set in .env. Using fallback seed skills data."
        );
        const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
        return {
          skills: normalizeDashboardSkills(match.skill_levels),
          topicsMap: SKILL_TOPICS_MAP,
        };
      }

      try {
        // Table 1: company_skill_levels
        const { data: skillLevelsData, error: skillLevelsError } = await supabase
          .from("company_skill_levels")
          .select("company_id, skill_set_id, required_level, required_proficiency_level_id")
          .eq("company_id", id);

        if (skillLevelsError || !skillLevelsData || skillLevelsData.length === 0) {
          console.warn(
            `[companyApi] company_skill_levels query returned empty or error for company_id ${id}. Falling back to seed skills.`,
            skillLevelsError
          );
          const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
          return {
            skills: normalizeDashboardSkills(match.skill_levels),
            topicsMap: SKILL_TOPICS_MAP,
          };
        }

        const skillSetIds = skillLevelsData.map((s: any) => s.skill_set_id);

        // Table 2: skill_set_master
        const { data: mastersData } = await supabase
          .from("skill_set_master")
          .select("skill_set_id, skill_set_name, short_name")
          .in("skill_set_id", skillSetIds);

        const masterMap = new Map<number, { skill_set_name: string; short_name: string }>();
        (mastersData || []).forEach((m: any) => {
          masterMap.set(m.skill_set_id, m);
        });

        // Table 3: proficiency_levels
        const { data: proficienciesData } = await supabase
          .from("proficiency_levels")
          .select("proficiency_level_id, proficiency_name, proficiency_code");

        const profMap = new Map<number, string>();
        (proficienciesData || []).forEach((p: any) => {
          profMap.set(p.proficiency_level_id, p.proficiency_name);
        });

        // Table 4: skill_set_topics
        const { data: topicsData } = await supabase
          .from("skill_set_topics")
          .select("skill_set_id, level_number, topics")
          .in("skill_set_id", skillSetIds)
          .order("level_number", { ascending: true });

        // Assemble topicsMap
        const assembledTopicsMap: Record<number, SkillTopic[]> = {};
        skillSetIds.forEach((sid: number) => {
          assembledTopicsMap[sid] = [];
        });

        (topicsData || []).forEach((t: any) => {
          const sid = t.skill_set_id;
          if (!assembledTopicsMap[sid]) {
            assembledTopicsMap[sid] = [];
          }
          assembledTopicsMap[sid].push({
            level_number: Number(t.level_number) || 1,
            topic: String(t.topics || t.topic || `Level ${t.level_number} Milestone`),
          });
        });

        // For any skill set with missing topics from DB, fall back to seed topic definitions
        skillSetIds.forEach((sid: number) => {
          if (!assembledTopicsMap[sid] || assembledTopicsMap[sid].length === 0) {
            if (SKILL_TOPICS_MAP[sid]) {
              assembledTopicsMap[sid] = SKILL_TOPICS_MAP[sid];
            }
          }
        });

        // Assemble skill rows for normalizeDashboardSkills
        const assembledSkills = skillLevelsData.map((row: any) => {
          const master = masterMap.get(row.skill_set_id);
          const profName = profMap.get(row.required_proficiency_level_id) || "Proficient";

          return {
            skill_set_id: row.skill_set_id,
            skill_set_name: master ? master.skill_set_name : `Skill ${row.skill_set_id}`,
            required_level: row.required_level,
            required_proficiency: profName,
          };
        });

        const normalizedSkills = normalizeDashboardSkills(assembledSkills);

        return {
          skills: normalizedSkills,
          topicsMap: assembledTopicsMap,
        };
      } catch (err) {
        console.error("[companyApi] Error processing company skills query:", err);
        const match = SEED_COMPANIES.find((c) => c.company_id === id) || SEED_COMPANIES[0];
        return {
          skills: normalizeDashboardSkills(match.skill_levels),
          topicsMap: SKILL_TOPICS_MAP,
        };
      }
    },
  });
}
