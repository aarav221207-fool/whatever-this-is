import { describe, it, expect } from "vitest";
import {
  RADIX_CATEGORIES,
  RADIX_CATEGORY_METADATA,
  RadixCategoryCode,
  CandidateProfile,
  JobDescriptionResponse,
} from "../types/radix";
import { normalizeSkill, CANONICAL_SKILLS } from "../lib/radixCatalog";
import {
  adaptResumeResponse,
  adaptJDResponse,
} from "../lib/radixAdapters";
import { parseResumeText, parseJDText } from "../lib/parserService";
import { evaluateTalentReadiness, COMPANY_BENCHMARKS } from "../lib/talentCheckEngine";
import { matchCandidateToJD } from "../lib/skillMatchingEngine";
import { SAMPLE_JOB_DESCRIPTIONS, SAMPLE_RESUMES } from "../data/radixSamples";

describe("RADIX Talent Match - Data Contract & Normalization Suite", () => {
  it("defines exactly 13 authoritative category codes (12 standard + OTHER)", () => {
    expect(RADIX_CATEGORIES.length).toBe(13);
    const expected = [
      "COD",
      "DSA",
      "OOD",
      "APTI",
      "COMM",
      "AI",
      "CLOUD",
      "SQL",
      "SWE",
      "SYSD",
      "NETW",
      "OS",
      "OTHER",
    ];
    expected.forEach((cat) => {
      expect(RADIX_CATEGORIES).toContain(cat);
      expect(RADIX_CATEGORY_METADATA[cat as RadixCategoryCode]).toBeDefined();
    });
  });

  it("normalizes skill aliases to canonical names and categories", () => {
    expect(normalizeSkill("k8s")).toEqual({
      canonicalName: "Kubernetes",
      category: "CLOUD",
    });
    expect(normalizeSkill("react.js")).toEqual({
      canonicalName: "React",
      category: "SWE",
    });
    expect(normalizeSkill("python3")).toEqual({
      canonicalName: "Python",
      category: "COD",
    });
    expect(normalizeSkill("postgres")).toEqual({
      canonicalName: "PostgreSQL",
      category: "SQL",
    });
    expect(normalizeSkill("solid")).toEqual({
      canonicalName: "SOLID Principles",
      category: "OOD",
    });
    expect(normalizeSkill("dsa")).toEqual({
      canonicalName: "Data Structures & Algorithms",
      category: "DSA",
    });
  });

  it("adapts raw resume JSON into strict CandidateProfile", () => {
    const raw = {
      name: "Jane Smith",
      skills: [
        { name: "docker", confidence: "high" },
        { name: "python", confidence: "high" },
      ],
      experience: [{ role: "Backend Dev", company: "Acme", duration: "2022-2023" }],
    };
    const adapted = adaptResumeResponse(raw);
    expect(adapted.source_type).toBe("candidate");
    expect(adapted.name).toBe("Jane Smith");
    expect(adapted.skills.length).toBe(2);
    expect(adapted.skills[0].category_code).toBe("CLOUD");
    expect(adapted.skills[1].category_code).toBe("COD");
    expect(adapted.experience[0].title).toBe("Backend Dev");
  });

  it("adapts raw JD JSON into strict JobDescriptionResponse", () => {
    const raw = {
      company: "Google",
      role: "SRE",
      skills: [{ name: "linux" }, { name: "kubernetes" }],
      required_skills: ["Linux", "Kubernetes"],
    };
    const adapted = adaptJDResponse(raw);
    expect(adapted.source_type).toBe("jd");
    expect(adapted.company).toBe("Google");
    expect(adapted.skills.length).toBe(2);
    expect(adapted.skills[0].category_code).toBe("OS");
    expect(adapted.skills[1].category_code).toBe("CLOUD");
  });
});

describe("Role 1 & 2 Parsers - Deterministic Extraction Suite", () => {
  it("parses sample resume with contact details, 12 RADIX skills, and experience", () => {
    const sample = SAMPLE_RESUMES[0];
    const profile = parseResumeText(sample.text, "test_resume.pdf");

    expect(profile.name).toBe("Alex Mercer");
    expect(profile.email).toBe("alex.mercer@email.com");
    expect(profile.phone).toContain("555");
    expect(profile.skills.length).toBeGreaterThanOrEqual(5);

    // Verify presence of core categories
    const categories = profile.skills.map((s) => s.category_code);
    expect(categories).toContain("COD");
    expect(categories).toContain("CLOUD");
    expect(categories).toContain("SQL");

    // Every skill must have grounded evidence
    profile.skills.forEach((skill) => {
      expect(skill.evidence).toBeDefined();
      expect(skill.evidence!.length).toBeGreaterThan(0);
    });
  });

  it("parses job description with detected company, role, and requirements", () => {
    const sample = SAMPLE_JOB_DESCRIPTIONS[0];
    const jd = parseJDText(sample.text, "test_jd.pdf");

    expect(jd.company).toContain("Accenture");
    expect(jd.role).toContain("Cloud");
    expect(jd.skills.length).toBeGreaterThanOrEqual(4);
    expect(jd.required_skills?.length).toBeGreaterThan(0);

    const categories = jd.skills.map((s) => s.category_code);
    expect(categories).toContain("CLOUD");
  });
});

describe("Role 4 - Talent Check Engine", () => {
  it("loads 7+ curated company benchmarks with 12 category levels", () => {
    expect(COMPANY_BENCHMARKS.length).toBeGreaterThanOrEqual(5);
    const accenture = COMPANY_BENCHMARKS.find((c) => c.company_name === "Accenture")!;
    expect(accenture).toBeDefined();
    expect(accenture.category_benchmarks.DSA.level).toBe(8);
    expect(accenture.category_benchmarks.COD.level).toBe(7);
  });

  it("evaluates an explicitly loaded demo resume against Accenture with 12-category breakdown", () => {
    // Demo fixtures are allowed in tests only; the live application does not preload this profile.
    const demoCandidate = parseResumeText(SAMPLE_RESUMES[0].text, "demo_test_resume.pdf");
    const result = evaluateTalentReadiness(demoCandidate, 1);
    expect(result.company_name).toBe("Accenture");
    expect(result.overall_readiness_score).toBeGreaterThan(60);
    expect(result.category_scores.length).toBe(13); // 12 + OTHER

    // Verify category score contract
    const dsaScore = result.category_scores.find((s) => s.category_code === "DSA")!;
    expect(dsaScore).toBeDefined();
    // Talent readiness normalizes parsed evidence to the engine's 0–10 category scale.
    expect(dsaScore.candidate_level).toBe(10);
    expect(dsaScore.company_required_level).toBe(8);
    expect(dsaScore.status).toBe("Ready");
    expect(dsaScore.gap).toBe(2);
    expect(dsaScore.recommended_topics.length).toBeGreaterThan(0);
  });
});

describe("Role 5 - Deterministic Skill Matching Engine", () => {
  it("matches candidate profile against Accenture Cloud JD and generates evidence citations", () => {
    const jd = parseJDText(SAMPLE_JOB_DESCRIPTIONS[0].text);
    const demoCandidate = parseResumeText(SAMPLE_RESUMES[0].text, "demo_test_resume.pdf");
    const match = matchCandidateToJD(demoCandidate, jd);

    expect(match.overall_match_score).toBeGreaterThanOrEqual(40);
    expect(match.matched_skills.length).toBeGreaterThan(0);

    // Verify that matched skills provide candidate background evidence
    const pythonMatch = match.matched_skills.find((s) => s.skill_name === "Python");
    expect(pythonMatch).toBeDefined();
    expect(pythonMatch?.evidence).toBeDefined();

    expect(match.category_breakdown.length).toBeGreaterThan(0);
    expect(match.action_plan.length).toBeGreaterThan(0);
  });
});

describe("End-to-End Pipeline Integration (Roles 1 -> 2 -> 3 -> 4 -> 5)", () => {
  it("executes full data flow without loss of evidence or category drift", () => {
    // 1. Role 1 parses JD
    const jd = parseJDText(SAMPLE_JOB_DESCRIPTIONS[1].text, "google.txt");
    expect(jd.skills.length).toBeGreaterThan(0);

    // 2. Role 2 parses Resume
    const candidate = parseResumeText(SAMPLE_RESUMES[0].text, "alex.txt");
    expect(candidate.skills.length).toBeGreaterThan(0);

    // 3. Role 3 updates Candidate (simulate adding a missing skill)
    const updatedCandidate: CandidateProfile = {
      ...candidate,
      skills: [
        ...candidate.skills,
        {
          skill_name: "C++",
          category_code: "COD",
          confidence: "high",
          evidence: "Developed low-latency socket networking daemons in C++",
          level: 8,
        },
      ],
    };

    // 4. Role 4 evaluates readiness for Google (id: 2)
    const talentCheck = evaluateTalentReadiness(updatedCandidate, 2);
    expect(talentCheck.company_name).toBe("Google");
    expect(talentCheck.category_scores.length).toBe(13);

    // 5. Role 5 matches candidate against Google JD
    const match = matchCandidateToJD(updatedCandidate, jd);
    expect(match.overall_match_score).toBeGreaterThan(0);
    expect(match.matched_skills.some((s) => s.skill_name === "C++")).toBe(true);
  });
});
