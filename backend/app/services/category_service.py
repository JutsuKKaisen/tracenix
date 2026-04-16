from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_category import DocumentCategory
from app.schemas.document_category import DocumentCategoryCreate
from app.services.audit_service import create_audit_log


def list_categories(db: Session) -> list[DocumentCategory]:
    return db.scalars(select(DocumentCategory).order_by(DocumentCategory.name.asc())).all()


def get_category_or_404(db: Session, category_id: str) -> DocumentCategory:
    category = db.get(DocumentCategory, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document category not found.")
    return category


def create_category(db: Session, payload: DocumentCategoryCreate, actor_user_id: str) -> DocumentCategory:
    existing = db.scalar(select(DocumentCategory).where(DocumentCategory.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category code already exists.")

    category = DocumentCategory(**payload.model_dump())
    db.add(category)
    db.flush()

    create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        entity_type="document_category",
        entity_id=category.id,
        action="document_category_create",
        metadata_json={"code": category.code, "name": category.name},
    )
    db.commit()
    db.refresh(category)
    return category

