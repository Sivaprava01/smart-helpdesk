import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.session import get_db
from smart_helpdesk.routing.schemas import RoutingPreviewResponse
from smart_helpdesk.schemas.assignment import (
    AssignmentActionResponse,
    AssignmentResponse,
    FallbackSummary,
)
from smart_helpdesk.schemas.execution import (
    CompleteWorkRequest,
    ExecutionActionResponse,
)
from smart_helpdesk.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusResponse,
    TicketUpdate,
)
from smart_helpdesk.services import (
    assignment_service,
    execution_service,
    routing_service,
    ticket_service,
)

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


@router.post(
    "/{ticket_id}/routing-preview",
    response_model=RoutingPreviewResponse,
    summary="Preview Ticket Routing (POST)",
)
def preview_ticket_routing_post_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RoutingPreviewResponse:
    """Evaluate and preview deterministic technician eligibility and ranking for a ticket without side-effects."""
    return routing_service.evaluate_ticket_routing(db, ticket_id)


@router.get(
    "/{ticket_id}/routing-preview",
    response_model=RoutingPreviewResponse,
    summary="Preview Ticket Routing (GET)",
)
def preview_ticket_routing_get_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RoutingPreviewResponse:
    """Evaluate and preview deterministic technician eligibility and ranking for a ticket (idempotent read)."""
    return routing_service.evaluate_ticket_routing(db, ticket_id)


@router.post(
    "/{ticket_id}/assign",
    response_model=AssignmentActionResponse,
    summary="Start Ticket Assignment",
)
def start_ticket_assignment_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AssignmentActionResponse:
    """Start the assignment workflow for a ticket and dispatch an offer to the top ranked technician."""
    assignment, status_msg = assignment_service.start_assignment(db, ticket_id)
    if assignment:
        fallback = FallbackSummary(
            status=status_msg,
            assignment_id=assignment.id,
            technician_id=assignment.technician_id,
            response_deadline=assignment.expires_at,
        )
        return AssignmentActionResponse(
            ticket_id=ticket_id,
            assignment=AssignmentResponse.model_validate(assignment),
            fallback=fallback,
        )
    else:
        return AssignmentActionResponse(
            ticket_id=ticket_id,
            assignment=None,
            fallback=FallbackSummary(status=status_msg),
        )


@router.get(
    "/{ticket_id}/assignments",
    response_model=list[AssignmentResponse],
    summary="Get Ticket Assignment Attempts History",
)
def get_ticket_assignments_endpoint(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[AssignmentResponse]:
    """Retrieve full history of assignment offers and responses for a specific ticket."""
    assignments = assignment_service.list_ticket_assignments(db, ticket_id)
    return [AssignmentResponse.model_validate(a) for a in assignments]


@router.post(
    "/{ticket_id}/arrive",
    response_model=ExecutionActionResponse,
    summary="Technician Marks Arrival",
)
def mark_technician_arrived_endpoint(
    ticket_id: uuid.UUID,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID verification"),
    db: Session = Depends(get_db),
) -> ExecutionActionResponse:
    """Technician marks arrival on site for an assigned ticket."""
    ticket, assignment = execution_service.mark_technician_arrived(
        db,
        ticket_id=ticket_id,
        technician_id=technician_id,
    )
    return ExecutionActionResponse(
        ticket_id=ticket.id,
        status=ticket.status,
        assignment_id=assignment.id,
        technician_id=assignment.technician_id,
        arrived_at=assignment.arrived_at,
        work_started_at=assignment.work_started_at,
        work_completed_at=assignment.work_completed_at,
        completion_note=assignment.completion_note,
    )


@router.post(
    "/{ticket_id}/start-work",
    response_model=ExecutionActionResponse,
    summary="Technician Starts Work",
)
def start_technician_work_endpoint(
    ticket_id: uuid.UUID,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID verification"),
    db: Session = Depends(get_db),
) -> ExecutionActionResponse:
    """Technician initiates work after marking arrival (ticket moves to IN_PROGRESS)."""
    ticket, assignment = execution_service.start_technician_work(
        db,
        ticket_id=ticket_id,
        technician_id=technician_id,
    )
    return ExecutionActionResponse(
        ticket_id=ticket.id,
        status=ticket.status,
        assignment_id=assignment.id,
        technician_id=assignment.technician_id,
        arrived_at=assignment.arrived_at,
        work_started_at=assignment.work_started_at,
        work_completed_at=assignment.work_completed_at,
        completion_note=assignment.completion_note,
    )


@router.post(
    "/{ticket_id}/complete-work",
    response_model=ExecutionActionResponse,
    summary="Technician Completes Work",
)
def complete_technician_work_endpoint(
    ticket_id: uuid.UUID,
    request_in: CompleteWorkRequest | None = None,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID verification"),
    db: Session = Depends(get_db),
) -> ExecutionActionResponse:
    """Technician marks work complete (ticket moves to AWAITING_CUSTOMER_CONFIRMATION)."""
    ticket, assignment = execution_service.complete_technician_work(
        db,
        ticket_id=ticket_id,
        request_in=request_in,
        technician_id=technician_id,
    )
    return ExecutionActionResponse(
        ticket_id=ticket.id,
        status=ticket.status,
        assignment_id=assignment.id,
        technician_id=assignment.technician_id,
        arrived_at=assignment.arrived_at,
        work_started_at=assignment.work_started_at,
        work_completed_at=assignment.work_completed_at,
        completion_note=assignment.completion_note,
    )
