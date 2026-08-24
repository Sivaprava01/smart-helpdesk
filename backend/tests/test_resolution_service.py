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
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.schemas.execution import CompleteWorkRequest
from smart_helpdesk.schemas.feedback import CustomerResponseRequest
from smart_helpdesk.services.assignment_service import (
    accept_assignment,
    list_ticket_assignments,
    start_assignment,
)
from smart_helpdesk.services.execution_service import (
    complete_technician_work,
    mark_technician_arrived,
    start_technician_work,
)
from smart_helpdesk.services.resolution_service import (
    list_ticket_feedbacks,
    process_customer_resolution_response,
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


def test_successful_resolution_closure_and_rating_calculation(db_session: Session) -> None:
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

    # Offer -> Accept -> Arrive -> Start Work -> Complete Work
    assignment, _ = start_assignment(db_session, ticket.id)
    accept_assignment(db_session, assignment.id, technician_id=tech.id)
    mark_technician_arrived(db_session, ticket.id, technician_id=tech.id)
    start_technician_work(db_session, ticket.id, technician_id=tech.id)
    complete_technician_work(db_session, ticket.id, CompleteWorkRequest(note="All fixed"), technician_id=tech.id)

    db_session.refresh(ticket)
    assert ticket.status == TicketStatus.AWAITING_CUSTOMER_CONFIRMATION

    # Customer confirms resolved with 5-star rating
    res_req = CustomerResponseRequest(
        was_issue_resolved=True,
        rating=5,
        comment="Fast and polite technician",
    )
    closed_ticket, feedback, fallback = process_customer_resolution_response(
        db_session,
        ticket.id,
        feedback_in=res_req,
        customer_id=cust.id,
    )

    assert closed_ticket.status == TicketStatus.CLOSED
    assert fallback is None
    assert feedback.was_issue_resolved is True
    assert feedback.rating == 5
    assert feedback.technician_id == tech.id

    # Verify technician metrics: workload released (0), 1 completed job, overall rating 5.00
    db_session.refresh(tech)
    assert tech.current_workload == 0
    assert tech.completed_jobs_count == 1
    assert tech.reopened_jobs_count == 0
    assert tech.rating_count == 1
    assert tech.overall_rating == Decimal("5.00")

    # Verify customer-technician history
    feedbacks = list_ticket_feedbacks(db_session, ticket.id)
    assert len(feedbacks) == 1


def test_successful_resolution_skipped_rating(db_session: Session) -> None:
    cat = ServiceCategory(name="Cleaning", is_active=True)
    cust = Customer(full_name="Bob", email="bob@example.com", phone_number="+1000000003")
    tech = Technician(
        full_name="Cleaner",
        email="cleaner@example.com",
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
        description="Home cleaning",
        location="Tower B",
    )
    db_session.add(ticket)
    db_session.commit()

    assignment, _ = start_assignment(db_session, ticket.id)
    accept_assignment(db_session, assignment.id, technician_id=tech.id)
    mark_technician_arrived(db_session, ticket.id, technician_id=tech.id)
    start_technician_work(db_session, ticket.id, technician_id=tech.id)
    complete_technician_work(db_session, ticket.id, None, technician_id=tech.id)

    # Customer confirms resolved with NO rating
    res_req = CustomerResponseRequest(was_issue_resolved=True, rating=None, comment=None)
    closed_ticket, feedback, _ = process_customer_resolution_response(db_session, ticket.id, res_req)

    assert closed_ticket.status == TicketStatus.CLOSED
    assert feedback.rating is None

    # Technician overall_rating must NOT receive fake number
    db_session.refresh(tech)
    assert tech.overall_rating is None
    assert tech.rating_count == 0
    assert tech.completed_jobs_count == 1
    assert tech.current_workload == 0


def test_reopen_resolution_and_alternative_technician_rerouting(db_session: Session) -> None:
    cat = ServiceCategory(name="Electrical", is_active=True)
    cust = Customer(full_name="Carol", email="carol@example.com", phone_number="+1000000005")
    tech1 = Technician(
        full_name="Ravi (Electrician)",
        email="ravi_elec@example.com",
        phone_number="+1000000006",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        categories=[cat],
    )
    tech2 = Technician(
        full_name="Kumar (Electrician)",
        email="kumar_elec@example.com",
        phone_number="+1000000007",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        categories=[cat],
    )
    db_session.add_all([cat, cust, tech1, tech2])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Carol",
        contact_phone="+1000000005",
        description="Circuit breaker tripping",
        location="Tower A",
    )
    db_session.add(ticket)
    db_session.commit()

    # 1. Initial offer goes to Tech 1
    assignment1, _ = start_assignment(db_session, ticket.id)
    tech1_id = assignment1.technician_id
    tech2_id = tech2.id if tech1_id == tech1.id else tech1.id

    accept_assignment(db_session, assignment1.id, technician_id=tech1_id)
    mark_technician_arrived(db_session, ticket.id, technician_id=tech1_id)
    start_technician_work(db_session, ticket.id, technician_id=tech1_id)
    complete_technician_work(db_session, ticket.id, None, technician_id=tech1_id)

    # 2. Customer says NOT RESOLVED (reopen)
    reopen_req = CustomerResponseRequest(
        was_issue_resolved=False,
        rating=1,
        comment="Lights went out immediately after technician left",
    )
    reopened_ticket, feedback, fallback = process_customer_resolution_response(
        db_session,
        ticket.id,
        reopen_req,
        customer_id=cust.id,
    )

    # Ticket should be rerouted to alternative technician (Tech 2)
    assert reopened_ticket.status == TicketStatus.ROUTING
    assert fallback is not None
    assert fallback.status == "NEW_TECHNICIAN_OFFERED"
    assert fallback.technician_id == tech2_id

    # Tech 1 metrics: completed +1, reopened +1, rating 1.00, workload released (0)
    failed_tech = db_session.get(Technician, tech1_id)
    assert failed_tech.completed_jobs_count == 1
    assert failed_tech.reopened_jobs_count == 1
    assert failed_tech.overall_rating == Decimal("1.00")
    assert failed_tech.current_workload == 0

    # History audit: 2 assignments exist (Tech 1 COMPLETED, Tech 2 OFFERED)
    assignments = list_ticket_assignments(db_session, ticket.id)
    assert len(assignments) == 2
    assert assignments[0].status == AssignmentStatus.OFFERED
    assert assignments[0].technician_id == tech2_id
    assert assignments[1].status == AssignmentStatus.COMPLETED
    assert assignments[1].technician_id == tech1_id


def test_reopen_resolution_with_no_alternative_technician(db_session: Session) -> None:
    cat = ServiceCategory(name="Carpentry", is_active=True)
    cust = Customer(full_name="Dan", email="dan@example.com", phone_number="+1000000008")
    tech = Technician(
        full_name="Solo Carpenter",
        email="solo@example.com",
        phone_number="+1000000009",
        is_active=True,
        is_on_duty=True,
        categories=[cat],
    )
    db_session.add_all([cat, cust, tech])
    db_session.commit()

    ticket = Ticket(
        customer_id=cust.id,
        category_id=cat.id,
        contact_name="Dan",
        contact_phone="+1000000008",
        description="Cabinet door fallen off",
        location="Tower D",
    )
    db_session.add(ticket)
    db_session.commit()

    assignment, _ = start_assignment(db_session, ticket.id)
    accept_assignment(db_session, assignment.id, technician_id=tech.id)
    mark_technician_arrived(db_session, ticket.id, technician_id=tech.id)
    start_technician_work(db_session, ticket.id, technician_id=tech.id)
    complete_technician_work(db_session, ticket.id, None, technician_id=tech.id)

    # Customer reports NOT RESOLVED
    reopen_req = CustomerResponseRequest(was_issue_resolved=False, rating=2, comment="Hinges still loose")
    reopened_ticket, feedback, fallback = process_customer_resolution_response(
        db_session,
        ticket.id,
        reopen_req,
    )

    # Ticket remains in REOPENED state with NO_ALTERNATIVE_TECHNICIAN_AVAILABLE
    assert reopened_ticket.status == TicketStatus.REOPENED
    assert fallback is not None
    assert fallback.status == "NO_ALTERNATIVE_TECHNICIAN_AVAILABLE"
    assert fallback.technician_id is None
