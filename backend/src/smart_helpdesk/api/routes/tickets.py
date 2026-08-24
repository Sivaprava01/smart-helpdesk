import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusResponse,
    TicketUpdate,
)
from smart_helpdesk.services import ticket_service

router = APIRouter()


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Ticket",
)
def create_ticket_endpoint(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """Create a new service ticket (ASAP or scheduled)."""
    return ticket_service.create_ticket(db, ticket_in)


@router.get(
    "",
    response_model=list[TicketResponse],
    summary="List Tickets",
)
def list_tickets_endpoint(
    customer_id: uuid.UUID | None = Query(None, description="Filter tickets by customer ID"),
    category_id: uuid.UUID | None = Query(None, description="Filter tickets by category ID"),
    status: TicketStatus | None = Query(None, description="Filter tickets by status"),
    is_scheduled: bool | None = Query(None, description="Filter tickets by scheduling type"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    db: Session = Depends(get_db),
) -> list[TicketResponse]:
    """Retrieve service tickets with optional filtering."""
    return ticket_service.list_tickets(
        db,
        customer_id=customer_id,
        category_id=category_id,
        status=status,
        is_scheduled=is_scheduled,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Get Ticket by ID",
)
def get_ticket_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """Retrieve full details for a specific service ticket."""
    return ticket_service.get_ticket(db, ticket_id)


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Update Ticket Details",
)
def update_ticket_endpoint(
    ticket_id: uuid.UUID,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """Partially update allowed ticket details before assignment."""
    return ticket_service.update_ticket(db, ticket_id, ticket_in)


@router.get(
    "/{ticket_id}/status",
    response_model=TicketStatusResponse,
    summary="Get Ticket Status",
)
def get_ticket_status_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TicketStatusResponse:
    """Lightweight endpoint for polling ticket lifecycle status."""
    return ticket_service.get_ticket_status(db, ticket_id)


@router.post(
    "/{ticket_id}/cancel",
    response_model=TicketResponse,
    summary="Cancel Ticket",
)
def cancel_ticket_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> TicketResponse:
    """Cancel a pending service ticket safely preserving historical records."""
    return ticket_service.cancel_ticket(db, ticket_id)
