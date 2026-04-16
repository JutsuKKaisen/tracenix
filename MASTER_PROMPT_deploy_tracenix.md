# MASTER_PROMPT_deploy_tracenix.md
## Tracenix Deployment + Docker + Domain + Landing Page Master Prompt

You are the lead DevOps + full-stack deployment agent for the project **Tracenix**.

Your task is to prepare, wire, and deploy the project using Docker, with the following production target:

- Primary app domain: **tracenix.digitalizelabs.com**
- Landing page route: **tracenix.digitalizelabs.com/landingpage**
- Main application and landing page must be served under the same domain
- Deployment target is a VPS controlled by the project owner
- The system must be production-minded but still suitable for an MVP

You must use the markdown files in the repository as the source of truth.

==================================================
PRIMARY SOURCE OF TRUTH
==================================================

Before doing anything else, read these files if they exist in the repo:

1. context_tracenix.md
2. FE_requirements_tracenix.md
3. BE_requirements_tracenix.md
4. MASTER_PROMPT_backend_agent_tracenix.md
5. LANDINGPAGE_CONTENT_tracenix.md

Use them as the canonical requirements for:
- product scope
- backend scope
- frontend scope
- Docker deployment behavior
- landing page content
- domain routing
- MVP boundaries

If there is any conflict:
- product/business logic comes from context_tracenix.md and BE_requirements_tracenix.md
- UI behavior comes from FE_requirements_tracenix.md
- landing page copy and messaging comes from LANDINGPAGE_CONTENT_tracenix.md

Do not invent features outside the MVP.

==================================================
MISSION
==================================================

Your mission is to make the project deployable and runnable via Docker on a VPS, with:

- frontend reachable at: https://tracenix.digitalizelabs.com
- landing page reachable at: https://tracenix.digitalizelabs.com/landingpage
- backend and database connected correctly
- file uploads persisted correctly
- reverse proxy configured correctly
- HTTPS support prepared
- production environment variables organized
- the end-to-end data flow working for the core MVP
- the landing page integrated into the same deployed web surface

==================================================
DEPLOYMENT TARGET
==================================================

Assume:
- the user already owns the domain **digitalizelabs.com**
- a subdomain **tracenix.digitalizelabs.com** will be pointed to the VPS
- DNS A record or equivalent can be configured to the VPS public IP
- the agent is responsible for app-side deployment setup, not external registrar management

You must explain clearly what DNS record is required:
- subdomain: tracenix.digitalizelabs.com
- record type: A
- value: VPS public IP

If HTTPS is configured through a reverse proxy, document the required conditions.

==================================================
DEPLOYMENT ARCHITECTURE
==================================================

Use a simple but solid Docker-based architecture.

Recommended services:
- frontend
- backend
- database
- reverse proxy
- optional persistent file volume

Preferred stack assumptions:
- frontend: Next.js
- backend: FastAPI
- database: PostgreSQL preferred, SQLite fallback only if necessary
- reverse proxy: Nginx or Traefik
- persistent uploads: mounted Docker volume or host bind mount

The architecture should support:

Client
-> Reverse Proxy
-> Frontend
-> Backend API
-> Database
-> Local Upload Storage

==================================================
WORKING MODE
==================================================

You must PLAN FIRST before changing code.

Do not blindly generate all configs in one pass.

At the start, produce:

1. assumptions
2. current repository assessment
3. proposed Docker architecture
4. routing plan
5. environment variable plan
6. persistent storage plan
7. deployment phase plan

Then implement.

==================================================
DOCKER REQUIREMENTS
==================================================

You must prepare the project to run via Docker.

Expected deliverables may include:
- Dockerfile for frontend
- Dockerfile for backend
- docker-compose.yml
- .env.example
- reverse proxy config
- production environment notes
- volume mapping for uploads and database persistence if applicable

The Docker setup must:
- separate services cleanly
- support local development and VPS deployment reasonably
- avoid unnecessary complexity
- keep persistent data safe across container restarts

==================================================
DOMAIN AND ROUTING REQUIREMENTS
==================================================

Required routes:

### Main app
- https://tracenix.digitalizelabs.com

### Landing page
- https://tracenix.digitalizelabs.com/landingpage

Use one of these valid models:

#### Preferred model
- Same frontend app handles `/` and `/landingpage`
- App routes protected/unprotected appropriately
- `/landingpage` is public
- main authenticated application lives in the main app shell

#### Acceptable alternative
- Reverse proxy routes `/landingpage` to a specific frontend route or static site bundle
- main app remains on the same domain

Do not create a separate subdomain for landing page unless explicitly required.

==================================================
LANDING PAGE REQUIREMENTS
==================================================

A public landing page must exist at:

**https://tracenix.digitalizelabs.com/landingpage**

The landing page must use the core content from:
- LANDINGPAGE_CONTENT_tracenix.md

The landing page must align with the approved brand direction:
- premium
- enterprise-safe
- Industrial Premium
- Executive Control Center for structure
- may include approved brand visuals or Three.js only if already part of the project style

The landing page should clearly communicate:
- what Tracenix does
- who it is for
- why it matters
- core product capabilities
- differentiation
- CTA for demo / contact / pilot

==================================================
LANDING PAGE CONTENT RULE
==================================================

Do not invent random marketing copy.

Use the provided content file as the core.
You may refine wording for web readability, but do not distort the business message.

The content should stay aligned with these ideas:
- centralized construction document management
- compliance workflow
- audit trail and traceability
- mobile-first for field teams
- lighter than ERP but more specialized than generic DMS
- target customers are growing contractors, small construction startups, and compliance-oriented organizations
- message focus: reduce lost files, reduce approval delays, improve compliance readiness

==================================================
BACKEND / DATABASE DEPLOYMENT RULES
==================================================

The deployed backend must:
- run in Docker
- connect to the database through internal service networking
- expose API only through reverse proxy or internal network as appropriate
- persist uploaded files through a mounted volume
- use environment variables for secrets and connection strings
- remain aligned with the existing MVP scope

Database requirements:
- PostgreSQL preferred in Docker
- persistent database volume required
- do not introduce migrations if project scope says no migrations
- schema creation at startup is acceptable if already part of the project design

==================================================
REVERSE PROXY REQUIREMENTS
==================================================

You must configure a reverse proxy for:
- domain routing
- HTTPS readiness
- frontend/backend service exposure
- request forwarding

Preferred behaviors:
- frontend served on port 80/443 externally
- backend kept internal if possible
- API proxied through same public domain if needed
- static assets and landing page route served correctly
- support large enough upload body size for document uploads

If using Nginx, configure:
- server_name tracenix.digitalizelabs.com
- proxy pass rules
- client_max_body_size
- websocket compatibility if needed
- HTTPS placeholders or certificate integration notes

If using Traefik, configure routers/services/middlewares accordingly.

==================================================
ENVIRONMENT VARIABLE REQUIREMENTS
==================================================

Create a clean environment plan.

Typical variables may include:
- APP_ENV
- FRONTEND_URL
- API_BASE_URL
- DATABASE_URL
- JWT_SECRET
- UPLOAD_ROOT
- DOMAIN
- CORS_ORIGINS
- NEXT_PUBLIC_API_BASE_URL

Provide:
- .env.example
- clear documentation of which values must be changed on the VPS

Do not hardcode production secrets.

==================================================
PERSISTENCE REQUIREMENTS
==================================================

Persistent data must survive container recreation.

At minimum persist:
- uploaded files
- database data

Use Docker volumes or bind mounts clearly.

Document where files will live on the VPS.

Example acceptable layout:
- `/opt/tracenix/uploads`
- `/opt/tracenix/postgres-data`

==================================================
IMPLEMENTATION PHASES
==================================================

Implement in this order:

### Phase 1: Inspect and assess
- inspect repo structure
- identify frontend, backend, env, and current run model
- identify missing Docker assets

### Phase 2: Containerization
- add or refine Dockerfiles
- add docker-compose.yml
- wire inter-service networking

### Phase 3: Runtime configuration
- add env templates
- configure backend, frontend, and database connectivity
- configure upload persistence

### Phase 4: Reverse proxy and domain routing
- add Nginx or Traefik configuration
- support domain routing for main app and landing page
- document DNS requirements

### Phase 5: Landing page implementation
- create `/landingpage`
- integrate landing page content from content file
- ensure route is public and styled correctly

### Phase 6: End-to-end verification
- verify frontend/backend/db connections
- verify landing page route
- verify uploads and persistence
- verify app startup and route accessibility

### Phase 7: Deployment documentation
- add run instructions
- add deployment instructions
- add DNS and HTTPS notes
- add update/restart workflow

==================================================
CODING / INFRA RULES
==================================================

You must:
- keep the deployment setup simple
- keep service names clear
- keep environment config explicit
- avoid over-engineering
- use clean, readable config files
- avoid speculative cloud infrastructure
- align with MVP scope

Prefer:
- Docker Compose over orchestration platforms
- one reverse proxy
- one app domain
- clear volume mounts
- direct, understandable service wiring

Avoid:
- Kubernetes
- Terraform unless already present and required
- CI/CD overbuild
- multiple reverse proxies
- multiple public domains for the same MVP
- unnecessary infra abstraction

==================================================
VALIDATION CHECKLIST
==================================================

Before declaring completion, verify:

- frontend starts in Docker
- backend starts in Docker
- database starts in Docker
- backend connects to database
- frontend connects to backend
- uploads persist across restart
- landing page works at `/landingpage`
- domain routing config matches `tracenix.digitalizelabs.com`
- reverse proxy serves the right app routes
- environment files are documented
- deployment steps are understandable for a VPS owner

==================================================
DEFINITION OF DONE
==================================================

The task is complete when:

- the project can be run with Docker
- the service architecture is clear
- the domain target is correctly prepared for `tracenix.digitalizelabs.com`
- landing page exists at `/landingpage`
- landing page content uses the approved business core
- app and landing page can be served under one domain
- data persistence is configured
- deployment instructions are documented
- the branch is ready for testing on the VPS

==================================================
FINAL EXECUTION INSTRUCTION
==================================================

Begin by outputting:

1. assumptions
2. current repository assessment
3. proposed Docker architecture
4. routing plan
5. persistence plan
6. env var plan
7. phased deployment plan

Then start implementation.
