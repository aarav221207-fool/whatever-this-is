"""Configuration settings for RADIX Resume Parser.
"""
import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env file if present
load_dotenv()


def _str_to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("true", "1", "yes", "t", "on")


class Settings(BaseModel):
    """Application configuration with safe defaults for local development."""
    APP_ENV: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    MAX_UPLOAD_SIZE_MB: int = Field(default_factory=lambda: int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")))
    LLM_ENABLED: bool = Field(default_factory=lambda: _str_to_bool(os.getenv("LLM_ENABLED"), default=False))
    LLM_PROVIDER: str = Field(default_factory=lambda: os.getenv("LLM_PROVIDER", "openai"))
    LLM_MODEL: str = Field(default_factory=lambda: os.getenv("LLM_MODEL", "gpt-4o-mini"))
    LLM_API_KEY: str = Field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    LLM_TIMEOUT_SECONDS: int = Field(default_factory=lambda: int(os.getenv("LLM_TIMEOUT_SECONDS", "30")))
    LOG_LEVEL: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO").upper())
    RATE_LIMIT_PER_MINUTE: int = Field(default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")))

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    def safe_dict(self) -> dict:
        """Return configuration dictionary with masked sensitive fields."""
        masked_key = ""
        if self.LLM_API_KEY:
            if len(self.LLM_API_KEY) > 8:
                masked_key = f"{self.LLM_API_KEY[:4]}...{self.LLM_API_KEY[-4:]}"
            else:
                masked_key = "***"
        return {
            "APP_ENV": self.APP_ENV,
            "MAX_UPLOAD_SIZE_MB": self.MAX_UPLOAD_SIZE_MB,
            "LLM_ENABLED": self.LLM_ENABLED,
            "LLM_PROVIDER": self.LLM_PROVIDER,
            "LLM_MODEL": self.LLM_MODEL,
            "LLM_API_KEY_CONFIGURED": bool(self.LLM_API_KEY),
            "LLM_API_KEY_MASKED": masked_key,
            "LLM_TIMEOUT_SECONDS": self.LLM_TIMEOUT_SECONDS,
            "LOG_LEVEL": self.LOG_LEVEL,
            "RATE_LIMIT_PER_MINUTE": self.RATE_LIMIT_PER_MINUTE,
        }


# Singleton settings instance
settings = Settings()

