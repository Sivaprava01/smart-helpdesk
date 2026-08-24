# Smart-HelpDesk Backend: Comprehensive Overview & Verification (Phases 1 to 5)

This document provides an end-to-end, detailed technical account of everything built, tested, and verified across **Phase 1 through Phase 5** of the **Smart-HelpDesk** backend internship project.

---

## 1. Project Overview & Architecture Stack

- **Runtime & Language**: Python 3.13
- **Package & Dependency Manager**: `uv`
- **Web Framework**: FastAPI (Modern async ASGI, OpenAPI 3.1 documentation)
- **Database & ORM**: PostgreSQL (Production) / SQLite (Isolated In-Memory Unit/Integration Tests), SQLAlchemy 2.0 (Declarative Mapped columns), Alembic migrations
- **Validation & Serialization**: Pydantic v2 (`BaseModel`, `Field`, `model_validator`, `ConfigDict(from_attributes=True)`)
- **Architecture Pattern**: Clean Layered Architecture (`API Routers` → `Business Services` → `Domain Routing Engine` → `Database Models / Repositories`)

```text
smart-helpdesk/backend/
├── alembic/                      # Database migrations
│   ├── versions/
│   │   ├── 0001_initial_schema.py
│   │   ├── 0002_add_technician_current_zone.py
│   │   └── 0003_add_assignment_deferred_and_decline_note.py
│   └── env.py
├── phases/                       # Phase specifications & verification reports
│   └── verify/
│       ├── phase1.md / test_phase1.md
│       ├── phase2.md / test_phase2.md
│       ├── phase3.md / test_phase3.md
│       ├── phase4.md / test_phase4.md
│       ├── phase5.md / test_phase5.md
│       └── phases_1_to_5_complete_summary.md
├── src/smart_helpdesk/
│   ├── api/                      # REST API Routers
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── customers.py
│   │   │   ├── service_categories.py
│   │   │   ├── technicians.py
│   │   │   ├── tickets.py
│   │   │   └── assignments.py
│   │   └── router.py
│   ├── core/                     # Core configuration & exception handlers
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── db/                       # Database engine, session, enums, ORM models
│   │   ├── enums.py
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models/
│   │       ├── base.py
│   │       ├── customer.py
│   │       ├── service_category.py
│   │       ├── technician.py
│   │       ├── ticket.py
│   │       ├── technician_assignment.py
│   │       └── customer_technician_history.py
│   ├── routing/                  # Phase 4 Deterministic Routing Engine
│   │   ├── constants.py
│   │   ├── eligibility.py
│   │   ├── scoring.py
│   │   ├── ranking.py
│   │   └── schemas.py
│   ├── schemas/                  # Pydantic Request/Response DTOs
│   │   ├── customer.py
│   │   ├── service_category.py
│   │   ├── technician.py
│   │   ├── ticket.py
│   │   └── assignment.py
│   ├── services/                 # Domain business logic
│   │   ├── customer_service.py
│   │   ├── service_category_service.py
│   │   ├── technician_service.py
│   │   ├── ticket_service.py
│   │   ├── routing_service.py
│   │   └── assignment_service.py
│   └── main.py
└── tests/                        # 82 automated pytest test suites
```

---

## 2. Phase-by-Phase Detailed Breakdown

### Phase 1: Project Foundation, Core Architecture & Health APIs
* **Goal**: Establish the production-ready Python backend foundation with FastAPI, clean project structure, dependency injection, and standardized health check and documentation endpoints.
* **Key Implementations**:
  - Initialized `src` layout with `uv` and `pyproject.toml`.
  - Configured `pydantic-settings` in `core/config.py` for structured environment loading.
  - Implemented centralized exception handlers (`EntityNotFoundError` → 404, `DuplicateEntityError` → 409, `BusinessRuleError` → 400, generic unhandled exceptions → safe 500 without leaking stack traces).
  - Configured CORS, application lifespans, and logging.
  - Endpoints: `GET /health`, `GET /docs`, `GET /redoc`, `GET /openapi.json`.
* **Tests**: 4 tests in `tests/test_health.py`.

---

### Phase 2: Data Models, PostgreSQL Schemas & Alembic Migrations
* **Goal**: Design and implement the normalized relational database schema with UUID primary keys, UTC timestamp auditing, and foreign key relationships.
* **Key Implementations**:
  - `BaseModel`: Abstract model providing automatic UUID generation (`uuid.uuid4`) and timezone-aware timestamps (`created_at`, `updated_at`).
  - `Customer`: Customer account profiles with unique constraints on email and phone.
  - `ServiceCategory`: Supported maintenance skills (Plumbing, Electrical, Carpentry, HVAC, etc.) with active flags.
  - `Technician`: Technicians with workload capacity (`current_workload`, `max_workload`), rating (`overall_rating`), shift status (`is_on_duty`), active status (`is_active`), and many-to-many relationship with `ServiceCategory` via `technician_categories` association table.
  - `Ticket`: Service requests with `TicketStatus` enum (`PENDING`, `ROUTING`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `CANCELLED`), contact info, problem description, location, and scheduling support (`is_scheduled`, `scheduled_for`).
  - `TechnicianAssignment`: Assignment history tracking (`status`, `assigned_at`, `responded_at`, `accepted_at`, `declined_at`, `expires_at`).
  - `CustomerTechnicianHistory`: Pairwise interaction tracking (`completed_count`, `rating_sum`, `reopened_count`, `last_served_at`).
  - Created Alembic migration `0001_initial_schema.py`.
* **Tests**: 9 tests in `tests/test_database.py`.

---

### Phase 3: Core Domain APIs, CRUD Operations & Ticket Lifecycle Protection
* **Goal**: Build complete REST API endpoints for customers, service categories, technicians, and service tickets with input validation and lifecycle protection.
* **Key Implementations**:
  - **Customers API** (`/api/v1/customers`):
    - `POST /`: Create customer with email format validation and duplicate checks.
    - `GET /{id}`, `GET /`: Retrieve single or paginated customer listings.
    - `PATCH /{id}`: Update customer profile details.
  - **Service Categories API** (`/api/v1/categories`):
    - `POST /`: Create service categories with duplicate name prevention.
    - `GET /{id}`, `GET /`: Retrieve categories with active-only filtering.
    - `PATCH /{id}`: Update category name or active status.
  - **Technicians API** (`/api/v1/technicians`):
    - `POST /`: Create technician with category associations and workload constraints.
    - `GET /{id}`, `GET /`: List technicians with filtering by category, active status, and on-duty status.
    - `PATCH /{id}`: Update skills, status, or workload limits.
  - **Tickets API & Lifecycle Protection** (`/api/v1/tickets`):
    - `POST /`: Create ASAP or scheduled tickets. Enforces that scheduled tickets must specify a future datetime (`scheduled_for > now`) and ASAP tickets must have null `scheduled_for`.
    - `GET /{id}`, `GET /`: List and filter tickets by customer, category, status, or scheduling type.
    - `PATCH /{id}`: Controlled partial updates before assignment (protects critical fields).
    - `POST /{id}/cancel`: Safely cancel `PENDING` tickets (prevents modifying already cancelled tickets).
    - `GET /{id}/status`: Lightweight status polling endpoint.
    - **Security Rule**: No arbitrary client status mutation; no `DELETE` endpoints (preserves audit integrity).
* **Tests**: 26 tests across `test_customers_api.py`, `test_categories_api.py`, `test_technicians_api.py`, `test_tickets_api.py`, `test_lifecycle_api.py`.

---

### Phase 4: Intelligent Technician Routing Engine
* **Goal**: Build a deterministic, multi-factor scoring and ranking engine to match tickets with the best available technicians.
* **Key Implementations**:
  - Added `current_zone` string column to `Technician` via migration `0002_add_technician_current_zone.py`.
  - **Hard Eligibility Filters** (`routing/eligibility.py`):
    1. Technician must be active (`is_active == True`).
    2. Technician must be on duty (`is_on_duty == True`).
    3. Technician must support the ticket's category.
    4. Technician must have capacity (`current_workload < max_workload`).
  - **Deterministic 100-Point Normalized Scoring** (`routing/scoring.py`):
    - Location Proximity (20%): Same zone = 1.0, adjacent = 0.5, different = 0.1.
    - Overall Rating (25%): Normalized from 1.0–5.0 scale.
    - Customer History Affinity (25%): Boosts technicians who previously served the customer well.
    - Reopen Rate Reliability (15%): Low reopen rate = higher score.
    - Workload Availability (15%): Lower current workload = higher score.
  - **Deterministic Tie-Breaking** (`routing/ranking.py`): Total Score desc → Overall Rating desc → Workload asc → Creation Date asc → UUID asc.
  - **Routing Preview APIs** (`routing_service.py`):
    - `POST /api/v1/tickets/{id}/routing-preview` & `GET /api/v1/tickets/{id}/routing-preview`: Strictly read-only evaluation without side effects.
* **Tests**: 21 tests across `test_routing_scoring.py`, `test_routing_eligibility.py`, `test_routing_ranking.py`, `test_routing_service.py`, `test_routing_api.py`.

---

### Phase 5: Technician Assignment Offer, Acceptance, Decline, Ask-Me-Later, Timeout & Fallback Rerouting
* **Goal**: Implement the complete assignment lifecycle, non-punitive declines, deferrals, timeout expiration, and live fallback rerouting.
* **Key Implementations**:
  - Extended `AssignmentStatus` enum with `DEFERRED`.
  - Added `decline_note` (`TEXT`) and `deferred_at` (`TIMESTAMPTZ`) to `technician_assignments` via migration `0003_add_assignment_deferred_and_decline_note.py`.
  - **Initial Assignment Dispatch** (`POST /api/v1/tickets/{id}/assign`):
    - Evaluates routing, checks active offer guard (max 1 active offer per ticket), protects future scheduled tickets, and creates an offer with a 10-minute response deadline (`expires_at`). Ticket transitions to `ROUTING`. Workload is NOT incremented.
  - **Acceptance** (`POST /api/v1/assignments/{id}/accept`):
    - Validates offer is in `OFFERED` or `DEFERRED` state and not expired.
    - Transitions assignment to `ACCEPTED`, sets ticket to `ASSIGNED`, and increments technician `current_workload` by 1 in an atomic transaction.
  - **Decline & Live Fallback** (`POST /api/v1/assignments/{id}/decline`):
    - Records decline reason and note. Workload remains unchanged.
    - Fallback rerouting immediately evaluates **live current data** (not stale rankings), excludes all previously attempted technicians for this ticket, and dispatches an offer to the next best candidate.
  - **Ask-Me-Later (Deferral)** (`POST /api/v1/assignments/{id}/ask-later`):
    - Transitions assignment to `DEFERRED` while preserving the original response deadline (`expires_at`).
  - **Timeout Processing** (`POST /api/v1/assignments/process-expired`):
    - Scans for offers past their deadline, marks them `EXPIRED`, and triggers live fallback for affected tickets.
  - **Assignment Audit History** (`GET /api/v1/tickets/{id}/assignments`):
    - Returns full chronological attempt history.
* **Tests**: 12 tests in `tests/test_assignment_service.py` and `tests/test_assignments_api.py`.

---

## 3. Complete API Endpoint Reference (Phases 1–5)

| Category | HTTP Verb | Endpoint | Purpose |
|---|---|---|---|
| **Health** | `GET` | `/health` | Application health and status check |
| **Customers** | `POST` | `/api/v1/customers` | Create new customer account |
| | `GET` | `/api/v1/customers` | List customers with pagination |
| | `GET` | `/api/v1/customers/{id}` | Get customer details by ID |
| | `PATCH` | `/api/v1/customers/{id}` | Update customer details |
| **Categories** | `POST` | `/api/v1/categories` | Create service category |
| | `GET` | `/api/v1/categories` | List service categories |
| | `GET` | `/api/v1/categories/{id}` | Get service category by ID |
| | `PATCH` | `/api/v1/categories/{id}` | Update category name / active status |
| **Technicians** | `POST` | `/api/v1/technicians` | Register new technician |
| | `GET` | `/api/v1/technicians` | List and filter technicians |
| | `GET` | `/api/v1/technicians/{id}` | Get technician details by ID |
| | `PATCH` | `/api/v1/technicians/{id}` | Update skills, on-duty status, workload capacity |
| **Tickets** | `POST` | `/api/v1/tickets` | Create ASAP or scheduled service ticket |
| | `GET` | `/api/v1/tickets` | List and filter tickets |
| | `GET` | `/api/v1/tickets/{id}` | Get ticket details by ID |
| | `PATCH` | `/api/v1/tickets/{id}` | Partially update allowed ticket details |
| | `POST` | `/api/v1/tickets/{id}`/cancel | Cancel a pending service ticket |
| | `GET` | `/api/v1/tickets/{id}`/status | Lightweight ticket status check |
| **Routing** | `POST` | `/api/v1/tickets/{id}`/routing-preview | Evaluate and preview deterministic technician ranking |
| | `GET` | `/api/v1/tickets/{id}`/routing-preview | Read-only idempotent routing preview |
| **Assignments** | `POST` | `/api/v1/tickets/{id}`/assign | Dispatch initial offer to top recommended technician |
| | `GET` | `/api/v1/tickets/{id}`/assignments | Retrieve complete assignment attempt history |
| | `POST` | `/api/v1/assignments/{id}`/accept | Accept assignment offer, set ASSIGNED, increment workload |
| | `POST` | `/api/v1/assignments/{id}`/decline | Decline offer with reason and trigger live fallback |
| | `POST` | `/api/v1/assignments/{id}`/ask-later | Defer offer decision while preserving deadline |
| | `POST` | `/api/v1/assignments/process-expired` | Expire timed-out offers and trigger fallback rerouting |

---

## 4. Complete Test Suite Coverage (82 Tests Passing)

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
rootdir: backend
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2
collected 82 items

tests/test_assignment_service.py ................ (8 tests) [PASSED]
tests/test_assignments_api.py ........ (4 tests)           [PASSED]
tests/test_categories_api.py ........ (4 tests)            [PASSED]
tests/test_customers_api.py .............. (7 tests)       [PASSED]
tests/test_database.py .................. (9 tests)        [PASSED]
tests/test_health.py ........ (4 tests)                    [PASSED]
tests/test_lifecycle_api.py ............ (6 tests)         [PASSED]
tests/test_routing_api.py .......... (5 tests)             [PASSED]
tests/test_routing_eligibility.py .............. (7 tests) [PASSED]
tests/test_routing_ranking.py ...... (3 tests)             [PASSED]
tests/test_routing_scoring.py ............ (6 tests)       [PASSED]
tests/test_routing_service.py ........ (4 tests)           [PASSED]
tests/test_technicians_api.py ............ (6 tests)       [PASSED]
tests/test_tickets_api.py .................. (9 tests)     [PASSED]

======================== 82 passed, 1 warning in 5.63s ========================
```

---

## 5. Scope Boundary (What is Reserved for Future Phases)

- **Phase 6**: Resolution & Confirmation Workflow, On-site technician arrival, work completion reporting, customer verification, rating recalculation, reopening workflow.
- **Phase 7+**: Async message queues (Redis/Celery), real-world notification dispatchers (SMS/Email), Authentication & RBAC (JWT/OAuth), ML-driven classification.
