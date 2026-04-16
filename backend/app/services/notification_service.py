from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import NotificationType, UserRole
from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
    )
    db.add(notification)
    db.flush()
    return notification


def notify_users(
    db: Session,
    user_ids: list[str | None],
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    exclude_user_id: str | None = None,
) -> None:
    recipients = {user_id for user_id in user_ids if user_id}
    if exclude_user_id:
        recipients.discard(exclude_user_id)
    for recipient_id in recipients:
        create_notification(
            db=db,
            user_id=recipient_id,
            title=title,
            message=message,
            notification_type=notification_type,
        )


def notify_roles(
    db: Session,
    roles: list[UserRole],
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.INFO,
    exclude_user_id: str | None = None,
) -> None:
    users = db.scalars(select(User).where(User.role.in_(roles), User.is_active.is_(True))).all()
    notify_users(
        db=db,
        user_ids=[user.id for user in users],
        title=title,
        message=message,
        notification_type=notification_type,
        exclude_user_id=exclude_user_id,
    )

