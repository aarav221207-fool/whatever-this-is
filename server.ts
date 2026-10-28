import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import { parseResumeText, parseJDText } from "./src/lib/parserService";
import { evaluateTalentReadiness, COMPANY_BENCHMARKS } from "./src/lib/talentCheckEngine";
import { matchCandidateToJD } from "./src/lib/skillMatchingEngine";
import { adaptResumeResponse, adaptJDResponse } from "./src/lib/radixAdapters";
import {
  extractTextFromBuffer,
  DocumentExtractionError,
  ExtractedDocument,
} from "./src/server/documentExtractor";
import {
  getMaskedConfig,
  updateAIConfig,
  replaceAIKey,
  removeAIConfig,
  testAIConnection,
  getModelList,
  executeAIGeneration,
} from "./src/server/aiProviderService";
import {
  performFullDataAudit,
  registerUploadedRecord,
  getUploadedRecords,
} from "./src/server/dataValidator";
import {
  runPlacementAIPipeline,
  getPipelineHistory,
} from "./src/server/aiPipelineEngine";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const serverStartTime = Date.now();

// Multer in-memory storage (10 MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Body parsers
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// -------------------------------------------------------------
// Health Check Probe
// -------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  const aiConfig = getMaskedConfig();
  res.json({
    status: "ok",
    service: "RADIX Talent Match Gateway",
    timestamp: new Date().toISOString(),
    ai_configured: aiConfig.isKeyConfigured,
    ai_provider: aiConfig.provider,
    supported_formats: [".pdf", ".docx", ".txt", ".csv", ".xlsx", ".json"],
    max_file_size_bytes: 10 * 1024 * 1024,
  });
});

// -------------------------------------------------------------
// Shared Reliable File Processing Endpoint (Priority 1)
// -------------------------------------------------------------
app.post(
  ["/api/v1/documents/extract", "/api/v1/documents/process"],
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "No file uploaded. Please upload a .pdf, .docx, .txt, .csv, .xlsx, or .json file in the 'file' field.",
        });
        return;
      }

      const extracted: ExtractedDocument = await extractTextFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Register uploaded document in quality validation audit registry
      const registered = registerUploadedRecord(extracted);

      res.json({
        success: true,
        file_name: extracted.file_name,
        file_type: extracted.file_type,
        mime_type: extracted.mime_type,
        char_count: extracted.char_count,
        word_count: extracted.word_count,
        text: extracted.text,
        structured_data: extracted.structured_data,
        metadata: extracted.metadata,
        audit_registration: {
          id: registered.id,
          compliance_score: registered.complianceScore,
          warnings: registered.customFindings?.filter((f) => f.severity === "warning").length || 0,
          errors: registered.customFindings?.filter((f) => f.severity === "error").length || 0,
        },
      });
    } catch (err: any) {
      if (err instanceof DocumentExtractionError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message || "Failed to process document" });
      }
    }
  }
);

// -------------------------------------------------------------
// Role 1: JD Analytics API
// -------------------------------------------------------------
app.post(
  "/api/v1/jd-analytics/analyze",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let text = "";
      let fileName = "job_description.txt";

      if (req.file) {
        const extracted = await extractTextFromBuffer(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        text = extracted.text;
        fileName = extracted.file_name;
      } else if (req.body && typeof req.body.text === "string") {
        text = req.body.text;
        fileName = req.body.file_name || fileName;
      } else {
        res.status(400).json({
          error: "Missing Job Description input. Provide a 'file' upload or JSON body with 'text'.",
        });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(422).json({ error: "Job description document contains no readable text." });
        return;
      }

      const result = parseJDText(text, fileName);
      res.json(result);
    } catch (err: any) {
      if (err instanceof DocumentExtractionError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message || "Failed to analyze job description" });
      }
    }
  }
);

app.post("/api/v1/jd-analytics/validate", (req: Request, res: Response): void => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.skills)) {
      res.status(422).json({ valid: false, error: "Payload must contain a 'skills' array" });
      return;
    }
    res.json({ valid: true, payload });
  } catch (err: any) {
    res.status(422).json({ valid: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Role 2: Resume Parser API
// -------------------------------------------------------------
app.post(
  "/api/v1/resume-parser/parse",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let text = "";
      let fileName = "resume.txt";

      if (req.file) {
        const extracted = await extractTextFromBuffer(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        text = extracted.text;
        fileName = extracted.file_name;
      } else if (req.body && typeof req.body.text === "string") {
        text = req.body.text;
        fileName = req.body.file_name || fileName;
      } else {
        res.status(400).json({
          error: "Missing resume input. Provide a 'file' upload or JSON body with 'text'.",
        });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(422).json({ error: "Resume document contains no readable text." });
        return;
      }

      const result = parseResumeText(text, fileName);
      res.json(result);
    } catch (err: any) {
      if (err instanceof DocumentExtractionError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message || "Failed to parse resume" });
      }
    }
  }
);

app.post("/api/v1/resume-parser/validate", (req: Request, res: Response): void => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.skills)) {
      res.status(422).json({ valid: false, error: "Candidate profile must contain a 'skills' array" });
      return;
    }
    res.json({ valid: true, payload });
  } catch (err: any) {
    res.status(422).json({ valid: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Role 4: Talent Check API
// -------------------------------------------------------------
app.get("/api/v1/talent-check/companies", (_req: Request, res: Response): void => {
  res.json({ companies: COMPANY_BENCHMARKS });
});

app.post("/api/v1/talent-check/evaluate", (req: Request, res: Response): void => {
  try {
    const { profile, company_id } = req.body;
    if (!profile || typeof profile !== "object") {
      res.status(400).json({ error: "Missing candidate profile object" });
      return;
    }
    const targetCompanyId = typeof company_id === "number" ? company_id : 1;
    const result = evaluateTalentReadiness(profile, targetCompanyId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to evaluate talent readiness" });
  }
});

// -------------------------------------------------------------
// Role 5: Skill Matching API
// -------------------------------------------------------------
app.post("/api/v1/skill-matching/match", async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate, jd, use_ai } = req.body;
    if (!candidate || !jd) {
      res.status(400).json({ error: "Request body must include both 'candidate' and 'jd' objects" });
      return;
    }
    const adaptedCandidate = adaptResumeResponse(candidate);
    const adaptedJD = adaptJDResponse(jd);
    const matchResult = matchCandidateToJD(adaptedCandidate, adaptedJD);

    if (use_ai) {
      try {
        const aiPrompt = `Candidate: ${adaptedCandidate.name} (${adaptedCandidate.summary})
Target Role: ${adaptedJD.role} at ${adaptedJD.company}
Match Score: ${matchResult.overall_match_score}%
Missing Requirements: ${matchResult.missing_required_skills.join(", ") || "None"}
Matched Skills: ${matchResult.matched_skills.map((s) => s.skill_name).join(", ")}`;

        const analysis = await executeAIGeneration({
          prompt: aiPrompt,
          systemInstruction:
            "You are a technical recruitment assessor for JSS University Noida Placement Cell. Provide a concise 2-3 sentence strategic interview preparation tip focusing on high-probability technical questions for this stack.",
        });

        matchResult.ai_analysis = analysis.trim();
      } catch (aiErr: any) {
        console.warn("[Skill Match] AI advisory note failed:", aiErr.message);
      }
    }

    res.json(matchResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to perform skill matching" });
  }
});

// ==========================================
// AI Provider Configuration & Management Endpoints (Priority 2)
// ==========================================
app.get("/api/v1/ai/config", (_req: Request, res: Response): void => {
  try {
    const masked = getMaskedConfig();
    res.json(masked);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve AI configuration" });
  }
});

app.post("/api/v1/ai/config", (req: Request, res: Response): void => {
  try {
    const { provider, apiKey, baseURL, model } = req.body;
    const updated = updateAIConfig({ provider, apiKey, baseURL, model });
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update AI configuration" });
  }
});

app.post("/api/v1/ai/replace-key", (req: Request, res: Response): void => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string") {
      res.status(400).json({ error: "Missing or invalid 'apiKey' parameter" });
      return;
    }
    const updated = replaceAIKey(apiKey);
    res.json({ success: true, message: "API Key replaced and securely stored.", config: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to replace API Key" });
  }
});

app.post("/api/v1/ai/remove-config", (_req: Request, res: Response): void => {
  try {
    const updated = removeAIConfig();
    res.json({ success: true, message: "AI Configuration and credentials cleared.", config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove AI configuration" });
  }
});

app.post("/api/v1/ai/test-connection", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await testAIConnection();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Connection test failed",
    });
  }
});

app.get("/api/v1/ai/models", async (_req: Request, res: Response): Promise<void> => {
  try {
    const modelList = await getModelList();
    res.json(modelList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch model catalog" });
  }
});

// ==========================================
// Data Quality & Validation Registry Endpoints (Priority 4)
// ==========================================
app.get("/api/v1/data/validation-report", (_req: Request, res: Response): void => {
  try {
    const report = performFullDataAudit();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to perform data quality audit" });
  }
});

app.post("/api/v1/data/revalidate", (_req: Request, res: Response): void => {
  try {
    const report = performFullDataAudit();
    res.json({ success: true, message: "Data validation completed", report });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to revalidate data" });
  }
});

app.post(
  "/api/v1/data/validate-file",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded for validation audit." });
        return;
      }

      const extracted = await extractTextFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const registered = registerUploadedRecord(extracted);
      const overallReport = performFullDataAudit();

      res.json({
        success: true,
        file: registered,
        overallReport,
      });
    } catch (err: any) {
      if (err instanceof DocumentExtractionError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message || "File validation failed" });
      }
    }
  }
);

app.get("/api/v1/data/uploads", (_req: Request, res: Response): void => {
  try {
    const records = getUploadedRecords();
    res.json({ uploads: records, total: records.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch uploaded records" });
  }
});

// ==========================================
// AI Placement Intelligence Pipeline Endpoints (Priority 3)
// ==========================================
app.post("/api/v1/pipeline/run", async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetCompany, roleTitle, rawText, analysisType, allowFallback } = req.body;
    const result = await runPlacementAIPipeline({
      targetCompany,
      roleTitle,
      rawText,
      analysisType,
      allowFallback,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Placement pipeline execution failed" });
  }
});

app.get("/api/v1/pipeline/history", (_req: Request, res: Response): void => {
  try {
    const history = getPipelineHistory();
    res.json({ runs: history, total: history.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve pipeline history" });
  }
});

// ==========================================
// System Observability & Telemetry Endpoints
// ==========================================
app.get("/api/v1/system/status", (_req: Request, res: Response): void => {
  try {
    const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000);
    const mem = process.memoryUsage();
    const aiConfig = getMaskedConfig();
    const audit = performFullDataAudit();

    res.json({
      status: "operational",
      server_name: "JSS University Noida Placement Gateway",
      environment: process.env.NODE_ENV || "development",
      uptime_seconds: uptimeSec,
      timestamp: new Date().toISOString(),
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      ai_provider: {
        provider: aiConfig.provider,
        model: aiConfig.model,
        is_configured: aiConfig.isKeyConfigured,
        masked_key: aiConfig.maskedKey,
        storage_type: aiConfig.storageType,
      },
      data_validation: {
        overall_score: audit.overallScore,
        total_records_audited: audit.totalAudited,
        valid_records: audit.totalValid,
        warnings: audit.totalWarnings,
        errors: audit.totalErrors,
      },
      document_extractor: {
        supported_formats: ["CSV", "XLSX", "JSON", "TXT", "PDF", "DOCX"],
        max_upload_size_bytes: 10 * 1024 * 1024,
        status: "active",
      },
      endpoints: [
        { path: "/api/health", method: "GET", status: "200 OK" },
        { path: "/api/v1/documents/process", method: "POST", status: "Active (CSV/XLSX/JSON/PDF/DOCX/TXT)" },
        { path: "/api/v1/jd-analytics/analyze", method: "POST", status: "Active" },
        { path: "/api/v1/resume-parser/parse", method: "POST", status: "Active" },
        { path: "/api/v1/talent-check/evaluate", method: "POST", status: "Active" },
        { path: "/api/v1/skill-matching/match", method: "POST", status: "Active" },
        { path: "/api/v1/data/validation-report", method: "GET", status: "Active" },
        { path: "/api/v1/data/validate-file", method: "POST", status: "Active" },
        { path: "/api/v1/pipeline/run", method: "POST", status: "Active" },
        { path: "/api/v1/ai/config", method: "GET/POST", status: "Active" },
        { path: "/api/v1/ai/replace-key", method: "POST", status: "Active" },
        { path: "/api/v1/ai/remove-config", method: "POST", status: "Active" },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to compile system health metrics" });
  }
});

// Error handling middleware for Multer
app.use((err: any, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File size exceeds the maximum limit of 10 MB." });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  next(err);
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), HOST, () => {
    console.log(`RADIX Talent Match server running on http://${HOST}:${PORT}`);
  });
}

startServer();
