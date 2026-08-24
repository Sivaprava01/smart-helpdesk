import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("smart_helpdesk")


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catches any unhandled exceptions, logs internal traceback, and returns a safe 500 error."""
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
    """Registers exception handlers with the FastAPI application."""
    app.add_exception_handler(Exception, unhandled_exception_handler)
    app.add_exception_handler(status.HTTP_500_INTERNAL_SERVER_ERROR, unhandled_exception_handler)

