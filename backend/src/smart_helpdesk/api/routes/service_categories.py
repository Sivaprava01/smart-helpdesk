import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.service_category import (
    ServiceCategoryCreate,
    ServiceCategoryResponse,
    ServiceCategoryUpdate,
)
from smart_helpdesk.services import service_category_service

router = APIRouter()


@router.post(
    "",
    response_model=ServiceCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Service Category",
)
def create_category_endpoint(
    category_in: ServiceCategoryCreate,
    db: Session = Depends(get_db),
) -> ServiceCategoryResponse:
    """Create a new service skill/ticket category."""
    return service_category_service.create_category(db, category_in)


@router.get(
    "",
    response_model=list[ServiceCategoryResponse],
    summary="List Service Categories",
)
def list_categories_endpoint(
    is_active: bool | None = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
) -> list[ServiceCategoryResponse]:
    """Retrieve service categories with optional active status filtering."""
    return service_category_service.list_categories(
        db,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{category_id}",
    response_model=ServiceCategoryResponse,
    summary="Get Service Category",
)
def get_category_endpoint(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ServiceCategoryResponse:
    """Retrieve details for a specific service category."""
    return service_category_service.get_category(db, category_id)


@router.patch(
    "/{category_id}",
    response_model=ServiceCategoryResponse,
    summary="Update Service Category",
)
def update_category_endpoint(
    category_id: uuid.UUID,
    category_in: ServiceCategoryUpdate,
    db: Session = Depends(get_db),
) -> ServiceCategoryResponse:
    """Update name or active status of a service category."""
    return service_category_service.update_category(db, category_id, category_in)
