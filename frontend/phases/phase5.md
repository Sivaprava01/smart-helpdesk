We are continuing my internship project: **Smart-HelpDesk**.

Phases 1–4 of the frontend implementation are complete and tested.

Your task is to complete the entire **Phase 5 — Complete Lifecycle & Customer Resolution** implementation from start to finish.

# 1. READ AND INSPECT EVERYTHING FIRST

Before making any changes, carefully inspect:

- the existing frontend implementation from Phases 1–4
- `frontend/phases/frontend_guidelines.md`
- `frontend/phases/ui.md`
- all relevant backend routes
- Pydantic schemas
- database models
- enums
- services
- lifecycle logic
- assignment logic
- customer feedback logic
- existing backend tests
- existing frontend components and API services

Also, **actively use the configured Stitch MCP** to retrieve and inspect the relevant Stitch screens before implementing anything.

Relevant Stitch designs include:

- **Ticket Details & Lifecycle Hub**
- **Service Resolution Verification**
- **Ticket Details Skeleton / Loading State**
- any related assignment history, lifecycle, feedback, reopened, or empty states available in the Stitch project

**Stitch is mandatory for visual implementation. Do not recreate the screens from memory or make up a generic SaaS version. Retrieve the actual Stitch screens through MCP and work from them.**

---

# 2. THE MOST IMPORTANT RULE — DO NOT CHANGE THE BACKEND

The backend is already implemented through the completed backend phases.

**DO NOT MODIFY THE BACKEND.**

Do not change:

- backend routes
- endpoint paths
- HTTP methods
- request schemas
- response schemas
- database models
- enums
- service logic
- routing logic
- assignment logic
- lifecycle transitions
- feedback logic
- tests

Do not modify the backend simply because changing it would make frontend implementation easier.

Instead:

1. inspect the existing backend
2. identify the exact API contract
3. build the frontend around it
4. connect the frontend correctly

For every backend-integrated feature, verify:

- endpoint
- HTTP method
- path parameters
- query parameters
- request body
- response structure
- possible errors
- lifecycle side effects

**The objective is zero frontend/backend contract mismatch.**

If a Stitch design contains functionality not supported by the backend, do not invent backend behavior. Preserve the visual intent while only implementing real supported behavior.

---

# 3. SOURCE OF TRUTH

Keep these responsibilities strictly separate:

**Stitch MCP = visual design and layout source of truth**

**Backend = behavior, lifecycle rules, API contracts, and real data source of truth**

**`frontend_guidelines.md` = product UX and frontend implementation rules**

Do not mix these responsibilities.

---

# 4. PHASE 5 GOAL

Complete the final Smart-HelpDesk lifecycle by implementing:

- Ticket Details & Lifecycle Hub
- full lifecycle progress visibility
- current ticket state
- current assignment state
- assignment/service attempt history
- customer resolution verification
- YES → resolution/closure flow
- NO → unresolved/reopen flow
- alternative routing visibility where actually performed by the backend
- rating and feedback where supported
- feedback history where supported
- loading states
- empty states
- error states
- success states
- responsive behavior
- complete end-to-end integration
- regression testing of previous phases

This phase should complete the journey from:

```text
Ticket created
↓
Routing
↓
Technician offer
↓
Acceptance
↓
Arrival
↓
Work started
↓
Work completed
↓
Customer verification
↓
YES → Closed

OR

NO → Reopened → Alternative routing where supported

5. IMPLEMENT THE TICKET DETAILS & LIFECYCLE HUB

Implement the Ticket Details screen according to the actual Stitch MCP design.

Expected route conceptually:

/tickets/:id

However, inspect the existing frontend router and preserve the established route structure if it differs.

The page should clearly answer:

What happened?

What is happening now?

What happens next?

Recommended hierarchy:

Ticket identity + current status
        ↓
Issue summary
        ↓
Current assignment / current action
        ↓
Lifecycle progress
        ↓
Assignment/service attempt history
        ↓
Customer confirmation / feedback
        ↓
Operational details

Do not make this page a database dump.

Do not add random KPI cards or decorative sections.

Use the actual backend response and the existing design system.

6. FULL LIFECYCLE PROGRESS

Display the ticket lifecycle using the actual backend status.

Conceptually the lifecycle may contain:

PENDING
ROUTING
ASSIGNED
ARRIVED
IN_PROGRESS
AWAITING_CUSTOMER_CONFIRMATION
CLOSED

A ticket may also become:

REOPENED
↓
ROUTING

However, inspect the actual backend implementation and enums first.

Do not hardcode transitions that the backend does not support.

The lifecycle UI must:

show completed stages
clearly highlight the current stage
distinguish upcoming stages
correctly represent reopened tickets
correctly represent routing/fallback situations
work responsively on mobile
match the Stitch design
7. CRITICAL RULE — TICKET STATUS AND ASSIGNMENT STATUS ARE DIFFERENT

Never merge these concepts.

Ticket status may be:

Routing
Assigned
Arrived
In Progress
Awaiting Customer Confirmation
Closed
Reopened

Assignment status may be:

Offered
Deferred
Accepted
Declined
Expired
Completed

Incorrect:

Ticket: Declined

Correct:

Ticket status:
Routing

Previous assignment attempt:
Declined

Current state:
Finding another eligible technician

The frontend must preserve this distinction everywhere.

Reuse the shared status mapping and status components created in earlier phases.

Do not create duplicate or inconsistent status systems.

8. IMPLEMENT ASSIGNMENT / SERVICE ATTEMPT HISTORY

Inspect and integrate the real assignment history endpoint.

Expected capability to verify:

GET /api/v1/tickets/{id}/assignments

Do not assume its response structure. Inspect the backend first.

Create a historical timeline that preserves all attempts.

Example:

Attempt 1

Technician A
Offered
Declined

↓

Attempt 2

Technician B
Accepted
Arrived
Started work
Completed

Customer result:
Issue unresolved

↓

Attempt 3

Currently routing

Requirements:

preserve historical attempts
do not overwrite previous technicians
distinguish current and historical attempts
show declined attempts
show deferred attempts where available
show expired attempts
show accepted attempts
show completed attempts
show fallback attempts chronologically
handle no assignment history gracefully
handle missing optional fields safely

Follow the Stitch design rather than inventing a generic timeline.

9. CURRENT ASSIGNMENT / CURRENT ACTION

Clearly display what is happening right now.

Depending on real backend data, this may be:

pending
routing
active technician offer
accepted technician
technician assigned
technician arrived
work in progress
awaiting customer confirmation
closed
reopened
no eligible alternative technician

Do not invent a technician if none is assigned.

Do not leave expired actions looking active.

Do not display stale assignment information.

10. IMPLEMENT CUSTOMER RESOLUTION VERIFICATION

Use Stitch MCP to inspect and implement the Service Resolution Verification design.

Expected route conceptually:

/tickets/:id/confirm

Respect the existing frontend routing structure.

The primary question should clearly communicate:

Was your issue completely resolved?

The two actions must be unmistakably different:

YES, ISSUE IS RESOLVED

and

NO, THE ISSUE IS STILL UNRESOLVED

This is a core Smart-HelpDesk product flow.

Do not reduce it to a tiny generic modal.

The customer must understand that technician completion does not automatically mean closure.

11. YES FLOW — CUSTOMER CONFIRMS RESOLUTION

Inspect the backend before implementation.

Expected endpoint to verify:

POST /api/v1/tickets/{id}/customer-response

Determine the exact:

request body
required fields
optional fields
rating rules
comment rules
response structure
resulting ticket status
technician workload side effects
rating calculation side effects

If supported by the backend, allow:

confirmation of resolution
rating
optional feedback

On successful submission, show the actual backend result.

Example:

Issue resolved

Thank you for confirming the repair.

Your request is now closed.

Do not claim closure unless the backend actually moved the ticket to CLOSED.

Refresh/update all relevant frontend state after submission.

Prevent duplicate submissions.

12. NO FLOW — CUSTOMER REPORTS UNRESOLVED

Inspect the exact backend behavior.

If supported, allow the customer to explain what remains unresolved.

Submit only fields supported by the actual API.

After submission:

show the real resulting ticket state
preserve the previous service attempt
preserve assignment history
update lifecycle progress
display reopening accurately
display fallback routing accurately if it actually happens

Possible messaging:

Issue reported as unresolved

Your request has been reopened.

If the backend begins alternative routing, communicate that clearly.

If the backend reports no eligible alternative technician, show that actual outcome.

For example:

No alternative technician is currently available

Your request remains open and requires further operational attention.

Do not promise:

immediate service
a specific technician
a senior technician
automatic fallback

unless the backend actually guarantees it.

13. IMPLEMENT FEEDBACK HISTORY

Inspect and integrate the actual feedback history endpoint.

Expected capability to verify:

GET /api/v1/tickets/{id}/feedback-history

Do not assume the response shape.

If supported by the backend, display relevant feedback history such as:

customer decision
rating
feedback/comment
timestamp
relevant service attempt where available

Do not display fake feedback.

If no feedback exists, use a meaningful empty state.

14. LOADING STATES

Use the actual Stitch skeleton/loading design.

Implement appropriate loading states for:

ticket details
lifecycle information
assignment history
feedback history
customer response submission
post-submission refresh

Do not put one generic spinner in the middle of every screen.

Use skeletons that approximately match the final layout.

Reuse the existing shared Skeleton components from earlier phases wherever appropriate.

15. EMPTY STATES

Implement meaningful empty states based on actual backend data.

Consider:

No assignment attempts
No assignment attempts yet

This request has not been offered to a technician yet.
No feedback
No customer feedback yet

Feedback will appear here after the service result is reviewed.
No assigned technician
No technician is currently assigned

The current ticket status will determine the next operational step.
No alternative technician

Use the exact backend result/state.

Do not invent behavior.

Do not use oversized decorative illustrations.

Reuse the shared EmptyState component and follow the design system.

16. ERROR STATES

Handle useful, specific errors including:

ticket not found
failed ticket load
failed assignment history load
failed feedback history load
failed customer response submission
response already processed
invalid lifecycle transition
network failure
unauthorized response where applicable

Bad:

Something went wrong.

Better:

We couldn't load this ticket. Please try again.

Or:

This ticket could not be found or is no longer available.

Do not expose raw backend exceptions to the user.

17. SUCCESS STATES

Use the existing shared toast/feedback system.

Success messages should communicate the real state transition.

Examples:

Issue confirmed resolved

The ticket is now closed.
Issue reported unresolved

The ticket has been reopened.

Avoid meaningless:

Success!

The wording must match the actual backend result.

18. FORMS AND VALIDATION

For rating, feedback, and unresolved explanations:

only use fields supported by the backend
use clear labels
do not rely only on placeholders
validate against backend constraints
show errors near the relevant field
disable duplicate submissions
preserve entered content after recoverable failure where appropriate
support keyboard interaction
remain accessible

Do not add fields simply because the Stitch layout has room.

19. RESPONSIVE IMPLEMENTATION

Ensure Phase 5 works on:

desktop
tablet
mobile

The customer resolution flow must be particularly mobile-friendly.

Ensure:

lifecycle remains understandable
assignment timeline remains readable
long descriptions do not break the layout
long technician names are handled
buttons remain touch-friendly
primary actions remain visible
no unnecessary horizontal scrolling occurs

Use the responsive behavior implied by the Stitch designs.

Do not simply shrink the desktop layout.

20. REAL-DATA EDGE CASES

Explicitly test:

very long ticket descriptions
long technician names
many assignment attempts
declined assignment
deferred assignment
expired assignment
accepted assignment
completed work
reopened ticket
closed ticket
awaiting customer confirmation
no assignments
no feedback
no active technician
no alternative technician
missing optional notes
slow API
failed API
duplicate customer response attempt

The UI must work with real data, not just ideal demo data.

21. REUSE EXISTING PHASES 1–4 WORK

Do not rewrite existing architecture unnecessarily.

Inspect and reuse:

API client
service layer
hooks
layout
navigation
status mappings
TicketStatusBadge
AssignmentStatusBadge
EmptyState
ErrorState
Skeleton
Modal/Dialog
Toast system
existing form components
existing responsive utilities

The typography must remain exactly:

--font-display: "DM Serif Display", Georgia, serif;
--font-body: "Manrope", Arial, sans-serif;
--font-mono: "IBM Plex Mono", "Courier New", monospace;

Do not replace or randomly modify the typography system.

22. STITCH MCP IS REQUIRED

Actively use the configured Stitch MCP throughout this phase.

Before implementing each major screen:

retrieve the Stitch screen
inspect the actual visual hierarchy
inspect layout and spacing
inspect typography usage
inspect information grouping
inspect responsive intent where available
identify reusable patterns
implement the actual frontend accordingly

Relevant priority screens:

Ticket Details & Lifecycle Hub
Service Resolution Verification
Ticket Details Skeleton / Loading State

Do not ignore Stitch and produce a generic dashboard implementation.

23. DO NOT ADD FAKE AUTH OR ROLE LOGIC

Do not add:

fake login behavior
fake JWTs
fake sessions
fake role switching
fake permissions

Do not expand unsupported authentication functionality.

Phase 5 is about completing the lifecycle and customer resolution flow.

24. END-TO-END TESTING

After implementation, test the real frontend against the existing backend.

Demo A — Happy Path
Create ticket
↓
Route technician
↓
Dispatch offer
↓
Technician accepts
↓
Technician arrives
↓
Technician starts work
↓
Technician completes work
↓
Customer confirms YES
↓
Ticket closes

Verify every state transition using real backend responses.

Demo B — Reopen Flow
Create ticket
↓
Route technician
↓
Offer accepted
↓
Work completed
↓
Customer selects NO
↓
Issue reported unresolved
↓
Ticket reopens
↓
Alternative routing occurs if supported by backend

Verify:

previous service attempt remains visible
history is preserved
lifecycle is updated
current state is accurate
no fake routing is displayed
Demo C — No Alternative Candidate

Where supported by the backend:

Customer reports unresolved
↓
Ticket reopens
↓
No eligible alternative technician exists

Verify the UI accurately communicates the real backend result.

25. FULL REGRESSION TESTING

Ensure Phases 1–4 still work.

Verify:

Phase 1
design system
app shell
categories
customers
technicians
technician capacity management
Phase 2
create service request
ASAP tickets
scheduled tickets
ticket listing
supported filters
ticket update
ticket cancel
operations dashboard
Phase 3
routing preview
eligibility vs ranking
5-factor score breakdown
assignment dispatch
assignment history
routing monitor
expired offer processing
fallback/no-candidate states
Phase 4
My Jobs
current/new offer
countdown
accept
ask me later
decline
mark arrived
start work
complete work
strict lifecycle transitions

Do not break previous working functionality.

26. GIT COMMITS

Make clean, logical commits as the work progresses.

Suggested commit structure:

feat(ticket-details): implement lifecycle hub and ticket data integration

feat(history): add assignment attempts and feedback history

feat(customer-resolution): implement resolution confirmation and reopen flows

feat(states): add phase 5 loading empty error and success states

test(frontend): complete phase 5 end-to-end and regression verification

docs(frontend): document phase 5 completion

Do not make one giant commit.

Do not commit broken intermediate code.

27. FINAL COMPLETION CHECKLIST

Before declaring Phase 5 complete, verify:

Backend Integration
every API inspected?
exact request/response contracts followed?
no backend changes made?
no fake fields?
no fake endpoints?
no lifecycle mismatch?
Ticket Details
ticket loads correctly?
current status clear?
lifecycle visible?
ticket status separate from assignment status?
history preserved?
long content handled?
Customer Resolution
YES works?
NO works?
rating works if supported?
feedback works if supported?
duplicate submission prevented?
resulting backend state accurately displayed?
States
loading handled?
empty handled?
error handled?
success handled?
missing optional data handled?
reopened handled?
closed handled?
no alternative technician handled?
Design
actual Stitch MCP screens used?
layout follows Stitch?
typography preserved?
no generic redesign?
status mapping consistent?
responsive behavior checked?
Regression
Phases 1–4 still working?
28. FINAL RESPONSE FORMAT

When Phase 5 is fully complete, report:

Phase 5 implementation summary
Stitch screens inspected and used
Exact backend APIs integrated
Files created
Files modified
Ticket Details implementation
Lifecycle implementation
Assignment/service attempt history implementation
Customer YES flow result
Customer NO/reopen flow result
Rating and feedback implementation
Feedback history implementation
Loading states
Empty states
Error states
Responsive work
End-to-end tests performed
Regression results for Phases 1–4
Git commits created
Any backend limitation or unsupported Stitch feature discovered

Start by inspecting the existing frontend, backend contracts, and actual Stitch designs.

Do not change the backend.

Do not invent APIs or behavior.

Use Stitch MCP for the visual implementation.

