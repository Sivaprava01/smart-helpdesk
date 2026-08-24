from fastapi import APIRouter
from smart_helpdesk.api.routes import health

api_router = APIRouter()

# Include feature route modules
api_router.include_router(health.router)
