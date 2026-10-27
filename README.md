# RADIX Talent Match & Placement Analytics Portal
*(JSS University Noida Placement Intelligence Hub & RADIX Talent Match)*

**Architecture**: React 19 + TypeScript + Vite + Express + Tailwind CSS + Lucide Icons + TanStack Query + Vitest  
**Capabilities**: Full-Stack API, Gemini AI Strategic Evaluation, 12-Category RADIX Data Contract, Deterministic Scoring, Offline PWA Readiness

---

## 1. Executive Summary & Purpose

RADIX Talent Match is a unified, end-to-end recruitment intelligence and talent matching platform connecting five integrated roles:
1. **Role 1 (JD Analytics)**: Ingests Job Descriptions (.pdf, .docx, text), extracts explicit and implied competencies, categorizes them into the standard 12 RADIX categories, and provides verbatim evidentiary citations.
2. **Role 2 (Resume Parsing)**: Converts unstructured candidate resumes into structured, validated JSON matching the authoritative RADIX Shared Data Contract.
3. **Role 3 (Profile Builder)**: Candidate profile management and editing hub with persistent `localStorage` synchronization (`radix_profile`), 1-to-10 level proficiency assessment, and RADIX JSON export.
4. **Role 4 (Talent Check)**: Deterministic candidate readiness evaluation against curated employer hiring bars across all 12 RADIX categories, identifying critical skill gaps and mapping targeted study topics from Bloom's taxonomy.
5. **Role 5 (Skill Matching Engine)**: Candidate-to-JD match scoring (0–100%), exact/normalized/fuzzy skill comparison, required vs. preferred breakdown, and actionable interview preparation roadmaps with optional Gemini AI strategic insights.

The platform simultaneously preserves all institutional **Company Intelligence** (22-section deep corporate dossiers) and **Skill Intelligence** (Bloom's taxonomy ladders).

---

## 2. The 12 RADIX Categories Standard

All extracted and evaluated competencies conform strictly to the 12 RADIX categories (+ OTHER):

| Code | Category Name | Core Competencies |
|---|---|---|
| `COD` | Coding & Languages | Python, Java, C++, TypeScript, Go, Rust, C#, PHP |
| `DSA` | Data Structures & Algorithms | Arrays, Trees, Graphs, Dynamic Programming, Big-O Complexity |
| `OOD` | Object-Oriented Design | SOLID Principles, Design Patterns, OOP Architecture |
| `APTI` | Aptitude & Logic | Quantitative Aptitude, Logical Reasoning, Analytical Thinking |
| `COMM` | Communication & Behavioral | Verbal, Written, Stakeholder Management, Team Leadership |
| `AI` | AI & Machine Learning | Machine Learning, Deep Learning, LLMs, NLP, Prompt Engineering |
| `CLOUD` | Cloud & DevOps | AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform |
| `SQL` | SQL & Databases | PostgreSQL, MySQL, MongoDB, Redis, Schema Normalization |
| `SWE` | Software Engineering & Web | React, Node.js, REST APIs, Git, Testing, Web Fundamentals |
| `SYSD` | System Design | Scalability, Microservices, Caching, Load Balancing, Reliability |
| `NETW` | Computer Networks | TCP/IP, HTTP/HTTPS, WebSockets, OSI Model, Network Security |
| `OS` | Operating Systems | Linux, Concurrency, Multithreading, Memory Management |
| `OTHER` | Specialized / Other | Domain tools, industry certifications, miscellaneous |

---

## 3. End-to-End Route Structure

| Route | Role / Module | Key Functions |
|---|---|---|
| `/` | Portal Overview | 5-Role Pipeline launchpad, company search, and category filter pills |
| `/jd-analytics` | Role 1: JD Analytics | File upload/paste, 12-category extraction, confidence & evidence view |
| `/resume-parser` | Role 2: Resume Parser | Resume ingestion, entity extraction, export to Profile Builder |
| `/profile-builder` | Role 3: Profile Builder | Real-time candidate profile editor, level sliders, export RADIX JSON |
| `/talent-check` | Role 4: Talent Check | Target company selection, 12-category bar comparison, study roadmap |
| `/skill-matching` | Role 5: Skill Matcher | Candidate vs. JD match score (0-100%), missing requirements, AI insights |
| `/company/intelligence` | Placement Intelligence | 22 deep corporate sections with scroll-spy navigation |
| `/company/skills` | Skill Intelligence | Bloom's taxonomy ladders (CU, AP, AS, EV, CR) with topic prerequisite locks |

---

## 4. API Endpoints (`server.ts`)

- `GET /api/health`: Health status and service configuration.
- `POST /api/v1/jd-analytics/analyze`: Analyzes Job Description text and returns 12-category structured JSON.
- `POST /api/v1/jd-analytics/validate`: Validates JD payload against RADIX contract schema.
- `POST /api/v1/resume-parser/parse`: Parses candidate resume and extracts contact, skills, and experience.
- `POST /api/v1/resume-parser/validate`: Validates CandidateProfile payload against RADIX contract schema.
- `GET /api/v1/talent-check/companies`: Returns all curated company hiring bar benchmarks.
- `POST /api/v1/talent-check/evaluate`: Evaluates CandidateProfile against selected company benchmark.
- `POST /api/v1/skill-matching/match`: Deterministic candidate vs. JD skill matching with optional Gemini AI strategic analysis.

---

## 5. Verification & Testing

Run full test suite:
```bash
npm test
```
The test suite validates:
- Authoritative RADIX schema contract compliance
- Canonical skill dictionary normalization and alias resolution
- Role 1 & Role 2 deterministic document parsers
- Role 4 Talent Check scoring and topic recommendation generation
- Role 5 Candidate vs. JD skill comparison engine
- Complete End-to-End Pipeline integration (Roles 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4 $\rightarrow$ 5)
- Smoke tests for institutional company placement profiles
