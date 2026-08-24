import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import DuplicateEntityError, EntityNotFoundError
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.schemas.technician import TechnicianCreate, TechnicianUpdate


def create_technician(db: Session, technician_in: TechnicianCreate) -> Technician:
    """Creates a new technician and associates valid skill categories."""
    existing_email = db.execute(
        select(Technician).where(Technician.email == technician_in.email)
    ).scalar_one_or_none()
    if existing_email:
        raise DuplicateEntityError(f"A technician with email '{technician_in.email}' already exists")

    existing_phone = db.execute(
        select(Technician).where(Technician.phone_number == technician_in.phone_number)
    ).scalar_one_or_none()
    if existing_phone:
        raise DuplicateEntityError(f"A technician with phone number '{technician_in.phone_number}' already exists")

    # Validate and fetch referenced categories
    categories: list[ServiceCategory] = []
    if technician_in.category_ids:
        categories = list(
            db.execute(
                select(ServiceCategory).where(ServiceCategory.id.in_(technician_in.category_ids))
            ).scalars().all()
        )
        found_ids = {c.id for c in categories}
        missing_ids = [cid for cid in technician_in.category_ids if cid not in found_ids]
        if missing_ids:
            raise EntityNotFoundError(
                f"Referenced service categories not found: {[str(cid) for cid in missing_ids]}"
            )

    technician = Technician(
        full_name=technician_in.full_name,
        email=technician_in.email,
        phone_number=technician_in.phone_number,
        is_active=True,
        is_on_duty=technician_in.is_on_duty,
        max_workload=technician_in.max_workload,
        current_workload=0,
        overall_rating=None,
        completed_jobs_count=0,
        reopened_jobs_count=0,
        categories=categories,
    )
    db.add(technician)
    db.commit()
    db.refresh(technician)
    return technician


def get_technician(db: Session, technician_id: uuid.UUID) -> Technician:
    """Fetches a technician by UUID or raises EntityNotFoundError."""
    technician = db.get(Technician, technician_id)
    if not technician:
        raise EntityNotFoundError(f"Technician with id '{technician_id}' not found")
    return technician


def list_technicians(
    db: Session,
    is_active: bool | None = None,
    is_on_duty: bool | None = None,
    category_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Technician]:
    """Retrieves technicians with optional status and category filters."""
    query = select(Technician).distinct()
    if is_active is not None:
        query = query.where(Technician.is_active == is_active)
    if is_on_duty is not None:
        query = query.where(Technician.is_on_duty == is_on_duty)
    if category_id is not None:
        query = query.join(Technician.categories).where(ServiceCategory.id == category_id)

    query = query.order_by(Technician.created_at.desc()).offset(skip).limit(limit)
    return list(db.execute(query).scalars().all())


def update_technician(
    db: Session,
    technician_id: uuid.UUID,
    technician_in: TechnicianUpdate,
) -> Technician:
    """Partially updates technician details and category associations."""
    technician = get_technician(db, technician_id)

    update_data = technician_in.model_dump(exclude_unset=True)
    if not update_data:
        return technician

    if "phone_number" in update_data and update_data["phone_number"] != technician.phone_number:
        existing = db.execute(
            select(Technician).where(
                Technician.phone_number == update_data["phone_number"],
                Technician.id != technician_id,
            )
        ).scalar_one_or_none()
        if existing:
            raise DuplicateEntityError(f"A technician with phone number '{update_data['phone_number']}' already exists")

    if "category_ids" in update_data and update_data["category_ids"] is not None:
        category_ids = update_data.pop("category_ids")
        categories = list(
            db.execute(
                select(ServiceCategory).where(ServiceCategory.id.in_(category_ids))
            ).scalars().all()
        )
        found_ids = {c.id for c in categories}
        missing_ids = [cid for cid in category_ids if cid not in found_ids]
        if missing_ids:
            raise EntityNotFoundError(
                f"Referenced service categories not found: {[str(cid) for cid in missing_ids]}"
            )
        technician.categories = categories
    elif "category_ids" in update_data:
        update_data.pop("category_ids")

    for key, value in update_data.items():
        setattr(technician, key, value)

    db.commit()
    db.refresh(technician)
    return technician
