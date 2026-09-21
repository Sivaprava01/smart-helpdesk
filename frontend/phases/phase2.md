We are continuing the Smart-HelpDesk frontend implementation.

Phase 1 — Foundation & Core Entity Integration is complete and working.

Now complete the entire Phase 2 — Ticket Creation, Management & Operations Overview implementation from start to finish.

IMPORTANT: Before making ANY code changes, carefully inspect the existing project and verify the current state. Do not assume Phase 1 was implemented in a particular way.

==================================================
1. FIRST INSPECT THE PROJECT
==================================================

Before coding:

1. Inspect the complete frontend structure and the work completed in Phase 1.
2. Inspect the backend implementation relevant to tickets and dashboard data.
3. Read all relevant API routes, request schemas, response schemas, enums, models, and service logic.
4. Read:
   - frontend/phases/frontend_guidelines.md
   - frontend/phases/ui.md
5. Inspect the existing design system, typography tokens, shared components, API client, layouts, navigation, loading states, error states, and empty states created in Phase 1.
6. Use the Stitch MCP to retrieve and inspect the exact Stitch screens relevant to this phase.
7. Before implementing each screen, compare the Stitch design with:
   - the actual backend capabilities
   - frontend_guidelines.md
   - the existing frontend architecture

Do not start coding until you understand both the existing frontend and the actual backend contracts.

==================================================
2. ABSOLUTE SOURCE-OF-TRUTH RULE
==================================================

This rule is critical:

STITCH = visual and layout source of truth.

BACKEND = behavior, API, lifecycle, validation, and data source of truth.

frontend_guidelines.md = UX and product behavior rules.

Do NOT change the backend.

Do NOT modify backend routes.

Do NOT rename backend endpoints.

Do NOT change backend schemas.

Do NOT change backend models.

Do NOT change backend enums.

Do NOT change backend business logic.

Do NOT modify backend code merely to make frontend implementation easier.

The frontend must adapt to the backend exactly as it exists.

Before connecting any frontend feature, explicitly verify:

- endpoint
- HTTP method
- path parameters
- query parameters
- request body
- response structure
- validation behavior
- error responses
- supported lifecycle transitions

Do not invent an endpoint if one does not exist.

Do not invent request or response fields.

Do not implement a UI action unless the backend actually supports that action.

If a Stitch design contains something unsupported by the backend, preserve the design intent where possible but do not fake functionality.

The goal is to connect frontend and backend cleanly without creating future implementation issues.

==================================================
3. USE STITCH MCP HEAVILY
==================================================

You MUST use the configured Stitch MCP throughout this phase.

Do not recreate the designs from memory.

Do not approximate the screens unnecessarily.

Retrieve and inspect the exact Stitch screens for this phase and implement their visual hierarchy, layout, spacing, responsive behavior, and components as closely as practical.

Relevant Phase 2 Stitch screens include:

- Operations Dashboard / Operations Overview
- Ticket Management Hub
- Create Service Request
- relevant loading/skeleton states
- relevant empty states

Use the actual Stitch project already configured in this workspace.

If multiple versions of a screen exist, inspect them and use the refined/final version that best matches the current design system.

Do not randomly redesign screens.

Do not introduce a new visual direction.

Preserve the typography system established in Phase 1:

--font-display: "DM Serif Display", Georgia, serif;
--font-body: "Manrope", Arial, sans-serif;
--font-mono: "IBM Plex Mono", "Courier New", monospace;

Use these consistently according to their intended roles.

==================================================
4. PHASE 2 SCOPE
==================================================

Implement the following:

A. Create Service Request

B. Ticket Management Hub

C. Search and supported filtering

D. ASAP and scheduled ticket creation

E. Supported ticket update and cancellation actions

F. Operations Overview / Dashboard

G. Loading, empty, error, success, disabled, and responsive states for all Phase 2 functionality

Do not start Phase 3 routing or assignment functionality except where existing backend data must be displayed as read-only ticket information.

==================================================
5. CREATE SERVICE REQUEST
==================================================

Implement the Create Service Request screen using the exact relevant Stitch design as the visual reference.

First inspect the actual backend ticket creation schema.

Only include fields genuinely supported by the backend.

Do not invent:

- photo upload
- attachments
- emergency flags
- priority
- custom fields
- unsupported scheduling behavior
- unsupported customer fields

The UI should support the actual ticket creation flow, including ASAP versus scheduled service only if supported by the backend.

For scheduled requests:

- use the actual backend date/time format
- validate according to backend rules
- prevent obviously invalid past scheduling where appropriate
- show clear inline validation
- do not send malformed datetime values

For customer and category selection:

- use real backend data
- do not hardcode fake production entities
- integrate with the Phase 1 entity APIs and architecture

Submission behavior:

Create Ticket
→ submitting state
→ prevent duplicate submission
→ call real backend API
→ show meaningful success feedback
→ refresh or navigate appropriately based on the implemented flow

On failure:

- preserve entered information where possible
- show understandable feedback
- do not expose raw backend error objects

==================================================
6. TICKET MANAGEMENT HUB
==================================================

Implement the Ticket Management Hub based closely on the Stitch design.

This is an operational scanning interface.

Use real ticket data from the backend.

Prioritize the information that helps an operational user understand a ticket quickly.

Only display fields actually returned or available from the backend.

Potential information includes, where supported:

- ticket ID
- customer
- category
- location
- schedule information
- current ticket status
- assigned technician information if available
- relevant timestamps
- available actions

Do not turn the table into a database dump.

Do not invent columns simply because the Stitch design contains placeholder information.

Use the Phase 1 status mapping system consistently.

Remember:

Ticket status and assignment status are different concepts.

Do not display assignment states as ticket states.

==================================================
7. SEARCH, FILTERING, SORTING, AND PAGINATION
==================================================

Inspect exactly what filtering and pagination capabilities the backend provides.

Implement only supported query parameters and behaviors.

Possible supported filters may include:

- status
- category_id
- customer_id
- is_scheduled
- pagination

Verify the actual backend before implementation.

Do not fake client-side filtering when the feature is supposed to represent backend filtering unless that is genuinely the only correct approach for the existing API.

Search should only be implemented if it is genuinely supported or can be correctly performed using already-loaded real data without misleading the user.

Do not invent a search endpoint.

If a Stitch filter has no backend equivalent:

- do not silently pretend it works
- do not modify the backend to add it
- adapt the UI responsibly

Pagination must reflect the actual backend response and API contract.

==================================================
8. TICKET UPDATE AND CANCEL
==================================================

Inspect the exact backend rules for ticket updates and cancellation.

Implement update functionality only for fields and lifecycle states supported by the backend.

For example, if updates are only allowed while a ticket is PENDING, enforce that in the UI while remembering that the backend remains the real authority.

Implement cancellation only if supported.

For consequential actions, use an appropriate confirmation dialog.

Example:

Cancel this ticket?

This request will be cancelled and may no longer continue through the service workflow.

The final wording must accurately reflect the backend behavior.

Do not invent consequences.

==================================================
9. OPERATIONS OVERVIEW / DASHBOARD
==================================================

Implement the Operations Dashboard using the exact Stitch design as closely as practical.

The dashboard must answer:

"What needs attention right now?"

Use real backend data only.

Do not create:

- fake analytics
- fake percentages
- random charts
- fake AI insights
- fake productivity scores
- decorative revenue metrics
- hardcoded operational statistics pretending to be live

Dashboard information should be derived from actual backend data.

Possible useful operational information includes, where real data is available:

- active tickets
- pending tickets
- scheduled tickets
- ticket status counts
- tickets requiring attention
- technician availability
- current operational queue

Do not claim "real-time" behavior unless the frontend actually refreshes or receives live updates.

If the backend does not provide a dedicated dashboard endpoint, inspect the available APIs and derive only accurate, clearly justifiable summaries from real responses.

Do not modify the backend to create a dashboard API.

==================================================
10. DATA STATES ARE REQUIRED
==================================================

For every major Phase 2 data area, explicitly implement appropriate states.

LOADING

Use skeleton loading states where appropriate.

Use the Stitch skeleton designs as reference where available.

Do not replace every loading state with a generic spinner.

EMPTY

Implement meaningful empty states.

Examples should match actual functionality, such as:

No tickets yet

No tickets match the current filters

No scheduled service requests

No categories available

The empty state should explain:

- what is empty
- why it may be empty
- what the user can do next, if an action is possible

ERROR

Handle:

- failed ticket loading
- failed ticket creation
- failed category/customer loading
- failed ticket update
- failed cancellation
- network/API failures

Use clear, actionable copy.

Do not expose raw backend errors.

SUCCESS

Show meaningful feedback for:

- ticket created
- ticket updated
- ticket cancelled

Do not simply display "Success".

DISABLED / SUBMITTING

Prevent duplicate API requests.

Buttons must reflect pending operations.

Do not leave active-looking actions available while a request is processing.

==================================================
11. RESPONSIVE BEHAVIOR
==================================================

Follow frontend_guidelines.md.

The Create Service Request screen must work well on mobile.

The Ticket Management Hub should remain usable on smaller screens.

Do not simply squeeze a large desktop table onto a phone.

Adapt appropriately using:

- responsive table behavior where appropriate
- condensed information
- stacked layouts
- horizontal scrolling only when genuinely necessary
- mobile-friendly actions

The Operations Dashboard should remain understandable across screen sizes.

Do not sacrifice operational clarity for visual similarity.

==================================================
12. REUSE THE PHASE 1 ARCHITECTURE
==================================================

Build on the architecture already created in Phase 1.

Do not rewrite working Phase 1 code unnecessarily.

Reuse existing:

- API client
- service structure
- AppLayout
- navigation
- shared buttons
- forms
- status badges
- dialogs
- empty states
- error states
- skeletons
- toasts
- typography tokens
- design tokens

Create new reusable components only where genuine repetition exists.

Likely Phase 2 components may include:

- TicketTable
- TicketFilterBar
- TicketForm
- ScheduleSelector
- TicketStatusDisplay
- TicketActions
- DashboardMetric / operational summary component
- ServiceRequestEmptyState

Do not over-abstract.

==================================================
13. NO FAKE AUTH OR ROLE SWITCHING
==================================================

Continue the Phase 1 rule.

Do not implement:

- fake authentication
- fake login logic
- JWT behavior
- fake role switching
- localStorage pretending to be production authentication

unless the backend actually supports those workflows.

If the visual shell contains user/persona elements from Stitch, keep them presentation-only only if necessary and clearly avoid fabricating authentication behavior.

==================================================
14. DO NOT START FUTURE PHASES
==================================================

Phase 2 is limited to:

- ticket creation
- ticket management
- supported ticket updates/cancellation
- filtering/search/pagination supported by backend
- operations overview/dashboard
- related loading/error/empty/success states

Do not implement Phase 3 functionality yet:

- routing preview
- candidate scoring UI
- assignment dispatch
- fallback routing monitor
- expired offer processing

Do not implement Phase 4 technician workflow yet.

Do not implement Phase 5 customer resolution workflow yet.

Keep the architecture ready for later phases, but do not prematurely build unsupported or unfinished flows.

==================================================
15. TESTING AND VERIFICATION
==================================================

After implementation:

1. Test ticket creation against the live backend.
2. Test ASAP ticket creation.
3. Test scheduled ticket creation if supported.
4. Test invalid form validation.
5. Test ticket list loading.
6. Test every implemented filter.
7. Test pagination.
8. Test ticket update according to backend lifecycle restrictions.
9. Test ticket cancellation according to backend lifecycle restrictions.
10. Test dashboard calculations using real backend data.
11. Test loading states.
12. Test empty states.
13. Test API error states.
14. Test duplicate submission prevention.
15. Test responsive behavior.
16. Verify no backend code was changed.
17. Verify all API calls match existing backend contracts exactly.
18. Verify existing Phase 1 functionality still works.

Fix all issues discovered before considering Phase 2 complete.

==================================================
16. DOCUMENT THE PHASE
==================================================

When implementation and testing are complete:

1. Update the appropriate Phase 2 documentation/changelog if the project structure uses one.
2. Clearly document:
   - screens implemented
   - backend APIs integrated
   - real backend limitations encountered
   - filters/actions actually supported
   - major reusable components added
   - states implemented
   - verification performed
3. Do not claim unsupported functionality is implemented.

==================================================
17. GIT
==================================================

Work only on the appropriate Phase 2 frontend branch.

Make clean, logical commits as implementation progresses.

Do not make one huge unrelated commit.

Do not modify backend code.

Do not commit generated junk, secrets, or unnecessary files.

==================================================
FINAL ACCEPTANCE CRITERIA
==================================================

Phase 2 is complete only when:

- Create Service Request matches the Stitch design direction.
- It uses real backend schemas and data.
- ASAP and scheduled behavior match the actual backend.
- Ticket Management Hub displays real tickets.
- Filtering/pagination/search only use supported backend behavior.
- Ticket update/cancel only exist where supported.
- Operations Dashboard uses real data only.
- No fake metrics or analytics exist.
- Loading states are implemented.
- Empty states are implemented.
- Error states are implemented.
- Success/submitting states are implemented.
- Responsive behavior is checked.
- Phase 1 functionality still works.
- Backend code, routes, schemas, enums, models, and business logic remain unchanged.
- Frontend and backend contracts are verified to match exactly.
- Stitch MCP was actively used as the visual reference during implementation.

Begin by inspecting the project, Phase 1 implementation, relevant Stitch screens through Stitch MCP, and the backend ticket APIs.

Before writing code, provide a concise implementation plan based on what you actually find. Then proceed with the implementation.