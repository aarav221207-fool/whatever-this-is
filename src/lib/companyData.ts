/**
 * Pure normalizers and data transformation layer.
 * Designed so swapping seed -> Supabase in Phase 2 is a single-file change.
 */

export interface CompanySummary {
  id: number;
  name: string;
  short_name: string;
  logo_url: string;
  category: string;
  company_type: "Super Dream" | "Dream" | "Standard" | "Regular";
  incorporation_year: number | string;
  employee_size: string;
  headquarters_address: string;
  operating_countries: string;
  office_locations: string;
  yoy_growth_rate: string;
  website_url: string;
}

export interface CompanyProfile {
  id: number;
  // Identity & Overview
  name: string;
  short_name: string;
  category: string;
  incorporation_year: string | number;
  nature_of_company: string;
  overview_text: string;
  headquarters_address: string;
  operating_countries: string;
  office_count: string;
  office_locations: string;
  employee_size: string;
  vision_statement: string;
  mission_statement: string;
  core_values: string;
  history_timeline: string;
  recent_news: string;

  // Digital Presence
  website_url: string;
  linkedin_url: string;
  twitter_handle: string;
  facebook_url: string;
  instagram_url: string;
  primary_contact_email: string;
  primary_phone_number: string;

  // Risk & Compliance
  regulatory_status: string;
  legal_issues: string;
  esg_ratings: string;
  supply_chain_dependencies: string;
  geopolitical_risks: string;
  macro_risks: string;
  carbon_footprint: string;
  ethical_sourcing: string;

  // Brand & Ratings
  marketing_video_url: string;
  customer_testimonials: string;
  website_quality: string;
  website_rating: string;
  website_traffic_rank: string;
  social_media_followers: string;
  glassdoor_rating: string;
  indeed_rating: string;
  google_rating: string;
  awards_recognitions: string;
  brand_sentiment_score: string;
  event_participation: string;

  // Products & Services
  pain_points_addressed: string;
  focus_sectors: string;
  offerings_description: string;
  top_customers: string;
  core_value_proposition: string;
  unique_differentiators: string;
  competitive_advantages: string;
  weaknesses_gaps: string;
  key_challenges_needs: string;
  key_competitors: string;
  market_share_percentage: string;
  sales_motion: string;
  customer_concentration_risk: string;
  exit_strategy_history: string;
  benchmark_vs_peers: string;
  future_projections: string;
  strategic_priorities: string;
  industry_associations: string;
  case_studies: string;
  go_to_market_strategy: string;
  innovation_roadmap: string;
  product_pipeline: string;
  tam: string;
  sam: string;
  som: string;

  // Culture & Benefits (NO CTC, NO Stipend, NO Selection Ratio)
  leave_policy: string;
  health_support: string;
  fixed_vs_variable_pay: string;
  bonus_predictability: string;
  esops_incentives: string;
  family_health_insurance: string;
  relocation_support: string;
  lifestyle_benefits: string;
  hiring_velocity: string;
  employee_turnover: string;
  avg_retention_tenure: string;
  diversity_metrics: string;
  work_culture_summary: string;
  manager_quality: string;
  psychological_safety: string;
  feedback_culture: string;
  diversity_inclusion_score: string;
  ethical_standards: string;
  burnout_risk: string;
  layoff_history: string;
  mission_clarity: string;
  sustainability_csr: string;
  crisis_behavior: string;

  // Funding & Financials
  annual_revenue: string;
  annual_profit: string;
  revenue_mix: string;
  valuation: string;
  yoy_growth_rate: string;
  profitability_status: string;
  key_investors: string;
  recent_funding_rounds: string;
  total_capital_raised: string;
  customer_acquisition_cost: string;
  customer_lifetime_value: string;
  cac_ltv_ratio: string;
  churn_rate: string;
  net_promoter_score: string;
  burn_rate: string;
  runway_months: string;
  burn_multiplier: string;

  // Work Location & Commute
  remote_policy_details: string;
  typical_hours: string;
  overtime_expectations: string;
  weekend_work: string;
  flexibility_level: string;
  location_centrality: string;
  public_transport_access: string;
  cab_policy: string;
  airport_commute_time: string;
  office_zone_type: string;
  area_safety: string;
  safety_policies: string;
  infrastructure_safety: string;
  emergency_preparedness: string;

  // Leadership
  ceo_name: string;
  ceo_linkedin_url: string;
  key_leaders: string;
  warm_intro_pathways: string;
  decision_maker_access: string;
  contact_person_name: string;
  contact_person_title: string;
  contact_person_email: string;
  contact_person_phone: string;
  board_members: string;

  // Career Growth
  training_spend: string;
  onboarding_quality: string;
  learning_culture: string;
  exposure_quality: string;
  mentorship_availability: string;
  internal_mobility: string;
  promotion_clarity: string;
  tools_access: string;
  role_clarity: string;
  early_ownership: string;
  work_impact: string;
  execution_thinking_balance: string;
  automation_level: string;
  cross_functional_exposure: string;
  company_maturity: string;
  brand_value: string;
  client_quality: string;
  exit_opportunities: string;
  skill_relevance: string;
  external_recognition: string;
  network_strength: string;
  global_exposure: string;

  // Technology Stack & Ecosystem
  technology_partners: string;
  intellectual_property: string;
  r_and_d_investment: string;
  ai_ml_adoption_level: string;
  tech_stack: string;
  cybersecurity_posture: string;
  partnership_ecosystem: string;
  tech_adoption_rating: string;
}

export type BloomLevel = "CU" | "AP" | "AS" | "EV" | "CR";
export type CriticalityLevel = "Critical" | "Important" | "Baseline";
export type DifficultyTier = "EXPERT" | "ADVANCED" | "PRO" | "BEGINNER";

export interface DashboardSkill {
  skill_set_id: number;
  skill_set_name: string;
  required_level: number;
  required_proficiency: string;
  bloom_level: BloomLevel;
  bloom_name: string;
  bloom_color: string;
  bloom_soft_color: string;
  criticality: CriticalityLevel;
  difficulty_tier: DifficultyTier;
}

// Helpers
export function asString(val: any, fallback = "Not Available"): string {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === "na" || str.toLowerCase() === "n/a" || str.toLowerCase() === "none" || str === "-") {
    return fallback;
  }
  return str;
}

export function asRecord(val: any): Record<string, any> {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val;
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // not JSON string
    }
  }
  return {};
}

export function splitItems(val: string): string[] {
  if (!val || val === "Not Available") return [];
  // Split on semicolons, newlines, or bullets
  return val
    .split(/[;\n•]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toLowerCase() !== "na" && s.toLowerCase() !== "n/a");
}

export function titleCaseFromCode(code: string): string {
  return code
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function scoreToDifficulty(score: number): DifficultyTier {
  if (score >= 8) return "EXPERT";
  if (score >= 6) return "ADVANCED";
  if (score >= 4) return "PRO";
  return "BEGINNER";
}

/**
 * Bloom Taxonomy Mapping:
 * 1-2 -> CU (Conceptual Understanding)
 * 3-4 -> AP (Application)
 * 5-6 -> AS (Analysis)
 * 7-8 -> EV (Evaluation)
 * 9-10 -> CR (Creation)
 */
export function proficiencyToBloom(level: number): {
  code: BloomLevel;
  name: string;
  color: string;
  softClass: string;
} {
  if (level >= 9) {
    return {
      code: "CR",
      name: "Creation",
      color: "#a855f7",
      softClass: "bloom-cr-soft"
    };
  }
  if (level >= 7) {
    return {
      code: "EV",
      name: "Evaluation",
      color: "#ef4444",
      softClass: "bloom-ev-soft"
    };
  }
  if (level >= 5) {
    return {
      code: "AS",
      name: "Analysis",
      color: "#eab308",
      softClass: "bloom-as-soft"
    };
  }
  if (level >= 3) {
    return {
      code: "AP",
      name: "Application",
      color: "#22c55e",
      softClass: "bloom-ap-soft"
    };
  }
  return {
    code: "CU",
    name: "Conceptual Understanding",
    color: "#3b82f6",
    softClass: "bloom-cu-soft"
  };
}

/**
 * Criticality mapping:
 * >= 7 -> Critical
 * >= 5 -> Important
 * else -> Baseline
 */
export function scoreToCriticality(score: number): CriticalityLevel {
  if (score >= 7) return "Critical";
  if (score >= 5) return "Important";
  return "Baseline";
}

export function isNullish(val: any): boolean {
  if (val === undefined || val === null) return true;
  const s = String(val).trim().toLowerCase();
  return s === "" || s === "na" || s === "n/a" || s === "null" || s === "-" || s === "none" || s === "not available";
}

// Normalizer: Company Summary
export function normalizeCompanySummary(short_json: any, id = 1): CompanySummary {
  const data = asRecord(short_json);
  const rawType = asString(data.company_type, "Dream");
  let validCategory: "Super Dream" | "Dream" | "Standard" | "Regular" = "Dream";
  if (["Super Dream", "Dream", "Standard", "Regular"].includes(rawType)) {
    validCategory = rawType as any;
  }

  return {
    id,
    name: asString(data.name, "Company Name"),
    short_name: asString(data.short_name, data.name || "Company"),
    logo_url: asString(data.logo_url, ""),
    category: asString(data.category, "Technology & Services"),
    company_type: validCategory,
    incorporation_year: data.incorporation_year || "Not Available",
    employee_size: asString(data.employee_size),
    headquarters_address: asString(data.headquarters_address),
    operating_countries: asString(data.operating_countries),
    office_locations: asString(data.office_locations),
    yoy_growth_rate: asString(data.yoy_growth_rate, "N/A"),
    website_url: asString(data.website_url, "")
  };
}

// Normalizer: Company Profile (Strictly omitting CTC, Stipend, Selection Ratio)
export function normalizeCompanyProfile(full_json: any, short_json: any, id = 1): CompanyProfile {
  const full = asRecord(full_json);
  const short = asRecord(short_json);

  return {
    id,
    // Identity & Overview
    name: asString(full.name || short.name, "Company Name"),
    short_name: asString(full.short_name || short.short_name, "Company"),
    category: asString(full.category || short.category, "Enterprise"),
    incorporation_year: full.incorporation_year || short.incorporation_year || "Not Available",
    nature_of_company: asString(full.nature_of_company, "Public Enterprise"),
    overview_text: asString(full.overview_text),
    headquarters_address: asString(full.headquarters_address || short.headquarters_address),
    operating_countries: asString(full.operating_countries || short.operating_countries),
    office_count: asString(full.office_count),
    office_locations: asString(full.office_locations || short.office_locations),
    employee_size: asString(full.employee_size || short.employee_size),
    vision_statement: asString(full.vision_statement),
    mission_statement: asString(full.mission_statement),
    core_values: asString(full.core_values),
    history_timeline: asString(full.history_timeline),
    recent_news: asString(full.recent_news),

    // Digital Presence
    website_url: asString(full.website_url || short.website_url, ""),
    linkedin_url: asString(full.linkedin_url, ""),
    twitter_handle: asString(full.twitter_handle, ""),
    facebook_url: asString(full.facebook_url, ""),
    instagram_url: asString(full.instagram_url, ""),
    primary_contact_email: asString(full.primary_contact_email),
    primary_phone_number: asString(full.primary_phone_number),

    // Risk & Compliance
    regulatory_status: asString(full.regulatory_status),
    legal_issues: asString(full.legal_issues),
    esg_ratings: asString(full.esg_ratings),
    supply_chain_dependencies: asString(full.supply_chain_dependencies),
    geopolitical_risks: asString(full.geopolitical_risks),
    macro_risks: asString(full.macro_risks),
    carbon_footprint: asString(full.carbon_footprint),
    ethical_sourcing: asString(full.ethical_sourcing),

    // Brand & Ratings
    marketing_video_url: asString(full.marketing_video_url, ""),
    customer_testimonials: asString(full.customer_testimonials),
    website_quality: asString(full.website_quality),
    website_rating: asString(full.website_rating),
    website_traffic_rank: asString(full.website_traffic_rank),
    social_media_followers: asString(full.social_media_followers),
    glassdoor_rating: asString(full.glassdoor_rating),
    indeed_rating: asString(full.indeed_rating),
    google_rating: asString(full.google_rating),
    awards_recognitions: asString(full.awards_recognitions),
    brand_sentiment_score: asString(full.brand_sentiment_score),
    event_participation: asString(full.event_participation),

    // Products & Services
    pain_points_addressed: asString(full.pain_points_addressed),
    focus_sectors: asString(full.focus_sectors),
    offerings_description: asString(full.offerings_description),
    top_customers: asString(full.top_customers),
    core_value_proposition: asString(full.core_value_proposition),
    unique_differentiators: asString(full.unique_differentiators),
    competitive_advantages: asString(full.competitive_advantages),
    weaknesses_gaps: asString(full.weaknesses_gaps),
    key_challenges_needs: asString(full.key_challenges_needs),
    key_competitors: asString(full.key_competitors),
    market_share_percentage: asString(full.market_share_percentage),
    sales_motion: asString(full.sales_motion),
    customer_concentration_risk: asString(full.customer_concentration_risk),
    exit_strategy_history: asString(full.exit_strategy_history),
    benchmark_vs_peers: asString(full.benchmark_vs_peers),
    future_projections: asString(full.future_projections),
    strategic_priorities: asString(full.strategic_priorities),
    industry_associations: asString(full.industry_associations),
    case_studies: asString(full.case_studies),
    go_to_market_strategy: asString(full.go_to_market_strategy),
    innovation_roadmap: asString(full.innovation_roadmap),
    product_pipeline: asString(full.product_pipeline),
    tam: asString(full.tam),
    sam: asString(full.sam),
    som: asString(full.som),

    // Culture & Benefits (NO CTC, NO Stipend, NO Selection Ratio)
    leave_policy: asString(full.leave_policy),
    health_support: asString(full.health_support),
    fixed_vs_variable_pay: asString(full.fixed_vs_variable_pay),
    bonus_predictability: asString(full.bonus_predictability),
    esops_incentives: asString(full.esops_incentives),
    family_health_insurance: asString(full.family_health_insurance),
    relocation_support: asString(full.relocation_support),
    lifestyle_benefits: asString(full.lifestyle_benefits),
    hiring_velocity: asString(full.hiring_velocity),
    employee_turnover: asString(full.employee_turnover),
    avg_retention_tenure: asString(full.avg_retention_tenure),
    diversity_metrics: asString(full.diversity_metrics),
    work_culture_summary: asString(full.work_culture_summary),
    manager_quality: asString(full.manager_quality),
    psychological_safety: asString(full.psychological_safety),
    feedback_culture: asString(full.feedback_culture),
    diversity_inclusion_score: asString(full.diversity_inclusion_score),
    ethical_standards: asString(full.ethical_standards),
    burnout_risk: asString(full.burnout_risk),
    layoff_history: asString(full.layoff_history),
    mission_clarity: asString(full.mission_clarity),
    sustainability_csr: asString(full.sustainability_csr),
    crisis_behavior: asString(full.crisis_behavior),

    // Funding & Financials
    annual_revenue: asString(full.annual_revenue),
    annual_profit: asString(full.annual_profit),
    revenue_mix: asString(full.revenue_mix),
    valuation: asString(full.valuation),
    yoy_growth_rate: asString(full.yoy_growth_rate || short.yoy_growth_rate),
    profitability_status: asString(full.profitability_status),
    key_investors: asString(full.key_investors),
    recent_funding_rounds: asString(full.recent_funding_rounds),
    total_capital_raised: asString(full.total_capital_raised),
    customer_acquisition_cost: asString(full.customer_acquisition_cost),
    customer_lifetime_value: asString(full.customer_lifetime_value),
    cac_ltv_ratio: asString(full.cac_ltv_ratio),
    churn_rate: asString(full.churn_rate),
    net_promoter_score: asString(full.net_promoter_score),
    burn_rate: asString(full.burn_rate),
    runway_months: asString(full.runway_months),
    burn_multiplier: asString(full.burn_multiplier),

    // Work Location & Commute
    remote_policy_details: asString(full.remote_policy_details),
    typical_hours: asString(full.typical_hours),
    overtime_expectations: asString(full.overtime_expectations),
    weekend_work: asString(full.weekend_work),
    flexibility_level: asString(full.flexibility_level),
    location_centrality: asString(full.location_centrality),
    public_transport_access: asString(full.public_transport_access),
    cab_policy: asString(full.cab_policy),
    airport_commute_time: asString(full.airport_commute_time),
    office_zone_type: asString(full.office_zone_type),
    area_safety: asString(full.area_safety),
    safety_policies: asString(full.safety_policies),
    infrastructure_safety: asString(full.infrastructure_safety),
    emergency_preparedness: asString(full.emergency_preparedness),

    // Leadership
    ceo_name: asString(full.ceo_name),
    ceo_linkedin_url: asString(full.ceo_linkedin_url, ""),
    key_leaders: asString(full.key_leaders),
    warm_intro_pathways: asString(full.warm_intro_pathways),
    decision_maker_access: asString(full.decision_maker_access),
    contact_person_name: asString(full.contact_person_name),
    contact_person_title: asString(full.contact_person_title),
    contact_person_email: asString(full.contact_person_email),
    contact_person_phone: asString(full.contact_person_phone),
    board_members: asString(full.board_members),

    // Career Growth
    training_spend: asString(full.training_spend),
    onboarding_quality: asString(full.onboarding_quality),
    learning_culture: asString(full.learning_culture),
    exposure_quality: asString(full.exposure_quality),
    mentorship_availability: asString(full.mentorship_availability),
    internal_mobility: asString(full.internal_mobility),
    promotion_clarity: asString(full.promotion_clarity),
    tools_access: asString(full.tools_access),
    role_clarity: asString(full.role_clarity),
    early_ownership: asString(full.early_ownership),
    work_impact: asString(full.work_impact),
    execution_thinking_balance: asString(full.execution_thinking_balance),
    automation_level: asString(full.automation_level),
    cross_functional_exposure: asString(full.cross_functional_exposure),
    company_maturity: asString(full.company_maturity),
    brand_value: asString(full.brand_value),
    client_quality: asString(full.client_quality),
    exit_opportunities: asString(full.exit_opportunities),
    skill_relevance: asString(full.skill_relevance),
    external_recognition: asString(full.external_recognition),
    network_strength: asString(full.network_strength),
    global_exposure: asString(full.global_exposure),

    // Technology Stack & Ecosystem
    technology_partners: asString(full.technology_partners),
    intellectual_property: asString(full.intellectual_property),
    r_and_d_investment: asString(full.r_and_d_investment),
    ai_ml_adoption_level: asString(full.ai_ml_adoption_level),
    tech_stack: asString(full.tech_stack),
    cybersecurity_posture: asString(full.cybersecurity_posture),
    partnership_ecosystem: asString(full.partnership_ecosystem),
    tech_adoption_rating: asString(full.tech_adoption_rating)
  };
}

// Normalizer: Dashboard Skills
export function normalizeDashboardSkills(skillLevels: any[] = []): DashboardSkill[] {
  if (!Array.isArray(skillLevels)) return [];

  return skillLevels.map((item, idx) => {
    const rawLevel = Number(item.required_level) || 5;
    const bloom = proficiencyToBloom(rawLevel);
    const criticality = scoreToCriticality(rawLevel);
    const difficulty = scoreToDifficulty(rawLevel);

    return {
      skill_set_id: Number(item.skill_set_id) || idx + 1,
      skill_set_name: asString(item.skill_set_name, `Skill ${idx + 1}`),
      required_level: rawLevel,
      required_proficiency: asString(item.required_proficiency, "Proficient"),
      bloom_level: bloom.code,
      bloom_name: bloom.name,
      bloom_color: bloom.color,
      bloom_soft_color: bloom.softClass,
      criticality,
      difficulty_tier: difficulty
    };
  });
}
