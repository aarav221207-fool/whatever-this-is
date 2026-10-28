import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  extractTextFromBuffer,
  detectFileType,
  DocumentExtractionError,
  MAX_FILE_SIZE,
} from "../server/documentExtractor";

describe("Universal File Processing Service (CSV, XLSX, JSON, TXT, PDF, DOCX)", () => {
  // 1. CSV Tests
  it("parses valid CSV with headers, rows, data types, and missing values", async () => {
    const csvContent = `candidate_name,years_exp,primary_skill,certified\nAnanya Rao,4,Python,true\nKarthik S,,AWS,false\nPriya M,2,,true`;
    const buffer = Buffer.from(csvContent, "utf-8");

    const result = await extractTextFromBuffer(buffer, "candidates.csv");
    expect(result.file_type).toBe("csv");
    expect(result.structured_data?.kind).toBe("tabular");
    expect(result.structured_data?.tabular).toBeDefined();

    const tabular = result.structured_data!.tabular!;
    expect(tabular.headers).toEqual(["candidate_name", "years_exp", "primary_skill", "certified"]);
    expect(tabular.total_rows).toBe(3);

    const sheet = tabular.sheets[0];
    expect(sheet.rows.length).toBe(3);
    expect(sheet.rows[0].candidate_name).toBe("Ananya Rao");
    expect(sheet.rows[0].years_exp).toBe(4);
    expect(sheet.rows[0].certified).toBe(true);

    // Missing values
    expect(sheet.missing_values_by_column["years_exp"]).toBe(1);
    expect(sheet.missing_values_by_column["primary_skill"]).toBe(1);
    expect(sheet.rows[1].years_exp).toBeNull();
  });

  it("detects and reports inconsistent row lengths in CSV", async () => {
    const csvContent = `id,name,role\n1,Alice,Engineer\n2,Bob\n3,Charlie,Architect,ExtraColumn`;
    const buffer = Buffer.from(csvContent, "utf-8");

    const result = await extractTextFromBuffer(buffer, "inconsistent.csv");
    const tabular = result.structured_data?.tabular;
    expect(tabular).toBeDefined();
    expect(tabular!.inconsistent_rows.length).toBeGreaterThan(0);
    expect(tabular!.inconsistent_rows[0].row_index).toBe(3); // row 2 (1-based index including header = 3)
  });

  // 2. XLSX Tests
  it("extracts real worksheets, headers, and cells from Excel XLSX workbook", async () => {
    // Generate valid in-memory XLSX workbook
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["company", "tier", "min_cgpa", "openings"],
      ["Accenture", "Dream", 7.5, 50],
      ["Google", "Super Dream", 8.5, 5],
      ["TCS", "Standard", 6.5, 120],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Placements_2025");

    const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const result = await extractTextFromBuffer(xlsxBuffer, "placements.xlsx");
    expect(result.file_type).toBe("xlsx");
    expect(result.structured_data?.kind).toBe("tabular");

    const tab = result.structured_data!.tabular!;
    expect(tab.sheets.length).toBe(1);
    expect(tab.sheets[0].name).toBe("Placements_2025");
    expect(tab.sheets[0].headers).toEqual(["company", "tier", "min_cgpa", "openings"]);
    expect(tab.total_rows).toBe(3);
    expect(tab.sheets[0].rows[0].company).toBe("Accenture");
    expect(tab.sheets[0].rows[1].min_cgpa).toBe(8.5);
  });

  // 3. JSON Tests
  it("parses JSON array into structured records and extracts schema definition", async () => {
    const jsonRecords = [
      { id: 101, title: "Backend Engineer", skills: ["Python", "Docker"], remote: true },
      { id: 102, title: "Frontend Engineer", skills: ["React", "TypeScript"], remote: false },
    ];
    const buffer = Buffer.from(JSON.stringify(jsonRecords, null, 2), "utf-8");

    const result = await extractTextFromBuffer(buffer, "roles.json");
    expect(result.file_type).toBe("json");
    expect(result.structured_data?.kind).toBe("json_array");

    const js = result.structured_data!.json_structure!;
    expect(js.is_array).toBe(true);
    expect(js.record_count).toBe(2);
    expect(js.keys).toContain("title");
    expect(js.keys).toContain("skills");
  });

  it("parses single JSON object and extracts key hierarchy", async () => {
    const jsonObj = {
      institution: "JSS Academy of Technical Education",
      placement_cycle: "2024-2025",
      statistics: { total_placed: 850, average_package_lpa: 8.2 },
    };
    const buffer = Buffer.from(JSON.stringify(jsonObj), "utf-8");

    const result = await extractTextFromBuffer(buffer, "overview.json");
    expect(result.file_type).toBe("json");
    expect(result.structured_data?.kind).toBe("json_object");
    expect(result.structured_data!.json_structure!.keys).toContain("institution");
  });

  it("rejects malformed JSON with syntax error description", async () => {
    const badJson = `{"company": "Google", "openings": 10, invalid_syntax}`;
    const buffer = Buffer.from(badJson, "utf-8");

    await expect(extractTextFromBuffer(buffer, "corrupt.json")).rejects.toThrow(/malformed json/i);
  });

  // 4. File Boundary & Edge Cases
  it("rejects empty files (0 bytes) with HTTP 400 error", async () => {
    await expect(extractTextFromBuffer(Buffer.alloc(0), "empty.csv")).rejects.toThrow(/empty/i);
  });

  it("rejects files exceeding maximum size limit (10MB) with HTTP 413 error", async () => {
    const huge = Buffer.alloc(11 * 1024 * 1024);
    await expect(extractTextFromBuffer(huge, "large.xlsx")).rejects.toThrow(/exceeds maximum allowed limit/i);
  });

  it("rejects unsupported executable or binary files with HTTP 415 error", async () => {
    const exe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00binary executable");
    await expect(extractTextFromBuffer(exe, "payload.exe")).rejects.toThrow(/unsupported file format/i);
  });

  it("detects scanned PDFs without extractable text and flags need for OCR", async () => {
    const scannedPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF`;
    const buffer = Buffer.from(scannedPdf, "ascii");

    await expect(extractTextFromBuffer(buffer, "scanned_invoice.pdf")).rejects.toThrow(
      /scanned document.*not supported/i
    );
  });
});
