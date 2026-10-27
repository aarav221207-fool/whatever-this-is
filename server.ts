import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { parseResumeText, parseJDText } from "./src/lib/parserService";
import { evaluateTalentReadiness, COMPANY_BENCHMARKS } from "./src/lib/talentCheckEngine";
import { matchCandidateToJD } from "./src/lib/skillMatchingEngine";
import { adaptResumeResponse, adaptJDResponse } from "./src/lib/radixAdapters";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Initialize Gemini if key exists
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({});
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
  }
}

// Health checks
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "RADIX Talent Match Gateway",
    timestamp: new Date().toISOString(),
    gemini_enabled: !!process.env.GEMINI_API_KEY,
  });
});

// Role 1: JD Analytics API
app.post("/api/v1/jd-analytics/analyze", (req: Request, res: Response) => {
  try {
    const { text, file_name } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field in request body" });
      return;
    }
    const result = parseJDText(text, file_name || "job_description.txt");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to analyze job description" });
  }
});

app.post("/api/v1/jd-analytics/validate", (req: Request, res: Response) => {
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

// Role 2: Resume Parser API
app.post("/api/v1/resume-parser/parse", (req: Request, res: Response) => {
  try {
    const { text, file_name } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field in request body" });
      return;
    }
    const result = parseResumeText(text, file_name || "resume.txt");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to parse resume" });
  }
});

app.post("/api/v1/resume-parser/validate", (req: Request, res: Response) => {
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

// Role 4: Talent Check API
app.get("/api/v1/talent-check/companies", (_req: Request, res: Response) => {
  res.json({ companies: COMPANY_BENCHMARKS });
});

app.post("/api/v1/talent-check/evaluate", (req: Request, res: Response) => {
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

// Role 5: Skill Matching API
app.post("/api/v1/skill-matching/match", async (req: Request, res: Response) => {
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
Matche Skills: ${matchResult.matched_skills.map((s) => s.skill_name).join(", ")}`,
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

startServer();
