# Phase 1 Testing & Verification Guide: Smart-HelpDesk Backend

This document is a practical, step-by-step guide on **how** and **what** to test to manually and automatically verify that Phase 1 is functioning correctly.

---

## 1. Quick Automated Test Run (Recommended First Step)

Run the full automated test suite to verify health endpoints, documentation schemas, error handling, and 404 routing.

### Command
Open a terminal in the `backend/` directory and run:

```powershell
uv run pytest -v
```

### Expected Output
```
============================= test session starts =============================
platform win32 -- Python 3.13.x, pytest-9.1.1, pluggy-1.6.0
rootdir: ...\smart-helpdesk\backend
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.14.2
collected 4 items

tests/test_health.py::test_health_check_returns_200_and_healthy PASSED   [ 25%]
tests/test_health.py::test_docs_endpoints PASSED                         [ 50%]
tests/test_health.py::test_unhandled_exception_returns_safe_500 PASSED   [ 75%]
tests/test_health.py::test_not_found_route PASSED                        [100%]

======================== 4 passed, 1 warning in 0.35s =========================
```

---

## 2. Starting the Backend Server

Start the local development server with auto-reload enabled:

### Command
From the `backend/` directory:

```powershell
uv run python -m uvicorn smart_helpdesk.main:app --reload
```

### What to check in Terminal Logs:
1. You should see a clean structured log on startup:
   ```text
   INFO:     Started server process [...]
   INFO:     Waiting for application startup.
   [2026-08-22 14:00:00] [INFO] [smart_helpdesk]: Starting Smart-HelpDesk v0.1.0 in development environment (Debug: True)
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   ```

---

## 3. What to Test in Postman / Browser / Curl

Once the server is running on `http://127.0.0.1:8000`, perform the following tests:

### Test 1: Health Check Endpoint (Core Requirement)
- **Method**: `GET`
- **URL**: `http://127.0.0.1:8000/api/v1/health`
- **Expected Status Code**: `200 OK`
- **Expected Response Body**:
  ```json
  {
    "status": "healthy"
  }
  ```
- **PowerShell / Terminal Quick Test**:
  ```powershell
  curl.exe -s http://127.0.0.1:8000/api/v1/health
  ```

---

### Test 2: Swagger Interactive API Documentation
- **Method**: `GET`
- **URL**: `http://127.0.0.1:8000/docs`
- **How to test**: Open this URL in any web browser (Chrome, Edge, etc.).
- **What to verify**:
  - The Swagger UI interface loads.
  - Page title displays `Smart-HelpDesk`.
  - Under the `health` tag, there is a `GET /api/v1/health` endpoint.
  - Click **"Try it out"** -> **"Execute"** -> verify response code `200` and body `{"status": "healthy"}`.

---

### Test 3: OpenAPI Schema Specification
- **Method**: `GET`
- **URL**: `http://127.0.0.1:8000/openapi.json`
- **Expected Status Code**: `200 OK`
- **What to verify**:
  - The response is valid JSON.
  - `"info": {"title": "Smart-HelpDesk", "version": "0.1.0"}`
  - `"paths"` contains `"/api/v1/health"`.

---

### Test 4: ReDoc Documentation
- **Method**: `GET`
- **URL**: `http://127.0.0.1:8000/redoc`
- **How to test**: Open in browser.
- **What to verify**: Clean ReDoc documentation page renders with the `Smart-HelpDesk` API specification.

---

### Test 5: Route Not Found (404 Handling)
- **Method**: `GET`
- **URL**: `http://127.0.0.1:8000/api/v1/nonexistent-route`
- **Expected Status Code**: `404 Not Found`
- **Expected Response Body**:
  ```json
  {
    "detail": "Not Found"
  }
  ```

---

## 4. Testing Configuration & Environment Variables

Verify that the application dynamically loads settings from environment variables without code modification.

### Step-by-Step Test:
1. In `backend/`, copy `.env.example` to a new `.env` file:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `backend/.env` and edit the values, for example:
   ```env
   APP_NAME="Smart-HelpDesk-Custom"
   APP_VERSION="1.0.0"
   APP_ENVIRONMENT="staging"
   DEBUG=false
   API_V1_PREFIX="/api/v1"
   ```
3. Restart the server:
   ```powershell
   uv run python -m uvicorn smart_helpdesk.main:app --reload
   ```
4. Observe the startup log:
   ```text
   [smart_helpdesk]: Starting Smart-HelpDesk-Custom v1.0.0 in staging environment (Debug: False)
   ```
5. Check `http://127.0.0.1:8000/openapi.json` in browser/Postman:
   - Notice the `"title"` is now `"Smart-HelpDesk-Custom"` and `"version"` is `"1.0.0"`.
6. Clean up: Delete or revert `backend/.env` after testing if desired.

---

## 5. Summary Checklist for Verification

| Item | What to Check | Passed? |
|---|---|:---:|
| 1 | `uv run pytest` runs and passes all 4 tests | [ ] |
| 2 | `uv run python -m uvicorn smart_helpdesk.main:app --reload` starts server | [ ] |
| 3 | `GET /api/v1/health` returns `200 OK` with `{"status": "healthy"}` | [ ] |
| 4 | `GET /docs` opens interactive Swagger UI | [ ] |
| 5 | `GET /openapi.json` returns valid schema with title & `/api/v1/health` | [ ] |
| 6 | Unhandled errors return safe `{"detail": "Internal server error"}` (verified in pytest) | [ ] |
| 7 | `.env` variables override defaults dynamically | [ ] |
| 8 | `.env` is ignored by git (check with `git status`) | [ ] |
