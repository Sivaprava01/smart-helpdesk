# Smart-HelpDesk — Complete Project Master Learning & Reference Guide

> **Project:** Smart-HelpDesk (Intelligent Residential Maintenance & Deterministic Dispatching Platform)  
> **Author:** Sivaprava ([Sivaprava01](https://github.com/Sivaprava01))  
> **Repository Location:** Root Reference Document (`learn.md`)  
> **Verified Test Suite Baseline:** 104 Passing Backend Tests (`pytest`), Clean Frontend Production Build (`vite`)  
> **Primary Technology Stack:** FastAPI + PostgreSQL + SQLAlchemy 2.0 + Alembic + React 19 + Vite 6 + Bootstrap 5 / Vanilla Design Tokens + `uv`

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
   - 1.1 Project Name
   - 1.2 Problem Statement & Industry Context
2. [Our Approach & Architectural Philosophy](#2-our-approach--architectural-philosophy)
   - 2.1 The Core Conceptual Flow
   - 2.2 Why We Designed the System This Way
3. [Technology Stack](#3-technology-stack)
   - 3.1 Backend Technologies
   - 3.2 Frontend Technologies
   - 3.3 Development, Packaging & Infrastructure
4. [Complete Project Structure](#4-complete-project-structure)
   - 4.1 Repository Layout Tree
   - 4.2 Detailed Directory & Module Walkthrough
5. [System Architecture](#5-system-architecture)
   - 5.1 Architecture Diagram
   - 5.2 Layered System Design & Data Flow
6. [Backend Architecture Deep Dive](#6-backend-architecture-deep-dive)
   - 6.1 Application Entry & Factory Pattern
   - 6.2 Configuration & Settings Management
   - 6.3 Database Engine & Session Lifecycle
   - 6.4 Domain Exception Hierarchy & Error Handling
   - 6.5 Services & Business Logic Layer
7. [Database Design & Data Modeling](#7-database-design--data-modeling)
   - 7.1 Entity-Relationship (ER) Diagram
   - 7.2 Detailed Database Models & Constraints
8. [Alembic & Database Migrations](#8-alembic--database-migrations)
   - 8.1 Migration Strategy & Tooling
   - 8.2 Migration History (0001 through 0005)
   - 8.3 Migration CLI Workflow
9. [Authentication & Session Management](#9-authentication--session-management)
   - 9.1 Password Security & Hashing
   - 9.2 JWT Dual-Token Strategy (Access & Refresh)
   - 9.3 Token Refresh Flow & Auto-Refresh Interceptor
   - 9.4 Google OAuth2 Integration
   - 9.5 Session Restoration (`/auth/me`)
10. [Role-Based Access Control (RBAC)](#10-role-based-access-control-rbac)
    - 10.1 Multi-Role Matrix & Responsibilities
    - 10.2 Backend Authorization Enforcement vs Frontend Route Guarding
    - 10.3 Ownership Validation Logic
11. [Frontend Architecture](#11-frontend-architecture)
    - 11.1 Component Hierarchy & Tree Structure
    - 11.2 Routing & Route Protection Strategy
    - 11.3 State Management & Context Providers
    - 11.4 Design System & Vanilla CSS Tokens
12. [Frontend API Layer](#12-frontend-api-layer)
    - 12.1 Central Client & Fetch Interceptor
    - 12.2 API Modules & Contract Catalog
13. [Customer Journey — Complete Walkthrough](#13-customer-journey--complete-walkthrough)
14. [Technician Journey — Complete Walkthrough](#14-technician-journey--complete-walkthrough)
15. [Dispatcher Journey — Operations Hub Walkthrough](#15-dispatcher-journey--operations-hub-walkthrough)
16. [Admin Journey — System Management Walkthrough](#16-admin-journey--system-management-walkthrough)
17. [Ticket Lifecycle](#17-ticket-lifecycle)
    - 17.1 Ticket Status State Machine
    - 17.2 Status Transitions & Trigger Matrix
18. [Assignment Lifecycle](#18-assignment-lifecycle)
    - 18.1 Assignment Status State Machine
    - 18.2 Distinction: Ticket Status vs Assignment Status
19. [Deterministic Routing Engine](#19-deterministic-routing-engine)
    - 19.1 Mandatory Eligibility Rules (Phase 4 Filter)
    - 19.2 Multi-Factor 100-Point Scoring Model
    - 19.3 Mathematical Formulas & Neutral Priors
    - 19.4 Deterministic Ranking & Tie-Breaking Hierarchy
20. [Fallback Rerouting Engine](#20-fallback-rerouting-engine)
    - 20.1 Fallback Trigger Scenarios (Decline, Defer, Timeout, Reopen)
    - 20.2 Dynamic Exclusion & Loop Prevention
21. [Resolution & Reopening Workflows](#21-resolution--reopening-workflows)
    - 21.1 Technician Completion Note & Confirmation Gate
    - 21.2 Positive Confirmation (Closure & Feedback)
    - 21.3 Negative Confirmation (Reopening & Immediate Rerouting)
    - 21.4 Feedback Aggregation & Historical Metrics
22. [Complete API Reference Catalog](#22-complete-api-reference-catalog)
23. [Important Code Map](#23-important-code-map)
24. [Code Snippet Library](#24-code-snippet-library)
25. [Development Phase History](#25-development-phase-history)
    - 25.1 Backend Phases 1 through 6
    - 25.2 Authentication & Multi-Role Phase
    - 25.3 Frontend Phases 1 through 5
    - 25.4 Frontend-Backend Integration Synchronization Steps 1 through 6
26. [Why Certain Design Decisions Were Made](#26-why-certain-design-decisions-were-made)
27. [Testing Strategy & Verification](#27-testing-strategy--verification)
    - 27.1 Backend Automated Pytest Suite (104 Tests)
    - 27.2 Frontend Build & Contract Validation
    - 27.3 Testing Scope & Guarantees
28. [How to Run the Project](#28-how-to-run-the-project)
    - 28.1 Prerequisites & Tooling (`uv`, Node.js, PostgreSQL)
    - 28.2 Database Setup & Seeding
    - 28.3 Running Backend & Frontend
    - 28.4 Running Test Suites
29. [Environment Variables Reference](#29-environment-variables-reference)
30. [Manual Website Walkthrough & Demo Script](#30-manual-website-walkthrough--demo-script)
31. [Troubleshooting Guide](#31-troubleshooting-guide)
32. [Current Project Status & Production Readiness](#32-current-project-status--production-readiness)
33. [Things I Must Remember](#33-things-i-must-remember)
34. [How I Would Explain This Project in an Interview](#34-how-i-would-explain-this-project-in-an-interview)
35. [Comprehensive Technical Interview Q&A](#35-comprehensive-technical-interview-qa)
36. [System Design Deep Dive & Sequence Diagrams](#36-system-design-deep-dive--sequence-diagrams)
37. [Security Architecture](#37-security-architecture)
38. [Performance & Scalability Analysis](#38-performance--scalability-analysis)
39. [Future Roadmap & Potential Improvements](#39-future-roadmap--potential-improvements)
40. [Final Quick Reference Cheat Sheet](#40-final-quick-reference-cheat-sheet)

---

# 1. PROJECT OVERVIEW

## 1.1 Project Name
**Smart-HelpDesk** — Multi-Role Operations & Deterministic Dispatching Platform for Residential Communities.

## 1.2 Problem Statement & Industry Context

### The Real-World Challenge
In modern residential complexes, condominium towers, and managed gated communities, facility management faces severe operational friction in handling maintenance requests (such as plumbing leaks, electrical outages, HVAC failures, carpentry repairs, and appliance diagnostics).

Traditional residential helpdesks suffer from several critical systemic defects:
1. **Inefficient Manual Dispatching**: Customer service desks or dispatchers manually triage tickets, leading to bottlenecks, human bias, delayed technician allocation, and high administrative overhead.
2. **Ignored Technician Availability & Workload**: Assignments are frequently made without real-time awareness of technician on-duty status, current concurrent workload, or physical tower proximity. Overloaded technicians experience burnout, while idle specialists remain unutilized.
3. **Black-Box / Non-Deterministic Assignment**: Unclear selection criteria make dispatch decisions impossible to audit, reproduce, or debug when disputes or service delays arise.
4. **Lack of Automated Fallback Rerouting**: When an assigned technician declines a job, is unresponsive, or times out, tickets languish in queues without immediate automated escalation or re-offering to the next most qualified candidate.
5. **Disconnected Ticket Lifecycle & Service Verification**: Traditional systems mark tickets "Closed" as soon as a technician clicks complete, leaving residents frustrated when the issue was poorly resolved or left incomplete. There is no enforced gate requiring the resident to confirm actual resolution before closure.
6. **Absence of Role-Tailored Interfaces**: Dispatchers need system-wide visibility and candidate scoring breakdowns; technicians need rapid 1-tap mobile offer decision cards and arrival workflows; residents need straightforward status tracking and verification cards.

### The Solution: Smart-HelpDesk
Smart-HelpDesk solves these problems through an automated, **explainable, deterministic routing engine** and an **enforced state-machine lifecycle**. The platform models 4 dedicated operational roles (`ADMIN`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`), evaluates real-time technician eligibility across 4 mandatory checks, scores eligible specialists using a 5-factor 100-point algorithm, provides 10-minute response-window offer cards, supports automated fallback rerouting on rejection/timeout, and ensures customer-confirmed resolution with pairwise customer-technician affinity tracking.

---

# 2. OUR APPROACH & ARCHITECTURAL PHILOSOPHY

## 2.1 The Core Conceptual Flow

```text
  [ Customer / Resident ]
            │
            ▼ 1. Submit Service Request (Category, Contact, Location, ASAP or Scheduled)
      [ TICKET: PENDING ]
            │
            ▼ 2. Dispatch Trigger (Manual by Dispatcher or Auto-Dispatch on Creation)
      [ ROUTING ENGINE ]
            │ ── Evaluates Mandatory Eligibility (Active, On-Duty, Skill Category, Workload < Max)
            │ ── Calculates Multi-Factor Score (Location 20 + Rating 25 + History 25 + Reliability 15 + Workload 15)
            │ ── Sorts Deterministically with Tie-Breaking Hierarchy
            ▼
      [ TICKET: ROUTING ] ──── Creates Offer ────► [ ASSIGNMENT: OFFERED ] (10-Min Deadline)
                                                              │
                     ┌────────────────────────────────────────┼────────────────────────────────────────┐
                     ▼                                        ▼                                        ▼
             Technician ACCEPTS                      Technician DECLINES                      Offer EXPIRES (10m)
                     │                                        │                                        │
           [ ASSIGNMENT: ACCEPTED ]                 [ ASSIGNMENT: DECLINED ]                 [ ASSIGNMENT: EXPIRED ]
           [ TICKET: ASSIGNED ]                               │                                        │
           (Workload +1)                                      └───────────────────┬────────────────────┘
                     │                                                            │
                     ▼                                                            ▼
           Technician Marks ARRIVAL                                     [ FALLBACK REROUTING ]
           [ TICKET: ARRIVED ]                                          ── Excludes Attempted Techs
                     │                                                  ── Live Re-Scoring of Pool
                     ▼                                                  ── Offers Next Best Tech (or PENDING)
           Technician STARTS Work
           [ TICKET: IN_PROGRESS ]
                     │
                     ▼
           Technician COMPLETES Work (with Work Note)
           [ TICKET: AWAITING_CUSTOMER_CONFIRMATION ]
                     │
                     ▼
           Customer RESOLUTION Verification Form
                     │
         ┌───────────┴────────────────────────────────────────┐
         ▼                                                    ▼
    Customer Confirms: "YES, RESOLVED"                   Customer Confirms: "NO, UNRESOLVED"
         │                                                    │
    • Stored in `ticket_feedbacks`                       • Stored in `ticket_feedbacks`
    • History updated positively                         • History updated negatively
    • Technician rating aggregate updated                • Technician reopened count incremented
    • Technician workload released (-1)                  • Previous technician workload released (-1)
    • [ ASSIGNMENT: COMPLETED ]                          • [ ASSIGNMENT: COMPLETED ]
    • [ TICKET: CLOSED ]                                 • [ TICKET: REOPENED ]
                                                              │
                                                              ▼
                                                        [ FALLBACK REROUTING ]
                                                        (Dispatches to Alternative Specialist)
```

## 2.2 Why We Designed the System This Way
1. **Explainable Determinism over Black-Box Heuristics**: Both dispatchers and candidates can inspect exactly why a specialist was ranked #1 based on clear math (Location + Rating + Pairwise History + Reliability + Capacity).
2. **Strict State Isolation**: A ticket's lifecycle (`TicketStatus`) and an individual specialist's offer attempt (`AssignmentStatus`) are decoupled. A single ticket can accumulate multiple historical assignment attempts (e.g., Declined $\rightarrow$ Offered $\rightarrow$ Accepted) while maintaining a clean, single ticket status.
3. **Closed-Loop Verification Gate**: Technicians cannot unilaterally mark tickets "Closed". Tickets must transition through `AWAITING_CUSTOMER_CONFIRMATION`, empowering the resident to verify the physical fix or trigger an immediate reopen.
4. **Idempotent & Self-Healing Fallback**: When an offer fails, the system dynamically queries the live state of all technicians, excludes all previously attempted specialists for that ticket, and calculates a fresh recommendation without stale cache corruption.

---

# 3. TECHNOLOGY STACK

Only technologies actually present in the repository and actively used in the implementation are listed:

| Layer | Technology | Version | Purpose in Smart-HelpDesk | Why Selected |
|---|---|---|---|---|
| **Backend Runtime** | Python | `>=3.13` | Backend execution environment | Modern type syntax (`type1 \| type2`), superior async IO, high performance. |
| **Backend Framework** | FastAPI | `>=0.141.1` | REST API layer, routing, request lifecycle | High throughput ASGI framework, native OpenAPI/Swagger generation, standard dependency injection. |
| **Data Validation** | Pydantic v2 / Pydantic-Settings | `>=2.15.0` | Schema validation, request serialization, settings parsing | Fast Rust-backed data parsing, automatic error formatting, strict type coercion. |
| **ORM & Persistence** | SQLAlchemy | `>=2.0.38` | Object-Relational Mapping & query builder | Modern Type-Annotated `Mapped[]` declarations, explicit session management, relational integrity. |
| **Database Driver** | Psycopg 3 (psycopg binary) | `>=3.2.5` | PostgreSQL database connection driver | Modern, robust PostgreSQL driver with native binary protocol support and connection stability. |
| **Database Migrations** | Alembic | `>=1.14.1` | Relational database schema migrations | Industry-standard schema versioning, reproducible migration revisions, seamless SQLAlchemy metadata integration. |
| **Database Engine** | PostgreSQL | `15+ / 16+` | Primary relational database | ACID compliance, check constraints, foreign key cascades, ENUM types, JSON/UUID indexing. |
| **Package Manager** | `uv` (Astral) | `>=0.12.5` | Python virtualenv, dependency lockfile, build backend | Extremely fast dependency resolution (10-100x faster than pip), deterministic `uv.lock`. |
| **Authentication** | PyJWT | `>=2.13.0` | Cryptographic JWT access & refresh token encoding/decoding | Stateless token issuance, HMAC-SHA256 signature verification, claims validation (`sub`, `exp`, `role`). |
| **Password Hashing** | Bcrypt | `>=5.0.0` | Secure password hashing & salting | Industry standard adaptive salted hashing for secure credential persistence. |
| **HTTP Client** | HTTPX | `>=0.28.1` | Testing client & external OAuth HTTP calls | Async/sync HTTP client for FastAPI `TestClient` and Google OAuth token endpoint communication. |
| **Backend Testing** | Pytest | `>=9.1.1` | Automated unit & integration test runner | Fixture-based test execution, assertions, test isolation with SQLite/Postgres. |
| **Frontend Runtime** | Node.js | `>=18+ / 20+` | Frontend execution & build environment | JavaScript/ECMAScript execution environment. |
| **Frontend Framework** | React | `^19.0.0` | UI component library & virtual DOM | Declarative component model, hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`). |
| **Build Tool & Bundler** | Vite | `^6.0.7` | Frontend dev server & production bundler | Instant Hot Module Replacement (HMR), lightning-fast Rollup-based production builds. |
| **Frontend Routing** | React Router DOM | `^7.1.5` | Single-page application (SPA) client-side routing | Route nesting, `ProtectedRoute` wrappers, programmatic navigation (`useNavigate`, `useParams`). |
| **CSS Framework** | Bootstrap 5 | `^5.3.3` | Responsive layout grid, utility classes | Grid system (`row`, `col-12`, `col-lg-8`, `gap-3`), base form controls and buttons. |
| **Styling Architecture** | Vanilla CSS / Design Tokens | Custom | Design tokens, color system, elevation, badges | Zero runtime CSS overhead, custom dark/light palette variables (`theme.css`, `variables.css`). |
| **Icons & Typography** | Google Material Symbols & Fonts | Web Hosted | Visual icons and modern typography | Clean iconography (`water_drop`, `build`, `verified`, `schedule`, `timer`). |

---

# 4. COMPLETE PROJECT STRUCTURE

## 4.1 Repository Layout Tree

```text
smart-helpdesk/
├── .env.example                               # Root environment variable template
├── .gitignore                                 # Root Git ignore rules
├── PROJECT_MASTER_TEST_CHECKLIST.md           # Master end-to-end multi-role verification checklist
├── README.md                                  # Repository overview
├── user.md                                    # Seeded test account credentials & role guide
├── learn.md                                   # Comprehensive project master learning document (THIS FILE)
│
├── backend/                                   # FastAPI Backend Application
│   ├── .env                                   # Local runtime environment file (ignored by Git)
│   ├── .env.example                           # Backend environment template
│   ├── .gitignore                             # Backend Git ignore rules
│   ├── .python-version                        # Python runtime version lock (3.13)
│   ├── README.md                              # Backend quickstart guide
│   ├── alembic.ini                            # Alembic configuration & migration root
│   ├── pyproject.toml                         # Project metadata, dependencies, scripts, pytest config
│   ├── uv.lock                                # Deterministic dependency lockfile
│   │
│   ├── alembic/                               # Alembic Migration Scripts
│   │   ├── env.py                             # Migration execution environment & metadata binding
│   │   ├── script.py.mako                     # Migration script template
│   │   └── versions/                          # Migration revision files
│   │       ├── 0001_initial_phase2_schema.py
│   │       ├── 0002_add_technician_current_zone.py
│   │       ├── 0003_add_assignment_deferred_and_decline_note.py
│   │       ├── 0004_add_service_execution_and_feedback.py
│   │       └── 0005_add_users_authentication.py
│   │
│   ├── phases/                                # Backend Phase Specifications & Checkpoints
│   │   ├── phase1.md                          # Phase 1: Foundation
│   │   ├── phase2.md                          # Phase 2: Database & Models
│   │   ├── phase3.md                          # Phase 3: Core CRUD APIs
│   │   ├── phase4.md                          # Phase 4: Deterministic Routing Engine
│   │   ├── phase5.md                          # Phase 5: Assignment Offers & Fallback
│   │   ├── phase6.md                          # Phase 6: Resolution & Customer Confirmation
│   │   ├── jwt_oauth.md                       # Authentication & JWT Architecture
│   │   ├── role.md                            # Role definitions & RBAC requirements
│   │   └── verify/                            # Backend verification artifacts
│   │
│   ├── src/                                   # Backend Source Code Package
│   │   └── smart_helpdesk/                    # Primary Python package
│   │       ├── __init__.py                    # Package initializer
│   │       ├── main.py                        # FastAPI application factory & lifespan handler
│   │       │
│   │       ├── api/                           # API Presentation Layer
│   │       │   ├── __init__.py
│   │       │   ├── dependencies.py            # Auth, RBAC & ownership FastAPI dependencies
│   │       │   ├── router.py                  # Central API router mounting all domain routes
│   │       │   └── routes/                    # Domain Route Controllers
│   │       │       ├── __init__.py
│   │       │       ├── assignments.py         # /assignments endpoints (accept, decline, defer, expired)
│   │       │       ├── auth.py                # /auth endpoints (register, login, refresh, me, oauth)
│   │       │       ├── customers.py           # /customers CRUD endpoints
│   │       │       ├── health.py              # /health readiness check endpoint
│   │       │       ├── service_categories.py  # /categories CRUD endpoints
│   │       │       ├── technicians.py         # /technicians CRUD endpoints
│   │       │       └── tickets.py             # /tickets endpoints (CRUD, arrive, start, complete, response)
│   │       │
│   │       ├── core/                          # Cross-Cutting Infrastructure
│   │       │   ├── __init__.py
│   │       │   ├── config.py                  # Pydantic BaseSettings configuration
│   │       │   ├── exceptions.py              # Domain exception hierarchy & global handlers
│   │       │   ├── logging.py                 # Centralized logging configuration
│   │       │   └── security.py                # Bcrypt hashing & PyJWT token utilities
│   │       │
│   │       ├── db/                            # Database Layer
│   │       │   ├── __init__.py
│   │       │   ├── base.py                    # Base, UUIDMixin, TimestampMixin, BaseModel
│   │       │   ├── enums.py                   # UserRole, TicketStatus, AssignmentStatus, DeclineReason
│   │       │   ├── seed_users.py              # Idempotent database seeder for test accounts
│   │       │   ├── session.py                 # SQLAlchemy engine & get_db dependency
│   │       │   └── models/                    # Declarative SQLAlchemy ORM Models
│   │       │       ├── __init__.py
│   │       │       ├── base.py                # Base ORM classes
│   │       │       ├── customer.py            # Customer entity
│   │       │       ├── customer_technician_history.py # Pairwise affinity metrics
│   │       │       ├── service_category.py    # ServiceCategory & m2m association table
│   │       │       ├── technician.py          # Technician entity
│   │       │       ├── technician_assignment.py # TechnicianAssignment entity
│   │       │       ├── ticket.py              # Ticket entity
│   │       │       ├── ticket_feedback.py     # TicketFeedback entity
│   │       │       └── user.py                # User authentication entity
│   │       │
│   │       ├── routing/                       # Deterministic Routing Engine (Phase 4)
│   │       │   ├── __init__.py
│   │       │   ├── constants.py               # Weights (Location, Rating, History, Reopen, Workload)
│   │       │   ├── eligibility.py             # 4 mandatory eligibility filter rules
│   │       │   ├── ranking.py                 # Multi-factor scoring & deterministic tie-breaking
│   │       │   ├── schemas.py                 # Routing candidate & preview Pydantic models
│   │       │   └── scoring.py                 # Factor score calculation formulas & neutral priors
│   │       │
│   │       ├── schemas/                       # Pydantic Request/Response DTOs
│   │       │   ├── __init__.py
│   │       │   ├── assignment.py              # AssignmentResponse, DeclineRequest, FallbackSummary
│   │       │   ├── auth.py                    # Login, Register, TokenResponse, UserResponse
│   │       │   ├── customer.py                # CustomerCreate, CustomerUpdate, CustomerResponse
│   │       │   ├── execution.py               # CompleteWorkRequest, ExecutionActionResponse
│   │       │   ├── feedback.py                # CustomerResponseRequest, ResolutionResponse
│   │       │   ├── service_category.py        # ServiceCategoryCreate, ServiceCategoryResponse
│   │       │   ├── technician.py              # TechnicianCreate, TechnicianUpdate, TechnicianResponse
│   │       │   └── ticket.py                  # TicketCreate, TicketUpdate, TicketResponse
│   │       │
│   │       └── services/                      # Domain Business Logic Layer
│   │           ├── __init__.py
│   │           ├── assignment_service.py      # Assignment offers, accept/decline/defer/expire/reroute
│   │           ├── auth_service.py            # Authentication, registration, token refresh, Google OAuth
│   │           ├── customer_service.py        # Customer management operations
│   │           ├── execution_service.py       # On-site arrival, start work, complete work
│   │           ├── resolution_service.py      # Customer resolution confirmation, feedback, reopen
│   │           ├── routing_service.py         # Read-only routing preview evaluations
│   │           ├── service_category_service.py# Category operations
│   │           ├── technician_service.py      # Technician capacity & shift operations
│   │           └── ticket_service.py          # Ticket creation, filtering, update, cancellation
│   │
│   └── tests/                                 # Automated Test Suite (104 Pytest Tests)
│       ├── __init__.py
│       ├── test_assignment_service.py         # Unit tests for assignment workflows
│       ├── test_assignments_api.py            # API tests for /assignments endpoints
│       ├── test_auth.py                       # API tests for authentication & RBAC
│       ├── test_categories_api.py             # API tests for /categories endpoints
│       ├── test_customers_api.py              # API tests for /customers endpoints
│       ├── test_database.py                   # DB connection & model integrity tests
│       ├── test_execution_service.py          # Unit tests for arrival & execution steps
│       ├── test_health.py                     # Health check tests
│       ├── test_lifecycle_api.py              # End-to-end ticket lifecycle transition tests
│       ├── test_resolution_api.py             # API tests for resolution confirmation
│       ├── test_resolution_service.py         # Unit tests for customer response & metrics
│       ├── test_routing_api.py                # API tests for /routing-preview endpoints
│       ├── test_routing_eligibility.py        # Unit tests for mandatory eligibility filters
│       ├── test_routing_ranking.py            # Unit tests for ranking & tie-breaking
│       ├── test_routing_scoring.py            # Unit tests for 5 individual scoring formulas
│       ├── test_routing_service.py            # Unit tests for routing service
│       ├── test_technicians_api.py            # API tests for /technicians endpoints
│       └── test_tickets_api.py                # API tests for /tickets CRUD endpoints
│
└── frontend/                                  # React 19 + Vite Frontend SPA
    ├── .gitignore                             # Frontend Git ignore rules
    ├── index.html                             # Single Page Application HTML entry point
    ├── package.json                           # NPM dependencies, scripts, devDependencies
    ├── package-lock.json                      # Deterministic NPM lockfile
    ├── vite.config.js                         # Vite dev server & build configuration
    │
    ├── phases/                                # Frontend Phase Documentation
    │   ├── frontend_guidelines.md
    │   ├── jwt_frontend.md                    # Frontend JWT & refresh interceptor specs
    │   ├── phase1.md                          # Phase 1: Setup & Management UI
    │   ├── phase2.md                          # Phase 2: Ticket Operations Hub
    │   ├── phase3.md                          # Phase 3: Routing Engine Monitor
    │   ├── phase4.md                          # Phase 4: Specialist Portal
    │   ├── phase5.md                          # Phase 5: Resolution & Verification
    │   ├── role.md                            # Role routing & access matrix
    │   └── ui.md                              # UI design system guidelines
    │
    └── src/                                   # Frontend Application Source Code
        ├── App.jsx                            # React root router & route definitions
        ├── main.jsx                           # DOM mounting entry point
        │
        ├── api/                               # Backend API Communication Wrappers
        │   ├── assignments.js                 # Assignment offer APIs
        │   ├── auth.js                        # Login, register, refresh, me, oauth APIs
        │   ├── categories.js                  # Service category APIs
        │   ├── client.js                      # Core apiClient fetch wrapper with 401 interceptor
        │   ├── customers.js                   # Resident directory APIs
        │   ├── routing.js                     # Routing preview API
        │   ├── technicians.js                 # Technician capacity APIs
        │   └── tickets.js                     # Ticket CRUD, arrival, work, resolution APIs
        │
        ├── components/                        # Reusable React UI Components
        │   ├── auth/
        │   │   └── ProtectedRoute.jsx         # Role-based route authorization wrapper
        │   ├── common/                        # Shared UI Primitives
        │   │   ├── Button.jsx                 # Styled button with loading state
        │   │   ├── EmptyState.jsx             # No-data illustration & action prompt
        │   │   ├── ErrorState.jsx             # Error banner with retry trigger
        │   │   ├── ModalDialog.jsx            # Accessible dialog modal overlay
        │   │   ├── PageHeader.jsx             # Breadcrumb, title, action header
        │   │   ├── SkeletonLoader.jsx         # Shimmer loading placeholders
        │   │   ├── StatTile.jsx               # KPI metric statistic card
        │   │   └── StatusBadge.jsx            # Color-coded badge for Ticket & Assignment status
        │   ├── layout/                        # Shell Layout Components
        │   │   ├── AppLayout.jsx              # Application frame (Sidebar + TopHeader + Main Content)
        │   │   ├── Sidebar.jsx                # Collapsible role-based navigation sidebar
        │   │   └── TopHeader.jsx              # Global header with status indicators & user menu
        │   ├── routing/                       # Routing Inspection Components
        │   │   ├── ActiveOfferTimer.jsx       # 10-minute visual countdown timer
        │   │   ├── CandidateScoreBreakdown.jsx# 5-factor progress bar visualizer
        │   │   └── RoutingInspector.jsx       # Comprehensive routing diagnostic tool
        │   ├── technician/                    # Field Specialist Components
        │   │   ├── ActiveJobExecutionCard.jsx # Arrival, start work, complete work action card
        │   │   ├── DeclineOfferModal.jsx      # Controlled decline reason modal
        │   │   └── JobOfferCard.jsx           # 15-minute offer decision card (Accept/Decline/Defer)
        │   └── tickets/                       # Ticket Lifecycle Components
        │       ├── AssignmentHistoryTimeline.jsx # Chronological offer attempt history
        │       ├── FeedbackHistoryCard.jsx    # Past rating & feedback audit trail
        │       ├── RoutingPreviewModal.jsx    # Pop-up candidate ranking preview
        │       ├── ServiceResolutionCard.jsx  # Customer resolution verification & star rating form
        │       └── TicketLifecycleStepper.jsx # Visual 5-step lifecycle progress bar
        │
        ├── constants/
        │   └── statusMappings.js              # Centralized status labels, badge classes, icons
        │
        ├── context/
        │   ├── AuthContext.jsx                # Global session state, login, register, logout, OAuth
        │   └── ToastContext.jsx               # Global toast alert notification provider
        │
        ├── pages/                             # Page Route Views
        │   ├── auth/
        │   │   ├── LoginPage.jsx              # Credentials login with role demo presets
        │   │   ├── OAuthCallbackPage.jsx      # Google OAuth2 redirect processor
        │   │   └── RegisterPage.jsx           # Resident registration page
        │   ├── categories/
        │   │   └── CategoriesPage.jsx         # Service categories management (Admin/Dispatcher)
        │   ├── customers/
        │   │   └── CustomersPage.jsx          # Resident directory view & creation
        │   ├── dashboard/
        │   │   └── DashboardPage.jsx          # Operations KPI dashboard & live queue
        │   ├── landing/
        │   │   └── LandingPage.jsx            # Public marketing / landing view
        │   ├── routing/
        │   │   └── RoutingMonitorPage.jsx     # Live routing diagnostics & expired offer scanner
        │   ├── technician/
        │   │   └── TechnicianPortalPage.jsx   # Specialist field portal ("My Jobs", Offers, History)
        │   ├── technicians/
        │   │   ├── TechnicianCapacityPage.jsx # Technician capacity & zone management
        │   │   └── TechnicianFormModal.jsx    # Create/edit technician modal
        │   └── tickets/
        │       ├── CreateTicketPage.jsx       # Resident service request submission
        │       ├── TicketDetailPage.jsx       # Complete ticket overview, execution & resolution
        │       └── TicketListPage.jsx         # Ticket hub table with status & priority filtering
        │
        └── styles/                            # Design Tokens & Theming
            ├── theme.css                      # Modern CSS custom properties, utility classes, animations
            └── variables.css                  # Color palettes, spacing scales, elevation shadows
```

---

# 5. SYSTEM ARCHITECTURE

## 5.1 Architecture Diagram

```text
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                               BROWSER CLIENT                                  │
 │                                                                               │
 │   React 19 SPA (Vite 6)                                                       │
 │   ├── Context Layer: AuthContext (JWT State), ToastContext                    │
 │   ├── Component Layer: Operations Dashboard, Specialist Portal, Ticket Hub   │
 │   └── API Client: fetch wrapper + 401 JWT Auto-Refresh Interceptor            │
 └──────────────────────────────────────┬────────────────────────────────────────┘
                                        │ HTTP / JSON (Bearer JWT Token)
                                        │ Base URL: /api/v1
                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                           FASTAPI APPLICATION LAYER                           │
 │                                                                               │
 │   main.py (App Factory & Async Lifespan)                                      │
 │   ├── Global Exception Handler (AppException -> 400/404/409, 500 fallback)    │
 │   ├── Dependency Injection (get_db, get_current_user, require_roles)          │
 │   └── Central APIRouter (/api/v1)                                             │
 │       ├── /auth          -> auth.py (Login, Register, Refresh, Me, OAuth)     │
 │       ├── /tickets       -> tickets.py (CRUD, Arrive, Start, Complete, Verify)│
 │       ├── /assignments   -> assignments.py (Accept, Decline, Defer, Expire)   │
 │       ├── /technicians   -> technicians.py (Capacity, Zones, Skills, Shifts)  │
 │       ├── /categories    -> service_categories.py (Active Service Taxonomy)   │
 │       ├── /customers     -> customers.py (Resident Profiles & Locations)      │
 │       └── /health        -> health.py (Readiness Probe)                       │
 └──────────────────────┬───────────────────────────────┬────────────────────────┘
                        │                               │
                        ▼                               ▼
 ┌──────────────────────────────┐              ┌────────────────────────────────┐
 │     CORE & SECURITY LAYER    │              │    DOMAIN SERVICES & LOGIC     │
 │                              │              │                                │
 │  • config.py (BaseSettings)  │              │  • ticket_service.py           │
 │  • security.py (Bcrypt, JWT) │              │  • assignment_service.py       │
 │  • logging.py                │              │  • execution_service.py        │
 │  • exceptions.py             │              │  • resolution_service.py       │
 └──────────────────────────────┘              │  • auth_service.py             │
                                               └───────────────┬────────────────┘
                                                               │
                                                               ▼
                                               ┌────────────────────────────────┐
                                               │   DETERMINISTIC ROUTING ENGINE │
                                               │                                │
                                               │  • eligibility.py (4 checks)   │
                                               │  • scoring.py (5 factors/100pt)│
                                               │  • ranking.py (Tie-breaker)    │
                                               │  • constants.py (Weights)      │
                                               └───────────────┬────────────────┘
                                                               │
                                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                       DATA ACCESS & ORM PERSISTENCE                           │
 │                                                                               │
 │   SQLAlchemy 2.0 (Mapped Column Type Annotations)                             │
 │   ├── session.py (Engine, pool_pre_ping=True, SessionFactory, get_db)         │
 │   ├── Declarative Models: User, Customer, Technician, ServiceCategory,        │
 │   │                       Ticket, TechnicianAssignment, Feedback, History     │
 │   └── Migrations: Alembic Revisions (0001 -> 0005)                            │
 └──────────────────────────────────────┬────────────────────────────────────────┘
                                        │ Psycopg 3 Driver (psycopg_binary)
                                        │ PostgreSQL Protocol (Port 5432)
                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────────┐
 │                         POSTGRESQL RELATIONAL DATABASE                        │
 │                                                                               │
 │   Relational Tables with Foreign Keys, Unique Indexes, Check Constraints:     │
 │   • users, customers, technicians, service_categories                         │
 │   • technician_service_categories (m2m)                                       │
 │   • tickets, technician_assignments, ticket_feedbacks                         │
 │   • customer_technician_history                                               │
 └───────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Layered System Design & Data Flow

1. **Client Interaction Layer**: The user interacts with the React 19 SPA. When an action is triggered (e.g., clicking "Accept Offer"), the client sends an HTTP `POST` request with the `Authorization: Bearer <token>` header to the FastAPI backend.
2. **API & Routing Layer**: FastAPI matches the request to the route controller in `backend/src/smart_helpdesk/api/routes/assignments.py`. Dependency injection runs `get_db` to allocate an isolated database session and `get_current_user` to authenticate the user and check role permissions.
3. **Domain Service Layer**: The route handler delegates execution to `assignment_service.accept_assignment()`. The service validates domain business rules (e.g., offer has not expired, technician matches recipient), updates the assignment status to `ACCEPTED`, updates the ticket status to `ASSIGNED`, and increments the technician's `current_workload` by 1.
4. **Data Persistence Layer**: The service calls `db.commit()`. SQLAlchemy flushes changes through the Psycopg 3 binary driver to PostgreSQL inside a database transaction.
5. **Response Serialization**: The updated entity is mapped to a Pydantic DTO (`AssignmentActionResponse`) and returned as JSON (`200 OK`) to the React frontend, where UI state updates reactively.

---

# 6. BACKEND ARCHITECTURE DEEP DIVE

## 6.1 Application Entry & Factory Pattern

The backend application is initialized via the factory function `create_app()` in [main.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/main.py).

```python
# File: backend/src/smart_helpdesk/main.py
# Purpose: Application factory and lifespan lifecycle management

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifecycle events: startup and shutdown."""
    setup_logging()
    settings = get_settings()
    logger.info(
        "Starting %s v%s in %s environment (Debug: %s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENVIRONMENT,
        settings.DEBUG,
    )
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Register global exception handlers
    register_exception_handlers(app)

    # Mount central API router with version prefix (/api/v1)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app

app = create_app()
```

**Key Takeaways**:
- Uses modern ASGI `lifespan` context manager rather than deprecated `@app.on_event("startup")`.
- Registers global exception handlers centrally.
- Mounts all API endpoints under `/api/v1`.

## 6.2 Configuration & Settings Management

Configuration is handled by `pydantic_settings.BaseSettings` in [config.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/core/config.py).

```python
# File: backend/src/smart_helpdesk/core/config.py
# Purpose: Environment-driven application settings with LRU caching

class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    APP_NAME: str = "Smart-HelpDesk"
    APP_VERSION: str = "0.1.0"
    APP_ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>"

    # JWT Settings
    JWT_SECRET_KEY: str = "<YOUR_SECURE_JWT_SECRET_KEY>"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth2 Settings
    GOOGLE_CLIENT_ID: str = "<YOUR_GOOGLE_CLIENT_ID>"
    GOOGLE_CLIENT_SECRET: str = "<YOUR_GOOGLE_CLIENT_SECRET>"
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**Key Takeaways**:
- Loads settings from environment or local `.env` file.
- `@lru_cache` ensures configuration is parsed only once across application lifespan.
- Standardizes default token expiry (30 min access, 7 days refresh).

## 6.3 Database Engine & Session Lifecycle

The database connection is managed in [session.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/session.py).

```python
# File: backend/src/smart_helpdesk/db/session.py
# Purpose: Centralized SQLAlchemy engine and session dependency

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

SessionFactory = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding database session and ensuring cleanup."""
    db = SessionFactory()
    try:
        yield db
    finally:
        db.close()
```

**Key Takeaways**:
- `pool_pre_ping=True`: Ensures stale or dropped connections (e.g., after database restart) are tested and transparently recycled.
- `expire_on_commit=False`: Prevents SQLAlchemy from expiring object attributes after `db.commit()`, enabling immediate serialization in route responses.
- `get_db`: Generator dependency cleanly handles `db.close()` in a `finally` block on every HTTP request.

## 6.4 Domain Exception Hierarchy & Error Handling

Domain exceptions are structured in [exceptions.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/core/exceptions.py).

```python
# File: backend/src/smart_helpdesk/core/exceptions.py
# Purpose: Domain exception classes and standardized JSON handlers

class AppException(Exception):
    """Base application domain exception."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class EntityNotFoundError(AppException):
    """Raised when a requested domain entity is not found (404)."""
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class DuplicateEntityError(AppException):
    """Raised when a resource uniqueness constraint is violated (409)."""
    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)

class BusinessRuleError(AppException):
    """Raised when a domain/lifecycle rule is violated (400)."""
    def __init__(self, message: str = "Business rule violation") -> None:
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)
```

**Key Takeaways**:
- Domain logic throws clean exceptions like `EntityNotFoundError` or `BusinessRuleError`.
- Global exception handlers catch these errors and format them into standardized `{ "detail": "error message" }` JSON responses without leaking internal tracebacks.

---

# 7. DATABASE DESIGN & DATA MODELING

## 7.1 Entity-Relationship (ER) Diagram

```text
 ┌──────────────────────┐                       ┌──────────────────────┐
 │        users         │                       │   service_categories │
 ├──────────────────────┤                       ├──────────────────────┤
 │ id (PK, UUID)        │                       │ id (PK, UUID)        │
 │ email (UQ, String)   │                       │ name (UQ, String)    │
 │ hashed_password      │                       │ is_active (Boolean)  │
 │ role (UserRole ENUM) │                       │ created_at / updated │
 │ customer_id (FK) ────┼──────┐                └──────────┬───────────┘
 │ technician_id (FK) ──┼──┐   │                           │
 └──────────────────────┘  │   │                           │
                           │   │                           │
                           │   │       1:N                 │ M:N (technician_service_categories)
                           │   └──────────────┐            │
                           │                  ▼            │
 ┌─────────────────────────┴────┐       ┌──────────────────┴───┐
 │         technicians          │       │      customers       │
 ├──────────────────────────────┤       ├──────────────────────┤
 │ id (PK, UUID)                │       │ id (PK, UUID)        │
 │ full_name (String)           │       │ full_name (String)   │
 │ email (UQ, String)           │       │ email (UQ, String)   │
 │ phone_number (UQ, String)    │       │ phone_number (UQ)    │
 │ is_active / is_on_duty (Bool)│       │ default_location     │
 │ current_zone (String)        │       │ age (Integer)        │
 │ current_workload (Int >= 0)  │       │ is_active (Boolean)  │
 │ max_workload (Int >= 0)      │       └──────────┬───────────┘
 │ overall_rating (Numeric)     │                  │
 │ completed_jobs_count (Int)   │                  │ 1:N
 │ reopened_jobs_count (Int)    │                  │
 └──────────────┬───────────────┘                  ▼
                │ 1:N                   ┌──────────────────────┐
                │                       │       tickets        │
                │                       ├──────────────────────┤
                │                       │ id (PK, UUID)        │
                │                       │ customer_id (FK) ────┼── (Customer)
                │                       │ category_id (FK) ────┼── (Category)
                │                       │ contact_name (String)│
                │                       │ contact_phone        │
                │                       │ description (Text)   │
                │                       │ location (String)    │
                │                       │ status (TicketStatus)│
                │                       │ is_scheduled (Bool)  │
                │                       │ scheduled_for (DT)   │
                │                       └──────────┬───────────┘
                │                                  │
                │                                  │ 1:N
                ▼                                  ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                    technician_assignments                   │
 ├─────────────────────────────────────────────────────────────┤
 │ id (PK, UUID)                                               │
 │ ticket_id (FK -> tickets.id)                                │
 │ technician_id (FK -> technicians.id)                        │
 │ status (AssignmentStatus ENUM: OFFERED, DEFERRED, etc.)     │
 │ assigned_at (DateTime)                                      │
 │ responded_at / accepted_at / declined_at / deferred_at (DT) │
 │ arrived_at / work_started_at / work_completed_at (DateTime) │
 │ decline_reason (String) / decline_note (Text)               │
 │ completion_note (Text)                                      │
 │ expires_at (DateTime, 10-minute window)                     │
 └──────────────────────────────┬──────────────────────────────┘
                                │ 1:1
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      ticket_feedbacks                       │
 ├─────────────────────────────────────────────────────────────┤
 │ id (PK, UUID)                                               │
 │ ticket_id (FK -> tickets.id)                                │
 │ assignment_id (FK, UQ -> technician_assignments.id)         │
 │ customer_id (FK -> customers.id)                            │
 │ technician_id (FK -> technicians.id)                        │
 │ was_issue_resolved (Boolean)                                │
 │ rating (Integer, 1 to 5)                                    │
 │ comment (Text)                                              │
 └─────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────┐
 │                 customer_technician_history                 │
 ├─────────────────────────────────────────────────────────────┤
 │ id (PK, UUID)                                               │
 │ customer_id (FK -> customers.id)                            │
 │ technician_id (FK -> technicians.id)                        │
 │ positive_interactions (Integer >= 0)                        │
 │ negative_interactions (Integer >= 0)                        │
 │ successful_jobs_count (Integer >= 0)                        │
 │ last_interaction_at (DateTime)                              │
 │ Constraint: UQ(customer_id, technician_id)                  │
 └─────────────────────────────────────────────────────────────┘
```

## 7.2 Detailed Database Models & Constraints

### 1. `BaseModel` & Mixins ([models/base.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/base.py))
- **`UUIDMixin`**: Primary key `id: UUID = uuid.uuid4()` generated at the application/database level.
- **`TimestampMixin`**: `created_at` and `updated_at` timestamps stored with explicit timezone (`DateTime(timezone=True)`).
- **`BaseModel`**: Combines `Base`, `UUIDMixin`, and `TimestampMixin` for all entities.

### 2. `Customer` Model ([models/customer.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/customer.py))
- **Table**: `customers`
- **Columns**: `id`, `full_name`, `email` (Unique Index), `phone_number` (Unique Index), `age` (Nullable), `default_location`, `is_active`.
- **Relationships**: `tickets` (1:N), `technician_histories` (1:N), `feedbacks` (1:N).

### 3. `Technician` Model ([models/technician.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/technician.py))
- **Table**: `technicians`
- **Columns**: `id`, `full_name`, `email` (Unique Index), `phone_number` (Unique Index), `is_active`, `is_on_duty`, `current_zone` (e.g., "Tower A"), `current_workload`, `max_workload` (default 5), `overall_rating` (Numeric(3,2)), `rating_sum` (Numeric(10,2)), `rating_count` (Int), `completed_jobs_count` (Int), `reopened_jobs_count` (Int).
- **Check Constraints**:
  - `ck_technicians_current_workload_non_negative`: `current_workload >= 0`
  - `ck_technicians_max_workload_non_negative`: `max_workload >= 0`
  - `ck_technicians_rating_range`: `overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5)`
  - `ck_technicians_completed_jobs_non_negative`: `completed_jobs_count >= 0`
  - `ck_technicians_reopened_jobs_non_negative`: `reopened_jobs_count >= 0`
- **Relationships**: `categories` (M:N via `technician_service_categories`), `assignments` (1:N), `customer_histories` (1:N), `feedbacks` (1:N).

### 4. `ServiceCategory` Model ([models/service_category.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/service_category.py))
- **Table**: `service_categories`
- **Columns**: `id`, `name` (Unique Index), `is_active`.
- **Association Table**: `technician_service_categories` (`technician_id` FK, `category_id` FK).

### 5. `Ticket` Model ([models/ticket.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/ticket.py))
- **Table**: `tickets`
- **Columns**: `id`, `customer_id` (FK to `customers.id`), `category_id` (FK to `service_categories.id`), `contact_name`, `contact_phone`, `description` (Text), `location` (String 500), `preferred_time` (Nullable DT), `status` (Enum `TicketStatus`, default `PENDING`), `is_scheduled` (Bool), `scheduled_for` (Nullable DT).
- **Relationships**: `customer` (N:1), `category` (N:1), `assignments` (1:N, cascade delete), `feedbacks` (1:N).

### 6. `TechnicianAssignment` Model ([models/technician_assignment.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/technician_assignment.py))
- **Table**: `technician_assignments`
- **Columns**: `id`, `ticket_id` (FK), `technician_id` (FK), `status` (Enum `AssignmentStatus`, default `OFFERED`), `assigned_at` (DT), `responded_at` (DT), `accepted_at` (DT), `declined_at` (DT), `deferred_at` (DT), `arrived_at` (DT), `work_started_at` (DT), `work_completed_at` (DT), `decline_reason` (String), `decline_note` (Text), `completion_note` (Text), `expires_at` (DT).
- **Relationships**: `ticket` (N:1), `technician` (N:1), `feedbacks` (1:N).

### 7. `TicketFeedback` Model ([models/ticket_feedback.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/ticket_feedback.py))
- **Table**: `ticket_feedbacks`
- **Columns**: `id`, `ticket_id` (FK), `assignment_id` (FK, Unique), `customer_id` (FK), `technician_id` (FK), `was_issue_resolved` (Bool), `rating` (Integer 1-5), `comment` (Text).
- **Constraints**: `uq_assignment_feedback` (unique per assignment attempt), `ck_feedback_rating_range` (`rating >= 1 AND rating <= 5`).

### 8. `CustomerTechnicianHistory` Model ([models/customer_technician_history.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/customer_technician_history.py))
- **Table**: `customer_technician_history`
- **Columns**: `id`, `customer_id` (FK), `technician_id` (FK), `positive_interactions` (Int), `negative_interactions` (Int), `successful_jobs_count` (Int), `last_interaction_at` (DT).
- **Constraints**: `uq_customer_technician_pair` (Unique pairwise row per Customer + Technician).

### 9. `User` Model ([models/user.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/user.py))
- **Table**: `users`
- **Columns**: `id`, `email` (Unique Index), `hashed_password` (Nullable for pure OAuth), `role` (Enum `UserRole`: `ADMIN`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`), `is_active`, `is_verified`, `oauth_provider` (e.g. "google"), `oauth_id`, `customer_id` (FK, Nullable), `technician_id` (FK, Nullable).
- **Relationships**: `customer` (N:1), `technician` (N:1).

---

# 8. ALEMBIC / DATABASE MIGRATIONS

## 8.1 Migration Strategy & Tooling
Alembic provides programmatic, versioned migrations matching SQLAlchemy models to the underlying PostgreSQL schema.

```text
Migration Flow:
SQLAlchemy Models (db/models/*.py)
       │
       ▼ (alembic revision --autogenerate)
Alembic Script (alembic/versions/*.py)
       │
       ▼ (alembic upgrade head)
PostgreSQL Database Schema
```

## 8.2 Migration History (0001 through 0005)

| Revision ID | Name / File | Key Operations Executed | Introduced For |
|---|---|---|---|
| `0001` | `0001_initial_phase2_schema.py` | Creates `service_categories`, `technicians`, `technician_service_categories`, `customers`, `tickets`, `technician_assignments`, `customer_technician_history`. Sets up constraints & indexes. | Phase 2 ORM Foundation |
| `0002` | `0002_add_technician_current_zone.py` | Adds `current_zone` (VARCHAR(100)) column to `technicians` table. | Phase 4 Location Proximity Scoring |
| `0003` | `0003_add_assignment_deferred_and_decline_note.py` | Adds `deferred_at` (TIMESTAMPTZ) and `decline_note` (TEXT) columns to `technician_assignments`. | Phase 5 "Ask Me Later" & Decline Notes |
| `0004` | `0004_add_service_execution_and_feedback.py` | Adds `arrived_at`, `work_started_at`, `work_completed_at`, `completion_note` to `technician_assignments`. Creates `ticket_feedbacks` table. Adds `rating_sum`, `rating_count` to `technicians`. | Phase 6 Resolution & Feedback Lifecycle |
| `0005` | `0005_add_users_authentication.py` | Creates `userrole` PostgreSQL ENUM and `users` table with `customer_id` and `technician_id` foreign keys. | Multi-Role Authentication & RBAC |

## 8.3 Migration CLI Workflow

```powershell
# Navigate to backend directory
cd backend

# Apply all pending migrations to database
uv run alembic upgrade head

# Rollback single most recent migration
uv run alembic downgrade -1

# Generate a new auto-detected migration revision
uv run alembic revision --autogenerate -m "describe_migration_changes"

# Check current migration revision state
uv run alembic current
```

---

# 9. AUTHENTICATION & SESSION MANAGEMENT

## 9.1 Password Security & Hashing
Passwords are never stored in plaintext. In [security.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/core/security.py), passwords are salted and hashed using Bcrypt:

```python
# File: backend/src/smart_helpdesk/core/security.py
# Purpose: Bcrypt password salting and hash verification

def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt password hash with auto-generated salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False
```

## 9.2 JWT Dual-Token Strategy (Access & Refresh)
Smart-HelpDesk uses a dual-token architecture:
1. **Access Token**: Short-lived (30 minutes), contains user identity, email, role, customer ID, and technician ID. Attached in HTTP headers (`Authorization: Bearer <token>`).
2. **Refresh Token**: Long-lived (7 days), contains subject claim (`sub: user_id`) and token type (`type: "refresh"`). Used to issue a new token pair without re-entering credentials.

```python
# File: backend/src/smart_helpdesk/core/security.py
# Purpose: JWT Token Creation

def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"iat": int(now.timestamp()), "exp": int(expire.timestamp()), "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
```

## 9.3 Token Refresh Flow & Auto-Refresh Interceptor
On the frontend ([client.js](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/api/client.js)), an automatic fetch interceptor intercepts any `401 Unauthorized` response:
1. Catches `401 Unauthorized`.
2. Reads stored `refresh_token` from `localStorage`.
3. Sends `POST /api/v1/auth/refresh` with `{ "refresh_token": "..." }`.
4. Updates `localStorage` with the new access token.
5. Re-executes and resolves the original failed API request transparently without user interruption.
6. If the refresh token is also expired or invalid, it triggers an `auth:expired` event, clears storage, and redirects to `/login`.

## 9.4 Google OAuth2 Integration
The platform supports Google Sign-In via standard OAuth2 Authorization Code flow and Google Identity Services (GSI) One-Tap tokens:
1. `GET /api/v1/auth/oauth/google/url`: Generates consent URL.
2. User authenticates on Google accounts.
3. Google redirects to `/auth/google/callback?code=...`.
4. Frontend sends code/credential to `POST /api/v1/auth/oauth/google/callback`.
5. Backend verifies token with Google API, extracts email & name, links/creates the `Customer` entity and `User` record with `oauth_provider = "google"`, and returns a standard JWT `TokenResponse`.

## 9.5 Session Restoration (`/auth/me`)
When the frontend app launches or refreshes:
1. `AuthContext.jsx` checks for `localStorage.getItem('smart_helpdesk_access_token')`.
2. Calls `GET /api/v1/auth/me`.
3. Backend validates JWT, fetches the user from PostgreSQL, and returns their full profile (`UserResponse`).
4. If token is invalid or expired, the local session is cleared and the user is redirected to `/login`.

---

# 10. ROLE-BASED ACCESS CONTROL (RBAC)

## 10.1 Multi-Role Matrix & Responsibilities

| Role | Main Responsibilities | Accessible Pages | Accessible API Domains |
|---|---|---|---|
| **`ADMIN`** | Platform-wide superuser; manages service taxonomy, technician roster, capacity limits, user accounts, and monitors all ticket lifecycles. | `/dashboard`<br>`/tickets`<br>`/tickets/new`<br>`/tickets/:id`<br>`/technician/jobs`<br>`/technicians`<br>`/routing`<br>`/customers`<br>`/categories` | Complete unrestricted access across all `/api/v1/*` routes. |
| **`DISPATCHER`** | Operations center staff; oversees live ticket queues, monitors technician capacity & zone distribution, previews routing scores, triggers manual dispatch & scans expired offers. | `/dashboard`<br>`/tickets`<br>`/tickets/:id`<br>`/technicians`<br>`/routing`<br>`/customers`<br>`/categories` | `/tickets` (list, get, assign, cancel)<br>`/assignments/process-expired`<br>`/technicians` (list, get, update)<br>`/customers` (list, get, create)<br>`/categories` (list, get, create, update) |
| **`TECHNICIAN`** | Field service specialist; receives 10-minute offer decision cards, toggles on/off duty shift, marks on-site arrival, records work start and completion notes. | `/technician/jobs`<br>`/tickets`<br>`/tickets/:id` | `/assignments/:id/accept`<br>`/assignments/:id/decline`<br>`/assignments/:id/ask-later`<br>`/tickets/:id/arrive`<br>`/tickets/:id/start-work`<br>`/tickets/:id/complete-work`<br>`/technicians/:id` (shift toggle) |
| **`CUSTOMER`** | Resident / apartment occupant; submits maintenance requests (ASAP or scheduled), tracks ticket status progress, and verifies resolution via confirmation & 5-star rating card. | `/tickets`<br>`/tickets/new`<br>`/tickets/:id` | `/tickets` (create, list own, get own, cancel own)<br>`/tickets/:id/customer-response` (verify & rate)<br>`/tickets/:id/feedback-history`<br>`/categories` (list active) |

## 10.2 Backend Authorization Enforcement vs Frontend Route Guarding

> [!IMPORTANT]
> **Security Rule**: Frontend route hiding is **User Experience (UX)**, NOT security.  
> Real security is enforced on the **FastAPI Backend** via dependency injection (`require_roles`, `validate_technician_ownership`, `validate_customer_ownership`).

```python
# File: backend/src/smart_helpdesk/api/dependencies.py
# Purpose: Backend RBAC dependency enforcement

def require_roles(allowed_roles: list[UserRole]) -> Callable[[User], User]:
    """Dependency factory enforcing role-based access control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admins always have full platform permissions
        if current_user.role == UserRole.ADMIN:
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of [{', '.join(r.value for r in allowed_roles)}].",
            )
        return current_user

    return role_checker

require_admin = require_roles([UserRole.ADMIN])
require_admin_or_dispatcher = require_roles([UserRole.ADMIN, UserRole.DISPATCHER])
```

## 10.3 Ownership Validation Logic
When a technician or customer performs an action on a ticket or assignment, the backend ensures they cannot tamper with resources belonging to other users:

```python
# File: backend/src/smart_helpdesk/api/dependencies.py
# Purpose: Ownership validation

def validate_technician_ownership(current_user: User, target_technician_id: uuid.UUID) -> None:
    if current_user.role in (UserRole.ADMIN, UserRole.DISPATCHER):
        return
    if current_user.role == UserRole.TECHNICIAN:
        if not current_user.technician_id or current_user.technician_id != target_technician_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Technicians are only authorized to access and execute their own assignments.",
            )
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")
```

---

# 11. FRONTEND ARCHITECTURE

## 11.1 Component Hierarchy & Tree Structure

```text
index.html
└── main.jsx
    └── App.jsx
        ├── BrowserRouter
        │   ├── AuthProvider (AuthContext)
        │   │   ├── ToastProvider (ToastContext)
        │   │   │   ├── Routes
        │   │   │   │   ├── Public: /login, /register, /auth/google/callback, /
        │   │   │   │   └── Protected: ProtectedRoute
        │   │   │   │       └── AppLayout
        │   │   │   │           ├── Sidebar (Role-filtered navigation + User Badge + Logout)
        │   │   │   │           ├── TopHeader (Current page breadcrumbs + Status indicators)
        │   │   │   │           └── <Outlet /> (Main Page View)
        │   │   │   │               ├── DashboardPage
        │   │   │   │               │   ├── StatTile (Active, Pending, Urgent, Technicians)
        │   │   │   │               │   ├── Ticket Queue Table + StatusBadge
        │   │   │   │               │   └── Specialist Capacity Progress Bars
        │   │   │   │               ├── TicketListPage
        │   │   │   │               ├── CreateTicketPage
        │   │   │   │               ├── TicketDetailPage
        │   │   │   │               │   ├── TicketLifecycleStepper
        │   │   │   │               │   ├── ServiceResolutionCard
        │   │   │   │               │   ├── AssignmentHistoryTimeline
        │   │   │   │               │   ├── FeedbackHistoryCard
        │   │   │   │               │   └── RoutingPreviewModal
        │   │   │   │               ├── TechnicianPortalPage
        │   │   │   │               │   ├── Shift Toggle Button
        │   │   │   │               │   ├── JobOfferCard (with ActiveOfferTimer & DeclineOfferModal)
        │   │   │   │               │   └── ActiveJobExecutionCard (Arrive -> Start -> Complete)
        │   │   │   │               ├── RoutingMonitorPage (with RoutingInspector & CandidateScoreBreakdown)
        │   │   │   │               ├── TechnicianCapacityPage (with TechnicianFormModal)
        │   │   │   │               ├── CategoriesPage
        │   │   │   │               └── CustomersPage
```

## 11.2 Routing & Route Protection Strategy
In [App.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/App.jsx), routes are wrapped in `<ProtectedRoute>`:
- Checks `isAuthenticated`: Redirects unauthenticated users to `/login`.
- Checks `allowedRoles`: Redirects unauthorized roles to their default home view (e.g., Technicians trying to visit `/dashboard` are redirected to `/technician/jobs`; Customers are redirected to `/tickets`).

## 11.3 State Management & Context Providers
- **`AuthContext.jsx`**: Manages `user`, `token`, `isLoading`, `login()`, `register()`, `loginWithOAuth()`, and `logout()`.
- **`ToastContext.jsx`**: Provides `showSuccess(msg)` and `showError(msg)` rendering auto-dismissing toast alerts.
- Local page state is managed via React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) for component encapsulation.

## 11.4 Design System & Vanilla CSS Tokens
The application styling is structured around custom CSS variables in `theme.css` and `variables.css`:
- **Colors**: `--color-primary` (`#1A56DB`), `--color-surface` (`#F9FAFB`), `--color-error` (`#E02424`), `--color-success` (`#0E9F6E`), `--color-warning` (`#D97706`).
- **Badges**: `.sh-badge-pending`, `.sh-badge-routing`, `.sh-badge-assigned`, `.sh-badge-arrived`, `.sh-badge-inprogress`, `.sh-badge-confirmation`, `.sh-badge-closed`, `.sh-badge-reopened`, `.sh-badge-cancelled`.
- **Typography**: Google Fonts Inter & Outfit.

---

# 12. FRONTEND API LAYER

## 12.1 Central Client & Fetch Interceptor
The central API communication engine is located in [frontend/src/api/client.js](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/api/client.js).

```javascript
// File: frontend/src/api/client.js
// Purpose: Unified fetch client with Bearer Auth & 401 Auto-Refresh Interceptor

export const apiClient = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return request(queryString ? `${endpoint}?${queryString}` : endpoint, { method: 'GET' });
  },

  post: (endpoint, body = {}) => request(endpoint, { method: 'POST', body }),
  patch: (endpoint, body = {}) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
```

## 12.2 API Modules & Contract Catalog

| File Path | Methods | Primary Endpoints Called | Purpose |
|---|---|---|---|
| `api/auth.js` | `register`, `login`, `refresh`, `getMe`, `logout`, `getGoogleAuthUrl`, `googleCallback` | `POST /auth/register`<br>`POST /auth/login`<br>`POST /auth/refresh`<br>`GET /auth/me`<br>`POST /auth/logout`<br>`GET /auth/oauth/google/url`<br>`POST /auth/oauth/google/callback` | Authentication, token renewal, session retrieval, Google OAuth. |
| `api/tickets.js` | `list`, `getById`, `create`, `update`, `cancel`, `getStatus`, `getFeedbacks`, `submitCustomerResponse`, `markArrived`, `startWork`, `completeWork` | `GET /tickets`<br>`GET /tickets/:id`<br>`POST /tickets`<br>`PATCH /tickets/:id`<br>`POST /tickets/:id/cancel`<br>`GET /tickets/:id/status`<br>`GET /tickets/:id/feedback-history`<br>`POST /tickets/:id/customer-response`<br>`POST /tickets/:id/arrive`<br>`POST /tickets/:id/start-work`<br>`POST /tickets/:id/complete-work` | Ticket CRUD, execution milestones, customer verification responses. |
| `api/assignments.js` | `startAssignment`, `listByTicket`, `getActiveForTicket`, `accept`, `decline`, `defer`, `processExpired` | `POST /tickets/:id/assign`<br>`GET /tickets/:id/assignments`<br>`POST /assignments/:id/accept`<br>`POST /assignments/:id/decline`<br>`POST /assignments/:id/ask-later`<br>`POST /assignments/process-expired` | Assignment offer creation, specialist responses, expired offer scanning. |
| `api/technicians.js` | `list`, `getById`, `create`, `update` | `GET /technicians`<br>`GET /technicians/:id`<br>`POST /technicians`<br>`PATCH /technicians/:id` | Technician roster, skill category mapping, shift/duty status updates. |
| `api/categories.js` | `list`, `getById`, `create`, `update` | `GET /categories`<br>`GET /categories/:id`<br>`POST /categories`<br>`PATCH /categories/:id` | Service categories management & active status toggling. |
| `api/customers.js` | `list`, `getById`, `create`, `update` | `GET /customers`<br>`GET /customers/:id`<br>`POST /customers`<br>`PATCH /customers/:id` | Resident profiles & location management. |
| `api/routing.js` | `previewRouting` | `GET /tickets/:id/routing-preview` | Read-only deterministic candidate scoring & ranking evaluation. |

---

# 13. CUSTOMER JOURNEY — COMPLETE WALKTHROUGH

How a **CUSTOMER / RESIDENT** uses the system end-to-end:

1. **Access & Login**:
   - URL: `/login` (or `/register` for new residents).
   - Click `[ 👤 Resident ]` preset (`resident.alice@smarthelpdesk.com` / `ResidentPass123!`).
   - Lands on `/tickets` ("My Tickets").
2. **Create Service Request**:
   - URL: `/tickets/new`.
   - Contact name, phone, and default location ("Tower A, Apt 402") auto-fill from user profile.
   - Selects Category (e.g., `Plumbing`).
   - Chooses Timing: `ASAP` or `Scheduled` (future datetime).
   - Enters detailed description (e.g., *"Kitchen sink drain is clogged and backing up"*).
   - Submits form $\rightarrow$ Sends `POST /api/v1/tickets`.
   - Ticket created in `PENDING` status. If auto-dispatch was active, immediately calls `POST /api/v1/tickets/{id}/assign` to dispatch an offer to the top-ranked plumber.
3. **Track Ticket Progress**:
   - URL: `/tickets/:id`.
   - Resident views `TicketLifecycleStepper` indicating current milestone (`Request Received` $\rightarrow$ `Finding Specialist` $\rightarrow$ `Specialist Assigned` $\rightarrow$ `Specialist on Site` $\rightarrow$ `Work in Progress` $\rightarrow$ `Waiting for Confirmation`).
4. **Receive Resolution Confirmation Request**:
   - Once the technician completes work, ticket status transitions to `AWAITING_CUSTOMER_CONFIRMATION`.
   - `ServiceResolutionCard` appears at the top of the ticket page.
5. **Confirm or Reject Resolution**:
   - **Path A (Issue Resolved)**: Selects "Yes, Issue is Resolved", provides a 5-star rating and comment $\rightarrow$ Submits `POST /api/v1/tickets/{id}/customer-response`. Ticket moves to `CLOSED`.
   - **Path B (Issue Unresolved)**: Selects "No, Issue Unresolved", provides explanation $\rightarrow$ Submits `POST /api/v1/tickets/{id}/customer-response`. Ticket moves to `REOPENED` and automatically reroutes to an alternative specialist.

---

# 14. TECHNICIAN JOURNEY — COMPLETE WALKTHROUGH

How a **TECHNICIAN** uses the system end-to-end:

1. **Access & Login**:
   - URL: `/login`.
   - Click `[ 🔧 Technician ]` preset (`tech.ravi@smarthelpdesk.com` / `TechPass123!`).
   - Automatically lands on `/technician/jobs` ("My Field Jobs").
2. **Toggle Shift Status**:
   - Switches "On Duty" toggle in the portal header $\rightarrow$ Sends `PATCH /api/v1/technicians/{id}` with `{ "is_on_duty": true }`.
   - Technician is now eligible for deterministic dispatch.
3. **Receive 10-Minute Assignment Offer**:
   - `JobOfferCard` appears with live countdown timer (`ActiveOfferTimer`) showing remaining minutes/seconds.
   - Shows problem description, category badge, and resident location ("Tower A, Apt 402").
4. **Offer Decision Options**:
   - **Option A (Accept)**: Clicks `Accept Offer` $\rightarrow$ `POST /api/v1/assignments/{id}/accept`. Ticket transitions to `ASSIGNED`. Technician's workload increases by 1.
   - **Option B (Decline)**: Clicks `Decline...`, selects controlled reason (e.g., `BUSY`) $\rightarrow$ `POST /api/v1/assignments/{id}/decline`. System immediately reroutes ticket to the #2 ranked technician.
   - **Option C (Ask Later)**: Clicks `Ask Me Later` $\rightarrow$ `POST /api/v1/assignments/{id}/ask-later`. Offer stays active until the original 10-minute deadline expires.
5. **Execute On-Site Service**:
   - On acceptance, `ActiveJobExecutionCard` renders on `/technician/jobs`.
   - **Step 1 — Arrive**: Clicks `Mark Arrived on Site` $\rightarrow$ `POST /api/v1/tickets/{id}/arrive`. Ticket transitions to `ARRIVED`.
   - **Step 2 — Start Work**: Clicks `Start Working` $\rightarrow$ `POST /api/v1/tickets/{id}/start-work`. Ticket transitions to `IN_PROGRESS`.
   - **Step 3 — Complete Work**: Clicks `Complete Service...`, enters work summary notes $\rightarrow$ `POST /api/v1/tickets/{id}/complete-work`. Ticket transitions to `AWAITING_CUSTOMER_CONFIRMATION`.
6. **Workload Release**:
   - Workload remains active until the resident confirms resolution, preventing technicians from taking excess concurrent jobs before verification.

---

# 15. DISPATCHER JOURNEY — OPERATIONS HUB WALKTHROUGH

How a **DISPATCHER** oversees operations:

1. **Operations Dashboard (`/dashboard`)**:
   - Views real-time KPI metrics: Active Ticket Queue, Pending Dispatch, Emergency/Urgent Count, On-Duty Specialists.
   - Live Operations Queue table displays all active tickets with priority badges and category tags.
   - Specialist Capacity Gauges show current vs maximum workload bars for all active technicians.
2. **Expired Offers Scanner**:
   - Clicks `[ Scan Expired Offers ]` button $\rightarrow$ Calls `POST /api/v1/assignments/process-expired`.
   - Scans database for any offers exceeding the 10-minute window, marks them `EXPIRED`, and triggers automatic fallback dispatch.
3. **Routing Engine Monitor (`/routing`)**:
   - Inspects candidate ranking and 5-factor scoring breakdowns for any ticket.
   - Evaluates exclusion reasons (e.g., technician off duty or workload limit reached).
4. **Master Entity Supervision**:
   - Accesses `/technicians` to adjust capacity limits or reassign zones.
   - Accesses `/categories` to activate or deactivate service domains.
   - Accesses `/customers` to look up resident contact details and apartment locations.

---

# 16. ADMIN JOURNEY — SYSTEM MANAGEMENT WALKTHROUGH

The **ADMINISTRATOR** possesses unrestricted global permissions:
- Access to all operations dashboards, dispatcher tools, and technician portals.
- Full CRUD permissions on master entities (`/technicians`, `/categories`, `/customers`, `/tickets`).
- Can manage service categories, adjust technician skill associations, create resident accounts, and manually override ticket lifecycles.

---

# 17. TICKET LIFECYCLE

## 17.1 Ticket Status State Machine

```text
                     ┌──────────────────┐
                     │     PENDING      │ ◄────────────────────────┐
                     └────────┬─────────┘                          │
                              │ Start Assignment                   │
                              ▼                                    │
                     ┌──────────────────┐                          │
                     │     ROUTING      │                          │
                     └────────┬─────────┘                          │
                              │ Technician Accepts Offer           │
                              ▼                                    │
                     ┌──────────────────┐                          │
                     │     ASSIGNED     │                          │
                     └────────┬─────────┘                          │
                              │ Technician Marks Arrival           │
                              ▼                                    │
                     ┌──────────────────┐                          │
                     │     ARRIVED      │                          │
                     └────────┬─────────┘                          │
                              │ Technician Starts Work             │
                              ▼                                    │
                     ┌──────────────────┐                          │
                     │   IN_PROGRESS    │                          │
                     └────────┬─────────┘                          │
                              │ Technician Completes Work          │
                              ▼                                    │
             ┌──────────────────────────────────┐                  │
             │  AWAITING_CUSTOMER_CONFIRMATION  │                  │
             └────────┬─────────────────┬───────┘                  │
                      │                 │                          │
 Customer: "Resolved" │                 │ Customer: "Unresolved"   │
                      ▼                 ▼                          │
             ┌────────────────┐ ┌────────────────┐                 │
             │     CLOSED     │ │    REOPENED    │ ────────────────┘
             │  (or RESOLVED) │ └────────────────┘ (Triggers Fallback)
             └────────────────┘
```

## 17.2 Status Transitions & Trigger Matrix

| Status | Meaning | Entered When | Actor | Next Allowed States |
|---|---|---|---|---|
| `PENDING` | Ticket created, awaiting initial dispatch offer. | Resident creates ticket, or fallback finds no available technician. | Customer / System | `ROUTING`, `CANCELLED` |
| `ROUTING` | Active assignment offer dispatched to candidate technician. | Dispatcher triggers assignment or auto-dispatch runs. | Dispatcher / System | `ASSIGNED`, `PENDING` |
| `ASSIGNED` | Technician accepted offer and is allocated to job. | Technician clicks "Accept Offer". | Technician | `ARRIVED` |
| `ARRIVED` | Technician is physically present on-site. | Technician clicks "Mark Arrived on Site". | Technician | `IN_PROGRESS` |
| `IN_PROGRESS` | Technician is actively performing repair/service. | Technician clicks "Start Work". | Technician | `AWAITING_CUSTOMER_CONFIRMATION` |
| `AWAITING_CUSTOMER_CONFIRMATION` | Technician finished work; awaiting resident verification. | Technician clicks "Complete Work" with notes. | Technician | `CLOSED`, `RESOLVED`, `REOPENED` |
| `RESOLVED` / `CLOSED` | Service verified and finalized. Workload released. | Resident confirms "Issue Resolved" + rating. | Customer | *Terminal State* |
| `REOPENED` | Resident confirmed issue was NOT fixed. | Resident selects "Issue Unresolved". | Customer | `ROUTING`, `PENDING` |
| `CANCELLED` | Pre-assignment service request aborted. | Resident or Dispatcher cancels pending ticket. | Customer / Admin | *Terminal State* |

---

# 18. ASSIGNMENT LIFECYCLE

## 18.1 Assignment Status State Machine

```text
                         ┌───────────────────┐
                         │      OFFERED      │
                         └───────┬───┬───┬───┘
               ┌─────────────────┘   │   └────────────────┐
               │ Defer (Ask Later)   │ Accept             │ Decline / Expire
               ▼                     ▼                    ▼
     ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
     │     DEFERRED      │ │     ACCEPTED      │ │ DECLINED / EXPIRED│
     └─────────┬─────────┘ └─────────┬─────────┘ └───────────────────┘
               │ Accept              │ Complete Work & Resident Confirmation
               ▼                     ▼
     ┌───────────────────┐ ┌───────────────────┐
     │     ACCEPTED      │ │     COMPLETED     │
     └───────────────────┘ └───────────────────┘
```

## 18.2 Distinction: Ticket Status vs Assignment Status

| Dimension | `TicketStatus` | `AssignmentStatus` |
|---|---|---|
| **What it Represents** | The macro lifecycle and service state of the resident's issue. | The micro lifecycle of an individual technician dispatch offer attempt. |
| **Cardinality** | Exactly **1 status per Ticket** at any given moment. | **Multiple historical attempts (1:N)** per Ticket. |
| **Examples** | `PENDING`, `ROUTING`, `ASSIGNED`, `IN_PROGRESS`, `CLOSED` | `OFFERED`, `DEFERRED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `COMPLETED` |
| **Example Scenario** | Ticket stays in `ROUTING` while Assignment #1 is `DECLINED` and Assignment #2 is created as `OFFERED`. |

---

# 19. DETERMINISTIC ROUTING ENGINE

The routing engine evaluates real-time data deterministically across two phases: **Eligibility Filtering** and **Multi-Factor Scoring & Ranking**.

## 19.1 Mandatory Eligibility Rules (Phase 4 Filter)
In [eligibility.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/eligibility.py), a technician must satisfy **ALL 4 mandatory rules**:

```python
# File: backend/src/smart_helpdesk/routing/eligibility.py

def evaluate_technician_eligibility(
    technician: Technician,
    required_category_id: uuid.UUID,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []

    # Rule 1: Active status check
    if not technician.is_active:
        reasons.append(ExclusionReason.TECHNICIAN_INACTIVE.value)

    # Rule 2: On-duty shift check
    if not technician.is_on_duty:
        reasons.append(ExclusionReason.TECHNICIAN_OFF_DUTY.value)

    # Rule 3: Category / skill match check
    supported_category_ids = {c.id for c in technician.categories}
    if required_category_id not in supported_category_ids:
        reasons.append(ExclusionReason.CATEGORY_NOT_SUPPORTED.value)

    # Rule 4: Workload capacity check
    if technician.current_workload >= technician.max_workload:
        reasons.append(ExclusionReason.WORKLOAD_LIMIT_REACHED.value)

    return len(reasons) == 0, reasons
```

## 19.2 Multi-Factor 100-Point Scoring Model
In [scoring.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/scoring.py), eligible candidates are scored out of 100.0 points:

$$\text{Total Score} = S_{\text{location}} + S_{\text{rating}} + S_{\text{history}} + S_{\text{reopen}} + S_{\text{workload}}$$

| Factor | Weight | Formula / Logic | Neutral Prior (Fairness) |
|---|---|---|---|
| **Location / Zone Match** | **20.0 pts** | Same zone / substring match = `1.0` (20 pts); Common complex prefix = `0.5` (10 pts); Different zone = `0.2` (4 pts). | Unspecified = `0.5` (10 pts) |
| **Overall Star Rating** | **25.0 pts** | $\frac{\text{overall\_rating}}{5.0} \times 25.0$ pts | New technician (no ratings) = `3.5 / 5.0` (17.5 pts) |
| **Customer-Technician History** | **25.0 pts** | Pairwise affinity: $0.50 + (\text{positive} - \text{negative}) \times 0.15$, clamped $[0.0, 1.0] \times 25.0$ pts | No previous interactions = `0.50` (12.5 pts) |
| **Reliability / First-Time Fix** | **15.0 pts** | $(1.0 - \frac{\text{reopened\_jobs}}{\text{completed\_jobs}}) \times 15.0$ pts | 0 completed jobs = `0.70` (10.5 pts) |
| **Workload Capacity** | **15.0 pts** | $(1.0 - \frac{\text{current\_workload}}{\text{max\_workload}}) \times 15.0$ pts | Lower utilization yields higher points |

## 19.3 Mathematical Formulas & Neutral Priors
Neutral priors prevent new technicians or residents without past history from being unfairly penalized with zero points.

```python
# File: backend/src/smart_helpdesk/routing/scoring.py

def calculate_candidate_score(
    technician: Technician,
    ticket_location: str,
    history: CustomerTechnicianHistory | None,
) -> tuple[float, ScoreBreakdown]:
    norm_location = compute_location_score(ticket_location, technician.current_zone)
    norm_rating = compute_rating_score(technician.overall_rating)
    norm_history = compute_history_score(history)
    norm_reopen = compute_reopen_score(technician.completed_jobs_count, technician.reopened_jobs_count)
    norm_workload = compute_workload_score(technician.current_workload, technician.max_workload)

    loc_pts = round(norm_location * 20.0, 2)
    rate_pts = round(norm_rating * 25.0, 2)
    hist_pts = round(norm_history * 25.0, 2)
    reopen_pts = round(norm_reopen * 15.0, 2)
    workload_pts = round(norm_workload * 15.0, 2)

    total_score = round(loc_pts + rate_pts + hist_pts + reopen_pts + workload_pts, 2)
    breakdown = ScoreBreakdown(
        location=loc_pts,
        rating=rate_pts,
        customer_history=hist_pts,
        reopen_rate=reopen_pts,
        workload=workload_pts,
    )
    return total_score, breakdown
```

## 19.4 Deterministic Ranking & Tie-Breaking Hierarchy
In [ranking.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/ranking.py), candidates are sorted using a multi-attribute sorting key:

```python
# File: backend/src/smart_helpdesk/routing/ranking.py
# Deterministic Tie-Breaking Sort Key

scored_candidates.sort(
    key=lambda item: (
        -item[0],             # 1. Total score descending
        -item[1].location,    # 2. Location points descending
        -item[1].rating,      # 3. Overall rating points descending
        -item[1].workload,    # 4. Workload capacity points descending
        str(item[2].id),      # 5. Stable UUID string ascending
    )
)
```

**Why this is essential**: Two technicians with identical total scores will always resolve in the exact same rank order, preventing non-deterministic behavior across server instances.

---

# 20. FALLBACK REROUTING ENGINE

## 20.1 Fallback Trigger Scenarios
Fallback rerouting is automatically triggered whenever an assignment attempt fails:
1. **Technician Declines**: Calls `POST /assignments/{id}/decline`.
2. **Offer Timeout (10 Minutes Exceeded)**: Batch processor or on-demand scan calls `POST /assignments/process-expired`.
3. **Customer Reports Unresolved (Reopen)**: Calls `POST /tickets/{id}/customer-response` with `was_issue_resolved: false`.

## 20.2 Dynamic Exclusion & Loop Prevention
In [assignment_service.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/services/assignment_service.py), `reroute_ticket()` guarantees loop prevention:

```python
# File: backend/src/smart_helpdesk/services/assignment_service.py

def reroute_ticket(db: Session, ticket_id: uuid.UUID) -> tuple[TechnicianAssignment | None, FallbackSummary]:
    ticket = db.get(Ticket, ticket_id)

    # 1. Query all previously attempted technicians for this ticket
    past_assignments = db.execute(
        select(TechnicianAssignment).where(TechnicianAssignment.ticket_id == ticket_id)
    ).scalars().all()
    attempted_technician_ids = {a.technician_id for a in past_assignments}

    # 2. Exclude attempted technicians from the candidate pool
    all_technicians = db.execute(select(Technician).options(selectinload(Technician.categories))).scalars().all()
    candidate_pool = [t for t in all_technicians if t.id not in attempted_technician_ids]

    # 3. Evaluate eligibility and rank remaining pool against live state
    eligible, _ = filter_eligible_technicians(candidate_pool, ticket.category_id)
    if not eligible:
        ticket.status = TicketStatus.PENDING
        db.commit()
        return None, FallbackSummary(status="NO_ELIGIBLE_TECHNICIAN_AVAILABLE")

    # 4. Score and dispatch offer to top remaining candidate
    ranked, recommended = rank_eligible_technicians(eligible, ticket.location, histories_by_tech_id)
    # Creates new TechnicianAssignment(status=OFFERED, expires_at=now + 10m)
```

---

# 21. RESOLUTION & REOPENING WORKFLOWS

## 21.1 Technician Completion Note & Confirmation Gate
When a technician finishes work, they submit `complete_technician_work()`.
- Records `work_completed_at` timestamp and `completion_note`.
- Ticket status moves to `AWAITING_CUSTOMER_CONFIRMATION`.
- **Crucial Rule**: The technician's workload is **NOT** decremented yet, preventing early job over-allocation before verification.

## 21.2 Positive Confirmation (Closure & Feedback)
When the resident submits `was_issue_resolved: true`:
1. Creates `TicketFeedback` record (`rating`, `comment`).
2. Updates `CustomerTechnicianHistory` (`successful_jobs_count += 1`, `positive_interactions += 1`).
3. Updates `Technician` aggregates (`completed_jobs_count += 1`, recalculates `overall_rating`).
4. Decrements technician workload (`current_workload = max(0, current_workload - 1)`).
5. Sets `assignment.status = COMPLETED`.
6. Sets `ticket.status = CLOSED`.

## 21.3 Negative Confirmation (Reopening & Immediate Rerouting)
When the resident submits `was_issue_resolved: false`:
1. Creates `TicketFeedback` record with negative sentiment.
2. Updates `CustomerTechnicianHistory` (`negative_interactions += 1`).
3. Increments `technician.reopened_jobs_count += 1` and releases their workload (-1).
4. Marks previous assignment as `COMPLETED`.
5. Sets `ticket.status = REOPENED`.
6. Immediately calls `reroute_ticket()` to dispatch an offer to an alternative specialist.

---

# 22. COMPLETE API REFERENCE CATALOG

| Domain | Method | Endpoint | Purpose | Role Authorization | Request Payload | Response Schema |
|---|---|---|---|---|---|---|
| **Health** | `GET` | `/health` | Service health probe | Public | None | `{"status": "healthy"}` |
| **Auth** | `POST` | `/auth/register` | Register new resident account | Public | `UserRegisterRequest` | `UserResponse` (201) |
| **Auth** | `POST` | `/auth/login` | Authenticate with credentials | Public | `UserLoginRequest` | `TokenResponse` (200) |
| **Auth** | `POST` | `/auth/refresh` | Refresh access token | Public | `RefreshTokenRequest` | `TokenResponse` (200) |
| **Auth** | `GET` | `/auth/me` | Fetch authenticated profile | Authenticated | None | `UserResponse` (200) |
| **Auth** | `POST` | `/auth/logout` | Terminate session | Authenticated | None | `{"message": "Logged out"}` |
| **Auth** | `GET` | `/auth/oauth/google/url`| Get Google consent URL | Public | None | `OAuthUrlResponse` (200) |
| **Auth** | `POST` | `/auth/oauth/google/callback`| Process Google OAuth token | Public | `OAuthCallbackRequest` | `TokenResponse` (200) |
| **Tickets** | `POST` | `/tickets` | Create service ticket | Customer / Admin | `TicketCreate` | `TicketResponse` (201) |
| **Tickets** | `GET` | `/tickets` | List tickets with filters | Authenticated | Query Params (`customer_id`, `status`, etc.) | `list[TicketResponse]` (200) |
| **Tickets** | `GET` | `/tickets/{id}` | Get ticket details | Authenticated | None | `TicketResponse` (200) |
| **Tickets** | `PATCH` | `/tickets/{id}` | Partial update pending ticket | Customer / Admin | `TicketUpdate` | `TicketResponse` (200) |
| **Tickets** | `POST` | `/tickets/{id}/cancel` | Cancel pending ticket | Customer / Admin | None | `TicketResponse` (200) |
| **Tickets** | `GET` | `/tickets/{id}/status` | Poll lightweight status | Authenticated | None | `TicketStatusResponse` (200) |
| **Tickets** | `GET` | `/tickets/{id}/routing-preview`| Read-only routing evaluation | Dispatcher / Admin | None | `RoutingPreviewResponse` (200) |
| **Tickets** | `POST` | `/tickets/{id}/assign` | Start ticket dispatch offer | Dispatcher / Admin | None | `AssignmentActionResponse` (200) |
| **Tickets** | `GET` | `/tickets/{id}/assignments` | List assignment history | Authenticated | None | `list[AssignmentResponse]` (200) |
| **Tickets** | `POST` | `/tickets/{id}/arrive` | Mark technician arrival | Technician / Admin | Query `technician_id` | `ExecutionActionResponse` (200) |
| **Tickets** | `POST` | `/tickets/{id}/start-work` | Start active service work | Technician / Admin | Query `technician_id` | `ExecutionActionResponse` (200) |
| **Tickets** | `POST` | `/tickets/{id}/complete-work` | Complete work with notes | Technician / Admin | `CompleteWorkRequest` | `ExecutionActionResponse` (200) |
| **Tickets** | `POST` | `/tickets/{id}/customer-response` | Submit resolution response & rating | Customer / Admin | `CustomerResponseRequest` | `ResolutionResponse` (200) |
| **Tickets** | `GET` | `/tickets/{id}/feedback-history`| List ticket feedback records | Authenticated | None | `list[TicketFeedbackResponse]` (200) |
| **Assignments** | `POST` | `/assignments/{id}/accept` | Accept assignment offer | Technician / Admin | Query `technician_id` | `AssignmentActionResponse` (200) |
| **Assignments** | `POST` | `/assignments/{id}/decline` | Decline offer & trigger fallback | Technician / Admin | `DeclineRequest` | `AssignmentActionResponse` (200) |
| **Assignments** | `POST` | `/assignments/{id}/ask-later` | Defer offer (Ask Later) | Technician / Admin | Query `technician_id` | `AssignmentActionResponse` (200) |
| **Assignments** | `POST` | `/assignments/process-expired` | Process expired offers batch | Dispatcher / Admin | None | `ExpiredProcessingResponse` (200) |
| **Technicians** | `GET` | `/technicians` | List technicians & workload | Authenticated | Query Params (`is_on_duty`, `category_id`, etc.) | `list[TechnicianResponse]` (200) |
| **Technicians** | `GET` | `/technicians/{id}` | Get technician details | Authenticated | None | `TechnicianResponse` (200) |
| **Technicians** | `POST` | `/technicians` | Create technician & skills | Admin / Dispatcher | `TechnicianCreate` | `TechnicianResponse` (201) |
| **Technicians** | `PATCH` | `/technicians/{id}` | Update capacity, zone, shift | Admin / Dispatcher / Tech | `TechnicianUpdate` | `TechnicianResponse` (200) |
| **Categories** | `GET` | `/categories` | List service categories | Authenticated | Query `is_active` | `list[ServiceCategoryResponse]` (200) |
| **Categories** | `POST` | `/categories` | Create service category | Admin / Dispatcher | `ServiceCategoryCreate` | `ServiceCategoryResponse` (201) |
| **Categories** | `PATCH` | `/categories/{id}` | Update category status | Admin / Dispatcher | `ServiceCategoryUpdate` | `ServiceCategoryResponse` (200) |
| **Customers** | `GET` | `/customers` | List resident directory | Admin / Dispatcher | Query `skip`, `limit` | `list[CustomerResponse]` (200) |
| **Customers** | `POST` | `/customers` | Create customer record | Admin / Dispatcher | `CustomerCreate` | `CustomerResponse` (201) |
| **Customers** | `PATCH` | `/customers/{id}` | Update resident details | Admin / Dispatcher / Cust | `CustomerUpdate` | `CustomerResponse` (200) |

---

# 23. IMPORTANT CODE MAP

Use this quick-lookup table to find the exact file and symbol in the repository:

| Concept / Workflow | Repository File Path | Key Function, Class, or Hook |
|---|---|---|
| **FastAPI Startup & Lifespan** | [backend/src/smart_helpdesk/main.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/main.py) | `create_app()`, `lifespan()` |
| **Configuration Settings** | [backend/src/smart_helpdesk/core/config.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/core/config.py) | `Settings`, `get_settings()` |
| **Database Session Factory** | [backend/src/smart_helpdesk/db/session.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/session.py) | `get_db()`, `engine`, `SessionFactory` |
| **User & RBAC Model** | [backend/src/smart_helpdesk/db/models/user.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/user.py) | `User`, `UserRole` |
| **Ticket Model** | [backend/src/smart_helpdesk/db/models/ticket.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/ticket.py) | `Ticket`, `TicketStatus` |
| **Assignment Model** | [backend/src/smart_helpdesk/db/models/technician_assignment.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/models/technician_assignment.py) | `TechnicianAssignment`, `AssignmentStatus` |
| **Auth Dependency & RBAC** | [backend/src/smart_helpdesk/api/dependencies.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/api/dependencies.py) | `get_current_user()`, `require_roles()` |
| **Bcrypt & JWT Security** | [backend/src/smart_helpdesk/core/security.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/core/security.py) | `get_password_hash()`, `create_access_token()` |
| **Routing Eligibility Filter** | [backend/src/smart_helpdesk/routing/eligibility.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/eligibility.py) | `filter_eligible_technicians()` |
| **Routing Scoring Formulas** | [backend/src/smart_helpdesk/routing/scoring.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/scoring.py) | `calculate_candidate_score()` |
| **Deterministic Ranking** | [backend/src/smart_helpdesk/routing/ranking.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/routing/ranking.py) | `rank_eligible_technicians()` |
| **Assignment Workflow Service**| [backend/src/smart_helpdesk/services/assignment_service.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/services/assignment_service.py) | `start_assignment()`, `accept_assignment()`, `reroute_ticket()` |
| **Execution Milestones** | [backend/src/smart_helpdesk/services/execution_service.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/services/execution_service.py) | `mark_technician_arrived()`, `start_technician_work()`, `complete_technician_work()` |
| **Resolution & Feedback** | [backend/src/smart_helpdesk/services/resolution_service.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/services/resolution_service.py) | `process_customer_resolution_response()` |
| **User Seeder Script** | [backend/src/smart_helpdesk/db/seed_users.py](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/backend/src/smart_helpdesk/db/seed_users.py) | `seed_all()` |
| **Frontend Root & Router** | [frontend/src/App.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/App.jsx) | `App()` |
| **Frontend Auth Context** | [frontend/src/context/AuthContext.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/context/AuthContext.jsx) | `AuthProvider`, `useAuth()` |
| **Frontend API Client** | [frontend/src/api/client.js](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/api/client.js) | `apiClient`, 401 Interceptor |
| **Create Ticket Form** | [frontend/src/pages/tickets/CreateTicketPage.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/pages/tickets/CreateTicketPage.jsx) | `CreateTicketPage()` |
| **Technician Portal** | [frontend/src/pages/technician/TechnicianPortalPage.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/pages/technician/TechnicianPortalPage.jsx) | `TechnicianPortalPage()` |
| **Operations Dashboard** | [frontend/src/pages/dashboard/DashboardPage.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/pages/dashboard/DashboardPage.jsx) | `DashboardPage()` |
| **Customer Verification Card** | [frontend/src/components/tickets/ServiceResolutionCard.jsx](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/frontend/src/components/tickets/ServiceResolutionCard.jsx) | `ServiceResolutionCard()` |

---

# 24. CODE SNIPPET LIBRARY

### Snippet 1: Pydantic Ticket Scheduling Validation
- **File**: `backend/src/smart_helpdesk/schemas/ticket.py`
- **Purpose**: Enforces that scheduled tickets require a future UTC datetime, while ASAP requests must leave `scheduled_for` null.
- **What to Notice**: Uses Pydantic v2 `@model_validator(mode="after")`.

```python
# File: backend/src/smart_helpdesk/schemas/ticket.py
@model_validator(mode="after")
def validate_scheduling(self) -> "TicketCreate":
    now = datetime.now(timezone.utc)
    if self.is_scheduled:
        if self.scheduled_for is None:
            raise ValueError("scheduled_for must be provided when is_scheduled is True")
        scheduled_time = (
            self.scheduled_for
            if self.scheduled_for.tzinfo is not None
            else self.scheduled_for.replace(tzinfo=timezone.utc)
        )
        if scheduled_time <= now:
            raise ValueError("scheduled_for must be a datetime in the future")
    else:
        if self.scheduled_for is not None:
            raise ValueError("scheduled_for must be null when is_scheduled is False (ASAP request)")
    return self
```

### Snippet 2: Atomic Assignment Acceptance & Workload Increment
- **File**: `backend/src/smart_helpdesk/services/assignment_service.py`
- **Purpose**: Atomically accepts an offer, moves ticket to `ASSIGNED`, and increments technician workload in a single transaction.

```python
# File: backend/src/smart_helpdesk/services/assignment_service.py
assignment.status = AssignmentStatus.ACCEPTED
assignment.accepted_at = now
assignment.responded_at = now

ticket = db.get(Ticket, assignment.ticket_id)
if ticket:
    ticket.status = TicketStatus.ASSIGNED

technician = db.get(Technician, assignment.technician_id)
if technician:
    technician.current_workload += 1

db.commit()
db.refresh(assignment)
```

### Snippet 3: Resolution Confirmation & Automated Reopen Fallback
- **File**: `backend/src/smart_helpdesk/services/resolution_service.py`
- **Purpose**: Branching logic for resident verification: closes ticket on "Yes", reopens & dispatches fallback on "No".

```python
# File: backend/src/smart_helpdesk/services/resolution_service.py
if feedback_in.was_issue_resolved:
    ticket.status = TicketStatus.CLOSED
    db.commit()
    return ticket, feedback, None
else:
    ticket.status = TicketStatus.REOPENED
    db.flush()
    new_assignment, fallback_summary = reroute_ticket(db, ticket.id)
    if fallback_summary.status == "NEW_TECHNICIAN_OFFERED":
        ticket.status = TicketStatus.ROUTING
    db.commit()
    return ticket, feedback, fallback_summary
```

### Snippet 4: ProtectedRoute Authorization Guard
- **File**: `frontend/src/components/auth/ProtectedRoute.jsx`
- **Purpose**: Client-side route protection checking authentication state and allowed roles.

```jsx
// File: frontend/src/components/auth/ProtectedRoute.jsx
if (!isAuthenticated) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

if (allowedRoles && allowedRoles.length > 0) {
  const userRole = user?.role;
  const isAllowed = userRole === 'ADMIN' || allowedRoles.includes(userRole);
  if (!isAllowed) {
    return <Navigate to={getRoleDefaultRoute(userRole)} replace />;
  }
}
return children ? children : <Outlet />;
```

---

# 25. DEVELOPMENT PHASE HISTORY

## 25.1 Backend Phases 1 through 6
- **Phase 1 (Foundation)**: Initialized FastAPI project structure, `uv` packaging, `.env` settings management with Pydantic-Settings, structured logging, domain exception hierarchy (`AppException`), and `/health` probe.
- **Phase 2 (Database & Models)**: Configured PostgreSQL engine and session factory with `pool_pre_ping=True`. Created declarative SQLAlchemy 2.0 models (`Customer`, `Technician`, `ServiceCategory`, `Ticket`, `TechnicianAssignment`, `CustomerTechnicianHistory`). Created Alembic migration `0001`.
- **Phase 3 (Core CRUD APIs)**: Built validated Pydantic schemas and REST controllers for Categories, Customers, Technicians, and Tickets. Supported ticket filtering, lightweight status polling, and safe pre-dispatch cancellation.
- **Phase 4 (Deterministic Routing Engine)**: Implemented 4-rule eligibility filtering (`is_active`, `is_on_duty`, category match, `current_workload < max_workload`). Created 5-factor 100-point scoring algorithm and multi-tier deterministic tie-breaking hierarchy. Built `/routing-preview` endpoints.
- **Phase 5 (Assignment Workflow & Fallback)**: Built 10-minute offer creation, atomic accept, decline with reasons, "Ask Me Later" deferral, batch expired offer scanning, and dynamic fallback rerouting excluding past candidates.
- **Phase 6 (Resolution & Feedback)**: Implemented service execution lifecycle (`ARRIVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION`). Built customer verification endpoint, pairwise history updating, technician rating aggregation, and automated reopen rerouting.

## 25.2 Authentication & Multi-Role Phase
- Added `users` table with Bcrypt password hashing and `UserRole` ENUM.
- Implemented JWT access tokens (30m) and refresh token rotation (7d).
- Added Google OAuth2 integration (`/auth/oauth/google/url`, `/auth/oauth/google/callback`).
- Created FastAPI dependencies (`require_roles`, `validate_technician_ownership`, `validate_customer_ownership`).
- Built idempotent database seeder (`seed_users.py`) provisioning default Admin, Dispatcher, Technician, and Customer accounts.

## 25.3 Frontend Phases 1 through 5
- **Phase 1**: Setup React 19 + Vite 6 SPA, vanilla CSS design tokens, Bootstrap grid, and master management pages (`TechnicianCapacityPage`, `CategoriesPage`, `CustomersPage`).
- **Phase 2**: Built operations dashboard (`DashboardPage`) and ticket management hub (`TicketListPage`, `CreateTicketPage`, `TicketDetailPage`).
- **Phase 3**: Developed routing diagnostics monitor (`RoutingMonitorPage`, `RoutingInspector`, `CandidateScoreBreakdown`, `RoutingPreviewModal`).
- **Phase 4**: Built technician field portal (`TechnicianPortalPage`, `JobOfferCard`, `ActiveJobExecutionCard`, `DeclineOfferModal`).
- **Phase 5**: Developed resident verification components (`ServiceResolutionCard`, `FeedbackHistoryCard`, `AssignmentHistoryTimeline`, `TicketLifecycleStepper`).

## 25.4 Frontend-Backend Integration Synchronization Steps 1 through 6
- **Step 1 — API Wrapper Synchronization**: Aligned all methods in `frontend/src/api/` (`tickets.js`, `assignments.js`, etc.) with backend endpoints, query parameters, and payload structures.
- **Step 2 — Create Ticket Contract**: Standardized payload fields (`customer_id`, `category_id`, `description`, `location`, `is_scheduled`, `scheduled_for`), removing obsolete legacy fields.
- **Step 3 — Routing UI Contracts**: Aligned `RoutingPreviewModal` and `CandidateScoreBreakdown` with backend schemas (`recommended_technician`, `score_breakdown`, `ranked_candidates`, `excluded_candidates`).
- **Step 4 — Dashboard Synchronization**: Bound KPI metrics, live ticket queue filters, technician capacity bars, and expired offers scanner to backend APIs.
- **Step 5 — Specialist Lifecycle Synchronization**: Bound `TechnicianPortalPage` execution cards (`arrive`, `start-work`, `complete-work`) to backend status transitions.
- **Step 6 — Final Contract Cleanup**: Unified field names across all tables (`full_name`, `max_workload`, `overall_rating`, `description`) and verified all route authorization guards.

---

# 26. WHY CERTAIN DESIGN DECISIONS WERE MADE

1. **Why FastAPI over Django / Flask?**  
   *Reason:* FastAPI provides native async ASGI performance, automatic OpenAPI / Swagger documentation generation, and native integration with Pydantic v2 for strict type safety.
2. **Why PostgreSQL over MongoDB / SQLite?**  
   *Reason:* Residential helpdesk data is fundamentally relational (Customers, Technicians, Categories, Assignments). PostgreSQL provides robust ACID transactions, foreign key cascades, ENUM types, and check constraints (`current_workload >= 0`).
3. **Why Separate `TicketStatus` and `AssignmentStatus`?**  
   *Reason:* A single ticket may require multiple assignment attempts (e.g., Tech 1 declines $\rightarrow$ Tech 2 is offered $\rightarrow$ Tech 2 accepts). Decoupling ticket state from assignment state keeps data normalized and prevents historical data loss.
4. **Why Deterministic Routing instead of ML / Heuristics?**  
   *Reason:* Transparency and auditability. In residential operations, dispatch decisions must be explainable to dispatchers and technicians without black-box randomness or non-reproducible bugs.
5. **Why `uv` over `pip`?**  
   *Reason:* `uv` provides 10-100x faster package installation and deterministic lockfiles (`uv.lock`), eliminating dependency mismatch issues.
6. **Why Pure Fetch Wrapper with 401 Interceptor over Axios?**  
   *(Reason inferred from implementation)* Keeps bundle size minimal with zero external HTTP dependencies while providing custom token refresh queue management.

---

# 27. TESTING STRATEGY & VERIFICATION

## 27.1 Backend Automated Pytest Suite (104 Tests)
The backend test suite contains **104 passing tests** across 18 test files:

```text
tests/test_assignment_service.py ........                                [  7%]
tests/test_assignments_api.py ....                                       [ 11%]
tests/test_auth.py ...........                                           [ 22%]
tests/test_categories_api.py ....                                        [ 25%]
tests/test_customers_api.py .......                                      [ 32%]
tests/test_database.py .........                                         [ 41%]
tests/test_execution_service.py ...                                      [ 44%]
tests/test_health.py ....                                                [ 48%]
tests/test_lifecycle_api.py ......                                       [ 53%]
tests/test_resolution_api.py ....                                        [ 57%]
tests/test_resolution_service.py ....                                    [ 61%]
tests/test_routing_api.py .....                                          [ 66%]
tests/test_routing_eligibility.py .......                                [ 73%]
tests/test_routing_ranking.py ...                                        [ 75%]
tests/test_routing_scoring.py ......                                     [ 81%]
tests/test_routing_service.py ....                                       [ 85%]
tests/test_technicians_api.py ......                                     [ 91%]
tests/test_tickets_api.py .........                                      [100%]
======================= 104 passed, 1 warning in 5.82s ========================
```

## 27.2 Frontend Build & Contract Validation
The frontend is verified using `npm run build` with Vite 6:
- 90 modules transformed without syntax or bundle errors.
- Output generated in `frontend/dist/`.

## 27.3 Testing Scope & Guarantees
- **What Automated Backend Tests Prove**: Proves database schema integrity, business rule validation, routing math, tie-breaking, state transitions, authentication token generation/refresh, and RBAC endpoint protection.
- **What Automated Tests Do NOT Prove**: Does not replace manual UI verification of CSS responsiveness, cross-browser rendering, or user UX flows (covered in [PROJECT_MASTER_TEST_CHECKLIST.md](file:///c:/Users/sivap/Desktop/IMPOF_INTERNSHIP/smart-helpdesk/PROJECT_MASTER_TEST_CHECKLIST.md)).

---

# 28. HOW TO RUN THE PROJECT

## 28.1 Prerequisites & Tooling
- Python `>=3.13`
- `uv` Package Manager (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js `>=18+` & `npm`
- PostgreSQL Running locally on `localhost:5432`

## 28.2 Database Setup & Seeding

```powershell
# 1. Ensure PostgreSQL database exists (default name: smart_helpdesk)
# createdb smart_helpdesk

# 2. Run Alembic migrations
cd backend
uv sync
uv run alembic upgrade head

# 3. Seed multi-role test accounts and service categories
uv run python -m smart_helpdesk.db.seed_users
```

## 28.3 Running Backend & Frontend

```powershell
# Terminal 1: Start Backend (FastAPI on Port 8000)
cd backend
uv run uvicorn smart_helpdesk.main:app --reload --port 8000

# Terminal 2: Start Frontend (Vite on Port 5173)
cd frontend
npm install
npm run dev
```

- **Backend API Docs**: `http://localhost:8000/docs`
- **Frontend App**: `http://localhost:5173`

## 28.4 Running Test Suites

```powershell
# Run Backend Pytest Suite
cd backend
uv run pytest

# Build Frontend Bundle
cd frontend
npm run build
```

---

# 29. ENVIRONMENT VARIABLES REFERENCE

| Variable | Scope | Purpose | Default / Example Placeholder | Required? |
|---|---|---|---|---|
| `APP_NAME` | Backend | Application title in OpenAPI & logs | `Smart-HelpDesk` | No |
| `APP_ENVIRONMENT` | Backend | Environment profile (`development`, `production`) | `development` | No |
| `DEBUG` | Backend | Enables verbose debug logging & DB echo | `true` | No |
| `API_V1_PREFIX` | Backend | Base routing prefix | `/api/v1` | No |
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql+psycopg://postgres:postgres@localhost:5432/smart_helpdesk` | **Yes** |
| `JWT_SECRET_KEY` | Backend | Secret key for signing JWT tokens | `your-secure-jwt-secret-key-min-32-chars` | **Yes** (in prod) |
| `JWT_ALGORITHM` | Backend | Cryptographic algorithm | `HS256` | No |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Access token lifetime | `30` | No |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Backend | Refresh token lifetime | `7` | No |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth2 Client ID | `your-google-client-id.apps.googleusercontent.com` | Optional (for Google Auth) |
| `GOOGLE_CLIENT_SECRET` | Backend | Google OAuth2 Client Secret | `your-google-client-secret` | Optional (for Google Auth) |
| `GOOGLE_REDIRECT_URI` | Backend | Google OAuth2 callback URL | `http://localhost:5173/auth/google/callback` | Optional (for Google Auth) |
| `VITE_API_URL` | Frontend | Backend base URL for API client | `/api/v1` (Proxied by Vite or direct URL) | No |

---

# 30. MANUAL WEBSITE WALKTHROUGH & DEMO SCRIPT

To perform a complete live demonstration:

1. **Start Services**: Start FastAPI backend (`:8000`) and Vite frontend (`:5173`).
2. **Seed Data**: Run `uv run python -m smart_helpdesk.db.seed_users`.
3. **Step 1 — Resident Submits Request**:
   - Log in as **Customer** (`resident.alice@smarthelpdesk.com` / `ResidentPass123!`).
   - Go to `/tickets/new`, select `Plumbing`, enter *"Water leaking under bathroom sink"*, submit.
   - Ticket created with status `ROUTING` (or `PENDING`).
4. **Step 2 — Dispatcher Inspects Routing**:
   - In another browser tab (or incognito), log in as **Dispatcher** (`dispatcher@smarthelpdesk.com` / `DispatchPass123!`).
   - Open `/dashboard`, click the new ticket, click `[ Preview Routing Engine ]`.
   - Inspect the 5-factor scoring breakdown showing Ravi Kumar ranked #1.
5. **Step 3 — Technician Accepts & Executes**:
   - Log in as **Technician** (`tech.ravi@smarthelpdesk.com` / `TechPass123!`).
   - On `/technician/jobs`, see the 10-minute offer card. Click `Accept Offer`.
   - Click `Mark Arrived on Site` $\rightarrow$ Status moves to `ARRIVED`.
   - Click `Start Working` $\rightarrow$ Status moves to `IN_PROGRESS`.
   - Click `Complete Service...`, enter *"Replaced washer and sealed joint"*, submit $\rightarrow$ Status moves to `AWAITING_CUSTOMER_CONFIRMATION`.
6. **Step 4 — Resident Verifies & Rates**:
   - Switch back to Alice's tab on `/tickets/{id}`.
   - `ServiceResolutionCard` appears. Select "Yes, Issue is Resolved", choose 5 stars, submit.
   - Status moves to `CLOSED`. Ravi's workload is released.

---

# 31. TROUBLESHOOTING GUIDE

| Symptom | Likely Cause | How to Diagnose | Fix |
|---|---|---|---|
| Backend fails to start with `psycopg.OperationalError` | PostgreSQL is not running or wrong credentials in `DATABASE_URL`. | Check terminal output: `Connection refused`. | Start PostgreSQL service (`net start postgresql-x64-16` or check pgAdmin) and verify `DATABASE_URL` in `backend/.env`. |
| Alembic commands error with `relation already exists` | Database already has tables created outside Alembic. | Check `alembic_version` table in PostgreSQL. | Stamp current revision: `uv run alembic stamp head`. |
| Frontend API requests return `401 Unauthorized` repeatedly | Access token expired and refresh token also invalid. | Check browser Console & Application `localStorage`. | Click `Sign Out` or clear `localStorage`, then log in again. |
| Assignment offers do not appear on Technician Portal | Technician is not On-Duty, inactive, or workload is full. | Inspect technician record in `/technicians` or run `GET /technicians`. | Toggle "On Duty" switch on `/technician/jobs` or increase `max_workload`. |
| CORS errors in browser console during API calls | API client making direct cross-origin calls without proxy. | Inspect browser Network tab: `CORS policy` block. | Ensure frontend connects via Vite proxy or backend allows frontend origin. |

---

# 32. CURRENT PROJECT STATUS & PRODUCTION READINESS

- **Backend**: 100% feature complete across Phases 1–6, Auth, RBAC, and Seeder. 104 passing pytest tests.
- **Frontend**: 100% synchronized across all role views, components, and API wrappers. Clean production build.
- **Database**: 5 migration revisions cleanly applied.
- **Production Checklist (Before Production Deployment)**:
  - Configure production `JWT_SECRET_KEY` via secure secret manager.
  - Set `DEBUG = False`.
  - Configure production CORS origins in FastAPI.
  - Set up HTTPS SSL certificates and PostgreSQL connection pooling (PgBouncer).

---

# 33. THINGS I MUST REMEMBER

1. **`description`, NOT `title`**: The `Ticket` schema uses `description: str` for the problem text. There is no backend `title` column.
2. **`category_id`, NOT `service_category`**: Tickets reference categories via `category_id: UUID`.
3. **`full_name`, NOT `name`**: Technician and Customer models use `full_name`.
4. **`max_workload` & `overall_rating`**: Capacity is `max_workload` (int); Rating is `overall_rating` (Decimal).
5. **`TicketStatus` vs `AssignmentStatus`**: They are distinct state machines.
6. **Workload is Released on Verification**: A technician's workload decrements only after customer confirmation or fallback reopen, NOT immediately on complete-work.
7. **Deterministic Tie-Breaking**: Ranking is 100% deterministic (Score $\rightarrow$ Location $\rightarrow$ Rating $\rightarrow$ Workload $\rightarrow$ UUID).
8. **Package Tooling**: The project strictly uses **`uv`**, not `pip`.

---

# 34. HOW I WOULD EXPLAIN THIS PROJECT IN AN INTERVIEW

### 30-Second Elevator Pitch
> *"Smart-HelpDesk is an intelligent residential maintenance dispatching platform built with FastAPI, PostgreSQL, and React. It replaces chaotic manual triage with a deterministic 5-factor scoring engine that automatically matches maintenance requests to the best available technician based on tower proximity, ratings, pairwise customer history, reliability, and workload. It features 10-minute offer windows, automated fallback rerouting, and a closed-loop customer verification gate."*

### 1-Minute Explanation
> *"In residential communities, maintenance requests often suffer from slow manual dispatching and lack of accountability. I built Smart-HelpDesk to solve this. The system models 4 roles: Admins, Dispatchers, Technicians, and Residents. When a ticket is submitted, the routing engine filters candidates across 4 eligibility rules and ranks eligible specialists using a 100-point algorithm. The top candidate receives a 10-minute offer card. If they decline or time out, the engine automatically reroutes the ticket to the next best candidate. Once on-site work is completed, the resident must confirm resolution before the ticket closes, ensuring complete quality assurance."*

### 3-Minute Deep Dive
> *"Architecturally, Smart-HelpDesk is split into a high-performance FastAPI backend using SQLAlchemy 2.0 with PostgreSQL and a React 19 single-page application. Security is enforced via JWT access and refresh token rotation with Bcrypt hashing and role-based dependency injection.
> 
> The core technical innovation is the Deterministic Routing Engine. Unlike heuristic or random dispatchers, our engine evaluates candidate eligibility (active status, on-duty shift, skill category match, available workload capacity) and scores candidates out of 100 points: 20 for location proximity, 25 for customer star ratings, 25 for pairwise customer-technician affinity, 15 for first-time fix reliability, and 15 for workload load balancing. Ties are deterministically resolved.
> 
> Furthermore, I decoupled `TicketStatus` from `AssignmentStatus` to support clean fallback history. If a technician declines or an offer times out, the system excludes previously attempted technicians and re-scores the remaining live pool without stale cache issues. The frontend features an automatic 401 fetch interceptor that refreshes expired tokens seamlessly. The backend is verified with 104 unit and API tests."*

---

# 35. COMPREHENSIVE TECHNICAL INTERVIEW Q&A

### Backend & FastAPI
- **Q: Why use dependency injection for database sessions?**  
  *A:* FastAPI's `Depends(get_db)` ensures each HTTP request receives an isolated SQLAlchemy session and guarantees that `db.close()` is executed in a `finally` block, preventing database connection leaks.
- **Q: How does the global exception handler work?**  
  *A:* We defined custom domain exceptions inheriting from `AppException`. FastAPI's `register_exception_handlers()` catches these domain exceptions and maps them to clean JSON responses (`{"detail": "..."}`) with proper HTTP status codes (400, 404, 409).

### Database & SQLAlchemy
- **Q: How do you prevent race conditions during ticket assignment?**  
  *A:* Assignment offers enforce an active offer check (`get_active_assignment_for_ticket`) within database transactions. In high-concurrency environments, row-level locking (`SELECT ... FOR UPDATE`) can be applied on the ticket row.
- **Q: Why are UUIDs used for primary keys?**  
  *A:* UUIDv4 primary keys prevent sequential ID enumeration attacks, allow distributed ID generation, and simplify future data sharding without primary key collision.

### Routing & Algorithms
- **Q: How does the routing engine avoid division-by-zero for new technicians?**  
  *A:* We implement **neutral priors**. For instance, if `completed_jobs == 0`, the reliability score defaults to `0.70` (70%) rather than dividing `reopened_jobs / completed_jobs`. Similarly, new technicians receive a default rating prior of `3.5 / 5.0`.
- **Q: How is loop prevention guaranteed during fallback rerouting?**  
  *A:* `reroute_ticket()` queries all historical assignment records for the ticket, builds a set of `attempted_technician_ids`, and explicitly filters them out from the candidate pool before running eligibility and scoring.

---

# 36. SYSTEM DESIGN DEEP DIVE & SEQUENCE DIAGRAMS

### Sequence Diagram: Ticket Creation, Routing & Offer Dispatch

```text
Customer (Browser)          FastAPI API             Routing Engine           PostgreSQL DB
       │                         │                        │                        │
       │ POST /tickets           │                        │                        │
       ├────────────────────────►│                        │                        │
       │                         │ Validate TicketCreate  │                        │
       │                         ├───────────────────────┐│                        │
       │                         │ (Category & Location) ││                        │
       │                         │◄──────────────────────┘│                        │
       │                         │ INSERT INTO tickets (status=PENDING)            │
       │                         ├────────────────────────────────────────────────►│
       │                         │                        │                        │
       │                         │ POST /tickets/{id}/assign                       │
       │                         ├───────────────────────►│                        │
       │                         │                        │ Evaluate Eligibility   │
       │                         │                        │ (Active, Duty, Skill)  │
       │                         │                        ├───────────────────────►│
       │                         │                        │ Calculate 5-Factor Score│
       │                         │                        │ Rank & Tie-Break       │
       │                         │                        │◄───────────────────────┤
       │                         │ Create Offer (expires in 10m)                   │
       │                         │ UPDATE tickets (status=ROUTING)                 │
       │                         ├────────────────────────────────────────────────►│
       │ 201 Created             │                        │                        │
       │◄────────────────────────┤                        │                        │
```

---

# 37. SECURITY ARCHITECTURE

1. **Password Security**: Bcrypt with automatic salt generation; plain passwords never stored.
2. **JWT Cryptography**: Signed with HMAC-SHA256 (`HS256`) and verified on every protected request.
3. **Stateless Authorization**: JWT payloads carry `role`, `customer_id`, and `technician_id`.
4. **SQL Injection Defense**: SQLAlchemy parameterized queries across all database operations.
5. **Cross-Site Scripting (XSS) Defense**: React JSX automatic output encoding.
6. **Input Sanitization**: Pydantic models validate string lengths, types, email formats, and date bounds.

---

# 38. PERFORMANCE & SCALABILITY ANALYSIS

- **Current Implementation**:
  - Direct relational queries with indexed foreign keys (`customer_id`, `technician_id`, `category_id`, `status`).
  - `pool_pre_ping=True` connection pooling.
  - In-memory routing scoring execution time is sub-millisecond for normal candidate pools (<500 technicians).
- **Future Scaling Strategy**:
  - **Redis Caching**: Cache static service categories and technician profiles.
  - **Celery / Redis Queue**: Offload batch expired offer scanning and notification delivery to asynchronous background workers.
  - **Database Read Replicas**: Route read-only dashboard queries to PostgreSQL read replicas.

---

# 39. FUTURE ROADMAP & POTENTIAL IMPROVEMENTS

> [!NOTE]
> The following items represent prospective enhancements for future releases:

1. **Real-Time WebSockets**: Push live offer alerts directly to technician devices without polling.
2. **GIS & Mapbox / Google Maps Routing**: Replace zone substring matching with real-time GPS coordinates, traffic-aware travel time, and driving distance ETA.
3. **Machine Learning Dispatch Optimization**: Train an XGBoost or neural ranking model on historical `customer_technician_history` and feedback data to dynamically predict first-time-fix probability.
4. **Push Notifications (PWA / Mobile)**: Send SMS (Twilio) and WebPush notifications when an offer is dispatched or a technician arrives.
5. **Automated End-to-End Testing**: Integrate Playwright or Cypress test suites for browser regression testing.

---

# 40. FINAL QUICK REFERENCE CHEAT SHEET

```text
================================================================================
SMART-HELPDESK MASTER QUICK REFERENCE
================================================================================

PROJECT:       Smart-HelpDesk (Residential Maintenance & Deterministic Dispatch)
BACKEND:       FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic, uv
FRONTEND:      React 19, Vite 6, React Router DOM, Bootstrap 5, Vanilla CSS Tokens
TEST SUITE:    104 Backend Tests Passing (pytest) | Clean Vite Build

RUN COMMANDS:
  Backend:     cd backend && uv run uvicorn smart_helpdesk.main:app --reload --port 8000
  Frontend:    cd frontend && npm run dev
  Migrations:  cd backend && uv run alembic upgrade head
  Seeder:      cd backend && uv run python -m smart_helpdesk.db.seed_users
  Pytest:      cd backend && uv run pytest
  Build:       cd frontend && npm run build

DEMO ACCOUNTS (user.md):
  ADMIN:       admin@smarthelpdesk.com       / AdminPass123!     (/dashboard)
  DISPATCHER:  dispatcher@smarthelpdesk.com  / DispatchPass123!  (/dashboard)
  TECHNICIAN:  tech.ravi@smarthelpdesk.com   / TechPass123!      (/technician/jobs)
  CUSTOMER:    resident.alice@smarthelpdesk.com / ResidentPass123! (/tickets)

TICKET LIFECYCLE:
  PENDING -> ROUTING -> ASSIGNED -> ARRIVED -> IN_PROGRESS -> 
  AWAITING_CUSTOMER_CONFIRMATION -> CLOSED (or REOPENED -> Fallback)

ASSIGNMENT LIFECYCLE:
  OFFERED (10m timer) -> ACCEPTED | DECLINED | DEFERRED | EXPIRED -> COMPLETED

5-FACTOR ROUTING FORMULA (100 Max Points):
  Total = Location (20) + Rating (25) + History (25) + Reopen (15) + Workload (15)

KEY CONTRACT FIELDS TO REMEMBER:
  • Ticket problem text:    ticket.description (NOT title)
  • Service category ID:    ticket.category_id (NOT service_category)
  • Technician full name:   technician.full_name (NOT name)
  • Max active capacity:    technician.max_workload
  • Star rating average:    technician.overall_rating
================================================================================
```
