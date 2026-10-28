import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { parseResumeText, parseJDText } from "./src/lib/parserService";
import { matchCandidateToJD } from "./src/lib/skillMatchingEngine";
import { adaptResumeResponse, adaptJDResponse } from "./src/lib/radixAdapters";
import {
  extractTextFromBuffer,
  DocumentExtractionError,
} from "./src/server/documentExtractor";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT || 3000;

// Netlify Functions have a small request payload ceiling; keep uploads safely below it (4 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
});

// Body parsers
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Normalize Netlify's rewritten function paths before matching Express routes.
// Depending on the rewrite/runtime, Express can receive /v1/..., /health, or
// /.netlify/functions/api/v1/... rather than the browser's original /api/... URL.
app.use((req: Request, _res: Response, next: NextFunction) => {
  const functionPrefix = "/.netlify/functions/api";
  if (req.url === functionPrefix) {
    req.url = "/";
  } else if (req.url.startsWith(functionPrefix + "/")) {
    req.url = req.url.slice(functionPrefix.length);
  }

  if (req.path === "/health" || req.path.startsWith("/v1/")) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Initialize Gemini if key exists
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({});
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
  }
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "RADIX Talent Match Gateway",
    timestamp: new Date().toISOString(),
    gemini_enabled: !!process.env.GEMINI_API_KEY,
    supported_formats: [".pdf", ".docx", ".txt"],
    max_file_size_bytes: 4 * 1024 * 1024,
  });
});

/**
 * Common document extraction endpoint:
 * Accepts multipart/form-data with 'file' field (.pdf, .docx, .txt)
 * Returns extracted text, character count, and file type
 */
app.post(
  "/api/v1/documents/extract",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "No file uploaded. Please upload a .pdf, .docx, or .txt file in the 'file' field.",
        });
        return;
      }

      const extracted = await extractTextFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        text: extracted.text,
        file_name: extracted.file_name,
        file_type: extracted.file_type,
        char_count: extracted.char_count,
        word_count: extracted.word_count,
      });
    } catch (err: any) {
      if (err instanceof DocumentExtractionError) {
        res.status(err.statusCode).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message || "Failed to extract document text" });
      }
    }
  }
);

// Role 1: JD Analytics API (supports JSON body or multipart file upload)
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

// Role 2: Resume Parser API (supports JSON body or multipart file upload)
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

// Role 4: Talent Check API. No company-specific scores are returned until
// approved hiring benchmarks are stored in Supabase; bundled fixtures are not
// presented as live institutional criteria.
app.get("/api/v1/talent-check/companies", (_req: Request, res: Response): void => {
  res.json({
    companies: [],
    source: "not_configured",
    message: "No database-backed company hiring benchmarks are configured. Add approved benchmark records before evaluating placement readiness.",
  });
});

app.post("/api/v1/talent-check/evaluate", (_req: Request, res: Response): void => {
  res.status(501).json({
    error: "Company-specific readiness evaluation is unavailable until approved hiring benchmarks are connected to the database.",
    code: "BENCHMARKS_NOT_CONFIGURED",
  });
});

// Role 5: Skill Matching API
app.post("/api/v1/skill-matching/match", async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate, jd } = req.body;
    if (!candidate || !jd) {
      res.status(400).json({ error: "Request body must include both 'candidate' and 'jd' objects" });
      return;
    }
    const adaptedCandidate = adaptResumeResponse(candidate);
    const adaptedJD = adaptJDResponse(jd);
    const matchResult = matchCandidateToJD(adaptedCandidate, adaptedJD);

    // Optional AI enhancement if Gemini is configured
    if (aiClient && req.body.use_ai) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are an elite technical talent assessor. Review this candidate skill match and provide a 2-3 sentence strategic interview preparation tip:
Candidate: ${adaptedCandidate.name} (${adaptedCandidate.summary})
Target Role: ${adaptedJD.role} at ${adaptedJD.company}
Match Score: ${matchResult.overall_match_score}%
Missing Requirements: ${matchResult.missing_required_skills.join(", ") || "None"}
Matched Skills: ${matchResult.matched_skills.map((s) => s.skill_name).join(", ")}`,
        });
        if (response.text) {
          matchResult.ai_analysis = response.text;
        }
      } catch (aiErr) {
        console.warn("Gemini call skipped or failed, using deterministic output:", aiErr);
      }
    }

    res.json(matchResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to perform skill matching" });
  }
});

// Error handling middleware for Multer (e.g. file size limit exceeded)
app.use((err: any, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File size exceeds the 4 MB limit." });
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
      server: { middlewareMode: true },
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

  app.listen(PORT, () => {
    console.log(`RADIX Talent Match server running on http://localhost:${PORT}`);
  });
}

// When imported by a Netlify Function, export the Express app without starting
// a second listener or mounting the Vite development server.
if (!process.env.NETLIFY) {
  startServer();
}
