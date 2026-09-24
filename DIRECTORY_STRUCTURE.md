# 📁 Smart-HelpDesk — Complete Directory Structure & File Map

> **Document Purpose:** Complete architectural walkthrough of every directory, file, component, and module in the Smart-HelpDesk repository, explaining what each file does and how they connect.

---

## 🌳 High-Level Repository Tree

```text
smart-helpdesk/
├── backend/                             # FastAPI Backend Engine
│   ├── alembic/                         # Database Migration Scripts (0001 - 0005)
│   │   ├── versions/                    # Individual migration files
│   │   └── env.py                       # Alembic environment & metadata runner
│   ├── src/smart_helpdesk/              # Core Application Source Code
│   │   ├── api/                         # REST API Routers & Dependencies
│   │   ├── core/                        # Settings, Security & App Lifecycle
│   │   ├── db/                          # SQLAlchemy Models, Session & Seed Data
│   │   ├── routing/                     # Deterministic Scoring & Ranking Engine
│   │   ├── schemas/                     # Pydantic v2 Request/Response Models
│   │   ├── services/                    # Business Logic Layer
│   │   └── main.py                      # FastAPI App Entrypoint & Middleware
│   ├── tests/                           # 104 Passing Pytest Automated Tests
│   ├── alembic.ini                      # Alembic configuration
│   └── pyproject.toml                   # Python dependencies managed via `uv`
│
├── frontend/                            # React 19 + Vite 6 Single Page Application
│   ├── src/
│   │   ├── api/                         # Central API Client & Modular Endpoints
│   │   ├── components/                  # Reusable UI & Domain Components
│   │   │   ├── auth/                    # ProtectedRoute & Role Guards
│   │   │   ├── common/                  # Buttons, Badges, Modals, Loaders
│   │   │   ├── layout/                  # AppLayout, Sidebar, TopHeader
│   │   │   ├── routing/                 # Timer & Routing Preview Visualizers
│   │   │   ├── technician/              # JobOfferCard, ActiveJobExecutionCard
│   │   │   └── tickets/                 # ResolutionCard, Stepper, Timelines
│   │   ├── context/                     # AuthContext & ToastContext
│   │   ├── pages/                       # Screen Views across all 4 Roles
│   │   │   ├── auth/                    # LoginPage, RegisterPage, OAuthCallback
│   │   │   ├── categories/              # CategoriesPage (Service Domains)
│   │   │   ├── customers/               # CustomersPage (Resident Directory)
│   │   │   ├── dashboard/               # DashboardPage (Operations Hub)
│   │   │   ├── landing/                 # LandingPage (Public Marketing View)
│   │   │   ├── routing/                 # RoutingMonitorPage (Algorithm Inspector)
│   │   │   ├── technician/              # TechnicianPortalPage (Field Specialist)
│   │   │   ├── technicians/             # TechnicianCapacityPage (Roster & Skills)
│   │   │   └── tickets/                 # TicketListPage, DetailPage, CreatePage
│   │   ├── styles/                      # Theme Variables, Design Tokens & CSS
│   │   ├── App.jsx                      # Main Router & Route Definitions
│   │   └── main.jsx                     # React Root Mounting Script
│   ├── package.json                     # Frontend dependencies & npm scripts
│   └── vite.config.js                   # Vite Bundler & Proxy Configuration
│
├── learn.md                             # Master Deep-Dive Learning & Reference Guide
├── SYSTEM_ARCHITECTURE_AND_WORKFLOWS.md # Detailed Workflows & All Operational Cases
├── PROJECT_COMPLETE_FLOW_GUIDE.md       # Executive Presentation & 5-Min Demo Script
└── DIRECTORY_STRUCTURE.md               # This Complete File Reference Document
```

---

## 🛠️ Backend Deep Dive (`backend/`)

### 1. `backend/src/smart_helpdesk/api/` (API Layer)
* **`api/dependencies.py`**: Dependency injection module. Contains JWT extraction (`get_current_user`), role checking factories (`require_roles`, `require_admin`, `require_admin_or_dispatcher`), and database session providers (`get_db`).
* **`api/router.py`**: Top-level API router aggregation. Mounts all sub-routers under the `/api/v1` prefix.
* **`api/routes/auth.py`**: Authentication endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `GET /auth/oauth/google/url`, `POST /auth/oauth/google/callback`).
* **`api/routes/tickets.py`**: Ticket endpoints (Create, List, Get by ID, Update, Cancel, Status, Routing Preview, Dispatch, Arrival, Start Work, Complete Work, Customer Resolution Response, Feedback History).
* **`api/routes/assignments.py`**: Assignment endpoints (`POST /assignments/{id}/accept`, `POST /assignments/{id}/decline`, `POST /assignments/{id}/ask-later`, `POST /assignments/process-expired`).
* **`api/routes/technicians.py`**: Technician endpoints (List roster, Get by ID, Create technician, Update skills/shift/capacity).
* **`api/routes/service_categories.py`**: Service categories endpoints (List, Create, Update active toggle, SLA hours).
* **`api/routes/customers.py`**: Customer directory endpoints (List, Get, Create, Update profile location).
* **`api/routes/health.py`**: System health check (`GET /health`) verifying database connectivity.

### 2. `backend/src/smart_helpdesk/core/` (Core Configuration & Security)
* **`core/config.py`**: Pydantic `Settings` class loading environment variables (`APP_NAME`, `DATABASE_URL`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`) with `@lru_cache`.
* **`core/security.py`**: Password hashing using `bcrypt` and JWT token encoding/decoding using `PyJWT` (HMAC-SHA256).

### 3. `backend/src/smart_helpdesk/db/` (Database & ORM)
* **`db/session.py`**: SQLAlchemy engine creation with connection pooling and `get_db` generator.
* **`db/base.py`**: Declarative base importing all model classes so Alembic discovers all tables.
* **`db/enums.py`**: Python string enums (`TicketStatus`, `AssignmentStatus`, `UserRole`, `DeclineReason`).
* **`db/models/user.py`**: User account model storing credentials, role (`ADMIN`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER`), and foreign keys.
* **`db/models/ticket.py`**: Ticket model storing description, location, urgency, status, scheduling timestamps, and customer ID.
* **`db/models/assignment.py`**: Assignment offer model storing technician ID, ticket ID, status, offer timestamps, and execution notes.
* **`db/models/technician.py`**: Technician model storing shift status (`is_on_duty`), max capacity, active count, zone, and skills array.
* **`db/models/service_category.py`**: Service category model (Plumbing, Electrical, HVAC, etc.).
* **`db/models/customer.py`**: Customer model storing resident name, phone, email, and default apartment unit.
* **`db/models/ticket_feedback.py`**: Customer feedback model storing 1-5 star ratings, comments, and resolution verification flags.
* **`db/seed_users.py` / `db/seed_data.py`**: Database seeding scripts populating initial demo accounts and categories.

### 4. `backend/src/smart_helpdesk/routing/` (Deterministic Algorithm Engine)
* **`routing/engine.py`**: Core algorithm implementing the 4 hard eligibility filters, 5-factor 100-point scoring formula, and deterministic tie-breaking hierarchy.
* **`routing/schemas.py`**: Scoring breakdown schemas for previewing candidate evaluations.

### 5. `backend/src/smart_helpdesk/services/` (Business Logic Layer)
* **`services/ticket_service.py`**: Ticket creation, updates, and cancellations.
* **`services/routing_service.py`**: Executes deterministic candidate ranking for tickets.
* **`services/assignment_service.py`**: Handles offer dispatching, accept/decline/defer transitions, expired offer sweeps, and fallback rerouting.
* **`services/execution_service.py`**: Handles field milestones: Mark Arrived, Start Work, Complete Work.
* **`services/resolution_service.py`**: Processes customer confirmation (Yes $\rightarrow$ Closed; No $\rightarrow$ Reopened + Fallback) and updates technician affinity scores.
* **`services/customer_service.py` & `services/technician_service.py`**: CRUD profile services.

---

## 💻 Frontend Deep Dive (`frontend/`)

### 1. `frontend/src/api/` (API Client Layer)
* **`api/client.js`**: Central `apiClient` using fetch. Automatically attaches `Authorization: Bearer <token>` and intercepts `401 Unauthorized` responses to auto-refresh the token via `/auth/refresh`.
* **`api/auth.js`**: Methods for login, register, refresh, getMe, logout, and Google OAuth.
* **`api/tickets.js`**: Methods for ticket operations, milestones, and customer verification submissions.
* **`api/assignments.js`**: Methods for accept, decline, ask-later, and expired sweeps.
* **`api/technicians.js` / `api/categories.js` / `api/customers.js` / `api/routing.js`**: Specialized domain API modules.

### 2. `frontend/src/components/` (Reusable Component Library)
* **`components/auth/ProtectedRoute.jsx`**: Route guard component enforcing authentication and strict `allowedRoles` matching, redirecting unauthorized users to their default home view.
* **`components/layout/AppLayout.jsx`**: Master wrapper rendering `Sidebar`, `TopHeader`, and `<Outlet />`.
* **`components/layout/Sidebar.jsx`**: Role-filtered navigation sidebar showing links tailored to the active user's permissions.
* **`components/layout/TopHeader.jsx`**: Top application bar showing search, active role badge, and quick actions.
* **`components/tickets/ServiceResolutionCard.jsx`**: Customer-only interactive verification card with "Yes, Issue Resolved" (5-star rating) and "No, Problem Persists" (reopening).
* **`components/tickets/TicketLifecycleStepper.jsx`**: Visual 6-milestone progress stepper tracking ticket progress.
* **`components/tickets/AssignmentHistoryTimeline.jsx`**: Historical visual timeline of all past assignment attempts on a ticket.
* **`components/technician/JobOfferCard.jsx`**: 10-minute live countdown job offer card with Accept, Decline, and Ask Later actions.
* **`components/technician/ActiveJobExecutionCard.jsx`**: On-site execution tracker with Mark Arrived, Start Work, and Complete Service buttons.
* **`components/routing/ActiveOfferTimer.jsx`**: Live countdown timer derived mathematically from `expires_at` timestamp.
* **`components/routing/RoutingScoreBreakdown.jsx`**: Visual 5-factor scoring bar inspector.

### 3. `frontend/src/pages/` (Screen Views)
* **`pages/auth/LoginPage.jsx`**: Login page featuring email/password, Google OAuth2 sign-in, and development role fast-switcher buttons.
* **`pages/auth/RegisterPage.jsx`**: Resident registration page.
* **`pages/auth/OAuthCallbackPage.jsx`**: Google OAuth callback handler parsing tokens and redirecting to role dashboards.
* **`pages/dashboard/DashboardPage.jsx`**: Operations dashboard with real-time KPI metrics, operations queue, and technician capacity gauges.
* **`pages/tickets/TicketListPage.jsx`**: Ticket Hub for staff and "My Tickets" for residents, with search, category filtering, and status filtering.
* **`pages/tickets/CreateTicketPage.jsx`**: Service request creation form with ASAP/Scheduled timing and category picker.
* **`pages/tickets/TicketDetailPage.jsx`**: Detailed ticket view with lifecycle stepper, problem description, assigned specialist card, assignment history, and resolution verification gate.
* **`pages/technician/TechnicianPortalPage.jsx`**: Field specialist workspace (`/technician/jobs`) with shift duty toggle, live job offer cards, and active job execution cards.
* **`pages/technicians/TechnicianCapacityPage.jsx`**: Master technician roster with skill category badges and workload capacity bars.
* **`pages/categories/CategoriesPage.jsx`**: Service categories catalog with active status toggles and SLA hours.
* **`pages/customers/CustomersPage.jsx`**: Resident directory with apartment unit numbers and contact information.
* **`pages/routing/RoutingMonitorPage.jsx`**: Algorithm inspector previewing candidate ranking and scoring breakdowns.
