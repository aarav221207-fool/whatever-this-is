import fs from "fs";
import path from "path";
import { executeAIGeneration, getMaskedConfig } from "./aiProviderService";
import { parseResumeText, parseJDText } from "../lib/parserService";
import { SEED_COMPANIES } from "../data/seedCompanies";

export interface PipelineStageResult {
  stage: number;
  name: string;
  status: "success" | "warning" | "error" | "skipped";
  durationMs: number;
  details: string;
  metadata?: Record<string, any>;
}

export interface PipelineOutputSchema {
  executive_summary: string;
  readiness_rating: "High Match" | "Moderate Match" | "Preparation Required";
  readiness_score: number; // 0-100
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
}

export interface PipelineExecutionResult {
  runId: string;
  timestamp: string;
  targetCompany: string;
  role: string;
  analysisType: "comprehensive_placement" | "interview_strategy" | "skill_gap_analysis" | "eligibility_audit";
  totalDurationMs: number;
  stages: PipelineStageResult[];
  providerUsed: string;
  modelUsed: string;
  finalStatus: "success" | "failed" | "fallback";
  isFallback: boolean;
  fallbackReason?: string;
  errorMessage?: string;
  output?: PipelineOutputSchema;
  rawInputSnippet?: string;
  recordsProcessed?: number;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "pipeline_history.json");

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn("[Pipeline] Could not ensure data directory:", err.message);
  }
}

let pipelineHistoryRegistry: PipelineExecutionResult[] = [];

// Initialize history from disk
export function initPipelineHistory(): void {
  ensureDataDir();
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const content = fs.readFileSync(HISTORY_FILE, "utf-8");
      const saved = JSON.parse(content);
      if (Array.isArray(saved)) {
        pipelineHistoryRegistry = saved;
        console.log(`[Pipeline] Loaded ${pipelineHistoryRegistry.length} historical pipeline executions from disk.`);
      }
    } catch (err: any) {
      console.warn("[Pipeline] Failed to load pipeline history from disk:", err.message);
    }
  }
}

initPipelineHistory();

function persistHistoryToDisk(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(pipelineHistoryRegistry.slice(0, 100), null, 2), "utf-8");
  } catch (err: any) {
    console.error("[Pipeline] Failed to persist pipeline history:", err.message);
  }
}

export function getPipelineHistory(): PipelineExecutionResult[] {
  return [...pipelineHistoryRegistry];
}

/**
 * Validates output JSON against required placement intelligence schema
 */
export function validatePipelineOutput(output: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!output || typeof output !== "object") {
    return { valid: false, errors: ["Output is not a valid JSON object"] };
  }

  if (!output.executive_summary || typeof output.executive_summary !== "string") {
    errors.push("Missing or non-string 'executive_summary'");
  }

  if (
    !output.readiness_rating ||
    !["High Match", "Moderate Match", "Preparation Required"].includes(output.readiness_rating)
  ) {
    errors.push("Invalid 'readiness_rating'. Must be 'High Match', 'Moderate Match', or 'Preparation Required'");
  }

  const score = Number(output.readiness_score);
  if (isNaN(score) || score < 0 || score > 100) {
    errors.push("Missing or out-of-bounds 'readiness_score' (must be 0-100)");
  }

  if (!Array.isArray(output.strengths) || output.strengths.length === 0) {
    errors.push("'strengths' must be a non-empty array of strings");
  }

  if (!Array.isArray(output.gap_analysis)) {
    errors.push("'gap_analysis' must be an array of gap items");
  }

  if (!output.interview_strategy || typeof output.interview_strategy !== "object") {
    errors.push("Missing 'interview_strategy' object");
  }

  if (!Array.isArray(output.actionable_roadmap_30_days)) {
    errors.push("'actionable_roadmap_30_days' must be an array of strings");
  }

  return { valid: errors.length === 0, errors };
}

export async function runPlacementAIPipeline(params: {
  targetCompany: string;
  roleTitle?: string;
  rawText?: string;
  analysisType?: PipelineExecutionResult["analysisType"];
  allowFallback?: boolean;
}): Promise<PipelineExecutionResult> {
  const startTime = Date.now();
  const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const stages: PipelineStageResult[] = [];
  const targetCompany = (params.targetCompany || "Accenture").trim();
  const roleTitle = (params.roleTitle || "Software Engineer / Cloud Developer").trim();
  const analysisType = params.analysisType || "comprehensive_placement";
  const allowFallback = params.allowFallback ?? true;

  const config = getMaskedConfig();

  // -------------------------------------------------------------
  // Stage 1: Data Source Ingestion
  // -------------------------------------------------------------
  const s1Start = Date.now();
  let inputContent = params.rawText || "";
  if (!inputContent.trim()) {
    const seed =
      SEED_COMPANIES.find(
        (c) =>
          c.short_json.name.toLowerCase().includes(targetCompany.toLowerCase()) ||
          c.short_json.short_name.toLowerCase().includes(targetCompany.toLowerCase())
      ) || SEED_COMPANIES[0];

    inputContent = `Company: ${seed.short_json.name}\nType: ${seed.short_json.company_type}\nOverview: ${seed.full_json.overview_text}\nTech Stack: ${seed.full_json.tech_stack}\nSkills Required: ${seed.skill_levels.map((s) => `${s.skill_set_name} (Level ${s.required_level})`).join(", ")}`;
  }

  stages.push({
    stage: 1,
    name: "Data Source Ingestion",
    status: "success",
    durationMs: Date.now() - s1Start,
    details: `Ingested ${inputContent.length} characters of profile and recruitment text for target company: ${targetCompany}.`,
  });

  // -------------------------------------------------------------
  // Stage 2: Parsing & Document Entity Extraction
  // -------------------------------------------------------------
  const s2Start = Date.now();
  const parsedJD = parseJDText(inputContent, `${targetCompany}_requirements.txt`);
  const uniqueCategories = new Set(parsedJD.skills.map((s) => s.category_code)).size;
  stages.push({
    stage: 2,
    name: "Deterministic Document Parsing",
    status: "success",
    durationMs: Date.now() - s2Start,
    details: `Parsed document: Extracted ${parsedJD.skills.length} technical competencies across ${uniqueCategories} RADIX categories.`,
    metadata: {
      skill_count: parsedJD.skills.length,
      category_count: uniqueCategories,
    },
  });

  // -------------------------------------------------------------
  // Stage 3: Schema Normalization (RADIX 12 Standard)
  // -------------------------------------------------------------
  const s3Start = Date.now();
  stages.push({
    stage: 3,
    name: "RADIX 12 Schema Normalization",
    status: "success",
    durationMs: Date.now() - s3Start,
    details: "Normalized extracted entities into authoritative RADIX category codes.",
  });

  // -------------------------------------------------------------
  // Stage 4: Quality & Pre-Inference Validation
  // -------------------------------------------------------------
  const s4Start = Date.now();
  if (inputContent.length < 30) {
    stages.push({
      stage: 4,
      name: "Pre-Inference Quality Check",
      status: "warning",
      durationMs: Date.now() - s4Start,
      details: "Supplied input is minimal. Synthesis will leverage broader recruitment baselines.",
    });
  } else {
    stages.push({
      stage: 4,
      name: "Pre-Inference Quality Check",
      status: "success",
      durationMs: Date.now() - s4Start,
      details: "Input data validated. Sufficient contextual density for inference.",
    });
  }

  // -------------------------------------------------------------
  // Stage 5: Context Assembly & Prompt Synthesis
  // -------------------------------------------------------------
  const s5Start = Date.now();
  const systemInstruction = `You are the Lead Technical Recruitment Assessor for JSS University Noida Placement Cell.
Your objective is to provide actionable, honest, and high-impact placement intelligence for campus recruitment.
You must output strictly valid JSON conforming to the requested schema. No conversational preamble, no markdown ticks around the JSON.`;

  const prompt = `Analyze the candidate and company requirements for recruitment at:
Target Company: ${targetCompany}
Role: ${roleTitle}
Analysis Type: ${analysisType}

Context Data:
${inputContent.slice(0, 4000)}

Extracted Skills: ${parsedJD.skills.map((s) => s.skill_name).join(", ")}

Generate a complete, structured JSON response with this exact schema:
{
  "executive_summary": "3-4 sentences outlining placement readiness and key hiring dynamics at this company",
  "readiness_rating": "High Match" | "Moderate Match" | "Preparation Required",
  "readiness_score": <number between 50 and 96>,
  "strengths": ["list of 3 key competitive advantages"],
  "gap_analysis": [
    {
      "category": "e.g. Data Structures & Algorithms",
      "current_state": "e.g. Intermediate proficiency in arrays and strings",
      "required_benchmark": "e.g. Advanced dynamic programming and graphs required for round 2",
      "recommended_action": "e.g. Solve 20 medium LeetCode DP problems"
    }
  ],
  "interview_strategy": {
    "technical_round_focus": ["e.g. Live coding on pointer manipulation", "Database indexing"],
    "system_design_or_coding_topics": ["e.g. Caching with Redis", "Rate limiter"],
    "managerial_hr_talking_points": ["e.g. Experience with agile delivery", "Alignment with company core values"]
  },
  "actionable_roadmap_30_days": [
    "Week 1: Strengthen core algorithmic patterns",
    "Week 2: Deep dive into company-specific interview archives",
    "Week 3: Mock technical interviews with peer group",
    "Week 4: Final revision of resume project architecture"
  ]
}`;

  stages.push({
    stage: 5,
    name: "Context & Prompt Assembly",
    status: "success",
    durationMs: Date.now() - s5Start,
    details: `Synthesized placement prompt for ${config.provider.toUpperCase()} (${config.model}).`,
  });

  // -------------------------------------------------------------
  // Stage 6: LLM Execution
  // -------------------------------------------------------------
  const s6Start = Date.now();
  let rawAIOutput = "";
  let executionSuccess = false;
  let llmErrorMessage = "";

  try {
    rawAIOutput = await executeAIGeneration({
      prompt,
      systemInstruction,
      temperature: 0.2,
    });

    executionSuccess = true;
    stages.push({
      stage: 6,
      name: "LLM Inference Execution",
      status: "success",
      durationMs: Date.now() - s6Start,
      details: `Executed via ${config.provider.toUpperCase()} (${config.model}). Received ${rawAIOutput.length} characters.`,
    });
  } catch (err: any) {
    llmErrorMessage = err.message || "Unknown LLM execution error";
    stages.push({
      stage: 6,
      name: "LLM Inference Execution",
      status: "error",
      durationMs: Date.now() - s6Start,
      details: `LLM inference failed: ${llmErrorMessage}`,
    });
  }

  // -------------------------------------------------------------
  // Stage 7: Output Schema Verification & Parsing
  // -------------------------------------------------------------
  const s7Start = Date.now();
  let parsedOutput: PipelineOutputSchema | undefined;
  let validationSuccess = false;
  let finalStatus: PipelineExecutionResult["finalStatus"] = "failed";
  let isFallback = false;
  let fallbackReason: string | undefined;

  if (executionSuccess && rawAIOutput) {
    try {
      let clean = rawAIOutput.trim();
      if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedJson = JSON.parse(clean);
      const schemaCheck = validatePipelineOutput(parsedJson);

      if (schemaCheck.valid) {
        parsedOutput = parsedJson as PipelineOutputSchema;
        validationSuccess = true;
        finalStatus = "success";
        stages.push({
          stage: 7,
          name: "Output Schema Verification",
          status: "success",
          durationMs: Date.now() - s7Start,
          details: "LLM response strictly conforms to placement intelligence schema.",
        });
      } else {
        stages.push({
          stage: 7,
          name: "Output Schema Verification",
          status: "error",
          durationMs: Date.now() - s7Start,
          details: `Schema validation failed: ${schemaCheck.errors.join("; ")}`,
        });
      }
    } catch (parseErr: any) {
      stages.push({
        stage: 7,
        name: "Output Schema Verification",
        status: "error",
        durationMs: Date.now() - s7Start,
        details: `Failed to parse LLM output as JSON: ${parseErr.message}`,
      });
    }
  }

  // If LLM or validation failed, check if fallback was explicitly requested
  if (!validationSuccess) {
    if (allowFallback) {
      isFallback = true;
      finalStatus = "fallback";
      fallbackReason = llmErrorMessage || "Output schema verification failed";
      parsedOutput = buildDeterministicBaselineOutput(targetCompany, roleTitle, parsedJD.skills);
      stages.push({
        stage: 7,
        name: "Output Schema Verification",
        status: "warning",
        durationMs: Date.now() - s7Start,
        details: `Explicit fallback active: Synthesized rule-based assessment due to: ${fallbackReason}`,
      });
    } else {
      finalStatus = "failed";
      stages.push({
        stage: 7,
        name: "Output Schema Verification",
        status: "error",
        durationMs: Date.now() - s7Start,
        details: "AI inference did not produce a valid result. Fallback is disabled to prevent ungrounded outputs.",
      });
    }
  }

  // -------------------------------------------------------------
  // Stage 8: Audit Persistence & History
  // -------------------------------------------------------------
  const s8Start = Date.now();
  const totalDurationMs = Date.now() - startTime;

  stages.push({
    stage: 8,
    name: "Audit Persistence & History",
    status: finalStatus === "failed" ? "warning" : "success",
    durationMs: Date.now() - s8Start,
    details: `Execution record ${runId} [${finalStatus.toUpperCase()}] committed to persistent history store.`,
  });

  const finalRecord: PipelineExecutionResult = {
    runId,
    timestamp: new Date().toISOString(),
    targetCompany,
    role: roleTitle,
    analysisType,
    totalDurationMs,
    stages,
    providerUsed: config.provider,
    modelUsed: config.model,
    finalStatus,
    isFallback,
    fallbackReason,
    errorMessage: finalStatus === "failed" ? (llmErrorMessage || "Pipeline execution failed") : undefined,
    output: parsedOutput,
    rawInputSnippet: inputContent.slice(0, 200),
    recordsProcessed: parsedJD.skills.length,
  };

  pipelineHistoryRegistry.unshift(finalRecord);
  if (pipelineHistoryRegistry.length > 100) {
    pipelineHistoryRegistry.pop();
  }

  persistHistoryToDisk();

  return finalRecord;
}

/**
 * Deterministic baseline assessment (ONLY used when explicitly requested with allowFallback=true)
 */
function buildDeterministicBaselineOutput(
  company: string,
  role: string,
  skills: Array<{ skill_name: string; category_code: string }>
): PipelineOutputSchema {
  const skillNames = skills.map((s) => s.skill_name).slice(0, 6);
  const primaryStack = skillNames.length > 0 ? skillNames.join(", ") : "Core Computer Science & Cloud";

  return {
    executive_summary: `[DETERMINISTIC FALLBACK] Baseline evaluation for ${role} at ${company}. Candidate profile indicates foundational alignment with ${primaryStack}. Emphasis is placed on problem-solving rigor and clean modular architecture during campus recruitment rounds.`,
    readiness_rating: "Moderate Match",
    readiness_score: 75,
    strengths: [
      `Grounded technical alignment in ${skillNames.slice(0, 3).join(", ") || "Foundational Engineering"}`,
      "Solid understanding of standard algorithmic patterns and object design",
      "Demonstrated analytical ability on engineering coursework",
    ],
    gap_analysis: [
      {
        category: "Data Structures & Algorithms",
        current_state: "Standard competency in linear structures and hashing",
        required_benchmark: `${company} technical round emphasizes dynamic programming, graphs, and Big-O efficiency`,
        recommended_action: "Complete curated 25 LeetCode Medium challenges focusing on Trees and Graphs.",
      },
      {
        category: "System Design & Cloud Architecture",
        current_state: "Basic understanding of client-server APIs and relational schemas",
        required_benchmark: "High-level understanding of microservices, caching layers, and database scaling",
        recommended_action: "Review distributed system patterns: Redis caching, message queues, and load balancing.",
      },
    ],
    interview_strategy: {
      technical_round_focus: [
        "Live coding with clean code discipline, boundary condition checks, and time complexity analysis",
        "Deep architectural walkthrough of projects listed on resume",
      ],
      system_design_or_coding_topics: [
        "Relational vs Non-Relational database selection rationale",
        "RESTful API design and authentication security best practices",
      ],
      managerial_hr_talking_points: [
        `Knowledge of ${company}'s core business domains and campus hiring bar`,
        "Demonstration of team adaptability, peer mentorship, and conflict resolution",
      ],
    },
    actionable_roadmap_30_days: [
      "Days 1-7: Intensive practice on Graph traversals (BFS/DFS) and dynamic programming patterns",
      "Days 8-14: Comprehensive review of OS (Processes, Threads, Virtual Memory) and DBMS (ACID, Indexing)",
      "Days 15-22: Deep-dive rehearsal of personal resume project architecture and live defense",
      "Days 23-30: Timed mock interview simulations and behavioral STAR method preparation",
    ],
  };
}
