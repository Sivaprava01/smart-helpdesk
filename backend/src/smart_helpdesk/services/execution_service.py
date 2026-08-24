from datetime import datetime, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.schemas.execution import CompleteWorkRequest


def get_active_accepted_assignment(
    db: Session,
    ticket_id: uuid.UUID,
) -> TechnicianAssignment:
    """Retrieves the active accepted assignment for a ticket or raises BusinessRuleError."""
    query = select(TechnicianAssignment).where(
        TechnicianAssignment.ticket_id == ticket_id,
        TechnicianAssignment.status == AssignmentStatus.ACCEPTED,
    )
    assignment = db.execute(query).scalar_one_or_none()
    if not assignment:
        raise BusinessRuleError("No active accepted assignment found for this ticket")
    return assignment


def mark_technician_arrived(
    db: Session,
    ticket_id: uuid.UUID,
    technician_id: uuid.UUID | None = None,
) -> tuple[Ticket, TechnicianAssignment]:
    """Records on-site technician arrival and transitions ticket status to ARRIVED."""
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    assignment = get_active_accepted_assignment(db, ticket_id)

    if technician_id is not None and assignment.technician_id != technician_id:
        raise BusinessRuleError("Technician ID does not match assigned technician for this ticket")

    if ticket.status == TicketStatus.ARRIVED:
        raise BusinessRuleError("Technician has already marked arrival for this ticket")

    if ticket.status != TicketStatus.ASSIGNED:
        raise BusinessRuleError(
            f"Cannot mark arrival for ticket in '{ticket.status.value}' status. Must be in 'ASSIGNED' status."
        )

    now = datetime.now(timezone.utc)
    ticket.status = TicketStatus.ARRIVED
    assignment.arrived_at = now

    db.commit()
    db.refresh(ticket)
    db.refresh(assignment)
    return ticket, assignment


def start_technician_work(
    db: Session,
    ticket_id: uuid.UUID,
    technician_id: uuid.UUID | None = None,
) -> tuple[Ticket, TechnicianAssignment]:
    """Records service work initiation and transitions ticket status to IN_PROGRESS."""
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    assignment = get_active_accepted_assignment(db, ticket_id)

    if technician_id is not None and assignment.technician_id != technician_id:
        raise BusinessRuleError("Technician ID does not match assigned technician for this ticket")

    if ticket.status == TicketStatus.IN_PROGRESS:
        raise BusinessRuleError("Work is already in progress for this ticket")

    if ticket.status != TicketStatus.ARRIVED:
        raise BusinessRuleError(
            f"Cannot start work for ticket in '{ticket.status.value}' status. Technician must mark arrival first."
        )

    now = datetime.now(timezone.utc)
    ticket.status = TicketStatus.IN_PROGRESS
    assignment.work_started_at = now

    db.commit()
    db.refresh(ticket)
    db.refresh(assignment)
    return ticket, assignment


def complete_technician_work(
    db: Session,
    ticket_id: uuid.UUID,
    request_in: CompleteWorkRequest | None = None,
    technician_id: uuid.UUID | None = None,
) -> tuple[Ticket, TechnicianAssignment]:
    """Records technician work completion and transitions ticket to AWAITING_CUSTOMER_CONFIRMATION.

    Important Product Guarantee:
    - Completing work does NOT close the ticket.
    - Technician workload is NOT decreased yet (must wait for customer confirmation).
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    assignment = get_active_accepted_assignment(db, ticket_id)

    if technician_id is not None and assignment.technician_id != technician_id:
        raise BusinessRuleError("Technician ID does not match assigned technician for this ticket")

    if ticket.status == TicketStatus.AWAITING_CUSTOMER_CONFIRMATION:
        raise BusinessRuleError("Work has already been completed and is awaiting customer confirmation")

    if ticket.status != TicketStatus.IN_PROGRESS:
        raise BusinessRuleError(
            f"Cannot complete work for ticket in '{ticket.status.value}' status. Work must be in 'IN_PROGRESS' status."
        )

    now = datetime.now(timezone.utc)
    ticket.status = TicketStatus.AWAITING_CUSTOMER_CONFIRMATION
    assignment.work_completed_at = now
    if request_in and request_in.note:
        assignment.completion_note = request_in.note

    db.commit()
    db.refresh(ticket)
    db.refresh(assignment)
    return ticket, assignment
