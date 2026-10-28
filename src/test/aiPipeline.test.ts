import { describe, it, expect } from "vitest";
import {
  runPlacementAIPipeline,
  getPipelineHistory,
} from "../server/aiPipelineEngine";

describe("AI Placement Intelligence Pipeline", () => {
  it("executes 8-stage placement assessment pipeline and logs to history", async () => {
    const result = await runPlacementAIPipeline({
      targetCompany: "Accenture",
      roleTitle: "Cloud Engineer",
      analysisType: "comprehensive_placement",
    });

    expect(result).toBeDefined();
    expect(result.runId).toMatch(/^RUN-/);
    expect(result.stages.length).toBe(8);

    // Verify all 8 stages are executed
    const stageNames = result.stages.map((s) => s.name);
    expect(stageNames).toContain("Data Source Ingestion");
    expect(stageNames).toContain("Deterministic Document Parsing");
    expect(stageNames).toContain("RADIX 12 Schema Normalization");
    expect(stageNames).toContain("Pre-Inference Quality Check");
    expect(stageNames).toContain("Context & Prompt Assembly");
    expect(stageNames).toContain("LLM Inference Execution");
    expect(stageNames).toContain("Output Schema Verification");
    expect(stageNames).toContain("Audit Persistence & History");

    // Verify output contract
    expect(result.output.executive_summary).toBeDefined();
    expect(result.output.readiness_score).toBeGreaterThan(0);
    expect(result.output.strengths.length).toBeGreaterThan(0);
    expect(result.output.gap_analysis.length).toBeGreaterThan(0);
    expect(result.output.interview_strategy.technical_round_focus.length).toBeGreaterThan(0);
    expect(result.output.actionable_roadmap_30_days.length).toBeGreaterThan(0);

    // Check history registry
    const history = getPipelineHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].runId).toBe(result.runId);
  }, 20000);
});
