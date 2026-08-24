I am continuing my internship project called Smart-HelpDesk.

Phase 1 through Phase 5 are complete.

You must implement ONLY Phase 6:

SERVICE EXECUTION,
TECHNICIAN ARRIVAL,
WORK START,
WORK COMPLETION,
CUSTOMER CONFIRMATION,
CUSTOMER FEEDBACK,
TICKET CLOSURE,
AND TICKET REOPENING.

This is the final planned backend MVP phase.

Do not implement frontend, ML, OAuth, JWT, Redis, Celery,
Docker, notifications, or unrelated future features.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk and
service-ticket routing system.

A customer raises a maintenance request.

The system:

1. Stores the request.
2. Finds eligible technicians.
3. Ranks them.
4. Offers the ticket.
5. Technician accepts.
6. Technician performs the service.
7. Customer confirms whether the issue was actually resolved.
8. Customer gives quick feedback.
9. The system stores historical outcome data.
10. The ticket closes or reopens.

The system should eventually use accumulated historical data
for analytics and possible ML experimentation.

However, ML is NOT part of this phase.

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
- Core models

Phase 3:
- Customer, technician, category, ticket APIs
- Validation
- Scheduled ticket persistence

Phase 4:
- Technician eligibility
- Deterministic ranking
- Routing preview

Phase 5:
- Initial assignment
- Technician offer
- Accept
- Decline
- Ask-me-later
- Offer expiration
- Fallback rerouting
- Assignment history
- Workload updates

Before changing anything:

1. Inspect the actual project structure.
2. Inspect current TicketStatus enum.
3. Inspect TechnicianAssignment.
4. Inspect CustomerTechnicianHistory.
5. Inspect technician rating/statistics fields.
6. Inspect existing ticket lifecycle logic.
7. Inspect existing tests.
8. Adapt to the actual implementation.

Do not blindly assume this prompt exactly matches the codebase.

==================================================
PHASE 6 OBJECTIVE
==================================================

Complete the service lifecycle.

After a technician accepts a ticket, implement:

ASSIGNED
    ↓
ARRIVED
    ↓
IN_PROGRESS
    ↓
AWAITING_CUSTOMER_CONFIRMATION
    ↓
CUSTOMER DECISION
    ├── CONFIRMED
    │      ↓
    │   FEEDBACK
    │      ↓
    │   CLOSED
    │
    └── NOT RESOLVED
           ↓
         REOPENED
           ↓
      AVAILABLE FOR REROUTING

Keep the workflow explicit and auditable.

==================================================
IMPORTANT PRODUCT PRINCIPLE
==================================================

A technician marking a job as completed does NOT mean the
ticket is automatically closed.

The customer should confirm the outcome.

This protects customers and provides better quality data.

The distinction is:

Technician says:
"I completed my work."

Customer says:
"Yes, my issue is resolved."

Only after the customer-side completion flow should the ticket
become CLOSED.

==================================================
TICKET LIFECYCLE
==================================================

Inspect existing statuses.

If necessary, extend them cleanly.

Conceptual lifecycle:

PENDING
    ↓
ASSIGNMENT_PENDING
    ↓
ASSIGNED
    ↓
ARRIVED
    ↓
IN_PROGRESS
    ↓
AWAITING_CUSTOMER_CONFIRMATION
    ↓
CLOSED

Alternative path:

AWAITING_CUSTOMER_CONFIRMATION
    ↓
REOPENED
    ↓
PENDING / REROUTING

Do not blindly use these exact names if the existing code has
better naming.

Keep the state machine understandable.

==================================================
TECHNICIAN ARRIVAL
==================================================

Implement a technician action for arrival.

Suggested:

POST /api/v1/tickets/{ticket_id}/arrive

Or follow the existing API conventions.

Requirements:

1. Only the technician with the accepted assignment can mark arrival.
2. Ticket must be in the correct state.
3. Store arrived_at timestamp.
4. Update ticket status appropriately.
5. Prevent duplicate or invalid transitions.

Example:

ASSIGNED
    ↓
Technician marks arrived
    ↓
ARRIVED

Do not implement GPS verification in this phase.

Do not claim location was verified.

==================================================
START WORK
==================================================

Implement:

POST /api/v1/tickets/{ticket_id}/start-work

Requirements:

1. Only accepted assigned technician can perform action.
2. Technician must have arrived first.
3. Store work_started_at timestamp.
4. Ticket moves to IN_PROGRESS.
5. Invalid transitions are rejected.

Example:

ARRIVED
    ↓
START WORK
    ↓
IN_PROGRESS

==================================================
MARK WORK COMPLETED
==================================================

Implement:

POST /api/v1/tickets/{ticket_id}/complete-work

The technician indicates that their work is finished.

This does NOT close the ticket.

Requirements:

1. Ticket must be IN_PROGRESS.
2. Only assigned technician can complete work.
3. Store work_completed_at timestamp.
4. Optionally store a short technician completion note.
5. Move ticket to:

AWAITING_CUSTOMER_CONFIRMATION

Do not mark:

CLOSED

Do not finalize technician statistics yet.

The customer still needs to respond.

==================================================
CUSTOMER CONFIRMATION
==================================================

The customer should see a very short confirmation experience.

Conceptually:

┌─────────────────────────────────────┐
│          HOW DID IT GO?             │
│                                     │
│ Was your issue resolved?            │
│                                     │
│       [ YES ]       [ NO ]          │
│                                     │
│ If YES:                              │
│ Rate your experience                │
│                                     │
│  ☆ ☆ ☆ ☆ ☆                          │
│                                     │
│ Optional:                           │
│ [ Tell us more...                 ] │
│                                     │
│           [ SUBMIT ]                │
└─────────────────────────────────────┘

The API should support this simple UX.

Do not require a long feedback form.

Feedback should be quick.

==================================================
CUSTOMER CONFIRMS RESOLVED
==================================================

If customer says YES:

1. Validate ticket is awaiting customer confirmation.
2. Record customer confirmation.
3. Record feedback.
4. Record rating if supplied.
5. Update customer-technician history.
6. Update technician aggregate metrics as appropriate.
7. Reduce technician current workload.
8. Close ticket.
9. Preserve all history.

Conceptual flow:

AWAITING_CUSTOMER_CONFIRMATION
            ↓
Customer confirms YES
            ↓
Store feedback
            ↓
Update historical metrics
            ↓
CLOSED

==================================================
FEEDBACK DESIGN
==================================================

Keep V1 feedback intentionally short.

Suggested required fields:

was_issue_resolved: boolean

Suggested optional fields:

rating: integer 1 to 5
comment: string

Important:

If the issue was NOT resolved, do not force the customer to
provide a long explanation.

A simple optional comment is enough.

The system should not depend on customers writing paragraphs.

==================================================
GOOD / BAD EXPERIENCE
==================================================

Our routing system uses customer-technician history.

Therefore feedback should allow us to determine whether an
interaction was positive, negative, or neutral.

Do not ask the customer directly:

"Was the technician good or bad?"

Infer a simple experience outcome from:

was_issue_resolved
rating

Example V1 policy:

Positive experience:

Issue resolved = true
AND rating is high enough

Negative experience:

Issue resolved = false

OR rating is sufficiently low

Neutral:

Other cases

Do not hide this logic.

Centralize and document the thresholds.

Do not scatter magic numbers.

The exact thresholds should be easy to change later.

==================================================
CUSTOMER-TECHNICIAN HISTORY UPDATE
==================================================

When feedback is finalized:

Find history for:

customer_id
+
technician_id

If no history exists:

Create one.

If history exists:

Update it.

Possible fields:

positive_interactions
negative_interactions
neutral_interactions
total_interactions
last_interaction_at

Use the existing model where possible.

Do not create duplicate history rows.

There should logically be one history relationship per:

customer + technician

Use database constraints where appropriate.

==================================================
TECHNICIAN OVERALL RATING
==================================================

The technician's overall rating should be based on customer
feedback.

Do not let the client directly modify overall_rating.

The server owns rating calculation.

Use a clear V1 approach.

Possible options:

Option A:
Maintain rating sum + rating count.

Option B:
Query all feedback and calculate average.

For V1, choose the approach that best fits the existing model.

If maintaining aggregates:

rating_sum
rating_count
overall_rating

Update them transactionally.

Example:

Old:

rating_sum = 18
rating_count = 4
overall_rating = 4.5

New customer gives:

rating = 5

New:

rating_sum = 23
rating_count = 5
overall_rating = 4.6

Do not calculate the average incorrectly.

==================================================
NO RATING CASE
==================================================

Customer may confirm resolution but skip the rating.

This must be allowed.

In that case:

- Interaction history still updates.
- Completed job statistics still update.
- Overall rating does not receive a fake value.

Do not assume skipped rating = 5.

Do not assume skipped rating = 0.

==================================================
CUSTOMER REJECTS RESOLUTION
==================================================

If customer says:

NO

meaning:

"The issue is not resolved."

Then:

1. Record customer response.
2. Optionally store comment.
3. Do NOT close ticket.
4. Increase reopen count.
5. Update relevant technician quality statistics.
6. Update customer-technician history negatively.
7. Reduce workload of the previous technician if appropriate.
8. Move ticket into a reroutable state.
9. Preserve previous assignment history.

Conceptual flow:

AWAITING_CUSTOMER_CONFIRMATION
            ↓
Customer says NO
            ↓
REOPENED
            ↓
Previous work attempt remains recorded
            ↓
Ticket becomes available for routing again

==================================================
REOPEN RATE
==================================================

Phase 4 ranking uses reopen rate.

Therefore Phase 6 must maintain the underlying data correctly.

Conceptually:

reopen_rate =
reopened_jobs_count / completed_jobs_count

Define carefully what completed_jobs_count means.

A suggested interpretation:

completed_jobs_count:
Number of accepted service attempts that reached a customer
outcome.

reopened_jobs_count:
Number of those attempts where the customer reported that the
issue was not resolved and the ticket had to reopen.

Avoid double counting.

Example:

One ticket:

Ravi attempts work
Customer rejects
Ticket reopens

Ravi:

completed_jobs_count +1
reopened_jobs_count +1

Then Kumar fixes it.

Customer confirms.

Kumar:

completed_jobs_count +1
reopened_jobs_count +0

Do not increment the original technician's reopen count again
on every future ticket state change.

==================================================
REOPENING AND REROUTING
==================================================

When a ticket is reopened, the previous technician should not
automatically receive the same ticket again.

Reason:

The customer has just indicated that the issue was not resolved.

For V1:

Exclude the previous unsuccessful technician from the immediate
rerouting attempt for that ticket.

Then:

REOPENED
    ↓
Run routing again
    ↓
Eligibility
    ↓
Ranking
    ↓
Choose another current technician if available
    ↓
Create a new assignment offer

Reuse the Phase 5 fallback/rerouting architecture where possible.

Do not duplicate routing logic.

==================================================
WHAT IF NO OTHER TECHNICIAN EXISTS?
==================================================

Possible situation:

Ravi attempted work.

Customer says:

NOT RESOLVED.

There are no other eligible technicians.

Do not give the ticket back to Ravi immediately.

Do not close the ticket.

Keep the ticket unresolved in an appropriate state.

Return a clear result such as:

NO_ALTERNATIVE_TECHNICIAN_AVAILABLE

The ticket remains visible for future operational handling.

==================================================
WORKLOAD RELEASE
==================================================

A technician's workload increased when they accepted.

It must eventually decrease.

On successful customer-confirmed closure:

current_workload -= 1

On rejected resolution/reopen:

current_workload for the previous technician must also be
released because they are no longer actively responsible for
the ticket.

Do not allow workload to go below zero.

Use safe logic and tests.

==================================================
TRANSACTION SAFETY
==================================================

Customer confirmation can update multiple things.

Example successful resolution:

Feedback record
+
CustomerTechnicianHistory
+
Technician rating
+
Technician completed statistics
+
Technician workload
+
Ticket status

These changes must be transactionally consistent.

If a critical update fails:

Do not leave half-updated data.

Use the database transaction/session correctly.

==================================================
FEEDBACK DATA MODEL
==================================================

Inspect whether a feedback model already exists.

If not, create a minimal TicketFeedback model.

Possible fields:

id
ticket_id
customer_id
technician_id
was_issue_resolved
rating
comment
created_at

Requirements:

1. Feedback must belong to a ticket.
2. Customer must match ticket customer.
3. Technician should match the technician who performed the
   accepted/current work attempt.
4. Rating must be validated if present.
5. One finalized customer feedback record per service attempt,
   depending on the reopening design.

Think carefully about reopened tickets.

A ticket may have multiple technician attempts.

Do not design the feedback model in a way that prevents
recording historical outcomes for multiple attempts.

If necessary, associate feedback with:

assignment_id

rather than only ticket_id.

Choose the cleaner data model based on the existing assignment
architecture.

Explain the choice.

==================================================
IMPORTANT DATA FOR FUTURE ML
==================================================

Do not build ML.

But preserve useful outcome data.

The historical system should eventually allow us to learn from:

Ticket characteristics
+
Technician characteristics at assignment time
+
Assignment decision
+
Customer outcome

Examples of useful historical signals:

- ticket category
- customer
- technician
- assignment attempt
- technician rating at the time
- workload at assignment time
- location/proximity score
- customer-technician history
- reopen outcome
- resolution outcome
- customer rating

Do not build a complex analytics warehouse.

Simply avoid deleting information that could be useful later.

==================================================
ENDPOINTS
==================================================

Follow existing API conventions.

Possible endpoints:

POST /api/v1/tickets/{ticket_id}/arrive

POST /api/v1/tickets/{ticket_id}/start-work

POST /api/v1/tickets/{ticket_id}/complete-work

POST /api/v1/tickets/{ticket_id}/customer-response

Possible request:

{
    "was_issue_resolved": true,
    "rating": 5,
    "comment": "Quick and helpful service"
}

Or:

{
    "was_issue_resolved": false,
    "rating": 1,
    "comment": "Water is still leaking"
}

Possible history endpoint:

GET /api/v1/tickets/{ticket_id}/feedback-history

Only add endpoints that genuinely fit the project.

==================================================
AUTHORIZATION PLACEHOLDER
==================================================

Real authentication is not implemented yet.

However, maintain clean service boundaries.

Do not permanently trust arbitrary client IDs in a way that
will make future OAuth/JWT integration difficult.

Where technician/customer identity must be validated, use the
current project's temporary identity/testing approach cleanly.

Document where future authentication would plug in.

Do not implement OAuth/JWT in this phase.

==================================================
INVALID TRANSITIONS
==================================================

The system must reject invalid lifecycle actions.

Examples:

PENDING
→ start work

Invalid.

ASSIGNED
→ complete work

Invalid if arrival/start are required.

IN_PROGRESS
→ arrive

Invalid.

CLOSED
→ complete work

Invalid.

AWAITING_CUSTOMER_CONFIRMATION
→ technician starts work again

Invalid.

Customer response on a ticket not awaiting confirmation:

Invalid.

Repeated feedback submission for the same completed assignment:

Invalid.

Use controlled errors.

Do not silently change states.

==================================================
AUDITABILITY
==================================================

Important events should remain traceable.

At minimum preserve timestamps:

offered_at
accepted_at
arrived_at
work_started_at
work_completed_at
customer_responded_at
closed_at

Use existing fields where available.

Add only necessary fields.

Use Alembic migrations for schema changes.

==================================================
TESTING REQUIREMENTS
==================================================

Test thoroughly.

--------------------------------------------------
ARRIVAL
--------------------------------------------------

1. Accepted assigned technician can mark arrival.

2. Wrong technician cannot mark arrival.

3. Arrival timestamp is stored.

4. Ticket state changes correctly.

5. Arrival cannot happen twice.

6. Ticket cannot arrive from invalid state.

--------------------------------------------------
START WORK
--------------------------------------------------

7. Technician can start work after arrival.

8. Start timestamp is stored.

9. Status becomes IN_PROGRESS.

10. Start work before arrival fails.

11. Wrong technician cannot start work.

--------------------------------------------------
COMPLETE WORK
--------------------------------------------------

12. Technician can complete work from IN_PROGRESS.

13. Completion timestamp is stored.

14. Status becomes AWAITING_CUSTOMER_CONFIRMATION.

15. Ticket does not become CLOSED yet.

16. Complete work from invalid state fails.

--------------------------------------------------
CUSTOMER SUCCESS RESPONSE
--------------------------------------------------

17. Customer can confirm issue resolved.

18. Ticket closes.

19. Feedback is stored.

20. Optional rating updates technician rating.

21. Missing rating does not create fake rating data.

22. Positive customer-technician history updates correctly.

23. Completed job statistics update correctly.

24. Technician workload decreases correctly.

25. Workload does not become negative.

--------------------------------------------------
CUSTOMER FAILURE RESPONSE
--------------------------------------------------

26. Customer can report issue not resolved.

27. Ticket does not close.

28. Reopen count updates correctly.

29. Previous technician quality/reopen metrics update correctly.

30. Negative customer-technician history updates correctly.

31. Previous technician workload is released.

32. Ticket becomes reroutable.

33. Previous unsuccessful technician is excluded from immediate
    rerouting.

34. Alternative technician receives offer if available.

35. No alternative technician is handled safely.

--------------------------------------------------
RATING
--------------------------------------------------

36. Rating outside allowed range is rejected.

37. Overall rating calculation is correct.

38. Multiple ratings calculate correctly.

39. Missing rating does not alter rating average incorrectly.

--------------------------------------------------
FEEDBACK
--------------------------------------------------

40. Wrong customer cannot submit feedback.

41. Duplicate feedback for same service attempt is rejected.

42. Feedback history is preserved after reopening.

--------------------------------------------------
TRANSACTIONS
--------------------------------------------------

43. Successful resolution updates all related records consistently.

44. Failed transaction does not leave partial state.

--------------------------------------------------
REGRESSION
--------------------------------------------------

45. Phase 1 tests pass.

46. Phase 2 tests pass.

47. Phase 3 tests pass.

48. Phase 4 tests pass.

49. Phase 5 tests pass.

50. Phase 6 tests pass.

==================================================
POSTMAN DEMO
==================================================

Provide a complete end-to-end demonstration.

--------------------------------------------------
DEMO A: SUCCESSFUL SERVICE
--------------------------------------------------

1. Create customer.

2. Create category.

3. Create technicians.

4. Create ticket.

5. Run assignment.

6. Best technician accepts.

7. Technician marks arrived.

8. Technician starts work.

9. Technician completes work.

Expected:

Ticket:

AWAITING_CUSTOMER_CONFIRMATION

10. Customer responds:

{
    "was_issue_resolved": true,
    "rating": 5,
    "comment": "Quick and helpful"
}

Expected:

Ticket → CLOSED

Feedback stored.

Technician rating updated.

Customer-technician positive history updated.

Technician workload reduced.

--------------------------------------------------
DEMO B: REOPEN
--------------------------------------------------

1. Create a new ticket.

2. Assign Ravi.

3. Ravi accepts.

4. Ravi arrives.

5. Ravi starts work.

6. Ravi completes work.

7. Customer responds:

{
    "was_issue_resolved": false,
    "rating": 1,
    "comment": "Issue is still there"
}

Expected:

Ticket does NOT close.

Ticket → REOPENED / reroutable state.

Ravi's attempt remains in history.

Ravi's negative customer history updates.

Ravi's reopen metrics update.

Ravi's workload is released.

Rerouting runs.

Ravi is excluded from immediate retry.

Another eligible technician receives offer.

--------------------------------------------------
DEMO C: NO ALTERNATIVE
--------------------------------------------------

Repeat failed resolution.

Make all alternative technicians unavailable.

Customer says issue is not resolved.

Expected:

Ticket remains unresolved.

No fake closure.

No immediate reassignment to failed technician.

Clear result:

NO_ALTERNATIVE_TECHNICIAN_AVAILABLE

==================================================
WHAT NOT TO IMPLEMENT
==================================================

STRICTLY DO NOT IMPLEMENT:

- ML model
- AI routing
- NLP
- LLM calls
- OAuth
- JWT
- Redis
- Celery
- Background workers
- Docker
- Frontend
- Email notifications
- SMS notifications
- Push notifications
- Google Maps
- GPS verification
- Admin dashboard
- Analytics dashboard
- Technician automatic suspension
- Complex escalation workflows

Do not start another phase.

==================================================
IMPLEMENTATION ORDER
==================================================

STEP 1:
Inspect the current codebase.

STEP 2:
Design and document valid ticket state transitions.

STEP 3:
Inspect assignment history design.

STEP 4:
Design feedback association carefully, especially for reopened
tickets with multiple technicians.

STEP 5:
Make only necessary model/schema changes.

STEP 6:
Create Alembic migration.

STEP 7:
Implement arrival.

STEP 8:
Test arrival.

STEP 9:
Implement start work.

STEP 10:
Test start work.

STEP 11:
Implement complete work.

STEP 12:
Test complete work.

STEP 13:
Implement feedback model/service.

STEP 14:
Implement successful customer confirmation.

STEP 15:
Update technician rating/history/workload transactionally.

STEP 16:
Test successful closure.

STEP 17:
Implement failed customer confirmation.

STEP 18:
Update reopen metrics.

STEP 19:
Release technician workload.

STEP 20:
Reuse Phase 5 rerouting for alternative technician selection.

STEP 21:
Test reopening.

STEP 22:
Test no-alternative case.

STEP 23:
Add API endpoints.

STEP 24:
Run full regression suite.

STEP 25:
Perform complete Postman demonstration.

STEP 26:
Show final project structure.

==================================================
PHASE 6 ACCEPTANCE CRITERIA
==================================================

Phase 6 is complete only when:

1. Accepted technician can mark arrival.

2. Technician can start work after arrival.

3. Technician can complete work after starting.

4. Completing work does not automatically close the ticket.

5. Ticket waits for customer confirmation.

6. Customer can confirm successful resolution.

7. Customer can report unsuccessful resolution.

8. Feedback is quick and optional beyond the essential outcome.

9. Successful resolution closes the ticket.

10. Customer rating updates technician rating correctly.

11. Skipped rating does not create fake rating data.

12. Customer-technician history is updated.

13. Customer-specific positive experience can improve future
    routing.

14. Customer-specific negative experience can penalize future
    routing.

15. Unsuccessful resolution updates reopen metrics correctly.

16. Reopened tickets remain unresolved.

17. Previous unsuccessful technician is not immediately reused.

18. Alternative technician can be selected through existing
    routing logic.

19. No-alternative cases are handled safely.

20. Technician workload is released correctly.

21. Assignment history is never deleted.

22. Feedback and outcome history are preserved.

23. Invalid state transitions are rejected.

24. Duplicate feedback is prevented.

25. All Phase 1 through Phase 6 tests pass.

==================================================
FINAL EXPLANATION REQUIRED
==================================================

After implementation explain:

1. The complete final ticket lifecycle.

2. The difference between technician-completed and
   customer-confirmed.

3. Why customer confirmation exists.

4. How feedback remains short.

5. How positive/negative customer experience is determined.

6. How customer-technician history updates.

7. How technician overall rating is calculated.

8. How skipped ratings are handled.

9. How reopen metrics are calculated.

10. What happens when customer says the issue is not resolved.

11. Why the previous technician is excluded from immediate retry.

12. How alternative routing works.

13. How workload is released.

14. How feedback is associated with assignment/service attempts.

15. What historical data is now available for future ML.

16. Where OAuth/JWT would later integrate.

17. How to run the complete workflow in Postman.

18. Final project folder structure.

Also provide the complete final flow:

CUSTOMER RAISES TICKET
        ↓
VALIDATE + STORE
        ↓
ROUTING ENGINE
        ↓
ELIGIBILITY
        ↓
RANKING
        ↓
TECHNICIAN OFFER
        ↓
ACCEPT
        ↓
ARRIVE
        ↓
START WORK
        ↓
COMPLETE WORK
        ↓
AWAIT CUSTOMER CONFIRMATION
        ↓
    ┌───────────────┐
    │               │
RESOLVED? YES    RESOLVED? NO
    │               │
    ↓               ↓
FEEDBACK         REOPEN
    │               │
    ↓               ↓
UPDATE HISTORY   UPDATE REOPEN METRICS
    │               │
    ↓               ↓
CLOSE TICKET     REROUTE TO ALTERNATIVE
                    ↓
                 NEW OFFER

Do not begin frontend implementation.

Do not begin ML implementation.

Stop after Phase 6 is fully implemented and tested.