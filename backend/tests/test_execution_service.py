from datetime import datetime, timezone
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
from smart_helpdesk.schemas.execution import CompleteWorkRequest
from smart_helpdesk.services.assignment_service import (
    accept_assignment,
    start_assignment,
)
from smart_helpdesk.services.execution_service import (
    complete_technician_work,
    mark_technician_arrived,
    start_technician_work,
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


def test_service_execution_lifecycle_happy_path(db_session: Session) -> None:
    cat = ServiceCategory(name="Plumbing", is_active=True)
    cust = Customer(full_name="Alice", email="alice@example.com", phone_number="+1000000001")
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
    db_session.add_all([cat, cust, tech])
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

    # 1. Offer & Accept
    assignment, _ = start_assignment(db_session, ticket.id)
    assert assignment is not None
    accept_assignment(db_session, assignment.id, technician_id=tech.id)

    db_session.refresh(ticket)
    assert ticket.status == TicketStatus.ASSIGNED

    # 2. Technician Arrives
    ticket, assignment = mark_technician_arrived(db_session, ticket.id, technician_id=tech.id)
    assert ticket.status == TicketStatus.ARRIVED
    assert assignment.arrived_at is not None

    # Duplicate arrival fails
    with pytest.raises(BusinessRuleError) as exc_info:
        mark_technician_arrived(db_session, ticket.id, technician_id=tech.id)
    assert "already marked arrival" in str(exc_info.value)

    # 3. Technician Starts Work
    ticket, assignment = start_technician_work(db_session, ticket.id, technician_id=tech.id)
    assert ticket.status == TicketStatus.IN_PROGRESS
    assert assignment.work_started_at is not None

    # 4. Technician Completes Work
    req = CompleteWorkRequest(note="Replaced damaged pipe gasket and checked pressure")
    ticket, assignment = complete_technician_work(
        db_session,
        ticket.id,
        request_in=req,
        technician_id=tech.id,
    )
    assert ticket.status == TicketStatus.AWAITING_CUSTOMER_CONFIRMATION
    assert assignment.work_completed_at is not None
    assert assignment.completion_note == "Replaced damaged pipe gasket and checked pressure"

    # Ticket is NOT closed yet, and technician workload is still active (1)
    db_session.refresh(tech)
    assert tech.current_workload == 1


def test_start_work_before_arrival_fails(db_session: Session) -> None:
    cat = ServiceCategory(name="Electrical", is_active=True)
    cust = Customer(full_name="Bob", email="bob@example.com", phone_number="+1000000003")
    tech = Technician(
        full_name="David",
        email="david@example.com",
        phone_number="+1000000004",
        is_active=True,
        is_on_duty=True,
        categories=[cat],
    )
    db_session.add_all([cat, cust, tech])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Bob",
        contact_phone="+1000000003",
        description="Switchboard spark",
        location="Tower B",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    assignment, _ = start_assignment(db_session, ticket.id)
    accept_assignment(db_session, assignment.id, technician_id=tech.id)

    # Tries to start work directly while still in ASSIGNED (without arriving)
    with pytest.raises(BusinessRuleError) as exc_info:
        start_technician_work(db_session, ticket.id, technician_id=tech.id)
    assert "Technician must mark arrival first" in str(exc_info.value)


def test_execution_wrong_technician_rejected(db_session: Session) -> None:
    cat = ServiceCategory(name="HVAC", is_active=True)
    cust = Customer(full_name="Carol", email="carol@example.com", phone_number="+1000000005")
    tech1 = Technician(
        full_name="Tech 1", email="t1@example.com", phone_number="+1000000006",
        is_active=True, is_on_duty=True, categories=[cat]
    )
    tech2 = Technician(
        full_name="Tech 2", email="t2@example.com", phone_number="+1000000007",
        is_active=True, is_on_duty=True, categories=[cat]
    )
    db_session.add_all([cat, cust, tech1, tech2])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Carol",
        contact_phone="+1000000005",
        description="AC filter cleaning",
        location="Tower C",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    assignment, _ = start_assignment(db_session, ticket.id)
    assigned_tech_id = assignment.technician_id
    other_tech_id = tech2.id if assigned_tech_id == tech1.id else tech1.id

    accept_assignment(db_session, assignment.id, technician_id=assigned_tech_id)

    # other technician attempts to mark arrival
    with pytest.raises(BusinessRuleError) as exc_info:
        mark_technician_arrived(db_session, ticket.id, technician_id=other_tech_id)
    assert "Technician ID does not match" in str(exc_info.value)
