from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import AssignmentStatus, DeclineReason, TicketStatus
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.schemas.assignment import DeclineRequest
from smart_helpdesk.services.assignment_service import (
    accept_assignment,
    decline_assignment,
    get_active_assignment_for_ticket,
    list_ticket_assignments,
    reroute_ticket,
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


def test_decline_assignment_and_live_fallback_rerouting(db_session: Session) -> None:
    cat = ServiceCategory(name="Plumbing", is_active=True)
    cust = Customer(full_name="Siva", email="siva@example.com", phone_number="+1000000009")
    db_session.add_all([cat, cust])
    db_session.commit()

    # Ravi is #1 (Tower A matching location)
    ravi = Technician(
        full_name="Ravi",
        email="ravi@example.com",
        phone_number="+1000000010",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        current_workload=0,
        max_workload=5,
        overall_rating=Decimal("4.80"),
        categories=[cat],
    )
    # Kumar is #2 (Tower D)
    kumar = Technician(
        full_name="Kumar",
        email="kumar@example.com",
        phone_number="+1000000011",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower D",
        current_workload=0,
        max_workload=5,
        overall_rating=Decimal("4.50"),
        categories=[cat],
    )
    db_session.add_all([ravi, kumar])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Siva",
        contact_phone="+1000000009",
        description="Washroom tap leaking",
        location="Tower A, Flat 101",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    # 1. Initial offer goes to Ravi
    assignment1, _ = start_assignment(db_session, ticket.id)
    assert assignment1 is not None
    assert assignment1.technician_id == ravi.id

    # 2. Ravi declines with reason BUSY
    decline_payload = DeclineRequest(reason=DeclineReason.BUSY, note="In middle of another urgent job")
    declined_assignment, fallback_summary = decline_assignment(
        db_session,
        assignment1.id,
        decline_in=decline_payload,
        technician_id=ravi.id,
    )

    # 3. Verify Ravi assignment is DECLINED with reason & note
    assert declined_assignment.status == AssignmentStatus.DECLINED
    assert declined_assignment.decline_reason == DeclineReason.BUSY.value
    assert declined_assignment.decline_note == "In middle of another urgent job"

    # 4. Verify Fallback rerouting immediately offered ticket to Kumar
    assert fallback_summary.status == "NEW_TECHNICIAN_OFFERED"
    assert fallback_summary.technician_id == kumar.id
    assert fallback_summary.technician_name == "Kumar"

    # 5. Verify database records: 2 assignment history rows exist, ticket is ROUTING
    history_list = list_ticket_assignments(db_session, ticket.id)
    assert len(history_list) == 2
    assert history_list[0].status == AssignmentStatus.OFFERED
    assert history_list[0].technician_id == kumar.id
    assert history_list[1].status == AssignmentStatus.DECLINED
    assert history_list[1].technician_id == ravi.id

    # Verify neither technician had workload incremented
    db_session.refresh(ravi)
    db_session.refresh(kumar)
    assert ravi.current_workload == 0
    assert kumar.current_workload == 0


def test_fallback_uses_live_updated_data_skips_off_duty_candidate(db_session: Session) -> None:
    cat = ServiceCategory(name="Carpentry", is_active=True)
    cust = Customer(full_name="Eva", email="eva@example.com", phone_number="+1000000012")
    db_session.add_all([cat, cust])
    db_session.commit()

    # Tech 1: Highest rank initially
    tech1 = Technician(
        full_name="Carpenter 1", email="c1@example.com", phone_number="+1000000013",
        is_active=True, is_on_duty=True, current_zone="Tower A", categories=[cat]
    )
    # Tech 2: Second highest rank initially
    tech2 = Technician(
        full_name="Carpenter 2", email="c2@example.com", phone_number="+1000000014",
        is_active=True, is_on_duty=True, current_zone="Tower B", categories=[cat]
    )
    # Tech 3: Third rank initially
    tech3 = Technician(
        full_name="Carpenter 3", email="c3@example.com", phone_number="+1000000015",
        is_active=True, is_on_duty=True, current_zone="Tower C", categories=[cat]
    )
    db_session.add_all([tech1, tech2, tech3])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id, category_id=cat.id, contact_name="Eva",
        contact_phone="+1000000012", description="Broken chair", location="Tower A"
    )
    db_session.add(ticket)
    db_session.commit()

    # Offer to Tech 1
    assignment1, _ = start_assignment(db_session, ticket.id)
    assert assignment1.technician_id == tech1.id

    # While Tech 1 is considering, Tech 2 goes OFF DUTY!
    tech2.is_on_duty = False
    db_session.commit()

    # Tech 1 declines
    _, fallback_summary = decline_assignment(db_session, assignment1.id)

    # Fallback should pick Tech 3 (since Tech 2 is now off duty in live data!)
    assert fallback_summary.status == "NEW_TECHNICIAN_OFFERED"
    assert fallback_summary.technician_id == tech3.id
    assert fallback_summary.technician_name == "Carpenter 3"
