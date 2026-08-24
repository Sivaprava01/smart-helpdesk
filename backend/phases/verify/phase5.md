# Phase 5 Verification Documentation: Technician Assignment, Lifecycle Actions, and Fallback Rerouting

This document provides a comprehensive report of the completed Phase 5 implementation in accordance with [`backend/phases/phase5.md`](../phase5.md).

---

## 1. Phase 5 Objective

Phase 5 transforms the deterministic routing recommendations of Phase 4 into an actionable assignment and lifecycle management workflow. It supports dispatching offers, technician acceptance, non-punitive declines, deferrals ("Ask me later"), automated response timeout handling, and live fallback rerouting without ever relying on stale ranking snapshots.

---

## 2. Core Architecture & State Machine

### A. Ticket Status vs Assignment Status Separation
- **`TicketStatus`** represents the high-level status of the customer's maintenance request:
  - `PENDING`: Service request raised or waiting for available technicians.
  - `ROUTING`: An assignment offer is currently active with a candidate technician.
  - `ASSIGNED`: An offer has been accepted by a technician.
  - `CANCELLED`: Cancelled by the customer.
- **`AssignmentStatus`** represents an individual offer attempt to a specific technician:
  - `OFFERED`: Initial offer created with a 10-minute response deadline (`expires_at`).
  - `DEFERRED`: Technician chose "Ask me later"; response deadline preserved.
  - `ACCEPTED`: Technician agreed to perform the work; increments workload.
  - `DECLINED`: Technician rejected offer with optional reason and note; triggers live fallback.
  - `EXPIRED`: Response deadline passed without acceptance; triggers live fallback.
  - `CANCELLED`: Ticket was cancelled while an offer was pending.

```text
PENDING TICKET
      ↓
ROUTING ENGINE (Live Data)
      ↓
BEST CURRENT TECHNICIAN
      ↓
CREATE OFFER (`OFFERED`, `expires_at = now + 10m`)
      ↓
   ┌───────────────┬────────────────┬───────────────┐
   ↓               ↓                ↓               ↓
ACCEPT          DECLINE        ASK LATER        NO RESPONSE
   ↓               ↓                ↓               ↓
ASSIGNED       REROUTE       WAIT UNTIL        EXPIRE
   │               ↓            DEADLINE          ↓
   │          LIVE DATA             │          REROUTE
   │               ↓                ↓             ↓
   │          NEW TECHNICIAN     EXPIRE        NEW BEST
   │               ↓                ↓          TECHNICIAN
   └───────────────┴────────────────┴──────────────┘
```

---

## 3. Key Operational Rules & Guarantees

### 1. Workload Consistency
- Workload `current_workload` is **only** incremented when an assignment transitions to `ACCEPTED`.
- Creating an offer (`OFFERED`), deferring (`DEFERRED`), declining (`DECLINED`), or timing out (`EXPIRED`) leaves workload untouched.
- All state changes for acceptance (Assignment -> `ACCEPTED`, Ticket -> `ASSIGNED`, Technician -> `current_workload + 1`) are executed in a single atomic database transaction.

### 2. Live Fallback Rerouting (No Stale Rankings)
- Fallback does **not** reuse old ranking lists from when the ticket was created.
- When an offer is declined or expires, the fallback service:
  1. Gathers all technician IDs previously attempted for this ticket.
  2. Queries the live current state of all technicians (`is_active`, `is_on_duty`, `current_workload < max_workload`).
  3. Prunes previously attempted technicians so they are not immediately retried.
  4. Runs eligibility and deterministic ranking against live data.
  5. Creates a new offer for the best current candidate, or resets ticket to `PENDING` if no candidates are available.

### 3. Ask-Me-Later (Deferred Offers)
- When a technician chooses "Ask me later", the assignment transitions to `DEFERRED`.
- The original response deadline (`expires_at`) is **preserved** to prevent indefinite blocking of customer requests.
- No secondary offers are created while a deferred offer remains active.
- The technician can accept or decline at any time before the deadline expires.

### 4. Active Offer Guard & Race Condition Protection
- At most **one** active offer (`OFFERED` or `DEFERRED`) can exist for a ticket at any time.
- Starting an assignment on a ticket with an active offer raises `BusinessRuleError`.
- If an offer has expired or already been accepted, subsequent accept attempts are rejected.

### 5. Scheduled Ticket Protection
- If a ticket is scheduled for the future (`is_scheduled=True`, `scheduled_for > now`), `start_assignment` raises a business rule error to protect against premature dispatch before the scheduled time.

---

## 4. Endpoints Added

| HTTP Verb | Path | Summary | Description |
|---|---|---|---|
| `POST` | `/api/v1/tickets/{ticket_id}/assign` | Start Ticket Assignment | Evaluates routing and dispatches offer to top candidate |
| `GET` | `/api/v1/tickets/{ticket_id}/assignments` | Get Ticket Assignment History | Returns all historical assignment attempts for a ticket |
| `POST` | `/api/v1/assignments/{assignment_id}/accept` | Accept Assignment Offer | Accepts offer, sets ticket to `ASSIGNED`, increments workload |
| `POST` | `/api/v1/assignments/{assignment_id}/decline` | Decline Assignment Offer | Declines offer and immediately triggers live fallback |
| `POST` | `/api/v1/assignments/{assignment_id}/ask-later` | Defer Assignment Offer | Defers decision while preserving response deadline |
| `POST` | `/api/v1/assignments/process-expired` | Process Expired Offers | Expires timed-out offers and reroutes affected tickets |

---

## 5. Schema Migrations

- **Migration**: `0003_add_assignment_deferred_and_decline_note.py`
  - Added `decline_note` (`TEXT`, nullable) to `technician_assignments`.
  - Added `deferred_at` (`TIMESTAMPTZ`, nullable) to `technician_assignments`.
  - Updated `AssignmentStatus` enum with `DEFERRED`.

---

## 6. What is Intentionally NOT Implemented (Reserved for Future Phases)

- **No Resolution / Confirmation Lifecycle**: Work arrival, completion verification, customer feedback, rating recalculation (Phase 6).
- **No Async Background Schedulers**: Redis, Celery, automated cron workers (timeout endpoint is explicitly triggerable for V1 demonstration).
- **No External Communication**: Real SMS, push notifications, or email dispatch.
- **No Automatic Technician Suspension**: Declines are recorded for historical analytics without arbitrary punitive locks.
- **No Authentication / Authorization**: Login, signup, JWT, OAuth (Phase scope boundary respected).

---

## 7. Postman / Manual Test Walkthrough

1. **Create Category & Customer**:
   - `POST /api/v1/categories` with `{"name": "Plumbing"}`
   - `POST /api/v1/customers` with `{"full_name": "Siva", "email": "siva@example.com", "phone_number": "+919876543210"}`
2. **Create Technicians**:
   - Ravi (Rank #1): `is_on_duty: true`, `current_zone: "Tower A"`, `category_ids: ["<PLUMBING_ID>"]`
   - Kumar (Rank #2): `is_on_duty: true`, `current_zone: "Tower D"`, `category_ids: ["<PLUMBING_ID>"]`
3. **Create Ticket**:
   - `POST /api/v1/tickets` with `{"customer_id": "<CUST_ID>", "category_id": "<CAT_ID>", "contact_name": "Siva", "contact_phone": "+919876543210", "description": "Bathroom leak", "location": "Tower A"}`
4. **Initial Dispatch**:
   - `POST /api/v1/tickets/<TICKET_ID>/assign`
   - Response: Ravi receives `OFFERED` assignment, ticket becomes `ROUTING`.
5. **Decline & Fallback Demo**:
   - `POST /api/v1/assignments/<RAVI_ASSIGNMENT_ID>/decline` with `{"reason": "BUSY", "note": "Finishing another job"}`
   - Response: Ravi is `DECLINED`, Kumar receives new `OFFERED` assignment.
6. **Accept Demo**:
   - `POST /api/v1/assignments/<KUMAR_ASSIGNMENT_ID>/accept`
   - Response: Kumar is `ACCEPTED`, ticket becomes `ASSIGNED`, Kumar's workload increments to 1.
7. **View Assignment Audit History**:
   - `GET /api/v1/tickets/<TICKET_ID>/assignments`
   - Response: Contains both Ravi's declined attempt and Kumar's accepted assignment.
