We are continuing my Smart-HelpDesk internship project.

Phase 1, Phase 2, and Phase 3 frontend implementation are complete and tested.

Your task is to complete the entire Phase 4: Technician Portal & Field Execution from start to finish.

# PHASE 4 GOAL

Implement the complete technician-facing workflow using the existing Stitch designs as the exact visual reference and the existing backend as the complete behavior and data source of truth.

This phase includes:

- Technician "My Jobs" portal
- New/current assignment offers
- Live offer countdown
- Accept Job
- Ask Me Later
- Decline Job
- Assignment offer state handling
- Active technician jobs
- Mobile-first technician experience
- Mark Arrived
- Start Work
- Complete Work
- Strict sequential workflow transitions
- Relevant loading, empty, error, success, expired, and disabled states

The completed result must integrate cleanly with the existing backend without modifying backend behavior.

==================================================
1. READ AND INSPECT EVERYTHING FIRST
==================================================

Before writing or changing any code, carefully inspect:

1. The complete current frontend implementation from Phase 1, Phase 2, and Phase 3.
2. The existing project structure.
3. Existing reusable components.
4. Existing API client and service structure.
5. Existing status mappings.
6. Existing loading, error, empty, modal, toast, and skeleton components.
7. frontend/phases/frontend_guidelines.md
8. frontend/phases/ui.md
9. All backend implementation relevant to technicians, assignments, and ticket lifecycle actions.
10. Existing API routes.
11. Request schemas.
12. Response schemas.
13. Database models.
14. Enums.
15. Service logic.
16. Tests related to assignment responses and ticket lifecycle execution.

Do not start coding until the actual backend behavior is understood.

==================================================
2. STITCH MCP IS MANDATORY
==================================================

You MUST actively use the configured Stitch MCP throughout this phase.

Search the Smart-HelpDesk Stitch project and retrieve the relevant technician designs before implementing each major screen or workflow.

The most important Stitch designs for this phase include:

- Technician Service Portal / My Jobs
- New Job Offer
- Mobile technician offer screen
- Any relevant active job screen
- Any relevant loading or skeleton states
- Related components required for visual consistency

Use Stitch as the visual and layout reference.

Do not redesign the technician experience from memory.

Do not replace the Stitch hierarchy with a generic admin dashboard.

The technician experience is NOT an administrator dashboard.

It should prioritize:

- What needs my response now?
- What job am I currently responsible for?
- What is my next action?

Before implementing a major screen:

1. Retrieve the relevant Stitch screen through MCP.
2. Inspect the layout.
3. Inspect mobile behavior and proportions.
4. Inspect spacing and hierarchy.
5. Inspect action hierarchy.
6. Inspect typography usage.
7. Inspect offer and job cards.
8. Implement the closest practical version using the existing frontend stack.

If a Stitch design contains behavior unsupported by the backend:

- Preserve the visual intent where possible.
- Adapt the interaction to the actual backend contract.
- Do NOT change the backend.

STITCH = VISUAL SOURCE OF TRUTH

BACKEND = BEHAVIOR AND DATA SOURCE OF TRUTH

==================================================
3. MOST IMPORTANT RULE — DO NOT CHANGE THE BACKEND
==================================================

DO NOT modify the backend.

DO NOT modify backend routes.

DO NOT rename endpoints.

DO NOT change request schemas.

DO NOT change response schemas.

DO NOT change database models.

DO NOT change enums.

DO NOT modify service logic.

DO NOT add backend fields.

DO NOT create new API endpoints.

DO NOT modify assignment behavior to make frontend implementation easier.

DO NOT modify ticket lifecycle behavior.

DO NOT add authentication or authorization behavior that does not already exist.

The frontend must adapt to the backend exactly as it currently exists.

Before connecting every feature, explicitly verify:

- Endpoint
- HTTP method
- Path parameters
- Query parameters
- Request body
- Response structure
- Success behavior
- Error behavior
- Required current state
- Resulting ticket state
- Resulting assignment state

The goal is ZERO backend/frontend contract mismatch.

==================================================
4. IMPORTANT PHASE 4 SCOPE RULE
==================================================

This phase is about the technician experience and field execution.

Do NOT start implementing Phase 5 features such as:

- Complete Ticket Details & Lifecycle Hub
- Full customer confirmation experience
- Customer YES/NO resolution flow
- Rating submission UI
- Customer feedback history
- Complete reopening workflow UI

Those belong to Phase 5.

However, when a technician marks work complete, the UI must accurately reflect the backend transition to the next state.

For example, if the backend moves the ticket to:

AWAITING_CUSTOMER_CONFIRMATION

the technician-facing UI should explain this in human language, such as:

"Work completion submitted. The resident will now be asked to confirm whether the issue is resolved."

Do NOT say:

"Ticket closed."

unless the backend has actually closed it.

==================================================
5. VERIFY THE ACTUAL TECHNICIAN DATA ACCESS FIRST
==================================================

Before designing the My Jobs data flow, inspect how the existing backend exposes technician-specific assignments and tickets.

Determine exactly:

- How the frontend identifies the relevant technician.
- Whether technician ID is supplied through a route, query parameter, existing frontend context, or another supported mechanism.
- Which API returns pending offers.
- Which API returns accepted/current jobs.
- Which API returns assignment history, if needed.
- Whether existing general ticket APIs must be filtered using supported parameters.

DO NOT invent a new endpoint such as:

/api/v1/technicians/{id}/jobs

unless it already exists in the backend.

DO NOT invent fake role switching.

DO NOT create fake authentication.

If the backend currently has no authentication, use the existing supported data selection mechanism already present in the project.

The frontend must not pretend production authentication exists.

==================================================
6. TECHNICIAN "MY JOBS" PORTAL
==================================================

Implement the technician portal using the relevant Stitch design as the visual reference.

The information hierarchy must be:

1. Urgent assignment offer requiring action now.
2. Current active accepted job.
3. Other relevant technician jobs/history only if supported and useful.

Do NOT put:

- Random KPI cards
- Fake productivity metrics
- Fake earnings
- Random charts
- Decorative analytics

above an urgent assignment offer.

The technician should immediately understand:

"What do I need to do now?"

The screen should clearly separate:

PENDING OFFER

from

CURRENT ACTIVE JOB

from

PAST/HISTORICAL INFORMATION

Do not confuse assignment status with ticket status.

==================================================
7. NEW JOB OFFER EXPERIENCE
==================================================

Implement the technician offer experience based on the Stitch New Job Offer design.

The offer should display only information supported by the backend, such as where available:

- Service category
- Ticket ID
- Location
- Issue description
- Schedule information
- Assignment/offer status
- Offer expiration or remaining response time

The action hierarchy must be clear:

PRIMARY
Accept Job

SECONDARY
Ask Me Later

DESTRUCTIVE / LOWER EMPHASIS
Decline Job

Do not make all three actions visually equal.

The technician should understand that a decision is required.

==================================================
8. LIVE OFFER COUNTDOWN
==================================================

If the backend provides an actual offer expiration timestamp or sufficient information to determine expiration, implement a live countdown.

Before implementing, verify:

- Which backend field represents expiration.
- Whether the timestamp is absolute or relative.
- Timezone format.
- What happens when the offer expires.
- Whether the frontend should automatically refresh.
- Whether the backend requires the timeout processing endpoint to be called separately.

Do not hardcode a fake 10-minute timer merely because the Stitch design visually shows one.

Use the real backend expiration information.

The countdown should:

- Update visibly while the offer is active.
- Clearly communicate urgency.
- Not become a decorative animation.
- Handle zero/expired state correctly.
- Stop accepting actions once expired.
- Refresh or re-fetch data where appropriate.

When expired, show a clear state such as:

"This offer has expired."

"The request is no longer available for acceptance."

Do not leave an active-looking Accept Job button available for an expired offer.

==================================================
9. ACCEPT JOB
==================================================

Implement job acceptance using the exact existing backend endpoint and request contract.

Likely functionality to inspect:

POST /api/v1/assignments/{id}/accept

Do not assume the exact behavior.

Verify the real backend implementation first.

Determine:

- Required assignment state.
- Required request body, if any.
- Resulting assignment state.
- Resulting ticket state.
- Workload changes handled by backend.
- Returned data.
- Possible errors.

The frontend must:

- Disable duplicate clicks while accepting.
- Show "Accepting..." or equivalent progress feedback.
- Handle backend errors clearly.
- Refresh affected assignment and ticket data after success.
- Move the accepted job into the correct active job state.

Do not manually manipulate workload values unless the backend response and actual data state support it.

The backend owns the business logic.

==================================================
10. ASK ME LATER
==================================================

Implement Ask Me Later using the exact backend contract.

Likely functionality to inspect:

POST /api/v1/assignments/{id}/ask-later

Verify exactly:

- What the request requires.
- What assignment state results.
- Whether the expiration changes.
- Whether the offer remains available.
- Whether routing behavior changes.
- What response is returned.

Do not invent frontend behavior.

For example, do not automatically hide an offer forever if the backend still considers it active.

After success, refresh the actual data and display the resulting backend state honestly.

Show meaningful feedback based on the actual backend behavior.

==================================================
11. DECLINE JOB
==================================================

Implement job decline using the exact backend contract.

Likely functionality to inspect:

POST /api/v1/assignments/{id}/decline

Before implementation, inspect whether the backend supports:

- Decline reason
- Decline note
- Specific enum values
- Optional fields
- Immediate fallback routing
- Alternative technician selection

Do not invent decline reasons.

If the backend supports predefined reasons, use the exact backend enum values and map them to understandable UI labels.

If the Stitch design contains reason options not supported by the backend, do not modify the backend.

Adapt the UI.

The decline confirmation should clearly explain the consequence only as guaranteed by the backend.

For example:

"Decline this job?"

"The system will process this assignment according to the current routing workflow."

Do not promise an immediate replacement technician unless that is actual backend behavior.

==================================================
12. ACTIVE JOB / FIELD EXECUTION
==================================================

Once a technician has accepted a job, implement the sequential field workflow.

The conceptual flow is:

Accepted
    ↓
Mark Arrived
    ↓
Start Work
    ↓
Mark Work Complete

The actual implementation must follow the exact backend state machine.

Verify every transition before implementation.

Likely endpoints to inspect:

POST /api/v1/tickets/{id}/arrive

POST /api/v1/tickets/{id}/start-work

POST /api/v1/tickets/{id}/complete-work

Do not assume the request body or behavior.

==================================================
13. MARK ARRIVED
==================================================

Implement Mark Arrived only when the backend allows it.

Verify:

- Required ticket state.
- Required assignment state, if relevant.
- Request body.
- Resulting ticket state.
- Returned response.
- Possible errors.

The UI should clearly indicate:

Current step:
Mark Arrived

Next:
Start Work

Do not make Start Work look normally available before arrival if the backend prevents that transition.

==================================================
14. START WORK
==================================================

Implement Start Work only when the backend allows it.

Verify:

- Required ticket state.
- Request contract.
- Resulting ticket state.
- Returned data.
- Error behavior.

After success:

- Update the active job state.
- Update the workflow stepper.
- Show meaningful success feedback.
- Make the next valid action available.

Do not allow impossible transitions.

==================================================
15. COMPLETE WORK
==================================================

Implement Mark Work Complete using the exact backend contract.

Before implementation, inspect whether the backend supports:

- Completion note
- Required completion data
- Optional note
- Any other fields

If the backend supports a completion note, provide it.

If not, do not invent a completion-note API field.

Because completing work is consequential, use an appropriate confirmation interaction only if it improves clarity.

After successful completion:

- Refresh ticket data.
- Refresh assignment data where relevant.
- Update the workflow.
- Clearly explain that customer verification is next.

Correct style:

"Work completion submitted. The resident will now be asked to confirm whether the issue is resolved."

Incorrect:

"Ticket successfully closed."

unless the backend actually closes the ticket.

==================================================
16. STRICT STATE TRANSITIONS
==================================================

The UI must respect the backend lifecycle.

Do not allow invalid actions to appear normally available.

For example, conceptually:

Job accepted
✓ Completed

Mark arrived
→ Available now

Start work
○ Available after arrival

Mark complete
○ Available after work starts

Use the actual backend states, not assumptions.

The frontend may:

- Disable invalid actions.
- Explain why an action is unavailable.
- Update available actions after successful transitions.

But the frontend must not try to enforce business logic independently in a way that conflicts with the backend.

The backend remains authoritative.

==================================================
17. MOBILE-FIRST REQUIREMENT
==================================================

The technician portal is one of the most important mobile experiences in the application.

Design for mobile first while preserving desktop usability.

Prioritize:

- Large touch targets.
- Clear action hierarchy.
- Readable issue information.
- Location visibility.
- Offer countdown.
- Sequential next action.
- Minimal unnecessary navigation.

Avoid:

- Dense desktop tables as the primary technician UI.
- Tiny buttons.
- Excessive sidebars on mobile.
- Buried urgent actions.
- Hover-only interactions.
- Long complex workflows.

The Stitch mobile design should be actively inspected and followed.

==================================================
18. REQUIRED DATA STATES
==================================================

Implement relevant states for the technician experience.

LOADING

Use skeletons where appropriate.

Examples:

- Loading offers
- Loading current job
- Loading job details

EMPTY

Examples:

"No offers waiting for you"

"You have no active jobs right now"

Use the relevant Stitch empty-state visual direction where available.

ERROR

Examples:

"Unable to load your jobs"

"We couldn't update this assignment"

"This offer is no longer available"

"Unable to record your arrival"

"Unable to start work"

"Unable to submit work completion"

SUCCESS

Examples:

"Job accepted"

"Offer deferred"

"Job declined"

"Arrival recorded"

"Work started"

"Work completion submitted"

EXPIRED

Clearly distinguish expired offers from ordinary empty states.

DISABLED

Actions unavailable due to the current lifecycle state should not look accidentally broken.

Where useful, explain what must happen first.

==================================================
19. HANDLE ALREADY-PROCESSED ASSIGNMENTS
==================================================

The frontend must gracefully handle situations where:

- Another action already processed the offer.
- The offer expired.
- The assignment was already accepted.
- The assignment was already declined.
- The backend rejects an action due to a state change.

Do not leave stale UI pretending an action is still available.

After a backend conflict or invalid-state response:

1. Show a clear message.
2. Refresh the relevant assignment/ticket data.
3. Render the current real state.

==================================================
20. API LAYER RULE
==================================================

Use the existing frontend API architecture.

Keep technician and assignment actions in the appropriate API/service modules.

Do not scatter raw HTTP calls through page components.

Reuse existing:

- API client
- Error handling
- Response handling
- Toasts
- Status mapping
- Loading patterns

Only add reusable abstractions where genuinely useful.

Do not introduce unnecessary state-management libraries.

Do not install dependencies unless the existing stack genuinely cannot support the requirement cleanly.

==================================================
21. TYPOGRAPHY AND DESIGN SYSTEM
==================================================

Continue using the exact established typography system:

--font-display: "DM Serif Display", Georgia, serif;

--font-body: "Manrope", Arial, sans-serif;

--font-mono: "IBM Plex Mono", "Courier New", monospace;

Use:

DM Serif Display:
- Major page titles
- Important headings
- Major confirmation moments where appropriate

Manrope:
- Job details
- Descriptions
- Forms
- Buttons
- Normal UI content

IBM Plex Mono:
- Ticket IDs
- Assignment IDs where displayed
- Structured timestamps where appropriate
- Countdown timers
- Compact technical/operational metadata

Do not introduce new fonts.

Do not replace the existing Phase 1 design tokens.

==================================================
22. DESIGN RULES
==================================================

Follow frontend/phases/frontend_guidelines.md exactly.

The technician experience should feel:

- Fast
- Clear
- Practical
- Calm
- Mobile-friendly
- Operational
- Human

Do not add:

- Fake analytics
- Productivity scores
- Earnings metrics
- Random KPI cards
- Fake charts
- Purple gradients
- Glassmorphism
- Heavy shadows
- Excessive badges
- Decorative animations
- Icons beside every label

Do not turn the technician portal into a generic SaaS dashboard.

==================================================
23. DO NOT FAKE AUTHENTICATION OR ROLE SWITCHING
==================================================

No fake authentication.

No fake login logic.

No fake JWT.

No fake sessions.

No fake role switcher.

No production-looking role-based security that is not supported by the backend.

If the existing frontend contains visual authentication screens from Stitch, do not make unsupported authentication workflows functional in this phase.

Use the actual existing backend-supported mechanism for selecting or accessing technician data.

==================================================
24. DO NOT BREAK PREVIOUS PHASES
==================================================

Phase 1, Phase 2, and Phase 3 are already complete.

Do not unnecessarily rewrite:

- App layout
- Design system
- Typography
- API client
- Category management
- Technician management
- Customer management
- Ticket creation
- Ticket Management Hub
- Operations Dashboard
- Routing Preview
- Routing & Fallback Monitor
- Assignment history
- Expired offer processing

Reuse existing infrastructure.

Only modify shared components when necessary and ensure regressions are tested.

==================================================
25. TESTING REQUIREMENTS
==================================================

After implementation, test every supported Phase 4 workflow against the real backend.

At minimum verify:

1. Technician jobs/offers load from the real backend-supported data flow.
2. Urgent pending offers are clearly prioritized.
3. Active accepted jobs display correctly.
4. Countdown uses real backend expiration data.
5. Countdown reaches expired state correctly.
6. Accept sends the exact backend request.
7. Ask Me Later sends the exact backend request.
8. Decline sends the exact backend request.
9. Decline reason data exactly matches backend support.
10. Duplicate assignment actions are prevented while submitting.
11. Stale/already-processed offers recover by refreshing data.
12. Mark Arrived works only from the correct state.
13. Start Work works only after the required prior state.
14. Complete Work works only after the required prior state.
15. Work completion does not falsely show the ticket as closed.
16. Loading states work.
17. Empty states work.
18. Error states work.
19. Mobile layouts work.
20. Existing Phase 1, Phase 2, and Phase 3 functionality still works.

==================================================
26. GIT AND IMPLEMENTATION DISCIPLINE
==================================================

Work in logical milestones.

Recommended order:

1. Inspect current implementation and backend contracts.
2. Retrieve relevant Stitch technician screens.
3. Implement technician data/service layer.
4. Implement My Jobs screen and loading/empty/error states.
5. Implement active offer UI and countdown.
6. Implement Accept / Ask Me Later / Decline.
7. Implement active job workflow.
8. Implement Arrived → Start Work → Complete Work transitions.
9. Test mobile behavior.
10. Test against the real backend.
11. Run regression testing.
12. Commit logical milestones.

Do not make one uncontrolled massive rewrite.

Do not modify backend files.

Do not commit unrelated files.

==================================================
27. FINAL PHASE 4 COMPLETION CHECK
==================================================

Before declaring Phase 4 complete, verify:

STITCH
- Relevant technician screens were actively retrieved through Stitch MCP.
- The My Jobs and New Job Offer experience closely follows Stitch.
- Mobile layouts follow the Stitch design direction.

BACKEND
- No backend files were modified.
- No backend routes were changed.
- No schemas were changed.
- No endpoints were invented.
- Every API call matches the actual backend.

TECHNICIAN UX
- Pending offers are obvious.
- Current active job is obvious.
- The next action is always clear.
- Action hierarchy is correct.
- Invalid actions are not presented as normally available.
- Expired offers are handled correctly.

LIFECYCLE
- Accept behavior is correct.
- Ask Me Later behavior is correct.
- Decline behavior is correct.
- Arrive behavior is correct.
- Start Work behavior is correct.
- Complete Work behavior is correct.
- Ticket and assignment states are not confused.
- Completion does not falsely imply closure.

STATES
- Loading handled.
- Empty handled.
- Error handled.
- Success feedback handled.
- Expired handled.
- Disabled/submitting handled.
- Already-processed assignment handled.

RESPONSIVE
- Mobile is fully usable.
- Touch targets are adequate.
- Desktop remains usable.
- No broken layouts.

REGRESSION
- Phase 1 still works.
- Phase 2 still works.
- Phase 3 still works.
- No completed functionality was broken.

==================================================
FINAL RESPONSIBILITY
==================================================

Your responsibility in this phase is to build the real technician workflow on top of the existing backend contracts while reproducing the relevant Stitch designs as closely as practical.

Do not redesign the backend.

Do not modify routes.

Do not invent APIs.

Do not fake authentication.

Do not fake technician data.

Do not invent lifecycle transitions.

Always follow this priority:

1. Existing backend behavior and API contracts
2. Valid assignment and ticket lifecycle transitions
3. Stitch visual reference
4. frontend_guidelines.md UX rules
5. Mobile usability
6. Responsive behavior
7. Visual polish

Inspect first.

Verify every backend contract.

Retrieve the relevant Stitch screens through MCP.

Then implement.

Start by inspecting the current frontend, the backend assignment response implementation, the technician data access mechanism, the ticket lifecycle action implementation, and the relevant Stitch screens.

Before coding, briefly report:

1. The exact backend APIs and data contracts available for Phase 4.
2. How technician-specific offers and jobs can be retrieved without inventing an endpoint.
3. The exact valid state transitions for Accept, Ask Me Later, Decline, Arrive, Start Work, and Complete Work.
4. Any mismatch between Stitch and backend behavior.
5. How the frontend will adapt WITHOUT changing the backend.

Then proceed with the complete Phase 4 implementation.
