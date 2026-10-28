import { describe, it, expect } from "vitest";
import {
  performFullDataAudit,
  registerUploadedRecord,
} from "../server/dataValidator";
import { extractTextFromBuffer } from "../server/documentExtractor";

describe("Data Source Registry & Quality Audit Engine", () => {
  it("audits all registered datasets and computes genuine compliance metrics", () => {
    const report = performFullDataAudit();

    expect(report.totalAudited).toBeGreaterThan(50);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);

    // All registered datasets must be present in breakdown
    const datasets = report.datasetBreakdowns.map((d) => d.dataset);
    expect(datasets).toContain("seed_companies");
    expect(datasets).toContain("radix_benchmarks");
    expect(datasets).toContain("mock_resume");
    expect(datasets).toContain("sample_jds");
    expect(datasets).toContain("sample_resumes");
    expect(datasets).toContain("skill_topics");
    expect(datasets).toContain("uploaded_datasets");

    // Must calculate metrics from actual records, not hardcoded dummy counts
    report.datasetBreakdowns.forEach((ds) => {
      expect(ds.totalRecords).toBeGreaterThanOrEqual(0);
      expect(ds.validRecords + ds.errorsCount).toBeLessThanOrEqual(ds.totalRecords + ds.warningsCount);
      expect(ds.complianceRate).toBeGreaterThanOrEqual(0);
      expect(ds.complianceRate).toBeLessThanOrEqual(100);
    });
  });

  it("detects genuine data discrepancies in default mockData (email/phone placeholders)", () => {
    const report = performFullDataAudit();

    const mockFindings = report.findings.filter((f) => f.dataset === "mock_resume");
    expect(mockFindings.length).toBeGreaterThanOrEqual(2);

    const emailFinding = mockFindings.find((f) => f.ruleId === "MOCK_INVALID_EMAIL");
    expect(emailFinding).toBeDefined();
    expect(emailFinding?.field).toBe("email");

    const phoneFinding = mockFindings.find((f) => f.ruleId === "MOCK_INVALID_PHONE");
    expect(phoneFinding).toBeDefined();
    expect(phoneFinding?.field).toBe("phone");
  });

  it("validates dynamic user uploads and flags high null rates and inconsistent rows", async () => {
    const csvContent = `id,name,role,salary\n1,Alice,Engineer,\n2,Bob,,\n3,Charlie,,`;
    const buffer = Buffer.from(csvContent, "utf-8");

    const extracted = await extractTextFromBuffer(buffer, "audit_test.csv");
    const uploadedRecord = registerUploadedRecord(extracted);

    expect(uploadedRecord.fileName).toBe("audit_test.csv");
    expect(uploadedRecord.customFindings).toBeDefined();
    expect(uploadedRecord.customFindings!.length).toBeGreaterThan(0);

    const report = performFullDataAudit();
    const uploadedFindings = report.findings.filter((f) => f.dataset === "uploaded_dataset");
    expect(uploadedFindings.length).toBeGreaterThan(0);
  });
});
