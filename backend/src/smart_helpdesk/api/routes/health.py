from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Health Check", tags=["health"])
async def health_check() -> dict[str, str]:
    """Endpoint to verify the health and readiness of the service."""
    return {"status": "healthy"}
