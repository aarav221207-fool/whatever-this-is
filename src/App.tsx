import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/common/TooltipProvider";
import { CompanyProvider } from "./context/CompanyContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Index } from "./pages/Index";
import { CompanyIntelligence } from "./pages/CompanyIntelligence";
import { SkillIntelligence } from "./pages/SkillIntelligence";
import { JobDescriptionAnalytics } from "./pages/JobDescriptionAnalytics";
import { ResumeParserPage } from "./pages/ResumeParserPage";
import { ProfileBuilderPage } from "./pages/ProfileBuilderPage";
import { TalentCheckPage } from "./pages/TalentCheckPage";
import { SkillMatchingPage } from "./pages/SkillMatchingPage";
import { AiPipelinePage } from "./pages/AiPipelinePage";
import { DataValidationPage } from "./pages/DataValidationPage";
import { AiSettingsPage } from "./pages/AiSettingsPage";
import { SystemHealthPage } from "./pages/SystemHealthPage";
import { NotFound } from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <CompanyProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 text-sm">
                  Loading RADIX Talent Match...
                </div>
              }
            >
              <Routes>
                {/* Home / Overview */}
                <Route path="/" element={<Index />} />

                {/* All internal application routes with persistent layout & sidebar */}
                <Route element={<AppLayout />}>
                  {/* Role 1: Job Description Analytics */}
                  <Route path="/jd-analytics" element={<JobDescriptionAnalytics />} />

                  {/* Role 2: Resume Parser */}
                  <Route path="/resume-parser" element={<ResumeParserPage />} />

                  {/* Role 3: Profile Builder & Editor */}
                  <Route path="/profile-builder" element={<ProfileBuilderPage />} />

                  {/* Role 4: Target Company Talent Readiness Check */}
                  <Route path="/talent-check" element={<TalentCheckPage />} />

                  {/* Role 5: Deterministic Skill Matching */}
                  <Route path="/skill-matching" element={<SkillMatchingPage />} />

                  {/* Company Placement Intelligence Modules */}
                  <Route path="/company" element={<Navigate to="/company/intelligence" replace />} />
                  <Route path="/company/intelligence" element={<CompanyIntelligence />} />
                  <Route path="/company/skills" element={<SkillIntelligence />} />

                  {/* AI Placement & Institutional Governance */}
                  <Route path="/ai-pipeline" element={<AiPipelinePage />} />
                  <Route path="/data-validation" element={<DataValidationPage />} />
                  <Route path="/ai-settings" element={<AiSettingsPage />} />
                  <Route path="/system-health" element={<SystemHealthPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CompanyProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
