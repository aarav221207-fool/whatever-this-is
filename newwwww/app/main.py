"""FastAPI Application entrypoint for RADIX Talent Match - Role 2: Resume Parsing.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.exceptions import ResumeParserException
from app.utils.logging_config import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle context without disclosing secrets."""
    safe_cfg = settings.safe_dict()
    logger.info("Starting RADIX Resume Parser with configuration: %s", safe_cfg)
    yield


app = FastAPI(
    title="RADIX Talent Match — Role 2: Resume Parsing",
    description="Independent, integration-ready resume-parsing backend that parses PDF/DOCX resumes "
                "into validated structured JSON conforming to the RADIX shared data contract.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


@app.exception_handler(ResumeParserException)
async def resume_parser_exception_handler(request: Request, exc: ResumeParserException):
    """Handle domain exceptions with consistent JSON shape and accurate status codes."""
    logger.warning("Domain exception [%s]: %s (status %d)", exc.__class__.__name__, exc.message, exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Sanitize FastAPI request validation errors."""
    sanitized_errors = []
    for err in exc.errors():
        sanitized_errors.append({
            "loc": list(err.get("loc", [])),
            "msg": err.get("msg", "Invalid parameter"),
            "type": err.get("type", "validation_error"),
        })
    logger.warning("Request validation failure: %s", sanitized_errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "RequestValidationError",
            "message": "The request payload failed structural validation.",
            "details": {"errors": sanitized_errors},
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Consistent format for standard HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": exc.detail,
            "details": {},
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all safety net: logs full error internally, returns safe generic 500 without stack traces."""
    logger.exception("Unhandled server exception: %s", str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected internal server error occurred. Please contact the administrator.",
            "details": {},
        }
    )


# Attach API routes
app.include_router(router)
