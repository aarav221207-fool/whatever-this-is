"""End-to-end API tests for FastAPI routes and endpoints.
"""
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.test_document_extractor import make_scanned_pdf, make_synthetic_docx, make_synthetic_pdf

client = TestClient(app)


class TestAPIEndpoints:
    """API endpoint integration test suite."""

    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "app_env" in data
        # Ensure no secrets leaked
        assert "LLM_API_KEY" not in data
        assert "api_key" not in data

    def test_parser_health_endpoint(self):
        resp = client.get("/api/v1/resume-parser/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ready"
        assert "pdf" in data["supported_formats"]
        assert "docx" in data["supported_formats"]
        assert "max_upload_size_mb" in data
        # Ensure no secrets leaked
        assert "api_key" not in data

    def test_parse_valid_pdf_end_to_end(self):
        resume_content = (
            "Ananya Rao\n"
            "Education\n"
            "B.Tech, Computer Science and Engineering, Class of 2026 — CGPA 8.6 / 10\n"
            "Technical Skills\n"
            "C++, Python, Java, Data Structures & Algorithms, Operating Systems, Computer Networks\n"
            "Projects\n"
            "Built a distributed URL-shortening service with Redis\n"
            "Hackathons / Internships\n"
            "Finalist, national-level 24-hour hackathon — built a real-time chat backend\n"
            "Summer intern, backend team at a mid-size product startup\n"
            "Preferred Roles\n"
            "Software Engineer, Backend Engineer\n"
        )
        pdf_bytes = make_synthetic_pdf(resume_content)

        files = {"file": ("Ananya Rao.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        resp = client.post("/api/v1/resume-parser/parse", files=files)

        assert resp.status_code == 200
        data = resp.json()

        # Contract requirements
        assert data["schema_version"] == "1.0"
        assert data["source_type"] == "resume"
        assert data["source_file"] == "Ananya Rao.pdf"
        assert data["cv_file"] == "Ananya Rao.pdf"
        assert data["candidate"]["name"] == "Ananya Rao"

        # Verify structured skills
        assert len(data["skills"]) > 0
        valid_cats = {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"}
        for s in data["skills"]:
            assert "skill_name" in s and s["skill_name"]
            assert "category_code" in s and s["category_code"] in valid_cats
            assert "evidence" in s and s["evidence"]
            assert "confidence" in s and s["confidence"] in ("high", "medium", "low")

        # Verify structured sections
        assert len(data["education"]) >= 1
        assert len(data["projects"]) >= 1
        assert len(data["hackathons"]) >= 1
        assert len(data["internships"]) >= 1
        assert "Software Engineer" in data["preferred_roles"]

        # Metadata
        assert data["metadata"]["status"] == "success"
        assert data["metadata"]["skill_count"] == len(data["skills"])

    def test_parse_valid_docx_end_to_end(self):
        paragraphs = [
            "Karthik Subramaniam",
            "Education",
            "B.Tech in Computer Science — CGPA 8.2 / 10",
            "Technical Skills",
            "SQL, Python (pandas, scikit-learn), Power BI",
            "Projects",
            "Built an end-to-end churn-prediction pipeline with logistic regression",
            "Preferred Roles",
            "Data Analyst, Data Scientist"
        ]
        docx_bytes = make_synthetic_docx(paragraphs)

        files = {"file": ("Karthik.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        resp = client.post("/api/v1/resume-parser/parse", files=files)

        assert resp.status_code == 200
        data = resp.json()
        assert data["candidate"]["name"] == "Karthik Subramaniam"
        skill_names = [s["skill_name"] for s in data["skills"]]
        assert "SQL" in skill_names
        assert "Python" in skill_names

    def test_parse_unsupported_file_extension(self):
        files = {"file": ("resume.txt", io.BytesIO(b"Hello world"), "text/plain")}
        resp = client.post("/api/v1/resume-parser/parse", files=files)
        assert resp.status_code == 400
        data = resp.json()
        assert data["error"] == "InvalidFileFormatError"
        assert "Unsupported file extension" in data["message"]

    def test_parse_scanned_pdf_returns_422(self):
        scanned_bytes = make_scanned_pdf()
        files = {"file": ("scanned.pdf", io.BytesIO(scanned_bytes), "application/pdf")}
        resp = client.post("/api/v1/resume-parser/parse", files=files)
        assert resp.status_code == 422
        data = resp.json()
        assert data["error"] == "DocumentExtractionError"
        assert "OCR is not supported" in data["message"]

    def test_parse_oversized_upload_returns_413(self):
        """Bounded chunk reader must stop and return 413 when upload exceeds limit."""
        from unittest.mock import patch
        from app.config import settings

        # Temporarily mock max size to 100 bytes
        with patch.object(settings, "MAX_UPLOAD_SIZE_MB", 1), patch.object(SettingsWrapper := type(settings), "max_upload_size_bytes", 100):
            big_data = b"%PDF-1.4 " + b"X" * 500
            files = {"file": ("big.pdf", io.BytesIO(big_data), "application/pdf")}
            resp = client.post("/api/v1/resume-parser/parse", files=files)
            assert resp.status_code == 413
            data = resp.json()
            assert data["error"] == "FileTooLargeError"

    def test_validate_endpoint_success(self):
        valid_payload = {
            "schema_version": "1.0",
            "source_type": "resume",
            "source_file": "candidate.pdf",
            "candidate": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phone": None,
                "location": None
            },
            "company": None,
            "role": None,
            "skills": [
                {
                    "skill_name": "Python",
                    "category_code": "COD",
                    "evidence": "Built API in Python",
                    "confidence": "high"
                }
            ],
            "education": [],
            "projects": [],
            "experience": [],
            "hackathons": [],
            "internships": [],
            "certifications": [],
            "preferred_roles": ["Software Engineer"],
            "cv_file": "candidate.pdf",
            "metadata": {
                "status": "success",
                "extraction_method": "text",
                "warnings": [],
                "skill_count": 1
            }
        }
        resp = client.post("/api/v1/resume-parser/validate", json=valid_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["status"] == "valid"
        assert len(data["errors"]) == 0
        assert data["summary"]["candidate_name"] == "Jane Doe"
        assert data["summary"]["skill_count"] == 1

    def test_validate_endpoint_failure_on_invalid_data(self):
        invalid_payload = {
            "source_type": "jd",  # Must be 'resume'
            "source_file": "test.pdf",
            "skills": [
                {
                    "skill_name": "Python",
                    "category_code": "NOT_A_VALID_CATEGORY",
                    "evidence": "Used Python",
                    "confidence": "super_high"
                }
            ],
            "cv_file": "test.pdf"
        }
        resp = client.post("/api/v1/resume-parser/validate", json=invalid_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert data["status"] == "invalid"
        assert len(data["errors"]) > 0

