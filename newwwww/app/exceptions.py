"""Custom domain exceptions for RADIX Resume Parser.
"""
from typing import Optional, List, Dict, Any


class ResumeParserException(Exception):
    """Base exception for all resume parser domain errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class InvalidFileFormatError(ResumeParserException):
    """Raised when an uploaded file format is not supported or content fails validation."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=400, details=details)


class FileTooLargeError(ResumeParserException):
    """Raised when the uploaded document exceeds configured size limits."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=413, details=details)


class DocumentExtractionError(ResumeParserException):
    """Raised when text cannot be extracted from a document (e.g. image-only, scanned, encrypted)."""
    def __init__(self, message: str, status_code: int = 422, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status_code, details=details)


class LLMExtractionError(ResumeParserException):
    """Raised when the upstream LLM provider fails, times out, or returns unparseable output."""
    def __init__(self, message: str, status_code: int = 502, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status_code, details=details)


class RateLimitExceededError(ResumeParserException):
    """Raised when client exceeds rate limit or upstream provider rate limit is encountered."""
    def __init__(self, message: str = "Rate limit exceeded", status_code: int = 429, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=status_code, details=details)


class SchemaValidationError(ResumeParserException):
    """Raised when a candidate payload fails schema validation."""
    def __init__(self, message: str, errors: Optional[List[Dict[str, Any]]] = None):
        super().__init__(message=message, status_code=422, details={"errors": errors or []})
        self.errors = errors or []

