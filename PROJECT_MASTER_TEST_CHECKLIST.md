# Smart-HelpDesk: Master End-to-End Testing & Verification Checklist

**Project:** Smart-HelpDesk Multi-Role Operations & Deterministic Dispatching Platform  
**Target Environment:** Local Development / Staging  
**Backend:** FastAPI + PostgreSQL + SQLAlchemy + Alembic (`http://localhost:8000`)  
**Frontend:** React 19 + Vite 6 + Vanilla CSS / Design Tokens (`http://localhost:5173`)  
**Document Version:** 1.0.0 (Master Release)

---

## 📖 How to Use This Checklist

1. Start your backend (`python -m uvicorn smart_helpdesk.main:app --reload --port 8000`) and frontend (`npm run dev`).
2. Ensure database is seeded: `cd backend && uv run python -m smart_helpdesk.db.seed_users`.
3. Work through each role checklist sequentially. For every feature, tick the checkbox `[ ]` $\rightarrow$ `[x]` as you confirm the UI, API network requests, backend state transitions, and PostgreSQL database records.
4. Execute the **Cross-Role End-to-End Scenarios** to test full lifecycle transitions across accounts.
5. Verify PostgreSQL database records using the exact SQL queries provided.

---

## 🔑 Reference Test Accounts (`user.md`)

| Role | Persona | Email (Username) | Password | Default Landing | Database Linkage |
|---|---|---|---|---|---|
| **`ADMIN`** | Platform Administrator | `admin@smarthelpdesk.com` | `AdminPass123!` | `/dashboard` | Global Superuser (`users.role = 'ADMIN'`) |
| **`DISPATCHER`** | Operations Dispatcher | `dispatcher@smarthelpdesk.com` | `DispatchPass123!` | `/dashboard` | Operations Staff (`users.role = 'DISPATCHER'`) |
| **`TECHNICIAN`** | Ravi Kumar | `tech.ravi@smarthelpdesk.com` | `TechPass123!` | `/technician/jobs` | `users.technician_id` $\rightarrow$ `technicians.id` |
| **`CUSTOMER`** | Alice Smith | `resident.alice@smarthelpdesk.com` | `ResidentPass123!` | `/tickets` | `users.customer_id` $\rightarrow$ `customers.id` |

---

# SECTION 1: ROLE 1 — PLATFORM ADMINISTRATOR (`ADMIN`)

The **Administrator** has full global permissions across all operational dashboards, master data entities, service categories, routing simulations, technician capacity settings, and ticket lifecycles.

### 1.1 Authentication, Login & Session
- [ done ] **Admin Login**: Navigate to `/login`, click `[ 🛡️ Admin ]` demo preset (or enter `admin@smarthelpdesk.com` / `AdminPass123!`), and submit.
  - [ done ] Request: `POST /api/v1/auth/login` returns `200 OK` with `access_token`, `refresh_token`, and `user.role === 'ADMIN'`.
  - [done  ] Redirect: Automatically redirects to `/dashboard`.
  - [done ] Persistence: Refreshing browser (`F5`) stays logged in on `/dashboard` without returning to `/login` (`GET /api/v1/auth/me` validates session).
- [ done] **Admin Navigation Scope**: Inspect `Sidebar`:
  - [ ] Admin sees: `Operations Dashboard`, `Ticket Hub`, `Technician Capacity`, `Routing Engine`, `Resident Directory`, `Service Categories`, `Technician Field Portal ('My Jobs')`.
  - [ ] Admin profile badge at bottom displays `ADMIN` with initials `AD`.
- [ ] **Logout Flow**: Click `Sign Out` button in sidebar.
  - [ ] Clears tokens from memory and redirects to `/login`.
  - [ ] Direct navigation to `/dashboard` or `/technicians` redirects back to `/login`.

---

### 1.2 Operations & Dispatch Dashboard (`/dashboard`)
- [ ] **KPI Metrics Bar**:
  - [ ] `Active Ticket Queue` displays total tickets in non-terminal states.
  - [ ] `Pending Dispatch` displays tickets in `PENDING` status.
  - [ ] `Critical / Emergency` displays tickets with `is_urgent === true`.
  - [ ] `Active Specialists` displays total on-duty technicians.
- [ ] **Live Operations Queue Table**:
  - [ ] Lists active tickets with Ticket ID, Category badge, Priority pill, Customer Name, and Status Badge.
  - [ ] Clicking any ticket row navigates to `/tickets/{id}`.
  - [ ] Status filters (`All`, `Pending`, `Assigned`, `In Progress`, `Reopened`) filter the table in real-time.
- [ ] **Specialist Capacity Gauges Widget**:
  - [ ] Displays active technicians with on/off duty status dots.
  - [ ] Displays workload progress bars (`current_workload / max_workload`).
- [ ] **Expired Offers Scanner**:
  - [ ] Click `[ Scan Expired Offers ]` button.
  - [ ] Network: Sends `POST /api/v1/assignments/process-expired`.
  - [ ] Toast notification appears indicating expired count and rerouting summary.

---

### 1.3 Service Categories Management (`/categories`)
- [ ] **Category List**:
  - [ ] Network: `GET /api/v1/service-categories` returns `200 OK`.
  - [ ] Displays default categories (`Plumbing`, `Electrical`, `HVAC`, `Carpentry`, `Appliance Repair`, `Cleaning`, `Painting`).
- [ ] **Create New Category**:
  - [ ] Click `+ Add Category`, enter name (e.g., `Pest Control`), and submit.
  - [ ] Network: `POST /api/v1/service-categories` returns `201 Created`.
  - [ ] SQL Check: `SELECT * FROM service_categories WHERE name = 'Pest Control';` returns the new record.
- [ ] **Toggle Category Active State**:
  - [ ] Toggle active switch for a category.
  - [ ] Network: `PATCH /api/v1/service-categories/{id}` with `{ "is_active": false }`.
  - [ ] Inactive category is greyed out and cannot be chosen on `/tickets/new`.

---

### 1.4 Resident Directory (`/customers`)
- [ ] **Customer Directory View**:
  - [ ] Network: `GET /api/v1/customers` returns `200 OK`.
  - [ ] Displays resident cards with Name, Email, Phone, Age, Default Location (e.g., `Tower A, Apt 402`), and Active badge.
- [ ] **Create New Customer**:
  - [ ] Click `+ Add Resident`, fill details: Name: `John Resident`, Email: `john.res@example.com`, Phone: `+1-555-9090`, Location: `Tower B, Apt 101`, Age: `34`.
  - [ ] Network: `POST /api/v1/customers` returns `201 Created`.
  - [ ] SQL Check: `SELECT * FROM customers WHERE email = 'john.res@example.com';` exists with correct columns.

---

### 1.5 Technician Capacity & Zone Management (`/technicians`)
- [ ] **Technician Management Grid**:
  - [ ] Network: `GET /api/v1/technicians` returns `200 OK`.
  - [ ] Displays technicians with Zone tag (`Tower A`), Star Rating, Workload capacity bar, and Skill chips.
- [ ] **Shift Status Toggle**:
  - [ ] Click `Go Off Duty` on technician card.
  - [ ] Network: `PATCH /api/v1/technicians/{id}` with `{ "is_on_duty": false }`.
  - [ ] Card updates to `Off Duty` with grey badge.
  - [ ] SQL Check: `SELECT is_on_duty FROM technicians WHERE id = '...';` returns `false`.
- [ ] **Workload & Zone Reconfiguration**:
  - [ ] Click `Edit`, change `current_zone` to `Tower B` and `max_workload` to `6`.
  - [ ] Network: `PATCH /api/v1/technicians/{id}` returns `200 OK`.
  - [ ] SQL Check: `SELECT current_zone, max_workload FROM technicians WHERE id = '...';` reflects update.

---

### 1.6 Routing Engine & Fallback Monitor (`/routing`)
- [ ] **Routing Queue Table**:
  - [ ] Filter tabs (`All`, `Routing`, `Pending`, `Reopened`) correctly segment tickets.
  - [ ] Response timer displays live 15-minute countdown clock for tickets in `ROUTING` status.
- [ ] **Deterministic Routing Inspector**:
  - [ ] Click any ticket row in the queue table.
  - [ ] Side panel loads `GET /api/v1/tickets/{id}/routing-preview`.
  - [ ] Displays `#1 Recommended Candidate` with total score out of 100.
  - [ ] Visualizes 5-factor scoring progress bars:
    - [ ] Proximity Score (20% weight)
    - [ ] Overall Rating Score (25% weight)
    - [ ] Customer History Affinity Score (25% weight)
    - [ ] Reopen Reliability Score (15% weight)
    - [ ] Workload Capacity Score (15% weight)
  - [ ] Displays Excluded Technicians with explicit reasons (`Off-duty`, `Max workload reached`, `Skill mismatch`, `Previously declined / reopened technician`).
  - [ ] Action: Click `Dispatch Offer to Top Specialist` $\rightarrow$ calls `POST /api/v1/assignments/ticket/{id}/start` and dispatches offer.

---

# SECTION 2: ROLE 2 — OPERATIONS DISPATCHER (`DISPATCHER`)

The **Dispatcher** monitors the live operations queue, inspects candidate routing rankings, dispatches tickets, and manages master data, without platform superuser privileges.

### 2.1 Authentication & Scope
- [ ] **Dispatcher Login**: Sign in with `dispatcher@smarthelpdesk.com` / `DispatchPass123!`.
  - [ ] Network: `POST /api/v1/auth/login` returns `user.role === 'DISPATCHER'`.
  - [ ] Redirect: Automatically redirects to `/dashboard`.
- [ ] **Dispatcher Navigation Scope**:
  - [ ] Sees: `Operations Dashboard`, `Ticket Hub`, `Routing Engine`, `Technician Capacity`, `Resident Directory`, `Service Categories`.
  - [ ] Profile badge shows `DISPATCHER`.

### 2.2 Operational Dispatch Workflow
- [ ] **Inspect Pending Ticket**: Go to `/tickets`, filter by `PENDING`.
- [ ] **Open Routing Preview**: Click `Preview Routing` on ticket details (`/tickets/{id}`).
  - [ ] Modal opens and displays deterministic candidate breakdown.
- [ ] **Dispatch Ticket**: Click `Dispatch Offer`.
  - [ ] Network: `POST /api/v1/assignments/ticket/{id}/start` returns `200 OK`.
  - [ ] Ticket transitions: `status` becomes `ROUTING`.
  - [ ] New assignment created: `status` is `OFFERED`.

---

# SECTION 3: ROLE 3 — FIELD SERVICE SPECIALIST (`TECHNICIAN`)

The **Technician** uses the mobile-first **Technician Portal ('My Jobs')** to receive 15-minute assignment offers, accept/defer/decline jobs, and execute sequential field milestones on-site.

### 3.1 Authentication & Field Portal Landing
- [ ] **Technician Login**: Sign in with `tech.ravi@smarthelpdesk.com` / `TechPass123!`.
  - [ ] Network: `POST /api/v1/auth/login` returns `user.role === 'TECHNICIAN'`, `user.technician_id = '<ravi_uuid>'`.
  - [ ] Redirect: Automatically redirects to `/technician/jobs`.
- [ ] **Navigation & Guard Check**:
  - [ ] Sidebar shows only: `My Field Jobs` and `Ticket Hub`.
  - [ ] Attempting to navigate directly to `/dashboard`, `/technicians`, `/categories`, or `/customers` shows the access restriction guard.

---

### 3.2 Shift & Workload Controls
- [ ] **Duty Toggle**:
  - [ ] Click `Go On Duty` / `Go Off Duty` button.
  - [ ] Network: `PATCH /api/v1/technicians/{id}` updates `is_on_duty`.
  - [ ] Duty indicator dot pulses green when on-duty.
- [ ] **Capacity Progress Bar**:
  - [ ] Workload bar shows `X / Max Jobs` matching `technicians.current_workload` vs `technicians.max_workload`.

---

### 3.3 Assignment Offer Responses (15-Minute Expiry Window)
When a ticket is dispatched to this technician:
- [ ] **Active Job Offer Card (`#WO-XXXX`)**:
  - [ ] Appears with red highlight and `URGENT` / `NEW JOB OFFER` badge.
  - [ ] 15-minute countdown clock ticks down in real-time (`09:59` $\rightarrow$ `09:58`).
  - [ ] Displays Category icon, Resident Unit location, and Problem description.
- [ ] **Action 1: Accept Job**:
  - [ ] Click `[ Accept Job ]`.
  - [ ] Network: `POST /api/v1/assignments/{assignment_id}/accept?technician_id={tech_id}` returns `200 OK`.
  - [ ] State Changes:
    - [ ] `tickets.status` $\rightarrow$ `ASSIGNED`
    - [ ] `technician_assignments.status` $\rightarrow$ `ACCEPTED`
    - [ ] `technicians.current_workload` increments by `+1`
  - [ ] Active Offer Card disappears and the **Current Execution Stepper** appears immediately.
- [ ] **Action 2: Ask Me Later (Defer)**:
  - [ ] Click `[ Ask Later ]`.
  - [ ] Network: `POST /api/v1/assignments/{assignment_id}/ask-later` returns `200 OK`.
  - [ ] State Changes:
    - [ ] `technician_assignments.status` $\rightarrow$ `DEFERRED`
    - [ ] Original response deadline (`expires_at`) is strictly preserved.
    - [ ] Card shows `DEFERRED (ASK ME LATER)` badge until accepted or expired.
- [ ] **Action 3: Decline Job with Structured Reason**:
  - [ ] Click `[ Decline ]`.
  - [ ] Modal opens: Select reason `BUSY` ("Currently Busy on Another Task") and enter note *"Working on emergency boiler"*.
  - [ ] Click `Confirm Decline`.
  - [ ] Network: `POST /api/v1/assignments/{assignment_id}/decline` with payload `{ "reason": "BUSY", "note": "..." }`.
  - [ ] State Changes:
    - [ ] `technician_assignments.status` $\rightarrow$ `DECLINED`
    - [ ] `technician_assignments.decline_reason` $\rightarrow$ `'BUSY'`
    - [ ] Automated fallback is triggered immediately to candidate #2.
    - [ ] Offer disappears from Ravi's portal.

---

### 3.4 Sequential Field Service Execution Stepper
When a job is accepted (`status === 'ASSIGNED'`):
- [ ] **Milestone 1: Mark Arrived at Location**:
  - [ ] Card header displays `CURRENT EXECUTION` with stepper at Step 1 (`Dispatched`).
  - [ ] Click `[ 📍 I Have Arrived ]`.
  - [ ] Network: `POST /api/v1/tickets/{id}/arrive?technician_id={tech_id}` returns `200 OK`.
  - [ ] State Changes:
    - [ ] `tickets.status` $\rightarrow$ `ARRIVED`
    - [ ] `technician_assignments.arrived_at` timestamp is recorded.
    - [ ] Stepper updates to Step 2 (`Arrived`).
- [ ] **Milestone 2: Start Service Work**:
  - [ ] Click `[ 🔧 Start Work ]`.
  - [ ] Network: `POST /api/v1/tickets/{id}/start-work?technician_id={tech_id}` returns `200 OK`.
  - [ ] State Changes:
    - [ ] `tickets.status` $\rightarrow$ `IN_PROGRESS`
    - [ ] `technician_assignments.work_started_at` timestamp is recorded.
    - [ ] Stepper updates to Step 3 (`Working`).
- [ ] **Milestone 3: Complete Work**:
  - [ ] Click `[ ✅ Complete Work ]`.
  - [ ] Modal opens: Enter resolution summary (e.g. *"Replaced faulty O-ring gasket on water valve and pressure-tested lines"*).
  - [ ] Click `Submit & Request Resident Review`.
  - [ ] Network: `POST /api/v1/tickets/{id}/complete-work` with payload `{ "completion_notes": "..." }`.
  - [ ] State Changes:
    - [ ] `tickets.status` $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION`
    - [ ] `technician_assignments.work_completed_at` timestamp is recorded.
    - [ ] `technician_assignments.completion_note` is saved.
    - [ ] Stepper reaches Step 4 (`Completed • Awaiting Resident Confirmation`).

---

# SECTION 4: ROLE 4 — APARTMENT RESIDENT (`CUSTOMER`)

The **Resident / Customer** raises service requests, monitors repair progress, and confirms final job resolution with star ratings and reviews.

### 4.1 Authentication & Resident Scope
- [ ] **Resident Login**: Sign in with `resident.alice@smarthelpdesk.com` / `ResidentPass123!`.
  - [ ] Network: `POST /api/v1/auth/login` returns `user.role === 'CUSTOMER'`, `user.customer_id = '<alice_uuid>'`.
  - [ ] Redirect: Automatically redirects to `/tickets` (`My Tickets`).
- [ ] **Navigation & Guard Check**:
  - [ ] Sidebar shows: `My Tickets` and `+ Request Service`.
  - [ ] No access to administrative or routing menus.

---

### 4.2 Resident Service Request Creation (`/tickets/new`)
- [ ] **Form Navigation**: Click `Request Service`.
- [ ] **Select Service Category**:
  - [ ] Category cards (Plumbing, Electrical, HVAC, etc.) are selectable with active indigo highlight border.
- [ ] **Fill Problem Description**:
  - [ ] Title: *"Kitchen Sink Leaking Under Cabinet"*
  - [ ] Description: *"Water pooling rapidly under kitchen pipe fitting when tap is on."*
- [ ] **Timing Preference & Validation**:
  - [ ] Choose `ASAP (Immediate Service)` or `Schedule for Future`.
  - [ ] If Scheduled is chosen, date picker validates that past dates cannot be selected.
- [ ] **Urgency Flag**: Toggle `Emergency / Urgent Request` checkbox.
- [ ] **Submit Request**:
  - [ ] Click `Submit Service Request`.
  - [ ] Network: `POST /api/v1/tickets` returns `201 Created` with `status === 'PENDING'`.
  - [ ] Toast appears and user is redirected to the ticket details hub (`/tickets/{id}`).
  - [ ] SQL Check: `SELECT * FROM tickets WHERE title = 'Kitchen Sink Leaking Under Cabinet';` exists.

---

### 4.3 Ticket Tracking & Customer Resolution Verification (`/tickets/{id}`)
- [ ] **Lifecycle Stepper**:
  - [ ] Stepper visualizes the live ticket state: `PENDING` $\rightarrow$ `ROUTING` $\rightarrow$ `ASSIGNED` $\rightarrow$ `ARRIVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION`.
- [ ] **Cancel Ticket**: If ticket is still `PENDING`, resident can click `Cancel Ticket` $\rightarrow$ `POST /api/v1/tickets/{id}/cancel` $\rightarrow$ `status` becomes `CANCELLED`.
- [ ] **Resolution Verification Card**:
  - [ ] Appears when ticket reaches `AWAITING_CUSTOMER_CONFIRMATION`.
  - [ ] Asks: *"Was your service issue successfully resolved?"*
  - [ ] **Flow A (Resolution Confirmed - YES)**:
    - [ ] Click `[ 👍 Yes, Issue Resolved ]`.
    - [ ] 5-Star Rating Selector appears: Select `5 Stars` (Outstanding Service) and enter praise *"Quick and clean repair"*.
    - [ ] Click `Confirm Resolution & Submit Feedback`.
    - [ ] Network: `POST /api/v1/tickets/{id}/customer-response` with `{ "was_issue_resolved": true, "rating": 5, "comment": "..." }`.
    - [ ] State Changes:
      - [ ] `tickets.status` $\rightarrow$ `RESOLVED`
      - [ ] `ticket_feedback` record is inserted with `rating = 5`
      - [ ] `technicians.overall_rating`, `technicians.rating_sum`, `technicians.rating_count`, and `technicians.completed_jobs_count` are recalculated.
      - [ ] `technicians.current_workload` is decremented (`-1`).
  - [ ] **Flow B (Resolution Unresolved - NO / Reopen Flow)**:
    - [ ] Click `[ 👎 No, Problem Persists ]`.
    - [ ] Form appears: *"What is still wrong?"* $\rightarrow$ enter *"Sink is still dripping slowly after technician left"*.
    - [ ] Click `Reopen Ticket & Dispatch Alternate Specialist`.
    - [ ] Network: `POST /api/v1/tickets/{id}/customer-response` with `{ "was_issue_resolved": false, "comment": "..." }`.
    - [ ] State Changes:
      - [ ] `tickets.status` $\rightarrow$ `REOPENED`
      - [ ] `technicians.reopened_jobs_count` increments by `+1`.
      - [ ] `technicians.current_workload` is released (`-1`).
      - [ ] Automated fallback reroute evaluates candidates, excluding the previous technician (`Ravi Kumar`), and assigns candidate #2!

---

# SECTION 5: GOOGLE OAUTH 2.0 (PENDING / TO BE POLISHED)

> [!WARNING]
> **STATUS: PENDING / TO BE FIXED**  
> Google OAuth 2.0 routes and schemas are implemented in backend and frontend, but requires Google Cloud Console Client ID & Secret credentials verification.

- [ ] **OAuth URL Generation**: Click `Sign in with Google` on `/login`.
  - [ ] Network: `GET /api/v1/auth/oauth/google/url` returns `200 OK` with Google authorization URL.
- [ ] **Redirect to Google**: Browser navigates to `accounts.google.com`.
- [ ] **Callback Handling**: After consent, redirects to `/auth/google/callback?code=...`.
  - [ ] Frontend exchanges code via `POST /api/v1/auth/oauth/google/callback`.
  - [ ] Verifies or auto-provisions user record and customer profile.

---

# SECTION 6: CROSS-ROLE END-TO-END SCENARIOS

Execute these full cross-role flows using the real system:

---

### E2E Scenario 1: The Complete Happy Path (Ticket $\rightarrow$ Completion $\rightarrow$ 5-Star Resolution)
1. **Resident Alice** logs in $\rightarrow$ creates a Plumbing ticket *"Toilet valve leaking in master bath"* (ASAP).
2. **Dispatcher** logs in $\rightarrow$ views ticket on `/dashboard` $\rightarrow$ inspects deterministic scores $\rightarrow$ dispatches offer to top candidate **Ravi Kumar**.
3. **Technician Ravi** logs in $\rightarrow$ sees urgent offer on `/technician/jobs` $\rightarrow$ clicks `Accept Job` within 15 mins.
4. **Technician Ravi** travels to site $\rightarrow$ clicks `I Have Arrived` (`status` becomes `ARRIVED`).
5. **Technician Ravi** begins repair $\rightarrow$ clicks `Start Work` (`status` becomes `IN_PROGRESS`).
6. **Technician Ravi** finishes work $\rightarrow$ clicks `Complete Work` and submits completion notes.
7. **Resident Alice** logs in $\rightarrow$ opens ticket $\rightarrow$ sees `Awaiting Confirmation` $\rightarrow$ clicks `Yes, Issue Resolved` $\rightarrow$ gives 5 Stars.
8. **Verification**:
   - [ ] Ticket `status` is `RESOLVED`.
   - [ ] Assignment `status` is `COMPLETED`.
   - [ ] Technician Ravi's `rating_count` incremented by 1, `current_workload` returned to 0.
   - [ ] Feedback visible under Resident Feedback History on ticket page.

---

### E2E Scenario 2: Technician Declines $\rightarrow$ Automated Fallback Rerouting
1. **Dispatcher** dispatches a ticket to Technician #1 (e.g., Ravi).
2. **Technician Ravi** logs in $\rightarrow$ clicks `Decline` with reason `BUSY`.
3. **Verification**:
   - [ ] Assignment #1 marked `DECLINED` with reason `BUSY`.
   - [ ] System automatically calculates candidate #2 and creates Assignment #2 in `OFFERED` status.
   - [ ] Ticket remains in `ROUTING` status with new 15-min countdown timer.
   - [ ] Assignment timeline shows Attempt #1 (`DECLINED`) and Attempt #2 (`OFFERED`).

---

### E2E Scenario 3: Offer Times Out $\rightarrow$ Expired Sweep Rerouting
1. **Dispatcher** dispatches a ticket to a technician.
2. Technician does not respond within 15 minutes.
3. **Dispatcher** clicks `Scan Expired Offers` on `/dashboard` or `/routing` (`POST /api/v1/assignments/process-expired`).
4. **Verification**:
   - [ ] Stale assignment marked `EXPIRED`.
   - [ ] Next eligible candidate receives offer.
   - [ ] Ticket timeline displays Attempt #1 (`EXPIRED`) and Attempt #2 (`OFFERED`).

---

### E2E Scenario 4: Resident Unresolved NO $\rightarrow$ Reopen $\rightarrow$ Alternate Specialist
1. A completed ticket is submitted to resident Alice.
2. **Resident Alice** clicks `No, Problem Persists` and submits explanation *"Water still pooling on floor"*.
3. **Verification**:
   - [ ] Ticket `status` moves to `REOPENED`.
   - [ ] Previous technician's `reopened_jobs_count` increments by 1.
   - [ ] Previous technician's `current_workload` decrements by 1.
   - [ ] Reopened feedback is logged.
   - [ ] Automated fallback routes ticket to an alternative technician (excluding Ravi due to reopen penalty rule).

---

### E2E Scenario 5: Security & Role Guard Enforcement
1. **Log in as Resident Alice** (`CUSTOMER`).
2. Attempt to manually navigate URL to `/dashboard`, `/technicians`, `/categories`, `/routing`.
3. **Verification**:
   - [ ] Frontend `ProtectedRoute` intercepts and displays Access Restricted card or redirects cleanly.
   - [ ] No unauthorized API data is leaked.
4. **Log in as Technician Ravi** (`TECHNICIAN`).
5. Attempt to navigate to `/customers` or `/categories`.
6. **Verification**: Access denied.

---

# SECTION 7: POSTGRESQL DATABASE VERIFICATION QUERIES

Run these queries in `psql` or pgAdmin to verify database consistency:

### Check User Accounts & Roles
```sql
SELECT id, email, role, is_active, is_verified, customer_id, technician_id 
FROM users 
ORDER BY role;
```

### Check Tickets Lifecycle & Assignments
```sql
SELECT t.id, t.title, t.status, t.is_urgent, c.full_name AS customer_name, tech.full_name AS technician_name, t.created_at
FROM tickets t
LEFT JOIN customers c ON t.customer_id = c.id
LEFT JOIN technicians tech ON t.technician_id = tech.id
ORDER BY t.created_at DESC;
```

### Check Assignment Attempts & History
```sql
SELECT a.id, a.ticket_id, tech.full_name, a.status, a.decline_reason, a.assigned_at, a.arrived_at, a.work_started_at, a.work_completed_at
FROM technician_assignments a
JOIN technicians tech ON a.technician_id = tech.id
ORDER BY a.created_at DESC;
```

### Check Resident Feedback & Star Ratings
```sql
SELECT f.id, f.ticket_id, c.full_name AS customer, tech.full_name AS technician, f.was_issue_resolved, f.rating, f.comment, f.created_at
FROM ticket_feedback f
JOIN customers c ON f.customer_id = c.id
JOIN technicians tech ON f.technician_id = tech.id
ORDER BY f.created_at DESC;
```

### Check Technician Capacity & Rating Metrics
```sql
SELECT id, full_name, is_on_duty, current_workload, max_workload, overall_rating, rating_sum, rating_count, completed_jobs_count, reopened_jobs_count
FROM technicians;
```

---

# SECTION 8: REGRESSION & BUILD INTEGRITY

- [ ] **Backend Test Suite**:
  - Run: `cd backend && uv run pytest -q`
  - Expected: **104 / 104 tests pass (100%)** with 0 errors.
- [ ] **Frontend Production Build**:
  - Run: `cd frontend && npm run build`
  - Expected: `vite build` completes with 0 errors and generates production bundle.
- [ ] **Console Cleanliness**:
  - No uncaught JavaScript errors or unhandled promise rejections in Chrome DevTools Console.
- [ ] **Backend Code Preservation**:
  - Confirm `git status` shows 0 backend source files modified.

---

# 🚀 FUTURE ENHANCEMENT SUGGESTIONS

Here is a curated roadmap of high-impact features to elevate Smart-HelpDesk into a cutting-edge platform:

### 1. AI & LLM Intelligence (RAG & Triage)
- **AI-Powered Ticket Auto-Triage & Classification**: Use Gemini / OpenAI LLM to analyze raw resident descriptions (e.g., *"My basement is flooding with murky water"*), automatically assign category (`Plumbing`), set urgency flag (`⚡ HIGH PRIORITY`), and generate concise diagnostics notes for the technician.
- **RAG-Powered Technician Troubleshooting Assistant**: Provide technicians with an AI diagnostic chat in the field referencing equipment manuals, past repair histories in that building, and manufacturer wiring diagrams.

### 2. Machine Learning & Predictive Dispatching
- **Predictive Job Duration Model**: Train a lightweight regression model (e.g. Scikit-learn / XGBoost) on historical repair times per category, technician, and building age to estimate exact job duration and calculate technician ETA.
- **Dynamic Candidate Weight Tuning**: Replace fixed formula weights (20/25/25/15/15) with an adaptive ML model that tunes ranking weights based on technician historical acceptance and completion success rates.

### 3. Real-Time WebSockets & Push Notifications
- **Live Push Dispatching**: Integrate FastAPI WebSockets so when an offer is dispatched, the technician's mobile portal chimes and pops up the offer card in real-time without polling.
- **Live Stepper Sync**: Instant real-time updates on resident's screen as technician marks Arrived, Started, and Completed.

### 4. Rich Media & Proof-of-Work Attachments
- **Resident Photos**: Allow residents to upload pictures/videos of the broken fixture when raising tickets.
- **Technician Before/After Photos**: Technicians upload before-and-after repair photos upon completing work.

### 5. Automated Background Worker
- **Celery / APScheduler Worker**: Run automated 30-second sweeps for `process-expired` to handle timeouts continuously in the background without requiring manual UI triggers.

### 6. Geolocation & Interactive Building Maps
- **Campus / Floor Map**: Integrate Leaflet / Mapbox to show real-time technician zone pins and building ticket clusters.
