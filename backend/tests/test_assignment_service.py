from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.services.assignment_service import (
    accept_assignment,
    get_active_assignment_for_ticket,
    list_ticket_assignments,
    start_assignment,
)


@pytest.fixture
def db_session() -> Session:
    """Provides an isolated in-memory SQLite database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False,
    )
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_start_assignment_and_accept_workflow(db_session: Session) -> None:
    cat = ServiceCategory(name="Plumbing", is_active=True)
    cust = Customer(full_name="Alice", email="alice@example.com", phone_number="+1000000001")
    db_session.add_all([cat, cust])
    db_session.commit()

    tech = Technician(
        full_name="Ravi",
        email="ravi@example.com",
        phone_number="+1000000002",
        is_active=True,
        is_on_duty=True,
        current_workload=0,
        max_workload=5,
        categories=[cat],
    )
    db_session.add(tech)
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Alice",
        contact_phone="+1000000001",
        description="Washroom pipe leakage",
        location="Tower A",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    # 1. Start assignment offer
    assignment, status_msg = start_assignment(db_session, ticket.id)
    assert status_msg == "NEW_TECHNICIAN_OFFERED"
    assert assignment is not None
    assert assignment.technician_id == tech.id
    assert assignment.status == AssignmentStatus.OFFERED
    assert assignment.expires_at is not None

    # Verify ticket state is ROUTING and technician workload is NOT incremented yet
    db_session.refresh(ticket)
    db_session.refresh(tech)
    assert ticket.status == TicketStatus.ROUTING
    assert tech.current_workload == 0

    # 2. Duplicate start assignment fails (active offer guard)
    with pytest.raises(BusinessRuleError) as exc_info:
        start_assignment(db_session, ticket.id)
    assert "already has an active assignment offer" in str(exc_info.value)

    # 3. Accept assignment
    accepted = accept_assignment(db_session, assignment.id, technician_id=tech.id)
    assert accepted.status == AssignmentStatus.ACCEPTED
    assert accepted.accepted_at is not None

    # Verify ticket is ASSIGNED and technician workload is incremented
    db_session.refresh(ticket)
    db_session.refresh(tech)
    assert ticket.status == TicketStatus.ASSIGNED
    assert tech.current_workload == 1


def test_start_assignment_scheduled_future_ticket_rejected(db_session: Session) -> None:
    cat = ServiceCategory(name="Cleaning", is_active=True)
    cust = Customer(full_name="Bob", email="bob@example.com", phone_number="+1000000003")
    db_session.add_all([cat, cust])
    db_session.commit()

    future_time = datetime.now(timezone.utc) + timedelta(days=2)
    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Bob",
        contact_phone="+1000000003",
        description="Scheduled cleaning",
        location="Tower B",
        is_scheduled=True,
        scheduled_for=future_time,
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    with pytest.raises(BusinessRuleError) as exc_info:
        start_assignment(db_session, ticket.id)
    assert "future scheduled ticket" in str(exc_info.value)


def test_accept_assignment_expired_rejected(db_session: Session) -> None:
    cat = ServiceCategory(name="Electrical", is_active=True)
    cust = Customer(full_name="Carol", email="carol@example.com", phone_number="+1000000004")
    db_session.add_all([cat, cust])
    db_session.commit()

    tech = Technician(
        full_name="David",
        email="david@example.com",
        phone_number="+1000000005",
        is_active=True,
        is_on_duty=True,
        categories=[cat],
    )
    db_session.add(tech)
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Carol",
        contact_phone="+1000000004",
        description="Short circuit",
        location="Tower C",
        status=TicketStatus.ROUTING,
    )
    db_session.add(ticket)
    db_session.commit()

    past_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    assignment = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=tech.id,
        status=AssignmentStatus.OFFERED,
        expires_at=past_time,
    )
    db_session.add(assignment)
    db_session.commit()

    with pytest.raises(BusinessRuleError) as exc_info:
        accept_assignment(db_session, assignment.id)
    assert "expired" in str(exc_info.value)

    db_session.refresh(assignment)
    assert assignment.status == AssignmentStatus.EXPIRED


def test_accept_assignment_wrong_technician_rejected(db_session: Session) -> None:
    cat = ServiceCategory(name="HVAC", is_active=True)
    cust = Customer(full_name="Dan", email="dan@example.com", phone_number="+1000000006")
    db_session.add_all([cat, cust])
    db_session.commit()

    tech1 = Technician(
        full_name="Tech 1", email="t1@example.com", phone_number="+1000000007",
        is_active=True, is_on_duty=True, categories=[cat]
    )
    tech2 = Technician(
        full_name="Tech 2", email="t2@example.com", phone_number="+1000000008",
        is_active=True, is_on_duty=True, categories=[cat]
    )
    db_session.add_all([tech1, tech2])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Dan",
        contact_phone="+1000000006",
        description="AC fix",
        location="Tower D",
    )
    db_session.add(ticket)
    db_session.commit()

    assignment = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=tech1.id,
        status=AssignmentStatus.OFFERED,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db_session.add(assignment)
    db_session.commit()

    # tech2 tries to accept assignment destined for tech1
    with pytest.raises(BusinessRuleError) as exc_info:
        accept_assignment(db_session, assignment.id, technician_id=tech2.id)
    assert "Technician ID does not match" in str(exc_info.value)
