I am building an internship project called Smart-HelpDesk.

You are helping me implement the backend professionally, but this is a learning project. Do not blindly generate a huge application. Follow the requirements exactly, explain the architecture and every significant file you create, and keep the implementation limited strictly to Phase 1.

==================================================
PROJECT OVERVIEW
==================================================

Smart-HelpDesk is an intelligent residential helpdesk and service-ticket routing system.

The core problem:

In a residential community, a resident raises a maintenance/service request such as plumbing, electrical, appliance, cleaning, etc.

Traditional helpdesk systems may route the ticket through a hierarchy or require manual assignment. This can cause delays and unresolved issues.

Our system will eventually automatically find and assign the most suitable technician directly.

Future routing factors may include:

- Technician active/on-duty status
- Technician skills/category specialization
- Current workload
- Availability
- Distance or ETA
- Overall customer rating
- Reopen rate
- Previous positive experience between this customer and technician
- Previous negative experience between this customer and technician
- Customer feedback history

The final system will also support:

- Ticket creation
- Smart category suggestion from issue description
- Technician eligibility filtering
- Technician ranking
- Assignment
- Accept/decline
- Assignment timeout
- Fallback to another technician
- Scheduled tickets
- Resolution workflow
- Customer confirmation
- Customer feedback
- Technician ratings and history
- Future ML experimentation based on collected historical data

IMPORTANT:

DO NOT implement these future features in Phase 1.

Phase 1 is only the backend foundation.

==================================================
CURRENT PROJECT STATE
==================================================

The project already exists.

Project root:

smart-helpdesk/

Current structure is approximately:

smart-helpdesk/
│
├── .git/
├── .venv/
├── src/
│   └── smart_helpdesk/
│       ├── __init__.py
│       ├── main.py
│       │
│       └── api/
│           ├── __init__.py
│           │
│           └── routes/
│               ├── __init__.py
│               └── health.py
│
├── .python-version
├── pyproject.toml
├── uv.lock
└── README.md

The project uses:

- Python
- uv for dependency and project management
- FastAPI
- Uvicorn

Do not replace uv with pip, requirements.txt, poetry, or another package manager.

Use the existing src-layout.

==================================================
PHASE 1 OBJECTIVE
==================================================

Implement a clean FastAPI backend foundation.

By the end of Phase 1, the application should:

1. Start successfully using uv/Uvicorn
2. Have a clean application entry point
3. Have API versioning foundation
4. Have a GET /health endpoint
5. Have centralized configuration/settings
6. Load configuration from environment variables
7. Have a .env.example file
8. Have basic structured logging
9. Have basic global exception handling
10. Have a consistent application response for unexpected server errors
11. Have pytest configured
12. Have tests for the health endpoint
13. Be simple and clean enough for future phases
14. Not contain unnecessary future architecture

==================================================
ARCHITECTURE REQUIREMENTS
==================================================

Use this structure as the target for Phase 1:

src/
└── smart_helpdesk/
    │
    ├── __init__.py
    ├── main.py
    │
    ├── core/
    │   ├── __init__.py
    │   ├── config.py
    │   ├── logging.py
    │   └── exceptions.py
    │
    └── api/
        ├── __init__.py
        │
        ├── router.py
        │
        └── routes/
            ├── __init__.py
            └── health.py

Also create:

tests/
├── __init__.py
└── test_health.py

Project root:

.env.example

Do not create unnecessary directories such as:

- models
- schemas
- services
- repositories
- database
- auth
- tickets
- technicians
- routing

Those belong to future phases.

==================================================
FILE RESPONSIBILITIES
==================================================

main.py:

Responsible for:

- Creating the FastAPI application
- Loading application configuration
- Configuring logging
- Registering the main API router
- Registering exception handlers
- Defining basic application metadata

main.py should remain small.

Do not place endpoint logic directly in main.py.

--------------------------------------------------

core/config.py:

Responsible for application settings.

Use environment-based configuration.

At minimum support:

- APP_NAME
- APP_VERSION
- APP_ENVIRONMENT
- DEBUG

Use an appropriate modern FastAPI/Python settings approach.

Do not hardcode environment-specific configuration inside the application.

--------------------------------------------------

core/logging.py:

Responsible for application logging configuration.

Keep it simple.

At minimum:

- Configure a logger
- Use a readable format
- Allow log level to depend on configuration if appropriate

Do not build an enterprise observability platform.

--------------------------------------------------

core/exceptions.py:

Responsible for application-level exception handling.

For Phase 1:

- Add a basic handler for unexpected/unhandled exceptions
- Return a safe JSON error response
- Do not expose stack traces or internal implementation details to API clients

A suitable error shape can be:

{
    "detail": "Internal server error"
}

or another simple consistent format.

Do not overengineer custom error hierarchies yet.

--------------------------------------------------

api/router.py:

Responsible for combining API route modules.

This is where individual routers should be included.

The main application should include this router.

--------------------------------------------------

api/routes/health.py:

Responsible only for health-related endpoints.

Implement:

GET /health

The endpoint should return HTTP 200.

Suggested response:

{
    "status": "healthy"
}

Do not add database checks yet because the database does not exist in Phase 1.

==================================================
API VERSIONING
==================================================

Prepare the project for API versioning.

The health endpoint should preferably be available under:

/api/v1/health

You may also decide whether to expose an unversioned health endpoint separately, but do not create duplicate functionality unless there is a clear reason.

The preferred Phase 1 API structure is:

/api/v1/health

Future endpoints will follow:

/api/v1/tickets
/api/v1/technicians
/api/v1/auth

Keep the implementation simple.

==================================================
DEPENDENCIES
==================================================

Inspect the current pyproject.toml first.

Only add dependencies that are genuinely required for Phase 1.

Likely required additions may include:

- pydantic-settings
- pytest
- httpx

Use uv commands to add dependencies.

For example, do not manually edit dependency versions unless there is a good reason.

Use:

uv add ...

or the appropriate uv command for development dependencies.

Do not add:

- PostgreSQL drivers
- SQLAlchemy
- Alembic
- Redis
- JWT libraries
- OAuth libraries
- ML libraries
- Celery
- Docker-related Python libraries

Those are not needed in Phase 1.

==================================================
ENVIRONMENT CONFIGURATION
==================================================

Create a .env.example file.

It should contain example values only.

For example:

APP_NAME=Smart-HelpDesk
APP_VERSION=0.1.0
APP_ENVIRONMENT=development
DEBUG=true

Do not commit actual secrets.

Even though Phase 1 has no secrets yet, establish the correct pattern now.

If a local .env file is needed for development, make sure it is ignored by Git.

Check the existing .gitignore and update it if necessary.

Do not ignore .env.example.

==================================================
LOGGING REQUIREMENTS
==================================================

Add basic logging.

When the application starts, log useful information such as:

- Application name
- Environment
- Startup information

Do not log sensitive values.

Keep logging simple.

Do not add distributed tracing, OpenTelemetry, Grafana, ELK, or external logging services.

==================================================
ERROR HANDLING REQUIREMENTS
==================================================

Add basic application-wide handling for unexpected errors.

Requirements:

- Log the actual exception internally
- Return a safe response to the client
- Do not expose stack traces in production responses
- Preserve normal FastAPI validation errors
- Do not unnecessarily override standard FastAPI behavior

Do not create a large custom exception framework.

==================================================
TESTING REQUIREMENTS
==================================================

Set up pytest.

Create:

tests/test_health.py

Test at least:

1. GET /api/v1/health returns HTTP 200
2. Response body contains:

{
    "status": "healthy"
}

Use FastAPI's testing approach.

Tests should run successfully through uv.

Document the test command.

Expected command should be something similar to:

uv run pytest

Do not test future functionality that does not exist.

==================================================
RUNNING THE APPLICATION
==================================================

Make sure the application can be started with a clear command.

Prefer a development command similar to:

uv run uvicorn smart_helpdesk.main:app --reload

Because this project uses a src layout, ensure the command/import configuration actually works.

Do not assume it works without testing.

==================================================
API DOCUMENTATION
==================================================

FastAPI provides automatic API documentation.

After starting the application, these should be available:

/docs

and possibly:

/openapi.json

Do not manually build Swagger UI.

Use FastAPI's built-in documentation.

==================================================
WHAT NOT TO IMPLEMENT IN PHASE 1
==================================================

STRICTLY DO NOT IMPLEMENT:

- Database
- PostgreSQL
- SQLAlchemy
- Alembic
- User models
- Customer models
- Technician models
- Ticket models
- Authentication
- JWT
- OAuth
- Login
- Signup
- Ticket creation
- Ticket category prediction
- AI/ML
- Smart routing
- Technician ranking
- Workload calculation
- ETA calculation
- Assignment
- Accept/decline workflow
- Fallback logic
- Scheduled ticket logic
- Feedback system
- Ratings
- Redis
- Docker

Do not create placeholder implementations for these.

Do not create empty modules for future features unless specifically necessary.

We are building incrementally.

==================================================
CODE QUALITY RULES
==================================================

Follow these principles:

1. Keep main.py small
2. Keep each module focused on one responsibility
3. Use clear names
4. Use type hints where appropriate
5. Avoid unnecessary abstraction
6. Avoid unnecessary design patterns
7. Do not create generic base classes
8. Do not create repository/service layers yet
9. Do not overengineer Phase 1
10. Keep imports clean
11. Follow standard Python/FastAPI conventions

This is an internship project, but I want professional-quality fundamentals without fake enterprise complexity.

==================================================
IMPLEMENTATION PROCESS
==================================================

Work in this order:

STEP 1:
Inspect the current project structure and pyproject.toml.

STEP 2:
Explain what changes are needed and why.

STEP 3:
Add only the required Phase 1 dependencies using uv.

STEP 4:
Create the core directory and required files.

STEP 5:
Implement configuration.

STEP 6:
Implement logging.

STEP 7:
Implement exception handling.

STEP 8:
Implement the health router.

STEP 9:
Implement the central API router.

STEP 10:
Connect everything through main.py.

STEP 11:
Create .env.example.

STEP 12:
Check/update .gitignore if necessary.

STEP 13:
Create pytest configuration if needed.

STEP 14:
Create health endpoint tests.

STEP 15:
Run the application.

STEP 16:
Run the tests.

STEP 17:
Show the final project structure.

==================================================
IMPORTANT AI ASSISTANT BEHAVIOR
==================================================

Before making major changes:

- Inspect existing files
- Do not overwrite working project configuration unnecessarily
- Do not delete existing files unless absolutely necessary
- Explain changes before making them

After implementation:

Explain:

1. Every file that was created
2. Every important file that was modified
3. How the request flows from:
   
   Browser/Postman
       ↓
   Uvicorn
       ↓
   FastAPI app
       ↓
   API router
       ↓
   Health router
       ↓
   Response

4. How configuration is loaded
5. How logging works
6. How exception handling works
7. How tests work
8. How to run the application
9. How to run tests
10. What should be manually tested in Postman

==================================================
PHASE 1 ACCEPTANCE CRITERIA
==================================================

Phase 1 is complete only when all of these work:

1.

uv run uvicorn smart_helpdesk.main:app --reload

starts the application successfully.

2.

GET /api/v1/health

returns HTTP 200.

3. Response contains:

{
    "status": "healthy"
}

4.

uv run pytest

passes successfully.

5. FastAPI docs are accessible at:

/docs

6. Configuration comes from environment variables.

7. Actual .env files are not committed to Git.

8. Code is modular but not overengineered.

9. No Phase 2+ functionality has been implemented.

==================================================
FINAL OUTPUT
==================================================

At the end, give me:

1. Final folder structure
2. List of dependencies added
3. Commands used
4. How to run the backend
5. How to run tests
6. How to test in Postman
7. Explanation of every file
8. Any decisions made that differ from the requested structure, with reasons

Do not begin implementing Phase 2.
Do not add database code.
Stop after Phase 1 is completely working.

what im expectin after phase1
                    ┌──────────────┐
                    │   Postman    │
                    │   Browser    │
                    └──────┬───────┘
                           │
                     GET /api/v1/health
                           │
                           ▼
                    ┌──────────────┐
                    │   Uvicorn    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   main.py    │
                    │ FastAPI app  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ api/router.py│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  health.py   │
                    └──────┬───────┘
                           │
                           ▼
                 {"status": "healthy"}


