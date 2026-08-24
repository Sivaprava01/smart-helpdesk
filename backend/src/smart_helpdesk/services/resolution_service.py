from datetime import datetime, timezone
from decimal import Decimal
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.db.models.ticket_feedback import TicketFeedback
from smart_helpdesk.schemas.assignment import FallbackSummary
from smart_helpdesk.schemas.feedback import CustomerResponseRequest
from smart_helpdesk.services.assignment_service import reroute_ticket

# Thresholds for classifying interaction sentiment
POSITIVE_RATING_THRESHOLD = 4
NEGATIVE_RATING_THRESHOLD = 2


def get_completed_assignment_awaiting_confirmation(
    db: Session,
    ticket_id: uuid.UUID,
) -> TechnicianAssignment:
    """Finds the active accepted assignment with completed work awaiting customer confirmation."""
    query = (
        select(TechnicianAssignment)
        .where(
            TechnicianAssignment.ticket_id == ticket_id,
            TechnicianAssignment.status == AssignmentStatus.ACCEPTED,
            TechnicianAssignment.work_completed_at.isnot(None),
        )
        .order_by(TechnicianAssignment.work_completed_at.desc())
    )
    assignment = db.execute(query).scalar_one_or_none()
    if not assignment:
        raise BusinessRuleError("No completed assignment awaiting customer confirmation found for this ticket")
    return assignment


def record_customer_feedback(
    db: Session,
    ticket: Ticket,
    assignment: TechnicianAssignment,
    feedback_in: CustomerResponseRequest,
    customer_id: uuid.UUID | None = None,
) -> TicketFeedback:
    """Validates and persists a customer feedback record for a completed service attempt."""
    if customer_id is not None and ticket.customer_id != customer_id:
        raise BusinessRuleError("Customer ID does not match ticket owner")

    # Check for duplicate feedback on this specific service attempt
    existing_feedback = db.execute(
        select(TicketFeedback).where(TicketFeedback.assignment_id == assignment.id)
    ).scalar_one_or_none()
    if existing_feedback:
        raise BusinessRuleError("Feedback has already been submitted for this completed service attempt")

    if feedback_in.rating is not None and (feedback_in.rating < 1 or feedback_in.rating > 5):
        raise BusinessRuleError("Rating must be an integer between 1 and 5")

    feedback = TicketFeedback(
        ticket_id=ticket.id,
        assignment_id=assignment.id,
        customer_id=ticket.customer_id,
        technician_id=assignment.technician_id,
        was_issue_resolved=feedback_in.was_issue_resolved,
        rating=feedback_in.rating,
        comment=feedback_in.comment,
    )
    db.add(feedback)
    db.flush()
    return feedback


def update_customer_technician_history(
    db: Session,
    customer_id: uuid.UUID,
    technician_id: uuid.UUID,
    was_issue_resolved: bool,
    rating: int | None,
) -> CustomerTechnicianHistory:
    """Updates or creates pairwise interaction statistics between customer and technician."""
    history = db.execute(
        select(CustomerTechnicianHistory).where(
            CustomerTechnicianHistory.customer_id == customer_id,
            CustomerTechnicianHistory.technician_id == technician_id,
        )
    ).scalar_one_or_none()

    if not history:
        history = CustomerTechnicianHistory(
            customer_id=customer_id,
            technician_id=technician_id,
            positive_interactions=0,
            negative_interactions=0,
            successful_jobs_count=0,
        )
        db.add(history)
        db.flush()

    now = datetime.now(timezone.utc)
    history.last_interaction_at = now

    if was_issue_resolved:
        history.successful_jobs_count += 1
        if rating is None or rating >= POSITIVE_RATING_THRESHOLD:
            history.positive_interactions += 1
        elif rating <= NEGATIVE_RATING_THRESHOLD:
            history.negative_interactions += 1
    else:
        history.negative_interactions += 1

    db.flush()
    return history


def update_technician_metrics(
    db: Session,
    technician_id: uuid.UUID,
    was_issue_resolved: bool,
    rating: int | None,
) -> Technician:
    """Updates technician completed jobs, reopen counts, rating aggregates, and releases workload."""
    technician = db.get(Technician, technician_id)
    if not technician:
        raise EntityNotFoundError(f"Technician with id '{technician_id}' not found")

    # 1. Job outcome counts
    technician.completed_jobs_count += 1
    if not was_issue_resolved:
        technician.reopened_jobs_count += 1

    # 2. Rating aggregates (only if rating was explicitly provided)
    if rating is not None:
        technician.rating_sum += Decimal(rating)
        technician.rating_count += 1
        technician.overall_rating = (
            technician.rating_sum / Decimal(technician.rating_count)
        ).quantize(Decimal("0.01"))

    # 3. Release active workload safely
    technician.current_workload = max(0, technician.current_workload - 1)

    db.flush()
    return technician


def process_customer_resolution_response(
    db: Session,
    ticket_id: uuid.UUID,
    feedback_in: CustomerResponseRequest,
    customer_id: uuid.UUID | None = None,
) -> tuple[Ticket, TicketFeedback, FallbackSummary | None]:
    """Processes customer resolution confirmation, updates metrics/history, and closes or reopens ticket.

    Flow:
    - If was_issue_resolved == True:
        - Stores feedback
        - Updates customer-technician history positively/neutrally
        - Updates technician rating & completed count
        - Decrements technician workload
        - Sets assignment status to COMPLETED
        - Sets ticket status to CLOSED
    - If was_issue_resolved == False:
        - Stores feedback
        - Updates customer-technician history negatively
        - Increments technician completed count & reopened count
        - Decrements technician workload (releases previous technician)
        - Sets previous assignment status to COMPLETED
        - Sets ticket status to REOPENED
        - Triggers live fallback rerouting excluding previous technicians
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    if ticket.status != TicketStatus.AWAITING_CUSTOMER_CONFIRMATION:
        raise BusinessRuleError(
            f"Cannot submit customer response for ticket in '{ticket.status.value}' status. Must be in 'AWAITING_CUSTOMER_CONFIRMATION' status."
        )

    assignment = get_completed_assignment_awaiting_confirmation(db, ticket_id)

    # 1. Persist feedback
    feedback = record_customer_feedback(
        db,
        ticket=ticket,
        assignment=assignment,
        feedback_in=feedback_in,
        customer_id=customer_id,
    )

    # 2. Update pairwise customer-technician history
    update_customer_technician_history(
        db,
        customer_id=ticket.customer_id,
        technician_id=assignment.technician_id,
        was_issue_resolved=feedback_in.was_issue_resolved,
        rating=feedback_in.rating,
    )

    # 3. Update technician aggregate metrics and release workload
    update_technician_metrics(
        db,
        technician_id=assignment.technician_id,
        was_issue_resolved=feedback_in.was_issue_resolved,
        rating=feedback_in.rating,
    )

    # 4. Finalize the completed assignment attempt
    assignment.status = AssignmentStatus.COMPLETED
    db.flush()

    # 5. Handle success vs reopen outcome
    if feedback_in.was_issue_resolved:
        ticket.status = TicketStatus.CLOSED
        db.commit()
        db.refresh(ticket)
        db.refresh(feedback)
        return ticket, feedback, None
    else:
        # Reopen ticket and trigger live fallback rerouting
        ticket.status = TicketStatus.REOPENED
        db.flush()

        new_assignment, fallback_summary = reroute_ticket(db, ticket.id)
        if fallback_summary.status == "NEW_TECHNICIAN_OFFERED":
            ticket.status = TicketStatus.ROUTING
        else:
            ticket.status = TicketStatus.REOPENED
            fallback_summary.status = "NO_ALTERNATIVE_TECHNICIAN_AVAILABLE"

        db.commit()
        db.refresh(ticket)
        db.refresh(feedback)
        return ticket, feedback, fallback_summary


def list_ticket_feedbacks(
    db: Session,
    ticket_id: uuid.UUID,
) -> list[TicketFeedback]:
    """Returns all feedback records for a ticket ordered chronologically."""
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    query = (
        select(TicketFeedback)
        .where(TicketFeedback.ticket_id == ticket_id)
        .order_by(TicketFeedback.created_at.asc())
    )
    return list(db.execute(query).scalars().all())
