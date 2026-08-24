# Phase 2 Testing & Verification Guide: Database Foundation & Models

This guide outlines how to configure, migrate, and test the Phase 2 database foundation for **Smart-HelpDesk**.

---

## 1. Running the Automated Test Suite

The test suite contains 13 automated tests covering:
- Phase 1 health endpoints, OpenAPI schemas, and error handlers
- Phase 2 UUID primary keys and timezone-aware timestamps
- Domain models (`Customer`, `Technician`, `ServiceCategory`, `Ticket`, `TechnicianAssignment`, `CustomerTechnicianHistory`)
- Database relationships (1:N, N:M) and cascading behaviors
- Integrity constraints (uniqueness, rating bounds, workload non-negativity)
- Session lifecycle and `get_db()` dependency

### Command
From the `backend/` directory:
```powershell
uv run pytest -v
```

---

## 2. Setting Up Local PostgreSQL (Optional / Production-like)

To test against a live local PostgreSQL instance:

### Step 1: Create the PostgreSQL Database
Open PostgreSQL CLI (`psql`) or pgAdmin:
```sql
CREATE DATABASE smart_helpdesk;
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in `backend/`:
```powershell
Copy-Item .env.example .env
```
Ensure `DATABASE_URL` matches your local credentials:
```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/smart_helpdesk
```

### Step 3: Apply Alembic Migrations
Run the initial migration to create all tables, indexes, and constraints:
```powershell
uv run alembic upgrade head
```

### Step 4: Verify Tables in PostgreSQL
Run `\dt` or query information schema:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
Expected tables:
- `alembic_version`
- `customers`
- `technicians`
- `service_categories`
- `technician_service_categories`
- `tickets`
- `technician_assignments`
- `customer_technician_history`

---

## 3. Starting the Backend Server

```powershell
uv run python -m uvicorn smart_helpdesk.main:app --reload
```

Verify that the health check continues to respond:
- URL: `http://127.0.0.1:8000/api/v1/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
