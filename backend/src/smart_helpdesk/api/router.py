from fastapi import APIRouter
from smart_helpdesk.api.routes import (
    customers,
    health,
    service_categories,
    technicians,
    tickets,
)

api_router = APIRouter()

# Register API routes
api_router.include_router(health.router)
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(service_categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(technicians.router, prefix="/technicians", tags=["technicians"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
