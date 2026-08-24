from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI

from smart_helpdesk.api.router import api_router
from smart_helpdesk.core.config import get_settings
from smart_helpdesk.core.exceptions import register_exception_handlers
from smart_helpdesk.core.logging import setup_logging

logger = logging.getLogger("smart_helpdesk")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifecycle events: startup and shutdown."""
    setup_logging()
    settings = get_settings()
    logger.info(
        "Starting %s v%s in %s environment (Debug: %s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENVIRONMENT,
        settings.DEBUG,
    )
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Register global exception handlers
    register_exception_handlers(app)

    # Mount central API router with version prefix
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
