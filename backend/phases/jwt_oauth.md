# Smart-HelpDesk Backend — Authentication & Authorization Specification (JWT & OAuth2)

## 1. Executive Overview

This document specifies the complete authentication and authorization architecture for **Smart-HelpDesk**. It adds secure, production-ready identity management, password hashing, JWT access and refresh tokens, role-based access control (RBAC), and Google OAuth2 integration on top of the completed Phase 1–6 backend architecture.

---

## 2. Core Security Principles & Rules

1. **Non-Breaking Integration**:
   - Zero modifications to existing domain routing, scoring, lifecycle transitions, feedback, or technician assignment engines.
   - Existing API routes preserve their parameter names and contracts while integrating security dependencies.
2. **Strict Cryptography & Secure Storage**:
   - Passwords hashed with `bcrypt` (work factor 12) with unique salts. Raw passwords never logged or persisted.
   - JWT tokens signed with `HMAC-SHA256` using secure `JWT_SECRET_KEY` loaded from environment variables.
3. **Dual Token Strategy (Access & Refresh)**:
   - **Access Token**: Short-lived (30 minutes) for authenticating HTTP requests via `Authorization: Bearer <token>`.
   - **Refresh Token**: Long-lived (7 days) with `type: "refresh"` claim, used to obtain fresh access tokens without re-entering credentials.
4. **Clean Entity Association**:
   - `User` model represents authentication credentials and global role.
   - `User` connects to existing domain entities via nullable foreign keys `customer_id` and `technician_id`, preventing duplication of customer addresses or technician skill records.

---

## 3. User Roles & Permission Matrix

### User Roles (`UserRole` Enum)
- `ADMIN`: Platform administrator with full access across all operations, user management, and system configuration.
- `DISPATCHER`: Operations coordinator who monitors routing queues, triggers assignment dispatch, and runs timeout scanners.
- `TECHNICIAN`: Field specialist who receives assignment offers, accepts/declines/defers jobs, marks on-site arrival, starts work, and submits work completion notes.
- `CUSTOMER`: Resident who submits maintenance requests, monitors ticket progress, and provides two-click resolution confirmation and ratings.

### Role Authorization Matrix

| Endpoint Group | Description | Allowed Roles |
|---|---|---|
| `/auth/register` | Resident / User Registration | Public |
| `/auth/login` | Email/Password Login | Public |
| `/auth/refresh` | Exchange Refresh Token | Public |
| `/auth/oauth/google/*` | Google OAuth2 Flow | Public |
| `/auth/me` | Current Authenticated User Profile | All Authenticated Users |
| `/categories` (Write) | Create / Update Service Categories | `ADMIN`, `DISPATCHER` |
| `/technicians` (Write) | Create / Update Technicians | `ADMIN`, `DISPATCHER` |
| `/tickets` (Create) | Submit Service Request | `CUSTOMER`, `ADMIN`, `DISPATCHER` |
| `/tickets/{id}/assign` | Dispatch Assignment Offer | `ADMIN`, `DISPATCHER` |
| `/tickets/{id}/routing-preview` | Evaluate Routing Scores | `ADMIN`, `DISPATCHER` |
| `/assignments/process-expired` | Run Batch Timeout Scanner | `ADMIN`, `DISPATCHER` |
| `/assignments/{id}/accept` | Accept Offer | `TECHNICIAN` (Assigned), `ADMIN` |
| `/assignments/{id}/decline` | Decline Offer | `TECHNICIAN` (Assigned), `ADMIN` |
| `/assignments/{id}/ask-later` | Defer Offer | `TECHNICIAN` (Assigned), `ADMIN` |
| `/tickets/{id}/arrive` | Mark On-Site Arrival | `TECHNICIAN` (Assigned), `ADMIN` |
| `/tickets/{id}/start-work` | Start Service Work | `TECHNICIAN` (Assigned), `ADMIN` |
| `/tickets/{id}/complete-work` | Complete Service Work | `TECHNICIAN` (Assigned), `ADMIN` |
| `/tickets/{id}/customer-response` | Resolution Verification & Rating | `CUSTOMER` (Owner), `ADMIN` |

---

## 4. Database Schema & Models

### `users` Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider VARCHAR(50) NULL,
    oauth_id VARCHAR(255) NULL,
    customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
    technician_id UUID NULL REFERENCES technicians(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_users_customer_id ON users(customer_id);
CREATE INDEX ix_users_technician_id ON users(technician_id);
```

---

## 5. API Endpoints Specification

### 1. Register Resident / User
- **Method**: `POST /api/v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "siva@example.com",
    "password": "SecurePassword123!",
    "full_name": "Siva Prava",
    "phone_number": "+919876543210",
    "default_location": "Tower A, Apt 402"
  }
  ```
- **Response**: `201 Created` $\rightarrow$ `UserResponse` with linked customer profile.

### 2. User Login
- **Method**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "siva@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "uuid",
      "email": "siva@example.com",
      "role": "CUSTOMER",
      "is_active": true,
      "customer_id": "uuid",
      "technician_id": null
    }
  }
  ```

### 3. Refresh Token
- **Method**: `POST /api/v1/auth/refresh`
- **Request Body**: `{"refresh_token": "eyJhbGciOi..."}`
- **Response**: `200 OK` $\rightarrow$ Fresh `TokenResponse`.

### 4. Current Authenticated User Profile
- **Method**: `GET /api/v1/auth/me`
- **Header**: `Authorization: Bearer <access_token>`
- **Response**: `200 OK` $\rightarrow$ `UserResponse`.

### 5. Logout
- **Method**: `POST /api/v1/auth/logout`
- **Header**: `Authorization: Bearer <access_token>`
- **Response**: `200 OK` $\rightarrow$ `{"message": "Logged out successfully"}`.

### 6. Google OAuth2 Integration
- **Method**: `GET /api/v1/auth/oauth/google/url`
  - Returns Google OAuth authorization consent URL.
- **Method**: `POST /api/v1/auth/oauth/google/callback`
  - Body: `{"code": "auth_code"}` or `{"credential": "google_id_token"}`
  - Exchanges token, verifies Google user info, creates or links `User`, and returns `TokenResponse`.

---

## 6. Configuration & Environment Variables

```env
# JWT Settings
JWT_SECRET_KEY=smart-helpdesk-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth2 (Optional / Production)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```
