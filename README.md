# Insighta Labs+ Backend Core
A secure, real-time, high-performance RESTful application built with **Node.js**, **Express**, and **MySQL**. This service functions as an enrichment engine and the central source of truth for the Insighta Labs+ ecosystem, serving both the **Web Portal** and the **CLI Tool**.

## System Architecture
The system follows a **Modular Monolith** pattern with a clear separation of concerns:
* **Controller Layer**: Handles HTTP requests and responses.
* **Service Layer**: Contains business logic, PKCE validation, and External API orchestration.
* **Model Layer**: Manages MySQL interactions with advanced pagination logic.
* **Middleware**: Enforces security (JWT/PKCE), Role-Based Access Control (RBAC), API Versioning, and Rate Limiting.
* **Caching/Store (Redis)**: Manages Refresh Token Rotation (blacklisting) and PKCE challenge storage.

## Authentication Flow
Insighta Labs+ implements **GitHub OAuth 2.0 with PKCE (Proof Key for Code Exchange)** to support both browser-based and headless (CLI) environments.

### The CLI / Web Handshake
1.  **Initiation**: The CLI generates a `code_verifier` and a `code_challenge`.
2.  **Authorization**: The user is redirected to the `/auth/github` endpoint.
3.  **Validation**: GitHub redirects back to the callback. The backend validates the `state` and (for CLI) the `code_verifier`.
4.  **Token Issuance**: The backend issues a JWT pair:
    * **Access Token**: 3-minute expiry (short-lived).
    * **Refresh Token**: 5-minute expiry.

### Token Handling Approach
* **Web Portal**: Tokens are delivered via **HTTP-only, Secure, SameSite: Strict** cookies to prevent XSS and CSRF attacks.
* **CLI**: Tokens are delivered in the JSON response and stored locally at `~/.insighta/credentials.json`.
* **Rotation**: Every time a Refresh Token is used, it is immediately **blacklisted in Redis** for its remaining TTL, and a new pair is issued. This prevents replay attacks.

## Role Enforcement Logic
The system implements strict **RBAC (Role-Based Access Control)** via middleware:
* **`analyst` (Default)**: Has Read-Only access. Can query, search, and export profiles.
* **`admin`**: Has Full access. Only admins can trigger `POST /api/profiles` (External API enrichment) and `DELETE` records.
* **Implementation**: A higher-order function `authorize('admin')` wraps protected routes, checking the `role` claim inside the decoded JWT.

## Natural Language Parsing Approach
Our system uses a **Rule-Based Deterministic Parsing Engine** to convert plain English into structured SQL filters.

* **Gender**: Maps "males"/"females" to `gender`.
* **Age Groups**: Detects "child", "teenager", "adult", "senior".
* **"Young" Keyword**: Strictly interpreted as ages **16–24** per project requirements.
* **Operators**: Detects "above [number]" or "below [number]" to set `min_age` or `max_age`.
* **Geography**: Maps country names (e.g., "Nigeria") to ISO codes (NG) via an internal dictionary.

## Features
### API Versioning
All profile endpoints strictly require the `X-API-Version: 1` header. Requests without this header return a **400 Bad Request**.

### Persistence & Reliability
* **Idempotency**: Returns existing records for duplicate names to save API credits.
* **UUID v7**: Uses time-sortable UUIDs for efficient database indexing and sorting.
* **CSV Export**: Supports filtered data export in the exact format required by the lab.

### Rate Limiting & Logging
* **Auth**: Limited to 10 requests/minute.
* **API**: Limited to 60 requests/minute per authenticated user.
* **Logging**: All requests are logged with Method, Path, Status Code, and Latency.

## Tech Stack
* **Runtime**: Node.js (ES6 Modules)
* **Framework**: Express.js
* **Database**: MySQL 8.0+
* **Cache**: Redis (Token Blacklisting/PKCE)
* **Security**: Passport.js, JWT, PKCE, bcrypt

## Installation & Setup

### 1. Database Setup
Run the `schema.sql` script in your MySQL instance to generate the `profiles` and `users` tables.

### 2. Environment Variables (`.env`)
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=insighta_db

REDIS_URL=redis://localhost:6379

GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 3. Run Application
```bash
npm install
npm run seed  # Populates 2026 profiles
npm run dev
```

---

## API Documentation

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/auth/github` | Public | Initiates GitHub OAuth flow |
| **POST** | `/auth/refresh` | Public | Rotates Access/Refresh tokens |
| **GET** | `/api/profiles` | All | Paginated list with 7+ filters |
| **GET** | `/api/profiles/search`| All | Natural Language Search |
| **GET** | `/api/profiles/export`| All | Download filtered CSV |
| **POST** | `/api/profiles` | Admin | Create/Enrich new profile |
| **DELETE**| `/api/profiles/:id` | Admin | Remove a profile |

---

## CLI Usage
The CLI tool (in the `insighta-cli` repo) interacts with this backend:
* `insighta login`: Initiates the PKCE flow.
* `insighta profiles list --gender female`: Fetches filtered data.
* `insighta profiles search "young males from nigeria"`: Uses NL parsing.
* `insighta profiles export --format csv`: Downloads data to current directory.

## CI/CD
GitHub Actions are configured to run on every Pull Request to `main`:
1.  **Linting**: Ensures code style consistency.
2.  **Build Check**: Verifies that dependencies install and the app initializes.
3.  **Tests**: Executes unit and integration test suites.