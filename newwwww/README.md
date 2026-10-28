# RADIX Talent Match — Role 2: Resume Parsing

> **Autonomous, Integration-Ready Python Backend Component**  
> Implements **Role 2: Resume Parsing** of the RADIX Talent Match hackathon platform.  
> 📄 **Complete Integration Manual**: See [INTEGRATION.md](file:///C:/Users/udaya_/.gemini/antigravity/scratch/resume_parser/INTEGRATION.md) for full endpoint and handoff specs.

---

## 1. Overview & Scope

The **RADIX Resume Parser** is an independent, production-grade microservice responsible for converting unstructured candidate resumes (in **PDF** and **DOCX** formats) into validated, structured JSON conforming strictly to the **RADIX Shared Data Contract**.

### Isolated Responsibility:
- **Role 1 (JD Analytics)**: Extracts required skills from Job Descriptions.
- **Role 2 (Resume Parsing — THIS SERVICE)**: Extracts candidate information, verified skills, evidence, education, projects, experience, internships, hackathons, and certifications from resumes.
- **Role 3 (Profile Builder)**: Consumes output from Role 2 to populate candidate profiles.
- **Role 4 (Talent Check)**: Evaluates candidate competency against company hiring bars.
- **Role 5 (Skill Matching)**: Compares extracted resume skills against JD requirements.

This component does not implement JD Analytics, Profile Building, company scoring, candidate ranking, or frontend UI. It is decoupled, testable, and immediately integration-ready.

---

## 2. Architecture & Pipeline

The parser operates via a strict two-stage extraction pipeline:

```
                  Uploaded Resume (PDF / DOCX)
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │       Security & Validation Guard         │
        │ • Filename sanitization (anti-traversal)  │
        │ • Magic byte verification (%PDF-, PK\x03) │
        │ • Bounded 64 KB chunk read (Max 10 MB)    │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
    ┌───────────────────────────────────────────────────┐
    │       STAGE A: Document Text Extraction           │
    │  • PyMuPDF (fitz) for PDF text layers             │
    │  • python-docx for DOCX paragraphs & tables       │
    │  • Scanned/Image-only PDF detection (No fake OCR) │
    └─────────────────────────┬─────────────────────────┘
                              │
                              ▼
    ┌───────────────────────────────────────────────────┐
    │     STAGE B: Semantic Extraction & Normalization  │
    │  • Native LLM Mode (OpenAI, Anthropic, Groq)      │
    │  • Deterministic Fallback Mode (No API keys req)  │
    │  • Prompt injection resistance (untrusted text)   │
    │  • Grounded verbatim evidence (no hallucinations) │
    │  • Canonical skill normalization & deduplication  │
    │  • Mapping to 12 RADIX categories + OTHER         │
    └─────────────────────────┬─────────────────────────┘
                              │
                              ▼
                Validated JSON Output (v1.0)
```

---

## 3. Mandatory RADIX Shared Data Contract

Every extracted skill is classified into one of the **12 authoritative RADIX categories** (or `OTHER`):

| Code | Category Name | Description & Typical Technologies |
|:---|:---|:---|
| **COD** | Coding | C, C++, Java, Python, Go, Rust, JavaScript, TypeScript, Bash, HTML/CSS |
| **DSA** | Data Structures & Algorithms | Arrays, Trees, Graphs, Dynamic Programming, Sorting, Competitive Programming |
| **OOD** | Object-Oriented Design | OOP, Design Patterns (Factory, Strategy), Low-Level Design (LLD), SOLID |
| **APTI** | Aptitude | Logical Reasoning, Quantitative Analysis, Analytical Problem Solving |
| **COMM** | Communication | Technical Writing, Presentation, Mentoring, Team Leadership |
| **AI** | Artificial Intelligence | Machine Learning, Deep Learning, NLP, scikit-learn, PyTorch, TensorFlow, Statistics, A/B Testing |
| **CLOUD** | Cloud | AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform |
| **SQL** | SQL & Relational Databases | PostgreSQL, MySQL, SQLite, Oracle DB, Schema Normalization, Relational Queries |
| **SWE** | Software Engineering | Git, Version Control, Unit Testing, Agile, SDLC, Ticketing Tools, IT Support |
| **SYSD** | System Design | Distributed Systems, Microservices, Redis, Caching, Pub-Sub, Kafka, Rate Limiting |
| **NETW** | Networking | Computer Networks, TCP/IP, HTTP/HTTPS, WebSockets, DNS, Cisco Networking |
| **OS** | Operating Systems | Linux, Unix, Process Scheduling, Multithreading, Concurrency, Memory Management |
| **OTHER** | Other | Business tools, Excel, Power BI, Tableau, UI/UX, or non-technical domains |

### Core Skill Object Specification
```json
{
  "skill_name": "Python",
  "category_code": "COD",
  "evidence": "Listed under Technical Skills: 'C++, Python, Java'",
  "confidence": "high"
}
```
- `category_code`: Must be one of `COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS, OTHER`.
- `confidence`: Must be one of `high, medium, low` (reflects extraction certainty, **not** candidate skill level).
- `evidence`: Direct verbatim quote or verifiable trace from the resume text.

---

## 4. Prerequisites & Installation

### Requirements
- Python 3.11 or later
- Standard operating systems: Windows 10/11, macOS, or Linux

### Installation Steps

#### Windows Command Prompt (cmd.exe):
```cmd
cd /d C:\Users\udaya_\.gemini\antigravity\scratch\resume_parser
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

#### Windows PowerShell:
```powershell
Set-Location -Path "C:\Users\udaya_\.gemini\antigravity\scratch\resume_parser"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

#### Linux / macOS:
```bash
cd resume_parser
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## 5. Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Environment Variables

| Variable | Type | Default | Description |
|:---|:---|:---|:---|
| `APP_ENV` | string | `development` | Environment name (`development`, `staging`, `production`) |
| `MAX_UPLOAD_SIZE_MB` | int | `10` | Maximum allowed upload size in megabytes |
| `LLM_ENABLED` | bool | `false` | Enable or disable upstream LLM semantic extraction |
| `LLM_PROVIDER` | string | `openai` | LLM provider (`openai`, `anthropic`, `groq`) |
| `LLM_MODEL` | string | `gpt-4o-mini` | Model name |
| `LLM_API_KEY` | string | `""` | API key (leave blank for local no-key deterministic parsing) |
| `LLM_TIMEOUT_SECONDS` | int | `30` | Request timeout for LLM calls |
| `LOG_LEVEL` | string | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `RATE_LIMIT_PER_MINUTE`| int | `60` | In-memory sliding window request limit per client IP |

> **Note on Zero-Credential Local Development:**  
> When `LLM_ENABLED=false` or `LLM_API_KEY` is not provided, the application starts normally and operates in **Deterministic Fallback Mode**. No API keys, external networks, or paid accounts are required.

---

## 6. Running the Service

Start the FastAPI application with Uvicorn:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running:
- **Interactive OpenAPI/Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI JSON Spec**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 7. Running Automated Tests

Run the full automated test suite using `pytest`:

```bash
pytest tests/ -v
```

To run a specific test suite:
```bash
pytest tests/test_schemas.py -v
pytest tests/test_document_extractor.py -v
pytest tests/test_resume_parser.py -v
pytest tests/test_api.py -v
pytest tests/test_security.py -v
```

All tests execute in-memory with synthetic fixtures. No paid API calls or live network connections are made.

---

## 8. API Endpoints

### 1. `GET /health`
Returns high-level service status without leaking configuration or secrets.
```bash
curl -X GET http://127.0.0.1:8000/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "app_env": "development"
}
```

---

### 2. `GET /api/v1/resume-parser/health`
Returns parser readiness, supported formats, and operational flags.
```bash
curl -X GET http://127.0.0.1:8000/api/v1/resume-parser/health
```
**Response (200 OK):**
```json
{
  "status": "ready",
  "supported_formats": ["pdf", "docx"],
  "max_upload_size_mb": 10,
  "llm_enabled": false,
  "llm_provider": null,
  "llm_model": null
}
```

---

### 3. `POST /api/v1/resume-parser/parse`
Accepts a multipart file upload (`file`) containing a PDF or DOCX resume.

#### Using `curl`:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/resume-parser/parse \
  -F "file=@sample_data/PDF/Ananya Rao.pdf"
```

#### Using Python `requests`:
```python
import requests

url = "http://127.0.0.1:8000/api/v1/resume-parser/parse"
with open("sample_data/PDF/Ananya Rao.pdf", "rb") as f:
    files = {"file": ("Ananya Rao.pdf", f, "application/pdf")}
    response = requests.post(url, files=files)

parsed_data = response.json()
print("Candidate Name:", parsed_data["candidate"]["name"])
print("Total Skills:", len(parsed_data["skills"]))
```

---

### 4. `POST /api/v1/resume-parser/validate`
Validates an existing candidate JSON payload against the RADIX contract.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/resume-parser/validate \
  -H "Content-Type: application/json" \
  -d '{
    "schema_version": "1.0",
    "source_type": "resume",
    "source_file": "candidate.pdf",
    "candidate": {"name": "Alice", "email": null, "phone": null, "location": null},
    "company": null,
    "role": null,
    "skills": [
      {
        "skill_name": "Python",
        "category_code": "COD",
        "evidence": "Built backend in Python",
        "confidence": "high"
      }
    ],
    "education": [],
    "projects": [],
    "experience": [],
    "hackathons": [],
    "internships": [],
    "certifications": [],
    "preferred_roles": [],
    "cv_file": "candidate.pdf",
    "metadata": {"status": "success", "extraction_method": "text", "warnings": [], "skill_count": 1}
  }'
```

**Response (200 OK):**
```json
{
  "valid": true,
  "status": "valid",
  "errors": [],
  "summary": {
    "candidate_name": "Alice",
    "skill_count": 1,
    "education_count": 0,
    "projects_count": 0,
    "experience_count": 0
  }
}
```

---

## 9. Output JSON Schema & Example

```json
{
  "schema_version": "1.0",
  "source_type": "resume",
  "source_file": "Ananya Rao.pdf",
  "candidate": {
    "name": "Ananya Rao",
    "email": null,
    "phone": null,
    "location": null
  },
  "company": null,
  "role": null,
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "Listed under Technical Skills: 'C++, Python, Java...'",
      "confidence": "high"
    },
    {
      "skill_name": "Data Structures & Algorithms",
      "category_code": "DSA",
      "evidence": "Listed under Technical Skills: 'C++, Python, Java, Data Structures & Algorithms...'",
      "confidence": "high"
    },
    {
      "skill_name": "Redis",
      "category_code": "SYSD",
      "evidence": "Built a distributed URL-shortening service with a Redis-backed cache",
      "confidence": "medium"
    }
  ],
  "education": [
    {
      "institution": null,
      "degree": "B.Tech",
      "field_of_study": "Computer Science and Engineering",
      "start_date": null,
      "end_date": "2026",
      "grade": "8.6 / 10",
      "evidence": "B.Tech, Computer Science and Engineering, Class of 2026 — CGPA 8.6 / 10"
    }
  ],
  "projects": [
    {
      "name": "Built a distributed URL-shortening service",
      "description": "Built a distributed URL-shortening service with a Redis-backed cache and a horizontally-scalable API layer",
      "technologies": ["Redis"],
      "responsibilities": [],
      "evidence": "Built a distributed URL-shortening service with a Redis-backed cache..."
    }
  ],
  "experience": [
    {
      "organization": null,
      "job_title": "Intern",
      "employment_type": "internship",
      "start_date": null,
      "end_date": null,
      "description": "Summer intern, backend team at a mid-size product startup — shipped a rate-limiter used in production",
      "technologies": [],
      "evidence": "Summer intern, backend team at a mid-size product startup..."
    }
  ],
  "hackathons": [
    {
      "name": "Finalist, national-level 24-hour hackathon",
      "award_or_role": "Finalist",
      "description": "Finalist, national-level 24-hour hackathon — built a real-time chat backend",
      "evidence": "Finalist, national-level 24-hour hackathon — built a real-time chat backend"
    }
  ],
  "internships": [
    {
      "organization": null,
      "role": "Intern",
      "start_date": null,
      "end_date": null,
      "description": "Summer intern, backend team at a mid-size product startup — shipped a rate-limiter used in production",
      "technologies": [],
      "evidence": "Summer intern, backend team at a mid-size product startup..."
    }
  ],
  "certifications": [],
  "preferred_roles": ["Software Engineer", "Backend Engineer"],
  "cv_file": "Ananya Rao.pdf",
  "metadata": {
    "status": "success",
    "extraction_method": "deterministic_fallback",
    "warnings": [
      "LLM extraction disabled or unconfigured; extracted using deterministic fallback engine."
    ],
    "skill_count": 14
  }
}
```

---

## 10. HTTP Status Codes & Error Handling

All error responses return a standardized JSON structure:
```json
{
  "error": "InvalidFileFormatError",
  "message": "Unsupported file extension '.txt'. Only .pdf and .docx are supported.",
  "details": {"allowed_extensions": [".pdf", ".docx"]}
}
```

| HTTP Status | Trigger Condition |
|:---|:---|
| **200 OK** | Successful document parse or payload validation. |
| **400 Bad Request** | Unsupported extension, corrupt document, empty file (0 bytes), or content mismatch. |
| **413 Payload Too Large** | Upload size exceeds configured `MAX_UPLOAD_SIZE_MB`. |
| **422 Unprocessable** | Image-only/scanned PDF (OCR unsupported), or invalid candidate schema payload. |
| **429 Too Many Requests** | Client rate limit exceeded or upstream LLM provider rate limit. |
| **502 Bad Gateway** | Upstream LLM provider failure or malformed provider response. |
| **503 Unavailable** | Parsing engine or upstream model service temporarily unavailable. |
| **500 Internal Error** | Unhandled server error (stack traces are masked; logged internally). |

---

## 11. Integration Guide for Role 3: Profile Builder

Role 3 (**Profile Builder**) consumes the output of Role 2. The data structure aligns directly with the Candidate Profile contract defined on **Page 10 of the RADIX Hackathon Brief**.

### Downstream Field Mapping:

| Profile Builder Field | Resume Parser JSON Source | Data Type |
|:---|:---|:---|
| `name` | `response["candidate"]["name"]` | `string` or `null` |
| `email` | `response["candidate"]["email"]` | `string` or `null` |
| `education` | `response["education"]` | `Array<EducationEntry>` |
| `skills` | `response["skills"]` | `Array<Skill>` (conforms to 12 categories) |
| `hackathons` | `response["hackathons"]` | `Array` |
| `internships` | `response["internships"]` | `Array` |
| `certifications` | `response["certifications"]` | `Array` |
| `preferred_roles` | `response["preferred_roles"]` | `Array<string>` |
| `cv_file` | `response["cv_file"]` | `string` |

### Python Integration Example for Profile Builder:
```python
import requests

def fetch_prefilled_profile(resume_filepath: str) -> dict:
    """Call Role 2 (Resume Parser) and format candidate profile for Role 3."""
    with open(resume_filepath, "rb") as f:
        files = {"file": f}
        res = requests.post("http://127.0.0.1:8000/api/v1/resume-parser/parse", files=files)
        res.raise_for_status()
        parsed = res.json()

    # Direct handoff into Role 3 profile shape
    profile = {
        "name": parsed["candidate"]["name"],
        "email": parsed["candidate"]["email"],
        "education": parsed["education"],
        "skills": parsed["skills"],
        "hackathons": parsed["hackathons"],
        "internships": parsed["internships"],
        "certifications": parsed["certifications"],
        "preferred_roles": parsed["preferred_roles"],
        "cv_file": parsed["cv_file"],
    }
    return profile
```

No internal code imports, shared databases, or coupled dependencies are required. Communication is achieved cleanly via HTTP and JSON.

