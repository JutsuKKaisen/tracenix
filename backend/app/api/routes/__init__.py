from fastapi import APIRouter

from app.api.routes import (
    audit_logs,
    auth,
    checklist_items,
    dashboard,
    document_categories,
    documents,
    notifications,
    projects,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(document_categories.router)
api_router.include_router(documents.router)
api_router.include_router(checklist_items.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit_logs.router)

