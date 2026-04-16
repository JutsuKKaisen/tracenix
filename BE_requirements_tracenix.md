# BE_requirements.md
## Tracenix Backend Requirements
### Scope: Minimal Functional MVP
### Stack: Python + FastAPI
### Deployment: Local VPS only

## 1. Objective

Build a minimal but working backend for **Tracenix** that supports the core workflows of:
- project management
- document management
- document versioning
- document approval workflow
- compliance checklist tracking
- basic notifications
- basic audit logging
- dashboard summary data

The backend must be simple, modular, and practical. It does **not** need enterprise-scale infrastructure.

This MVP is intended to be:
- functional
- easy to run on a local VPS
- easy to extend later
- sufficient for frontend integration
- strong enough to validate the main product workflows

---

## 2. Planning-First Requirement

The AI Agent must **plan before coding**.

Before implementation, the agent must produce:
1. a short architecture overview
2. a proposed folder structure
3. a data model summary
4. an API group summary
5. a phase-by-phase build plan
6. explicit assumptions

The agent must not generate the full backend blindly in one pass.

The expected working sequence is:
1. define assumptions
2. define models and schemas
3. define API routes
4. implement auth and RBAC
5. implement core document logic
6. implement workflow logic
7. implement checklist and dashboard
8. verify end-to-end behavior

---

## 3. Technical Constraints

### Required backend stack
- Python
- FastAPI

### Recommended supporting libraries
- SQLAlchemy
- Pydantic v2
- Uvicorn
- python-multipart
- passlib or equivalent for password hashing
- python-jose or equivalent for JWT

### Database
- Primary assumption: **PostgreSQL running locally on the VPS**
- Acceptable fallback: **SQLite**
- The design should allow either database with minimal changes

### File storage
- Store uploaded files directly on the **local VPS filesystem**
- No cloud storage
- No S3
- No external managed file storage

### Schema management
- Do **not** add migrations
- Do **not** set up Alembic
- Database tables may be created directly by ORM metadata at app startup

### Infrastructure
- Single backend service only
- No microservices
- No distributed workers unless absolutely necessary
- No ERP integration
- No external email infrastructure required

---

## 4. Product Scope

### In scope
- authentication
- user roles
- user management
- project management
- document categories
- document creation and update
- file upload
- document versions
- workflow transitions
- approval / rejection / revision request
- checklist items
- dashboard summary data
- notifications stored in database
- audit logs stored in database

### Out of scope
- ERP integration
- OCR
- AI extraction
- cloud storage
- advanced reporting
- external email delivery
- workflow builder
- BPM engine
- migration framework
- event bus
- message queue
- mobile-specific backend
- complex multi-tenant enterprise logic

---

## 5. Engineering Standard

This backend should be built as a **minimal functional MVP**.

That means:
- working core flows matter more than advanced architecture
- code should be readable and modular
- route design should be clean
- validation should exist for critical actions
- RBAC should be simple but enforced
- audit logging should exist for key actions
- avoid unnecessary abstraction

The backend does **not** need:
- advanced DDD patterns
- enterprise-scale observability
- complex background job orchestration
- excessive generic abstractions

---

## 6. Core Modules

The backend should be split into these modules:

- auth
- users
- roles / access control
- projects
- document_categories
- documents
- document_versions
- workflow_actions
- checklist_items
- notifications
- audit_logs
- dashboard

Keep modules minimal and focused.

---

## 7. User Roles

Use the following roles by default:

- `system_admin`
- `project_manager`
- `document_controller`
- `site_engineer`
- `approver`
- `viewer`

### Role expectations

#### system_admin
- full system access
- create and manage users
- create and manage projects
- manage categories
- view all records

#### project_manager
- view project-level data
- assign work
- monitor dashboard
- oversee checklist and workflow visibility

#### document_controller
- upload documents
- edit metadata
- submit documents
- track document completeness
- manage document records

#### site_engineer
- upload field documents
- submit documents
- view assigned items

#### approver
- review submitted documents
- approve
- reject
- request revision

#### viewer
- read-only access to allowed data

RBAC should be straightforward and implemented in code, not through a complex policy system.

---

## 8. Core Entities

### user
Fields:
- id
- full_name
- email
- hashed_password
- role
- is_active
- created_at

### project
Fields:
- id
- code
- name
- description
- status
- start_date
- end_date
- created_at
- updated_at

### document_category
Fields:
- id
- name
- code
- description
- is_active

### document
Fields:
- id
- project_id
- category_id
- title
- document_code
- description
- current_status
- current_version_id
- assignee_user_id
- created_by
- created_at
- updated_at

### document_version
Fields:
- id
- document_id
- version_number
- file_path
- file_name
- mime_type
- file_size
- uploaded_by
- uploaded_at
- change_note
- is_current

### workflow_action
Fields:
- id
- document_id
- from_status
- to_status
- action_type
- actor_user_id
- comment
- created_at

### checklist_item
Fields:
- id
- project_id
- category_id
- title
- description
- required
- due_date
- status
- related_document_id
- owner_user_id
- created_at
- updated_at

### notification
Fields:
- id
- user_id
- title
- message
- type
- is_read
- created_at

### audit_log
Fields:
- id
- actor_user_id
- entity_type
- entity_id
- action
- metadata_json
- created_at

---

## 9. Document Status Workflow

### Document statuses
- `draft`
- `submitted`
- `under_review`
- `revision_required`
- `approved`
- `rejected`
- `archived`

### Allowed transitions
- draft -> submitted
- submitted -> under_review
- under_review -> approved
- under_review -> rejected
- under_review -> revision_required
- revision_required -> submitted
- approved -> archived

### Mandatory backend behavior
Every status-changing action must:
- validate the transition
- update the document status
- record a workflow_action
- record an audit_log
- optionally create notifications for relevant users

---

## 10. Checklist Status Model

Suggested checklist statuses:
- `pending`
- `in_progress`
- `completed`
- `overdue`
- `waived`

Checklist logic should remain simple and practical for MVP.

---

## 11. Business Rules

The backend must enforce these rules:

- each document belongs to exactly one project
- each document belongs to one category
- a document may have multiple versions
- only one document_version can be current
- uploading a new version creates a new record
- current_version_id should always point to the active version
- workflow transitions must be validated in backend logic
- approval and rejection must be tied to actor and timestamp
- checklist items may optionally link to a document
- critical actions must be auditable
- role checks must be enforced on protected routes

---

## 12. API Style

Use **REST API**.

Keep endpoints explicit and practical.

### Auth
- `POST /auth/login`
- `GET /auth/me`

### Users
- `GET /users`
- `POST /users`
- `PATCH /users/{id}`

### Projects
- `GET /projects`
- `POST /projects`
- `GET /projects/{id}`
- `PATCH /projects/{id}`

### Document Categories
- `GET /document-categories`
- `POST /document-categories`

### Documents
- `GET /documents`
- `POST /documents`
- `GET /documents/{id}`
- `PATCH /documents/{id}`
- `POST /documents/{id}/submit`
- `POST /documents/{id}/approve`
- `POST /documents/{id}/reject`
- `POST /documents/{id}/request-revision`
- `POST /documents/{id}/versions`
- `GET /documents/{id}/versions`
- `GET /documents/{id}/workflow-actions`

### Checklist
- `GET /checklist-items`
- `POST /checklist-items`
- `PATCH /checklist-items/{id}`

### Notifications
- `GET /notifications`
- `PATCH /notifications/{id}/read`

### Dashboard
- `GET /dashboard/summary`

### Audit Logs
- `GET /audit-logs`

The agent may refine naming slightly, but the structure should remain recognizable.

---

## 13. File Storage Rules

Uploaded files must be stored on the local filesystem.

### Requirements
- use a configurable upload root directory
- generate unique stored filenames
- store original filename in database
- store file path in database
- support basic content type validation
- support basic file size validation

### Suggested storage structure
Example:
- `/data/uploads/projects/{project_id}/documents/{document_id}/`

The exact structure can be adjusted if it remains clean and predictable.

---

## 14. Authentication and Access Control

Use JWT-based authentication.

### Minimum requirements
- login with email and password
- password hashing
- bearer token authentication
- protected routes
- role checks for actions

### Not required
- OAuth
- SSO
- external identity providers
- advanced permission matrix
- refresh token complexity unless the agent thinks it is necessary

Keep the auth model simple and practical.

---

## 15. Dashboard Summary Requirements

Provide minimal summary data for the frontend dashboard.

Suggested response contents:
- total documents
- documents by status
- total checklist items
- overdue checklist count
- approved documents count
- revision required count
- pending review count

This should be computed from current database state.

---

## 16. Notifications Requirements

Notifications can remain basic.

Store notifications in the database only.

Examples:
- document submitted
- revision requested
- document approved
- document rejected
- checklist overdue

No email sending is required.

---

## 17. Audit Logging Requirements

Audit logs are required for key system actions.

At minimum, log:
- login
- user creation
- project creation
- document creation
- document update
- new version upload
- document submission
- approval
- rejection
- revision request
- checklist item creation
- checklist item update

Use simple database-based audit logging.  
Do not build a full event sourcing system.

---

## 18. Suggested Project Structure

The agent should propose a clean FastAPI structure. A practical example:

- `app/main.py`
- `app/core/`
- `app/db/`
- `app/models/`
- `app/schemas/`
- `app/api/`
- `app/services/`
- `app/utils/`

Possible additional subfolders:
- `app/api/routes/`
- `app/core/security.py`
- `app/core/config.py`
- `app/db/session.py`
- `app/services/documents.py`

Keep the structure simple and readable.

---

## 19. Implementation Order

The agent should implement in this sequence:

### Phase 1: Foundation
- app bootstrap
- config
- database connection
- ORM models
- schema creation
- auth
- JWT
- basic RBAC

### Phase 2: Core business data
- users
- projects
- document categories
- documents
- file uploads
- document versions

### Phase 3: Workflow logic
- submit
- under review handling
- approve
- reject
- request revision
- workflow history

### Phase 4: Compliance and visibility
- checklist items
- dashboard summary
- notifications
- audit logs

### Phase 5: Finalization
- validation cleanup
- error handling
- demo seed data
- basic README/run instructions

---

## 20. Code Quality Expectations

The code should be:
- modular
- readable
- not over-abstracted
- easy to extend later
- organized by responsibilities

The agent should separate:
- routers
- services
- ORM models
- request/response schemas
- security utilities
- database setup

Avoid giant route files and duplicated business logic.

---

## 21. What Must Not Be Added

Do not add:
- ERP integration
- cloud storage
- migrations
- Docker-only mandatory setup
- Celery
- Redis unless truly necessary
- GraphQL
- BPM/workflow engine
- multi-service architecture
- speculative enterprise features
- advanced infra complexity

Stay within the MVP boundary.

---

## 22. Definition of Done

The backend is considered done when:

- the FastAPI app runs locally
- database tables can be created without migrations
- authentication works
- role protection works
- users can create projects
- users can upload documents
- users can upload new document versions
- workflow transitions work correctly
- approval / rejection / revision flows work
- checklist items can be created and updated
- dashboard summary returns meaningful data
- notifications are stored in the database
- audit logs are recorded for core actions
- uploaded files are stored locally on the VPS
- the main workflows run end-to-end for frontend integration

---

## 23. Final Agent Guidance

The AI Agent must behave like an engineer building a **usable first backend**, not like an architect building a large enterprise platform.

The priorities are:
- working core workflows
- clear planning
- minimal complexity
- practical API design
- future extensibility without overbuilding

When in doubt:
- choose the simpler implementation
- keep the code modular
- protect core business rules
- avoid adding features outside the defined MVP
