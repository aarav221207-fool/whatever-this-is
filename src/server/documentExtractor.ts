import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type SupportedFileType = "pdf" | "docx" | "txt" | "csv" | "xlsx" | "json";

export class DocumentExtractionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 422) {
    super(message);
    this.name = "DocumentExtractionError";
    this.statusCode = statusCode;
  }
}

export interface TabularSheetData {
  name: string;
  headers: string[];
  rows: Array<Record<string, any>>;
  row_count: number;
  column_count: number;
  column_types: Record<string, "number" | "string" | "boolean" | "date" | "null">;
  missing_values_by_column: Record<string, number>;
  sample_rows: Array<Record<string, any>>;
}

export interface StructuredFileContent {
  kind: "tabular" | "json_object" | "json_array" | "document_text";
  tabular?: {
    sheets: TabularSheetData[];
    total_rows: number;
    headers: string[];
    inconsistent_rows: Array<{
      row_index: number;
      expected: number;
      found: number;
      reason: string;
    }>;
  };
  json_structure?: {
    is_array: boolean;
    record_count: number;
    keys: string[];
    sample_preview: any;
    schema_definition: Record<string, string>;
  };
}

export interface ExtractedDocument {
  file_name: string;
  file_type: SupportedFileType;
  mime_type: string;
  char_count: number;
  word_count: number;
  text: string;
  structured_data?: StructuredFileContent;
  metadata?: Record<string, any>;
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Determines file type by extension, MIME type, and magic bytes
 */
export function detectFileType(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): SupportedFileType {
  const lower = (filename || "").toLowerCase();

  if (lower.endsWith(".pdf") || mimetype === "application/pdf") {
    return "pdf";
  }
  if (
    lower.endsWith(".docx") ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || mimetype?.includes("spreadsheet")) {
    return "xlsx";
  }
  if (lower.endsWith(".csv") || mimetype === "text/csv") {
    return "csv";
  }
  if (lower.endsWith(".json") || mimetype === "application/json") {
    return "json";
  }
  if (lower.endsWith(".txt") || lower.endsWith(".md") || mimetype === "text/plain") {
    return "txt";
  }

  // Check magic bytes
  if (buffer.length >= 4) {
    if (buffer.slice(0, 4).toString("ascii") === "%PDF") return "pdf";
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      // PK zip can be docx or xlsx
      if (lower.endsWith(".docx")) return "docx";
      if (lower.endsWith(".xlsx")) return "xlsx";
      return "docx";
    }
  }

  // Check JSON by first character
  const trimmedStart = buffer.toString("utf-8", 0, Math.min(buffer.length, 100)).trim();
  if (trimmedStart.startsWith("{") || trimmedStart.startsWith("[")) {
    return "json";
  }

  throw new DocumentExtractionError(
    `Unsupported file format for '${filename}'. Supported formats are: CSV, XLSX, JSON, TXT, PDF, and DOCX.`,
    415
  );
}

/**
 * Parses CSV raw text into headers, structured rows, and type audits
 */
function parseCsvBuffer(buffer: Buffer, filename: string): ExtractedDocument {
  const rawText = buffer.toString("utf-8");
  if (!rawText || rawText.trim().length === 0) {
    throw new DocumentExtractionError(`Uploaded CSV file '${filename}' is empty.`, 400);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", raw: false });
  } catch (err: any) {
    throw new DocumentExtractionError(
      `Failed to parse CSV file '${filename}': ${err.message || "Malformed CSV structure."}`,
      422
    );
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new DocumentExtractionError(`CSV file '${filename}' contains no readable data.`, 422);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rawRows.length === 0) {
    throw new DocumentExtractionError(`CSV file '${filename}' contains no rows.`, 422);
  }

  const headers = rawRows[0].map((h, i) => (h !== undefined && h !== null && String(h).trim() !== "" ? String(h).trim() : `Column_${i + 1}`));
  const dataRows = rawRows.slice(1);

  const parsedObjects: Array<Record<string, any>> = [];
  const inconsistentRows: Array<{ row_index: number; expected: number; found: number; reason: string }> = [];
  const missingByCol: Record<string, number> = {};
  const colTypes: Record<string, "number" | "string" | "boolean" | "date" | "null"> = {};

  headers.forEach((h) => {
    missingByCol[h] = 0;
  });

  // Check raw CSV lines for column count consistency based on the declared header line
  const rawLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length > 1) {
    const headerColsCount = rawLines[0].split(",").length;
    const expectedCols = headerColsCount > 0 ? headerColsCount : headers.length;
    rawLines.slice(1).forEach((line, lineIdx) => {
      // Match comma-separated values
      const cols = line.split(",");
      if (cols.length !== expectedCols) {
        inconsistentRows.push({
          row_index: lineIdx + 2, // 1-indexed line number in file (including header)
          expected: expectedCols,
          found: cols.length,
          reason: cols.length < expectedCols ? "Missing column values" : "Extra unmapped columns",
        });
      }
    });
  }

  dataRows.forEach((row, rowIdx) => {
    if (row.length === 0 || (row.length === 1 && String(row[0]).trim() === "")) {
      return; // skip empty line
    }

    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      const val = row[colIdx];
      if (val === undefined || val === null || String(val).trim() === "") {
        obj[h] = null;
        missingByCol[h] = (missingByCol[h] || 0) + 1;
      } else {
        const strVal = String(val).trim();
        const numVal = Number(strVal);
        if (!isNaN(numVal) && strVal !== "") {
          obj[h] = numVal;
          if (!colTypes[h]) colTypes[h] = "number";
        } else if (strVal.toLowerCase() === "true" || strVal.toLowerCase() === "false") {
          obj[h] = strVal.toLowerCase() === "true";
          if (!colTypes[h]) colTypes[h] = "boolean";
        } else {
          obj[h] = strVal;
          if (!colTypes[h]) colTypes[h] = "string";
        }
      }
    });
    parsedObjects.push(obj);
  });

  // Construct readable text representation for LLM and preview
  let textSummary = `File: ${filename}\nType: CSV Spreadsheet\nTotal Rows: ${parsedObjects.length}\nColumns: ${headers.join(", ")}\n\n`;
  textSummary += `--- Sample Records (First 5) ---\n`;
  parsedObjects.slice(0, 5).forEach((rec, idx) => {
    textSummary += `[Row ${idx + 1}] ` + Object.entries(rec).map(([k, v]) => `${k}: ${v}`).join(" | ") + "\n";
  });

  const words = textSummary.split(/\s+/).filter(Boolean);

  return {
    file_name: filename,
    file_type: "csv",
    mime_type: "text/csv",
    char_count: rawText.length,
    word_count: words.length,
    text: textSummary,
    structured_data: {
      kind: "tabular",
      tabular: {
        sheets: [
          {
            name: "Sheet1",
            headers,
            rows: parsedObjects,
            row_count: parsedObjects.length,
            column_count: headers.length,
            column_types: colTypes,
            missing_values_by_column: missingByCol,
            sample_rows: parsedObjects.slice(0, 5),
          },
        ],
        total_rows: parsedObjects.length,
        headers,
        inconsistent_rows: inconsistentRows,
      },
    },
    metadata: {
      headers,
      row_count: parsedObjects.length,
      column_count: headers.length,
      inconsistent_rows_count: inconsistentRows.length,
    },
  };
}

/**
 * Parses XLSX / XLS workbook into worksheets, headers, rows, and cell data
 */
function parseXlsxBuffer(buffer: Buffer, filename: string): ExtractedDocument {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch (err: any) {
    throw new DocumentExtractionError(
      `Failed to parse Excel file '${filename}': ${err.message || "Invalid or corrupted XLSX file."}`,
      422
    );
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new DocumentExtractionError(`Excel file '${filename}' contains no worksheets.`, 422);
  }

  const sheets: TabularSheetData[] = [];
  let totalRows = 0;
  const allHeaders: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rawRows.length === 0) return;

    const headers = rawRows[0].map((h, i) => (h !== undefined && h !== null && String(h).trim() !== "" ? String(h).trim() : `Column_${i + 1}`));
    if (allHeaders.length === 0) allHeaders.push(...headers);

    const rows: Array<Record<string, any>> = [];
    const missingByCol: Record<string, number> = {};
    const colTypes: Record<string, "number" | "string" | "boolean" | "date" | "null"> = {};

    headers.forEach((h) => {
      missingByCol[h] = 0;
    });

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const obj: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        const val = row[colIdx];
        if (val === undefined || val === null || String(val).trim() === "") {
          obj[h] = null;
          missingByCol[h] = (missingByCol[h] || 0) + 1;
        } else {
          obj[h] = val;
          if (typeof val === "number") colTypes[h] = "number";
          else if (typeof val === "boolean") colTypes[h] = "boolean";
          else if (val instanceof Date) colTypes[h] = "date";
          else colTypes[h] = "string";
        }
      });
      rows.push(obj);
    }

    totalRows += rows.length;

    sheets.push({
      name: sheetName,
      headers,
      rows,
      row_count: rows.length,
      column_count: headers.length,
      column_types: colTypes,
      missing_values_by_column: missingByCol,
      sample_rows: rows.slice(0, 5),
    });
  });

  if (sheets.length === 0 || totalRows === 0) {
    throw new DocumentExtractionError(
      `Excel workbook '${filename}' contains no readable records or data rows.`,
      422
    );
  }

  // Format textual summary for LLM context & preview
  let text = `Excel Workbook: ${filename}\nSheets: ${sheets.map((s) => `${s.name} (${s.row_count} rows)`).join(", ")}\n\n`;
  sheets.forEach((s) => {
    text += `### Sheet: ${s.name}\n`;
    text += `Columns: ${s.headers.join(", ")}\n`;
    text += `Rows: ${s.row_count}\n`;
    text += `Sample Data:\n`;
    s.sample_rows.forEach((r, idx) => {
      text += `[${idx + 1}] ` + Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(" | ") + "\n";
    });
    text += "\n";
  });

  const words = text.split(/\s+/).filter(Boolean);

  return {
    file_name: filename,
    file_type: "xlsx",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    char_count: text.length,
    word_count: words.length,
    text,
    structured_data: {
      kind: "tabular",
      tabular: {
        sheets,
        total_rows: totalRows,
        headers: allHeaders,
        inconsistent_rows: [],
      },
    },
    metadata: {
      sheet_count: sheets.length,
      sheet_names: sheets.map((s) => s.name),
      total_rows: totalRows,
    },
  };
}

/**
 * Parses JSON file buffer and extracts structured hierarchy and schema
 */
function parseJsonBuffer(buffer: Buffer, filename: string): ExtractedDocument {
  const rawText = buffer.toString("utf-8");
  if (!rawText || rawText.trim().length === 0) {
    throw new DocumentExtractionError(`Uploaded JSON file '${filename}' is empty.`, 400);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (err: any) {
    throw new DocumentExtractionError(
      `Malformed JSON in '${filename}': ${err.message}`,
      422
    );
  }

  const isArray = Array.isArray(parsed);
  const recordCount = isArray ? parsed.length : 1;
  const sample = isArray ? parsed[0] || {} : parsed;
  const keys = Object.keys(sample || {});

  const schemaDef: Record<string, string> = {};
  keys.forEach((k) => {
    const val = sample[k];
    if (val === null) schemaDef[k] = "null";
    else if (Array.isArray(val)) schemaDef[k] = `array<${typeof val[0] || "unknown"}>`;
    else schemaDef[k] = typeof val;
  });

  let textSummary = `File: ${filename}\nFormat: JSON ${isArray ? `Array (${recordCount} items)` : "Object"}\n`;
  textSummary += `Keys: ${keys.join(", ")}\n\n`;
  textSummary += `Sample Structure:\n` + JSON.stringify(sample, null, 2);

  const words = textSummary.split(/\s+/).filter(Boolean);

  return {
    file_name: filename,
    file_type: "json",
    mime_type: "application/json",
    char_count: rawText.length,
    word_count: words.length,
    text: textSummary,
    structured_data: {
      kind: isArray ? "json_array" : "json_object",
      json_structure: {
        is_array: isArray,
        record_count: recordCount,
        keys,
        sample_preview: sample,
        schema_definition: schemaDef,
      },
    },
    metadata: {
      is_array: isArray,
      record_count: recordCount,
      keys,
      parsed_data: parsed,
    },
  };
}

/**
 * Validates file buffer, size, and magic bytes, then extracts text and structured data
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  originalFilename: string,
  mimetype?: string
): Promise<ExtractedDocument> {
  if (!buffer || buffer.length === 0) {
    throw new DocumentExtractionError("Uploaded file is empty (0 bytes).", 400);
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new DocumentExtractionError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB.`,
      413
    );
  }

  const filename = originalFilename || "uploaded_document";
  const detectedType = detectFileType(buffer, filename, mimetype);

  // Route to format-specific parser
  if (detectedType === "csv") {
    return parseCsvBuffer(buffer, filename);
  }

  if (detectedType === "xlsx") {
    return parseXlsxBuffer(buffer, filename);
  }

  if (detectedType === "json") {
    return parseJsonBuffer(buffer, filename);
  }

  let extractedText = "";

  if (detectedType === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      await parser.destroy();
      extractedText = textResult.text || "";
    } catch (err: any) {
      throw new DocumentExtractionError(
        `Failed to parse PDF document: ${err.message || "Invalid or corrupted PDF file."}`,
        422
      );
    }

    // Check for scanned / image-only PDFs
    if (extractedText.replace(/\s+/g, "").length < 15) {
      throw new DocumentExtractionError(
        "The uploaded PDF does not contain extractable text. Scanned document PDFs (images without an OCR text layer) are not supported. Please upload a searchable PDF, DOCX, or text file.",
        422
      );
    }
  } else if (detectedType === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } catch (err: any) {
      throw new DocumentExtractionError(
        `Failed to parse Word document: ${err.message || "Invalid or corrupted DOCX file."}`,
        422
      );
    }

    if (extractedText.replace(/\s+/g, "").length < 15) {
      throw new DocumentExtractionError(
        "The uploaded Word document does not contain readable text. Please check the document contents and upload a valid file.",
        422
      );
    }
  } else if (detectedType === "txt") {
    try {
      extractedText = buffer.toString("utf-8");
    } catch (err: any) {
      throw new DocumentExtractionError(`Failed to read text file: ${err.message}`, 422);
    }

    if (extractedText.replace(/\s+/g, "").length < 15) {
      throw new DocumentExtractionError(
        "The uploaded text document contains insufficient text (less than 15 characters).",
        422
      );
    }
  }

  // Normalize excessive whitespaces while preserving layout paragraphs
  const cleanedText = extractedText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .trim();

  const words = cleanedText.split(/\s+/).filter(Boolean);

  return {
    file_name: filename,
    file_type: detectedType,
    mime_type:
      detectedType === "pdf"
        ? "application/pdf"
        : detectedType === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "text/plain",
    char_count: cleanedText.length,
    word_count: words.length,
    text: cleanedText,
    structured_data: {
      kind: "document_text",
    },
  };
}
