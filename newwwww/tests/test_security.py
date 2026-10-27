"""Security tests: filename sanitization, content verification, log masking, and rate limiting.
"""
import logging
import pytest

from app.exceptions import RateLimitExceededError
from app.utils.logging_config import RedactingFormatter
from app.utils.security import InMemoryRateLimiter, sanitize_filename


class TestSecurity:
    """Security verification test suite."""

    def test_filename_sanitization_path_traversal(self):
        # Prevent Unix directory traversal
        assert sanitize_filename("../../etc/passwd.pdf") == "passwd.pdf"
        assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe.docx") == "cmd.exe.docx"
        assert sanitize_filename("../../../../resume.pdf") == "resume.pdf"

    def test_filename_sanitization_hidden_and_special_chars(self):
        assert sanitize_filename(".hidden_resume.pdf") == "hidden_resume.pdf"
        assert sanitize_filename("...my_resume.docx") == "my_resume.docx"
        # Invalid characters replaced
        cleaned = sanitize_filename("resume<script>alert(1)</script>.pdf")
        assert "<" not in cleaned and ">" not in cleaned

    def test_filename_sanitization_empty_or_none(self):
        assert sanitize_filename(None) == "resume.pdf"
        assert sanitize_filename("") == "resume.pdf"
        assert sanitize_filename("   ") == "resume.pdf"

    def test_log_redaction_secrets(self):
        formatter = RedactingFormatter(fmt="%(message)s")
        record = logging.LogRecord(
            name="test_logger",
            level=logging.INFO,
            pathname=__file__,
            lineno=10,
            msg="Connected with api_key: sk-1234567890abcdef1234567890 securely.",
            args=(),
            exc_info=None
        )
        formatted = formatter.format(record)
        assert "sk-1234567890abcdef1234567890" not in formatted
        assert "[REDACTED" in formatted

    def test_in_memory_rate_limiter(self):
        limiter = InMemoryRateLimiter(requests_per_minute=3)
        client_ip = "192.168.1.100"

        # First 3 requests should pass
        limiter.check_rate_limit(client_ip)
        limiter.check_rate_limit(client_ip)
        limiter.check_rate_limit(client_ip)

        # 4th request must raise RateLimitExceededError
        with pytest.raises(RateLimitExceededError) as exc_info:
            limiter.check_rate_limit(client_ip)
        assert exc_info.value.status_code == 429
        assert "Rate limit" in exc_info.value.message

