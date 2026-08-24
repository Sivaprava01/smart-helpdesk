import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from smart_helpdesk.services import customer_service

router = APIRouter()


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Customer",
)
def create_customer_endpoint(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
) -> CustomerResponse:
    """Register a new customer account."""
    return customer_service.create_customer(db, customer_in)


@router.get(
    "",
    response_model=list[CustomerResponse],
    summary="List Customers",
)
def list_customers_endpoint(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
) -> list[CustomerResponse]:
    """Retrieve a paginated list of customers."""
    return customer_service.list_customers(db, skip=skip, limit=limit)


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get Customer by ID",
)
def get_customer_endpoint(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CustomerResponse:
    """Retrieve details for a specific customer."""
    return customer_service.get_customer(db, customer_id)


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update Customer",
)
def update_customer_endpoint(
    customer_id: uuid.UUID,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
) -> CustomerResponse:
    """Partially update customer profile details."""
    return customer_service.update_customer(db, customer_id, customer_in)
