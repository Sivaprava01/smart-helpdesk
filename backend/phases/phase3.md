I am continuing my internship project called Smart-HelpDesk.

Phase 1 and Phase 2 are already complete.

You must implement ONLY Phase 3: Core APIs, request validation, ticket creation, and basic ticket lifecycle APIs.

Do not implement automatic technician routing or any Phase 4+ functionality.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk and service-ticket routing system.

A residential customer raises a service request such as:

- Plumbing
- Electrical
- Appliance
- Cleaning
- HVAC

Example:

"Water is clogged in my washroom"

The system may eventually understand the description, suggest Plumbing as the category, find eligible technicians, rank them, and assign the best technician.

However, automatic category intelligence and technician routing are NOT part of this phase.

The eventual product flow is:

Customer raises request
        ↓
Ticket is validated and created
        ↓
Ticket waits for routing
        ↓
Eligible technicians are found
        ↓
Technicians are ranked
        ↓
Best technician receives assignment
        ↓
Technician accepts / declines / times out
        ↓
Fallback if necessary
        ↓
Work is performed
        ↓
Customer confirms resolution
        ↓
Customer gives feedback

PHASE 3 STOPS AFTER BASIC TICKET CREATION AND BASIC CRUD/LIFECYCLE OPERATIONS.

==================================================
CURRENT IMPLEMENTATION
==================================================

Phase 1 already implemented:

- FastAPI application
- API versioning
- /api/v1/health
- Environment configuration
- Logging
- Exception handling
- pytest

Phase 2 already implemented:

- PostgreSQL
- SQLAlchemy
- Database engine/session
- Alembic
- Customer model
- Technician model
- ServiceCategory model
- Ticket model
- TechnicianAssignment model
- CustomerTechnicianHistory model
- Relationships
- UUID primary keys
- Timestamps
- Database constraints
- Initial migration

Before modifying anything:

1. Inspect the actual current project structure.
2. Inspect the actual model definitions.
3. Inspect existing enums.
4. Inspect the current database session dependency.
5. Inspect the current tests.
6. Do not assume field names from this prompt if the actual Phase 2 implementation differs.

Adapt to the existing code rather than unnecessarily rewriting it.

==================================================
PHASE 3 OBJECTIVE
==================================================

Build the API layer that allows us to create and inspect the core entities.

By the end of Phase 3, we should be able to use Postman to:

1. Create a customer
2. List customers
3. Get a customer
4. Create a technician
5. List technicians
6. Get a technician
7. Create a service category
8. List service categories
9. Assign service categories to technicians if required by the existing model design
10. Create a ticket
11. List tickets
12. Get a ticket
13. Update basic ticket details where appropriate
14. View ticket status
15. Perform only safe/basic ticket status operations allowed in this phase

The ticket should be created successfully but NOT automatically assigned to a technician.

==================================================
ARCHITECTURE FOR PHASE 3
==================================================

Extend the existing project with a clean structure similar to:

src/
└── smart_helpdesk/
    │
    ├── main.py
    │
    ├── core/
    │   └── ...
    │
    ├── db/
    │   └── ...
    │
    ├── schemas/
    │   ├── __init__.py
    │   ├── customer.py
    │   ├── technician.py
    │   ├── service_category.py
    │   └── ticket.py
    │
    ├── services/
    │   ├── __init__.py
    │   ├── customer_service.py
    │   ├── technician_service.py
    │   ├── service_category_service.py
    │   └── ticket_service.py
    │
    └── api/
        ├── router.py
        │
        └── routes/
            ├── health.py
            ├── customers.py
            ├── technicians.py
            ├── service_categories.py
            └── tickets.py

This is the first phase where schemas and services are appropriate.

Do not create a repository layer yet.

The application is still small enough that:

Route
  ↓
Service
  ↓
SQLAlchemy Session

is sufficient.

==================================================
SEPARATION OF RESPONSIBILITIES
==================================================

ROUTES:

Routes should handle:

- HTTP request
- Dependency injection
- Calling services
- Returning HTTP responses

Routes should NOT contain significant database logic.

--------------------------------------------------

SCHEMAS:

Pydantic schemas should handle:

- Request validation
- Request/response structure
- Type validation
- Field constraints

Schemas should NOT directly perform database operations.

--------------------------------------------------

SERVICES:

Services should handle:

- Business rules
- Database operations
- Entity lookup
- Creation/update logic
- Domain validation

Services should NOT know HTTP-specific implementation details where avoidable.

Do not pass Request objects through the entire application.

--------------------------------------------------

MODELS:

SQLAlchemy models remain persistence/domain representations.

Do not duplicate database models as API schemas.

Use separate Pydantic schemas.

==================================================
API PREFIX
==================================================

All APIs should use:

/api/v1

Expected route groups:

/api/v1/customers
/api/v1/technicians
/api/v1/categories
/api/v1/tickets

Keep the existing:

/api/v1/health

working.

==================================================
1. CUSTOMER APIs
==================================================

Implement the following.

--------------------------------------------------
CREATE CUSTOMER
--------------------------------------------------

POST /api/v1/customers

Example request:

{
    "full_name": "Siva",
    "email": "siva@example.com",
    "phone_number": "+919876543210",
    "age": 21,
    "default_location": "Tower A, Flat 302"
}

Validate:

- full_name is required
- email is valid
- phone number is required
- age is reasonable if provided/required according to the existing model
- default_location follows the existing model requirements

Do not silently accept invalid data.

Duplicate email/phone errors should return an appropriate client error.

--------------------------------------------------
LIST CUSTOMERS
--------------------------------------------------

GET /api/v1/customers

Support simple pagination if practical.

Suggested query parameters:

skip
limit

Do not overbuild advanced filtering.

--------------------------------------------------
GET CUSTOMER
--------------------------------------------------

GET /api/v1/customers/{customer_id}

Return 404 if the customer does not exist.

--------------------------------------------------
UPDATE CUSTOMER
--------------------------------------------------

PATCH /api/v1/customers/{customer_id}

Allow reasonable editable fields.

Use partial update semantics.

Do not implement destructive account management yet.

Do not implement DELETE unless there is a genuine Phase 3 reason.

Prefer soft/deactivation behavior later rather than immediately adding permanent deletion.

==================================================
2. SERVICE CATEGORY APIs
==================================================

Service categories are required before tickets can be created.

Examples:

Plumbing
Electrical
Cleaning
HVAC
Appliance

Implement:

POST /api/v1/categories

GET /api/v1/categories

GET /api/v1/categories/{category_id}

Optional if useful:

PATCH /api/v1/categories/{category_id}

Requirements:

- Category name should be unique
- Do not allow duplicate categories differing only because of trivial whitespace/casing if practical
- Respect the existing is_active field if it exists
- Inactive categories should not normally be offered for new tickets later

Do not build category prediction.

The client explicitly provides/selects the category in this phase.

==================================================
3. TECHNICIAN APIs
==================================================

Implement APIs needed to create technicians for testing and future routing.

--------------------------------------------------
CREATE TECHNICIAN
--------------------------------------------------

POST /api/v1/technicians

Example request:

{
    "full_name": "Ravi Kumar",
    "email": "ravi@example.com",
    "phone_number": "+919999999999",
    "is_on_duty": true,
    "max_workload": 5,
    "category_ids": [
        "UUID_OF_PLUMBING_CATEGORY"
    ]
}

Adapt this request to the actual Phase 2 model design.

Requirements:

- Validate referenced categories exist
- Do not assign nonexistent categories
- Initialize workload-related values correctly
- Do not calculate ratings
- Do not implement routing logic

--------------------------------------------------
LIST TECHNICIANS
--------------------------------------------------

GET /api/v1/technicians

For Phase 3, simple listing is enough.

Optional useful filters:

- is_active
- is_on_duty
- category_id

Only implement filters if clean and straightforward.

Do not implement ranking.

The list order must not pretend to be "best technician."

--------------------------------------------------
GET TECHNICIAN
--------------------------------------------------

GET /api/v1/technicians/{technician_id}

Include useful category/skill information.

--------------------------------------------------
UPDATE TECHNICIAN
--------------------------------------------------

PATCH /api/v1/technicians/{technician_id}

Allow reasonable updates such as:

- full_name
- phone_number
- is_active
- is_on_duty
- max_workload
- supported categories

Be careful not to expose fields as editable if they should be system-managed later.

For example, historical rating and completed job counts should preferably not be casually editable through a normal API.

Do not implement technician assignment endpoints yet.

==================================================
4. TICKET CREATION
==================================================

This is the most important API in Phase 3.

Implement:

POST /api/v1/tickets

The product's ticket creation form concept is:

Contact Name
Contact Phone
Brief Description
Category
Location
Preferred Time:
    - ASAP
    - Schedule for later
Attachments (future/optional)

The account/customer already exists.

The contact person may be different from the registered customer.

For example:

A customer creates the request using their account but requests help for their parents.

Therefore:

customer_id
=
Account owner/customer record

contact_name
contact_phone
=
Person/contact associated with this particular service request

==================================================
TICKET CREATE REQUEST
==================================================

The request should conceptually support:

- customer_id
- contact_name
- contact_phone
- description
- category_id
- location
- is_scheduled
- scheduled_for

Do not add priority as a customer-controlled field.

Our product decision is:

Most users want their issue resolved quickly.

Therefore:

If the customer does not schedule a future time:

is_scheduled = false
scheduled_for = null

Meaning:

ASAP

If the customer schedules:

is_scheduled = true
scheduled_for = future datetime

Validate:

1. customer exists
2. category exists
3. category is active
4. contact name is valid
5. contact phone is valid
6. description is not empty
7. description has a sensible maximum length
8. location is not empty
9. If is_scheduled is true:
   scheduled_for must be provided
10. If is_scheduled is false:
    scheduled_for should be null
11. scheduled_for must be in the future

Do not create automatic category detection.

The frontend may eventually suggest a category based on the description, but the final category submitted by the user is authoritative.

==================================================
TICKET INITIAL STATUS
==================================================

When a ticket is successfully created, initialize it with the appropriate existing status.

Prefer:

PENDING

or the closest equivalent from the Phase 2 enum.

Do not immediately set:

ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED

The routing engine does not exist yet.

The flow should currently be:

Customer
   ↓
POST /tickets
   ↓
Ticket created
   ↓
Status = PENDING
   ↓
Return created ticket

Later:

PENDING
   ↓
ROUTING
   ↓
Technician eligibility
   ↓
Ranking
   ↓
Assignment

==================================================
TICKET RESPONSE
==================================================

Return useful ticket information.

Example conceptual response:

{
    "id": "...",
    "customer_id": "...",
    "contact_name": "Siva",
    "contact_phone": "+919876543210",
    "description": "Water is clogged in my washroom",
    "category": {
        "id": "...",
        "name": "Plumbing"
    },
    "location": "Tower A, Flat 302",
    "is_scheduled": false,
    "scheduled_for": null,
    "status": "PENDING",
    "created_at": "...",
    "updated_at": "..."
}

Adapt to the existing model/schema naming conventions.

==================================================
5. TICKET READ APIs
==================================================

Implement:

GET /api/v1/tickets

Support simple filtering/pagination where useful.

Possible filters:

- customer_id
- status
- category_id

Do not implement advanced search.

Do not implement technician ranking.

--------------------------------------------------

Implement:

GET /api/v1/tickets/{ticket_id}

Return:

- ticket details
- customer information where appropriate
- category information
- assignment history if useful and already available

Be careful about circular nested responses.

Do not recursively return:

Ticket
  → Customer
     → Tickets
        → Customer
           → ...

Keep response schemas intentional.

==================================================
6. BASIC TICKET UPDATE
==================================================

Implement a controlled:

PATCH /api/v1/tickets/{ticket_id}

Allow appropriate edits before assignment, such as:

- contact_name
- contact_phone
- description
- category_id
- location
- scheduling information

Important rule:

Do not allow arbitrary edits to system-managed status.

Do not allow the client to simply send:

{
    "status": "RESOLVED"
}

and mark a ticket resolved.

Status transitions are business operations and should later have dedicated logic.

For Phase 3, ticket status should be protected from arbitrary client updates.

==================================================
7. BASIC TICKET CANCELLATION
==================================================

Consider implementing:

POST /api/v1/tickets/{ticket_id}/cancel

ONLY if the current status makes cancellation reasonable.

For Phase 3, cancellation may be allowed only while the ticket is still:

PENDING

or another pre-assignment state.

Do not physically delete the ticket.

Preserve history.

Change the ticket status to:

CANCELLED

Do not allow cancellation of already completed/resolved tickets.

If this endpoint complicates the existing enum design unnecessarily, explain and keep it out of Phase 3.

The key principle is:

Do not use DELETE for tickets.

Tickets are historical business records.

==================================================
8. BASIC TICKET STATUS ENDPOINT
==================================================

Implement:

GET /api/v1/tickets/{ticket_id}/status

This can return a small response such as:

{
    "ticket_id": "...",
    "status": "PENDING",
    "updated_at": "..."
}

This endpoint is useful for clients polling ticket status later.

Do not implement live WebSockets or real-time notifications.

==================================================
9. STATUS TRANSITION RULES
==================================================

Phase 3 must not allow arbitrary status changes.

At this stage, the allowed lifecycle should be deliberately limited.

For example:

NEW TICKET
    ↓
PENDING

PENDING
    ↓
CANCELLED

That is sufficient for now.

Do not expose a generic:

PATCH /tickets/{id}/status

endpoint where the user can submit any status.

Future phases will control transitions like:

PENDING
→ ROUTING
→ ASSIGNED
→ IN_PROGRESS
→ RESOLVED
→ AWAITING_CUSTOMER_CONFIRMATION
→ CLOSED

Those transitions depend on routing, technician actions, and feedback workflows.

==================================================
SENIOR RESIDENT PRODUCT DECISION
==================================================

The Customer model contains age.

The product may eventually give some consideration to senior residents.

However:

DO NOT implement automatic senior priority in Phase 3.

DO NOT let the client send a priority value.

DO NOT automatically manipulate routing.

This is future business logic.

For now, simply preserve the customer age data.

==================================================
ATTACHMENTS
==================================================

The product supports optional attachments such as:

- Photos
- Videos

But file storage is not part of Phase 3.

Do not implement:

- Local file uploads
- S3
- Cloudinary
- Object storage
- Video processing

Do not add an attachments API yet.

Leave this feature for a later phase.

Do not create fake attachment logic.

==================================================
SCHEDULED TICKETS
==================================================

Phase 3 only stores scheduled ticket information.

Example:

is_scheduled = true
scheduled_for = 2026-09-01T10:00:00+05:30

Do NOT:

- Start background workers
- Poll the database
- Route the ticket automatically
- Send reminders
- Use Redis
- Use Celery

The product decision for later is:

Scheduled tickets should not consume routing resources immediately.

Eligibility and ranking should be evaluated closer to the scheduled time.

That implementation belongs to Phase 5.

For now, simply validate and persist scheduling data.

==================================================
API RESPONSE AND ERROR HANDLING
==================================================

Use appropriate HTTP status codes.

Examples:

201 Created
    Successful resource creation

200 OK
    Successful read/update

404 Not Found
    Referenced resource does not exist

409 Conflict
    Duplicate unique resource where appropriate

422 Unprocessable Entity
    Validation errors handled by FastAPI/Pydantic

Do not return HTTP 200 for everything.

Reuse the global exception/error strategy from Phase 1.

Do not expose internal database exceptions directly to clients.

Translate expected database/business errors into useful API responses.

==================================================
PYDANTIC SCHEMAS
==================================================

Create separate schemas for:

Customer:
- CustomerCreate
- CustomerUpdate
- CustomerResponse

Technician:
- TechnicianCreate
- TechnicianUpdate
- TechnicianResponse

ServiceCategory:
- ServiceCategoryCreate
- ServiceCategoryUpdate if needed
- ServiceCategoryResponse

Ticket:
- TicketCreate
- TicketUpdate
- TicketResponse
- TicketStatusResponse

You may use nested response schemas where useful.

Be careful about circular references.

Use Pydantic validation rather than manually checking every basic type in services.

Use modern Pydantic/FastAPI conventions compatible with the current project.

==================================================
SERVICE LAYER
==================================================

Create focused services.

For example:

CustomerService:
- create_customer
- get_customer
- list_customers
- update_customer

TechnicianService:
- create_technician
- get_technician
- list_technicians
- update_technician

ServiceCategoryService:
- create_category
- get_category
- list_categories

TicketService:
- create_ticket
- get_ticket
- list_tickets
- update_ticket
- cancel_ticket
- get_ticket_status

Do not force a complex object-oriented design if simple functions are clearer.

The main goal is to keep business/database logic out of route files.

==================================================
DATABASE TRANSACTION RULES
==================================================

For creation/update operations:

1. Validate required references
2. Create/update ORM objects
3. Commit appropriately
4. Refresh if necessary
5. Return the resulting entity

Handle transaction failures safely.

Do not leave sessions in a broken transaction state.

Do not commit partially completed multi-step operations when atomicity is needed.

==================================================
DUPLICATE HANDLING
==================================================

Handle common uniqueness conflicts cleanly.

Examples:

- Duplicate customer email
- Duplicate customer phone number
- Duplicate technician email
- Duplicate technician phone number
- Duplicate category name

Do not return raw PostgreSQL error messages.

Return useful API-level errors.

==================================================
TESTING REQUIREMENTS
==================================================

Add meaningful tests.

Use an isolated test database strategy.

Do not run destructive tests against the normal development database.

At minimum test:

--------------------------------------------------
CUSTOMERS
--------------------------------------------------

1. Create customer successfully
2. Invalid email rejected
3. Duplicate email rejected
4. Get existing customer
5. Get nonexistent customer returns 404
6. Partial update works

--------------------------------------------------
CATEGORIES
--------------------------------------------------

1. Create category
2. Duplicate category rejected
3. List categories
4. Inactive category behavior if implemented

--------------------------------------------------
TECHNICIANS
--------------------------------------------------

1. Create technician
2. Assign valid categories
3. Reject nonexistent category
4. Get technician
5. List technicians
6. Update supported categories if supported

--------------------------------------------------
TICKETS
--------------------------------------------------

1. Create ASAP ticket successfully
2. Create scheduled ticket successfully
3. Scheduled ticket without scheduled_for rejected
4. Non-scheduled ticket with invalid scheduling data rejected
5. Past scheduled time rejected
6. Nonexistent customer rejected
7. Nonexistent category rejected
8. Inactive category rejected
9. Get ticket
10. List tickets
11. Filter by customer/status/category if implemented
12. Update ticket
13. Client cannot arbitrarily set status through update
14. Cancel pending ticket if cancellation endpoint is implemented
15. Ticket history is preserved; no DELETE endpoint

--------------------------------------------------
REGRESSION
--------------------------------------------------

Existing health endpoint tests must still pass.

Run the complete test suite.

==================================================
POSTMAN COLLECTION
==================================================

Prepare a clear manual testing sequence.

The sequence should be:

1. Health check

GET /api/v1/health


2. Create category

POST /api/v1/categories


3. Create another category if needed


4. Create customer

POST /api/v1/customers


5. Create technician

POST /api/v1/technicians


6. Get/list technician


7. Create ASAP ticket

POST /api/v1/tickets


8. Create scheduled ticket

POST /api/v1/tickets


9. Get ticket

GET /api/v1/tickets/{ticket_id}


10. Get ticket status

GET /api/v1/tickets/{ticket_id}/status


11. List/filter tickets


12. Update an allowed ticket field


13. Cancel a pending ticket if implemented

Give sample request bodies using placeholders for generated UUIDs.

Do not hardcode actual UUIDs.

==================================================
WHAT NOT TO IMPLEMENT
==================================================

STRICTLY DO NOT IMPLEMENT:

- Authentication
- JWT
- OAuth
- Login
- Signup
- Passwords
- Roles
- Authorization
- ML
- AI category prediction
- NLP classification
- Technician eligibility algorithm
- Technician ranking
- Scoring
- ETA calculation
- Distance calculation
- Automatic assignment
- Assignment offers
- Technician accept endpoint
- Technician decline endpoint
- Assignment expiration
- Timeout workers
- Fallback routing
- Redis
- Celery
- Background workers
- Notifications
- Email
- SMS
- Push notifications
- Customer feedback
- Technician rating calculation
- Reopen workflow
- Attachments
- File uploads
- Docker

Do not add placeholder implementations for these.

Do not create empty future modules.

==================================================
IMPLEMENTATION ORDER
==================================================

Follow this exact order:

STEP 1:
Inspect current project and Phase 2 models.

STEP 2:
Explain the Phase 3 architecture and changes.

STEP 3:
Create the schemas package.

STEP 4:
Implement customer schemas.

STEP 5:
Implement service category schemas.

STEP 6:
Implement technician schemas.

STEP 7:
Implement ticket schemas and scheduling validation.

STEP 8:
Create customer service.

STEP 9:
Create category service.

STEP 10:
Create technician service.

STEP 11:
Create ticket service.

STEP 12:
Create customer routes.

STEP 13:
Create category routes.

STEP 14:
Create technician routes.

STEP 15:
Create ticket routes.

STEP 16:
Register all routes in the central API router.

STEP 17:
Handle expected conflicts/errors cleanly.

STEP 18:
Create/update tests.

STEP 19:
Run database migrations only if schema changes were genuinely required.

Do not create unnecessary migrations if Phase 2 models already contain everything needed.

STEP 20:
Run the complete test suite.

STEP 21:
Run the application.

STEP 22:
Manually verify all endpoints using FastAPI docs/Postman.

STEP 23:
Show final project structure.

==================================================
ACCEPTANCE CRITERIA
==================================================

Phase 3 is complete only when:

1. GET /api/v1/health works.

2. Customers can be created.

3. Customers can be listed and retrieved.

4. Categories can be created and listed.

5. Technicians can be created.

6. Technicians can be associated with valid service categories.

7. Tickets can be created.

8. ASAP tickets store:

is_scheduled = false
scheduled_for = null

9. Scheduled tickets store a valid future datetime.

10. Invalid scheduled ticket combinations are rejected.

11. Tickets start in a valid initial status.

12. Tickets can be retrieved and listed.

13. Basic ticket filtering works if implemented.

14. Allowed ticket details can be updated.

15. Ticket status cannot be arbitrarily manipulated by the client.

16. Tickets are not physically deleted.

17. No automatic routing happens.

18. No technician is automatically assigned.

19. No ML/AI functionality exists.

20. Tests pass.

21. Existing Phase 1 and Phase 2 functionality still works.

==================================================
FINAL EXPLANATION REQUIRED
==================================================

After implementation, explain:

1. Why we introduced Pydantic schemas
2. Difference between SQLAlchemy models and Pydantic schemas
3. Why routes should stay thin
4. Why services were introduced now
5. The complete flow of creating a ticket:

Postman
   ↓
Ticket Route
   ↓
TicketCreate validation
   ↓
Ticket Service
   ↓
Database Session
   ↓
SQLAlchemy Ticket Model
   ↓
PostgreSQL
   ↓
TicketResponse
   ↓
Postman

6. Why ticket contact information is separate from customer account information
7. Why customers cannot directly control ticket priority
8. Why arbitrary status updates are dangerous
9. Why scheduled tickets are only stored now and not processed yet
10. How to run the application
11. How to run tests
12. Complete Postman testing sequence
13. Final folder structure

Do not begin Phase 4.

Stop after Phase 3 is fully implemented and tested.

im expecting this after phase 3
PENDING Ticket
      ↓
Find technicians with Plumbing skill
      ↓
Remove unavailable technicians
      ↓
Remove overloaded technicians
      ↓
Check customer-technician history
      ↓
Calculate deterministic scores
      ↓
Rank candidates
      ↓
Return best technician
