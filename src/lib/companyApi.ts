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

function requireSupabase(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify Site configuration > Environment variables, then redeploy."
    );
  }
}

function describeDbError(table: string, message: string, status?: number): Error {
  return new Error(
    `Supabase query failed for public.${table}${status ? ` (HTTP ${status})` : ""}: ${message}. Check the table name, column permissions, and SELECT Row Level Security policy.`
  );
}

/** Company list reads from the supplied real schema: public.companies. */
export function useCompanies() {
  return useQuery<CompanySummary[]>({
    queryKey: ["companies"],
    queryFn: async () => {
      requireSupabase();
      // Do not order/filter by a guessed column: deployments may use either
      // company_id/name or id/company_name in the source table.
      const { data, error, status } = await supabase
        .from("companies")
        .select("*");

      if (error) throw describeDbError("companies", error.message, status);
      return (data || [])
        .map((row: any) => {
          const id = Number(row.company_id ?? row.id);
          const name = String(row.name ?? row.company_name ?? row.company ?? "").trim();
          if (!Number.isFinite(id) || id <= 0 || !name) return null;
          const normalized = {
            ...row,
            company_id: id,
            name,
            short_name: row.short_name ?? row.shortName ?? name,
            website_url: row.website_url ?? row.website ?? row.url ?? "",
          };
          return normalizeCompanySummary(normalized, id);
        })
        .filter((row: CompanySummary | null): row is CompanySummary => row !== null)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Company profiles use the normalized tables in the supplied schema. Optional
 * one-to-one tables are merged only when the live query succeeds. Missing
 * optional detail is shown as unavailable, never replaced with seed data.
 */
export function useCompanyProfile(id: number | null | undefined) {
  return useQuery<CompanyProfile | null>({
    queryKey: ["companyProfile", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (!id) return null;
      requireSupabase();

      // Support both common primary-key names without assuming that every
      // production companies table has the same column layout.
      let companyResult = await supabase
        .from("companies")
        .select("*")
        .eq("company_id", id)
        .maybeSingle();
      if (companyResult.error || !companyResult.data) {
        const fallback = await supabase
          .from("companies")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!fallback.error && fallback.data) {
          companyResult = fallback;
        } else if (companyResult.error && fallback.error) {
          throw describeDbError("companies", fallback.error.message, fallback.status);
        } else if (!companyResult.error && fallback.error) {
          // The first query was valid but no matching company exists; preserve
          // the real not-found result rather than masking it with a schema error.
          return null;
        } else {
          return null;
        }
      }
      const company = companyResult.data;
      if (!company) return null;
      const companyName = String((company as any).name ?? (company as any).company_name ?? (company as any).company ?? "").trim();
      const normalizedCompany = {
        ...(company as any),
        name: companyName || "Company",
        short_name: (company as any).short_name ?? (company as any).shortName ?? companyName || "Company",
        website_url: (company as any).website_url ?? (company as any).website ?? (company as any).url ?? "",
      };

      const optionalTables = [
        "company_brand_reputation",
        "company_business",
        "company_compensation",
        "company_core_values",
        "company_culture",
        "company_customer_testimonials",
      ];
      const related = await Promise.all(
        optionalTables.map(async (table) => {
          const result = await supabase.from(table).select("*").eq("company_id", id).limit(1);
          // These are optional detail sections. A missing/inaccessible optional
          // table must not prevent the known companies record from loading.
          if (result.error || !result.data?.length) return {};
          return result.data[0] as Record<string, unknown>;
        })
      );

      const merged: Record<string, unknown> = { ...normalizedCompany };
      for (const record of related) {
        for (const [key, value] of Object.entries(record)) {
          if (key.endsWith("_id") || key === "company_id") continue;
          if (value !== null && value !== undefined && String(value).trim() !== "") {
            // Prefer the first real non-empty value when several tables happen
            // to use the same column name.
            if (merged[key] === null || merged[key] === undefined || String(merged[key]).trim() === "") {
              merged[key] = value;
            }
          }
        }
      }

      return normalizeCompanyProfile(merged, merged, Number((company as any).company_id ?? (company as any).id ?? id));
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export interface CompanySkillsData {
  skills: DashboardSkill[];
  topicsMap: Record<number, SkillTopic[]>;
}

/** Reads the optional skills schema if it exists. No invented skills are returned. */
export function useCompanySkills(id: number | null | undefined) {
  return useQuery<CompanySkillsData>({
    queryKey: ["companySkills", id],
    enabled: typeof id === "number" && id > 0,
    queryFn: async () => {
      if (!id) return { skills: [], topicsMap: {} };
      requireSupabase();

      const { data: levels, error } = await supabase
        .from("company_skill_levels")
        .select("company_id, skill_set_id, required_level, required_proficiency_level_id")
        .eq("company_id", id);

      // The provided schema extract does not include the skills tables. Keep
      // the page usable and honest if they are not installed in this database.
      if (error) {
        const message = `${error.message || "Skill tables unavailable"}`.toLowerCase();
        if (message.includes("does not exist") || message.includes("schema cache") || message.includes("could not find the table")) {
          return { skills: [], topicsMap: {} };
        }
        throw describeDbError("company_skill_levels", error.message);
      }
      const validLevels = (levels || []).filter((row: any) => {
        const level = Number(row.required_level);
        return Number.isFinite(Number(row.skill_set_id)) && Number.isFinite(level) && level >= 1 && level <= 10;
      });
      if (!validLevels.length) return { skills: [], topicsMap: {} };

      const ids = [...new Set(validLevels.map((row: any) => Number(row.skill_set_id)).filter(Number.isFinite))];
      const [mastersRes, profRes, topicsRes] = await Promise.all([
        supabase.from("skill_set_master").select("skill_set_id, skill_set_name, short_name").in("skill_set_id", ids),
        supabase.from("proficiency_levels").select("proficiency_level_id, proficiency_name, proficiency_code"),
        supabase.from("skill_set_topics").select("skill_set_id, level_number, topics").in("skill_set_id", ids).order("level_number", { ascending: true }),
      ]);
      const auxiliaryError = mastersRes.error || profRes.error || topicsRes.error;
      if (auxiliaryError) throw new Error(`Could not load skill reference data: ${auxiliaryError.message}`);

      const masterMap = new Map<number, any>((mastersRes.data || []).map((row: any) => [Number(row.skill_set_id), row] as [number, any]));
      const proficiencyMap = new Map<number, string>((profRes.data || []).map((row: any) => [Number(row.proficiency_level_id), String(row.proficiency_name || row.proficiency_code || "Not specified")] as [number, string]));
      const topicsMap: Record<number, SkillTopic[]> = Object.fromEntries(ids.map((skillId) => [skillId, []]));
      for (const topic of topicsRes.data || []) {
        const skillId = Number((topic as any).skill_set_id);
        if (!topicsMap[skillId]) topicsMap[skillId] = [];
        const label = String((topic as any).topics || "").trim();
        if (label) topicsMap[skillId].push({ level_number: Number((topic as any).level_number) || 1, topic: label });
      }

      const assembled = validLevels.flatMap((row: any) => {
        const master = masterMap.get(Number(row.skill_set_id));
        const skillName = String(master?.skill_set_name || master?.short_name || "").trim();
        if (!skillName) return [];
        return [{
          skill_set_id: Number(row.skill_set_id),
          skill_set_name: skillName,
          required_level: Number(row.required_level),
          required_proficiency: proficiencyMap.get(Number(row.required_proficiency_level_id)) || "Not specified",
        }];
      });
      return { skills: normalizeDashboardSkills(assembled), topicsMap };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
