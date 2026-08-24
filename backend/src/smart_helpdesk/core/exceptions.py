import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("smart_helpdesk")


class AppException(Exception):
    """Base application domain exception."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class EntityNotFoundError(AppException):
    """Raised when a requested domain entity is not found (404)."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class DuplicateEntityError(AppException):
    """Raised when a resource uniqueness constraint is violated (409)."""

    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


class BusinessRuleError(AppException):
    """Raised when a domain/lifecycle rule is violated (400)."""

    def __init__(self, message: str = "Business rule violation") -> None:
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handles domain application exceptions and returns appropriate client status code."""
    logger.info(
        "Domain error handling %s %s: %s (status %s)",
        request.method,
        request.url.path,
        exc.message,
        exc.status_code,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches unhandled server errors, logs internal traceback, and returns a safe 500 error."""
    logger.error(
        "Unhandled server error processing request %s %s: %s",
        request.method,
        request.url.path,
        str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Registers domain and global exception handlers with the FastAPI application."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.add_exception_handler(status.HTTP_500_INTERNAL_SERVER_ERROR, unhandled_exception_handler)
