# Wedding App -- Architecture

## C4 Model

### Level 1: System Context

```
┌─────────────────────────────────────────────────────────┐
│                     External Actors                      │
│                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│   │  Guest   │    │  Admin   │    │  Flux CD (GitOps) │  │
│   │ (Public) │    │ (Couple) │    │                    │  │
│   └────┬─────┘    └────┬─────┘    └────────┬───────────┘ │
└────────┼───────────────┼───────────────────┼─────────────┘
         │               │                   │
         ▼               ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Wedding App System                     │
│                                                          │
│  RSVP submission    Admin dashboard      Auto-deploy     │
│  Timeline viewing   Guest management     from Git repo   │
│                     Event management                     │
└─────────────────────────────────────────────────────────┘
```

### Level 2: Container Diagram

```
                    ┌──────────────────┐
                    │     Ingress      │
                    │ wedding.terrab.me│
                    │  (nginx + TLS)   │
                    └───────┬──────────┘
                            │
               ┌────────────┼────────────┐
               │ /api/*     │ /*         │
               ▼            │            ▼
  ┌────────────────────┐    │   ┌────────────────────┐
  │   Backend (API)    │    │   │   Frontend (SPA)   │
  │                    │    │   │                    │
  │  FastAPI 0.115     │    │   │  React 18 + TS    │
  │  Python 3.12       │    │   │  Vite + Tailwind  │
  │  Uvicorn           │    │   │  nginx (prod)     │
  │  Port 8000         │    │   │  Port 80          │
  │                    │    │   │                    │
  │  Routes:           │    │   │  Pages:            │
  │  /api/auth/*       │    │   │  /login  (admin)   │
  │  /api/guests/*     │    │   │  /       (dashboard)│
  │  /api/events/*     │    │   │  /guests (admin)   │
  │  /api/rsvp/*       │    │   │  /events (admin)   │
  │  /health           │    │   │  /rsvp   (public)  │
  └────────┬───────────┘    │   │  /timeline (public)│
           │                │   └────────────────────┘
           ▼                │
  ┌────────────────────┐    │
  │   PostgreSQL 16    │    │
  │                    │    │
  │  Database: wedding │    │
  │  User: wedding     │    │
  │  Port 5432         │    │
  │  5Gi PVC           │    │
  └────────────────────┘    │
```

### Level 3: Component Diagram (Backend)

```
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Application                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    API Layer                         │ │
│  │                                                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │ │
│  │  │ auth.py  │ │guests.py │ │events.py│ │ rsvp.py  │ │ │
│  │  │          │ │          │ │         │ │          │ │ │
│  │  │ login    │ │ CRUD     │ │ CRUD    │ │ lookup   │ │ │
│  │  │ register │ │ list     │ │ list    │ │ submit   │ │ │
│  │  │ me       │ │ stats    │ │ all     │ │          │ │ │
│  │  │          │ │ search   │ │         │ │ (public) │ │ │
│  │  │ (public+ │ │ (admin)  │ │ (mixed) │ │          │ │ │
│  │  │  admin)  │ │          │ │         │ │          │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬───┘ └────┬─────┘ │ │
│  └───────┼────────────┼────────────┼──────────┼────────┘ │
│          │            │            │          │           │
│  ┌───────┼────────────┼────────────┼──────────┼────────┐ │
│  │       ▼            ▼            ▼          ▼        │ │
│  │              Auth Layer                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │ │
│  │  │  jwt.py  │ │passwords │ │   dependencies.py    │ │ │
│  │  │          │ │  .py     │ │                      │ │ │
│  │  │ create   │ │ hash     │ │ get_current_user()   │ │ │
│  │  │ verify   │ │ verify   │ │ HTTPBearer           │ │ │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│          │                                                │
│  ┌───────▼─────────────────────────────────────────────┐ │
│  │                  Database Layer                       │ │
│  │                                                      │ │
│  │  ┌──────────────┐    ┌──────────────────────────┐   │ │
│  │  │ database.py  │    │       models.py          │   │ │
│  │  │              │    │                          │   │ │
│  │  │ async engine │    │  User   (admin auth)     │   │ │
│  │  │ session maker│    │  Guest  (invitees+RSVP)  │   │ │
│  │  │ get_db()     │    │  Event  (timeline)       │   │ │
│  │  └──────────────┘    └──────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

### RSVP Flow (Public -- No Auth)

```
Guest Browser                Frontend               Backend              Database
     │                          │                      │                     │
     │  1. Visit /rsvp          │                      │                     │
     │ ──────────────────────►  │                      │                     │
     │                          │                      │                     │
     │  2. Enter RSVP code      │                      │                     │
     │ ──────────────────────►  │                      │                     │
     │                          │  3. GET /api/rsvp/    │                     │
     │                          │     lookup/{code}     │                     │
     │                          │ ────────────────────► │                     │
     │                          │                      │  4. SELECT guest    │
     │                          │                      │     WHERE rsvp_code │
     │                          │                      │ ──────────────────► │
     │                          │                      │  5. Guest data      │
     │                          │                      │ ◄────────────────── │
     │                          │  6. Guest info       │                     │
     │                          │ ◄──────────────────── │                     │
     │  7. Show RSVP form       │                      │                     │
     │ ◄────────────────────── │                      │                     │
     │                          │                      │                     │
     │  8. Submit response      │                      │                     │
     │ ──────────────────────►  │                      │                     │
     │                          │  9. POST /api/rsvp/  │                     │
     │                          │     submit           │                     │
     │                          │ ────────────────────► │                     │
     │                          │                      │  10. UPDATE guest   │
     │                          │                      │      SET status,    │
     │                          │                      │      dietary, etc.  │
     │                          │                      │ ──────────────────► │
     │                          │  11. Success         │                     │
     │                          │ ◄──────────────────── │                     │
     │  12. Thank you page      │                      │                     │
     │ ◄────────────────────── │                      │                     │
```

### Admin Flow (JWT Auth Required)

```
Admin Browser               Frontend               Backend              Database
     │                          │                      │                     │
     │  1. POST /api/auth/login │                      │                     │
     │ ──────────────────────►  │ ────────────────────► │                     │
     │                          │                      │  2. Verify creds   │
     │                          │                      │ ──────────────────► │
     │                          │  3. JWT token        │                     │
     │ ◄──────────────────────  │ ◄──────────────────── │                     │
     │                          │                      │                     │
     │  4. Store token in       │                      │                     │
     │     localStorage         │                      │                     │
     │                          │                      │                     │
     │  5. GET /api/guests/stats│                      │                     │
     │     Authorization:       │                      │                     │
     │     Bearer <token>       │                      │                     │
     │ ──────────────────────►  │ ────────────────────► │                     │
     │                          │                      │  6. Verify JWT     │
     │                          │                      │  7. Query stats    │
     │                          │                      │ ──────────────────► │
     │                          │  8. Stats response   │                     │
     │ ◄──────────────────────  │ ◄──────────────────── │                     │
```

## Data Model

```
┌─────────────────────────────────────┐
│              users                   │
├─────────────────────────────────────┤
│ id            UUID PK               │
│ email         VARCHAR(255) UNIQUE   │
│ password_hash VARCHAR(255)          │
│ name          VARCHAR(255)          │
│ language      ENUM(fr,en,ar)        │
│ created_at    TIMESTAMPTZ           │
│ updated_at    TIMESTAMPTZ           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│              guests                  │
├─────────────────────────────────────┤
│ id                  UUID PK         │
│ first_name          VARCHAR(255)    │
│ last_name           VARCHAR(255)    │
│ email               VARCHAR(255)    │
│ phone               VARCHAR(50)     │
│ group_name          VARCHAR(255)    │  ← family grouping
│ rsvp_code           VARCHAR(8) UQ   │  ← auto-generated
│ rsvp_status         ENUM            │  ← pending/attending/not_attending
│ plus_one_allowed    BOOLEAN         │
│ plus_one_name       VARCHAR(255)    │
│ plus_one_attending  BOOLEAN         │
│ dietary_restrictions TEXT            │
│ message             TEXT            │  ← personal message from guest
│ language            ENUM(fr,en,ar)  │
│ table_number        INTEGER         │
│ notes               TEXT            │  ← admin-only notes
│ responded_at        TIMESTAMPTZ     │
│ created_at          TIMESTAMPTZ     │
│ updated_at          TIMESTAMPTZ     │
├─────────────────────────────────────┤
│ IDX: (last_name, first_name)        │
│ IDX: rsvp_status                    │
│ IDX: group_name                     │
│ IDX: rsvp_code (unique)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│              events                  │
├─────────────────────────────────────┤
│ id              UUID PK             │
│ title_fr        VARCHAR(255)        │
│ title_en        VARCHAR(255)        │
│ title_ar        VARCHAR(255)        │
│ description_fr  TEXT                │
│ description_en  TEXT                │
│ description_ar  TEXT                │
│ location        VARCHAR(500)        │
│ icon            VARCHAR(50)         │  ← emoji
│ start_time      TIMESTAMPTZ         │
│ end_time        TIMESTAMPTZ         │
│ sort_order      INTEGER             │
│ is_visible      BOOLEAN             │
│ created_at      TIMESTAMPTZ         │
│ updated_at      TIMESTAMPTZ         │
├─────────────────────────────────────┤
│ IDX: sort_order                     │
└─────────────────────────────────────┘
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `POST` | `/api/auth/register` | No | Register new admin user |
| `GET` | `/api/auth/me` | JWT | Current user info |
| `GET` | `/api/guests` | JWT | List guests (search, filter) |
| `GET` | `/api/guests/stats` | JWT | RSVP statistics |
| `POST` | `/api/guests` | JWT | Create guest |
| `GET` | `/api/guests/{id}` | JWT | Get guest |
| `PATCH` | `/api/guests/{id}` | JWT | Update guest |
| `DELETE` | `/api/guests/{id}` | JWT | Delete guest |
| `GET` | `/api/events` | No | List visible events (public) |
| `GET` | `/api/events/all` | JWT | List all events (admin) |
| `POST` | `/api/events` | JWT | Create event |
| `PATCH` | `/api/events/{id}` | JWT | Update event |
| `DELETE` | `/api/events/{id}` | JWT | Delete event |
| `GET` | `/api/rsvp/lookup/{code}` | No | Look up guest by RSVP code |
| `POST` | `/api/rsvp/submit` | No | Submit RSVP response |
| `GET` | `/health` | No | Health check |

## Infrastructure

### Local (Docker Compose)

```
docker-compose.yml
├── postgres   (5433:5432)  PostgreSQL 16 Alpine
├── backend    (8000:8000)  FastAPI + Uvicorn (hot-reload)
└── frontend   (5174:5173)  Vite dev server (HMR)
    └── proxy /api/* → http://backend:8000
```

### Production (Kubernetes via Flux CD)

```
Namespace: wedding

ate-server-deployment-flux/apps/wedding/
├── base/
│   ├── namespace.yaml
│   ├── postgres-configmap.yaml     # uuid-ossp extension
│   ├── postgres-pvc.yaml           # 5Gi local-path
│   ├── postgres-statefulset.yaml   # PostgreSQL 16
│   ├── postgres-service.yaml       # Headless ClusterIP
│   ├── secret.yaml                 # DB URL, JWT secret
│   ├── ghcr-secret.yaml            # Image pull secret
│   ├── deployment.yaml             # Backend API
│   ├── service.yaml                # Backend ClusterIP
│   ├── frontend-deployment.yaml    # Frontend + Service
│   ├── ingress.yaml                # wedding.terrab.me (TLS)
│   └── kustomization.yaml
└── production/
    ├── ingress-patch.yaml          # Force SSL, TLS 1.2+
    └── kustomization.yaml          # Image tags, replicas

Ingress routing:
  wedding.terrab.me/api/*  → wedding-app:80 (backend)
  wedding.terrab.me/health → wedding-app:80 (backend)
  wedding.terrab.me/*      → wedding-frontend:80 (nginx)
```

## Tech Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI + Uvicorn | 0.115.5 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Database | PostgreSQL | 16 Alpine |
| Migrations | Alembic | 1.14.0 |
| Auth | JWT (python-jose) + bcrypt | HS256, 7d expiry |
| Frontend | React + TypeScript | 18.2 |
| Build | Vite | 5.x |
| Styling | TailwindCSS + @tailwindcss/forms | 3.4 |
| Data Fetching | @tanstack/react-query | 5.17 |
| HTTP Client | Axios | 1.6 |
| i18n | react-i18next | FR, EN, AR |
| Icons | @heroicons/react | 2.1 |
| Container | Docker (multi-stage) | - |
| Orchestration | Kubernetes (Kustomize) | - |
| GitOps | Flux CD | - |
| TLS | cert-manager + Let's Encrypt | - |
| Registry | ghcr.io/algorithmy1 | - |
