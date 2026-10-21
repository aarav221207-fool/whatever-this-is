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
import type { SkillTopic } from "../data/skillTopics";

// ==========================================
// 1. Hook: useCompanies
// Reads real database records from public.company_json
// Never produces silent fake fallback data in production.
// ==========================================
export function useCompanies() {
  return useQuery<CompanySummary[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Database connection is unconfigured: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing from your environment variables. In Netlify, add them under Site Configuration > Environment Variables and trigger a rebuild."
        );
      }

      // Query ONLY from public.company_json
      const { data, error, status } = await supabase
        .from("company_json")
        .select("company_id, short_json");

      if (error) {
        throw new Error(
          `Database query failed on 'company_json' (HTTP ${status || "err"}): ${error.message}. Hint: Ensure table permissions or Row Level Security (RLS) policies allow SELECT for role 'anon'.`
        );
      }

      if (!data || data.length === 0) {
        // Return genuine empty list - NO silent mock fallbacks
        return [];
      }

      return data.map((row: any) =>
        normalizeCompanySummary(row.short_json, row.company_id)
      );
    },
  });
}

// ==========================================
// 2. Hook: useCompanyProfile
// Queries SELECT company_id, short_json, full_json FROM company_json WHERE company_id = :id
// Never substitutes hardcoded fake profiles.
// ==========================================
export function useCompanyProfile(id: number | null | undefined) {
  return useQuery<CompanyProfile | null>({
    queryKey: ["companyProfile", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (!id) return null;

      if (!isSupabaseConfigured) {
        throw new Error(
          "Database connection is unconfigured: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing."
        );
      }

      // Read ONLY from public.company_json
      const { data, error, status } = await supabase
        .from("company_json")
        .select("company_id, short_json, full_json")
        .eq("company_id", id)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Failed to load profile for company ID ${id} (HTTP ${status || "err"}): ${error.message}`
        );
      }

      if (!data) {
        // Honest null - company does not exist in the database
        return null;
      }

      return normalizeCompanyProfile(data.full_json, data.short_json, data.company_id);
    },
  });
}

// ==========================================
// 3. Hook: useCompanySkills
// Queries ONLY the 4 skill tables:
// - company_skill_levels
// - skill_set_master
// - proficiency_levels
// - skill_set_topics
// Never substitutes hardcoded fake skill ladders.
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
        return { skills: [], topicsMap: {} };
      }

      if (!isSupabaseConfigured) {
        throw new Error(
          "Database connection is unconfigured: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing."
        );
      }

      // 1. Query company_skill_levels
      const { data: skillLevelsData, error: skillLevelsError, status } = await supabase
        .from("company_skill_levels")
        .select("company_id, skill_set_id, required_level, required_proficiency_level_id")
        .eq("company_id", id);

      if (skillLevelsError) {
        throw new Error(
          `Failed to query 'company_skill_levels' for company ID ${id} (HTTP ${status || "err"}): ${skillLevelsError.message}`
        );
      }

      if (!skillLevelsData || skillLevelsData.length === 0) {
        // Return genuine empty skill matrix
        return { skills: [], topicsMap: {} };
      }

      const skillSetIds = skillLevelsData.map((s: any) => s.skill_set_id);

      // 2. Query auxiliary tables in parallel
      const [mastersRes, profRes, topicsRes] = await Promise.all([
        supabase
          .from("skill_set_master")
          .select("skill_set_id, skill_set_name, short_name")
          .in("skill_set_id", skillSetIds),
        supabase
          .from("proficiency_levels")
          .select("proficiency_level_id, proficiency_name, proficiency_code"),
        supabase
          .from("skill_set_topics")
          .select("skill_set_id, level_number, topics")
          .in("skill_set_id", skillSetIds)
          .order("level_number", { ascending: true }),
      ]);

      if (mastersRes.error) {
        console.warn("[companyApi] Warning fetching skill_set_master:", mastersRes.error);
      }
      if (profRes.error) {
        console.warn("[companyApi] Warning fetching proficiency_levels:", profRes.error);
      }
      if (topicsRes.error) {
        console.warn("[companyApi] Warning fetching skill_set_topics:", topicsRes.error);
      }

      // Build master name map
      const masterMap = new Map<number, { skill_set_name: string; short_name: string }>();
      (mastersRes.data || []).forEach((m: any) => {
        masterMap.set(m.skill_set_id, m);
      });

      // Build proficiency name map
      const profMap = new Map<number, string>();
      (profRes.data || []).forEach((p: any) => {
        profMap.set(p.proficiency_level_id, p.proficiency_name);
      });

      // Build topicsMap strictly from database rows
      const assembledTopicsMap: Record<number, SkillTopic[]> = {};
      skillSetIds.forEach((sid: number) => {
        assembledTopicsMap[sid] = [];
      });

      (topicsRes.data || []).forEach((t: any) => {
        const sid = t.skill_set_id;
        if (!assembledTopicsMap[sid]) {
          assembledTopicsMap[sid] = [];
        }
        assembledTopicsMap[sid].push({
          level_number: Number(t.level_number) || 1,
          topic: String(t.topics || t.topic || `Level ${t.level_number}`),
        });
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
    },
  });
}
