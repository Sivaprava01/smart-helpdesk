Smart-HelpDesk Frontend — Phase 1: Foundation & Core Entity Integration

We are continuing the Smart-HelpDesk internship project.

The backend implementation through Phases 1–6 is already complete and tested.

Your task is to complete the entire frontend Phase 1 — Foundation & Core Entity Integration from start to finish.

1. FIRST: INSPECT BEFORE CHANGING ANYTHING

Before writing or modifying code, carefully inspect all of the following:

The existing frontend project structure.
The complete backend project structure.
All implemented backend API routes.
Pydantic request and response schemas.
SQLAlchemy/database models where necessary to understand entities.
Existing backend enums and validation rules.
Existing frontend files and configuration.
frontend/phases/frontend_guidelines.md
frontend/phases/ui.md
The Stitch design project through the configured Stitch MCP.

Do not start implementation until you understand the existing project.

2. STITCH MCP IS MANDATORY

You MUST actively use the configured Stitch MCP throughout this phase.

Do not recreate screens from memory.

Do not make a generic interpretation of the UI.

Do not use the written screen descriptions as a replacement for inspecting the actual Stitch designs.

For every screen, component, layout, visual pattern, spacing system, responsive behavior, loading state, or empty state implemented in this phase:

Search the Smart-HelpDesk Stitch project using the Stitch MCP.
Retrieve and inspect the relevant screen/design.
Use the actual Stitch design as the visual reference.
Implement the frontend to match that design closely.
Reuse visual patterns and components consistently where the Stitch project shows repetition.

The Stitch project ID is:

13090118905352894935

Stitch is the visual source of truth.

Do not casually redesign existing Stitch screens.

Do not replace the design with a generic Bootstrap dashboard.

Bootstrap is the implementation framework, not the visual design.

Do not let default Bootstrap styling override the Smart-HelpDesk visual identity.

3. CRITICAL ARCHITECTURAL RULE — DO NOT MODIFY THE BACKEND
THE BACKEND IS ALREADY IMPLEMENTED.

Do not modify the backend.

This includes:

no new backend endpoints
no route changes
no endpoint renaming
no HTTP method changes
no request schema changes
no response schema changes
no database model changes
no enum changes
no service logic changes
no routing logic changes
no assignment lifecycle changes
no ticket lifecycle changes
no validation changes
no backend refactoring
no backend "cleanup"
no migrations
no database schema modifications

The frontend must adapt to the existing backend.

Never change backend code simply because the frontend would be easier to implement differently.

If you encounter a mismatch between:

Stitch design
        ↓
Frontend requirement
        ↓
Existing backend capability

you must follow this order:

1. Preserve the existing backend
2. Inspect the actual API contract again
3. Adapt the frontend to the backend
4. If the backend does not support a visual feature, do not fake backend functionality
5. Report the limitation clearly

Do not "fix" an implementation issue by modifying the backend.

4. FRONTEND–BACKEND CONTRACT DISCIPLINE

Before integrating every API, verify:

exact endpoint
exact HTTP method
path parameters
query parameters
request body
required fields
optional fields
response structure
response field names
enum values
validation constraints
possible error responses

The frontend must use the backend exactly as implemented.

Do not invent frontend assumptions such as:

/api/technicians/all
/api/dashboard/stats
/api/login
/api/current-user

unless those endpoints actually exist.

Do not invent response fields.

Do not rename backend concepts internally without a clear mapping layer.

The goal is:

Existing Backend
       ⇅
Exact API Contract
       ⇅
Frontend Service Layer
       ⇅
React Components

There should be a clean, predictable connection between frontend and backend so later phases do not create integration problems.

5. PHASE 1 SCOPE

Implement only the following scope.

A. React + Bootstrap Foundation

Establish a clean frontend foundation using:

HTML5
CSS3
JavaScript ES6+
React
Bootstrap 5

Respect the existing frontend setup.

Do not unnecessarily recreate or replace project configuration.

Do not add unnecessary dependencies.

Bootstrap should provide responsive layout and foundational utilities, but the final UI must follow the Stitch design rather than looking like default Bootstrap.

6. GLOBAL DESIGN SYSTEM

Create a centralized design system based on the Stitch designs and the frontend guidelines.

The system should include reusable tokens for:

typography
colors
spacing
borders
radii
shadows
surfaces
focus states
status treatments
responsive breakpoints

Do not scatter arbitrary CSS values throughout random components.

Use centralized CSS variables/tokens where appropriate.

7. EXACT TYPOGRAPHY SYSTEM

Use these exact font tokens:

--font-display: "DM Serif Display", Georgia, serif;
--font-body: "Manrope", Arial, sans-serif;
--font-mono: "IBM Plex Mono", "Courier New", monospace;

Load the required fonts appropriately.

Use them consistently:

DM Serif Display

Use for:

major page titles
important screen headings
critical confirmation moments
major empty-state headings where appropriate

Do not use it excessively.

It should create an editorial/premium accent rather than making the operational UI feel decorative.

Manrope

Use as the primary workhorse font for:

body content
navigation
forms
tables
ticket descriptions
buttons
normal headings
operational content
IBM Plex Mono

Use selectively for precise operational information such as:

ticket identifiers
technical IDs
timestamps where appropriate
countdown timers
routing/score values where appropriate
structured metadata

Do not randomly mix fonts.

Do not hardcode font families differently on individual pages.

The typography system must be global and reusable.

8. API CLIENT AND SERVICE LAYER

Create a clean frontend API architecture appropriate to the existing project.

Do not scatter raw fetch() or API calls throughout page components.

Use a structure conceptually similar to:

src/
  api/
    client.js
    categories.js
    technicians.js
    customers.js

The exact structure may differ if the existing frontend already has an established architecture.

The API client should centralize:

backend base URL
request configuration
JSON handling
successful response handling
error handling
network failures

Do not overengineer.

Do not introduce a global state library unless the existing project genuinely requires it.

9. SHARED COMPONENT FOUNDATION

Build reusable components only where they genuinely improve consistency.

At minimum, establish the foundation for components such as:

Button
StatusBadge
EmptyState
ErrorState
SkeletonLoader
ModalDialog
Toast / ToastContainer
PageHeader

Only implement components needed for Phase 1 and create them in a way that later phases can reuse.

Do not over-abstract everything.

Do not create components merely because they sound architecturally sophisticated.

10. STATUS SYSTEM

Create centralized frontend mappings for statuses that exist in the backend.

Remember:

Ticket status and assignment status are different concepts.

Do not merge them.

Create separate mappings where necessary.

The mapping should support things like:

backend value
↓
human-readable label
↓
semantic visual treatment
↓
optional icon
↓
contextual description

Do not invent statuses.

Do not expose raw backend enum names unnecessarily.

The actual backend enum values remain the source of truth.

11. LOADING, EMPTY, ERROR, AND SUCCESS FOUNDATION

Phase 1 must establish reusable patterns for:

Loading

Use Stitch-inspired skeleton loading states where content structure is known.

Do not use one spinner for everything.

Empty

An empty state must explain:

what is empty
why it might be empty
what the user can do next, if an action is actually available
Error

Show understandable errors.

Never expose raw backend exception text directly to the user.

Success

Explain what actually happened.

Avoid generic:

Success!

Prefer:

Technician updated
The technician information was saved successfully.

where that matches the real backend operation.

All these patterns should be reusable in later phases.

12. APPLICATION LAYOUT AND NAVIGATION

Implement the application shell and navigation patterns required for the operational screens in this project.

Use the actual Stitch designs through MCP as the reference.

The application shell may include elements such as:

navigation/sidebar where shown in Stitch
top header where shown in Stitch
main content area
responsive navigation behavior
breadcrumbs where appropriate
toast/feedback layer

Do not automatically add features just because generic admin templates have them.

Specifically, do not add:

fake analytics
fake notifications
fake user menus
fake authentication state
fake role permissions
fake production persona switching

Navigation must correspond to actual implemented or planned Smart-HelpDesk workflows.

13. NO FAKE AUTHENTICATION

Authentication is not part of Phase 1 unless the existing backend explicitly supports it.

Do not implement:

fake login
fake JWT
fake sessions
fake registration
fake password reset
fake Google login
fake SSO
fake production role switching

The Stitch project may contain authentication-related visual screens.

That does not mean those screens should become fake functional features.

The backend determines whether those workflows can be implemented.

If authentication is unsupported, do not build a fake system.

14. CORE ENTITY INTEGRATION

Integrate the existing backend APIs for the foundational entities supported by the backend.

Inspect the actual API implementation first.

This phase covers, where supported by the existing backend:

Categories
Technicians
Customers

Do not assume CRUD behavior.

Verify which operations actually exist.

For every entity:

Inspect actual routes.
Inspect schemas.
Inspect allowed create/update fields.
Implement only supported operations.
Handle loading.
Handle empty data.
Handle errors.
Handle successful actions.
Verify the actual data persists correctly.
15. TECHNICIAN CAPACITY MANAGEMENT SCREEN

Implement the Technician Capacity Management screen.

Use the Stitch MCP to retrieve and inspect the relevant design from the Smart-HelpDesk Stitch project.

The known Stitch design reference is:

07fc047c...

However, use Stitch MCP to locate and retrieve the complete relevant screen rather than relying only on this shortened identifier.

The screen must be built around actual backend technician data.

Potential backend-supported information may include:

technician name
contact information
service categories
zone/location data
on-duty status
workload
maximum workload
rating
completed jobs
reopened jobs
reopen rate

Do not display a field merely because it exists visually in Stitch.

First verify that the backend provides it or that it can be correctly calculated from existing backend data.

Do not create fake performance metrics.

Do not fabricate technician statistics.

If Stitch contains a visual element unsupported by the backend, adapt the presentation while preserving the overall design direction.

Implement supported actions such as:

listing technicians
creating technicians
editing technicians
updating supported availability/on-duty information

Only if those operations actually exist in the backend.

16. CATEGORY AND CUSTOMER FOUNDATION

Integrate the backend-supported category and customer operations needed by later phases.

These do not necessarily need large standalone dashboard screens if the Stitch designs and actual Phase 1 requirements do not justify them.

The goal is to establish:

Real API integration
+
Reliable data access
+
Reusable entity selection/display patterns

These entities will be used later for ticket creation and management.

Do not build unnecessary UI merely to demonstrate that an API exists.

17. RESPONSIVE REQUIREMENTS

Phase 1 must establish responsive foundations.

Test at least:

desktop
laptop
tablet
mobile

The Technician Capacity Management screen and application shell should remain usable across reasonable screen sizes.

Do not simply shrink desktop layouts.

Use responsive behavior consistent with the Stitch design and product requirements.

Avoid:

broken overflow
unusable horizontal scrolling
clipped content
tiny touch targets
unreadable tables
18. ACCESSIBILITY REQUIREMENTS

Ensure the foundation supports:

semantic HTML
visible focus states
keyboard navigation
associated labels
readable contrast
adequate button/touch target sizes
status information not conveyed by color alone
appropriate disabled states

Do not sacrifice this for visual similarity.

19. DO NOT BUILD FUTURE PHASES

Do not prematurely implement:

ticket creation workflow
ticket management hub
operations dashboard
routing preview
routing dispatch
assignment offers
fallback monitor
technician job acceptance
ask later
decline workflow
arrival
start work
complete work
customer confirmation
reopening
ticket lifecycle page

Those belong to later phases.

You may create reusable foundations that later phases need, but do not implement future product workflows.

20. REQUIRED IMPLEMENTATION ORDER

Follow this order unless the existing project structure makes a small adjustment necessary:

Step 1 — Inspect

Inspect:

frontend
backend
APIs
schemas
models
frontend guidelines
UI documentation
Stitch project
Step 2 — Report Understanding

Before making major changes, provide a concise implementation plan showing:

files to create/change
actual backend APIs to integrate
Stitch screens/components being used
anything in the Stitch design unsupported by the backend
Step 3 — Establish Foundation

Implement:

typography
design tokens
base styles
API client
shared state/error patterns
reusable components
Step 4 — Application Shell

Implement the layout and navigation foundation according to Stitch.

Step 5 — Core Entities

Integrate real:

categories
technicians
customers

using actual backend contracts.

Step 6 — Technician Capacity Management

Implement the full Phase 1 operational screen based on the Stitch design.

Step 7 — Test

Test:

API integration
create/update operations that exist
loading states
empty states
errors
success feedback
responsiveness
console errors
broken imports
backend compatibility
21. TESTING RULES

Do not consider Phase 1 complete merely because the pages render.

Verify actual frontend ↔ backend behavior.

For every implemented API action:

Frontend action
      ↓
Correct request sent
      ↓
Existing backend endpoint
      ↓
Existing backend validation
      ↓
Actual response
      ↓
Frontend updates correctly

Do not use fake frontend data to hide broken integration.

Do not mock APIs if the real backend is available.

22. PHASE 1 ACCEPTANCE CRITERIA

Phase 1 is complete only when:

Foundation
React frontend runs correctly.
Bootstrap is integrated without producing a generic Bootstrap appearance.
The design system is centralized.
Exact typography is applied globally:
DM Serif Display
Manrope
IBM Plex Mono
Stitch
Relevant screens were actually retrieved and inspected through Stitch MCP.
Implemented UI follows the Stitch project closely.
Existing Stitch visual direction was not casually redesigned.
Backend
Backend source code was not modified.
No backend routes were changed.
No schemas were changed.
No database models were changed.
Frontend API calls match actual backend contracts.
No fake API endpoints or fields were invented.
Entities
Supported category integration works.
Supported technician integration works.
Supported customer integration works.
Data comes from the real backend.
Screen
Technician Capacity Management is implemented according to the Stitch design and real backend capabilities.
States
Loading handled.
Empty handled.
Error handled.
Success feedback handled where applicable.
Quality
Responsive behavior checked.
Accessibility basics checked.
No unnecessary dependencies.
No future-phase workflow prematurely implemented.
No fake authentication or role switching.
23. FINAL PHASE 1 RULE

The following hierarchy is absolute:

1. Existing backend behavior and API contracts
                ↓
2. frontend_guidelines.md product/UX rules
                ↓
3. Actual Stitch designs retrieved through Stitch MCP
                ↓
4. Frontend implementation

Never reverse this hierarchy.

Do not modify the backend to fit the frontend.

Do not invent frontend behavior to fit Stitch.

Adapt the frontend implementation so that:

Real backend
+
Actual Smart-HelpDesk workflow
+
Frontend guidelines
+
Stitch visual design

work together cleanly.

Complete only Phase 1 from start to finish.

When finished, provide:

A summary of what was implemented.
Every frontend file created or modified.
The actual backend APIs integrated.
The Stitch screens/designs used.
Any Stitch elements intentionally not implemented because the backend does not support them.
Testing performed and results.
Confirmation that the backend was not modified.

Begin with inspection. Do not start changing code blindly.