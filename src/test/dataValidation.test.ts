import { describe, it, expect } from "vitest";
import {
  performFullDataAudit,
  registerUploadedRecord,
} from "../server/dataValidator";

describe("Data Quality & Institutional Seed Audit Engine", () => {
  it("executes full data audit and returns structured compliance report", () => {
    const report = performFullDataAudit();

    expect(report).toBeDefined();
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(report.totalAudited).toBeGreaterThan(0);
    expect(report.datasetBreakdowns.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(report.findings)).toBe(true);
  });

  it("differentiates institutional seed data from user-uploaded session records", () => {
    const reportBefore = performFullDataAudit();
    const initialUploads = reportBefore.dataSeparation.userUploadedCount;

    registerUploadedRecord({
      id: "TEST-UPLOAD-1",
      fileName: "student_resume_2025.pdf",
      type: "resume",
      charCount: 1450,
    });

    const reportAfter = performFullDataAudit();
    expect(reportAfter.dataSeparation.userUploadedCount).toBe(initialUploads + 1);
    expect(reportAfter.dataSeparation.institutionalSeedCount).toBeGreaterThan(0);
  });

  it("validates mandatory fields and rule violations with actionable recommendations", () => {
    const report = performFullDataAudit();
    for (const finding of report.findings) {
      expect(finding.id).toBeDefined();
      expect(finding.ruleId).toBeDefined();
      expect(["error", "warning", "info"]).toContain(finding.severity);
      expect(finding.recommendation.length).toBeGreaterThan(0);
    }
  });
});
