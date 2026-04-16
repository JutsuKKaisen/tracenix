# context.md
## Tracenix Project Context
## Unified Product Context for AI Agents
## Version: MVP Baseline

---

## 1. Project Identity

**Project Name:** Tracenix

**Product Type:** B2B SaaS platform for compliance, document workflow, and operational visibility

**Primary Domain:** construction-focused document control and compliance workflow for startups and SMEs

**Main Goal:** build a usable MVP that helps project teams manage documents, approvals, versions, compliance checklist items, and operational traceability in one centralized platform

---

## 2. Product Positioning

Tracenix is **not**:
- a generic cloud drive
- a full ERP
- a full construction management suite
- an AI-first document extraction platform at MVP stage

Tracenix **is**:
- a focused compliance and document workflow platform
- a practical operational control layer for project teams
- a structured system for document visibility, workflow, and auditability
- an enterprise-facing product that must feel premium, reliable, and execution-ready

---

## 3. MVP Product Objective

The MVP should prove that users can run the main workflows end-to-end:

- manage projects
- upload documents
- classify documents
- create document versions
- submit documents for review
- approve, reject, or request revision
- track checklist completeness
- view dashboard summaries
- review basic audit history
- use the product in a real project environment

The MVP does **not** need:
- ERP integration
- cloud-native architecture
- advanced AI extraction
- OCR
- complex reporting
- workflow designer
- migrations
- deep enterprise infra

---

## 4. Primary Users

Use these roles as the default role model.

### system_admin
- full access
- manage users
- manage projects
- manage categories
- view all records

### project_manager
- monitor project-level activity
- oversee workflow and checklist visibility
- assign work
- review dashboard summaries

### document_controller
- upload documents
- manage metadata
- submit documents
- track completeness and document readiness

### site_engineer
- upload field documents
- submit documents
- view assigned items

### approver
- review submitted documents
- approve
- reject
- request revision

### viewer
- read-only access

RBAC should remain simple and practical.

---

## 5. Core Functional Scope

### In scope for MVP
- authentication
- role-based access
- users
- projects
- document categories
- documents
- document versions
- workflow actions
- checklist items
- dashboard summary
- notifications stored in database
- audit logs stored in database

### Out of scope for MVP
- ERP integration
- OCR
- AI extraction
- cloud storage
- advanced analytics
- workflow builder
- BPM engine
- event bus
- message queue
- microservices
- multi-product orchestration
- advanced mobile-specific backend

---

## 6. Core Business Entities

### user
- id
- full_name
- email
- hashed_password
- role
- is_active
- created_at

### project
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
- id
- name
- code
- description
- is_active

### document
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
- id
- document_id
- from_status
- to_status
- action_type
- actor_user_id
- comment
- created_at

### checklist_item
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
- id
- user_id
- title
- message
- type
- is_read
- created_at

### audit_log
- id
- actor_user_id
- entity_type
- entity_id
- action
- metadata_json
- created_at

---

## 7. Document Workflow Model

### Document statuses
- draft
- submitted
- under_review
- revision_required
- approved
- rejected
- archived

### Allowed transitions
- draft -> submitted
- submitted -> under_review
- under_review -> approved
- under_review -> rejected
- under_review -> revision_required
- revision_required -> submitted
- approved -> archived

### Required workflow behavior
Every status-changing action must:
- validate transition rules
- update document status
- create a workflow action record
- create an audit log record
- optionally create notification records

---

## 8. Checklist Model

Suggested statuses:
- pending
- in_progress
- completed
- overdue
- waived

Checklist logic should remain simple and operationally useful.

---

## 9. Product Experience Direction

The product experience must combine:

- **Industrial Premium**
- **Executive Control Center**

This means:
- premium and engineered visual language
- clean enterprise application structure
- strong data visibility
- clear hierarchy
- restrained but memorable motion
- business-safe visual ambition

The application must not feel like a generic admin panel.

It should feel like:
- a premium enterprise command platform
- a structured operational control center
- a serious B2B SaaS product for document and compliance operations

---

## 10. Frontend Direction

### Core design model
Use:
- **Industrial Premium** for brand and visual atmosphere
- **Executive Control Center** for application usability and operational screens

### UI mode recommendation
Use a **hybrid dark-light model**:

#### Brand / immersive mode
Use for:
- login
- splash
- landing
- selected executive overview bands

Style:
- dark premium
- stronger brand presence
- Three.js globe
- more atmosphere

#### Operational mode
Use for:
- dashboards
- tables
- detail pages
- workflows
- approvals
- checklist pages

Style:
- light enterprise UI
- structured surfaces
- strong readability
- low visual noise

---

## 11. Brand and Visual Cues

The Tracenix logo suggests:
- a connected globe
- structured intelligence
- node networks
- systems thinking
- digital infrastructure

Use these cues in:
- iconography
- layout geometry
- visual motifs
- Three.js globe design
- premium brand scenes

Avoid:
- playful consumer aesthetics
- gaming visuals
- cyberpunk overload
- oversaturated neon
- decorative motion without purpose

---

## 12. Three.js Usage Rules

Three.js must be used as a **premium brand layer**, not as a gimmick.

### Required object
Create a **lightly interactive branded globe** inspired by the logo:
- node-based spherical network
- geometric and engineered
- elegant, controlled, branded
- not a literal copy of the logo
- light interaction only

### Interaction behavior
Allowed:
- ambient slow rotation
- subtle hover response
- slight pointer-follow tilt or parallax
- smooth easing
- refined node or line emphasis

Avoid:
- aggressive drag interactions
- game-like behavior
- noisy particles
- constant strong movement
- heavy render cost on work screens

### Approved scenes
Use the globe in:
- login screen
- landing or product overview page
- dashboard hero/header
- executive overview strip
- premium empty states

Do not use the globe in:
- dense tables
- forms
- CRUD-heavy screens
- workflow modals
- settings pages
- repetitive task views

---

## 13. Frontend Tech Stack

Use the following frontend stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Three.js
- React Three Fiber
- @react-three/drei
- TanStack Query
- React Hook Form
- Zod
- lucide-react
- Recharts or equivalent lightweight business charting

### Frontend principles
- reusable components
- disciplined motion
- enterprise-safe visual polish
- clear table and form usability
- no overuse of 3D or animation

---

## 14. Backend Tech Stack

Use the following backend stack:

- Python
- FastAPI
- SQLAlchemy
- Pydantic v2
- Uvicorn
- python-multipart
- passlib or equivalent
- python-jose or equivalent

### Backend storage constraints
- run on a local VPS
- store uploaded files on local filesystem
- store database locally
- no S3
- no cloud storage
- no managed infra dependency

### Database preference
- default: PostgreSQL local instance
- fallback: SQLite

### Schema rules
- no migrations
- no Alembic
- table creation directly from ORM metadata is acceptable

---

## 15. Backend API Style

Use REST API.

Suggested endpoint groups:
- auth
- users
- projects
- document-categories
- documents
- checklist-items
- notifications
- dashboard
- audit-logs

Document workflow routes should support:
- submit
- approve
- reject
- request revision
- upload version
- list versions
- list workflow actions

---

## 16. File Handling Rules

Uploaded files must:
- be stored on local filesystem
- use unique stored filenames
- preserve original filename metadata
- store file path in database
- support basic file type validation
- support basic file size validation

Suggested storage pattern:
- local upload root
- grouped by project and document

---

## 17. Suggested Frontend Information Architecture

Core sections:
- Dashboard
- Projects
- Documents
- Approvals
- Compliance Checklist
- Audit Trail / Activity
- Notifications
- Users / Access Control
- Settings

Optional strategic sections:
- Executive Overview
- Risk Summary
- Project Health

---

## 18. Key Frontend Screens

- Login / Welcome
- Dashboard
- Projects List
- Project Detail
- Documents List
- Document Detail
- Upload / New Version
- Approvals View
- Compliance Checklist
- Audit / Activity View
- Notifications
- Users / Roles
- Settings

---

## 19. Engineering Style for AI Agents

All AI agents working on this project must:
- plan before coding
- respect MVP scope
- avoid speculative features
- keep naming consistent
- keep the design premium but disciplined
- prioritize working workflows over visual excess
- choose simple architecture over premature complexity

### Preferred execution order
1. confirm assumptions
2. define structure
3. implement backend core flows
4. implement frontend shell and core screens
5. integrate frontend with backend
6. add premium visual layer and Three.js only in approved scenes
7. polish responsiveness, states, and UX details

---

## 20. Definition of Success

The project is successful at MVP stage if:
- the backend runs on a local VPS
- files are stored locally
- authentication works
- document workflows work
- versioning works
- checklist tracking works
- dashboard summary works
- audit records exist for core actions
- frontend integrates cleanly
- the product feels premium, credible, and enterprise-ready
- the visual identity is memorable without hurting usability

---

## 21. Final Project Summary

Tracenix MVP is a focused enterprise SaaS product for document control, workflow transparency, and compliance visibility.

It must combine:
- practical backend workflows
- clean frontend operations
- premium enterprise design
- restrained Three.js brand enhancement
- low-complexity implementation choices

The target outcome is a **usable, credible, high-impact MVP** that can be demonstrated, piloted, and extended later.
