import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Building, RefreshCw, AlertTriangle } from "lucide-react";
import { CompanyCard } from "../components/common/CompanyCard";
import { useCompanies } from "../lib/companyApi";

type CategoryFilter = "All" | "Super Dream" | "Dream" | "Standard" | "Regular";

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
            <span>Verified Campus Recruitment Intelligence</span>
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
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>Failed to fetch live company listings. Please check network connection or Supabase settings.</span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Retry
            </button>
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
        {!isLoading && filteredCompanies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* Empty State with Reset CTA */}
        {!isLoading && filteredCompanies.length === 0 && (
          <div className="text-center py-16 px-4 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No matching companies found
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              We couldn't find any companies matching your search criteria. Try modifying your keywords or resetting filters.
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
