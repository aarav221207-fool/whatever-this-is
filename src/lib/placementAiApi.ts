// src/lib/placementAiApi.ts

export interface MaskedAIConfig {
  provider: "gemini" | "openai";
  model: string;
  baseURL: string;
  isKeyConfigured: boolean;
  maskedKey: string;
  isEnvDefault: boolean;
  storageType: "persistent_file" | "environment_variable" | "unconfigured";
  supportedProviders: Array<{
    id: "gemini" | "openai";
    name: string;
    defaultModel: string;
    defaultEndpoint?: string;
  }>;
}

export interface TestConnectionResponse {
  success: boolean;
  latencyMs: number;
  provider: string;
  model: string;
  message: string;
  sampleOutput?: string;
  error?: string;
}

export interface ValidationFinding {
  id: string;
  ruleId: string;
  dataset:
    | "seed_companies"
    | "radix_benchmarks"
    | "sample_jds"
    | "sample_resumes"
    | "mock_resume"
    | "company_skillsets"
    | "skill_topics"
    | "uploaded_dataset";
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  recordId: string | number;
  field?: string;
  recommendation: string;
}

export interface DatasetStats {
  dataset: string;
  displayName: string;
  totalRecords: number;
  validRecords: number;
  warningsCount: number;
  errorsCount: number;
  complianceRate: number;
  description: string;
}

export interface ValidationReport {
  timestamp: string;
  overallScore: number;
  totalAudited: number;
  totalValid: number;
  totalWarnings: number;
  totalErrors: number;
  datasetBreakdowns: DatasetStats[];
  findings: ValidationFinding[];
  dataSeparation: {
    institutionalSeedCount: number;
    userUploadedCount: number;
    description: string;
  };
}

export interface UploadedRecordItem {
  id: string;
  fileName: string;
  fileType: string;
  timestamp: string;
  charCount: number;
  rowCount?: number;
  columnCount?: number;
  headers?: string[];
  samplePreview?: any;
  customFindings?: ValidationFinding[];
  complianceScore?: number;
}

export interface PipelineExecutionResult {
  runId: string;
  timestamp: string;
  targetCompany: string;
  role: string;
  analysisType: "comprehensive_placement" | "interview_strategy" | "skill_gap_analysis" | "eligibility_audit";
  totalDurationMs: number;
  stages: Array<{
    stage: number;
    name: string;
    status: "success" | "warning" | "error" | "skipped";
    durationMs: number;
    details: string;
  }>;
  providerUsed: string;
  modelUsed: string;
  finalStatus: "success" | "failed" | "fallback";
  isFallback: boolean;
  fallbackReason?: string;
  errorMessage?: string;
  output?: {
    executive_summary: string;
    readiness_rating: "High Match" | "Moderate Match" | "Preparation Required";
    readiness_score: number;
    strengths: string[];
    gap_analysis: Array<{
      category: string;
      current_state: string;
      required_benchmark: string;
      recommended_action: string;
    }>;
    interview_strategy: {
      technical_round_focus: string[];
      system_design_or_coding_topics: string[];
      managerial_hr_talking_points: string[];
    };
    actionable_roadmap_30_days: string[];
  };
  rawInputSnippet?: string;
  recordsProcessed?: number;
}

export interface SystemHealthStatus {
  status: string;
  server_name: string;
  environment: string;
  uptime_seconds: number;
  timestamp: string;
  memory: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  ai_provider: {
    provider: string;
    model: string;
    is_configured: boolean;
    masked_key: string;
    storage_type?: string;
  };
  data_validation: {
    overall_score: number;
    total_records_audited: number;
    valid_records: number;
    warnings: number;
    errors: number;
  };
  document_extractor: {
    supported_formats: string[];
    max_upload_size_bytes: number;
    status: string;
  };
  endpoints: Array<{ path: string; method: string; status: string }>;
}

// -------------------------------------------------------------
// AI Configuration Endpoints
// -------------------------------------------------------------
export async function getAIConfig(): Promise<MaskedAIConfig> {
  const res = await fetch("/api/v1/ai/config");
  if (!res.ok) throw new Error(`Failed to load AI config: HTTP ${res.status}`);
  return res.json();
}

export async function saveAIConfig(params: {
  provider: "gemini" | "openai";
  apiKey?: string;
  baseURL?: string;
  model?: string;
}): Promise<{ success: boolean; config: MaskedAIConfig }> {
  const res = await fetch("/api/v1/ai/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to save AI config" }));
    throw new Error(err.error || "Failed to save AI config");
  }
  return res.json();
}

export async function replaceAIKey(apiKey: string): Promise<{ success: boolean; message: string; config: MaskedAIConfig }> {
  const res = await fetch("/api/v1/ai/replace-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to replace API Key" }));
    throw new Error(err.error || "Failed to replace API Key");
  }
  return res.json();
}

export async function removeAIConfig(): Promise<{ success: boolean; message: string; config: MaskedAIConfig }> {
  const res = await fetch("/api/v1/ai/remove-config", {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to remove AI configuration" }));
    throw new Error(err.error || "Failed to remove AI configuration");
  }
  return res.json();
}

export async function testAIConnection(): Promise<TestConnectionResponse> {
  const res = await fetch("/api/v1/ai/test-connection", { method: "POST" });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Connection test failed");
  }
  return data;
}

export async function getAvailableModels(): Promise<{ models: string[]; provider: string }> {
  const res = await fetch("/api/v1/ai/models");
  if (!res.ok) throw new Error("Failed to load models");
  return res.json();
}

// -------------------------------------------------------------
// Data Quality & Validation
// -------------------------------------------------------------
export async function getValidationReport(): Promise<ValidationReport> {
  const res = await fetch("/api/v1/data/validation-report");
  if (!res.ok) throw new Error("Failed to load validation report");
  return res.json();
}

export async function revalidateData(): Promise<ValidationReport> {
  const res = await fetch("/api/v1/data/revalidate", { method: "POST" });
  if (!res.ok) throw new Error("Failed to revalidate data");
  const data = await res.json();
  return data.report;
}

export async function validateUploadedFile(file: File): Promise<{
  success: boolean;
  file: UploadedRecordItem;
  overallReport: ValidationReport;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/v1/data/validate-file", {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to validate file (${res.status})`);
  }
  return data;
}

export async function getUploadedRecords(): Promise<{ uploads: UploadedRecordItem[]; total: number }> {
  const res = await fetch("/api/v1/data/uploads");
  if (!res.ok) throw new Error("Failed to load uploaded records");
  return res.json();
}

// -------------------------------------------------------------
// AI Placement Pipeline
// -------------------------------------------------------------
export async function runPlacementPipeline(params: {
  targetCompany: string;
  roleTitle?: string;
  rawText?: string;
  analysisType?: PipelineExecutionResult["analysisType"];
  allowFallback?: boolean;
}): Promise<PipelineExecutionResult> {
  const res = await fetch("/api/v1/pipeline/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Pipeline run failed" }));
    throw new Error(err.error || "Pipeline run failed");
  }
  return res.json();
}

export async function getPipelineHistory(): Promise<{ runs: PipelineExecutionResult[]; total: number }> {
  const res = await fetch("/api/v1/pipeline/history");
  if (!res.ok) throw new Error("Failed to load pipeline history");
  return res.json();
}

// -------------------------------------------------------------
// System Health
// -------------------------------------------------------------
export async function getSystemHealth(): Promise<SystemHealthStatus> {
  const res = await fetch("/api/v1/system/status");
  if (!res.ok) throw new Error("Failed to load system health");
  return res.json();
}
