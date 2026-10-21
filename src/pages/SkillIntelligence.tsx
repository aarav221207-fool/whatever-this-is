import React, { useState, useMemo } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Layers,
  ShieldCheck,
  AlertCircle,
  CircleDot,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { CompanyLogo } from "../components/common/CompanyLogo";
import { useCompanySkills } from "../lib/companyApi";
import type { DashboardSkill } from "../lib/companyData";
import { cn } from "../lib/utils";

export const SkillIntelligence: React.FC = () => {
  const { selectedCompanyId, selectedSummary } = useCompany();
  const {
    data: skillsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanySkills(selectedCompanyId);

  const [expandedSkills, setExpandedSkills] = useState<Record<number, boolean>>({});

  const selectedSkills = useMemo(() => skillsData?.skills || [], [skillsData]);
  const topicsMap = useMemo(() => skillsData?.topicsMap || {}, [skillsData]);

  // Sort skills descending by required_level
  const sortedSkills = useMemo(() => {
    return [...selectedSkills].sort((a, b) => b.required_level - a.required_level);
  }, [selectedSkills]);

  const toggleExpand = (skillId: number) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [skillId]: !prev[skillId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    selectedSkills.forEach((s) => {
      allExpanded[s.skill_set_id] = true;
    });
    setExpandedSkills(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSkills({});
  };

  const companyName = selectedSummary?.name || "Company";
  const logoUrl = selectedSummary?.logo_url || "";
  const websiteUrl = selectedSummary?.website_url || "";

  // Bloom 5-col legend definitions
  const bloomLegends = [
    { code: "CU", name: "Conceptual Understanding", range: "Levels 1–2", color: "#3b82f6", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/20", text: "text-[#3b82f6]" },
    { code: "AP", name: "Application", range: "Levels 3–4", color: "#22c55e", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/20", text: "text-[#22c55e]" },
    { code: "AS", name: "Analysis", range: "Levels 5–6", color: "#eab308", bg: "bg-[#eab308]/10", border: "border-[#eab308]/20", text: "text-[#a16207]" },
    { code: "EV", name: "Evaluation", range: "Levels 7–8", color: "#ef4444", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/20", text: "text-[#ef4444]" },
    { code: "CR", name: "Creation", range: "Levels 9–10", color: "#a855f7", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20", text: "text-[#a855f7]" },
  ];

  // Criticality 3-card definitions
  const criticalityCards = [
    {
      title: "Critical Skills",
      threshold: "Score ≥ 7 / 10",
      description: "Non-negotiable benchmarks tested intensely in technical rounds & interviews.",
      badge: "border-red-200 bg-red-50 text-red-700",
      icon: AlertCircle,
    },
    {
      title: "Important Skills",
      threshold: "Score 5–6 / 10",
      description: "Key differentiating competencies expected for competitive placement standing.",
      badge: "border-amber-200 bg-amber-50 text-amber-800",
      icon: ShieldCheck,
    },
    {
      title: "Baseline Skills",
      threshold: "Score 1–4 / 10",
      description: "Foundational prerequisites and introductory domain familiarity.",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      icon: CircleDot,
    },
  ];

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* Header: Company logo + "{Company} Skill Intelligence" */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <CompanyLogo
              name={companyName}
              logoUrl={logoUrl}
              websiteUrl={websiteUrl}
              sizeClassName="w-12 h-12"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {companyName} Skill Intelligence
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Target competency matrix & Bloom's cognitive taxonomy benchmarks for campus placement
              </p>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Expand All Roadmaps
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error State */}
        {isError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>Failed to fetch skill requirements for {companyName}. Check your network or Supabase settings.</span>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Bloom 5-col Legend */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bloom's Cognitive Taxonomy Ladder
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {bloomLegends.map((item) => (
              <div
                key={item.code}
                className={cn(
                  "p-2.5 rounded-lg border flex flex-col justify-between transition-colors",
                  item.bg,
                  item.border
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-black px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.code}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 tabular-nums">
                    {item.range}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Criticality 3-card Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {criticalityCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-slate-500" />
                      {card.title}
                    </span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", card.badge)}>
                      {card.threshold}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-16" />
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="h-4 bg-slate-100 rounded w-24 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Skill Cards Sorted Descending */}
        {!isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Required Skill Hierarchy ({sortedSkills.length} Core Areas)
              </h2>
              <span className="text-xs text-slate-500">Sorted by target competency requirement</span>
            </div>

            {sortedSkills.map((skill) => {
              const isExpanded = !!expandedSkills[skill.skill_set_id];
              const topics = topicsMap[skill.skill_set_id] || [];

              // Criticality badge classes
              const critBadgeClass =
                skill.criticality === "Critical"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : skill.criticality === "Important"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <div
                  key={skill.skill_set_id}
                  className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                >
                  {/* Main Card Summary Row */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: skill.bloom_color }}
                        >
                          {skill.bloom_level}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {skill.skill_set_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>Target: {skill.required_proficiency}</span>
                            <span>·</span>
                            <span>{skill.bloom_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-md border", critBadgeClass)}>
                          {skill.criticality}
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md">
                          <span className="text-xs font-black text-slate-900 tabular-nums">
                            {skill.required_level}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">/ 10</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Progression ladder to level {skill.required_level}</span>
                        <span className="tabular-nums font-semibold" style={{ color: skill.bloom_color }}>
                          {skill.required_level * 10}% Target
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${skill.required_level * 10}%`,
                            backgroundColor: skill.bloom_color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Toggle button for 10-level roadmap */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => toggleExpand(skill.skill_set_id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <span>{isExpanded ? "Hide 10-Level Roadmap" : "View 10-Level Roadmap"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-[11px] text-slate-400">
                        {isExpanded ? `${topics.length} milestone topics` : "Click to view milestones"}
                      </span>
                    </div>
                  </div>

                  {/* Expandable 10-Level Roadmap */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-200 px-4 sm:px-6 py-4">
                      <div className="max-w-4xl mx-auto space-y-2">
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                          Curriculum & Topic Milestones (Level 1 to 10)
                        </div>

                        {topics.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">
                            No milestone topics registered for this skill ladder.
                          </p>
                        ) : (
                          topics.map((t) => {
                            const isUnlocked = t.level_number <= skill.required_level;
                            const isTargetEdge = t.level_number === skill.required_level;

                            return (
                              <div
                                key={t.level_number}
                                className={cn(
                                  "flex items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg border text-xs transition-colors",
                                  isUnlocked
                                    ? isTargetEdge
                                      ? "bg-white border-blue-300 shadow-2xs"
                                      : "bg-white/90 border-slate-200"
                                    : "bg-slate-100/60 border-slate-200/70 text-slate-400"
                                )}
                              >
                                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                                  {/* Level Badge */}
                                  <span
                                    className={cn(
                                      "w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 tabular-nums",
                                      isUnlocked
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-200 text-slate-500"
                                    )}
                                  >
                                    {t.level_number}
                                  </span>

                                  {/* Topic Text */}
                                  <p
                                    className={cn(
                                      "text-xs leading-normal font-medium",
                                      isUnlocked ? "text-slate-800" : "text-slate-400 line-through/none"
                                    )}
                                  >
                                    {t.topic}
                                  </p>
                                </div>

                                {/* Status indicator */}
                                <div className="shrink-0 flex items-center gap-1.5 ml-2">
                                  {isUnlocked ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Required</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-200/70 border border-slate-300/60 px-2 py-0.5 rounded">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      <span>Beyond scope</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
