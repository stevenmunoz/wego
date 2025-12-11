"""Logging configuration for structured logging."""

import logging
import sys
from contextvars import ContextVar
from typing import Any
from uuid import uuid4

from src.core.config import settings

# Context variable for correlation ID
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    """Get the current correlation ID."""
    return correlation_id_var.get()


def set_correlation_id(correlation_id: str | None = None) -> str:
    """Set correlation ID for the current context."""
    if correlation_id is None:
        correlation_id = str(uuid4())
    correlation_id_var.set(correlation_id)
    return correlation_id


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": get_correlation_id(),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs", "message",
                "pathname", "process", "processName", "relativeCreated",
                "thread", "threadName", "exc_info", "exc_text", "stack_info"
            ]:
                log_data[key] = value

        return str(log_data)


def setup_logging() -> None:
    """Configure application logging."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    if settings.is_production:
        handler.setFormatter(StructuredFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
        )

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        handlers=[handler]
    )

    # Set third-party loggers to WARNING
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("firebase_admin").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)
