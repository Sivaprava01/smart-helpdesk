from decimal import Decimal
import uuid
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.core.exceptions import BusinessRuleError, EntityNotFoundError
from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.services.routing_service import evaluate_ticket_routing


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


def test_evaluate_ticket_routing_full_flow(db_session: Session) -> None:
    # 1. Create categories
    cat_plumb = ServiceCategory(name="Plumbing", is_active=True)
    cat_elec = ServiceCategory(name="Electrical", is_active=True)
    db_session.add_all([cat_plumb, cat_elec])
    db_session.commit()

    # 2. Create customer
    customer = Customer(
        full_name="Siva",
        email="siva@example.com",
        phone_number="+919876543210",
        default_location="Tower A, Flat 302",
    )
    db_session.add(customer)
    db_session.commit()

    # 3. Create ticket
    ticket = Ticket(
        customer_id=customer.id,
        category_id=cat_plumb.id,
        contact_name="Siva",
        contact_phone="+919876543210",
        description="Water is clogged in my washroom",
        location="Tower A, Flat 302",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    # 4. Create 4 Technicians:
    # Tech A: Ravi (Eligible, top score, positive history)
    tech_a = Technician(
        full_name="Ravi",
        email="ravi@example.com",
        phone_number="+919999999901",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        current_workload=1,
        max_workload=5,
        overall_rating=Decimal("4.90"),
        completed_jobs_count=20,
        reopened_jobs_count=0,
        categories=[cat_plumb],
    )
    # Tech B: Suresh (Eligible, medium score)
    tech_b = Technician(
        full_name="Suresh",
        email="suresh@example.com",
        phone_number="+919999999902",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower D",
        current_workload=3,
        max_workload=5,
        overall_rating=Decimal("4.00"),
        completed_jobs_count=10,
        reopened_jobs_count=2,
        categories=[cat_plumb],
    )
    # Tech C: Anil (Inactive -> Excluded)
    tech_c = Technician(
        full_name="Anil",
        email="anil@example.com",
        phone_number="+919999999903",
        is_active=False,
        is_on_duty=True,
        categories=[cat_plumb],
    )
    # Tech D: Kumar (Electrical only -> Excluded)
    tech_d = Technician(
        full_name="Kumar",
        email="kumar@example.com",
        phone_number="+919999999904",
        is_active=True,
        is_on_duty=True,
        categories=[cat_elec],
    )
    db_session.add_all([tech_a, tech_b, tech_c, tech_d])
    db_session.commit()

    # 5. Add positive history for customer and Ravi
    history = CustomerTechnicianHistory(
        customer_id=customer.id,
        technician_id=tech_a.id,
        positive_interactions=3,
        negative_interactions=0,
    )
    db_session.add(history)
    db_session.commit()

    # 6. Evaluate routing
    result = evaluate_ticket_routing(db_session, ticket.id)

    assert result.ticket_id == ticket.id
    assert result.ticket_category == "Plumbing"
    assert result.technicians_considered == 4
    assert result.eligible_count == 2
    assert len(result.excluded_candidates) == 2

    # Verify excluded candidates
    excluded_names = {e.technician_name for e in result.excluded_candidates}
    assert "Anil" in excluded_names
    assert "Kumar" in excluded_names

    # Verify ranking
    assert len(result.ranked_candidates) == 2
    assert result.ranked_candidates[0].technician_name == "Ravi"
    assert result.ranked_candidates[0].rank == 1
    assert result.ranked_candidates[1].technician_name == "Suresh"
    assert result.ranked_candidates[1].rank == 2

    # Verify recommended
    assert result.recommended_technician is not None
    assert result.recommended_technician.technician_id == tech_a.id
    assert result.recommended_technician.technician_name == "Ravi"


def test_evaluate_nonexistent_ticket_raises_not_found(db_session: Session) -> None:
    with pytest.raises(EntityNotFoundError):
        evaluate_ticket_routing(db_session, uuid.uuid4())


def test_evaluate_non_routable_ticket_raises_error(db_session: Session) -> None:
    cat = ServiceCategory(name="HVAC", is_active=True)
    customer = Customer(full_name="Cust", email="c@example.com", phone_number="+1111111111")
    db_session.add_all([cat, customer])
    db_session.commit()

    ticket = Ticket(
        customer_id=customer.id,
        category_id=cat.id,
        contact_name="Cust",
        contact_phone="+1111111111",
        description="AC issue",
        location="Zone 1",
        status=TicketStatus.CANCELLED,
    )
    db_session.add(ticket)
    db_session.commit()

    with pytest.raises(BusinessRuleError) as exc_info:
        evaluate_ticket_routing(db_session, ticket.id)
    assert "CANCELLED" in str(exc_info.value)


def test_evaluate_ticket_with_zero_eligible_candidates(db_session: Session) -> None:
    cat = ServiceCategory(name="Painting", is_active=True)
    customer = Customer(full_name="Cust2", email="c2@example.com", phone_number="+2222222222")
    db_session.add_all([cat, customer])
    db_session.commit()

    ticket = Ticket(
        customer_id=customer.id,
        category_id=cat.id,
        contact_name="Cust2",
        contact_phone="+2222222222",
        description="Painting required",
        location="Tower Z",
        status=TicketStatus.PENDING,
    )
    db_session.add(ticket)
    db_session.commit()

    result = evaluate_ticket_routing(db_session, ticket.id)
    assert result.eligible_count == 0
    assert result.ranked_candidates == []
    assert result.recommended_technician is None
