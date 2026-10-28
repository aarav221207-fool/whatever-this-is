import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Building,
  RefreshCw,
  AlertTriangle,
  FileText,
  FileCode,
  UserCheck,
  Target,
  GitCompare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { CompanyCard } from "../components/common/CompanyCard";
import { useCompanies } from "../lib/companyApi";

type CategoryFilter = "All" | "Super Dream" | "Dream" | "Standard" | "Regular" | "Unclassified";

export const Index: React.FC = () => {
  const { data: allSummaries = [], isLoading, isError, error, refetch } = useCompanies();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");

  // 200ms debounce for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Compute live counts for category filter pills
  const counts = useMemo(() => {
    const countsMap: Record<CategoryFilter, number> = {
      All: allSummaries.length,
      "Super Dream": 0,
      Dream: 0,
      Standard: 0,
      Regular: 0,
      Unclassified: 0,
    };

    allSummaries.forEach((c) => {
      if (countsMap[c.company_type] !== undefined) {
        countsMap[c.company_type]++;
      }
    });

    return countsMap;
  }, [allSummaries]);

  // Filter companies based on debounced search and selected category
  const filteredCompanies = useMemo(() => {
    return allSummaries.filter((company) => {
      // Category filter
      if (selectedCategory !== "All" && company.company_type !== selectedCategory) {
        return false;
      }
      // Search term filter
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const matchesName = company.name.toLowerCase().includes(query);
        const matchesShort = company.short_name.toLowerCase().includes(query);
        const matchesCategory = company.category.toLowerCase().includes(query);
        const matchesHq = company.headquarters_address.toLowerCase().includes(query);
        return matchesName || matchesShort || matchesCategory || matchesHq;
      }
      return true;
    });
  }, [allSummaries, debouncedSearch, selectedCategory]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCategory("All");
  };

  const filterButtons: Array<{
    id: CategoryFilter;
    label: string;
    activeClass: string;
    textClass: string;
    borderClass: string;
  }> = [
    {
      id: "All",
      label: "All",
      activeClass: "bg-slate-900 text-white border-slate-900",
      textClass: "text-slate-700",
      borderClass: "border-slate-200 hover:border-slate-300",
    },
    {
      id: "Super Dream",
      label: "Super Dream",
      activeClass: "bg-[#7c3aed] text-white border-[#7c3aed]",
      textClass: "text-[#7c3aed]",
      borderClass: "border-slate-200 hover:border-[#7c3aed]/40",
    },
    {
      id: "Dream",
      label: "Dream",
      activeClass: "bg-[#2563eb] text-white border-[#2563eb]",
      textClass: "text-[#2563eb]",
      borderClass: "border-slate-200 hover:border-[#2563eb]/40",
    },
    {
      id: "Standard",
      label: "Standard",
      activeClass: "bg-[#16a34a] text-white border-[#16a34a]",
      textClass: "text-[#16a34a]",
      borderClass: "border-slate-200 hover:border-[#16a34a]/40",
    },
    {
      id: "Regular",
      label: "Regular",
      activeClass: "bg-[#d97706] text-white border-[#d97706]",
      textClass: "text-[#d97706]",
      borderClass: "border-slate-200 hover:border-[#d97706]/40",
    },
    {
      id: "Unclassified",
      label: "Unclassified",
      activeClass: "bg-slate-700 text-white border-slate-700",
      textClass: "text-slate-600",
      borderClass: "border-slate-200 hover:border-slate-400",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header Wordmark */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              JSS · INTELLIGENCE PLATFORM
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest hidden sm:inline">
              Campus Placement Portal
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            JSS University Noida
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-4">
            <span>Company Research & Placement Tools</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-glow" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            JSS University Noida Companies Research & Placement Analytics Portal
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 font-normal max-w-2xl mx-auto mb-8">
            Your strategic edge for campus placements
          </p>

          {/* Search bar directly below (200ms debounce + clear X) */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name, sector, domain, or location..."
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-100 transition-all shadow-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* RADIX Talent Match Suite 5-Role Pipeline Grid */}
          <div className="mt-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                  RADIX TALENT MATCH PIPELINE
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Integrated End-to-End Skill Assessment & Placement Intelligence
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                Roles 1–5 Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
              <Link
                to="/jd-analytics"
                className="p-3.5 bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 rounded-xl transition-all group hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700">
                      Role 1
                    </span>
                    <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">JD Analytics</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Ingest JD & extract 12 RADIX categories
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1">
                  Analyze JD <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/resume-parser"
                className="p-3.5 bg-purple-50/60 hover:bg-purple-50 border border-purple-200/80 rounded-xl transition-all group hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-100 text-purple-700">
                      Role 2
                    </span>
                    <FileCode className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Resume Parser</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Extract candidate entities & evidence
                  </p>
                </div>
                <span className="text-[10px] font-bold text-purple-600 mt-2 flex items-center gap-1">
                  Parse Resume <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/profile-builder"
                className="p-3.5 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-all group hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                      Role 3
                    </span>
                    <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Profile Builder</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Curate competencies & export JSON
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                  Edit Profile <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/talent-check"
                className="p-3.5 bg-amber-50/60 hover:bg-amber-50 border border-amber-200/80 rounded-xl transition-all group hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-700">
                      Role 4
                    </span>
                    <Target className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Talent Check</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Evaluate readiness vs. employer bar
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">
                  Check Readiness <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              <Link
                to="/skill-matching"
                className="p-3.5 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl transition-all group hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-700">
                      Role 5
                    </span>
                    <GitCompare className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Skill Matcher</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Candidate vs. JD match & gap roadmap
                  </p>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
                  Match Profile <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Pills with Live Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Filter:
            </span>
            {filterButtons.map((btn) => {
              const isSelected = selectedCategory === btn.id;
              const count = counts[btn.id] || 0;

              return (
                <button
                  key={btn.id}
                  onClick={() => setSelectedCategory(btn.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? btn.activeClass
                      : `bg-white ${btn.textClass} ${btn.borderClass} hover:bg-slate-50`
                  }`}
                >
                  <span>{btn.label}</span>
                  <span
                    className={`tabular-nums text-[11px] px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="tabular-nums font-bold text-slate-800">{filteredCompanies.length}</span> of{" "}
            <span className="tabular-nums font-bold text-slate-800">{allSummaries.length}</span> companies
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="mb-8 p-5 rounded-xl bg-red-50 border border-red-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-900">Database Connection Failed</h3>
                  <p className="text-xs text-red-800 mt-1">
                    {error instanceof Error ? error.message : "Failed to load company records from database."}
                  </p>
                  <p className="text-[11px] text-red-700/80 mt-2">
                    Resolution Checklist for Netlify:
                    <br />• Verify <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> are set in Netlify Site Configuration &gt; Environment Variables.
                    <br />• Trigger a fresh redeploy (Vite bundles environment variables at build time).
                    <br />• Verify <strong>public.companies</strong> exists and its SELECT policy permits the portal to read company records.
                  </p>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors self-start sm:self-auto flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg" />
                  <div className="w-16 h-5 bg-slate-100 rounded-md" />
                </div>
                <div className="h-5 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-slate-100 rounded-md w-full" />
                  <div className="h-3 bg-slate-100 rounded-md w-4/5" />
                  <div className="h-3 bg-slate-100 rounded-md w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Populated Company Grid */}
        {!isLoading && !isError && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* Empty State: Zero database rows returned */}
        {!isLoading && !isError && allSummaries.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No Company Records in Database
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              The database query succeeded, but <code>public.companies</code> returned no visible records. Check that the table contains rows and its Row Level Security policy permits the portal to read them.
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Again</span>
            </button>
          </div>
        )}

        {/* Filter Empty State: Database has rows, but search term filtered them out */}
        {!isLoading && !isError && allSummaries.length > 0 && filteredCompanies.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No matching companies found
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              No records in the database match your search query or filter. Try modifying your search keywords.
            </p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50/50 py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-600">
          JSS University Noida · Companies Research & Placement Analytics Portal
        </p>
        <p className="text-slate-400 text-[11px] mt-1">
          Phase 2 Supabase Data Pipeline · Public Placement Intelligence Hub
        </p>
      </footer>
    </div>
  );
};
