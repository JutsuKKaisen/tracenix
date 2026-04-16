from datetime import datetime

from app.models.enums import NotificationType
from app.schemas.common import ORMModel


class NotificationRead(ORMModel):
    id: str
    user_id: str
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime


class NotificationReadUpdate(ORMModel):
    is_read: bool = True

