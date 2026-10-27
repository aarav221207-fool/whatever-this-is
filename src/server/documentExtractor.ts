import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ExtractedDocument {
  text: string;
  file_name: string;
  file_type: "pdf" | "docx" | "txt";
  char_count: number;
  word_count: number;
}

export class DocumentExtractionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 422) {
    super(message);
    this.name = "DocumentExtractionError";
    this.statusCode = statusCode;
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file buffer, size, and magic bytes, then extracts raw text
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
  const lowerName = filename.toLowerCase();

  // Detect format via extension and magic bytes
  const isPdf =
    lowerName.endsWith(".pdf") ||
    mimetype === "application/pdf" ||
    (buffer.length >= 4 && buffer.slice(0, 4).toString("ascii") === "%PDF");

  const isDocx =
    lowerName.endsWith(".docx") ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04);

  const isTxt =
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    mimetype === "text/plain";

  let extractedText = "";
  let detectedType: "pdf" | "docx" | "txt" = "txt";

  if (isPdf) {
    detectedType = "pdf";
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
        "The uploaded PDF does not contain extractable text. Scanned document PDFs (images without an OCR text layer) are not supported. Please upload a searchable PDF, DOCX, or plain text file.",
        422
      );
    }
  } else if (isDocx) {
    detectedType = "docx";
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
  } else if (isTxt) {
    detectedType = "txt";
    try {
      extractedText = buffer.toString("utf-8");
    } catch (err: any) {
      throw new DocumentExtractionError(
        `Failed to read text file: ${err.message}`,
        422
      );
    }

    if (extractedText.replace(/\s+/g, "").length < 15) {
      throw new DocumentExtractionError(
        "The uploaded text document contains insufficient text (less than 15 characters).",
        422
      );
    }
  } else {
    throw new DocumentExtractionError(
      `Unsupported file format for '${filename}'. Only .pdf, .docx, and .txt files are supported.`,
      415
    );
  }

  // Normalize excessive whitespaces while preserving layout paragraphs
  const cleanedText = extractedText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ")
    .trim();

  const words = cleanedText.split(/\s+/).filter(Boolean);

  return {
    text: cleanedText,
    file_name: filename,
    file_type: detectedType,
    char_count: cleanedText.length,
    word_count: words.length,
  };
}
