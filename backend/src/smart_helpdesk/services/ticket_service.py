import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.schemas.ticket import TicketCreate, TicketUpdate


def create_ticket(db: Session, ticket_in: TicketCreate) -> Ticket:
    """Creates a new service ticket in initial PENDING status after validating references."""
    # 1. Validate referenced customer
    customer = db.get(Customer, ticket_in.customer_id)
    if not customer:
        raise EntityNotFoundError(f"Customer with id '{ticket_in.customer_id}' not found")
    if not customer.is_active:
        raise BusinessRuleError("Cannot create tickets for an inactive customer account")

    # 2. Validate referenced service category
    category = db.get(ServiceCategory, ticket_in.category_id)
    if not category:
        raise EntityNotFoundError(f"Service category with id '{ticket_in.category_id}' not found")
    if not category.is_active:
        raise BusinessRuleError(f"Service category '{category.name}' is inactive and cannot accept new tickets")

    # 3. Create ticket in PENDING status (pre-routing state)
    ticket = Ticket(
        customer_id=ticket_in.customer_id,
        category_id=ticket_in.category_id,
        contact_name=ticket_in.contact_name,
        contact_phone=ticket_in.contact_phone,
        description=ticket_in.description,
        location=ticket_in.location,
        preferred_time=ticket_in.preferred_time,
        status=TicketStatus.PENDING,
        is_scheduled=ticket_in.is_scheduled,
        scheduled_for=ticket_in.scheduled_for,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_ticket(db: Session, ticket_id: uuid.UUID) -> Ticket:
    """Fetches a ticket by UUID or raises EntityNotFoundError."""
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise EntityNotFoundError(f"Ticket with id '{ticket_id}' not found")
    return ticket


def list_tickets(
    db: Session,
    customer_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    status: TicketStatus | None = None,
    is_scheduled: bool | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Ticket]:
    """Retrieves tickets with optional customer, category, status, and scheduling filters."""
    query = select(Ticket)
    if customer_id is not None:
        query = query.where(Ticket.customer_id == customer_id)
    if category_id is not None:
        query = query.where(Ticket.category_id == category_id)
    if status is not None:
        query = query.where(Ticket.status == status)
    if is_scheduled is not None:
        query = query.where(Ticket.is_scheduled == is_scheduled)

    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(query).scalars().all())


def get_ticket_status(db: Session, ticket_id: uuid.UUID) -> dict[str, object]:
    """Returns ticket status data for polling."""
    ticket = get_ticket(db, ticket_id)
    return {
        "ticket_id": ticket.id,
        "status": ticket.status,
        "updated_at": ticket.updated_at,
    }


def update_ticket(db: Session, ticket_id: uuid.UUID, ticket_in: TicketUpdate) -> Ticket:
    """Applies controlled partial updates to ticket details before assignment."""
    ticket = get_ticket(db, ticket_id)

    # Lifecycle protection: only pre-assignment tickets in PENDING status can be updated
    if ticket.status != TicketStatus.PENDING:
        raise BusinessRuleError(
            f"Cannot edit ticket in '{ticket.status.value}' status. Only PENDING tickets can be updated."
        )

    update_data = ticket_in.model_dump(exclude_unset=True)
    if not update_data:
        return ticket

    # Validate category update if requested
    if "category_id" in update_data and update_data["category_id"] != ticket.category_id:
        new_category = db.get(ServiceCategory, update_data["category_id"])
        if not new_category:
            raise EntityNotFoundError(f"Service category with id '{update_data['category_id']}' not found")
        if not new_category.is_active:
            raise BusinessRuleError(f"Service category '{new_category.name}' is inactive and cannot be assigned")

    for key, value in update_data.items():
        setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)
    return ticket


def cancel_ticket(db: Session, ticket_id: uuid.UUID) -> Ticket:
    """Cancels a pending ticket safely without deleting historical data."""
    ticket = get_ticket(db, ticket_id)

    if ticket.status == TicketStatus.CANCELLED:
        raise BusinessRuleError("Ticket is already cancelled")

    if ticket.status != TicketStatus.PENDING:
        raise BusinessRuleError(
            f"Cannot cancel ticket in '{ticket.status.value}' status. Only PENDING tickets can be cancelled."
        )

    ticket.status = TicketStatus.CANCELLED
    db.commit()
    db.refresh(ticket)
    return ticket
