"""Pydantic v2 schemas enforcing the RADIX Talent Match shared data contract.
"""
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator


class SkillCategory(str, Enum):
    """The 12 mandatory RADIX skill categories plus OTHER."""
    COD = "COD"      # Coding
    DSA = "DSA"      # Data Structures & Algorithms
    OOD = "OOD"      # Object-Oriented Design
    APTI = "APTI"    # Aptitude
    COMM = "COMM"    # Communication
    AI = "AI"        # Artificial Intelligence
    CLOUD = "CLOUD"  # Cloud
    SQL = "SQL"      # SQL
    SWE = "SWE"      # Software Engineering
    SYSD = "SYSD"    # System Design
    NETW = "NETW"    # Networking
    OS = "OS"        # Operating Systems
    OTHER = "OTHER"  # Fallback for anything outside the 12 categories


class ExtractionConfidence(str, Enum):
    """Extraction and classification confidence level."""
    high = "high"
    medium = "medium"
    low = "low"


class Skill(BaseModel):
    """Core skill object conforming to the RADIX shared data contract."""
    skill_name: str = Field(..., min_length=1, description="Normalized name of the skill or technology.")
    category_code: SkillCategory = Field(..., description="One of the 12 RADIX categories, or OTHER.")
    evidence: str = Field(..., min_length=1, description="Verbatim quote or direct evidence from the resume text.")
    confidence: ExtractionConfidence = Field(..., description="Extraction confidence: high, medium, or low.")

    @field_validator("skill_name")
    @classmethod
    def clean_skill_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("skill_name cannot be empty or whitespace only.")
        return s

    @field_validator("evidence")
    @classmethod
    def clean_evidence(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("evidence cannot be empty or whitespace only.")
        return s


class CandidateInfo(BaseModel):
    """Candidate contact and demographic information."""
    name: Optional[str] = Field(default=None, description="Candidate full name if stated.")
    email: Optional[str] = Field(default=None, description="Candidate email address if stated.")
    phone: Optional[str] = Field(default=None, description="Candidate phone number if stated.")
    location: Optional[str] = Field(default=None, description="Candidate location if stated.")


class EducationEntry(BaseModel):
    """Academic qualification entry."""
    institution: Optional[str] = Field(default=None, description="University, college, or school name.")
    degree: Optional[str] = Field(default=None, description="Degree or certificate name (e.g., B.Tech).")
    field_of_study: Optional[str] = Field(default=None, description="Branch or major (e.g., Computer Science).")
    start_date: Optional[str] = Field(default=None, description="Start date/year if stated.")
    end_date: Optional[str] = Field(default=None, description="Graduation date/year or expected date.")
    grade: Optional[str] = Field(default=None, description="CGPA or grade if stated.")
    evidence: str = Field(..., min_length=1, description="Traceable excerpt from the resume.")


class ProjectEntry(BaseModel):
    """Project record."""
    name: str = Field(..., min_length=1, description="Name or title of the project.")
    description: Optional[str] = Field(default=None, description="Project summary supported by the resume.")
    technologies: List[str] = Field(default_factory=list, description="Technologies used in the project.")
    responsibilities: List[str] = Field(default_factory=list, description="Candidate responsibilities.")
    evidence: str = Field(..., min_length=1, description="Relevant excerpt from the resume.")


class ExperienceEntry(BaseModel):
    """Work experience record.

    Note: Internships are also captured here with employment_type='internship'
    to ensure full work history is available to downstream consumers querying experience.
    """
    organization: Optional[str] = Field(default=None, description="Employer or organization name.")
    job_title: Optional[str] = Field(default=None, description="Job title or designation.")
    employment_type: Optional[str] = Field(default=None, description="Employment type (e.g. 'full-time', 'internship', 'contract').")
    start_date: Optional[str] = Field(default=None, description="Start date if stated.")
    end_date: Optional[str] = Field(default=None, description="End date or 'Present' if stated.")
    description: Optional[str] = Field(default=None, description="Responsibilities supported by the resume.")
    technologies: List[str] = Field(default_factory=list, description="Technologies used in this role.")
    evidence: str = Field(..., min_length=1, description="Traceable excerpt from the resume.")


class InternshipEntry(BaseModel):
    """Structured internship record.

    Contains dedicated internship records conforming to the Role 3 Profile Builder contract.
    Each internship is also mirrored in the 'experience' list with employment_type='internship'.
    """
    organization: Optional[str] = Field(default=None, description="Organization or company name.")
    role: Optional[str] = Field(default=None, description="Internship role or title.")
    start_date: Optional[str] = Field(default=None, description="Start date if stated.")
    end_date: Optional[str] = Field(default=None, description="End date if stated.")
    description: Optional[str] = Field(default=None, description="Internship description.")
    technologies: List[str] = Field(default_factory=list, description="Technologies used during internship.")
    evidence: str = Field(..., min_length=1, description="Traceable excerpt from the resume.")


class HackathonEntry(BaseModel):
    """Hackathon or competition record."""
    name: str = Field(..., min_length=1, description="Hackathon or competition name.")
    award_or_role: Optional[str] = Field(default=None, description="Achievement, rank, or award (e.g., Finalist).")
    description: Optional[str] = Field(default=None, description="Description of the project or participation.")
    evidence: str = Field(..., min_length=1, description="Traceable excerpt from the resume.")


class CertificationEntry(BaseModel):
    """Certification record."""
    name: str = Field(..., min_length=1, description="Certification title or course name.")
    issuer: Optional[str] = Field(default=None, description="Issuing organization (e.g. Cisco, Google).")
    evidence: str = Field(..., min_length=1, description="Traceable excerpt from the resume.")


class ExtractionMetadata(BaseModel):
    """Diagnostic and processing metadata."""
    status: str = Field(default="success", description="Overall parsing status ('success' or 'partial').")
    extraction_method: str = Field(default="text", description="Method used: 'llm', 'deterministic_fallback', or 'text'.")
    warnings: List[str] = Field(default_factory=list, description="Operational warnings or limitations encountered.")
    skill_count: int = Field(default=0, description="Total number of extracted skills.")


class ResumeParseResponse(BaseModel):
    """Primary response schema specified by the RADIX Hackathon brief (Role 2)."""
    schema_version: str = Field(default="1.0", description="Contract version.")
    source_type: Literal["resume"] = Field(default="resume", description="Always 'resume'.")
    source_file: str = Field(..., description="Sanitized original document filename.")
    candidate: CandidateInfo = Field(default_factory=CandidateInfo, description="Candidate details.")
    company: Optional[str] = Field(default=None, description="Current employer if explicitly identifiable, otherwise null.")
    role: Optional[str] = Field(default=None, description="Current role if explicitly identifiable, otherwise null.")
    skills: List[Skill] = Field(default_factory=list, description="Structured skill list.")
    education: List[EducationEntry] = Field(default_factory=list, description="Academic qualifications.")
    projects: List[ProjectEntry] = Field(default_factory=list, description="Projects and their technologies.")
    experience: List[ExperienceEntry] = Field(default_factory=list, description="Professional experience.")
    hackathons: List[Union[HackathonEntry, Dict[str, Any], str]] = Field(default_factory=list, description="Hackathons and competitions.")
    internships: List[Union[InternshipEntry, Dict[str, Any], str]] = Field(default_factory=list, description="Internship records.")
    certifications: List[Union[CertificationEntry, Dict[str, Any], str]] = Field(default_factory=list, description="Certifications.")
    preferred_roles: List[str] = Field(default_factory=list, description="Preferred or target roles explicitly stated.")
    cv_file: str = Field(..., description="Sanitized original filename, matching source_file.")
    metadata: ExtractionMetadata = Field(default_factory=ExtractionMetadata, description="Processing metadata.")

    @model_validator(mode="after")
    def sync_skill_count(self) -> "ResumeParseResponse":
        self.metadata.skill_count = len(self.skills)
        return self


class ValidationErrorDetail(BaseModel):
    """Actionable validation error description for a specific field."""
    loc: List[Union[str, int]] = Field(..., description="Field path causing validation error.")
    msg: str = Field(..., description="Descriptive error message.")
    type: str = Field(..., description="Error type code.")


class ValidatePayloadResponse(BaseModel):
    """Response returned by the /validate endpoint."""
    valid: bool = Field(..., description="True if payload completely matches the RADIX contract.")
    status: Literal["valid", "invalid"] = Field(..., description="'valid' or 'invalid'.")
    errors: List[ValidationErrorDetail] = Field(default_factory=list, description="Field-level validation errors.")
    summary: Optional[Dict[str, Any]] = Field(default=None, description="Summary counts when valid.")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    app_env: str = "development"


class ParserHealthResponse(BaseModel):
    """Parser readiness response."""
    status: str = "ready"
    supported_formats: List[str] = Field(default_factory=lambda: ["pdf", "docx"])
    max_upload_size_mb: int = 10
    llm_enabled: bool = False
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None

