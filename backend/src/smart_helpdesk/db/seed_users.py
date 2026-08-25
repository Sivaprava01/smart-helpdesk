"""Idempotent Development Seed Utility for Smart-HelpDesk Multi-Role Users.

Provisions default development accounts across all backend roles:
- ADMIN: admin@smarthelpdesk.com / AdminPass123!
- DISPATCHER: dispatcher@smarthelpdesk.com / DispatchPass123!
- TECHNICIAN: tech.ravi@smarthelpdesk.com / TechPass123! (linked to Technician Ravi Kumar)
- CUSTOMER: resident.alice@smarthelpdesk.com / ResidentPass123! (linked to Customer Alice Smith)
"""

import sys
from decimal import Decimal
from sqlalchemy import select
from smart_helpdesk.core.security import get_password_hash
from smart_helpdesk.db.enums import UserRole
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.user import User
from smart_helpdesk.db.session import SessionFactory


def seed_database():
    """Seeds default categories, entities, and users idempotently."""
    db = SessionFactory()
    try:
        print("[SEED] Starting Smart-HelpDesk multi-role database seeding...")

        # 1. Seed Default Categories if missing
        category_names = [
            "Plumbing",
            "Electrical",
            "HVAC",
            "Carpentry",
            "Appliance Repair",
            "Cleaning",
            "Painting",
        ]

        categories_map = {}
        for cat_name in category_names:
            stmt = select(ServiceCategory).where(ServiceCategory.name == cat_name)
            existing_cat = db.execute(stmt).scalar_one_or_none()
            if not existing_cat:
                new_cat = ServiceCategory(
                    name=cat_name,
                    is_active=True,
                )
                db.add(new_cat)
                db.flush()
                categories_map[cat_name] = new_cat
                print(f"  + Created Service Category: {cat_name}")
            else:
                categories_map[cat_name] = existing_cat

        # 2. Seed Default Customer (Alice Smith)
        cust_email = "resident.alice@smarthelpdesk.com"
        stmt = select(Customer).where(Customer.email == cust_email)
        customer = db.execute(stmt).scalar_one_or_none()
        if not customer:
            customer = Customer(
                full_name="Alice Smith",
                email=cust_email,
                phone_number="+1-555-0101",
                age=29,
                default_location="Tower A, Apt 402",
                is_active=True,
            )
            db.add(customer)
            db.flush()
            print(f"  + Created Customer entity: {customer.full_name} ({customer.email})")
        else:
            print(f"  * Customer entity already exists: {customer.full_name}")

        # 3. Seed Default Technician (Ravi Kumar)
        tech_email = "tech.ravi@smarthelpdesk.com"
        stmt = select(Technician).where(Technician.email == tech_email)
        technician = db.execute(stmt).scalar_one_or_none()
        if not technician:
            technician = Technician(
                full_name="Ravi Kumar",
                email=tech_email,
                phone_number="+1-555-0201",
                current_zone="Tower A",
                is_active=True,
                is_on_duty=True,
                current_workload=0,
                max_workload=5,
                overall_rating=Decimal("4.85"),
                completed_jobs_count=12,
                reopened_jobs_count=0,
                rating_sum=Decimal("58.20"),
                rating_count=12,
            )
            # Assign skills
            if "Plumbing" in categories_map:
                technician.categories.append(categories_map["Plumbing"])
            if "Electrical" in categories_map:
                technician.categories.append(categories_map["Electrical"])
            if "HVAC" in categories_map:
                technician.categories.append(categories_map["HVAC"])

            db.add(technician)
            db.flush()
            print(f"  + Created Technician entity: {technician.full_name} ({technician.email})")
        else:
            print(f"  * Technician entity already exists: {technician.full_name}")

        # 4. Seed Multi-Role Users
        users_to_seed = [
            {
                "email": "admin@smarthelpdesk.com",
                "password": "AdminPass123!",
                "role": UserRole.ADMIN,
                "customer_id": None,
                "technician_id": None,
                "label": "Platform Administrator",
            },
            {
                "email": "dispatcher@smarthelpdesk.com",
                "password": "DispatchPass123!",
                "role": UserRole.DISPATCHER,
                "customer_id": None,
                "technician_id": None,
                "label": "Operations Dispatcher",
            },
            {
                "email": "tech.ravi@smarthelpdesk.com",
                "password": "TechPass123!",
                "role": UserRole.TECHNICIAN,
                "customer_id": None,
                "technician_id": technician.id,
                "label": "Service Specialist (Ravi Kumar)",
            },
            {
                "email": "resident.alice@smarthelpdesk.com",
                "password": "ResidentPass123!",
                "role": UserRole.CUSTOMER,
                "customer_id": customer.id,
                "technician_id": None,
                "label": "Apartment Resident (Alice Smith)",
            },
        ]

        for user_data in users_to_seed:
            stmt = select(User).where(User.email == user_data["email"])
            existing_user = db.execute(stmt).scalar_one_or_none()

            hashed_pw = get_password_hash(user_data["password"])

            if not existing_user:
                new_user = User(
                    email=user_data["email"],
                    hashed_password=hashed_pw,
                    role=user_data["role"],
                    is_active=True,
                    is_verified=True,
                    customer_id=user_data["customer_id"],
                    technician_id=user_data["technician_id"],
                )
                db.add(new_user)
                print(f"  + Seeded User [{user_data['role'].value}]: {user_data['email']}")
            else:
                # Update role and password to ensure credentials match
                existing_user.hashed_password = hashed_pw
                existing_user.role = user_data["role"]
                existing_user.is_active = True
                existing_user.is_verified = True
                existing_user.customer_id = user_data["customer_id"]
                existing_user.technician_id = user_data["technician_id"]
                print(f"  * Updated User [{user_data['role'].value}]: {user_data['email']}")

        db.commit()
        print("\n[SUCCESS] Multi-role database seeding completed successfully!")
        print("=" * 66)
        print("  ROLE        EMAIL                          PASSWORD")
        print("-" * 66)
        print("  ADMIN       admin@smarthelpdesk.com        AdminPass123!")
        print("  DISPATCHER  dispatcher@smarthelpdesk.com   DispatchPass123!")
        print("  TECHNICIAN  tech.ravi@smarthelpdesk.com    TechPass123!")
        print("  CUSTOMER    resident.alice@smarthelpdesk.com ResidentPass123!")
        print("=" * 66)

    except Exception as exc:
        db.rollback()
        print(f"[ERROR] Error during database seeding: {exc}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
