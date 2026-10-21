import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, Sparkles, ArrowLeft, Layers, ChevronRight } from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
import { CompanyLogo } from "../common/CompanyLogo";
import { cn } from "../../lib/utils";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSummary } = useCompany();

  const navItems = [
    {
      name: "Company Intelligence",
      path: "/company/intelligence",
      icon: Building2,
      description: "22 deep corporate sections",
    },
    {
      name: "Skill Intelligence",
      path: "/company/skills",
      icon: Sparkles,
      description: "Bloom's taxonomy & roadmaps",
    },
  ];

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#F8FAFC] border-r border-[#E5E7EB] transition-all duration-300 ease-in-out lg:static",
          collapsed ? "w-20" : "w-64",
          // Mobile state
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Wordmark & Tag */}
        <div className="h-16 border-b border-[#E5E7EB] flex items-center px-4 shrink-0 justify-between">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600">
                JSS · INTELLIGENCE HUB
              </span>
              <span className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                Placement Portal
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-xs font-black text-blue-600 bg-blue-50 p-1.5 rounded">
                JSS
              </span>
            </div>
          )}
        </div>

        {/* Selected Company Capsule */}
        {selectedSummary && (
          <div className="p-3 border-b border-[#E5E7EB] bg-white">
            <div
              onClick={() => {
                navigate("/company/intelligence");
                handleNavClick();
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <CompanyLogo
                name={selectedSummary.name}
                logoUrl={selectedSummary.logo_url}
                websiteUrl={selectedSummary.website_url}
                sizeClassName={collapsed ? "w-8 h-8" : "w-8 h-8"}
              />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedSummary.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {selectedSummary.company_type}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Intelligence Modules
            </div>
          )}

          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#334155] hover:bg-slate-100/80 hover:text-slate-900"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-[#2563EB]" : "text-slate-500 group-hover:text-slate-700"
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{item.name}</span>
                  </div>
                )}
                {!collapsed && isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer: All Companies link (NO user profile, NO logout) */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC]">
          <NavLink
            to="/"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all",
              collapsed && "justify-center"
            )}
            title="All Companies"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-slate-500" />
            {!collapsed && <span>All Companies</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
};
