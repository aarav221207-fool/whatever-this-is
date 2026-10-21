import React from "react";
import {
  Building2,
  Compass,
  Users2,
  Coins,
  Globe2,
  Package,
  Cpu,
  Handshake,
  Swords,
  Target,
  Sparkles,
  HeartHandshake,
  Newspaper,
  TrendingUp,
  ShieldAlert,
  MapPin,
  HeartPulse,
  GraduationCap,
  Award,
  Gift,
  Share2,
  Mail,
  type LucideIcon,
} from "lucide-react";
import type { CompanyProfile } from "../lib/companyData";

export interface IntelligenceField {
  label: string;
  value: string | number;
  type?: "text" | "url" | "video" | "rating" | "email" | "badge-list";
}

export interface IntelligenceSection {
  id: string;
  title: string;
  icon: LucideIcon;
  fields: IntelligenceField[];
}

export function buildIntelligenceSections(profile?: CompanyProfile | null): IntelligenceSection[] {
  const p = profile || ({} as Partial<CompanyProfile>);

  return [
    // 1. Company Identity
    {
      id: "company-identity",
      title: "Company Identity",
      icon: Building2,
      fields: [
        { label: "Full Legal Name", value: p.name ?? "Not Available" },
        { label: "Display / Short Name", value: p.short_name ?? "Not Available" },
        { label: "Industry Category", value: p.category ?? "Not Available" },
        { label: "Incorporation Year", value: p.incorporation_year ?? "Not Available" },
        { label: "Corporate Nature", value: p.nature_of_company ?? "Not Available" },
        { label: "Global Headquarters", value: p.headquarters_address ?? "Not Available" },
      ],
    },
    // 2. Overview & Vision
    {
      id: "overview-vision",
      title: "Overview & Vision",
      icon: Compass,
      fields: [
        { label: "Company Overview", value: p.overview_text ?? "Not Available" },
        { label: "Vision Statement", value: p.vision_statement ?? "Not Available" },
        { label: "Mission Statement", value: p.mission_statement ?? "Not Available" },
        { label: "Core Values", value: p.core_values ?? "Not Available" },
        { label: "History & Milestones Timeline", value: p.history_timeline ?? "Not Available" },
      ],
    },
    // 3. Leadership
    {
      id: "leadership",
      title: "Leadership",
      icon: Users2,
      fields: [
        { label: "Chief Executive Officer", value: p.ceo_name ?? "Not Available" },
        { label: "CEO LinkedIn", value: p.ceo_linkedin_url ?? "Not Available", type: "url" },
        { label: "Key Leadership Team", value: p.key_leaders ?? "Not Available" },
        { label: "Board of Directors", value: p.board_members ?? "Not Available" },
        { label: "Warm Intro Pathways", value: p.warm_intro_pathways ?? "Not Available" },
        { label: "Decision-Maker Access Dynamics", value: p.decision_maker_access ?? "Not Available" },
      ],
    },
    // 4. Funding & Financials
    {
      id: "funding-financials",
      title: "Funding & Financials",
      icon: Coins,
      fields: [
        { label: "Annual Revenue", value: p.annual_revenue ?? "Not Available" },
        { label: "Annual Net Profit", value: p.annual_profit ?? "Not Available" },
        { label: "Revenue Mix Breakdown", value: p.revenue_mix ?? "Not Available" },
        { label: "Enterprise Valuation / Market Cap", value: p.valuation ?? "Not Available" },
        { label: "YoY Growth Rate", value: p.yoy_growth_rate ?? "Not Available" },
        { label: "Profitability Status", value: p.profitability_status ?? "Not Available" },
        { label: "Key Institutional Investors", value: p.key_investors ?? "Not Available" },
        { label: "Recent Funding Rounds", value: p.recent_funding_rounds ?? "Not Available" },
        { label: "Total Capital Raised", value: p.total_capital_raised ?? "Not Available" },
        { label: "Cash Burn Rate", value: p.burn_rate ?? "Not Available" },
        { label: "Capital Runway", value: p.runway_months ?? "Not Available" },
      ],
    },
    // 5. Global Presence
    {
      id: "global-presence",
      title: "Global Presence",
      icon: Globe2,
      fields: [
        { label: "Operating Countries", value: p.operating_countries ?? "Not Available" },
        { label: "Global Office Count", value: p.office_count ?? "Not Available" },
        { label: "Major Office Locations & Delivery Centers", value: p.office_locations ?? "Not Available" },
        { label: "Global Workforce Size", value: p.employee_size ?? "Not Available" },
      ],
    },
    // 6. Products & Services
    {
      id: "products-services",
      title: "Products & Services",
      icon: Package,
      fields: [
        { label: "Core Enterprise Offerings", value: p.offerings_description ?? "Not Available" },
        { label: "Focus Industry Sectors", value: p.focus_sectors ?? "Not Available" },
        { label: "Pain Points Addressed", value: p.pain_points_addressed ?? "Not Available" },
        { label: "Key Client Cohorts", value: p.top_customers ?? "Not Available" },
        { label: "Strategic Case Studies", value: p.case_studies ?? "Not Available" },
        { label: "Product & Solution Pipeline", value: p.product_pipeline ?? "Not Available" },
      ],
    },
    // 7. Technology Stack
    {
      id: "technology-stack",
      title: "Technology Stack",
      icon: Cpu,
      fields: [
        { label: "Primary Technology Stack", value: p.tech_stack ?? "Not Available" },
        { label: "AI & ML Adoption Maturity", value: p.ai_ml_adoption_level ?? "Not Available" },
        { label: "Tech Adoption Industry Rating", value: p.tech_adoption_rating ?? "Not Available" },
        { label: "Annual R&D Investment", value: p.r_and_d_investment ?? "Not Available" },
        { label: "Intellectual Property & Labs", value: p.intellectual_property ?? "Not Available" },
        { label: "Cybersecurity Posture & Certifications", value: p.cybersecurity_posture ?? "Not Available" },
      ],
    },
    // 8. Partnerships & Ecosystem
    {
      id: "partnerships-ecosystem",
      title: "Partnerships & Ecosystem",
      icon: Handshake,
      fields: [
        { label: "Partnership Ecosystem", value: p.partnership_ecosystem ?? "Not Available" },
        { label: "Strategic Technology Partners", value: p.technology_partners ?? "Not Available" },
        { label: "Industry Associations", value: p.industry_associations ?? "Not Available" },
      ],
    },
    // 9. Competitive Landscape
    {
      id: "competitive-landscape",
      title: "Competitive Landscape",
      icon: Swords,
      fields: [
        { label: "Key Competitors", value: p.key_competitors ?? "Not Available" },
        { label: "Market Share Percentage", value: p.market_share_percentage ?? "Not Available" },
        { label: "Benchmark vs Industry Peers", value: p.benchmark_vs_peers ?? "Not Available" },
        { label: "Competitive Advantages & Moats", value: p.competitive_advantages ?? "Not Available" },
        { label: "Weaknesses & Gap Areas", value: p.weaknesses_gaps ?? "Not Available" },
        { label: "Strategic Challenges & Market Needs", value: p.key_challenges_needs ?? "Not Available" },
      ],
    },
    // 10. Market Opportunity
    {
      id: "market-opportunity",
      title: "Market Opportunity",
      icon: Target,
      fields: [
        { label: "Total Addressable Market (TAM)", value: p.tam ?? "Not Available" },
        { label: "Serviceable Addressable Market (SAM)", value: p.sam ?? "Not Available" },
        { label: "Serviceable Obtainable Market (SOM)", value: p.som ?? "Not Available" },
        { label: "Future Projections", value: p.future_projections ?? "Not Available" },
        { label: "Strategic Growth Priorities", value: p.strategic_priorities ?? "Not Available" },
        { label: "Exit Strategy / Capital History", value: p.exit_strategy_history ?? "Not Available" },
      ],
    },
    // 11. Core Value Proposition & ESG
    {
      id: "core-value-proposition-esg",
      title: "Core Value Proposition & ESG",
      icon: Sparkles,
      fields: [
        { label: "Core Value Proposition", value: p.core_value_proposition ?? "Not Available" },
        { label: "Unique Differentiators", value: p.unique_differentiators ?? "Not Available" },
        { label: "ESG Commitments & Ratings", value: p.esg_ratings ?? "Not Available" },
        { label: "Sustainability & CSR Programs", value: p.sustainability_csr ?? "Not Available" },
        { label: "Ethical Sourcing & Standards", value: p.ethical_sourcing ?? "Not Available" },
        { label: "Carbon Footprint Strategy", value: p.carbon_footprint ?? "Not Available" },
      ],
    },
    // 12. Culture & Work Life
    {
      id: "culture-work-life",
      title: "Culture & Work Life",
      icon: HeartHandshake,
      fields: [
        { label: "Work Culture Summary", value: p.work_culture_summary ?? "Not Available" },
        { label: "Psychological Safety", value: p.psychological_safety ?? "Not Available" },
        { label: "Feedback & Performance Review Culture", value: p.feedback_culture ?? "Not Available" },
        { label: "Manager & Leadership Coaching Quality", value: p.manager_quality ?? "Not Available" },
        { label: "Workforce Diversity Metrics", value: p.diversity_metrics ?? "Not Available" },
        { label: "Diversity & Inclusion Score", value: p.diversity_inclusion_score ?? "Not Available" },
        { label: "Ethical Standards & Governance", value: p.ethical_standards ?? "Not Available" },
        { label: "Burnout Risk Assessment", value: p.burnout_risk ?? "Not Available" },
        { label: "Layoff & Restructuring History", value: p.layoff_history ?? "Not Available" },
        { label: "Mission Clarity", value: p.mission_clarity ?? "Not Available" },
        { label: "Crisis Behavior & Transparency", value: p.crisis_behavior ?? "Not Available" },
      ],
    },
    // 13. Recent News & Milestones
    {
      id: "recent-news-milestones",
      title: "Recent News & Milestones",
      icon: Newspaper,
      fields: [
        { label: "Recent News & Strategic Initiatives", value: p.recent_news ?? "Not Available" },
        { label: "Historical Achievements", value: p.history_timeline ?? "Not Available" },
        { label: "Innovation Roadmap", value: p.innovation_roadmap ?? "Not Available" },
      ],
    },
    // 14. Sales & Customer Metrics
    {
      id: "sales-customer-metrics",
      title: "Sales & Customer Metrics",
      icon: TrendingUp,
      fields: [
        { label: "Sales Motion", value: p.sales_motion ?? "Not Available" },
        { label: "Net Promoter Score (NPS)", value: p.net_promoter_score ?? "Not Available" },
        { label: "Annual Client Churn Rate", value: p.churn_rate ?? "Not Available" },
        { label: "Customer Lifetime Value (LTV)", value: p.customer_lifetime_value ?? "Not Available" },
        { label: "Customer Acquisition Cost (CAC)", value: p.customer_acquisition_cost ?? "Not Available" },
        { label: "CAC / LTV Ratio", value: p.cac_ltv_ratio ?? "Not Available" },
        { label: "Customer Concentration Risk", value: p.customer_concentration_risk ?? "Not Available" },
        { label: "Go-to-Market Strategy", value: p.go_to_market_strategy ?? "Not Available" },
      ],
    },
    // 15. Risk & Compliance
    {
      id: "risk-compliance",
      title: "Risk & Compliance",
      icon: ShieldAlert,
      fields: [
        { label: "Regulatory Compliance Standards", value: p.regulatory_status ?? "Not Available" },
        { label: "Legal Disputes & Litigation Status", value: p.legal_issues ?? "Not Available" },
        { label: "Supply Chain & Partner Dependencies", value: p.supply_chain_dependencies ?? "Not Available" },
        { label: "Geopolitical Risk Exposure", value: p.geopolitical_risks ?? "Not Available" },
        { label: "Macroeconomic Sensitivity", value: p.macro_risks ?? "Not Available" },
      ],
    },
    // 16. Work Location & Commute
    {
      id: "work-location-commute",
      title: "Work Location & Commute",
      icon: MapPin,
      fields: [
        { label: "Remote & Hybrid Policy Details", value: p.remote_policy_details ?? "Not Available" },
        { label: "Workplace Flexibility Level", value: p.flexibility_level ?? "Not Available" },
        { label: "Typical Working Hours", value: p.typical_hours ?? "Not Available" },
        { label: "Overtime Expectations", value: p.overtime_expectations ?? "Not Available" },
        { label: "Weekend Work Frequency", value: p.weekend_work ?? "Not Available" },
        { label: "Office Centrality & Geography", value: p.location_centrality ?? "Not Available" },
        { label: "Public Transport Accessibility", value: p.public_transport_access ?? "Not Available" },
        { label: "Cab / Transportation Policy", value: p.cab_policy ?? "Not Available" },
        { label: "Airport Commute Time", value: p.airport_commute_time ?? "Not Available" },
        { label: "Office Zone Classification", value: p.office_zone_type ?? "Not Available" },
      ],
    },
    // 17. Safety & Wellbeing
    {
      id: "safety-wellbeing",
      title: "Safety & Wellbeing",
      icon: HeartPulse,
      fields: [
        { label: "Surrounding Area Safety", value: p.area_safety ?? "Not Available" },
        { label: "Corporate Safety Policies", value: p.safety_policies ?? "Not Available" },
        { label: "Facility Infrastructure Safety", value: p.infrastructure_safety ?? "Not Available" },
        { label: "Emergency Preparedness & Medical Response", value: p.emergency_preparedness ?? "Not Available" },
      ],
    },
    // 18. Career Growth & Learning
    {
      id: "career-growth-learning",
      title: "Career Growth & Learning",
      icon: GraduationCap,
      fields: [
        { label: "Annual Training Investment", value: p.training_spend ?? "Not Available" },
        { label: "Onboarding Program Quality", value: p.onboarding_quality ?? "Not Available" },
        { label: "Continuous Learning & Certifications", value: p.learning_culture ?? "Not Available" },
        { label: "Client Exposure Quality", value: p.exposure_quality ?? "Not Available" },
        { label: "Mentorship Availability", value: p.mentorship_availability ?? "Not Available" },
        { label: "Internal Talent Mobility", value: p.internal_mobility ?? "Not Available" },
        { label: "Promotion Criteria & Clarity", value: p.promotion_clarity ?? "Not Available" },
        { label: "Access to Enterprise Software & Tools", value: p.tools_access ?? "Not Available" },
        { label: "Role Scope Clarity", value: p.role_clarity ?? "Not Available" },
        { label: "Early Career Project Ownership", value: p.early_ownership ?? "Not Available" },
        { label: "Work Impact & Visibility", value: p.work_impact ?? "Not Available" },
        { label: "Execution vs Strategic Balance", value: p.execution_thinking_balance ?? "Not Available" },
        { label: "Workflow Automation Level", value: p.automation_level ?? "Not Available" },
        { label: "Cross-Functional Exposure", value: p.cross_functional_exposure ?? "Not Available" },
        { label: "Enterprise Maturity", value: p.company_maturity ?? "Not Available" },
        { label: "Resume Brand Value", value: p.brand_value ?? "Not Available" },
        { label: "Client Account Tier", value: p.client_quality ?? "Not Available" },
        { label: "Exit Opportunities & Alumni Network", value: p.exit_opportunities ?? "Not Available" },
        { label: "Market Skill Relevance", value: p.skill_relevance ?? "Not Available" },
        { label: "Global Exposure & International Teams", value: p.global_exposure ?? "Not Available" },
      ],
    },
    // 19. Brand & Reputation
    {
      id: "brand-reputation",
      title: "Brand & Reputation",
      icon: Award,
      fields: [
        { label: "Brand Sentiment Score", value: p.brand_sentiment_score ?? "Not Available" },
        { label: "Industry Awards & Recognitions", value: p.awards_recognitions ?? "Not Available" },
        { label: "Global Summit Participation", value: p.event_participation ?? "Not Available" },
        { label: "Customer Testimonials", value: p.customer_testimonials ?? "Not Available" },
        { label: "Official Brand Media / Showcase", value: p.marketing_video_url ?? "Not Available", type: "video" },
      ],
    },
    // 20. Compensation & Benefits (NO CTC, NO STIPEND, NO SELECTION RATIO)
    {
      id: "compensation-benefits",
      title: "Compensation & Benefits",
      icon: Gift,
      fields: [
        { label: "Leave & Time-Off Policy", value: p.leave_policy ?? "Not Available" },
        { label: "Health & Mental Wellness Support", value: p.health_support ?? "Not Available" },
        { label: "Pay Structure (Fixed vs Variable)", value: p.fixed_vs_variable_pay ?? "Not Available" },
        { label: "Bonus Predictability", value: p.bonus_predictability ?? "Not Available" },
        { label: "Stock Grants & Equity (ESOPs)", value: p.esops_incentives ?? "Not Available" },
        { label: "Family Health Insurance Coverage", value: p.family_health_insurance ?? "Not Available" },
        { label: "Relocation Assistance", value: p.relocation_support ?? "Not Available" },
        { label: "Lifestyle & Fitness Perks", value: p.lifestyle_benefits ?? "Not Available" },
        { label: "Current Hiring Velocity", value: p.hiring_velocity ?? "Not Available" },
        { label: "Annual Turnover Rate", value: p.employee_turnover ?? "Not Available" },
        { label: "Average Employee Tenure", value: p.avg_retention_tenure ?? "Not Available" },
      ],
    },
    // 21. Digital Presence & Ratings
    {
      id: "digital-presence-ratings",
      title: "Digital Presence & Ratings",
      icon: Share2,
      fields: [
        { label: "Glassdoor Employee Rating", value: p.glassdoor_rating ?? "Not Available", type: "rating" },
        { label: "Indeed Employee Rating", value: p.indeed_rating ?? "Not Available", type: "rating" },
        { label: "Google Review Rating", value: p.google_rating ?? "Not Available", type: "rating" },
        { label: "Website Global Traffic Rank", value: p.website_traffic_rank ?? "Not Available" },
        { label: "Social Media Followers Count", value: p.social_media_followers ?? "Not Available" },
        { label: "Official Website", value: p.website_url ?? "Not Available", type: "url" },
        { label: "Official LinkedIn Page", value: p.linkedin_url ?? "Not Available", type: "url" },
        { label: "Twitter / X Profile", value: p.twitter_handle ?? "Not Available" },
        { label: "Facebook Page", value: p.facebook_url ?? "Not Available", type: "url" },
        { label: "Instagram Page", value: p.instagram_url ?? "Not Available", type: "url" },
      ],
    },
    // 22. Contact Information
    {
      id: "contact-information",
      title: "Contact Information",
      icon: Mail,
      fields: [
        { label: "Primary Corporate Email", value: p.primary_contact_email ?? "Not Available", type: "email" },
        { label: "Primary Phone Number", value: p.primary_phone_number ?? "Not Available" },
        { label: "Campus Recruitment Contact", value: p.contact_person_name ?? "Not Available" },
        { label: "Contact Title / Role", value: p.contact_person_title ?? "Not Available" },
        { label: "Contact Person Email", value: p.contact_person_email ?? "Not Available", type: "email" },
        { label: "Contact Person Phone", value: p.contact_person_phone ?? "Not Available" },
        { label: "Headquarters Address", value: p.headquarters_address ?? "Not Available" },
      ],
    },
  ];
}
