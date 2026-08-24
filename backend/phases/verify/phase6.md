# Phase 6 Verification Documentation: Service Execution, Resolution, Customer Feedback & Reopening

This document provides a comprehensive report of the completed Phase 6 implementation according to [`backend/phases/phase6.md`](../phase6.md).

---

## 1. Phase 6 Objective & Scope

Phase 6 completes the core service delivery and resolution lifecycle of Smart-HelpDesk:
1. **On-Site Arrival**: Technician marks arrival (`ARRIVED`).
2. **Work Execution**: Technician starts work (`IN_PROGRESS`).
3. **Work Completion**: Technician marks job done (`AWAITING_CUSTOMER_CONFIRMATION`), which does **not** close the ticket.
4. **Customer Resolution Decision**: Customer verifies whether the issue is resolved.
5. **Feedback & Rating**: Quick, optional rating and comment submission.
6. **Metrics & History Updates**: Atomic updates to technician rating, reopen metrics, and customer-technician history.
7. **Ticket Closure vs. Reopen**: Successful resolution closes ticket; unsuccessful resolution releases previous technician, records reopen metrics, and triggers live alternative rerouting.

---

## 2. Complete Final Ticket & Assignment Lifecycles

### A. Ticket Status Lifecycle
```text
PENDING
    ↓
ROUTING (Assignment Offer Dispatched)
    ↓
ASSIGNED (Technician Accepts Offer)
    ↓
ARRIVED (Technician Marks On-Site Arrival)
    ↓
IN_PROGRESS (Technician Starts Work)
    ↓
AWAITING_CUSTOMER_CONFIRMATION (Technician Completes Work)
    ↓
CUSTOMER DECISION
    ├── RESOLVED: YES
    │       ↓
    │   FEEDBACK (Optional 1-5 Rating + Comment)
    │       ↓
    │   UPDATE HISTORY & TECHNICIAN RATING
    │       ↓
    │   RELEASE WORKLOAD
    │       ↓
    │   CLOSED
    │
    └── RESOLVED: NO
            ↓
        FEEDBACK (Optional Comment)
            ↓
        UPDATE NEGATIVE HISTORY & REOPEN COUNT
            ↓
        RELEASE PREVIOUS TECHNICIAN WORKLOAD
            ↓
        REOPENED
            ↓
        LIVE FALLBACK REROUTING (Excluding Attempted Technicians)
            ├── ALTERNATIVE FOUND → ROUTING (New Offer)
            └── NO ALTERNATIVE → REOPENED (Safely Unresolved)
```

### B. Assignment Status Separation
- `OFFERED`: Awaiting technician response within 10-minute deadline.
- `DEFERRED`: "Ask me later"; original deadline preserved.
- `ACCEPTED`: Offer accepted; workload incremented (+1).
- `DECLINED`: Offer rejected; live fallback triggered.
- `EXPIRED`: Offer timed out; live fallback triggered.
- `COMPLETED`: Work performed and customer resolution response recorded.

---

## 3. Key Design Decisions & Core Business Rules

### 1. Technician-Completed vs. Customer-Confirmed
A technician marking a job completed indicates that their physical work is finished. However, the ticket is **never** automatically closed at this point. The customer must confirm whether the problem was genuinely resolved. This protects customer trust, prevents premature closure of unresolved maintenance issues, and provides truthful quality signals for ranking.

### 2. Streamlined Feedback Experience
The feedback form is intentionally concise:
- Required: `was_issue_resolved: boolean`
- Optional: `rating: integer (1 to 5)`
- Optional: `comment: string (up to 1000 characters)`
Customers are never forced to write long paragraphs.

### 3. Sentiment Classification & Customer-Technician History
Pairwise interaction affinity in `CustomerTechnicianHistory` is updated based on:
- **Positive Experience**: `was_issue_resolved == True` and (`rating >= 4` or `rating is None`). Increments `positive_interactions` and `successful_jobs_count`.
- **Negative Experience**: `was_issue_resolved == False` or `rating <= 2`. Increments `negative_interactions`.
- **Neutral Experience**: `was_issue_resolved == True` and `rating == 3`. Increments `successful_jobs_count`.

### 4. Mathematical Overall Rating Calculation
Technician overall rating is calculated strictly from actual customer ratings using running sums:
$$\text{overall\_rating} = \frac{\text{rating\_sum}}{\text{rating\_count}}$$
- Skipped ratings (`rating = None`) do **not** inject synthetic values (no fake 0s or 5s). `rating_sum` and `rating_count` remain unchanged while `completed_jobs_count` increments.

### 5. Reopening, Metrics & Alternative Rerouting
When a customer responds with `was_issue_resolved == False`:
1. The previous technician's `completed_jobs_count` and `reopened_jobs_count` increment by 1 (used in reopen rate calculation: $\frac{\text{reopened\_jobs\_count}}{\text{completed\_jobs\_count}}$).
2. The previous technician's active workload is released (`current_workload -= 1`).
3. The previous technician's assignment is marked `COMPLETED` to preserve full audit history.
4. Rerouting evaluates **live current data** and strictly excludes the previous unsuccessful technician (and all prior attempted technicians for this ticket).
5. If an alternative technician is found, a new offer is created (`ROUTING`); if no candidate is available, the ticket remains safely in `REOPENED` with status `NO_ALTERNATIVE_TECHNICIAN_AVAILABLE`.

### 6. Feedback-to-Assignment Association
`TicketFeedback` includes both `ticket_id` and `assignment_id` with a `UniqueConstraint("assignment_id")`. This guarantees that if a ticket is reopened and serviced by multiple technicians across different attempts, each completed service attempt maintains its own distinct, immutable feedback record.

---

## 4. REST API Endpoint Reference (Phase 6 Additions)

| HTTP Verb | Path | Description |
|---|---|---|
| `POST` | `/api/v1/tickets/{ticket_id}/arrive` | Assigned technician marks on-site arrival (`ARRIVED`) |
| `POST` | `/api/v1/tickets/{ticket_id}/start-work` | Technician starts work after arrival (`IN_PROGRESS`) |
| `POST` | `/api/v1/tickets/{ticket_id}/complete-work` | Technician completes work (`AWAITING_CUSTOMER_CONFIRMATION`) |
| `POST` | `/api/v1/tickets/{ticket_id}/customer-response` | Customer submits resolution decision & optional rating/comment |
| `GET` | `/api/v1/tickets/{ticket_id}/feedback-history` | Retrieves all feedback submissions for the ticket |

---

## 5. Schema Migrations

- **Migration**: `0004_add_service_execution_and_feedback.py`
  - Added `rating_sum` (`NUMERIC(10, 2)`) and `rating_count` (`INTEGER`) to `technicians`.
  - Added `arrived_at`, `work_started_at`, `work_completed_at`, and `completion_note` to `technician_assignments`.
  - Created `ticket_feedbacks` table with foreign keys, indexes, rating check constraints, and unique constraint on `assignment_id`.

---

## 6. Postman Demonstration Walkthrough

### Demo A: Successful Service Flow
1. `POST /api/v1/tickets/{id}/assign` → Top technician Ravi receives `OFFERED` assignment.
2. `POST /api/v1/assignments/{id}/accept` → Ravi accepts; ticket becomes `ASSIGNED`, workload = 1.
3. `POST /api/v1/tickets/{id}/arrive` → Ticket becomes `ARRIVED`, `arrived_at` recorded.
4. `POST /api/v1/tickets/{id}/start-work` → Ticket becomes `IN_PROGRESS`, `work_started_at` recorded.
5. `POST /api/v1/tickets/{id}/complete-work` with `{"note": "Fixed gasket"}` → Ticket becomes `AWAITING_CUSTOMER_CONFIRMATION`.
6. `POST /api/v1/tickets/{id}/customer-response` with `{"was_issue_resolved": true, "rating": 5, "comment": "Great job"}`:
   - Ticket becomes `CLOSED`.
   - Ravi's workload released (0).
   - Ravi's rating updated to `5.00`.
   - Customer-technician positive history updated.

### Demo B: Reopen & Fallback Flow
1. Customer responds to completed work with `{"was_issue_resolved": false, "rating": 1, "comment": "Still broken"}`.
2. Ravi's workload released (0).
3. Ravi's `reopened_jobs_count` increments.
4. Fallback rerouting excludes Ravi and creates an `OFFERED` assignment for Kumar.
5. Ticket moves to `ROUTING`.
6. `GET /api/v1/tickets/{id}/assignments` shows Ravi's `COMPLETED` attempt and Kumar's `OFFERED` assignment.

### Demo C: Reopen with No Alternative Candidates
1. When all other technicians are off-duty or ineligible, customer reports `was_issue_resolved = False`.
2. Ticket status becomes `REOPENED` with `NO_ALTERNATIVE_TECHNICIAN_AVAILABLE`.
3. Ticket remains safely open for future operational retries.
