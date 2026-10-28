import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  runPlacementAIPipeline,
  getPipelineHistory,
  validatePipelineOutput,
  initPipelineHistory,
} from "../server/aiPipelineEngine";
import { removeAIConfig } from "../server/aiProviderService";

describe("AI Pipeline Engine (Strict Execution & Fallback Labeling)", () => {
  const historyPath = path.resolve(process.cwd(), "data/pipeline_history.json");

  it("validates compliant output JSON strictly against the placement schema", () => {
    const validOutput = {
      executive_summary: "Candidate displays strong technical capabilities.",
      readiness_rating: "High Match",
      readiness_score: 88,
      strengths: ["Cloud Architecture", "Python API Design"],
      gap_analysis: [
        {
          category: "System Design",
          current_state: "Basic knowledge",
          required_benchmark: "Advanced caching",
          recommended_action: "Study Redis",
        },
      ],
      interview_strategy: {
        technical_round_focus: ["Live coding"],
        system_design_or_coding_topics: ["Distributed caching"],
        managerial_hr_talking_points: ["Agile leadership"],
      },
      actionable_roadmap_30_days: ["Week 1: LeetCode trees"],
    };

    const check = validatePipelineOutput(validOutput);
    expect(check.valid).toBe(true);
    expect(check.errors.length).toBe(0);
  });

  it("rejects non-compliant schema outputs with clear error messages", () => {
    const invalidOutput = {
      executive_summary: 123, // wrong type
      readiness_rating: "Super Perfect Match", // invalid enum
      readiness_score: 999, // out of bounds
      strengths: [], // empty array
    };

    const check = validatePipelineOutput(invalidOutput);
    expect(check.valid).toBe(false);
    expect(check.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails cleanly without fabricating fake AI output when allowFallback is false", async () => {
    // Ensure no API key so LLM call fails
    removeAIConfig();

    const result = await runPlacementAIPipeline({
      targetCompany: "Google",
      roleTitle: "Site Reliability Engineer",
      allowFallback: false, // Strict mode
    });

    expect(result.finalStatus).toBe("failed");
    expect(result.isFallback).toBe(false);
    expect(result.output).toBeUndefined();
    expect(result.errorMessage).toBeDefined();

    // Stage 6 and 7 should reflect failure
    const stage6 = result.stages.find((s) => s.stage === 6);
    expect(stage6?.status).toBe("error");

    const stage7 = result.stages.find((s) => s.stage === 7);
    expect(stage7?.status).toBe("error");
  });

  it("explicitly labels fallback output when allowFallback is true and LLM fails", async () => {
    removeAIConfig();

    const result = await runPlacementAIPipeline({
      targetCompany: "Microsoft",
      roleTitle: "Azure Solutions Architect",
      allowFallback: true, // Fallback mode
    });

    expect(result.finalStatus).toBe("fallback");
    expect(result.isFallback).toBe(true);
    expect(result.fallbackReason).toBeDefined();
    expect(result.output).toBeDefined();

    // Output must be clearly labeled as fallback, NEVER pretending to be genuine AI
    expect(result.output!.executive_summary).toContain("[DETERMINISTIC FALLBACK]");
  });

  it("persists pipeline history to disk and reloads on startup", async () => {
    const result = await runPlacementAIPipeline({
      targetCompany: "Amazon",
      roleTitle: "Software Development Engineer",
      allowFallback: true,
    });

    expect(fs.existsSync(historyPath)).toBe(true);

    // Verify history reload
    initPipelineHistory();
    const history = getPipelineHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].runId).toBe(result.runId);
  });
});
