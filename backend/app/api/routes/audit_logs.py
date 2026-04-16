from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.rbac import require_roles
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.audit_log import AuditLogRead

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogRead])
def get_audit_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SYSTEM_ADMIN, UserRole.PROJECT_MANAGER)),
) -> list[AuditLogRead]:
    safe_limit = max(1, min(limit, 1000))
    logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(safe_limit)).all()
    return [AuditLogRead.model_validate(log) for log in logs]

