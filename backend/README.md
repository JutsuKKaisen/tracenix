# Tracenix Backend (MVP)

Minimal FastAPI backend for Tracenix MVP scope:
- auth + JWT
- RBAC
- users, projects, document categories
- documents + local file versioning
- workflow transitions (submit, start review, approve, reject, request revision)
- checklist items
- notifications (database only)
- audit logs (database only)
- dashboard summary metrics

## 1) Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

## 2) Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger docs:
- [http://localhost:8000/docs](http://localhost:8000/docs)

Health:
- [http://localhost:8000/health](http://localhost:8000/health)

## 3) Database

- Default: `sqlite:///./tracenix.db`
- You can switch to local PostgreSQL by setting `DATABASE_URL`.
- No Alembic/migrations are used; tables are created from ORM metadata at startup.

## 4) Storage

Uploaded files are stored on local filesystem under:
- `UPLOAD_ROOT/projects/{project_id}/documents/{document_id}/`

## 5) Seeded admin

At startup, a default admin is seeded if missing:
- Email: value from `SEED_ADMIN_EMAIL` (default `admin@tracenix.com`)
- Password: value from `SEED_ADMIN_PASSWORD` (default `admin12345`)

## 6) Workflow transitions

Enforced transitions:
- `draft -> submitted`
- `submitted -> under_review`
- `under_review -> approved`
- `under_review -> rejected`
- `under_review -> revision_required`
- `revision_required -> submitted`
- `approved -> archived`

Endpoints:
- `POST /documents/{id}/submit`
- `POST /documents/{id}/review`
- `POST /documents/{id}/start-review` (alias)
- `POST /documents/{id}/approve`
- `POST /documents/{id}/reject`
- `POST /documents/{id}/request-revision`
- `POST /documents/{id}/archive`
- `GET /documents/{id}/versions/{version_id}/download`

Every workflow transition:
- validates transition rule
- updates document status
- creates workflow action
- creates audit log
- creates relevant notifications

## 7) Route groups

- `/auth`
- `/users`
- `/projects`
- `/document-categories`
- `/documents`
- `/checklist-items`
- `/notifications`
- `/dashboard`
- `/audit-logs`
