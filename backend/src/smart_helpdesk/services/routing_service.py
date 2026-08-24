import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.routing.eligibility import filter_eligible_technicians
from smart_helpdesk.routing.ranking import rank_eligible_technicians
from smart_helpdesk.routing.schemas import RoutingPreviewResponse


def evaluate_ticket_routing(db: Session, ticket_id: uuid.UUID) -> RoutingPreviewResponse:
    """Orchestrates candidate gathering, eligibility evaluation, and deterministic ranking for a ticket.

    Guarantees:
    - Strictly READ-ONLY (no database mutations, no assignment creation, no status change).
    - Only routable ticket statuses (PENDING, ROUTING) are evaluated.
    """
    # 1. Fetch ticket and validate existence
    ticket = db.execute(
        select(Ticket)
        .options(selectinload(Ticket.category), selectinload(Ticket.customer))
        .where(Ticket.id == ticket_id)
    ).scalar_one_or_none()

    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")

    # 2. Enforce routable status check
    routable_statuses = {TicketStatus.PENDING, TicketStatus.ROUTING}
    if ticket.status not in routable_statuses:
        raise BusinessRuleError(
            f"Cannot evaluate routing for ticket in '{ticket.status.value}' status. "
            "Only tickets in PENDING or ROUTING status can be evaluated."
        )

    # 3. Gather candidate pool of technicians
    technicians = list(
        db.execute(
            select(Technician).options(selectinload(Technician.categories))
        ).scalars().all()
    )

    # 4. Filter into eligible vs excluded candidates
    eligible_technicians, excluded_candidates = filter_eligible_technicians(
        technicians=technicians,
        required_category_id=ticket.category_id,
    )

    # 5. Gather customer-technician pairwise interaction histories for eligible technicians
    histories_by_tech_id: dict[uuid.UUID, CustomerTechnicianHistory] = {}
    if eligible_technicians:
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

    # 6. Rank eligible candidates using multi-factor deterministic scoring and tie-breaking
    ranked_candidates, recommended = rank_eligible_technicians(
        eligible_technicians=eligible_technicians,
        ticket_location=ticket.location,
        histories_by_tech_id=histories_by_tech_id,
    )

    # 7. Assemble explainable routing preview response
    category_name = ticket.category.name if ticket.category else "Unknown"
    return RoutingPreviewResponse(
        ticket_id=ticket.id,
        ticket_category=category_name,
        technicians_considered=len(technicians),
        eligible_count=len(eligible_technicians),
        excluded_candidates=excluded_candidates,
        ranked_candidates=ranked_candidates,
        recommended_technician=recommended,
    )
