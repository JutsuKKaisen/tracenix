# MASTER_PROMPT_backend_agent.md
## Master Prompt for AI Agent
## Project: Tracenix
## Task: Plan and implement a minimal functional backend MVP

You are building the backend for **Tracenix**, a document workflow and compliance management platform.

Your job is to first **plan**, then **implement**, a minimal but working backend using **Python + FastAPI**.

You must stay within MVP scope.

---

## 1. Core Objective

Build a backend that supports the minimum required workflows for:
- authentication
- role-based access
- projects
- document upload
- document metadata
- document versions
- document workflow
- compliance checklist tracking
- notifications stored in database
- audit logs stored in database
- dashboard summary data

This backend must be deployable on a **local VPS**, storing:
- database locally
- uploaded files on the local filesystem

Do not design for large-scale cloud infrastructure.

---

## 2. Your Working Style

You must **plan before coding**.

### Step 1
Read the backend requirements carefully.

### Step 2
Produce a concise implementation plan covering:
- assumptions
- architecture
- folder structure
- modules
- data model
- API groups
- implementation order

### Step 3
After the plan, implement the backend incrementally in phases.

### Step 4
Keep your code simple, readable, and modular.

Do not generate the whole backend in one uncontrolled pass.

---

## 3. Constraints You Must Respect

### Required stack
- Python
- FastAPI

### Preferred libraries
- SQLAlchemy
- Pydantic v2
- Uvicorn
- python-multipart
- passlib or equivalent
- python-jose or equivalent

### Storage constraints
- local VPS deployment
- local database
- local file storage
- no cloud storage
- no S3
- no ERP integration

### Schema constraints
- no migrations
- no Alembic
- create schema directly from ORM metadata if needed

### Architecture constraints
- single service only
- no microservices
- no Celery unless absolutely necessary
- no Redis unless absolutely necessary
- no GraphQL
- no speculative infrastructure

---

## 4. Expected Planning Output

Before coding, provide:

### A. Assumptions
State the assumptions you are making.
If something is unclear but non-blocking, choose a practical default and continue.

### B. Architecture Summary
Explain the minimal architecture you will use.

### C. Folder Structure
Propose a clean FastAPI project structure.

### D. Data Model Summary
List the main entities and their relations.

### E. API Route Summary
List the route groups you will implement.

### F. Build Phases
Show the order in which you will implement the backend.

Do not ask unnecessary clarifying questions unless something truly blocks implementation.

---

## 5. Implementation Rules

### Build for MVP only
Implement only the required core functionality.

### Keep domain rules intact
You must enforce:
- document status transitions
- role-based action checks
- one current document version
- audit logging for critical actions

### Keep business logic out of route handlers when possible
Use service functions or service modules for workflow logic.

### Keep route files readable
Do not create giant route handlers with embedded business logic.

### Keep schemas explicit
Use request/response schemas for API clarity.

### Keep configuration simple
Use environment variables where appropriate.

---

## 6. Required Functional Areas

You must implement:

- auth
- users
- roles
- projects
- document categories
- documents
- document versions
- workflow actions
- checklist items
- notifications
- audit logs
- dashboard summary

You may keep some modules minimal, but they must exist if needed for the main workflows.

---

## 7. Required Roles

Use these roles:
- system_admin
- project_manager
- document_controller
- site_engineer
- approver
- viewer

Use simple RBAC checks in backend logic.

No advanced policy engine is required.

---

## 8. Required Document Workflow

Statuses:
- draft
- submitted
- under_review
- revision_required
- approved
- rejected
- archived

Allowed transitions:
- draft -> submitted
- submitted -> under_review
- under_review -> approved
- under_review -> rejected
- under_review -> revision_required
- revision_required -> submitted
- approved -> archived

You must validate transitions in backend logic.

Every workflow-changing action must create:
- a workflow action record
- an audit log record

When appropriate, also create a notification record.

---

## 9. Suggested Core Entities

At minimum, support these entities:
- user
- project
- document_category
- document
- document_version
- workflow_action
- checklist_item
- notification
- audit_log

You may add small helper fields if needed, but do not expand the data model unnecessarily.

---

## 10. File Handling Rules

Uploaded files must:
- be saved locally on the VPS filesystem
- have unique stored filenames
- keep original filename metadata
- store path in database
- support basic validation

Do not implement cloud adapters.

---

## 11. API Style

Use REST API.

Implement route groups for:
- auth
- users
- projects
- document categories
- documents
- checklist
- notifications
- dashboard
- audit logs

Suggested document workflow routes:
- submit
- approve
- reject
- request revision
- upload version
- list versions
- list workflow actions

---

## 12. Database Behavior

Default assumption:
- PostgreSQL local on VPS

Fallback:
- SQLite

No migrations are required.
Schema creation at startup is acceptable.

---

## 13. Implementation Sequence You Should Follow

### Phase 1
- bootstrap app
- config
- db session
- models
- schema creation
- auth
- JWT
- RBAC helpers

### Phase 2
- users
- projects
- document categories
- documents
- document versions
- file upload handling

### Phase 3
- workflow actions
- submit / approve / reject / revision logic

### Phase 4
- checklist items
- notifications
- dashboard summary
- audit logs

### Phase 5
- validation cleanup
- demo seed data
- basic run instructions
- final review of core flows

---

## 14. Output Expectations During Coding

While implementing, you should:
- explain what phase you are working on
- keep changes logically grouped
- preserve consistency in naming
- avoid dead code and placeholders where possible
- produce runnable code, not only pseudocode

---

## 15. What You Must Avoid

Do not:
- over-engineer
- add unsupported integrations
- add migrations
- add unrelated features
- add heavy infrastructure
- turn the MVP into a large enterprise platform
- drift outside the backend requirements file

If you are uncertain, choose the simpler solution.

---

## 16. Final Success Criteria

Your implementation is successful if:
- the app runs
- auth works
- role-based protection works
- project management works
- document upload works
- versioning works
- workflow transitions work
- approval/revision/rejection flows work
- checklist tracking works
- dashboard summary works
- notifications are stored
- audit logs are stored
- files are saved locally
- the frontend can integrate with the backend for the main flows

---

## 17. Execution Priority

Your highest priorities are:
1. working workflows
2. clean structure
3. correct business rules
4. practical API design
5. low complexity

When trade-offs appear, prefer:
- clarity over cleverness
- maintainability over abstraction
- functionality over unnecessary polish

Now begin by producing:
1. assumptions
2. architecture summary
3. folder structure
4. data model summary
5. route summary
6. phased implementation plan

Only after that should you start implementation.
