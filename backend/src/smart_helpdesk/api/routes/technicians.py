import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.technician import (
    TechnicianCreate,
    TechnicianResponse,
    TechnicianUpdate,
)
from smart_helpdesk.services import technician_service

router = APIRouter()


@router.post(
    "",
    response_model=TechnicianResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Technician",
)
def create_technician_endpoint(
    technician_in: TechnicianCreate,
    db: Session = Depends(get_db),
) -> TechnicianResponse:
    """Register a new technician and associate skill categories."""
    return technician_service.create_technician(db, technician_in)


@router.get(
    "",
    response_model=list[TechnicianResponse],
    summary="List Technicians",
)
def list_technicians_endpoint(
    is_active: bool | None = Query(None, description="Filter by active status"),
    is_on_duty: bool | None = Query(None, description="Filter by on-duty status"),
    category_id: uuid.UUID | None = Query(None, description="Filter by supported skill category ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
) -> list[TechnicianResponse]:
    """Retrieve a list of technicians with optional status and category filters."""
    return technician_service.list_technicians(
        db,
        is_active=is_active,
        is_on_duty=is_on_duty,
        category_id=category_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{technician_id}",
    response_model=TechnicianResponse,
    summary="Get Technician by ID",
)
def get_technician_endpoint(
    technician_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TechnicianResponse:
    """Retrieve full details for a technician including supported skill categories."""
    return technician_service.get_technician(db, technician_id)


@router.patch(
    "/{technician_id}",
    response_model=TechnicianResponse,
    summary="Update Technician",
)
def update_technician_endpoint(
    technician_id: uuid.UUID,
    technician_in: TechnicianUpdate,
    db: Session = Depends(get_db),
) -> TechnicianResponse:
    """Partially update technician details, availability, and supported skill categories."""
    return technician_service.update_technician(db, technician_id, technician_in)
