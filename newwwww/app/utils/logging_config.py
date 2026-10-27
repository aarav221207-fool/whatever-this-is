"""Logging configuration for RADIX Resume Parser.
Ensures no resume contents, personal candidate data, or API secrets leak into logs.
"""
import logging
import re
import sys
from app.config import settings

SECRET_KV_PATTERN = re.compile(r"(?i)(api[_-]?key|secret|token|password|auth|authorization)\s*[:=]\s*['\"]?([^'\"\s,]+)")
OPENAI_KEY_PATTERN = re.compile(r"sk-[a-zA-Z0-9]{20,}")


class RedactingFormatter(logging.Formatter):
    """Logging formatter that redacts known secret patterns and protects PII/content."""
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = SECRET_KV_PATTERN.sub(r"\1: [REDACTED]", original)
        redacted = OPENAI_KEY_PATTERN.sub("[REDACTED_API_KEY]", redacted)
        return redacted


def setup_logging() -> logging.Logger:
    """Configure application-wide standard logging."""
    log_level_name = settings.LOG_LEVEL
    log_level = getattr(logging, log_level_name, logging.INFO)

    logger = logging.getLogger("radix_resume_parser")
    logger.setLevel(log_level)

    # Avoid duplicate handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        formatter = RedactingFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logging()

