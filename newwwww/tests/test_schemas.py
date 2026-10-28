"""Tests for Pydantic v2 schemas and the RADIX shared data contract.
"""
import pytest
from pydantic import ValidationError

from app.schemas import (
    CandidateInfo,
    EducationEntry,
    ExtractionConfidence,
    ExtractionMetadata,
    ProjectEntry,
    ResumeParseResponse,
    Skill,
    SkillCategory,
)
from app.services.normalization import deduplicate_skills, normalize_skill_name, resolve_category


class TestSchemas:
    """Test suite verifying RADIX schema rules and constraints."""

    def test_valid_radix_skill_object(self):
        skill = Skill(
            skill_name="Python",
            category_code=SkillCategory.COD,
            evidence="Used Python for data pipelines.",
            confidence=ExtractionConfidence.high,
        )
        assert skill.skill_name == "Python"
        assert skill.category_code == "COD"
        assert skill.confidence == "high"
        assert "Python" in skill.evidence

    def test_all_12_radix_categories_supported(self):
        expected_categories = {"COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"}
        actual_categories = {c.value for c in SkillCategory}
        assert expected_categories == actual_categories

    def test_invalid_skill_category_code(self):
        with pytest.raises(ValidationError) as exc_info:
            Skill(
                skill_name="Python",
                category_code="INVALID_CAT",  # Not in 12 categories or OTHER
                evidence="Some evidence",
                confidence=ExtractionConfidence.high,
            )
        assert "category_code" in str(exc_info.value)

    def test_invalid_confidence_value(self):
        with pytest.raises(ValidationError) as exc_info:
            Skill(
                skill_name="Python",
                category_code=SkillCategory.COD,
                evidence="Some evidence",
                confidence="expert",  # Not high/medium/low
            )
        assert "confidence" in str(exc_info.value)

    def test_missing_required_skill_fields(self):
        # Missing evidence
        with pytest.raises(ValidationError):
            Skill(
                skill_name="Python",
                category_code=SkillCategory.COD,
                confidence=ExtractionConfidence.high,
            )

        # Empty whitespace evidence
        with pytest.raises(ValidationError):
            Skill(
                skill_name="Python",
                category_code=SkillCategory.COD,
                evidence="   ",
                confidence=ExtractionConfidence.high,
            )

    def test_candidate_info_defaults_to_null_not_fabricated(self):
        cand = CandidateInfo()
        assert cand.name is None
        assert cand.email is None
        assert cand.phone is None
        assert cand.location is None

    def test_collections_default_to_empty_arrays(self):
        response = ResumeParseResponse(
            source_file="test_resume.pdf",
            cv_file="test_resume.pdf",
        )
        assert response.skills == []
        assert response.education == []
        assert response.projects == []
        assert response.experience == []
        assert response.hackathons == []
        assert response.internships == []
        assert response.certifications == []
        assert response.preferred_roles == []
        assert response.source_type == "resume"
        assert response.company is None
        assert response.role is None
        assert response.metadata.status == "success"
        assert response.metadata.skill_count == 0

    def test_skill_count_auto_sync(self):
        skill = Skill(
            skill_name="PostgreSQL",
            category_code=SkillCategory.SQL,
            evidence="Managed PostgreSQL clusters.",
            confidence=ExtractionConfidence.high,
        )
        response = ResumeParseResponse(
            source_file="test.pdf",
            cv_file="test.pdf",
            skills=[skill],
        )
        assert response.metadata.skill_count == 1

    def test_skill_deduplication(self):
        s1 = Skill(
            skill_name="Python",
            category_code=SkillCategory.COD,
            evidence="Short mention in skills.",
            confidence=ExtractionConfidence.medium,
        )
        s2 = Skill(
            skill_name="Python",
            category_code=SkillCategory.COD,
            evidence="Implemented core backend services in Python.",
            confidence=ExtractionConfidence.high,
        )
        # Higher confidence should win
        deduped = deduplicate_skills([s1, s2])
        assert len(deduped) == 1
        assert deduped[0].confidence == ExtractionConfidence.high
        assert "Implemented core backend" in deduped[0].evidence

    def test_distinct_skills_preserved_during_deduplication(self):
        skills = [
            Skill(skill_name="C", category_code=SkillCategory.COD, evidence="Wrote C", confidence=ExtractionConfidence.high),
            Skill(skill_name="C++", category_code=SkillCategory.COD, evidence="Wrote C++", confidence=ExtractionConfidence.high),
            Skill(skill_name="Java", category_code=SkillCategory.COD, evidence="Wrote Java", confidence=ExtractionConfidence.high),
            Skill(skill_name="JavaScript", category_code=SkillCategory.COD, evidence="Wrote JS", confidence=ExtractionConfidence.high),
            Skill(skill_name="SQL", category_code=SkillCategory.SQL, evidence="Wrote SQL", confidence=ExtractionConfidence.high),
        ]
        deduped = deduplicate_skills(skills)
        assert len(deduped) == 5

