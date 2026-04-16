from datetime import datetime

from app.schemas.common import ORMModel


class AuditLogRead(ORMModel):
    id: str
    actor_user_id: str | None = None
    entity_type: str
    entity_id: str
    action: str
    metadata_json: dict | None = None
    created_at: datetime

