# Wedding App -- Agent Guidelines

## Stack

- Backend: FastAPI (Python 3.12) + async SQLAlchemy + PostgreSQL 16 + Alembic
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + React Query + react-i18next
- Auth: JWT (python-jose, HS256, 7-day expiry) + bcrypt passwords
- Deployment: Docker multi-stage builds + Kubernetes via Flux CD (Kustomize)
- See ARCHITECTURE.md for C4 diagrams, data model, and full API spec

## Conventions

- Follow the same patterns as accounting-app (`/Users/terra/Repositories/algorithmy1/accounting-app`)
- Pydantic schemas are defined inline in each router file (not in a separate schemas module)
- FastAPI dependencies: `get_db()` for DB session, `get_current_user()` for auth
- `User` model import: always from `app.db.models`, never from `app.auth`
- Frontend API calls go through Vite proxy in dev (`/api/*` → backend container)
- Never use `VITE_*` env vars for Docker-internal hostnames (browser can't resolve them)
- Use non-prefixed env vars (e.g. `API_PROXY_TARGET`) for server-side Vite config
- i18n: French (default), English, Arabic. Translations inline in `frontend/src/lib/i18n.ts`
- Add `@types/node` as devDependency for `vite.config.ts` (uses `process`, `path`, `__dirname`)

## Routes

- Public (no auth): `/rsvp`, `/rsvp/:code`, `/timeline`, `/api/rsvp/*`, `/api/events` (GET only)
- Admin (JWT): `/`, `/guests`, `/events`, all `/api/guests/*`, `/api/events/all`, `/api/events` (POST/PATCH/DELETE)

## Database

- 3 tables: `users`, `guests`, `events`
- UUIDs as primary keys, `server_default=func.now()` for timestamps
- Guest `rsvp_code` is auto-generated 8-char alphanumeric (unique)
- Alembic async migrations with `asyncpg` driver
- Migration naming: `YYYY_MM_DD_HHMM-{rev}_{slug}`

## Local Development

```bash
docker compose up -d
docker compose exec backend alembic upgrade head
# Backend: http://localhost:8000 (API + docs at /docs)
# Frontend: http://localhost:5174 (Vite proxy → backend)
# Postgres: localhost:5433
```

## Deployment (Kubernetes)

Manifests live in a separate repo: `ate-server-deployment-flux/apps/wedding/`

### Build & Push Images

```bash
# Backend
docker build -t ghcr.io/algorithmy1/wedding-app-backend:TAG ./backend
docker push ghcr.io/algorithmy1/wedding-app-backend:TAG

# Frontend
docker build -t ghcr.io/algorithmy1/wedding-app-frontend:TAG \
  --build-arg VITE_API_URL=https://wedding.terrab.me ./frontend
docker push ghcr.io/algorithmy1/wedding-app-frontend:TAG
```

### Deploy

Flux auto-syncs from the deployment repo. To deploy manually:

```bash
kubectl apply -k apps/wedding/production/
```

### Update Image Tag

Edit `ate-server-deployment-flux/apps/wedding/production/kustomization.yaml`:
```yaml
images:
  - name: ghcr.io/algorithmy1/wedding-app-backend
    newTag: "NEW_TAG"
  - name: ghcr.io/algorithmy1/wedding-app-frontend
    newTag: "NEW_TAG"
```

### Access

- URL: https://wedding.terrab.me
- Namespace: `wedding`

### Monitoring

```bash
kubectl get pods -n wedding
kubectl logs -n wedding deployment/wedding-app -f
kubectl exec -it -n wedding wedding-postgres-0 -- psql -U wedding
```

### Migrations (Production)

```bash
kubectl exec -it -n wedding deployment/wedding-app -- alembic upgrade head
```

### Database Backup / Restore

```bash
# Backup
kubectl exec -n wedding wedding-postgres-0 -- pg_dump -U wedding wedding > backup.sql

# Restore
cat backup.sql | kubectl exec -i -n wedding wedding-postgres-0 -- psql -U wedding wedding
```

### Secrets

```bash
kubectl edit secret -n wedding wedding-secrets
# Keys: database-url, jwt-secret, postgres-password
```

## Project Structure

```
wedding/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routes, health
│   │   ├── config.py            # Pydantic Settings (.env)
│   │   ├── api/
│   │   │   ├── auth.py          # Login, register, /me
│   │   │   ├── guests.py        # Guest CRUD + stats (admin)
│   │   │   ├── events.py        # Event CRUD (admin) + public list
│   │   │   └── rsvp.py          # Public lookup + submit
│   │   ├── auth/
│   │   │   ├── jwt.py           # Token create/verify
│   │   │   ├── passwords.py     # bcrypt hash/verify
│   │   │   └── dependencies.py  # get_current_user (HTTPBearer)
│   │   └── db/
│   │       ├── database.py      # Async engine, session, get_db()
│   │       └── models.py        # User, Guest, Event
│   ├── alembic/                 # Migrations
│   ├── requirements.txt
│   └── Dockerfile               # Multi-stage (builder + runtime)
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Routes (public + protected)
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios client + API methods
│   │   │   ├── auth.tsx         # AuthProvider + useAuth hook
│   │   │   └── i18n.ts          # FR/EN/AR translations
│   │   ├── pages/               # Login, Dashboard, Guests, Events, RSVP, Timeline
│   │   └── components/Layout.tsx
│   ├── vite.config.ts           # Proxy /api → backend
│   ├── tailwind.config.js       # Wedding theme (warm palette, serif)
│   ├── Dockerfile               # Multi-stage (node build + nginx)
│   ├── Dockerfile.dev           # Dev with HMR
│   └── nginx.conf               # SPA routing, gzip, cache headers
├── k8s/                         # Copy of manifests (reference only)
├── docker-compose.yml           # Local dev: postgres + backend + frontend
└── ARCHITECTURE.md              # C4 diagrams, data flow, full specs
```
