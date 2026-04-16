from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    actor_user_id: str | None,
    entity_type: str,
    entity_id: str,
    action: str,
    metadata_json: dict | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        actor_user_id=actor_user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        metadata_json=metadata_json,
    )
    db.add(audit_log)
    db.flush()
    return audit_log

