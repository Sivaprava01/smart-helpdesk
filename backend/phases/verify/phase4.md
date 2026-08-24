# Phase 4 Verification Documentation: Technician Eligibility & Deterministic Ranking Engine

This document provides a comprehensive report of the completed Phase 4 implementation in accordance with [`backend/phases/phase4.md`](../phase4.md).

---

## 1. Phase 4 Objective & Philosophy

Phase 4 implements the deterministic routing intelligence of **Smart-HelpDesk**. Given a pending residential service ticket, the routing engine:
1. Gathers candidate technicians.
2. Filters out ineligible candidates using strict, transparent criteria.
3. Scores eligible candidates using a normalized multi-factor model.
4. Deterministically sorts and ranks candidates with reproducible tie-breaking.
5. Returns an explainable recommendation without performing any state mutations or database writes.

---

## 2. Core Architectural Principles

```text
Ticket (PENDING)
       ↓
Gather Candidates
       ↓
[Eligibility Engine] ──────────→ Excluded Candidates (with transparent failure reasons)
       ↓ (Eligible Only)
[Deterministic Scoring Engine]
   ├── Location Proximity (20 pts)
   ├── Overall Rating (25 pts)
   ├── Customer Affinity History (25 pts)
   ├── Reopen Rate Quality (15 pts)
   └── Workload Utilization (15 pts)
       ↓
[Deterministic Ranking & Tie-Breaker]
       ↓
Ranked Candidates & Top Recommendation
       ↓
[Read-Only Preview API Response] (Zero database mutations, zero assignments)
```

### Why Eligibility is Separated from Ranking
- **Eligibility** is binary and mandatory: *"Can this technician legally and operationally service this ticket right now?"*
- **Ranking** is comparative and qualitative: *"Among technicians who can do the job, who is the best choice?"*
- An off-duty, inactive, or overloaded technician must never receive a low score and stay in the candidate list—they are pruned prior to scoring.

---

## 3. Eligibility Rules

A technician is eligible **only if all 4 rules pass**:

| Rule | Database Field / Logic | Exclusion Reason Code | Failure Description |
|---|---|---|---|
| **1. Active Status** | `technician.is_active == True` | `TECHNICIAN_INACTIVE` | Technician account is disabled or deactivated |
| **2. On-Duty Status** | `technician.is_on_duty == True` | `TECHNICIAN_OFF_DUTY` | Technician is currently off-duty / not on shift |
| **3. Category Match** | `ticket.category_id` in technician supported categories | `CATEGORY_NOT_SUPPORTED` | Technician lacks skills/certification for requested category |
| **4. Capacity Available** | `technician.current_workload < technician.max_workload` | `WORKLOAD_LIMIT_REACHED` | Technician is already at maximum concurrent job capacity |

*Note: If a technician fails multiple checks, all applicable failure reasons are returned in `excluded_candidates` for full transparency and debuggability.*

---

## 4. Deterministic Multi-Factor Scoring Formula

Eligible technicians receive a total score $S_{\text{total}} \in [0.0, 100.0]$:

$$S_{\text{total}} = (S_{\text{loc}} \times 20.0) + (S_{\text{rate}} \times 25.0) + (S_{\text{hist}} \times 25.0) + (S_{\text{reopen}} \times 15.0) + (S_{\text{workload}} \times 15.0)$$

### Factor Breakdown & Normalization:

#### 1. Location Proximity ($S_{\text{loc}} \in [0.0, 1.0]$, Weight = 20.0 pts)
- **V1 Zone Approximation**: Compares ticket `location` with technician `current_zone`.
- Same zone / substring match (e.g. "Tower A" matching "Tower A, Flat 302"): $S_{\text{loc}} = 1.0$ (20 pts).
- Common complex/token prefix (e.g. "Tower B" nearby "Tower A"): $S_{\text{loc}} = 0.5$ (10 pts).
- Distant / mismatched zone: $S_{\text{loc}} = 0.2$ (4 pts).
- Unspecified / neutral: $S_{\text{loc}} = 0.5$ (10 pts).

#### 2. Overall Rating ($S_{\text{rate}} \in [0.0, 1.0]$, Weight = 25.0 pts)
- Computed as $\min(\max(\text{rating} / 5.0, 0.0), 1.0)$.
- **New Technicians**: If `overall_rating` is `None`, a neutral prior of $3.5 / 5.0 = 0.70$ (17.5 pts) is assigned so new staff are not penalized.

#### 3. Customer-Technician Interaction History ($S_{\text{hist}} \in [0.0, 1.0]$, Weight = 25.0 pts)
- Measures personalized affinity from `CustomerTechnicianHistory`:
  $$\text{net} = \text{positive\_interactions} - \text{negative\_interactions}$$
  $$S_{\text{hist}} = \text{clamp}(0.50 + (\text{net} \times 0.15), 0.0, 1.0)$$
- No history record exists: Neutral baseline $0.50$ (12.5 pts).
- Net positive history (e.g. +3): $0.50 + 0.45 = 0.95$ (23.75 pts).
- Net negative history (e.g. -2): $0.50 - 0.30 = 0.20$ (5.0 pts).

#### 4. Reopen Rate / Completion Quality ($S_{\text{reopen}} \in [0.0, 1.0]$, Weight = 15.0 pts)
- Measures first-time-fix reliability:
  $$S_{\text{reopen}} = 1.0 - \frac{\text{reopened\_jobs\_count}}{\text{completed\_jobs\_count}}$$
- **Division by Zero Protection**: If `completed_jobs_count == 0`, defaults to a neutral prior of $0.70$ (10.5 pts).

#### 5. Workload Utilization ($S_{\text{workload}} \in [0.0, 1.0]$, Weight = 15.0 pts)
- Encourages load balancing across available capacity:
  $$S_{\text{workload}} = 1.0 - \frac{\text{current\_workload}}{\text{max\_workload}}$$
- 0% workload: $S = 1.0$ (15.0 pts).
- 20% workload (1/5): $S = 0.8$ (12.0 pts).
- 80% workload (4/5): $S = 0.2$ (3.0 pts).

---

## 5. Deterministic Tie-Breaking Order

When multiple technicians achieve identical total scores, ties are resolved deterministically using:
1. Total score (descending)
2. Location proximity score (descending)
3. Overall rating score (descending)
4. Workload capacity score (descending)
5. Technician UUID string (ascending stable tie-breaker)

---

## 6. Read-Only Guarantee

The routing preview (`POST` / `GET` `/api/v1/tickets/{ticket_id}/routing-preview`) is strictly read-only:
- **No `TechnicianAssignment` rows created.**
- **No changes to `Ticket.status` (remains `PENDING`).**
- **No modifications to technician `current_workload`.**
- **No alterations to historical records.**
- **Idempotent**: Calling preview $N$ times produces identical responses.

---

## 7. Schema Changes & Migrations

- **Migration**: `0002_add_technician_current_zone.py`
  - Added `current_zone` (`VARCHAR(100)`, nullable) to `technicians` table to support minimal, clean V1 zone-based proximity scoring.

---

## 8. What is Intentionally NOT Implemented (Reserved for Future Phases)

- **No Dispatch / Acceptance Workflows**: No assignment creation, accept/decline endpoints, or offer expirations (Phase 5).
- **No Background Workers**: No Redis, Celery, or scheduled task execution (Phase 5).
- **No Reopen / Rating Calculations from Reviews**: Customer reviews and feedback loop (Phase 6).
- **No External GIS / Map Integrations**: No Google Maps API or real-time traffic queries.
- **No Authentication / JWT**: Login, signup, tokens (Phase 4 scope boundary respected).

---

## 9. How to Test Manually (Postman / Curl)

1. **Create Category**:
   ```bash
   POST /api/v1/categories
   {"name": "Plumbing"}
   ```
2. **Create Customer**:
   ```bash
   POST /api/v1/customers
   {"full_name": "Siva", "email": "siva@example.com", "phone_number": "+919876543210", "default_location": "Tower A, Flat 302"}
   ```
3. **Create Ticket**:
   ```bash
   POST /api/v1/tickets
   {"customer_id": "<CUST_ID>", "category_id": "<CAT_ID>", "contact_name": "Siva", "contact_phone": "+919876543210", "description": "Clogged washroom", "location": "Tower A, Flat 302"}
   ```
4. **Create Technicians**:
   - Ravi: `is_on_duty: true`, `current_zone: "Tower A"`, `category_ids: ["<PLUMBING_ID>"]`
   - Suresh: `is_on_duty: true`, `current_zone: "Tower D"`, `category_ids: ["<PLUMBING_ID>"]`
   - Anil: `is_on_duty: false`, `category_ids: ["<PLUMBING_ID>"]`
5. **Call Routing Preview**:
   ```bash
   POST /api/v1/tickets/<TICKET_ID>/routing-preview
   ```
   **Response**:
   ```json
   {
       "ticket_id": "<TICKET_ID>",
       "ticket_category": "Plumbing",
       "technicians_considered": 3,
       "eligible_count": 2,
       "excluded_candidates": [
           {
               "technician_id": "<ANIL_ID>",
               "technician_name": "Anil",
               "reasons": ["TECHNICIAN_OFF_DUTY"]
           }
       ],
       "ranked_candidates": [
           {
               "rank": 1,
               "technician_id": "<RAVI_ID>",
               "technician_name": "Ravi",
               "total_score": 87.5,
               "score_breakdown": {
                   "location": 20.0,
                   "rating": 17.5,
                   "customer_history": 12.5,
                   "reopen_rate": 10.5,
                   "workload": 15.0
               }
           },
           {
               "rank": 2,
               "technician_id": "<SURESH_ID>",
               "technician_name": "Suresh",
               "total_score": 71.5,
               "score_breakdown": {
                   "location": 4.0,
                   "rating": 17.5,
                   "customer_history": 12.5,
                   "reopen_rate": 10.5,
                   "workload": 15.0
               }
           }
       ],
       "recommended_technician": {
           "technician_id": "<RAVI_ID>",
           "technician_name": "Ravi",
           "total_score": 87.5
       }
   }
   ```
