# Wedding App

Wedding RSVP and management application. FastAPI backend + React frontend + PostgreSQL, deployed on Kubernetes via Flux CD.

## Features

- **RSVP System** -- Public page where guests enter a code and respond (attending / not attending, plus-one, dietary restrictions, message)
- **Admin Dashboard** -- Track guest stats (attending, pending, not attending, total headcount)
- **Guest Management** -- Add/edit/delete guests, assign RSVP codes, group by family, assign tables
- **Event Timeline** -- Public timeline page showing the wedding day schedule
- **i18n** -- French, English, Arabic support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL 16, Alembic |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| Auth | JWT (python-jose), bcrypt |
| Deployment | Docker, Kubernetes (Kustomize), Flux CD |

## Quick Start (Docker Compose)

```bash
docker compose up -d
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Run migrations

```bash
docker compose exec backend alembic upgrade head
```

### Create first admin user

```bash
docker compose exec backend python -c "
import asyncio
from app.db.database import async_session_maker
from app.db.models import User
from app.auth.passwords import hash_password

async def create_admin():
    async with async_session_maker() as session:
        user = User(
            email='admin@wedding.local',
            password_hash=hash_password('admin'),
            name='Admin',
        )
        session.add(user)
        await session.commit()
        print(f'Created admin user: {user.email}')

asyncio.run(create_admin())
"
```

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy .env.example to .env and configure
cp .env.example .env

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
wedding/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── api/             # Route handlers
│   │   │   ├── auth.py      # Login/register
│   │   │   ├── guests.py    # Guest CRUD (admin)
│   │   │   ├── events.py    # Event CRUD (admin)
│   │   │   └── rsvp.py      # Public RSVP endpoints
│   │   ├── db/
│   │   │   ├── database.py  # Async engine & session
│   │   │   └── models.py    # User, Guest, Event
│   │   └── auth/            # JWT, passwords, dependencies
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Routes
│   │   ├── lib/             # API client, auth, i18n
│   │   ├── pages/           # Login, Dashboard, Guests, Events, RSVP, Timeline
│   │   └── components/      # Layout
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/
│   ├── base/               # Kustomize base manifests
│   └── production/          # Production overlays
├── docker-compose.yml
└── README.md
```

## Public Pages (no auth required)

| Page | URL | Description |
|------|-----|-------------|
| RSVP | `/rsvp` | Guest enters code, submits RSVP |
| RSVP (direct) | `/rsvp/CODE` | Direct link with pre-filled code |
| Timeline | `/timeline` | Wedding day schedule |

## Kubernetes Deployment

The `k8s/` directory contains Kustomize manifests mirroring the accounting-app pattern:

1. Update secrets in `k8s/base/secret.yaml`
2. Build and push Docker images to GHCR
3. Update image tags in `k8s/production/kustomization.yaml`
4. Add to Flux CD kustomization

```bash
# Build images
docker build -t ghcr.io/algorithmy1/wedding-app-backend:0.1.0 ./backend
docker build -t ghcr.io/algorithmy1/wedding-app-frontend:0.1.0 --build-arg VITE_API_URL=https://wedding.terrab.me ./frontend

# Push to GHCR
docker push ghcr.io/algorithmy1/wedding-app-backend:0.1.0
docker push ghcr.io/algorithmy1/wedding-app-frontend:0.1.0
```
