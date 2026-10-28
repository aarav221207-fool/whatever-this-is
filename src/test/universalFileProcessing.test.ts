import { describe, it, expect } from "vitest";
import { extractTextFromBuffer, DocumentExtractionError } from "../server/documentExtractor";

describe("Supported resume and job-description document formats", () => {
  it("extracts readable text from a UTF-8 TXT resume", async () => {
    const text = "Aarav Srivastava\nEmail: aarav@example.com\nSkills: Python, React and SQL";
    const result = await extractTextFromBuffer(Buffer.from(text, "utf-8"), "student-resume.txt", "text/plain");

    expect(result.file_type).toBe("txt");
    expect(result.text).toContain("Skills: Python, React and SQL");
    expect(result.char_count).toBe(text.length);
    expect(result.word_count).toBeGreaterThan(5);
  });

  it("rejects CSV input because the resume/JD extractor supports PDF, DOCX and TXT", async () => {
    await expect(
      extractTextFromBuffer(Buffer.from("student_name,skill\nAarav,Python", "utf-8"), "students.csv", "text/csv")
    ).rejects.toThrow(DocumentExtractionError);
  });

  it("rejects JSON data files rather than treating them as a resume or job description", async () => {
    await expect(
      extractTextFromBuffer(Buffer.from(JSON.stringify({ student: "Aarav", skills: ["Python"] }), "utf-8"), "student.json", "application/json")
    ).rejects.toThrow(DocumentExtractionError);
  });

  it("rejects empty input with a clear validation error", async () => {
    await expect(extractTextFromBuffer(Buffer.alloc(0), "empty.txt", "text/plain"))
      .rejects.toThrow(/empty/i);
  });
});
