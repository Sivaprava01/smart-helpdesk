# Smart-HelpDesk — Frontend JWT & OAuth Authentication Phase

## Purpose

This phase bridges the completed Smart-HelpDesk backend authentication system with the frontend.

It must be completed after Frontend Phase 1 and before the original Frontend Phase 2.

The purpose is to replace any temporary or fake frontend identity behavior with real backend authentication.

The flow is:

Landing Page
    ↓
Sign In / Registration
    ↓
JWT or supported OAuth authentication
    ↓
Authenticated User
    ↓
Real Role-Based Application Access
    ↓
Continue into Smart-HelpDesk workflows

---

# 1. SOURCES OF TRUTH

The implementation must follow this priority:

1. Existing backend authentication implementation
2. Backend authentication routes, schemas, models, and tests
3. `backend/phases/jwt_oauth.md`
4. Stitch MCP designs
5. `frontend/phases/frontend_guidelines.md`
6. Existing Frontend Phase 1 architecture

The frontend must never guess authentication behavior.

---

# 2. BACKEND-FIRST RULE

Before implementing any authentication UI, inspect the actual backend.

Verify:

- registration endpoint
- login endpoint
- request schemas
- response schemas
- JWT access token behavior
- refresh token behavior, if implemented
- token expiration
- refresh endpoint, if implemented
- current authenticated user endpoint
- logout behavior
- OAuth providers
- OAuth authorization endpoints
- OAuth callback behavior
- password recovery/reset endpoints
- roles
- permissions
- user/entity relationships

Do not implement functionality that does not exist in the backend.

---

# 3. LANDING PAGE

The application should have a proper entry point before authentication.

The landing page should communicate Smart-HelpDesk's actual purpose:

- maintenance issue reporting
- intelligent technician routing
- technician assignment lifecycle
- field service execution
- customer-confirmed resolution

The primary goal is to guide users into the real authentication flow.

## The landing page must feel:

- calm
- trustworthy
- modern
- operational
- human
- specific to the Smart-HelpDesk workflow

## Do not add:

- fake testimonials
- fake customer logos
- fake company statistics
- fake reviews
- fake productivity metrics
- fake analytics
- generic AI claims
- excessive gradients
- glassmorphism
- decorative animations

The page must not look like a generic startup landing page.

Use Stitch MCP as the visual reference.

---

# 4. SIGN IN

The Sign In screen must use the relevant Stitch design.

It must connect to the real backend login API.

The frontend must follow the exact backend request and response contract.

Handle:

- valid credentials
- invalid credentials
- validation errors
- loading state
- disabled submit state
- network failure
- server failure
- token handling
- expired authentication
- redirect after successful authentication

Do not:

- hardcode users
- fake login
- simulate tokens
- invent password behavior

---

# 5. JWT HANDLING

JWT behavior must match the backend implementation exactly.

The frontend must correctly handle:

- receiving authentication tokens
- storing/managing tokens according to the chosen backend-compatible architecture
- attaching authentication credentials to protected requests
- expired tokens
- invalid tokens
- refresh tokens if supported
- refresh failures
- logout cleanup

Never hardcode secrets.

Never decode a token and treat frontend-decoded claims as the security authority.

The backend remains the authorization authority.

---

# 6. CURRENT AUTHENTICATED USER

The application must have a reliable way to determine the current authenticated user.

Use the real backend current-user endpoint if provided.

The frontend should support:

Loading authentication state

    ↓

Authenticated user

    ↓

Unauthenticated user

    ↓

Authentication failure

The UI must not briefly display protected application content before authentication is resolved.

---

# 7. PROTECTED ROUTES

Routes that require authentication must be protected.

Unauthenticated users should be redirected appropriately.

The exact redirect behavior should remain simple and predictable.

Do not create fake access checks.

---

# 8. ROLE-BASED UX

Roles must come from the real backend-authenticated user.

Potential Smart-HelpDesk roles may include:

- Admin / Dispatcher
- Technician
- Resident / Customer

The exact role names must match the backend.

Role-based frontend behavior may include:

- appropriate navigation
- appropriate default routes
- hiding irrelevant workflows
- preventing invalid frontend navigation

However:

> Frontend role checks are for UX only.

> Backend authorization is responsible for actual security.

Do not implement a demo persona switcher.

Do not allow users to manually switch roles.

---

# 9. OAUTH

OAuth must follow the completed backend implementation exactly.

Inspect which providers are actually supported.

The frontend must handle:

OAuth action
    ↓
Backend/provider authorization flow
    ↓
Provider authentication
    ↓
Backend callback
    ↓
Application authentication completion
    ↓
Authenticated application state

Handle:

- successful OAuth authentication
- denied authentication
- OAuth errors
- callback errors
- invalid state
- redirect to the appropriate application route

Do not invent OAuth providers.

Do not hardcode OAuth credentials.

---

# 10. REGISTRATION

Use the Stitch Resident Registration design where applicable.

Registration must match the backend schema exactly.

Do not invent:

- extra fields
- unsupported roles
- unsupported profile fields
- unsupported verification flows

After registration, follow the backend's actual authentication behavior.

---

# 11. PASSWORD RECOVERY / RESET

Only implement password recovery/reset if supported by the backend.

Use the Stitch Password Recovery / Reset visual design where relevant.

The frontend must follow the exact backend flow.

Possible states include:

- request reset
- request submitted
- invalid request
- expired reset token
- valid reset token
- new password
- reset success
- reset failure

Do not create a fake password reset experience.

---

# 12. STITCH MCP REQUIREMENT

Stitch MCP must be used extensively.

Relevant screens include:

- Landing / product entry
- Sign In
- Resident Registration
- Password Recovery
- Password Reset
- Authentication-related loading states

Stitch is the visual source of truth.

Do not randomly redesign Stitch screens.

Do not implement generic authentication templates when a Stitch design exists.

---

# 13. DESIGN SYSTEM

Continue using the exact Smart-HelpDesk typography system:

```css
--font-display: "DM Serif Display", Georgia, serif;
--font-body: "Manrope", Arial, sans-serif;
--font-mono: "IBM Plex Mono", "Courier New", monospace;
Use:

DM Serif Display for important editorial/display headings
Manrope for application content and UI
IBM Plex Mono selectively for technical metadata

Continue using the Phase 1 design tokens and components.

14. REMOVE FAKE PERSONA SWITCHING

The application must not use a fake:

Dispatcher switch
Technician switch
Resident switch
demo login
mock identity system

Remove or refactor any existing demo persona switcher.

The user's identity must come from the real backend authentication system.

15. REQUIRED STATES
Authentication states
initial loading
authenticated
unauthenticated
login submitting
login failed
token expired
refresh in progress
refresh failed
logout processing
OAuth redirecting
OAuth failed
Form states
default
focused
validation error
submitting
disabled
success
server error
Network states
offline/network failure
timeout if applicable
backend unavailable
16. ACCESSIBILITY

Authentication screens must support:

keyboard navigation
visible focus
associated labels
appropriate autocomplete attributes
readable validation errors
sufficient contrast
clear button labels
accessible loading feedback

Do not use placeholders as the only labels.

17. RESPONSIVE DESIGN

Authentication must work correctly on:

mobile
tablet
laptop
desktop

Do not simply shrink desktop layouts.

The Stitch visual design must adapt without losing usability.

18. API ARCHITECTURE

Authentication API calls should not be scattered across page components.

Use the existing frontend architecture appropriately.

Conceptually:

api/
    client
    auth

context/ or hooks/
    authentication state

routes/
    protected routes
    public routes

pages/
    landing
    login
    registration
    password recovery
    password reset

Do not introduce unnecessary libraries or global state systems.

19. TESTING REQUIREMENTS

Before this phase is complete, verify:

landing page works
navigation to sign in works
valid login works
invalid login is handled
validation works
current user loads correctly
authenticated state persists according to backend design
protected routes reject unauthenticated users
logout works
expired tokens are handled
token refresh works if implemented
OAuth works if configured
registration works
password recovery/reset works if supported
role-based navigation uses real backend identity
no fake persona switcher remains
existing Frontend Phase 1 features still work
production build succeeds
20. BACKEND PROTECTION RULE

During this frontend phase:

DO NOT modify:

backend routes
backend schemas
backend models
backend JWT implementation
backend OAuth implementation
backend permissions
backend business logic

If a frontend integration problem is found:

inspect the backend contract
adapt the frontend to the actual backend
do not silently change the backend

Any genuine backend defect must be reported separately rather than casually changed during frontend work.

21. COMPLETION CRITERIA

This phase is complete only when:

a user can enter through the landing page
real sign-in works against the backend
JWT authentication works
current user identity comes from the backend
protected routes work
real roles are respected
fake persona switching is removed
OAuth works if supported/configured
registration works
password recovery/reset works if supported
Stitch designs are followed
frontend guidelines are followed
Phase 1 functionality still works
the backend remains unchanged
the frontend production build passes

Only after this phase is complete should the project resume:Frontend Phase 2 — Ticket Creation, Management & Operations Overview.