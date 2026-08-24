import uuid
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from smart_helpdesk.core.exceptions import DuplicateEntityError, EntityNotFoundError
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.schemas.service_category import (
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
)


def create_category(db: Session, category_in: ServiceCategoryCreate) -> ServiceCategory:
    """Creates a new service category after verifying name uniqueness."""
    cleaned_name = category_in.name.strip()
    existing = db.execute(
        select(ServiceCategory).where(func.lower(ServiceCategory.name) == func.lower(cleaned_name))
    ).scalar_one_or_none()
    if existing:
        raise DuplicateEntityError(f"Service category '{cleaned_name}' already exists")

    category = ServiceCategory(
        name=cleaned_name,
        is_active=category_in.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category(db: Session, category_id: uuid.UUID) -> ServiceCategory:
    """Fetches a service category by UUID or raises EntityNotFoundError."""
    category = db.get(ServiceCategory, category_id)
    if not category:
        raise EntityNotFoundError(f"Service category with id '{category_id}' not found")
    return category


def list_categories(
    db: Session,
    is_active: bool | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ServiceCategory]:
    """Lists service categories with optional active status filtering."""
    query = select(ServiceCategory).order_by(ServiceCategory.name.asc())
    if is_active is not None:
        query = query.where(ServiceCategory.is_active == is_active)
    query = query.offset(skip).limit(limit)
    return list(db.execute(query).scalars().all())


def update_category(
    db: Session,
    category_id: uuid.UUID,
    category_in: ServiceCategoryUpdate,
) -> ServiceCategory:
    """Updates category name or active status with uniqueness validation."""
    category = get_category(db, category_id)

    update_data = category_in.model_dump(exclude_unset=True)
    if not update_data:
        return category

    if "name" in update_data and update_data["name"]:
        cleaned_name = update_data["name"].strip()
        if cleaned_name.lower() != category.name.lower():
            existing = db.execute(
                select(ServiceCategory).where(
                    func.lower(ServiceCategory.name) == func.lower(cleaned_name),
                    ServiceCategory.id != category_id,
                )
            ).scalar_one_or_none()
            if existing:
                raise DuplicateEntityError(f"Service category '{cleaned_name}' already exists")
            update_data["name"] = cleaned_name

    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category
