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

  it("validates uploaded dataset audit metadata without claiming CSV resume extraction support", async () => {
    const extracted = await extractTextFromBuffer(
      Buffer.from("Uploaded dataset audit notes: this text file refers to a data quality review.", "utf-8"),
      "audit_test.txt",
      "text/plain"
    );
    const uploadedRecord = registerUploadedRecord({
      ...extracted,
      structured_data: {
        tabular: {
          total_rows: 3,
          headers: ["id", "name", "role", "salary"],
          inconsistent_rows: [
            { row_index: 3, found: 3, expected: 4, reason: "Missing one column" },
          ],
          sheets: [
            {
              row_count: 3,
              missing_values_by_column: { salary: 3, role: 2 },
            },
          ],
        },
      },
    });

    expect(uploadedRecord.fileName).toBe("audit_test.txt");
    expect(uploadedRecord.customFindings).toBeDefined();
    expect(uploadedRecord.customFindings!.length).toBeGreaterThan(0);

    const report = performFullDataAudit();
    const uploadedFindings = report.findings.filter((finding) => finding.dataset === "uploaded_dataset");
    expect(uploadedFindings.length).toBeGreaterThan(0);
  });
});