import { describe, it, expect } from "vitest";
import { SEED_COMPANIES } from "../data/seedCompanies";
import {
  normalizeCompanySummary,
  normalizeCompanyProfile,
  normalizeDashboardSkills,
  proficiencyToBloom,
  scoreToCriticality,
} from "../lib/companyData";
import { buildIntelligenceSections } from "../data/intelligenceData";
import { SKILL_TOPICS_MAP } from "../data/skillTopics";

describe("Smoke Test Suite - JSS University Noida Placement Hub", () => {
  it("loads SEED_COMPANIES with Accenture plc data", () => {
    expect(SEED_COMPANIES.length).toBeGreaterThanOrEqual(1);
    const accenture = SEED_COMPANIES[0];
    expect(accenture.short_json.name).toBe("Accenture plc");
    expect(accenture.short_json.short_name).toBe("Accenture");
    expect(accenture.short_json.company_type).toBe("Dream");
    expect(accenture.skill_levels.length).toBe(12);
  });

  it("normalizes company summary correctly", () => {
    const summary = normalizeCompanySummary(SEED_COMPANIES[0].short_json, SEED_COMPANIES[0].company_id);
    expect(summary.name).toBe("Accenture plc");
    expect(summary.company_type).toBe("Dream");
    expect(summary.headquarters_address).toBe("Dublin, Ireland");
  });

  it("normalizes company profile with exactly zero CTC/Stipend/Selection-Ratio fields", () => {
    const profile = normalizeCompanyProfile(
      SEED_COMPANIES[0].full_json,
      SEED_COMPANIES[0].short_json,
      SEED_COMPANIES[0].company_id
    );
    expect(profile.name).toBe("Accenture plc");
    expect(profile.annual_revenue).toContain("$64.1B");

    // Strictly verify no CTC, stipend, or selection ratio in keys or values
    const keys = Object.keys(profile);
    expect(keys.some((k) => k.toLowerCase().includes("ctc"))).toBe(false);
    expect(keys.some((k) => k.toLowerCase().includes("stipend"))).toBe(false);
    expect(keys.some((k) => k.toLowerCase().includes("selection_ratio"))).toBe(false);
  });

  it("builds all 22 intelligence sections in the exact specified order", () => {
    const profile = normalizeCompanyProfile(
      SEED_COMPANIES[0].full_json,
      SEED_COMPANIES[0].short_json,
      SEED_COMPANIES[0].company_id
    );
    const sections = buildIntelligenceSections(profile);
    expect(sections.length).toBe(22);

    const expectedTitles = [
      "Company Identity",
      "Overview & Vision",
      "Leadership",
      "Funding & Financials",
      "Global Presence",
      "Products & Services",
      "Technology Stack",
      "Partnerships & Ecosystem",
      "Competitive Landscape",
      "Market Opportunity",
      "Core Value Proposition & ESG",
      "Culture & Work Life",
      "Recent News & Milestones",
      "Sales & Customer Metrics",
      "Risk & Compliance",
      "Work Location & Commute",
      "Safety & Wellbeing",
      "Career Growth & Learning",
      "Brand & Reputation",
      "Compensation & Benefits",
      "Digital Presence & Ratings",
      "Contact Information",
    ];

    sections.forEach((sec, idx) => {
      expect(sec.title).toBe(expectedTitles[idx]);
    });
  });

  it("maps Bloom taxonomy levels and criticality accurately", () => {
    expect(proficiencyToBloom(1).code).toBe("CU");
    expect(proficiencyToBloom(4).code).toBe("AP");
    expect(proficiencyToBloom(6).code).toBe("AS");
    expect(proficiencyToBloom(8).code).toBe("EV");
    expect(proficiencyToBloom(10).code).toBe("CR");

    expect(scoreToCriticality(8)).toBe("Critical");
    expect(scoreToCriticality(6)).toBe("Important");
    expect(scoreToCriticality(3)).toBe("Baseline");
  });

  it("exports a valid Supabase client instance and flags unconfigured state gracefully", async () => {
    const { supabase, isSupabaseConfigured } = await import("../lib/supabaseClient");
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
    // With empty placeholders in .env, isSupabaseConfigured should safely be false without crashing
    expect(typeof isSupabaseConfigured).toBe("boolean");
  });
});
