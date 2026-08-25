# Frontend Multi-Role Routing, Navigation & Authentication Architecture

This document describes the role-based navigation, route guards, demo fast-switcher presets, and post-login redirection for **Smart-HelpDesk**.

---

## 1. Role-Based Navigation & Route Access Matrix

| Route | Allowed Roles | Default Component | Purpose |
|---|---|---|---|
| `/` | Public | `LandingPage` | Operational marketing & overview |
| `/login` | Public | `LoginPage` | Email/password sign-in & Google OAuth |
| `/register` | Public | `RegisterPage` | Resident account creation |
| `/dashboard` | `ADMIN`, `DISPATCHER` | `DashboardPage` | Real-time queue, KPI metrics, specialist capacity |
| `/tickets` | `ADMIN`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER` | `TicketListPage` | Searchable ticket data table & status filters |
| `/tickets/new` | `ADMIN`, `DISPATCHER`, `CUSTOMER` | `CreateTicketPage` | Submit service request |
| `/tickets/:id` | `ADMIN`, `DISPATCHER`, `TECHNICIAN`, `CUSTOMER` | `TicketDetailPage` | Detailed lifecycle, audit trail, resolution review |
| `/technicians` | `ADMIN`, `DISPATCHER` | `TechnicianCapacityPage` | Shift toggles, skills, max workload limits |
| `/categories` | `ADMIN`, `DISPATCHER` | `CategoriesPage` | Service domains (Plumbing, Electrical, HVAC, etc.) |
| `/customers` | `ADMIN`, `DISPATCHER` | `CustomersPage` | Resident directory & locations |
| `/routing` | `ADMIN`, `DISPATCHER` | Phase 3 Placeholder | Deterministic candidate scoring & timeout monitor |
| `/technician/jobs` | `ADMIN`, `TECHNICIAN` | Phase 4 Placeholder | Technician field portal, offer timers, execution logs |

---

## 2. Dynamic Post-Login Redirection

When a user submits their credentials on `/login`:
1. The backend returns a signed JWT access token and the user's verified profile (`res.user`).
2. The frontend checks if a specific redirect was requested (via `location.state.from`).
3. If no specific URL was requested, the user is redirected to their role's natural destination:
   - **`ADMIN` / `DISPATCHER`** $\rightarrow$ `/dashboard` (Operations Command Center)
   - **`TECHNICIAN`** $\rightarrow$ `/technician/jobs` (Field Work Portal)
   - **`CUSTOMER`** $\rightarrow$ `/tickets` (Resident Requests Hub)

---

## 3. Demo Fast-Switcher Presets

On the `/login` screen (recreated from Stitch `0307e6bc7f9f4be280b97c8048d0a93d`), 4 quick-fill buttons are integrated:
- `[ 🛡️ Admin ]` $\rightarrow$ fills `admin@smarthelpdesk.com` / `AdminPass123!`
- `[ 📋 Dispatcher ]` $\rightarrow$ fills `dispatcher@smarthelpdesk.com` / `DispatchPass123!`
- `[ 🔧 Technician ]` $\rightarrow$ fills `tech.ravi@smarthelpdesk.com` / `TechPass123!`
- `[ 🏠 Resident ]` $\rightarrow$ fills `resident.alice@smarthelpdesk.com` / `ResidentPass123!`

*Security Note:* The preset buttons only populate the form fields. Submitting the form performs authentic backend authentication with real JWT token issuance.


---------------------



  ROLE        EMAIL                          PASSWORD
------------------------------------------------------------------
  ADMIN       admin@smarthelpdesk.com        AdminPass123!
  DISPATCHER  dispatcher@smarthelpdesk.com   DispatchPass123!
  TECHNICIAN  tech.ravi@smarthelpdesk.com    TechPass123!
  CUSTOMER    resident.alice@smarthelpdesk.com ResidentPass123!