from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.services.routing_service import evaluate_ticket_routing

# Centralized response timeout window
ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES = 10


def get_active_assignment_for_ticket(
    db: Session,
    ticket_id: uuid.UUID,
) -> TechnicianAssignment | None:
    """Returns the currently active (OFFERED or DEFERRED) assignment for a ticket if one exists."""
    query = select(TechnicianAssignment).where(
        TechnicianAssignment.ticket_id == ticket_id,
        TechnicianAssignment.status.in_([AssignmentStatus.OFFERED, AssignmentStatus.DEFERRED]),
    )
    return db.execute(query).scalar_one_or_none()


def list_ticket_assignments(
    db: Session,
    ticket_id: uuid.UUID,
) -> list[TechnicianAssignment]:
    """Returns complete assignment attempt history for a ticket ordered chronologically."""
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    query = select(TechnicianAssignment).where(
        TechnicianAssignment.ticket_id == ticket_id
    ).order_by(TechnicianAssignment.assigned_at.desc())
    return list(db.execute(query).scalars().all())


def start_assignment(
    db: Session,
    ticket_id: uuid.UUID,
) -> tuple[TechnicianAssignment | None, str]:
    """Initiates the assignment workflow for a ticket by evaluating routing and creating an initial offer.

    Rules:
    - Ticket must be in routable status (PENDING, ROUTING).
    - Future scheduled tickets cannot be dispatched before their scheduled datetime.
    - At most ONE active offer can exist per ticket.
    - Creating an offer does NOT increase technician workload.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    # 1. Protect against premature scheduled ticket dispatch
    if ticket.is_scheduled and ticket.scheduled_for is not None:
        now = datetime.now(timezone.utc)
        scheduled_time = (
            ticket.scheduled_for
            if ticket.scheduled_for.tzinfo is not None
            else ticket.scheduled_for.replace(tzinfo=timezone.utc)
        )
        if scheduled_time > now:
            raise BusinessRuleError("Cannot dispatch future scheduled ticket before its scheduled time")

    # 2. Check routable state
    if ticket.status not in (TicketStatus.PENDING, TicketStatus.ROUTING):
        raise BusinessRuleError(f"Cannot assign ticket in '{ticket.status.value}' status")

    # 3. Active offer guard
    active = get_active_assignment_for_ticket(db, ticket_id)
    if active:
        raise BusinessRuleError(
            f"Ticket already has an active assignment offer with technician id '{active.technician_id}'"
        )

    # 4. Evaluate routing using live current data
    routing_result = evaluate_ticket_routing(db, ticket_id)
    if not routing_result.recommended_technician or routing_result.eligible_count == 0:
        ticket.status = TicketStatus.PENDING
        db.commit()
        return None, "NO_ELIGIBLE_TECHNICIAN_AVAILABLE"

    # 5. Create initial offer
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES)
    assignment = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=routing_result.recommended_technician.technician_id,
        status=AssignmentStatus.OFFERED,
        assigned_at=now,
        expires_at=expires_at,
    )
    ticket.status = TicketStatus.ROUTING
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment, "NEW_TECHNICIAN_OFFERED"


def accept_assignment(
    db: Session,
    assignment_id: uuid.UUID,
    technician_id: uuid.UUID | None = None,
) -> TechnicianAssignment:
    """Accepts an active assignment offer atomically updating assignment, ticket, and technician workload."""
    assignment = db.get(TechnicianAssignment, assignment_id)
    if not assignment:
        raise EntityNotFoundError(f"Assignment with id '{assignment_id}' not found")

    if technician_id is not None and assignment.technician_id != technician_id:
        raise BusinessRuleError("Technician ID does not match assignment offer recipient")

    if assignment.status == AssignmentStatus.ACCEPTED:
        raise BusinessRuleError("Assignment offer has already been accepted")

    if assignment.status not in (AssignmentStatus.OFFERED, AssignmentStatus.DEFERRED):
        raise BusinessRuleError(f"Cannot accept assignment in '{assignment.status.value}' status")

    # Validate response deadline
    now = datetime.now(timezone.utc)
    if assignment.expires_at:
        expires_time = (
            assignment.expires_at
            if assignment.expires_at.tzinfo is not None
            else assignment.expires_at.replace(tzinfo=timezone.utc)
        )
        if expires_time <= now:
            assignment.status = AssignmentStatus.EXPIRED
            db.commit()
            raise BusinessRuleError("Assignment offer has expired and cannot be accepted")

    # Atomic acceptance
    assignment.status = AssignmentStatus.ACCEPTED
    assignment.accepted_at = now
    assignment.responded_at = now

    ticket = db.get(Ticket, assignment.ticket_id)
    if ticket:
        ticket.status = TicketStatus.ASSIGNED

    technician = db.get(Technician, assignment.technician_id)
    if technician:
        technician.current_workload += 1

    db.commit()
    db.refresh(assignment)
    return assignment
