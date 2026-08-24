I am continuing my internship project called Smart-HelpDesk.

Phase 1, Phase 2, and Phase 3 are already complete.

You must implement ONLY Phase 4: Technician Eligibility and Deterministic Ranking.

This is the core routing intelligence of the application.

Do not implement assignment acceptance, decline, timeout, fallback, notifications, feedback APIs, ML, Redis, or Docker.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk and service-ticket routing system.

A customer raises a maintenance request.

Examples:

- Water leakage
- Clogged washroom
- Electrical failure
- Appliance problem
- Cleaning request
- HVAC issue

The system should eventually avoid unnecessary manual hierarchy by automatically determining the most suitable technician.

The full future flow is:

Customer raises ticket
        ↓
Ticket validated
        ↓
Ticket stored as PENDING
        ↓
Determine routing context
        ↓
Find eligible technicians
        ↓
Rank eligible technicians
        ↓
Best technician receives offer
        ↓
Technician accepts / declines / times out
        ↓
Fallback if necessary
        ↓
Technician performs work
        ↓
Customer confirms outcome
        ↓
Customer gives feedback
        ↓
Historical data improves future routing
        ↓
Possible ML experimentation later

PHASE 4 IMPLEMENTS ONLY:

Determine routing context
        ↓
Eligibility filtering
        ↓
Deterministic ranking
        ↓
Ranked candidate list

PHASE 4 STOPS THERE.

==================================================
CURRENT PROJECT STATE
==================================================

Phase 1 implemented:

- FastAPI foundation
- API versioning
- Configuration
- Logging
- Exception handling
- Health endpoint
- Basic tests

Phase 2 implemented:

- PostgreSQL
- SQLAlchemy ORM
- Alembic migrations
- Customer
- Technician
- ServiceCategory
- TechnicianAssignment
- CustomerTechnicianHistory
- Ticket
- Relationships
- UUIDs
- Timestamps
- Enums

Phase 3 implemented:

- Pydantic schemas
- Customer APIs
- Technician APIs
- Category APIs
- Ticket creation APIs
- Ticket retrieval/listing APIs
- Basic ticket updates
- Scheduled ticket persistence
- Basic ticket lifecycle protection
- Tests

Before changing anything:

1. Inspect the ACTUAL current project structure.
2. Inspect the actual SQLAlchemy models.
3. Inspect actual field names.
4. Inspect the actual TicketStatus enum.
5. Inspect Technician fields.
6. Inspect CustomerTechnicianHistory fields.
7. Inspect ServiceCategory relationships.
8. Inspect existing services.
9. Inspect existing tests.

Do not assume this prompt exactly matches the existing implementation.

Adapt to the current codebase.

Do not unnecessarily rewrite working code.

==================================================
PHASE 4 OBJECTIVE
==================================================

Build a deterministic routing engine.

Given a ticket, the system should:

1. Determine which technicians are relevant.
2. Filter out ineligible technicians.
3. Calculate a deterministic score for every eligible technician.
4. Rank eligible technicians.
5. Return the complete ranked candidate list with explanations.

Example:

Ticket:
"Water is clogged in my washroom"

Category:
Plumbing

Candidate technicians:

Ravi
Anil
Kumar
Suresh

Eligibility:

Ravi      → Eligible
Anil      → Inactive → Rejected
Kumar     → Workload full → Rejected
Suresh    → Eligible

Ranking:

1. Ravi     Score: 87
2. Suresh   Score: 72

The result should clearly explain why technicians were excluded and why the remaining candidates received their scores.

==================================================
IMPORTANT PRODUCT PRINCIPLE
==================================================

Separate:

ELIGIBILITY

from:

RANKING

Eligibility asks:

"Can this technician currently receive this ticket?"

Ranking asks:

"Among technicians who can receive it, who is the best choice?"

Do not combine these into one giant score.

For example:

A technician who is inactive must NOT receive a low score and remain in the list.

They must be removed before ranking.

==================================================
ELIGIBILITY RULES
==================================================

A technician is eligible only if ALL mandatory rules pass.

RULE 1: TECHNICIAN IS ACTIVE

technician.is_active == true

Otherwise:

INELIGIBLE

Reason:

TECHNICIAN_INACTIVE

--------------------------------------------------

RULE 2: TECHNICIAN IS ON DUTY

technician.is_on_duty == true

Otherwise:

INELIGIBLE

Reason:

TECHNICIAN_OFF_DUTY

--------------------------------------------------

RULE 3: CATEGORY/SKILL MATCH

The technician must support the ticket's ServiceCategory.

Example:

Ticket category:
Plumbing

Technician categories:
Electrical, Plumbing

Result:
PASS

Example:

Ticket category:
Plumbing

Technician categories:
Electrical

Result:
FAIL

Reason:

CATEGORY_NOT_SUPPORTED

--------------------------------------------------

RULE 4: WORKLOAD AVAILABLE

The technician must have remaining capacity.

Conceptually:

current_workload < max_workload

Example:

current_workload = 2
max_workload = 5

Eligible.

Example:

current_workload = 5
max_workload = 5

Ineligible.

Reason:

WORKLOAD_LIMIT_REACHED

Do not calculate workload from scratch from assignments in Phase 4 unless the existing architecture already does that.

Use the current workload model currently available.

==================================================
NO CANDIDATE CASE
==================================================

It is possible that no technician is eligible.

Example:

All plumbers are:

- Off duty
- Inactive
- Fully loaded

The routing engine must return a valid result.

Do not crash.

Return something conceptually like:

{
    "ticket_id": "...",
    "eligible_count": 0,
    "ranked_candidates": [],
    "excluded_candidates": [
        {
            "technician_id": "...",
            "reason": "TECHNICIAN_OFF_DUTY"
        }
    ]
}

The exact API design may differ.

Do not assign another category technician.

Do not bypass eligibility rules.

==================================================
RANKING RULES
==================================================

Only eligible technicians enter ranking.

The initial ranking should be deterministic and explainable.

Do NOT use ML.

Do NOT use random selection.

Do NOT use an LLM.

Use a weighted scoring model.

Suggested factors:

1. ETA / distance
2. Overall rating
3. Customer-technician history
4. Reopen rate
5. Workload

The exact weights should be centralized and easy to change.

Do not scatter magic numbers throughout the code.

==================================================
RANKING FACTOR 1: ETA / DISTANCE
==================================================

The product wants technicians who can reach the customer quickly.

However, do not fake ETA data.

Inspect whether the existing database has sufficient location information.

If it does not, add the MINIMUM clean data structure required to support routing location.

Do not build a complex GIS system.

Do not integrate Google Maps APIs.

Do not call external APIs.

For Phase 4, choose one deterministic V1 approach.

Possible approaches include:

OPTION A:
Simple building/tower/area-based distance approximation.

OPTION B:
Store numeric estimated travel time.

OPTION C:
Store technician's current residential/service zone and compare it with ticket zone.

Evaluate the existing data model and choose the simplest approach that allows meaningful local routing.

Preferred V1 approach:

Introduce a simple service location/zone concept if needed.

Example:

Ticket location:
Tower A

Technician current zone:
Tower A

Better than:

Ticket location:
Tower A

Technician current zone:
Tower D

The exact representation should fit the existing project.

Do not add latitude/longitude unless there is a clear reason.

Do not implement real-world route calculation.

==================================================
LOCATION SCHEMA CHANGES
==================================================

If additional fields/models are required for deterministic location ranking:

1. Explain why they are needed.
2. Keep the schema change minimal.
3. Create an Alembic migration.
4. Apply the migration.
5. Update tests.

Do not silently modify the database without a migration.

==================================================
RANKING FACTOR 2: OVERALL RATING
==================================================

Use the technician's existing overall_rating field.

Higher rating should improve the score.

The score must be normalized so that rating scales do not dominate unexpectedly.

Example concept:

5.0 rating → maximum rating contribution
4.0 rating → smaller contribution
3.0 rating → smaller contribution

Do not hardcode assumptions without checking the actual rating range/constraints.

Do not calculate ratings from feedback in Phase 4.

Use existing stored data.

==================================================
RANKING FACTOR 3: CUSTOMER-TECHNICIAN HISTORY
==================================================

This is an important personalized routing factor.

The same technician may be excellent for one customer and unsuitable for another.

Example:

Customer Siva previously had:

Ravi:

positive_interactions = 3
negative_interactions = 0

Ravi receives a positive history bonus.

Another technician:

positive_interactions = 0
negative_interactions = 2

That technician receives a penalty.

Use CustomerTechnicianHistory if a record exists.

If no history exists:

history contribution = neutral

Do not automatically create history records during routing.

Do not modify historical records during ranking.

Ranking must be read-only.

==================================================
RANKING FACTOR 4: REOPEN RATE
==================================================

Technicians with many reopened jobs should receive a lower ranking contribution.

Conceptually:

reopen_rate =
reopened_jobs_count / completed_jobs_count

Handle division by zero safely.

If:

completed_jobs_count = 0

do not crash.

Choose and document a reasonable neutral/default treatment.

Do not pretend a technician with no history has a perfect reopen rate.

Avoid unfairly penalizing new technicians too aggressively.

The formula should be documented.

==================================================
RANKING FACTOR 5: WORKLOAD
==================================================

Among eligible technicians, workload can influence ranking.

Example:

Technician A:

1 / 5 jobs

Technician B:

4 / 5 jobs

Both are eligible.

Technician A may receive a better workload contribution.

Use workload utilization rather than only absolute workload if max_workload varies.

Conceptually:

utilization =
current_workload / max_workload

Lower utilization should generally rank better.

Handle invalid values safely.

==================================================
SCORING DESIGN
==================================================

Create a centralized scoring configuration.

Example concept:

ETA_WEIGHT = ...
RATING_WEIGHT = ...
HISTORY_WEIGHT = ...
REOPEN_RATE_WEIGHT = ...
WORKLOAD_WEIGHT = ...

Do not necessarily use these exact numbers.

Choose sensible initial weights.

Document why.

The score should be understandable.

The result should expose a breakdown conceptually like:

{
    "technician_id": "...",
    "technician_name": "Ravi",
    "total_score": 82.4,
    "score_breakdown": {
        "eta": 18.0,
        "rating": 24.0,
        "customer_history": 20.0,
        "reopen_rate": 12.0,
        "workload": 8.4
    }
}

The exact numbers/formula are implementation details, but explainability is required.

==================================================
SUGGESTED SCORING RANGE
==================================================

Use a normalized total score where possible.

For example:

0 to 100

This makes debugging and demos easier.

Do not allow scores to become arbitrarily huge because one raw database value is large.

Normalize each factor before applying its weight.

==================================================
TIE BREAKING
==================================================

Two technicians can receive the same score.

Define deterministic tie-breakers.

Example order:

1. Higher total score
2. Lower ETA/distance
3. Higher overall rating
4. Lower workload utilization
5. Earlier stable identifier as final deterministic tie-breaker

Do not use random ordering.

The same data should produce the same ranked result.

==================================================
ROUTING ENGINE STRUCTURE
==================================================

Create a dedicated routing domain/module.

Suggested structure:

src/
└── smart_helpdesk/
    │
    ├── routing/
    │   ├── __init__.py
    │   ├── eligibility.py
    │   ├── ranking.py
    │   ├── scoring.py
    │   └── schemas.py
    │
    ├── services/
    │   └── ticket_service.py
    │
    └── api/
        └── routes/

Possible responsibility split:

eligibility.py

Determines:

- active?
- on duty?
- category supported?
- workload available?

Returns:

Eligible / Ineligible
and reasons.

--------------------------------------------------

scoring.py

Contains:

- Centralized weights
- Normalization functions
- Score calculations

--------------------------------------------------

ranking.py

Takes eligible candidates.

Calculates score.

Sorts candidates.

Applies deterministic tie-breakers.

--------------------------------------------------

schemas.py

Defines internal/result objects such as:

EligibilityResult
CandidateScore
RoutingResult

Adapt this structure if the existing codebase suggests a cleaner approach.

Do not create unnecessary complexity.

==================================================
DO NOT COUPLE ROUTING TO HTTP
==================================================

The routing engine should not depend directly on:

FastAPI Request
Response
HTTPException

It should work as a domain/service component.

Conceptually:

Ticket
+
Technicians
+
History
+
Routing Rules

        ↓

Routing Engine

        ↓

RoutingResult

Then an API endpoint can expose that result.

This makes the routing logic testable without HTTP.

==================================================
ROUTING API
==================================================

Implement a controlled API endpoint to evaluate routing.

Suggested:

POST /api/v1/tickets/{ticket_id}/routing-preview

Alternative:

GET /api/v1/tickets/{ticket_id}/routing-preview

Choose the cleaner REST design and explain it.

The endpoint should:

1. Find the ticket.
2. Validate that the ticket is in a routable state.
3. Gather relevant technicians.
4. Run eligibility filtering.
5. Rank eligible technicians.
6. Return the routing result.

IMPORTANT:

This endpoint does NOT assign the ticket.

It does NOT create a TechnicianAssignment record.

It does NOT change workload.

It does NOT change the ticket status to ASSIGNED.

It should be a safe evaluation/preview operation.

==================================================
ROUTABLE TICKET STATES
==================================================

Define which statuses may be evaluated.

For Phase 4, likely:

PENDING

and possibly:

ROUTING

depending on the existing enum/workflow.

Do not rank:

CLOSED
CANCELLED
RESOLVED

Return an appropriate error for non-routable tickets.

==================================================
ROUTING RESULT
==================================================

The API response should clearly contain:

- ticket ID
- ticket category
- total technicians considered
- eligible technicians count
- excluded technicians
- exclusion reasons
- ranked candidates
- score breakdown
- top recommended technician if one exists

Example conceptual response:

{
    "ticket_id": "...",
    "ticket_category": "Plumbing",
    "technicians_considered": 5,
    "eligible_count": 2,
    "excluded_candidates": [
        {
            "technician_id": "...",
            "reason": "TECHNICIAN_OFF_DUTY"
        },
        {
            "technician_id": "...",
            "reason": "WORKLOAD_LIMIT_REACHED"
        }
    ],
    "ranked_candidates": [
        {
            "rank": 1,
            "technician_id": "...",
            "technician_name": "Ravi",
            "total_score": 87.2,
            "score_breakdown": {
                "location": 18,
                "rating": 25,
                "customer_history": 20,
                "reopen_rate": 14,
                "workload": 10.2
            }
        },
        {
            "rank": 2,
            "technician_id": "...",
            "technician_name": "Suresh",
            "total_score": 74.5,
            "score_breakdown": {
                ...
            }
        }
    ],
    "recommended_technician": {
        "technician_id": "...",
        "technician_name": "Ravi"
    }
}

Do not expose unnecessary private technician information.

==================================================
EXCLUSION REASONS
==================================================

Use controlled reason values.

Examples:

TECHNICIAN_INACTIVE
TECHNICIAN_OFF_DUTY
CATEGORY_NOT_SUPPORTED
WORKLOAD_LIMIT_REACHED

A technician may fail multiple checks.

Consider whether the response should show:

- first failure only

or:

- all applicable failure reasons

Prefer returning all applicable reasons for debugging and transparency.

Example:

{
    "technician_id": "...",
    "reasons": [
        "TECHNICIAN_OFF_DUTY",
        "WORKLOAD_LIMIT_REACHED"
    ]
}

==================================================
LOCATION/ETA V1 DESIGN
==================================================

Do not overpromise real ETA.

The UI/API must not claim:

"Technician will arrive in 7 minutes"

unless the system actually calculates that.

For Phase 4, name the factor accurately.

Possible names:

location_proximity_score
zone_match_score
estimated_travel_score

Choose based on the implemented data.

If using simple zone matching:

Same zone → high score
Nearby/related zone → medium score
Different zone → lower score

Document that this is a deterministic V1 approximation, not real traffic-aware ETA.

==================================================
DATABASE INTEGRITY
==================================================

If Phase 4 adds location/zone data:

- Use an Alembic migration.
- Preserve existing data where possible.
- Use safe defaults or nullable fields during transition if needed.
- Do not break existing tests.

Do not modify database schema manually outside migrations.

==================================================
NO SIDE EFFECTS DURING RANKING
==================================================

The routing preview must be read-only.

Running it twice with unchanged data should produce the same result.

It must NOT:

- create assignments
- change workload
- increment counters
- update history
- modify technician rating
- modify ticket status unless there is an explicitly justified routing-state design

Prefer no database writes at all.

==================================================
TESTING REQUIREMENTS
==================================================

The routing logic is the most important part of this phase.

Test it thoroughly.

Use isolated test data/database fixtures.

At minimum test:

--------------------------------------------------
ELIGIBILITY
--------------------------------------------------

1. Active + on-duty + matching category + capacity
   → eligible

2. Inactive technician
   → ineligible

3. Off-duty technician
   → ineligible

4. Wrong category
   → ineligible

5. Workload at maximum
   → ineligible

6. Multiple failure reasons
   → all reasons returned if that design is chosen

--------------------------------------------------
RANKING
--------------------------------------------------

7. Higher overall rating ranks better when other factors are equal.

8. Better location/proximity ranks better when other factors are equal.

9. Positive customer-technician history increases rank.

10. Negative customer-technician history decreases rank.

11. Better reopen rate ranks better.

12. Lower workload utilization ranks better.

13. Technician with no history does not crash.

14. completed_jobs_count = 0 does not cause division by zero.

15. Scores remain within expected normalized range.

16. Results are sorted correctly.

17. Tie-breaking is deterministic.

--------------------------------------------------
NO CANDIDATES
--------------------------------------------------

18. No eligible technician returns an empty ranked list safely.

--------------------------------------------------
READ ONLY
--------------------------------------------------

19. Routing preview does not create TechnicianAssignment records.

20. Routing preview does not change ticket status.

21. Routing preview does not change technician workload.

22. Running routing preview twice with unchanged data returns the same order.

--------------------------------------------------
API
--------------------------------------------------

23. Nonexistent ticket returns 404.

24. Non-routable ticket state is rejected.

25. Routing preview response contains score explanations.

--------------------------------------------------
REGRESSION
--------------------------------------------------

26. Existing Phase 1 tests pass.

27. Existing Phase 2 tests pass.

28. Existing Phase 3 tests pass.

==================================================
POSTMAN DEMO SEQUENCE
==================================================

Provide a complete demonstration.

Example:

STEP 1

Create categories:

Plumbing
Electrical

STEP 2

Create customer:

Siva

STEP 3

Create ticket:

"Water is clogged in my washroom"

Category:

Plumbing

STEP 4

Create Technician A:

- Active
- On duty
- Plumbing
- Low workload
- High rating
- Good location
- Positive customer history

STEP 5

Create Technician B:

- Active
- On duty
- Plumbing
- Higher workload
- Lower rating

STEP 6

Create Technician C:

- Off duty
- Plumbing

STEP 7

Create Technician D:

- Active
- On duty
- Electrical only

STEP 8

Call routing preview.

Expected result:

Technician C
→ excluded: TECHNICIAN_OFF_DUTY

Technician D
→ excluded: CATEGORY_NOT_SUPPORTED

Technician A
→ Rank 1

Technician B
→ Rank 2

No assignment should be created.

==================================================
WHAT NOT TO IMPLEMENT
==================================================

STRICTLY DO NOT IMPLEMENT:

- Actual ticket assignment
- TechnicianAssignment creation during routing
- Technician accept endpoint
- Technician decline endpoint
- Ask-me-later behavior
- Assignment timeout
- Fallback routing
- Reassignment
- Notifications
- Scheduled jobs
- Scheduled ticket execution
- Background workers
- Redis
- Celery
- Feedback APIs
- Customer confirmation
- Resolution workflow
- Reopen workflow
- Rating calculation
- ML
- AI
- NLP
- LLM calls
- Google Maps
- External ETA APIs
- OAuth
- JWT
- Authentication
- Docker

Do not add placeholder code for future phases.

==================================================
IMPLEMENTATION ORDER
==================================================

Follow this order:

STEP 1:
Inspect the current project and existing models.

STEP 2:
Explain the routing architecture before modifying code.

STEP 3:
Identify whether minimal location/zone data is required.

STEP 4:
If schema changes are needed, implement models and migration.

STEP 5:
Create centralized routing configuration/constants.

STEP 6:
Implement eligibility logic independently.

STEP 7:
Write eligibility unit tests.

STEP 8:
Implement normalization and scoring functions.

STEP 9:
Write scoring unit tests.

STEP 10:
Implement ranking and deterministic tie-breaking.

STEP 11:
Write ranking tests.

STEP 12:
Create routing result schemas/data structures.

STEP 13:
Create a routing service that gathers data and orchestrates:

ticket
→ candidates
→ eligibility
→ ranking
→ result

STEP 14:
Create the routing preview endpoint.

STEP 15:
Write API integration tests.

STEP 16:
Verify routing has no side effects.

STEP 17:
Run the complete test suite.

STEP 18:
Run the application.

STEP 19:
Demonstrate the full routing preview using Postman.

STEP 20:
Show the final folder structure.

==================================================
PHASE 4 ACCEPTANCE CRITERIA
==================================================

Phase 4 is complete only when:

1. A pending ticket can be evaluated for routing.

2. Only technicians with matching categories are considered eligible.

3. Inactive technicians are excluded.

4. Off-duty technicians are excluded.

5. Fully loaded technicians are excluded.

6. All exclusion reasons are understandable.

7. Eligible technicians receive deterministic scores.

8. Scores consider:

- location/proximity
- overall rating
- customer-technician history
- reopen rate
- workload

9. Positive previous customer experience improves ranking.

10. Negative previous customer experience penalizes ranking.

11. No-history technicians are handled fairly and safely.

12. Zero completed jobs does not cause division by zero.

13. Candidate ordering is deterministic.

14. Ties are deterministic.

15. No eligible candidate is handled safely.

16. The response explains why each candidate ranked where they did.

17. The routing engine does not assign anyone.

18. No TechnicianAssignment record is created.

19. Workload does not change.

20. Ticket status is not incorrectly advanced.

21. All Phase 1–4 tests pass.

==================================================
FINAL EXPLANATION REQUIRED
==================================================

After implementation, explain:

1. Why eligibility and ranking are separate.
2. Every eligibility rule.
3. Every scoring factor.
4. The exact scoring formula.
5. Why each weight was chosen.
6. How normalization works.
7. How reopen rate is handled.
8. How technicians with no history are handled.
9. How customer-technician history affects ranking.
10. How location/proximity works in V1.
11. How deterministic tie-breaking works.
12. Why the routing engine is read-only.
13. Why no assignment is created yet.
14. How to test the routing preview in Postman.
15. Final project structure.

Also provide this final flow:

Ticket
  ↓
Find technicians
  ↓
Eligibility filtering
  ├── inactive ❌
  ├── off duty ❌
  ├── wrong skill ❌
  └── workload full ❌
  ↓
Eligible technicians
  ↓
Score each technician
  ├── location
  ├── rating
  ├── customer history
  ├── reopen rate
  └── workload
  ↓
Sort + deterministic tie-break
  ↓
Ranked candidate list
  ↓
Recommended technician
  ↓
STOP

Do not begin Phase 5.

Stop after Phase 4 is fully implemented and tested.

WHAT IM EXPECTING AFTER PHASE 4
Customer raises:

"Water is clogged in my washroom"

                ↓

Category: Plumbing

                ↓

System checks 5 technicians

Ravi
├── Active ✅
├── On duty ✅
├── Plumbing skill ✅
└── Workload available ✅

        → ELIGIBLE


Anil
├── Active ❌
└── EXCLUDED


Kumar
├── Active ✅
├── On duty ❌
└── EXCLUDED


Suresh
├── Active ✅
├── On duty ✅
├── Plumbing skill ❌
└── EXCLUDED


Ravi + another eligible technician
                ↓
        SCORING ENGINE
                ↓
        1. Ravi — 87.2
        2. X    — 74.5
                ↓
     Recommended: Ravi
     