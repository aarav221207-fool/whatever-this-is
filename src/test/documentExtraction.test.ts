import { describe, it, expect } from "vitest";
import {
  extractTextFromBuffer,
  DocumentExtractionError,
} from "../server/documentExtractor";
import { parseResumeText, parseJDText } from "../lib/parserService";

describe("Document Extractor Service (PDF / DOCX / TXT)", () => {
  it("rejects empty buffers with HTTP 400 error", async () => {
    await expect(
      extractTextFromBuffer(Buffer.alloc(0), "empty.pdf")
    ).rejects.toThrow(/empty/i);
  });

  it("rejects oversized files exceeding 4MB limit with HTTP 413 error", async () => {
    const hugeBuffer = Buffer.alloc(5 * 1024 * 1024);
    await expect(
      extractTextFromBuffer(hugeBuffer, "large.pdf")
    ).rejects.toThrow(/exceeds maximum allowed limit/i);
  });

  it("rejects unsupported file formats with HTTP 415 error", async () => {
    const buffer = Buffer.from("executable binary code");
    await expect(
      extractTextFromBuffer(buffer, "malicious.exe")
    ).rejects.toThrow(/unsupported file format/i);
  });

  it("correctly extracts text from valid plain text files", async () => {
    const sampleText =
      "Candidate Name: Sarah Connor\nEmail: sarah.connor@example.com\nSkills: Python, AWS, Docker, Kubernetes\nExperience: Senior Cloud Architect at Cyberdyne Systems 2020 - Present";
    const buffer = Buffer.from(sampleText, "utf-8");

    const result = await extractTextFromBuffer(buffer, "sarah_resume.txt");
    expect(result.file_type).toBe("txt");
    expect(result.text).toContain("Sarah Connor");
    expect(result.char_count).toBeGreaterThan(50);
    expect(result.word_count).toBeGreaterThan(10);
  });

  it("detects and rejects scanned / image-only PDFs that contain no text layer", async () => {
    // Minimal empty PDF with zero text elements
    const emptyPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`;

    const buffer = Buffer.from(emptyPdf, "ascii");
    await expect(
      extractTextFromBuffer(buffer, "scanned_doc.pdf")
    ).rejects.toThrow(/scanned.*not supported/i);
  });
});

describe("Truth-in-Data Validation (No Fabricated Profiles)", () => {
  it("never injects fake candidate name 'Alex Mercer' when resume does not specify it", () => {
    const resumeText =
      "contact@janedoe.org\n+1 555-0199\nCloud Architect with deep AWS, Kubernetes, and Terraform expertise.";
    const profile = parseResumeText(resumeText, "Jane_Doe_Resume.pdf");

    expect(profile.name).toBe("Jane Doe");
    expect(profile.name).not.toBe("Alex Mercer");
  });

  it("returns zero skills when candidate resume has no matching technical skills", () => {
    const nonTechResume =
      "John Miller\njohn@example.com\nProfessional chef and culinary artist with 10 years managing French bakery kitchens.";
    const profile = parseResumeText(nonTechResume, "chef.txt");

    // Must NOT inject Python, DSA, or SQL!
    expect(profile.skills.length).toBe(0);
  });

  it("returns zero experience entries when resume has no experience section", () => {
    const freshStudentResume =
      "Priya Sharma\npriya@example.com\nEducation: B.Tech Computer Science 2024\nSkills: Python, React, SQL";
    const profile = parseResumeText(freshStudentResume, "priya.txt");

    // Must NOT inject "Tech Systems"
    expect(profile.experience.length).toBe(0);
    expect(profile.skills.length).toBe(3);
  });

  it("returns zero required skills when Job Description has no recognized requirements", () => {
    const genericJD =
      "Company: Alpha Logistics\nRole: Warehouse Coordinator\nOversee inventory movement and fleet dispatch schedules.";
    const jd = parseJDText(genericJD, "warehouse.txt");

    // Must NOT inject Python, Docker, PostgreSQL!
    expect(jd.skills.length).toBe(0);
    expect(jd.required_skills?.length).toBe(0);
  });
});
