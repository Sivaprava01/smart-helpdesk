from datetime import datetime, timezone
from decimal import Decimal
import uuid
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.db.base import (
    AssignmentStatus,
    Base,
    BaseModel,
    Customer,
    CustomerTechnicianHistory,
    ServiceCategory,
    Technician,
    TechnicianAssignment,
    Ticket,
    TicketStatus,
)
from smart_helpdesk.db.session import get_db


@pytest.fixture
def db_session() -> Session:
    """Fixture providing an isolated in-memory SQLite database session."""
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
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_base_model_uuid_and_timestamp_generation(db_session: Session) -> None:
    """Test that models automatically generate valid UUIDs and timezone-aware timestamps."""
    category = ServiceCategory(name="Plumbing")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)

    assert isinstance(category.id, uuid.UUID)
    assert isinstance(category.created_at, datetime)
    assert isinstance(category.updated_at, datetime)
    assert category.is_active is True


def test_customer_creation_and_fields(db_session: Session) -> None:
    """Test Customer model persistence and field values."""
    customer = Customer(
        full_name="Jane Resident",
        email="jane.resident@example.com",
        phone_number="+15551234567",
        age=34,
        default_location="Tower A, Flat 402",
        is_active=True,
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)

    assert isinstance(customer.id, uuid.UUID)
    assert customer.full_name == "Jane Resident"
    assert customer.email == "jane.resident@example.com"
    assert customer.phone_number == "+15551234567"
    assert customer.age == 34
    assert customer.default_location == "Tower A, Flat 402"
    assert customer.is_active is True


def test_customer_unique_email_and_phone(db_session: Session) -> None:
    """Test that customer email and phone uniqueness constraints are enforced."""
    customer1 = Customer(
        full_name="Customer One",
        email="duplicate@example.com",
        phone_number="+10000000001",
    )
    db_session.add(customer1)
    db_session.commit()

    customer2 = Customer(
        full_name="Customer Two",
        email="duplicate@example.com",
        phone_number="+10000000002",
    )
    db_session.add(customer2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_technician_creation_and_defaults(db_session: Session) -> None:
    """Test Technician model defaults, rating decimals, and counters."""
    tech = Technician(
        full_name="Ravi Kumar",
        email="ravi.kumar@example.com",
        phone_number="+15559876543",
        overall_rating=Decimal("4.85"),
    )
    db_session.add(tech)
    db_session.commit()
    db_session.refresh(tech)

    assert isinstance(tech.id, uuid.UUID)
    assert tech.is_active is True
    assert tech.is_on_duty is False
    assert tech.current_workload == 0
    assert tech.max_workload == 5
    assert tech.overall_rating == Decimal("4.85")
    assert tech.completed_jobs_count == 0
    assert tech.reopened_jobs_count == 0


def test_technician_service_category_many_to_many(db_session: Session) -> None:
    """Test many-to-many relationship between Technician and ServiceCategory."""
    cat_plumbing = ServiceCategory(name="Plumbing")
    cat_electrical = ServiceCategory(name="Electrical")
    tech = Technician(
        full_name="Multi-Skilled Technician",
        email="multitech@example.com",
        phone_number="+15550001111",
    )

    tech.categories.extend([cat_plumbing, cat_electrical])
    db_session.add_all([cat_plumbing, cat_electrical, tech])
    db_session.commit()
    db_session.refresh(tech)

    assert len(tech.categories) == 2
    category_names = {c.name for c in tech.categories}
    assert "Plumbing" in category_names
    assert "Electrical" in category_names

    # Check back-population
    assert tech in cat_plumbing.technicians
    assert tech in cat_electrical.technicians


def test_ticket_creation_and_relationships(db_session: Session) -> None:
    """Test Ticket model relations with Customer and ServiceCategory."""
    customer = Customer(
        full_name="Alice Smith",
        email="alice@example.com",
        phone_number="+15551112222",
    )
    category = ServiceCategory(name="HVAC")
    db_session.add_all([customer, category])
    db_session.commit()

    ticket = Ticket(
        customer_id=customer.id,
        category_id=category.id,
        contact_name="Alice (Parents Flat)",
        contact_phone="+15559998888",
        description="Air conditioning is not cooling properly",
        location="Tower B, Flat 101",
        status=TicketStatus.PENDING,
        is_scheduled=True,
        scheduled_for=datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc),
    )
    db_session.add(ticket)
    db_session.commit()
    db_session.refresh(ticket)

    assert isinstance(ticket.id, uuid.UUID)
    assert ticket.customer_id == customer.id
    assert ticket.category_id == category.id
    assert ticket.status == TicketStatus.PENDING
    assert ticket.is_scheduled is True
    assert ticket.customer.full_name == "Alice Smith"
    assert ticket.category.name == "HVAC"
    assert ticket in customer.tickets
    assert ticket in category.tickets


def test_technician_assignment_history(db_session: Session) -> None:
    """Test TechnicianAssignment model representing historical assignment attempts."""
    customer = Customer(
        full_name="Bob Jones",
        email="bob@example.com",
        phone_number="+15553334444",
    )
    category = ServiceCategory(name="Appliance Repair")
    tech1 = Technician(
        full_name="Tech One",
        email="tech1@example.com",
        phone_number="+15554445555",
    )
    tech2 = Technician(
        full_name="Tech Two",
        email="tech2@example.com",
        phone_number="+15556667777",
    )
    db_session.add_all([customer, category, tech1, tech2])
    db_session.commit()

    ticket = Ticket(
        customer_id=customer.id,
        category_id=category.id,
        contact_name="Bob Jones",
        contact_phone="+15553334444",
        description="Microwave display not working",
        location="Tower C, Flat 305",
    )
    db_session.add(ticket)
    db_session.commit()

    # Attempt 1: Offered to tech1 and declined
    assignment1 = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=tech1.id,
        status=AssignmentStatus.DECLINED,
        decline_reason="Currently engaged on critical repair",
        declined_at=datetime.now(timezone.utc),
    )
    # Attempt 2: Offered to tech2 and accepted
    assignment2 = TechnicianAssignment(
        ticket_id=ticket.id,
        technician_id=tech2.id,
        status=AssignmentStatus.ACCEPTED,
        accepted_at=datetime.now(timezone.utc),
    )
    db_session.add_all([assignment1, assignment2])
    db_session.commit()
    db_session.refresh(ticket)

    assert len(ticket.assignments) == 2
    assignment_statuses = [a.status for a in ticket.assignments]
    assert AssignmentStatus.DECLINED in assignment_statuses
    assert AssignmentStatus.ACCEPTED in assignment_statuses
    assert assignment1.technician == tech1
    assert assignment2.technician == tech2


def test_customer_technician_history_and_uniqueness(db_session: Session) -> None:
    """Test CustomerTechnicianHistory tracking and composite unique constraint."""
    customer = Customer(
        full_name="Charlie Brown",
        email="charlie@example.com",
        phone_number="+15557778888",
    )
    tech = Technician(
        full_name="Expert Tech",
        email="expert@example.com",
        phone_number="+15558889999",
    )
    db_session.add_all([customer, tech])
    db_session.commit()

    history = CustomerTechnicianHistory(
        customer_id=customer.id,
        technician_id=tech.id,
        positive_interactions=3,
        negative_interactions=0,
        successful_jobs_count=3,
        last_interaction_at=datetime.now(timezone.utc),
    )
    db_session.add(history)
    db_session.commit()
    db_session.refresh(history)

    assert history.positive_interactions == 3
    assert history.successful_jobs_count == 3
    assert history.customer == customer
    assert history.technician == tech

    # Attempting duplicate record for the same customer-technician pair should fail
    duplicate_history = CustomerTechnicianHistory(
        customer_id=customer.id,
        technician_id=tech.id,
        positive_interactions=1,
    )
    db_session.add(duplicate_history)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_get_db_session_lifecycle() -> None:
    """Test that get_db yields an active Session and closes it after iteration."""
    generator = get_db()
    session = next(generator)
    assert isinstance(session, Session)
    # Complete generator lifecycle
    with pytest.raises(StopIteration):
        next(generator)
