I am continuing my internship project called Smart-HelpDesk.

Phase 1 is already complete.

You must implement ONLY Phase 2: Database Foundation and Core Data Models.

Do not implement Phase 3 or later features.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk and service-ticket routing system.

A resident raises a maintenance/service request.

Examples:

- Water leakage
- Clogged washroom
- Electrical issue
- Appliance issue
- Cleaning issue

The system will eventually automatically assign the most suitable technician instead of relying entirely on manual hierarchical assignment.

Future technician selection factors include:

- Active/on-duty status
- Skill/category match
- Current workload
- Availability
- Distance/ETA
- Overall customer rating
- Reopen rate
- Previous positive experience with the same customer
- Previous negative experience with the same customer

The eventual lifecycle will look approximately like:

Resident raises ticket
        ↓
Ticket is validated
        ↓
Category/routing context determined
        ↓
Eligible technicians found
        ↓
Technicians ranked
        ↓
Best technician offered assignment
        ↓
Accept / decline / timeout
        ↓
Fallback if necessary
        ↓
Technician completes work
        ↓
Customer confirms outcome
        ↓
Customer gives feedback
        ↓
Historical data improves future routing
        ↓
Possible ML experimentation later

IMPORTANT:

Phase 2 is NOT implementing this workflow yet.

Phase 2 only creates the database foundation and the data structures needed for future phases.

==================================================
CURRENT PROJECT STATE
==================================================

The project uses:

- Python
- uv
- FastAPI
- Uvicorn
- pytest
- src-layout

Phase 1 already established:

- FastAPI application
- Application entry point
- API router
- API versioning foundation
- GET /api/v1/health
- Environment-based configuration
- Basic logging
- Basic exception handling
- pytest
- Health endpoint tests

Existing structure is approximately:

smart-helpdesk/
│
├── .git/
├── .venv/
├── src/
│   └── smart_helpdesk/
│       ├── __init__.py
│       ├── main.py
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py
│       │   ├── logging.py
│       │   └── exceptions.py
│       │
│       └── api/
│           ├── __init__.py
│           ├── router.py
│           │
│           └── routes/
│               ├── __init__.py
│               └── health.py
│
├── tests/
│   ├── __init__.py
│   └── test_health.py
│
├── .env
├── .env.example
├── .gitignore
├── .python-version
├── pyproject.toml
├── uv.lock
└── README.md

Before making changes, inspect the ACTUAL current project structure and files.

Do not assume the structure above is perfectly exact.

Do not unnecessarily overwrite Phase 1 code.

==================================================
PHASE 2 OBJECTIVE
==================================================

Implement a clean PostgreSQL + SQLAlchemy database foundation.

By the end of Phase 2, the project should have:

1. PostgreSQL configuration through environment variables
2. SQLAlchemy ORM setup
3. Database engine
4. Session management
5. Declarative base/model foundation
6. Alembic migration setup
7. Core database models
8. Proper relationships
9. Database enums where appropriate
10. UUID primary keys
11. Created/updated timestamps
12. Initial migration
13. PostgreSQL tables created successfully
14. Tests that verify important model/database behavior
15. Existing Phase 1 health endpoint still working

This phase is about defining and persisting the domain data.

Do not build full CRUD APIs yet.

==================================================
WHY POSTGRESQL
==================================================

Use PostgreSQL.

This project has highly relational data.

Examples:

Customer
   ↓
raises many tickets

Technician
   ↓
can receive many tickets

Customer
   ↓
can have historical interactions with technicians

Ticket
   ↓
can have assignments

Ticket
   ↓
can eventually have feedback

This is relational data with:

- Foreign keys
- Relationships
- Constraints
- Transactions
- Historical records

PostgreSQL is therefore appropriate.

Do not use MongoDB.

Do not introduce another database.

==================================================
ORM CHOICE
==================================================

Use SQLAlchemy ORM.

The goal is to work with Python classes while SQLAlchemy maps those classes to relational database tables.

Example conceptual mapping:

Python class:

Customer

        ↓ ORM mapping

PostgreSQL table:

customers

We want clean ORM models with explicit relationships.

Do not manually write raw SQL for normal model operations.

Raw SQL is not needed for this phase.

==================================================
DATABASE DRIVER AND DEPENDENCIES
==================================================

Use uv to manage all dependencies.

Inspect current dependencies first.

Add only dependencies genuinely required for Phase 2.

Likely requirements include:

- SQLAlchemy
- PostgreSQL driver suitable for the project's chosen SQLAlchemy setup
- Alembic

Use current stable and compatible versions.

Do not manually create requirements.txt.

Do not use pip if uv is managing the project.

Use uv add commands.

If test dependencies need to be added separately, use the appropriate uv mechanism.

Before adding dependencies, explain:

- Why each dependency is needed
- Whether it is runtime or development-related

==================================================
DATABASE CONFIGURATION
==================================================

Extend the existing environment configuration.

Add support for:

DATABASE_URL

Example development value:

DATABASE_URL=postgresql+<appropriate_driver>://USER:PASSWORD@HOST:PORT/DATABASE_NAME

Do not hardcode database credentials.

Do not commit real credentials.

Update .env.example.

Keep actual .env ignored by Git.

Use the existing settings/configuration pattern from Phase 1.

Do not create a second unrelated configuration system.

==================================================
DATABASE MODULE STRUCTURE
==================================================

Create a clean database foundation.

Suggested target structure:

src/
└── smart_helpdesk/
    │
    ├── core/
    │   └── ...
    │
    ├── db/
    │   ├── __init__.py
    │   ├── base.py
    │   ├── session.py
    │   └── models/
    │       ├── __init__.py
    │       ├── base.py
    │       ├── customer.py
    │       ├── technician.py
    │       ├── ticket.py
    │       ├── technician_assignment.py
    │       └── customer_technician_history.py
    │
    └── api/
        └── ...

You may make small structural improvements if genuinely useful, but explain them.

Do not create:

- repositories
- services
- schemas
- auth
- ML
- routing engine

Those belong to later phases.

==================================================
DATABASE SESSION REQUIREMENTS
==================================================

Create a centralized SQLAlchemy engine and session factory.

The application should have a standard way to obtain database sessions.

The database session must be safely cleaned up after use.

Design it so that future FastAPI routes can use a database dependency such as:

get_db()

Conceptually:

Request
   ↓
Create/provide database session
   ↓
Route/service uses session
   ↓
Request finishes
   ↓
Session is cleaned up

Do not create global database sessions that are permanently shared across requests.

==================================================
BASE MODEL REQUIREMENTS
==================================================

Create a reusable ORM base model pattern.

Use UUID primary keys.

Each important entity should have:

id
created_at
updated_at

Requirements:

- UUID should be generated automatically
- created_at should be set automatically
- updated_at should update when the row changes
- timestamps should be timezone-aware where practical
- avoid manually setting timestamps everywhere

Do not create unnecessary inheritance complexity.

Keep the base model simple.

==================================================
CORE DOMAIN MODELS
==================================================

For Phase 2, implement these models:

1. Customer
2. Technician
3. Ticket
4. TechnicianAssignment
5. CustomerTechnicianHistory

These models exist to support the future routing system.

==================================================
1. CUSTOMER MODEL
==================================================

The Customer model represents the resident/customer requesting help.

Suggested table:

customers

Suggested fields:

- id
- full_name
- email
- phone_number
- age
- default_location
- is_active
- created_at
- updated_at

Notes:

full_name:
Customer's name.

email:
Use appropriate uniqueness constraints.

phone_number:
Use an appropriate uniqueness constraint.

age:
Store age for now because the product may later use senior-resident information as a routing/priority consideration.

Do NOT implement senior citizen priority logic in Phase 2.

default_location:
Store the customer's default residential location as a simple field for now.

Do not build complex geographic/location tables yet.

is_active:
Simple active/inactive state.

Relationships:

A customer can raise many tickets.

A customer can have history records involving technicians.

Do not add authentication fields such as password hashes yet.

Authentication is a later phase.

==================================================
2. TECHNICIAN MODEL
==================================================

Suggested table:

technicians

Suggested fields:

- id
- full_name
- email
- phone_number
- is_active
- is_on_duty
- current_workload
- max_workload
- overall_rating
- completed_jobs_count
- reopened_jobs_count
- created_at
- updated_at

Meaning:

is_active:
Whether the technician exists/is enabled in the system.

is_on_duty:
Whether the technician is currently available for work.

current_workload:
Current number of active jobs.

max_workload:
Maximum active workload before the technician should normally become ineligible.

overall_rating:
Aggregate rating from customer feedback.

completed_jobs_count:
Historical completed work count.

reopened_jobs_count:
Historical count of jobs that required reopening.

Important:

Do not calculate routing scores yet.

Do not implement eligibility filtering yet.

Do not implement automatic workload updates yet.

For Phase 2, these fields only establish the data model.

Relationships:

A technician can have many assignments.

A technician can have many customer history records.

==================================================
TECHNICIAN SKILLS / CATEGORIES
==================================================

The future system must match a ticket category to a technician's skills.

Do not store skills as a comma-separated string.

Do not create a full category management CRUD API.

For Phase 2, implement a reasonable normalized structure.

Preferred option:

ServiceCategory model/table

and a many-to-many relationship between:

Technician ↔ ServiceCategory

Examples:

Plumbing
Electrical
Appliance
Cleaning
HVAC

If you choose this option, add:

ServiceCategory model

and the appropriate association table.

Suggested fields:

ServiceCategory:
- id
- name
- is_active
- created_at
- updated_at

Requirements:

- Category name should be unique
- A technician can support multiple categories
- A category can have multiple technicians

Do not seed a large dataset unless necessary.

A small optional initial seed can be considered later.

Explain the many-to-many design clearly.

==================================================
3. TICKET MODEL
==================================================

Suggested table:

tickets

The Ticket model represents a service request.

Suggested fields:

- id
- customer_id
- contact_name
- contact_phone
- description
- category_id
- location
- preferred_time
- status
- is_scheduled
- scheduled_for
- created_at
- updated_at

Important product context:

When creating a ticket later, the user may describe something like:

"Water is clogged in my washroom"

The system may eventually suggest:

Category: Plumbing

But the customer can edit the category.

That category suggestion logic is NOT part of Phase 2.

For Phase 2, simply establish the category relationship.

Contact details:

The ticket should preserve the contact name and phone used for this particular request.

This is important because a registered customer may raise a ticket for:

- Parents
- Family members
- Someone else living in the apartment

Therefore:

Ticket.customer_id identifies the account/customer record.

Ticket.contact_name/contact_phone identify the actual person/contact for this specific service request.

Location:

Store ticket-specific location.

It may default from the customer later, but that is not Phase 2.

Scheduling:

If the customer wants help ASAP:

is_scheduled = false
scheduled_for = null

If the customer schedules for later:

is_scheduled = true
scheduled_for = a future datetime

Do not implement scheduling jobs/background tasks yet.

Status:

Use an appropriate database enum or controlled enum type.

Suggested initial statuses:

PENDING
ROUTING
ASSIGNED
IN_PROGRESS
RESOLVED
AWAITING_CUSTOMER_CONFIRMATION
CLOSED
REOPENED
CANCELLED

Do not implement all transitions yet.

The enum exists now so later phases have controlled values.

Relationships:

Customer → many tickets

ServiceCategory → many tickets

Ticket → many technician assignments

==================================================
4. TECHNICIAN ASSIGNMENT MODEL
==================================================

Suggested table:

technician_assignments

Do NOT simply put one technician_id directly on the Ticket model.

A ticket may have:

- Initial assignment
- Declined assignment
- Timed-out assignment
- Fallback assignment
- Historical assignment attempts

We need assignment history.

Suggested fields:

- id
- ticket_id
- technician_id
- status
- assigned_at
- responded_at
- accepted_at
- declined_at
- decline_reason
- expires_at
- created_at
- updated_at

Use a controlled enum for assignment status.

Suggested statuses:

OFFERED
ACCEPTED
DECLINED
EXPIRED
CANCELLED
COMPLETED

Important:

Do not implement the actual assignment workflow yet.

Do not implement timeout jobs.

Do not implement fallback.

This model only preserves the data needed for those features later.

Relationships:

Ticket → many assignment attempts

Technician → many assignments

This historical design is important.

==================================================
5. CUSTOMER-TECHNICIAN HISTORY MODEL
==================================================

The future routing algorithm should consider previous experience between a specific customer and technician.

Examples:

Customer A + Technician Ravi:

Previous job → customer rated highly
Previous job → customer had a bad experience

This is different from the technician's overall rating.

We need customer-technician-specific history.

Suggested table:

customer_technician_history

Suggested fields:

- id
- customer_id
- technician_id
- positive_interactions
- negative_interactions
- successful_jobs_count
- last_interaction_at
- created_at
- updated_at

Requirements:

- There should be at most one aggregate history record for each customer-technician pair
- Add an appropriate unique constraint on:
  customer_id + technician_id

Do not calculate routing bonuses/penalties yet.

Do not update these values automatically yet.

That belongs to the feedback/resolution phase.

This table is the foundation for future personalized technician ranking.

==================================================
ENUMS
==================================================

Create Python enums for controlled values.

At minimum:

TicketStatus

AssignmentStatus

Use appropriate SQLAlchemy enum mapping.

Do not scatter string literals such as:

"pending"
"assigned"
"resolved"

throughout the code.

Centralize enum definitions.

You may place enums in a dedicated module if appropriate.

Explain where they live and why.

==================================================
RELATIONSHIPS SUMMARY
==================================================

The intended relationships are:

Customer
   1
   │
   │ raises
   ▼
   *
Ticket
   │
   │ belongs to
   ▼
ServiceCategory


Technician
   *
   │
   │ supports
   ▼
   *
ServiceCategory


Ticket
   1
   │
   │ has assignment history
   ▼
   *
TechnicianAssignment
   *
   │
   │ assigned to
   ▼
   1
Technician


Customer
   *
   │
   │ historical interaction
   ▼
   *
Technician

through CustomerTechnicianHistory.


Implement relationships carefully.

Use foreign keys.

Use unique constraints where needed.

Do not rely only on application code for important relational integrity.

==================================================
CONSTRAINTS AND DATA INTEGRITY
==================================================

Use appropriate database constraints.

Examples:

- Customer email unique
- Customer phone number unique
- Technician email unique
- Technician phone number unique
- Service category name unique
- Customer + Technician unique in interaction history
- Workload should not be negative
- max_workload should be valid
- Rating values should be constrained appropriately if practical

Use database-level constraints where reasonable.

Do not overcomplicate validation.

Later API-level validation will use Pydantic schemas.

Do not implement those schemas in Phase 2 unless genuinely necessary for a migration/test.

==================================================
DECIMAL/RATING HANDLING
==================================================

Do not use floating point blindly for stored ratings if precise decimal storage is more appropriate.

Choose an appropriate PostgreSQL/SQLAlchemy numeric type for ratings.

Document the decision.

==================================================
ALEMBIC MIGRATIONS
==================================================

Set up Alembic properly.

The migration workflow should be:

ORM Models
    ↓
Alembic migration generation
    ↓
Migration file
    ↓
PostgreSQL schema

Do not rely on:

Base.metadata.create_all()

as the main production schema-management mechanism.

Alembic should manage schema evolution.

Requirements:

1. Initialize Alembic
2. Configure Alembic to use DATABASE_URL
3. Ensure all models are imported into metadata correctly
4. Generate an initial migration
5. Review the migration
6. Apply the migration
7. Verify the tables exist

Do not create fake or empty migration files.

==================================================
POSTGRESQL SETUP
==================================================

Assume PostgreSQL will run locally for development.

Do not add Docker yet.

Docker is a later infrastructure phase.

Provide clear instructions for:

1. Creating the local PostgreSQL database
2. Configuring DATABASE_URL
3. Running the initial migration
4. Verifying tables

Do not implement application code that automatically creates databases.

==================================================
TESTING REQUIREMENTS
==================================================

Keep existing Phase 1 tests working.

Add useful Phase 2 tests.

At minimum test:

1. Health endpoint still returns 200
2. Customer model can be created
3. Technician model can be created
4. ServiceCategory can be created
5. Technician-category relationship works
6. Ticket can reference a customer and category
7. TechnicianAssignment can reference a ticket and technician
8. CustomerTechnicianHistory uniqueness works or is otherwise validated
9. Important defaults work correctly
10. UUID IDs are generated

For database tests:

Do not accidentally use the production/development database destructively.

Create an isolated test database strategy.

A test-specific DATABASE_URL is acceptable.

Do not overengineer test infrastructure.

Explain exactly how to run database tests.

==================================================
IMPORTANT ASYNC/SYNC DECISION
==================================================

Make one deliberate decision about SQLAlchemy usage.

Either:

Option A:
Use synchronous SQLAlchemy.

or:

Option B:
Use asynchronous SQLAlchemy.

Evaluate the current project and choose the simpler approach appropriate for this internship project.

Do not choose async merely because FastAPI supports async.

Explain the tradeoff.

For this phase, prefer simplicity and correctness over unnecessary complexity.

Once chosen, use that approach consistently.

Do not mix sync and async database patterns randomly.

==================================================
WHAT NOT TO IMPLEMENT
==================================================

STRICTLY DO NOT IMPLEMENT THESE YET:

- Customer CRUD APIs
- Technician CRUD APIs
- Ticket creation API
- Ticket update API
- Technician management API
- Authentication
- JWT
- OAuth
- Login
- Signup
- Passwords
- Role-based access
- Smart routing algorithm
- Eligibility filtering
- Technician ranking
- ETA calculation
- Distance calculation
- Workload update logic
- Automatic assignment
- Accept endpoint
- Decline endpoint
- Timeout jobs
- Fallback assignment
- Background workers
- Redis
- Scheduled ticket processing
- Customer feedback APIs
- Rating calculation logic
- Reopen logic
- ML
- Docker

The database may contain fields/models that support future functionality.

But do not build the actual feature behavior yet.

==================================================
CODE QUALITY REQUIREMENTS
==================================================

Follow these principles:

1. Inspect existing code before changing it
2. Preserve working Phase 1 functionality
3. Use the existing src layout
4. Keep database concerns centralized
5. Keep models focused on persistence/domain representation
6. Use clear type hints
7. Use UUID primary keys
8. Use timezone-aware timestamps
9. Use relationships and foreign keys correctly
10. Use constraints for important data integrity
11. Avoid premature repository/service layers
12. Avoid unnecessary abstract base classes
13. Do not overengineer
14. Do not add future modules just as empty placeholders
15. Keep imports clean
16. Follow current SQLAlchemy conventions
17. Explain important design decisions

==================================================
IMPLEMENTATION ORDER
==================================================

Follow this exact order.

STEP 1:
Inspect the current project structure and Phase 1 implementation.

STEP 2:
Explain the Phase 2 plan before modifying files.

STEP 3:
Choose synchronous or asynchronous SQLAlchemy and explain why.

STEP 4:
Identify required dependencies and add them using uv.

STEP 5:
Extend environment configuration with DATABASE_URL.

STEP 6:
Create the centralized database engine/session setup.

STEP 7:
Create the declarative base model pattern.

STEP 8:
Create centralized enums.

STEP 9:
Create ServiceCategory and its association relationship.

STEP 10:
Create Customer model.

STEP 11:
Create Technician model.

STEP 12:
Create Ticket model.

STEP 13:
Create TechnicianAssignment model.

STEP 14:
Create CustomerTechnicianHistory model.

STEP 15:
Verify all model imports are available to Alembic metadata.

STEP 16:
Set up Alembic.

STEP 17:
Configure DATABASE_URL for local PostgreSQL.

STEP 18:
Create the PostgreSQL database manually.

STEP 19:
Generate the initial migration.

STEP 20:
Review the migration for correctness.

STEP 21:
Apply the migration.

STEP 22:
Verify tables and relationships.

STEP 23:
Add database tests.

STEP 24:
Run all tests.

STEP 25:
Start the FastAPI application.

STEP 26:
Verify /api/v1/health still works.

STEP 27:
Show final folder structure.

==================================================
EXPECTED FINAL STRUCTURE
==================================================

The exact structure may vary slightly, but it should be conceptually similar to:

smart-helpdesk/
│
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── ...
│
├── src/
│   └── smart_helpdesk/
│       │
│       ├── main.py
│       │
│       ├── core/
│       │   ├── config.py
│       │   ├── logging.py
│       │   └── exceptions.py
│       │
│       ├── db/
│       │   ├── base.py
│       │   ├── session.py
│       │   ├── enums.py
│       │   │
│       │   └── models/
│       │       ├── __init__.py
│       │       ├── base.py
│       │       ├── customer.py
│       │       ├── technician.py
│       │       ├── service_category.py
│       │       ├── ticket.py
│       │       ├── technician_assignment.py
│       │       └── customer_technician_history.py
│       │
│       └── api/
│           └── ...
│
├── tests/
│   ├── test_health.py
│   └── database/
│       └── ...
│
├── .env.example
├── alembic.ini
├── pyproject.toml
└── uv.lock

Do not create unnecessary architecture beyond this.

==================================================
PHASE 2 ACCEPTANCE CRITERIA
==================================================

Phase 2 is complete only when:

1. PostgreSQL database exists locally.

2. DATABASE_URL is loaded from environment configuration.

3. SQLAlchemy engine is created successfully.

4. Database sessions can be safely created.

5. Alembic is configured correctly.

6. An initial migration exists.

7. The migration applies successfully.

8. Required tables exist:

- customers
- technicians
- service_categories
- technician_service_categories or equivalent association table
- tickets
- technician_assignments
- customer_technician_history

9. UUID primary keys are generated.

10. Timestamps work correctly.

11. Relationships work correctly.

12. Important unique constraints work.

13. Existing Phase 1 health endpoint still works.

14. Database tests pass.

15. Existing health tests still pass.

16. No Phase 3+ APIs or routing features have been implemented.

==================================================
FINAL EXPLANATION REQUIRED
==================================================

After implementation, explain clearly:

1. Every dependency added and why
2. Why PostgreSQL is appropriate
3. What an ORM is in this project
4. Why SQLAlchemy was chosen
5. Why sync or async SQLAlchemy was chosen
6. How DATABASE_URL flows into the application
7. How engine and session work
8. What a database session represents
9. What Alembic does
10. Why migrations are better than create_all() for this project
11. Every model and its responsibility
12. Every relationship
13. Every important constraint
14. Why Ticket has assignment history instead of a single technician_id
15. Why CustomerTechnicianHistory exists separately
16. How to create the database
17. How to generate/apply future migrations
18. How to run tests
19. Final project structure

Also give a short request/data-flow diagram:

PostgreSQL
    ↑
SQLAlchemy Session
    ↑
ORM Models
    ↑
Future API/Service Layer

Do not begin Phase 3.

Stop after Phase 2 is fully implemented and tested.


what im expecting after phase 2
                    SMART-HELPDESK DATABASE

 Customer ───────< Ticket >────── ServiceCategory
     │                │
     │                │
     │                └──────< TechnicianAssignment >────── Technician
     │                                                       │
     └──────── CustomerTechnicianHistory ────────────────────┘

 Technician ─────────────< TechnicianSkill/Category >──────── ServiceCategory