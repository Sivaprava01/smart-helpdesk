# Backend Multi-Role Authentication & Access Control Architecture

This document describes the multi-role backend architecture, user provisioning, entity relationships, and role permissions for **Smart-HelpDesk**.

---

## 1. Supported User Roles

The system defines 4 distinct roles via the `UserRole` enum (`backend/src/smart_helpdesk/db/enums.py`):

| Role Enum | Description | Key Linked Relationship |
|---|---|---|
| **`ADMIN`** | Platform Superuser with unrestricted access across operations, entities, routing, and configurations. | None (Global system scope) |
| **`DISPATCHER`** | Helpdesk Operations Staff managing ticket queue, dispatching technicians, and monitoring routing fallbacks. | None (Facility operations scope) |
| **`TECHNICIAN`** | Field Service Specialist fulfilling maintenance assignments on-site. | `users.technician_id` $\rightarrow$ `technicians.id` |
| **`CUSTOMER`** | Apartment Resident creating service requests and verifying job resolutions. | `users.customer_id` $\rightarrow$ `customers.id` |

---

## 2. Permissions Matrix

| Resource / Endpoint | `ADMIN` | `DISPATCHER` | `TECHNICIAN` | `CUSTOMER` |
|---|:---:|:---:|:---:|:---:|
| **Authentication (`/auth/*`)** | ✓ | ✓ | ✓ | ✓ |
| **View Operations Dashboard (`/dashboard`)** | ✓ | ✓ | ✕ | ✕ |
| **View Ticket Management Hub (`/tickets`)** | ✓ | ✓ | ✓ (Assigned) | ✓ (Own tickets) |
| **Create Service Request (`POST /tickets`)** | ✓ | ✓ | ✕ | ✓ |
| **Cancel Pending Ticket (`POST /tickets/:id/cancel`)** | ✓ | ✓ | ✕ | ✓ (Own pending) |
| **Inspect Routing Preview (`GET /tickets/:id/routing-preview`)** | ✓ | ✓ | ✕ | ✕ |
| **Dispatch Technician (`POST /assignments/ticket/:id/start`)** | ✓ | ✓ | ✕ | ✕ |
| **Process Expired Offers (`POST /assignments/process-expired`)** | ✓ | ✓ | ✕ | ✕ |
| **Manage Technicians (`/technicians/*`)** | ✓ | ✓ | ✕ | ✕ |
| **Manage Categories (`/categories/*`)** | ✓ | ✓ | ✕ | ✕ |
| **Manage Resident Directory (`/customers/*`)** | ✓ | ✓ | ✕ | ✕ |
| **Accept/Decline/Defer Job Offers (`/assignments/:id/*`)** | ✓ | ✕ | ✓ (Own offer) | ✕ |
| **Record Arrival / Start / Complete Work (`/assignments/:id/*`)** | ✓ | ✕ | ✓ (Own job) | ✕ |
| **Confirm Resolution & Star Rating (`/tickets/:id/customer-response`)** | ✓ | ✕ | ✕ | ✓ (Own ticket) |

---

## 3. Database Seeding Utility

The backend includes an idempotent seeding utility at `backend/src/smart_helpdesk/db/seed_users.py`.

### How to Run:
```powershell
cd backend
uv run python -m smart_helpdesk.db.seed_users
```

### Seeded Accounts Summary:

| Role | Email | Password | Linked Entity |
|---|---|---|---|
| `ADMIN` | `admin@smarthelpdesk.com` | `AdminPass123!` | Superuser account |
| `DISPATCHER` | `dispatcher@smarthelpdesk.com` | `DispatchPass123!` | Operations staff account |
| `TECHNICIAN` | `tech.ravi@smarthelpdesk.com` | `TechPass123!` | Linked to Technician `Ravi Kumar` (`Tower A`, Skills: Plumbing, Electrical, HVAC) |
| `CUSTOMER` | `resident.alice@smarthelpdesk.com` | `ResidentPass123!` | Linked to Customer `Alice Smith` (`Tower A, Apt 402`) |

----------------------------

  ROLE        EMAIL                          PASSWORD
------------------------------------------------------------------
  ADMIN       admin@smarthelpdesk.com        AdminPass123!
  DISPATCHER  dispatcher@smarthelpdesk.com   DispatchPass123!
  TECHNICIAN  tech.ravi@smarthelpdesk.com    TechPass123!
  CUSTOMER    resident.alice@smarthelpdesk.com ResidentPass123!