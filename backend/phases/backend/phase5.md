I am continuing my internship project called Smart-HelpDesk.

Phase 1, Phase 2, Phase 3, and Phase 4 are complete.

You must implement ONLY Phase 5:

TECHNICIAN ASSIGNMENT OFFER,
ACCEPTANCE,
DECLINE,
ASK-ME-LATER,
TIMEOUT,
AND FALLBACK REROUTING.

Do not implement customer feedback, resolution confirmation,
ML, OAuth, JWT, Redis, Docker, or frontend.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk system.

A customer raises a maintenance ticket.

The system:

1. Validates the ticket.
2. Determines the category.
3. Finds eligible technicians.
4. Ranks them deterministically.
5. Offers the ticket to the best technician.
6. Handles technician response.
7. Falls back to another technician when necessary.

The project must avoid tickets getting stuck in unnecessary
hierarchies.

==================================================
CURRENT PROJECT STATE
==================================================

Phase 1:
- FastAPI foundation
- Configuration
- Logging
- Exception handling
- Health checks
- Tests

Phase 2:
- PostgreSQL
- SQLAlchemy
- Alembic
- Core database models
- Customer
- Technician
- Category
- Ticket
- TechnicianAssignment
- CustomerTechnicianHistory

Phase 3:
- CRUD APIs
- Customer APIs
- Technician APIs
- Category APIs
- Ticket APIs
- Validation
- Scheduled ticket persistence

Phase 4:
- Routing engine
- Eligibility filtering
- Deterministic ranking
- Score breakdown
- Routing preview
- No routing side effects

Before making changes:

1. Inspect the actual current project structure.
2. Inspect the actual database models.
3. Inspect TicketStatus.
4. Inspect TechnicianAssignment and its fields.
5. Inspect existing routing services.
6. Inspect existing API routes.
7. Inspect existing tests.
8. Adapt to the real implementation.

Do not blindly assume this prompt exactly matches the code.

==================================================
PHASE 5 OBJECTIVE
==================================================

Turn routing recommendations into a real assignment workflow.

Phase 4:

"Who should get the ticket?"

Phase 5:

"Offer the ticket to that technician and handle what happens next."

==================================================
CORE FLOW
==================================================

Customer creates ticket
        ↓
Ticket is PENDING
        ↓
Routing engine runs
        ↓
Best eligible technician selected
        ↓
Assignment offer created
        ↓
Ticket is offered to technician
        ↓
Technician responds

        ├── ACCEPT
        │      ↓
        │   Assignment accepted
        │      ↓
        │   Ticket moves forward
        │
        ├── DECLINE
        │      ↓
        │   Record decline
        │      ↓
        │   Rerun routing
        │      ↓
        │   Offer best currently eligible technician
        │
        ├── ASK ME LATER
        │      ↓
        │   Keep offer pending temporarily
        │      ↓
        │   Technician can respond later
        │      ↓
        │   If deadline expires → fallback
        │
        └── NO RESPONSE
               ↓
            Offer expires
               ↓
            Rerun routing
               ↓
            Offer another technician

==================================================
IMPORTANT PRODUCT DECISION
==================================================

DO NOT preserve an old ranking list and blindly choose the next person.

Fallback must use CURRENT data.

When fallback happens:

Current ticket
      +
Current technician states
      ↓
Rerun eligibility
      ↓
Rerun ranking
      ↓
Choose best CURRENT candidate

Reason:

A technician's state can change.

Example:

At 10:00 AM:

Ravi is #1
Anil is #2

Ravi declines.

At 10:05 AM:

Anil may now be:

- off duty
- fully loaded
- assigned another ticket

Therefore the old ranking is stale.

The routing engine must run again.

==================================================
PREVENT REPEATED OFFERS
==================================================

During a fallback cycle, do not immediately offer the same
ticket again to a technician who already declined or whose
offer expired.

Example:

Ticket T1

Ravi declines.

Fallback routing runs.

Ravi must not immediately become #1 again and receive the
same ticket again.

Maintain attempted technicians for the current ticket.

Possible concept:

ticket_id
+
technician_id
+
assignment attempt history

The existing TechnicianAssignment history may already support this.

Prefer using existing assignment records rather than adding
unnecessary duplicate tracking structures.

==================================================
ASSIGNMENT STATES
==================================================

Inspect the existing enums and models.

If needed, introduce a clear assignment status enum.

Possible states:

OFFERED
DEFERRED
ACCEPTED
DECLINED
EXPIRED
CANCELLED

Use names that fit the existing architecture.

Do not create confusing overlapping states.

The assignment record represents an offer/attempt.

The ticket lifecycle represents the service request.

These are different concepts.

==================================================
TICKET STATUS VS ASSIGNMENT STATUS
==================================================

Keep them separate.

Example:

Ticket status:

PENDING
ASSIGNMENT_PENDING
ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED
CANCELLED

Assignment status:

OFFERED
DEFERRED
ACCEPTED
DECLINED
EXPIRED

Do not assume these exact enum names exist.

Adapt them cleanly.

Example:

Ticket:

ASSIGNMENT_PENDING

Current assignment:

OFFERED

Then technician accepts:

Ticket:

ASSIGNED

Assignment:

ACCEPTED

==================================================
INITIAL ASSIGNMENT
==================================================

Create a service responsible for starting assignment.

Conceptually:

start_assignment(ticket_id)

The service should:

1. Find the ticket.
2. Ensure it is in a routable state.
3. Run the routing engine.
4. Exclude technicians who should not be retried.
5. Find the best currently eligible candidate.
6. Create an assignment offer.
7. Set the appropriate ticket state.
8. Return the offer result.

If no candidate is available:

Do not crash.

Do not create a fake assignment.

Return a meaningful no-technician-available result.

==================================================
DECLINE
==================================================

Technicians are allowed to decline.

This is a valid and normal action.

Examples:

- Feeling unwell
- Busy
- Ending shift
- Personal reason
- Does not want to take this job

Do not penalize a technician merely for declining a ticket.

A decline should:

1. Validate the assignment belongs to that technician.
2. Validate the assignment is still actionable.
3. Mark the assignment as DECLINED.
4. Record an optional decline reason.
5. Trigger fallback routing.
6. Create a new offer if another candidate exists.

The original declined assignment must remain in history.

Do not delete it.

==================================================
DECLINE REASONS
==================================================

Keep reasons optional.

Possible controlled values:

BUSY
NOT_FEELING_WELL
ENDING_SHIFT
PERSONAL_REASON
OTHER

Also allow an optional free-text note only if the existing
project's validation approach supports it cleanly.

Do not require technicians to justify a decline.

==================================================
ASK ME LATER
==================================================

The technician may say:

"Ask me later."

Meaning:

"I cannot decide right now, but do not treat this as acceptance."

This should NOT immediately assign the ticket.

This should NOT immediately trigger fallback.

The assignment remains pending temporarily.

Possible assignment status:

DEFERRED

Store a response deadline.

Example:

offered_at
response_deadline

The exact duration should be centralized configuration.

Example concept:

ASSIGNMENT_RESPONSE_TIMEOUT_MINUTES = 10

Do not scatter timeout values in the code.

==================================================
IMPORTANT ASK-ME-LATER RULE
==================================================

"Ask me later" must not allow a ticket to remain stuck forever.

The technician gets until the response deadline.

They can:

- Accept
- Decline

before the deadline.

After the deadline:

The offer expires.

Fallback routing can occur.

Do not allow indefinite deferral.

==================================================
NO RESPONSE / TIMEOUT
==================================================

An offered assignment must have a response deadline.

If the technician does nothing:

OFFERED
      ↓
deadline passes
      ↓
EXPIRED
      ↓
fallback routing

For this phase, implement timeout handling in a way that fits
the current project.

Do NOT add Redis or Celery.

Do NOT add background infrastructure unless it is already
present.

A simple explicit timeout-processing service/endpoint is
acceptable for V1.

Example concept:

POST /api/v1/assignments/process-expired

This endpoint/service:

1. Finds actionable assignments whose response deadline has passed.
2. Marks them EXPIRED.
3. Runs fallback routing for affected tickets.

This makes the behavior demonstrable with Postman.

Do not pretend the endpoint is an automatic scheduler.

Clearly document that a real production deployment would later
call this periodically via a scheduler/background worker.

==================================================
ACCEPT
==================================================

When the technician accepts:

1. Validate assignment exists.
2. Validate technician identity/ownership according to the
   current architecture.
3. Validate assignment is actionable.
4. Validate deadline has not passed.
5. Mark assignment ACCEPTED.
6. Set accepted_at timestamp.
7. Update ticket status appropriately.
8. Increase technician workload appropriately.
9. Prevent another active offer for the same ticket.
10. Return the updated state.

For Phase 5, accepting the ticket means:

The technician has committed to handling the ticket.

Do not yet implement:

- arrival
- start work
- resolution
- customer confirmation

Those are later lifecycle phases.

==================================================
WORKLOAD CONSISTENCY
==================================================

When a technician accepts:

current_workload increases.

When an offer is merely created:

DO NOT increase workload.

When technician declines:

DO NOT increase workload.

When offer expires:

DO NOT increase workload.

Only an accepted/active assignment should affect workload,
depending on the exact lifecycle model.

Ensure the update is transaction-safe.

==================================================
TRANSACTION SAFETY
==================================================

Assignment actions involve multiple changes.

Example acceptance:

Assignment → ACCEPTED
Ticket → ASSIGNED
Technician workload → increment

These should behave atomically.

If one operation fails:

Do not leave the system in:

Assignment = ACCEPTED
Ticket = PENDING
Workload unchanged

Use the database transaction/session correctly.

==================================================
FALLBACK ROUTING
==================================================

Create a dedicated fallback service.

Conceptually:

reroute_ticket(ticket_id)

It should:

1. Find the ticket.
2. Find assignment history for this ticket.
3. Determine technicians already attempted.
4. Run eligibility again using CURRENT data.
5. Exclude inappropriate retries.
6. Run ranking again.
7. Select the best CURRENT candidate.
8. Create a new assignment offer.
9. Return the result.

Example:

10:00

Ravi → offered

10:02

Ravi → declines

10:02

Rerouting starts.

The system checks all currently relevant technicians again.

Anil may have become off duty.

Kumar may now be free.

The new ranking may be:

Kumar → #1
Suresh → #2

Offer goes to Kumar.

==================================================
NO FALLBACK CANDIDATE
==================================================

Possible situation:

Every technician:

- declined
- is off duty
- is fully loaded
- is inactive

The system must handle this safely.

Example state:

Ticket remains:

PENDING / UNASSIGNED

depending on the chosen lifecycle naming.

The response should clearly say:

NO_ELIGIBLE_TECHNICIAN_AVAILABLE

Do not close the ticket.

Do not mark it resolved.

Do not silently lose it.

The ticket remains available for a later retry.

==================================================
ACTIVE OFFER CONSTRAINT
==================================================

A ticket should not have multiple active technician offers
simultaneously unless there is an explicit business reason.

For V1:

ONE active offer per ticket.

Before creating a new offer:

Check that another active offer does not exist.

Use application validation and database-level protection where
reasonably possible.

==================================================
RACE CONDITIONS
==================================================

Consider this scenario:

Ravi and Kumar both somehow attempt to accept around the same time.

Only one assignment should become the active accepted assignment.

Another scenario:

Two fallback processes run simultaneously.

Both must not create duplicate offers.

Use transaction handling and appropriate database constraints/
locking where reasonably possible for V1.

Do not over-engineer distributed locking.

But do not ignore duplicate assignment risks.

Document the chosen protection.

==================================================
SUGGESTED API ENDPOINTS
==================================================

Adapt names to the existing API style.

Possible endpoints:

POST /api/v1/tickets/{ticket_id}/assign

Starts initial routing and creates the first offer.

--------------------------------------------------

POST /api/v1/assignments/{assignment_id}/accept

Technician accepts.

--------------------------------------------------

POST /api/v1/assignments/{assignment_id}/decline

Technician declines.

Optional body:

{
    "reason": "BUSY",
    "note": "Finishing another urgent task"
}

--------------------------------------------------

POST /api/v1/assignments/{assignment_id}/ask-later

Technician defers the decision.

--------------------------------------------------

POST /api/v1/assignments/process-expired

Processes expired offers for V1 demonstration.

--------------------------------------------------

GET /api/v1/tickets/{ticket_id}/assignments

Returns assignment attempt history.

Use the existing project conventions where appropriate.

==================================================
AUTOMATIC FALLBACK
==================================================

When an assignment is declined:

The decline endpoint may immediately call fallback routing.

That is acceptable and preferred.

Example:

DECLINE request
       ↓
Mark old assignment declined
       ↓
Reroute in same service/transaction boundary where appropriate
       ↓
Create next offer if available
       ↓
Return:

old assignment = DECLINED
new assignment = OFFERED

For timeout processing:

Expired assignment
       ↓
Mark EXPIRED
       ↓
Reroute
       ↓
Create next offer if possible

==================================================
ASK-LATER BEHAVIOR
==================================================

Ask-later should NOT create a second offer.

The existing assignment remains the only active offer.

Conceptually:

OFFERED
   ↓
DEFERRED

The same assignment remains associated with the same ticket
and technician.

The deadline remains controlled.

Do not reset the deadline indefinitely.

Decide whether ask-later:

Option A:
Keeps original deadline.

Option B:
Allows one small fixed extension.

For V1 choose the simplest safe behavior.

Preferred:

Keep the original response deadline.

Reason:

It prevents repeated deferrals from blocking the customer.

Document the decision.

==================================================
LATE RESPONSES
==================================================

If an assignment deadline has passed:

The technician must not successfully accept it.

Before accept/decline/ask-later:

Check current time against response deadline.

If expired:

The assignment should be treated as expired.

Do not accept it.

Return an appropriate error or process expiration and trigger
fallback according to the chosen service design.

==================================================
DECLINE COUNTER / REPEATED DECLINES
==================================================

Product requirement:

Technicians may freely decline legitimate assignments.

No penalty for an ordinary decline.

However, repeated declines while:

- active
- on duty

may indicate that the technician should not currently be
available for routing.

Do NOT implement automatic suspension yet unless the project
already has a clean policy model.

For Phase 5:

Record enough decline history/data so that a future phase can
evaluate repeated declines.

Do not build a punitive algorithm without a clear threshold
policy.

If a simple counter already fits the model, it may be added.

But do not automatically suspend technicians in this phase.

==================================================
SCHEDULED TICKETS
==================================================

Scheduled tickets were stored in Phase 3.

Do not implement actual scheduled routing yet unless the
existing Phase 5 architecture naturally requires a minimal
hook.

For Phase 5:

Immediate tickets can enter assignment workflow.

Scheduled tickets should NOT be repeatedly ranked from the
moment they are created.

The product requirement is:

Evaluate/reroute them close to their scheduled deadline/time.

Do not implement Redis, Celery, or a scheduler now.

Leave scheduled execution for a later phase.

Clearly protect against accidentally assigning a scheduled
ticket immediately if its scheduled time has not arrived.

==================================================
CUSTOMER CANNOT BE LEFT WAITING FOREVER
==================================================

The system must preserve ticket history.

If routing fails:

Ticket remains visible and unresolved.

Do not delete it.

Do not mark it completed.

Future phases can add:

- admin intervention
- escalation
- scheduled rerouting
- notifications

Do not implement these yet.

==================================================
SERVICE STRUCTURE
==================================================

Keep HTTP routes thin.

Suggested structure:

services/

routing_service.py
assignment_service.py
fallback_service.py
assignment_timeout_service.py

Or adapt to existing architecture.

Possible responsibilities:

assignment_service:

- create initial offer
- accept
- decline
- ask later

fallback_service:

- reroute ticket
- exclude attempted technicians
- create replacement offer

assignment_timeout_service:

- find expired assignments
- expire them
- trigger fallback

Do not put all business logic inside route files.

==================================================
DATABASE CHANGES
==================================================

Inspect whether the current TechnicianAssignment model already
contains sufficient fields.

Potential fields may include:

id
ticket_id
technician_id
status
offered_at
response_deadline
accepted_at
declined_at
expired_at
decline_reason
decline_note
created_at
updated_at

Do not blindly add every field.

Add only what is actually required.

If schema changes are needed:

1. Update SQLAlchemy models.
2. Create Alembic migration.
3. Review migration.
4. Apply migration.
5. Update tests.

Do not manually alter the database.

==================================================
ASSIGNMENT HISTORY
==================================================

Never delete old assignment attempts.

Example:

Ticket T1

Attempt 1:

Ravi
DECLINED

Attempt 2:

Kumar
EXPIRED

Attempt 3:

Suresh
ACCEPTED

All three records should remain.

This provides:

- auditability
- routing history
- future ML training data
- debugging
- operational analytics

==================================================
API RESPONSE DESIGN
==================================================

Responses should clearly explain what happened.

Example decline response:

{
    "ticket_id": "...",
    "previous_assignment": {
        "id": "...",
        "technician": "Ravi",
        "status": "DECLINED"
    },
    "fallback": {
        "status": "NEW_TECHNICIAN_OFFERED",
        "assignment_id": "...",
        "technician": "Kumar",
        "response_deadline": "..."
    }
}

If no fallback exists:

{
    "ticket_id": "...",
    "previous_assignment": {
        "status": "DECLINED"
    },
    "fallback": {
        "status": "NO_ELIGIBLE_TECHNICIAN_AVAILABLE"
    }
}

Adapt exact response schemas to project conventions.

==================================================
TESTING REQUIREMENTS
==================================================

This phase requires thorough tests.

--------------------------------------------------
INITIAL ASSIGNMENT
--------------------------------------------------

1. Pending ticket gets best ranked technician.

2. Assignment offer is created.

3. Ticket state updates correctly.

4. Technician workload does NOT increase merely from offer.

5. Only one active offer exists.

6. No eligible technician is handled safely.

--------------------------------------------------
ACCEPT
--------------------------------------------------

7. Valid technician can accept.

8. Assignment becomes ACCEPTED.

9. Ticket state updates.

10. Technician workload increments.

11. Accepted timestamp is stored.

12. Accepting twice fails safely.

13. Another technician cannot accept the assignment.

14. Expired assignment cannot be accepted.

--------------------------------------------------
DECLINE
--------------------------------------------------

15. Technician can decline.

16. Decline is stored.

17. Optional reason is stored.

18. Workload does not increase.

19. Declined assignment remains in history.

20. Fallback routing runs.

21. New offer goes to best CURRENT eligible technician.

22. Declined technician is not immediately offered the same
    ticket again.

--------------------------------------------------
ASK LATER
--------------------------------------------------

23. Ask-later changes assignment appropriately.

24. No new assignment is created.

25. Existing deadline remains valid.

26. Ticket remains unassigned.

27. Technician can later accept before deadline.

--------------------------------------------------
TIMEOUT
--------------------------------------------------

28. Expired offers are detected.

29. Assignment becomes EXPIRED.

30. Expired technician does not remain an active candidate for
    that ticket.

31. Fallback routing runs.

32. New offer is created if candidate exists.

33. No fallback candidate is handled safely.

--------------------------------------------------
REROUTING
--------------------------------------------------

34. Eligibility is rerun.

35. Ranking is rerun.

36. Current technician data is used.

37. Previously attempted technicians are excluded appropriately.

38. Old ranking is not blindly reused.

--------------------------------------------------
SCHEDULED TICKETS
--------------------------------------------------

39. Future scheduled ticket is not immediately assigned.

--------------------------------------------------
RACE / CONSISTENCY
--------------------------------------------------

40. Duplicate active offers are prevented.

41. Two accept attempts cannot produce two accepted technicians.

42. Assignment, ticket state, and workload remain consistent.

--------------------------------------------------
REGRESSION
--------------------------------------------------

43. Phase 1 tests pass.

44. Phase 2 tests pass.

45. Phase 3 tests pass.

46. Phase 4 tests pass.

47. Phase 5 tests pass.

==================================================
POSTMAN DEMO
==================================================

Provide a complete demo sequence.

SETUP:

Create:

Customer:
Siva

Category:
Plumbing

Technician Ravi:
- active
- on duty
- plumbing
- good ranking

Technician Kumar:
- active
- on duty
- plumbing
- second-best ranking

Technician Anil:
- off duty

Create ticket:

"Water is clogged in my washroom"

--------------------------------------------------

DEMO A: INITIAL OFFER

Call:

POST /tickets/{ticket_id}/assign

Expected:

Ravi receives OFFERED assignment.

--------------------------------------------------

DEMO B: ACCEPT

Call:

POST /assignments/{ravi_assignment_id}/accept

Expected:

Assignment → ACCEPTED
Ticket → ASSIGNED
Ravi workload → +1

--------------------------------------------------

DEMO C: DECLINE AND FALLBACK

Create another ticket.

Assign.

Ravi receives offer.

Call:

POST /assignments/{ravi_assignment_id}/decline

Expected:

Ravi → DECLINED

Routing runs again.

Ravi excluded from retry.

Kumar receives new OFFER.

--------------------------------------------------

DEMO D: ASK LATER

Create another ticket.

Offer to Ravi.

Call:

POST /assignments/{assignment_id}/ask-later

Expected:

Assignment remains pending/deferred.

No second offer exists.

Before deadline:

Ravi can accept.

--------------------------------------------------

DEMO E: TIMEOUT

Create another ticket.

Offer to Ravi.

Set up or manipulate test deadline appropriately.

Call:

POST /assignments/process-expired

Expected:

Ravi assignment → EXPIRED

Fallback runs.

Next best CURRENT eligible technician gets offer.

--------------------------------------------------

DEMO F: NO TECHNICIAN AVAILABLE

Make all relevant technicians:

- off duty
or
- fully loaded

Start assignment.

Expected:

No fake assignment.

Ticket remains unresolved.

Clear response:

NO_ELIGIBLE_TECHNICIAN_AVAILABLE

==================================================
WHAT NOT TO IMPLEMENT
==================================================

STRICTLY DO NOT IMPLEMENT:

- Customer feedback
- Customer confirmation
- Ticket resolution
- Ticket closure
- Ticket reopening
- Technician ratings calculation
- Customer-technician experience updates
- ML
- AI
- NLP
- LLM
- OAuth
- JWT
- Redis
- Celery
- Background workers
- Docker
- Frontend
- Google Maps
- Real notifications
- Email
- SMS
- Push notifications
- Admin escalation system
- Automatic technician suspension

Do not start future phases.

==================================================
IMPLEMENTATION ORDER
==================================================

STEP 1:
Inspect current codebase.

STEP 2:
Inspect current assignment and ticket models.

STEP 3:
Design the exact ticket and assignment state transitions.

STEP 4:
Make only necessary schema changes.

STEP 5:
Create and apply Alembic migration if required.

STEP 6:
Implement initial assignment service.

STEP 7:
Implement active-offer protection.

STEP 8:
Implement accept workflow.

STEP 9:
Test accept workflow.

STEP 10:
Implement decline workflow.

STEP 11:
Implement fallback rerouting.

STEP 12:
Test fallback with changed technician state.

STEP 13:
Implement ask-me-later workflow.

STEP 14:
Implement expiration processing service.

STEP 15:
Test timeout fallback.

STEP 16:
Add API endpoints.

STEP 17:
Add integration tests.

STEP 18:
Run complete test suite.

STEP 19:
Run Postman demonstrations.

STEP 20:
Show final folder structure.

==================================================
PHASE 5 ACCEPTANCE CRITERIA
==================================================

Phase 5 is complete only when:

1. A pending immediate ticket can enter assignment workflow.

2. The best currently ranked technician receives an offer.

3. Only one active offer exists for a ticket.

4. Technician can accept.

5. Accepting updates assignment state.

6. Accepting updates ticket state.

7. Accepting updates workload.

8. Technician can decline without automatic punishment.

9. Decline is stored in assignment history.

10. Decline triggers fallback routing.

11. Fallback reruns CURRENT eligibility.

12. Fallback reruns CURRENT ranking.

13. Stale ranking is not reused.

14. Previously declined/expired technicians are not immediately
    offered the same ticket again.

15. Technician can choose ask-me-later.

16. Ask-me-later cannot block the ticket indefinitely.

17. Offers have a response deadline.

18. Expired offers can be processed safely.

19. Timeout triggers fallback.

20. No-candidate cases are handled safely.

21. No fake assignment is created.

22. Future scheduled tickets are not assigned prematurely.

23. Assignment history is preserved.

24. Duplicate active offers are prevented.

25. Assignment, ticket status, and workload remain consistent.

26. All tests from Phase 1 through Phase 5 pass.

==================================================
FINAL EXPLANATION REQUIRED
==================================================

After implementation explain:

1. Ticket status versus assignment status.

2. The complete assignment state machine.

3. How initial assignment works.

4. What happens when a technician accepts.

5. What happens when a technician declines.

6. Why decline does not immediately mean punishment.

7. How ask-me-later works.

8. Why the response deadline still exists.

9. How timeout processing works in V1.

10. Why fallback reruns eligibility.

11. Why fallback reruns ranking.

12. How repeated offers are prevented.

13. How workload consistency is maintained.

14. How duplicate active offers are prevented.

15. How assignment history is preserved.

16. How scheduled tickets are protected from premature assignment.

17. How to test every major flow in Postman.

18. Final project folder structure.

Also provide this final flow:

PENDING TICKET
      ↓
ROUTING ENGINE
      ↓
BEST CURRENT TECHNICIAN
      ↓
CREATE OFFER
      ↓
   ┌───────────────┬────────────────┬───────────────┐
   ↓               ↓                ↓               ↓
ACCEPT          DECLINE        ASK LATER        NO RESPONSE
   ↓               ↓                ↓               ↓
ASSIGNED       REROUTE       WAIT UNTIL        EXPIRE
   │               ↓            DEADLINE          ↓
   │          CURRENT DATA         │           REROUTE
   │               ↓               ↓               ↓
   │          NEW BEST TECHNICIAN  EXPIRE      NEW BEST
   │               ↓               ↓           TECHNICIAN
   └───────────────┴───────────────┴───────────────┘

Do not begin Phase 6.

Stop after Phase 5 is completely implemented and tested.

after phase 5 im expecting
Customer raises problem
        ↓
System intelligently finds best technician
        ↓
Technician gets offer
        ↓
Accept? ──────── Yes → Assigned
   │
   No
   ↓
Decline / Timeout
   ↓
System thinks again using LIVE data
   ↓
Finds another suitable technician
   ↓
Offers ticket again

