import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { isNullish, type CompanySummary } from "../../lib/companyData";
import { useCompany } from "../../context/CompanyContext";
import { cn } from "../../lib/utils";

interface CompanyCardProps {
  company: CompanySummary;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Super Dream": { bg: "bg-[#7c3aed]/10", text: "text-[#7c3aed]", border: "border-[#7c3aed]/25" },
  Dream: { bg: "bg-[#2563eb]/10", text: "text-[#2563eb]", border: "border-[#2563eb]/25" },
  Standard: { bg: "bg-[#16a34a]/10", text: "text-[#16a34a]", border: "border-[#16a34a]/25" },
  Regular: { bg: "bg-[#d97706]/10", text: "text-[#d97706]", border: "border-[#d97706]/25" },
  Unclassified: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

export const CompanyCard: React.FC<CompanyCardProps> = React.memo(({ company }) => {
  const navigate = useNavigate();
  const { setSelectedCompany } = useCompany();

  const handleClick = () => {
    // 1. Save selected-company to localStorage and update context
    setSelectedCompany(company);

    // 2. Navigate to /company/intelligence
    navigate("/company/intelligence");
  };

  const categoryStyle = CATEGORY_STYLES[company.company_type] || CATEGORY_STYLES.Unclassified;
  const isNegativeGrowth = company.yoy_growth_rate.trim().startsWith("-");
  const isGrowthEmpty = isNullish(company.yoy_growth_rate);
  const isHqEmpty = isNullish(company.headquarters_address);
  const isSizeEmpty = isNullish(company.employee_size);

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group relative bg-white border border-slate-200/90 hover:border-blue-400 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div>
        {/* Top Header Row: Logo & Category Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logo_url}
            websiteUrl={company.website_url}
            sizeClassName="w-12 h-12"
          />
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-md border shrink-0",
              categoryStyle.bg,
              categoryStyle.text,
              categoryStyle.border
            )}
          >
            {company.company_type}
          </span>
        </div>

        {/* Company Name & Short Name */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {company.name}
        </h3>
        <p className="text-xs text-slate-500 mb-4 line-clamp-1">{company.short_name}</p>

        {/* Key Metrics / Highlights */}
        <div className="space-y-2 text-xs text-slate-600">
          {/* Headquarters */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className={cn("truncate", isHqEmpty && "italic text-slate-400")}>
              {isHqEmpty ? "not publicly available" : company.headquarters_address}
            </span>
          </div>

          {/* Size */}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className={cn("truncate", isSizeEmpty && "italic text-slate-400")}>
              {isSizeEmpty ? "not publicly available" : company.employee_size}
            </span>
          </div>

          {/* YoY Growth Rate */}
          <div className="flex items-center gap-2">
            {isGrowthEmpty ? (
              <TrendingUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : isNegativeGrowth ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span
              className={cn(
                "tabular-nums font-medium",
                isGrowthEmpty && "italic text-slate-400 font-normal",
                !isGrowthEmpty && (isNegativeGrowth ? "text-red-600" : "text-emerald-700")
              )}
            >
              {isGrowthEmpty ? "not publicly available" : `${company.yoy_growth_rate} YoY`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600">
        <span>Research Profile</span>
        <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
});

CompanyCard.displayName = "CompanyCard";
