"""FastAPI route handlers for RADIX Resume Parser.
Keeps HTTP handling cleanly separated from core parsing and normalization services.
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import ValidationError

from app.config import settings
from app.exceptions import (
    DocumentExtractionError,
    FileTooLargeError,
    InvalidFileFormatError,
    LLMExtractionError,
    RateLimitExceededError,
)
from app.schemas import (
    HealthResponse,
    ParserHealthResponse,
    ResumeParseResponse,
    ValidatePayloadResponse,
    ValidationErrorDetail,
)
from app.services.resume_parser import ResumeParserService
from app.utils.logging_config import logger
from app.utils.security import rate_limiter

router = APIRouter()


def get_parser_service() -> ResumeParserService:
    """Dependency provider for ResumeParserService."""
    return ResumeParserService()


def get_client_ip(request: Request) -> str:
    """Safely extract client IP from request headers or direct client."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Return top-level service health status without exposing sensitive environment variables."""
    return HealthResponse(status="ok", app_env=settings.APP_ENV)


@router.get("/api/v1/resume-parser/health", response_model=ParserHealthResponse, tags=["Health"])
def parser_health_check():
    """Return parser readiness, supported formats, and configuration without disclosing API keys."""
    return ParserHealthResponse(
        status="ready",
        supported_formats=["pdf", "docx"],
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        llm_enabled=settings.LLM_ENABLED,
        llm_provider=settings.LLM_PROVIDER if settings.LLM_ENABLED else None,
        llm_model=settings.LLM_MODEL if settings.LLM_ENABLED else None,
    )


@router.post(
    "/api/v1/resume-parser/parse",
    response_model=ResumeParseResponse,
    status_code=status.HTTP_200_OK,
    tags=["Resume Parsing"],
    responses={
        200: {"description": "Resume successfully parsed and validated against RADIX schema."},
        400: {"description": "Invalid file format, bad magic bytes, or corrupt document."},
        413: {"description": "Uploaded file exceeds maximum size limit."},
        422: {"description": "Document contains no readable text or is a scanned/image-only PDF."},
        429: {"description": "Rate limit exceeded."},
        502: {"description": "Upstream LLM provider failure."},
        503: {"description": "Parsing service temporarily unavailable."},
    }
)
async def parse_resume(
    request: Request,
    file: UploadFile = File(..., description="Candidate resume in PDF or DOCX format"),
    service: ResumeParserService = Depends(get_parser_service)
):
    """Parse candidate resume in PDF or DOCX format into validated structured RADIX JSON."""
    client_ip = get_client_ip(request)
    rate_limiter.check_rate_limit(client_ip)

    if not file.filename:
        raise InvalidFileFormatError("Uploaded file must have a valid filename.")

    # Read uploaded bytes in bounded chunks to prevent unbounded memory allocation
    max_bytes = settings.max_upload_size_bytes
    chunks: List[bytes] = []
    total_bytes = 0
    chunk_size = 64 * 1024  # 64 KB chunk size

    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                raise FileTooLargeError(
                    f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
                    details={"size_bytes": total_bytes, "max_allowed_mb": settings.MAX_UPLOAD_SIZE_MB}
                )
            chunks.append(chunk)
    finally:
        await file.close()

    content = b"".join(chunks)
    if len(content) == 0:
        raise InvalidFileFormatError("The uploaded file is empty (0 bytes).")

    # Execute parsing pipeline
    result = service.parse_document(content=content, original_filename=file.filename)
    return result


@router.post(
    "/api/v1/resume-parser/validate",
    response_model=ValidatePayloadResponse,
    status_code=status.HTTP_200_OK,
    tags=["Validation"],
    responses={
        200: {"description": "Validation completed; check 'valid' boolean for outcome."},
        422: {"description": "Request body could not be parsed as JSON."},
    }
)
async def validate_candidate_json(payload: Dict[str, Any]):
    """Validate a candidate JSON payload against the RADIX Talent Match shared data contract.

    Returns validation status and safe, actionable field-level error messages.
    Does not silently rewrite invalid payloads.
    """
    try:
        validated = ResumeParseResponse.model_validate(payload)
        return ValidatePayloadResponse(
            valid=True,
            status="valid",
            errors=[],
            summary={
                "candidate_name": validated.candidate.name,
                "skill_count": len(validated.skills),
                "education_count": len(validated.education),
                "projects_count": len(validated.projects),
                "experience_count": len(validated.experience),
            }
        )
    except ValidationError as e:
        error_details: List[ValidationErrorDetail] = []
        for err in e.errors():
            loc = list(err.get("loc", []))
            msg = err.get("msg", "Validation error")
            err_type = err.get("type", "value_error")
            error_details.append(
                ValidationErrorDetail(loc=loc, msg=msg, type=err_type)
            )

        return ValidatePayloadResponse(
            valid=False,
            status="invalid",
            errors=error_details,
            summary=None
        )

