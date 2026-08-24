import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import DuplicateEntityError, EntityNotFoundError
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
    """Creates a new customer record after checking for duplicate email and phone number."""
    existing_email = db.execute(
        select(Customer).where(Customer.email == customer_in.email)
    ).scalar_one_or_none()
    if existing_email:
        raise DuplicateEntityError(f"A customer with email '{customer_in.email}' already exists")

    existing_phone = db.execute(
        select(Customer).where(Customer.phone_number == customer_in.phone_number)
    ).scalar_one_or_none()
    if existing_phone:
        raise DuplicateEntityError(f"A customer with phone number '{customer_in.phone_number}' already exists")

    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number,
        age=customer_in.age,
        default_location=customer_in.default_location,
        is_active=True,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer(db: Session, customer_id: uuid.UUID) -> Customer:
    """Fetches a single customer by UUID or raises EntityNotFoundError."""
    customer = db.get(Customer, customer_id)
    if not customer:
        raise EntityNotFoundError(f"Customer with id '{customer_id}' not found")
    return customer


def list_customers(db: Session, skip: int = 0, limit: int = 50) -> list[Customer]:
    """Retrieves a paginated list of customers."""
    query = select(Customer).order_by(Customer.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(query).scalars().all())


def update_customer(db: Session, customer_id: uuid.UUID, customer_in: CustomerUpdate) -> Customer:
    """Applies partial updates to an existing customer record."""
    customer = get_customer(db, customer_id)

    update_data = customer_in.model_dump(exclude_unset=True)
    if not update_data:
        return customer

    if "email" in update_data and update_data["email"] != customer.email:
        existing = db.execute(
            select(Customer).where(
                Customer.email == update_data["email"],
                Customer.id != customer_id,
            )
        ).scalar_one_or_none()
        if existing:
            raise DuplicateEntityError(f"A customer with email '{update_data['email']}' already exists")

    if "phone_number" in update_data and update_data["phone_number"] != customer.phone_number:
        existing = db.execute(
            select(Customer).where(
                Customer.phone_number == update_data["phone_number"],
                Customer.id != customer_id,
            )
        ).scalar_one_or_none()
        if existing:
            raise DuplicateEntityError(f"A customer with phone number '{update_data['phone_number']}' already exists")

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)
    return customer
