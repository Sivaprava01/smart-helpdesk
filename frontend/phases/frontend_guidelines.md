
# Smart-HelpDesk — Frontend Design & Implementation Guidelines

> **Purpose:** This document is the primary source of truth for frontend implementation, UI/UX decisions, visual consistency, responsive behavior, and backend-aligned product behavior for the **Smart-HelpDesk** application.
>
> **Audience:** AI coding agents, frontend developers, UI designers, and anyone modifying the Smart-HelpDesk frontend.
>
> **Core principle:**
>
> **Build a calm, trustworthy, highly usable operational product that makes a maintenance request understandable from creation to customer-confirmed resolution.**
>
> The frontend must not be a generic SaaS dashboard, a marketing website, or an AI-generated visual experiment.

---

# 1. PRODUCT IDENTITY

## What Smart-HelpDesk is

Smart-HelpDesk is an intelligent maintenance helpdesk and technician dispatch system for residential or facility environments.

It manages a service request through its complete operational lifecycle:

```text
Customer reports an issue
        ↓
Ticket is created
        ↓
Ticket enters routing
        ↓
Eligible technician is selected
        ↓
Technician receives an assignment offer
        ↓
Technician accepts, declines, defers, or the offer expires
        ↓
Fallback routing happens when necessary
        ↓
Technician arrives
        ↓
Technician starts work
        ↓
Technician marks work complete
        ↓
Customer verifies the result
        ↓
YES → Ticket closes
NO  → Ticket reopens and alternative routing begins
```

This complete lifecycle is the heart of the product.

The frontend must make this workflow understandable.

---

# 2. THE PRODUCT'S MOST IMPORTANT DIFFERENTIATOR

Smart-HelpDesk is **not simply a ticket tracker**.

Its distinctive behavior is:

1. Tickets are routed using deterministic technician selection.
2. Technician assignment is a separate lifecycle from ticket status.
3. Technicians receive actual offers that can be accepted, declined, deferred, or expired.
4. Failed offers trigger fallback routing.
5. Technician completion does not automatically close a ticket.
6. The customer has the final confirmation step.
7. A customer can report the issue as unresolved.
8. Reopening triggers alternative routing that avoids previously attempted technicians where applicable.

The frontend must communicate these concepts clearly.

Do not hide the product's intelligence behind a generic:

```text
Open
In Progress
Closed
```

interface.

---

# 3. PRODUCT PERSONAS

The UI serves different people with different needs.

The same information should not necessarily be presented the same way to everyone.

---

## 3.1 Customer / Resident

The customer primarily wants to know:

* What issue did I report?
* Was my request received?
* What is happening right now?
* Has a technician been assigned?
* Who is handling the issue?
* Has the technician completed the work?
* Do I need to respond?
* What should I do next?

The customer should not need to understand:

* routing weights
* fallback candidate queues
* assignment internals
* workload calculations
* offer processing logic
* technical backend statuses

Customer UX should prioritize:

```text
Clarity
Trust
Status visibility
Simple actions
Low information density
Mobile usability
```

---

## 3.2 Technician

The technician needs to know:

* Do I have a new offer?
* How much time do I have to respond?
* What is the issue?
* Where is the issue?
* What should I do next?
* What jobs am I currently responsible for?
* What stage is each job in?

Technician UX should prioritize:

```text
Speed
Large actions
Clear urgency
Mobile usability
Minimal navigation
Sequential workflow
```

A technician may use the product while moving between jobs or while on site.

Do not make the technician experience look like an administrator dashboard.

---

## 3.3 Dispatcher / Operations User

The dispatcher needs to know:

* Which tickets need attention?
* Which tickets are pending routing?
* Which offers are waiting for a technician?
* Which jobs are currently active?
* Which tickets are waiting for customer confirmation?
* Which tickets were reopened?
* Which technicians are available?
* What is happening across the operation right now?

Dispatcher UX can be denser and more data-oriented.

Appropriate tools include:

* tables
* filters
* search
* compact lists
* status grouping
* routing previews
* timelines
* workload indicators

The dispatcher interface must optimize for operational scanning and decision-making.

---

## 4. PRODUCT BEHAVIOR IS THE SOURCE OF TRUTH

The frontend must reflect the actual backend.

The frontend must never invent product behavior merely because it would make a screen look more complete.

Before implementing a feature, inspect:

* existing backend routes
* request schemas
* response schemas
* enums
* service logic
* authentication support
* existing frontend structure
* implemented project phases

If something is not implemented in the backend, do not silently pretend that it exists.

---

# 5. TICKET STATUS AND ASSIGNMENT STATUS ARE DIFFERENT

This is one of the most important Smart-HelpDesk rules.

Do not merge these two concepts.

## Ticket lifecycle

The actual ticket lifecycle is conceptually:

```text
PENDING
    ↓
ROUTING
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
```

A ticket may also become:

```text
REOPENED
    ↓
ROUTING
```

The exact transition behavior must follow the backend implementation.

---

## Assignment lifecycle

Technician assignments have their own lifecycle:

```text
OFFERED
    ↓
DEFERRED
    ↓
ACCEPTED
```

or:

```text
OFFERED
    ↓
DECLINED
```

or:

```text
OFFERED
    ↓
EXPIRED
```

A completed assignment may eventually become:

```text
COMPLETED
```

Do not display assignment status as if it were the ticket status.

For example:

### Incorrect

```text
Ticket: Declined
```

The ticket itself may still be routing.

The assignment was declined.

### Correct

```text
Ticket status:
Routing

Current assignment attempt:
Declined by technician

Next:
Searching for another eligible technician
```

This distinction must be reflected in both UI terminology and data architecture.

---

# 6. CUSTOMER-FRIENDLY STATUS LANGUAGE

The backend enum does not always need to be shown literally.

For customers, prefer understandable language.

Suggested presentation:

| Backend Status                 | Customer-Facing Meaning         |
| ------------------------------ | ------------------------------- |
| PENDING                        | Request received                |
| ROUTING                        | Finding an available technician |
| ASSIGNED                       | Technician assigned             |
| ARRIVED                        | Technician has arrived          |
| IN_PROGRESS                    | Work in progress                |
| AWAITING_CUSTOMER_CONFIRMATION | Waiting for your confirmation   |
| CLOSED                         | Resolved and closed             |
| REOPENED                       | Issue reported as unresolved    |

Do not expose raw enum names such as:

```text
AWAITING_CUSTOMER_CONFIRMATION
```

to a normal customer.

Instead:

```text
Waiting for your confirmation
```

The UI may use the backend enum internally, but the user-facing copy should be human.

---

# 7. ROUTING INTELLIGENCE

Smart-HelpDesk uses deterministic technician routing.

The routing factors are:

```text
Location Proximity              20%
Overall Rating                  25%
Customer History Affinity       25%
Reopen Rate Reliability         15%
Workload Availability           15%
```

The routing UI should not pretend to be an AI black box.

This is a deterministic operational system.

For dispatchers and administrators, the interface may explain:

```text
Why this technician ranked highly
```

For example:

```text
1. Ravi Kumar
Overall score: 91.4

Rating                  ██████████ 25/25
Customer history        ██████████ 25/25
Proximity               ████████░░ 16/20
Reliability             ██████░░░░ 10/15
Availability            ██████░░░░ 9/15
```

This is useful because it makes the routing process understandable.

However, do not overload every screen with routing mathematics.

### Routing information belongs primarily in:

* routing preview
* ticket details
* routing monitor
* dispatcher/admin workflows

### Routing information does not belong prominently in:

* customer home
* customer confirmation
* technician field workflow

---

# 8. FALLBACK ROUTING IS A REAL PRODUCT FLOW

Fallback routing is not an error state that should disappear.

It is an important Smart-HelpDesk workflow.

Fallback may occur when:

* a technician declines
* an offer expires
* a customer reports the work unresolved
* another routing failure condition is handled by the backend

The UI should communicate what is happening.

For example:

```text
Technician unavailable

The previous technician could not take this request.
Smart-HelpDesk is selecting another eligible technician.
```

For dispatchers:

```text
Previous attempt
Ravi Kumar — Declined

Fallback attempt
Kumar S. — Offered

Offer expires in 06:42
```

For customers, keep the explanation simpler:

```text
We're arranging another technician to handle your request.
```

Do not expose unnecessary internal details to customers.

---

# 9. THE CUSTOMER CONFIRMATION GUARD

Technician work completion is not the same as ticket closure.

This must be visually obvious.

The lifecycle is:

```text
Technician completes work
        ↓
Ticket moves to
AWAITING_CUSTOMER_CONFIRMATION
        ↓
Customer responds
        ↓
YES → CLOSED
NO  → REOPENED → alternative routing
```

The confirmation screen is therefore a critical product screen.

Do not treat it as a tiny afterthought or a generic modal.

The customer must clearly understand:

> The technician has completed the work. Please confirm whether your issue is actually resolved.

---

# 10. CUSTOMER CONFIRMATION UX

The primary question should be direct:

## Was your issue completely resolved?

Two clearly differentiated actions:

```text
YES, ISSUE IS RESOLVED
```

and

```text
NO, THE ISSUE IS STILL UNRESOLVED
```

Do not make these actions visually ambiguous.

---

## If YES

Allow:

* optional rating
* optional feedback
* confirmation of closure

Suggested result:

```text
Issue resolved

Thank you for confirming the repair.
Your request is now closed.
```

---

## If NO

Allow the customer to explain what remains unresolved.

Suggested message:

```text
We're sorry the issue is still not resolved.

Tell us what is still wrong. We'll reopen the request and arrange the next appropriate service attempt.
```

Do not promise a specific behavior unless the backend actually guarantees it.

For example, avoid claiming:

```text
A senior technician will immediately arrive.
```

unless that behavior actually exists.

---

# 11. THE TECHNICIAN OFFER EXPERIENCE

A technician receiving an offer needs an extremely clear screen.

The offer should communicate:

* service category
* location
* issue description
* relevant schedule information
* remaining response time
* current decision required

Primary actions:

```text
Accept Job
Ask Me Later
Decline Job
```

These must have clear visual hierarchy.

Recommended:

```text
Accept Job       Primary
Ask Me Later     Secondary
Decline Job      Destructive / outlined
```

Do not make all three buttons equally visually dominant.

---

## Countdown behavior

If an offer has an expiration deadline:

* show remaining time clearly
* do not use a decorative timer just for visual effect
* make the urgency understandable
* update the UI when the offer becomes invalid
* prevent accepting an already expired offer

When expired:

```text
This offer has expired.

The request is no longer available for acceptance.
```

The UI must not leave an active-looking Accept button on an expired assignment.

---

# 12. TECHNICIAN JOB EXECUTION

Once a job is accepted, the workflow should be sequential.

```text
Assigned
    ↓
Mark Arrived
    ↓
Start Work
    ↓
Mark Work Complete
```

The UI should make the current step obvious.

For example:

```text
✓ Job accepted

→ Mark arrived
  Available now

○ Start work
  Available after arrival

○ Mark complete
  Available after work starts
```

Do not allow impossible transitions in the UI.

For example:

```text
Mark Work Complete
```

should not look normally available if the backend requires the job to be in progress first.

---

# 13. COMPLETING WORK

When the technician completes work:

* allow the completion note supported by the backend
* clearly explain that customer verification is next
* do not tell the technician that the ticket is closed

Correct:

```text
Work completion submitted.

The resident will now be asked to confirm whether the issue is resolved.
```

Incorrect:

```text
Ticket successfully closed.
```

unless the customer has actually confirmed it.

---

# 14. REOPENED TICKETS

A reopened ticket is important.

It indicates:

```text
Technician reported work complete
        ↓
Customer reported unresolved
        ↓
Ticket reopened
        ↓
Alternative routing may begin
```

The UI should preserve history.

Do not overwrite the previous service attempt as if it never happened.

The ticket detail page should allow the operational user to understand:

```text
Attempt 1
Technician A
Accepted → Arrived → Worked → Completed
Customer result: Unresolved

Attempt 2
Technician B
Currently offered
```

This history is one of the strongest features of Smart-HelpDesk.

---

# 15. PRODUCT VISUAL IDENTITY

The product should feel:

* calm
* precise
* trustworthy
* modern
* operational
* human
* mature
* slightly premium
* efficient
* structured

The product should not feel:

* futuristic
* flashy
* crypto-like
* gaming-oriented
* neon
* AI-themed
* experimental
* excessively corporate
* like a generic admin template
* like a startup landing page
* like a Dribbble concept
* like a screenshot made to impress rather than a product made to use

---

# 16. THE ANTI-VIBE-CODING RULE

Do not automatically generate:

```text
Sidebar
+
Huge welcome message
+
Four random KPI cards
+
Large meaningless chart
+
Rounded cards everywhere
+
Purple gradient
+
Glassmorphism
+
Icons beside every label
+
Colored pills everywhere
+
Hover animations everywhere
+
Heavy shadows
```

This is not a design system.

Every element must have a product reason.

---

# 17. PREMIUM DOES NOT MEAN DECORATIVE

Premium quality should come from:

* excellent typography
* precise spacing
* hierarchy
* restraint
* consistent components
* thoughtful microcopy
* responsive behavior
* meaningful feedback
* good information density
* predictable interactions

Not from:

* gradients everywhere
* neon
* glassmorphism
* huge typography
* decorative blobs
* unnecessary illustrations
* 3D objects
* animated backgrounds
* floating cards
* shadows on everything

The original guideline's emphasis on decisions over decoration should remain a core principle. 

---

# 18. TYPOGRAPHY SYSTEM

Typography will be deliberately designed as part of Smart-HelpDesk's identity.

Do not use one generic font everywhere simply because it is convenient.

The final typography system should contain three deliberate roles:

## Display / Headline Font

Used for:

* major page titles
* important screen headings
* high-level empty state titles
* major confirmation moments

Characteristics:

* distinctive
* professional
* modern
* not gimmicky
* readable at large sizes

---

## Body Font

Used for:

* paragraphs
* descriptions
* ticket details
* forms
* tables
* operational content

Characteristics:

* extremely readable
* neutral
* excellent at small sizes
* suitable for dense information

---

## UI / Label Font

Used selectively for:

* metadata
* field labels
* table labels
* status metadata
* timestamps
* compact operational information

Characteristics:

* compact
* precise
* highly legible
* visually structured

---

## Important typography rule

Do not finalize arbitrary fonts before the existing Stitch designs are reviewed.

The font choices must work with:

* the selected Alexandria visual theme
* existing layout proportions
* density of operational screens
* customer-facing screens
* technician mobile screens

Typography must be globally tokenized.

Do not hardcode random fonts page by page.

---

# 19. COLOR SYSTEM

Use color semantically.

Recommended status meanings:

| Status                         | Meaning                       |
| ------------------------------ | ----------------------------- |
| PENDING                        | neutral / awaiting action     |
| ROUTING                        | active process / blue         |
| ASSIGNED                       | assigned / indigo             |
| ARRIVED                        | presence / violet             |
| IN_PROGRESS                    | active work / amber           |
| AWAITING_CUSTOMER_CONFIRMATION | customer action needed / teal |
| CLOSED                         | successful resolution / green |
| REOPENED                       | unresolved / red or rose      |

Color should not be the only indicator.

Always support important status information with:

* text
* icon where useful
* placement
* context

Do not create random colors simply to make cards look varied.

---

# 20. STATUS DESIGN

Statuses are important information.

They should be consistent throughout the application.

The same status must not appear as:

```text
Blue on one page
Green on another page
Purple somewhere else
```

Create one centralized status mapping.

Conceptually:

```text
status
label
color treatment
icon
customer-friendly copy
description of what happens next
```

Use this consistently.

---

# 21. NAVIGATION MUST FOLLOW THE USER

Do not show one giant navigation structure to every user.

Navigation should reflect the user's responsibility.

---

## Customer-oriented navigation

Possible product structure:

```text
Home
My Requests
Report an Issue
Profile
```

Only include additional items if they actually exist.

---

## Technician-oriented navigation

Possible structure:

```text
My Jobs
Current Offer
Job History
Profile
```

On mobile, prioritize the current actionable job.

---

## Operations-oriented navigation

Possible structure:

```text
Dashboard
Tickets
Technicians
Routing
```

Do not add generic navigation items such as:

```text
Analytics
AI Insights
Reports
Growth
Revenue
```

unless the actual product implements them.

---

# 22. DO NOT INVENT AUTHENTICATION

Authentication screens may exist in the visual design.

However:

> Do not implement fake login, registration, password reset, SSO, Google Workspace, Microsoft Entra, or role switching unless the actual backend supports those workflows.

This is especially important because a beautiful Stitch authentication screen is not proof that the backend supports it.

Before implementing authentication:

1. inspect the backend
2. verify the routes
3. verify token/session behavior
4. verify user models
5. verify role support

If authentication is not implemented yet:

* do not invent an auth API
* do not fabricate JWT behavior
* do not create fake production authentication

Visual screens may remain static prototypes until supported.

---

# 23. DASHBOARD DESIGN

The operations dashboard should answer one question:

## What needs attention right now?

Do not add metrics merely because dashboards are expected to have KPI cards.

Useful information includes things directly related to Smart-HelpDesk operations:

* active tickets
* pending dispatch
* active routing offers
* jobs in progress
* awaiting customer confirmation
* reopened tickets
* technician availability

A metric must lead to understanding or action.

Do not add fake charts.

Do not add:

```text
Customer Happiness 98%
AI Efficiency +24%
Growth +18%
Monthly Revenue
```

unless these are real product metrics supported by real data.

---

# 24. TICKET LIST DESIGN

The ticket list is an operational scanning tool.

Prioritize information that helps users identify a ticket quickly.

Potential columns:

* ticket ID
* customer
* category
* location
* schedule
* current status
* assigned technician
* last relevant update
* actions

Do not show every backend field.

A table is not a database dump.

---

## Filters

Filters should solve actual problems.

Examples:

* status
* category
* location or zone
* assigned technician
* schedule type

Avoid creating ten filters simply to make the application appear sophisticated.

---

# 25. TICKET DETAILS PAGE

The ticket details page is the complete operational history of a request.

The page should clearly answer:

## What happened?

## What is happening now?

## What happens next?

Recommended hierarchy:

```text
Ticket identity and current status
        ↓
Issue summary
        ↓
Current assignment / current action
        ↓
Lifecycle progress
        ↓
Assignment attempt history
        ↓
Customer confirmation result
        ↓
Operational details
```

---

## Assignment history must be preserved

Show historical attempts.

For example:

```text
Attempt 1
Ravi Kumar
Declined
Reason: Busy with another job

Attempt 2
Kumar S.
Accepted
Arrived
Started work
Completed

Customer result
Issue still unresolved

Attempt 3
Currently routing
```

Do not flatten all attempts into one generic technician field.

---

# 26. ROUTING PREVIEW

The routing preview should help operational users understand the routing engine.

It should clearly separate:

```text
Eligibility
```

from:

```text
Ranking
```

Example eligibility:

```text
✓ Active
✓ On duty
✓ Category match
✓ Capacity available
```

Then ranking:

```text
Proximity
Rating
Customer history
Reliability
Workload
Total score
```

An ineligible technician should not look like they simply received a low score.

The UI should distinguish:

```text
Not eligible
```

from:

```text
Eligible but ranked lower
```

---

# 27. TECHNICIAN MANAGEMENT

Technician information should reflect actual operational relevance.

Potential information:

* name
* contact information
* service categories
* zone
* on-duty status
* workload
* maximum workload
* rating
* completed jobs
* reopened jobs
* reopen rate

Do not add fake performance scores.

Every metric shown must be backed by actual data or calculation.

---

# 28. CUSTOMER EXPERIENCE

Customers should never feel like they are operating backend software.

Avoid exposing:

```text
ROUTING
DEFERRED
EXPIRED
FALLBACK CANDIDATE
WORKLOAD CAPACITY
REOPEN RATE
```

unless there is a genuine reason.

Translate system behavior into understandable information.

For example:

Instead of:

```text
Assignment expired. Fallback dispatch initiated.
```

use:

```text
We're looking for another available technician.
```

---

# 29. TECHNICIAN EXPERIENCE

The technician's interface should be action-first.

At the top, prioritize:

```text
What needs my response now?
```

Then:

```text
What job am I currently doing?
```

Then:

```text
What jobs are coming next?
```

Do not bury an active offer below dashboards, statistics, charts, and decorative cards.

---

# 30. FORMS

Forms must optimize for completion.

Rules:

* clear labels
* appropriate input types
* visible required fields
* useful examples
* inline validation
* meaningful error messages
* correct keyboard behavior
* sensible field sizes
* disabled submit while processing

Do not use placeholders as the only label.

---

# 31. CREATE TICKET FORM

The create-ticket flow should be simple.

Only request information supported by the backend.

Do not automatically add:

* photo upload
* attachments
* priority
* emergency flags
* extra custom fields

unless the backend and product actually support them.

The UI must follow the real ticket creation schema.

A possible conceptual order is:

```text
Customer / contact
        ↓
Service category
        ↓
Location
        ↓
Problem description
        ↓
ASAP or scheduled service
        ↓
Submit ticket
```

But the actual fields must be verified against the backend.

---

# 32. FORM VALIDATION

Validation should explain the problem.

Bad:

```text
Invalid input.
```

Better:

```text
Please enter a description before creating the ticket.
```

Bad:

```text
Error.
```

Better:

```text
The scheduled time must be in the future.
```

Validation should appear close to the relevant field.

Do not turn the entire form red because one field is invalid.

---

# 33. ASYNCHRONOUS ACTIONS

Every backend action must communicate its state.

Example:

```text
Accept Job
     ↓
Accepting...
     ↓
Accepted
```

Important actions must prevent accidental repeated requests.

During submission:

* disable duplicate action
* show progress
* preserve context
* restore action if the request fails where appropriate

This applies to:

* creating tickets
* dispatching offers
* accepting
* declining
* deferring
* marking arrival
* starting work
* completing work
* customer confirmation
* reopening
* timeout processing

---

# 34. LOADING STATES

Do not use a spinner for everything.

Use skeletons for content-heavy layouts.

Examples:

* ticket table rows
* dashboard metrics
* technician cards
* ticket details
* routing score breakdown

Skeletons should approximately match the final content structure.

Avoid major layout jumps when data loads.

---

# 35. EMPTY STATES

Every major data area needs a meaningful empty state.

The empty state must answer:

1. What is empty?
2. Why might it be empty?
3. What can the user do next?

Examples:

### No active tickets

```text
All caught up

There are currently no active tickets requiring attention.
```

### No technician offers

```text
No offers waiting for you

New assignment offers will appear here when they are available.
```

### No eligible fallback technician

```text
No alternative technician is currently available

The ticket remains unresolved and requires operational attention.
```

The exact wording should match actual backend behavior.

Do not use a giant decorative illustration merely to fill empty space.

---

# 36. ERROR STATES

Every important API interaction needs a useful failure state.

Examples:

```text
Unable to load tickets
```

```text
We couldn't load the routing preview. Try again.
```

```text
This offer is no longer available.
```

```text
The ticket could not be updated. Your previous information has not been lost.
```

Never expose raw backend errors directly to users.

Do not simply say:

```text
Something went wrong.
```

when a more useful message is possible.

---

# 37. SUCCESS STATES

Success feedback should explain the result.

Bad:

```text
Success!
```

Better:

```text
Offer accepted

This ticket is now assigned to you. You can begin the job workflow when you arrive on site.
```

Better:

```text
Ticket created

Your service request has been created and is ready for dispatch.
```

Better:

```text
Issue confirmed resolved

The customer has confirmed that the issue was resolved. The ticket is now closed.
```

---

# 38. CONFIRMATION DIALOGS

Use confirmation dialogs for consequential actions.

Examples:

* decline assignment
* cancel ticket, if supported
* mark work complete
* reopen issue

Do not use confirmation dialogs for every tiny action.

The dialog should explain consequences.

Example:

```text
Decline this job?

The ticket will no longer be assigned to this offer. The system may continue routing it to another eligible technician.
```

Do not fabricate consequences that the backend does not implement.

---

# 39. RESPONSIVE DESIGN

Mobile is not a shrunken desktop.

---

## Customer mobile priority

Customers may primarily use mobile.

Prioritize:

* large touch targets
* readable text
* clear primary action
* short forms
* understandable timeline
* no unnecessary horizontal scrolling

---

## Technician mobile priority

Technician screens should be particularly mobile-friendly.

Prioritize:

* active offer
* timer
* location
* issue
* Accept
* Ask Me Later
* Decline
* sequential job actions

---

## Dispatcher desktop priority

Dispatchers may need information density.

Desktop may appropriately use:

* tables
* side panels
* multi-column layouts
* routing details
* compact technician lists

On smaller screens, these must collapse intelligently.

Do not force a wide desktop table onto a phone.

---

# 40. DESIGN FOR REAL DATA

Never design only for ideal demo content.

Test:

### Long descriptions

```text
Water is continuously leaking from the ceiling near the kitchen entrance and spreading toward the electrical outlet.
```

### Long names

```text
Christopher Alexander Johnson
```

### Multiple assignment attempts

```text
5+ historical attempts
```

### No assigned technician

### No customer feedback

### Expired offer

### Reopened ticket

### Many tickets

### Slow API

### Failed API

### Long technician notes

The layout must remain usable.

---

# 41. COMPONENT STATES

Important components must be designed in the states that actually matter.

Consider:

```text
Default
Hover
Focus
Active
Disabled
Loading
Success
Error
Empty
Expired
Reopened
Long content
Mobile
```

Not every component needs every state.

But every meaningful state must be considered.

---

# 42. CARD POLICY

Cards are not the default container for everything.

Use a card when it establishes a meaningful information boundary.

Good examples:

* active assignment
* urgent technician offer
* issue summary
* customer confirmation
* technician profile summary

Bad:

* every table cell
* every line of metadata
* every filter
* every paragraph

If the information works better as a structured page section, table row, list item, or inline block, do that.

---

# 43. SHADOW POLICY

Shadows establish elevation.

They should not be decoration.

Prefer:

* subtle borders
* surface contrast
* spacing
* restrained shadows

Avoid:

* heavy shadows
* glowing shadows
* every card having elevation
* hover shadow on every element

---

# 44. GRADIENT POLICY

Do not use gradients by default.

Avoid:

* purple-blue gradients
* pink-purple gradients
* neon gradients
* gradient text
* gradient backgrounds behind normal content

The login screen or a deliberately branded area may be an exception if the final visual system supports it.

Operational screens should remain calm and readable.

---

# 45. GLASSMORPHISM POLICY

Do not use glassmorphism as the product's default style.

Avoid:

```text
backdrop blur
frosted panels
semi-transparent operational cards
glowing translucent borders
```

Especially avoid this for:

* ticket tables
* forms
* routing screens
* technician workflows
* ticket details

Readability wins.

---

# 46. ICON POLICY

Use icons when they:

* improve navigation
* communicate status
* clarify an action
* reduce ambiguity

Do not add an icon beside every piece of text.

Do not use icons simply because empty space exists.

Do not rely on an ambiguous icon without a label.

Use one consistent icon system.

---

# 47. BADGE POLICY

Badges should represent compact semantic information.

Good:

```text
Routing
Assigned
In Progress
Awaiting Confirmation
Closed
Reopened
```

Bad:

```text
Customer
Technician
Tower A
Category
Phone
Email
```

Do not turn every metadata item into a colored pill.

---

# 48. BUTTON HIERARCHY

Every important screen should have a clear action hierarchy.

## Primary

The main action the user should take now.

## Secondary

Alternative but normal action.

## Tertiary

Lower-priority action.

## Destructive

Action with significant negative consequence.

Example for technician offer:

```text
PRIMARY
Accept Job

SECONDARY
Ask Me Later

DESTRUCTIVE
Decline Job
```

Do not create five equally prominent buttons.

---

# 49. MICROCOPY

Use product-specific language.

Avoid generic AI copy such as:

```text
Welcome back! Let's make today productive!
```

Instead:

```text
3 tickets need attention.
```

Avoid:

```text
Action completed successfully.
```

Instead:

```text
Work marked complete. Waiting for the customer's confirmation.
```

Microcopy should explain the actual state transition.

---

# 50. ACCESSIBILITY

Accessibility is mandatory.

Ensure:

* sufficient contrast
* keyboard navigation
* visible focus states
* semantic HTML
* properly associated labels
* appropriate button text
* adequate touch targets
* screen-reader-friendly controls
* status not communicated through color alone

Do not sacrifice accessibility for aesthetics.

---

# 51. ANIMATION

Animation is optional.

Use it only when it improves:

* feedback
* orientation
* understanding
* continuity

Good:

* modal entrance
* toast appearance
* expand/collapse
* status transition
* countdown state change

Bad:

* floating cards
* animated gradients
* constant movement
* decorative page transitions
* exaggerated hover effects

Animation should be felt, not noticed.

---

# 52. DO NOT FAKE SOPHISTICATION

Do not add:

* fake analytics
* random charts
* decorative percentages
* fake AI recommendations
* arbitrary productivity scores
* meaningless activity graphs
* fake notifications

Every visualized number must have:

1. a real data source
2. a meaningful calculation
3. a user purpose

---

# 53. BACKEND INTEGRATION RULES

The backend is the source of truth.

The frontend must not:

* invent endpoints
* change API contracts
* rename backend behavior without mapping it correctly
* create fake response fields
* assume unsupported authentication
* invent user roles
* invent permissions
* invent ticket states
* invent assignment states

Before implementing a backend-integrated feature, inspect:

```text
Endpoint
HTTP method
Request body
Query parameters
Response structure
Error behavior
Existing service logic
```

---

# 54. API LAYER

Do not scatter raw API calls throughout random page components.

Use a predictable structure appropriate to the existing frontend.

Conceptually:

```text
api/
services/
hooks/
components/
pages/
```

The exact architecture should respect the existing project.

Do not rewrite the project architecture unnecessarily.

---

# 55. STATE MANAGEMENT

Use the simplest appropriate state mechanism.

Use:

* local state for local UI behavior
* shared state for genuinely shared UI state
* centralized handling for authentication if authentication exists
* server state patterns for API data

Do not introduce a complex global store merely because an AI-generated project normally uses one.

---

# 56. COMPONENT REUSE

Create reusable components where patterns genuinely repeat.

Likely useful Smart-HelpDesk components include:

```text
Button
Input
Select
Modal
Dialog
StatusBadge
TicketStatusBadge
AssignmentStatusBadge
TicketTimeline
AssignmentAttemptTimeline
OfferCountdown
TechnicianSummary
WorkloadIndicator
RoutingScoreBreakdown
EmptyState
ErrorState
Skeleton
Toast
PageHeader
```

Do not over-abstract.

A component should improve consistency and maintainability.

---

# 57. ROLE-BASED UX

Role-specific UI must not merely mean hiding buttons.

The frontend should:

* route users appropriately
* prevent invalid user flows
* handle unauthorized responses
* avoid showing irrelevant workflows

However:

> The backend remains responsible for actual authorization.

Frontend hiding is not security.

---

# 58. AI CODING AGENT INSTRUCTIONS

Before making changes, the AI agent must:

1. Inspect the existing frontend.
2. Understand the project structure.
3. Inspect the backend API relevant to the requested page.
4. Identify existing reusable components.
5. Inspect existing styles and design tokens.
6. Preserve working functionality.
7. Avoid unnecessary dependencies.
8. Avoid unnecessary rewrites.
9. Implement the requested change.
10. Test the affected workflow.
11. Check responsive behavior.
12. Check loading, error, and empty states.
13. Verify that the implementation matches actual backend behavior.

---

# 59. AI AGENT MUST NOT

The AI agent must not:

* rewrite the entire frontend unnecessarily
* replace working components without reason
* modify the backend just to simplify frontend work
* invent endpoints
* invent database fields
* invent statuses
* invent authentication behavior
* invent analytics
* create fake data to hide missing functionality
* add gradients by default
* add glassmorphism by default
* add excessive cards
* add excessive badges
* add icons everywhere
* add excessive rounded corners
* add excessive shadows
* add unnecessary modals
* install unnecessary libraries
* optimize for screenshots instead of actual usage

---

# 60. BEFORE ADDING ANY VISUAL ELEMENT

Ask:

> Does this improve comprehension?

If not:

> Does it improve navigation?

If not:

> Does it improve interaction feedback?

If not:

> Does it communicate meaningful product information?

If not:

**Do not add it.**

---

# 61. BEFORE ADDING A CARD

Ask:

> What meaningful information boundary does this create?

If there is no answer:

Do not create the card.

---

# 62. BEFORE ADDING A COLOR

Ask:

> What semantic meaning does this color represent?

If there is no answer:

Do not add the color.

---

# 63. BEFORE ADDING AN ANIMATION

Ask:

> What does this animation communicate?

If the answer is:

> It looks cool.

Do not add it.

---

# 64. BEFORE ADDING A DEPENDENCY

Ask:

> Can the existing stack handle this cleanly?

If yes:

Do not add another dependency.

---

# 65. REQUIRED SCREEN STATES

The implementation should explicitly handle the important states for Smart-HelpDesk.

## Ticket states

* pending
* routing
* assigned
* arrived
* in progress
* awaiting customer confirmation
* closed
* reopened

## Assignment states

* offered
* deferred
* accepted
* declined
* expired
* completed

## Data states

* loading
* empty
* error
* retry
* success
* long content
* missing optional data

## Interaction states

* default
* hover
* focus
* active
* disabled
* submitting

---

# 66. IMPORTANT EMPTY STATES TO IMPLEMENT

At minimum, consider:

### Dashboard

```text
No active operational activity.
```

### Ticket list

```text
No tickets match the current filters.
```

### Technician portal

```text
You have no pending offers.
```

### Active jobs

```text
You have no active jobs right now.
```

### Customer requests

```text
You have not submitted any service requests yet.
```

### Routing

```text
There are currently no active offers being routed.
```

### Fallback

```text
No eligible alternative technician is currently available.
```

The UI should reflect what the backend actually returns.

---

# 67. IMPORTANT ERROR STATES TO IMPLEMENT

Consider:

* failed ticket load
* failed ticket creation
* failed routing preview
* failed dispatch
* expired offer action
* already processed assignment
* failed accept
* failed decline
* failed defer
* failed arrival update
* failed work start
* failed completion
* failed customer confirmation
* failed reopen
* network unavailable
* unauthorized response

Error copy must be understandable and actionable.

---

# 68. IMPORTANT SUCCESS STATES TO IMPLEMENT

Consider:

```text
Ticket created
```

```text
Offer accepted
```

```text
Offer declined
```

```text
Offer deferred
```

```text
Arrival recorded
```

```text
Work started
```

```text
Work completion submitted
```

```text
Customer confirmed resolution
```

```text
Issue reported unresolved
```

```text
Fallback routing started
```

Again, wording must reflect the real backend result.

---

# 69. COMPLETE PRODUCT FLOWS TO TEST

## Dispatcher flow

```text
Open dashboard
    ↓
Identify ticket
    ↓
Open ticket
    ↓
Preview routing
    ↓
Dispatch offer
    ↓
Observe technician response
    ↓
Observe fallback if needed
    ↓
Track job lifecycle
    ↓
Observe customer confirmation
```

---

## Technician flow

```text
Open My Jobs
    ↓
Receive offer
    ↓
Accept / Ask Me Later / Decline
    ↓
Open active job
    ↓
Mark arrived
    ↓
Start work
    ↓
Mark work complete
    ↓
Await customer verification
```

---

## Customer flow

```text
Create ticket
    ↓
Track request
    ↓
See assignment progress
    ↓
See work progress
    ↓
Receive completion state
    ↓
Confirm resolved
        OR
Report unresolved
    ↓
Track reopened request
```

---

# 70. FINAL SCREEN COMPLETION CHECKLIST

Before a screen is considered complete, verify:

### Product

* Is the screen backed by real product behavior?
* Does it respect the actual API?
* Does it use correct statuses?
* Does it distinguish ticket and assignment state?

### UX

* Is the screen's purpose obvious?
* Is the primary action obvious?
* Does the user know what happens next?
* Is unnecessary information removed?
* Is terminology understandable?

### States

* Loading handled?
* Empty handled?
* Error handled?
* Success handled?
* Long content handled?
* Disabled actions handled?

### Responsive

* Mobile usable?
* Tablet usable?
* Desktop usable?
* No broken layouts?
* No forced horizontal scrolling where inappropriate?

### Accessibility

* Keyboard accessible?
* Focus visible?
* Labels present?
* Contrast sufficient?
* Status not color-only?

### Visual

* Typography consistent?
* Spacing consistent?
* Status colors consistent?
* Buttons consistent?
* Cards used intentionally?
* Icons meaningful?
* Shadows restrained?

---

# 71. FINAL ANTI-GENERIC AUDIT

Before calling the frontend complete, ask:

### Does the application look like this?

```text
Generic SaaS
+
Purple gradient
+
Huge welcome message
+
Random KPI cards
+
Fake chart
+
Rounded cards everywhere
+
Glassmorphism
+
Badges everywhere
+
Hover animations everywhere
```

If yes:

**Stop and reconsider the design.**

---

### Or does it feel like this?

```text
A real maintenance operation
+
Clear customer communication
+
Fast technician decisions
+
Visible routing workflow
+
Understandable service lifecycle
+
Customer-confirmed resolution
+
Calm operational interface
+
Consistent design system
```

If yes:

**Continue.**

---

# 72. PRIORITY ORDER

When there is a conflict, use this priority order:

```text
1. Correct backend behavior
2. User comprehension
3. Task completion
4. Valid lifecycle transitions
5. Accessibility
6. Responsive behavior
7. Information hierarchy
8. Consistency
9. Visual polish
10. Animation
11. Decoration
```

Never sacrifice a higher priority for a lower priority.

---

# 73. THE GOLDEN RULE

For the customer, the application should always answer:

> What happened?

> What is happening now?

> What do I need to do?

> What happens next?

For the technician:

> Do I need to respond now?

> What job am I responsible for?

> What is my next action?

For the dispatcher:

> What needs attention?

> What is currently happening?

> What should I do next?

---

# 74. ULTIMATE RULE

> **Do not try to make Smart-HelpDesk look different merely for the sake of originality.**
>
> **Make Smart-HelpDesk feel specific to the real workflow it manages.**

Its originality should come naturally from the fact that it genuinely visualizes:

```text
Ticket lifecycle
+
Deterministic routing
+
Technician offers
+
Accept / decline / defer
+
Offer expiration
+
Fallback routing
+
Field execution
+
Customer verification
+
Reopened service attempts
```

That is what makes this product different.

**Clarity over cleverness.**

**Usability over decoration.**

**Correctness over fake sophistication.**

**Trust over flashiness.**

**Product behavior over generic SaaS patterns.**
