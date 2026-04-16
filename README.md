# Tracenix

Tracenix is an MVP B2B SaaS platform for construction-focused document control, approval workflows, and compliance visibility.
It is designed for teams that need better operational traceability than generic file tools, but lighter rollout than ERP systems.

## 1. Project Overview

Tracenix centralizes project records, workflow approvals, version control, checklist tracking, and audit-ready history in one platform.

Business problem it solves:
- fragmented records across email/chat/spreadsheets/personal folders
- delayed approvals and version confusion
- missing compliance evidence at nghiệm thu / audit / inspection time
- weak field-to-office synchronization

Primary users:
- system_admin
- project_manager
- document_controller
- site_engineer
- approver
- viewer

MVP scope:
- usable end-to-end workflows for projects, documents, approvals, checklists, notifications, and audit logs
- local VPS deployment with local filesystem uploads and PostgreSQL
- public landing page at `/landingpage` under the same domain as the app

## 2. Core Features

- Document management with metadata and project/category linkage
- Document versioning with one active current version
- Workflow approvals (submit, review, approve, reject, request revision, archive)
- Compliance checklist tracking and status monitoring
- Dashboard summary metrics for operations visibility
- Notifications persisted in database
- Audit logs for key actions and traceability
- Public landing page with approved Tracenix positioning/messaging
- Docker-based deployment model with reverse proxy and persistent storage

## 3. Project Structure

```text
tracenix/
├─ backend/                      # FastAPI backend
│  ├─ app/                       # API routes, models, schemas, services, utils
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ .env.example
├─ frontend/                     # Next.js frontend
│  ├─ src/app/                   # App Router pages
│  │  ├─ (auth)/login
│  │  ├─ (app)/...               # Authenticated product screens
│  │  └─ landingpage/            # Public landing page route
│  ├─ Dockerfile
│  └─ .env.example
├─ deploy/
│  └─ nginx/
│     ├─ conf.d/tracenix.conf    # Reverse proxy config
│     └─ certs/                  # TLS cert mount target
├─ docker-compose.yml            # Full deployment topology
├─ .env.example                  # Compose/deployment environment template
└─ README.md
```

## 4. Tech Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Three Fiber / Three.js
- Backend: Python, FastAPI, SQLAlchemy, Pydantic v2, python-jose, python-multipart
- Database: PostgreSQL (Docker default), SQLite (local fallback)
- Reverse proxy: Nginx
- Container runtime: Docker + Docker Compose
- File storage: local filesystem persisted through Docker volume (`uploads_data`)

## 5. Local Development Setup

### Prerequisites
- Python 3.11+ (or compatible with requirements)
- Node.js 20+
- npm
- Docker Desktop / Docker Engine (optional but recommended)

### A) Run without Docker

1. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Frontend
```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

3. Access
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Landing page: `http://localhost:3000/landingpage`

### B) Run with Docker Compose

1. Copy env
```bash
copy .env.example .env
```

2. Start all services
```bash
docker compose up -d --build
```

3. Access
- App via reverse proxy: `http://localhost`
- Landing page: `http://localhost/landingpage`
- API via proxy: `http://localhost/api`

Service startup order is handled by Compose (`postgres` -> `backend` -> `frontend` -> `reverse-proxy`).

## 6. Docker Deployment (VPS)

### Services
- `postgres`: persistent PostgreSQL
- `backend`: FastAPI app
- `frontend`: Next.js app
- `reverse-proxy`: Nginx public entrypoint on 80/443

### Build/start commands
```bash
docker compose pull
docker compose up -d --build
```

### Restart/update workflow
```bash
git pull
docker compose up -d --build
docker compose ps
```

### Stop
```bash
docker compose down
```

## 7. Domain and DNS Setup

Required DNS record:
- Type: `A`
- Host/Name: `tracenix` (or full host `tracenix.digitalizelabs.com`)
- Value: `<your-vps-public-ip>`
- Result target: `tracenix.digitalizelabs.com`

After DNS propagation, `tracenix.digitalizelabs.com` should resolve to your VPS.

HTTPS notes:
- Nginx config is HTTPS-ready with TLS server block template in `deploy/nginx/conf.d/tracenix.conf`.
- Provide certificate files on VPS and mount to `deploy/nginx/certs/`:
  - `fullchain.pem`
  - `privkey.pem`
- Enable the `listen 443 ssl` block (already provided as comments), then reload Nginx container.

## 8. Routes

Main routes:
- Main app surface: `https://tracenix.digitalizelabs.com/`
- Public landing page: `https://tracenix.digitalizelabs.com/landingpage`
- API base (proxied): `https://tracenix.digitalizelabs.com/api`
- Uploaded files (proxied): `https://tracenix.digitalizelabs.com/uploads/...`

Important behavior:
- Same frontend app serves both authenticated product routes and `/landingpage`.
- `/landingpage` is public.
- Product workflows remain under authenticated app routes.

## 9. Environment Variables

Root `.env` (Compose) key variables:
- `DOMAIN`: target domain (`tracenix.digitalizelabs.com`)
- `APP_ENV`: environment mode (`production`)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: database config
- `SECRET_KEY`: JWT signing secret for backend
- `ACCESS_TOKEN_EXPIRE_MINUTES`: token expiration window
- `MAX_UPLOAD_SIZE_MB`: backend upload validation limit
- `ALLOWED_MIME_TYPES`: accepted upload MIME types
- `CORS_ORIGINS`: allowed browser origins
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_FULL_NAME`: initial admin seed
- `NEXT_PUBLIC_API_BASE_URL`: frontend API base (`/api` for same-domain proxy)

Backend-only `.env` (non-Docker local run) is in `backend/.env.example`.
Frontend-only `.env.local` (non-Docker local run) is in `frontend/.env.example`.

## 10. Persistent Data

Persistent data is configured in `docker-compose.yml`:
- `postgres_data` -> PostgreSQL data directory (`/var/lib/postgresql/data`)
- `uploads_data` -> backend upload root (`/app/data/uploads`)

These volumes survive container recreation and restarts.

If you prefer explicit VPS folders (example `/opt/tracenix/postgres-data`, `/opt/tracenix/uploads`), replace named volumes with bind mounts in Compose.

## 11. Deployment Notes

- Nginx proxies:
  - `/` -> frontend service
  - `/api/` -> backend service (rewritten without `/api` prefix)
  - `/uploads/` -> backend static upload mount
- `client_max_body_size` is set to `50m` for upload-friendly requests.
- Backend is not published directly to host ports; it is reachable through internal Docker networking and Nginx proxy.
- Set strong production values for `SECRET_KEY` and `POSTGRES_PASSWORD`.
- Remove/change seed admin defaults before production go-live.

Common issues:
- 502 from Nginx: check container health and network (`docker compose ps`, `docker compose logs`)
- Auth/CORS issues: verify `CORS_ORIGINS` includes public domain
- Upload failures: verify `MAX_UPLOAD_SIZE_MB` and Nginx `client_max_body_size`
- Wrong API target in browser: confirm `NEXT_PUBLIC_API_BASE_URL=/api` and rebuild frontend image

## 12. MVP Boundary

Intentionally out of scope in this MVP:
- ERP integration
- OCR / AI extraction pipelines
- cloud object storage (S3, etc.)
- microservices/event bus/message queue
- advanced workflow designer
- migration framework and complex infra orchestration

The current build is intentionally simple, deployable on a VPS, and focused on proving core document + compliance workflows end-to-end.
