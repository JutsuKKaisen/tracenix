from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.checklist_item import ChecklistItem
from app.models.document import Document
from app.models.document_category import DocumentCategory
from app.models.enums import ChecklistStatus, NotificationType
from app.models.project import Project
from app.schemas.checklist_item import ChecklistItemCreate, ChecklistItemUpdate
from app.services.audit_service import create_audit_log
from app.services.notification_service import notify_users


def list_checklist_items(
    db: Session,
    project_id: str | None = None,
    status_filter: ChecklistStatus | None = None,
) -> list[ChecklistItem]:
    stmt = select(ChecklistItem).order_by(ChecklistItem.updated_at.desc())
    if project_id:
        stmt = stmt.where(ChecklistItem.project_id == project_id)
    if status_filter:
        stmt = stmt.where(ChecklistItem.status == status_filter)
    return db.scalars(stmt).all()


def _validate_checklist_references(
    db: Session,
    project_id: str | None = None,
    category_id: str | None = None,
    related_document_id: str | None = None,
) -> None:
    if project_id and not db.get(Project, project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    if category_id and not db.get(DocumentCategory, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document category not found.")
    if related_document_id and not db.get(Document, related_document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Related document not found.")


def get_checklist_item(db: Session, checklist_id: str) -> ChecklistItem:
    checklist_item = db.get(ChecklistItem, checklist_id)
    if not checklist_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found.")
    return checklist_item


def create_checklist_item(db: Session, payload: ChecklistItemCreate, actor_user_id: str) -> ChecklistItem:
    _validate_checklist_references(
        db=db,
        project_id=payload.project_id,
        category_id=payload.category_id,
        related_document_id=payload.related_document_id,
    )

    checklist_item = ChecklistItem(**payload.model_dump())
    db.add(checklist_item)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="checklist_item",
        entity_id=checklist_item.id,
        action="checklist_item_create",
        metadata_json={"title": checklist_item.title, "status": checklist_item.status.value},
    )

    if checklist_item.status == ChecklistStatus.OVERDUE and checklist_item.owner_user_id:
        notify_users(
            db=db,
            user_ids=[checklist_item.owner_user_id],
            title="Checklist Item Overdue",
            message=f"Checklist item '{checklist_item.title}' is overdue.",
            notification_type=NotificationType.WARNING,
            exclude_user_id=actor_user_id,
        )

    db.commit()
    db.refresh(checklist_item)
    return checklist_item


def update_checklist_item(
    db: Session,
    checklist_id: str,
    payload: ChecklistItemUpdate,
    actor_user_id: str,
) -> ChecklistItem:
    checklist_item = get_checklist_item(db, checklist_id)
    updates = payload.model_dump(exclude_unset=True)

    _validate_checklist_references(
        db=db,
        category_id=updates.get("category_id"),
        related_document_id=updates.get("related_document_id"),
    )

    for field, value in updates.items():
        setattr(checklist_item, field, value)

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="checklist_item",
        entity_id=checklist_item.id,
        action="checklist_item_update",
        metadata_json={"updated_fields": list(updates.keys())},
    )

    if checklist_item.status == ChecklistStatus.OVERDUE and checklist_item.owner_user_id:
        notify_users(
            db=db,
            user_ids=[checklist_item.owner_user_id],
            title="Checklist Item Overdue",
            message=f"Checklist item '{checklist_item.title}' is overdue.",
            notification_type=NotificationType.WARNING,
            exclude_user_id=actor_user_id,
        )

    db.commit()
    db.refresh(checklist_item)
    return checklist_item

