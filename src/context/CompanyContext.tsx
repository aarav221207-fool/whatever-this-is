import React, { createContext, useContext, useState, useEffect } from "react";
import { SEED_COMPANIES, type RawCompanySeed } from "../data/seedCompanies";
import {
  normalizeCompanySummary,
  type CompanySummary,
} from "../lib/companyData";

interface PersistedCompanyState {
  companyId: number;
  companyName: string;
  logoUrl: string;
}

interface CompanyContextType {
  selectedCompanyId: number;
  selectedSummary: CompanySummary | null;
  setSelectedCompany: (summary: CompanySummary) => void;
  setSelectedCompanyById: (id: number) => void;
  isLoaded: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "selected-company";

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(1);
  const [selectedSummary, setSelectedSummary] = useState<CompanySummary | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize from localStorage or default to the first seed company
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: PersistedCompanyState = JSON.parse(stored);
        if (parsed && typeof parsed.companyId === "number") {
          setSelectedCompanyId(parsed.companyId);
          // If in seed, pre-populate summary for immediate render
          const seedMatch = SEED_COMPANIES.find((c) => c.company_id === parsed.companyId);
          if (seedMatch) {
            setSelectedSummary(
              normalizeCompanySummary(seedMatch.short_json, seedMatch.company_id)
            );
          } else {
            setSelectedSummary({
              id: parsed.companyId,
              name: parsed.companyName || "Company",
              short_name: parsed.companyName || "Company",
              logo_url: parsed.logoUrl || "",
              category: "Enterprise",
              company_type: "Dream",
              incorporation_year: "Not Available",
              employee_size: "Not Available",
              headquarters_address: "Not Available",
              operating_countries: "Not Available",
              office_locations: "Not Available",
              yoy_growth_rate: "N/A",
              website_url: "",
            });
          }
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to read selected-company from localStorage", e);
    }

    // Default to first seed company
    if (SEED_COMPANIES.length > 0) {
      const first = SEED_COMPANIES[0];
      setSelectedCompanyId(first.company_id);
      setSelectedSummary(normalizeCompanySummary(first.short_json, first.company_id));
      const toPersist: PersistedCompanyState = {
        companyId: first.company_id,
        companyName: first.short_json.name,
        logoUrl: first.short_json.logo_url,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toPersist));
      } catch (e) {
        console.warn("Failed to save default selected-company", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const setSelectedCompany = (summary: CompanySummary) => {
    setSelectedCompanyId(summary.id);
    setSelectedSummary(summary);
    const toPersist: PersistedCompanyState = {
      companyId: summary.id,
      companyName: summary.name,
      logoUrl: summary.logo_url,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.warn("Failed to persist selected-company to localStorage", e);
    }
  };

  const setSelectedCompanyById = (id: number) => {
    setSelectedCompanyId(id);
    const seedMatch = SEED_COMPANIES.find((c) => c.company_id === id);
    if (seedMatch) {
      const summary = normalizeCompanySummary(seedMatch.short_json, seedMatch.company_id);
      setSelectedSummary(summary);
      const toPersist: PersistedCompanyState = {
        companyId: summary.id,
        companyName: summary.name,
        logoUrl: summary.logo_url,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toPersist));
      } catch (e) {
        console.warn("Failed to persist selected-company to localStorage", e);
      }
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        selectedSummary,
        setSelectedCompany,
        setSelectedCompanyById,
        isLoaded,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
