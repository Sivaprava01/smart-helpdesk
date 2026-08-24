import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.assignment import (
    AssignmentActionResponse,
    AssignmentResponse,
    DeclineRequest,
    ExpiredProcessingResponse,
)
from smart_helpdesk.services import assignment_service

router = APIRouter()


@router.post(
    "/{assignment_id}/accept",
    response_model=AssignmentActionResponse,
    summary="Accept Assignment Offer",
)
def accept_assignment_endpoint(
    assignment_id: uuid.UUID,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID for recipient verification"),
    db: Session = Depends(get_db),
) -> AssignmentActionResponse:
    """Accept an active technician assignment offer, transition ticket to ASSIGNED, and increment workload."""
    assignment = assignment_service.accept_assignment(
        db,
        assignment_id=assignment_id,
        technician_id=technician_id,
    )
    return AssignmentActionResponse(
        ticket_id=assignment.ticket_id,
        assignment=AssignmentResponse.model_validate(assignment),
        fallback=None,
    )


@router.post(
    "/{assignment_id}/decline",
    response_model=AssignmentActionResponse,
    summary="Decline Assignment Offer",
)
def decline_assignment_endpoint(
    assignment_id: uuid.UUID,
    decline_in: DeclineRequest | None = None,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID for recipient verification"),
    db: Session = Depends(get_db),
) -> AssignmentActionResponse:
    """Decline an assignment offer and immediately trigger fallback rerouting using live current data."""
    assignment, fallback_summary = assignment_service.decline_assignment(
        db,
        assignment_id=assignment_id,
        decline_in=decline_in,
        technician_id=technician_id,
    )
    return AssignmentActionResponse(
        ticket_id=assignment.ticket_id,
        assignment=AssignmentResponse.model_validate(assignment),
        fallback=fallback_summary,
    )


@router.post(
    "/{assignment_id}/ask-later",
    response_model=AssignmentActionResponse,
    summary="Defer Assignment Offer (Ask Me Later)",
)
def defer_assignment_endpoint(
    assignment_id: uuid.UUID,
    technician_id: uuid.UUID | None = Query(None, description="Optional technician ID for recipient verification"),
    db: Session = Depends(get_db),
) -> AssignmentActionResponse:
    """Defer deciding on an assignment offer while preserving the original response deadline."""
    assignment = assignment_service.defer_assignment(
        db,
        assignment_id=assignment_id,
        technician_id=technician_id,
    )
    return AssignmentActionResponse(
        ticket_id=assignment.ticket_id,
        assignment=AssignmentResponse.model_validate(assignment),
        fallback=None,
    )


@router.post(
    "/process-expired",
    response_model=ExpiredProcessingResponse,
    summary="Process Expired Assignment Offers",
)
def process_expired_assignments_endpoint(
    db: Session = Depends(get_db),
) -> ExpiredProcessingResponse:
    """Explicit endpoint to detect expired assignment offers and trigger fallback rerouting."""
    return assignment_service.process_expired_assignments(db)
