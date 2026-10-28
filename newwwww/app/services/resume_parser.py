"""Resume parser service orchestrating document extraction, semantic extraction,
deterministic fallback, and RADIX schema validation.
"""
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from app.config import settings
from app.exceptions import DocumentExtractionError, LLMExtractionError
from app.schemas import (
    CandidateInfo,
    CertificationEntry,
    EducationEntry,
    ExperienceEntry,
    ExtractionConfidence,
    ExtractionMetadata,
    HackathonEntry,
    InternshipEntry,
    ProjectEntry,
    ResumeParseResponse,
    Skill,
    SkillCategory,
)
from app.services.document_extractor import DocumentExtractor
from app.services.llm_extractor import LLMExtractor
from app.services.normalization import (
    CANONICAL_SKILL_CATALOG,
    deduplicate_skills,
    normalize_skill_name,
    resolve_category,
)
from app.utils.logging_config import logger
from app.utils.security import detect_file_type, sanitize_filename, validate_file_size


class ResumeParserService:
    """End-to-end resume parsing service supporting PDF and DOCX documents."""

    def __init__(self, llm_extractor: Optional[LLMExtractor] = None):
        self.llm_extractor = llm_extractor or LLMExtractor()

    def parse_document(self, content: bytes, original_filename: str) -> ResumeParseResponse:
        """Parse resume bytes into a validated RADIX ResumeParseResponse object.

        Stage A: Validate format, size, and extract document text.
        Stage B: Semantic extraction via LLM or deterministic fallback.
        """
        # Validate filename and size
        sanitized_name = sanitize_filename(original_filename)
        validate_file_size(len(content))

        # Detect and verify file content magic bytes
        file_type = detect_file_type(content, sanitized_name)

        # STAGE A: Document Extraction
        extracted_text, doc_warnings = DocumentExtractor.extract(content, file_type)
        logger.info(
            "Extracted %d characters from document: %s (type: %s)",
            len(extracted_text), sanitized_name, file_type
        )

        # STAGE B: Semantic Extraction
        warnings = list(doc_warnings)
        extraction_method = "text"

        if self.llm_extractor.is_configured():
            try:
                raw_llm_data = self.llm_extractor.extract_structured_resume(extracted_text, sanitized_name)
                response = self._build_response_from_llm(raw_llm_data, sanitized_name, warnings, extracted_text)
                return response
            except LLMExtractionError as e:
                # Upstream LLM failure: never silently switch to fallback and pretend full LLM succeeded
                logger.error("LLM semantic extraction failed: %s", e.message)
                raise e

        # LLM disabled or unconfigured: use deterministic fallback
        warnings.append("LLM extraction disabled or unconfigured; extracted using deterministic fallback engine.")
        response = self.parse_deterministic(extracted_text, sanitized_name, warnings)
        return response

    def _verify_and_trace_evidence(
        self,
        skill_name: str,
        raw_evidence: Optional[str],
        resume_text: str,
        warnings: List[str]
    ) -> Optional[str]:
        """Verify that skill evidence is genuinely traceable to the extracted resume text.

        Never fabricates generic statements like 'Evidence found in resume for X'.
        Returns a short verbatim source excerpt, or None if unsupported.
        """
        if not skill_name or not resume_text:
            return None

        # 1. If explicit evidence was supplied by model, verify it exists in the resume text
        if raw_evidence and raw_evidence.strip():
            clean_ev = raw_evidence.strip()
            # Direct or case-insensitive presence in resume text
            if clean_ev.lower() in resume_text.lower():
                return clean_ev

            # Substring/clause presence in resume lines
            clean_lower = clean_ev.lower()
            for line in resume_text.splitlines():
                line_str = line.strip()
                if not line_str:
                    continue
                line_lower = line_str.lower()
                if line_lower in clean_lower or clean_lower in line_lower:
                    return line_str

        # 2. Check if the skill name appears in resume text with word boundaries
        escaped_name = re.escape(skill_name.lower())
        pattern = r"\b" + escaped_name + r"\b"
        if "+" in skill_name or "#" in skill_name:
            pattern = re.escape(skill_name.lower())

        for line in resume_text.splitlines():
            line_str = line.strip()
            if not line_str:
                continue
            if re.search(pattern, line_str.lower()):
                return line_str

        # 3. If neither evidence nor skill name appears in resume text, omit it
        warnings.append(f"Omitted unevidenced skill '{skill_name}' (no traceable evidence in resume text).")
        return None

    def _build_response_from_llm(
        self,
        data: Dict[str, Any],
        source_file: str,
        initial_warnings: List[str],
        extracted_text: str
    ) -> ResumeParseResponse:
        """Validate, normalize, and ground LLM structured output into ResumeParseResponse."""
        warnings = list(initial_warnings)

        # Parse skills and ensure strict schema compliance & evidence grounding
        raw_skills = data.get("skills", [])
        validated_skills: List[Skill] = []
        for s in raw_skills:
            if not isinstance(s, dict):
                continue
            raw_name = str(s.get("skill_name", "")).strip()
            name = normalize_skill_name(raw_name)
            if not name:
                continue

            raw_ev = str(s.get("evidence", "")).strip()
            # Strictly ground evidence in extracted resume text; omit if unsupported
            ev = self._verify_and_trace_evidence(name, raw_ev, extracted_text, warnings)
            if not ev:
                continue

            cat = resolve_category(name, s.get("category_code"))
            conf = s.get("confidence", "medium")
            if conf not in ("high", "medium", "low"):
                conf = "medium"

            validated_skills.append(
                Skill(
                    skill_name=name,
                    category_code=cat,
                    evidence=ev,
                    confidence=ExtractionConfidence(conf)
                )
            )

        deduped_skills = deduplicate_skills(validated_skills)

        # Candidate info
        cand_dict = data.get("candidate") or {}
        candidate = CandidateInfo(
            name=cand_dict.get("name"),
            email=cand_dict.get("email"),
            phone=cand_dict.get("phone"),
            location=cand_dict.get("location"),
        )

        # Education
        education: List[EducationEntry] = []
        for ed in data.get("education", []):
            if isinstance(ed, dict) and ed.get("evidence"):
                education.append(
                    EducationEntry(
                        institution=ed.get("institution"),
                        degree=ed.get("degree"),
                        field_of_study=ed.get("field_of_study"),
                        start_date=ed.get("start_date"),
                        end_date=ed.get("end_date"),
                        grade=ed.get("grade"),
                        evidence=ed.get("evidence"),
                    )
                )

        # Projects
        projects: List[ProjectEntry] = []
        for p in data.get("projects", []):
            if isinstance(p, dict) and p.get("name") and p.get("evidence"):
                projects.append(
                    ProjectEntry(
                        name=p.get("name"),
                        description=p.get("description"),
                        technologies=p.get("technologies") or [],
                        responsibilities=p.get("responsibilities") or [],
                        evidence=p.get("evidence"),
                    )
                )

        # Internships
        internships: List[InternshipEntry] = []
        for item in data.get("internships", []):
            if isinstance(item, dict) and item.get("evidence"):
                internships.append(
                    InternshipEntry(
                        organization=item.get("organization"),
                        role=item.get("role") or item.get("job_title") or "Intern",
                        start_date=item.get("start_date"),
                        end_date=item.get("end_date"),
                        description=item.get("description"),
                        technologies=item.get("technologies") or [],
                        evidence=item.get("evidence"),
                    )
                )
            elif isinstance(item, str) and item.strip():
                internships.append(
                    InternshipEntry(
                        organization=None,
                        role="Intern",
                        description=item.strip(),
                        technologies=[],
                        evidence=item.strip(),
                    )
                )

        # Experience
        experience: List[ExperienceEntry] = []
        for exp in data.get("experience", []):
            if isinstance(exp, dict) and exp.get("evidence"):
                experience.append(
                    ExperienceEntry(
                        organization=exp.get("organization"),
                        job_title=exp.get("job_title"),
                        employment_type=exp.get("employment_type") or "full-time",
                        start_date=exp.get("start_date"),
                        end_date=exp.get("end_date"),
                        description=exp.get("description"),
                        technologies=exp.get("technologies") or [],
                        evidence=exp.get("evidence"),
                    )
                )

        # Consistency: Mirror any internship in experience with employment_type="internship" if not already present
        exp_evidences = {e.evidence for e in experience}
        for intern in internships:
            if intern.evidence not in exp_evidences:
                experience.append(
                    ExperienceEntry(
                        organization=intern.organization,
                        job_title=intern.role or "Intern",
                        employment_type="internship",
                        start_date=intern.start_date,
                        end_date=intern.end_date,
                        description=intern.description,
                        technologies=intern.technologies,
                        evidence=intern.evidence,
                    )
                )

        # Hackathons & Certifications
        hackathons: List[HackathonEntry] = []
        for item in data.get("hackathons", []):
            if isinstance(item, dict) and item.get("name") and item.get("evidence"):
                hackathons.append(
                    HackathonEntry(
                        name=item.get("name"),
                        award_or_role=item.get("award_or_role"),
                        description=item.get("description"),
                        evidence=item.get("evidence"),
                    )
                )
            elif isinstance(item, str) and item.strip():
                hackathons.append(
                    HackathonEntry(
                        name=item.strip()[:60],
                        award_or_role=None,
                        description=item.strip(),
                        evidence=item.strip(),
                    )
                )

        certifications: List[CertificationEntry] = []
        for item in data.get("certifications", []):
            if isinstance(item, dict) and item.get("name") and item.get("evidence"):
                certifications.append(
                    CertificationEntry(
                        name=item.get("name"),
                        issuer=item.get("issuer"),
                        evidence=item.get("evidence"),
                    )
                )
            elif isinstance(item, str) and item.strip() and item.strip().lower() not in ("none", "none listed", "n/a", "no formal certifications listed"):
                certifications.append(
                    CertificationEntry(
                        name=item.strip(),
                        issuer=None,
                        evidence=item.strip(),
                    )
                )

        preferred_roles = [str(r).strip() for r in data.get("preferred_roles", []) if str(r).strip()]

        metadata = ExtractionMetadata(
            status="success",
            extraction_method="llm",
            warnings=warnings,
            skill_count=len(deduped_skills)
        )

        return ResumeParseResponse(
            schema_version="1.0",
            source_type="resume",
            source_file=source_file,
            candidate=candidate,
            company=data.get("company"),
            role=data.get("role"),
            skills=deduped_skills,
            education=education,
            projects=projects,
            experience=experience,
            hackathons=hackathons,
            internships=internships,
            certifications=certifications,
            preferred_roles=preferred_roles,
            cv_file=source_file,
            metadata=metadata,
        )

    def parse_deterministic(
        self,
        text: str,
        source_file: str,
        initial_warnings: Optional[List[str]] = None
    ) -> ResumeParseResponse:
        """Deterministic rule-based extraction engine for resume analysis.

        Segments document into sections, parses candidate details, extracts
        evidenced skills, qualifications, projects, experience, hackathons, and certifications.
        """
        warnings = list(initial_warnings or [])
        sections = self._segment_sections(text)

        # Extract Candidate Info
        candidate = self._extract_candidate_info(sections.get("HEADER", []), text)

        # Extract Education
        education = self._extract_education(sections.get("EDUCATION", []))

        # Extract Skills with verifiable evidence
        skills = self._extract_skills(sections)

        # Extract Projects
        projects = self._extract_projects(sections.get("PROJECTS", []))

        # Extract Experience, Internships, Hackathons
        experience, internships, hackathons = self._extract_experience_and_competitions(
            sections.get("EXPERIENCE", []) + sections.get("HACKATHONS / INTERNSHIPS", []) + sections.get("HACKATHONS", []) + sections.get("INTERNSHIPS", [])
        )

        # Extract Certifications
        certifications = self._extract_certifications(sections.get("CERTIFICATIONS", []))

        # Extract Preferred Roles
        preferred_roles = self._extract_preferred_roles(sections.get("PREFERRED ROLES", []))

        metadata = ExtractionMetadata(
            status="success",
            extraction_method="deterministic_fallback",
            warnings=warnings,
            skill_count=len(skills)
        )

        return ResumeParseResponse(
            schema_version="1.0",
            source_type="resume",
            source_file=source_file,
            candidate=candidate,
            company=None,  # Not fabricated
            role=None,     # Not fabricated
            skills=skills,
            education=education,
            projects=projects,
            experience=experience,
            hackathons=hackathons,
            internships=internships,
            certifications=certifications,
            preferred_roles=preferred_roles,
            cv_file=source_file,
            metadata=metadata,
        )

    def _segment_sections(self, text: str) -> Dict[str, List[str]]:
        """Divide resume lines into identified section buckets."""
        sections: Dict[str, List[str]] = {"HEADER": []}
        current_section = "HEADER"

        section_headers = {
            "EDUCATION": ["education", "academic qualification", "academics", "academic background"],
            "TECHNICAL SKILLS": ["technical skills", "skills", "technologies", "core competencies", "technical proficiency"],
            "PROJECTS": ["projects", "academic projects", "key projects", "personal projects"],
            "EXPERIENCE": ["experience", "work experience", "professional experience", "employment"],
            "HACKATHONS / INTERNSHIPS": ["hackathons / internships", "hackathons and internships", "internships / hackathons"],
            "HACKATHONS": ["hackathons", "competitions", "hackathon"],
            "INTERNSHIPS": ["internships", "internship"],
            "CERTIFICATIONS": ["certifications", "certificates", "courses & certifications"],
            "ACHIEVEMENTS": ["achievements", "honors", "awards"],
            "PREFERRED ROLES": ["preferred roles", "target roles", "career preferences", "preferred role"],
        }

        lines = [line.strip() for line in text.splitlines() if line.strip()]

        for line in lines:
            normalized_line = re.sub(r"[:\-_#*]+", "", line).strip().lower()
            matched_section = None
            for sec_name, triggers in section_headers.items():
                if normalized_line in triggers:
                    matched_section = sec_name
                    break

            if matched_section:
                current_section = matched_section
                if current_section not in sections:
                    sections[current_section] = []
            else:
                sections[current_section].append(line)

        return sections

    def _extract_candidate_info(self, header_lines: List[str], full_text: str) -> CandidateInfo:
        """Extract candidate contact details without guessing or hallucinating."""
        name: Optional[str] = None
        email: Optional[str] = None
        phone: Optional[str] = None
        location: Optional[str] = None

        # Email regex
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", full_text)
        if email_match:
            email = email_match.group(0)

        # Phone regex (Indian / international format)
        phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", full_text)
        if phone_match:
            phone = phone_match.group(0).strip()

        # Name extraction: usually first non-empty line of header if not a heading
        if header_lines:
            candidate_line = header_lines[0].strip()
            # If the first line is short and doesn't contain contact symbols, treat as candidate name
            if len(candidate_line.split()) <= 4 and "@" not in candidate_line and "resume" not in candidate_line.lower():
                name = candidate_line

        return CandidateInfo(name=name, email=email, phone=phone, location=location)

    def _extract_education(self, lines: List[str]) -> List[EducationEntry]:
        """Extract academic qualifications supported by resume text."""
        entries: List[EducationEntry] = []
        if not lines:
            return entries

        joined_evidence = " ".join(lines)
        for line in lines:
            degree = None
            field_of_study = None
            grade = None
            end_date = None

            # Detect degree
            for d in ["B.Tech", "B.E.", "M.Tech", "M.S.", "B.S.", "B.Sc", "BCA", "MCA"]:
                if d.lower() in line.lower():
                    degree = d
                    break

            # Detect field of study
            for f in ["Computer Science and Engineering", "Computer Science", "Information Technology", "Data Science", "Electronics"]:
                if f.lower() in line.lower():
                    field_of_study = f
                    break

            # Detect grade / CGPA
            cgpa_match = re.search(r"(?:CGPA|GPA|Grade)\s*[:—\-]?\s*([0-9\.]+\s*(?:/\s*10)?)", line, re.IGNORECASE)
            if cgpa_match:
                grade = cgpa_match.group(1).strip()

            # Detect graduation year (e.g. Class of 2026, 2026)
            year_match = re.search(r"(?:Class of|Graduating in|Batch of)?\s*(20\d{2})", line, re.IGNORECASE)
            if year_match:
                end_date = year_match.group(1)

            if degree or field_of_study or grade:
                entries.append(
                    EducationEntry(
                        institution=None,  # Left null when not explicitly named
                        degree=degree,
                        field_of_study=field_of_study,
                        start_date=None,
                        end_date=end_date,
                        grade=grade,
                        evidence=line
                    )
                )

        if not entries and lines:
            entries.append(EducationEntry(evidence=joined_evidence))

        return entries

    def _extract_skills(self, sections: Dict[str, List[str]]) -> List[Skill]:
        """Extract skills with traceable verbatim evidence and exact RADIX categories."""
        found_skills: List[Skill] = []
        seen_keys: Set[str] = set()

        # 1. Technical Skills Section (High confidence)
        skill_lines = sections.get("TECHNICAL SKILLS", [])
        for line in skill_lines:
            # Subdivide lines by commas, semicolons, bullets
            # Handle parenthetical lists like: "Python (pandas, scikit-learn)"
            tokens = self._tokenize_skill_line(line)
            for token in tokens:
                token_clean = token.strip()
                cat_match = resolve_category(token_clean)
                canon_name = normalize_skill_name(token_clean)
                key = canon_name.lower()

                # If token matches catalog or represents a valid tech item
                if key in CANONICAL_SKILL_CATALOG or (len(token_clean) >= 2 and token_clean[0].isupper()):
                    if key not in seen_keys:
                        seen_keys.add(key)
                        found_skills.append(
                            Skill(
                                skill_name=canon_name,
                                category_code=cat_match,
                                evidence=f"Listed under Technical Skills: '{line}'",
                                confidence=ExtractionConfidence.high
                            )
                        )

        # 2. Extract technologies mentioned in Projects & Experience (Medium confidence)
        project_lines = sections.get("PROJECTS", []) + sections.get("EXPERIENCE", [])
        for line in project_lines:
            line_lower = line.lower()
            for key, (canon_name, cat) in CANONICAL_SKILL_CATALOG.items():
                # Avoid false substring matches (e.g., 'scala' in 'scalable', 'c' in 'c++')
                if key == "c":
                    if not re.search(r"\bc\b(?!\+|\#)", line_lower):
                        continue
                elif len(key) <= 5 or " " not in key:
                    # Single words should use strict word boundaries
                    pattern = r"\b" + re.escape(key) + r"\b"
                    if not re.search(pattern, line_lower):
                        continue
                else:
                    if key not in line_lower:
                        continue

                canonical_key = canon_name.lower()
                if canonical_key not in seen_keys:
                    seen_keys.add(canonical_key)
                    # Use the sentence or clause as verbatim evidence
                    found_skills.append(
                        Skill(
                            skill_name=canon_name,
                            category_code=cat,
                            evidence=line,
                            confidence=ExtractionConfidence.medium
                        )
                    )

        return deduplicate_skills(found_skills)

    def _tokenize_skill_line(self, line: str) -> List[str]:
        """Parse skill lines into tokens, splitting on delimiters outside parentheses

        and extracting parenthesized sub-technologies.
        """
        parts: List[str] = []
        current: List[str] = []
        paren_depth = 0

        for char in line:
            if char == "(":
                paren_depth += 1
                current.append(char)
            elif char == ")":
                if paren_depth > 0:
                    paren_depth -= 1
                current.append(char)
            elif char in (",", ";", "•", "|", "\t") and paren_depth == 0:
                chunk = "".join(current).strip()
                if chunk:
                    parts.append(chunk)
                current = []
            else:
                current.append(char)

        last_chunk = "".join(current).strip()
        if last_chunk:
            parts.append(last_chunk)

        tokens: List[str] = []
        for part in parts:
            paren_match = re.search(r"^(.*?)\((.*?)\)$", part)
            if paren_match:
                main_skill = paren_match.group(1).strip()
                sub_skills = [s.strip() for s in paren_match.group(2).split(",") if s.strip()]
                if main_skill:
                    clean_main = re.sub(r"(?i)\b(basic|basics|fundamentals|exposure to|advanced)\b", "", main_skill).strip()
                    tokens.append(clean_main or main_skill)
                for sub in sub_skills:
                    clean_sub = re.sub(r"(?i)\b(basic|basics|fundamentals|exposure to|advanced)\b", "", sub).strip()
                    tokens.append(clean_sub or sub)
            else:
                clean_part = re.sub(r"(?i)\b(basic|basics|fundamentals|exposure to|advanced)\b", "", part).strip()
                if clean_part:
                    tokens.append(clean_part)
                else:
                    tokens.append(part)
        return tokens

    def _find_techs_in_text(self, text: str) -> List[str]:
        """Detect canonical technology names mentioned in text with word boundaries."""
        techs: List[str] = []
        text_lower = text.lower()
        for key, (canon_name, _) in CANONICAL_SKILL_CATALOG.items():
            if key == "c":
                if re.search(r"\bc\b(?!\+|\#)", text_lower):
                    if canon_name not in techs:
                        techs.append(canon_name)
            elif len(key) <= 5 or " " not in key:
                if re.search(r"\b" + re.escape(key) + r"\b", text_lower):
                    if canon_name not in techs:
                        techs.append(canon_name)
            else:
                if key in text_lower:
                    if canon_name not in techs:
                        techs.append(canon_name)
        return techs

    def _extract_projects(self, lines: List[str]) -> List[ProjectEntry]:
        """Extract project entries with detected technologies and evidence."""
        projects: List[ProjectEntry] = []
        for line in lines:
            if not line:
                continue

            techs = self._find_techs_in_text(line)

            # Generate project name from first clause
            name_match = re.split(r"[—\–\-:]|(?:\s+as\s+a\s+)", line)
            name = name_match[0].strip() if name_match else line[:40]
            if len(name) > 60:
                name = name[:60] + "..."

            projects.append(
                ProjectEntry(
                    name=name,
                    description=line,
                    technologies=techs,
                    responsibilities=[],
                    evidence=line
                )
            )
        return projects

    def _extract_experience_and_competitions(
        self,
        lines: List[str]
    ) -> Tuple[List[ExperienceEntry], List[InternshipEntry], List[HackathonEntry]]:
        """Extract experience, internships, and hackathons."""
        experience: List[ExperienceEntry] = []
        internships: List[InternshipEntry] = []
        hackathons: List[HackathonEntry] = []

        for line in lines:
            line_lower = line.lower()
            is_intern = "intern" in line_lower
            is_hackathon = any(w in line_lower for w in ["hackathon", "competition", "finalist", "runner-up", "winner"])

            techs = self._find_techs_in_text(line)

            if is_hackathon:
                award = None
                for a in ["Winner", "Finalist", "Runner-up", "Participated"]:
                    if a.lower() in line_lower:
                        award = a
                        break
                hackathons.append(
                    HackathonEntry(
                        name=line.split("—")[0].strip() if "—" in line else line[:50],
                        award_or_role=award,
                        description=line,
                        evidence=line
                    )
                )

            if is_intern:
                # Add structured internship
                internships.append(
                    InternshipEntry(
                        organization=None,
                        role="Intern",
                        start_date=None,
                        end_date=None,
                        description=line,
                        technologies=techs,
                        evidence=line
                    )
                )
                # Also include in experience for downstream consumers reading experience
                experience.append(
                    ExperienceEntry(
                        organization=None,
                        job_title="Intern",
                        employment_type="internship",
                        start_date=None,
                        end_date=None,
                        description=line,
                        technologies=techs,
                        evidence=line
                    )
                )
            elif not is_hackathon:
                experience.append(
                    ExperienceEntry(
                        organization=None,
                        job_title=None,
                        employment_type="full-time",
                        start_date=None,
                        end_date=None,
                        description=line,
                        technologies=techs,
                        evidence=line
                    )
                )

        return experience, internships, hackathons

    def _extract_certifications(self, lines: List[str]) -> List[CertificationEntry]:
        """Extract certifications, respecting 'None listed' declarations."""
        certs: List[CertificationEntry] = []
        for line in lines:
            line_clean = line.strip()
            if not line_clean or line_clean.lower() in ("none listed", "none", "n/a", "no formal certifications listed"):
                continue
            issuer = None
            for known_issuer in ["Google", "Cisco", "AWS", "Microsoft", "Oracle", "IBM", "Coursera"]:
                if known_issuer.lower() in line_clean.lower():
                    issuer = known_issuer
                    break
            certs.append(
                CertificationEntry(
                    name=line_clean,
                    issuer=issuer,
                    evidence=line_clean
                )
            )
        return certs

    def _extract_preferred_roles(self, lines: List[str]) -> List[str]:
        """Extract candidate preferred roles when explicitly stated."""
        roles: List[str] = []
        for line in lines:
            parts = re.split(r"[,;|]+", line)
            for p in parts:
                cleaned = p.strip()
                if cleaned:
                    roles.append(cleaned)
        return roles
