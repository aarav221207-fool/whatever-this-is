"""Security utilities for RADIX Resume Parser.
Implements file-type verification, filename sanitization, size limits, and basic rate limiting.
"""
import io
import os
import re
import time
import zipfile
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Optional, Tuple

from app.config import settings
from app.exceptions import FileTooLargeError, InvalidFileFormatError, RateLimitExceededError

# Allowed extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# Magic byte signatures
PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04"
ZIP_EMPTY_MAGIC = b"PK\x05\x06"
ZIP_SPANNED_MAGIC = b"PK\x07\x08"


def sanitize_filename(filename: Optional[str]) -> str:
    """Sanitize the uploaded file's original name to prevent directory traversal

    and malicious filesystem characters. Returns a clean base filename.
    """
    if not filename:
        return "resume.pdf"

    # Remove any directory path components (both unix and windows)
    basename = os.path.basename(filename.replace("\\", "/"))

    # Remove non-whitelisted characters: allow alphanumeric, dots, underscores, dashes, spaces
    cleaned = re.sub(r"[^\w\s\.-]", "_", basename).strip()

    # Disallow leading dots or dot-only filenames (hidden files / relative traversals)
    while cleaned.startswith(".") or cleaned.startswith(" "):
        cleaned = cleaned[1:].strip()

    if not cleaned:
        return "resume.pdf"

    # Limit filename length
    if len(cleaned) > 255:
        ext = os.path.splitext(cleaned)[1]
        base = os.path.splitext(cleaned)[0][:250 - len(ext)]
        cleaned = f"{base}{ext}"

    return cleaned


def detect_file_type(content: bytes, filename: str) -> str:
    """Verify document type by matching file extension with actual file content / magic bytes.

    Returns 'pdf' or 'docx'. Raises InvalidFileFormatError on mismatch or unsupported format.
    """
    ext = os.path.splitext(filename.lower())[1]

    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidFileFormatError(
            f"Unsupported file extension '{ext}'. Only .pdf and .docx are supported.",
            details={"allowed_extensions": list(ALLOWED_EXTENSIONS), "provided_filename": filename}
        )

    if len(content) == 0:
        raise InvalidFileFormatError("The uploaded file is empty (0 bytes).")

    if ext == ".pdf":
        # Check PDF header in the first 1024 bytes (some PDFs have leading BOM or whitespace)
        first_kb = content[:1024]
        if PDF_MAGIC not in first_kb:
            raise InvalidFileFormatError(
                "File has .pdf extension but does not contain a valid PDF signature (%PDF-).",
                details={"provided_filename": filename}
            )
        return "pdf"

    elif ext == ".docx":
        # DOCX files are Open Packaging Convention ZIP archives
        is_zip = content.startswith(ZIP_MAGIC) or content.startswith(ZIP_EMPTY_MAGIC) or content.startswith(ZIP_SPANNED_MAGIC)
        if not is_zip:
            raise InvalidFileFormatError(
                "File has .docx extension but is not a valid ZIP/Office Open XML document.",
                details={"provided_filename": filename}
            )
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                namelist = zf.namelist()
                # A valid docx must contain [Content_Types].xml or word/document.xml
                has_content_types = "[Content_Types].xml" in namelist
                has_word_doc = any(n.startswith("word/") for n in namelist)
                if not (has_content_types and has_word_doc):
                    raise InvalidFileFormatError(
                        "File is a zip archive but lacks required Word document components (word/document.xml).",
                        details={"provided_filename": filename}
                    )
        except zipfile.BadZipFile as e:
            raise InvalidFileFormatError(
                f"File has .docx extension but is corrupted: {str(e)}",
                details={"provided_filename": filename}
            ) from e
        return "docx"

    raise InvalidFileFormatError(f"Unsupported file type for '{filename}'.")


def validate_file_size(size_bytes: int, max_mb: Optional[int] = None) -> None:
    """Validate that the file size is within configured bounds."""
    max_allowed = (max_mb * 1024 * 1024) if max_mb else settings.max_upload_size_bytes
    if size_bytes > max_allowed:
        raise FileTooLargeError(
            f"File size ({size_bytes / (1024 * 1024):.2f} MB) exceeds maximum allowed size ({max_allowed / (1024 * 1024):.0f} MB).",
            details={"size_bytes": size_bytes, "max_allowed_bytes": max_allowed}
        )


class InMemoryRateLimiter:
    """Thread-safe in-memory sliding-window rate limiter per client IP."""
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60.0
        self.client_records: Dict[str, List[float]] = defaultdict(list)
        self.lock = Lock()

    def check_rate_limit(self, client_ip: str) -> None:
        """Check if client IP is within rate limits. Raises RateLimitExceededError if exceeded."""
        now = time.time()
        window_start = now - self.window_seconds

        with self.lock:
            # Filter out timestamps older than the window
            timestamps = self.client_records[client_ip]
            valid_timestamps = [ts for ts in timestamps if ts > window_start]

            if len(valid_timestamps) >= self.requests_per_minute:
                self.client_records[client_ip] = valid_timestamps
                raise RateLimitExceededError(
                    f"Rate limit of {self.requests_per_minute} requests per minute exceeded.",
                    details={"client_ip": client_ip, "retry_after_seconds": int(valid_timestamps[0] - window_start) + 1}
                )

            valid_timestamps.append(now)
            self.client_records[client_ip] = valid_timestamps


rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

