import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useCompany } from "../../context/CompanyContext";
import { useCompanies } from "../../lib/companyApi";
import { CompanyLogo } from "../common/CompanyLogo";

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { selectedSummary, selectedCompanyId, setSelectedCompany } = useCompany();
  const { data: allCompanies = [] } = useCompanies();
  const location = useLocation();

  // If no company is selected yet in context, but database companies are loaded, auto-select the first
  useEffect(() => {
    if (!selectedCompanyId && allCompanies.length > 0) {
      setSelectedCompany(allCompanies[0]);
    } else if (
      selectedCompanyId &&
      (!selectedSummary || selectedSummary.id !== selectedCompanyId) &&
      allCompanies.length > 0
    ) {
      const match = allCompanies.find((c) => c.id === selectedCompanyId);
      if (match) {
        setSelectedCompany(match);
      }
    }
  }, [selectedCompanyId, selectedSummary, allCompanies, setSelectedCompany]);

  // Determine current active page label
  const getPageTitle = (pathname: string): string => {
    if (pathname.includes("/jd-analytics")) return "Role 1: JD Analytics";
    if (pathname.includes("/resume-parser")) return "Role 2: Resume Parser";
    if (pathname.includes("/profile-builder")) return "Role 3: Profile Builder";
    if (pathname.includes("/talent-check")) return "Role 4: Talent Check";
    if (pathname.includes("/skill-matching")) return "Role 5: Skill Matcher";
    if (pathname.includes("/skills")) return "Skill Intelligence";
    if (pathname.includes("/intelligence")) return "Company Intelligence";
    return "Placement Intelligence";
  };

  const pageTitle = getPageTitle(location.pathname);
  const isRadixRoute =
    location.pathname.includes("/jd-analytics") ||
    location.pathname.includes("/resume-parser") ||
    location.pathname.includes("/profile-builder") ||
    location.pathname.includes("/talent-check") ||
    location.pathname.includes("/skill-matching");

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-800">
      {/* Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-hidden"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb Trail */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-blue-600 transition-colors shrink-0">
                Portal
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!isRadixRoute && selectedSummary && (
                <>
                  <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-[200px]">
                    {selectedSummary.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </>
              )}
              <span className="text-blue-600 font-bold shrink-0">{pageTitle}</span>
            </nav>
          </div>

          {/* Right Header Zone */}
          <div className="flex items-center gap-2 shrink-0">
            {!isRadixRoute && selectedSummary && (
              <div className="hidden sm:flex items-center gap-2">
                <CompanyLogo
                  name={selectedSummary.name}
                  logoUrl={selectedSummary.logo_url}
                  websiteUrl={selectedSummary.website_url}
                  sizeClassName="w-7 h-7"
                />
                <span className="text-xs font-semibold text-slate-700 max-w-[140px] truncate">
                  {selectedSummary.short_name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {selectedSummary.company_type}
                </span>
              </div>
            )}
            {isRadixRoute && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  12 RADIX Categories Standard
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
