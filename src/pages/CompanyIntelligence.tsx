import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Globe, Linkedin, ExternalLink, AlertTriangle, RefreshCw, ArrowLeft, Building2 } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { CompanyLogo } from "../components/common/CompanyLogo";
import { FieldRow } from "../components/common/FieldRow";
import {
  buildIntelligenceSections,
  type IntelligenceSection,
} from "../data/intelligenceData";
import { useCompanyProfile, useCompanies } from "../lib/companyApi";
import { cn } from "../lib/utils";

export const CompanyIntelligence: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const { selectedCompanyId, selectedSummary, setSelectedCompany } = useCompany();
  const { data: allCompanies = [] } = useCompanies();

  // Determine active company ID: prioritize URL parameter, then context
  const activeId = urlId && urlId > 0 ? urlId : selectedCompanyId;

  // If no company is selected yet, but real database companies are available, auto-select the first one
  useEffect(() => {
    if (!activeId && allCompanies.length > 0) {
      setSelectedCompany(allCompanies[0]);
    }
  }, [activeId, allCompanies, setSelectedCompany]);

  const {
    data: selectedProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useCompanyProfile(activeId);

  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const isScrollingRef = useRef<boolean>(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Build the 22 intelligence sections from the fetched profile
  const sections: IntelligenceSection[] = useMemo(() => {
    return buildIntelligenceSections(selectedProfile);
  }, [selectedProfile]);

  // Scroll to section with guard
  const scrollToSection = useCallback((index: number) => {
    isScrollingRef.current = true;
    setActiveSectionIndex(index);

    const target = sectionRefs.current[index];
    if (target) {
      const topOffset = 130; // accounts for sticky top info bar + sticky tabs
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    // Auto-center active tab in horizontal scroll container
    tabRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  }, []);

  // Scroll spy setup
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const topOffset = 150;
      const scrollPosition = window.scrollY + topOffset;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[i];
        if (el && el.offsetTop <= scrollPosition) {
          if (activeSectionIndex !== i) {
            setActiveSectionIndex(i);
            tabRefs.current[i]?.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest",
            });
          }
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections.length, activeSectionIndex]);

  const companyName = selectedSummary?.name || selectedProfile?.name || "Company";
  const logoUrl = selectedSummary?.logo_url || "";
  const websiteUrl = selectedSummary?.website_url || selectedProfile?.website_url || "";
  const category = selectedSummary?.category || selectedProfile?.category || "Enterprise";
  const companyType = selectedSummary?.company_type || "Unclassified";
  const hqAddress = selectedSummary?.headquarters_address || selectedProfile?.headquarters_address || "Global";

  return (
    <div className="bg-white min-h-screen">
      {/* Sticky Top Information Bar:
          Left: Company logo, Company name, Industry badge
          Right: Website button, LinkedIn button
          No hero section. No gradient background. */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo
              name={companyName}
              logoUrl={logoUrl}
              websiteUrl={websiteUrl}
              sizeClassName="w-10 h-10 sm:w-11 sm:h-11"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {companyName}
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                  {companyType}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                <span>{category}</span>
                <span>·</span>
                <span>HQ: {hqAddress}</span>
              </p>
            </div>
          </div>

          {/* Right: Website button, LinkedIn button */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedProfile?.website_url && (
              <a
                href={selectedProfile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            {selectedProfile?.linkedin_url && (
              <a
                href={selectedProfile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-300 bg-blue-50/80 text-blue-700 text-xs font-semibold hover:bg-blue-100/70 transition-colors shadow-2xs"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-blue-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar (22 tabs) with scroll-spy + scrollToSection(idx) */}
      <div className="sticky top-[125px] sm:top-[128px] z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto overflow-x-auto no-scrollbar flex items-center gap-1 py-2">
          {sections.map((section, idx) => {
            const isActive = activeSectionIndex === idx;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                onClick={() => scrollToSection(idx)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-400")} />
                <span>{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error State */}
        {isError && (
          <div className="p-5 rounded-xl bg-red-50 border border-red-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-900">Database Query Failed</h3>
                  <p className="text-xs text-red-800 mt-1">
                    {error instanceof Error ? error.message : "Failed to load company profile from Supabase."}
                  </p>
                  <p className="text-[11px] text-red-700/80 mt-1.5">
                    Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are valid, and table <code>companies</code> permits SELECT for the configured Supabase role.
                  </p>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden p-6 space-y-4">
                <div className="h-6 bg-slate-100 rounded w-1/4" />
                <div className="space-y-3 pt-2">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: Profile not found */}
        {!isLoading && !isError && !selectedProfile && (
          <div className="text-center py-16 px-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto my-8">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Company Profile Not Found
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              No company record was found in <code>public.companies</code> for company ID {activeId || "unknown"}.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse All Companies</span>
            </Link>
          </div>
        )}

        {/* Populated 22 Intelligence Sections */}
        {!isLoading &&
          !isError &&
          selectedProfile &&
          sections.map((section, idx) => {
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                ref={(el) => {
                  sectionRefs.current[idx] = el;
                }}
                id={section.id}
                className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs transition-shadow duration-150 hover:shadow-xs scroll-mt-36"
              >
                {/* Section Header */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md tabular-nums">
                    {section.fields.length} data points
                  </span>
                </div>

                {/* Section Field Rows */}
                <div className="px-5 py-2 divide-y divide-slate-100">
                  {section.fields.map((field, fIdx) => (
                    <FieldRow
                      key={fIdx}
                      label={field.label}
                      value={field.value}
                      type={field.type}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
