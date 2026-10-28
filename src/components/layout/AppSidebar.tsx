import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Sparkles,
  ArrowLeft,
  FileText,
  FileCode,
  UserCheck,
  Target,
  GitCompare,
  Layers,
  LayoutDashboard,
  ShieldAlert,
  Cpu,
  Activity,
} from "lucide-react";
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

  const radixNavItems = [
    {
      name: "Role 1: JD Analytics",
      path: "/jd-analytics",
      icon: FileText,
      badge: "Role 1",
    },
    {
      name: "Role 2: Resume Parser",
      path: "/resume-parser",
      icon: FileCode,
      badge: "Role 2",
    },
    {
      name: "Role 3: Profile Builder",
      path: "/profile-builder",
      icon: UserCheck,
      badge: "Role 3",
    },
    {
      name: "Role 4: Talent Check",
      path: "/talent-check",
      icon: Target,
      badge: "Role 4",
    },
    {
      name: "Role 5: Skill Matcher",
      path: "/skill-matching",
      icon: GitCompare,
      badge: "Role 5",
    },
  ];

  const aiGovernanceNavItems = [
    {
      name: "AI Placement Pipeline",
      path: "/ai-pipeline",
      icon: Sparkles,
      badge: "8-Stage",
    },
    {
      name: "Data Quality Audit",
      path: "/data-validation",
      icon: ShieldAlert,
      badge: "Audit",
    },
    {
      name: "AI & LLM Settings",
      path: "/ai-settings",
      icon: Cpu,
      badge: "Config",
    },
    {
      name: "System Health",
      path: "/system-health",
      icon: Activity,
      badge: "Live",
    },
  ];

  const intelligenceNavItems = [
    {
      name: "Company Intelligence",
      path: "/company/intelligence",
      icon: Building2,
      badge: "22 Sec",
    },
    {
      name: "Skill Intelligence",
      path: "/company/skills",
      icon: Layers,
      badge: "Bloom",
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
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Wordmark & Tag */}
        <div className="h-16 border-b border-[#E5E7EB] flex items-center px-4 shrink-0 justify-between bg-white">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600">
                JSS UNIVERSITY NOIDA
              </span>
              <span className="text-xs font-extrabold text-slate-800 tracking-tight leading-tight">
                Placement Intelligence Hub
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

        {/* Selected Company Capsule (if active) */}
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

        {/* Navigation Sections */}
        <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
          {/* Overview link */}
          <div>
            <NavLink
              to="/"
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 group",
                location.pathname === "/"
                  ? "bg-slate-900 text-white"
                  : "text-[#334155] hover:bg-slate-100/80 hover:text-slate-900"
              )}
              title="Overview"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Portal Dashboard</span>}
            </NavLink>
          </div>

          {/* RADIX Match Suite */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-blue-600">
                RADIX Match Pipeline
              </div>
            )}
            <div className="space-y-0.5">
              {radixNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-[#334155] hover:bg-slate-100 hover:text-slate-900"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="truncate">{item.name}</span>
                      </div>
                    )}
                    {!collapsed && isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Company Placement Intelligence */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Company Intelligence
              </div>
            )}
            <div className="space-y-0.5">
              {intelligenceNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-[#334155] hover:bg-slate-100 hover:text-slate-900"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{item.name}</span>
                      </div>
                    )}
                    {!collapsed && isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* AI & Placement Governance Suite */}
          <div>
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-purple-600">
                AI & Quality Governance
              </div>
            )}
            <div className="space-y-0.5">
              {aiGovernanceNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group",
                      isActive
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-[#334155] hover:bg-slate-100 hover:text-slate-900"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-purple-600" : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{item.name}</span>
                      </div>
                    )}
                    {!collapsed && isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC]">
          <NavLink
            to="/"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all",
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
