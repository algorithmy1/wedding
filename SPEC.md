# Wedding App -- Specification

## 1. Overview

A wedding management web application that provides:

- A **public-facing website** where guests RSVP and view the event timeline
- An **admin dashboard** where the couple manages guests, events, and tracks RSVP statistics

The application supports three languages: French (default), English, and Arabic.

**Production URL:** https://wedding.terrab.me

---

## 2. Actors

| Actor | Description | Access |
|-------|-------------|--------|
| **Guest** | Wedding invitee with a unique RSVP code | Public pages only (no login) |
| **Admin** | The couple (or their delegate) managing the wedding | Authenticated via JWT |
| **Flux CD** | GitOps agent that auto-deploys from the deployment repo | Infrastructure only |

---

## 3. Functional Requirements

### 3.1 RSVP System (Public)

| ID | Requirement |
|----|-------------|
| RSVP-1 | Each guest receives a unique 8-character alphanumeric RSVP code (auto-generated, uppercase) |
| RSVP-2 | Guests look up their invitation by entering their RSVP code at `/rsvp` |
| RSVP-3 | After lookup, the guest sees their name, current status, and a response form |
| RSVP-4 | Guest can accept ("Joyfully Accept") or decline ("Respectfully Decline") |
| RSVP-5 | If `plus_one_allowed`, guest can provide a plus-one name and confirm their attendance |
| RSVP-6 | Guest can submit dietary restrictions (free text) |
| RSVP-7 | Guest can leave a personal message for the couple |
| RSVP-8 | On submission, `responded_at` timestamp is recorded |
| RSVP-9 | Guest can revisit `/rsvp/{code}` (direct link) to update their response |
| RSVP-10 | RSVP code lookup is case-insensitive (uppercased server-side) |

### 3.2 Event Timeline (Public)

| ID | Requirement |
|----|-------------|
| TL-1 | Public `/timeline` page displays all visible events ordered by `sort_order` then `start_time` |
| TL-2 | Each event shows title, description, location, icon (emoji), and start/end times |
| TL-3 | Content is displayed in the user's selected language (FR/EN/AR) |
| TL-4 | Events with `is_visible = false` are hidden from the public timeline |

### 3.3 Admin Authentication

| ID | Requirement |
|----|-------------|
| AUTH-1 | Admin logs in with email + password at `/login` |
| AUTH-2 | Successful login returns a JWT (HS256, 7-day expiry) + user object |
| AUTH-3 | JWT contains `sub` (user UUID), `exp`, and `iat` claims |
| AUTH-4 | Token is stored in `localStorage` on the frontend |
| AUTH-5 | All admin API requests include `Authorization: Bearer <token>` header |
| AUTH-6 | `GET /api/auth/me` validates the token and returns current user info |
| AUTH-7 | New admin accounts can be created via `POST /api/auth/register` (email must be unique) |
| AUTH-8 | Passwords are hashed with bcrypt before storage |
| AUTH-9 | Invalid credentials return 401 with "Invalid email or password" |

### 3.4 Guest Management (Admin)

| ID | Requirement |
|----|-------------|
| GM-1 | Admin can list all guests, sorted by last name then first name |
| GM-2 | List supports search (first name, last name, email -- case-insensitive ILIKE) |
| GM-3 | List supports filtering by `rsvp_status` and `group_name` |
| GM-4 | Admin can create a guest (required: `first_name`, `last_name`; optional: email, phone, group, plus-one permission, dietary, language, table number, notes) |
| GM-5 | On creation, an RSVP code is auto-generated |
| GM-6 | Admin can update any guest field via PATCH (partial update, `exclude_unset`) |
| GM-7 | Admin can delete a guest (hard delete, 204 No Content) |
| GM-8 | Admin can view RSVP statistics: total guests, attending, not attending, pending, plus ones, total attending (guests + plus ones) |

### 3.5 Event Management (Admin)

| ID | Requirement |
|----|-------------|
| EM-1 | Admin can list all events (including hidden ones) via `/api/events/all` |
| EM-2 | Admin can create an event (required: `title_fr`, `title_en`, `start_time`; optional: title_ar, descriptions FR/EN/AR, location, icon, end_time, sort_order, is_visible) |
| EM-3 | Admin can update any event field via PATCH |
| EM-4 | Admin can delete an event (hard delete, 204 No Content) |
| EM-5 | Admin can toggle `is_visible` to show/hide events from the public timeline |

### 3.6 Internationalization

| ID | Requirement |
|----|-------------|
| I18N-1 | Three supported languages: French (`fr`, default), English (`en`), Arabic (`ar`) |
| I18N-2 | Frontend UI translations are inline in `frontend/src/lib/i18n.ts` |
| I18N-3 | Event content is stored per-language in the database (`title_fr`, `title_en`, `title_ar`, etc.) |
| I18N-4 | Guest language preference is stored in the `guests.language` column |
| I18N-5 | Admin user language preference is stored in the `users.language` column |
| I18N-6 | Arabic requires RTL layout support |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | All database queries are async (SQLAlchemy async + asyncpg) |
| NFR-2 | API response times < 200ms for standard CRUD operations |
| NFR-3 | Frontend is a SPA with client-side routing (React Router) |
| NFR-4 | Frontend uses React Query for server state management with cache invalidation |
| NFR-5 | TLS termination via cert-manager + Let's Encrypt in production |
| NFR-6 | Docker images use multi-stage builds to minimize size |
| NFR-7 | Frontend production build served by nginx with gzip, cache headers, SPA fallback |
| NFR-8 | No secrets in source code; all sensitive values via environment variables or Kubernetes secrets |
| NFR-9 | CORS restricted to configured origins |
| NFR-10 | API docs (Swagger UI) only available when `DEBUG=true` |

---

## 5. API Specification

### 5.1 Authentication

#### `POST /api/auth/login`
- **Auth:** None
- **Request:**
  ```json
  { "email": "string", "password": "string" }
  ```
- **Response 200:**
  ```json
  {
    "access_token": "string",
    "token_type": "bearer",
    "user": { "id": "uuid", "email": "string", "name": "string", "language": "fr|en|ar" }
  }
  ```
- **Response 401:** `{ "detail": "Invalid email or password" }`

#### `POST /api/auth/register`
- **Auth:** None
- **Request:**
  ```json
  { "email": "valid-email", "password": "string", "name": "string", "language": "fr" }
  ```
- **Response 201:** `UserResponse`
- **Response 400:** `{ "detail": "Email already registered" }`

#### `GET /api/auth/me`
- **Auth:** JWT Bearer
- **Response 200:** `UserResponse`
- **Response 401:** Invalid or missing token

### 5.2 Guests (Admin)

#### `GET /api/guests`
- **Auth:** JWT Bearer
- **Query params:** `search` (string), `rsvp_status` (enum), `group_name` (string)
- **Response 200:** `GuestResponse[]`

#### `GET /api/guests/stats`
- **Auth:** JWT Bearer
- **Response 200:**
  ```json
  {
    "total": 0, "attending": 0, "not_attending": 0,
    "pending": 0, "plus_ones": 0, "total_attending": 0
  }
  ```

#### `POST /api/guests`
- **Auth:** JWT Bearer
- **Request:** `GuestCreate` (required: `first_name`, `last_name`)
- **Response 201:** `GuestResponse` (includes auto-generated `rsvp_code`)

#### `GET /api/guests/{id}`
- **Auth:** JWT Bearer
- **Response 200:** `GuestResponse`
- **Response 404:** `{ "detail": "Guest not found" }`

#### `PATCH /api/guests/{id}`
- **Auth:** JWT Bearer
- **Request:** `GuestUpdate` (all fields optional, partial update)
- **Response 200:** `GuestResponse`

#### `DELETE /api/guests/{id}`
- **Auth:** JWT Bearer
- **Response 204:** No content
- **Response 404:** `{ "detail": "Guest not found" }`

### 5.3 Events

#### `GET /api/events` (Public)
- **Auth:** None
- **Response 200:** `EventResponse[]` (only `is_visible = true`, ordered by `sort_order`, `start_time`)

#### `GET /api/events/all` (Admin)
- **Auth:** JWT Bearer
- **Response 200:** `EventResponse[]` (all events)

#### `POST /api/events`
- **Auth:** JWT Bearer
- **Request:** `EventCreate` (required: `title_fr`, `title_en`, `start_time`)
- **Response 201:** `EventResponse`

#### `PATCH /api/events/{id}`
- **Auth:** JWT Bearer
- **Request:** `EventUpdate` (all fields optional)
- **Response 200:** `EventResponse`

#### `DELETE /api/events/{id}`
- **Auth:** JWT Bearer
- **Response 204:** No content

### 5.4 RSVP (Public)

#### `GET /api/rsvp/lookup/{code}`
- **Auth:** None
- **Response 200:** `RSVPLookupResponse` (guest name, status, plus-one info, dietary, message)
- **Response 404:** `{ "detail": "RSVP code not found" }`

#### `POST /api/rsvp/submit`
- **Auth:** None
- **Request:**
  ```json
  {
    "rsvp_code": "ABC12345",
    "rsvp_status": "attending|not_attending",
    "plus_one_name": "string|null",
    "plus_one_attending": false,
    "dietary_restrictions": "string|null",
    "message": "string|null"
  }
  ```
- **Response 200:** `{ "success": true, "message": "RSVP submitted successfully" }`

### 5.5 Health

#### `GET /health`
- **Auth:** None
- **Response 200:** `{ "status": "healthy", "version": "0.1.0" }`

---

## 6. Frontend Pages

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/login` | LoginPage | No | Email + password form, redirects to `/` on success |
| `/` | DashboardPage | JWT | RSVP stats cards (total, attending, pending, etc.) |
| `/guests` | GuestsPage | JWT | Table with search/filter, add/edit/delete modals |
| `/events` | EventsPage | JWT | Event list with create/edit/delete, sort order management |
| `/rsvp` | RSVPPage | No | Code input -> lookup -> response form -> thank you |
| `/rsvp/:code` | RSVPPage | No | Direct link with pre-filled code |
| `/timeline` | TimelinePage | No | Chronological event display, language-aware |

### Layout

- Admin pages are wrapped in `Layout` component: sidebar navigation (Dashboard, Guests, Events) + language toggle + logout
- Public pages have standalone layouts (no sidebar)
- `ProtectedRoute` component checks auth state: loading spinner -> redirect to `/login` if unauthenticated

---

## 7. Data Model

### 7.1 Enumerations

```
Language: fr | en | ar
RSVPStatus: pending | attending | not_attending
```

### 7.2 Users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, auto-generated | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, indexed | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `name` | VARCHAR(255) | NOT NULL | |
| `language` | ENUM(Language) | NOT NULL, default `fr` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, server default | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, server default + onupdate | |

### 7.3 Guests

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, auto-generated | |
| `first_name` | VARCHAR(255) | NOT NULL | |
| `last_name` | VARCHAR(255) | NOT NULL | |
| `email` | VARCHAR(255) | nullable | |
| `phone` | VARCHAR(50) | nullable | |
| `group_name` | VARCHAR(255) | nullable, indexed | Family/group label |
| `rsvp_code` | VARCHAR(8) | UNIQUE, NOT NULL, indexed | Auto-generated: 8 chars, A-Z + 0-9 |
| `rsvp_status` | ENUM(RSVPStatus) | NOT NULL, default `pending`, indexed | |
| `plus_one_allowed` | BOOLEAN | NOT NULL, default `false` | Admin sets this |
| `plus_one_name` | VARCHAR(255) | nullable | Guest fills this |
| `plus_one_attending` | BOOLEAN | NOT NULL, default `false` | |
| `dietary_restrictions` | TEXT | nullable | |
| `message` | TEXT | nullable | From guest to couple |
| `language` | ENUM(Language) | NOT NULL, default `fr` | |
| `table_number` | INTEGER | nullable | Seating assignment |
| `notes` | TEXT | nullable | Admin-only internal notes |
| `responded_at` | TIMESTAMPTZ | nullable | Set on RSVP submit |
| `created_at` | TIMESTAMPTZ | NOT NULL, server default | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, server default + onupdate | |

**Indexes:** `(last_name, first_name)`, `rsvp_status`, `group_name`, `rsvp_code` (unique)

### 7.4 Events

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, auto-generated | |
| `title_fr` | VARCHAR(255) | NOT NULL | |
| `title_en` | VARCHAR(255) | NOT NULL | |
| `title_ar` | VARCHAR(255) | nullable | |
| `description_fr` | TEXT | nullable | |
| `description_en` | TEXT | nullable | |
| `description_ar` | TEXT | nullable | |
| `location` | VARCHAR(500) | nullable | |
| `icon` | VARCHAR(50) | nullable | Emoji character |
| `start_time` | TIMESTAMPTZ | NOT NULL | |
| `end_time` | TIMESTAMPTZ | nullable | |
| `sort_order` | INTEGER | NOT NULL, default `0`, indexed | |
| `is_visible` | BOOLEAN | NOT NULL, default `true` | |
| `created_at` | TIMESTAMPTZ | NOT NULL, server default | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, server default + onupdate | |

---

## 8. Security

| Concern | Implementation |
|---------|---------------|
| Authentication | JWT Bearer tokens (HS256), 7-day expiry |
| Password storage | bcrypt hashed, never stored in plaintext |
| Authorization | FastAPI dependency `get_current_user()` on all admin endpoints |
| Token storage | `localStorage` (client-side) |
| CORS | Whitelist of allowed origins in `config.py` |
| Secrets | Environment variables locally, Kubernetes Secrets in production |
| TLS | cert-manager + Let's Encrypt, forced via ingress annotation |
| API docs | Swagger/ReDoc disabled when `DEBUG=false` (production) |
| Input validation | Pydantic models on all request bodies |
| SQL injection | Parameterized queries via SQLAlchemy ORM |

---

## 9. Configuration

### Environment Variables (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | No | `10080` (7d) | Token lifetime in minutes |
| `APP_NAME` | No | `Wedding App` | Application name |
| `VERSION` | No | `0.1.0` | Application version |
| `DEBUG` | No | `false` | Enable API docs and debug mode |
| `CORS_ORIGINS` | No | `["http://localhost:5173", ...]` | Allowed CORS origins |

### Environment Variables (Frontend -- Build Time)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL for production build (e.g. `https://wedding.terrab.me`) |

### Environment Variables (Frontend -- Dev Server)

| Variable | Description |
|----------|-------------|
| `API_PROXY_TARGET` | Backend URL for Vite proxy (e.g. `http://backend:8000`). Not prefixed with `VITE_` to avoid browser exposure |

---

## 10. Deployment

### 10.1 Local Development

```
docker compose up -d
docker compose exec backend alembic upgrade head
```

| Service | Host Port | Container Port |
|---------|-----------|----------------|
| PostgreSQL | 5433 | 5432 |
| Backend | 8000 | 8000 |
| Frontend | 5174 | 5173 |

### 10.2 Production (Kubernetes)

- **Namespace:** `wedding`
- **Domain:** `wedding.terrab.me`
- **Deployment repo:** `ate-server-deployment-flux/apps/wedding/`
- **GitOps:** Flux CD auto-syncs Kustomize overlays
- **Images:** `ghcr.io/algorithmy1/wedding-app-backend`, `ghcr.io/algorithmy1/wedding-app-frontend`
- **Database:** PostgreSQL 16 StatefulSet with 5Gi PVC
- **TLS:** cert-manager + Let's Encrypt (forced via ingress annotation)
- **Ingress routing:**
  - `/api/*`, `/health` -> backend service
  - `/*` -> frontend service (nginx)

### 10.3 Release Process

1. Build and push Docker images to GHCR with a version tag
2. Update image tags in `ate-server-deployment-flux/apps/wedding/production/kustomization.yaml`
3. Commit and push to the deployment repo
4. Flux CD detects the change and rolls out the new version
5. Run `kubectl exec ... -- alembic upgrade head` if there are new migrations

---

## 11. Future Considerations

Items not yet implemented but anticipated:

| Item | Notes |
|------|-------|
| Email/SMS notifications | Send RSVP codes to guests, reminders |
| QR code generation | Encode RSVP code as QR for printed invitations |
| Photo gallery | Guest-uploaded photos during the event |
| Seating chart visualization | Visual table assignment with drag-and-drop |
| Export (CSV/PDF) | Export guest list, seating chart, stats |
| Rate limiting | Prevent brute-force on RSVP code lookup |
| Audit log | Track admin actions (who changed what, when) |
| Registration lockdown | Disable open admin registration in production |
| RTL layout | Full Arabic RTL support in all pages |
