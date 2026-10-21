import React, { createContext, useContext, useState, useEffect } from "react";
import type { CompanySummary } from "../lib/companyData";

interface PersistedCompanyState {
  companyId: number;
  companyName: string;
  logoUrl: string;
}

interface CompanyContextType {
  selectedCompanyId: number | null;
  selectedSummary: CompanySummary | null;
  setSelectedCompany: (summary: CompanySummary) => void;
  setSelectedCompanyById: (id: number) => void;
  isLoaded: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "selected-company";

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<CompanySummary | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Restore previous selection from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed: PersistedCompanyState = JSON.parse(stored);
        if (parsed && typeof parsed.companyId === "number" && parsed.companyId > 0) {
          setSelectedCompanyId(parsed.companyId);
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
      }
    } catch (e) {
      console.warn("[CompanyContext] Failed to read stored selection from localStorage", e);
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
      console.warn("[CompanyContext] Failed to persist selection to localStorage", e);
    }
  };

  const setSelectedCompanyById = (id: number) => {
    setSelectedCompanyId(id);
    const toPersist: PersistedCompanyState = {
      companyId: id,
      companyName: selectedSummary?.name || "Company",
      logoUrl: selectedSummary?.logo_url || "",
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.warn("[CompanyContext] Failed to persist selection to localStorage", e);
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
