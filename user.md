# Smart-HelpDesk Demo Accounts & Role Reference

This reference lists all default multi-role development accounts provisioned in the Smart-HelpDesk database.

---

## Default User Accounts

| Role | Name / Persona | Email (Username) | Password | Linked Entity | Default Landing Route | Access Scope |
|---|---|---|---|---|---|---|
| **`ADMIN`** | Platform Administrator | `admin@smarthelpdesk.com` | `AdminPass123!` | Global Superuser | `/dashboard` | Unrestricted access across all operational modules, settings, master entities, categories, and routing |
| **`DISPATCHER`** | Operations Dispatcher | `dispatcher@smarthelpdesk.com` | `DispatchPass123!` | Operations Staff | `/dashboard` | Operations dashboard, ticket management hub, technician capacity monitoring, routing preview, and customer directory |
| **`TECHNICIAN`** | Ravi Kumar | `tech.ravi@smarthelpdesk.com` | `TechPass123!` | Technician `Ravi Kumar`<br>(`Tower A`, Skills: Plumbing, Electrical, HVAC) | `/technician/jobs` | Field service portal, 15-minute offer decision cards, on-site arrival tracking, and work completion notes |
| **`CUSTOMER`** | Alice Smith | `resident.alice@smarthelpdesk.com` | `ResidentPass123!` | Customer `Alice Smith`<br>(`Tower A, Apt 402`) | `/tickets` | Resident service request submission, My Tickets status tracker, and customer-confirmed resolution verification |

---

## How to Re-Seed or Reset Test Accounts

If you ever reset the database or want to ensure all test accounts and default service categories exist:

```powershell
cd backend
uv run python -m smart_helpdesk.db.seed_users
```

*Note: The seed utility is fully idempotent and safe to run multiple times without duplicating data.*
