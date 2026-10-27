# RADIX Talent Match — Authoritative Shared Data Contract

## 1. Overview & Specification
The RADIX Talent Match platform establishes a strict, shared data contract among five roles:
- **Role 1**: Job Description (JD) Analytics
- **Role 2**: Resume Parsing
- **Role 3**: Candidate Profile Builder
- **Role 4**: Talent Check (Readiness Assessment)
- **Role 5**: Skill Matching Engine

All modules exchange data using JSON payloads validated against standard schemas.

---

## 2. RADIX Category Codes (12 Categories + OTHER)

| Code | Category Name | Description & Example Skills |
|---|---|---|
| `COD` | Coding & Languages | Python, Java, C++, TypeScript, JavaScript, Go, Rust |
| `DSA` | Data Structures & Algorithms | Arrays, Trees, Dynamic Programming, Graphs, Big-O |
| `OOD` | Object-Oriented Design | SOLID principles, Design Patterns, Encapsulation, Polymorphism |
| `APTI` | Aptitude & Logical Reasoning | Quantitative ability, logical puzzles, probability, data interpretation |
| `COMM` | Communication & Behavioral | Presentation, stakeholder management, leadership, teamwork |
| `AI` | Artificial Intelligence & ML | Machine Learning, Deep Learning, LLMs, NLP, PyTorch, LangChain |
| `CLOUD` | Cloud Computing | AWS, Azure, Google Cloud, Docker, Kubernetes, Terraform, Serverless |
| `SQL` | SQL & Databases | PostgreSQL, MySQL, MongoDB, Redis, Indexing, ACID, Query Optimization |
| `SWE` | Software Engineering & Web | React, Node.js, REST APIs, Git, CI/CD, Agile, Unit Testing |
| `SYSD` | System Design & Architecture | Microservices, Distributed Systems, Caching, Load Balancing, Kafka |
| `NETW` | Computer Networks | TCP/IP, HTTP/HTTPS, DNS, WebSockets, OSI Model, VPC |
| `OS` | Operating Systems | Linux, Concurrency, Multithreading, Memory Management, File Systems |
| `OTHER` | Specialized / Other | Domain-specific tools, industry certifications, miscellaneous |

---

## 3. Core Data Schemas

### 3.1. SkillItem
Every extracted skill across all roles adheres to this atomic structure:
```json
{
  "skill_name": "Python",
  "category_code": "COD",
  "confidence": "high",
  "evidence": "5+ years developing scalable REST microservices"
}
```
- `skill_name`: string (canonical title-case or common identifier).
- `category_code`: one of the 13 codes above (`COD` ... `OTHER`).
- `confidence`: `"high" | "medium" | "low"`.
- `evidence`: string (verbatim or summarized snippet from the document, e.g. bullet points or sentence).

### 3.2. Role 1: Job Description Response (`JobDescriptionResponse`)
```json
{
  "source_type": "jd",
  "source_file": "Software_Engineer_JD.pdf",
  "company": "Accenture",
  "role": "Senior Cloud Software Engineer",
  "skills": [
    {
      "skill_name": "Docker",
      "category_code": "CLOUD",
      "confidence": "high",
      "evidence": "Experience containerizing apps with Docker and K8s"
    }
  ],
  "required_skills": ["Docker", "Python", "PostgreSQL"],
  "preferred_skills": ["Kubernetes", "Kafka"],
  "experience_years_required": 3
}
```

### 3.3. Role 2 & 3: Candidate Profile (`CandidateProfile`)
```json
{
  "source_type": "candidate",
  "source_file": "candidate_resume.pdf",
  "name": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "phone": "+1 (555) 234-5678",
  "summary": "Full stack engineer specializing in distributed cloud systems.",
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "confidence": "high",
      "evidence": "Built backend services using FastAPI and PostgreSQL"
    }
  ],
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Tech Innovations Inc.",
      "duration": "2022 - Present",
      "description": "Architected event-driven microservices processing 1M events/day."
    }
  ]
}
```

### 3.4. Role 4: Talent Check Result (`TalentCheckResult`)
```json
{
  "company_id": 1,
  "company_name": "Accenture",
  "overall_readiness_score": 82,
  "verdict": "High Match",
  "category_scores": [
    {
      "category_code": "DSA",
      "category_name": "Data Structures & Algorithms",
      "candidate_level": 7,
      "company_required_level": 8,
      "status": "Marginal",
      "gap": -1,
      "recommended_topics": [
        "Graph algorithms: Dijkstra, Bellman-Ford, topological sort & Union-Find"
      ]
    }
  ],
  "critical_gaps": [],
  "strengths": ["COD", "SQL", "SWE"]
}
```

### 3.5. Role 5: Skill Match Result (`SkillMatchResult`)
```json
{
  "overall_match_score": 85,
  "verdict": "Strong Candidate",
  "matched_skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "Built backend services using FastAPI and PostgreSQL",
      "source": "exact"
    }
  ],
  "missing_required_skills": ["Kubernetes"],
  "missing_preferred_skills": ["Kafka"],
  "category_breakdown": [
    {
      "category_code": "COD",
      "category_name": "Coding & Languages",
      "required_count": 2,
      "matched_count": 2,
      "coverage_percentage": 100
    }
  ],
  "action_plan": [
    "Complete hands-on container orchestration labs with Kubernetes."
  ]
}
```

---

## 4. Normalization & Deduplication Rules
1. **Case-Insensitive Normalization**:
   All skill comparisons strip surrounding whitespace and normalize common aliases (e.g. `react.js` $\rightarrow$ `React`, `k8s` $\rightarrow$ `Kubernetes`, `postgres` $\rightarrow$ `PostgreSQL`).
2. **Confidence Weighting**:
   - `high`: weight $1.0$
   - `medium`: weight $0.75$
   - `low`: weight $0.5$
3. **Evidence Requirement**:
   Whenever possible, skills must retain verbatim snippet evidence to guarantee explainability and zero hallucination.
