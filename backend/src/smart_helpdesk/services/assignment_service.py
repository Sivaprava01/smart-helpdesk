from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.routing.eligibility import filter_eligible_technicians
from smart_helpdesk.routing.ranking import rank_eligible_technicians
from smart_helpdesk.schemas.assignment import DeclineRequest, FallbackSummary
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

    query = (
        select(TechnicianAssignment)
        .where(TechnicianAssignment.ticket_id == ticket_id)
        .order_by(TechnicianAssignment.assigned_at.desc())
    )
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


def reroute_ticket(
    db: Session,
    ticket_id: uuid.UUID,
) -> tuple[TechnicianAssignment | None, FallbackSummary]:
    """Executes live fallback rerouting excluding technicians already attempted for this ticket.

    Guarantees:
    - Never reuses stale ranking lists.
    - Re-evaluates eligibility against live current technician states.
    - Excludes previously attempted technicians.
    - Updates ticket to ROUTING on new offer, or resets to PENDING if no candidates remain.
    """
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    # 1. Query all attempted technician IDs for this ticket
    past_assignments = db.execute(
        select(TechnicianAssignment).where(TechnicianAssignment.ticket_id == ticket_id)
    ).scalars().all()
    attempted_technician_ids = {a.technician_id for a in past_assignments}

    # 2. Gather candidate pool of technicians
    technicians = list(
        db.execute(
            select(Technician).options(selectinload(Technician.categories))
        ).scalars().all()
    )

    # 3. Filter candidates: must not be in attempted_technician_ids
    candidate_pool = [t for t in technicians if t.id not in attempted_technician_ids]

    # 4. Evaluate eligibility using current live states
    eligible_technicians, _ = filter_eligible_technicians(
        technicians=candidate_pool,
        required_category_id=ticket.category_id,
    )

    # 5. If no candidates eligible
    if not eligible_technicians:
        ticket.status = TicketStatus.PENDING
        db.commit()
        return None, FallbackSummary(status="NO_ELIGIBLE_TECHNICIAN_AVAILABLE")

    # 6. Gather pairwise history for eligible candidates
    eligible_tech_ids = [t.id for t in eligible_technicians]
    histories = list(
        db.execute(
            select(CustomerTechnicianHistory).where(
                CustomerTechnicianHistory.customer_id == ticket.customer_id,
                CustomerTechnicianHistory.technician_id.in_(eligible_tech_ids),
            )
        ).scalars().all()
    )
    histories_by_tech_id = {h.technician_id: h for h in histories}

    # 7. Rank eligible candidates using live data
    ranked_candidates, recommended = rank_eligible_technicians(
        eligible_technicians=eligible_technicians,
        ticket_location=ticket.location,
        histories_by_tech_id=histories_by_tech_id,
    )

    if not recommended:
        ticket.status = TicketStatus.PENDING
        db.commit()
        return None, FallbackSummary(status="NO_ELIGIBLE_TECHNICIAN_AVAILABLE")

    # 8. Create new assignment offer
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES)
    new_assignment = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=recommended.technician_id,
        status=AssignmentStatus.OFFERED,
        assigned_at=now,
        expires_at=expires_at,
    )
    ticket.status = TicketStatus.ROUTING
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    return new_assignment, FallbackSummary(
        status="NEW_TECHNICIAN_OFFERED",
        assignment_id=new_assignment.id,
        technician_id=recommended.technician_id,
        technician_name=recommended.technician_name,
        response_deadline=new_assignment.expires_at,
    )


def decline_assignment(
    db: Session,
    assignment_id: uuid.UUID,
    decline_in: DeclineRequest | None = None,
    technician_id: uuid.UUID | None = None,
) -> tuple[TechnicianAssignment, FallbackSummary]:
    """Declines an active assignment offer and triggers fallback rerouting with live current data."""
    assignment = db.get(TechnicianAssignment, assignment_id)
    if not assignment:
        raise EntityNotFoundError(f"Assignment with id '{assignment_id}' not found")

    if technician_id is not None and assignment.technician_id != technician_id:
        raise BusinessRuleError("Technician ID does not match assignment offer recipient")

    if assignment.status not in (AssignmentStatus.OFFERED, AssignmentStatus.DEFERRED):
        raise BusinessRuleError(f"Cannot decline assignment in '{assignment.status.value}' status")

    now = datetime.now(timezone.utc)
    assignment.status = AssignmentStatus.DECLINED
    assignment.declined_at = now
    assignment.responded_at = now

    if decline_in:
        assignment.decline_reason = decline_in.reason.value if decline_in.reason else None
        assignment.decline_note = decline_in.note

    db.flush()

    # Trigger fallback rerouting
    new_assignment, fallback_summary = reroute_ticket(db, assignment.ticket_id)
    db.commit()
    db.refresh(assignment)

    return assignment, fallback_summary
