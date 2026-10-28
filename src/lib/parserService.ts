// src/lib/parserService.ts
import { CandidateProfile, JobDescriptionResponse, SkillItem, RadixCategoryCode } from "../types/radix";
import { CANONICAL_SKILLS, normalizeSkill } from "./radixCatalog";

/**
 * Extracts candidate contact information, summary, skills, and experience from raw text.
 * Strictly adheres to truth-in-data: never fabricates candidate details, skills, or experience.
 */
export function parseResumeText(rawText: string, fileName?: string): CandidateProfile {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Cannot parse empty resume text.");
  }

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Extract email
  const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  const email = emailMatch ? emailMatch[1] : "";

  // 2. Extract phone
  const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // 3. Extract a candidate name only when it appears in resume text
  let name = "";
  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes("@") &&
      !line.match(/\d{5}/) &&
      !line.toLowerCase().includes("resume") &&
      !line.toLowerCase().includes("curriculum") &&
      !line.toLowerCase().includes("page ") &&
      !line.toLowerCase().includes("http")
    ) {
      name = line.replace(/[^a-zA-Z\s.]/g, "").trim();
      if (name.length > 2) break;
    }
  }

  // If no readable name is present, preserve an empty value instead of inventing one.

  // 4. Extract professional summary
  let summary = "";
  const summaryHeaderIdx = lines.findIndex((l) =>
    /^(summary|professional summary|about me|profile|overview|objective)/i.test(l)
  );
  if (summaryHeaderIdx !== -1 && lines[summaryHeaderIdx + 1]) {
    summary = lines.slice(summaryHeaderIdx + 1, summaryHeaderIdx + 4).join(" ");
  } else {
    // Check first paragraph if it looks like a summary
    const earlyLines = lines.slice(1, 5).filter((l) => l.length > 40 && !l.includes("@") && !l.includes("http"));
    if (earlyLines.length > 0) {
      summary = earlyLines[0];
    }
  }

  // 5. Extract skills by scanning text against canonical skill catalog
  const lowerText = rawText.toLowerCase();
  const extractedSkills: SkillItem[] = [];
  const seenSkills = new Set<string>();

  CANONICAL_SKILLS.forEach((def) => {
    for (const alias of def.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[\\s,;()/\\[\\]:])${escaped}(?:[\\s,;()/\\[\\]:]|$)`, "i");
      const match = regex.exec(rawText);

      if (match && !seenSkills.has(def.canonicalName)) {
        seenSkills.add(def.canonicalName);

        // Find contextual evidence sentence
        const matchIndex = match.index;
        const windowStart = Math.max(0, matchIndex - 60);
        const windowEnd = Math.min(rawText.length, matchIndex + 90);
        const snippet = rawText
          .slice(windowStart, windowEnd)
          .replace(/[\r\n]+/g, " ")
          .trim();

        // Determine confidence based on occurrences and presence in experience sentences
        const count = (lowerText.match(new RegExp(escaped, "gi")) || []).length;
        const confidence: "high" | "medium" | "low" = count >= 2 || snippet.length > 40 ? "high" : "medium";

        extractedSkills.push({
          skill_name: def.canonicalName,
          category_code: def.category,
          confidence,
          evidence: snippet ? `"...${snippet}..."` : `Demonstrated competency in ${def.canonicalName}`,
          level: confidence === "high" ? 8 : 6,
        });
        break;
      }
    }
  });

  // Note: NO FABRICATED FALLBACK SKILLS! If 0 skills found, array remains empty.

  // 6. Extract experience
  const experience: CandidateProfile["experience"] = [];
  const expIndex = lines.findIndex((l) =>
    /^(experience|work experience|employment history|projects|professional experience)/i.test(l)
  );

  if (expIndex !== -1) {
    const expLines = lines.slice(expIndex + 1, Math.min(lines.length, expIndex + 25));
    let currentRole: { title: string; company: string; duration: string; description: string } | null = null;

    for (const line of expLines) {
      // If line contains header-like date pattern, start a new experience entry
      const hasDate = /(20\d\d|present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line);
      if (hasDate && line.length < 80) {
        if (currentRole && (currentRole.title || currentRole.description)) {
          experience.push(currentRole);
        }
        currentRole = {
          title: "",
          company: "",
          duration: line,
          description: "",
        };
      } else if (currentRole) {
        if (!currentRole.company && line.length < 50 && !line.includes(".")) {
          currentRole.company = line;
        } else if (line.length > 20) {
          currentRole.description += (currentRole.description ? " " : "") + line;
        }
      }
    }

    if (currentRole && (currentRole.title || currentRole.description)) {
      experience.push(currentRole);
    }
  }

  // Note: NO FABRICATED EXPERIENCE! If no experience in resume, array remains empty.

  return {
    source_type: "candidate",
    source_file: fileName || "",
    name,
    email,
    phone,
    summary,
    skills: extractedSkills,
    experience,
  };
}

/**
 * Extracts employer, job title, and required/preferred skills from Job Description text.
 * Strictly adheres to truth-in-data: never fabricates company requirements.
 */
export function parseJDText(rawText: string, fileName?: string): JobDescriptionResponse {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Cannot parse empty job description text.");
  }

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Detect Company
  let company = "";
  const companyPattern = /(?:company\\s*:\\s*|employer\\s*:\\s*|at\\s+|for\\s+)([A-Z][A-Za-z0-9&.\\s]{2,40}?)(?=\\s+(?:is|seeks|seeking|looking|role|position|job|to|for|with|requires|needs)\\b|[.,\\r\\n]|$)/i;
  const companyMatch = rawText.match(companyPattern);
  if (companyMatch) company = companyMatch[1].trim();
  // Do not infer an employer from a filename or an arbitrary first line.

  // 2. Detect Role
  let role = "";
  const rolePattern = /(?:role|position|title|job title):\s*([A-Za-z0-9\s/-]{4,40})/i;
  const roleMatch = rawText.match(rolePattern);
  if (roleMatch) {
    role = roleMatch[1].trim();
  } else {
    for (const line of lines.slice(0, 6)) {
      if (/engineer|developer|architect|analyst|consultant|manager|specialist|lead/i.test(line)) {
        role = line;
        break;
      }
    }
  }

  // Keep the role empty when the document does not state a recognizable title.

  // 3. Extract Skills with Category & Evidence
  const lowerText = rawText.toLowerCase();
  const extractedSkills: SkillItem[] = [];
  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  const seenSkills = new Set<string>();

  CANONICAL_SKILLS.forEach((def) => {
    for (const alias of def.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[\\s,;()/\\[\\]:])${escaped}(?:[\\s,;()/\\[\\]:]|$)`, "i");
      const match = regex.exec(rawText);

      if (match && !seenSkills.has(def.canonicalName)) {
        seenSkills.add(def.canonicalName);

        const matchIndex = match.index;
        const windowStart = Math.max(0, matchIndex - 50);
        const windowEnd = Math.min(rawText.length, matchIndex + 80);
        const snippet = rawText.slice(windowStart, windowEnd).replace(/[\r\n]+/g, " ").trim();

        // Check if in "preferred" or "nice to have" section
        const isPreferred = /preferred|bonus|nice to have|plus|optional/i.test(snippet);
        const confidence: "high" | "medium" | "low" = isPreferred ? "medium" : "high";

        extractedSkills.push({
          skill_name: def.canonicalName,
          category_code: def.category,
          confidence,
          evidence: snippet ? `"...${snippet}..."` : `Required competency in job description`,
        });

        if (isPreferred) {
          preferredSkills.push(def.canonicalName);
        } else {
          requiredSkills.push(def.canonicalName);
        }
        break;
      }
    }
  });

  // Note: NO FABRICATED FALLBACK SKILLS!

  return {
    source_type: "jd",
    source_file: fileName || "",
    company,
    role,
    skills: extractedSkills,
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    experience_years_required: (() => {
      const yearsMatch = rawText.match(/(\\d{1,2})\\s*\\+?\\s+years?\\s+(?:of\\s+)?(?:relevant\\s+)?experience/i);
      return yearsMatch ? Number(yearsMatch[1]) : undefined;
    })(),
    description_summary: lines.slice(0, 3).join(" "),
  };
}
